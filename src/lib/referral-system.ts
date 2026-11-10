/**
 * PHENOL ACADEMY - Course Referral & Academic Points Engine
 * Generates unique referral links per user, captures incoming referral codes.
 */

export interface ReferralStats {
  code: string;
  points: number;
  totalClicks: number;
  successfulReferrals: number;
  referredStudents: string[];
}

export interface ReferralMilestone {
  pointsNeeded: number;
  rewardTitle: string;
  rewardDescription: string;
  badge: string;
}

export const REFERRAL_MILESTONES: ReferralMilestone[] = [
  {
    pointsNeeded: 50,
    rewardTitle: 'Bronze Academic Ambassador',
    rewardDescription: 'Verified Ambassador badge on your Student Telemetry profile.',
    badge: 'Bronze Tier',
  },
  {
    pointsNeeded: 100,
    rewardTitle: 'Dr. Omar Magdi Bonus Problem Bank',
    rewardDescription: 'Instant unlock for 50+ non-routine organic mechanism challenge questions with solution keys.',
    badge: 'Problem Bank',
  },
  {
    pointsNeeded: 250,
    rewardTitle: 'Course Tuition Waiver (50% Grant)',
    rewardDescription: '50% academic tuition grant on any upcoming course or syllabus revision module.',
    badge: 'Tuition Grant',
  },
  {
    pointsNeeded: 500,
    rewardTitle: 'Full Course Access + 1-on-1 Consultation',
    rewardDescription: 'Full 100% course activation waiver plus a 1-on-1 academic consultation session directly with Dr. Omar Magdi.',
    badge: 'Full Scholarship',
  },
];

export const getReferralCodeForUser = (user: { academicCode?: string; email?: string; id?: string } | null): string => {
  if (user?.academicCode && user.academicCode.length > 2) {
    return user.academicCode;
  }
  if (user?.email) {
    const hash = Math.abs(
      user.email.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    ).toString(36).substring(0, 4).toUpperCase();
    return `PH-${hash}`;
  }
  return 'PH-SCHOLAR';
};

export const generateCourseReferralLink = (courseId: string, referralCode: string): string => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}/courses/${courseId}?ref=${encodeURIComponent(referralCode)}`;
  }
  return `https://phenol-lms.vercel.app/courses/${courseId}?ref=${encodeURIComponent(referralCode)}`;
};

export const getReferralStats = (referralCode: string): ReferralStats => {
  return {
    code: referralCode,
    points: 0,
    totalClicks: 0,
    successfulReferrals: 0,
    referredStudents: [],
  };
};

export const captureIncomingReferral = (refCode: string | null): void => {
  if (typeof window === 'undefined' || !refCode) return;
  const clean = refCode.trim();
  if (clean.length < 2) return;
  try {
    sessionStorage.setItem('phenol_ref_code', clean);
    localStorage.setItem('phenol_ref_code', clean);
  } catch (e) {}
};

export const getStoredReferrerCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem('phenol_ref_code') || localStorage.getItem('phenol_ref_code');
  } catch (e) {
    return null;
  }
};
