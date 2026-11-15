-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 008
-- Fix Instructor Registration & Role Assignment in PostgreSQL Trigger
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user() 
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  ref_code text; 
  ref_user uuid;
  v_role text;
BEGIN
  -- Determine role based on email or user metadata
  IF lower(trim(coalesce(NEW.email, ''))) = 'phenolvii@gmail.com' THEN
    v_role := 'super_admin';
  ELSIF lower(trim(coalesce(NEW.raw_user_meta_data->>'role', NEW.raw_user_meta_data->>'account_type', ''))) IN ('instructor', 'teacher') THEN
    v_role := 'instructor';
  ELSE
    v_role := 'student';
  END IF;

  -- 1. Insert into profiles with the correct role directly
  INSERT INTO public.profiles (id, role) 
  VALUES (NEW.id, v_role)
  ON CONFLICT (id) DO UPDATE 
    SET role = CASE 
      WHEN profiles.role = 'super_admin' THEN 'super_admin' 
      ELSE EXCLUDED.role 
    END;

  -- 2. Insert into registered_students
  IF NEW.email IS NOT NULL AND lower(NEW.email) <> 'phenolvii@gmail.com' THEN
    INSERT INTO public.registered_students (
      id, email, name, phone, academic_code, academic_track, role
    )
    VALUES (
      NEW.id::text,
      lower(trim(NEW.email)),
      coalesce(nullif(NEW.raw_user_meta_data->>'full_name',''), split_part(NEW.email,'@',1)),
      coalesce(nullif(NEW.raw_user_meta_data->>'phone',''), 'Pending WhatsApp Verification'),
      public.generate_academic_code(),
      coalesce(nullif(NEW.raw_user_meta_data->>'academic_level',''), 'Public Secondary AR'),
      upper(v_role)
    )
    ON CONFLICT (email) DO UPDATE 
      SET role = upper(v_role),
          name = EXCLUDED.name,
          phone = EXCLUDED.phone;

    -- 3. Referrals check
    ref_code := nullif(NEW.raw_user_meta_data->>'referred_by','');
    IF ref_code IS NOT NULL THEN
      SELECT id::uuid INTO ref_user 
      FROM public.registered_students
      WHERE academic_code = ref_code AND id ~ '^[0-9a-fA-F-]{36}$' AND id <> NEW.id::text;
      
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
