'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Lightbulb, CheckCircle2, ChevronRight } from 'lucide-react';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

export default function MethodPage() {
  const { user: currentUser } = useCurrentUser();
  const feynmanSteps = [
    {
      num: '01',
      title: 'Target Concept Isolation',
      desc: 'Identify the exact physical or chemical phenomenon without jargon or obfuscation. Define what question nature is answering in this reaction vessel.',
      rule: 'State the premise in plain, precise terms.',
    },
    {
      num: '02',
      title: 'Elementary Deconstruction',
      desc: 'Explain the mechanism as if teaching an intelligent 12-year-old. Remove symbolic shortcuts and trace the physical trajectory of electrons from source to sink.',
      rule: 'If you must rely on complex jargon, you do not truly understand it yet.',
    },
    {
      num: '03',
      title: 'Diagnostic Gap Identification',
      desc: 'Highlight precisely where the explanation falters, where an unproven assumption was made, or where an energetic balance was ignored.',
      rule: 'Find the breakdown point in your own mental model before the exam finds it.',
    },
    {
      num: '04',
      title: 'Simplification & Rigorous Analogy',
      desc: 'Return to core physical laws (electrostatics, entropy, orbital symmetry) until the explanation flows smoothly, logically, and inevitably.',
      rule: 'True mastery arrives when the complex appears delightfully simple.',
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

          <PhenolLogo size={32} subtitle="The Feynman Protocol" />

          <Link
            href="/#programs"
            className="px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-sm"
          >
            Explore Courses
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 space-y-16">
        <div className="space-y-4 text-center sm:text-left border-b border-hairline pb-12">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-formula text-burgundy-500 font-bold uppercase tracking-widest">
            <Lightbulb className="w-4 h-4" />
            <span>PEDAGOGICAL METHODOLOGY</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal-900 font-display leading-tight">
            The Feynman Method in Chemical Science
          </h1>

          <p className="text-base sm:text-lg text-charcoal-100 font-serif italic max-w-2xl">
            “I couldn't reduce it to the freshman level. That means we don't really understand it.” — Richard Feynman
          </p>
        </div>

        {/* The 4 Stages */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold font-display text-charcoal-900">
            The Four-Stage Cognitive Protocol
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {feynmanSteps.map((s) => (
              <div key={s.num} className="p-6 bg-ivory-100 border border-hairline rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-hairline pb-2">
                  <span className="font-formula text-xs font-bold text-burgundy-500">STAGE {s.num}</span>
                  <span className="font-formula text-[10px] text-charcoal-50 uppercase">Protocol</span>
                </div>
                <h3 className="text-base font-bold font-display text-charcoal-900">{s.title}</h3>
                <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">{s.desc}</p>
                <div className="pt-2 text-[11px] font-formula text-burgundy-500 bg-burgundy-50/50 p-2 rounded border border-burgundy-100">
                  Rule: {s.rule}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Applied Example */}
        <section className="space-y-6 p-8 rounded-lg bg-ivory-100 border border-hairline">
          <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
            WORKED APPLICATION
          </span>
          <h3 className="text-xl font-bold font-display text-charcoal-900">
            Applying the Protocol: Electrophilic Aromatic Substitution
          </h3>
          <p className="text-sm text-charcoal-100 leading-relaxed font-sans">
            Instead of presenting the nitration of benzene as a set recipe (HNO₃ + H₂SO₄ → Nitrobenzene), Dr. Omar Magdi guides students through the Feynman protocol:
          </p>
          <ul className="space-y-3 text-xs sm:text-sm text-charcoal-100 font-sans">
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-burgundy-500 shrink-0 mt-0.5" />
              <span><strong>The Problem:</strong> The benzene ring has stable aromatic π-electrons (150 kJ/mol resonance energy). Normal electrophiles cannot disturb it.</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-burgundy-500 shrink-0 mt-0.5" />
              <span><strong>The Generation:</strong> We must generate an ultra-potent electron seeker: the nitronium ion (NO₂⁺), forced into existence by protonating nitric acid with concentrated sulfuric acid.</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-burgundy-500 shrink-0 mt-0.5" />
              <span><strong>The Arenium Intermediate:</strong> The aromaticity is temporarily broken to form the high-energy σ-complex, stabilized by delocalization across 5 ring carbons.</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-burgundy-500 shrink-0 mt-0.5" />
              <span><strong>Aromatization Restoration:</strong> Loss of a proton (H⁺) rapidly re-establishes the complete 6π aromatic octet, which is thermodynamically irresistible.</span>
            </li>
          </ul>
        </section>

        {/* Bottom CTA */}
        <div className="pt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-charcoal-900 font-display text-lg">
              Master Chemistry Through First Principles
            </h4>
            <p className="text-xs text-charcoal-100 font-sans">
              Learn how to solve any chemistry problem independently.
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
