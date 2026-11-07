'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser } from '@/types/auth';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import {
  Menu,
  X,
  LogIn,
  UserPlus,
  LogOut,
  Lock,
  Sparkles,
  BookOpen,
  HelpCircle,
  Network,
  Scale,
  Award,
  ChevronLeft,
} from 'lucide-react';

interface NavbarProps {
  currentUser: AuthUser | null;
  onOpenAuthModal: (mode: 'LOGIN' | 'REGISTER' | 'INSTRUCTOR_LOGIN') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'الفلسفة التعليمية', href: '#philosophy', icon: HelpCircle },
    { label: 'طريقة فاينمان', href: '#method', icon: Sparkles },
    { label: 'ما وراء الحفظ', href: '#comparison', icon: Scale },
    { label: 'مسارات التعلم', href: '#programs', icon: BookOpen },
    { label: 'عن د. عمر مجدي', href: '#about', icon: Award },
  ];

  const scrollTo = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isInstructor = currentUser?.role === 'INSTRUCTOR';

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'academic-glass shadow-editorial py-1'
          : 'bg-darkBg/80 backdrop-blur-md border-b border-borderSubtle/60 py-2'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Right: Brand */}
          <div className="flex items-center gap-6 lg:gap-8">
            <a
              href="#"
              className="text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-xl"
              aria-label="Phenol - Dr. Omar Magdi Home"
            >
              <PhenolLogo size={42} />
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="التنقل الرئيسي">
              {navLinks.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollTo(item.href)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-cardSecondary/80 transition-all duration-200"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Left: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!currentUser ? (
              <div className="flex items-center gap-2">
                {/* Waitlist quick button */}
                <button
                  onClick={() => scrollTo('#waitlist')}
                  className="hidden md:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cardSecondary border border-gold-500/30 text-gold-400 hover:text-gold-300 hover:border-gold-500/60 font-bold text-xs transition shadow-sm"
                >
                  <span>قائمة الانتظار</span>
                </button>

                {/* Login button */}
                <button
                  onClick={() => onOpenAuthModal('LOGIN')}
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-cardPrimary border border-borderSubtle transition min-h-[42px]"
                >
                  <span>تسجيل الدخول</span>
                </button>

                {/* Register button */}
                <button
                  onClick={() => onOpenAuthModal('REGISTER')}
                  className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-600 text-white font-bold text-xs shadow-burgundyGlow transition transform active:scale-95 min-h-[42px]"
                >
                  <span>انضم إلينا</span>
                </button>

                {/* Discrete Instructor Login */}
                <button
                  onClick={() => onOpenAuthModal('INSTRUCTOR_LOGIN')}
                  title="بوابة د. عمر مجدي"
                  aria-label="بوابة د. عمر مجدي"
                  className="p-2.5 rounded-xl text-textSecondary/50 hover:text-gold-500 hover:bg-cardPrimary transition min-h-[42px] min-w-[42px] flex items-center justify-center"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2.5 bg-cardPrimary border border-borderSubtle px-3 py-1.5 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-burgundy-800 border border-gold-500/40 flex items-center justify-center font-bold text-xs text-gold-400">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="block text-xs font-bold text-textPrimary leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-gold-500 font-medium">
                      {isInstructor ? 'The Chemistry Counselor' : 'طالب مسجل'}
                    </span>
                  </div>

                  <button
                    onClick={onLogout}
                    title="تسجيل الخروج"
                    aria-label="تسجيل الخروج"
                    className="p-1.5 text-textSecondary/60 hover:text-rose-400 rounded-lg transition mr-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2.5 text-textSecondary hover:text-textPrimary hover:bg-cardSecondary rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-gold-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Full-Featured Backdrop Drawer) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-borderSubtle bg-cardPrimary/98 backdrop-blur-xl px-4 py-5 space-y-2 animate-fadeIn shadow-2xl">
          <div className="space-y-1 pb-3 border-b border-borderSubtle/60">
            {navLinks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => scrollTo(item.href)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-textSecondary hover:text-textPrimary hover:bg-cardSecondary transition min-h-[48px]"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gold-500/70" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-borderSubtle" />
                </button>
              );
            })}
          </div>

          <div className="pt-3 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                scrollTo('#waitlist');
              }}
              className="w-full py-3 px-4 rounded-xl bg-cardSecondary border border-gold-500/30 text-gold-400 font-bold text-xs text-center min-h-[48px] flex items-center justify-center"
            >
              انضم لقائمة الانتظار (2026/2027)
            </button>

            {!currentUser && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal('LOGIN');
                  }}
                  className="py-3 px-4 rounded-xl bg-cardPrimary border border-borderSubtle text-textSecondary hover:text-textPrimary font-semibold text-xs text-center min-h-[48px] flex items-center justify-center"
                >
                  دخول طالب
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal('REGISTER');
                  }}
                  className="py-3 px-4 rounded-xl bg-burgundy-500 hover:bg-burgundy-600 text-white font-bold text-xs text-center shadow-burgundyGlow min-h-[48px] flex items-center justify-center"
                >
                  حساب جديد
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
