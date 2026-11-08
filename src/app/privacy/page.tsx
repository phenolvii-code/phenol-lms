'use client';

import React from 'react';
import Link from 'next/link';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { Shield, ArrowLeft, Lock, Mail, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
              <Shield className="w-3.5 h-3.5" />
              <span>Official Academic Policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-editorial font-bold text-charcoal-900 tracking-tight">
              Privacy Policy & Data Governance
            </h1>
            <p className="text-sm text-charcoal-100 font-mono">
              PHENOL Academy • Directed by Dr. Omar Magdi • Last Updated: November 2026
            </p>
          </div>

          {/* Introductory Abstract */}
          <div className="bg-ivory-50 p-5 rounded-xl border border-hairline/80 text-sm text-charcoal-900 leading-relaxed space-y-2">
            <p className="font-semibold text-burgundy-900">Academic Integrity & Scholar Confidentiality</p>
            <p className="text-xs text-charcoal-100">
              PHENOL Academy (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Academy&rdquo;), operated by Dr. Omar Magdi at{' '}
              <span className="font-mono text-charcoal-900">https://phenol-lms.vercel.app</span>, is committed to safeguarding
              the personal and academic data of our enrolled students and scholars. This Privacy Policy details how we collect, utilize,
              protect, and handle your information when you register, sign in using Google Identity Services, and participate in our chemistry curriculum.
            </p>
          </div>

          {/* Section 1: Information Collected */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold font-editorial text-charcoal-900 border-l-2 border-burgundy-900 pl-3">
              1. Information We Collect
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed">
              We collect only the minimum necessary information required to authenticate students, maintain academic integrity,
              and deliver chemistry lectures and educational resources:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-ivory-50 border border-hairline space-y-1.5">
                <p className="font-bold text-charcoal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Google Identity Information
                </p>
                <p className="text-charcoal-100">
                  When you sign in using Google OAuth / Google Identity Services, we receive your verified email address, full name,
                  and profile avatar picture. We do not receive or request access to your Google Drive, contacts, or passwords.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-ivory-50 border border-hairline space-y-1.5">
                <p className="font-bold text-charcoal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Academic & Contact Information
                </p>
                <p className="text-charcoal-100">
                  Enrolled students provide an active WhatsApp mobile number and select their Academic Track (e.g. General Secondary,
                  Advanced Placement, or First-Principles Chemistry) to receive personal mentoring and course notices.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-ivory-50 border border-hairline space-y-1.5">
                <p className="font-bold text-charcoal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Academic Progress & Telemetry
                </p>
                <p className="text-charcoal-100">
                  Lesson completion timestamps, quiz submissions, assigned unique Academic Identification Codes (`PH-XXXX-Y`), and
                  course completion records.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-ivory-50 border border-hairline space-y-1.5">
                <p className="font-bold text-charcoal-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Technical Security Watermarks
                </p>
                <p className="text-charcoal-100">
                  Proprietary video player controls carry forensic academic identifiers to protect Dr. Omar Magdi&rsquo;s intellectual
                  property and prevent illicit video redistribution.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: How We Use Data */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold font-editorial text-charcoal-900 border-l-2 border-burgundy-900 pl-3">
              2. Purpose of Data Processing
            </h2>
            <ul className="list-disc list-inside text-xs sm:text-sm text-charcoal-100 space-y-2 leading-relaxed">
              <li>
                <strong className="text-charcoal-900">Student Authentication:</strong> Authenticate student identities securely via Google OAuth and email credentials without exposing sensitive passwords.
              </li>
              <li>
                <strong className="text-charcoal-900">Direct Academic Mentorship:</strong> Enable Dr. Omar Magdi and the teaching staff to contact enrolled students via WhatsApp regarding homework corrections, live question-and-answer seminars, and exam schedules.
              </li>
              <li>
                <strong className="text-charcoal-900">Curriculum Progression:</strong> Save video lesson progress, track problem-solving proficiency, and grant access to advanced modules upon completion of foundational units.
              </li>
            </ul>
          </section>

          {/* Section 3: Google API Services User Data Policy Compliance */}
          <section className="space-y-4 p-5 rounded-xl bg-burgundy-50/40 border border-burgundy-200">
            <h2 className="text-base font-bold font-editorial text-burgundy-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-burgundy-900" />
              3. Google API Services User Data Policy Compliance
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-900 leading-relaxed font-sans">
              PHENOL Academy&rsquo;s use and transfer to any other app of information received from Google APIs will strictly adhere to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
                className="text-burgundy-900 underline font-semibold hover:text-burgundy-700"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements:
            </p>
            <ul className="list-disc list-inside text-xs text-charcoal-100 space-y-1.5 pl-2">
              <li>We never use Google user data for advertising, retargeting, or profiling purposes.</li>
              <li>We never sell, rent, or transfer student Google data to third-party data brokers.</li>
              <li>Human access to user data is strictly limited to Dr. Omar Magdi and authorized administrative staff to resolve technical or academic support issues.</li>
            </ul>
          </section>

          {/* Section 4: Data Security and Retention */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold font-editorial text-charcoal-900 border-l-2 border-burgundy-900 pl-3">
              4. Security, Storage & Deletion Rights
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed">
              All communications between your browser and our platform are encrypted in transit via Transport Layer Security (TLS/HTTPS).
              Student authentication records are housed in high-security, ISO-27001-certified database clusters.
            </p>
            <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed">
              <strong className="text-charcoal-900">Your Right to Erasure:</strong> Any student may request the permanent deletion of their account, academic records, and personal contact info at any time by emailing the director directly at{' '}
              <span className="font-mono text-burgundy-900 font-semibold">phenolvii@gmail.com</span>. All associated data will be removed within 48 hours.
            </p>
          </section>

          {/* Section 5: Academic Contact Information */}
          <section className="pt-6 border-t border-hairline space-y-3">
            <h2 className="text-base font-bold font-editorial text-charcoal-900">
              5. Contact Academic Administration
            </h2>
            <div className="text-xs text-charcoal-100 space-y-1 font-mono">
              <p>Platform: PHENOL Academy (<span className="text-burgundy-900">https://phenol-lms.vercel.app</span>)</p>
              <p>Academic Director: Dr. Omar Magdi</p>
              <p>Inquiries & Privacy Requests: <a href="mailto:phenolvii@gmail.com" className="text-burgundy-900 underline font-bold">phenolvii@gmail.com</a></p>
            </div>
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