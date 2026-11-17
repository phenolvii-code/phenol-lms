-- ==============================================================================
-- PHENOL ACADEMY LMS - Full Database State Verification
-- Purpose: one-glance checklist that every migration (000 → 017) actually
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
  ('lesson_progress'), ('lesson_comments'), ('media_access_log'),
  ('booklets'), ('instructor_profiles'), ('question_bank_items')
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
  ('list_instructor_quizzes'), ('get_quiz_for_editing'), ('save_quiz'), ('delete_quiz'),
  ('can_download_booklet'),
  ('get_instructor_reviews'), ('get_review_stats'), ('admin_delete_student_account'),
  ('admin_set_user_role'), ('is_secretary')
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
  ('quiz_submissions', 'submissions read own or course owner'),
  ('waitlist_applications', 'waitlist read scoped'),
  ('instructor_requests', 'requests read own or super admin'),
  ('instructor_requests', 'requests insert own pending'),
  ('booklets', 'booklets read'),
  ('booklets', 'booklets manage'),
  ('instructor_profiles', 'instructor profiles read'),
  ('instructor_profiles', 'instructor profiles manage own'),
  ('question_bank_items', 'question banks read'),
  ('question_bank_items', 'question banks manage'),
  ('student_notifications', 'notifications admin manage'),
  ('instructor_reviews', 'reviews read involved'),
  ('instructor_reviews', 'reviews insert enrolled')
) as t(tablename_ref, policyname_ref)

union all

-- 4b. Storage policies (bucket `booklets` is private + download-gated) ----------
select 'POLICY (storage)', 'booklets -> ' || policyname_ref,
       case when exists (select 1 from pg_policies
         where schemaname = 'storage' and tablename = 'objects' and policyname = policyname_ref)
       then 'OK' else 'MISSING' end
from (values
  ('booklets download gated'),
  ('booklets manage super_admin')
) as t(policyname_ref)

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

-- 6. Migration 014 audit: the legacy "admin all" policies are GONE --------------
--    Expected: 0 rows anywhere in the public schema. Any count > 0 = LEAKED.
select 'POLICY AUDIT', 'no legacy "admin all" policies remain (migration 014)',
       case when not exists (select 1 from pg_policies
         where schemaname = 'public' and policyname in ('admin all', 'super admin all'))
       then 'OK' else 'LEAKED - re-run migration 014' end

union all

-- 6b. Migration 018 audit: NO policy may trust is_admin() anymore ---------------
--     is_admin() returns true for ANY instructor, so every remaining
--     is_admin()-based policy is a cross-instructor leak. Expected: 0 rows.
select 'POLICY AUDIT', 'no is_admin()-based policies remain (migration 018)',
       case when not exists (select 1 from pg_policies
         where schemaname = 'public'
           and (qual ilike '%is_admin()%' or with_check ilike '%is_admin()%'))
       then 'OK' else 'LEAKED - re-run migration 018' end

union all

-- 6c. Migration 019 audit: every instructor-role account has a directory row ---
--     A promoted instructor without an instructor_profiles row is invisible on
--     /faculty (public read shows published rows only). Expected: 0 missing.
select 'DIRECTORY AUDIT', 'every instructor-role account has a directory row (migration 019)',
       case when not exists (
         select 1
         from auth.users u
         left join public.profiles p on p.id = u.id
         left join public.registered_students rs
           on lower(trim(rs.email)) = lower(trim(u.email))
         where (p.role = 'instructor' or upper(coalesce(rs.role, '')) = 'INSTRUCTOR')
           and not exists (
             select 1 from public.instructor_profiles ip where ip.user_id = u.id
           )
       )
       then 'OK' else 'MISSING rows - re-run migration 019 step 1' end

union all

-- 6d. Migration 020 audit: the profiles role constraint accepts 'secretary' ----
--     The CHECK constraint must list all four roles. Expected: OK.
select 'RBAC AUDIT', 'profiles_role_check accepts secretary (migration 020)',
       case when exists (
         select 1 from pg_constraint
         where conrelid = 'public.profiles'::regclass
           and conname = 'profiles_role_check'
           and pg_get_constraintdef(oid) ilike '%secretary%'
       )
       then 'OK' else 'MISSING - re-run migration 020 step 1' end

union all

-- 6e. Migration 020 audit: admin_set_user_role whitelist knows 'secretary' -----
--     The live function definition must mention secretary (020 rewrite ran)
--     AND must still be super_admin-gated. Expected: OK.
select 'RBAC AUDIT', 'admin_set_user_role whitelist + gate (migration 020)',
       case when exists (
         select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'admin_set_user_role'
           and p.prosrc ilike '%''secretary''%'
           and p.prosrc ilike '%is_super_admin()%'
       )
       then 'OK' else 'STALE - re-run migration 020 step 3' end

union all

-- 6f. Migration 020 audit: signup trigger preserves elevated roles -------------
--     The live handle_new_auth_user must contain the preservation CASE
--     (no force-downgrade of existing super_admin/instructor/secretary rows).
select 'RBAC AUDIT', 'signup trigger preserves elevated roles (migration 020)',
       case when exists (
         select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'handle_new_auth_user'
           and p.prosrc ilike '%super_admin''%, ''instructor'', ''secretary%'
       )
       then 'OK' else 'STALE - re-run migration 020 step 4' end

union all

-- 6g. Migration 020 audit: NO secretary has a published directory row ----------
--     Secretaries are administrative staff; they never belong on /faculty.
--     With zero secretaries promoted this is trivially OK; after the manual
--     promotion it still must hold. Expected: 0 violations.
select 'DIRECTORY AUDIT', 'no secretary has a published directory row (migration 020)',
       case when not exists (
         select 1
         from public.profiles p
         join public.instructor_profiles ip on ip.user_id = p.id
         where p.role = 'secretary' and ip.is_published = true
       )
       then 'OK' else 'LEAKED - unpublish the secretary directory row' end

union all

-- 6h. Migration 020 audit: NO account was auto-promoted to secretary ----------
--     Informational: shows how many secretaries exist right now. Expected
--     after migration: 0 (promotion is a manual super-admin action later).
select 'RBAC STATE', 'secretary accounts currently in profiles (migration 020)',
       (select count(*)::text from public.profiles where role = 'secretary')

union all

-- 6i. Design audit (010/018): quiz_submissions has ZERO direct write policies -
--     rows are written ONLY by the security-definer RPC submit_quiz_attempt().
--     Exactly ONE policy must exist on quiz_submissions: the SELECT policy.
--     (The old checklist demanded a "submissions grade own course" policy that
--     never existed in any migration - a checklist authoring error, fixed.)
select 'POLICY AUDIT', 'quiz_submissions writes are RPC-only (migration 010 design)',
       case when (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'quiz_submissions') = 1
            then 'OK' else 'REVIEW - unexpected policies on quiz_submissions' end

union all

-- 7. Migration 015 audit: the `booklets` bucket is PRIVATE ----------------------
select 'STORAGE AUDIT', 'bucket booklets is private (migration 015)',
       case when exists (select 1 from storage.buckets
         where id = 'booklets' and public = false)
       then 'OK' else 'NOT PRIVATE - re-run migration 015' end

union all

-- 8. Schema audit marker (shows the highest migration actually applied) ---------
select 'AUDIT MARKER', 'schema comment',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%020%'
       then 'OK (through 020)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%019%'
       then 'PARTIAL (019 only - 020 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%018%'
       then 'PARTIAL (018 only - 019/020 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%017%'
       then 'PARTIAL (017 only - 018/019/020 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%016%'
       then 'PARTIAL (016 only - 017/018/019/020 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%014%'
       then 'PARTIAL (014 only - 015/016/019/020 not applied)'
       else 'MISSING/OLDER' end

order by kind, item;
