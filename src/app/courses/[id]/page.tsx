'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CHEMISTRY_COURSES } from '@/data/mock-data';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import {
  ArrowLeft,
  Clock,
  Play,
  FlaskConical,
} from 'lucide-react';

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  const course = CHEMISTRY_COURSES.find((c) => c.id === courseId) || CHEMISTRY_COURSES[0];

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100">
      {/* Top Academic Navigation */}
      <header className="border-b border-hairline bg-ivory-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            <div className="flex items-center gap-6">
              <Link href="/" aria-label="PHENOL Home">
                <PhenolLogo size={36} subtitle="د/عمر مجدي" />
              </Link>

              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-charcoal-100 font-sans">
                <Link href="/" className="hover:text-charcoal-900 transition-colors">
                  الرئيسية
                </Link>
                <span>/</span>
                <Link href="/dashboard" className="hover:text-charcoal-900 transition-colors">
                  لوحة الطالب
                </Link>
                <span>/</span>
                <span className="font-semibold text-charcoal-900 font-formula">
                  {course.code}
                </span>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm text-charcoal-100 hover:text-charcoal-900 border border-hairline rounded transition-colors font-sans"
              >
                <span>لوحة المتابعة</span>
              </Link>
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
              <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 px-2.5 py-1 rounded">
                {course.code}
              </span>
              <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">
                المستوى: {course.level}
              </span>
            </div>

            <span className="font-formula text-xs sm:text-sm text-charcoal-900 font-semibold bg-ivory-300 px-3 py-1 rounded border border-hairline">
              {course.molecularFormula}
            </span>
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

          <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-charcoal-100 font-sans">
            <div className="flex items-center gap-6">
              <span>إشراف: <strong className="text-charcoal-900 font-sans">د/عمر مجدي</strong></span>
              <span>المدة: <strong className="text-charcoal-900 font-sans">{course.totalHours}</strong></span>
              <span>التقييم: <strong className="text-charcoal-900 font-sans">{course.rating} / 5.0</strong></span>
            </div>

            <Link
              href={`/courses/${course.id}/lessons/${course.lessons[0].id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 font-semibold text-xs sm:text-sm transition-colors shadow-quiet"
            >
              <Play className="w-4 h-4" />
              <span>بدء دراسة المنهج</span>
            </Link>
          </div>
        </div>

        {/* Syllabus / Lessons Table */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
              منهج ومحاضرات المساق ({course.lessons.length} محاضرات)
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
              تسلسل تعليمي منطقي يفكك المبادئ الكيميائية دون فجوات
            </p>
          </div>

          <div className="border border-hairline rounded bg-ivory-100 divide-y divide-hairline shadow-quiet">
            {course.lessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                className="p-5 sm:p-6 hover:bg-ivory-300/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className="font-editorial text-base font-bold text-burgundy-500">
                      0{idx + 1}
                    </span>

                    <h3 className="font-bold text-base text-charcoal-900 font-display">
                      {lesson.title}
                    </h3>

                    {lesson.type === 'lab' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        <FlaskConical className="w-3.5 h-3.5" /> معمل افتراضي
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed pr-6">
                    {lesson.summary}
                  </p>

                  {lesson.keyFormulas && lesson.keyFormulas.length > 0 && (
                    <div className="pr-6 flex flex-wrap gap-2 pt-1">
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

                  <Link
                    href={`/courses/${course.id}/lessons/${lesson.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded border border-hairline hover:border-burgundy-500 hover:text-burgundy-500 bg-ivory-100 text-xs sm:text-sm font-semibold font-sans transition-colors"
                  >
                    <span>دخول المحاضرة</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
