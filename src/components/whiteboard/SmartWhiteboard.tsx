'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Circle,
  Copy,
  Download,
  Eraser,
  Grid,
  Hand,
  Highlighter,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  Pen,
  Plus,
  Redo2,
  RotateCcw,
  Shapes,
  Sparkles,
  Square,
  Trash2,
  Triangle,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PhenolLogo } from '@/components/brand/PhenolLogo';

// ==============================================================================
// PHENOL ACADEMY — OneNote-Style Smart Whiteboard
// Vector-backed canvas with Select/Marquee, Pen, Highlighter, Eraser, Shapes,
// Text (AR/EN), Symbols, Paper Styles, Multi-page, Undo/Redo, PNG Export,
// and an optional chic corner stamp (Phenol Logo + Instructor + Course).
// ==============================================================================

type Tool =
  | 'select'
  | 'pan'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'text'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'triangle';

type PaperStyle = 'ruled' | 'grid' | 'dotted' | 'blank';
type BoardTheme = 'ivory' | 'white' | 'dark';

interface Point {
  x: number;
  y: number;
}

interface StrokeItem {
  id: string;
  kind: 'stroke';
  points: Point[];
  color: string;
  width: number;
  isHighlighter?: boolean;
}

interface ShapeItem {
  id: string;
  kind: 'shape';
  shape: 'rect' | 'ellipse' | 'line' | 'arrow' | 'triangle';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
}

interface TextItem {
  id: string;
  kind: 'text';
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  bold?: boolean;
}

type BoardItem = StrokeItem | ShapeItem | TextItem;

interface BoardPage {
  id: string;
  title: string;
  items: BoardItem[];
}

interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SmartWhiteboardProps {
  defaultInstructorName?: string;
  courseOptions?: string[];
  backHref?: string;
}

const STORAGE_KEY = 'phenol_smart_whiteboard_v1';

const PEN_COLORS = [
  { name: 'Ink', hex: '#1c1917' },
  { name: 'Burgundy', hex: '#7c1d34' },
  { name: 'Royal Blue', hex: '#1d4ed8' },
  { name: 'Emerald', hex: '#047857' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Violet', hex: '#6d28d9' },
  { name: 'Crimson', hex: '#dc2626' },
  { name: 'White', hex: '#f8fafc' },
];

const HIGHLIGHTER_COLORS = [
  { name: 'Yellow', hex: '#facc15' },
  { name: 'Mint', hex: '#4ade80' },
  { name: 'Sky', hex: '#38bdf8' },
  { name: 'Rose', hex: '#fb7185' },
  { name: 'Lavender', hex: '#c084fc' },
];

const QUICK_SYMBOLS = [
  '→', '←', '↔', '⇌', '↑', '↓',
  'Δ', '±', '≈', '≠', '≤', '≥',
  '∞', 'α', 'β', 'γ', 'π', 'Σ',
  '√', '°', '✓', '✗', '★', '•',
  '∴', '∵', '∈', '⊂',
];

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function measureTextLines(text: string, fontSize: number, bold?: boolean): { w: number; h: number } {
  const lines = (text || ' ').split('\n');
  const maxLen = Math.max(...lines.map((l) => l.length), 1);
  const charW = fontSize * (bold ? 0.62 : 0.58);
  return {
    w: Math.max(24, maxLen * charW + 10),
    h: Math.max(fontSize * 1.4, lines.length * fontSize * 1.35 + 6),
  };
}

function getItemBBox(item: BoardItem): BBox {
  if (item.kind === 'stroke') {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of item.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = Math.max(6, item.width / 2 + 4);
    return {
      x: minX - pad,
      y: minY - pad,
      w: Math.max(12, maxX - minX + pad * 2),
      h: Math.max(12, maxY - minY + pad * 2),
    };
  }
  if (item.kind === 'shape') {
    const minX = Math.min(item.x1, item.x2);
    const minY = Math.min(item.y1, item.y2);
    const maxX = Math.max(item.x1, item.x2);
    const maxY = Math.max(item.y1, item.y2);
    const pad = Math.max(6, item.width / 2 + 4);
    return {
      x: minX - pad,
      y: minY - pad,
      w: Math.max(14, maxX - minX + pad * 2),
      h: Math.max(14, maxY - minY + pad * 2),
    };
  }
  const { w, h } = measureTextLines(item.text, item.fontSize, item.bold);
  return { x: item.x - 4, y: item.y - 4, w: w + 8, h: h + 8 };
}

function boxesIntersect(a: BBox, b: BBox): boolean {
  return a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
}

function pointInBox(p: Point, b: BBox): boolean {
  return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

function distToSegment(p: Point, v: Point, w: Point): number {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function hitTestItem(item: BoardItem, pt: Point, tolerance = 10): boolean {
  const box = getItemBBox(item);
  if (!pointInBox(pt, { x: box.x - tolerance, y: box.y - tolerance, w: box.w + tolerance * 2, h: box.h + tolerance * 2 })) {
    return false;
  }
  if (item.kind === 'stroke') {
    const r = Math.max(tolerance, item.width / 2 + 6);
    if (item.points.length === 1) {
      return Math.hypot(pt.x - item.points[0].x, pt.y - item.points[0].y) <= r;
    }
    for (let i = 1; i < item.points.length; i++) {
      if (distToSegment(pt, item.points[i - 1], item.points[i]) <= r) return true;
    }
    return false;
  }
  return true;
}

function translateItem(item: BoardItem, dx: number, dy: number): BoardItem {
  if (item.kind === 'stroke') {
    return { ...item, points: item.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
  }
  if (item.kind === 'shape') {
    return { ...item, x1: item.x1 + dx, y1: item.y1 + dy, x2: item.x2 + dx, y2: item.y2 + dy };
  }
  return { ...item, x: item.x + dx, y: item.y + dy };
}

function drawItemOnCtx(ctx: CanvasRenderingContext2D, item: BoardItem) {
  ctx.save();
  if (item.kind === 'stroke') {
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = item.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (item.isHighlighter) ctx.globalAlpha = 0.34;
    const pts = item.points;
    if (pts.length === 0) {
      ctx.restore();
      return;
    }
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, item.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = (pts[i].x + pts[i + 1].x) / 2;
      const midY = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (item.kind === 'shape') {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = item.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const { x1, y1, x2, y2 } = item;
    ctx.beginPath();
    if (item.shape === 'rect') {
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    } else if (item.shape === 'ellipse') {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (item.shape === 'line') {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (item.shape === 'arrow') {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = Math.max(12, item.width * 4);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    } else if (item.shape === 'triangle') {
      const midX = (x1 + x2) / 2;
      ctx.moveTo(midX, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x1, y2);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // Text / Symbol
  ctx.fillStyle = item.color;
  ctx.font = `${item.bold ? '700' : '500'} ${item.fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textBaseline = 'top';
  const lines = (item.text || '').split('\n');
  lines.forEach((line, idx) => {
    ctx.fillText(line, item.x, item.y + idx * item.fontSize * 1.35);
  });
  ctx.restore();
}

export const SmartWhiteboard: React.FC<SmartWhiteboardProps> = ({
  defaultInstructorName = 'Dr. Omar Magdi',
  courseOptions = [],
  backHref = '/dashboard',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pages state
  const [pages, setPages] = useState<BoardPage[]>([{ id: 'page-1', title: 'Page 1', items: [] }]);
  const [activePageId, setActivePageId] = useState('page-1');

  // Undo / Redo per session
  const [undoStack, setUndoStack] = useState<BoardItem[][]>([]);
  const [redoStack, setRedoStack] = useState<BoardItem[][]>([]);

  // Tool & style state
  const [tool, setTool] = useState<Tool>('pen');
  const [penColor, setPenColor] = useState('#1c1917');
  const [highlighterColor, setHighlighterColor] = useState('#facc15');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fontSize, setFontSize] = useState(22);
  const [textBold, setTextBold] = useState(false);

  // Board theme & paper
  const [paper, setPaper] = useState<PaperStyle>('ruled');
  const [theme, setTheme] = useState<BoardTheme>('ivory');

  // Viewport pan & zoom
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Corner brand header stamp
  const [showStamp, setShowStamp] = useState(true);
  const [stampCorner, setStampCorner] = useState<'left' | 'right'>('left');
  const [instructorName, setInstructorName] = useState(defaultInstructorName);
  const [courseTitle, setCourseTitle] = useState(courseOptions[0] || '');
  const [showStampEditor, setShowStampEditor] = useState(false);

  // Menus & UI
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [showSymbolsMenu, setShowSymbolsMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selection & inline text editing
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [marquee, setMarquee] = useState<BBox | null>(null);
  const [editingText, setEditingText] = useState<{
    id?: string;
    x: number;
    y: number;
    value: string;
  } | null>(null);

  // Live drawing refs
  const draftItemRef = useRef<BoardItem | null>(null);
  const dragModeRef = useRef<
    | null
    | { type: 'draw' }
    | { type: 'pan'; startScreen: Point; startPan: Point }
    | { type: 'move'; startWorld: Point; lastWorld: Point; snapshot: BoardItem[] }
    | { type: 'marquee'; startWorld: Point }
    | { type: 'erase' }
  >(null);
  const spaceHeldRef = useRef(false);

  // Hydrate saved state from localStorage once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          setPages(parsed.pages);
          setActivePageId(parsed.activePageId || parsed.pages[0].id);
        }
        if (typeof parsed.showStamp === 'boolean') setShowStamp(parsed.showStamp);
        if (parsed.stampCorner === 'left' || parsed.stampCorner === 'right') setStampCorner(parsed.stampCorner);
        if (typeof parsed.instructorName === 'string' && parsed.instructorName) {
          setInstructorName(parsed.instructorName);
        }
        if (typeof parsed.courseTitle === 'string') setCourseTitle(parsed.courseTitle);
        if (parsed.paper) setPaper(parsed.paper);
        if (parsed.theme) setTheme(parsed.theme);
      }
    } catch {
      // ignore corrupted local storage
    }
  }, []);

  useEffect(() => {
    if (defaultInstructorName && !instructorName) {
      setInstructorName(defaultInstructorName);
    }
  }, [defaultInstructorName, instructorName]);

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          pages,
          activePageId,
          showStamp,
          stampCorner,
          instructorName,
          courseTitle,
          paper,
          theme,
        })
      );
    } catch {
      // ignore storage quota
    }
  }, [pages, activePageId, showStamp, stampCorner, instructorName, courseTitle, paper, theme]);

  const activePage = useMemo(
    () => pages.find((p) => p.id === activePageId) || pages[0],
    [pages, activePageId]
  );
  const items = activePage.items;

  const setActiveItems = useCallback(
    (updater: BoardItem[] | ((prev: BoardItem[]) => BoardItem[]), recordUndo = true) => {
      setPages((prevPages) =>
        prevPages.map((p) => {
          if (p.id !== activePage.id) return p;
          const next = typeof updater === 'function' ? updater(p.items) : updater;
          if (recordUndo) {
            setUndoStack((u) => [...u.slice(-39), p.items]);
            setRedoStack([]);
          }
          return { ...p, items: next };
        })
      );
    },
    [activePage.id]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((u) => u.slice(0, -1));
    setRedoStack((r) => [...r, items]);
    setPages((ps) => ps.map((p) => (p.id === activePage.id ? { ...p, items: prev } : p)));
    setSelectedIds([]);
  }, [undoStack, items, activePage.id]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((u) => [...u, items]);
    setPages((ps) => ps.map((p) => (p.id === activePage.id ? { ...p, items: next } : p)));
    setSelectedIds([]);
  }, [redoStack, items, activePage.id]);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const sel = new Set(selectedIds);
    setActiveItems((prev) => prev.filter((it) => !sel.has(it.id)));
    setSelectedIds([]);
  }, [selectedIds, setActiveItems]);

  const duplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const sel = new Set(selectedIds);
    const clones = items
      .filter((it) => sel.has(it.id))
      .map((it) => ({ ...translateItem(it, 24, 24), id: uid() }));
    setActiveItems((prev) => [...prev, ...clones]);
    setSelectedIds(clones.map((c) => c.id));
  }, [selectedIds, items, setActiveItems]);

  const recolorSelected = useCallback(
    (newColor: string) => {
      if (selectedIds.length === 0) return;
      const sel = new Set(selectedIds);
      setActiveItems((prev) =>
        prev.map((it) => (sel.has(it.id) ? { ...it, color: newColor } : it))
      );
    },
    [selectedIds, setActiveItems]
  );

  // Keyboard shortcuts (OneNote / ClickUp style)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (editingText) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (e.code === 'Space') {
        spaceHeldRef.current = true;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setTool('select');
        setSelectedIds(items.map((it) => it.id));
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
        return;
      }
      if (e.key === 'Escape') {
        setSelectedIds([]);
        setShowShapesMenu(false);
        setShowSymbolsMenu(false);
        setShowStampEditor(false);
        return;
      }
      if (!e.ctrlKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'v') setTool('select');
        else if (k === 'p') setTool('pen');
        else if (k === 'h') setTool('highlighter');
        else if (k === 'e') setTool('eraser');
        else if (k === 't') setTool('text');
        else if (k === 'm') setTool('pan');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceHeldRef.current = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [editingText, handleUndo, handleRedo, duplicateSelected, deleteSelected, selectedIds.length, items]);

  // Screen <-> World transforms
  const screenToWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Canvas render loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const targetW = Math.max(1, Math.floor(rect.width * dpr));
    const targetH = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background fill
    const bg =
      theme === 'dark' ? '#171b21' : theme === 'white' ? '#ffffff' : '#faf8f4';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // World transform
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Paper lines / grid / dots in visible world rect
    if (paper !== 'blank') {
      const worldLeft = -pan.x / zoom;
      const worldTop = -pan.y / zoom;
      const worldRight = worldLeft + rect.width / zoom;
      const worldBottom = worldTop + rect.height / zoom;
      const step = 32;
      const startX = Math.floor(worldLeft / step) * step;
      const startY = Math.floor(worldTop / step) * step;

      ctx.strokeStyle =
        theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(100,28,50,0.08)';
      ctx.fillStyle =
        theme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(100,28,50,0.18)';
      ctx.lineWidth = 1 / zoom;

      if (paper === 'ruled') {
        ctx.beginPath();
        for (let y = startY; y <= worldBottom; y += step) {
          ctx.moveTo(worldLeft, y);
          ctx.lineTo(worldRight, y);
        }
        ctx.stroke();
      } else if (paper === 'grid') {
        ctx.beginPath();
        for (let x = startX; x <= worldRight; x += step) {
          ctx.moveTo(x, worldTop);
          ctx.lineTo(x, worldBottom);
        }
        for (let y = startY; y <= worldBottom; y += step) {
          ctx.moveTo(worldLeft, y);
          ctx.lineTo(worldRight, y);
        }
        ctx.stroke();
      } else if (paper === 'dotted') {
        const dotR = 1.25 / zoom;
        for (let x = startX; x <= worldRight; x += step) {
          for (let y = startY; y <= worldBottom; y += step) {
            ctx.beginPath();
            ctx.arc(x, y, dotR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Committed items
    for (const item of items) {
      if (editingText?.id === item.id) continue;
      drawItemOnCtx(ctx, item);
    }

    // Active draft item
    if (draftItemRef.current) {
      drawItemOnCtx(ctx, draftItemRef.current);
    }

    // Selection bounding boxes
    if (selectedIds.length > 0) {
      const selSet = new Set(selectedIds);
      const selectedItems = items.filter((it) => selSet.has(it.id));
      let uMinX = Infinity;
      let uMinY = Infinity;
      let uMaxX = -Infinity;
      let uMaxY = -Infinity;

      ctx.save();
      for (const it of selectedItems) {
        const b = getItemBBox(it);
        if (b.x < uMinX) uMinX = b.x;
        if (b.y < uMinY) uMinY = b.y;
        if (b.x + b.w > uMaxX) uMaxX = b.x + b.w;
        if (b.y + b.h > uMaxY) uMaxY = b.y + b.h;
        if (selectedItems.length > 1) {
          ctx.strokeStyle = 'rgba(124, 29, 52, 0.35)';
          ctx.lineWidth = 1 / zoom;
          ctx.setLineDash([4 / zoom, 3 / zoom]);
          ctx.strokeRect(b.x, b.y, b.w, b.h);
        }
      }

      if (selectedItems.length > 0) {
        const pad = 4 / zoom;
        const bx = uMinX - pad;
        const by = uMinY - pad;
        const bw = uMaxX - uMinX + pad * 2;
        const bh = uMaxY - uMinY + pad * 2;
        ctx.strokeStyle = '#7c1d34';
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([5 / zoom, 4 / zoom]);
        ctx.strokeRect(bx, by, bw, bh);

        // Corner handles
        ctx.setLineDash([]);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#7c1d34';
        const hs = 6 / zoom;
        const corners = [
          [bx, by],
          [bx + bw, by],
          [bx, by + bh],
          [bx + bw, by + bh],
        ];
        for (const [cx, cy] of corners) {
          ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs);
          ctx.strokeRect(cx - hs / 2, cy - hs / 2, hs, hs);
        }
      }
      ctx.restore();
    }

    // Marquee selection box
    if (marquee) {
      ctx.save();
      ctx.fillStyle = 'rgba(124, 29, 52, 0.08)';
      ctx.strokeStyle = '#7c1d34';
      ctx.lineWidth = 1.25 / zoom;
      ctx.setLineDash([5 / zoom, 4 / zoom]);
      ctx.fillRect(marquee.x, marquee.y, marquee.w, marquee.h);
      ctx.strokeRect(marquee.x, marquee.y, marquee.w, marquee.h);
      ctx.restore();
    }

    ctx.restore();
  }, [items, pan, zoom, paper, theme, selectedIds, marquee, editingText]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    const onResize = () => renderCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [renderCanvas]);

  // Commit inline text editor
  const commitEditingText = useCallback(() => {
    if (!editingText) return;
    const trimmed = editingText.value.trimEnd();
    if (editingText.id) {
      if (trimmed.trim() === '') {
        setActiveItems((prev) => prev.filter((it) => it.id !== editingText.id));
      } else {
        setActiveItems((prev) =>
          prev.map((it) =>
            it.id === editingText.id && it.kind === 'text' ? { ...it, text: trimmed } : it
          )
        );
      }
    } else if (trimmed.trim() !== '') {
      const newText: TextItem = {
        id: uid(),
        kind: 'text',
        x: editingText.x,
        y: editingText.y,
        text: trimmed,
        color: penColor,
        fontSize,
        bold: textBold,
      };
      setActiveItems((prev) => [...prev, newText]);
      setSelectedIds([newText.id]);
    }
    setEditingText(null);
  }, [editingText, setActiveItems, penColor, fontSize, textBold]);

  // Pointer handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return;
    setShowShapesMenu(false);
    setShowSymbolsMenu(false);
    setShowStampEditor(false);

    if (editingText) {
      commitEditingText();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const worldPt = screenToWorld(e.clientX, e.clientY);

    // Middle mouse or Space+Drag or Pan tool
    if (e.button === 1 || spaceHeldRef.current || tool === 'pan') {
      dragModeRef.current = {
        type: 'pan',
        startScreen: { x: e.clientX, y: e.clientY },
        startPan: pan,
      };
      return;
    }

    if (tool === 'text') {
      setEditingText({ x: worldPt.x, y: worldPt.y, value: '' });
      return;
    }

    if (tool === 'eraser') {
      dragModeRef.current = { type: 'erase' };
      const hit = [...items].reverse().find((it) => hitTestItem(it, worldPt, 12 / zoom));
      if (hit) {
        setActiveItems((prev) => prev.filter((it) => it.id !== hit.id));
      }
      return;
    }

    if (tool === 'select') {
      const hit = [...items].reverse().find((it) => hitTestItem(it, worldPt, 10 / zoom));
      if (hit) {
        if (e.shiftKey) {
          setSelectedIds((prev) =>
            prev.includes(hit.id) ? prev.filter((id) => id !== hit.id) : [...prev, hit.id]
          );
          return;
        }
        if (!selectedIds.includes(hit.id)) {
          setSelectedIds([hit.id]);
        }
        dragModeRef.current = {
          type: 'move',
          startWorld: worldPt,
          lastWorld: worldPt,
          snapshot: items,
        };
      } else {
        if (!e.shiftKey) setSelectedIds([]);
        dragModeRef.current = { type: 'marquee', startWorld: worldPt };
        setMarquee({ x: worldPt.x, y: worldPt.y, w: 0, h: 0 });
      }
      return;
    }

    if (tool === 'pen' || tool === 'highlighter') {
      const isHi = tool === 'highlighter';
      draftItemRef.current = {
        id: uid(),
        kind: 'stroke',
        points: [worldPt],
        color: isHi ? highlighterColor : penColor,
        width: isHi ? Math.max(18, strokeWidth * 5) : strokeWidth,
        isHighlighter: isHi,
      };
      dragModeRef.current = { type: 'draw' };
      renderCanvas();
      return;
    }

    // Shapes
    draftItemRef.current = {
      id: uid(),
      kind: 'shape',
      shape: tool,
      x1: worldPt.x,
      y1: worldPt.y,
      x2: worldPt.x,
      y2: worldPt.y,
      color: penColor,
      width: strokeWidth,
    };
    dragModeRef.current = { type: 'draw' };
    renderCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const mode = dragModeRef.current;
    if (!mode) return;

    if (mode.type === 'pan') {
      setPan({
        x: mode.startPan.x + (e.clientX - mode.startScreen.x),
        y: mode.startPan.y + (e.clientY - mode.startScreen.y),
      });
      return;
    }

    const worldPt = screenToWorld(e.clientX, e.clientY);

    if (mode.type === 'erase') {
      const hit = [...items].reverse().find((it) => hitTestItem(it, worldPt, 12 / zoom));
      if (hit) {
        setActiveItems((prev) => prev.filter((it) => it.id !== hit.id));
      }
      return;
    }

    if (mode.type === 'move') {
      const dx = worldPt.x - mode.lastWorld.x;
      const dy = worldPt.y - mode.lastWorld.y;
      if (dx === 0 && dy === 0) return;
      mode.lastWorld = worldPt;
      const sel = new Set(selectedIds);
      setPages((ps) =>
        ps.map((p) =>
          p.id === activePage.id
            ? { ...p, items: p.items.map((it) => (sel.has(it.id) ? translateItem(it, dx, dy) : it)) }
            : p
        )
      );
      return;
    }

    if (mode.type === 'marquee') {
      const x = Math.min(mode.startWorld.x, worldPt.x);
      const y = Math.min(mode.startWorld.y, worldPt.y);
      const w = Math.abs(worldPt.x - mode.startWorld.x);
      const h = Math.abs(worldPt.y - mode.startWorld.y);
      const box = { x, y, w, h };
      setMarquee(box);
      const hits = items.filter((it) => boxesIntersect(getItemBBox(it), box)).map((it) => it.id);
      setSelectedIds(hits);
      return;
    }

    if (mode.type === 'draw' && draftItemRef.current) {
      if (draftItemRef.current.kind === 'stroke') {
        const pts = draftItemRef.current.points;
        const last = pts[pts.length - 1];
        if (!last || Math.hypot(worldPt.x - last.x, worldPt.y - last.y) >= 1.5 / zoom) {
          pts.push(worldPt);
        }
      } else if (draftItemRef.current.kind === 'shape') {
        draftItemRef.current.x2 = worldPt.x;
        draftItemRef.current.y2 = worldPt.y;
      }
      renderCanvas();
    }
  };

  const handlePointerUp = () => {
    const mode = dragModeRef.current;
    dragModeRef.current = null;

    if (mode?.type === 'move') {
      // Record single undo step for the whole move if anything actually moved
      const moved = mode.lastWorld.x !== mode.startWorld.x || mode.lastWorld.y !== mode.startWorld.y;
      if (moved) {
        setUndoStack((u) => [...u.slice(-39), mode.snapshot]);
        setRedoStack([]);
      }
    } else if (mode?.type === 'marquee') {
      setMarquee(null);
    } else if (mode?.type === 'draw' && draftItemRef.current) {
      const finished = draftItemRef.current;
      draftItemRef.current = null;
      if (
        finished.kind === 'shape' &&
        Math.hypot(finished.x2 - finished.x1, finished.y2 - finished.y1) < 4
      ) {
        renderCanvas();
        return;
      }
      setActiveItems((prev) => [...prev, finished]);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPt = screenToWorld(e.clientX, e.clientY);
    const hit = [...items]
      .reverse()
      .find((it): it is TextItem => it.kind === 'text' && hitTestItem(it, worldPt, 8 / zoom));
    if (hit) {
      setEditingText({ id: hit.id, x: hit.x, y: hit.y, value: hit.text });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 0) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const nextZoom = Math.min(3, Math.max(0.25, zoom * factor));
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        setPan({
          x: cx - ((cx - pan.x) / zoom) * nextZoom,
          y: cy - ((cy - pan.y) / zoom) * nextZoom,
        });
        setZoom(nextZoom);
      } else {
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    }
  };

  const insertSymbol = (sym: string) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const cx = rect ? (rect.width / 2 - pan.x) / zoom : 200;
    const cy = rect ? (rect.height / 2 - pan.y) / zoom : 200;
    const item: TextItem = {
      id: uid(),
      kind: 'text',
      x: cx - 12,
      y: cy - 16,
      text: sym,
      color: penColor,
      fontSize: Math.max(26, fontSize + 6),
      bold: true,
    };
    setActiveItems((prev) => [...prev, item]);
    setSelectedIds([item.id]);
    setTool('select');
    setShowSymbolsMenu(false);
  };

  const handleThemeSwitch = (nextTheme: BoardTheme) => {
    setTheme(nextTheme);
    if (nextTheme === 'dark' && penColor === '#1c1917') {
      setPenColor('#f8fafc');
    } else if (nextTheme !== 'dark' && penColor === '#f8fafc') {
      setPenColor('#1c1917');
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleExportPng = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = 2;
    const out = document.createElement('canvas');
    out.width = Math.max(800, Math.floor(rect.width * scale));
    out.height = Math.max(500, Math.floor(rect.height * scale));
    const ctx = out.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.drawImage(canvas, 0, 0, rect.width, rect.height);

    // Draw the chic corner stamp onto the exported PNG if enabled
    if (showStamp) {
      const boxW = 270;
      const boxH = 58;
      const pad = 16;
      const bx = stampCorner === 'left' ? pad : rect.width - boxW - pad;
      const by = pad;

      ctx.save();
      ctx.fillStyle = theme === 'dark' ? 'rgba(23,27,33,0.9)' : 'rgba(255,255,255,0.92)';
      ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(124,29,52,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 12);
      ctx.fill();
      ctx.stroke();

      try {
        const img = new Image();
        img.src =
          theme === 'dark' ? '/images/phenol-symbol-gold.png' : '/images/phenol-symbol-burgundy.png';
        await new Promise<void>((res) => {
          img.onload = () => res();
          img.onerror = () => res();
        });
        if (img.naturalWidth > 0) {
          ctx.drawImage(img, bx + 12, by + 13, 32, 32);
        }
      } catch {
        // ignore logo draw error
      }

      ctx.fillStyle = theme === 'dark' ? '#f8fafc' : '#1c1917';
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.fillText(instructorName || 'Instructor', bx + 54, by + 23);

      ctx.fillStyle = theme === 'dark' ? '#cbd5e1' : '#7c1d34';
      ctx.font = '600 10.5px system-ui, sans-serif';
      ctx.fillText(courseTitle || 'PHENOL ACADEMY', bx + 54, by + 40);
      ctx.restore();
    }

    const link = document.createElement('a');
    link.download = `phenol-board-${activePage.title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = out.toDataURL('image/png');
    link.click();
  };

  const addPage = () => {
    const idx = pages.length + 1;
    const np: BoardPage = { id: uid(), title: `Page ${idx}`, items: [] };
    setPages((ps) => [...ps, np]);
    setActivePageId(np.id);
    setSelectedIds([]);
  };

  // Screen coordinates of the active selection toolbar
  const selectionBarPos = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const sel = new Set(selectedIds);
    const chosen = items.filter((it) => sel.has(it.id));
    if (chosen.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    for (const it of chosen) {
      const b = getItemBBox(it);
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
    }
    return {
      left: Math.max(12, minX * zoom + pan.x),
      top: Math.max(12, minY * zoom + pan.y - 46),
    };
  }, [selectedIds, items, zoom, pan]);

  const cursorClass =
    tool === 'pan'
      ? 'cursor-grab active:cursor-grabbing'
      : tool === 'select'
      ? 'cursor-default'
      : tool === 'text'
      ? 'cursor-text'
      : 'cursor-crosshair';

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-screen overflow-hidden bg-ivory-200 text-charcoal-900 select-none font-sans"
    >
      {/* ==================== ONENOTE-STYLE TOP RIBBON ==================== */}
      <header className="border-b border-hairline bg-ivory-100 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-30 shrink-0">
        {/* Left: Back + Brand + Pages */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-hairline bg-white hover:bg-ivory-200 text-xs font-bold text-charcoal-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="h-5 w-px bg-hairline hidden sm:block" />

          {/* OneNote-style quick pages */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[260px] sm:max-w-xs">
            {pages.map((pg) => (
              <button
                key={pg.id}
                type="button"
                onClick={() => {
                  setActivePageId(pg.id);
                  setSelectedIds([]);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border ${
                  pg.id === activePage.id
                    ? 'bg-burgundy-500 text-ivory-100 border-burgundy-500'
                    : 'bg-white text-charcoal-100 border-hairline hover:bg-ivory-200'
                }`}
              >
                {pg.title}
              </button>
            ))}
            <button
              type="button"
              onClick={addPage}
              title="Add Page"
              className="p-1.5 rounded-lg border border-hairline bg-white hover:bg-ivory-200 text-charcoal-900"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Primary Tools */}
        <div className="flex items-center gap-1 bg-white border border-hairline rounded-xl p-1 shadow-quiet flex-wrap">
          <button
            type="button"
            onClick={() => setTool('select')}
            title="Select / Marquee (V)"
            className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              tool === 'select' ? 'bg-burgundy-500 text-ivory-100' : 'text-charcoal-900 hover:bg-ivory-200'
            }`}
          >
            <MousePointer2 className="w-4 h-4" />
            <span className="hidden md:inline font-bold">Select</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('pan')}
            title="Pan Canvas (M or hold Space)"
            className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              tool === 'pan' ? 'bg-burgundy-500 text-ivory-100' : 'text-charcoal-900 hover:bg-ivory-200'
            }`}
          >
            <Hand className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-hairline mx-0.5" />

          <button
            type="button"
            onClick={() => setTool('pen')}
            title="Pen (P)"
            className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              tool === 'pen' ? 'bg-burgundy-500 text-ivory-100' : 'text-charcoal-900 hover:bg-ivory-200'
            }`}
          >
            <Pen className="w-4 h-4" />
            <span className="hidden md:inline font-bold">Pen</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('highlighter')}
            title="Highlighter (H)"
            className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              tool === 'highlighter' ? 'bg-burgundy-500 text-ivory-100' : 'text-charcoal-900 hover:bg-ivory-200'
            }`}
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setTool('eraser')}
            title="Eraser (E)"
            className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              tool === 'eraser' ? 'bg-burgundy-500 text-ivory-100' : 'text-charcoal-900 hover:bg-ivory-200'
            }`}
          >
            <Eraser className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setTool('text')}
            title="Text Box (T)"
            className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors ${
              tool === 'text' ? 'bg-burgundy-500 text-ivory-100' : 'text-charcoal-900 hover:bg-ivory-200'
            }`}
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Shapes Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowShapesMenu((s) => !s);
                setShowSymbolsMenu(false);
              }}
              title="Shapes"
              className={`p-2 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                ['rect', 'ellipse', 'line', 'arrow', 'triangle'].includes(tool)
                  ? 'bg-burgundy-500 text-ivory-100'
                  : 'text-charcoal-900 hover:bg-ivory-200'
              }`}
            >
              <Shapes className="w-4 h-4" />
            </button>
            {showShapesMenu && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-hairline rounded-xl shadow-editorial p-1.5 flex items-center gap-1 z-50">
                {(
                  [
                    ['rect', Square, 'Rectangle'],
                    ['ellipse', Circle, 'Circle / Ellipse'],
                    ['triangle', Triangle, 'Triangle'],
                    ['line', Minus, 'Line'],
                    ['arrow', ArrowRight, 'Arrow'],
                  ] as const
                ).map(([shapeId, Icon, label]) => (
                  <button
                    key={shapeId}
                    type="button"
                    title={label}
                    onClick={() => {
                      setTool(shapeId);
                      setShowShapesMenu(false);
                    }}
                    className={`p-2 rounded-lg hover:bg-ivory-200 ${
                      tool === shapeId ? 'bg-burgundy-50 text-burgundy-700' : 'text-charcoal-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Symbols Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSymbolsMenu((s) => !s);
                setShowShapesMenu(false);
              }}
              title="Insert Symbol"
              className="px-2 py-1.5 rounded-lg text-xs font-mono font-bold text-charcoal-900 hover:bg-ivory-200"
            >
              Δ Ω
            </button>
            {showSymbolsMenu && (
              <div className="absolute top-full left-0 mt-2 w-60 bg-white border border-hairline rounded-xl shadow-editorial p-2.5 grid grid-cols-7 gap-1 z-50">
                {QUICK_SYMBOLS.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => insertSymbol(sym)}
                    className="h-8 rounded-lg hover:bg-burgundy-50 hover:text-burgundy-700 font-mono text-sm font-bold text-charcoal-900 transition-colors"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Color Palette, Width/Font, Stamp, Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Colors */}
          <div className="flex items-center gap-1 bg-white border border-hairline rounded-xl px-2 py-1">
            {(tool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS).map((c) => {
              const active = (tool === 'highlighter' ? highlighterColor : penColor) === c.hex;
              return (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() =>
                    tool === 'highlighter' ? setHighlighterColor(c.hex) : setPenColor(c.hex)
                  }
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    active ? 'scale-125 ring-2 ring-burgundy-500 border-white' : 'border-hairline hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
          </div>

          {/* Stroke Width or Text Size */}
          {tool === 'text' ? (
            <div className="flex items-center gap-1 bg-white border border-hairline rounded-xl px-2 py-1 text-[11px] font-mono">
              {[16, 22, 30, 40].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontSize(sz)}
                  className={`px-1.5 py-0.5 rounded font-bold ${
                    fontSize === sz ? 'bg-burgundy-500 text-white' : 'text-charcoal-900 hover:bg-ivory-200'
                  }`}
                >
                  {sz}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTextBold((b) => !b)}
                className={`px-1.5 py-0.5 rounded font-bold ${
                  textBold ? 'bg-charcoal-900 text-white' : 'text-charcoal-900 hover:bg-ivory-200'
                }`}
              >
                B
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-white border border-hairline rounded-xl px-2 py-1">
              {[2, 4, 7].map((w) => (
                <button
                  key={w}
                  type="button"
                  title={`Stroke ${w}px`}
                  onClick={() => setStrokeWidth(w)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    strokeWidth === w ? 'bg-burgundy-50 text-burgundy-700 ring-1 ring-burgundy-300' : 'hover:bg-ivory-200'
                  }`}
                >
                  <span
                    className="rounded-full bg-charcoal-900 block"
                    style={{ width: w + 3, height: w + 3 }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Undo / Redo / Clear */}
          <div className="flex items-center gap-0.5 bg-white border border-hairline rounded-xl p-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-lg hover:bg-ivory-200 disabled:opacity-35"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded-lg hover:bg-ivory-200 disabled:opacity-35"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (items.length === 0) return;
                setActiveItems([]);
                setSelectedIds([]);
              }}
              disabled={items.length === 0}
              title="Clear Page"
              className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-700 disabled:opacity-35"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Paper & Stamp Settings */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStampEditor((s) => !s)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                showStamp
                  ? 'bg-burgundy-50 border-burgundy-200 text-burgundy-800'
                  : 'bg-white border-hairline text-charcoal-900 hover:bg-ivory-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Header & Paper</span>
            </button>

            {showStampEditor && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-hairline rounded-2xl shadow-editorial p-4 space-y-3 z-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-charcoal-900">Corner Header Stamp</span>
                  <input
                    type="checkbox"
                    checked={showStamp}
                    onChange={(e) => setShowStamp(e.target.checked)}
                    className="accent-burgundy-500"
                  />
                </div>

                {showStamp && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Instructor name"
                      value={instructorName}
                      onChange={(e) => setInstructorName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-ivory-100 border border-hairline rounded-lg focus:outline-none focus:border-burgundy-500"
                    />
                    <input
                      type="text"
                      placeholder="Course name (optional)"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      list="phenol-wb-courses"
                      className="w-full px-2.5 py-1.5 text-xs bg-ivory-100 border border-hairline rounded-lg focus:outline-none focus:border-burgundy-500"
                    />
                    {courseOptions.length > 0 && (
                      <datalist id="phenol-wb-courses">
                        {courseOptions.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-charcoal-100">Corner:</span>
                      <button
                        type="button"
                        onClick={() => setStampCorner('left')}
                        className={`px-2 py-0.5 rounded border font-bold ${
                          stampCorner === 'left'
                            ? 'bg-burgundy-500 text-white border-burgundy-500'
                            : 'bg-ivory-100 border-hairline'
                        }`}
                      >
                        Top Left
                      </button>
                      <button
                        type="button"
                        onClick={() => setStampCorner('right')}
                        className={`px-2 py-0.5 rounded border font-bold ${
                          stampCorner === 'right'
                            ? 'bg-burgundy-500 text-white border-burgundy-500'
                            : 'bg-ivory-100 border-hairline'
                        }`}
                      >
                        Top Right
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-hairline space-y-2">
                  <span className="text-xs font-bold text-charcoal-900 block">Paper Style</span>
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    {(['ruled', 'grid', 'dotted', 'blank'] as PaperStyle[]).map((ps) => (
                      <button
                        key={ps}
                        type="button"
                        onClick={() => setPaper(ps)}
                        className={`py-1 rounded border capitalize font-semibold ${
                          paper === ps
                            ? 'bg-charcoal-900 text-white border-charcoal-900'
                            : 'bg-ivory-100 border-hairline text-charcoal-900'
                        }`}
                      >
                        {ps}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs font-bold text-charcoal-900 block pt-1">Theme</span>
                  <div className="grid grid-cols-3 gap-1 text-[11px]">
                    {(
                      [
                        ['ivory', 'Ivory'],
                        ['white', 'White'],
                        ['dark', 'Chalkboard'],
                      ] as const
                    ).map(([th, label]) => (
                      <button
                        key={th}
                        type="button"
                        onClick={() => handleThemeSwitch(th)}
                        className={`py-1 rounded border font-semibold ${
                          theme === th
                            ? 'bg-burgundy-500 text-white border-burgundy-500'
                            : 'bg-ivory-100 border-hairline text-charcoal-900'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportPng}
            title="Export PNG"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-charcoal-900 hover:bg-black text-ivory-100 text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PNG</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title="Fullscreen"
            className="p-1.5 rounded-xl border border-hairline bg-white hover:bg-ivory-200 text-charcoal-900"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ==================== CANVAS WORKSPACE ==================== */}
      <div className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          className={`w-full h-full touch-none block ${cursorClass}`}
        />

        {/* Chic Branded Corner Header Stamp */}
        {showStamp && (
          <div
            onClick={() => setShowStampEditor(true)}
            title="Click to customize Instructor / Course"
            className={`absolute top-4 ${
              stampCorner === 'left' ? 'left-4' : 'right-4'
            } z-20 flex items-center gap-3 px-3.5 py-2 rounded-xl border shadow-quiet backdrop-blur-sm cursor-pointer transition-opacity hover:opacity-95 ${
              theme === 'dark'
                ? 'bg-[#171b21]/90 border-white/15 text-white'
                : 'bg-white/90 border-burgundy-200/80 text-charcoal-900'
            }`}
          >
            <PhenolLogo
              size={28}
              withText={false}
              variant={theme === 'dark' ? 'gold' : 'burgundy'}
            />
            <div
              className={`h-7 w-px ${theme === 'dark' ? 'bg-white/15' : 'bg-hairline'}`}
            />
            <div className="leading-tight min-w-0">
              <p className="text-xs font-bold font-display truncate max-w-[190px]">
                {instructorName || 'Instructor'}
              </p>
              <p
                className={`text-[10.5px] font-semibold truncate max-w-[190px] ${
                  theme === 'dark' ? 'text-amber-300' : 'text-burgundy-700'
                }`}
              >
                {courseTitle || 'PHENOL ACADEMY'}
              </p>
            </div>
          </div>
        )}

        {/* ClickUp / OneNote-style Floating Selection Bar */}
        {selectionBarPos && selectedIds.length > 0 && !editingText && (
          <div
            style={{ left: selectionBarPos.left, top: selectionBarPos.top }}
            className="absolute z-30 flex items-center gap-1 px-2 py-1 rounded-xl bg-white border border-hairline shadow-editorial"
          >
            <span className="text-[10px] font-mono font-bold text-charcoal-100 px-1">
              {selectedIds.length} selected
            </span>
            {PEN_COLORS.slice(0, 5).map((c) => (
              <button
                key={c.hex}
                type="button"
                title={`Recolor ${c.name}`}
                onClick={() => recolorSelected(c.hex)}
                className="w-4 h-4 rounded-full border border-hairline hover:scale-110 transition-transform"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            <div className="h-4 w-px bg-hairline mx-0.5" />
            <button
              type="button"
              onClick={duplicateSelected}
              title="Duplicate (Ctrl+D)"
              className="p-1 rounded hover:bg-ivory-200 text-charcoal-900"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              title="Delete (Del)"
              className="p-1 rounded hover:bg-red-50 text-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Inline Text Input Overlay */}
        {editingText && (
          <textarea
            autoFocus
            dir="auto"
            rows={2}
            value={editingText.value}
            onChange={(e) => setEditingText((t) => (t ? { ...t, value: e.target.value } : null))}
            onBlur={commitEditingText}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setEditingText(null);
              } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                commitEditingText();
              }
            }}
            style={{
              left: editingText.x * zoom + pan.x,
              top: editingText.y * zoom + pan.y,
              fontSize: fontSize * zoom,
              color: penColor,
              fontWeight: textBold ? 700 : 500,
              minWidth: 160,
            }}
            placeholder="Type here… (Ctrl+Enter)"
            className="absolute z-40 bg-transparent border border-dashed border-burgundy-500 rounded px-1.5 py-0.5 focus:outline-none resize leading-snug"
          />
        )}

        {/* Bottom-Right Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-hairline rounded-xl px-2 py-1 shadow-quiet text-xs font-mono">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.15).toFixed(2)))}
            title="Zoom Out"
            className="p-1 rounded hover:bg-ivory-200"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 font-bold text-charcoal-900">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}
            title="Zoom In"
            className="p-1 rounded hover:bg-ivory-200"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            title="Reset View"
            className="p-1 rounded hover:bg-ivory-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
