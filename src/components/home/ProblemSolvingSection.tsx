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
      desc: 'تحليل العلاقات بين المتغيرات وتحديد الشروط والقيود الكيميائية والثوابت الفيزيائية.',
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
      desc: 'تنفيذ خطوات الحل الرياضي والتعويض بدقة متناهية مع ضبط الوحدات والرموز.',
    },
    {
      num: '06',
      en: 'Verify',
      ar: 'راجع',
      desc: 'مراجعة منطقية النتيجة والتأكد من اتساقها العلمي وقابليتها للحدوث في الواقع الكيميائي.',
    },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="border-t border-borderSubtle pt-20 sm:pt-28 space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cardPrimary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
            Problem Solving • منهجية المسائل
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-textPrimary tracking-tight">
            كيف نقرأ المسألة ونحللها؟
          </h2>
          <p className="text-textSecondary text-base sm:text-lg leading-relaxed font-normal">
            لا نعلّم خطوات آلية تصلح لسؤال واحد فقط، بل نبني طريقة تفكير منظمة في 6 خطوات منهجية راسخة:
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-cardPrimary border border-borderSubtle p-6 rounded-2xl flex flex-col justify-between text-center space-y-3 hover:border-burgundy-500/60 transition-colors shadow-editorial group"
            >
              <div className="space-y-1">
                <span className="font-editorial text-gold-500 font-black text-xl group-hover:scale-110 transition-transform inline-block">
                  {step.num}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-textPrimary">
                  {step.en} — {step.ar}
                </h3>
              </div>

              <p className="text-[11px] sm:text-xs text-textSecondary leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
