-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 025 Test (single query)
-- Run AFTER applying supabase/migrations/025_settlements_and_ledgers.sql.
-- Every row must read PASS. Any FAIL = do not proceed to 026.
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch runs - so Part A is ONE union-all query.
-- ==============================================================================

-- A1. instructor_settlements exists + RLS enabled ---------------------------------
select 'A1'::text as test,
       'instructor_settlements exists + RLS enabled'::text as assertion,
       case when exists (select 1 from information_schema.tables
                  where table_schema = 'public' and table_name = 'instructor_settlements')
             and exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'instructor_settlements' and c.relrowsecurity)
            then 'PASS' else 'FAIL - re-run migration 025 step 1' end::text as result

union all

-- A2. exactly ONE client policy on instructor_settlements (read-only) -------------
select 'A2',
       'instructor_settlements policies = 1 (SELECT only, zero client writes)',
       case when (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'instructor_settlements') = 1
             and exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'instructor_settlements'
                    and policyname = 'settlements read own or office'
                    and upper(cmd) = 'SELECT')
            then 'PASS' else 'FAIL - unexpected policy on instructor_settlements' end

union all

-- A3. immutability guard bound to instructor_settlements --------------------------
select 'A3',
       'trg_settlements_guard bound to instructor_settlements',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'instructor_settlements'
                    and t.tgname = 'trg_settlements_guard' and not t.tgisinternal)
            then 'PASS' else 'FAIL - re-run migration 025 step 1b' end

union all

-- A4. all 6 financial/settlement RPCs exist + security definer --------------------
select 'A4',
       'commission / settlement / ledger / overview RPCs exist + definer',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in (
                      'set_instructor_commission',
                      'set_default_platform_commission',
                      'create_instructor_settlement',
                      'set_settlement_status',
                      'get_instructor_financial_ledger',
                      'get_super_admin_financial_overview'
                    )
                    and p.prosecdef) = 6
            then 'PASS' else 'FAIL - re-run migration 025 steps 2-6' end

union all

-- A5. commission RPCs strictly super_admin-gated + audited ------------------------
select 'A5',
       'commission RPCs gated to is_super_admin() + audit-logged',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_instructor_commission') ilike '%is_super_admin()%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_instructor_commission') not ilike '%is_secretary()%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_instructor_commission') ilike '%commission.instructor.set%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_default_platform_commission') ilike '%commission.default.set%'
            then 'PASS' else 'FAIL - re-run migration 025 step 2' end

union all

-- A6. create_instructor_settlement refuses 0-payment windows (no fabrication) ------
select 'A6',
       'create_instructor_settlement requires real VERIFIED payments',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement') ilike '%settlements cannot be fabricated%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement') ilike '%settlement.create%'
            then 'PASS' else 'FAIL - re-run migration 025 step 3' end

union all

-- A7. set_settlement_status gates PAID to super_admin + audits --------------------
select 'A7',
       'set_settlement_status gates PAID to super_admin + requires cancel reason',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_settlement_status') ilike '%only the academy founder (super_admin) can confirm settlement payouts%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_settlement_status') ilike '%settlement.status%'
            then 'PASS' else 'FAIL - re-run migration 025 step 4' end

union all

-- A8. instructor ledger strips student PII & scopes to caller ---------------------
select 'A8',
       'get_instructor_financial_ledger scopes to caller & excludes student PII',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'get_instructor_financial_ledger') ilike '%instructors can only view their own financial ledger%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'get_instructor_financial_ledger') not ilike '%pay.student_email%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'get_instructor_financial_ledger') not ilike '%pay.student_id%'
            then 'PASS' else 'FAIL - re-run migration 025 step 5' end

union all

-- A9. TRUTH check: settlements state (informational) ------------------------------
select 'A9',
       'settlements count (informational - starts empty)',
       (select count(*)::text from public.instructor_settlements) || ' settlement rows'

union all

-- A10. schema marker through 025 --------------------------------------------------
select 'A10',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%025%'
       then 'PASS' else 'FAIL' end

order by test;

-- ==============================================================================
-- PART B - Manual app-level matrix (after the migration is applied).
-- ==============================================================================
-- B1  SUPER ADMIN OVERVIEW (live app, founder): open Super Administration ->
--     "Academy Office" -> "Financial Overview & Settlements" sub-tab ->
--     truthful KPIs, instructor commission table, and empty settlements list.
-- B2  COMMISSION OVERRIDE (founder only): set a custom commission % on an
--     instructor row -> persists to profiles.platform_commission_pct and logs
--     'commission.instructor.set' in audit_logs.
-- B3  ZERO-FABRICATION SETTLEMENT GUARD: try creating a settlement for a date
--     range with 0 VERIFIED payments -> refused ("no VERIFIED payments found...").
-- B4  INSTRUCTOR LEDGER (read-only): open Instructor Dashboard ->
--     "Earnings & Ledger" tab -> shows truthful empty state (or real verified
--     earnings if payments were verified), zero edit/create buttons, zero
--     student emails/phones exposed.
-- ==============================================================================
