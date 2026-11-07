'use client';

import React from 'react';

export const ComparisonSection: React.FC = () => {
  const comparisons = [
    {
      topic: 'القوانين العلمية',
      old: 'احفظ نص القانون كما ورد في الكتاب لتطبقه حرفياً دون نقاش.',
      neu: 'افهم أصل القانون، وكيف تم اشتقاقه، وشروط صحته، وحدود استخدامه بدقة.',
    },
    {
      topic: 'خطوات الحل',
      old: 'احفظ نمط الخطوات المتبع في كل مسألة وكرره آلياً.',
      neu: 'افهم المنطق العلمي والسبب الكيميائي خلف كل خطوة في الحل.',
    },
    {
      topic: 'الإجابة النموذجية',
      old: 'هذه هي الإجابة الصحيحة الوحيدة المعتمدة للتصحيح.',
      neu: 'لماذا هذه الإجابة تحديداً صحيحة علمياً، وما الذي يجعل غيرها خاطئاً؟',
    },
    {
      topic: 'تطبيق القواعد',
      old: 'طبّق هذه القاعدة كلما رأيت نمط هذا السؤال.',
      neu: 'تحديد متى ولماذا تنطبق القاعدة، واستيعاب قيودها وظروف استثنائها.',
    },
    {
      topic: 'العلاقات والمتغيرات',
      old: 'احفظ أن العلاقة بين العاملين طردية أو عكسية.',
      neu: 'تحليل الآلية الحركية والسببية الدقيقة التي تنتج عنها هذه العلاقة.',
    },
    {
      topic: 'التعامل مع المسائل',
      old: 'تكرار حل نماذج متطابقة للامتحانات السابقة.',
      neu: 'قراءة مسألة جديدة وتحليل معطياتها ومطلوبها من المبادئ الأساسية.',
    },
    {
      topic: 'الاستثناءات الكيميائية',
      old: 'حفظ الاستثناءات كحالات شاذة مفروضة دون تفكير.',
      neu: 'فهم السبب العلمي المنطقي للاستثناء، والحدود التي ينتهي عندها انتظام القاعدة.',
    },
  ];

  return (
    <section id="comparison" className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
              SECTION 03
            </span>
            <span className="text-hairline-strong">•</span>
            <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">ما وراء الحفظ</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
            من معرفة الإجابة إلى فهم أسبابها.
          </h2>

          <p className="text-sm sm:text-base text-charcoal-100 leading-[1.8] font-sans">
            الفرق لا يكمن في شعارات التسويق، بل في طريقة التعامل مع العقل وتدريبه على التفكير المنظم وتفكيك العلاقات العلمية.
          </p>
        </div>

        {/* Editorial Comparative Matrix */}
        <div className="border-y border-hairline divide-y divide-hairline">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-12 py-4 px-2 text-xs sm:text-sm font-semibold text-charcoal-900 bg-ivory-300/40">
            <div className="col-span-3 font-sans font-bold text-charcoal-900">
              المحور العلمي
            </div>
            <div className="col-span-4 text-charcoal-100 flex items-center gap-2 font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-charcoal-50 shrink-0" />
              <span>التدريس التقليدي (التلقين والحفظ)</span>
            </div>
            <div className="col-span-5 text-burgundy-500 font-bold flex items-center gap-2 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500 shrink-0" />
              <span>منهج PHENOL — بإشراف د/عمر مجدي</span>
            </div>
          </div>

          {/* Table Rows */}
          {comparisons.map((row, idx) => (
            <div
              key={idx}
              className="py-5 px-2 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 hover:bg-ivory-300/30 transition-colors"
            >
              {/* Topic Column */}
              <div className="md:col-span-3 flex items-center justify-between md:block">
                <span className="font-sans font-bold text-sm text-charcoal-900">
                  {row.topic}
                </span>
                <span className="md:hidden font-formula text-xs text-charcoal-50">
                  0{idx + 1}
                </span>
              </div>

              {/* Traditional Column */}
              <div className="md:col-span-4 flex items-start gap-2.5 text-xs sm:text-sm text-charcoal-100 font-sans leading-[1.7]">
                <span className="shrink-0 text-charcoal-50 font-bold mt-0.5">✕</span>
                <span className="line-through decoration-charcoal-50/60">
                  {row.old}
                </span>
              </div>

              {/* PHENOL Column */}
              <div className="md:col-span-5 flex items-start gap-2.5 text-xs sm:text-sm font-medium text-charcoal-900 font-sans leading-[1.7]">
                <span className="shrink-0 text-burgundy-500 font-bold mt-0.5">✓</span>
                <span>
                  {row.neu}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
