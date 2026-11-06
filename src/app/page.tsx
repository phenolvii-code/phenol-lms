'use client';

import React, { useState } from 'react';
import { ViewMode, ChemistryCourse, ChemistryQuiz, Booklet, StudentSubmission, ChemistryLesson } from '@/types/lms';
import {
  INSTRUCTOR,
  CHEMISTRY_COURSES,
  CHEMISTRY_QUIZZES,
  BOOKLETS,
  SUBMISSIONS,
} from '@/data/mock-data';

import { Navbar } from '@/components/layout/Navbar';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CourseCard } from '@/components/courses/CourseCard';
import { CourseModal } from '@/components/courses/CourseModal';
import { QuizRunnerModal } from '@/components/quizzes/QuizRunnerModal';
import { BookletsView } from '@/components/booklets/BookletsView';
import { InstructorConsole } from '@/components/instructor/InstructorConsole';
import { StudentTasksView } from '@/components/student/StudentTasksView';
import { AddLectureModal } from '@/components/instructor/AddLectureModal';
import { FlaskConical, Sparkles, BookOpen, Award, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('STUDENT');
  const [activeSection, setActiveSection] = useState<string>('courses');

  // Application Data States
  const [courses, setCourses] = useState<ChemistryCourse[]>(CHEMISTRY_COURSES);
  const [quizzes, setQuizzes] = useState<ChemistryQuiz[]>(CHEMISTRY_QUIZZES);
  const [booklets] = useState<Booklet[]>(BOOKLETS);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(SUBMISSIONS);

  // Modals
  const [selectedCourse, setSelectedCourse] = useState<ChemistryCourse | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<ChemistryQuiz | null>(null);
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);

  // Handlers
  const handleToggleLesson = (courseId: string, lessonId: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lessons: c.lessons.map((l) => (l.id === lessonId ? { ...l, completed: !l.completed } : l)),
        };
      })
    );

    if (selectedCourse && selectedCourse.id === courseId) {
      setSelectedCourse((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lessons: prev.lessons.map((l) => (l.id === lessonId ? { ...l, completed: !l.completed } : l)),
        };
      });
    }
  };

  const handleGradeSubmission = (subId: string, grade: number, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, grade, drFeedback: feedback, status: 'graded' } : s))
    );
  };

  const handleStudentSubmit = (newTask: Partial<StudentSubmission>) => {
    setSubmissions((prev) => [newTask as StudentSubmission, ...prev]);
  };

  const handleAddLecture = (courseId: string, newLesson: ChemistryLesson) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lessons: [...c.lessons, newLesson],
        };
      })
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbfa] text-slate-900 selection:bg-burgundy-100 selection:text-burgundy-900">
      {/* Precision Apple-Style Navbar */}
      <Navbar
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Banner only on Courses section */}
        {activeSection === 'courses' && (
          <HeroBanner
            instructor={INSTRUCTOR}
            onExploreCourses={() => {
              const el = document.getElementById('courses-grid');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenQuiz={() => setActiveQuiz(quizzes[0])}
          />
        )}

        {/* Section 1: Courses & Lectures Explorer */}
        {activeSection === 'courses' && (
          <div id="courses-grid" className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-burgundy-900/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burgundy-50 border border-burgundy-200 text-burgundy-900 text-xs font-semibold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                  <span>المساقات المعتمدة لدكتور عمر مجدي</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-burgundy-950 font-serif">
                  المقررات الأكاديمية والمحاضرات التفاعلية
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  اختر المساق لمشاهدة شرح الميكانزمات بدقة Ultra HD وتنزيل ملخصات المعادلات
                </p>
              </div>

              {viewMode === 'INSTRUCTOR' && (
                <button
                  onClick={() => setIsAddLectureOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-burgundy-950 text-gold-400 font-bold text-xs hover:bg-black transition shadow-sm"
                >
                  + إضافة محاضرة جديدة للمساق
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onSelect={setSelectedCourse}
                />
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Quizzes & Interactive Lab */}
        {activeSection === 'quizzes' && (
          <div className="space-y-6">
            <div className="border-b border-burgundy-900/10 pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-50 border border-gold-300 text-gold-900 text-xs font-semibold mb-2">
                <FlaskConical className="w-3.5 h-3.5 text-gold-700" />
                <span>المعمل وبنك التحديات الكيميائية</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-burgundy-950 font-serif">
                اختبارات تقييم الفهم والميكانزمات
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                تحديات مصممة خصيصاً لقياس قدرتك على تحليل الرنين وتوقع نواتج التفاعلات العضوية
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-3xl border border-burgundy-900/10 p-6 sm:p-8 shadow-sm hover:shadow-luxury transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <span className="px-3 py-1 rounded-full bg-gold-50 text-gold-900 border border-gold-200 text-xs font-bold font-mono">
                      {quiz.badge}
                    </span>
                    <h3 className="text-lg font-bold text-burgundy-950 font-serif">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      المساق: <strong className="text-burgundy-900">{quiz.courseTitle}</strong> • المدة الموصى بها: {quiz.durationMinutes} دقيقة
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {quiz.questions.length} أسئلة استنتاجية
                    </span>
                    <button
                      onClick={() => setActiveQuiz(quiz)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-burgundy-950 to-burgundy-900 text-gold-400 hover:text-gold-300 font-bold text-xs transition shadow"
                    >
                      <span>بدء التحدي الكيميائي</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Booklets & Handouts */}
        {activeSection === 'booklets' && <BookletsView booklets={booklets} />}

        {/* Section 4: Submissions / Console */}
        {activeSection === 'submissions' && (
          <>
            {viewMode === 'INSTRUCTOR' ? (
              <InstructorConsole
                instructor={INSTRUCTOR}
                courses={courses}
                submissions={submissions}
                onGradeSubmission={handleGradeSubmission}
                onOpenAddLectureModal={() => setIsAddLectureOpen(true)}
              />
            ) : (
              <StudentTasksView
                submissions={submissions}
                onSubmitNewTask={handleStudentSubmit}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <CourseModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
        onToggleLesson={handleToggleLesson}
      />

      <QuizRunnerModal
        quiz={activeQuiz}
        onClose={() => setActiveQuiz(null)}
      />

      <AddLectureModal
        isOpen={isAddLectureOpen}
        onClose={() => setIsAddLectureOpen(false)}
        courses={courses}
        onAddLecture={handleAddLecture}
      />

      {/* Minimalist Apple-Style Footer */}
      <footer className="mt-auto border-t border-burgundy-900/10 bg-white py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-burgundy-950 font-serif tracking-tight">
              PHENOL
            </span>
            <span>•</span>
            <span className="text-burgundy-800 font-medium">
              المنصة التخصصية في الكيمياء لدكتور عمر مجدي (Dr. Omar Magdi)
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            الهوية البصرية: بورغندي ملكي ودهبي نقي • جميع الحقوق محفوظة © 2026/2027
          </div>
        </div>
      </footer>
    </div>
  );
}
