-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 025
-- Settlements, Instructor Read-Only Financial Ledger & Super-Admin Overview
-- (GOVERNANCE Phase 4, step 6 of 020-026)
--
-- WHY:
--   Migrations 021, 023, and 024 established the unified payments ledger,
--   centralized enrollment/payment verification, and course pricing history.
--   Now the platform needs:
--     1. A tamper-protected `instructor_settlements` ledger recording payouts
--        owed/paid to instructors from VERIFIED payments.
--     2. Super-admin commission management RPCs (`set_instructor_commission`,
--        `set_default_platform_commission`) with full audit logging.
--     3. Settlement lifecycle RPCs (`create_instructor_settlement`,
--        `set_settlement_status`) computed strictly from real VERIFIED rows in
--        `public.payments` (never fabricated).
--     4. Read-only aggregation RPCs (`get_instructor_financial_ledger` for
--        each instructor's own earnings, `get_super_admin_financial_overview`
--        for the academy founder).
--
-- HARD GUARANTEES:
--   - ZERO settlement rows or payment rows are fabricated; tables start EMPTY.
--   - Instructors have STRICT READ-ONLY access to their own ledger and
--     settlements; they can never create, edit, or approve a settlement or
--     commission rate.
--   - Monetary and period columns on `instructor_settlements` are immutable
--     after insert; DELETE is forbidden for everyone (`trg_settlements_guard`).
--   - Every write logs an immutable row in `public.audit_logs`.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it (errors-log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) instructor_settlements: append-only payout ledger.
--    Read = super_admin, secretary, or the instructor who owns the settlement.
--    Writes = security-definer RPCs only (zero client write policies).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructor_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid REFERENCES auth.users(id),
  instructor_email text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL CHECK (period_end >= period_start),
  verified_payments_count int NOT NULL DEFAULT 0 CHECK (verified_payments_count >= 0),
  gross_collected numeric(12,2) NOT NULL DEFAULT 0 CHECK (gross_collected >= 0),
  platform_share numeric(12,2) NOT NULL DEFAULT 0 CHECK (platform_share >= 0),
  processing_fees numeric(12,2) NOT NULL DEFAULT 0 CHECK (processing_fees >= 0),
  net_instructor_payout numeric(12,2) NOT NULL DEFAULT 0 CHECK (net_instructor_payout >= 0),
  currency text NOT NULL DEFAULT 'EGP',
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
  payout_method text
    CHECK (payout_method IS NULL OR payout_method IN ('bank_transfer', 'instapay', 'vodafone_cash', 'cash', 'other')),
  payout_reference text,
  paid_by uuid REFERENCES auth.users(id),
  paid_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlements_instructor
  ON public.instructor_settlements (instructor_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settlements_status
  ON public.instructor_settlements (status, created_at DESC);

ALTER TABLE public.instructor_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settlements read own or office" ON public.instructor_settlements;
CREATE POLICY "settlements read own or office" ON public.instructor_settlements
  FOR SELECT USING (
    public.is_super_admin()
    OR public.is_secretary()
    OR instructor_id = auth.uid()
    OR lower(trim(instructor_email)) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- NO INSERT / UPDATE / DELETE policies: clients never write to this table.

-- ------------------------------------------------------------------------------
-- 1b) trg_settlements_guard: immutability of financial snapshots + legal status
--     transitions + no deletes for anyone.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_settlements_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'instructor_settlements: DELETE is forbidden - cancel a PENDING settlement instead of erasing financial history';
  END IF;

  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Terminal states are frozen forever.
  IF OLD.status IN ('PAID', 'CANCELLED') THEN
    RAISE EXCEPTION 'instructor_settlements: terminal state % is immutable', OLD.status;
  END IF;

  -- Snapshot money and identity columns never change after insert.
  IF NEW.instructor_id IS DISTINCT FROM OLD.instructor_id
     OR NEW.instructor_email IS DISTINCT FROM OLD.instructor_email
     OR NEW.period_start IS DISTINCT FROM OLD.period_start
     OR NEW.period_end IS DISTINCT FROM OLD.period_end
     OR NEW.verified_payments_count IS DISTINCT FROM OLD.verified_payments_count
     OR NEW.gross_collected IS DISTINCT FROM OLD.gross_collected
     OR NEW.platform_share IS DISTINCT FROM OLD.platform_share
     OR NEW.processing_fees IS DISTINCT FROM OLD.processing_fees
     OR NEW.net_instructor_payout IS DISTINCT FROM OLD.net_instructor_payout
     OR NEW.currency IS DISTINCT FROM OLD.currency THEN
    RAISE EXCEPTION 'instructor_settlements: monetary and period columns are immutable';
  END IF;

  -- Legal transitions from PENDING: PAID or CANCELLED only.
  IF NOT (OLD.status = 'PENDING' AND NEW.status IN ('PAID', 'CANCELLED')) THEN
    RAISE EXCEPTION 'instructor_settlements: illegal status transition % -> %', OLD.status, NEW.status;
  END IF;

  IF NEW.status = 'PAID' AND (NEW.paid_by IS NULL OR NEW.paid_at IS NULL) THEN
    RAISE EXCEPTION 'instructor_settlements: PAID requires paid_by and paid_at';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_settlements_guard ON public.instructor_settlements;
CREATE TRIGGER trg_settlements_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.instructor_settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_settlements_guard();

-- ------------------------------------------------------------------------------
-- 2) Commission governance RPCs (Super Admin ONLY + audited).
--    Note: trg_profiles_protect_commission (021) already enforces
--    is_super_admin() on profiles.platform_commission_pct updates.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_instructor_commission(
  p_instructor_email text,
  p_commission_pct numeric DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_instructor_email, '')));
  v_user_id uuid;
  v_old_pct numeric;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: only the academy founder (super_admin) can set instructor commission rates';
  END IF;

  IF v_email = '' THEN
    RAISE EXCEPTION 'instructor email is required';
  END IF;

  IF p_commission_pct IS NOT NULL AND (p_commission_pct < 0 OR p_commission_pct > 100) THEN
    RAISE EXCEPTION 'commission percentage must be between 0 and 100';
  END IF;

  SELECT u.id, p.platform_commission_pct
    INTO v_user_id, v_old_pct
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE lower(trim(u.email)) = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'instructor profile not found for %', v_email;
  END IF;

  UPDATE public.profiles
  SET platform_commission_pct = p_commission_pct
  WHERE id = v_user_id;

  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id,
    summary, details, source, note
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    'super_admin',
    'commission.instructor.set',
    'profile',
    v_user_id::text,
    'instructor commission for ' || v_email || ': '
      || coalesce(v_old_pct::text || '%', 'DEFAULT') || ' -> '
      || coalesce(p_commission_pct::text || '%', 'DEFAULT'),
    jsonb_build_object(
      'instructor_email', v_email,
      'old_commission_pct', v_old_pct,
      'new_commission_pct', p_commission_pct
    ),
    'rpc',
    nullif(trim(coalesce(p_note, '')), '')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_instructor_commission(text, numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_instructor_commission(text, numeric, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_default_platform_commission(
  p_commission_pct numeric,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_val text;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: only the academy founder (super_admin) can change the default platform commission';
  END IF;

  IF p_commission_pct IS NULL OR p_commission_pct < 0 OR p_commission_pct > 100 THEN
    RAISE EXCEPTION 'default commission percentage must be between 0 and 100';
  END IF;

  SELECT value INTO v_old_val
  FROM public.platform_settings
  WHERE key = 'default_platform_commission_pct';

  INSERT INTO public.platform_settings (key, value, updated_by, updated_at)
  VALUES ('default_platform_commission_pct', p_commission_pct::text, auth.uid(), now())
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_by = auth.uid(),
    updated_at = now();

  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id,
    summary, details, source, note
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    'super_admin',
    'commission.default.set',
    'platform_settings',
    'default_platform_commission_pct',
    'default platform commission: ' || coalesce(v_old_val, '?') || '% -> ' || p_commission_pct::text || '%',
    jsonb_build_object('old_pct', v_old_val, 'new_pct', p_commission_pct),
    'rpc',
    nullif(trim(coalesce(p_note, '')), '')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_default_platform_commission(numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_default_platform_commission(numeric, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3) create_instructor_settlement: computes a settlement strictly from real
--    VERIFIED payments in [p_period_start, p_period_end]. Refuses if 0 verified
--    payments exist in that window (never fabricates zero-value settlements).
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

  SELECT id INTO v_inst_id FROM auth.users WHERE lower(trim(email)) = v_email;

  SELECT
    COUNT(*)::int,
    COALESCE(SUM(gross_amount), 0),
    COALESCE(SUM(platform_amount), 0),
    COALESCE(SUM(processing_fee), 0),
    COALESCE(SUM(instructor_amount), 0),
    COALESCE(MAX(currency), 'EGP')
  INTO v_count, v_gross, v_platform, v_fees, v_net, v_currency
  FROM public.payments
  WHERE lower(trim(instructor_email)) = v_email
    AND status = 'VERIFIED'
    AND (coalesce(verified_at, created_at) AT TIME ZONE 'UTC')::date
        BETWEEN p_period_start AND p_period_end;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'no VERIFIED payments found for % between % and % (settlements cannot be fabricated)',
      v_email, p_period_start, p_period_end;
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
      'currency', v_currency
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
-- 4) set_settlement_status: marks a PENDING settlement as PAID (super_admin
--    only) or CANCELLED (super_admin or secretary, mandatory reason).
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

  SELECT * INTO v_row FROM public.instructor_settlements WHERE id = p_settlement_id;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'settlement not found';
  END IF;

  UPDATE public.instructor_settlements
  SET status = p_new_status,
      payout_method = CASE WHEN p_new_status = 'PAID' THEN coalesce(nullif(trim(p_payout_method), ''), payout_method, 'instapay') ELSE payout_method END,
      payout_reference = CASE WHEN p_new_status = 'PAID' THEN coalesce(nullif(trim(p_payout_reference), ''), payout_reference) ELSE payout_reference END,
      paid_by = CASE WHEN p_new_status = 'PAID' THEN auth.uid() ELSE paid_by END,
      paid_at = CASE WHEN p_new_status = 'PAID' THEN now() ELSE paid_at END,
      note = coalesce(nullif(trim(p_note), ''), note)
  WHERE id = p_settlement_id;

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
      'payout_reference', p_payout_reference
    ),
    'rpc',
    nullif(trim(coalesce(p_note, '')), '')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_settlement_status(uuid, text, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_settlement_status(uuid, text, text, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 5) get_instructor_financial_ledger: READ-ONLY financial view for an
--    instructor (their own courses/payments/settlements ONLY, zero student PII)
--    or super_admin inspecting a specific instructor.
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
  v_caller_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
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
  FROM public.payments
  WHERE lower(trim(instructor_email)) = v_target_email;

  SELECT
    COALESCE(SUM(net_instructor_payout) FILTER (WHERE status = 'PAID'), 0),
    COALESCE(SUM(net_instructor_payout) FILTER (WHERE status = 'PENDING'), 0)
  INTO v_paid_out, v_pending_settlement
  FROM public.instructor_settlements
  WHERE lower(trim(instructor_email)) = v_target_email;

  -- PII-free payment rows for the instructor (course + amounts + status, no student email/phone)
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
    'settlements', v_settlements
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_instructor_financial_ledger(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_instructor_financial_ledger(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 6) get_super_admin_financial_overview: academy-wide financial overview
--    (super_admin OR secretary for operational settlement prep; commission
--    mutations remain super_admin ONLY).
-- ------------------------------------------------------------------------------
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
  FROM public.payments;

  SELECT
    COALESCE(SUM(net_instructor_payout) FILTER (WHERE status = 'PAID'), 0),
    COALESCE(SUM(net_instructor_payout) FILTER (WHERE status = 'PENDING'), 0)
  INTO v_settled_paid, v_settled_pending
  FROM public.instructor_settlements;

  -- Per-instructor breakdown across all instructors in profiles + instructor_profiles
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
      COALESCE((SELECT COUNT(*)::int FROM public.payments pay
       WHERE lower(trim(pay.instructor_email)) = lower(trim(u.email)) AND pay.status = 'VERIFIED'), 0) AS verified_payments_count,
      COALESCE((SELECT SUM(pay.gross_amount) FROM public.payments pay
       WHERE lower(trim(pay.instructor_email)) = lower(trim(u.email)) AND pay.status = 'VERIFIED'), 0) AS gross_collected,
      COALESCE((SELECT SUM(pay.platform_amount) FROM public.payments pay
       WHERE lower(trim(pay.instructor_email)) = lower(trim(u.email)) AND pay.status = 'VERIFIED'), 0) AS platform_share,
      COALESCE((SELECT SUM(pay.instructor_amount) FROM public.payments pay
       WHERE lower(trim(pay.instructor_email)) = lower(trim(u.email)) AND pay.status = 'VERIFIED'), 0) AS instructor_net,
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
-- 7) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 025 (settlements + instructor read-only financial ledger + super-admin financial overview + commission RPCs; zero fabricated rows) applied';
