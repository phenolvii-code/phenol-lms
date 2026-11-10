'use client';

import React from 'react';
import { StudentSubmission } from '@/types/lms';
import { FileCheck2 } from 'lucide-react';

interface AdminSubmissionsTabProps {
  submissions: StudentSubmission[];
  setGradingSubmission: (sub: StudentSubmission) => void;
  setInputGrade: (val: number) => void;
  setInputFeedback: (val: string) => void;
}

export function AdminSubmissionsTab({
  submissions,
  setGradingSubmission,
  setInputGrade,
  setInputFeedback,
}: AdminSubmissionsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-charcoal-900 font-display">
          Student Problem Set Submissions
        </h2>
        <p className="text-xs text-charcoal-100 font-sans mt-0.5">
          Evaluate student mechanistic drawings, thermodynamic derivations, and provide personalized scientific critique.
        </p>
      </div>

      {submissions.length > 0 ? (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="border border-hairline rounded bg-ivory-100 p-6 space-y-4 shadow-quiet"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3">
                <div>
                  <span className="font-formula text-xs font-bold text-burgundy-500">
                    {sub.studentCode}
                  </span>
                  <h3 className="text-base font-bold text-charcoal-900 font-display">
                    {sub.studentName} — {sub.taskTitle}
                  </h3>
                  <span className="text-xs text-charcoal-50 font-sans">
                    Submitted {sub.submittedAt}
                  </span>
                </div>

                <div>
                  {sub.status === 'graded' ? (
                    <span className="font-formula font-bold text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Grade: {sub.grade} / {sub.maxGrade}
                    </span>
                  ) : (
                    <span className="font-formula font-semibold text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Awaiting Grade
                    </span>
                  )}
                </div>
              </div>

              {/* Student Solution Notes */}
              <div className="space-y-1 bg-ivory-200 p-3.5 rounded text-xs leading-relaxed">
                <span className="font-semibold text-charcoal-900 block font-sans">
                  Student Solution Summary:
                </span>
                <p className="text-charcoal-100 font-sans">
                  {sub.solutionNotes}
                </p>
              </div>

              {/* Instructor Feedback if Graded */}
              {sub.drFeedback && (
                <div className="bg-burgundy-50/70 border-l-2 border-burgundy-500 p-3 rounded-r text-xs leading-relaxed">
                  <span className="font-bold text-burgundy-900 block font-sans">
                    Dr. Omar Magdi Feedback:
                  </span>
                  <p className="text-burgundy-950 font-sans mt-0.5">
                    {sub.drFeedback}
                  </p>
                </div>
              )}

              {/* Grading Action */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setGradingSubmission(sub);
                    setInputGrade(sub.grade || 20);
                    setInputFeedback(sub.drFeedback || '');
                  }}
                  className="px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet inline-flex items-center gap-1.5"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>
                    {sub.status === 'graded'
                      ? 'Edit Grade & Critique'
                      : 'Grade Problem Set'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-hairline rounded bg-ivory-100 p-12 text-center space-y-3">
          <FileCheck2 className="w-10 h-10 text-charcoal-50 mx-auto" />
          <h3 className="text-base font-bold text-charcoal-900 font-display">
            Grading Desk is Clear
          </h3>
          <p className="text-xs text-charcoal-100 font-sans max-w-md mx-auto">
            No student problem sets are currently awaiting review. When scholars submit derivations in their portal, they will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
