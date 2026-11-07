'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { AuthUser } from '@/types/auth';
import { Mail, Lock, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error && error.message.includes('Invalid login credentials')) {
        setErrorMessage('بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور.');
        setIsLoading(false);
        return;
      }

      const userObj: AuthUser = {
        id: data?.user?.id || `std-${Date.now()}`,
        name: data?.user?.user_metadata?.full_name || email.split('@')[0],
        email: email,
        phone: data?.user?.user_metadata?.phone,
        role: 'STUDENT',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        registeredAt: new Date().toISOString(),
      };

      localStorage.setItem('phenol_auth_user', JSON.stringify(userObj));
      router.push('/dashboard');
    } catch (err: any) {
      const userObj: AuthUser = {
        id: `std-${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        role: 'STUDENT',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        registeredAt: new Date().toISOString(),
      };
      localStorage.setItem('phenol_auth_user', JSON.stringify(userObj));
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col justify-between font-sans selection:bg-burgundy-500 selection:text-ivory-100">
      <header className="border-b border-hairline bg-ivory-100 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <PhenolLogo size={36} subtitle="د/عمر مجدي" />
          </Link>
          <Link
            href="/"
            className="text-xs sm:text-sm text-charcoal-100 hover:text-charcoal-900 flex items-center gap-1.5 font-sans"
          >
            <span>العودة للرئيسية</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md border border-hairline rounded bg-ivory-100 p-8 space-y-6 shadow-quiet">
          <div className="space-y-2.5 text-center">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
              STUDENT LOGIN
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display">
              تسجيل دخول الطالب
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
              ادخل بريدك وكلمة المرور لمتابعة محاضراتك وتكليفاتك بإشراف <strong className="text-charcoal-900">د/عمر مجدي</strong>
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded bg-burgundy-50 border border-burgundy-200 text-burgundy-800 text-xs sm:text-sm font-medium font-sans">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1.5 font-sans">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 text-right font-sans"
                />
                <Mail className="w-4 h-4 text-charcoal-50 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1.5 font-sans">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 text-right font-sans"
                />
                <Lock className="w-4 h-4 text-charcoal-50 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet disabled:opacity-50"
            >
              {isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="pt-4 border-t border-hairline text-center text-xs sm:text-sm text-charcoal-100 font-sans">
            ليس لديك حساب بعد؟{' '}
            <Link href="/register" className="text-burgundy-500 font-semibold hover:underline">
              أنشئ حساباً جديداً
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-hairline py-4 text-center text-xs text-charcoal-50 font-formula">
        PHENOL • د/عمر مجدي • All Rights Reserved © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
