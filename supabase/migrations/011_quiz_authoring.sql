-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 011
-- Quiz Authoring: Instructors Create/Edit/Delete Quizzes For Their Own Courses
--
-- WHAT THIS ADDS:
--   1. Tightens the old "quizzes admin manage" policy (is_admin = ANY instructor
--      could manage ANY quiz) to ownership: only the course owner (or the
--      super_admin) may touch a quiz — via RPCs below AND at RLS level.
--   2. `list_instructor_quizzes()` — the author's own quiz list (+ super_admin
--      sees all) with course title and question count. No answer keys.
--   3. `get_quiz_for_editing()` — FULL questions jsonb WITH the answer key,
--      ONLY for the course owner or super_admin (editing requires seeing it).
--   4. `save_quiz()` — validated server-side upsert (the ONLY write path).
--      Every question must have text, >=2 options, and a correct answer that
--      actually exists among its options. Answer keys stay server-private
--      for students.
--   5. `delete_quiz()` — owner/super_admin only; cascades to submissions.
--
-- SAFETY:
--   - Idempotent: safe to run twice.
--   - Does NOT touch existing quizzes, submissions, courses or users.
--
-- BEFORE RUNNING:
--   1. Take a full database backup (Supabase > Database > Backups).
--   2. Migration 010 must be applied first (creates the quizzes tables).
--   3. Paste the FULL file into the SQL Editor (see errors log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: Ownership-based manage policy (replaces is_admin-based one)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "quizzes admin manage" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes owner manage" ON public.quizzes;
CREATE POLICY "quizzes owner manage" ON public.quizzes
  FOR ALL
  USING (public.owns_course(course_id))
  WITH CHECK (public.owns_course(course_id));

-- ------------------------------------------------------------------------------
-- STEP 2: The author's quiz list (own courses only; super_admin sees all)
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.list_instructor_quizzes();
CREATE OR REPLACE FUNCTION public.list_instructor_quizzes()
RETURNS TABLE (
  quiz_id text,
  course_id text,
  course_title text,
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
    q.course_id,
    c.title AS course_title,
    q.title,
    q.description,
    q.duration_minutes,
    q.passing_percentage,
    COALESCE(jsonb_array_length(q.questions), 0) AS question_count,
    q.created_at
  FROM public.quizzes q
  JOIN public.courses c ON c.id = q.course_id
  WHERE public.is_super_admin() OR c.owner_id = auth.uid()
  ORDER BY q.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.list_instructor_quizzes() FROM public;
GRANT EXECUTE ON FUNCTION public.list_instructor_quizzes() TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 3: Full quiz WITH answer key — owner/super_admin only (for editing)
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_quiz_for_editing(text);
CREATE OR REPLACE FUNCTION public.get_quiz_for_editing(p_quiz_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.quizzes%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_row FROM public.quizzes WHERE id = p_quiz_id;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'quiz not found';
  END IF;

  IF NOT public.owns_course(v_row.course_id) THEN
    RAISE EXCEPTION 'forbidden: you can only edit quizzes of your own courses';
  END IF;

  RETURN jsonb_build_object(
    'id',                v_row.id,
    'course_id',         v_row.course_id,
    'title',             v_row.title,
    'description',       v_row.description,
    'duration_minutes',  v_row.duration_minutes,
    'passing_percentage',v_row.passing_percentage,
    'questions',         v_row.questions
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_quiz_for_editing(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_quiz_for_editing(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 4: Validated upsert — the ONLY write path into quizzes
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.save_quiz(text, text, text, text, integer, integer, jsonb);
CREATE OR REPLACE FUNCTION public.save_quiz(
  p_quiz_id text,
  p_course_id text,
  p_title text,
  p_description text,
  p_duration_minutes integer,
  p_passing_percentage integer,
  p_questions jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz_id text;
  v_existing_course text;
  v_clean jsonb := '[]'::jsonb;
  v_q jsonb;
  v_ord bigint;
  v_qid text;
  v_opts jsonb;
  v_opt jsonb;
  v_oord bigint;
  v_oid text;
  v_correct_id text;
  v_points numeric;
  v_explanation text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: only faculty members can author quizzes';
  END IF;

  p_title := coalesce(nullif(trim(p_title), ''), '');
  IF p_title = '' THEN
    RAISE EXCEPTION 'quiz title is required';
  END IF;

  p_duration_minutes := COALESCE(p_duration_minutes, 15);
  IF p_duration_minutes < 1 OR p_duration_minutes > 300 THEN
    RAISE EXCEPTION 'duration must be between 1 and 300 minutes';
  END IF;

  p_passing_percentage := COALESCE(p_passing_percentage, 60);
  IF p_passing_percentage < 1 OR p_passing_percentage > 100 THEN
    RAISE EXCEPTION 'passing percentage must be between 1 and 100';
  END IF;

  IF p_questions IS NULL OR jsonb_typeof(p_questions) <> 'array' OR jsonb_array_length(p_questions) = 0 THEN
    RAISE EXCEPTION 'a quiz needs at least one question';
  END IF;

  -- Resolve target course + ownership
  IF p_quiz_id IS NOT NULL AND trim(p_quiz_id) <> '' THEN
    SELECT course_id INTO v_existing_course
    FROM public.quizzes WHERE id = trim(p_quiz_id);
    IF v_existing_course IS NULL THEN
      RAISE EXCEPTION 'quiz not found';
    END IF;
    IF v_existing_course <> p_course_id THEN
      RAISE EXCEPTION 'quiz cannot be moved between courses';
    END IF;
    v_quiz_id := trim(p_quiz_id);
  ELSE
    v_quiz_id := 'quiz-' || substring(md5(random()::text || clock_timestamp()::text), 1, 12);
  END IF;

  IF NOT public.owns_course(p_course_id) THEN
    RAISE EXCEPTION 'forbidden: you can only add quizzes to your own courses';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE id = p_course_id) THEN
    RAISE EXCEPTION 'course not found';
  END IF;

  -- Normalize + validate every question server-side
  FOR v_q, v_ord IN
    SELECT * FROM jsonb_array_elements(p_questions) WITH ORDINALITY
  LOOP
    v_qid := COALESCE(nullif(trim(v_q->>'id'), ''), 'q' || v_ord::text);
    IF v_q->>'text' IS NULL OR trim(v_q->>'text') = '' THEN
      RAISE EXCEPTION 'question % is missing its text', v_ord;
    END IF;

    IF jsonb_typeof(v_q->'options') <> 'array' OR jsonb_array_length(v_q->'options') < 2 THEN
      RAISE EXCEPTION 'question % needs at least 2 options', v_ord;
    END IF;

    v_opts := '[]'::jsonb;
    FOR v_opt, v_oord IN
      SELECT * FROM jsonb_array_elements(v_q->'options') WITH ORDINALITY
    LOOP
      v_oid := COALESCE(nullif(trim(v_opt->>'id'), ''), 'o' || v_oord::text);
      IF v_opt->>'text' IS NULL OR trim(v_opt->>'text') = '' THEN
        RAISE EXCEPTION 'question %: option % is empty', v_ord, v_oord;
      END IF;
      v_opts := v_opts || jsonb_build_object('id', v_oid, 'text', trim(v_opt->>'text'));
    END LOOP;

    v_correct_id := v_q->>'correct_option_id';
    IF v_correct_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_opts) AS o(opt)
      WHERE opt->>'id' = v_correct_id
    ) THEN
      RAISE EXCEPTION 'question % has no valid correct answer selected', v_ord;
    END IF;

    v_points := COALESCE((v_q->>'points')::numeric, 5);
    IF v_points < 1 THEN v_points := 1; END IF;

    v_explanation := COALESCE(nullif(trim(v_q->>'explanation'), ''), nullif(trim(v_q->>'scientificExplanation'), ''));

    v_clean := v_clean || jsonb_build_object(
      'id',                v_qid,
      'text',              trim(v_q->>'text'),
      'options',           v_opts,
      'correct_option_id', v_correct_id,
      'points',            v_points,
      'explanation',       v_explanation
    ) || CASE
      WHEN nullif(trim(COALESCE(v_q->>'molecularSnippet', '')), '') IS NOT NULL
      THEN jsonb_build_object('molecularSnippet', v_q->>'molecularSnippet')
      ELSE '{}'::jsonb
    END;
  END LOOP;

  INSERT INTO public.quizzes
    (id, course_id, title, description, duration_minutes, passing_percentage, questions)
  VALUES (
    v_quiz_id,
    p_course_id,
    p_title,
    nullif(trim(coalesce(p_description, '')), ''),
    p_duration_minutes,
    p_passing_percentage,
    v_clean
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    duration_minutes = EXCLUDED.duration_minutes,
    passing_percentage = EXCLUDED.passing_percentage,
    questions = EXCLUDED.questions;

  RETURN v_quiz_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_quiz(text, text, text, text, integer, integer, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.save_quiz(text, text, text, text, integer, integer, jsonb) TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 5: Owner-only delete (cascades to submissions)
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.delete_quiz(text);
CREATE OR REPLACE FUNCTION public.delete_quiz(p_quiz_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT course_id INTO v_course FROM public.quizzes WHERE id = p_quiz_id;
  IF v_course IS NULL THEN
    RAISE EXCEPTION 'quiz not found';
  END IF;
  IF NOT public.owns_course(v_course) THEN
    RAISE EXCEPTION 'forbidden: you can only delete quizzes of your own courses';
  END IF;

  DELETE FROM public.quizzes WHERE id = p_quiz_id;
  RETURN 'OK';
END;
$$;

REVOKE ALL ON FUNCTION public.delete_quiz(text) FROM public;
GRANT EXECUTE ON FUNCTION public.delete_quiz(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- STEP 6: Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 011 (instructor quiz authoring, ownership-scoped) applied';
