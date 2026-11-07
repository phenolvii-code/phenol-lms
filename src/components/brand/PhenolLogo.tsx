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
  subtitle = 'د/عمر مجدي',
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
        <div className="flex flex-col text-right justify-center leading-tight">
          <span className="font-editorial text-base sm:text-lg tracking-widest text-charcoal-900 font-bold uppercase">
            PHENOL
          </span>
          <span className="text-xs font-semibold text-charcoal-100 font-sans mt-0.5">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
