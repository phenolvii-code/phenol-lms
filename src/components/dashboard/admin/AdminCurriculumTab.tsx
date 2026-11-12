'use client';

import React from 'react';
import Link from 'next/link';
import { AcademicCategory, ChemistryCourse, ChemistryLesson } from '@/types/lms';
import { CourseEnrollmentRecord } from '@/lib/data/enrollments';
import { ACADEMIC_TRACKS, normalizeTrackSlug } from '@/data/mock-data';
import {
  GraduationCap,
  Plus,
  Users,
  Edit3,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface AdminCurriculumTabProps {
  courses: ChemistryCourse[];
  trackFilter: AcademicCategory | 'all';
  setTrackFilter: (val: AcademicCategory | 'all') => void;
  setIsCreateCourseOpen: (val: boolean) => void;
  setNewLectureCourse: (val: string) => void;
  setIsAddLectureOpen: (val: boolean) => void;
  setSelectedCourseForStudents: (c: ChemistryCourse) => void;
  setIsCourseStudentsOpen: (val: boolean) => void;
  enrollments: CourseEnrollmentRecord[];
  handleOpenEditCourse: (c: ChemistryCourse) => void;
  handleDeleteCourse: (id: string, title: string) => void;
  handleOpenEditLesson: (courseId: string, lesson: ChemistryLesson) => void;
  handleDeleteLesson: (courseId: string, lessonId: string, title: string) => void;
}

export function AdminCurriculumTab({
  courses,
  trackFilter,
  setTrackFilter,
  setIsCreateCourseOpen,
  setNewLectureCourse,
  setIsAddLectureOpen,
  setSelectedCourseForStudents,
  setIsCourseStudentsOpen,
  enrollments,
  handleOpenEditCourse,
  handleDeleteCourse,
  handleOpenEditLesson,
  handleDeleteLesson,
}: AdminCurriculumTabProps) {
  const displayedCourses =
    trackFilter === 'all'
      ? courses
      : courses.filter(
          (c) =>
            c.category === trackFilter ||
            c.trackSlug === trackFilter ||
            normalizeTrackSlug(c.category) === trackFilter
        );

  return (
    <div className="space-y-6">
      {/* Header & Track Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 font-display">
            Academic Programs & Courses
          </h2>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Organized under the 4 Academic Programs: Public Secondary (AR & EN), IGCSE & A-Level, and University.
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
              No courses in this program yet
            </h3>
            <p className="text-xs text-charcoal-100 font-sans max-w-md mx-auto">
              You can create a new course under this program and start adding lectures immediately.
            </p>
            <div>
              <button
                type="button"
                onClick={() => setIsCreateCourseOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create New Course Now</span>
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
                    {course.approvalStatus === 'PENDING' ? (
                      <span className="font-formula text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
                        Pending Super Admin Approval
                      </span>
                    ) : course.approvalStatus === 'REJECTED' ? (
                      <span className="font-formula text-xs font-bold text-red-800 bg-red-100 px-2.5 py-0.5 rounded border border-red-300">
                        Proposal Rejected
                      </span>
                    ) : (
                      <span className="font-formula text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Live & Active
                      </span>
                    )}
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
                    title="View enrolled students roster and track performance"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Students & Telemetry</span>
                    {(() => {
                      const pending = enrollments.filter(
                        (e) => (e.course_id === course.id || (e as any).courseId === course.id) && e.status === 'PENDING'
                      ).length;
                      if (pending > 0) {
                        return (
                          <span className="bg-amber-500 text-charcoal-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            {pending} Pending
                          </span>
                        );
                      }
                      const count = enrollments.filter(
                        (e) => (e.course_id === course.id || (e as any).courseId === course.id) && e.status === 'ACTIVE'
                      ).length;
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
                    title="Add a new lecture to this course"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Lecture</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditCourse(course)}
                    title="Edit Course Details"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-hairline hover:border-burgundy-500 text-charcoal-900 hover:text-burgundy-500 bg-ivory-50 text-xs font-semibold transition-colors"
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
                    <p className="font-medium">No lectures added to this course yet.</p>
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
                        <span>Add First Lecture to Course Now</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
