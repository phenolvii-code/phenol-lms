'use client';

import React, { useState } from 'react';
import { adminSetStudentPassword } from '@/lib/data/enrollments';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import {
  X,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Sparkles,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    name: string;
    email: string;
    phone?: string;
    code?: string;
  } | null;
}

export function AdminResetPasswordModal({
  isOpen,
  onClose,
  student,
}: AdminResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('Phenol@2026');
  const [showPassword, setShowPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !student) return null;

  const handleGenerateRandom = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setNewPassword(`Phenol@${randomDigits}`);
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student.email) return;

    if (newPassword.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    const res = await adminSetStudentPassword(student.email, newPassword);

    setIsLoading(false);
    if (!res.success) {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Failed to update student password in Supabase.',
      });
    } else {
      setStatusMessage({
        type: 'success',
        text: `Password for ${student.name} updated to "${newPassword}" successfully!`,
      });
    }
  };

  const cleanPhone = student.phone ? student.phone.replace(/[^0-9]/g, '') : '';
  const waText = `أهلاً ${student.name}،\nتم تعيين كلمة مرور جديدة لحسابك في أكاديمية PHENOL بنجاح:\n\n🔑 كلمة المرور: ${newPassword}\n🔗 رابط تسجيل الدخول: https://phenol-lms.vercel.app/login\n\nبالتوفيق، د. عمر مجدي`;
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`
    : `https://wa.me/?text=${encodeURIComponent(waText)}`;

  const handleCopyMessage = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(waText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-ivory-100 border border-hairline rounded-2xl shadow-editorial max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-hairline flex items-center justify-between bg-ivory-200/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-burgundy-50 border border-burgundy-200 flex items-center justify-center text-burgundy-700">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-charcoal-900">
                Direct Password Reset
              </h3>
              <p className="text-[11px] text-charcoal-100 font-sans">
                Set a new password instantly without email requirements
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Scholar Meta Card */}
          <div className="p-3 bg-ivory-50 border border-hairline rounded-lg space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-charcoal-900">{student.name}</span>
              {student.code && (
                <span className="font-mono text-[10px] font-bold text-burgundy-600 bg-burgundy-50 px-1.5 py-0.5 rounded border border-burgundy-200">
                  {student.code}
                </span>
              )}
            </div>
            <div className="text-[11px] text-charcoal-50 font-mono">{student.email}</div>
            {student.phone && (
              <div className="text-[11px] text-emerald-800 font-mono font-medium">
                {student.phone}
              </div>
            )}
          </div>

          {statusMessage && (
            <div
              className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 border shadow-quiet ${
                statusMessage.type === 'success'
                  ? 'bg-ivory-200 border-hairline text-charcoal-900'
                  : 'bg-ivory-200 border-burgundy-200 text-burgundy-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-ochre-500 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-burgundy-500 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-charcoal-900">
                  New Password for Student
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandom}
                  className="text-[11px] font-medium text-burgundy-600 hover:text-burgundy-800 flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate New</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-3 pr-10 py-2 text-sm bg-ivory-50 border border-hairline rounded font-mono text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-charcoal-50 hover:text-charcoal-900"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 disabled:opacity-50 text-ivory-100 text-xs sm:text-sm font-semibold transition-colors shadow-quiet"
            >
              {isLoading ? 'Updating Password in Database...' : 'Apply New Password Now'}
            </button>
          </form>

          {/* Post-Success WhatsApp Actions */}
          {statusMessage?.type === 'success' && (
            <div className="pt-3 border-t border-hairline space-y-2 animate-fade-in">
              <span className="text-[11px] font-semibold text-charcoal-900 block font-formula">
                Send to Student via WhatsApp:
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                  <span>Open WhatsApp Chat</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="py-2 px-3 rounded border border-hairline bg-ivory-50 hover:bg-ivory-200 text-xs text-charcoal-900 font-semibold flex items-center gap-1 transition-colors"
                  title="Copy message to clipboard"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
