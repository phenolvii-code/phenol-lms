-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 032
-- PRIVATE SERVICE PAYMENTS - CANCELLED BOOKING REVIEW STATE + STUDENT PAYMENT STATE
-- ==============================================================================
--
-- WHY THIS MIGRATION EXISTS
--   Owner decision (2026-11-19, option "C"): when the academy office cancels a
--   booking whose payment is already VERIFIED, the money must NOT stay VERIFIED
--   (it would enter instructor settlements for a session that never happened).
--   It moves to UNDER_REVIEW = "needs a refund decision" instead.
--
-- WHAT THIS MIGRATION DOES
--   1. LEGAL TRANSITIONS (guard trigger + status RPC):
--        - VERIFIED -> UNDER_REVIEW  (office cancels a paid booking or moves a
--          verified payment back to review; needs a refund/review decision).
--          A written reason (note) is required and appended to the payment note.
--        - UNDER_REVIEW is split strictly by `verified_at` (whether money was
--          already verified as received):
--            * Held payment (`verified_at IS NOT NULL`):
--              - On CANCELLED / NO_SHOW bookings: strictly exits ONLY to
--                REFUNDED (with a written reason >= 3 chars), since 031 blocks
--                VERIFIED on dead bookings.
--              - On alive bookings: exits to REFUNDED (with a written reason)
--                or back to VERIFIED.
--              - Can NEVER exit to FAILED or CANCELLED (received money cannot
--                be silently written off).
--            * Initial review (`PENDING -> UNDER_REVIEW`, `verified_at IS NULL`):
--              - Keeps normal exits: VERIFIED (alive booking only), FAILED, or
--                CANCELLED. Can NEVER jump directly to REFUNDED.
--      Settlement safety: a payment already linked to a settlement can NEVER be
--      demoted or refunded (cancel the settlement first).
--   2. office_set_private_booking_status(): cancelling a booking demotes its
--      VERIFIED payments to UNDER_REVIEW with a note (preserving verified_at as
--      the held-payment marker), and refuses to cancel when such a payment is
--      already linked to a settlement.
--      NO_SHOW is intentionally NOT demoted (student did not attend; the
--      payment stays VERIFIED unless management refunds it explicitly).
--   3. list_my_student_private_bookings(): returns a derived `payment_state`
--      with priority ACTIVE > IN_REVIEW > REFUNDED > UNPAID so the student
--      never sees "Payment Verified" on a refunded or held payment, and an
--      active UNDER_REVIEW payment is not masked by an older REFUNDED row.
--   4. trg_audit_private_service_payments(): every newly VERIFIED payment now
--      refreshes the booking's payment_reference / verified_at / verified_by,
--      so a replacement payment after a refund stamps its own receipt instead
--      of keeping the old one.
--
-- DELIBERATE LIMITS
--   - bookings.payment_verified is NOT reverted (029's guard forbids it and the
--     historical fact "a payment was once verified" stays true). The derived
--     payment_state is the source of truth for display.
--   - No new status values are introduced: UNDER_REVIEW already exists and is
--     excluded from every settlement / earnings query (which filter VERIFIED).
--   - Held under-review payments (`verified_at IS NOT NULL`) cannot move to
--     FAILED or CANCELLED; on CANCELLED / NO_SHOW bookings they exit strictly
--     to REFUNDED (031 preserves the dead-booking guard on VERIFIED). Initial
--     under-review payments (`verified_at IS NULL`) cannot move to REFUNDED.
--
-- HARD GUARANTEES
--   - Zero rows fabricated or rewritten at apply time.
--   - Zero client write policies before and after.
--   - Only one function signature changes (list_my_student_private_bookings
--     gains a trailing `payment_state` column -> DROP + CREATE + re-grant).
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) trg_private_service_payments_guard: allow the review-state transitions and
--    block demotion/refund of payments already linked to a settlement.
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

    -- Settlement safety: once a verified payment is inside a payout, its status
    -- cannot move (refund or demote) until that settlement is cancelled.
    IF OLD.status = 'VERIFIED' AND OLD.settlement_id IS NOT NULL THEN
      RAISE EXCEPTION 'private_service_payments: cannot change the status of a payment linked to a settlement - cancel the settlement first';
    END IF;

    -- Held-payment safety: money already verified as received (verified_at IS NOT NULL)
    -- cannot be silently written off as FAILED or CANCELLED; it must be REFUNDED
    -- with a written reason (or re-VERIFIED on an alive booking).
    IF OLD.status = 'UNDER_REVIEW' AND OLD.verified_at IS NOT NULL AND NEW.status IN ('FAILED', 'CANCELLED') THEN
      RAISE EXCEPTION 'private_service_payments: a held payment that was already verified cannot move to % - refund it with a written reason instead', NEW.status;
    END IF;

    -- Unverified payments under review cannot be refunded before verification.
    IF OLD.status = 'UNDER_REVIEW' AND OLD.verified_at IS NULL AND NEW.status = 'REFUNDED' THEN
      RAISE EXCEPTION 'private_service_payments: an unverified payment under review cannot be refunded - verify it first or mark it FAILED/CANCELLED';
    END IF;

    IF NOT (
      (OLD.status = 'PENDING' AND NEW.status IN ('UNDER_REVIEW', 'VERIFIED', 'FAILED', 'CANCELLED'))
      OR (OLD.status = 'UNDER_REVIEW' AND OLD.verified_at IS NULL AND NEW.status IN ('VERIFIED', 'FAILED', 'CANCELLED'))
      OR (OLD.status = 'UNDER_REVIEW' AND OLD.verified_at IS NOT NULL AND NEW.status IN ('VERIFIED', 'REFUNDED'))
      OR (OLD.status = 'VERIFIED' AND NEW.status IN ('UNDER_REVIEW', 'REFUNDED'))
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
-- 2) trg_audit_private_service_payments: refresh the booking's receipt data on
--    EVERY newly verified payment (replacement payments after a refund keep
--    their own reference instead of the stale old one).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_audit_private_service_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role text;
BEGIN
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      actor_id, actor_email, actor_role, action, entity_type, entity_id,
      summary, details, source, note
    ) VALUES (
      auth.uid(), lower(coalesce(auth.jwt() ->> 'email', '')), v_actor_role,
      'private_payment.recorded', 'private_service_payment', NEW.id::text,
      'private service payment recorded: ' || NEW.gross_amount::text || ' ' || NEW.currency || ' (' || NEW.status || ')',
      jsonb_build_object(
        'booking_id', NEW.booking_id,
        'service_id', NEW.service_id,
        'student_email', NEW.student_email,
        'instructor_email', NEW.instructor_email,
        'method', NEW.method,
        'gross_amount', NEW.gross_amount,
        'platform_commission_pct', NEW.platform_commission_pct,
        'platform_amount', NEW.platform_amount,
        'instructor_amount', NEW.instructor_amount,
        'reference', NEW.reference,
        'status', NEW.status
      ),
      'trigger',
      NEW.note
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.audit_logs (
      actor_id, actor_email, actor_role, action, entity_type, entity_id,
      summary, details, source, note
    ) VALUES (
      auth.uid(), lower(coalesce(auth.jwt() ->> 'email', '')), v_actor_role,
      'private_payment.status.change', 'private_service_payment', NEW.id::text,
      'private service payment status: ' || OLD.status || ' -> ' || NEW.status || ' (' || NEW.gross_amount::text || ' ' || NEW.currency || ')',
      jsonb_build_object(
        'booking_id', NEW.booking_id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'gross_amount', NEW.gross_amount,
        'instructor_email', NEW.instructor_email,
        'reference', NEW.reference
      ),
      'trigger',
      NEW.note
    );
  END IF;

  -- Every payment that reaches VERIFIED (including a replacement after a
  -- refund) stamps its own receipt onto the linked booking.
  IF NEW.status = 'VERIFIED' AND (TG_OP = 'INSERT' OR OLD.status <> 'VERIFIED') THEN
    UPDATE public.private_service_bookings
    SET payment_verified = true,
        payment_reference = coalesce(nullif(btrim(coalesce(NEW.reference, '')), ''), NEW.id::text),
        payment_verified_by = NEW.verified_by,
        payment_verified_by_email = NEW.verified_by_email,
        payment_verified_at = NEW.verified_at,
        status = CASE WHEN status = 'REQUESTED' THEN 'AWAITING_PAYMENT' ELSE status END
    WHERE id = NEW.booking_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_private_service_payments ON public.private_service_payments;
CREATE TRIGGER trg_audit_private_service_payments
  AFTER INSERT OR UPDATE ON public.private_service_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_audit_private_service_payments();

-- ------------------------------------------------------------------------------
-- 3) set_private_service_payment_status: add the review transitions + require a
--    written reason for "move back to review", keep the refund reason rule.
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

  IF v_row.status = 'VERIFIED' AND v_row.settlement_id IS NOT NULL THEN
    RAISE EXCEPTION 'cannot change the status of a payment linked to a settlement - cancel the settlement first';
  END IF;

  IF v_row.status = 'UNDER_REVIEW' AND v_row.verified_at IS NOT NULL AND v_target IN ('FAILED', 'CANCELLED') THEN
    RAISE EXCEPTION 'cannot mark a held verified payment as % - refund it with a written reason instead', v_target;
  END IF;

  IF v_row.status = 'UNDER_REVIEW' AND v_row.verified_at IS NULL AND v_target = 'REFUNDED' THEN
    RAISE EXCEPTION 'cannot refund an unverified payment under review - verify it first or mark it FAILED/CANCELLED';
  END IF;

  IF NOT (
       (v_row.status = 'PENDING'       AND v_target IN ('UNDER_REVIEW', 'VERIFIED', 'FAILED', 'CANCELLED'))
    OR (v_row.status = 'UNDER_REVIEW'  AND v_row.verified_at IS NULL AND v_target IN ('VERIFIED', 'FAILED', 'CANCELLED'))
    OR (v_row.status = 'UNDER_REVIEW'  AND v_row.verified_at IS NOT NULL AND v_target IN ('VERIFIED', 'REFUNDED'))
    OR (v_row.status = 'VERIFIED'      AND v_target IN ('UNDER_REVIEW', 'REFUNDED'))
  ) THEN
    RAISE EXCEPTION 'illegal private service payment transition % -> %', v_row.status, v_target;
  END IF;

  IF v_target = 'VERIFIED' AND v_booking.status IN ('CANCELLED', 'NO_SHOW') THEN
    RAISE EXCEPTION 'cannot verify a payment for a % booking', v_booking.status;
  END IF;

  IF v_row.status = 'VERIFIED' AND v_target = 'UNDER_REVIEW' AND char_length(v_note) < 3 THEN
    RAISE EXCEPTION 'moving a verified payment back to review requires a written reason (note)';
  END IF;

  IF v_target = 'REFUNDED' AND char_length(v_note) < 3 THEN
    RAISE EXCEPTION 'a refund requires a written reason (note)';
  END IF;

  IF v_target = 'REFUNDED' AND v_row.settlement_id IS NOT NULL THEN
    RAISE EXCEPTION 'cannot refund a payment linked to a settlement - cancel the settlement first';
  END IF;

  UPDATE public.private_service_payments
  SET status = v_target,
      verified_by = CASE WHEN v_target = 'VERIFIED' THEN auth.uid() ELSE verified_by END,
      verified_by_email = CASE WHEN v_target = 'VERIFIED' THEN v_actor_email ELSE verified_by_email END,
      verified_at = CASE WHEN v_target = 'VERIFIED' THEN now() ELSE verified_at END,
      note = CASE
               WHEN v_note = '' THEN note
               WHEN char_length(coalesce(note, '')) = 0 THEN v_note
               ELSE left(note || ' | ' || v_note, 1000)
             END
  WHERE id = p_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_private_service_payment_status(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_private_service_payment_status(uuid, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 4) office_set_private_booking_status: cancelling a paid booking demotes its
--    VERIFIED payments to UNDER_REVIEW (needs a refund decision).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.office_set_private_booking_status(
  p_booking_id uuid,
  p_status text,
  p_reason text DEFAULT NULL,
  p_office_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.private_service_bookings;
  v_target text := upper(btrim(coalesce(p_status, '')));
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can update private booking status';
  END IF;

  IF v_target NOT IN ('COMPLETED', 'NO_SHOW', 'CANCELLED') THEN
    RAISE EXCEPTION 'booking status: use office_confirm_private_service_booking to confirm, or choose COMPLETED, NO_SHOW, or CANCELLED';
  END IF;

  SELECT * INTO v_row
  FROM public.private_service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking not found';
  END IF;

  IF v_target = 'CANCELLED' AND char_length(btrim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION 'cancel booking: a written cancellation reason (at least 3 characters) is required';
  END IF;

  PERFORM set_config('phenol.booking_flow', 'true', true);

  -- Cancelling a paid booking must not leave settleable VERIFIED revenue.
  -- Demote the verified payment(s) to UNDER_REVIEW before the booking is
  -- cancelled; a settled payment forces the office to unwind the payout first.
  IF v_target = 'CANCELLED' THEN
    IF EXISTS (
      SELECT 1 FROM public.private_service_payments
      WHERE booking_id = p_booking_id
        AND status = 'VERIFIED'
        AND settlement_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'cancel booking: the verified payment is already linked to a settlement - cancel the settlement first';
    END IF;

    UPDATE public.private_service_payments
    SET status = 'UNDER_REVIEW',
        note = left(
          coalesce(nullif(btrim(coalesce(note, '')), '') || ' | ', '')
          || 'booking cancelled - payment held for a refund decision',
          1000
        )
    WHERE booking_id = p_booking_id
      AND status = 'VERIFIED';
  END IF;

  UPDATE public.private_service_bookings
  SET status = v_target,
      cancellation_reason = CASE WHEN v_target = 'CANCELLED' THEN btrim(p_reason) ELSE cancellation_reason END,
      cancelled_by = CASE WHEN v_target = 'CANCELLED' THEN auth.uid() ELSE cancelled_by END,
      cancelled_by_email = CASE WHEN v_target = 'CANCELLED' THEN lower(coalesce(auth.jwt() ->> 'email', '')) ELSE cancelled_by_email END,
      cancelled_at = CASE WHEN v_target = 'CANCELLED' THEN now() ELSE cancelled_at END,
      completed_at = CASE WHEN v_target = 'COMPLETED' THEN now() ELSE completed_at END,
      office_notes = coalesce(nullif(btrim(coalesce(p_office_notes, '')), ''), office_notes)
  WHERE id = p_booking_id;

  -- If a slot-backed booking is cancelled, release the slot back to OPEN if it is still in the future.
  IF v_target = 'CANCELLED' AND v_row.slot_id IS NOT NULL THEN
    UPDATE public.private_service_slots
    SET status = CASE WHEN starts_at > now() THEN 'OPEN' ELSE 'CLOSED' END
    WHERE id = v_row.slot_id
      AND status = 'BOOKED';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.office_set_private_booking_status(uuid, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_set_private_booking_status(uuid, text, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 5) list_my_student_private_bookings: expose a derived `payment_state`.
--    Return type changes -> DROP + CREATE + re-grant (no dependent object).
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.list_my_student_private_bookings();

CREATE FUNCTION public.list_my_student_private_bookings()
RETURNS TABLE (
  id uuid,
  service_id uuid,
  slot_id uuid,
  instructor_email text,
  instructor_name text,
  service_title text,
  duration_minutes integer,
  delivery_mode text,
  booking_mode text,
  scheduled_starts_at timestamptz,
  scheduled_ends_at timestamptz,
  timezone text,
  price_snapshot numeric,
  currency text,
  payment_verified boolean,
  payment_reference text,
  payment_verified_at timestamptz,
  session_link text,
  internal_room_ref text,
  student_notes text,
  office_notes text,
  cancellation_reason text,
  status text,
  requested_at timestamptz,
  confirmed_at timestamptz,
  payment_state text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.service_id, b.slot_id,
         b.instructor_email, b.instructor_name, b.service_title,
         b.duration_minutes, b.delivery_mode, b.booking_mode,
         b.scheduled_starts_at, b.scheduled_ends_at, b.timezone,
         b.price_snapshot, b.currency,
         b.payment_verified, b.payment_reference, b.payment_verified_at,
         -- Venue link is only exposed to the student once CONFIRMED or COMPLETED
         CASE WHEN b.status IN ('CONFIRMED', 'COMPLETED') THEN b.session_link ELSE NULL END AS session_link,
         CASE WHEN b.status IN ('CONFIRMED', 'COMPLETED') THEN b.internal_room_ref ELSE NULL END AS internal_room_ref,
         b.student_notes, b.office_notes, b.cancellation_reason,
         b.status, b.requested_at, b.confirmed_at,
         -- Derived truth from the ledger (never from the stale boolean alone)
         -- Priority: ACTIVE > IN_REVIEW > REFUNDED > UNPAID
         CASE
           WHEN EXISTS (SELECT 1 FROM public.private_service_payments p
                        WHERE p.booking_id = b.id AND p.status = 'VERIFIED') THEN 'ACTIVE'
           WHEN EXISTS (SELECT 1 FROM public.private_service_payments p
                        WHERE p.booking_id = b.id AND p.status = 'UNDER_REVIEW') THEN 'IN_REVIEW'
           WHEN EXISTS (SELECT 1 FROM public.private_service_payments p
                        WHERE p.booking_id = b.id AND p.status = 'REFUNDED') THEN 'REFUNDED'
           WHEN b.payment_verified THEN 'ACTIVE'
           ELSE 'UNPAID'
         END AS payment_state
  FROM public.private_service_bookings b
  WHERE b.student_id = auth.uid()
     OR lower(btrim(b.student_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
  ORDER BY b.requested_at DESC
  LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.list_my_student_private_bookings() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_my_student_private_bookings() TO authenticated;

-- ------------------------------------------------------------------------------
-- 6) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 032 (applied: 028b, 029, 030, 031, 032 - private service payment review state: cancelling a paid booking demotes VERIFIED payments to UNDER_REVIEW with verified_at preserved and a written reason (never settleable), held UNDER_REVIEW payments (verified_at IS NOT NULL) block FAILED/CANCELLED and exit strictly to REFUNDED on dead bookings (or VERIFIED on alive bookings), initial UNDER_REVIEW payments (verified_at IS NULL) block REFUNDED, settled payments cannot be demoted or refunded, student bookings expose derived payment_state (ACTIVE/IN_REVIEW/REFUNDED/UNPAID), and every newly VERIFIED replacement payment refreshes the booking receipt; zero rows fabricated) applied';
