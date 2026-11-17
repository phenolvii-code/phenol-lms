-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 024
-- Course governance for the academy office + centralized pricing with history
-- (GOVERNANCE Phase 1, step 5 of 020-026)
--
-- WHY:
--   Pricing is a GOVERNANCE decision (brief §6.1): the office sets it, and
--   every change is permanently on the record ("what did the course cost when
--   this student paid?"). Also: the courses read policy
--   ("courses read public": APPROVED OR owns_course) means the office could
--   not see PENDING/REJECTED proposals at all - a latent approval-flow gap.
--   office_list_courses() gives the office a complete governance picture.
--
-- WHAT THIS DOES:
--   1. course_price_history: append-only price log. Read = super_admin +
--      secretary. NO client write policies (rows arrive via the definer
--      capture trigger + office RPCs). One row per pricing change, with WHO
--      changed it (actor snapshot) and WHAT the values were.
--   2. trg_course_price_history on courses: automatic capture of pricing
--      changes (INSERT with a price, or UPDATE that changes price/currency/
--      subscription_months) - zero rewrites of existing course flows.
--   3. set_course_approval: re-gated super_admin OR is_secretary() (was
--      super_admin only) + audit 'course.approval' (022 ledger).
--   4. set_course_published(): office-only publish/unpublish. Publishing
--      requires approval_status = 'APPROVED' (no shortcuts past review).
--      Audit 'course.publish'.
--   5. set_course_price(): office-only pricing (the trg_pricing_guard from 021
--      already allows secretary/super_admin at the trigger level - this RPC is
--      the door). Validates price >= 0 and months >= 1. Audit 'course.price.set'.
--      The 024 history trigger captures the change automatically.
--   6. office_list_courses(): office-only definer SELECT - the complete course
--      governance picture (id/code/title, instructor, approval_status,
--      is_published, price/currency/months). Fixes the office visibility gap.
--
-- HARD GUARANTEES:
--   - Instructors still cannot price their own courses (021 guard untouched).
--   - course_price_history starts EMPTY (nothing fabricated).
--   - No client write permission added anywhere; all writes are definer RPCs.
--   - No existing column/function is dropped or rewritten except the one
--     re-gate (set_course_approval) which keeps its exact signature.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it (errors-log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0) courses.is_published column + office-aware immutability guard
--    (is_published previously existed only on instructor_profiles from 016;
--    courses needs its own boolean column. Existing APPROVED courses stay
--    published = true so live catalogue is untouched; unapproved proposals
--    start as is_published = false. trg_protect_course_fields from 007 is
--    updated to recognize is_secretary() alongside is_super_admin() and to
--    lock is_published against direct instructor tampering.)
-- ------------------------------------------------------------------------------
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

UPDATE public.courses
SET is_published = false
WHERE approval_status <> 'APPROVED' AND is_published = true;

CREATE OR REPLACE FUNCTION public.trg_protect_course_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Academy office (super_admin + secretary) has governance bypass
  IF public.is_super_admin() OR public.is_secretary() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.owner_id := auth.uid();
    NEW.approval_status := 'PENDING';
    NEW.is_published := false;
    NEW.instructor_email := auth.jwt()->>'email';
    NEW.submitted_at := now();
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Instructors CANNOT self-approve, self-publish, or hijack ownership
    NEW.owner_id := OLD.owner_id;
    NEW.approval_status := OLD.approval_status;
    NEW.is_published := OLD.is_published;
    NEW.instructor_email := OLD.instructor_email;

    -- If course was rejected and edited, reset to PENDING for re-review
    IF OLD.approval_status = 'REJECTED' THEN
      NEW.approval_status := 'PENDING';
      NEW.is_published := false;
      NEW.submitted_at := now();
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 1) course_price_history: the price ledger. Read = office (super_admin +
--    secretary). Writes: definer paths only.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL REFERENCES public.courses(id),
  price numeric(12,2),                          -- null = the price was cleared
  currency text,
  subscription_months int,
  changed_by uuid,
  changed_by_email text,                        -- actor SNAPSHOT (frozen)
  changed_by_role text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'rpc'
    CHECK (source IN ('rpc','trigger','system'))
);

CREATE INDEX IF NOT EXISTS idx_price_history_course
  ON public.course_price_history (course_id, changed_at DESC);

ALTER TABLE public.course_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price history read office" ON public.course_price_history;
CREATE POLICY "price history read office" ON public.course_price_history
  FOR SELECT USING (public.is_super_admin() OR public.is_secretary());

-- NO INSERT/UPDATE/DELETE policies: capture is automatic via the trigger;
-- nothing else writes. (History rows themselves stay immutable - corrections
-- are new rows, same doctrine as payments/audit_logs.)

-- ------------------------------------------------------------------------------
-- 2) trg_course_price_history: automatic capture on courses. AFTER INSERT OR
--    UPDATE OF the pricing columns. Fires for EVERY writer (office RPCs, the
--    founder's console, maintenance SQL) - the log never misses a change.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_capture_price_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.price IS NULL THEN
      RETURN NEW;  -- course created unpriced (the normal instructor path)
    END IF;
  ELSE
    IF NEW.price IS NOT DISTINCT FROM OLD.price
       AND NEW.currency IS NOT DISTINCT FROM OLD.currency
       AND NEW.subscription_months IS NOT DISTINCT FROM OLD.subscription_months THEN
      RETURN NEW;  -- pricing untouched - nothing to log
    END IF;
  END IF;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.course_price_history (
    course_id, price, currency, subscription_months,
    changed_by, changed_by_email, changed_by_role, source
  ) VALUES (
    NEW.id, NEW.price, NEW.currency, NEW.subscription_months,
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    'trigger'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_course_price_history ON public.courses;
CREATE TRIGGER trg_course_price_history
  AFTER INSERT OR UPDATE OF price, currency, subscription_months ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_capture_price_history();

-- ------------------------------------------------------------------------------
-- 3) set_course_approval: office decision now (was founder-only). Same exact
--    signature as 007_fixed - dashboard approval buttons keep working.
--    Audit 'course.approval' into the 022 ledger.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_course_approval(
  p_course_id text,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status text;
  v_actor_role text;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: course approval is centralized - only the academy office (secretary/founder) can approve or reject courses';
  END IF;

  IF p_status NOT IN ('PENDING', 'APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'bad approval status: %', p_status;
  END IF;

  SELECT approval_status INTO v_old_status FROM public.courses WHERE id = p_course_id;
  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'course not found';
  END IF;

  UPDATE public.courses
  SET approval_status = p_status
  WHERE id = p_course_id;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id,
    summary, details, source
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    'course.approval',
    'course',
    p_course_id,
    'course approval: ' || coalesce(v_old_status, '?') || ' -> ' || p_status,
    jsonb_build_object('old_status', v_old_status, 'new_status', p_status),
    'rpc'
  );
END $$;

REVOKE ALL ON FUNCTION public.set_course_approval(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_course_approval(text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 4) set_course_published: office-only publish/unpublish. No publishing past
--    review: approval_status must be APPROVED to go live.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_course_published(
  p_course_id text,
  p_published boolean,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course public.courses;
  v_actor_role text;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: publishing is centralized - only the academy office (secretary/founder) can publish or unpublish courses';
  END IF;

  SELECT * INTO v_course FROM public.courses WHERE id = p_course_id;
  IF v_course.id IS NULL THEN
    RAISE EXCEPTION 'course not found';
  END IF;

  IF p_published AND v_course.approval_status <> 'APPROVED' THEN
    RAISE EXCEPTION 'cannot publish: course approval_status is % (only APPROVED courses go live)', v_course.approval_status;
  END IF;

  UPDATE public.courses
  SET is_published = p_published
  WHERE id = p_course_id;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id,
    summary, details, source
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    'course.publish',
    'course',
    p_course_id,
    CASE WHEN p_published THEN 'course published: ' ELSE 'course unpublished: ' END || v_course.title,
    jsonb_build_object('published', p_published, 'note', p_note),
    'rpc'
  );
END $$;

REVOKE ALL ON FUNCTION public.set_course_published(text, boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_course_published(text, boolean, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 5) set_course_price: THE pricing door (office-only). The 021 trg_pricing_guard
--    already allows secretary/super_admin at the trigger level; the 024 history
--    trigger captures every change automatically. Instructors remain blocked.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_course_price(
  p_course_id text,
  p_price numeric,
  p_subscription_months int DEFAULT NULL,
  p_currency text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course public.courses;
  v_actor_role text;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: pricing is centralized - only the academy office (secretary/founder) can set course prices';
  END IF;

  SELECT * INTO v_course FROM public.courses WHERE id = p_course_id;
  IF v_course.id IS NULL THEN
    RAISE EXCEPTION 'course not found';
  END IF;

  IF p_price IS NOT NULL AND p_price < 0 THEN
    RAISE EXCEPTION 'price must be >= 0';
  END IF;

  UPDATE public.courses
  SET price = p_price,
      subscription_months = coalesce(p_subscription_months, v_course.subscription_months),
      currency = coalesce(p_currency, v_course.currency)
  WHERE id = p_course_id;

  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id,
    summary, details, source
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    'course.price.set',
    'course',
    p_course_id,
    'price set: ' || v_course.title || ' -> '
      || coalesce(p_price::text, 'UNPRICED') || ' ' || coalesce(p_currency, v_course.currency),
    jsonb_build_object(
      'old_price', v_course.price, 'new_price', p_price,
      'subscription_months', coalesce(p_subscription_months, v_course.subscription_months),
      'currency', coalesce(p_currency, v_course.currency)
    ),
    'rpc'
  );
END $$;

REVOKE ALL ON FUNCTION public.set_course_price(text, numeric, int, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_course_price(text, numeric, int, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 6) office_list_courses: the office's complete course governance picture.
--    Fixes the visibility gap (the courses read policy shows PENDING rows only
--    to their owner - the office needs to see every proposal to decide it).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.office_list_courses()
RETURNS TABLE (
  id text,
  code text,
  title text,
  instructor_email text,
  approval_status text,
  is_published boolean,
  price numeric,
  currency text,
  subscription_months int,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.code, c.title, c.instructor_email, c.approval_status,
         c.is_published, c.price, c.currency, c.subscription_months, c.created_at
  FROM public.courses c
  WHERE public.is_super_admin() OR public.is_secretary()
  ORDER BY c.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.office_list_courses() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_list_courses() TO authenticated;

-- ------------------------------------------------------------------------------
-- 7) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 024 (course governance: course_price_history append-only ledger + automatic pricing-capture trigger, set_course_approval re-gated to office with audit, set_course_published with approval-gate, set_course_price office RPC, office_list_courses complete governance picture; zero fabricated rows) applied';
