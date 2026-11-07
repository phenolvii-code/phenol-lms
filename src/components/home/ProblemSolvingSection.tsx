'use client';

import React from 'react';

export const ProblemSolvingSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Read',
      sub: 'Text & Implied Context',
      desc: 'Close reading of the problem prompt, deciphering exact scientific parameters without rushing to calculate prematurely.',
    },
    {
      num: '02',
      title: 'Identify',
      sub: 'Governing Principles',
      desc: 'Extracting explicit and implicit variables to pinpoint the overarching physical law directing the system.',
    },
    {
      num: '03',
      title: 'Analyze',
      sub: 'Variables & Constraints',
      desc: 'Mapping relationships between dynamic factors, boundary conditions, and equilibrium constants.',
    },
    {
      num: '04',
      title: 'Synthesize',
      sub: 'Logical Deduction Path',
      desc: 'Formulating an unbroken chain of chemical reasoning that connects initial conditions to the desired solution.',
    },
    {
      num: '05',
      title: 'Execute',
      sub: 'Dimensional Precision',
      desc: 'Executing algebraic transformations with rigorous unit tracking, stoichiometry, and mathematical accuracy.',
    },
    {
      num: '06',
      title: 'Verify',
      sub: 'Thermodynamic Reality',
      desc: 'Scrutinizing the calculated value against chemical reality: is this magnitude and sign physically plausible?',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
              SECTION 04
            </span>
            <span className="text-hairline-strong">•</span>
            <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">Analytical Execution</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
            How We Read & Deconstruct Problems
          </h2>

          <p className="text-sm sm:text-base text-charcoal-100 leading-relaxed font-sans">
            We do not drill mechanical recipes for single question formats. We cultivate a repeatable six-step analytical method.
          </p>
        </div>

        {/* 6 Steps Linear Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 border-t border-hairline pt-8">
          {steps.map((item, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                <span className="font-formula text-xs font-bold text-burgundy-500">
                  {item.num}
                </span>
                <span className="font-formula text-[11px] text-charcoal-50 uppercase tracking-widest">
                  PHASE {idx + 1}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-charcoal-900 font-display">
                  {item.title}
                </h3>
                <span className="text-xs font-semibold text-charcoal-100 font-sans block mt-0.5">
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
