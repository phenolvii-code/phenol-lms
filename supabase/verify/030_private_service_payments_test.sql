-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 030 Test (single query)
-- Run AFTER applying supabase/migrations/030_private_service_payments.sql.
-- Every row must read PASS. Any FAIL = do not proceed.
-- ==============================================================================

-- A1. private_service_payments table + core columns exist -----------------------
select 'A1'::text as test,
       'private_service_payments table + core columns exist'::text as assertion,
       case when exists (select 1 from information_schema.tables
                  where table_schema = 'public' and table_name = 'private_service_payments')
             and (select count(*) from information_schema.columns
                  where table_schema = 'public' and table_name = 'private_service_payments'
                    and column_name in ('booking_id','service_id','student_id','student_email',
                                        'instructor_email','method','gross_amount','currency',
                                        'status','reference','price_snapshot',
                                        'platform_commission_pct','platform_amount',
                                        'processing_fee','instructor_amount','settlement_id')) = 16
            then 'PASS' else 'FAIL - re-run migration 030 step 1' end::text as result

union all

-- A2. duplicate-ref + single-verified-per-booking unique indexes exist ----------
select 'A2',
       'duplicate-ref + single-verified-per-booking unique indexes exist',
       case when (select count(*) from pg_indexes
                  where schemaname = 'public'
                    and tablename = 'private_service_payments'
                    and indexname in (
                      'uq_private_service_payments_ref',
                      'uq_private_service_payments_verified_booking'
                    )) = 2
            then 'PASS' else 'FAIL - re-run migration 030 step 1' end

union all

-- A3. RLS enabled + SELECT-only policy (zero client write policies) -------------
select 'A3',
       'RLS enabled + SELECT-only policy (zero client write policies)',
       case when exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'private_service_payments'
                    and c.relrowsecurity)
             and (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'private_service_payments') = 1
             and not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'private_service_payments'
                    and cmd in ('INSERT','UPDATE','DELETE','ALL'))
            then 'PASS' else 'FAIL - re-run migration 030 step 2' end

union all

-- A4. immutability + refund-settlement guard + no deletes bound -----------------
select 'A4',
       'trg_private_service_payments_guard enforces immutability, no-delete, refund-block',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'private_service_payments'
                    and t.tgname = 'trg_private_service_payments_guard' and not t.tgisinternal)
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard')
                 ilike '%history is immutable - DELETE is forbidden%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard')
                 ilike '%cannot refund a payment linked to a settlement%'
            then 'PASS' else 'FAIL - re-run migration 030 step 3' end

union all

-- A5. audit + booking payment_verified auto-sync trigger bound ------------------
select 'A5',
       'trg_audit_private_service_payments logs to audit_logs + syncs booking payment_verified',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'private_service_payments'
                    and t.tgname = 'trg_audit_private_service_payments' and not t.tgisinternal)
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_audit_private_service_payments')
                 ilike '%private_payment.recorded%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_audit_private_service_payments')
                 ilike '%SET payment_verified = true%'
            then 'PASS' else 'FAIL - re-run migration 030 step 4' end

union all

-- A6. all 3 office private-payment RPCs exist, definer, and office-gated --------
select 'A6',
       'record/status/list private service payment RPCs + booking verify bridge (definer + office-gated)',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in (
                      'record_private_service_payment',
                      'set_private_service_payment_status',
                      'office_list_private_service_payments'
                    )
                    and p.prosecdef
                    and p.prosrc ilike '%is_secretary()%'
                    and p.prosrc ilike '%is_super_admin()%') = 3
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'office_verify_private_booking_payment')
                 ilike '%private_service_payments%'
            then 'PASS' else 'FAIL - re-run migration 030 step 5' end

union all

-- A7. create_instructor_settlement includes & stamps private_service_payments ---
select 'A7',
       'create_instructor_settlement includes & stamps private_service_payments',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement')
                 ilike '%private_service_payments%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement')
                 ilike '%for update%'
            then 'PASS' else 'FAIL - re-run migration 030 step 6' end

union all

-- A8. set_settlement_status(CANCELLED) unlinks private_service_payments ---------
select 'A8',
       'set_settlement_status(CANCELLED) unlinks private_service_payments',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_settlement_status')
                 ilike '%UPDATE public.private_service_payments%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_settlement_status')
                 ilike '%settlement_id = NULL%'
            then 'PASS' else 'FAIL - re-run migration 030 step 6' end

union all

-- A9. instructor ledger includes private_service_payments without student PII ---
select 'A9',
       'get_instructor_financial_ledger includes private_service_payments (PII-free)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'get_instructor_financial_ledger')
                 ilike '%private_service_payments%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'get_instructor_financial_ledger')
                 not ilike '%pp.student_email%'
            then 'PASS' else 'FAIL - re-run migration 030 step 7' end

union all

-- A10. super-admin overview aggregates private_service_payments -----------------
select 'A10',
       'get_super_admin_financial_overview aggregates private_service_payments',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'get_super_admin_financial_overview')
                 ilike '%private_service_payments%'
            then 'PASS' else 'FAIL - re-run migration 030 step 7' end

union all

-- A11. TRUTH check: empty private_service_payments ledger (informational) -------
select 'A11',
       'private service payment rows (informational - empty is correct)',
       (select count(*)::text from public.private_service_payments) || ' payments ('
       || (select count(*)::text from public.private_service_payments where status = 'VERIFIED') || ' verified)'

union all

-- A12. schema marker through 030 ------------------------------------------------
select 'A12',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%030%'
       then 'PASS' else 'FAIL' end

order by test;

-- ==============================================================================
-- PART B - Manual app-level matrix (after the migration + UI deploy).
-- ==============================================================================
-- B1  RECORD & VERIFY PRIVATE PAYMENT: in Academy Office -> Private Services ->
--     Payments Desk (030), record a payment for a REQUESTED/AWAITING_PAYMENT
--     booking with "Verify Now" -> booking automatically flips to
--     payment_verified = true and can now be confirmed with a session link.
-- B2  SETTLEMENT INTEGRATION: prepare an instructor settlement covering today ->
--     includes the verified private service payment, locks and stamps
--     settlement_id; refunding that payment is refused until settlement cancel.
-- B3  INSTRUCTOR LEDGER: log in as the instructor -> Earnings & Settlement
--     Ledger -> shows the combined verified gross/net and PII-free private
--     service payment row.
-- ==============================================================================
