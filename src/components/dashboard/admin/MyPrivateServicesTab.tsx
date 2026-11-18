'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import {
  InstructorPrivateBookingRow,
  MyPrivateServiceRow,
  listInstructorPrivateBookings,
  listMyPrivateServices,
  proposePrivateService,
  updateMyPrivateService,
} from '@/lib/data/privateServices';

// ==============================================================================
// Instructor - My Private Services & Bookings (migrations 028 & 029).
// Propose + edit while PROPOSED. The instructor NEVER prices: the academy
// office sets the price and decides whether the service goes live.
// Instructors also see a read-only schedule of bookings for their services
// (without student phone/email PII).
// ==============================================================================

const EMPTY_FORM = {
  title: '',
  description: '',
  durationMinutes: '60',
  deliveryMode: 'external_link' as 'external_link' | 'internal',
};

export const MyPrivateServicesTab: React.FC = () => {
  const [rows, setRows] = useState<MyPrivateServiceRow[]>([]);
  const [bookings, setBookings] = useState<InstructorPrivateBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    const [list, bkgList] = await Promise.all([
      listMyPrivateServices(),
      listInstructorPrivateBookings(),
    ]);
    setRows(list);
    setBookings(bkgList);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const duration = Number(form.durationMinutes);
      if (!form.title.trim() || form.title.trim().length < 3) {
        throw new Error('Title must be at least 3 characters.');
      }
      if (!Number.isFinite(duration) || duration < 15 || duration > 480) {
        throw new Error('Duration must be between 15 and 480 minutes.');
      }
      await proposePrivateService({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        durationMinutes: duration,
        deliveryMode: form.deliveryMode,
      });
      setForm(EMPTY_FORM);
      setSuccess(
        'Proposal sent. The academy office will price it and decide whether it goes live.'
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (row: MyPrivateServiceRow) => {
    setEditingId(row.id);
    setEditForm({
      title: row.title,
      description: row.description ?? '',
      durationMinutes: String(row.duration_minutes),
      deliveryMode: row.delivery_mode,
    });
  };

  const saveEdit = async (row: MyPrivateServiceRow) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await updateMyPrivateService({
        serviceId: row.id,
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        durationMinutes: Number(editForm.durationMinutes),
        deliveryMode: editForm.deliveryMode,
      });
      setEditingId(null);
      setSuccess('Service updated.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-charcoal-900 font-display flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-burgundy-500" />
            <span>My Private Services</span>
          </h3>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Propose 1:1 sessions. You never set the price — the academy office prices and publishes
            them. Bookings and payments are handled by the office.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="p-2 rounded-xl border border-hairline bg-white hover:bg-ivory-200 disabled:opacity-50 self-start"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-charcoal-100 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="break-all">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      {/* Proposal form */}
      <form
        onSubmit={submit}
        className="p-4 sm:p-5 rounded-2xl border border-hairline bg-white space-y-3"
      >
        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-charcoal-100 uppercase tracking-wider">
          <Plus className="w-3.5 h-3.5" />
          <span>Propose a new service</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            type="text"
            required
            placeholder="Service title (e.g. 1:1 organic-chemistry problem session)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="sm:col-span-2 px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
          />
          <textarea
            rows={3}
            placeholder="What the student gets (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="sm:col-span-2 px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500 resize-y"
          />
          <label className="flex items-center gap-2 px-3 py-2 bg-ivory-100 border border-hairline rounded-xl text-[11px] text-charcoal-100">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono uppercase tracking-wider text-[9px] shrink-0">Minutes</span>
            <input
              type="number"
              min={15}
              max={480}
              step={5}
              value={form.durationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
              className="flex-1 bg-transparent text-charcoal-900 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 px-3 py-2 bg-ivory-100 border border-hairline rounded-xl text-[11px] text-charcoal-100">
            <Video className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono uppercase tracking-wider text-[9px] shrink-0">Delivery</span>
            <select
              value={form.deliveryMode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  deliveryMode: e.target.value as 'external_link' | 'internal',
                }))
              }
              className="flex-1 bg-transparent text-charcoal-900 focus:outline-none"
            >
              <option value="external_link">External link (Zoom / Meet)</option>
              <option value="internal">Platform live server (when available)</option>
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-charcoal-50 leading-relaxed">
            The office sets the price. Nothing is published until they activate it.
          </p>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Send proposal</span>
          </button>
        </div>
      </form>

      {/* My proposals */}
      {loading ? (
        <div className="py-12 text-center text-xs text-charcoal-100">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="py-12 rounded-2xl border border-hairline bg-white text-center space-y-2">
          <Sparkles className="w-6 h-6 text-charcoal-50 mx-auto" />
          <p className="text-sm font-bold text-charcoal-900">No private services yet.</p>
          <p className="text-[11px] text-charcoal-100 max-w-md mx-auto leading-relaxed">
            Propose your first one above. It stays “PROPOSED, not priced” until the academy office
            reviews it.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-hairline bg-white p-4">
              {editingId === row.id ? (
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
                  />
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500 resize-y"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={15}
                      max={480}
                      step={5}
                      value={editForm.durationMinutes}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, durationMinutes: e.target.value }))
                      }
                      className="w-24 px-2.5 py-1.5 text-xs border border-hairline rounded-lg focus:outline-none focus:border-burgundy-500"
                    />
                    <select
                      value={editForm.deliveryMode}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          deliveryMode: e.target.value as 'external_link' | 'internal',
                        }))
                      }
                      className="px-2.5 py-1.5 text-xs border border-hairline rounded-lg focus:outline-none focus:border-burgundy-500"
                    >
                      <option value="external_link">External link</option>
                      <option value="internal">Platform live server</option>
                    </select>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => saveEdit(row)}
                      className="px-3 py-1.5 rounded-lg bg-charcoal-900 hover:bg-black text-ivory-100 text-[11px] font-bold disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ivory-200 hover:bg-ivory-300 border border-hairline text-charcoal-100 text-[11px] font-bold"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
                        row.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : row.status === 'ARCHIVED'
                          ? 'bg-ivory-200 text-charcoal-100 border-hairline'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {row.status}
                    </span>
                    <span className="font-formula text-[10px] text-charcoal-50 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {row.duration_minutes} min
                    </span>
                    <span className="font-formula text-[10px] text-charcoal-50 flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      {row.delivery_mode === 'internal' ? 'internal live server' : 'external link'}
                    </span>
                    <span className="ml-auto font-formula text-[11px] font-bold text-charcoal-900">
                      {row.price !== null ? `${row.price} ${row.currency}` : 'price set by the office'}
                    </span>
                  </div>
                  <h4 className="mt-1.5 text-sm font-bold text-charcoal-900">{row.title}</h4>
                  {row.description && (
                    <p className="mt-1 text-xs text-charcoal-100 leading-relaxed">{row.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[10px] font-mono text-charcoal-50">
                      {row.open_slots} open slot{row.open_slots === 1 ? '' : 's'}
                    </span>
                    {row.status === 'PROPOSED' && (
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-hairline bg-ivory-100 hover:bg-ivory-200 text-[10px] font-bold text-charcoal-100"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructor schedule of bookings for their services (029 - read-only, no student PII) */}
      <div className="pt-4 border-t border-hairline space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-charcoal-900 font-display flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-burgundy-500" />
              <span>Session Bookings ({bookings.length})</span>
            </h4>
            <p className="text-[11px] text-charcoal-100">
              Read-only schedule of bookings for your private services. Session links appear once the
              academy office verifies payment and confirms the session.
            </p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="py-8 rounded-2xl border border-hairline bg-white text-center text-xs text-charcoal-100">
            No bookings for your private services yet.
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-hairline bg-white p-3.5 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : b.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : b.status === 'CANCELLED' || b.status === 'NO_SHOW'
                          ? 'bg-ivory-200 text-charcoal-100 border-hairline'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {b.status}
                    </span>
                    <span className="text-xs font-bold text-charcoal-900">{b.service_title}</span>
                    <span className="text-[11px] text-charcoal-100">
                      • Scholar: <strong>{b.student_name || 'Scholar'}</strong>
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-charcoal-100">
                    {new Date(b.scheduled_starts_at).toLocaleString()} →{' '}
                    {new Date(b.scheduled_ends_at).toLocaleTimeString()} ({b.timezone})
                  </p>
                  {b.student_notes && (
                    <p className="text-[11px] text-charcoal-100">Topic: {b.student_notes}</p>
                  )}
                </div>

                {b.session_link ? (
                  <a
                    href={b.session_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                  >
                    <span>Join Session</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : b.internal_room_ref ? (
                  <span className="px-3 py-1 rounded-xl bg-ivory-200 border border-hairline text-[11px] font-mono text-charcoal-900">
                    Room: {b.internal_room_ref}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
