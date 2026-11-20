import { supabase } from '@/lib/supabase';

// ==============================================================================
// Analytics data module (migration 033).
// READ-ONLY: every function here calls a gated, STABLE RPC. Nothing is written.
// Honesty rule: averages can be null ("no data yet") and must never be turned
// into a 0 that looks like a real measurement.
// ==============================================================================

export interface CourseAnalyticsRow {
  course_id: string;
  course_title: string;
  course_code: string | null;
  is_published: boolean;
  enrolled_total: number;
  active_students: number;
  lessons_total: number;
  avg_progress_pct: number | null;
  students_completed_all: number;
  quiz_attempts: number;
  avg_quiz_pct: number | null;
  quiz_pass_rate_pct: number | null;
  pending_submissions: number;
  last_activity_at: string | null;
}

export interface CourseStudentAnalyticsRow {
  student_id: string;
  student_name: string | null;
  student_code: string | null;
  enrollment_status: string;
  approved_at: string | null;
  lessons_completed: number;
  lessons_total: number;
  progress_pct: number | null;
  quiz_attempts: number;
  avg_quiz_pct: number | null;
  last_quiz_at: string | null;
  pending_submissions: number;
  last_activity_at: string | null;
  days_inactive: number | null;
  needs_attention: boolean;
}

export interface MyCourseProgressRow {
  course_id: string;
  course_title: string;
  course_code: string | null;
  enrollment_status: string;
  approved_at: string | null;
  lessons_total: number;
  lessons_completed: number;
  progress_pct: number | null;
  quiz_attempts: number;
  avg_quiz_pct: number | null;
  last_activity_at: string | null;
  next_lesson_id: string | null;
  next_lesson_title: string | null;
}

export interface PlatformOverview {
  students_total: number;
  instructors_total: number;
  secretaries_total: number;
  courses_total: number;
  published_courses_total: number;
  active_enrollments_total: number;
  new_enrollments_30d: number;
  lessons_completed_30d: number;
  quiz_attempts_30d: number;
  pending_submissions_total: number;
  active_students_7d: number;
  active_students_30d: number;
  last_activity_at: string | null;
}

export async function listMyCoursesAnalytics(): Promise<CourseAnalyticsRow[]> {
  const { data, error } = await supabase.rpc('list_my_courses_analytics');
  if (error) throw error;
  return (data as CourseAnalyticsRow[]) || [];
}

export async function listCourseStudentsAnalytics(
  courseId: string
): Promise<CourseStudentAnalyticsRow[]> {
  const { data, error } = await supabase.rpc('list_course_students_analytics', {
    p_course_id: courseId,
  });
  if (error) throw error;
  return (data as CourseStudentAnalyticsRow[]) || [];
}

export async function listMyCourseProgress(): Promise<MyCourseProgressRow[]> {
  const { data, error } = await supabase.rpc('list_my_course_progress');
  if (error) throw error;
  return (data as MyCourseProgressRow[]) || [];
}

export async function getPlatformOverview(): Promise<PlatformOverview | null> {
  const { data, error } = await supabase.rpc('get_platform_overview');
  if (error) throw error;
  const rows = (data as PlatformOverview[]) || [];
  return rows[0] ?? null;
}
