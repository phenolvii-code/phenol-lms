'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { Navbar } from '@/components/layout/Navbar';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { ACADEMIC_TRACKS, normalizeTrackSlug, INSTRUCTOR } from '@/data/mock-data';
import { getStoredCourses, syncWithServerCourses } from '@/lib/courses-storage';
import { ChemistryCourse } from '@/types/lms';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Clock,
  GraduationCap,
  Layers,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';

export default function TrackPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { user: currentUser, signOut } = useCurrentUser();

  const [coursesList, setCoursesList] = useState<ChemistryCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const track = ACADEMIC_TRACKS.find((t) => t.id === slug) || ACADEMIC_TRACKS[0];

  useEffect(() => {
    setCoursesList(getStoredCourses());
    syncWithServerCourses().then((data) => {
      setCoursesList(data);
      setLoading(false);
    });

    const handleUpdate = () => {
      setCoursesList(getStoredCourses());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('phenol_courses_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('phenol_courses_updated', handleUpdate);
    };
  }, []);

  // Filter courses that belong to this track and are approved
  const trackCourses = coursesList.filter((c) => {
    if (c.approvalStatus === 'PENDING' || c.approvalStatus === 'REJECTED') {
      return false;
    }
    const norm = normalizeTrackSlug(c.category);
    return norm === track.id || c.trackSlug === track.id;
  });

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      {/* Navbar */}
      <Navbar currentUser={currentUser} onLogout={signOut} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-12">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-charcoal-100 font-sans">
          <Link href="/" className="hover:text-charcoal-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/#tracks" className="hover:text-charcoal-900 transition-colors">
            Tracks
          </Link>
          <span>/</span>
          <span className="font-semibold text-charcoal-900 font-formula">
            {track.name}
          </span>
        </nav>

        {/* Track Hero Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-ivory-100 border border-hairline shadow-quiet space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="font-formula text-xs font-bold uppercase tracking-widest text-burgundy-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-ochre-500" />
              {track.romanNumeral} • ACADEMIC CURRICULAR TRACK
            </span>
            <span className="font-formula text-xs text-ochre-600 font-semibold px-3 py-1 rounded bg-ivory-200 border border-hairline">
              {track.badge}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal-900 font-display">
              {track.name}
            </h1>
            <p className="text-base sm:text-lg font-semibold text-burgundy-500 font-sans">
              {track.nameAr}
            </p>
          </div>

          <p className="text-sm sm:text-base text-charcoal-100 leading-relaxed font-sans max-w-3xl">
            {track.description}
          </p>

          {/* Subjects Badges */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <span className="text-[11px] font-formula text-charcoal-50 uppercase tracking-wider block">
              Curricular Subjects & Disciplinary Scope
            </span>
            <div className="flex flex-wrap gap-2">
              {track.subjects.map((sub, sIdx) => (
                <span
                  key={sIdx}
                  className="text-xs font-sans px-3 py-1 rounded bg-ivory-200 text-charcoal-900 border border-hairline font-medium"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-900 font-display">
                Curricular Cohorts & Courses
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
                Full syllabus previews, lecture dossiers, and diagnostic problem sets are open for guest review.
              </p>
            </div>
            <span className="font-formula text-xs text-charcoal-50">
              {trackCourses.length} {trackCourses.length === 1 ? 'Course' : 'Courses'} Active
            </span>
          </div>

          {trackCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trackCourses.map((course) => {
                const lessonsCount = course.lessons?.length || 0;
                return (
                  <div
                    key={course.id}
                    className="p-6 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet hover:shadow-editorial transition-all flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      {/* Code & Level */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-formula text-xs font-bold px-2 py-0.5 rounded bg-ivory-200 border border-hairline text-burgundy-900">
                          {course.code}
                        </span>
                        <span className="text-[11px] font-mono text-charcoal-50">
                          {course.totalHours || '30 Hours'}
                        </span>
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className="text-lg font-bold text-charcoal-900 font-display leading-snug">
                          {course.title}
                        </h3>
                        <p className="text-xs text-charcoal-100 font-sans mt-1 line-clamp-2">
                          {course.subTitle}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-charcoal-100 font-sans leading-relaxed line-clamp-3">
                        {course.description}
                      </p>

                      {/* Instructor supervision */}
                      <div className="pt-2 border-t border-hairline flex items-center justify-between text-xs text-charcoal-100 font-sans">
                        <span>
                          Supervision:{' '}
                          <Link
                            href={`/faculty/${course.instructorId || 'dr-omar-magdi'}`}
                            className="font-bold text-burgundy-600 hover:text-burgundy-900 underline underline-offset-2 transition-colors"
                          >
                            {course.instructorName || INSTRUCTOR.name}
                          </Link>
                        </span>
                        <span className="font-mono text-charcoal-50">{lessonsCount} Lectures</span>
                      </div>
                    </div>

                    {/* Action Link: Explore Course */}
                    <Link
                      href={`/courses/${course.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-ivory-200 hover:bg-burgundy-500 hover:text-ivory-100 text-charcoal-900 border border-hairline font-sans text-xs font-bold transition-all shadow-quiet group"
                    >
                      <span>Explore Syllabus & Lectures</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Upcoming Cohorts Card for New Tracks */
            <div className="p-8 sm:p-12 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet text-center space-y-6 max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-ivory-200 border border-hairline flex items-center justify-center mx-auto text-burgundy-500">
                <GraduationCap className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-charcoal-900 font-display">
                  {track.name} Cohorts Curating
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
                  The faculty is preparing verified lecture dossiers and problem-solving sets for the upcoming academic cycle. You can register early interest to receive the syllabus dossier upon release.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/201019688457?text=${encodeURIComponent(`Hello Dr. Omar Magdi, I would like to inquire about upcoming cohorts for the ${track.name} track on Phenol Academy.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans text-xs font-bold transition-all shadow-md"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-ivory-100" />
                  <span>Inquire Directly with Dr. Omar</span>
                </a>

                <Link
                  href="/#tracks"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 border border-hairline font-sans text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Other Tracks</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-ivory-100 py-12 text-sm text-charcoal-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-hairline">
            <PhenolLogo size={36} subtitle="First Principles Institution" />

            <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium">
              <Link href="/#tracks" className="hover:text-burgundy-500 transition-colors">
                All Tracks
              </Link>
              <Link href="/academy" className="hover:text-burgundy-500 transition-colors">
                Phenol Academy
              </Link>
              <Link href="/academy#faculty" className="hover:text-burgundy-500 transition-colors">
                Faculty
              </Link>
              <Link href="/about" className="hover:text-burgundy-500 transition-colors">
                About Dr. Omar
              </Link>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-formula text-charcoal-50">
            <span>© {new Date().getFullYear()} Phenol Academy • All academic curricula preserved.</span>
            <Link href="/" className="hover:text-charcoal-900 transition-colors">
              Return to Academy Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
