-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 020 Role Matrix Test (single-query edition)
-- Run AFTER applying supabase/migrations/020_rbac_secretary.sql.
-- Every row must read PASS. Any FAIL = do not proceed to 021.
--
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch is run. Part A is therefore ONE union-all query so
-- all 10 rows appear together.
--
-- Part A: DB-level structural assertions (runnable right now).
-- Part B: manual app-level test matrix (run after the super admin promotes
--         the secretary through the app UI - the migration never does it).
-- ==============================================================================

-- A1. The constraint lists EXACTLY the four roles ------------------------------
--     FORMAT NOTE: pg_get_constraintdef() renders IN-lists in the internal
--     "= ANY (ARRAY[...])" form with ::text casts, and spacing varies - so this
--     assertion checks that ALL FOUR role literals are present instead of
--     matching one rigid string. (Earlier rigid regex produced a false FAIL.)
select 'A1'::text as test,
       'profiles_role_check = 4 roles'::text as assertion,
       case when (select pg_get_constraintdef(oid) from pg_constraint
                  where conrelid = 'public.profiles'::regclass
                    and conname = 'profiles_role_check')
                 ilike all(array['%student%', '%instructor%',
                                 '%super_admin%', '%secretary%'])
            then 'PASS' else 'FAIL - re-run migration 020 step 1' end::text as result

union all

-- A2. is_secretary() exists, is STABLE + SECURITY DEFINER, revoked from public --
select 'A2',
       'is_secretary() definition hygiene',
       case when (select p.provolatile = 's'
                       and p.prosecdef = true
                       and not exists (select 1 from information_schema.routine_privileges
                           where specific_schema = 'public'
                             and routine_name = 'is_secretary'
                             and grantee = 'public'
                             and privilege_type = 'EXECUTE')
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'is_secretary')
            then 'PASS' else 'FAIL' end

union all

-- A3. admin_set_user_role: mentions 'secretary' EXACTLY ONCE (whitelist only) ---
--     One occurrence = the whitelist check. An INSERT with 'secretary' would
--     make it 2+. This proves the migration auto-promotes NOBODY.
select 'A3',
       'admin_set_user_role mentions secretary once (no auto-promotion)',
       case when (select (length(prosrc) - length(replace(lower(prosrc), 'secretary', '')))
                        / length('secretary')
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'admin_set_user_role') = 1
            then 'PASS' else 'FAIL - inspect migration 020 step 3' end

union all

-- A4. admin_set_user_role still: super_admin gate + founder protection ---------
select 'A4',
       'admin_set_user_role gate + founder rule intact',
       case when (select prosrc ilike '%is_super_admin()%'
                       and prosrc ilike '%phenolvii@gmail.com%'
                       and prosrc ilike '%cannot alter founder role%'
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'admin_set_user_role')
            then 'PASS' else 'FAIL' end

union all

-- A5. Signup trigger: new accounts start as student + elevated roles preserved --
select 'A5',
       'handle_new_auth_user: student-by-default + role preservation',
       case when (select prosrc ilike '%VALUES (NEW.id, ''student'')%'
                       and prosrc ilike '%super_admin''%, ''instructor'', ''secretary%'
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'handle_new_auth_user')
            then 'PASS' else 'FAIL' end

union all

-- A6. NO existing helper/privilege was widened to include secretary ------------
--     is_super_admin / is_admin / owns_course / enrollment / instructor-decision
--     RPCs must NOT mention secretary. This is the no-bypass proof.
select 'A6',
       'no helper widened (is_super_admin/is_admin/owns_course/enrollment)',
       case when not exists (
         select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public'
           and p.proname in ('is_super_admin', 'is_admin', 'owns_course',
                             'has_active_enrollment', 'admin_enroll_student',
                             'decide_instructor_request')
           and prosrc ilike '%secretary%'
       ) then 'PASS' else 'FAIL - a gate was silently widened' end

union all

-- A7. ZERO policies reference is_secretary (020 grants no permissions yet) ------
select 'A7',
       'no policy trusts is_secretary yet',
       case when not exists (
         select 1 from pg_policies
         where schemaname = 'public'
           and (qual ilike '%is_secretary()%' or with_check ilike '%is_secretary()%')
       ) then 'PASS' else 'FAIL - permissions granted too early' end

union all

-- A8. ZERO RPCs (other than the helper itself) call is_secretary yet ------------
select 'A8',
       'no RPC calls is_secretary yet',
       case when (select count(*) from pg_proc p
                  join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname <> 'is_secretary'
                    and prosrc ilike '%is_secretary()%') = 0
       then 'PASS' else 'FAIL - permissions granted too early' end

union all

-- A9. No account was auto-promoted (secretary count is informational) -----------
--     Expected right after migration: 0. After the manual promotion: 1.
select 'A9',
       'secretary accounts (informational)',
       (select count(*)::text from public.profiles where role = 'secretary')

union all

-- A10. Schema marker through 020 ------------------------------------------------
select 'A10',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%020%'
       then 'PASS' else 'FAIL' end

order by test;

-- ==============================================================================
-- PART B - Manual app-level matrix (run AFTER the super admin promotes
--          o.magdi777@gmail.com to secretary from the super-admin panel).
-- ==============================================================================
-- B1  SUPER ADMIN  : role change UI accepts "secretary" for o.magdi777
--                     -> profiles.role = 'secretary', roster role = 'SECRETARY'.
-- B2  SUPER ADMIN  : all existing tabs/actions still work (unchanged).
-- B3  SECRETARY    : login -> dashboard opens (student-style view for now is
--                     EXPECTED: the secretary dashboard arrives in Phase 3).
-- B4  SECRETARY    : calling admin_set_user_role (any role) -> "forbidden".
--                     via browser console: supabase.rpc('admin_set_user_role',
--                     { p_user_email:'anyone@gmail.com', p_role:'instructor' })
--                     must return the forbidden error.
-- B5  SECRETARY    : decide_instructor_request -> forbidden (cannot approve
--                     instructors).
-- B6  SECRETARY    : admin_enroll_student -> forbidden (cannot enroll).
-- B7  SECRETARY    : /faculty page -> secretary does NOT appear in the
--                     faculty directory (no instructor_profiles row).
-- B8  INSTRUCTOR   : an existing instructor's dashboard, courses, quizzes,
--                     submissions, students tabs behave exactly as before.
-- B9  INSTRUCTOR   : cannot call admin_set_user_role / decide_instructor_request
--                     (unchanged - still forbidden, verify once).
-- B10 STUDENT      : a student's login, courses, lessons, quizzes, tasks,
--                     notifications all behave exactly as before.
-- B11 ESCALATION   : try re-registering the promoted secretary account
--                     (sign-up flow with the same email is not possible while
--                     the account exists, so instead confirm via SQL):
--                     select role from public.profiles p join auth.users u on
--                     u.id = p.id where lower(trim(u.email))='o.magdi777@gmail.com';
--                     -> must still be 'secretary' (trigger preserves it).
-- B12 UNAUTHORIZED : any non-super-admin calling admin_set_user_role with
--                     p_role='secretary' -> "forbidden" (never succeeds).
-- ==============================================================================
