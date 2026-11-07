'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CHEMISTRY_COURSES, ACADEMIC_TRACKS } from '@/data/mock-data';
import { AcademicCategory } from '@/types/lms';
import { supabase } from '@/lib/supabase';
import { ArrowRight, CheckCircle2, BookOpen, Clock, Layers } from 'lucide-react';

interface ProgramsSectionProps {
  onOpenWaitlistModal?: () => void;
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({ onOpenWaitlistModal }) => {
  const [selectedCategory, setSelectedCategory] = useState<AcademicCategory | 'all'>('all');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<AcademicCategory>('thanaweya-arabic');
  const [targetCourse, setTargetCourse] = useState('chem-ar-301');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter courses by category
  const filteredCourses = selectedCategory === 'all'
    ? CHEMISTRY_COURSES
    : CHEMISTRY_COURSES.filter((c) => c.category === selectedCategory);

  // Courses available for selected track in the form
  const coursesForTrack = CHEMISTRY_COURSES.filter((c) => c.category === selectedTrack);

  const handleTrackChange = (newTrack: AcademicCategory) => {
    setSelectedTrack(newTrack);
    const firstCourseInTrack = CHEMISTRY_COURSES.find((c) => c.category === newTrack);
    if (firstCourseInTrack) {
      setTargetCourse(firstCourseInTrack.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const chosenCourseObj = CHEMISTRY_COURSES.find((c) => c.id === targetCourse);
    const chosenTrackObj = ACADEMIC_TRACKS.find((t) => t.id === selectedTrack);

    const newApplication = {
      id: `wl-${Date.now()}`,
      fullName,
      email,
      phone,
      academicTrack: chosenTrackObj?.name || selectedTrack,
      targetCourse: chosenCourseObj ? `${chosenCourseObj.code} - ${chosenCourseObj.title}` : targetCourse,
      appliedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'pending' as const,
      notes: `Applied for ${chosenTrackObj?.name}. Direct inquiry.`,
    };

    // 1. Sync to local storage for immediate dashboard display
    try {
      const existing = localStorage.getItem('phenol_waitlist_applications');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(newApplication);
      localStorage.setItem('phenol_waitlist_applications', JSON.stringify(list));
    } catch (err) {
      console.warn('Local storage write warning:', err);
    }

    // 2. Attempt Supabase persistence
    try {
      await supabase.from('waitlist_applications').insert([
        {
          full_name: fullName,
          email,
          phone,
          academic_track: chosenTrackObj?.name || selectedTrack,
          target_course: chosenCourseObj ? `${chosenCourseObj.code} - ${chosenCourseObj.title}` : targetCourse,
          status: 'pending',
          notes: `Applied via landing page admission registrar.`,
        },
      ]);
    } catch (err) {
      console.warn('Supabase insert note:', err);
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <section id="programs" className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-hairline pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
                SECTION 05
              </span>
              <span className="text-hairline-strong">•</span>
              <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">
                Academic Cohorts & Curricula
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
              The 4 Academic Tracks
            </h2>

            <p className="text-sm sm:text-base text-charcoal-100 leading-relaxed font-sans">
              Rigorous, structured chemistry curricula designed for foundational comprehension, from high school national & international certifications to university undergraduate mastery.
            </p>
          </div>

          <div className="text-left font-formula text-xs text-charcoal-50 shrink-0">
            Academic Year 2026 / 2027
          </div>
        </div>

        {/* Academic Track Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded transition-colors ${
              selectedCategory === 'all'
                ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                : 'bg-ivory-100 text-charcoal-100 hover:text-charcoal-900 border border-hairline'
            }`}
          >
            All Tracks ({CHEMISTRY_COURSES.length})
          </button>

          {ACADEMIC_TRACKS.map((track) => {
            const count = CHEMISTRY_COURSES.filter((c) => c.category === track.id).length;
            const isSelected = selectedCategory === track.id;
            return (
              <button
                key={track.id}
                onClick={() => setSelectedCategory(track.id)}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded transition-colors flex items-center gap-2 ${
                  isSelected
                    ? 'bg-burgundy-500 text-ivory-100 shadow-quiet'
                    : 'bg-ivory-100 text-charcoal-100 hover:text-charcoal-900 border border-hairline'
                }`}
              >
                <span>{track.name}</span>
                <span className={`text-[11px] font-formula px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-burgundy-800 text-ivory-200' : 'bg-ivory-300 text-charcoal-100'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Academic Course Catalog */}
        <div className="divide-y divide-hairline border-b border-hairline">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start hover:bg-ivory-300/30 transition-colors px-2 -mx-2 rounded"
            >
              {/* Course Title & Identifier */}
              <div className="lg:col-span-5 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                    {course.code}
                  </span>
                  <span className="font-sans text-[11px] font-semibold text-charcoal-900 bg-ivory-300 px-2 py-0.5 rounded border border-hairline">
                    {course.categoryName}
                  </span>
                  <span className="text-xs font-medium text-charcoal-50 font-sans">
                    {course.level}
                  </span>
                  {course.molecularFormula && (
                    <span className="font-formula text-xs text-charcoal-100 bg-ivory-200 px-2 py-0.5 rounded">
                      {course.molecularFormula}
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display">
                  {course.title}
                </h3>

                <p className="text-xs sm:text-sm text-charcoal-50 font-sans">
                  {course.subTitle}
                </p>

                <div className="pt-2 flex items-center gap-4 text-xs font-formula text-charcoal-100">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-charcoal-50" />
                    <span>{course.totalHours}</span>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-charcoal-50" />
                    <span>{course.lessons.length} Core Modules</span>
                  </span>
                </div>
              </div>

              {/* Course Description */}
              <div className="lg:col-span-5 space-y-3">
                <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
                  {course.description}
                </p>

                <div className="text-xs font-sans text-charcoal-50 space-y-1">
                  <span className="font-semibold text-charcoal-900 block">Syllabus Highlights:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {course.lessons.slice(0, 2).map((l, idx) => (
                      <li key={idx} className="truncate">
                        {l.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Link */}
              <div className="lg:col-span-2 flex items-center lg:justify-end pt-2 lg:pt-0">
                <Link
                  href={`/courses/${course.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal-900 hover:text-burgundy-500 font-sans transition-colors group"
                >
                  <span>View Syllabus</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Admission & Waitlist Registrar Box */}
        <div id="admission" className="border border-hairline bg-ivory-100 rounded p-6 sm:p-10 max-w-3xl mx-auto scroll-mt-28">
          <div className="text-center space-y-2 mb-8">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
              ADMISSION & REGISTRATION
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display">
              Apply for the 2026/2027 Academic Cohort
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-100 max-w-md mx-auto font-sans leading-relaxed">
              Strictly limited cohort capacity to guarantee individual problem-set review, weekly diagnostic grading, and direct academic supervision by Dr. Omar Magdi.
            </p>
          </div>

          {submitted ? (
            <div className="bg-ivory-300/80 border border-hairline rounded p-6 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-burgundy-500 mx-auto" />
              <h4 className="font-bold text-charcoal-900 font-display text-lg">Application Registered</h4>
              <p className="text-xs sm:text-sm text-charcoal-100 font-sans max-w-md mx-auto">
                Thank you, <strong className="text-charcoal-900">{fullName}</strong>. Your application for <strong className="text-charcoal-900">{ACADEMIC_TRACKS.find(t => t.id === selectedTrack)?.name}</strong> has been received by Dr. Omar Magdi&apos;s registrar.
              </p>
              <div className="pt-2 text-xs font-formula text-charcoal-50">
                You will be contacted via WhatsApp at <span className="font-bold text-burgundy-500">{phone}</span> with orientation guidelines and diagnostic placement steps.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Full Name & WhatsApp Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1.5">
                    Full Name (الاسم بالكامل)
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Youssef Ahmed"
                    className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1.5">
                    WhatsApp Number (رقم الواتساب)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 10xxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500 transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: Email & Academic Track */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 placeholder:text-charcoal-50/50 focus:outline-none focus:border-burgundy-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1.5">
                    Target Academic Track (المسار الدراسي)
                  </label>
                  <select
                    value={selectedTrack}
                    onChange={(e) => handleTrackChange(e.target.value as AcademicCategory)}
                    className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 transition-colors"
                  >
                    {ACADEMIC_TRACKS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Target Course in that track */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1.5">
                  Target Course in Track (المقرر المطلوب)
                </label>
                <select
                  value={targetCourse}
                  onChange={(e) => setTargetCourse(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 transition-colors"
                >
                  {coursesForTrack.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}: {c.title} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 disabled:opacity-50 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet mt-2 flex items-center justify-center gap-2"
              >
                <span>{submitting ? 'Submitting Application...' : 'Submit Admission Application'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
