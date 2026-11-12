'use client';

import React from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { Navbar } from '@/components/layout/Navbar';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { OurPhilosophySection } from '@/components/academy/OurPhilosophySection';
import { Sparkles, ArrowRight, GraduationCap, Users } from 'lucide-react';

export default function AcademyPage() {
  const { user: currentUser, signOut } = useCurrentUser();

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Editorial Academic Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={signOut}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-12">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-charcoal-100 font-sans">
          <Link href="/" className="hover:text-charcoal-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-charcoal-900 font-formula">
            Phenol Academy
          </span>
        </nav>

        {/* Masthead Banner */}
        <section className="p-8 sm:p-12 rounded-3xl bg-ivory-100 border border-hairline shadow-quiet space-y-6">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-ochre-500" />
                FIRST-PRINCIPLES SCIENTIFIC COGNITION
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-charcoal-900 font-display tracking-tight leading-tight">
              Phenol Academy
            </h1>

            <p className="text-base sm:text-lg text-charcoal-100 font-sans leading-relaxed">
              We reject the industrialization of rote memorization. Phenol Academy is an intellectual sanctuary where the foundational natural sciences—chemistry, physics, and biology—are derived from causal mechanisms, conservation laws, and intuitive first principles.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/#tracks"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg ring-2 ring-burgundy-500/20"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Explore The 4 Academic Tracks</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/faculty"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 font-sans font-bold text-xs sm:text-sm border border-hairline transition-colors shadow-quiet"
              >
                <Users className="w-4 h-4 text-burgundy-500" />
                <span>Faculty & Teaching Chairs</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Consolidated Single Philosophy Section with Dr. Omar & Feynman Quotes */}
        <div id="philosophy">
          <OurPhilosophySection />
        </div>

        {/* Faculty Direct Callout */}
        <section className="p-8 sm:p-10 rounded-3xl bg-ivory-100 border border-hairline shadow-quiet flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <span className="font-formula text-xs text-ochre-600 font-bold uppercase tracking-wider block">
              ACADEMIC LEADERSHIP
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display">
              Meet Our Teaching Chairs & Faculty Fellows
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
              Dedicated educators across secondary, international, and university levels committed to conceptual clarity and student mastery.
            </p>
          </div>

          <Link
            href="/faculty"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-charcoal-900 hover:bg-burgundy-900 text-ivory-100 font-sans text-xs sm:text-sm font-bold transition-all shadow-md"
          >
            <span>View Faculty Directory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-hairline bg-ivory-100 py-8 text-xs text-charcoal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <PhenolLogo size={28} />

          <nav className="flex items-center gap-6 font-medium">
            <Link href="/#tracks" className="hover:text-burgundy-500 transition-colors">
              Academic Tracks
            </Link>
            <Link href="/academy" className="hover:text-burgundy-500 transition-colors font-bold text-charcoal-900">
              Phenol Academy
            </Link>
            <Link href="/faculty" className="hover:text-burgundy-500 transition-colors">
              Faculty
            </Link>
          </nav>

          <span className="text-charcoal-50 font-formula text-[11px]">
            © {new Date().getFullYear()} Phenol Academy. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
