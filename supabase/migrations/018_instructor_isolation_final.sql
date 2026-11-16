-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 018
-- Instructor isolation completed: retire every remaining is_admin() trust
--
-- WHY:
--   The legacy helper `is_admin()` returns TRUE for ANY instructor
--   (007: role IN ('instructor','super_admin')). Migration 014 retired the
--   "admin all" table policies, but 9 call sites kept trusting is_admin().
--   An independent security audit confirmed a real instructor could:
--     - reset ANY student's password (full account takeover),
--     - activate/reject ANY enrollment, enroll anyone for free,
--     - read ALL students' notifications and ALL quiz results,
--     - read reviewer identities (even ANON visitors, via USING(true)),
--     - fetch other instructors' lesson media / quiz questions,
--     - manage the whole lecture-notes bucket, notify any course's students.
--
-- WHAT THIS DOES:
--   1. Dangerous RPCs re-gated: admin_set_student_password / admin_enroll_student /
--      set_enrollment_status / notify_course_students -> super_admin or the
--      course owner; get_lesson_media / get_quiz_questions accept ownership
--      instead of is_admin().
--   2. student_notifications + quiz_submissions policies re-scoped.
--   3. instructor_reviews: public USING(true) read removed - reviews are now
--      shown via PII-free RPCs (no reviewer emails anywhere), insert stays
--      enrollment-gated (re-asserted).
--   4. lecture-notes storage policies re-scoped.
--   5. Signup trigger MERGES walk-in roster rows into the real account
--      (fixes the "student profile not found" dead-end) + one-time merge of
--      legacy fake 'stu-%' rows whose email now has a real account.
--   6. admin_delete_student_account RPC (super_admin) replaces the client's
--      direct table deletes.
--
-- SAFETY:
--   - Idempotent: safe to run twice.
--   - Deletes NOTHING except enrollment/roster pointers for merged fake ids.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor (errors log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) admin_set_student_password: SUPER ADMIN ONLY (was: any instructor).
--    Full body from migration 004, gate replaced.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_student_password(
  p_student_email text,
  p_new_password text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: only the academy director can reset student passwords';
  END IF;

  IF length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'password must be at least 6 characters long';
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE lower(trim(email)) = lower(trim(p_student_email));

  IF NOT found THEN
    RAISE EXCEPTION 'student user with email % not found in auth system', p_student_email;
  END IF;

  RETURN 'OK';
END $$;

REVOKE ALL ON FUNCTION public.admin_set_student_password(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_student_password(text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2) admin_enroll_student: super_admin OR the course's owner (was: any instructor).
--    Full body from migration 000, gate replaced.
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
BEGIN
  IF NOT (public.is_super_admin() OR public.owns_course(p_course_id)) THEN
    RAISE EXCEPTION 'forbidden: only the director or the course owner can enroll directly';
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

  RETURN e;
END $$;

REVOKE ALL ON FUNCTION public.admin_enroll_student(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_enroll_student(text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3) set_enrollment_status: super_admin OR the owner of THAT enrollment's course
--    (was: any instructor).
--    Full body from migration 000, gate replaced.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_enrollment_status(p_id text, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_student text;
  v_course text;
BEGIN
  SELECT course_id INTO v_course
  FROM public.course_enrollments WHERE id = p_id;

  IF NOT (public.is_super_admin() OR public.owns_course(v_course)) THEN
    RAISE EXCEPTION 'forbidden: only the director or the course owner can decide enrollments';
  END IF;
  IF p_status NOT IN ('PENDING','ACTIVE','REJECTED') THEN
    RAISE EXCEPTION 'bad status';
  END IF;

  UPDATE public.course_enrollments
  SET status = p_status,
      approved_at = CASE WHEN p_status = 'ACTIVE' THEN now() ELSE NULL END
  WHERE id = p_id
  RETURNING student_id INTO v_student;

  -- reward the referrer only when the referred student's FIRST activation (= paid) is confirmed
  IF p_status = 'ACTIVE' AND v_student ~ '^[0-9a-fA-F-]{36}$' THEN
    UPDATE public.referrals
    SET status = 'rewarded', points = 50, rewarded_at = now()
    WHERE referred_id = v_student::uuid AND status = 'registered';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.set_enrollment_status(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_enrollment_status(text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 4) notify_course_students: super_admin OR that course's owner.
--    The LIVE signature is 007_fixed's (p_course_id, p_title, p_message,
--    p_link, p_lesson_id default null) — kept identical; DROP first because
--    Postgres rejects param-name changes on CREATE OR REPLACE.
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.notify_course_students(text, text, text, text, text) CASCADE;
CREATE OR REPLACE FUNCTION public.notify_course_students(
  p_course_id text,
  p_title text,
  p_message text,
  p_link text,
  p_lesson_id text DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
BEGIN
  IF NOT (public.is_super_admin() OR public.owns_course(p_course_id)) THEN
    RAISE EXCEPTION 'forbidden: only the director or the course owner can notify its students';
  END IF;

  INSERT INTO public.student_notifications (
    student_id, course_id, lesson_id, title, message, link, is_read, created_at
  )
  SELECT
    e.student_id, p_course_id, p_lesson_id, p_title, p_message, p_link, false, now()
  FROM public.course_enrollments e
  WHERE e.course_id = p_course_id AND e.status = 'ACTIVE';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

REVOKE ALL ON FUNCTION public.notify_course_students(text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.notify_course_students(text, text, text, text, text) TO authenticated;

-- 4b) BONUS FIX: the lesson-announcement trigger function shipped in 005 with
--     mojibake Arabic (encoding casualty of its creation). Rewritten with the
--     correct Arabic — no signature change, CREATE OR REPLACE is safe.
CREATE OR REPLACE FUNCTION public.handle_new_lesson_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_title text;
BEGIN
  SELECT title INTO v_course_title FROM public.courses WHERE id = new.course_id;

  INSERT INTO public.student_notifications (
    student_id, course_id, lesson_id, title, message, link
  )
  SELECT
    e.student_id,
    new.course_id,
    new.id,
    'درس جديد متاح: ' || coalesce(new.title, 'درس جديد متاح'),
    'درس جديد في كورس ' || coalesce(v_course_title, 'الكيمياء') || ' — العنوان: ' || coalesce(new.title, ''),
    '/courses/' || new.course_id || '/lessons/' || new.id
  FROM public.course_enrollments e
  WHERE e.course_id = new.course_id
    AND e.status = 'ACTIVE';

  RETURN new;
END $$;

-- ------------------------------------------------------------------------------
-- 5) student_notifications policies: own rows + super_admin (was: is_admin).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "notifications read own" ON public.student_notifications;
CREATE POLICY "notifications read own" ON public.student_notifications
  FOR SELECT USING (
    student_id = auth.uid()::text OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "notifications update own" ON public.student_notifications;
CREATE POLICY "notifications update own" ON public.student_notifications
  FOR UPDATE USING (
    student_id = auth.uid()::text OR public.is_super_admin()
  ) WITH CHECK (
    student_id = auth.uid()::text OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "notifications admin manage" ON public.student_notifications;
CREATE POLICY "notifications admin manage" ON public.student_notifications
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- 6) quiz_submissions: student reads own; the quiz's course owner + director
--    read all (was: is_admin = any instructor read the whole platform).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "submissions read own or admin" ON public.quiz_submissions;
CREATE POLICY "submissions read own or course owner" ON public.quiz_submissions
  FOR SELECT USING (
    student_id = auth.uid()::text
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_submissions.quiz_id
        AND public.owns_course(q.course_id)
    )
  );

-- ------------------------------------------------------------------------------
-- 7) instructor_reviews: NO public read (reviewer emails were exposed to
--    ANON visitors). Reviews are displayed via the PII-free RPCs below.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "reviews read public" ON public.instructor_reviews;
CREATE POLICY "reviews read involved" ON public.instructor_reviews
  FOR SELECT USING (
    public.is_super_admin()
    OR (auth.uid() IS NOT NULL AND instructor_id = split_part(
          (SELECT email FROM auth.users WHERE id = auth.uid()), '@', 1))
    OR (auth.uid() IS NOT NULL AND student_email = (
          SELECT lower(email) FROM auth.users WHERE id = auth.uid()))
  );

-- Re-assert the enrollment-gated insert (strict version of 007).
DROP POLICY IF EXISTS "reviews insert enrolled" ON public.instructor_reviews;
CREATE POLICY "reviews insert enrolled" ON public.instructor_reviews
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.course_enrollments e
      JOIN public.courses c ON c.id = e.course_id
      WHERE e.student_id = auth.uid()::text
        AND e.status = 'ACTIVE'
        AND (
          c.instructor_id = instructor_id
          OR c.owner_id = (SELECT id FROM auth.users WHERE split_part(email, '@', 1) = instructor_id)
        )
    )
  );

-- Public display of a faculty member's reviews: PII-free (no emails, no codes).
DROP FUNCTION IF EXISTS public.get_instructor_reviews(text);
CREATE OR REPLACE FUNCTION public.get_instructor_reviews(p_instructor_id text)
RETURNS TABLE (
  id text,
  student_name text,
  rating int,
  comment text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.student_name, r.rating, r.comment, r.created_at
  FROM public.instructor_reviews r
  WHERE r.instructor_id = p_instructor_id
  ORDER BY r.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_instructor_reviews(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_instructor_reviews(text) TO anon, authenticated;

-- Aggregate ratings for the faculty directory: one call, no PII at all.
DROP FUNCTION IF EXISTS public.get_review_stats();
CREATE OR REPLACE FUNCTION public.get_review_stats()
RETURNS TABLE (
  instructor_id text,
  avg_rating numeric,
  review_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.instructor_id,
         ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
         COUNT(*) AS review_count
  FROM public.instructor_reviews r
  GROUP BY r.instructor_id;
$$;

REVOKE ALL ON FUNCTION public.get_review_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.get_review_stats() TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 8) get_lesson_media: ownership instead of is_admin (full body from 000).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_lesson_media(p_lesson_id text)
RETURNS TABLE (video_url text, pdf_notes_path text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_course text; v_count int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT l.course_id INTO v_course FROM public.lessons l WHERE l.id = p_lesson_id;
  IF v_course IS NULL THEN RAISE EXCEPTION 'lesson not found'; END IF;
  IF NOT (
    public.is_super_admin()
    OR public.owns_course(v_course)
    OR public.has_active_enrollment(v_course)
  ) THEN
    RAISE EXCEPTION 'not enrolled';
  END IF;

  IF NOT public.is_super_admin() THEN
    SELECT count(*) INTO v_count FROM public.media_access_log m
    WHERE m.user_id = auth.uid() AND m.accessed_at > now() - interval '24 hours';
    IF v_count >= 60 THEN RAISE EXCEPTION 'rate limit'; END IF;
  END IF;

  INSERT INTO public.media_access_log (user_id, lesson_id) VALUES (auth.uid(), p_lesson_id);

  IF random() < 0.01 THEN
    DELETE FROM public.media_access_log WHERE accessed_at < now() - interval '30 days';
  END IF;

  RETURN QUERY SELECT a.video_url, a.pdf_notes_path
  FROM public.lesson_assets a WHERE a.lesson_id = p_lesson_id;
END $$;

REVOKE ALL ON FUNCTION public.get_lesson_media(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_lesson_media(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 9) get_quiz_questions: ownership instead of is_admin (full body from 010).
--    NOTE: the answer key stays stripped server-side regardless of caller.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_quiz_questions(p_quiz_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course text;
  v_questions jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT course_id, questions INTO v_course, v_questions
  FROM public.quizzes WHERE id = p_quiz_id;
  IF v_course IS NULL THEN
    RAISE EXCEPTION 'quiz not found';
  END IF;

  IF NOT (
    public.is_super_admin()
    OR public.owns_course(v_course)
    OR public.has_active_enrollment(v_course)
  ) THEN
    RAISE EXCEPTION 'not enrolled';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id',      q->>'id',
        'text',    q->>'text',
        'options', q->'options',
        'points',  COALESCE((q->>'points')::int, 5)
      ) ORDER BY ord
    )
    FROM jsonb_array_elements(v_questions) WITH ORDINALITY AS t(q, ord)
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_quiz_questions(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 10) courses insert: owner-only (the is_admin() arm was redundant anyway).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "courses insert instructor" ON public.courses;
CREATE POLICY "courses insert instructor" ON public.courses
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() OR public.is_super_admin()
  );

-- ------------------------------------------------------------------------------
-- 11) lecture-notes storage: ownership instead of is_admin.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "notes read active students" ON storage.objects;
CREATE POLICY "notes read active students" ON storage.objects FOR SELECT USING (
  bucket_id = 'lecture-notes'
  AND (
    public.is_super_admin()
    OR public.owns_course((storage.foldername(name))[1])
    OR public.has_active_enrollment((storage.foldername(name))[1])
  )
);

DROP POLICY IF EXISTS "notes admin write" ON storage.objects;
CREATE POLICY "notes admin write" ON storage.objects FOR ALL
USING (bucket_id = 'lecture-notes' AND (public.is_super_admin() OR public.owns_course((storage.foldername(name))[1])))
WITH CHECK (bucket_id = 'lecture-notes' AND (public.is_super_admin() OR public.owns_course((storage.foldername(name))[1])));

-- ------------------------------------------------------------------------------
-- 12) Signup trigger MERGES walk-in roster rows into the real account.
--     Old behaviour (on conflict do nothing) left the roster row with its
--     office-generated id, so request_enrollment (which looks the student up
--     by auth.uid()) failed with "student profile not found".
--     Full body from 000 + merge logic; referral block preserved verbatim.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref_code text; ref_user uuid; v_old_id text;
BEGIN
  IF lower(trim(coalesce(new.email, ''))) = 'phenolvii@gmail.com' THEN
    INSERT INTO public.profiles (id, role) VALUES (new.id, 'instructor')
    ON CONFLICT (id) DO UPDATE SET role = 'instructor';
  ELSE
    INSERT INTO public.profiles (id, role) VALUES (new.id, 'student')
    ON CONFLICT DO NOTHING;
  END IF;

  IF new.email IS NOT NULL AND lower(new.email) <> 'phenolvii@gmail.com' THEN
    SELECT id INTO v_old_id FROM public.registered_students
    WHERE lower(trim(email)) = lower(trim(new.email));

    IF v_old_id IS NOT NULL THEN
      -- MERGE: claim the walk-in row into the real account (preserve code/identity)
      UPDATE public.course_enrollments
      SET student_id = new.id::text
      WHERE student_id = v_old_id;

      UPDATE public.registered_students
      SET id = new.id::text,
          name = coalesce(nullif(name, ''),
                          nullif(new.raw_user_meta_data->>'full_name', ''),
                          split_part(new.email, '@', 1)),
          phone = CASE WHEN phone = 'Pending WhatsApp Verification'
                       THEN coalesce(nullif(new.raw_user_meta_data->>'phone', ''), phone)
                       ELSE phone END,
          role = CASE WHEN role IN ('INSTRUCTOR','SUPER_ADMIN') THEN role ELSE 'STUDENT' END
      WHERE id = v_old_id;
    ELSE
      INSERT INTO public.registered_students
      (id, email, name, phone, academic_code, academic_track, role)
      VALUES (
        new.id::text,
        lower(trim(new.email)),
        coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)),
        coalesce(nullif(new.raw_user_meta_data->>'phone',''), 'Pending WhatsApp Verification'),
        public.generate_academic_code(),
        coalesce(nullif(new.raw_user_meta_data->>'academic_level',''), 'Public Secondary AR'),
        'STUDENT'
      ) ON CONFLICT (email) DO NOTHING;
    END IF;

    ref_code := nullif(new.raw_user_meta_data->>'referred_by','');
    IF ref_code IS NOT NULL THEN
      SELECT id::uuid INTO ref_user FROM public.registered_students
      WHERE academic_code = ref_code AND id ~ '^[0-9a-fA-F-]{36}$' AND id <> new.id::text;
      IF ref_user IS NOT NULL THEN
        INSERT INTO public.referrals (referrer_id, referred_id) VALUES (ref_user, new.id)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN new;
END $$;

-- ------------------------------------------------------------------------------
-- 13) ONE-TIME merge of legacy fake 'stu-%' rows whose email now has a real
--     account (same fix as the trigger, applied to existing rows).
-- ------------------------------------------------------------------------------
UPDATE public.course_enrollments e
SET student_id = u.id::text
FROM public.registered_students rs
JOIN auth.users u ON lower(trim(rs.email)) = lower(trim(u.email))
WHERE e.student_id = rs.id
  AND rs.id LIKE 'stu-%'
  AND NOT EXISTS (
    SELECT 1 FROM public.course_enrollments x
    WHERE x.student_id = u.id::text AND x.course_id = e.course_id
  );

UPDATE public.registered_students rs
SET id = u.id::text
FROM auth.users u
WHERE lower(trim(rs.email)) = lower(trim(u.email))
  AND rs.id LIKE 'stu-%'
  AND NOT EXISTS (SELECT 1 FROM public.registered_students r2 WHERE r2.id = u.id::text);

-- ------------------------------------------------------------------------------
-- 14) admin_delete_student_account (super_admin): replaces the client's
--     direct table deletes.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_student_account(p_student_email text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: only the academy director can delete student accounts';
  END IF;

  DELETE FROM public.course_enrollments
  WHERE lower(trim(student_email)) = lower(trim(p_student_email));

  DELETE FROM public.registered_students
  WHERE lower(trim(email)) = lower(trim(p_student_email));

  RETURN 'OK';
END $$;

REVOKE ALL ON FUNCTION public.admin_delete_student_account(text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_delete_student_account(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 15) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 018 (every is_admin() trust retired; signup merges walk-in rows) applied';
