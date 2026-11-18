-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 029 Test (single query)
-- Run AFTER applying supabase/migrations/029_private_services_bookings.sql.
-- Every row must read PASS. Any FAIL = do not proceed.
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch runs - so Part A is ONE union-all query.
-- ==============================================================================

-- A1. private_service_bookings table + core columns exist -----------------------
select 'A1'::text as test,
       'private_service_bookings table + core columns exist'::text as assertion,
       case when exists (select 1 from information_schema.tables
                  where table_schema = 'public' and table_name = 'private_service_bookings')
             and (select count(*) from information_schema.columns
                  where table_schema = 'public' and table_name = 'private_service_bookings'
                    and column_name in ('service_id','slot_id','instructor_email','student_id',
                                        'student_email','booking_mode','scheduled_starts_at',
                                        'scheduled_ends_at','price_snapshot','currency',
                                        'payment_verified','payment_verified_at','session_link',
                                        'internal_room_ref','status','cancellation_reason')) = 16
            then 'PASS' else 'FAIL - re-run migration 029 step 1' end::text as result

union all

-- A2. active-slot unique partial index prevents double-booking ------------------
select 'A2',
       'unique active-slot guard index exists (uq_private_service_bookings_active_slot)',
       case when exists (select 1 from pg_indexes
                  where schemaname = 'public'
                    and tablename = 'private_service_bookings'
                    and indexname = 'uq_private_service_bookings_active_slot')
            then 'PASS' else 'FAIL - re-run migration 029 step 1' end

union all

-- A3. RLS enabled + exactly 1 SELECT policy + ZERO client write policies --------
select 'A3',
       'RLS enabled + SELECT-only policy (zero client write policies)',
       case when exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'private_service_bookings'
                    and c.relrowsecurity)
             and (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'private_service_bookings') = 1
             and not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'private_service_bookings'
                    and cmd in ('INSERT','UPDATE','DELETE','ALL'))
            then 'PASS' else 'FAIL - re-run migration 029 step 2' end

union all

-- A4. pay-first-then-confirm enforced by table constraint + trigger -------------
select 'A4',
       'pay-first-then-confirm enforced (constraint + trigger guard)',
       case when exists (select 1 from pg_constraint
                  where conrelid = 'public.private_service_bookings'::regclass
                    and conname = 'private_service_bookings_pay_first_check')
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_bookings_guard')
                 ilike '%pay-first rule - a booking cannot be CONFIRMED without a verified payment%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'office_confirm_private_service_booking')
                 ilike '%pay-first rule - verify payment before confirming%'
            then 'PASS' else 'FAIL - re-run migration 029 steps 1/4/8' end

union all

-- A5. both office_slot and student_proposed modes supported + slot lock ---------
select 'A5',
       'office_slot (FOR UPDATE lock) + student_proposed modes supported',
       case when exists (select 1 from pg_constraint
                  where conrelid = 'public.private_service_bookings'::regclass
                    and conname = 'private_service_bookings_mode_check'
                    and pg_get_constraintdef(oid) ilike '%office_slot%'
                    and pg_get_constraintdef(oid) ilike '%student_proposed%')
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'request_private_service_booking')
                 ilike '%for update%'
            then 'PASS' else 'FAIL - re-run migration 029 steps 1/6' end

union all

-- A6. venue readiness enforced + unconfirmed student reads mask venue links -----
select 'A6',
       'venue required on CONFIRMED + hidden from students before CONFIRMED',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_bookings_guard')
                 ilike '%requires a session_link before confirmation%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_bookings_guard')
                 ilike '%requires an internal_room_ref before confirmation%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_my_student_private_bookings')
                 ilike '%WHEN b.status IN (''CONFIRMED'', ''COMPLETED'') THEN b.session_link ELSE NULL%'
            then 'PASS' else 'FAIL - re-run migration 029 steps 4/6' end

union all

-- A7. booking history is permanent (DELETE forbidden) + cancel releases slot ----
select 'A7',
       'DELETE forbidden + cancellation requires reason and releases BOOKED slot',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_bookings_guard')
                 ilike '%booking history is permanent and cannot be deleted%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'cancel_my_private_service_booking')
                 ilike '%phenol.booking_flow%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'office_set_private_booking_status')
                 ilike '%phenol.booking_flow%'
            then 'PASS' else 'FAIL - re-run migration 029 steps 3/4/6/8' end

union all

-- A8. all 11 booking RPCs exist and are SECURITY DEFINER ------------------------
select 'A8',
       'all 11 booking RPCs exist (SECURITY DEFINER)',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in (
                      'list_published_private_services',
                      'list_open_private_service_slots',
                      'request_private_service_booking',
                      'cancel_my_private_service_booking',
                      'list_my_student_private_bookings',
                      'list_instructor_private_bookings',
                      'office_list_private_service_bookings',
                      'office_mark_private_booking_awaiting_payment',
                      'office_verify_private_booking_payment',
                      'office_confirm_private_service_booking',
                      'office_set_private_booking_status'
                    )
                    and p.prosecdef) = 11
            then 'PASS' else 'FAIL - re-run migration 029 steps 6-8' end

union all

-- A9. office booking RPCs are gated by is_secretary() / is_super_admin() --------
select 'A9',
       'all 5 office booking RPCs gated to the academy office',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in (
                      'office_list_private_service_bookings',
                      'office_mark_private_booking_awaiting_payment',
                      'office_verify_private_booking_payment',
                      'office_confirm_private_service_booking',
                      'office_set_private_booking_status'
                    )
                    and p.prosrc ilike '%is_secretary()%'
                    and p.prosrc ilike '%is_super_admin()%') = 5
            then 'PASS' else 'FAIL - re-run migration 029 step 8' end

union all

-- A10. instructor booking RPC gated by is_instructor() & excludes student PII ---
select 'A10',
       'list_instructor_private_bookings gated by is_instructor() and excludes student PII',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_instructor_private_bookings')
                 ilike '%is_instructor()%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_instructor_private_bookings')
                 not ilike '%student_phone%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'list_instructor_private_bookings')
                 not ilike '%b.student_email%'
            then 'PASS' else 'FAIL - re-run migration 029 step 7' end

union all

-- A11. guard and audit triggers bound to private_service_bookings ---------------
select 'A11',
       'guard + audit triggers bound to private_service_bookings',
       case when (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'private_service_bookings'
                    and t.tgname in ('trg_private_service_bookings_guard', 'trg_audit_private_service_bookings')
                    and not t.tgisinternal) = 2
            then 'PASS' else 'FAIL - re-run migration 029 steps 4/5' end

union all

-- A12. 028 slot guard still passes all 028 invariants ---------------------------
select 'A12',
       '028 slot guard invariants preserved alongside 029 booking flow release',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_slots_guard')
                 ilike '%can never be moved or reassigned%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_slots_guard')
                 ilike '%only the academy office can create bookable slots%'
            then 'PASS' else 'FAIL - re-run migration 029 step 3' end

union all

-- A13. TRUTH check: empty bookings table (informational) ------------------------
select 'A13',
       'booking rows (informational - empty is correct)',
       (select count(*)::text from public.private_service_bookings) || ' bookings ('
       || (select count(*)::text from public.private_service_bookings where status = 'CONFIRMED') || ' confirmed)'

union all

-- A14. schema marker through 029 ------------------------------------------------
select 'A14',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%029%'
       then 'PASS' else 'FAIL' end

order by test;

-- ==============================================================================
-- PART B - Manual app-level matrix (after the migration + UI deploy).
-- ==============================================================================
-- B1  STUDENT BOOKS OFFICE SLOT: log in as a student -> Dashboard -> "1:1 Private
--     Services" tab -> pick an active service -> pick an OPEN slot -> submit.
--     Booking appears as REQUESTED; the slot becomes BOOKED and disappears from
--     open slots so a second student cannot book it.
-- B2  STUDENT PROPOSES TIME: book again using a custom future date/time ->
--     booking appears as REQUESTED (student_proposed).
-- B3  PAY-FIRST ENFORCEMENT: as the office, try to confirm the booking BEFORE
--     verifying payment -> refused ("pay-first rule - verify payment before
--     confirming this booking").
-- B4  VERIFY & CONFIRM: as the office, verify payment with a receipt reference ->
--     provide a Zoom/Meet session link -> Confirm. Status becomes CONFIRMED and
--     the student now sees the "Join Session" link.
-- B5  CANCEL RELEASES SLOT: cancel a slot-backed booking (with a written reason)
--     -> slot returns to OPEN (if still in the future).
-- B6  AUDIT TRAIL: founder Audit Log tab shows private_booking.requested,
--     private_booking.payment_verified, private_booking.venue.set, and
--     private_booking.status.change.
-- ==============================================================================
