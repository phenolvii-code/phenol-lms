-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 016
-- Instructor directory becomes REAL: `instructor_profiles` table (task د)
--
-- WHY:
--   The public faculty directory was assembled in the browser from
--   localStorage + broad scans of registered_students/profiles. After 014
--   those scans return nothing for non-admins, so the directory needs a real,
--   gated DB source.
--
-- WHAT THIS DOES:
--   1. `instructor_profiles` table — one row per faculty member (name, email,
--      whatsapp, avatar, title, bio, specialization, is_published).
--   2. RLS: published rows are public-read (faculty page); unpublished are
--      visible to their owner and the super_admin only. Owners manage their
--      own row; the super_admin manages everything.
--   3. Backfill: every existing profiles.role='instructor' account (plus the
--      founder) gets a row; names/phones merged from registered_students
--      where the id is a real uuid (fake 'stu-...' rows are ignored safely).
--   4. `decide_instructor_request` upgraded: approving a faculty application
--      now ALSO creates/updates the instructor's profile row automatically.
--
-- SAFETY:
--   - Idempotent: safe to run twice.
--   - Changes no roles, deletes no rows. Student-facing behavior unchanged.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor (errors log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructor_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  whatsapp text,
  avatar text,
  title text,
  bio text,
  specialization text,
  supervision_scope text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instructor_profiles_published
  ON public.instructor_profiles(is_published);

ALTER TABLE public.instructor_profiles ENABLE ROW LEVEL SECURITY;

-- Published profiles are public-read (faculty page); unpublished = owner + director
DROP POLICY IF EXISTS "instructor profiles read" ON public.instructor_profiles;
CREATE POLICY "instructor profiles read" ON public.instructor_profiles
  FOR SELECT USING (
    is_published
    OR user_id = auth.uid()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "instructor profiles manage own" ON public.instructor_profiles;
CREATE POLICY "instructor profiles manage own" ON public.instructor_profiles
  FOR ALL USING (
    user_id = auth.uid()
    OR public.is_super_admin()
  ) WITH CHECK (
    user_id = auth.uid()
    OR public.is_super_admin()
  );

-- ------------------------------------------------------------------------------
-- 2) Backfill: every current instructor (and the founder) gets a profile row.
--    Fake 'stu-...' ids are excluded via the uuid regex (never guess).
-- ------------------------------------------------------------------------------
INSERT INTO public.instructor_profiles (user_id, name, email, whatsapp, title, is_published)
SELECT
  u.id,
  coalesce(
    nullif(rs.name, ''),
    nullif(u.raw_user_meta_data->>'full_name', ''),
    split_part(lower(trim(u.email)), '@', 1)
  ),
  lower(trim(u.email)),
  rs.phone,
  CASE WHEN lower(trim(u.email)) = 'phenolvii@gmail.com'
       THEN 'Academic Director & Senior Chemistry Fellow'
       ELSE 'Academic Instructor & Faculty Fellow' END,
  true
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN public.registered_students rs
  ON rs.id ~ '^[0-9a-fA-F-]{36}$' AND rs.id::uuid = u.id
WHERE p.role = 'instructor'
   OR lower(trim(u.email)) = 'phenolvii@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 2b) Second role store: registered_students.role = 'INSTRUCTOR'. The old
--     directory read BOTH stores; the backfill must too, or real instructor
--     accounts (promoted only in registered_students) would vanish from the
--     public directory. Fake 'stu-...' roster rows cannot match auth.users
--     here, so only REAL accounts are backfilled.
INSERT INTO public.instructor_profiles (user_id, name, email, whatsapp, title, is_published)
SELECT
  u.id,
  coalesce(
    nullif(rs.name, ''),
    nullif(u.raw_user_meta_data->>'full_name', ''),
    split_part(lower(trim(u.email)), '@', 1)
  ),
  lower(trim(u.email)),
  rs.phone,
  'Academic Instructor & Faculty Fellow',
  true
FROM public.registered_students rs
JOIN auth.users u ON u.id::text = rs.id
WHERE upper(coalesce(rs.role, '')) = 'INSTRUCTOR'
ON CONFLICT (user_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3) decide_instructor_request: approval now also creates the profile row
--    (full function rewritten from 009 with the new block appended)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decide_instructor_request(
  p_request_id uuid,
  p_decision text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.instructor_requests;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: only the academy director can decide faculty applications';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'bad decision: %', p_decision;
  END IF;

  SELECT * INTO v_req FROM public.instructor_requests WHERE id = p_request_id;
  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'request not found';
  END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'request already decided';
  END IF;

  UPDATE public.instructor_requests
  SET status = p_decision,
      decided_by = auth.uid(),
      decided_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  IF p_decision = 'approved' THEN
    -- Promote in BOTH role stores (per platform rule: profiles + registered_students)
    UPDATE public.profiles SET role = 'instructor' WHERE id = v_req.user_id;

    UPDATE public.registered_students
    SET role = 'INSTRUCTOR',
        phone = coalesce(nullif(v_req.whatsapp, ''), phone)
    WHERE id = v_req.user_id::text;

    -- Directory profile (migration 016): created from the application data
    INSERT INTO public.instructor_profiles
      (user_id, name, email, whatsapp, title, bio, specialization, is_published)
    VALUES (
      v_req.user_id,
      coalesce(nullif(v_req.name, ''), split_part(v_req.email, '@', 1)),
      lower(trim(v_req.email)),
      v_req.whatsapp,
      v_req.requested_title,
      v_req.bio,
      v_req.specialization,
      true
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name,
      whatsapp = coalesce(nullif(EXCLUDED.whatsapp, ''), public.instructor_profiles.whatsapp),
      title = coalesce(nullif(EXCLUDED.title, ''), public.instructor_profiles.title),
      bio = coalesce(nullif(EXCLUDED.bio, ''), public.instructor_profiles.bio),
      specialization = coalesce(nullif(EXCLUDED.specialization, ''), public.instructor_profiles.specialization),
      is_published = true,
      updated_at = now();
  END IF;

  RETURN 'OK';
END;
$$;

REVOKE ALL ON FUNCTION public.decide_instructor_request(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.decide_instructor_request(uuid, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 4) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 016 (instructor directory from the database) applied';
