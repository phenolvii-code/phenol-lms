import { supabase } from '@/lib/supabase';

// ==============================================================================
// Audit-log data module (migration 027).
// READ-ONLY. The only door is the founder-gated RPC
// `founder_list_audit_logs`; audit_logs has no client write policy at all.
// Failure is surfaced (never swallowed into fake rows).
// ==============================================================================

export type AuditSource = 'manual' | 'rpc' | 'trigger' | 'webhook' | 'system';

export interface AuditLogRow {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  details: Record<string, unknown> | null;
  source: AuditSource | null;
  note: string | null;
  total_count: number;
}

export interface AuditLogFilters {
  action?: string;
  actorEmail?: string;
  entityType?: string;
  entityId?: string;
  source?: AuditSource | '';
  from?: string; // ISO timestamp (inclusive)
  to?: string;   // ISO timestamp (inclusive)
  limit?: number;
  offset?: number;
}

export interface AuditLogPage {
  rows: AuditLogRow[];
  total: number;
  error: string | null;
}

export const AUDIT_PAGE_SIZE = 50;

export async function listAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogPage> {
  const { data, error } = await supabase.rpc('founder_list_audit_logs', {
    p_action: filters.action?.trim() || null,
    p_actor_email: filters.actorEmail?.trim() || null,
    p_entity_type: filters.entityType?.trim() || null,
    p_entity_id: filters.entityId?.trim() || null,
    p_source: filters.source || null,
    p_from: filters.from || null,
    p_to: filters.to || null,
    p_limit: filters.limit ?? AUDIT_PAGE_SIZE,
    p_offset: filters.offset ?? 0,
  });

  if (error) {
    console.error('Error loading audit logs:', error.message);
    return { rows: [], total: 0, error: error.message };
  }

  const rows = ((data as AuditLogRow[]) || []).map((r) => ({
    ...r,
    total_count: Number(r.total_count) || 0,
  }));

  return {
    rows,
    total: rows.length > 0 ? rows[0].total_count : 0,
    error: null,
  };
}
