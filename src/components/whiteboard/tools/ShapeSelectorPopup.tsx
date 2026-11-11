'use client';

import React from 'react';
import { ShapeKind } from '@/types/whiteboard';
import {
  Square,
  Circle,
  Triangle,
  Diamond,
  Minus,
  ArrowRight,
  ArrowLeftRight,
  CornerDownRight,
  RectangleHorizontal,
} from 'lucide-react';

interface ShapeSelectorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentShape: ShapeKind;
  onSelectShape: (shape: ShapeKind) => void;
}

const SHAPES_LIST: { kind: ShapeKind; label: string; icon: React.FC<{ className?: string }> }[] = [
  { kind: 'rectangle', label: 'Rectangle', icon: Square },
  { kind: 'rounded_rectangle', label: 'Rounded Box', icon: RectangleHorizontal },
  { kind: 'ellipse', label: 'Circle / Ellipse', icon: Circle },
  { kind: 'triangle', label: 'Triangle', icon: Triangle },
  { kind: 'diamond', label: 'Diamond', icon: Diamond },
  { kind: 'line', label: 'Straight Line', icon: Minus },
  { kind: 'arrow', label: 'Reaction Arrow', icon: ArrowRight },
  { kind: 'double_headed_arrow', label: 'Equilibrium Arrow', icon: ArrowLeftRight },
  { kind: 'curved_arrow', label: 'Curved Arrow', icon: CornerDownRight },
];

export const ShapeSelectorPopup: React.FC<ShapeSelectorPopupProps> = ({
  isOpen,
  onClose,
  currentShape,
  onSelectShape,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed left-20 top-44 z-40 w-48 p-2 bg-ivory-100/98 backdrop-blur-xl rounded-2xl border border-hairline shadow-editorial text-xs select-none animate-in fade-in slide-in-from-left-2 duration-150">
      <div className="px-2 py-1 text-[10px] font-bold uppercase text-charcoal-500 tracking-wider border-b border-hairline mb-1.5 flex items-center justify-between">
        <span>Shapes & Arrows</span>
        <span className="text-[9px] text-burgundy-900 font-mono">Drag to draw</span>
      </div>

      <div className="flex flex-col gap-0.5">
        {SHAPES_LIST.map((sh) => {
          const Icon = sh.icon;
          const isSelected = currentShape === sh.kind;
          return (
            <button
              key={sh.kind}
              type="button"
              onClick={() => {
                onSelectShape(sh.kind);
                onClose();
              }}
              className={`w-full px-2.5 py-1.5 rounded-xl font-medium text-left flex items-center gap-2.5 transition-all ${
                isSelected
                  ? 'bg-burgundy-900 text-ochre shadow-xs font-bold'
                  : 'text-charcoal-800 hover:bg-ivory-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{sh.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
