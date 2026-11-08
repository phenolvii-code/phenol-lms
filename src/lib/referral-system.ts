/**
 * PHENOL ACADEMY - Course Referral & Academic Points Engine
 * Generates unique referral links per user, tracks conversions, and calculates milestone rewards.
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

const REFERRAL_STATS_KEY = 'phenol_user_referral_stats';
const ACTIVE_REFERRER_KEY = 'phenol_active_referred_by';

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
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('phenol_guest_referral_code');
    if (stored) return stored;
    const generated = `PH-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('phenol_guest_referral_code', generated);
    return generated;
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
  if (typeof window === 'undefined') {
    return {
      code: referralCode,
      points: 0,
      totalClicks: 0,
      successfulReferrals: 0,
      referredStudents: [],
    };
  }

  try {
    const raw = localStorage.getItem(`${REFERRAL_STATS_KEY}_${referralCode}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}

  return {
    code: referralCode,
    points: 0,
    totalClicks: 0,
    successfulReferrals: 0,
    referredStudents: [],
  };
};

export const saveReferralStats = (stats: ReferralStats): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${REFERRAL_STATS_KEY}_${stats.code}`, JSON.stringify(stats));
    window.dispatchEvent(new Event('phenol_referral_updated'));
  } catch (e) {}
};

/**
 * Tracks an incoming visitor arriving via ?ref=CODE
 */
export const captureIncomingReferral = (refCode: string | null): void => {
  if (typeof window === 'undefined' || !refCode) return;
  const clean = refCode.trim();
  if (clean.length < 2) return;

  try {
    localStorage.setItem(ACTIVE_REFERRER_KEY, clean);

    // Increment click count for that referrer
    const stats = getReferralStats(clean);
    stats.totalClicks += 1;
    saveReferralStats(stats);
  } catch (e) {}
};

export const getStoredReferrerCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_REFERRER_KEY);
  } catch (e) {
    return null;
  }
};

/**
 * Called when a student successfully registers or requests a course.
 * Awards points to the person who shared the link!
 */
export const awardReferralPoints = (newStudentEmail: string): void => {
  if (typeof window === 'undefined') return;
  const referrerCode = getStoredReferrerCode();
  if (!referrerCode) return;

  try {
    const stats = getReferralStats(referrerCode);
    const cleanEmail = newStudentEmail.trim().toLowerCase();

    if (!stats.referredStudents.includes(cleanEmail)) {
      stats.referredStudents.push(cleanEmail);
      stats.successfulReferrals += 1;
      stats.points += 50; // 50 points per successful cohort referral
      saveReferralStats(stats);
      // Clear after successful conversion
      localStorage.removeItem(ACTIVE_REFERRER_KEY);
    }
  } catch (e) {}
};
