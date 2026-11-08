'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CHEMISTRY_COURSES } from '@/data/mock-data';
import { getStoredCourses, syncWithServerCourses } from '@/lib/courses-storage';
import { checkUserCourseAccess, requestCourseEnrollment } from '@/lib/enrollment-storage';
import { ChemistryCourse } from '@/types/lms';
import { AuthUser } from '@/types/auth';
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
} from 'lucide-react';
import { CourseShareModal } from '@/components/courses/CourseShareModal';
import { captureIncomingReferral, getReferralCodeForUser } from '@/lib/referral-system';

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = params?.id as string;

  const [coursesList, setCoursesList] = useState<ChemistryCourse[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'ACTIVE' | 'PENDING' | 'NOT_ENROLLED'>('NOT_ENROLLED');
  const [requestToast, setRequestToast] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    const list = getStoredCourses();
    setCoursesList(list);

    try {
      const saved = localStorage.getItem('phenol_auth_user');
      if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) captureIncomingReferral(ref);
    }
    if (saved) {
        const u: AuthUser = JSON.parse(saved);
        setCurrentUser(u);
        const access = checkUserCourseAccess(u, courseId);
        setEnrollmentStatus(access.status === 'ACTIVE' ? 'ACTIVE' : access.status === 'PENDING' ? 'PENDING' : 'NOT_ENROLLED');
      }
    } catch (e) {}

    const handleCoursesUpdate = () => {
      setCoursesList(getStoredCourses());
    };
    window.addEventListener('phenol_courses_updated', handleCoursesUpdate);

    // Sync from server API
    syncWithServerCourses().then(() => {
      setCoursesList(getStoredCourses());
    });

    return () => {
      window.removeEventListener('phenol_courses_updated', handleCoursesUpdate);
    };
  }, [courseId]);

  const course = coursesList.find((c) => c.id === courseId);
  const lessons = course?.lessons || [];
  const firstLesson = lessons[0];

  const handleRequestActivation = () => {
    if (!currentUser || !course) return;
    requestCourseEnrollment(currentUser, course);
    setEnrollmentStatus('PENDING');
    setRequestToast(true);
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
                <PhenolLogo size={36} subtitle="Dr. Omar Magdi" />
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
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Course activation request submitted to Dr. Omar Magdi. Your access will be reviewed and activated shortly.</span>
              </div>
              <button
                onClick={() => setRequestToast(false)}
                className="text-emerald-800 hover:text-emerald-950 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-charcoal-100 font-sans">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <span>Supervision: <strong className="text-charcoal-900 font-sans">Dr. Omar Magdi</strong></span>
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
                <span>Activation pending review by Dr. Omar Magdi</span>
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

        {/* Syllabus / Lessons Table */}
        <div className="space-y-4">
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
