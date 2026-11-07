'use client';

import React from 'react';

export const ResourcesSection: React.FC = () => {
  const tools = [
    {
      num: '01',
      title: 'خرائط المفاهيم المترابطة',
      subtitle: 'Concept Maps',
      desc: 'مخططات بصرية تربط فروع الكيمياء ببعضها لتسهيل رؤية الصورة الكلية للمادة وفهم تداخل القوانين دون انفصال.',
    },
    {
      num: '02',
      title: 'أطلس الميكانزمات والاشتقاقات',
      subtitle: 'Mechanisms Atlas',
      desc: 'شرح متسلسل خطوة بخطوة بالرسم والتفسير وحركة الإلكترونات دون ترك أي فجوة منطقية بين البداية والنهاية.',
    },
    {
      num: '03',
      title: 'مسائل التفكير والتحليل',
      subtitle: 'Analytical Problem Bank',
      desc: 'تطبيقات غير مباشرة ومسائل متدرجة تختبر الفهم الحقيقي وتنقل المعرفة إلى سياقات كيميائية جديدة.',
    },
    {
      num: '04',
      title: 'دليل تصحيح المفاهيم الخاطئة',
      subtitle: 'Misconceptions Guide',
      desc: 'رصد أشهر الأخطاء الشائعة في التفكير والحل وتوضيح سبب الوقوع فيها وكيفية تلافيها بوعي كيميائي دقيق.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="space-y-12 sm:space-y-16">
        {/* Section Heading */}
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest">
              SECTION 06
            </span>
            <span className="text-hairline-strong">•</span>
            <span className="text-xs sm:text-sm text-charcoal-100 font-sans font-medium">أدوات الفهم</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 font-display">
            أدوات مصممة لترسيخ الفهم
          </h2>

          <p className="text-sm sm:text-base text-charcoal-100 leading-[1.8] font-sans">
            مواد ومراجع تدريبية صممت خصيصاً لترسيخ الربط الذهني المنظم، بعيداً عن التشتيت والتلقين العشوائي.
          </p>
        </div>

        {/* Tools 4 Columns Minimalist Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 border-t border-hairline pt-8">
          {tools.map((res, idx) => (
            <div
              key={idx}
              className="space-y-3 border-b border-hairline pb-6"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-editorial text-2xl font-bold text-burgundy-500">
                  {res.num}
                </span>
                <span dir="ltr" className="font-formula text-xs text-charcoal-50 uppercase tracking-wider">
                  {res.subtitle}
                </span>
              </div>

              <h3 className="font-bold text-base text-charcoal-900 font-display">
                {res.title}
              </h3>

              <p className="text-xs sm:text-sm text-charcoal-100 leading-[1.8] font-sans">
                {res.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
