-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 005: Course Notifications System
-- Purpose: Notifies enrolled students automatically when new lessons are published,
--          with realtime read/unread state and direct lesson deep-links.
-- ==============================================================================

-- 1. Create student_notifications table
create table if not exists public.student_notifications (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  course_id text not null references public.courses(id) on delete cascade,
  lesson_id text references public.lessons(id) on delete cascade,
  title text not null,
  message text not null,
  link text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Indexes for fast retrieval by student
create index if not exists idx_student_notifications_student
on public.student_notifications(student_id, created_at desc);

create index if not exists idx_student_notifications_unread
on public.student_notifications(student_id)
where is_read = false;

-- 3. Row Level Security (RLS)
alter table public.student_notifications enable row level security;

-- Student can view their own notifications or admin can view all
drop policy if exists "notifications read own" on public.student_notifications;
create policy "notifications read own" on public.student_notifications
for select using (
  student_id = auth.uid()::text or public.is_admin()
);

-- Student can update their own notifications (e.g. mark as read)
drop policy if exists "notifications update own" on public.student_notifications;
create policy "notifications update own" on public.student_notifications
for update using (
  student_id = auth.uid()::text or public.is_admin()
) with check (
  student_id = auth.uid()::text or public.is_admin()
);

-- Admin can manage all
drop policy if exists "notifications admin manage" on public.student_notifications;
create policy "notifications admin manage" on public.student_notifications
for all using (public.is_admin()) with check (public.is_admin());

-- 4. Automatic Trigger: When a new lesson is inserted, notify all active enrolled students
create or replace function public.handle_new_lesson_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_title text;
begin
  select title into v_course_title from public.courses where id = new.course_id;

  insert into public.student_notifications (
    student_id,
    course_id,
    lesson_id,
    title,
    message,
    link
  )
  select
    e.student_id,
    new.course_id,
    new.id,
    'محاضرة جديدة: ' || coalesce(new.title, 'محاضرة جديدة'),
    'تمت إضافة محاضرة جديدة في كورس ' || coalesce(v_course_title, 'الكيمياء') || ' بعنوان: ' || coalesce(new.title, ''),
    '/courses/' || new.course_id || '/lessons/' || new.id
  from public.course_enrollments e
  where e.course_id = new.course_id
    and e.status = 'ACTIVE';

  return new;
end $$;

drop trigger if exists on_new_lesson_publish on public.lessons;
create trigger on_new_lesson_publish
after insert on public.lessons
for each row execute function public.handle_new_lesson_notification();

-- 5. Admin RPC to send manual course broadcast announcements to enrolled students
create or replace function public.notify_course_students(
  p_course_id text,
  p_lesson_id text,
  p_title text,
  p_message text,
  p_link text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  insert into public.student_notifications (student_id, course_id, lesson_id, title, message, link)
  select distinct e.student_id, p_course_id, p_lesson_id, p_title, p_message, p_link
  from public.course_enrollments e
  where e.course_id = p_course_id and e.status = 'ACTIVE';

  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke all on function public.notify_course_students(text, text, text, text, text) from public;
grant execute on function public.notify_course_students(text, text, text, text, text) to authenticated;

COMMENT ON TABLE public.student_notifications IS 'Notifications sent to students when new course lectures are published.';
