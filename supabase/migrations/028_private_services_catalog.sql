-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 028
-- PRIVATE SERVICES - CATALOG, PRICING, AND BOOKABLE SLOTS (NO MONEY YET)
-- ==============================================================================
--
-- WHY THIS MIGRATION EXISTS
--   Private (1:1 / small-group) services need a governed catalog before any
--   booking or payment can exist. This migration adds the catalog and the
--   office-managed time slots. Bookings (029) and the money ledger (030) are
--   deliberately NOT here.
--
-- GOVERNANCE MODEL (locked by the owner)
--   1. The INSTRUCTOR proposes a service (title, description, duration).
--      The instructor NEVER prices it.
--   2. The ACADEMY OFFICE (secretary or founder) sets the price, publishes,
--      archives, and creates the bookable slots.
--   3. Price is per service and is office-set, so it can differ per instructor.
--   4. No confirmation without a verified payment (enforced in 029/030).
--   5. Refunds are case-by-case management decisions (030).
--
-- DELIVERY MODE - FUTURE LIVE SERVER
--   `delivery_mode` accepts 'external_link' (today: Zoom/Meet link lives on the
--   booking) and 'internal' (reserved for the platform's own live-session
--   server). Nothing is built for 'internal' yet; the value exists so the
--   future switch needs NO data migration - only the booking/UI wiring.
--
-- SAFETY
--   - Idempotent: IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
--   - Zero client write policies: every write goes through a definer RPC.
--   - Instructors can neither price nor publish (trigger-enforced, not just UI).
--   - Every create/price/status change is written to `audit_logs` by a trigger
--     (append-only ledger from 022, readable through the 027 viewer).
--   - No rows are fabricated: empty catalog is the correct initial state.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it (errors-log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0) Read helper for slots (definer: no RLS recursion, no leakage).
--    True when the caller may see this service at all: published+active, the
--    service's own instructor, or the academy office.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_read_private_service(p_service_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.private_services s
    WHERE s.id = p_service_id
      AND (
        (s.status = 'ACTIVE' AND s.is_published)
        OR lower(btrim(s.instructor_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
        OR public.is_secretary()
        OR public.is_super_admin()
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_private_service(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_read_private_service(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 1) private_services: what an instructor offers (price + visibility = office).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.private_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The instructor is identified by the same email key used across courses,
  -- payments, and settlements (007/021) - never by a client-supplied id.
  instructor_email text NOT NULL,
  instructor_name  text,                                  -- display snapshot

  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 60,

  -- 'external_link' today; 'internal' reserved for the platform live server.
  delivery_mode text NOT NULL DEFAULT 'external_link',

  -- Office-owned commerce fields.
  price numeric(12,2),
  currency text NOT NULL DEFAULT 'EGP',

  status text NOT NULL DEFAULT 'PROPOSED',
  is_published boolean NOT NULL DEFAULT false,

  created_by uuid,
  created_by_email text,
  priced_by uuid,
  priced_by_email text,
  priced_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT private_services_title_check
    CHECK (char_length(btrim(title)) BETWEEN 3 AND 120),
  CONSTRAINT private_services_duration_check
    CHECK (duration_minutes BETWEEN 15 AND 480),
  CONSTRAINT private_services_delivery_check
    CHECK (delivery_mode IN ('external_link', 'internal')),
  CONSTRAINT private_services_price_check
    CHECK (price IS NULL OR price > 0),
  CONSTRAINT private_services_currency_check
    CHECK (char_length(btrim(currency)) = 3),
  CONSTRAINT private_services_status_check
    CHECK (status IN ('PROPOSED', 'ACTIVE', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS idx_private_services_instructor
  ON public.private_services (lower(instructor_email));

CREATE INDEX IF NOT EXISTS idx_private_services_status
  ON public.private_services (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_private_services_published
  ON public.private_services (is_published, status)
  WHERE is_published = true;

-- ------------------------------------------------------------------------------
-- 2) private_service_slots: the office's specific bookable times.
--    (Student-proposed times are a booking concern and arrive with 029.)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.private_service_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.private_services(id) ON DELETE CASCADE,

  starts_at timestamptz NOT NULL,
  ends_at   timestamptz NOT NULL,
  timezone  text NOT NULL DEFAULT 'Africa/Cairo',

  status text NOT NULL DEFAULT 'OPEN',
  created_by uuid,
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT private_service_slots_time_check CHECK (ends_at > starts_at),
  CONSTRAINT private_service_slots_status_check CHECK (status IN ('OPEN', 'BOOKED', 'CLOSED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_private_service_slots_service_start
  ON public.private_service_slots (service_id, starts_at);

CREATE INDEX IF NOT EXISTS idx_private_service_slots_open
  ON public.private_service_slots (starts_at)
  WHERE status = 'OPEN';

-- ------------------------------------------------------------------------------
-- 3) RLS: read-only for clients, always. Every write is a definer RPC.
-- ------------------------------------------------------------------------------
ALTER TABLE public.private_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_service_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "private services read" ON public.private_services;
CREATE POLICY "private services read" ON public.private_services
  FOR SELECT USING (
    (status = 'ACTIVE' AND is_published)
    OR lower(btrim(instructor_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    OR public.is_secretary()
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "private service slots read" ON public.private_service_slots;
CREATE POLICY "private service slots read" ON public.private_service_slots
  FOR SELECT USING (
    public.is_secretary()
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.private_services s
      WHERE s.id = private_service_slots.service_id
        AND lower(btrim(s.instructor_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    )
    OR (status = 'OPEN' AND public.can_read_private_service(service_id))
  );

-- NO INSERT / UPDATE / DELETE policies on either table (definer RPCs only).

-- ------------------------------------------------------------------------------
-- 4) trg_private_services_guard: invariants for EVERY writer (including SQL).
--    - instructor_email / created_by are immutable.
--    - only the office may set a price, publish, or change status.
--    - ACTIVE requires a positive price; ARCHIVED is never published.
--    - legal status transitions only.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_private_services_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_office boolean := (public.is_secretary() OR public.is_super_admin());
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.instructor_email := lower(btrim(NEW.instructor_email));
    NEW.currency := upper(btrim(NEW.currency));
    NEW.created_at := now();
    NEW.updated_at := now();
    NEW.created_by := coalesce(NEW.created_by, auth.uid());
    NEW.created_by_email := lower(coalesce(NEW.created_by_email, auth.jwt() ->> 'email', ''));

    -- Only the office can create something already priced/published/active.
    IF NOT v_is_office THEN
      IF NEW.price IS NOT NULL OR NEW.is_published OR NEW.status <> 'PROPOSED' THEN
        RAISE EXCEPTION 'private_services: only the academy office can set a price, publish, or activate a service';
      END IF;
    END IF;

    IF NEW.status = 'ACTIVE' AND (NEW.price IS NULL OR NEW.price <= 0) THEN
      RAISE EXCEPTION 'private_services: an ACTIVE service needs a positive price';
    END IF;
    IF NEW.is_published AND NEW.status <> 'ACTIVE' THEN
      RAISE EXCEPTION 'private_services: only an ACTIVE service can be published';
    END IF;

    RETURN NEW;
  END IF;

  -- ---------------- UPDATE ----------------
  IF NEW.instructor_email IS DISTINCT FROM OLD.instructor_email THEN
    RAISE EXCEPTION 'private_services: the instructor of a service can never be changed';
  END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'private_services: creation provenance is immutable';
  END IF;

  IF NOT v_is_office THEN
    IF NEW.price IS DISTINCT FROM OLD.price
       OR NEW.currency IS DISTINCT FROM OLD.currency THEN
      RAISE EXCEPTION 'private_services: only the academy office can price a service';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.is_published IS DISTINCT FROM OLD.is_published THEN
      RAISE EXCEPTION 'private_services: only the academy office can publish, activate, or archive a service';
    END IF;
    -- An instructor may only edit descriptive fields, and only before pricing.
    IF OLD.status <> 'PROPOSED' THEN
      RAISE EXCEPTION 'private_services: an instructor can only edit a PROPOSED service';
    END IF;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'PROPOSED' AND NEW.status IN ('ACTIVE', 'ARCHIVED'))
      OR (OLD.status = 'ACTIVE' AND NEW.status = 'ARCHIVED')
      OR (OLD.status = 'ARCHIVED' AND NEW.status = 'ACTIVE')
    ) THEN
      RAISE EXCEPTION 'private_services: illegal status transition % -> %', OLD.status, NEW.status;
    END IF;
  END IF;

  IF NEW.status = 'ACTIVE' AND (NEW.price IS NULL OR NEW.price <= 0) THEN
    RAISE EXCEPTION 'private_services: an ACTIVE service needs a positive price';
  END IF;
  IF NEW.status <> 'ACTIVE' AND NEW.is_published THEN
    RAISE EXCEPTION 'private_services: only an ACTIVE service can be published';
  END IF;

  NEW.currency := upper(btrim(NEW.currency));
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_private_services_guard ON public.private_services;
CREATE TRIGGER trg_private_services_guard
  BEFORE INSERT OR UPDATE ON public.private_services
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_private_services_guard();

-- ------------------------------------------------------------------------------
-- 5) trg_private_service_slots_guard: a BOOKED slot is locked, and a slot can
--    never move to another service or be silently shortened.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_private_service_slots_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.timezone := coalesce(nullif(btrim(NEW.timezone), ''), 'Africa/Cairo');
    NEW.created_by := coalesce(NEW.created_by, auth.uid());
    NEW.created_by_email := lower(coalesce(NEW.created_by_email, auth.jwt() ->> 'email', ''));

    IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
      RAISE EXCEPTION 'private_service_slots: only the academy office can create bookable slots';
    END IF;

    IF NEW.starts_at <= now() - interval '1 minute' THEN
      RAISE EXCEPTION 'private_service_slots: a slot must be in the future';
    END IF;

    RETURN NEW;
  END IF;

  -- ---------------- UPDATE ----------------
  IF OLD.status = 'BOOKED' AND NEW.status = 'BOOKED' THEN
    IF NEW.starts_at IS DISTINCT FROM OLD.starts_at
       OR NEW.ends_at IS DISTINCT FROM OLD.ends_at
       OR NEW.service_id IS DISTINCT FROM OLD.service_id THEN
      RAISE EXCEPTION 'private_service_slots: a BOOKED slot can never be moved or reassigned';
    END IF;
  END IF;

  IF NEW.service_id IS DISTINCT FROM OLD.service_id THEN
    RAISE EXCEPTION 'private_service_slots: a slot can never move to another service';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Releasing a booked slot is the booking flow's job (029) or the office's.
    IF OLD.status = 'BOOKED' AND NEW.status = 'OPEN'
       AND NOT (public.is_secretary() OR public.is_super_admin()) THEN
      RAISE EXCEPTION 'private_service_slots: a BOOKED slot can only be released by the booking flow or the office';
    END IF;
    IF NEW.status = 'BOOKED' AND OLD.status <> 'OPEN' THEN
      RAISE EXCEPTION 'private_service_slots: only an OPEN slot can be booked';
    END IF;
    IF NEW.status = 'CLOSED'
       AND NOT (public.is_secretary() OR public.is_super_admin()) THEN
      RAISE EXCEPTION 'private_service_slots: only the academy office can close a slot';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_private_service_slots_guard ON public.private_service_slots;
CREATE TRIGGER trg_private_service_slots_guard
  BEFORE INSERT OR UPDATE ON public.private_service_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_private_service_slots_guard();

-- ------------------------------------------------------------------------------
-- 6) trg_audit_private_services: every proposal / price / status change lands
--    in audit_logs (022), so the 027 viewer shows real history without any
--    extra UI work. Shares the caller's transaction: no silent audit gaps.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_audit_private_services()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role text;
BEGIN
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      actor_id, actor_email, actor_role, action, entity_type, entity_id,
      summary, details, source
    ) VALUES (
      auth.uid(), lower(coalesce(auth.jwt() ->> 'email', '')), v_actor_role,
      'private_service.proposed', 'private_service', NEW.id::text,
      'private service proposed: ' || NEW.title,
      jsonb_build_object(
        'instructor_email', NEW.instructor_email,
        'duration_minutes', NEW.duration_minutes,
        'delivery_mode', NEW.delivery_mode
      ),
      'trigger'
    );
    RETURN NEW;
  END IF;

  IF NEW.price IS DISTINCT FROM OLD.price THEN
    INSERT INTO public.audit_logs (
      actor_id, actor_email, actor_role, action, entity_type, entity_id,
      summary, details, source
    ) VALUES (
      auth.uid(), lower(coalesce(auth.jwt() ->> 'email', '')), v_actor_role,
      'private_service.price.set', 'private_service', NEW.id::text,
      'private service priced: ' || NEW.title || ' -> ' || coalesce(NEW.price::text, 'none') || ' ' || NEW.currency,
      jsonb_build_object(
        'old_price', OLD.price, 'new_price', NEW.price,
        'old_currency', OLD.currency, 'new_currency', NEW.currency
      ),
      'trigger'
    );
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.is_published IS DISTINCT FROM OLD.is_published THEN
    INSERT INTO public.audit_logs (
      actor_id, actor_email, actor_role, action, entity_type, entity_id,
      summary, details, source
    ) VALUES (
      auth.uid(), lower(coalesce(auth.jwt() ->> 'email', '')), v_actor_role,
      'private_service.status.change', 'private_service', NEW.id::text,
      'private service status: ' || OLD.status || ' -> ' || NEW.status
        || ' (published: ' || NEW.is_published::text || ')',
      jsonb_build_object(
        'old_status', OLD.status, 'new_status', NEW.status,
        'old_published', OLD.is_published, 'new_published', NEW.is_published
      ),
      'trigger'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_private_services ON public.private_services;
CREATE TRIGGER trg_audit_private_services
  AFTER INSERT OR UPDATE ON public.private_services
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_audit_private_services();

-- ------------------------------------------------------------------------------
-- 7) Instructor RPCs: propose + edit (descriptive fields only).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.propose_private_service(
  p_title text,
  p_description text DEFAULT NULL,
  p_duration_minutes integer DEFAULT 60,
  p_delivery_mode text DEFAULT 'external_link'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  v_name text;
  v_mode text := lower(btrim(coalesce(p_delivery_mode, 'external_link')));
  v_id uuid;
BEGIN
  IF NOT public.is_instructor() THEN
    RAISE EXCEPTION 'forbidden: only an instructor can propose a private service';
  END IF;
  IF v_email = '' THEN
    RAISE EXCEPTION 'forbidden: no authenticated email';
  END IF;
  IF v_mode NOT IN ('external_link', 'internal') THEN
    RAISE EXCEPTION 'private service: invalid delivery mode %', p_delivery_mode;
  END IF;

  SELECT name INTO v_name
  FROM public.instructor_profiles
  WHERE lower(btrim(email)) = v_email
  LIMIT 1;

  INSERT INTO public.private_services (
    instructor_email, instructor_name, title, description,
    duration_minutes, delivery_mode, status, is_published,
    created_by, created_by_email
  ) VALUES (
    v_email, coalesce(v_name, auth.jwt() ->> 'email'), btrim(p_title), nullif(btrim(coalesce(p_description, '')), ''),
    coalesce(p_duration_minutes, 60), v_mode, 'PROPOSED', false,
    auth.uid(), v_email
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.propose_private_service(text, text, integer, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.propose_private_service(text, text, integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_my_private_service(
  p_service_id uuid,
  p_title text,
  p_description text DEFAULT NULL,
  p_duration_minutes integer DEFAULT 60,
  p_delivery_mode text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  v_mode text;
  v_row public.private_services;
BEGIN
  SELECT * INTO v_row FROM public.private_services WHERE id = p_service_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'private service not found';
  END IF;
  IF lower(btrim(v_row.instructor_email)) <> v_email THEN
    RAISE EXCEPTION 'forbidden: this service belongs to another instructor';
  END IF;

  v_mode := lower(btrim(coalesce(p_delivery_mode, v_row.delivery_mode)));
  IF v_mode NOT IN ('external_link', 'internal') THEN
    RAISE EXCEPTION 'private service: invalid delivery mode %', p_delivery_mode;
  END IF;

  UPDATE public.private_services
  SET title = btrim(p_title),
      description = nullif(btrim(coalesce(p_description, '')), ''),
      duration_minutes = coalesce(p_duration_minutes, v_row.duration_minutes),
      delivery_mode = v_mode
  WHERE id = p_service_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_private_service(uuid, text, text, integer, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.update_my_private_service(uuid, text, text, integer, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 8) Office RPCs: price, publish/activate/archive.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_private_service_price(
  p_service_id uuid,
  p_price numeric,
  p_currency text DEFAULT 'EGP'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_currency text := upper(btrim(coalesce(p_currency, 'EGP')));
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can price a private service';
  END IF;
  IF p_price IS NULL OR p_price <= 0 THEN
    RAISE EXCEPTION 'private service: price must be greater than zero';
  END IF;
  IF char_length(v_currency) <> 3 THEN
    RAISE EXCEPTION 'private service: invalid currency %', p_currency;
  END IF;

  UPDATE public.private_services
  SET price = round(p_price, 2),
      currency = v_currency,
      priced_by = auth.uid(),
      priced_by_email = lower(coalesce(auth.jwt() ->> 'email', '')),
      priced_at = now()
  WHERE id = p_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'private service not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_private_service_price(uuid, numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_private_service_price(uuid, numeric, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_private_service_status(
  p_service_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text := upper(btrim(coalesce(p_status, '')));
  v_price numeric;
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can change a private service status';
  END IF;
  IF v_status NOT IN ('ACTIVE', 'ARCHIVED') THEN
    RAISE EXCEPTION 'private service: status must be ACTIVE or ARCHIVED (use the propose/edit RPCs for PROPOSED)';
  END IF;

  SELECT price INTO v_price FROM public.private_services WHERE id = p_service_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'private service not found';
  END IF;
  IF v_status = 'ACTIVE' AND (v_price IS NULL OR v_price <= 0) THEN
    RAISE EXCEPTION 'private service: set a price before activating';
  END IF;

  UPDATE public.private_services
  SET status = v_status,
      is_published = (v_status = 'ACTIVE'),
      published_at = CASE WHEN v_status = 'ACTIVE' THEN now() ELSE published_at END,
      archived_at = CASE WHEN v_status = 'ARCHIVED' THEN now() ELSE NULL END
  WHERE id = p_service_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_private_service_status(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_private_service_status(uuid, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 9) Slot RPCs: office creates / closes; a BOOKED slot is never touched here.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_private_service_slot(
  p_service_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_timezone text DEFAULT 'Africa/Cairo'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service public.private_services;
  v_id uuid;
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can create bookable slots';
  END IF;

  SELECT * INTO v_service FROM public.private_services WHERE id = p_service_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'private service not found';
  END IF;
  IF v_service.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'private service: slots can only be added to an ACTIVE service';
  END IF;

  IF p_starts_at IS NULL OR p_ends_at IS NULL OR p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'invalid slot window: % .. %', p_starts_at, p_ends_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.private_service_slots s
    WHERE s.service_id = p_service_id
      AND s.status <> 'CLOSED'
      AND s.starts_at < p_ends_at
      AND s.ends_at > p_starts_at
  ) THEN
    RAISE EXCEPTION 'private service: this slot overlaps an existing slot';
  END IF;

  INSERT INTO public.private_service_slots (
    service_id, starts_at, ends_at, timezone, status, created_by, created_by_email
  ) VALUES (
    p_service_id, p_starts_at, p_ends_at,
    coalesce(nullif(btrim(p_timezone), ''), 'Africa/Cairo'),
    'OPEN', auth.uid(), lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_private_service_slot(uuid, timestamptz, timestamptz, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_private_service_slot(uuid, timestamptz, timestamptz, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.close_private_service_slot(p_slot_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can close a slot';
  END IF;

  SELECT status INTO v_status FROM public.private_service_slots WHERE id = p_slot_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'slot not found';
  END IF;
  IF v_status <> 'OPEN' THEN
    RAISE EXCEPTION 'private service: only an OPEN slot can be closed (current: %)', v_status;
  END IF;

  UPDATE public.private_service_slots SET status = 'CLOSED' WHERE id = p_slot_id;
END;
$$;

REVOKE ALL ON FUNCTION public.close_private_service_slot(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.close_private_service_slot(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 10) Read RPCs (definer: office visibility without loosening table RLS).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.office_list_private_services()
RETURNS TABLE (
  id uuid,
  instructor_email text,
  instructor_name text,
  title text,
  description text,
  duration_minutes integer,
  delivery_mode text,
  price numeric,
  currency text,
  status text,
  is_published boolean,
  open_slots integer,
  created_at timestamptz,
  priced_at timestamptz,
  published_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.instructor_email, s.instructor_name, s.title, s.description,
         s.duration_minutes, s.delivery_mode, s.price, s.currency, s.status,
         s.is_published,
         (SELECT count(*)::int FROM public.private_service_slots sl
           WHERE sl.service_id = s.id AND sl.status = 'OPEN') AS open_slots,
         s.created_at, s.priced_at, s.published_at
  FROM public.private_services s
  WHERE public.is_secretary() OR public.is_super_admin()
  ORDER BY s.created_at DESC
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.office_list_private_services() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_list_private_services() TO authenticated;

CREATE OR REPLACE FUNCTION public.list_my_private_services()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  duration_minutes integer,
  delivery_mode text,
  price numeric,
  currency text,
  status text,
  is_published boolean,
  open_slots integer,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.title, s.description, s.duration_minutes, s.delivery_mode,
         s.price, s.currency, s.status, s.is_published,
         (SELECT count(*)::int FROM public.private_service_slots sl
           WHERE sl.service_id = s.id AND sl.status = 'OPEN') AS open_slots,
         s.created_at
  FROM public.private_services s
  WHERE lower(btrim(s.instructor_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
  ORDER BY s.created_at DESC
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.list_my_private_services() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_my_private_services() TO authenticated;

CREATE OR REPLACE FUNCTION public.office_list_private_service_slots(p_service_id uuid)
RETURNS TABLE (
  id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  status text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sl.id, sl.starts_at, sl.ends_at, sl.timezone, sl.status, sl.created_at
  FROM public.private_service_slots sl
  WHERE sl.service_id = p_service_id
    AND (public.is_secretary() OR public.is_super_admin())
  ORDER BY sl.starts_at ASC
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.office_list_private_service_slots(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_list_private_service_slots(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 11) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 028 (private services catalog: private_services + private_service_slots, instructor proposes / office prices-publishes-schedules, delivery_mode external_link now + internal reserved for the future live server, trigger-based audit into audit_logs, zero client write policies, no bookings or money yet; zero rows fabricated) applied';
