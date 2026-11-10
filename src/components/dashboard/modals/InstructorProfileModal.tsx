'use client';

import React from 'react';
import { AuthUser } from '@/types/auth';
import { Initials } from '@/components/ui/Initials';
import { X, Lock, KeyRound, CheckCircle2 } from 'lucide-react';

interface InstructorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tab: 'info' | 'security';
  setTab: (tab: 'info' | 'security') => void;
  avatar?: string;
  setAvatar?: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  specialization: string;
  setSpecialization: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  onSaveProfile: (e: React.FormEvent) => void;
  currentPasswordInput: string;
  setCurrentPasswordInput: (val: string) => void;
  newPasswordInput: string;
  setNewPasswordInput: (val: string) => void;
  confirmPasswordInput: string;
  setConfirmPasswordInput: (val: string) => void;
  passwordChangeStatus: { type: 'idle' | 'success' | 'error'; message: string };
  setPasswordChangeStatus: React.Dispatch<
    React.SetStateAction<{ type: 'idle' | 'success' | 'error'; message: string }>
  >;
  onChangePassword: (e: React.FormEvent) => void;
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
}

export function InstructorProfileModal({
  isOpen,
  onClose,
  tab,
  setTab,
  avatar,
  setAvatar,
  name,
  setName,
  title,
  setTitle,
  specialization,
  setSpecialization,
  phone,
  setPhone,
  bio,
  setBio,
  onSaveProfile,
  currentPasswordInput,
  setCurrentPasswordInput,
  newPasswordInput,
  setNewPasswordInput,
  confirmPasswordInput,
  setConfirmPasswordInput,
  passwordChangeStatus,
  setPasswordChangeStatus,
  onChangePassword,
  currentUser,
  setCurrentUser,
}: InstructorProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-ivory-100 border border-hairline rounded-2xl shadow-editorial max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between shrink-0">
          <div>
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
              PROFILE SETTINGS
            </span>
            <h3 className="font-bold text-charcoal-900 font-display text-sm sm:text-base">
              Edit Personal & Academic Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal-50 hover:text-charcoal-900 p-1.5 rounded-full hover:bg-ivory-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Modal Tabs */}
        <div className="flex border-b border-hairline bg-ivory-300 px-6 pt-2 gap-4 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setTab('info')}
            className={`pb-2.5 border-b-2 transition-colors ${
              tab === 'info'
                ? 'border-burgundy-500 text-burgundy-500 font-bold'
                : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            Personal Details
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('security');
              setPasswordChangeStatus({ type: 'idle', message: '' });
            }}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'security'
                ? 'border-burgundy-500 text-burgundy-500 font-bold'
                : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>
        </div>

        {tab === 'info' ? (
          <form onSubmit={onSaveProfile} className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="p-4 rounded-xl bg-ivory-200/70 border border-hairline flex flex-col sm:flex-row items-center gap-4">
              <Initials name={name || 'Dr. Omar Magdi'} size="xl" />
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <h4 className="font-bold text-sm text-charcoal-900">{name || 'Dr. Omar Magdi'}</h4>
                <p className="text-xs text-charcoal-100">{title || 'Academic Director & Senior Fellow'}</p>
                <p className="text-[11px] font-mono text-charcoal-50">{specialization}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded font-bold text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Academic Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Academic Director & Senior Fellow"
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Organic Reaction Mechanisms"
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 10xxxxxxxx"
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                Bio / Academic Manifesto
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Specialist in organic mechanisms and advanced physical chemistry..."
                className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 font-sans focus:outline-none focus:border-burgundy-500 leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-hairline shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded border border-hairline text-charcoal-50 hover:text-charcoal-900 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-quiet transition-colors"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={onChangePassword} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="p-3.5 bg-ivory-200 border border-hairline rounded text-xs space-y-1">
              <span className="font-semibold text-charcoal-900 flex items-center gap-1.5 font-formula">
                <KeyRound className="w-3.5 h-3.5 text-burgundy-500" />
                <span>Password Management</span>
              </span>
              <p className="text-[11px] text-charcoal-100 leading-relaxed font-sans">
                Change your confidential login password. Any profile (student or administrator) can safely update their password at any time.
              </p>
            </div>

            {passwordChangeStatus.type === 'error' && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-start gap-2">
                <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{passwordChangeStatus.message}</span>
              </div>
            )}

            {passwordChangeStatus.type === 'success' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{passwordChangeStatus.message}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-hairline shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded border border-hairline text-charcoal-50 hover:text-charcoal-900 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold shadow-quiet transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
