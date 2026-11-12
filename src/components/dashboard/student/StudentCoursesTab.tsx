'use client';

import React from 'react';
import Link from 'next/link';
import { AcademicCategory, ChemistryCourse } from '@/types/lms';
import { AuthUser } from '@/types/auth';
import { ACADEMIC_TRACKS } from '@/data/mock-data';
import { CourseEnrollmentRecord } from '@/lib/data/enrollments';
import {
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface StudentCoursesTabProps {
  courses: ChemistryCourse[];
  trackFilter: AcademicCategory | 'all';
  setTrackFilter: (val: AcademicCategory | 'all') => void;
  enrollmentToast: string | null;
  setEnrollmentToast: (val: string | null) => void;
  currentUser: AuthUser | null;
  enrollments: CourseEnrollmentRecord[];
  handleRequestCourse: (course: ChemistryCourse) => void;
}

export function StudentCoursesTab({
  courses,
  trackFilter,
  setTrackFilter,
  enrollmentToast,
  setEnrollmentToast,
  currentUser,
  enrollments,
  handleRequestCourse,
}: StudentCoursesTabProps) {
  const displayedCourses =
    trackFilter === 'all'
      ? courses
      : courses.filter((c) => c.category === trackFilter);

  return (
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
          All Programs
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
        <div className="p-4 rounded-xl bg-ivory-100 border border-hairline text-charcoal-900 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-quiet animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-ochre-500 shrink-0" />
            <span className="font-sans leading-relaxed">{enrollmentToast}</span>
          </div>
          <button
            onClick={() => setEnrollmentToast(null)}
            className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold px-1 transition-colors"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedCourses.map((course) => {
          const enr = enrollments.find((e) => e.course_id === course.id);
          const status = currentUser?.role === 'INSTRUCTOR' ? 'ACTIVE' : (enr?.status || 'NOT_ENROLLED');
          return (
            <div
              key={course.id}
              className="border border-hairline rounded bg-ivory-100 p-6 space-y-4 hover:border-charcoal-100/50 transition-colors flex flex-col justify-between shadow-quiet"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-formula text-xs font-bold text-charcoal-900 bg-ivory-200 px-2 py-0.5 rounded border border-hairline">
                    {course.code}
                  </span>
                  {status === 'ACTIVE' ? (
                    <span className="text-[10px] font-mono font-bold text-charcoal-900 bg-ivory-200 border border-hairline px-2.5 py-0.5 rounded flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-ochre-500"></span>
                      <span>Active Access</span>
                    </span>
                  ) : status === 'PENDING' ? (
                    <span className="text-[10px] font-mono font-bold text-ochre-600 bg-ivory-200 border border-hairline px-2.5 py-0.5 rounded flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-ochre-500" />
                      <span>Pending Review</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-charcoal-100 bg-ivory-200 border border-hairline px-2.5 py-0.5 rounded flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-charcoal-50" />
                      <span>Activation Required</span>
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

                {status === 'ACTIVE' ? (
                  <Link
                    href={`/courses/${course.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
                  >
                    <span>Enter Course</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : status === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-amber-100 text-amber-900 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Activation Pending Review</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRequestCourse(course)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Request Course Activation</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
