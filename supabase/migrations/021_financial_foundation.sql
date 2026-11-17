-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 021
-- Financial foundation (GOVERNANCE Phase 1, step 2 of 020-026)
--
-- WHY:
--   The platform has ZERO payment infrastructure (verified in the governance
--   audit). Centralized financial control (brief §6) needs: configurable
--   commission policies, course pricing, a unified payments ledger, and
--   immutable financial history. NO payment rows are created here - the ledger
--   starts EMPTY and stays truthful; rows arrive via the RPCs/webhooks added in
--   later migrations (023+).
--
-- WHAT THIS DOES:
--   1. platform_settings: super-admin-owned key/value store (commission
--      fallback, currency). Seeded with TWO keys only (idempotent, never
--      overwrites): default_platform_commission_pct = '20' (FALLBACK for
--      instructors without an explicit override - the real model is
--      per-instructor overrides) and platform_currency = 'EGP'.
--   2. courses.price + currency + subscription_months (ALL NULL/default:
--      no course gets a fabricated price; pricing set later by
--      secretary/super_admin workflows).
--   3. profiles.platform_commission_pct (nullable override per instructor;
--      null = use the settings fallback) + trigger: only super_admin can
--      change it (instructors can already update their own profile row -
--      this closes that door for the money column).
--   4. payments: the unified ledger (brief §6.2). Six statuses; manual +
--      kashier share one structure. SNAPSHOTS (price, commission pct,
--      platform/instructor amounts, processing fee) are stored per row -
--      later policy changes NEVER rewrite history (brief §6.1 hard rule).
--      - NO client INSERT/UPDATE/DELETE policies: rows are written only by
--        security-definer RPCs / the Kashier webhook (house pattern, same as
--        quiz_submissions). Read: student (own), course owner, super_admin.
--      - trg_payments_guard enforces at the DB level, for EVERYONE:
--          * entity/money columns immutable after insert (fix a wrong amount
--            by CANCEL + new row - never by editing history)
--          * legal transitions only: PENDING -> UNDER_REVIEW/FAILED/CANCELLED;
--            UNDER_REVIEW -> VERIFIED/FAILED/CANCELLED; VERIFIED -> REFUNDED
--          * VERIFIED requires verified_by + verified_at (no blind confirm)
--          * terminal rows (REFUNDED/CANCELLED/FAILED) fully immutable
--      - idempotency: unique (course_id, student_email, reference) where
--        reference is not null - a duplicated receipt/gateway reference can
--        never be recorded twice (brief §11: duplicate payment protection).
--   5. trg_pricing_guard on courses: only super_admin OR secretary may set or
--      change pricing columns. Dormant-for-now for secretary (she has no
--      course UPDATE policy yet - her pricing flows arrive as definer RPCs in
--      024); the guard is ready so 024 needs no trigger surgery. Instructors
--      CANNOT price their own courses (brief §2 hard rule). On instructor
--      course INSERT, price is forced to null.
--
-- HARD GUARANTEES:
--   - ZERO payments rows inserted, ZERO prices set, ZERO commissions set.
--   - No existing column is dropped or rewritten; all changes additive.
--   - No role was granted any NEW write permission anywhere.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it (errors-log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) platform_settings: configurable financial policies (brief §6.3: never
--    hardcode commissions). Read = super_admin + secretary; manage = super_admin.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings read staff" ON public.platform_settings;
CREATE POLICY "settings read staff" ON public.platform_settings
  FOR SELECT USING (public.is_super_admin() OR public.is_secretary());

DROP POLICY IF EXISTS "settings manage super_admin" ON public.platform_settings;
CREATE POLICY "settings manage super_admin" ON public.platform_settings
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

INSERT INTO public.platform_settings (key, value)
VALUES
  ('default_platform_commission_pct', '20'),
  ('platform_currency', 'EGP')
ON CONFLICT (key) DO NOTHING;  -- idempotent; never overwrites a changed value

-- ------------------------------------------------------------------------------
-- 2) Course pricing (centralized - brief §6.1). Nullable price = "not priced
--    yet"; nothing is backfilled.
-- ------------------------------------------------------------------------------
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS price numeric(12,2),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EGP',
  ADD COLUMN IF NOT EXISTS subscription_months int NOT NULL DEFAULT 12;

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_price_non_negative;
ALTER TABLE public.courses ADD CONSTRAINT courses_price_non_negative
  CHECK (price IS NULL OR price >= 0);

-- ------------------------------------------------------------------------------
-- 3) Per-instructor commission override (the REAL model - user decision:
--    "different from mister to mister"). Null = fallback to
--    platform_settings.default_platform_commission_pct at transaction time.
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_commission_pct numeric(5,2);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_commission_pct_range;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_commission_pct_range
  CHECK (platform_commission_pct IS NULL OR (platform_commission_pct >= 0 AND platform_commission_pct <= 100));

-- Instructors can update their own profile row (014 policy) - money columns
-- must not be self-service. Only super_admin may move this value.
CREATE OR REPLACE FUNCTION public.trg_protect_commission_pct()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.platform_commission_pct IS DISTINCT FROM OLD.platform_commission_pct
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: only the academy founder (super_admin) can set instructor commission';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect_commission ON public.profiles;
CREATE TRIGGER trg_profiles_protect_commission
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_protect_commission_pct();

-- ------------------------------------------------------------------------------
-- 4) payments: the unified ledger. One row per money movement, every channel.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id),        -- null for pre-signup roster students
  student_email text NOT NULL,                      -- always present (roster-first model)
  course_id text NOT NULL REFERENCES public.courses(id),
  instructor_email text,                            -- denormalized snapshot of the course owner
  method text NOT NULL CHECK (method IN ('kashier','cash','instapay','vodafone_cash','other')),
  gross_amount numeric(12,2) NOT NULL CHECK (gross_amount >= 0),
  currency text NOT NULL DEFAULT 'EGP',
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','UNDER_REVIEW','VERIFIED','FAILED','REFUNDED','CANCELLED')),
  reference text,                                   -- receipt no. / gateway reference
  collected_at timestamptz,                         -- when the money actually moved
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  -- ---- SNAPSHOTS (immutable after insert - history never rewritten) ----
  price_snapshot numeric(12,2),                     -- course price at transaction time
  platform_commission_pct numeric(5,2),             -- pct used for THIS transaction
  platform_amount numeric(12,2),
  instructor_amount numeric(12,2),
  processing_fee numeric(12,2) NOT NULL DEFAULT 0,  -- e.g. Kashier 2.75% + 3 EGP
  subscription_id uuid,                             -- enrollment link, set at activation (023)
  created_by uuid REFERENCES auth.users(id),        -- who recorded it
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_course ON public.payments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_email);
CREATE INDEX IF NOT EXISTS idx_payments_instructor ON public.payments(instructor_email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status, created_at);

-- Duplicate protection (brief §11): the same receipt/gateway reference can
-- never be recorded twice for the same student x course.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference_idempotency
  ON public.payments(course_id, student_email, reference)
  WHERE reference IS NOT NULL;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Read: super_admin everywhere; student = own rows; instructor = rows of
-- courses they own (owns_course checks the instructor role + owner_id).
DROP POLICY IF EXISTS "payments read own or course owner" ON public.payments;
CREATE POLICY "payments read own or course owner" ON public.payments
  FOR SELECT USING (
    public.is_super_admin()
    OR student_id = auth.uid()
    OR student_email = lower(coalesce(auth.jwt()->>'email', ''))
    OR public.owns_course(course_id)
  );

-- NO INSERT / UPDATE / DELETE policies: writes happen exclusively through
-- security-definer RPCs (secretary workflows, 023+) and the signed Kashier
-- webhook. Clients can never create or edit a financial row.

-- ------------------------------------------------------------------------------
-- 4b) trg_payments_guard: financial immutability + legal transitions, enforced
--     at the DB level for every writer (RPCs, webhooks, even maintenance SQL).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_payments_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;  -- inserts arrive only via definer paths; shape validated there
  END IF;

  -- Terminal rows are frozen (corrections = new reversal/adjustment rows).
  IF OLD.status IN ('REFUNDED', 'CANCELLED', 'FAILED') THEN
    RAISE EXCEPTION 'payments: terminal state % is immutable', OLD.status;
  END IF;

  -- Money and entity columns never change after insert.
  IF NEW.student_id      IS DISTINCT FROM OLD.student_id
     OR NEW.student_email IS DISTINCT FROM OLD.student_email
     OR NEW.course_id     IS DISTINCT FROM OLD.course_id
     OR NEW.instructor_email IS DISTINCT FROM OLD.instructor_email
     OR NEW.method        IS DISTINCT FROM OLD.method
     OR NEW.gross_amount  IS DISTINCT FROM OLD.gross_amount
     OR NEW.currency      IS DISTINCT FROM OLD.currency
     OR NEW.price_snapshot IS DISTINCT FROM OLD.price_snapshot
     OR NEW.platform_commission_pct IS DISTINCT FROM OLD.platform_commission_pct
     OR NEW.platform_amount IS DISTINCT FROM OLD.platform_amount
     OR NEW.instructor_amount IS DISTINCT FROM OLD.instructor_amount
     OR NEW.processing_fee IS DISTINCT FROM OLD.processing_fee
     OR NEW.reference     IS DISTINCT FROM OLD.reference
     OR NEW.collected_at  IS DISTINCT FROM OLD.collected_at THEN
    RAISE EXCEPTION 'payments: monetary and entity columns are immutable';
  END IF;

  -- Legal status transitions only (VERIFIED -> REFUNDED is the one exit).
  IF NOT (
       (OLD.status = 'PENDING'      AND NEW.status IN ('UNDER_REVIEW', 'FAILED', 'CANCELLED'))
    OR (OLD.status = 'UNDER_REVIEW' AND NEW.status IN ('VERIFIED', 'FAILED', 'CANCELLED'))
    OR (OLD.status = 'VERIFIED'     AND NEW.status = 'REFUNDED')
  ) THEN
    RAISE EXCEPTION 'payments: illegal status transition % -> %', OLD.status, NEW.status;
  END IF;

  -- No blind confirmation: VERIFIED needs an accountable human.
  IF NEW.status = 'VERIFIED' AND (NEW.verified_by IS NULL OR NEW.verified_at IS NULL) THEN
    RAISE EXCEPTION 'payments: VERIFIED requires verified_by and verified_at';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_guard ON public.payments;
CREATE TRIGGER trg_payments_guard
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_payments_guard();

-- ------------------------------------------------------------------------------
-- 5) trg_pricing_guard on courses: pricing is centralized (brief §6.1 + §2:
--    instructors cannot price their own courses). super_admin + secretary
--    allowed at trigger level (secretary's actual course-UPDATE policy arrives
--    with her definer RPCs in 024 - until then this branch is dormant).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_pricing_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_super_admin() OR public.is_secretary() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
     AND (NEW.price IS DISTINCT FROM OLD.price
          OR NEW.currency IS DISTINCT FROM OLD.currency
          OR NEW.subscription_months IS DISTINCT FROM OLD.subscription_months) THEN
    RAISE EXCEPTION 'forbidden: course pricing is managed centrally (secretary/super_admin)';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.price IS NOT NULL THEN
    NEW.price := NULL;  -- instructors propose courses without pricing
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_courses_pricing_guard ON public.courses;
CREATE TRIGGER trg_courses_pricing_guard
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_pricing_guard();

-- ------------------------------------------------------------------------------
-- 6) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 021 (financial foundation: platform_settings + seeded defaults, courses.price/currency/subscription_months, profiles.platform_commission_pct super-admin-only, payments unified ledger with immutable snapshots + transition guard + idempotency index, centralized pricing guard; zero financial rows created) applied';
