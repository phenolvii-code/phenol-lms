'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import getStroke from 'perfect-freehand';
import {
  WhiteboardDocument,
  WhiteboardElement,
  WhiteboardTool,
  ShapeKind,
  BackgroundPattern,
  ViewportTransform,
  Point2D,
  StrokeElement,
  ShapeElement,
  TextElement,
  TableElement,
  ChemicalFormulaElement,
  MoleculeElement,
  ApparatusElement,
  ApparatusKind,
  ChemAtom,
  ChemBond,
  EnergyDiagramElement,
  MindMapElement,
} from '@/types/whiteboard';
import {
  saveBoardToStorage,
  loadBoardFromStorage,
  createDefaultChemistryBoard,
} from '@/lib/whiteboard-storage';
import { WhiteboardHeader } from './WhiteboardHeader';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { ApparatusDrawer } from './apparatus/ApparatusDrawer';
import { ApparatusItemInfo } from './apparatus/apparatus-data';
import { renderApparatus } from './apparatus/render-apparatus';
import {
  ChemDrawToolbar,
  ChemSubTool,
  ChemElementSymbol,
} from './chem/ChemDrawToolbar';
import {
  calculateNextZigzagPos,
  createBenzeneRing,
  createAromaticCircleBenzene,
  createCyclohexaneRing,
  createCyclopentaneRing,
} from './chem/chem-geometry';
import { InlineEquationBar } from './chem/InlineEquationBar';
import { ShapeSelectorPopup } from './tools/ShapeSelectorPopup';
import { MindMapDrawer } from './mindmap/MindMapDrawer';
import { renderMindMap } from './mindmap/render-mindmap';
import { MindMapPreset } from './mindmap/mindmap-data';
import {
  getElementBounds,
  hitTestElement,
  drawSelectionBox,
} from './tools/selection-bounds';
import { TableBuilderModal } from './tools/TableBuilderModal';
import { EnergyDiagramModal } from './tools/EnergyDiagramModal';
import { BoardsManagerModal } from './tools/BoardsManagerModal';
import { Trash2, Copy, Lock, Unlock } from 'lucide-react';

interface ActiveStamp {
  type:
    | 'apparatus'
    | 'equation'
    | 'ring_benzene'
    | 'ring_aromatic_circle'
    | 'ring_cyclohexane'
    | 'ring_cyclopentane'
    | 'mindmap';
  kind?: ApparatusKind;
  name?: string;
  width?: number;
  height?: number;
  liquidColor?: string;
  liquidLevel?: number;
  preset?: MindMapPreset;
}

export const PhenolWhiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Board Document State
  const [board, setBoard] = useState<WhiteboardDocument>(() => createDefaultChemistryBoard());
  const [elements, setElements] = useState<WhiteboardElement[]>(board.elements);
  const [viewport, setViewport] = useState<ViewportTransform>(board.viewport);
  const [background, setBackground] = useState<BackgroundPattern>(board.background);

  // Tool & Inking States
  const [tool, setTool] = useState<WhiteboardTool>('pen');
  const [color, setColor] = useState<string>('#501325'); // Phenol burgundy
  const [size, setSize] = useState<number>(4);
  const [shapeKind, setShapeKind] = useState<ShapeKind>('rectangle');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Shapes & Arrows Popup
  const [isShapePopupOpen, setIsShapePopupOpen] = useState(false);

  // Mini-ChemDraw Studio State
  const [isChemDrawActive, setIsChemDrawActive] = useState<boolean>(false);
  const [activeChemSubTool, setActiveChemSubTool] = useState<ChemSubTool>('zigzag_chain');
  const [activeChemElement, setActiveChemElement] = useState<ChemElementSymbol>('C');
  const [isLewisMode, setIsLewisMode] = useState<boolean>(false);
  const [hoveredChemTarget, setHoveredChemTarget] = useState<{
    moleculeId: string;
    type: 'atom' | 'bond';
    id: string;
  } | null>(null);

  // Apparatus Library State
  const [isApparatusDrawerOpen, setIsApparatusDrawerOpen] = useState<boolean>(false);

  // Mind Map Studio State
  const [isMindMapDrawerOpen, setIsMindMapDrawerOpen] = useState<boolean>(false);

  // In-Place Text Editing (Miro Style - no window.prompt)
  const [inlineTextEditor, setInlineTextEditor] = useState<{
    id?: string;
    x: number;
    y: number;
    screenX: number;
    screenY: number;
    text: string;
  } | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Cursor Ghost Stamp State (يحول السهم للحاجة اللي بضيفها ولما اضغط يضغط)
  const [activeStamp, setActiveStamp] = useState<ActiveStamp | null>(null);
  const cursorPosRef = useRef<{ x: number; y: number; screenX: number; screenY: number }>({
    x: 0,
    y: 0,
    screenX: 0,
    screenY: 0,
  });

  // In-Canvas Smart Equation State
  const [editingEquation, setEditingEquation] = useState<ChemicalFormulaElement | null>(null);
  const [equationScreenPos, setEquationScreenPos] = useState<{ x: number; y: number }>({
    x: 300,
    y: 200,
  });

  // Undo / Redo History Stacks
  const [history, setHistory] = useState<WhiteboardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardElement[][]>([]);

  // Other Modals Visibility
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);
  const [isBoardsManagerOpen, setIsBoardsManagerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pointer Interaction Tracking
  const isPointerDownRef = useRef(false);
  const isPanningRef = useRef(false);
  const isDrawingShapeRef = useRef(false);
  const shapeStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPointsRef = useRef<Point2D[]>([]);
  const startCanvasPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startScreenPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedElementRef = useRef<{
    elementId: string;
    origX: number;
    origY: number;
    startPoint: { x: number; y: number };
  } | null>(null);

  // Auto-save to IndexedDB with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSaving(true);
      const updatedDoc: WhiteboardDocument = {
        ...board,
        elements,
        viewport,
        background,
      };
      saveBoardToStorage(updatedDoc).finally(() => {
        setIsSaving(false);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [board, elements, viewport, background]);

  // Coordinate conversion helper: Screen PX -> Canvas World Space
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      return {
        x: (screenX - viewport.x) / viewport.zoom,
        y: (screenY - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Coordinate conversion helper: Canvas World Space -> Screen PX
  const canvasToScreen = useCallback(
    (worldX: number, worldY: number): { x: number; y: number } => {
      return {
        x: worldX * viewport.zoom + viewport.x,
        y: worldY * viewport.zoom + viewport.y,
      };
    },
    [viewport]
  );

  // Record undo checkpoint
  const pushHistory = useCallback(
    (newElements: WhiteboardElement[]) => {
      setHistory((prev) => [...prev.slice(-30), elements]);
      setRedoStack([]);
      setElements(newElements);
    },
    [elements]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [...prev, elements]);
    setHistory((prev) => prev.slice(0, -1));
    setElements(previous);
  }, [history, elements]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, elements]);
    setRedoStack((prev) => prev.slice(0, -1));
    setElements(next);
  }, [redoStack, elements]);

  // Keyboard Shortcuts (Undo, Redo, Delete, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'Escape') {
        if (activeStamp) setActiveStamp(null);
        if (isChemDrawActive) setIsChemDrawActive(false);
        if (editingEquation) setEditingEquation(null);
        if (isApparatusDrawerOpen) setIsApparatusDrawerOpen(false);
        if (isMindMapDrawerOpen) setIsMindMapDrawerOpen(false);
        if (isShapePopupOpen) setIsShapePopupOpen(false);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault();
          pushHistory(elements.filter((el) => el.id !== selectedElementId));
          setSelectedElementId(null);
          setEditingEquation(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    pushHistory,
    selectedElementId,
    elements,
    activeStamp,
    isChemDrawActive,
    editingEquation,
    isApparatusDrawerOpen,
    isMindMapDrawerOpen,
    isShapePopupOpen,
  ]);

  // Main Canvas Rendering Loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Draw Background
    const isDark = background.startsWith('dark');
    ctx.fillStyle = isDark ? '#141416' : '#FAF8F5';
    ctx.fillRect(0, 0, width, height);

    // Background Matrix (Grid or Dots)
    if (background.includes('grid') || background.includes('dots')) {
      const gridSize = 40 * viewport.zoom;
      const offsetX = viewport.x % gridSize;
      const offsetY = viewport.y % gridSize;

      ctx.save();
      if (background.includes('grid')) {
        ctx.strokeStyle = isDark ? '#262629' : '#EAE6DD';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = offsetX; x < width; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = offsetY; y < height; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      } else if (background.includes('dots')) {
        ctx.fillStyle = isDark ? '#38383C' : '#D1CDC4';
        for (let x = offsetX; x < width; x += gridSize) {
          for (let y = offsetY; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5 * Math.min(viewport.zoom, 1.5), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    // 2. Apply World Transform
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // 3. Render Elements
    elements.forEach((el) => {
      ctx.save();
      const isSelected = el.id === selectedElementId;

      switch (el.type) {
        case 'stroke': {
          const stroke = el as StrokeElement;
          const outlinePoints = getStroke(stroke.points, {
            size: stroke.size,
            thinning: stroke.isHighlighter ? 0 : 0.4,
            smoothing: 0.5,
            streamline: 0.5,
          });

          if (outlinePoints.length > 0) {
            ctx.fillStyle = stroke.color;
            if (stroke.isHighlighter) {
              ctx.globalAlpha = 0.35;
            }
            ctx.beginPath();
            ctx.moveTo(outlinePoints[0][0], outlinePoints[0][1]);
            for (let i = 1; i < outlinePoints.length; i++) {
              ctx.lineTo(outlinePoints[i][0], outlinePoints[i][1]);
            }
            ctx.closePath();
            ctx.fill();
          }
          break;
        }

        case 'shape': {
          const sh = el as ShapeElement;
          ctx.strokeStyle = sh.strokeColor || '#501325';
          ctx.lineWidth = sh.strokeWidth || 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (sh.fillColor) ctx.fillStyle = sh.fillColor;

          if (sh.shapeKind === 'rectangle') {
            ctx.strokeRect(sh.x, sh.y, sh.width, sh.height);
            if (sh.fillColor) ctx.fillRect(sh.x, sh.y, sh.width, sh.height);
          } else if (sh.shapeKind === 'rounded_rectangle') {
            const r = 12;
            ctx.beginPath();
            ctx.moveTo(sh.x + r, sh.y);
            ctx.lineTo(sh.x + sh.width - r, sh.y);
            ctx.quadraticCurveTo(sh.x + sh.width, sh.y, sh.x + sh.width, sh.y + r);
            ctx.lineTo(sh.x + sh.width, sh.y + sh.height - r);
            ctx.quadraticCurveTo(sh.x + sh.width, sh.y + sh.height, sh.x + sh.width - r, sh.y + sh.height);
            ctx.lineTo(sh.x + r, sh.y + sh.height);
            ctx.quadraticCurveTo(sh.x, sh.y + sh.height, sh.x, sh.y + sh.height - r);
            ctx.lineTo(sh.x, sh.y + r);
            ctx.quadraticCurveTo(sh.x, sh.y, sh.x + r, sh.y);
            ctx.closePath();
            ctx.stroke();
            if (sh.fillColor) ctx.fill();
          } else if (sh.shapeKind === 'ellipse') {
            ctx.beginPath();
            ctx.ellipse(
              sh.x + sh.width / 2,
              sh.y + sh.height / 2,
              Math.abs(sh.width / 2),
              Math.abs(sh.height / 2),
              0,
              0,
              Math.PI * 2
            );
            ctx.stroke();
            if (sh.fillColor) ctx.fill();
          } else if (sh.shapeKind === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(sh.x + sh.width / 2, sh.y);
            ctx.lineTo(sh.x + sh.width, sh.y + sh.height);
            ctx.lineTo(sh.x, sh.y + sh.height);
            ctx.closePath();
            ctx.stroke();
            if (sh.fillColor) ctx.fill();
          } else if (sh.shapeKind === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(sh.x + sh.width / 2, sh.y);
            ctx.lineTo(sh.x + sh.width, sh.y + sh.height / 2);
            ctx.lineTo(sh.x + sh.width / 2, sh.y + sh.height);
            ctx.lineTo(sh.x, sh.y + sh.height / 2);
            ctx.closePath();
            ctx.stroke();
            if (sh.fillColor) ctx.fill();
          } else if (sh.shapeKind === 'line' && sh.endX !== undefined && sh.endY !== undefined) {
            ctx.beginPath();
            ctx.moveTo(sh.x, sh.y);
            ctx.lineTo(sh.endX, sh.endY);
            ctx.stroke();
          } else if (sh.shapeKind === 'arrow' && sh.endX !== undefined && sh.endY !== undefined) {
            ctx.beginPath();
            ctx.moveTo(sh.x, sh.y);
            ctx.lineTo(sh.endX, sh.endY);
            ctx.stroke();

            // Arrow head
            const angle = Math.atan2(sh.endY - sh.y, sh.endX - sh.x);
            const headlen = 16;
            ctx.beginPath();
            ctx.moveTo(sh.endX, sh.endY);
            ctx.lineTo(
              sh.endX - headlen * Math.cos(angle - Math.PI / 6),
              sh.endY - headlen * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              sh.endX - headlen * Math.cos(angle + Math.PI / 6),
              sh.endY - headlen * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = sh.strokeColor;
            ctx.fill();
          } else if (sh.shapeKind === 'double_headed_arrow' && sh.endX !== undefined && sh.endY !== undefined) {
            ctx.beginPath();
            ctx.moveTo(sh.x, sh.y);
            ctx.lineTo(sh.endX, sh.endY);
            ctx.stroke();

            const angle = Math.atan2(sh.endY - sh.y, sh.endX - sh.x);
            const headlen = 14;
            // End head
            ctx.beginPath();
            ctx.moveTo(sh.endX, sh.endY);
            ctx.lineTo(
              sh.endX - headlen * Math.cos(angle - Math.PI / 6),
              sh.endY - headlen * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              sh.endX - headlen * Math.cos(angle + Math.PI / 6),
              sh.endY - headlen * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = sh.strokeColor;
            ctx.fill();

            // Start head
            ctx.beginPath();
            ctx.moveTo(sh.x, sh.y);
            ctx.lineTo(
              sh.x + headlen * Math.cos(angle - Math.PI / 6),
              sh.y + headlen * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              sh.x + headlen * Math.cos(angle + Math.PI / 6),
              sh.y + headlen * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
          } else if (sh.shapeKind === 'curved_arrow' && sh.endX !== undefined && sh.endY !== undefined) {
            const cx = sh.controlX ?? (sh.x + sh.endX) / 2;
            const cy = sh.controlY ?? (sh.y + sh.endY) / 2 - 30;
            ctx.beginPath();
            ctx.moveTo(sh.x, sh.y);
            ctx.quadraticCurveTo(cx, cy, sh.endX, sh.endY);
            ctx.stroke();

            const angle = Math.atan2(sh.endY - cy, sh.endX - cx);
            const headlen = 14;
            ctx.beginPath();
            ctx.moveTo(sh.endX, sh.endY);
            ctx.lineTo(
              sh.endX - headlen * Math.cos(angle - Math.PI / 6),
              sh.endY - headlen * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              sh.endX - headlen * Math.cos(angle + Math.PI / 6),
              sh.endY - headlen * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = sh.strokeColor;
            ctx.fill();
          }
          break;
        }

        case 'text': {
          const txt = el as TextElement;
          ctx.fillStyle = txt.color;
          ctx.font = `${txt.isBold ? 'bold ' : ''}${txt.fontSize}px 'Plus Jakarta Sans', sans-serif`;
          ctx.fillText(txt.text, txt.x, txt.y);
          break;
        }

        case 'formula': {
          const f = el as ChemicalFormulaElement;
          ctx.fillStyle = f.color || '#501325';
          ctx.font = `bold ${f.fontSize || 20}px 'JetBrains Mono', monospace`;
          ctx.fillText(f.equation, f.x, f.y);

          if (f.subtitle) {
            ctx.fillStyle = '#6B7280';
            ctx.font = `italic ${Math.max((f.fontSize || 20) - 6, 12)}px Georgia, serif`;
            ctx.fillText(f.subtitle, f.x, f.y + 24);
          }

          if (f.deltaH) {
            ctx.fillStyle = f.deltaH.includes('-') ? '#047857' : '#B91C1C';
            ctx.font = `bold ${Math.max((f.fontSize || 20) - 4, 13)}px 'JetBrains Mono', monospace`;
            ctx.fillText(f.deltaH, f.x, f.y + (f.subtitle ? 46 : 26));
          }
          break;
        }

        case 'apparatus': {
          renderApparatus(ctx, el as ApparatusElement);
          break;
        }

        case 'mindmap': {
          renderMindMap(ctx, el as MindMapElement);
          break;
        }

        case 'molecule': {
          const m = el as MoleculeElement;
          const showDetailedLewis = m.showCarbons ?? isLewisMode;

          // Find centroid of molecule to orient inner double bonds accurately towards the inside of rings
          let centroidX = 0;
          let centroidY = 0;
          if (m.atoms.length > 0) {
            m.atoms.forEach((a) => {
              centroidX += a.x;
              centroidY += a.y;
            });
            centroidX /= m.atoms.length;
            centroidY /= m.atoms.length;
          }

          // 1. Render Bonds (Flawless ChemDraw standard: outer perimeter stays 100% connected, inner Pi bond is inside)
          m.bonds.forEach((b) => {
            const from = m.atoms.find((a) => a.id === b.fromAtomId);
            const to = m.atoms.find((a) => a.id === b.toAtomId);
            if (!from || !to) return;

            const x1 = m.x + from.x;
            const y1 = m.y + from.y;
            const x2 = m.x + to.x;
            const y2 = m.y + to.y;

            const isHovered =
              isChemDrawActive &&
              hoveredChemTarget?.moleculeId === m.id &&
              hoveredChemTarget?.id === b.id;

            ctx.strokeStyle = isHovered ? '#0284C7' : '#18191B';
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';

            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;

            if (b.bondOrder === 2) {
              // Primary bond along vertices (keeping the ring/chain perimeter fully intact)
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();

              // Secondary pi-bond oriented towards centroid of ring/molecule
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              const toCentroidX = centroidX - midX;
              const toCentroidY = centroidY - midY;
              const cLen = Math.hypot(toCentroidX, toCentroidY) || 1;

              // Offset vector pointing inwards
              let nx = (toCentroidX / cLen) * 5.5;
              let ny = (toCentroidY / cLen) * 5.5;

              // If centroid is zero/collinear, use perpendicular
              if (cLen < 2) {
                nx = (-dy / len) * 5;
                ny = (dx / len) * 5;
              }

              // Draw shortened inner line (ChemDraw standard: 15% inset from both ends)
              const inset = 0.15;
              ctx.beginPath();
              ctx.moveTo(x1 + dx * inset + nx, y1 + dy * inset + ny);
              ctx.lineTo(x2 - dx * inset + nx, y2 - dy * inset + ny);
              ctx.stroke();
            } else if (b.bondOrder === 3) {
              // Triple Bond
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();

              const nx = (-dy / len) * 4.5;
              const ny = (dx / len) * 4.5;
              const inset = 0.15;
              ctx.beginPath();
              ctx.moveTo(x1 + dx * inset + nx, y1 + dy * inset + ny);
              ctx.lineTo(x2 - dx * inset + nx, y2 - dy * inset + ny);
              ctx.moveTo(x1 + dx * inset - nx, y1 + dy * inset - ny);
              ctx.lineTo(x2 - dx * inset - nx, y2 - dy * inset - ny);
              ctx.stroke();
            } else if (b.bondOrder === 'wedge') {
              // Wedged Stereochemical Bond (Tapered triangle)
              const nx = (-dy / len) * 4.5;
              const ny = (dx / len) * 4.5;
              ctx.fillStyle = isHovered ? '#0284C7' : '#18191B';
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2 + nx, y2 + ny);
              ctx.lineTo(x2 - nx, y2 - ny);
              ctx.closePath();
              ctx.fill();
            } else if (b.bondOrder === 'dash') {
              // Dashed Stereochemical Bond
              ctx.save();
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
              ctx.restore();
            } else {
              // Standard Single Bond
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
          });

          // Aromatic Delocalized Resonance Circle (if benzene ring has circle enabled)
          if (m.isAromaticCircle && m.atoms.length === 6) {
            ctx.save();
            ctx.strokeStyle = '#18191B';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(m.x + centroidX, m.y + centroidY, 24, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // 2. Render Atoms (Skeletal vs Lewis)
          m.atoms.forEach((a) => {
            const ax = m.x + a.x;
            const ay = m.y + a.y;

            const connectedBondsCount = m.bonds.filter(
              (b) => b.fromAtomId === a.id || b.toAtomId === a.id
            ).length;

            const isHovered =
              isChemDrawActive &&
              hoveredChemTarget?.moleculeId === m.id &&
              hoveredChemTarget?.id === a.id;

            // In Skeletal mode, non-isolated Carbons are vertices without letters
            const isImplicitCarbon = !showDetailedLewis && a.symbol === 'C' && connectedBondsCount > 0;

            if (!isImplicitCarbon) {
              // Clear background disk behind atom label so bonds don't cut through text
              ctx.fillStyle = background.startsWith('dark') ? '#141416' : '#FAF8F5';
              ctx.beginPath();
              ctx.arc(ax, ay, a.symbol.length > 1 ? 14 : 11, 0, Math.PI * 2);
              ctx.fill();

              // Element CPK / Academic colors
              let atomColor = '#501325';
              if (a.symbol === 'O') atomColor = '#DC2626'; // Crimson
              else if (a.symbol === 'N') atomColor = '#2563EB'; // Royal Blue
              else if (a.symbol === 'Cl') atomColor = '#059669'; // Emerald
              else if (a.symbol === 'Br') atomColor = '#D97706'; // Amber
              else if (a.symbol === 'I') atomColor = '#7C3AED'; // Purple
              else if (a.symbol === 'F') atomColor = '#0D9488'; // Teal
              else if (a.symbol === 'S') atomColor = '#CA8A04'; // Yellow
              else if (a.symbol === 'P') atomColor = '#EA580C'; // Orange

              ctx.fillStyle = atomColor;
              ctx.font = "bold 14px 'JetBrains Mono', monospace";
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(a.symbol, ax, ay);
            }

            // Formal Charge (+ / -) - ChemDraw Style: Clean delicate badge without heavy thick circles
            if (a.charge) {
              const cx = ax + 11;
              const cy = ay - 9;
              ctx.strokeStyle = a.charge > 0 ? '#DC2626' : '#2563EB';
              ctx.fillStyle = '#FFFFFF';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(cx, cy, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = a.charge > 0 ? '#DC2626' : '#2563EB';
              ctx.font = 'bold 9px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(a.charge > 0 ? '+' : '−', cx, cy);
            }

            // Lone pairs
            if (a.lonePairs === 2) {
              ctx.fillStyle = '#D97706';
              ctx.beginPath();
              ctx.arc(ax - 5, ay - 13, 1.8, 0, Math.PI * 2);
              ctx.arc(ax + 5, ay - 13, 1.8, 0, Math.PI * 2);
              ctx.fill();
            }

            // ChemDraw hover halo
            if (isHovered) {
              ctx.strokeStyle = '#C9A038';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(ax, ay, 16, 0, Math.PI * 2);
              ctx.stroke();
            }
          });
          break;
        }

        case 'table': {
          const t = el as TableElement;
          const cellH = t.rowHeight || 28;
          let currentY = t.y;

          // Header
          ctx.fillStyle = t.headerBgColor || '#501325';
          let headerX = t.x;
          t.headers.forEach((h, i) => {
            const w = t.colWidths[i] || 100;
            ctx.fillRect(headerX, currentY, w, cellH);
            ctx.strokeStyle = t.borderColor || '#C9A038';
            ctx.strokeRect(headerX, currentY, w, cellH);

            ctx.fillStyle = '#FAF8F5';
            ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText(h, headerX + w / 2, currentY + cellH / 2 + 4);
            headerX += w;
          });

          currentY += cellH;

          // Data Rows
          t.cells.forEach((row) => {
            let cellX = t.x;
            row.forEach((cell, ci) => {
              const w = t.colWidths[ci] || 100;
              ctx.fillStyle = t.cellBgColor || '#FFFFFF';
              ctx.fillRect(cellX, currentY, w, cellH);
              ctx.strokeStyle = t.borderColor || '#E5E7EB';
              ctx.strokeRect(cellX, currentY, w, cellH);

              ctx.fillStyle = '#18191B';
              ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
              ctx.textAlign = 'center';
              ctx.fillText(cell, cellX + w / 2, currentY + cellH / 2 + 4);
              cellX += w;
            });
            currentY += cellH;
          });
          break;
        }

        case 'energy_diagram': {
          const ed = el as EnergyDiagramElement;
          const baseY = ed.y + ed.height - 40;

          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#E5E7EB';
          ctx.lineWidth = 1.5;
          ctx.fillRect(ed.x, ed.y, ed.width, ed.height);
          ctx.strokeRect(ed.x, ed.y, ed.width, ed.height);

          ctx.fillStyle = '#501325';
          ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
          ctx.textAlign = 'left';
          ctx.fillText(ed.reactionName, ed.x + 16, ed.y + 24);

          ctx.strokeStyle = '#454952';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ed.x + 40, baseY);
          ctx.lineTo(ed.x + ed.width - 20, baseY);
          ctx.moveTo(ed.x + 40, baseY);
          ctx.lineTo(ed.x + 40, ed.y + 40);
          ctx.stroke();

          ctx.fillStyle = '#6B7280';
          ctx.font = '10px sans-serif';
          ctx.fillText('Reaction Coordinate', ed.x + ed.width - 110, baseY + 18);
          ctx.fillText('Potential Energy', ed.x + 45, ed.y + 48);

          const rxY = ed.isExothermic ? baseY - 80 : baseY - 50;
          const prY = ed.isExothermic ? baseY - 30 : baseY - 90;
          const peakY = ed.y + 70;

          ctx.strokeStyle = '#501325';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ed.x + 40, rxY);
          ctx.lineTo(ed.x + 120, rxY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(ed.x + 120, rxY);
          ctx.quadraticCurveTo(ed.x + 220, peakY, ed.x + 320, prY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(ed.x + 320, prY);
          ctx.lineTo(ed.x + 420, prY);
          ctx.stroke();

          ctx.fillStyle = '#18191B';
          ctx.font = "bold 10px 'JetBrains Mono', monospace";
          ctx.fillText(ed.reactantsLabel, ed.x + 50, rxY - 10);
          ctx.fillText(ed.productsLabel, ed.x + 330, prY - 10);
          ctx.fillStyle = '#D97706';
          ctx.fillText(ed.eaLabel, ed.x + 180, peakY - 12);
          ctx.fillStyle = ed.isExothermic ? '#047857' : '#B91C1C';
          ctx.fillText(ed.deltaHLabel, ed.x + 260, (rxY + prY) / 2);
          break;
        }
      }

      // Professional Selection Bounding Box
      if (isSelected) {
        drawSelectionBox(ctx, el, viewport.zoom);
      }

      ctx.restore();
    });

    // 4. Render Active In-Progress Inking Stroke
    if (isPointerDownRef.current && tool === 'pen' && currentPointsRef.current.length > 0) {
      const outlinePoints = getStroke(currentPointsRef.current, {
        size,
        thinning: 0.4,
        smoothing: 0.5,
        streamline: 0.5,
      });

      if (outlinePoints.length > 0) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(outlinePoints[0][0], outlinePoints[0][1]);
        for (let i = 1; i < outlinePoints.length; i++) {
          ctx.lineTo(outlinePoints[i][0], outlinePoints[i][1]);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // 5. Render In-Progress Drag-to-Draw Shape Preview
    if (isDrawingShapeRef.current) {
      const start = shapeStartRef.current;
      const cur = cursorPosRef.current;
      const w = cur.x - start.x;
      const h = cur.y - start.y;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.setLineDash([4, 4]);

      if (shapeKind === 'rectangle') {
        ctx.strokeRect(Math.min(start.x, cur.x), Math.min(start.y, cur.y), Math.abs(w), Math.abs(h));
      } else if (shapeKind === 'rounded_rectangle') {
        ctx.strokeRect(Math.min(start.x, cur.x), Math.min(start.y, cur.y), Math.abs(w), Math.abs(h));
      } else if (shapeKind === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(
          (start.x + cur.x) / 2,
          (start.y + cur.y) / 2,
          Math.abs(w / 2),
          Math.abs(h / 2),
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else if (shapeKind === 'triangle') {
        ctx.beginPath();
        ctx.moveTo((start.x + cur.x) / 2, Math.min(start.y, cur.y));
        ctx.lineTo(Math.max(start.x, cur.x), Math.max(start.y, cur.y));
        ctx.lineTo(Math.min(start.x, cur.x), Math.max(start.y, cur.y));
        ctx.closePath();
        ctx.stroke();
      } else if (shapeKind === 'diamond') {
        const mx = (start.x + cur.x) / 2;
        const my = (start.y + cur.y) / 2;
        ctx.beginPath();
        ctx.moveTo(mx, Math.min(start.y, cur.y));
        ctx.lineTo(Math.max(start.x, cur.x), my);
        ctx.lineTo(mx, Math.max(start.y, cur.y));
        ctx.lineTo(Math.min(start.x, cur.x), my);
        ctx.closePath();
        ctx.stroke();
      } else if (shapeKind === 'line' || shapeKind === 'arrow' || shapeKind === 'double_headed_arrow') {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(cur.x, cur.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Render Cursor Ghost Preview (يحول السهم للحاجة اللي بضيفها)
    if (activeStamp) {
      const ghostX = cursorPosRef.current.x;
      const ghostY = cursorPosRef.current.y;
      ctx.save();
      ctx.globalAlpha = 0.55;

      if (activeStamp.type === 'apparatus' && activeStamp.kind) {
        renderApparatus(ctx, {
          id: 'ghost-apparatus',
          type: 'apparatus',
          x: ghostX,
          y: ghostY,
          kind: activeStamp.kind,
          width: activeStamp.width || 100,
          height: activeStamp.height || 120,
          liquidColor: activeStamp.liquidColor || '#2563EB',
          liquidLevel: activeStamp.liquidLevel || 0.5,
          zIndex: 9999,
        });
      } else if (activeStamp.type === 'equation') {
        ctx.fillStyle = '#501325';
        ctx.font = "bold 20px 'JetBrains Mono', monospace";
        ctx.fillText('2H₂ + O₂ → 2H₂O', ghostX, ghostY);
        ctx.strokeStyle = '#501325';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(ghostX - 10, ghostY - 24, 250, 42);
      } else if (activeStamp.type === 'ring_aromatic_circle') {
        const ring = createAromaticCircleBenzene(ghostX, ghostY);
        ring.bonds.forEach((b) => {
          const from = ring.atoms.find((a) => a.id === b.fromAtomId);
          const to = ring.atoms.find((a) => a.id === b.toAtomId);
          if (from && to) {
            ctx.strokeStyle = '#501325';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
          }
        });
        ctx.beginPath();
        ctx.arc(ghostX, ghostY, 24, 0, Math.PI * 2);
        ctx.stroke();
      } else if (activeStamp.type === 'ring_benzene') {
        const ring = createBenzeneRing(ghostX, ghostY);
        ring.bonds.forEach((b) => {
          const from = ring.atoms.find((a) => a.id === b.fromAtomId);
          const to = ring.atoms.find((a) => a.id === b.toAtomId);
          if (from && to) {
            ctx.strokeStyle = '#501325';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
          }
        });
      } else if (activeStamp.type === 'ring_cyclohexane') {
        const ring = createCyclohexaneRing(ghostX, ghostY);
        ring.bonds.forEach((b) => {
          const from = ring.atoms.find((a) => a.id === b.fromAtomId);
          const to = ring.atoms.find((a) => a.id === b.toAtomId);
          if (from && to) {
            ctx.strokeStyle = '#501325';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
          }
        });
      } else if (activeStamp.type === 'ring_cyclopentane') {
        const ring = createCyclopentaneRing(ghostX, ghostY);
        ring.bonds.forEach((b) => {
          const from = ring.atoms.find((a) => a.id === b.fromAtomId);
          const to = ring.atoms.find((a) => a.id === b.toAtomId);
          if (from && to) {
            ctx.strokeStyle = '#501325';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
          }
        });
      }

      ctx.restore();
    }

    ctx.restore();
  }, [
    background,
    viewport,
    elements,
    selectedElementId,
    tool,
    color,
    size,
    shapeKind,
    isChemDrawActive,
    isLewisMode,
    hoveredChemTarget,
    activeStamp,
  ]);

  // Synchronize canvas size with device pixel ratio
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;
    startScreenPosRef.current = { x: e.clientX, y: e.clientY };

    const worldPos = screenToCanvas(e.clientX, e.clientY);
    startCanvasPosRef.current = worldPos;

    // Pan with middle-click or spacebar or select tool with alt
    if (e.button === 1 || e.buttons === 4 || (tool === 'select' && e.altKey)) {
      isPanningRef.current = true;
      return;
    }

    // 1. ACTIVE STAMP PLACEMENT (يحول السهم للحاجة اللي بضيفها ولما اضغط يضغط)
    if (activeStamp) {
      if (activeStamp.type === 'apparatus' && activeStamp.kind) {
        const newApparatus: ApparatusElement = {
          id: `app-${Date.now()}`,
          type: 'apparatus',
          x: worldPos.x,
          y: worldPos.y,
          kind: activeStamp.kind,
          width: activeStamp.width || 100,
          height: activeStamp.height || 120,
          liquidColor: activeStamp.liquidColor || '#2563EB',
          liquidLevel: activeStamp.liquidLevel || 0.5,
          label: activeStamp.name,
          zIndex: elements.length + 1,
        };
        pushHistory([...elements, newApparatus]);
        setSelectedElementId(newApparatus.id);
        setActiveStamp(null);
        return;
      }

      if (activeStamp.type === 'equation') {
        const newFormula: ChemicalFormulaElement = {
          id: `formula-${Date.now()}`,
          type: 'formula',
          x: worldPos.x,
          y: worldPos.y,
          equation: '2H₂ + O₂ → 2H₂O',
          reactants: '2H₂ + O₂',
          products: '2H₂O',
          subtitle: 'Heat / Catalyst',
          deltaH: 'ΔH = -572 kJ/mol',
          fontSize: 20,
          color: '#501325',
          zIndex: elements.length + 1,
        };
        pushHistory([...elements, newFormula]);
        setSelectedElementId(newFormula.id);
        setActiveStamp(null);
        setEditingEquation(newFormula);
        setEquationScreenPos({ x: e.clientX, y: e.clientY });
        return;
      }

      if (activeStamp.type === 'mindmap' && activeStamp.preset) {
        const newMindMap: MindMapElement = {
          id: `mm-${Date.now()}`,
          type: 'mindmap',
          title: activeStamp.preset.title,
          rootNode: activeStamp.preset.rootNode,
          x: worldPos.x,
          y: worldPos.y,
          zIndex: elements.length + 1,
        };
        pushHistory([...elements, newMindMap]);
        setSelectedElementId(newMindMap.id);
        setActiveStamp(null);
        return;
      }

      if (
        activeStamp.type === 'ring_benzene' ||
        activeStamp.type === 'ring_aromatic_circle' ||
        activeStamp.type === 'ring_cyclohexane' ||
        activeStamp.type === 'ring_cyclopentane'
      ) {
        let ringData;
        let ringName = 'Benzene';
        const isCircle = activeStamp.type === 'ring_aromatic_circle';

        if (activeStamp.type === 'ring_cyclopentane') {
          ringData = createCyclopentaneRing(0, 0);
          ringName = 'Cyclopentane';
        } else if (activeStamp.type === 'ring_cyclohexane') {
          ringData = createCyclohexaneRing(0, 0);
          ringName = 'Cyclohexane';
        } else if (isCircle) {
          ringData = createAromaticCircleBenzene(0, 0);
          ringName = 'Benzene';
        } else {
          ringData = createBenzeneRing(0, 0);
        }

        const newMol: MoleculeElement = {
          id: `mol-${Date.now()}`,
          type: 'molecule',
          name: ringName,
          x: worldPos.x,
          y: worldPos.y,
          atoms: ringData.atoms,
          bonds: ringData.bonds,
          curvedArrows: [],
          showCarbons: isLewisMode,
          isAromaticCircle: isCircle,
          zIndex: elements.length + 1,
        };
        pushHistory([...elements, newMol]);
        setSelectedElementId(newMol.id);
        setActiveStamp(null);
        return;
      }
    }

    // 2. MINI-CHEMDRAW INTERACTIVE ACTIONS
    if (isChemDrawActive) {
      let clickedAtom: ChemAtom | null = null;
      let clickedMolecule: MoleculeElement | null = null;

      for (const el of elements) {
        if (el.type === 'molecule') {
          const m = el as MoleculeElement;
          for (const a of m.atoms) {
            const dist = Math.hypot(m.x + a.x - worldPos.x, m.y + a.y - worldPos.y);
            if (dist < 18) {
              clickedAtom = a;
              clickedMolecule = m;
              break;
            }
          }
          if (clickedAtom) break;
        }
      }

      let clickedBond: ChemBond | null = null;
      if (!clickedAtom) {
        for (const el of elements) {
          if (el.type === 'molecule') {
            const m = el as MoleculeElement;
            for (const b of m.bonds) {
              const a1 = m.atoms.find((a) => a.id === b.fromAtomId);
              const a2 = m.atoms.find((a) => a.id === b.toAtomId);
              if (a1 && a2) {
                const dist = Math.hypot(
                  (m.x + a1.x + m.x + a2.x) / 2 - worldPos.x,
                  (m.y + a1.y + m.y + a2.y) / 2 - worldPos.y
                );
                if (dist < 14) {
                  clickedBond = b;
                  clickedMolecule = m;
                  break;
                }
              }
            }
            if (clickedBond) break;
          }
        }
      }

      if (activeChemSubTool === 'zigzag_chain') {
        if (clickedAtom && clickedMolecule) {
          const nextRelPos = calculateNextZigzagPos(
            clickedMolecule.atoms,
            clickedMolecule.bonds,
            clickedAtom.id
          );
          const newAtomId = `atom-${Date.now()}`;
          const newAtom: ChemAtom = {
            id: newAtomId,
            symbol: activeChemElement,
            x: nextRelPos.x,
            y: nextRelPos.y,
          };
          const newBond: ChemBond = {
            id: `bond-${Date.now()}`,
            fromAtomId: clickedAtom.id,
            toAtomId: newAtomId,
            bondOrder: 1,
          };

          const updatedMol: MoleculeElement = {
            ...clickedMolecule,
            atoms: [...clickedMolecule.atoms, newAtom],
            bonds: [...clickedMolecule.bonds, newBond],
          };

          pushHistory(elements.map((el) => (el.id === updatedMol.id ? updatedMol : el)));
          setSelectedElementId(updatedMol.id);
          return;
        } else {
          const newMolId = `mol-${Date.now()}`;
          const newAtomId = `atom-${Date.now()}`;
          const newMol: MoleculeElement = {
            id: newMolId,
            type: 'molecule',
            name: '',
            x: worldPos.x,
            y: worldPos.y,
            atoms: [{ id: newAtomId, symbol: activeChemElement, x: 0, y: 0 }],
            bonds: [],
            curvedArrows: [],
            showCarbons: isLewisMode,
            zIndex: elements.length + 1,
          };
          pushHistory([...elements, newMol]);
          setSelectedElementId(newMol.id);
          return;
        }
      }

      if (activeChemSubTool === 'bond_cycle') {
        if (clickedBond && clickedMolecule) {
          let nextOrder: 1 | 2 | 3 | 'wedge' | 'dash' = 1;
          if (clickedBond.bondOrder === 1) nextOrder = 2;
          else if (clickedBond.bondOrder === 2) nextOrder = 3;
          else if (clickedBond.bondOrder === 3) nextOrder = 'wedge';
          else if (clickedBond.bondOrder === 'wedge') nextOrder = 'dash';
          else nextOrder = 1;

          const updatedBonds = clickedMolecule.bonds.map((b) =>
            b.id === clickedBond?.id ? { ...b, bondOrder: nextOrder } : b
          );
          const updatedMol = { ...clickedMolecule, bonds: updatedBonds };
          pushHistory(elements.map((el) => (el.id === updatedMol.id ? updatedMol : el)));
          return;
        }
      }

      if (activeChemSubTool === 'element_mutate') {
        if (clickedAtom && clickedMolecule) {
          const updatedAtoms = clickedMolecule.atoms.map((a) =>
            a.id === clickedAtom?.id ? { ...a, symbol: activeChemElement } : a
          );
          const updatedMol = { ...clickedMolecule, atoms: updatedAtoms };
          pushHistory(elements.map((el) => (el.id === updatedMol.id ? updatedMol : el)));
          return;
        }
      }

      if (activeChemSubTool === 'charge_plus') {
        if (clickedAtom && clickedMolecule) {
          const updatedAtoms = clickedMolecule.atoms.map((a) =>
            a.id === clickedAtom?.id ? { ...a, charge: a.charge === 1 ? undefined : 1 } : a
          );
          const updatedMol = { ...clickedMolecule, atoms: updatedAtoms };
          pushHistory(elements.map((el) => (el.id === updatedMol.id ? updatedMol : el)));
          return;
        }
      }

      if (activeChemSubTool === 'charge_minus') {
        if (clickedAtom && clickedMolecule) {
          const updatedAtoms = clickedMolecule.atoms.map((a) =>
            a.id === clickedAtom?.id ? { ...a, charge: a.charge === -1 ? undefined : -1 } : a
          );
          const updatedMol = { ...clickedMolecule, atoms: updatedAtoms };
          pushHistory(elements.map((el) => (el.id === updatedMol.id ? updatedMol : el)));
          return;
        }
      }

      if (activeChemSubTool === 'lone_pair') {
        if (clickedAtom && clickedMolecule) {
          const updatedAtoms = clickedMolecule.atoms.map((a) =>
            a.id === clickedAtom?.id ? { ...a, lonePairs: a.lonePairs === 2 ? undefined : 2 } : a
          );
          const updatedMol = { ...clickedMolecule, atoms: updatedAtoms };
          pushHistory(elements.map((el) => (el.id === updatedMol.id ? updatedMol : el)));
          return;
        }
      }

      if (activeChemSubTool === 'eraser_chem') {
        if (clickedAtom && clickedMolecule) {
          const remainingAtoms = clickedMolecule.atoms.filter((a) => a.id !== clickedAtom?.id);
          const remainingBonds = clickedMolecule.bonds.filter(
            (b) => b.fromAtomId !== clickedAtom?.id && b.toAtomId !== clickedAtom?.id
          );
          if (remainingAtoms.length === 0) {
            pushHistory(elements.filter((el) => el.id !== clickedMolecule?.id));
          } else {
            const updatedMol = { ...clickedMolecule, atoms: remainingAtoms, bonds: remainingBonds };
            pushHistory(elements.map((el) => (el.id === updatedMol.id ? updatedMol : el)));
          }
          return;
        }
        if (clickedBond && clickedMolecule) {
          const remainingBonds = clickedMolecule.bonds.filter((b) => b.id !== clickedBond?.id);
          const updatedMol = { ...clickedMolecule, bonds: remainingBonds };
          pushHistory(elements.map((el) => (el.id === updatedMol.id ? updatedMol : el)));
          return;
        }
      }
    }

    // 3. SELECT & MOVE TOOL (Accurate bounding box hit testing)
    if (tool === 'select') {
      const hit = [...elements].reverse().find((el) => hitTestElement(el, worldPos.x, worldPos.y));

      if (hit) {
        setSelectedElementId(hit.id);
        draggedElementRef.current = {
          elementId: hit.id,
          origX: hit.x,
          origY: hit.y,
          startPoint: worldPos,
        };

        if (hit.type === 'formula') {
          setEditingEquation(hit as ChemicalFormulaElement);
          setEquationScreenPos({ x: e.clientX, y: e.clientY });
        } else {
          setEditingEquation(null);
        }
      } else {
        setSelectedElementId(null);
        setEditingEquation(null);
        isPanningRef.current = true;
      }
      return;
    }

    // 4. PEN & HIGHLIGHTER
    if (tool === 'pen' || tool === 'highlighter') {
      currentPointsRef.current = [{ x: worldPos.x, y: worldPos.y, pressure: e.pressure || 0.5 }];
      renderCanvas();
      return;
    }

    // 5. DRAG-TO-DRAW SHAPES & ARROWS
    if (tool === 'shape') {
      isDrawingShapeRef.current = true;
      shapeStartRef.current = worldPos;
      return;
    }

    // 6. DIRECT IN-PLACE TEXT TOOL (Miro Style - no alert prompt!)
    if (tool === 'text') {
      setInlineTextEditor({
        x: worldPos.x,
        y: worldPos.y,
        screenX: e.clientX,
        screenY: e.clientY,
        text: '',
      });
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
      return;
    }

    // 7. ERASER
    if (tool === 'eraser') {
      const filtered = elements.filter((el) => !hitTestElement(el, worldPos.x, worldPos.y));
      if (filtered.length !== elements.length) {
        pushHistory(filtered);
      }
      return;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const worldPos = screenToCanvas(e.clientX, e.clientY);
    cursorPosRef.current = {
      x: worldPos.x,
      y: worldPos.y,
      screenX: e.clientX,
      screenY: e.clientY,
    };

    if (activeStamp || isDrawingShapeRef.current) {
      renderCanvas();
    }

    if (isChemDrawActive && !isPointerDownRef.current) {
      let hovered: { moleculeId: string; type: 'atom' | 'bond'; id: string } | null = null;
      for (const el of elements) {
        if (el.type === 'molecule') {
          const m = el as MoleculeElement;
          for (const a of m.atoms) {
            if (Math.hypot(m.x + a.x - worldPos.x, m.y + a.y - worldPos.y) < 16) {
              hovered = { moleculeId: m.id, type: 'atom', id: a.id };
              break;
            }
          }
          if (hovered) break;
        }
      }
      setHoveredChemTarget(hovered);
    }

    if (!isPointerDownRef.current) return;

    if (isPanningRef.current) {
      const dx = e.clientX - startScreenPosRef.current.x;
      const dy = e.clientY - startScreenPosRef.current.y;
      startScreenPosRef.current = { x: e.clientX, y: e.clientY };
      setViewport((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      return;
    }

    if (draggedElementRef.current) {
      const dx = worldPos.x - draggedElementRef.current.startPoint.x;
      const dy = worldPos.y - draggedElementRef.current.startPoint.y;

      setElements((prev) =>
        prev.map((el) =>
          el.id === draggedElementRef.current?.elementId
            ? { ...el, x: draggedElementRef.current.origX + dx, y: draggedElementRef.current.origY + dy }
            : el
        )
      );
      return;
    }

    if (tool === 'pen' || tool === 'highlighter') {
      currentPointsRef.current.push({
        x: worldPos.x,
        y: worldPos.y,
        pressure: e.pressure || 0.5,
      });
      renderCanvas();
      return;
    }

    if (tool === 'eraser') {
      const filtered = elements.filter((el) => !hitTestElement(el, worldPos.x, worldPos.y));
      if (filtered.length !== elements.length) {
        setElements(filtered);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.releasePointerCapture(e.pointerId);
    isPointerDownRef.current = false;
    isPanningRef.current = false;

    if (draggedElementRef.current) {
      draggedElementRef.current = null;
      pushHistory(elements);
      return;
    }

    if (isDrawingShapeRef.current) {
      isDrawingShapeRef.current = false;
      const start = shapeStartRef.current;
      const worldPos = screenToCanvas(e.clientX, e.clientY);
      const w = worldPos.x - start.x;
      const h = worldPos.y - start.y;

      if (Math.hypot(w, h) > 8) {
        let newShape: ShapeElement;
        if (
          shapeKind === 'line' ||
          shapeKind === 'arrow' ||
          shapeKind === 'double_headed_arrow'
        ) {
          newShape = {
            id: `shape-${Date.now()}`,
            type: 'shape',
            shapeKind,
            x: start.x,
            y: start.y,
            endX: worldPos.x,
            endY: worldPos.y,
            width: Math.abs(w),
            height: Math.abs(h),
            strokeColor: color,
            strokeWidth: size,
            zIndex: elements.length + 1,
          };
        } else if (shapeKind === 'curved_arrow') {
          newShape = {
            id: `shape-${Date.now()}`,
            type: 'shape',
            shapeKind,
            x: start.x,
            y: start.y,
            endX: worldPos.x,
            endY: worldPos.y,
            controlX: (start.x + worldPos.x) / 2,
            controlY: (start.y + worldPos.y) / 2 - 30,
            width: Math.abs(w),
            height: Math.abs(h),
            strokeColor: color,
            strokeWidth: size,
            zIndex: elements.length + 1,
          };
        } else {
          newShape = {
            id: `shape-${Date.now()}`,
            type: 'shape',
            shapeKind,
            x: Math.min(start.x, worldPos.x),
            y: Math.min(start.y, worldPos.y),
            width: Math.abs(w),
            height: Math.abs(h),
            strokeColor: color,
            strokeWidth: size,
            zIndex: elements.length + 1,
          };
        }
        pushHistory([...elements, newShape]);
        setSelectedElementId(newShape.id);
      }
      renderCanvas();
      return;
    }

    if ((tool === 'pen' || tool === 'highlighter') && currentPointsRef.current.length > 0) {
      const newStroke: StrokeElement = {
        id: `stroke-${Date.now()}`,
        type: 'stroke',
        points: [...currentPointsRef.current],
        x: currentPointsRef.current[0].x,
        y: currentPointsRef.current[0].y,
        color,
        size,
        isHighlighter: tool === 'highlighter',
        zIndex: elements.length + 1,
      };
      pushHistory([...elements, newStroke]);
      currentPointsRef.current = [];
      renderCanvas();
    }
  };

  // Commit In-Place Miro Text Editor
  const commitInlineText = () => {
    if (!inlineTextEditor) return;
    const trimmed = inlineTextEditor.text.trim();
    if (trimmed) {
      if (inlineTextEditor.id) {
        const updated = elements.map((el) =>
          el.id === inlineTextEditor.id ? { ...el, text: trimmed } : el
        );
        pushHistory(updated);
      } else {
        const newText: TextElement = {
          id: `txt-${Date.now()}`,
          type: 'text',
          x: inlineTextEditor.x,
          y: inlineTextEditor.y,
          text: trimmed,
          fontSize: 20,
          color,
          zIndex: elements.length + 1,
        };
        pushHistory([...elements, newText]);
        setSelectedElementId(newText.id);
      }
    }
    setInlineTextEditor(null);
  };

  // Zoom with Wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.2), 4.0);

    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const worldBefore = screenToCanvas(mouseX, mouseY);

    setViewport({
      x: mouseX - worldBefore.x * newZoom,
      y: mouseY - worldBefore.y * newZoom,
      zoom: newZoom,
    });
  };

  // Export as PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${board.title.replace(/\s+/g, '_')}_Phenol_Whiteboard.png`;
    a.click();
  };

  // Export as JSON
  const handleExportJSON = () => {
    const currentDoc: WhiteboardDocument = {
      ...board,
      elements,
      viewport,
      background,
    };
    const jsonStr = JSON.stringify(currentDoc, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${board.title.replace(/\s+/g, '_')}.phenol-board.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Currently selected element object
  const selectedElement = elements.find((el) => el.id === selectedElementId);
  const selectedBounds = selectedElement ? getElementBounds(selectedElement) : null;
  const selectedScreenPos = selectedBounds
    ? canvasToScreen(selectedBounds.x, selectedBounds.y)
    : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-ivory-200">
      {/* Top Header */}
      <WhiteboardHeader
        title={board.title}
        onChangeTitle={(t) => setBoard((prev) => ({ ...prev, title: t }))}
        viewport={viewport}
        onZoomIn={() =>
          setViewport((prev) => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 4.0) }))
        }
        onZoomOut={() =>
          setViewport((prev) => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.2) }))
        }
        onResetZoom={() => setViewport((prev) => ({ ...prev, zoom: 1.0 }))}
        background={background}
        onChangeBackground={setBackground}
        onOpenBoardsManager={() => setIsBoardsManagerOpen(true)}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        isSaving={isSaving}
      />

      {/* Floating Toolbar */}
      <WhiteboardToolbar
        currentTool={tool}
        onSelectTool={(t) => {
          setTool(t);
          setActiveStamp(null);
          if (t !== 'shape') setIsShapePopupOpen(false);
        }}
        currentColor={color}
        onSelectColor={setColor}
        currentSize={size}
        onSelectSize={setSize}
        currentShape={shapeKind}
        onSelectShape={setShapeKind}
        onToggleShapePopup={() => setIsShapePopupOpen((prev) => !prev)}
        isShapePopupOpen={isShapePopupOpen}
        onToggleChemDraw={() => {
          setIsChemDrawActive((prev) => !prev);
          setIsApparatusDrawerOpen(false);
          setIsMindMapDrawerOpen(false);
          setActiveStamp(null);
        }}
        isChemDrawActive={isChemDrawActive}
        onToggleApparatusDrawer={() => {
          setIsApparatusDrawerOpen((prev) => !prev);
          setIsChemDrawActive(false);
          setIsMindMapDrawerOpen(false);
          setActiveStamp(null);
        }}
        isApparatusDrawerOpen={isApparatusDrawerOpen}
        onActivateEquationStamp={() => {
          setActiveStamp({ type: 'equation' });
          setIsChemDrawActive(false);
          setIsApparatusDrawerOpen(false);
          setIsMindMapDrawerOpen(false);
        }}
        isEquationStampActive={activeStamp?.type === 'equation'}
        onToggleMindMapDrawer={() => {
          setIsMindMapDrawerOpen((prev) => !prev);
          setIsChemDrawActive(false);
          setIsApparatusDrawerOpen(false);
          setActiveStamp(null);
        }}
        isMindMapDrawerOpen={isMindMapDrawerOpen}
        onOpenTableModal={() => setIsTableModalOpen(true)}
        onOpenEnergyModal={() => setIsEnergyModalOpen(true)}
        onClearCanvas={() => {
          if (confirm('Clear all drawings and elements on this board?')) {
            pushHistory([]);
            setEditingEquation(null);
            setSelectedElementId(null);
          }
        }}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Shape Selector Sub-Palette */}
      <ShapeSelectorPopup
        isOpen={isShapePopupOpen}
        onClose={() => setIsShapePopupOpen(false)}
        currentShape={shapeKind}
        onSelectShape={(sh) => {
          setShapeKind(sh);
          setTool('shape');
        }}
      />

      {/* Mini-ChemDraw Floating Control Dock */}
      {isChemDrawActive && (
        <ChemDrawToolbar
          activeSubTool={activeChemSubTool}
          onSelectSubTool={(st) => {
            setActiveChemSubTool(st);
            if (st === 'ring_aromatic_circle') {
              setActiveStamp({ type: 'ring_aromatic_circle' });
            } else if (st === 'ring_benzene') {
              setActiveStamp({ type: 'ring_benzene' });
            } else if (st === 'ring_cyclohexane') {
              setActiveStamp({ type: 'ring_cyclohexane' });
            } else if (st === 'ring_cyclopentane') {
              setActiveStamp({ type: 'ring_cyclopentane' });
            } else {
              setActiveStamp(null);
            }
          }}
          activeElement={activeChemElement}
          onSelectElement={setActiveChemElement}
          isLewisMode={isLewisMode}
          onToggleLewisMode={() => setIsLewisMode((prev) => !prev)}
          onClose={() => setIsChemDrawActive(false)}
        />
      )}

      {/* Laboratory Apparatus Visual Shapes Drawer */}
      <ApparatusDrawer
        isOpen={isApparatusDrawerOpen}
        onClose={() => setIsApparatusDrawerOpen(false)}
        onSelectApparatus={(item: ApparatusItemInfo) => {
          setActiveStamp({
            type: 'apparatus',
            kind: item.kind as ApparatusKind,
            name: item.name,
            width: item.width,
            height: item.height,
            liquidColor: item.defaultLiquidColor,
            liquidLevel: item.defaultLiquidLevel,
          });
        }}
        selectedKind={activeStamp?.kind || null}
      />

      {/* Chemistry Mind Map Studio Drawer */}
      <MindMapDrawer
        isOpen={isMindMapDrawerOpen}
        onClose={() => setIsMindMapDrawerOpen(false)}
        onSelectPreset={(preset) => {
          setActiveStamp({
            type: 'mindmap',
            name: preset.title,
            preset,
          });
        }}
      />

      {/* In-Canvas Smart Equation Floating Bar */}
      {editingEquation && (
        <InlineEquationBar
          element={editingEquation}
          screenPos={equationScreenPos}
          onChange={(updated) => {
            const nextEq = { ...editingEquation, ...updated };
            setEditingEquation(nextEq);
            setElements((prev) =>
              prev.map((el) => (el.id === editingEquation.id ? (nextEq as WhiteboardElement) : el))
            );
          }}
          onClose={() => {
            pushHistory(elements);
            setEditingEquation(null);
          }}
        />
      )}

      {/* In-Place Miro Style Text Input */}
      {inlineTextEditor && (
        <div
          style={{
            position: 'absolute',
            left: inlineTextEditor.screenX,
            top: inlineTextEditor.screenY,
            zIndex: 60,
          }}
          className="animate-in fade-in zoom-in-95 duration-100"
        >
          <textarea
            ref={textInputRef}
            value={inlineTextEditor.text}
            onChange={(e) =>
              setInlineTextEditor((prev) => (prev ? { ...prev, text: e.target.value } : null))
            }
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                commitInlineText();
              } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                commitInlineText();
              }
            }}
            onBlur={commitInlineText}
            placeholder="Type text here..."
            rows={2}
            className="p-2 min-w-[200px] max-w-[450px] bg-white/95 backdrop-blur-md rounded-xl border-2 border-burgundy-900 shadow-editorial text-base font-sans text-charcoal-900 focus:outline-none resize-both"
          />
          <div className="text-[10px] text-charcoal-500 font-mono mt-0.5">
            Click outside or press Ctrl+Enter to finish
          </div>
        </div>
      )}

      {/* Floating Action Pill for Selected Element */}
      {selectedElement && selectedScreenPos && !isPointerDownRef.current && (
        <div
          style={{
            position: 'absolute',
            left: Math.max(10, selectedScreenPos.x),
            top: Math.max(10, selectedScreenPos.y - 42),
            zIndex: 45,
          }}
          className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-xl border border-hairline shadow-editorial text-xs"
        >
          <button
            type="button"
            onClick={() => {
              const dup: WhiteboardElement = {
                ...selectedElement,
                id: `${selectedElement.type}-${Date.now()}`,
                x: selectedElement.x + 30,
                y: selectedElement.y + 30,
                zIndex: elements.length + 1,
              };
              pushHistory([...elements, dup]);
              setSelectedElementId(dup.id);
            }}
            title="Duplicate Element"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-charcoal-700 hover:text-burgundy-900 hover:bg-ivory-200 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              const updated = elements.map((el) =>
                el.id === selectedElement.id ? { ...el, isLocked: !el.isLocked } : el
              );
              pushHistory(updated);
            }}
            title={selectedElement.isLocked ? 'Unlock Element' : 'Lock Element'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-charcoal-700 hover:text-burgundy-900 hover:bg-ivory-200 transition-colors"
          >
            {selectedElement.isLocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              pushHistory(elements.filter((el) => el.id !== selectedElement.id));
              setSelectedElementId(null);
              setEditingEquation(null);
            }}
            title="Delete Element (Del)"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Stamp Banner Guide (يحول السهم للحاجة اللي بضيفها) */}
      {activeStamp && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-burgundy-900 text-ivory-100 px-4 py-2 rounded-2xl border border-ochre/40 shadow-editorial flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <span className="text-sm">🎯</span>
          <span>
            <strong>Stamp Mode:</strong> Click anywhere on canvas to place{' '}
            <span className="text-ochre font-bold">
              {activeStamp.type === 'apparatus'
                ? activeStamp.name
                : activeStamp.type === 'equation'
                ? 'Chemical Equation'
                : activeStamp.type === 'mindmap'
                ? activeStamp.name
                : 'Organic Ring'}
            </span>
          </span>
          <button
            onClick={() => setActiveStamp(null)}
            className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-ivory-200 text-[11px] font-mono"
          >
            Cancel (ESC)
          </button>
        </div>
      )}

      {/* Infinite Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className={`w-full h-full block touch-none ${
          activeStamp
            ? 'cursor-copy'
            : isChemDrawActive
            ? 'cursor-crosshair'
            : tool === 'text'
            ? 'cursor-text'
            : tool === 'select'
            ? 'cursor-default'
            : 'cursor-crosshair'
        }`}
      />

      {/* Additional Modals */}
      <TableBuilderModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsert={(tbl) => {
          const newEl: TableElement = {
            ...tbl,
            id: `tbl-${Date.now()}`,
            zIndex: elements.length + 1,
          };
          pushHistory([...elements, newEl]);
        }}
      />

      <EnergyDiagramModal
        isOpen={isEnergyModalOpen}
        onClose={() => setIsEnergyModalOpen(false)}
        onInsert={(diag) => {
          const newEl: EnergyDiagramElement = {
            ...diag,
            id: `ed-${Date.now()}`,
            zIndex: elements.length + 1,
          };
          pushHistory([...elements, newEl]);
        }}
      />

      <BoardsManagerModal
        isOpen={isBoardsManagerOpen}
        currentBoardId={board.id}
        onClose={() => setIsBoardsManagerOpen(false)}
        onSelectBoard={(selected) => {
          setBoard(selected);
          setElements(selected.elements || []);
          setViewport(selected.viewport || { x: 80, y: 80, zoom: 1.0 });
          setBackground(selected.background || 'grid');
          setHistory([]);
          setRedoStack([]);
          setEditingEquation(null);
          setSelectedElementId(null);
        }}
        onCreateNewBoard={(newTitle) => {
          const newBoard: WhiteboardDocument = {
            id: `board-${Date.now()}`,
            title: newTitle,
            elements: [],
            viewport: { x: 80, y: 80, zoom: 1.0 },
            background: 'grid',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setBoard(newBoard);
          setElements([]);
          setViewport(newBoard.viewport);
          setBackground(newBoard.background);
          setHistory([]);
          setRedoStack([]);
          setEditingEquation(null);
          setSelectedElementId(null);
        }}
      />
    </div>
  );
};
