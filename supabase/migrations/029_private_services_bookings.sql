-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 029
-- PRIVATE SERVICES STAGE 2 - BOOKINGS (PAY-FIRST-THEN-CONFIRM)
-- ==============================================================================
--
-- WHY THIS MIGRATION EXISTS
--   Stage 1 (028 + 028b) built the governed private-services catalog and
--   office-scheduled slots. Stage 2 (029) builds the booking lifecycle on top
--   of that catalog without coupling yet to the full money/settlement ledger
--   (which arrives in 030: private_service_payments).
--
-- GOVERNANCE MODEL (locked by the owner)
--   1. Pay first, then confirm: a booking can NEVER enter CONFIRMED (or
--      COMPLETED / NO_SHOW) unless payment_verified = true with a timestamp
--      and payment reference stamped by the academy office (or by 030's
--      payment-verification trigger).
--   2. Two scheduling modes:
--        - 'office_slot': student picks an OPEN slot from private_service_slots
--          (atomically locked FOR UPDATE and marked BOOKED; unique partial
--          index prevents double-booking).
--        - 'student_proposed': student proposes a future start time; end time
--          is computed from the service's duration_minutes, and the office can
--          adjust the window before confirming.
--   3. Venue readiness:
--        - delivery_mode = 'external_link' requires a session_link (Zoom/Meet)
--          before confirmation.
--        - delivery_mode = 'internal' reserves internal_room_ref for the
--          platform's future live-session server (zero schema changes later).
--        - No session_link or internal_room_ref can be attached before payment
--          is verified, and student reads only expose the venue link once the
--          booking is CONFIRMED or COMPLETED.
--   4. Status lifecycle:
--        REQUESTED -> AWAITING_PAYMENT -> CONFIRMED -> COMPLETED / CANCELLED / NO_SHOW
--        (REQUESTED can also move directly to CONFIRMED once payment_verified
--        is true and venue is set, or to CANCELLED with a mandatory reason).
--   5. Cancellation releases any linked BOOKED slot back to OPEN (if still in
--      the future), and booking rows can NEVER be deleted (permanent history).
--
-- SAFETY
--   - Idempotent: CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE, DROP POLICY IF EXISTS.
--   - Zero client write policies on private_service_bookings (definer RPCs only).
--   - Every booking request, payment verification, status transition, and venue
--     update is written to audit_logs (022) by trigger.
--   - Zero rows fabricated: table starts empty.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) private_service_bookings: the booking lifecycle table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.private_service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  service_id uuid NOT NULL REFERENCES public.private_services(id) ON DELETE RESTRICT,
  slot_id    uuid REFERENCES public.private_service_slots(id) ON DELETE SET NULL,

  -- Immutable service & instructor snapshot captured at request time
  instructor_email text NOT NULL,
  instructor_name  text,
  service_title    text NOT NULL,
  duration_minutes integer NOT NULL,
  delivery_mode    text NOT NULL DEFAULT 'external_link',

  -- Immutable student identity captured from auth.uid() / JWT at request time
  student_id    uuid NOT NULL,
  student_email text NOT NULL,
  student_name  text,
  student_phone text,
  student_notes text,

  -- 'office_slot' (bound to slot_id) or 'student_proposed' (custom time)
  booking_mode        text NOT NULL,
  scheduled_starts_at timestamptz NOT NULL,
  scheduled_ends_at   timestamptz NOT NULL,
  timezone            text NOT NULL DEFAULT 'Africa/Cairo',

  -- Immutable commercial snapshot from private_services at request time
  price_snapshot numeric(12,2) NOT NULL,
  currency       text NOT NULL DEFAULT 'EGP',

  -- Pay-first-then-confirm gate (stamped by office in 029; linked to ledger in 030)
  payment_verified          boolean NOT NULL DEFAULT false,
  payment_reference         text,
  payment_verified_by       uuid,
  payment_verified_by_email text,
  payment_verified_at       timestamptz,

  -- Session venue ('external_link' uses session_link; 'internal' uses internal_room_ref)
  session_link      text,
  internal_room_ref text,
  office_notes      text,
  cancellation_reason text,

  status text NOT NULL DEFAULT 'REQUESTED',

  requested_at       timestamptz NOT NULL DEFAULT now(),
  confirmed_by       uuid,
  confirmed_by_email text,
  confirmed_at       timestamptz,
  completed_at       timestamptz,
  cancelled_by       uuid,
  cancelled_by_email text,
  cancelled_at       timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT private_service_bookings_status_check
    CHECK (status IN ('REQUESTED', 'AWAITING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  CONSTRAINT private_service_bookings_mode_check
    CHECK (booking_mode IN ('office_slot', 'student_proposed')),
  CONSTRAINT private_service_bookings_delivery_check
    CHECK (delivery_mode IN ('external_link', 'internal')),
  CONSTRAINT private_service_bookings_time_check
    CHECK (scheduled_ends_at > scheduled_starts_at),
  CONSTRAINT private_service_bookings_price_check
    CHECK (price_snapshot > 0),
  CONSTRAINT private_service_bookings_currency_check
    CHECK (char_length(btrim(currency)) = 3),
  CONSTRAINT private_service_bookings_pay_first_check
    CHECK (
      status NOT IN ('CONFIRMED', 'COMPLETED', 'NO_SHOW')
      OR (payment_verified = true AND payment_verified_at IS NOT NULL)
    ),
  CONSTRAINT private_service_bookings_cancel_reason_check
    CHECK (
      status <> 'CANCELLED'
      OR char_length(btrim(coalesce(cancellation_reason, ''))) >= 3
    )
);

-- One active (non-cancelled) booking per office slot at the index level
CREATE UNIQUE INDEX IF NOT EXISTS uq_private_service_bookings_active_slot
  ON public.private_service_bookings (slot_id)
  WHERE slot_id IS NOT NULL AND status <> 'CANCELLED';

CREATE INDEX IF NOT EXISTS idx_private_service_bookings_student
  ON public.private_service_bookings (student_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_private_service_bookings_instructor
  ON public.private_service_bookings (lower(instructor_email), scheduled_starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_private_service_bookings_status
  ON public.private_service_bookings (status, scheduled_starts_at ASC);

-- ------------------------------------------------------------------------------
-- 2) RLS on private_service_bookings: SELECT only, ZERO client write policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.private_service_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "private service bookings read" ON public.private_service_bookings;
CREATE POLICY "private service bookings read" ON public.private_service_bookings
  FOR SELECT USING (
    student_id = auth.uid()
    OR lower(btrim(student_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    OR lower(btrim(instructor_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
    OR public.is_secretary()
    OR public.is_super_admin()
  );

-- NO INSERT / UPDATE / DELETE policies on private_service_bookings.

-- ------------------------------------------------------------------------------
-- 3) Update trg_private_service_slots_guard so the 029 booking cancellation
--    flow can release a BOOKED slot back to OPEN inside a definer RPC.
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
       AND NOT (
         public.is_secretary()
         OR public.is_super_admin()
         OR current_setting('phenol.booking_flow', true) = 'true'
       ) THEN
      RAISE EXCEPTION 'private_service_slots: a BOOKED slot can only be released by the booking flow or the office';
    END IF;
    IF NEW.status = 'BOOKED' AND OLD.status <> 'OPEN' THEN
      RAISE EXCEPTION 'private_service_slots: only an OPEN slot can be booked';
    END IF;
    IF NEW.status = 'CLOSED'
       AND NOT (
         public.is_secretary()
         OR public.is_super_admin()
         OR current_setting('phenol.booking_flow', true) = 'true'
       ) THEN
      RAISE EXCEPTION 'private_service_slots: only the academy office can close a slot';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 4) trg_private_service_bookings_guard: enforces pay-first-then-confirm,
--    immutable identity/price snapshots, legal transitions, and no deletes.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_private_service_bookings_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_office boolean := (public.is_secretary() OR public.is_super_admin());
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'private_service_bookings: booking history is permanent and cannot be deleted - cancel the booking instead';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.instructor_email := lower(btrim(NEW.instructor_email));
    NEW.student_email := lower(btrim(NEW.student_email));
    NEW.currency := upper(btrim(NEW.currency));
    NEW.timezone := coalesce(nullif(btrim(NEW.timezone), ''), 'Africa/Cairo');
    NEW.requested_at := now();
    NEW.updated_at := now();

    IF NEW.price_snapshot IS NULL OR NEW.price_snapshot <= 0 THEN
      RAISE EXCEPTION 'private_service_bookings: price_snapshot must be positive';
    END IF;

    IF NEW.status NOT IN ('REQUESTED', 'AWAITING_PAYMENT') OR NEW.payment_verified THEN
      RAISE EXCEPTION 'private_service_bookings: a new booking must start as REQUESTED (unverified) and pass through pay-first verification';
    END IF;

    IF NEW.session_link IS NOT NULL OR NEW.internal_room_ref IS NOT NULL THEN
      RAISE EXCEPTION 'private_service_bookings: session link or internal room cannot be assigned before payment is verified';
    END IF;

    RETURN NEW;
  END IF;

  -- ---------------- UPDATE ----------------
  IF NEW.service_id IS DISTINCT FROM OLD.service_id
     OR NEW.instructor_email IS DISTINCT FROM OLD.instructor_email
     OR NEW.student_id IS DISTINCT FROM OLD.student_id
     OR NEW.student_email IS DISTINCT FROM OLD.student_email
     OR NEW.price_snapshot IS DISTINCT FROM OLD.price_snapshot
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.booking_mode IS DISTINCT FROM OLD.booking_mode
     OR NEW.delivery_mode IS DISTINCT FROM OLD.delivery_mode
     OR NEW.requested_at IS DISTINCT FROM OLD.requested_at THEN
    RAISE EXCEPTION 'private_service_bookings: identity, mode, and price snapshot are immutable';
  END IF;

  IF OLD.payment_verified AND NOT NEW.payment_verified THEN
    RAISE EXCEPTION 'private_service_bookings: verified payment status cannot be silently reverted';
  END IF;

  -- Non-office callers (student cancellation RPC) may ONLY cancel their own
  -- unconfirmed booking (REQUESTED / AWAITING_PAYMENT -> CANCELLED).
  IF NOT v_is_office THEN
    IF NEW.payment_verified IS DISTINCT FROM OLD.payment_verified
       OR NEW.payment_reference IS DISTINCT FROM OLD.payment_reference
       OR NEW.session_link IS DISTINCT FROM OLD.session_link
       OR NEW.internal_room_ref IS DISTINCT FROM OLD.internal_room_ref
       OR NEW.scheduled_starts_at IS DISTINCT FROM OLD.scheduled_starts_at
       OR NEW.scheduled_ends_at IS DISTINCT FROM OLD.scheduled_ends_at
       OR NEW.office_notes IS DISTINCT FROM OLD.office_notes THEN
      RAISE EXCEPTION 'private_service_bookings: only the academy office can verify payments, set session links, or reschedule bookings';
    END IF;

    IF NOT (OLD.status IN ('REQUESTED', 'AWAITING_PAYMENT') AND NEW.status = 'CANCELLED') THEN
      RAISE EXCEPTION 'private_service_bookings: only the academy office can advance or manage confirmed bookings';
    END IF;
  END IF;

  -- Legal status machine transitions
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IN ('COMPLETED', 'CANCELLED', 'NO_SHOW') THEN
      RAISE EXCEPTION 'private_service_bookings: illegal status transition % -> % (terminal state)', OLD.status, NEW.status;
    END IF;

    IF NOT (
      (OLD.status = 'REQUESTED' AND NEW.status IN ('AWAITING_PAYMENT', 'CONFIRMED', 'CANCELLED'))
      OR (OLD.status = 'AWAITING_PAYMENT' AND NEW.status IN ('CONFIRMED', 'CANCELLED'))
      OR (OLD.status = 'CONFIRMED' AND NEW.status IN ('COMPLETED', 'CANCELLED', 'NO_SHOW'))
    ) THEN
      RAISE EXCEPTION 'private_service_bookings: illegal status transition % -> %', OLD.status, NEW.status;
    END IF;
  END IF;

  -- Pay-first-then-confirm invariant
  IF NEW.status IN ('CONFIRMED', 'COMPLETED', 'NO_SHOW')
     AND NOT (NEW.payment_verified = true AND NEW.payment_verified_at IS NOT NULL) THEN
    RAISE EXCEPTION 'private_service_bookings: pay-first rule - a booking cannot be CONFIRMED without a verified payment';
  END IF;

  IF (NEW.session_link IS NOT NULL OR NEW.internal_room_ref IS NOT NULL)
     AND NOT NEW.payment_verified THEN
    RAISE EXCEPTION 'private_service_bookings: session link or internal room cannot be assigned before payment is verified';
  END IF;

  -- Venue readiness on CONFIRMED
  IF NEW.status = 'CONFIRMED' THEN
    IF NEW.delivery_mode = 'external_link'
       AND char_length(btrim(coalesce(NEW.session_link, ''))) < 8 THEN
      RAISE EXCEPTION 'private_service_bookings: an external_link booking requires a session_link before confirmation';
    END IF;
    IF NEW.delivery_mode = 'internal'
       AND char_length(btrim(coalesce(NEW.internal_room_ref, ''))) < 3 THEN
      RAISE EXCEPTION 'private_service_bookings: an internal booking requires an internal_room_ref before confirmation';
    END IF;
  END IF;

  IF NEW.status = 'CANCELLED'
     AND char_length(btrim(coalesce(NEW.cancellation_reason, ''))) < 3 THEN
    RAISE EXCEPTION 'private_service_bookings: cancellation requires a written reason (at least 3 characters)';
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_private_service_bookings_guard ON public.private_service_bookings;
CREATE TRIGGER trg_private_service_bookings_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.private_service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_private_service_bookings_guard();

-- ------------------------------------------------------------------------------
-- 5) trg_audit_private_service_bookings: writes every booking governance event
--    into audit_logs (022), immediately visible in the 027 founder viewer.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_audit_private_service_bookings()
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
      'private_booking.requested', 'private_service_booking', NEW.id::text,
      'private booking requested: ' || NEW.service_title || ' by ' || NEW.student_email,
      jsonb_build_object(
        'service_id', NEW.service_id,
        'slot_id', NEW.slot_id,
        'instructor_email', NEW.instructor_email,
        'student_email', NEW.student_email,
        'booking_mode', NEW.booking_mode,
        'scheduled_starts_at', NEW.scheduled_starts_at,
        'scheduled_ends_at', NEW.scheduled_ends_at,
        'price_snapshot', NEW.price_snapshot,
        'currency', NEW.currency
      ),
      'trigger'
    );
    RETURN NEW;
  END IF;

  IF NEW.payment_verified AND NOT OLD.payment_verified THEN
    INSERT INTO public.audit_logs (
      actor_id, actor_email, actor_role, action, entity_type, entity_id,
      summary, details, source
    ) VALUES (
      auth.uid(), lower(coalesce(auth.jwt() ->> 'email', '')), v_actor_role,
      'private_booking.payment_verified', 'private_service_booking', NEW.id::text,
      'private booking payment verified: ' || NEW.service_title || ' (' || NEW.price_snapshot::text || ' ' || NEW.currency || ')',
      jsonb_build_object(
        'student_email', NEW.student_email,
        'instructor_email', NEW.instructor_email,
        'price_snapshot', NEW.price_snapshot,
        'currency', NEW.currency,
        'payment_reference', NEW.payment_reference
      ),
      'trigger'
    );
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.audit_logs (
      actor_id, actor_email, actor_role, action, entity_type, entity_id,
      summary, details, source, note
    ) VALUES (
      auth.uid(), lower(coalesce(auth.jwt() ->> 'email', '')), v_actor_role,
      'private_booking.status.change', 'private_service_booking', NEW.id::text,
      'private booking status: ' || OLD.status || ' -> ' || NEW.status || ' (' || NEW.service_title || ')',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'student_email', NEW.student_email,
        'instructor_email', NEW.instructor_email,
        'payment_verified', NEW.payment_verified,
        'cancellation_reason', NEW.cancellation_reason
      ),
      'trigger',
      coalesce(NEW.cancellation_reason, NEW.office_notes)
    );
  END IF;

  IF (NEW.session_link IS DISTINCT FROM OLD.session_link AND NEW.session_link IS NOT NULL)
     OR (NEW.internal_room_ref IS DISTINCT FROM OLD.internal_room_ref AND NEW.internal_room_ref IS NOT NULL) THEN
    INSERT INTO public.audit_logs (
      actor_id, actor_email, actor_role, action, entity_type, entity_id,
      summary, details, source
    ) VALUES (
      auth.uid(), lower(coalesce(auth.jwt() ->> 'email', '')), v_actor_role,
      'private_booking.venue.set', 'private_service_booking', NEW.id::text,
      'private booking venue assigned: ' || NEW.service_title,
      jsonb_build_object(
        'delivery_mode', NEW.delivery_mode,
        'has_session_link', (NEW.session_link IS NOT NULL),
        'internal_room_ref', NEW.internal_room_ref
      ),
      'trigger'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_private_service_bookings ON public.private_service_bookings;
CREATE TRIGGER trg_audit_private_service_bookings
  AFTER INSERT OR UPDATE ON public.private_service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_audit_private_service_bookings();

-- ------------------------------------------------------------------------------
-- 6) Student / Public Catalog & Booking RPCs
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_published_private_services()
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
  open_slots bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id,
         s.instructor_email,
         s.instructor_name,
         s.title,
         s.description,
         s.duration_minutes,
         s.delivery_mode,
         s.price,
         s.currency,
         (SELECT count(*) FROM public.private_service_slots sl
          WHERE sl.service_id = s.id AND sl.status = 'OPEN' AND sl.starts_at > now()) AS open_slots
  FROM public.private_services s
  WHERE s.status = 'ACTIVE'
    AND s.is_published = true
    AND s.price IS NOT NULL
    AND s.price > 0
  ORDER BY s.created_at DESC
  LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.list_published_private_services() FROM public;
GRANT EXECUTE ON FUNCTION public.list_published_private_services() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_open_private_service_slots(p_service_id uuid)
RETURNS TABLE (
  id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sl.id, sl.starts_at, sl.ends_at, sl.timezone
  FROM public.private_service_slots sl
  JOIN public.private_services s ON s.id = sl.service_id
  WHERE sl.service_id = p_service_id
    AND sl.status = 'OPEN'
    AND sl.starts_at > now()
    AND s.status = 'ACTIVE'
    AND s.is_published = true
  ORDER BY sl.starts_at ASC
  LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.list_open_private_service_slots(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.list_open_private_service_slots(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.request_private_service_booking(
  p_service_id uuid,
  p_slot_id uuid DEFAULT NULL,
  p_proposed_starts_at timestamptz DEFAULT NULL,
  p_student_phone text DEFAULT NULL,
  p_student_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  v_student_name text;
  v_student_phone text;
  v_service public.private_services;
  v_slot public.private_service_slots;
  v_mode text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_tz text := 'Africa/Cairo';
  v_booking_id uuid;
BEGIN
  IF v_uid IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'forbidden: authentication is required to book a private service';
  END IF;

  IF (p_slot_id IS NULL AND p_proposed_starts_at IS NULL)
     OR (p_slot_id IS NOT NULL AND p_proposed_starts_at IS NOT NULL) THEN
    RAISE EXCEPTION 'booking: choose either an open office slot OR a proposed start time (not both)';
  END IF;

  SELECT * INTO v_service
  FROM public.private_services
  WHERE id = p_service_id;

  IF NOT FOUND OR v_service.status <> 'ACTIVE' OR NOT v_service.is_published THEN
    RAISE EXCEPTION 'booking: private service is not active and published';
  END IF;

  IF v_service.price IS NULL OR v_service.price <= 0 THEN
    RAISE EXCEPTION 'booking: private service has no valid price';
  END IF;

  IF lower(btrim(v_service.instructor_email)) = v_email THEN
    RAISE EXCEPTION 'booking: an instructor cannot book their own private service';
  END IF;

  IF p_slot_id IS NOT NULL THEN
    v_mode := 'office_slot';
    SELECT * INTO v_slot
    FROM public.private_service_slots
    WHERE id = p_slot_id AND service_id = p_service_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'booking: selected slot does not belong to this service';
    END IF;
    IF v_slot.status <> 'OPEN' THEN
      RAISE EXCEPTION 'booking: selected slot is no longer OPEN';
    END IF;
    IF v_slot.starts_at <= now() THEN
      RAISE EXCEPTION 'booking: selected slot is in the past';
    END IF;

    UPDATE public.private_service_slots
    SET status = 'BOOKED'
    WHERE id = p_slot_id;

    v_starts_at := v_slot.starts_at;
    v_ends_at := v_slot.ends_at;
    v_tz := v_slot.timezone;
  ELSE
    v_mode := 'student_proposed';
    IF p_proposed_starts_at <= now() + interval '5 minutes' THEN
      RAISE EXCEPTION 'booking: proposed start time must be in the future';
    END IF;
    v_starts_at := p_proposed_starts_at;
    v_ends_at := p_proposed_starts_at + make_interval(mins => v_service.duration_minutes);
    v_tz := 'Africa/Cairo';
  END IF;

  SELECT rs.name, rs.phone
  INTO v_student_name, v_student_phone
  FROM public.registered_students rs
  WHERE lower(btrim(rs.email)) = v_email
  LIMIT 1;

  v_student_phone := coalesce(nullif(btrim(coalesce(p_student_phone, '')), ''), v_student_phone);

  INSERT INTO public.private_service_bookings (
    service_id, slot_id,
    instructor_email, instructor_name, service_title, duration_minutes, delivery_mode,
    student_id, student_email, student_name, student_phone, student_notes,
    booking_mode, scheduled_starts_at, scheduled_ends_at, timezone,
    price_snapshot, currency, status
  ) VALUES (
    v_service.id, p_slot_id,
    v_service.instructor_email, v_service.instructor_name, v_service.title, v_service.duration_minutes, v_service.delivery_mode,
    v_uid, v_email, coalesce(v_student_name, split_part(v_email, '@', 1)), v_student_phone,
    nullif(btrim(coalesce(p_student_notes, '')), ''),
    v_mode, v_starts_at, v_ends_at, v_tz,
    v_service.price, v_service.currency, 'REQUESTED'
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_private_service_booking(uuid, uuid, timestamptz, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.request_private_service_booking(uuid, uuid, timestamptz, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_my_private_service_booking(
  p_booking_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  v_row public.private_service_bookings;
BEGIN
  IF v_uid IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'forbidden: authentication is required';
  END IF;

  IF char_length(btrim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION 'cancel booking: please provide a brief reason (at least 3 characters)';
  END IF;

  SELECT * INTO v_row
  FROM public.private_service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking not found';
  END IF;

  IF v_row.student_id <> v_uid AND lower(btrim(v_row.student_email)) <> v_email THEN
    RAISE EXCEPTION 'forbidden: this booking belongs to another student';
  END IF;

  IF v_row.status NOT IN ('REQUESTED', 'AWAITING_PAYMENT') THEN
    RAISE EXCEPTION 'cancel booking: only REQUESTED or AWAITING_PAYMENT bookings can be self-cancelled (contact the academy office for confirmed sessions)';
  END IF;

  PERFORM set_config('phenol.booking_flow', 'true', true);

  UPDATE public.private_service_bookings
  SET status = 'CANCELLED',
      cancellation_reason = btrim(p_reason),
      cancelled_by = v_uid,
      cancelled_by_email = v_email,
      cancelled_at = now()
  WHERE id = p_booking_id;

  IF v_row.slot_id IS NOT NULL THEN
    UPDATE public.private_service_slots
    SET status = CASE WHEN starts_at > now() THEN 'OPEN' ELSE 'CLOSED' END
    WHERE id = v_row.slot_id
      AND status = 'BOOKED';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_my_private_service_booking(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_my_private_service_booking(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_my_student_private_bookings()
RETURNS TABLE (
  id uuid,
  service_id uuid,
  slot_id uuid,
  instructor_email text,
  instructor_name text,
  service_title text,
  duration_minutes integer,
  delivery_mode text,
  booking_mode text,
  scheduled_starts_at timestamptz,
  scheduled_ends_at timestamptz,
  timezone text,
  price_snapshot numeric,
  currency text,
  payment_verified boolean,
  payment_reference text,
  payment_verified_at timestamptz,
  session_link text,
  internal_room_ref text,
  student_notes text,
  office_notes text,
  cancellation_reason text,
  status text,
  requested_at timestamptz,
  confirmed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.service_id, b.slot_id,
         b.instructor_email, b.instructor_name, b.service_title,
         b.duration_minutes, b.delivery_mode, b.booking_mode,
         b.scheduled_starts_at, b.scheduled_ends_at, b.timezone,
         b.price_snapshot, b.currency,
         b.payment_verified, b.payment_reference, b.payment_verified_at,
         -- Venue link is only exposed to the student once CONFIRMED or COMPLETED
         CASE WHEN b.status IN ('CONFIRMED', 'COMPLETED') THEN b.session_link ELSE NULL END AS session_link,
         CASE WHEN b.status IN ('CONFIRMED', 'COMPLETED') THEN b.internal_room_ref ELSE NULL END AS internal_room_ref,
         b.student_notes, b.office_notes, b.cancellation_reason,
         b.status, b.requested_at, b.confirmed_at
  FROM public.private_service_bookings b
  WHERE b.student_id = auth.uid()
     OR lower(btrim(b.student_email)) = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
  ORDER BY b.requested_at DESC
  LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.list_my_student_private_bookings() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_my_student_private_bookings() TO authenticated;

-- ------------------------------------------------------------------------------
-- 7) Instructor Read RPC (scoped to caller, strips student phone/email PII)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_instructor_private_bookings()
RETURNS TABLE (
  id uuid,
  service_id uuid,
  service_title text,
  duration_minutes integer,
  delivery_mode text,
  student_name text,
  student_notes text,
  booking_mode text,
  scheduled_starts_at timestamptz,
  scheduled_ends_at timestamptz,
  timezone text,
  status text,
  session_link text,
  internal_room_ref text,
  requested_at timestamptz,
  confirmed_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
BEGIN
  IF NOT public.is_instructor() THEN
    RAISE EXCEPTION 'forbidden: instructor role required';
  END IF;

  RETURN QUERY
  SELECT b.id, b.service_id, b.service_title,
         b.duration_minutes, b.delivery_mode,
         b.student_name, b.student_notes,
         b.booking_mode, b.scheduled_starts_at, b.scheduled_ends_at, b.timezone,
         b.status,
         CASE WHEN b.status IN ('CONFIRMED', 'COMPLETED') THEN b.session_link ELSE NULL END,
         CASE WHEN b.status IN ('CONFIRMED', 'COMPLETED') THEN b.internal_room_ref ELSE NULL END,
         b.requested_at, b.confirmed_at
  FROM public.private_service_bookings b
  WHERE lower(btrim(b.instructor_email)) = v_email
  ORDER BY b.scheduled_starts_at DESC
  LIMIT 150;
END;
$$;

REVOKE ALL ON FUNCTION public.list_instructor_private_bookings() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.list_instructor_private_bookings() TO authenticated;

-- ------------------------------------------------------------------------------
-- 8) Academy Office RPCs: list, awaiting-payment, verify-payment, confirm, status
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.office_list_private_service_bookings(
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  service_id uuid,
  slot_id uuid,
  instructor_email text,
  instructor_name text,
  service_title text,
  duration_minutes integer,
  delivery_mode text,
  student_id uuid,
  student_email text,
  student_name text,
  student_phone text,
  student_notes text,
  booking_mode text,
  scheduled_starts_at timestamptz,
  scheduled_ends_at timestamptz,
  timezone text,
  price_snapshot numeric,
  currency text,
  payment_verified boolean,
  payment_reference text,
  payment_verified_by_email text,
  payment_verified_at timestamptz,
  session_link text,
  internal_room_ref text,
  office_notes text,
  cancellation_reason text,
  status text,
  requested_at timestamptz,
  confirmed_by_email text,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_by_email text,
  cancelled_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: academy office access required';
  END IF;

  RETURN QUERY
  SELECT b.id, b.service_id, b.slot_id,
         b.instructor_email, b.instructor_name, b.service_title,
         b.duration_minutes, b.delivery_mode,
         b.student_id, b.student_email, b.student_name, b.student_phone, b.student_notes,
         b.booking_mode, b.scheduled_starts_at, b.scheduled_ends_at, b.timezone,
         b.price_snapshot, b.currency,
         b.payment_verified, b.payment_reference, b.payment_verified_by_email, b.payment_verified_at,
         b.session_link, b.internal_room_ref, b.office_notes, b.cancellation_reason,
         b.status, b.requested_at,
         b.confirmed_by_email, b.confirmed_at, b.completed_at,
         b.cancelled_by_email, b.cancelled_at
  FROM public.private_service_bookings b
  WHERE (p_status IS NULL OR btrim(p_status) = '' OR b.status = upper(btrim(p_status)))
  ORDER BY b.requested_at DESC
  LIMIT 300;
END;
$$;

REVOKE ALL ON FUNCTION public.office_list_private_service_bookings(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_list_private_service_bookings(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.office_mark_private_booking_awaiting_payment(
  p_booking_id uuid,
  p_starts_at timestamptz DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL,
  p_office_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.private_service_bookings;
  v_starts timestamptz;
  v_ends timestamptz;
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can review private bookings';
  END IF;

  SELECT * INTO v_row
  FROM public.private_service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking not found';
  END IF;

  IF v_row.status NOT IN ('REQUESTED', 'AWAITING_PAYMENT') THEN
    RAISE EXCEPTION 'booking: can only move REQUESTED bookings to AWAITING_PAYMENT (current: %)', v_row.status;
  END IF;

  v_starts := coalesce(p_starts_at, v_row.scheduled_starts_at);
  v_ends := coalesce(p_ends_at, v_row.scheduled_ends_at);
  IF v_ends <= v_starts THEN
    RAISE EXCEPTION 'booking: scheduled end time must be after start time';
  END IF;

  UPDATE public.private_service_bookings
  SET status = 'AWAITING_PAYMENT',
      scheduled_starts_at = v_starts,
      scheduled_ends_at = v_ends,
      office_notes = coalesce(nullif(btrim(coalesce(p_office_notes, '')), ''), office_notes)
  WHERE id = p_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.office_mark_private_booking_awaiting_payment(uuid, timestamptz, timestamptz, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_mark_private_booking_awaiting_payment(uuid, timestamptz, timestamptz, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.office_verify_private_booking_payment(
  p_booking_id uuid,
  p_payment_reference text,
  p_office_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.private_service_bookings;
  v_ref text := btrim(coalesce(p_payment_reference, ''));
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can verify private booking payments';
  END IF;

  IF char_length(v_ref) < 2 THEN
    RAISE EXCEPTION 'verify payment: a payment reference or receipt identifier is required';
  END IF;

  SELECT * INTO v_row
  FROM public.private_service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking not found';
  END IF;

  IF v_row.status IN ('CANCELLED', 'COMPLETED', 'NO_SHOW') THEN
    RAISE EXCEPTION 'verify payment: cannot verify payment on a % booking', v_row.status;
  END IF;

  UPDATE public.private_service_bookings
  SET payment_verified = true,
      payment_reference = v_ref,
      payment_verified_by = auth.uid(),
      payment_verified_by_email = lower(coalesce(auth.jwt() ->> 'email', '')),
      payment_verified_at = coalesce(payment_verified_at, now()),
      status = CASE WHEN status = 'REQUESTED' THEN 'AWAITING_PAYMENT' ELSE status END,
      office_notes = coalesce(nullif(btrim(coalesce(p_office_notes, '')), ''), office_notes)
  WHERE id = p_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.office_verify_private_booking_payment(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_verify_private_booking_payment(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.office_confirm_private_service_booking(
  p_booking_id uuid,
  p_session_link text DEFAULT NULL,
  p_internal_room_ref text DEFAULT NULL,
  p_starts_at timestamptz DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL,
  p_office_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.private_service_bookings;
  v_link text;
  v_room text;
  v_starts timestamptz;
  v_ends timestamptz;
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can confirm private bookings';
  END IF;

  SELECT * INTO v_row
  FROM public.private_service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking not found';
  END IF;

  IF NOT v_row.payment_verified OR v_row.payment_verified_at IS NULL THEN
    RAISE EXCEPTION 'confirm booking: pay-first rule - verify payment before confirming this booking';
  END IF;

  IF v_row.status NOT IN ('REQUESTED', 'AWAITING_PAYMENT', 'CONFIRMED') THEN
    RAISE EXCEPTION 'confirm booking: cannot confirm a booking in status %', v_row.status;
  END IF;

  v_link := coalesce(nullif(btrim(coalesce(p_session_link, '')), ''), v_row.session_link);
  v_room := coalesce(nullif(btrim(coalesce(p_internal_room_ref, '')), ''), v_row.internal_room_ref);
  v_starts := coalesce(p_starts_at, v_row.scheduled_starts_at);
  v_ends := coalesce(p_ends_at, v_row.scheduled_ends_at);

  IF v_ends <= v_starts THEN
    RAISE EXCEPTION 'confirm booking: scheduled end time must be after start time';
  END IF;

  IF v_row.delivery_mode = 'external_link' AND char_length(coalesce(v_link, '')) < 8 THEN
    RAISE EXCEPTION 'confirm booking: an external session link (Zoom / Meet URL) is required to confirm';
  END IF;

  IF v_row.delivery_mode = 'internal' AND char_length(coalesce(v_room, '')) < 3 THEN
    RAISE EXCEPTION 'confirm booking: an internal live-server room reference is required to confirm';
  END IF;

  UPDATE public.private_service_bookings
  SET status = 'CONFIRMED',
      session_link = v_link,
      internal_room_ref = v_room,
      scheduled_starts_at = v_starts,
      scheduled_ends_at = v_ends,
      office_notes = coalesce(nullif(btrim(coalesce(p_office_notes, '')), ''), office_notes),
      confirmed_by = coalesce(confirmed_by, auth.uid()),
      confirmed_by_email = coalesce(confirmed_by_email, lower(coalesce(auth.jwt() ->> 'email', ''))),
      confirmed_at = coalesce(confirmed_at, now())
  WHERE id = p_booking_id;
END;
$$;

REVOKE ALL ON FUNCTION public.office_confirm_private_service_booking(uuid, text, text, timestamptz, timestamptz, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_confirm_private_service_booking(uuid, text, text, timestamptz, timestamptz, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.office_set_private_booking_status(
  p_booking_id uuid,
  p_status text,
  p_reason text DEFAULT NULL,
  p_office_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.private_service_bookings;
  v_target text := upper(btrim(coalesce(p_status, '')));
BEGIN
  IF NOT (public.is_secretary() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden: only the academy office can update private booking status';
  END IF;

  IF v_target NOT IN ('COMPLETED', 'NO_SHOW', 'CANCELLED') THEN
    RAISE EXCEPTION 'booking status: use office_confirm_private_service_booking to confirm, or choose COMPLETED, NO_SHOW, or CANCELLED';
  END IF;

  SELECT * INTO v_row
  FROM public.private_service_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking not found';
  END IF;

  IF v_target = 'CANCELLED' AND char_length(btrim(coalesce(p_reason, ''))) < 3 THEN
    RAISE EXCEPTION 'cancel booking: a written cancellation reason (at least 3 characters) is required';
  END IF;

  PERFORM set_config('phenol.booking_flow', 'true', true);

  UPDATE public.private_service_bookings
  SET status = v_target,
      cancellation_reason = CASE WHEN v_target = 'CANCELLED' THEN btrim(p_reason) ELSE cancellation_reason END,
      cancelled_by = CASE WHEN v_target = 'CANCELLED' THEN auth.uid() ELSE cancelled_by END,
      cancelled_by_email = CASE WHEN v_target = 'CANCELLED' THEN lower(coalesce(auth.jwt() ->> 'email', '')) ELSE cancelled_by_email END,
      cancelled_at = CASE WHEN v_target = 'CANCELLED' THEN now() ELSE cancelled_at END,
      completed_at = CASE WHEN v_target = 'COMPLETED' THEN now() ELSE completed_at END,
      office_notes = coalesce(nullif(btrim(coalesce(p_office_notes, '')), ''), office_notes)
  WHERE id = p_booking_id;

  -- If a slot-backed booking is cancelled, release the slot back to OPEN if it is still in the future.
  IF v_target = 'CANCELLED' AND v_row.slot_id IS NOT NULL THEN
    UPDATE public.private_service_slots
    SET status = CASE WHEN starts_at > now() THEN 'OPEN' ELSE 'CLOSED' END
    WHERE id = v_row.slot_id
      AND status = 'BOOKED';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.office_set_private_booking_status(uuid, text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.office_set_private_booking_status(uuid, text, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 9) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 029 (private services stage 2 - bookings: private_service_bookings, pay-first-then-confirm gate, office_slot + student_proposed modes, active-slot unique index, external session_link + internal_room_ref reserved, trigger-based audit into audit_logs, zero client write policies; zero rows fabricated) applied';
