import { supabase } from '@/lib/supabase';

export interface StudentNotification {
  id: string;
  student_id: string;
  course_id: string;
  lesson_id?: string | null;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Loads recent notifications for the logged-in student, ordered newest first.
 */
export async function fetchMyNotifications(): Promise<StudentNotification[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('student_notifications')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return (data as StudentNotification[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching notifications:', err);
    return [];
  }
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('student_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error marking notification as read:', err);
    return false;
  }
}

/**
 * Marks all unread notifications for the logged in student as read.
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('student_notifications')
      .update({ is_read: true })
      .eq('student_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error marking all notifications as read:', err);
    return false;
  }
}

/**
 * Admin: Sends an announcement or notification to all students in a course
 */
export async function adminNotifyCourseStudents(
  courseId: string,
  title: string,
  message: string,
  link: string,
  lessonId?: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('notify_course_students', {
      p_course_id: courseId,
      p_lesson_id: lessonId || null,
      p_title: title,
      p_message: message,
      p_link: link,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: Number(data) || 0 };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send notification' };
  }
}
