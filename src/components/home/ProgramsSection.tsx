'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CHEMISTRY_COURSES, ACADEMIC_TRACKS } from '@/data/mock-data';
import { ChemistryCourse } from '@/types/lms';
import { getStoredCourses, syncWithServerCourses } from '@/lib/courses-storage';
import { ArrowRight, BookOpen, Clock, Layers, Sparkles } from 'lucide-react';

interface ProgramsSectionProps {
  onOpenWaitlistModal?: () => void;
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({ onOpenWaitlistModal }) => {
  const [coursesList, setCoursesList] = useState<ChemistryCourse[]>([]);

  useEffect(() => {
    setCoursesList(getStoredCourses());
    syncWithServerCourses().then(() => {
      setCoursesList(getStoredCourses());
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

  return (
    <section id="programs" className="py-14 sm:py-18 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-8">
        
        {/* Section Heading with Action Button */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                SECTION 05 • ACADEMIC PROGRAMS
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
              Four Core Chemistry Curricula
            </h2>

            <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
              Directed by <strong className="text-charcoal-900 font-semibold">Dr. Omar Magdi</strong>, our courses cover foundational theory, kinetics, organic reaction mechanisms, and non-routine problem solving across four educational tracks.
            </p>
          </div>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-quiet shrink-0"
          >
            <span>Explore All Courses & Syllabi</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Academic Programs Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
          {ACADEMIC_TRACKS.map((track) => {
            const count = coursesList.filter((c) => c.category === track.id).length;
            return (
              <div
                key={track.id}
                className="p-5 rounded-xl bg-ivory-100 border border-hairline hover:border-burgundy-500/40 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-formula font-bold uppercase tracking-wider text-burgundy-500 bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                      PROGRAM TRACK
                    </span>
                    <span className="text-xs font-mono font-bold text-charcoal-50">
                      {count} {count === 1 ? 'Course' : 'Courses'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-charcoal-900 font-display">
                    {track.name}
                  </h3>

                  <p className="text-xs text-charcoal-100 font-sans leading-relaxed">
                    {track.description}
                  </p>
                </div>

                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-burgundy-900 hover:text-black pt-2 border-t border-hairline"
                >
                  <span>Browse Program Syllabus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
