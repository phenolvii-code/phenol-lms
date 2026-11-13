'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChemistryCourse } from '@/types/lms';
import { CourseEnrollmentRecord } from '@/lib/data/enrollments';
import { AuthUser } from '@/types/auth';
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
  UserCheck,
  Clock,
  X,
  AlertCircle,
  GraduationCap,
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
  handleRevokeEnrollment?: (enrId: string) => void;
  currentUser?: AuthUser | null;
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
  currentUser,
}: AdminRosterTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'requests'>('roster');
  const [studentDirectory, setStudentDirectory] = useState<StudentOverview[]>(() =>
    getAggregatedStudentsDirectory(enrollments)
  );

  const isSuperAdmin =
    currentUser?.isSuperAdmin || currentUser?.email?.toLowerCase() === 'phenolvii@gmail.com';

  // Compute courses that belong to THIS instructor
  const myCourses = useMemo(() => {
    return courses.filter((c) => {
      if (isSuperAdmin) {
        // In Dr. Omar's instructor cockpit, show courses taught by Dr. Omar (or default courses)
        if (
          !c.instructorEmail ||
          c.instructorEmail.toLowerCase() === 'phenolvii@gmail.com' ||
          c.instructorName?.includes('Omar') ||
          !c.instructorName
        ) {
          return true;
        }
        return false;
      }
      if (c.instructorId && currentUser?.id && c.instructorId === currentUser.id) return true;
      if (
        c.instructorEmail &&
        currentUser?.email &&
        c.instructorEmail.toLowerCase() === currentUser.email.toLowerCase()
      )
        return true;
      if (
        c.instructorName &&
        currentUser?.name &&
        c.instructorName.toLowerCase() === currentUser.name.toLowerCase()
      )
        return true;
      return false;
    });
  }, [courses, currentUser, isSuperAdmin]);

  const myCourseIds = useMemo(() => new Set(myCourses.map((c) => c.id)), [myCourses]);

  // Pending requests strictly for THIS instructor's courses
  const pendingRequests = useMemo(() => {
    return enrollments.filter(
      (e) => e.status === 'PENDING' && myCourseIds.has(e.course_id)
    );
  }, [enrollments, myCourseIds]);

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

  // Filter student directory: ONLY show students enrolled in at least one course taught by THIS instructor
  const myStudents = useMemo(() => {
    const studentEmailsWithMyCourses = new Set(
      enrollments
        .filter((e) => myCourseIds.has(e.course_id) && (e.status === 'ACTIVE' || e.status === 'PENDING'))
        .map((e) => e.student_email.toLowerCase())
    );

    return studentDirectory.filter((st) => studentEmailsWithMyCourses.has(st.email.toLowerCase()));
  }, [studentDirectory, enrollments, myCourseIds]);

  const filteredStudents = myStudents.filter((st) => {
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
            Course Scholars Roster & Access Controls
          </h2>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Directory of scholars enrolled in your courses. Manage course access and student contact details.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Sub-tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-ivory-100 border border-hairline">
            <button
              type="button"
              onClick={() => setActiveSubTab('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'roster'
                  ? 'bg-burgundy-500 text-ivory-100 shadow-sm'
                  : 'text-charcoal-100 hover:text-charcoal-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Enrolled Scholars ({myStudents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('requests')}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'requests'
                  ? 'bg-burgundy-500 text-ivory-100 shadow-sm'
                  : 'text-charcoal-100 hover:text-charcoal-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Access Requests</span>
              {pendingRequests.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: ENROLLED SCHOLARS ROSTER */}
      {activeSubTab === 'roster' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-charcoal-50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scholars by name, code, phone, or track..."
                value={rosterSearchQuery}
                onChange={(e) => setRosterSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-ivory-100 border border-hairline rounded-xl text-charcoal-900 placeholder:text-charcoal-50 focus:outline-none focus:border-burgundy-500 transition-colors"
              />
            </div>

            <div className="text-xs text-charcoal-100 font-mono">
              Showing {filteredStudents.length} of {myStudents.length} enrolled scholars
            </div>
          </div>

          {/* Scholars Table */}
          {filteredStudents.length > 0 ? (
            <div className="border border-hairline rounded-2xl bg-ivory-100 overflow-hidden shadow-quiet">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-hairline bg-ivory-200/60 font-formula text-[10px] text-charcoal-50 uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Academic Code</th>
                      <th className="py-3 px-4 font-bold">Scholar Name & Email</th>
                      <th className="py-3 px-4 font-bold">Phone / WhatsApp</th>
                      <th className="py-3 px-4 font-bold">Track</th>
                      <th className="py-3 px-4 font-bold">Your Enrolled Courses</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {filteredStudents.map((st) => {
                      const cleanPhone = st.phone ? st.phone.replace(/[^0-9]/g, '') : '';
                      const waLink = cleanPhone
                        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                            `Hello ${st.name}, regarding your curriculum at Phenol Academy:`
                          )}`
                        : null;

                      // Active courses taught by THIS instructor ONLY
                      const myActiveEnr = enrollments.filter(
                        (e) =>
                          e.student_email.toLowerCase() === st.email.toLowerCase() &&
                          e.status === 'ACTIVE' &&
                          myCourseIds.has(e.course_id)
                      );

                      return (
                        <tr
                          key={st.email}
                          className="hover:bg-ivory-200/40 transition-colors group"
                        >
                          {/* Academic Code */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono text-[11px] font-bold text-burgundy-900 bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                              {st.code}
                            </span>
                          </td>

                          {/* Scholar Name */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-charcoal-900 text-xs sm:text-sm font-display">
                                {st.name}
                              </span>
                              <span className="font-mono text-[11px] text-charcoal-100">
                                {st.email}
                              </span>
                            </div>
                          </td>

                          {/* Phone / WhatsApp */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
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

                          {/* Track */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-formula font-semibold text-charcoal-900 bg-ivory-200 px-2 py-0.5 rounded border border-hairline text-[11px]">
                              {st.track}
                            </span>
                          </td>

                          {/* Enrolled Courses taught by this instructor with 1-click revoke */}
                          <td className="py-3.5 px-4">
                            {myActiveEnr.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                {myActiveEnr.map((enr: any) => (
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

                          {/* Actions: 1-Click Enroll in this instructor's courses */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setDirectEnrollStudent(st);
                                  setSelectedCourseIdToEnroll(myCourses[0]?.id || '');
                                  setIsDirectEnrollModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                                title="Enroll student in one of your courses"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Enroll in Course</span>
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
                {myStudents.length === 0
                  ? 'No Students Enrolled in Your Courses Yet'
                  : 'No scholars match your search query'}
              </h3>
              <p className="text-xs text-charcoal-100 font-sans max-w-sm mx-auto">
                {myStudents.length === 0
                  ? 'When students enroll in or request access to your courses, they will appear here.'
                  : 'Try searching with a different name, phone number, or academic code.'}
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
              <p>All student course enrollments for your courses are reviewed and active.</p>
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
    </div>
  );
}
