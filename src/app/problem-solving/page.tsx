'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Target, CheckCircle2, ChevronRight } from 'lucide-react';
import { PhenolLogo } from '@/components/brand/PhenolLogo';

export default function ProblemSolvingPage() {
  const tiers = [
    {
      tier: 'Tier 01',
      title: 'Foundational Verification',
      subtitle: 'Testing Direct Physical Law Compliance',
      desc: 'Problems designed to verify that the fundamental thermodynamic or electronic axiom is firmly anchored in the scholar\'s mental model.',
      example: 'Determining the thermodynamic equilibrium constant shift when temperature increases in an exothermic industrial synthesis.',
    },
    {
      tier: 'Tier 02',
      title: 'Perturbation & Non-Routine Variance',
      subtitle: 'Altering Reaction Conditions',
      desc: 'Problems where traditional textbook heuristics deliberately fail. The substrate geometry is sterically constrained or multiple equilibria compete simultaneously.',
      example: 'Predicting major vs. minor regioisomeric substitution products when steric hindrance directly opposes electronic resonance directing effects.',
    },
    {
      tier: 'Tier 03',
      title: 'Multi-Disciplinary Synthesis',
      subtitle: 'The Olympiad & Distinction Standard',
      desc: 'Multi-concept problems coupling chemical kinetics, spectrophotometric data, and organic reaction pathways into a unified deduction challenge.',
      example: 'Deducing the complete mechanism and rate-determining step of an unknown enzymatic or organometallic transformation from spectroscopic and kinetic half-life curves.',
    },
  ];

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Top Navigation Bar */}
      <header className="border-b border-hairline bg-ivory-100/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-charcoal-100 hover:text-charcoal-900 transition-colors text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <PhenolLogo size={32} subtitle="Problem Solving" />

          <Link
            href="/#programs"
            className="px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-sm"
          >
            Explore Courses
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 space-y-16">
        <div className="space-y-4 text-center sm:text-left border-b border-hairline pb-12">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-formula text-burgundy-500 font-bold uppercase tracking-widest">
            <Target className="w-4 h-4" />
            <span>DIAGNOSTIC RIGOR</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal-900 font-display leading-tight">
            The Analytical Problem-Solving Engine
          </h1>

          <p className="text-base sm:text-lg text-charcoal-100 font-serif italic max-w-2xl">
            Training scholars to dissect high-stakes chemistry examination problems from ministerial Thanaweya Amma to Cambridge A2 and university examinations.
          </p>
        </div>

        {/* 3 Tiers of Diagnostic Mastery */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-display text-charcoal-900">
            The Three Tiers of Problem Mastery
          </h2>

          <div className="space-y-4">
            {tiers.map((t) => (
              <div key={t.tier} className="p-6 rounded-lg bg-ivory-100 border border-hairline space-y-3">
                <div className="flex items-center justify-between border-b border-hairline pb-2">
                  <span className="font-formula text-xs font-bold text-burgundy-500">{t.tier}</span>
                  <span className="font-formula text-[10px] text-charcoal-50 uppercase tracking-wider">{t.subtitle}</span>
                </div>
                <h3 className="text-lg font-bold font-display text-charcoal-900">{t.title}</h3>
                <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">{t.desc}</p>
                <div className="p-3 rounded bg-ivory-50 border border-hairline text-xs font-sans text-charcoal-900">
                  <strong className="text-burgundy-500 font-formula uppercase text-[10px] block mb-0.5">Sample Problem Architecture:</strong>
                  {t.example}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="pt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-charcoal-900 font-display text-lg">
              Begin Solving Non-Routine Problems
            </h4>
            <p className="text-xs text-charcoal-100 font-sans">
              Learn under the direct personal supervision of Dr. Omar Magdi.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/register"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer ring-2 ring-burgundy-500/20"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-ivory-100 hover:bg-ivory-300 active:scale-[0.98] border-2 border-burgundy-500 text-burgundy-500 hover:text-burgundy-900 font-sans font-bold text-sm transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
