'use client';

import React from 'react';
import { Network, FileText, Compass, ShieldAlert } from 'lucide-react';

export const ResourcesSection: React.FC = () => {
  const tools = [
    {
      icon: Network,
      title: 'خرائط المفاهيم المترابطة',
      desc: 'مخططات بصرية تربط فروع الكيمياء ببعضها لتسهيل رؤية الصورة الكلية للمادة وفهم تداخل القوانين.',
    },
    {
      icon: FileText,
      title: 'أطلس الميكانزمات والاشتقاقات',
      desc: 'شرح متسلسل خطوة بخطوة بالرسم والتفسير دون ترك أي فجوة منطقية بين البداية والنهاية.',
    },
    {
      icon: Compass,
      title: 'مسائل التفكير والتحليل',
      desc: 'تطبيقات غير مباشرة تختبر الفهم الحقيقي وتنقل المعرفة إلى سياقات كيميائية جديدة.',
    },
    {
      icon: ShieldAlert,
      title: 'تصحيح المفاهيم الخاطئة',
      desc: 'رصد أشهر الأخطاء الشائعة في التفكير والحل وتوضيح سبب الوقوع فيها وكيفية تلافيها.',
    },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="border-t border-borderSubtle pt-20 sm:pt-28 space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cardPrimary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
            Learning Resources • أدوات الفهم
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-textPrimary tracking-tight">
            أدوات تساعدك على الفهم
          </h2>
          <p className="text-textSecondary text-base sm:text-lg leading-relaxed font-normal">
            مواد وأدوات تعليمية صممت خصيصاً لترسيخ الفهم والربط الذهني المنظم، بعيداً عن التشتيت.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((res, idx) => {
            const Icon = res.icon;
            return (
              <div
                key={idx}
                className="bg-cardPrimary border border-borderSubtle p-7 rounded-3xl space-y-4 hover:border-gold-500/50 transition-colors shadow-editorial flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-cardSecondary border border-borderSubtle text-gold-400 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-textPrimary">{res.title}</h3>
                  <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">{res.desc}</p>
                </div>

                <div className="pt-4 border-t border-borderSubtle/60 text-[11px] text-gold-400/80 font-medium">
                  محتوى أصيل وحصري
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
