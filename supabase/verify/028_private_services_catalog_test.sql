-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 028 Test (single query)
-- Run AFTER applying supabase/migrations/028_private_services_catalog.sql.
-- Every row must read PASS. Any FAIL = do not proceed.
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch runs - so Part A is ONE union-all query.
-- ==============================================================================

-- A1. the catalog table exists with its core columns ------------------------------
select 'A1'::text as test,
       'private_services table + core columns exist'::text as assertion,
       case when (select count(*) from information_schema.columns
                  where table_schema = 'public' and table_name = 'private_services'
                    and column_name in ('instructor_email','title','duration_minutes',
                                        'delivery_mode','price','status','is_published'))
                = 7
            then 'PASS' else 'FAIL - re-run migration 028 step 1' end::text as result

union all

-- A2. slots table exists and is bound to the service ------------------------------
select 'A2',
       'private_service_slots exists with a service FK',
       case when exists (select 1 from information_schema.table_constraints tc
                  join information_schema.constraint_column_usage ccu
                    on ccu.constraint_name = tc.constraint_name
                   and ccu.table_schema = tc.table_schema
                  where tc.table_schema = 'public'
                    and tc.table_name = 'private_service_slots'
                    and tc.constraint_type = 'FOREIGN KEY'
                    and ccu.table_name = 'private_services')
            then 'PASS' else 'FAIL - re-run migration 028 step 2' end

union all

-- A3. RLS on, ZERO client write policies on both tables ---------------------------
select 'A3',
       'RLS enabled + no client write policies (both tables)',
       case when (select bool_and(relrowsecurity) from pg_class c
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public'
                    and c.relname in ('private_services','private_service_slots'))
             and not exists (select 1 from pg_policies
                  where schemaname = 'public'
                    and tablename in ('private_services','private_service_slots')
                    and cmd in ('INSERT','UPDATE','DELETE','ALL'))
            then 'PASS' else 'FAIL - a write policy leaked onto the catalog' end

union all

-- A4. instructors can NEVER price (trigger-enforced) ------------------------------
select 'A4',
       'price is office-only (trigger)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_services_guard')
                 ilike '%only the academy office can price a service%'
            then 'PASS' else 'FAIL - re-run migration 028 step 4' end

union all

-- A5. only legal status transitions -------------------------------------------------
select 'A5',
       'illegal status transitions refused',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_services_guard')
                 ilike '%illegal status transition%'
            then 'PASS' else 'FAIL - re-run migration 028 step 4' end

union all

-- A6. ACTIVE requires a positive price ----------------------------------------------
select 'A6',
       'ACTIVE requires a positive price',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_services_guard')
                 ilike '%an ACTIVE service needs a positive price%'
            then 'PASS' else 'FAIL - re-run migration 028 step 4' end

union all

-- A7. a BOOKED slot is locked, and only the office creates slots ---------------------
select 'A7',
       'BOOKED slots locked + office-only slot creation',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_slots_guard')
                 ilike '%can never be moved or reassigned%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_slots_guard')
                 ilike '%only the academy office can create bookable slots%'
            then 'PASS' else 'FAIL - re-run migration 028 step 5' end

union all

-- A8. the full RPC surface exists, all SECURITY DEFINER ----------------------------
select 'A8',
       'propose/update/price/status/slot RPCs exist (definer)',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('propose_private_service','update_my_private_service',
                                      'set_private_service_price','set_private_service_status',
                                      'create_private_service_slot','close_private_service_slot')
                    and p.prosecdef) = 6
            then 'PASS' else 'FAIL - re-run migration 028 steps 7-9' end

union all

-- A9. instructor RPCs are gated by is_instructor() (and the helper exists) ----------
select 'A9',
       'is_instructor() exists (definer) + gates instructor RPCs',
       case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'is_instructor' and p.prosecdef)
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'propose_private_service')
                 ilike '%is_instructor()%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'update_my_private_service')
                 ilike '%is_instructor()%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'update_my_private_service')
                 ilike '%belongs to another instructor%'
            then 'PASS' else 'FAIL - re-run migration 028 step 7 + 028b addendum' end

union all

-- A10. office RPCs are gated by is_secretary()/is_super_admin() ----------------------
select 'A10',
       'price/status/slot RPCs gated to the academy office',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('set_private_service_price','set_private_service_status',
                                      'create_private_service_slot','close_private_service_slot')
                    and p.prosrc ilike '%is_secretary%'
                    and p.prosrc ilike '%is_super_admin%') = 4
            then 'PASS' else 'FAIL - re-run migration 028 steps 8-9' end

union all

-- A11. the audit trigger is bound to the catalog ------------------------------------
select 'A11',
       'audit trigger bound to private_services',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'private_services'
                    and t.tgname = 'trg_audit_private_services'
                    and not t.tgisinternal)
            then 'PASS' else 'FAIL - re-run migration 028 step 6' end

union all

-- A12. 'internal' delivery mode is reserved from day one ----------------------------
select 'A12',
       'delivery_mode allows internal_link now + internal (future live server)',
       case when exists (select 1 from pg_constraint
                  where conrelid = 'public.private_services'::regclass
                    and conname = 'private_services_delivery_check'
                    and pg_get_constraintdef(oid) ilike '%external_link%'
                    and pg_get_constraintdef(oid) ilike '%internal%')
            then 'PASS' else 'FAIL - re-run migration 028 step 1' end

union all

-- A13. TRUTH check: empty catalog (informational) -----------------------------------
select 'A13',
       'catalog rows (informational - empty is correct)',
       (select count(*)::text from public.private_services) || ' services, '
       || (select count(*)::text from public.private_service_slots) || ' slots'

union all

-- A14. schema marker through 028 ----------------------------------------------------
select 'A14',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%028%'
       then 'PASS' else 'FAIL' end

order by test;

-- ==============================================================================
-- PART B - Manual app-level matrix (after the migration + UI deploy).
-- ==============================================================================
-- B1  INSTRUCTOR PROPOSES: log in as an instructor -> Dashboard -> the services
--     area -> propose a service (title/description/duration). It must appear as
--     PROPOSED and UNPRICED. There must be no price input anywhere for her.
-- B2  OFFICE PRICES: log in as the secretary -> Academy Office -> Private
--     Services -> set a price, then Activate. The service becomes visible and
--     shows the price. The audit viewer (founder) must show
--     private_service.proposed / .price.set / .status.change rows.
-- B3  INSTRUCTOR CANNOT PRICE: as the instructor, try to change the price via
--     the UI (no control) and, technically, the RPC call must fail with
--     "only the academy office can price a service".
-- B4  SLOTS: as the office, add one future slot to the active service; it must
--     show OPEN. Adding an overlapping slot must fail. Closing it must work.
-- B5  ARCHIVE: archive the service -> it disappears from any published list;
--     archived services keep their history (no deletes anywhere).
-- B6  RE-RUN check_database_state.sql -> PRIVATE SERVICE AUDIT rows OK + marker
--     "OK (through 028)".
-- ==============================================================================
