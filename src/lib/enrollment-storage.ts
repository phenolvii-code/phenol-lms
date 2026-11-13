/**
 * PHENOL ACADEMY - Student Directory & Roster Helper
 * Direct sync with Supabase with multi-source fallback (registered_students + profiles + enrollments + Local Cache).
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
  role?: 'instructor' | 'student' | 'SUPER_ADMIN';
}

export interface StudentOverview {
  id?: string;
  email: string;
  name: string;
  phone: string;
  code: string;
  track: string;
  role?: 'instructor' | 'student' | 'SUPER_ADMIN';
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
  role?: 'instructor' | 'student' | 'SUPER_ADMIN';
}): Promise<void> => {
  if (!student.email) return;
  const cleanEmail = student.email.toLowerCase().trim();
  const existing = inMemoryStudents.find((s) => s.email.toLowerCase() === cleanEmail);
  const newStudent: RegisteredStudent = {
    id: student.id || existing?.id || `stu-${Date.now()}`,
    name: student.name || existing?.name || cleanEmail.split('@')[0],
    email: cleanEmail,
    phone: student.phone || existing?.phone || '',
    academicCode: existing?.academicCode || `PH-${Math.floor(1000 + Math.random() * 9000)}`,
    academicTrack: student.academicTrack || existing?.academicTrack || 'Secondary & Baccalaureate',
    registeredAt: existing?.registeredAt || new Date().toISOString(),
    role: student.role || existing?.role || 'student',
  };

  if (!existing) {
    inMemoryStudents.push(newStudent);
  } else {
    Object.assign(existing, newStudent);
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('phenol_registered_students');
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((x: any) => (x.email || '').toLowerCase() === cleanEmail);
      if (idx >= 0) {
        list[idx] = newStudent;
      } else {
        list.push(newStudent);
      }
      localStorage.setItem('phenol_registered_students', JSON.stringify(list));
      window.dispatchEvent(new Event('phenol_students_updated'));
    } catch (e) {}
  }
};

export const getAggregatedStudentsDirectory = (enrollments: any[] = []): StudentOverview[] => {
  const studentMap = new Map<string, StudentOverview>();

  // 1. In-memory students synced from Supabase (registered_students + profiles)
  inMemoryStudents.forEach((st) => {
    const emailKey = st.email.toLowerCase().trim();
    if (!emailKey) return;
    studentMap.set(emailKey, {
      id: st.id,
      email: st.email,
      name: st.name,
      phone: st.phone,
      code: st.academicCode,
      track: st.academicTrack,
      role: st.role || (emailKey === 'phenolvii@gmail.com' ? 'SUPER_ADMIN' : 'student'),
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
            if (emailKey) {
              const customRole = localStorage.getItem(`phenol_user_role_${emailKey}`);
              if (!studentMap.has(emailKey)) {
                studentMap.set(emailKey, {
                  id: st.id || `stu-${Date.now()}`,
                  email: st.email,
                  name: st.name || emailKey.split('@')[0],
                  phone: st.phone || '',
                  code: st.academicCode || st.code || 'PH-SCHOLAR',
                  track: st.academicTrack || st.track || 'Secondary & Baccalaureate',
                  role: (customRole as any) || st.role || (emailKey === 'phenolvii@gmail.com' ? 'SUPER_ADMIN' : 'student'),
                  registeredAt: (st.registeredAt || new Date().toISOString()).slice(0, 10),
                  activeCoursesCount: 0,
                  pendingRequestsCount: 0,
                  overallProgressPercent: 0,
                  averageQuizGrade: 0,
                  lastActiveDate: 'Active',
                  enrollments: [],
                });
              } else {
                const existing = studentMap.get(emailKey)!;
                if (customRole) existing.role = customRole as any;
              }
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
        const customRole = typeof window !== 'undefined' ? localStorage.getItem(`phenol_user_role_${email}`) : null;
        studentMap.set(email, {
          id: e.student_id || e.studentId,
          email: email,
          name: e.student_name || e.studentName || email.split('@')[0],
          phone: e.student_phone || e.studentPhone || '',
          code: e.student_code || e.studentCode || 'PH-SCHOLAR',
          track: e.student_track || e.studentTrack || 'Secondary & Baccalaureate',
          role: (customRole as any) || (email === 'phenolvii@gmail.com' ? 'SUPER_ADMIN' : 'student'),
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
  const studentMap = new Map<string, RegisteredStudent>();

  // 1. Fetch from registered_students
  try {
    const { data, error } = await supabase
      .from('registered_students')
      .select('*');

    if (!error && Array.isArray(data)) {
      data.forEach((d: any) => {
        if (!d.email) return;
        const em = d.email.toLowerCase().trim();
        studentMap.set(em, {
          id: d.id || `stu-${Date.now()}`,
          name: d.name || em.split('@')[0],
          email: em,
          phone: d.phone || '',
          academicCode: d.academic_code || 'PH-SCHOLAR',
          academicTrack: d.academic_track || 'Secondary & Baccalaureate',
          registeredAt: d.created_at || new Date().toISOString(),
          role: d.role || (em === 'phenolvii@gmail.com' ? 'SUPER_ADMIN' : 'student'),
        });
      });
    }
  } catch (err) {}

  // 2. Fetch from profiles
  try {
    const { data: profs } = await supabase.from('profiles').select('*');
    if (Array.isArray(profs)) {
      profs.forEach((p: any) => {
        const em = (p.email || '').toLowerCase().trim();
        if (em) {
          if (!studentMap.has(em)) {
            studentMap.set(em, {
              id: p.id,
              name: p.full_name || p.name || em.split('@')[0],
              email: em,
              phone: p.phone || '',
              academicCode: `PH-${Math.floor(1000 + Math.random() * 9000)}`,
              academicTrack: 'Secondary & Baccalaureate',
              registeredAt: p.created_at || new Date().toISOString(),
              role: p.role || (em === 'phenolvii@gmail.com' ? 'SUPER_ADMIN' : 'student'),
            });
          } else {
            const existing = studentMap.get(em)!;
            if (p.role) existing.role = p.role;
            if (p.full_name) existing.name = p.full_name;
            if (p.phone) existing.phone = p.phone;
          }
        }
      });
    }
  } catch (err) {}

  // 3. Merge local storage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('phenol_registered_students');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((st: any) => {
            const em = (st.email || '').toLowerCase().trim();
            if (em && !studentMap.has(em)) {
              studentMap.set(em, {
                id: st.id || `stu-${Date.now()}`,
                name: st.name || em.split('@')[0],
                email: em,
                phone: st.phone || '',
                academicCode: st.academicCode || st.code || 'PH-SCHOLAR',
                academicTrack: st.academicTrack || st.track || 'Secondary & Baccalaureate',
                registeredAt: st.registeredAt || new Date().toISOString(),
                role: st.role || (em === 'phenolvii@gmail.com' ? 'SUPER_ADMIN' : 'student'),
              });
            }
          });
        }
      }
    } catch (e) {}
  }

  inMemoryStudents = Array.from(studentMap.values());
  return inMemoryStudents;
};
