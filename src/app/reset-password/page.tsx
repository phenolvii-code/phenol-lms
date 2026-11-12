'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { Lock, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    // Check URL hash for direct error parameters from Supabase
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('otp_expired') || hash.includes('invalid+or+has+expired')) {
        setStatusMessage({
          type: 'error',
          text: 'This password reset link has expired or has already been used. Please request a new reset link.',
        });
        setIsVerifying(false);
        setHasValidSession(false);
        return;
      }
    }

    // Check if recovery session is active
    const checkRecoverySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasValidSession(true);
        }

        // Listen for recovery event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
            setHasValidSession(true);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch {
        setHasValidSession(false);
      } finally {
        setIsVerifying(false);
      }
    };

    checkRecoverySession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({
        type: 'error',
        text: 'Passwords do not match. Please re-enter.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setStatusMessage({
          type: 'error',
          text: error.message || 'Failed to update password.',
        });
        return;
      }

      setStatusMessage({
        type: 'success',
        text: 'Your password has been reset successfully! Redirecting to dashboard...',
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-200 flex flex-col justify-between p-4 sm:p-6 font-sans selection:bg-burgundy-500 selection:text-ivory-100">
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-4">
        <Link href="/" aria-label="PHENOL Home">
          <PhenolLogo size={36} subtitle="Dr. Omar Magdi" />
        </Link>
        <Link
          href="/login"
          className="text-xs font-semibold text-charcoal-100 hover:text-charcoal-900 transition-colors"
        >
          ← Return to Login
        </Link>
      </header>

      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="border border-hairline rounded bg-ivory-100 p-6 sm:p-8 space-y-6 shadow-editorial">
          <div className="space-y-1 text-center">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
              ACCOUNT RECOVERY
            </span>
            <h1 className="text-2xl font-bold text-charcoal-900 font-display">
              Set New Password
            </h1>
            <p className="text-xs text-charcoal-100 font-sans">
              Enter your new secure password below to regain access.
            </p>
          </div>

          {statusMessage && (
            <div
              className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 border shadow-quiet ${
                statusMessage.type === 'success'
                  ? 'bg-ivory-100 border-hairline text-charcoal-900'
                  : 'bg-ivory-100 border-burgundy-200 text-burgundy-900'
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

          {isVerifying ? (
            <div className="py-8 text-center text-xs text-charcoal-50 font-mono animate-pulse">
              Verifying recovery link...
            </div>
          ) : !hasValidSession && !statusMessage?.type ? (
            <div className="space-y-4 text-center py-4">
              <div className="p-3 bg-burgundy-50 border border-burgundy-200 rounded text-xs text-burgundy-900">
                This password reset link is invalid or has expired. Please request a new link from the login page.
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 py-2 px-4 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-charcoal-50 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-charcoal-50 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || statusMessage?.type === 'success'}
                className="w-full py-2.5 sm:py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 disabled:opacity-50 text-ivory-100 font-sans font-semibold text-xs sm:text-sm transition-colors shadow-quiet flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Updating Password...' : 'Save New Password'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-hairline text-center text-xs text-charcoal-100 font-sans">
            Remembered your credentials?{' '}
            <Link href="/login" className="text-burgundy-500 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full text-center py-4 text-xs font-formula text-charcoal-50">
        PHENOL • Dr. Omar Magdi Academic System © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
