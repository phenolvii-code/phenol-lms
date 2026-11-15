-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 013
-- RLS Isolation: Waitlist & Student Submissions Scoped By Course Ownership
--
-- WHAT THIS FIXES:
--   1. student_submissions: the "admin all" policy gave EVERY instructor
--      read/update/delete on EVERY student's work. Instructors now see and
--      grade ONLY submissions of their own courses.
--   2. waitlist_applications: same hole — every instructor saw every
--      applicant. Now scoped to applications linked to their own courses;
--      unlinked inquiries go to the super_admin (academy director) alone.
--   3. Both tables get a course_id column so isolation is row-level, and
--      waitlist rows are backfilled from target_course text where the match
--      is unambiguous (never guessed when ambiguous).
--
-- SAFETY:
--   - Idempotent: safe to run twice.
--   - Does NOT delete any row. Backfill only fills empty course_id values.
--   - Students keep: read own submissions, submit into courses they are
--     actively enrolled in. Anon visitors can still apply to the waitlist.
--
-- BEFORE RUNNING:
--   1. Take a full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor (see errors log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: Course linkage columns
-- ------------------------------------------------------------------------------
ALTER TABLE public.student_submissions
  ADD COLUMN IF NOT EXISTS course_id text REFERENCES public.courses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_student_submissions_course
  ON public.student_submissions(course_id);

ALTER TABLE public.waitlist_applications
  ADD COLUMN IF NOT EXISTS course_id text REFERENCES public.courses(id);

CREATE INDEX IF NOT EXISTS idx_waitlist_course
  ON public.waitlist_applications(course_id);

-- ------------------------------------------------------------------------------
-- STEP 2: Backfill waitlist course_id from target_course text
--         ONLY when exactly one course matches (no guessing on ambiguity)
-- ------------------------------------------------------------------------------
UPDATE public.waitlist_applications w
SET course_id = match.cid
FROM (
  SELECT w2.id AS wid, MIN(c.id) AS cid
  FROM public.waitlist_applications w2
  JOIN public.courses c
    ON lower(w2.target_course) LIKE '%' || lower(c.code) || '%'
    OR lower(w2.target_course) LIKE '%' || lower(c.title) || '%'
  GROUP BY w2.id
  HAVING COUNT(DISTINCT c.id) = 1
) match
WHERE w.id = match.wid
  AND w.course_id IS NULL;

-- ------------------------------------------------------------------------------
-- STEP 3: student_submissions RLS — ownership-scoped
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin all" ON public.student_submissions;
DROP POLICY IF EXISTS "submissions own read" ON public.student_submissions;

DROP POLICY IF EXISTS "submissions read own or course owner" ON public.student_submissions;
CREATE POLICY "submissions read own or course owner" ON public.student_submissions
  FOR SELECT USING (
    student_id = auth.uid()
    OR public.is_super_admin()
    OR (
      course_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "submissions own insert" ON public.student_submissions;
CREATE POLICY "submissions own insert" ON public.student_submissions
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND status = 'pending'
    AND grade IS NULL
    AND dr_feedback IS NULL
    AND course_id IS NOT NULL
    AND public.has_active_enrollment(course_id)
  );

DROP POLICY IF EXISTS "submissions grade own course" ON public.student_submissions;
CREATE POLICY "submissions grade own course" ON public.student_submissions
  FOR UPDATE USING (
    public.is_super_admin()
    OR (
      course_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.owner_id = auth.uid()
      )
    )
  ) WITH CHECK (
    public.is_super_admin()
    OR (
      course_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "submissions delete admin" ON public.student_submissions;
CREATE POLICY "submissions delete admin" ON public.student_submissions
  FOR DELETE USING (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- STEP 4: waitlist_applications RLS — ownership-scoped
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin all" ON public.waitlist_applications;

DROP POLICY IF EXISTS "waitlist apply" ON public.waitlist_applications;
CREATE POLICY "waitlist apply" ON public.waitlist_applications
  FOR INSERT WITH CHECK (status = 'pending' AND notes IS NULL);

-- Office walk-in registration by the course owner (carries notes)
DROP POLICY IF EXISTS "waitlist office register" ON public.waitlist_applications;
CREATE POLICY "waitlist office register" ON public.waitlist_applications
  FOR INSERT WITH CHECK (
    course_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "waitlist read scoped" ON public.waitlist_applications;
CREATE POLICY "waitlist read scoped" ON public.waitlist_applications
  FOR SELECT USING (
    public.is_super_admin()
    OR (
      course_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "waitlist manage scoped" ON public.waitlist_applications;
CREATE POLICY "waitlist manage scoped" ON public.waitlist_applications
  FOR UPDATE USING (
    public.is_super_admin()
    OR (
      course_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.owner_id = auth.uid()
      )
    )
  ) WITH CHECK (
    public.is_super_admin()
    OR (
      course_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "waitlist delete scoped" ON public.waitlist_applications;
CREATE POLICY "waitlist delete scoped" ON public.waitlist_applications
  FOR DELETE USING (
    public.is_super_admin()
    OR (
      course_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.owner_id = auth.uid()
      )
    )
  );

-- ------------------------------------------------------------------------------
-- STEP 5: Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 013 (waitlist + submissions ownership-scoped RLS) applied';
