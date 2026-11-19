'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, Clock, RefreshCw, ShieldCheck, Banknote } from 'lucide-react';
import {
  InstructorFinancialLedger,
  getInstructorFinancialLedger,
} from '@/lib/data/office';

// ==============================================================================
// Instructor Read-Only Financial Ledger Tab (migration 025).
// Strictly READ-ONLY: instructors see their own verified earnings, commission
// rate, per-course payment snapshots (PII-free), and settlement payouts.
// Zero mock/fabricated numbers: empty states are explicit and truthful.
// ==============================================================================

const fmtEGP = (v: number | null | undefined, currency = 'EGP') =>
  v === null || v === undefined
    ? '—'
    : `${Number(v).toLocaleString('en-EG', { maximumFractionDigits: 2 })} ${currency}`;

export const AdminEarningsTab: React.FC = () => {
  const [ledger, setLedger] = useState<InstructorFinancialLedger | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLedger = async () => {
    setLoading(true);
    const data = await getInstructorFinancialLedger();
    setLedger(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const currency = ledger?.currency || 'EGP';
  const hasVerifiedPayments = (ledger?.verified_payments_count ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-charcoal-900 font-display">
              Earnings &amp; Settlement Ledger
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-ivory-200 text-charcoal-100 border border-hairline">
              Read-Only
            </span>
          </div>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Transparent financial ledger of verified course payments and academy settlements for your courses.
          </p>
        </div>
        <button
          type="button"
          onClick={loadLedger}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ivory-100 hover:bg-ivory-200 border border-hairline text-xs font-bold text-charcoal-900 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Truthful Empty State Banner */}
      {!loading && !hasVerifiedPayments && (
        <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline flex items-start gap-3">
          <Clock className="w-4 h-4 text-charcoal-100 mt-0.5 shrink-0" />
          <div className="text-xs text-charcoal-100 leading-relaxed">
            <span className="font-bold text-charcoal-900">
              No verified payment records for your courses yet.
            </span>{' '}
            Your earnings and settlement figures will populate automatically as student payments are verified by the Academy Office.
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 block">
            Platform Commission Rate
          </span>
          <span className="text-lg font-bold font-mono text-burgundy-500 block">
            {ledger ? `${ledger.effective_commission_pct}%` : '—'}
          </span>
          <span className="text-[10px] text-charcoal-100 block">
            {ledger?.custom_commission_pct !== null && ledger?.custom_commission_pct !== undefined
              ? 'Custom agreement rate'
              : 'Standard academy rate'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 block">
            Verified Gross ({ledger?.verified_payments_count ?? 0} tx)
          </span>
          <span className="text-lg font-bold font-mono text-charcoal-900 block">
            {hasVerifiedPayments ? fmtEGP(ledger?.gross_collected, currency) : 'No verified payments'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 block">
            Net Instructor Earnings
          </span>
          <span className="text-lg font-bold font-mono text-emerald-700 block">
            {hasVerifiedPayments ? fmtEGP(ledger?.net_instructor_earnings, currency) : '—'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 block">
            Paid Out Settlements
          </span>
          <span className="text-lg font-bold font-mono text-charcoal-900 block">
            {(ledger?.paid_settlements_total ?? 0) > 0
              ? fmtEGP(ledger?.paid_settlements_total, currency)
              : '—'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 block">
            Unsettled Balance
          </span>
          <span className="text-lg font-bold font-mono text-amber-800 block">
            {hasVerifiedPayments ? fmtEGP(ledger?.unsettled_balance, currency) : '—'}
          </span>
        </div>
      </div>

      {/* Course Payment Transactions (PII-free) */}
      <div className="p-5 rounded-2xl bg-ivory-100 border border-hairline space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-burgundy-500" />
          <h3 className="text-sm font-bold text-charcoal-900 font-display">
            Course Payment Transactions (Read-Only Snapshot)
          </h3>
        </div>
        {!ledger || ledger.payments.length === 0 ? (
          <p className="text-xs text-charcoal-100 italic py-6 text-center">
            No payment transactions recorded for your courses yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline text-[10px] font-mono text-charcoal-100 uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Gross</th>
                  <th className="py-2.5 px-3">Commission %</th>
                  <th className="py-2.5 px-3">Your Net Share</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-xs">
                {ledger.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-ivory-200/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-charcoal-900">
                      {p.course_title || p.course_id}
                    </td>
                    <td className="py-2.5 px-3 font-mono uppercase text-[11px]">{p.method}</td>
                    <td className="py-2.5 px-3 font-mono">{fmtEGP(p.gross_amount, p.currency)}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {p.platform_commission_pct !== null ? `${p.platform_commission_pct}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                      {fmtEGP(p.instructor_amount, p.currency)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          p.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : p.status === 'PENDING' || p.status === 'UNDER_REVIEW'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-ivory-300 text-charcoal-100 border-hairline'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1:1 Private Service Payments (030 - PII-free) */}
      <div className="p-5 rounded-2xl bg-ivory-100 border border-hairline space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-burgundy-500" />
          <h3 className="text-sm font-bold text-charcoal-900 font-display">
            1:1 Private Service Payments (Read-Only Snapshot)
          </h3>
        </div>
        {!ledger || (ledger.private_service_payments?.length ?? 0) === 0 ? (
          <p className="text-xs text-charcoal-100 italic py-6 text-center">
            No payment transactions recorded for your 1:1 private services yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline text-[10px] font-mono text-charcoal-100 uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Gross</th>
                  <th className="py-2.5 px-3">Academy Share</th>
                  <th className="py-2.5 px-3">Your Net</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-xs">
                {(ledger.private_service_payments || []).map((p) => (
                  <tr key={p.id} className="hover:bg-ivory-200/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-charcoal-100">
                      {(p.verified_at || p.created_at).slice(0, 10)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-charcoal-900">
                      {p.service_title || '1:1 Session'}
                    </td>
                    <td className="py-2.5 px-3 font-mono uppercase text-[11px]">{p.method}</td>
                    <td className="py-2.5 px-3 font-mono">{fmtEGP(p.gross_amount, p.currency)}</td>
                    <td className="py-2.5 px-3 font-mono text-burgundy-500">
                      {fmtEGP(p.platform_amount, p.currency)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                      {fmtEGP(p.instructor_amount, p.currency)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          p.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : p.status === 'PENDING' || p.status === 'UNDER_REVIEW'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-ivory-300 text-charcoal-100 border-hairline'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settlements History */}
      <div className="p-5 rounded-2xl bg-ivory-100 border border-hairline space-y-3">
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 text-burgundy-500" />
          <h3 className="text-sm font-bold text-charcoal-900 font-display">
            Settlement Payout History
          </h3>
        </div>
        {!ledger || ledger.settlements.length === 0 ? (
          <p className="text-xs text-charcoal-100 italic py-6 text-center">
            No settlement payouts recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline text-[10px] font-mono text-charcoal-100 uppercase">
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Verified Tx</th>
                  <th className="py-2.5 px-3">Gross Collected</th>
                  <th className="py-2.5 px-3">Academy Share</th>
                  <th className="py-2.5 px-3">Net Payout</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Payout Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-xs">
                {ledger.settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-ivory-200/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {s.period_start} → {s.period_end}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{s.verified_payments_count}</td>
                    <td className="py-2.5 px-3 font-mono">{fmtEGP(s.gross_collected, s.currency)}</td>
                    <td className="py-2.5 px-3 font-mono text-burgundy-500">
                      {fmtEGP(s.platform_share, s.currency)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                      {fmtEGP(s.net_instructor_payout, s.currency)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          s.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : s.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-ivory-300 text-charcoal-100 border-hairline'
                        }`}
                      >
                        {s.status === 'PAID' && <ShieldCheck className="w-3 h-3" />}
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-charcoal-100">
                      {s.payout_method ? `${s.payout_method.toUpperCase()}` : '—'}
                      {s.payout_reference ? ` · ${s.payout_reference}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
