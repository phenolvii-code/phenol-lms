-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 015
-- Booklets become PAID material: out of public/, into a gated private bucket
--
-- WHY (verified 2026-11-16):
--   public/booklets/ (lesson PDFs + HTML dossiers) is statically served to
--   ANYONE who knows the URL. Owner confirmed these are PAID course material.
--   Also: the dashboard "Academic Booklets" tab is a mock (fake titles, a
--   Download button that downloads nothing).
--
-- WHAT THIS DOES:
--   1. Private storage bucket "booklets" (files uploaded by the owner there).
--   2. Real `booklets` table in the DB (title, description, course link,
--      storage path) - replaces the mock.
--   3. Download gated by RLS: only students with an ACTIVE enrollment in the
--      linked course, the course owner, or the super_admin can get a signed
--      URL. Booklets with no course link = super_admin only (never public).
--   4. Seeds the 3 known dossiers and links course_id where exactly ONE
--      course matches the keyword (never guesses on ambiguity).
--
-- SAFETY:
--   - Idempotent: safe to run twice.
--   - Deletes nothing; public/ removal happens in the code deploy afterwards.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor (errors log rule 8).
--   3. AFTER running: upload the 3 files into Storage > booklets (root level,
--      EXACT names): phenol-chemistry-lesson1.pdf, organic-chemistry-lesson-1.html,
--      phenol-chemistry-lesson1.html
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) Private storage bucket
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('booklets', 'booklets', false)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2) Real booklets table (replaces the mock)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booklets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  course_id text REFERENCES public.courses(id) ON DELETE SET NULL,
  course_name text,
  storage_path text NOT NULL UNIQUE,
  edition text,
  pages int,
  size_label text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booklets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booklets read" ON public.booklets;
CREATE POLICY "booklets read" ON public.booklets
  FOR SELECT USING (
    public.is_super_admin()
    OR public.owns_course(course_id)
    OR public.has_active_enrollment(course_id)
  );

DROP POLICY IF EXISTS "booklets manage" ON public.booklets;
CREATE POLICY "booklets manage" ON public.booklets
  FOR ALL USING (
    public.is_super_admin()
    OR public.owns_course(course_id)
  ) WITH CHECK (
    public.is_super_admin()
    OR public.owns_course(course_id)
  );

-- ------------------------------------------------------------------------------
-- 3) Gating helper for the storage policy (security definer -> no RLS recursion)
--    Rule: no course link = super_admin ONLY. Never public.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_download_booklet(p_bucket text, p_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_bucket = 'booklets' AND EXISTS (
    SELECT 1 FROM public.booklets b
    WHERE b.storage_path = p_name
      AND (
        public.is_super_admin()
        OR (b.course_id IS NOT NULL AND public.owns_course(b.course_id))
        OR (b.course_id IS NOT NULL AND public.has_active_enrollment(b.course_id))
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_download_booklet(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.can_download_booklet(text, text) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 4) storage.objects policies (scoped to the booklets bucket only)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "booklets download gated" ON storage.objects;
CREATE POLICY "booklets download gated" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'booklets'
    AND public.can_download_booklet('booklets', name)
  );

DROP POLICY IF EXISTS "booklets manage super_admin" ON storage.objects;
CREATE POLICY "booklets manage super_admin" ON storage.objects
  FOR ALL USING (
    bucket_id = 'booklets' AND public.is_super_admin()
  ) WITH CHECK (
    bucket_id = 'booklets' AND public.is_super_admin()
  );

-- ------------------------------------------------------------------------------
-- 5) Seed the 3 known dossiers (idempotent by storage_path)
-- ------------------------------------------------------------------------------
INSERT INTO public.booklets (title, description, course_name, storage_path, edition)
VALUES
  ('Phenol Chemistry — Lesson 1 Dossier',
   'Full lesson dossier: structure, nomenclature, and acidity of phenols with worked examples.',
   'Phenol Chemistry', 'phenol-chemistry-lesson1.pdf', '2026/2027 Academic Edition'),
  ('Organic Chemistry — Lesson 1 Dossier',
   'Lesson 1 handout: foundational reaction mechanisms with annotated electron-pushing maps.',
   'Organic Chemistry', 'organic-chemistry-lesson-1.html', '2026/2027 Academic Edition'),
  ('Phenol Chemistry — Lesson 1 (Web Version)',
   'HTML companion for the Lesson 1 dossier, viewable directly in the browser.',
   'Phenol Chemistry', 'phenol-chemistry-lesson1.html', '2026/2027 Academic Edition')
ON CONFLICT (storage_path) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6) Link course_id where EXACTLY one course matches the keyword (no guessing)
-- ------------------------------------------------------------------------------
UPDATE public.booklets b
SET course_id = match.cid
FROM (
  SELECT b2.id AS bid, MIN(c.id) AS cid
  FROM public.booklets b2
  JOIN public.courses c
    ON (b2.storage_path LIKE '%phenol-chemistry%'
        AND (c.title ILIKE '%phenol%' OR c.code ILIKE '%phenol%'))
    OR (b2.storage_path LIKE '%organic-chemistry%'
        AND (c.title ILIKE '%organic%' OR c.code ILIKE '%organic%'))
  GROUP BY b2.id
  HAVING COUNT(DISTINCT c.id) = 1
) match
WHERE b.id = match.bid
  AND b.course_id IS NULL;

-- ------------------------------------------------------------------------------
-- 7) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 015 (booklets = gated paid material; Academic Booklets tab is real) applied';
