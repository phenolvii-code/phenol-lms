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
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Precision Chemical Icon: Benzene Ring with -OH group (Phenol) */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-br from-burgundy-950 via-burgundy-900 to-burgundy-950 border border-gold-500/30 shadow-luxury"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-3/4 h-3/4 text-gold-400 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Benzene Ring Hexagon */}
          <polygon points="50,22 78,38 78,70 50,86 22,70 22,38" />
          {/* Inner Resonance Circle (Kekulé resonance representation) */}
          <circle cx="50" cy="54" r="18" strokeDasharray="5 4" strokeWidth="3" />
          {/* C-O Bond to Hydroxyl group */}
          <line x1="50" y1="22" x2="50" y2="8" strokeWidth="5" />
          {/* -OH Terminal Label */}
          <text
            x="50"
            y="6"
            fill="#d4af37"
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
            <span className="font-extrabold text-xl tracking-tight text-burgundy-950 font-serif">
              PHENOL
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse"></span>
          </div>
          <span className="text-[11px] font-medium text-burgundy-800 tracking-wide">
            Dr. Omar Magdi • Chemistry
          </span>
        </div>
      )}
    </div>
  );
};
