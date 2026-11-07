'use client';

import React from 'react';

export const ProblemSolvingSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      en: 'Read',
      ar: 'اقرأ',
      desc: 'قراءة السؤال وتفكيك نصه وفهم المطلوب بدقة وعمق دون التسرع بالبدء في الحل.',
    },
    {
      num: '02',
      en: 'Identify',
      ar: 'حدّد',
      desc: 'استخراج كافة المعطيات الصريحة والضمنية وتحديد المفهوم العلمي الحاكم للمسألة.',
    },
    {
      num: '03',
      en: 'Analyze',
      ar: 'حلّل',
      desc: 'تحليل العلاقات بين المتغيرات وتحديد الشروط والقيود الكيميائية والثوابت.',
    },
    {
      num: '04',
      en: 'Reason',
      ar: 'استنتج',
      desc: 'بناء سلسلة استنتاج منطقية متماسكة تربط المعطى بالمطلوب خطوة بخطوة.',
    },
    {
      num: '05',
      en: 'Solve',
      ar: 'نفّذ',
      desc: 'تنفيذ خطوات الحل والتعويض بدقة متناهية مع ضبط الوحدات والرموز.',
    },
    {
      num: '06',
      en: 'Verify',
      ar: 'راجع',
      desc: 'مراجعة منطقية النتيجة والتأكد من اتساقها العلمي وقابليتها للحدوث كيميائياً.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
              SECTION 04
            </span>
            <span className="text-hairline-strong">•</span>
            <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">التعامل مع المسائل</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
            كيف نقرأ المسألة ونحللها؟
          </h2>

          <p className="text-sm sm:text-base text-charcoal-100 leading-[1.8] font-sans">
            لا نعلّم خطوات نمطية ميكانيكية تصلح لنمط سؤال واحد، بل نبني طريقة تفكير منظمة في ست خطوات منهجية:
          </p>
        </div>

        {/* 6 Steps Grid with Editorial Hairline Bordering */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-y border-hairline divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-hairline py-6 sm:py-8">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-4 space-y-3 ${
                idx % 2 === 0 ? 'border-l sm:border-l-0 border-hairline' : ''
              }`}
            >
              <span className="font-editorial text-2xl font-bold text-burgundy-500 block">
                {step.num}
              </span>

              <div className="space-y-0.5">
                <h3 className="font-bold text-sm sm:text-base text-charcoal-900 font-sans">
                  {step.ar}
                </h3>
                <span dir="ltr" className="font-formula text-xs text-charcoal-50 uppercase tracking-widest block">
                  {step.en}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-charcoal-100 leading-[1.7] font-sans pt-1">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
