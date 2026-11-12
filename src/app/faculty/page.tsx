'use client';

import React from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { Navbar } from '@/components/layout/Navbar';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { FACULTY_MEMBERS } from '@/data/mock-data';
import { Sparkles, Mail, GraduationCap, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';

export default function FacultyPage() {
  const { user: currentUser, signOut } = useCurrentUser();

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Navbar */}
      <Navbar currentUser={currentUser} onLogout={signOut} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full space-y-12">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-charcoal-100 font-sans">
          <Link href="/" className="hover:text-charcoal-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-charcoal-900 font-formula">
            Faculty & Fellows
          </span>
        </nav>

        {/* Masthead */}
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-ochre-500" />
              TEACHING CHAIRS & SCHOLASTIC MENTORS
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal-900 font-display tracking-tight">
            The Faculty of Phenol Academy
          </h1>

          <p className="text-sm sm:text-base text-charcoal-100 font-sans leading-relaxed">
            Our teaching chairs and fellows are dedicated to first-principles epistemology. Each educator deconstructs their scientific discipline into explainable causal mechanisms, banishing rote memorization across secondary, international, and undergraduate levels.
          </p>
        </div>

        {/* Faculty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {FACULTY_MEMBERS.map((faculty, idx) => {
            const displayAvatar = (idx === 0 && currentUser?.avatar) ? currentUser.avatar : faculty.avatar;
            const displayName = (idx === 0 && currentUser?.name) ? currentUser.name : faculty.name;
            const displayBio = (idx === 0 && currentUser?.bio) ? currentUser.bio : faculty.bio;
            const displayTitle = (idx === 0 && currentUser?.title) ? currentUser.title : faculty.title;

            return (
              <div
                key={faculty.id || idx}
                className="p-6 sm:p-8 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial transition-all space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  {/* Header with Avatar & Title */}
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-hairline shrink-0 shadow-quiet bg-ivory-200">
                      <img
                        src={displayAvatar}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
                          {displayName}
                        </h2>
                        {idx === 0 && (
                          <span className="font-formula text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-ivory-200 border border-hairline text-burgundy-900">
                            Founder & Chair
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-charcoal-100 font-sans font-medium leading-snug">
                        {displayTitle}
                      </p>
                      <span className="font-formula text-[11px] text-ochre-600 block pt-0.5">
                        {faculty.supervisionScope}
                      </span>
                    </div>
                  </div>

                  {/* Bio text */}
                  <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
                    {displayBio}
                  </p>

                {/* Specializations & Subjects */}
                <div className="space-y-2 pt-2 border-t border-hairline">
                  <span className="text-[11px] font-formula text-charcoal-50 uppercase tracking-wider block">
                    Curricular Disciplines
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
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-ivory-100 py-8 text-xs text-charcoal-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <PhenolLogo size={28} />
          <nav className="flex items-center gap-5 font-medium">
            <Link href="/#tracks" className="hover:text-burgundy-500 transition-colors">
              Tracks
            </Link>
            <Link href="/academy" className="hover:text-burgundy-500 transition-colors">
              Phenol Academy
            </Link>
            <Link href="/faculty" className="hover:text-burgundy-500 transition-colors font-semibold">
              Faculty
            </Link>
          </nav>
          <span className="text-charcoal-50 font-formula text-[11px]">
            © {new Date().getFullYear()} Phenol Academy
          </span>
        </div>
      </footer>
    </div>
  );
}
