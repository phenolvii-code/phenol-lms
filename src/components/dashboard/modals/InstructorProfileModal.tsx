'use client';

import React, { useRef } from 'react';
import { AuthUser } from '@/types/auth';
import { Initials } from '@/components/ui/Initials';
import { X, Lock, KeyRound, CheckCircle2, Upload, Trash2, Camera, Link as LinkIcon } from 'lucide-react';

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
}: InstructorProfileModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          if (setAvatar) {
            setAvatar(compressedDataUrl);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-ivory-100 border border-hairline rounded-2xl shadow-editorial max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between shrink-0">
          <div>
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
              INSTRUCTOR SETTINGS
            </span>
            <h3 className="font-bold text-charcoal-900 font-display text-sm sm:text-base">
              Edit Instructor Profile & Photo
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
            Personal & Academic Details
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
          <form onSubmit={onSaveProfile} className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* AVATAR UPLOAD SECTION (Instructors Only) */}
            <div className="p-4 rounded-2xl bg-ivory-200/70 border border-hairline flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-hairline shadow-quiet bg-ivory-100 flex items-center justify-center">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name || 'Instructor'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Initials name={name || 'Dr. Omar Magdi'} size="xl" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 flex items-center justify-center border-2 border-ivory-100 shadow-sm transition-all"
                  title="Upload New Photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div>
                  <h4 className="font-bold text-sm text-charcoal-900 font-display">
                    Profile Photograph
                  </h4>
                  <p className="text-xs text-charcoal-100 font-sans">
                    Instructors can upload their portrait photo or provide an external image link. Students do not have this privilege.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-semibold shadow-quiet transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image File</span>
                  </button>

                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar && setAvatar('')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-ivory-100 hover:bg-ivory-300 text-charcoal-100 hover:text-burgundy-600 border border-hairline text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {/* Direct Image URL input option */}
                <div className="pt-2">
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 text-charcoal-50 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="Or paste direct image URL (https://...)"
                      value={avatar || ''}
                      onChange={(e) => setAvatar && setAvatar(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-hairline rounded font-mono text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>
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
                  placeholder="Organic Reaction Mechanisms & Physical Chemistry"
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
                placeholder="PharmD graduate and chemistry educator. Focused on first-principles causality..."
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
                className="px-6 py-2.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold shadow-md hover:shadow-lg transition-all ring-2 ring-burgundy-500/20"
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
              <div className="p-3 bg-ivory-200 border border-burgundy-200 text-burgundy-900 text-xs rounded-lg flex items-start gap-2.5 shadow-quiet">
                <X className="w-4 h-4 text-burgundy-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{passwordChangeStatus.message}</span>
              </div>
            )}

            {passwordChangeStatus.type === 'success' && (
              <div className="p-3 bg-ivory-200 border border-hairline text-charcoal-900 text-xs rounded-lg flex items-start gap-2.5 shadow-quiet">
                <CheckCircle2 className="w-4 h-4 text-ochre-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{passwordChangeStatus.message}</span>
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
                className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 font-mono focus:outline-none focus:border-burgundy-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 font-mono focus:outline-none focus:border-burgundy-500"
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
                className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 font-mono focus:outline-none focus:border-burgundy-500"
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
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
