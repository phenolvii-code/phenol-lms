'use client';

import React from 'react';
import { ArrowLeft, Sparkles, Compass, Atom, Check } from 'lucide-react';

interface HeroSectionProps {
  onStartJourney: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartJourney }) => {
  return (
    <section className="relative pt-6 sm:pt-14 lg:pt-20 pb-12 sm:pb-20 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
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

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-9">
        {/* Precision Identity Tag with Official PHENOL Emblem */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-cardPrimary/90 border border-borderSubtle hover:border-gold-500/40 text-xs tracking-wide shadow-editorial backdrop-blur-md transition-colors">
          <img
            src="/images/phenol-symbol-gold.png"
            alt="PHENOL Emblem"
            className="w-4 h-4 object-contain drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]"
          />
          <span className="font-editorial uppercase text-gold-500 font-extrabold tracking-widest text-xs">
            PHENOL
          </span>
          <span className="text-borderSubtle">•</span>
          <span className="text-textSecondary font-formula font-medium text-[11px] sm:text-xs">
            Dr/Omar Magdi
          </span>
        </div>

        {/* Main Headline: "من فهم شيئاً ملكه" with Luxury Arabic Alexandria Font */}
        <div className="space-y-4">
          <h1 className="clamp-headline font-display font-black tracking-tight text-white py-1">
            <span className="text-gold-400">«</span>
            <span className="text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">مَن فَهِمَ شَيْئًا مَلَكَهُ</span>
            <span className="text-gold-400">»</span>
          </h1>

          {/* Core Philosophy Tagline */}
          <div className="flex justify-center px-2">
            <div className="inline-flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-cardPrimary/80 border border-burgundy-500/35 shadow-editorial text-xs sm:text-sm backdrop-blur-md">
              <span className="font-display font-bold text-gold-400">
                البحث عن البساطة الكامنة خلف كل تعقيد
              </span>
              <span className="hidden sm:inline text-borderSubtle">•</span>
              <span className="font-formula text-[11px] sm:text-xs text-textSecondary font-medium">
                Find the Simple. Master the Complex.
              </span>
            </div>
          </div>

          <p className="clamp-subhead text-textSecondary max-w-3xl mx-auto font-normal px-2 pt-2">
            الكيمياء ليست مجموعة من القوانين والمعادلات التي يجب حفظها، بل علم تحكمه مبادئ وعلاقات يمكن فهمها وتحليلها. 
            هنا في <strong className="text-textPrimary font-semibold font-editorial">PHENOL</strong> مع <strong className="text-gold-400 font-semibold font-formula">Dr/Omar Magdi</strong>، نتجاوز حفظ المعلومة إلى فهم أسبابها، ونفكك الأفكار المعقدة إلى مفاهيم واضحة، ونبني المعرفة خطوة بخطوة من مبادئها الأولى.
          </p>
        </div>

        {/* Action Buttons (Touch Friendly >= 48px on mobile) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-1 px-3 max-w-md sm:max-w-none mx-auto">
          <button
            onClick={onStartJourney}
            className="w-full sm:w-auto group flex items-center justify-center gap-3 px-8 py-3.5 sm:py-4 rounded-2xl bg-burgundy-500 hover:bg-burgundy-600 active:scale-95 text-white font-bold text-sm sm:text-base shadow-burgundyGlow transition-all duration-200 min-h-[48px] sm:min-h-[52px]"
          >
            <span>ابدأ رحلتك التعليمية</span>
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform" />
          </button>

          <a
            href="#method"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 sm:py-4 rounded-2xl bg-cardPrimary hover:bg-cardSecondary active:scale-95 border border-borderSubtle hover:border-gold-500/40 text-textSecondary hover:text-textPrimary font-semibold text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px]"
          >
            <span>اكتشف منهجية فاينمان</span>
          </a>
        </div>

        {/* Scientific Geometric Principles Chips */}
        <div className="pt-4 sm:pt-8 flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] font-formula text-textSecondary">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cardPrimary/70 border border-borderSubtle/60">
              <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500" />
              <span>First Principles</span>
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cardPrimary/70 border border-borderSubtle/60">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
              <span>Causal Reasoning</span>
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cardPrimary/70 border border-borderSubtle/60">
              <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500" />
              <span>Conceptual Connections</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};