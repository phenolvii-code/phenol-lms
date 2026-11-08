import { NextResponse } from 'next/server';
import { ChemistryCourse } from '@/types/lms';

// In-memory server store for dynamic courses
let globalCourses: ChemistryCourse[] = [];
let deletedCourseIds: string[] = [
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

export async function GET() {
  const cleanCourses = globalCourses.filter((c) => !deletedCourseIds.includes(c.id));
  return NextResponse.json({
    courses: cleanCourses,
    deletedIds: deletedCourseIds,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courses, deletedId } = body;

    if (deletedId && typeof deletedId === 'string') {
      if (!deletedCourseIds.includes(deletedId)) {
        deletedCourseIds.push(deletedId);
      }
      globalCourses = globalCourses.filter((c) => c.id !== deletedId);
    }

    if (Array.isArray(courses)) {
      globalCourses = courses.filter((c) => !deletedCourseIds.includes(c.id));
    }

    return NextResponse.json({
      success: true,
      courses: globalCourses,
      deletedIds: deletedCourseIds,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
