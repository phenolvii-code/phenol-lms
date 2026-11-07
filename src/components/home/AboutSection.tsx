'use client';

import React from 'react';
import { Quote } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="border-t border-borderSubtle pt-20 sm:pt-28">
        <div className="bg-cardPrimary border border-borderSubtle rounded-3xl p-8 sm:p-14 lg:p-16 relative overflow-hidden shadow-editorial">
          {/* Subtle Ambient Backdrops */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-burgundy-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cardSecondary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
              About Dr. Omar Magdi • كلمة ورؤية
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-textPrimary tracking-tight font-serif">
              وراء كل معلومة سؤال.
            </h2>

            <div className="space-y-5 text-base sm:text-xl text-textSecondary leading-relaxed font-normal">
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
            <div className="pt-6 border-t border-borderSubtle flex items-center justify-between">
              <div className="border-r-2 border-gold-500 pr-4">
                <span className="block font-editorial text-textPrimary font-bold text-lg">
                  Dr. Omar Magdi
                </span>
                <span className="text-xs text-gold-500 font-medium tracking-wide">
                  The Chemistry Counselor
                </span>
              </div>

              <div className="text-left font-serif text-textSecondary/40 text-xs italic">
                «من فهم شيئًا ملكه»
              </div>
            </div>
          </div>

          {/* Abstract Watermark Monogram */}
          <div className="absolute -left-10 -bottom-10 select-none pointer-events-none opacity-5 font-serif text-[180px] sm:text-[240px] text-white">
            OM
          </div>
        </div>
      </div>
    </section>
  );
};
