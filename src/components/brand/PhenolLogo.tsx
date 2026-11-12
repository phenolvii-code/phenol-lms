'use client';

import React from 'react';

interface PhenolLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
  variant?: 'burgundy' | 'ink' | 'gold';
  monochrome?: boolean;
  subtitle?: string;
}

export const PhenolLogo: React.FC<PhenolLogoProps> = ({
  className = '',
  size = 36,
  withText = true,
  variant = 'burgundy',
  monochrome = false,
  subtitle = 'Dr. Omar Magdi',
}) => {
  const iconSrc =
    monochrome
      ? '/images/phenol-symbol-ink.png'
      : variant === 'burgundy'
      ? '/images/phenol-symbol-burgundy.png'
      : variant === 'ink'
      ? '/images/phenol-symbol-ink.png'
      : '/images/phenol-symbol-gold.png';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Precision Geometric Emblem */}
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <img
          src={iconSrc}
          alt={`PHENOL • ${subtitle}`}
          className="w-full h-full object-contain"
          loading="eager"
        />
      </div>

      {withText && (
        <div className="flex flex-col text-left justify-center leading-tight">
          <div className="flex items-baseline gap-1.5">
            <span className="font-editorial text-base sm:text-lg tracking-[0.16em] text-charcoal-900 font-bold uppercase">
              PHENOL
            </span>
            <span className="font-editorial text-[11px] sm:text-xs tracking-[0.22em] text-burgundy-500 font-bold uppercase">
              ACADEMY
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-charcoal-100 font-sans tracking-wide mt-0.5">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
