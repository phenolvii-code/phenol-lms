/**
 * PHENOL ACADEMY - Instructor Reviews & Scholastic Evaluations
 * Stores and manages student ratings, testimonials, and moderation.
 * Dual-layered persistence: Supabase PostgreSQL + Local client cache.
 */

import { supabase } from '@/lib/supabase';

export interface InstructorReview {
  id: string;
  instructorId: string;
  studentName: string;
  studentEmail: string;
  studentCode?: string;
  studentTrack?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

const SEED_REVIEWS: InstructorReview[] = [];

const STORAGE_KEY = 'phenol_instructor_reviews';

export const getStoredReviews = (): InstructorReview[] => {
  if (typeof window === 'undefined') return SEED_REVIEWS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REVIEWS));
      return SEED_REVIEWS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_REVIEWS;
  } catch (e) {
    return SEED_REVIEWS;
  }
};

export const syncReviewsWithServer = async (): Promise<InstructorReview[]> => {
  try {
    const { data, error } = await supabase
      .from('instructor_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const serverReviews: InstructorReview[] = data.map((d: any) => ({
        id: d.id,
        instructorId: d.instructor_id,
        studentName: d.student_name,
        studentEmail: d.student_email,
        studentCode: d.student_code,
        studentTrack: d.student_track,
        rating: Number(d.rating) || 5,
        comment: d.comment,
        createdAt: d.created_at,
      }));

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverReviews));
        window.dispatchEvent(new Event('phenol_reviews_updated'));
      }
      return serverReviews;
    }
  } catch (err) {
    // Graceful fallback to client storage if table not yet created
  }
  return getStoredReviews();
};

export const getReviewsForInstructor = (instructorIdOrEmail: string): InstructorReview[] => {
  const all = getStoredReviews();
  const target = (instructorIdOrEmail || '').toLowerCase().trim();
  return all.filter((r) => {
    const rId = (r.instructorId || '').toLowerCase().trim();
    return (
      rId === target ||
      (target.includes('omar') && rId.includes('omar')) ||
      (target.includes('loki') && rId.includes('loki'))
    );
  });
};

export const getInstructorRating = (
  instructorIdOrEmail: string
): { rating: number; count: number } => {
  const reviews = getReviewsForInstructor(instructorIdOrEmail);
  if (reviews.length === 0) {
    // Default baseline for new faculty
    return { rating: 5.0, count: 0 };
  }
  const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
  const avg = Number((sum / reviews.length).toFixed(1));
  return { rating: avg, count: reviews.length };
};

export const addInstructorReview = async (review: {
  instructorId: string;
  studentName: string;
  studentEmail: string;
  studentCode?: string;
  studentTrack?: string;
  rating: number;
  comment: string;
}): Promise<InstructorReview> => {
  const all = getStoredReviews();
  const newReview: InstructorReview = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    instructorId: review.instructorId,
    studentName: review.studentName || 'Enrolled Scholar',
    studentEmail: review.studentEmail.toLowerCase(),
    studentCode: review.studentCode || 'PH-SCHOLAR',
    studentTrack: review.studentTrack || 'Academic Track',
    rating: Math.max(1, Math.min(5, review.rating)),
    comment: review.comment.trim(),
    createdAt: new Date().toISOString(),
  };

  const updated = [newReview, ...all];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('phenol_reviews_updated'));
    } catch (e) {}
  }

  // Persist to Supabase if table exists
  try {
    await supabase.from('instructor_reviews').insert([
      {
        id: newReview.id,
        instructor_id: newReview.instructorId,
        student_name: newReview.studentName,
        student_email: newReview.studentEmail,
        student_code: newReview.studentCode,
        student_track: newReview.studentTrack,
        rating: newReview.rating,
        comment: newReview.comment,
        created_at: newReview.createdAt,
      },
    ]);
  } catch (err) {
    console.warn('Could not persist review to Supabase yet (run SQL schema update):', err);
  }

  return newReview;
};

export const deleteInstructorReview = async (reviewId: string): Promise<void> => {
  const all = getStoredReviews();
  const updated = all.filter((r) => r.id !== reviewId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('phenol_reviews_updated'));
    } catch (e) {}
  }

  // Delete from Supabase if table exists
  try {
    await supabase.from('instructor_reviews').delete().eq('id', reviewId);
  } catch (err) {
    console.warn('Could not delete review from Supabase:', err);
  }
};
