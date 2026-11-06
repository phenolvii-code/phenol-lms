'use client';

import React, { useState } from 'react';
import { InstructorProfile, StudentSubmission, ChemistryCourse } from '@/types/lms';
import { Sparkles, Plus, Edit3, CheckCircle2, Clock, Users, BookOpen, Award, X } from 'lucide-react';

interface InstructorConsoleProps {
  instructor: InstructorProfile;
  courses: ChemistryCourse[];
  submissions: StudentSubmission[];
  onGradeSubmission: (subId: string, grade: number, feedback: string) => void;
  onOpenAddLectureModal: () => void;
}

export const InstructorConsole: React.FC<InstructorConsoleProps> = ({
  instructor,
  courses,
  submissions,
  onGradeSubmission,
  onOpenAddLectureModal,
}) => {
  const [selectedSub, setSelectedSub] = useState<StudentSubmission | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(20);
  const [feedbackInput, setFeedbackInput] = useState('');

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');

  const handleOpenGradeModal = (sub: StudentSubmission) => {
    setSelectedSub(sub);
    setGradeInput(sub.grade || 20);
    setFeedbackInput(sub.drFeedback || 'إجابة ممتازة وفهم دقيق لآلية التفاعل، أحسنت يا بطل.');
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    onGradeSubmission(selectedSub.id, Number(gradeInput), feedbackInput);
    setSelectedSub(null);
  };

  return (
    <div className="space-y-8">
      {/* Dr. Omar Personal Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-burgundy-950 via-[#400713] to-burgundy-950 text-white p-8 border border-gold-500/30 shadow-luxury relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={instructor.avatar}
                alt={instructor.name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-gold-400 shadow-lg"
              />
              <span className="absolute -bottom-1 -left-1 px-2 py-0.5 rounded-full bg-gold-400 text-burgundy-950 text-[10px] font-bold">
                محاضر المنصة
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif">
                  {instructor.name}
                </h1>
                <span className="text-gold-400 text-xs font-mono font-bold bg-gold-400/10 px-2.5 py-0.5 rounded-full border border-gold-400/30">
                  Ph.D. Chem
                </span>
              </div>
              <p className="text-rose-100/70 text-xs sm:text-sm mt-1 max-w-xl">
                {instructor.bio}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAddLectureModal}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-gold-300 text-burgundy-950 font-bold text-xs sm:text-sm shadow-goldGlow transition-transform transform hover:-translate-y-0.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة محاضرة كيمياء جديدة</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-burgundy-900/10 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 mb-1">الطلاب المشتركون في كورساتك</div>
            <div className="text-3xl font-black text-burgundy-950 font-formula">
              {instructor.studentsCount.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">تفاعل نشط هذا الأسبوع</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-burgundy-50 text-burgundy-800 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-burgundy-900/10 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 mb-1">تسليمات تتطلب تصحيح د. عمر</div>
            <div className="text-3xl font-black text-gold-600 font-formula">
              {pendingSubmissions.length} مهام
            </div>
            <div className="text-xs text-gold-700 font-semibold mt-1">جاهزة للمراجعة والرصد</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gold-50 text-gold-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-burgundy-900/10 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 mb-1">معدل التقييم الأكاديمي</div>
            <div className="text-3xl font-black text-emerald-700 font-formula">
              {instructor.rating} / 5.0
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">إجماع على وضوح الميكانزمات</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="bg-white rounded-3xl border border-burgundy-900/10 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-burgundy-950 font-serif">
              طابور تصحيح إجابات الطلاب (خاص بالدكتور عمر مجدي)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              يمكنك الاطلاع على حلول الطلاب ورسم الميكانزمات ورصد الدرجة وكتابة التغذية الراجعة
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold-100 text-gold-900 border border-gold-300">
            {pendingSubmissions.length} بانتظار الرصد
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-burgundy-950 font-serif">
                    {sub.studentName}
                  </span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {sub.studentCode}
                  </span>
                  {sub.status === 'graded' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> تم الرصد ({sub.grade}/{sub.maxGrade})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gold-50 text-gold-800 border border-gold-300">
                      <Clock className="w-3.5 h-3.5" /> قيد المراجعة
                    </span>
                  )}
                </div>

                <div className="text-xs font-semibold text-slate-700">
                  المهمة: {sub.taskTitle}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  {sub.solutionNotes}
                </p>

                {sub.drFeedback && (
                  <div className="text-xs text-burgundy-900 bg-burgundy-50/60 p-2.5 rounded-xl border border-burgundy-200">
                    <strong className="text-burgundy-950">ملاحظات د. عمر:</strong> {sub.drFeedback}
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => handleOpenGradeModal(sub)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-burgundy-950 hover:bg-black text-gold-400 text-xs font-bold transition shadow-sm shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{sub.status === 'graded' ? 'تعديل التقدير' : 'رصد الدرجة الآن'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Grade Submission */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-burgundy-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gold-500/30 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-burgundy-950 to-[#3b0814] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gold-400 font-bold">بوابة تقييم د. عمر مجدي</span>
                <h3 className="font-bold text-base font-serif">
                  تقييم إجابة الطالب: {selectedSub.studentName}
                </h3>
              </div>
              <button onClick={() => setSelectedSub(null)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <span className="text-slate-400 block font-semibold">حل الطالب المسلم:</span>
                <p className="font-medium text-slate-800">{selectedSub.solutionNotes}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-burgundy-950 mb-1.5">
                  الدرجة المستحقة (من {selectedSub.maxGrade})
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedSub.maxGrade}
                  required
                  value={gradeInput}
                  onChange={(e) => setGradeInput(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold font-formula text-burgundy-950 focus:border-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-burgundy-950 mb-1.5">
                  توجيهات وملاحظات د. عمر للطالب
                </label>
                <textarea
                  rows={3}
                  required
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="اكتب التقييم والنصيحة العلمية..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-gold-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-burgundy-950 text-gold-400 hover:bg-black font-bold text-xs rounded-xl shadow transition"
                >
                  اعتماد ورصد الدرجة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
