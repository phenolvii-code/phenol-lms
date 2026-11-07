'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser, AuthModalMode } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { X, Lock, Mail, User, Phone } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthModalMode;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'LOGIN',
  onClose,
  onLoginSuccess,
}) => {
  const router = useRouter();
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);

  // Student Register Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [academicLevel, setAcademicLevel] = useState('المرحلة الثانوية');
  const [password, setPassword] = useState('');

  // Dr. Omar Secret Login Form
  const [instructorSecretKey, setInstructorSecretKey] = useState('');
  const [instructorEmail, setInstructorEmail] = useState('dr.omarmagdi@phenol.academy');

  // Error/Success state
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  if (!isOpen) return null;

  // Handle Student Login
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    setIsLoading(true);

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

      onLoginSuccess(userObj);
      onClose();
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
      onLoginSuccess(userObj);
      onClose();
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Student Registration
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!fullName || !email || !password || !phone) {
      setErrorMessage('يرجى ملء جميع الحقول المطلوبة للتسجيل.');
      return;
    }

    setIsLoading(true);

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

      onLoginSuccess(newStudent);
      onClose();
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إنشاء الحساب.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Dr. Omar Magdi Secret Login
  const handleInstructorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      instructorSecretKey === 'phenol2026' ||
      instructorSecretKey === 'omar2026' ||
      instructorSecretKey === 'admin'
    ) {
      const instructorUser: AuthUser = {
        id: 'dr-omar-magdi',
        name: 'د/عمر مجدي',
        email: instructorEmail,
        role: 'INSTRUCTOR',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        registeredAt: '2026-01-01',
      };
      onLoginSuccess(instructorUser);
      onClose();
      router.push('/dashboard');
    } else {
      setErrorMessage('مفتاح المرور الخاص بالدكتور غير صحيح. المفتاح الافتراضي هو: phenol2026');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/40 backdrop-blur-sm"
    >
      <div className="bg-ivory-100 w-full max-w-md rounded border border-hairline shadow-lift overflow-hidden flex flex-col max-h-[92dvh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-5 bg-ivory-300 border-b border-hairline flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-hairline bg-ivory-100 text-xs text-burgundy-500 font-bold mb-1.5 font-sans">
              <span className="font-editorial uppercase tracking-wider">PHENOL</span>
              <span>•</span>
              <span>د/عمر مجدي</span>
            </div>
            <h3 id="auth-modal-title" className="text-base sm:text-lg font-bold font-display text-charcoal-900">
              {mode === 'LOGIN' && 'تسجيل دخول الطالب'}
              {mode === 'REGISTER' && 'إنشاء حساب طالب جديد'}
              {mode === 'INSTRUCTOR_LOGIN' && 'بوابة د/عمر مجدي الخاصة'}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="p-2 rounded text-charcoal-50 hover:text-charcoal-900 hover:bg-ivory-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded bg-burgundy-50 border border-burgundy-200 text-burgundy-800 text-xs sm:text-sm font-medium font-sans">
            {errorMessage}
          </div>
        )}
        {infoMessage && (
          <div className="mx-5 mt-4 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium font-sans">
            {infoMessage}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="p-5 pt-4 space-y-4">
          <div className="grid grid-cols-3 rounded bg-ivory-300 p-1 text-xs sm:text-sm border border-hairline font-sans">
            <button
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage('');
              }}
              className={`py-2.5 rounded transition-colors text-center font-medium ${
                mode === 'LOGIN'
                  ? 'bg-ivory-100 text-charcoal-900 font-bold shadow-quiet'
                  : 'text-charcoal-100 hover:text-charcoal-900'
              }`}
            >
              دخول طالب
            </button>
            <button
              onClick={() => {
                setMode('REGISTER');
                setErrorMessage('');
              }}
              className={`py-2.5 rounded transition-colors text-center font-medium ${
                mode === 'REGISTER'
                  ? 'bg-ivory-100 text-charcoal-900 font-bold shadow-quiet'
                  : 'text-charcoal-100 hover:text-charcoal-900'
              }`}
            >
              حساب جديد
            </button>
            <button
              onClick={() => {
                setMode('INSTRUCTOR_LOGIN');
                setErrorMessage('');
              }}
              className={`py-2.5 rounded transition-colors text-center font-medium ${
                mode === 'INSTRUCTOR_LOGIN'
                  ? 'bg-ivory-100 text-burgundy-500 font-bold shadow-quiet'
                  : 'text-charcoal-100 hover:text-charcoal-900'
              }`}
            >
              بوابة الدكتور
            </button>
          </div>

          {/* Form 1: Student Login */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
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
                    className="w-full px-4 py-3 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors text-right font-sans"
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
                    className="w-full px-4 py-3 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors text-right font-sans"
                  />
                  <Lock className="w-4 h-4 text-charcoal-50 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet disabled:opacity-50 mt-2"
              >
                {isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}
              </button>
            </form>
          )}

          {/* Form 2: Student Register */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleStudentRegister} className="space-y-3.5">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full px-3.5 py-2.5 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors text-right font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1 font-sans">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors text-right font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1 font-sans">
                    المرحلة الدراسية
                  </label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors font-sans"
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
                    className="w-full px-3.5 py-2.5 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors text-right font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet disabled:opacity-50 mt-2"
              >
                {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
              </button>
            </form>
          )}

          {/* Form 3: Instructor Secret Key Login */}
          {mode === 'INSTRUCTOR_LOGIN' && (
            <form onSubmit={handleInstructorLogin} className="space-y-4">
              <div className="p-3.5 rounded bg-ivory-300 border border-hairline text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
                هذه البوابة مخصصة لـ <strong className="text-charcoal-900">د/عمر مجدي</strong> لإدارة وتصحيح التكليفات الأكاديمية.
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1.5 font-sans">
                  مفتاح المرور الأكاديمي الخاص
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={instructorSecretKey}
                    onChange={(e) => setInstructorSecretKey(e.target.value)}
                    placeholder="أدخل مفتاح المرور"
                    className="w-full px-4 py-3 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors font-sans"
                  />
                  <Lock className="w-4 h-4 text-charcoal-50 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet mt-2"
              >
                الدخول كـ د/عمر مجدي
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
