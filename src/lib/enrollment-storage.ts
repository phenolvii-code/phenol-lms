/**
 * PHENOL ACADEMY - Persistent Enrollment & Student Performance Management
 * Manages real registered students, course activation requests, instructor approvals,
 * per-course rosters, and cross-device synchronization.
 */

import { AuthUser } from '@/types/auth';
import { ChemistryCourse } from '@/types/lms';
import { getStudentAcademicCode } from '@/lib/student-code';
import { supabase } from '@/lib/supabase';

export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

export interface CourseEnrollment {
  id: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  studentPhone: string;
  studentCode: string;
  studentTrack: string;
  studentAvatar?: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  status: EnrollmentStatus;
  requestedAt: string;
  approvedAt?: string;
  progressPercent: number; // 0 - 100
  completedLessonsCount: number;
  totalLessonsCount: number;
  averageQuizGrade: number; // e.g. 19/20
  lastActiveDate: string;
  lastLessonTitle?: string;
}

export interface RegisteredStudent {
  id: string;
  email: string;
  name: string;
  phone: string;
  academicCode: string;
  academicTrack: string;
  avatar?: string;
  role: 'STUDENT';
  registeredAt: string;
}

export interface StudentOverview {
  email: string;
  name: string;
  phone: string;
  code: string;
  track: string;
  avatar?: string;
  registeredAt: string;
  activeCoursesCount: number;
  pendingRequestsCount: number;
  overallProgressPercent: number;
  averageQuizGrade: number;
  lastActiveDate: string;
  enrollments: CourseEnrollment[];
}

const ENROLLMENTS_KEY = 'phenol_course_enrollments';
const REGISTERED_STUDENTS_KEY = 'phenol_registered_students';

// Dummy seeds to purge from client browsers
const DUMMY_EMAILS = [
  'youssef.tarek@gmail.com',
  'mariam.ahmed@gmail.com',
  'zeyad.khalid@gmail.com',
  'farida.hassan@gmail.com',
  'omar.samir.scholar@gmail.com',
  'youssef.mansour@student.phenol.academy',
  'salma.k@phenol.academy',
  'ahmed.hossam@student.edu',
  'mariam.tarek@pharmacy.cu.edu.eg',
];

const DUMMY_IDS = [
  'enr-101',
  'enr-102',
  'enr-103',
  'enr-104',
  'enr-105',
  'stu-101',
  'stu-102',
  'stu-103',
  'stu-104',
];

const isDummy = (email?: string, id?: string): boolean => {
  if (email && DUMMY_EMAILS.includes(email.trim().toLowerCase())) return true;
  if (id && DUMMY_IDS.includes(id)) return true;
  return false;
};

const isAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean === 'phenolvii@gmail.com' ||
    clean.includes('phenolvii') ||
    false
  );
};

// -----------------------------------------------------------------------------
// Course Enrollments Storage
// -----------------------------------------------------------------------------

export const getStoredEnrollments = (): CourseEnrollment[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ENROLLMENTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out dummy items
        const clean = parsed.filter((e) => !isDummy(e.studentEmail, e.id));
        if (clean.length !== parsed.length) {
          localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(clean));
        }
        return clean;
      }
    }
  } catch (e) {
    console.error('Error reading stored enrollments:', e);
  }
  return [];
};

export const saveStoredEnrollments = (enrollments: CourseEnrollment[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const clean = enrollments.filter((e) => !isDummy(e.studentEmail, e.id));
    localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(clean));
    window.dispatchEvent(new Event('phenol_enrollments_updated'));

    // Sync to Supabase cloud database
    supabase
      .from('course_enrollments')
      .upsert(
        clean.map((e) => ({
          id: e.id,
          student_id: e.studentId,
          student_email: e.studentEmail.toLowerCase(),
          student_name: e.studentName,
          student_phone: e.studentPhone,
          student_code: e.studentCode,
          student_track: e.studentTrack,
          student_avatar: e.studentAvatar || '',
          course_id: e.courseId,
          course_title: e.courseTitle,
          course_code: e.courseCode,
          status: e.status,
          requested_at: e.requestedAt,
          approved_at: e.approvedAt || null,
          progress_percent: e.progressPercent,
          completed_lessons_count: e.completedLessonsCount,
          total_lessons_count: e.totalLessonsCount,
          average_quiz_grade: e.averageQuizGrade,
          last_active_date: e.lastActiveDate,
          last_lesson_title: e.lastLessonTitle || null,
        })),
        { onConflict: 'id' }
      )
      .then(() => {}, () => {});

    // Sync to server API in background
    fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollments: clean }),
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving enrollments:', e);
  }
};

// -----------------------------------------------------------------------------
// Registered Students Storage
// -----------------------------------------------------------------------------

export const getRegisteredStudents = (): RegisteredStudent[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_STUDENTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((s) => !isDummy(s.email, s.id) && !isAdminEmail(s.email));
        if (clean.length !== parsed.length) {
          localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(clean));
        }
        return clean;
      }
    }
  } catch (e) {
    console.error('Error reading registered students:', e);
  }
  return [];
};

export const saveRegisteredStudents = (students: RegisteredStudent[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const clean = students.filter((s) => !isDummy(s.email, s.id) && !isAdminEmail(s.email));
    localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(clean));
    window.dispatchEvent(new Event('phenol_students_updated'));

    // Sync to Supabase cloud database
    supabase
      .from('registered_students')
      .upsert(
        clean.map((s) => ({
          id: s.id,
          email: s.email.toLowerCase(),
          name: s.name,
          phone: s.phone,
          academic_code: s.academicCode,
          academic_track: s.academicTrack,
          avatar: s.avatar || '',
          role: s.role,
          registered_at: s.registeredAt || new Date().toISOString(),
        })),
        { onConflict: 'email' }
      )
      .then(() => {}, () => {});

    // Sync to server API in background
    fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: clean }),
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving registered students:', e);
  }
};

/**
 * Automatically records any user who registers or logs in as a student.
 * Guarantees that any real account immediately appears in Dr. Omar's student directory.
 */
export const recordRegisteredStudent = (user: {
  id?: string;
  email: string;
  name?: string;
  phone?: string;
  academicCode?: string;
  academicTrack?: string;
  avatar?: string;
}): RegisteredStudent | null => {
  if (!user.email || isAdminEmail(user.email)) return null;

  const cleanEmail = user.email.trim().toLowerCase();
  const all = getRegisteredStudents();
  const existingIdx = all.findIndex((s) => s.email.toLowerCase() === cleanEmail);

  const academicCode =
    user.academicCode ||
    getStudentAcademicCode({
      id: user.id || `stu-${Date.now()}`,
      name: user.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: 'STUDENT',
      avatar: user.avatar || '',
      registeredAt: '',
    });

  const studentObj: RegisteredStudent = {
    id: existingIdx >= 0 ? all[existingIdx].id : user.id || `stu-${Date.now()}`,
    email: cleanEmail,
    name: user.name || (existingIdx >= 0 ? all[existingIdx].name : cleanEmail.split('@')[0]),
    phone: user.phone || (existingIdx >= 0 ? all[existingIdx].phone : 'Pending WhatsApp Verification'),
    academicCode,
    academicTrack: user.academicTrack || (existingIdx >= 0 ? all[existingIdx].academicTrack : 'Public Secondary AR'),
    avatar: user.avatar || (existingIdx >= 0 ? all[existingIdx].avatar : ''),
    role: 'STUDENT',
    registeredAt:
      existingIdx >= 0 ? all[existingIdx].registeredAt : new Date().toISOString().split('T')[0],
  };

  if (existingIdx >= 0) {
    all[existingIdx] = {
      ...all[existingIdx],
      ...studentObj,
      // Retain existing phone if new one is empty
      phone: user.phone && user.phone.length > 5 ? user.phone : all[existingIdx].phone,
    };
  } else {
    all.unshift(studentObj);
  }

  saveRegisteredStudents(all);
  return studentObj;
};

// -----------------------------------------------------------------------------
// Course Access & Enrollment Checks
// -----------------------------------------------------------------------------

export const checkUserCourseAccess = (
  user: AuthUser | null,
  courseId: string
): { isEnrolled: boolean; status: EnrollmentStatus | 'NOT_ENROLLED'; enrollment?: CourseEnrollment } => {
  if (!user) return { isEnrolled: false, status: 'NOT_ENROLLED' };

  const cleanEmail = user.email.trim().toLowerCase();
  if (isAdminEmail(cleanEmail) || user.role === 'INSTRUCTOR') {
    return { isEnrolled: true, status: 'ACTIVE' };
  }

  const all = getStoredEnrollments();
  const enrollment = all.find(
    (e) => e.courseId === courseId && e.studentEmail.toLowerCase() === cleanEmail
  );

  if (!enrollment) {
    return { isEnrolled: false, status: 'NOT_ENROLLED' };
  }

  return {
    isEnrolled: enrollment.status === 'ACTIVE',
    status: enrollment.status,
    enrollment,
  };
};

/**
 * Student requests access/activation for a course.
 */
export const requestCourseEnrollment = (
  user: AuthUser,
  course: ChemistryCourse
): CourseEnrollment => {
  const all = getStoredEnrollments();
  const cleanEmail = user.email.trim().toLowerCase();

  // Also ensure the student is permanently registered in the roster
  recordRegisteredStudent(user);

  const existingIndex = all.findIndex(
    (e) => e.courseId === course.id && e.studentEmail.toLowerCase() === cleanEmail
  );

  const studentCode = user.academicCode || getStudentAcademicCode(user);
  const studentPhone = user.phone || user.whatsapp || '+20 010 000 0000';
  const studentTrack = user.academicTrack || course.categoryName || 'General Track';

  if (existingIndex >= 0) {
    const updatedItem: CourseEnrollment = {
      ...all[existingIndex],
      status: 'PENDING',
      requestedAt: new Date().toISOString().split('T')[0],
      studentPhone: studentPhone.length > 5 ? studentPhone : all[existingIndex].studentPhone,
      studentName: user.name || all[existingIndex].studentName,
    };
    all[existingIndex] = updatedItem;
    saveStoredEnrollments(all);
    return updatedItem;
  }

  const newEnrollment: CourseEnrollment = {
    id: `enr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    studentId: user.id,
    studentEmail: cleanEmail,
    studentName: user.name,
    studentPhone,
    studentCode,
    studentTrack,
    studentAvatar: user.avatar,
    courseId: course.id,
    courseTitle: course.title,
    courseCode: course.code,
    status: 'PENDING',
    requestedAt: new Date().toISOString().split('T')[0],
    progressPercent: 0,
    completedLessonsCount: 0,
    totalLessonsCount: course.lessons?.length || 8,
    averageQuizGrade: 0,
    lastActiveDate: 'Just now',
    lastLessonTitle: 'Pending Director Approval',
  };

  const updated = [newEnrollment, ...all];
  saveStoredEnrollments(updated);
  return newEnrollment;
};

/**
 * Instructor directly activates / enrolls a student into a course.
 */
export const directEnrollStudentInCourse = (
  studentEmail: string,
  course: ChemistryCourse
): CourseEnrollment => {
  const allEnrollments = getStoredEnrollments();
  const allStudents = getRegisteredStudents();
  const cleanEmail = studentEmail.trim().toLowerCase();
  const student = allStudents.find((s) => s.email.toLowerCase() === cleanEmail);

  const existingIdx = allEnrollments.findIndex(
    (e) => e.courseId === course.id && e.studentEmail.toLowerCase() === cleanEmail
  );

  const studentName = student?.name || cleanEmail.split('@')[0];
  const studentPhone = student?.phone || '+20 010 000 0000';
  const studentCode = student?.academicCode || 'PH-0000-S';
  const studentTrack = student?.academicTrack || course.categoryName;

  const enrollmentItem: CourseEnrollment = {
    id:
      existingIdx >= 0
        ? allEnrollments[existingIdx].id
        : `enr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    studentId: student?.id || `stu-${Date.now()}`,
    studentEmail: cleanEmail,
    studentName,
    studentPhone,
    studentCode,
    studentTrack,
    studentAvatar: student?.avatar,
    courseId: course.id,
    courseTitle: course.title,
    courseCode: course.code,
    status: 'ACTIVE',
    requestedAt: existingIdx >= 0 ? allEnrollments[existingIdx].requestedAt : new Date().toISOString().split('T')[0],
    approvedAt: new Date().toISOString().split('T')[0],
    progressPercent: existingIdx >= 0 ? allEnrollments[existingIdx].progressPercent : 0,
    completedLessonsCount: existingIdx >= 0 ? allEnrollments[existingIdx].completedLessonsCount : 0,
    totalLessonsCount: course.lessons?.length || 8,
    averageQuizGrade: existingIdx >= 0 ? allEnrollments[existingIdx].averageQuizGrade : 0,
    lastActiveDate: 'Just Activated',
    lastLessonTitle: 'Course Activated by Dr. Omar',
  };

  if (existingIdx >= 0) {
    allEnrollments[existingIdx] = enrollmentItem;
  } else {
    allEnrollments.unshift(enrollmentItem);
  }

  saveStoredEnrollments(allEnrollments);
  return enrollmentItem;
};

/**
 * Instructor Approves / Activates a student's course request.
 */
export const approveCourseEnrollment = (enrollmentId: string): CourseEnrollment[] => {
  const all = getStoredEnrollments();
  const updated = all.map((e) => {
    if (e.id === enrollmentId) {
      return {
        ...e,
        status: 'ACTIVE' as EnrollmentStatus,
        approvedAt: new Date().toISOString().split('T')[0],
        lastActiveDate: 'Just approved',
        lastLessonTitle: 'Course Activated',
      };
    }
    return e;
  });
  saveStoredEnrollments(updated);
  return updated;
};

/**
 * Instructor Deactivates or Revokes a course access.
 */
export const toggleCourseEnrollmentStatus = (
  enrollmentId: string,
  newStatus: EnrollmentStatus
): CourseEnrollment[] => {
  const all = getStoredEnrollments();
  const updated = all.map((e) => {
    if (e.id === enrollmentId) {
      return {
        ...e,
        status: newStatus,
      };
    }
    return e;
  });
  saveStoredEnrollments(updated);
  return updated;
};

/**
 * Updates a student's progress in a specific course when they complete a lesson.
 */
export const recordStudentLessonProgress = (
  studentEmail: string,
  courseId: string,
  completedLessonCount: number,
  totalLessonCount: number,
  lessonTitle: string
): void => {
  const all = getStoredEnrollments();
  const cleanEmail = studentEmail.trim().toLowerCase();
  const index = all.findIndex(
    (e) => e.courseId === courseId && e.studentEmail.toLowerCase() === cleanEmail
  );

  if (index >= 0) {
    const total = totalLessonCount || all[index].totalLessonsCount || 1;
    const count = Math.min(completedLessonCount, total);
    const percent = Math.round((count / total) * 100);

    all[index] = {
      ...all[index],
      progressPercent: percent,
      completedLessonsCount: count,
      totalLessonsCount: total,
      lastActiveDate: 'Active today',
      lastLessonTitle: lessonTitle,
    };
    saveStoredEnrollments(all);
  }
};

/**
 * Aggregates all registered students and their enrollments for the Admin Directory.
 * Guarantees that EVERY registered user appears, with or without active courses.
 */
export const getAggregatedStudentsDirectory = (): StudentOverview[] => {
  const registered = getRegisteredStudents();
  const enrollments = getStoredEnrollments();

  const studentsMap = new Map<string, StudentOverview>();

  // 1. Initialize directory with all registered students
  for (const reg of registered) {
    const key = reg.email.toLowerCase();
    studentsMap.set(key, {
      email: reg.email,
      name: reg.name,
      phone: reg.phone,
      code: reg.academicCode,
      track: reg.academicTrack,
      avatar: reg.avatar,
      registeredAt: reg.registeredAt || '2026-11-01',
      activeCoursesCount: 0,
      pendingRequestsCount: 0,
      overallProgressPercent: 0,
      averageQuizGrade: 0,
      lastActiveDate: 'Newly Registered Account',
      enrollments: [],
    });
  }

  // 2. Attach and populate enrollments
  for (const enr of enrollments) {
    const key = enr.studentEmail.toLowerCase();
    if (!studentsMap.has(key)) {
      // If someone has an enrollment but wasn't in registered list, add them
      studentsMap.set(key, {
        email: enr.studentEmail,
        name: enr.studentName,
        phone: enr.studentPhone,
        code: enr.studentCode,
        track: enr.studentTrack,
        avatar: enr.studentAvatar,
        registeredAt: enr.requestedAt || '2026-11-01',
        activeCoursesCount: 0,
        pendingRequestsCount: 0,
        overallProgressPercent: 0,
        averageQuizGrade: 0,
        lastActiveDate: enr.lastActiveDate,
        enrollments: [],
      });
    }

    const st = studentsMap.get(key)!;
    st.enrollments.push(enr);
    if (enr.status === 'ACTIVE') {
      st.activeCoursesCount += 1;
    } else if (enr.status === 'PENDING') {
      st.pendingRequestsCount += 1;
    }
  }

  // 3. Compute overall progress & quiz grades
  const result: StudentOverview[] = [];
  studentsMap.forEach((st) => {
    const activeEnr = st.enrollments.filter((e) => e.status === 'ACTIVE');
    if (activeEnr.length > 0) {
      const totalProg = activeEnr.reduce((acc, curr) => acc + curr.progressPercent, 0);
      const totalGrade = activeEnr.reduce((acc, curr) => acc + curr.averageQuizGrade, 0);
      st.overallProgressPercent = Math.round(totalProg / activeEnr.length);
      st.averageQuizGrade = Math.round(totalGrade / activeEnr.length);
      st.lastActiveDate = activeEnr[0].lastActiveDate || 'Active';
    }
    result.push(st);
  });

  return result;
};

/**
 * Cross-device synchronization: fetches any students & enrollments registered on other devices.
 */
export const syncWithServerStudents = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    // 1. Direct Supabase Cloud Sync
    try {
      const { data: supaStudents } = await supabase.from('registered_students').select('*');
      if (Array.isArray(supaStudents) && supaStudents.length > 0) {
        const local = getRegisteredStudents();
        const mergedMap = new Map<string, RegisteredStudent>();
        local.forEach((s) => mergedMap.set(s.email.toLowerCase(), s));
        supaStudents.forEach((st: any) => {
          if (!isDummy(st.email, st.id) && !isAdminEmail(st.email)) {
            mergedMap.set(st.email.toLowerCase(), {
              id: st.id,
              email: st.email.toLowerCase(),
              name: st.name,
              phone: st.phone,
              academicCode: st.academic_code,
              academicTrack: st.academic_track,
              avatar: st.avatar,
              role: 'STUDENT',
              registeredAt: st.registered_at ? st.registered_at.split('T')[0] : '2026-11-01',
            });
          }
        });
        const finalStudents = Array.from(mergedMap.values());
        localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(finalStudents));
        window.dispatchEvent(new Event('phenol_students_updated'));
      }
    } catch (e) {}

    try {
      const { data: supaEnr } = await supabase.from('course_enrollments').select('*');
      if (Array.isArray(supaEnr) && supaEnr.length > 0) {
        const localEnr = getStoredEnrollments();
        const enrMap = new Map<string, CourseEnrollment>();
        localEnr.forEach((e) => enrMap.set(e.id, e));
        supaEnr.forEach((e: any) => {
          if (!isDummy(e.student_email, e.id)) {
            enrMap.set(e.id, {
              id: e.id,
              studentId: e.student_id,
              studentEmail: e.student_email.toLowerCase(),
              studentName: e.student_name,
              studentPhone: e.student_phone,
              studentCode: e.student_code,
              studentTrack: e.student_track,
              studentAvatar: e.student_avatar,
              courseId: e.course_id,
              courseTitle: e.course_title,
              courseCode: e.course_code,
              status: e.status,
              requestedAt: e.requested_at,
              approvedAt: e.approved_at,
              progressPercent: e.progress_percent,
              completedLessonsCount: e.completed_lessons_count,
              totalLessonsCount: e.total_lessons_count,
              averageQuizGrade: e.average_quiz_grade,
              lastActiveDate: e.last_active_date,
              lastLessonTitle: e.last_lesson_title,
            });
          }
        });
        const finalEnr = Array.from(enrMap.values());
        localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(finalEnr));
        window.dispatchEvent(new Event('phenol_enrollments_updated'));
      }
    } catch (e) {}

    // 2. Background API fallback
    const res = await fetch('/api/students');
    if (!res.ok) return;
    const data = await res.json();

    if (Array.isArray(data.students) && data.students.length > 0) {
      const local = getRegisteredStudents();
      const mergedMap = new Map<string, RegisteredStudent>();
      local.forEach((s) => mergedMap.set(s.email.toLowerCase(), s));
      data.students.forEach((s: RegisteredStudent) => {
        if (!isDummy(s.email, s.id) && !isAdminEmail(s.email)) {
          mergedMap.set(s.email.toLowerCase(), {
            ...(mergedMap.get(s.email.toLowerCase()) || {}),
            ...s,
          });
        }
      });
      const finalStudents = Array.from(mergedMap.values());
      localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(finalStudents));
      window.dispatchEvent(new Event('phenol_students_updated'));
    }

    if (Array.isArray(data.enrollments) && data.enrollments.length > 0) {
      const localEnr = getStoredEnrollments();
      const enrMap = new Map<string, CourseEnrollment>();
      localEnr.forEach((e) => enrMap.set(e.id, e));
      data.enrollments.forEach((e: CourseEnrollment) => {
        if (!isDummy(e.studentEmail, e.id)) {
          enrMap.set(e.id, {
            ...(enrMap.get(e.id) || {}),
            ...e,
          });
        }
      });
      const finalEnr = Array.from(enrMap.values());
      localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(finalEnr));
      window.dispatchEvent(new Event('phenol_enrollments_updated'));
    }
  } catch (e) {
    // Graceful offline fallback
  }
};
