'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Inbox,
  Plus,
  RefreshCw,
  ShieldCheck,
  Video,
  Wallet,
  X,
} from 'lucide-react';
import {
  OfficePrivateBookingRow,
  OfficePrivateServiceRow,
  PrivateBookingStatus,
  PrivateServiceSlotRow,
  closePrivateServiceSlot,
  createPrivateServiceSlot,
  listOfficePrivateServiceBookings,
  listOfficePrivateServiceSlots,
  listOfficePrivateServices,
  officeConfirmPrivateServiceBooking,
  officeMarkPrivateBookingAwaitingPayment,
  officeSetPrivateBookingStatus,
  officeVerifyPrivateBookingPayment,
  setPrivateServicePrice,
  setPrivateServiceStatus,
} from '@/lib/data/privateServices';

// ==============================================================================
// Academy Office - Private Services & Bookings (migrations 028 & 029).
// - Catalog & Slots (028): office prices, activates, archives, and schedules slots.
// - Bookings Desk (029): pay-first-then-confirm lifecycle (REQUESTED ->
//   AWAITING_PAYMENT -> verify payment -> set session venue -> CONFIRMED ->
//   COMPLETED / NO_SHOW / CANCELLED).
// ==============================================================================

function statusChip(status: OfficePrivateServiceRow['status']): string {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'ARCHIVED') return 'bg-ivory-200 text-charcoal-100 border-hairline';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function bookingStatusChip(status: PrivateBookingStatus): string {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'AWAITING_PAYMENT':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'CANCELLED':
      return 'bg-ivory-200 text-charcoal-100 border-hairline';
    case 'NO_SHOW':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-purple-100 text-purple-800 border-purple-200';
  }
}

export const PrivateServicesOfficeTab: React.FC = () => {
  const [subView, setSubView] = useState<'catalog' | 'bookings'>('catalog');

  const [services, setServices] = useState<OfficePrivateServiceRow[]>([]);
  const [bookings, setBookings] = useState<OfficePrivateBookingRow[]>([]);
  const [bookingFilter, setBookingFilter] = useState<PrivateBookingStatus | 'ALL'>('ALL');

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [slots, setSlots] = useState<PrivateServiceSlotRow[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotStart, setSlotStart] = useState('');
  const [slotEnd, setSlotEnd] = useState('');

  // Booking drafts (payment ref, venue link / room ref, office notes)
  const [payRefDraft, setPayRefDraft] = useState<Record<string, string>>({});
  const [venueDraft, setVenueDraft] = useState<Record<string, string>>({});
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [svcRows, bkgRows] = await Promise.all([
      listOfficePrivateServices(),
      listOfficePrivateServiceBookings(),
    ]);
    setServices(svcRows);
    setBookings(bkgRows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadSlots = useCallback(async (serviceId: string) => {
    setSlotsLoading(true);
    const rows = await listOfficePrivateServiceSlots(serviceId);
    setSlots(rows);
    setSlotsLoading(false);
  }, []);

  const run = async (key: string, fn: () => Promise<void>, after?: () => Promise<void> | void) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      await after?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const toggleExpand = async (serviceId: string) => {
    if (expanded === serviceId) {
      setExpanded(null);
      setSlots([]);
      return;
    }
    setExpanded(serviceId);
    setSlotStart('');
    setSlotEnd('');
    await loadSlots(serviceId);
  };

  const pendingCount = services.filter((s) => s.status === 'PROPOSED').length;
  const activeCount = services.filter((s) => s.status === 'ACTIVE').length;
  const actionBookingsCount = bookings.filter(
    (b) => b.status === 'REQUESTED' || b.status === 'AWAITING_PAYMENT'
  ).length;

  const filteredBookings =
    bookingFilter === 'ALL'
      ? bookings
      : bookings.filter((b) => b.status === bookingFilter);

  const handleCancelBooking = (b: OfficePrivateBookingRow) => {
    const reason = window.prompt(
      `Written reason for cancelling booking (${b.student_email} - ${b.service_title}):`
    );
    if (!reason || reason.trim().length < 3) return;
    run(
      `cancel-bkg-${b.id}`,
      async () => {
        await officeSetPrivateBookingStatus({
          bookingId: b.id,
          status: 'CANCELLED',
          reason: reason.trim(),
          officeNotes: notesDraft[b.id] || undefined,
        });
      },
      load
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-charcoal-900 font-display">
            Private Services & Bookings
          </h3>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Instructors propose. The office prices, activates, schedules slots, verifies booking
            payments, and confirms 1:1 sessions (pay-first-then-confirm).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView('catalog')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
              subView === 'catalog'
                ? 'bg-charcoal-900 text-ivory-100 border-charcoal-900'
                : 'bg-white text-charcoal-900 border-hairline hover:bg-ivory-200'
            }`}
          >
            Catalog & Slots ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('bookings')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
              subView === 'bookings'
                ? 'bg-burgundy-500 text-ivory-100 border-burgundy-500'
                : 'bg-white text-charcoal-900 border-hairline hover:bg-ivory-200'
            }`}
          >
            <span>Bookings Desk ({bookings.length})</span>
            {actionBookingsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800">
                {actionBookingsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="p-2 rounded-xl border border-hairline bg-white hover:bg-ivory-200 disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-charcoal-100 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="break-all">{error}</p>
        </div>
      )}

      {subView === 'catalog' ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-ivory-200 border border-hairline text-[10px] font-mono font-bold text-charcoal-900">
              {services.length} total
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-mono font-bold text-amber-700">
              {pendingCount} awaiting price
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700">
              {activeCount} active
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-charcoal-100">Loading services…</div>
          ) : services.length === 0 ? (
            <div className="py-16 rounded-2xl border border-hairline bg-white text-center space-y-2">
              <CalendarClock className="w-7 h-7 text-charcoal-50 mx-auto" />
              <p className="text-sm font-bold text-charcoal-900">No private services proposed yet.</p>
              <p className="text-[11px] text-charcoal-100 max-w-md mx-auto leading-relaxed">
                Nothing is pre-filled. When an instructor proposes a service it appears here,
                unpriced, and you decide the price and whether it goes live.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((s) => {
                const isOpen = expanded === s.id;
                return (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-hairline bg-white overflow-hidden"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${statusChip(
                            s.status
                          )}`}
                        >
                          {s.status}
                        </span>
                        <span className="font-formula text-[11px] text-charcoal-100">
                          {s.instructor_email}
                        </span>
                        <span className="font-formula text-[10px] text-charcoal-50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {s.duration_minutes} min
                        </span>
                        <span className="font-formula text-[10px] text-charcoal-50 flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          {s.delivery_mode === 'internal'
                            ? 'internal live server'
                            : 'external link'}
                        </span>
                        <span className="ml-auto font-formula text-[11px] font-bold text-charcoal-900">
                          {s.price !== null ? `${s.price} ${s.currency}` : 'not priced'}
                        </span>
                      </div>

                      <h4 className="mt-2 text-sm font-bold text-charcoal-900">{s.title}</h4>
                      {s.description && (
                        <p className="mt-1 text-xs text-charcoal-100 leading-relaxed">
                          {s.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            placeholder={s.price !== null ? String(s.price) : 'price'}
                            value={priceDraft[s.id] ?? ''}
                            onChange={(e) =>
                              setPriceDraft((d) => ({ ...d, [s.id]: e.target.value }))
                            }
                            className="w-28 px-2.5 py-1.5 text-xs bg-white border border-hairline rounded-lg focus:outline-none focus:border-burgundy-500"
                          />
                          <button
                            type="button"
                            disabled={busy === `price-${s.id}` || !priceDraft[s.id]}
                            onClick={() =>
                              run(
                                `price-${s.id}`,
                                async () => {
                                  const value = Number(priceDraft[s.id]);
                                  if (!Number.isFinite(value) || value <= 0) {
                                    throw new Error('Enter a price greater than zero.');
                                  }
                                  await setPrivateServicePrice(s.id, value, s.currency || 'EGP');
                                  setPriceDraft((d) => ({ ...d, [s.id]: '' }));
                                },
                                load
                              )
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-charcoal-900 hover:bg-black text-ivory-100 text-[11px] font-bold transition-colors disabled:opacity-40"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Set price</span>
                          </button>
                        </div>

                        {s.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            disabled={busy === `archive-${s.id}`}
                            onClick={() =>
                              run(
                                `archive-${s.id}`,
                                async () => {
                                  await setPrivateServiceStatus(s.id, 'ARCHIVED');
                                },
                                load
                              )
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ivory-200 hover:bg-ivory-300 border border-hairline text-charcoal-100 text-[11px] font-bold transition-colors disabled:opacity-40"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Archive</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy === `activate-${s.id}` || s.price === null}
                            title={s.price === null ? 'Set a price first' : 'Activate & publish'}
                            onClick={() =>
                              run(
                                `activate-${s.id}`,
                                async () => {
                                  await setPrivateServiceStatus(s.id, 'ACTIVE');
                                },
                                load
                              )
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors disabled:opacity-40"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{s.status === 'ARCHIVED' ? 'Reactivate' : 'Activate'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleExpand(s.id)}
                          className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ivory-100 hover:bg-ivory-200 border border-hairline text-charcoal-900 text-[11px] font-bold transition-colors"
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                          <span>Slots ({s.open_slots} open)</span>
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-hairline bg-ivory-100/70 p-4 sm:p-5 space-y-3">
                        {s.status !== 'ACTIVE' ? (
                          <p className="text-[11px] text-charcoal-100">
                            Activate the service before adding bookable slots.
                          </p>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                            <label className="flex flex-col gap-1 text-[10px] font-mono uppercase tracking-wider text-charcoal-100">
                              <span>Starts</span>
                              <input
                                type="datetime-local"
                                value={slotStart}
                                onChange={(e) => setSlotStart(e.target.value)}
                                className="px-2.5 py-1.5 text-xs bg-white border border-hairline rounded-lg focus:outline-none focus:border-burgundy-500"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-[10px] font-mono uppercase tracking-wider text-charcoal-100">
                              <span>Ends</span>
                              <input
                                type="datetime-local"
                                value={slotEnd}
                                onChange={(e) => setSlotEnd(e.target.value)}
                                className="px-2.5 py-1.5 text-xs bg-white border border-hairline rounded-lg focus:outline-none focus:border-burgundy-500"
                              />
                            </label>
                            <button
                              type="button"
                              disabled={busy === `slot-${s.id}` || !slotStart || !slotEnd}
                              onClick={() =>
                                run(
                                  `slot-${s.id}`,
                                  async () => {
                                    if (!slotStart || !slotEnd)
                                      throw new Error('Pick a start and an end.');
                                    const startsAt = new Date(slotStart).toISOString();
                                    const endsAt = new Date(slotEnd).toISOString();
                                    await createPrivateServiceSlot({
                                      serviceId: s.id,
                                      startsAt,
                                      endsAt,
                                    });
                                    setSlotStart('');
                                    setSlotEnd('');
                                  },
                                  async () => {
                                    await loadSlots(s.id);
                                    await load();
                                  }
                                )
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-[11px] font-bold transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add slot</span>
                            </button>
                          </div>
                        )}

                        {slotsLoading ? (
                          <p className="text-[11px] text-charcoal-100">Loading slots…</p>
                        ) : slots.length === 0 ? (
                          <p className="text-[11px] text-charcoal-100">
                            No slots yet for this service.
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {slots.map((slot) => (
                              <li
                                key={slot.id}
                                className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl bg-white border border-hairline"
                              >
                                <span className="font-formula text-[11px] text-charcoal-900">
                                  {new Date(slot.starts_at).toLocaleString()} →{' '}
                                  {new Date(slot.ends_at).toLocaleTimeString()}
                                </span>
                                <span className="text-[10px] text-charcoal-50 font-mono">
                                  {slot.timezone}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold ${
                                    slot.status === 'OPEN'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : slot.status === 'BOOKED'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-ivory-200 text-charcoal-100 border-hairline'
                                  }`}
                                >
                                  {slot.status}
                                </span>
                                {slot.status === 'OPEN' && (
                                  <button
                                    type="button"
                                    disabled={busy === `close-${slot.id}`}
                                    onClick={() =>
                                      run(
                                        `close-${slot.id}`,
                                        async () => {
                                          await closePrivateServiceSlot(slot.id);
                                        },
                                        async () => {
                                          await loadSlots(s.id);
                                          await load();
                                        }
                                      )
                                    }
                                    className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-hairline bg-ivory-100 hover:bg-ivory-200 text-[10px] font-bold text-charcoal-100 disabled:opacity-40"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Close</span>
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ============================ BOOKINGS DESK (029) ============================ */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                'ALL',
                'REQUESTED',
                'AWAITING_PAYMENT',
                'CONFIRMED',
                'COMPLETED',
                'NO_SHOW',
                'CANCELLED',
              ] as const
            ).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setBookingFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-colors ${
                  bookingFilter === st
                    ? 'bg-charcoal-900 text-ivory-100 border-charcoal-900'
                    : 'bg-white text-charcoal-100 border-hairline hover:text-charcoal-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-charcoal-100">Loading bookings…</div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 rounded-2xl border border-hairline bg-white text-center space-y-2">
              <Inbox className="w-7 h-7 text-charcoal-50 mx-auto" />
              <p className="text-sm font-bold text-charcoal-900">
                No private service bookings found.
              </p>
              <p className="text-[11px] text-charcoal-100 max-w-md mx-auto leading-relaxed">
                When a student requests an office slot or proposes a custom session time, it appears
                here for payment verification and confirmation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => {
                const isTerminal =
                  b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'NO_SHOW';
                return (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-hairline bg-white p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold ${bookingStatusChip(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
                          b.payment_verified
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {b.payment_verified
                          ? `PAID (${b.payment_reference || 'verified'})`
                          : 'UNPAID (pay-first gate)'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-ivory-200 text-charcoal-100 text-[10px] font-mono">
                        {b.booking_mode === 'office_slot' ? 'Office Slot' : 'Student Proposed'}
                      </span>
                      <span className="ml-auto font-mono text-xs font-bold text-burgundy-900">
                        {b.price_snapshot} {b.currency}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-charcoal-50 block">
                          Service & Instructor
                        </span>
                        <p className="font-bold text-charcoal-900">{b.service_title}</p>
                        <p className="text-[11px] text-charcoal-100">
                          {b.instructor_name || b.instructor_email} ({b.duration_minutes} min •{' '}
                          {b.delivery_mode})
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-charcoal-50 block">
                          Student
                        </span>
                        <p className="font-bold text-charcoal-900">
                          {b.student_name || b.student_email}
                        </p>
                        <p className="text-[11px] text-charcoal-100 font-mono">
                          {b.student_email}
                          {b.student_phone ? ` • ${b.student_phone}` : ''}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-charcoal-50 block">
                          Scheduled Window
                        </span>
                        <p className="font-mono text-[11px] font-bold text-charcoal-900">
                          {new Date(b.scheduled_starts_at).toLocaleString()} →{' '}
                          {new Date(b.scheduled_ends_at).toLocaleTimeString()}
                        </p>
                        <p className="text-[10px] text-charcoal-50 font-mono">{b.timezone}</p>
                      </div>
                    </div>

                    {b.student_notes && (
                      <p className="text-xs text-charcoal-100 bg-ivory-100 border border-hairline rounded-xl px-3 py-2">
                        <strong className="text-charcoal-900">Student notes:</strong>{' '}
                        {b.student_notes}
                      </p>
                    )}

                    {b.cancellation_reason && (
                      <p className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                        <strong>Cancellation reason:</strong> {b.cancellation_reason}
                      </p>
                    )}

                    {!isTerminal && (
                      <div className="pt-2 border-t border-hairline space-y-2.5">
                        {/* Step 1: Payment Verification (Pay-First Gate) */}
                        {!b.payment_verified && (
                          <div className="flex flex-wrap items-center gap-2">
                            {b.status === 'REQUESTED' && (
                              <button
                                type="button"
                                disabled={busy === `await-${b.id}`}
                                onClick={() =>
                                  run(
                                    `await-${b.id}`,
                                    async () => {
                                      await officeMarkPrivateBookingAwaitingPayment({
                                        bookingId: b.id,
                                        officeNotes: notesDraft[b.id] || undefined,
                                      });
                                    },
                                    load
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors disabled:opacity-40"
                              >
                                Mark Awaiting Payment
                              </button>
                            )}

                            <input
                              type="text"
                              placeholder="Receipt / payment reference (required)"
                              value={payRefDraft[b.id] ?? ''}
                              onChange={(e) =>
                                setPayRefDraft((d) => ({ ...d, [b.id]: e.target.value }))
                              }
                              className="w-64 px-2.5 py-1.5 text-xs bg-white border border-hairline rounded-lg focus:outline-none focus:border-burgundy-500"
                            />
                            <button
                              type="button"
                              disabled={
                                busy === `verify-${b.id}` ||
                                (payRefDraft[b.id] || '').trim().length < 2
                              }
                              onClick={() =>
                                run(
                                  `verify-${b.id}`,
                                  async () => {
                                    await officeVerifyPrivateBookingPayment({
                                      bookingId: b.id,
                                      paymentReference: payRefDraft[b.id].trim(),
                                      officeNotes: notesDraft[b.id] || undefined,
                                    });
                                  },
                                  load
                                )
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-charcoal-900 hover:bg-black text-ivory-100 text-[11px] font-bold transition-colors disabled:opacity-40"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verify Payment</span>
                            </button>
                          </div>
                        )}

                        {/* Step 2: Venue & Confirmation (only enabled after payment_verified) */}
                        {b.payment_verified && (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              placeholder={
                                b.delivery_mode === 'internal'
                                  ? b.internal_room_ref || 'Internal live-server room reference'
                                  : b.session_link || 'Zoom / Google Meet URL (https://...)'
                              }
                              value={venueDraft[b.id] ?? ''}
                              onChange={(e) =>
                                setVenueDraft((d) => ({ ...d, [b.id]: e.target.value }))
                              }
                              className="flex-1 min-w-[240px] px-2.5 py-1.5 text-xs bg-white border border-hairline rounded-lg focus:outline-none focus:border-burgundy-500"
                            />
                            <button
                              type="button"
                              disabled={busy === `confirm-${b.id}`}
                              onClick={() =>
                                run(
                                  `confirm-${b.id}`,
                                  async () => {
                                    const val = (venueDraft[b.id] || '').trim();
                                    await officeConfirmPrivateServiceBooking({
                                      bookingId: b.id,
                                      sessionLink:
                                        b.delivery_mode === 'external_link'
                                          ? val || b.session_link
                                          : null,
                                      internalRoomRef:
                                        b.delivery_mode === 'internal'
                                          ? val || b.internal_room_ref
                                          : null,
                                      officeNotes: notesDraft[b.id] || undefined,
                                    });
                                  },
                                  load
                                )
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors disabled:opacity-40"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {b.status === 'CONFIRMED' ? 'Update Venue Link' : 'Confirm Booking'}
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Step 3: Post-Confirmation Outcomes & Cancellation */}
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            placeholder={b.office_notes || 'Office notes (optional)'}
                            value={notesDraft[b.id] ?? ''}
                            onChange={(e) =>
                              setNotesDraft((d) => ({ ...d, [b.id]: e.target.value }))
                            }
                            className="flex-1 min-w-[200px] px-2.5 py-1 text-[11px] bg-ivory-100 border border-hairline rounded-lg focus:outline-none focus:border-burgundy-500"
                          />

                          {b.status === 'CONFIRMED' && (
                            <>
                              <button
                                type="button"
                                disabled={busy === `complete-${b.id}`}
                                onClick={() =>
                                  run(
                                    `complete-${b.id}`,
                                    async () => {
                                      await officeSetPrivateBookingStatus({
                                        bookingId: b.id,
                                        status: 'COMPLETED',
                                        officeNotes: notesDraft[b.id] || undefined,
                                      });
                                    },
                                    load
                                  )
                                }
                                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors disabled:opacity-40"
                              >
                                Mark Completed
                              </button>
                              <button
                                type="button"
                                disabled={busy === `noshow-${b.id}`}
                                onClick={() =>
                                  run(
                                    `noshow-${b.id}`,
                                    async () => {
                                      await officeSetPrivateBookingStatus({
                                        bookingId: b.id,
                                        status: 'NO_SHOW',
                                        officeNotes: notesDraft[b.id] || undefined,
                                      });
                                    },
                                    load
                                  )
                                }
                                className="px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-bold transition-colors disabled:opacity-40"
                              >
                                Mark No-Show
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            disabled={busy === `cancel-bkg-${b.id}`}
                            onClick={() => handleCancelBooking(b)}
                            className="px-3 py-1 rounded-lg bg-ivory-200 hover:bg-red-50 text-charcoal-100 hover:text-red-700 border border-hairline text-[11px] font-bold transition-colors disabled:opacity-40"
                          >
                            Cancel Booking
                          </button>

                          {b.session_link && (
                            <a
                              href={b.session_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-burgundy-600 hover:underline ml-auto"
                            >
                              <span>Open Session Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
