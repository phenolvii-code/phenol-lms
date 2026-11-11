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
  EnergyDiagramElement,
} from '@/types/whiteboard';
import {
  saveBoardToStorage,
  loadBoardFromStorage,
  createDefaultChemistryBoard,
} from '@/lib/whiteboard-storage';
import { WhiteboardHeader } from './WhiteboardHeader';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { ChemicalEquationModal } from './tools/ChemicalEquationModal';
import { MoleculeBuilderModal } from './tools/MoleculeBuilderModal';
import { TableBuilderModal } from './tools/TableBuilderModal';
import { EnergyDiagramModal } from './tools/EnergyDiagramModal';
import { BoardsManagerModal } from './tools/BoardsManagerModal';

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

  // Undo / Redo History Stacks
  const [history, setHistory] = useState<WhiteboardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardElement[][]>([]);

  // Modals Visibility
  const [isEquationModalOpen, setIsEquationModalOpen] = useState(false);
  const [isMoleculeModalOpen, setIsMoleculeModalOpen] = useState(false);
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

  // Keyboard Shortcuts (Undo, Redo, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
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
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, pushHistory, selectedElementId, elements]);

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
          ctx.fillStyle = f.color;
          ctx.font = `bold ${f.fontSize}px 'JetBrains Mono', monospace`;
          ctx.fillText(f.equation, f.x, f.y);

          if (f.subtitle) {
            ctx.fillStyle = '#6B7280';
            ctx.font = `italic ${Math.max(f.fontSize - 6, 12)}px Georgia, serif`;
            ctx.fillText(f.subtitle, f.x, f.y + 24);
          }

          if (f.deltaH) {
            ctx.fillStyle = f.deltaH.includes('-') ? '#047857' : '#B91C1C';
            ctx.font = `bold ${Math.max(f.fontSize - 4, 13)}px 'JetBrains Mono', monospace`;
            ctx.fillText(f.deltaH, f.x, f.y + (f.subtitle ? 46 : 26));
          }
          break;
        }

        case 'molecule': {
          const m = el as MoleculeElement;
          // Render Bonds
          m.bonds.forEach((b) => {
            const from = m.atoms.find((a) => a.id === b.fromAtomId);
            const to = m.atoms.find((a) => a.id === b.toAtomId);
            if (!from || !to) return;

            const x1 = m.x + from.x;
            const y1 = m.y + from.y;
            const x2 = m.x + to.x;
            const y2 = m.y + to.y;

            if (b.bondOrder === 2) {
              const dx = x2 - x1;
              const dy = y2 - y1;
              const len = Math.hypot(dx, dy) || 1;
              const nx = (-dy / len) * 3;
              const ny = (dx / len) * 3;

              ctx.strokeStyle = '#18191B';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(x1 + nx, y1 + ny);
              ctx.lineTo(x2 + nx, y2 + ny);
              ctx.moveTo(x1 - nx, y1 - ny);
              ctx.lineTo(x2 - nx, y2 - ny);
              ctx.stroke();
            } else {
              ctx.strokeStyle = '#18191B';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
          });

          // Render Atoms
          m.atoms.forEach((a) => {
            const ax = m.x + a.x;
            const ay = m.y + a.y;

            ctx.fillStyle = '#FAF8F5';
            ctx.beginPath();
            ctx.arc(ax, ay, a.symbol.length > 1 ? 12 : 9, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#501325';
            ctx.font = "bold 13px 'JetBrains Mono', monospace";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(a.symbol, ax, ay);

            // Lone pairs
            if (a.lonePairs === 2) {
              ctx.fillStyle = '#C9A038';
              ctx.beginPath();
              ctx.arc(ax - 5, ay - 11, 1.5, 0, Math.PI * 2);
              ctx.arc(ax + 5, ay - 11, 1.5, 0, Math.PI * 2);
              ctx.fill();
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

          // Molecule Name Tag
          ctx.fillStyle = '#6B7280';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(m.name, m.x, m.y + 75);
          break;
        }

        case 'table': {
          const t = el as TableElement;
          let currentY = t.y;

          // Header
          ctx.fillStyle = t.headerBgColor;
          ctx.fillRect(t.x, currentY, t.colWidths.reduce((a, b) => a + b, 0), t.rowHeight);

          let currentX = t.x;
          t.headers.forEach((h, idx) => {
            const w = t.colWidths[idx] || 150;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(currentX, currentY, w, t.rowHeight);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(h, currentX + 8, currentY + t.rowHeight / 2);
            currentX += w;
          });

          currentY += t.rowHeight;

          // Rows
          t.cells.forEach((row) => {
            currentX = t.x;
            row.forEach((cellVal, cIdx) => {
              const w = t.colWidths[cIdx] || 150;
              ctx.fillStyle = t.cellBgColor;
              ctx.fillRect(currentX, currentY, w, t.rowHeight);

              ctx.strokeStyle = t.borderColor;
              ctx.lineWidth = 1;
              ctx.strokeRect(currentX, currentY, w, t.rowHeight);

              ctx.fillStyle = '#18191B';
              ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(cellVal, currentX + 8, currentY + t.rowHeight / 2);
              currentX += w;
            });
            currentY += t.rowHeight;
          });
          break;
        }

        case 'energy_diagram': {
          const ed = el as EnergyDiagramElement;
          const baseY = ed.y + ed.height - 30;

          // Background box
          ctx.fillStyle = '#FAF8F5';
          ctx.strokeStyle = '#D1CDC4';
          ctx.lineWidth = 1;
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
        ctx.strokeRect(el.x - 6, el.y - 6, 40, 40);
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

    ctx.restore();
  }, [background, viewport, elements, selectedElementId, tool, color, size]);

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

  // Pointer Event Handlers (Stylus, Touch, Mouse)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;
    startScreenPosRef.current = { x: e.clientX, y: e.clientY };

    const worldPos = screenToCanvas(e.clientX, e.clientY);
    startCanvasPosRef.current = worldPos;

    // Pan with middle-click or spacebar or select tool
    if (e.button === 1 || e.buttons === 4 || (tool === 'select' && e.altKey)) {
      isPanningRef.current = true;
      return;
    }

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
      } else {
        setSelectedElementId(null);
        isPanningRef.current = true;
      }
      return;
    }

    if (tool === 'pen' || tool === 'highlighter') {
      currentPointsRef.current = [{ x: worldPos.x, y: worldPos.y, pressure: e.pressure || 0.5 }];
      renderCanvas();
      return;
    }

    if (tool === 'eraser') {
      // Point eraser: remove strokes within radius
      const filtered = elements.filter((el) => {
        return Math.hypot(el.x - worldPos.x, el.y - worldPos.y) > 30;
      });
      if (filtered.length !== elements.length) {
        pushHistory(filtered);
      }
      return;
    }

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
      const worldPos = screenToCanvas(e.clientX, e.clientY);
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

    const worldPos = screenToCanvas(e.clientX, e.clientY);

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

    // Zoom centered on cursor
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
        onSelectTool={setTool}
        currentColor={color}
        onSelectColor={setColor}
        currentSize={size}
        onSelectSize={setSize}
        currentShape={shapeKind}
        onSelectShape={setShapeKind}
        onOpenEquationModal={() => setIsEquationModalOpen(true)}
        onOpenMoleculeModal={() => setIsMoleculeModalOpen(true)}
        onOpenTableModal={() => setIsTableModalOpen(true)}
        onOpenEnergyModal={() => setIsEnergyModalOpen(true)}
        onClearCanvas={() => {
          if (confirm('Clear all drawings and elements on this board?')) {
            pushHistory([]);
          }
        }}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Infinite Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full block touch-none cursor-crosshair"
      />

      {/* Specialized Scientific Modals */}
      <ChemicalEquationModal
        isOpen={isEquationModalOpen}
        onClose={() => setIsEquationModalOpen(false)}
        onInsert={(formula) => {
          const newEl: ChemicalFormulaElement = {
            ...formula,
            id: `formula-${Date.now()}`,
            zIndex: elements.length + 1,
          };
          pushHistory([...elements, newEl]);
        }}
      />

      <MoleculeBuilderModal
        isOpen={isMoleculeModalOpen}
        onClose={() => setIsMoleculeModalOpen(false)}
        onInsert={(mol) => {
          const newEl: MoleculeElement = {
            ...mol,
            id: `mol-${Date.now()}`,
            zIndex: elements.length + 1,
          };
          pushHistory([...elements, newEl]);
        }}
      />

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
        }}
      />
    </div>
  );
};
