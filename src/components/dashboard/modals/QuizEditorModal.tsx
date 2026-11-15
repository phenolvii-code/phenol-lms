'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Save, Loader2, AlertCircle, Check } from 'lucide-react';
import { ChemistryCourse } from '@/types/lms';
import {
  saveQuiz,
  getQuizForEditing,
  QuizBuilderQuestion,
} from '@/lib/data/quizzes';

interface QuizEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: ChemistryCourse[];
  /** Pass a quiz id to edit an existing quiz; null = create new. */
  editingQuizId: string | null;
  onSaved: () => void;
}

const emptyQuestion = (): QuizBuilderQuestion => ({
  id: `q-${Math.random().toString(36).slice(2, 10)}`,
  text: '',
  options: [
    { id: 'o1', text: '' },
    { id: 'o2', text: '' },
  ],
  correctOptionId: 'o1',
  points: 5,
  explanation: '',
});

export const QuizEditorModal: React.FC<QuizEditorModalProps> = ({
  isOpen,
  onClose,
  courses,
  editingQuizId,
  onSaved,
}) => {
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [passingPercentage, setPassingPercentage] = useState(60);
  const [questions, setQuestions] = useState<QuizBuilderQuestion[]>([emptyQuestion()]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  // (Re)initialize whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setStatus({ type: 'idle', message: '' });
    setCourseId(courses[0]?.id || '');

    if (editingQuizId) {
      setIsLoading(true);
      getQuizForEditing(editingQuizId)
        .then((res) => {
          if (res) {
            setCourseId(res.quiz.courseId);
            setTitle(res.quiz.title);
            setDescription(res.quiz.description || '');
            setDurationMinutes(res.quiz.durationMinutes);
            setPassingPercentage(res.quiz.passingPercentage);
            setQuestions(res.questions.length > 0 ? res.questions : [emptyQuestion()]);
          } else {
            setStatus({ type: 'error', message: 'Quiz not found.' });
          }
        })
        .catch((err: any) => {
          setStatus({ type: 'error', message: err?.message || 'Failed to load quiz.' });
        })
        .finally(() => setIsLoading(false));
    } else {
      setTitle('');
      setDescription('');
      setDurationMinutes(15);
      setPassingPercentage(60);
      setQuestions([emptyQuestion()]);
    }
  }, [isOpen, editingQuizId, courses]);

  const updateQuestion = (idx: number, patch: Partial<QuizBuilderQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx: number, oIdx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, oi) => (oi === oIdx ? { ...o, text } : o)) }
          : q
      )
    );
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const next = { id: `o${q.options.length + 1}-${Math.random().toString(36).slice(2, 6)}`, text: '' };
        return { ...q, options: [...q.options, next] };
      })
    );
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx || q.options.length <= 2) return q;
        const options = q.options.filter((_, oi) => oi !== oIdx);
        const correctOptionId =
          q.correctOptionId === q.options[oIdx].id ? options[0].id : q.correctOptionId;
        return { ...q, options, correctOptionId };
      })
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const validate = (): string | null => {
    if (!courseId) return 'Select a course for this quiz.';
    if (!title.trim()) return 'Quiz title is required.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1} is missing its text.`;
      for (const o of q.options) {
        if (!o.text.trim()) return `Question ${i + 1}: an option is empty.`;
      }
      if (!q.options.find((o) => o.id === q.correctOptionId)) {
        return `Question ${i + 1}: select the correct answer.`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      setStatus({ type: 'error', message: problem });
      return;
    }
    setIsSaving(true);
    setStatus({ type: 'idle', message: '' });
    try {
      await saveQuiz({
        quizId: editingQuizId || undefined,
        courseId,
        title: title.trim(),
        description: description.trim(),
        durationMinutes,
        passingPercentage,
        questions: questions.map((q) => ({
          ...q,
          text: q.text.trim(),
          options: q.options.map((o) => ({ ...o, text: o.text.trim() })),
          points: Math.max(1, Number(q.points) || 5),
          explanation: q.explanation.trim(),
        })),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setStatus({ type: 'error', message: err?.message || 'Failed to save the quiz.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-ivory-100 border border-hairline rounded-2xl shadow-editorial max-w-4xl w-full overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between shrink-0">
          <div>
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
              {editingQuizId ? 'EDIT EVALUATION' : 'QUIZ ARCHITECT'}
            </span>
            <h3 className="font-bold text-charcoal-900 font-display text-sm sm:text-base">
              {editingQuizId ? 'Edit Evaluation Quiz' : 'Create New Evaluation Quiz'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal-50 hover:text-charcoal-900 p-1.5 rounded-full hover:bg-ivory-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs text-charcoal-100">
              <Loader2 className="w-4 h-4 animate-spin text-burgundy-500" />
              <span>Loading quiz from the database...</span>
            </div>
          ) : (
            <>
              {/* Meta fields */}
              <div className="p-4 rounded-xl bg-ivory-200 border border-hairline space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                      Course
                    </label>
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      disabled={Boolean(editingQuizId)}
                      className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 disabled:opacity-60"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code ? `${c.code} — ` : ''}{c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                      Quiz Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Week 3 Evaluation: Reaction Mechanisms"
                      className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What this assessment measures"
                    className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-mono focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                      Passing Percentage (%)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={passingPercentage}
                      onChange={(e) => setPassingPercentage(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-mono focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-charcoal-900">
                    Questions ({questions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-ivory-200 border border-hairline hover:bg-ivory-300 text-charcoal-900 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-burgundy-500" />
                    <span>Add Question</span>
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-white border border-hairline space-y-3 shadow-quiet"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-formula text-xs font-bold text-burgundy-500">
                        Q{qIdx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] font-semibold text-charcoal-100 uppercase">
                            Points
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={q.points}
                            onChange={(e) => updateQuestion(qIdx, { points: Number(e.target.value) })}
                            className="w-16 px-2 py-1 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 font-mono focus:outline-none focus:border-burgundy-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          disabled={questions.length <= 1}
                          title="Remove question"
                          className="p-1.5 rounded hover:bg-ivory-200 text-charcoal-50 hover:text-burgundy-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={q.text}
                      onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
                      placeholder="Question text..."
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 resize-none"
                    />

                    <input
                      type="text"
                      value={q.molecularSnippet || ''}
                      onChange={(e) => updateQuestion(qIdx, { molecularSnippet: e.target.value })}
                      placeholder="Molecular snippet / formula label (optional)"
                      className="w-full px-3 py-1.5 text-xs bg-ivory-50 border border-hairline rounded font-mono text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />

                    {/* Options */}
                    <div className="space-y-2 pl-2">
                      {q.options.map((o, oIdx) => (
                        <div key={o.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuestion(qIdx, { correctOptionId: o.id })}
                            title="Mark as the correct answer"
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                              q.correctOptionId === o.id
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-ivory-200 border-hairline text-charcoal-50 hover:border-emerald-400'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="text"
                            value={o.text}
                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            className="flex-1 px-3 py-1.5 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(qIdx, oIdx)}
                            disabled={q.options.length <= 2}
                            title="Remove option"
                            className="p-1 rounded hover:bg-ivory-200 text-charcoal-50 hover:text-burgundy-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className="text-[11px] font-semibold text-burgundy-500 hover:text-burgundy-900 transition-colors pl-1"
                      >
                        + Add Option
                      </button>
                    </div>

                    <textarea
                      value={q.explanation}
                      onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                      placeholder="Scientific explanation shown after grading (optional)"
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-100 focus:outline-none focus:border-burgundy-500 resize-none"
                    />
                  </div>
                ))}
              </div>

              {status.type === 'error' && (
                <p className="text-[11px] text-burgundy-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {status.message}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-hairline bg-ivory-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs border border-hairline rounded bg-ivory-100 text-charcoal-100 hover:text-charcoal-900 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs bg-burgundy-900 hover:bg-black text-ivory-100 rounded font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : editingQuizId ? 'Save Changes' : 'Create Quiz'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
