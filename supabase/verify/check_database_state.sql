-- ==============================================================================
-- PHENOL ACADEMY LMS - Full Database State Verification
-- Purpose: one-glance checklist that every migration (000 → 017) actually
--          exists in THIS database. Run after any migration or backup restore.
-- Result: rows with status OK / MISSING. Expected: every row OK.
-- ==============================================================================

-- 1. Core tables ---------------------------------------------------------------
select 'TABLE' as kind, name as item,
       case when exists (select 1 from information_schema.tables
         where table_schema = 'public' and table_name = name) then 'OK' else 'MISSING' end as status
from (values
  ('courses'), ('lessons'), ('lesson_assets'), ('profiles'),
  ('registered_students'), ('course_enrollments'), ('referrals'),
  ('quizzes'), ('quiz_submissions'), ('instructor_requests'),
  ('lesson_progress'), ('lesson_comments'), ('media_access_log'),
  ('booklets'), ('instructor_profiles'), ('question_bank_items'),
  ('payments'), ('platform_settings'), ('audit_logs'),
  ('course_price_history'), ('instructor_settlements'),
  ('private_services'), ('private_service_slots'),
  ('private_service_bookings'), ('private_service_payments')
) as t(name)

union all

-- 2. Core functions ------------------------------------------------------------
select 'FUNCTION', name,
       case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = name) then 'OK' else 'MISSING' end
from (values
  ('is_admin'), ('is_super_admin'), ('is_instructor'), ('owns_course'), ('has_active_enrollment'),
  ('handle_new_auth_user'), ('generate_academic_code'),
  ('get_lesson_media'), ('set_course_approval'),
  ('submit_instructor_request'), ('decide_instructor_request'),
  ('get_course_quiz_metadata'), ('get_quiz_questions'), ('submit_quiz_attempt'),
  ('list_instructor_quizzes'), ('get_quiz_for_editing'), ('save_quiz'), ('delete_quiz'),
  ('can_download_booklet'),
  ('get_instructor_reviews'), ('get_review_stats'), ('admin_delete_student_account'),
  ('admin_set_user_role'), ('is_secretary'),
  ('trg_protect_commission_pct'), ('trg_pricing_guard'), ('trg_payments_guard'),
  ('log_academy_action'), ('trg_audit_logs_guard'), ('trg_audit_role_change'),
  ('trg_audit_logs_guard_statement'),
  ('record_payment'), ('set_payment_status'), ('waive_enrollment_payment'),
  ('set_course_price'), ('set_course_published'), ('office_list_courses'),
  ('trg_capture_price_history'),
  ('trg_settlements_guard'), ('set_instructor_commission'),
  ('set_default_platform_commission'), ('create_instructor_settlement'),
  ('set_settlement_status'), ('get_instructor_financial_ledger'),
  ('get_super_admin_financial_overview'),
  ('office_list_payments'), ('office_list_enrollment_queue'),
  ('founder_list_audit_logs'),
  ('can_read_private_service'), ('propose_private_service'),
  ('update_my_private_service'), ('set_private_service_price'),
  ('set_private_service_status'), ('create_private_service_slot'),
  ('close_private_service_slot'), ('office_list_private_services'),
  ('list_my_private_services'), ('office_list_private_service_slots'),
  ('trg_private_services_guard'), ('trg_private_service_slots_guard'),
  ('trg_audit_private_services'),
  ('trg_private_service_bookings_guard'), ('trg_audit_private_service_bookings'),
  ('list_published_private_services'), ('list_open_private_service_slots'),
  ('request_private_service_booking'), ('cancel_my_private_service_booking'),
  ('list_my_student_private_bookings'), ('list_instructor_private_bookings'),
  ('office_list_private_service_bookings'), ('office_mark_private_booking_awaiting_payment'),
  ('office_verify_private_booking_payment'), ('office_confirm_private_service_booking'),
  ('office_set_private_booking_status'),
  ('trg_private_service_payments_guard'), ('trg_audit_private_service_payments'),
  ('record_private_service_payment'), ('set_private_service_payment_status'),
  ('office_list_private_service_payments')
) as t(name)

union all

-- 3. Registration trigger ------------------------------------------------------
select 'TRIGGER', 'on_auth_user_created on auth.users',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
         join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'auth' and c.relname = 'users'
           and t.tgname = 'on_auth_user_created' and not t.tgisinternal)
       then 'OK' else 'MISSING' end

union all

-- 4. RLS policies (exact names matter) -----------------------------------------
select 'POLICY', tablename_ref || ' -> ' || policyname_ref,
       case when exists (select 1 from pg_policies
         where schemaname = 'public' and tablename = tablename_ref and policyname = policyname_ref)
       then 'OK' else 'MISSING' end
from (values
  ('quizzes', 'quizzes read'),
  ('quizzes', 'quizzes owner manage'),
  ('quiz_submissions', 'submissions read own or course owner'),
  ('waitlist_applications', 'waitlist read scoped'),
  ('instructor_requests', 'requests read own or super admin'),
  ('instructor_requests', 'requests insert own pending'),
  ('booklets', 'booklets read'),
  ('booklets', 'booklets manage'),
  ('instructor_profiles', 'instructor profiles read'),
  ('instructor_profiles', 'instructor profiles manage own'),
  ('question_bank_items', 'question banks read'),
  ('question_bank_items', 'question banks manage'),
  ('payments', 'payments read own or course owner'),
  ('platform_settings', 'settings read staff'),
  ('platform_settings', 'settings manage super_admin'),
  ('audit_logs', 'audit logs read super_admin'),
  ('course_price_history', 'price history read office'),
  ('instructor_settlements', 'settlements read own or office'),
  ('student_notifications', 'notifications admin manage'),
  ('instructor_reviews', 'reviews read involved'),
  ('instructor_reviews', 'reviews insert enrolled'),
  ('private_service_bookings', 'private service bookings read'),
  ('private_service_payments', 'private service payments read')
) as t(tablename_ref, policyname_ref)

union all

-- 4b. Storage policies (bucket `booklets` is private + download-gated) ----------
select 'POLICY (storage)', 'booklets -> ' || policyname_ref,
       case when exists (select 1 from pg_policies
         where schemaname = 'storage' and tablename = 'objects' and policyname = policyname_ref)
       then 'OK' else 'MISSING' end
from (values
  ('booklets download gated'),
  ('booklets manage super_admin')
) as t(policyname_ref)

union all

-- 5. Answer-key column must be readable by NOBODY (anon/authenticated) ---------
--    Expected value: 0 → shows OK. Only SELECT counts: the table keeps
--    INSERT/UPDATE grants (expanded per-column by this view), and those are
--    NOT a read leak — only SELECT is.
select 'COLUMN SECURITY', 'quizzes.questions hidden from clients',
       case when not exists (select 1 from information_schema.column_privileges
         where table_schema = 'public' and table_name = 'quizzes'
           and column_name = 'questions'
           and privilege_type = 'SELECT'
           and grantee in ('anon', 'authenticated'))
       then 'OK' else 'LEAKED - re-run migration 010 step 3' end

union all

-- 6. Migration 014 audit: the legacy "admin all" policies are GONE --------------
--    Expected: 0 rows anywhere in the public schema. Any count > 0 = LEAKED.
select 'POLICY AUDIT', 'no legacy "admin all" policies remain (migration 014)',
       case when not exists (select 1 from pg_policies
         where schemaname = 'public' and policyname in ('admin all', 'super admin all'))
       then 'OK' else 'LEAKED - re-run migration 014' end

union all

-- 6b. Migration 018 audit: NO policy may trust is_admin() anymore ---------------
--     is_admin() returns true for ANY instructor, so every remaining
--     is_admin()-based policy is a cross-instructor leak. Expected: 0 rows.
select 'POLICY AUDIT', 'no is_admin()-based policies remain (migration 018)',
       case when not exists (select 1 from pg_policies
         where schemaname = 'public'
           and (qual ilike '%is_admin()%' or with_check ilike '%is_admin()%'))
       then 'OK' else 'LEAKED - re-run migration 018' end

union all

-- 6c. Migration 019 audit: every instructor-role account has a directory row ---
--     A promoted instructor without an instructor_profiles row is invisible on
--     /faculty (public read shows published rows only). Expected: 0 missing.
select 'DIRECTORY AUDIT', 'every instructor-role account has a directory row (migration 019)',
       case when not exists (
         select 1
         from auth.users u
         left join public.profiles p on p.id = u.id
         left join public.registered_students rs
           on lower(trim(rs.email)) = lower(trim(u.email))
         where (p.role = 'instructor' or upper(coalesce(rs.role, '')) = 'INSTRUCTOR')
           and not exists (
             select 1 from public.instructor_profiles ip where ip.user_id = u.id
           )
       )
       then 'OK' else 'MISSING rows - re-run migration 019 step 1' end

union all

-- 6d. Migration 020 audit: the profiles role constraint accepts 'secretary' ----
--     The CHECK constraint must list all four roles. Expected: OK.
select 'RBAC AUDIT', 'profiles_role_check accepts secretary (migration 020)',
       case when exists (
         select 1 from pg_constraint
         where conrelid = 'public.profiles'::regclass
           and conname = 'profiles_role_check'
           and pg_get_constraintdef(oid) ilike '%secretary%'
       )
       then 'OK' else 'MISSING - re-run migration 020 step 1' end

union all

-- 6e. Migration 020 audit: admin_set_user_role whitelist knows 'secretary' -----
--     The live function definition must mention secretary (020 rewrite ran)
--     AND must still be super_admin-gated. Expected: OK.
select 'RBAC AUDIT', 'admin_set_user_role whitelist + gate (migration 020)',
       case when exists (
         select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'admin_set_user_role'
           and p.prosrc ilike '%''secretary''%'
           and p.prosrc ilike '%is_super_admin()%'
       )
       then 'OK' else 'STALE - re-run migration 020 step 3' end

union all

-- 6f. Migration 020 audit: signup trigger preserves elevated roles -------------
--     The live handle_new_auth_user must contain the preservation CASE
--     (no force-downgrade of existing super_admin/instructor/secretary rows).
select 'RBAC AUDIT', 'signup trigger preserves elevated roles (migration 020)',
       case when exists (
         select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'handle_new_auth_user'
           and p.prosrc ilike '%super_admin''%, ''instructor'', ''secretary%'
       )
       then 'OK' else 'STALE - re-run migration 020 step 4' end

union all

-- 6g. Migration 020 audit: NO secretary has a published directory row ----------
--     Secretaries are administrative staff; they never belong on /faculty.
--     With zero secretaries promoted this is trivially OK; after the manual
--     promotion it still must hold. Expected: 0 violations.
select 'DIRECTORY AUDIT', 'no secretary has a published directory row (migration 020)',
       case when not exists (
         select 1
         from public.profiles p
         join public.instructor_profiles ip on ip.user_id = p.id
         where p.role = 'secretary' and ip.is_published = true
       )
       then 'OK' else 'LEAKED - unpublish the secretary directory row' end

union all

-- 6h. Migration 020 audit: NO account was auto-promoted to secretary ----------
--     Informational: shows how many secretaries exist right now. Expected
--     after migration: 0 (promotion is a manual super-admin action later).
select 'RBAC STATE', 'secretary accounts currently in profiles (migration 020)',
       (select count(*)::text from public.profiles where role = 'secretary')

union all

-- 6i. Design audit (010/018): quiz_submissions has ZERO direct write policies -
--     rows are written ONLY by the security-definer RPC submit_quiz_attempt().
--     Exactly ONE policy must exist on quiz_submissions: the SELECT policy.
--     (The old checklist demanded a "submissions grade own course" policy that
--     never existed in any migration - a checklist authoring error, fixed.)
select 'POLICY AUDIT', 'quiz_submissions writes are RPC-only (migration 010 design)',
       case when (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'quiz_submissions') = 1
            then 'OK' else 'REVIEW - unexpected policies on quiz_submissions' end

union all

-- 6j. Migration 021 audits: financial foundation -------------------------------
--     J1: payments has EXACTLY ONE client policy (the SELECT one) - writes are
--     RPC/webhook-only, like quiz_submissions.
select 'FINANCE AUDIT', 'payments writes are RPC/webhook-only (migration 021)',
       case when (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'payments') = 1
            then 'OK' else 'REVIEW - unexpected client write policy on payments' end

union all

--     J2: the immutability guard is bound to payments.
select 'FINANCE AUDIT', 'payments immutability guard bound (migration 021)',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'payments'
            and t.tgname = 'trg_payments_guard' and not t.tgisinternal)
       then 'OK' else 'MISSING - re-run migration 021 step 4b' end

union all

--     J3: pricing guard bound to courses + commission guard to profiles.
select 'FINANCE AUDIT', 'pricing + commission guards bound (migration 021)',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'courses'
            and t.tgname = 'trg_courses_pricing_guard' and not t.tgisinternal)
        and exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'profiles'
            and t.tgname = 'trg_profiles_protect_commission' and not t.tgisinternal)
       then 'OK' else 'MISSING - re-run migration 021 steps 3/5' end

union all

--     J4: settings seeded (exactly the two defaults, nothing fabricated).
select 'FINANCE AUDIT', 'platform_settings seeded (migration 021)',
       case when (select count(*) from public.platform_settings
                  where key in ('default_platform_commission_pct', 'platform_currency')) = 2
       then 'OK' else 'MISSING - re-run migration 021 step 1' end

union all

--     J5: pricing columns exist on courses; commission column on profiles.
select 'FINANCE AUDIT', 'pricing + commission columns exist (migration 021)',
       case when exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'courses'
               and column_name = 'price')
        and exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles'
               and column_name = 'platform_commission_pct')
       then 'OK' else 'MISSING - re-run migration 021 steps 2/3' end

union all

--     J6: TRUTH check - the ledger and prices start EMPTY (nothing fabricated).
--     Informational; values shown so the owner sees the actual state.
select 'FINANCE STATE', 'payments rows / priced courses / set commissions (informational)',
       (select count(*) from public.payments)::text || ' payments, '
       || (select count(*) from public.courses where price is not null)::text || ' priced courses, '
       || (select count(*) from public.profiles where platform_commission_pct is not null)::text || ' commission overrides'

union all

-- 6k. Migration 022 audits: audit_logs (append-only governance ledger) ----------
--     K1: EXACTLY ONE client policy on audit_logs (the super-admin SELECT).
select 'AUDIT AUDIT', 'audit_logs has exactly 1 client policy - super_admin read (migration 022)',
       case when (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'audit_logs') = 1
            then 'OK' else 'REVIEW - unexpected policy on audit_logs' end

union all

--     K2: the append-only guards are bound to audit_logs (row-level AND
--     statement-level - the statement guard refuses even on an EMPTY table,
--     addendum 022b).
select 'AUDIT AUDIT', 'audit_logs append-only guards bound (migration 022/022b)',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'audit_logs'
            and t.tgname = 'trg_audit_logs_guard' and not t.tgisinternal)
        and exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'audit_logs'
            and t.tgname = 'trg_audit_logs_guard_statement' and not t.tgisinternal)
       then 'OK' else 'MISSING - re-run migration 022 step 1b + 022b addendum' end

union all

--     K3: the automatic role-change capture is bound to profiles.
select 'AUDIT AUDIT', 'role-change audit trigger bound to profiles (migration 022)',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'profiles'
            and t.tgname = 'trg_audit_role_change' and not t.tgisinternal)
       then 'OK' else 'MISSING - re-run migration 022 step 3' end

union all

--     K4: log RPC exists and is definer (runs as owner, bypassing RLS closure).
select 'AUDIT AUDIT', 'log_academy_action exists + security definer (migration 022)',
       case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'log_academy_action'
                    and p.prosecdef)
       then 'OK' else 'MISSING/NOT DEFINER - re-run migration 022 step 2' end

union all

--     K5: TRUTH check - the ledger starts EMPTY (no fabricated history).
select 'AUDIT STATE', 'audit rows by action (informational)',
       coalesce((select count(*)::text from public.audit_logs), '0') || ' rows total'
       || case when exists (select 1 from public.audit_logs limit 1) then '' else ' (empty - as designed)' end

union all

-- 6l. Migration 023 audits: centralized enrollment + payment RPCs ---------------
--     L1: the enrollment RPCs are gated to the academy office (no owns_course).
select 'GOVERNANCE AUDIT', 'enrollment RPCs gated to office, instructor branch removed (migration 023)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'admin_enroll_student') ilike '%is_secretary%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'admin_enroll_student') not ilike '%owns_course%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_enrollment_status') ilike '%is_secretary%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_enrollment_status') not ilike '%owns_course%'
       then 'OK' else 'MISSING - re-run migration 023 steps 1/2' end

union all

--     L2: the three payment RPCs exist and write audit rows.
select 'GOVERNANCE AUDIT', 'payment RPCs exist + audit-logged (migration 023)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'record_payment') ilike '%payment.record%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_payment_status') ilike '%payment.status%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'waive_enrollment_payment') ilike '%enrollment.waiver%'
       then 'OK' else 'MISSING - re-run migration 023 steps 3/4/5' end

union all

--     L3: the subscription gate - VERIFIED payment auto-activates enrollment.
select 'GOVERNANCE AUDIT', 'VERIFIED payment auto-activates enrollment (migration 023)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_payment_status') ilike '%course_enrollments%'
       then 'OK' else 'MISSING - re-run migration 023 step 4' end

union all

--     L4: TRUTH check - nothing fabricated: 0 payments, 0 audited office actions
--     until real usage. Informational.
select 'GOVERNANCE STATE', 'payments / audit rows (informational)',
       (select count(*) from public.payments)::text || ' payments, '
       || (select count(*) from public.audit_logs)::text || ' audit rows'

union all

-- 6m. Migration 024 audits: course governance + pricing --------------------------
--     M1: exactly ONE client policy on course_price_history (office read).
select 'PRICING AUDIT', 'course_price_history has exactly 1 client policy - office read (migration 024)',
       case when (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'course_price_history') = 1
            then 'OK' else 'REVIEW - unexpected policy on course_price_history' end

union all

--     M2: the automatic pricing-capture trigger is bound to courses.
select 'PRICING AUDIT', 'pricing-capture trigger bound to courses (migration 024)',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'courses'
            and t.tgname = 'trg_course_price_history' and not t.tgisinternal)
       then 'OK' else 'MISSING - re-run migration 024 step 2' end

union all

--     M3: course RPCs are office-gated + audit-logged.
select 'PRICING AUDIT', 'course governance RPCs office-gated + audited (migration 024)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_course_approval') ilike '%is_secretary%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_course_approval') ilike '%course.approval%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_course_published') ilike '%course.publish%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_course_price') ilike '%course.price.set%'
       then 'OK' else 'MISSING - re-run migration 024 steps 3/4/5' end

union all

--     M4: publish gate - no publishing past review (must check APPROVED).
select 'PRICING AUDIT', 'publish requires APPROVED status (migration 024)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_course_published') ilike '%only APPROVED courses go live%'
       then 'OK' else 'MISSING - re-run migration 024 step 4' end

union all

--     M5: TRUTH check - pricing state (informational).
select 'PRICING STATE', 'priced courses / history rows (informational)',
       (select count(*) from public.courses where price is not null)::text || ' priced courses, '
       || (select count(*) from public.course_price_history)::text || ' price-history rows'

union all

-- 6n. Migration 025 audits: settlements + ledgers + commissions ------------------
--     N1: exactly ONE client policy on instructor_settlements (read-only).
select 'SETTLEMENT AUDIT', 'instructor_settlements has exactly 1 client policy - read only (migration 025)',
       case when (select count(*) from pg_policies
                  where schemaname = 'public' and tablename = 'instructor_settlements') = 1
            then 'OK' else 'REVIEW - unexpected policy on instructor_settlements' end

union all

--     N2: immutability guard bound to instructor_settlements.
select 'SETTLEMENT AUDIT', 'settlements immutability guard bound (migration 025)',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'instructor_settlements'
            and t.tgname = 'trg_settlements_guard' and not t.tgisinternal)
       then 'OK' else 'MISSING - re-run migration 025 step 1b' end

union all

--     N3: commission + settlement RPCs exist, are security definer, and audit-logged.
select 'SETTLEMENT AUDIT', 'commission & settlement RPCs gated + audited (migration 025)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_instructor_commission') ilike '%commission.instructor.set%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_default_platform_commission') ilike '%commission.default.set%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement') ilike '%settlement.create%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_settlement_status') ilike '%settlement.status%'
       then 'OK' else 'MISSING - re-run migration 025 steps 2/3/4' end

union all

--     N4: instructor ledger + super-admin overview RPCs exist and are security definer.
select 'SETTLEMENT AUDIT', 'instructor ledger & super-admin overview RPCs exist (migration 025)',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('get_instructor_financial_ledger', 'get_super_admin_financial_overview')
                    and p.prosecdef) = 2
       then 'OK' else 'MISSING - re-run migration 025 steps 5/6' end

union all

--     N5: TRUTH check - settlements state (informational).
select 'SETTLEMENT STATE', 'settlement rows (informational)',
       (select count(*) from public.instructor_settlements)::text || ' settlements ('
       || (select count(*) from public.instructor_settlements where status = 'PAID')::text || ' paid, '
       || (select count(*) from public.instructor_settlements where status = 'PENDING')::text || ' pending)'

union all

-- 6n. Migration 026 audits: settlement integrity + office reads ------------------
--     N1: payments.settlement_id exists (the payout link).
select 'OFFICE AUDIT', 'payments.settlement_id linkage column exists (migration 026)',
       case when exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'payments'
                    and column_name = 'settlement_id')
       then 'OK' else 'MISSING - re-run migration 026 step 1' end

union all

--     N2: one ACTIVE settlement per instructor + period (unique partial index).
select 'OFFICE AUDIT', 'duplicate-period guard index exists (migration 026)',
       case when exists (select 1 from pg_indexes
                  where schemaname = 'public'
                    and tablename = 'instructor_settlements'
                    and indexname = 'uq_settlements_instructor_period_active')
       then 'OK' else 'MISSING - re-run migration 026 step 1' end

union all

--     N3: settlements only pay unsettled payments + lock + stamp.
select 'OFFICE AUDIT', 'settlements select unsettled-only, lock rows, stamp settlement_id (migration 026)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement')
                 ilike '%settlement_id is null%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement')
                 ilike '%for update%'
        and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement')
                 ilike '%set settlement_id = v_settlement_id%'
       then 'OK' else 'MISSING - re-run migration 026 step 3' end

union all

--     N4: refund is blocked while a payment belongs to a settlement.
select 'OFFICE AUDIT', 'refund blocked on settled payments (migration 026)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_payment_status')
                 ilike '%linked to a settlement%'
       then 'OK' else 'MISSING - re-run migration 026 step 5' end

union all

--     N5: cancelling a settlement unlinks its payments.
select 'OFFICE AUDIT', 'settlement cancellation unlinks payments (migration 026)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_settlement_status')
                 ilike '%settlement_id = null%'
       then 'OK' else 'MISSING - re-run migration 026 step 4' end

union all

--     N6: office read RPCs exist, are definer, and are office-gated.
select 'OFFICE AUDIT', 'office_list_payments + office_list_enrollment_queue gated (migration 026)',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in ('office_list_payments', 'office_list_enrollment_queue')
                    and p.prosecdef
                    and p.prosrc ilike '%is_secretary%') = 2
       then 'OK' else 'MISSING - re-run migration 026 steps 6/7' end

union all

--     N7: payment guard recognises the office-only settlement-link update.
select 'OFFICE AUDIT', 'payments guard allows office-only settlement linkage (migration 026)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_payments_guard')
                 ilike '%only the academy office can link a payment to a settlement%'
       then 'OK' else 'MISSING - re-run migration 026 step 2' end

union all

--     N8: TRUTH check - settlement coverage (informational).
select 'OFFICE STATE', 'settled vs unsettled verified payments (informational)',
       (select count(*) from public.payments where status = 'VERIFIED' and settlement_id is not null)::text
       || ' settled, '
       || (select count(*) from public.payments where status = 'VERIFIED' and settlement_id is null)::text
       || ' unsettled verified payments'

union all

-- 6d. Migration 027 audit - founder-only audit-log viewer -----------------------
--     N1: the read RPC exists and is a SECURITY DEFINER.
select 'AUDIT VIEWER AUDIT', 'founder_list_audit_logs exists (security definer)',
       case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname = 'founder_list_audit_logs'
                    and p.prosecdef)
       then 'OK' else 'MISSING - re-run migration 027 step 2' end

union all

--     N2: gate is is_super_admin ONLY, and the body never writes.
select 'AUDIT VIEWER AUDIT', 'viewer is super_admin-gated and read-only',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'founder_list_audit_logs')
                 ilike '%is_super_admin%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'founder_list_audit_logs')
                 not ilike '%is_secretary%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'founder_list_audit_logs')
                 not ilike '%insert into%'
       then 'OK' else 'WRONG - re-run migration 027 step 2' end

union all

--     N3: audit_logs still has ZERO client write policies (022 guarantee intact).
select 'AUDIT VIEWER AUDIT', 'audit_logs still has no client write policies',
       case when not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'audit_logs'
                    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL'))
       then 'OK' else 'LEAK - a write policy appeared on audit_logs' end

union all

-- 6e. TRUTH check - audit ledger size (informational: 0 rows on a fresh ledger).
select 'AUDIT STATE', 'audit_logs rows (informational)',
       (select count(*)::text from public.audit_logs) || ' logged actions'

union all

-- 6f. Migration 028 audit - private services catalog ----------------------------
--     N1: both catalog tables exist with RLS and ZERO client write policies.
select 'PRIVATE SERVICE AUDIT', 'catalog tables locked (RLS, no client write policies)',
       case when (select bool_and(relrowsecurity) from pg_class c
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public'
                    and c.relname in ('private_services','private_service_slots'))
             and not exists (select 1 from pg_policies
                  where schemaname = 'public'
                    and tablename in ('private_services','private_service_slots')
                    and cmd in ('INSERT','UPDATE','DELETE','ALL'))
       then 'OK' else 'LEAK - catalog write policy or RLS disabled' end

union all

--     N2: instructors cannot price or publish (trigger-enforced).
select 'PRIVATE SERVICE AUDIT', 'price/publish are office-only (trigger)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_services_guard')
                 ilike '%only the academy office can price a service%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_services_guard')
                 ilike '%only the academy office can publish, activate, or archive a service%'
       then 'OK' else 'WRONG - re-run migration 028 step 4' end

union all

--     N3: the catalog writes to the audit ledger (022) on every governance change.
select 'PRIVATE SERVICE AUDIT', 'audit trigger bound to private_services',
       case when exists (select 1 from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'private_services'
                    and t.tgname = 'trg_audit_private_services' and not t.tgisinternal)
       then 'OK' else 'MISSING - re-run migration 028 step 6' end

union all

--     N4: the future internal live server needs no data migration.
select 'PRIVATE SERVICE AUDIT', 'delivery_mode reserves internal (future live server)',
       case when exists (select 1 from pg_constraint
                  where conrelid = 'public.private_services'::regclass
                    and conname = 'private_services_delivery_check'
                    and pg_get_constraintdef(oid) ilike '%internal%')
       then 'OK' else 'MISSING - re-run migration 028 step 1' end

union all

--     N5: is_instructor() exists as SECURITY DEFINER and gates both instructor RPCs.
select 'PRIVATE SERVICE AUDIT', 'is_instructor() exists and gates instructor RPCs (028/028b)',
       case when exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'is_instructor' and p.prosecdef)
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'propose_private_service')
                 ilike '%is_instructor()%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'update_my_private_service')
                 ilike '%is_instructor()%'
       then 'OK' else 'MISSING - run migration 028b_post_028_integrity_fixes.sql' end

union all

-- 6g. TRUTH check - private services state (informational: 0 until real proposals).
select 'PRIVATE SERVICE STATE', 'services / active / slots (informational)',
       (select count(*)::text from public.private_services) || ' services, '
       || (select count(*)::text from public.private_services where status = 'ACTIVE') || ' active, '
       || (select count(*)::text from public.private_service_slots) || ' slots'

union all

-- 6h. Migration 029 audit - private service bookings ----------------------------
--     N1: private_service_bookings locked (RLS enabled, zero client write policies).
select 'PRIVATE BOOKING AUDIT', 'bookings table locked (RLS, no client write policies)',
       case when exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'private_service_bookings' and c.relrowsecurity)
             and not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'private_service_bookings'
                    and cmd in ('INSERT','UPDATE','DELETE','ALL'))
       then 'OK' else 'LEAK - bookings write policy or RLS disabled' end

union all

--     N2: pay-first-then-confirm enforced by table constraint + trigger + RPC.
select 'PRIVATE BOOKING AUDIT', 'pay-first-then-confirm enforced (constraint + trigger + RPC)',
       case when exists (select 1 from pg_constraint
                  where conrelid = 'public.private_service_bookings'::regclass
                    and conname = 'private_service_bookings_pay_first_check')
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_bookings_guard')
                 ilike '%pay-first rule - a booking cannot be CONFIRMED without a verified payment%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'office_confirm_private_service_booking')
                 ilike '%pay-first rule - verify payment before confirming%'
       then 'OK' else 'MISSING - re-run migration 029 steps 1/4/8' end

union all

--     N3: active-slot unique partial index prevents double-booking.
select 'PRIVATE BOOKING AUDIT', 'active-slot unique guard index exists (migration 029)',
       case when exists (select 1 from pg_indexes
                  where schemaname = 'public' and tablename = 'private_service_bookings'
                    and indexname = 'uq_private_service_bookings_active_slot')
       then 'OK' else 'MISSING - re-run migration 029 step 1' end

union all

--     N4: guard and audit triggers bound to private_service_bookings.
select 'PRIVATE BOOKING AUDIT', 'guard + audit triggers bound to private_service_bookings',
       case when (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'private_service_bookings'
                    and t.tgname in ('trg_private_service_bookings_guard', 'trg_audit_private_service_bookings')
                    and not t.tgisinternal) = 2
       then 'OK' else 'MISSING - re-run migration 029 steps 4/5' end

union all

--     N5: all 5 office booking RPCs gated to the academy office.
select 'PRIVATE BOOKING AUDIT', 'office booking RPCs gated to secretary/super_admin (migration 029)',
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public'
                    and p.proname in (
                      'office_list_private_service_bookings',
                      'office_mark_private_booking_awaiting_payment',
                      'office_verify_private_booking_payment',
                      'office_confirm_private_service_booking',
                      'office_set_private_booking_status'
                    )
                    and p.prosecdef
                    and p.prosrc ilike '%is_secretary()%'
                    and p.prosrc ilike '%is_super_admin()%') = 5
       then 'OK' else 'MISSING - re-run migration 029 step 8' end

union all

-- 6i. TRUTH check - private service bookings state (informational: 0 until real requests).
select 'PRIVATE BOOKING STATE', 'bookings / awaiting payment / confirmed (informational)',
       (select count(*)::text from public.private_service_bookings) || ' bookings, '
       || (select count(*)::text from public.private_service_bookings where status = 'AWAITING_PAYMENT') || ' awaiting payment, '
       || (select count(*)::text from public.private_service_bookings where status = 'CONFIRMED') || ' confirmed'

union all

-- 6j. Migration 030 audit - private service payments & settlement integration ---
--     N1: private_service_payments locked (RLS enabled, zero client write policies).
select 'PRIVATE PAYMENT AUDIT', 'payments ledger locked (RLS, no client write policies)',
       case when exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'private_service_payments' and c.relrowsecurity)
             and not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'private_service_payments'
                    and cmd in ('INSERT','UPDATE','DELETE','ALL'))
       then 'OK' else 'LEAK - private_service_payments write policy or RLS disabled' end

union all

--     N2: duplicate-ref + single-verified-per-booking unique indexes exist.
select 'PRIVATE PAYMENT AUDIT', 'duplicate-ref + single-verified-per-booking indexes exist (030)',
       case when (select count(*) from pg_indexes
                  where schemaname = 'public' and tablename = 'private_service_payments'
                    and indexname in ('uq_private_service_payments_ref','uq_private_service_payments_verified_booking')) = 2
       then 'OK' else 'MISSING - re-run migration 030 step 1' end

union all

--     N3: guard + audit/booking-sync triggers bound.
select 'PRIVATE PAYMENT AUDIT', 'guard + audit/sync triggers bound to private_service_payments',
       case when (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid
                  join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'private_service_payments'
                    and t.tgname in ('trg_private_service_payments_guard','trg_audit_private_service_payments')
                    and not t.tgisinternal) = 2
       then 'OK' else 'MISSING - re-run migration 030 steps 3/4' end

union all

--     N4: office private-payment RPCs exist, definer, office-gated.
select 'PRIVATE PAYMENT AUDIT', 'office private-payment RPCs gated to secretary/super_admin (030)',
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
       then 'OK' else 'MISSING - re-run migration 030 step 5' end

union all

--     N5: settlements & financial ledgers integrate private_service_payments.
select 'PRIVATE PAYMENT AUDIT', 'settlements + ledgers integrate private_service_payments (030)',
       case when (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'create_instructor_settlement') ilike '%private_service_payments%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_settlement_status') ilike '%private_service_payments%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'get_instructor_financial_ledger') ilike '%private_service_payments%'
             and (select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'get_super_admin_financial_overview') ilike '%private_service_payments%'
       then 'OK' else 'MISSING - re-run migration 030 steps 6/7' end

union all

--     N6: 031 review hardening (exact money math, refund reason, dead-booking guard).
select 'PRIVATE PAYMENT AUDIT', 'review hardening applied (031: exact shares, refund reason, dead-booking guard, paid self-cancel block)',
       case when (select strpos(prosrc, 'instructor share went negative') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'record_private_service_payment') > 0
             and (select strpos(prosrc, 'a refund requires a written reason (note)') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(prosrc, 'cancelled or no-show booking') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard') > 0
             and (select strpos(prosrc, 'already verified - contact the academy office') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'cancel_my_private_service_booking') > 0
        then 'OK' else 'MISSING - re-run migration 031' end

union all

--     N7: 032 review state (cancel holds the money; held-payment exit blocks; student derived payment_state priority).
select 'PRIVATE PAYMENT AUDIT', 'review state applied (032: cancel demotes VERIFIED -> UNDER_REVIEW, held FAILED/CANCELLED blocked, ACTIVE > IN_REVIEW > REFUNDED)',
       case when (select strpos(prosrc, 'booking cancelled - payment held for a refund decision') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'office_set_private_booking_status') > 0
             and (select strpos(prosrc, 'cannot change the status of a payment linked to a settlement') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard') > 0
             and (select strpos(prosrc, 'a held payment that was already verified cannot move to % - refund it with a written reason instead') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'trg_private_service_payments_guard') > 0
             and (select strpos(prosrc, 'cannot mark a held verified payment as % - refund it with a written reason instead') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and (select strpos(prosrc, 'a refund requires a written reason (note)') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'set_private_service_payment_status') > 0
             and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                         where n.nspname = 'public' and p.proname = 'list_my_student_private_bookings'
                           and pg_get_function_result(p.oid) ilike '%payment_state%'
                           and strpos(p.prosrc, '''VERIFIED''') > 0
                           and strpos(p.prosrc, '''UNDER_REVIEW''') > strpos(p.prosrc, '''VERIFIED''')
                           and strpos(p.prosrc, '''REFUNDED''') > strpos(p.prosrc, '''UNDER_REVIEW'''))
        then 'OK' else 'MISSING - re-run migration 032' end

union all

-- 6k. TRUTH check - private service payments state (informational: 0 until real payments).
select 'PRIVATE PAYMENT STATE', 'payments / verified / settled (informational)',
       (select count(*)::text from public.private_service_payments) || ' payments, '
       || (select count(*)::text from public.private_service_payments where status = 'VERIFIED') || ' verified, '
       || (select count(*)::text from public.private_service_payments where status = 'VERIFIED' and settlement_id is not null) || ' settled'

union all

-- 7. Migration 015 audit: the `booklets` bucket is PRIVATE ----------------------
select 'STORAGE AUDIT', 'bucket booklets is private (migration 015)',
       case when exists (select 1 from storage.buckets
         where id = 'booklets' and public = false)
       then 'OK' else 'NOT PRIVATE - re-run migration 015' end

union all

-- 8. Schema audit marker (shows the highest migration actually applied) ---------
select 'AUDIT MARKER', 'schema comment',
       case when obj_description('public'::regnamespace, 'pg_namespace') like '%032%'
       then 'OK (through 032)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%031%'
       then 'PARTIAL (031 only - 032 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%030%'
       then 'PARTIAL (030 only - 031 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%029%'
       then 'PARTIAL (029 only - 030 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%028%'
       then 'PARTIAL (028 only - 029 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%027%'
       then 'PARTIAL (027 only - 028 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%026%'
       then 'PARTIAL (026 only - 027/028 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%025%'
       then 'PARTIAL (025 only - 026/027 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%024%'
       then 'PARTIAL (024 only - 025/026/027 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%023%'
       then 'PARTIAL (023 only - 024/025/026/027 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%022%'
       then 'PARTIAL (022 only - 023/024/025/026/027 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%021%'
       then 'PARTIAL (021 only - 022/023/024/025/026/027 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%020%'
       then 'PARTIAL (020 only - 021/022/023/024/025/026/027 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%019%'
       then 'PARTIAL (019 only - 020/021/022/023/024/025/026/027 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%018%'
       then 'PARTIAL (018 only - 019/020/021/022/023/024/025/026/027 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%017%'
       then 'PARTIAL (017 only - 018/019/020/021/022/023/024/025/026/027 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%016%'
       then 'PARTIAL (016 only - 017/018/019/020/021/022/023/024/025/026/027 not applied)'
       when obj_description('public'::regnamespace, 'pg_namespace') like '%014%'
       then 'PARTIAL (014 only - 015/016/019/020/021/022/023/024/025/026/027 not applied)'
       else 'MISSING/OLDER' end

order by kind, item;
