'use client';

import React from 'react';
import { MINDMAP_PRESETS, MindMapPreset } from './mindmap-data';
import { X, Network, Sparkles, Plus } from 'lucide-react';

interface MindMapDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: MindMapPreset) => void;
}

export const MindMapDrawer: React.FC<MindMapDrawerProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed left-20 top-20 z-40 w-[380px] max-h-[85vh] flex flex-col bg-ivory-100/98 backdrop-blur-xl rounded-2xl border border-hairline shadow-editorial overflow-hidden animate-in fade-in slide-in-from-left-4 duration-150">
      {/* Header */}
      <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-burgundy-900 text-ivory-100">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-ochre" />
          <div>
            <h3 className="font-serif font-bold text-sm tracking-tight text-ochre">
              Chemistry Mind Map Studio
            </h3>
            <p className="text-[10px] text-ivory-300">Select a mind map template or start blank</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-ivory-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Preset List */}
      <div className="p-3 overflow-y-auto max-h-[60vh] flex flex-col gap-2.5">
        {MINDMAP_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              onSelectPreset(preset);
              onClose();
            }}
            className="p-3 rounded-xl border border-hairline bg-white hover:border-burgundy-900 hover:shadow-xs transition-all text-left flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-ivory-200 border border-hairline flex items-center justify-center text-burgundy-900 group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="w-5 h-5 text-burgundy-900" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-charcoal-900 group-hover:text-burgundy-900 transition-colors">
                {preset.title}
              </h4>
              <p className="text-[11px] text-charcoal-500 mt-0.5 line-clamp-2">
                {preset.description}
              </p>
              <span className="inline-block mt-1.5 text-[9px] font-bold text-burgundy-800 bg-burgundy-50 px-2 py-0.5 rounded-md border border-burgundy-100">
                Click to stamp on canvas
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-2 border-t border-hairline bg-ivory-200/60 flex items-center justify-between text-[10px] text-charcoal-600">
        <span>Click template, then click canvas to place</span>
        <kbd className="px-1.5 py-0.5 bg-white rounded border border-hairline font-mono text-[9px]">
          ESC
        </kbd>
      </div>
    </div>
  );
};
