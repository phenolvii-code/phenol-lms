'use client';

import React, { useRef } from 'react';
import { ChemicalFormulaElement } from '@/types/whiteboard';
import { Check, X, ArrowRight, ArrowLeftRight, Flame } from 'lucide-react';

interface InlineEquationBarProps {
  element: ChemicalFormulaElement;
  onChange: (updated: Partial<ChemicalFormulaElement>) => void;
  onClose: () => void;
  screenPos: { x: number; y: number };
}

const COMMON_ELEMENTS = ['C', 'H', 'O', 'N', 'Na', 'Cl', 'Br', 'I', 'Fe', 'Cu', 'S', 'Ca', 'K', 'Mg', 'Al'];
const SUBSCRIPTS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
const SUPERSCRIPTS = ['⁺', '²⁺', '³⁺', '⁻', '²⁻', '⁻'];
const STATES = ['(s)', '(l)', '(g)', '(aq)'];
const ARROWS = [
  { label: '→', value: '→' },
  { label: '⇌', value: '⇌' },
  { label: '⇄', value: '⇄' },
];

export const InlineEquationBar: React.FC<InlineEquationBarProps> = ({
  element,
  onChange,
  onClose,
  screenPos,
}) => {
  const activeInputRef = useRef<'reactants' | 'products' | 'conditions' | 'deltaH'>('reactants');
  const reactantsInputRef = useRef<HTMLInputElement>(null);
  const productsInputRef = useRef<HTMLInputElement>(null);
  const conditionsInputRef = useRef<HTMLInputElement>(null);
  const deltaHInputRef = useRef<HTMLInputElement>(null);

  // Parse existing equation into reactants and products if not already split
  const eq = element.equation || '';
  let defaultReactants = element.reactants || '';
  let defaultProducts = element.products || '';
  let arrowSymbol = '→';

  if (!defaultReactants && !defaultProducts) {
    if (eq.includes('⇌')) {
      const parts = eq.split('⇌');
      defaultReactants = parts[0]?.trim() || '';
      defaultProducts = parts[1]?.trim() || '';
      arrowSymbol = '⇌';
    } else if (eq.includes('<=>')) {
      const parts = eq.split('<=>');
      defaultReactants = parts[0]?.trim() || '';
      defaultProducts = parts[1]?.trim() || '';
      arrowSymbol = '⇌';
    } else if (eq.includes('->') || eq.includes('→')) {
      const parts = eq.split(/->|→/);
      defaultReactants = parts[0]?.trim() || '';
      defaultProducts = parts[1]?.trim() || '';
      arrowSymbol = '→';
    } else {
      defaultReactants = eq;
    }
  }

  const handleInsertToken = (token: string) => {
    let inputEl: HTMLInputElement | null = null;
    let fieldKey: 'reactants' | 'products' | 'subtitle' | 'deltaH' = 'reactants';

    if (activeInputRef.current === 'reactants') {
      inputEl = reactantsInputRef.current;
      fieldKey = 'reactants';
    } else if (activeInputRef.current === 'products') {
      inputEl = productsInputRef.current;
      fieldKey = 'products';
    } else if (activeInputRef.current === 'conditions') {
      inputEl = conditionsInputRef.current;
      fieldKey = 'subtitle';
    } else if (activeInputRef.current === 'deltaH') {
      inputEl = deltaHInputRef.current;
      fieldKey = 'deltaH';
    }

    if (!inputEl) return;

    const start = inputEl.selectionStart || inputEl.value.length;
    const end = inputEl.selectionEnd || inputEl.value.length;
    const val = inputEl.value;
    const nextVal = val.slice(0, start) + token + val.slice(end);

    if (fieldKey === 'reactants') {
      const newEquation = `${nextVal} ${arrowSymbol} ${defaultProducts}`.trim();
      onChange({ reactants: nextVal, equation: newEquation });
    } else if (fieldKey === 'products') {
      const newEquation = `${defaultReactants} ${arrowSymbol} ${nextVal}`.trim();
      onChange({ products: nextVal, equation: newEquation });
    } else if (fieldKey === 'subtitle') {
      onChange({ subtitle: nextVal });
    } else if (fieldKey === 'deltaH') {
      onChange({ deltaH: nextVal });
    }

    // Restore focus and cursor position
    setTimeout(() => {
      inputEl?.focus();
      inputEl?.setSelectionRange(start + token.length, start + token.length);
    }, 10);
  };

  const handleArrowChange = (newArrow: string) => {
    const newEquation = `${defaultReactants} ${newArrow} ${defaultProducts}`.trim();
    onChange({ equation: newEquation });
  };

  return (
    <div
      style={{
        left: Math.max(16, Math.min(screenPos.x - 220, window.innerWidth - 460)),
        top: Math.max(70, Math.min(screenPos.y - 120, window.innerHeight - 320)),
      }}
      className="fixed z-50 w-[450px] p-3.5 bg-ivory-100/98 backdrop-blur-xl rounded-2xl border border-hairline shadow-editorial text-xs select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline">
        <div className="flex items-center gap-2">
          <span className="text-base">⚗️</span>
          <span className="font-bold text-burgundy-900 font-serif">Smart In-Canvas Chemical Equation</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-charcoal-400 hover:text-charcoal-800 hover:bg-ivory-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Equation Slots */}
      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-hairline mb-2 shadow-inner">
        {/* Reactants Slot */}
        <input
          ref={reactantsInputRef}
          type="text"
          value={defaultReactants}
          onFocus={() => {
            activeInputRef.current = 'reactants';
          }}
          onChange={(e) => {
            const nextVal = e.target.value;
            const newEq = `${nextVal} ${arrowSymbol} ${defaultProducts}`.trim();
            onChange({ reactants: nextVal, equation: newEq });
          }}
          placeholder="Reactants (e.g. 2H₂ + O₂)"
          className="flex-1 px-2 py-1 font-mono font-bold text-xs text-burgundy-950 bg-ivory-50 rounded-lg border border-transparent focus:border-burgundy-900 focus:bg-white focus:outline-none"
        />

        {/* Reaction Arrow Button */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-0.5 bg-ivory-200 p-0.5 rounded-lg border border-hairline">
            {ARROWS.map((ar) => (
              <button
                key={ar.value}
                type="button"
                onClick={() => handleArrowChange(ar.value)}
                className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors ${
                  arrowSymbol === ar.value ? 'bg-burgundy-900 text-ochre' : 'text-charcoal-700 hover:bg-ivory-300'
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Slot */}
        <input
          ref={productsInputRef}
          type="text"
          value={defaultProducts}
          onFocus={() => {
            activeInputRef.current = 'products';
          }}
          onChange={(e) => {
            const nextVal = e.target.value;
            const newEq = `${defaultReactants} ${arrowSymbol} ${nextVal}`.trim();
            onChange({ products: nextVal, equation: newEq });
          }}
          placeholder="Products (e.g. 2H₂O)"
          className="flex-1 px-2 py-1 font-mono font-bold text-xs text-burgundy-950 bg-ivory-50 rounded-lg border border-transparent focus:border-burgundy-900 focus:bg-white focus:outline-none"
        />
      </div>

      {/* Conditions (Over Arrow) & Delta H */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-[10px] text-charcoal-500 font-bold uppercase mb-0.5 block">
            Conditions (over arrow)
          </label>
          <input
            ref={conditionsInputRef}
            type="text"
            value={element.subtitle || ''}
            onFocus={() => {
              activeInputRef.current = 'conditions';
            }}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="e.g. conc. H₂SO₄, 180°C"
            className="w-full px-2 py-1 text-xs text-charcoal-800 bg-white rounded-lg border border-hairline focus:border-burgundy-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-charcoal-500 font-bold uppercase mb-0.5 block">
            Enthalpy (ΔH)
          </label>
          <input
            ref={deltaHInputRef}
            type="text"
            value={element.deltaH || ''}
            onFocus={() => {
              activeInputRef.current = 'deltaH';
            }}
            onChange={(e) => onChange({ deltaH: e.target.value })}
            placeholder="e.g. ΔH = -890 kJ/mol"
            className="w-full px-2 py-1 text-xs text-charcoal-800 bg-white rounded-lg border border-hairline focus:border-burgundy-900 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Smart Chemistry Keypad */}
      <div className="flex flex-col gap-1.5 p-2 bg-ivory-50 rounded-xl border border-hairline mb-2">
        {/* Row 1: Common Elements */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[9px] text-charcoal-400 font-bold uppercase w-8">Elem:</span>
          {COMMON_ELEMENTS.map((el) => (
            <button
              key={el}
              type="button"
              onClick={() => handleInsertToken(el)}
              className="px-1.5 py-0.5 font-mono font-bold text-[11px] bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline transition-colors shadow-2xs"
            >
              {el}
            </button>
          ))}
        </div>

        {/* Row 2: Subscripts */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-charcoal-400 font-bold uppercase w-8">Sub:</span>
          {SUBSCRIPTS.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => handleInsertToken(sub)}
              className="w-5 h-5 flex items-center justify-center font-mono font-bold text-xs bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline transition-colors shadow-2xs"
            >
              {sub}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleInsertToken('(')}
            className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline"
          >
            (
          </button>
          <button
            type="button"
            onClick={() => handleInsertToken(')')}
            className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline"
          >
            )
          </button>
          <button
            type="button"
            onClick={() => handleInsertToken('+')}
            className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline"
          >
            +
          </button>
        </div>

        {/* Row 3: States & Superscripts */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-charcoal-400 font-bold uppercase w-8">State:</span>
          {STATES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => handleInsertToken(` ${st} `)}
              className="px-1.5 py-0.5 font-mono text-[10px] bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline transition-colors shadow-2xs"
            >
              {st}
            </button>
          ))}
          <div className="h-4 w-px bg-charcoal-200 mx-1" />
          {SUPERSCRIPTS.map((sup) => (
            <button
              key={sup}
              type="button"
              onClick={() => handleInsertToken(sup)}
              className="px-1 py-0.5 font-mono font-bold text-[11px] bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline transition-colors shadow-2xs"
            >
              {sup}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleInsertToken('Δ')}
            className="px-1 py-0.5 font-bold text-[11px] bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline"
          >
            Δ
          </button>
        </div>
      </div>

      {/* Done Button */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-ochre font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Commit to Canvas</span>
        </button>
      </div>
    </div>
  );
};
