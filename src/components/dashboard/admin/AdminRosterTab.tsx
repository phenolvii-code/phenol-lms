'use client';

import React, { useState, useEffect } from 'react';
import { ChemistryCourse } from '@/types/lms';
import { CourseEnrollmentRecord } from '@/lib/data/enrollments';
import {
  getAggregatedStudentsDirectory,
  syncWithServerStudents,
  StudentOverview,
} from '@/lib/enrollment-storage';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import {
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Users,
  KeyRound,
  UserCheck,
  Clock,
  X,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { AdminResetPasswordModal } from '@/components/dashboard/modals/AdminResetPasswordModal';

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
  handleRevokeEnrollment?: (enrId: string) => void;
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
  handleRevokeEnrollment,
}: AdminRosterTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'requests'>('roster');
  const pendingRequests = enrollments.filter((e) => e.status === 'PENDING');
  const [studentDirectory, setStudentDirectory] = useState<StudentOverview[]>(() =>
    getAggregatedStudentsDirectory(enrollments)
  );
  const [resetPasswordStudent, setResetPasswordStudent] = useState<StudentOverview | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      try {
        await syncWithServerStudents();
        if (isMounted) {
          setStudentDirectory(getAggregatedStudentsDirectory(enrollments));
        }
      } catch (err) {
        console.error('Error fetching students in AdminRosterTab:', err);
      }
    };

    fetchStudents();

    const handleUpdate = () => fetchStudents();
    window.addEventListener('phenol_students_updated', handleUpdate);
    window.addEventListener('phenol_enrollments_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('phenol_students_updated', handleUpdate);
      window.removeEventListener('phenol_enrollments_updated', handleUpdate);
    };
  }, [enrollments]);

  const filteredStudents = studentDirectory.filter((st) => {
    if (!rosterSearchQuery.trim()) return true;
    const q = rosterSearchQuery.trim().toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      st.code.toLowerCase().includes(q) ||
      st.email.toLowerCase().includes(q) ||
      (st.phone && st.phone.includes(q)) ||
      (st.track && st.track.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 font-display">
            Student Cohort Roster & Course Access
          </h2>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Full directory of scholars with contact numbers, academic tracks, and 1-click course enrollment / revocation.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={rosterSearchQuery}
              onChange={(e) => setRosterSearchQuery(e.target.value)}
              placeholder="Search by name, phone, code, track..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-100 border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500 shadow-quiet"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsManualAddStudentModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold shadow-quiet flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {/* Roster Navigation Sub-Tabs */}
      <div className="border-b border-hairline flex items-center gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('roster')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'roster'
              ? 'border-burgundy-500 text-burgundy-500 font-bold'
              : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Students Roster</span>
          <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
            {studentDirectory.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('requests')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'requests'
              ? 'border-amber-500 text-amber-700 font-bold'
              : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Course Access Requests</span>
          <span
            className={`font-formula text-xs px-2 py-0.5 rounded-full font-bold ${
              pendingRequests.length > 0
                ? 'bg-amber-100 text-amber-800 animate-pulse'
                : 'bg-ivory-300 text-charcoal-900'
            }`}
          >
            {pendingRequests.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: ALL STUDENTS ROSTER */}
      {activeSubTab === 'roster' && (
        <div className="space-y-4">
          {filteredStudents.length > 0 ? (
            <div className="border border-hairline rounded-2xl bg-ivory-100 overflow-hidden shadow-quiet">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-hairline bg-ivory-200/80 text-[11px] font-formula uppercase tracking-wider text-charcoal-50 whitespace-nowrap">
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4 min-w-[180px]">Scholar Name</th>
                      <th className="py-3.5 px-4">WhatsApp / Phone</th>
                      <th className="py-3.5 px-4">Academic Track</th>
                      <th className="py-3.5 px-4">Enrolled Courses</th>
                      <th className="py-3.5 px-4 text-right">Access Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {filteredStudents.map((st) => {
                      const cleanPhone = (st.phone || '').replace(/[^0-9]/g, '');
                      const waLink = cleanPhone
                        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                            `Hello ${st.name}, regarding your coursework at Phenol Academy:`
                          )}`
                        : null;

                      // Active enrollments for this student
                      const activeEnr = st.enrollments?.filter((e: any) => e.status === 'ACTIVE') || [];

                      return (
                        <tr key={st.email} className="hover:bg-ivory-200/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-burgundy-600 whitespace-nowrap">
                            <span className="bg-burgundy-50 border border-burgundy-200 px-2 py-0.5 rounded">
                              {st.code}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-charcoal-900">
                            <div>
                              <span className="font-display text-sm">{st.name}</span>
                              <span className="text-[11px] text-charcoal-50 font-mono block font-normal">
                                {st.email}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-charcoal-100 font-mono text-xs whitespace-nowrap">
                            {waLink ? (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold hover:underline"
                                title="Open WhatsApp Chat"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-800" />
                                <span>{st.phone}</span>
                              </a>
                            ) : (
                              <span className="text-charcoal-50 font-mono">{st.phone || '—'}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-formula font-semibold text-charcoal-900 bg-ivory-200 px-2 py-0.5 rounded border border-hairline text-[11px]">
                              {st.track}
                            </span>
                          </td>

                          {/* Enrolled Courses list with 1-click unenroll */}
                          <td className="py-3.5 px-4">
                            {activeEnr.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {activeEnr.map((enr: any) => (
                                  <div
                                    key={enr.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-mono"
                                  >
                                    <span>{enr.course_code || enr.course_title || 'Course'}</span>
                                    {handleRevokeEnrollment && (
                                      <button
                                        type="button"
                                        onClick={() => handleRevokeEnrollment(enr.id)}
                                        className="text-emerald-700 hover:text-red-700 p-0.5 hover:bg-emerald-100 rounded transition-colors"
                                        title="Revoke access to this course"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-charcoal-50 text-[11px] font-mono italic">
                                No active course
                              </span>
                            )}
                          </td>

                          {/* Actions: 1-Click Enroll / Revoke */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setDirectEnrollStudent(st);
                                  setSelectedCourseIdToEnroll(courses[0]?.id || '');
                                  setIsDirectEnrollModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                                title="Enroll student in course"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Enroll in Course</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setResetPasswordStudent(st)}
                                className="p-1.5 rounded-lg border border-hairline bg-ivory-200 text-charcoal-900 hover:bg-ivory-300 text-xs transition-colors"
                                title="Reset Student Password"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-burgundy-600" />
                              </button>
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
            <div className="border border-dashed border-hairline rounded-2xl bg-ivory-100 p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-charcoal-50 mx-auto" />
              <h3 className="text-base font-bold text-charcoal-900 font-display">
                No students match your search
              </h3>
              <p className="text-xs text-charcoal-100 font-sans max-w-sm mx-auto">
                Try searching with a different name, phone number, or academic code.
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: COURSE ACCESS REQUESTS DESK */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center text-xs text-charcoal-100 bg-ivory-100 rounded-2xl border border-hairline space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-charcoal-900 font-display">
                No Pending Access Requests
              </h3>
              <p>All student course enrollments are reviewed and active.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req) => {
                const studentName = req.student_name || (req as any).studentName || 'Student';
                const studentPhone = req.student_phone || (req as any).studentPhone || '';
                const studentCode = req.student_code || (req as any).studentCode || 'PH-SCHOLAR';
                const studentTrack = req.student_track || (req as any).studentTrack || 'General';
                const courseTitle = req.course_title || (req as any).courseTitle || 'Course';
                const courseCode = req.course_code || (req as any).courseCode || '';
                const requestedAt = req.requested_at || (req as any).requestedAt || '';

                const cleanPhone = studentPhone.replace(/[^0-9]/g, '');
                const waLink = cleanPhone
                  ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Hello ${studentName}, regarding your access request for (${courseTitle}) at Phenol Academy:`
                    )}`
                  : null;

                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3.5 shadow-quiet flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-charcoal-900 font-display">
                              {studentName}
                            </h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-burgundy-50 text-burgundy-900 border border-burgundy-200 font-bold">
                              {studentCode}
                            </span>
                          </div>
                          <p className="text-xs text-charcoal-100 font-mono mt-0.5">
                            {studentPhone || 'No Phone'} • {studentTrack}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-charcoal-50">
                          {requestedAt ? requestedAt.slice(0, 10) : ''}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-hairline text-xs">
                        {courseCode && (
                          <span className="text-[10px] font-mono text-burgundy-900 font-bold block">
                            Requested Course: {courseCode}
                          </span>
                        )}
                        <span className="font-semibold text-charcoal-900 text-sm block">
                          {courseTitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                      {waLink ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 border border-hairline text-xs font-semibold transition-colors"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-700" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <div />
                      )}

                      <button
                        type="button"
                        onClick={() => handleApproveEnrollment(req.id)}
                        className="px-4 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
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
      )}

      {/* Reset Password Modal */}
      {resetPasswordStudent && (
        <AdminResetPasswordModal
          isOpen={true}
          studentEmail={resetPasswordStudent.email}
          studentName={resetPasswordStudent.name}
          studentCode={resetPasswordStudent.code}
          onClose={() => setResetPasswordStudent(null)}
          onSuccess={() => setResetPasswordStudent(null)}
        />
      )}
    </div>
  );
}
