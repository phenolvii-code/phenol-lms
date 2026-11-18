import { supabase } from '@/lib/supabase';

// ==============================================================================
// Private services data module (migrations 028 & 029 - catalog, slots, bookings).
// READ via the definer RPCs; every WRITE via an RPC. No direct table writes:
// the catalog and bookings have zero client write policies, instructors can
// never price, and bookings follow pay-first-then-confirm.
// ==============================================================================

export type PrivateServiceStatus = 'PROPOSED' | 'ACTIVE' | 'ARCHIVED';
export type PrivateServiceDeliveryMode = 'external_link' | 'internal';
export type PrivateServiceSlotStatus = 'OPEN' | 'BOOKED' | 'CLOSED';
export type PrivateBookingStatus =
  | 'REQUESTED'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';
export type PrivateBookingMode = 'office_slot' | 'student_proposed';

export interface OfficePrivateServiceRow {
  id: string;
  instructor_email: string;
  instructor_name: string | null;
  title: string;
  description: string | null;
  duration_minutes: number;
  delivery_mode: PrivateServiceDeliveryMode;
  price: number | null;
  currency: string;
  status: PrivateServiceStatus;
  is_published: boolean;
  open_slots: number;
  created_at: string;
  priced_at: string | null;
  published_at: string | null;
}

export interface MyPrivateServiceRow {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  delivery_mode: PrivateServiceDeliveryMode;
  price: number | null;
  currency: string;
  status: PrivateServiceStatus;
  is_published: boolean;
  open_slots: number;
  created_at: string;
}

export interface PrivateServiceSlotRow {
  id: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  status: PrivateServiceSlotStatus;
  created_at: string;
}

// ------------------------------------------------------------------ reads ----

export async function listOfficePrivateServices(): Promise<OfficePrivateServiceRow[]> {
  const { data, error } = await supabase.rpc('office_list_private_services');
  if (error) {
    console.error('Error loading office private services:', error.message);
    return [];
  }
  return (data as OfficePrivateServiceRow[]) || [];
}

export async function listMyPrivateServices(): Promise<MyPrivateServiceRow[]> {
  const { data, error } = await supabase.rpc('list_my_private_services');
  if (error) {
    console.error('Error loading my private services:', error.message);
    return [];
  }
  return (data as MyPrivateServiceRow[]) || [];
}

export async function listOfficePrivateServiceSlots(
  serviceId: string
): Promise<PrivateServiceSlotRow[]> {
  const { data, error } = await supabase.rpc('office_list_private_service_slots', {
    p_service_id: serviceId,
  });
  if (error) {
    console.error('Error loading private service slots:', error.message);
    return [];
  }
  return (data as PrivateServiceSlotRow[]) || [];
}

// ----------------------------------------------------------------- writes ----

export async function proposePrivateService(input: {
  title: string;
  description?: string;
  durationMinutes: number;
  deliveryMode?: PrivateServiceDeliveryMode;
}): Promise<string> {
  const { data, error } = await supabase.rpc('propose_private_service', {
    p_title: input.title,
    p_description: input.description ?? null,
    p_duration_minutes: input.durationMinutes,
    p_delivery_mode: input.deliveryMode ?? 'external_link',
  });
  if (error) throw error;
  return data as string;
}

export async function updateMyPrivateService(input: {
  serviceId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  deliveryMode?: PrivateServiceDeliveryMode;
}): Promise<void> {
  const { error } = await supabase.rpc('update_my_private_service', {
    p_service_id: input.serviceId,
    p_title: input.title,
    p_description: input.description ?? null,
    p_duration_minutes: input.durationMinutes,
    p_delivery_mode: input.deliveryMode ?? null,
  });
  if (error) throw error;
}

export async function setPrivateServicePrice(
  serviceId: string,
  price: number,
  currency = 'EGP'
): Promise<void> {
  const { error } = await supabase.rpc('set_private_service_price', {
    p_service_id: serviceId,
    p_price: price,
    p_currency: currency,
  });
  if (error) throw error;
}

export async function setPrivateServiceStatus(
  serviceId: string,
  status: Extract<PrivateServiceStatus, 'ACTIVE' | 'ARCHIVED'>
): Promise<void> {
  const { error } = await supabase.rpc('set_private_service_status', {
    p_service_id: serviceId,
    p_status: status,
  });
  if (error) throw error;
}

export async function createPrivateServiceSlot(input: {
  serviceId: string;
  startsAt: string;
  endsAt: string;
  timezone?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_private_service_slot', {
    p_service_id: input.serviceId,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_timezone: input.timezone ?? 'Africa/Cairo',
  });
  if (error) throw error;
  return data as string;
}

export async function closePrivateServiceSlot(slotId: string): Promise<void> {
  const { error } = await supabase.rpc('close_private_service_slot', { p_slot_id: slotId });
  if (error) throw error;
}

// ==============================================================================
// Migration 029 - Private Service Bookings (Pay-First-Then-Confirm)
// ==============================================================================

export interface PublishedPrivateServiceRow {
  id: string;
  instructor_email: string;
  instructor_name: string | null;
  title: string;
  description: string | null;
  duration_minutes: number;
  delivery_mode: PrivateServiceDeliveryMode;
  price: number;
  currency: string;
  open_slots: number;
}

export interface OpenPrivateServiceSlotRow {
  id: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
}

export interface StudentPrivateBookingRow {
  id: string;
  service_id: string;
  slot_id: string | null;
  instructor_email: string;
  instructor_name: string | null;
  service_title: string;
  duration_minutes: number;
  delivery_mode: PrivateServiceDeliveryMode;
  booking_mode: PrivateBookingMode;
  scheduled_starts_at: string;
  scheduled_ends_at: string;
  timezone: string;
  price_snapshot: number;
  currency: string;
  payment_verified: boolean;
  payment_reference: string | null;
  payment_verified_at: string | null;
  session_link: string | null;
  internal_room_ref: string | null;
  student_notes: string | null;
  office_notes: string | null;
  cancellation_reason: string | null;
  status: PrivateBookingStatus;
  requested_at: string;
  confirmed_at: string | null;
}

export interface InstructorPrivateBookingRow {
  id: string;
  service_id: string;
  service_title: string;
  duration_minutes: number;
  delivery_mode: PrivateServiceDeliveryMode;
  student_name: string | null;
  student_notes: string | null;
  booking_mode: PrivateBookingMode;
  scheduled_starts_at: string;
  scheduled_ends_at: string;
  timezone: string;
  status: PrivateBookingStatus;
  session_link: string | null;
  internal_room_ref: string | null;
  requested_at: string;
  confirmed_at: string | null;
}

export interface OfficePrivateBookingRow {
  id: string;
  service_id: string;
  slot_id: string | null;
  instructor_email: string;
  instructor_name: string | null;
  service_title: string;
  duration_minutes: number;
  delivery_mode: PrivateServiceDeliveryMode;
  student_id: string;
  student_email: string;
  student_name: string | null;
  student_phone: string | null;
  student_notes: string | null;
  booking_mode: PrivateBookingMode;
  scheduled_starts_at: string;
  scheduled_ends_at: string;
  timezone: string;
  price_snapshot: number;
  currency: string;
  payment_verified: boolean;
  payment_reference: string | null;
  payment_verified_by_email: string | null;
  payment_verified_at: string | null;
  session_link: string | null;
  internal_room_ref: string | null;
  office_notes: string | null;
  cancellation_reason: string | null;
  status: PrivateBookingStatus;
  requested_at: string;
  confirmed_by_email: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_by_email: string | null;
  cancelled_at: string | null;
}

export async function listPublishedPrivateServices(): Promise<PublishedPrivateServiceRow[]> {
  const { data, error } = await supabase.rpc('list_published_private_services');
  if (error) {
    console.error('Error loading published private services:', error.message);
    return [];
  }
  return (data as PublishedPrivateServiceRow[]) || [];
}

export async function listOpenPrivateServiceSlots(
  serviceId: string
): Promise<OpenPrivateServiceSlotRow[]> {
  const { data, error } = await supabase.rpc('list_open_private_service_slots', {
    p_service_id: serviceId,
  });
  if (error) {
    console.error('Error loading open private service slots:', error.message);
    return [];
  }
  return (data as OpenPrivateServiceSlotRow[]) || [];
}

export async function requestPrivateServiceBooking(input: {
  serviceId: string;
  slotId?: string | null;
  proposedStartsAt?: string | null;
  studentPhone?: string | null;
  studentNotes?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc('request_private_service_booking', {
    p_service_id: input.serviceId,
    p_slot_id: input.slotId ?? null,
    p_proposed_starts_at: input.proposedStartsAt ?? null,
    p_student_phone: input.studentPhone ?? null,
    p_student_notes: input.studentNotes ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function cancelMyPrivateServiceBooking(
  bookingId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase.rpc('cancel_my_private_service_booking', {
    p_booking_id: bookingId,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function listMyStudentPrivateBookings(): Promise<StudentPrivateBookingRow[]> {
  const { data, error } = await supabase.rpc('list_my_student_private_bookings');
  if (error) {
    console.error('Error loading student private bookings:', error.message);
    return [];
  }
  return (data as StudentPrivateBookingRow[]) || [];
}

export async function listInstructorPrivateBookings(): Promise<InstructorPrivateBookingRow[]> {
  const { data, error } = await supabase.rpc('list_instructor_private_bookings');
  if (error) {
    console.error('Error loading instructor private bookings:', error.message);
    return [];
  }
  return (data as InstructorPrivateBookingRow[]) || [];
}

export async function listOfficePrivateServiceBookings(
  status?: PrivateBookingStatus | ''
): Promise<OfficePrivateBookingRow[]> {
  const { data, error } = await supabase.rpc('office_list_private_service_bookings', {
    p_status: status || null,
  });
  if (error) {
    console.error('Error loading office private service bookings:', error.message);
    return [];
  }
  return (data as OfficePrivateBookingRow[]) || [];
}

export async function officeMarkPrivateBookingAwaitingPayment(input: {
  bookingId: string;
  startsAt?: string | null;
  endsAt?: string | null;
  officeNotes?: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc('office_mark_private_booking_awaiting_payment', {
    p_booking_id: input.bookingId,
    p_starts_at: input.startsAt ?? null,
    p_ends_at: input.endsAt ?? null,
    p_office_notes: input.officeNotes ?? null,
  });
  if (error) throw error;
}

export async function officeVerifyPrivateBookingPayment(input: {
  bookingId: string;
  paymentReference: string;
  officeNotes?: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc('office_verify_private_booking_payment', {
    p_booking_id: input.bookingId,
    p_payment_reference: input.paymentReference,
    p_office_notes: input.officeNotes ?? null,
  });
  if (error) throw error;
}

export async function officeConfirmPrivateServiceBooking(input: {
  bookingId: string;
  sessionLink?: string | null;
  internalRoomRef?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  officeNotes?: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc('office_confirm_private_service_booking', {
    p_booking_id: input.bookingId,
    p_session_link: input.sessionLink ?? null,
    p_internal_room_ref: input.internalRoomRef ?? null,
    p_starts_at: input.startsAt ?? null,
    p_ends_at: input.endsAt ?? null,
    p_office_notes: input.officeNotes ?? null,
  });
  if (error) throw error;
}

export async function officeSetPrivateBookingStatus(input: {
  bookingId: string;
  status: Extract<PrivateBookingStatus, 'COMPLETED' | 'NO_SHOW' | 'CANCELLED'>;
  reason?: string | null;
  officeNotes?: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc('office_set_private_booking_status', {
    p_booking_id: input.bookingId,
    p_status: input.status,
    p_reason: input.reason ?? null,
    p_office_notes: input.officeNotes ?? null,
  });
  if (error) throw error;
}
