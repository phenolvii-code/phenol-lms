/**
 * PHENOL ACADEMY - Student Directory & Roster Helper
 * In-memory directory for the Admin Roster tab.
 * No localStorage persistence; direct reads/writes route through Supabase RPCs.
 */

import { supabase } from '@/lib/supabase';

export interface RegisteredStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  academicCode: string;
  academicTrack: string;
  registeredAt: string;
}

export interface StudentOverview {
  email: string;
  name: string;
  phone: string;
  code: string;
  track: string;
  registeredAt: string;
  activeCoursesCount: number;
  pendingRequestsCount: number;
  overallProgressPercent: number;
  averageQuizGrade: number;
  lastActiveDate: string;
  enrollments: any[];
}

let inMemoryStudents: RegisteredStudent[] = [];

export const getRegisteredStudents = (): RegisteredStudent[] => {
  return inMemoryStudents;
};

export const recordRegisteredStudent = async (student: {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  academicTrack?: string;
}): Promise<void> => {
  if (!student.email) return;
  const cleanEmail = student.email.toLowerCase().trim();
  const existing = inMemoryStudents.find((s) => s.email.toLowerCase() === cleanEmail);
  if (!existing) {
    const newStudent: RegisteredStudent = {
      id: student.id || `stu-${Date.now()}`,
      name: student.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: student.phone || '',
      academicCode: `PH-${Math.floor(1000 + Math.random() * 9000)}`,
      academicTrack: student.academicTrack || 'Public Secondary AR',
      registeredAt: new Date().toISOString(),
    };
    inMemoryStudents.push(newStudent);
  }
};

export const getAggregatedStudentsDirectory = (): StudentOverview[] => {
  return inMemoryStudents.map((st) => ({
    email: st.email,
    name: st.name,
    phone: st.phone,
    code: st.academicCode,
    track: st.academicTrack,
    registeredAt: st.registeredAt.slice(0, 10),
    activeCoursesCount: 0,
    pendingRequestsCount: 0,
    overallProgressPercent: 0,
    averageQuizGrade: 0,
    lastActiveDate: 'Active',
    enrollments: [],
  }));
};

export const syncWithServerStudents = async (): Promise<RegisteredStudent[]> => {
  try {
    const { data, error } = await supabase
      .from('registered_students')
      .select('id, name, email, phone, academic_code, academic_track, created_at');

    if (!error && Array.isArray(data)) {
      inMemoryStudents = data.map((d: any) => ({
        id: d.id,
        name: d.name || d.email?.split('@')[0] || 'Student',
        email: d.email,
        phone: d.phone || '',
        academicCode: d.academic_code || 'PH-SCHOLAR',
        academicTrack: d.academic_track || 'Public Secondary AR',
        registeredAt: d.created_at || new Date().toISOString(),
      }));
      return inMemoryStudents;
    }
  } catch (err) {
    console.warn('Error syncing students from Supabase:', err);
  }
  return inMemoryStudents;
};
