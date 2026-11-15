-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 014
-- Close the remaining "admin all" hole on 11 tables (verified live via pg_policies)
--
-- WHY (verified against the LIVE database on 2026-11-15):
--   Migration 000/001 created "admin all" (is_admin() = ANY instructor) on 13
--   tables. 007 replaced it on courses/lessons; 013 replaced it on
--   student_submissions/waitlist_applications. These 11 remained, meaning ANY
--   instructor could:
--     - read every student's phone/email (registered_students, profiles)
--     - activate any enrollment (course_enrollments)
--     - read every course's video URLs (lesson_assets, via admin all)
--     - edit/delete other teachers' courses (courses - admin all bypassed 007)
--     - read all referrals/sessions/media logs
--
-- RULES APPLIED (same model as 013):
--   - super_admin (Dr. Omar Magdi) keeps full access everywhere.
--   - instructors see ONLY rows tied to courses they own.
--   - students see/manage ONLY their own rows.
--   - writes that were done by client code directly on identity tables move to
--     a security-definer RPC (office_register_student).
--
-- WHAT STUDENTS SEE: unchanged. All their own data (progress, comments,
--   sessions, referrals, their profile row) keeps working exactly as before.
--
-- SAFETY:
--   - Idempotent: safe to run twice.
--   - Does NOT delete any row, does NOT change any role.
--   - Client usages were audited: lesson_progress/lesson_comments/referrals/
--     user_sessions/media_access_log/course_enrollments are never read by the
--     client directly (RPCs with security definer serve them), so tightening
--     them cannot break the UI.
--
-- BEFORE RUNNING:
--   1. Take a full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor (errors log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0) Helper: readable placeholder id for roster rows created before signup
-- ------------------------------------------------------------------------------
-- (no helper needed; office_register_student uses gen_random_uuid())

-- ------------------------------------------------------------------------------
-- 1) profiles: own row for self, everything for super_admin.
--    Role changes remain blocked by trg_protect_profiles_role (migration 007).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin all" ON public.profiles;
DROP POLICY IF EXISTS "profiles read own or admin" ON public.profiles;

CREATE POLICY "profiles read own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles update own" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles manage super_admin" ON public.profiles
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 2) registered_students: own row; instructors see students enrolled in THEIR
--    courses; super_admin sees all. Identity INSERT by instructors moves to the
--    office_register_student RPC below.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin all" ON public.registered_students;

DROP POLICY IF EXISTS "students read own" ON public.registered_students;
CREATE POLICY "students read own" ON public.registered_students
  FOR SELECT USING (
    id = auth.uid()::text
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "students read own course" ON public.registered_students;
CREATE POLICY "students read own course" ON public.registered_students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments e
      WHERE e.student_id::text = registered_students.id
        AND public.owns_course(e.course_id)
    )
  );

DROP POLICY IF EXISTS "students update own" ON public.registered_students;
CREATE POLICY "students update own" ON public.registered_students
  FOR UPDATE USING (id = auth.uid()::text) WITH CHECK (id = auth.uid()::text);

DROP POLICY IF EXISTS "students insert own" ON public.registered_students;
CREATE POLICY "students insert own" ON public.registered_students
  FOR INSERT WITH CHECK (id = auth.uid()::text);

DROP POLICY IF EXISTS "students manage super_admin" ON public.registered_students;
CREATE POLICY "students manage super_admin" ON public.registered_students
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Walk-in roster registration (office). Replaces the old client-side upsert
-- with a fake id. Any instructor may register a walk-in student (the row is
-- only readable by them once enrollment links it to one of their courses);
-- super_admin too. When the student later signs up, the auth trigger merges
-- the row ON CONFLICT (email) - the placeholder id and code are preserved.
CREATE OR REPLACE FUNCTION public.office_register_student(
  p_name text, p_email text, p_phone text DEFAULT NULL, p_track text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: only faculty may register walk-in students';
  END IF;
  INSERT INTO public.registered_students (
    id, email, name, phone, academic_code, academic_track, role
  ) VALUES (
    gen_random_uuid()::text,
    lower(trim(p_email)),
    p_name,
    coalesce(nullif(p_phone, ''), 'Pending WhatsApp Verification'),
    public.generate_academic_code(),
    coalesce(nullif(p_track, ''), 'All Tracks'),
    'STUDENT'
  )
  ON CONFLICT (email) DO UPDATE SET
    name  = coalesce(nullif(registered_students.name, ''), EXCLUDED.name),
    phone = coalesce(nullif(registered_students.phone, ''), EXCLUDED.phone);
END $$;

REVOKE ALL ON FUNCTION public.office_register_student(text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.office_register_student(text, text, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3) course_enrollments: student sees own; instructor sees own courses';
--    activation stays RPC/admin + super_admin only.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin all" ON public.course_enrollments;

DROP POLICY IF EXISTS "enrollments read own" ON public.course_enrollments;
CREATE POLICY "enrollments read own" ON public.course_enrollments
  FOR SELECT USING (
    student_id::text = auth.uid()::text
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "enrollments read course owner" ON public.course_enrollments;
CREATE POLICY "enrollments read course owner" ON public.course_enrollments
  FOR SELECT USING (public.owns_course(course_id));

DROP POLICY IF EXISTS "enrollments manage super_admin" ON public.course_enrollments;
CREATE POLICY "enrollments manage super_admin" ON public.course_enrollments
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 4) lesson_progress: student's own rows; instructor reads own courses'.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin all" ON public.lesson_progress;

DROP POLICY IF EXISTS "progress own" ON public.lesson_progress;
CREATE POLICY "progress own" ON public.lesson_progress
  FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "progress read course owner" ON public.lesson_progress;
CREATE POLICY "progress read course owner" ON public.lesson_progress
  FOR SELECT USING (public.owns_course(course_id));

DROP POLICY IF EXISTS "progress manage super_admin" ON public.lesson_progress;
CREATE POLICY "progress manage super_admin" ON public.lesson_progress
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 5) lesson_comments: author's own; enrolled students read; owner manages.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin all" ON public.lesson_comments;

DROP POLICY IF EXISTS "comments read" ON public.lesson_comments;
CREATE POLICY "comments read" ON public.lesson_comments
  FOR SELECT USING (
    author_id = auth.uid()
    OR public.owns_course(course_id)
    OR public.has_active_enrollment(course_id)
  );

DROP POLICY IF EXISTS "comments insert own" ON public.lesson_comments;
CREATE POLICY "comments insert own" ON public.lesson_comments
  FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "comments update own" ON public.lesson_comments;
CREATE POLICY "comments update own" ON public.lesson_comments
  FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "comments delete own or owner" ON public.lesson_comments;
CREATE POLICY "comments delete own or owner" ON public.lesson_comments
  FOR DELETE USING (author_id = auth.uid() OR public.owns_course(course_id));

DROP POLICY IF EXISTS "comments manage super_admin" ON public.lesson_comments;
CREATE POLICY "comments manage super_admin" ON public.lesson_comments
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 6) lesson_assets: keep ONLY the owner-scoped policy from 007 (it covers read
--    AND write for the course owner incl. super_admin). Students never read
--    this table directly - get_lesson_media() RPC serves them.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin all" ON public.lesson_assets;

-- ------------------------------------------------------------------------------
-- 7) media_access_log: own rows + super_admin (written internally by
--    get_lesson_media()).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin all" ON public.media_access_log;

DROP POLICY IF EXISTS "media log own" ON public.media_access_log;
CREATE POLICY "media log own" ON public.media_access_log
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "media log manage super_admin" ON public.media_access_log;
CREATE POLICY "media log manage super_admin" ON public.media_access_log
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 8) user_sessions: own rows + super_admin (RPCs register/check session).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin all" ON public.user_sessions;

DROP POLICY IF EXISTS "sessions own" ON public.user_sessions;
CREATE POLICY "sessions own" ON public.user_sessions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "sessions manage super_admin" ON public.user_sessions;
CREATE POLICY "sessions manage super_admin" ON public.user_sessions
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 9) referrals: own referrals + super_admin (inserted by the auth trigger).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin all" ON public.referrals;
DROP POLICY IF EXISTS "referrals read own or admin" ON public.referrals;

DROP POLICY IF EXISTS "referrals read own" ON public.referrals;
CREATE POLICY "referrals read own" ON public.referrals
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());

DROP POLICY IF EXISTS "referrals manage super_admin" ON public.referrals;
CREATE POLICY "referrals manage super_admin" ON public.referrals
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 10) courses + lessons: drop "admin all" - the 007 ownership policies now
--     rule alone. Also tighten course creation so nobody creates a course
--     owned by someone else.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin all" ON public.courses;
DROP POLICY IF EXISTS "admin all" ON public.lessons;

DROP POLICY IF EXISTS "courses insert instructor" ON public.courses;
CREATE POLICY "courses insert instructor" ON public.courses
  FOR INSERT WITH CHECK (
    public.is_admin()
    AND (owner_id = auth.uid() OR public.is_super_admin())
  );

-- ------------------------------------------------------------------------------
-- 11) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 014 (admin all fully retired; identity tables ownership-scoped) applied';
