'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { AuthUser } from '@/types/auth';

interface HeroSectionProps {
  currentUser?: AuthUser | null;
  onSignUp?: () => void;
  onSignIn?: () => void;
  onStartJourney?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  currentUser,
  onSignUp,
  onSignIn,
  onStartJourney,
}) => {
  const handleSignUp = onSignUp || onStartJourney;
  return (
    <section className="relative pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="text-center">
        {/* Editorial Monogram Badge */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-hairline bg-ivory-100 mb-6">
          <img
            src="/images/phenol-symbol-burgundy.png"
            alt="PHENOL"
            className="w-3.5 h-3.5 object-contain"
          />
          <span className="font-editorial uppercase text-burgundy-500 font-bold tracking-widest text-xs">
            PHENOL
          </span>
          <span className="text-hairline-strong">•</span>
          <span className="text-charcoal-900 font-sans font-semibold text-xs tracking-wide">
            Dr. Omar Magdi
          </span>
        </div>

        {/* Primary Headline: “To Understand Is to Master.” */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display text-charcoal-900 tracking-tight py-1">
            <span className="text-burgundy-500 font-serif italic font-normal mr-2">“</span>
            To Understand Is to Master.
            <span className="text-burgundy-500 font-serif italic font-normal ml-2">”</span>
          </h1>

          {/* Core Philosophy Tagline */}
          <div className="mt-4 sm:mt-5 flex items-center justify-center gap-3 text-xs sm:text-sm text-charcoal-100 font-sans">
            <span className="font-semibold text-charcoal-900 tracking-wide">
              Find the Simple. Master the Complex.
            </span>
          </div>

          {/* Editorial Introduction Copy */}
          <p className="mt-6 text-sm sm:text-base text-charcoal-100 max-w-2xl mx-auto font-sans leading-relaxed">
            Science is not an arbitrary assembly of formulas and equations to be memorized, but an elegant discipline governed by fundamental physical laws. At <strong className="text-charcoal-900 font-semibold font-editorial">Phenol Academy</strong>, directed by <strong className="text-charcoal-900 font-semibold font-sans">Dr. Omar Magdi</strong>, we deconstruct complex phenomena from first principles—building rigorous scientific reasoning step by step.
          </p>
        </div>

        {/* Prominent Action Buttons: Context-Aware Authentication */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md sm:max-w-none mx-auto">
          {currentUser ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto min-w-[220px] inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer ring-2 ring-burgundy-500/20"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="w-full sm:w-auto min-w-[190px] inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ring-2 ring-burgundy-500/20"
              >
                <span>Register as Scholar</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto min-w-[190px] inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-ivory-100 hover:bg-ivory-300 active:scale-[0.98] border-2 border-burgundy-500 text-burgundy-500 hover:text-burgundy-900 font-sans font-bold text-base sm:text-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <span>Sign In to Portal</span>
              </Link>
            </>
          )}
        </div>

        {/* Large & Prominent Button: Navigate to /courses */}
        <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center max-w-lg mx-auto">
          <Link
            href="/courses"
            className="w-full sm:w-auto min-w-[280px] sm:min-w-[420px] inline-flex items-center justify-between gap-4 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl bg-burgundy-900 hover:bg-black active:scale-[0.98] text-ivory-100 font-sans font-bold text-lg sm:text-xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-ochre hover:border-ochre-light group cursor-pointer ring-4 ring-burgundy-900/10 hover:-translate-y-0.5"
            aria-label="Explore Our Courses"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 text-left">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-burgundy-800 border border-ochre/40 flex items-center justify-center text-ochre-light group-hover:scale-110 transition-transform shrink-0">
                <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-ochre" />
              </div>
              <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-ivory-100 font-display">
                Explore Our Courses
              </span>
            </div>
            <div className="w-9 sm:w-11 h-9 sm:h-11 rounded-full bg-ivory-100/10 flex items-center justify-center shrink-0 group-hover:bg-ochre/20 transition-colors">
              <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6 text-ochre group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Footnote 3 Principles */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-hairline max-w-xl mx-auto">
          <div className="grid grid-cols-3 divide-x divide-hairline text-center">
            <div className="px-3">
              <span className="block font-formula text-xs font-bold text-burgundy-500 mb-0.5">01</span>
              <span className="text-xs sm:text-sm text-charcoal-900 font-sans font-semibold">First Principles</span>
            </div>
            <div className="px-3">
              <span className="block font-formula text-xs font-bold text-burgundy-500 mb-0.5">02</span>
              <span className="text-xs sm:text-sm text-charcoal-900 font-sans font-semibold">Causal Mechanisms</span>
            </div>
            <div className="px-3">
              <span className="block font-formula text-xs font-bold text-burgundy-500 mb-0.5">03</span>
              <span className="text-xs sm:text-sm text-charcoal-900 font-sans font-semibold">Conceptual Synthesis</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
