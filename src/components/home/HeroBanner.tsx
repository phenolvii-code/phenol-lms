import React from 'react';
import { InstructorProfile } from '@/types/lms';
import { Sparkles, ArrowLeft, Star, Users, CheckCircle2, FlaskConical } from 'lucide-react';

interface HeroBannerProps {
  instructor: InstructorProfile;
  onExploreCourses: () => void;
  onOpenQuiz: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  instructor,
  onExploreCourses,
  onOpenQuiz,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-burgundy-950 via-[#420815] to-[#24040c] text-white p-8 sm:p-12 shadow-2xl border border-gold-500/20">
      {/* Background Molecular Grid & Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-burgundy-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Chemical Formula in background */}
      <div className="absolute -left-10 -bottom-8 select-none pointer-events-none opacity-5 font-mono text-9xl text-gold-400 font-bold">
        C₆H₅OH
      </div>

      <div className="relative z-10 max-w-3xl">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-xs font-semibold mb-6 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span>منصة الكيمياء التخصصية • د. عمر مجدي</span>
        </div>

        {/* Big Apple-style Headline */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-4 font-serif">
          افهم الكيمياء بعمق، <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-amber-200 bg-clip-text text-transparent">
            ودع الميكانزمات تتحدث بنفسها.
          </span>
        </h1>

        <p className="text-rose-100/80 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl font-light">
          هنا في <strong className="text-white font-semibold">Phenol</strong>، لن تحفظ المعادلات؛ بل ستفهم حركة الإلكترونات وأسرار الرنين والاتزان الكيميائي كما تشرح في أرقى المختبرات الأكاديمية العالمية مع د. عمر مجدي.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={onExploreCourses}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-gold-500 via-gold-400 to-amber-400 hover:from-gold-400 hover:to-gold-300 text-burgundy-950 font-bold text-sm shadow-goldGlow transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <FlaskConical className="w-4 h-4" />
            <span>استعراض المقررات والمحاضرات</span>
          </button>

          <button
            onClick={onOpenQuiz}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm backdrop-blur transition-all duration-200"
          >
            <span>اختبار كيمياء الفينول التفاعلي</span>
            <ArrowLeft className="w-4 h-4 text-gold-400" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/10 text-xs">
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-gold-400 font-formula">
              {instructor.rating} ★
            </div>
            <div className="text-rose-200/70 text-[11px] mt-0.5">تقييم الطلاب المعتمد</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-white font-formula">
              {instructor.studentsCount.toLocaleString()}+
            </div>
            <div className="text-rose-200/70 text-[11px] mt-0.5">طالب في المساقات</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-white font-formula">
              {instructor.lecturesCount} محاضرة
            </div>
            <div className="text-rose-200/70 text-[11px] mt-0.5">شرح ميكانزم تفصيلي</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-formula">
              100%
            </div>
            <div className="text-rose-200/70 text-[11px] mt-0.5">شرح عالي الدقة (4K)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
