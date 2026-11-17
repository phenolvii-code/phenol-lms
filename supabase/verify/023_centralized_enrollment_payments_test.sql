-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 023 Test (single query)
-- Run AFTER applying supabase/migrations/023_centralized_enrollment_payments.sql.
-- Every row must read PASS. Any FAIL = do not proceed to 024.
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch runs - so Part A is ONE union-all query.
-- ==============================================================================

-- A1. enrollment RPCs gated to the office; instructor (owns_course) branch GONE -
select 'A1'::text as test,
       'admin_enroll_student + set_enrollment_status gated to office'::text as assertion,
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'admin_enroll_student') ilike '%is_secretary%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'admin_enroll_student') not ilike '%owns_course%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_enrollment_status') ilike '%is_secretary%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_enrollment_status') not ilike '%owns_course%'
            then 'PASS' else 'FAIL - re-run migration 023 steps 1/2' end::text as result

union all

-- A2. enrollment RPCs write audit rows ------------------------------------------------
select 'A2',
       'enrollment RPCs audit-logged (enrollment.direct / enrollment.status)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'admin_enroll_student') ilike '%enrollment.direct%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_enrollment_status') ilike '%enrollment.status%'
            then 'PASS' else 'FAIL - re-run migration 023 steps 1/2' end

union all

-- A3. the three payment RPCs exist + definer -------------------------------------------
select 'A3',
       'record_payment / set_payment_status / waive_enrollment_payment exist (definer)',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('record_payment','set_payment_status','waive_enrollment_payment')
                    and p.prosecdef) = 3
            then 'PASS' else 'FAIL - re-run migration 023 steps 3/4/5' end

union all

-- A4. payment RPCs audit-logged --------------------------------------------------------
select 'A4',
       'payment RPCs audit-logged (payment.record / payment.status / enrollment.waiver)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'record_payment') ilike '%payment.record%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_payment_status') ilike '%payment.status%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'waive_enrollment_payment') ilike '%enrollment.waiver%'
            then 'PASS' else 'FAIL - re-run migration 023 steps 3/4/5' end

union all

-- A5. subscription gate: VERIFIED payment auto-activates the enrollment ---------------
select 'A5',
       'VERIFIED payment auto-activates enrollment (subscription gate)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_payment_status') ilike '%course_enrollments%'
            then 'PASS' else 'FAIL - re-run migration 023 step 4' end

union all

-- A6. refund requires a written reason --------------------------------------------------
select 'A6',
       'REFUNDED requires a note (written reason)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_payment_status') ilike '%refund requires a written reason%'
            then 'PASS' else 'FAIL - re-run migration 023 step 4' end

union all

-- A7. waiver requires a written reason ---------------------------------------------------
select 'A7',
       'payment waiver requires a note',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'waive_enrollment_payment') ilike '%waiver requires a written reason%'
            then 'PASS' else 'FAIL - re-run migration 023 step 5' end

union all

-- A8. execution grants: the 5 RPCs granted to authenticated, revoked from public ------
select 'A8',
       'RPC grants (authenticated only)',
       case when (select count(*) from information_schema.role_routine_grants
                  where specific_schema = 'public'
                    and routine_name in ('admin_enroll_student','set_enrollment_status',
                                         'record_payment','set_payment_status','waive_enrollment_payment')
                    and grantee = 'authenticated') >= 5
            then 'PASS' else 'FAIL - re-run migration 023 grant statements' end

union all

-- A9. TRUTH check: ledger still EMPTY (informational) -----------------------------------
select 'A9',
       'payments / audit rows (informational)',
       (select count(*)::text from public.payments) || ' payments, '
       || (select count(*)::text from public.audit_logs) || ' audit rows'

union all

-- A10. schema marker through 023 ---------------------------------------------------------
select 'A10',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%023%'
       then 'PASS' else 'FAIL' end

order by test;

-- ==============================================================================
-- PART B - Manual app-level matrix (after the migration is applied).
-- ==============================================================================
-- B1  INSTRUCTOR (live app, instructor cockpit): try to enroll a student
--     (Roster tab -> "Enroll in Course") -> "forbidden: enrollment is
--     centralized..."  (NOTE: run this BEFORE pulling the UI change - after
--     the code push the button is gone for instructors; the RPC refusal is
--     the DB-level proof).
-- B2  INSTRUCTOR (live app): try to approve a pending access request
--     -> same refusal family ("enrollment decisions are centralized...").
-- B3  SUPER ADMIN (live app): direct-enroll a student into any course
--     -> WORKS (and writes an audit row).
--     Verify: select action, summary from public.audit_logs
--             where action = 'enrollment.direct' order by created_at desc limit 3;
-- B4  OFFICE FLOW (dry run, super admin, SQL Editor cannot call gated RPCs
--     without JWT - so run these from the live app as founder, or accept the
--     024/025 UI when it ships):
--       record_payment('<real student>', '<real course>', 'cash', 100)
--       -> payments row PENDING with snapshots; audit 'payment.record'.
--       set_payment_status(<id>, 'VERIFIED') -> verified_by/at stamped +
--       enrollment activated; audit 'payment.status'.
--     Then the full status path can be exercised: PENDING -> UNDER_REVIEW ->
--     VERIFIED. Test an illegal jump (PENDING -> VERIFIED) -> refused.
-- B5  DUPLICATE PROTECTION: record the same payment again with the same
--     reference -> "duplicate payment: this reference is already recorded...".
-- B6  WAIVER: waive_enrollment_payment('<student>', '<course>', 'scholarship
--     proof #...') -> enrollment ACTIVE + audit 'enrollment.waiver'.
--     Waiver with empty note -> refused.
-- B7  RE-RUN check_database_state.sql -> GOVERNANCE rows OK + marker
--     "OK (through 023)".
-- ==============================================================================
