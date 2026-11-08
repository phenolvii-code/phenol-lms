'use client';

import React from 'react';
import Link from 'next/link';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { FileText, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased flex flex-col">
      {/* Editorial Header */}
      <header className="border-b border-hairline bg-ivory-100/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <PhenolLogo size={34} subtitle="Academic Chemistry" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-burgundy-900 hover:text-burgundy-700 transition-colors px-3 py-1.5 rounded-md hover:bg-ivory-300"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Academy</span>
          </Link>
        </div>
      </header>

      {/* Main Document Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white rounded-2xl border border-hairline p-6 sm:p-12 shadow-sm space-y-10">
          {/* Document Header */}
          <div className="border-b border-hairline pb-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-burgundy-50 border border-burgundy-200 text-burgundy-900 text-xs font-mono">
              <FileText className="w-3.5 h-3.5" />
              <span>Academic Regulations</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-editorial font-bold text-charcoal-900 tracking-tight">
              Terms of Service & Academic Agreement
            </h1>
            <p className="text-sm text-charcoal-100 font-mono">
              PHENOL Academy • Directed by Dr. Omar Magdi • Effective: November 2026
            </p>
          </div>

          {/* Section 1: Acceptance of Terms */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-editorial text-charcoal-900 border-l-2 border-burgundy-900 pl-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed">
              By accessing, registering, or enrolling in PHENOL Academy (<span className="font-mono text-charcoal-900">https://phenol-lms.vercel.app</span>),
              you agree to be bound by these Academic Terms of Service. If you do not accept these terms in full, you may not access our video lectures, problem sets, or proprietary learning materials.
            </p>
          </section>

          {/* Section 2: Intellectual Property & Forensic Watermarking */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold font-editorial text-charcoal-900 border-l-2 border-burgundy-900 pl-3">
              2. Intellectual Property & Forensic Protection
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed">
              All scientific curricula, chemical reaction mechanism animations, video lectures, pedagogical diagrams, and course notes
              are the exclusive intellectual property of <strong>Dr. Omar Magdi</strong> and PHENOL Academy.
            </p>
            <div className="p-4 rounded-xl bg-burgundy-50/50 border border-burgundy-200 text-xs text-charcoal-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-burgundy-900">
                <AlertCircle className="w-4 h-4 text-burgundy-900" />
                Forensic Watermarking & Leak Prevention
              </p>
              <p className="text-charcoal-100 leading-relaxed">
                To protect our proprietary teaching material, all video playback incorporates dynamic, stealth forensic academic watermarks
                tied directly to each student&rsquo;s individual identification code (`PH-XXXX-Y`). Recording, distributing, reselling, or public
                broadcasting of video streams without written authorization results in immediate account revocation and legal follow-up.
              </p>
            </div>
          </section>

          {/* Section 3: Student Conduct & Accounts */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold font-editorial text-charcoal-900 border-l-2 border-burgundy-900 pl-3">
              3. Student Account Governance
            </h2>
            <ul className="list-disc list-inside text-xs sm:text-sm text-charcoal-100 space-y-2 leading-relaxed">
              <li>Each enrollment is strictly personal and non-transferable. Account sharing between multiple students is prohibited.</li>
              <li>Students must maintain an accurate and active WhatsApp mobile number to receive course updates and exam schedules.</li>
              <li>Students must uphold rigorous academic integrity during all evaluations, quizzes, and problem-solving assignments.</li>
            </ul>
          </section>

          {/* Section 4: Contact & Inquiries */}
          <section className="pt-6 border-t border-hairline space-y-2">
            <h2 className="text-base font-bold font-editorial text-charcoal-900">
              4. Inquiries & Administration
            </h2>
            <p className="text-xs text-charcoal-100 font-mono">
              For academic or legal questions, contact Dr. Omar Magdi directly at{' '}
              <a href="mailto:phenolvii@gmail.com" className="text-burgundy-900 underline font-bold">
                phenolvii@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline py-8 bg-ivory-100 text-center text-xs text-charcoal-50 font-sans">
        <p>© {new Date().getFullYear()} PHENOL Academy • Directed by Dr. Omar Magdi • All Rights Reserved</p>
      </footer>
    </div>
  );
}