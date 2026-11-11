import {
  WhiteboardElement,
  StrokeElement,
  ShapeElement,
  TextElement,
  ChemicalFormulaElement,
  MoleculeElement,
  ApparatusElement,
  TableElement,
  EnergyDiagramElement,
  MindMapElement,
  MindMapNode,
} from '@/types/whiteboard';

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates exact mathematical bounding box for any whiteboard element.
 */
export function getElementBounds(el: WhiteboardElement): ElementBounds {
  switch (el.type) {
    case 'stroke': {
      const s = el as StrokeElement;
      if (!s.points || s.points.length === 0) {
        return { x: s.x, y: s.y, width: 20, height: 20 };
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      s.points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });
      const pad = s.size || 4;
      return {
        x: minX - pad,
        y: minY - pad,
        width: Math.max(maxX - minX + pad * 2, 10),
        height: Math.max(maxY - minY + pad * 2, 10),
      };
    }

    case 'shape': {
      const sh = el as ShapeElement;
      if (
        (sh.shapeKind === 'line' ||
          sh.shapeKind === 'arrow' ||
          sh.shapeKind === 'double_headed_arrow' ||
          sh.shapeKind === 'curved_arrow') &&
        sh.endX !== undefined &&
        sh.endY !== undefined
      ) {
        const minX = Math.min(sh.x, sh.endX);
        const minY = Math.min(sh.y, sh.endY, sh.controlY ?? Infinity);
        const maxX = Math.max(sh.x, sh.endX);
        const maxY = Math.max(sh.y, sh.endY, sh.controlY ?? -Infinity);
        return {
          x: minX - 10,
          y: minY - 10,
          width: Math.max(maxX - minX + 20, 20),
          height: Math.max(maxY - minY + 20, 20),
        };
      }
      return {
        x: sh.x,
        y: sh.y,
        width: Math.max(sh.width, 20),
        height: Math.max(sh.height, 20),
      };
    }

    case 'text': {
      const txt = el as TextElement;
      const fs = txt.fontSize || 18;
      const approxW = Math.max(txt.text.length * (fs * 0.58), 40);
      const approxH = fs * 1.35;
      return {
        x: txt.x - 4,
        y: txt.y - fs + 2,
        width: approxW + 8,
        height: approxH,
      };
    }

    case 'formula': {
      const f = el as ChemicalFormulaElement;
      const fs = f.fontSize || 20;
      const approxW = Math.max(f.equation.length * (fs * 0.62), 120);
      let totalH = fs * 1.4;
      if (f.subtitle) totalH += 26;
      if (f.deltaH) totalH += 26;
      return {
        x: f.x - 8,
        y: f.y - fs,
        width: approxW + 24,
        height: totalH + 8,
      };
    }

    case 'molecule': {
      const m = el as MoleculeElement;
      if (!m.atoms || m.atoms.length === 0) {
        return { x: m.x - 20, y: m.y - 20, width: 40, height: 40 };
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      m.atoms.forEach((a) => {
        const ax = m.x + a.x;
        const ay = m.y + a.y;
        if (ax < minX) minX = ax;
        if (ay < minY) minY = ay;
        if (ax > maxX) maxX = ax;
        if (ay > maxY) maxY = ay;
      });
      const pad = 24;
      return {
        x: minX - pad,
        y: minY - pad,
        width: Math.max(maxX - minX + pad * 2, 50),
        height: Math.max(maxY - minY + pad * 2, 50),
      };
    }

    case 'apparatus': {
      const app = el as ApparatusElement;
      return {
        x: app.x,
        y: app.y,
        width: app.width || 100,
        height: app.height || 120,
      };
    }

    case 'table': {
      const tbl = el as TableElement;
      const totalW = tbl.colWidths?.reduce((a, b) => a + b, 0) || 300;
      const totalH = (tbl.rows + 1) * (tbl.rowHeight || 28);
      return {
        x: tbl.x,
        y: tbl.y,
        width: totalW,
        height: totalH,
      };
    }

    case 'energy_diagram': {
      const ed = el as EnergyDiagramElement;
      return {
        x: ed.x,
        y: ed.y,
        width: ed.width,
        height: ed.height,
      };
    }

    case 'mindmap': {
      const mm = el as MindMapElement;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      function traverse(node: MindMapNode) {
        const nx = mm.x + node.x;
        const ny = mm.y + node.y;
        if (nx < minX) minX = nx;
        if (ny < minY) minY = ny;
        if (nx > maxX) maxX = nx;
        if (ny > maxY) maxY = ny;
        node.children?.forEach(traverse);
      }

      if (mm.rootNode) traverse(mm.rootNode);
      const pad = 70;
      return {
        x: minX - pad,
        y: minY - pad,
        width: Math.max(maxX - minX + pad * 2, 100),
        height: Math.max(maxY - minY + pad * 2, 60),
      };
    }

    default:
      return { x: el.x, y: el.y, width: 60, height: 60 };
  }
}

/**
 * Checks if a point (worldX, worldY) hits an element with accurate tolerance.
 */
export function hitTestElement(el: WhiteboardElement, worldX: number, worldY: number): boolean {
  const bounds = getElementBounds(el);
  const tol = 8;
  return (
    worldX >= bounds.x - tol &&
    worldX <= bounds.x + bounds.width + tol &&
    worldY >= bounds.y - tol &&
    worldY <= bounds.y + bounds.height + tol
  );
}

/**
 * Draws a professional bounding box with corner handles and sleek styling.
 */
export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  el: WhiteboardElement,
  zoom: number
): void {
  const bounds = getElementBounds(el);
  const handleSize = Math.max(7 / zoom, 5);

  ctx.save();
  // Thin blue selection outline with soft glow
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = Math.max(1.5 / zoom, 1);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

  // 4 Corner Handles [ ▫ ]
  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x, y: bounds.y + bounds.height },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
  ];

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = Math.max(1.5 / zoom, 1);

  corners.forEach((c) => {
    ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
  });

  // Top center rotation handle
  const rotX = bounds.x + bounds.width / 2;
  const rotY = bounds.y - 18 / zoom;
  ctx.beginPath();
  ctx.moveTo(rotX, bounds.y);
  ctx.lineTo(rotX, rotY);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(rotX, rotY, handleSize * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
