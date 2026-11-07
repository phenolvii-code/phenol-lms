'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types/auth';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import {
  CHEMISTRY_COURSES,
  CHEMISTRY_QUIZZES,
  BOOKLETS,
  SUBMISSIONS,
} from '@/data/mock-data';
import { StudentSubmission } from '@/types/lms';
import {
  BookOpen,
  FileCheck2,
  FileText,
  Clock,
  CheckCircle2,
  ArrowLeft,
  LogOut,
  Download,
  HelpCircle,
} from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'tasks' | 'booklets' | 'quizzes'>('courses');
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(SUBMISSIONS);

  // New task submission state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('حل مسائل استقرار أيون الفينوكسيد بالرنين');
  const [newSolutionNotes, setNewSolutionNotes] = useState('');

  // Quiz active state
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('phenol_auth_user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      } else {
        const defaultUser: AuthUser = {
          id: 'demo-student',
          name: 'طالب كيمياء (تجريبي)',
          email: 'student@phenol.academy',
          role: 'STUDENT',
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
          registeredAt: new Date().toISOString(),
        };
        setCurrentUser(defaultUser);
        localStorage.setItem('phenol_auth_user', JSON.stringify(defaultUser));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('phenol_auth_user');
    } catch (e) {}
    router.push('/');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const sub: StudentSubmission = {
      id: `sub-${Date.now()}`,
      studentName: currentUser?.name || 'طالب كيمياء',
      studentCode: 'PHN-2026-LIVE',
      taskTitle: newTaskTitle,
      submittedAt: 'الآن',
      solutionNotes: newSolutionNotes,
      maxGrade: 20,
      status: 'pending',
    };
    setSubmissions([sub, ...submissions]);
    setIsSubmitModalOpen(false);
    setNewSolutionNotes('');
  };

  const handleAnswerSelect = (qId: string, optIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const isInstructor = currentUser?.role === 'INSTRUCTOR';

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100">
      {/* Editorial Dashboard Masthead Navigation */}
      <header className="border-b border-hairline bg-ivory-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            <div className="flex items-center gap-6">
              <Link href="/" className="shrink-0" aria-label="PHENOL Home">
                <PhenolLogo size={36} subtitle="د/عمر مجدي" />
              </Link>

              <div className="hidden sm:block border-r border-hairline pr-6">
                <span className="font-editorial text-xs font-bold text-burgundy-500 uppercase tracking-widest block leading-normal">
                  ACADEMIC PORTAL
                </span>
                <span className="text-xs sm:text-sm text-charcoal-100 font-sans">
                  منصة PHENOL التعليمية • د/عمر مجدي
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm text-charcoal-100 hover:text-charcoal-900 border border-hairline rounded transition-colors"
              >
                <span>الرئيسية</span>
              </Link>

              <div className="text-right leading-normal pr-2">
                <span className="block text-xs sm:text-sm font-bold text-charcoal-900">
                  {currentUser?.name}
                </span>
                <span className="text-xs text-charcoal-100 font-sans">
                  {isInstructor ? 'المشرف الأكاديمي (د/عمر مجدي)' : 'طالب مسجل'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="تسجيل الخروج"
                className="p-2 text-charcoal-50 hover:text-burgundy-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Welcome & Philosophy Header */}
        <div className="border border-hairline rounded bg-ivory-100 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-quiet">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider">
                STUDENT DESK
              </span>
              <span className="text-hairline-strong">•</span>
              <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">العام الأكاديمي 2026/2027</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
              أهلاً بك، {currentUser?.name}
            </h1>

            <p className="text-sm text-charcoal-100 font-sans leading-relaxed">
              «مَن فَهِمَ شَيْئًا مَلَكَهُ» — واصل تقدمك في دراسة الميكانزمات والمسائل التحليلية بإشراف <strong className="text-charcoal-900 font-sans">د/عمر مجدي</strong>.
            </p>
          </div>

          {/* Quick Continue Lecture CTA */}
          <div className="shrink-0 bg-ivory-300 p-4 rounded border border-hairline space-y-2 min-w-[280px]">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
              CURRENT FOCUS
            </span>
            <div className="font-sans font-bold text-xs sm:text-sm text-charcoal-900 line-clamp-1">
              {CHEMISTRY_COURSES[0].title}
            </div>
            <div className="text-xs text-charcoal-100 font-sans line-clamp-1">
              الدرس الثاني: الفينول والخصائص الحامضية
            </div>
            <Link
              href={`/courses/${CHEMISTRY_COURSES[0].id}/lessons/${CHEMISTRY_COURSES[0].lessons[1].id}`}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs sm:text-sm font-semibold font-sans transition-colors mt-1"
            >
              <span>متابعة المحاضرة</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex border-b border-hairline gap-2 sm:gap-6 overflow-x-auto text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('courses')}
            className={`pb-3 px-1 transition-colors relative whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'courses'
                ? 'text-charcoal-900 font-bold border-b-2 border-burgundy-500'
                : 'text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-burgundy-500" />
            <span>المساقات الدراسية ({CHEMISTRY_COURSES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 px-1 transition-colors relative whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'text-charcoal-900 font-bold border-b-2 border-burgundy-500'
                : 'text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-burgundy-500" />
            <span>التكليفات والواجبات ({submissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('booklets')}
            className={`pb-3 px-1 transition-colors relative whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'booklets'
                ? 'text-charcoal-900 font-bold border-b-2 border-burgundy-500'
                : 'text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            <FileText className="w-4 h-4 text-burgundy-500" />
            <span>الكتيبات والأطالس ({BOOKLETS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`pb-3 px-1 transition-colors relative whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'quizzes'
                ? 'text-charcoal-900 font-bold border-b-2 border-burgundy-500'
                : 'text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-burgundy-500" />
            <span>الاختبارات التقييمية ({CHEMISTRY_QUIZZES.length})</span>
          </button>
        </div>

        {/* TAB 1: Courses Grid */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
                المساقات الكيميائية المتاحة
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
                مناهج متكاملة تفكك المفاهيم من مبادئها الأساسية
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CHEMISTRY_COURSES.map((course) => (
                <div
                  key={course.id}
                  className="border border-hairline rounded bg-ivory-100 p-6 flex flex-col justify-between space-y-5 hover:border-charcoal-100 transition-colors shadow-quiet"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-hairline pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 px-2.5 py-1 rounded">
                          {course.code}
                        </span>
                        <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">
                          {course.level}
                        </span>
                      </div>

                      <span className="font-formula text-xs sm:text-sm text-charcoal-900 font-semibold bg-ivory-300 px-2.5 py-0.5 rounded border border-hairline">
                        {course.molecularFormula}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-charcoal-900 font-display">
                      {course.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
                      {course.description}
                    </p>

                    <div className="pt-2">
                      <span className="text-xs sm:text-sm font-sans font-bold text-charcoal-900 block mb-1.5">
                        الدروس المتضمنة ({course.lessons.length} محاضرات):
                      </span>
                      <ul className="space-y-1 text-xs sm:text-sm text-charcoal-100">
                        {course.lessons.map((les, lIdx) => (
                          <li key={les.id} className="flex items-center justify-between py-1 border-b border-hairline/60">
                            <span className="line-clamp-1">{lIdx + 1}. {les.title}</span>
                            <span className="font-formula text-xs text-charcoal-50 shrink-0 mr-2">
                              {les.duration}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-hairline flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-charcoal-100 font-sans">
                      {course.totalHours}
                    </span>

                    <Link
                      href={`/courses/${course.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs sm:text-sm font-semibold font-sans transition-colors"
                    >
                      <span>دخول المنهج</span>
                      <ArrowLeft className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Tasks & Submissions */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
                  التكليفات والواجبات الأكاديمية
                </h2>
                <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
                  سلم حلول المسائل والميكانزمات هنا لتصل مباشرة إلى <strong className="text-charcoal-900">د/عمر مجدي</strong> للمراجعة الشخصية
                </p>
              </div>

              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs sm:text-sm font-semibold font-sans transition-colors"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>تسليم واجب جديد للدكتور</span>
              </button>
            </div>

            {/* Submissions List */}
            <div className="border border-hairline rounded bg-ivory-100 divide-y divide-hairline shadow-quiet">
              {submissions.map((sub) => (
                <div key={sub.id} className="p-5 sm:p-6 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm sm:text-base text-charcoal-900 font-sans">
                        {sub.taskTitle}
                      </span>

                      {sub.status === 'graded' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> تم التصحيح ({sub.grade}/{sub.maxGrade})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" /> بانتظار تصحيح د/عمر مجدي
                        </span>
                      )}
                    </div>

                    <span className="font-formula text-xs text-charcoal-50">
                      {sub.submittedAt}
                    </span>
                  </div>

                  <div className="bg-ivory-200 p-3.5 rounded border border-hairline text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
                    <strong className="text-charcoal-900 block mb-1">إجابة الطالب:</strong>
                    {sub.solutionNotes}
                  </div>

                  {sub.drFeedback && (
                    <div className="bg-burgundy-50 p-3.5 rounded border border-burgundy-100 text-xs sm:text-sm text-burgundy-900 font-sans leading-relaxed">
                      <strong className="text-burgundy-800 block mb-1">
                        💬 ملاحظات د/عمر مجدي لك:
                      </strong>
                      {sub.drFeedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Booklets & Handouts */}
        {activeTab === 'booklets' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
                الأطالس والكتيبات المرجعية
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
                مذكرات دقيقة مكتوبة بخط اليد ورسوم توضيحية لجميع الميكانزمات والقوانين
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {BOOKLETS.map((book) => (
                <div
                  key={book.id}
                  className="border border-hairline rounded bg-ivory-100 p-5 flex flex-col justify-between space-y-4 shadow-quiet"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-charcoal-100 font-sans font-medium">
                      <span>{book.courseName}</span>
                      <span>{book.pages} صفحة</span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-charcoal-900 font-display">
                      {book.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
                      {book.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-hairline flex items-center justify-between">
                    <span className="font-formula text-xs text-charcoal-50">
                      {book.size} • {book.downloads} تحميل
                    </span>

                    <button
                      onClick={() => alert(`جاري تنزيل ملف: ${book.title}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-hairline hover:bg-ivory-300 text-xs sm:text-sm text-charcoal-900 font-sans transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Quizzes */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
                الاختبارات التقييمية ومسائل التفكير
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
                اختبارات قياس الفهم والربط السببي بإشراف <strong className="text-charcoal-900">د/عمر مجدي</strong>
              </p>
            </div>

            {!activeQuiz ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CHEMISTRY_QUIZZES.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="border border-hairline rounded bg-ivory-100 p-6 space-y-4 shadow-quiet"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-formula text-xs text-burgundy-500 font-bold bg-burgundy-50 px-2.5 py-1 rounded">
                        {quiz.badge}
                      </span>
                      <span className="text-xs sm:text-sm text-charcoal-100 font-sans">
                        المدة: {quiz.durationMinutes} دقيقة
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-charcoal-900 font-display">
                        {quiz.title}
                      </h3>
                      <span className="text-xs sm:text-sm text-charcoal-100 font-sans block mt-1.5">
                        المساق: {quiz.courseTitle} • {quiz.questions.length} أسئلة تحليلية
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setActiveQuiz(quiz);
                        setSelectedAnswers({});
                        setQuizSubmitted(false);
                      }}
                      className="w-full py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs sm:text-sm font-semibold font-sans transition-colors"
                    >
                      بدء الاختبار التقييمي الآن
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-hairline rounded bg-ivory-100 p-6 sm:p-8 space-y-6 shadow-quiet">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <div>
                    <span className="font-formula text-xs text-burgundy-500 font-bold uppercase block mb-1">
                      ACTIVE ASSESSMENT
                    </span>
                    <h3 className="font-bold text-lg text-charcoal-900 font-display">
                      {activeQuiz.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="text-xs sm:text-sm text-charcoal-100 hover:text-charcoal-900 underline font-sans"
                  >
                    العودة للقائمة
                  </button>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                  {activeQuiz.questions.map((q: any, qIdx: number) => (
                    <div key={q.id} className="border-b border-hairline pb-6 space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-formula text-sm font-bold text-burgundy-500">
                          0{qIdx + 1}.
                        </span>
                        <h4 className="font-sans font-bold text-sm sm:text-base text-charcoal-900 leading-relaxed">
                          {q.question}
                        </h4>
                      </div>

                      {q.molecularSnippet && (
                        <div className="font-formula text-xs bg-ivory-300 px-3 py-1.5 rounded inline-block text-charcoal-900">
                          {q.molecularSnippet}
                        </div>
                      )}

                      <div className="space-y-2 pt-1">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isSelected = selectedAnswers[q.id] === optIdx;
                          const isCorrect = q.correctIndex === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleAnswerSelect(q.id, optIdx)}
                              className={`w-full text-right p-3.5 rounded text-xs sm:text-sm transition-colors border flex items-start gap-3 font-sans leading-relaxed ${
                                quizSubmitted
                                  ? isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                    : isSelected
                                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                                    : 'bg-ivory-100 border-hairline text-charcoal-100'
                                  : isSelected
                                  ? 'bg-burgundy-50 border-burgundy-500 text-charcoal-900 font-semibold'
                                  : 'bg-ivory-100 border-hairline text-charcoal-900 hover:bg-ivory-300'
                              }`}
                            >
                              <span className="font-formula text-xs text-charcoal-50 shrink-0 mt-0.5">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="bg-ivory-300 p-4 rounded border border-hairline text-xs sm:text-sm text-charcoal-900 space-y-1.5 leading-relaxed">
                          <strong className="text-burgundy-500 block font-sans">التفسير العلمي من د/عمر مجدي:</strong>
                          <p className="font-sans text-charcoal-100">
                            {q.scientificExplanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!quizSubmitted ? (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="w-full py-3.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs sm:text-sm font-semibold font-sans transition-colors"
                  >
                    تصحيح الاختبار وعرض التفسير العلمي
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveQuiz(null);
                      setQuizSubmitted(false);
                      setSelectedAnswers({});
                    }}
                    className="w-full py-3.5 rounded bg-ivory-300 hover:bg-ivory-100 border border-hairline text-charcoal-900 text-xs sm:text-sm font-semibold font-sans transition-colors"
                  >
                    إنهاء الاختبار والعودة
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Task Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/40 backdrop-blur-sm">
          <div className="bg-ivory-100 border border-hairline rounded max-w-lg w-full p-6 space-y-4 shadow-lift">
            <h3 className="font-bold text-base sm:text-lg text-charcoal-900 font-display">
              تسليم واجب أو مسألة كيميائية
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-100 font-sans leading-relaxed">
              اكتب خطوات حلك واستنتاجك المنطقي لتصل مباشرة إلى <strong className="text-charcoal-900">د/عمر مجدي</strong>
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1.5 font-sans">
                  عنوان الواجب أو المسألة
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded bg-ivory-200 border border-hairline text-xs sm:text-sm text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1.5 font-sans">
                  خطوات الحل وتفسيرك الكيميائي
                </label>
                <textarea
                  rows={4}
                  required
                  value={newSolutionNotes}
                  onChange={(e) => setNewSolutionNotes(e.target.value)}
                  placeholder="اكتب خطوات الحل بالتفصيل مع ذكر القوانين والميكانزمات..."
                  className="w-full px-3.5 py-2.5 rounded bg-ivory-200 border border-hairline text-xs sm:text-sm text-charcoal-900 focus:outline-none focus:border-burgundy-500 font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded border border-hairline text-xs sm:text-sm text-charcoal-100 hover:bg-ivory-300 font-sans"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 text-xs sm:text-sm font-semibold font-sans"
                >
                  إرسال التكليف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
