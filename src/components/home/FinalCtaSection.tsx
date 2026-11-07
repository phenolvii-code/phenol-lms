'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface FinalCtaSectionProps {
  onStart: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onStart }) => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
      <div className="space-y-6 max-w-2xl mx-auto">
        <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
          START YOUR JOURNEY
        </span>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal-900 font-display leading-[1.4] sm:leading-[1.4] lg:leading-[1.4] py-2">
          <span className="block mb-2 sm:mb-3">ابدأ من الفهم.</span>
          <span className="text-burgundy-500 block">واترك الحفظ يأتي بعده.</span>
        </h2>

        <p className="text-sm sm:text-base text-charcoal-100 max-w-xl mx-auto leading-[1.8] font-sans">
          اكتشف تجربة تعليمية مختلفة، وتعلم كيف تفكر في الكيمياء وتصل إلى الإجابة من مبادئها الأولى.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4 max-w-md sm:max-w-none mx-auto">
          <button
            onClick={onStart}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 font-sans font-semibold text-sm transition-colors shadow-quiet min-h-[46px]"
          >
            <span>ابدأ التعلم الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <a
            href="#waitlist"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded bg-ivory-100 hover:bg-ivory-300 border border-hairline text-charcoal-900 font-sans font-medium text-sm transition-colors min-h-[46px]"
          >
            <span>حجز مقعد في الدفعة القادمة</span>
          </a>
        </div>
      </div>
    </section>
  );
};
