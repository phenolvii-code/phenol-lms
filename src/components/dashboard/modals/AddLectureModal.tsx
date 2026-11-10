'use client';

import React from 'react';
import { ChemistryCourse } from '@/types/lms';
import { X } from 'lucide-react';

interface AddLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: ChemistryCourse[];
  targetCourse: string;
  setTargetCourse: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  duration: string;
  setDuration: (val: string) => void;
  formula: string;
  setFormula: (val: string) => void;
  videoUrl: string;
  setVideoUrl: (val: string) => void;
  pdfUrl: string;
  setPdfUrl: (val: string) => void;
  summary: string;
  setSummary: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddLectureModal({
  isOpen,
  onClose,
  courses,
  targetCourse,
  setTargetCourse,
  title,
  setTitle,
  duration,
  setDuration,
  formula,
  setFormula,
  videoUrl,
  setVideoUrl,
  pdfUrl,
  setPdfUrl,
  summary,
  setSummary,
  onSubmit,
}: AddLectureModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-ivory-100 border border-hairline rounded-2xl shadow-editorial max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between shrink-0">
          <div>
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
              CURRICULUM ARCHITECT
            </span>
            <h3 className="font-bold text-charcoal-900 font-display text-sm sm:text-base">
              Add New Chemistry Lecture Module
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
                  Target Course
                </label>
                <select
                  value={targetCourse || (courses.length > 0 ? courses[0].id : '')}
                  onChange={(e) => setTargetCourse(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.categoryName}] {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Lecture Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Thermodynamic Derivation of Equilibrium Constant"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 52 min"
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Key Formula (optional)
                  </label>
                  <input
                    type="text"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder="e.g. ΔG° = -RT ln K"
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-formula text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Video URL (Unlisted YouTube / Vimeo / MP4)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or direct MP4/Vimeo"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded font-mono text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
                <span className="text-[10px] text-charcoal-50 block mt-1">
                  Protected automatically by PHENOL custom player skin & blended student watermark.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Companion PDF Handout URL (Optional)
                </label>
                <input
                  type="url"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://.../lecture-notes.pdf"
                  className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Module Summary
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Core concepts, mechanism breakdown, and diagnostic points covered in this lecture..."
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
              Publish Module
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
