'use client';

import React, { useState } from 'react';
import { ChemistryCourse, ChemistryLesson } from '@/types/lms';
import { X, Play, FileText, CheckCircle2, Clock, Download, Sparkles, FlaskConical } from 'lucide-react';

interface CourseModalProps {
  course: ChemistryCourse | null;
  onClose: () => void;
  onToggleLesson: (courseId: string, lessonId: string) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  course,
  onClose,
  onToggleLesson,
}) => {
  const [activeLesson, setActiveLesson] = useState<ChemistryLesson | null>(
    course ? course.lessons[0] : null
  );

  if (!course) return null;

  const currentLesson = activeLesson || course.lessons[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-burgundy-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-burgundy-900/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-[#2c040d] p-6 text-white relative flex items-center justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 font-mono text-xs font-bold border border-gold-400/30">
                {course.code}
              </span>
              {course.molecularFormula && (
                <span className="px-3 py-1 rounded-full bg-white/10 text-white font-mono text-xs font-semibold">
                  {course.molecularFormula}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif">{course.title}</h2>
            <p className="text-rose-100/70 text-xs sm:text-sm mt-1">{course.subTitle}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition self-start"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player & Lecture details */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Simulated 4K Chemistry Lecture Player */}
          <div className="relative rounded-2xl bg-black aspect-video sm:aspect-[21/9] overflow-hidden flex items-center justify-center border border-slate-800 shadow-xl group">
            <img
              src={course.thumbnail}
              alt="lecture cover"
              className="absolute inset-0 w-full h-full object-cover opacity-35 filter blur-[1px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

            <div className="relative z-10 text-center p-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-burgundy-600 to-gold-500 text-white flex items-center justify-center mx-auto mb-3 shadow-goldGlow cursor-pointer hover:scale-110 transition-transform">
                <Play className="w-7 h-7 fill-white mr-1" />
              </div>
              <span className="text-xs font-bold text-gold-400 uppercase tracking-wider block mb-1">
                محاضرة د. عمر مجدي
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white max-w-lg mx-auto">
                {currentLesson.title}
              </h3>
              <span className="text-xs text-white/60 mt-1 inline-block">
                المدة: {currentLesson.duration} • جودة فائقة Ultra HD
              </span>
            </div>
          </div>

          {/* Current Lesson Formulas & Takeaways */}
          {currentLesson.keyFormulas && currentLesson.keyFormulas.length > 0 && (
            <div className="p-4 rounded-2xl bg-gold-50/70 border border-gold-300/60">
              <div className="flex items-center gap-2 text-gold-800 font-bold text-xs sm:text-sm mb-2">
                <FlaskConical className="w-4 h-4 text-gold-700" />
                <span>المعادلات والقوانين الحاكمة في المحاضرة:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentLesson.keyFormulas.map((formula, fIdx) => (
                  <span
                    key={fIdx}
                    className="px-3 py-1.5 rounded-xl bg-white border border-gold-400/40 font-formula text-xs font-bold text-burgundy-950 shadow-sm"
                  >
                    {formula}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lessons List / Syllabus */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm sm:text-base text-burgundy-950">
                فهرس محاضرات المقرر ({course.lessons.length} محاضرات)
              </h4>
              <span className="text-xs text-slate-500">اختر محاضرة للمشاهدة</span>
            </div>

            <div className="space-y-2.5">
              {course.lessons.map((lesson, idx) => {
                const isSelected = currentLesson.id === lesson.id;
                return (
                  <div
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-gold-500 bg-gold-50/40 ring-1 ring-gold-400'
                        : 'border-slate-200/80 bg-white hover:border-burgundy-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                          isSelected
                            ? 'bg-burgundy-950 text-gold-400'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        0{idx + 1}
                      </div>

                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                          {lesson.title}
                        </h5>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {lesson.summary}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {lesson.duration}
                          </span>
                          <span>• شرح نظري ومسائل عملية</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLesson(course.id, lesson.id);
                      }}
                      className={`p-2 rounded-xl border transition ${
                        lesson.completed
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                          : 'bg-white border-slate-200 text-slate-300 hover:text-slate-500'
                      }`}
                      title={lesson.completed ? 'تم الإنجاز' : 'تحديد كمكتمل'}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            المحاضر: <strong className="text-burgundy-950">د. عمر مجدي</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-burgundy-950 text-gold-400 hover:bg-black font-bold rounded-xl transition"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
