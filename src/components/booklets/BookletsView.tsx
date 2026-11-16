'use client';

import React, { useState } from 'react';
import { Booklet } from '@/types/lms';
import { supabase } from '@/lib/supabase';
import { FileText, Download, CheckCircle2, Lock } from 'lucide-react';

interface BookletsViewProps {
  booklets: Booklet[];
}

/**
 * Real gated dossier library (migration 015). Rows come from the `booklets`
 * table (RLS-filtered: only dossiers of the user's actively-enrolled courses,
 * or their own courses for instructors). Downloading requests a short-lived
 * signed URL from the private `booklets` storage bucket - the storage policy
 * re-verifies enrollment server-side, so a leaked URL expires and the gate
 * cannot be bypassed from the client.
 */
export const BookletsView: React.FC<BookletsViewProps> = ({ booklets }) => {
  const [downloadedIds, setDownloadedIds] = useState<Record<string, boolean>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (b: Booklet) => {
    setDownloadingId(b.id);
    try {
      const { data, error } = await supabase.storage
        .from('booklets')
        .createSignedUrl(b.storage_path, 300);
      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
        setDownloadedIds((prev) => ({ ...prev, [b.id]: true }));
      } else {
        throw new Error('No URL returned');
      }
    } catch (err: any) {
      alert(
        `Access denied — this dossier requires an active enrollment in its course. ${
          err?.message ? `(${err.message})` : ''
        }`
      );
    } finally {
      setDownloadingId(null);
    }
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
            Reference Dossiers &amp; Synthesis Guides
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-display">
          Study Dossiers &amp; Reaction Atlases
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-100 mt-1 max-w-2xl font-sans">
          Paid course material — only the dossiers of courses you are actively
          enrolled in are listed here.
        </p>
      </div>

      {/* Booklets Grid */}
      {booklets.length === 0 ? (
        <div className="border border-hairline rounded bg-ivory-100 p-10 text-center">
          <Lock className="w-8 h-8 mx-auto text-charcoal-50 mb-3" />
          <h3 className="font-bold text-sm text-charcoal-900 font-display">
            No dossiers available yet
          </h3>
          <p className="text-xs text-charcoal-100 font-sans mt-1">
            Enroll in a course to unlock its study dossiers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {booklets.map((b) => (
            <div
              key={b.id}
              className="border border-hairline rounded bg-ivory-100 p-6 flex flex-col justify-between space-y-4 shadow-quiet hover:bg-ivory-300/30 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-formula text-charcoal-50">
                  <span className="px-2 py-0.5 rounded bg-burgundy-50 text-burgundy-500 border border-burgundy-200 font-semibold">
                    {b.course_name || 'General Dossier'}
                  </span>
                  {b.edition && <span>{b.edition}</span>}
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
                  {b.pages != null && (
                    <>
                      <span>{b.pages} Pages</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{b.size_label || b.storage_path.split('.').pop()?.toUpperCase()}</span>
                </div>

                <button
                  onClick={() => handleDownload(b)}
                  disabled={downloadingId === b.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold font-sans transition-colors bg-burgundy-500 hover:bg-burgundy-800 text-ivory-100 shadow-quiet disabled:opacity-50 disabled:cursor-wait"
                >
                  {downloadedIds[b.id] ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-ochre-500" />
                      <span>Downloaded</span>
                    </>
                  ) : downloadingId === b.id ? (
                    <span>Preparing…</span>
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
      )}
    </div>
  );
};
