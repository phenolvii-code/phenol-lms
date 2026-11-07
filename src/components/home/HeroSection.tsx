'use client';

import React from 'react';
import { ArrowLeft, Sparkles, Compass, Atom, ChevronDown, Check } from 'lucide-react';

interface HeroSectionProps {
  onStartJourney: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartJourney }) => {
  return (
    <section className="relative pt-8 sm:pt-16 lg:pt-24 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Ambient Radial Atmospheric Glows */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[650px] lg:w-[850px] h-[340px] sm:h-[450px] bg-gradient-to-tr from-burgundy-500/18 via-burgundy-800/12 to-transparent rounded-full blur-[110px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-10 right-1/4 w-[200px] sm:w-[320px] h-[200px] sm:h-[320px] bg-gold-500/6 rounded-full blur-[90px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Decorative Subtle Benzene Rings Orbit in Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] -z-10" aria-hidden="true">
        <svg viewBox="0 0 800 800" className="w-[800px] h-[800px] animate-spin" style={{ animationDuration: '120s' }}>
          <circle cx="400" cy="400" r="280" stroke="#D4AF37" strokeWidth="1" strokeDasharray="6 8" fill="none" />
          <polygon points="400,200 573,300 573,500 400,600 227,500 227,300" stroke="#641C32" strokeWidth="1.5" fill="none" />
          <circle cx="400" cy="400" r="130" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 6" fill="none" />
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-7 sm:space-y-10">
        {/* Precision Identity Tag with Official Emblem */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-cardPrimary/90 border border-borderSubtle hover:border-gold-500/40 text-xs tracking-wide shadow-editorial backdrop-blur-md transition-colors">
          <img
            src="/images/phenol-symbol-gold.png"
            alt="Phenol Emblem"
            className="w-4 h-4 object-contain drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]"
          />
          <span className="font-editorial uppercase text-gold-500 font-bold tracking-widest text-[11px] sm:text-xs">
            Dr. Omar Magdi
          </span>
          <span className="text-borderSubtle">•</span>
          <span className="text-textSecondary font-medium text-[11px] sm:text-xs">
            The Chemistry Counselor
          </span>
        </div>

        {/* Main Headline with Fluid Scaling */}
        <div className="space-y-4">
          <h1 className="clamp-headline font-black tracking-tight text-textPrimary">
            لا تحفظ الكيمياء. <br />
            <span className="bg-gradient-to-l from-gold-400 via-rose-100 to-white bg-clip-text text-transparent drop-shadow-sm">
              افهم كيف تعمل.
            </span>
          </h1>

          <p className="clamp-subhead text-textSecondary max-w-3xl mx-auto font-normal px-2">
            الكيمياء ليست مجموعة من القوانين والمعادلات التي يجب حفظها، بل علم تحكمه مبادئ وعلاقات يمكن فهمها وتحليلها. 
            هنا نتجاوز حفظ المعلومة إلى فهم أسبابها، ونفكك الأفكار المعقدة إلى مفاهيم واضحة، ونبني المعرفة خطوة بخطوة.
          </p>
        </div>

        {/* Central Slogan Capsule */}
        <div className="flex justify-center px-2">
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-cardPrimary/85 border border-burgundy-500/35 shadow-editorial text-sm backdrop-blur-md">
            <span className="font-serif text-gold-400 font-bold text-base sm:text-lg tracking-wide">
              «من فهم شيئًا ملكه»
            </span>
            <span className="hidden sm:inline text-borderSubtle">•</span>
            <span className="font-formula text-xs text-textSecondary/90 font-medium">
              Find the Simple. Master the Complex.
            </span>
          </div>
        </div>

        {/* Action Buttons (Touch Friendly >= 48px) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 pt-2 px-4 max-w-md sm:max-w-none mx-auto">
          <button
            onClick={onStartJourney}
            className="w-full sm:w-auto group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-burgundy-500 hover:bg-burgundy-600 active:scale-95 text-white font-bold text-sm sm:text-base shadow-burgundyGlow transition-all duration-200 min-h-[52px]"
          >
            <span>ابدأ رحلتك التعليمية</span>
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform" />
          </button>

          <a
            href="#method"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-cardPrimary hover:bg-cardSecondary active:scale-95 border border-borderSubtle hover:border-gold-500/40 text-textSecondary hover:text-textPrimary font-semibold text-sm sm:text-base transition-colors min-h-[52px]"
          >
            <span>اكتشف منهجية التعلم</span>
          </a>
        </div>

        {/* Scientific Geometric Principles Chips */}
        <div className="pt-6 sm:pt-10 flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] font-formula text-textSecondary">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cardPrimary/60 border border-borderSubtle/60">
              <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500" />
              <span>First Principles</span>
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cardPrimary/60 border border-borderSubtle/60">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
              <span>Causal Reasoning</span>
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cardPrimary/60 border border-borderSubtle/60">
              <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500" />
              <span>Conceptual Connections</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
