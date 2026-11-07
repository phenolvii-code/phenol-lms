'use client';

import React from 'react';
import { Eye, HelpCircle, Network, Flame } from 'lucide-react';

export const PhilosophySection: React.FC = () => {
  const pillars = [
    {
      num: '01',
      title: 'Understand the Why',
      arTitle: 'افهم لماذا',
      desc: 'التعامل مع أي ظاهرة أو مسألة علمية يبدأ بتحليل مكوناتها وطرح الأسئلة الحاكمة: ما الذي يحدث بالفعل؟ ولماذا يحدث؟ وما العوامل التي تتحكم فيه؟ لنحول المعلومة من حقيقة منفصلة إلى نتيجة منطقية تستطيع استنتاجها.',
      highlight: 'ما الذي يحدث بالفعل؟ ولماذا؟',
    },
    {
      num: '02',
      title: 'Discover the Mechanism',
      arTitle: 'اكتشف الآلية',
      desc: 'لا نكتفي بمعرفة أن زيادة عامل معين تؤدي لنتيجة معينة. الأهم هو فهم الآلية السببية الدقيقة: احتمالية التصادم الفعال، طبيعة التوزيع الإلكتروني، وشروط النظام الكيميائي التي تجعل التفاعل يسلك هذا المسار تحديداً.',
      highlight: 'الربط السببي خلف كل تفاعل',
    },
    {
      num: '03',
      title: 'Master the Concept',
      arTitle: 'امتلك المفهوم',
      desc: 'التفكير من المبادئ الأولى (First-Principles): بدل فرض القوانين كقواعد جافة يجب حفظها، نبدأ من المبادئ التي أدت إليها ونفككها، ليصبح القانون أداة مرنة في يدك تفهم أصلها، وقوتها، وحدود استخدامها.',
      highlight: 'من المبادئ الأولى إلى التطبيق',
    },
  ];

  return (
    <section id="philosophy" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="border-t border-borderSubtle pt-20 sm:pt-28 space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cardPrimary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
            The Philosophy • جوهر الهوية
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-textPrimary tracking-tight">
            الفهم يسبق الحفظ.
          </h2>
          <p className="text-textSecondary text-base sm:text-lg leading-relaxed font-normal">
            نؤمن أن أصعب المفاهيم العلمية يمكن فهمها عندما نصل إلى المبادئ البسيطة التي تقوم عليها. 
            لذلك لا نقدم المعلومة باعتبارها حقيقة مجردة يجب تذكرها، بل نبدأ بالسؤال عنها، ونحللها، ونفهم آليتها، ثم نعيد بناءها في صورة واضحة ومترابطة.
          </p>
        </div>

        {/* 3 Pillars Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="group relative bg-cardPrimary border border-borderSubtle hover:border-burgundy-500/60 p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between shadow-editorial hover:-translate-y-1 hover:shadow-burgundyGlow"
            >
              {/* Card top highlight */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="font-editorial text-2xl font-bold text-gold-500">
                    {pillar.num}
                  </span>
                  <span className="text-[10px] font-formula text-textSecondary uppercase tracking-widest bg-cardSecondary px-2.5 py-1 rounded-full border border-borderSubtle">
                    {pillar.highlight}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-formula text-gold-400 block font-semibold tracking-wider">
                    {pillar.title}
                  </span>
                  <h3 className="text-xl font-bold text-textPrimary group-hover:text-white transition-colors">
                    {pillar.arTitle}
                  </h3>
                </div>

                <p className="text-sm text-textSecondary leading-relaxed">
                  {pillar.desc}
                </p>
              </div>

              {/* Bottom decorative bar */}
              <div className="pt-6 mt-6 border-t border-borderSubtle/60 flex items-center justify-between text-xs text-textSecondary/60">
                <span className="font-formula text-[11px]">Principle {idx + 1} of 3</span>
                <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500 group-hover:scale-150 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
