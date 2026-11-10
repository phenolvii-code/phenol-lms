-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 004: Admin Direct Password Reset RPC
-- Purpose: Allows verified instructors (role = 'instructor') to directly reset
--          any student's password without needing old passwords or SMTP emails.
-- ==============================================================================

create or replace function public.admin_set_student_password(
  p_student_email text,
  p_new_password text
)
returns text
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  v_updated boolean := false;
begin
  -- 1. Security Check: Only instructors can execute this
  if not public.is_admin() then
    raise exception 'forbidden: only instructors can reset student passwords';
  end if;

  -- 2. Input validation
  if length(p_new_password) < 6 then
    raise exception 'password must be at least 6 characters long';
  end if;

  -- 3. Update the encrypted password in auth.users
  update auth.users
  set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  where lower(trim(email)) = lower(trim(p_student_email));

  if not found then
    raise exception 'student user with email % not found in auth system', p_student_email;
  end if;

  return 'OK';
end $$;

-- Lock down permissions: public cannot call; authenticated users check is_admin() inside
revoke all on function public.admin_set_student_password(text, text) from public;
grant execute on function public.admin_set_student_password(text, text) to authenticated;

COMMENT ON FUNCTION public.admin_set_student_password(text, text) IS 'Allows authenticated instructor to set student password directly.';
