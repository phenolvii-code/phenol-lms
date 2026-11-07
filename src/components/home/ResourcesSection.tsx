'use client';

import React from 'react';
import { Network, FileText, Compass, ShieldAlert, Sparkles, Layers } from 'lucide-react';

export const ResourcesSection: React.FC = () => {
  const tools = [
    {
      icon: Network,
      title: 'خرائط المفاهيم المترابطة',
      subtitle: 'Concept Maps',
      desc: 'مخططات بصرية تربط فروع الكيمياء ببعضها لتسهيل رؤية الصورة الكلية للمادة وفهم تداخل القوانين دون انفصال.',
    },
    {
      icon: FileText,
      title: 'أطلس الميكانزمات والاشتقاقات',
      subtitle: 'Mechanisms Atlas',
      desc: 'شرح متسلسل خطوة بخطوة بالرسم والتفسير وحركة الإلكترونات دون ترك أي فجوة منطقية بين البداية والنهاية.',
    },
    {
      icon: Compass,
      title: 'مسائل التفكير والتحليل',
      subtitle: 'Analytical Problem Bank',
      desc: 'تطبيقات غير مباشرة ومسائل متدرجة تختبر الفهم الحقيقي وتنقل المعرفة إلى سياقات كيميائية جديدة.',
    },
    {
      icon: ShieldAlert,
      title: 'تصحيح المفاهيم الخاطئة',
      subtitle: 'Misconception Guide',
      desc: 'رصد أشهر الأخطاء الشائعة في التفكير والحل وتوضيح سبب الوقوع فيها وكيفية تلافيها بوعي كيميائي.',
    },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="border-t border-borderSubtle pt-16 sm:pt-24 space-y-10 sm:space-y-14">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3.5 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cardPrimary border border-borderSubtle text-[11px] font-formula uppercase tracking-widest text-gold-500 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
            <span>Learning Resources • أدوات الفهم</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-textPrimary tracking-tight">
            أدوات تساعدك على الفهم
          </h2>
          <p className="text-textSecondary text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
            مواد وأدوات تعليمية صممت خصيصاً لترسيخ الفهم والربط الذهني المنظم، بعيداً عن التشتيت والتلقين العشوائي.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {tools.map((res, idx) => {
            const Icon = res.icon;
            return (
              <div
                key={idx}
                className="bg-cardPrimary border border-borderSubtle p-6 sm:p-7 rounded-3xl space-y-4 hover:border-gold-500/50 hover:bg-cardSecondary/40 transition-all duration-300 shadow-editorial flex flex-col justify-between group hover:-translate-y-1"
              >
                <div className="space-y-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-cardSecondary border border-borderSubtle text-gold-400 group-hover:text-gold-300 group-hover:border-gold-500/40 flex items-center justify-center transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-textPrimary group-hover:text-white transition-colors">
                      {res.title}
                    </h3>
                    <span className="text-[10px] font-formula text-gold-500/80 block mt-0.5">
                      {res.subtitle}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-textSecondary leading-relaxed">{res.desc}</p>
                </div>

                <div className="pt-4 border-t border-borderSubtle/60 text-[11px] text-gold-400/90 font-medium flex items-center justify-between">
                  <span>محتوى تحليلي أصيل</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-burgundy-500 group-hover:scale-125 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};