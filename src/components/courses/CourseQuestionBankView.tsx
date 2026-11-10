'use client';

import React, { useState } from 'react';
import { CourseQuestionBank } from '@/data/question-banks';
import { Printer, Filter, BookOpen } from 'lucide-react';

interface CourseQuestionBankViewProps {
  bank: CourseQuestionBank;
}

export function CourseQuestionBankView({ bank }: CourseQuestionBankViewProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  const filteredQuestions = bank.questions.filter((q) => {
    if (selectedTopic === 'all') return true;
    return q.topic === selectedTopic;
  });

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-6 font-sans">
      {/* Worksheet Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 border border-burgundy-200 px-2 py-0.5 rounded">
              {bank.courseCode}
            </span>
            <span className="text-xs font-mono text-charcoal-50 uppercase tracking-wider">
              Academic Problem Bank
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-charcoal-900 mt-1">
            Question Bank / بنك الأسئلة التدريبي
          </h2>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Static problem sets for notebook derivation, practice, and exam preparation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-hairline bg-ivory-100 hover:bg-ivory-300 text-charcoal-900 text-xs font-semibold shadow-quiet transition-colors"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Worksheet</span>
          </button>
        </div>
      </div>

      {/* Topic Filter Bar */}
      {bank.topics && bank.topics.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 print:hidden">
          <span className="text-xs font-mono text-charcoal-50 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Topic:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              selectedTopic === 'all'
                ? 'bg-burgundy-900 text-ivory-100'
                : 'bg-ivory-100 border border-hairline text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            All Questions ({bank.questions.length})
          </button>
          {bank.topics.map((t) => {
            const count = bank.questions.filter((q) => q.topic === t).length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTopic(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  selectedTopic === t
                    ? 'bg-burgundy-900 text-ivory-100'
                    : 'bg-ivory-100 border border-hairline text-charcoal-100 hover:text-charcoal-900'
                }`}
              >
                {t} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Questions Sheet (Clean, Paper-style Worksheet) */}
      <div className="space-y-6">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-hairline rounded bg-ivory-100">
            <BookOpen className="w-8 h-8 text-charcoal-50 mx-auto mb-2" />
            <p className="text-sm font-semibold text-charcoal-900">No questions found under this topic.</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="p-5 sm:p-6 rounded-xl border border-hairline bg-ivory-100 shadow-quiet space-y-4 print:border-b print:shadow-none print:bg-white"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-ivory-300 text-charcoal-900 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-hairline">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm sm:text-base font-semibold text-charcoal-900 leading-relaxed font-sans">
                      {q.question}
                    </p>
                    {q.topic && (
                      <span className="text-[10px] font-mono text-charcoal-50 block">
                        Chapter: {q.topic}
                      </span>
                    )}
                  </div>
                </div>

                {q.molecularSnippet && (
                  <span className="hidden sm:inline-block font-mono text-xs text-burgundy-700 bg-burgundy-50 border border-burgundy-200 px-2.5 py-1 rounded shrink-0">
                    {q.molecularSnippet}
                  </span>
                )}
              </div>

              {/* Mobile molecular snippet */}
              {q.molecularSnippet && (
                <div className="sm:hidden">
                  <span className="inline-block font-mono text-xs text-burgundy-700 bg-burgundy-50 border border-burgundy-200 px-2.5 py-1 rounded">
                    {q.molecularSnippet}
                  </span>
                </div>
              )}

              {/* Options (Pure A, B, C, D Static List) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 pl-10">
                {q.options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className="p-3 rounded-lg border border-hairline/80 bg-ivory-50/70 flex items-center gap-3 text-xs sm:text-sm text-charcoal-900"
                  >
                    <span className="w-5 h-5 rounded-full border border-charcoal-200 text-charcoal-900 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 bg-white">
                      {optionLetters[oIdx] || oIdx + 1}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
