'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthUser, ADMIN_EMAILS } from '@/types/auth';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { WhatsAppPromptModal } from '@/components/auth/WhatsAppPromptModal';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import {
  CHEMISTRY_COURSES,
  CHEMISTRY_QUIZZES,
  BOOKLETS,
  SUBMISSIONS,
  WAITLIST_APPLICANTS,
  ENROLLED_STUDENTS,
  ACADEMIC_TRACKS,
  INITIAL_TIMELINE_POSTS,
} from '@/data/mock-data';
import {
  AcademicCategory,
  ChemistryCourse,
  ChemistryLesson,
  StudentSubmission,
  WaitlistApplication,
  EnrolledStudent,
  TimelinePost,
  TimelineComment,
} from '@/types/lms';
import { BookletsView } from '@/components/booklets/BookletsView';
import { supabase } from '@/lib/supabase';
import { getUserPassword, setUserPassword, verifyUserPassword } from '@/lib/auth-passwords';
import { getStoredCourses, saveStoredCourses } from '@/lib/courses-storage';
import { StudentProfileModal } from '@/components/profile/StudentProfileModal';
import { CourseStudentsModal } from '@/components/courses/CourseStudentsModal';
import {
  CourseEnrollment,
  getStoredEnrollments,
  checkUserCourseAccess,
  requestCourseEnrollment,
  approveCourseEnrollment,
  toggleCourseEnrollmentStatus,
  getAggregatedStudentsDirectory,
  recordRegisteredStudent,
  directEnrollStudentInCourse,
  syncWithServerStudents,
} from '@/lib/enrollment-storage';
import {
  BookOpen,
  FileCheck2,
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Download,
  Users,
  ShieldCheck,
  Eye,
  GraduationCap,
  MessageCircle,
  PlusCircle,
  Check,
  X,
  Search,
  Filter,
  Layers,
  Award,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Heart,
  Lightbulb,
  FlaskConical,
  MessageSquare,
  Send,
  Settings,
  Sparkles,
  Lock,
  KeyRound,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isWhatsAppRequiredModalOpen, setIsWhatsAppRequiredModalOpen] = useState(false);

  // Instructor View Toggle (Admin mode vs Student preview mode)
  const [adminViewMode, setAdminViewMode] = useState<'ADMIN' | 'STUDENT_PREVIEW'>('ADMIN');

  // Instructor Admin Tabs
  const [adminTab, setAdminTab] = useState<'curriculum' | 'waitlist' | 'timeline' | 'submissions' | 'roster'>('curriculum');

  // Student Tabs
  const [studentTab, setStudentTab] = useState<'courses' | 'timeline' | 'tasks' | 'booklets' | 'quizzes'>('courses');

  // Filter Track for Curriculum and Waitlist
  const [trackFilter, setTrackFilter] = useState<AcademicCategory | 'all'>('all');

  // Core Data states
  const [courses, setCourses] = useState<ChemistryCourse[]>(CHEMISTRY_COURSES);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(SUBMISSIONS);
  const [waitlist, setWaitlist] = useState<WaitlistApplication[]>(WAITLIST_APPLICANTS);
  const [students, setStudents] = useState<EnrolledStudent[]>(ENROLLED_STUDENTS);
  const [posts, setPosts] = useState<TimelinePost[]>(INITIAL_TIMELINE_POSTS);
  const [rosterSearchQuery, setRosterSearchQuery] = useState('');

  // Profile Modal State (Instructor)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'info' | 'security'>('info');
  const [profileName, setProfileName] = useState('');
  const [profileTitle, setProfileTitle] = useState('');
  const [profileSpecialization, setProfileSpecialization] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  // Student Profile Modal State
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);

  // Per-Course Students & Analytics Modal State
  const [isCourseStudentsOpen, setIsCourseStudentsOpen] = useState(false);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState<ChemistryCourse | null>(null);

  // Course Enrollments & Activation Requests State
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
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
  const [manualStudentTrack, setManualStudentTrack] = useState('ثانوية عامة (عربي)');

  // Password Change State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

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
  const [editLessonDuration, setEditLessonDuration] = useState('');
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState('');
  const [editLessonPdfUrl, setEditLessonPdfUrl] = useState('');
  const [editLessonPdfName, setEditLessonPdfName] = useState('');
  const [editLessonSummary, setEditLessonSummary] = useState('');
  const [editLessonFormula, setEditLessonFormula] = useState('');

  // Manual Applicant Modal State
  const [isAddApplicantOpen, setIsAddApplicantOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualTrack, setManualTrack] = useState<AcademicCategory>('thanaweya-arabic');
  const [manualCourse, setManualCourse] = useState('');

  // Timeline Post Composer State
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostFormula, setNewPostFormula] = useState('');
  const [newPostTrack, setNewPostTrack] = useState('General Discussion');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Grading Modal State for Dr. Omar
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

  // Initialize and load saved state from localStorage & Supabase
  useEffect(() => {
    try {
      // 1. Auth check & Google OAuth callback verification
      const checkActiveSession = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const cleanEmail = session.user.email?.toLowerCase() || '';
            const isAdmin =
              cleanEmail === 'phenolvii@gmail.com' ||
              cleanEmail.includes('phenolvii') ||
              ADMIN_EMAILS.includes(cleanEmail);
            const userPhone = session.user.user_metadata?.phone || session.user.user_metadata?.whatsapp;
            const googleUser: AuthUser = {
              id: session.user.id,
              name: isAdmin ? 'Dr. Omar Magdi' : (session.user.user_metadata?.full_name || session.user.user_metadata?.name || cleanEmail.split('@')[0]),
              email: cleanEmail,
              phone: userPhone,
              role: isAdmin ? 'INSTRUCTOR' : 'STUDENT',
              avatar: isAdmin
                ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
                : (session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'),
              registeredAt: session.user.created_at,
              title: isAdmin ? 'Academic Director & Senior Fellow' : undefined,
              specialization: isAdmin ? 'Organic Reaction Mechanisms & Physical Chemistry' : undefined,
            };
            localStorage.setItem('phenol_auth_user', JSON.stringify(googleUser));
            if (!isAdmin) {
              recordRegisteredStudent(googleUser);
            }
            setCurrentUser(googleUser);
            if (!isAdmin && (!userPhone || userPhone.trim().length < 6)) {
              setIsWhatsAppRequiredModalOpen(true);
            }
          }
        } catch (err) {}
      };
      checkActiveSession();

      // Listen for immediate OAuth redirect event
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const cleanEmail = session.user.email?.toLowerCase() || '';
          const isAdmin =
            cleanEmail === 'phenolvii@gmail.com' ||
            cleanEmail.includes('phenolvii') ||
            ADMIN_EMAILS.includes(cleanEmail);
          const userPhone = session.user.user_metadata?.phone || session.user.user_metadata?.whatsapp;
          const googleUser: AuthUser = {
            id: session.user.id,
            name: isAdmin ? 'Dr. Omar Magdi' : (session.user.user_metadata?.full_name || session.user.user_metadata?.name || cleanEmail.split('@')[0]),
            email: cleanEmail,
            phone: userPhone,
            role: isAdmin ? 'INSTRUCTOR' : 'STUDENT',
            avatar: isAdmin
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
              : (session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'),
            registeredAt: session.user.created_at,
            title: isAdmin ? 'Academic Director & Senior Fellow' : undefined,
            specialization: isAdmin ? 'Organic Reaction Mechanisms & Physical Chemistry' : undefined,
          };
          localStorage.setItem('phenol_auth_user', JSON.stringify(googleUser));
          if (!isAdmin) {
            recordRegisteredStudent(googleUser);
          }
          setCurrentUser(googleUser);
          if (!isAdmin && (!userPhone || userPhone.trim().length < 6)) {
            setIsWhatsAppRequiredModalOpen(true);
          }
        }
      });

      const savedUser = localStorage.getItem('phenol_auth_user');
      if (savedUser) {
        const u: AuthUser = JSON.parse(savedUser);
        if (u.role === 'STUDENT' && u.email && !ADMIN_EMAILS.includes(u.email.toLowerCase())) {
          recordRegisteredStudent(u);
        }
        setCurrentUser(u);
        setProfileName(u.name || 'Dr. Omar Magdi');
        setProfileTitle(u.title || (u.role === 'INSTRUCTOR' ? 'Academic Director & Senior Fellow' : 'Enrolled Scholar'));
        setProfileSpecialization(u.specialization || (u.role === 'INSTRUCTOR' ? 'Organic Reaction Mechanisms & Physical Chemistry' : 'Chemistry Major'));
        setProfileBio(u.bio || (u.role === 'INSTRUCTOR' ? 'Specialist in organic mechanisms, reaction kinetics, and first-principles pedagogy across 4 Core Tracks.' : 'Dedicated to learning chemistry through foundational logic.'));
        setProfileAvatar(u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');
        setProfilePhone(u.phone || '');

        // Prompt student for WhatsApp if missing
        if (u.role === 'STUDENT' && (!u.phone || u.phone.trim().length < 6)) {
          setIsWhatsAppRequiredModalOpen(true);
        }
      } else {
        const defaultInstructor: AuthUser = {
          id: 'dr-omar-magdi',
          name: 'Dr. Omar Magdi',
          email: 'phenolvii@gmail.com',
          role: 'INSTRUCTOR',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          registeredAt: '2026-01-01',
          title: 'Academic Director & Senior Fellow',
          specialization: 'Organic Reaction Mechanisms & Physical Chemistry',
          bio: 'Specialist in organic mechanisms, reaction kinetics, and first-principles pedagogy across 4 Core Tracks.',
        };
        setCurrentUser(defaultInstructor);
        setProfileName(defaultInstructor.name);
        setProfileTitle(defaultInstructor.title || '');
        setProfileSpecialization(defaultInstructor.specialization || '');
        setProfileBio(defaultInstructor.bio || '');
        setProfileAvatar(defaultInstructor.avatar);
        localStorage.setItem('phenol_auth_user', JSON.stringify(defaultInstructor));
      }

      // 2. Custom Courses from local storage with permanent deletion persistence
      const savedCourses = localStorage.getItem('phenol_courses');
      if (savedCourses !== null) {
        try {
          const parsed = JSON.parse(savedCourses);
          if (Array.isArray(parsed)) {
            setCourses(parsed);
          }
        } catch (e) {}
      } else {
        localStorage.setItem('phenol_courses', JSON.stringify(CHEMISTRY_COURSES));
      }

      // 3. Timeline Posts from local storage with permanent deletion persistence
      const savedPosts = localStorage.getItem('phenol_timeline_posts');
      if (savedPosts !== null) {
        try {
          const parsed = JSON.parse(savedPosts);
          if (Array.isArray(parsed)) {
            setPosts(parsed);
          }
        } catch (e) {}
      } else {
        localStorage.setItem('phenol_timeline_posts', JSON.stringify(INITIAL_TIMELINE_POSTS));
      }

      // 4. Waitlist Applications from local storage with permanent deletion persistence
      const savedWaitlist = localStorage.getItem('phenol_waitlist_applications');
      if (savedWaitlist !== null) {
        try {
          const parsedWl = JSON.parse(savedWaitlist);
          if (Array.isArray(parsedWl)) {
            setWaitlist(parsedWl);
          }
        } catch (e) {}
      } else {
        localStorage.setItem('phenol_waitlist_applications', JSON.stringify(WAITLIST_APPLICANTS));
      }

      // Background sync from Supabase (respects user deletions)
      (async () => {
        try {
          const { data, error } = await supabase.from('waitlist_applications').select('*').order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            const deletedIds: string[] = JSON.parse(localStorage.getItem('phenol_deleted_waitlist_ids') || '[]');
            const mapped: WaitlistApplication[] = data
              .filter((d: any) => !deletedIds.includes(d.id))
              .map((d: any) => ({
                id: d.id,
                fullName: d.full_name || d.fullName,
                email: d.email,
                phone: d.phone,
                academicTrack: d.academic_track || d.academicTrack || 'Thanaweya Amma',
                targetCourse: d.target_course || d.targetCourse || 'Chemistry Course',
                appliedAt: new Date(d.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                status: d.status || 'pending',
                notes: d.notes,
              }));
            setWaitlist((prev) => {
              const combined = [...prev];
              mapped.forEach((remoteItem) => {
                if (!combined.some((c) => c.id === remoteItem.id) && !deletedIds.includes(remoteItem.id)) {
                  combined.push(remoteItem);
                }
              });
              return combined;
            });
          }
        } catch (e) {
          console.warn('Supabase fetch note:', e);
        }
      })();

      // 5. Submissions from local storage
      const savedSubmissions = localStorage.getItem('phenol_submissions');
      if (savedSubmissions !== null) {
        try {
          setSubmissions(JSON.parse(savedSubmissions));
        } catch (e) {}
      } else {
        localStorage.setItem('phenol_submissions', JSON.stringify(SUBMISSIONS));
      }

      // 6. Purge legacy dummy students from local storage
      try {
        const savedStudents = localStorage.getItem('phenol_students');
        if (savedStudents) {
          const parsed = JSON.parse(savedStudents);
          if (Array.isArray(parsed) && parsed.some((s: any) => s.id === 'stu-101' || s.email?.includes('phenol.academy'))) {
            localStorage.removeItem('phenol_students');
            setStudents([]);
          }
        }
      } catch (e) {}

      // 7. Course Enrollments & Performance Telemetry
      setEnrollments(getStoredEnrollments());
      const handleEnrollmentsUpdate = () => {
        setEnrollments(getStoredEnrollments());
      };
      window.addEventListener('phenol_enrollments_updated', handleEnrollmentsUpdate);
      window.addEventListener('phenol_students_updated', handleEnrollmentsUpdate);

      // 8. Cross-device cloud sync
      syncWithServerStudents();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('phenol_auth_user');
    } catch (e) {}
    router.push('/');
  };

  // Open appropriate profile modal based on user role (Student vs Instructor)
  const handleOpenProfileModal = () => {
    if (!currentUser) return;
    if (currentUser.role === 'STUDENT') {
      setIsStudentProfileOpen(true);
    } else {
      setProfileName(currentUser.name || 'Dr. Omar Magdi');
      setProfileTitle(currentUser.title || 'Academic Director & Senior Fellow');
      setProfileSpecialization(currentUser.specialization || 'Organic Reaction Mechanisms & Physical Chemistry');
      setProfileBio(currentUser.bio || 'Specialist in organic mechanisms, reaction kinetics, and first-principles pedagogy across 4 Core Tracks.');
      setProfileAvatar(currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');
      setProfilePhone(currentUser.phone || '');
      setIsProfileModalOpen(true);
    }
  };

  const handleSaveStudentProfile = (updatedUser: AuthUser) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('phenol_auth_user', JSON.stringify(updatedUser));
    } catch (e) {}
  };

  // Student requests course activation
  const handleRequestCourse = (course: ChemistryCourse) => {
    if (!currentUser) return;
    requestCourseEnrollment(currentUser, course);
    setEnrollments(getStoredEnrollments());
    setEnrollmentToast(
      `تم إرسال طلب تفعيل مادة (${course.title}) إلى د. عمر مجدي بنجاح. سيتم مراجعة طلبك وتفعيل الكورس والتواصل معك عبر الواتساب.`
    );
    setTimeout(() => setEnrollmentToast(null), 6000);
  };

  // Instructor approves course activation
  const handleApproveEnrollment = (enrId: string) => {
    const updated = approveCourseEnrollment(enrId);
    setEnrollments(updated);
  };

  // Instructor directly activates a course for a student
  const handleDirectEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directEnrollStudent || !selectedCourseIdToEnroll) return;
    const courseObj = courses.find((c) => c.id === selectedCourseIdToEnroll);
    if (!courseObj) return;

    directEnrollStudentInCourse(directEnrollStudent.email, courseObj);
    setEnrollments(getStoredEnrollments());
    setIsDirectEnrollModalOpen(false);
    setEnrollmentToast(`تم تفعيل مادة (${courseObj.title}) بنجاح للطالب ${directEnrollStudent.name}`);
    setTimeout(() => setEnrollmentToast(null), 4000);
  };

  // Instructor registers a new student manually
  const handleManualAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentEmail.trim() || !manualStudentName.trim()) return;

    recordRegisteredStudent({
      id: `stu-${Date.now()}`,
      name: manualStudentName.trim(),
      email: manualStudentEmail.trim(),
      phone: manualStudentPhone.trim() || '+20 010 000 0000',
      academicTrack: manualStudentTrack,
    });

    setEnrollments(getStoredEnrollments());
    setIsManualAddStudentModalOpen(false);
    setManualStudentName('');
    setManualStudentEmail('');
    setManualStudentPhone('');
    setEnrollmentToast(`تم تسجيل الطالب ${manualStudentName} في السجل بنجاح`);
    setTimeout(() => setEnrollmentToast(null), 4000);
  };

  const isInstructor = currentUser?.role === 'INSTRUCTOR';
  const showAdminInterface = isInstructor && adminViewMode === 'ADMIN';

  // ==========================================================================
  // PROFILE UPDATE ACTION
  // ==========================================================================
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updatedUser: AuthUser = {
      ...currentUser,
      name: profileName.trim() || currentUser.name,
      title: profileTitle.trim() || currentUser.title,
      specialization: profileSpecialization.trim() || currentUser.specialization,
      bio: profileBio.trim() || currentUser.bio,
      avatar: profileAvatar.trim() || currentUser.avatar,
      phone: profilePhone.trim() || currentUser.phone,
    };

    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('phenol_auth_user', JSON.stringify(updatedUser));
    } catch (e) {}

    setIsProfileModalOpen(false);
  };

  // Change Password Handler for any user profile
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) return;

    setPasswordLoading(true);
    setPasswordChangeStatus({ type: 'idle', message: '' });

    const userEmail = currentUser.email.trim().toLowerCase();

    // 1. Verify current password
    if (!verifyUserPassword(userEmail, currentPasswordInput)) {
      setPasswordChangeStatus({
        type: 'error',
        message: 'Current password is incorrect. Please verify your existing password.',
      });
      setPasswordLoading(false);
      return;
    }

    // 2. Validate new password length
    if (newPasswordInput.length < 6) {
      setPasswordChangeStatus({
        type: 'error',
        message: 'New password must be at least 6 characters long.',
      });
      setPasswordLoading(false);
      return;
    }

    // 3. Confirm matching
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeStatus({
        type: 'error',
        message: 'New password and confirmation do not match.',
      });
      setPasswordLoading(false);
      return;
    }

    try {
      // 4. Save custom password
      setUserPassword(userEmail, newPasswordInput);

      // 5. Update in Supabase if active session
      try {
        await supabase.auth.updateUser({ password: newPasswordInput });
      } catch (err) {}

      setPasswordChangeStatus({
        type: 'success',
        message: 'Password updated successfully! Your new password is now active.',
      });
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err: any) {
      setPasswordChangeStatus({
        type: 'error',
        message: err.message || 'Failed to update password.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ==========================================================================
  // TIMELINE ACTIONS (POST, COMMENT, REACT, MODERATE/DELETE)
  // ==========================================================================
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: TimelinePost = {
      id: `post-${Date.now()}`,
      authorName: currentUser?.name || 'Dr. Omar Magdi',
      authorEmail: currentUser?.email || 'phenolvii@gmail.com',
      authorRole: currentUser?.role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT',
      authorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      trackBadge: newPostTrack,
      content: newPostContent,
      molecularFormula: newPostFormula.trim() || undefined,
      createdAt: 'Just now',
      reactions: { flask: 0, bulb: 0, heart: 0 },
      comments: [],
    };

    const updated = [newPost, ...posts];
    setPosts(updated);
    try {
      localStorage.setItem('phenol_timeline_posts', JSON.stringify(updated));
    } catch (e) {}

    setNewPostContent('');
    setNewPostFormula('');
  };

  const handleToggleReaction = (postId: string, type: 'flask' | 'bulb' | 'heart') => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const isReacted = p.myReactions?.[type];
        const newReactions = {
          ...p.reactions,
          [type]: isReacted ? Math.max(0, p.reactions[type] - 1) : p.reactions[type] + 1,
        };
        const newMyReactions = {
          ...p.myReactions,
          [type]: !isReacted,
        };
        return {
          ...p,
          reactions: newReactions,
          myReactions: newMyReactions,
        };
      }
      return p;
    });

    setPosts(updated);
    try {
      localStorage.setItem('phenol_timeline_posts', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    const newComment: TimelineComment = {
      id: `c-${Date.now()}`,
      authorName: currentUser?.name || 'Scholar',
      authorEmail: currentUser?.email || '',
      authorRole: currentUser?.role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT',
      authorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      content: text.trim(),
      createdAt: 'Just now',
    };

    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment],
        };
      }
      return p;
    });

    setPosts(updated);
    try {
      localStorage.setItem('phenol_timeline_posts', JSON.stringify(updated));
    } catch (e) {}

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  // Admin / Author Delete Post (Permanent Deletion)
  const handleDeletePost = (postId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this post?')) return;
    setPosts((prev) => {
      const updated = prev.filter((p) => p.id !== postId);
      try {
        localStorage.setItem('phenol_timeline_posts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Admin / Author Delete Comment (Permanent Deletion)
  const handleDeleteComment = (postId: string, commentId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this comment?')) return;
    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.filter((c) => c.id !== commentId),
          };
        }
        return p;
      });
      try {
        localStorage.setItem('phenol_timeline_posts', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // ==========================================================================
  // COURSE BUILDER & MANAGEMENT (CREATE, EDIT, DELETE COURSE & LESSONS)
  // ==========================================================================
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const trackObj = ACADEMIC_TRACKS.find((t) => t.id === newCourseCategory);
    const newCourse: ChemistryCourse = {
      id: `chem-${Date.now()}`,
      code: newCourseCode.trim() || `CHEM-${newCourseCategory.toUpperCase()}`,
      title: newCourseTitle,
      subTitle: newCourseSubtitle || 'Theoretical & Analytical Foundations',
      description: newCourseDesc || 'Curated chemistry curriculum directed by Dr. Omar Magdi.',
      category: newCourseCategory,
      categoryName: trackObj?.name || 'Academic Track',
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
    saveStoredCourses(updated);

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

  const handleUpdateCourse = (e: React.FormEvent) => {
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
    saveStoredCourses(updated);

    setIsEditCourseOpen(false);
    setEditingCourseId(null);
  };

  const handleDeleteCourse = (courseId: string, title: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`Are you sure you want to permanently delete course "${title}" and all its syllabus modules?`)) return;
    setCourses((prev) => {
      const updated = prev.filter((c) => c.id !== courseId);
      saveStoredCourses(updated);
      return updated;
    });
  };

  const handleAddLecture = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCourseId = newLectureCourse || (courses.length > 0 ? courses[0].id : '');
    if (!targetCourseId) {
      alert('يرجى اختيار الكورس أولاً');
      return;
    }
    if (!newLectureTitle.trim()) {
      alert('يرجى كتابة عنوان المحاضرة');
      return;
    }

    const newLesson: ChemistryLesson = {
      id: `les-${Date.now()}`,
      title: newLectureTitle.trim(),
      duration: newLectureDuration.trim() || '45 min',
      type: 'video',
      completed: false,
      videoUrl: newLectureVideoUrl.trim() || undefined,
      pdfNotesUrl: newLecturePdfUrl.trim() || undefined,
      pdfNotesName: newLecturePdfName.trim() || undefined,
      summary: newLectureSummary.trim() || 'محاضرة تأصيلية وشرح المفاهيم بإشراف د. عمر مجدي.',
      keyFormulas: newLectureFormula.trim() ? [newLectureFormula.trim()] : undefined,
      timestamps: [
        { timeSeconds: 0, timeLabel: '00:00', title: 'المقدمة وتأصيل المفاهيم' },
        { timeSeconds: 600, timeLabel: '10:00', title: 'ميكانزم التفاعل والأوربيتالات' },
        { timeSeconds: 1500, timeLabel: '25:00', title: 'تطبيقات عملية وأسئلة وزارية' },
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
    saveStoredCourses(updated);

    setIsAddLectureOpen(false);
    setNewLectureTitle('');
    setNewLectureVideoUrl('');
    setNewLecturePdfUrl('');
    setNewLecturePdfName('');
    setNewLectureSummary('');
    setNewLectureFormula('');
    setEnrollmentToast(`تمت إضافة محاضرة (${newLesson.title}) بنجاح`);
    setTimeout(() => setEnrollmentToast(null), 4000);
  };

  const handleOpenEditLesson = (courseId: string, lesson: ChemistryLesson) => {
    setEditingLessonCourseId(courseId);
    setEditingLessonId(lesson.id);
    setEditLessonTitle(lesson.title);
    setEditLessonDuration(lesson.duration);
    setEditLessonVideoUrl(lesson.videoUrl || '');
    setEditLessonPdfUrl(lesson.pdfNotesUrl || '');
    setEditLessonPdfName(lesson.pdfNotesName || '');
    setEditLessonSummary(lesson.summary);
    setEditLessonFormula(lesson.keyFormulas?.[0] || '');
    setIsEditLessonOpen(true);
  };

  const handleUpdateLesson = (e: React.FormEvent) => {
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
    saveStoredCourses(updated);

    setIsEditLessonOpen(false);
    setEditingLessonCourseId(null);
    setEditingLessonId(null);
  };

  const handleDeleteLesson = (courseId: string, lessonId: string, title: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`Remove module "${title}" from the syllabus?`)) return;
    setCourses((prev) => {
      const updated = prev.map((course) => {
        if (course.id === courseId) {
          return {
            ...course,
            lessons: course.lessons.filter((l) => l.id !== lessonId),
          };
        }
        return course;
      });
      saveStoredCourses(updated);
      return updated;
    });
  };

  // Permanent Delete Waitlist Application
  const handleDeleteWaitlist = (id: string, name: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`Are you sure you want to permanently delete application for "${name}"?`)) return;
    setWaitlist((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      try {
        localStorage.setItem('phenol_waitlist_applications', JSON.stringify(updated));
        const deletedIds: string[] = JSON.parse(localStorage.getItem('phenol_deleted_waitlist_ids') || '[]');
        if (!deletedIds.includes(id)) {
          deletedIds.push(id);
          localStorage.setItem('phenol_deleted_waitlist_ids', JSON.stringify(deletedIds));
        }
      } catch (e) {}
      return updated;
    });
  };

  // ==========================================================================
  // ADMISSIONS & WAITLIST ACTIONS
  // ==========================================================================
  const handleUpdateWaitlistStatus = (id: string, status: 'approved' | 'declined' | 'contacted') => {
    const updated = waitlist.map((app) => (app.id === id ? { ...app, status } : app));
    setWaitlist(updated);
    try {
      localStorage.setItem('phenol_waitlist_applications', JSON.stringify(updated));
    } catch (e) {}

    if (status === 'approved') {
      const targetApp = waitlist.find((a) => a.id === id);
      if (targetApp && !students.some((s) => s.email === targetApp.email)) {
        const newStudent: EnrolledStudent = {
          id: `st-${Date.now()}`,
          code: `PHN-2026-${Math.floor(100 + Math.random() * 900)}`,
          fullName: targetApp.fullName,
          email: targetApp.email,
          phone: targetApp.phone,
          trackCode: targetApp.targetCourse.split(' - ')[0] || targetApp.academicTrack,
          enrolledAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          progressPercent: 0,
          averageGrade: 100,
          status: 'active',
        };
        const updatedStudents = [newStudent, ...students];
        setStudents(updatedStudents);
        try {
          localStorage.setItem('phenol_students', JSON.stringify(updatedStudents));
        } catch (e) {}
      }
    }
  };

  const handleAddApplicant = (e: React.FormEvent) => {
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

    const updated = [newApp, ...waitlist];
    setWaitlist(updated);
    try {
      localStorage.setItem('phenol_waitlist_applications', JSON.stringify(updated));
    } catch (e) {}

    setIsAddApplicantOpen(false);
    setManualName('');
    setManualPhone('');
    setManualEmail('');
  };

  // Grading desk
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
    try {
      localStorage.setItem('phenol_submissions', JSON.stringify(updated));
    } catch (e) {}
    setGradingSubmission(null);
  };

  // Student Task Submit
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sub: StudentSubmission = {
      id: `sub-${Date.now()}`,
      studentName: currentUser?.name || 'Enrolled Student',
      studentCode: 'PHN-2026-LIVE',
      taskTitle: newTaskTitle,
      submittedAt: 'Just now',
      solutionNotes: newSolutionNotes,
      maxGrade: 20,
      status: 'pending',
    };
    const updated = [sub, ...submissions];
    setSubmissions(updated);
    try {
      localStorage.setItem('phenol_submissions', JSON.stringify(updated));
    } catch (e) {}
    setIsSubmitModalOpen(false);
    setNewSolutionNotes('');
  };

  // Quiz Answer Select
  const handleAnswerSelect = (qId: string, optIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  // Filtered views
  const displayedCourses = trackFilter === 'all'
    ? courses
    : courses.filter((c) => c.category === trackFilter);

  const displayedWaitlist = trackFilter === 'all'
    ? waitlist
    : waitlist.filter((w) => {
        const trackObj = ACADEMIC_TRACKS.find((t) => t.id === trackFilter);
        return w.academicTrack.includes(trackObj?.name || trackFilter);
      });

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100">
      {/* Editorial Masthead Navigation */}
      <header className="border-b border-hairline bg-ivory-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Context */}
            <div className="flex items-center gap-6">
              <Link href="/" aria-label="PHENOL Home">
                <PhenolLogo size={36} subtitle="Dr. Omar Magdi" />
              </Link>

              {isInstructor && (
                <div className="hidden md:flex items-center gap-2 pl-4 border-l border-hairline">
                  <span className="font-formula text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-burgundy-50 text-burgundy-500 border border-burgundy-200">
                    Administration Suite
                  </span>
                </div>
              )}
            </div>

            {/* User Profile & Mode Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Instructor Mode Switcher (Admin vs Student Preview) */}
              {isInstructor && (
                <button
                  onClick={() =>
                    setAdminViewMode(
                      adminViewMode === 'ADMIN' ? 'STUDENT_PREVIEW' : 'ADMIN'
                    )
                  }
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded border border-hairline hover:border-burgundy-500 bg-ivory-50 text-xs font-semibold text-charcoal-900 transition-colors"
                >
                  {adminViewMode === 'ADMIN' ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-burgundy-500" />
                      <span>Preview Student View</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-burgundy-500" />
                      <span>Back to Administration</span>
                    </>
                  )}
                </button>
              )}

              {/* Profile Card & Settings Trigger */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenProfileModal}
                  className="flex items-center gap-2.5 text-right p-1 rounded hover:bg-ivory-300/40 transition-colors group"
                  title="View & Edit Profile"
                >
                  <div className="hidden sm:block">
                    <span className="text-xs sm:text-sm font-bold text-charcoal-900 block leading-tight group-hover:text-burgundy-500 transition-colors">
                      {currentUser?.name || 'Dr. Omar Magdi'}
                    </span>
                    <span className="text-[11px] text-charcoal-100 font-sans block">
                      {currentUser?.title || (isInstructor ? 'Academic Director' : 'Enrolled Scholar')}
                    </span>
                  </div>

                  <div className="relative">
                    <img
                      src={
                        currentUser?.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
                      }
                      alt={currentUser?.name || 'User'}
                      className="w-9 h-9 rounded-full object-cover border border-hairline ring-2 ring-burgundy-500/20 group-hover:ring-burgundy-500/50 transition-all"
                    />
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

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* ========================================================= */}
        {/* VIEW 1: DR. OMAR MAGDI ACADEMIC ADMINISTRATION SUITE      */}
        {/* ========================================================= */}
        {showAdminInterface ? (
          <div className="space-y-8">
            {/* Real Executive Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Metric 1: Enrolled Scholars */}
              <div className="bg-ivory-100 border border-hairline rounded p-5 space-y-1.5 shadow-quiet">
                <div className="flex items-center justify-between text-charcoal-50">
                  <span className="text-xs font-semibold uppercase tracking-wider font-formula">
                    Enrolled Scholars
                  </span>
                  <Users className="w-4 h-4 text-burgundy-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-formula text-charcoal-900">
                  {students.length}
                </div>
                <span className="text-[11px] text-charcoal-100 font-sans block">
                  Active in Cohort 2026/2027
                </span>
              </div>

              {/* Metric 2: Waitlist Applications */}
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

              {/* Metric 3: Problem Sets */}
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

              {/* Metric 4: Academic Curricula */}
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
                  <span>Curriculum & Tracks</span>
                  <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
                    {courses.length}
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab('timeline')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    adminTab === 'timeline'
                      ? 'border-burgundy-500 text-burgundy-500'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <span>Academic Timeline</span>
                  <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-burgundy-50 text-burgundy-500 border border-burgundy-200">
                    {posts.length}
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
                    {students.length}
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

            {/* TAB 1: CURRICULUM & LESSONS MANAGER */}
            {adminTab === 'curriculum' && (
              <div className="space-y-6">
                {/* Header & Track Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-charcoal-900 font-display">
                      Chemistry Tracks & Course Syllabi
                    </h2>
                    <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                      Organized under Dr. Omar Magdi&apos;s 4 core educational tracks. Edit, delete, or build courses and lecture modules.
                    </p>
                  </div>

                  {/* Track filter pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setTrackFilter('all')}
                      className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                        trackFilter === 'all'
                          ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                          : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
                      }`}
                    >
                      All ({courses.length})
                    </button>
                    {ACADEMIC_TRACKS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTrackFilter(t.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                          trackFilter === t.id
                            ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                            : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Courses List */}
                <div className="space-y-6">
                  {displayedCourses.length === 0 ? (
                    <div className="border border-dashed border-hairline rounded-xl bg-ivory-100 p-12 text-center space-y-4 shadow-quiet">
                      <GraduationCap className="w-10 h-10 text-burgundy-500 mx-auto" />
                      <h3 className="text-base font-bold text-charcoal-900 font-display">
                        لا توجد كورسات في هذا التراك حالياً
                      </h3>
                      <p className="text-xs text-charcoal-100 font-sans max-w-md mx-auto">
                        تم تفريغ الكورسات الوهمية بنجاح. يمكنك إنشاء كورس حقيقي جديد في هذا التراك والبدء في رفع المحاضرات فوراً.
                      </p>
                      <div>
                        <button
                          type="button"
                          onClick={() => setIsCreateCourseOpen(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ إنشاء كورس جديد الآن</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    displayedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="border border-hairline rounded bg-ivory-100 p-6 space-y-4 shadow-quiet"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-hairline pb-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 px-2.5 py-0.5 rounded border border-burgundy-200">
                              {course.code}
                            </span>
                            <span className="text-xs font-semibold text-charcoal-900 bg-ivory-300 px-2 py-0.5 rounded border border-hairline">
                              {course.categoryName}
                            </span>
                            <span className="text-xs text-charcoal-50 font-sans">
                              {course.level}
                            </span>
                            {course.molecularFormula && (
                              <span className="font-formula text-xs text-charcoal-100 bg-ivory-200 px-2 py-0.5 rounded">
                                {course.molecularFormula}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-charcoal-900 font-display">
                            {course.title}
                          </h3>
                          <p className="text-xs text-charcoal-50 font-sans">
                            {course.subTitle}
                          </p>
                          <p className="text-xs text-charcoal-100 font-sans leading-relaxed pt-1 max-w-2xl">
                            {course.description}
                          </p>
                        </div>

                        {/* Course Controls: Students Roster, Edit & Delete */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCourseForStudents(course);
                              setIsCourseStudentsOpen(true);
                            }}
                            title="عرض قائمة الطلاب المشتركين وتتبع الأداء"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>الطلاب وتتبع الأداء</span>
                            {(() => {
                              const pending = enrollments.filter((e) => e.courseId === course.id && e.status === 'PENDING').length;
                              if (pending > 0) {
                                return (
                                  <span className="bg-amber-500 text-charcoal-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                    {pending} جديد
                                  </span>
                                );
                              }
                              const count = enrollments.filter((e) => e.courseId === course.id && e.status === 'ACTIVE').length;
                              return (
                                <span className="bg-burgundy-800 text-ivory-200 text-[10px] font-mono px-1.5 py-0.2 rounded">
                                  {count}
                                </span>
                              );
                            })()}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setNewLectureCourse(course.id);
                              setIsAddLectureOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
                            title="إضافة محاضرة لهذا الكورس"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ إضافة محاضرة</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditCourse(course)}
                            title="Edit Course Details"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-hairline hover:border-burgundy-500 text-charcoal-900 hover:text-burgundy-500 bg-ivory-50 text-xs font-semibold transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCourse(course.id, course.title)}
                            title="Delete Entire Course"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href={`/courses/${course.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-ivory-300 hover:bg-ivory-400 text-xs font-semibold text-charcoal-900 transition-colors"
                          >
                            <span>Live View</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Lessons List in Course */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-formula text-charcoal-50">
                          <span>Modules & Lectures ({course.lessons.length})</span>
                          <span>{course.totalHours}</span>
                        </div>

                        {course.lessons.length > 0 ? (
                          <div className="divide-y divide-hairline border-t border-hairline">
                            {course.lessons.map((lesson, idx) => (
                              <div
                                key={lesson.id}
                                className="py-3 flex items-center justify-between text-xs font-sans hover:bg-ivory-200 px-2 rounded transition-colors gap-3"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="font-formula font-bold text-charcoal-50 w-6 pt-0.5">
                                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-charcoal-900 block">
                                        {lesson.title}
                                      </span>
                                      {lesson.keyFormulas && lesson.keyFormulas.length > 0 && (
                                        <span className="font-formula text-[10px] text-burgundy-500 bg-burgundy-50 px-1.5 py-0.2 rounded border border-burgundy-200">
                                          {lesson.keyFormulas[0]}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-charcoal-50 text-[11px] block mt-0.5">
                                      {lesson.summary}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-formula text-charcoal-50 mr-2">
                                    {lesson.duration}
                                  </span>

                                  {/* Edit Lesson */}
                                  <button
                                    onClick={() => handleOpenEditLesson(course.id, lesson)}
                                    title="Edit Module"
                                    className="p-1.5 rounded hover:bg-ivory-300 text-charcoal-50 hover:text-charcoal-900 transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Lesson */}
                                  <button
                                    onClick={() => handleDeleteLesson(course.id, lesson.id, lesson.title)}
                                    title="Delete Module"
                                    className="p-1.5 rounded hover:bg-rose-50 text-charcoal-50 hover:text-rose-700 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-xs text-charcoal-100 border border-dashed border-hairline rounded bg-ivory-50 space-y-2">
                            <p className="font-medium">لا توجد محاضرات مضافة في هذا الكورس بعد.</p>
                            <div>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewLectureCourse(course.id);
                                  setIsAddLectureOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>إضافة أول محاضرة لهذا الكورس الآن</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )))}
                </div>
              </div>
            )}

            {/* TAB 2: ACADEMIC TIMELINE & COMMUNITY */}
            {adminTab === 'timeline' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="border-b border-hairline pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-charcoal-900 font-display">
                      Academic Timeline & Discussion Feed
                    </h2>
                    <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                      Publish announcements, dissect chemical mechanisms with scholars, and moderate comments.
                    </p>
                  </div>
                  <span className="font-formula text-xs text-burgundy-500 font-bold bg-burgundy-50 px-2.5 py-1 rounded border border-burgundy-200">
                    Admin Moderation Enabled
                  </span>
                </div>

                {/* New Post Composer */}
                <form onSubmit={handleCreatePost} className="border border-hairline rounded bg-ivory-100 p-5 space-y-4 shadow-quiet">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover border border-hairline"
                    />
                    <div>
                      <span className="text-xs font-bold text-charcoal-900 block">
                        {currentUser?.name || 'Dr. Omar Magdi'}
                      </span>
                      <span className="text-[10px] font-formula text-burgundy-500 font-semibold uppercase">
                        {currentUser?.title || 'Instructor / Academic Director'}
                      </span>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    required
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share an academic insight, reaction mechanism challenge, or cohort announcement..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500 leading-relaxed"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <input
                        type="text"
                        value={newPostFormula}
                        onChange={(e) => setNewPostFormula(e.target.value)}
                        placeholder="Key Formula / Equation (e.g. C₆H₅OH + NaOH ⇌ ...)"
                        className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-formula text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                      />
                    </div>
                    <div>
                      <select
                        value={newPostTrack}
                        onChange={(e) => setNewPostTrack(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                      >
                        <option value="General Announcement">General Academic Announcement</option>
                        <option value="Thanaweya Amma (Arabic)">Thanaweya Amma (Arabic)</option>
                        <option value="Thanaweya Amma (Languages)">Thanaweya Amma (Languages)</option>
                        <option value="IGCSE & A-Level / STEM">IGCSE & A-Level / STEM</option>
                        <option value="University Chemistry">University Chemistry</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish to Timeline</span>
                    </button>
                  </div>
                </form>

                {/* Posts Feed */}
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="border border-hairline rounded bg-ivory-100 p-6 space-y-4 shadow-quiet"
                    >
                      {/* Post Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={post.authorAvatar}
                            alt={post.authorName}
                            className="w-10 h-10 rounded-full object-cover border border-hairline"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-charcoal-900">
                                {post.authorName}
                              </span>
                              {post.authorRole === 'INSTRUCTOR' ? (
                                <span className="font-formula text-[10px] font-bold text-burgundy-500 bg-burgundy-50 px-2 py-0.2 rounded border border-burgundy-200">
                                  INSTRUCTOR
                                </span>
                              ) : (
                                <span className="font-formula text-[10px] font-semibold text-charcoal-100 bg-ivory-300 px-2 py-0.2 rounded">
                                  SCHOLAR
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-formula text-charcoal-50 mt-0.5">
                              <span>{post.createdAt}</span>
                              {post.trackBadge && (
                                <>
                                  <span>•</span>
                                  <span className="text-burgundy-500 font-medium">
                                    {post.trackBadge}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Moderation: Delete Post */}
                        {isInstructor && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title="Delete Post (Admin Moderation)"
                            className="p-1.5 rounded hover:bg-rose-50 text-charcoal-50 hover:text-rose-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Post Content */}
                      <div className="space-y-2.5 pt-1">
                        <p className="text-xs sm:text-sm text-charcoal-900 leading-relaxed font-sans">
                          {post.content}
                        </p>

                        {post.molecularFormula && (
                          <div className="font-formula text-xs text-charcoal-900 bg-ivory-200 px-3 py-1.5 rounded border border-hairline inline-block">
                            {post.molecularFormula}
                          </div>
                        )}
                      </div>

                      {/* Reaction Buttons */}
                      <div className="pt-3 border-t border-hairline flex items-center gap-4 text-xs font-formula">
                        <button
                          onClick={() => handleToggleReaction(post.id, 'flask')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                            post.myReactions?.flask
                              ? 'bg-burgundy-50 text-burgundy-600 font-bold border border-burgundy-200'
                              : 'hover:bg-ivory-200 text-charcoal-100'
                          }`}
                        >
                          <FlaskConical className="w-3.5 h-3.5 text-burgundy-500" />
                          <span>{post.reactions.flask} Mastery</span>
                        </button>

                        <button
                          onClick={() => handleToggleReaction(post.id, 'bulb')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                            post.myReactions?.bulb
                              ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200'
                              : 'hover:bg-ivory-200 text-charcoal-100'
                          }`}
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          <span>{post.reactions.bulb} Insight</span>
                        </button>

                        <button
                          onClick={() => handleToggleReaction(post.id, 'heart')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                            post.myReactions?.heart
                              ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                              : 'hover:bg-ivory-200 text-charcoal-100'
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5 text-rose-600" />
                          <span>{post.reactions.heart} Resonance</span>
                        </button>
                      </div>

                      {/* Comments Thread */}
                      <div className="space-y-3 pt-2">
                        {post.comments.length > 0 && (
                          <div className="space-y-2.5 bg-ivory-50 p-4 rounded border border-hairline">
                            {post.comments.map((comm) => (
                              <div key={comm.id} className="flex items-start justify-between gap-2 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-charcoal-900">
                                      {comm.authorName}
                                    </span>
                                    {comm.authorRole === 'INSTRUCTOR' && (
                                      <span className="font-formula text-[9px] font-bold text-burgundy-500 bg-burgundy-50 px-1.5 py-0.1 rounded border border-burgundy-200">
                                        Dr. Omar Magdi
                                      </span>
                                    )}
                                    <span className="font-formula text-[10px] text-charcoal-50">
                                      {comm.createdAt}
                                    </span>
                                  </div>
                                  <p className="text-charcoal-100 font-sans leading-relaxed">
                                    {comm.content}
                                  </p>
                                </div>

                                {isInstructor && (
                                  <button
                                    onClick={() => handleDeleteComment(post.id, comm.id)}
                                    title="Delete Comment (Admin)"
                                    className="p-1 text-charcoal-50 hover:text-rose-700 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Comment Box */}
                        <form
                          onSubmit={(e) => handleAddComment(post.id, e)}
                          className="flex items-center gap-2 pt-1"
                        >
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            placeholder="Write an academic response or question..."
                            className="flex-1 px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet transition-colors"
                          >
                            Reply
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: ADMISSIONS & WAITLIST MANAGEMENT */}
            {adminTab === 'waitlist' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-charcoal-900 font-display">
                      Prospective Student Applications (2026/2027 Cohort)
                    </h2>
                    <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                      Direct admissions submitted via the landing page. Approve placements or contact applicants directly via WhatsApp.
                    </p>
                  </div>

                  {/* Track filter pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setTrackFilter('all')}
                      className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                        trackFilter === 'all'
                          ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                          : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
                      }`}
                    >
                      All ({waitlist.length})
                    </button>
                    {ACADEMIC_TRACKS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTrackFilter(t.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                          trackFilter === t.id
                            ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                            : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {displayedWaitlist.length > 0 ? (
                  <div className="border border-hairline rounded bg-ivory-100 overflow-hidden shadow-quiet">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-hairline bg-ivory-200/80 text-[11px] font-formula uppercase tracking-wider text-charcoal-50">
                            <th className="py-3 px-4">Applicant</th>
                            <th className="py-3 px-4">Contact (WhatsApp)</th>
                            <th className="py-3 px-4">Academic Track</th>
                            <th className="py-3 px-4">Target Course</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline text-xs font-sans">
                          {displayedWaitlist.map((app) => {
                            const waCleanPhone = app.phone.replace(/[^0-9]/g, '');
                            const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(
                              `Hello ${app.fullName}, this is Dr. Omar Magdi's academic office regarding your application for ${app.academicTrack} at PHENOL.`
                            )}`;

                            return (
                              <tr key={app.id} className="hover:bg-ivory-300/30 transition-colors">
                                <td className="py-3.5 px-4 font-semibold text-charcoal-900">
                                  {app.fullName}
                                  <span className="block text-[11px] text-charcoal-50 font-normal">
                                    {app.email}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-formula text-charcoal-900">
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-semibold"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>{app.phone}</span>
                                  </a>
                                </td>
                                <td className="py-3.5 px-4 text-charcoal-900 font-medium">
                                  {app.academicTrack}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-formula font-semibold text-burgundy-500 bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200 text-[11px]">
                                    {app.targetCourse.split(' - ')[0]}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-formula text-charcoal-50">
                                  {app.appliedAt}
                                </td>
                                <td className="py-3.5 px-4">
                                  {app.status === 'pending' && (
                                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                                      Under Review
                                    </span>
                                  )}
                                  {app.status === 'approved' && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                                      Enrolled
                                    </span>
                                  )}
                                  {app.status === 'contacted' && (
                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                                      Contacted
                                    </span>
                                  )}
                                  {app.status === 'declined' && (
                                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold">
                                      Declined
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Open WhatsApp chat"
                                      className="p-1.5 rounded hover:bg-emerald-50 text-emerald-700 border border-transparent hover:border-emerald-200 transition-colors"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </a>

                                    {app.status !== 'approved' && (
                                      <button
                                        onClick={() => handleUpdateWaitlistStatus(app.id, 'approved')}
                                        title="Approve & Enroll"
                                        className="p-1.5 rounded hover:bg-emerald-50 text-emerald-700 border border-transparent hover:border-emerald-200 transition-colors"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {app.status !== 'declined' && (
                                      <button
                                        onClick={() => handleUpdateWaitlistStatus(app.id, 'declined')}
                                        title="Decline Application"
                                        className="p-1.5 rounded hover:bg-rose-50 text-rose-700 border border-transparent hover:border-rose-200 transition-colors"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleDeleteWaitlist(app.id, app.fullName)}
                                      title="Permanently Delete Application"
                                      className="p-1.5 rounded hover:bg-rose-100 text-rose-800 border border-rose-200 hover:border-rose-300 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-hairline rounded bg-ivory-100 p-12 text-center space-y-3">
                    <GraduationCap className="w-10 h-10 text-charcoal-50 mx-auto" />
                    <h3 className="text-base font-bold text-charcoal-900 font-display">
                      No Waitlist Applications in this View
                    </h3>
                    <p className="text-xs text-charcoal-100 font-sans max-w-md mx-auto">
                      Applications submitted via the public landing page admission form will immediately appear here. You can also manually register walk-in students.
                    </p>
                    <button
                      onClick={() => setIsAddApplicantOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register Walk-in Applicant</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: GRADING DESK (SUBMISSIONS) */}
            {adminTab === 'submissions' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-charcoal-900 font-display">
                    Student Problem Set Submissions
                  </h2>
                  <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                    Evaluate student mechanistic drawings, thermodynamic derivations, and provide personalized scientific critique.
                  </p>
                </div>

                {submissions.length > 0 ? (
                  <div className="space-y-4">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="border border-hairline rounded bg-ivory-100 p-6 space-y-4 shadow-quiet"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3">
                          <div>
                            <span className="font-formula text-xs font-bold text-burgundy-500">
                              {sub.studentCode}
                            </span>
                            <h3 className="text-base font-bold text-charcoal-900 font-display">
                              {sub.studentName} — {sub.taskTitle}
                            </h3>
                            <span className="text-xs text-charcoal-50 font-sans">
                              Submitted {sub.submittedAt}
                            </span>
                          </div>

                          <div>
                            {sub.status === 'graded' ? (
                              <span className="font-formula font-bold text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Grade: {sub.grade} / {sub.maxGrade}
                              </span>
                            ) : (
                              <span className="font-formula font-semibold text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                Awaiting Grade
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Student Solution Notes */}
                        <div className="space-y-1 bg-ivory-200 p-3.5 rounded text-xs leading-relaxed">
                          <span className="font-semibold text-charcoal-900 block font-sans">
                            Student Solution Summary:
                          </span>
                          <p className="text-charcoal-100 font-sans">
                            {sub.solutionNotes}
                          </p>
                        </div>

                        {/* Instructor Feedback if Graded */}
                        {sub.drFeedback && (
                          <div className="bg-burgundy-50/70 border-l-2 border-burgundy-500 p-3 rounded-r text-xs leading-relaxed">
                            <span className="font-bold text-burgundy-900 block font-sans">
                              Dr. Omar Magdi Feedback:
                            </span>
                            <p className="text-burgundy-950 font-sans mt-0.5">
                              {sub.drFeedback}
                            </p>
                          </div>
                        )}

                        {/* Grading Action */}
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => {
                              setGradingSubmission(sub);
                              setInputGrade(sub.grade || 20);
                              setInputFeedback(sub.drFeedback || '');
                            }}
                            className="px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet inline-flex items-center gap-1.5"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>{sub.status === 'graded' ? 'Edit Grade & Critique' : 'Grade Problem Set'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-hairline rounded bg-ivory-100 p-12 text-center space-y-3">
                    <FileCheck2 className="w-10 h-10 text-charcoal-50 mx-auto" />
                    <h3 className="text-base font-bold text-charcoal-900 font-display">
                      Grading Desk is Clear
                    </h3>
                    <p className="text-xs text-charcoal-100 font-sans max-w-md mx-auto">
                      No student problem sets are currently awaiting review. When scholars submit derivations in their portal, they will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: COHORT STUDENT ROSTER & COURSE ACTIVATIONS */}
            {adminTab === 'roster' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-charcoal-900 font-display">
                      Enrolled Student Cohort Roster & Performance (2026/2027)
                    </h2>
                    <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                      Official directory of scholars, course activation requests, and academic performance telemetry under Dr. Omar Magdi.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Forensic Code Search Input */}
                    <div className="w-full sm:w-72 relative">
                      <Search className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={rosterSearchQuery}
                        onChange={(e) => setRosterSearchQuery(e.target.value)}
                        placeholder="Search by Code (PH-XXXX), name, or phone..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-100 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500 shadow-quiet"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsManualAddStudentModalOpen(true)}
                      className="px-3.5 py-2 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-quiet flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة طالب يدوياً</span>
                    </button>
                  </div>
                </div>

                {/* Section 1: PENDING COURSE ACTIVATION REQUESTS DESK */}
                {(() => {
                  const pendingRequests = enrollments.filter((e) => e.status === 'PENDING');
                  return (
                    <div className="p-5 bg-white rounded-xl border border-hairline shadow-quiet space-y-4">
                      <div className="flex items-center justify-between border-b border-hairline pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                          <h3 className="text-sm font-bold text-charcoal-900 font-display">
                            طلبات تفعيل الكورسات الجديدة (Course Activation Requests)
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {pendingRequests.length} طلبات بانتظار الاعتماد
                        </span>
                      </div>

                      {pendingRequests.length === 0 ? (
                        <div className="p-4 text-center text-xs text-charcoal-100 bg-ivory-50 rounded-lg border border-hairline">
                          لا توجد طلبات تفعيل معلقة حالياً. جميع طلبات اشتراك الطلاب مفعلة ومكتملة.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {pendingRequests.map((req) => {
                            const cleanPhone = req.studentPhone.replace(/[^0-9]/g, '');
                            const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                              `أهلاً بك يا ${req.studentName} في أكاديمية PHENOL. تم استلام طلب تفعيل مادة (${req.courseTitle}):`
                            )}`;

                            return (
                              <div
                                key={req.id}
                                className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-bold text-charcoal-900 font-sans">
                                        {req.studentName}
                                      </h4>
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-burgundy-50 text-burgundy-900 border border-burgundy-200">
                                        {req.studentCode}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-charcoal-100 font-mono mt-0.5">
                                      {req.studentPhone} • {req.studentTrack}
                                    </p>
                                  </div>
                                  <span className="text-[10px] font-mono text-charcoal-50">
                                    {req.requestedAt}
                                  </span>
                                </div>

                                <div className="p-2 rounded bg-white border border-hairline text-xs font-sans">
                                  <span className="text-[10px] font-mono text-burgundy-900 font-bold block">
                                    المادة المطلوبة: {req.courseCode}
                                  </span>
                                  <span className="font-semibold text-charcoal-900 text-xs truncate block">
                                    {req.courseTitle}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors"
                                  >
                                    <WhatsAppIcon className="w-3.5 h-3.5" />
                                    <span>محادثة واتساب</span>
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => handleApproveEnrollment(req.id)}
                                    className="px-4 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>تفعيل الكورس فوراً</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Forensic Watermark Identification Guide */}
                <div className="p-3.5 bg-ivory-300/60 border border-hairline rounded text-xs space-y-1">
                  <span className="font-semibold text-charcoal-900 flex items-center gap-1.5 font-formula">
                    <ShieldCheck className="w-3.5 h-3.5 text-burgundy-500" />
                    <span>Forensic Leak Detection Guide (كشف تسريبات الفيديو):</span>
                  </span>
                  <p className="text-[11px] text-charcoal-100 leading-relaxed font-sans">
                    Every enrolled student has a unique Academic Security Code blended into their video stream (e.g. <code className="text-burgundy-500 font-bold">PH-4821-Y</code>). If an unauthorized video is leaked on social media or Telegram, search the code appearing in the video above to immediately pinpoint the student identity and phone number.
                  </p>
                </div>

                {/* Section 2: COMPREHENSIVE STUDENT PERFORMANCE DIRECTORY */}
                {(() => {
                  const studentDirectory = getAggregatedStudentsDirectory();
                  const filteredStudents = studentDirectory.filter((st) => {
                    if (!rosterSearchQuery.trim()) return true;
                    const q = rosterSearchQuery.trim().toLowerCase();
                    return (
                      st.name.toLowerCase().includes(q) ||
                      st.code.toLowerCase().includes(q) ||
                      st.email.toLowerCase().includes(q) ||
                      st.phone.includes(q)
                    );
                  });

                  return filteredStudents.length > 0 ? (
                    <div className="border border-hairline rounded bg-ivory-100 overflow-hidden shadow-quiet">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-hairline bg-ivory-200/80 text-[11px] font-formula uppercase tracking-wider text-charcoal-50">
                              <th className="py-3 px-4">Forensic Code</th>
                              <th className="py-3 px-4">Scholar Name</th>
                              <th className="py-3 px-4">WhatsApp Contact</th>
                              <th className="py-3 px-4">Track</th>
                              <th className="py-3 px-4">Active Courses</th>
                              <th className="py-3 px-4">Syllabus Progress</th>
                              <th className="py-3 px-4">Quiz Avg</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-hairline text-xs font-sans">
                            {filteredStudents.map((st) => {
                              const cleanPhone = st.phone.replace(/[^0-9]/g, '');
                              const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                `أهلاً بك يا ${st.name} في أكاديمية PHENOL مع د. عمر مجدي. بخصوص متابعة أدائك الأكاديمي:`
                              )}`;

                              return (
                                <tr key={st.email} className="hover:bg-ivory-300/30 transition-colors">
                                  <td className="py-3.5 px-4 font-mono font-bold text-burgundy-600">
                                    <span className="bg-burgundy-50 border border-burgundy-200 px-2 py-0.5 rounded">
                                      {st.code}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-charcoal-900">
                                    <div className="flex items-center gap-2">
                                      <span>{st.name}</span>
                                    </div>
                                    <span className="text-[11px] text-charcoal-50 font-mono block font-normal">
                                      {st.email}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-charcoal-100 font-mono text-[11px]">
                                    <a
                                      href={waLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-semibold"
                                      title="Open WhatsApp Chat"
                                    >
                                      <WhatsAppIcon className="w-3.5 h-3.5" />
                                      <span>{st.phone}</span>
                                    </a>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="font-formula font-bold text-burgundy-500">
                                      {st.track}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    {st.activeCoursesCount > 0 ? (
                                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-semibold text-xs border border-emerald-200">
                                        {st.activeCoursesCount} مواد مفعلة
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-mono text-[11px] border border-amber-200">
                                        في انتظار تفعيل كورس
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="w-28 space-y-1">
                                      <div className="flex items-center justify-between text-[10px] font-mono">
                                        <span>{st.overallProgressPercent}%</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-ivory-300 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-burgundy-900 rounded-full"
                                          style={{ width: `${st.overallProgressPercent}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 text-xs">
                                    {st.averageQuizGrade > 0 ? `${st.averageQuizGrade} / 20` : '—'}
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDirectEnrollStudent(st);
                                          setSelectedCourseIdToEnroll(courses[0]?.id || '');
                                          setIsDirectEnrollModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                                        title="تفعيل كورس لهذا الطالب"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>تفعيل كورس</span>
                                      </button>

                                      <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] hover:bg-emerald-100 font-semibold transition-colors"
                                        title="محادثة واتساب"
                                      >
                                        <WhatsAppIcon className="w-3 h-3" />
                                        <span>تواصل</span>
                                      </a>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-hairline rounded bg-ivory-100 p-12 text-center space-y-3">
                      <Users className="w-10 h-10 text-charcoal-50 mx-auto" />
                      <h3 className="text-base font-bold text-charcoal-900 font-display">
                        {rosterSearchQuery ? 'No Scholars Match this Code or Query' : 'No Enrolled Students Yet'}
                      </h3>
                      <p className="text-xs text-charcoal-100 font-sans max-w-md mx-auto">
                        {rosterSearchQuery
                          ? 'Try searching with partial numbers or student name.'
                          : 'Students requesting courses or enrolled in cohorts will automatically appear in this telemetry directory.'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: STUDENT PORTAL (OR PREVIEW MODE)                   */
          /* ========================================================= */
          <div className="space-y-8">
            {/* Student Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-6">
              <div>
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block mb-1">
                  PHENOL SCHOLAR PORTAL
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
                  Welcome, {currentUser?.name || 'Scholar'}
                </h1>
                <p className="text-xs sm:text-sm text-charcoal-100 font-sans mt-1">
                  Academic Chemistry under the supervision of <strong className="text-charcoal-900">Dr. Omar Magdi</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Submit Problem Set</span>
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
                Curriculum Tracks ({courses.length})
              </button>

              <button
                onClick={() => setStudentTab('timeline')}
                className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  studentTab === 'timeline'
                    ? 'border-burgundy-500 text-burgundy-500'
                    : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                }`}
              >
                <span>Academic Timeline</span>
                <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-burgundy-50 text-burgundy-500 border border-burgundy-200">
                  {posts.length}
                </span>
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
              <div className="space-y-6">
                {/* Track Filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setTrackFilter('all')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                      trackFilter === 'all'
                        ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                        : 'bg-ivory-100 text-charcoal-100 border border-hairline'
                    }`}
                  >
                    All Tracks
                  </button>
                  {ACADEMIC_TRACKS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTrackFilter(t.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                        trackFilter === t.id
                          ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                          : 'bg-ivory-100 text-charcoal-100 border border-hairline'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>

                {/* Course Activation Toast Banner */}
                {enrollmentToast && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{enrollmentToast}</span>
                    </div>
                    <button
                      onClick={() => setEnrollmentToast(null)}
                      className="text-emerald-800 hover:text-emerald-950 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayedCourses.map((course) => {
                    const access = checkUserCourseAccess(currentUser, course.id);
                    return (
                      <div
                        key={course.id}
                        className="border border-hairline rounded bg-ivory-100 p-6 space-y-4 hover:border-charcoal-100/50 transition-colors flex flex-col justify-between shadow-quiet"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                              {course.code}
                            </span>
                            {access.status === 'ACTIVE' ? (
                              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>مفعل (Active Access)</span>
                              </span>
                            ) : access.status === 'PENDING' ? (
                              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>قيد المراجعة والاعتماد</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-charcoal-100 bg-ivory-200 border border-hairline px-2.5 py-0.5 rounded flex items-center gap-1">
                                <Lock className="w-3 h-3 text-charcoal-50" />
                                <span>يتطلب التفعيل</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-charcoal-900 font-display">
                            {course.title}
                          </h3>

                          <p className="text-xs text-charcoal-100 leading-relaxed font-sans">
                            {course.subTitle}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-hairline flex items-center justify-between gap-2">
                          <span className="font-formula text-xs text-charcoal-50">
                            {course.lessons.length} Modules • {course.totalHours}
                          </span>

                          {access.status === 'ACTIVE' ? (
                            <Link
                              href={`/courses/${course.id}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
                            >
                              <span>Enter Course</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : access.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-100 text-amber-900 text-xs font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              <span>طلب التفعيل قيد الانتظار</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRequestCourse(course)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>طلب تفعيل الكورس</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STUDENT TAB 2: TIMELINE */}
            {studentTab === 'timeline' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="border-b border-hairline pb-4">
                  <h2 className="text-xl font-bold text-charcoal-900 font-display">
                    Academic Community Feed
                  </h2>
                  <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                    Engage in conceptual discussions with Dr. Omar Magdi and fellow scholars across all 4 cohorts.
                  </p>
                </div>

                {/* Student New Question / Post */}
                <form onSubmit={handleCreatePost} className="border border-hairline rounded bg-ivory-100 p-5 space-y-4 shadow-quiet">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover border border-hairline"
                    />
                    <div>
                      <span className="text-xs font-bold text-charcoal-900 block">
                        {currentUser?.name || 'Scholar'}
                      </span>
                      <span className="text-[10px] font-formula text-charcoal-50 uppercase">
                        Ask a Conceptual Chemistry Question
                      </span>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    required
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Ask a question about electron pushing, reaction mechanisms, or equilibrium..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500 leading-relaxed"
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Question</span>
                    </button>
                  </div>
                </form>

                {/* Posts Feed for Student */}
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="border border-hairline rounded bg-ivory-100 p-6 space-y-4 shadow-quiet"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={post.authorAvatar}
                            alt={post.authorName}
                            className="w-10 h-10 rounded-full object-cover border border-hairline"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-charcoal-900">
                                {post.authorName}
                              </span>
                              {post.authorRole === 'INSTRUCTOR' ? (
                                <span className="font-formula text-[10px] font-bold text-burgundy-500 bg-burgundy-50 px-2 py-0.2 rounded border border-burgundy-200">
                                  INSTRUCTOR
                                </span>
                              ) : (
                                <span className="font-formula text-[10px] font-semibold text-charcoal-100 bg-ivory-300 px-2 py-0.2 rounded">
                                  SCHOLAR
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-formula text-charcoal-50 block mt-0.5">
                              {post.createdAt} {post.trackBadge && `• ${post.trackBadge}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-charcoal-900 leading-relaxed font-sans">
                        {post.content}
                      </p>

                      {post.molecularFormula && (
                        <div className="font-formula text-xs text-charcoal-900 bg-ivory-200 px-3 py-1.5 rounded border border-hairline inline-block">
                          {post.molecularFormula}
                        </div>
                      )}

                      {/* Reaction Buttons */}
                      <div className="pt-3 border-t border-hairline flex items-center gap-4 text-xs font-formula">
                        <button
                          onClick={() => handleToggleReaction(post.id, 'flask')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                            post.myReactions?.flask
                              ? 'bg-burgundy-50 text-burgundy-600 font-bold border border-burgundy-200'
                              : 'hover:bg-ivory-200 text-charcoal-100'
                          }`}
                        >
                          <FlaskConical className="w-3.5 h-3.5 text-burgundy-500" />
                          <span>{post.reactions.flask} Mastery</span>
                        </button>

                        <button
                          onClick={() => handleToggleReaction(post.id, 'bulb')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                            post.myReactions?.bulb
                              ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200'
                              : 'hover:bg-ivory-200 text-charcoal-100'
                          }`}
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          <span>{post.reactions.bulb} Insight</span>
                        </button>

                        <button
                          onClick={() => handleToggleReaction(post.id, 'heart')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                            post.myReactions?.heart
                              ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                              : 'hover:bg-ivory-200 text-charcoal-100'
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5 text-rose-600" />
                          <span>{post.reactions.heart} Resonance</span>
                        </button>
                      </div>

                      {/* Comments Thread */}
                      <div className="space-y-3 pt-2">
                        {post.comments.length > 0 && (
                          <div className="space-y-2.5 bg-ivory-50 p-4 rounded border border-hairline">
                            {post.comments.map((comm) => (
                              <div key={comm.id} className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-charcoal-900">
                                    {comm.authorName}
                                  </span>
                                  {comm.authorRole === 'INSTRUCTOR' && (
                                    <span className="font-formula text-[9px] font-bold text-burgundy-500 bg-burgundy-50 px-1.5 py-0.1 rounded border border-burgundy-200">
                                      Dr. Omar Magdi
                                    </span>
                                  )}
                                  <span className="font-formula text-[10px] text-charcoal-50">
                                    {comm.createdAt}
                                  </span>
                                </div>
                                <p className="text-charcoal-100 font-sans leading-relaxed">
                                  {comm.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Comment Box */}
                        <form
                          onSubmit={(e) => handleAddComment(post.id, e)}
                          className="flex items-center gap-2 pt-1"
                        >
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            placeholder="Write a comment..."
                            className="flex-1 px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet transition-colors"
                          >
                            Reply
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STUDENT TAB 3: TASKS */}
            {studentTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-charcoal-900 font-display">
                    My Problem Set Submissions
                  </h2>
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="text-xs font-semibold text-burgundy-500 hover:underline"
                  >
                    + Submit New Task
                  </button>
                </div>

                {submissions.length > 0 ? (
                  <div className="space-y-4">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="border border-hairline rounded bg-ivory-100 p-5 space-y-3 shadow-quiet"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-charcoal-900 font-sans">
                            {sub.taskTitle}
                          </h3>
                          {sub.status === 'graded' ? (
                            <span className="font-formula font-bold text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Grade: {sub.grade} / {sub.maxGrade}
                            </span>
                          ) : (
                            <span className="font-formula font-semibold text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Pending Review
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-charcoal-100 font-sans bg-ivory-200 p-3 rounded leading-relaxed">
                          {sub.solutionNotes}
                        </p>

                        {sub.drFeedback && (
                          <div className="bg-burgundy-50/70 border-l-2 border-burgundy-500 p-3 rounded-r text-xs leading-relaxed">
                            <span className="font-bold text-burgundy-900 block font-sans">
                              Dr. Omar Magdi Feedback:
                            </span>
                            <p className="text-burgundy-950 font-sans mt-0.5">
                              {sub.drFeedback}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-hairline rounded bg-ivory-100 p-10 text-center space-y-2">
                    <p className="text-xs text-charcoal-100 font-sans">
                      You haven&apos;t submitted any problem sets yet.
                    </p>
                    <button
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Submit Your First Task</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STUDENT TAB 4: BOOKLETS */}
            {studentTab === 'booklets' && (
              <BookletsView booklets={BOOKLETS} />
            )}

            {/* STUDENT TAB 5: QUIZZES */}
            {studentTab === 'quizzes' && (
              <div className="space-y-6">
                {!activeQuiz ? (
                  <div className="space-y-4">
                    {CHEMISTRY_QUIZZES.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="border border-hairline rounded bg-ivory-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-quiet"
                      >
                        <div className="space-y-1">
                          <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                            {quiz.badge}
                          </span>
                          <h3 className="text-base font-bold text-charcoal-900 font-display">
                            {quiz.title}
                          </h3>
                          <span className="text-xs text-charcoal-50 font-sans block">
                            {quiz.courseTitle} • {quiz.questions.length} Analytical Questions • {quiz.durationMinutes} Minutes
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setActiveQuiz(quiz);
                            setSelectedAnswers({});
                            setQuizSubmitted(false);
                          }}
                          className="px-5 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet"
                        >
                          Start Diagnostic Quiz
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-hairline rounded bg-ivory-100 p-6 sm:p-8 space-y-6 shadow-quiet">
                    <div className="flex items-center justify-between border-b border-hairline pb-4">
                      <div>
                        <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                          DIAGNOSTIC ASSESSMENT
                        </span>
                        <h2 className="text-lg font-bold text-charcoal-900 font-display">
                          {activeQuiz.title}
                        </h2>
                      </div>
                      <button
                        onClick={() => setActiveQuiz(null)}
                        className="text-xs font-semibold text-charcoal-50 hover:text-charcoal-900"
                      >
                        Exit Quiz
                      </button>
                    </div>

                    <div className="space-y-8">
                      {activeQuiz.questions.map((q: any, qIdx: number) => {
                        const isCorrect = selectedAnswers[q.id] === q.correctIndex;

                        return (
                          <div key={q.id} className="space-y-3">
                            <div className="flex items-start gap-2">
                              <span className="font-formula text-xs font-bold text-burgundy-500 pt-0.5">
                                Q{qIdx + 1}.
                              </span>
                              <h3 className="text-sm font-semibold text-charcoal-900 font-sans leading-relaxed">
                                {q.question}
                              </h3>
                            </div>

                            {q.molecularSnippet && (
                              <div className="ml-5 font-formula text-xs text-burgundy-500 bg-ivory-200 px-3 py-1.5 rounded inline-block">
                                {q.molecularSnippet}
                              </div>
                            )}

                            <div className="ml-5 space-y-2 pt-1">
                              {q.options.map((opt: string, optIdx: number) => {
                                const selected = selectedAnswers[q.id] === optIdx;
                                let borderClass = 'border-hairline hover:border-charcoal-100';

                                if (quizSubmitted) {
                                  if (optIdx === q.correctIndex) {
                                    borderClass = 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold';
                                  } else if (selected && !isCorrect) {
                                    borderClass = 'border-burgundy-500 bg-burgundy-50/50 text-burgundy-900';
                                  }
                                } else if (selected) {
                                  borderClass = 'border-burgundy-500 bg-burgundy-50/30 text-burgundy-900 font-semibold';
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    onClick={() => handleAnswerSelect(q.id, optIdx)}
                                    className={`w-full text-left p-3 rounded border text-xs font-sans transition-colors ${borderClass}`}
                                  >
                                    <span className="font-formula font-bold mr-2">
                                      {String.fromCharCode(65 + optIdx)}.
                                    </span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            {quizSubmitted && (
                              <div className="ml-5 p-3 rounded bg-ivory-200 border-l-2 border-burgundy-500 text-xs font-sans leading-relaxed">
                                <span className="font-bold text-charcoal-900 block mb-0.5">
                                  Scientific Explanation:
                                </span>
                                <p className="text-charcoal-100">
                                  {q.scientificExplanation}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-hairline flex justify-end">
                      {!quizSubmitted ? (
                        <button
                          onClick={() => setQuizSubmitted(true)}
                          className="px-6 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
                        >
                          Submit Diagnostic Answers
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveQuiz(null)}
                          className="px-6 py-2.5 rounded border border-hairline text-charcoal-900 text-xs font-semibold hover:bg-ivory-300"
                        >
                          Return to Quizzes
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: PROFILE & CUSTOMIZATION                            */}
      {/* ========================================================= */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="bg-ivory-100 border border-hairline rounded-lg shadow-editorial max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between">
              <div>
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                  PROFILE SETTINGS
                </span>
                <h3 className="font-bold text-charcoal-900 font-display text-sm">
                  Edit Personal & Academic Profile
                </h3>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-charcoal-50 hover:text-charcoal-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Modal Tabs */}
            <div className="flex border-b border-hairline bg-ivory-300 px-6 pt-2 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setProfileModalTab('info')}
                className={`pb-2.5 border-b-2 transition-colors ${
                  profileModalTab === 'info'
                    ? 'border-burgundy-500 text-burgundy-500'
                    : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                }`}
              >
                Personal Details
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileModalTab('security');
                  setPasswordChangeStatus({ type: 'idle', message: '' });
                }}
                className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                  profileModalTab === 'security'
                    ? 'border-burgundy-500 text-burgundy-500'
                    : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Security & Password (تغيير كلمة المرور)</span>
              </button>
            </div>

            {profileModalTab === 'info' ? (
              <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                <div className="flex items-center gap-4 border-b border-hairline pb-4">
                  <img
                    src={profileAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'}
                    alt="Profile Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-burgundy-500/30"
                  />
                  <div className="flex-1 space-y-1">
                    <label className="block text-xs font-semibold text-charcoal-900 font-sans">
                      Avatar Image URL (رابط الصورة الشخصية)
                    </label>
                    <input
                      type="url"
                      value={profileAvatar}
                      onChange={(e) => setProfileAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-1.5 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-charcoal-50">
                      <span>Quick presets:</span>
                      <button
                        type="button"
                        onClick={() => setProfileAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80')}
                        className="text-burgundy-500 hover:underline"
                      >
                        Default Fellow
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setProfileAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80')}
                        className="text-burgundy-500 hover:underline"
                      >
                        Professor
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                      Display Name (الاسم الكامل)
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-bold text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                      Academic Title (اللقب الأكاديمي)
                    </label>
                    <input
                      type="text"
                      value={profileTitle}
                      onChange={(e) => setProfileTitle(e.target.value)}
                      placeholder="Academic Director & Senior Fellow"
                      className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                      Specialization (التخصص العلمي)
                    </label>
                    <input
                      type="text"
                      value={profileSpecialization}
                      onChange={(e) => setProfileSpecialization(e.target.value)}
                      placeholder="Organic Reaction Mechanisms"
                      className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+20 10xxxxxxxx"
                      className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Bio / Academic Manifesto (النبذة التعريفية)
                  </label>
                  <textarea
                    rows={3}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Specialist in organic mechanisms and advanced physical chemistry..."
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-4 py-2 rounded border border-hairline text-charcoal-50 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
                  >
                    Save Profile Changes
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                <div className="p-3.5 bg-ivory-200 border border-hairline rounded text-xs space-y-1">
                  <span className="font-semibold text-charcoal-900 flex items-center gap-1.5 font-formula">
                    <KeyRound className="w-3.5 h-3.5 text-burgundy-500" />
                    <span>Password Management (إدارة كلمة المرور)</span>
                  </span>
                  <p className="text-[11px] text-charcoal-100 leading-relaxed font-sans">
                    Change your confidential login password. Any profile (student or administrator) can safely update their password at any time.
                  </p>
                </div>

                {passwordChangeStatus.type === 'error' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-start gap-2">
                    <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{passwordChangeStatus.message}</span>
                  </div>
                )}

                {passwordChangeStatus.type === 'success' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{passwordChangeStatus.message}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Current Password (كلمة المرور الحالية)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    New Password (كلمة المرور الجديدة)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Confirm New Password (تأكيد كلمة المرور)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setPasswordChangeStatus({ type: 'idle', message: '' });
                    }}
                    className="px-4 py-2 rounded border border-hairline text-charcoal-50 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 disabled:opacity-50 text-ivory-100 text-xs font-semibold shadow-quiet flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: STUDENT PERSONAL PROFILE                           */}
      {/* ========================================================= */}
      {currentUser && (
        <StudentProfileModal
          isOpen={isStudentProfileOpen}
          user={currentUser}
          onClose={() => setIsStudentProfileOpen(false)}
          onSave={handleSaveStudentProfile}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: PER-COURSE STUDENTS & TELEMETRY ROSTER             */}
      {/* ========================================================= */}
      {selectedCourseForStudents && (
        <CourseStudentsModal
          isOpen={isCourseStudentsOpen}
          course={selectedCourseForStudents}
          onClose={() => {
            setIsCourseStudentsOpen(false);
            setSelectedCourseForStudents(null);
          }}
          onEnrollmentsUpdated={() => setEnrollments(getStoredEnrollments())}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE NEW COURSE                                  */}
      {/* ========================================================= */}
      {isCreateCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="bg-ivory-100 border border-hairline rounded-lg shadow-editorial max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between">
              <div>
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                  COURSE BUILDER
                </span>
                <h3 className="font-bold text-charcoal-900 font-display text-sm">
                  Create New Course under Academic Track
                </h3>
              </div>
              <button
                onClick={() => setIsCreateCourseOpen(false)}
                className="text-charcoal-50 hover:text-charcoal-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Target Academic Track (المسار التعليمي)
                </label>
                <select
                  value={newCourseCategory}
                  onChange={(e) => setNewCourseCategory(e.target.value as AcademicCategory)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                >
                  {ACADEMIC_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Course Code (e.g. CHEM-AR 302)
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="CHEM-AR 302"
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-formula text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Academic Level (المستوى الدراسي)
                  </label>
                  <input
                    type="text"
                    required
                    value={newCourseLevel}
                    onChange={(e) => setNewCourseLevel(e.target.value)}
                    placeholder="الصف الثالث الثانوي"
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Course Title (اسم المنهج / الكورس)
                </label>
                <input
                  type="text"
                  required
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="e.g. الكيمياء الكهربية والتحليل الكهربي المتقدم"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Subtitle / Scope
                </label>
                <input
                  type="text"
                  value={newCourseSubtitle}
                  onChange={(e) => setNewCourseSubtitle(e.target.value)}
                  placeholder="e.g. قوانين فاراداي، معادلة نيرنست، وحسابات القوة الدافعة الكهربية"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Key Formula / Symbol
                  </label>
                  <input
                    type="text"
                    value={newCourseFormula}
                    onChange={(e) => setNewCourseFormula(e.target.value)}
                    placeholder="e.g. ΔG° = -nFE°"
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-formula text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Academic Hours
                  </label>
                  <input
                    type="text"
                    value={newCourseHours}
                    onChange={(e) => setNewCourseHours(e.target.value)}
                    placeholder="32 ساعة تدريسية"
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Course Description & Pedagogical Goals
                </label>
                <textarea
                  rows={3}
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="Explain the first-principles methodology and core problem sets covered in this curriculum..."
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCourseOpen(false)}
                  className="px-4 py-2 rounded border border-hairline text-charcoal-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
                >
                  Create & Publish Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT EXISTING COURSE                               */}
      {/* ========================================================= */}
      {isEditCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="bg-ivory-100 border border-hairline rounded-lg shadow-editorial max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between">
              <div>
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                  EDIT COURSE
                </span>
                <h3 className="font-bold text-charcoal-900 font-display text-sm">
                  Modify Syllabus & Course Parameters
                </h3>
              </div>
              <button
                onClick={() => setIsEditCourseOpen(false)}
                className="text-charcoal-50 hover:text-charcoal-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Academic Track
                </label>
                <select
                  value={editCourseCategory}
                  onChange={(e) => setEditCourseCategory(e.target.value as AcademicCategory)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                >
                  {ACADEMIC_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editCourseCode}
                    onChange={(e) => setEditCourseCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-formula text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Academic Level
                  </label>
                  <input
                    type="text"
                    required
                    value={editCourseLevel}
                    onChange={(e) => setEditCourseLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={editCourseTitle}
                  onChange={(e) => setEditCourseTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={editCourseSubtitle}
                  onChange={(e) => setEditCourseSubtitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Molecular Formula / Badge
                  </label>
                  <input
                    type="text"
                    value={editCourseFormula}
                    onChange={(e) => setEditCourseFormula(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-formula text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Duration Hours
                  </label>
                  <input
                    type="text"
                    value={editCourseHours}
                    onChange={(e) => setEditCourseHours(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editCourseDesc}
                  onChange={(e) => setEditCourseDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditCourseOpen(false)}
                  className="px-4 py-2 rounded border border-hairline text-charcoal-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
                >
                  Update Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD LECTURE MODULE                                 */}
      {/* ========================================================= */}
      {isAddLectureOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="bg-ivory-100 border border-hairline rounded-lg shadow-editorial max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between">
              <div>
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                  CURRICULUM ARCHITECT
                </span>
                <h3 className="font-bold text-charcoal-900 font-display text-sm">
                  Add New Chemistry Lecture Module
                </h3>
              </div>
              <button
                onClick={() => setIsAddLectureOpen(false)}
                className="text-charcoal-50 hover:text-charcoal-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLecture} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Target Course
                </label>
                <select
                  value={newLectureCourse || (courses.length > 0 ? courses[0].id : '')}
                  onChange={(e) => setNewLectureCourse(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.categoryName}] {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Lecture Title
                </label>
                <input
                  type="text"
                  required
                  value={newLectureTitle}
                  onChange={(e) => setNewLectureTitle(e.target.value)}
                  placeholder="e.g. Thermodynamic Derivation of Equilibrium Constant"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Video URL (رابط يوتيوب غير مدرج أو رابط مباشر)
                </label>
                <input
                  type="url"
                  value={newLectureVideoUrl}
                  onChange={(e) => setNewLectureVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or direct MP4/Vimeo"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-mono text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
                <span className="text-[10px] text-charcoal-50 block mt-1">
                  Protected automatically by PHENOL custom player skin & blended student forensic watermark.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Companion PDF Handout URL (رابط مذكرة المحاضرة PDF)
                </label>
                <input
                  type="url"
                  value={newLecturePdfUrl}
                  onChange={(e) => setNewLecturePdfUrl(e.target.value)}
                  placeholder="https://.../lecture-notes.pdf"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    required
                    value={newLectureDuration}
                    onChange={(e) => setNewLectureDuration(e.target.value)}
                    placeholder="e.g. 52 min"
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Key Formula (optional)
                  </label>
                  <input
                    type="text"
                    value={newLectureFormula}
                    onChange={(e) => setNewLectureFormula(e.target.value)}
                    placeholder="e.g. ΔG° = -RT ln K"
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-formula text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Module Summary
                </label>
                <textarea
                  rows={3}
                  value={newLectureSummary}
                  onChange={(e) => setNewLectureSummary(e.target.value)}
                  placeholder="Core concepts, mechanism breakdown, and diagnostic points covered in this lecture..."
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLectureOpen(false)}
                  className="px-4 py-2 rounded border border-hairline text-charcoal-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
                >
                  Publish Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT LECTURE MODULE                                */}
      {/* ========================================================= */}
      {isEditLessonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="bg-ivory-100 border border-hairline rounded-lg shadow-editorial max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between">
              <div>
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                  EDIT MODULE
                </span>
                <h3 className="font-bold text-charcoal-900 font-display text-sm">
                  Update Lecture Information
                </h3>
              </div>
              <button
                onClick={() => setIsEditLessonOpen(false)}
                className="text-charcoal-50 hover:text-charcoal-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLesson} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Lecture Title
                </label>
                <input
                  type="text"
                  required
                  value={editLessonTitle}
                  onChange={(e) => setEditLessonTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Video URL (رابط يوتيوب غير مدرج أو رابط مباشر)
                </label>
                <input
                  type="url"
                  value={editLessonVideoUrl}
                  onChange={(e) => setEditLessonVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or direct MP4/Vimeo"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-mono text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Companion PDF Handout URL (رابط مذكرة المحاضرة PDF)
                </label>
                <input
                  type="url"
                  value={editLessonPdfUrl}
                  onChange={(e) => setEditLessonPdfUrl(e.target.value)}
                  placeholder="https://.../lecture-notes.pdf"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    required
                    value={editLessonDuration}
                    onChange={(e) => setEditLessonDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Key Formula (optional)
                  </label>
                  <input
                    type="text"
                    value={editLessonFormula}
                    onChange={(e) => setEditLessonFormula(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-formula text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Module Summary
                </label>
                <textarea
                  rows={3}
                  value={editLessonSummary}
                  onChange={(e) => setEditLessonSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditLessonOpen(false)}
                  className="px-4 py-2 rounded border border-hairline text-charcoal-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
                >
                  Save Module Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REGISTER WALK-IN APPLICANT                         */}
      {/* ========================================================= */}
      {isAddApplicantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="bg-ivory-100 border border-hairline rounded-lg shadow-editorial max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between">
              <div>
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                  ADMISSIONS OFFICE
                </span>
                <h3 className="font-bold text-charcoal-900 font-display text-sm">
                  Register Walk-in Applicant
                </h3>
              </div>
              <button
                onClick={() => setIsAddApplicantOpen(false)}
                className="text-charcoal-50 hover:text-charcoal-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddApplicant} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Full Name (اسم الطالب)
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Youssef Ahmed"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  WhatsApp Contact (رقم الواتساب)
                </label>
                <input
                  type="tel"
                  required
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="+20 10xxxxxxxx"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Target Academic Track
                </label>
                <select
                  value={manualTrack}
                  onChange={(e) => setManualTrack(e.target.value as AcademicCategory)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                >
                  {ACADEMIC_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddApplicantOpen(false)}
                  className="px-4 py-2 rounded border border-hairline text-charcoal-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
                >
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: INSTRUCTOR GRADING DESK MODAL                      */}
      {/* ========================================================= */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="bg-ivory-100 border border-hairline rounded-lg shadow-editorial max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between">
              <div>
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                  INSTRUCTOR GRADING DESK
                </span>
                <h3 className="font-bold text-charcoal-900 font-display text-sm">
                  {gradingSubmission.studentName} ({gradingSubmission.studentCode})
                </h3>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-charcoal-50 hover:text-charcoal-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-charcoal-50 font-sans block">
                  Problem Set:
                </span>
                <p className="text-xs font-bold text-charcoal-900 font-sans">
                  {gradingSubmission.taskTitle}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-charcoal-50 font-sans block">
                  Student Work Notes:
                </span>
                <p className="text-xs text-charcoal-100 bg-ivory-200 p-3 rounded font-sans leading-relaxed">
                  {gradingSubmission.solutionNotes}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Assigned Score (out of {gradingSubmission.maxGrade})
                </label>
                <input
                  type="number"
                  min="0"
                  max={gradingSubmission.maxGrade}
                  required
                  value={inputGrade}
                  onChange={(e) => setInputGrade(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-ivory-50 border border-hairline rounded font-formula font-bold text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Dr. Omar Magdi Feedback Critique
                </label>
                <textarea
                  rows={4}
                  required
                  value={inputFeedback}
                  onChange={(e) => setInputFeedback(e.target.value)}
                  placeholder="Detail your scientific evaluation and highlight any orbital or thermodynamic nuances..."
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 rounded border border-hairline text-charcoal-50 text-xs font-semibold hover:text-charcoal-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
                >
                  Save Grade & Send Critique
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: STUDENT SUBMIT PROBLEM SET                         */}
      {/* ========================================================= */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="bg-ivory-100 border border-hairline rounded-lg shadow-editorial max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between">
              <div>
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                  PROBLEM SET SUBMISSION
                </span>
                <h3 className="font-bold text-charcoal-900 font-display text-sm">
                  Submit Work to Dr. Omar Magdi
                </h3>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-charcoal-50 hover:text-charcoal-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Solution Notes & Derivations
                </label>
                <textarea
                  rows={4}
                  required
                  value={newSolutionNotes}
                  onChange={(e) => setNewSolutionNotes(e.target.value)}
                  placeholder="Detail your thermodynamic steps, electron pushing logic, or provide your work link..."
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded border border-hairline text-charcoal-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
                >
                  Submit for Critique
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Direct Enroll Student in Course Modal */}
      {isDirectEnrollModalOpen && directEnrollStudent && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ivory-100 border border-hairline rounded-2xl max-w-md w-full p-6 shadow-editorial space-y-4 font-sans text-charcoal-900">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-burgundy-900" />
                <h3 className="text-base font-bold font-display">تفعيل كورس للطالب</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDirectEnrollModalOpen(false)}
                className="p-1 rounded text-charcoal-50 hover:text-charcoal-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-white rounded-lg border border-hairline space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-charcoal-900">{directEnrollStudent.name}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-burgundy-50 text-burgundy-900 border border-burgundy-200">
                  {directEnrollStudent.code}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-50 font-mono">{directEnrollStudent.email}</p>
              <p className="text-[11px] text-charcoal-50 font-mono">{directEnrollStudent.phone}</p>
            </div>

            <form onSubmit={handleDirectEnrollSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-charcoal-900">اختر الكورس المراد تفعيله:</label>
                <select
                  value={selectedCourseIdToEnroll}
                  onChange={(e) => setSelectedCourseIdToEnroll(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsDirectEnrollModalOpen(false)}
                  className="px-4 py-2 rounded border border-hairline text-charcoal-100 text-xs font-semibold hover:bg-ivory-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-quiet flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تفعيل الكورس فوراً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Add Student Modal */}
      {isManualAddStudentModalOpen && (
        <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ivory-100 border border-hairline rounded-2xl max-w-md w-full p-6 shadow-editorial space-y-4 font-sans text-charcoal-900">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-burgundy-900" />
                <h3 className="text-base font-bold font-display">تسجيل طالب جديد يدوياً</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualAddStudentModalOpen(false)}
                className="p-1 rounded text-charcoal-50 hover:text-charcoal-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualAddStudentSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal-900">الاسم الكامل للطالب *</label>
                <input
                  type="text"
                  required
                  value={manualStudentName}
                  onChange={(e) => setManualStudentName(e.target.value)}
                  placeholder="مثال: أحمد محمد علي"
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal-900">البريد الإلكتروني *</label>
                <input
                  type="email"
                  required
                  value={manualStudentEmail}
                  onChange={(e) => setManualStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal-900">رقم الهاتف (الواتساب) *</label>
                <input
                  type="text"
                  required
                  value={manualStudentPhone}
                  onChange={(e) => setManualStudentPhone(e.target.value)}
                  placeholder="+20 010 1234 5678"
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-charcoal-900">الشعبة الأكاديمية (Track)</label>
                <select
                  value={manualStudentTrack}
                  onChange={(e) => setManualStudentTrack(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
                >
                  <option value="ثانوية عامة (عربي)">ثانوية عامة (عربي)</option>
                  <option value="ثانوية عامة (لغات)">ثانوية عامة (لغات)</option>
                  <option value="IGCSE & A-Level / STEM">IGCSE & A-Level / STEM</option>
                  <option value="كيمياء جامعية (صيدلة، علوم، طب)">كيمياء جامعية (صيدلة، علوم، طب)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsManualAddStudentModalOpen(false)}
                  className="px-4 py-2 rounded border border-hairline text-charcoal-100 text-xs font-semibold hover:bg-ivory-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-quiet flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>حفظ وتسجيل الطالب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Required WhatsApp Modal for Enrolled Scholars */}
      {isWhatsAppRequiredModalOpen && currentUser && (
        <WhatsAppPromptModal
          isOpen={isWhatsAppRequiredModalOpen}
          user={currentUser}
          onSuccess={(updatedUser) => {
            setCurrentUser(updatedUser);
            setProfilePhone(updatedUser.phone || '');
            setIsWhatsAppRequiredModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
