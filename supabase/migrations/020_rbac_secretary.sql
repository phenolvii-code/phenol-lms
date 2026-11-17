-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 020
-- RBAC: add the Academy Secretary role (GOVERNANCE Phase 1, step 1 of 020-026)
--
-- WHY:
--   The governance expansion introduces a 4th role. The secretary will run the
--   academy's daily operations (enrollment, payments, course admin) in LATER
--   migrations (021+). THIS migration only creates the role safely:
--   no permissions are granted yet, no account is promoted automatically.
--
-- WHAT THIS DOES:
--   1. Widens profiles_role_check to accept 'secretary'
--      (registered_students.role is a free-text column - no constraint there).
--   2. Adds is_secretary(): a pure role check helper. It grants NOTHING by
--      itself; future secretary RPCs must gate with (is_super_admin() OR
--      is_secretary()) explicitly. Never is_admin().
--   3. Rewrites admin_set_user_role (same signature (text,text), super_admin
--      gate preserved, founder protection preserved) so the whitelist accepts
--      'secretary' and the instructor directory logic treats secretary like
--      student: NO directory row is created for secretaries, and any existing
--      directory row for them is unpublished.
--   4. Rewrites handle_new_auth_user (009 body preserved) to fix a latent
--      downgrade bug: the profiles ON CONFLICT branch force-set role='student'
--      on any existing row. It now PRESERVES existing elevated roles
--      (super_admin / instructor / secretary) on re-insert; brand-new accounts
--      still always start as 'student' (009's anti-escalation intent kept:
--      signup metadata is still never trusted for role).
--
-- HARD GUARANTEES (per approval):
--   - NO account is promoted to secretary by this migration (zero writes with
--     role='secretary' anywhere in this file).
--   - secretary is NOT added to is_super_admin(), is_admin() or owns_course():
--     secretaries cannot own courses, cannot approve instructors
--     (decide_instructor_request stays is_super_admin-only), cannot enroll
--     (admin_enroll_student stays super_admin OR owns_course -> requires
--     instructor role), and cannot change roles (trg_protect_profiles_role
--     stays is_super_admin-only).
--   - No records deleted, no existing role changed, signatures unchanged.
--
-- AFTER RUNNING (manual, by the super admin in the app):
--   Promote the secretary via the existing role-change UI (admin_set_user_role)
--   with role = "secretary". The migration itself never does this.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it (errors-log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) profiles_role_check: widen to include 'secretary' (additive - no data risk)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'instructor', 'super_admin', 'secretary'));

-- ------------------------------------------------------------------------------
-- 2) is_secretary(): pure role check. Grants nothing by itself.
--    NOTE: is_super_admin() does NOT imply is_secretary() here on purpose -
--    call sites must write their own explicit (is_super_admin() OR
--    is_secretary()) gate so the founder's powers are never hidden inside
--    a helper that reads as "secretary-only".
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_secretary()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'secretary'
  );
$$;

REVOKE ALL ON FUNCTION public.is_secretary() FROM public;
GRANT EXECUTE ON FUNCTION public.is_secretary() TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 3) admin_set_user_role: same signature + super_admin gate + founder rule,
--    now accepts 'secretary'. super_admin itself is NOT whitelisted (the role
--    is founder-anchored; nobody - not even this RPC - mints super_admins).
--    Directory rule (019, extended): instructor -> publish; everything else
--    (student OR secretary) -> unpublish, never create.
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
  IF v_clean_role NOT IN ('student', 'instructor', 'secretary') THEN
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

  -- Directory row follows the role (019 logic; 020 keeps secretaries out of
  -- the public faculty directory - they are administrative staff).
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
-- 4) handle_new_auth_user: 009's anti-escalation behavior preserved (every NEW
--    account is a student; signup metadata never trusted). Fix: the profiles
--    ON CONFLICT branch no longer force-downgrades an EXISTING row to student -
--    it keeps super_admin/instructor/secretary. (The roster merge already
--    never touches role - unchanged here.)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code text;
  ref_user uuid;
BEGIN
  -- Every NEW account is a STUDENT. Faculty status is granted ONLY through
  -- decide_instructor_request() by the super_admin. Client metadata is never trusted.
  IF lower(trim(coalesce(NEW.email, ''))) = 'phenolvii@gmail.com' THEN
    INSERT INTO public.profiles (id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
  ELSE
    INSERT INTO public.profiles (id, role)
    VALUES (NEW.id, 'student')
    -- Row already exists (legacy profile): PRESERVE an elevated role instead
    -- of force-downgrading it. New accounts still start as 'student'.
    ON CONFLICT (id) DO UPDATE SET role = CASE
      WHEN profiles.role IN ('super_admin', 'instructor', 'secretary')
        THEN profiles.role
      ELSE 'student'
    END;
  END IF;

  IF NEW.email IS NOT NULL AND lower(NEW.email) <> 'phenolvii@gmail.com' THEN
    INSERT INTO public.registered_students (
      id, email, name, phone, academic_code, academic_track, role
    )
    VALUES (
      NEW.id::text,
      lower(trim(NEW.email)),
      coalesce(nullif(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
      coalesce(nullif(NEW.raw_user_meta_data->>'phone', ''), 'Pending WhatsApp Verification'),
      public.generate_academic_code(),
      coalesce(nullif(NEW.raw_user_meta_data->>'academic_level', ''), 'All Tracks'),
      'STUDENT'
    )
    -- Row already exists (e.g. pre-registered roster entry): merge fields only.
    -- NEVER touch `role` here so a re-registered instructor/secretary is not demoted.
    ON CONFLICT (email) DO UPDATE SET
      name  = coalesce(nullif(registered_students.name, ''), EXCLUDED.name),
      phone = coalesce(nullif(registered_students.phone, ''), EXCLUDED.phone);

    -- Referral link attribution (unchanged behavior)
    ref_code := nullif(NEW.raw_user_meta_data->>'referred_by', '');
    IF ref_code IS NOT NULL THEN
      SELECT id::uuid INTO ref_user
      FROM public.registered_students
      WHERE academic_code = ref_code
        AND id ~ '^[0-9a-fA-F-]{36}$'
        AND id <> NEW.id::text;
      IF ref_user IS NOT NULL THEN
        INSERT INTO public.referrals (referrer_id, referred_id)
        VALUES (ref_user, NEW.id)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 020 (RBAC secretary role added: constraint, is_secretary(), admin_set_user_role whitelist + directory skip, signup-trigger role preservation; no account auto-promoted) applied';
