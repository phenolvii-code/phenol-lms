'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';

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
      desc: 'تنفيذ خطوات الحل الرياضي والتعويض بدقة متناهية مع ضبط الوحدات والرموز.',
    },
    {
      num: '06',
      en: 'Verify',
      ar: 'راجع',
      desc: 'مراجعة منطقية النتيجة والتأكد من اتساقها العلمي وقابليتها للحدوث كيميائياً.',
    },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="border-t border-borderSubtle pt-16 sm:pt-24 space-y-10 sm:space-y-14">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3.5 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cardPrimary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
            <span>Problem Solving • منهجية التعامل مع المسائل</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-textPrimary tracking-tight">
            كيف نقرأ المسألة ونحللها؟
          </h2>
          <p className="text-textSecondary text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
            لا نعلّم خطوات آلية تصلح لنمط سؤال واحد فقط، بل نبني طريقة تفكير منظمة في 6 خطوات منهجية متسلسلة:
          </p>
        </div>

        {/* Steps Grid with Connectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="bg-cardPrimary border border-borderSubtle p-5 sm:p-6 rounded-2xl flex flex-col justify-between text-center space-y-3 hover:border-gold-500/50 hover:bg-cardSecondary/60 transition-all duration-300 shadow-editorial group hover:-translate-y-1"
            >
              <div className="space-y-1.5">
                <span className="font-editorial text-gold-500 font-black text-xl sm:text-2xl group-hover:scale-110 transition-transform inline-block">
                  {step.num}
                </span>
                <h3 className="font-bold text-xs sm:text-sm text-textPrimary group-hover:text-gold-300 transition-colors">
                  {step.en} — {step.ar}
                </h3>
              </div>

              <p className="text-[11px] sm:text-xs text-textSecondary leading-relaxed pt-2 border-t border-borderSubtle/60">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};