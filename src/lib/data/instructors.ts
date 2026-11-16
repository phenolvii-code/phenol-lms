/**
 * PHENOL ACADEMY - Multi-Instructor Directory (DB-driven)
 * Source of truth: the `instructor_profiles` table (migration 016) plus the
 * public `courses` ownership columns as a safety net. localStorage is a
 * CACHE of the last sync - never the source of truth (GEMINI.md rule 1).
 */

import { supabase } from '@/lib/supabase';
import { InstructorProfile } from '@/types/lms';
import { getInstructorRating, syncReviewsWithServer } from '@/lib/data/reviews';

export const FOUNDER_INSTRUCTOR: InstructorProfile = {
  id: 'dr-omar-magdi',
  name: 'Dr. Omar Magdi',
  title: 'Academic Director & Senior Chemistry Fellow (PharmD)',
  bio: 'PharmD graduate and chemistry educator. Focused on first-principles causality, physical chemistry, reaction mechanisms, and intellectual scientific pedagogy.',
  avatar: '',
  specialization: 'Organic Reaction Mechanisms, Chemical Kinetics & Pharmaceutical Sciences',
  supervisionScope: 'Academic Director across All 4 Tracks',
  whatsapp: 'https://wa.me/201019688457',
  email: 'phenolvii@gmail.com',
  subjects: ['Organic Chemistry', 'Physical Chemistry', 'General Chemistry'],
  coursesCount: 3,
  rating: 5.0,
  reviewsCount: 14,
};

/** Brand fallback used only until the first DB sync resolves. */
const FOUNDER_FALLBACK: InstructorProfile[] = [FOUNDER_INSTRUCTOR];

let inMemoryInstructors: InstructorProfile[] = [...FOUNDER_FALLBACK];

const slugFromEmail = (email: string): string =>
  email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '-');

const waLink = (phone?: string | null): string | undefined =>
  phone && phone.trim() ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : undefined;

export const getPlatformInstructors = (): InstructorProfile[] => {
  if (typeof window === 'undefined') return inMemoryInstructors;

  // localStorage is a CACHE of the last DB sync - never the source of truth.
  try {
    const raw = localStorage.getItem('phenol_all_instructors');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = [...parsed];
        if (!merged.some((m) => m.id === FOUNDER_INSTRUCTOR.id)) {
          merged.unshift(FOUNDER_INSTRUCTOR);
        }
        inMemoryInstructors = merged;
      }
    }
  } catch (e) {}

  return inMemoryInstructors;
};

export const syncPlatformInstructors = async (): Promise<InstructorProfile[]> => {
  const currentList: InstructorProfile[] = [FOUNDER_INSTRUCTOR];

  // 0) Refresh the aggregate review stats first (PII-free, one call) so the
  //    getInstructorRating() reads below are fresh, not a stale cache.
  await syncReviewsWithServer();

  // 1) REAL DB source: published instructor profiles (migration 016).
  try {
    const { data: profiles } = await supabase
      .from('instructor_profiles')
      .select('*')
      .eq('is_published', true);

    (profiles || []).forEach((p: any) => {
      const email = (p.email || '').toLowerCase().trim();
      if (!email) return;

      const existingIdx = currentList.findIndex(
        (i) => (i.email || '').toLowerCase() === email
      );
      const instId =
        existingIdx >= 0
          ? currentList[existingIdx].id || slugFromEmail(email)
          : slugFromEmail(email);
      const ratingData = getInstructorRating(instId);

      const instProfile: InstructorProfile = {
        id: instId,
        name: p.name || email.split('@')[0],
        title: p.title || 'Academic Instructor & Faculty Fellow',
        bio:
          p.bio ||
          'Faculty educator dedicated to first-principles conceptual clarity and causal curricular deconstruction.',
        avatar: p.avatar || '',
        specialization: p.specialization || 'General Sciences',
        supervisionScope: p.supervision_scope || 'Faculty Teaching Fellow',
        whatsapp: waLink(p.whatsapp),
        email,
        subjects: [p.specialization || 'Sciences'],
        coursesCount: 0,
        rating: ratingData.rating,
        reviewsCount: ratingData.count,
      };

      if (existingIdx >= 0) {
        currentList[existingIdx] = { ...currentList[existingIdx], ...instProfile };
      } else {
        currentList.push(instProfile);
      }
    });
  } catch (err) {
    console.warn('Notice syncing instructor profiles:', err);
  }

  // 2) Safety net: instructors who own published courses but have no profile
  //    row yet (they appear with their course ownership columns).
  try {
    const { data: supaCourses } = await supabase
      .from('courses')
      .select('instructor_id, instructor_name, instructor_email, instructor_avatar, instructor_whatsapp');

    (supaCourses || []).forEach((c: any) => {
      const email = (c.instructor_email || '').toLowerCase().trim();
      if (!email) return;

      const idx = currentList.findIndex((i) => (i.email || '').toLowerCase() === email);
      if (idx >= 0) {
        currentList[idx].coursesCount = (currentList[idx].coursesCount || 0) + 1;
        if (!currentList[idx].avatar && c.instructor_avatar) {
          currentList[idx].avatar = c.instructor_avatar;
        }
        return;
      }

      const instId = c.instructor_id || slugFromEmail(email);
      const ratingData = getInstructorRating(instId);
      currentList.push({
        id: instId,
        name: c.instructor_name || email.split('@')[0],
        title: 'Academic Instructor & Faculty Fellow',
        bio: 'Faculty educator dedicated to first-principles conceptual clarity and causal curricular deconstruction.',
        avatar: c.instructor_avatar || '',
        specialization: 'General Sciences',
        supervisionScope: 'Faculty Teaching Fellow',
        whatsapp: waLink(c.instructor_whatsapp),
        email,
        subjects: ['Sciences'],
        coursesCount: 1,
        rating: ratingData.rating,
        reviewsCount: ratingData.count,
      });
    });
  } catch (err) {
    console.warn('Notice syncing instructors from courses:', err);
  }

  // Founder avatar display cache (kept from the profile editor)
  if (typeof window !== 'undefined') {
    try {
      const globalAvatar = localStorage.getItem('phenol_global_instructor_avatar');
      if (globalAvatar && currentList[0]) {
        currentList[0].avatar = currentList[0].avatar || globalAvatar;
      }
    } catch (e) {}
  }

  inMemoryInstructors = currentList;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('phenol_all_instructors', JSON.stringify(currentList));
      window.dispatchEvent(new Event('phenol_instructors_updated'));
    } catch (e) {}
  }

  return currentList;
};

/**
 * Returns Dr. Omar Magdi + Top 3 highest-rated instructors for public feature sections.
 */
export const getTopFeaturedInstructors = (): InstructorProfile[] => {
  const all = getPlatformInstructors();
  const drOmar = all.find(
    (i) => i.id === 'dr-omar-magdi' || (i.email && i.email.toLowerCase() === 'phenolvii@gmail.com')
  ) || FOUNDER_INSTRUCTOR;

  const others = all
    .filter(
      (i) => i.id !== 'dr-omar-magdi' && (!i.email || i.email.toLowerCase() !== 'phenolvii@gmail.com')
    )
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const top3 = others.slice(0, 3);
  return [drOmar, ...top3];
};

export const getInstructorByIdOrSlug = (idOrSlug: string): InstructorProfile | undefined => {
  const all = getPlatformInstructors();
  const target = decodeURIComponent(idOrSlug || '').toLowerCase().trim();

  // Match Dr. Omar
  if (
    target === 'dr-omar-magdi' ||
    target === 'dr-omar' ||
    target === 'omar-magdi' ||
    target === 'phenolvii' ||
    target.includes('omar')
  ) {
    return all.find((i) => i.id === 'dr-omar-magdi') || FOUNDER_INSTRUCTOR;
  }

  // Exact ID or Email prefix or slug match
  return all.find((i) => {
    const iId = (i.id || '').toLowerCase();
    const iEmailPrefix = (i.email || '').toLowerCase().split('@')[0];
    const iSlug = (i.name || '').toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '-');
    return (
      iId === target ||
      iEmailPrefix === target ||
      iSlug === target ||
      target.includes(iEmailPrefix)
    );
  });
};

export const updateInstructorProfileData = async (
  idOrEmail: string,
  updatedData: Partial<InstructorProfile>
): Promise<void> => {
  const all = getPlatformInstructors();
  const target = idOrEmail.toLowerCase().trim();

  const idx = all.findIndex(
    (i) => (i.id && i.id.toLowerCase() === target) || (i.email && i.email.toLowerCase() === target)
  );

  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updatedData };
  } else {
    const newInst: InstructorProfile = {
      id: updatedData.id || target,
      name: updatedData.name || target,
      title: updatedData.title || 'Academic Instructor & Faculty Fellow',
      bio:
        updatedData.bio ||
        'Faculty educator dedicated to first-principles conceptual clarity and causal curricular deconstruction.',
      avatar: updatedData.avatar || '',
      specialization: updatedData.specialization || 'General Sciences',
      supervisionScope: updatedData.supervisionScope || 'Faculty Teaching Fellow',
      whatsapp: updatedData.whatsapp,
      email: updatedData.email || target,
      subjects: updatedData.subjects || ['Sciences'],
      coursesCount: updatedData.coursesCount || 0,
      rating: updatedData.rating || 5.0,
      reviewsCount: updatedData.reviewsCount || 0,
      ...updatedData,
    };
    all.push(newInst);
  }

  inMemoryInstructors = all;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('phenol_all_instructors', JSON.stringify(all));
      const targetId = idx >= 0 ? all[idx].id : (updatedData.id || target);
      const targetObj = idx >= 0 ? all[idx] : all[all.length - 1];
      localStorage.setItem(
        `phenol_instructor_profile_${targetId}`,
        JSON.stringify(targetObj)
      );
      if (targetObj.avatar) {
        if (targetObj.id === 'dr-omar-magdi') {
          localStorage.setItem('phenol_global_instructor_avatar', targetObj.avatar);
        }
        localStorage.setItem(`phenol_avatar_${targetId}`, targetObj.avatar);
      }
      window.dispatchEvent(new Event('phenol_instructors_updated'));
      window.dispatchEvent(new Event('phenol_user_profile_updated'));
    } catch (e) {}
  }
};
