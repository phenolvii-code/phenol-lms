'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { GoogleIcon } from '@/components/auth/AuthIcons';
import { Lock, Mail, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password Recovery States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error || !data?.user) {
        setErrorMessage('Invalid email or password. Please verify your credentials.');
        return;
      }

      router.push('/dashboard');
    } catch {
      setErrorMessage('Invalid email or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResetStatus(null);

    const cleanEmail = (resetEmail || email).trim().toLowerCase();
    if (!cleanEmail) {
      setResetStatus({
        type: 'error',
        text: 'Please enter your registered email address.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setResetStatus({
          type: 'error',
          text: error.message || 'Could not send reset email. Please try again.',
        });
        return;
      }

      setResetStatus({
        type: 'success',
        text: 'A password reset link has been sent to your email. Please check your inbox and spam folder.',
      });
    } catch {
      setResetStatus({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
      }
    } catch {
      setErrorMessage('Google Sign-In failed. Please try again.');
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
          href="/"
          className="text-xs font-semibold text-charcoal-100 hover:text-charcoal-900 transition-colors"
        >
          ← Return to Home
        </Link>
      </header>

      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="border border-hairline rounded bg-ivory-100 p-6 sm:p-8 space-y-6 shadow-editorial">
          {isForgotPassword ? (
            /* Forgot Password View */
            <div className="space-y-6">
              <div className="space-y-1 text-center">
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
                  PASSWORD RECOVERY
                </span>
                <h1 className="text-2xl font-bold text-charcoal-900 font-display">
                  Reset Password
                </h1>
                <p className="text-xs text-charcoal-100 font-sans">
                  Enter your registered email and we&apos;ll send you a link to choose a new password.
                </p>
              </div>

              {resetStatus && (
                <div
                  className={`p-3 rounded text-xs flex items-start gap-2 ${
                    resetStatus.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : 'bg-burgundy-50 border border-burgundy-200 text-burgundy-900'
                  }`}
                >
                  {resetStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-burgundy-500 shrink-0 mt-0.5" />
                  )}
                  <span>{resetStatus.text}</span>
                </div>
              )}

              <form onSubmit={handleResetPasswordRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-charcoal-50 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 sm:py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 disabled:opacity-50 text-ivory-100 font-sans font-semibold text-xs sm:text-sm transition-colors shadow-quiet flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? 'Sending Link...' : 'Send Reset Link'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-4 border-t border-hairline text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetStatus(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-charcoal-100 hover:text-charcoal-900 font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Login View */
            <>
              <div className="space-y-1 text-center">
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
                  ACADEMIC PORTAL
                </span>
                <h1 className="text-2xl font-bold text-charcoal-900 font-display">
                  Sign In to PHENOL
                </h1>
                <p className="text-xs text-charcoal-100 font-sans">
                  Enter your credentials to access your dashboard and cohorts.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded bg-burgundy-50 border border-burgundy-200 text-burgundy-900 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-burgundy-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Google Sign In Button */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-ivory-50 active:scale-[0.99] border border-hairline rounded font-semibold text-charcoal-900 text-sm shadow-quiet transition-all hover:border-charcoal-200"
                >
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                  <span>Sign In with Google</span>
                </button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-hairline" />
                  </div>
                  <div className="relative bg-ivory-100 px-3 text-[11px] uppercase tracking-wider text-charcoal-50 font-formula">
                    Or with email
                  </div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-charcoal-50 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-charcoal-900 font-sans">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setResetEmail(email);
                        setErrorMessage(null);
                        setResetStatus(null);
                      }}
                      className="text-[11px] font-sans font-medium text-burgundy-500 hover:text-burgundy-800 hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-charcoal-50 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 sm:py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 disabled:opacity-50 text-ivory-100 font-sans font-semibold text-xs sm:text-sm transition-colors shadow-quiet flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-4 border-t border-hairline text-center text-xs text-charcoal-100 font-sans">
                Don&apos;t have an account yet?{' '}
                <Link href="/register" className="text-burgundy-500 font-semibold hover:underline">
                  Enroll for Cohort
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full text-center py-4 text-xs font-formula text-charcoal-50">
        PHENOL • Dr. Omar Magdi Academic System © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
