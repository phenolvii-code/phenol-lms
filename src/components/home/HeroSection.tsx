'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onStartJourney: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartJourney }) => {
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
            Chemistry is not an arbitrary assembly of formulas and equations to be memorized, but an elegant discipline governed by fundamental physical laws. At <strong className="text-charcoal-900 font-semibold font-editorial">PHENOL</strong>, directed by <strong className="text-charcoal-900 font-semibold font-sans">Dr. Omar Magdi</strong>, we deconstruct complex phenomena from first principles—building rigorous scientific reasoning step by step.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md sm:max-w-none mx-auto">
          <button
            onClick={onStartJourney}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet min-h-[46px]"
          >
            <span>Begin Your Journey</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#method"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded bg-ivory-100 hover:bg-ivory-300 border border-hairline text-charcoal-900 font-sans font-medium text-sm transition-colors min-h-[46px]"
          >
            <span>Explore the Feynman Method</span>
          </a>
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
