/**
 * PHENOL ACADEMY - Instructor Reviews & Scholastic Evaluations (PII-free)
 * Reviews are displayed ONLY through the migration-018 RPCs:
 *   - get_review_stats()        → aggregates per instructor (no identities)
 *   - get_instructor_reviews()  → a faculty member's reviews (no emails/codes)
 * The client can NEVER read reviewer emails or codes anymore (RLS).
 * localStorage is a cache of the last sync - never the source of truth.
 */

import { supabase } from '@/lib/supabase';

export interface InstructorReview {
  id: string;
  instructorId: string;
  studentName: string;
  studentEmail: string; // always '' — emails are never exposed (migration 018)
  studentCode?: string;
  studentTrack?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

interface ReviewStat {
  rating: number;
  count: number;
}

const STATS_KEY = 'phenol_review_stats';

let reviewStats: Record<string, ReviewStat> = {};
let reviewsCache: Record<string, InstructorReview[]> = {};

const readStatsFromCache = (): Record<string, ReviewStat> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const readReviewsFromCache = (instructorId: string): InstructorReview[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`phenol_reviews_${instructorId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Refreshes the aggregate rating stats (one call for the whole directory).
 * NO reviewer identities are fetched or stored.
 */
export const syncReviewsWithServer = async (): Promise<InstructorReview[]> => {
  try {
    const { data, error } = await supabase.rpc('get_review_stats');
    if (!error && Array.isArray(data)) {
      const stats: Record<string, ReviewStat> = {};
      data.forEach((row: any) => {
        const key = (row.instructor_id || '').toLowerCase();
        if (!key) return;
        const count = Number(row.review_count) || 0;
        stats[key] = {
          rating: count > 0 ? Number(row.avg_rating) || 0 : 5.0,
          count,
        };
      });
      reviewStats = stats;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
        window.dispatchEvent(new Event('phenol_reviews_updated'));
      }
    }
  } catch (err) {
    console.warn('Notice syncing review stats:', err);
  }
  return [];
};

/** Fetches ONE instructor's reviews via the PII-free RPC (safe for anon). */
export const fetchInstructorReviews = async (
  instructorIdOrEmail: string
): Promise<InstructorReview[]> => {
  const key = (instructorIdOrEmail || '').toLowerCase().trim();
  if (!key) return [];

  try {
    const { data, error } = await supabase.rpc('get_instructor_reviews', {
      p_instructor_id: instructorIdOrEmail,
    });

    if (!error && Array.isArray(data)) {
      const reviews: InstructorReview[] = data.map((d: any) => ({
        id: d.id,
        instructorId: key,
        studentName: d.student_name || 'Enrolled Scholar',
        studentEmail: '',
        rating: Number(d.rating) || 5,
        comment: d.comment || '',
        createdAt: d.created_at,
      }));
      reviewsCache[key] = reviews;
      if (typeof window !== 'undefined') {
        localStorage.setItem(`phenol_reviews_${key}`, JSON.stringify(reviews));
        window.dispatchEvent(new Event('phenol_reviews_updated'));
      }
      return reviews;
    }
  } catch (err) {
    console.warn('Notice fetching instructor reviews:', err);
  }
  return getReviewsForInstructor(key);
};

/** Cached list for display (refreshed via fetchInstructorReviews). */
export const getReviewsForInstructor = (instructorIdOrEmail: string): InstructorReview[] => {
  const key = (instructorIdOrEmail || '').toLowerCase().trim();
  return reviewsCache[key] || readReviewsFromCache(key);
};

/** Rating from the aggregate stats cache (defaults 5.0 baseline). */
export const getInstructorRating = (
  instructorIdOrEmail: string
): { rating: number; count: number } => {
  const key = (instructorIdOrEmail || '').toLowerCase().trim();
  const stats = Object.keys(reviewStats).length > 0 ? reviewStats : readStatsFromCache();
  return stats[key] || { rating: 5.0, count: 0 };
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

  const { error } = await supabase.from('instructor_reviews').insert([
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
  if (error) {
    console.error('Could not persist review:', error.message);
  } else {
    // Refresh PII-free views + stats (RLS-verified insert).
    await Promise.all([
      fetchInstructorReviews(newReview.instructorId),
      syncReviewsWithServer(),
    ]);
  }

  return newReview;
};

export const deleteInstructorReview = async (reviewId: string): Promise<void> => {
  const { error } = await supabase.from('instructor_reviews').delete().eq('id', reviewId);
  if (error) {
    console.error('Could not delete review:', error.message);
  }
};
