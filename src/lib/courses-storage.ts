/**
 * PHENOL ACADEMY - Persistent Course Storage
 * Synchronizes courses and lessons directly with Supabase Postgres database.
 * Falls back to localStorage for instant UI rendering and offline resilience.
 */

import { ChemistryCourse, ChemistryLesson } from '@/types/lms';
import { supabase } from '@/lib/supabase';

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
    // Delete from Supabase database
    supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .then(({ error }) => {
        if (error) console.warn('Supabase course deletion note:', error.message);
      });
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

export const saveStoredCourses = async (courses: ChemistryCourse[]): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    const deletedIds = getDeletedCourseIds();
    const clean = courses.filter((c) => !deletedIds.includes(c.id));
    localStorage.setItem('phenol_courses', JSON.stringify(clean));
    window.dispatchEvent(new Event('phenol_courses_updated'));

    // Asynchronously persist every course and its lessons to Supabase
    for (const c of clean) {
      const { error: courseErr } = await supabase.from('courses').upsert({
        id: c.id,
        code: c.code,
        title: c.title,
        sub_title: c.subTitle || null,
        description: c.description || '',
        category: c.category,
        category_name: c.categoryName || 'Academic Program',
        level: c.level || 'Academic Year 2026/2027',
        molecular_formula: c.molecularFormula || null,
        thumbnail: c.thumbnail || null,
        total_hours: c.totalHours || null,
        color_accent: c.colorAccent || '#641C32',
        accent_bg: c.accentBg || 'bg-burgundy-950',
      });

      if (courseErr) {
        console.warn('Notice syncing course to Supabase:', courseErr.message);
      }

      // Sync lessons if any
      if (Array.isArray(c.lessons) && c.lessons.length > 0) {
        for (let idx = 0; idx < c.lessons.length; idx++) {
          const l = c.lessons[idx];
          await supabase.from('lessons').upsert({
            id: l.id,
            course_id: c.id,
            title: l.title,
            duration: l.duration || '45 min',
            type: l.type || 'video',
            summary: l.summary || null,
            key_formulas: l.keyFormulas || null,
            sort_order: idx,
          });

          if (l.videoUrl || l.pdfNotesUrl) {
            await supabase.from('lesson_assets').upsert({
              lesson_id: l.id,
              video_url: l.videoUrl || null,
              pdf_notes_path: l.pdfNotesUrl || null,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Error saving stored courses:', e);
  }
};

export const syncWithServerCourses = async (): Promise<ChemistryCourse[]> => {
  if (typeof window === 'undefined') return [];
  try {
    const deletedIds = getDeletedCourseIds();

    // Query Supabase public.courses directly
    const { data: supaCourses, error } = await supabase
      .from('courses')
      .select('*, lessons(*)');

    if (!error && Array.isArray(supaCourses) && supaCourses.length > 0) {
      const mappedCourses: ChemistryCourse[] = supaCourses
        .filter((sc) => !deletedIds.includes(sc.id))
        .map((sc) => {
          const lessonsList: ChemistryLesson[] = Array.isArray(sc.lessons)
            ? sc.lessons
                .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                .map((l: any) => ({
                  id: l.id,
                  title: l.title,
                  duration: l.duration || '45 min',
                  type: l.type || 'video',
                  completed: false,
                  summary: l.summary || undefined,
                  keyFormulas: l.key_formulas || undefined,
                  videoUrl: l.video_url || undefined,
                  pdfNotesUrl: l.pdf_notes_url || undefined,
                  timestamps: [
                    { timeSeconds: 0, timeLabel: '00:00', title: 'Introduction & Foundations' },
                    { timeSeconds: 600, timeLabel: '10:00', title: 'Mechanism Analysis' },
                    { timeSeconds: 1500, timeLabel: '25:00', title: 'Diagnostic Applications' },
                  ],
                }))
            : [];

          return {
            id: sc.id,
            code: sc.code,
            title: sc.title,
            subTitle: sc.sub_title || undefined,
            description: sc.description || '',
            category: sc.category as any,
            categoryName: sc.category_name,
            level: sc.level,
            molecularFormula: sc.molecular_formula || undefined,
            thumbnail: sc.thumbnail || 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80',
            totalHours: sc.total_hours || undefined,
            colorAccent: sc.color_accent || '#641C32',
            accentBg: sc.accent_bg || 'bg-burgundy-950',
            lessons: lessonsList,
          };
        });

      if (mappedCourses.length > 0) {
        localStorage.setItem('phenol_courses', JSON.stringify(mappedCourses));
        window.dispatchEvent(new Event('phenol_courses_updated'));
        return mappedCourses;
      }
    }
  } catch (e) {
    console.warn('syncWithServerCourses error:', e);
  }
  return getStoredCourses();
};
