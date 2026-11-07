'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CHEMISTRY_COURSES } from '@/data/mock-data';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function LessonExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;
  const lessonId = params?.lessonId as string;

  const course = CHEMISTRY_COURSES.find((c) => c.id === courseId) || CHEMISTRY_COURSES[0];
  const lessonIndex = course.lessons.findIndex((l) => l.id === lessonId);
  const currentLesson = lessonIndex !== -1 ? course.lessons[lessonIndex] : course.lessons[0];

  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < course.lessons.length - 1 ? course.lessons[lessonIndex + 1] : null;

  const [completed, setCompleted] = useState(currentLesson.completed || false);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100">
      {/* Editorial Top Navigation */}
      <header className="border-b border-hairline bg-ivory-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/" aria-label="PHENOL Home">
                <PhenolLogo size={34} subtitle="د/عمر مجدي" />
              </Link>

              <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-charcoal-100 font-sans">
                <Link href={`/courses/${course.id}`} className="hover:text-charcoal-900 font-formula font-semibold">
                  {course.code}
                </Link>
                <span>/</span>
                <span className="text-charcoal-900 line-clamp-1 font-medium">
                  {currentLesson.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <Link
                href={`/courses/${course.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-hairline text-xs sm:text-sm text-charcoal-100 hover:text-charcoal-900 bg-ivory-100 transition-colors font-sans"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">منهج المساق</span>
              </Link>

              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs sm:text-sm font-semibold transition-colors font-sans"
              >
                لوحة الطالب
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Lesson Environment */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Lecture Player Box */}
        <div className="space-y-4">
          <div className="relative aspect-video w-full rounded bg-charcoal-900 overflow-hidden border border-hairline flex flex-col items-center justify-center text-ivory-100 shadow-lift">
            {!isPlaying ? (
              <div className="text-center space-y-4 p-6 max-w-md">
                <div
                  className="w-16 h-16 rounded-full bg-burgundy-500 hover:bg-burgundy-600 transition-all flex items-center justify-center cursor-pointer mx-auto shadow-lift transform hover:scale-105"
                  onClick={() => setIsPlaying(true)}
                >
                  <Play className="w-7 h-7 text-ivory-100 ml-1" />
                </div>

                <div className="space-y-1.5">
                  <span className="font-formula text-xs text-ivory-300 uppercase tracking-widest block">
                    {course.code} • المحاضرة {lessonIndex + 1}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold font-display text-ivory-100 leading-snug">
                    {currentLesson.title}
                  </h2>
                  <span className="text-xs sm:text-sm text-charcoal-50 font-sans block">
                    المدة: {currentLesson.duration} • إشراف د/عمر مجدي
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-charcoal-900 text-center space-y-3">
                <div className="font-editorial text-xs text-burgundy-200 uppercase tracking-widest">
                  PHENOL LECTURE STREAM
                </div>
                <h3 className="text-sm font-semibold text-ivory-100">
                  {currentLesson.title}
                </h3>
                <p className="text-xs text-charcoal-50 max-w-sm font-sans">
                  يتم تشغيل المحاضرة الأكاديمية بنظام البث المباشر عالي الدقة.
                </p>
                <button
                  onClick={() => setIsPlaying(false)}
                  className="px-4 py-2 rounded bg-charcoal-200 text-ivory-100 text-xs hover:bg-charcoal-100 font-sans"
                >
                  إيقاف مؤقت
                </button>
              </div>
            )}

            {/* Top Bar Overlay */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="font-formula text-xs text-ivory-100/90 bg-charcoal-900/80 px-2.5 py-1 rounded border border-charcoal-200">
                {course.molecularFormula}
              </span>
            </div>
          </div>

          {/* Player Controls & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-hairline rounded bg-ivory-100 shadow-quiet">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCompleted(!completed)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-xs sm:text-sm font-semibold transition-colors border font-sans ${
                  completed
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-ivory-200 border-hairline text-charcoal-100 hover:text-charcoal-900'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{completed ? 'اكتملت المحاضرة' : 'تحديد كمكتملة'}</span>
              </button>

              <span className="text-xs sm:text-sm text-charcoal-100 font-formula">
                {currentLesson.duration}
              </span>
            </div>

            {/* Prev / Next Lesson Navigation */}
            <div className="flex items-center gap-2">
              {prevLesson ? (
                <Link
                  href={`/courses/${course.id}/lessons/${prevLesson.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-hairline hover:bg-ivory-300 text-xs sm:text-sm text-charcoal-900 transition-colors font-sans"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>المحاضرة السابقة</span>
                </Link>
              ) : null}

              {nextLesson ? (
                <Link
                  href={`/courses/${course.id}/lessons/${nextLesson.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs sm:text-sm font-semibold transition-colors font-sans"
                >
                  <span>المحاضرة التالية</span>
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs sm:text-sm font-semibold transition-colors font-sans"
                >
                  <span>إتمام المنهج</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Academic Lesson Notes & Formulas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-hairline rounded bg-ivory-100 p-6 sm:p-8 space-y-5 shadow-quiet">
              <div className="border-b border-hairline pb-4">
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block mb-1">
                  SCIENTIFIC ANALYSIS
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
                  ملخص المحاضرة والاشتقاق العلمي
                </h3>
              </div>

              <p className="text-sm sm:text-base text-charcoal-100 font-sans leading-relaxed">
                {currentLesson.summary}
              </p>

              {currentLesson.keyFormulas && currentLesson.keyFormulas.length > 0 && (
                <div className="pt-2 space-y-2">
                  <span className="text-xs sm:text-sm font-bold text-charcoal-900 block font-sans">
                    القوانين والعلاقات الرياضية الحاكمة:
                  </span>
                  <div className="space-y-2">
                    {currentLesson.keyFormulas.map((f, i) => (
                      <div
                        key={i}
                        className="font-formula text-xs sm:text-sm bg-ivory-300 p-3 rounded border border-hairline text-charcoal-900"
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-hairline bg-ivory-300/40 p-4 rounded text-xs sm:text-sm text-charcoal-100 font-sans space-y-1.5 leading-relaxed">
                <strong className="text-charcoal-900 block font-sans">نصيحة د/عمر مجدي التحليلية:</strong>
                <p>
                  لا تنتقل إلى المحاضرة التالية قبل أن تعيد كتابة الميكانزم أو المعادلة بيدك دون النظر للملاحظات (مقياس فاينمان للإتقان).
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Course Navigation */}
          <div className="lg:col-span-4 border border-hairline rounded bg-ivory-100 p-5 space-y-4 shadow-quiet">
            <div className="border-b border-hairline pb-3">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase block mb-1">
                COURSE SYLLABUS
              </span>
              <h4 className="text-sm sm:text-base font-bold text-charcoal-900 font-display">
                {course.title}
              </h4>
            </div>

            <div className="space-y-2">
              {course.lessons.map((les, idx) => {
                const isCurrent = les.id === currentLesson.id;
                return (
                  <Link
                    key={les.id}
                    href={`/courses/${course.id}/lessons/${les.id}`}
                    className={`block p-3 rounded text-xs sm:text-sm transition-colors border ${
                      isCurrent
                        ? 'bg-burgundy-50 border-burgundy-500 text-charcoal-900 font-semibold'
                        : 'bg-ivory-100 border-hairline text-charcoal-100 hover:bg-ivory-300 hover:text-charcoal-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-formula text-xs text-burgundy-500 font-bold">
                        محاضرة 0{idx + 1}
                      </span>
                      <span className="font-formula text-xs text-charcoal-50">
                        {les.duration}
                      </span>
                    </div>
                    <div className="line-clamp-1 font-sans">{les.title}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
