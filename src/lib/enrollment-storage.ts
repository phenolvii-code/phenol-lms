/**
 * PHENOL ACADEMY - Persistent Enrollment & Student Performance Management
 * Manages course activation requests, instructor approvals, per-course rosters, and student tracking.
 */

import { AuthUser, ADMIN_EMAILS } from '@/types/auth';
import { ChemistryCourse } from '@/types/lms';
import { getStudentAcademicCode } from '@/lib/student-code';

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
  averageQuizGrade: number; // e.g. 19/20 or 95%
  lastActiveDate: string;
  lastLessonTitle?: string;
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

const STORAGE_KEY = 'phenol_course_enrollments';

// Realistic initial seed data for PHENOL Academy cohorts
const INITIAL_ENROLLMENTS: CourseEnrollment[] = [
  {
    id: 'enr-101',
    studentId: 'std-youssef',
    studentEmail: 'youssef.tarek@gmail.com',
    studentName: 'يوسف طارق المنشاوي',
    studentPhone: '+20 102 345 6789',
    studentCode: 'PH-4821-T',
    studentTrack: 'ثانوية عامة (عربي)',
    studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    courseId: 'chem-ar-301',
    courseTitle: 'كيمياء الثانوية العامة (عربي) — التأسيس النظري والتحليلي المتكامل',
    courseCode: 'CHEM-AR 301',
    status: 'ACTIVE',
    requestedAt: '2026-10-15',
    approvedAt: '2026-10-16',
    progressPercent: 75,
    completedLessonsCount: 6,
    totalLessonsCount: 8,
    averageQuizGrade: 19,
    lastActiveDate: 'Today, 11:20 AM',
    lastLessonTitle: 'ميكانزم تفاعلات الاستبدال والإضافة في الألكينات',
  },
  {
    id: 'enr-102',
    studentId: 'std-mariam',
    studentEmail: 'mariam.ahmed@gmail.com',
    studentName: 'مريم أحمد الشريف',
    studentPhone: '+20 114 987 6543',
    studentCode: 'PH-7319-M',
    studentTrack: 'ثانوية عامة (لغات)',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    courseId: 'chem-lang-302',
    courseTitle: 'Thanaweya Chemistry (Languages) — Advanced Conceptual Problem Solving',
    courseCode: 'CHEM-EN 302',
    status: 'ACTIVE',
    requestedAt: '2026-10-20',
    approvedAt: '2026-10-21',
    progressPercent: 90,
    completedLessonsCount: 7,
    totalLessonsCount: 8,
    averageQuizGrade: 20,
    lastActiveDate: 'Yesterday',
    lastLessonTitle: 'Thermodynamics & Equilibrium Calculations',
  },
  {
    id: 'enr-103',
    studentId: 'std-zeyad',
    studentEmail: 'zeyad.khalid@gmail.com',
    studentName: 'زياد خالد محمود',
    studentPhone: '+20 120 555 4321',
    studentCode: 'PH-2940-Z',
    studentTrack: 'ثانوية عامة (عربي)',
    studentAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    courseId: 'chem-ar-301',
    courseTitle: 'كيمياء الثانوية العامة (عربي) — التأسيس النظري والتحليلي المتكامل',
    courseCode: 'CHEM-AR 301',
    status: 'PENDING',
    requestedAt: '2026-11-08',
    progressPercent: 0,
    completedLessonsCount: 0,
    totalLessonsCount: 8,
    averageQuizGrade: 0,
    lastActiveDate: '2 hours ago',
    lastLessonTitle: 'Awaiting Activation',
  },
  {
    id: 'enr-104',
    studentId: 'std-farida',
    studentEmail: 'farida.hassan@gmail.com',
    studentName: 'فريدة حسن القاضي',
    studentPhone: '+20 109 888 1234',
    studentCode: 'PH-6152-F',
    studentTrack: 'IGCSE & A-Level / STEM',
    studentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    courseId: 'chem-ig-303',
    courseTitle: 'Cambridge IGCSE & A-Level Chemistry — Analytical Depth & Spectrometry',
    courseCode: 'CHEM-IG 303',
    status: 'PENDING',
    requestedAt: '2026-11-08',
    progressPercent: 0,
    completedLessonsCount: 0,
    totalLessonsCount: 6,
    averageQuizGrade: 0,
    lastActiveDate: '1 hour ago',
    lastLessonTitle: 'Awaiting Activation',
  },
  {
    id: 'enr-105',
    studentId: 'std-omar-s',
    studentEmail: 'omar.samir.scholar@gmail.com',
    studentName: 'عمر سمير السيد',
    studentPhone: '+20 101 234 5678',
    studentCode: 'PH-9104-O',
    studentTrack: 'كيمياء جامعية (صيدلة، علوم، طب)',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    courseId: 'chem-univ-401',
    courseTitle: 'Advanced Organic Reaction Mechanisms & Spectroscopy',
    courseCode: 'CHEM-UNIV 401',
    status: 'ACTIVE',
    requestedAt: '2026-10-10',
    approvedAt: '2026-10-10',
    progressPercent: 60,
    completedLessonsCount: 3,
    totalLessonsCount: 5,
    averageQuizGrade: 18,
    lastActiveDate: '3 days ago',
    lastLessonTitle: 'NMR Spectroscopy & Carbon-13 Chemical Shifts',
  },
];

export const getStoredEnrollments = (): CourseEnrollment[] => {
  if (typeof window === 'undefined') return INITIAL_ENROLLMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Seed initial
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ENROLLMENTS));
  } catch (e) {
    console.error('Error reading stored enrollments:', e);
  }
  return INITIAL_ENROLLMENTS;
};

export const saveStoredEnrollments = (enrollments: CourseEnrollment[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enrollments));
    window.dispatchEvent(new Event('phenol_enrollments_updated'));
  } catch (e) {
    console.error('Error saving enrollments:', e);
  }
};

/**
 * Checks enrollment status of a specific user for a given course.
 * Directors/Admins are always ACTIVE.
 */
export const checkUserCourseAccess = (
  user: AuthUser | null,
  courseId: string
): { isEnrolled: boolean; status: EnrollmentStatus | 'NOT_ENROLLED'; enrollment?: CourseEnrollment } => {
  if (!user) return { isEnrolled: false, status: 'NOT_ENROLLED' };

  const cleanEmail = user.email.trim().toLowerCase();
  const isAdmin =
    user.role === 'INSTRUCTOR' ||
    cleanEmail === 'phenolvii@gmail.com' ||
    cleanEmail.includes('phenolvii') ||
    ADMIN_EMAILS.includes(cleanEmail);

  if (isAdmin) {
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

  // Check if exists
  const existingIndex = all.findIndex(
    (e) => e.courseId === course.id && e.studentEmail.toLowerCase() === cleanEmail
  );

  const studentCode = user.academicCode || getStudentAcademicCode(user);
  const studentPhone = user.phone || user.whatsapp || '+20 010 000 0000';
  const studentTrack = user.academicTrack || course.categoryName || 'General Track';

  if (existingIndex >= 0) {
    // Re-request if rejected or update
    const updatedItem: CourseEnrollment = {
      ...all[existingIndex],
      status: 'PENDING',
      requestedAt: new Date().toISOString().split('T')[0],
      studentPhone,
      studentName: user.name,
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
 * Aggregates all unique students with overall performance metrics for the Admin Directory.
 */
export const getAggregatedStudentsDirectory = (): StudentOverview[] => {
  const enrollments = getStoredEnrollments();
  const studentsMap = new Map<string, StudentOverview>();

  for (const enr of enrollments) {
    const emailKey = enr.studentEmail.toLowerCase();
    if (!studentsMap.has(emailKey)) {
      studentsMap.set(emailKey, {
        email: enr.studentEmail,
        name: enr.studentName,
        phone: enr.studentPhone,
        code: enr.studentCode,
        track: enr.studentTrack,
        avatar: enr.studentAvatar,
        registeredAt: enr.requestedAt || '2026-10-01',
        activeCoursesCount: 0,
        pendingRequestsCount: 0,
        overallProgressPercent: 0,
        averageQuizGrade: 0,
        lastActiveDate: enr.lastActiveDate,
        enrollments: [],
      });
    }

    const st = studentsMap.get(emailKey)!;
    st.enrollments.push(enr);
    if (enr.status === 'ACTIVE') {
      st.activeCoursesCount += 1;
    } else if (enr.status === 'PENDING') {
      st.pendingRequestsCount += 1;
    }
  }

  // Calculate averages
  const result: StudentOverview[] = [];
  studentsMap.forEach((st) => {
    const activeEnr = st.enrollments.filter((e) => e.status === 'ACTIVE');
    if (activeEnr.length > 0) {
      const totalProg = activeEnr.reduce((acc, curr) => acc + curr.progressPercent, 0);
      const totalGrade = activeEnr.reduce((acc, curr) => acc + curr.averageQuizGrade, 0);
      st.overallProgressPercent = Math.round(totalProg / activeEnr.length);
      st.averageQuizGrade = Math.round(totalGrade / activeEnr.length);
    }
    result.push(st);
  });

  return result;
};
