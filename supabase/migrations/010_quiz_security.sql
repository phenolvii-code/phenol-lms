-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 010
-- Quiz Foundation + Security: Real Tables, Server-Side Grading, Private Keys
--
-- DISCOVERY (2026-11-15): migration 006 was NEVER applied to production.
-- The `quizzes` and `quiz_submissions` tables did not exist — every quiz shown
-- on the live site came from client-side mock data, and quiz attempts failed
-- to persist silently. This migration therefore BUILDS the full quiz schema
-- (identical to 006) AND hardens it in one file:
--
--   1. Tables `quizzes` + `quiz_submissions` (same shape as 006, idempotent).
--   2. Column-level security: the `questions` jsonb (contains correct_option_id)
--      is NOT selectable through the table by any client role. Quiz metadata
--      (title, duration, question count) stays readable.
--   3. `get_course_quiz_metadata()` — public metadata list + question count.
--   4. `get_quiz_questions()` — sanitized questions WITHOUT answers.
--      Access: authenticated + enrolled / admin / course owner.
--   5. `submit_quiz_attempt()` — grades SERVER-SIDE from the private jsonb
--      and inserts the submission itself. The client can never choose its
--      own score. Returns per-question review only to the submitting student.
--   6. NO direct insert policy on quiz_submissions — the RPC is the only
--      write path into quiz_submissions.
--
-- SAFETY:
--   - Idempotent: safe to run twice.
--   - Does NOT touch existing courses, users or enrollments.
--   - The seed quiz below only inserts if its course ('chem-301') actually
--     exists — otherwise it is skipped silently.
--
-- BEFORE RUNNING:
--   1. Take a full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor (see errors log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: Base tables (from 006 — never applied in production)
-- ------------------------------------------------------------------------------
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

create index if not exists idx_quizzes_course_id on public.quizzes(course_id);

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

alter table public.quizzes enable row level security;
alter table public.quiz_submissions enable row level security;

-- ------------------------------------------------------------------------------
-- STEP 2: Row-level policies
-- ------------------------------------------------------------------------------
-- Quizzes: metadata readable (column grants below hide the answer key),
-- manage = admins only.
drop policy if exists "quizzes read" on public.quizzes;
create policy "quizzes read" on public.quizzes
  for select using (true);

drop policy if exists "quizzes admin manage" on public.quizzes;
create policy "quizzes admin manage" on public.quizzes
  for all using (public.is_admin()) with check (public.is_admin());

-- Submissions: a student reads ONLY his own attempts; admins read all.
drop policy if exists "submissions read own or admin" on public.quiz_submissions;
create policy "submissions read own or admin" on public.quiz_submissions
  for select using (
    student_id = auth.uid()::text or public.is_admin()
  );

-- NO insert/update/delete policies on quiz_submissions:
-- only submit_quiz_attempt() (SECURITY DEFINER) writes rows.

-- ------------------------------------------------------------------------------
-- STEP 3: Hide the questions column from every client role
-- ------------------------------------------------------------------------------
-- Instructors and admins read questions through get_quiz_questions(), which
-- verifies ownership/enrollment — same pattern as lessons in migration 000.
REVOKE SELECT ON public.quizzes FROM anon, authenticated;
GRANT SELECT (id, course_id, lesson_id, title, description, duration_minutes, passing_percentage, created_at)
  ON public.quizzes TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- STEP 4: Public quiz metadata (title, duration, question count) — no answers
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_course_quiz_metadata(text);
CREATE OR REPLACE FUNCTION public.get_course_quiz_metadata(p_course_id text)
RETURNS TABLE (
  id text,
  title text,
  description text,
  duration_minutes integer,
  passing_percentage integer,
  question_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    q.id,
    q.title,
    q.description,
    q.duration_minutes,
    q.passing_percentage,
    COALESCE(jsonb_array_length(q.questions), 0) AS question_count,
    q.created_at
  FROM public.quizzes q
  WHERE q.course_id = p_course_id
  ORDER BY q.created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_course_quiz_metadata(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_course_quiz_metadata(text) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- STEP 5: Sanitized questions for the exam room (answers stripped server-side)
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_quiz_questions(text);
CREATE OR REPLACE FUNCTION public.get_quiz_questions(p_quiz_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course text;
  v_questions jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT course_id, questions INTO v_course, v_questions
  FROM public.quizzes WHERE id = p_quiz_id;
  IF v_course IS NULL THEN
    RAISE EXCEPTION 'quiz not found';
  END IF;

  IF NOT (
    public.is_admin()
    OR public.owns_course(v_course)
    OR public.has_active_enrollment(v_course)
  ) THEN
    RAISE EXCEPTION 'not enrolled';
  END IF;

  -- Strip every trace of the answer key. Options are passed through as-is
  -- ({id, text} objects contain no answer information).
  RETURN COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id',      q->>'id',
        'text',    q->>'text',
        'options', q->'options',
        'points',  COALESCE((q->>'points')::int, 5)
      ) ORDER BY ord
    )
    FROM jsonb_array_elements(v_questions) WITH ORDINALITY AS t(q, ord)
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_quiz_questions(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 6: Server-side grading — the ONLY writer of quiz_submissions
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_quiz_attempt(text, jsonb);
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id text,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course text;
  v_passing int;
  v_questions jsonb;
  v_q jsonb;
  v_ord bigint;
  v_points numeric;
  v_correct_id text;
  v_correct_index int;
  v_student_index int;
  v_student_id text;
  v_score numeric := 0;
  v_total numeric := 0;
  v_percentage int;
  v_passed boolean;
  v_review jsonb := '[]'::jsonb;
  v_email text;
  v_name text;
  v_submission_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'object' THEN
    RAISE EXCEPTION 'bad answers payload';
  END IF;

  SELECT course_id, passing_percentage, questions
    INTO v_course, v_passing, v_questions
  FROM public.quizzes WHERE id = p_quiz_id;
  IF v_course IS NULL THEN
    RAISE EXCEPTION 'quiz not found';
  END IF;

  IF NOT (
    public.is_admin()
    OR public.owns_course(v_course)
    OR public.has_active_enrollment(v_course)
  ) THEN
    RAISE EXCEPTION 'not enrolled';
  END IF;

  -- Grade every question from the PRIVATE questions jsonb
  FOR v_q, v_ord IN
    SELECT * FROM jsonb_array_elements(v_questions) WITH ORDINALITY
  LOOP
    v_points := COALESCE((v_q->>'points')::numeric, 5);
    v_correct_id := v_q->>'correct_option_id';

    -- index of the correct option within its own options array
    SELECT o.ord - 1 INTO v_correct_index
    FROM jsonb_array_elements(v_q->'options') WITH ORDINALITY AS o(opt, ord)
    WHERE opt->>'id' = v_correct_id;

    -- client sends {"0": "2"} → question 0 answered with option index 2
    v_student_index := NULL;
    IF p_answers ? ((v_ord - 1)::text) THEN
      BEGIN
        v_student_index := (p_answers ->> ((v_ord - 1)::text))::int;
      EXCEPTION WHEN OTHERS THEN
        v_student_index := NULL;
      END;
    END IF;
    IF v_student_index IS NOT NULL AND (
      v_student_index < 0
      OR v_student_index >= COALESCE(jsonb_array_length(v_q->'options'), 0)
    ) THEN
      v_student_index := NULL;
    END IF;

    v_student_id := NULL;
    IF v_student_index IS NOT NULL THEN
      v_student_id := (v_q->'options' -> v_student_index) ->> 'id';
    END IF;

    v_total := v_total + v_points;
    IF v_student_id IS NOT NULL AND v_student_id = v_correct_id THEN
      v_score := v_score + v_points;
    END IF;

    v_review := v_review || jsonb_build_object(
      'index',         v_ord - 1,
      'question_id',   v_q->>'id',
      'student_index', v_student_index,
      'correct_index', v_correct_index,
      'is_correct',    (v_student_id IS NOT NULL AND v_student_id = v_correct_id),
      'points',        v_points,
      'explanation',   COALESCE(v_q->>'explanation', v_q->>'scientificExplanation', '')
    );
  END LOOP;

  v_percentage := CASE WHEN v_total > 0
    THEN ROUND((v_score / v_total) * 100)::int
    ELSE 0 END;
  v_passed := v_percentage >= COALESCE(v_passing, 60);

  SELECT coalesce(auth.jwt() ->> 'email', '') INTO v_email;
  SELECT coalesce(rs.name, split_part(coalesce(v_email, 'x'), '@', 1))
    INTO v_name
  FROM public.registered_students rs
  WHERE rs.id = auth.uid()::text;

  INSERT INTO public.quiz_submissions
    (quiz_id, course_id, student_id, student_email, student_name,
     answers, score, total_points, percentage, passed)
  VALUES (
    p_quiz_id, v_course, auth.uid()::text, v_email,
    coalesce(v_name, 'Student'),
    p_answers, v_score, v_total, v_percentage, v_passed
  )
  RETURNING id INTO v_submission_id;

  RETURN jsonb_build_object(
    'submission_id', v_submission_id,
    'quiz_id',       p_quiz_id,
    'course_id',     v_course,
    'score',         v_score,
    'total_points',  v_total,
    'percentage',    v_percentage,
    'passed',        v_passed,
    'review',        v_review
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quiz_attempt(text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(text, jsonb) TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 7: Seed quiz — ONLY if its course exists (skipped silently otherwise)
-- ------------------------------------------------------------------------------
insert into public.quizzes (id, course_id, title, description, duration_minutes, passing_percentage, questions)
select
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
where exists (select 1 from public.courses where id = 'chem-301')
on conflict (id) do nothing;

-- ------------------------------------------------------------------------------
-- STEP 8: Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 010 (quiz tables + server-side grading, answer keys private) applied';
