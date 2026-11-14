'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CHEMISTRY_COURSES } from '@/data/mock-data';
import { getStoredCourses, syncWithServerCourses } from '@/lib/courses-storage';
import { requestEnrollment, listMyEnrollments } from '@/lib/data/enrollments';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { ChemistryCourse, ChemistryQuiz } from '@/types/lms';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import {
  ArrowRight,
  Clock,
  Play,
  FlaskConical,
  ChevronRight,
  Lock,
  CheckCircle2,
  Sparkles,
  Share2,
  Award,
  BookOpen,
  FileQuestion,
} from 'lucide-react';
import { CourseShareModal } from '@/components/courses/CourseShareModal';
import { getReferralCodeForUser } from '@/lib/referral-system';
import { fetchCourseQuizzes } from '@/lib/data/quizzes';
import { getCourseQuestionBank } from '@/data/question-banks';
import { CourseQuestionBankView } from '@/components/courses/CourseQuestionBankView';

export default function CourseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  const [coursesList, setCoursesList] = useState<ChemistryCourse[]>([]);
  const { user: currentUser } = useCurrentUser();
  const [enrollmentStatus, setEnrollmentStatus] = useState<'ACTIVE' | 'PENDING' | 'NOT_ENROLLED'>('NOT_ENROLLED');
  const [requestToast, setRequestToast] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'curriculum' | 'quizzes' | 'question_bank'>('curriculum');
  const [quizzes, setQuizzes] = useState<ChemistryQuiz[]>([]);

  useEffect(() => {
    fetchCourseQuizzes(courseId).then(setQuizzes);
  }, [courseId]);

  useEffect(() => {
    const list = getStoredCourses();
    setCoursesList(list);

    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const ref = p.get('ref');
      if (ref) {
        sessionStorage.setItem('phenol_ref_code', ref);
        localStorage.setItem('phenol_ref_code', ref);
      }
    }

    const handleCoursesUpdate = () => {
      setCoursesList(getStoredCourses());
    };
    window.addEventListener('phenol_courses_updated', handleCoursesUpdate);

    syncWithServerCourses().then(() => {
      setCoursesList(getStoredCourses());
    });

    return () => {
      window.removeEventListener('phenol_courses_updated', handleCoursesUpdate);
    };
  }, [courseId]);

  useEffect(() => {
    async function loadEnrollment() {
      if (!currentUser) {
        setEnrollmentStatus('NOT_ENROLLED');
        return;
      }
      if (currentUser.role === 'INSTRUCTOR') {
        setEnrollmentStatus('ACTIVE');
        return;
      }
      try {
        const enrs = await listMyEnrollments();
        const enr = enrs.find((e) => e.course_id === courseId);
        if (enr?.status === 'ACTIVE') {
          setEnrollmentStatus('ACTIVE');
        } else if (enr?.status === 'PENDING') {
          setEnrollmentStatus('PENDING');
        } else {
          setEnrollmentStatus('NOT_ENROLLED');
        }
      } catch (err) {
        console.error('Error fetching enrollment status:', err);
      }
    }
    loadEnrollment();
  }, [currentUser, courseId]);

  const course = coursesList.find((c) => c.id === courseId);
  const lessons = course?.lessons || [];
  const firstLesson = lessons[0];
  const questionBank = course
    ? getCourseQuestionBank(course.id, course.title, course.code)
    : null;

  const handleRequestActivation = async () => {
    if (!currentUser) {
      router.push(`/login?redirect=/courses/${courseId}`);
      return;
    }
    if (!course) return;
    try {
      setErrorMessage('');
      await requestEnrollment(courseId);
      setEnrollmentStatus('PENDING');
      setRequestToast(true);
    } catch (err: any) {
      console.error('Error requesting enrollment:', err);
      setErrorMessage(err.message || 'Failed to submit activation request');
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100">
        <header className="border-b border-hairline bg-ivory-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <Link href="/" aria-label="PHENOL Home">
                <PhenolLogo size={36} subtitle="Dr. Omar Magdi" />
              </Link>
              <div className="flex items-center gap-3">
                {currentUser ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm text-charcoal-100 hover:text-charcoal-900 border border-hairline rounded transition-colors font-sans"
                  >
                    <span>{currentUser.role === 'INSTRUCTOR' ? 'Admin Portal' : 'Student Dashboard'}</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm text-ivory-100 bg-burgundy-900 hover:bg-black rounded transition-colors font-sans font-semibold shadow-sm"
                  >
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-xl mx-auto w-full px-4 py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-burgundy-50 border border-burgundy-200 flex items-center justify-center text-burgundy-500 shadow-sm">
            <FlaskConical className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-charcoal-900">
              Verifying and loading course curriculum...
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
              If the course does not appear, please verify it in the dashboard or return to the course catalog.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-3">
            {currentUser?.role === 'INSTRUCTOR' ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : null}
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-ivory-100 border border-hairline hover:bg-ivory-50 text-charcoal-900 text-xs font-semibold transition-colors"
            >
              <span>Home</span>
            </Link>
          </div>
    </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100">
      {/* Top Academic Navigation */}
      <header className="border-b border-hairline bg-ivory-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-6">
              <Link href="/" aria-label="PHENOL Home">
                <PhenolLogo size={36} />
              </Link>

              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-charcoal-100 font-sans">
                <Link href="/" className="hover:text-charcoal-900 transition-colors">
                  Home
                </Link>
                <span>/</span>
                {currentUser ? (
                  <>
                    <Link href="/dashboard" className="hover:text-charcoal-900 transition-colors">
                      {currentUser.role === 'INSTRUCTOR' ? 'Dashboard' : 'My Courses'}
                    </Link>
                    <span>/</span>
                  </>
                ) : (
                  <>
                    <Link href="/#programs" className="hover:text-charcoal-900 transition-colors">
                      Courses
                    </Link>
                    <span>/</span>
                  </>
                )}
                <span className="font-semibold text-charcoal-900 font-formula">
                  {course.code}
                </span>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {currentUser ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm text-charcoal-100 hover:text-charcoal-900 border border-hairline rounded transition-colors font-sans"
                >
                  <span>{currentUser.role === 'INSTRUCTOR' ? 'Admin Portal' : 'Student Dashboard'}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm text-ivory-100 bg-burgundy-900 hover:bg-black rounded transition-colors font-sans font-semibold shadow-sm"
                >
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Course Details Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* Course Masthead */}
        <div className="border border-hairline rounded bg-ivory-100 p-6 sm:p-10 space-y-6 shadow-quiet">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div className="flex items-center gap-3">
              <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 px-2.5 py-1 rounded border border-burgundy-200">
                {course.code}
              </span>
              <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">
                Level: {course.level}
              </span>
            </div>

            {course.molecularFormula && (
              <span className="font-formula text-xs sm:text-sm text-charcoal-900 font-semibold bg-ivory-300 px-3 py-1 rounded border border-hairline">
                {course.molecularFormula}
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
              {course.title}
            </h1>
            <p className="text-sm sm:text-base text-charcoal-100 font-sans">
              {course.subTitle}
            </p>
          </div>

          <p className="text-sm text-charcoal-100 font-sans leading-relaxed pt-1">
            {course.description}
          </p>

          {/* Enrollment Request Toast */}
          {requestToast && (
            <div className="p-4 rounded-xl bg-ivory-100 border border-hairline text-charcoal-900 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-quiet animate-fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-ochre-500 shrink-0" />
                <span className="font-sans leading-relaxed">
                  Course activation request submitted to {course.instructorName || 'Dr. Omar Magdi'}. Your access will be reviewed and activated shortly.
                </span>
              </div>
              <button
                onClick={() => setRequestToast(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold px-1 transition-colors"
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-charcoal-100 font-sans">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <span>
                Supervision:{' '}
                <Link
                  href={`/faculty/${course.instructorId || 'dr-omar-magdi'}`}
                  className="text-burgundy-600 hover:text-burgundy-900 font-bold underline underline-offset-2 transition-colors"
                >
                  {course.instructorName || 'Dr. Omar Magdi'}
                </Link>
              </span>
              <span>Program: <strong className="text-charcoal-900 font-sans">{course.categoryName}</strong></span>
              <span>Duration: <strong className="text-charcoal-900 font-sans">{course.totalHours}</strong></span>
            </div>

            {enrollmentStatus === 'ACTIVE' ? (
              firstLesson ? (
                <Link
                  href={`/courses/${course.id}/lessons/${firstLesson.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded bg-burgundy-900 hover:bg-black text-ivory-100 font-semibold text-xs sm:text-sm transition-colors shadow-quiet"
                >
                  <Play className="w-4 h-4" />
                  <span>Begin Syllabus</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded bg-ivory-300 text-charcoal-100 font-semibold text-xs sm:text-sm border border-hairline">
                  <span>Coming Soon: Lectures in preparation</span>
                </span>
              )
            ) : enrollmentStatus === 'PENDING' ? (
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded bg-amber-100 text-amber-900 font-semibold text-xs sm:text-sm border border-amber-200">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Activation pending review by {course.instructorName || 'Dr. Omar Magdi'}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestActivation}
                className="inline-flex items-center gap-2 px-6 py-3 rounded bg-burgundy-900 hover:bg-black text-ivory-100 font-semibold text-xs sm:text-sm transition-colors shadow-quiet"
              >
                <Sparkles className="w-4 h-4" />
                <span>Request Course Activation Now</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded bg-ivory-100 hover:bg-ivory-300 border border-hairline text-charcoal-900 font-semibold text-xs sm:text-sm transition-colors shadow-quiet"
            >
              <Share2 className="w-4 h-4 text-burgundy-500" />
              <span>Share & Earn Points</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-hairline pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'curriculum'
                ? 'bg-burgundy-900 text-ivory-100 shadow-sm'
                : 'bg-ivory-100 hover:bg-ivory-300 text-charcoal-100 border border-hairline'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Course Lectures ({lessons.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quizzes')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'quizzes'
                ? 'bg-burgundy-900 text-ivory-100 shadow-sm'
                : 'bg-ivory-100 hover:bg-ivory-300 text-charcoal-100 border border-hairline'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Timed Quizzes ({quizzes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('question_bank')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'question_bank'
                ? 'bg-burgundy-900 text-ivory-100 shadow-sm'
                : 'bg-ivory-100 hover:bg-ivory-300 text-charcoal-100 border border-hairline'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            <span>Question Bank ({questionBank?.questions.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: CURRICULUM */}
        {activeTab === 'curriculum' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
                  Course Lectures & Modules ({lessons.length} Lectures)
                </h2>
                <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
                  Deductive progression dissecting chemical principles without cognitive leaps.
                </p>
              </div>
              {enrollmentStatus !== 'ACTIVE' && (
                <span className="text-xs font-mono text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded">
                  Enrollment activation required to watch
                </span>
              )}
            </div>

            {lessons.length > 0 ? (
              <div className="border border-hairline rounded bg-ivory-100 divide-y divide-hairline shadow-quiet">
                {lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="p-5 sm:p-6 hover:bg-ivory-300/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2.5 max-w-2xl">
                      <div className="flex items-center gap-3">
                        <span className="font-formula text-sm font-bold text-burgundy-500">
                          {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                        </span>

                        <h3 className="font-bold text-base text-charcoal-900 font-display">
                          {lesson.title}
                        </h3>

                        {lesson.type === 'lab' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            <FlaskConical className="w-3.5 h-3.5" /> Virtual Lab
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
                        {lesson.summary}
                      </p>

                      {lesson.keyFormulas && lesson.keyFormulas.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {lesson.keyFormulas.map((formula, fIdx) => (
                            <span
                              key={fIdx}
                              className="font-formula text-xs text-charcoal-900 bg-ivory-300 px-2.5 py-1 rounded border border-hairline"
                            >
                              {formula}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline">
                      <span className="font-formula text-xs sm:text-sm text-charcoal-50">
                        {lesson.duration}
                      </span>

                      {enrollmentStatus === 'ACTIVE' ? (
                        <Link
                          href={`/courses/${course.id}/lessons/${lesson.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded border border-hairline hover:border-burgundy-500 hover:text-burgundy-500 bg-ivory-100 text-xs sm:text-sm font-semibold font-sans transition-colors"
                        >
                          <span>Enter Lecture</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRequestActivation}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-ivory-200 text-charcoal-50 text-xs font-semibold font-sans cursor-pointer hover:bg-ivory-300 transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Course Activation Required</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-hairline rounded-xl bg-ivory-100 p-10 text-center space-y-3 shadow-quiet">
                <Sparkles className="w-8 h-8 text-burgundy-500 mx-auto" />
                <h3 className="text-base font-bold text-charcoal-900 font-display">
                  No lectures uploaded for this course yet
                </h3>
                <p className="text-xs text-charcoal-100 font-sans max-w-md mx-auto">
                  This course is newly created and currently being prepared. You can add lectures, videos, and PDF handouts via the Admin Dashboard.
                </p>
                {currentUser?.role === 'INSTRUCTOR' && (
                  <div className="pt-2">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
                    >
                      <span>Go to Dashboard to Add Lectures</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TIMED QUIZZES */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
                  Timed Assessment Quizzes ({quizzes.length})
                </h2>
                <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
                  Rigorous MCQ challenges assessing reaction mechanisms and analytical problem sets.
                </p>
              </div>
              {enrollmentStatus !== 'ACTIVE' && (
                <span className="text-xs font-mono text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded">
                  Activation required
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((q) => (
                <div
                  key={q.id}
                  className="p-5 sm:p-6 rounded-xl border border-hairline bg-ivory-100 shadow-quiet space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-formula text-[10px] text-burgundy-600 font-bold bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                        {q.badge || 'TIMED EVALUATION'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-charcoal-50">
                        <Clock className="w-3.5 h-3.5 text-burgundy-500" />
                        <span>{q.durationMinutes || 15} Mins</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-charcoal-900 font-display">
                      {q.title}
                    </h3>

                    <p className="text-xs text-charcoal-100 leading-relaxed font-sans line-clamp-2">
                      {q.courseTitle || 'Interactive chemistry diagnostic challenge with model solution breakdown.'}
                    </p>

                    <div className="text-[11px] font-mono text-charcoal-50 pt-1">
                      <span>{q.questions.length} Diagnostic MCQ Questions</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-hairline">
                    {enrollmentStatus === 'ACTIVE' ? (
                      <Link
                        href={`/courses/${course.id}/quizzes/${q.id}`}
                        className="w-full py-2.5 px-4 rounded-lg bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <span>Enter Assessment Room</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestActivation}
                        className="w-full py-2 px-3 rounded-lg bg-ivory-200 text-charcoal-50 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Course Activation Required</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STATIC QUESTION BANK */}
        {activeTab === 'question_bank' && questionBank && (
          <div className="animate-fade-in">
            <CourseQuestionBankView bank={questionBank} />
          </div>
        )}
        {/* Course Share & Referral Modal */}
      <CourseShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        courseId={course.id}
        courseTitle={course.title}
        courseCode={course.code}
        referralCode={getReferralCodeForUser(currentUser)}
      />
    </main>
    </div>
  );
}
