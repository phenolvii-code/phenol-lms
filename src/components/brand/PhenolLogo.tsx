import React from 'react';

interface PhenolLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
}

export const PhenolLogo: React.FC<PhenolLogoProps> = ({
  className = '',
  size = 40,
  withText = true,
}) => {
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* Precision Geometric Scientific Icon */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-2xl bg-cardPrimary border border-borderSubtle shadow-editorial group-hover:border-burgundy-500 transition-colors"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-3/5 h-3/5 text-gold-500 drop-shadow-[0_0_6px_rgba(212,175,55,0.3)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Benzene Ring Hexagon */}
          <polygon points="50,22 78,38 78,70 50,86 22,70 22,38" />
          {/* Inner Resonance Circle */}
          <circle cx="50" cy="54" r="17" strokeDasharray="4 3.5" strokeWidth="2.5" />
          {/* Hydroxyl terminal bond */}
          <line x1="50" y1="22" x2="50" y2="8" strokeWidth="4" />
          {/* -OH Terminal */}
          <text
            x="50"
            y="7"
            fill="#D4AF37"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            stroke="none"
            fontFamily="system-ui, sans-serif"
          >
            OH
          </text>
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-1.5">
            <span className="font-editorial text-lg tracking-wider text-textPrimary font-bold uppercase">
              Dr. Omar Magdi
            </span>
          </div>
          <span className="text-[11px] font-medium text-gold-500 tracking-wide">
            The Chemistry Counselor
          </span>
        </div>
      )}
    </div>
  );
};
