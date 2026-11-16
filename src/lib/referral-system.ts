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
    rewardTitle: '50% Tuition Coupon — One Course',
    rewardDescription: 'A 50% discount coupon redeemable on one course of your choice. Redeem it through the academy director.',
    badge: 'Course Coupon',
  },
  {
    pointsNeeded: 200,
    rewardTitle: '50% Tuition Coupon — Two Courses (Top Reward)',
    rewardDescription: 'The program\'s top reward: a 50% discount coupon covering two courses. Referrals made through the platform link redeem on any two Phenol Academy courses; referrals made through a specific course link redeem on two courses from that instructor. Redeem it through the academy director.',
    badge: 'Double Coupon',
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
