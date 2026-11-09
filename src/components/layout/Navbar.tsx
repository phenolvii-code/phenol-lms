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
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
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
    { label: 'Philosophy', href: '/philosophy' },
    { label: 'Feynman Method', href: '/method' },
    { label: 'Analytical Matrix', href: '/matrix' },
    { label: 'Courses', href: '/courses' },
    { label: 'About Dr. Omar', href: '/about' },
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
              className="text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-burgundy-500 rounded py-1"
              aria-label="PHENOL - Dr. Omar Magdi"
            >
              <PhenolLogo size={36} subtitle="Dr. Omar Magdi" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8" aria-label="Main Navigation">
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

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {!currentUser ? (
              <>
                {/* Desktop Actions */}
                <div className="hidden lg:flex items-center gap-3">
                  <button
                    onClick={() => (onOpenAuthModal ? onOpenAuthModal('LOGIN') : null)}
                    className="px-4 py-2 text-sm font-bold text-charcoal-900 hover:text-burgundy-900 rounded-lg hover:bg-ivory-300 transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={() => (onOpenAuthModal ? onOpenAuthModal('REGISTER') : null)}
                    className="px-6 py-2.5 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans text-sm font-bold tracking-wide transition-all duration-200 shadow-md hover:shadow-lg ring-2 ring-burgundy-500/20 cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>

                {/* Mobile Single CTA */}
                <button
                  onClick={() => (onOpenAuthModal ? onOpenAuthModal('REGISTER') : null)}
                  className="lg:hidden px-4 py-1.5 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans text-xs font-bold transition-all shadow-sm"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors text-xs sm:text-sm font-medium ${
                    isInstructor
                      ? 'border-burgundy-500/40 bg-burgundy-50 text-burgundy-800 hover:bg-burgundy-100'
                      : 'border-hairline hover:border-charcoal-100 bg-ivory-100 text-charcoal-900'
                  }`}
                >
                  {isInstructor ? (
                    <ShieldCheck className="w-4 h-4 text-burgundy-500" />
                  ) : (
                    <LayoutDashboard className="w-4 h-4 text-burgundy-500" />
                  )}
                  <span className="hidden sm:inline">
                    {isInstructor ? 'Administration' : 'Student Dashboard'}
                  </span>
                  <span className="sm:hidden">
                    {isInstructor ? 'Admin' : currentUser.name.split(' ')[0]}
                  </span>
                </Link>

                <div className="hidden md:flex flex-col text-left leading-tight pl-2 border-l border-hairline">
                  <span className="text-xs sm:text-sm font-bold text-charcoal-900">
                    {currentUser.name}
                  </span>
                  <span className="text-[11px] text-charcoal-100 font-sans">
                    {isInstructor ? 'Academic Director' : 'Enrolled Student'}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-2 text-charcoal-50 hover:text-burgundy-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded text-charcoal-900 hover:text-burgundy-500 border border-hairline bg-ivory-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-ivory-100 border-b border-hairline px-4 pt-3 pb-6 space-y-4">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                className="flex items-center justify-between py-2 text-sm font-medium text-charcoal-900 border-b border-hairline/60"
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-charcoal-50" />
              </Link>
            ))}
          </nav>

          {!currentUser ? (
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenAuthModal) onOpenAuthModal('REGISTER');
                }}
                className="w-full py-3 text-center text-sm font-bold rounded-lg bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 shadow-md transition-all"
              >
                Sign Up
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenAuthModal) onOpenAuthModal('LOGIN');
                }}
                className="w-full py-2.5 text-center text-sm font-bold rounded-lg border-2 border-burgundy-500 text-burgundy-500 bg-ivory-100 hover:bg-ivory-300 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenAuthModal) onOpenAuthModal('INSTRUCTOR_LOGIN');
                }}
                className="w-full py-2 text-center text-xs font-semibold text-charcoal-50 hover:text-burgundy-500 flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Dr. Omar Magdi Portal (Admin)</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t border-hairline">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-sm font-semibold rounded bg-burgundy-500 text-ivory-100"
              >
                {isInstructor ? 'Enter Administration Portal' : 'Enter Student Dashboard'}
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2 text-center text-xs font-semibold text-charcoal-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
