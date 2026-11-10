'use client';

import React from 'react';
import { CHEMISTRY_QUIZZES } from '@/data/mock-data';

interface StudentQuizzesTabProps {
  activeQuiz: any | null;
  setActiveQuiz: (quiz: any | null) => void;
  selectedAnswers: Record<string, number>;
  quizSubmitted: boolean;
  setQuizSubmitted: (val: boolean) => void;
  handleAnswerSelect: (qId: string, optIdx: number) => void;
}

export function StudentQuizzesTab({
  activeQuiz,
  setActiveQuiz,
  selectedAnswers,
  quizSubmitted,
  setQuizSubmitted,
  handleAnswerSelect,
}: StudentQuizzesTabProps) {
  return (
    <div className="space-y-6">
      {!activeQuiz ? (
        <div className="space-y-4">
          {CHEMISTRY_QUIZZES.map((quiz) => (
            <div
              key={quiz.id}
              className="border border-hairline rounded bg-ivory-100 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-quiet"
            >
              <div className="space-y-1">
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                  {quiz.badge}
                </span>
                <h3 className="text-base font-bold text-charcoal-900 font-display">
                  {quiz.title}
                </h3>
                <span className="text-xs text-charcoal-50 font-sans block">
                  {quiz.courseTitle} • {quiz.questions.length} Analytical Questions • {quiz.durationMinutes} Minutes
                </span>
              </div>

              <button
                onClick={() => {
                  setActiveQuiz(quiz);
                  setQuizSubmitted(false);
                }}
                className="px-5 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet"
              >
                Start Diagnostic Quiz
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-hairline rounded bg-ivory-100 p-6 sm:p-8 space-y-6 shadow-quiet">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div>
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                DIAGNOSTIC ASSESSMENT
              </span>
              <h2 className="text-lg font-bold text-charcoal-900 font-display">
                {activeQuiz.title}
              </h2>
            </div>
            <button
              onClick={() => setActiveQuiz(null)}
              className="text-xs font-semibold text-charcoal-50 hover:text-charcoal-900"
            >
              Exit Quiz
            </button>
          </div>

          <div className="space-y-8">
            {activeQuiz.questions.map((q: any, qIdx: number) => {
              const isCorrect = selectedAnswers[q.id] === q.correctIndex;

              return (
                <div key={q.id} className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="font-formula text-xs font-bold text-burgundy-500 pt-0.5">
                      Q{qIdx + 1}.
                    </span>
                    <h3 className="text-sm font-semibold text-charcoal-900 font-sans leading-relaxed">
                      {q.question}
                    </h3>
                  </div>

                  {q.molecularSnippet && (
                    <div className="ml-5 font-formula text-xs text-burgundy-500 bg-ivory-200 px-3 py-1.5 rounded inline-block">
                      {q.molecularSnippet}
                    </div>
                  )}

                  <div className="ml-5 space-y-2 pt-1">
                    {q.options.map((opt: string, optIdx: number) => {
                      const selected = selectedAnswers[q.id] === optIdx;
                      let borderClass = 'border-hairline hover:border-charcoal-100';

                      if (quizSubmitted) {
                        if (optIdx === q.correctIndex) {
                          borderClass =
                            'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold';
                        } else if (selected && !isCorrect) {
                          borderClass =
                            'border-burgundy-500 bg-burgundy-50/50 text-burgundy-900';
                        }
                      } else if (selected) {
                        borderClass =
                          'border-burgundy-500 bg-burgundy-50/30 text-burgundy-900 font-semibold';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleAnswerSelect(q.id, optIdx)}
                          className={`w-full text-left p-3 rounded border text-xs font-sans transition-colors ${borderClass}`}
                        >
                          <span className="font-formula font-bold mr-2">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="ml-5 p-3 rounded bg-ivory-200 border-l-2 border-burgundy-500 text-xs font-sans leading-relaxed">
                      <span className="font-bold text-charcoal-900 block mb-0.5">
                        Scientific Explanation:
                      </span>
                      <p className="text-charcoal-100">{q.scientificExplanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-hairline flex justify-end">
            {!quizSubmitted ? (
              <button
                onClick={() => setQuizSubmitted(true)}
                className="px-6 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
              >
                Submit Diagnostic Answers
              </button>
            ) : (
              <button
                onClick={() => setActiveQuiz(null)}
                className="px-6 py-2.5 rounded border border-hairline text-charcoal-900 text-xs font-semibold hover:bg-ivory-300"
              >
                Return to Quizzes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
