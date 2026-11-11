'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export const PhilosophySection: React.FC = () => {
  const pillars = [
    {
      num: '01',
      title: 'Analytical Deduction',
      desc: 'Deconstructing complex chemical phenomena into elementary physical variables rather than relying on surface equations.',
    },
    {
      num: '02',
      title: 'Causal Thermodynamics',
      desc: 'Investigating orbital geometries, electron densities, and energetic equilibria to understand why reactions occur.',
    },
    {
      num: '03',
      title: 'First Principles',
      desc: 'Reconstructing governing laws from their fundamental origins, making recall inevitable rather than forced.',
    },
  ];

  return (
    <section id="philosophy" className="py-14 sm:py-18 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-8">
        {/* Section Heading with Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                SECTION 02 • PHILOSOPHY
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
              Understanding Precedes Memorization.
            </h2>

            <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
              We do not present chemical equations as dogma to be memorized; we deconstruct phenomena down to the physical and thermodynamic realities upon which they rest.
            </p>
          </div>

          <Link
            href="/philosophy"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet shrink-0"
          >
            <span>Explore Full Philosophy</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Pillars Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-hairline">
          {pillars.map((item) => (
            <div key={item.num} className="p-5 rounded-lg bg-ivory-100 border border-hairline space-y-2.5">
              <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                <h3 className="text-sm font-bold text-charcoal-900 font-display">{item.title}</h3>
                <span className="font-formula text-sm font-bold text-burgundy-500">{item.num}</span>
              </div>
              <p className="text-xs text-charcoal-100 leading-relaxed font-sans">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
