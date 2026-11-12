'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { GoogleIcon, WhatsAppIcon } from '@/components/auth/AuthIcons';
import { Lock, Mail, User, Phone, ShieldAlert, ArrowRight } from 'lucide-react';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get('redirect') || '/dashboard';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [academicLevel, setAcademicLevel] = useState('Secondary & Baccalaureate');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!fullName.trim() || !cleanEmail || !password || !phone.trim()) {
      setErrorMessage('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    const refCode =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('phenol_ref_code') || localStorage.getItem('phenol_ref_code')
        : null;

    try {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            academic_level: academicLevel,
            referred_by: refCode || undefined,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.push(redirectParam);
    } catch {
      setErrorMessage('Registration failed. Please check your information and try again.');
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
      setErrorMessage('Google Sign-Up failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col justify-between p-4 sm:p-6 selection:bg-burgundy-500 selection:text-ivory-100">
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

      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md bg-ivory-100 border border-hairline rounded-2xl p-6 sm:p-8 shadow-editorial space-y-5">
          <div className="space-y-1 text-center">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
              SCHOLAR ENROLLMENT
            </span>
            <h1 className="text-2xl font-bold text-charcoal-900 font-display">
              Create Scholar Account
            </h1>
            <p className="text-xs text-charcoal-100 font-sans">
              Join Phenol Academy to access lecture dossiers, problem-solving sets, and personalized evaluation.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-ivory-100 border border-burgundy-200 text-burgundy-900 text-xs flex items-start gap-2.5 shadow-quiet">
              <ShieldAlert className="w-4 h-4 text-burgundy-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Google Auth Button */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-ivory-50 active:scale-[0.99] border border-hairline rounded font-semibold text-charcoal-900 text-sm shadow-quiet transition-all hover:border-charcoal-200"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>Register with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-hairline w-full"></div>
              <span className="bg-ivory-100 px-3 text-[11px] font-formula text-charcoal-50 uppercase tracking-widest">
                Or fill application
              </span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                Full Scholar Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Omar Ahmed"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scholar@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                WhatsApp Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
                />
              </div>
              <p className="text-[10px] text-charcoal-50 mt-1">
                Required for direct academic coordination with Dr. Omar Magdi and the faculty.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                Target Academic Track
              </label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
              >
                <option value="Secondary & Baccalaureate">Secondary & Baccalaureate (National & French)</option>
                <option value="IGCSE & A-Levels">IGCSE & A-Levels (Cambridge / Edexcel)</option>
                <option value="Undergrads">Undergrads (Pharmacy, Medicine, Science, Eng)</option>
                <option value="Public Courses">Public Courses (General Science & Philosophy)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 disabled:opacity-50 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet mt-2 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Registering...' : 'Create Scholar Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-hairline text-center text-xs text-charcoal-100 font-sans">
            Already enrolled in a cohort?{' '}
            <Link
              href={redirectParam !== '/dashboard' ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
              className="text-burgundy-500 font-semibold hover:underline"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full text-center py-4 text-xs font-formula text-charcoal-50">
        Phenol Academy • First-Principles Institution © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory-200" />}>
      <RegisterFormContent />
    </Suspense>
  );
}
