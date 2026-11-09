'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CHEMISTRY_COURSES, ACADEMIC_TRACKS } from '@/data/mock-data';
import { AcademicCategory, ChemistryCourse } from '@/types/lms';
import { getStoredCourses, syncWithServerCourses } from '@/lib/courses-storage';
import { supabase } from '@/lib/supabase';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { CourseShareModal } from '@/components/courses/CourseShareModal';
import { getReferralCodeForUser } from '@/lib/referral-system';
import { AuthUser } from '@/types/auth';
import { getPersistentAvatar } from '@/lib/user-profile';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  Share2,
  Check,
} from 'lucide-react';

export default function CoursesPage() {
  const [coursesList, setCoursesList] = useState<ChemistryCourse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AcademicCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Sharing Modal
  const [sharingCourse, setSharingCourse] = useState<ChemistryCourse | null>(null);

  // Admission Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<AcademicCategory>('thanaweya-arabic');
  const [targetCourse, setTargetCourse] = useState('chem-ar-301');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCoursesList(getStoredCourses());
    syncWithServerCourses().then(() => {
      setCoursesList(getStoredCourses());
    });

    try {
      const saved = localStorage.getItem('phenol_auth_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.email) {
          u.avatar = getPersistentAvatar(u.email, u.avatar);
        }
        setCurrentUser(u);
      }
    } catch (e) {}

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

  // Filter courses by category and search query
  const filteredCourses = coursesList.filter((c) => {
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim().length === 0 ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const coursesForTrack = coursesList.filter((c) => c.category === selectedTrack);

  const handleTrackChange = (newTrack: AcademicCategory) => {
    setSelectedTrack(newTrack);
    const firstCourseInTrack = coursesList.find((c) => c.category === newTrack);
    if (firstCourseInTrack) {
      setTargetCourse(firstCourseInTrack.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const chosenCourseObj = coursesList.find((c) => c.id === targetCourse);
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

    // 1. Sync to local storage
    try {
      const existing = localStorage.getItem('phenol_waitlist_applications');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(newApplication);
      localStorage.setItem('phenol_waitlist_applications', JSON.stringify(list));
    } catch (err) {}

    // 2. Supabase persistence
    try {
      await supabase.from('waitlist_applications').insert([
        {
          full_name: fullName,
          email,
          phone,
          academic_track: chosenTrackObj?.name || selectedTrack,
          target_course: chosenCourseObj ? `${chosenCourseObj.code} - ${chosenCourseObj.title}` : targetCourse,
          status: 'pending',
          notes: `Applied via course catalog admissions form.`,
        },
      ]);
    } catch (err) {}

    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFullName('');
      setEmail('');
      setPhone('');
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      
      {/* Editorial Top Navigation */}
      <header className="border-b border-hairline bg-ivory-100/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-charcoal-100 hover:text-charcoal-900 transition-colors text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Return to Home</span>
            <span className="sm:hidden">Home</span>
          </Link>

          <PhenolLogo size={34} subtitle="Curriculum & Programs" />

          <div className="flex items-center gap-2">
            {currentUser ? (
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-sm"
              >
                {currentUser.role === 'INSTRUCTOR' ? 'Admin Suite' : 'Student Portal'}
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Course Catalog Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        
        {/* Header Block with Search */}
        <div className="border-b border-hairline pb-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-formula text-burgundy-500 font-bold uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                <span>OFFICIAL ACADEMIC CURRICULUM</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal-900 font-display">
                Courses Directed by Dr. Omar Magdi
              </h1>
              <p className="text-sm sm:text-base text-charcoal-100 font-sans leading-relaxed">
                Structured pedagogical curricula built strictly on thermodynamic first principles and deductive chemical logic. Select your academic track to inspect syllabus breakdown and lecture sequences.
              </p>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 text-charcoal-50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses or topics..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-hairline rounded font-sans text-charcoal-900 focus:outline-none focus:border-burgundy-500 shadow-sm"
              />
            </div>
          </div>

          {/* Academic Track Filter Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded transition-colors flex items-center gap-2 ${
                selectedCategory === 'all'
                  ? 'bg-burgundy-900 text-ivory-100 shadow-sm'
                  : 'bg-ivory-100 text-charcoal-100 hover:text-charcoal-900 border border-hairline'
              }`}
            >
              <span>All Programs</span>
              <span
                className={`text-[11px] font-formula px-1.5 py-0.5 rounded ${
                  selectedCategory === 'all' ? 'bg-burgundy-800 text-ivory-200' : 'bg-ivory-300 text-charcoal-100'
                }`}
              >
                {coursesList.length}
              </span>
            </button>

            {ACADEMIC_TRACKS.map((track) => {
              const count = coursesList.filter((c) => c.category === track.id).length;
              const isSelected = selectedCategory === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => setSelectedCategory(track.id)}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded transition-colors flex items-center gap-2 ${
                    isSelected
                      ? 'bg-burgundy-900 text-ivory-100 shadow-sm'
                      : 'bg-ivory-100 text-charcoal-100 hover:text-charcoal-900 border border-hairline'
                  }`}
                >
                  <span>{track.name}</span>
                  <span
                    className={`text-[11px] font-formula px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-burgundy-800 text-ivory-200' : 'bg-ivory-300 text-charcoal-100'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Courses Grid */}
        <div className="space-y-6">
          {filteredCourses.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-hairline space-y-3">
              <BookOpen className="w-8 h-8 text-burgundy-500 mx-auto" />
              <h3 className="text-base font-bold text-charcoal-900 font-display">
                No courses found matching this criteria
              </h3>
              <p className="text-xs text-charcoal-100 max-w-md mx-auto">
                Try clearing your search query or switching tracks. You can also register your interest using the admissions inquiry form below.
              </p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div
                key={course.id}
                className="p-6 sm:p-8 bg-white rounded-2xl border border-hairline shadow-editorial hover:border-burgundy-500/40 transition-all grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                {/* Course Metadata & Identification */}
                <div className="lg:col-span-5 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-formula text-xs font-bold text-burgundy-900 bg-burgundy-50 px-2.5 py-0.5 rounded border border-burgundy-200">
                      {course.code}
                    </span>
                    <span className="font-sans text-[11px] font-semibold text-charcoal-900 bg-ivory-200 px-2 py-0.5 rounded border border-hairline">
                      {course.categoryName}
                    </span>
                    <span className="text-xs font-medium text-charcoal-50 font-sans">
                      {course.level}
                    </span>
                    {course.molecularFormula && (
                      <span className="font-formula text-xs text-charcoal-100 bg-ivory-100 px-2 py-0.5 rounded border border-hairline">
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

                  <div className="pt-1 flex items-center gap-4 text-xs font-formula text-charcoal-100">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-charcoal-50" />
                      <span>{course.totalHours}</span>
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-charcoal-50" />
                      <span>{(course.lessons || []).length} Core Lecture Modules</span>
                    </span>
                  </div>
                </div>

                {/* Course Description & Highlights */}
                <div className="lg:col-span-4 space-y-2">
                  <p className="text-xs sm:text-sm text-charcoal-100 leading-relaxed font-sans">
                    {course.description}
                  </p>
                  <p className="text-[11px] text-charcoal-50 font-sans">
                    Supervised and recorded directly by Dr. Omar Magdi with complete companion PDF handouts.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="lg:col-span-3 flex flex-col gap-2.5 lg:items-end justify-center h-full pt-2 lg:pt-0">
                  <Link
                    href={`/courses/${course.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-semibold transition-colors shadow-quiet"
                  >
                    <span>View Syllabus & Lectures</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSharingCourse(course)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-ivory-100 border border-hairline hover:bg-ivory-300 text-charcoal-900 text-xs font-semibold transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 text-burgundy-900" />
                    <span>Share & Earn Points</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Page End Call-to-Action: Direct Sign Up & Sign In */}
        <div className="p-8 sm:p-12 rounded-2xl bg-ivory-100 border border-hairline shadow-editorial text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-formula text-burgundy-500 font-bold uppercase tracking-wider block">
              START YOUR ACADEMIC ENROLLMENT
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-charcoal-900">
              Ready to Master Chemistry with Dr. Omar Magdi?
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
              Create your student account to access full lecture archives, companion PDF booklets, and guided problem sets.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 max-w-md sm:max-w-none mx-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto min-w-[190px] inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer ring-2 ring-burgundy-500/20"
            >
              <span>Sign Up</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto min-w-[190px] inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-ivory-100 hover:bg-ivory-300 active:scale-[0.98] border-2 border-burgundy-500 text-burgundy-500 hover:text-burgundy-900 font-sans font-bold text-base sm:text-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>

      </main>

      {/* Share Modal if invoked */}
      {sharingCourse && (
        <CourseShareModal
          isOpen={true}
          onClose={() => setSharingCourse(null)}
          courseId={sharingCourse.id}
          courseTitle={sharingCourse.title}
          courseCode={sharingCourse.code}
          referralCode={getReferralCodeForUser(currentUser)}
        />
      )}
    </div>
  );
}
