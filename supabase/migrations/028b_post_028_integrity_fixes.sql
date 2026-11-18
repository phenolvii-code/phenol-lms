-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 028b (addendum to 024 / 026 / 028)
-- Post-028 Integrity & Governance Fixes:
--   1. Defines missing public.is_instructor() SECURITY DEFINER helper called by
--      propose_private_service() in 028 (was previously only in unapplied draft 007).
--   2. Gates update_my_private_service() with public.is_instructor() as well.
--   3. Enforces courses.is_published in "courses read public" & "lessons read public"
--      RLS policies while preserving access for owners and actively enrolled students,
--      and keeps courses.is_published synced in set_course_approval().
--   4. Aligns create_instructor_settlement() payment-period date window from UTC
--      to 'Africa/Cairo' (matching 028 and academy operational time).
--
-- HARD GUARANTEES:
--   - is_instructor() never includes secretary or student roles.
--   - No client write policy is added anywhere.
--   - Actively enrolled students do not lose access when a course is unpublished
--     (hidden from new enrollment / public browsing).
--   - Safe and idempotent to run on live DB after 028.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) Define public.is_instructor() (matching public.is_admin() semantics)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('instructor', 'super_admin')
  ) OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND lower(trim(email)) = 'phenolvii@gmail.com'
  );
$$;

REVOKE ALL ON FUNCTION public.is_instructor() FROM public;
GRANT EXECUTE ON FUNCTION public.is_instructor() TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2) Harden update_my_private_service() so demoted former instructors cannot edit
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_my_private_service(
  p_service_id uuid,
  p_title text,
  p_description text DEFAULT NULL,
  p_duration_minutes integer DEFAULT 60,
  p_delivery_mode text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  v_mode text;
  v_row public.private_services;
BEGIN
  IF NOT public.is_instructor() THEN
    RAISE EXCEPTION 'forbidden: only an instructor can edit a private service proposal';
  END IF;

  SELECT * INTO v_row FROM public.private_services WHERE id = p_service_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'private service not found';
  END IF;
  IF lower(btrim(v_row.instructor_email)) <> v_email THEN
    RAISE EXCEPTION 'forbidden: this service belongs to another instructor';
  END IF;

  v_mode := lower(btrim(coalesce(p_delivery_mode, v_row.delivery_mode)));
  IF v_mode NOT IN ('external_link', 'internal') THEN
    RAISE EXCEPTION 'private service: invalid delivery mode %', p_delivery_mode;
  END IF;

  UPDATE public.private_services
  SET title = btrim(p_title),
      description = nullif(btrim(coalesce(p_description, '')), ''),
      duration_minutes = coalesce(p_duration_minutes, v_row.duration_minutes),
      delivery_mode = v_mode
  WHERE id = p_service_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_private_service(uuid, text, text, integer, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.update_my_private_service(uuid, text, text, integer, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3) Enforce courses.is_published in RLS and keep set_course_approval synced
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "courses read public" ON public.courses;
CREATE POLICY "courses read public" ON public.courses
FOR SELECT USING (
  (approval_status = 'APPROVED' AND is_published = true)
  OR public.owns_course(id)
  OR public.has_active_enrollment(id)
);

DROP POLICY IF EXISTS "lessons read public" ON public.lessons;
CREATE POLICY "lessons read public" ON public.lessons
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id
      AND (
        (c.approval_status = 'APPROVED' AND c.is_published = true)
        OR public.owns_course(c.id)
        OR public.has_active_enrollment(c.id)
      )
  )
);

CREATE OR REPLACE FUNCTION public.set_course_approval(
  p_course_id text,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status text;
  v_actor_role text;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: course approval is centralized - only the academy office (secretary/founder) can approve or reject courses';
  END IF;

  IF p_status NOT IN ('PENDING', 'APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'bad approval status: %', p_status;
  END IF;

  SELECT approval_status INTO v_old_status FROM public.courses WHERE id = p_course_id;
  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'course not found';
  END IF;

  UPDATE public.courses
  SET approval_status = p_status,
      is_published = (p_status = 'APPROVED')
  WHERE id = p_course_id;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id,
    summary, details, source
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    'course.approval',
    'course',
    p_course_id,
    'course approval: ' || coalesce(v_old_status, '?') || ' -> ' || p_status,
    jsonb_build_object('old_status', v_old_status, 'new_status', p_status),
    'rpc'
  );
END $$;

REVOKE ALL ON FUNCTION public.set_course_approval(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_course_approval(text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 4) Align create_instructor_settlement period date boundaries to Africa/Cairo
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
  FROM public.payments
  WHERE lower(trim(instructor_email)) = v_email
    AND status = 'VERIFIED'
    AND settlement_id IS NULL
    AND (coalesce(verified_at, created_at) AT TIME ZONE 'Africa/Cairo')::date
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
-- 5) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 028 (028b integrity addendum applied: is_instructor helper defined + update_my_private_service gated, courses/lessons RLS enforce is_published with active-enrollment preservation, set_course_approval syncs is_published, settlement period dates evaluated in Africa/Cairo; zero rows fabricated) applied';
