'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Quote, CheckCircle2, ArrowRight } from 'lucide-react';

export const OurPhilosophySection: React.FC = () => {
  const comparisonRows = [
    {
      dimension: 'Cognitive Objective',
      conventional: 'Memorizing formulas, patterns, and solved exam variants to recognize questions.',
      phenol: 'Deconstructing physical causality so any unfamiliar problem is solvable from scratch.',
    },
    {
      dimension: 'Equation Treatment',
      conventional: 'Mechanical balancing of symbols as abstract mathematical strings.',
      phenol: 'Physical transformation governed by conservation laws and thermodynamic drivers.',
    },
    {
      dimension: 'Scientific Verification',
      conventional: 'Relying on authority and answer keys without investigating intermediate steps.',
      phenol: 'The Feynman Protocol: explaining the concept simply without scientific jargon.',
    },
    {
      dimension: 'Problem-Solving Stance',
      conventional: 'Paralysis when encountering novel or unexpected question formulations.',
      phenol: 'Methodical decomposition into first principles, isolating variables with causal logic.',
    },
  ];

  return (
    <div className="space-y-16 py-12">
      {/* Philosophy Masthead */}
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-ochre-500" />
            FIRST-PRINCIPLES EPISTEMOLOGY
          </span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-charcoal-900 font-display">
          Our Philosophy: To Understand Is To Master
        </h2>

        <p className="text-sm sm:text-base text-charcoal-100 font-sans leading-relaxed">
          True mastery of the natural sciences—whether physics, chemistry, biology, or mathematics—begins where rote memorization ends. We approach science as an interconnected, coherent discipline governed by universal laws of nature.
        </p>
      </div>

      {/* Epistemological Quotes Grid: Dr. Omar Magdi & Richard Feynman */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quote 1: Dr. Omar Magdi */}
        <div className="p-7 sm:p-8 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <Quote className="w-6 h-6 text-burgundy-500 opacity-60" />
            <p className="font-display font-medium text-base sm:text-lg text-charcoal-900 leading-relaxed italic">
              “Scientific understanding begins where memorization ends. Knowing that a transformation occurs is only the beginning; understanding why it occurs, what energetic forces drive it, and which principles determine its outcome is where meaningful learning takes place.”
            </p>
          </div>

          <div className="pt-4 border-t border-hairline">
            <span className="font-bold text-sm text-charcoal-900 block font-display">Dr. Omar Magdi</span>
            <span className="text-xs text-burgundy-500 font-sans font-medium">Founder & Academic Director, Phenol Academy</span>
          </div>
        </div>

        {/* Quote 2: Richard Feynman */}
        <div className="p-7 sm:p-8 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <Quote className="w-6 h-6 text-ochre-500 opacity-60" />
            <p className="font-display font-medium text-base sm:text-lg text-charcoal-900 leading-relaxed italic">
              “You can know the name of a bird in all the languages of the world, but when you&apos;re finished, you&apos;ll know absolutely nothing whatever about the bird... I learned very early the difference between knowing the name of something and knowing something.”
            </p>
          </div>

          <div className="pt-4 border-t border-hairline">
            <span className="font-bold text-sm text-charcoal-900 block font-display">Richard P. Feynman</span>
            <span className="text-xs text-ochre-600 font-sans font-medium">Nobel Laureate in Theoretical Physics</span>
          </div>
        </div>

        {/* Quote 3: Dr. Omar Magdi on Equations */}
        <div className="p-7 sm:p-8 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <Quote className="w-6 h-6 text-burgundy-500 opacity-60" />
            <p className="font-display font-medium text-base sm:text-lg text-charcoal-900 leading-relaxed italic">
              “A scientific equation should never be treated merely as an expression to balance. It represents a physical transformation governed by conservation laws, energetic considerations, molecular interactions, and precise causal mechanisms.”
            </p>
          </div>

          <div className="pt-4 border-t border-hairline">
            <span className="font-bold text-sm text-charcoal-900 block font-display">Dr. Omar Magdi</span>
            <span className="text-xs text-burgundy-500 font-sans font-medium">On Mechanism-First Pedagogy</span>
          </div>
        </div>

        {/* Quote 4: Feynman on First Principles */}
        <div className="p-7 sm:p-8 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <Quote className="w-6 h-6 text-ochre-500 opacity-60" />
            <p className="font-display font-medium text-base sm:text-lg text-charcoal-900 leading-relaxed italic">
              “What I cannot create, I do not understand. Know how to solve every problem that has been solved.”
            </p>
          </div>

          <div className="pt-4 border-t border-hairline">
            <span className="font-bold text-sm text-charcoal-900 block font-display">Richard P. Feynman</span>
            <span className="text-xs text-ochre-600 font-sans font-medium">Final Blackboard Inscription, Caltech 1988</span>
          </div>
        </div>
      </div>

      {/* The 4 Pillars of the Feynman Learning Protocol */}
      <div className="p-8 sm:p-10 rounded-3xl bg-ivory-100 border border-hairline shadow-quiet space-y-6">
        <div className="space-y-1">
          <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
            THE OPERATIONAL PROTOCOL
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display">
            The Feynman Four-Step Method
          </h3>
          <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
            How we translate complex scientific ideas into intuitive, durable understanding.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            {
              num: '01',
              title: 'Choose the Concept',
              desc: 'Define the scientific principle cleanly on a blank page without reference to rote definitions.',
            },
            {
              num: '02',
              title: 'Explain to a Novice',
              desc: 'Deconstruct the mechanism in plain language. If you must use jargon, you do not yet understand it.',
            },
            {
              num: '03',
              title: 'Identify Knowledge Gaps',
              desc: 'Target the exact point of confusion. Return to first principles until the causal gap closes.',
            },
            {
              num: '04',
              title: 'Refine & Synthesize',
              desc: 'Create an intuitive analogy and verify against rigorous experimental observations.',
            },
          ].map((step) => (
            <div key={step.num} className="p-4 rounded-xl bg-ivory-200/60 border border-hairline space-y-2">
              <span className="font-formula text-xs font-bold text-burgundy-500">{step.num}</span>
              <h4 className="text-sm font-bold text-charcoal-900 font-sans">{step.title}</h4>
              <p className="text-xs text-charcoal-100 font-sans leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The Analytical Comparison Matrix */}
      <div className="space-y-6">
        <div className="space-y-1">
          <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
            PEDAGOGICAL COMPARISON
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display">
            Rote Learning vs. First-Principles Mastery
          </h3>
        </div>

        <div className="overflow-x-auto border border-hairline rounded-2xl bg-ivory-100 shadow-quiet">
          <table className="w-full text-left border-collapse min-w-[760px] table-fixed">
            <thead>
              <tr className="border-b border-hairline bg-ivory-200/70 text-xs font-formula uppercase tracking-wider">
                <th className="py-4 px-6 font-bold text-charcoal-900 w-[24%] whitespace-nowrap">Dimension</th>
                <th className="py-4 px-6 font-semibold text-charcoal-100 border-l border-hairline w-[38%]">
                  Conventional Rote Learning
                </th>
                <th className="py-4 px-6 font-bold text-burgundy-500 border-l border-hairline bg-ivory-200/50 w-[38%]">
                  Phenol Academy First Principles
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-xs sm:text-sm">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-ivory-200/40 transition-colors">
                  <td className="py-4 px-6 font-bold text-charcoal-900 font-display align-top whitespace-nowrap bg-ivory-50/30">
                    {row.dimension}
                  </td>
                  <td className="py-4 px-6 text-charcoal-100 border-l border-hairline leading-relaxed align-top">
                    <span className="text-charcoal-50 font-bold mr-1.5">✕</span>
                    {row.conventional}
                  </td>
                  <td className="py-4 px-6 text-charcoal-900 font-medium border-l border-hairline leading-relaxed align-top bg-ivory-50/20">
                    <span className="text-burgundy-500 font-bold mr-1.5">✓</span>
                    {row.phenol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
