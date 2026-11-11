'use client';

import React, { useState } from 'react';
import { MoleculeElement } from '@/types/whiteboard';
import { X, Check } from 'lucide-react';

interface MoleculeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (mol: Omit<MoleculeElement, 'id' | 'zIndex'>) => void;
}

interface MoleculePreset {
  id: string;
  name: string;
  formula: string;
  description: string;
  atoms: MoleculeElement['atoms'];
  bonds: MoleculeElement['bonds'];
  curvedArrows: MoleculeElement['curvedArrows'];
}

const PRESETS: MoleculePreset[] = [
  {
    id: 'benzene',
    name: 'Benzene Ring (Aromatic Core)',
    formula: 'C6H6',
    description: 'Resonance-stabilized aromatic planar ring with alternating pi bonds',
    atoms: [
      { id: 'c1', symbol: 'C', x: 0, y: -50 },
      { id: 'c2', symbol: 'C', x: 43, y: -25 },
      { id: 'c3', symbol: 'C', x: 43, y: 25 },
      { id: 'c4', symbol: 'C', x: 0, y: 50 },
      { id: 'c5', symbol: 'C', x: -43, y: 25 },
      { id: 'c6', symbol: 'C', x: -43, y: -25 },
    ],
    bonds: [
      { id: 'b1', fromAtomId: 'c1', toAtomId: 'c2', bondOrder: 2 },
      { id: 'b2', fromAtomId: 'c2', toAtomId: 'c3', bondOrder: 1 },
      { id: 'b3', fromAtomId: 'c3', toAtomId: 'c4', bondOrder: 2 },
      { id: 'b4', fromAtomId: 'c4', toAtomId: 'c5', bondOrder: 1 },
      { id: 'b5', fromAtomId: 'c5', toAtomId: 'c6', bondOrder: 2 },
      { id: 'b6', fromAtomId: 'c6', toAtomId: 'c1', bondOrder: 1 },
    ],
    curvedArrows: [],
  },
  {
    id: 'phenol',
    name: 'Phenol (Hydroxybenzene)',
    formula: 'C6H5OH',
    description: 'Aromatic ring with activating hydroxyl group and lone pairs',
    atoms: [
      { id: 'c1', symbol: 'C', x: 0, y: -45 },
      { id: 'c2', symbol: 'C', x: 39, y: -22 },
      { id: 'c3', symbol: 'C', x: 39, y: 22 },
      { id: 'c4', symbol: 'C', x: 0, y: 45 },
      { id: 'c5', symbol: 'C', x: -39, y: 22 },
      { id: 'c6', symbol: 'C', x: -39, y: -22 },
      { id: 'o1', symbol: 'O', x: 0, y: -85, lonePairs: 2 },
      { id: 'h1', symbol: 'H', x: 28, y: -95 },
    ],
    bonds: [
      { id: 'b1', fromAtomId: 'c1', toAtomId: 'c2', bondOrder: 2 },
      { id: 'b2', fromAtomId: 'c2', toAtomId: 'c3', bondOrder: 1 },
      { id: 'b3', fromAtomId: 'c3', toAtomId: 'c4', bondOrder: 2 },
      { id: 'b4', fromAtomId: 'c4', toAtomId: 'c5', bondOrder: 1 },
      { id: 'b5', fromAtomId: 'c5', toAtomId: 'c6', bondOrder: 2 },
      { id: 'b6', fromAtomId: 'c6', toAtomId: 'c1', bondOrder: 1 },
      { id: 'b7', fromAtomId: 'c1', toAtomId: 'o1', bondOrder: 1 },
      { id: 'b8', fromAtomId: 'o1', toAtomId: 'h1', bondOrder: 1 },
    ],
    curvedArrows: [
      {
        id: 'ca1',
        startX: 5,
        startY: -80,
        endX: 0,
        endY: -55,
        controlX: 18,
        controlY: -65,
        barbCount: 2,
      },
    ],
  },
  {
    id: 'toluene',
    name: 'Toluene (Methylbenzene)',
    formula: 'C6H5CH3',
    description: 'ortho/para directing alkyl benzene derivative',
    atoms: [
      { id: 'c1', symbol: 'C', x: 0, y: -45 },
      { id: 'c2', symbol: 'C', x: 39, y: -22 },
      { id: 'c3', symbol: 'C', x: 39, y: 22 },
      { id: 'c4', symbol: 'C', x: 0, y: 45 },
      { id: 'c5', symbol: 'C', x: -39, y: 22 },
      { id: 'c6', symbol: 'C', x: -39, y: -22 },
      { id: 'ch3', symbol: 'CH₃', x: 0, y: -85 },
    ],
    bonds: [
      { id: 'b1', fromAtomId: 'c1', toAtomId: 'c2', bondOrder: 2 },
      { id: 'b2', fromAtomId: 'c2', toAtomId: 'c3', bondOrder: 1 },
      { id: 'b3', fromAtomId: 'c3', toAtomId: 'c4', bondOrder: 2 },
      { id: 'b4', fromAtomId: 'c4', toAtomId: 'c5', bondOrder: 1 },
      { id: 'b5', fromAtomId: 'c5', toAtomId: 'c6', bondOrder: 2 },
      { id: 'b6', fromAtomId: 'c6', toAtomId: 'c1', bondOrder: 1 },
      { id: 'b7', fromAtomId: 'c1', toAtomId: 'ch3', bondOrder: 1 },
    ],
    curvedArrows: [],
  },
  {
    id: 'cyclohexane',
    name: 'Cyclohexane (Chair Conformation)',
    formula: 'C6H12',
    description: 'Non-planar strain-free chair conformation with axial/equatorial bonds',
    atoms: [
      { id: 'c1', symbol: 'C', x: -45, y: -15 },
      { id: 'c2', symbol: 'C', x: -15, y: -35 },
      { id: 'c3', symbol: 'C', x: 35, y: -25 },
      { id: 'c4', symbol: 'C', x: 45, y: 15 },
      { id: 'c5', symbol: 'C', x: 15, y: 35 },
      { id: 'c6', symbol: 'C', x: -35, y: 25 },
    ],
    bonds: [
      { id: 'b1', fromAtomId: 'c1', toAtomId: 'c2', bondOrder: 1 },
      { id: 'b2', fromAtomId: 'c2', toAtomId: 'c3', bondOrder: 1 },
      { id: 'b3', fromAtomId: 'c3', toAtomId: 'c4', bondOrder: 1 },
      { id: 'b4', fromAtomId: 'c4', toAtomId: 'c5', bondOrder: 1 },
      { id: 'b5', fromAtomId: 'c5', toAtomId: 'c6', bondOrder: 1 },
      { id: 'b6', fromAtomId: 'c6', toAtomId: 'c1', bondOrder: 1 },
    ],
    curvedArrows: [],
  },
  {
    id: 'esterification',
    name: 'Ester Carbonyl Group (Fischer Mechanism)',
    formula: 'R-COOR\'',
    description: 'Electrophilic carbonyl carbon with nucleophilic attack arrows',
    atoms: [
      { id: 'r1', symbol: 'R', x: -60, y: 0 },
      { id: 'c1', symbol: 'C', x: 0, y: 0 },
      { id: 'o1', symbol: 'O', x: 0, y: -50, lonePairs: 2 },
      { id: 'o2', symbol: 'O', x: 50, y: 25, lonePairs: 2 },
      { id: 'r2', symbol: 'R\'', x: 95, y: 25 },
    ],
    bonds: [
      { id: 'b1', fromAtomId: 'r1', toAtomId: 'c1', bondOrder: 1 },
      { id: 'b2', fromAtomId: 'c1', toAtomId: 'o1', bondOrder: 2 },
      { id: 'b3', fromAtomId: 'c1', toAtomId: 'o2', bondOrder: 1 },
      { id: 'b4', fromAtomId: 'o2', toAtomId: 'r2', bondOrder: 1 },
    ],
    curvedArrows: [
      {
        id: 'ca1',
        startX: 40,
        startY: 15,
        endX: 10,
        endY: 5,
        controlX: 25,
        controlY: -5,
        barbCount: 2,
      },
    ],
  },
];

export const MoleculeBuilderModal: React.FC<MoleculeBuilderModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [selectedId, setSelectedId] = useState<string>('phenol');
  const [includeMechanismArrows, setIncludeMechanismArrows] = useState(true);

  if (!isOpen) return null;

  const currentPreset = PRESETS.find((p) => p.id === selectedId) || PRESETS[0];

  const handleConfirm = () => {
    onInsert({
      type: 'molecule',
      x: 350,
      y: 300,
      name: currentPreset.name,
      atoms: currentPreset.atoms,
      bonds: currentPreset.bonds,
      curvedArrows: includeMechanismArrows ? currentPreset.curvedArrows : [],
      showCarbons: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-ivory-100 border border-hairline rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-burgundy-900 text-ochre flex items-center justify-center font-formula font-bold text-sm">
              ⌬
            </div>
            <div>
              <h3 className="text-lg font-bold text-charcoal-900 font-display">
                Organic Molecular Structure Builder
              </h3>
              <p className="text-xs text-charcoal-100 font-sans">
                Insert precision skeletal rings, functional groups, and curved electron-flow arrows
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-charcoal-50 hover:text-charcoal-900 hover:bg-ivory-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedId(preset.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedId === preset.id
                  ? 'border-burgundy-500 bg-burgundy-50/70 shadow-sm'
                  : 'border-hairline bg-ivory-200 hover:border-burgundy-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-charcoal-900 font-display">
                  {preset.name}
                </span>
                <span className="text-xs font-formula font-semibold text-burgundy-500">
                  {preset.formula}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-100 mt-1 line-clamp-2">
                {preset.description}
              </p>
            </button>
          ))}
        </div>

        {/* Interactive Structure Preview */}
        <div className="p-4 rounded-xl border border-hairline bg-ivory-50 flex flex-col items-center justify-center min-h-[160px] relative">
          <span className="absolute top-2 left-3 text-[10px] uppercase font-bold text-burgundy-500 tracking-widest font-formula">
            Vector Diagram Preview • {currentPreset.name}
          </span>

          <svg width="220" height="150" viewBox="-80 -110 160 170" className="overflow-visible mt-3">
            {/* Render Bonds */}
            {currentPreset.bonds.map((b) => {
              const from = currentPreset.atoms.find((a) => a.id === b.fromAtomId);
              const to = currentPreset.atoms.find((a) => a.id === b.toAtomId);
              if (!from || !to) return null;

              if (b.bondOrder === 2) {
                // Double bond: draw offset parallel lines
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const len = Math.hypot(dx, dy) || 1;
                const nx = (-dy / len) * 2.8;
                const ny = (dx / len) * 2.8;

                return (
                  <g key={b.id}>
                    <line
                      x1={from.x + nx}
                      y1={from.y + ny}
                      x2={to.x + nx}
                      y2={to.y + ny}
                      stroke="#18191B"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                    <line
                      x1={from.x - nx}
                      y1={from.y - ny}
                      x2={to.x - nx}
                      y2={to.y - ny}
                      stroke="#18191B"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </g>
                );
              }

              return (
                <line
                  key={b.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#18191B"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Render Atoms */}
            {currentPreset.atoms.map((a) => (
              <g key={a.id} transform={`translate(${a.x}, ${a.y})`}>
                <circle r={a.symbol.length > 1 ? 12 : 9} fill="#FAF8F5" />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#501325"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {a.symbol}
                </text>
                {/* Lone pairs */}
                {a.lonePairs === 2 && (
                  <>
                    <circle cx="-5" cy="-10" r="1.5" fill="#C9A038" />
                    <circle cx="5" cy="-10" r="1.5" fill="#C9A038" />
                  </>
                )}
              </g>
            ))}

            {/* Curved electron-flow arrows */}
            {includeMechanismArrows &&
              currentPreset.curvedArrows.map((ca) => (
                <g key={ca.id}>
                  <path
                    d={`M ${ca.startX} ${ca.startY} Q ${ca.controlX} ${ca.controlY} ${ca.endX} ${ca.endY}`}
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                    markerEnd="url(#arrow-head)"
                  />
                </g>
              ))}
          </svg>
        </div>

        {currentPreset.curvedArrows.length > 0 && (
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-charcoal-900">
            <input
              type="checkbox"
              checked={includeMechanismArrows}
              onChange={(e) => setIncludeMechanismArrows(e.target.checked)}
              className="rounded text-burgundy-500 focus:ring-burgundy-500"
            />
            <span>Include Curved Electron-Pushing Mechanism Arrows (أسهم انتقال الإلكترونات)</span>
          </label>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-hairline text-xs font-semibold text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Check className="w-4 h-4 text-ochre" />
            <span>Place Molecule on Board</span>
          </button>
        </div>
      </div>
    </div>
  );
};
