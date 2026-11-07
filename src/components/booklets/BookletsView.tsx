'use client';

import React, { useState } from 'react';
import { Booklet } from '@/types/lms';
import { FileText, Download, CheckCircle2, BookOpen } from 'lucide-react';

interface BookletsViewProps {
  booklets: Booklet[];
}

export const BookletsView: React.FC<BookletsViewProps> = ({ booklets }) => {
  const [downloadedIds, setDownloadedIds] = useState<Record<string, boolean>>({});

  const handleDownload = (id: string, title: string) => {
    setDownloadedIds((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-hairline pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-wider">
            ACADEMIC LIBRARY
          </span>
          <span className="text-hairline-strong">•</span>
          <span className="text-xs text-charcoal-100 font-sans">
            Reference Dossiers & Synthesis Guides
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
          Dr. Omar Magdi Study Dossiers & Reaction Atlases
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-100 mt-1 max-w-2xl font-sans">
          Curated mechanistic reaction maps, thermodynamic derivations, and diagnostic problem sets compiled directly for PHENOL cohorts.
        </p>
      </div>

      {/* Booklets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {booklets.map((b) => (
          <div
            key={b.id}
            className="border border-hairline rounded bg-ivory-100 p-6 flex flex-col justify-between space-y-4 shadow-quiet hover:bg-ivory-300/30 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-formula text-charcoal-50">
                <span className="px-2 py-0.5 rounded bg-burgundy-50 text-burgundy-500 border border-burgundy-200 font-semibold">
                  {b.courseName}
                </span>
                <span>{b.edition}</span>
              </div>

              <div className="flex items-start gap-3 pt-1">
                <div className="w-10 h-10 rounded bg-ivory-300 flex items-center justify-center shrink-0 border border-hairline text-burgundy-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 font-display leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-xs text-charcoal-100 font-sans mt-1 leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-hairline flex items-center justify-between gap-4">
              <div className="text-xs font-formula text-charcoal-50 space-x-3">
                <span>{b.pages} Pages</span>
                <span>•</span>
                <span>{b.size} (PDF)</span>
              </div>

              <button
                onClick={() => handleDownload(b.id, b.title)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold font-sans transition-colors ${
                  downloadedIds[b.id]
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 shadow-quiet'
                }`}
              >
                {downloadedIds[b.id] ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dossier Ready</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Dossier</span>
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
