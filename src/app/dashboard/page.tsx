'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types/auth';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { WhatsAppPromptModal } from '@/components/auth/WhatsAppPromptModal';
import { Initials } from '@/components/ui/Initials';
import {
  CHEMISTRY_COURSES,
  BOOKLETS,
  SUBMISSIONS,
  WAITLIST_APPLICANTS,
  ENROLLED_STUDENTS,
  ACADEMIC_TRACKS,
  setGlobalInstructorAvatar,
} from '@/data/mock-data';
import {
  AcademicCategory,
  ChemistryCourse,
  ChemistryLesson,
  StudentSubmission,
  WaitlistApplication,
  EnrolledStudent,
} from '@/types/lms';
import { BookletsView } from '@/components/booklets/BookletsView';
import { supabase } from '@/lib/supabase';
import {
  getStoredCourses,
  saveStoredCourses,
  saveSingleCourse,
  markCourseDeleted,
  syncWithServerCourses,
} from '@/lib/courses-storage';
import { StudentProfileModal } from '@/components/profile/StudentProfileModal';
import { CourseStudentsModal } from '@/components/courses/CourseStudentsModal';
import {
  listAllEnrollments,
  listMyEnrollments,
  requestEnrollment,
  setEnrollmentStatus,
  adminEnrollStudent,
  adminRevokeEnrollment,
  adminDeleteStudentAccount,
  CourseEnrollmentRecord,
} from '@/lib/data/enrollments';
import { recordRegisteredStudent } from '@/lib/enrollment-storage';
import { adminNotifyCourseStudents } from '@/lib/data/notifications';
import {
  FileCheck2,
  FileText,
  LogOut,
  Users,
  ShieldCheck,
  Eye,
  GraduationCap,
  PlusCircle,
  Layers,
  Plus,
  Send,
  Settings,
  ExternalLink,
  Edit3,
} from 'lucide-react';

// Subcomponents: Admin Tabs
import { AdminCurriculumTab } from '@/components/dashboard/admin/AdminCurriculumTab';
import { AdminWaitlistTab } from '@/components/dashboard/admin/AdminWaitlistTab';
import { AdminSubmissionsTab } from '@/components/dashboard/admin/AdminSubmissionsTab';
import { AdminRosterTab } from '@/components/dashboard/admin/AdminRosterTab';
import { SuperAdministrationView } from '@/components/dashboard/admin/SuperAdministrationView';

// Subcomponents: Student Tabs
import { StudentCoursesTab } from '@/components/dashboard/student/StudentCoursesTab';
import { StudentTasksTab } from '@/components/dashboard/student/StudentTasksTab';
import { StudentQuizzesTab } from '@/components/dashboard/student/StudentQuizzesTab';

// Subcomponents: Modals
import { InstructorProfileModal } from '@/components/dashboard/modals/InstructorProfileModal';
import { CreateCourseModal } from '@/components/dashboard/modals/CreateCourseModal';
import { EditCourseModal } from '@/components/dashboard/modals/EditCourseModal';
import { AddLectureModal } from '@/components/dashboard/modals/AddLectureModal';
import { EditLectureModal } from '@/components/dashboard/modals/EditLectureModal';
import { AddApplicantModal } from '@/components/dashboard/modals/AddApplicantModal';
import { GradingDeskModal } from '@/components/dashboard/modals/GradingDeskModal';
import { SubmitProblemSetModal } from '@/components/dashboard/modals/SubmitProblemSetModal';
import { DirectEnrollModal } from '@/components/dashboard/modals/DirectEnrollModal';
import { ManualAddStudentModal } from '@/components/dashboard/modals/ManualAddStudentModal';

export default function DashboardPage() {
  const router = useRouter();
  const { user: currentUser, isLoading, signOut, refreshUser } = useCurrentUser();
  const [isWhatsAppRequiredModalOpen, setIsWhatsAppRequiredModalOpen] = useState(false);

  // Instructor View Toggle (Admin mode vs Student preview mode)
  const [adminViewMode, setAdminViewMode] = useState<'ADMIN' | 'STUDENT_PREVIEW'>('ADMIN');

  // Instructor Admin Tabs
  const [adminTab, setAdminTab] = useState<'curriculum' | 'waitlist' | 'submissions' | 'roster'>('curriculum');
  const [isSuperAdminCockpitOpen, setIsSuperAdminCockpitOpen] = useState(false);

  // Student Tabs
  const [studentTab, setStudentTab] = useState<'courses' | 'tasks' | 'booklets' | 'quizzes'>('courses');

  // Filter Track for Curriculum and Waitlist
  const [trackFilter, setTrackFilter] = useState<AcademicCategory | 'all'>('all');

  // Core Data states
  const [courses, setCourses] = useState<ChemistryCourse[]>(() => getStoredCourses());
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(SUBMISSIONS);
  const [waitlist, setWaitlist] = useState<WaitlistApplication[]>(WAITLIST_APPLICANTS);
  const [students, setStudents] = useState<EnrolledStudent[]>(ENROLLED_STUDENTS);
  const [rosterSearchQuery, setRosterSearchQuery] = useState('');

  // Profile Modal State (Instructor)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'info' | 'security'>('info');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
  const [profileName, setProfileName] = useState('');
  const [profileTitle, setProfileTitle] = useState('');
  const [profileSpecialization, setProfileSpecialization] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  const isSuperAdminUser =
    currentUser?.isSuperAdmin || currentUser?.email?.toLowerCase() === 'phenolvii@gmail.com';

  useEffect(() => {
    if (currentUser?.avatar) {
      setProfileAvatar(currentUser.avatar);
    }
  }, [currentUser?.avatar]);

  const isCourseOwnedByCurrentInstructor = (c: ChemistryCourse) => {
    if (isSuperAdminUser) {
      // Dr. Omar's courses in normal instructor dashboard
      return (
        !c.instructorEmail ||
        c.instructorEmail.toLowerCase() === 'phenolvii@gmail.com' ||
        c.instructorName?.toLowerCase().includes('omar') ||
        c.instructorId === 'dr-omar-magdi' ||
        !c.instructorId
      );
    }
    if (c.instructorId && currentUser?.id && c.instructorId === currentUser.id) return true;
    if (
      c.instructorEmail &&
      currentUser?.email &&
      c.instructorEmail.toLowerCase() === currentUser.email.toLowerCase()
    )
      return true;
    if (
      c.instructorName &&
      currentUser?.name &&
      c.instructorName.toLowerCase() === currentUser.name.toLowerCase()
    )
      return true;
    return false;
  };

  const myInstructorCourses = useMemo(() => {
    return courses.filter(isCourseOwnedByCurrentInstructor);
  }, [courses, currentUser, isSuperAdminUser]);

  const myWaitlist = useMemo(() => {
    if (isSuperAdminUser) return waitlist;
    const myCodes = new Set<string>(myInstructorCourses.map((c: ChemistryCourse) => c.code.toLowerCase()));
    const myTitles = new Set<string>(myInstructorCourses.map((c: ChemistryCourse) => c.title.toLowerCase()));
    return waitlist.filter((w) => {
      const tc = (w.targetCourse || '').toLowerCase();
      return (
        Array.from(myCodes).some((code: string) => tc.includes(code)) ||
        Array.from(myTitles).some((t: string) => tc.includes(t))
      );
    });
  }, [waitlist, myInstructorCourses, isSuperAdminUser]);

  const mySubmissions = useMemo(() => {
    if (isSuperAdminUser) return submissions;
    const myCourseIds = new Set<string>(myInstructorCourses.map((c: ChemistryCourse) => c.id));
    return submissions.filter((s: StudentSubmission) => !s.course_id || myCourseIds.has(s.course_id));
  }, [submissions, myInstructorCourses, isSuperAdminUser]);

  // Student Profile Modal State
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);

  // Per-Course Students & Analytics Modal State
  const [isCourseStudentsOpen, setIsCourseStudentsOpen] = useState(false);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState<ChemistryCourse | null>(null);

  // Course Enrollments & Activation Requests State
  const [enrollments, setEnrollments] = useState<CourseEnrollmentRecord[]>([]);
  const [enrollmentToast, setEnrollmentToast] = useState<string | null>(null);

  // Direct Enroll Student Modal State
  const [isDirectEnrollModalOpen, setIsDirectEnrollModalOpen] = useState(false);
  const [directEnrollStudent, setDirectEnrollStudent] = useState<any | null>(null);
  const [selectedCourseIdToEnroll, setSelectedCourseIdToEnroll] = useState<string>('');

  // Manual Add Student Modal State
  const [isManualAddStudentModalOpen, setIsManualAddStudentModalOpen] = useState(false);
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualStudentEmail, setManualStudentEmail] = useState('');
  const [manualStudentPhone, setManualStudentPhone] = useState('');
  const [manualStudentTrack, setManualStudentTrack] = useState('Public Secondary AR');

  // Password Change State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const [, setPasswordLoading] = useState(false);

  // Course Builder (Create Course) Modal State
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [newCourseCategory, setNewCourseCategory] = useState<AcademicCategory>('thanaweya-arabic');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseSubtitle, setNewCourseSubtitle] = useState('');
  const [newCourseLevel, setNewCourseLevel] = useState('');
  const [newCourseFormula, setNewCourseFormula] = useState('');
  const [newCourseHours, setNewCourseHours] = useState('30 Academic Hours');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  // Course Editor (Edit Course) Modal State
  const [isEditCourseOpen, setIsEditCourseOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseCategory, setEditCourseCategory] = useState<AcademicCategory>('thanaweya-arabic');
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseSubtitle, setEditCourseSubtitle] = useState('');
  const [editCourseLevel, setEditCourseLevel] = useState('');
  const [editCourseFormula, setEditCourseFormula] = useState('');
  const [editCourseHours, setEditCourseHours] = useState('');
  const [editCourseDesc, setEditCourseDesc] = useState('');

  // Add Lecture Modal State
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [newLectureCourse, setNewLectureCourse] = useState<string>('');
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureDuration, setNewLectureDuration] = useState('45 min');
  const [newLectureVideoUrl, setNewLectureVideoUrl] = useState('');
  const [newLecturePdfUrl, setNewLecturePdfUrl] = useState('');
  const [newLecturePdfName, setNewLecturePdfName] = useState('');
  const [newLectureSummary, setNewLectureSummary] = useState('');
  const [newLectureFormula, setNewLectureFormula] = useState('');

  // Edit Lecture Modal State
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false);
  const [editingLessonCourseId, setEditingLessonCourseId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonDuration, setEditLessonDuration] = useState('45 min');
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState('');
  const [editLessonPdfUrl, setEditLessonPdfUrl] = useState('');
  const [editLessonPdfName, setEditLessonPdfName] = useState('');
  const [editLessonSummary, setEditLessonSummary] = useState('');
  const [editLessonFormula, setEditLessonFormula] = useState('');

  // Add Walk-in Applicant Modal State
  const [isAddApplicantOpen, setIsAddApplicantOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualTrack, setManualTrack] = useState<AcademicCategory>('thanaweya-arabic');
  const [manualCourse, setManualCourse] = useState('');

  // Evaluation / Grading Modal State
  const [gradingSubmission, setGradingSubmission] = useState<StudentSubmission | null>(null);
  const [inputGrade, setInputGrade] = useState<number>(20);
  const [inputFeedback, setInputFeedback] = useState<string>('');

  // Student Task Submission State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('Resonance Stabilization & Acidity Analysis Problem Set');
  const [newSolutionNotes, setNewSolutionNotes] = useState('');

  // Student Quiz State
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const loadEnrollments = async () => {
    if (!currentUser) return;
    try {
      if (currentUser.role === 'INSTRUCTOR') {
        const all = await listAllEnrollments();
        setEnrollments(all);
      } else {
        const mine = await listMyEnrollments();
        setEnrollments(mine);
      }
    } catch (err) {
      console.error('Error loading enrollments:', err);
    }
  };

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/login');
    }
  }, [isLoading, currentUser, router]);

  useEffect(() => {
    if (currentUser) {
      loadEnrollments();
      syncWithServerCourses().then((c) => setCourses(c));

      if (currentUser.role === 'INSTRUCTOR') {
        supabase
          .from('waitlist_applications')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data }) => {
            if (data) {
              setWaitlist(
                data.map((d: any) => ({
                  id: d.id,
                  fullName: d.full_name || d.fullName,
                  email: d.email,
                  phone: d.phone,
                  academicTrack: d.academic_track || d.academicTrack || 'Thanaweya Amma',
                  targetCourse: d.target_course || d.targetCourse || 'Chemistry Course',
                  appliedAt: new Date(d.created_at || Date.now()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                  }),
                  status: d.status || 'pending',
                  notes: d.notes,
                }))
              );
            }
          });
      }

      const handleCoursesUpdate = () => {
        setCourses(getStoredCourses());
      };
      window.addEventListener('phenol_courses_updated', handleCoursesUpdate);
      return () => {
        window.removeEventListener('phenol_courses_updated', handleCoursesUpdate);
      };
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {}
    router.push('/login');
  };

  const handleOpenProfileModal = () => {
    if (!currentUser) return;
    if (currentUser.role === 'STUDENT') {
      setIsStudentProfileOpen(true);
    } else {
      setProfileAvatar(currentUser.avatar || '');
      setProfileName(currentUser.name || 'Dr. Omar Magdi');
      setProfileTitle(currentUser.title || 'Academic Director & Senior Fellow');
      setProfileSpecialization(currentUser.specialization || 'Organic Reaction Mechanisms & Physical Chemistry');
      setProfileBio(currentUser.bio || 'PharmD graduate and chemistry educator. Focused on first-principles causality, physical chemistry, reaction mechanisms, and intellectual scientific pedagogy.');
      setProfilePhone(currentUser.phone || '');
      setIsProfileModalOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const updatedUser: AuthUser = {
        ...currentUser,
        name: profileName.trim(),
        title: profileTitle.trim(),
        specialization: profileSpecialization.trim(),
        bio: profileBio.trim(),
        phone: profilePhone.trim(),
        avatar: profileAvatar,
      };

      // 1. Supabase User Metadata (wrapped safely)
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: profileName.trim(),
            title: profileTitle.trim(),
            specialization: profileSpecialization.trim(),
            bio: profileBio.trim(),
            phone: profilePhone.trim(),
            avatar: profileAvatar,
            avatar_url: profileAvatar,
          },
        });
      } catch (authErr) {
        console.warn('Notice updating auth user metadata:', authErr);
      }

      // 2. Profiles table
      try {
        await supabase.from('profiles').update({
          full_name: profileName.trim(),
          phone: profilePhone.trim(),
          avatar_url: profileAvatar,
        }).eq('id', currentUser.id);
      } catch (e) {}

      // 3. Local Cache & Global In-Memory Sync
      if (profileAvatar) {
        setGlobalInstructorAvatar(profileAvatar);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(`phenol_instructor_profile_${currentUser.id}`, JSON.stringify(updatedUser));
        localStorage.setItem(`phenol_avatar_${currentUser.id}`, profileAvatar);
        localStorage.setItem('phenol_global_instructor_avatar', profileAvatar);
        window.dispatchEvent(new Event('phenol_user_profile_updated'));
      }

      if (refreshUser) {
        refreshUser();
      }

      setEnrollmentToast('Profile and photograph updated successfully!');
      setTimeout(() => setEnrollmentToast(null), 4000);
      setIsProfileModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPasswordInput });
    setPasswordLoading(false);
    if (error) {
      setPasswordChangeStatus({ type: 'error', message: error.message });
    } else {
      setPasswordChangeStatus({ type: 'success', message: 'Password updated successfully' });
      setTimeout(() => {
        setIsProfileModalOpen(false);
        setPasswordChangeStatus({ type: 'idle', message: '' });
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setCurrentPasswordInput('');
      }, 1500);
    }
  };

  const handleRequestCourse = async (course: ChemistryCourse) => {
    if (!currentUser) return;
    try {
      await requestEnrollment(course.id);
      await loadEnrollments();
      setEnrollmentToast(
        `Activation request for (${course.title}) submitted to Dr. Omar Magdi. Your access will be reviewed and approved shortly.`
      );
      setTimeout(() => setEnrollmentToast(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit activation request');
    }
  };

  const handleApproveEnrollment = async (enrId: string) => {
    try {
      await setEnrollmentStatus(enrId, 'ACTIVE');
      await loadEnrollments();
      setEnrollmentToast('Enrollment approved and access activated.');
      setTimeout(() => setEnrollmentToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error approving enrollment');
    }
  };

  const handleRevokeEnrollment = async (enrId: string) => {
    const targetEnr = enrollments.find((e) => e.id === enrId);
    if (!targetEnr) return;
    const targetCourse = courses.find((c) => c.id === targetEnr.course_id);
    if (!isSuperAdminUser && targetCourse && !isCourseOwnedByCurrentInstructor(targetCourse)) {
      alert("You are not authorized to revoke access from another instructor's course.");
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to revoke student access to this course?')) return;
    try {
      await adminRevokeEnrollment(enrId);
      await loadEnrollments();
      setEnrollmentToast('Course access revoked successfully.');
      setTimeout(() => setEnrollmentToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error revoking access');
    }
  };

  const handleExpelUser = async (userEmail: string, userId?: string) => {
    if (userEmail.toLowerCase() === 'phenolvii@gmail.com') {
      alert('Super Admin cannot be expelled.');
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(`Are you sure you want to completely expel user (${userEmail}) from the platform? This will wipe all their enrollments.`)) return;
    try {
      await adminDeleteStudentAccount(userEmail, userId);
      await loadEnrollments();
      setEnrollmentToast(`User (${userEmail}) has been expelled from the platform.`);
      setTimeout(() => setEnrollmentToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error expelling user');
    }
  };

  const handleDirectEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directEnrollStudent || !selectedCourseIdToEnroll) return;
    const courseObj = courses.find((c) => c.id === selectedCourseIdToEnroll);
    if (!courseObj) return;

    if (!isSuperAdminUser && !isCourseOwnedByCurrentInstructor(courseObj)) {
      alert('You are only authorized to enroll students into your own courses.');
      return;
    }

    try {
      await adminEnrollStudent(directEnrollStudent.email, selectedCourseIdToEnroll);
      await loadEnrollments();
      setIsDirectEnrollModalOpen(false);
      setEnrollmentToast(`Successfully activated (${courseObj.title}) for ${directEnrollStudent.name}`);
      setTimeout(() => setEnrollmentToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error enrolling student');
    }
  };

  const handleManualAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentEmail.trim() || !manualStudentName.trim()) return;

    try {
      await recordRegisteredStudent({
        name: manualStudentName.trim(),
        email: manualStudentEmail.trim(),
        phone: manualStudentPhone.trim(),
        academicTrack: manualStudentTrack,
      });

      await supabase.from('registered_students').upsert({
        id: `stu-${Date.now()}`,
        name: manualStudentName.trim(),
        email: manualStudentEmail.trim().toLowerCase(),
        phone: manualStudentPhone.trim(),
        academic_code: `PH-${Math.floor(1000 + Math.random() * 9000)}`,
        academic_track: manualStudentTrack,
        created_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      window.dispatchEvent(new Event('phenol_students_updated'));
      setEnrollmentToast(`Student registered successfully in roster`);
    } catch (err: any) {
      console.error('Error adding student:', err);
      setEnrollmentToast(`Student saved to roster`);
    }

    setIsManualAddStudentModalOpen(false);
    setManualStudentName('');
    setManualStudentEmail('');
    setManualStudentPhone('');
    setTimeout(() => setEnrollmentToast(null), 4000);
  };

  const isInstructor = currentUser?.role === 'INSTRUCTOR';
  const showAdminInterface = isInstructor && adminViewMode === 'ADMIN';

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const trackObj = ACADEMIC_TRACKS.find((t) => t.id === newCourseCategory);
    const isSuperAdmin = currentUser?.email?.toLowerCase() === 'phenolvii@gmail.com' || currentUser?.isSuperAdmin;
    const approvalStatus = isSuperAdmin ? ('APPROVED' as const) : ('PENDING' as const);

    const newCourse: ChemistryCourse = {
      id: `chem-${Date.now()}`,
      code: newCourseCode.trim() || `CHEM-${newCourseCategory.toUpperCase()}`,
      title: newCourseTitle,
      subTitle: newCourseSubtitle || 'Theoretical & Analytical Foundations',
      description: newCourseDesc || 'Curated chemistry curriculum directed by Dr. Omar Magdi.',
      category: newCourseCategory,
      categoryName: trackObj?.name || 'Academic Program',
      level: newCourseLevel || 'Academic Year 2026/2027',
      molecularFormula: newCourseFormula || undefined,
      thumbnail: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80',
      totalHours: newCourseHours,
      colorAccent: '#641C32',
      accentBg: 'bg-burgundy-950',
      instructorId: currentUser?.id,
      instructorName: currentUser?.name || 'Academic Instructor',
      instructorEmail: currentUser?.email,
      instructorAvatar: profileAvatar || currentUser?.avatar,
      approvalStatus,
      submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      lessons: [],
    };

    const updated = [newCourse, ...courses];
    setCourses(updated);
    await saveStoredCourses(updated);

    setIsCreateCourseOpen(false);
    setNewCourseCode('');
    setNewCourseTitle('');
    setNewCourseSubtitle('');
    setNewCourseLevel('');
    setNewCourseFormula('');
    setNewCourseDesc('');

    if (approvalStatus === 'APPROVED') {
      setEnrollmentToast('Course created and published live on the platform.');
    } else {
      setEnrollmentToast('Course proposal submitted! It is now pending approval by Academic Director Dr. Omar Magdi.');
    }
    setTimeout(() => setEnrollmentToast(null), 4500);
  };

  const handleApproveCourse = async (courseId: string) => {
    try {
      await supabase.rpc('set_course_approval', {
        p_course_id: courseId,
        p_status: 'APPROVED',
      });
    } catch (e) {
      console.warn('RPC set_course_approval failed:', e);
    }
    const updated = courses.map((c) =>
      c.id === courseId ? { ...c, approvalStatus: 'APPROVED' as const } : c
    );
    setCourses(updated);
    const target = updated.find((c) => c.id === courseId);
    if (target) await saveSingleCourse(target);
    setEnrollmentToast('Course approved and published live.');
    setTimeout(() => setEnrollmentToast(null), 4000);
  };

  const handleRejectCourse = async (courseId: string) => {
    try {
      await supabase.rpc('set_course_approval', {
        p_course_id: courseId,
        p_status: 'REJECTED',
      });
    } catch (e) {
      console.warn('RPC set_course_approval failed:', e);
    }
    const updated = courses.map((c) =>
      c.id === courseId ? { ...c, approvalStatus: 'REJECTED' as const } : c
    );
    setCourses(updated);
    const target = updated.find((c) => c.id === courseId);
    if (target) await saveSingleCourse(target);
    setEnrollmentToast('Course proposal rejected.');
    setTimeout(() => setEnrollmentToast(null), 4000);
  };

  const handleToggleUserRole = async (userId: string, email: string, currentRole: 'instructor' | 'student') => {
    const newRole = currentRole === 'instructor' ? 'student' : 'instructor';
    try {
      if (userId) {
        await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      } else {
        const { data: st } = await supabase.from('registered_students').select('id').eq('email', email).single();
        if (st?.id) {
          await supabase.from('profiles').update({ role: newRole }).eq('id', st.id);
        }
      }
    } catch (e) {
      console.warn('Error updating profile role:', e);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(`phenol_user_role_${email.toLowerCase()}`, newRole);
      const raw = localStorage.getItem('phenol_registered_students');
      if (raw) {
        const list = JSON.parse(raw);
        const updatedList = list.map((st: any) =>
          st.email?.toLowerCase() === email.toLowerCase() ? { ...st, role: newRole } : st
        );
        localStorage.setItem('phenol_registered_students', JSON.stringify(updatedList));
      }
      window.dispatchEvent(new Event('phenol_students_updated'));
    }

    setEnrollmentToast(`User ${email} role switched to ${newRole === 'instructor' ? 'Academic Instructor' : 'Student / Scholar'}`);
    setTimeout(() => setEnrollmentToast(null), 4000);
  };

  const handleOpenEditCourse = (course: ChemistryCourse) => {
    if (!isSuperAdminUser && !isCourseOwnedByCurrentInstructor(course)) {
      alert("Unauthorized: You can only edit your own courses.");
      return;
    }
    setEditingCourseId(course.id);
    setEditCourseCategory(course.category);
    setEditCourseCode(course.code);
    setEditCourseTitle(course.title);
    setEditCourseSubtitle(course.subTitle || '');
    setEditCourseLevel(course.level);
    setEditCourseFormula(course.molecularFormula || '');
    setEditCourseHours(course.totalHours || '30 Academic Hours');
    setEditCourseDesc(course.description);
    setIsEditCourseOpen(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourseId) return;

    const trackObj = ACADEMIC_TRACKS.find((t) => t.id === editCourseCategory);
    const updated = courses.map((c) => {
      if (c.id === editingCourseId) {
        return {
          ...c,
          category: editCourseCategory,
          categoryName: trackObj?.name || c.categoryName,
          code: editCourseCode,
          title: editCourseTitle,
          subTitle: editCourseSubtitle,
          level: editCourseLevel,
          molecularFormula: editCourseFormula || undefined,
          totalHours: editCourseHours,
          description: editCourseDesc,
        };
      }
      return c;
    });

    setCourses(updated);
    const updatedTarget = updated.find((c) => c.id === editingCourseId);
    if (updatedTarget) {
      await saveSingleCourse(updatedTarget);
    } else {
      await saveStoredCourses(updated);
    }

    setIsEditCourseOpen(false);
    setEditingCourseId(null);
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    const target = courses.find((c) => c.id === courseId);
    if (!isSuperAdminUser && target && !isCourseOwnedByCurrentInstructor(target)) {
      alert("Unauthorized: You can only delete your own courses.");
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(`Are you sure you want to permanently delete course "${title}" and all its syllabus modules?`)) return;
    await markCourseDeleted(courseId);
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCourseId = newLectureCourse || (myInstructorCourses.length > 0 ? myInstructorCourses[0].id : '');
    if (!targetCourseId) {
      alert('Please select a course first');
      return;
    }
    const targetCourse = courses.find((c) => c.id === targetCourseId);
    if (!isSuperAdminUser && targetCourse && !isCourseOwnedByCurrentInstructor(targetCourse)) {
      alert("Unauthorized: You can only add lectures to your own courses.");
      return;
    }
    if (!newLectureTitle.trim()) {
      alert('Please enter a lecture title');
      return;
    }

    const newLesson: ChemistryLesson & { videoUrl?: string; pdfNotesUrl?: string } = {
      id: `les-${Date.now()}`,
      title: newLectureTitle.trim(),
      duration: newLectureDuration.trim() || '45 min',
      type: 'video',
      completed: false,
      videoUrl: newLectureVideoUrl.trim() || undefined,
      pdfNotesUrl: newLecturePdfUrl.trim() || undefined,
      pdfNotesName: newLecturePdfName.trim() || undefined,
      summary: newLectureSummary.trim() || 'Foundational lecture under the academic direction of Dr. Omar Magdi.',
      keyFormulas: newLectureFormula.trim() ? [newLectureFormula.trim()] : undefined,
      timestamps: [
        { timeSeconds: 0, timeLabel: '00:00', title: 'Introduction & Theoretical Fundamentals' },
        { timeSeconds: 600, timeLabel: '10:00', title: 'Reaction Mechanism & Orbital Analysis' },
        { timeSeconds: 1500, timeLabel: '25:00', title: 'Diagnostic Applications & Exam Problem Sets' },
      ],
    };

    const updated = courses.map((course) => {
      if (course.id === targetCourseId) {
        return {
          ...course,
          lessons: [...(course.lessons || []), newLesson],
        };
      }
      return course;
    });

    setCourses(updated);
    const updatedTarget = updated.find((c) => c.id === targetCourseId);
    if (updatedTarget) {
      await saveSingleCourse(updatedTarget);
    } else {
      await saveStoredCourses(updated);
    }

    // Broadcast notification to all actively enrolled students
    try {
      const targetCourseObj = courses.find((c) => c.id === targetCourseId);
      await adminNotifyCourseStudents(
        targetCourseId,
        `محاضرة جديدة: ${newLesson.title}`,
        `تم نشر محاضرة جديدة في كورس ${targetCourseObj?.title || 'الكيمياء'}: "${newLesson.title}"`,
        `/courses/${targetCourseId}/lessons/${newLesson.id}`,
        newLesson.id
      );
    } catch (notifErr) {
      console.warn('Could not dispatch course notification:', notifErr);
    }

    setIsAddLectureOpen(false);
    setNewLectureTitle('');
    setNewLectureVideoUrl('');
    setNewLecturePdfUrl('');
    setNewLecturePdfName('');
    setNewLectureSummary('');
    setNewLectureFormula('');
    setEnrollmentToast(`Lecture (${newLesson.title}) added successfully`);
    setTimeout(() => setEnrollmentToast(null), 4000);
  };

  const handleOpenEditLesson = (courseId: string, lesson: ChemistryLesson) => {
    const parent = courses.find((c) => c.id === courseId);
    if (!isSuperAdminUser && parent && !isCourseOwnedByCurrentInstructor(parent)) {
      alert("Unauthorized: You can only edit lessons in your own courses.");
      return;
    }
    setEditingLessonCourseId(courseId);
    setEditingLessonId(lesson.id);
    setEditLessonTitle(lesson.title);
    setEditLessonDuration(lesson.duration);
    setEditLessonVideoUrl((lesson as any).videoUrl || '');
    setEditLessonPdfUrl((lesson as any).pdfNotesUrl || '');
    setEditLessonPdfName(lesson.pdfNotesName || '');
    setEditLessonSummary(lesson.summary);
    setEditLessonFormula(lesson.keyFormulas?.[0] || '');
    setIsEditLessonOpen(true);
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLessonCourseId || !editingLessonId) return;

    const updated = courses.map((course) => {
      if (course.id === editingLessonCourseId) {
        const updatedLessons = course.lessons.map((l) => {
          if (l.id === editingLessonId) {
            return {
              ...l,
              title: editLessonTitle,
              duration: editLessonDuration,
              videoUrl: editLessonVideoUrl.trim() || undefined,
              pdfNotesUrl: editLessonPdfUrl.trim() || undefined,
              pdfNotesName: editLessonPdfName.trim() || undefined,
              summary: editLessonSummary,
              keyFormulas: editLessonFormula ? [editLessonFormula] : undefined,
            };
          }
          return l;
        });
        return { ...course, lessons: updatedLessons };
      }
      return course;
    });

    setCourses(updated);
    const updatedTarget = updated.find((c) => c.id === editingLessonCourseId);
    if (updatedTarget) {
      await saveSingleCourse(updatedTarget);
    } else {
      await saveStoredCourses(updated);
    }

    setIsEditLessonOpen(false);
    setEditingLessonCourseId(null);
    setEditingLessonId(null);
  };

  const handleDeleteLesson = async (courseId: string, lessonId: string, title: string) => {
    const parent = courses.find((c) => c.id === courseId);
    if (!isSuperAdminUser && parent && !isCourseOwnedByCurrentInstructor(parent)) {
      alert("Unauthorized: You can only delete lessons from your own courses.");
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(`Remove module "${title}" from the syllabus?`)) return;
    const updated = courses.map((course) => {
      if (course.id === courseId) {
        return {
          ...course,
          lessons: course.lessons.filter((l) => l.id !== lessonId),
        };
      }
      return course;
    });
    setCourses(updated);
    const updatedTarget = updated.find((c) => c.id === courseId);
    if (updatedTarget) {
      await saveSingleCourse(updatedTarget);
    } else {
      await saveStoredCourses(updated);
    }
  };

  const handleDeleteWaitlist = async (id: string, name: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`Are you sure you want to permanently delete application for "${name}"?`)) return;
    setWaitlist((prev) => prev.filter((w) => w.id !== id));
    try {
      await supabase.from('waitlist_applications').delete().eq('id', id);
    } catch (e) {}
  };

  const handleUpdateWaitlistStatus = async (id: string, status: 'approved' | 'declined' | 'contacted') => {
    const updated = waitlist.map((app) => (app.id === id ? { ...app, status } : app));
    setWaitlist(updated);
    try {
      await supabase.from('waitlist_applications').update({ status }).eq('id', id);
    } catch (e) {}
  };

  const handleAddApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    const trackObj = ACADEMIC_TRACKS.find((t) => t.id === manualTrack);
    const chosenCourse = courses.find((c) => c.category === manualTrack);
    const newApp: WaitlistApplication = {
      id: `wl-${Date.now()}`,
      fullName: manualName,
      email: manualEmail,
      phone: manualPhone,
      academicTrack: trackObj?.name || manualTrack,
      targetCourse: manualCourse || (chosenCourse ? `${chosenCourse.code} - ${chosenCourse.title}` : 'General Inquiry'),
      appliedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'pending',
      notes: 'Direct office registration.',
    };

    setWaitlist([newApp, ...waitlist]);
    try {
      await supabase.from('waitlist_applications').insert([
        {
          full_name: manualName,
          email: manualEmail,
          phone: manualPhone,
          academic_track: trackObj?.name || manualTrack,
          target_course: newApp.targetCourse,
          status: 'pending',
          notes: 'Direct office registration.',
        },
      ]);
    } catch (e) {}

    setIsAddApplicantOpen(false);
    setManualName('');
    setManualPhone('');
    setManualEmail('');
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    const updated = submissions.map((s) =>
      s.id === gradingSubmission.id
        ? {
            ...s,
            grade: inputGrade,
            drFeedback: inputFeedback,
            status: 'graded' as const,
          }
        : s
    );
    setSubmissions(updated);
    setGradingSubmission(null);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sub: StudentSubmission = {
      id: `sub-${Date.now()}`,
      studentName: currentUser?.name || 'Enrolled Student',
      studentCode: currentUser?.academicCode || 'PHN-2026-LIVE',
      taskTitle: newTaskTitle,
      submittedAt: 'Just now',
      solutionNotes: newSolutionNotes,
      maxGrade: 20,
      status: 'pending',
    };
    setSubmissions([sub, ...submissions]);
    setIsSubmitModalOpen(false);
    setNewSolutionNotes('');
  };

  const handleAnswerSelect = (qId: string, optIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-ivory-200 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-10 h-10 rounded-full border-2 border-burgundy-500 border-t-transparent animate-spin mb-4" />
        <p className="text-xs font-semibold text-charcoal-100">Verifying academic account credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100">
      {/* Header */}
      <header className="border-b border-hairline bg-ivory-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-6">
              <Link href="/" aria-label="PHENOL Home">
                <PhenolLogo size={36} />
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {isInstructor && (
                <>
                  <div className="hidden sm:flex items-center bg-ivory-300 p-1 rounded border border-hairline text-xs font-semibold">
                    <button
                      onClick={() => setAdminViewMode('ADMIN')}
                      className={`px-3 py-1 rounded transition-colors ${
                        adminViewMode === 'ADMIN'
                          ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                          : 'text-charcoal-100 hover:text-charcoal-900'
                      }`}
                    >
                      Admin Portal
                    </button>
                    <button
                      onClick={() => setAdminViewMode('STUDENT_PREVIEW')}
                      className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                        adminViewMode === 'STUDENT_PREVIEW'
                          ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                          : 'text-charcoal-100 hover:text-charcoal-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Student View</span>
                    </button>
                  </div>
                </>
              )}

              <div className="flex items-center gap-3">
                <NotificationBell />

                <button
                  type="button"
                  onClick={handleOpenProfileModal}
                  className="flex items-center gap-3 text-right hover:opacity-85 transition-opacity group"
                >
                  <div className="hidden md:block">
                    <span className="text-xs font-bold text-charcoal-900 font-display block">
                      {currentUser?.name || (isInstructor ? 'Dr. Omar Magdi' : 'Enrolled Scholar')}
                    </span>
                    <span className="text-[11px] text-charcoal-100 font-sans block">
                      {currentUser?.title || (isInstructor ? 'Academic Director' : 'Enrolled Scholar')}
                    </span>
                  </div>

                  <div className="relative">
                    {profileAvatar || currentUser?.avatar ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-hairline shadow-quiet">
                        <img
                          src={profileAvatar || currentUser.avatar}
                          alt={currentUser?.name || 'Instructor'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <Initials name={currentUser?.name || (isInstructor ? 'Dr. Omar Magdi' : 'Scholar')} size="sm" />
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-burgundy-500 text-ivory-100 flex items-center justify-center border border-ivory-100 shadow-sm">
                      <Settings className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-2 text-charcoal-50 hover:text-burgundy-500 rounded transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {showAdminInterface ? (
          (isSuperAdminCockpitOpen && isSuperAdminUser) ? (
            <SuperAdministrationView
              courses={courses}
              enrollments={enrollments}
              onBackToInstructor={() => setIsSuperAdminCockpitOpen(false)}
              onOpenCourseStudents={(course) => {
                setSelectedCourseForStudents(course);
                setIsCourseStudentsOpen(true);
              }}
              onDirectEnrollStudent={(st) => {
                setDirectEnrollStudent(st);
                setSelectedCourseIdToEnroll(courses[0]?.id || '');
                setIsDirectEnrollModalOpen(true);
              }}
              onManualAddStudent={() => setIsManualAddStudentModalOpen(true)}
              onApproveCourse={handleApproveCourse}
              onRejectCourse={handleRejectCourse}
              onToggleUserRole={handleToggleUserRole}
              onDeleteCourse={handleDeleteCourse}
              onExpelUser={handleExpelUser}
              onOpenCreateCourse={(trackId, instName) => {
                if (trackId) setNewCourseCategory(trackId as any);
                setIsCreateCourseOpen(true);
              }}
            />
          ) : (
          <div className="space-y-8">
            {/* Instructor Personal Profile Card with Super Administration Button */}
            <div className="p-6 sm:p-7 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-hairline shadow-quiet bg-ivory-200 flex items-center justify-center">
                    {profileAvatar || currentUser.avatar ? (
                      <img
                        src={profileAvatar || currentUser.avatar}
                        alt={currentUser.name || 'Dr. Omar Magdi'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Initials name={currentUser.name || 'Dr. Omar Magdi'} size="lg" />
                    )}
                  </div>
                  <button
                    onClick={handleOpenProfileModal}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-burgundy-500 text-ivory-100 flex items-center justify-center border-2 border-ivory-100 shadow-sm hover:bg-burgundy-900 transition-colors"
                    title="Change Photo & Bio"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
                      {currentUser.name || 'Dr. Omar Magdi'}
                    </h2>
                    <span className="font-formula text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-burgundy-50 text-burgundy-800 border border-burgundy-200">
                      Instructor Cockpit
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-100 font-sans font-medium">
                    {currentUser.title || 'Academic Director & Senior Chemistry Fellow (PharmD)'}
                  </p>
                  <p className="text-[11px] text-charcoal-50 font-sans line-clamp-1 max-w-xl">
                    {currentUser.bio || 'Dedicated to first-principles causality, reaction mechanisms, and intellectual scientific pedagogy.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenProfileModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 border border-hairline text-xs font-semibold transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-charcoal-100" />
                  <span>Edit Profile</span>
                </button>

                {/* Super Administration Button - Dr. Omar Magdi ONLY */}
                {isSuperAdminUser && (
                  <button
                    type="button"
                    onClick={() => setIsSuperAdminCockpitOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans text-xs font-bold transition-all shadow-md hover:shadow-lg ring-2 ring-burgundy-500/20"
                  >
                    <ShieldCheck className="w-4 h-4 text-ochre-400" />
                    <span>Super Administration</span>
                  </button>
                )}
              </div>
            </div>

            {/* Admin Metrics Dashboard Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-ivory-100 border border-hairline rounded p-5 space-y-1.5 shadow-quiet">
                <div className="flex items-center justify-between text-charcoal-50">
                  <span className="text-xs font-semibold uppercase tracking-wider font-formula">
                    Enrolled Scholars
                  </span>
                  <Users className="w-4 h-4 text-burgundy-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-formula text-charcoal-900">
                  {enrollments.filter((e) => e.status === 'ACTIVE').length}
                </div>
                <span className="text-[11px] text-charcoal-100 font-sans block">
                  {enrollments.filter((e) => e.status === 'PENDING').length} Pending Course Activations
                </span>
              </div>

              <div className="bg-ivory-100 border border-hairline rounded p-5 space-y-1.5 shadow-quiet">
                <div className="flex items-center justify-between text-charcoal-50">
                  <span className="text-xs font-semibold uppercase tracking-wider font-formula">
                    Waitlist Applications
                  </span>
                  <GraduationCap className="w-4 h-4 text-burgundy-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-formula text-burgundy-500">
                  {waitlist.filter((w) => w.status === 'pending').length}
                </div>
                <span className="text-[11px] text-charcoal-100 font-sans block">
                  {waitlist.length} Total Registered Inquiries
                </span>
              </div>

              <div className="bg-ivory-100 border border-hairline rounded p-5 space-y-1.5 shadow-quiet">
                <div className="flex items-center justify-between text-charcoal-50">
                  <span className="text-xs font-semibold uppercase tracking-wider font-formula">
                    Pending Problem Sets
                  </span>
                  <FileCheck2 className="w-4 h-4 text-burgundy-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-formula text-charcoal-900">
                  {submissions.filter((s) => s.status === 'pending').length}
                </div>
                <span className="text-[11px] text-charcoal-100 font-sans block">
                  Awaiting Instructor Evaluation
                </span>
              </div>

              <div className="bg-ivory-100 border border-hairline rounded p-5 space-y-1.5 shadow-quiet">
                <div className="flex items-center justify-between text-charcoal-50">
                  <span className="text-xs font-semibold uppercase tracking-wider font-formula">
                    Academic Courses
                  </span>
                  <Layers className="w-4 h-4 text-burgundy-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-formula text-charcoal-900">
                  {courses.length}
                </div>
                <span className="text-[11px] text-charcoal-100 font-sans block">
                  Structured across 4 Tracks
                </span>
              </div>
            </div>

            {/* Administration Navigation Tabs & Actions */}
            <div className="border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <nav className="flex items-center gap-6 text-sm font-semibold overflow-x-auto">
                <button
                  onClick={() => setAdminTab('curriculum')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    adminTab === 'curriculum'
                      ? 'border-burgundy-500 text-burgundy-500'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <span>Programs & Courses</span>
                  <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
                    {courses.length}
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab('waitlist')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    adminTab === 'waitlist'
                      ? 'border-burgundy-500 text-burgundy-500'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <span>Admissions & Waitlist</span>
                  <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
                    {waitlist.length}
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab('submissions')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    adminTab === 'submissions'
                      ? 'border-burgundy-500 text-burgundy-500'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <span>Grading Desk</span>
                  <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
                    {submissions.length}
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab('roster')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    adminTab === 'roster'
                      ? 'border-burgundy-500 text-burgundy-500'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <span>Student Roster</span>
                  <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
                    {enrollments.length}
                  </span>
                </button>
              </nav>

              {/* Action Buttons based on active tab */}
              <div className="flex items-center gap-2 pb-2 sm:pb-0">
                {adminTab === 'curriculum' && (
                  <>
                    <button
                      onClick={() => setIsCreateCourseOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Course</span>
                    </button>
                    <button
                      onClick={() => {
                        if (courses.length > 0 && !newLectureCourse) {
                          setNewLectureCourse(courses[0].id);
                        }
                        setIsAddLectureOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-ivory-100 border border-hairline hover:border-charcoal-100 text-charcoal-900 text-xs font-semibold transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-burgundy-500" />
                      <span>Add Lecture</span>
                    </button>
                  </>
                )}

                {adminTab === 'waitlist' && (
                  <button
                    onClick={() => setIsAddApplicantOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register Walk-in Applicant</span>
                  </button>
                )}
              </div>
            </div>

            {/* TAB 1: CURRICULUM */}
            {adminTab === 'curriculum' && (
              <AdminCurriculumTab
                courses={myInstructorCourses}
                trackFilter={trackFilter}
                setTrackFilter={setTrackFilter}
                setIsCreateCourseOpen={setIsCreateCourseOpen}
                setNewLectureCourse={setNewLectureCourse}
                setIsAddLectureOpen={setIsAddLectureOpen}
                setSelectedCourseForStudents={setSelectedCourseForStudents}
                setIsCourseStudentsOpen={setIsCourseStudentsOpen}
                enrollments={enrollments}
                handleOpenEditCourse={handleOpenEditCourse}
                handleDeleteCourse={handleDeleteCourse}
                handleOpenEditLesson={handleOpenEditLesson}
                handleDeleteLesson={handleDeleteLesson}
                isSuperAdmin={isSuperAdminUser}
              />
            )}

            {/* TAB 2: WAITLIST */}
            {adminTab === 'waitlist' && (
              <AdminWaitlistTab
                waitlist={myWaitlist}
                trackFilter={trackFilter}
                setTrackFilter={setTrackFilter}
                handleUpdateWaitlistStatus={handleUpdateWaitlistStatus}
                handleDeleteWaitlist={handleDeleteWaitlist}
                setIsAddApplicantOpen={setIsAddApplicantOpen}
              />
            )}

            {/* TAB 3: SUBMISSIONS / GRADING */}
            {adminTab === 'submissions' && (
              <AdminSubmissionsTab
                submissions={mySubmissions}
                setGradingSubmission={(sub) => {
                  setGradingSubmission(sub);
                  setInputGrade(sub.grade || 20);
                  setInputFeedback(sub.drFeedback || '');
                }}
                setInputGrade={setInputGrade}
                setInputFeedback={setInputFeedback}
              />
            )}

            {/* TAB 4: ROSTER */}
            {adminTab === 'roster' && (
              <AdminRosterTab
                enrollments={enrollments}
                courses={myInstructorCourses}
                rosterSearchQuery={rosterSearchQuery}
                setRosterSearchQuery={setRosterSearchQuery}
                setIsManualAddStudentModalOpen={setIsManualAddStudentModalOpen}
                handleApproveEnrollment={handleApproveEnrollment}
                setDirectEnrollStudent={setDirectEnrollStudent}
                setSelectedCourseIdToEnroll={setSelectedCourseIdToEnroll}
                setIsDirectEnrollModalOpen={setIsDirectEnrollModalOpen}
                handleRevokeEnrollment={handleRevokeEnrollment}
                currentUser={currentUser}
              />
            )}
          </div>
          )
        ) : (
          <div className="space-y-8">
            {/* Student Welcome Banner */}
            <div className="border border-hairline rounded bg-ivory-100 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-quiet">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-burgundy-500 uppercase tracking-wider">
                  <span>Student Workspace</span>
                  <span>•</span>
                  <span>Academic Year 2026/2027</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
                  Welcome, {currentUser.name || 'Scholar'}
                </h1>
                <p className="text-xs sm:text-sm text-charcoal-100 font-sans max-w-xl leading-relaxed">
                  Active academic portal for chemistry lectures, diagnostic problem sets, and personalized evaluation under Dr. Omar Magdi.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <button
                  onClick={() => setIsStudentProfileOpen(true)}
                  className="px-4 py-2.5 rounded border border-hairline hover:bg-ivory-300 text-charcoal-900 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-charcoal-50" />
                  <span>My Profile & Code</span>
                </button>
              </div>
            </div>

            {/* Student Navigation Tabs */}
            <div className="border-b border-hairline flex items-center gap-8 text-sm font-semibold overflow-x-auto">
              <button
                onClick={() => setStudentTab('courses')}
                className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                  studentTab === 'courses'
                    ? 'border-burgundy-500 text-burgundy-500'
                    : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                }`}
              >
                Programs & Courses ({courses.length})
              </button>

              <button
                onClick={() => setStudentTab('tasks')}
                className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  studentTab === 'tasks'
                    ? 'border-burgundy-500 text-burgundy-500'
                    : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                }`}
              >
                <span>My Problem Sets</span>
                <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
                  {submissions.length}
                </span>
              </button>

              <button
                onClick={() => setStudentTab('booklets')}
                className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                  studentTab === 'booklets'
                    ? 'border-burgundy-500 text-burgundy-500'
                    : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                }`}
              >
                Academic Booklets
              </button>

              <button
                onClick={() => setStudentTab('quizzes')}
                className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                  studentTab === 'quizzes'
                    ? 'border-burgundy-500 text-burgundy-500'
                    : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                }`}
              >
                Diagnostic Quizzes
              </button>
            </div>

            {/* STUDENT TAB 1: COURSES */}
            {studentTab === 'courses' && (
              <StudentCoursesTab
                courses={courses}
                trackFilter={trackFilter}
                setTrackFilter={setTrackFilter}
                enrollmentToast={enrollmentToast}
                setEnrollmentToast={setEnrollmentToast}
                currentUser={currentUser}
                enrollments={enrollments}
                handleRequestCourse={handleRequestCourse}
              />
            )}

            {/* STUDENT TAB 2: TASKS */}
            {studentTab === 'tasks' && (
              <StudentTasksTab
                submissions={submissions}
                setIsSubmitModalOpen={setIsSubmitModalOpen}
              />
            )}

            {/* STUDENT TAB 3: BOOKLETS */}
            {studentTab === 'booklets' && <BookletsView booklets={BOOKLETS} />}

            {/* STUDENT TAB 4: QUIZZES */}
            {studentTab === 'quizzes' && (
              <StudentQuizzesTab
                activeQuiz={activeQuiz}
                setActiveQuiz={setActiveQuiz}
                selectedAnswers={selectedAnswers}
                quizSubmitted={quizSubmitted}
                setQuizSubmitted={setQuizSubmitted}
                handleAnswerSelect={handleAnswerSelect}
              />
            )}
          </div>
        )}
      </main>

      {/* Instructor Profile Modal */}
      <InstructorProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        tab={profileModalTab}
        setTab={setProfileModalTab}
        avatar={profileAvatar}
        setAvatar={setProfileAvatar}
        name={profileName}
        setName={setProfileName}
        title={profileTitle}
        setTitle={setProfileTitle}
        specialization={profileSpecialization}
        setSpecialization={setProfileSpecialization}
        phone={profilePhone}
        setPhone={setProfilePhone}
        bio={profileBio}
        setBio={setProfileBio}
        onSaveProfile={handleSaveProfile}
        currentPasswordInput={currentPasswordInput}
        setCurrentPasswordInput={setCurrentPasswordInput}
        newPasswordInput={newPasswordInput}
        setNewPasswordInput={setNewPasswordInput}
        confirmPasswordInput={confirmPasswordInput}
        setConfirmPasswordInput={setConfirmPasswordInput}
        passwordChangeStatus={passwordChangeStatus}
        setPasswordChangeStatus={setPasswordChangeStatus}
        onChangePassword={handleChangePassword}
        currentUser={currentUser}
        setCurrentUser={() => {}}
      />

      {/* Student Profile Modal */}
      <StudentProfileModal
        isOpen={isStudentProfileOpen}
        onClose={() => setIsStudentProfileOpen(false)}
        user={currentUser}
      />

      {/* Course Students Roster Modal */}
      {selectedCourseForStudents && (
        <CourseStudentsModal
          isOpen={isCourseStudentsOpen}
          course={selectedCourseForStudents}
          onClose={() => setIsCourseStudentsOpen(false)}
          onEnrollmentsUpdated={loadEnrollments}
        />
      )}

      {/* Course Builder (Create Course) Modal */}
      <CreateCourseModal
        isOpen={isCreateCourseOpen}
        onClose={() => setIsCreateCourseOpen(false)}
        onSubmit={handleCreateCourse}
        category={newCourseCategory}
        setCategory={setNewCourseCategory}
        code={newCourseCode}
        setCode={setNewCourseCode}
        title={newCourseTitle}
        setTitle={setNewCourseTitle}
        subtitle={newCourseSubtitle}
        setSubtitle={setNewCourseSubtitle}
        level={newCourseLevel}
        setLevel={setNewCourseLevel}
        formula={newCourseFormula}
        setFormula={setNewCourseFormula}
        hours={newCourseHours}
        setHours={setNewCourseHours}
        desc={newCourseDesc}
        setDesc={setNewCourseDesc}
      />

      {/* Course Editor Modal */}
      <EditCourseModal
        isOpen={isEditCourseOpen}
        onClose={() => setIsEditCourseOpen(false)}
        onSubmit={handleUpdateCourse}
        category={editCourseCategory}
        setCategory={setEditCourseCategory}
        code={editCourseCode}
        setCode={setEditCourseCode}
        title={editCourseTitle}
        setTitle={setEditCourseTitle}
        subtitle={editCourseSubtitle}
        setSubtitle={setEditCourseSubtitle}
        level={editCourseLevel}
        setLevel={setEditCourseLevel}
        formula={editCourseFormula}
        setFormula={setEditCourseFormula}
        hours={editCourseHours}
        setHours={setEditCourseHours}
        desc={editCourseDesc}
        setDesc={setEditCourseDesc}
      />

      {/* Add Lecture Modal */}
      <AddLectureModal
        isOpen={isAddLectureOpen}
        onClose={() => setIsAddLectureOpen(false)}
        onSubmit={handleAddLecture}
        courses={courses}
        targetCourse={newLectureCourse}
        setTargetCourse={setNewLectureCourse}
        title={newLectureTitle}
        setTitle={setNewLectureTitle}
        duration={newLectureDuration}
        setDuration={setNewLectureDuration}
        videoUrl={newLectureVideoUrl}
        setVideoUrl={setNewLectureVideoUrl}
        pdfUrl={newLecturePdfUrl}
        setPdfUrl={setNewLecturePdfUrl}
        formula={newLectureFormula}
        setFormula={setNewLectureFormula}
        summary={newLectureSummary}
        setSummary={setNewLectureSummary}
      />

      {/* Edit Lecture Modal */}
      <EditLectureModal
        isOpen={isEditLessonOpen}
        onClose={() => setIsEditLessonOpen(false)}
        onSubmit={handleUpdateLesson}
        title={editLessonTitle}
        setTitle={setEditLessonTitle}
        duration={editLessonDuration}
        setDuration={setEditLessonDuration}
        videoUrl={editLessonVideoUrl}
        setVideoUrl={setEditLessonVideoUrl}
        pdfUrl={editLessonPdfUrl}
        setPdfUrl={setEditLessonPdfUrl}
        formula={editLessonFormula}
        setFormula={setEditLessonFormula}
        summary={editLessonSummary}
        setSummary={setEditLessonSummary}
      />

      {/* Add Walk-in Applicant Modal */}
      <AddApplicantModal
        isOpen={isAddApplicantOpen}
        onClose={() => setIsAddApplicantOpen(false)}
        onSubmit={handleAddApplicant}
        name={manualName}
        setName={setManualName}
        phone={manualPhone}
        setPhone={setManualPhone}
        email={manualEmail}
        setEmail={setManualEmail}
        track={manualTrack}
        setTrack={setManualTrack}
      />

      {/* Grading Desk Modal */}
      <GradingDeskModal
        submission={gradingSubmission}
        onClose={() => setGradingSubmission(null)}
        onSubmit={handleSaveGrade}
        grade={inputGrade}
        setGrade={setInputGrade}
        feedback={inputFeedback}
        setFeedback={setInputFeedback}
      />

      {/* Submit Problem Set Modal */}
      <SubmitProblemSetModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleStudentSubmit}
        taskTitle={newTaskTitle}
        setTaskTitle={setNewTaskTitle}
        solutionNotes={newSolutionNotes}
        setSolutionNotes={setNewSolutionNotes}
      />

      {/* Direct Enroll Modal */}
      <DirectEnrollModal
        isOpen={isDirectEnrollModalOpen}
        onClose={() => setIsDirectEnrollModalOpen(false)}
        onSubmit={handleDirectEnrollSubmit}
        student={directEnrollStudent}
        courses={isSuperAdminUser ? courses : courses.filter(isCourseOwnedByCurrentInstructor)}
        selectedCourseId={selectedCourseIdToEnroll}
        setSelectedCourseId={setSelectedCourseIdToEnroll}
      />

      {/* Manual Add Student Modal */}
      <ManualAddStudentModal
        isOpen={isManualAddStudentModalOpen}
        onClose={() => setIsManualAddStudentModalOpen(false)}
        onSubmit={handleManualAddStudentSubmit}
        name={manualStudentName}
        setName={setManualStudentName}
        email={manualStudentEmail}
        setEmail={setManualStudentEmail}
        phone={manualStudentPhone}
        setPhone={setManualStudentPhone}
        track={manualStudentTrack}
        setTrack={setManualStudentTrack}
      />

      {/* WhatsApp Prompt Modal */}
      {isWhatsAppRequiredModalOpen && currentUser && (
        <WhatsAppPromptModal
          isOpen={isWhatsAppRequiredModalOpen}
          user={currentUser}
          onSuccess={() => setIsWhatsAppRequiredModalOpen(false)}
        />
      )}
    </div>
  );
}
