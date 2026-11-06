'use client';

import React, { useState } from 'react';
import { StudentSubmission } from '@/types/lms';
import { FileCheck2, Clock, CheckCircle2, UploadCloud, Send, X, Sparkles } from 'lucide-react';

interface StudentTasksViewProps {
  submissions: StudentSubmission[];
  onSubmitNewTask: (newTask: Partial<StudentSubmission>) => void;
}

export const StudentTasksView: React.FC<StudentTasksViewProps> = ({
  submissions,
  onSubmitNewTask,
}) => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('حل مسائل استقرار أيون الفينوكسيد بالرنين وتأثير المجموعات الساحبة');
  const [solutionNotes, setSolutionNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitNewTask({
      id: `sub-${Date.now()}`,
      studentName: 'أنا (طالب كيمياء)',
      studentCode: 'PHN-2026-LIVE',
      taskTitle,
      submittedAt: 'الآن',
      solutionNotes,
      maxGrade: 20,
      status: 'pending',
    });
    setIsSubmitModalOpen(false);
    setSolutionNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burgundy-50 border border-burgundy-200 text-burgundy-900 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>المتابعة الأكاديمية الفردية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-burgundy-950 font-serif">
            واجباتي وتكليفاتي الأكاديمية
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            سلم حلول المسائل والميكانزمات هنا لتصل مباشرة إلى د. عمر مجدي للمراجعة الشخصية
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-burgundy-950 hover:bg-black text-gold-400 font-bold text-xs sm:text-sm shadow-luxury transition-all transform hover:-translate-y-0.5"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>تسليم واجب جديد لدكتور عمر</span>
        </button>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-3xl border border-burgundy-900/10 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {submissions.map((sub) => (
            <div key={sub.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-burgundy-950">{sub.taskTitle}</span>
                  {sub.status === 'graded' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> تم التصحيح ({sub.grade}/{sub.maxGrade})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gold-50 text-gold-800 border border-gold-300">
                      <Clock className="w-3.5 h-3.5" /> بانتظار تصحيح د. عمر
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <strong className="text-slate-700 block mb-0.5">إجابتي المسلمة:</strong>
                  {sub.solutionNotes}
                </p>

                {sub.drFeedback && (
                  <div className="p-3 rounded-xl bg-gold-50/70 border border-gold-300 text-xs text-burgundy-950">
                    <strong className="text-burgundy-900 block mb-0.5">
                      💬 ملاحظات د. عمر مجدي لك:
                    </strong>
                    {sub.drFeedback}
                  </div>
                )}
              </div>

              <div className="text-left text-xs font-mono text-slate-400 shrink-0">
                {sub.submittedAt}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Submit Task */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-burgundy-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gold-500/30 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-burgundy-950 to-[#3b0814] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gold-400 font-bold">بوابة تسليم الطالب</span>
                <h3 className="font-bold text-base font-serif">تسليم حل تكليف كيميائي</h3>
              </div>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-burgundy-950 mb-1.5">عنوان الواجب / المسألة</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:border-gold-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-burgundy-950 mb-1.5">حل المسألة والملاحظات التوضيحية</label>
                <textarea
                  rows={4}
                  required
                  value={solutionNotes}
                  onChange={(e) => setSolutionNotes(e.target.value)}
                  placeholder="اكتب خطوات الحل أو ميكانيكية التفاعل هنا..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-gold-500 focus:outline-none"
                />
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-gold-300 rounded-2xl p-4 text-center bg-gold-50/30 hover:bg-gold-50/60 cursor-pointer transition">
                <UploadCloud className="w-8 h-8 text-gold-600 mx-auto mb-1" />
                <span className="text-xs font-bold text-burgundy-950 block">إرفاق صورة رسم الميكانزم أو ملف PDF</span>
                <span className="text-[11px] text-slate-400">الحد الأقصى: 20 ميجابايت</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-burgundy-950 text-gold-400 hover:bg-black font-bold text-xs rounded-xl shadow transition"
                >
                  إرسال لدكتور عمر للمراجعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
