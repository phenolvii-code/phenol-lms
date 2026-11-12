'use client';

import React from 'react';
import Link from 'next/link';
import { FACULTY_MEMBERS } from '@/data/mock-data';
import { Sparkles, Mail, MessageCircle, ArrowRight, Award, GraduationCap } from 'lucide-react';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';

export const FacultySection: React.FC = () => {
  return (
    <section id="faculty" className="py-16 sm:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      <div className="space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-ochre-500" />
              ACADEMIC FELLOWS & TEACHING CHAIRS
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
              The Faculty of Phenol Academy
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
              Directed by Dr. Omar Magdi, our teaching faculty comprises rigorous scholars committed to first-principles scientific cognition, eliminating rote memorization across all secondary and university disciplines.
            </p>
          </div>

          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-ivory-100 hover:bg-ivory-300 text-charcoal-900 text-xs font-semibold border border-hairline transition-colors shadow-quiet shrink-0"
          >
            <span>Read Dr. Omar&apos;s Manifesto</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Faculty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {FACULTY_MEMBERS.map((faculty, idx) => (
            <div
              key={faculty.id || idx}
              className="p-6 sm:p-8 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial transition-all space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-5">
                {/* Header with Avatar & Title */}
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-hairline shrink-0 shadow-quiet bg-ivory-200">
                    <img
                      src={faculty.avatar}
                      alt={faculty.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
                        {faculty.name}
                      </h3>
                      {idx === 0 && (
                        <span className="font-formula text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-ivory-200 border border-hairline text-burgundy-900">
                          Founder & Chair
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-charcoal-100 font-sans font-medium leading-snug">
                      {faculty.title}
                    </p>
                    <span className="font-formula text-[11px] text-ochre-600 block pt-0.5">
                      {faculty.supervisionScope}
                    </span>
                  </div>
                </div>

                {/* Bio text */}
                <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
                  {faculty.bio}
                </p>

                {/* Specializations & Subjects */}
                <div className="space-y-2 pt-2 border-t border-hairline">
                  <span className="text-[11px] font-formula text-charcoal-50 uppercase tracking-wider block">
                    Focus Areas & Disciplines
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {faculty.subjects?.map((sub, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[11px] font-sans px-2.5 py-1 rounded bg-ivory-200 text-charcoal-900 border border-hairline font-medium"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct Communication & Course Links */}
              <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-3">
                <Link
                  href="/#tracks"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-900 hover:text-burgundy-500 transition-colors font-sans"
                >
                  <GraduationCap className="w-4 h-4 text-burgundy-500" />
                  <span>View Curricula & Tracks</span>
                </Link>

                <div className="flex items-center gap-2">
                  {faculty.whatsapp && (
                    <a
                      href={faculty.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 border border-hairline text-xs font-semibold transition-colors"
                      title="Direct WhatsApp Communication"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-charcoal-900" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {faculty.email && (
                    <a
                      href={`mailto:${faculty.email}`}
                      className="p-2 rounded-lg bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 border border-hairline text-xs transition-colors"
                      title="Direct Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
