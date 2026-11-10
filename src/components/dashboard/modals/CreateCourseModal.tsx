'use client';

import React from 'react';
import { AcademicCategory } from '@/types/lms';
import { ACADEMIC_TRACKS } from '@/data/mock-data';
import { X } from 'lucide-react';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: AcademicCategory;
  setCategory: (val: AcademicCategory) => void;
  code: string;
  setCode: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  subtitle: string;
  setSubtitle: (val: string) => void;
  level: string;
  setLevel: (val: string) => void;
  formula: string;
  setFormula: (val: string) => void;
  hours: string;
  setHours: (val: string) => void;
  desc: string;
  setDesc: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateCourseModal({
  isOpen,
  onClose,
  category,
  setCategory,
  code,
  setCode,
  title,
  setTitle,
  subtitle,
  setSubtitle,
  level,
  setLevel,
  formula,
  setFormula,
  hours,
  setHours,
  desc,
  setDesc,
  onSubmit,
}: CreateCourseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-ivory-100 border border-hairline rounded-2xl shadow-editorial max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between shrink-0">
          <div>
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
              COURSE BUILDER STUDIO
            </span>
            <h3 className="font-bold text-charcoal-900 font-display text-sm sm:text-base">
              Create New Course under Academic Program
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal-50 hover:text-charcoal-900 p-1.5 rounded-full hover:bg-ivory-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Target Academic Program
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AcademicCategory)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                >
                  {ACADEMIC_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Course Code (e.g. CHEM-AR 302)
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="CHEM-AR 302"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-formula text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Electrochemistry & Galvanic Thermodynamics"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Subtitle / Scope
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Faraday's Laws, Nernst Equation, and Cell Potentials"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Academic Level
                  </label>
                  <input
                    type="text"
                    required
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    placeholder="e.g. Year 3 Secondary"
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Key Formula / Symbol
                  </label>
                  <input
                    type="text"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder="e.g. ΔG° = -nFE°"
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-formula text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Academic Hours
                </label>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g. 32 Academic Hours"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Course Description & Goals
                </label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Explain the first-principles methodology and core problem sets covered in this curriculum..."
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-hairline shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-hairline text-charcoal-50 hover:text-charcoal-900 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-quiet transition-colors"
            >
              Create & Publish Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
