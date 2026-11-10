/**
 * PHENOL ACADEMY - Persistent Course Storage
 * Single source of truth: Supabase PostgreSQL database.
 * Uses an in-memory cache for fast client navigation without localStorage pollution.
 */

import { ChemistryCourse, ChemistryLesson } from '@/types/lms';
import { supabase } from '@/lib/supabase';
import { CHEMISTRY_COURSES } from '@/data/mock-data';

let inMemoryCourses: ChemistryCourse[] = [...CHEMISTRY_COURSES];

export const getDeletedCourseIds = (): string[] => {
  return [];
};

export const markCourseDeleted = async (courseId: string): Promise<void> => {
  inMemoryCourses = inMemoryCourses.filter((c) => c.id !== courseId);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('phenol_courses_updated'));
  }
  try {
    await supabase.from('courses').delete().eq('id', courseId);
  } catch (e) {
    console.warn('Error deleting course from Supabase:', e);
  }
};

export const getStoredCourses = (): ChemistryCourse[] => {
  return inMemoryCourses;
};

export const saveStoredCourses = async (courses: ChemistryCourse[]): Promise<void> => {
  inMemoryCourses = courses;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('phenol_courses_updated'));
  }

  // Persist course and lessons to Supabase
  for (const c of courses) {
    try {
      await supabase.from('courses').upsert({
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

          const editorInput = l as any;
          if (editorInput.videoUrl || editorInput.pdfNotesUrl) {
            await supabase.from('lesson_assets').upsert({
              lesson_id: l.id,
              video_url: editorInput.videoUrl || null,
              pdf_notes_path: editorInput.pdfNotesUrl || null,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Notice saving course to Supabase:', err);
    }
  }
};

export const syncWithServerCourses = async (): Promise<ChemistryCourse[]> => {
  try {
    const { data: supaCourses, error } = await supabase
      .from('courses')
      .select('*, lessons(id, course_id, title, duration, type, summary, key_formulas, sort_order, created_at)');

    if (!error && Array.isArray(supaCourses) && supaCourses.length > 0) {
      const mappedCourses: ChemistryCourse[] = supaCourses.map((sc) => {
        const lessonsList: ChemistryLesson[] = Array.isArray(sc.lessons)
          ? sc.lessons
              .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
              .map((l: any) => ({
                id: l.id,
                title: l.title,
                duration: l.duration || '45 min',
                type: l.type || 'video',
                completed: false,
                summary: l.summary || 'Course module.',
                keyFormulas: l.key_formulas || undefined,
                timestamps: [
                  { timeSeconds: 0, timeLabel: '00:00', title: 'Foundational Introduction' },
                  { timeSeconds: 600, timeLabel: '10:00', title: 'Theoretical Mechanics' },
                  { timeSeconds: 1500, timeLabel: '25:00', title: 'Worked Exam Analysis' },
                ],
              }))
          : [];

        return {
          id: sc.id,
          code: sc.code,
          title: sc.title,
          subTitle: sc.sub_title || 'Theoretical & Analytical Foundations',
          description: sc.description || '',
          category: sc.category as any,
          categoryName: sc.category_name || 'Academic Program',
          level: sc.level || 'Academic Year 2026/2027',
          molecularFormula: sc.molecular_formula || undefined,
          thumbnail: sc.thumbnail || 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80',
          totalHours: sc.total_hours || '30 Academic Hours',
          colorAccent: sc.color_accent || '#641C32',
          accentBg: sc.accent_bg || 'bg-burgundy-950',
          lessons: lessonsList,
        };
      });

      inMemoryCourses = mappedCourses;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('phenol_courses_updated'));
      }
      return mappedCourses;
    }
  } catch (err) {
    console.warn('Supabase courses sync notice:', err);
  }
  return inMemoryCourses;
};
