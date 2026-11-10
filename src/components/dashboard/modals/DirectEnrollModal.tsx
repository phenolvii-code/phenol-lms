'use client';

import React from 'react';
import { ChemistryCourse } from '@/types/lms';
import { Sparkles, X, CheckCircle2 } from 'lucide-react';

interface DirectEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    name: string;
    code: string;
    email: string;
    phone: string;
  } | null;
  courses: ChemistryCourse[];
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function DirectEnrollModal({
  isOpen,
  onClose,
  student,
  courses,
  selectedCourseId,
  setSelectedCourseId,
  onSubmit,
}: DirectEnrollModalProps) {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-ivory-100 border border-hairline rounded-2xl max-w-md w-full p-6 shadow-editorial space-y-4 font-sans text-charcoal-900">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-burgundy-900" />
            <h3 className="text-base font-bold font-display">Activate Course for Student</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-charcoal-50 hover:text-charcoal-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-white rounded-lg border border-hairline space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-charcoal-900">{student.name}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-burgundy-50 text-burgundy-900 border border-burgundy-200">
              {student.code}
            </span>
          </div>
          <p className="text-[11px] text-charcoal-50 font-mono">{student.email}</p>
          <p className="text-[11px] text-charcoal-50 font-mono">{student.phone}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-charcoal-900">Select Course to Activate:</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-hairline text-charcoal-100 text-xs font-semibold hover:bg-ivory-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-quiet flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Activate Access Now</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
