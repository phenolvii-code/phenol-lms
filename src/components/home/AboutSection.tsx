'use client';

import React from 'react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
              SECTION 07
            </span>
            <span className="text-hairline-strong">•</span>
            <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">عن د/عمر مجدي • بيان ورؤية</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
            وراء كل معلومة سؤال.
          </h2>
        </div>

        {/* Editorial Publication Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-y border-hairline py-8 sm:py-12">
          {/* Main Manifesto Prose */}
          <div className="lg:col-span-8 space-y-5 text-sm sm:text-base text-charcoal-100 leading-[1.85] font-sans">
            <p>
              أنا د/عمر مجدي، أعمل على تقديم تجربة تعليمية في الكيمياء تقوم على التحليل والفهم العميق للمفاهيم العلمية.
            </p>
            <p>
              أهتم بما يحدث خلف المعلومة؛ بالآلية التي تفسر الظاهرة، والعلاقات التي تربط المفاهيم، والمنطق الذي يجعل القانون مفهومًا بدلًا من أن يكون مجرد معادلة محفوظة.
            </p>
            <p>
              أؤمن أن دور التعليم لا ينتهي عند تقديم الإجابة، بل يبدأ عندما يصبح الطالب قادرًا على الوصول إليها بنفسه. هدفي أن أساعد الطالب على بناء طريقة تفكير علمية يستطيع استخدامها داخل الكيمياء وخارجها.
            </p>
          </div>

          {/* Academic Signature & Colophon */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-r border-hairline pt-6 lg:pt-0 lg:pr-8 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="block font-display text-xl sm:text-2xl font-bold text-charcoal-900">
                د/عمر مجدي
              </span>
              <span className="block text-xs font-semibold text-burgundy-500 font-sans">
                المشرف الأكاديمي لمنصة PHENOL
              </span>
              <span dir="ltr" className="block font-formula text-xs text-charcoal-50">
                Dr. Omar Magdi
              </span>
            </div>

            <div className="pt-4 border-t border-hairline">
              <span className="font-display font-semibold text-charcoal-900 text-sm sm:text-base block">
                «مَن فَهِمَ شَيْئًا مَلَكَهُ»
              </span>
              <span dir="ltr" className="font-formula text-xs text-charcoal-50 block mt-1">
                Find the Simple. Master the Complex.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
