'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  const previewRows = [
    {
      dim: 'Scientific Laws',
      traditional: 'Memorizing the formula verbatim without mathematical derivation.',
      phenol: 'Deriving the physical origin, thermodynamic scope, and boundary conditions.',
    },
    {
      dim: 'Problem-Solving Strategy',
      traditional: 'Blindly matching question keywords to memorized algebraic templates.',
      phenol: 'Comprehending the governing chemistry and molecular cause behind every step.',
    },
    {
      dim: 'Novel Problem Sets',
      traditional: 'Parroting solutions; disorientation upon facing unseen exam formats.',
      phenol: 'Reading unfamiliar experimental data and deducing solutions from first principles.',
    },
  ];

  return (
    <section id="comparison" className="py-14 sm:py-18 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-8">
        {/* Section Heading with Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                SECTION 04 • PEDAGOGY MATRIX
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
              From Knowing the Answer to Understanding Its Cause
            </h2>

            <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
              The distinction is not in marketing slogans, but in cognitive methodology and rigorous conceptual deconstruction.
            </p>
          </div>

          <Link
            href="/matrix"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet shrink-0"
          >
            <span>View Full Comparison Matrix</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Rows Highlight Matrix */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 border-t border-hairline pt-6">
          <table className="w-full text-left border-collapse min-w-[820px] lg:min-w-full table-fixed">
            <thead>
              <tr className="border-b border-hairline bg-ivory-100/60 text-xs">
                <th className="py-3.5 pr-6 pl-2 font-display font-bold uppercase tracking-wider text-charcoal-900 w-[22%] whitespace-nowrap">
                  Dimension
                </th>
                <th className="py-3.5 px-6 font-display font-semibold uppercase tracking-wider text-charcoal-50 w-[39%]">
                  • Traditional Rote Learning
                </th>
                <th className="py-3.5 pl-6 pr-2 font-display font-bold uppercase tracking-wider text-burgundy-500 w-[39%]">
                  • PHENOL First-Principles Pedagogy
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {previewRows.map((r, i) => (
                <tr key={i} className="hover:bg-ivory-300/40 transition-colors">
                  <td className="py-4 sm:py-5 pr-6 pl-2 font-sans text-xs sm:text-sm font-bold text-charcoal-900 align-top whitespace-nowrap">
                    {r.dim}
                  </td>
                  <td className="py-4 sm:py-5 px-6 font-sans text-xs sm:text-sm text-charcoal-100/90 align-top leading-relaxed">
                    <span className="text-charcoal-50 font-bold mr-1.5">✕</span>
                    {r.traditional}
                  </td>
                  <td className="py-4 sm:py-5 pl-6 pr-2 font-sans text-xs sm:text-sm text-charcoal-900 font-medium align-top leading-relaxed">
                    <span className="text-burgundy-500 font-bold mr-1.5">✓</span>
                    {r.phenol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
