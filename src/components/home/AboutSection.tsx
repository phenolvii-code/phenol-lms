'use client';

import React from 'react';
import { Quote, Sparkles } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="border-t border-borderSubtle pt-16 sm:pt-24">
        <div className="bg-cardPrimary border border-borderSubtle rounded-3xl p-7 sm:p-12 lg:p-16 relative overflow-hidden shadow-editorial">
          {/* Subtle Ambient Backdrops */}
          <div
            className="absolute top-0 right-0 w-80 h-80 bg-burgundy-500/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="max-w-3xl space-y-7 sm:space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cardSecondary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
              <span>About Dr/Omar Magdi • كلمة ورؤية</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-textPrimary tracking-tight font-serif leading-tight">
              وراء كل معلومة سؤال.
            </h2>

            <div className="space-y-4 sm:space-y-5 text-sm sm:text-lg text-textSecondary leading-relaxed font-normal">
              <p>
                أنا عمر مجدي، أعمل على تقديم تجربة تعليمية في الكيمياء تقوم على التحليل والفهم العميق للمفاهيم العلمية.
              </p>
              <p>
                أهتم بما يحدث خلف المعلومة؛ بالآلية التي تفسر الظاهرة، والعلاقات التي تربط المفاهيم، والمنطق الذي يجعل القانون مفهومًا بدلًا من أن يكون مجرد معادلة محفوظة.
              </p>
              <p>
                أؤمن أن دور التعليم لا ينتهي عند تقديم الإجابة، بل يبدأ عندما يصبح الطالب قادرًا على الوصول إليها بنفسه. هدفي أن أساعد الطالب على بناء طريقة تفكير علمية يستطيع استخدامها داخل الكيمياء وخارجها.
              </p>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-borderSubtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="border-r-2 border-gold-500 pr-4">
                <span className="block font-formula text-textPrimary font-bold text-lg sm:text-xl">
                  Dr/Omar Magdi
                </span>
                <span className="text-xs text-gold-500 font-extrabold tracking-widest font-editorial uppercase">
                  PHENOL
                </span>
              </div>

              <div className="text-right sm:text-left font-serif text-gold-400/90 text-sm italic">
                «من فهم شيئًا ملكه»
              </div>
            </div>
          </div>

          {/* Abstract Watermark Official Emblem */}
          <img
            src="/images/phenol-symbol-white.png"
            alt=""
            className="absolute -left-8 -bottom-12 w-52 sm:w-80 h-52 sm:h-80 object-contain select-none pointer-events-none opacity-[0.045]"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
};