'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AuthUser } from '@/types/auth';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { setUserPassword } from '@/lib/auth-passwords';
import { Lock, Mail, User, Phone, ShieldAlert, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [academicLevel, setAcademicLevel] = useState('High School Senior');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (!fullName || !email || !password || !phone) {
      setErrorMessage('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    try {
      setUserPassword(email, password);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            academic_level: academicLevel,
          },
        },
      });

      if (error) {
        const newStudent: AuthUser = {
          id: `stu-${Date.now()}`,
          name: fullName,
          email: email,
          phone: phone,
          role: 'STUDENT',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          registeredAt: new Date().toISOString(),
        };
        localStorage.setItem('phenol_auth_user', JSON.stringify(newStudent));
        router.push('/dashboard');
        return;
      }

      if (data?.user) {
        const newStudent: AuthUser = {
          id: data.user.id,
          name: fullName,
          email: email,
          phone: phone,
          role: 'STUDENT',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          registeredAt: data.user.created_at,
        };
        localStorage.setItem('phenol_auth_user', JSON.stringify(newStudent));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
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

      <main className="max-w-md w-full mx-auto my-auto">
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
              <label className="block text-xs font-semibold text-charcoal-900 mb-1 font-sans">
                WhatsApp Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 10xxxxxxxx"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
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
                <option value="High School Senior">High School Senior (Thanaweya Amma / STEM / IGCSE)</option>
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
              className="w-full py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-sm font-semibold transition-colors shadow-quiet mt-2"
            >
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>

          <div className="pt-4 border-t border-hairline text-center text-xs text-charcoal-100 font-sans">
            Already have an account?{' '}
            <Link href="/login" className="text-burgundy-500 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-charcoal-50 font-sans">
        All Rights Reserved © {new Date().getFullYear()} • PHENOL Academic Chemistry Platform
      </footer>
    </div>
  );
}
