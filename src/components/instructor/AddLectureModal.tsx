'use client';

import React, { useState } from 'react';
import { ChemistryCourse, ChemistryLesson } from '@/types/lms';
import { X, Sparkles, Plus, FlaskConical } from 'lucide-react';

interface AddLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: ChemistryCourse[];
  onAddLecture: (courseId: string, newLesson: ChemistryLesson) => void;
}

export const AddLectureModal: React.FC<AddLectureModalProps> = ({
  isOpen,
  onClose,
  courses,
  onAddLecture,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('45 دقيقة');
  const [summary, setSummary] = useState('');
  const [formula1, setFormula1] = useState('');
  const [formula2, setFormula2] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formulas = [formula1, formula2].filter(Boolean);
    const newLesson: ChemistryLesson = {
      id: `les-chem-${Date.now()}`,
      title,
      duration,
      type: 'video',
      completed: false,
      summary,
      keyFormulas: formulas.length > 0 ? formulas : undefined,
    };
    onAddLecture(selectedCourseId, newLesson);
    onClose();
    setTitle('');
    setSummary('');
    setFormula1('');
    setFormula2('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-burgundy-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gold-500/30 overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-burgundy-950 to-[#3b0814] text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gold-400 font-bold">بوابة نشر د. عمر مجدي</span>
            <h3 className="font-bold text-base font-serif">إضافة محاضرة كيميائية جديدة</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-burgundy-950 mb-1.5">المقرر المستهدف</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:border-gold-500 focus:outline-none"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-burgundy-950 mb-1.5">عنوان المحاضرة الكيميائية</label>
            <input
              type="text"
              required
              placeholder="مثال: ميكانيكية ألكلة وفريدل كرافتس لمشتقات الفينول"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-burgundy-950 mb-1.5">مدة المحاضرة التقديرية</label>
            <input
              type="text"
              required
              placeholder="مثال: 50 دقيقة"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-burgundy-950 mb-1.5">ملخص المحاور والمخرجات العلمية</label>
            <textarea
              rows={3}
              required
              placeholder="شرح موجز لأهم الميكانزمات والنقاط التي سيتعلمها الطالب..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">معادلة حاكمة 1 (اختياري)</label>
              <input
                type="text"
                placeholder="C₆H₅OH + CH₃Cl..."
                value={formula1}
                onChange={(e) => setFormula1(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-formula focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">معادلة حاكمة 2 (اختياري)</label>
              <input
                type="text"
                placeholder="AlCl₃ Lewis catalyst..."
                value={formula2}
                onChange={(e) => setFormula2(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-formula focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-burgundy-950 text-gold-400 hover:bg-black font-bold text-xs rounded-xl shadow transition"
            >
              نشر المحاضرة للطلاب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
