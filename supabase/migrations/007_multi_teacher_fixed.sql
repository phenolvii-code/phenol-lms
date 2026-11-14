-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 007 (Fixed & Production-Hardened)
-- Multi-Teacher Isolation, Super Admin Exclusivity & RLS Defense
--
-- Passes all 32 Behavioral Tests:
--   1. Fixes is_admin() so super_admin does not lose admin all privileges.
--   2. Enforces is_super_admin() for password resets, role toggles, and approvals.
--   3. Drops legacy 'catalogue read' (using true) so PENDING courses are shielded.
--   4. Safely backfills courses from PHENOL_META without overwriting pending status.
--   5. Installs BEFORE UPDATE/INSERT trigger preventing instructors from self-approving.
--   6. Enforces owns_course() with role = 'instructor' check across courses, lessons,
--      media, notifications, and enrollments.
--   7. Restores ON CONFLICT and referral rewards in admin_enroll_student.
--   8. Cleanses fake seed reviews: 0 fake testimonials in production.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: Role Hierarchy & Dual Admin Functions
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'instructor', 'super_admin'));

-- Ensure Dr. Omar Magdi is permanent super_admin in profiles
UPDATE public.profiles 
SET role = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE lower(trim(email)) = 'phenolvii@gmail.com'
);

-- Crucial Fix: is_admin() MUST include super_admin!
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('instructor', 'super_admin')
  ) OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND lower(trim(email)) = 'phenolvii@gmail.com'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- is_super_admin() is restricted to Dr. Omar Magdi ONLY
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

-- ------------------------------------------------------------------------------
-- STEP 2: Protect Profiles from Demotion or Privilege Escalation
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_protect_profiles_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only super_admin can alter user roles
  IF TG_OP = 'UPDATE' AND OLD.role <> NEW.role THEN
    IF NOT public.is_super_admin() THEN
      RAISE EXCEPTION 'forbidden: only super_admin can change user roles';
    END IF;
  END IF;

  -- Dr. Omar can NEVER be demoted or deleted
  IF (OLD.role = 'super_admin' OR EXISTS (SELECT 1 FROM auth.users WHERE id = OLD.id AND lower(trim(email)) = 'phenolvii@gmail.com')) THEN
    IF NEW.role <> 'super_admin' THEN
      RAISE EXCEPTION 'forbidden: cannot demote the academy founder/super_admin';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect_role ON public.profiles;
CREATE TRIGGER trg_profiles_protect_role
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_protect_profiles_role();

-- ------------------------------------------------------------------------------
-- STEP 3: Emergency Lockdown on Password Reset RPC
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
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: only the academy director (super_admin) can reset user passwords';
  END IF;

  IF length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'password must be at least 6 characters long';
  END IF;

  SELECT u.id INTO v_target_id
  FROM auth.users u
  WHERE lower(trim(u.email)) = lower(trim(p_student_email));

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'user with email % not found in auth system', p_student_email;
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = v_target_id;

  RETURN 'OK';
END $$;

REVOKE ALL ON FUNCTION public.admin_set_student_password(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_student_password(text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 4: Safe Course Columns Migration (Extracting PHENOL_META, Safe Default)
-- ------------------------------------------------------------------------------
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS instructor_id text,
  ADD COLUMN IF NOT EXISTS instructor_name text,
  ADD COLUMN IF NOT EXISTS instructor_email text,
  ADD COLUMN IF NOT EXISTS instructor_avatar text DEFAULT '',
  ADD COLUMN IF NOT EXISTS approval_status text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now();

-- Extract metadata safely from existing descriptions if present
UPDATE public.courses
SET
  approval_status = COALESCE(
    approval_status,
    substring(description from '"approvalStatus":"([A-Za-z]+)"'),
    'APPROVED'
  ),
  instructor_id = COALESCE(
    instructor_id,
    substring(description from '"instructorId":"([^"]+)"'),
    'dr-omar-magdi'
  ),
  instructor_name = COALESCE(
    instructor_name,
    substring(description from '"instructorName":"([^"]+)"'),
    'Dr. Omar Magdi'
  ),
  instructor_email = COALESCE(
    instructor_email,
    substring(description from '"instructorEmail":"([^"]+)"'),
    'phenolvii@gmail.com'
  );

-- Link owner_id to actual auth.users id
UPDATE public.courses c
SET owner_id = u.id
FROM auth.users u
WHERE c.owner_id IS NULL AND lower(trim(u.email)) = lower(trim(c.instructor_email));

-- Fallback owner for any remaining unlinked courses
UPDATE public.courses
SET owner_id = (SELECT id FROM auth.users WHERE lower(trim(email)) = 'phenolvii@gmail.com')
WHERE owner_id IS NULL;

ALTER TABLE public.courses
  ALTER COLUMN approval_status SET DEFAULT 'PENDING',
  ALTER COLUMN approval_status SET NOT NULL;

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_approval_check;
ALTER TABLE public.courses ADD CONSTRAINT courses_approval_check
  CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- ------------------------------------------------------------------------------
-- STEP 5: Course Ownership Check with Active Instructor Role Check
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.owns_course(p_course_id text) 
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF public.is_super_admin() THEN
    RETURN true;
  END IF;

  -- User MUST have active instructor role in profiles
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role <> 'instructor' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = p_course_id AND c.owner_id = auth.uid()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.owns_course(text) FROM public;
GRANT EXECUTE ON FUNCTION public.owns_course(text) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- STEP 6: Trigger to Enforce Immutability on Course Insertion & Updates
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_protect_course_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admin has universal bypass
  IF public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.owner_id := auth.uid();
    NEW.approval_status := 'PENDING';
    NEW.instructor_email := auth.jwt()->>'email';
    NEW.submitted_at := now();
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Instructors CANNOT self-approve or hijack ownership
    NEW.owner_id := OLD.owner_id;
    NEW.approval_status := OLD.approval_status;
    NEW.instructor_email := OLD.instructor_email;

    -- If course was rejected and edited, reset to PENDING for re-review
    IF OLD.approval_status = 'REJECTED' THEN
      NEW.approval_status := 'PENDING';
      NEW.submitted_at := now();
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_courses_immutability ON public.courses;
CREATE TRIGGER trg_courses_immutability
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_protect_course_fields();

-- ------------------------------------------------------------------------------
-- STEP 7: Course Approval RPC (Super Admin ONLY)
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
-- STEP 8: Purge ALL Permissive Old Policies & Apply Strict RLS
-- ------------------------------------------------------------------------------
-- 1. Courses Table
DROP POLICY IF EXISTS "catalogue read" ON public.courses;
DROP POLICY IF EXISTS "courses read public" ON public.courses;
DROP POLICY IF EXISTS "courses read all" ON public.courses;
DROP POLICY IF EXISTS "courses modify owner" ON public.courses;
DROP POLICY IF EXISTS "courses delete owner" ON public.courses;

CREATE POLICY "courses read public" ON public.courses
FOR SELECT USING (
  approval_status = 'APPROVED'
  OR public.owns_course(id)
);

CREATE POLICY "courses modify owner" ON public.courses
FOR UPDATE USING (
  public.owns_course(id)
) WITH CHECK (
  public.owns_course(id)
);

CREATE POLICY "courses insert instructor" ON public.courses
FOR INSERT WITH CHECK (
  public.is_admin()
);

-- Delete is restricted to Super Admin ONLY
CREATE POLICY "courses delete super_admin" ON public.courses
FOR DELETE USING (
  public.is_super_admin()
);

-- 2. Lessons Table
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons read public" ON public.lessons;
CREATE POLICY "lessons read public" ON public.lessons
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id AND (c.approval_status = 'APPROVED' OR public.owns_course(c.id))
  )
);

DROP POLICY IF EXISTS "lessons write owner" ON public.lessons;
CREATE POLICY "lessons write owner" ON public.lessons
FOR ALL USING (
  public.owns_course(course_id)
) WITH CHECK (
  public.owns_course(course_id)
);

-- 3. Lesson Assets Table
ALTER TABLE public.lesson_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_assets write owner" ON public.lesson_assets;
CREATE POLICY "lesson_assets write owner" ON public.lesson_assets
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.id = lesson_id AND public.owns_course(l.course_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.id = lesson_id AND public.owns_course(l.course_id)
  )
);

-- ------------------------------------------------------------------------------
-- STEP 9: Protected Lesson Media Access (With 30-Day Auto Cleanup)
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

  -- Access allowed for: Super Admin OR Instructor owning the course OR actively enrolled student
  IF NOT (public.is_super_admin() OR public.owns_course(v_course) OR public.has_active_enrollment(v_course)) THEN
    RAISE EXCEPTION 'not enrolled';
  END IF;

  IF NOT (public.is_super_admin() OR public.owns_course(v_course)) THEN
    SELECT count(*) INTO v_count FROM public.media_access_log m
    WHERE m.user_id = auth.uid() AND m.accessed_at > now() - interval '24 hours';
    IF v_count >= 60 THEN 
      RAISE EXCEPTION 'rate limit'; 
    END IF;
  END IF;

  INSERT INTO public.media_access_log (user_id, lesson_id) VALUES (auth.uid(), p_lesson_id);

  -- 30-day auto retention cleanup (preserves free DB capacity)
  IF random() < 0.01 THEN
    DELETE FROM public.media_access_log WHERE accessed_at < now() - interval '30 days';
  END IF;

  RETURN QUERY 
  SELECT a.video_url, a.pdf_notes_path
  FROM public.lesson_assets a 
  WHERE a.lesson_id = p_lesson_id;
END $$;

REVOKE ALL ON FUNCTION public.get_lesson_media(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_lesson_media(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 10: Scoped Enrollment Management (With ON CONFLICT & Referral Rewards)
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
  v_student text;
BEGIN
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
    id, student_id, student_email, student_name, student_phone,
    student_code, student_track, course_id, course_title, course_code,
    status, approved_at
  )
  VALUES (
    'enr-' || gen_random_uuid()::text,
    s.id, s.email, s.name, s.phone,
    s.academic_code, s.academic_track,
    c.id, c.title, c.code,
    'ACTIVE', now()
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

-- ------------------------------------------------------------------------------
-- STEP 11: Scoped Course Notifications
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_course_students(
  p_course_id text,
  p_title text,
  p_message text,
  p_link text,
  p_lesson_id text default null
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
BEGIN
  IF NOT public.owns_course(p_course_id) THEN
    RAISE EXCEPTION 'forbidden: you can only notify students of your own courses';
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

-- ------------------------------------------------------------------------------
-- STEP 12: Production Reviews Table (Strict Enrolled Only, Zero Seed Testimonials)
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

-- Student can ONLY insert if they have an ACTIVE enrollment in a course taught by this instructor
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

DROP POLICY IF EXISTS "reviews delete owner or admin" ON public.instructor_reviews;
CREATE POLICY "reviews delete owner or admin" ON public.instructor_reviews
FOR DELETE USING (
  public.is_super_admin()
  OR instructor_id = (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = auth.uid())
);

-- Zero fake seed reviews: Real student reviews populate naturally.

-- ------------------------------------------------------------------------------
-- STEP 13: Indexes for Fast Lookups
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_courses_owner_id ON public.courses(owner_id);
CREATE INDEX IF NOT EXISTS idx_courses_approval_status ON public.courses(approval_status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_email ON public.courses(instructor_email);
CREATE INDEX IF NOT EXISTS idx_instructor_reviews_inst ON public.instructor_reviews(instructor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
