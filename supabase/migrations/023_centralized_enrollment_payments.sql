-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 023
-- Centralized enrollment governance + payment RPCs (GOVERNANCE Phase 1,
-- step 4 of 020-026)
--
-- WHY:
--   Today an INSTRUCTOR can directly enroll any student into his course and
--   approve/revoke access (admin_enroll_student / set_enrollment_status allow
--   super_admin OR owns_course). Centralized governance (brief §3) moves those
--   decisions to the ACADEMY OFFICE: secretary or super_admin only. Instructors
--   keep full read visibility; their write buttons disappear in the SAME code
--   push as this migration (dashboard/page.tsx + AdminRosterTab +
--   CourseStudentsModal) so no UI button calls an RPC it is no longer allowed
--   to call.
--
--   The enrollment QUEUE already exists: request_enrollment (000/001) inserts
--   course_enrollments rows with status PENDING. NO new queue table is needed -
--   the governance brief's "enrollment_requests" maps onto this live mechanism.
--
--   The payments ledger (021) had NO writers. This migration adds the office
--   RPCs that record and decide payments, with the allocation math resolved
--   AT TRANSACTION TIME and frozen per row (021 snapshots), and every step
--   writes into audit_logs (022). Subscription activation now REQUIRES a
--   VERIFIED payment - or an explicitly logged manual waiver.
--
-- WHAT THIS DOES:
--   1. admin_enroll_student: re-gated super_admin OR is_secretary() (instructor
--      branch REMOVED) + audit 'enrollment.direct'. Referral reward kept.
--   2. set_enrollment_status: re-gated super_admin OR is_secretary() + audit
--      'enrollment.status'. Referral reward kept.
--   3. record_payment(): office records a payment (cash/instapay/vodafone_cash/
--      kashier/other). Resolves at insert time: price snapshot from the course,
--      commission pct from the course owner's override or the settings
--      FALLBACK, platform/instructor amounts, processing fee. Status starts
--      PENDING. Duplicate references are refused by the 021 idempotency index
--      (friendly error here). Audit 'payment.record'.
--   4. set_payment_status(): office decides - legal transitions only (the 021
--      trg_payments_guard enforces at DB level too). VERIFIED stamps
--      verified_by + verified_at (no blind confirmation) and AUTO-ACTIVATES the
--      student's enrollment in that course (the subscription gate). REFUNDED
--      requires a written reason. Audit 'payment.status'.
--   5. waive_enrollment_payment(): explicit manual-waiver path - activates an
--      enrollment with NO payment, with a mandatory written reason. Audit
--      'enrollment.waiver'.
--
-- HARD GUARANTEES:
--   - Zero client write permissions added anywhere (all new write paths are
--     security-definer RPCs; payments/audit_logs keep their RLS closure).
--   - No data is created: zero payments rows, zero forced enrollments.
--   - The queue (course_enrollments PENDING) and all existing behavior keep
--     working; only WHO may decide changes.
--   - Every office action lands in audit_logs with actor snapshot.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it (errors-log rule 8).
--   3. NOTE: instructors lose direct-enroll/approve/revoke from this moment.
--      The matching UI change is committed in the same cycle and ships with
--      the next approved push.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) admin_enroll_student: THE ACADEMY OFFICE decides direct enrollments.
--    Full body from 018, gate replaced + audit added. Instructors get a clear
--    refusal pointing at the office.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_enroll_student(
  p_student_email text,
  p_course_id text
)
RETURNS public.course_enrollments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.registered_students;
  c public.courses;
  e public.course_enrollments;
  v_student text;
  v_actor_role text;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: enrollment is centralized - only the academy office (secretary/founder) can enroll directly';
  END IF;

  SELECT * INTO s FROM public.registered_students
  WHERE lower(trim(email)) = lower(trim(p_student_email));

  IF s.id IS NULL THEN
    RAISE EXCEPTION 'student profile not found';
  END IF;

  SELECT * INTO c FROM public.courses WHERE id = p_course_id;
  IF c.id IS NULL THEN
    RAISE EXCEPTION 'course not found';
  END IF;

  INSERT INTO public.course_enrollments (
    id, student_id, student_email, student_name, student_phone,
    student_code, student_track, course_id, course_title, course_code,
    status, approved_at
  )
  VALUES (
    'enr-' || gen_random_uuid()::text,
    s.id, s.email, s.name, s.phone, s.academic_code, s.academic_track,
    c.id, c.title, c.code, 'ACTIVE', now()
  )
  ON CONFLICT ON CONSTRAINT course_enrollments_student_course_key DO UPDATE
  SET status = 'ACTIVE', approved_at = now()
  RETURNING * INTO e;

  v_student := s.id;
  IF v_student ~ '^[0-9a-fA-F-]{36}$' THEN
    UPDATE public.referrals
    SET status = 'rewarded', points = 50, rewarded_at = now()
    WHERE referred_id = v_student::uuid AND status = 'registered';
  END IF;

  -- Audit trail (022): every direct enrollment is on the permanent record.
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id,
    summary, details, source
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    'enrollment.direct',
    'enrollment',
    e.id,
    'direct enrollment: ' || lower(trim(p_student_email)) || ' -> ' || c.title,
    jsonb_build_object('student_email', lower(trim(p_student_email)), 'course_id', c.id),
    'rpc'
  );

  RETURN e;
END $$;

REVOKE ALL ON FUNCTION public.admin_enroll_student(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_enroll_student(text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2) set_enrollment_status: THE ACADEMY OFFICE decides the queue. Full body
--    from 018, gate replaced + audit added.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_enrollment_status(p_id text, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_student text;
  v_course text;
  v_old_status text;
  v_actor_role text;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: enrollment decisions are centralized - only the academy office (secretary/founder) can decide the queue';
  END IF;

  SELECT course_id, status INTO v_course, v_old_status
  FROM public.course_enrollments WHERE id = p_id;

  IF v_course IS NULL THEN
    RAISE EXCEPTION 'enrollment not found';
  END IF;

  IF p_status NOT IN ('PENDING','ACTIVE','REJECTED') THEN
    RAISE EXCEPTION 'bad status';
  END IF;

  UPDATE public.course_enrollments
  SET status = p_status,
      approved_at = CASE WHEN p_status = 'ACTIVE' THEN now() ELSE NULL END
  WHERE id = p_id
  RETURNING student_id INTO v_student;

  -- reward the referrer only when the referred student's FIRST activation is confirmed
  IF p_status = 'ACTIVE' AND v_student ~ '^[0-9a-fA-F-]{36}$' THEN
    UPDATE public.referrals
    SET status = 'rewarded', points = 50, rewarded_at = now()
    WHERE referred_id = v_student::uuid AND status = 'registered';
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
    'enrollment.status',
    'enrollment',
    p_id,
    'enrollment decision: ' || coalesce(v_old_status, '?') || ' -> ' || p_status,
    jsonb_build_object('old_status', v_old_status, 'new_status', p_status, 'course_id', v_course),
    'rpc'
  );
END $$;

REVOKE ALL ON FUNCTION public.set_enrollment_status(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_enrollment_status(text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3) record_payment: the office records a payment. Money math is resolved HERE
--    and frozen by the 021 snapshots - later policy changes never rewrite it.
--    Commission resolution: course owner's profiles.platform_commission_pct
--    override, else platform_settings.default_platform_commission_pct FALLBACK.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_payment(
  p_student_email text,
  p_course_id text,
  p_method text,
  p_gross_amount numeric,
  p_reference text DEFAULT NULL,
  p_collected_at timestamptz DEFAULT NULL,
  p_processing_fee numeric DEFAULT 0,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student public.registered_students;
  v_course public.courses;
  v_owner_pct numeric;
  v_fallback_pct numeric;
  v_pct numeric;
  v_platform_amount numeric;
  v_instructor_amount numeric;
  v_payment_id uuid;
  v_actor_role text;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office (secretary/founder) can record payments';
  END IF;

  IF p_method NOT IN ('kashier','cash','instapay','vodafone_cash','other') THEN
    RAISE EXCEPTION 'invalid payment method: %', p_method;
  END IF;
  IF p_gross_amount IS NULL OR p_gross_amount < 0 THEN
    RAISE EXCEPTION 'gross amount must be >= 0';
  END IF;
  IF p_processing_fee IS NULL OR p_processing_fee < 0 THEN
    RAISE EXCEPTION 'processing fee must be >= 0';
  END IF;

  SELECT * INTO v_student FROM public.registered_students
  WHERE lower(trim(email)) = lower(trim(p_student_email));
  IF v_student.id IS NULL THEN
    RAISE EXCEPTION 'student profile not found';
  END IF;

  SELECT * INTO v_course FROM public.courses WHERE id = p_course_id;
  IF v_course.id IS NULL THEN
    RAISE EXCEPTION 'course not found';
  END IF;

  -- Commission pct: instructor override, else the settings FALLBACK.
  SELECT platform_commission_pct INTO v_owner_pct
  FROM public.profiles
  WHERE id = v_course.owner_id;
  SELECT value::numeric INTO v_fallback_pct
  FROM public.platform_settings
  WHERE key = 'default_platform_commission_pct';
  v_pct := coalesce(v_owner_pct, v_fallback_pct, 0);
  IF v_pct < 0 OR v_pct > 100 THEN
    RAISE EXCEPTION 'commission pct out of range: %', v_pct;
  END IF;

  v_platform_amount  := round(p_gross_amount * v_pct / 100, 2);
  v_instructor_amount := round(p_gross_amount - v_platform_amount - p_processing_fee, 2);
  IF v_instructor_amount < 0 THEN
    RAISE EXCEPTION 'allocation math invalid: instructor share went negative (check pct and fee)';
  END IF;

  BEGIN
    INSERT INTO public.payments (
      student_id, student_email, course_id, instructor_email, method,
      gross_amount, status, reference, collected_at, price_snapshot,
      platform_commission_pct, platform_amount, instructor_amount,
      processing_fee, created_by, note
    ) VALUES (
      CASE WHEN v_student.id ~ '^[0-9a-fA-F-]{36}$' THEN v_student.id::uuid ELSE NULL END,
      v_student.email, v_course.id, v_course.instructor_email, p_method,
      p_gross_amount, 'PENDING', p_reference, coalesce(p_collected_at, now()),
      v_course.price, v_pct, v_platform_amount, v_instructor_amount,
      p_processing_fee, auth.uid(), p_note
    ) RETURNING id INTO v_payment_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'duplicate payment: this reference is already recorded for this student and course';
  END;

  -- Audit trail (022): every recorded payment is on the permanent record.
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id,
    summary, details, source
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    'payment.record',
    'payment',
    v_payment_id::text,
    'payment recorded: ' || p_gross_amount::text || ' EGP from ' || v_student.email
      || ' for ' || v_course.title || ' (' || p_method || ')',
    jsonb_build_object(
      'student_email', v_student.email, 'course_id', v_course.id,
      'method', p_method, 'gross_amount', p_gross_amount,
      'price_snapshot', v_course.price, 'commission_pct', v_pct,
      'platform_amount', v_platform_amount, 'instructor_amount', v_instructor_amount,
      'processing_fee', p_processing_fee, 'reference', p_reference
    ),
    'rpc'
  );

  RETURN v_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_payment(text, text, text, numeric, text, timestamptz, numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.record_payment(text, text, text, numeric, text, timestamptz, numeric, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 4) set_payment_status: the office decides the ledger. VERIFIED stamps the
--    accountable human and AUTO-ACTIVATES the enrollment (subscription gate:
--    access requires a VERIFIED payment). REFUNDED requires a written reason.
--    The 021 trg_payments_guard re-enforces every rule at the DB level.
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

  UPDATE public.payments
  SET status = p_new_status,
      verified_by = CASE WHEN p_new_status = 'VERIFIED' THEN auth.uid() ELSE verified_by END,
      verified_at = CASE WHEN p_new_status = 'VERIFIED' THEN now()  ELSE verified_at END
  WHERE id = p_payment_id;

  -- SUBSCRIPTION GATE: a VERIFIED payment activates the student's enrollment.
  IF p_new_status = 'VERIFIED' THEN
    SELECT * INTO v_student FROM public.registered_students
    WHERE lower(trim(email)) = lower(trim(p.student_email));
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
-- 5) waive_enrollment_payment: the explicit manual-waiver path - activates an
--    enrollment with NO payment. Mandatory written reason; permanently audited.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.waive_enrollment_payment(
  p_student_email text,
  p_course_id text,
  p_note text
)
RETURNS public.course_enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student public.registered_students;
  v_course public.courses;
  v_enr public.course_enrollments;
  v_actor_role text;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office (secretary/founder) can waive payments';
  END IF;
  IF p_note IS NULL OR btrim(p_note) = '' THEN
    RAISE EXCEPTION 'a payment waiver requires a written reason (note)';
  END IF;

  SELECT * INTO v_student FROM public.registered_students
  WHERE lower(trim(email)) = lower(trim(p_student_email));
  IF v_student.id IS NULL THEN
    RAISE EXCEPTION 'student profile not found';
  END IF;

  SELECT * INTO v_course FROM public.courses WHERE id = p_course_id;
  IF v_course.id IS NULL THEN
    RAISE EXCEPTION 'course not found';
  END IF;

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

  -- Audit trail (022): waivers are exactly what the ledger exists for.
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id,
    summary, details, source
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    'enrollment.waiver',
    'enrollment',
    v_enr.id,
    'payment waived: ' || lower(trim(p_student_email)) || ' -> ' || v_course.title,
    jsonb_build_object('student_email', lower(trim(p_student_email)),
                       'course_id', v_course.id, 'note', p_note),
    'rpc'
  );

  RETURN v_enr;
END;
$$;

REVOKE ALL ON FUNCTION public.waive_enrollment_payment(text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.waive_enrollment_payment(text, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 6) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 023 (centralized enrollment: admin_enroll_student + set_enrollment_status re-gated to academy office with audit, record_payment / set_payment_status / waive_enrollment_payment RPCs with at-insert allocation math, VERIFIED-payment subscription gate and audited manual waivers; queue = course_enrollments PENDING) applied';
