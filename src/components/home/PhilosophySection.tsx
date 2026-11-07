'use client';

import React from 'react';

export const PhilosophySection: React.FC = () => {
  const pillars = [
    {
      num: '01',
      en: 'Analytical Thinking',
      sub: 'What actually happens—and why?',
      desc: 'Approaching any reaction or problem by analyzing its governing components. What variables dictate the outcome? Why does this mechanism occur? Transforming raw data into logical, deductive conclusions.',
    },
    {
      num: '02',
      en: 'Causal Reasoning',
      sub: 'The physical pathways connecting cause and effect',
      desc: 'We never stop at observing that an agent causes an outcome. We examine effective collision geometry, electron densities, thermodynamic equilibria, and the energetic boundaries of every reaction.',
    },
    {
      num: '03',
      en: 'First Principles',
      sub: 'Reconstructing laws from foundational origins',
      desc: 'Rather than presenting formulas as dogmatic rules for rote memory, we begin with elementary physical laws to comprehend how the formula was derived, its exact scope, and its boundary conditions.',
    },
  ];

  return (
    <section id="philosophy" className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
              SECTION 01
            </span>
            <span className="text-hairline-strong">•</span>
            <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">Core Philosophy</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
            Understanding Precedes Memorization.
          </h2>

          <p className="text-sm sm:text-base text-charcoal-100 leading-relaxed font-sans">
            We believe the most demanding scientific concepts become intuitive once deconstructed to the elementary physical principles upon which they rest. We do not present equations as dogma to be memorized; we begin by questioning, analyzing, and rebuilding knowledge with crystalline clarity.
          </p>
        </div>

        {/* 3 Pillars Unboxed Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 border-t border-hairline pt-8">
          {pillars.map((item, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-hairline pb-3">
                <span className="font-formula text-xs font-bold uppercase tracking-wider text-charcoal-50">
                  {item.en}
                </span>
                <span className="font-formula text-2xl font-bold text-burgundy-500">
                  {item.num}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-charcoal-900 font-display">
                  {item.en}
                </h3>
                <span className="text-xs font-semibold text-burgundy-500 font-sans block mt-1">
                  {item.sub}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
