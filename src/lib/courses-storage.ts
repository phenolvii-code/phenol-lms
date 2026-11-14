/**
 * PHENOL ACADEMY - Persistent Course Storage
 * Single source of truth: Supabase PostgreSQL database + Local client cache.
 * Preserves multi-instructor ownership and metadata seamlessly.
 */

import { ChemistryCourse, ChemistryLesson } from '@/types/lms';
import { supabase } from '@/lib/supabase';
import { CHEMISTRY_COURSES } from '@/data/mock-data';

const META_REGEX = /<!--PHENOL_META:([\s\S]*?)-->/;

let inMemoryCourses: ChemistryCourse[] = [...CHEMISTRY_COURSES];

// Initialize from localStorage if on browser
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('phenol_stored_courses');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryCourses = parsed;
      }
    }
  } catch (e) {}
}

export const getDeletedCourseIds = (): string[] => {
  return [];
};

export const markCourseDeleted = async (courseId: string): Promise<void> => {
  inMemoryCourses = inMemoryCourses.filter((c) => c.id !== courseId);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('phenol_stored_courses', JSON.stringify(inMemoryCourses));
    } catch (e) {}
    window.dispatchEvent(new Event('phenol_courses_updated'));
  }
  try {
    await supabase.from('courses').delete().eq('id', courseId);
  } catch (e) {
    console.warn('Error deleting course from Supabase:', e);
  }
};

export const getStoredCourses = (): ChemistryCourse[] => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('phenol_stored_courses');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryCourses = parsed;
        }
      }
    } catch (e) {}
  }
  return inMemoryCourses;
};

export const saveSingleCourse = async (c: ChemistryCourse): Promise<void> => {
  const current = getStoredCourses();
  const existingIdx = current.findIndex((item) => item.id === c.id);
  let updatedList: ChemistryCourse[];
  if (existingIdx >= 0) {
    updatedList = current.map((item) => (item.id === c.id ? c : item));
  } else {
    updatedList = [c, ...current];
  }
  inMemoryCourses = updatedList;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('phenol_stored_courses', JSON.stringify(updatedList));
    } catch (e) {}
    window.dispatchEvent(new Event('phenol_courses_updated'));
  }

  // Persist single course to Supabase
  try {
    const isDrOmar =
      c.instructorEmail?.toLowerCase() === 'phenolvii@gmail.com' ||
      c.instructorId === 'dr-omar-magdi' ||
      !c.instructorEmail;

    const resolvedId = isDrOmar
      ? 'dr-omar-magdi'
      : c.instructorId || (c.instructorEmail ? c.instructorEmail.split('@')[0] : 'dr-omar-magdi');
    const resolvedName = isDrOmar ? 'Dr. Omar Magdi' : c.instructorName || 'Academic Instructor';
    const resolvedEmail = isDrOmar ? 'phenolvii@gmail.com' : c.instructorEmail || 'phenolvii@gmail.com';

    const cleanDesc = (c.description || '').replace(META_REGEX, '').trim();
    const metaPayload = {
      instructorId: resolvedId,
      instructorName: resolvedName,
      instructorEmail: resolvedEmail,
      instructorAvatar: c.instructorAvatar || null,
      approvalStatus: c.approvalStatus || 'APPROVED',
      submittedAt: c.submittedAt || null,
    };
    const descWithMeta = `${cleanDesc}\n\n<!--PHENOL_META:${JSON.stringify(metaPayload)}-->`;

    await supabase.from('courses').upsert({
      id: c.id,
      code: c.code,
      title: c.title,
      sub_title: c.subTitle || null,
      description: descWithMeta,
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
    console.warn('Notice saving single course to Supabase:', err);
  }
};

export const saveStoredCourses = async (courses: ChemistryCourse[]): Promise<void> => {
  inMemoryCourses = courses;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('phenol_stored_courses', JSON.stringify(courses));
    } catch (e) {}
    window.dispatchEvent(new Event('phenol_courses_updated'));
  }

  // Persist courses with embedded instructor metadata to Supabase
  for (const c of courses) {
    try {
      const isDrOmar =
        c.instructorEmail?.toLowerCase() === 'phenolvii@gmail.com' ||
        c.instructorId === 'dr-omar-magdi' ||
        !c.instructorEmail;

      const resolvedId = isDrOmar
        ? 'dr-omar-magdi'
        : c.instructorId || (c.instructorEmail ? c.instructorEmail.split('@')[0] : 'dr-omar-magdi');
      const resolvedName = isDrOmar ? 'Dr. Omar Magdi' : c.instructorName || 'Academic Instructor';
      const resolvedEmail = isDrOmar ? 'phenolvii@gmail.com' : c.instructorEmail || 'phenolvii@gmail.com';

      const cleanDesc = (c.description || '').replace(META_REGEX, '').trim();
      const metaPayload = {
        instructorId: resolvedId,
        instructorName: resolvedName,
        instructorEmail: resolvedEmail,
        instructorAvatar: c.instructorAvatar || null,
        approvalStatus: c.approvalStatus || 'APPROVED',
        submittedAt: c.submittedAt || null,
      };
      const descWithMeta = `${cleanDesc}\n\n<!--PHENOL_META:${JSON.stringify(metaPayload)}-->`;

      await supabase.from('courses').upsert({
        id: c.id,
        code: c.code,
        title: c.title,
        sub_title: c.subTitle || null,
        description: descWithMeta,
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
        const rawDesc = sc.description || '';
        const match = rawDesc.match(META_REGEX);
        let meta: any = null;
        let cleanDesc = rawDesc;
        if (match) {
          try {
            meta = JSON.parse(match[1]);
            cleanDesc = rawDesc.replace(match[0], '').trim();
          } catch (e) {}
        }

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

        // Determine instructor ownership
        const instructorEmail = meta?.instructorEmail || (sc.instructor_email || 'phenolvii@gmail.com');
        const isDrOmar = instructorEmail.toLowerCase() === 'phenolvii@gmail.com';

        return {
          id: sc.id,
          code: sc.code,
          title: sc.title,
          subTitle: sc.sub_title || 'Theoretical & Analytical Foundations',
          description: cleanDesc,
          category: sc.category as any,
          categoryName: sc.category_name || 'Academic Program',
          level: sc.level || 'Academic Year 2026/2027',
          molecularFormula: sc.molecular_formula || undefined,
          thumbnail: sc.thumbnail || 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80',
          totalHours: sc.total_hours || '30 Academic Hours',
          colorAccent: sc.color_accent || '#641C32',
          accentBg: sc.accent_bg || 'bg-burgundy-950',
          instructorId: meta?.instructorId || (isDrOmar ? 'dr-omar-magdi' : (sc.instructor_id || 'dr-omar-magdi')),
          instructorName: meta?.instructorName || (isDrOmar ? 'Dr. Omar Magdi' : (sc.instructor_name || 'Academic Instructor')),
          instructorEmail: instructorEmail,
          instructorAvatar: meta?.instructorAvatar || sc.instructor_avatar || undefined,
          approvalStatus: meta?.approvalStatus || sc.approval_status || 'APPROVED',
          submittedAt: meta?.submittedAt || undefined,
          lessons: lessonsList,
        };
      });

      inMemoryCourses = mappedCourses;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('phenol_stored_courses', JSON.stringify(mappedCourses));
        } catch (e) {}
        window.dispatchEvent(new Event('phenol_courses_updated'));
      }
      return mappedCourses;
    }
  } catch (err) {
    console.warn('Supabase courses sync notice:', err);
  }
  return inMemoryCourses;
};
