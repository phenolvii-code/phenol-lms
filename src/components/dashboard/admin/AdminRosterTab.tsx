'use client';

import React from 'react';
import { ChemistryCourse } from '@/types/lms';
import { CourseEnrollmentRecord } from '@/lib/data/enrollments';
import { getAggregatedStudentsDirectory } from '@/lib/enrollment-storage';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import {
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface AdminRosterTabProps {
  enrollments: CourseEnrollmentRecord[];
  courses: ChemistryCourse[];
  rosterSearchQuery: string;
  setRosterSearchQuery: (val: string) => void;
  setIsManualAddStudentModalOpen: (val: boolean) => void;
  handleApproveEnrollment: (enrId: string) => void;
  setDirectEnrollStudent: (st: any) => void;
  setSelectedCourseIdToEnroll: (id: string) => void;
  setIsDirectEnrollModalOpen: (val: boolean) => void;
}

export function AdminRosterTab({
  enrollments,
  courses,
  rosterSearchQuery,
  setRosterSearchQuery,
  setIsManualAddStudentModalOpen,
  handleApproveEnrollment,
  setDirectEnrollStudent,
  setSelectedCourseIdToEnroll,
  setIsDirectEnrollModalOpen,
}: AdminRosterTabProps) {
  const pendingRequests = enrollments.filter((e) => e.status === 'PENDING');
  const studentDirectory = getAggregatedStudentsDirectory();
  const filteredStudents = studentDirectory.filter((st) => {
    if (!rosterSearchQuery.trim()) return true;
    const q = rosterSearchQuery.trim().toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.code.toLowerCase().includes(q) ||
      st.email.toLowerCase().includes(q) ||
      st.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 font-display">
            Enrolled Student Cohort Roster & Performance (2026/2027)
          </h2>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Official directory of scholars, course activation requests, and academic performance telemetry under Dr. Omar Magdi.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Forensic Code Search Input */}
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={rosterSearchQuery}
              onChange={(e) => setRosterSearchQuery(e.target.value)}
              placeholder="Search by Code (PH-XXXX), name, or phone..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-100 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500 shadow-quiet"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsManualAddStudentModalOpen(true)}
            className="px-3.5 py-2 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-quiet flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Student Manually</span>
          </button>
        </div>
      </div>

      {/* Section 1: PENDING COURSE ACTIVATION REQUESTS DESK */}
      <div className="p-5 bg-white rounded-xl border border-hairline shadow-quiet space-y-4">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-sm font-bold text-charcoal-900 font-display">
              Course Activation Requests
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            {pendingRequests.length} Pending Approval
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-4 text-center text-xs text-charcoal-100 bg-ivory-50 rounded-lg border border-hairline">
            No pending activation requests. All student course enrollments are active and up to date.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pendingRequests.map((req) => {
              const studentName = req.student_name || (req as any).studentName || 'Student';
              const studentPhone = req.student_phone || (req as any).studentPhone || '';
              const studentCode = req.student_code || (req as any).studentCode || 'PH-SCHOLAR';
              const studentTrack = req.student_track || (req as any).studentTrack || 'General';
              const courseTitle = req.course_title || (req as any).courseTitle || 'Course';
              const courseCode = req.course_code || (req as any).courseCode || '';
              const requestedAt = req.requested_at || (req as any).requestedAt || '';

              const cleanPhone = studentPhone.replace(/[^0-9]/g, '');
              const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                `Hello ${studentName}, regarding your activation request for (${courseTitle}) at PHENOL Academy:`
              )}`;

              return (
                <div
                  key={req.id}
                  className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-charcoal-900 font-sans">
                          {studentName}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-burgundy-50 text-burgundy-900 border border-burgundy-200">
                          {studentCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-charcoal-100 font-mono mt-0.5">
                        {studentPhone} • {studentTrack}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-charcoal-50">
                      {requestedAt ? requestedAt.slice(0, 10) : ''}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-white border border-hairline text-xs font-sans">
                    {courseCode && (
                      <span className="text-[10px] font-mono text-burgundy-900 font-bold block">
                        Target Course: {courseCode}
                      </span>
                    )}
                    <span className="font-semibold text-charcoal-900 text-xs truncate block">
                      {courseTitle}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span>WhatsApp Chat</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleApproveEnrollment(req.id)}
                      className="px-4 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Activate Access Now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Forensic Watermark Identification Guide */}
      <div className="p-3.5 bg-ivory-300/60 border border-hairline rounded text-xs space-y-1">
        <span className="font-semibold text-charcoal-900 flex items-center gap-1.5 font-formula">
          <ShieldCheck className="w-3.5 h-3.5 text-burgundy-500" />
          <span>Forensic Leak Detection Guide:</span>
        </span>
        <p className="text-[11px] text-charcoal-100 leading-relaxed font-sans">
          Every enrolled student has a unique Academic Security Code blended into their video stream (e.g.{' '}
          <code className="text-burgundy-500 font-bold">PH-4821-Y</code>). If an unauthorized video is leaked on social media or Telegram, search the code appearing in the video above to immediately pinpoint the student identity and phone number.
        </p>
      </div>

      {/* Section 2: COMPREHENSIVE STUDENT PERFORMANCE DIRECTORY */}
      {filteredStudents.length > 0 ? (
        <div className="border border-hairline rounded bg-ivory-100 overflow-hidden shadow-quiet">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-ivory-200/80 text-[11px] font-formula uppercase tracking-wider text-charcoal-50">
                  <th className="py-3 px-4">Forensic Code</th>
                  <th className="py-3 px-4">Scholar Name</th>
                  <th className="py-3 px-4">WhatsApp Contact</th>
                  <th className="py-3 px-4">Track</th>
                  <th className="py-3 px-4">Active Courses</th>
                  <th className="py-3 px-4">Syllabus Progress</th>
                  <th className="py-3 px-4">Quiz Avg</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-xs font-sans">
                {filteredStudents.map((st) => {
                  const cleanPhone = st.phone.replace(/[^0-9]/g, '');
                  const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hello ${st.name}, regarding your academic performance and coursework with Dr. Omar Magdi at PHENOL Academy:`
                  )}`;

                  return (
                    <tr key={st.email} className="hover:bg-ivory-300/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-burgundy-600">
                        <span className="bg-burgundy-50 border border-burgundy-200 px-2 py-0.5 rounded">
                          {st.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-charcoal-900">
                        <div className="flex items-center gap-2">
                          <span>{st.name}</span>
                        </div>
                        <span className="text-[11px] text-charcoal-50 font-mono block font-normal">
                          {st.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-charcoal-100 font-mono text-[11px]">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-semibold"
                          title="Open WhatsApp Chat"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                          <span>{st.phone}</span>
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-formula font-bold text-burgundy-500">
                          {st.track}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {st.activeCoursesCount > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-semibold text-xs border border-emerald-200">
                            {st.activeCoursesCount} Active Courses
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-mono text-[11px] border border-amber-200">
                            Awaiting Course Activation
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-28 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span>{st.overallProgressPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-ivory-300 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-burgundy-900 rounded-full"
                              style={{ width: `${st.overallProgressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 text-xs">
                        {st.averageQuizGrade > 0 ? `${st.averageQuizGrade} / 20` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDirectEnrollStudent(st);
                              setSelectedCourseIdToEnroll(courses[0]?.id || '');
                              setIsDirectEnrollModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                            title="Activate course access for this student"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Activate Course</span>
                          </button>

                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] hover:bg-emerald-100 font-semibold transition-colors"
                            title="Chat via WhatsApp"
                          >
                            <WhatsAppIcon className="w-3 h-3" />
                            <span>Message</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-hairline rounded bg-ivory-100 p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-charcoal-50 mx-auto" />
          <h3 className="text-base font-bold text-charcoal-900 font-display">
            {rosterSearchQuery ? 'No Scholars Match this Code or Query' : 'No Enrolled Students Yet'}
          </h3>
          <p className="text-xs text-charcoal-100 font-sans max-w-md mx-auto">
            {rosterSearchQuery
              ? 'Try searching with partial numbers or student name.'
              : 'Students requesting courses or enrolled in cohorts will automatically appear in this telemetry directory.'}
          </p>
        </div>
      )}
    </div>
  );
}
