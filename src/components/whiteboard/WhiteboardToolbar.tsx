'use client';

import React from 'react';
import { WhiteboardTool, ShapeKind } from '@/types/whiteboard';
import {
  MousePointer,
  Pen,
  Highlighter,
  Eraser,
  Square,
  Type,
  Table,
  Plus,
  Undo2,
  Redo2,
  Trash2,
  Sparkles,
  Layers,
  Activity,
} from 'lucide-react';

interface WhiteboardToolbarProps {
  currentTool: WhiteboardTool;
  onSelectTool: (tool: WhiteboardTool) => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
  currentSize: number;
  onSelectSize: (size: number) => void;
  currentShape: ShapeKind;
  onSelectShape: (shape: ShapeKind) => void;
  onOpenEquationModal: () => void;
  onOpenMoleculeModal: () => void;
  onOpenTableModal: () => void;
  onOpenEnergyModal: () => void;
  onClearCanvas: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const PALETTE_COLORS = [
  { name: 'Phenol Burgundy', value: '#501325' },
  { name: 'Charcoal Black', value: '#18191B' },
  { name: 'Deep Sapphire Blue', value: '#1E3A8A' },
  { name: 'Emerald Chemistry Green', value: '#065F46' },
  { name: 'Ochre Gold', value: '#C9A038' },
  { name: 'Reaction Crimson', value: '#B91C1C' },
];

const PEN_SIZES = [
  { label: 'Fine (2px)', value: 2 },
  { label: 'Medium (4px)', value: 4 },
  { label: 'Bold (8px)', value: 8 },
  { label: 'Broad (14px)', value: 14 },
];

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  currentTool,
  onSelectTool,
  currentColor,
  onSelectColor,
  currentSize,
  onSelectSize,
  currentShape,
  onSelectShape,
  onOpenEquationModal,
  onOpenMoleculeModal,
  onOpenTableModal,
  onOpenEnergyModal,
  onClearCanvas,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  return (
    <aside className="fixed left-4 top-24 z-30 flex flex-col gap-2.5 bg-ivory-100/95 backdrop-blur-md p-2 rounded-2xl border border-hairline shadow-editorial select-none max-h-[82vh] overflow-y-auto w-14 sm:w-16 items-center">
      {/* Primary Navigation & Drawing Tools */}
      <div className="flex flex-col gap-1 items-center w-full pb-2 border-b border-hairline">
        <button
          type="button"
          onClick={() => onSelectTool('select')}
          title="Select & Pan Tool (V)"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            currentTool === 'select'
              ? 'bg-burgundy-900 text-ochre shadow-md scale-105'
              : 'text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-200'
          }`}
        >
          <MousePointer className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('pen')}
          title="Fountain Pen (P)"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            currentTool === 'pen'
              ? 'bg-burgundy-900 text-ochre shadow-md scale-105'
              : 'text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-200'
          }`}
        >
          <Pen className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('highlighter')}
          title="Highlighter (H)"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            currentTool === 'highlighter'
              ? 'bg-burgundy-900 text-ochre shadow-md scale-105'
              : 'text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-200'
          }`}
        >
          <Highlighter className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('eraser')}
          title="Eraser (E)"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            currentTool === 'eraser'
              ? 'bg-burgundy-900 text-ochre shadow-md scale-105'
              : 'text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-200'
          }`}
        >
          <Eraser className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('text')}
          title="Text Note (T)"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            currentTool === 'text'
              ? 'bg-burgundy-900 text-ochre shadow-md scale-105'
              : 'text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-200'
          }`}
        >
          <Type className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTool('shape')}
          title="Geometric Shapes (S)"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            currentTool === 'shape'
              ? 'bg-burgundy-900 text-ochre shadow-md scale-105'
              : 'text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-200'
          }`}
        >
          <Square className="w-4 h-4" />
        </button>
      </div>

      {/* Specialized Academic Chemistry Modules */}
      <div className="flex flex-col gap-1 items-center w-full py-2 border-b border-hairline">
        <span className="text-[9px] font-bold uppercase tracking-wider text-burgundy-500 font-formula">
          CHEM
        </span>

        <button
          type="button"
          onClick={onOpenMoleculeModal}
          title="Insert Organic Molecule (Benzene, Phenol, Rings)"
          className="w-10 h-10 rounded-xl bg-ivory-200 border border-hairline hover:border-burgundy-500 hover:bg-burgundy-50 text-burgundy-900 flex items-center justify-center font-formula font-bold text-base transition-transform hover:scale-105"
        >
          ⌬
        </button>

        <button
          type="button"
          onClick={onOpenEquationModal}
          title="Chemical Equation & Stoichiometry Editor"
          className="w-10 h-10 rounded-xl bg-ivory-200 border border-hairline hover:border-burgundy-500 hover:bg-burgundy-50 text-burgundy-900 flex items-center justify-center font-formula font-bold text-sm transition-transform hover:scale-105"
        >
          ⚗️
        </button>

        <button
          type="button"
          onClick={onOpenTableModal}
          title="Insert Academic Comparison Table"
          className="w-10 h-10 rounded-xl bg-ivory-200 border border-hairline hover:border-burgundy-500 hover:bg-burgundy-50 text-charcoal-900 flex items-center justify-center transition-transform hover:scale-105"
        >
          <Table className="w-4 h-4 text-burgundy-900" />
        </button>

        <button
          type="button"
          onClick={onOpenEnergyModal}
          title="Insert Reaction Energy Profile (ΔH & Ea)"
          className="w-10 h-10 rounded-xl bg-ivory-200 border border-hairline hover:border-burgundy-500 hover:bg-burgundy-50 text-charcoal-900 flex items-center justify-center transition-transform hover:scale-105"
        >
          <Activity className="w-4 h-4 text-burgundy-900" />
        </button>
      </div>

      {/* Color Swatches */}
      <div className="flex flex-col gap-1.5 items-center w-full py-2 border-b border-hairline">
        {PALETTE_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onSelectColor(c.value)}
            title={c.name}
            className={`w-6 h-6 rounded-full transition-transform ${
              currentColor === c.value ? 'scale-125 ring-2 ring-ochre shadow-sm' : 'hover:scale-110'
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>

      {/* Stroke Sizes */}
      <div className="flex flex-col gap-1.5 items-center w-full py-1">
        {PEN_SIZES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onSelectSize(s.value)}
            title={s.label}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              currentSize === s.value ? 'bg-burgundy-900 text-ivory-100' : 'hover:bg-ivory-200'
            }`}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: Math.min(s.value * 1.5, 12), height: Math.min(s.value * 1.5, 12) }}
            />
          </button>
        ))}
      </div>

      {/* Undo / Redo / Trash */}
      <div className="flex flex-col gap-1 items-center w-full pt-2 border-t border-hairline">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal-100 hover:text-charcoal-900 disabled:opacity-30 disabled:pointer-events-none hover:bg-ivory-200"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal-100 hover:text-charcoal-900 disabled:opacity-30 disabled:pointer-events-none hover:bg-ivory-200"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onClearCanvas}
          title="Clear Board Canvas"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
