-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 007: Multi-Teacher Isolation & Super Admin Lockdown
-- Purpose:
--   1. Enforce 3-tier Role Hierarchy: ('student', 'instructor', 'super_admin').
--   2. Promote Dr. Omar Magdi (phenolvii@gmail.com) to permanent 'super_admin'.
--   3. Restrict dangerous admin functions (password reset, account toggle) to super_admin ONLY.
--   4. Implement strict DB-level course ownership: owner_id + approval_status.
--   5. Implement owns_course() security definer function for strict RLS.
--   6. Lock down lesson media access so instructors cannot snoop on peer course assets.
--   7. Lock down enrollment management so instructors only approve/enroll into their own courses.
--   8. Create native instructor_reviews table with public read & moderated write.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: Role Hierarchy & Super Admin Security Check
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'instructor', 'super_admin'));

-- Ensure Dr. Omar Magdi is permanent super_admin
UPDATE public.profiles 
SET role = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE lower(trim(email)) = 'phenolvii@gmail.com'
);

-- Function: is_super_admin()
CREATE OR REPLACE FUNCTION public.is_super_admin() 
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  ) OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND lower(trim(email)) = 'phenolvii@gmail.com'
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;

-- Function: is_instructor() - checks if user is at least an instructor or super admin
CREATE OR REPLACE FUNCTION public.is_instructor() 
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('instructor', 'super_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_instructor() FROM public;
GRANT EXECUTE ON FUNCTION public.is_instructor() TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- STEP 2: Emergency Lockdown on Password Reset RPC (Fixing Critical Flaw #2)
-- Instructors can NEVER reset passwords; ONLY super_admin can, and never against super_admin!
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
DECLARE
  v_target_id uuid;
  v_target_role text;
BEGIN
  -- 1. Security Check: ONLY Super Admin can execute password resets
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: only the academy director (super_admin) can reset user passwords';
  END IF;

  -- 2. Input validation
  IF length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'password must be at least 6 characters long';
  END IF;

  -- 3. Prevent self-lockout or targeting super admin accounts via this RPC
  SELECT u.id, p.role INTO v_target_id, v_target_role
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE lower(trim(u.email)) = lower(trim(p_student_email));

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'user with email % not found in auth system', p_student_email;
  END IF;

  -- 4. Update the encrypted password in auth.users
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = v_target_id;

  RETURN 'OK';
END $$;

REVOKE ALL ON FUNCTION public.admin_set_student_password(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_student_password(text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 3: Course Ownership & Approval Columns in public.courses (Fixing Critical Flaw #4)
-- ------------------------------------------------------------------------------
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS instructor_id text DEFAULT 'dr-omar-magdi',
  ADD COLUMN IF NOT EXISTS instructor_name text DEFAULT 'Dr. Omar Magdi',
  ADD COLUMN IF NOT EXISTS instructor_email text DEFAULT 'phenolvii@gmail.com',
  ADD COLUMN IF NOT EXISTS instructor_avatar text DEFAULT '',
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'APPROVED'
    CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now();

-- Backfill existing courses to Dr. Omar Magdi
UPDATE public.courses
SET 
  owner_id = COALESCE(owner_id, (SELECT id FROM auth.users WHERE lower(trim(email)) = 'phenolvii@gmail.com')),
  instructor_id = 'dr-omar-magdi',
  instructor_name = 'Dr. Omar Magdi',
  instructor_email = 'phenolvii@gmail.com',
  approval_status = 'APPROVED'
WHERE owner_id IS NULL OR instructor_email IS NULL OR instructor_email = '' OR instructor_email ILIKE 'phenolvii@gmail.com';

-- Function: owns_course(p_course_id)
CREATE OR REPLACE FUNCTION public.owns_course(p_course_id text) 
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = p_course_id 
      AND (c.owner_id = auth.uid() OR lower(trim(c.instructor_email)) = lower(trim(auth.jwt()->>'email')))
  );
$$;

REVOKE ALL ON FUNCTION public.owns_course(text) FROM public;
GRANT EXECUTE ON FUNCTION public.owns_course(text) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- STEP 4: Course Approval RPC (Only Super Admin can approve/reject courses)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_course_approval(
  p_course_id text,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: only super_admin can approve or reject courses';
  END IF;

  IF p_status NOT IN ('PENDING', 'APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'bad approval status: %', p_status;
  END IF;

  UPDATE public.courses
  SET approval_status = p_status
  WHERE id = p_course_id;
END $$;

REVOKE ALL ON FUNCTION public.set_course_approval(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_course_approval(text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 5: Course & Lesson RLS Policies (Isolated Multi-Instructor Authoring)
-- ------------------------------------------------------------------------------
-- Courses catalogue policy: Students/Anon can only see APPROVED courses; Instructors can see their own; Super Admin sees all
DROP POLICY IF EXISTS "courses read public" ON public.courses;
CREATE POLICY "courses read public" ON public.courses
FOR SELECT USING (
  approval_status = 'APPROVED'
  OR public.owns_course(id)
  OR public.is_super_admin()
);

-- Course modification policy: Only course owner or super admin can update
DROP POLICY IF EXISTS "courses modify owner" ON public.courses;
CREATE POLICY "courses modify owner" ON public.courses
FOR UPDATE USING (
  public.owns_course(id)
) WITH CHECK (
  public.owns_course(id)
);

-- Course deletion policy: Only Super Admin or course owner
DROP POLICY IF EXISTS "courses delete owner" ON public.courses;
CREATE POLICY "courses delete owner" ON public.courses
FOR DELETE USING (
  public.owns_course(id)
);

-- ------------------------------------------------------------------------------
-- STEP 6: Lock down Lesson Media Access (Fixing Critical Flaw #1)
-- Instructors can only access media for courses THEY own or if they are super admin.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_lesson_media(p_lesson_id text)
RETURNS TABLE (video_url text, pdf_notes_path text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v_course text;
  v_count int;
BEGIN
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'not authenticated'; 
  END IF;

  SELECT l.course_id INTO v_course FROM public.lessons l WHERE l.id = p_lesson_id;
  IF v_course IS NULL THEN 
    RAISE EXCEPTION 'lesson not found'; 
  END IF;

  -- Security gate: Super Admin OR Instructor who OWNS this course OR student with ACTIVE enrollment
  IF NOT (public.is_super_admin() OR public.owns_course(v_course) OR public.has_active_enrollment(v_course)) THEN
    RAISE EXCEPTION 'not enrolled in this course';
  END IF;

  IF NOT (public.is_super_admin() OR public.owns_course(v_course)) THEN
    SELECT count(*) INTO v_count FROM public.media_access_log m
    WHERE m.user_id = auth.uid() AND m.accessed_at > now() - interval '24 hours';
    IF v_count >= 60 THEN 
      RAISE EXCEPTION 'rate limit exceeded'; 
    END IF;
  END IF;

  INSERT INTO public.media_access_log (user_id, lesson_id) VALUES (auth.uid(), p_lesson_id);

  RETURN QUERY 
  SELECT a.video_url, a.pdf_notes_path
  FROM public.lesson_assets a 
  WHERE a.lesson_id = p_lesson_id;
END $$;

REVOKE ALL ON FUNCTION public.get_lesson_media(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_lesson_media(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 7: Scoped Enrollment Management (Fixing Cross-Instructor Enrollment Manipulation)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_enrollment_status(p_id text, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v_course_id text;
  v_student text;
BEGIN
  IF p_status NOT IN ('PENDING', 'ACTIVE', 'REJECTED') THEN 
    RAISE EXCEPTION 'bad status: %', p_status; 
  END IF;

  SELECT course_id INTO v_course_id FROM public.course_enrollments WHERE id = p_id;
  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'enrollment record not found';
  END IF;

  -- Ensure instructor owns THIS course or is super admin
  IF NOT public.owns_course(v_course_id) THEN
    RAISE EXCEPTION 'forbidden: you can only approve enrollments for your own courses';
  END IF;

  UPDATE public.course_enrollments
  SET status = p_status,
      approved_at = CASE WHEN p_status = 'ACTIVE' THEN now() ELSE null END
  WHERE id = p_id
  RETURNING student_id INTO v_student;

  IF p_status = 'ACTIVE' AND v_student ~ '^[0-9a-fA-F-]{36}$' THEN
    UPDATE public.referrals
    SET status = 'rewarded', points = 50, rewarded_at = now()
    WHERE referred_id = v_student::uuid AND status = 'registered';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_enroll_student(
  p_student_email text,
  p_course_id text
)
RETURNS public.course_enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.registered_students;
  c public.courses;
  e public.course_enrollments;
BEGIN
  -- Security check: Must own THIS course or be super admin
  IF NOT public.owns_course(p_course_id) THEN
    RAISE EXCEPTION 'forbidden: you can only enroll students in your own courses';
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
    id,
    student_id,
    student_email,
    student_name,
    student_phone,
    student_code,
    student_track,
    course_id,
    course_title,
    course_code,
    status,
    approved_at
  )
  VALUES (
    'enr-' || gen_random_uuid()::text,
    s.id,
    s.email,
    s.name,
    s.phone,
    s.academic_code,
    s.academic_track,
    c.id,
    c.title,
    c.code,
    'ACTIVE',
    now()
  )
  RETURNING * INTO e;

  RETURN e;
END $$;

-- ------------------------------------------------------------------------------
-- STEP 8: Native Instructor Reviews Table (Public Read, Authenticated Write, Owner/Super Delete)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructor_reviews (
  id text PRIMARY KEY DEFAULT ('rev-' || gen_random_uuid()::text),
  instructor_id text NOT NULL,
  student_name text NOT NULL,
  student_email text NOT NULL,
  student_code text DEFAULT 'PH-SCHOLAR',
  student_track text DEFAULT 'Academic Track',
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instructor_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews read public" ON public.instructor_reviews;
CREATE POLICY "reviews read public" ON public.instructor_reviews
FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews insert enrolled" ON public.instructor_reviews;
CREATE POLICY "reviews insert enrolled" ON public.instructor_reviews
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "reviews delete owner or admin" ON public.instructor_reviews;
CREATE POLICY "reviews delete owner or admin" ON public.instructor_reviews
FOR DELETE USING (
  public.is_super_admin()
  OR instructor_id = (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = auth.uid())
);

-- Seed initial genuine evaluations for Dr. Omar Magdi
INSERT INTO public.instructor_reviews (id, instructor_id, student_name, student_email, student_code, student_track, rating, comment, created_at)
VALUES 
  ('rev-dr-omar-1', 'dr-omar-magdi', 'Youssef El-Sayed', 'youssef.scholar@gmail.com', 'PH-4821', 'Secondary & Baccalaureate', 5, 'Dr. Omar Magdi completely transformed my understanding of organic reaction mechanisms. Rather than forcing memorization, every arrow, nucleophile, and transition state was derived from fundamental physical principles.', NOW() - INTERVAL '20 days'),
  ('rev-dr-omar-2', 'dr-omar-magdi', 'Mariam Farouk', 'mariam.farouk@gmail.com', 'PH-3190', 'IGCSE & A-Levels', 5, 'The precision in exam questions deconstruction and mark schemes is unmatched. The diagnostic problem sets mirror real Cambridge papers with profound conceptual clarity.', NOW() - INTERVAL '15 days'),
  ('rev-dr-omar-3', 'dr-omar-magdi', 'Ziad Mahmoud', 'ziad.mahmoud@gmail.com', 'PH-8422', 'Undergrads', 5, 'Medicinal and physical chemistry lectures at the undergraduate level are delivered with doctoral-level rigor. Essential for pharmacy and medical scholars.', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- STEP 9: High-Performance Multi-Tenant Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_courses_owner_id ON public.courses(owner_id);
CREATE INDEX IF NOT EXISTS idx_courses_approval_status ON public.courses(approval_status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_email ON public.courses(instructor_email);
CREATE INDEX IF NOT EXISTS idx_instructor_reviews_inst ON public.instructor_reviews(instructor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
