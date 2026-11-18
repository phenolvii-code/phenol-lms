-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 027
-- AUDIT-LOG VIEWER (founder-only, READ-ONLY)
-- ==============================================================================
--
-- WHY THIS MIGRATION EXISTS
--   022 created audit_logs: an append-only, tamper-proof ledger whose read RLS
--   is `is_super_admin()` ONLY. The data has been accumulating since, but the
--   founder could only read it by opening the Supabase SQL Editor. This
--   migration adds the missing READ surface: one server-side (definer) query
--   function with filters + pagination, plus the index that filter needs.
--
-- WHAT THIS MIGRATION DOES **NOT** DO
--   - It does NOT touch audit_logs rows, policies, guard, or write paths.
--   - It adds ZERO write capability. There is still no UPDATE/DELETE path for
--     anyone, and no INSERT path for clients.
--   - It does NOT open the log to secretaries, instructors, students, or anon.
--     The gate is `is_super_admin()` (same as the 022 SELECT policy), NOT
--     `is_admin()` (never trusted) and NOT `is_secretary()`.
--   - It does NOT fabricate rows: an empty ledger returns an empty set.
--
-- SAFETY
--   - Idempotent: CREATE INDEX IF NOT EXISTS + CREATE OR REPLACE FUNCTION.
--   - Read-only: SECURITY DEFINER function that only SELECTs.
--   - search_path pinned to public (house pattern).
--   - p_limit is clamped to 1..200 so a client cannot pull the whole ledger.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it (errors-log rule 8).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1) Index for the viewer's actor filter. 022 indexed actor_id; the founder
--    searches by the SNAPSHOTTED email (actor_email), which had no index.
--    actor_email is stored lower-cased at write time by log_academy_action.
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email
  ON public.audit_logs (actor_email, created_at DESC);

-- ------------------------------------------------------------------------------
-- 2) founder_list_audit_logs: the ONLY read door for the viewer.
--
--    Gate          : is_super_admin() ONLY (founder). Everyone else raises.
--    Filters       : action (partial), actor_email (partial), entity_type
--                    (partial), entity_id (exact), source (exact),
--                    created_at range [p_from, p_to].
--    Pagination    : p_limit (clamped 1..200, default 50) + p_offset.
--    total_count   : window count over the filtered set - lets the UI show
--                    "x of N" without a second round-trip.
--    Ordering      : newest first (created_at DESC, id DESC as a stable tiebreak).
--
--    The body only SELECTs. No INSERT/UPDATE/DELETE, no side effects, no audit
--    of the audit (viewing the log is not a governance action).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.founder_list_audit_logs(
  p_action text DEFAULT NULL,
  p_actor_email text DEFAULT NULL,
  p_entity_type text DEFAULT NULL,
  p_entity_id text DEFAULT NULL,
  p_source text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  actor_id uuid,
  actor_email text,
  actor_role text,
  action text,
  entity_type text,
  entity_id text,
  summary text,
  details jsonb,
  source text,
  note text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_action text := nullif(btrim(coalesce(p_action, '')), '');
  v_actor_email text := nullif(btrim(coalesce(p_actor_email, '')), '');
  v_entity_type text := nullif(btrim(coalesce(p_entity_type, '')), '');
  v_entity_id text := nullif(btrim(coalesce(p_entity_id, '')), '');
  v_source text := nullif(lower(btrim(coalesce(p_source, ''))), '');
BEGIN
  -- Founder only - parity with the 022 SELECT policy on audit_logs.
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden: the audit log is readable by the academy founder only';
  END IF;

  IF v_source IS NOT NULL
     AND v_source NOT IN ('manual', 'rpc', 'trigger', 'webhook', 'system') THEN
    RAISE EXCEPTION 'audit viewer: invalid source %', v_source;
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.created_at,
    a.actor_id,
    a.actor_email,
    a.actor_role,
    a.action,
    a.entity_type,
    a.entity_id,
    a.summary,
    a.details,
    a.source,
    a.note,
    count(*) OVER () AS total_count
  FROM public.audit_logs a
  WHERE (v_action IS NULL OR a.action ILIKE '%' || v_action || '%')
    AND (v_actor_email IS NULL OR a.actor_email ILIKE '%' || v_actor_email || '%')
    AND (v_entity_type IS NULL OR a.entity_type ILIKE '%' || v_entity_type || '%')
    AND (v_entity_id IS NULL OR a.entity_id = v_entity_id)
    AND (v_source IS NULL OR a.source = v_source)
    AND (p_from IS NULL OR a.created_at >= p_from)
    AND (p_to IS NULL OR a.created_at <= p_to)
  ORDER BY a.created_at DESC, a.id DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

-- Client-reachable for authenticated users (the function itself gates on
-- is_super_admin); anon/public can never execute it.
REVOKE ALL ON FUNCTION public.founder_list_audit_logs(
  text, text, text, text, text, timestamptz, timestamptz, integer, integer
) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.founder_list_audit_logs(
  text, text, text, text, text, timestamptz, timestamptz, integer, integer
) TO authenticated;

COMMENT ON FUNCTION public.founder_list_audit_logs(
  text, text, text, text, text, timestamptz, timestamptz, integer, integer
) IS
  'Migration 027: founder-only (is_super_admin) READ of audit_logs with filters + pagination. SECURITY DEFINER, SELECT-only, limit clamped to 200. No write path exists.';

-- ------------------------------------------------------------------------------
-- 3) Audit marker
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 027 (audit-log viewer: founder-only read RPC founder_list_audit_logs with action/actor/entity/source/date filters + pagination, actor_email index, ledger still append-only and unwritable by clients; zero rows fabricated) applied';
