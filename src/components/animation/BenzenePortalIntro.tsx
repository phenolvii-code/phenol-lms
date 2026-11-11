'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface BenzenePortalIntroProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const BenzenePortalIntro: React.FC<BenzenePortalIntroProps> = ({
  onComplete,
  forceShow = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<'drawing' | 'resonating' | 'expanding' | 'done'>('drawing');

  const handleDismiss = useCallback(() => {
    setPhase('done');
    try {
      sessionStorage.setItem('phenol_portal_seen', 'true');
    } catch {
      // Ignore storage errors in restricted iframe/incognito modes
    }
    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 200);
  }, [onComplete]);

  useEffect(() => {
    // Check if user already saw the intro in this session or if forced via prop/URL
    try {
      const hasSeen = sessionStorage.getItem('phenol_portal_seen');
      const urlParams = new URLSearchParams(window.location.search);
      const forceParam = urlParams.get('portal') === 'true' || urlParams.get('intro') === 'true';

      if (hasSeen && !forceShow && !forceParam) {
        setIsVisible(false);
        onComplete?.();
        return;
      }
    } catch {
      // Continue if sessionStorage fails
    }

    setIsVisible(true);
    setPhase('drawing');

    // Phase 1 -> Phase 2: Drawing completes at 650ms, resonance glow begins
    const timer1 = setTimeout(() => {
      setPhase('resonating');
    }, 650);

    // Phase 2 -> Phase 3: Portal expands at 1100ms
    const timer2 = setTimeout(() => {
      setPhase('expanding');
    }, 1100);

    // Phase 3 -> Done: Portal has opened completely at 1800ms
    const timer3 = setTimeout(() => {
      handleDismiss();
    }, 1800);

    // Keyboard listener to skip on ESC or Space
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [forceShow, handleDismiss, onComplete]);

  if (!isVisible && phase === 'done') return null;

  return (
    <div
      role="dialog"
      aria-label="Phenol Entrance Portal"
      onClick={handleDismiss}
      className={`fixed inset-0 z-[99999] flex items-center justify-center cursor-pointer overflow-hidden select-none transition-opacity duration-700 ease-out ${
        phase === 'expanding'
          ? 'opacity-0 pointer-events-none'
          : phase === 'done'
          ? 'opacity-0 pointer-events-none hidden'
          : 'opacity-100 pointer-events-auto'
      }`}
      style={{
        backgroundColor: '#1E0610',
        backgroundImage:
          'radial-gradient(circle at 50% 50%, #3D1021 0%, #250714 55%, #14030B 100%)',
      }}
    >
      {/* Background Subtle Hexagonal Grid Texture */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#C5A34E 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Golden Ambient Glow in center */}
      <div
        className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-ochre/20 blur-3xl pointer-events-none transition-transform duration-700 ${
          phase === 'resonating'
            ? 'scale-125 opacity-70'
            : phase === 'expanding'
            ? 'scale-[15] opacity-0'
            : 'scale-90 opacity-40'
        }`}
      />

      {/* Central Benzene Portal Container */}
      <div
        className={`relative flex flex-col items-center justify-center transition-transform will-change-transform ${
          phase === 'expanding'
            ? 'scale-[35] duration-[850ms] ease-[cubic-bezier(0.7,0,0.2,1)] opacity-20'
            : phase === 'resonating'
            ? 'scale-105 duration-300 ease-out'
            : 'scale-100 duration-500 ease-out'
        }`}
      >
        {/* SVG Golden Benzene Structure */}
        <svg
          viewBox="0 0 240 240"
          className="w-48 h-48 sm:w-60 sm:h-60 overflow-visible drop-shadow-[0_0_24px_rgba(201,160,56,0.45)]"
        >
          <defs>
            {/* Rich Gold Gradient */}
            <linearGradient id="portalGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2A3" />
              <stop offset="25%" stopColor="#E6CA65" />
              <stop offset="55%" stopColor="#C9A038" />
              <stop offset="85%" stopColor="#9E7D2B" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>

            {/* Radial Gold Flare */}
            <radialGradient id="goldPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF9D2" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#C9A038" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#641C32" stopOpacity="0" />
            </radialGradient>

            {/* Glow Filter */}
            <filter id="goldBloom" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Central Pulsing Resonance Disk */}
          <circle
            cx="120"
            cy="128"
            r="36"
            fill="url(#goldPulse)"
            className={`transition-all duration-500 ${
              phase === 'resonating' ? 'opacity-90 scale-110' : 'opacity-40 scale-95'
            }`}
          />

          {/* Outer Benzene Hexagon (Points oriented vertically, Top vertex at (120, 68)) */}
          <polygon
            points="120,68 172,98 172,158 120,188 68,158 68,98"
            fill="none"
            stroke="url(#portalGold)"
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#goldBloom)"
            style={{
              strokeDasharray: 360,
              strokeDashoffset: phase === 'drawing' ? 0 : 0,
              animation: 'benzeneStrokeDraw 0.65s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}
          />

          {/* Inner Resonance Circle */}
          <circle
            cx="120"
            cy="128"
            r="34"
            fill="none"
            stroke="url(#portalGold)"
            strokeWidth="2.75"
            strokeDasharray="12 6"
            filter="url(#goldBloom)"
            className={`${phase === 'resonating' ? 'animate-spin-slow' : ''}`}
            style={{
              transformOrigin: '120px 128px',
              animation:
                phase === 'resonating'
                  ? 'spin 12s linear infinite'
                  : 'resonanceDraw 0.6s ease-out forwards',
            }}
          />

          {/* Top Hydroxy (-OH) Phenol Functional Group Link */}
          <line
            x1="120"
            y1="68"
            x2="120"
            y2="38"
            stroke="url(#portalGold)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#goldBloom)"
            style={{
              strokeDasharray: 30,
              animation: 'hydroxyDraw 0.4s 0.25s ease-out forwards',
            }}
          />

          {/* Golden Orb at Hydroxy Terminal */}
          <circle
            cx="120"
            cy="34"
            r="4.5"
            fill="#FFF2A3"
            filter="url(#goldBloom)"
            className="transition-all duration-300"
          />

          {/* Subtle Hydroxy Label */}
          <text
            x="132"
            y="38"
            fill="#FDE047"
            fontSize="12"
            fontFamily="'Cinzel', Georgia, serif"
            fontWeight="bold"
            letterSpacing="1"
            className="select-none"
          >
            OH
          </text>
        </svg>

        {/* Brand Monogram & Title Reveal */}
        <div
          className={`mt-6 text-center transition-all duration-500 ${
            phase === 'drawing'
              ? 'opacity-0 translate-y-3'
              : phase === 'expanding'
              ? 'opacity-0 scale-150'
              : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="font-editorial tracking-[0.35em] uppercase text-xs sm:text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-ochre-light via-yellow-200 to-ochre">
            PHENOL ACADEMY
          </div>
          <div className="text-[11px] sm:text-xs font-sans text-ivory-300 tracking-[0.25em] uppercase mt-1 font-medium opacity-90">
            Dr. Omar Magdi
          </div>
          <div className="text-[10px] text-ochre/60 tracking-wider mt-2 font-mono">
            GATEWAY OF REASONING
          </div>
        </div>
      </div>

      {/* Subtle Skip Pill at Bottom */}
      <div
        className={`absolute bottom-6 sm:bottom-8 z-10 transition-opacity duration-300 ${
          phase === 'expanding' || phase === 'done' ? 'opacity-0' : 'opacity-70 hover:opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="px-4 py-1.5 rounded-full border border-ochre/30 bg-burgundy-900/60 backdrop-blur-md text-[11px] text-ivory-300 font-sans tracking-wider uppercase transition-colors hover:border-ochre/60 hover:text-white"
        >
          Click anywhere or press Esc to skip
        </button>
      </div>
    </div>
  );
};
