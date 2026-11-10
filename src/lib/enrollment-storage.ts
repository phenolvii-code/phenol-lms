/**
 * PHENOL ACADEMY - Student Directory & Roster Helper
 * Direct sync with Supabase with multi-source fallback (Supabase + Enrollments + Local Cache).
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
      academicTrack: student.academicTrack || 'Thanaweya Amma',
      registeredAt: new Date().toISOString(),
    };
    inMemoryStudents.push(newStudent);

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('phenol_registered_students');
        const list = raw ? JSON.parse(raw) : [];
        list.push(newStudent);
        localStorage.setItem('phenol_registered_students', JSON.stringify(list));
        window.dispatchEvent(new Event('phenol_students_updated'));
      } catch (e) {}
    }
  }
};

export const getAggregatedStudentsDirectory = (enrollments: any[] = []): StudentOverview[] => {
  const studentMap = new Map<string, StudentOverview>();

  // 1. In-memory students synced from Supabase
  inMemoryStudents.forEach((st) => {
    const emailKey = st.email.toLowerCase().trim();
    if (!emailKey) return;
    studentMap.set(emailKey, {
      email: st.email,
      name: st.name,
      phone: st.phone,
      code: st.academicCode,
      track: st.academicTrack,
      registeredAt: st.registeredAt ? st.registeredAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      activeCoursesCount: 0,
      pendingRequestsCount: 0,
      overallProgressPercent: 0,
      averageQuizGrade: 0,
      lastActiveDate: 'Active',
      enrollments: [],
    });
  });

  // 2. Local storage cached students (if any)
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('phenol_registered_students');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((st: any) => {
            const emailKey = (st.email || '').toLowerCase().trim();
            if (emailKey && !studentMap.has(emailKey)) {
              studentMap.set(emailKey, {
                email: st.email,
                name: st.name || emailKey.split('@')[0],
                phone: st.phone || '',
                code: st.academicCode || st.code || 'PH-SCHOLAR',
                track: st.academicTrack || st.track || 'Thanaweya Amma',
                registeredAt: (st.registeredAt || new Date().toISOString()).slice(0, 10),
                activeCoursesCount: 0,
                pendingRequestsCount: 0,
                overallProgressPercent: 0,
                averageQuizGrade: 0,
                lastActiveDate: 'Active',
                enrollments: [],
              });
            }
          });
        }
      }
    } catch (e) {}
  }

  // 3. Students from course enrollments
  if (Array.isArray(enrollments)) {
    enrollments.forEach((e: any) => {
      const email = (e.student_email || e.studentEmail || '').toLowerCase().trim();
      if (!email) return;

      if (!studentMap.has(email)) {
        studentMap.set(email, {
          email: email,
          name: e.student_name || e.studentName || email.split('@')[0],
          phone: e.student_phone || e.studentPhone || '',
          code: e.student_code || e.studentCode || 'PH-SCHOLAR',
          track: e.student_track || e.studentTrack || 'Thanaweya Amma',
          registeredAt: (e.requested_at || e.requestedAt || new Date().toISOString()).slice(0, 10),
          activeCoursesCount: 0,
          pendingRequestsCount: 0,
          overallProgressPercent: 0,
          averageQuizGrade: 0,
          lastActiveDate: 'Active',
          enrollments: [],
        });
      }

      const st = studentMap.get(email)!;
      st.enrollments.push(e);
      if (e.status === 'ACTIVE') {
        st.activeCoursesCount += 1;
      } else if (e.status === 'PENDING') {
        st.pendingRequestsCount += 1;
      }
    });
  }

  return Array.from(studentMap.values());
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
        academicTrack: d.academic_track || 'Thanaweya Amma',
        registeredAt: d.created_at || new Date().toISOString(),
      }));
      return inMemoryStudents;
    }
  } catch (err) {
    console.warn('Error syncing students from Supabase:', err);
  }
  return inMemoryStudents;
};
