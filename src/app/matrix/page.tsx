'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Layers, Check, X } from 'lucide-react';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

export default function MatrixPage() {
  const { user: currentUser } = useCurrentUser();
  const comparisonRows = [
    {
      dimension: 'Organic Chemistry',
      conventional: 'Memorizing 120+ disconnected reactions, reagents, and catalyst conditions as recipes.',
      phenol: 'Curved-arrow electron pushing mechanisms based on electronegativity, steric hindrance, and orbital overlap.',
    },
    {
      dimension: 'Equilibrium & Kinetics',
      conventional: 'Reciting Le Chatelier rules mechanically without understanding why constants stay constant.',
      phenol: 'Rigorous thermodynamic derivations: reaction quotient Q versus K, van \'t Hoff relationships, and Gibbs free energy ΔG.',
    },
    {
      dimension: 'Electrochemistry',
      conventional: 'Rote calculation of cell potentials (E°cell = E°cathode - E°anode) without energetic comprehension.',
      phenol: 'Thermodynamic coupling of chemical potential and electrical work (ΔG° = -nFE°) and Nernst non-standard concentration shifts.',
    },
    {
      dimension: 'Problem Solving Style',
      conventional: 'Matching exam questions to previously seen templates; panic ensues when a condition changes.',
      phenol: 'First-principles deduction from foundational laws; resilient against novel and non-routine question architectures.',
    },
    {
      dimension: 'Student Retention',
      conventional: 'Sharp memory decay curve; concepts evaporate within 3 weeks post-examination.',
      phenol: 'Deep structural mental models that endure throughout university pre-med, engineering, pharmacy, and science faculties.',
    },
  ];

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Top Navigation Bar */}
      <header className="border-b border-hairline bg-ivory-100/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-charcoal-100 hover:text-charcoal-900 transition-colors text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <PhenolLogo size={32} subtitle="Analytical Matrix" />

          <Link
            href="/#programs"
            className="px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-sm"
          >
            Explore Courses
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 space-y-16">
        <div className="space-y-4 text-center sm:text-left border-b border-hairline pb-12">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-formula text-burgundy-500 font-bold uppercase tracking-widest">
            <Layers className="w-4 h-4" />
            <span>PEDAGOGICAL COMPARISON MATRIX</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal-900 font-display leading-tight">
            Surface Memorization vs. First Principles
          </h1>

          <p className="text-base sm:text-lg text-charcoal-100 font-serif italic max-w-2xl">
            A granular comparison of conventional rote coaching versus the structural cognitive methodology directed by Dr. Omar Magdi.
          </p>
        </div>

        {/* Matrix Comparison Table */}
        <div className="border border-hairline rounded-lg overflow-hidden bg-ivory-100 shadow-quiet">
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-hairline bg-ivory-300 text-xs font-bold font-formula uppercase tracking-wider">
            <div className="md:col-span-3 p-4 text-charcoal-900">Cognitive Dimension</div>
            <div className="md:col-span-4 p-4 text-rose-800 flex items-center gap-1.5 border-t md:border-t-0 md:border-l border-hairline">
              <X className="w-4 h-4" />
              <span>Conventional Rote Learning</span>
            </div>
            <div className="md:col-span-5 p-4 text-emerald-800 flex items-center gap-1.5 border-t md:border-t-0 md:border-l border-hairline bg-emerald-50/50">
              <Check className="w-4 h-4 text-emerald-700" />
              <span>PHENOL First Principles Protocol</span>
            </div>
          </div>

          <div className="divide-y divide-hairline">
            {comparisonRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 text-xs sm:text-sm font-sans">
                <div className="md:col-span-3 p-4 font-bold text-charcoal-900 font-display bg-ivory-50/50">
                  {row.dimension}
                </div>
                <div className="md:col-span-4 p-4 text-charcoal-100 border-t md:border-t-0 md:border-l border-hairline leading-relaxed">
                  {row.conventional}
                </div>
                <div className="md:col-span-5 p-4 text-charcoal-900 font-medium border-t md:border-t-0 md:border-l border-hairline bg-emerald-50/20 leading-relaxed">
                  {row.phenol}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="pt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-charcoal-900 font-display text-lg">
              Elevate Your Chemical Cognition
            </h4>
            <p className="text-xs text-charcoal-100 font-sans">
              Experience the clarity of understanding every formula from first principles.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {currentUser ? (
              <Link
                href="/dashboard"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer ring-2 ring-burgundy-500/20"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer ring-2 ring-burgundy-500/20"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-ivory-100 hover:bg-ivory-300 active:scale-[0.98] border-2 border-burgundy-500 text-burgundy-500 hover:text-burgundy-900 font-sans font-bold text-sm transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
