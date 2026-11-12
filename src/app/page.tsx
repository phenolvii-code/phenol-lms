'use client';

import React from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { Navbar } from '@/components/layout/Navbar';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { ACADEMIC_TRACKS } from '@/data/mock-data';
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Compass,
  Layers,
  ChevronRight,
  Atom,
  Binary,
  Microscope,
  Globe2,
} from 'lucide-react';

export default function Home() {
  const { user: currentUser, signOut } = useCurrentUser();

  const trackIcons = [
    <Atom key="1" className="w-5 h-5 text-burgundy-500" />,
    <Globe2 key="2" className="w-5 h-5 text-ochre-500" />,
    <Microscope key="3" className="w-5 h-5 text-burgundy-500" />,
    <Compass key="4" className="w-5 h-5 text-ochre-500" />,
  ];

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Editorial Academic Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={signOut}
      />

      <main className="flex-1 flex flex-col justify-between">
        {/* HERO SECTION: Minimal, Grand, High-Impact */}
        <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
          {/* Hexagonal Core Emblem */}
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial transition-all">
            <PhenolLogo size={52} withText={false} />
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-[0.25em] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-ochre-500" />
                FIRST-PRINCIPLES SCIENTIFIC COGNITION
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal-900 font-display tracking-tight leading-[1.12]">
              Phenol Academy
            </h1>

            <p className="text-base sm:text-lg text-charcoal-100 font-sans leading-relaxed max-w-2xl mx-auto">
              Founded by <strong className="text-charcoal-900 font-semibold">Dr. Omar Magdi</strong>. An elite academic institution dedicated to deconstructing secondary, international, and university curricula into causal mechanisms, foundational physical laws, and rigorous conceptual understanding.
            </p>
          </div>

          {/* Primary CTA: Know more about Phenol Academy */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/academy"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg ring-2 ring-burgundy-500/20"
            >
              <span>Know more about Phenol Academy</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#tracks"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-ivory-100 hover:bg-ivory-300 text-charcoal-900 font-sans font-bold text-sm sm:text-base border border-hairline transition-colors shadow-quiet"
            >
              <GraduationCap className="w-4 h-4 text-burgundy-500" />
              <span>Explore The 4 Academic Tracks</span>
            </a>
          </div>
        </section>

        {/* 2x2 SQUARE GRID: The 4 Core Academic Tracks */}
        <section id="tracks" className="py-16 sm:py-20 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full scroll-mt-20">
          <div className="space-y-10">
            {/* Section Heading */}
            <div className="max-w-2xl space-y-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-ochre-500" />
                ACADEMIC FACULTIES & CURRICULAR TRACKS
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
                Choose Your Academic Discipline
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
                Select your academic track below to access verified curricula, lecture syllabi, and diagnostic problem-solving sets tailored strictly to your educational syllabus.
              </p>
            </div>

            {/* 2x2 Balanced Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {ACADEMIC_TRACKS.map((track, idx) => (
                <Link
                  key={track.id}
                  href={`/tracks/${track.id}`}
                  className="group relative p-7 sm:p-9 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial hover:border-charcoal-200 transition-all duration-300 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    {/* Header: Roman Numeral & Subject Tag */}
                    <div className="flex items-center justify-between gap-2 border-b border-hairline pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-ivory-200 border border-hairline flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {trackIcons[idx] || <Atom className="w-4 h-4 text-burgundy-500" />}
                        </div>
                        <span className="font-formula text-xs font-bold text-charcoal-900 uppercase tracking-widest">
                          {track.romanNumeral}
                        </span>
                      </div>

                      <span className="font-formula text-[11px] text-ochre-600 font-semibold px-2.5 py-0.5 rounded bg-ivory-200 border border-hairline">
                        {track.badge}
                      </span>
                    </div>

                    {/* Track Titles */}
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display group-hover:text-burgundy-900 transition-colors">
                        {track.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-burgundy-500 font-sans leading-relaxed">
                        {track.nameAr}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
                      {track.description}
                    </p>

                    {/* Subject Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {track.subjects.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[11px] font-sans px-2.5 py-1 rounded bg-ivory-200 text-charcoal-700 border border-hairline font-medium"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="pt-4 border-t border-hairline flex items-center justify-between text-xs sm:text-sm font-semibold text-charcoal-900 group-hover:text-burgundy-500 transition-colors font-sans">
                    <span>Explore Track Syllabi & Courses</span>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-ivory-200 border border-hairline group-hover:bg-burgundy-500 group-hover:text-ivory-100 group-hover:border-burgundy-500 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Minimalist Editorial Colophon / Footer */}
      <footer className="border-t border-hairline bg-ivory-100 py-12 text-sm text-charcoal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-hairline">
            <PhenolLogo size={36} subtitle="First Principles Institution" />

            <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium">
              <Link href="/#tracks" className="hover:text-burgundy-500 transition-colors font-semibold text-charcoal-900">
                Academic Tracks
              </Link>
              <Link href="/academy" className="hover:text-burgundy-500 transition-colors">
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
            <span>© {new Date().getFullYear()} Phenol Academy • All rights reserved across all academic faculties.</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-charcoal-900 transition-colors">Privacy Policy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-charcoal-900 transition-colors">Terms of Academic Access</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
