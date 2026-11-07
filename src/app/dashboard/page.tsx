'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types/auth';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import {
  CHEMISTRY_COURSES,
  CHEMISTRY_QUIZZES,
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
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Instructor View Toggle (Admin mode vs Student preview mode)
  const [adminViewMode, setAdminViewMode] = useState<'ADMIN' | 'STUDENT_PREVIEW'>('ADMIN');

  // Instructor Admin Tabs
  const [adminTab, setAdminTab] = useState<'waitlist' | 'submissions' | 'curriculum' | 'roster'>('curriculum');

  // Student Tabs
  const [studentTab, setStudentTab] = useState<'courses' | 'tasks' | 'booklets' | 'quizzes'>('courses');

  // Filter Track for Curriculum and Waitlist
  const [trackFilter, setTrackFilter] = useState<AcademicCategory | 'all'>('all');

  // Data states
  const [courses, setCourses] = useState<ChemistryCourse[]>(CHEMISTRY_COURSES);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(SUBMISSIONS);
  const [waitlist, setWaitlist] = useState<WaitlistApplication[]>(WAITLIST_APPLICANTS);
  const [students, setStudents] = useState<EnrolledStudent[]>(ENROLLED_STUDENTS);

  // Grading Modal State for Dr. Omar
  const [gradingSubmission, setGradingSubmission] = useState<StudentSubmission | null>(null);
  const [inputGrade, setInputGrade] = useState<number>(20);
  const [inputFeedback, setInputFeedback] = useState<string>('');

  // Course Builder Modal State for Dr. Omar
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [newCourseCategory, setNewCourseCategory] = useState<AcademicCategory>('thanaweya-arabic');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseSubtitle, setNewCourseSubtitle] = useState('');
  const [newCourseLevel, setNewCourseLevel] = useState('');
  const [newCourseFormula, setNewCourseFormula] = useState('');
  const [newCourseHours, setNewCourseHours] = useState('30 Academic Hours');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  // Add Lecture Modal for Dr. Omar
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [newLectureCourse, setNewLectureCourse] = useState(CHEMISTRY_COURSES[0].id);
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureDuration, setNewLectureDuration] = useState('45 min');
  const [newLectureSummary, setNewLectureSummary] = useState('');
  const [newLectureFormula, setNewLectureFormula] = useState('');

  // Manual Applicant Modal
  const [isAddApplicantOpen, setIsAddApplicantOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualTrack, setManualTrack] = useState<AcademicCategory>('thanaweya-arabic');
  const [manualCourse, setManualCourse] = useState('');

  // Student Task Submission State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('Resonance Stabilization & Acidity Analysis Problem Set');
  const [newSolutionNotes, setNewSolutionNotes] = useState('');

  // Student Quiz State
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Initialize and load saved state
  useEffect(() => {
    try {
      // 1. Auth check
      const savedUser = localStorage.getItem('phenol_auth_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      } else {
        const defaultInstructor: AuthUser = {
          id: 'dr-omar-magdi',
          name: 'Dr. Omar Magdi',
          email: 'phenolvii@gmail.com',
          role: 'INSTRUCTOR',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          registeredAt: '2026-01-01',
        };
        setCurrentUser(defaultInstructor);
        localStorage.setItem('phenol_auth_user', JSON.stringify(defaultInstructor));
      }

      // 2. Custom Courses from local storage
      const savedCourses = localStorage.getItem('phenol_courses');
      if (savedCourses) {
        const parsed = JSON.parse(savedCourses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCourses(parsed);
        }
      }

      // 3. Waitlist Applications from local storage and Supabase
      const savedWaitlist = localStorage.getItem('phenol_waitlist_applications');
      if (savedWaitlist) {
        const parsedWl = JSON.parse(savedWaitlist);
        if (Array.isArray(parsedWl)) {
          setWaitlist(parsedWl);
        }
      }

      // Try fetching Supabase waitlist in the background
      (async () => {
        try {
          const { data, error } = await supabase.from('waitlist_applications').select('*').order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            const mapped: WaitlistApplication[] = data.map((d: any) => ({
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
              const combined = [...mapped];
              prev.forEach((localItem) => {
                if (!combined.some((c) => c.id === localItem.id)) {
                  combined.push(localItem);
                }
              });
              return combined;
            });
          }
        } catch (e) {
          console.warn('Supabase fetch note:', e);
        }
      })();

      // 4. Submissions from local storage
      const savedSubmissions = localStorage.getItem('phenol_submissions');
      if (savedSubmissions) {
        setSubmissions(JSON.parse(savedSubmissions));
      }

      // 5. Enrolled students from local storage
      const savedStudents = localStorage.getItem('phenol_students');
      if (savedStudents) {
        setStudents(JSON.parse(savedStudents));
      }
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

  const isInstructor = currentUser?.role === 'INSTRUCTOR';
  const showAdminInterface = isInstructor && adminViewMode === 'ADMIN';

  // Waitlist Status Actions
  const handleUpdateWaitlistStatus = (id: string, status: 'approved' | 'declined' | 'contacted') => {
    const updated = waitlist.map((app) => (app.id === id ? { ...app, status } : app));
    setWaitlist(updated);
    try {
      localStorage.setItem('phenol_waitlist_applications', JSON.stringify(updated));
    } catch (e) {}

    // If approved, automatically enroll student into the cohort roster
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

  // Submit Grade Action
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

  // Course Builder: Create Course
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
    try {
      localStorage.setItem('phenol_courses', JSON.stringify(updated));
    } catch (e) {}

    setIsCreateCourseOpen(false);
    setNewCourseCode('');
    setNewCourseTitle('');
    setNewCourseSubtitle('');
    setNewCourseLevel('');
    setNewCourseFormula('');
    setNewCourseDesc('');
  };

  // Add Lecture Action
  const handleAddLecture = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = courses.map((course) => {
      if (course.id === newLectureCourse) {
        const newLesson: ChemistryLesson = {
          id: `les-${Date.now()}`,
          title: newLectureTitle,
          duration: newLectureDuration,
          type: 'video',
          completed: false,
          summary: newLectureSummary || 'Module curated by Dr. Omar Magdi for deep conceptual mastery.',
          keyFormulas: newLectureFormula ? [newLectureFormula] : undefined,
        };
        return {
          ...course,
          lessons: [...course.lessons, newLesson],
        };
      }
      return course;
    });

    setCourses(updated);
    try {
      localStorage.setItem('phenol_courses', JSON.stringify(updated));
    } catch (e) {}

    setIsAddLectureOpen(false);
    setNewLectureTitle('');
    setNewLectureSummary('');
    setNewLectureFormula('');
  };

  // Add Manual Applicant Action
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

  // Filtered courses based on selected track filter
  const displayedCourses = trackFilter === 'all'
    ? courses
    : courses.filter((c) => c.category === trackFilter);

  // Filtered waitlist based on selected track filter
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
            <div className="flex items-center gap-4">
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

              {/* Profile Card */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs sm:text-sm font-bold text-charcoal-900 block leading-tight">
                    {currentUser?.name || 'Dr. Omar Magdi'}
                  </span>
                  <span className="text-[11px] text-charcoal-100 font-sans block">
                    {isInstructor
                      ? 'Academic Director & Senior Fellow'
                      : 'Enrolled Scholar'}
                  </span>
                </div>

                <img
                  src={
                    currentUser?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
                  }
                  alt={currentUser?.name || 'User'}
                  className="w-9 h-9 rounded-full object-cover border border-hairline ring-2 ring-burgundy-500/20"
                />

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
                  onClick={() => setAdminTab('waitlist')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    adminTab === 'waitlist'
                      ? 'border-burgundy-500 text-burgundy-500'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <span>Admissions & Waitlist</span>
                  <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-burgundy-50 text-burgundy-500 border border-burgundy-200">
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
                      onClick={() => setIsAddLectureOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-ivory-100 border border-hairline hover:border-charcoal-100 text-charcoal-900 text-xs font-semibold transition-colors"
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
                      Structured under Dr. Omar Magdi&apos;s 4 core educational tracks. Add modules, edit syllabi, or create new courses.
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
                  {displayedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="border border-hairline rounded bg-ivory-100 p-6 space-y-4 shadow-quiet"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
                        <div>
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
                          <h3 className="text-lg font-bold text-charcoal-900 font-display mt-2">
                            {course.title}
                          </h3>
                          <p className="text-xs text-charcoal-50 font-sans mt-0.5">
                            {course.subTitle}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-formula text-xs text-charcoal-100">
                            {course.lessons.length} Modules • {course.totalHours}
                          </span>
                          <Link
                            href={`/courses/${course.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-burgundy-500 hover:underline"
                          >
                            <span>Live Page</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Lessons List in Course */}
                      {course.lessons.length > 0 ? (
                        <div className="divide-y divide-hairline">
                          {course.lessons.map((lesson, idx) => (
                            <div
                              key={lesson.id}
                              className="py-3 flex items-center justify-between text-xs font-sans hover:bg-ivory-200 px-2 rounded transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-formula font-bold text-charcoal-50 w-6">
                                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                                </span>
                                <div>
                                  <span className="font-semibold text-charcoal-900 block">
                                    {lesson.title}
                                  </span>
                                  <span className="text-charcoal-50 text-[11px]">
                                    {lesson.summary}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-formula text-charcoal-50">
                                  {lesson.duration}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-formula text-[10px] uppercase font-bold">
                                  Active
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-charcoal-50 border border-dashed border-hairline rounded bg-ivory-50">
                          <span>No lecture modules added yet. Click &quot;Add Lecture&quot; to begin building this syllabus.</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: ADMISSIONS & WAITLIST MANAGEMENT */}
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

            {/* TAB 3: GRADING DESK (SUBMISSIONS) */}
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

            {/* TAB 4: COHORT STUDENT ROSTER */}
            {adminTab === 'roster' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-charcoal-900 font-display">
                    Enrolled Student Cohort Roster (2026/2027)
                  </h2>
                  <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                    Official directory of active scholars enrolled across the 4 chemistry tracks under Dr. Omar Magdi.
                  </p>
                </div>

                {students.length > 0 ? (
                  <div className="border border-hairline rounded bg-ivory-100 overflow-hidden shadow-quiet">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-hairline bg-ivory-200/80 text-[11px] font-formula uppercase tracking-wider text-charcoal-50">
                            <th className="py-3 px-4">Student ID</th>
                            <th className="py-3 px-4">Full Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Enrolled Track</th>
                            <th className="py-3 px-4">Enrolled Date</th>
                            <th className="py-3 px-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-hairline text-xs font-sans">
                          {students.map((st) => (
                            <tr key={st.id} className="hover:bg-ivory-300/30 transition-colors">
                              <td className="py-3.5 px-4 font-formula font-semibold text-charcoal-900">
                                {st.code}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-charcoal-900">
                                {st.fullName}
                              </td>
                              <td className="py-3.5 px-4 text-charcoal-100">
                                {st.email}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-formula font-bold text-burgundy-500">
                                  {st.trackCode}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-formula text-charcoal-50">
                                {st.enrolledAt}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Active Scholar
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-hairline rounded bg-ivory-100 p-12 text-center space-y-3">
                    <Users className="w-10 h-10 text-charcoal-50 mx-auto" />
                    <h3 className="text-base font-bold text-charcoal-900 font-display">
                      No Enrolled Students Yet
                    </h3>
                    <p className="text-xs text-charcoal-100 font-sans max-w-md mx-auto">
                      Once waitlist applications are approved on the Admissions desk, candidates will automatically be added to this active cohort roster.
                    </p>
                  </div>
                )}
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
            <div className="border-b border-hairline flex items-center gap-8 text-sm font-semibold">
              <button
                onClick={() => setStudentTab('courses')}
                className={`pb-3 border-b-2 transition-colors ${
                  studentTab === 'courses'
                    ? 'border-burgundy-500 text-burgundy-500'
                    : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                }`}
              >
                Curriculum Tracks ({courses.length})
              </button>
              <button
                onClick={() => setStudentTab('tasks')}
                className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
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
                className={`pb-3 border-b-2 transition-colors ${
                  studentTab === 'booklets'
                    ? 'border-burgundy-500 text-burgundy-500'
                    : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                }`}
              >
                Academic Booklets
              </button>
              <button
                onClick={() => setStudentTab('quizzes')}
                className={`pb-3 border-b-2 transition-colors ${
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="border border-hairline rounded bg-ivory-100 p-6 space-y-4 hover:border-charcoal-100/50 transition-colors flex flex-col justify-between shadow-quiet"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                            {course.code}
                          </span>
                          <span className="text-xs text-charcoal-50 font-sans">
                            {course.categoryName}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-charcoal-900 font-display">
                          {course.title}
                        </h3>

                        <p className="text-xs text-charcoal-100 leading-relaxed font-sans">
                          {course.subTitle}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-hairline flex items-center justify-between">
                        <span className="font-formula text-xs text-charcoal-50">
                          {course.lessons.length} Modules • {course.totalHours}
                        </span>
                        <Link
                          href={`/courses/${course.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-burgundy-500 hover:text-burgundy-800"
                        >
                          <span>Enter Course</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STUDENT TAB 2: TASKS */}
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

            {/* STUDENT TAB 3: BOOKLETS */}
            {studentTab === 'booklets' && (
              <BookletsView booklets={BOOKLETS} />
            )}

            {/* STUDENT TAB 4: QUIZZES */}
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
      {/* MODAL 1: CREATE NEW COURSE (Dr. Omar Course Builder)       */}
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
                    Academic Level (الصف / المستوى)
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
      {/* MODAL 2: ADD LECTURE MODULE                               */}
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
                  value={newLectureCourse}
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
      {/* MODAL 3: REGISTER WALK-IN APPLICANT                       */}
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
      {/* MODAL 4: INSTRUCTOR GRADING DESK MODAL                    */}
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
      {/* MODAL 5: STUDENT SUBMIT PROBLEM SET                       */}
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
    </div>
  );
}
