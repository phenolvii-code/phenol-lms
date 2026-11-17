-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 022
-- audit_logs: the academy's tamper-proof action record (GOVERNANCE Phase 1,
-- step 3 of 020-026)
--
-- WHY:
--   Centralized governance (brief §7) needs accountability: WHO did WHAT, to
--   WHICH entity, WHEN, and WHY. Today the governance RPCs
--   (admin_set_user_role, decide_instructor_request, admin_enroll_student,
--   set_course_approval) leave no permanent trace. This migration creates the
--   append-only ledger that all later migrations (023 payment verification,
--   024 pricing decisions, 025 settlements, 026 private services) write into,
--   plus ONE automatic capture that works from day one: every profile ROLE
--   change is logged without touching the existing RPC (zero rewrite risk).
--
-- WHAT THIS DOES:
--   1. audit_logs: append-only table.
--        - NO client INSERT/UPDATE/DELETE policies at all: clients can never
--          write (rows arrive via security-definer paths) and can never read
--          (read = super_admin ONLY - the log itself is sensitive: it
--          documents internal decisions).
--        - trg_audit_logs_guard fires BEFORE UPDATE OR DELETE for EVERYONE -
--          super_admin, maintenance SQL, security-definer functions (triggers
--          fire inside definer functions too). NOTHING can edit or erase
--          history. Not even the founder. Brief §7 hard rule.
--   2. log_academy_action(): security-definer RPC for structured manual/RPC
--      logging. Callable ONLY by super_admin or secretary (is_admin() is never
--      trusted). Later flows call this or insert directly from definer code.
--   3. trg_audit_role_change on profiles: AFTER UPDATE OF role - logs
--      old_role -> new_role with actor identity. This makes every role change
--      auditable immediately (admin_set_user_role, and any other path) with
--      ZERO changes to existing functions. The audit insert runs in the SAME
--      transaction: if the audit write fails, the role change fails - the
--      ledger is never allowed to silently miss a change.
--   4. Actor identity is SNAPSHOTTED (id + email + role at write time) - later
--      role changes never rewrite history ("x was a secretary when she did
--      this" stays true).
--
-- HARD GUARANTEES:
--   - audit_logs starts EMPTY (no fabricated history), fills with real events.
--   - Append-only for everyone; no update/delete path exists anywhere.
--   - Zero changes to any existing function, policy, or trigger.
--   - No new client write permission anywhere (table has write-side RLS
--     closure: no policies = denied).
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it (errors-log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) audit_logs: the append-only record. Read = super_admin ONLY. No client
--    write policies of any kind (brief §7: the audit trail is never editable,
--    and seeing it is a founder-only power).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- ---- ACTOR SNAPSHOT (frozen at write time - never rewritten) ----
  actor_id uuid,
  actor_email text,
  actor_role text,                      -- role AT THE TIME of the action
  -- ---- WHAT happened ----
  action text NOT NULL,                 -- dot-notation: 'role.change', 'payment.verify', 'course.price.set', ...
  entity_type text,                     -- 'profile', 'course', 'payment', 'enrollment', 'instructor_request', ...
  entity_id text,                       -- id of the affected row (text to fit text-keyed tables)
  summary text,                         -- human-readable one-liner for the log viewer
  details jsonb,                        -- structured payload (before/after snapshots, amounts, reasons)
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','rpc','trigger','webhook','system')),
  note text                             -- free-text reason (accountability)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Read: super_admin ONLY. Not even the secretary (the log documents internal
-- governance; her own actions ARE in it).
DROP POLICY IF EXISTS "audit logs read super_admin" ON public.audit_logs;
CREATE POLICY "audit logs read super_admin" ON public.audit_logs
  FOR SELECT USING (public.is_super_admin());

-- NO INSERT / UPDATE / DELETE policies: clients can never write or alter the
-- log. Definer functions + triggers write it (house pattern, quiz_submissions).

-- ------------------------------------------------------------------------------
-- 1b) trg_audit_logs_guard: APPEND-ONLY at the DB level, for EVERY writer -
--     even super_admin, even maintenance SQL, even definer functions (triggers
--     fire inside them). There is NO update/delete path to history, ever.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_audit_logs_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'audit_logs: history is immutable - UPDATE is forbidden for everyone (append-only ledger)';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'audit_logs: history is immutable - DELETE is forbidden for everyone (append-only ledger)';
  END IF;
  RETURN NEW;  -- INSERT: allowed (shape validated at call sites + NOT NULL action)
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_guard ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_guard
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_audit_logs_guard();

-- ------------------------------------------------------------------------------
-- 2) log_academy_action: the structured logging RPC. super_admin OR secretary
--    ONLY (explicit allow-list - is_admin() is never trusted). Later
--    migrations (023 payment verification, 024 pricing, 025 settlements) call
--    this from inside their own definer flows so every governance action
--    leaves a permanent, attributable row.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_academy_action(
  p_action text,
  p_entity_type text DEFAULT NULL,
  p_entity_id text DEFAULT NULL,
  p_summary text DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_source text DEFAULT 'rpc'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_actor_role text;
BEGIN
  -- Allow-list gate: super_admin or secretary only. Instructors/students/anon
  -- can never fabricate audit entries.
  IF NOT (public.is_super_admin() OR public.is_secretary()) THEN
    RAISE EXCEPTION 'forbidden: only the academy founder or secretary can write audit entries';
  END IF;

  IF p_action IS NULL OR btrim(p_action) = '' THEN
    RAISE EXCEPTION 'audit_logs: action is required';
  END IF;
  IF p_source NOT IN ('manual','rpc','webhook') THEN
    RAISE EXCEPTION 'audit_logs: invalid source %', p_source;
  END IF;

  -- Actor role snapshot at write time (kept even if the actor's role changes
  -- later - history stays truthful).
  SELECT role INTO v_actor_role
  FROM public.profiles
  WHERE id = auth.uid();

  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role,
    action, entity_type, entity_id, summary, details, source, note
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    lower(btrim(p_action)),
    p_entity_type, p_entity_id, p_summary, p_details,
    p_source, p_note
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_academy_action(text, text, text, text, jsonb, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.log_academy_action(text, text, text, text, jsonb, text, text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3) trg_audit_role_change on profiles: automatic capture of ROLE changes.
--    Works from day one against admin_set_user_role (and ANY other path that
--    touches profiles.role) with ZERO rewrite of existing functions. The audit
--    insert shares the caller's transaction: if the audit write fails, the
--    role change rolls back - the ledger never silently misses a change.
--    NOTE: the actor snapshot here is auth-level (SQL Editor runs without a
--    JWT -> actor null, still logged: the change itself is always recorded).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_audit_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role text;
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;  -- nothing to audit
  END IF;

  SELECT role INTO v_actor_role
  FROM public.profiles
  WHERE id = auth.uid();

  INSERT INTO public.audit_logs (
    actor_id, actor_email, actor_role,
    action, entity_type, entity_id, summary, details, source
  ) VALUES (
    auth.uid(),
    lower(coalesce(auth.jwt() ->> 'email', '')),
    v_actor_role,
    'role.change',
    'profile',
    NEW.id::text,
    'role changed: ' || OLD.role || ' -> ' || NEW.role,
    jsonb_build_object(
      'old_role', OLD.role,
      'new_role', NEW.role,
      'target_email', (select lower(email) from auth.users where id = NEW.id)
    ),
    'trigger'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_role_change ON public.profiles;
CREATE TRIGGER trg_audit_role_change
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_audit_role_change();

-- ------------------------------------------------------------------------------
-- 4) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 022 (audit_logs: append-only tamper-proof action ledger - guard forbids UPDATE/DELETE for everyone, read super_admin-only, log_academy_action RPC for super_admin/secretary, automatic role-change capture on profiles; zero rows fabricated) applied';
