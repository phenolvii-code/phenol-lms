-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 024 Test (single query)
-- Run AFTER applying supabase/migrations/024_course_governance_pricing.sql.
-- Every row must read PASS. Any FAIL = do not proceed to 025.
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch runs - so Part A is ONE union-all query.
-- ==============================================================================

-- A1. course_price_history exists + RLS enabled ----------------------------------
select 'A1'::text as test,
       'course_price_history exists + RLS enabled'::text as assertion,
       case when exists (select 1 from information_schema.tables
                  where table_schema = 'public' and table_name = 'course_price_history')
             and exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'course_price_history' and c.relrowsecurity)
            then 'PASS' else 'FAIL - re-run migration 024 step 1' end::text as result

union all

-- A2. exactly ONE client policy (office read; no client writes) -------------------
select 'A2',
       'course_price_history policies = 1 (office SELECT only)',
       case when (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'course_price_history') = 1
             and exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'course_price_history'
                    and policyname = 'price history read office')
            then 'PASS' else 'FAIL - a write policy leaked onto course_price_history' end

union all

-- A3. automatic capture trigger bound to courses ----------------------------------
select 'A3',
       'trg_course_price_history bound to courses',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'courses'
                    and t.tgname = 'trg_course_price_history' and not t.tgisinternal)
            then 'PASS' else 'FAIL - re-run migration 024 step 2' end

union all

-- A4. governance RPCs exist + definer ----------------------------------------------
select 'A4',
       'set_course_approval / set_course_published / set_course_price / office_list_courses',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('set_course_approval','set_course_published',
                                      'set_course_price','office_list_courses')
                    and p.prosecdef) = 4
            then 'PASS' else 'FAIL - re-run migration 024 steps 3-6' end

union all

-- A5. RPCs office-gated + audit-logged ----------------------------------------------
select 'A5',
       'approval/publish/price RPCs gated to office + audited',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_course_approval') ilike '%is_secretary%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_course_approval') ilike '%course.approval%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_course_published') ilike '%course.publish%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_course_price') ilike '%course.price.set%'
            then 'PASS' else 'FAIL - re-run migration 024 steps 3/4/5' end

union all

-- A6. publish gate (no publishing past review) ---------------------------------------
select 'A6',
       'publish requires APPROVED status',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_course_published') ilike '%only APPROVED courses go live%'
            then 'PASS' else 'FAIL - re-run migration 024 step 4' end

union all

-- A7. instructors still cannot price (the 021 guard untouched) ------------------------
select 'A7',
       'trg_courses_pricing_guard still bound (instructors blocked)',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'courses'
                    and t.tgname = 'trg_courses_pricing_guard' and not t.tgisinternal)
            then 'PASS' else 'FAIL - the 021 pricing guard was disturbed' end

union all

-- A8. TRUTH check: pricing state (informational) ---------------------------------------
select 'A8',
       'priced courses / history rows (informational)',
       (select count(*)::text from public.courses where price is not null) || ' priced, '
       || (select count(*)::text from public.course_price_history) || ' history rows'

union all

-- A9. schema marker through 024 ---------------------------------------------------------
select 'A9',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%024%'
       then 'PASS' else 'FAIL' end

order by test;

-- ==============================================================================
-- PART B - Manual app-level matrix (after the migration is applied).
-- ==============================================================================
-- B1  OFFICE (live app, founder): open Super Administration -> "Academy Office"
--     tab -> all courses visible (APPROVED and PENDING alike) with their
--     pricing state. Set a real price on a real course -> works; the row shows
--     the price and a history row is captured.
--     Verify: select course_id, price, changed_by_email, changed_at
--             from public.course_price_history order by changed_at desc limit 5;
-- B2  INSTRUCTOR (live app): still CANNOT price (UI has no pricing input for
--     instructors; direct attempt is refused by the 021 guard).
-- B3  PUBLISH GATE: try publishing a PENDING course (set_course_published)
--     -> "cannot publish: course approval_status is PENDING...".
-- B4  AUDIT TRAIL: after office actions, audit_logs contains rows:
--     course.approval / course.publish / course.price.set with actor snapshot.
-- B5  PRICE HISTORY VIEWER: expand a course in the Office tab -> its history
--     rows appear (empty for never-priced courses = correct).
-- B6  RE-RUN check_database_state.sql -> PRICING rows OK + marker
--     "OK (through 024)".
-- ==============================================================================
