'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  GraduationCap,
  Layers,
  RefreshCw,
  UserCog,
} from 'lucide-react';
import { PlatformOverview, getPlatformOverview } from '@/lib/data/analytics';

// ==============================================================================
// Founder Platform Overview (migration 033) - READ-ONLY, super_admin only.
// Every value is a real COUNT of rows. Zero means "zero rows", never an estimate.
// Activity counters are bounded by the ~30 day retention of media_access_log.
// ==============================================================================

const fmtDate = (iso: string | null) => {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export const PlatformOverviewTab: React.FC = () => {
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getPlatformOverview());
    } catch (e: any) {
      setError(e?.message || 'Could not load the platform overview.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = [
    {
      label: 'Students',
      value: data?.students_total,
      icon: GraduationCap,
      hint: 'Accounts with the student role',
    },
    {
      label: 'Instructors',
      value: data?.instructors_total,
      icon: UserCog,
      hint: 'Accounts with the instructor role',
    },
    {
      label: 'Courses',
      value: data?.courses_total,
      icon: Layers,
      hint: `${data?.published_courses_total ?? 0} approved & published`,
    },
    {
      label: 'Active Enrollments',
      value: data?.active_enrollments_total,
      icon: BookOpen,
      hint: `${data?.new_enrollments_30d ?? 0} activated in the last 30 days`,
    },
  ];

  const activity = [
    { label: 'Active students (7 days)', value: data?.active_students_7d },
    { label: 'Active students (30 days)', value: data?.active_students_30d },
    { label: 'Lessons completed (30 days)', value: data?.lessons_completed_30d },
    { label: 'Quiz attempts (30 days)', value: data?.quiz_attempts_30d },
    { label: 'Submissions awaiting grading', value: data?.pending_submissions_total },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-charcoal-900 font-display">
              Platform Overview
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-ivory-200 text-charcoal-100 border border-hairline">
              Read-Only
            </span>
          </div>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Live counters computed from the database. Nothing here is estimated or projected.
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
          <span className="font-bold">Could not load the overview.</span> {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="p-4 rounded-2xl bg-ivory-100 border border-hairline space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100">
                {k.label}
              </span>
              <k.icon className="w-3.5 h-3.5 text-charcoal-50" />
            </div>
            <span className="text-2xl font-extrabold font-formula text-charcoal-900 block">
              {loading || !data ? '—' : k.value}
            </span>
            <span className="text-[10px] text-charcoal-100 block">{k.hint}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-hairline bg-ivory-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-hairline flex items-center gap-2">
          <Activity className="w-4 h-4 text-burgundy-500" />
          <h3 className="text-xs font-bold text-charcoal-900 font-display uppercase tracking-wider">
            Activity
          </h3>
        </div>
        <div className="divide-y divide-hairline/60">
          {activity.map((a) => (
            <div key={a.label} className="px-4 py-3 flex items-center justify-between gap-4">
              <span className="text-xs text-charcoal-100 font-sans">{a.label}</span>
              <span className="text-sm font-bold font-mono text-charcoal-900">
                {loading || !data ? '—' : a.value}
              </span>
            </div>
          ))}
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            <span className="text-xs text-charcoal-100 font-sans">Last recorded activity</span>
            <span className="text-[11px] font-mono text-charcoal-900">
              {loading || !data ? '—' : fmtDate(data.last_activity_at)}
            </span>
          </div>
        </div>
        <div className="px-4 py-2.5 bg-ivory-200/60 border-t border-hairline">
          <p className="text-[10px] text-charcoal-100 font-sans leading-relaxed">
            Activity is derived from lesson media access, lesson completion, quiz submissions and
            problem-set submissions. The platform keeps roughly 30 days of media access logs, so
            &ldquo;last activity&rdquo; can only reach back that far. Finance figures live in the
            Academy Office and Earnings tabs, not here.
          </p>
        </div>
      </div>
    </div>
  );
};
