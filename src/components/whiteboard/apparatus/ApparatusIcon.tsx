'use client';

import React from 'react';

interface ApparatusIconProps {
  kind: string;
  className?: string;
}

export const ApparatusIcon: React.FC<ApparatusIconProps> = ({ kind, className = 'w-12 h-12' }) => {
  switch (kind) {
    case 'beaker':
      return (
        <svg viewBox="0 0 60 70" className={className} fill="none" stroke="currentColor">
          {/* Liquid */}
          <path d="M12 35 L48 35 L48 60 Q48 64 44 64 L16 64 Q12 64 12 60 Z" fill="#2563EB" opacity="0.4" />
          <ellipse cx="30" cy="35" rx="18" ry="3" fill="#2563EB" opacity="0.6" />
          {/* Glass */}
          <path d="M6 10 L12 14 L12 60 Q12 66 18 66 L42 66 Q48 66 48 60 L48 14 L52 10" strokeWidth="2.5" strokeLinecap="round" />
          {/* Graduations */}
          <line x1="16" y1="26" x2="24" y2="26" strokeWidth="1.5" />
          <line x1="16" y1="38" x2="22" y2="38" strokeWidth="1.5" />
          <line x1="16" y1="50" x2="24" y2="50" strokeWidth="1.5" />
        </svg>
      );

    case 'erlenmeyer':
      return (
        <svg viewBox="0 0 60 75" className={className} fill="none" stroke="currentColor">
          {/* Liquid */}
          <path d="M22 45 L38 45 L50 64 Q50 68 44 68 L16 68 Q10 68 10 64 Z" fill="#EC4899" opacity="0.4" />
          <ellipse cx="30" cy="45" rx="8" ry="2" fill="#EC4899" opacity="0.6" />
          {/* Flask */}
          <path d="M22 10 L38 10 M25 10 L25 24 L52 64 Q54 68 46 68 L14 68 Q6 68 8 64 L35 24 L35 10" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'round_bottom_flask':
      return (
        <svg viewBox="0 0 60 75" className={className} fill="none" stroke="currentColor">
          <circle cx="30" cy="48" r="18" fill="#C9A038" opacity="0.35" />
          <path d="M24 10 L36 10 M26 10 L26 32 M34 10 L34 32" strokeWidth="2.5" />
          <circle cx="30" cy="48" r="18" strokeWidth="2.5" />
        </svg>
      );

    case 'distilling_flask':
      return (
        <svg viewBox="0 0 70 75" className={className} fill="none" stroke="currentColor">
          <circle cx="28" cy="48" r="17" fill="#B91C1C" opacity="0.35" />
          <path d="M22 10 L34 10 M24 10 L24 33 M32 10 L32 20 L58 36 L56 42 L32 28 L32 33" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="28" cy="48" r="17" strokeWidth="2.5" />
        </svg>
      );

    case 'burette_stand':
      return (
        <svg viewBox="0 0 60 85" className={className} fill="none" stroke="currentColor">
          {/* Stand base & rod */}
          <rect x="6" y="76" width="48" height="6" fill="#1F2937" rx="1" />
          <rect x="14" y="8" width="4" height="68" fill="#4B5563" />
          {/* Clamp */}
          <rect x="14" y="32" width="22" height="4" fill="#6B7280" />
          {/* Burette tube with liquid */}
          <rect x="34" y="12" width="8" height="54" fill="#7C3AED" opacity="0.3" stroke="currentColor" strokeWidth="1.8" />
          {/* Stopcock valve */}
          <rect x="32" y="66" width="12" height="4" fill="#DC2626" />
          <polygon points="36,70 40,70 38,76" fill="currentColor" />
        </svg>
      );

    case 'bunsen_burner_tripod':
      return (
        <svg viewBox="0 0 65 75" className={className} fill="none" stroke="currentColor">
          {/* Tripod legs */}
          <path d="M12 70 L24 28 M52 70 L40 28 M32 70 L32 28" strokeWidth="2.5" strokeLinecap="round" />
          {/* Gauze */}
          <rect x="20" y="24" width="24" height="4" fill="#9CA3AF" />
          {/* Burner & Flame */}
          <rect x="28" y="44" width="8" height="24" fill="#4B5563" />
          <ellipse cx="32" cy="68" rx="14" ry="4" fill="#1F2937" />
          {/* Flame */}
          <path d="M29 44 Q28 32 32 24 Q36 32 35 44 Z" fill="#3B82F6" opacity="0.8" />
        </svg>
      );

    case 'liebig_condenser':
      return (
        <svg viewBox="0 0 75 45" className={className} fill="none" stroke="currentColor">
          {/* Inner tube */}
          <line x1="4" y1="22" x2="71" y2="22" strokeWidth="3" />
          {/* Outer jacket */}
          <rect x="16" y="12" width="43" height="20" fill="#60A5FA" opacity="0.4" stroke="currentColor" strokeWidth="2" rx="2" />
          {/* Water nipples */}
          <rect x="50" y="32" width="6" height="8" fill="currentColor" />
          <rect x="20" y="4" width="6" height="8" fill="currentColor" />
        </svg>
      );

    case 'separatory_funnel':
      return (
        <svg viewBox="0 0 60 80" className={className} fill="none" stroke="currentColor">
          {/* Pear body with two layers */}
          <path d="M22 14 L38 14 Q52 35 34 56 L34 72 L26 72 L26 56 Q8 35 22 14 Z" strokeWidth="2" />
          <path d="M13 36 Q19 46 26 54 L34 54 Q41 46 47 36 Z" fill="#3B82F6" opacity="0.5" />
          <path d="M22 16 Q10 32 15 36 L45 36 Q50 32 38 16 Z" fill="#F59E0B" opacity="0.5" />
          {/* Stopper & Stopcock */}
          <ellipse cx="30" cy="11" rx="8" ry="3" fill="#64748B" />
          <rect x="23" y="60" width="14" height="4" fill="#DC2626" />
        </svg>
      );

    case 'test_tube':
      return (
        <svg viewBox="0 0 40 75" className={className} fill="none" stroke="currentColor">
          <path d="M12 10 L28 10 M14 10 L14 56 Q14 66 20 66 Q26 66 26 56 L26 10" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M15 36 L25 36 L25 56 Q25 64 20 64 Q15 64 15 56 Z" fill="#059669" opacity="0.5" />
        </svg>
      );

    case 'test_tube_rack':
      return (
        <svg viewBox="0 0 75 55" className={className} fill="none" stroke="currentColor">
          {/* Wooden rack */}
          <rect x="8" y="16" width="59" height="6" fill="#D4A373" stroke="#8D5B4C" strokeWidth="1.5" />
          <rect x="6" y="44" width="63" height="6" fill="#D4A373" stroke="#8D5B4C" strokeWidth="1.5" />
          <line x1="12" y1="16" x2="12" y2="44" stroke="#8D5B4C" strokeWidth="2.5" />
          <line x1="63" y1="16" x2="63" y2="44" stroke="#8D5B4C" strokeWidth="2.5" />
          {/* Tubes */}
          <line x1="22" y1="8" x2="22" y2="44" stroke="#2563EB" strokeWidth="3" opacity="0.7" />
          <line x1="32" y1="8" x2="32" y2="44" stroke="#DC2626" strokeWidth="3" opacity="0.7" />
          <line x1="42" y1="8" x2="42" y2="44" stroke="#059669" strokeWidth="3" opacity="0.7" />
          <line x1="52" y1="8" x2="52" y2="44" stroke="#D97706" strokeWidth="3" opacity="0.7" />
        </svg>
      );

    case 'boiling_delivery_tube':
      return (
        <svg viewBox="0 0 75 65" className={className} fill="none" stroke="currentColor">
          {/* Tilted tube */}
          <g transform="rotate(15 20 20)">
            <rect x="10" y="8" width="12" height="38" stroke="currentColor" strokeWidth="2" rx="6" />
            <rect x="11" y="24" width="10" height="20" fill="#78350F" opacity="0.4" />
          </g>
          {/* Delivery elbow tube */}
          <path d="M22 18 L45 12 L65 35 L65 58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'gas_collecting_trough':
      return (
        <svg viewBox="0 0 75 60" className={className} fill="none" stroke="currentColor">
          {/* Trough */}
          <rect x="8" y="32" width="59" height="22" fill="#38BDF8" opacity="0.3" stroke="currentColor" strokeWidth="2" rx="2" />
          {/* Inverted jar */}
          <rect x="28" y="10" width="18" height="34" fill="#FEF08A" opacity="0.4" stroke="currentColor" strokeWidth="2" />
          {/* Bubbles */}
          <circle cx="37" cy="38" r="2" fill="white" />
          <circle cx="35" cy="28" r="2.5" fill="white" />
        </svg>
      );

    case 'graduated_cylinder':
      return (
        <svg viewBox="0 0 45 75" className={className} fill="none" stroke="currentColor">
          {/* Base */}
          <polygon points="12,68 32,68 28,62 16,62" fill="#334155" />
          {/* Cylinder with liquid */}
          <rect x="17" y="10" width="10" height="52" stroke="currentColor" strokeWidth="2" />
          <rect x="18" y="28" width="8" height="34" fill="#0EA5E9" opacity="0.5" />
          {/* Graduations */}
          <line x1="20" y1="20" x2="25" y2="20" strokeWidth="1" />
          <line x1="20" y1="32" x2="25" y2="32" strokeWidth="1" />
          <line x1="20" y1="44" x2="25" y2="44" strokeWidth="1" />
        </svg>
      );

    case 'thermometer':
      return (
        <svg viewBox="0 0 30 75" className={className} fill="none" stroke="currentColor">
          <rect x="13" y="10" width="4" height="52" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="15" cy="64" r="5" fill="#DC2626" stroke="#DC2626" />
          <line x1="15" y1="25" x2="15" y2="60" stroke="#DC2626" strokeWidth="2" />
        </svg>
      );

    case 'dropper':
      return (
        <svg viewBox="0 0 35 75" className={className} fill="none" stroke="currentColor">
          {/* Red bulb */}
          <ellipse cx="17" cy="14" rx="8" ry="7" fill="#EF4444" stroke="#DC2626" />
          {/* Glass tube */}
          <path d="M14 21 L14 54 L17 64 L20 54 L20 21 Z" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17" cy="70" r="2" fill="#EF4444" />
        </svg>
      );

    case 'buchner_funnel':
      return (
        <svg viewBox="0 0 60 75" className={className} fill="none" stroke="currentColor">
          {/* Flask */}
          <path d="M14 66 L46 66 L36 38 L24 38 Z" stroke="currentColor" strokeWidth="2" />
          <line x1="36" y1="44" x2="48" y2="44" stroke="currentColor" strokeWidth="2" />
          {/* Buchner top */}
          <rect x="16" y="10" width="28" height="18" fill="#F8FAFC" stroke="currentColor" strokeWidth="2" />
          <line x1="30" y1="28" x2="30" y2="42" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      );

    case 'crucible_tripod':
      return (
        <svg viewBox="0 0 60 70" className={className} fill="none" stroke="currentColor">
          {/* Tripod */}
          <line x1="12" y1="64" x2="22" y2="34" stroke="#1F2937" strokeWidth="2.5" />
          <line x1="48" y1="64" x2="38" y2="34" stroke="#1F2937" strokeWidth="2.5" />
          {/* Triangle */}
          <polygon points="18,34 42,34 30,42" stroke="#D97706" strokeWidth="2" fill="none" />
          {/* Crucible */}
          <path d="M22 24 L38 24 L34 38 L26 38 Z" fill="#FFFFFF" stroke="currentColor" strokeWidth="1.8" />
          <line x1="20" y1="22" x2="40" y2="22" stroke="currentColor" strokeWidth="2" />
        </svg>
      );

    case 'watch_glass_dish':
      return (
        <svg viewBox="0 0 60 45" className={className} fill="none" stroke="currentColor">
          <path d="M8 20 Q30 38 52 20" stroke="currentColor" strokeWidth="2.5" />
          <ellipse cx="30" cy="24" rx="14" ry="3" fill="#3B82F6" opacity="0.4" />
        </svg>
      );

    case 'u_tube':
      return (
        <svg viewBox="0 0 60 65" className={className} fill="none" stroke="currentColor">
          <path d="M18 10 L18 42 Q18 54 30 54 Q42 54 42 42 L42 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="24" cy="46" r="2" fill="#94A3B8" />
          <circle cx="30" cy="48" r="2" fill="#94A3B8" />
          <circle cx="36" cy="46" r="2" fill="#94A3B8" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 50 50" className={className} fill="none" stroke="currentColor">
          <rect x="5" y="5" width="40" height="40" rx="4" strokeWidth="2" />
        </svg>
      );
  }
};
