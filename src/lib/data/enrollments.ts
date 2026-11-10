import { supabase } from '@/lib/supabase';

export interface CourseEnrollmentRecord {
  id: string;
  student_id: string;
  student_email: string;
  student_name: string;
  student_phone?: string;
  student_code?: string;
  student_track?: string;
  course_id: string;
  course_title: string;
  course_code?: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED';
  requested_at?: string;
  approved_at?: string;
}

export async function requestEnrollment(courseId: string) {
  const { data, error } = await supabase.rpc('request_enrollment', {
    p_course_id: courseId,
  });
  if (error) throw error;
  return data;
}

export async function setEnrollmentStatus(
  enrollmentId: string,
  status: 'PENDING' | 'ACTIVE' | 'REJECTED'
) {
  const { error } = await supabase.rpc('set_enrollment_status', {
    p_id: enrollmentId,
    p_status: status,
  });
  if (error) throw error;
}

export async function adminEnrollStudent(
  studentEmail: string,
  courseId: string
): Promise<CourseEnrollmentRecord> {
  const { data, error } = await supabase.rpc('admin_enroll_student', {
    p_student_email: studentEmail,
    p_course_id: courseId,
  });
  if (error) throw error;
  return data;
}

export async function listMyEnrollments(): Promise<CourseEnrollmentRecord[]> {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('*')
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error loading my enrollments:', error);
    return [];
  }
  return data || [];
}

export async function listAllEnrollments(): Promise<CourseEnrollmentRecord[]> {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('*')
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error loading all enrollments (admin):', error);
    return [];
  }
  return data || [];
}
