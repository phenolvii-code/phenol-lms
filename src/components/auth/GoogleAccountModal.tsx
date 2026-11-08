'use client';

import React, { useState } from 'react';
import { GoogleIcon } from '@/components/auth/AuthIcons';
import { X, UserPlus, Check, ArrowRight } from 'lucide-react';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: { email: string; name: string; avatar?: string }) => void;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setEmailError('Please enter a valid Google email address.');
      return;
    }
    const cleanName = customName.trim() || cleanEmail.split('@')[0];
    onSelectAccount({
      email: cleanEmail,
      name: cleanName,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/70 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-editorial border border-hairline overflow-hidden text-charcoal-900">
        {/* Top Google Header */}
        <div className="p-6 pb-4 border-b border-hairline/60 bg-ivory-50/50">
          <div className="flex items-center justify-between mb-3">
            <GoogleIcon className="w-6 h-6" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-charcoal-50 hover:text-charcoal-900 hover:bg-ivory-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-charcoal-900">
            Choose an account
          </h2>
          <p className="text-xs text-charcoal-100 mt-0.5">
            to continue to <span className="font-semibold text-burgundy-900">PHENOL Academy</span>
          </p>
        </div>

        {/* Account List */}
        <div className="p-4 space-y-2">
          {/* Option 1: Dr. Omar Magdi */}
          <button
            type="button"
            onClick={() =>
              onSelectAccount({
                email: 'phenolvii@gmail.com',
                name: 'Dr. Omar Magdi',
                avatar:
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
              })
            }
            className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-ivory-100/80 active:bg-ivory-200 transition-all text-left border border-transparent hover:border-hairline group"
          >
            <div className="w-10 h-10 rounded-full bg-burgundy-900 text-ivory-100 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm border border-burgundy-700">
              OM
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-charcoal-900 truncate">Dr. Omar Magdi</p>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-burgundy-50 text-burgundy-800 border border-burgundy-200">
                  Director
                </span>
              </div>
              <p className="text-[11px] text-charcoal-100 font-mono truncate">phenolvii@gmail.com</p>
            </div>
          </button>

          {/* Option 2: Student Google Sign-in */}
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-ivory-100/80 transition-all text-left border border-hairline/80 group mt-1"
            >
              <div className="w-10 h-10 rounded-full bg-ivory-200 text-charcoal-100 flex items-center justify-center shrink-0 group-hover:bg-ivory-300 transition-colors">
                <UserPlus className="w-4 h-4 text-charcoal-100" />
              </div>
              <div>
                <p className="text-xs font-semibold text-charcoal-900">Student Google Account</p>
                <p className="text-[11px] text-charcoal-50 font-sans">Sign in or register with your Gmail</p>
              </div>
            </button>
          ) : (
            <form onSubmit={handleCustomSubmit} className="p-3.5 rounded-xl bg-ivory-50 border border-hairline space-y-3 mt-1 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-900">Enter Your Gmail</span>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="text-[11px] text-burgundy-600 hover:underline"
                >
                  Cancel
                </button>
              </div>

              {emailError && (
                <div className="text-[11px] text-burgundy-600 bg-burgundy-50 p-2 rounded border border-burgundy-200">
                  {emailError}
                </div>
              )}

              <input
                type="email"
                required
                autoFocus
                placeholder="your.name@gmail.com"
                value={customEmail}
                onChange={(e) => {
                  setCustomEmail(e.target.value);
                  setEmailError(null);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-mono"
              />

              <input
                type="text"
                placeholder="Student Full Name (e.g. Youssef Tarek)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
              />

              <button
                type="submit"
                disabled={!customEmail.trim()}
                className="w-full py-2 bg-charcoal-900 hover:bg-black text-ivory-100 text-xs font-semibold rounded disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Continue to PHENOL Academy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-ivory-50/70 border-t border-hairline/60 text-[10px] text-charcoal-50 leading-relaxed">
          To continue, Google will verify your identity with PHENOL Academy. Next step: you will be asked to connect your active WhatsApp phone number.
        </div>
      </div>
    </div>
  );
};
