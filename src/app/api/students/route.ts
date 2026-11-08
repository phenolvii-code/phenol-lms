import { NextResponse } from 'next/server';

interface ServerStudent {
  id: string;
  email: string;
  name: string;
  phone: string;
  academicCode: string;
  academicTrack: string;
  avatar?: string;
  role: 'STUDENT';
  registeredAt: string;
}

// Global server memory to sync across clients
const globalStudents: ServerStudent[] = [];
const globalEnrollments: any[] = [];

export async function GET() {
  return NextResponse.json({
    students: globalStudents,
    enrollments: globalEnrollments,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { student, enrollment, enrollments, students } = body;

    if (student && student.email) {
      const cleanEmail = student.email.trim().toLowerCase();
      const existingIdx = globalStudents.findIndex((s) => s.email.toLowerCase() === cleanEmail);
      if (existingIdx >= 0) {
        globalStudents[existingIdx] = { ...globalStudents[existingIdx], ...student };
      } else {
        globalStudents.unshift(student);
      }
    }

    if (Array.isArray(students)) {
      for (const st of students) {
        if (!st.email) continue;
        const cleanEmail = st.email.trim().toLowerCase();
        const idx = globalStudents.findIndex((s) => s.email.toLowerCase() === cleanEmail);
        if (idx >= 0) {
          globalStudents[idx] = { ...globalStudents[idx], ...st };
        } else {
          globalStudents.unshift(st);
        }
      }
    }

    if (enrollment && enrollment.id) {
      const idx = globalEnrollments.findIndex((e) => e.id === enrollment.id);
      if (idx >= 0) {
        globalEnrollments[idx] = { ...globalEnrollments[idx], ...enrollment };
      } else {
        globalEnrollments.unshift(enrollment);
      }
    }

    if (Array.isArray(enrollments)) {
      for (const enr of enrollments) {
        if (!enr.id) continue;
        const idx = globalEnrollments.findIndex((e) => e.id === enr.id);
        if (idx >= 0) {
          globalEnrollments[idx] = { ...globalEnrollments[idx], ...enr };
        } else {
          globalEnrollments.unshift(enr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      students: globalStudents,
      enrollments: globalEnrollments,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
