-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 027 Test (single query)
-- Run AFTER applying supabase/migrations/027_audit_log_viewer.sql.
-- Every row must read PASS. Any FAIL = do not proceed.
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch runs - so Part A is ONE union-all query.
-- ==============================================================================

-- A1. the founder read RPC exists and is a SECURITY DEFINER ------------------------
select 'A1'::text as test,
       'founder_list_audit_logs exists (security definer)'::text as assertion,
       case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname = 'founder_list_audit_logs'
                    and p.prosecdef)
            then 'PASS' else 'FAIL - re-run migration 027 step 2' end::text as result

union all

-- A2. the gate is is_super_admin ONLY (not secretary, not is_admin) ----------------
select 'A2',
       'gate is is_super_admin() and never is_secretary/is_admin',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'founder_list_audit_logs')
                 ilike '%is_super_admin%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'founder_list_audit_logs')
                 not ilike '%is_secretary%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'founder_list_audit_logs')
                 not ilike '%is_admin()%'
            then 'PASS' else 'FAIL - the viewer must be founder-only' end

union all

-- A3. pagination is clamped (cannot pull the whole ledger in one call) -------------
select 'A3',
       'p_limit clamped to 1..200',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'founder_list_audit_logs')
                 ilike '%least(greatest%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'founder_list_audit_logs')
                 ilike '%200%'
            then 'PASS' else 'FAIL - re-run migration 027 step 2' end

union all

-- A4. the function only READS (no write verbs anywhere in the body) ----------------
select 'A4',
       'read-only body (no INSERT/UPDATE/DELETE)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'founder_list_audit_logs')
                 not ilike '%insert into%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'founder_list_audit_logs')
                 not ilike '%update %'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'founder_list_audit_logs')
                 not ilike '%delete from%'
            then 'PASS' else 'FAIL - the viewer must never write' end

union all

-- A5. execute rights: anon NO, authenticated YES ----------------------------------
select 'A5',
       'anon cannot execute; authenticated can (function still gates)',
       case when has_function_privilege(
                   'anon',
                   'public.founder_list_audit_logs(text,text,text,text,text,timestamptz,timestamptz,integer,integer)'::regprocedure,
                   'EXECUTE') = false
             and has_function_privilege(
                   'authenticated',
                   'public.founder_list_audit_logs(text,text,text,text,text,timestamptz,timestamptz,integer,integer)'::regprocedure,
                   'EXECUTE') = true
            then 'PASS' else 'FAIL - re-run migration 027 grants' end

union all

-- A6. the actor-email filter index exists -----------------------------------------
select 'A6',
       'idx_audit_logs_actor_email exists',
       case when exists (select 1 from pg_indexes
                  where schemaname = 'public'
                    and tablename = 'audit_logs'
                    and indexname = 'idx_audit_logs_actor_email')
            then 'PASS' else 'FAIL - re-run migration 027 step 1' end

union all

-- A7. audit_logs STILL has zero client write policies -----------------------------
select 'A7',
       'audit_logs has no client write policies',
       case when not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'audit_logs'
                    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL'))
            then 'PASS' else 'FAIL - a write policy leaked onto audit_logs' end

union all

-- A8. audit_logs read policy is STILL super_admin only ----------------------------
select 'A8',
       'audit_logs read policy = is_super_admin only',
       case when exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'audit_logs'
                    and cmd = 'SELECT'
                    and qual ilike '%is_super_admin%')
             and not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'audit_logs'
                    and cmd = 'SELECT'
                    and qual ilike '%is_secretary%')
            then 'PASS' else 'FAIL - the 022 read policy changed' end

union all

-- A9. TRUTH check: how much history is actually there (informational) -------------
select 'A9',
       'audit_logs rows (informational - empty is correct on a fresh ledger)',
       (select count(*)::text from public.audit_logs) || ' rows'

union all

-- A10. schema marker through 027 ---------------------------------------------------
select 'A10',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%027%'
       then 'PASS' else 'FAIL' end

order by test;

-- ==============================================================================
-- PART B - Manual app-level matrix (after the migration + UI deploy).
-- ==============================================================================
-- B1  FOUNDER SEES IT: log in as the founder -> Dashboard -> Super Administration
--     -> "Audit Log" tab. The panel must load (empty state is CORRECT while the
--     ledger has no rows).
-- B2  FILTERS: type part of an action (e.g. "role") and/or an actor email; the
--     list must narrow. Clearing the fields brings everything back. Date From/To
--     must narrow by created_at.
-- B3  PAGINATION: with 50+ rows, "Next" moves forward and "Previous" returns;
--     the footer shows the real total.
-- B4  SECRETARY IS BLOCKED: log in as the secretary (o.magdi777@gmail.com) ->
--     the Audit Log tab must NOT exist, and /office must not expose the log.
--     (Even if she called the RPC by hand, it raises "forbidden".)
-- B5  IMMUTABILITY: in SQL Editor, try
--       update public.audit_logs set note = 'x' where true;
--     -> must fail with "history is immutable". Same for delete.
-- B6  RE-RUN check_database_state.sql -> AUDIT VIEWER AUDIT rows OK + marker
--     "OK (through 027)".
-- ==============================================================================
