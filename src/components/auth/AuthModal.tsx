'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AuthUser, AuthModalMode, ADMIN_EMAILS } from '@/types/auth';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { verifyUserPassword, setUserPassword } from '@/lib/auth-passwords';
import { getStudentAcademicCode } from '@/lib/student-code';
import { GoogleIcon, WhatsAppIcon } from '@/components/auth/AuthIcons';
import { WhatsAppPromptModal } from '@/components/auth/WhatsAppPromptModal';
import { GoogleAccountModal } from '@/components/auth/GoogleAccountModal';
import { GOOGLE_CLIENT_ID, parseGoogleJwt } from '@/lib/google-auth';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  ShieldAlert,
} from 'lucide-react';

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
  const [mode, setMode] = useState<AuthModalMode>(
    initialMode === 'INSTRUCTOR_LOGIN' ? 'LOGIN' : initialMode
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [academicLevel, setAcademicLevel] = useState('High School Senior');

  // Modals state
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode === 'INSTRUCTOR_LOGIN' ? 'LOGIN' : initialMode);
      setErrorMessage(null);
      setPendingGoogleUser(null);
      setShowGoogleChooser(false);
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  // Unified Sign In Handler
  const handleUnifiedLogin = async (e: React.FormEvent) => {
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
      // 1. Supabase credentials check
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        const userPhone = data.user.user_metadata?.phone || data.user.user_metadata?.whatsapp;
        const userObj: AuthUser = {
          id: data.user.id,
          name: isAdmin ? 'Dr. Omar Magdi' : (data.user.user_metadata?.full_name || cleanEmail.split('@')[0]),
          email: data.user.email || cleanEmail,
          phone: userPhone,
          role: isAdmin ? 'INSTRUCTOR' : 'STUDENT',
          avatar: isAdmin
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
            : (data.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'),
          registeredAt: data.user.created_at,
          title: isAdmin ? 'Academic Director & Senior Fellow' : undefined,
          specialization: isAdmin ? 'Organic Reaction Mechanisms & Physical Chemistry' : undefined,
        };

        if (!isAdmin && (!userPhone || userPhone.trim().length < 6)) {
          setPendingGoogleUser(userObj);
          return;
        }

        localStorage.setItem('phenol_auth_user', JSON.stringify(userObj));
        onLoginSuccess(userObj);
        onClose();
        router.push('/dashboard');
        return;
      }

      // 2. Verified fallback credentials
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
        onLoginSuccess(userObj);
        onClose();
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

  // Google Auth Trigger -> Initiates real Google OAuth flow
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard?auth=google`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication failed');
      setIsLoading(false);
    }
  };

  // Google Account Selected -> Immediately requires WhatsApp number for students
  const handleGoogleAccountSelected = (account: { email: string; name: string; avatar?: string }) => {
    setShowGoogleChooser(false);

    const cleanEmail = account.email.trim().toLowerCase();
    const isAdmin =
      cleanEmail === 'phenolvii@gmail.com' ||
      cleanEmail.includes('phenolvii') ||
      ADMIN_EMAILS.includes(cleanEmail);

    const googleUser: AuthUser = {
      id: isAdmin ? 'dr-omar-magdi' : `g-${Date.now()}`,
      name: isAdmin ? 'Dr. Omar Magdi' : account.name,
      email: cleanEmail,
      role: isAdmin ? 'INSTRUCTOR' : 'STUDENT',
      avatar:
        account.avatar ||
        (isAdmin
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'),
      registeredAt: new Date().toISOString(),
      title: isAdmin ? 'Academic Director & Senior Fellow' : undefined,
    };

    if (isAdmin) {
      localStorage.setItem('phenol_auth_user', JSON.stringify(googleUser));
      onLoginSuccess(googleUser);
      onClose();
      router.push('/dashboard');
      return;
    }

    // REQUIRE WHATSAPP NUMBER IMMEDIATELY!
    setPendingGoogleUser(googleUser);
  };

  // Normal Email Registration Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!fullName || !cleanEmail || !password || !phone) {
      setErrorMessage('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      setUserPassword(cleanEmail, password);

      const academicCode = getStudentAcademicCode({
        id: `stu-${Date.now()}`,
        name: fullName,
        email: cleanEmail,
        role: 'STUDENT',
        avatar: '',
        registeredAt: '',
      });

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            academic_level: academicLevel,
            academic_code: academicCode,
          },
        },
      });

      const newStudent: AuthUser = {
        id: data?.user?.id || `stu-${Date.now()}`,
        name: fullName,
        email: cleanEmail,
        phone: phone,
        role: 'STUDENT',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        registeredAt: new Date().toISOString(),
        academicCode,
      };

      localStorage.setItem('phenol_auth_user', JSON.stringify(newStudent));
      onLoginSuccess(newStudent);
      onClose();
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 1. WHATSAPP STEP (Brought up immediately after Google Sign-Up/In if no phone) */}
      {pendingGoogleUser && (
        <WhatsAppPromptModal
          isOpen={true}
          user={pendingGoogleUser}
          onSuccess={(completedUser) => {
            setPendingGoogleUser(null);
            onLoginSuccess(completedUser);
            onClose();
            router.push('/dashboard');
          }}
        />
      )}

      {/* 2. Authentic Google Account Chooser Dialog */}
      <GoogleAccountModal
        isOpen={showGoogleChooser}
        onClose={() => setShowGoogleChooser(false)}
        onSelectAccount={handleGoogleAccountSelected}
      />

      {/* 3. MAIN AUTH MODAL (Sign In & Register) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in font-sans">
        <div className="relative w-full max-w-md bg-ivory-100 rounded-lg border border-hairline shadow-editorial overflow-hidden">
          {/* Top Header */}
          <div className="flex items-center justify-between p-6 border-b border-hairline bg-ivory-200">
            <div className="flex items-center gap-3">
              <PhenolLogo size={32} withText={false} />
              <div>
                <span className="font-editorial text-xs font-bold uppercase tracking-wider text-charcoal-900 block">
                  PHENOL ACADEMY
                </span>
                <span className="text-xs text-charcoal-100 font-sans">
                  {mode === 'LOGIN' ? 'Sign In to Your Account' : 'Scholar Cohort Registration'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-charcoal-50 hover:text-charcoal-900 rounded hover:bg-ivory-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-burgundy-50 border border-burgundy-200 text-burgundy-900 rounded text-xs flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-burgundy-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-ivory-300 rounded mb-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode('LOGIN');
                }}
                className={`py-2 rounded transition-colors ${
                  mode === 'LOGIN'
                    ? 'bg-ivory-100 text-charcoal-900 shadow-quiet'
                    : 'text-charcoal-50 hover:text-charcoal-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode('REGISTER');
                }}
                className={`py-2 rounded transition-colors ${
                  mode === 'REGISTER'
                    ? 'bg-ivory-100 text-charcoal-900 shadow-quiet'
                    : 'text-charcoal-50 hover:text-charcoal-900'
                }`}
              >
                Register
              </button>
            </div>

            {/* A. GOOGLE ONE-CLICK AUTH BUTTON */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-ivory-50 active:scale-[0.99] border border-hairline rounded font-semibold text-charcoal-900 text-sm shadow-quiet transition-all hover:border-charcoal-200"
              >
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span>
                  {mode === 'LOGIN' ? 'Sign In with Google' : 'Sign Up with Google'}
                </span>
              </button>

              {/* Minimal Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-hairline" />
                </div>
                <div className="relative bg-ivory-100 px-3 text-[11px] uppercase tracking-wider text-charcoal-50 font-formula">
                  Or with email
                </div>
              </div>
            </div>

            {/* B. Unified Sign In Form */}
            {mode === 'LOGIN' && (
              <form onSubmit={handleUnifiedLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 mb-1.5 font-sans">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-charcoal-50 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 mb-1.5 font-sans">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-charcoal-50 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-sm font-semibold transition-colors shadow-quiet mt-2"
                >
                  {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
                </button>
              </form>
            )}

            {/* C. Registration Form */}
            {mode === 'REGISTER' && (
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
                      className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 mb-1 font-sans flex items-center gap-1.5">
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-600" />
                    <span>WhatsApp Contact (مطلوب)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-charcoal-50 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+20 10xxxxxxxx"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-emerald-500"
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
                      className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
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
                    className="w-full px-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
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
                      className="w-full pl-9 pr-3 py-2 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-sm font-semibold transition-colors shadow-quiet mt-2"
                >
                  {isLoading ? 'Registering...' : 'Create Student Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
