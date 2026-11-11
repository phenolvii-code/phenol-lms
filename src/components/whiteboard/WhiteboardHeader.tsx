'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BackgroundPattern, ViewportTransform } from '@/types/whiteboard';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Download,
  FolderOpen,
  CheckCircle2,
  Share2,
  FileImage,
  FileJson,
  FileText,
  Moon,
  Sun,
} from 'lucide-react';

interface WhiteboardHeaderProps {
  title: string;
  onChangeTitle: (newTitle: string) => void;
  viewport: ViewportTransform;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  background: BackgroundPattern;
  onChangeBackground: (bg: BackgroundPattern) => void;
  onOpenBoardsManager: () => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
  isSaving?: boolean;
}

export const WhiteboardHeader: React.FC<WhiteboardHeaderProps> = ({
  title,
  onChangeTitle,
  viewport,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  background,
  onChangeBackground,
  onOpenBoardsManager,
  onExportPNG,
  onExportJSON,
  isSaving,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [exportOpen, setExportOpen] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onChangeTitle(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-ivory-100/98 backdrop-blur-md border-b border-hairline px-4 sm:px-6 flex items-center justify-between shadow-quiet">
      {/* Left: Brand & Return */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-ivory-200 text-xs font-semibold text-charcoal-100 hover:text-charcoal-900 hover:border-burgundy-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <PhenolLogo size={28} subtitle="Whiteboard Studio" />
        </div>

        <div className="h-5 w-px bg-hairline hidden md:block" />

        {/* Editable Title */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="px-2.5 py-1 rounded border border-burgundy-500 bg-ivory-50 text-xs sm:text-sm font-bold text-charcoal-900 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempTitle(title);
                setIsEditingTitle(true);
              }}
              title="Click to rename lecture board"
              className="text-xs sm:text-sm font-bold text-charcoal-900 font-display hover:text-burgundy-500 transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-ivory-200/60 max-w-[200px] sm:max-w-md truncate"
            >
              <span className="truncate">{title}</span>
              <span className="text-[10px] text-charcoal-50 font-normal">✎</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-formula text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>{isSaving ? 'Saving...' : 'IndexedDB Ready'}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Background, Zoom, Boards, Export */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Background Pattern Selector */}
        <div className="flex items-center bg-ivory-200 p-0.5 rounded-lg border border-hairline">
          <button
            type="button"
            onClick={() => onChangeBackground('grid')}
            title="Grid Background"
            className={`px-2 py-1 rounded text-xs font-formula transition-colors ${
              background === 'grid'
                ? 'bg-burgundy-900 text-ivory-100 font-bold'
                : 'text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => onChangeBackground('dots')}
            title="Dotted Background"
            className={`px-2 py-1 rounded text-xs font-formula transition-colors ${
              background === 'dots'
                ? 'bg-burgundy-900 text-ivory-100 font-bold'
                : 'text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            Dots
          </button>
          <button
            type="button"
            onClick={() => onChangeBackground('ivory_blank')}
            title="Blank Paper Background"
            className={`px-2 py-1 rounded text-xs font-formula transition-colors ${
              background === 'ivory_blank'
                ? 'bg-burgundy-900 text-ivory-100 font-bold'
                : 'text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            Blank
          </button>
          <button
            type="button"
            onClick={() => onChangeBackground('dark_chalkboard')}
            title="Dark Chalkboard Mode"
            className={`px-2 py-1 rounded text-xs font-formula transition-colors ${
              background === 'dark_chalkboard'
                ? 'bg-black text-ochre font-bold'
                : 'text-charcoal-100 hover:text-charcoal-900'
            }`}
          >
            Dark
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-ivory-200 p-0.5 rounded-lg border border-hairline">
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out (-)"
            className="p-1 rounded text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-300"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            title="Reset Zoom to 100%"
            className="px-2 text-xs font-formula font-semibold text-charcoal-900 hover:text-burgundy-500"
          >
            {Math.round(viewport.zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In (+)"
            className="p-1 rounded text-charcoal-100 hover:text-charcoal-900 hover:bg-ivory-300"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Boards Manager */}
        <button
          type="button"
          onClick={onOpenBoardsManager}
          title="Open Saved Lecture Boards (IndexedDB)"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline bg-ivory-200 hover:bg-ivory-300 text-xs font-semibold text-charcoal-900 transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5 text-burgundy-500" />
          <span className="hidden sm:inline">My Boards</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-burgundy-900 hover:bg-black text-ivory-100 text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-ochre" />
            <span>Export</span>
          </button>

          {exportOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-ivory-100 border border-hairline rounded-xl shadow-editorial p-1.5 space-y-1 z-50 animate-in fade-in">
              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  onExportPNG();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-charcoal-900 hover:bg-ivory-200 text-left transition-colors"
              >
                <FileImage className="w-4 h-4 text-burgundy-500" />
                <span>Export High-Res PNG</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  onExportJSON();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-charcoal-900 hover:bg-ivory-200 text-left transition-colors"
              >
                <FileJson className="w-4 h-4 text-ochre" />
                <span>Download Board JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
