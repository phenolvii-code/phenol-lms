'use client';

import React from 'react';
import { Booklet } from '@/types/lms';
import { FileText, Download, CheckCircle, BookOpen, Sparkles } from 'lucide-react';

interface BookletsViewProps {
  booklets: Booklet[];
}

export const BookletsView: React.FC<BookletsViewProps> = ({ booklets }) => {
  const [downloadedIds, setDownloadedIds] = React.useState<Record<string, boolean>>({});

  const handleDownload = (id: string, title: string) => {
    setDownloadedIds((prev) => ({ ...prev, [id]: true }));
    alert(`جاري تحميل: "${title}" بصيغة PDF عالية الدقة...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burgundy-50 border border-burgundy-200 text-burgundy-900 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>المكتبة الكيميائية الحصرية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-burgundy-950 font-serif">
            مذكرات وملازم د. عمر مجدي
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            ملخصات ميكانزمات التفاعلات، خرائط المفاهيم، وبنوك الأسئلة المعتمدة للتحميل المباشر
          </p>
        </div>
      </div>

      {/* Booklets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {booklets.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-3xl border border-burgundy-900/10 p-6 shadow-sm hover:shadow-luxury transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-4">
                <span className="px-3 py-1 rounded-full bg-gold-50 text-gold-800 border border-gold-200">
                  {b.courseName}
                </span>
                <span className="font-mono">{b.size}</span>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-burgundy-950 text-gold-400 flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>

              <h3 className="font-bold text-base text-burgundy-950 mb-2 leading-snug">
                {b.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {b.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>عدد الصفحات: <strong className="text-slate-700">{b.pages} صفحة</strong></span>
                <span>{b.downloads.toLocaleString()} تحميل</span>
              </div>

              <button
                onClick={() => handleDownload(b.id, b.title)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition shadow-sm ${
                  downloadedIds[b.id]
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-burgundy-950 hover:bg-black text-gold-400 hover:text-gold-300'
                }`}
              >
                {downloadedIds[b.id] ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>تم التحميل بنجاح</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>تحميل الكتيب الآن (PDF)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
