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
  createCyclohexaneRing,
  createCyclopentaneRing,
} from './chem/chem-geometry';
import { InlineEquationBar } from './chem/InlineEquationBar';
import { TableBuilderModal } from './tools/TableBuilderModal';
import { EnergyDiagramModal } from './tools/EnergyDiagramModal';
import { BoardsManagerModal } from './tools/BoardsManagerModal';

interface ActiveStamp {
  type: 'apparatus' | 'equation' | 'ring_benzene' | 'ring_cyclohexane' | 'ring_cyclopentane';
  kind?: ApparatusKind;
  name?: string;
  width?: number;
  height?: number;
  liquidColor?: string;
  liquidLevel?: number;
}

function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
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
        if (activeStamp) {
          setActiveStamp(null);
        }
        if (isChemDrawActive) {
          setIsChemDrawActive(false);
        }
        if (editingEquation) {
          setEditingEquation(null);
        }
        if (isApparatusDrawerOpen) {
          setIsApparatusDrawerOpen(false);
        }
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
  }, [handleUndo, handleRedo, pushHistory, selectedElementId, elements, activeStamp, isChemDrawActive, editingEquation, isApparatusDrawerOpen]);

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
    ctx.fillStyle = isDark ? '#141416' : '#FAF8F5'; // Dark chalkboard vs Ivory
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
          ctx.strokeStyle = sh.strokeColor;
          ctx.lineWidth = sh.strokeWidth;
          if (sh.fillColor) {
            ctx.fillStyle = sh.fillColor;
          }

          if (sh.shapeKind === 'rectangle') {
            ctx.strokeRect(sh.x, sh.y, sh.width, sh.height);
            if (sh.fillColor) ctx.fillRect(sh.x, sh.y, sh.width, sh.height);
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
          } else if (sh.shapeKind === 'arrow' && sh.endX !== undefined && sh.endY !== undefined) {
            ctx.beginPath();
            ctx.moveTo(sh.x, sh.y);
            ctx.lineTo(sh.endX, sh.endY);
            ctx.stroke();

            // Arrow head
            const angle = Math.atan2(sh.endY - sh.y, sh.endX - sh.x);
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

        case 'molecule': {
          const m = el as MoleculeElement;
          const showDetailedLewis = m.showCarbons ?? isLewisMode;

          // 1. Render Bonds with proper ChemDraw orders
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
            ctx.lineWidth = 2.5;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;
            const nx = (-dy / len) * 3.5;
            const ny = (dx / len) * 3.5;

            if (b.bondOrder === 2) {
              // Double Bond (Parallel)
              ctx.beginPath();
              ctx.moveTo(x1 + nx, y1 + ny);
              ctx.lineTo(x2 + nx, y2 + ny);
              ctx.moveTo(x1 - nx, y1 - ny);
              ctx.lineTo(x2 - nx, y2 - ny);
              ctx.stroke();
            } else if (b.bondOrder === 3) {
              // Triple Bond
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.moveTo(x1 + nx * 1.5, y1 + ny * 1.5);
              ctx.lineTo(x2 + nx * 1.5, y2 + ny * 1.5);
              ctx.moveTo(x1 - nx * 1.5, y1 - ny * 1.5);
              ctx.lineTo(x2 - nx * 1.5, y2 - ny * 1.5);
              ctx.stroke();
            } else if (b.bondOrder === 'wedge') {
              // Wedged Stereochemical Bond (Tapered)
              ctx.fillStyle = isHovered ? '#0284C7' : '#18191B';
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2 + nx * 2, y2 + ny * 2);
              ctx.lineTo(x2 - nx * 2, y2 - ny * 2);
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

            // Hover indicator outline
            if (isHovered) {
              ctx.strokeStyle = '#38BDF8';
              ctx.lineWidth = 1;
              ctx.setLineDash([2, 2]);
              ctx.strokeRect((x1 + x2) / 2 - 8, (y1 + y2) / 2 - 8, 16, 16);
              ctx.setLineDash([]);
            }
          });

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

            // Formal Charge (+ / -) badge
            if (a.charge) {
              const cx = ax + 11;
              const cy = ay - 9;
              ctx.fillStyle = a.charge > 0 ? '#DC2626' : '#2563EB';
              ctx.beginPath();
              ctx.arc(cx, cy, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 9px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(a.charge > 0 ? '+' : '−', cx, cy);
            }

            // Lone pairs
            if (a.lonePairs === 2) {
              ctx.fillStyle = '#D97706';
              ctx.beginPath();
              ctx.arc(ax - 5, ay - 13, 2, 0, Math.PI * 2);
              ctx.arc(ax + 5, ay - 13, 2, 0, Math.PI * 2);
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

          // Mechanism Curved Arrows
          m.curvedArrows?.forEach((ca) => {
            ctx.strokeStyle = '#D97706';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 2]);
            ctx.beginPath();
            ctx.moveTo(m.x + ca.startX, m.y + ca.startY);
            ctx.quadraticCurveTo(
              m.x + ca.controlX,
              m.y + ca.controlY,
              m.x + ca.endX,
              m.y + ca.endY
            );
            ctx.stroke();
            ctx.setLineDash([]);
          });

          // Molecule Name Tag if named
          if (m.name && m.name.trim() !== '') {
            ctx.fillStyle = '#6B7280';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(m.name, m.x, m.y + 75);
          }
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

          // Frame
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#E5E7EB';
          ctx.lineWidth = 1.5;
          ctx.fillRect(ed.x, ed.y, ed.width, ed.height);
          ctx.strokeRect(ed.x, ed.y, ed.width, ed.height);

          // Title
          ctx.fillStyle = '#501325';
          ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
          ctx.textAlign = 'left';
          ctx.fillText(ed.reactionName, ed.x + 16, ed.y + 24);

          // Axes
          ctx.strokeStyle = '#454952';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ed.x + 40, baseY);
          ctx.lineTo(ed.x + ed.width - 20, baseY);
          ctx.moveTo(ed.x + 40, baseY);
          ctx.lineTo(ed.x + 40, ed.y + 40);
          ctx.stroke();

          // Labels
          ctx.fillStyle = '#6B7280';
          ctx.font = '10px sans-serif';
          ctx.fillText('Reaction Coordinate', ed.x + ed.width - 110, baseY + 18);
          ctx.fillText('Potential Energy', ed.x + 45, ed.y + 48);

          // Energy Levels
          const rxY = ed.isExothermic ? baseY - 80 : baseY - 50;
          const prY = ed.isExothermic ? baseY - 30 : baseY - 90;
          const peakY = ed.y + 70;

          // Reactants plateau
          ctx.strokeStyle = '#501325';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ed.x + 40, rxY);
          ctx.lineTo(ed.x + 120, rxY);
          ctx.stroke();

          // Curve
          ctx.beginPath();
          ctx.moveTo(ed.x + 120, rxY);
          ctx.quadraticCurveTo(ed.x + 220, peakY, ed.x + 320, prY);
          ctx.stroke();

          // Products plateau
          ctx.beginPath();
          ctx.moveTo(ed.x + 320, prY);
          ctx.lineTo(ed.x + 420, prY);
          ctx.stroke();

          // Annotations
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

      // Selection bounding box indicator
      if (isSelected) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(el.x - 8, el.y - 8, 45, 45);
        ctx.setLineDash([]);
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

    // 5. Render Cursor Ghost Preview (يحول السهم للحاجة اللي بضيفها)
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

        // Ghost placement guide
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(ghostX, ghostY, activeStamp.width || 100, activeStamp.height || 120);
      } else if (activeStamp.type === 'equation') {
        ctx.fillStyle = '#501325';
        ctx.font = "bold 20px 'JetBrains Mono', monospace";
        ctx.fillText('2H₂ + O₂ → 2H₂O', ghostX, ghostY);
        ctx.strokeStyle = '#501325';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(ghostX - 10, ghostY - 24, 250, 42);
      } else if (activeStamp.type === 'ring_benzene') {
        const ring = createBenzeneRing(ghostX, ghostY);
        ring.bonds.forEach((b) => {
          const from = ring.atoms.find((a) => a.id === b.fromAtomId);
          const to = ring.atoms.find((a) => a.id === b.toAtomId);
          if (from && to) {
            ctx.strokeStyle = '#501325';
            ctx.lineWidth = 2.5;
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
            ctx.lineWidth = 2.5;
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
            ctx.lineWidth = 2.5;
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

      if (
        activeStamp.type === 'ring_benzene' ||
        activeStamp.type === 'ring_cyclohexane' ||
        activeStamp.type === 'ring_cyclopentane'
      ) {
        let ringData;
        let ringName = 'Benzene';
        if (activeStamp.type === 'ring_cyclopentane') {
          ringData = createCyclopentaneRing(0, 0);
          ringName = 'Cyclopentane';
        } else if (activeStamp.type === 'ring_cyclohexane') {
          ringData = createCyclohexaneRing(0, 0);
          ringName = 'Cyclohexane';
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
      // Find if clicked near an existing atom
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

      // Find if clicked near an existing bond
      let clickedBond: ChemBond | null = null;
      if (!clickedAtom) {
        for (const el of elements) {
          if (el.type === 'molecule') {
            const m = el as MoleculeElement;
            for (const b of m.bonds) {
              const a1 = m.atoms.find((a) => a.id === b.fromAtomId);
              const a2 = m.atoms.find((a) => a.id === b.toAtomId);
              if (a1 && a2) {
                const dist = distanceToSegment(
                  worldPos.x,
                  worldPos.y,
                  m.x + a1.x,
                  m.y + a1.y,
                  m.x + a2.x,
                  m.y + a2.y
                );
                if (dist < 10) {
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

      // Process ChemDraw Sub-tool
      if (activeChemSubTool === 'zigzag_chain') {
        if (clickedAtom && clickedMolecule) {
          // Sprout zigzag link from existing atom!
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
          // Start brand new molecule at world click position!
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
          // Cycle bond order: 1 -> 2 -> 3 -> wedge -> dash -> 1
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

      if (activeChemSubTool === 'ring_benzene') {
        const ring = createBenzeneRing(worldPos.x, worldPos.y);
        const newMol: MoleculeElement = {
          id: `mol-${Date.now()}`,
          type: 'molecule',
          name: 'Benzene',
          x: worldPos.x,
          y: worldPos.y,
          atoms: ring.atoms.map((a) => ({ ...a, x: a.x - worldPos.x, y: a.y - worldPos.y })),
          bonds: ring.bonds,
          curvedArrows: [],
          showCarbons: isLewisMode,
          zIndex: elements.length + 1,
        };
        pushHistory([...elements, newMol]);
        setSelectedElementId(newMol.id);
        return;
      }
    }

    // 3. SELECT & MOVE TOOL
    if (tool === 'select') {
      // Find clicked element
      const hit = [...elements].reverse().find((el) => {
        return Math.hypot(el.x - worldPos.x, el.y - worldPos.y) < 60;
      });

      if (hit) {
        setSelectedElementId(hit.id);
        draggedElementRef.current = {
          elementId: hit.id,
          origX: hit.x,
          origY: hit.y,
          startPoint: worldPos,
        };

        // If it's a formula element, open the in-canvas equation editor immediately!
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

    // 5. ERASER
    if (tool === 'eraser') {
      const filtered = elements.filter((el) => {
        return Math.hypot(el.x - worldPos.x, el.y - worldPos.y) > 30;
      });
      if (filtered.length !== elements.length) {
        pushHistory(filtered);
      }
      return;
    }

    // 6. TEXT NOTE
    if (tool === 'text') {
      const input = prompt('Enter lecture text:');
      if (input && input.trim()) {
        const newText: TextElement = {
          id: `txt-${Date.now()}`,
          type: 'text',
          x: worldPos.x,
          y: worldPos.y,
          text: input.trim(),
          fontSize: 18,
          color,
          zIndex: elements.length + 1,
        };
        pushHistory([...elements, newText]);
        setTool('select');
      }
      isPointerDownRef.current = false;
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

    // If stamp is active, re-render to update the ghost preview position smoothly
    if (activeStamp) {
      renderCanvas();
    }

    // In ChemDraw mode, detect hovered atom or bond for visual feedback
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
          if (!hovered) {
            for (const b of m.bonds) {
              const a1 = m.atoms.find((a) => a.id === b.fromAtomId);
              const a2 = m.atoms.find((a) => a.id === b.toAtomId);
              if (a1 && a2) {
                if (
                  distanceToSegment(
                    worldPos.x,
                    worldPos.y,
                    m.x + a1.x,
                    m.y + a1.y,
                    m.x + a2.x,
                    m.y + a2.y
                  ) < 10
                ) {
                  hovered = { moleculeId: m.id, type: 'bond', id: b.id };
                  break;
                }
              }
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
      const filtered = elements.filter((el) => {
        return Math.hypot(el.x - worldPos.x, el.y - worldPos.y) > 30;
      });
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
        }}
        currentColor={color}
        onSelectColor={setColor}
        currentSize={size}
        onSelectSize={setSize}
        currentShape={shapeKind}
        onSelectShape={setShapeKind}
        onToggleChemDraw={() => {
          setIsChemDrawActive((prev) => !prev);
          setIsApparatusDrawerOpen(false);
          setActiveStamp(null);
        }}
        isChemDrawActive={isChemDrawActive}
        onToggleApparatusDrawer={() => {
          setIsApparatusDrawerOpen((prev) => !prev);
          setIsChemDrawActive(false);
          setActiveStamp(null);
        }}
        isApparatusDrawerOpen={isApparatusDrawerOpen}
        onActivateEquationStamp={() => {
          setActiveStamp({ type: 'equation' });
          setIsChemDrawActive(false);
          setIsApparatusDrawerOpen(false);
        }}
        isEquationStampActive={activeStamp?.type === 'equation'}
        onOpenTableModal={() => setIsTableModalOpen(true)}
        onOpenEnergyModal={() => setIsEnergyModalOpen(true)}
        onClearCanvas={() => {
          if (confirm('Clear all drawings and elements on this board?')) {
            pushHistory([]);
            setEditingEquation(null);
          }
        }}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Mini-ChemDraw Floating Control Dock */}
      {isChemDrawActive && (
        <ChemDrawToolbar
          activeSubTool={activeChemSubTool}
          onSelectSubTool={(st) => {
            setActiveChemSubTool(st);
            if (st === 'ring_benzene') {
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

      {/* Laboratory Apparatus Drawer */}
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
          activeStamp ? 'cursor-copy' : isChemDrawActive ? 'cursor-crosshair' : 'cursor-default'
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
        }}
      />
    </div>
  );
};
