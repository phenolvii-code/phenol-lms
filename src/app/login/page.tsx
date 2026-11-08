'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AuthUser, ADMIN_EMAILS } from '@/types/auth';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { verifyUserPassword } from '@/lib/auth-passwords';
import { Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const isAdmin =
      cleanEmail === 'phenolvii@gmail.com' ||
      cleanEmail.includes('phenolvii') ||
      cleanEmail.includes('admin@phenol') ||
      ADMIN_EMAILS.includes(cleanEmail);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        const userObj: AuthUser = {
          id: data.user.id,
          name: isAdmin ? 'Dr. Omar Magdi' : (data.user.user_metadata?.full_name || cleanEmail.split('@')[0]),
          email: data.user.email || cleanEmail,
          phone: data.user.user_metadata?.phone,
          role: isAdmin ? 'INSTRUCTOR' : 'STUDENT',
          avatar: isAdmin
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          registeredAt: data.user.created_at,
          title: isAdmin ? 'Academic Director & Senior Fellow' : undefined,
          specialization: isAdmin ? 'Organic Reaction Mechanisms & Physical Chemistry' : undefined,
        };
        localStorage.setItem('phenol_auth_user', JSON.stringify(userObj));
        router.push('/dashboard');
        return;
      }

      // Check custom passwords and verified master keys
      if (verifyUserPassword(cleanEmail, password)) {
        const userObj: AuthUser = {
          id: isAdmin ? 'dr-omar-magdi' : `student-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
          name: isAdmin ? 'Dr. Omar Magdi' : (cleanEmail.split('@')[0] || 'Enrolled Scholar'),
          email: cleanEmail,
          role: isAdmin ? 'INSTRUCTOR' : 'STUDENT',
          avatar: isAdmin
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          registeredAt: '2026-01-01',
          title: isAdmin ? 'Academic Director & Senior Fellow' : undefined,
          specialization: isAdmin ? 'Organic Reaction Mechanisms & Physical Chemistry' : undefined,
          bio: isAdmin ? 'Specialist in organic mechanisms, reaction kinetics, and first-principles pedagogy across 4 Core Tracks.' : undefined,
        };
        localStorage.setItem('phenol_auth_user', JSON.stringify(userObj));
        router.push('/dashboard');
        return;
      }

      setErrorMessage('Invalid email or password. Please verify your credentials.');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during sign in');
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
          href="/"
          className="text-xs font-semibold text-charcoal-100 hover:text-charcoal-900 transition-colors"
        >
          ← Return to Home
        </Link>
      </header>

      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="border border-hairline rounded bg-ivory-100 p-6 sm:p-8 space-y-6 shadow-editorial">
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
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full text-center py-4 text-xs font-formula text-charcoal-50">
        PHENOL • Dr. Omar Magdi Academic System © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
