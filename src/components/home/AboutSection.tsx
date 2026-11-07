'use client';

import React from 'react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
              SECTION 07
            </span>
            <span className="text-hairline-strong">•</span>
            <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">
              About Dr. Omar Magdi • Academic Manifesto
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
            Behind Every Observation Lies a Question.
          </h2>
        </div>

        {/* Editorial Publication Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-y border-hairline py-8 sm:py-12">
          {/* Main Manifesto Prose */}
          <div className="lg:col-span-8 space-y-5 text-sm sm:text-base text-charcoal-100 leading-relaxed font-sans">
            <p>
              I am Dr. Omar Magdi. I dedicate my pedagogical practice to delivering an academic chemistry experience founded upon analytical inquiry, thermodynamic rigor, and conceptual clarity.
            </p>
            <p>
              I investigate what occurs beneath the surface of the reaction vessel: the physical mechanism explaining the phenomenon, the electronic structure directing the molecular geometry, and the mathematical logic that turns a formula into an intuitive deduction rather than a rote memorization task.
            </p>
            <p>
              I believe the role of genuine scientific education does not terminate with handing out the answer; it begins when the student acquires the mental instruments to arrive at the solution independently. My objective is to instill a disciplined scientific mindset that empowers students throughout chemistry and their future academic pursuits.
            </p>
          </div>

          {/* Academic Signature & Colophon */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-hairline pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between space-y-6">
            <div className="space-y-1.5">
              <span className="block font-display text-xl sm:text-2xl font-bold text-charcoal-900">
                Dr. Omar Magdi
              </span>
              <span className="block text-xs font-semibold text-burgundy-500 font-sans tracking-wide">
                Academic Director & Senior Fellow, PHENOL
              </span>
            </div>

            <div className="pt-4 border-t border-hairline space-y-1">
              <span className="font-serif italic font-semibold text-charcoal-900 text-sm sm:text-base block">
                “To Understand Is to Master.”
              </span>
              <span className="font-formula text-xs text-charcoal-50 block">
                Find the Simple. Master the Complex.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
