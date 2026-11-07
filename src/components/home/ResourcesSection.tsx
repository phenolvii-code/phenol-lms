'use client';

import React from 'react';

export const ResourcesSection: React.FC = () => {
  const tools = [
    {
      num: '01',
      en: 'Concept Maps',
      desc: 'Visual schematics linking chemical disciplines together, enabling macroscopic comprehension of the entire syllabus without fragmentation.',
    },
    {
      num: '02',
      en: 'Mechanisms Atlas',
      desc: 'Step-by-step curved-arrow electron pushing illustrations detailing initial reactants, transition states, and reaction geometries.',
    },
    {
      num: '03',
      en: 'Analytical Problem Bank',
      desc: 'Graded problem sets moving from foundational comprehension to non-routine multi-concept problems that challenge mental agility.',
    },
    {
      num: '04',
      en: 'Misconceptions Guide',
      desc: 'Documenting the most prevalent conceptual pitfalls in student problem solving and dissecting the thermodynamic reality behind them.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
              SECTION 06
            </span>
            <span className="text-hairline-strong">•</span>
            <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">Academic Instruments</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
            Instruments Designed for Deep Learning
          </h2>

          <p className="text-sm sm:text-base text-charcoal-100 leading-relaxed font-sans">
            Reference documents and diagnostic tools specifically designed to foster structural mental models, avoiding scattered recall.
          </p>
        </div>

        {/* 4 Columns Unboxed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 border-t border-hairline pt-8">
          {tools.map((item, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                <span className="font-formula text-xs font-bold text-burgundy-500">
                  {item.num}
                </span>
                <span className="font-formula text-[11px] text-charcoal-50 uppercase tracking-widest">
                  MODULE {idx + 1}
                </span>
              </div>

              <h3 className="text-base font-bold text-charcoal-900 font-display">
                {item.en}
              </h3>

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
