'use client';

import React, { useState, useMemo } from 'react';
import { ChemistryCourse } from '@/types/lms';
import { CourseEnrollmentRecord } from '@/lib/data/enrollments';
import { FACULTY_MEMBERS, ACADEMIC_TRACKS, normalizeTrackSlug } from '@/data/mock-data';
import { StudentOverview, getAggregatedStudentsDirectory } from '@/lib/enrollment-storage';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import { Initials } from '@/components/ui/Initials';
import { AdminResetPasswordModal } from '@/components/dashboard/modals/AdminResetPasswordModal';
import {
  ShieldCheck,
  Users,
  Layers,
  GraduationCap,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  UserCheck,
  UserX,
  Plus,
  AlertCircle,
  Check,
  X,
  UserCog,
  Trash2,
  KeyRound,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';

interface SuperAdministrationViewProps {
  courses: ChemistryCourse[];
  enrollments: CourseEnrollmentRecord[];
  onBackToInstructor: () => void;
  onOpenCourseStudents: (course: ChemistryCourse) => void;
  onDirectEnrollStudent: (student: any) => void;
  onManualAddStudent: () => void;
  onApproveCourse?: (courseId: string) => void;
  onRejectCourse?: (courseId: string) => void;
  onToggleUserRole?: (userId: string, email: string, currentRole: 'instructor' | 'student') => void;
  onDeleteCourse?: (courseId: string, title: string) => void;
  onExpelUser?: (email: string, id?: string) => void;
  onOpenCreateCourse?: (trackId?: string, instructorName?: string) => void;
}

export const SuperAdministrationView: React.FC<SuperAdministrationViewProps> = ({
  courses,
  enrollments,
  onBackToInstructor,
  onOpenCourseStudents,
  onDirectEnrollStudent,
  onManualAddStudent,
  onApproveCourse,
  onRejectCourse,
  onToggleUserRole,
  onDeleteCourse,
  onExpelUser,
  onOpenCreateCourse,
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'approvals' | 'tracks' | 'instructors'>('accounts');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'instructors' | 'students'>('all');
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [resetPasswordStudent, setResetPasswordStudent] = useState<{
    name: string;
    email: string;
    phone?: string;
    code?: string;
  } | null>(null);

  // Compute student directory (all users, enrolled or not)
  const studentDirectory = useMemo(() => {
    return getAggregatedStudentsDirectory(enrollments);
  }, [enrollments]);

  // Pending Course Proposals
  const pendingCourses = useMemo(() => {
    return courses.filter((c) => c.approvalStatus === 'PENDING');
  }, [courses]);

  // Course enrollment counts
  const courseEnrollmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    enrollments.forEach((e) => {
      if (e.status === 'ACTIVE') {
        counts[e.course_id] = (counts[e.course_id] || 0) + 1;
      }
    });
    return counts;
  }, [enrollments]);

  // Compute stats per instructor
  const instructorStats = useMemo(() => {
    return FACULTY_MEMBERS.map((faculty) => {
      const instructorCourses = courses.filter((c) => {
        if (c.instructorId === faculty.id || c.instructorEmail?.toLowerCase() === faculty.email?.toLowerCase()) {
          return true;
        }
        if (faculty.id === 'dr-omar-magdi') {
          return !c.instructorId || c.instructorEmail?.toLowerCase() === 'phenolvii@gmail.com';
        }
        return false;
      });

      const instructorCourseIds = new Set(instructorCourses.map((c) => c.id));
      const activeEnrForInstructor = enrollments.filter(
        (e) => instructorCourseIds.has(e.course_id) && e.status === 'ACTIVE'
      );
      const uniqueStudentEmails = new Set(activeEnrForInstructor.map((e) => e.student_email.toLowerCase()));

      return {
        ...faculty,
        computedCoursesCount: instructorCourses.length || faculty.coursesCount || 1,
        computedStudentsCount: uniqueStudentEmails.size,
        courseList: instructorCourses,
        enrolledStudentsEmails: Array.from(uniqueStudentEmails),
      };
    });
  }, [courses, enrollments]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return studentDirectory.filter((st) => {
      const isSuper = st.email?.toLowerCase() === 'phenolvii@gmail.com';
      const isInst =
        isSuper ||
        (st as any).role === 'instructor' ||
        (typeof window !== 'undefined' && localStorage.getItem(`phenol_user_role_${st.email?.toLowerCase()}`) === 'instructor');

      if (userFilter === 'instructors' && !isInst) return false;
      if (userFilter === 'students' && isInst) return false;

      if (!userSearchQuery) return true;
      const q = userSearchQuery.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) ||
        st.email.toLowerCase().includes(q) ||
        (st.phone && st.phone.includes(q)) ||
        (st.code && st.code.toLowerCase().includes(q)) ||
        (st.track && st.track.toLowerCase().includes(q))
      );
    });
  }, [studentDirectory, userFilter, userSearchQuery]);

  const totalRegisteredUsers = studentDirectory.length;
  const totalInstructors = studentDirectory.filter(
    (s) => s.role === 'instructor' || s.email?.toLowerCase() === 'phenolvii@gmail.com'
  ).length || 1;

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      {/* Top Cockpit Masthead */}
      <div className="p-6 sm:p-8 rounded-3xl bg-charcoal-900 text-ivory-100 shadow-editorial flex flex-col md:flex-row md:items-center justify-between gap-6 border border-hairline">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-ochre-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-ochre-400" />
              PHENOL ACADEMY MASTER COCKPIT
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ivory-100 font-display">
            Super Administration Overview
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-50 font-sans max-w-2xl leading-relaxed">
            Executive control center: manage all student & instructor accounts, approve incoming course proposals, supervise the 4 academic tracks, and manage faculty chairs.
          </p>
        </div>

        <button
          onClick={onBackToInstructor}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ivory-100 hover:bg-ivory-200 text-charcoal-900 font-sans font-bold text-xs sm:text-sm transition-all shadow-quiet self-start md:self-auto shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Instructor View</span>
        </button>
      </div>

      {/* 4 Super Admin Main Tabs */}
      <div className="border-b border-hairline flex items-center gap-6 sm:gap-8 text-sm font-semibold overflow-x-auto">
        {/* Tab 1: All Platform Accounts */}
        <button
          onClick={() => {
            setActiveTab('accounts');
            setSelectedTrackId(null);
            setSelectedInstructorId(null);
          }}
          className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'accounts'
              ? 'border-burgundy-500 text-burgundy-500 font-bold'
              : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
          }`}
        >
          <UserCog className="w-4 h-4" />
          <span>All Accounts & Governance</span>
          <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
            {totalRegisteredUsers}
          </span>
        </button>

        {/* Tab 2: Course Proposals */}
        <button
          onClick={() => {
            setActiveTab('approvals');
            setSelectedTrackId(null);
            setSelectedInstructorId(null);
          }}
          className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'approvals'
              ? 'border-amber-500 text-amber-600 font-bold'
              : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Course Proposals</span>
          <span
            className={`font-formula text-xs px-2 py-0.5 rounded-full font-bold ${
              pendingCourses.length > 0
                ? 'bg-amber-100 text-amber-800 animate-pulse'
                : 'bg-ivory-300 text-charcoal-900'
            }`}
          >
            {pendingCourses.length}
          </span>
        </button>

        {/* Tab 3: The 4 Academic Tracks */}
        <button
          onClick={() => {
            setActiveTab('tracks');
            setSelectedInstructorId(null);
          }}
          className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tracks'
              ? 'border-burgundy-500 text-burgundy-500 font-bold'
              : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>The 4 Academic Tracks</span>
          <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
            4 Tracks
          </span>
        </button>

        {/* Tab 4: Faculty & Instructors */}
        <button
          onClick={() => {
            setActiveTab('instructors');
            setSelectedTrackId(null);
          }}
          className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'instructors'
              ? 'border-burgundy-500 text-burgundy-500 font-bold'
              : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Faculty & Instructors</span>
          <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
            {FACULTY_MEMBERS.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ALL ACCOUNTS & GOVERNANCE */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900 font-display">
                All Platform Accounts (Scholars & Faculty)
              </h2>
              <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                Executive registry of all accounts. Change any password, switch account roles, or permanently expel accounts.
              </p>
            </div>

            <button
              onClick={onManualAddStudent}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-all shadow-quiet self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Register Account</span>
            </button>
          </div>

          {/* Search & Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-charcoal-50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, phone, code, track..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-ivory-100 border border-hairline rounded-lg text-charcoal-900 focus:outline-none focus:border-burgundy-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setUserFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  userFilter === 'all'
                    ? 'bg-charcoal-900 text-ivory-100'
                    : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
                }`}
              >
                All Accounts ({totalRegisteredUsers})
              </button>

              <button
                onClick={() => setUserFilter('instructors')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  userFilter === 'instructors'
                    ? 'bg-burgundy-500 text-ivory-100'
                    : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Instructors ({totalInstructors})</span>
              </button>

              <button
                onClick={() => setUserFilter('students')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  userFilter === 'students'
                    ? 'bg-burgundy-500 text-ivory-100'
                    : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Students</span>
              </button>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-ivory-100 border border-hairline rounded-2xl shadow-quiet overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal-900">
                <thead className="bg-ivory-200/80 border-b border-hairline font-formula text-[11px] text-charcoal-50 uppercase tracking-wider whitespace-nowrap">
                  <tr>
                    <th className="py-3 px-4">Account / Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">WhatsApp / Phone</th>
                    <th className="py-3 px-4">Track</th>
                    <th className="py-3 px-4">Active Courses</th>
                    <th className="py-3 px-4 text-right">Super Admin Powers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-charcoal-100 text-xs">
                        No accounts match your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((st, idx) => {
                      const isSuper = st.email?.toLowerCase() === 'phenolvii@gmail.com';
                      const isInst =
                        isSuper ||
                        (st as any).role === 'instructor' ||
                        (typeof window !== 'undefined' && localStorage.getItem(`phenol_user_role_${st.email?.toLowerCase()}`) === 'instructor');

                      const cleanPhone = (st.phone || '').replace(/[^0-9]/g, '');

                      return (
                        <tr key={idx} className="hover:bg-ivory-200/50 transition-colors">
                          {/* Name & Email */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Initials name={st.name} size="sm" />
                              <div>
                                <span className="font-bold text-charcoal-900 block font-display text-sm">
                                  {st.name}
                                </span>
                                <span className="text-[11px] text-charcoal-100 font-sans">
                                  {st.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3 px-4">
                            {isSuper ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-burgundy-900 text-ivory-100 text-[10px] font-bold font-formula">
                                <ShieldCheck className="w-3 h-3 text-ochre-400" />
                                <span>Super Admin</span>
                              </span>
                            ) : isInst ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-burgundy-50 text-burgundy-800 border border-burgundy-200 text-[10px] font-bold font-formula">
                                <ShieldCheck className="w-3 h-3 text-burgundy-600" />
                                <span>Instructor</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-ivory-200 text-charcoal-900 border border-hairline text-[10px] font-medium font-formula">
                                <GraduationCap className="w-3 h-3 text-charcoal-100" />
                                <span>Student</span>
                              </span>
                            )}
                          </td>

                          {/* WhatsApp / Phone */}
                          <td className="py-3 px-4">
                            {cleanPhone ? (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-mono text-emerald-800 hover:underline"
                              >
                                <WhatsAppIcon className="w-3 h-3 fill-emerald-800" />
                                <span>{st.phone}</span>
                              </a>
                            ) : (
                              <span className="text-charcoal-50 font-mono text-xs">—</span>
                            )}
                          </td>

                          {/* Track */}
                          <td className="py-3 px-4 font-sans text-charcoal-100 text-xs">
                            {st.track || 'Secondary & Baccalaureate'}
                          </td>

                          {/* Active Courses */}
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-bold text-charcoal-900">
                              {st.activeCoursesCount} Courses
                            </span>
                          </td>

                          {/* Actions: Reset Password, Role Switch, Expel */}
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {/* Reset Password */}
                            <button
                              type="button"
                              onClick={() => setResetPasswordStudent(st)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 border border-hairline text-xs font-semibold transition-colors"
                              title="Directly reset this account's password"
                            >
                              <KeyRound className="w-3 h-3 text-burgundy-600" />
                              <span>Reset Password</span>
                            </button>

                            {/* Role Switch */}
                            {!isSuper && onToggleUserRole && (
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleUserRole((st as any).id || '', st.email, isInst ? 'instructor' : 'student')
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors border ${
                                  isInst
                                    ? 'bg-ivory-100 hover:bg-ivory-200 text-charcoal-900 border-hairline'
                                    : 'bg-burgundy-50 hover:bg-burgundy-100 text-burgundy-800 border-burgundy-200'
                                }`}
                              >
                                <span>{isInst ? 'Make Student' : 'Make Instructor'}</span>
                              </button>
                            )}

                            {/* Enroll In Course */}
                            <button
                              type="button"
                              onClick={() => onDirectEnrollStudent(st)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-colors shadow-sm"
                            >
                              <span>Enroll</span>
                            </button>

                            {/* Expel / Delete Account */}
                            {!isSuper && onExpelUser && (
                              <button
                                type="button"
                                onClick={() => onExpelUser(st.email, st.id)}
                                className="p-1.5 rounded-lg bg-ivory-200 hover:bg-red-50 text-charcoal-100 hover:text-red-700 border border-hairline transition-colors"
                                title="Expel user from platform and wipe enrollments"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COURSE ACTIVATION PROPOSALS */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-charcoal-900 font-display">
              Instructor Course Activation Proposals
            </h2>
            <p className="text-xs text-charcoal-100 font-sans mt-0.5">
              Review courses submitted by instructors. Once approved, the course is published live to students in the corresponding track.
            </p>
          </div>

          {pendingCourses.length === 0 ? (
            <div className="p-12 text-center bg-ivory-100 rounded-3xl border border-hairline text-charcoal-100 text-xs space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-charcoal-900 font-display">
                All Submitted Courses Are Live
              </h3>
              <p>No instructor course activation proposals awaiting review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-6 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-formula text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded">
                        {course.code}
                      </span>
                      <span className="font-formula text-[11px] text-charcoal-100 px-2 py-0.5 rounded bg-ivory-200 border border-hairline">
                        {course.categoryName}
                      </span>
                      <span className="text-xs text-charcoal-50 font-mono">
                        Submitted: {course.submittedAt || 'Recent'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-charcoal-900 font-display">
                      {course.title}
                    </h3>
                    <p className="text-xs text-charcoal-100 font-sans leading-relaxed">
                      {course.description}
                    </p>

                    <div className="pt-1 text-xs text-charcoal-100 font-sans">
                      Proposing Instructor: <strong className="text-charcoal-900">{course.instructorName || course.instructorEmail || 'Instructor'}</strong> ({course.instructorEmail})
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => onApproveCourse && onApproveCourse(course.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-ivory-100 text-xs font-bold shadow-md transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Publish Live</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRejectCourse && onRejectCourse(course.id)}
                      className="px-4 py-2.5 rounded-xl bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 border border-hairline text-xs font-semibold transition-colors"
                    >
                      <span>Reject Proposal</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: THE 4 ACADEMIC TRACKS */}
      {activeTab === 'tracks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900 font-display">
                The 4 Academic Tracks Super-Structure
              </h2>
              <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                Open any track to manage its courses, delete courses, view enrolled students, or add new courses assigned to any instructor.
              </p>
            </div>

            {selectedTrackId && (
              <button
                type="button"
                onClick={() => setSelectedTrackId(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-ivory-100 border border-hairline text-xs font-semibold hover:bg-ivory-200 transition-colors self-start sm:self-auto"
              >
                <span>← View All 4 Tracks</span>
              </button>
            )}
          </div>

          {/* 4 Tracks Overview Cards */}
          {!selectedTrackId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {ACADEMIC_TRACKS.map((t) => {
                const trackCourses = courses.filter((c) => normalizeTrackSlug(c.category) === t.id);
                return (
                  <div
                    key={t.id}
                    className="p-6 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-hairline pb-3">
                        <span className="font-formula text-xs font-bold text-burgundy-500 uppercase tracking-widest">
                          {t.romanNumeral}
                        </span>
                        <span className="font-formula text-[10px] text-ochre-600 bg-ivory-200 px-2 py-0.5 rounded border border-hairline font-semibold">
                          {t.badge}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-charcoal-900 font-display">
                        {t.name}
                      </h3>
                      <p className="text-xs text-charcoal-100 font-sans leading-relaxed">
                        {t.description}
                      </p>

                      <div className="p-3 rounded-xl bg-ivory-200/60 border border-hairline flex items-center justify-between text-xs">
                        <span className="font-sans text-charcoal-100 font-medium">Courses in Track:</span>
                        <span className="font-formula font-bold text-charcoal-900 text-sm">
                          {trackCourses.length} Modules
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-3 border-t border-hairline">
                      <button
                        type="button"
                        onClick={() => setSelectedTrackId(t.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-all shadow-sm"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Open Track Cockpit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenCreateCourse && onOpenCreateCourse(t.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 border border-hairline text-xs font-semibold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Course</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Selected Track Detailed Courses Cockpit */
            (() => {
              const currentTrack = ACADEMIC_TRACKS.find((t) => t.id === selectedTrackId);
              const trackCourses = courses.filter((c) => normalizeTrackSlug(c.category) === selectedTrackId);

              return (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-ivory-100 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
                        {currentTrack?.romanNumeral} • {currentTrack?.badge}
                      </span>
                      <h3 className="text-xl font-bold text-charcoal-900 font-display">
                        {currentTrack?.name}
                      </h3>
                      <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                        {trackCourses.length} Courses active in this curriculum track.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenCreateCourse && onOpenCreateCourse(selectedTrackId)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold shadow-md transition-all self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Course Assigned to Instructor</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trackCourses.length === 0 ? (
                      <div className="col-span-2 p-12 text-center bg-ivory-100 rounded-2xl border border-hairline text-charcoal-100 text-xs">
                        No courses created in this track yet. Click &quot;Add Course&quot; to author one.
                      </div>
                    ) : (
                      trackCourses.map((course) => {
                        const studentCount = courseEnrollmentCounts[course.id] || 0;
                        return (
                          <div
                            key={course.id}
                            className="p-5 sm:p-6 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet flex flex-col justify-between space-y-4"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                                <span className="font-formula text-xs font-bold text-burgundy-500">
                                  {course.code}
                                </span>
                                <span className="text-[11px] font-sans text-charcoal-100 font-medium">
                                  Director: <strong className="text-charcoal-900">{course.instructorName || 'Dr. Omar Magdi'}</strong>
                                </span>
                              </div>

                              <h4 className="text-base font-bold text-charcoal-900 font-display">
                                {course.title}
                              </h4>
                              <p className="text-xs text-charcoal-100 font-sans line-clamp-2">
                                {course.description}
                              </p>

                              <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <div className="p-2.5 rounded-xl bg-ivory-200/70 border border-hairline">
                                  <span className="text-[10px] font-formula text-charcoal-50 uppercase block">
                                    Enrolled Students
                                  </span>
                                  <span className="text-lg font-extrabold font-formula text-burgundy-500 block">
                                    {studentCount} Scholars
                                  </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-ivory-200/70 border border-hairline">
                                  <span className="text-[10px] font-formula text-charcoal-50 uppercase block">
                                    Syllabus Modules
                                  </span>
                                  <span className="text-lg font-extrabold font-formula text-charcoal-900 block">
                                    {course.lessons?.length || 0} Lessons
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-hairline flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => onOpenCourseStudents(course)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-colors shadow-quiet"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>View Students ({studentCount})</span>
                              </button>

                              {onDeleteCourse && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteCourse(course.id, course.title)}
                                  className="p-1.5 rounded-lg bg-ivory-200 hover:bg-red-50 text-charcoal-100 hover:text-red-700 border border-hairline transition-colors"
                                  title="Delete Course from Track"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* TAB 4: FACULTY & INSTRUCTORS */}
      {activeTab === 'instructors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900 font-display">
                Faculty Chairs & Instructors Portfolio
              </h2>
              <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                Click any instructor to view their courses, delete courses, author new courses under their name, and see their enrolled students.
              </p>
            </div>

            {selectedInstructorId && (
              <button
                type="button"
                onClick={() => setSelectedInstructorId(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-ivory-100 border border-hairline text-xs font-semibold hover:bg-ivory-200 transition-colors self-start sm:self-auto"
              >
                <span>← View All Faculty</span>
              </button>
            )}
          </div>

          {!selectedInstructorId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {instructorStats.map((inst, idx) => (
                <div
                  key={inst.id || idx}
                  className="p-6 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial transition-all space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-hairline shrink-0 shadow-quiet bg-ivory-200">
                        <img
                          src={inst.avatar}
                          alt={inst.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-charcoal-900 font-display">
                            {inst.name}
                          </h3>
                          {idx === 0 && (
                            <span className="font-formula text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-burgundy-50 text-burgundy-800 border border-burgundy-200">
                              Founder & Chair
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-100 font-sans">{inst.title}</p>
                        <span className="font-formula text-[11px] text-ochre-600 block">
                          {inst.supervisionScope}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-ivory-200/80 border border-hairline">
                        <span className="text-[10px] font-formula text-charcoal-50 uppercase block">
                          Directed Courses
                        </span>
                        <span className="text-xl font-extrabold font-formula text-charcoal-900 block mt-0.5">
                          {inst.computedCoursesCount}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-ivory-200/80 border border-hairline">
                        <span className="text-[10px] font-formula text-charcoal-50 uppercase block">
                          Enrolled Scholars
                        </span>
                        <span className="text-xl font-extrabold font-formula text-burgundy-500 block mt-0.5">
                          {inst.computedStudentsCount}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-charcoal-100 font-sans leading-relaxed line-clamp-2">
                      {inst.bio}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-hairline flex items-center justify-between">
                    <span className="text-xs font-mono text-charcoal-50">
                      {inst.email}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedInstructorId(inst.id || 'dr-omar-magdi')}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-all shadow-sm"
                    >
                      <span>Manage Portfolio</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Selected Instructor Dossier & Courses Cockpit */
            (() => {
              const inst = instructorStats.find((i) => i.id === selectedInstructorId) || instructorStats[0];

              return (
                <div className="space-y-6">
                  {/* Instructor Bio Banner */}
                  <div className="p-6 rounded-2xl bg-ivory-100 border border-hairline flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-hairline shadow-quiet bg-ivory-200 shrink-0">
                        <img src={inst.avatar} alt={inst.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-charcoal-900 font-display">{inst.name}</h3>
                        <p className="text-xs text-charcoal-100 font-sans">{inst.title}</p>
                        <p className="text-[11px] text-charcoal-50 font-sans">{inst.bio}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenCreateCourse && onOpenCreateCourse(undefined, inst.name)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold shadow-md transition-all self-start md:self-auto shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Create Course for {inst.name.split(' ')[0]}</span>
                    </button>
                  </div>

                  {/* Instructor Directed Courses */}
                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-charcoal-900 font-display">
                      Courses Directed by {inst.name} ({inst.courseList.length})
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {inst.courseList.map((course) => {
                        const studentCount = courseEnrollmentCounts[course.id] || 0;
                        return (
                          <div
                            key={course.id}
                            className="p-5 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-formula text-xs font-bold text-burgundy-500">
                                  {course.code}
                                </span>
                                <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-ivory-200 border border-hairline text-charcoal-100">
                                  {course.categoryName}
                                </span>
                              </div>
                              <h5 className="font-bold text-sm text-charcoal-900 font-display">
                                {course.title}
                              </h5>
                              <p className="text-xs text-charcoal-100 font-sans line-clamp-1">
                                {course.description}
                              </p>
                              <div className="text-xs font-mono font-bold text-charcoal-900 pt-1">
                                {studentCount} Enrolled Scholars
                              </div>
                            </div>

                            <div className="pt-2 border-t border-hairline flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => onOpenCourseStudents(course)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-colors"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Students ({studentCount})</span>
                              </button>

                              {onDeleteCourse && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteCourse(course.id, course.title)}
                                  className="p-1.5 rounded-lg bg-ivory-200 hover:bg-red-50 text-charcoal-100 hover:text-red-700 border border-hairline transition-colors"
                                  title="Delete Course"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Password Reset Modal */}
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
};
