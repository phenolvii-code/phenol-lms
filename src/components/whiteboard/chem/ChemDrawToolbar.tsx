'use client';

import React from 'react';

export type ChemSubTool =
  | 'zigzag_chain' // Sprout/extend zigzag chain atom-by-atom
  | 'bond_cycle' // Toggle single/double/triple/wedge/dash
  | 'element_mutate' // Change atom symbol (C, O, N, Cl...)
  | 'ring_benzene'
  | 'ring_cyclohexane'
  | 'ring_cyclopentane'
  | 'charge_plus'
  | 'charge_minus'
  | 'lone_pair'
  | 'eraser_chem';

export type ChemElementSymbol = 'C' | 'H' | 'O' | 'N' | 'Cl' | 'Br' | 'I' | 'F' | 'S' | 'P';

interface ChemDrawToolbarProps {
  activeSubTool: ChemSubTool;
  onSelectSubTool: (tool: ChemSubTool) => void;
  activeElement: ChemElementSymbol;
  onSelectElement: (sym: ChemElementSymbol) => void;
  isLewisMode: boolean;
  onToggleLewisMode: () => void;
  onClose: () => void;
}

const COMMON_ELEMENTS: ChemElementSymbol[] = ['C', 'H', 'O', 'N', 'Cl', 'Br', 'I', 'F', 'S', 'P'];

export const ChemDrawToolbar: React.FC<ChemDrawToolbarProps> = ({
  activeSubTool,
  onSelectSubTool,
  activeElement,
  onSelectElement,
  isLewisMode,
  onToggleLewisMode,
  onClose,
}) => {
  return (
    <div className="fixed top-24 left-20 z-40 flex items-center gap-2 p-2 bg-ivory-100/98 backdrop-blur-md rounded-2xl border border-hairline shadow-editorial text-xs select-none animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Badge / Mode Indicator */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-burgundy-900 text-ochre font-bold">
        <span className="text-sm">⌬</span>
        <span className="font-formula tracking-wider uppercase text-[10px]">Mini-ChemDraw</span>
      </div>

      <div className="h-6 w-px bg-charcoal-200" />

      {/* Primary Structure Tools */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSelectSubTool('zigzag_chain')}
          title="Zigzag Chain Sprouter (Click empty canvas to start atom, click atom to sprout zigzag link or branch)"
          className={`px-2.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1 ${
            activeSubTool === 'zigzag_chain'
              ? 'bg-burgundy-900 text-ochre shadow-xs'
              : 'text-charcoal-800 hover:bg-ivory-200'
          }`}
        >
          <span className="font-mono text-sm leading-none">/\/\</span>
          <span>Zigzag Bond</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectSubTool('bond_cycle')}
          title="Bond Order Cycle (Click any bond to cycle: Single ➔ Double ➔ Triple ➔ Wedge)"
          className={`px-2.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1 ${
            activeSubTool === 'bond_cycle'
              ? 'bg-burgundy-900 text-ochre shadow-xs'
              : 'text-charcoal-800 hover:bg-ivory-200'
          }`}
        >
          <span className="font-mono font-bold text-sm leading-none">═ / ≡</span>
          <span>Bond Order</span>
        </button>
      </div>

      <div className="h-6 w-px bg-charcoal-200" />

      {/* Ring Stamps */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSelectSubTool('ring_benzene')}
          title="Stamp Benzene Ring (Click canvas or atom to fuse)"
          className={`w-8 h-8 rounded-xl font-formula font-bold text-base flex items-center justify-center transition-all ${
            activeSubTool === 'ring_benzene'
              ? 'bg-burgundy-900 text-ochre shadow-xs scale-105'
              : 'text-charcoal-800 hover:bg-ivory-200'
          }`}
        >
          ⌬
        </button>

        <button
          type="button"
          onClick={() => onSelectSubTool('ring_cyclohexane')}
          title="Stamp Cyclohexane Ring"
          className={`w-8 h-8 rounded-xl font-formula font-bold text-sm flex items-center justify-center transition-all ${
            activeSubTool === 'ring_cyclohexane'
              ? 'bg-burgundy-900 text-ochre shadow-xs scale-105'
              : 'text-charcoal-800 hover:bg-ivory-200'
          }`}
        >
          ⎔
        </button>

        <button
          type="button"
          onClick={() => onSelectSubTool('ring_cyclopentane')}
          title="Stamp Cyclopentane Ring"
          className={`w-8 h-8 rounded-xl font-formula font-bold text-sm flex items-center justify-center transition-all ${
            activeSubTool === 'ring_cyclopentane'
              ? 'bg-burgundy-900 text-ochre shadow-xs scale-105'
              : 'text-charcoal-800 hover:bg-ivory-200'
          }`}
        >
          ⬟
        </button>
      </div>

      <div className="h-6 w-px bg-charcoal-200" />

      {/* Atom Selector */}
      <div className="flex items-center gap-0.5">
        <span className="text-[10px] text-charcoal-500 font-bold uppercase mr-1">Atom:</span>
        {COMMON_ELEMENTS.map((el) => (
          <button
            key={el}
            type="button"
            onClick={() => {
              onSelectElement(el);
              onSelectSubTool('element_mutate');
            }}
            title={`Set Atom Element to ${el} (Click any atom on canvas to mutate)`}
            className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition-all ${
              activeElement === el && activeSubTool === 'element_mutate'
                ? 'bg-burgundy-900 text-ochre ring-1 ring-ochre'
                : 'text-charcoal-800 hover:bg-ivory-200'
            }`}
          >
            {el}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-charcoal-200" />

      {/* Charge & Lone Pairs */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSelectSubTool('charge_plus')}
          title="Add Positive Charge (+) to atom"
          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
            activeSubTool === 'charge_plus'
              ? 'bg-rose-700 text-white'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => onSelectSubTool('charge_minus')}
          title="Add Negative Charge (-) to atom"
          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
            activeSubTool === 'charge_minus'
              ? 'bg-sky-700 text-white'
              : 'text-sky-700 hover:bg-sky-50'
          }`}
        >
          −
        </button>
        <button
          type="button"
          onClick={() => onSelectSubTool('lone_pair')}
          title="Add Lone Pair (:) to atom"
          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
            activeSubTool === 'lone_pair'
              ? 'bg-amber-600 text-white'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          ••
        </button>
      </div>

      <div className="h-6 w-px bg-charcoal-200" />

      {/* Skeletal Zigzag vs Lewis Detailed */}
      <button
        type="button"
        onClick={onToggleLewisMode}
        title="Toggle between Skeletal Zigzag formula (ChemDraw standard) and Detailed Lewis formula"
        className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
          isLewisMode
            ? 'bg-ochre-600 text-charcoal-900 font-bold'
            : 'bg-ivory-200 text-charcoal-700 hover:bg-ivory-300'
        }`}
      >
        {isLewisMode ? 'Lewis (Detailed C-H)' : 'Skeletal (Zigzag)'}
      </button>

      {/* Chem Eraser */}
      <button
        type="button"
        onClick={() => onSelectSubTool('eraser_chem')}
        title="Delete Atom / Bond"
        className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center transition-all ${
          activeSubTool === 'eraser_chem'
            ? 'bg-rose-700 text-white'
            : 'text-rose-600 hover:bg-rose-50'
        }`}
      >
        ✕
      </button>

      {/* Done / Exit Button */}
      <button
        type="button"
        onClick={onClose}
        className="px-2.5 py-1 rounded-xl bg-charcoal-200 hover:bg-charcoal-300 text-charcoal-800 text-[11px] font-bold transition-colors ml-1"
      >
        Done
      </button>
    </div>
  );
};
