'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import {
  OpenPrivateServiceSlotRow,
  PublishedPrivateServiceRow,
  StudentPrivateBookingRow,
  cancelMyPrivateServiceBooking,
  listMyStudentPrivateBookings,
  listOpenPrivateServiceSlots,
  listPublishedPrivateServices,
  requestPrivateServiceBooking,
} from '@/lib/data/privateServices';

// ==============================================================================
// Student - 1:1 Private Services & Bookings (migration 029).
// Students browse active office-priced services, request a booking (either by
// picking an OPEN office slot or proposing a custom time), track payment
// verification & confirmation, join confirmed sessions, or cancel unconfirmed
// requests.
// ==============================================================================

export const StudentPrivateServicesTab: React.FC = () => {
  const [services, setServices] = useState<PublishedPrivateServiceRow[]>([]);
  const [bookings, setBookings] = useState<StudentPrivateBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedService, setSelectedService] = useState<PublishedPrivateServiceRow | null>(null);
  const [openSlots, setOpenSlots] = useState<OpenPrivateServiceSlotRow[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingMode, setBookingMode] = useState<'office_slot' | 'student_proposed'>('office_slot');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [proposedStart, setProposedStart] = useState<string>('');
  const [studentPhone, setStudentPhone] = useState<string>('');
  const [studentNotes, setStudentNotes] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    const [svcList, bkgList] = await Promise.all([
      listPublishedPrivateServices(),
      listMyStudentPrivateBookings(),
    ]);
    setServices(svcList);
    setBookings(bkgList);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openBookingPanel = async (svc: PublishedPrivateServiceRow) => {
    setSelectedService(svc);
    setError(null);
    setSuccess(null);
    setSelectedSlotId('');
    setProposedStart('');
    setStudentNotes('');
    setSlotsLoading(true);
    const slots = await listOpenPrivateServiceSlots(svc.id);
    setOpenSlots(slots);
    setSlotsLoading(false);
    if (slots.length > 0) {
      setBookingMode('office_slot');
      setSelectedSlotId(slots[0].id);
    } else {
      setBookingMode('student_proposed');
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (bookingMode === 'office_slot') {
        if (!selectedSlotId) throw new Error('Please select an open slot.');
        await requestPrivateServiceBooking({
          serviceId: selectedService.id,
          slotId: selectedSlotId,
          studentPhone: studentPhone.trim() || null,
          studentNotes: studentNotes.trim() || null,
        });
      } else {
        if (!proposedStart) throw new Error('Please choose a proposed date and time.');
        const iso = new Date(proposedStart).toISOString();
        await requestPrivateServiceBooking({
          serviceId: selectedService.id,
          proposedStartsAt: iso,
          studentPhone: studentPhone.trim() || null,
          studentNotes: studentNotes.trim() || null,
        });
      }
      setSelectedService(null);
      setSuccess(
        'Booking request submitted! Complete payment with the academy office so your session can be confirmed and your session link issued.'
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCancelBooking = async (b: StudentPrivateBookingRow) => {
    const reason = window.prompt(
      `Reason for cancelling your booking request (${b.service_title}):`
    );
    if (!reason || reason.trim().length < 3) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await cancelMyPrivateServiceBooking(b.id, reason.trim());
      setSuccess('Booking request cancelled.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-hairline pb-4">
        <div>
          <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            1:1 PRIVATE ACADEMIC SESSIONS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display mt-1">
            Private Services & Mentoring
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-100 mt-1 font-sans">
            Book a 1:1 session by picking an open office slot or proposing a preferred time.
            Confirmation and session links are issued after the academy office verifies payment.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="p-2 rounded-xl border border-hairline bg-ivory-100 hover:bg-ivory-200 disabled:opacity-50 self-start"
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

      {/* Booking Form Drawer for Selected Service */}
      {selectedService && (
        <form
          onSubmit={handleSubmitBooking}
          className="p-5 rounded-2xl border-2 border-burgundy-500 bg-ivory-100 space-y-4 shadow-quiet"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-burgundy-600 font-bold">
                Request 1:1 Booking (Pay-First-Then-Confirm)
              </span>
              <h3 className="text-base font-bold text-charcoal-900 font-display">
                {selectedService.title}
              </h3>
              <p className="text-xs text-charcoal-100">
                Instructor: {selectedService.instructor_name || selectedService.instructor_email} •{' '}
                {selectedService.duration_minutes} minutes •{' '}
                <strong className="text-burgundy-900">
                  {selectedService.price} {selectedService.currency}
                </strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedService(null)}
              className="p-1.5 rounded-lg border border-hairline bg-white hover:bg-ivory-200 text-charcoal-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBookingMode('office_slot')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                bookingMode === 'office_slot'
                  ? 'bg-charcoal-900 text-ivory-100 border-charcoal-900'
                  : 'bg-white text-charcoal-900 border-hairline'
              }`}
            >
              Pick an Open Office Slot ({openSlots.length})
            </button>
            <button
              type="button"
              onClick={() => setBookingMode('student_proposed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                bookingMode === 'student_proposed'
                  ? 'bg-charcoal-900 text-ivory-100 border-charcoal-900'
                  : 'bg-white text-charcoal-900 border-hairline'
              }`}
            >
              Propose a Preferred Time
            </button>
          </div>

          {bookingMode === 'office_slot' ? (
            slotsLoading ? (
              <p className="text-xs text-charcoal-100">Loading open slots…</p>
            ) : openSlots.length === 0 ? (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                No pre-scheduled open slots right now — switch to &ldquo;Propose a Preferred
                Time&rdquo; above to suggest your preferred date and time.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {openSlots.map((sl) => (
                  <label
                    key={sl.id}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs ${
                      selectedSlotId === sl.id
                        ? 'border-burgundy-500 bg-burgundy-50/50 text-charcoal-900 font-bold'
                        : 'border-hairline bg-white text-charcoal-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="office_slot"
                      value={sl.id}
                      checked={selectedSlotId === sl.id}
                      onChange={() => setSelectedSlotId(sl.id)}
                    />
                    <span className="font-mono text-[11px]">
                      {new Date(sl.starts_at).toLocaleString()} →{' '}
                      {new Date(sl.ends_at).toLocaleTimeString()} ({sl.timezone})
                    </span>
                  </label>
                ))}
              </div>
            )
          ) : (
            <label className="block space-y-1 text-xs">
              <span className="font-mono text-[10px] uppercase text-charcoal-100">
                Proposed Start Date & Time (duration: {selectedService.duration_minutes} min)
              </span>
              <input
                type="datetime-local"
                required
                value={proposedStart}
                onChange={(e) => setProposedStart(e.target.value)}
                className="w-full sm:w-72 px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500 block"
              />
            </label>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="WhatsApp / phone number (optional)"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
            />
            <input
              type="text"
              placeholder="Topics or questions you want to cover (optional)"
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-hairline rounded-xl focus:outline-none focus:border-burgundy-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-charcoal-100">
              Fee snapshot:{' '}
              <strong>
                {selectedService.price} {selectedService.currency}
              </strong>{' '}
              (session is confirmed once the academy office verifies payment).
            </p>
            <button
              type="submit"
              disabled={busy || (bookingMode === 'office_slot' && !selectedSlotId)}
              className="px-5 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {busy ? 'Submitting…' : 'Submit Booking Request'}
            </button>
          </div>
        </form>
      )}

      {/* Available Services Catalog */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-charcoal-900 font-display uppercase tracking-wider">
          Available 1:1 Services ({services.length})
        </h3>
        {loading ? (
          <div className="py-12 text-center text-xs text-charcoal-100">
            Loading private services…
          </div>
        ) : services.length === 0 ? (
          <div className="py-12 rounded-2xl border border-hairline bg-ivory-100 text-center space-y-1">
            <p className="text-sm font-bold text-charcoal-900">
              No active private services published yet.
            </p>
            <p className="text-xs text-charcoal-100">
              When the academy office activates a 1:1 service, it will appear here with its official
              price and available slots.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-hairline bg-ivory-100 p-5 flex flex-col justify-between gap-4 shadow-quiet"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-burgundy-50 text-burgundy-800 border border-burgundy-200 text-[10px] font-mono font-bold">
                      {s.price} {s.currency}
                    </span>
                    <span className="text-[11px] text-charcoal-100 font-formula flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {s.duration_minutes} min
                    </span>
                    <span className="text-[11px] text-charcoal-100 font-formula flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      {s.delivery_mode === 'internal' ? 'Live Server' : 'Live Video Link'}
                    </span>
                    <span className="ml-auto text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {Number(s.open_slots)} open slot{Number(s.open_slots) === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-charcoal-900 font-display">{s.title}</h4>
                  <p className="text-xs text-charcoal-100">
                    Instructor: <strong>{s.instructor_name || s.instructor_email}</strong>
                  </p>
                  {s.description && (
                    <p className="text-xs text-charcoal-100 leading-relaxed">{s.description}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openBookingPanel(s)}
                  className="w-full py-2.5 rounded-xl bg-charcoal-900 hover:bg-black text-ivory-100 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Book 1:1 Session</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Bookings */}
      <div className="space-y-3 pt-4 border-t border-hairline">
        <h3 className="text-sm font-bold text-charcoal-900 font-display uppercase tracking-wider">
          My Private Session Bookings ({bookings.length})
        </h3>
        {bookings.length === 0 ? (
          <div className="py-10 rounded-2xl border border-hairline bg-ivory-100 text-center text-xs text-charcoal-100">
            You have not requested any private sessions yet.
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-hairline bg-ivory-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : b.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : b.status === 'CANCELLED' || b.status === 'NO_SHOW'
                          ? 'bg-ivory-200 text-charcoal-100 border-hairline'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {b.status}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-mono ${
                        b.payment_state === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : b.payment_state === 'REFUNDED'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : b.payment_state === 'IN_REVIEW'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {b.payment_state === 'ACTIVE'
                        ? 'Payment Verified'
                        : b.payment_state === 'REFUNDED'
                        ? 'Refunded'
                        : b.payment_state === 'IN_REVIEW'
                        ? 'Payment under review'
                        : 'Awaiting Payment Verification'}
                    </span>
                    <span className="font-mono text-xs font-bold text-burgundy-900">
                      {b.price_snapshot} {b.currency}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-charcoal-900 font-display">
                    {b.service_title}
                  </h4>
                  <p className="text-xs text-charcoal-100">
                    Instructor: {b.instructor_name || b.instructor_email} •{' '}
                    <span className="font-mono text-[11px]">
                      {new Date(b.scheduled_starts_at).toLocaleString()} →{' '}
                      {new Date(b.scheduled_ends_at).toLocaleTimeString()} ({b.timezone})
                    </span>
                  </p>
                  {b.office_notes && (
                    <p className="text-xs text-charcoal-100">Office note: {b.office_notes}</p>
                  )}
                  {b.cancellation_reason && (
                    <p className="text-xs text-red-700">
                      Cancellation reason: {b.cancellation_reason}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {b.status === 'CONFIRMED' && b.session_link && (
                    <a
                      href={b.session_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                    >
                      <span>Join Live Session</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {b.status === 'CONFIRMED' && b.internal_room_ref && (
                    <span className="px-3 py-1.5 rounded-xl bg-ivory-200 border border-hairline text-xs font-mono font-bold text-charcoal-900">
                      Room: {b.internal_room_ref}
                    </span>
                  )}
                  {(b.status === 'REQUESTED' || b.status === 'AWAITING_PAYMENT') &&
                    (b.payment_verified ? (
                      <span className="text-[11px] text-charcoal-100 font-mono">
                        Payment verified — contact the academy office to cancel or refund
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleCancelBooking(b)}
                        className="px-3 py-1.5 rounded-xl border border-hairline bg-white hover:bg-red-50 text-charcoal-100 hover:text-red-700 text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Cancel Request
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
