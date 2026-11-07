'use client';

import React from 'react';

export const FeynmanMethodSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      en: 'Understand',
      ar: 'افهم',
      sub: 'المعنى والغرض الحقيقي',
      desc: 'نبدأ بتحديد المعنى الحقيقي للمفهوم العلمي والمشكلة التي يفسرها ولماذا نحتاج إليه، دون التسرع بحفظ نص التعريف أو القاعدة.',
    },
    {
      num: '02',
      en: 'Deconstruct',
      ar: 'فكّك',
      sub: 'التحليل من المبادئ البسيطة',
      desc: 'تفكيك المفهوم إلى عناصره الأولية ونماذجه الأساسية لإزالة الغموض وإعادة بناء الفكرة من جذورها دون إخلال بالدقة.',
    },
    {
      num: '03',
      en: 'Explain',
      ar: 'فسّر',
      sub: 'تسلسل منطقي دون فجوات',
      desc: 'إعادة صياغة المفهوم في تسلسل منطقي محكم؛ كل خطوة تقود للتي تليها بداهةً دون قفز للنتائج أو ترك فجوات فكرية.',
    },
    {
      num: '04',
      en: 'Connect',
      ar: 'اربط',
      sub: 'الترابط المعرفي الشامل',
      desc: 'ربط الفكرة بما سبق دراسته وبالفروع الكيميائية الأخرى لرؤية العلم كنظام متكامل ومترابط لا كجزر منعزلة.',
    },
    {
      num: '05',
      en: 'Apply',
      ar: 'طبّق',
      sub: 'حل مسائل متدرجة وتحليلية',
      desc: 'الانتقال من الفهم النظري إلى حل مسائل تحليلية غير تقليدية تجمع أكثر من فكرة، وتدرب العقل على نقل المعرفة لسياقات جديدة.',
    },
    {
      num: '06',
      en: 'Teach Back',
      ar: 'أعد الشرح',
      sub: 'مقياس فاينمان للإتقان',
      desc: 'يشرح الطالب الفكرة بلغته الخاصة ويبرر اختياراته. إن تعثر، نحدد موضع الفجوة المعرفية ونعيد معالجتها فوراً.',
    },
  ];

  return (
    <section id="method" className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading with Academic Pull Quote */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
                SECTION 02
              </span>
              <span className="text-hairline-strong">•</span>
              <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">منهجية التدريس</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
              كيف تتعلم في <bdi className="font-editorial">PHENOL</bdi>&rlm;؟
            </h2>

            <p className="text-sm sm:text-base text-charcoal-100 leading-[1.8] font-sans">
              تستند تجربة التعلم بإشراف <strong className="text-charcoal-900 font-semibold font-sans">د/عمر مجدي</strong> إلى مبدأ الفيزيائي ريتشارد فاينمان: مسار من ست مراحل متسلسلة ينتقل بالطالب من الاستيعاب الأولي إلى الإتقان التام.
            </p>
          </div>

          <div className="lg:col-span-5 bg-ivory-300/60 border-r-2 border-burgundy-500 p-6 rounded-r">
            <span className="font-sans text-xs text-burgundy-500 font-bold uppercase tracking-wider block mb-1.5">
              مبدأ ريتشارد فاينمان
            </span>
            <p className="font-display text-sm sm:text-base text-charcoal-900 font-semibold leading-relaxed">
              «إذا لم تستطع شرح الفكرة ببساطة، فأنت لم تفهمها بالعمق الكافي بعد.»
            </p>
          </div>
        </div>

        {/* 6 Steps Linear Unboxed Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 border-t border-hairline pt-8">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="space-y-3 border-b border-hairline pb-6"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-editorial text-2xl font-bold text-burgundy-500">
                  {item.num}
                </span>
                <span dir="ltr" className="font-formula text-xs text-charcoal-50 uppercase tracking-widest">
                  {item.en}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-charcoal-900 font-display">
                  {item.ar} — <span className="text-xs font-normal text-charcoal-100 font-sans">{item.sub}</span>
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-charcoal-100 leading-[1.8] font-sans">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
