'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { updateOwnStudentProfile } from '@/lib/data/students';
import { listMyEnrollments, CourseEnrollmentRecord } from '@/lib/data/enrollments';
import { listMyReferrals, ReferralRecord } from '@/lib/data/referrals';
import { generateCourseReferralLink, REFERRAL_MILESTONES } from '@/lib/referral-system';
import { Initials } from '@/components/ui/Initials';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import {
  X,
  User,
  Shield,
  KeyRound,
  GraduationCap,
  Copy,
  Check,
  Share2,
  Gift,
} from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  user: AuthUser;
  onClose: () => void;
  onSave?: (updatedUser: AuthUser) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'academics' | 'referrals' | 'security'>('info');

  // Personal Info Form State
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || user.whatsapp || '');
  const [track, setTrack] = useState(user.academicTrack || 'Public Secondary AR');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);

  // Referral State
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  // Enrolled Courses for this student
  const [studentEnrollments, setStudentEnrollments] = useState<CourseEnrollmentRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(user.name || '');
      setPhone(user.phone || user.whatsapp || '');
      setTrack(user.academicTrack || 'Public Secondary AR');
      setPasswordStatus({ type: 'idle', message: '' });

      // Fetch student enrollments from database
      listMyEnrollments().then(setStudentEnrollments);

      // Fetch referrals from database
      listMyReferrals().then(setReferrals);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (user.academicCode) {
      navigator.clipboard.writeText(user.academicCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyReferralLink = () => {
    const code = user.academicCode || 'PH-SCHOLAR';
    const link = generateCourseReferralLink('catalog', code);
    navigator.clipboard.writeText(link);
    setCopiedRefLink(true);
    setTimeout(() => setCopiedRefLink(false), 2000);
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateOwnStudentProfile({
        name: name.trim() || user.name,
        phone: phone.trim(),
        academic_track: track,
      });

      const updated: AuthUser = {
        ...user,
        name: name.trim() || user.name,
        phone: phone.trim(),
        whatsapp: phone.trim(),
        academicTrack: track,
      };

      if (onSave) {
        onSave(updated);
      }
      onClose();
    } catch {
      alert('Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordStatus({ type: 'error', message: 'Please fill all password fields.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    try {
      // Re-authenticate with current credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordStatus({ type: 'error', message: 'Current password is incorrect.' });
        return;
      }

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordStatus({ type: 'error', message: updateError.message });
        return;
      }

      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordStatus({ type: 'error', message: 'An error occurred while updating password.' });
    }
  };

  const activeCourses = studentEnrollments.filter((e) => e.status === 'ACTIVE');
  const userCode = user.academicCode || 'PH-SCHOLAR';
  const totalPoints = referrals.reduce((sum, r) => sum + (r.points || 0), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-charcoal-900/75 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-3xl bg-ivory-100 rounded-2xl border border-hairline shadow-editorial overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Masthead */}
        <div className="p-5 sm:p-6 pb-4 border-b border-hairline bg-ivory-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Initials name={name || user.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-charcoal-900 font-display">
                  {name || user.name}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Enrolled Scholar
                </span>
              </div>
              <p className="text-xs text-charcoal-100 font-mono mt-0.5">
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-charcoal-50 hover:text-charcoal-900 hover:bg-ivory-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Academic Code Strip */}
        <div className="px-5 sm:px-6 py-2.5 bg-burgundy-900 text-ivory-100 text-xs flex items-center justify-between font-mono shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-ivory-200" />
            <span className="text-ivory-200/80">Academic Code:</span>
            <span className="font-bold tracking-wider text-ivory-100">
              {userCode}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-[11px] hover:text-ivory-300 transition-colors bg-burgundy-800/80 px-2 py-0.5 rounded"
          >
            {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-hairline bg-ivory-50 px-4 sm:px-6 gap-4 sm:gap-6 text-xs font-semibold shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'info'
                ? 'border-burgundy-900 text-burgundy-900 font-bold'
                : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academics')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'academics'
                ? 'border-burgundy-900 text-burgundy-900 font-bold'
                : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Courses & Progress</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('referrals')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'referrals'
                ? 'border-burgundy-900 text-burgundy-900 font-bold'
                : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Referrals & Points</span>
            {totalPoints > 0 && (
              <span className="text-[10px] bg-burgundy-100 text-burgundy-900 font-mono px-1.5 py-0.2 rounded-full font-bold">
                {totalPoints} pts
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'security'
                ? 'border-burgundy-900 text-burgundy-900 font-bold'
                : 'border-transparent text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                    Full Student Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-hairline rounded font-bold text-charcoal-900 focus:outline-none focus:border-burgundy-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 mb-1 flex items-center gap-1.5">
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>WhatsApp Mobile Number</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 10xxxxxxxx"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-hairline rounded font-mono text-charcoal-900 focus:outline-none focus:border-burgundy-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                  Academic Program
                </label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-900"
                >
                  <option value="Public Secondary AR">Public Secondary AR (ثانوية عامة عربي)</option>
                  <option value="Public Secondary EN">Public Secondary EN (Languages / لغات)</option>
                  <option value="IGCSE & A-Level Chemistry">IGCSE & A-Level Chemistry (Cambridge / Edexcel)</option>
                  <option value="University Chemistry">University Chemistry (Faculty of Pharmacy / Medicine / Science)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs border border-hairline rounded text-charcoal-100 hover:text-charcoal-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs bg-burgundy-900 hover:bg-black text-ivory-100 rounded font-semibold transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: COURSES & PROGRESS */}
          {activeTab === 'academics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-charcoal-900">
                  Enrolled Cohorts ({activeCourses.length})
                </h3>
                <span className="text-xs text-charcoal-100 font-sans">Verified Registrations</span>
              </div>

              {activeCourses.length === 0 ? (
                <div className="p-8 text-center bg-ivory-200/50 rounded-xl border border-hairline">
                  <GraduationCap className="w-8 h-8 text-charcoal-50 mx-auto mb-2" />
                  <p className="text-xs text-charcoal-100">No active course enrollments yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeCourses.map((enr) => (
                    <div
                      key={enr.id}
                      className="p-4 rounded-xl bg-white border border-hairline space-y-2 shadow-quiet"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-burgundy-50 text-burgundy-900 font-bold">
                          {enr.course_code || 'CHEM'}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-charcoal-900">{enr.course_title}</h4>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REFERRALS & POINTS */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-ivory-200/60 border border-hairline space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-charcoal-900">Your Unique Referral Link</h3>
                    <p className="text-[11px] text-charcoal-100">
                      Earn 50 academic reward points when a referred peer activates their first cohort.
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xl font-mono font-bold text-burgundy-900 block">
                      {totalPoints} Pts
                    </span>
                    <span className="text-[10px] text-charcoal-100">Confirmed Points</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generateCourseReferralLink('catalog', userCode)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-hairline rounded font-mono text-charcoal-900 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyReferralLink}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold rounded transition-colors shrink-0"
                  >
                    {copiedRefLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRefLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Milestones & Rewards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-charcoal-900 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-burgundy-500" />
                  <span>Milestone Rewards</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {REFERRAL_MILESTONES.map((m) => {
                    const isUnlocked = totalPoints >= m.pointsNeeded;
                    return (
                      <div
                        key={m.pointsNeeded}
                        className={`p-3.5 rounded-xl border space-y-1.5 transition-all ${
                          isUnlocked
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : 'bg-white border-hairline text-charcoal-900 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              isUnlocked ? 'bg-emerald-200/60 text-emerald-900' : 'bg-ivory-200 text-charcoal-100'
                            }`}
                          >
                            {m.badge}
                          </span>
                          <span className="text-xs font-mono font-bold">{m.pointsNeeded} Pts</span>
                        </div>
                        <h5 className="text-xs font-bold">{m.rewardTitle}</h5>
                        <p className="text-[11px] leading-relaxed text-charcoal-100">
                          {m.rewardDescription}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              {passwordStatus.type !== 'idle' && (
                <div
                  className={`p-3 rounded text-xs ${
                    passwordStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-burgundy-50 text-burgundy-900 border border-burgundy-200'
                  }`}
                >
                  {passwordStatus.message}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-burgundy-900 hover:bg-black text-ivory-100 rounded font-semibold transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
