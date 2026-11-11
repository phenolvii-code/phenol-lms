'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthModalMode } from '@/types/auth';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
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
import { Mail, Send, Youtube, Facebook } from 'lucide-react';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';

export default function Home() {
  const router = useRouter();
  const { user: currentUser, signOut } = useCurrentUser();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('LOGIN');

  // Automatically catch and route password recovery callbacks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (
        hash.includes('type=recovery') ||
        hash.includes('otp_expired') ||
        hash.includes('error_code=')
      ) {
        router.push(`/reset-password${hash}`);
      }
    }
  }, [router]);

  const handleOpenAuth = (mode: AuthModalMode) => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Editorial Academic Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuth}
        onLogout={signOut}
      />

      {/* Main Content Sections with Harmonious Vertical Rhythm */}
      <main className="flex-1">
        {/* Section 01: Hero */}
        <HeroSection
          currentUser={currentUser}
          onSignUp={() => handleOpenAuth('REGISTER')}
          onSignIn={() => handleOpenAuth('LOGIN')}
        />

        {/* Section 02: Core Chemistry Curricula & Courses (First Section) */}
        <ProgramsSection onOpenWaitlistModal={() => handleOpenAuth('REGISTER')} />

        {/* Section 03: Philosophy */}
        <PhilosophySection />

        {/* Section 04: Feynman Method */}
        <FeynmanMethodSection />

        {/* Section 05: Beyond Memorization Comparison */}
        <ComparisonSection />

        {/* Section 06: Analytical Problem Solving */}
        <ProblemSolvingSection />

        {/* Section 07: Learning Resources */}
        <ResourcesSection />

        {/* Section 08: About Dr. Omar Magdi */}
        <AboutSection />

        {/* Section 09: Final CTA */}
        <FinalCtaSection
          currentUser={currentUser}
          onSignUp={() => handleOpenAuth('REGISTER')}
          onSignIn={() => handleOpenAuth('LOGIN')}
        />
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
                Courses
              </Link>

              <Link href="/#about" className="hover:text-burgundy-500 transition-colors">
                About Dr. Omar
              </Link>
            </nav>

            {/* Direct Verified Social & Contact Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/201029208993"
                target="_blank"
                rel="noopener noreferrer"
                title="Direct WhatsApp (+201029208993)"
                className="w-8 h-8 rounded-full border border-hairline bg-ivory-200 flex items-center justify-center text-charcoal-100 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current" />
              </a>
              <a
                href="https://t.me/Feynmanvii"
                target="_blank"
                rel="noopener noreferrer"
                title="Telegram (@Feynmanvii)"
                className="w-8 h-8 rounded-full border border-hairline bg-ivory-200 flex items-center justify-center text-charcoal-100 hover:text-sky-600 hover:border-sky-300 transition-colors"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="mailto:phenolvii@gmail.com"
                title="Email (phenolvii@gmail.com)"
                className="w-8 h-8 rounded-full border border-hairline bg-ivory-200 flex items-center justify-center text-charcoal-100 hover:text-burgundy-500 hover:border-burgundy-300 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/phenolVII"
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook Profile"
                className="w-8 h-8 rounded-full border border-hairline bg-ivory-200 flex items-center justify-center text-charcoal-100 hover:text-blue-600 hover:border-blue-300 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/@phenoltalks"
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube (@phenoltalks)"
                className="w-8 h-8 rounded-full border border-hairline bg-ivory-200 flex items-center justify-center text-charcoal-100 hover:text-rose-600 hover:border-rose-300 transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
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
      />
    </div>
  );
}
