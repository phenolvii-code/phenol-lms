import { MindMapElement, MindMapNode } from '@/types/whiteboard';

/**
 * High-performance vector renderer for interactive hierarchical Mind Maps.
 */
export function renderMindMap(ctx: CanvasRenderingContext2D, el: MindMapElement): void {
  ctx.save();
  ctx.translate(el.x, el.y);

  function drawNode(node: MindMapNode, isRoot: boolean) {
    const nodeW = Math.max(node.text.length * 8.5 + 24, isRoot ? 160 : 120);
    const nodeH = isRoot ? 38 : 30;

    // Draw connector curves to children
    node.children?.forEach((child) => {
      ctx.save();
      ctx.strokeStyle = child.color || '#94A3B8';
      ctx.lineWidth = isRoot ? 2.5 : 2;
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      // Smooth cubic bezier curve
      const cpX1 = node.x + (child.x - node.x) * 0.5;
      const cpY1 = node.y;
      const cpX2 = node.x + (child.x - node.x) * 0.5;
      const cpY2 = child.y;
      ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, child.x, child.y);
      ctx.stroke();
      ctx.restore();

      drawNode(child, false);
    });

    // Draw Node Pill
    ctx.save();
    const nx = node.x - nodeW / 2;
    const ny = node.y - nodeH / 2;

    // Background fill & border
    ctx.fillStyle = isRoot ? (node.color || '#501325') : '#FFFFFF';
    ctx.strokeStyle = node.color || '#501325';
    ctx.lineWidth = isRoot ? 2 : 1.5;

    // Rounded rectangle path
    const r = isRoot ? 14 : 10;
    ctx.beginPath();
    ctx.moveTo(nx + r, ny);
    ctx.lineTo(nx + nodeW - r, ny);
    ctx.quadraticCurveTo(nx + nodeW, ny, nx + nodeW, ny + r);
    ctx.lineTo(nx + nodeW, ny + nodeH - r);
    ctx.quadraticCurveTo(nx + nodeW, ny + nodeH, nx + nodeW - r, ny + nodeH);
    ctx.lineTo(nx + r, ny + nodeH);
    ctx.quadraticCurveTo(nx, ny + nodeH, nx, ny + nodeH - r);
    ctx.lineTo(nx, ny + r);
    ctx.quadraticCurveTo(nx, ny, nx + r, ny);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Node Text
    ctx.fillStyle = isRoot ? '#FAF8F5' : '#18191B';
    ctx.font = `${isRoot ? 'bold 12px' : '500 11px'} 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.text, node.x, node.y);

    ctx.restore();
  }

  drawNode(el.rootNode, true);
  ctx.restore();
}
