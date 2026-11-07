'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface FinalCtaSectionProps {
  onStart: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onStart }) => {
  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
      <div className="border-t border-borderSubtle pt-20 sm:pt-28 max-w-3xl mx-auto space-y-8">
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-textPrimary tracking-tight leading-tight">
          ابدأ من الفهم. <br />
          <span className="text-gold-400">واترك الحفظ يأتي بعده.</span>
        </h2>

        <p className="text-textSecondary text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
          اكتشف تجربة تعليمية مختلفة، وتعلم كيف تفكر في الكيمياء بدلًا من الاكتفاء بحفظ إجاباتها.
        </p>

        <div className="pt-2">
          <button
            onClick={onStart}
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-burgundy-500 hover:bg-burgundy-600 text-white font-bold text-base sm:text-lg shadow-burgundyGlow transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <span>ابدأ التعلم الآن</span>
            <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
