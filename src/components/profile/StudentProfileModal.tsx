'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AuthUser } from '@/types/auth';
import { CourseEnrollment, getStoredEnrollments } from '@/lib/enrollment-storage';
import { verifyUserPassword, setUserPassword } from '@/lib/auth-passwords';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import {
  getReferralStats,
  generateCourseReferralLink,
  REFERRAL_MILESTONES,
  ReferralStats,
} from '@/lib/referral-system';
import {
  X,
  User,
  Phone,
  Shield,
  KeyRound,
  GraduationCap,
  Copy,
  Check,
  Upload,
  Sparkles,
  Share2,
  Gift,
  Award,
} from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  user: AuthUser;
  onClose: () => void;
  onSave: (updatedUser: AuthUser) => void;
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
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);

  // Referral State
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  // Enrolled Courses for this student
  const [studentEnrollments, setStudentEnrollments] = useState<CourseEnrollment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(user.name || '');
      setPhone(user.phone || user.whatsapp || '');
      setTrack(user.academicTrack || 'Public Secondary AR');
      setAvatar(user.avatar || '');
      setPasswordStatus({ type: 'idle', message: '' });

      const all = getStoredEnrollments();
      const myEnrollments = all.filter(
        (e) => e.studentEmail.toLowerCase() === user.email.toLowerCase()
      );
      setStudentEnrollments(myEnrollments);

      const code = user.academicCode || 'PH-SCHOLAR';
      setReferralStats(getReferralStats(code));
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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose an image file under 2 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AuthUser = {
      ...user,
      name: name.trim() || user.name,
      phone: phone.trim(),
      whatsapp: phone.trim(),
      academicTrack: track,
      avatar: avatar.trim() || user.avatar,
    };
    onSave(updated);
    onClose();
  };

  const handleChangePassword = (e: React.FormEvent) => {
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

    if (!verifyUserPassword(user.email, currentPassword)) {
      setPasswordStatus({ type: 'error', message: 'Current password is incorrect.' });
      return;
    }

    setUserPassword(user.email, newPassword);
    setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const activeCourses = studentEnrollments.filter((e) => e.status === 'ACTIVE');
  const userCode = user.academicCode || 'PH-SCHOLAR';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-charcoal-900/75 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-3xl bg-ivory-100 rounded-2xl border border-hairline shadow-editorial overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Masthead */}
        <div className="p-5 sm:p-6 pb-4 border-b border-hairline bg-ivory-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={avatar || user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-burgundy-900 shadow-sm"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload photo from device"
                className="absolute inset-0 bg-charcoal-900/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-semibold transition-opacity"
              >
                <Upload className="w-4 h-4 mb-0.5" />
                <span>Upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-charcoal-900 font-display">
                  {user.name}
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
            {referralStats && referralStats.points > 0 && (
              <span className="text-[10px] bg-burgundy-100 text-burgundy-900 font-mono px-1.5 py-0.2 rounded-full font-bold">
                {referralStats.points} pts
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
              
              {/* Photo Upload Section */}
              <div className="p-4 rounded-xl bg-ivory-200/70 border border-hairline flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-burgundy-900 shrink-0"
                />
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold rounded transition-colors shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo from Device</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')}
                      className="text-[11px] text-charcoal-50 hover:text-charcoal-900 underline"
                    >
                      Reset Default
                    </button>
                  </div>
                  <p className="text-[11px] text-charcoal-50 font-sans">
                    PNG, JPG, or WEBP under 2MB. Your photo appears on test submissions and course roster.
                  </p>
                </div>
              </div>

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
                  className="px-5 py-2 text-xs bg-burgundy-900 hover:bg-black text-ivory-100 rounded font-semibold transition-colors"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ACADEMIC COURSES & PERFORMANCE */}
          {activeTab === 'academics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-white rounded-xl border border-hairline">
                  <span className="text-[10px] font-mono text-charcoal-50 uppercase block">Active Courses</span>
                  <span className="text-xl font-bold font-editorial text-burgundy-900">{activeCourses.length}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-hairline">
                  <span className="text-[10px] font-mono text-charcoal-50 uppercase block">Total Lessons Watched</span>
                  <span className="text-xl font-bold font-editorial text-charcoal-900">
                    {activeCourses.reduce((acc, c) => acc + c.completedLessonsCount, 0)}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-hairline">
                  <span className="text-[10px] font-mono text-charcoal-50 uppercase block">Average Grade</span>
                  <span className="text-xl font-bold font-editorial text-emerald-700">
                    {activeCourses.length > 0 ? '92%' : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider font-mono">
                  Enrolled Course Modules & Progress
                </h3>

                {studentEnrollments.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-xl border border-hairline text-charcoal-100 text-xs">
                    You have not requested any courses yet. Browse available courses in the catalog and request activation.
                  </div>
                ) : (
                  studentEnrollments.map((enr) => (
                    <div
                      key={enr.id}
                      className="p-3.5 bg-white rounded-xl border border-hairline space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-burgundy-900 bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                            {enr.courseCode}
                          </span>
                          <h4 className="text-xs font-bold text-charcoal-900 mt-1">
                            {enr.courseTitle}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            enr.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {enr.status === 'ACTIVE' ? 'Active Access' : 'Pending Approval'}
                        </span>
                      </div>

                      {enr.status === 'ACTIVE' && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-charcoal-100 font-mono">
                            <span>Progress: {enr.progressPercent}%</span>
                            <span>{enr.completedLessonsCount} / {enr.totalLessonsCount} Modules</span>
                          </div>
                          <div className="w-full h-1.5 bg-ivory-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-burgundy-900 rounded-full"
                              style={{ width: `${enr.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REFERRALS & ACADEMIC REWARD POINTS */}
          {activeTab === 'referrals' && (
            <div className="space-y-5">
              
              {/* Points Banner */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-burgundy-900 to-black text-ivory-100 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Academic Ambassador Points</span>
                  </div>
                  <h3 className="text-2xl font-bold font-editorial">
                    {referralStats?.points || 0} <span className="text-sm font-sans font-normal text-ivory-200">Points Earned</span>
                  </h3>
                  <p className="text-xs text-ivory-200/80 font-sans">
                    Each colleague who registers with your link earns you <strong className="text-ivory-100">+50 Points</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl border border-white/15">
                  <div className="text-center">
                    <span className="text-xs font-mono text-ivory-200/70 block uppercase">Referrals</span>
                    <span className="text-lg font-bold font-mono text-ivory-100">{referralStats?.successfulReferrals || 0}</span>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="text-center">
                    <span className="text-xs font-mono text-ivory-200/70 block uppercase">Link Clicks</span>
                    <span className="text-lg font-bold font-mono text-ivory-100">{referralStats?.totalClicks || 0}</span>
                  </div>
                </div>
              </div>

              {/* Referral Link Box */}
              <div className="p-4 rounded-xl bg-white border border-hairline space-y-2">
                <label className="block text-xs font-bold text-charcoal-900">
                  Your Personal Referral Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generateCourseReferralLink('catalog', userCode)}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-ivory-100 border border-hairline rounded text-charcoal-900 select-all"
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
                  <span>Milestone Rewards & Unlocks</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {REFERRAL_MILESTONES.map((m) => {
                    const isUnlocked = (referralStats?.points || 0) >= m.pointsNeeded;
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
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isUnlocked ? 'bg-emerald-200/60 text-emerald-900' : 'bg-ivory-200 text-charcoal-100'
                          }`}>
                            {m.badge}
                          </span>
                          <span className="text-xs font-mono font-bold">
                            {m.pointsNeeded} Pts
                          </span>
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
