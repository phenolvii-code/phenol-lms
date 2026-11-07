'use client';

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  const comparisons = [
    {
      old: 'احفظ القانون كما هو في الكتاب',
      neu: 'افهم من أين جاء القانون وكيف تم اشتقاقه وحدود استخدامه',
    },
    {
      old: 'احفظ ترتيب الخطوات في كل نوع مسألة',
      neu: 'افهم المنطق العلمي والسبب الكيميائي وراء كل خطوة',
    },
    {
      old: 'هذه هي الإجابة الصحيحة المعتمدة',
      neu: 'لماذا هذه الإجابة تحديداً صحيحة علمياً وما الذي يجعل غيرها خاطئاً؟',
    },
    {
      old: 'استخدم هذه القاعدة فقط في هذا السؤال',
      neu: 'افهم متى ولماذا تنطبق القاعدة وما هي شروطها وقيودها',
    },
    {
      old: 'احفظ أن العلاقة طردية أو عكسية',
      neu: 'افهم الآلية السببية والحركية الدقيقة التي تفسر تلك العلاقة',
    },
    {
      old: 'تكرار حل نماذج متطابقة للامتحان',
      neu: 'تعلّم كيف تقرأ مسألة لم ترها من قبل وتحللها من مبادئها الأساسية',
    },
    {
      old: 'احفظ الاستثناءات كحالات شاذة مفروضة',
      neu: 'افهم سبب الاستثناء العلمي المنطقي والحدود التي تفقد عندها القاعدة قوتها',
    },
  ];

  return (
    <section id="comparison" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      <div className="border-t border-borderSubtle pt-20 sm:pt-28 space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cardPrimary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
            Beyond Memorization • ما وراء الحفظ
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-textPrimary tracking-tight">
            من معرفة الإجابة إلى فهم سببها.
          </h2>
          <p className="text-textSecondary text-base sm:text-lg leading-relaxed font-normal">
            الفرق لا يكمن في استخدام شعارات مثل «شرح مبسط»، بل في طريقة التعامل مع المعلومة وتدريب العقل على التفكير العلمي.
          </p>
        </div>

        {/* Matrix Container */}
        <div className="bg-cardPrimary rounded-3xl border border-borderSubtle overflow-hidden shadow-editorial">
          {/* Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 text-sm font-bold border-b border-borderSubtle bg-cardSecondary/80 py-4 px-6 sm:px-8">
            <div className="flex items-center gap-2 text-textSecondary">
              <span className="w-2 h-2 rounded-full bg-rose-500/70" />
              <span>التدريس التقليدي القائم على التلقين</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-gold-400">
              <span className="w-2 h-2 rounded-full bg-gold-500" />
              <span>منهج Dr. Omar Magdi — The Chemistry Counselor</span>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-borderSubtle">
            {comparisons.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 py-5 px-6 sm:px-8 items-center hover:bg-cardSecondary/40 transition-colors"
              >
                {/* Traditional */}
                <div className="flex items-start gap-2.5 text-textSecondary/60 text-xs sm:text-sm">
                  <XCircle className="w-4 h-4 text-rose-500/60 shrink-0 mt-0.5" />
                  <span className="line-through decoration-rose-500/40">{row.old}</span>
                </div>

                {/* Dr. Omar's Approach */}
                <div className="flex items-start gap-2.5 text-textPrimary text-xs sm:text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                  <span>{row.neu}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Summary Bar */}
          <div className="p-4 sm:p-5 bg-cardSecondary/60 border-t border-borderSubtle text-center text-xs sm:text-sm text-textSecondary">
            <strong className="text-textPrimary font-semibold">الهدف النهائي:</strong> أن تصبح قادراً على التفكير في الكيمياء، لا مجرد تذكر ما قيل لك عنها.
          </div>
        </div>
      </div>
    </section>
  );
};
