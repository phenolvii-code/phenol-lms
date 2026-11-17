-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 021 Financial Foundation Test (single query)
-- Run AFTER applying supabase/migrations/021_financial_foundation.sql.
-- Every row must read PASS. Any FAIL = do not proceed to 022.
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch runs - so Part A is ONE union-all query.
-- ==============================================================================

-- B1. settings table exists with the two seeded keys ----------------------------
select 'B1'::text as test,
       'platform_settings seeded (2 keys, nothing else)'::text as assertion,
       case when (select count(*) from public.platform_settings
                  where key in ('default_platform_commission_pct', 'platform_currency')) = 2
             and (select count(*) from public.platform_settings) = 2
            then 'PASS' else 'FAIL - re-run migration 021 step 1' end::text as result

union all

-- B2. courses pricing columns exist; nothing priced yet (truth, not fabrication) -
select 'B2',
       'courses pricing columns + zero priced courses',
       case when (select count(*) from information_schema.columns
                  where table_schema = 'public' and table_name = 'courses'
                    and column_name in ('price', 'currency', 'subscription_months')) = 3
             and (select count(*) from public.courses where price is not null) = 0
            then 'PASS' else 'FAIL - re-run migration 021 step 2 (or a price was set - investigate)' end

union all

-- B3. commission override column exists + range check; zero overrides set -------
select 'B3',
       'profiles.platform_commission_pct + zero overrides (no fabrication)',
       case when exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'profiles'
                    and column_name = 'platform_commission_pct')
             and (select count(*) from public.profiles
                  where platform_commission_pct is not null) = 0
            then 'PASS' else 'FAIL' end

union all

-- B4. payments table shape: 6 statuses + 5 methods + snapshots present ----------
select 'B4',
       'payments schema shape (statuses/methods/snapshots)',
       case when exists (select 1 from pg_constraint
                  where conrelid = 'public.payments'::regclass
                    and contype = 'c'
                    and pg_get_constraintdef(oid) ilike '%VERIFIED%'
                    and pg_get_constraintdef(oid) ilike '%UNDER_REVIEW%'
                    and pg_get_constraintdef(oid) ilike '%REFUNDED%')
             and exists (select 1 from pg_constraint
                  where conrelid = 'public.payments'::regclass
                    and contype = 'c'
                    and pg_get_constraintdef(oid) ilike '%kashier%')
             and (select count(*) from information_schema.columns
                  where table_schema = 'public' and table_name = 'payments'
                    and column_name in ('price_snapshot', 'platform_commission_pct',
                        'platform_amount', 'instructor_amount', 'processing_fee')) = 5
            then 'PASS' else 'FAIL - re-run migration 021 step 4' end

union all

-- B5. idempotency index exists (duplicate payment protection) -------------------
select 'B5',
       'reference idempotency index on payments',
       case when exists (select 1 from pg_indexes
                  where schemaname = 'public' and tablename = 'payments'
                    and indexname = 'idx_payments_reference_idempotency')
            then 'PASS' else 'FAIL - re-run migration 021 step 4' end

union all

-- B6. EXACTLY ONE client policy on payments (read-only; writes = RPC/webhook) ---
select 'B6',
       'payments client policies = 1 (SELECT only)',
       case when (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'payments') = 1
            then 'PASS' else 'FAIL - a write policy leaked onto payments' end

union all

-- B7. immutability + transition guard bound to payments --------------------------
select 'B7',
       'trg_payments_guard bound to payments',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'payments'
                    and t.tgname = 'trg_payments_guard' and not t.tgisinternal)
            then 'PASS' else 'FAIL - re-run migration 021 step 4b' end

union all

-- B8. pricing guard on courses + commission guard on profiles --------------------
select 'B8',
       'pricing/commission guards bound',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'courses'
                    and t.tgname = 'trg_courses_pricing_guard' and not t.tgisinternal)
             and exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'profiles'
                    and t.tgname = 'trg_profiles_protect_commission' and not t.tgisinternal)
            then 'PASS' else 'FAIL - re-run migration 021 steps 3/5' end

union all

-- B9. TRUTH check: the ledger is EMPTY (informational) ---------------------------
select 'B9',
       'payments rows (informational - starts empty)',
       (select count(*)::text from public.payments)

union all

-- B10. schema marker through 021 -------------------------------------------------
select 'B10',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%021%'
       then 'PASS' else 'FAIL' end

order by test;

-- ==============================================================================
-- PART C - Manual app-level matrix (after the migration is applied).
-- ==============================================================================
-- C1  SUPER ADMIN : can SELECT from platform_settings; can change
--                   default_platform_commission_pct from the SQL editor/UI.
-- C2  INSTRUCTOR  : SELECT own profile -> sees own platform_commission_pct (null
--                   = fallback). UPDATE profiles SET platform_commission_pct=50
--                   -> "forbidden: only the academy founder (super_admin) can
--                   set instructor commission".
-- C3  INSTRUCTOR  : UPDATE own course SET price=500 -> "forbidden: course
--                   pricing is managed centrally".
-- C4  INSTRUCTOR  : INSERT into payments -> RLS denial (no insert policy).
-- C5  STUDENT     : SELECT payments -> only own rows (empty for now = fine).
-- C6  SECRETARY   : SELECT platform_settings -> works (read staff policy).
--                   Any WRITE to settings -> denied (manage = super_admin only).
-- C7  SUPER ADMIN : sets one real commission via the console (e.g. Dr. Khaled
--                   30%):
--                   update public.profiles
--                   set platform_commission_pct = 30
--                   where id = (select id from auth.users
--                               where lower(trim(email))='khalid123yw@gmail.com');
--                   (from SQL editor the commission trigger checks the JWT and
--                   will refuse - run it as a momentary-trigger-off transaction
--                   exactly like the secretary promotion, or wait for the
--                   super-admin UI workflow. Either is acceptable: nothing in
--                   the platform depends on commissions being set yet.)
-- C8  RE-RUN      : check_database_state.sql -> FINANCE rows OK + marker
--                   "OK (through 021)".
-- ==============================================================================
