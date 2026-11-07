'use client';

import React from 'react';

export const ComparisonSection: React.FC = () => {
  const rows = [
    {
      dim: 'Scientific Laws',
      traditional: 'Memorizing the formula verbatim without mathematical or conceptual derivation.',
      phenol: 'Deriving the physical origin, thermodynamic scope, and boundary conditions of the law.',
    },
    {
      dim: 'Problem-Solving Strategy',
      traditional: 'Blindly matching question keywords to memorized algebraic templates.',
      phenol: 'Comprehending the governing chemistry and molecular cause behind every algebraic step.',
    },
    {
      dim: 'Model Answers',
      traditional: 'Focusing exclusively on a single grading rubric line without conceptual depth.',
      phenol: 'Scrutinizing why an answer is scientifically rigorous and identifying why alternative answers fail.',
    },
    {
      dim: 'Rule Application',
      traditional: 'Applying rules mechanically without questioning environmental constraints.',
      phenol: 'Investigating when and why rules apply, their underlying assumptions, and their limits.',
    },
    {
      dim: 'Variables & Kinetics',
      traditional: 'Memorizing direct or inverse relationships as isolated arrows.',
      phenol: 'Dissecting orbital collisions, transition states, and activation energies driving the rate.',
    },
    {
      dim: 'Novel Problem Sets',
      traditional: 'Parroting solutions from previous exams; disorientation upon facing unseen formats.',
      phenol: 'Reading unfamiliar experimental data with confidence and deriving solutions from first principles.',
    },
    {
      dim: 'Chemical Exceptions',
      traditional: 'Treating anomalous behaviors as arbitrary oddities to be brute-force memorized.',
      phenol: 'Discovering the deeper thermodynamic or electronic causes where baseline generalizations terminate.',
    },
  ];

  return (
    <section id="comparison" className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-10 sm:space-y-12">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
              SECTION 03
            </span>
            <span className="text-hairline-strong">•</span>
            <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">Beyond Memorization</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
            From Knowing the Answer to Understanding Its Cause
          </h2>

          <p className="text-sm sm:text-base text-charcoal-100 leading-relaxed font-sans">
            The difference is not in marketing slogans, but in cognitive methodology and rigorous conceptual deconstruction.
          </p>
        </div>

        {/* Academic Comparison Matrix */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[680px] px-4 sm:px-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-hairline">
                  <th className="py-3.5 pr-6 font-display text-xs font-bold uppercase tracking-wider text-charcoal-900 w-1/4">
                    Analytical Dimension
                  </th>
                  <th className="py-3.5 px-6 font-display text-xs font-semibold uppercase tracking-wider text-charcoal-50 w-3/8">
                    • Traditional Rote Learning
                  </th>
                  <th className="py-3.5 pl-6 font-display text-xs font-bold uppercase tracking-wider text-burgundy-500 w-3/8">
                    • PHENOL First-Principles Pedagogy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-ivory-300/40 transition-colors">
                    <td className="py-4 pr-6 font-sans text-xs sm:text-sm font-bold text-charcoal-900 align-top">
                      {r.dim}
                    </td>
                    <td className="py-4 px-6 font-sans text-xs sm:text-sm text-charcoal-100/80 align-top leading-relaxed">
                      <span className="text-charcoal-50 font-bold mr-1.5">✕</span>
                      {r.traditional}
                    </td>
                    <td className="py-4 pl-6 font-sans text-xs sm:text-sm text-charcoal-900 font-medium align-top leading-relaxed">
                      <span className="text-burgundy-500 font-bold mr-1.5">✓</span>
                      {r.phenol}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
