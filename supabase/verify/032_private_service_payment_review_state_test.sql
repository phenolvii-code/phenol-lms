-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 032 Test (single query)
-- Run AFTER applying supabase/migrations/032_private_service_payment_review_state.sql.
-- Every row must read PASS. Any FAIL = do not proceed.
-- WHY SINGLE QUERY: the Supabase SQL Editor shows only the LAST statement's
-- result set when a batch runs - so Part A is ONE union-all query.
-- ==============================================================================

-- A1. Guard allows VERIFIED -> UNDER_REVIEW (cancel holds the money) -----------
select 'A1'::text as test,
       'guard: VERIFIED -> UNDER_REVIEW is legal'::text as assertion,
       case when (select strpos(p.prosrc, '(OLD.status = ''VERIFIED'' AND NEW.status IN (''UNDER_REVIEW'', ''REFUNDED''))')
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard') > 0
            then 'PASS' else 'FAIL - re-run migration 032 step 1' end::text as result

union all

-- A2. Guard splits UNDER_REVIEW by verified_at (held -> REFUNDED/VERIFIED; unverified -> VERIFIED/FAILED/CANCELLED) and preserves 031 dead-booking guard
select 'A2',
       'guard: UNDER_REVIEW split by verified_at, held blocks FAILED/CANCELLED, unverified blocks REFUNDED, dead-booking guard intact',
       case when (select strpos(p.prosrc, '(OLD.status = ''UNDER_REVIEW'' AND OLD.verified_at IS NULL AND NEW.status IN (''VERIFIED'', ''FAILED'', ''CANCELLED''))')
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard') > 0
             and (select strpos(p.prosrc, '(OLD.status = ''UNDER_REVIEW'' AND OLD.verified_at IS NOT NULL AND NEW.status IN (''VERIFIED'', ''REFUNDED''))')
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard') > 0
             and (select strpos(p.prosrc, 'a held payment that was already verified cannot move to % - refund it with a written reason instead')
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard') > 0
             and (select strpos(p.prosrc, 'an unverified payment under review cannot be refunded')
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard') > 0
             and (select strpos(p.prosrc, 'cancelled or no-show booking')
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard') > 0
            then 'PASS' else 'FAIL - re-run migration 032 step 1' end

union all

-- A3. Settled payments can never be demoted (trigger level) --------------------
select 'A3',
       'guard: status change blocked on a settled payment',
       case when (select strpos(p.prosrc, 'cannot change the status of a payment linked to a settlement')
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard') > 0
            then 'PASS' else 'FAIL - re-run migration 032 step 1' end

union all

-- A4. Status RPC: split review transitions + held/unverified blocks + written reason + settlement & dead-booking guards
select 'A4',
       'set_private_service_payment_status: split review exits, held FAILED/CANCELLED block, unverified REFUNDED block, reasons, settlement & dead-booking guards',
       case when (select strpos(p.prosrc, 'illegal private service payment transition') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(p.prosrc, 'moving a verified payment back to review requires a written reason')
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(p.prosrc, 'a refund requires a written reason (note)') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(p.prosrc, 'cannot change the status of a payment linked to a settlement')
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(p.prosrc, 'cannot mark a held verified payment as % - refund it with a written reason instead')
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(p.prosrc, 'cannot refund an unverified payment under review')
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(p.prosrc, 'v_row.verified_at IS NULL AND v_target IN (''VERIFIED'', ''FAILED'', ''CANCELLED'')')
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(p.prosrc, 'v_row.verified_at IS NOT NULL AND v_target IN (''VERIFIED'', ''REFUNDED'')')
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(p.prosrc, 'cannot verify a payment for a ')
                  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
            then 'PASS' else 'FAIL - re-run migration 032 step 3' end

union all

-- A5. Office cancellation demotes VERIFIED payments to UNDER_REVIEW ------------
select 'A5',
       'office_set_private_booking_status: cancel demotes verified payments to UNDER_REVIEW',
       case when (select strpos(p.prosrc, 'booking cancelled - payment held for a refund decision')
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'office_set_private_booking_status') > 0
             and (select strpos(p.prosrc, 'SET status = ''UNDER_REVIEW''')
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'office_set_private_booking_status') > 0
            then 'PASS' else 'FAIL - re-run migration 032 step 4' end

union all

-- A6. Office cancellation refuses when the payment is already settled ---------
select 'A6',
       'office_set_private_booking_status: refuses cancellation when the payment is settled',
       case when (select strpos(p.prosrc, 'the verified payment is already linked to a settlement')
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'office_set_private_booking_status') > 0
            then 'PASS' else 'FAIL - re-run migration 032 step 4' end

union all

-- A7. Student bookings RPC exposes derived payment_state with ACTIVE > IN_REVIEW > REFUNDED priority
select 'A7',
       'list_my_student_private_bookings returns payment_state (ACTIVE > IN_REVIEW > REFUNDED)',
       case when exists (
              select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'list_my_student_private_bookings'
                and p.pronargs = 0
                and pg_get_function_result(p.oid) ilike '%payment_state%'
                and strpos(p.prosrc, '''VERIFIED''') > 0
                and strpos(p.prosrc, '''UNDER_REVIEW''') > strpos(p.prosrc, '''VERIFIED''')
                and strpos(p.prosrc, '''REFUNDED''') > strpos(p.prosrc, '''UNDER_REVIEW''')
            )
            then 'PASS' else 'FAIL - re-run migration 032 step 5' end

union all

-- A8. Every newly verified payment refreshes the booking receipt --------------
select 'A8',
       'audit trigger refreshes booking reference on every VERIFIED payment',
       case when (select strpos(p.prosrc, 'payment_reference = coalesce') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_audit_private_service_payments') > 0
             and (select strpos(p.prosrc, 'AND NOT payment_verified') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_audit_private_service_payments') = 0
            then 'PASS' else 'FAIL - re-run migration 032 step 2' end

union all

-- A9. Grants intact, zero client write policies --------------------------------
select 'A9',
       'student RPC executable by authenticated only; zero write policies on both tables',
       case when has_function_privilege('authenticated',
                  'public.list_my_student_private_bookings()', 'EXECUTE')
             and not has_function_privilege('anon',
                  'public.list_my_student_private_bookings()', 'EXECUTE')
             and not exists (select 1 from pg_policies
                             where schemaname = 'public'
                               and tablename in ('private_service_bookings', 'private_service_payments')
                               and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL'))
            then 'PASS' else 'FAIL - re-run migration 032 step 5' end

union all

-- A10. Schema marker through 032 ----------------------------------------------
select 'A10',
       'schema marker',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%032%'
       then 'PASS' else 'FAIL' end

union all

-- A11. TRUTH check: review-state rows (informational) -------------------------
select 'A11',
       'bookings / verified / under review / refunded (informational)',
       (select count(*)::text from public.private_service_bookings) || ' bookings, '
       || (select count(*)::text from public.private_service_payments where status = 'VERIFIED') || ' verified, '
       || (select count(*)::text from public.private_service_payments where status = 'UNDER_REVIEW') || ' under review, '
       || (select count(*)::text from public.private_service_payments where status = 'REFUNDED') || ' refunded'

order by test;

-- ==============================================================================
-- PART B - Manual app-level matrix (after the migration + UI deploy).
-- ==============================================================================
--
-- B1  CANCEL A PAID BOOKING (office): Bookings Desk -> cancel a booking whose
--     payment is VERIFIED with a written reason -> the payment flips to
--     UNDER_REVIEW, "booking cancelled - payment held for a refund decision" is
--     appended to its note, and the audit log shows the status change.
--     The payment must NOT appear in any settlement or instructor earnings.
-- B2  STUDENT VIEW: the same booking shows "Payment under review" (not
--     "Payment Verified") in the 1:1 Private Services tab.
-- B3  REFUND FROM REVIEW: Payments Desk -> Refund the UNDER_REVIEW payment with
--     a written reason -> REFUNDED; student view then reads "Refunded".
-- B4  SETTLEMENT SAFETY: create a settlement covering that payment, then try to
--     cancel the booking -> refused ("the verified payment is already linked to
--     a settlement - cancel the settlement first").
-- B5  NO_SHOW STAYS PAID: mark a confirmed paid booking NO_SHOW -> its payment
--     stays VERIFIED (no automatic demotion), as decided.
-- B6  REPLACEMENT RECEIPT: refund a payment, record + verify a new one -> the
--     booking reference/verified_at show the NEW receipt (not the old one).
-- B7  HELD PAYMENT GUARD (UI + DB): on the cancelled booking from B1, Payments
--     Desk shows `booking: CANCELLED`, `held (verified payment)` badge, the
--     written note, and ONLY the `Refund` button (Verify/Fail/Cancel hidden).
--     Any direct RPC attempt to set FAILED or CANCELLED on that held payment
--     is rejected ("cannot mark a held verified payment as ... - refund it with
--     a written reason instead"); VERIFIED is rejected by 031 dead-booking guard.
-- B8  INITIAL REVIEW EXITS: record an unverified payment (verifyNow=false),
--     click Review (PENDING -> UNDER_REVIEW, verified_at IS NULL) -> Payments
--     Desk shows Verify/Fail/Cancel (and hides Refund); direct RPC attempt to
--     REFUNDED is rejected ("cannot refund an unverified payment under review").
-- B9  STUDENT IN_REVIEW PRIORITY OVER REFUNDED: after a booking has a REFUNDED
--     payment, record a replacement payment and move it to UNDER_REVIEW ->
--     student tab displays "Payment under review" (IN_REVIEW), NOT "Refunded",
--     and Bookings Desk hides Step 1 Verify Payment with a Payments Desk notice.
-- ==============================================================================
