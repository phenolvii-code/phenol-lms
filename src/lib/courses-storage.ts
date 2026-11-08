/**
 * PHENOL ACADEMY - Persistent Course Storage
 * Keeps courses synchronized across Dashboard, Landing Catalog, and Course Details.
 * Automatically purges legacy dummy courses.
 */

import { ChemistryCourse } from '@/types/lms';

const DUMMY_COURSE_IDS = [
  'chem-ar-301',
  'chem-ar-201',
  'chem-lang-301',
  'chem-lang-201',
  'chem-ig-301',
  'chem-stem-201',
  'chem-uni-401',
  'chem-uni-402',
  'chem-ar-302',
  'chem-lang-302',
  'chem-ig-303',
  'chem-univ-401',
];

export const getStoredCourses = (): ChemistryCourse[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('phenol_courses');
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((c) => !DUMMY_COURSE_IDS.includes(c.id));
        if (clean.length !== parsed.length) {
          localStorage.setItem('phenol_courses', JSON.stringify(clean));
        }
        return clean;
      }
    }
  } catch (e) {
    console.error('Error reading stored courses:', e);
  }
  return [];
};

export const saveStoredCourses = (courses: ChemistryCourse[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const clean = courses.filter((c) => !DUMMY_COURSE_IDS.includes(c.id));
    localStorage.setItem('phenol_courses', JSON.stringify(clean));
    window.dispatchEvent(new Event('phenol_courses_updated'));

    // Sync to server API in background
    fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courses: clean }),
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving stored courses:', e);
  }
};

export const syncWithServerCourses = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/courses');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.courses)) {
      const serverClean = data.courses.filter(
        (c: ChemistryCourse) => !DUMMY_COURSE_IDS.includes(c.id)
      );
      const local = getStoredCourses();
      const courseMap = new Map<string, ChemistryCourse>();
      local.forEach((c) => courseMap.set(c.id, c));
      serverClean.forEach((sc: ChemistryCourse) => {
        const existing = courseMap.get(sc.id);
        if (!existing) {
          courseMap.set(sc.id, sc);
        } else {
          const exLessons = existing.lessons || [];
          const scLessons = sc.lessons || [];
          if (scLessons.length > exLessons.length) {
            courseMap.set(sc.id, { ...existing, lessons: scLessons });
          }
        }
      });
      const merged = Array.from(courseMap.values());
      localStorage.setItem('phenol_courses', JSON.stringify(merged));
      window.dispatchEvent(new Event('phenol_courses_updated'));
    }
  } catch (e) {}
};
