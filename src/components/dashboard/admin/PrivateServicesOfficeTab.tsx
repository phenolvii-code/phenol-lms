'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CalendarClock,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Video,
  Wallet,
  X,
} from 'lucide-react';
import {
  OfficePrivateServiceRow,
  PrivateServiceSlotRow,
  closePrivateServiceSlot,
  createPrivateServiceSlot,
  listOfficePrivateServiceSlots,
  listOfficePrivateServices,
  setPrivateServicePrice,
  setPrivateServiceStatus,
} from '@/lib/data/privateServices';

// ==============================================================================
// Academy Office - Private Services (migration 028).
// The office prices, activates, archives, and schedules slots. The instructor
// proposes; she never prices. No bookings or money exist yet (029/030).
// ==============================================================================

function statusChip(status: OfficePrivateServiceRow['status']): string {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'ARCHIVED') return 'bg-ivory-200 text-charcoal-100 border-hairline';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export const PrivateServicesOfficeTab: React.FC = () => {
  const [services, setServices] = useState<OfficePrivateServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [slots, setSlots] = useState<PrivateServiceSlotRow[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotStart, setSlotStart] = useState('');
  const [slotEnd, setSlotEnd] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const rows = await listOfficePrivateServices();
    setServices(rows);
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-charcoal-900 font-display">Private Services</h3>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Instructors propose. The office sets the price, activates the service, and adds the
            bookable slots. Bookings and payments arrive in the next stage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-ivory-200 border border-hairline text-[10px] font-mono font-bold text-charcoal-900">
            {services.length} total
          </span>
          <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-mono font-bold text-amber-700">
            {pendingCount} awaiting price
          </span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700">
            {activeCount} active
          </span>
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

      {loading ? (
        <div className="py-16 text-center text-xs text-charcoal-100">Loading services…</div>
      ) : services.length === 0 ? (
        <div className="py-16 rounded-2xl border border-hairline bg-white text-center space-y-2">
          <CalendarClock className="w-7 h-7 text-charcoal-50 mx-auto" />
          <p className="text-sm font-bold text-charcoal-900">No private services proposed yet.</p>
          <p className="text-[11px] text-charcoal-100 max-w-md mx-auto leading-relaxed">
            Nothing is pre-filled. When an instructor proposes a service it appears here, unpriced,
            and you decide the price and whether it goes live.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => {
            const isOpen = expanded === s.id;
            return (
              <div key={s.id} className="rounded-2xl border border-hairline bg-white overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${statusChip(s.status)}`}>
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
                      {s.delivery_mode === 'internal' ? 'internal live server' : 'external link'}
                    </span>
                    <span className="ml-auto font-formula text-[11px] font-bold text-charcoal-900">
                      {s.price !== null ? `${s.price} ${s.currency}` : 'not priced'}
                    </span>
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-charcoal-900">{s.title}</h4>
                  {s.description && (
                    <p className="mt-1 text-xs text-charcoal-100 leading-relaxed">{s.description}</p>
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
                          run(`price-${s.id}`, async () => {
                            const value = Number(priceDraft[s.id]);
                            if (!Number.isFinite(value) || value <= 0) {
                              throw new Error('Enter a price greater than zero.');
                            }
                            await setPrivateServicePrice(s.id, value, s.currency || 'EGP');
                            setPriceDraft((d) => ({ ...d, [s.id]: '' }));
                          }, load)
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
                          run(`archive-${s.id}`, async () => {
                            await setPrivateServiceStatus(s.id, 'ARCHIVED');
                          }, load)
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
                          run(`activate-${s.id}`, async () => {
                            await setPrivateServiceStatus(s.id, 'ACTIVE');
                          }, load)
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
                            run(`slot-${s.id}`, async () => {
                              if (!slotStart || !slotEnd) throw new Error('Pick a start and an end.');
                              const startsAt = new Date(slotStart).toISOString();
                              const endsAt = new Date(slotEnd).toISOString();
                              await createPrivateServiceSlot({ serviceId: s.id, startsAt, endsAt });
                              setSlotStart('');
                              setSlotEnd('');
                            }, async () => {
                              await loadSlots(s.id);
                              await load();
                            })
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
                      <p className="text-[11px] text-charcoal-100">No slots yet for this service.</p>
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
                            <span className="text-[10px] text-charcoal-50 font-mono">{slot.timezone}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold ${
                                slot.status === 'OPEN'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
                                  run(`close-${slot.id}`, async () => {
                                    await closePrivateServiceSlot(slot.id);
                                  }, async () => {
                                    await loadSlots(s.id);
                                    await load();
                                  })
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
    </div>
  );
};
