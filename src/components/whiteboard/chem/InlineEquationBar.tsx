'use client';

import React, { useRef, useState } from 'react';
import { ChemicalFormulaElement } from '@/types/whiteboard';
import { Check, X, Search } from 'lucide-react';

interface InlineEquationBarProps {
  element: ChemicalFormulaElement;
  onChange: (updated: Partial<ChemicalFormulaElement>) => void;
  onClose: () => void;
  screenPos: { x: number; y: number };
}

// Full 118 Elements of the Periodic Table
const ALL_PERIODIC_ELEMENTS = [
  // Period 1
  { sym: 'H', num: 1, name: 'Hydrogen' },
  { sym: 'He', num: 2, name: 'Helium' },
  // Period 2
  { sym: 'Li', num: 3, name: 'Lithium' },
  { sym: 'Be', num: 4, name: 'Beryllium' },
  { sym: 'B', num: 5, name: 'Boron' },
  { sym: 'C', num: 6, name: 'Carbon' },
  { sym: 'N', num: 7, name: 'Nitrogen' },
  { sym: 'O', num: 8, name: 'Oxygen' },
  { sym: 'F', num: 9, name: 'Fluorine' },
  { sym: 'Ne', num: 10, name: 'Neon' },
  // Period 3
  { sym: 'Na', num: 11, name: 'Sodium' },
  { sym: 'Mg', num: 12, name: 'Magnesium' },
  { sym: 'Al', num: 13, name: 'Aluminium' },
  { sym: 'Si', num: 14, name: 'Silicon' },
  { sym: 'P', num: 15, name: 'Phosphorus' },
  { sym: 'S', num: 16, name: 'Sulfur' },
  { sym: 'Cl', num: 17, name: 'Chlorine' },
  { sym: 'Ar', num: 18, name: 'Argon' },
  // Period 4
  { sym: 'K', num: 19, name: 'Potassium' },
  { sym: 'Ca', num: 20, name: 'Calcium' },
  { sym: 'Sc', num: 21, name: 'Scandium' },
  { sym: 'Ti', num: 22, name: 'Titanium' },
  { sym: 'V', num: 23, name: 'Vanadium' },
  { sym: 'Cr', num: 24, name: 'Chromium' },
  { sym: 'Mn', num: 25, name: 'Manganese' },
  { sym: 'Fe', num: 26, name: 'Iron' },
  { sym: 'Co', num: 27, name: 'Cobalt' },
  { sym: 'Ni', num: 28, name: 'Nickel' },
  { sym: 'Cu', num: 29, name: 'Copper' },
  { sym: 'Zn', num: 30, name: 'Zinc' },
  { sym: 'Ga', num: 31, name: 'Gallium' },
  { sym: 'Ge', num: 32, name: 'Germanium' },
  { sym: 'As', num: 33, name: 'Arsenic' },
  { sym: 'Se', num: 34, name: 'Selenium' },
  { sym: 'Br', num: 35, name: 'Bromine' },
  { sym: 'Kr', num: 36, name: 'Krypton' },
  // Period 5
  { sym: 'Rb', num: 37, name: 'Rubidium' },
  { sym: 'Sr', num: 38, name: 'Strontium' },
  { sym: 'Y', num: 39, name: 'Yttrium' },
  { sym: 'Zr', num: 40, name: 'Zirconium' },
  { sym: 'Nb', num: 41, name: 'Niobium' },
  { sym: 'Mo', num: 42, name: 'Molybdenum' },
  { sym: 'Tc', num: 43, name: 'Technetium' },
  { sym: 'Ru', num: 44, name: 'Ruthenium' },
  { sym: 'Rh', num: 45, name: 'Rhodium' },
  { sym: 'Pd', num: 46, name: 'Palladium' },
  { sym: 'Ag', num: 47, name: 'Silver' },
  { sym: 'Cd', num: 48, name: 'Cadmium' },
  { sym: 'In', num: 49, name: 'Indium' },
  { sym: 'Sn', num: 50, name: 'Tin' },
  { sym: 'Sb', num: 51, name: 'Antimony' },
  { sym: 'Te', num: 52, name: 'Tellurium' },
  { sym: 'I', num: 53, name: 'Iodine' },
  { sym: 'Xe', num: 54, name: 'Xenon' },
  // Period 6
  { sym: 'Cs', num: 55, name: 'Caesium' },
  { sym: 'Ba', num: 56, name: 'Barium' },
  { sym: 'La', num: 57, name: 'Lanthanum' },
  { sym: 'Ce', num: 58, name: 'Cerium' },
  { sym: 'Pr', num: 59, name: 'Praseodymium' },
  { sym: 'Nd', num: 60, name: 'Neodymium' },
  { sym: 'Pm', num: 61, name: 'Promethium' },
  { sym: 'Sm', num: 62, name: 'Samarium' },
  { sym: 'Eu', num: 63, name: 'Europium' },
  { sym: 'Gd', num: 64, name: 'Gadolinium' },
  { sym: 'Tb', num: 65, name: 'Terbium' },
  { sym: 'Dy', num: 66, name: 'Dysprosium' },
  { sym: 'Ho', num: 67, name: 'Holmium' },
  { sym: 'Er', num: 68, name: 'Erbium' },
  { sym: 'Tm', num: 69, name: 'Thulium' },
  { sym: 'Yb', num: 70, name: 'Ytterbium' },
  { sym: 'Lu', num: 71, name: 'Lutetium' },
  { sym: 'Hf', num: 72, name: 'Hafnium' },
  { sym: 'Ta', num: 73, name: 'Tantalum' },
  { sym: 'W', num: 74, name: 'Tungsten' },
  { sym: 'Re', num: 75, name: 'Rhenium' },
  { sym: 'Os', num: 76, name: 'Osmium' },
  { sym: 'Ir', num: 77, name: 'Iridium' },
  { sym: 'Pt', num: 78, name: 'Platinum' },
  { sym: 'Au', num: 79, name: 'Gold' },
  { sym: 'Hg', num: 80, name: 'Mercury' },
  { sym: 'Tl', num: 81, name: 'Thallium' },
  { sym: 'Pb', num: 82, name: 'Lead' },
  { sym: 'Bi', num: 83, name: 'Bismuth' },
  { sym: 'Po', num: 84, name: 'Polonium' },
  { sym: 'At', num: 85, name: 'Astatine' },
  { sym: 'Rn', num: 86, name: 'Radon' },
  // Period 7
  { sym: 'Fr', num: 87, name: 'Francium' },
  { sym: 'Ra', num: 88, name: 'Radium' },
  { sym: 'Ac', num: 89, name: 'Actinium' },
  { sym: 'Th', num: 90, name: 'Thorium' },
  { sym: 'Pa', num: 91, name: 'Protactinium' },
  { sym: 'U', num: 92, name: 'Uranium' },
  { sym: 'Np', num: 93, name: 'Neptunium' },
  { sym: 'Pu', num: 94, name: 'Plutonium' },
];

const COMMON_ELEMENTS = [
  'H', 'C', 'N', 'O', 'Na', 'Mg', 'Al', 'Si', 'P', 'S',
  'Cl', 'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co',
  'Ni', 'Cu', 'Zn', 'Br', 'Ag', 'Ba', 'Pt', 'Au', 'Hg', 'Pb', 'I'
];

const STOICHIOMETRIC_NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '½', '¼'];
const SUBSCRIPTS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
const SUPERSCRIPTS = ['⁺', '²⁺', '³⁺', '⁻', '²⁻', '³⁻'];
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
  const [activeTab, setActiveTab] = useState<'common' | 'periodic'>('common');
  const [elementSearch, setElementSearch] = useState('');

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

    setTimeout(() => {
      inputEl?.focus();
      inputEl?.setSelectionRange(start + token.length, start + token.length);
    }, 10);
  };

  const handleArrowChange = (newArrow: string) => {
    const newEquation = `${defaultReactants} ${newArrow} ${defaultProducts}`.trim();
    onChange({ equation: newEquation });
  };

  const filteredPeriodic = ALL_PERIODIC_ELEMENTS.filter(
    (el) =>
      elementSearch.trim() === '' ||
      el.sym.toLowerCase().includes(elementSearch.toLowerCase()) ||
      el.name.toLowerCase().includes(elementSearch.toLowerCase()) ||
      String(el.num) === elementSearch.trim()
  );

  return (
    <div
      style={{
        left: Math.max(16, Math.min(screenPos.x - 240, window.innerWidth - 500)),
        top: Math.max(70, Math.min(screenPos.y - 140, window.innerHeight - 380)),
      }}
      className="fixed z-50 w-[490px] p-3.5 bg-ivory-100/98 backdrop-blur-xl rounded-2xl border border-hairline shadow-editorial text-xs select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline">
        <div className="flex items-center gap-2">
          <span className="text-base">⚗️</span>
          <span className="font-bold text-burgundy-900 font-serif">Chemical Equation & Stoichiometry</span>
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
          placeholder="Reactants (e.g. 2CH₃COOH + CaCO₃)"
          className="flex-1 px-2 py-1 font-mono font-bold text-xs text-burgundy-950 bg-ivory-50 rounded-lg border border-transparent focus:border-burgundy-900 focus:bg-white focus:outline-none"
        />

        {/* Reaction Arrow Selector */}
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
          placeholder="Products (e.g. (CH₃COO)₂Ca + H₂O + CO₂↑)"
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
            placeholder="e.g. conc. H₂SO₄, 180°C / Δ"
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

      {/* Smart Keypad - Section 1: Stoichiometric Numbers (عدد المولات) & Subscripts */}
      <div className="flex flex-col gap-1.5 p-2 bg-ivory-50 rounded-xl border border-hairline mb-2">
        {/* Row 1: Stoichiometric Coefficients / Moles Numbers */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-burgundy-800 font-bold uppercase w-16 shrink-0">
            Moles / Coeff:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {STOICHIOMETRIC_NUMBERS.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleInsertToken(num)}
                className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-white text-burgundy-900 hover:bg-burgundy-900 hover:text-ochre rounded-lg border border-hairline transition-colors shadow-2xs"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleInsertToken(' + ')}
              className="px-1.5 h-6 flex items-center justify-center font-bold text-xs bg-white text-charcoal-800 hover:bg-burgundy-900 hover:text-ochre rounded-lg border border-hairline"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => handleInsertToken('(')}
              className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-white hover:bg-burgundy-900 hover:text-ochre rounded-lg border border-hairline"
            >
              (
            </button>
            <button
              type="button"
              onClick={() => handleInsertToken(')')}
              className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-white hover:bg-burgundy-900 hover:text-ochre rounded-lg border border-hairline"
            >
              )
            </button>
          </div>
        </div>

        {/* Row 2: Subscripts & Superscripts */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-charcoal-500 font-bold uppercase w-16 shrink-0">
            Sub / Charge:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {SUBSCRIPTS.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => handleInsertToken(sub)}
                className="w-5 h-5 flex items-center justify-center font-mono font-bold text-xs bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline"
              >
                {sub}
              </button>
            ))}
            <div className="h-4 w-px bg-charcoal-200 mx-0.5" />
            {SUPERSCRIPTS.map((sup) => (
              <button
                key={sup}
                type="button"
                onClick={() => handleInsertToken(sup)}
                className="px-1 h-5 flex items-center justify-center font-mono font-bold text-xs bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline"
              >
                {sup}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Physical States & Symbols */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-charcoal-500 font-bold uppercase w-16 shrink-0">
            State / Gas:
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {STATES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleInsertToken(` ${st}`)}
                className="px-1.5 py-0.5 font-mono text-[10px] bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline"
              >
                {st}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleInsertToken('↑')}
              title="Gas evolution"
              className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => handleInsertToken('↓')}
              title="Precipitate"
              className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => handleInsertToken('Δ')}
              title="Heat"
              className="w-5 h-5 flex items-center justify-center font-bold text-xs bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline"
            >
              Δ
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Chemical Elements Selector (Common vs Full Periodic Table) */}
      <div className="flex flex-col gap-1 p-2 bg-white rounded-xl border border-hairline mb-2">
        <div className="flex items-center justify-between border-b border-hairline pb-1 mb-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('common')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                activeTab === 'common'
                  ? 'bg-burgundy-900 text-ochre'
                  : 'text-charcoal-600 hover:bg-ivory-100'
              }`}
            >
              Common Elements ({COMMON_ELEMENTS.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('periodic')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                activeTab === 'periodic'
                  ? 'bg-burgundy-900 text-ochre'
                  : 'text-charcoal-600 hover:bg-ivory-100'
              }`}
            >
              Full Periodic Table ({ALL_PERIODIC_ELEMENTS.length})
            </button>
          </div>

          {activeTab === 'periodic' && (
            <div className="relative">
              <Search className="w-3 h-3 absolute left-1.5 top-1.5 text-charcoal-400" />
              <input
                type="text"
                value={elementSearch}
                onChange={(e) => setElementSearch(e.target.value)}
                placeholder="Search element..."
                className="w-28 pl-5 pr-1.5 py-0.5 text-[10px] rounded border border-hairline bg-ivory-50 focus:outline-none focus:bg-white"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Common Elements Grid */}
        {activeTab === 'common' ? (
          <div className="flex items-center gap-1 flex-wrap max-h-20 overflow-y-auto">
            {COMMON_ELEMENTS.map((el) => (
              <button
                key={el}
                type="button"
                onClick={() => handleInsertToken(el)}
                className="w-7 h-6 font-mono font-bold text-xs bg-ivory-50 hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline transition-colors shadow-2xs"
              >
                {el}
              </button>
            ))}
          </div>
        ) : (
          /* Tab 2: Full Periodic Table Grid */
          <div className="grid grid-cols-8 gap-1 max-h-36 overflow-y-auto p-1 bg-ivory-50/60 rounded-lg">
            {filteredPeriodic.map((el) => (
              <button
                key={el.sym}
                type="button"
                onClick={() => handleInsertToken(el.sym)}
                title={`${el.name} (#${el.num})`}
                className="p-1 flex flex-col items-center justify-center bg-white hover:bg-burgundy-900 hover:text-ochre rounded border border-hairline transition-colors shadow-2xs group"
              >
                <span className="font-mono font-bold text-xs leading-none group-hover:text-ochre">
                  {el.sym}
                </span>
                <span className="text-[8px] text-charcoal-400 leading-none group-hover:text-ivory-200 mt-0.5">
                  {el.num}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Done Button */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-hairline">
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
