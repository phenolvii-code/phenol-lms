-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 026 Test (single query)
-- Run AFTER applying supabase/migrations/026_office_integrity.sql.
-- Every row must read PASS. Any FAIL = do not proceed.
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch runs - so Part A is ONE union-all query.
-- ==============================================================================

-- A1. payments.settlement_id exists (payout linkage) ------------------------------
select 'A1'::text as test,
       'payments.settlement_id linkage column exists'::text as assertion,
       case when exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'payments'
                    and column_name = 'settlement_id')
            then 'PASS' else 'FAIL - re-run migration 026 step 1' end::text as result

union all

-- A2. one active settlement per instructor + period -------------------------------
select 'A2',
       'unique active-period guard index exists',
       case when exists (select 1 from pg_indexes
                  where schemaname = 'public'
                    and tablename = 'instructor_settlements'
                    and indexname = 'uq_settlements_instructor_period_active')
            then 'PASS' else 'FAIL - re-run migration 026 step 1' end

union all

-- A3. settlements only pay UNSETTLED payments, lock them, and stamp the link ------
select 'A3',
       'settlement creation: unsettled-only + row locks + settlement_id stamp',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement')
                 ilike '%settlement_id is null%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement')
                 ilike '%for update%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement')
                 ilike '%set settlement_id = v_settlement_id%'
            then 'PASS' else 'FAIL - re-run migration 026 step 3' end

union all

-- A4. duplicate active period is refused ------------------------------------------
select 'A4',
       'duplicate active settlement period refused with a readable error',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement')
                 ilike '%an active settlement already exists%'
            then 'PASS' else 'FAIL - re-run migration 026 step 3' end

union all

-- A5. mixed currencies are refused -------------------------------------------------
select 'A5',
       'mixed-currency settlement refused',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement')
                 ilike '%mixed currencies%'
            then 'PASS' else 'FAIL - re-run migration 026 step 3' end

union all

-- A6. refund is blocked while a payment is in a settlement ------------------------
select 'A6',
       'refund blocked on settled payments',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_payment_status')
                 ilike '%linked to a settlement%'
            then 'PASS' else 'FAIL - re-run migration 026 step 5' end

union all

-- A7. cancelling a settlement unlinks its payments ---------------------------------
select 'A7',
       'settlement cancellation unlinks payments',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_settlement_status')
                 ilike '%settlement_id = null%'
            then 'PASS' else 'FAIL - re-run migration 026 step 4' end

union all

-- A8. office read RPCs exist, definer, office-gated --------------------------------
select 'A8',
       'office_list_payments + office_list_enrollment_queue (definer + office gate)',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('office_list_payments', 'office_list_enrollment_queue')
                    and p.prosecdef
                    and p.prosrc ilike '%is_secretary%') = 2
            then 'PASS' else 'FAIL - re-run migration 026 steps 6/7' end

union all

-- A9. payments still has ZERO client write policies --------------------------------
select 'A9',
       'payments has no client write policies (definer paths only)',
       case when not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'payments'
                    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL'))
            then 'PASS' else 'FAIL - a write policy leaked onto payments' end

union all

-- A10. TRUTH check: settlement coverage (informational) ----------------------------
select 'A10',
       'settled / unsettled verified payments (informational)',
       (select count(*)::text from public.payments where status = 'VERIFIED' and settlement_id is not null)
       || ' settled, '
       || (select count(*)::text from public.payments where status = 'VERIFIED' and settlement_id is null)
       || ' unsettled'

union all

-- A11. schema marker through 026 ----------------------------------------------------
select 'A11',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%026%'
       then 'PASS' else 'FAIL' end

order by test;

-- ==============================================================================
-- PART B - Manual app-level matrix (after the migration + UI deploy).
-- ==============================================================================
-- B1  OFFICE/secretary can SEE the queue: log in as the secretary account ->
--     Academy Office -> Enrollment Queue. Pending requests must be visible
--     (before 026 the list was silently empty for her).
-- B2  OFFICE/secretary can SEE payments: Payments Desk lists the real ledger.
-- B3  DOUBLE-PAY GUARD (the critical one): on a test instructor with verified
--     payments, prepare a settlement for a period -> PENDING. Immediately try
--     the same period again -> must fail with "an active settlement already
--     exists...". Try an overlapping period that only contains those same
--     payments -> must fail with "no UNSETTLED verified payments...".
-- B4  REFUND GUARD: try to refund a payment already inside a PENDING
--     settlement -> must fail with "linked to a settlement".
-- B5  CANCEL RELEASES: cancel the PENDING settlement (written reason) -> the
--     payments become unsettled again, and a corrected settlement can be made.
--     Then the refund from B4 becomes possible again (its own written reason).
-- B6  PAID IS FINAL: mark a settlement PAID (super admin only) -> it can never
--     be cancelled or edited, and its payments can never be refunded.
-- B7  RE-RUN check_database_state.sql -> OFFICE AUDIT rows OK + marker
--     "OK (through 026)".
-- ==============================================================================
