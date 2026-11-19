-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 031
-- PRIVATE SERVICE BOOKINGS + PAYMENTS - REVIEW HARDENING
-- ==============================================================================
--
-- WHY THIS MIGRATION EXISTS
--   028b / 029 / 030 were reviewed line by line AFTER being applied live.
--   The review found six real gaps (one of them directly affects money math)
--   plus one dead-end discovered while writing this migration. Because applied
--   migrations are immutable, every fix ships here as 031 - 030 is not edited.
--
-- WHAT THIS FIXES (each item maps to a review finding)
--   1. MONEY MATH (030 record_private_service_payment):
--      instructor share was computed with greatest(..., 0), which silently
--      swallowed a negative allocation and made
--      gross <> platform + instructor + fee. 023 RAISEs in that case. 031 now
--      raises AND asserts the allocation identity explicitly.
--   2. REFUND WITHOUT A REASON (030 set_private_service_payment_status):
--      REFUNDED was accepted with no written note, unlike 023/026. 031 requires
--      a reason of at least 3 characters.
--   3. VERIFYING A DEAD BOOKING (030 set_private_service_payment_status):
--      the RPC never looked at the booking, so a PENDING payment could become
--      VERIFIED after the booking was CANCELLED / NO_SHOW -> revenue landed in
--      settlements for a service that never happened. 031 blocks it in the RPC
--      AND in the table guard trigger (defense in depth).
--   4. STUDENT SELF-CANCEL OF A PAID BOOKING (029 cancel_my_private_service_booking):
--      a booking in AWAITING_PAYMENT may already carry payment_verified = true
--      (030's trigger stamps it). The student could cancel, the slot went back
--      to OPEN, and the verified revenue stayed settleable. 031 refuses
--      self-cancel once payment is verified and points the student to the office.
--   5. INSTRUCTOR PII VIA RLS (029 / 030 read policies):
--      the read policies exposed full booking/payment rows (student_email,
--      student_phone) to the instructor email branch, contradicting 029's own
--      PII-free list_instructor_private_bookings() RPC. 031 removes the
--      instructor branch from both tables; instructors keep their RPC views.
--   6. DEAD-END AFTER A REFUND (found while writing 031):
--      after a refund the booking still has payment_verified = true (030 keeps
--      it on purpose and 029's guard forbids reverting it), so
--      record_private_service_payment refused every new payment ("booking
--      already has a VERIFIED payment") and the booking could never be re-paid
--      or confirmed. 031 allows a NEW payment when the only previous verified
--      row is REFUNDED.
--   7. SECONDARY GUARDS:
--      - office_confirm_private_service_booking refuses to confirm a booking
--        whose only payment was refunded (record + verify a new payment first).
--      - office_mark_private_booking_awaiting_payment refuses a start time in
--        the past (it could previously reschedule backwards).
--      - record_private_service_payment now validates p_method with a friendly
--        message instead of leaking a raw 23514 CHECK violation.
--      - set_private_service_payment_status validates the transition list and
--        raises readable errors before touching the row.
--
-- DELIBERATE DIVERGENCES (documented, not accidental)
--   - PENDING -> VERIFIED is still allowed for private services (the academy
--     office often sees the receipt immediately and the payments desk exposes a
--     direct "Verify" action). 023's course ledger forces UNDER_REVIEW first;
--     private 1:1 services intentionally do not, since there is no queue there.
--   - A refund does NOT cancel the booking and does NOT revert payment_verified
--     (owner rule: refunds are per-case management decisions). It only blocks
--     NEW confirmation of a booking whose only payment was refunded.
--   - No price-vs-gross equality is enforced: part payments / overpayments
--     remain a business decision (price_snapshot is stored for reference).
--
-- HARD GUARANTEES
--   - Zero rows fabricated or rewritten: only functions/policies are replaced.
--   - Zero client write policies before and after.
--   - Function signatures are unchanged, so the UI keeps working untouched.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) record_private_service_payment: exact allocation math + friendly method
--    validation + allow a fresh payment after a refund.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_private_service_payment(
  p_booking_id uuid,
  p_method text,
  p_gross_amount numeric,
  p_reference text DEFAULT NULL,
  p_processing_fee numeric DEFAULT 0,
  p_verify_now boolean DEFAULT false,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.private_service_bookings;
  v_method text := lower(btrim(coalesce(p_method, '')));
  v_default_pct numeric := 20;
  v_custom_pct numeric;
  v_pct numeric;
  v_gross numeric := round(coalesce(p_gross_amount, 0), 2);
  v_fee numeric := round(coalesce(p_processing_fee, 0), 2);
  v_platform numeric(12,2);
  v_instructor numeric(12,2);
  v_status text := CASE WHEN coalesce(p_verify_now, false) THEN 'VERIFIED' ELSE 'PENDING' END;
  v_actor_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_payment_id uuid;
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can record private service payments';
  END IF;

  IF v_method NOT IN ('kashier', 'cash', 'instapay', 'vodafone_cash', 'other') THEN
    RAISE EXCEPTION 'invalid payment method: % (allowed: kashier, cash, instapay, vodafone_cash, other)', p_method;
  END IF;

  IF v_gross <= 0 THEN
    RAISE EXCEPTION 'payment: gross_amount must be greater than zero';
  END IF;

  IF v_gross > 9999999999.99 THEN
    RAISE EXCEPTION 'payment: gross_amount is out of range';
  END IF;

  IF v_fee < 0 THEN
    RAISE EXCEPTION 'payment: processing_fee cannot be negative';
  END IF;

  IF v_fee > v_gross THEN
    RAISE EXCEPTION 'payment: processing_fee (%) cannot exceed gross_amount (%)', v_fee, v_gross;
  END IF;

  SELECT * INTO v_booking
  FROM public.private_service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking not found';
  END IF;

  IF v_booking.status IN ('CANCELLED', 'NO_SHOW') THEN
    RAISE EXCEPTION 'payment: cannot record payment for a % booking', v_booking.status;
  END IF;

  -- A live VERIFIED row always blocks a new payment. A booking flagged
  -- payment_verified also blocks it UNLESS its verified money was refunded
  -- (otherwise a refund would dead-end the booking forever - see 031 header 6).
  IF EXISTS (
    SELECT 1 FROM public.private_service_payments
    WHERE booking_id = p_booking_id AND status = 'VERIFIED'
  ) THEN
    RAISE EXCEPTION 'payment: booking already has a VERIFIED payment';
  END IF;

  IF v_booking.payment_verified AND NOT EXISTS (
    SELECT 1 FROM public.private_service_payments
    WHERE booking_id = p_booking_id AND status = 'REFUNDED'
  ) THEN
    RAISE EXCEPTION 'payment: booking already has a verified payment';
  END IF;

  SELECT COALESCE(NULLIF(value, '')::numeric, 20) INTO v_default_pct
  FROM public.platform_settings WHERE key = 'default_platform_commission_pct';

  SELECT p.platform_commission_pct INTO v_custom_pct
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE lower(trim(u.email)) = lower(trim(v_booking.instructor_email));

  v_pct := COALESCE(v_custom_pct, v_default_pct);

  IF v_pct IS NULL OR v_pct < 0 OR v_pct > 100 THEN
    RAISE EXCEPTION 'payment: platform commission pct out of range: %', v_pct;
  END IF;

  v_platform := round((v_gross * v_pct) / 100.0, 2);
  v_instructor := round(v_gross - v_platform - v_fee, 2);

  IF v_instructor < 0 THEN
    RAISE EXCEPTION 'allocation math invalid: instructor share went negative (gross %, commission %, fee %)',
      v_gross, v_pct, v_fee;
  END IF;

  IF round(v_platform + v_instructor + v_fee, 2) <> v_gross THEN
    RAISE EXCEPTION 'allocation math invalid: gross % <> platform % + instructor % + fee %',
      v_gross, v_platform, v_instructor, v_fee;
  END IF;

  INSERT INTO public.private_service_payments (
    booking_id, service_id,
    student_id, student_email, instructor_email,
    method, gross_amount, currency, status,
    reference, collected_at,
    price_snapshot, platform_commission_pct, platform_amount, processing_fee, instructor_amount,
    verified_by, verified_by_email, verified_at,
    created_by, created_by_email, note
  ) VALUES (
    v_booking.id, v_booking.service_id,
    v_booking.student_id, v_booking.student_email, v_booking.instructor_email,
    v_method, v_gross, v_booking.currency, v_status,
    nullif(btrim(coalesce(p_reference, '')), ''), now(),
    v_booking.price_snapshot, v_pct, v_platform, v_fee, v_instructor,
    CASE WHEN v_status = 'VERIFIED' THEN auth.uid() ELSE NULL END,
    CASE WHEN v_status = 'VERIFIED' THEN v_actor_email ELSE NULL END,
    CASE WHEN v_status = 'VERIFIED' THEN now() ELSE NULL END,
    auth.uid(), v_actor_email, nullif(btrim(coalesce(p_note, '')), '')
  )
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_private_service_payment(uuid, text, numeric, text, numeric, boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.record_private_service_payment(uuid, text, numeric, text, numeric, boolean, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2) set_private_service_payment_status: explicit transitions, mandatory refund
--    reason, no verification on a cancelled / no-show booking, and a lock order
--    (booking then payment) that matches office_verify_private_booking_payment.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_private_service_payment_status(
  p_payment_id uuid,
  p_new_status text,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.private_service_payments;
  v_booking public.private_service_bookings;
  v_target text := upper(btrim(coalesce(p_new_status, '')));
  v_note text := btrim(coalesce(p_note, ''));
  v_actor_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_booking_id uuid;
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can update private service payment status';
  END IF;

  IF v_target NOT IN ('UNDER_REVIEW', 'VERIFIED', 'FAILED', 'CANCELLED', 'REFUNDED') THEN
    RAISE EXCEPTION 'invalid status: %', p_new_status;
  END IF;

  -- booking_id is immutable, so this unlocked read is safe and lets us take the
  -- booking lock BEFORE the payment lock (same order as the verify RPC).
  SELECT booking_id INTO v_booking_id
  FROM public.private_service_payments
  WHERE id = p_payment_id;

  IF v_booking_id IS NULL THEN
    RAISE EXCEPTION 'private service payment not found';
  END IF;

  SELECT * INTO v_booking
  FROM public.private_service_bookings
  WHERE id = v_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'private service payment booking not found';
  END IF;

  SELECT * INTO v_row
  FROM public.private_service_payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'private service payment not found';
  END IF;

  -- PENDING -> VERIFIED stays legal on purpose (see header: no review queue for
  -- 1:1 services and the payments desk exposes a direct Verify action).
  IF NOT (
       (v_row.status = 'PENDING'       AND v_target IN ('UNDER_REVIEW', 'VERIFIED', 'FAILED', 'CANCELLED'))
    OR (v_row.status = 'UNDER_REVIEW'  AND v_target IN ('VERIFIED', 'FAILED', 'CANCELLED'))
    OR (v_row.status = 'VERIFIED'      AND v_target = 'REFUNDED')
  ) THEN
    RAISE EXCEPTION 'illegal private service payment transition % -> %', v_row.status, v_target;
  END IF;

  IF v_target = 'VERIFIED' AND v_booking.status IN ('CANCELLED', 'NO_SHOW') THEN
    RAISE EXCEPTION 'cannot verify a payment for a % booking', v_booking.status;
  END IF;

  IF v_target = 'REFUNDED' THEN
    IF char_length(v_note) < 3 THEN
      RAISE EXCEPTION 'a refund requires a written reason (note)';
    END IF;

    IF v_row.settlement_id IS NOT NULL THEN
      RAISE EXCEPTION 'cannot refund a payment linked to a settlement - cancel the settlement first';
    END IF;
  END IF;

  UPDATE public.private_service_payments
  SET status = v_target,
      verified_by = CASE WHEN v_target = 'VERIFIED' THEN auth.uid() ELSE verified_by END,
      verified_by_email = CASE WHEN v_target = 'VERIFIED' THEN v_actor_email ELSE verified_by_email END,
      verified_at = CASE WHEN v_target = 'VERIFIED' THEN now() ELSE verified_at END,
      note = coalesce(nullif(v_note, ''), note)
  WHERE id = p_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_private_service_payment_status(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_private_service_payment_status(uuid, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3) trg_private_service_payments_guard: add the booking-state check for
--    VERIFIED and the written-reason check for REFUNDED (defense in depth, so
--    any future writer - including a definer RPC - cannot bypass them).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_private_service_payments_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'private_service_payments: history is immutable - DELETE is forbidden';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.student_email := lower(btrim(NEW.student_email));
    NEW.instructor_email := lower(btrim(NEW.instructor_email));
    NEW.currency := upper(btrim(NEW.currency));
    NEW.created_at := now();
    NEW.updated_at := now();

    IF NEW.status = 'VERIFIED' AND (NEW.verified_by IS NULL OR NEW.verified_at IS NULL) THEN
      RAISE EXCEPTION 'private_service_payments: VERIFIED status requires verified_by and verified_at';
    END IF;

    IF NEW.status = 'VERIFIED' AND EXISTS (
      SELECT 1 FROM public.private_service_bookings b
      WHERE b.id = NEW.booking_id
        AND b.status IN ('CANCELLED', 'NO_SHOW')
    ) THEN
      RAISE EXCEPTION 'private_service_payments: cannot verify a payment for a cancelled or no-show booking';
    END IF;

    RETURN NEW;
  END IF;

  -- ---------------- UPDATE ----------------
  IF NEW.booking_id IS DISTINCT FROM OLD.booking_id
     OR NEW.service_id IS DISTINCT FROM OLD.service_id
     OR NEW.student_id IS DISTINCT FROM OLD.student_id
     OR NEW.student_email IS DISTINCT FROM OLD.student_email
     OR NEW.instructor_email IS DISTINCT FROM OLD.instructor_email
     OR NEW.method IS DISTINCT FROM OLD.method
     OR NEW.gross_amount IS DISTINCT FROM OLD.gross_amount
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.price_snapshot IS DISTINCT FROM OLD.price_snapshot
     OR NEW.platform_commission_pct IS DISTINCT FROM OLD.platform_commission_pct
     OR NEW.platform_amount IS DISTINCT FROM OLD.platform_amount
     OR NEW.processing_fee IS DISTINCT FROM OLD.processing_fee
     OR NEW.instructor_amount IS DISTINCT FROM OLD.instructor_amount
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'private_service_payments: entity and monetary snapshot columns are immutable';
  END IF;

  IF NEW.settlement_id IS DISTINCT FROM OLD.settlement_id THEN
    IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
      RAISE EXCEPTION 'private_service_payments: only the academy office can link a private service payment to a settlement';
    END IF;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('FAILED', 'CANCELLED', 'REFUNDED') THEN
      RAISE EXCEPTION 'private_service_payments: terminal status % cannot be changed', OLD.status;
    END IF;

    IF NOT (
      (OLD.status = 'PENDING' AND NEW.status IN ('UNDER_REVIEW', 'VERIFIED', 'FAILED', 'CANCELLED'))
      OR (OLD.status = 'UNDER_REVIEW' AND NEW.status IN ('VERIFIED', 'FAILED', 'CANCELLED'))
      OR (OLD.status = 'VERIFIED' AND NEW.status = 'REFUNDED')
    ) THEN
      RAISE EXCEPTION 'private_service_payments: illegal status transition % -> %', OLD.status, NEW.status;
    END IF;

    IF NEW.status = 'VERIFIED' AND (NEW.verified_by IS NULL OR NEW.verified_at IS NULL) THEN
      RAISE EXCEPTION 'private_service_payments: VERIFIED status requires verified_by and verified_at';
    END IF;

    IF NEW.status = 'VERIFIED' AND EXISTS (
      SELECT 1 FROM public.private_service_bookings b
      WHERE b.id = NEW.booking_id
        AND b.status IN ('CANCELLED', 'NO_SHOW')
    ) THEN
      RAISE EXCEPTION 'private_service_payments: cannot verify a payment for a cancelled or no-show booking';
    END IF;

    IF NEW.status = 'REFUNDED' AND (NEW.note IS NULL OR btrim(NEW.note) = '') THEN
      RAISE EXCEPTION 'private_service_payments: a refund requires a written reason (note)';
    END IF;

    IF NEW.status = 'REFUNDED' AND OLD.settlement_id IS NOT NULL THEN
      RAISE EXCEPTION 'private_service_payments: cannot refund a payment linked to a settlement - cancel the settlement first';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_private_service_payments_guard ON public.private_service_payments;
CREATE TRIGGER trg_private_service_payments_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.private_service_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_private_service_payments_guard();

-- ------------------------------------------------------------------------------
-- 4) cancel_my_private_service_booking: a student can no longer self-cancel a
--    booking whose payment is already verified (money is settleable).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_my_private_service_booking(
  p_booking_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  v_row public.private_service_bookings;
BEGIN
  IF v_uid IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'forbidden: authentication is required';
  END IF;

  IF char_length(btrim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION 'cancel booking: please provide a brief reason (at least 3 characters)';
  END IF;

  SELECT * INTO v_row
  FROM public.private_service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking not found';
  END IF;

  IF v_row.student_id <> v_uid AND lower(btrim(v_row.student_email)) <> v_email THEN
    RAISE EXCEPTION 'forbidden: this booking belongs to another student';
  END IF;

  IF v_row.payment_verified THEN
    RAISE EXCEPTION 'cancel booking: the payment for this booking is already verified - contact the academy office to cancel or refund';
  END IF;

  IF v_row.status NOT IN ('REQUESTED', 'AWAITING_PAYMENT') THEN
    RAISE EXCEPTION 'cancel booking: only REQUESTED or AWAITING_PAYMENT bookings can be self-cancelled (contact the academy office for confirmed sessions)';
  END IF;

  PERFORM set_config('phenol.booking_flow', 'true', true);

  UPDATE public.private_service_bookings
  SET status = 'CANCELLED',
      cancellation_reason = btrim(p_reason),
      cancelled_by = v_uid,
      cancelled_by_email = v_email,
      cancelled_at = now()
  WHERE id = p_booking_id;

  IF v_row.slot_id IS NOT NULL THEN
    UPDATE public.private_service_slots
    SET status = CASE WHEN starts_at > now() THEN 'OPEN' ELSE 'CLOSED' END
    WHERE id = v_row.slot_id
      AND status = 'BOOKED';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_my_private_service_booking(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_my_private_service_booking(uuid, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 5) RLS: drop the instructor branch from both read policies. Instructors keep
--    their PII-free RPCs (list_instructor_private_bookings /
--    get_instructor_financial_ledger); direct table reads no longer leak
--    student_email / student_phone.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "private service bookings read" ON public.private_service_bookings;
CREATE POLICY "private service bookings read" ON public.private_service_bookings
  FOR SELECT USING (
    student_id = auth.uid()
    OR lower(btrim(student_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    OR public.is_secretary()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "private service payments read" ON public.private_service_payments;
CREATE POLICY "private service payments read" ON public.private_service_payments
  FOR SELECT USING (
    student_id = auth.uid()
    OR lower(btrim(student_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    OR public.is_secretary()
    OR public.is_super_admin()
  );

-- ------------------------------------------------------------------------------
-- 6) office_confirm_private_service_booking: refuse to confirm a booking whose
--    only payment was refunded (no-money-no-service; record + verify again).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.office_confirm_private_service_booking(
  p_booking_id uuid,
  p_session_link text DEFAULT NULL,
  p_internal_room_ref text DEFAULT NULL,
  p_starts_at timestamptz DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL,
  p_office_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.private_service_bookings;
  v_link text;
  v_room text;
  v_starts timestamptz;
  v_ends timestamptz;
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can confirm private bookings';
  END IF;

  SELECT * INTO v_row
  FROM public.private_service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking not found';
  END IF;

  IF NOT v_row.payment_verified OR v_row.payment_verified_at IS NULL THEN
    RAISE EXCEPTION 'confirm booking: pay-first rule - verify payment before confirming this booking';
  END IF;

  IF EXISTS (
       SELECT 1 FROM public.private_service_payments
       WHERE booking_id = p_booking_id AND status = 'REFUNDED'
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.private_service_payments
       WHERE booking_id = p_booking_id AND status = 'VERIFIED'
     ) THEN
    RAISE EXCEPTION 'confirm booking: the payment for this booking was refunded - record and verify a new payment first';
  END IF;

  IF v_row.status NOT IN ('REQUESTED', 'AWAITING_PAYMENT', 'CONFIRMED') THEN
    RAISE EXCEPTION 'confirm booking: cannot confirm a booking in status %', v_row.status;
  END IF;

  v_link := coalesce(nullif(btrim(coalesce(p_session_link, '')), ''), v_row.session_link);
  v_room := coalesce(nullif(btrim(coalesce(p_internal_room_ref, '')), ''), v_row.internal_room_ref);
  v_starts := coalesce(p_starts_at, v_row.scheduled_starts_at);
  v_ends := coalesce(p_ends_at, v_row.scheduled_ends_at);

  IF v_ends <= v_starts THEN
    RAISE EXCEPTION 'confirm booking: scheduled end time must be after start time';
  END IF;

  IF v_row.delivery_mode = 'external_link' AND char_length(coalesce(v_link, '')) < 8 THEN
    RAISE EXCEPTION 'confirm booking: an external session link (Zoom / Meet URL) is required to confirm';
  END IF;

  IF v_row.delivery_mode = 'internal' AND char_length(coalesce(v_room, '')) < 3 THEN
    RAISE EXCEPTION 'confirm booking: an internal live-server room reference is required to confirm';
  END IF;

  UPDATE public.private_service_bookings
  SET status = 'CONFIRMED',
      session_link = v_link,
      internal_room_ref = v_room,
      scheduled_starts_at = v_starts,
      scheduled_ends_at = v_ends,
      office_notes = coalesce(nullif(btrim(coalesce(p_office_notes, '')), ''), office_notes),
      confirmed_by = coalesce(confirmed_by, auth.uid()),
      confirmed_by_email = coalesce(confirmed_by_email, lower(coalesce(auth.jwt() ->> 'email', ''))),
      confirmed_at = coalesce(confirmed_at, now())
  WHERE id = p_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.office_confirm_private_service_booking(uuid, text, text, timestamptz, timestamptz, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_confirm_private_service_booking(uuid, text, text, timestamptz, timestamptz, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 7) office_mark_private_booking_awaiting_payment: refuse a past start time.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.office_mark_private_booking_awaiting_payment(
  p_booking_id uuid,
  p_starts_at timestamptz DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL,
  p_office_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.private_service_bookings;
  v_starts timestamptz;
  v_ends timestamptz;
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can review private bookings';
  END IF;

  SELECT * INTO v_row
  FROM public.private_service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking not found';
  END IF;

  IF v_row.status NOT IN ('REQUESTED', 'AWAITING_PAYMENT') THEN
    RAISE EXCEPTION 'booking: can only move REQUESTED bookings to AWAITING_PAYMENT (current: %)', v_row.status;
  END IF;

  v_starts := coalesce(p_starts_at, v_row.scheduled_starts_at);
  v_ends := coalesce(p_ends_at, v_row.scheduled_ends_at);

  IF v_ends <= v_starts THEN
    RAISE EXCEPTION 'booking: scheduled end time must be after start time';
  END IF;

  IF v_starts <= now() THEN
    RAISE EXCEPTION 'booking: the proposed start time must be in the future';
  END IF;

  UPDATE public.private_service_bookings
  SET status = 'AWAITING_PAYMENT',
      scheduled_starts_at = v_starts,
      scheduled_ends_at = v_ends,
      office_notes = coalesce(nullif(btrim(coalesce(p_office_notes, '')), ''), office_notes)
  WHERE id = p_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.office_mark_private_booking_awaiting_payment(uuid, timestamptz, timestamptz, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_mark_private_booking_awaiting_payment(uuid, timestamptz, timestamptz, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 8) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 031 (applied: 028b, 029, 030, 031 - private service booking/payment review hardening: exact allocation math with RAISE instead of clamping, refund requires a written reason, no VERIFIED payment on CANCELLED/NO_SHOW bookings, no student self-cancel after payment verification, instructor PII removed from bookings/payments RLS policies, re-payment allowed after a refund, refunded bookings cannot be confirmed, past reschedules refused, friendly method validation; zero rows fabricated) applied';
