-- ============================================================================
-- PHENOL ACADEMY — Supabase Production Database Schema
-- Designed for Dr. Omar Magdi
-- 100% Clean Architecture (Zero Dummy Data / Real-time Sync / RLS Enabled)
-- ============================================================================

-- 1. REGISTERED STUDENTS DIRECTORY (All registered scholars)
CREATE TABLE IF NOT EXISTS public.registered_students (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT 'Pending WhatsApp Verification',
    academic_code TEXT NOT NULL,
    academic_track TEXT NOT NULL DEFAULT 'Public Secondary AR',
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'STUDENT',
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.registered_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access registered_students" ON public.registered_students;
CREATE POLICY "Public full access registered_students" ON public.registered_students FOR ALL USING (true) WITH CHECK (true);


-- 2. COURSE ACTIVATION REQUESTS & ENROLLMENT ROSTER
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    student_code TEXT NOT NULL,
    student_track TEXT NOT NULL,
    student_avatar TEXT,
    course_id TEXT NOT NULL,
    course_title TEXT NOT NULL,
    course_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    progress_percent INT DEFAULT 0,
    completed_lessons_count INT DEFAULT 0,
    total_lessons_count INT DEFAULT 0,
    average_quiz_grade NUMERIC DEFAULT 0,
    last_active_date TEXT DEFAULT 'Active today',
    last_lesson_title TEXT
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access course_enrollments" ON public.course_enrollments;
CREATE POLICY "Public full access course_enrollments" ON public.course_enrollments FOR ALL USING (true) WITH CHECK (true);


-- 3. ADMISSION & WAITLIST APPLICATIONS
CREATE TABLE IF NOT EXISTS public.waitlist_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    academic_track TEXT NOT NULL,
    target_course TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'contacted', 'declined')),
    notes TEXT
);

ALTER TABLE public.waitlist_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access waitlist_applications" ON public.waitlist_applications;
CREATE POLICY "Public full access waitlist_applications" ON public.waitlist_applications FOR ALL USING (true) WITH CHECK (true);


-- 4. REAL ACADEMIC COURSES
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    sub_title TEXT,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('thanaweya-arabic', 'thanaweya-languages', 'igcse-stem', 'university')),
    category_name TEXT NOT NULL,
    level TEXT NOT NULL,
    molecular_formula TEXT,
    thumbnail TEXT,
    total_hours TEXT,
    color_accent TEXT DEFAULT '#641C32',
    accent_bg TEXT DEFAULT 'bg-burgundy-950',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access courses" ON public.courses;
CREATE POLICY "Public full access courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);


-- 5. LECTURE MODULES
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration TEXT NOT NULL,
    type TEXT DEFAULT 'video' CHECK (type IN ('video', 'lab', 'pdf')),
    summary TEXT,
    key_formulas TEXT[],
    video_url TEXT,
    pdf_notes_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access lessons" ON public.lessons;
CREATE POLICY "Public full access lessons" ON public.lessons FOR ALL USING (true) WITH CHECK (true);


-- 6. STUDENT PROBLEM SET SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.student_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    student_code TEXT NOT NULL,
    task_title TEXT NOT NULL,
    solution_notes TEXT NOT NULL,
    grade NUMERIC,
    max_grade NUMERIC DEFAULT 20,
    dr_feedback TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'graded')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access student_submissions" ON public.student_submissions;
CREATE POLICY "Public full access student_submissions" ON public.student_submissions FOR ALL USING (true) WITH CHECK (true);


-- 7. TIMELINE POSTS & DISCUSSIONS
CREATE TABLE IF NOT EXISTS public.timeline_posts (
    id TEXT PRIMARY KEY,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    author_role TEXT NOT NULL DEFAULT 'STUDENT',
    author_avatar TEXT,
    track_badge TEXT,
    content TEXT NOT NULL,
    molecular_formula TEXT,
    reactions JSONB DEFAULT '{"flask":0,"bulb":0,"heart":0}'::jsonb,
    comments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.timeline_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access timeline_posts" ON public.timeline_posts;
CREATE POLICY "Public full access timeline_posts" ON public.timeline_posts FOR ALL USING (true) WITH CHECK (true);


-- ============================================================================
-- 8. AUTOMATIC AUTH TRIGGER: SYNC EVERY REGISTERED USER TO DATABASE
-- Whenever a student signs up via Email or Google OAuth, they immediately
-- appear in Dr. Omar's Student Directory!
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  -- Ignore instructor email from student directory
  IF NEW.email = 'phenolvii@gmail.com' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.registered_students (
    id,
    email,
    name,
    phone,
    academic_code,
    academic_track,
    role,
    registered_at,
    last_active
  )
  VALUES (
    NEW.id::text,
    LOWER(TRIM(NEW.email)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), 'Pending WhatsApp Verification'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'academic_code', ''), 'PH-' || UPPER(SUBSTRING(MD5(NEW.email) FROM 1 FOR 4))),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'academic_level', ''), 'Public Secondary AR'),
    'STUDENT',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    name = CASE WHEN EXCLUDED.name <> '' THEN EXCLUDED.name ELSE public.registered_students.name END,
    phone = CASE WHEN EXCLUDED.phone <> 'Pending WhatsApp Verification' THEN EXCLUDED.phone ELSE public.registered_students.phone END,
    last_active = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ============================================================================
-- 9. BACKFILL EXISTING USERS (Import any account that already registered)
-- ============================================================================

INSERT INTO public.registered_students (
  id,
  email,
  name,
  phone,
  academic_code,
  academic_track,
  role,
  registered_at,
  last_active
)
SELECT 
  u.id::text,
  LOWER(TRIM(u.email)),
  COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
  COALESCE(NULLIF(u.raw_user_meta_data->>'phone', ''), 'Pending WhatsApp Verification'),
  COALESCE(NULLIF(u.raw_user_meta_data->>'academic_code', ''), 'PH-' || UPPER(SUBSTRING(MD5(u.email) FROM 1 FOR 4))),
  COALESCE(NULLIF(u.raw_user_meta_data->>'academic_level', ''), 'Public Secondary AR'),
  'STUDENT',
  u.created_at,
  NOW()
FROM auth.users u
WHERE LOWER(TRIM(u.email)) NOT IN ('phenolvii@gmail.com')
ON CONFLICT (email) DO NOTHING;
