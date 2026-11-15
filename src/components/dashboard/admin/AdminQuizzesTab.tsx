'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Award, Plus, Edit3, Trash2, Clock, Loader2, Target } from 'lucide-react';
import { ChemistryCourse } from '@/types/lms';
import {
  listInstructorQuizzes,
  deleteQuiz,
  InstructorQuizRecord,
} from '@/lib/data/quizzes';
import { QuizEditorModal } from '@/components/dashboard/modals/QuizEditorModal';

interface AdminQuizzesTabProps {
  /** The signed-in instructor's own courses (super_admin: all courses). */
  courses: ChemistryCourse[];
}

export function AdminQuizzesTab({ courses }: AdminQuizzesTabProps) {
  const [quizzes, setQuizzes] = useState<InstructorQuizRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadQuizzes = useCallback(async () => {
    setIsLoading(true);
    const list = await listInstructorQuizzes();
    setQuizzes(list);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleDelete = async (quiz: InstructorQuizRecord) => {
    const confirmed = window.confirm(
      `Delete "${quiz.title}" permanently? Its ${quiz.questionCount} questions and all recorded student submissions will be removed. This cannot be undone.`
    );
    if (!confirmed) return;
    setDeletingId(quiz.quizId);
    try {
      await deleteQuiz(quiz.quizId);
      await loadQuizzes();
    } catch (err: any) {
      window.alert(`Failed to delete the quiz: ${err?.message || 'unknown error'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const openCreate = () => {
    setEditingQuizId(null);
    setEditorOpen(true);
  };

  const openEdit = (quizId: string) => {
    setEditingQuizId(quizId);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 font-display">
            Evaluation Quizzes
          </h2>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Author timed MCQ assessments for your courses. Answer keys are stored server-side and never exposed to students.
          </p>
        </div>

        <button
          onClick={openCreate}
          disabled={courses.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Quiz</span>
        </button>
      </div>

      {courses.length === 0 && (
        <div className="border border-dashed border-hairline rounded-xl bg-ivory-100 p-8 text-center">
          <p className="text-xs text-charcoal-100">
            You need at least one course before you can create quizzes.
          </p>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center gap-2 text-xs text-charcoal-100">
          <Loader2 className="w-4 h-4 animate-spin text-burgundy-500" />
          <span>Loading quizzes from the database...</span>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-xl bg-ivory-100 p-12 text-center space-y-4 shadow-quiet">
          <Award className="w-10 h-10 text-burgundy-500 mx-auto" />
          <h3 className="text-base font-bold text-charcoal-900 font-display">
            No quizzes yet
          </h3>
          <p className="text-xs text-charcoal-100 font-sans max-w-md mx-auto">
            Create your first timed evaluation quiz — students will take it in the Assessment Room of the course page.
          </p>
          {courses.length > 0 && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Your First Quiz</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.quizId}
              className="p-5 rounded-xl border border-hairline bg-ivory-100 shadow-quiet space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-formula text-[10px] text-burgundy-600 font-bold bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                    EVALUATION
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-charcoal-50">
                    <Clock className="w-3.5 h-3.5 text-burgundy-500" />
                    <span>{quiz.durationMinutes} Mins</span>
                    <Target className="w-3.5 h-3.5 text-burgundy-500 ml-1.5" />
                    <span>{quiz.passingPercentage}%</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-charcoal-900 font-display leading-snug">
                  {quiz.title}
                </h3>

                <p className="text-[11px] text-charcoal-100 font-sans">
                  {quiz.courseTitle} • {quiz.questionCount} Questions
                </p>

                {quiz.description && (
                  <p className="text-[11px] text-charcoal-100 font-sans leading-relaxed line-clamp-2">
                    {quiz.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-hairline flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(quiz.quizId)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-hairline bg-ivory-50 hover:bg-ivory-200 text-charcoal-900 text-xs font-semibold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(quiz)}
                  disabled={deletingId === quiz.quizId}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-hairline bg-ivory-50 hover:bg-ivory-200 text-burgundy-500 text-xs font-semibold transition-colors disabled:opacity-50"
                  title="Delete quiz permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingId === quiz.quizId ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <QuizEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        courses={courses}
        editingQuizId={editingQuizId}
        onSaved={loadQuizzes}
      />
    </div>
  );
}
