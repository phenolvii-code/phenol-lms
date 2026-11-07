'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CHEMISTRY_COURSES } from '@/data/mock-data';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface ProgramsSectionProps {
  onOpenWaitlistModal?: () => void;
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({ onOpenWaitlistModal }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('High School Senior');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
              <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">Curricula & Tracks</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
              Academic Tracks
            </h2>

            <p className="text-sm sm:text-base text-charcoal-100 leading-relaxed font-sans">
              Rigorous, structured curricula designed to develop deep scientific reasoning, devoid of superficial filler.
            </p>
          </div>

          <div className="text-left font-formula text-xs text-charcoal-50 shrink-0">
            Academic Year 2026 / 2027
          </div>
        </div>

        {/* Academic Course Catalog */}
        <div className="divide-y divide-hairline border-b border-hairline">
          {CHEMISTRY_COURSES.map((course) => (
            <div
              key={course.id}
              className="py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start hover:bg-ivory-300/30 transition-colors px-2 -mx-2 rounded"
            >
              {/* Course Title & Identifier */}
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 px-2 py-0.5 rounded border border-burgundy-200">
                    {course.code}
                  </span>
                  <span className="text-xs font-semibold text-charcoal-50 font-sans">
                    {course.level}
                  </span>
                  {course.molecularFormula && (
                    <span className="font-formula text-xs text-charcoal-100 bg-ivory-300 px-2 py-0.5 rounded">
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
                  <span>{course.totalHours}</span>
                  <span>•</span>
                  <span>{course.enrolledStudentsCount} Enrolled</span>
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
              ADMISSION & WAITLIST
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display">
              Apply for the 2026/2027 Academic Cohort
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-100 max-w-md mx-auto font-sans leading-relaxed">
              Strictly limited cohort capacity to guarantee individual problem-set review and direct academic supervision by Dr. Omar Magdi.
            </p>
          </div>

          {submitted ? (
            <div className="bg-ivory-300/80 border border-hairline rounded p-6 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-burgundy-500 mx-auto" />
              <h4 className="font-bold text-charcoal-900 font-display">Application Received</h4>
              <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
                Thank you, {fullName}. Dr. Omar Magdi&apos;s academic registrar will reach out to you via WhatsApp ({phone}) with the placement diagnostic.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-900 font-sans mb-1.5">
                    Full Name
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
                    WhatsApp Number
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
                    Academic Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-ivory-50 border border-hairline rounded text-charcoal-900 focus:outline-none focus:border-burgundy-500 transition-colors"
                  >
                    <option value="High School Senior">High School Senior (Thanaweya Amma / STEM / IGCSE)</option>
                    <option value="High School Junior">High School Junior</option>
                    <option value="University Undergraduate">University Undergraduate (Pharmacy / Medicine / Science)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet mt-2"
              >
                Submit Admission Application
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
