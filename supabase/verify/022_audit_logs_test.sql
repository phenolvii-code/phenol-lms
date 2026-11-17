-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 022 Audit Logs Test (single query)
-- Run AFTER applying supabase/migrations/022_audit_logs.sql.
-- Every row must read PASS. Any FAIL = do not proceed to 023.
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch runs - so Part A is ONE union-all query.
-- ==============================================================================

-- A1. audit_logs exists + RLS enabled -------------------------------------------
select 'A1'::text as test,
       'audit_logs exists + RLS enabled'::text as assertion,
       case when exists (select 1 from information_schema.tables
                  where table_schema = 'public' and table_name = 'audit_logs')
             and exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'audit_logs' and c.relrowsecurity)
            then 'PASS' else 'FAIL - re-run migration 022 step 1' end::text as result

union all

-- A2. EXACTLY ONE client policy: super_admin read only (no write policies at all)-
--     NOTE: pg_policies.cmd is UPPERCASE ('SELECT') - compare case-insensitively
--     (lesson from the earlier constraint-text false-FAIL).
select 'A2',
       'audit_logs client policies = 1 (super_admin SELECT only)',
       case when (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'audit_logs') = 1
             and exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'audit_logs'
                    and policyname = 'audit logs read super_admin'
                    and upper(cmd) = 'SELECT')
            then 'PASS' else 'FAIL - a write policy leaked onto audit_logs' end

union all

-- A3. append-only guards bound (row-level AND statement-level; the statement
--     guard refuses even when the table is EMPTY - addendum 022b) --------------
select 'A3',
       'trg_audit_logs_guard + statement guard bound to audit_logs',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'audit_logs'
                    and t.tgname = 'trg_audit_logs_guard' and not t.tgisinternal)
             and exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'audit_logs'
                    and t.tgname = 'trg_audit_logs_guard_statement' and not t.tgisinternal)
            then 'PASS' else 'FAIL - re-run migration 022 step 1b + 022b addendum' end

union all

-- A4. log RPC exists + definer + granted to authenticated ------------------------
select 'A4',
       'log_academy_action exists (definer)',
       case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'log_academy_action'
                    and p.prosecdef)
            then 'PASS' else 'FAIL - re-run migration 022 step 2' end

union all

-- A5. automatic role-change capture bound to profiles ----------------------------
select 'A5',
       'trg_audit_role_change bound to profiles (AFTER UPDATE OF role)',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'profiles'
                    and t.tgname = 'trg_audit_role_change' and not t.tgisinternal)
            then 'PASS' else 'FAIL - re-run migration 022 step 3' end

union all

-- A6. indexes present -------------------------------------------------------------
select 'A6',
       'audit_logs indexes (created_at/actor/entity/action)',
       case when (select count(*) from pg_indexes
                  where schemaname = 'public' and tablename = 'audit_logs'
                    and indexname in ('idx_audit_logs_created_at', 'idx_audit_logs_actor',
                                      'idx_audit_logs_entity', 'idx_audit_logs_action')) = 4
            then 'PASS' else 'FAIL - re-run migration 022 step 1' end

union all

-- A7. source CHECK constraint covers the five sources ----------------------------
select 'A7',
       'audit_logs.source constrained to 5 values',
       case when exists (select 1 from pg_constraint
                  where conrelid = 'public.audit_logs'::regclass
                    and contype = 'c'
                    and pg_get_constraintdef(oid) ilike '%webhook%'
                    and pg_get_constraintdef(oid) ilike '%system%')
            then 'PASS' else 'FAIL - re-run migration 022 step 1' end

union all

-- A8. TRUTH check: the ledger starts EMPTY (no fabricated history) ---------------
select 'A8',
       'audit rows (informational - starts empty)',
       case when (select count(*) from public.audit_logs) = 0
            then 'PASS (0 rows - empty as designed)'
            else 'INFO: ' || (select count(*)::text from public.audit_logs)
                 || ' real rows already recorded' end

union all

-- A9. schema marker through 022 ---------------------------------------------------
select 'A9',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%022%'
       then 'PASS' else 'FAIL' end

order by test;

-- ==============================================================================
-- PART B - Manual tamper proofs (after the migration + 022b addendum).
-- ==============================================================================
-- B1  SQL EDITOR (postgres, no JWT): run   UPDATE public.audit_logs SET action = 'hacked';
--     -> "audit_logs: history is immutable - UPDATE is forbidden for everyone".
--     Refused EVEN THOUGH the table is empty (statement-level guard, 022b).
-- B2  SQL EDITOR: run   DELETE FROM public.audit_logs;
--     -> same hard refusal. (Cleanup of a bad manual test row is NOT possible
--     by design - rows are append-only. Test with care: a bad row stays.)
-- B3  INSTRUCTOR (live app): SELECT audit_logs -> denied (super_admin-only).
-- B4  INSTRUCTOR (live app): call log_academy_action(...)
--     -> "forbidden: only the academy founder or secretary can write audit entries".
-- B5  STUDENT (live app): SELECT audit_logs -> denied.
-- B6  RE-RUN check_database_state.sql -> AUDIT AUDIT rows OK (guards row now
--     says "migration 022/022b") + marker "OK (through 022)".
-- ==============================================================================
-- PART C - Optional live proof of the automatic role-change capture.
-- ==============================================================================
-- C1  Change a role via the momentary-trigger-off dance (same pattern as the
--     secretary promotion) BUT do NOT disable trg_audit_role_change:
--       begin;
--       alter table public.profiles disable trigger trg_profiles_protect_commission;
--       update public.profiles set role = 'student' where id = (select id from auth.users where lower(trim(email)) = '<test-user>');
--       alter table public.profiles enable trigger trg_profiles_protect_commission;
--       commit;
--     Then: select action, summary, actor_email from public.audit_logs order by created_at desc limit 5;
--     -> expect a 'role.change' row with "role changed: X -> student" and
--        actor_email empty (SQL Editor has no JWT - the change itself is still
--        always recorded; that is the design).
-- C2  Change the role back the same way -> a second role.change row appears.
--     Both rows are permanent proof the auto-capture works.
-- ==============================================================================
