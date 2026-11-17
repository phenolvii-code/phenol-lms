'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Wallet, History, CheckCircle2, XCircle, Clock, Ban,
  RefreshCw, ChevronDown, ChevronRight, ShieldCheck, BookOpen, UserCheck,
} from 'lucide-react';
import {
  OfficeCourseRow, PaymentRow, PriceHistoryRow,
  listOfficeCourses, listPayments, listPriceHistory,
  setCoursePrice, setCoursePublished, setCourseApproval,
  recordPayment, setPaymentStatus, waiveEnrollmentPayment,
} from '@/lib/data/office';

// ==============================================================================
// Academy Office tab (migration 024): centralized pricing + payments desk.
// Every write goes through the office RPCs; every action is audit-logged
// server-side. Empty states are TRUTHFUL: no fabricated rows, ever.
// ==============================================================================

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  VERIFIED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  REFUNDED: 'bg-purple-100 text-purple-800 border-purple-200',
  CANCELLED: 'bg-ivory-300 text-charcoal-100 border-hairline',
};

const APPROVAL_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
};

const fmtEGP = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : `${v.toLocaleString('en-EG', { maximumFractionDigits: 2 })} EGP`;

export const OfficeTab: React.FC = () => {
  const [courses, setCourses] = useState<OfficeCourseRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<'pricing' | 'payments'>('pricing');
  const [searchQuery, setSearchQuery] = useState('');

  // ---------------- pricing editing state ----------------
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, PriceHistoryRow[]>>({});
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [monthsDraft, setMonthsDraft] = useState<Record<string, string>>({});
  const [busyCourse, setBusyCourse] = useState<string | null>(null);

  // ---------------- record payment form state ----------------
  const [payEmail, setPayEmail] = useState('');
  const [payCourseId, setPayCourseId] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'instapay' | 'vodafone_cash' | 'other' | 'kashier'>('cash');
  const [payAmount, setPayAmount] = useState('');
  const [payReference, setPayReference] = useState('');
  const [payFee, setPayFee] = useState('0');
  const [payNote, setPayNote] = useState('');
  const [payBusy, setPayBusy] = useState(false);

  // ---------------- waiver form state ----------------
  const [waiverEmail, setWaiverEmail] = useState('');
  const [waiverCourseId, setWaiverCourseId] = useState('');
  const [waiverNote, setWaiverNote] = useState('');
  const [waiverBusy, setWaiverBusy] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [c, p] = await Promise.all([listOfficeCourses(), listPayments()]);
    setCourses(c);
    setPayments(p);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.trim().toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q) ||
        (c.instructor_email || '').toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title || id;

  const refreshHistory = async (courseId: string) => {
    const rows = await listPriceHistory(courseId);
    setPriceHistory((prev) => ({ ...prev, [courseId]: rows }));
  };

  // ---------------------------------------------------------------- actions --

  const handleSavePrice = async (course: OfficeCourseRow) => {
    setBusyCourse(course.id);
    try {
      const raw = (priceDraft[course.id] ?? '').trim();
      const monthsRaw = (monthsDraft[course.id] ?? '').trim();
      const price = raw === '' ? null : Number(raw);
      if (raw !== '' && (Number.isNaN(price) || price! < 0)) {
        alert('Price must be a number >= 0 (or empty to clear the price).');
        return;
      }
      const months = monthsRaw === '' ? undefined : Number(monthsRaw);
      if (months !== undefined && (!Number.isInteger(months) || months! < 1)) {
        alert('Subscription months must be a whole number >= 1.');
        return;
      }
      await setCoursePrice(course.id, price, months, undefined);
      await loadAll();
      if (expandedCourse === course.id) await refreshHistory(course.id);
    } catch (err: any) {
      alert(err.message || 'Error setting price');
    } finally {
      setBusyCourse(null);
    }
  };

  const handleTogglePublished = async (course: OfficeCourseRow) => {
    setBusyCourse(course.id);
    try {
      await setCoursePublished(course.id, !course.is_published);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Error changing publish state');
    } finally {
      setBusyCourse(null);
    }
  };

  const handleApproval = async (course: OfficeCourseRow, status: 'APPROVED' | 'REJECTED') => {
    setBusyCourse(course.id);
    try {
      await setCourseApproval(course.id, status);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Error updating approval');
    } finally {
      setBusyCourse(null);
    }
  };

  const handleExpandCourse = async (courseId: string) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }
    setExpandedCourse(courseId);
    await refreshHistory(courseId);
  };

  const handleRecordPayment = async () => {
    if (!payEmail.trim() || !payCourseId || !payAmount.trim()) {
      alert('Student email, course, and amount are required.');
      return;
    }
    const amount = Number(payAmount);
    if (Number.isNaN(amount) || amount < 0) {
      alert('Amount must be a number >= 0.');
      return;
    }
    setPayBusy(true);
    try {
      await recordPayment({
        studentEmail: payEmail,
        courseId: payCourseId,
        method: payMethod,
        grossAmount: amount,
        reference: payReference.trim() || null,
        processingFee: payFee.trim() === '' ? 0 : Number(payFee),
        note: payNote.trim() || null,
      });
      setPayEmail(''); setPayAmount(''); setPayReference(''); setPayFee('0'); setPayNote('');
      await loadAll();
      alert('Payment recorded (PENDING). It now waits in the review queue.');
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    } finally {
      setPayBusy(false);
    }
  };

  const handleTransition = async (p: PaymentRow, next: 'UNDER_REVIEW' | 'VERIFIED' | 'FAILED' | 'CANCELLED' | 'REFUNDED') => {
    let note: string | null = null;
    if (next === 'REFUNDED') {
      note = window.prompt(`Written reason for refunding ${fmtEGP(p.gross_amount)} from ${p.student_email}:`);
      if (!note || !note.trim()) return; // refund requires a reason
    } else if (next === 'FAILED' || next === 'CANCELLED') {
      note = window.prompt('Reason (optional):');
    }
    try {
      await setPaymentStatus(p.id, next, note);
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Error updating payment');
    }
  };

  const handleWaiver = async () => {
    if (!waiverEmail.trim() || !waiverCourseId || !waiverNote.trim()) {
      alert('Student email, course, and a written reason are required.');
      return;
    }
    setWaiverBusy(true);
    try {
      await waiveEnrollmentPayment(waiverEmail, waiverCourseId, waiverNote.trim());
      setWaiverEmail(''); setWaiverNote('');
      await loadAll();
      alert('Enrollment activated via audited payment waiver.');
    } catch (err: any) {
      alert(err.message || 'Error granting waiver');
    } finally {
      setWaiverBusy(false);
    }
  };

  // ------------------------------------------------------------------ view --

  return (
    <div className="space-y-6">
      {/* Section switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 font-display">Academy Office</h2>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Centralized pricing and the payments desk. Every action here is permanently audit-logged.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSection('pricing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              section === 'pricing' ? 'bg-burgundy-500 text-ivory-100 shadow-sm' : 'bg-ivory-200 text-charcoal-900 border border-hairline'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Courses & Pricing</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              section === 'payments' ? 'bg-burgundy-500 text-ivory-100 shadow-sm' : 'bg-ivory-200 text-charcoal-900 border border-hairline'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Payments Desk</span>
            {payments.filter((p) => p.status === 'PENDING' || p.status === 'UNDER_REVIEW').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={loadAll}
            title="Refresh"
            className="p-2 rounded-xl bg-ivory-200 hover:bg-ivory-300 border border-hairline transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-xs text-charcoal-100 bg-ivory-100 rounded-2xl border border-hairline">
          Loading the office ledger...
        </div>
      )}

      {/* ================= SECTION A: COURSES & PRICING ================= */}
      {!loading && section === 'pricing' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-charcoal-50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses by title, code, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-ivory-100 border border-hairline rounded-xl text-charcoal-900 placeholder:text-charcoal-50 focus:outline-none focus:border-burgundy-500"
            />
          </div>

          {filteredCourses.length === 0 ? (
            <div className="p-12 text-center bg-ivory-100 rounded-2xl border border-hairline text-xs space-y-2">
              <BookOpen className="w-8 h-8 text-charcoal-50 mx-auto" />
              <h3 className="text-sm font-bold text-charcoal-900 font-display">No Courses Yet</h3>
              <p className="text-charcoal-100">Courses appear here the moment they are created — priced or unpriced.</p>
            </div>
          ) : (
            <div className="border border-hairline rounded-2xl bg-ivory-100 overflow-hidden shadow-quiet">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-hairline bg-ivory-200/60 font-formula text-[10px] text-charcoal-50 uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Course</th>
                      <th className="py-3 px-4 font-bold">Instructor</th>
                      <th className="py-3 px-4 font-bold">Approval</th>
                      <th className="py-3 px-4 font-bold">Live</th>
                      <th className="py-3 px-4 font-bold">Price</th>
                      <th className="py-3 px-4 font-bold text-right">Office Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {filteredCourses.map((course) => (
                      <React.Fragment key={course.id}>
                        <tr className="hover:bg-ivory-200/40 transition-colors">
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleExpandCourse(course.id)}
                              className="flex items-center gap-1.5 text-left"
                              title="Show price history"
                            >
                              {expandedCourse === course.id
                                ? <ChevronDown className="w-3 h-3 text-burgundy-500" />
                                : <ChevronRight className="w-3 h-3 text-charcoal-50" />}
                              <div className="flex flex-col">
                                <span className="font-bold text-charcoal-900">{course.title}</span>
                                {course.code && (
                                  <span className="font-mono text-[10px] text-charcoal-100">{course.code}</span>
                                )}
                              </div>
                            </button>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-charcoal-100">
                            {course.instructor_email || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${APPROVAL_STYLES[course.approval_status] || 'bg-ivory-200 border-hairline text-charcoal-100'}`}>
                              {course.approval_status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${course.is_published ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-ivory-200 text-charcoal-100 border-hairline'}`}>
                              {course.is_published ? 'LIVE' : 'OFF'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {course.price === null ? (
                              <span className="text-charcoal-50 font-mono italic">Unpriced</span>
                            ) : (
                              <span className="font-mono font-bold text-burgundy-900">{fmtEGP(course.price)}</span>
                            )}
                            <span className="text-charcoal-50 font-mono text-[10px] block">
                              {course.subscription_months} mo
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Price"
                                value={priceDraft[course.id] ?? ''}
                                onChange={(e) => setPriceDraft((d) => ({ ...d, [course.id]: e.target.value }))}
                                className="w-24 px-2 py-1 text-[11px] bg-white border border-hairline rounded-lg focus:outline-none focus:border-burgundy-500"
                              />
                              <input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Months"
                                value={monthsDraft[course.id] ?? ''}
                                onChange={(e) => setMonthsDraft((d) => ({ ...d, [course.id]: e.target.value }))}
                                className="w-20 px-2 py-1 text-[11px] bg-white border border-hairline rounded-lg focus:outline-none focus:border-burgundy-500"
                              />
                              <button
                                type="button"
                                disabled={busyCourse === course.id}
                                onClick={() => handleSavePrice(course)}
                                className="px-2.5 py-1 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-[11px] font-bold transition-colors disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                disabled={busyCourse === course.id}
                                onClick={() => handleTogglePublished(course)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors border disabled:opacity-50 ${
                                  course.is_published
                                    ? 'bg-ivory-200 hover:bg-red-50 text-charcoal-100 hover:text-red-700 border-hairline'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                                }`}
                                title={course.is_published ? 'Unpublish (hide from students)' : 'Publish (requires APPROVED)'}
                              >
                                {course.is_published ? 'Unpublish' : 'Publish'}
                              </button>
                              {course.approval_status !== 'APPROVED' && (
                                <button
                                  type="button"
                                  disabled={busyCourse === course.id}
                                  onClick={() => handleApproval(course, 'APPROVED')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors disabled:opacity-50"
                                >
                                  Approve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedCourse === course.id && (
                          <tr>
                            <td colSpan={6} className="bg-white/70 px-10 py-4">
                              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-burgundy-500 uppercase tracking-wider pb-2">
                                <History className="w-3 h-3" />
                                Price History (permanent, append-only)
                              </div>
                              {(priceHistory[course.id] || []).length === 0 ? (
                                <p className="text-[11px] text-charcoal-50 italic font-mono">
                                  No pricing changes recorded yet — the ledger fills with real changes only.
                                </p>
                              ) : (
                                <ul className="space-y-1.5">
                                  {priceHistory[course.id].map((h) => (
                                    <li key={h.id} className="text-[11px] font-mono text-charcoal-100 flex items-center gap-2">
                                      <Clock className="w-3 h-3 text-charcoal-50 shrink-0" />
                                      <span>{new Date(h.changed_at).toLocaleString('en-GB')}</span>
                                      <span className="text-charcoal-900 font-bold">
                                        {h.price === null ? 'UNPRICED' : fmtEGP(h.price)}
                                        {h.subscription_months ? ` · ${h.subscription_months} mo` : ''}
                                      </span>
                                      <span className="text-charcoal-50">by {h.changed_by_email || 'console'}{h.changed_by_role ? ` (${h.changed_by_role})` : ''}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION B: PAYMENTS DESK ================= */}
      {!loading && section === 'payments' && (
        <div className="space-y-6">
          {/* Record a payment */}
          <div className="p-5 rounded-2xl border border-hairline bg-ivory-100 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-burgundy-500 uppercase tracking-wider">
              <Plus className="w-3.5 h-3.5" />
              Record a Payment (real payments only — the ledger is permanent)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="email"
                placeholder="Student email"
                value={payEmail}
                onChange={(e) => setPayEmail(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
              />
              <select
                value={payCourseId}
                onChange={(e) => setPayCourseId(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
              >
                <option value="">Select course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}{c.code ? ` (${c.code})` : ''}</option>
                ))}
              </select>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
              >
                <option value="cash">Cash</option>
                <option value="instapay">InstaPay</option>
                <option value="vodafone_cash">Vodafone Cash</option>
                <option value="kashier">Kashier (online)</option>
                <option value="other">Other</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount (EGP)"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
              />
              <input
                type="text"
                placeholder="Reference (receipt no. — optional)"
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Processing fee (EGP)"
                value={payFee}
                onChange={(e) => setPayFee(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
              />
              <input
                type="text"
                placeholder="Note (optional)"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500 md:col-span-2"
              />
              <button
                type="button"
                disabled={payBusy}
                onClick={handleRecordPayment}
                className="px-4 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-colors disabled:opacity-50"
              >
                {payBusy ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
            <p className="text-[10px] text-charcoal-50 font-mono">
              The commission split is resolved at record time (instructor override → settings fallback) and frozen on the row.
              VERIFIED payment automatically activates the student's enrollment.
            </p>
          </div>

          {/* Payments ledger */}
          {payments.length === 0 ? (
            <div className="p-12 text-center bg-ivory-100 rounded-2xl border border-hairline text-xs space-y-2">
              <Wallet className="w-8 h-8 text-charcoal-50 mx-auto" />
              <h3 className="text-sm font-bold text-charcoal-900 font-display">The Ledger Is Empty</h3>
              <p className="text-charcoal-100">
                No payments recorded yet. Rows appear here the moment a real payment is recorded — never fabricated.
              </p>
            </div>
          ) : (
            <div className="border border-hairline rounded-2xl bg-ivory-100 overflow-hidden shadow-quiet">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-hairline bg-ivory-200/60 font-formula text-[10px] text-charcoal-50 uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Student</th>
                      <th className="py-3 px-4 font-bold">Course</th>
                      <th className="py-3 px-4 font-bold">Method</th>
                      <th className="py-3 px-4 font-bold">Amount</th>
                      <th className="py-3 px-4 font-bold">Split (plat / inst)</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Office Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-ivory-200/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-charcoal-900">{p.student_email}</td>
                        <td className="py-3 px-4 text-[11px]">{courseTitle(p.course_id)}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-charcoal-100">{p.method}</td>
                        <td className="py-3 px-4 font-mono font-bold text-burgundy-900">{fmtEGP(p.gross_amount)}</td>
                        <td className="py-3 px-4 font-mono text-[10px] text-charcoal-100">
                          {p.platform_amount !== null ? `${fmtEGP(p.platform_amount)} / ${fmtEGP(p.instructor_amount)}` : '—'}
                          {p.price_snapshot !== null && (
                            <span className="block text-charcoal-50">price snapshot: {fmtEGP(p.price_snapshot)}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${STATUS_STYLES[p.status] || 'bg-ivory-200 border-hairline text-charcoal-100'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {p.status === 'PENDING' && (
                              <>
                                <button onClick={() => handleTransition(p, 'UNDER_REVIEW')} className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors">Review</button>
                                <button onClick={() => handleTransition(p, 'CANCELLED')} className="px-2.5 py-1 rounded-lg bg-ivory-200 hover:bg-ivory-300 border border-hairline text-charcoal-100 text-[11px] font-bold transition-colors">Cancel</button>
                              </>
                            )}
                            {p.status === 'UNDER_REVIEW' && (
                              <>
                                <button onClick={() => handleTransition(p, 'VERIFIED')} className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" /> Verify
                                </button>
                                <button onClick={() => handleTransition(p, 'FAILED')} className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-colors">Fail</button>
                                <button onClick={() => handleTransition(p, 'CANCELLED')} className="px-2.5 py-1 rounded-lg bg-ivory-200 hover:bg-ivory-300 border border-hairline text-charcoal-100 text-[11px] font-bold transition-colors">Cancel</button>
                              </>
                            )}
                            {p.status === 'VERIFIED' && (
                              <button onClick={() => handleTransition(p, 'REFUNDED')} className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-colors">Refund</button>
                            )}
                            {['FAILED', 'REFUNDED', 'CANCELLED'].includes(p.status) && (
                              <span className="text-[10px] font-mono text-charcoal-50 italic">final — immutable</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment waiver */}
          <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5" />
              Payment Waiver (activates enrollment without payment — audited permanently)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="email"
                placeholder="Student email"
                value={waiverEmail}
                onChange={(e) => setWaiverEmail(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
              />
              <select
                value={waiverCourseId}
                onChange={(e) => setWaiverCourseId(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
              >
                <option value="">Select course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}{c.code ? ` (${c.code})` : ''}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Written reason (required)"
                value={waiverNote}
                onChange={(e) => setWaiverNote(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500 md:col-span-1"
              />
              <button
                type="button"
                disabled={waiverBusy}
                onClick={handleWaiver}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {waiverBusy ? 'Granting...' : 'Grant Waiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
