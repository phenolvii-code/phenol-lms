-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 012
-- PHENOL_META Cleanup: Native Columns Are The Only Source of Truth
--
-- WHAT THIS FIXES:
--   Legacy hack: course metadata (instructor id/name/email/avatar, approval
--   status) used to be embedded as an HTML comment inside the course
--   description:
--     ...description... <!--PHENOL_META:{"instructorId":...}-->
--   The courses table ALREADY has native columns for all of that (added in
--   migration 007). The comment leaked into the student-facing description,
--   and the client kept re-writing it on every save.
--
--   This migration:
--   1. Backfills any EMPTY native column from the embedded meta comment
--      (NEVER overwrites a real value — existing data wins).
--   2. Strips the <!--PHENOL_META:...--> comment from every description.
--   3. Malformed/unparseable comments are still stripped (columns untouched).
--
-- SAFETY:
--   - Idempotent: safe to run twice (second run finds nothing).
--   - Never deletes or overwrites existing course data.
--
-- BEFORE RUNNING:
--   1. Take a full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor (see errors log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: Backfill empty native columns from meta, then strip the comment
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  m jsonb;
BEGIN
  FOR r IN
    SELECT id, description FROM public.courses
    WHERE description LIKE '%PHENOL_META%'
  LOOP
    BEGIN
      m := substring(r.description FROM '<!--PHENOL_META:(\{.*?\})-->')::jsonb;

      UPDATE public.courses c SET
        instructor_email  = coalesce(
          nullif(c.instructor_email, ''),
          nullif(m->>'instructorEmail', ''),
          c.instructor_email
        ),
        instructor_name   = coalesce(
          nullif(c.instructor_name, ''),
          nullif(m->>'instructorName', ''),
          c.instructor_name
        ),
        instructor_id     = coalesce(
          nullif(c.instructor_id, ''),
          nullif(m->>'instructorId', ''),
          c.instructor_id
        ),
        instructor_avatar = coalesce(
          nullif(c.instructor_avatar, ''),
          nullif(m->>'instructorAvatar', ''),
          c.instructor_avatar
        ),
        approval_status   = coalesce(
          c.approval_status,
          nullif(m->>'approvalStatus', ''),
          'APPROVED'
        ),
        submitted_at      = coalesce(
          c.submitted_at,
          nullif(m->>'submittedAt', '')::timestamptz
        ),
        description       = btrim(
          regexp_replace(r.description, '<!--PHENOL_META:\{.*?\}-->', '', 'g')
        )
      WHERE c.id = r.id;

    EXCEPTION WHEN OTHERS THEN
      -- Malformed meta (not valid JSON): never touch native columns,
      -- just remove the comment so the description reads clean.
      UPDATE public.courses
      SET description = btrim(
        regexp_replace(description, '<!--PHENOL_META:\{.*?\}-->', '', 'g')
      )
      WHERE id = r.id;
    END;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- STEP 2: Verify — must return 0 rows
-- ------------------------------------------------------------------------------
select id, title
from public.courses
where description like '%PHENOL_META%';

-- ------------------------------------------------------------------------------
-- STEP 3: Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 012 (PHENOL_META stripped from descriptions, native columns authoritative) applied';
