'use client';

import React from 'react';
import { CheckCircle2, XCircle, Sparkles, AlertCircle } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  const comparisons = [
    {
      topic: 'القوانين العلمية',
      old: 'احفظ القانون كما هو في الكتاب.',
      neu: 'افهم من أين جاء القانون وكيف تم اشتقاقه وحدود استخدامه.',
    },
    {
      topic: 'خطوات الحل',
      old: 'احفظ ترتيب الخطوات في كل نوع مسألة.',
      neu: 'افهم المنطق العلمي والسبب الكيميائي وراء كل خطوة.',
    },
    {
      topic: 'الإجابة النموذجية',
      old: 'هذه هي الإجابة الصحيحة المعتمدة.',
      neu: 'لماذا هذه الإجابة تحديداً صحيحة علمياً وما الذي يجعل غيرها خاطئاً؟',
    },
    {
      topic: 'تطبيق القواعد',
      old: 'استخدم هذه القاعدة فقط في هذا السؤال.',
      neu: 'افهم متى ولماذا تنطبق القاعدة وما هي شروطها وقيودها.',
    },
    {
      topic: 'العلاقات والمتغيرات',
      old: 'احفظ أن العلاقة طردية أو عكسية.',
      neu: 'افهم الآلية السببية والحركية الدقيقة التي تفسر تلك العلاقة.',
    },
    {
      topic: 'التعامل مع المسائل',
      old: 'تكرار حل نماذج متطابقة للامتحان.',
      neu: 'تعلّم كيف تقرأ مسألة لم ترها من قبل وتحللها من مبادئها الأساسية.',
    },
    {
      topic: 'الاستثناءات الكيميائية',
      old: 'احفظ الاستثناءات كحالات شاذة مفروضة.',
      neu: 'افهم سبب الاستثناء العلمي المنطقي والحدود التي تفقد عندها القاعدة قوتها.',
    },
  ];

  return (
    <section id="comparison" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="border-t border-borderSubtle pt-16 sm:pt-24 space-y-10 sm:space-y-14">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3.5 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cardPrimary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
            <span>Beyond Memorization • ما وراء الحفظ</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-textPrimary tracking-tight">
            من معرفة الإجابة إلى فهم سببها.
          </h2>
          <p className="text-textSecondary text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
            الفرق لا يكمن في استخدام شعارات مثل «شرح مبسط»، بل في طريقة التعامل مع المعلومة وتدريب العقل على التفكير العلمي المنظم.
          </p>
        </div>

        {/* Matrix Container */}
        <div className="bg-cardPrimary rounded-3xl border border-borderSubtle overflow-hidden shadow-editorial">
          {/* Header Row (Visible on Desktop) */}
          <div className="hidden md:grid md:grid-cols-2 text-xs sm:text-sm font-bold border-b border-borderSubtle bg-cardSecondary/80 py-4 px-6 sm:px-8">
            <div className="flex items-center gap-2 text-textSecondary/80">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <span>التدريس التقليدي القائم على التلقين</span>
            </div>
            <div className="flex items-center gap-2 text-gold-400">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-500" />
              <span>منهج د. عمر مجدي — The Chemistry Counselor</span>
            </div>
          </div>

          {/* Rows: Dual display - stacked card on mobile, side-by-side on desktop */}
          <div className="divide-y divide-borderSubtle">
            {comparisons.map((row, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 md:py-5 md:px-8 hover:bg-cardSecondary/40 transition-colors"
              >
                {/* Mobile View: Stacked Comparison Card */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-borderSubtle/50">
                    <span className="text-[11px] font-formula text-gold-500/90 font-bold uppercase tracking-wider">
                      {row.topic}
                    </span>
                    <span className="text-[10px] text-textSecondary/50 font-formula">0{idx + 1}</span>
                  </div>

                  {/* Traditional on mobile */}
                  <div className="flex items-start gap-2.5 text-textSecondary/60 text-xs sm:text-sm bg-cardSecondary/40 p-3 rounded-xl border border-rose-500/10">
                    <XCircle className="w-4 h-4 text-rose-400/80 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[10px] text-rose-400/70 font-semibold mb-0.5">التلقين:</span>
                      <span className="line-through decoration-rose-500/40">{row.old}</span>
                    </div>
                  </div>

                  {/* Dr. Omar on mobile */}
                  <div className="flex items-start gap-2.5 text-textPrimary text-xs sm:text-sm font-medium bg-burgundy-950/30 p-3 rounded-xl border border-gold-500/20">
                    <CheckCircle2 className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[10px] text-gold-400 font-bold mb-0.5">منهج الفهم والتحليل:</span>
                      <span>{row.neu}</span>
                    </div>
                  </div>
                </div>

                {/* Desktop View: 2-column Grid */}
                <div className="hidden md:grid md:grid-cols-2 gap-6 items-center">
                  {/* Traditional */}
                  <div className="flex items-start gap-3 text-textSecondary/70 text-xs sm:text-sm">
                    <XCircle className="w-4 h-4 text-rose-500/60 shrink-0 mt-0.5" />
                    <span className="line-through decoration-rose-500/40">{row.old}</span>
                  </div>

                  {/* Dr. Omar's Approach */}
                  <div className="flex items-start gap-3 text-textPrimary text-xs sm:text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                    <span>{row.neu}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Summary Bar */}
          <div className="p-4 sm:p-5 bg-cardSecondary/70 border-t border-borderSubtle text-center text-xs sm:text-sm text-textSecondary">
            <strong className="text-gold-400 font-bold ml-1">الهدف النهائي:</strong>
            <span>أن يصبح الطالب قادرًا على التفكير في الكيمياء، لا مجرد تذكر ما قيل له عنها.</span>
          </div>
        </div>
      </div>
    </section>
  );
};