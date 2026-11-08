'use client';

import React, { useState } from 'react';
import { AuthUser } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { getStudentAcademicCode } from '@/lib/student-code';
import { recordRegisteredStudent } from '@/lib/enrollment-storage';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import { ShieldCheck, Phone, CheckCircle2, ArrowRight } from 'lucide-react';

interface WhatsAppPromptModalProps {
  isOpen: boolean;
  user: AuthUser | null;
  onSuccess: (updatedUser: AuthUser) => void;
  canClose?: boolean;
  onClose?: () => void;
}

export const WhatsAppPromptModal: React.FC<WhatsAppPromptModalProps> = ({
  isOpen,
  user,
  onSuccess,
  canClose = false,
  onClose,
}) => {
  const [phone, setPhone] = useState(user?.phone || '');
  const [academicTrack, setAcademicTrack] = useState<string>(
    user?.academicTrack || 'thanaweya-arabic'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanPhone = phone.trim();

    // Egyptian & International phone validation
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage('Please enter a valid WhatsApp phone number (at least 10 digits).');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Assign deterministic academic code if not present
      const academicCode = user.academicCode || getStudentAcademicCode({
        ...user,
        phone: cleanPhone,
      });

      const updatedUser: AuthUser = {
        ...user,
        phone: cleanPhone,
        whatsapp: cleanPhone,
        academicCode,
        academicTrack,
      };

      // 2. Save to LocalStorage
      localStorage.setItem('phenol_auth_user', JSON.stringify(updatedUser));

      // 3. Sync to Supabase user metadata
      try {
        await supabase.auth.updateUser({
          data: {
            phone: cleanPhone,
            whatsapp: cleanPhone,
            academic_track: academicTrack,
            academic_code: academicCode,
          },
        });
      } catch (err) {}

      // 4. Record student in permanent roster so Dr. Omar sees them immediately
      recordRegisteredStudent(updatedUser);

      onSuccess(updatedUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save WhatsApp number. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-900/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-md bg-ivory-100 rounded-lg border border-hairline shadow-editorial overflow-hidden">
        {/* Header with WhatsApp green accent */}
        <div className="p-6 border-b border-hairline bg-ivory-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shadow-sm">
              <WhatsAppIcon className="w-5 h-5 fill-emerald-600" />
            </div>
            <div>
              <span className="font-editorial text-xs font-bold uppercase tracking-wider text-charcoal-900 block">
                PHENOL ACADEMY
              </span>
              <span className="text-xs text-charcoal-100 font-sans">
                Student WhatsApp Verification
              </span>
            </div>
          </div>

          <div className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold">
            Required Step
          </div>
        </div>

        {/* User Identity Preview */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3 bg-ivory-50 border border-hairline rounded">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border border-hairline shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-charcoal-900 truncate">{user.name}</p>
              <p className="text-xs text-charcoal-100 truncate font-mono">{user.email}</p>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded text-xs text-charcoal-800 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>مطلوب: رقم الواتساب الخاص بالطالب</span>
            </div>
            <p className="text-charcoal-100 text-[11px]">
              رقم الواتساب إلزامي لربطه بكودك الأكاديمي، إرسال مواعيد المحاضرات والواجبات الدورية، وتأكيد انضمامك لجروب الدفعة الخاص بـ د. عمر مجدي.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-burgundy-50 border border-burgundy-200 text-burgundy-900 rounded text-xs">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1.5">
                WhatsApp Phone Number / رقم الواتساب <span className="text-burgundy-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 flex items-center gap-1.5 text-emerald-600">
                  <WhatsAppIcon className="w-4 h-4 fill-emerald-600" />
                  <span className="text-xs font-mono font-bold text-charcoal-100 border-r border-hairline pr-1.5">
                    +20
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full pl-20 pr-3.5 py-2.5 text-sm font-mono bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[10px] text-charcoal-100 mt-1 block">
                Ex: 01012345678, 011..., 012..., or 015...
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1.5">
                Academic Track / المرحلة الدراسية <span className="text-burgundy-500">*</span>
              </label>
              <select
                value={academicTrack}
                onChange={(e) => setAcademicTrack(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
              >
                <option value="thanaweya-arabic">ثانوية عامة عربي (Thanaweya Amma - Arabic)</option>
                <option value="thanaweya-languages">ثانوية عامة لغات (Thanaweya Amma - Languages)</option>
                <option value="igcse-stem">IGCSE & STEM Chemistry (الشهادات الدولية)</option>
                <option value="university">مرحلة جامعية وإعدادي طب وصيدلة (University Chemistry)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-ivory-100 text-sm font-semibold transition-colors shadow-quiet flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? 'Saving WhatsApp...' : 'Confirm WhatsApp & Enter Academy'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
