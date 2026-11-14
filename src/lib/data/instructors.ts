/**
 * PHENOL ACADEMY - Dynamic Multi-Instructor Directory
 * Single source of truth for platform teaching chairs, fellows, and instructors.
 * Dynamically synchronizes instructors from Supabase + localStorage.
 */

import { supabase } from '@/lib/supabase';
import { InstructorProfile } from '@/types/lms';
import { getInstructorRating } from '@/lib/data/reviews';

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

// Seed instructors if additional faculty chairs are needed
const SEED_INSTRUCTORS: InstructorProfile[] = [
  FOUNDER_INSTRUCTOR,
  {
    id: 'phenol-loki',
    name: 'Phenol Loki',
    title: 'Faculty Fellow & Sciences Mentor',
    bio: 'Dedicated educator specializing in conceptual deconstruction, applied physical sciences, and diagnostic exam analytics across secondary and international levels.',
    avatar: '',
    specialization: 'Physical Sciences & Analytical Mechanics',
    supervisionScope: 'Secondary & Baccalaureate Chair',
    whatsapp: 'https://wa.me/201019688457',
    email: 'phenol.loki@gmail.com',
    subjects: ['Physical Chemistry', 'Thermodynamics', 'General Sciences'],
    coursesCount: 1,
    rating: 4.9,
    reviewsCount: 5,
  },
];

let inMemoryInstructors: InstructorProfile[] = [...SEED_INSTRUCTORS];

export const getPlatformInstructors = (): InstructorProfile[] => {
  if (typeof window === 'undefined') return inMemoryInstructors;

  // Hydrate custom instructor profiles from localStorage
  try {
    const rawInstructors = localStorage.getItem('phenol_all_instructors');
    if (rawInstructors) {
      const parsed = JSON.parse(rawInstructors);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryInstructors = parsed;
      }
    }

    // Check Dr. Omar's global avatar
    const globalAvatar = localStorage.getItem('phenol_global_instructor_avatar');
    if (globalAvatar && inMemoryInstructors[0]) {
      inMemoryInstructors[0].avatar = globalAvatar;
    }

    // Inspect registered students/users in localStorage for any with role === 'instructor'
    const regRaw = localStorage.getItem('phenol_registered_students');
    if (regRaw) {
      const regList = JSON.parse(regRaw);
      if (Array.isArray(regList)) {
        regList.forEach((user: any) => {
          const email = (user.email || '').toLowerCase().trim();
          if (!email || email === 'phenolvii@gmail.com') return;

          const role =
            localStorage.getItem(`phenol_user_role_${email}`) ||
            user.role;

          if (role === 'instructor') {
            const instId = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '-');
            const existingIdx = inMemoryInstructors.findIndex(
              (i) => i.id === instId || (i.email && i.email.toLowerCase() === email)
            );

            // Check custom profile override
            let customBio = '';
            let customTitle = '';
            let customAvatar = '';
            let customPhone = user.phone || '';
            let customSpec = '';

            try {
              const profRaw = localStorage.getItem(`phenol_instructor_profile_${user.id || instId}`);
              if (profRaw) {
                const parsedProf = JSON.parse(profRaw);
                customBio = parsedProf.bio || '';
                customTitle = parsedProf.title || '';
                customAvatar = parsedProf.avatar || '';
                customPhone = parsedProf.phone || customPhone;
                customSpec = parsedProf.specialization || '';
              }
            } catch (e) {}

            const ratingData = getInstructorRating(instId);

            const instProfile: InstructorProfile = {
              id: instId,
              name: user.name || email.split('@')[0],
              title: customTitle || 'Academic Instructor & Faculty Fellow',
              bio:
                customBio ||
                'Faculty educator dedicated to first-principles conceptual clarity and causal curricular deconstruction.',
              avatar: customAvatar || user.avatar || user.avatar_url || '',
              specialization: customSpec || user.academicTrack || 'General & Advanced Sciences',
              supervisionScope: 'Faculty Teaching Fellow',
              whatsapp: customPhone ? `https://wa.me/${customPhone.replace(/[^0-9]/g, '')}` : undefined,
              email: email,
              subjects: [user.academicTrack || 'Sciences'],
              coursesCount: 1,
              rating: ratingData.rating,
              reviewsCount: ratingData.count,
            };

            if (existingIdx >= 0) {
              inMemoryInstructors[existingIdx] = {
                ...inMemoryInstructors[existingIdx],
                ...instProfile,
              };
            } else {
              inMemoryInstructors.push(instProfile);
            }
          }
        });
      }
    }
  } catch (e) {}

  return inMemoryInstructors;
};

export const syncPlatformInstructors = async (): Promise<InstructorProfile[]> => {
  const currentList = [...getPlatformInstructors()];

  try {
    // 1. Fetch from Supabase profiles
    const { data: supaProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'instructor');

    if (Array.isArray(supaProfiles)) {
      supaProfiles.forEach((prof: any) => {
        const email = (prof.email || '').toLowerCase().trim();
        if (!email || email === 'phenolvii@gmail.com') return;

        const instId = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '-');
        const existingIdx = currentList.findIndex(
          (i) => i.id === instId || (i.email && i.email.toLowerCase() === email)
        );

        const ratingData = getInstructorRating(instId);

        const instProfile: InstructorProfile = {
          id: instId,
          name: prof.full_name || email.split('@')[0],
          title: prof.title || 'Academic Instructor & Faculty Fellow',
          bio:
            prof.bio ||
            'Faculty educator dedicated to first-principles conceptual clarity and causal curricular deconstruction.',
          avatar: prof.avatar_url || '',
          specialization: prof.specialization || 'General Sciences',
          supervisionScope: 'Faculty Teaching Fellow',
          whatsapp: prof.phone ? `https://wa.me/${prof.phone.replace(/[^0-9]/g, '')}` : undefined,
          email: email,
          subjects: ['Sciences'],
          coursesCount: 1,
          rating: ratingData.rating,
          reviewsCount: ratingData.count,
        };

        if (existingIdx >= 0) {
          currentList[existingIdx] = { ...currentList[existingIdx], ...instProfile };
        } else {
          currentList.push(instProfile);
        }
      });
    }
  } catch (err) {
    console.warn('Notice syncing instructors from Supabase:', err);
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
    inMemoryInstructors = all;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('phenol_all_instructors', JSON.stringify(all));
        localStorage.setItem(
          `phenol_instructor_profile_${all[idx].id}`,
          JSON.stringify(all[idx])
        );
        if (all[idx].avatar) {
          if (all[idx].id === 'dr-omar-magdi') {
            localStorage.setItem('phenol_global_instructor_avatar', all[idx].avatar);
          }
          localStorage.setItem(`phenol_avatar_${all[idx].id}`, all[idx].avatar);
        }
        window.dispatchEvent(new Event('phenol_instructors_updated'));
        window.dispatchEvent(new Event('phenol_user_profile_updated'));
      } catch (e) {}
    }
  }
};
