'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { Navbar } from '@/components/layout/Navbar';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { OurPhilosophySection } from '@/components/academy/OurPhilosophySection';
import { getTopFeaturedInstructors, syncPlatformInstructors } from '@/lib/data/instructors';
import { getInstructorRating } from '@/lib/data/reviews';
import { InstructorProfile } from '@/types/lms';
import { Initials } from '@/components/ui/Initials';
import { Sparkles, ArrowRight, GraduationCap, Users, Star } from 'lucide-react';

export default function AcademyPage() {
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

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Editorial Academic Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={signOut}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-12">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-charcoal-100 font-sans">
          <Link href="/" className="hover:text-charcoal-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-charcoal-900 font-formula">
            Phenol Academy
          </span>
        </nav>

        {/* Masthead Banner */}
        <section className="p-8 sm:p-12 rounded-3xl bg-ivory-100 border border-hairline shadow-quiet space-y-6">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-ochre-500" />
                FIRST-PRINCIPLES SCIENTIFIC COGNITION
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-charcoal-900 font-display tracking-tight leading-tight">
              Phenol Academy
            </h1>

            <p className="text-base sm:text-lg text-charcoal-100 font-sans leading-relaxed">
              We reject the industrialization of rote memorization. Phenol Academy is an intellectual sanctuary where the foundational natural sciences—chemistry, physics, and biology—are derived from causal mechanisms, conservation laws, and intuitive first principles.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/#tracks"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg ring-2 ring-burgundy-500/20"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Explore The 4 Academic Tracks</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/faculty"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 font-sans font-bold text-xs sm:text-sm border border-hairline transition-colors shadow-quiet"
              >
                <Users className="w-4 h-4 text-burgundy-500" />
                <span>Faculty & Teaching Chairs</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Consolidated Single Philosophy Section with Dr. Omar & Feynman Quotes */}
        <div id="philosophy">
          <OurPhilosophySection />
        </div>

        {/* Faculty Direct Callout & Top Rated Instructors */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-hairline pb-4">
            <div>
              <span className="font-formula text-xs text-ochre-600 font-bold uppercase tracking-wider block">
                ACADEMIC LEADERSHIP
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display mt-1">
                Meet Our Teaching Chairs & Faculty Fellows
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-100 font-sans mt-0.5">
                Distinguished educators across secondary, international, and university levels committed to conceptual clarity and student mastery.
              </p>
            </div>

            <Link
              href="/faculty"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-charcoal-900 hover:bg-burgundy-900 text-ivory-100 font-sans text-xs font-bold transition-all shadow-md"
            >
              <span>View All Faculty</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="p-6 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <Link
                        href={`/faculty/${inst.id || 'dr-omar-magdi'}`}
                        className="w-16 h-16 rounded-2xl overflow-hidden border border-hairline shrink-0 shadow-quiet bg-ivory-200 flex items-center justify-center hover:opacity-90 transition-opacity"
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
                            ({ratingData.count} evaluations)
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-charcoal-100 font-sans leading-relaxed line-clamp-2">
                      {inst.bio}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs">
                    <span className="text-[11px] font-formula text-ochre-700 font-semibold truncate max-w-[200px]">
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

      {/* Clean Footer */}
      <footer className="border-t border-hairline bg-ivory-100 py-8 text-xs text-charcoal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <PhenolLogo size={28} />

          <nav className="flex items-center gap-6 font-medium">
            <Link href="/#tracks" className="hover:text-burgundy-500 transition-colors">
              Academic Tracks
            </Link>
            <Link href="/academy" className="hover:text-burgundy-500 transition-colors font-bold text-charcoal-900">
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
