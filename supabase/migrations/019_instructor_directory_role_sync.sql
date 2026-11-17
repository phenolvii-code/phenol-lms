-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 019
-- Instructor directory follows role changes
--
-- WHY:
--   016 auto-creates a directory row on the *approval* flow
--   (decide_instructor_request) and backfilled the instructors that existed
--   back then. But promoting a user to instructor from the super-admin panel
--   goes through admin_set_user_role (007_fixed), which only updated
--   profiles.role + registered_students.role — it never created a directory
--   row. Result: an instructor promoted that way (e.g. Mohamed Mekawy,
--   mk2999376@gmail.com) has role = instructor in BOTH stores yet is invisible
--   on /faculty, because instructor_profiles has no row for them (and the
--   public read policy only exposes is_published rows).
--
-- WHAT THIS DOES:
--   1. Backfills a published directory row for every instructor-role account
--      (profiles.role = 'instructor' OR registered_students.role = 'INSTRUCTOR')
--      that has no row yet. Founder is skipped (already has a row; never guess).
--   2. Rewrites admin_set_user_role (same signature; FULL body, super_admin
--      gate preserved) so the directory follows the role:
--        - role -> 'instructor' : upsert the row and publish it
--        - role -> 'student'    : keep the row but unpublish it
--   3. Audit marker for migration 019.
--
-- SAFETY:
--   - Idempotent: safe to run twice.
--   - Inserts/republishes directory rows only; deletes NOTHING.
--   - admin_set_user_role keeps its strict is_super_admin() gate and its
--     "cannot alter founder role" rule.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it (errors-log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) Backfill: every instructor-role account gets a published directory row.
-- ------------------------------------------------------------------------------
INSERT INTO public.instructor_profiles (
  user_id, name, email, whatsapp, title, bio, specialization,
  supervision_scope, is_published
)
SELECT
  u.id,
  coalesce(
    nullif(rs.name, ''),
    nullif(u.raw_user_meta_data->>'full_name', ''),
    split_part(lower(trim(u.email)), '@', 1)
  ),
  lower(trim(u.email)),
  CASE WHEN rs.phone ~ '^[0-9+\-\s]{7,}$' THEN rs.phone END,
  'Academic Instructor & Faculty Fellow',
  'Faculty educator dedicated to first-principles conceptual clarity and causal curricular deconstruction.',
  'General Sciences',
  'Faculty Teaching Fellow',
  true
FROM auth.users u
LEFT JOIN public.registered_students rs
  ON lower(trim(rs.email)) = lower(trim(u.email))
LEFT JOIN public.profiles p
  ON p.id = u.id
WHERE (p.role = 'instructor' OR upper(coalesce(rs.role, '')) = 'INSTRUCTOR')
  AND lower(trim(u.email)) <> 'phenolvii@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.instructor_profiles ip WHERE ip.user_id = u.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2) admin_set_user_role: same signature + gate, now keeps the directory in
--    sync (promote -> publish row, demote -> unpublish row).
--    FULL body from 007_fixed with the directory block added.
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_set_user_role(text, text);
CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_user_email text, p_role text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_clean_role text;
  v_name text;
  v_phone text;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: only academy founder (super_admin) can change user roles';
  END IF;

  v_clean_role := lower(trim(p_role));
  IF v_clean_role NOT IN ('student', 'instructor') THEN
    RAISE EXCEPTION 'invalid role: %', p_role;
  END IF;

  IF lower(trim(p_user_email)) = 'phenolvii@gmail.com' THEN
    RAISE EXCEPTION 'forbidden: cannot alter founder role';
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(trim(email)) = lower(trim(p_user_email));

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, role)
    VALUES (v_user_id, v_clean_role)
    ON CONFLICT (id) DO UPDATE SET role = v_clean_role;
  END IF;

  UPDATE public.registered_students
  SET role = upper(v_clean_role)
  WHERE lower(trim(email)) = lower(trim(p_user_email));

  -- Directory row follows the role (migration 019).
  IF v_user_id IS NOT NULL THEN
    SELECT
      coalesce(
        nullif(rs.name, ''),
        nullif(u.raw_user_meta_data->>'full_name', ''),
        split_part(lower(trim(u.email)), '@', 1)
      ),
      CASE WHEN rs.phone ~ '^[0-9+\-\s]{7,}$' THEN rs.phone END
    INTO v_name, v_phone
    FROM auth.users u
    LEFT JOIN public.registered_students rs
      ON lower(trim(rs.email)) = lower(trim(u.email))
    WHERE u.id = v_user_id;

    IF v_clean_role = 'instructor' THEN
      INSERT INTO public.instructor_profiles (
        user_id, name, email, whatsapp, is_published
      )
      VALUES (
        v_user_id,
        coalesce(v_name, split_part(lower(trim(p_user_email)), '@', 1)),
        lower(trim(p_user_email)),
        v_phone,
        true
      )
      ON CONFLICT (user_id) DO UPDATE
        SET is_published = true,
            email = excluded.email,
            whatsapp = coalesce(excluded.whatsapp, instructor_profiles.whatsapp),
            name  = CASE WHEN instructor_profiles.name IS NULL
                          OR instructor_profiles.name = ''
                         THEN excluded.name
                         ELSE instructor_profiles.name END;
    ELSE
      UPDATE public.instructor_profiles
      SET is_published = false
      WHERE user_id = v_user_id;
    END IF;
  END IF;

  RETURN 'OK';
END $$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 019 (instructor directory rows follow role changes; missing rows backfilled) applied';
