'use client';

import React from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { Navbar } from '@/components/layout/Navbar';
import { PhilosophySection } from '@/components/home/PhilosophySection';
import { FeynmanMethodSection } from '@/components/home/FeynmanMethodSection';
import { ComparisonSection } from '@/components/home/ComparisonSection';
import { ProblemSolvingSection } from '@/components/home/ProblemSolvingSection';
import { ResourcesSection } from '@/components/home/ResourcesSection';
import { FacultySection } from '@/components/home/FacultySection';
import { AboutSection } from '@/components/home/AboutSection';
import { FinalCtaSection } from '@/components/home/FinalCtaSection';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { Sparkles, ArrowRight, GraduationCap, Compass, Layers } from 'lucide-react';

export default function AcademyPage() {
  const { user: currentUser, signOut } = useCurrentUser();

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Editorial Academic Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={signOut}
      />

      <main className="flex-1">
        {/* Academy Deep-Dive Banner */}
        <section className="py-16 sm:py-24 border-b border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-ochre-500" />
                ACADEMIC DISCIPLINE & METHODOLOGY
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal-900 font-display tracking-tight leading-[1.1]">
              Phenol Academy
            </h1>

            <p className="text-base sm:text-lg text-charcoal-100 font-sans leading-relaxed">
              We reject the industrialization of rote memorization. Phenol Academy is structured as an intellectual sanctuary where complex physical, chemical, and mathematical phenomena are derived from first principles.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/#tracks"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-sm transition-all shadow-md hover:shadow-lg"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Browse Academic Tracks & Courses</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-ivory-100 hover:bg-ivory-300 text-charcoal-900 font-sans font-bold text-sm border border-hairline transition-colors shadow-quiet"
              >
                <Compass className="w-4 h-4 text-burgundy-500" />
                <span>Dr. Omar Magdi Manifesto</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 01: Core Philosophy */}
        <PhilosophySection />

        {/* Section 02: Feynman Method */}
        <FeynmanMethodSection />

        {/* Section 03: Pedagogical Comparison Matrix */}
        <ComparisonSection />

        {/* Section 04: Analytical Problem Solving */}
        <ProblemSolvingSection />

        {/* Section 05: Learning Resources & Dossiers */}
        <ResourcesSection />

        {/* Section 06: Faculty & Fellows */}
        <FacultySection />

        {/* Section 07: The Educator / About Dr. Omar */}
        <AboutSection />

        {/* Section 08: Final Directive */}
        <FinalCtaSection
          currentUser={currentUser}
          onSignUp={() => {}}
          onSignIn={() => {}}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-ivory-100 py-12 text-sm text-charcoal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-hairline">
            <PhenolLogo size={36} subtitle="First Principles Institution" />

            <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium">
              <Link href="/#tracks" className="hover:text-burgundy-500 transition-colors">
                Academic Tracks
              </Link>
              <Link href="/academy" className="hover:text-burgundy-500 transition-colors font-bold text-charcoal-900">
                Phenol Academy
              </Link>
              <Link href="/academy#faculty" className="hover:text-burgundy-500 transition-colors">
                Faculty
              </Link>
              <Link href="/matrix" className="hover:text-burgundy-500 transition-colors">
                Analytical Matrix
              </Link>
              <Link href="/problem-solving" className="hover:text-burgundy-500 transition-colors">
                Problem Solving
              </Link>
              <Link href="/about" className="hover:text-burgundy-500 transition-colors">
                About Dr. Omar
              </Link>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-formula text-charcoal-50">
            <span>© {new Date().getFullYear()} Phenol Academy • All academic curricula preserved.</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-charcoal-900 transition-colors">Privacy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-charcoal-900 transition-colors">Terms of Academic Access</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
