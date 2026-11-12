'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { GoogleIcon } from '@/components/auth/AuthIcons';
import { Lock, Mail, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get('redirect') || '/dashboard';

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

      router.push(redirectParam);
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
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : 'https://phenol-lms.vercel.app/reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        setResetStatus({
          type: 'error',
          text: error.message || 'Unable to send recovery email.',
        });
      } else {
        setResetStatus({
          type: 'success',
          text: 'Recovery link sent! Please check your email inbox and spam folder.',
        });
      }
    } catch (err: any) {
      setResetStatus({
        type: 'error',
        text: err?.message || 'Failed to dispatch reset request.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/dashboard`
          : 'https://phenol-lms.vercel.app/dashboard';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        setErrorMessage('Google authentication failed. Please try again.');
      }
    } catch {
      setErrorMessage('Google authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col justify-between p-4 sm:p-6 selection:bg-burgundy-500 selection:text-ivory-100">
      {/* Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" aria-label="Phenol Academy Home">
          <PhenolLogo size={36} subtitle="First Principles Institution" />
        </Link>
        <Link
          href="/"
          className="text-xs sm:text-sm font-sans text-charcoal-100 hover:text-charcoal-900 transition-colors"
        >
          ← Return to Home
        </Link>
      </header>

      {/* Main Form Card */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md bg-ivory-100 border border-hairline rounded-2xl p-6 sm:p-8 shadow-editorial space-y-6">
          {isForgotPassword ? (
            /* Forgot Password Flow */
            <div className="space-y-5">
              <div className="space-y-1 text-center">
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
                  ACCOUNT RECOVERY
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display">
                  Reset Password
                </h1>
                <p className="text-xs text-charcoal-100 font-sans">
                  Enter your registered email and we&apos;ll send you a link to choose a new password.
                </p>
              </div>

              {resetStatus && (
                <div
                  className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 border shadow-quiet ${
                    resetStatus.type === 'success'
                      ? 'bg-ivory-100 border-hairline text-charcoal-900'
                      : 'bg-ivory-100 border-burgundy-200 text-burgundy-900'
                  }`}
                >
                  {resetStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-ochre-500 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-burgundy-500 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{resetStatus.text}</span>
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
                      value={resetEmail || email}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="scholar@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 sm:py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 disabled:opacity-50 text-ivory-100 font-sans font-semibold text-xs sm:text-sm transition-colors shadow-quiet flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? 'Sending Link...' : 'Send Recovery Link'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-2 text-center">
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
                  Sign In to Phenol Academy
                </h1>
                <p className="text-xs text-charcoal-100 font-sans">
                  Enter your credentials to access your dashboard, courses, and feedback.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-ivory-100 border border-burgundy-200 text-burgundy-900 text-xs flex items-start gap-2.5 shadow-quiet">
                  <ShieldAlert className="w-4 h-4 text-burgundy-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
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
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-hairline w-full"></div>
                  <span className="bg-ivory-100 px-3 text-[11px] font-formula text-charcoal-50 uppercase tracking-widest">
                    Or credentials
                  </span>
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
                      placeholder="scholar@example.com"
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
                        setErrorMessage(null);
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
                <Link
                  href={redirectParam !== '/dashboard' ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
                  className="text-burgundy-500 font-semibold hover:underline"
                >
                  Register as Scholar
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full text-center py-4 text-xs font-formula text-charcoal-50">
        Phenol Academy • First-Principles Institution © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory-200" />}>
      <LoginFormContent />
    </Suspense>
  );
}
