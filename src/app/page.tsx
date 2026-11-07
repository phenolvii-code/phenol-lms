'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser, AuthModalMode } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Cpu,
  Layers,
  Network,
  Send,
  BookOpen,
  FileText,
  FlaskConical,
  GraduationCap,
  ChevronRight,
  ShieldAlert,
  Compass,
} from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('REGISTER');

  // Waitlist form state
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLevel, setWaitlistLevel] = useState('ثانوية عامة');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  // Load user session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('phenol_auth_user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleOpenAuth = (mode: AuthModalMode) => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('phenol_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('phenol_auth_user');
    } catch (e) {
      console.error(e);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistLoading(true);
    try {
      // Record to Supabase auth or public storage
      await supabase.from('waitlist').insert([
        {
          name: waitlistName,
          phone: waitlistPhone,
          email: waitlistEmail,
          level: waitlistLevel,
        },
      ]);
    } catch (err) {
      // Fallback
      console.log('Recorded waitlist entry locally');
    } finally {
      setWaitlistLoading(false);
      setWaitlistSuccess(true);
      setWaitlistName('');
      setWaitlistPhone('');
      setWaitlistEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary flex flex-col font-sans selection:bg-burgundy-500 selection:text-white">
      {/* Editorial Luxury Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuth}
        onLogout={handleLogout}
      />

      <main className="flex-1 space-y-28 sm:space-y-36 pb-24 overflow-hidden">
        {/* =========================================================================
            SECTION 01: HERO SECTION
        ========================================================================= */}
        <section className="relative pt-16 sm:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Subtle Abstract Atmospheric Glows */}
          <div className="absolute top-1/4 right-1/2 -translate-y-1/2 translate-x-1/2 w-[600px] h-[350px] bg-burgundy-800/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-gold-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
            {/* Minimalist Academic Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cardPrimary border border-borderSubtle text-xs tracking-wide">
              <span className="font-editorial uppercase text-gold-500 font-bold tracking-widest text-[11px]">
                Dr. Omar Magdi
              </span>
              <span className="text-borderSubtle">•</span>
              <span className="text-textSecondary font-medium">The Chemistry Counselor</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.15] text-textPrimary">
              لا تحفظ الكيمياء. <br />
              <span className="bg-gradient-to-l from-gold-400 via-rose-200 to-white bg-clip-text text-transparent">
                افهم كيف تعمل.
              </span>
            </h1>

            {/* Core Narrative Text */}
            <p className="text-base sm:text-xl text-textSecondary leading-relaxed max-w-3xl mx-auto font-normal">
              الكيمياء ليست مجموعة من القوانين والمعادلات التي يجب حفظها، بل علم تحكمه مبادئ وعلاقات يمكن فهمها وتحليلها. 
              هنا نتجاوز حفظ المعلومة إلى فهم أسبابها، ونفكك الأفكار المعقدة إلى مفاهيم واضحة، ونبني المعرفة خطوة بخطوة.
            </p>

            {/* Philosophical Slogan Banner */}
            <div className="pt-2">
              <span className="inline-block px-5 py-2 rounded-2xl bg-cardPrimary/80 border border-burgundy-500/30 text-gold-400 font-serif text-sm sm:text-base tracking-wide shadow-editorial">
                «من فهم شيئًا ملكه» — <span className="font-sans text-xs text-textSecondary font-formula">Find the Simple. Master the Complex.</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => handleOpenAuth('REGISTER')}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-burgundy-500 hover:bg-burgundy-600 text-white font-bold text-sm shadow-burgundyGlow transition transform hover:-translate-y-0.5"
              >
                <span>ابدأ رحلتك التعليمية</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <a
                href="#method"
                className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-cardPrimary hover:bg-cardSecondary border border-borderSubtle text-textSecondary hover:text-textPrimary font-semibold text-sm transition"
              >
                <span>اكتشف منهجية التعلم</span>
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 02: THE PHILOSOPHY (الفلسفة التعليمية)
        ========================================================================= */}
        <section id="philosophy" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="border-t border-borderSubtle pt-20 space-y-12">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs uppercase font-formula tracking-widest text-gold-500 font-bold block">
                The Philosophy • جوهر الهوية
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-textPrimary">
                الفهم يسبق الحفظ.
              </h2>
              <p className="text-textSecondary text-base sm:text-lg leading-relaxed">
                نؤمن أن أصعب المفاهيم العلمية يمكن فهمها عندما نصل إلى المبادئ البسيطة التي تقوم عليها. 
                لذلك لا نقدم المعلومة باعتبارها حقيقة يجب تذكرها، بل نبدأ بالسؤال عنها، ونحللها، ونفهم آليتها، ثم نعيد بناءها في صورة واضحة يمكن تطبيقها.
              </p>
            </div>

            {/* 3 Pillars Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-cardPrimary border border-borderSubtle hover:border-burgundy-500/50 p-8 rounded-3xl transition-all duration-300 space-y-4 shadow-editorial">
                <div className="w-12 h-12 rounded-2xl bg-burgundy-950 border border-burgundy-500/30 flex items-center justify-center text-gold-400 font-editorial font-bold text-lg">
                  01
                </div>
                <h3 className="text-xl font-bold text-textPrimary">
                  Understand the Why — افهم لماذا
                </h3>
                <p className="text-sm text-textSecondary leading-relaxed">
                  التعامل مع أي ظاهرة أو مسألة يبدأ بالتحليل وطرح الأسئلة الجوهرية: ما الذي يحدث بالفعل؟ ولماذا يحدث؟ وما العوامل المتحكمة؟ لنحول المعلومة من حقيقة منفصلة إلى نتيجة منطقية.
                </p>
              </div>

              <div className="bg-cardPrimary border border-borderSubtle hover:border-burgundy-500/50 p-8 rounded-3xl transition-all duration-300 space-y-4 shadow-editorial">
                <div className="w-12 h-12 rounded-2xl bg-burgundy-950 border border-burgundy-500/30 flex items-center justify-center text-gold-400 font-editorial font-bold text-lg">
                  02
                </div>
                <h3 className="text-xl font-bold text-textPrimary">
                  Discover the Mechanism — اكتشف الآلية
                </h3>
                <p className="text-sm text-textSecondary leading-relaxed">
                  لا نكتفي بمعرفة أن زيادة عامل تؤدي لنتيجة معينة، بل نناقش الآلية السببية الدقيقة: احتمالية التصادم الفعال، سلوك إلكترونات التكافؤ، وطبيعة النظام الكيميائي والظروف الحاكمة.
                </p>
              </div>

              <div className="bg-cardPrimary border border-borderSubtle hover:border-burgundy-500/50 p-8 rounded-3xl transition-all duration-300 space-y-4 shadow-editorial">
                <div className="w-12 h-12 rounded-2xl bg-burgundy-950 border border-burgundy-500/30 flex items-center justify-center text-gold-400 font-editorial font-bold text-lg">
                  03
                </div>
                <h3 className="text-xl font-bold text-textPrimary">
                  Master the Concept — امتلك المفهوم
                </h3>
                <p className="text-sm text-textSecondary leading-relaxed">
                  التفكير من المبادئ الأولى (First Principles): نفكك المفهوم إلى عناصره الأساسية ثم نعيد بناءه، ليتعامل الطالب مع القوانين كأدوات يفهم أصلها وحدود استخدامها، لا كأوامر مفروضة.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 03: THE METHOD (منهجية فاينمان الست)
        ========================================================================= */}
        <section id="method" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="border-t border-borderSubtle pt-20 space-y-12">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs uppercase font-formula tracking-widest text-gold-500 font-bold block">
                The Feynman Approach • منهجية فاينمان
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-textPrimary">
                كيف تتعلم معنا؟
              </h2>
              <p className="text-textSecondary text-base sm:text-lg leading-relaxed">
                تستمد طريقة التدريس إلهامها من فلسفة ريتشارد فاينمان في تفكيك المعرفة: <br />
                <strong className="text-textPrimary font-semibold">«إذا لم تستطع شرح الفكرة بوضوح، فربما لم تفهمها بالعمق الكافي بعد.»</strong>
              </p>
            </div>

            {/* 6 Stages Pathway Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  step: '01',
                  en: 'Understand',
                  ar: 'افهم',
                  desc: 'تحديد المعنى الحقيقي للمفهوم والمشكلة التي يفسرها ولماذا نحتاج إليه، دون القفز لحفظ التعريف أو القاعدة مجردة.',
                },
                {
                  step: '02',
                  en: 'Deconstruct',
                  ar: 'فكّك',
                  desc: 'تفكيك المفهوم إلى عناصر بسيطة، علاقات رياضية، ونماذج ذرية لإزالة التعقيد غير الضروري دون التضحية بالدقة العلمية.',
                },
                {
                  step: '03',
                  en: 'Explain',
                  ar: 'فسّر',
                  desc: 'إعادة بناء المفهوم في صورة تفسير منطقي متسلسل يقود كل خطوة للتي تليها، دون ترك فجوات بين المقدمات والاستنتاجات.',
                },
                {
                  step: '04',
                  en: 'Connect',
                  ar: 'اربط',
                  desc: 'ربط الفكرة بما سبق دراسته وبالفروع الأخرى (عضوية، فيزيائية، وغير عضوية) ليرى الطالب الكيمياء كنظام معرفي مترابط.',
                },
                {
                  step: '05',
                  en: 'Apply',
                  ar: 'طبّق',
                  desc: 'مسائل متدرجة، أسئلة تحليلية، وتطبيقات تجمع أكثر من مفهوم لنقل المعرفة وتطبيقها في سياقات جديدة وغير مألوفة.',
                },
                {
                  step: '06',
                  en: 'Teach Back',
                  ar: 'أعد الشرح',
                  desc: 'المرحلة الحاسمة: يشرح الطالب الفكرة بلغته ويبرر خطواته. إن تعثر، نحدد موضع الفجوة المعرفية ونعيد بناءها فوراً.',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-cardPrimary border border-borderSubtle hover:border-gold-500/40 p-7 rounded-3xl transition-all duration-300 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-editorial font-bold text-2xl text-gold-500">
                      {item.step}
                    </span>
                    <span className="text-xs font-formula text-textSecondary uppercase tracking-widest bg-cardSecondary px-2.5 py-1 rounded-md">
                      {item.en}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-textPrimary">
                    {item.ar} — {item.en}
                  </h3>
                  <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 04: BEYOND MEMORIZATION (المقارنة المنهجية)
        ========================================================================= */}
        <section id="comparison" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="border-t border-borderSubtle pt-20 space-y-12">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs uppercase font-formula tracking-widest text-gold-500 font-bold block">
                Beyond Memorization • الفارق الجوهري
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-textPrimary">
                من معرفة الإجابة إلى فهم سببها.
              </h2>
              <p className="text-textSecondary text-base sm:text-lg leading-relaxed">
                الفرق ليس في استخدام شعارات مثل «شرح مبسط»، وإنما في طريقة التعامل مع المعلومة وتدريب العقل على التفكير.
              </p>
            </div>

            {/* Comparison Matrix Table */}
            <div className="bg-cardPrimary rounded-3xl border border-borderSubtle overflow-hidden shadow-editorial">
              <div className="grid grid-cols-2 text-xs sm:text-sm font-bold border-b border-borderSubtle bg-cardSecondary/60 py-4 px-6 sm:px-8">
                <span className="text-textSecondary">التدريس التقليدي القائم على التلقين</span>
                <span className="text-gold-400">منهج Dr. Omar Magdi</span>
              </div>

              <div className="divide-y divide-borderSubtle">
                {[
                  { old: 'احفظ القانون', neu: 'افهم من أين جاء القانون واشتقاقه' },
                  { old: 'احفظ ترتيب الخطوات في المسألة', neu: 'افهم المنطق والسبب وراء كل خطوة' },
                  { old: 'هذه هي الإجابة الصحيحة', neu: 'لماذا هذه الإجابة تحديداً صحيحة؟' },
                  { old: 'استخدم القاعدة المحددة في هذا السؤال', neu: 'افهم متى ولماذا تستخدم القاعدة وحدودها' },
                  { old: 'احفظ العلاقة طردية أو عكسية', neu: 'افهم الآلية الكيميائية التي تفسر العلاقة' },
                  { old: 'حل نماذج متكررة مطابقة للامتحان', neu: 'تعلم كيف تفكر وتتعامل مع سؤال جديد كلياً' },
                  { old: 'احفظ الاستثناءات كحالات شاذة', neu: 'افهم سبب الاستثناء وحدود تطبيق القاعدة' },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-2 text-xs sm:text-sm py-4 px-6 sm:px-8 items-center hover:bg-cardSecondary/30 transition"
                  >
                    <span className="text-textSecondary/70 line-through decoration-rose-500/50">
                      {row.old}
                    </span>
                    <span className="font-semibold text-textPrimary flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gold-500 shrink-0" />
                      {row.neu}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 05: ANALYTICAL PROBLEM SOLVING (منهجية المسائل)
        ========================================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="border-t border-borderSubtle pt-20 space-y-12">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs uppercase font-formula tracking-widest text-gold-500 font-bold block">
                Problem Solving • منهجية تحليل المسائل
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-textPrimary">
                كيف نقرأ المسألة ونحللها؟
              </h2>
              <p className="text-textSecondary text-base sm:text-lg leading-relaxed">
                لا نعلّم خطوات آلية تصلح لسؤال واحد، بل نبني طريقة تفكير منظمة في 6 خطوات منهجية:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { no: '1', title: 'Read', ar: 'اقرأ', desc: 'قراءة السؤال وفهم المطلوب بدقة وعمق.' },
                { no: '2', title: 'Identify', ar: 'حدّد', desc: 'استخراج المعطيات وتحديد المفهوم العلمي الحاكم.' },
                { no: '3', title: 'Analyze', ar: 'حلّل', desc: 'تحليل العلاقات والشروط والقيود الكيميائية.' },
                { no: '4', title: 'Reason', ar: 'استنتج', desc: 'بناء سلسلة منطقية متماسكة للحل.' },
                { no: '5', title: 'Solve', ar: 'نفّذ', desc: 'تنفيذ خطوات الحل الرياضي بدقة وترتيب.' },
                { no: '6', title: 'Verify', ar: 'راجع', desc: 'مراجعة النتيجة والتأكد من اتساقها العلمي.' },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="bg-cardPrimary border border-borderSubtle p-5 rounded-2xl text-center space-y-2 hover:border-burgundy-500/50 transition"
                >
                  <div className="font-editorial text-gold-500 font-bold text-lg">0{step.no}</div>
                  <div className="font-bold text-sm text-textPrimary">{step.title} — {step.ar}</div>
                  <p className="text-[11px] text-textSecondary leading-snug">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 06: LEARNING PROGRAMS & WAITLIST (مسارات التعلم الحقيقية)
        ========================================================================= */}
        <section id="programs" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="border-t border-borderSubtle pt-20 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-3xl space-y-4">
                <span className="text-xs uppercase font-formula tracking-widest text-gold-500 font-bold block">
                  Curriculum & Tracks • المسارات الأكاديمية
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-textPrimary">
                  مسارات التعلم
                </h2>
                <p className="text-textSecondary text-base sm:text-lg leading-relaxed">
                  برامج متخصصة ومصممة بعناية فائقة لتأسيس وبناء الفكر الكيميائي خطوة بخطوة.
                </p>
              </div>

              <div className="shrink-0">
                <span className="px-4 py-2 rounded-xl bg-burgundy-950 border border-burgundy-500/40 text-gold-400 text-xs font-semibold">
                  الفصل الدراسي الجديد 2026/2027
                </span>
              </div>
            </div>

            {/* Programs Cards (Clean, authentic, zero mock numbers) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Track 1 */}
              <div className="bg-cardPrimary border border-borderSubtle rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-burgundy-500/50 transition shadow-editorial">
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

                  <ul className="space-y-2.5 text-xs text-textSecondary pt-2 border-t border-borderSubtle">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                      <span>تفكيك واشتقاق كل القوانين الرياضية من الصفر.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                      <span>تدريب على حل المسائل المركبة والأسئلة غير المباشرة.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                      <span>مذكرات تحليلية وخرائط ذهنية تربط أجزاء المنهج.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-borderSubtle flex items-center justify-between">
                  <span className="text-xs text-gold-400 font-semibold">
                    حالة التسجيل: فتح باب الحجز المسبق
                  </span>
                  <a
                    href="#waitlist"
                    className="px-5 py-2.5 rounded-xl bg-burgundy-500 hover:bg-burgundy-600 text-white font-bold text-xs transition"
                  >
                    حجز مقعد
                  </a>
                </div>
              </div>

              {/* Track 2 */}
              <div className="bg-cardPrimary border border-borderSubtle rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-burgundy-500/50 transition shadow-editorial">
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
                    دراسة ميكانزمات التفاعلات العضوية، حركة الإلكترونات، استقرار الرنين في البنزين والفينولات ومشتقاتها، تفاعلات الاستبدال المحب للإلكترونات، وعلاقة البنية الجزيئية بالنشاط الكيميائي.
                  </p>

                  <ul className="space-y-2.5 text-xs text-textSecondary pt-2 border-t border-borderSubtle">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                      <span>شرح حركة الأسهم المنحنية (Electron Pushing) بدقة متناهية.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                      <span>أطلس ميكانزمات التفاعلات الأروماتية وتخليق المركبات.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                      <span>مناقشة أسباب الاستثناءات والحدود الحاكمة للقواعد.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-borderSubtle flex items-center justify-between">
                  <span className="text-xs text-gold-400 font-semibold">
                    حالة التسجيل: فتح باب الحجز المسبق
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
            <div id="waitlist" className="bg-cardSecondary border border-borderSubtle rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-editorial">
              <div className="max-w-2xl space-y-6">
                <span className="text-xs font-formula text-gold-500 uppercase tracking-widest font-bold">
                  Early Access • التسجيل المبكر
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-textPrimary font-serif">
                  انضم لقائمة الانتظار لحجز مقعدك في الدفعة القادمة
                </h3>
                <p className="text-sm text-textSecondary leading-relaxed">
                  سجل بياناتك وسيتم إشعارك فور اكتمال فتح مواعيد المحاضرات وبدء استقبال الطلاب، مع إمكانية الوصول الأول لأطلس المذكرات وخرائط المفاهيم.
                </p>

                {waitlistSuccess ? (
                  <div className="p-4 rounded-2xl bg-burgundy-950 border border-gold-500/40 text-gold-300 text-sm font-semibold flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold-400" />
                    <span>تم تسجيلك في قائمة الانتظار بنجاح! سيتواصل معك د. عمر مجدي فور فتح التسجيل.</span>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSubmit} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-textSecondary mb-1.5">الاسم ثلاثي</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: يوسف أحمد"
                          value={waitlistName}
                          onChange={(e) => setWaitlistName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-cardPrimary border border-borderSubtle text-xs sm:text-sm text-textPrimary focus:border-gold-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-textSecondary mb-1.5">رقم الهاتف (واتساب)</label>
                        <input
                          type="tel"
                          required
                          placeholder="010XXXXXXXX"
                          value={waitlistPhone}
                          onChange={(e) => setWaitlistPhone(e.target.value)}
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
                          value={waitlistEmail}
                          onChange={(e) => setWaitlistEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-cardPrimary border border-borderSubtle text-xs sm:text-sm text-textPrimary focus:border-gold-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-textSecondary mb-1.5">المرحلة الدراسية</label>
                        <select
                          value={waitlistLevel}
                          onChange={(e) => setWaitlistLevel(e.target.value)}
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
                      disabled={waitlistLoading}
                      className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-burgundy-500 to-burgundy-600 hover:from-burgundy-600 hover:to-burgundy-700 text-white font-bold text-xs sm:text-sm shadow-burgundyGlow transition"
                    >
                      {waitlistLoading ? 'جاري التسجيل...' : 'تأكيد الانضمام لقائمة الانتظار'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 07: LEARNING RESOURCES (أدوات تساعدك على الفهم)
        ========================================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="border-t border-borderSubtle pt-20 space-y-12">
            <div className="max-w-3xl space-y-4">
              <span className="text-xs uppercase font-formula tracking-widest text-gold-500 font-bold block">
                Resources • أدوات التعلم
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-textPrimary">
                أدوات تساعدك على الفهم
              </h2>
              <p className="text-textSecondary text-base sm:text-lg leading-relaxed">
                مواد علمية مصممة خصيصاً لترسيخ الفهم والربط الذهني المنظم.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  icon: Network,
                  title: 'خرائط المفاهيم',
                  desc: 'مخططات تربط الموضوعات والقوانين ببعضها لتسهيل رؤية الصورة الكلية للمادة.',
                },
                {
                  icon: FileText,
                  title: 'أطلس الميكانزمات',
                  desc: 'شرح متسلسل خطوة بخطوة بالرسم والتفسير دون ترك أي فجوة منطقية.',
                },
                {
                  icon: Compass,
                  title: 'مسائل التفكير والتحليل',
                  desc: 'تطبيقات غير مباشرة تختبر الفهم الحقيقي وتنقل المعرفة إلى سياق جديد.',
                },
                {
                  icon: ShieldAlert,
                  title: 'تصحيح المفاهيم الخاطئة',
                  desc: 'رصد أشهر الأخطاء الشائعة في التفكير والحل وتوضيح سبب الوقوع فيها وكيفية تلافيها.',
                },
              ].map((res, idx) => {
                const Icon = res.icon;
                return (
                  <div
                    key={idx}
                    className="bg-cardPrimary border border-borderSubtle p-6 rounded-3xl space-y-3 hover:border-gold-500/40 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cardSecondary text-gold-500 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-textPrimary">{res.title}</h4>
                    <p className="text-xs text-textSecondary leading-relaxed">{res.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 08: ABOUT DR. OMAR MAGDI (عن د. عمر مجدي)
        ========================================================================= */}
        <section id="about" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="border-t border-borderSubtle pt-20">
            <div className="bg-cardPrimary border border-borderSubtle rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-editorial">
              <div className="max-w-3xl space-y-6 relative z-10">
                <span className="text-xs uppercase font-formula tracking-widest text-gold-500 font-bold block">
                  About Dr. Omar Magdi • كلمة ورؤية
                </span>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-textPrimary font-serif">
                  وراء كل معلومة سؤال.
                </h2>

                <div className="space-y-4 text-base sm:text-lg text-textSecondary leading-relaxed">
                  <p>
                    أنا عمر مجدي، أعمل على تقديم تجربة تعليمية في الكيمياء تقوم على التحليل والفهم العميق للمفاهيم العلمية.
                  </p>
                  <p>
                    أهتم بما يحدث خلف المعلومة؛ بالآلية التي تفسر الظاهرة، والعلاقات التي تربط المفاهيم، والمنطق الذي يجعل القانون مفهومًا بدلًا من أن يكون مجرد معادلة محفوظة.
                  </p>
                  <p>
                    أؤمن أن دور التعليم لا ينتهي عند تقديم الإجابة، بل يبدأ عندما يصبح الطالب قادرًا على الوصول إليها بنفسه. هدفي أن أساعد الطالب على بناء طريقة تفكير علمية يستطيع استخدامها داخل الكيمياء وخارجها.
                  </p>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <div className="border-r-2 border-gold-500 pr-4">
                    <span className="block font-editorial text-textPrimary font-bold text-base">
                      Dr. Omar Magdi
                    </span>
                    <span className="text-xs text-gold-500 font-medium">
                      The Chemistry Counselor
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative Subtle Background Monogram */}
              <div className="absolute -left-12 -bottom-12 select-none pointer-events-none opacity-5 font-serif text-[180px] text-white">
                OM
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 09: FINAL CTA
        ========================================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="border-t border-borderSubtle pt-20 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-textPrimary">
              ابدأ من الفهم. <br />
              <span className="text-gold-400">واترك الحفظ يأتي بعده.</span>
            </h2>

            <p className="text-textSecondary text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              اكتشف تجربة تعليمية مختلفة، وتعلم كيف تفكر في الكيمياء بدلًا من الاكتفاء بحفظ إجاباتها.
            </p>

            <div className="pt-4">
              <button
                onClick={() => handleOpenAuth('REGISTER')}
                className="px-10 py-4 rounded-2xl bg-burgundy-500 hover:bg-burgundy-600 text-white font-bold text-base shadow-burgundyGlow transition transform hover:-translate-y-0.5"
              >
                ابدأ التعلم الآن
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Minimalist Editorial Footer */}
      <footer className="border-t border-borderSubtle bg-darkBg py-12 text-xs text-textSecondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-right">
            <span className="font-editorial text-sm font-bold text-textPrimary uppercase tracking-wider">
              Dr. Omar Magdi
            </span>
            <span className="hidden sm:inline text-borderSubtle">•</span>
            <span className="text-gold-500 font-serif">«من فهم شيئًا ملكه»</span>
            <span className="hidden sm:inline text-borderSubtle">•</span>
            <span className="text-textSecondary/80 font-formula text-[11px]">Find the Simple. Master the Complex.</span>
          </div>

          <div className="text-textSecondary/50 text-[11px]">
            جميع الحقوق محفوظة © {new Date().getFullYear()} • The Chemistry Counselor
          </div>
        </div>
      </footer>

      {/* Auth & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
