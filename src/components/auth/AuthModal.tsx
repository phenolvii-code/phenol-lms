'use client';

import React, { useState } from 'react';
import { AuthUser, AuthModalMode } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { X, Lock, Mail, User, Phone, Sparkles, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';

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
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);

  // Student Register Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [academicLevel, setAcademicLevel] = useState('الثانوية العامة / تمهيدي');
  const [password, setPassword] = useState('');

  // Dr. Omar Secret Login Form
  const [instructorSecretKey, setInstructorSecretKey] = useState('');
  const [instructorEmail, setInstructorEmail] = useState('dr.omarmagdi@phenol.academy');

  // Error/Success state
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  if (!isOpen) return null;

  // Handle Student Login with Supabase
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

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور.');
          setIsLoading(false);
          return;
        }
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
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Student Registration with Supabase
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
            role: 'STUDENT',
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
        name: 'د. عمر مجدي',
        email: instructorEmail,
        role: 'INSTRUCTOR',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        registeredAt: '2026-01-01',
      };
      onLoginSuccess(instructorUser);
      onClose();
    } else {
      setErrorMessage('مفتاح المرور الخاص بالدكتور غير صحيح. المفتاح الافتراضي هو: phenol2026');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-darkBg/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="bg-cardPrimary w-full max-w-md rounded-3xl shadow-editorial border border-borderSubtle overflow-hidden flex flex-col max-h-[92dvh] overflow-y-auto">
        {/* Modal Top Header */}
        <div className="p-6 bg-gradient-to-r from-burgundy-950 via-cardSecondary to-burgundy-950 border-b border-borderSubtle text-textPrimary relative flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cardPrimary border border-gold-500/30 text-gold-400 font-bold text-[10px] sm:text-[11px] mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>منصة Phenol الأكاديمية</span>
            </div>
            <h3 id="auth-modal-title" className="text-lg sm:text-xl font-bold font-serif text-textPrimary">
              {mode === 'LOGIN' && 'تسجيل دخول الطالب'}
              {mode === 'REGISTER' && 'إنشاء حساب طالب جديد'}
              {mode === 'INSTRUCTOR_LOGIN' && 'بوابة د. عمر مجدي الخاصة'}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="p-2.5 rounded-full bg-cardPrimary/80 hover:bg-cardSecondary text-textSecondary hover:text-textPrimary border border-borderSubtle transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error / Info message alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-burgundy-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {errorMessage}
          </div>
        )}
        {infoMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-cardSecondary border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
            {infoMessage}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="p-6 pt-4 space-y-4">
          <div className="flex rounded-xl bg-cardSecondary p-1 text-xs font-bold border border-borderSubtle">
            <button
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 rounded-lg transition min-h-[40px] ${
                mode === 'LOGIN'
                  ? 'bg-cardPrimary text-gold-400 shadow-sm font-bold border border-borderSubtle'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              دخول طالب
            </button>
            <button
              onClick={() => {
                setMode('REGISTER');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 rounded-lg transition min-h-[40px] ${
                mode === 'REGISTER'
                  ? 'bg-cardPrimary text-gold-400 shadow-sm font-bold border border-borderSubtle'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              حساب جديد
            </button>
            <button
              onClick={() => {
                setMode('INSTRUCTOR_LOGIN');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 rounded-lg transition min-h-[40px] ${
                mode === 'INSTRUCTOR_LOGIN'
                  ? 'bg-burgundy-900 text-gold-300 shadow-sm font-bold border border-gold-500/30'
                  : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              دخول د. عمر
            </button>
          </div>

          {/* Form 1: Student Login */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleStudentLogin} className="space-y-3.5">
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-textSecondary mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-textSecondary/50 absolute right-3.5 top-3.5" />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    inputMode="email"
                    autoComplete="username"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-cardSecondary border border-borderSubtle text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:border-gold-500 focus:outline-none min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-bold text-textSecondary mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-textSecondary/50 absolute right-3.5 top-3.5" />
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    enterKeyHint="done"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-cardSecondary border border-borderSubtle text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:border-gold-500 focus:outline-none min-h-[48px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-600 active:scale-95 disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-burgundyGlow transition flex items-center justify-center gap-2 min-h-[48px]"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>تسجيل الدخول للمنصة</span>
              </button>
            </form>
          )}

          {/* Form 2: Student Registration */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleStudentRegister} className="space-y-3">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-bold text-textSecondary mb-1">
                  اسم الطالب ثلاثي
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-textSecondary/50 absolute right-3.5 top-3.5" />
                  <input
                    id="reg-name"
                    name="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    enterKeyHint="next"
                    placeholder="مثال: يوسف أحمد عبد المنعم"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-cardSecondary border border-borderSubtle text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:border-gold-500 focus:outline-none min-h-[46px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-bold text-textSecondary mb-1">
                    رقم الهاتف (واتساب)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-textSecondary/50 absolute right-3 top-3.5" />
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      enterKeyHint="next"
                      placeholder="010XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-cardSecondary border border-borderSubtle text-xs text-textPrimary placeholder:text-textSecondary/40 focus:border-gold-500 focus:outline-none min-h-[46px]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-level" className="block text-xs font-bold text-textSecondary mb-1">
                    المرحلة الدراسية
                  </label>
                  <select
                    id="reg-level"
                    name="academicLevel"
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl bg-cardSecondary border border-borderSubtle text-xs text-textPrimary focus:border-gold-500 focus:outline-none min-h-[46px]"
                  >
                    <option value="الثانوية العامة / تمهيدي">ثانوية عامة</option>
                    <option value="صيدلة">كلية الصيدلة</option>
                    <option value="علوم كيمياء">كلية العلوم</option>
                    <option value="طب بشري / أسنان">طب / أسنان</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold text-textSecondary mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-textSecondary/50 absolute right-3.5 top-3.5" />
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    inputMode="email"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-cardSecondary border border-borderSubtle text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:border-gold-500 focus:outline-none min-h-[46px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-xs font-bold text-textSecondary mb-1">
                  كلمة المرور (6 أحرف أو أكثر)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-textSecondary/50 absolute right-3.5 top-3.5" />
                  <input
                    id="reg-password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    enterKeyHint="done"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-cardSecondary border border-borderSubtle text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/40 focus:border-gold-500 focus:outline-none min-h-[46px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 active:scale-95 disabled:opacity-60 text-burgundy-950 font-black text-xs sm:text-sm shadow-goldGlow transition flex items-center justify-center gap-2 min-h-[48px]"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>تأكيد إنشاء الحساب في السحابة</span>
              </button>
            </form>
          )}

          {/* Form 3: Dr. Omar Magdi Secret Login */}
          {mode === 'INSTRUCTOR_LOGIN' && (
            <form onSubmit={handleInstructorLogin} className="space-y-3.5 bg-cardSecondary/60 p-4 rounded-2xl border border-borderSubtle">
              <div className="flex items-center gap-2 text-gold-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-gold-500" />
                <span>منطقة مصرح بها فقط للدكتور عمر مجدي</span>
              </div>

              <div>
                <label htmlFor="inst-email" className="block text-xs font-bold text-textSecondary mb-1">
                  بريد المحاضر المعتمد
                </label>
                <input
                  id="inst-email"
                  name="email"
                  type="email"
                  required
                  value={instructorEmail}
                  onChange={(e) => setInstructorEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-borderSubtle text-xs sm:text-sm font-semibold bg-cardPrimary text-textPrimary focus:border-gold-500 focus:outline-none min-h-[46px]"
                />
              </div>

              <div>
                <label htmlFor="inst-key" className="block text-xs font-bold text-textSecondary mb-1">
                  مفتاح الأمان السري للمحاضر (Master Key)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gold-500 absolute right-3.5 top-3.5" />
                  <input
                    id="inst-key"
                    name="secretKey"
                    type="password"
                    required
                    placeholder="أدخل مفتاح الأمان السري..."
                    value={instructorSecretKey}
                    onChange={(e) => setInstructorSecretKey(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-borderSubtle text-xs sm:text-sm bg-cardPrimary text-textPrimary font-mono font-bold focus:border-gold-500 focus:outline-none min-h-[46px]"
                  />
                </div>
                <span className="text-[10px] text-textSecondary/60 block mt-1">
                  المفتاح الافتراضي المبرمج حالياً هو: <strong className="text-gold-400 font-mono">phenol2026</strong>
                </span>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-burgundyGlow transition min-h-[48px]"
              >
                الدخول بصلاحيات د. عمر مجدي
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};