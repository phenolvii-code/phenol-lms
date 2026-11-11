'use client';

import React, { useState } from 'react';
import { EnergyDiagramElement } from '@/types/whiteboard';
import { X, Check, Activity } from 'lucide-react';

interface EnergyDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (diagram: Omit<EnergyDiagramElement, 'id' | 'zIndex'>) => void;
}

export const EnergyDiagramModal: React.FC<EnergyDiagramModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [reactionName, setReactionName] = useState('Combustion of Methane (CH4 + 2O2)');
  const [isExothermic, setIsExothermic] = useState(true);
  const [reactantsLabel, setReactantsLabel] = useState('CH4 + 2O2 (Reactants)');
  const [productsLabel, setProductsLabel] = useState('CO2 + 2H2O (Products)');
  const [eaLabel, setEaLabel] = useState('Ea (Uncatalyzed) = 125 kJ');
  const [deltaHLabel, setDeltaHLabel] = useState('ΔH = -890 kJ/mol (Exothermic)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInsert({
      type: 'energy_diagram',
      x: 220,
      y: 200,
      reactionName,
      isExothermic,
      reactantsLabel,
      productsLabel,
      eaLabel,
      deltaHLabel,
      width: 480,
      height: 320,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-ivory-100 border border-hairline rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-burgundy-100 text-burgundy-900 flex items-center justify-center font-formula font-bold text-sm">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-charcoal-900 font-display">
                Reaction Energy-Level Profile (ΔH & Ea)
              </h3>
              <p className="text-xs text-charcoal-100 font-sans">
                Insert reaction kinetics coordinate curve with activation energy barrier and enthalpy
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reaction Type Toggle */}
          <div className="flex items-center gap-3 p-1 rounded-xl bg-ivory-200 border border-hairline">
            <button
              type="button"
              onClick={() => {
                setIsExothermic(true);
                setDeltaHLabel('ΔH = -890 kJ/mol (Exothermic)');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isExothermic
                  ? 'bg-burgundy-900 text-ivory-100 shadow-sm'
                  : 'text-charcoal-100 hover:text-charcoal-900'
              }`}
            >
              Exothermic (طارد للحرارة • ΔH &lt; 0)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsExothermic(false);
                setDeltaHLabel('ΔH = +180 kJ/mol (Endothermic)');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isExothermic
                  ? 'bg-burgundy-900 text-ivory-100 shadow-sm'
                  : 'text-charcoal-100 hover:text-charcoal-900'
              }`}
            >
              Endothermic (ماص للحرارة • ΔH &gt; 0)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-900 mb-1">
              Reaction Title
            </label>
            <input
              type="text"
              value={reactionName}
              onChange={(e) => setReactionName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-hairline bg-ivory-50 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-500 font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                Reactants Level Label
              </label>
              <input
                type="text"
                value={reactantsLabel}
                onChange={(e) => setReactantsLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-hairline bg-ivory-50 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-500 font-formula"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                Products Level Label
              </label>
              <input
                type="text"
                value={productsLabel}
                onChange={(e) => setProductsLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-hairline bg-ivory-50 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-500 font-formula"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                Activation Energy (Ea)
              </label>
              <input
                type="text"
                value={eaLabel}
                onChange={(e) => setEaLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-hairline bg-ivory-50 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-500 font-formula"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                Enthalpy Change (ΔH)
              </label>
              <input
                type="text"
                value={deltaHLabel}
                onChange={(e) => setDeltaHLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-hairline bg-ivory-50 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-500 font-formula"
              />
            </div>
          </div>

          {/* SVG Profile Preview */}
          <div className="p-3 rounded-xl border border-hairline bg-ivory-50 flex items-center justify-center">
            <svg width="340" height="140" viewBox="0 0 340 140" className="overflow-visible">
              {/* Axes */}
              <line x1="30" y1="120" x2="310" y2="120" stroke="#454952" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="30" y1="120" x2="30" y2="20" stroke="#454952" strokeWidth="1.5" />
              <text x="315" y="123" fontSize="9" fill="#6B7280" fontFamily="sans-serif">Progress</text>
              <text x="32" y="15" fontSize="9" fill="#6B7280" fontFamily="sans-serif">Potential Energy (kJ)</text>

              {isExothermic ? (
                <>
                  {/* Reactants line */}
                  <line x1="30" y1="70" x2="80" y2="70" stroke="#501325" strokeWidth="2.5" />
                  {/* Transition curve */}
                  <path d="M 80 70 Q 150 15 220 100" fill="none" stroke="#641C32" strokeWidth="2.5" />
                  {/* Products line */}
                  <line x1="220" y1="100" x2="280" y2="100" stroke="#501325" strokeWidth="2.5" />
                  {/* Labels */}
                  <text x="45" y="62" fontSize="9" fontWeight="bold" fill="#501325" fontFamily="monospace">Reactants</text>
                  <text x="235" y="94" fontSize="9" fontWeight="bold" fill="#501325" fontFamily="monospace">Products</text>
                  <text x="145" y="32" fontSize="9" fill="#D97706" fontWeight="bold" fontFamily="monospace">Transition State (Ea)</text>
                </>
              ) : (
                <>
                  {/* Reactants line */}
                  <line x1="30" y1="100" x2="80" y2="100" stroke="#501325" strokeWidth="2.5" />
                  {/* Transition curve */}
                  <path d="M 80 100 Q 150 20 220 50" fill="none" stroke="#641C32" strokeWidth="2.5" />
                  {/* Products line */}
                  <line x1="220" y1="50" x2="280" y2="50" stroke="#501325" strokeWidth="2.5" />
                  {/* Labels */}
                  <text x="45" y="94" fontSize="9" fontWeight="bold" fill="#501325" fontFamily="monospace">Reactants</text>
                  <text x="235" y="44" fontSize="9" fontWeight="bold" fill="#501325" fontFamily="monospace">Products</text>
                  <text x="145" y="32" fontSize="9" fill="#D97706" fontWeight="bold" fontFamily="monospace">Transition State (Ea)</text>
                </>
              )}
            </svg>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-hairline text-xs font-semibold text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Check className="w-4 h-4 text-ochre" />
              <span>Insert Profile Curve</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
