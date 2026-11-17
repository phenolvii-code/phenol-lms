import { supabase } from '@/lib/supabase';

// ==============================================================================
// Academy Office data module (migration 024).
// All writes go through the office RPCs (023/024) - never direct table writes.
// ==============================================================================

export interface OfficeCourseRow {
  id: string;
  code: string | null;
  title: string;
  instructor_email: string | null;
  approval_status: string;
  is_published: boolean;
  price: number | null;
  currency: string;
  subscription_months: number;
  created_at: string;
}

export interface PriceHistoryRow {
  id: string;
  course_id: string;
  price: number | null;
  currency: string | null;
  subscription_months: number | null;
  changed_by_email: string | null;
  changed_by_role: string | null;
  changed_at: string;
}

export interface PaymentRow {
  id: string;
  student_email: string;
  course_id: string;
  instructor_email: string | null;
  method: string;
  gross_amount: number;
  currency: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  reference: string | null;
  collected_at: string | null;
  price_snapshot: number | null;
  platform_commission_pct: number | null;
  platform_amount: number | null;
  instructor_amount: number | null;
  processing_fee: number;
  created_at: string;
  note: string | null;
}

// ---------------------------------------------------------------- courses ----

export async function listOfficeCourses(): Promise<OfficeCourseRow[]> {
  const { data, error } = await supabase.rpc('office_list_courses');
  if (error) {
    console.error('Error loading office courses:', error.message);
    return [];
  }
  return (data as OfficeCourseRow[]) || [];
}

export async function setCoursePrice(
  courseId: string,
  price: number | null,
  subscriptionMonths?: number,
  currency?: string
): Promise<void> {
  const { error } = await supabase.rpc('set_course_price', {
    p_course_id: courseId,
    p_price: price,
    p_subscription_months: subscriptionMonths ?? null,
    p_currency: currency ?? null,
  });
  if (error) throw error;
}

export async function setCoursePublished(
  courseId: string,
  published: boolean,
  note?: string
): Promise<void> {
  const { error } = await supabase.rpc('set_course_published', {
    p_course_id: courseId,
    p_published: published,
    p_note: note ?? null,
  });
  if (error) throw error;
}

export async function setCourseApproval(
  courseId: string,
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
): Promise<void> {
  const { error } = await supabase.rpc('set_course_approval', {
    p_course_id: courseId,
    p_status: status,
  });
  if (error) throw error;
}

export async function listPriceHistory(courseId: string): Promise<PriceHistoryRow[]> {
  const { data, error } = await supabase
    .from('course_price_history')
    .select('id, course_id, price, currency, subscription_months, changed_by_email, changed_by_role, changed_at')
    .eq('course_id', courseId)
    .order('changed_at', { ascending: false });
  if (error) {
    console.error('Error loading price history:', error.message);
    return [];
  }
  return (data as PriceHistoryRow[]) || [];
}

// --------------------------------------------------------------- payments ----

export async function listPayments(): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error('Error loading payments:', error.message);
    return [];
  }
  return (data as PaymentRow[]) || [];
}

export async function recordPayment(input: {
  studentEmail: string;
  courseId: string;
  method: 'kashier' | 'cash' | 'instapay' | 'vodafone_cash' | 'other';
  grossAmount: number;
  reference?: string | null;
  collectedAt?: string | null;
  processingFee?: number;
  note?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc('record_payment', {
    p_student_email: input.studentEmail.trim().toLowerCase(),
    p_course_id: input.courseId,
    p_method: input.method,
    p_gross_amount: input.grossAmount,
    p_reference: input.reference ?? null,
    p_collected_at: input.collectedAt ? new Date(input.collectedAt).toISOString() : null,
    p_processing_fee: input.processingFee ?? 0,
    p_note: input.note ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function setPaymentStatus(
  paymentId: string,
  newStatus: 'UNDER_REVIEW' | 'VERIFIED' | 'FAILED' | 'CANCELLED' | 'REFUNDED',
  note?: string | null
): Promise<void> {
  const { error } = await supabase.rpc('set_payment_status', {
    p_payment_id: paymentId,
    p_new_status: newStatus,
    p_note: note ?? null,
  });
  if (error) throw error;
}

export async function waiveEnrollmentPayment(
  studentEmail: string,
  courseId: string,
  note: string
): Promise<void> {
  const { error } = await supabase.rpc('waive_enrollment_payment', {
    p_student_email: studentEmail.trim().toLowerCase(),
    p_course_id: courseId,
    p_note: note,
  });
  if (error) throw error;
}
