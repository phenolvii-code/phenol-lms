'use client';

import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Award,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import {
  generateCourseReferralLink,
  getReferralStats,
  REFERRAL_MILESTONES,
} from '@/lib/referral-system';

interface CourseShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  referralCode: string;
}

export const CourseShareModal: React.FC<CourseShareModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  courseCode,
  referralCode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareLink = generateCourseReferralLink(courseId, referralCode);
  const stats = getReferralStats(referralCode);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    `Explore "${courseTitle}" (${courseCode}) with Dr. Omar Magdi at PHENOL Academy. Learn chemistry through first principles & analytical derivation:\n${shareLink}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl bg-ivory-100 rounded-lg border border-hairline shadow-editorial overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-hairline bg-ivory-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-burgundy-500/10 border border-burgundy-500/20 flex items-center justify-center text-burgundy-500">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                SCHOLAR AMBASSADOR PROGRAM
              </span>
              <h3 className="font-bold text-charcoal-900 font-display text-sm sm:text-base">
                Share Course & Earn Academic Points
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-charcoal-50 hover:text-charcoal-900 rounded hover:bg-ivory-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Points & Stats Dashboard Header */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-ivory-200 border border-hairline rounded">
            <div className="text-center space-y-0.5">
              <span className="font-formula text-[11px] text-charcoal-50 block uppercase">
                Your Points
              </span>
              <span className="text-xl sm:text-2xl font-bold font-formula text-burgundy-500 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4 text-burgundy-500" />
                {stats.points}
              </span>
            </div>
            <div className="text-center space-y-0.5 border-x border-hairline">
              <span className="font-formula text-[11px] text-charcoal-50 block uppercase">
                Link Visits
              </span>
              <span className="text-xl sm:text-2xl font-bold font-formula text-charcoal-900 flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-charcoal-50" />
                {stats.totalClicks}
              </span>
            </div>
            <div className="text-center space-y-0.5">
              <span className="font-formula text-[11px] text-charcoal-50 block uppercase">
                Scholars Enrolled
              </span>
              <span className="text-xl sm:text-2xl font-bold font-formula text-emerald-700 flex items-center justify-center gap-1">
                <Users className="w-4 h-4 text-emerald-600" />
                {stats.successfulReferrals}
              </span>
            </div>
          </div>

          {/* Referral Link Copy Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-charcoal-900 font-sans">
              Your Unique Referral Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="w-full px-3.5 py-2.5 text-xs font-formula bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 shadow-quiet'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-charcoal-50 font-sans">
              Every peer who registers using your link automatically credits <strong className="text-burgundy-500 font-bold">+50 Academic Points</strong> to your account.
            </p>
          </div>

          {/* Share on WhatsApp Button */}
          <div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <WhatsAppIcon className="w-4 h-4 fill-emerald-600" />
              <span>Share Directly to WhatsApp Contacts & Study Groups</span>
            </a>
          </div>

          {/* Milestones & Rewards Roadmap */}
          <div className="space-y-3 pt-2 border-t border-hairline">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold font-formula uppercase tracking-wider text-charcoal-900 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-burgundy-500" />
                <span>Academic Rewards & Tuition Grants</span>
              </h4>
              <span className="text-[11px] font-formula text-charcoal-50">
                Tier Progress: {stats.points} pts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REFERRAL_MILESTONES.map((milestone) => {
                const isUnlocked = stats.points >= milestone.pointsNeeded;
                return (
                  <div
                    key={milestone.pointsNeeded}
                    className={`p-3.5 rounded border transition-colors ${
                      isUnlocked
                        ? 'bg-emerald-50/60 border-emerald-300'
                        : 'bg-ivory-200 border-hairline opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-formula text-[10px] font-bold px-1.5 py-0.5 rounded bg-ivory-100 border border-hairline text-charcoal-900">
                        {milestone.pointsNeeded} Points
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          isUnlocked ? 'text-emerald-700' : 'text-charcoal-50'
                        }`}
                      >
                        {isUnlocked ? '✓ Unlocked' : 'Locked'}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-charcoal-900 font-display">
                      {milestone.rewardTitle}
                    </h5>
                    <p className="text-[11px] text-charcoal-100 leading-snug mt-1 font-sans">
                      {milestone.rewardDescription}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-hairline bg-ivory-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-ivory-100 hover:bg-ivory-300 border border-hairline text-charcoal-900 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
