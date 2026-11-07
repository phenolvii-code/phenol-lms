'use client';

import React, { useState } from 'react';
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

  const navLinks = [
    { label: 'الفلسفة التعليمية', href: '#philosophy' },
    { label: 'منهجية فاينمان', href: '#method' },
    { label: 'ما وراء الحفظ', href: '#comparison' },
    { label: 'مسارات التعلم', href: '#programs' },
    { label: 'عن د. عمر مجدي', href: '#about' },
  ];

  const scrollTo = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const isInstructor = currentUser?.role === 'INSTRUCTOR';

  return (
    <header className="sticky top-0 z-50 academic-glass border-b border-borderSubtle transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Right: Brand */}
          <div className="flex items-center gap-8">
            <a href="#" className="text-right focus:outline-none">
              <PhenolLogo size={44} />
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {navLinks.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollTo(item.href)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-textSecondary hover:text-textPrimary hover:bg-cardSecondary/60 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Left: Actions */}
          <div className="flex items-center gap-3">
            {!currentUser ? (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onOpenAuthModal('LOGIN')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-cardPrimary border border-borderSubtle transition"
                >
                  <span>تسجيل الدخول</span>
                </button>

                <button
                  onClick={() => onOpenAuthModal('REGISTER')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-600 text-white font-bold text-xs shadow-burgundyGlow transition transform hover:-translate-y-0.5"
                >
                  <span>انضم إلينا</span>
                </button>

                {/* Discrete Instructor Login */}
                <button
                  onClick={() => onOpenAuthModal('INSTRUCTOR_LOGIN')}
                  title="بوابة د. عمر مجدي"
                  className="p-2 rounded-xl text-textSecondary/50 hover:text-gold-500 hover:bg-cardPrimary transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 bg-cardPrimary border border-borderSubtle px-3 py-1.5 rounded-2xl">
                  <div className="w-7 h-7 rounded-full bg-burgundy-800 border border-gold-500/30 flex items-center justify-center font-bold text-xs text-gold-400">
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
                    className="p-1 text-textSecondary/60 hover:text-rose-400 rounded-lg transition mr-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-textSecondary hover:text-textPrimary rounded-xl transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-borderSubtle bg-cardPrimary/95 px-4 py-4 space-y-2 animate-fadeIn">
          {navLinks.map((item, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(item.href)}
              className="w-full text-right px-4 py-2.5 rounded-xl text-sm font-medium text-textSecondary hover:text-textPrimary hover:bg-cardSecondary"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
