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
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

    // Sync to server API in background
    fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courses }),
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
    if (Array.isArray(data.courses) && data.courses.length > 0) {
      const local = getStoredCourses();
      const courseMap = new Map<string, ChemistryCourse>();
      local.forEach((c) => courseMap.set(c.id, c));
      data.courses.forEach((c: ChemistryCourse) => courseMap.set(c.id, c));
      const merged = Array.from(courseMap.values());
      localStorage.setItem('phenol_courses', JSON.stringify(merged));
      window.dispatchEvent(new Event('phenol_courses_updated'));
    }
  } catch (e) {}
};
