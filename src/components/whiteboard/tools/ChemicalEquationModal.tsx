'use client';

import React, { useState } from 'react';
import { ChemicalFormulaElement } from '@/types/whiteboard';
import { X, Sparkles, Plus, Check } from 'lucide-react';

interface ChemicalEquationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (formula: Omit<ChemicalFormulaElement, 'id' | 'zIndex'>) => void;
}

export const ChemicalEquationModal: React.FC<ChemicalEquationModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [equation, setEquation] = useState('C6H6 + Cl2 --(FeCl3, dark)--> C6H5Cl + HCl');
  const [subtitle, setSubtitle] = useState('Electrophilic Chlorination of Benzene');
  const [deltaH, setDeltaH] = useState('ΔH° = -105 kJ/mol');
  const [color, setColor] = useState('#18191B');
  const [fontSize, setFontSize] = useState(20);

  if (!isOpen) return null;

  const quickSymbols = [
    '→',
    '⇌',
    'Δ',
    'ΔH°',
    'conc.',
    '(aq)',
    '(s)',
    '(l)',
    '(g)',
    'H₂O',
    'H₂SO₄',
    'HNO₃',
    'FeCl₃',
    '°C',
    'kJ/mol',
    'π',
    'σ',
    '⁺',
    '⁻',
  ];

  const handleAppendSymbol = (sym: string) => {
    setEquation((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + sym + ' ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equation.trim()) return;

    onInsert({
      type: 'formula',
      x: 200,
      y: 250,
      equation: equation.trim(),
      subtitle: subtitle.trim() || undefined,
      deltaH: deltaH.trim() || undefined,
      fontSize,
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-ivory-100 border border-hairline rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-burgundy-100 text-burgundy-900 flex items-center justify-center font-formula font-bold text-sm">
              ⚗️
            </div>
            <div>
              <h3 className="text-lg font-bold text-charcoal-900 font-display">
                Chemical Equation & Reaction Editor
              </h3>
              <p className="text-xs text-charcoal-100 font-sans">
                Type chemical stoichiometry, conditions, and thermodynamics notation
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
          <div>
            <label className="block text-xs font-semibold text-charcoal-900 uppercase tracking-wider mb-1.5">
              Chemical Equation
            </label>
            <textarea
              rows={2}
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              placeholder="e.g. CH3COOH + C2H5OH ⇌ CH3COOC2H5 + H2O"
              className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-ivory-50 text-charcoal-900 text-sm font-formula focus:outline-none focus:ring-2 focus:ring-burgundy-500 shadow-inner"
              required
            />
          </div>

          {/* Quick Chemistry Symbols Palette */}
          <div>
            <span className="block text-[11px] font-semibold text-charcoal-100 mb-1.5 uppercase tracking-wider">
              Quick Notation & Symbols:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickSymbols.map((sym, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAppendSymbol(sym)}
                  className="px-2 py-1 rounded bg-ivory-200 border border-hairline hover:border-burgundy-500 hover:bg-burgundy-50 text-xs font-formula text-charcoal-900 transition-colors"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                Reaction Note / Mechanism Name (Optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Electrophilic Aromatic Substitution"
                className="w-full px-3 py-2 rounded-lg border border-hairline bg-ivory-50 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-900 mb-1">
                Enthalpy / Thermodynamics (Optional)
              </label>
              <input
                type="text"
                value={deltaH}
                onChange={(e) => setDeltaH(e.target.value)}
                placeholder="e.g. ΔH = -890 kJ/mol"
                className="w-full px-3 py-2 rounded-lg border border-hairline bg-ivory-50 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-500 font-formula"
              />
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-3.5 rounded-xl border border-hairline bg-ivory-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-burgundy-500 tracking-widest block">
              Live Preview
            </span>
            <div className="font-formula font-semibold text-sm text-charcoal-900 break-words">
              {equation || 'Equation Preview'}
            </div>
            {subtitle && (
              <div className="text-xs text-charcoal-100 font-serif italic">
                {subtitle}
              </div>
            )}
            {deltaH && (
              <div className="text-xs font-formula text-emerald-700 font-bold">
                {deltaH}
              </div>
            )}
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
              <span>Insert onto Board</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
