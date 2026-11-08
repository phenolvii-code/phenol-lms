import { supabase } from '@/lib/supabase';

export interface LessonSummary {
  id: string;
  course_id: string;
  title: string;
  duration?: string;
  type?: 'video' | 'pdf' | 'reading';
  summary?: string;
  key_formulas?: string[];
  sort_order?: number;
  created_at?: string;
}

export interface CourseDetail {
  id: string;
  code: string;
  title: string;
  description: string;
  category?: string;
  color?: string;
  thumbnail?: string;
  total_hours?: string;
  total_lectures?: number;
  instructor_name?: string;
  lessons?: LessonSummary[];
}

export async function listCatalogueCourses(): Promise<CourseDetail[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching courses catalogue:', error);
    return [];
  }
  return data || [];
}

export async function getCourseWithLessons(courseId: string): Promise<CourseDetail | null> {
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
    return null;
  }

  // Explicit column selection on lessons table as enforced by 001_security.sql
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, course_id, title, duration, type, summary, key_formulas, sort_order, created_at')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true });

  if (lessonsError) {
    console.error('Error fetching course lessons:', lessonsError);
  }

  return {
    ...course,
    lessons: lessons || [],
  };
}

export async function getLessonMedia(lessonId: string): Promise<{ video_url?: string; pdf_notes_path?: string } | null> {
  const { data, error } = await supabase.rpc('get_lesson_media', {
    p_lesson_id: lessonId,
  });

  if (error) {
    console.error('Error getting gated lesson media:', error);
    return null;
  }

  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  return data || null;
}
