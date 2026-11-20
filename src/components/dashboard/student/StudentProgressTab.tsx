'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Clock, RefreshCw, TrendingUp } from 'lucide-react';
import { MyCourseProgressRow, listMyCourseProgress } from '@/lib/data/analytics';

// ==============================================================================
// Student "My Progress" tab (migration 033) - READ-ONLY.
// Shows the student's OWN enrollment progress, quiz average and next lesson.
// A course with no published lessons shows "No lessons yet" rather than 0%.
// ==============================================================================

const fmtPct = (v: number | null | undefined) =>
  v === null || v === undefined ? null : `${Number(v).toFixed(1)}%`;

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

export const StudentProgressTab: React.FC = () => {
  const [rows, setRows] = useState<MyCourseProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listMyCourseProgress());
    } catch (e: any) {
      setError(e?.message || 'Could not load your progress.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeCourses = rows.filter((r) => r.enrollment_status === 'ACTIVE');
  const totalLessons = rows.reduce((sum, r) => sum + Number(r.lessons_total || 0), 0);
  const totalCompleted = rows.reduce((sum, r) => sum + Number(r.lessons_completed || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 font-display">My Progress</h2>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Your own completion and quiz record across every course you are enrolled in.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ivory-100 hover:bg-ivory-200 border border-hairline text-xs font-bold text-charcoal-900 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-sans">
          <span className="font-bold">Could not load your progress.</span> {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="p-6 rounded-2xl bg-ivory-100 border border-hairline text-center">
          <BookOpen className="w-6 h-6 text-charcoal-50 mx-auto mb-2" />
          <p className="text-xs text-charcoal-100 font-sans">
            You are not enrolled in any course yet. Once your enrollment is approved, your real
            progress will appear here.
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 block">
              Active Courses
            </span>
            <span className="text-lg font-bold font-mono text-charcoal-900 block">
              {activeCourses.length}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 block">
              Lessons Completed
            </span>
            <span className="text-lg font-bold font-mono text-charcoal-900 block">
              {totalCompleted} / {totalLessons}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 block">
              Quiz Attempts
            </span>
            <span className="text-lg font-bold font-mono text-charcoal-900 block">
              {rows.reduce((sum, r) => sum + Number(r.quiz_attempts || 0), 0)}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rows.map((r) => {
          const pct = fmtPct(r.progress_pct);
          const width =
            r.progress_pct === null
              ? 0
              : Math.max(0, Math.min(100, Number(r.progress_pct)));
          const isActive = r.enrollment_status === 'ACTIVE';

          return (
            <div
              key={r.course_id}
              className="p-4 sm:p-5 rounded-2xl bg-ivory-100 border border-hairline space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-charcoal-900 font-display">
                      {r.course_title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-mono ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-ivory-200 text-charcoal-100 border-hairline'
                      }`}
                    >
                      {r.enrollment_status}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-charcoal-100 block mt-0.5">
                    {r.course_code || '—'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-burgundy-500 block">
                    {pct ?? 'No lessons yet'}
                  </span>
                  <span className="text-[10px] font-mono text-charcoal-100 block">
                    {r.lessons_completed} of {r.lessons_total} lessons
                  </span>
                </div>
              </div>

              {r.progress_pct !== null && (
                <div className="h-2 w-full rounded-full bg-ivory-300 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-burgundy-500 transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono text-charcoal-100">
                <span className="inline-flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Quiz average:{' '}
                  <span className="text-charcoal-900 font-bold">
                    {r.quiz_attempts > 0
                      ? fmtPct(r.avg_quiz_pct) ?? '—'
                      : 'No attempts yet'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Last activity: {fmtDate(r.last_activity_at)}
                </span>
              </div>

              {r.next_lesson_title ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ivory-200/70 border border-hairline">
                  <ArrowRight className="w-3.5 h-3.5 text-burgundy-500 shrink-0" />
                  <span className="text-[11px] text-charcoal-100 font-sans">
                    Next lesson:{' '}
                    <span className="font-bold text-charcoal-900">{r.next_lesson_title}</span>
                  </span>
                </div>
              ) : (
                r.lessons_total > 0 &&
                r.lessons_completed >= r.lessons_total && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[11px] text-emerald-700 font-sans font-semibold">
                      All lessons in this course are completed.
                    </span>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
