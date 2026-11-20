'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronRight,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  CourseAnalyticsRow,
  CourseStudentAnalyticsRow,
  listCourseStudentsAnalytics,
  listMyCoursesAnalytics,
} from '@/lib/data/analytics';

// ==============================================================================
// Instructor Course Analytics (migration 033) - READ-ONLY.
// Every number comes from the DB aggregation RPC. Averages are NULL when there
// is nothing to average: the UI then says "No data yet" instead of showing 0%
// (a 0% would be a fabricated result, not a measurement).
// ==============================================================================

const fmtPct = (v: number | null | undefined) =>
  v === null || v === undefined ? 'No data yet' : `${Number(v).toFixed(1)}%`;

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

const progressBar = (pct: number | null) => {
  if (pct === null || pct === undefined) return null;
  const width = Math.max(0, Math.min(100, Number(pct)));
  return (
    <div className="h-1.5 w-full rounded-full bg-ivory-300 overflow-hidden">
      <div
        className="h-full rounded-full bg-burgundy-500"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

export const InstructorAnalyticsTab: React.FC = () => {
  const [courses, setCourses] = useState<CourseAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [students, setStudents] = useState<CourseStudentAnalyticsRow[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listMyCoursesAnalytics();
      setCourses(rows);
      setSelectedCourseId((current) => {
        if (current && rows.some((r) => r.course_id === current)) return current;
        return rows[0]?.course_id ?? null;
      });
    } catch (e: any) {
      setError(e?.message || 'Could not load course analytics.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const loadStudents = useCallback(async (courseId: string) => {
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const rows = await listCourseStudentsAnalytics(courseId);
      setStudents(rows);
    } catch (e: any) {
      setStudentsError(e?.message || 'Could not load student analytics.');
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCourseId) loadStudents(selectedCourseId);
    else setStudents([]);
  }, [selectedCourseId, loadStudents]);

  const totalActiveStudents = courses.reduce((sum, c) => sum + Number(c.active_students || 0), 0);
  const totalPending = courses.reduce((sum, c) => sum + Number(c.pending_submissions || 0), 0);
  const totalQuizAttempts = courses.reduce((sum, c) => sum + Number(c.quiz_attempts || 0), 0);
  const attentionCount = students.filter((s) => s.needs_attention).length;

  const selectedCourse = courses.find((c) => c.course_id === selectedCourseId) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-charcoal-900 font-display">
              Course Analytics
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-ivory-200 text-charcoal-100 border border-hairline">
              Read-Only
            </span>
          </div>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Real progress, quiz performance and activity from your own courses. Nothing is estimated.
          </p>
        </div>
        <button
          type="button"
          onClick={loadCourses}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ivory-100 hover:bg-ivory-200 border border-hairline text-xs font-bold text-charcoal-900 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-sans">
          <span className="font-bold">Could not load analytics.</span> {error}
        </div>
      )}

      {/* KPI row - plain sums of real per-course counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 block">
            My Courses
          </span>
          <span className="text-lg font-bold font-mono text-charcoal-900 block">
            {loading ? '—' : courses.length}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 block">
            Active Students
          </span>
          <span className="text-lg font-bold font-mono text-charcoal-900 block">
            {loading ? '—' : totalActiveStudents}
          </span>
          <span className="text-[10px] text-charcoal-100 block">Across all your courses</span>
        </div>
        <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 block">
            Pending Submissions
          </span>
          <span className="text-lg font-bold font-mono text-amber-700 block">
            {loading ? '—' : totalPending}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 block">
            Quiz Attempts
          </span>
          <span className="text-lg font-bold font-mono text-charcoal-900 block">
            {loading ? '—' : totalQuizAttempts}
          </span>
        </div>
      </div>

      {!loading && !error && courses.length === 0 && (
        <div className="p-6 rounded-2xl bg-ivory-100 border border-hairline text-center">
          <BarChart3 className="w-6 h-6 text-charcoal-50 mx-auto mb-2" />
          <p className="text-xs text-charcoal-100 font-sans">
            You do not own any courses yet, so there is nothing to measure.
          </p>
        </div>
      )}

      {/* Per-course table */}
      {courses.length > 0 && (
        <div className="rounded-2xl border border-hairline bg-ivory-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-hairline flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-burgundy-500" />
            <h3 className="text-xs font-bold text-charcoal-900 font-display uppercase tracking-wider">
              Course Performance
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 border-b border-hairline">
                  <th className="px-4 py-2.5 font-semibold">Course</th>
                  <th className="px-3 py-2.5 font-semibold">Enrolled</th>
                  <th className="px-3 py-2.5 font-semibold">Active</th>
                  <th className="px-3 py-2.5 font-semibold">Lessons</th>
                  <th className="px-3 py-2.5 font-semibold">Avg Progress</th>
                  <th className="px-3 py-2.5 font-semibold">Quiz Avg</th>
                  <th className="px-3 py-2.5 font-semibold">Pending</th>
                  <th className="px-4 py-2.5 font-semibold">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => {
                  const isSelected = c.course_id === selectedCourseId;
                  return (
                    <tr
                      key={c.course_id}
                      onClick={() => setSelectedCourseId(c.course_id)}
                      className={`cursor-pointer border-b border-hairline/60 transition-colors ${
                        isSelected ? 'bg-ivory-200' : 'hover:bg-ivory-200/50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-burgundy-500' : 'text-charcoal-50'
                            }`}
                          />
                          <div>
                            <span className="text-xs font-bold text-charcoal-900 block">
                              {c.course_title}
                            </span>
                            <span className="text-[10px] font-mono text-charcoal-100 block">
                              {c.course_code || '—'}
                              {!c.is_published && ' · unpublished'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-charcoal-900">
                        {c.enrolled_total}
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-charcoal-900">
                        {c.active_students}
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-charcoal-900">
                        {c.lessons_total}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-xs font-mono ${
                            c.avg_progress_pct === null ? 'text-charcoal-50' : 'text-charcoal-900'
                          }`}
                        >
                          {fmtPct(c.avg_progress_pct)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-xs font-mono ${
                            c.avg_quiz_pct === null ? 'text-charcoal-50' : 'text-charcoal-900'
                          }`}
                        >
                          {fmtPct(c.avg_quiz_pct)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-xs font-mono ${
                            c.pending_submissions > 0 ? 'text-amber-700 font-bold' : 'text-charcoal-900'
                          }`}
                        >
                          {c.pending_submissions}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-mono text-charcoal-100">
                        {fmtDate(c.last_activity_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-student drill-down of the selected course */}
      {selectedCourse && (
        <div className="rounded-2xl border border-hairline bg-ivory-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-hairline flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-burgundy-500" />
              <h3 className="text-xs font-bold text-charcoal-900 font-display uppercase tracking-wider">
                Students — {selectedCourse.course_title}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-charcoal-100">
              {studentsLoading
                ? 'Loading…'
                : `${students.length} enrolled${
                    attentionCount > 0 ? ` · ${attentionCount} need attention` : ''
                  }`}
            </span>
          </div>

          {studentsError && (
            <div className="px-4 py-3 text-xs text-red-700 bg-red-50 border-b border-red-200">
              {studentsError}
            </div>
          )}

          {!studentsLoading && students.length === 0 && !studentsError && (
            <div className="p-6 text-center">
              <p className="text-xs text-charcoal-100 font-sans">
                No students are enrolled in this course yet.
              </p>
            </div>
          )}

          {students.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100 border-b border-hairline">
                    <th className="px-4 py-2.5 font-semibold">Student</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-3 py-2.5 font-semibold w-40">Progress</th>
                    <th className="px-3 py-2.5 font-semibold">Quiz Avg</th>
                    <th className="px-3 py-2.5 font-semibold">Pending</th>
                    <th className="px-3 py-2.5 font-semibold">Last Activity</th>
                    <th className="px-4 py-2.5 font-semibold">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.student_id} className="border-b border-hairline/60">
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-charcoal-900 block">
                          {s.student_name || 'Unnamed student'}
                        </span>
                        <span className="text-[10px] font-mono text-charcoal-100 block">
                          {s.student_code || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-mono ${
                            s.enrollment_status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-ivory-200 text-charcoal-100 border-hairline'
                          }`}
                        >
                          {s.enrollment_status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-charcoal-100">
                            <span>{s.lessons_completed}/{s.lessons_total} lessons</span>
                            <span className={s.progress_pct === null ? 'text-charcoal-50' : 'text-charcoal-900'}>
                              {fmtPct(s.progress_pct)}
                            </span>
                          </div>
                          {progressBar(s.progress_pct)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-charcoal-900">
                        {fmtPct(s.avg_quiz_pct)}
                        {s.quiz_attempts > 0 && (
                          <span className="text-[10px] text-charcoal-100 block">
                            {s.quiz_attempts} attempt{s.quiz_attempts === 1 ? '' : 's'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`text-xs font-mono ${
                            s.pending_submissions > 0 ? 'text-amber-700 font-bold' : 'text-charcoal-900'
                          }`}
                        >
                          {s.pending_submissions}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[11px] font-mono text-charcoal-100 block">
                          {fmtDate(s.last_activity_at)}
                        </span>
                        {s.days_inactive !== null && (
                          <span className="text-[10px] font-mono text-charcoal-50 block">
                            {s.days_inactive} day{s.days_inactive === 1 ? '' : 's'} ago
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.needs_attention ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono bg-amber-50 text-amber-800 border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            Needs attention
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-charcoal-50">
                            <Activity className="w-3 h-3" />
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-4 py-2.5 bg-ivory-200/60 border-t border-hairline">
            <p className="text-[10px] text-charcoal-100 font-sans leading-relaxed">
              &ldquo;Needs attention&rdquo; = active enrollment older than 7 days, under 50% progress,
              and no recorded activity in the last 7 days. Activity is limited to the last ~30 days
              kept by the platform.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
