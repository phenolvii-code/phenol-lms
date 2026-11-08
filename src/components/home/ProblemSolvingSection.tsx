'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export const ProblemSolvingSection: React.FC = () => {
  const previewPhases = [
    {
      num: '01',
      title: 'Decipher Text & Implicit Parameters',
      desc: 'Close reading of problem prompts without rushing to calculate prematurely, identifying exact scientific variables.',
    },
    {
      num: '02',
      title: 'Synthesize Logical Deduction Path',
      desc: 'Formulating an unbroken chain of chemical reasoning that connects initial conditions to the desired solution.',
    },
    {
      num: '03',
      title: 'Verify Against Thermodynamic Reality',
      desc: 'Scrutinizing calculated values against chemical reality: is the magnitude, charge balance, and sign physically plausible?',
    },
  ];

  return (
    <section id="problem-solving" className="py-14 sm:py-18 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-8">
        {/* Section Heading with Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                SECTION 04 • PROBLEM-SOLVING
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
              How We Read & Deconstruct Problems
            </h2>

            <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
              We do not drill mechanical recipes for single question formats. We cultivate a repeatable six-step analytical method.
            </p>
          </div>

          <Link
            href="/problem-solving"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet shrink-0"
          >
            <span>Explore 6-Step System</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-hairline">
          {previewPhases.map((phase) => (
            <div key={phase.num} className="p-5 rounded-lg bg-ivory-100 border border-hairline space-y-2.5">
              <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                <h3 className="text-sm font-bold text-charcoal-900 font-display">{phase.title}</h3>
                <span className="font-formula text-sm font-bold text-burgundy-500">{phase.num}</span>
              </div>
              <p className="text-xs text-charcoal-100 leading-relaxed font-sans">
                {phase.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
