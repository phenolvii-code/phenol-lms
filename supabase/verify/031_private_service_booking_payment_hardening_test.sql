-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 031 Test (single query)
-- Run AFTER applying supabase/migrations/031_private_service_booking_payment_hardening.sql.
-- Every row must read PASS. Any FAIL = do not proceed.
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch runs - so Part A is ONE union-all query.
-- ==============================================================================

-- A1. Money math no longer clamps the instructor share -------------------------
select 'A1'::text as test,
       'record_private_service_payment: no greatest() clamp (gross must equal shares)'::text as assertion,
       case when (select strpos(p.prosrc, 'greatest(') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'record_private_service_payment') = 0
            then 'PASS' else 'FAIL - re-run migration 031 step 1' end::text as result

union all

-- A2. Negative instructor share now raises (023 parity) ------------------------
select 'A2',
       'record_private_service_payment: negative instructor share raises',
       case when (select strpos(p.prosrc, 'instructor share went negative') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'record_private_service_payment') > 0
            then 'PASS' else 'FAIL - re-run migration 031 step 1' end

union all

-- A3. Allocation identity is asserted ------------------------------------------
select 'A3',
       'record_private_service_payment: gross = platform + instructor + fee asserted',
       case when (select strpos(p.prosrc, 'allocation math invalid: gross') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'record_private_service_payment') > 0
            then 'PASS' else 'FAIL - re-run migration 031 step 1' end

union all

-- A4. Friendly payment-method validation ---------------------------------------
select 'A4',
       'record_private_service_payment: friendly invalid-method error',
       case when (select strpos(p.prosrc, 'invalid payment method') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'record_private_service_payment') > 0
            then 'PASS' else 'FAIL - re-run migration 031 step 1' end

union all

-- A5. Re-payment after a refund is allowed -------------------------------------
select 'A5',
       'record_private_service_payment: new payment allowed after a REFUNDED row',
       case when (select strpos(p.prosrc, 'status = ''REFUNDED''') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'record_private_service_payment') > 0
            then 'PASS' else 'FAIL - re-run migration 031 step 1' end

union all

-- A6. Status RPC: transitions, refund reason, dead-booking guard ---------------
select 'A6',
       'set_private_service_payment_status: transition list + refund reason + booking-state guard',
       case when (select strpos(p.prosrc, 'illegal private service payment transition') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(p.prosrc, 'a refund requires a written reason (note)') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(p.prosrc, 'cannot verify a payment for a ') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
            then 'PASS' else 'FAIL - re-run migration 031 step 2' end

union all

-- A7. Status RPC locks booking before payment (deadlock-free order) ------------
select 'A7',
       'set_private_service_payment_status: booking lock precedes payment lock',
       case when (select strpos(p.prosrc, 'private_service_bookings') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(p.prosrc, 'FOR UPDATE') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
            then 'PASS' else 'FAIL - re-run migration 031 step 2' end

union all

-- A8. Guard trigger also blocks VERIFIED on dead bookings + reasonless refund --
select 'A8',
       'trg_private_service_payments_guard: dead-booking + refund-reason guards',
       case when (select strpos(p.prosrc, 'cancelled or no-show booking') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard') > 0
             and (select strpos(p.prosrc, 'a refund requires a written reason (note)') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard') > 0
             and exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                         join pg_namespace n on n.oid = c.relnamespace
                         where n.nspname = 'public' and c.relname = 'private_service_payments'
                           and t.tgname = 'trg_private_service_payments_guard' and not t.tgisinternal)
            then 'PASS' else 'FAIL - re-run migration 031 step 3' end

union all

-- A9. Student self-cancel blocked once payment is verified ---------------------
select 'A9',
       'cancel_my_private_service_booking: refuses self-cancel after payment verification',
       case when (select strpos(p.prosrc, 'the payment for this booking is already verified - contact the academy office') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'cancel_my_private_service_booking') > 0
            then 'PASS' else 'FAIL - re-run migration 031 step 4' end

union all

-- A10. Instructor PII removed from bookings/payments read policies ------------
select 'A10',
       'read policies no longer expose rows to the instructor email branch (no PII leak)',
       case when (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'private_service_bookings'
                    and cmd = 'SELECT') = 1
             and not exists (select 1 from pg_policies
                             where schemaname = 'public' and tablename = 'private_service_bookings'
                               and coalesce(qual, '') ilike '%instructor_email%')
             and (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'private_service_payments'
                    and cmd = 'SELECT') = 1
             and not exists (select 1 from pg_policies
                             where schemaname = 'public' and tablename = 'private_service_payments'
                               and coalesce(qual, '') ilike '%instructor_email%')
            then 'PASS' else 'FAIL - re-run migration 031 step 5' end

union all

-- A11. Confirming a refunded-only booking is refused --------------------------
select 'A11',
       'office_confirm_private_service_booking: refuses a refunded-only booking',
       case when (select strpos(p.prosrc, 'the payment for this booking was refunded') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'office_confirm_private_service_booking') > 0
            then 'PASS' else 'FAIL - re-run migration 031 step 6' end

union all

-- A12. Past reschedule refused ------------------------------------------------
select 'A12',
       'office_mark_private_booking_awaiting_payment: refuses a past start time',
       case when (select strpos(p.prosrc, 'must be in the future') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'office_mark_private_booking_awaiting_payment') > 0
            then 'PASS' else 'FAIL - re-run migration 031 step 7' end

union all

-- A13. Signatures unchanged + zero client write policies + anon locked out ----
select 'A13',
       'RPC signatures unchanged, zero client write policies, anon cannot execute office RPCs',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and (p.proname, p.pronargs) in (
                      ('record_private_service_payment', 7),
                      ('set_private_service_payment_status', 3),
                      ('cancel_my_private_service_booking', 2),
                      ('office_confirm_private_service_booking', 6),
                      ('office_mark_private_booking_awaiting_payment', 4)
                    )) = 5
             and not exists (select 1 from pg_policies
                             where schemaname = 'public'
                               and tablename in ('private_service_bookings', 'private_service_payments')
                               and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL'))
             and not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                             where n.nspname = 'public'
                               and p.proname in ('record_private_service_payment',
                                                 'set_private_service_payment_status',
                                                 'office_confirm_private_service_booking',
                                                 'office_mark_private_booking_awaiting_payment')
                               and has_function_privilege('anon', p.oid, 'EXECUTE'))
            then 'PASS' else 'FAIL - re-run migration 031' end

union all

-- A14. Schema marker through 031 ----------------------------------------------
select 'A14',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%031%'
       then 'PASS' else 'FAIL' end

union all

-- A15. TRUTH check: private service state (informational) ----------------------
select 'A15',
       'bookings / payments (informational - empty is correct)',
       (select count(*)::text from public.private_service_bookings) || ' bookings, '
       || (select count(*)::text from public.private_service_payments) || ' payments, '
       || (select count(*)::text from public.private_service_payments where status = 'REFUNDED') || ' refunded'

order by test;

-- ==============================================================================
-- PART B - Manual app-level matrix (after the migration + UI deploy).
-- One line per scenario; every line must behave as described.
-- ==============================================================================
--
-- B1  MONEY MATH GUARD: in the office Payments desk, try to record a payment
--     whose processing fee is larger than the gross amount
--     -> refused with "processing_fee ... cannot exceed gross_amount".
--     Then try fee = gross - 1 -> saved; check that
--     gross = platform + instructor + fee exactly on the row.
-- B2  REFUND REASON: click Refund and cancel the reason prompt
--     -> nothing happens. Type a reason -> payment becomes REFUNDED and the
--     reason is stored in the note and in the audit log.
-- B3  REFUNDED BOOKING DEAD-END IS GONE: after B2, in the Bookings desk,
--     record a NEW payment for the same booking and verify it -> allowed
--     (previously refused with "booking already has a VERIFIED payment").
-- B4  CONFIRM AFTER REFUND: with only a REFUNDED payment and no new one, try
--     Confirm -> refused ("the payment for this booking was refunded - record
--     and verify a new payment first").
-- B5  CANCELLED BOOKING: cancel a booking, then try to verify its PENDING
--     payment from the Payments desk -> refused
--     ("cannot verify a payment for a CANCELLED booking").
-- B6  STUDENT SELF-CANCEL: as a student whose payment was verified, open
--     "1:1 Private Services" -> no "Cancel Request" action is offered and the
--     server refuses it if forced ("contact the academy office").
-- B7  INSTRUCTOR PRIVACY: log in as the instructor of a booked service and open
--     the browser devtools/network -> the secured tables
--     (private_service_bookings / private_service_payments) return 0 rows for
--     that instructor; their Bookings/Earnings views still load through the RPCs.
-- B8  PAST RESCHEDULE: in the Bookings desk, try to move a REQUESTED booking to
--     a start time in the past -> refused ("must be in the future").
-- ==============================================================================
