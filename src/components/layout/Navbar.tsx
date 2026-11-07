'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthUser } from '@/types/auth';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import {
  Menu,
  X,
  Lock,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  currentUser: AuthUser | null;
  onOpenAuthModal?: (mode: 'LOGIN' | 'REGISTER' | 'INSTRUCTOR_LOGIN') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'الفلسفة التعليمية', href: '/#philosophy' },
    { label: 'طريقة فاينمان', href: '/#method' },
    { label: 'ما وراء الحفظ', href: '/#comparison' },
    { label: 'مسارات التعلم', href: '/#programs' },
    { label: 'عن د/عمر مجدي', href: '/#about' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (pathname === '/' && href.startsWith('/#')) {
      const targetId = href.replace('/', '');
      const element = document.querySelector(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
  };

  const isInstructor = currentUser?.role === 'INSTRUCTOR';

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 border-b ${
        scrolled
          ? 'bg-ivory-200/98 backdrop-blur-md border-hairline shadow-quiet'
          : 'bg-ivory-200 border-hairline'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Identity */}
          <div className="flex items-center gap-6 lg:gap-10 shrink-0">
            <Link
              href="/"
              className="text-right focus:outline-none focus-visible:ring-1 focus-visible:ring-burgundy-500 rounded py-1"
              aria-label="PHENOL - د/عمر مجدي"
            >
              <PhenolLogo size={36} subtitle="د/عمر مجدي" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8" aria-label="التنقل الرئيسي">
              {navLinks.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="text-sm font-medium text-charcoal-100 hover:text-charcoal-900 transition-colors py-1 leading-normal"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Left Actions */}
          <div className="flex items-center gap-3">
            {!currentUser ? (
              <>
                {/* Desktop Actions */}
                <div className="hidden lg:flex items-center gap-3">
                  <a
                    href="/#admission"
                    onClick={() => handleNavClick('/#admission')}
                    className="px-3 py-1.5 text-xs font-semibold text-burgundy-500 hover:text-burgundy-800 border border-burgundy-500/25 hover:border-burgundy-500/50 rounded transition-colors"
                  >
                    قائمة الانتظار
                  </a>

                  <button
                    onClick={() => onOpenAuthModal ? onOpenAuthModal('LOGIN') : null}
                    className="px-3.5 py-2 text-sm font-medium text-charcoal-100 hover:text-charcoal-900 transition-colors"
                  >
                    تسجيل الدخول
                  </button>

                  <button
                    onClick={() => onOpenAuthModal ? onOpenAuthModal('REGISTER') : null}
                    className="px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 font-sans text-xs sm:text-sm font-semibold tracking-wide transition-colors shadow-quiet"
                  >
                    انضم إلينا
                  </button>

                  <button
                    onClick={() => onOpenAuthModal ? onOpenAuthModal('INSTRUCTOR_LOGIN') : null}
                    title="بوابة د/عمر مجدي"
                    aria-label="بوابة د/عمر مجدي"
                    className="p-2 text-charcoal-50 hover:text-burgundy-500 rounded transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Single CTA */}
                <button
                  onClick={() => onOpenAuthModal ? onOpenAuthModal('REGISTER') : null}
                  className="lg:hidden px-3.5 py-1.5 rounded bg-burgundy-500 text-ivory-100 font-sans text-xs font-semibold transition-colors"
                >
                  انضم إلينا
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded border border-hairline hover:border-charcoal-100 bg-ivory-100 text-charcoal-900 text-xs sm:text-sm font-medium transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-burgundy-500" />
                  <span className="hidden sm:inline">لوحة الطالب</span>
                  <span className="sm:hidden">{currentUser.name.split(' ')[0]}</span>
                </Link>

                <div className="hidden md:flex flex-col text-right leading-normal pr-2 border-r border-hairline">
                  <span className="text-xs sm:text-sm font-bold text-charcoal-900">
                    {currentUser.name}
                  </span>
                  <span className="text-xs text-charcoal-100 font-sans">
                    {isInstructor ? 'د/عمر مجدي' : 'طالب مسجل'}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="تسجيل الخروج"
                  aria-label="تسجيل الخروج"
                  className="p-2 text-charcoal-50 hover:text-burgundy-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 text-charcoal-900 hover:bg-ivory-300 rounded transition-colors border border-hairline"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-burgundy-500" />
              ) : (
                <Menu className="w-4 h-4 text-charcoal-900" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-hairline bg-ivory-100 px-4 py-5 space-y-4 shadow-editorial">
          <div className="space-y-1 pb-3 border-b border-hairline">
            {navLinks.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-300 transition-colors leading-normal"
              >
                <span>{item.label}</span>
                <ChevronLeft className="w-4 h-4 text-charcoal-50" />
              </Link>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            {!currentUser ? (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenAuthModal) onOpenAuthModal('LOGIN');
                  }}
                  className="py-2.5 px-3 rounded border border-hairline text-charcoal-900 font-semibold text-xs sm:text-sm text-center hover:bg-ivory-300 transition-colors"
                >
                  تسجيل الدخول
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenAuthModal) onOpenAuthModal('REGISTER');
                  }}
                  className="py-2.5 px-3 rounded bg-burgundy-500 text-ivory-100 font-semibold text-xs sm:text-sm text-center hover:bg-burgundy-800 transition-colors"
                >
                  انضم إلينا
                </button>
              </div>
            ) : (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-3 rounded bg-burgundy-500 text-ivory-100 font-semibold text-xs sm:text-sm text-center flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>الدخول إلى لوحة الطالب</span>
              </Link>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenAuthModal) onOpenAuthModal('INSTRUCTOR_LOGIN');
              }}
              className="w-full py-2 px-3 text-center text-charcoal-100 hover:text-burgundy-500 text-xs font-sans transition-colors"
            >
              بوابة د/عمر مجدي الخاصة
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
