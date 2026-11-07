'use client';

import React from 'react';

export const FeynmanMethodSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Understand',
      sub: 'True Meaning & Purpose',
      desc: 'We start by identifying the physical phenomenon and the core problem it explains, rather than prematurely memorizing definitions or formulas.',
    },
    {
      num: '02',
      title: 'Deconstruct',
      sub: 'Breakdown to Elementary Models',
      desc: 'Dissecting complex mechanisms into fundamental electronic states, orbital geometries, and thermodynamics to build the concept from its roots.',
    },
    {
      num: '03',
      title: 'Explain',
      sub: 'Rigorous Step-by-Step Logic',
      desc: 'Reformulating the concept in a seamless deductive sequence: each step leads inexorably to the next with zero intellectual gaps or leaps.',
    },
    {
      num: '04',
      title: 'Connect',
      sub: 'Inter-Branch Synthesis',
      desc: 'Linking new ideas to previously covered thermodynamics and molecular physics, viewing chemistry as an organic whole rather than isolated islands.',
    },
    {
      num: '05',
      title: 'Apply',
      sub: 'Non-Routine Analytical Problem Solving',
      desc: 'Moving from theory to solving multi-concept, non-traditional problems that train the mind to transfer principles to novel experimental setups.',
    },
    {
      num: '06',
      title: 'Teach Back',
      sub: 'The Benchmark of Mastery',
      desc: 'The student explains the idea in their own concise words and defends their choices. If hesitation occurs, the exact cognitive gap is diagnosed and re-solved.',
    },
  ];

  return (
    <section id="method" className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading with Academic Pull Quote */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
                SECTION 02
              </span>
              <span className="text-hairline-strong">•</span>
              <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">Teaching Methodology</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
              How You Learn at PHENOL
            </h2>

            <p className="text-sm sm:text-base text-charcoal-100 leading-relaxed font-sans">
              Directed by <strong className="text-charcoal-900 font-semibold font-sans">Dr. Omar Magdi</strong>, our pedagogy adapts the Feynman Technique into a six-stage progression that takes the student from initial intuition to complete mastery.
            </p>
          </div>

          <div className="lg:col-span-5 bg-ivory-300/60 border-l-2 border-burgundy-500 p-6 rounded-r">
            <span className="font-sans text-xs text-burgundy-500 font-bold uppercase tracking-wider block mb-1.5">
              Richard Feynman Principle
            </span>
            <p className="font-serif italic text-sm sm:text-base text-charcoal-900 font-medium leading-relaxed">
              “If you cannot explain it simply, you do not understand it well enough.”
            </p>
          </div>
        </div>

        {/* 6 Steps Linear Unboxed Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 border-t border-hairline pt-8">
          {steps.map((step, idx) => (
            <div key={idx} className="space-y-3 border-b border-hairline/60 pb-6 sm:border-b-0 sm:pb-0">
              <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                <span className="font-formula text-xs font-bold text-burgundy-500">
                  {step.num}
                </span>
                <span className="font-formula text-[11px] text-charcoal-50 uppercase tracking-widest">
                  STAGE {idx + 1}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-charcoal-900 font-display">
                  {step.title}
                </h3>
                <span className="text-xs font-semibold text-charcoal-100 font-sans block mt-0.5">
                  {step.sub}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
