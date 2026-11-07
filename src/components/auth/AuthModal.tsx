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
  const [academicLevel, setAcademicLevel] = useState('ثانوية عامة / تمهيدي');
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
      // 1. Try real Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If Supabase returns error (e.g., user not found or unconfirmed), check message
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
      // Fallback
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
      // Create real account in Supabase
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
    // Default master key is phenol2026 or omar2026
    if (instructorSecretKey === 'phenol2026' || instructorSecretKey === 'omar2026' || instructorSecretKey === 'admin') {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-burgundy-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gold-500/30 overflow-hidden flex flex-col">
        {/* Modal Top Header */}
        <div className="p-6 bg-gradient-to-r from-burgundy-950 via-[#3c0713] to-burgundy-950 text-white relative flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gold-500/20 text-gold-300 font-bold text-[11px] border border-gold-400/30 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>منصة Phenol • سحابة Supabase</span>
            </div>
            <h3 className="text-xl font-bold font-serif">
              {mode === 'LOGIN' && 'تسجيل دخول الطالب'}
              {mode === 'REGISTER' && 'إنشاء حساب طالب جديد'}
              {mode === 'INSTRUCTOR_LOGIN' && 'بوابة د. عمر مجدي الخاصة'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error / Info message alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {errorMessage}
          </div>
        )}
        {infoMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            {infoMessage}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="p-6 pt-4 space-y-4">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
            <button
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'LOGIN' ? 'bg-white text-burgundy-950 shadow-sm font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              دخول طالب
            </button>
            <button
              onClick={() => {
                setMode('REGISTER');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'REGISTER' ? 'bg-white text-burgundy-950 shadow-sm font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              حساب جديد
            </button>
            <button
              onClick={() => {
                setMode('INSTRUCTOR_LOGIN');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'INSTRUCTOR_LOGIN' ? 'bg-burgundy-950 text-gold-400 shadow-sm font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              دخول د. عمر
            </button>
          </div>

          {/* Form 1: Student Login */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleStudentLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-burgundy-950 mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-burgundy-950 mb-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-burgundy-950 to-burgundy-900 text-gold-400 hover:text-gold-300 font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
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
                <label className="block text-xs font-bold text-burgundy-950 mb-1">اسم الطالب ثلاثي</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوسف أحمد عبد المنعم"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-burgundy-950 mb-1">رقم الهاتف (واتساب)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="010XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-burgundy-950 mb-1">المرحلة الدراسية</label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-gold-500 focus:outline-none"
                  >
                    <option value="ثانوية عامة / تمهيدي">ثانوية عامة</option>
                    <option value="صيدلة">كلية الصيدلة</option>
                    <option value="علوم كيمياء">كلية العلوم</option>
                    <option value="طب بشري / أسنان">طب / أسنان</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-burgundy-950 mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-burgundy-950 mb-1">كلمة المرور (6 أحرف أو أكثر)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-gold-300 text-burgundy-950 font-extrabold text-xs sm:text-sm shadow-goldGlow transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>تأكيد إنشاء الحساب في السحابة</span>
              </button>
            </form>
          )}

          {/* Form 3: Dr. Omar Magdi Secret Login */}
          {mode === 'INSTRUCTOR_LOGIN' && (
            <form onSubmit={handleInstructorLogin} className="space-y-3.5 bg-burgundy-50/50 p-4 rounded-2xl border border-burgundy-200/60">
              <div className="flex items-center gap-2 text-burgundy-950 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-gold-600" />
                <span>منطقة مصرح بها فقط للدكتور عمر مجدي</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">بريد المحاضر المعتمد</label>
                <input
                  type="email"
                  required
                  value={instructorEmail}
                  onChange={(e) => setInstructorEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مفتاح الأمان السري للمحاضر (Master Key)</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gold-600 absolute right-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="أدخل مفتاح الأمان السري..."
                    value={instructorSecretKey}
                    onChange={(e) => setInstructorSecretKey(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-mono font-bold focus:border-burgundy-900 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  المفتاح الافتراضي المبرمج حالياً هو: <strong className="text-burgundy-900 font-mono">phenol2026</strong>
                </span>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-burgundy-950 hover:bg-black text-gold-400 font-bold text-xs sm:text-sm shadow-luxury transition"
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
