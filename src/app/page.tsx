'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('LOGIN');

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
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Editorial Academic Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Content Sections with Harmonious Vertical Rhythm */}
      <main className="flex-1">
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

      {/* Minimalist Editorial Colophon / Footer */}
      <footer className="border-t border-hairline bg-ivory-100 py-12 text-sm text-charcoal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-hairline">
            <PhenolLogo size={36} subtitle="Dr. Omar Magdi" />

            <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium">
              <Link href="/#philosophy" className="hover:text-burgundy-500 transition-colors">
                Philosophy
              </Link>
              <Link href="/#method" className="hover:text-burgundy-500 transition-colors">
                Feynman Method
              </Link>
              <Link href="/#comparison" className="hover:text-burgundy-500 transition-colors">
                Analytical Matrix
              </Link>
              <Link href="/#programs" className="hover:text-burgundy-500 transition-colors">
                Curriculum
              </Link>
              <Link href="/#admission" className="hover:text-burgundy-500 transition-colors">
                Admissions
              </Link>
              <Link href="/#about" className="hover:text-burgundy-500 transition-colors">
                About Dr. Omar
              </Link>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs sm:text-sm text-charcoal-100">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <span className="font-editorial text-xs sm:text-sm font-bold text-charcoal-900 uppercase tracking-widest">
                PHENOL
              </span>
              <span className="text-hairline-strong">•</span>
              <span className="font-sans font-semibold text-charcoal-900">Dr. Omar Magdi</span>
              <span className="hidden sm:inline text-hairline-strong">•</span>
              <span className="text-burgundy-500 font-serif italic text-xs sm:text-sm">
                “To Understand Is to Master.”
              </span>
              <span className="hidden sm:inline text-hairline-strong">•</span>
              <span className="font-formula text-xs text-charcoal-50 inline-block">
                Find the Simple. Master the Complex.
              </span>
            </div>

            <div className="flex items-center gap-4 font-sans text-charcoal-50 text-xs">
              <Link href="/privacy" className="hover:text-burgundy-600 transition-colors underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-burgundy-600 transition-colors underline-offset-4 hover:underline">
                Terms of Service
              </Link>
              <span>•</span>
              <span>All Rights Reserved © {new Date().getFullYear()} • PHENOL</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
