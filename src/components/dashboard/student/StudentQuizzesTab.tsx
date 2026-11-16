'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChemistryCourse, ChemistryQuiz } from '@/types/lms';
import { CourseEnrollmentRecord } from '@/lib/data/enrollments';
import { fetchCourseQuizzes } from '@/lib/data/quizzes';

interface StudentQuizzesTabProps {
  courses: ChemistryCourse[];
  enrollments: CourseEnrollmentRecord[];
}

/**
 * REAL evaluation-quizzes tab (task هـ). Lists the quizzes of the student's
 * ACTIVELY-enrolled courses via the DB RPC (no mock data, and the answer key
 * never reaches the browser - questions and grading live on the server).
 * "Start" opens the real exam room at /courses/[id]/quizzes/[quizId].
 */
export function StudentQuizzesTab({ courses, enrollments }: StudentQuizzesTabProps) {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<ChemistryQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      // Only courses with an ACTIVE enrollment (the RPC verifies enrollment
      // again server-side - the client filter is just to avoid noisy calls).
      const activeIds = new Set(
        enrollments.filter((e) => e.status === 'ACTIVE').map((e) => e.course_id)
      );
      const activeCourses = courses.filter((c) => activeIds.has(c.id));

      const results = await Promise.all(
        activeCourses.map(async (course) => {
          const list = await fetchCourseQuizzes(course.id);
          return list.map((q) => ({
            ...q,
            courseId: course.id,
            courseTitle: course.title,
          }));
        })
      );

      if (!cancelled) {
        setQuizzes(results.flat());
        setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [courses, enrollments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-hairline pb-4">
        <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider">
          EVALUATION QUIZZES
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display mt-1">
          Course Evaluation Quizzes
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-100 mt-1 font-sans">
          Timed quizzes from your active courses — graded by the database; the
          answer key never reaches your browser.
        </p>
      </div>

      {isLoading ? (
        <div className="border border-hairline rounded bg-ivory-100 p-10 text-center text-xs text-charcoal-50 font-sans">
          Loading quizzes…
        </div>
      ) : quizzes.length === 0 ? (
        <div className="border border-hairline rounded bg-ivory-100 p-10 text-center">
          <h3 className="font-bold text-sm text-charcoal-900 font-display">
            No quizzes available yet
          </h3>
          <p className="text-xs text-charcoal-100 font-sans mt-1">
            When your instructor publishes a quiz for one of your active
            courses, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="border border-hairline rounded bg-ivory-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-quiet"
            >
              <div className="space-y-1">
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                  {quiz.courseTitle}
                </span>
                <h3 className="text-base font-bold text-charcoal-900 font-display">
                  {quiz.title}
                </h3>
                <span className="text-xs text-charcoal-50 font-sans block">
                  {quiz.questionCount} Questions • {quiz.durationMinutes} Minutes
                </span>
              </div>

              <button
                onClick={() => router.push(`/courses/${quiz.courseId}/quizzes/${quiz.id}`)}
                className="px-5 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet shrink-0"
              >
                Start Quiz
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
