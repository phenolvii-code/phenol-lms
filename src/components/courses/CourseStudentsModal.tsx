'use client';

import React, { useState, useEffect } from 'react';
import { ChemistryCourse } from '@/types/lms';
import {
  CourseEnrollmentRecord,
  listAllEnrollments,
  setEnrollmentStatus,
} from '@/lib/data/enrollments';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import { Initials } from '@/components/ui/Initials';
import {
  X,
  Users,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Award,
  ChevronRight,
  BookOpen,
  KeyRound,
} from 'lucide-react';
import { AdminResetPasswordModal } from '@/components/dashboard/modals/AdminResetPasswordModal';

interface CourseStudentsModalProps {
  isOpen: boolean;
  course: ChemistryCourse;
  onClose: () => void;
  onEnrollmentsUpdated?: () => void;
}

export const CourseStudentsModal: React.FC<CourseStudentsModalProps> = ({
  isOpen,
  course,
  onClose,
  onEnrollmentsUpdated,
}) => {
  const [enrollments, setEnrollments] = useState<CourseEnrollmentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'active'>('all');
  const [resetPasswordStudent, setResetPasswordStudent] = useState<{
    name: string;
    email: string;
    phone?: string;
    code?: string;
  } | null>(null);

  const reloadData = async () => {
    try {
      const all = await listAllEnrollments();
      const courseEnr = all.filter((e) => e.course_id === course.id);
      setEnrollments(courseEnr);
    } catch (err) {
      console.error('Error loading course enrollments:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadData();
    }
  }, [isOpen, course]);

  if (!isOpen) return null;

  const handleApprove = async (enrollmentId: string) => {
    try {
      await setEnrollmentStatus(enrollmentId, 'ACTIVE');
      await reloadData();
      if (onEnrollmentsUpdated) onEnrollmentsUpdated();
    } catch (err: any) {
      alert(err.message || 'Error activating enrollment');
    }
  };

  const handleToggleStatus = async (enrollmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'REJECTED' : 'ACTIVE';
    try {
      await setEnrollmentStatus(enrollmentId, newStatus);
      await reloadData();
      if (onEnrollmentsUpdated) onEnrollmentsUpdated();
    } catch (err: any) {
      alert(err.message || 'Error updating enrollment status');
    }
  };

  const pendingList = enrollments.filter((e) => e.status === 'PENDING');
  const activeList = enrollments.filter((e) => e.status === 'ACTIVE');

  const filteredEnrollments = enrollments.filter((e) => {
    if (filterTab === 'pending' && e.status !== 'PENDING') return false;
    if (filterTab === 'active' && e.status !== 'ACTIVE') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.student_name || '').toLowerCase().includes(q) ||
      (e.student_phone || '').toLowerCase().includes(q) ||
      (e.student_code || '').toLowerCase().includes(q) ||
      (e.student_email || '').toLowerCase().includes(q)
    );
  });

  // Calculate Course Averages
  const avgProgress =
    activeList.length > 0
      ? Math.round(activeList.reduce((acc, curr: any) => acc + (curr.progressPercent || 0), 0) / activeList.length)
      : 0;

  const avgGrade =
    activeList.length > 0
      ? Math.round(activeList.reduce((acc, curr: any) => acc + (curr.averageQuizGrade || 0), 0) / activeList.length)
      : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-900/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl bg-ivory-100 rounded-2xl border border-hairline shadow-editorial overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-hairline bg-ivory-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-formula text-xs font-bold text-burgundy-900 bg-burgundy-50 px-2.5 py-0.5 rounded border border-burgundy-200">
                {course.code}
              </span>
              <span className="text-xs text-charcoal-50 font-sans">
                {course.categoryName}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
              {course.title}
            </h2>
            <p className="text-xs text-charcoal-100 font-mono mt-0.5">
              Course Enrollment Roster & Performance Telemetry • Supervised by Dr. Omar Magdi
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-charcoal-50 hover:text-charcoal-900 hover:bg-ivory-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course Performance Metrics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border-b border-hairline shrink-0">
          <div className="p-3 rounded-xl bg-ivory-50 border border-hairline">
            <span className="text-[10px] font-mono text-charcoal-50 uppercase block">Active Scholars</span>
            <span className="text-xl font-bold font-editorial text-charcoal-900">{activeList.length} Active</span>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-hairline">
            <span className="text-[10px] font-mono text-amber-700 uppercase block">Pending Requests</span>
            <span className="text-xl font-bold font-editorial text-amber-700">{pendingList.length} Pending</span>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-hairline">
            <span className="text-[10px] font-mono text-burgundy-900 uppercase block">Average Completion</span>
            <span className="text-xl font-bold font-editorial text-burgundy-900">{avgProgress}%</span>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-hairline">
            <span className="text-[10px] font-mono text-emerald-700 uppercase block">Average Quiz Score</span>
            <span className="text-xl font-bold font-editorial text-emerald-700">{avgGrade}/20</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-ivory-50 border-b border-hairline flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                filterTab === 'all'
                  ? 'bg-charcoal-900 text-ivory-100'
                  : 'bg-white border border-hairline text-charcoal-100 hover:text-charcoal-900'
              }`}
            >
              All Students ({enrollments.length})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                filterTab === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white border border-hairline text-amber-800 hover:bg-amber-50'
              }`}
            >
              <span>Pending Requests</span>
              {pendingList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-amber-800">
                  {pendingList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                filterTab === 'active'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white border border-hairline text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              Active Enrolled Students ({activeList.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-charcoal-50 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by student name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-900"
            />
          </div>
        </div>

        {/* Table List of Students */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredEnrollments.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-hairline text-charcoal-100 text-xs">
              No students match the current search or filter criteria.
            </div>
          ) : (
            filteredEnrollments.map((enr) => {
              const cleanPhone = (enr.student_phone || '').replace(/[^0-9]/g, '');
              const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                `Hello ${enr.student_name}, regarding your enrollment in (${course.title}) with Dr. Omar Magdi at PHENOL Academy:`
              )}`;

              return (
                <div
                  key={enr.id}
                  className="p-4 bg-white rounded-xl border border-hairline hover:border-hairline-strong transition-all space-y-3 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* Student Identity */}
                    <div className="flex items-center gap-3">
                      <Initials name={enr.student_name} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-charcoal-900">
                            {enr.student_name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-burgundy-50 text-burgundy-900 border border-burgundy-200">
                            {enr.student_code || 'PH-SCHOLAR'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-charcoal-100 font-mono mt-0.5">
                          <span>{enr.student_email}</span>
                          {enr.student_phone && (
                            <>
                              <span>•</span>
                              <span className="text-charcoal-900 font-semibold">{enr.student_phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick WhatsApp & Action */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setResetPasswordStudent({
                            name: enr.student_name,
                            email: enr.student_email,
                            phone: enr.student_phone,
                            code: enr.student_code,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-burgundy-50 hover:bg-burgundy-100 text-burgundy-900 border border-burgundy-200 text-xs font-semibold transition-colors shadow-sm"
                        title="Reset student password directly"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-burgundy-600" />
                        <span>Reset Password</span>
                      </button>

                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors"
                        title="Chat with student on WhatsApp"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                        <span>WhatsApp Chat</span>
                      </a>

                      {enr.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => handleApprove(enr.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Activate Access Now</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(enr.id, enr.status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            enr.status === 'ACTIVE'
                              ? 'bg-ivory-100 hover:bg-red-50 text-charcoal-100 hover:text-red-700 border-hairline'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {enr.status === 'ACTIVE' ? 'Revoke Access' : 'Reactivate Access'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Course Progress & Telemetry Metrics */}
                  <div className="pt-3 border-t border-hairline grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-ivory-50/70 p-3 rounded-lg">
                    <div>
                      <span className="text-[10px] font-mono text-charcoal-50 uppercase block">Syllabus Progress</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-ivory-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-burgundy-900 rounded-full"
                            style={{ width: `${(enr as any).progressPercent || 0}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-charcoal-900 text-xs">
                          {(enr as any).progressPercent || 0}%
                        </span>
                      </div>
                      <span className="text-[10px] text-charcoal-50 font-mono mt-0.5 block">
                        {(enr as any).completedLessonsCount || 0} of {course.lessons?.length || 0} lectures watched
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-charcoal-50 uppercase block">Quiz Average</span>
                      <span className="font-mono font-bold text-emerald-800 text-sm block mt-1">
                        {enr.status === 'ACTIVE' ? `${(enr as any).averageQuizGrade || 0} / 20` : '—'}
                      </span>
                      <span className="text-[10px] text-charcoal-50 font-mono mt-0.5 block">
                        Evaluation status: {((enr as any).averageQuizGrade || 0) >= 18 ? 'Mastery' : 'On Track'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-charcoal-50 uppercase block">Last Activity</span>
                      <span className="font-sans font-semibold text-charcoal-900 text-xs block mt-1 truncate">
                        {(enr as any).lastLessonTitle || enr.requested_at?.slice(0, 10) || 'Registered'}
                      </span>
                      <span className="text-[10px] text-charcoal-50 font-mono mt-0.5 block">
                        {enr.approved_at ? `Approved ${enr.approved_at.slice(0, 10)}` : `Requested ${enr.requested_at?.slice(0, 10) || ''}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Direct Password Reset Modal */}
      <AdminResetPasswordModal
        isOpen={!!resetPasswordStudent}
        onClose={() => setResetPasswordStudent(null)}
        student={resetPasswordStudent}
      />
    </div>
  );
};
