'use client';

import React from 'react';

interface PhenolLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
  variant?: 'gold' | 'white';
}

export const PhenolLogo: React.FC<PhenolLogoProps> = ({
  className = '',
  size = 42,
  withText = true,
  variant = 'gold',
}) => {
  const iconSrc =
    variant === 'gold'
      ? '/images/phenol-symbol-gold.png'
      : '/images/phenol-symbol-white.png';

  return (
    <div className={`flex items-center gap-3.5 group cursor-pointer ${className}`}>
      {/* Authentic Geometric Emblem Container */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-2xl bg-cardPrimary/90 border border-borderSubtle group-hover:border-gold-500/60 shadow-editorial transition-all duration-300 overflow-hidden p-1.5 backdrop-blur-md"
        style={{ width: size, height: size }}
      >
        <img
          src={iconSrc}
          alt="Phenol - Dr. Omar Magdi Logo"
          className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(212,175,55,0.35)] group-hover:scale-105 transition-transform duration-300"
          loading="eager"
        />
      </div>

      {withText && (
        <div className="flex flex-col text-right select-none justify-center">
          <span className="font-editorial text-base sm:text-lg tracking-wider text-textPrimary group-hover:text-white font-extrabold uppercase transition-colors leading-none">
            PHENOL
          </span>
          <span className="text-[10px] sm:text-[11px] font-semibold text-gold-500 tracking-wide font-formula mt-0.5">
            Dr/Omar Magdi
          </span>
        </div>
      )}
    </div>
  );
};