'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

export default function PhilosophyPage() {
  const { user: currentUser } = useCurrentUser();
  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Top Navigation Bar */}
      <header className="border-b border-hairline bg-ivory-100/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-charcoal-100 hover:text-charcoal-900 transition-colors text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <PhenolLogo size={32} subtitle="Philosophy" />

          <Link
            href="/#programs"
            className="px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-sm"
          >
            Explore Courses
          </Link>
        </div>
      </header>

      {/* Main Philosophy Manifesto */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 space-y-16">
        {/* Header Block */}
        <div className="space-y-4 text-center sm:text-left border-b border-hairline pb-12">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-formula text-burgundy-500 font-bold uppercase tracking-widest">
            <Sparkles className="w-4 h-4" />
            <span>CORE PEDAGOGICAL MANIFESTO</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal-900 font-display leading-tight">
            The Epistemological Foundations of Chemical Rigor
          </h1>

          <p className="text-base sm:text-lg text-charcoal-100 font-serif italic max-w-2xl">
            “To Understand Is to Master.” — Why Chemistry is a physical, deductive discipline rather than a catalogue of reactions.
          </p>

          <div className="pt-2 flex items-center justify-center sm:justify-start gap-4 text-xs font-formula text-charcoal-50">
            <span>By Dr. Omar Magdi</span>
            <span>•</span>
            <span>Academic Director, PHENOL</span>
            <span>•</span>
            <span>Est. 2026/2027</span>
          </div>
        </div>

        {/* Prose Section 1: The Trap of Surface Recall */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-display text-charcoal-900">
            1. The Crisis of Surface Memorization
          </h2>
          <p className="text-charcoal-100 text-base leading-relaxed">
            Conventional science education frequently reduces chemistry to brute-force memorization. Students are presented with reagents, catalysts, and balancing coefficients as isolated dogmas to be committed to short-term memory prior to an exam. This model creates an illusion of competence that collapses instantly upon facing a non-routine ministerial or international problem.
          </p>
          <p className="text-charcoal-100 text-base leading-relaxed">
            When a problem shifts conditions slightly — replacing a standard alkyl halide with a sterically hindered substrate, or altering a thermodynamic coordinate — the student relying on rote recall possesses no structural mental framework to deduce the outcome.
          </p>
        </section>

        {/* Prose Section 2: First-Principles Chemical Thinking */}
        <section className="space-y-6 p-8 rounded-lg bg-ivory-100 border border-hairline">
          <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
            THE PHENOL PRINCIPLE
          </span>
          <h3 className="text-xl font-bold font-display text-charcoal-900">
            Every Chemical Phenomenon Has a Thermodynamic & Physical Cause
          </h3>
          <p className="text-charcoal-100 text-base leading-relaxed">
            At PHENOL, every reaction mechanism is deconstructed down to three immutable physical pillars:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="space-y-2">
              <span className="font-formula text-xs font-bold text-burgundy-500">PILLAR 01</span>
              <h4 className="font-bold text-charcoal-900 font-display text-sm">Electronic Structure</h4>
              <p className="text-xs text-charcoal-100 leading-relaxed">
                Electron density distributions, electrophilicity, nucleophilicity, and orbital overlap dictate where reactions occur.
              </p>
            </div>
            <div className="space-y-2">
              <span className="font-formula text-xs font-bold text-burgundy-500">PILLAR 02</span>
              <h4 className="font-bold text-charcoal-900 font-display text-sm">Thermodynamics</h4>
              <p className="text-xs text-charcoal-100 leading-relaxed">
                Free energy (ΔG), enthalpy, and entropy determine which states are favorable and where dynamic equilibria rest.
              </p>
            </div>
            <div className="space-y-2">
              <span className="font-formula text-xs font-bold text-burgundy-500">PILLAR 03</span>
              <h4 className="font-bold text-charcoal-900 font-display text-sm">Kinetics & Activation</h4>
              <p className="text-xs text-charcoal-100 leading-relaxed">
                Transition-state geometries and activation barriers (Ea) explain the velocity and pathway of competing mechanisms.
              </p>
            </div>
          </div>
        </section>

        {/* Prose Section 3: The Phenol Case Study */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-display text-charcoal-900">
            2. Case in Point: Why Is Phenol (C₆H₅OH) Weakly Acidic?
          </h2>
          <p className="text-charcoal-100 text-base leading-relaxed">
            A traditional student memorizes: <em>"Phenol is acidic, ethanol is neutral."</em> A PHENOL scholar understands the resonance canonical delocalization: the unshared electron pair on the oxygen atom overlaps with the aromatic π-electron cloud.
          </p>
          <div className="p-4 bg-ivory-100 border border-hairline rounded font-formula text-center text-sm text-charcoal-900">
            C₆H₅OH ⇌ C₆H₅O⁻ + H⁺ &nbsp;&nbsp;|&nbsp;&nbsp; pKa = 9.95
          </div>
          <p className="text-charcoal-100 text-base leading-relaxed">
            This resonance hybrid delocalizes the negative charge onto the ortho and para positions of the benzene ring, thermodynamically stabilizing the phenoxide anion. Because the conjugate base is stabilized, proton release is facilitated. No memorization required: the property is a direct logical consequence of orbital delocalization.
          </p>
        </section>

        {/* Bottom Call to Action */}
        <div className="pt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-charcoal-900 font-display text-lg">
              Ready to Experience First-Principles Chemistry?
            </h4>
            <p className="text-xs text-charcoal-100 font-sans">
              Join the 2026/2027 academic cohort under the personal supervision of Dr. Omar Magdi.
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
