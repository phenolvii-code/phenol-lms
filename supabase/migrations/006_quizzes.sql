-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 006: Quizzes & Question Banks
-- Purpose: Schema for interactive timed quizzes, auto-graded submissions,
--          and student academic performance telemetry.
-- ==============================================================================

-- 1. Quizzes table
create table if not exists public.quizzes (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  lesson_id text references public.lessons(id) on delete set null,
  title text not null,
  description text,
  duration_minutes integer not null default 20,
  passing_percentage integer not null default 60,
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Index for speedy listing by course
create index if not exists idx_quizzes_course_id on public.quizzes(course_id);

-- 2. Quiz Submissions table
create table if not exists public.quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  quiz_id text not null references public.quizzes(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  student_id text not null,
  student_email text,
  student_name text,
  answers jsonb not null default '{}'::jsonb,
  score numeric not null default 0,
  total_points numeric not null default 0,
  percentage numeric not null default 0,
  passed boolean not null default false,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_quiz_submissions_student on public.quiz_submissions(student_id, course_id);
create index if not exists idx_quiz_submissions_quiz on public.quiz_submissions(quiz_id);

-- 3. Row Level Security
alter table public.quizzes enable row level security;
alter table public.quiz_submissions enable row level security;

-- Quizzes RLS
drop policy if exists "quizzes read" on public.quizzes;
create policy "quizzes read" on public.quizzes
for select using (true);

drop policy if exists "quizzes admin manage" on public.quizzes;
create policy "quizzes admin manage" on public.quizzes
for all using (public.is_admin()) with check (public.is_admin());

-- Quiz Submissions RLS
drop policy if exists "submissions read own or admin" on public.quiz_submissions;
create policy "submissions read own or admin" on public.quiz_submissions
for select using (
  student_id = auth.uid()::text or public.is_admin()
);

drop policy if exists "submissions insert own" on public.quiz_submissions;
create policy "submissions insert own" on public.quiz_submissions
for insert with check (
  student_id = auth.uid()::text and public.has_active_enrollment(course_id)
);

-- 4. Initial Seed Quiz for Organic Chemistry
insert into public.quizzes (id, course_id, title, description, duration_minutes, passing_percentage, questions)
values (
  'quiz-org-01',
  'chem-301',
  'كويز 1: مقدمة الكيمياء العضوية والألكانات',
  'اختبار تقييمي دوري يقيس الفهم العميق للصيغ البنائية والجزيئية وتفاعلات الهدرجة والاستبدال تحت إشراف د. عمر مجدي.',
  15,
  60,
  '[
    {
      "id": "q1",
      "text": "ما هي الصيغة الجزيئية للألكان الحلقي الذي يحتوي على 6 ذرات كربون؟",
      "options": [
        { "id": "a", "text": "C6H14" },
        { "id": "b", "text": "C6H12" },
        { "id": "c", "text": "C6H10" },
        { "id": "d", "text": "C6H6" }
      ],
      "correct_option_id": "b",
      "points": 5
    },
    {
      "id": "q2",
      "text": "أي من المركبات التالية يعطي عند تفاعله مع الكلور في ضوء الشمس غير المباشر مركب كلوريد الميثيلين CH2Cl2 كناتج وسطي؟",
      "options": [
        { "id": "a", "text": "الميثان CH4" },
        { "id": "b", "text": "الإيثين C2H4" },
        { "id": "c", "text": "الأسيتيلين C2H2" },
        { "id": "d", "text": "البنزين C6H6" }
      ],
      "correct_option_id": "a",
      "points": 5
    },
    {
      "id": "q3",
      "text": "ما هو عدد الأيزوميرات المفتوحة السلسلة المحتملة للهيدروكربون ذو الصيغة C5H12؟",
      "options": [
        { "id": "a", "text": "2 أيزوميرات" },
        { "id": "b", "text": "3 أيزوميرات (بنتان عادي، إيزوبنتان، نيو-بنتان)" },
        { "id": "c", "text": "4 أيزوميرات" },
        { "id": "d", "text": "5 أيزوميرات" }
      ],
      "correct_option_id": "b",
      "points": 5
    },
    {
      "id": "q4",
      "text": "التقطير الجاف لملح أسيتات الصوديوم اللامائية CH3COONa مع الجير الصودي ينتج غاز:",
      "options": [
        { "id": "a", "text": "الميثان CH4" },
        { "id": "b", "text": "الإيثان C2H6" },
        { "id": "c", "text": "الإيثيلين C2H4" },
        { "id": "d", "text": "الهيدروجين H2" }
      ],
      "correct_option_id": "a",
      "points": 5
    }
  ]'::jsonb
)
on conflict (id) do nothing;
