'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser, AuthModalMode } from '@/types/auth';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { HeroSection } from '@/components/home/HeroSection';
import { PhilosophySection } from '@/components/home/PhilosophySection';
import { FeynmanMethodSection } from '@/components/home/FeynmanMethodSection';
import { ComparisonSection } from '@/components/home/ComparisonSection';
import { ProblemSolvingSection } from '@/components/home/ProblemSolvingSection';
import { ProgramsSection } from '@/components/home/ProgramsSection';
import { ResourcesSection } from '@/components/home/ResourcesSection';
import { AboutSection } from '@/components/home/AboutSection';
import { FinalCtaSection } from '@/components/home/FinalCtaSection';
import { PhenolLogo } from '@/components/brand/PhenolLogo';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('REGISTER');

  // Load user session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('phenol_auth_user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleOpenAuth = (mode: AuthModalMode) => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('phenol_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('phenol_auth_user');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex flex-col font-sans selection:bg-burgundy-500 selection:text-white antialiased">
      {/* Precision Academic Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Content Sections with Fluid Vertical Spacing */}
      <main className="flex-1 space-y-20 sm:space-y-28 lg:space-y-36 pb-20 sm:pb-28 overflow-hidden">
        {/* Section 01: Hero */}
        <HeroSection onStartJourney={() => handleOpenAuth('REGISTER')} />

        {/* Section 02: Philosophy */}
        <PhilosophySection />

        {/* Section 03: Feynman Method */}
        <FeynmanMethodSection />

        {/* Section 04: Beyond Memorization Comparison */}
        <ComparisonSection />

        {/* Section 05: Analytical Problem Solving */}
        <ProblemSolvingSection />

        {/* Section 06: Learning Programs & Waitlist */}
        <ProgramsSection onOpenWaitlistModal={() => handleOpenAuth('REGISTER')} />

        {/* Section 07: Learning Resources */}
        <ResourcesSection />

        {/* Section 08: About Dr. Omar Magdi */}
        <AboutSection />

        {/* Section 09: Final CTA */}
        <FinalCtaSection onStart={() => handleOpenAuth('REGISTER')} />
      </main>

      {/* Minimalist Editorial Footer */}
      <footer className="border-t border-borderSubtle bg-darkBg py-12 text-xs text-textSecondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-borderSubtle/60">
            <PhenolLogo size={38} />

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              <a href="#philosophy" className="hover:text-gold-400 transition">الفلسفة</a>
              <span className="text-borderSubtle">•</span>
              <a href="#method" className="hover:text-gold-400 transition">طريقة فاينمان</a>
              <span className="text-borderSubtle">•</span>
              <a href="#comparison" className="hover:text-gold-400 transition">المقارنة التحليلية</a>
              <span className="text-borderSubtle">•</span>
              <a href="#programs" className="hover:text-gold-400 transition">المسارات</a>
              <span className="text-borderSubtle">•</span>
              <a href="#about" className="hover:text-gold-400 transition">عن الدكتور</a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <span className="font-editorial text-sm font-bold text-textPrimary uppercase tracking-wider">
                Dr. Omar Magdi
              </span>
              <span className="hidden sm:inline text-borderSubtle">•</span>
              <span className="text-gold-500 font-serif text-sm">«من فهم شيئًا ملكه»</span>
              <span className="hidden sm:inline text-borderSubtle">•</span>
              <span className="text-textSecondary/80 font-formula text-[11px]">
                Find the Simple. Master the Complex.
              </span>
            </div>

            <div className="text-textSecondary/60 text-[11px]">
              جميع الحقوق محفوظة © {new Date().getFullYear()} • The Chemistry Counselor
            </div>
          </div>
        </div>
      </footer>

      {/* Auth & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}