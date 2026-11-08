import { NextResponse } from 'next/server';
import { CHEMISTRY_COURSES } from '@/data/mock-data';
import { ChemistryCourse } from '@/types/lms';

// In-memory server store for dynamic courses
let globalCourses: ChemistryCourse[] = [];

export async function GET() {
  return NextResponse.json({
    courses: globalCourses,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courses } = body;

    if (Array.isArray(courses)) {
      globalCourses = courses;
    }

    return NextResponse.json({
      success: true,
      courses: globalCourses,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
