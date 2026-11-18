-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 026
-- Academy office enablement + settlement integrity
-- (GOVERNANCE Phase 1, corrective step before private services)
--
-- WHY THIS MIGRATION EXISTS (two real defects found in the 020-025 review):
--
--   1) SETTLEMENT DOUBLE-PAY (money bug):
--      create_instructor_settlement() summed EVERY verified payment inside an
--      arbitrary date range. Nothing tied a payment to the settlement that paid
--      it, so two overlapping/repeated periods could pay the same money twice.
--      FIX: payments.settlement_id + row locks + "unsettled only" selection +
--      one active settlement per (instructor, period). Cancel = unlink.
--
--   2) THE SECRETARY COULD NOT READ WHAT SHE MUST DECIDE:
--      payments/course_enrollments read policies never granted is_secretary(),
--      and no office RPC exposed the payment list or the enrollment queue.
--      FIX: office_list_payments() + office_list_enrollment_queue() (definer,
--      office-gated), so the UI never reads those tables directly.
--
-- HARD GUARANTEES:
--   - No historical row is rewritten or deleted. Existing payments start with
--     settlement_id = NULL (never settled) - which is the truth.
--   - Instructors/students still cannot read payments/enrollments they do not
--     own, and cannot write anything here.
--   - A payment linked to a settlement can no longer be refunded (cancel the
--     PENDING settlement first; PAID settlements are terminal by design).
--   - Settlements can never be fabricated: zero unsettled verified payments in
--     the period = explicit exception, never a zero-value row.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) payments.settlement_id: the missing link between money and payout.
--    NULL = never settled. Set only by the office RPCs below.
-- ------------------------------------------------------------------------------
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS settlement_id uuid;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_settlement_id_fkey'
      AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_settlement_id_fkey
      FOREIGN KEY (settlement_id) REFERENCES public.instructor_settlements(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_settlement
  ON public.payments (settlement_id)
  WHERE settlement_id IS NOT NULL;

-- One ACTIVE settlement per instructor + exact period. A cancelled settlement
-- releases the slot (and unlinks its payments), so a corrected one can be made.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM public.instructor_settlements
    WHERE status <> 'CANCELLED'
    GROUP BY lower(instructor_email), period_start, period_end
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'cannot add the duplicate-period guard: active duplicate settlements already exist - review them first';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_settlements_instructor_period_active
  ON public.instructor_settlements (lower(instructor_email), period_start, period_end)
  WHERE status <> 'CANCELLED';

-- ------------------------------------------------------------------------------
-- 2) trg_payments_guard: allow the settlement link to be set/cleared by the
--    academy office ONLY, and only as the sole change on the row. Every other
--    rule from 021 is preserved verbatim (terminal freeze, immutable money,
--    legal transitions, accountable VERIFIED).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_payments_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;  -- inserts arrive only via definer paths; shape validated there
  END IF;

  -- Terminal rows are frozen (corrections = new reversal/adjustment rows).
  IF OLD.status IN ('REFUNDED', 'CANCELLED', 'FAILED') THEN
    RAISE EXCEPTION 'payments: terminal state % is immutable', OLD.status;
  END IF;

  -- 026: settlement linkage is the ONE legal non-status update, and only the
  -- academy office can perform it. It must never ride along with other edits.
  IF NEW.settlement_id IS DISTINCT FROM OLD.settlement_id THEN
    IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
      RAISE EXCEPTION 'payments: only the academy office can link a payment to a settlement';
    END IF;

    IF NEW.status           IS DISTINCT FROM OLD.status
       OR NEW.student_id      IS DISTINCT FROM OLD.student_id
       OR NEW.student_email   IS DISTINCT FROM OLD.student_email
       OR NEW.course_id       IS DISTINCT FROM OLD.course_id
       OR NEW.instructor_email IS DISTINCT FROM OLD.instructor_email
       OR NEW.method          IS DISTINCT FROM OLD.method
       OR NEW.gross_amount    IS DISTINCT FROM OLD.gross_amount
       OR NEW.currency        IS DISTINCT FROM OLD.currency
       OR NEW.price_snapshot  IS DISTINCT FROM OLD.price_snapshot
       OR NEW.platform_commission_pct IS DISTINCT FROM OLD.platform_commission_pct
       OR NEW.platform_amount IS DISTINCT FROM OLD.platform_amount
       OR NEW.instructor_amount IS DISTINCT FROM OLD.instructor_amount
       OR NEW.processing_fee  IS DISTINCT FROM OLD.processing_fee
       OR NEW.reference       IS DISTINCT FROM OLD.reference
       OR NEW.collected_at    IS DISTINCT FROM OLD.collected_at
       OR NEW.verified_by     IS DISTINCT FROM OLD.verified_by
       OR NEW.verified_at     IS DISTINCT FROM OLD.verified_at THEN
      RAISE EXCEPTION 'payments: settlement linkage must be the only change on this row';
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- Money and entity columns never change after insert.
  IF NEW.student_id      IS DISTINCT FROM OLD.student_id
     OR NEW.student_email IS DISTINCT FROM OLD.student_email
     OR NEW.course_id     IS DISTINCT FROM OLD.course_id
     OR NEW.instructor_email IS DISTINCT FROM OLD.instructor_email
     OR NEW.method        IS DISTINCT FROM OLD.method
     OR NEW.gross_amount  IS DISTINCT FROM OLD.gross_amount
     OR NEW.currency      IS DISTINCT FROM OLD.currency
     OR NEW.price_snapshot IS DISTINCT FROM OLD.price_snapshot
     OR NEW.platform_commission_pct IS DISTINCT FROM OLD.platform_commission_pct
     OR NEW.platform_amount IS DISTINCT FROM OLD.platform_amount
     OR NEW.instructor_amount IS DISTINCT FROM OLD.instructor_amount
     OR NEW.processing_fee IS DISTINCT FROM OLD.processing_fee
     OR NEW.reference     IS DISTINCT FROM OLD.reference
     OR NEW.collected_at  IS DISTINCT FROM OLD.collected_at THEN
    RAISE EXCEPTION 'payments: monetary and entity columns are immutable';
  END IF;

  -- Legal status transitions only (VERIFIED -> REFUNDED is the one exit).
  IF NOT (
       (OLD.status = 'PENDING'      AND NEW.status IN ('UNDER_REVIEW', 'FAILED', 'CANCELLED'))
    OR (OLD.status = 'UNDER_REVIEW' AND NEW.status IN ('VERIFIED', 'FAILED', 'CANCELLED'))
    OR (OLD.status = 'VERIFIED'     AND NEW.status = 'REFUNDED')
  ) THEN
    RAISE EXCEPTION 'payments: illegal status transition % -> %', OLD.status, NEW.status;
  END IF;

  -- No blind confirmation: VERIFIED needs an accountable human.
  IF NEW.status = 'VERIFIED' AND (NEW.verified_by IS NULL OR NEW.verified_at IS NULL) THEN
    RAISE EXCEPTION 'payments: VERIFIED requires verified_by and verified_at';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_guard ON public.payments;
CREATE TRIGGER trg_payments_guard
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_payments_guard();

-- ------------------------------------------------------------------------------
-- 3) create_instructor_settlement: now pays ONLY unsettled verified payments,
--    locks them, stamps settlement_id, and refuses duplicate active periods.
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

  -- One active settlement per instructor + exact period (the unique index is
  -- the backstop; this check gives the office a readable error).
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

  -- Lock the exact rows this settlement will pay. A second concurrent attempt
  -- waits here, then sees settlement_id already set and finds 0 rows.
  PERFORM 1
  FROM public.payments
  WHERE lower(trim(instructor_email)) = v_email
    AND status = 'VERIFIED'
    AND settlement_id IS NULL
    AND (coalesce(verified_at, created_at) AT TIME ZONE 'UTC')::date
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
  FROM public.payments
  WHERE lower(trim(instructor_email)) = v_email
    AND status = 'VERIFIED'
    AND settlement_id IS NULL
    AND (coalesce(verified_at, created_at) AT TIME ZONE 'UTC')::date
        BETWEEN p_period_start AND p_period_end;

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

  -- Stamp exactly the rows that were summed. From now on they cannot be paid
  -- again, cannot be refunded, and are visibly tied to this payout.
  UPDATE public.payments
  SET settlement_id = v_settlement_id
  WHERE lower(trim(instructor_email)) = v_email
    AND status = 'VERIFIED'
    AND settlement_id IS NULL
    AND (coalesce(verified_at, created_at) AT TIME ZONE 'UTC')::date
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
      'payments_linked', true
    ),
    'rpc',
    nullif(trim(coalesce(p_note, '')), '')
  );

  RETURN v_settlement_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_instructor_settlement(text, date, date, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_instructor_settlement(text, date, date, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 4) set_settlement_status: cancelling a settlement UNLINKS its payments (so a
--    corrected settlement can be prepared). PAID stays terminal. No invented
--    payout method: if none was provided, it stays NULL.
-- ------------------------------------------------------------------------------
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

  -- Cancellation releases the money for a corrected settlement. The payments
  -- remain VERIFIED (they were real); only the payout link is cleared.
  IF p_new_status = 'CANCELLED' THEN
    UPDATE public.payments
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
-- 5) set_payment_status: same as 023 plus the settlement guard. A settled
--    payment cannot be refunded (cancel the PENDING settlement first; a PAID
--    settlement is terminal, so its money is already out the door).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_payment_status(
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
  p public.payments;
  v_student public.registered_students;
  v_course public.courses;
  v_enr public.course_enrollments;
  v_actor_role text;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office (secretary/founder) can decide payments';
  END IF;
  IF p_new_status NOT IN ('UNDER_REVIEW','VERIFIED','FAILED','CANCELLED','REFUNDED') THEN
    RAISE EXCEPTION 'invalid status: %', p_new_status;
  END IF;

  SELECT * INTO p FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF p.id IS NULL THEN
    RAISE EXCEPTION 'payment not found';
  END IF;

  -- Mirror the 021 guard for a friendly error before touching the row.
  IF NOT (
       (p.status = 'PENDING'      AND p_new_status IN ('UNDER_REVIEW', 'FAILED', 'CANCELLED'))
    OR (p.status = 'UNDER_REVIEW' AND p_new_status IN ('VERIFIED', 'FAILED', 'CANCELLED'))
    OR (p.status = 'VERIFIED'     AND p_new_status = 'REFUNDED')
  ) THEN
    RAISE EXCEPTION 'illegal payment transition % -> %', p.status, p_new_status;
  END IF;

  IF p_new_status = 'REFUNDED' AND (p_note IS NULL OR btrim(p_note) = '') THEN
    RAISE EXCEPTION 'a refund requires a written reason (note)';
  END IF;

  -- 026: money already in a settlement cannot silently leave the ledger.
  IF p_new_status = 'REFUNDED' AND p.settlement_id IS NOT NULL THEN
    RAISE EXCEPTION 'this payment is linked to a settlement - cancel the settlement before refunding';
  END IF;

  UPDATE public.payments
  SET status = p_new_status,
      verified_by = CASE WHEN p_new_status = 'VERIFIED' THEN auth.uid() ELSE verified_by END,
      verified_at = CASE WHEN p_new_status = 'VERIFIED' THEN now()  ELSE verified_at END
  WHERE id = p_payment_id;

  -- SUBSCRIPTION GATE: a VERIFIED payment activates the student's enrollment.
  IF p_new_status = 'VERIFIED' THEN
    SELECT * INTO v_student FROM public.registered_students
    WHERE lower(trim(email)) = lower(p.student_email);
    SELECT * INTO v_course FROM public.courses WHERE id = p.course_id;

    IF v_student.id IS NOT NULL AND v_course.id IS NOT NULL THEN
      INSERT INTO public.course_enrollments (
        id, student_id, student_email, student_name, student_phone,
        student_code, student_track, course_id, course_title, course_code,
        status, approved_at
      )
      VALUES (
        'enr-' || gen_random_uuid()::text,
        v_student.id, v_student.email, v_student.name, v_student.phone,
        v_student.academic_code, v_student.academic_track,
        v_course.id, v_course.title, v_course.code, 'ACTIVE', now()
      )
      ON CONFLICT ON CONSTRAINT course_enrollments_student_course_key DO UPDATE
      SET status = 'ACTIVE', approved_at = now()
      RETURNING * INTO v_enr;

      IF v_student.id ~ '^[0-9a-fA-F-]{36}$' THEN
        UPDATE public.referrals
        SET status = 'rewarded', points = 50, rewarded_at = now()
        WHERE referred_id = v_student.id::uuid AND status = 'registered';
      END IF;
    END IF;
  END IF;

  -- Audit trail (022).
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id,
    summary, details, source
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    'payment.status',
    'payment',
    p_payment_id::text,
    'payment decision: ' || p.status || ' -> ' || p_new_status
      || ' (' || p.gross_amount::text || ' EGP, ' || p.student_email || ')',
    jsonb_build_object(
      'old_status', p.status, 'new_status', p_new_status,
      'student_email', p.student_email, 'course_id', p.course_id,
      'gross_amount', p.gross_amount, 'note', p_note,
      'enrollment_activated', (p_new_status = 'VERIFIED')
    ),
    'rpc'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_payment_status(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_payment_status(uuid, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 6) office_list_payments: the secretary's payment desk (definer, office-only).
--    Replaces the direct table select that RLS silently emptied for her.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.office_list_payments()
RETURNS TABLE (
  id uuid,
  student_email text,
  course_id text,
  course_title text,
  instructor_email text,
  method text,
  gross_amount numeric,
  currency text,
  status text,
  reference text,
  collected_at timestamptz,
  price_snapshot numeric,
  platform_commission_pct numeric,
  platform_amount numeric,
  instructor_amount numeric,
  processing_fee numeric,
  settlement_id uuid,
  created_at timestamptz,
  verified_at timestamptz,
  note text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.student_email, p.course_id, c.title, p.instructor_email,
         p.method, p.gross_amount, p.currency, p.status, p.reference,
         p.collected_at, p.price_snapshot, p.platform_commission_pct,
         p.platform_amount, p.instructor_amount, p.processing_fee,
         p.settlement_id, p.created_at, p.verified_at, p.note
  FROM public.payments p
  LEFT JOIN public.courses c ON c.id = p.course_id
  WHERE public.is_super_admin() OR public.is_secretary()
  ORDER BY p.created_at DESC
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.office_list_payments() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_list_payments() TO authenticated;

-- ------------------------------------------------------------------------------
-- 7) office_list_enrollment_queue: the office's enrollment queue + recent
--    decisions (definer, office-only). Fixes the same RLS blindness for
--    course_enrollments.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.office_list_enrollment_queue()
RETURNS TABLE (
  id text,
  student_email text,
  student_name text,
  student_phone text,
  student_code text,
  student_track text,
  course_id text,
  course_title text,
  course_code text,
  status text,
  requested_at timestamptz,
  approved_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.student_email, e.student_name, e.student_phone,
         e.student_code, e.student_track, e.course_id, e.course_title,
         e.course_code, e.status, e.requested_at, e.approved_at
  FROM public.course_enrollments e
  WHERE public.is_super_admin() OR public.is_secretary()
  ORDER BY e.requested_at DESC NULLS LAST, e.id DESC
  LIMIT 300;
$$;

REVOKE ALL ON FUNCTION public.office_list_enrollment_queue() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_list_enrollment_queue() TO authenticated;

-- ------------------------------------------------------------------------------
-- 8) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 026 (academy office enablement: payments.settlement_id linkage + locked unsettled-only settlement creation + duplicate-period guard, cancel-unlinks, refund blocked on settled payments, office_list_payments + office_list_enrollment_queue definer reads; zero fabricated rows) applied';
