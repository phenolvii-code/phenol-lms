/**
 * PHENOL ACADEMY - Persistent Course Storage
 * Keeps courses synchronized across Dashboard, Landing Catalog, and Course Details.
 */

import { CHEMISTRY_COURSES } from '@/data/mock-data';
import { ChemistryCourse } from '@/types/lms';

export const getStoredCourses = (): ChemistryCourse[] => {
  if (typeof window === 'undefined') return CHEMISTRY_COURSES;
  try {
    const raw = localStorage.getItem('phenol_courses');
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    // Initialize if not present
    localStorage.setItem('phenol_courses', JSON.stringify(CHEMISTRY_COURSES));
  } catch (e) {
    console.error('Error reading stored courses:', e);
  }
  return CHEMISTRY_COURSES;
};

export const saveStoredCourses = (courses: ChemistryCourse[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('phenol_courses', JSON.stringify(courses));
    window.dispatchEvent(new Event('phenol_courses_updated'));
  } catch (e) {
    console.error('Error saving stored courses:', e);
  }
};
