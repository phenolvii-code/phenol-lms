'use client';

import React from 'react';
import { AcademicCategory } from '@/types/lms';
import { ACADEMIC_TRACKS } from '@/data/mock-data';
import { X } from 'lucide-react';

interface AddApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  track: AcademicCategory;
  setTrack: (val: AcademicCategory) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddApplicantModal({
  isOpen,
  onClose,
  name,
  setName,
  phone,
  setPhone,
  email,
  setEmail,
  track,
  setTrack,
  onSubmit,
}: AddApplicantModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
      <div className="bg-ivory-100 border border-hairline rounded-lg shadow-editorial max-w-md w-full overflow-hidden">
        <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between">
          <div>
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
              ADMISSIONS OFFICE
            </span>
            <h3 className="font-bold text-charcoal-900 font-display text-sm">
              Register Walk-in Applicant
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal-50 hover:text-charcoal-900 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Youssef Ahmed"
              className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
              WhatsApp Contact
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+20 10xxxxxxxx"
              className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
              Target Academic Track
            </label>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value as AcademicCategory)}
              className="w-full px-3 py-2 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
            >
              {ACADEMIC_TRACKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-hairline text-charcoal-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold shadow-quiet"
            >
              Save Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
