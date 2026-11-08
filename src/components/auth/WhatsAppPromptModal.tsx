'use client';

import React, { useState } from 'react';
import { AuthUser } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import { ShieldCheck, Phone, ArrowRight } from 'lucide-react';

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
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage('Please enter a valid WhatsApp phone number (at least 10 digits).');
      setIsLoading(false);
      return;
    }

    try {
      // Direct update to registered_students allowed columns as permitted by RLS
      const { error } = await supabase
        .from('registered_students')
        .update({
          phone: cleanPhone,
          academic_track: academicTrack,
          last_active: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      const updatedUser: AuthUser = {
        ...user,
        phone: cleanPhone,
        whatsapp: cleanPhone,
        academicTrack,
      };

      onSuccess(updatedUser);
    } catch {
      setErrorMessage('Failed to save WhatsApp number. Please try again.');
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
              <h3 className="font-editorial text-sm font-bold uppercase tracking-wider text-charcoal-900">
                WhatsApp Verification
              </h3>
              <p className="text-xs text-charcoal-100 font-sans">Required for cohort communication</p>
            </div>
          </div>
          <PhenolLogo size={24} withText={false} />
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/60 rounded text-xs text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Dr. Omar communicates directly via WhatsApp to coordinate problem-solving sessions and provide feedback.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded bg-burgundy-50 border border-burgundy-200 text-burgundy-900 text-xs">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal-900 mb-1.5 font-sans">
              WhatsApp Contact Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-charcoal-50 absolute left-3 top-3 pointer-events-none" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20 10xxxxxxxx"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-900 mb-1.5 font-sans">
              Academic Program
            </label>
            <select
              value={academicTrack}
              onChange={(e) => setAcademicTrack(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
            >
              <option value="thanaweya-arabic">Thanaweya Amma (Arabic)</option>
              <option value="thanaweya-languages">Thanaweya Amma (Languages / Experimental)</option>
              <option value="igcse-alevel">IGCSE / A-Level Chemistry</option>
              <option value="university">University Chemistry</option>
            </select>
          </div>

          <div className="pt-2 flex items-center gap-3">
            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded border border-hairline text-charcoal-100 hover:text-charcoal-900 text-xs font-semibold transition-colors"
              >
                Later
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-quiet flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Saving...' : 'Confirm Contact'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
