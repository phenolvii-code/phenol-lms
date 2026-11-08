import { supabase } from '@/lib/supabase';

export interface LessonProgressRecord {
  student_id: string;
  lesson_id: string;
  course_id: string;
  completed_at: string;
  quiz_grade?: number;
}

export async function recordLessonProgress(courseId: string, lessonId: string, quizGrade?: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      student_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      completed_at: new Date().toISOString(),
      quiz_grade: quizGrade,
    });

  if (error) throw error;
}

export async function listCourseProgress(courseId: string): Promise<LessonProgressRecord[]> {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('course_id', courseId);

  if (error) {
    console.error('Error fetching course progress:', error);
    return [];
  }
  return data || [];
}
