'use client';

import React from 'react';
import { StudentSubmission } from '@/types/lms';
import { X } from 'lucide-react';

interface GradingDeskModalProps {
  submission: StudentSubmission | null;
  onClose: () => void;
  grade: number;
  setGrade: (val: number) => void;
  feedback: string;
  setFeedback: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function GradingDeskModal({
  submission,
  onClose,
  grade,
  setGrade,
  feedback,
  setFeedback,
  onSubmit,
}: GradingDeskModalProps) {
  if (!submission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
      <div className="bg-ivory-100 border border-hairline rounded-lg shadow-editorial max-w-lg w-full overflow-hidden">
        <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between">
          <div>
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
              INSTRUCTOR GRADING DESK
            </span>
            <h3 className="font-bold text-charcoal-900 font-display text-sm">
              {submission.studentName} ({submission.studentCode})
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
          <div className="space-y-1">
            <span className="text-xs font-semibold text-charcoal-50 font-sans block">
              Problem Set:
            </span>
            <p className="text-xs font-bold text-charcoal-900 font-sans">
              {submission.taskTitle}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-charcoal-50 font-sans block">
              Student Work Notes:
            </span>
            <p className="text-xs text-charcoal-100 bg-ivory-200 p-3 rounded font-sans leading-relaxed">
              {submission.solutionNotes}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
              Assigned Score (out of {submission.maxGrade})
            </label>
            <input
              type="number"
              min="0"
              max={submission.maxGrade}
              required
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-ivory-50 border border-hairline rounded font-formula font-bold text-charcoal-900 focus:outline-none focus:border-burgundy-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
              Dr. Omar Magdi Feedback Critique
            </label>
            <textarea
              rows={4}
              required
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Detail your scientific evaluation and highlight any orbital or thermodynamic nuances..."
              className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-hairline text-charcoal-50 text-xs font-semibold hover:text-charcoal-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
            >
              Save Grade & Send Critique
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
