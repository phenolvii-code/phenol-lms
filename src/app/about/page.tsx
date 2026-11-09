'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, UserCheck, Mail, Send, ExternalLink, Award } from 'lucide-react';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Top Navigation Bar */}
      <header className="border-b border-hairline bg-ivory-100/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-charcoal-100 hover:text-charcoal-900 transition-colors text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <PhenolLogo size={32} subtitle="Dr. Omar Magdi" />

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
        {/* Header Block */}
        <div className="space-y-4 text-center sm:text-left border-b border-hairline pb-12">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-formula text-burgundy-500 font-bold uppercase tracking-widest">
            <UserCheck className="w-4 h-4" />
            <span>ACADEMIC PROFILE & MENTORSHIP</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal-900 font-display leading-tight">
            Dr. Omar Magdi
          </h1>

          <p className="text-base sm:text-lg text-charcoal-100 font-serif italic max-w-2xl">
            Academic Director & Senior Chemistry Fellow • Founder of PHENOL Academy
          </p>
        </div>

        {/* Bio & Manifesto Spread */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-8 space-y-6 text-sm sm:text-base text-charcoal-100 leading-relaxed font-sans">
            <p>
              I am Dr. Omar Magdi. Throughout my years of teaching and mentoring scholars in Egyptian and international chemistry curricula, I have observed a consistent pattern: students who struggle are rarely lacking in intellectual capacity; rather, they have been taught to memorize answers instead of understanding phenomena.
            </p>
            <p>
              My mission at PHENOL is to completely deconstruct the barrier between complex physical chemistry and intuitive student deduction. When a scholar understands <em>why</em> electrons move, <em>how</em> orbitals hybridize, and <em>what</em> thermodynamic equilibrium truly represents, memorization becomes an afterthought.
            </p>
            <p>
              I personally supervise every cohort at PHENOL. This means every weekly diagnostic problem set is reviewed under my academic direction, with individual feedback delivered directly to ensure no conceptual misconceptions take root.
            </p>
          </div>

          {/* Colophon Card */}
          <div className="md:col-span-4 p-6 rounded-lg bg-ivory-100 border border-hairline space-y-5">
            <div className="space-y-1">
              <span className="font-formula text-[10px] text-burgundy-500 font-bold uppercase tracking-widest block">
                CREDENTIALS & VISION
              </span>
              <h3 className="text-base font-bold font-display text-charcoal-900">
                Supervision Standards
              </h3>
            </div>

            <ul className="space-y-2 text-xs text-charcoal-100 font-sans">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500"></span>
                <span>Thanaweya Amma (Arabic & EN)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500"></span>
                <span>Cambridge & Edexcel (IGCSE / A-Level)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500"></span>
                <span>STEM High Schools Chemistry</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500"></span>
                <span>Undergraduate Pharmacy & Science</span>
              </li>
            </ul>

            <div className="pt-4 border-t border-hairline space-y-2">
              <span className="font-formula text-[10px] text-charcoal-50 uppercase block">
                Direct Communication
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://wa.me/201029208993"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  title="WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                </a>
                <a
                  href="https://t.me/Feynmanvii"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
                  title="Telegram"
                >
                  <Send className="w-4 h-4" />
                </a>
                <a
                  href="mailto:phenolvii@gmail.com"
                  className="p-2 rounded bg-burgundy-50 text-burgundy-700 hover:bg-burgundy-100 transition-colors"
                  title="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="pt-8 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-charcoal-900 font-display text-lg">
              Begin Your Journey with Dr. Omar Magdi
            </h4>
            <p className="text-xs text-charcoal-100 font-sans">
              Limited cohort seats to ensure direct problem-set review and individualized academic mentorship.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
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
          </div>
        </div>
      </main>
    </div>
  );
}
