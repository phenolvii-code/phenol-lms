'use client';

import React from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';

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
      <div className="border-t border-borderSubtle pt-20 sm:pt-28 space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cardPrimary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
            The Feynman Method • طريقة التدريس
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-textPrimary tracking-tight">
            كيف تتعلم معنا؟
          </h2>
          <div className="p-4 sm:p-5 rounded-2xl bg-cardPrimary border-r-4 border-r-burgundy-500 border border-borderSubtle text-sm sm:text-base text-textSecondary leading-relaxed">
            تستمد طريقة التدريس إلهامها من فلسفة ريتشارد فاينمان: <br />
            <strong className="text-textPrimary font-semibold font-serif text-base sm:text-lg block mt-1">
              «إذا لم تستطع شرح الفكرة بوضوح، فربما لم تفهمها بالعمق الكافي بعد.»
            </strong>
          </div>
        </div>

        {/* 6 Step Visual Journey Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="group relative bg-cardPrimary border border-borderSubtle hover:border-gold-500/50 p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between shadow-editorial hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-borderSubtle/60 pb-3">
                  <span className="font-editorial text-3xl font-black text-gold-500">
                    {item.step}
                  </span>
                  <span className="font-formula text-xs text-textSecondary uppercase tracking-widest bg-cardSecondary px-2.5 py-1 rounded-md">
                    {item.en}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-textPrimary group-hover:text-gold-400 transition-colors">
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
                <p className="text-[11px] text-textSecondary/70 font-formula leading-snug">
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
