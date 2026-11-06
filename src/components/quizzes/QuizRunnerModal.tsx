'use client';

import React, { useState } from 'react';
import { ChemistryQuiz } from '@/types/lms';
import { X, Award, CheckCircle, AlertCircle, RefreshCw, FlaskConical, Sparkles } from 'lucide-react';

interface QuizRunnerModalProps {
  quiz: ChemistryQuiz | null;
  onClose: () => void;
  onSaveResult?: (quizId: string, score: number) => void;
}

export const QuizRunnerModal: React.FC<QuizRunnerModalProps> = ({
  quiz,
  onClose,
  onSaveResult,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!quiz) return null;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });
    return correctCount;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const score = calculateScore();
    if (onSaveResult) {
      onSaveResult(quiz.id, score);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const score = calculateScore();
  const percentage = Math.round((score / quiz.questions.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-burgundy-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gold-500/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-burgundy-950 via-[#3d0714] to-burgundy-950 text-white flex items-center justify-between border-b border-gold-500/20">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gold-500/20 text-gold-300 font-bold text-xs border border-gold-400/30 mb-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-gold-400" />
              <span>{quiz.badge} • د. عمر مجدي</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-serif">{quiz.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {submitted && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-gold-50 to-amber-50 border border-gold-300 shadow-sm flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-burgundy-950 text-gold-400 flex flex-col items-center justify-center font-formula font-black text-xl shadow-md shrink-0">
                <span>{score}</span>
                <span className="text-[10px] text-white/70">من {quiz.questions.length}</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-burgundy-950">
                  {percentage >= 70 ? '🧪 إتقان كيميائي استثنائي!' : '💡 بداية طيبة، راجع التفسيرات أدناه وحاول مجدداً'}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  نسبتك: <strong className="text-burgundy-900">{percentage}%</strong> • تمت مراجعة إجاباتك وفق معايير د. عمر مجدي وتفسيرات الرنين والاتزان الكيميائي.
                </p>
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-6">
            {quiz.questions.map((q, qIndex) => {
              const selected = selectedAnswers[q.id];

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-burgundy-950 text-gold-400 font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                        0{qIndex + 1}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                        {q.question}
                      </h4>
                    </div>
                  </div>

                  {q.molecularSnippet && (
                    <div className="mr-9 px-3 py-1.5 rounded-lg bg-slate-100 font-formula text-xs font-semibold text-burgundy-900 w-fit">
                      معادلة الاسترشاد: {q.molecularSnippet}
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2 mr-9">
                    {q.options.map((opt, optIndex) => {
                      let optionStyle =
                        'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700';

                      if (submitted) {
                        if (optIndex === q.correctIndex) {
                          optionStyle =
                            'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold ring-1 ring-emerald-400';
                        } else if (selected === optIndex) {
                          optionStyle =
                            'border-rose-400 bg-rose-50 text-rose-900 line-through';
                        }
                      } else if (selected === optIndex) {
                        optionStyle =
                          'border-burgundy-950 bg-burgundy-50 text-burgundy-950 font-bold ring-1 ring-burgundy-900';
                      }

                      return (
                        <div
                          key={optIndex}
                          onClick={() => handleSelectOption(q.id, optIndex)}
                          className={`p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-between ${optionStyle}`}
                        >
                          <span>{opt}</span>
                          {submitted && optIndex === q.correctIndex && (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mr-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div className="mr-9 p-3.5 rounded-xl bg-gold-50/80 border border-gold-300 text-xs text-burgundy-950 leading-relaxed">
                      <strong className="text-burgundy-900 block mb-1">
                        🔬 التفسير العلمي لدكتور عمر مجدي:
                      </strong>
                      {q.scientificExplanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {submitted ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          ) : (
            <div className="text-xs text-slate-500 font-medium">
              أجبت عن {Object.keys(selectedAnswers).length} من {quiz.questions.length} أسئلة
            </div>
          )}

          <div className="flex gap-2">
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(selectedAnswers).length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-burgundy-950 to-burgundy-900 text-gold-400 hover:text-gold-300 font-bold text-xs sm:text-sm rounded-xl transition shadow-md disabled:opacity-50"
              >
                تسليم الإجابات ورصد النتيجة
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-burgundy-950 text-gold-400 font-bold text-xs sm:text-sm rounded-xl transition"
              >
                تمت المشاهدة
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
