'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CHEMISTRY_COURSES } from '@/data/mock-data';
import { ArrowLeft, Clock, Users, CheckCircle2 } from 'lucide-react';

interface ProgramsSectionProps {
  onOpenWaitlistModal?: () => void;
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('المرحلة الثانوية');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('waitlist').insert([
        {
          full_name: name,
          phone: phone,
          email: email,
          academic_level: level,
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) console.warn('Supabase waitlist notice:', error.message);
      setSubmitted(true);
      setName('');
      setPhone('');
      setEmail('');
    } catch (err) {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="programs" className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
                SECTION 05
              </span>
              <span className="text-hairline-strong">•</span>
              <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">المناهج والمسارات</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
              مسارات التعلم الأكاديمية
            </h2>

            <p className="text-sm sm:text-base text-charcoal-100 leading-[1.8] font-sans">
              برامج متخصصة ومصممة بعناية فائقة لبناء الفكر الكيميائي خطوة بخطوة، خالية من الحشو والتلقين السطحي.
            </p>
          </div>

          <div className="shrink-0 text-xs sm:text-sm text-charcoal-100 font-sans">
            العام الأكاديمي 2026 / 2027
          </div>
        </div>

        {/* Editorial Course Syllabus Index (Hairline Divided) */}
        <div className="border-y border-hairline divide-y divide-hairline">
          {CHEMISTRY_COURSES.map((course, idx) => (
            <div
              key={course.id}
              className="py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 hover:bg-ivory-300/20 transition-colors"
            >
              {/* Course Meta & Identifier */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-formula text-xs font-bold text-burgundy-500 bg-burgundy-50 px-2.5 py-1 rounded">
                    {course.code}
                  </span>
                  <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">
                    {course.level}
                  </span>
                  <span dir="ltr" className="font-formula text-xs text-charcoal-900 font-semibold bg-ivory-300 px-2 py-0.5 rounded border border-hairline">
                    {course.molecularFormula}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display">
                  {course.title}
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
                  {course.subTitle}
                </p>

                <div className="flex items-center gap-4 text-xs text-charcoal-50 font-sans pt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{course.totalHours}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{course.enrolledStudentsCount} طالب</span>
                  </span>
                </div>
              </div>

              {/* Course Description & Included Topics */}
              <div className="lg:col-span-6 space-y-3">
                <p className="text-xs sm:text-sm text-charcoal-100 leading-[1.8] font-sans">
                  {course.description}
                </p>

                <div className="pt-2">
                  <span className="text-xs font-bold text-charcoal-900 font-sans block mb-1.5">
                    المحاور الدراسية المشمولة:
                  </span>
                  <ul className="space-y-1.5 text-xs text-charcoal-100 font-sans">
                    {course.lessons.slice(0, 3).map((les) => (
                      <li key={les.id} className="flex items-start gap-2">
                        <span className="text-burgundy-500 font-bold shrink-0 mt-0.5">•</span>
                        <span>{les.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Link */}
              <div className="lg:col-span-2 flex lg:flex-col items-end lg:justify-center">
                <Link
                  href={`/courses/${course.id}`}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-burgundy-500 hover:text-burgundy-800 transition-colors py-2 px-3 rounded hover:bg-ivory-300 font-sans"
                >
                  <span>عرض المنهج</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Admission / Waitlist Section - Seamless Academic Registrar Format */}
        <div id="waitlist" className="border border-hairline rounded bg-ivory-100 p-8 sm:p-12 scroll-mt-24 shadow-quiet">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
                ADMISSION & WAITLIST
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-charcoal-900 font-display">
                طلب الالتحاق بالدفعة القادمة (2026/2027)
              </h3>
              <p className="text-xs sm:text-sm text-charcoal-100 leading-[1.8] font-sans">
                نقبل أعداداً محددة من الطلاب في كل مسار لضمان المتابعة الفردية لمسائل وتكليفات كل طالب بإشراف <strong className="text-charcoal-900">د/عمر مجدي</strong>.
              </p>
            </div>

            {submitted ? (
              <div className="bg-ivory-200 border border-hairline p-6 rounded text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-burgundy-500 mx-auto" />
                <h4 className="text-sm sm:text-base font-bold text-charcoal-900 font-display">تم تسجيل طلب الالتحاق بنجاح</h4>
                <p className="text-xs sm:text-sm text-charcoal-100 font-sans">
                  سيتواصل معك فريق القبول الأكاديمي عبر الهاتف أو البريد الإلكتروني لتأكيد موعد اختبار تحديد المستوى.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1.5 font-sans">
                      الاسم بالكامل
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="اسم الطالب ثلاثي"
                      className="w-full px-4 py-2.5 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1.5 font-sans">
                      رقم الهاتف (واتساب)
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors text-right font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1.5 font-sans">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors text-right font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-charcoal-900 mb-1.5 font-sans">
                      المرحلة الدراسية
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded bg-ivory-200 border border-hairline text-charcoal-900 text-xs sm:text-sm focus:outline-none focus:border-burgundy-500 transition-colors font-sans"
                    >
                      <option value="المرحلة الثانوية">المرحلة الثانوية العامة</option>
                      <option value="تمهيدي جامعي">تمهيدي جامعي / تحضيري</option>
                      <option value="طالب جامعي">طالب جامعي (علوم / صيدلة / طب)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet disabled:opacity-50 mt-2"
                >
                  {loading ? 'جاري التسجيل...' : 'إرسال طلب الانضمام لقائمة الانتظار'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
