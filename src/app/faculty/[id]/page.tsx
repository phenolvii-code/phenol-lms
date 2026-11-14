'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { Navbar } from '@/components/layout/Navbar';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { Initials } from '@/components/ui/Initials';
import { WhatsAppIcon } from '@/components/auth/AuthIcons';
import { getStoredCourses, syncWithServerCourses } from '@/lib/courses-storage';
import { listMyEnrollments, listAllEnrollments, CourseEnrollmentRecord } from '@/lib/data/enrollments';
import {
  getInstructorByIdOrSlug,
  updateInstructorProfileData,
  syncPlatformInstructors,
} from '@/lib/data/instructors';
import {
  getReviewsForInstructor,
  getInstructorRating,
  addInstructorReview,
  deleteInstructorReview,
  InstructorReview,
} from '@/lib/data/reviews';
import { InstructorProfile, ChemistryCourse } from '@/types/lms';
import {
  Star,
  Mail,
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react';

export default function InstructorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const idParam = (params?.id as string) || '';

  const { user: currentUser, signOut } = useCurrentUser();
  const [courses, setCourses] = useState<ChemistryCourse[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<CourseEnrollmentRecord[]>([]);
  const [instructor, setInstructor] = useState<InstructorProfile | null>(null);
  const [reviews, setReviews] = useState<InstructorReview[]>([]);
  const [ratingStats, setRatingStats] = useState({ rating: 5.0, count: 0 });

  // Review Form State
  const [inputRating, setInputRating] = useState(5);
  const [inputComment, setInputComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewToast, setReviewToast] = useState<string | null>(null);

  // Edit Profile Modal State (Owner / Super Admin)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Load instructor data
  const loadInstructorData = () => {
    const inst = getInstructorByIdOrSlug(idParam);
    if (inst) {
      setInstructor(inst);
      setEditName(inst.name);
      setEditTitle(inst.title);
      setEditBio(inst.bio);
      setEditSpecialization(inst.specialization || '');
      setEditPhone(inst.whatsapp ? inst.whatsapp.replace(/[^0-9]/g, '') : '');
      setEditAvatar(inst.avatar || '');

      const instId = inst.id || 'dr-omar-magdi';
      const rList = getReviewsForInstructor(instId);
      setReviews(rList);
      setRatingStats(getInstructorRating(instId));
    }
  };

  useEffect(() => {
    loadInstructorData();
    syncPlatformInstructors().then(() => loadInstructorData());

    const handleInstructorsUpdate = () => loadInstructorData();
    const handleReviewsUpdate = () => {
      if (instructor) {
        const instId = instructor.id || 'dr-omar-magdi';
        setReviews(getReviewsForInstructor(instId));
        setRatingStats(getInstructorRating(instId));
      }
    };

    window.addEventListener('phenol_instructors_updated', handleInstructorsUpdate);
    window.addEventListener('phenol_reviews_updated', handleReviewsUpdate);

    return () => {
      window.removeEventListener('phenol_instructors_updated', handleInstructorsUpdate);
      window.removeEventListener('phenol_reviews_updated', handleReviewsUpdate);
    };
  }, [idParam]);

  // Load courses & enrollments
  useEffect(() => {
    setCourses(getStoredCourses());
    syncWithServerCourses().then(setCourses);

    const handleCoursesUpdate = () => setCourses(getStoredCourses());
    window.addEventListener('phenol_courses_updated', handleCoursesUpdate);

    if (currentUser) {
      listMyEnrollments()
        .then(setMyEnrollments)
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('phenol_courses_updated', handleCoursesUpdate);
    };
  }, [currentUser]);

  // Determine permissions
  const isSuperAdmin =
    currentUser?.email?.toLowerCase() === 'phenolvii@gmail.com' || currentUser?.isSuperAdmin;

  const isInstructorOwner =
    !!currentUser &&
    !!instructor &&
    (currentUser.id === instructor.id ||
      (instructor.email && currentUser.email.toLowerCase() === instructor.email.toLowerCase()));

  const canEdit = isSuperAdmin || isInstructorOwner;

  // Filter courses directed by this instructor
  const instructorCourses = useMemo(() => {
    if (!instructor) return [];
    const instId = (instructor.id || '').toLowerCase();
    const instEmail = (instructor.email || '').toLowerCase();

    return courses.filter((c) => {
      if (instId === 'dr-omar-magdi' || instEmail === 'phenolvii@gmail.com') {
        return (
          !c.instructorEmail ||
          c.instructorEmail.toLowerCase() === 'phenolvii@gmail.com' ||
          c.instructorName?.includes('Omar') ||
          !c.instructorName
        );
      }
      return (
        (c.instructorId && c.instructorId.toLowerCase() === instId) ||
        (c.instructorEmail && c.instructorEmail.toLowerCase() === instEmail) ||
        (c.instructorName && c.instructorName.toLowerCase() === instructor.name.toLowerCase())
      );
    });
  }, [courses, instructor]);

  // Active enrolled course IDs for current logged-in user
  const myActiveCourseIds = useMemo(() => {
    return new Set(
      myEnrollments
        .filter((e) => e.status === 'ACTIVE')
        .map((e) => e.course_id)
    );
  }, [myEnrollments]);

  // Is current user an enrolled student with THIS instructor?
  const isEnrolledWithThisInstructor = useMemo(() => {
    if (!currentUser || currentUser.role === 'INSTRUCTOR') return false;
    return instructorCourses.some((c) => myActiveCourseIds.has(c.id));
  }, [currentUser, instructorCourses, myActiveCourseIds]);

  // Sort courses: Enrolled courses ALWAYS FIRST for enrolled students
  const sortedCourses = useMemo(() => {
    return [...instructorCourses].sort((a, b) => {
      const aEnrolled = myActiveCourseIds.has(a.id) ? 1 : 0;
      const bEnrolled = myActiveCourseIds.has(b.id) ? 1 : 0;
      return bEnrolled - aEnrolled;
    });
  }, [instructorCourses, myActiveCourseIds]);

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !instructor) return;
    if (!inputComment.trim()) {
      alert('Please write an evaluation comment.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const instId = instructor.id || 'dr-omar-magdi';
      await addInstructorReview({
        instructorId: instId,
        studentName: currentUser.name || 'Enrolled Scholar',
        studentEmail: currentUser.email,
        studentCode: currentUser.academicCode || 'PH-SCHOLAR',
        studentTrack: currentUser.academicTrack || 'Academic Track',
        rating: inputRating,
        comment: inputComment.trim(),
      });

      setInputComment('');
      setReviewToast('Evaluation submitted successfully! Thank you for your feedback.');
      setReviews(getReviewsForInstructor(instId));
      setRatingStats(getInstructorRating(instId));
      setTimeout(() => setReviewToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error submitting review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Review Deletion (Super Admin or Instructor Owner)
  const handleDeleteReview = async (reviewId: string) => {
    if (!canEdit) return;
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to delete this evaluation?')) return;
    try {
      await deleteInstructorReview(reviewId);
      if (instructor) {
        const instId = instructor.id || 'dr-omar-magdi';
        setReviews(getReviewsForInstructor(instId));
        setRatingStats(getInstructorRating(instId));
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting review');
    }
  };

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructor) return;

    try {
      const instId = instructor.id || 'dr-omar-magdi';
      await updateInstructorProfileData(instId, {
        name: editName.trim(),
        title: editTitle.trim(),
        bio: editBio.trim(),
        specialization: editSpecialization.trim(),
        avatar: editAvatar,
        whatsapp: editPhone ? `https://wa.me/${editPhone.replace(/[^0-9]/g, '')}` : undefined,
      });

      loadInstructorData();
      setIsEditModalOpen(false);
      setReviewToast('Instructor profile updated successfully.');
      setTimeout(() => setReviewToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating instructor profile');
    }
  };

  if (!instructor) {
    return (
      <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans">
        <Navbar currentUser={currentUser} onLogout={signOut} />
        <main className="flex-1 max-w-xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center space-y-4">
          <GraduationCap className="w-12 h-12 text-burgundy-500" />
          <h1 className="text-2xl font-bold font-display text-charcoal-900">
            Instructor Profile Not Found
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-100">
            The requested teaching chair profile does not exist or may have been updated.
          </p>
          <Link
            href="/faculty"
            className="px-5 py-2.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 font-bold text-xs transition-colors shadow-sm"
          >
            Explore All Faculty & Fellows
          </Link>
        </main>
      </div>
    );
  }

  const isFounder =
    instructor.id === 'dr-omar-magdi' ||
    (instructor.email && instructor.email.toLowerCase() === 'phenolvii@gmail.com');

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100 antialiased">
      <Navbar currentUser={currentUser} onLogout={signOut} />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full space-y-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-charcoal-100 font-sans">
          <Link href="/" className="hover:text-charcoal-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/faculty" className="hover:text-charcoal-900 transition-colors">
            Faculty
          </Link>
          <span>/</span>
          <span className="font-semibold text-charcoal-900 font-formula">
            {instructor.name}
          </span>
        </nav>

        {/* Toast Notification */}
        {reviewToast && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-quiet animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{reviewToast}</span>
            </div>
            <button
              onClick={() => setReviewToast(null)}
              className="text-emerald-700 hover:text-emerald-900 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* INSTRUCTOR MASTHEAD CARD */}
        <section className="p-6 sm:p-10 rounded-3xl bg-ivory-100 border border-hairline shadow-quiet flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left flex-1">
            {/* Avatar / Monogram */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border border-hairline shrink-0 shadow-editorial bg-ivory-200 flex items-center justify-center">
              {instructor.avatar ? (
                <img
                  src={instructor.avatar}
                  alt={instructor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Initials name={instructor.name} size="xl" />
              )}
            </div>

            {/* Information */}
            <div className="space-y-3 flex-1">
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display tracking-tight">
                    {instructor.name}
                  </h1>
                  <span className="font-formula text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-burgundy-50 text-burgundy-900 border border-burgundy-200">
                    {isFounder ? 'Founder & Academic Chair' : 'Faculty Fellow'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">
                  {instructor.title}
                </p>
                <span className="font-formula text-xs text-ochre-600 block">
                  {instructor.supervisionScope}
                </span>
              </div>

              {/* Rating ribbon */}
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                <div className="flex items-center gap-1 text-ochre-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(ratingStats.rating)
                          ? 'fill-ochre-500 text-ochre-500'
                          : 'text-charcoal-50'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-formula text-xs font-bold text-charcoal-900">
                  {ratingStats.rating.toFixed(1)}
                </span>
                <span className="text-xs text-charcoal-50 font-sans">
                  ({reviews.length} {reviews.length === 1 ? 'scholar evaluation' : 'scholar evaluations'})
                </span>
              </div>

              {/* Bio */}
              <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed pt-1">
                {instructor.bio}
              </p>

              {/* Specialization pills */}
              {instructor.specialization && (
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-[11px] font-formula text-charcoal-50 uppercase tracking-wider">
                    Disciplinary Scope:
                  </span>
                  <span className="text-[11px] font-sans px-2.5 py-0.5 rounded bg-ivory-200 text-charcoal-900 border border-hairline font-medium">
                    {instructor.specialization}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action and Communication Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center gap-2.5 shrink-0 w-full md:w-auto">
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold transition-all shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile & Photo</span>
              </button>
            )}

            {instructor.whatsapp && (
              <a
                href={instructor.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>Contact via WhatsApp</span>
              </a>
            )}

            {instructor.email && (
              <a
                href={`mailto:${instructor.email}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 border border-hairline text-xs font-semibold transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Instructor</span>
              </a>
            )}
          </div>
        </section>

        {/* SECTION 2: COURSES DIRECTED BY THIS INSTRUCTOR */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-hairline pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-burgundy-500" />
                <h2 className="text-xl font-bold text-charcoal-900 font-display">
                  Curricula Directed by {instructor.name}
                </h2>
              </div>
              <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                {isEnrolledWithThisInstructor
                  ? 'Your enrolled courses are highlighted at the top. Explore additional modules below.'
                  : 'Structured academic cohorts deconstructed from foundational first principles.'}
              </p>
            </div>

            <span className="font-formula text-xs text-charcoal-50 font-semibold">
              {instructorCourses.length} {instructorCourses.length === 1 ? 'Course' : 'Courses'} Active
            </span>
          </div>

          {sortedCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCourses.map((course) => {
                const isEnrolledInThisCourse = myActiveCourseIds.has(course.id);
                const lessonsCount = course.lessons?.length || 0;

                return (
                  <div
                    key={course.id}
                    className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-5 ${
                      isEnrolledInThisCourse
                        ? 'bg-emerald-50/40 border-emerald-300 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-ivory-100 border-hairline shadow-quiet hover:shadow-editorial'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Bar: Code + Enrollment Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-formula text-xs font-bold px-2 py-0.5 rounded bg-ivory-200 border border-hairline text-burgundy-900">
                          {course.code}
                        </span>

                        {isEnrolledInThisCourse ? (
                          <span className="inline-flex items-center gap-1 font-formula text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Your Active Curriculum</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-charcoal-50">
                            {course.totalHours || '30 Hours'}
                          </span>
                        )}
                      </div>

                      {/* Course Title */}
                      <div>
                        <h3 className="text-base font-bold text-charcoal-900 font-display leading-snug">
                          {course.title}
                        </h3>
                        <p className="text-xs text-charcoal-100 font-sans mt-1 line-clamp-2">
                          {course.subTitle}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-charcoal-100 font-sans leading-relaxed line-clamp-2">
                        {course.description}
                      </p>

                      <div className="pt-2 border-t border-hairline flex items-center justify-between text-xs text-charcoal-100 font-sans">
                        <span>Track: <strong className="text-charcoal-900">{course.categoryName}</strong></span>
                        <span className="font-mono text-charcoal-50">{lessonsCount} Lectures</span>
                      </div>
                    </div>

                    {/* Action Link */}
                    <Link
                      href={`/courses/${course.id}`}
                      className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-sans text-xs font-bold transition-all shadow-sm ${
                        isEnrolledInThisCourse
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                          : 'bg-ivory-200 hover:bg-burgundy-500 hover:text-ivory-100 text-charcoal-900 border border-hairline'
                      }`}
                    >
                      <span>{isEnrolledInThisCourse ? 'Open Syllabus & Study' : 'Explore Syllabus & Lectures'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-hairline rounded-2xl bg-ivory-100 p-10 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-charcoal-50 mx-auto" />
              <h3 className="text-sm font-bold text-charcoal-900 font-display">
                Curricula Currently in Preparation
              </h3>
              <p className="text-xs text-charcoal-100 font-sans max-w-sm mx-auto">
                {instructor.name} is finalizing lecture dossiers and problem-solving sets for the upcoming academic cycle.
              </p>
            </div>
          )}
        </section>

        {/* SECTION 3: SCHOLASTIC REVIEWS & EVALUATIONS */}
        <section className="space-y-6 pt-4 border-t border-hairline">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-burgundy-500" />
                <h2 className="text-xl font-bold text-charcoal-900 font-display">
                  Scholastic Evaluations & Testimonials
                </h2>
              </div>
              <p className="text-xs text-charcoal-100 font-sans mt-0.5">
                Verified feedback from scholars actively enrolled in {instructor.name}&apos;s cohorts.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-ivory-100 border border-hairline px-3.5 py-1.5 rounded-xl shadow-quiet">
              <Star className="w-4 h-4 fill-ochre-500 text-ochre-500" />
              <span className="font-formula text-sm font-bold text-charcoal-900">
                {ratingStats.rating.toFixed(1)} / 5.0
              </span>
              <span className="text-xs text-charcoal-50 font-sans">
                ({reviews.length} reviews)
              </span>
            </div>
          </div>

          {/* EVALUATION SUBMISSION DESK */}
          {isEnrolledWithThisInstructor ? (
            <form
              onSubmit={handleSubmitReview}
              className="p-6 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet space-y-4"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-charcoal-900 font-display">
                    Submit Verified Scholar Evaluation
                  </h3>
                  <p className="text-xs text-charcoal-100 font-sans">
                    As an active student in this instructor&apos;s curriculum, your review helps uphold academic standards.
                  </p>
                </div>

                {/* Interactive Star Picker */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setInputRating(starVal)}
                      className="p-1 text-ochre-500 hover:scale-110 transition-transform"
                      title={`Rate ${starVal} out of 5 stars`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          starVal <= inputRating
                            ? 'fill-ochre-500 text-ochre-500'
                            : 'text-charcoal-50'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-formula text-xs font-bold text-charcoal-900 ml-1">
                    {inputRating}.0
                  </span>
                </div>
              </div>

              <div>
                <textarea
                  rows={3}
                  required
                  placeholder={`Share your experience with ${instructor.name}'s explanations, problem-solving methodology, or lecture dossiers...`}
                  value={inputComment}
                  onChange={(e) => setInputComment(e.target.value)}
                  className="w-full p-3.5 text-xs bg-ivory-200/50 border border-hairline rounded-xl text-charcoal-900 placeholder:text-charcoal-50 focus:outline-none focus:border-burgundy-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-charcoal-50">
                  Submitting as: {currentUser?.name} ({currentUser?.academicCode || 'Scholar'})
                </span>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 font-bold text-xs transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Post Evaluation'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-ivory-100 border border-hairline text-charcoal-100 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-burgundy-500 shrink-0" />
              <span>
                {currentUser
                  ? `Only scholars actively enrolled in ${instructor.name}'s courses can post verified evaluations. You can browse all existing student testimonials below.`
                  : `Please sign in and enroll in one of ${instructor.name}'s courses to submit an evaluation.`}
              </span>
            </div>
          )}

          {/* REVIEWS LIST */}
          <div className="space-y-4">
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-ivory-100 border border-hairline shadow-quiet space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-charcoal-900 font-display">
                              {rev.studentName}
                            </h4>
                            {rev.studentCode && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-ivory-200 border border-hairline text-burgundy-900 font-bold">
                                {rev.studentCode}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-charcoal-50 font-sans block">
                            {rev.studentTrack || 'Scholar'} • {rev.createdAt.slice(0, 10)}
                          </span>
                        </div>

                        {/* Rating Stars & Delete action */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5 text-ochre-500">
                            {[...Array(5)].map((_, sIdx) => (
                              <Star
                                key={sIdx}
                                className={`w-3.5 h-3.5 ${
                                  sIdx < rev.rating
                                    ? 'fill-ochre-500 text-ochre-500'
                                    : 'text-charcoal-50'
                                }`}
                              />
                            ))}
                          </div>

                          {/* Delete review button (Super Admin or Instructor Owner ONLY) */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(rev.id)}
                              className="p-1 rounded-md text-charcoal-50 hover:text-red-700 hover:bg-red-50 transition-colors ml-1"
                              title="Delete this evaluation (Moderation)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed pt-1">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-hairline rounded-2xl bg-ivory-100 p-8 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-charcoal-50 mx-auto" />
                <h4 className="text-sm font-bold text-charcoal-900 font-display">
                  No Student Testimonials Yet
                </h4>
                <p className="text-xs text-charcoal-100 font-sans">
                  Be the first enrolled scholar to leave a verified evaluation for {instructor.name}.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* EDIT PROFILE MODAL (Available to Instructor Owner & Dr. Omar) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-ivory-100 border border-hairline rounded-2xl shadow-editorial max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-hairline bg-ivory-200 flex items-center justify-between shrink-0">
              <div>
                <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider block">
                  FACULTY SETTINGS
                </span>
                <h3 className="font-bold text-charcoal-900 font-display text-sm sm:text-base">
                  Edit Instructor Profile & Credentials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-charcoal-50 hover:text-charcoal-900 p-1.5 rounded-full hover:bg-ivory-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                  Full Academic Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded-xl text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                  Academic Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded-xl text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                  Specialization & Scope
                </label>
                <input
                  type="text"
                  value={editSpecialization}
                  onChange={(e) => setEditSpecialization(e.target.value)}
                  placeholder="e.g. Organic Reaction Mechanisms, Physical Chemistry"
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded-xl text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                  WhatsApp Contact Number
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 201019688457"
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded-xl text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                  Photograph URL or Base64
                </label>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://... or data:image/..."
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded-xl text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                  Scholastic Bio & Teaching Philosophy
                </label>
                <textarea
                  rows={4}
                  required
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-hairline rounded-xl text-charcoal-900 focus:outline-none focus:border-burgundy-500"
                />
              </div>

              <div className="pt-3 border-t border-hairline flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-xs font-bold shadow-sm"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-hairline bg-ivory-100 py-8 text-xs text-charcoal-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <PhenolLogo size={28} />
          <nav className="flex items-center gap-5 font-medium">
            <Link href="/#tracks" className="hover:text-burgundy-500 transition-colors">
              Tracks
            </Link>
            <Link href="/academy" className="hover:text-burgundy-500 transition-colors">
              Phenol Academy
            </Link>
            <Link href="/faculty" className="hover:text-burgundy-500 transition-colors font-semibold text-charcoal-900">
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
