'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import {
  AUDIT_PAGE_SIZE,
  AuditLogFilters,
  AuditLogRow,
  AuditSource,
  listAuditLogs,
} from '@/lib/data/audit';

// ==============================================================================
// Audit-log viewer (migration 027) - FOUNDER ONLY, READ-ONLY.
// Data comes exclusively from the founder-gated RPC `founder_list_audit_logs`.
// Nothing here can write, edit, or delete: the ledger is append-only in the DB.
// ==============================================================================

const SOURCE_OPTIONS: { value: AuditSource | ''; label: string }[] = [
  { value: '', label: 'All sources' },
  { value: 'manual', label: 'manual' },
  { value: 'rpc', label: 'rpc' },
  { value: 'trigger', label: 'trigger' },
  { value: 'webhook', label: 'webhook' },
  { value: 'system', label: 'system' },
];

interface DraftFilters {
  action: string;
  actorEmail: string;
  entityType: string;
  entityId: string;
  source: AuditSource | '';
  fromDate: string;
  toDate: string;
}

const EMPTY_DRAFT: DraftFilters = {
  action: '',
  actorEmail: '',
  entityType: '',
  entityId: '',
  source: '',
  fromDate: '',
  toDate: '',
};

function toIsoStart(date: string): string | undefined {
  if (!date) return undefined;
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function toIsoEnd(date: string): string | undefined {
  if (!date) return undefined;
  const d = new Date(`${date}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export const AuditLogTab: React.FC = () => {
  const [draft, setDraft] = useState<DraftFilters>(EMPTY_DRAFT);
  const [applied, setApplied] = useState<AuditLogFilters>({});
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const page = await listAuditLogs({ ...applied, limit: AUDIT_PAGE_SIZE, offset });
    setRows(page.rows);
    setTotal(page.total);
    setError(page.error);
    setLoading(false);
  }, [applied, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = () => {
    setApplied({
      action: draft.action.trim() || undefined,
      actorEmail: draft.actorEmail.trim() || undefined,
      entityType: draft.entityType.trim() || undefined,
      entityId: draft.entityId.trim() || undefined,
      source: draft.source || undefined,
      from: toIsoStart(draft.fromDate),
      to: toIsoEnd(draft.toDate),
    });
    setOffset(0);
  };

  const resetFilters = () => {
    setDraft(EMPTY_DRAFT);
    setApplied({});
    setOffset(0);
  };

  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = offset + rows.length;
  const canPrev = offset > 0;
  const canNext = offset + AUDIT_PAGE_SIZE < total;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 font-display flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-burgundy-500" />
            <span>Audit Log</span>
          </h2>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Append-only record of governance actions. Read-only: history can never be edited or
            deleted — not even by the founder.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-burgundy-600 uppercase tracking-wider bg-burgundy-50/60 border border-burgundy-200 rounded-full px-3 py-1.5 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Founder only</span>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-5 rounded-2xl border border-hairline bg-white space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-charcoal-100 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <input
            type="text"
            placeholder="action contains… (e.g. role)"
            value={draft.action}
            onChange={(e) => setDraft((d) => ({ ...d, action: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
          />
          <input
            type="text"
            placeholder="actor email contains…"
            value={draft.actorEmail}
            onChange={(e) => setDraft((d) => ({ ...d, actorEmail: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
          />
          <input
            type="text"
            placeholder="entity type (e.g. payment)"
            value={draft.entityType}
            onChange={(e) => setDraft((d) => ({ ...d, entityType: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
          />
          <input
            type="text"
            placeholder="entity id (exact)"
            value={draft.entityId}
            onChange={(e) => setDraft((d) => ({ ...d, entityId: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
          />
          <select
            value={draft.source}
            onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value as AuditSource | '' }))}
            className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-3 py-2 text-[11px] text-charcoal-100 bg-ivory-100 border border-hairline rounded-xl">
            <span className="shrink-0 font-mono uppercase tracking-wider text-[9px]">From</span>
            <input
              type="date"
              value={draft.fromDate}
              onChange={(e) => setDraft((d) => ({ ...d, fromDate: e.target.value }))}
              className="flex-1 bg-transparent focus:outline-none text-charcoal-900"
            />
          </label>
          <label className="flex items-center gap-2 px-3 py-2 text-[11px] text-charcoal-100 bg-ivory-100 border border-hairline rounded-xl">
            <span className="shrink-0 font-mono uppercase tracking-wider text-[9px]">To</span>
            <input
              type="date"
              value={draft.toDate}
              onChange={(e) => setDraft((d) => ({ ...d, toDate: e.target.value }))}
              className="flex-1 bg-transparent focus:outline-none text-charcoal-900"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="flex-1 px-4 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl bg-ivory-200 hover:bg-ivory-300 border border-hairline text-charcoal-100 text-xs font-bold transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Error state (truthful - never replaced with fake rows) */}
      {error && !loading && (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Could not load the audit log.</p>
            <p className="font-mono mt-1 break-all">{error}</p>
          </div>
        </div>
      )}

      {/* Ledger */}
      <div className="rounded-2xl border border-hairline bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-hairline bg-ivory-100">
          <p className="text-[11px] font-sans text-charcoal-100">
            {loading
              ? 'Loading ledger…'
              : total === 0
              ? 'No entries'
              : `Showing ${pageStart}–${pageEnd} of ${total}`}
          </p>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-hairline bg-white hover:bg-ivory-200 text-[11px] font-bold text-charcoal-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-xs text-charcoal-100">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-10 text-center space-y-1.5">
            <ScrollText className="w-6 h-6 text-charcoal-50 mx-auto" />
            <p className="text-sm font-bold text-charcoal-900">No audit entries match these filters.</p>
            <p className="text-[11px] text-charcoal-100 max-w-md mx-auto leading-relaxed">
              The ledger starts empty and fills only with real governance actions (role changes,
              pricing, payment verification, settlements). Nothing is seeded or simulated.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {rows.map((row) => (
              <li key={row.id} className="px-4 sm:px-5 py-3 hover:bg-ivory-100/60 transition-colors">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-charcoal-900 text-ivory-100">
                    {row.action}
                  </span>
                  {row.source && (
                    <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-hairline bg-ivory-200 text-charcoal-100">
                      {row.source}
                    </span>
                  )}
                  <span className="font-formula text-[11px] text-charcoal-100">
                    {new Date(row.created_at).toLocaleString()}
                  </span>
                  <span className="ml-auto font-sans text-[10px] text-charcoal-100">
                    {row.actor_email || 'no actor (system / SQL)'}
                    {row.actor_role ? ` · ${row.actor_role}` : ''}
                  </span>
                </div>

                {row.summary && (
                  <p className="mt-1 text-xs text-charcoal-900 font-sans leading-relaxed">
                    {row.summary}
                  </p>
                )}

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-charcoal-100 font-sans">
                  {row.entity_type && (
                    <span>
                      entity: <span className="font-mono">{row.entity_type}</span>
                      {row.entity_id ? <span className="font-mono"> · {row.entity_id}</span> : null}
                    </span>
                  )}
                  {row.note && (
                    <span>
                      note: <span className="italic">{row.note}</span>
                    </span>
                  )}
                </div>

                {row.details && (
                  <details className="mt-1.5">
                    <summary className="cursor-pointer text-[10px] font-mono font-bold text-burgundy-600 hover:text-burgundy-900 select-none">
                      details
                    </summary>
                    <pre className="mt-1.5 p-2.5 rounded-lg bg-ivory-100 border border-hairline text-[10px] font-mono text-charcoal-900 overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(row.details, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-hairline bg-ivory-100">
          <button
            type="button"
            onClick={() => setOffset(Math.max(0, offset - AUDIT_PAGE_SIZE))}
            disabled={!canPrev || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-hairline bg-white hover:bg-ivory-200 text-[11px] font-bold text-charcoal-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
          <span className="font-formula text-[10px] text-charcoal-100">
            page {total === 0 ? 0 : Math.floor(offset / AUDIT_PAGE_SIZE) + 1} · {AUDIT_PAGE_SIZE}/page
          </span>
          <button
            type="button"
            onClick={() => setOffset(offset + AUDIT_PAGE_SIZE)}
            disabled={!canNext || loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-hairline bg-white hover:bg-ivory-200 text-[11px] font-bold text-charcoal-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
