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
} from '@/data/mock-data';
import {
  StudentSubmission,
  WaitlistApplication,
  EnrolledStudent,
} from '@/types/lms';
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
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Instructor View Toggle (Admin mode vs Student preview mode)
  const [adminViewMode, setAdminViewMode] = useState<'ADMIN' | 'STUDENT_PREVIEW'>('ADMIN');

  // Instructor Admin Tabs
  const [adminTab, setAdminTab] = useState<'waitlist' | 'submissions' | 'curriculum' | 'roster'>('waitlist');

  // Student Tabs
  const [studentTab, setStudentTab] = useState<'courses' | 'tasks' | 'booklets' | 'quizzes'>('courses');

  // Data states
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(SUBMISSIONS);
  const [waitlist, setWaitlist] = useState<WaitlistApplication[]>(WAITLIST_APPLICANTS);
  const [students, setStudents] = useState<EnrolledStudent[]>(ENROLLED_STUDENTS);

  // Grading Modal State for Dr. Omar
  const [gradingSubmission, setGradingSubmission] = useState<StudentSubmission | null>(null);
  const [inputGrade, setInputGrade] = useState<number>(20);
  const [inputFeedback, setInputFeedback] = useState<string>('');

  // Add Lecture Modal for Dr. Omar
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureDuration, setNewLectureDuration] = useState('45 min');
  const [newLectureCourse, setNewLectureCourse] = useState('chem-org-01');

  // Student Task Submission State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('Phenoxide Ion Delocalization & EAS Directing Problem Set');
  const [newSolutionNotes, setNewSolutionNotes] = useState('');

  // Student Quiz State
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('phenol_auth_user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
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
    setWaitlist((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app))
    );
  };

  // Submit Grade Action
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === gradingSubmission.id
          ? {
              ...s,
              grade: inputGrade,
              drFeedback: inputFeedback,
              status: 'graded',
            }
          : s
      )
    );
    setGradingSubmission(null);
  };

  // Add Lecture Action
  const handleAddLecture = (e: React.FormEvent) => {
    e.preventDefault();
    const course = CHEMISTRY_COURSES.find((c) => c.id === newLectureCourse);
    if (course) {
      course.lessons.push({
        id: `les-custom-${Date.now()}`,
        title: newLectureTitle,
        duration: newLectureDuration,
        type: 'video',
        completed: false,
        summary: 'Newly added lecture module curated by Dr. Omar Magdi.',
      });
    }
    setIsAddLectureOpen(false);
    setNewLectureTitle('');
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
    setSubmissions([sub, ...submissions]);
    setIsSubmitModalOpen(false);
    setNewSolutionNotes('');
  };

  // Quiz Answer Select
  const handleAnswerSelect = (qId: string, optIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

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
            {/* Executive Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-ivory-100 border border-hairline rounded p-5 space-y-2">
                <div className="flex items-center justify-between text-charcoal-50">
                  <span className="text-xs font-semibold uppercase tracking-wider font-formula">
                    Enrolled Students
                  </span>
                  <Users className="w-4 h-4 text-burgundy-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-formula text-charcoal-900">
                  1,420
                </div>
                <span className="text-[11px] text-charcoal-100 font-sans block">
                  Active in 4 Chemistry Tracks
                </span>
              </div>

              <div className="bg-ivory-100 border border-hairline rounded p-5 space-y-2">
                <div className="flex items-center justify-between text-charcoal-50">
                  <span className="text-xs font-semibold uppercase tracking-wider font-formula">
                    Waitlist Applicants
                  </span>
                  <GraduationCap className="w-4 h-4 text-burgundy-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-formula text-burgundy-500">
                  {waitlist.filter((w) => w.status === 'pending').length} Pending
                </div>
                <span className="text-[11px] text-charcoal-100 font-sans block">
                  {waitlist.length} Total Registered Applications
                </span>
              </div>

              <div className="bg-ivory-100 border border-hairline rounded p-5 space-y-2">
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
                  Awaiting Instructor Grading
                </span>
              </div>

              <div className="bg-ivory-100 border border-hairline rounded p-5 space-y-2">
                <div className="flex items-center justify-between text-charcoal-50">
                  <span className="text-xs font-semibold uppercase tracking-wider font-formula">
                    Cohort Mean Score
                  </span>
                  <Award className="w-4 h-4 text-ochre" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-formula text-charcoal-900">
                  94.2%
                </div>
                <span className="text-[11px] text-charcoal-100 font-sans block">
                  High Mastery Rating
                </span>
              </div>
            </div>

            {/* Administration Navigation Tabs */}
            <div className="border-b border-hairline flex items-center justify-between">
              <nav className="flex items-center gap-6 text-sm font-semibold">
                <button
                  onClick={() => setAdminTab('waitlist')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
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
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                    adminTab === 'submissions'
                      ? 'border-burgundy-500 text-burgundy-500'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <span>Grading Desk (Submissions)</span>
                  <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
                    {submissions.length}
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab('curriculum')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                    adminTab === 'curriculum'
                      ? 'border-burgundy-500 text-burgundy-500'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <span>Curriculum & Lessons</span>
                  <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
                    4 Tracks
                  </span>
                </button>

                <button
                  onClick={() => setAdminTab('roster')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                    adminTab === 'roster'
                      ? 'border-burgundy-500 text-burgundy-500'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <span>Cohort Student Roster</span>
                </button>
              </nav>

              <button
                onClick={() => setIsAddLectureOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Lecture Module</span>
              </button>
            </div>

            {/* TAB 1: WAITLIST & ADMISSIONS MANAGEMENT */}
            {adminTab === 'waitlist' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-charcoal-900 font-display">
                      Prospective Student Applicants (2026/2027 Cohort)
                    </h2>
                    <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                      Review applications submitted through the landing page admission form. Approve placements or contact via WhatsApp.
                    </p>
                  </div>
                </div>

                <div className="border border-hairline rounded bg-ivory-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-hairline bg-ivory-200/80 text-[11px] font-formula uppercase tracking-wider text-charcoal-50">
                          <th className="py-3 px-4">Applicant</th>
                          <th className="py-3 px-4">Contact (WhatsApp)</th>
                          <th className="py-3 px-4">Academic Level</th>
                          <th className="py-3 px-4">Target Track</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline text-xs font-sans">
                        {waitlist.map((app) => (
                          <tr key={app.id} className="hover:bg-ivory-300/30 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-charcoal-900">
                              {app.fullName}
                              <span className="block text-[11px] text-charcoal-50 font-normal">
                                {app.email}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-formula text-charcoal-900">
                              {app.phone}
                            </td>
                            <td className="py-3.5 px-4 text-charcoal-100">
                              {app.academicLevel}
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
                              {app.status === 'approved' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <Check className="w-3 h-3" /> Approved
                                </span>
                              )}
                              {app.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <Clock className="w-3 h-3" /> Under Review
                                </span>
                              )}
                              {app.status === 'contacted' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  <MessageCircle className="w-3 h-3" /> Contacted
                                </span>
                              )}
                              {app.status === 'declined' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-charcoal-50 bg-ivory-300 px-2 py-0.5 rounded">
                                  Declined
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <a
                                href={`https://wa.me/${app.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-hairline bg-ivory-50 text-charcoal-900 hover:border-burgundy-500 transition-colors text-[11px] font-semibold"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>WhatsApp</span>
                              </a>
                              {app.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateWaitlistStatus(app.id, 'approved')}
                                    className="px-2.5 py-1 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-[11px] font-semibold transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateWaitlistStatus(app.id, 'declined')}
                                    className="px-2.5 py-1 rounded border border-hairline text-charcoal-50 hover:text-charcoal-900 text-[11px] font-semibold transition-colors"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GRADING DESK (STUDENT SUBMISSIONS) */}
            {adminTab === 'submissions' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-charcoal-900 font-display">
                    Student Homework & Problem Set Submissions
                  </h2>
                  <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                    Review student written solutions, grade out of 20, and submit personalized academic critique notes.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="border border-hairline rounded bg-ivory-100 p-5 space-y-4 hover:border-charcoal-100/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-charcoal-900 text-sm">
                              {sub.studentName}
                            </span>
                            <span className="font-formula text-xs text-charcoal-50">
                              ({sub.studentCode})
                            </span>
                          </div>
                          <h3 className="text-xs font-semibold text-burgundy-500 font-sans">
                            {sub.taskTitle}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-formula text-charcoal-50">
                            {sub.submittedAt}
                          </span>
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
              </div>
            )}

            {/* TAB 3: CURRICULUM & LESSON MANAGER */}
            {adminTab === 'curriculum' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-charcoal-900 font-display">
                    Active Chemistry Tracks & Course Modules
                  </h2>
                  <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                    Manage the syllabus, add video lectures, and organize course materials across all 4 cohorts.
                  </p>
                </div>

                <div className="space-y-6">
                  {CHEMISTRY_COURSES.map((course) => (
                    <div
                      key={course.id}
                      className="border border-hairline rounded bg-ivory-100 p-6 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                              {course.code}
                            </span>
                            <span className="text-xs text-charcoal-50 font-sans">
                              {course.level}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-charcoal-900 font-display mt-1">
                            {course.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-formula text-xs text-charcoal-100">
                            {course.lessons.length} Modules • {course.enrolledStudentsCount} Enrolled
                          </span>
                          <Link
                            href={`/courses/${course.id}`}
                            className="text-xs font-semibold text-burgundy-500 hover:underline"
                          >
                            View Live Course Page →
                          </Link>
                        </div>
                      </div>

                      {/* Lessons List */}
                      <div className="divide-y divide-hairline">
                        {course.lessons.map((lesson, idx) => (
                          <div
                            key={lesson.id}
                            className="py-3 flex items-center justify-between text-xs font-sans hover:bg-ivory-200 px-2 rounded transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-formula font-bold text-charcoal-50 w-5">
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
                                Published
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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
                    Real-time monitoring of student progress, quiz performance averages, and course completions.
                  </p>
                </div>

                <div className="border border-hairline rounded bg-ivory-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-hairline bg-ivory-200/80 text-[11px] font-formula uppercase tracking-wider text-charcoal-50">
                          <th className="py-3 px-4">Student ID</th>
                          <th className="py-3 px-4">Full Name</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Enrolled Track</th>
                          <th className="py-3 px-4">Curriculum Progress</th>
                          <th className="py-3 px-4">Mean Grade</th>
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
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-ivory-300 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-burgundy-500 h-1.5 rounded-full"
                                    style={{ width: `${st.progressPercent}%` }}
                                  />
                                </div>
                                <span className="font-formula text-[11px] text-charcoal-50">
                                  {st.progressPercent}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-formula font-bold text-charcoal-900">
                              {st.averageGrade}%
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
                  Enrolled in <strong className="text-charcoal-900">CHEM 301: Advanced Organic Chemistry</strong> under Dr. Omar Magdi.
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
                Curriculum Tracks
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CHEMISTRY_COURSES.map((course) => (
                  <div
                    key={course.id}
                    className="border border-hairline rounded bg-ivory-100 p-6 space-y-4 hover:border-charcoal-100/50 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                          {course.code}
                        </span>
                        <span className="text-xs text-charcoal-50 font-sans">
                          {course.level}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-charcoal-900 font-display">
                        {course.title}
                      </h3>

                      <p className="text-xs text-charcoal-100 leading-relaxed font-sans">
                        {course.subTitle}
                      </p>

                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs font-formula text-charcoal-50">
                          <span>Progress</span>
                          <span>65%</span>
                        </div>
                        <div className="w-full bg-ivory-300 rounded-full h-1.5">
                          <div className="bg-burgundy-500 h-1.5 rounded-full w-[65%]" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-hairline flex items-center justify-between">
                      <span className="font-formula text-xs text-charcoal-50">
                        {course.lessons.length} Modules
                      </span>
                      <Link
                        href={`/courses/${course.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-burgundy-500 hover:text-burgundy-800"
                      >
                        <span>Continue Learning</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STUDENT TAB 2: TASKS */}
            {studentTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-charcoal-900 font-display">
                    My Homework Problem Sets
                  </h2>
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="text-xs font-semibold text-burgundy-500 hover:underline"
                  >
                    + Submit New Task
                  </button>
                </div>

                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="border border-hairline rounded bg-ivory-100 p-5 space-y-3"
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
              </div>
            )}

            {/* STUDENT TAB 3: BOOKLETS */}
            {studentTab === 'booklets' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {BOOKLETS.map((book) => (
                  <div
                    key={book.id}
                    className="border border-hairline rounded bg-ivory-100 p-5 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className="font-formula text-xs text-burgundy-500 font-semibold block">
                        {book.courseName}
                      </span>
                      <h3 className="text-sm font-bold text-charcoal-900 font-display">
                        {book.title}
                      </h3>
                      <p className="text-xs text-charcoal-100 leading-relaxed font-sans">
                        {book.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-hairline flex items-center justify-between text-xs font-formula">
                      <span className="text-charcoal-50">
                        {book.pages} pages • {book.size}
                      </span>
                      <button
                        onClick={() => alert(`Downloading ${book.title}...`)}
                        className="inline-flex items-center gap-1 text-burgundy-500 hover:text-burgundy-800 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STUDENT TAB 4: QUIZZES */}
            {studentTab === 'quizzes' && (
              <div className="space-y-6">
                {!activeQuiz ? (
                  <div className="space-y-4">
                    {CHEMISTRY_QUIZZES.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="border border-hairline rounded bg-ivory-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                  <div className="border border-hairline rounded bg-ivory-100 p-6 sm:p-8 space-y-6">
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
                        const isAnswered = selectedAnswers[q.id] !== undefined;
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
      {/* INSTRUCTOR MODAL 1: GRADING DESK MODAL                    */}
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
                  placeholder="e.g. Excellent orbital resonance demonstration. Ensure you explicitly note the arenium ion charge localization..."
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
                  Save Grade & Send Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INSTRUCTOR MODAL 2: ADD LECTURE MODULE MODAL              */}
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
                  {CHEMISTRY_COURSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
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
                  placeholder="e.g. Thermodynamic Derivation of van 't Hoff Isochore"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Video Duration
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
      {/* STUDENT MODAL: SUBMIT PROBLEM SET                         */}
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
                  placeholder="Detail your thermodynamic steps, electron pushing logic, or attach your work link..."
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
