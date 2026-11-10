-- ============================================================================
-- PHENOL LMS — Migration 002: Admin Direct Enroll RPC & Safe Policies
-- ============================================================================

-- 1) Admin-only Direct Enrollment RPC
create or replace function public.admin_enroll_student(
  p_student_email text,
  p_course_id text
)
returns public.course_enrollments
language plpgsql security definer set search_path = public as $$
declare
  s public.registered_students;
  c public.courses;
  e public.course_enrollments;
  v_student text;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select * into s from public.registered_students
  where lower(trim(email)) = lower(trim(p_student_email));

  if s.id is null then
    raise exception 'student profile not found';
  end if;

  select * into c from public.courses where id = p_course_id;
  if c.id is null then
    raise exception 'course not found';
  end if;

  -- Upsert active enrollment server-side
  insert into public.course_enrollments (
    id,
    student_id,
    student_email,
    student_name,
    student_phone,
    student_code,
    student_track,
    course_id,
    course_title,
    course_code,
    status,
    approved_at
  )
  values (
    'enr-' || gen_random_uuid()::text,
    s.id,
    s.email,
    s.name,
    s.phone,
    s.academic_code,
    s.academic_track,
    c.id,
    c.title,
    c.code,
    'ACTIVE',
    now()
  )
  on conflict on constraint course_enrollments_student_course_key do update
  set status = 'ACTIVE', approved_at = now()
  returning * into e;

  v_student := s.id;
  -- Trigger referral reward if first activation
  if v_student ~ '^[0-9a-fA-F-]{36}$' then
    update public.referrals
    set status = 'rewarded', points = 50, rewarded_at = now()
    where referred_id = v_student::uuid and status = 'registered';
  end if;

  return e;
end $$;

revoke all on function public.admin_enroll_student(text, text) from public;
grant execute on function public.admin_enroll_student(text, text) to authenticated;
