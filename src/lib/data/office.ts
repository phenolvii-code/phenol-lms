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
  settlement_id: string | null;
  created_at: string;
  note: string | null;
}

export interface EnrollmentQueueRow {
  id: string;
  student_email: string;
  student_name: string;
  student_phone: string | null;
  student_code: string | null;
  student_track: string | null;
  course_id: string;
  course_title: string;
  course_code: string | null;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  requested_at: string | null;
  approved_at: string | null;
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
  // 026: definer RPC - the office reads the ledger without direct table access
  // (the payments RLS policy is owner/super-admin scoped, which silently
  // returned zero rows for the secretary).
  const { data, error } = await supabase.rpc('office_list_payments');
  if (error) {
    console.error('Error loading payments:', error.message);
    return [];
  }
  return (data as PaymentRow[]) || [];
}

export async function listEnrollmentQueue(): Promise<EnrollmentQueueRow[]> {
  const { data, error } = await supabase.rpc('office_list_enrollment_queue');
  if (error) {
    console.error('Error loading enrollment queue:', error.message);
    return [];
  }
  return (data as EnrollmentQueueRow[]) || [];
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

// ==============================================================================
// Settlements, Commissions & Financial Ledgers (migration 025).
// ==============================================================================

export interface InstructorSettlementRow {
  id: string;
  instructor_email: string;
  period_start: string;
  period_end: string;
  verified_payments_count: number;
  gross_collected: number;
  platform_share: number;
  processing_fees: number;
  net_instructor_payout: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  payout_method: string | null;
  payout_reference: string | null;
  paid_at: string | null;
  note: string | null;
  created_at: string;
}

export interface InstructorPaymentLedgerItem {
  id: string;
  course_id: string;
  course_title: string | null;
  method: string;
  gross_amount: number;
  currency: string;
  status: string;
  platform_commission_pct: number | null;
  platform_amount: number | null;
  processing_fee: number;
  instructor_amount: number | null;
  verified_at: string | null;
  created_at: string;
}

export interface InstructorPrivateServicePaymentLedgerItem {
  id: string;
  booking_id: string;
  service_title: string | null;
  method: string;
  gross_amount: number;
  currency: string;
  status: string;
  platform_commission_pct: number | null;
  platform_amount: number | null;
  processing_fee: number;
  instructor_amount: number | null;
  verified_at: string | null;
  created_at: string;
}

export interface InstructorFinancialLedger {
  instructor_email: string;
  currency: string;
  custom_commission_pct: number | null;
  default_commission_pct: number;
  effective_commission_pct: number;
  verified_payments_count: number;
  gross_collected: number;
  platform_share: number;
  processing_fees: number;
  net_instructor_earnings: number;
  paid_settlements_total: number;
  pending_settlements_total: number;
  unsettled_balance: number;
  payments: InstructorPaymentLedgerItem[];
  private_service_payments?: InstructorPrivateServicePaymentLedgerItem[];
  settlements: InstructorSettlementRow[];
}

export interface InstructorRevenueSummary {
  email: string;
  name: string;
  custom_commission_pct: number | null;
  effective_commission_pct: number;
  courses_count: number;
  verified_payments_count: number;
  gross_collected: number;
  platform_share: number;
  instructor_net: number;
  paid_out: number;
  pending_settlement: number;
}

export interface SuperAdminFinancialOverview {
  default_commission_pct: number;
  currency: string;
  verified_payments_count: number;
  pending_payments_count: number;
  refunded_payments_count: number;
  total_gross_verified: number;
  total_platform_revenue: number;
  total_instructor_share: number;
  total_processing_fees: number;
  total_refunded_gross: number;
  total_settled_paid: number;
  total_settlements_pending: number;
  instructors: InstructorRevenueSummary[];
  settlements: InstructorSettlementRow[];
}

export async function getInstructorFinancialLedger(
  instructorEmail?: string
): Promise<InstructorFinancialLedger | null> {
  const { data, error } = await supabase.rpc('get_instructor_financial_ledger', {
    p_instructor_email: instructorEmail ? instructorEmail.trim().toLowerCase() : null,
  });
  if (error) {
    console.error('Error loading instructor financial ledger:', error.message);
    return null;
  }
  return (data as InstructorFinancialLedger) || null;
}

export async function getSuperAdminFinancialOverview(): Promise<SuperAdminFinancialOverview | null> {
  const { data, error } = await supabase.rpc('get_super_admin_financial_overview');
  if (error) {
    console.error('Error loading super-admin financial overview:', error.message);
    return null;
  }
  return (data as SuperAdminFinancialOverview) || null;
}

export async function setInstructorCommission(
  instructorEmail: string,
  commissionPct: number | null,
  note?: string
): Promise<void> {
  const { error } = await supabase.rpc('set_instructor_commission', {
    p_instructor_email: instructorEmail.trim().toLowerCase(),
    p_commission_pct: commissionPct,
    p_note: note ?? null,
  });
  if (error) throw error;
}

export async function setDefaultPlatformCommission(
  commissionPct: number,
  note?: string
): Promise<void> {
  const { error } = await supabase.rpc('set_default_platform_commission', {
    p_commission_pct: commissionPct,
    p_note: note ?? null,
  });
  if (error) throw error;
}

export async function createInstructorSettlement(input: {
  instructorEmail: string;
  periodStart: string;
  periodEnd: string;
  note?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_instructor_settlement', {
    p_instructor_email: input.instructorEmail.trim().toLowerCase(),
    p_period_start: input.periodStart,
    p_period_end: input.periodEnd,
    p_note: input.note ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function setSettlementStatus(input: {
  settlementId: string;
  newStatus: 'PAID' | 'CANCELLED';
  payoutMethod?: 'bank_transfer' | 'instapay' | 'vodafone_cash' | 'cash' | 'other' | null;
  payoutReference?: string | null;
  note?: string | null;
}): Promise<void> {
  const { error } = await supabase.rpc('set_settlement_status', {
    p_settlement_id: input.settlementId,
    p_new_status: input.newStatus,
    p_payout_method: input.payoutMethod ?? null,
    p_payout_reference: input.payoutReference ?? null,
    p_note: input.note ?? null,
  });
  if (error) throw error;
}

