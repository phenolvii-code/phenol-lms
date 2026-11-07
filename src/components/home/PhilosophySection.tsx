'use client';

import React from 'react';

export const PhilosophySection: React.FC = () => {
  const pillars = [
    {
      num: '01',
      enTitle: 'Analytical Thinking',
      arTitle: 'التفكير التحليلي',
      desc: 'التعامل مع أي ظاهرة أو مسألة علمية يبدأ بتحليل مكوناتها وطرح الأسئلة الحاكمة: ما الذي يحدث بالفعل؟ ولماذا يحدث؟ وما العوامل التي تتحكم فيه؟ لنحول المعلومة من حقيقة منفصلة إلى نتيجة منطقية تستطيع استنتاجها بنفسك.',
      keyQuestion: 'ما الذي يحدث بالفعل؟ ولماذا؟',
    },
    {
      num: '02',
      enTitle: 'Causal Reasoning',
      arTitle: 'التفكير السببي',
      desc: 'لا نكتفي بمعرفة أن زيادة عامل معين تؤدي لنتيجة معينة، بل نفهم الآلية السببية التي تربط السبب بالنتيجة: طبيعة التصادمات الفعالة، وسلوك الإلكترونات، والظروف التي قد تتغير فيها العلاقة.',
      keyQuestion: 'الآلية التي تربط السبب بالنتيجة',
    },
    {
      num: '03',
      enTitle: 'First Principles',
      arTitle: 'المبادئ الأولى',
      desc: 'بدل فرض القوانين كقواعد جاهزة ومطلوبة للحفظ، نبدأ من المبادئ العلمية البسيطة التي أدت إليها، لنفهم أصل القانون، ومجال قوته، وحدود استخدامه في السياقات المختلفة.',
      keyQuestion: 'إعادة بناء القانون من جذوره',
    },
  ];

  return (
    <section id="philosophy" className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading - Academic Style */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
              SECTION 01
            </span>
            <span className="text-hairline-strong">•</span>
            <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">جوهر الهوية الفلسفية</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
            الفهم يسبق الحفظ.
          </h2>

          <p className="text-sm sm:text-base text-charcoal-100 leading-[1.8] font-sans">
            نؤمن أن أصعب المفاهيم العلمية يمكن فهمها عندما نصل إلى المبادئ البسيطة التي تقوم عليها. 
            لذلك لا نقدم المعلومة باعتبارها حقيقة مجردة يجب تذكرها، بل نبدأ بالسؤال عنها، ونحللها، ونفهم آليتها، ثم نعيد بناءها في صورة واضحة ومترابطة.
          </p>
        </div>

        {/* 3 Columns Unboxed Editorial Grid with Hairline Dividers */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-hairline border-y border-hairline py-6 sm:py-8">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className={`space-y-4 ${
                idx === 0
                  ? 'md:pl-8 pb-8 md:pb-0'
                  : idx === 1
                  ? 'md:px-8 py-8 md:py-0'
                  : 'md:pr-8 pt-8 md:pt-0'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-editorial text-3xl sm:text-4xl font-bold text-burgundy-500">
                  {pillar.num}
                </span>
                <span dir="ltr" className="font-formula text-xs text-charcoal-50 uppercase tracking-wider">
                  {pillar.enTitle}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-charcoal-900 font-display">
                  {pillar.arTitle}
                </h3>
                <span className="inline-block text-xs font-semibold text-burgundy-500 bg-burgundy-50 px-2.5 py-1 rounded">
                  {pillar.keyQuestion}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-charcoal-100 leading-[1.8] font-sans">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
