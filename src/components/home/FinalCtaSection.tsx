'use client';

import React from 'react';
import { ArrowLeft, Sparkles, BookOpen } from 'lucide-react';

interface FinalCtaSectionProps {
  onStart: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onStart }) => {
  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
      <div className="border-t border-borderSubtle pt-16 sm:pt-24 max-w-3xl mx-auto space-y-7 sm:space-y-8">
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-textPrimary tracking-tight leading-tight">
          ابدأ من الفهم. <br />
          <span className="text-gold-400">واترك الحفظ يأتي بعده.</span>
        </h2>

        <p className="text-textSecondary text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
          اكتشف تجربة تعليمية مختلفة، وتعلم كيف تفكر في الكيمياء بدلًا من الاكتفاء بحفظ إجاباتها.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-md sm:max-w-none mx-auto">
          <button
            onClick={onStart}
            className="w-full sm:w-auto group inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 rounded-2xl bg-burgundy-500 hover:bg-burgundy-600 active:scale-95 text-white font-bold text-sm sm:text-base shadow-burgundyGlow transition-all duration-200 min-h-[52px]"
          >
            <span>ابدأ التعلم الآن</span>
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform" />
          </button>

          <a
            href="#waitlist"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-cardPrimary hover:bg-cardSecondary active:scale-95 border border-borderSubtle hover:border-gold-500/40 text-textSecondary hover:text-textPrimary font-semibold text-sm sm:text-base transition-colors min-h-[52px]"
          >
            <span>حجز مقعد في الدفعة القادمة</span>
          </a>
        </div>
      </div>
    </section>
  );
};