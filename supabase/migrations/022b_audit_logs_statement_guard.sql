-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 022b (addendum to 022_audit_logs.sql)
-- Statement-level tamper guard for audit_logs
--
-- WHY:
--   The row-level guard (trg_audit_logs_guard, FOR EACH ROW) correctly refuses
--   to let any row be edited or erased. But an UPDATE/DELETE run against an
--   EMPTY table touches zero rows, so a row-level trigger never fires and the
--   command returns "Success. No rows returned". That is normal SQL semantics,
--   not a hole - but the tamper-proofing should refuse AT THE COMMAND LEVEL,
--   unconditionally, so the guarantee is self-evident to anyone who tests it.
--
-- WHAT THIS DOES:
--   Adds trg_audit_logs_guard_statement: BEFORE UPDATE OR DELETE FOR EACH
--   STATEMENT - fires once per command BEFORE it starts, even when the table
--   is empty or the WHERE clause matches nothing. Every UPDATE/DELETE attempt
--   on audit_logs is now refused for EVERYONE (super_admin, maintenance SQL,
--   definer functions), empty table or not.
--   The row-level guard stays as the second layer.
--
-- HARD GUARANTEES:
--   - INSERTs unaffected (append-only ledger keeps working).
--   - No policy, function, or table from 000-022 is touched.
--
-- BEFORE RUNNING:
--   1. Full database backup (Supabase > Database > Backups).
--   2. Paste the FULL file into the SQL Editor and run it.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.trg_audit_logs_guard_statement()
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
  RETURN NULL;  -- never reached (INSERT is not bound to this trigger)
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_guard_statement ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_guard_statement
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trg_audit_logs_guard_statement();

-- ------------------------------------------------------------------------------
-- Audit marker (stays through 022; this is an addendum, not a new phase)
-- ------------------------------------------------------------------------------
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations through 022 (audit_logs: append-only tamper-proof action ledger - row-level + statement-level guards forbid UPDATE/DELETE for everyone even on an empty table, read super_admin-only, log_academy_action RPC for super_admin/secretary, automatic role-change capture on profiles; zero rows fabricated) applied';
