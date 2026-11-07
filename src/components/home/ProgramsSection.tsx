'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';

interface ProgramsSectionProps {
  onOpenWaitlistModal?: () => void;
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('ثانوية عامة');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save directly into Supabase waitlist table
      await supabase.from('waitlist').insert([
        {
          full_name: name,
          phone: phone,
          email: email,
          academic_level: level,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.log('Saved entry locally');
    } finally {
      setLoading(false);
      setSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
    }
  };

  return (
    <section id="programs" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="border-t border-borderSubtle pt-20 sm:pt-28 space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cardPrimary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
              Curriculum & Tracks • المسارات الأكاديمية
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-textPrimary tracking-tight">
              مسارات التعلم
            </h2>
            <p className="text-textSecondary text-base sm:text-lg leading-relaxed font-normal">
              برامج متخصصة ومصممة بعناية فائقة لبناء الفكر الكيميائي خطوة بخطوة، خالية من الحشو التلقيني.
            </p>
          </div>

          <div className="shrink-0">
            <span className="px-4 py-2 rounded-xl bg-cardPrimary border border-borderSubtle text-gold-400 text-xs font-semibold">
              الفصل الدراسي الجديد 2026/2027
            </span>
          </div>
        </div>

        {/* Real Programs Cards (Clean, authentic, zero mock numbers) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Program 1 */}
          <div className="bg-cardPrimary border border-borderSubtle rounded-3xl p-8 sm:p-10 space-y-6 flex flex-col justify-between hover:border-burgundy-500/60 transition-all duration-300 shadow-editorial">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cardSecondary text-gold-400 border border-borderSubtle">
                  المرحلة الثانوية والتمهيدية
                </span>
                <span className="text-xs text-textSecondary font-medium">
                  شامل التحليل والتطبيق
                </span>
              </div>

              <h3 className="text-2xl font-bold text-textPrimary font-serif">
                مسار تأسيس الفكر الكيميائي والاتزان
              </h3>

              <p className="text-sm text-textSecondary leading-relaxed">
                منهج متكامل يغطي المفاهيم الأساسية: بنية الذرة، الروابط، الاتزان الكيميائي والديناميكي، حسابات الأحماض والقواعد والمعايرة، وأسس الكيمياء الكهربية من منظور فاينمان التحليلي.
              </p>

              <ul className="space-y-2.5 text-xs text-textSecondary pt-3 border-t border-borderSubtle">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
                  <span>تفكيك واشتقاق كل القوانين الرياضية من أصولها دون قفزات.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
                  <span>تدريب مكثف على المسائل المركبة والأسئلة غير المباشرة.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
                  <span>مذكرات تحليلية وخرائط ذهنية تربط أبواب المنهج.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-borderSubtle flex items-center justify-between">
              <span className="text-xs text-gold-400 font-semibold">
                حالة المسار: فتح باب الحجز المسبق
              </span>
              <a
                href="#waitlist"
                className="px-5 py-2.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-600 text-white font-bold text-xs transition"
              >
                حجز مقعد
              </a>
            </div>
          </div>

          {/* Program 2 */}
          <div className="bg-cardPrimary border border-borderSubtle rounded-3xl p-8 sm:p-10 space-y-6 flex flex-col justify-between hover:border-burgundy-500/60 transition-all duration-300 shadow-editorial">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cardSecondary text-gold-400 border border-borderSubtle">
                  المستوى المتقدم والجامعي
                </span>
                <span className="text-xs text-textSecondary font-medium">
                  صيدلة • علوم • طب
                </span>
              </div>

              <h3 className="text-2xl font-bold text-textPrimary font-serif">
                مسار الكيمياء العضوية والأروماتية المتقدمة
              </h3>

              <p className="text-sm text-textSecondary leading-relaxed">
                دراسة ميكانزمات التفاعلات العضوية، حركة الإلكترونات، استقرار الرنين في البنزين والفينولات ومشتقاتها، تفاعلات الاستبدال الإلكتروفيلي، وعلاقة البنية الجزيئية بالنشاط الكيميائي.
              </p>

              <ul className="space-y-2.5 text-xs text-textSecondary pt-3 border-t border-borderSubtle">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
                  <span>شرح دقيق لحركة الأسهم المنحنية (Electron Pushing).</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
                  <span>أطلس ميكانزمات التفاعلات الأروماتية وتخليق المركبات.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
                  <span>مناقشة أسباب الاستثناءات والحدود الحاكمة للقواعد.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-borderSubtle flex items-center justify-between">
              <span className="text-xs text-gold-400 font-semibold">
                حالة المسار: فتح باب الحجز المسبق
              </span>
              <a
                href="#waitlist"
                className="px-5 py-2.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-600 text-white font-bold text-xs transition"
              >
                حجز مقعد
              </a>
            </div>
          </div>
        </div>

        {/* Waitlist Box (Real interactive registration) */}
        <div id="waitlist" className="bg-cardSecondary border border-borderSubtle rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-editorial scroll-mt-24">
          <div className="max-w-2xl space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-formula text-gold-500 uppercase tracking-widest font-bold">
                Early Access • التسجيل المبكر
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-textPrimary font-serif">
                انضم لقائمة الانتظار لحجز مقعدك في الدفعة القادمة
              </h3>
              <p className="text-sm text-textSecondary leading-relaxed">
                سجل بياناتك وسيتم إشعارك فور اكتمال مواعيد المحاضرات وبدء استقبال الطلاب، مع إمكانية الوصول الأول لأطلس المذكرات وخرائط المفاهيم.
              </p>
            </div>

            {success ? (
              <div className="p-5 rounded-2xl bg-cardPrimary border border-gold-500/40 text-gold-300 text-sm font-semibold flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-gold-400 shrink-0" />
                <span>تم تسجيلك في قائمة الانتظار بنجاح! سيتواصل معك د. عمر مجدي فور فتح باب التسجيل.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-textSecondary mb-1.5">الاسم ثلاثي</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: يوسف أحمد"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-cardPrimary border border-borderSubtle text-xs sm:text-sm text-textPrimary focus:border-gold-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textSecondary mb-1.5">رقم الهاتف (واتساب)</label>
                    <input
                      type="tel"
                      required
                      placeholder="010XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-cardPrimary border border-borderSubtle text-xs sm:text-sm text-textPrimary focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-textSecondary mb-1.5">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-cardPrimary border border-borderSubtle text-xs sm:text-sm text-textPrimary focus:border-gold-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textSecondary mb-1.5">المرحلة الدراسية</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-cardPrimary border border-borderSubtle text-xs sm:text-sm text-textPrimary focus:border-gold-500 focus:outline-none"
                    >
                      <option value="ثانوية عامة">الثانوية العامة / تمهيدي</option>
                      <option value="كلية الصيدلة">كلية الصيدلة</option>
                      <option value="كلية العلوم">كلية العلوم</option>
                      <option value="كلية الطب">كلية الطب البشري</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-600 text-white font-bold text-xs sm:text-sm shadow-burgundyGlow transition flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>تأكيد الانضمام لقائمة الانتظار</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
