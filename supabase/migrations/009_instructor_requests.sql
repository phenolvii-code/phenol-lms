-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 009
-- Faculty Applications: Request & Approval Workflow (No Self-Promotion)
--
-- WHAT THIS CHANGES:
--   1. Registration ALWAYS creates a STUDENT. The signup metadata
--      ('role' / 'account_type') is NO LONGER TRUSTED. This closes the
--      privilege-escalation hole where anyone could sign up as an instructor.
--   2. New table `instructor_requests` — students apply via their profile.
--   3. Approval happens ONLY via `decide_instructor_request()` executed by
--      the super_admin (Dr. Omar Magdi). No other path exists.
--
-- SAFETY:
--   - Idempotent: safe to run twice.
--   - Does NOT delete or modify any existing course, user, or enrollment.
--   - Does NOT downgrade any existing instructor (re-apply safety guard).
--
-- BEFORE RUNNING:
--   1. Take a full database backup (Supabase > Database > Backups).
--   2. Prefer testing on a spare Supabase project first.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: Harden the registration trigger — every new account is a STUDENT.
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
  -- Every new account is a STUDENT. Faculty status is granted ONLY through
  -- decide_instructor_request() by the super_admin. Client metadata is never trusted.
  IF lower(trim(coalesce(NEW.email, ''))) = 'phenolvii@gmail.com' THEN
    INSERT INTO public.profiles (id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
  ELSE
    INSERT INTO public.profiles (id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT (id) DO UPDATE SET role = 'student';
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
    -- NEVER touch `role` here so a re-registered approved instructor is not demoted.
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ------------------------------------------------------------------------------
-- STEP 2: Faculty application table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  phone text,
  requested_title text,
  specialization text,
  whatsapp text,
  bio text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by uuid REFERENCES auth.users(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instructor_requests_status
  ON public.instructor_requests(status, created_at DESC);

-- One open application per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_instructor_requests_one_active
  ON public.instructor_requests(user_id) WHERE status = 'pending';

ALTER TABLE public.instructor_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests read own or super admin" ON public.instructor_requests;
CREATE POLICY "requests read own or super admin" ON public.instructor_requests
  FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS "requests insert own pending" ON public.instructor_requests;
CREATE POLICY "requests insert own pending" ON public.instructor_requests
  FOR INSERT WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- NO update/delete policies: decisions happen exclusively through the RPC below.

-- ------------------------------------------------------------------------------
-- STEP 3: Student submits an application (authenticated students only)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_instructor_request(
  p_title text,
  p_specialization text,
  p_whatsapp text,
  p_bio text
)
RETURNS public.instructor_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_existing public.instructor_requests;
  v_email text;
  v_name text;
  v_phone text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Only students may apply; instructors and the super_admin cannot.
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'profile not found';
  END IF;
  IF v_role IN ('instructor', 'super_admin') THEN
    RAISE EXCEPTION 'this account is already a faculty member';
  END IF;

  -- Return the existing pending application instead of creating a duplicate.
  SELECT * INTO v_existing
  FROM public.instructor_requests
  WHERE user_id = auth.uid() AND status = 'pending';
  IF v_existing.id IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  SELECT email, name, phone INTO v_email, v_name, v_phone
  FROM public.registered_students
  WHERE id = auth.uid()::text;

  INSERT INTO public.instructor_requests
    (user_id, email, name, phone, requested_title, specialization, whatsapp, bio)
  VALUES (
    auth.uid(),
    coalesce(v_email, auth.jwt()->>'email', ''),
    coalesce(v_name, split_part(coalesce(auth.jwt()->>'email', 'unknown@phenol'), '@', 1)),
    v_phone,
    nullif(trim(p_title), ''),
    nullif(trim(p_specialization), ''),
    nullif(trim(p_whatsapp), ''),
    nullif(trim(p_bio), '')
  )
  RETURNING * INTO v_existing;

  RETURN v_existing;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_instructor_request(text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_instructor_request(text, text, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 4: Super admin decides (approve = real role promotion in BOTH tables)
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
  END IF;

  RETURN 'OK';
END;
$$;

REVOKE ALL ON FUNCTION public.decide_instructor_request(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.decide_instructor_request(uuid, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 5: Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 009 (faculty applications, no self-promotion) applied';
