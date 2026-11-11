'use client';

import React, { useState } from 'react';
import { APPARATUS_CATALOG, ApparatusItemInfo } from './apparatus-data';
import { X, Search, Beaker, Flame, Wind, Gauge } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = [
    { label: 'All', icon: null },
    { label: 'Glassware', icon: Beaker },
    { label: 'Assembly & Heating', icon: Flame },
    { label: 'Gas & Reaction', icon: Wind },
    { label: 'Measurement', icon: Gauge },
  ];

  const filteredItems = APPARATUS_CATALOG.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.arabicName.includes(searchQuery) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed left-20 top-20 z-40 w-96 max-h-[85vh] flex flex-col bg-ivory-100/98 backdrop-blur-xl rounded-2xl border border-hairline shadow-editorial overflow-hidden animate-in fade-in slide-in-from-left-4 duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-burgundy-900 text-ivory-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚗️</span>
          <div>
            <h3 className="font-serif font-bold text-sm tracking-tight text-ochre">
              Chemistry Laboratory Library
            </h3>
            <p className="text-[11px] text-ivory-300">Select apparatus to stamp directly on canvas</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-ivory-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-hairline bg-ivory-50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-charcoal-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apparatus (e.g. burette, beaker, بنزن)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-hairline bg-white focus:outline-none focus:ring-1 focus:ring-burgundy-900"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1 px-3 py-2 border-b border-hairline overflow-x-auto bg-ivory-100 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
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

      {/* Apparatus Cards List */}
      <div className="p-3 overflow-y-auto max-h-[58vh] flex flex-col gap-2">
        {filteredItems.map((item) => {
          const isSelected = selectedKind === item.kind;
          return (
            <button
              key={item.kind}
              onClick={() => {
                onSelectApparatus(item);
                onClose();
              }}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all hover:border-burgundy-500 hover:shadow-xs group ${
                isSelected
                  ? 'bg-burgundy-50/70 border-burgundy-900 ring-1 ring-burgundy-900'
                  : 'bg-white border-hairline hover:bg-ivory-50'
              }`}
            >
              {/* Miniature Icon Badge */}
              <div className="w-10 h-10 rounded-lg bg-ivory-200 border border-hairline flex items-center justify-center shrink-0 text-base group-hover:scale-105 transition-transform">
                {item.category === 'Glassware' ? '🧪' : item.category === 'Assembly & Heating' ? '🔥' : item.category === 'Gas & Reaction' ? '💨' : '📏'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-charcoal-900 truncate font-sans">
                    {item.name}
                  </h4>
                  <span className="text-[10px] font-medium text-burgundy-700 font-sans px-1.5 py-0.5 rounded bg-burgundy-50 border border-burgundy-100">
                    {item.arabicName}
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-500 line-clamp-1 mt-0.5">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-charcoal-400">
                  <span className="px-1.5 py-0.2 rounded bg-ivory-200 text-charcoal-700">
                    {item.width} × {item.height} px
                  </span>
                  {item.defaultLiquidColor && (
                    <span className="flex items-center gap-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block border border-black/10"
                        style={{ backgroundColor: item.defaultLiquidColor }}
                      />
                      Solution
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="py-8 text-center text-xs text-charcoal-400">
            No apparatus matching your search.
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-hairline bg-ivory-200/60 flex items-center justify-between text-[11px] text-charcoal-600">
        <span>Click item, then click canvas to place</span>
        <kbd className="px-1.5 py-0.5 bg-white rounded border border-hairline font-mono text-[10px]">
          ESC to cancel
        </kbd>
      </div>
    </div>
  );
};
