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

/**
 * Admin-only: Directly sets/resets a student's password in auth.users via RPC
 */
export async function adminSetStudentPassword(
  studentEmail: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('admin_set_student_password', {
      p_student_email: studentEmail.trim().toLowerCase(),
      p_new_password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update student password.' };
  }
}

/**
 * Admin-only: Revoke or unenroll student from a course
 */
export async function adminRevokeEnrollment(enrollmentId: string): Promise<void> {
  try {
    const { error } = await supabase.from('course_enrollments').delete().eq('id', enrollmentId);
    if (error) {
      await setEnrollmentStatus(enrollmentId, 'REJECTED');
    }
  } catch (e) {
    await setEnrollmentStatus(enrollmentId, 'REJECTED');
  }
}

/**
 * Super Admin: Expel / permanently delete user and their enrollments
 */
export async function adminDeleteStudentAccount(studentEmail: string, studentId?: string): Promise<void> {
  const cleanEmail = studentEmail.trim().toLowerCase();
  try {
    await supabase.from('course_enrollments').delete().eq('student_email', cleanEmail);
    await supabase.from('registered_students').delete().eq('email', cleanEmail);
    if (studentId) {
      await supabase.from('profiles').delete().eq('id', studentId);
      await supabase.from('registered_students').delete().eq('id', studentId);
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('phenol_registered_students');
      if (raw) {
        const list = JSON.parse(raw);
        const filtered = list.filter((st: any) => (st.email || '').toLowerCase() !== cleanEmail);
        localStorage.setItem('phenol_registered_students', JSON.stringify(filtered));
      }
      localStorage.removeItem(`phenol_user_role_${cleanEmail}`);
      window.dispatchEvent(new Event('phenol_students_updated'));
    } catch (e) {}
  }
}
