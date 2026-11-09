-- =========================================================
-- 001_security.sql — roles, default-deny RLS, RPCs, media gate
-- =========================================================

-- 1) profiles: the ONLY source of truth for roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student','instructor')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'instructor');
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());

-- NO insert/update/delete policies: a role can never be changed from the client.
insert into public.profiles (id) select id from auth.users on conflict do nothing;

-- 2) unique, DB-generated academic codes (client-supplied codes are ignored)
create or replace function public.generate_academic_code() returns text
language plpgsql as $$
declare c text;
begin
  loop
    c := 'PH-' || lpad((floor(random() * 100000))::int::text, 5, '0');
    exit when not exists (select 1 from public.registered_students where academic_code = c);
  end loop;
  return c;
end $$;

update public.registered_students r
set academic_code = public.generate_academic_code()
where r.ctid in (
  select ctid from (
    select ctid, row_number() over (partition by academic_code order by registered_at) rn
    from public.registered_students
  ) t where rn > 1
);

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'registered_students_code_key'
  ) and not exists (
    select 1 from pg_class where relname = 'registered_students_code_key'
  ) then
    alter table public.registered_students
    add constraint registered_students_code_key unique (academic_code);
  end if;
end $$;

-- 3) referrals
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered','rewarded')),
  points int not null default 0,
  created_at timestamptz not null default now(),
  rewarded_at timestamptz,
  check (referrer_id <> referred_id)
);
alter table public.referrals enable row level security;

drop policy if exists "referrals read own or admin" on public.referrals;
create policy "referrals read own or admin" on public.referrals
for select using (referrer_id = auth.uid() or public.is_admin());

-- 4) signup trigger (replaces the old one)
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare ref_code text; ref_user uuid;
begin
  insert into public.profiles (id, role) values (new.id, 'student') on conflict do nothing;

  if new.email is not null and lower(new.email) <> 'phenolvii@gmail.com' then
    insert into public.registered_students
    (id, email, name, phone, academic_code, academic_track, role)
    values (
      new.id::text,
      lower(trim(new.email)),
      coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)),
      coalesce(nullif(new.raw_user_meta_data->>'phone',''), 'Pending WhatsApp Verification'),
      public.generate_academic_code(),
      coalesce(nullif(new.raw_user_meta_data->>'academic_level',''), 'Public Secondary AR'),
      'STUDENT'
    ) on conflict (email) do nothing;

    ref_code := nullif(new.raw_user_meta_data->>'referred_by','');
    if ref_code is not null then
      select id::uuid into ref_user from public.registered_students
      where academic_code = ref_code and id ~ '^[0-9a-fA-F-]{36}$' and id <> new.id::text;
      if ref_user is not null then
        insert into public.referrals (referrer_id, referred_id) values (ref_user, new.id)
        on conflict do nothing;
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- 5) enrollments: unique per student/course; writes ONLY via RPC or admin
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'course_enrollments_student_course_key'
  ) and not exists (
    select 1 from pg_class where relname = 'course_enrollments_student_course_key'
  ) then
    alter table public.course_enrollments
    add constraint course_enrollments_student_course_key unique (student_id, course_id);
  end if;
end $$;

create or replace function public.request_enrollment(p_course_id text)
returns public.course_enrollments
language plpgsql security definer set search_path = public as $$
declare s public.registered_students; c public.courses; e public.course_enrollments;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into s from public.registered_students where id = auth.uid()::text;
  if s.id is null then raise exception 'student profile not found'; end if;
  select * into c from public.courses where id = p_course_id;
  if c.id is null then raise exception 'course not found'; end if;

  insert into public.course_enrollments
  (id, student_id, student_email, student_name, student_phone, student_code,
   student_track, course_id, course_title, course_code, status)
  values
  ('enr-' || gen_random_uuid()::text, s.id, s.email, s.name, s.phone, s.academic_code,
   s.academic_track, c.id, c.title, c.code, 'PENDING')
  on conflict (student_id, course_id) do update
  set status = case when public.course_enrollments.status = 'REJECTED'
               then 'PENDING' else public.course_enrollments.status end
  returning * into e;
  return e;
end $$;

revoke all on function public.request_enrollment(text) from public;
grant execute on function public.request_enrollment(text) to authenticated;

create or replace function public.set_enrollment_status(p_id text, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare v_student text;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('PENDING','ACTIVE','REJECTED') then raise exception 'bad status'; end if;

  update public.course_enrollments
  set status = p_status,
      approved_at = case when p_status = 'ACTIVE' then now() else null end
  where id = p_id
  returning student_id into v_student;

  -- reward the referrer only when the referred student's FIRST activation (= paid) is confirmed
  if p_status = 'ACTIVE' and v_student ~ '^[0-9a-fA-F-]{36}$' then
    update public.referrals
    set status = 'rewarded', points = 50, rewarded_at = now()
    where referred_id = v_student::uuid and status = 'registered';
  end if;
end $$;

revoke all on function public.set_enrollment_status(text, text) from public;
grant execute on function public.set_enrollment_status(text, text) to authenticated;

-- 6) media gate: video URLs / PDF paths live ONLY in lesson_assets, readable ONLY via RPC
create table if not exists public.lesson_assets (
  lesson_id text primary key references public.lessons(id) on delete cascade,
  video_url text, -- YouTube URL or 11-char ID
  pdf_notes_path text -- path in private bucket `lecture-notes`: {course_id}/{lesson_id}.pdf
);

insert into public.lesson_assets (lesson_id, video_url)
select id, video_url from public.lessons where video_url is not null
on conflict (lesson_id) do nothing;

-- Hide the old columns from every non-admin role WITHOUT dropping data yet.
revoke select on public.lessons from anon, authenticated;
grant select (id, course_id, title, duration, type, summary, key_formulas, sort_order, created_at)
on public.lessons to anon, authenticated;

create or replace function public.has_active_enrollment(p_course_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.course_enrollments e
    where e.course_id = p_course_id and e.student_id = auth.uid()::text and e.status = 'ACTIVE'
  );
$$;
grant execute on function public.has_active_enrollment(text) to authenticated;

create table if not exists public.media_access_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  accessed_at timestamptz not null default now()
);
create index if not exists media_access_log_user_time on public.media_access_log (user_id, accessed_at desc);
alter table public.media_access_log enable row level security;

create or replace function public.get_lesson_media(p_lesson_id text)
returns table (video_url text, pdf_notes_path text)
language plpgsql security definer set search_path = public as $$
declare v_course text; v_count int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select l.course_id into v_course from public.lessons l where l.id = p_lesson_id;
  if v_course is null then raise exception 'lesson not found'; end if;
  if not (public.is_admin() or public.has_active_enrollment(v_course)) then
    raise exception 'not enrolled';
  end if;

  if not public.is_admin() then
    select count(*) into v_count from public.media_access_log m
    where m.user_id = auth.uid() and m.accessed_at > now() - interval '24 hours';
    if v_count >= 60 then raise exception 'rate limit'; end if;
  end if;

  insert into public.media_access_log (user_id, lesson_id) values (auth.uid(), p_lesson_id);

  if random() < 0.01 then -- cheap retention: keep ~30 days (free DB is 500 MB)
    delete from public.media_access_log where accessed_at < now() - interval '30 days';
  end if;

  return query select a.video_url, a.pdf_notes_path
  from public.lesson_assets a where a.lesson_id = p_lesson_id;
end $$;

revoke all on function public.get_lesson_media(text) from public;
grant execute on function public.get_lesson_media(text) to authenticated;

-- 7) progress + Q&A (replace localStorage)
create table if not exists public.lesson_progress (
  student_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  completed_at timestamptz not null default now(),
  quiz_grade numeric,
  primary key (student_id, lesson_id)
);

create table if not exists public.lesson_comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null references public.lessons(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.lesson_comments(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- 8) device/session limit (max 2 devices)
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  user_agent text,
  last_seen timestamptz not null default now(),
  unique (user_id, device_id)
);

create or replace function public.register_session(p_device_id text, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.user_sessions (user_id, device_id, user_agent)
  values (auth.uid(), p_device_id, p_user_agent)
  on conflict (user_id, device_id) do update set last_seen = now();

  delete from public.user_sessions
  where user_id = auth.uid()
  and id not in (
    select id from public.user_sessions where user_id = auth.uid()
    order by last_seen desc limit 2
  );
end $$;

create or replace function public.check_session(p_device_id text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.user_sessions set last_seen = now()
  where user_id = auth.uid() and device_id = p_device_id;
  return found;
end $$;

revoke all on function public.register_session(text, text) from public;
revoke all on function public.check_session(text) from public;
grant execute on function public.register_session(text, text) to authenticated;
grant execute on function public.check_session(text) to authenticated;

-- 9) submissions get a real owner
alter table public.student_submissions
add column if not exists student_id uuid references auth.users(id);

-- =========================================================
-- RLS: remove every "Public full access" policy → default deny
-- =========================================================
do $$ declare r record; begin
  for r in select schemaname, tablename, policyname from pg_policies
  where schemaname = 'public' and policyname like 'Public full access%'
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.lesson_assets enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_comments enable row level security;
alter table public.user_sessions enable row level security;

-- "admin all" on every managed table
do $$ declare t text; begin
  foreach t in array
  array['registered_students','course_enrollments','courses','lessons',
        'lesson_assets','lesson_progress','lesson_comments','student_submissions',
        'waitlist_applications','referrals','user_sessions','media_access_log','profiles']
  loop
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- public catalogue (read-only; lessons exposes only the granted columns above)
drop policy if exists "catalogue read" on public.courses;
create policy "catalogue read" on public.courses for select using (true);
drop policy if exists "catalogue read" on public.lessons;
create policy "catalogue read" on public.lessons for select using (true);

-- registered_students: own row; limited columns writable
drop policy if exists "student read own" on public.registered_students;
create policy "student read own" on public.registered_students
for select using (id = auth.uid()::text);

drop policy if exists "student update own" on public.registered_students;
create policy "student update own" on public.registered_students
for update using (id = auth.uid()::text) with check (id = auth.uid()::text);

revoke update on public.registered_students from authenticated;
grant update (name, phone, academic_track, last_active) on public.registered_students to authenticated;

-- course_enrollments: students read own; ALL writes via RPC / admin
drop policy if exists "student read own" on public.course_enrollments;
create policy "student read own" on public.course_enrollments
for select using (student_id = auth.uid()::text);

-- lesson_assets: NO student policy at all (admin only) — students go through get_lesson_media()

-- lesson_progress
drop policy if exists "progress own read" on public.lesson_progress;
create policy "progress own read" on public.lesson_progress for select using (student_id = auth.uid());

drop policy if exists "progress own insert" on public.lesson_progress;
create policy "progress own insert" on public.lesson_progress for insert
with check (student_id = auth.uid() and public.has_active_enrollment(course_id));

drop policy if exists "progress own update" on public.lesson_progress;
create policy "progress own update" on public.lesson_progress for update
using (student_id = auth.uid()) with check (student_id = auth.uid());

-- lesson_comments: visible to active students of that course
drop policy if exists "comments read" on public.lesson_comments;
create policy "comments read" on public.lesson_comments
for select using (public.has_active_enrollment(course_id));

drop policy if exists "comments insert" on public.lesson_comments;
create policy "comments insert" on public.lesson_comments for insert
with check (author_id = auth.uid() and public.has_active_enrollment(course_id));

drop policy if exists "comments delete own" on public.lesson_comments;
create policy "comments delete own" on public.lesson_comments for delete using (author_id = auth.uid());

-- student_submissions
drop policy if exists "submissions own read" on public.student_submissions;
create policy "submissions own read" on public.student_submissions for select using (student_id = auth.uid());

drop policy if exists "submissions own insert" on public.student_submissions;
create policy "submissions own insert" on public.student_submissions for insert
with check (student_id = auth.uid() and status = 'pending' and grade is null and dr_feedback is null);

-- waitlist: anyone may apply; only admin reads/updates
drop policy if exists "waitlist apply" on public.waitlist_applications;
create policy "waitlist apply" on public.waitlist_applications for insert
with check (status = 'pending' and notes is null);

-- 10) private bucket for PDF booklets (1 GB free)
insert into storage.buckets (id, name, public) values ('lecture-notes','lecture-notes', false)
on conflict (id) do nothing;

drop policy if exists "notes read active students" on storage.objects;
create policy "notes read active students" on storage.objects for select using (
  bucket_id = 'lecture-notes'
  and (public.is_admin() or public.has_active_enrollment((storage.foldername(name))[1]))
);

drop policy if exists "notes admin write" on storage.objects;
create policy "notes admin write" on storage.objects for all
using (bucket_id = 'lecture-notes' and public.is_admin())
with check (bucket_id = 'lecture-notes' and public.is_admin());

-- 11) Set initial instructor role for Dr. Omar Magdi
update public.profiles set role='instructor'
where id = (select id from auth.users where lower(trim(email))='phenolvii@gmail.com');
