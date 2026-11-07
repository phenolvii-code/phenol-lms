'use client';

import React from 'react';
import { Eye, HelpCircle, Network, Flame, Sparkles, Compass, Atom } from 'lucide-react';

export const PhilosophySection: React.FC = () => {
  const pillars = [
    {
      num: '01',
      title: 'Understand the Why',
      arTitle: 'افهم لماذا — التفكير التحليلي والسببي',
      icon: HelpCircle,
      desc: 'التعامل مع أي ظاهرة أو مسألة علمية يبدأ بتحليل مكوناتها وطرح الأسئلة الحاكمة: ما الذي يحدث بالفعل؟ ولماذا يحدث؟ وما العوامل التي تتحكم فيه؟ لنحول المعلومة من حقيقة منفصلة إلى نتيجة منطقية تستطيع استنتاجها بنفسك.',
      highlight: 'ما الذي يحدث بالفعل؟ ولماذا؟',
    },
    {
      num: '02',
      title: 'Discover the Mechanism',
      arTitle: 'اكتشف الآلية — ما وراء القوانين الجافة',
      icon: Atom,
      desc: 'لا نكتفي بمعرفة أن زيادة عامل معين تؤدي لنتيجة معينة. الأهم هو فهم الآلية السببية الدقيقة: احتمالية التصادم الفعال، طبيعة التوزيع الإلكتروني، وشروط النظام الكيميائي التي تجعل التفاعل يسلك هذا المسار تحديداً.',
      highlight: 'الربط السببي خلف كل تفاعل',
    },
    {
      num: '03',
      title: 'Master the Concept',
      arTitle: 'امتلك المفهوم — التفكير من المبادئ الأولى',
      icon: Compass,
      desc: 'التفكير من المبادئ الأولى (First-Principles): بدل فرض القوانين كقواعد جافة يجب حفظها، نبدأ من المبادئ التي أدت إليها ونفككها، ليصبح القانون أداة مرنة في يدك تفهم أصلها، وقوتها، وحدود استخدامها بدقة.',
      highlight: 'من المبادئ الأولى إلى التطبيق',
    },
  ];

  return (
    <section id="philosophy" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="border-t border-borderSubtle pt-16 sm:pt-24 space-y-10 sm:space-y-14">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3.5 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cardPrimary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
            <span>The Philosophy • جوهر الهوية</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-textPrimary tracking-tight">
            الفهم يسبق الحفظ.
          </h2>
          <p className="text-textSecondary text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
            نؤمن أن أصعب المفاهيم العلمية يمكن فهمها عندما نصل إلى المبادئ البسيطة التي تقوم عليها. 
            لذلك لا نقدم المعلومة باعتبارها حقيقة مجردة يجب تذكرها، بل نبدأ بالسؤال عنها، ونحللها، ونفهم آليتها، ثم نعيد بناءها في صورة واضحة ومترابطة.
          </p>
        </div>

        {/* 3 Pillars Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="group relative bg-cardPrimary border border-borderSubtle hover:border-burgundy-500/70 p-7 sm:p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between shadow-editorial hover:-translate-y-1 hover:shadow-burgundyGlow overflow-hidden"
              >
                {/* Subtle Background Watermark Number */}
                <div
                  className="absolute -left-3 -top-6 text-7xl font-editorial font-black text-white/[0.03] select-none pointer-events-none group-hover:text-gold-500/[0.06] transition-colors"
                  aria-hidden="true"
                >
                  {pillar.num}
                </div>

                {/* Card top highlight */}
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-cardSecondary border border-borderSubtle flex items-center justify-center text-gold-400 group-hover:text-gold-300 group-hover:border-gold-500/40 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-formula text-textSecondary uppercase tracking-widest bg-cardSecondary px-2.5 py-1 rounded-full border border-borderSubtle">
                      {pillar.highlight}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-formula text-gold-400 block font-semibold tracking-wider">
                      {pillar.title}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-textPrimary group-hover:text-white transition-colors">
                      {pillar.arTitle}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-textSecondary leading-relaxed pt-1">
                    {pillar.desc}
                  </p>
                </div>

                {/* Bottom decorative bar */}
                <div className="pt-6 mt-6 border-t border-borderSubtle/60 flex items-center justify-between text-xs text-textSecondary/60 relative z-10">
                  <span className="font-formula text-[11px]">Principle {idx + 1} of 3</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500 group-hover:scale-150 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
