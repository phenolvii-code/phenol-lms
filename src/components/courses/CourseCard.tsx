import React from 'react';
import { ChemistryCourse } from '@/types/lms';
import { PlayCircle, Clock, Star, ArrowLeft, BookOpen } from 'lucide-react';

interface CourseCardProps {
  course: ChemistryCourse;
  onSelect: (course: ChemistryCourse) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onSelect }) => {
  const completedLessons = course.lessons.filter((l) => l.completed).length;
  const progressPct = Math.round((completedLessons / (course.lessons.length || 1)) * 100);

  return (
    <div
      onClick={() => onSelect(course)}
      className="group relative bg-white rounded-3xl border border-burgundy-900/10 hover:border-gold-500/40 shadow-sm hover:shadow-luxury transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
    >
      {/* Top Banner with Image & Formula Overlay */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-burgundy-950 via-burgundy-950/60 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between text-xs">
          <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white font-mono font-bold border border-white/20">
            {course.code}
          </span>
          {course.molecularFormula && (
            <span className="px-3 py-1 rounded-full bg-gold-500/20 backdrop-blur-md text-gold-300 font-mono font-bold border border-gold-400/40">
              {course.molecularFormula}
            </span>
          )}
        </div>

        {/* Bottom overlay text */}
        <div className="absolute bottom-3 right-3 left-3 text-white">
          <span className="text-[11px] font-bold text-gold-400 block mb-0.5">
            {course.level}
          </span>
          <h3 className="font-bold text-base leading-snug line-clamp-1 group-hover:text-gold-200 transition">
            {course.title}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>نسبة الإنجاز</span>
            <span className="text-burgundy-900 font-mono">{progressPct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-burgundy-700 to-gold-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Bottom Info & Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-burgundy-700" />
              {course.totalHours}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-gold-600" />
              {course.lessons.length} محاضرات
            </span>
          </div>

          <span className="text-burgundy-950 font-bold group-hover:text-gold-600 flex items-center gap-1 transition">
            <span>دخول المساق</span>
            <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
};
