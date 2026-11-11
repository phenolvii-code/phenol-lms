'use client';

import React, { useState } from 'react';
import { APPARATUS_CATALOG, ApparatusItemInfo } from './apparatus-data';
import { ApparatusIcon } from './ApparatusIcon';
import { X, Beaker, Flame, Wind, Gauge } from 'lucide-react';

interface ApparatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectApparatus: (item: ApparatusItemInfo) => void;
  selectedKind: string | null;
}

export const ApparatusDrawer: React.FC<ApparatusDrawerProps> = ({
  isOpen,
  onClose,
  onSelectApparatus,
  selectedKind,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = [
    { label: 'All', icon: null },
    { label: 'Glassware', icon: Beaker },
    { label: 'Assembly & Heating', icon: Flame },
    { label: 'Gas & Reaction', icon: Wind },
    { label: 'Measurement', icon: Gauge },
  ];

  const filteredItems = APPARATUS_CATALOG.filter((item) => {
    return selectedCategory === 'All' || item.category === selectedCategory;
  });

  return (
    <div className="fixed left-20 top-20 z-40 w-[360px] max-h-[85vh] flex flex-col bg-ivory-100/98 backdrop-blur-xl rounded-2xl border border-hairline shadow-editorial overflow-hidden animate-in fade-in slide-in-from-left-4 duration-150">
      {/* Header */}
      <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-burgundy-900 text-ivory-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧪</span>
          <div>
            <h3 className="font-serif font-bold text-sm tracking-tight text-ochre">
              Lab Glassware & Apparatus
            </h3>
            <p className="text-[10px] text-ivory-300">Click any shape to stamp onto canvas</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-ivory-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1 px-3 py-2 border-b border-hairline overflow-x-auto bg-ivory-50 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              className={`px-2 py-1 text-[10px] font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
                isActive
                  ? 'bg-burgundy-900 text-ochre shadow-xs'
                  : 'text-charcoal-600 hover:bg-ivory-200'
              }`}
            >
              {Icon && <Icon className="w-3 h-3" />}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Visual Shapes Grid (جدول أشكال الأدوات الكيميائية بدون حشو أو نصوص زائدة) */}
      <div className="p-3 overflow-y-auto max-h-[60vh] grid grid-cols-3 gap-2.5">
        {filteredItems.map((item) => {
          const isSelected = selectedKind === item.kind;
          return (
            <button
              key={item.kind}
              onClick={() => {
                onSelectApparatus(item);
                onClose();
              }}
              title={`${item.name} (${item.arabicName})`}
              className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all group hover:scale-[1.03] ${
                isSelected
                  ? 'bg-burgundy-50 border-burgundy-900 ring-2 ring-burgundy-900 shadow-sm'
                  : 'bg-white border-hairline hover:border-burgundy-500 hover:shadow-xs'
              }`}
            >
              {/* Vector SVG Shape Preview */}
              <div className="w-full h-16 flex items-center justify-center text-charcoal-800 group-hover:text-burgundy-900 transition-colors">
                <ApparatusIcon kind={item.kind} className="w-14 h-14" />
              </div>

              {/* Short Minimalist Label */}
              <div className="w-full mt-1.5 pt-1 border-t border-hairline/60">
                <span className="block text-[11px] font-bold text-charcoal-900 truncate">
                  {item.arabicName.split(' ')[0]} {item.arabicName.split(' ')[1] || ''}
                </span>
                <span className="block text-[9px] text-charcoal-400 truncate">
                  {item.name.split('(')[0].trim()}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-hairline bg-ivory-200/60 flex items-center justify-between text-[10px] text-charcoal-600">
        <span>Click shape ➔ click canvas to drop</span>
        <kbd className="px-1.5 py-0.5 bg-white rounded border border-hairline font-mono text-[9px]">
          ESC
        </kbd>
      </div>
    </div>
  );
};
