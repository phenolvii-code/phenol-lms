/**
 * PHENOL ACADEMY - Instructor Reviews & Scholastic Evaluations
 * Stores and manages student ratings, testimonials, and moderation.
 */

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

const SEED_REVIEWS: InstructorReview[] = [
  {
    id: 'rev-dr-omar-1',
    instructorId: 'dr-omar-magdi',
    studentName: 'Youssef El-Sayed',
    studentEmail: 'youssef.scholar@gmail.com',
    studentCode: 'PH-4821',
    studentTrack: 'Secondary & Baccalaureate',
    rating: 5,
    comment:
      'Dr. Omar Magdi completely transformed my understanding of organic reaction mechanisms. Rather than forcing memorization, every arrow, nucleophile, and transition state was derived from fundamental physical principles.',
    createdAt: '2026-10-18T14:32:00Z',
  },
  {
    id: 'rev-dr-omar-2',
    instructorId: 'dr-omar-magdi',
    studentName: 'Mariam Farouk',
    studentEmail: 'mariam.farouk@gmail.com',
    studentCode: 'PH-3190',
    studentTrack: 'IGCSE & A-Levels',
    rating: 5,
    comment:
      'The precision in exam questions deconstruction and mark schemes is unmatched. The diagnostic problem sets mirror real Cambridge papers with profound conceptual clarity.',
    createdAt: '2026-10-29T10:15:00Z',
  },
  {
    id: 'rev-dr-omar-3',
    instructorId: 'dr-omar-magdi',
    studentName: 'Ziad Mahmoud',
    studentEmail: 'ziad.mahmoud@gmail.com',
    studentCode: 'PH-8422',
    studentTrack: 'Undergrads',
    rating: 5,
    comment:
      'Medicinal and physical chemistry lectures at the undergraduate level are delivered with doctoral-level rigor. Essential for pharmacy and medical scholars.',
    createdAt: '2026-11-04T18:45:00Z',
  },
];

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
    return Array.isArray(parsed) ? parsed : SEED_REVIEWS;
  } catch (e) {
    return SEED_REVIEWS;
  }
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
};
