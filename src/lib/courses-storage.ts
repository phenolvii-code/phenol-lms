/**
 * PHENOL ACADEMY - Persistent Course Storage
 * Keeps courses synchronized across Dashboard, Landing Catalog, and Course Details.
 * Automatically purges legacy dummy courses and guarantees permanent deletion persistence.
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

export const getDeletedCourseIds = (): string[] => {
  if (typeof window === 'undefined') return DUMMY_COURSE_IDS;
  try {
    const raw = localStorage.getItem('phenol_deleted_course_ids');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return Array.from(new Set([...DUMMY_COURSE_IDS, ...parsed]));
      }
    }
  } catch (e) {}
  return DUMMY_COURSE_IDS;
};

export const markCourseDeleted = (courseId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedCourseIds();
    if (!current.includes(courseId)) {
      current.push(courseId);
      localStorage.setItem('phenol_deleted_course_ids', JSON.stringify(current));
    }
    // Also notify server
    fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deletedId: courseId }),
    }).catch(() => {});
  } catch (e) {}
};

export const getStoredCourses = (): ChemistryCourse[] => {
  if (typeof window === 'undefined') return [];
  try {
    const deletedIds = getDeletedCourseIds();
    const raw = localStorage.getItem('phenol_courses');
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((c) => !deletedIds.includes(c.id));
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
    const deletedIds = getDeletedCourseIds();
    const clean = courses.filter((c) => !deletedIds.includes(c.id));
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

export const syncWithServerCourses = async (): Promise<ChemistryCourse[]> => {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/courses');
    if (!res.ok) return getStoredCourses();
    const data = await res.json();

    if (Array.isArray(data.deletedIds)) {
      const currentDeleted = getDeletedCourseIds();
      const combinedDeleted = Array.from(new Set([...currentDeleted, ...data.deletedIds]));
      localStorage.setItem('phenol_deleted_course_ids', JSON.stringify(combinedDeleted));
    }

    if (Array.isArray(data.courses)) {
      const deletedIds = getDeletedCourseIds();
      const serverClean = data.courses.filter(
        (c: ChemistryCourse) => !deletedIds.includes(c.id)
      );
      const localClean = getStoredCourses();

      const courseMap = new Map<string, ChemistryCourse>();
      localClean.forEach((c) => courseMap.set(c.id, c));
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
      const merged = Array.from(courseMap.values()).filter((c) => !deletedIds.includes(c.id));
      localStorage.setItem('phenol_courses', JSON.stringify(merged));
      window.dispatchEvent(new Event('phenol_courses_updated'));
      return merged;
    }
  } catch (e) {}
  return getStoredCourses();
};
