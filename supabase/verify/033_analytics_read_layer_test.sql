-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 033 Test (single query)
-- Run AFTER applying supabase/migrations/033_analytics_read_layer.sql.
-- Every row must read PASS. Any FAIL = do not proceed.
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch runs - so Part A is ONE union-all query.
-- ==============================================================================

-- A1. The four analytics functions exist with the right signatures --------------
select 'A1'::text as test,
       'four analytics RPCs exist'::text as assertion,
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('list_my_courses_analytics', 'list_course_students_analytics',
                                      'list_my_course_progress', 'get_platform_overview')) = 4
             and (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_course_students_analytics'
                    and p.pronargs = 1 and pg_get_function_arguments(p.oid) ilike '%p_course_id text%') = 1
            then 'PASS' else 'FAIL - re-run migration 033' end::text as result

union all

-- A2. All four are SECURITY DEFINER with a pinned search_path ------------------
select 'A2',
       'SECURITY DEFINER + search_path = public on all four',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('list_my_courses_analytics', 'list_course_students_analytics',
                                      'list_my_course_progress', 'get_platform_overview')
                    and p.prosecdef
                    and p.proconfig::text ilike '%search_path=public%') = 4
            then 'PASS' else 'FAIL - re-run migration 033' end

union all

-- A3. Every function re-checks the caller before returning rows ----------------
select 'A3',
       'gates present: is_instructor / owns_course / auth.uid / is_super_admin',
       case when (select strpos(prosrc, 'is_instructor()') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_my_courses_analytics') > 0
             and (select strpos(prosrc, 'owns_course(p_course_id)') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_course_students_analytics') > 0
             and (select strpos(prosrc, 'auth.uid()::text') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_my_course_progress') > 0
             and (select strpos(prosrc, 'is_super_admin()') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'get_platform_overview') > 0
            then 'PASS' else 'FAIL - re-run migration 033 steps 2-5' end

union all

-- A4. The secretary is deliberately NOT an analytics role ----------------------
select 'A4',
       'secretary has no analytics gate (office excluded by design)',
       case when not exists (
              select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public'
                and p.proname in ('list_my_courses_analytics', 'list_course_students_analytics',
                                  'list_my_course_progress', 'get_platform_overview')
                and p.prosrc ilike '%is_secretary%')
            then 'PASS' else 'FAIL - remove the secretary gate from the analytics RPCs' end

union all

-- A5. Grants: authenticated only, anon denied ----------------------------------
select 'A5',
       'EXECUTE = authenticated, anon denied on all four',
       case when has_function_privilege('authenticated', 'public.list_my_courses_analytics()', 'EXECUTE')
             and has_function_privilege('authenticated', 'public.list_course_students_analytics(text)', 'EXECUTE')
             and has_function_privilege('authenticated', 'public.list_my_course_progress()', 'EXECUTE')
             and has_function_privilege('authenticated', 'public.get_platform_overview()', 'EXECUTE')
             and not has_function_privilege('anon', 'public.list_my_courses_analytics()', 'EXECUTE')
             and not has_function_privilege('anon', 'public.list_course_students_analytics(text)', 'EXECUTE')
             and not has_function_privilege('anon', 'public.list_my_course_progress()', 'EXECUTE')
             and not has_function_privilege('anon', 'public.get_platform_overview()', 'EXECUTE')
            then 'PASS' else 'FAIL - re-run the GRANT/REVOKE block in migration 033' end

union all

-- A6. Read-only guarantee: no INSERT / UPDATE / DELETE anywhere in the bodies --
select 'A6',
       'analytics layer performs zero writes',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('list_my_courses_analytics', 'list_course_students_analytics',
                                      'list_my_course_progress', 'get_platform_overview')
                    and (p.prosrc ilike '%insert into%'
                         or p.prosrc ilike '%update %'
                         or p.prosrc ilike '%delete from%')) = 0
            then 'PASS' else 'FAIL - a write slipped into a read-only RPC' end

union all

-- A7. Honesty: averages are NULLable and guarded (never fabricated zeros) ------
select 'A7',
       'progress columns are NULL when there is no data (no coalesce(avg(...),0))',
       case when (select pg_get_function_result(p.oid) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_my_courses_analytics') ilike '%avg_progress_pct numeric%'
             and (select pg_get_function_result(p.oid) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_course_students_analytics') ilike '%progress_pct numeric%'
             and (select strpos(prosrc, 'lessons_total > 0') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_course_students_analytics') > 0
             and (select strpos(prosrc, 'lessons_total > 0') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_my_course_progress') > 0
             and (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('list_my_courses_analytics', 'list_course_students_analytics',
                                      'list_my_course_progress', 'get_platform_overview')
                    and p.prosrc ilike '%coalesce(avg%') = 0
            then 'PASS' else 'FAIL - re-run migration 033 (honesty guards missing)' end

union all

-- A8. "needs_attention" is documented in the body (7 days + under 50%) ---------
select 'A8',
       'needs_attention heuristic present (ACTIVE + 7 days + under 50% progress)',
       case when (select strpos(prosrc, 'interval ''7 days''') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_course_students_analytics') > 0
             and (select strpos(prosrc, '0.5 * ps.lessons_total') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_course_students_analytics') > 0
            then 'PASS' else 'FAIL - re-run migration 033 step 3' end

union all

-- A9. Supporting indexes exist (course-first access paths) --------------------
select 'A9',
       'six analytics indexes present',
       case when (select count(*) from pg_indexes
                  where schemaname = 'public'
                    and indexname in ('idx_course_enrollments_course_status',
                                      'idx_lesson_progress_course_student',
                                      'idx_student_submissions_course_status',
                                      'idx_quiz_submissions_course_time',
                                      'idx_media_access_log_lesson_time',
                                      'idx_lessons_course_sort')) = 6
            then 'PASS' else 'FAIL - re-run migration 033 step 1' end

union all

-- A10. Read-only by construction: every RPC is STABLE, no analytics tables -----
select 'A10',
       'all four RPCs are STABLE (cannot write) and zero analytics tables were added',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('list_my_courses_analytics', 'list_course_students_analytics',
                                      'list_my_course_progress', 'get_platform_overview')
                    and p.provolatile = 's') = 4
             and not exists (select 1 from information_schema.tables
                             where table_schema = 'public'
                               and table_name in ('analytics_snapshots', 'course_analytics',
                                                  'learning_events', 'student_analytics'))
            then 'PASS' else 'FAIL - review what 033 changed' end

union all

-- A11. Schema marker through 033 ----------------------------------------------
select 'A11',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%033%'
       then 'PASS' else 'FAIL' end

union all

-- A12. TRUTH check: source rows for the aggregates (informational) ------------
select 'A12',
       'source rows: enrollments / lesson completions / quiz attempts / submissions',
       (select count(*)::text from public.course_enrollments) || ' enrollments, '
       || (select count(*)::text from public.lesson_progress) || ' lesson completions, '
       || (select count(*)::text from public.quiz_submissions) || ' quiz attempts, '
       || (select count(*)::text from public.student_submissions) || ' submissions'

order by test;

-- ==============================================================================
-- PART B - Manual app-level matrix (after the migration + UI deploy).
-- ==============================================================================
--
-- B1  INSTRUCTOR, EMPTY COURSE: open the analytics tab on a course with no
--     students -> every average reads "No data yet" (never 0%, never a number
--     that looks like a result). Counters may be real zeros.
-- B2  INSTRUCTOR, REAL COURSE: for a course with active students, the numbers
--     must match the raw tables: enrolled count vs Enrollments tab, lessons
--     total vs Curriculum tab, completed count vs a student's progress.
-- B3  PROGRESS MATH: a student who completed 2 of 4 lessons shows 50.0%.
--     A course with 0 lessons shows "No data yet", not 0% and not 100%.
-- B4  ISOLATION: instructor A must never see instructor B's course analytics.
--     Calling the RPC for a foreign course id must raise "forbidden".
-- B5  STUDENT: "My progress" shows only the student's own enrollments, with the
--     next unfinished lesson; a finished course shows no next lesson.
-- B6  FOUNDER: the platform overview shows real counts that match the tables.
--     A secretary account must NOT be able to call get_platform_overview().
-- B7  NEEDS ATTENTION: a student enrolled more than 7 days ago, under 50%
--     progress and with no activity in 7 days is flagged; a freshly enrolled
--     student is never flagged.
-- B8  NO MONEY: the analytics tabs must not show revenue, commission or
--     settlement figures (finance stays in its own gated tabs).
-- ==============================================================================
