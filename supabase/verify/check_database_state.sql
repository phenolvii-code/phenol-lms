-- ==============================================================================
-- PHENOL ACADEMY LMS - Full Database State Verification
-- Purpose: one-glance checklist that every migration (000 → 011) actually
--          exists in THIS database. Run after any migration or backup restore.
-- Result: rows with status OK / MISSING. Expected: every row OK.
-- ==============================================================================

-- 1. Core tables ---------------------------------------------------------------
select 'TABLE' as kind, name as item,
       case when exists (select 1 from information_schema.tables
         where table_schema = 'public' and table_name = name) then 'OK' else 'MISSING' end as status
from (values
  ('courses'), ('lessons'), ('lesson_assets'), ('profiles'),
  ('registered_students'), ('course_enrollments'), ('referrals'),
  ('quizzes'), ('quiz_submissions'), ('instructor_requests'),
  ('lesson_progress'), ('lesson_comments'), ('media_access_log')
) as t(name)

union all

-- 2. Core functions ------------------------------------------------------------
select 'FUNCTION', name,
       case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = name) then 'OK' else 'MISSING' end
from (values
  ('is_admin'), ('is_super_admin'), ('owns_course'), ('has_active_enrollment'),
  ('handle_new_auth_user'), ('generate_academic_code'),
  ('get_lesson_media'), ('set_course_approval'),
  ('submit_instructor_request'), ('decide_instructor_request'),
  ('get_course_quiz_metadata'), ('get_quiz_questions'), ('submit_quiz_attempt'),
  ('list_instructor_quizzes'), ('get_quiz_for_editing'), ('save_quiz'), ('delete_quiz')
) as t(name)

union all

-- 3. Registration trigger ------------------------------------------------------
select 'TRIGGER', 'on_auth_user_created on auth.users',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
         join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'auth' and c.relname = 'users'
           and t.tgname = 'on_auth_user_created' and not t.tgisinternal)
       then 'OK' else 'MISSING' end

union all

-- 4. RLS policies (exact names matter) -----------------------------------------
select 'POLICY', tablename_ref || ' -> ' || policyname_ref,
       case when exists (select 1 from pg_policies
         where schemaname = 'public' and tablename = tablename_ref and policyname = policyname_ref)
       then 'OK' else 'MISSING' end
from (values
  ('quizzes', 'quizzes read'),
  ('quizzes', 'quizzes owner manage'),
  ('quiz_submissions', 'submissions read own or admin'),
  ('instructor_requests', 'requests read own or super admin'),
  ('instructor_requests', 'requests insert own pending')
) as t(tablename_ref, policyname_ref)

union all

-- 5. Answer-key column must be readable by NOBODY (anon/authenticated) ---------
--    Expected value: 0 → shows OK. Only SELECT counts: the table keeps
--    INSERT/UPDATE grants (expanded per-column by this view), and those are
--    NOT a read leak — only SELECT is.
select 'COLUMN SECURITY', 'quizzes.questions hidden from clients',
       case when not exists (select 1 from information_schema.column_privileges
         where table_schema = 'public' and table_name = 'quizzes'
           and column_name = 'questions'
           and privilege_type = 'SELECT'
           and grantee in ('anon', 'authenticated'))
       then 'OK' else 'LEAKED - re-run migration 010 step 3' end

union all

-- 6. Schema audit marker (shows the highest migration actually applied) --------
select 'AUDIT MARKER', 'schema comment',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%011%'
       then 'OK (through 011)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%010%'
       then 'PARTIAL (010 only - 011 not applied)'
       else 'MISSING/OLDER' end

order by kind, item;
