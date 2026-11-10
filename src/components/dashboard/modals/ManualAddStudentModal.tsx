'use client';

import React from 'react';
import { Users, X, CheckCircle2 } from 'lucide-react';

interface ManualAddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  track: string;
  setTrack: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ManualAddStudentModal({
  isOpen,
  onClose,
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  track,
  setTrack,
  onSubmit,
}: ManualAddStudentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-ivory-100 border border-hairline rounded-2xl max-w-md w-full p-6 shadow-editorial space-y-4 font-sans text-charcoal-900">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-burgundy-900" />
            <h3 className="text-base font-bold font-display">Register New Student Manually</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-charcoal-50 hover:text-charcoal-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal-900">Full Student Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmed Mohamed Ali"
              className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal-900">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal-900">Phone Number (WhatsApp) *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+20 010 1234 5678"
              className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-charcoal-900">Academic Program</label>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
            >
              <option value="Public Secondary AR">Public Secondary AR</option>
              <option value="Public Secondary EN">Public Secondary EN</option>
              <option value="IGCSE & A-Level / STEM">IGCSE & A-Level / STEM</option>
              <option value="University Chemistry">University Chemistry</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-hairline text-charcoal-100 text-xs font-semibold hover:bg-ivory-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-quiet flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save & Register Student</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
