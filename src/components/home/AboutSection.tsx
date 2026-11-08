'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-14 sm:py-18 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-8">
        {/* Section Heading with Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                SECTION 07 • ABOUT DR. OMAR MAGDI
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
              Behind Every Observation Lies a Question.
            </h2>

            <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
              Dedicated to delivering an academic chemistry experience founded upon analytical inquiry, thermodynamic rigor, and conceptual clarity.
            </p>
          </div>

          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs font-semibold transition-colors shadow-quiet shrink-0"
          >
            <span>Read Full Biography & Manifesto</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Concise Excerpt Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-hairline pt-6">
          <div className="lg:col-span-8 space-y-4 text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
            <p>
              I am Dr. Omar Magdi. I dedicate my pedagogical practice to investigating what occurs beneath the surface of the reaction vessel: the physical mechanism explaining the phenomenon, the electronic structure directing the molecular geometry, and the mathematical logic that turns a formula into an intuitive deduction.
            </p>
            <p>
              Genuine scientific education does not terminate with handing out the answer; it begins when the student acquires the mental instruments to arrive at the solution independently.
            </p>
          </div>

          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-hairline pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <span className="block font-display text-lg font-bold text-charcoal-900">
                Dr. Omar Magdi
              </span>
              <span className="block text-xs font-semibold text-burgundy-500 font-sans tracking-wide">
                Academic Director & Senior Fellow, PHENOL
              </span>
            </div>

            <div className="pt-3 border-t border-hairline space-y-0.5">
              <span className="font-serif italic font-semibold text-charcoal-900 text-xs sm:text-sm block">
                “To Understand Is to Master.”
              </span>
              <span className="font-formula text-[11px] text-charcoal-50 block">
                Find the Simple. Master the Complex.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
