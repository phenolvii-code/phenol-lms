'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CHEMISTRY_COURSES } from '@/data/mock-data';
import { getStoredCourses, syncWithServerCourses } from '@/lib/courses-storage';
import { getStudentAcademicCode } from '@/lib/student-code';
import {
  checkUserCourseAccess,
  requestCourseEnrollment,
  recordStudentLessonProgress,
} from '@/lib/enrollment-storage';
import { ChemistryCourse, ChemistryLesson, LectureTimestamp } from '@/types/lms';
import { AuthUser } from '@/types/auth';
import { getPersistentAvatar } from '@/lib/user-profile';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { PhenolVideoPlayer } from '@/components/video/PhenolVideoPlayer';
import { getLessonMedia } from '@/lib/data/courses';
import { useSessionEnforcer } from '@/lib/auth/session-tracker';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Send,
  Sparkles,
  Layers,
  ShieldCheck,
  Check,
  HelpCircle,
  Menu,
  X,
  Lock,
} from 'lucide-react';

interface LessonComment {
  id: string;
  authorName: string;
  authorCode: string;
  authorRole: 'STUDENT' | 'INSTRUCTOR';
  content: string;
  timestamp: string;
}

export default function LessonExperiencePage() {
  const params = useParams();
  const courseId = params?.id as string;
  const lessonId = params?.lessonId as string;

  const [coursesList, setCoursesList] = useState<ChemistryCourse[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'timestamps' | 'pdf' | 'qa'>('summary');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  // Lesson Q&A State
  const [lessonComments, setLessonComments] = useState<LessonComment[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [gatedMedia, setGatedMedia] = useState<{ video_url?: string; pdf_notes_path?: string } | null>(null);

  useSessionEnforcer();

  // Load Course and User State
  useEffect(() => {
    setCoursesList(getStoredCourses());
    if (lessonId) { getLessonMedia(lessonId).then((m) => { if (m) setGatedMedia(m); }); }
    syncWithServerCourses().then(() => {
      setCoursesList(getStoredCourses());
    });

    try {
      const savedUser = localStorage.getItem('phenol_auth_user');
      if (savedUser) {
        const u: AuthUser = JSON.parse(savedUser);
        if (u?.email) {
          u.avatar = getPersistentAvatar(u.email, u.avatar);
        }
        setCurrentUser(u);
      }

      const savedCompleted = localStorage.getItem('phenol_completed_lessons');
      if (savedCompleted) {
        setCompletedLessons(JSON.parse(savedCompleted));
      }

      const savedComments = localStorage.getItem(`phenol_qa_${lessonId}`);
      if (savedComments) {
        setLessonComments(JSON.parse(savedComments));
      } else {
        // Initial sample Q&A
        setLessonComments([
          {
            id: 'qa-1',
            authorName: 'Youssef Mansour',
            authorCode: 'PH-4821-Y',
            authorRole: 'STUDENT',
            content: 'Dr. Omar, does resonance delocalization in phenol increase or decrease electron density on the oxygen atom compared to aliphatic alcohols?',
            timestamp: 'Yesterday at 04:30 PM',
          },
          {
            id: 'qa-2',
            authorName: 'Dr. Omar Magdi',
            authorCode: 'DIR-OMAR-01',
            authorRole: 'INSTRUCTOR',
            content: 'Excellent inquiry, Youssef. Resonance delocalization withdraws the unshared electron pair from oxygen into the aromatic ring, reducing oxygen electron density and making the O-H bond significantly more polarized and labile, facilitating proton release.',
            timestamp: 'Yesterday at 05:15 PM',
          },
        ]);
      }
    } catch (e) {}
  }, [lessonId]);

  const course = coursesList.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100">
        <header className="border-b border-hairline bg-ivory-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <Link href="/" aria-label="PHENOL Home">
                <PhenolLogo size={34} subtitle="Dr. Omar Magdi" />
              </Link>
              {currentUser ? (
                <Link
                  href="/dashboard"
                  className="px-3.5 py-1.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet"
                >
                  {currentUser.role === 'INSTRUCTOR' ? 'Dashboard' : 'My Account'}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-sm"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-xl mx-auto w-full px-4 py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-burgundy-50 border border-burgundy-200 flex items-center justify-center text-burgundy-500 shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-display text-charcoal-900">
            Loading academic lecture and resources...
          </h2>
          <p className="text-xs text-charcoal-100 leading-relaxed font-sans">
            If this lecture is not available, please verify that it is published within the course curriculum.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-sm"
            >
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const lessons = course.lessons || [];
  const lessonIndex = lessons.findIndex((l) => l.id === lessonId);
  const currentLesson: ChemistryLesson =
    lessonIndex !== -1
      ? lessons[lessonIndex]
      : lessons[0] || {
          id: 'default-les',
          title: 'Lecture In Preparation',
          duration: '45 min',
          type: 'video',
          summary: 'Video and supplementary academic resources are currently being finalized.',
        };

  const prevLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  const isCompleted = completedLessons.includes(currentLesson.id);
  const studentCode = getStudentAcademicCode(currentUser);

  // Toggle Completion & Record Progress in Persistent Roster
  const toggleCompleted = () => {
    let updated: string[];
    if (isCompleted) {
      updated = completedLessons.filter((id) => id !== currentLesson.id);
    } else {
      updated = [...completedLessons, currentLesson.id];
    }
    setCompletedLessons(updated);
    try {
      localStorage.setItem('phenol_completed_lessons', JSON.stringify(updated));
      if (currentUser?.email) {
        recordStudentLessonProgress(
          currentUser.email,
          courseId,
          updated.length,
          lessons.length,
          currentLesson.title
        );
      }
    } catch (e) {}
  };

  // Submit Q&A Comment
  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const newComment: LessonComment = {
      id: `qa-${Date.now()}`,
      authorName: currentUser?.name || 'Enrolled Scholar',
      authorCode: studentCode,
      authorRole: currentUser?.role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT',
      content: newQuestionText.trim(),
      timestamp: 'Just now',
    };

    const updated = [...lessonComments, newComment];
    setLessonComments(updated);
    try {
      localStorage.setItem(`phenol_qa_${lessonId}`, JSON.stringify(updated));
    } catch (e) {}
    setNewQuestionText('');
  };

  // Default Timestamps if not populated
  const timestamps: LectureTimestamp[] = currentLesson.timestamps || [
    { timeSeconds: 0, timeLabel: '00:00', title: 'Introduction & Theoretical Fundamentals' },
    { timeSeconds: 420, timeLabel: '07:00', title: 'Orbital Hybridization & Spatial Geometry' },
    { timeSeconds: 1140, timeLabel: '19:00', title: 'Step-by-Step Reaction Mechanism Analysis' },
    { timeSeconds: 1980, timeLabel: '33:00', title: 'Worked Exam Problems & Diagnostic Applications' },
  ];

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100">
      {/* Top Academic Navigation Bar */}
      <header className="border-b border-hairline bg-ivory-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/" aria-label="PHENOL Home">
                <PhenolLogo size={34} subtitle="Dr. Omar Magdi" />
              </Link>

              <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm text-charcoal-100 font-sans">
                <Link href={`/courses/${course.id}`} className="hover:text-charcoal-900 font-formula font-semibold">
                  {course.code}
                </Link>
                <span>/</span>
                <span className="text-charcoal-900 line-clamp-1 font-medium max-w-sm">
                  {currentLesson.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Syllabus Drawer Trigger */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-hairline text-xs font-semibold text-charcoal-900 hover:border-burgundy-500 bg-ivory-50 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-burgundy-500" />
                <span>Modules ({lessons.length})</span>
              </button>

              <Link
                href={`/courses/${course.id}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-hairline text-xs text-charcoal-100 hover:text-charcoal-900 bg-ivory-100 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Syllabus</span>
              </Link>

              {currentUser ? (
                <Link
                  href="/dashboard"
                  className="px-3.5 py-1.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet"
                >
                  {currentUser.role === 'INSTRUCTOR' ? 'Dashboard' : 'My Account'}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-sm"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Classroom Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Stage: Player + Meta + Tabs (Span 8 or 12 depending on sidebar) */}
          <main className="lg:col-span-8 space-y-6">
            {/* Access Gate: Check if user is enrolled & active */}
            {(() => {
              const access = checkUserCourseAccess(currentUser, courseId);
              if (!access.isEnrolled) {
                return (
                  <div className="relative aspect-video rounded-2xl bg-[#0f1012] border border-hairline/40 flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-editorial text-ivory-100">
                    <div className="w-14 h-14 rounded-full bg-burgundy-950/80 border border-burgundy-700/50 flex items-center justify-center text-ivory-100 shadow-inner">
                      <Lock className="w-6 h-6 text-burgundy-400" />
                    </div>
                    <div className="max-w-md space-y-1.5">
                      <h3 className="text-lg font-bold text-ivory-100 font-display">
                        Academic Content Protected — Activation Required
                      </h3>
                      <p className="text-xs text-ivory-200/70 font-sans leading-relaxed">
                        This lecture is part of ({course.title}) and requires active enrollment authorized by Dr. Omar Magdi.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      {access.status === 'PENDING' ? (
                        <span className="px-5 py-2.5 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Course activation request is currently pending review</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (currentUser) {
                              requestCourseEnrollment(currentUser, course);
                              window.location.reload();
                            }
                          }}
                          className="px-6 py-2.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-sm flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Request Course Activation Now</span>
                        </button>
                      )}

                      <Link
                        href="/dashboard"
                        className="px-5 py-2.5 rounded bg-white/10 hover:bg-white/15 text-ivory-100 text-xs font-semibold transition-colors"
                      >
                        Return to Dashboard
                      </Link>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <PhenolVideoPlayer
                    videoUrl={gatedMedia?.video_url || currentLesson.videoUrl || 'https://www.youtube.com/watch?v=k3rRrl9J2F4'}
                    title={currentLesson.title}
                    duration={currentLesson.duration}
                    studentCode={studentCode}
                    studentName={currentUser?.name}
                    studentPhone={currentUser?.phone || currentUser?.whatsapp}
                    timestamps={timestamps}
                    onCompleted={() => {
                      if (!completedLessons.includes(currentLesson.id)) {
                        toggleCompleted();
                      }
                    }}
                    seekTime={seekTime}
                  />

                  {/* Action Ribbon below player */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-ivory-100 border border-hairline rounded shadow-quiet">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleCompleted}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold transition-colors border font-sans ${
                          isCompleted
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-ivory-200 border-hairline text-charcoal-100 hover:text-charcoal-900'
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-600' : 'text-charcoal-50'}`} />
                        <span>{isCompleted ? 'Completed' : 'Mark as Completed'}</span>
                      </button>

                      <div className="flex items-center gap-1.5 text-xs text-charcoal-100 font-formula">
                        <Clock className="w-3.5 h-3.5 text-charcoal-50" />
                        <span>{currentLesson.duration}</span>
                      </div>

                      <span className="text-hairline">|</span>

                      <span className="text-[11px] font-mono text-charcoal-50">
                        Security Token: <code className="text-burgundy-500 font-bold">{studentCode}</code>
                      </span>
                    </div>

                    {/* Previous / Next Lecture Navigation */}
                    <div className="flex items-center gap-2">
                      {prevLesson && (
                        <Link
                          href={`/courses/${course.id}/lessons/${prevLesson.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-hairline hover:bg-ivory-300 text-xs font-semibold text-charcoal-900 transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous</span>
                        </Link>
                      )}

                      {nextLesson ? (
                        <Link
                          href={`/courses/${course.id}/lessons/${nextLesson.id}`}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet"
                        >
                          <span>Next Lecture</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet"
                        >
                          <span>Complete Course</span>
                          <Check className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Lecture Heading */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                  {course.code} • Lecture 0{lessonIndex + 1}
                </span>
                <span className="text-xs text-charcoal-50 font-sans">
                  {course.categoryName}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display">
                {currentLesson.title}
              </h1>
            </div>

            {/* Academic Companion Tabs */}
            <div className="border border-hairline rounded bg-ivory-100 overflow-hidden shadow-quiet">
              <div className="flex border-b border-hairline bg-ivory-200 overflow-x-auto text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'summary'
                      ? 'border-burgundy-500 text-burgundy-500 bg-ivory-100'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Summary & Formulas</span>
                </button>

                <button
                  onClick={() => setActiveTab('timestamps')}
                  className={`px-4 py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'timestamps'
                      ? 'border-burgundy-500 text-burgundy-500 bg-ivory-100'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Lecture Chapters</span>
                  <span className="font-formula text-[10px] px-1.5 py-0.2 rounded-full bg-ivory-300">
                    {timestamps.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('pdf')}
                  className={`px-4 py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'pdf'
                      ? 'border-burgundy-500 text-burgundy-500 bg-ivory-100'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Handout</span>
                </button>

                <button
                  onClick={() => setActiveTab('qa')}
                  className={`px-4 py-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'qa'
                      ? 'border-burgundy-500 text-burgundy-500 bg-ivory-100'
                      : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Classroom Q&A</span>
                  <span className="font-formula text-[10px] px-1.5 py-0.2 rounded-full bg-burgundy-50 text-burgundy-500">
                    {lessonComments.length}
                  </span>
                </button>
              </div>

              <div className="p-6">
                {/* TAB 1: SUMMARY & FORMULAS */}
                {activeTab === 'summary' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-xs font-formula text-burgundy-500 font-bold uppercase tracking-wider block">
                        THEORETICAL DERIVATION
                      </span>
                      <p className="text-sm text-charcoal-100 font-sans leading-relaxed">
                        {currentLesson.summary}
                      </p>
                    </div>

                    {currentLesson.keyFormulas && currentLesson.keyFormulas.length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <span className="text-xs font-bold text-charcoal-900 font-sans block">
                          Governing Laws & Reaction Formulas:
                        </span>
                        <div className="grid grid-cols-1 gap-2">
                          {currentLesson.keyFormulas.map((formula, idx) => (
                            <div
                              key={idx}
                              className="font-formula text-xs bg-ivory-200/80 p-3 rounded border border-hairline text-charcoal-900 flex items-center justify-between"
                            >
                              <span>{formula}</span>
                              <span className="text-[10px] text-burgundy-500 font-bold uppercase">Eq. 0{idx + 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-burgundy-50/50 border border-burgundy-100 rounded space-y-1 text-xs text-charcoal-100 leading-relaxed font-sans">
                      <strong className="text-burgundy-900 font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-burgundy-500" />
                        <span>Dr. Omar Magdi Analytical Note:</span>
                      </strong>
                      <p className="text-burgundy-950">
                        Never memorize reaction products in isolation. Follow the electron trajectory (curved arrows) from the nucleophile to the electrophilic carbon to understand why the transformation is thermodynamically favorable.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: TIMESTAMPS & CHAPTERS */}
                {activeTab === 'timestamps' && (
                  <div className="space-y-4">
                    <div className="text-xs text-charcoal-100 font-sans">
                      Click any chapter to jump the lecture stream directly to that key concept:
                    </div>

                    <div className="divide-y divide-hairline border border-hairline rounded overflow-hidden">
                      {timestamps.map((ts, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSeekTime(ts.timeSeconds)}
                          className="w-full p-3.5 bg-ivory-50 hover:bg-ivory-200 transition-colors flex items-center justify-between text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-burgundy-500 bg-burgundy-50 group-hover:bg-burgundy-100 px-2 py-0.5 rounded border border-burgundy-200">
                              {ts.timeLabel}
                            </span>
                            <span className="text-xs font-medium text-charcoal-900 group-hover:text-burgundy-700 font-sans">
                              {ts.title}
                            </span>
                          </div>

                          <span className="text-[11px] text-charcoal-50 group-hover:text-burgundy-500 font-sans">
                            Jump to section →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: PDF HANDOUT */}
                {activeTab === 'pdf' && (
                  <div className="space-y-4">
                    <div className="p-5 border border-hairline rounded bg-ivory-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded bg-burgundy-100 text-burgundy-700 flex items-center justify-center shrink-0 border border-burgundy-200">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-charcoal-900 font-display">
                            {currentLesson.pdfNotesName || `${currentLesson.title} — Lecture Booklet`}
                          </h4>
                          <span className="text-xs text-charcoal-50 block font-sans">
                            Official companion booklet formatted by Dr. Omar Magdi • 18 Pages • High-Resolution PDF
                          </span>
                        </div>
                      </div>

                      <a
                        href={currentLesson.pdfNotesUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Booklet</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* TAB 4: Q&A DISCUSSION */}
                {activeTab === 'qa' && (
                  <div className="space-y-6">
                    {/* Ask Question Composer */}
                    <form onSubmit={handlePostQuestion} className="space-y-2.5 border border-hairline rounded p-4 bg-ivory-50">
                      <label className="block text-xs font-semibold text-charcoal-900 font-sans">
                        Ask Dr. Omar Magdi a question about this lecture:
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder="Type your scientific question or inquiry regarding reaction mechanisms, equations, or concepts..."
                        className="w-full p-2.5 text-xs bg-ivory-100 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500 leading-relaxed"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet flex items-center gap-1.5"
                        >
                          <Send className="w-3 h-3" />
                          <span>Submit Question</span>
                        </button>
                      </div>
                    </form>

                    {/* Questions Feed */}
                    <div className="space-y-3">
                      {lessonComments.map((comment) => (
                        <div
                          key={comment.id}
                          className={`p-4 rounded border text-xs space-y-1.5 ${
                            comment.authorRole === 'INSTRUCTOR'
                              ? 'bg-burgundy-50/70 border-burgundy-200'
                              : 'bg-ivory-50 border-hairline'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-charcoal-900 font-sans">
                                {comment.authorName}
                              </span>
                              {comment.authorRole === 'INSTRUCTOR' ? (
                                <span className="font-formula text-[10px] px-2 py-0.2 rounded bg-burgundy-500 text-ivory-100 font-bold uppercase">
                                  Instructor
                                </span>
                              ) : (
                                <span className="font-mono text-[10px] text-charcoal-50">
                                  ({comment.authorCode})
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-charcoal-50 font-sans">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-charcoal-900 font-sans leading-relaxed text-xs">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Sidebar: Course Modules & Syllabus Tracker (Span 4) */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="border border-hairline rounded bg-ivory-100 p-5 space-y-4 shadow-quiet">
              <div className="border-b border-hairline pb-3 space-y-1">
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase block">
                  COURSE SYLLABUS
                </span>
                <h3 className="text-base font-bold text-charcoal-900 font-display">
                  {course.title}
                </h3>
                <div className="pt-2 flex items-center justify-between text-xs text-charcoal-50 font-mono">
                  <span>Progress</span>
                  <span>
                    {completedLessons.filter((id) => course.lessons.some((l) => l.id === id)).length} of{' '}
                    {course.lessons.length} Modules
                  </span>
                </div>
                <div className="w-full bg-ivory-300 rounded-full h-1.5 overflow-hidden mt-1">
                  <div
                    className="bg-burgundy-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (completedLessons.filter((id) => course.lessons.some((l) => l.id === id)).length /
                          (course.lessons.length || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Lesson Module List */}
              <div className="space-y-2">
                {course.lessons.map((les, idx) => {
                  const isCurrent = les.id === currentLesson.id;
                  const isDone = completedLessons.includes(les.id);

                  return (
                    <Link
                      key={les.id}
                      href={`/courses/${course.id}/lessons/${les.id}`}
                      className={`block p-3 rounded text-xs transition-colors border ${
                        isCurrent
                          ? 'bg-burgundy-50 border-burgundy-500 text-charcoal-900 shadow-quiet'
                          : 'bg-ivory-50 border-hairline text-charcoal-100 hover:bg-ivory-200 hover:text-charcoal-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="font-formula text-[11px] font-bold text-burgundy-500">
                              0{idx + 1}
                            </span>
                          )}
                          <span className={`font-medium line-clamp-1 ${isCurrent ? 'font-bold text-charcoal-900' : ''}`}>
                            {les.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-charcoal-50 font-formula pl-5">
                        <span>{les.duration}</span>
                        {isCurrent && <span className="text-burgundy-600 font-sans font-bold">Now Playing</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Academic Integrity / Watermark Protection Notice */}
            <div className="border border-hairline rounded bg-ivory-100 p-4 space-y-2 text-xs font-sans shadow-quiet">
              <div className="flex items-center gap-1.5 font-bold text-charcoal-900">
                <ShieldCheck className="w-4 h-4 text-burgundy-500 shrink-0" />
                <span>Forensic Stream Integrity</span>
              </div>
              <p className="text-charcoal-50 text-[11px] leading-relaxed">
                All video streams are digitally watermarked with your unique Academic Forensic Code (
                <code className="text-burgundy-600 font-bold">{studentCode}</code>). Unauthorized recording or distribution is strictly monitored.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
