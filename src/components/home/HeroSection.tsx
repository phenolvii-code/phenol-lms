'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface HeroSectionProps {
  onStartJourney: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartJourney }) => {
  return (
    <section className="relative pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="text-center">
        {/* Editorial Monogram Badge */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-hairline bg-ivory-100 mb-6">
          <img
            src="/images/phenol-symbol-burgundy.png"
            alt="PHENOL"
            className="w-3.5 h-3.5 object-contain"
          />
          <span className="font-editorial uppercase text-burgundy-500 font-bold tracking-widest text-xs">
            PHENOL
          </span>
          <span className="text-hairline-strong">•</span>
          <span className="text-charcoal-900 font-sans font-semibold text-xs">
            د/عمر مجدي
          </span>
        </div>

        {/* Primary Headline: «مَن فَهِمَ شَيْئًا مَلَكَهُ» */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-display text-charcoal-900 leading-[1.4] sm:leading-[1.4] md:leading-[1.35] lg:leading-[1.35] tracking-tight py-1">
            <span className="inline-block"><span className="text-burgundy-500">«</span>مَن فَهِمَ شَيْئًا</span>{' '}
            <span className="inline-block">مَلَكَهُ<span className="text-burgundy-500">»</span></span>
          </h1>

          {/* Core Philosophy Tagline with Strict BiDi Isolation */}
          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-charcoal-100 font-sans">
            <span className="font-medium text-charcoal-900">
              البحث عن البساطة الكامنة خلف كل تعقيد.
            </span>
            <span className="hidden sm:inline text-hairline-strong">•</span>
            <span dir="ltr" className="font-formula text-xs text-charcoal-50 inline-block">
              Find the Simple. Master the Complex.
            </span>
          </div>

          {/* Editorial Introduction Copy */}
          <p className="mt-6 text-sm sm:text-base text-charcoal-100 max-w-2xl mx-auto font-sans leading-[1.8]">
            الكيمياء ليست مجموعة من القوانين والمعادلات التي يجب حفظها، بل علم تحكمه مبادئ وعلاقات يمكن فهمها وتحليلها. 
            هنا في <strong className="text-charcoal-900 font-semibold font-editorial">PHENOL</strong> بإشراف <strong className="text-charcoal-900 font-semibold font-sans">د/عمر مجدي</strong>، نتجاوز حفظ المعلومة إلى فهم أسبابها، ونفكك الأفكار المعقدة إلى مفاهيم واضحة، ونبني المعرفة خطوة بخطوة.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md sm:max-w-none mx-auto">
          <button
            onClick={onStartJourney}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet min-h-[46px]"
          >
            <span>ابدأ رحلتك التعليمية</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <a
            href="#method"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded bg-ivory-100 hover:bg-ivory-300 border border-hairline text-charcoal-900 font-sans font-medium text-sm transition-colors min-h-[46px]"
          >
            <span>اكتشف طريقة فاينمان</span>
          </a>
        </div>

        {/* Footnote 3 Principles */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-hairline max-w-lg mx-auto">
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-hairline text-center">
            <div className="px-2">
              <span className="block font-formula text-xs font-bold text-burgundy-500 mb-0.5">01</span>
              <span className="text-xs sm:text-sm text-charcoal-900 font-sans font-medium">المبادئ الأولى</span>
            </div>
            <div className="px-2">
              <span className="block font-formula text-xs font-bold text-burgundy-500 mb-0.5">02</span>
              <span className="text-xs sm:text-sm text-charcoal-900 font-sans font-medium">التفكير السببي</span>
            </div>
            <div className="px-2">
              <span className="block font-formula text-xs font-bold text-burgundy-500 mb-0.5">03</span>
              <span className="text-xs sm:text-sm text-charcoal-900 font-sans font-medium">الربط المعرفي</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
