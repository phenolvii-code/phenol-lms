'use client';

import React from 'react';
import { ArrowLeft, ChevronDown, Sparkles, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export const FeynmanMethodSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      en: 'Understand',
      ar: 'افهم',
      sub: 'المعنى والغرض الحقيقي',
      desc: 'نبدأ بتحديد المعنى الحقيقي للمفهوم العلمي والمشكلة التي يفسرها ولماذا نحتاج إليه، دون التسرع بحفظ نص التعريف أو القاعدة.',
      detail: 'ما المشكلة التي يفسرها هذا المفهوم؟ ولماذا نحتاج إليه أصلاً؟',
    },
    {
      step: '02',
      en: 'Deconstruct',
      ar: 'فكّك',
      sub: 'التحليل من المبادئ البسيطة',
      desc: 'تفكيك المفهوم إلى عناصر أولية، نماذج ذرية، علاقات رياضية، وأمثلة محسوسة لإزالة التعقيد غير الضروري دون التضحية بالدقة العلمية.',
      detail: 'إزالة الغموض وإعادة بناء الفكرة من عناصرها المجهرية الأساسية.',
    },
    {
      step: '03',
      en: 'Explain',
      ar: 'فسّر',
      sub: 'تسلسل منطقي دون فجوات',
      desc: 'إعادة صياغة المفهوم في تسلسل منطقي محكم؛ كل خطوة تقود للتي تليها بداهةً، دون القفز للنتائج أو ترك ثغرات بين المقدمة والنتيجة.',
      detail: 'بناء سلسلة استنتاج محكمة تقنع العقل خطوة بخطوة.',
    },
    {
      step: '04',
      en: 'Connect',
      ar: 'اربط',
      sub: 'الترابط المعرفي الشامل',
      desc: 'ربط الفكرة بما سبق دراسته وبالفروع الأخرى (الكيمياء العضوية بالفيزيائية، وبالفيزياء والرياضيات) لرؤية العلم كنظام متكامل.',
      detail: 'الكيمياء ليست جزراً منعزلة، بل شبكة معرفية متناغمة.',
    },
    {
      step: '05',
      en: 'Apply',
      ar: 'طبّق',
      sub: 'حل مسائل متدرجة وغير مباشرة',
      desc: 'الانتقال من الفهم النظري إلى حل مسائل تحليلية غير تقليدية تجمع أكثر من مفهوم، وتدرب العقل على نقل المعرفة لسياقات جديدة.',
      detail: 'مواقف جديدة تختبر مرونة العقل في استخدام المفهوم.',
    },
    {
      step: '06',
      en: 'Teach Back',
      ar: 'أعد الشرح',
      sub: 'مقياس فاينمان للحقيقة',
      desc: 'المرحلة الفاصلة في فلسفة فاينمان: يشرح الطالب الفكرة بلغته ويبرر اختياراته. إن تعثر، نحدد الفجوة المعرفية ونعيد بناءها فوراً.',
      detail: 'إذا استطعت شرحها ببساطة، فأنت تملكها حقاً.',
    },
  ];

  return (
    <section id="method" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="border-t border-borderSubtle pt-16 sm:pt-24 space-y-10 sm:space-y-14">
        {/* Section Heading & Feynman Quote */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cardPrimary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
              <span>The Feynman Method • طريقة التدريس</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-textPrimary tracking-tight">
              كيف تتعلم معنا؟
            </h2>
            <p className="text-textSecondary text-sm sm:text-base leading-relaxed font-normal">
              تستمد طريقة PHENOL بإشراف Dr/Omar Magdi إلهامها من فلسفة الفيزيائي ريتشارد فاينمان: رحلة تعليمية من 6 مراحل تبدأ بالفهم الأصيل وتنتهي بالتمكن التام.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="p-5 sm:p-6 rounded-2xl bg-cardPrimary border border-gold-500/30 border-r-4 border-r-burgundy-500 shadow-editorial text-textSecondary relative overflow-hidden">
              <div className="absolute top-2 left-3 text-gold-500/10 font-serif text-5xl font-black pointer-events-none">
                “
              </div>
              <span className="text-[11px] font-formula text-gold-400 block mb-1 font-semibold">
                مبدأ ريتشارد فاينمان الجوهري:
              </span>
              <p className="text-textPrimary font-bold font-serif text-sm sm:text-base leading-relaxed">
                «إذا لم تستطع شرح الفكرة بوضوح، فربما لم تفهمها بالعمق الكافي بعد.»
              </p>
            </div>
          </div>
        </div>

        {/* 6 Step Visual Journey Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="group relative bg-cardPrimary border border-borderSubtle hover:border-gold-500/50 p-6 sm:p-7 rounded-3xl transition-all duration-300 flex flex-col justify-between shadow-editorial hover:-translate-y-1 hover:shadow-burgundyGlow"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-borderSubtle/60 pb-3">
                  <span className="font-editorial text-2xl sm:text-3xl font-black text-gold-500">
                    {item.step}
                  </span>
                  <span className="font-formula text-[11px] text-textSecondary uppercase tracking-widest bg-cardSecondary px-2.5 py-1 rounded-md border border-borderSubtle/60">
                    {item.en}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-textPrimary group-hover:text-gold-400 transition-colors">
                    {item.ar} — {item.en}
                  </h3>
                  <span className="text-xs text-gold-500/90 font-medium block mt-0.5">
                    {item.sub}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-borderSubtle/60">
                <p className="text-[11px] text-textSecondary/80 font-formula leading-snug">
                  • {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
