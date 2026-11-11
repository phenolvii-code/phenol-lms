'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with ssr: false for full client-side Canvas and IndexedDB execution
const PhenolWhiteboard = dynamic(
  () =>
    import('@/components/whiteboard/PhenolWhiteboard').then(
      (mod) => mod.PhenolWhiteboard
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-ivory-200 text-charcoal-900 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-burgundy-900 text-ochre flex items-center justify-center font-formula font-bold text-xl animate-pulse shadow-editorial">
          ⌬
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold font-display text-charcoal-900">
            Initializing PHENOL Whiteboard Studio
          </h2>
          <p className="text-xs text-charcoal-100 font-sans">
            Loading chemical vector engines and offline storage...
          </p>
        </div>
      </div>
    ),
  }
);

export default function WhiteboardPage() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-ivory-200">
      <PhenolWhiteboard />
    </main>
  );
}
