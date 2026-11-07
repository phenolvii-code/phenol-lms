'use client';

import React from 'react';
import { ArrowLeft, Sparkles, Compass, Atom } from 'lucide-react';

interface HeroSectionProps {
  onStartJourney: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartJourney }) => {
  return (
    <section className="relative pt-12 sm:pt-20 lg:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Ambient Radial Atmospheric Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-burgundy-500/15 via-burgundy-800/10 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-12 right-10 w-[280px] h-[280px] bg-gold-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 sm:space-y-10">
        {/* Precision Identity Tag */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-cardPrimary/90 border border-borderSubtle text-xs tracking-wide shadow-editorial backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
          <span className="font-editorial uppercase text-gold-500 font-bold tracking-widest text-[11px]">
            Dr. Omar Magdi
          </span>
          <span className="text-borderSubtle">•</span>
          <span className="text-textSecondary font-medium">The Chemistry Counselor</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.12] text-textPrimary">
            لا تحفظ الكيمياء. <br />
            <span className="bg-gradient-to-l from-gold-400 via-rose-100 to-white bg-clip-text text-transparent drop-shadow-sm">
              افهم كيف تعمل.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-textSecondary leading-relaxed max-w-3xl mx-auto font-normal pt-2">
            الكيمياء ليست مجموعة من القوانين والمعادلات التي يجب حفظها، بل علم تحكمه مبادئ وعلاقات يمكن فهمها وتحليلها. 
            هنا نتجاوز حفظ المعلومة إلى فهم أسبابها، ونفكك الأفكار المعقدة إلى مفاهيم واضحة، ونبني المعرفة خطوة بخطوة.
          </p>
        </div>

        {/* Central Slogan Capsule */}
        <div className="flex justify-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-6 py-3 rounded-2xl bg-cardPrimary/80 border border-burgundy-500/30 shadow-editorial text-sm">
            <span className="font-serif text-gold-400 font-bold text-base tracking-wide">
              «من فهم شيئًا ملكه»
            </span>
            <span className="hidden sm:inline text-borderSubtle">•</span>
            <span className="font-formula text-xs text-textSecondary/90 font-medium">
              Find the Simple. Master the Complex.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={onStartJourney}
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-burgundy-500 hover:bg-burgundy-600 text-white font-bold text-sm sm:text-base shadow-burgundyGlow transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <span>ابدأ رحلتك التعليمية</span>
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          </button>

          <a
            href="#method"
            className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-cardPrimary hover:bg-cardSecondary border border-borderSubtle hover:border-gold-500/40 text-textSecondary hover:text-textPrimary font-semibold text-sm sm:text-base transition-colors"
          >
            <span>اكتشف منهجية التعلم</span>
          </a>
        </div>

        {/* Scientific Geometric Accent Visual */}
        <div className="pt-8 sm:pt-12 flex justify-center opacity-40 hover:opacity-75 transition-opacity">
          <div className="flex items-center gap-8 text-[11px] font-formula text-textSecondary uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500" /> First Principles
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500" /> Causal Reasoning
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500" /> Conceptual Connections
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
