import { supabase } from '@/lib/supabase';

// ==============================================================================
// Private services data module (migration 028 - catalog + slots only).
// READ via the definer RPCs; every WRITE via an RPC. No direct table writes:
// the catalog has zero client write policies, and instructors can never price.
// Bookings (029) and the money ledger (030) are not part of this module yet.
// ==============================================================================

export type PrivateServiceStatus = 'PROPOSED' | 'ACTIVE' | 'ARCHIVED';
export type PrivateServiceDeliveryMode = 'external_link' | 'internal';
export type PrivateServiceSlotStatus = 'OPEN' | 'BOOKED' | 'CLOSED';

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
