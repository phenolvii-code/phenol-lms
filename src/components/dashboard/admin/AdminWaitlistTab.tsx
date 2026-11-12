'use client';

import React from 'react';
import { AcademicCategory, WaitlistApplication } from '@/types/lms';
import { ACADEMIC_TRACKS } from '@/data/mock-data';
import {
  GraduationCap,
  Plus,
  MessageCircle,
  Check,
  X,
  Trash2,
} from 'lucide-react';

interface AdminWaitlistTabProps {
  waitlist: WaitlistApplication[];
  trackFilter: AcademicCategory | 'all';
  setTrackFilter: (val: AcademicCategory | 'all') => void;
  handleUpdateWaitlistStatus: (
    id: string,
    status: 'approved' | 'declined' | 'contacted'
  ) => void;
  handleDeleteWaitlist: (id: string, name: string) => void;
  setIsAddApplicantOpen: (val: boolean) => void;
}

export function AdminWaitlistTab({
  waitlist,
  trackFilter,
  setTrackFilter,
  handleUpdateWaitlistStatus,
  handleDeleteWaitlist,
  setIsAddApplicantOpen,
}: AdminWaitlistTabProps) {
  const displayedWaitlist =
    trackFilter === 'all'
      ? waitlist
      : waitlist.filter((w) => {
          const trackObj = ACADEMIC_TRACKS.find((t) => t.id === trackFilter);
          return (
            trackObj &&
            (w.academicTrack.toLowerCase().includes(trackObj.name.toLowerCase()) ||
              w.academicTrack.toLowerCase().includes(trackObj.id.toLowerCase()))
          );
        });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 font-display">
            Prospective Student Applications (2026/2027 Cohort)
          </h2>
          <p className="text-xs text-charcoal-100 font-sans mt-0.5">
            Direct admissions submitted via the landing page. Approve placements or contact applicants directly via WhatsApp.
          </p>
        </div>

        {/* Track filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setTrackFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
              trackFilter === 'all'
                ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
            }`}
          >
            All ({waitlist.length})
          </button>
          {ACADEMIC_TRACKS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTrackFilter(t.id)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                trackFilter === t.id
                  ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                  : 'bg-ivory-100 text-charcoal-100 border border-hairline hover:text-charcoal-900'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {displayedWaitlist.length > 0 ? (
        <div className="border border-hairline rounded bg-ivory-100 overflow-hidden shadow-quiet">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="border-b border-hairline bg-ivory-200/80 text-[11px] font-formula uppercase tracking-wider text-charcoal-50 whitespace-nowrap">
                  <th className="py-3.5 px-4 min-w-[200px]">Applicant</th>
                  <th className="py-3.5 px-4">Contact (WhatsApp)</th>
                  <th className="py-3.5 px-4">Academic Track</th>
                  <th className="py-3.5 px-4">Target Course</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-xs font-sans">
                {displayedWaitlist.map((app) => {
                  const waCleanPhone = app.phone.replace(/[^0-9]/g, '');
                  const waUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(
                    `Hello ${app.fullName}, this is Dr. Omar Magdi's academic office regarding your application for ${app.academicTrack} at PHENOL.`
                  )}`;

                  return (
                    <tr key={app.id} className="hover:bg-ivory-300/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-charcoal-900">
                        {app.fullName}
                        <span className="block text-[11px] text-charcoal-50 font-normal">
                          {app.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-formula text-charcoal-900 whitespace-nowrap">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-charcoal-900 hover:text-burgundy-600 font-semibold"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{app.phone}</span>
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-charcoal-900 font-medium whitespace-nowrap">
                        {app.academicTrack}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-formula font-semibold text-burgundy-500 bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200 text-[11px]">
                          {app.targetCourse.split(' - ')[0]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-formula text-charcoal-50 whitespace-nowrap">
                        {app.appliedAt}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {app.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded bg-ivory-200 text-charcoal-100 border border-hairline text-[11px] font-semibold">
                            Under Review
                          </span>
                        )}
                        {app.status === 'approved' && (
                          <span className="px-2 py-0.5 rounded bg-burgundy-50 text-burgundy-900 border border-burgundy-200 text-[11px] font-semibold">
                            Enrolled
                          </span>
                        )}
                        {app.status === 'contacted' && (
                          <span className="px-2 py-0.5 rounded bg-ivory-300 text-charcoal-900 border border-hairline text-[11px] font-semibold">
                            Contacted
                          </span>
                        )}
                        {app.status === 'declined' && (
                          <span className="px-2 py-0.5 rounded bg-ivory-300 text-burgundy-900 border border-burgundy-200 text-[11px] font-semibold">
                            Declined
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open WhatsApp chat"
                            className="p-1.5 rounded hover:bg-ivory-300 text-charcoal-700 border border-transparent hover:border-hairline transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {app.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateWaitlistStatus(app.id, 'approved')}
                              title="Approve & Enroll"
                              className="p-1.5 rounded hover:bg-ivory-300 text-ochre-600 border border-transparent hover:border-hairline transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {app.status !== 'declined' && (
                            <button
                              onClick={() => handleUpdateWaitlistStatus(app.id, 'declined')}
                              title="Decline Application"
                              className="p-1.5 rounded hover:bg-ivory-300 text-burgundy-600 border border-transparent hover:border-hairline transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteWaitlist(app.id, app.fullName)}
                            title="Permanently Delete Application"
                            className="p-1.5 rounded hover:bg-rose-100 text-rose-800 border border-rose-200 hover:border-rose-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        <div className="border border-dashed border-hairline rounded bg-ivory-100 p-12 text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-charcoal-50 mx-auto" />
          <h3 className="text-base font-bold text-charcoal-900 font-display">
            No Waitlist Applications in this View
          </h3>
          <p className="text-xs text-charcoal-100 font-sans max-w-md mx-auto">
            Applications submitted via the public landing page admission form will immediately appear here. You can also manually register walk-in students.
          </p>
          <button
            onClick={() => setIsAddApplicantOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Walk-in Applicant</span>
          </button>
        </div>
      )}
    </div>
  );
}
