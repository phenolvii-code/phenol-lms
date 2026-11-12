'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchQuizById, submitQuizAttempt, QuizSubmissionResult } from '@/lib/data/quizzes';
import { ChemistryQuiz } from '@/types/lms';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';

export default function QuizExamRoomPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;
  const quizId = params?.quizId as string;

  const [quiz, setQuiz] = useState<ChemistryQuiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);

  // Load Quiz Data
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const data = await fetchQuizById(quizId);
      if (data) {
        setQuiz(data);
        setTimeLeftSeconds((data.durationMinutes || 15) * 60);
      }
      setIsLoading(false);
    }
    load();
  }, [quizId]);

  // Live Countdown Timer
  useEffect(() => {
    if (!quiz || isSubmitted || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, isSubmitted, timeLeftSeconds]);

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleAutoSubmit = async () => {
    if (!quiz || isSubmitted) return;
    setIsSubmitted(true);
    const res = await submitQuizAttempt(quiz, userAnswers);
    setSubmissionResult(res);
  };

  const handleManualSubmit = async () => {
    if (!quiz) return;
    const answeredCount = Object.keys(userAnswers).length;
    const total = quiz.questions.length;

    if (answeredCount < total) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${total} questions. Are you sure you want to submit now?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitted(true);
    const res = await submitQuizAttempt(quiz, userAnswers);
    setSubmissionResult(res);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-200 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-burgundy-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-charcoal-50">Loading assessment room...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-ivory-200 flex items-center justify-center p-4">
        <div className="p-8 bg-ivory-100 border border-hairline rounded-xl text-center space-y-4 max-w-md">
          <AlertCircle className="w-8 h-8 text-burgundy-600 mx-auto" />
          <h2 className="text-lg font-bold text-charcoal-900 font-display">Quiz Not Found</h2>
          <p className="text-xs text-charcoal-100">The requested evaluation quiz could not be located.</p>
          <Link
            href={`/courses/${courseId}`}
            className="inline-block py-2 px-4 rounded bg-burgundy-900 text-ivory-100 text-xs font-semibold"
          >
            Return to Course
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const optionLetters = ['A', 'B', 'C', 'D'];
  const isTimeCritical = timeLeftSeconds < 180; // less than 3 mins

  return (
    <div className="min-h-screen bg-ivory-200 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100 text-charcoal-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-ivory-100 border-b border-hairline shadow-quiet px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/courses/${courseId}`}
              className="p-1.5 rounded-lg border border-hairline bg-ivory-200 hover:bg-ivory-300 text-charcoal-100 transition-colors"
              title="Return to Course"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-formula text-[10px] text-burgundy-600 font-bold bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                  {quiz.badge || 'TIMED EVALUATION'}
                </span>
                <span className="text-xs text-charcoal-50 font-mono hidden sm:inline">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold font-display text-charcoal-900 truncate max-w-xs sm:max-w-md">
                {quiz.title}
              </h1>
            </div>
          </div>

          {/* Timer Display */}
          {!isSubmitted && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-xs sm:text-sm border shadow-sm ${
                isTimeCritical
                  ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                  : 'bg-ivory-200 text-charcoal-900 border-hairline'
              }`}
            >
              <Clock className="w-4 h-4 text-burgundy-600" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Assessment Room */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {!isSubmitted ? (
          <div className="space-y-6">
            {/* Question Progress Tracker Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {quiz.questions.map((q, idx) => {
                const isAnswered = userAnswers[idx] !== undefined;
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-8 min-w-[32px] px-2 rounded-lg font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-burgundy-900 text-ivory-100 ring-2 ring-burgundy-500/30'
                        : isAnswered
                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                        : 'bg-ivory-100 border border-hairline text-charcoal-100 hover:bg-ivory-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Current Question Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-ivory-100 border border-hairline shadow-editorial space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-charcoal-50 font-mono">
                  <span>Question {currentQuestionIndex + 1}</span>
                  {currentQuestion.molecularSnippet && (
                    <span className="font-mono text-xs text-burgundy-700 bg-burgundy-50 border border-burgundy-200 px-2.5 py-0.5 rounded">
                      {currentQuestion.molecularSnippet}
                    </span>
                  )}
                </div>

                <h2 className="text-base sm:text-lg font-bold font-display text-charcoal-900 leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt, oIdx) => {
                  const isSelected = userAnswers[currentQuestionIndex] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestionIndex, oIdx)}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3.5 ${
                        isSelected
                          ? 'border-burgundy-600 bg-burgundy-50/70 text-burgundy-950 shadow-sm ring-1 ring-burgundy-500'
                          : 'border-hairline bg-white hover:bg-ivory-50 text-charcoal-900'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-burgundy-900 border-burgundy-900 text-ivory-100'
                            : 'bg-ivory-200 border-charcoal-200 text-charcoal-900'
                        }`}
                      >
                        {optionLetters[oIdx] || oIdx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-sans leading-snug">
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Nav Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-hairline">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-hairline bg-ivory-50 hover:bg-ivory-200 text-xs font-semibold disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentQuestionIndex < quiz.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Assessment</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Results Screen */
          <div className="space-y-8 animate-fade-in">
            {/* Score Summary Masthead */}
            <div className="p-6 sm:p-10 rounded-2xl bg-ivory-100 border border-hairline shadow-editorial text-center space-y-4">
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-burgundy-50 border border-burgundy-200 text-burgundy-600">
                <Award className="w-7 h-7" />
              </div>

              <div>
                <span className="font-formula text-xs uppercase tracking-wider text-charcoal-50 block">
                  Assessment Result
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-charcoal-900 mt-1">
                  {submissionResult?.score || 0} / {submissionResult?.totalPoints || 20}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span
                    className={`px-3.5 py-1 rounded-full text-xs font-mono font-bold border ${
                      submissionResult?.passed
                        ? 'bg-ivory-200 text-charcoal-900 border-hairline'
                        : 'bg-ivory-200 text-burgundy-900 border-burgundy-200'
                    }`}
                  >
                    Score: {submissionResult?.percentage}% •{' '}
                    {submissionResult?.passed ? 'Mastery Achieved' : 'Requires Revision'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href={`/courses/${courseId}`}
                  className="px-5 py-2.5 rounded-lg bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-quiet transition-colors"
                >
                  Return to Course
                </Link>
              </div>
            </div>

            {/* Answer Model Review */}
            <div className="space-y-4">
              <h3 className="text-base font-bold font-display text-charcoal-900">
                Model Solution & Diagnostic Review
              </h3>

              <div className="space-y-4">
                {quiz.questions.map((q, idx) => {
                  const studentAns = userAnswers[idx];
                  const isCorrect = studentAns === q.correctIndex;

                  return (
                    <div
                      key={q.id || idx}
                      className={`p-5 sm:p-6 rounded-xl border bg-ivory-100 shadow-quiet space-y-3.5 ${
                        isCorrect ? 'border-emerald-200' : 'border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-charcoal-900 font-sans leading-snug">
                            {q.question}
                          </h4>
                        </div>
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+5 pts)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-800 bg-red-50 px-2 py-0.5 rounded shrink-0">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect
                          </span>
                        )}
                      </div>

                      {/* Options breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                        {q.options.map((opt, oIdx) => {
                          const isStudentSelected = studentAns === oIdx;
                          const isCorrectOption = oIdx === q.correctIndex;

                          let optionStyle = 'bg-white border-hairline text-charcoal-900';
                          if (isCorrectOption) {
                            optionStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold';
                          } else if (isStudentSelected && !isCorrect) {
                            optionStyle = 'bg-red-50 border-red-300 text-red-950 line-through';
                          }

                          return (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${optionStyle}`}
                            >
                              <span className="font-mono font-bold text-[10px]">
                                {optionLetters[oIdx]}:
                              </span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Scientific explanation */}
                      {q.scientificExplanation && (
                        <div className="p-3 bg-ivory-200 border-l-2 border-burgundy-500 rounded text-xs text-charcoal-100 space-y-1 ml-8 font-sans">
                          <span className="font-bold text-charcoal-900 block font-formula text-[10px] uppercase">
                            Dr. Omar Magdi Explanation:
                          </span>
                          <p className="leading-relaxed">{q.scientificExplanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
