-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 017
-- Question banks become REAL database content (gated, per-course)
--
-- WHY:
--   The course "Question Bank" tab was fed from a hardcoded file
--   (src/data/question-banks.ts) shipped inside the browser bundle. It had
--   two problems on a multi-teacher platform:
--     1. Every course WITHOUT a matching bank silently received the SAME
--        Arabic organic-chemistry questions as a "fallback" — wrong content
--        shown on other instructors' courses.
--     2. Course material hardcoded in the bundle violates the platform rule:
--        the database is the source of truth (GEMINI.md rule 1).
--
-- WHAT THIS DOES:
--   1. `question_bank_items` table — practice questions per course
--      (number, topic, question text, molecular snippet, options as JSONB).
--   2. RLS mirrors the paid-material pattern from migration 015 (booklets):
--      read = course owner / super_admin / ACTIVE-enrolled student only.
--      manage = course owner / super_admin only.
--   3. NO automatic seed: course ids are never guessed here. The previous
--      hardcoded content is preserved in
--      `supabase/optional/seed_question_bank.sql` — run it manually AFTER
--      replacing <<COURSE_ID>> with the real course id if you want it back.
--
-- SAFETY:
--   - Idempotent: safe to run twice.
--   - Creates no roles changes, deletes nothing.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor (errors log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_bank_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  number int NOT NULL,
  topic text,
  question text NOT NULL,
  molecular_snippet text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, number)
);

CREATE INDEX IF NOT EXISTS idx_question_bank_items_course
  ON public.question_bank_items(course_id, number);

ALTER TABLE public.question_bank_items ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2) RLS — same gating as booklets (paid course material)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "question banks read" ON public.question_bank_items;
CREATE POLICY "question banks read" ON public.question_bank_items
  FOR SELECT USING (
    public.is_super_admin()
    OR public.owns_course(course_id)
    OR public.has_active_enrollment(course_id)
  );

DROP POLICY IF EXISTS "question banks manage" ON public.question_bank_items;
CREATE POLICY "question banks manage" ON public.question_bank_items
  FOR ALL USING (
    public.is_super_admin()
    OR public.owns_course(course_id)
  ) WITH CHECK (
    public.is_super_admin()
    OR public.owns_course(course_id)
  );

-- ------------------------------------------------------------------------------
-- 3) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 017 (question banks in the database) applied';
