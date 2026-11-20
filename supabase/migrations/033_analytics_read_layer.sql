-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 033
-- ANALYTICS READ LAYER (PHASE 1) - COURSE / STUDENT / PLATFORM AGGREGATES
-- ==============================================================================
--
-- WHY THIS MIGRATION EXISTS
--   The platform already stores everything an analytics layer needs:
--     lesson_progress      (student x lesson completion)
--     quiz_submissions     (server-graded attempts, percentage, passed)
--     student_submissions  (problem sets: pending / graded)
--     media_access_log     (lesson media access events, ~30 day retention)
--     course_enrollments   (PENDING / ACTIVE / REJECTED + approved_at)
--   None of it is aggregated anywhere, so the dashboards cannot show a single
--   honest number. This migration adds a READ-ONLY aggregation layer in SQL.
--
-- WHAT THIS MIGRATION DOES
--   1. Supporting indexes for the aggregate queries (course-first access paths).
--   2. public.list_my_courses_analytics()
--        One row per course owned by the caller: enrollment counts, lessons,
--        average student progress, quiz attempts / average / pass rate,
--        pending submissions, last activity.
--   3. public.list_course_students_analytics(p_course_id)
--        One row per enrolled student of ONE owned course: progress,
--        quiz performance, pending submissions, last activity,
--        days_inactive and a documented "needs_attention" flag.
--   4. public.list_my_course_progress()
--        The student's own view: per enrolled course progress, quiz average,
--        last activity and the next unfinished lesson.
--   5. public.get_platform_overview()
--        Founder-only platform counters (accounts, courses, enrollments,
--        30-day activity, pending grading).
--
-- HONESTY RULES (hard, from the governance brief)
--   - NO new tables, NO new columns, NO new write policies. Nothing is stored.
--   - Every number is computed from real rows. When there is nothing to
--     average, the average is NULL - never 0, never an estimate. The UI must
--     render an explicit "no data yet" state for NULL.
--   - "needs_attention" is a transparent heuristic, documented below, not a
--     judgement about a student:
--         ACTIVE enrollment
--         AND approved_at older than 7 days
--         AND the course has at least one lesson
--         AND progress < 50%
--         AND (no recorded activity at all, OR last activity older than 7 days)
--   - media_access_log keeps roughly 30 days of rows (000, retention delete),
--     so "last_activity_at" can only ever be as old as that window. This is
--     documented rather than worked around.
--
-- ACCESS MODEL
--   - SECURITY DEFINER (bypasses RLS) => every function re-checks the caller
--     explicitly BEFORE returning a single row:
--       * list_my_courses_analytics    : is_instructor() OR is_super_admin(),
--                                        and only courses the caller owns.
--       * list_course_students_analytics: owns_course(p_course_id) (which is
--                                        false for everyone but the owner and
--                                        the super admin).
--       * list_my_course_progress      : auth.uid() only; rows filtered by
--                                        course_enrollments.student_id.
--       * get_platform_overview        : is_super_admin() only.
--   - The secretary is intentionally NOT given analytics access: it exposes
--     instructor and student performance data that the office does not need.
--   - No PII beyond what the office/instructor already sees: student_name and
--     student_code only (no email, no phone).
--   - EXECUTE is granted to `authenticated` only. `anon` gets nothing.
--
-- TYPE NOTE
--   Join keys are compared as TEXT (uuid columns are cast, text columns are
--   not) because course_enrollments.student_id and quiz_submissions.student_id
--   are TEXT (legacy roster ids may not be UUIDs) while lesson_progress,
--   student_submissions and media_access_log use UUID.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) Indexes for course-first aggregation (idempotent)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_status
  ON public.course_enrollments (course_id, status);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_student
  ON public.lesson_progress (course_id, student_id);

CREATE INDEX IF NOT EXISTS idx_student_submissions_course_status
  ON public.student_submissions (course_id, status);

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_course_time
  ON public.quiz_submissions (course_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_access_log_lesson_time
  ON public.media_access_log (lesson_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_lessons_course_sort
  ON public.lessons (course_id, sort_order);

-- ------------------------------------------------------------------------------
-- 2) list_my_courses_analytics()
--    Instructor dashboard: one row per course the caller owns (super admin
--    sees every course). Averages stay NULL when the underlying set is empty.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_my_courses_analytics()
RETURNS TABLE (
  course_id text,
  course_title text,
  course_code text,
  is_published boolean,
  enrolled_total bigint,
  active_students bigint,
  lessons_total bigint,
  avg_progress_pct numeric,
  students_completed_all bigint,
  quiz_attempts bigint,
  avg_quiz_pct numeric,
  quiz_pass_rate_pct numeric,
  pending_submissions bigint,
  last_activity_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT (public.is_instructor() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: course analytics are for instructors and the academy director';
  END IF;

  RETURN QUERY
  WITH my_courses AS (
    SELECT c.id, c.title, c.code, c.is_published
    FROM public.courses c
    WHERE public.is_super_admin() OR c.owner_id = auth.uid()
  ),
  lesson_counts AS (
    SELECT l.course_id, count(*)::bigint AS lessons_total
    FROM public.lessons l
    WHERE l.course_id IN (SELECT mc.id FROM my_courses mc)
    GROUP BY l.course_id
  ),
  enrolled AS (
    SELECT e.course_id, count(DISTINCT e.student_id)::bigint AS enrolled_total
    FROM public.course_enrollments e
    WHERE e.course_id IN (SELECT mc.id FROM my_courses mc)
    GROUP BY e.course_id
  ),
  active_enrollment AS (
    SELECT e.course_id, e.student_id
    FROM public.course_enrollments e
    WHERE e.status = 'ACTIVE'
      AND e.course_id IN (SELECT mc.id FROM my_courses mc)
  ),
  per_student AS (
    SELECT a.course_id,
           a.student_id,
           count(lp.lesson_id)::bigint AS lessons_completed
    FROM active_enrollment a
    LEFT JOIN public.lesson_progress lp
           ON lp.student_id::text = a.student_id
          AND lp.course_id = a.course_id
    GROUP BY a.course_id, a.student_id
  ),
  progress_agg AS (
    SELECT ps.course_id,
           count(*)::bigint AS active_students,
           round(avg(
             CASE WHEN lc.lessons_total > 0
                  THEN round(100.0 * ps.lessons_completed / lc.lessons_total, 1)
                  ELSE NULL
             END
           ), 1) AS avg_progress_pct,
           (count(*) FILTER (
              WHERE lc.lessons_total > 0 AND ps.lessons_completed >= lc.lessons_total
           ))::bigint AS students_completed_all
    FROM per_student ps
    JOIN lesson_counts lc ON lc.course_id = ps.course_id
    GROUP BY ps.course_id
  ),
  quiz_agg AS (
    SELECT q.course_id,
           count(*)::bigint AS quiz_attempts,
           round(avg(q.percentage), 1) AS avg_quiz_pct,
           round(100.0 * (count(*) FILTER (WHERE q.passed)) / count(*), 1) AS quiz_pass_rate_pct
    FROM public.quiz_submissions q
    WHERE q.course_id IN (SELECT mc.id FROM my_courses mc)
    GROUP BY q.course_id
  ),
  submission_agg AS (
    SELECT s.course_id, count(*)::bigint AS pending_submissions
    FROM public.student_submissions s
    WHERE s.status = 'pending'
      AND s.course_id IN (SELECT mc.id FROM my_courses mc)
    GROUP BY s.course_id
  ),
  activity AS (
    SELECT t.course_id, max(t.ts) AS last_activity_at
    FROM (
      SELECT e.course_id, m.accessed_at AS ts
      FROM public.course_enrollments e
      JOIN public.media_access_log m ON m.user_id::text = e.student_id
      JOIN public.lessons l ON l.id = m.lesson_id
      WHERE e.course_id IN (SELECT mc.id FROM my_courses mc)
        AND l.course_id = e.course_id
      UNION ALL
      SELECT lp.course_id, lp.completed_at
      FROM public.lesson_progress lp
      WHERE lp.course_id IN (SELECT mc.id FROM my_courses mc)
      UNION ALL
      SELECT q.course_id, q.submitted_at
      FROM public.quiz_submissions q
      WHERE q.course_id IN (SELECT mc.id FROM my_courses mc)
      UNION ALL
      SELECT s.course_id, s.created_at
      FROM public.student_submissions s
      WHERE s.course_id IN (SELECT mc.id FROM my_courses mc)
    ) t
    GROUP BY t.course_id
  )
  SELECT mc.id,
         mc.title,
         mc.code,
         mc.is_published,
         coalesce(en.enrolled_total, 0),
         coalesce(pa.active_students, 0),
         coalesce(lc.lessons_total, 0),
         pa.avg_progress_pct,
         coalesce(pa.students_completed_all, 0),
         coalesce(qa.quiz_attempts, 0),
         qa.avg_quiz_pct,
         qa.quiz_pass_rate_pct,
         coalesce(sa.pending_submissions, 0),
         ac.last_activity_at
  FROM my_courses mc
  LEFT JOIN lesson_counts lc   ON lc.course_id = mc.id
  LEFT JOIN enrolled en        ON en.course_id = mc.id
  LEFT JOIN progress_agg pa    ON pa.course_id = mc.id
  LEFT JOIN quiz_agg qa        ON qa.course_id = mc.id
  LEFT JOIN submission_agg sa  ON sa.course_id = mc.id
  LEFT JOIN activity ac        ON ac.course_id = mc.id
  ORDER BY mc.title, mc.id;
END;
$$;

REVOKE ALL ON FUNCTION public.list_my_courses_analytics() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_my_courses_analytics() TO authenticated;

-- ------------------------------------------------------------------------------
-- 3) list_course_students_analytics(p_course_id)
--    One row per enrolled student of ONE course the caller owns.
--    PII kept to name + academic code (no email / phone).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_course_students_analytics(p_course_id text)
RETURNS TABLE (
  student_id text,
  student_name text,
  student_code text,
  enrollment_status text,
  approved_at timestamptz,
  lessons_completed bigint,
  lessons_total bigint,
  progress_pct numeric,
  quiz_attempts bigint,
  avg_quiz_pct numeric,
  last_quiz_at timestamptz,
  pending_submissions bigint,
  last_activity_at timestamptz,
  days_inactive integer,
  needs_attention boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT public.owns_course(p_course_id) THEN
    RAISE EXCEPTION 'forbidden: you can only read analytics for a course you own';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.courses c WHERE c.id = p_course_id) THEN
    RAISE EXCEPTION 'course not found';
  END IF;

  RETURN QUERY
  WITH lc AS (
    SELECT count(*)::bigint AS lessons_total
    FROM public.lessons l
    WHERE l.course_id = p_course_id
  ),
  base AS (
    SELECT e.student_id,
           e.student_name,
           e.student_code,
           e.status,
           e.approved_at
    FROM public.course_enrollments e
    WHERE e.course_id = p_course_id
  ),
  per_student AS (
    SELECT b.student_id,
           b.student_name,
           b.student_code,
           b.status,
           b.approved_at,
           lc.lessons_total,
           (SELECT count(*)::bigint
              FROM public.lesson_progress lp
             WHERE lp.student_id::text = b.student_id
               AND lp.course_id = p_course_id) AS lessons_completed,
           (SELECT count(*)::bigint
              FROM public.quiz_submissions q
             WHERE q.student_id = b.student_id
               AND q.course_id = p_course_id) AS quiz_attempts,
           (SELECT round(avg(q.percentage), 1)
              FROM public.quiz_submissions q
             WHERE q.student_id = b.student_id
               AND q.course_id = p_course_id) AS avg_quiz_pct,
           (SELECT max(q.submitted_at)
              FROM public.quiz_submissions q
             WHERE q.student_id = b.student_id
               AND q.course_id = p_course_id) AS last_quiz_at,
           (SELECT count(*)::bigint
              FROM public.student_submissions s
             WHERE s.student_id::text = b.student_id
               AND s.course_id = p_course_id
               AND s.status = 'pending') AS pending_submissions,
           (SELECT max(x.ts)
              FROM (
                SELECT m.accessed_at AS ts
                  FROM public.media_access_log m
                  JOIN public.lessons l ON l.id = m.lesson_id
                 WHERE m.user_id::text = b.student_id
                   AND l.course_id = p_course_id
                UNION ALL
                SELECT lp.completed_at
                  FROM public.lesson_progress lp
                 WHERE lp.student_id::text = b.student_id
                   AND lp.course_id = p_course_id
                UNION ALL
                SELECT q.submitted_at
                  FROM public.quiz_submissions q
                 WHERE q.student_id = b.student_id
                   AND q.course_id = p_course_id
                UNION ALL
                SELECT s.created_at
                  FROM public.student_submissions s
                 WHERE s.student_id::text = b.student_id
                   AND s.course_id = p_course_id
              ) x) AS last_activity_at
    FROM base b
    CROSS JOIN lc
  ),
  calc AS (
    SELECT ps.student_id,
           ps.student_name,
           ps.student_code,
           ps.status,
           ps.approved_at,
           ps.lessons_completed,
           ps.lessons_total,
           CASE WHEN ps.lessons_total > 0
                THEN round(100.0 * ps.lessons_completed / ps.lessons_total, 1)
                ELSE NULL
           END AS progress_pct,
           ps.quiz_attempts,
           ps.avg_quiz_pct,
           ps.last_quiz_at,
           ps.pending_submissions,
           ps.last_activity_at,
           CASE WHEN ps.last_activity_at IS NULL THEN NULL
                ELSE floor(extract(epoch FROM (now() - ps.last_activity_at)) / 86400)::int
           END AS days_inactive,
           CASE WHEN ps.status = 'ACTIVE'
                 AND ps.approved_at IS NOT NULL
                 AND ps.approved_at < now() - interval '7 days'
                 AND ps.lessons_total > 0
                 AND ps.lessons_completed < 0.5 * ps.lessons_total
                 AND (ps.last_activity_at IS NULL
                      OR ps.last_activity_at < now() - interval '7 days')
                THEN true ELSE false
           END AS needs_attention
    FROM per_student ps
  )
  SELECT c.student_id,
         c.student_name,
         c.student_code,
         c.status,
         c.approved_at,
         c.lessons_completed,
         c.lessons_total,
         c.progress_pct,
         c.quiz_attempts,
         c.avg_quiz_pct,
         c.last_quiz_at,
         c.pending_submissions,
         c.last_activity_at,
         c.days_inactive,
         c.needs_attention
  FROM calc c
  ORDER BY c.needs_attention DESC,
           c.progress_pct ASC NULLS LAST,
           c.student_name ASC NULLS LAST,
           c.student_id ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_course_students_analytics(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_course_students_analytics(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 4) list_my_course_progress()
--    Student view: own enrollments only (matched on student_id, self).
--    Includes courses the student is enrolled in even if the course was since
--    unpublished (028b keeps enrolled students' access), matching RLS.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_my_course_progress()
RETURNS TABLE (
  course_id text,
  course_title text,
  course_code text,
  enrollment_status text,
  approved_at timestamptz,
  lessons_total bigint,
  lessons_completed bigint,
  progress_pct numeric,
  quiz_attempts bigint,
  avg_quiz_pct numeric,
  last_activity_at timestamptz,
  next_lesson_id text,
  next_lesson_title text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  RETURN QUERY
  WITH mine AS (
    SELECT e.course_id, e.status, e.approved_at
    FROM public.course_enrollments e
    WHERE e.student_id = auth.uid()::text
  ),
  per_course AS (
    SELECT m.course_id,
           m.status,
           m.approved_at,
           c.title AS course_title,
           c.code AS course_code,
           (SELECT count(*)::bigint
              FROM public.lessons l
             WHERE l.course_id = m.course_id) AS lessons_total,
           (SELECT count(*)::bigint
              FROM public.lesson_progress lp
             WHERE lp.student_id = auth.uid()
               AND lp.course_id = m.course_id) AS lessons_completed,
           (SELECT count(*)::bigint
              FROM public.quiz_submissions q
             WHERE q.student_id = auth.uid()::text
               AND q.course_id = m.course_id) AS quiz_attempts,
           (SELECT round(avg(q.percentage), 1)
              FROM public.quiz_submissions q
             WHERE q.student_id = auth.uid()::text
               AND q.course_id = m.course_id) AS avg_quiz_pct,
           (SELECT max(x.ts)
              FROM (
                SELECT mg.accessed_at AS ts
                  FROM public.media_access_log mg
                  JOIN public.lessons l2 ON l2.id = mg.lesson_id
                 WHERE mg.user_id = auth.uid()
                   AND l2.course_id = m.course_id
                UNION ALL
                SELECT lp.completed_at
                  FROM public.lesson_progress lp
                 WHERE lp.student_id = auth.uid()
                   AND lp.course_id = m.course_id
                UNION ALL
                SELECT q.submitted_at
                  FROM public.quiz_submissions q
                 WHERE q.student_id = auth.uid()::text
                   AND q.course_id = m.course_id
                UNION ALL
                SELECT s.created_at
                  FROM public.student_submissions s
                 WHERE s.student_id = auth.uid()
                   AND s.course_id = m.course_id
              ) x) AS last_activity_at
    FROM mine m
    JOIN public.courses c ON c.id = m.course_id
  )
  SELECT p.course_id,
         p.course_title,
         p.course_code,
         p.status,
         p.approved_at,
         p.lessons_total,
         p.lessons_completed,
         CASE WHEN p.lessons_total > 0
              THEN round(100.0 * p.lessons_completed / p.lessons_total, 1)
              ELSE NULL
         END,
         p.quiz_attempts,
         p.avg_quiz_pct,
         p.last_activity_at,
         nl.id,
         nl.title
  FROM per_course p
  LEFT JOIN LATERAL (
    SELECT l.id, l.title
    FROM public.lessons l
    WHERE l.course_id = p.course_id
      AND NOT EXISTS (
        SELECT 1 FROM public.lesson_progress lp
        WHERE lp.student_id = auth.uid()
          AND lp.lesson_id = l.id
      )
    ORDER BY l.sort_order ASC NULLS LAST, l.created_at ASC
    LIMIT 1
  ) nl ON true
  ORDER BY p.course_title ASC, p.course_id ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_my_course_progress() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_my_course_progress() TO authenticated;

-- ------------------------------------------------------------------------------
-- 5) get_platform_overview()
--    Founder-only platform counters. Every value is a real count (0 is a true
--    count of zero rows here, not an estimate).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_platform_overview()
RETURNS TABLE (
  students_total bigint,
  instructors_total bigint,
  secretaries_total bigint,
  courses_total bigint,
  published_courses_total bigint,
  active_enrollments_total bigint,
  new_enrollments_30d bigint,
  lessons_completed_30d bigint,
  quiz_attempts_30d bigint,
  pending_submissions_total bigint,
  active_students_7d bigint,
  active_students_30d bigint,
  last_activity_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: the platform overview is founder-only';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT count(*)::bigint FROM public.profiles p WHERE p.role = 'student'),
    (SELECT count(*)::bigint FROM public.profiles p WHERE p.role = 'instructor'),
    (SELECT count(*)::bigint FROM public.profiles p WHERE p.role = 'secretary'),
    (SELECT count(*)::bigint FROM public.courses c),
    (SELECT count(*)::bigint FROM public.courses c
      WHERE c.approval_status = 'APPROVED' AND c.is_published = true),
    (SELECT count(*)::bigint FROM public.course_enrollments e WHERE e.status = 'ACTIVE'),
    (SELECT count(*)::bigint FROM public.course_enrollments e
      WHERE e.approved_at > now() - interval '30 days'),
    (SELECT count(*)::bigint FROM public.lesson_progress lp
      WHERE lp.completed_at > now() - interval '30 days'),
    (SELECT count(*)::bigint FROM public.quiz_submissions q
      WHERE q.submitted_at > now() - interval '30 days'),
    (SELECT count(*)::bigint FROM public.student_submissions s WHERE s.status = 'pending'),
    (SELECT count(DISTINCT m.user_id)::bigint FROM public.media_access_log m
      WHERE m.accessed_at > now() - interval '7 days'),
    (SELECT count(DISTINCT m.user_id)::bigint FROM public.media_access_log m
      WHERE m.accessed_at > now() - interval '30 days'),
    (SELECT max(m.accessed_at) FROM public.media_access_log m);
END;
$$;

REVOKE ALL ON FUNCTION public.get_platform_overview() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_platform_overview() TO authenticated;

-- ------------------------------------------------------------------------------
-- 6) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 033 (read-only analytics layer: list_my_courses_analytics, list_course_students_analytics, list_my_course_progress, get_platform_overview; zero new tables, zero new write policies, averages stay NULL when there is no data) applied';
