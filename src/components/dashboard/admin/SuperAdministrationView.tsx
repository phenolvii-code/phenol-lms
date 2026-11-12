'use client';

import React, { useState, useMemo } from 'react';
import { ChemistryCourse } from '@/types/lms';
import { CourseEnrollmentRecord } from '@/lib/data/enrollments';
import { FACULTY_MEMBERS, ACADEMIC_TRACKS, normalizeTrackSlug } from '@/data/mock-data';
import { StudentOverview, getAggregatedStudentsDirectory } from '@/lib/enrollment-storage';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import { Initials } from '@/components/ui/Initials';
import {
  ShieldCheck,
  Users,
  Layers,
  GraduationCap,
  ArrowLeft,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  UserCheck,
  UserX,
  Plus,
} from 'lucide-react';

interface SuperAdministrationViewProps {
  courses: ChemistryCourse[];
  enrollments: CourseEnrollmentRecord[];
  onBackToInstructor: () => void;
  onOpenCourseStudents: (course: ChemistryCourse) => void;
  onDirectEnrollStudent: (student: any) => void;
  onManualAddStudent: () => void;
}

export const SuperAdministrationView: React.FC<SuperAdministrationViewProps> = ({
  courses,
  enrollments,
  onBackToInstructor,
  onOpenCourseStudents,
  onDirectEnrollStudent,
  onManualAddStudent,
}) => {
  const [activeTab, setActiveTab] = useState<'instructors' | 'courses' | 'users'>('instructors');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'enrolled' | 'unregistered'>('all');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseTrackFilter, setCourseTrackFilter] = useState<string>('all');

  // Compute student directory (all users, enrolled or not)
  const studentDirectory = useMemo(() => {
    return getAggregatedStudentsDirectory(enrollments);
  }, [enrollments]);

  // Compute stats per instructor
  const instructorStats = useMemo(() => {
    return FACULTY_MEMBERS.map((faculty) => {
      // Find courses directed by this instructor (Dr. Omar directs chemistry courses)
      const instructorCourses = courses.filter((c) => {
        if (faculty.id === 'dr-omar-magdi') {
          return true; // Dr. Omar currently chairs all chemistry & foundational courses
        }
        return false;
      });

      // Calculate total unique active students across these courses
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
      };
    });
  }, [courses, enrollments]);

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

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return studentDirectory.filter((st) => {
      const isEnrolled = st.activeCoursesCount > 0;
      if (userFilter === 'enrolled' && !isEnrolled) return false;
      if (userFilter === 'unregistered' && isEnrolled) return false;

      if (!userSearchQuery) return true;
      const q = userSearchQuery.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) ||
        st.email.toLowerCase().includes(q) ||
        (st.phone && st.phone.includes(q)) ||
        (st.code && st.code.toLowerCase().includes(q))
      );
    });
  }, [studentDirectory, userFilter, userSearchQuery]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (courseTrackFilter !== 'all') {
        const norm = normalizeTrackSlug(c.category);
        if (norm !== courseTrackFilter && c.category !== courseTrackFilter) return false;
      }
      if (!courseSearchQuery) return true;
      const q = courseSearchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q)
      );
    });
  }, [courses, courseTrackFilter, courseSearchQuery]);

  const totalRegisteredUsers = studentDirectory.length;
  const totalEnrolledScholars = studentDirectory.filter((s) => s.activeCoursesCount > 0).length;
  const totalNonEnrolledGuests = totalRegisteredUsers - totalEnrolledScholars;

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      {/* Top Cockpit Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-charcoal-900 text-ivory-100 shadow-editorial flex flex-col md:flex-row md:items-center justify-between gap-6 border border-hairline">
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
            Platform-wide executive cockpit: monitor faculty chairs, inspect course enrollments across all 4 tracks, and manage all registered users and scholars.
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

      {/* Global Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Instructors */}
        <div className="bg-ivory-100 border border-hairline rounded-xl p-5 space-y-1.5 shadow-quiet">
          <div className="flex items-center justify-between text-charcoal-50">
            <span className="text-xs font-semibold uppercase tracking-wider font-formula">
              Faculty Chairs & Mentors
            </span>
            <Users className="w-4 h-4 text-burgundy-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-formula text-charcoal-900">
            {FACULTY_MEMBERS.length}
          </div>
          <span className="text-[11px] text-charcoal-100 font-sans block">
            Supervising all 4 academic tracks
          </span>
        </div>

        {/* Courses */}
        <div className="bg-ivory-100 border border-hairline rounded-xl p-5 space-y-1.5 shadow-quiet">
          <div className="flex items-center justify-between text-charcoal-50">
            <span className="text-xs font-semibold uppercase tracking-wider font-formula">
              Total Platform Courses
            </span>
            <Layers className="w-4 h-4 text-burgundy-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-formula text-charcoal-900">
            {courses.length}
          </div>
          <span className="text-[11px] text-charcoal-100 font-sans block">
            Across Secondary, IGCSE, Undergrad & Public
          </span>
        </div>

        {/* Enrolled Scholars */}
        <div className="bg-ivory-100 border border-hairline rounded-xl p-5 space-y-1.5 shadow-quiet">
          <div className="flex items-center justify-between text-charcoal-50">
            <span className="text-xs font-semibold uppercase tracking-wider font-formula">
              Enrolled Scholars
            </span>
            <GraduationCap className="w-4 h-4 text-ochre-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-formula text-ochre-600">
            {totalEnrolledScholars}
          </div>
          <span className="text-[11px] text-charcoal-100 font-sans block">
            Actively enrolled with course access
          </span>
        </div>

        {/* All Registered Users */}
        <div className="bg-ivory-100 border border-hairline rounded-xl p-5 space-y-1.5 shadow-quiet">
          <div className="flex items-center justify-between text-charcoal-50">
            <span className="text-xs font-semibold uppercase tracking-wider font-formula">
              Total Registered Users
            </span>
            <UserCheck className="w-4 h-4 text-burgundy-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-formula text-charcoal-900">
            {totalRegisteredUsers}
          </div>
          <span className="text-[11px] text-charcoal-100 font-sans block">
            {totalNonEnrolledGuests} users awaiting enrollment
          </span>
        </div>
      </div>

      {/* Main Super Admin Navigation Tabs */}
      <div className="border-b border-hairline flex items-center gap-8 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('instructors')}
          className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 ${
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

        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'courses'
              ? 'border-burgundy-500 text-burgundy-500 font-bold'
              : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Courses & Student Counts</span>
          <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
            {courses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3.5 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-burgundy-500 text-burgundy-500 font-bold'
              : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>All Users & Scholars Registry</span>
          <span className="font-formula text-xs px-2 py-0.5 rounded-full bg-ivory-300 text-charcoal-900">
            {totalRegisteredUsers}
          </span>
        </button>
      </div>

      {/* SECTION 1: INSTRUCTORS */}
      {activeTab === 'instructors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900 font-display">
                Faculty Chairs & Teaching Fellows
              </h2>
              <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                Overview of all educators on the platform, their assigned courses, and active enrolled student counts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {instructorStats.map((inst, idx) => (
              <div
                key={inst.id || idx}
                className="p-6 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial transition-all space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  {/* Avatar & Header */}
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
                            Super Admin & Founder
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-charcoal-100 font-sans">{inst.title}</p>
                      <span className="font-formula text-[11px] text-ochre-600 block">
                        {inst.supervisionScope}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Badge row */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-ivory-200/80 border border-hairline">
                      <span className="text-[11px] font-formula text-charcoal-50 uppercase tracking-wider block">
                        Courses Directed
                      </span>
                      <span className="text-xl font-extrabold font-formula text-charcoal-900 block mt-1">
                        {inst.computedCoursesCount}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-ivory-200/80 border border-hairline">
                      <span className="text-[11px] font-formula text-charcoal-50 uppercase tracking-wider block">
                        Enrolled Students
                      </span>
                      <span className="text-xl font-extrabold font-formula text-burgundy-500 block mt-1">
                        {inst.computedStudentsCount}
                      </span>
                    </div>
                  </div>

                  {/* Bio & Specialization */}
                  <div className="space-y-2">
                    <p className="text-xs text-charcoal-100 font-sans leading-relaxed">
                      {inst.bio}
                    </p>
                    <div className="text-[11px] text-charcoal-50 font-mono">
                      Specialization: {inst.specialization}
                    </div>
                  </div>
                </div>

                {/* Direct Contact Footer */}
                <div className="pt-4 border-t border-hairline flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    {inst.whatsapp && (
                      <a
                        href={inst.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 border border-hairline font-semibold transition-colors"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 fill-charcoal-900" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    {inst.email && (
                      <span className="text-xs font-mono text-charcoal-100">
                        {inst.email}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab('courses')}
                    className="font-sans font-semibold text-burgundy-500 hover:text-burgundy-900 transition-colors"
                  >
                    View Courses →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: COURSES & ENROLLMENTS */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900 font-display">
                All Platform Courses & Enrollment Counts
              </h2>
              <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                Every curriculum module across the 4 tracks with real-time active student numbers.
              </p>
            </div>

            {/* Track Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setCourseTrackFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  courseTrackFilter === 'all'
                    ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                    : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
                }`}
              >
                All Tracks ({courses.length})
              </button>
              {ACADEMIC_TRACKS.map((t) => {
                const count = courses.filter((c) => normalizeTrackSlug(c.category) === t.id).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => setCourseTrackFilter(t.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      courseTrackFilter === t.id
                        ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                        : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
                    }`}
                  >
                    {t.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-charcoal-50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course title or code..."
              value={courseSearchQuery}
              onChange={(e) => setCourseSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-ivory-100 border border-hairline rounded-lg text-charcoal-900 focus:outline-none focus:border-burgundy-500"
            />
          </div>

          {/* Courses Table / Cards */}
          <div className="space-y-4">
            {filteredCourses.length === 0 ? (
              <div className="p-12 text-center bg-ivory-100 rounded-2xl border border-hairline text-charcoal-100 text-xs">
                No courses match the selected track filter or search query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCourses.map((course) => {
                  const studentCount = courseEnrollmentCounts[course.id] || 0;
                  return (
                    <div
                      key={course.id}
                      className="p-5 sm:p-6 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Header: Code & Category */}
                        <div className="flex items-center justify-between gap-2 border-b border-hairline pb-2.5">
                          <span className="font-formula text-xs font-bold text-burgundy-500 tracking-wider">
                            {course.code}
                          </span>
                          <span className="font-formula text-[10px] text-charcoal-100 px-2 py-0.5 rounded bg-ivory-200 border border-hairline">
                            {course.categoryName}
                          </span>
                        </div>

                        {/* Title & Subtitle */}
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-charcoal-900 font-display">
                            {course.title}
                          </h3>
                          {course.subTitle && (
                            <p className="text-xs text-charcoal-100 font-sans mt-0.5 line-clamp-1">
                              {course.subTitle}
                            </p>
                          )}
                        </div>

                        {/* Metrics: Enrolled Students & Lectures */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="p-3 rounded-xl bg-ivory-200/70 border border-hairline">
                            <span className="text-[10px] font-formula text-charcoal-50 uppercase tracking-wider block">
                              Enrolled Students
                            </span>
                            <span className="text-xl font-extrabold font-formula text-burgundy-500 block mt-0.5">
                              {studentCount}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-ivory-200/70 border border-hairline">
                            <span className="text-[10px] font-formula text-charcoal-50 uppercase tracking-wider block">
                              Lectures & Modules
                            </span>
                            <span className="text-xl font-extrabold font-formula text-charcoal-900 block mt-0.5">
                              {course.lessons?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action: Open Students Modal */}
                      <div className="pt-3 border-t border-hairline flex items-center justify-between">
                        <span className="text-[11px] text-charcoal-50 font-sans">
                          Instructor: Dr. Omar Magdi
                        </span>

                        <button
                          onClick={() => onOpenCourseStudents(course)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-colors shadow-quiet"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>View Enrolled Students ({studentCount})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: ALL USERS & SCHOLARS REGISTRY */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900 font-display">
                All Registered Users & Scholars Registry
              </h2>
              <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                Complete directory of all registered accounts, distinguishing enrolled students from registered guests/applicants.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onManualAddStudent}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 font-sans text-xs font-bold transition-all shadow-quiet"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Student</span>
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-charcoal-50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or code..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-ivory-100 border border-hairline rounded-lg text-charcoal-900 focus:outline-none focus:border-burgundy-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUserFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  userFilter === 'all'
                    ? 'bg-charcoal-900 text-ivory-100'
                    : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
                }`}
              >
                All Users ({totalRegisteredUsers})
              </button>

              <button
                onClick={() => setUserFilter('enrolled')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  userFilter === 'enrolled'
                    ? 'bg-burgundy-500 text-ivory-100'
                    : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enrolled ({totalEnrolledScholars})</span>
              </button>

              <button
                onClick={() => setUserFilter('unregistered')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  userFilter === 'unregistered'
                    ? 'bg-ochre-600 text-ivory-100'
                    : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Not Enrolled ({totalNonEnrolledGuests})</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-ivory-100 border border-hairline rounded-2xl shadow-quiet overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal-900">
                <thead className="bg-ivory-200/80 border-b border-hairline font-formula text-[11px] text-charcoal-50 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Scholar / User</th>
                    <th className="py-3 px-4">Academic Code</th>
                    <th className="py-3 px-4">Track</th>
                    <th className="py-3 px-4">Contact & WhatsApp</th>
                    <th className="py-3 px-4">Enrollment Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-charcoal-100 text-xs">
                        No users found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((st, idx) => {
                      const isEnrolled = st.activeCoursesCount > 0;
                      return (
                        <tr key={idx} className="hover:bg-ivory-200/50 transition-colors">
                          {/* Name & Email */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Initials name={st.name} size="sm" />
                              <div>
                                <span className="font-bold text-charcoal-900 block font-display">
                                  {st.name}
                                </span>
                                <span className="text-[11px] text-charcoal-100 font-sans">
                                  {st.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Code */}
                          <td className="py-3 px-4 font-mono font-semibold text-charcoal-900 text-[11px]">
                            {st.code || 'PH-SCHOLAR'}
                          </td>

                          {/* Track */}
                          <td className="py-3 px-4 font-sans text-charcoal-100 text-[11px]">
                            {st.track || 'Thanaweya Amma'}
                          </td>

                          {/* Contact & WhatsApp */}
                          <td className="py-3 px-4">
                            {st.phone ? (
                              <a
                                href={`https://wa.me/${st.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 hover:underline"
                              >
                                <WhatsAppIcon className="w-3 h-3 fill-emerald-800" />
                                <span>{st.phone}</span>
                              </a>
                            ) : (
                              <span className="text-charcoal-50 text-[11px] font-mono">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {isEnrolled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-formula">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Enrolled ({st.activeCoursesCount})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold font-formula">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Registered (No Course Yet)</span>
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onDirectEnrollStudent(st)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 border border-hairline text-xs font-semibold transition-colors"
                            >
                              <span>Enroll In Course</span>
                            </button>
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
    </div>
  );
};
