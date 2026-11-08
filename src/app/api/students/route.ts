import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: dbStudents } = await supabase.from('registered_students').select('*');
    const { data: dbEnrollments } = await supabase.from('course_enrollments').select('*');

    const formattedStudents = (dbStudents || []).map((s: any) => ({
      id: s.id,
      email: s.email,
      name: s.name,
      phone: s.phone,
      academicCode: s.academic_code,
      academicTrack: s.academic_track,
      avatar: s.avatar,
      role: s.role || 'STUDENT',
      registeredAt: s.registered_at ? s.registered_at.split('T')[0] : '2026-11-01',
    }));

    const formattedEnrollments = (dbEnrollments || []).map((e: any) => ({
      id: e.id,
      studentId: e.student_id,
      studentEmail: e.student_email,
      studentName: e.student_name,
      studentPhone: e.student_phone,
      studentCode: e.student_code,
      studentTrack: e.student_track,
      studentAvatar: e.student_avatar,
      courseId: e.course_id,
      courseTitle: e.course_title,
      courseCode: e.course_code,
      status: e.status,
      requestedAt: e.requested_at,
      approvedAt: e.approved_at,
      progressPercent: e.progress_percent,
      completedLessonsCount: e.completed_lessons_count,
      totalLessonsCount: e.total_lessons_count,
      averageQuizGrade: e.average_quiz_grade,
      lastActiveDate: e.last_active_date,
      lastLessonTitle: e.last_lesson_title,
    }));

    return NextResponse.json({
      students: formattedStudents,
      enrollments: formattedEnrollments,
    });
  } catch (err: any) {
    return NextResponse.json({ students: [], enrollments: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { student, enrollment, enrollments, students } = body;

    if (student && student.email) {
      await supabase.from('registered_students').upsert({
        id: student.id,
        email: student.email.toLowerCase(),
        name: student.name,
        phone: student.phone,
        academic_code: student.academicCode,
        academic_track: student.academicTrack,
        avatar: student.avatar || '',
        role: student.role || 'STUDENT',
      }, { onConflict: 'email' });
    }

    if (Array.isArray(students) && students.length > 0) {
      await supabase.from('registered_students').upsert(
        students.map((st: any) => ({
          id: st.id,
          email: st.email.toLowerCase(),
          name: st.name,
          phone: st.phone,
          academic_code: st.academicCode,
          academic_track: st.academicTrack,
          avatar: st.avatar || '',
          role: st.role || 'STUDENT',
        })),
        { onConflict: 'email' }
      );
    }

    if (enrollment && enrollment.id) {
      await supabase.from('course_enrollments').upsert({
        id: enrollment.id,
        student_id: enrollment.studentId,
        student_email: enrollment.studentEmail.toLowerCase(),
        student_name: enrollment.studentName,
        student_phone: enrollment.studentPhone,
        student_code: enrollment.studentCode,
        student_track: enrollment.studentTrack,
        student_avatar: enrollment.studentAvatar || '',
        course_id: enrollment.courseId,
        course_title: enrollment.courseTitle,
        course_code: enrollment.courseCode,
        status: enrollment.status,
        requested_at: enrollment.requestedAt,
        approved_at: enrollment.approvedAt || null,
        progress_percent: enrollment.progressPercent,
        completed_lessons_count: enrollment.completedLessonsCount,
        total_lessons_count: enrollment.totalLessonsCount,
        average_quiz_grade: enrollment.averageQuizGrade,
        last_active_date: enrollment.lastActiveDate,
        last_lesson_title: enrollment.lastLessonTitle || null,
      }, { onConflict: 'id' });
    }

    if (Array.isArray(enrollments) && enrollments.length > 0) {
      await supabase.from('course_enrollments').upsert(
        enrollments.map((e: any) => ({
          id: e.id,
          student_id: e.studentId,
          student_email: e.studentEmail.toLowerCase(),
          student_name: e.studentName,
          student_phone: e.studentPhone,
          student_code: e.studentCode,
          student_track: e.studentTrack,
          student_avatar: e.studentAvatar || '',
          course_id: e.courseId,
          course_title: e.courseTitle,
          course_code: e.courseCode,
          status: e.status,
          requested_at: e.requestedAt,
          approved_at: e.approvedAt || null,
          progress_percent: e.progressPercent,
          completed_lessons_count: e.completedLessonsCount,
          total_lessons_count: e.totalLessonsCount,
          average_quiz_grade: e.averageQuizGrade,
          last_active_date: e.lastActiveDate,
          last_lesson_title: e.lastLessonTitle || null,
        })),
        { onConflict: 'id' }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
