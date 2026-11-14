'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { Navbar } from '@/components/layout/Navbar';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { getPlatformInstructors, syncPlatformInstructors } from '@/lib/data/instructors';
import { getInstructorRating } from '@/lib/data/reviews';
import { InstructorProfile } from '@/types/lms';
import { Sparkles, Mail, GraduationCap, ArrowRight, Star } from 'lucide-react';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import { Initials } from '@/components/ui/Initials';

export default function FacultyPage() {
  const { user: currentUser, signOut } = useCurrentUser();
  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [cachedAvatar, setCachedAvatar] = useState('');

  const loadInstructors = () => {
    const list = getPlatformInstructors();
    setInstructors(list);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const a = localStorage.getItem('phenol_global_instructor_avatar');
      if (a) setCachedAvatar(a);
    }
    loadInstructors();
    syncPlatformInstructors().then(() => loadInstructors());

    const handleUpdate = () => loadInstructors();
    window.addEventListener('phenol_instructors_updated', handleUpdate);
    window.addEventListener('phenol_user_profile_updated', handleUpdate);

    return () => {
      window.removeEventListener('phenol_instructors_updated', handleUpdate);
      window.removeEventListener('phenol_user_profile_updated', handleUpdate);
    };
  }, []);

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
          {instructors.map((faculty, idx) => {
            const isFounder =
              faculty.id === 'dr-omar-magdi' ||
              (faculty.email && faculty.email.toLowerCase() === 'phenolvii@gmail.com');

            const displayAvatar = isFounder
              ? (currentUser?.email?.toLowerCase() === 'phenolvii@gmail.com' && currentUser.avatar) ||
                cachedAvatar ||
                faculty.avatar
              : faculty.avatar;

            const displayName =
              isFounder && currentUser?.email?.toLowerCase() === 'phenolvii@gmail.com' && currentUser.name
                ? currentUser.name
                : faculty.name;

            const displayTitle =
              isFounder && currentUser?.email?.toLowerCase() === 'phenolvii@gmail.com' && currentUser.title
                ? currentUser.title
                : faculty.title;

            const displayBio =
              isFounder && currentUser?.email?.toLowerCase() === 'phenolvii@gmail.com' && currentUser.bio
                ? currentUser.bio
                : faculty.bio;

            const ratingData = getInstructorRating(faculty.id || '');

            return (
              <div
                key={faculty.id || idx}
                className="p-6 sm:p-8 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial transition-all space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  {/* Header with Avatar & Title */}
                  <div className="flex items-start gap-4 sm:gap-5">
                    <Link
                      href={`/faculty/${faculty.id || 'dr-omar-magdi'}`}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-hairline shrink-0 shadow-quiet bg-ivory-200 flex items-center justify-center hover:opacity-90 transition-opacity"
                    >
                      {displayAvatar ? (
                        <img
                          src={displayAvatar}
                          alt={displayName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Initials name={displayName} size="lg" />
                      )}
                    </Link>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/faculty/${faculty.id || 'dr-omar-magdi'}`}
                          className="text-lg sm:text-xl font-bold text-charcoal-900 font-display hover:text-burgundy-900 transition-colors"
                        >
                          {displayName}
                        </Link>
                        {isFounder ? (
                          <span className="font-formula text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-ivory-200 border border-hairline text-burgundy-900">
                            Founder & Chair
                          </span>
                        ) : (
                          <span className="font-formula text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-ivory-200 border border-hairline text-ochre-700">
                            Faculty Fellow
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-charcoal-100 font-sans font-medium leading-snug">
                        {displayTitle}
                      </p>
                      <span className="font-formula text-[11px] text-ochre-600 block pt-0.5">
                        {faculty.supervisionScope || 'Academic Teaching Chair'}
                      </span>

                      {/* Rating Stars & Count */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <div className="flex items-center text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= Math.round(ratingData.rating)
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-charcoal-100'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-formula font-bold text-charcoal-900">
                          {ratingData.rating.toFixed(1)}
                        </span>
                        <span className="text-[11px] text-charcoal-50 font-sans">
                          ({ratingData.count} evaluations)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio text */}
                  <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed line-clamp-3">
                    {displayBio}
                  </p>

                  {/* Specializations & Subjects */}
                  {faculty.subjects && faculty.subjects.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-hairline">
                      <span className="text-[11px] font-formula text-charcoal-50 uppercase tracking-wider block">
                        Curricular Disciplines
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {faculty.subjects.map((sub, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[11px] font-sans px-2.5 py-1 rounded bg-ivory-200 text-charcoal-900 border border-hairline font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Action Link to Dedicated Profile */}
                <div className="pt-4 border-t border-hairline flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/faculty/${faculty.id || 'dr-omar-magdi'}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 font-sans text-xs font-bold transition-all shadow-sm"
                  >
                    <span>View Academic Profile & Syllabi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
