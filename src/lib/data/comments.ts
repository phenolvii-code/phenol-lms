import { supabase } from '@/lib/supabase';

export interface LessonCommentItem {
  id: string;
  lesson_id: string;
  course_id: string;
  author_id: string;
  parent_id?: string | null;
  content: string;
  created_at: string;
  author_name?: string;
  author_code?: string;
  author_role?: 'STUDENT' | 'INSTRUCTOR';
}

export async function fetchLessonComments(lessonId: string): Promise<LessonCommentItem[]> {
  try {
    const { data, error } = await supabase
      .from('lesson_comments')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Notice fetching lesson comments:', error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Fetch author details from registered_students & profiles
    const authorIds = Array.from(new Set(data.map((c) => c.author_id)));
    const { data: students } = await supabase
      .from('registered_students')
      .select('id, name, academic_code')
      .in('id', authorIds);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, role')
      .in('id', authorIds);

    const studentMap = new Map((students || []).map((s) => [s.id, s]));
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    return data.map((c) => {
      const st = studentMap.get(c.author_id);
      const pr = profileMap.get(c.author_id);
      const isInstructor = pr?.role === 'instructor';

      return {
        ...c,
        author_name: isInstructor ? 'Dr. Omar Magdi' : (st?.name || 'Enrolled Scholar'),
        author_code: isInstructor ? 'DIR-OMAR' : (st?.academic_code || 'PH-SCHOLAR'),
        author_role: isInstructor ? 'INSTRUCTOR' : 'STUDENT',
      };
    });
  } catch (err) {
    console.warn('fetchLessonComments error:', err);
    return [];
  }
}

export async function postLessonComment(
  courseId: string,
  lessonId: string,
  content: string,
  parentId?: string
): Promise<LessonCommentItem | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('lesson_comments')
    .insert({
      course_id: courseId,
      lesson_id: lessonId,
      author_id: user.id,
      parent_id: parentId || null,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error posting comment:', error);
    throw error;
  }

  return data;
}

export async function deleteLessonComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('lesson_comments')
    .delete()
    .eq('id', commentId);

  return !error;
}
