'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { Navbar } from '@/components/layout/Navbar';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { ACADEMIC_TRACKS } from '@/data/mock-data';
import { getTopFeaturedInstructors, syncPlatformInstructors } from '@/lib/data/instructors';
import { getInstructorRating } from '@/lib/data/reviews';
import { InstructorProfile } from '@/types/lms';
import { Initials } from '@/components/ui/Initials';
import {
  ArrowRight,
  Atom,
  Globe2,
  Microscope,
  Compass,
  ChevronRight,
  Sparkles,
  Star,
} from 'lucide-react';

export default function Home() {
  const { user: currentUser, signOut } = useCurrentUser();
  const [featuredInstructors, setFeaturedInstructors] = useState<InstructorProfile[]>([]);
  const [cachedAvatar, setCachedAvatar] = useState('');

  const loadFeatured = () => {
    const list = getTopFeaturedInstructors();
    setFeaturedInstructors(list);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const a = localStorage.getItem('phenol_global_instructor_avatar');
      if (a) setCachedAvatar(a);
    }
    loadFeatured();
    syncPlatformInstructors().then(() => loadFeatured());

    const handleUpdate = () => loadFeatured();
    window.addEventListener('phenol_instructors_updated', handleUpdate);
    window.addEventListener('phenol_user_profile_updated', handleUpdate);

    return () => {
      window.removeEventListener('phenol_instructors_updated', handleUpdate);
      window.removeEventListener('phenol_user_profile_updated', handleUpdate);
    };
  }, []);

  const trackIcons = [
    <Atom key="1" className="w-5 h-5 text-burgundy-500" />,
    <Globe2 key="2" className="w-5 h-5 text-ochre-500" />,
    <Microscope key="3" className="w-5 h-5 text-burgundy-500" />,
    <Compass key="4" className="w-5 h-5 text-ochre-500" />,
  ];

  // Crisp one-line descriptions for each track
  const shortDescriptions: Record<string, string> = {
    'secondary-baccalaureate': 'Ministerial secondary sciences and French Baccalaureate curricula derived from first principles.',
    'igcse-alevels': 'Cambridge, Pearson Edexcel & Oxford AQA deconstruction with mark-scheme precision.',
    'undergrads': 'Advanced university modules for faculties of Pharmacy, Medicine, Science, and Engineering.',
    'public-courses': 'Open scientific masterclasses exploring natural laws, epistemology, and foundational reasoning.',
  };

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Editorial Academic Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={signOut}
      />

      <main className="flex-1 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-10 sm:space-y-12">
        {/* HERO SECTION: Logo beside Text + Motto + Single CTA */}
        <section className="text-center space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7 text-center sm:text-left">
            {/* Prominent Emblem */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet flex items-center justify-center shrink-0">
              <PhenolLogo size={76} withText={false} />
            </div>

            {/* Title and Motto ONLY */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-charcoal-900 font-display tracking-tight">
                Phenol Academy
              </h1>
              <p className="text-sm sm:text-base font-semibold text-burgundy-500 font-sans tracking-wide">
                To Understand Is To Master
              </p>
            </div>
          </div>

          {/* Single CTA Button */}
          <div>
            <Link
              href="/academy"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-xs sm:text-sm transition-all duration-200 shadow-md hover:shadow-lg ring-2 ring-burgundy-500/20"
            >
              <span>Know more about Phenol Academy</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* 2x2 SQUARE GRID: 4 Academic Track Cards (Compact, English Only, 1-Line Description) */}
        <section id="tracks" className="w-full space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {ACADEMIC_TRACKS.map((track, idx) => (
              <Link
                key={track.id}
                href={`/tracks/${track.id}`}
                className="group relative p-5 sm:p-6 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial hover:border-charcoal-200 transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Icon + Roman Numeral + Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-hairline pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-ivory-200 border border-hairline flex items-center justify-center shrink-0">
                        {trackIcons[idx] || <Atom className="w-4 h-4 text-burgundy-500" />}
                      </div>
                      <span className="font-formula text-[11px] font-bold text-charcoal-900 uppercase tracking-widest">
                        {track.romanNumeral}
                      </span>
                    </div>

                    <span className="font-formula text-[10px] text-ochre-600 font-semibold px-2 py-0.5 rounded bg-ivory-200 border border-hairline">
                      {track.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-charcoal-900 font-display group-hover:text-burgundy-900 transition-colors">
                    {track.name}
                  </h3>

                  {/* Single Line Description */}
                  <p className="text-xs text-charcoal-100 font-sans leading-relaxed line-clamp-2 sm:line-clamp-1">
                    {shortDescriptions[track.id] || track.description}
                  </p>
                </div>

                {/* Bottom Action Link */}
                <div className="pt-2.5 border-t border-hairline flex items-center justify-between text-xs font-semibold text-charcoal-900 group-hover:text-burgundy-500 transition-colors font-sans">
                  <span>Explore Track Syllabi</span>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-ivory-200 border border-hairline group-hover:bg-burgundy-500 group-hover:text-ivory-100 group-hover:border-burgundy-500 transition-all">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FEATURED TEACHING CHAIRS & SCHOLASTIC MENTORS */}
        <section className="w-full space-y-5 pt-4 border-t border-hairline">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-ochre-500" />
                ACADEMIC LEADERSHIP & TEACHING CHAIRS
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal-900 font-display mt-1">
                Distinguished Faculty Fellows
              </h2>
            </div>
            <Link
              href="/faculty"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-burgundy-600 hover:text-burgundy-900 transition-colors font-sans"
            >
              <span>Explore All Faculty Chairs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {featuredInstructors.map((inst, idx) => {
              const isFounder =
                inst.id === 'dr-omar-magdi' ||
                (inst.email && inst.email.toLowerCase() === 'phenolvii@gmail.com');

              const displayAvatar = isFounder
                ? (currentUser?.email?.toLowerCase() === 'phenolvii@gmail.com' && currentUser.avatar) ||
                  cachedAvatar ||
                  inst.avatar
                : inst.avatar;

              const displayName =
                isFounder && currentUser?.email?.toLowerCase() === 'phenolvii@gmail.com' && currentUser.name
                  ? currentUser.name
                  : inst.name;

              const displayTitle =
                isFounder && currentUser?.email?.toLowerCase() === 'phenolvii@gmail.com' && currentUser.title
                  ? currentUser.title
                  : inst.title;

              const ratingData = getInstructorRating(inst.id || '');

              return (
                <div
                  key={inst.id || idx}
                  className="p-5 sm:p-6 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <Link
                        href={`/faculty/${inst.id || 'dr-omar-magdi'}`}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-hairline shrink-0 shadow-quiet bg-ivory-200 flex items-center justify-center hover:opacity-90 transition-opacity"
                      >
                        {displayAvatar ? (
                          <img
                            src={displayAvatar}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Initials name={displayName} size="md" />
                        )}
                      </Link>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/faculty/${inst.id || 'dr-omar-magdi'}`}
                            className="text-base sm:text-lg font-bold text-charcoal-900 font-display hover:text-burgundy-900 transition-colors truncate"
                          >
                            {displayName}
                          </Link>
                          {isFounder ? (
                            <span className="font-formula text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-ivory-200 border border-hairline text-burgundy-900">
                              Founder & Chair
                            </span>
                          ) : (
                            <span className="font-formula text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-ivory-200 border border-hairline text-ochre-700">
                              Faculty Fellow
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-100 font-sans line-clamp-1">
                          {displayTitle}
                        </p>
                        {/* Rating */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
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
                          <span className="text-[10px] text-charcoal-50 font-sans">
                            ({ratingData.count})
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-charcoal-100 font-sans leading-relaxed line-clamp-2">
                      {inst.bio}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs">
                    <span className="text-[11px] font-formula text-ochre-700 font-semibold truncate max-w-[180px]">
                      {inst.supervisionScope || 'Academic Teaching Chair'}
                    </span>
                    <Link
                      href={`/faculty/${inst.id || 'dr-omar-magdi'}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-burgundy-600 hover:text-burgundy-900 transition-colors font-sans"
                    >
                      <span>View Profile & Courses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-ivory-100 py-6 text-xs text-charcoal-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <PhenolLogo size={28} />

          <nav className="flex items-center gap-5 font-medium">
            <Link href="/#tracks" className="hover:text-burgundy-500 transition-colors font-semibold">
              Tracks
            </Link>
            <Link href="/academy" className="hover:text-burgundy-500 transition-colors">
              Phenol Academy
            </Link>
            <Link href="/faculty" className="hover:text-burgundy-500 transition-colors">
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
