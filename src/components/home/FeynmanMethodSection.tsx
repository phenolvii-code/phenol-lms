'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export const FeynmanMethodSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Deconstruct to First Principles',
      desc: 'Dissect complex chemical mechanisms into fundamental electronic states, orbital geometries, and thermodynamics.',
    },
    {
      num: '02',
      title: 'Seamless Deductive Logic',
      desc: 'Reformulate concepts so each step leads inexorably to the next with zero intellectual gaps or hand-waving.',
    },
    {
      num: '03',
      title: 'Teach Back Benchmark',
      desc: 'Mastery is validated when the student explains and defends the solution in their own words without hesitation.',
    },
  ];

  return (
    <section id="method" className="py-14 sm:py-18 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-8">
        {/* Section Heading with Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                SECTION 02 • METHODOLOGY
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
              How You Learn at PHENOL: The Feynman Technique
            </h2>

            <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
              Directed by <strong className="text-charcoal-900 font-semibold font-sans">Dr. Omar Magdi</strong>, our pedagogy adapts the Feynman Technique into a six-stage progression from intuitive clarity to complete mastery.
            </p>
          </div>

          <Link
            href="/method"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet shrink-0"
          >
            <span>Explore The 6-Stage Method</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Steps Summary Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-hairline">
          {steps.map((step) => (
            <div key={step.num} className="p-5 rounded-lg bg-ivory-100 border border-hairline space-y-2.5">
              <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                <h3 className="text-sm font-bold text-charcoal-900 font-display">{step.title}</h3>
                <span className="font-formula text-sm font-bold text-burgundy-500">{step.num}</span>
              </div>
              <p className="text-xs text-charcoal-100 leading-relaxed font-sans">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
