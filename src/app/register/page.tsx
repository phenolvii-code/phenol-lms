'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { AuthUser } from '@/types/auth';
import { Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [academicLevel, setAcademicLevel] = useState('المرحلة الثانوية');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (!fullName || !email || !password || !phone) {
      setErrorMessage('يرجى ملء كافة الحقول المطلوبة للتسجيل.');
      setIsLoading(false);
      return;
    }

    try {
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
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      const newStudent: AuthUser = {
        id: data?.user?.id || `std-${Date.now()}`,
        name: fullName,
        email: email,
        phone: phone,
        governorate: academicLevel,
        role: 'STUDENT',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        registeredAt: new Date().toISOString(),
      };

      localStorage.setItem('phenol_auth_user', JSON.stringify(newStudent));
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إنشاء الحساب.');
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
        <div className="w-full max-w-lg border border-hairline rounded bg-ivory-100 p-8 space-y-6 shadow-quiet">
          <div className="space-y-2.5 text-center">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
              STUDENT REGISTRATION
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display">
              إنشاء حساب طالب جديد
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
              سجل بياناتك للوصول إلى محاضرات وتكليفات منهج PHENOL بإشراف <strong className="text-charcoal-900 font-sans">د/عمر مجدي</strong>
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded bg-burgundy-50 border border-burgundy-200 text-burgundy-800 text-xs sm:text-sm font-medium font-sans">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1.5 font-sans">
                الاسم بالكامل
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="اسم الطالب ثلاثي"
                  className="w-full px-4 py-3 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors font-sans"
                />
                <User className="w-4 h-4 text-charcoal-50 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1 font-sans">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors text-right font-sans"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1 font-sans">
                  رقم الهاتف (واتساب)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors text-right font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1 font-sans">
                  المرحلة الدراسية
                </label>
                <select
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors font-sans"
                >
                  <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                  <option value="تمهيدي جامعي">تمهيدي جامعي</option>
                  <option value="طالب جامعي">طالب جامعي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1 font-sans">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors text-right font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet disabled:opacity-50 mt-2"
            >
              {isLoading ? 'جاري التسجيل...' : 'إنشاء الحساب ودخول المنصة'}
            </button>
          </form>

          <div className="pt-4 border-t border-hairline text-center text-xs sm:text-sm text-charcoal-100 font-sans">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-burgundy-500 font-semibold hover:underline">
              تسجيل الدخول
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
