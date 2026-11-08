'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { GoogleIcon, WhatsAppIcon } from '@/components/auth/AuthIcons';
import { Lock, Mail, User, Phone, ShieldAlert, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [academicLevel, setAcademicLevel] = useState('High School Senior');
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

      router.push('/dashboard');
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
        <div className="bg-ivory-100 border border-hairline rounded-lg p-6 sm:p-8 shadow-editorial space-y-6">
          <div className="text-center space-y-1.5 border-b border-hairline pb-5">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
              ADMISSIONS 2026/2027
            </span>
            <h1 className="text-2xl font-bold text-charcoal-900 font-display">
              Create Student Account
            </h1>
            <p className="text-xs text-charcoal-100 font-sans">
              Register your details to access lectures and problem sets under Dr. Omar Magdi.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-burgundy-50 border border-burgundy-200 text-burgundy-900 rounded text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-burgundy-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign Up Button */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-ivory-50 active:scale-[0.99] border border-hairline rounded font-semibold text-charcoal-900 text-sm shadow-quiet transition-all hover:border-charcoal-200"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>Sign Up with Google</span>
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

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1 font-sans">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Youssef Ahmed"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1 font-sans flex items-center gap-1.5">
                <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-600" />
                <span>WhatsApp Number (Required)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 10xxxxxxxx"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1 font-sans">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1 font-sans">
                Academic Level
              </label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
              >
                <option value="High School Senior">High School Senior (Thanaweya Amma / STEM)</option>
                <option value="High School Junior">High School Junior</option>
                <option value="University Undergraduate">University Undergraduate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1 font-sans">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 disabled:opacity-50 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet mt-2 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Registering...' : 'Create Student Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-hairline text-center text-xs text-charcoal-100 font-sans">
            Already enrolled in a cohort?{' '}
            <Link href="/login" className="text-burgundy-500 font-semibold hover:underline">
              Sign In to Dashboard
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
