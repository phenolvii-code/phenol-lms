'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

// Subcomponents: Admin Tabs
import { AdminCurriculumTab } from '@/components/dashboard/admin/AdminCurriculumTab';
import { AdminWaitlistTab } from '@/components/dashboard/admin/AdminWaitlistTab';
import { AdminSubmissionsTab } from '@/components/dashboard/admin/AdminSubmissionsTab';
import { AdminRosterTab } from '@/components/dashboard/admin/AdminRosterTab';

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
  const { user: currentUser, isLoading, signOut } = useCurrentUser();
  const [isWhatsAppRequiredModalOpen, setIsWhatsAppRequiredModalOpen] = useState(false);

  // Instructor View Toggle (Admin mode vs Student preview mode)
  const [adminViewMode, setAdminViewMode] = useState<'ADMIN' | 'STUDENT_PREVIEW'>('ADMIN');

  // Instructor Admin Tabs
  const [adminTab, setAdminTab] = useState<'curriculum' | 'waitlist' | 'submissions' | 'roster'>('curriculum');

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
  const [profileName, setProfileName] = useState('');
  const [profileTitle, setProfileTitle] = useState('');
  const [profileSpecialization, setProfileSpecialization] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

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
      setProfileName(currentUser.name || 'Dr. Omar Magdi');
      setProfileTitle(currentUser.title || 'Academic Director & Senior Fellow');
      setProfileSpecialization(currentUser.specialization || 'Organic Reaction Mechanisms & Physical Chemistry');
      setProfileBio(currentUser.bio || 'Specialist in organic mechanisms, reaction kinetics, and first-principles pedagogy across 4 Core Tracks.');
      setProfilePhone(currentUser.phone || '');
      setIsProfileModalOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsProfileModalOpen(false);
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

  const handleDirectEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directEnrollStudent || !selectedCourseIdToEnroll) return;
    const courseObj = courses.find((c) => c.id === selectedCourseIdToEnroll);
    if (!courseObj) return;

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
  };

  const handleOpenEditCourse = (course: ChemistryCourse) => {
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
    await saveStoredCourses(updated);

    setIsEditCourseOpen(false);
    setEditingCourseId(null);
  };

  const handleDeleteCourse = async (courseId: string, title: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`Are you sure you want to permanently delete course "${title}" and all its syllabus modules?`)) return;
    await markCourseDeleted(courseId);
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCourseId = newLectureCourse || (courses.length > 0 ? courses[0].id : '');
    if (!targetCourseId) {
      alert('Please select a course first');
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
    await saveStoredCourses(updated);

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
    await saveStoredCourses(updated);

    setIsEditLessonOpen(false);
    setEditingLessonCourseId(null);
    setEditingLessonId(null);
  };

  const handleDeleteLesson = async (courseId: string, lessonId: string, title: string) => {
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
    await saveStoredCourses(updated);
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
                <PhenolLogo size={36} subtitle="Dr. Omar Magdi" />
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {isInstructor && (
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
                    <Initials name={currentUser?.name || (isInstructor ? 'Dr. Omar Magdi' : 'Scholar')} size="sm" />
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
          <div className="space-y-8">
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
                courses={courses}
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
              />
            )}

            {/* TAB 2: WAITLIST */}
            {adminTab === 'waitlist' && (
              <AdminWaitlistTab
                waitlist={waitlist}
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
                submissions={submissions}
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
                courses={courses}
                rosterSearchQuery={rosterSearchQuery}
                setRosterSearchQuery={setRosterSearchQuery}
                setIsManualAddStudentModalOpen={setIsManualAddStudentModalOpen}
                handleApproveEnrollment={handleApproveEnrollment}
                setDirectEnrollStudent={setDirectEnrollStudent}
                setSelectedCourseIdToEnroll={setSelectedCourseIdToEnroll}
                setIsDirectEnrollModalOpen={setIsDirectEnrollModalOpen}
              />
            )}
          </div>
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
        courses={courses}
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
