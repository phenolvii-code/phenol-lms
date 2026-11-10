'use client';

import React from 'react';
import { X } from 'lucide-react';

interface SubmitProblemSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  setTaskTitle: (val: string) => void;
  solutionNotes: string;
  setSolutionNotes: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SubmitProblemSetModal({
  isOpen,
  onClose,
  taskTitle,
  setTaskTitle,
  solutionNotes,
  setSolutionNotes,
  onSubmit,
}: SubmitProblemSetModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
      <div className="bg-ivory-100 border border-hairline rounded-lg shadow-editorial max-w-md w-full overflow-hidden">
        <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between">
          <div>
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
              PROBLEM SET SUBMISSION
            </span>
            <h3 className="font-bold text-charcoal-900 font-display text-sm">
              Submit Work to Dr. Omar Magdi
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal-50 hover:text-charcoal-900 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
              Assignment Title
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
              Solution Notes & Derivations
            </label>
            <textarea
              rows={4}
              required
              value={solutionNotes}
              onChange={(e) => setSolutionNotes(e.target.value)}
              placeholder="Detail your thermodynamic steps, electron pushing logic, or provide your work link..."
              className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-hairline text-charcoal-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
            >
              Submit for Critique
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
