'use client';

import React from 'react';
import { StudentSubmission } from '@/types/lms';
import { Plus } from 'lucide-react';

interface StudentTasksTabProps {
  submissions: StudentSubmission[];
  setIsSubmitModalOpen: (val: boolean) => void;
}

export function StudentTasksTab({
  submissions,
  setIsSubmitModalOpen,
}: StudentTasksTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-charcoal-900 font-display">
          My Problem Set Submissions
        </h2>
        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="text-xs font-semibold text-burgundy-500 hover:underline"
        >
          + Submit New Task
        </button>
      </div>

      {submissions.length > 0 ? (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="border border-hairline rounded bg-ivory-100 p-5 space-y-3 shadow-quiet"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-charcoal-900 font-sans">
                  {sub.taskTitle}
                </h3>
                {sub.status === 'graded' ? (
                  <span className="font-formula font-bold text-xs px-2.5 py-1 rounded bg-ivory-200 text-charcoal-900 border border-hairline">
                    Grade: {sub.grade} / {sub.maxGrade}
                  </span>
                ) : (
                  <span className="font-formula font-semibold text-xs px-2.5 py-1 rounded bg-ivory-200 text-ochre-600 border border-hairline">
                    Pending Review
                  </span>
                )}
              </div>

              <p className="text-xs text-charcoal-100 font-sans bg-ivory-200/80 p-3 rounded leading-relaxed border border-hairline">
                {sub.solutionNotes}
              </p>

              {sub.drFeedback && (
                <div className="bg-ivory-200 border border-hairline p-3.5 rounded-lg text-xs leading-relaxed shadow-quiet space-y-1">
                  <span className="font-formula text-[10px] uppercase tracking-wider font-bold text-burgundy-500 block">
                    Feedback — Dr. Omar Magdi
                  </span>
                  <p className="text-charcoal-900 font-sans">
                    {sub.drFeedback}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-hairline rounded bg-ivory-100 p-10 text-center space-y-2">
          <p className="text-xs text-charcoal-100 font-sans">
            You haven&apos;t submitted any problem sets yet.
          </p>
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Your First Task</span>
          </button>
        </div>
      )}
    </div>
  );
}
