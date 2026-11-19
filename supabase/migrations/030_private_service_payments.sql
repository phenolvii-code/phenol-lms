-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 030
-- PRIVATE SERVICES STAGE 3 - PAYMENTS LEDGER, OFFICE DESK & SETTLEMENT INTEGRATION
-- ==============================================================================
--
-- WHY THIS MIGRATION EXISTS
--   Stage 1 (028/028b) built the private-services catalog & slots.
--   Stage 2 (029) built the pay-first-then-confirm booking lifecycle.
--   Stage 3 (030) completes private-services governance by adding the dedicated
--   `private_service_payments` financial ledger (separate from `payments`
--   because `payments.course_id` is NOT NULL) and integrating verified 1:1
--   private-service revenue into:
--     1. Automatic booking pay-first verification (VERIFIED payment -> stamps
--        private_service_bookings.payment_verified = true).
--     2. Instructor settlements (`create_instructor_settlement` &
--        `set_settlement_status` now include & unlink both course payments and
--        private service payments).
--     3. Instructor read-only earnings ledger (`get_instructor_financial_ledger`)
--        and academy-wide overview (`get_super_admin_financial_overview`).
--
-- HARD GUARANTEES
--   - Zero rows fabricated: `private_service_payments` starts EMPTY.
--   - Zero client write policies: every write goes through a definer RPC.
--   - Immutable money & commission snapshots per row; DELETE forbidden.
--   - Refunds are per-case management decisions: REFUNDED does NOT auto-cancel
--     the booking, and refund is blocked while linked to a settlement.
--   - Every payment record and status change is audit-logged into `audit_logs`.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) private_service_payments: immutable financial ledger for 1:1 bookings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.private_service_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  booking_id uuid NOT NULL REFERENCES public.private_service_bookings(id) ON DELETE RESTRICT,
  service_id uuid NOT NULL REFERENCES public.private_services(id) ON DELETE RESTRICT,

  student_id       uuid NOT NULL,
  student_email    text NOT NULL,
  instructor_email text NOT NULL,

  method text NOT NULL
    CHECK (method IN ('kashier', 'cash', 'instapay', 'vodafone_cash', 'other')),

  gross_amount numeric(12,2) NOT NULL CHECK (gross_amount > 0),
  currency     text NOT NULL DEFAULT 'EGP' CHECK (char_length(btrim(currency)) = 3),

  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'FAILED', 'REFUNDED', 'CANCELLED')),

  reference    text,
  collected_at timestamptz,

  -- Per-row immutable commercial & commission snapshots
  price_snapshot          numeric(12,2) NOT NULL CHECK (price_snapshot > 0),
  platform_commission_pct numeric(5,2) NOT NULL CHECK (platform_commission_pct >= 0 AND platform_commission_pct <= 100),
  platform_amount         numeric(12,2) NOT NULL CHECK (platform_amount >= 0),
  processing_fee          numeric(12,2) NOT NULL DEFAULT 0 CHECK (processing_fee >= 0),
  instructor_amount       numeric(12,2) NOT NULL CHECK (instructor_amount >= 0),

  -- Settlement payout linkage (same discipline as 026 on payments)
  settlement_id uuid REFERENCES public.instructor_settlements(id) ON DELETE RESTRICT,

  verified_by       uuid,
  verified_by_email text,
  verified_at       timestamptz,
  created_by        uuid,
  created_by_email  text,
  note              text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Duplicate receipt / gateway reference protection per booking
CREATE UNIQUE INDEX IF NOT EXISTS uq_private_service_payments_ref
  ON public.private_service_payments (booking_id, reference)
  WHERE reference IS NOT NULL;

-- Prevent double-charging the same booking with two VERIFIED payments
CREATE UNIQUE INDEX IF NOT EXISTS uq_private_service_payments_verified_booking
  ON public.private_service_payments (booking_id)
  WHERE status = 'VERIFIED';

CREATE INDEX IF NOT EXISTS idx_private_service_payments_instructor
  ON public.private_service_payments (lower(instructor_email), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_private_service_payments_settlement
  ON public.private_service_payments (settlement_id)
  WHERE settlement_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 2) RLS: SELECT only, ZERO client write policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.private_service_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "private service payments read" ON public.private_service_payments;
CREATE POLICY "private service payments read" ON public.private_service_payments
  FOR SELECT USING (
    student_id = auth.uid()
    OR lower(btrim(student_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    OR lower(btrim(instructor_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    OR public.is_secretary()
    OR public.is_super_admin()
  );

-- NO INSERT / UPDATE / DELETE policies on private_service_payments.

-- ------------------------------------------------------------------------------
-- 3) trg_private_service_payments_guard: immutability, legal transitions,
--    settlement linkage guard, and no deletes for anyone.
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
-- 4) trg_audit_private_service_payments: logs into audit_logs + syncs VERIFIED
--    payments onto private_service_bookings.payment_verified = true.
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

  -- When a private service payment reaches VERIFIED, automatically stamp
  -- payment_verified = true on the linked booking so the office can confirm it.
  IF NEW.status = 'VERIFIED' AND (TG_OP = 'INSERT' OR OLD.status <> 'VERIFIED') THEN
    UPDATE public.private_service_bookings
    SET payment_verified = true,
        payment_reference = coalesce(nullif(btrim(coalesce(NEW.reference, '')), ''), NEW.id::text),
        payment_verified_by = NEW.verified_by,
        payment_verified_by_email = NEW.verified_by_email,
        payment_verified_at = NEW.verified_at,
        status = CASE WHEN status = 'REQUESTED' THEN 'AWAITING_PAYMENT' ELSE status END
    WHERE id = NEW.booking_id
      AND NOT payment_verified;
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
-- 5) Academy Office Private Service Payment RPCs
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
  v_default_pct numeric := 20;
  v_custom_pct numeric;
  v_pct numeric;
  v_fee numeric(12,2) := coalesce(p_processing_fee, 0);
  v_platform numeric(12,2);
  v_instructor numeric(12,2);
  v_status text := CASE WHEN coalesce(p_verify_now, false) THEN 'VERIFIED' ELSE 'PENDING' END;
  v_actor_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_payment_id uuid;
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can record private service payments';
  END IF;

  IF p_gross_amount IS NULL OR p_gross_amount <= 0 THEN
    RAISE EXCEPTION 'payment: gross_amount must be greater than zero';
  END IF;

  IF v_fee < 0 THEN
    RAISE EXCEPTION 'payment: processing_fee cannot be negative';
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

  IF v_booking.payment_verified OR EXISTS (
    SELECT 1 FROM public.private_service_payments
    WHERE booking_id = p_booking_id AND status = 'VERIFIED'
  ) THEN
    RAISE EXCEPTION 'payment: booking already has a VERIFIED payment';
  END IF;

  SELECT COALESCE(NULLIF(value, '')::numeric, 20) INTO v_default_pct
  FROM public.platform_settings WHERE key = 'default_platform_commission_pct';

  SELECT p.platform_commission_pct INTO v_custom_pct
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE lower(trim(u.email)) = lower(trim(v_booking.instructor_email));

  v_pct := COALESCE(v_custom_pct, v_default_pct);
  v_platform := round((p_gross_amount * v_pct) / 100.0, 2);
  v_instructor := greatest(round(p_gross_amount - v_platform - v_fee, 2), 0);

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
    lower(btrim(p_method)), p_gross_amount, v_booking.currency, v_status,
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
  v_target text := upper(btrim(coalesce(p_new_status, '')));
  v_actor_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can update private service payment status';
  END IF;

  SELECT * INTO v_row
  FROM public.private_service_payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'private service payment not found';
  END IF;

  IF v_target = 'REFUNDED' AND v_row.settlement_id IS NOT NULL THEN
    RAISE EXCEPTION 'cannot refund a payment linked to a settlement - cancel the settlement first';
  END IF;

  UPDATE public.private_service_payments
  SET status = v_target,
      verified_by = CASE WHEN v_target = 'VERIFIED' THEN auth.uid() ELSE verified_by END,
      verified_by_email = CASE WHEN v_target = 'VERIFIED' THEN v_actor_email ELSE verified_by_email END,
      verified_at = CASE WHEN v_target = 'VERIFIED' THEN now() ELSE verified_at END,
      note = coalesce(nullif(btrim(coalesce(p_note, '')), ''), note)
  WHERE id = p_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_private_service_payment_status(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_private_service_payment_status(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.office_list_private_service_payments(
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  booking_id uuid,
  service_id uuid,
  service_title text,
  booking_status text,
  student_email text,
  instructor_email text,
  method text,
  gross_amount numeric,
  currency text,
  status text,
  reference text,
  price_snapshot numeric,
  platform_commission_pct numeric,
  platform_amount numeric,
  processing_fee numeric,
  instructor_amount numeric,
  settlement_id uuid,
  verified_by_email text,
  verified_at timestamptz,
  note text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: academy office access required';
  END IF;

  RETURN QUERY
  SELECT p.id, p.booking_id, p.service_id,
         b.service_title, b.status AS booking_status,
         p.student_email, p.instructor_email,
         p.method, p.gross_amount, p.currency, p.status, p.reference,
         p.price_snapshot, p.platform_commission_pct, p.platform_amount,
         p.processing_fee, p.instructor_amount,
         p.settlement_id, p.verified_by_email, p.verified_at,
         p.note, p.created_at
  FROM public.private_service_payments p
  JOIN public.private_service_bookings b ON b.id = p.booking_id
  WHERE (p_status IS NULL OR btrim(p_status) = '' OR p.status = upper(btrim(p_status)))
  ORDER BY p.created_at DESC
  LIMIT 300;
END;
$$;

REVOKE ALL ON FUNCTION public.office_list_private_service_payments(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_list_private_service_payments(text) TO authenticated;

-- Upgrade 029's office_verify_private_booking_payment so verifying from the
-- Bookings Desk ALSO guarantees a VERIFIED ledger row in private_service_payments
-- (closing any gap between booking payment_verified and settlements/ledgers).
CREATE OR REPLACE FUNCTION public.office_verify_private_booking_payment(
  p_booking_id uuid,
  p_payment_reference text,
  p_office_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.private_service_bookings;
  v_ref text := btrim(coalesce(p_payment_reference, ''));
  v_existing_payment_id uuid;
  v_actor_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can verify private booking payments';
  END IF;

  IF char_length(v_ref) < 2 THEN
    RAISE EXCEPTION 'verify payment: a payment reference or receipt identifier is required';
  END IF;

  SELECT * INTO v_row
  FROM public.private_service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking not found';
  END IF;

  IF v_row.status IN ('CANCELLED', 'COMPLETED', 'NO_SHOW') THEN
    RAISE EXCEPTION 'verify payment: cannot verify payment on a % booking', v_row.status;
  END IF;

  -- If there is an open (PENDING / UNDER_REVIEW) payment row for this booking,
  -- verify it; otherwise, if no VERIFIED payment row exists yet, create one.
  IF NOT EXISTS (
    SELECT 1 FROM public.private_service_payments
    WHERE booking_id = p_booking_id AND status = 'VERIFIED'
  ) THEN
    SELECT id INTO v_existing_payment_id
    FROM public.private_service_payments
    WHERE booking_id = p_booking_id
      AND status IN ('PENDING', 'UNDER_REVIEW')
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF v_existing_payment_id IS NOT NULL THEN
      UPDATE public.private_service_payments
      SET status = 'VERIFIED',
          reference = coalesce(nullif(v_ref, ''), reference),
          verified_by = auth.uid(),
          verified_by_email = v_actor_email,
          verified_at = now(),
          note = coalesce(nullif(btrim(coalesce(p_office_notes, '')), ''), note)
      WHERE id = v_existing_payment_id;
    ELSE
      PERFORM public.record_private_service_payment(
        p_booking_id,
        'other',
        v_row.price_snapshot,
        v_ref,
        0,
        true,
        p_office_notes
      );
    END IF;
  END IF;

  UPDATE public.private_service_bookings
  SET payment_verified = true,
      payment_reference = v_ref,
      payment_verified_by = coalesce(payment_verified_by, auth.uid()),
      payment_verified_by_email = coalesce(payment_verified_by_email, v_actor_email),
      payment_verified_at = coalesce(payment_verified_at, now()),
      status = CASE WHEN status = 'REQUESTED' THEN 'AWAITING_PAYMENT' ELSE status END,
      office_notes = coalesce(nullif(btrim(coalesce(p_office_notes, '')), ''), office_notes)
  WHERE id = p_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.office_verify_private_booking_payment(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_verify_private_booking_payment(uuid, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 6) Integrate private_service_payments into instructor settlements (025/026/028b)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_instructor_settlement(
  p_instructor_email text,
  p_period_start date,
  p_period_end date,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_instructor_email, '')));
  v_inst_id uuid;
  v_count int := 0;
  v_gross numeric(12,2) := 0;
  v_platform numeric(12,2) := 0;
  v_fees numeric(12,2) := 0;
  v_net numeric(12,2) := 0;
  v_currency text := 'EGP';
  v_currency_count int := 0;
  v_actor_role text;
  v_settlement_id uuid;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office (secretary/founder) can prepare instructor settlements';
  END IF;

  IF v_email = '' THEN
    RAISE EXCEPTION 'instructor email is required';
  END IF;

  IF p_period_start IS NULL OR p_period_end IS NULL OR p_period_end < p_period_start THEN
    RAISE EXCEPTION 'invalid settlement period: % .. %', p_period_start, p_period_end;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.instructor_settlements s
    WHERE lower(trim(s.instructor_email)) = v_email
      AND s.period_start = p_period_start
      AND s.period_end = p_period_end
      AND s.status <> 'CANCELLED'
  ) THEN
    RAISE EXCEPTION 'an active settlement already exists for % covering % .. % - cancel it first if it is wrong',
      v_email, p_period_start, p_period_end;
  END IF;

  SELECT id INTO v_inst_id FROM auth.users WHERE lower(trim(email)) = v_email;

  -- Lock unsettled VERIFIED course payments + private service payments
  PERFORM 1
  FROM public.payments
  WHERE lower(trim(instructor_email)) = v_email
    AND status = 'VERIFIED'
    AND settlement_id IS NULL
    AND (coalesce(verified_at, created_at) AT TIME ZONE 'Africa/Cairo')::date
        BETWEEN p_period_start AND p_period_end
  FOR UPDATE;

  PERFORM 1
  FROM public.private_service_payments
  WHERE lower(trim(instructor_email)) = v_email
    AND status = 'VERIFIED'
    AND settlement_id IS NULL
    AND (coalesce(verified_at, created_at) AT TIME ZONE 'Africa/Cairo')::date
        BETWEEN p_period_start AND p_period_end
  FOR UPDATE;

  SELECT
    COUNT(*)::int,
    COALESCE(SUM(gross_amount), 0),
    COALESCE(SUM(platform_amount), 0),
    COALESCE(SUM(processing_fee), 0),
    COALESCE(SUM(instructor_amount), 0),
    COALESCE(MAX(currency), 'EGP'),
    COUNT(DISTINCT currency)::int
  INTO v_count, v_gross, v_platform, v_fees, v_net, v_currency, v_currency_count
  FROM (
    SELECT gross_amount, platform_amount, processing_fee, instructor_amount, currency
    FROM public.payments
    WHERE lower(trim(instructor_email)) = v_email
      AND status = 'VERIFIED'
      AND settlement_id IS NULL
      AND (coalesce(verified_at, created_at) AT TIME ZONE 'Africa/Cairo')::date
          BETWEEN p_period_start AND p_period_end
    UNION ALL
    SELECT gross_amount, platform_amount, processing_fee, instructor_amount, currency
    FROM public.private_service_payments
    WHERE lower(trim(instructor_email)) = v_email
      AND status = 'VERIFIED'
      AND settlement_id IS NULL
      AND (coalesce(verified_at, created_at) AT TIME ZONE 'Africa/Cairo')::date
          BETWEEN p_period_start AND p_period_end
  ) combined;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'no UNSETTLED verified payments found for % between % and % (settlements cannot be fabricated or duplicated)',
      v_email, p_period_start, p_period_end;
  END IF;

  IF v_currency_count > 1 THEN
    RAISE EXCEPTION 'mixed currencies in the selected period (%): settle one currency at a time', v_currency_count;
  END IF;

  INSERT INTO public.instructor_settlements (
    instructor_id, instructor_email, period_start, period_end,
    verified_payments_count, gross_collected, platform_share,
    processing_fees, net_instructor_payout, currency,
    status, created_by, note
  ) VALUES (
    v_inst_id, v_email, p_period_start, p_period_end,
    v_count, v_gross, v_platform,
    v_fees, v_net, v_currency,
    'PENDING', auth.uid(), nullif(trim(coalesce(p_note, '')), '')
  )
  RETURNING id INTO v_settlement_id;

  -- Stamp settlement_id on both ledgers
  UPDATE public.payments
  SET settlement_id = v_settlement_id
  WHERE lower(trim(instructor_email)) = v_email
    AND status = 'VERIFIED'
    AND settlement_id IS NULL
    AND (coalesce(verified_at, created_at) AT TIME ZONE 'Africa/Cairo')::date
        BETWEEN p_period_start AND p_period_end;

  UPDATE public.private_service_payments
  SET settlement_id = v_settlement_id
  WHERE lower(trim(instructor_email)) = v_email
    AND status = 'VERIFIED'
    AND settlement_id IS NULL
    AND (coalesce(verified_at, created_at) AT TIME ZONE 'Africa/Cairo')::date
        BETWEEN p_period_start AND p_period_end;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id,
    summary, details, source, note
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    'settlement.create',
    'instructor_settlement',
    v_settlement_id::text,
    'settlement prepared for ' || v_email || ' (' || p_period_start || ' .. ' || p_period_end || '): net '
      || v_net::text || ' ' || v_currency,
    jsonb_build_object(
      'instructor_email', v_email,
      'period_start', p_period_start,
      'period_end', p_period_end,
      'verified_payments_count', v_count,
      'gross_collected', v_gross,
      'platform_share', v_platform,
      'processing_fees', v_fees,
      'net_instructor_payout', v_net,
      'currency', v_currency,
      'payments_linked', true,
      'includes_private_services', true
    ),
    'rpc',
    nullif(trim(coalesce(p_note, '')), '')
  );

  RETURN v_settlement_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_instructor_settlement(text, date, date, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_instructor_settlement(text, date, date, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_settlement_status(
  p_settlement_id uuid,
  p_new_status text,
  p_payout_method text DEFAULT NULL,
  p_payout_reference text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.instructor_settlements;
  v_actor_role text;
BEGIN
  IF p_new_status NOT IN ('PAID', 'CANCELLED') THEN
    RAISE EXCEPTION 'invalid settlement status: % (expected PAID or CANCELLED)', p_new_status;
  END IF;

  IF p_new_status = 'PAID' AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: only the academy founder (super_admin) can confirm settlement payouts (PAID)';
  END IF;

  IF p_new_status = 'CANCELLED' AND NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can cancel a pending settlement';
  END IF;

  IF p_new_status = 'CANCELLED' AND nullif(trim(coalesce(p_note, '')), '') IS NULL THEN
    RAISE EXCEPTION 'cancellation reason (note) is required when cancelling a settlement';
  END IF;

  SELECT * INTO v_row FROM public.instructor_settlements WHERE id = p_settlement_id FOR UPDATE;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'settlement not found';
  END IF;

  UPDATE public.instructor_settlements
  SET status = p_new_status,
      payout_method = CASE WHEN p_new_status = 'PAID' THEN coalesce(nullif(trim(p_payout_method), ''), payout_method) ELSE payout_method END,
      payout_reference = CASE WHEN p_new_status = 'PAID' THEN coalesce(nullif(trim(p_payout_reference), ''), payout_reference) ELSE payout_reference END,
      paid_by = CASE WHEN p_new_status = 'PAID' THEN auth.uid() ELSE paid_by END,
      paid_at = CASE WHEN p_new_status = 'PAID' THEN now() ELSE paid_at END,
      note = coalesce(nullif(trim(p_note), ''), note)
  WHERE id = p_settlement_id;

  -- Cancellation releases both course payments and private service payments
  IF p_new_status = 'CANCELLED' THEN
    UPDATE public.payments
    SET settlement_id = NULL
    WHERE settlement_id = p_settlement_id;

    UPDATE public.private_service_payments
    SET settlement_id = NULL
    WHERE settlement_id = p_settlement_id;
  END IF;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id,
    summary, details, source, note
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    'settlement.status',
    'instructor_settlement',
    p_settlement_id::text,
    'settlement ' || v_row.instructor_email || ' (' || v_row.period_start || '..' || v_row.period_end || '): '
      || v_row.status || ' -> ' || p_new_status,
    jsonb_build_object(
      'old_status', v_row.status,
      'new_status', p_new_status,
      'net_instructor_payout', v_row.net_instructor_payout,
      'payout_method', p_payout_method,
      'payout_reference', p_payout_reference,
      'payments_unlinked', (p_new_status = 'CANCELLED')
    ),
    'rpc',
    nullif(trim(coalesce(p_note, '')), '')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_settlement_status(uuid, text, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_settlement_status(uuid, text, text, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 7) Integrate private_service_payments into Instructor Ledger & Overview (025)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_instructor_financial_ledger(
  p_instructor_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_caller_role text;
  v_target_email text;
  v_custom_pct numeric;
  v_default_pct numeric := 20;
  v_currency text := 'EGP';
  v_verified_count int := 0;
  v_gross numeric(12,2) := 0;
  v_platform numeric(12,2) := 0;
  v_fees numeric(12,2) := 0;
  v_net numeric(12,2) := 0;
  v_paid_out numeric(12,2) := 0;
  v_pending_settlement numeric(12,2) := 0;
  v_payments jsonb := '[]'::jsonb;
  v_private_payments jsonb := '[]'::jsonb;
  v_settlements jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();

  IF public.is_super_admin() OR public.is_secretary() THEN
    v_target_email := coalesce(nullif(lower(trim(p_instructor_email)), ''), v_caller_email);
  ELSIF v_caller_role = 'instructor' THEN
    IF p_instructor_email IS NOT NULL AND lower(trim(p_instructor_email)) <> v_caller_email THEN
      RAISE EXCEPTION 'forbidden: instructors can only view their own financial ledger';
    END IF;
    v_target_email := v_caller_email;
  ELSE
    RAISE EXCEPTION 'forbidden: financial ledger is restricted to faculty and the academy office';
  END IF;

  SELECT COALESCE(NULLIF(value, '')::numeric, 20) INTO v_default_pct
  FROM public.platform_settings WHERE key = 'default_platform_commission_pct';

  SELECT COALESCE(NULLIF(value, ''), 'EGP') INTO v_currency
  FROM public.platform_settings WHERE key = 'platform_currency';

  SELECT p.platform_commission_pct INTO v_custom_pct
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE lower(trim(u.email)) = v_target_email;

  SELECT
    COUNT(*) FILTER (WHERE status = 'VERIFIED')::int,
    COALESCE(SUM(gross_amount) FILTER (WHERE status = 'VERIFIED'), 0),
    COALESCE(SUM(platform_amount) FILTER (WHERE status = 'VERIFIED'), 0),
    COALESCE(SUM(processing_fee) FILTER (WHERE status = 'VERIFIED'), 0),
    COALESCE(SUM(instructor_amount) FILTER (WHERE status = 'VERIFIED'), 0)
  INTO v_verified_count, v_gross, v_platform, v_fees, v_net
  FROM (
    SELECT status, gross_amount, platform_amount, processing_fee, instructor_amount
    FROM public.payments
    WHERE lower(trim(instructor_email)) = v_target_email
    UNION ALL
    SELECT status, gross_amount, platform_amount, processing_fee, instructor_amount
    FROM public.private_service_payments
    WHERE lower(trim(instructor_email)) = v_target_email
  ) all_pay;

  SELECT
    COALESCE(SUM(net_instructor_payout) FILTER (WHERE status = 'PAID'), 0),
    COALESCE(SUM(net_instructor_payout) FILTER (WHERE status = 'PENDING'), 0)
  INTO v_paid_out, v_pending_settlement
  FROM public.instructor_settlements
  WHERE lower(trim(instructor_email)) = v_target_email;

  -- PII-free course payment rows
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at DESC), '[]'::jsonb)
  INTO v_payments
  FROM (
    SELECT
      pay.id,
      pay.course_id,
      c.title AS course_title,
      pay.method,
      pay.gross_amount,
      pay.currency,
      pay.status,
      pay.platform_commission_pct,
      pay.platform_amount,
      pay.processing_fee,
      pay.instructor_amount,
      pay.verified_at,
      pay.created_at
    FROM public.payments pay
    LEFT JOIN public.courses c ON c.id = pay.course_id
    WHERE lower(trim(pay.instructor_email)) = v_target_email
    ORDER BY pay.created_at DESC
    LIMIT 100
  ) t;

  -- PII-free private service payment rows
  SELECT COALESCE(jsonb_agg(row_to_json(pt)::jsonb ORDER BY pt.created_at DESC), '[]'::jsonb)
  INTO v_private_payments
  FROM (
    SELECT
      pp.id,
      pp.booking_id,
      b.service_title,
      pp.method,
      pp.gross_amount,
      pp.currency,
      pp.status,
      pp.platform_commission_pct,
      pp.platform_amount,
      pp.processing_fee,
      pp.instructor_amount,
      pp.verified_at,
      pp.created_at
    FROM public.private_service_payments pp
    LEFT JOIN public.private_service_bookings b ON b.id = pp.booking_id
    WHERE lower(trim(pp.instructor_email)) = v_target_email
    ORDER BY pp.created_at DESC
    LIMIT 100
  ) pt;

  SELECT COALESCE(jsonb_agg(row_to_json(s)::jsonb ORDER BY s.created_at DESC), '[]'::jsonb)
  INTO v_settlements
  FROM (
    SELECT
      id,
      instructor_email,
      period_start,
      period_end,
      verified_payments_count,
      gross_collected,
      platform_share,
      processing_fees,
      net_instructor_payout,
      currency,
      status,
      payout_method,
      payout_reference,
      paid_at,
      note,
      created_at
    FROM public.instructor_settlements
    WHERE lower(trim(instructor_email)) = v_target_email
    ORDER BY created_at DESC
    LIMIT 50
  ) s;

  RETURN jsonb_build_object(
    'instructor_email', v_target_email,
    'currency', v_currency,
    'custom_commission_pct', v_custom_pct,
    'default_commission_pct', v_default_pct,
    'effective_commission_pct', COALESCE(v_custom_pct, v_default_pct),
    'verified_payments_count', v_verified_count,
    'gross_collected', v_gross,
    'platform_share', v_platform,
    'processing_fees', v_fees,
    'net_instructor_earnings', v_net,
    'paid_settlements_total', v_paid_out,
    'pending_settlements_total', v_pending_settlement,
    'unsettled_balance', GREATEST(v_net - v_paid_out - v_pending_settlement, 0),
    'payments', v_payments,
    'private_service_payments', v_private_payments,
    'settlements', v_settlements
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_instructor_financial_ledger(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_instructor_financial_ledger(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_super_admin_financial_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_pct numeric := 20;
  v_currency text := 'EGP';
  v_verified_count int := 0;
  v_pending_count int := 0;
  v_refunded_count int := 0;
  v_gross_verified numeric(12,2) := 0;
  v_platform_rev numeric(12,2) := 0;
  v_instructor_share numeric(12,2) := 0;
  v_processing_fees numeric(12,2) := 0;
  v_refunded_gross numeric(12,2) := 0;
  v_settled_paid numeric(12,2) := 0;
  v_settled_pending numeric(12,2) := 0;
  v_instructors jsonb := '[]'::jsonb;
  v_settlements jsonb := '[]'::jsonb;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: academy financial overview is restricted to the academy office';
  END IF;

  SELECT COALESCE(NULLIF(value, '')::numeric, 20) INTO v_default_pct
  FROM public.platform_settings WHERE key = 'default_platform_commission_pct';

  SELECT COALESCE(NULLIF(value, ''), 'EGP') INTO v_currency
  FROM public.platform_settings WHERE key = 'platform_currency';

  SELECT
    COUNT(*) FILTER (WHERE status = 'VERIFIED')::int,
    COUNT(*) FILTER (WHERE status IN ('PENDING', 'UNDER_REVIEW'))::int,
    COUNT(*) FILTER (WHERE status = 'REFUNDED')::int,
    COALESCE(SUM(gross_amount) FILTER (WHERE status = 'VERIFIED'), 0),
    COALESCE(SUM(platform_amount) FILTER (WHERE status = 'VERIFIED'), 0),
    COALESCE(SUM(instructor_amount) FILTER (WHERE status = 'VERIFIED'), 0),
    COALESCE(SUM(processing_fee) FILTER (WHERE status = 'VERIFIED'), 0),
    COALESCE(SUM(gross_amount) FILTER (WHERE status = 'REFUNDED'), 0)
  INTO
    v_verified_count, v_pending_count, v_refunded_count,
    v_gross_verified, v_platform_rev, v_instructor_share,
    v_processing_fees, v_refunded_gross
  FROM (
    SELECT status, gross_amount, platform_amount, instructor_amount, processing_fee FROM public.payments
    UNION ALL
    SELECT status, gross_amount, platform_amount, instructor_amount, processing_fee FROM public.private_service_payments
  ) all_pay;

  SELECT
    COALESCE(SUM(net_instructor_payout) FILTER (WHERE status = 'PAID'), 0),
    COALESCE(SUM(net_instructor_payout) FILTER (WHERE status = 'PENDING'), 0)
  INTO v_settled_paid, v_settled_pending
  FROM public.instructor_settlements;

  SELECT COALESCE(jsonb_agg(row_to_json(r)::jsonb ORDER BY r.gross_collected DESC, r.email ASC), '[]'::jsonb)
  INTO v_instructors
  FROM (
    SELECT
      lower(trim(u.email)) AS email,
      COALESCE(ip.name, split_part(lower(trim(u.email)), '@', 1)) AS name,
      p.platform_commission_pct AS custom_commission_pct,
      COALESCE(p.platform_commission_pct, v_default_pct) AS effective_commission_pct,
      (SELECT COUNT(*)::int FROM public.courses c
       WHERE lower(trim(c.instructor_email)) = lower(trim(u.email))) AS courses_count,
      (
        COALESCE((SELECT COUNT(*)::int FROM public.payments pay
         WHERE lower(trim(pay.instructor_email)) = lower(trim(u.email)) AND pay.status = 'VERIFIED'), 0)
        + COALESCE((SELECT COUNT(*)::int FROM public.private_service_payments pp
         WHERE lower(trim(pp.instructor_email)) = lower(trim(u.email)) AND pp.status = 'VERIFIED'), 0)
      ) AS verified_payments_count,
      (
        COALESCE((SELECT SUM(pay.gross_amount) FROM public.payments pay
         WHERE lower(trim(pay.instructor_email)) = lower(trim(u.email)) AND pay.status = 'VERIFIED'), 0)
        + COALESCE((SELECT SUM(pp.gross_amount) FROM public.private_service_payments pp
         WHERE lower(trim(pp.instructor_email)) = lower(trim(u.email)) AND pp.status = 'VERIFIED'), 0)
      ) AS gross_collected,
      (
        COALESCE((SELECT SUM(pay.platform_amount) FROM public.payments pay
         WHERE lower(trim(pay.instructor_email)) = lower(trim(u.email)) AND pay.status = 'VERIFIED'), 0)
        + COALESCE((SELECT SUM(pp.platform_amount) FROM public.private_service_payments pp
         WHERE lower(trim(pp.instructor_email)) = lower(trim(u.email)) AND pp.status = 'VERIFIED'), 0)
      ) AS platform_share,
      (
        COALESCE((SELECT SUM(pay.instructor_amount) FROM public.payments pay
         WHERE lower(trim(pay.instructor_email)) = lower(trim(u.email)) AND pay.status = 'VERIFIED'), 0)
        + COALESCE((SELECT SUM(pp.instructor_amount) FROM public.private_service_payments pp
         WHERE lower(trim(pp.instructor_email)) = lower(trim(u.email)) AND pp.status = 'VERIFIED'), 0)
      ) AS instructor_net,
      COALESCE((SELECT SUM(s.net_instructor_payout) FROM public.instructor_settlements s
       WHERE lower(trim(s.instructor_email)) = lower(trim(u.email)) AND s.status = 'PAID'), 0) AS paid_out,
      COALESCE((SELECT SUM(s.net_instructor_payout) FROM public.instructor_settlements s
       WHERE lower(trim(s.instructor_email)) = lower(trim(u.email)) AND s.status = 'PENDING'), 0) AS pending_settlement
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.instructor_profiles ip ON ip.user_id = p.id
    WHERE p.role IN ('instructor', 'super_admin')
  ) r;

  SELECT COALESCE(jsonb_agg(row_to_json(s)::jsonb ORDER BY s.created_at DESC), '[]'::jsonb)
  INTO v_settlements
  FROM (
    SELECT
      id,
      instructor_email,
      period_start,
      period_end,
      verified_payments_count,
      gross_collected,
      platform_share,
      processing_fees,
      net_instructor_payout,
      currency,
      status,
      payout_method,
      payout_reference,
      paid_at,
      note,
      created_at
    FROM public.instructor_settlements
    ORDER BY created_at DESC
    LIMIT 100
  ) s;

  RETURN jsonb_build_object(
    'default_commission_pct', v_default_pct,
    'currency', v_currency,
    'verified_payments_count', v_verified_count,
    'pending_payments_count', v_pending_count,
    'refunded_payments_count', v_refunded_count,
    'total_gross_verified', v_gross_verified,
    'total_platform_revenue', v_platform_rev,
    'total_instructor_share', v_instructor_share,
    'total_processing_fees', v_processing_fees,
    'total_refunded_gross', v_refunded_gross,
    'total_settled_paid', v_settled_paid,
    'total_settlements_pending', v_settled_pending,
    'instructors', v_instructors,
    'settlements', v_settlements
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_super_admin_financial_overview() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_super_admin_financial_overview() TO authenticated;

-- ------------------------------------------------------------------------------
-- 8) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 030 (private services stage 3 - private_service_payments ledger, immutable snapshots, duplicate-ref + single-verified-per-booking indexes, auto-sync to booking payment_verified, settlement & instructor-ledger integration, zero client write policies; zero rows fabricated) applied';
