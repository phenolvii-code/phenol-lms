import { ApparatusElement } from '@/types/whiteboard';

/**
 * High-Precision Vector Canvas Renderer for Chemical Laboratory Apparatus.
 * Purpose-built for Dr. Omar Magdi's chemistry lecture recording and demonstrations.
 */
export function renderApparatus(ctx: CanvasRenderingContext2D, el: ApparatusElement): void {
  const { x, y, kind, width, height, liquidColor = '#2563EB', liquidLevel = 0.5 } = el;

  ctx.save();
  ctx.translate(x, y);

  const glassStroke = '#2D3748';
  const glassHighlight = 'rgba(255, 255, 255, 0.6)';
  const standColor = '#1F2937';
  const metalRod = '#4B5563';
  const meniscusFill = liquidColor;

  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (kind) {
    case 'beaker': {
      const w = width;
      const h = height;
      const r = 8;
      const liqH = (h - 20) * Math.min(Math.max(liquidLevel, 0.1), 0.9);

      // Liquid
      ctx.fillStyle = meniscusFill;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.rect(6, h - liqH, w - 12, liqH - 6);
      ctx.fill();

      // Liquid Meniscus curve
      ctx.beginPath();
      ctx.ellipse(w / 2, h - liqH, (w - 12) / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Beaker Body
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Spout at top left
      ctx.moveTo(0, 8);
      ctx.lineTo(8, 12);
      ctx.lineTo(8, h - r);
      ctx.quadraticCurveTo(8, h, 8 + r, h);
      ctx.lineTo(w - r, h);
      ctx.quadraticCurveTo(w, h, w, h - r);
      ctx.lineTo(w, 12);
      ctx.lineTo(w + 4, 8);
      ctx.stroke();

      // Graduation Ticks
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 4; i++) {
        const tickY = h - 20 - i * ((h - 40) / 4);
        ctx.beginPath();
        ctx.moveTo(12, tickY);
        ctx.lineTo(24, tickY);
        ctx.stroke();
      }

      // Glass highlight line
      ctx.strokeStyle = glassHighlight;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(14, 25);
      ctx.lineTo(14, h - 18);
      ctx.stroke();
      break;
    }

    case 'erlenmeyer': {
      const w = width;
      const h = height;
      const neckW = 28;
      const neckH = 32;
      const liqH = (h - neckH - 15) * Math.min(Math.max(liquidLevel, 0.1), 0.85);

      // Liquid trapezoid
      const baseLiqW = w - 16;
      const topLiqRatio = 1 - liqH / (h - neckH);
      const topLiqW = neckW + (baseLiqW - neckW) * topLiqRatio;

      ctx.fillStyle = meniscusFill;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(w / 2 - topLiqW / 2, h - liqH);
      ctx.lineTo(w / 2 + topLiqW / 2, h - liqH);
      ctx.lineTo(w - 10, h - 8);
      ctx.lineTo(10, h - 8);
      ctx.closePath();
      ctx.fill();

      // Meniscus top
      ctx.beginPath();
      ctx.ellipse(w / 2, h - liqH, topLiqW / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Flask outline
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Lip
      ctx.moveTo(w / 2 - neckW / 2 - 4, 8);
      ctx.lineTo(w / 2 + neckW / 2 + 4, 8);
      // Neck right
      ctx.moveTo(w / 2 + neckW / 2, 8);
      ctx.lineTo(w / 2 + neckW / 2, neckH);
      // Body right slope
      ctx.lineTo(w - 6, h - 10);
      ctx.quadraticCurveTo(w - 2, h, w - 14, h);
      // Base
      ctx.lineTo(14, h);
      ctx.quadraticCurveTo(2, h, 6, h - 10);
      // Body left slope
      ctx.lineTo(w / 2 - neckW / 2, neckH);
      ctx.lineTo(w / 2 - neckW / 2, 8);
      ctx.stroke();

      // Graduations
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 3; i++) {
        const tickY = h - 25 - i * 22;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 20, tickY);
        ctx.lineTo(w / 2 - 6, tickY);
        ctx.stroke();
      }
      break;
    }

    case 'round_bottom_flask': {
      const w = width;
      const h = height;
      const neckW = 22;
      const neckH = 45;
      const r = (w - 16) / 2;
      const cx = w / 2;
      const cy = h - r - 4;

      // Liquid in bulb
      ctx.fillStyle = meniscusFill;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 3, 0.2, Math.PI - 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Glass Body
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Lip
      ctx.moveTo(cx - neckW / 2 - 4, 8);
      ctx.lineTo(cx + neckW / 2 + 4, 8);
      // Neck
      ctx.moveTo(cx + neckW / 2, 8);
      ctx.lineTo(cx + neckW / 2, neckH);
      // Arc bulb
      ctx.arc(cx, cy, r, -Math.PI / 2 + 0.35, Math.PI * 1.5 - 0.35, false);
      ctx.lineTo(cx - neckW / 2, neckH);
      ctx.lineTo(cx - neckW / 2, 8);
      ctx.stroke();
      break;
    }

    case 'distilling_flask': {
      const w = width;
      const h = height;
      const neckW = 22;
      const neckH = 50;
      const r = 36;
      const cx = 45;
      const cy = h - r - 6;

      // Liquid
      ctx.fillStyle = meniscusFill;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 3, 0.2, Math.PI - 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Body & Neck
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Lip
      ctx.moveTo(cx - neckW / 2 - 3, 8);
      ctx.lineTo(cx + neckW / 2 + 3, 8);
      // Neck Right
      ctx.moveTo(cx + neckW / 2, 8);
      ctx.lineTo(cx + neckW / 2, 28);
      // Side arm exit
      ctx.lineTo(w - 10, 60);
      ctx.lineTo(w - 6, 68);
      ctx.lineTo(cx + neckW / 2, 40);
      ctx.lineTo(cx + neckW / 2, neckH);
      // Round bulb
      ctx.arc(cx, cy, r, -Math.PI / 2 + 0.35, Math.PI * 1.5 - 0.35, false);
      ctx.lineTo(cx - neckW / 2, neckH);
      ctx.lineTo(cx - neckW / 2, 8);
      ctx.stroke();
      break;
    }

    case 'test_tube': {
      const w = width;
      const h = height;
      const r = (w - 10) / 2;
      const liqH = (h - 25) * Math.min(Math.max(liquidLevel, 0.1), 0.85);

      // Liquid
      ctx.fillStyle = meniscusFill;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.rect(5, h - liqH, w - 10, liqH - r);
      ctx.arc(w / 2, h - r - 2, r, 0, Math.PI);
      ctx.fill();
      // Meniscus
      ctx.beginPath();
      ctx.ellipse(w / 2, h - liqH, r, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Test Tube glass
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Flared rim
      ctx.moveTo(1, 8);
      ctx.lineTo(w - 1, 8);
      // Sides & round bottom
      ctx.moveTo(5, 8);
      ctx.lineTo(5, h - r - 2);
      ctx.arc(w / 2, h - r - 2, r, Math.PI, 0, true);
      ctx.lineTo(w - 5, 8);
      ctx.stroke();
      break;
    }

    case 'test_tube_rack': {
      const w = width;
      const h = height;
      // Rack stand wood/acrylic
      ctx.fillStyle = '#D4A373';
      ctx.strokeStyle = '#8D5B4C';
      ctx.lineWidth = 2;

      // Top bar with holes
      ctx.fillRect(8, 28, w - 16, 12);
      ctx.strokeRect(8, 28, w - 16, 12);

      // Base plate
      ctx.fillRect(4, h - 18, w - 8, 14);
      ctx.strokeRect(4, h - 18, w - 8, 14);

      // Side posts
      ctx.fillRect(8, 28, 12, h - 46);
      ctx.strokeRect(8, 28, 12, h - 46);
      ctx.fillRect(w - 20, 28, 12, h - 46);
      ctx.strokeRect(w - 20, 28, 12, h - 46);

      // 5 Test Tubes resting in rack
      const colors = ['#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED'];
      const spacing = (w - 48) / 5;
      for (let i = 0; i < 5; i++) {
        const tx = 28 + i * spacing;
        // Tube glass
        ctx.strokeStyle = glassStroke;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(tx, 14, 14, h - 34);

        // Liquid inside
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.65;
        ctx.fillRect(tx + 2, 38 + (i % 3) * 10, 10, h - 60);
        ctx.globalAlpha = 1.0;
      }
      break;
    }

    case 'burette_stand': {
      const w = width;
      const h = height;

      // Heavy Cast Iron Stand Base
      ctx.fillStyle = standColor;
      ctx.fillRect(10, h - 14, w - 20, 14);
      ctx.strokeStyle = '#111827';
      ctx.strokeRect(10, h - 14, w - 20, 14);

      // Metal Upright Rod
      ctx.fillStyle = metalRod;
      ctx.fillRect(25, 10, 8, h - 24);

      // Buret Clamp
      ctx.fillStyle = '#6B7280';
      ctx.fillRect(22, 50, 42, 10);
      ctx.fillRect(58, 44, 8, 22);

      // Glass Burette Tube
      const bx = 62;
      const bw = 14;
      const bh = h - 65;

      // Liquid in burette
      ctx.fillStyle = meniscusFill;
      ctx.globalAlpha = 0.65;
      ctx.fillRect(bx + 2, 40, bw - 4, bh - 30);
      ctx.globalAlpha = 1.0;

      // Glass walls
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, 20, bw, bh);

      // Graduations on burette (0 to 50 mL ticks)
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      for (let i = 0; i < 18; i++) {
        const ty = 25 + i * ((bh - 40) / 18);
        ctx.beginPath();
        ctx.moveTo(bx + 2, ty);
        ctx.lineTo(bx + (i % 5 === 0 ? 9 : 5), ty);
        ctx.stroke();
      }

      // Stopcock valve & jet tip
      ctx.fillStyle = '#DC2626'; // Red PTFE stopcock handle
      ctx.fillRect(bx - 4, 20 + bh - 18, bw + 8, 8);
      // Tapered delivery jet
      ctx.beginPath();
      ctx.moveTo(bx + 3, 20 + bh);
      ctx.lineTo(bx + bw - 3, 20 + bh);
      ctx.lineTo(bx + bw / 2, 20 + bh + 16);
      ctx.closePath();
      ctx.fillStyle = glassStroke;
      ctx.fill();

      // Hanging droplet
      ctx.fillStyle = meniscusFill;
      ctx.beginPath();
      ctx.arc(bx + bw / 2, 20 + bh + 22, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'bunsen_burner_tripod': {
      const w = width;
      const h = height;

      // Metal Tripod Stand
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      // Left leg
      ctx.moveTo(15, h - 4);
      ctx.lineTo(35, 60);
      // Right leg
      ctx.moveTo(w - 15, h - 4);
      ctx.lineTo(w - 35, 60);
      // Middle back leg
      ctx.moveTo(w / 2, h - 16);
      ctx.lineTo(w / 2, 60);
      ctx.stroke();

      // Tripod Triangular/Ring Collar
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(30, 56, w - 60, 8);

      // Wire Gauze with Ceramic Center
      ctx.fillStyle = '#9CA3AF';
      ctx.fillRect(25, 48, w - 50, 7);
      ctx.fillStyle = '#F3F4F6'; // White ceramic heat circle
      ctx.beginPath();
      ctx.arc(w / 2, 51, 14, 0, Math.PI * 2);
      ctx.fill();

      // Bunsen Burner in center
      const bx = w / 2;
      // Heavy round base
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.ellipse(bx, h - 10, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gas inlet tube
      ctx.strokeStyle = '#DC2626'; // Rubber red tubing
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bx + 12, h - 14);
      ctx.quadraticCurveTo(w + 10, h - 10, w + 20, h - 2);
      ctx.stroke();

      // Metal Barrel
      ctx.fillStyle = '#6B7280';
      ctx.fillRect(bx - 5, 85, 10, h - 100);

      // Air hole collar
      ctx.fillStyle = '#374151';
      ctx.fillRect(bx - 6, h - 35, 12, 10);

      // Flame (Outer light blue cone, inner dark cyan cone)
      ctx.fillStyle = 'rgba(59, 130, 246, 0.7)'; // Non-luminous roaring blue
      ctx.beginPath();
      ctx.moveTo(bx - 7, 85);
      ctx.quadraticCurveTo(bx - 12, 65, bx, 46);
      ctx.quadraticCurveTo(bx + 12, 65, bx + 7, 85);
      ctx.closePath();
      ctx.fill();

      // Inner cone
      ctx.fillStyle = 'rgba(147, 197, 253, 0.9)';
      ctx.beginPath();
      ctx.moveTo(bx - 4, 85);
      ctx.quadraticCurveTo(bx - 6, 72, bx, 58);
      ctx.quadraticCurveTo(bx + 6, 72, bx + 4, 85);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'liebig_condenser': {
      const w = width;
      const h = height;

      // Inner Vapor Tube (passing through)
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, h / 2 - 6);
      ctx.lineTo(w, h / 2 - 6);
      ctx.moveTo(0, h / 2 + 6);
      ctx.lineTo(w, h / 2 + 6);
      ctx.stroke();

      // Outer Cooling Water Jacket
      const jx = 25;
      const jw = w - 50;
      const jh = 32;
      const jy = h / 2 - jh / 2;

      // Flowing blue water
      ctx.fillStyle = 'rgba(147, 197, 253, 0.55)';
      ctx.fillRect(jx, jy, jw, jh);

      // Jacket Glass Outline
      ctx.strokeRect(jx, jy, jw, jh);

      // Water In Port (bottom right)
      ctx.strokeRect(w - 55, jy + jh, 12, 14);
      // Water Out Port (top left)
      ctx.strokeRect(jx + 18, jy - 14, 12, 14);

      // Direction Arrows
      ctx.fillStyle = '#2563EB';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Water In', w - 62, jy + jh + 24);
      ctx.fillText('Water Out', jx + 6, jy - 18);
      break;
    }

    case 'separatory_funnel': {
      const w = width;
      const h = height;
      const cx = w / 2;

      // Pear-shaped body
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - 10, 16);
      ctx.lineTo(cx + 10, 16);
      ctx.bezierCurveTo(cx + 42, 45, cx + 38, 90, cx + 5, 125);
      ctx.lineTo(cx + 4, 155);
      ctx.lineTo(cx - 4, 155);
      ctx.lineTo(cx - 5, 125);
      ctx.bezierCurveTo(cx - 38, 90, cx - 42, 45, cx - 10, 16);
      ctx.closePath();
      ctx.clip();

      // Lower Aqueous Phase
      ctx.fillStyle = '#3B82F6';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(0, 85, w, 70);

      // Upper Organic Ether Phase
      ctx.fillStyle = '#F59E0B';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(0, 35, w, 50);

      // Phase boundary line
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 35, 85);
      ctx.lineTo(cx + 35, 85);
      ctx.stroke();
      ctx.restore();

      // Outer outline
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 10, 16);
      ctx.lineTo(cx + 10, 16);
      ctx.bezierCurveTo(cx + 42, 45, cx + 38, 90, cx + 5, 125);
      ctx.lineTo(cx + 4, 155);
      ctx.lineTo(cx - 4, 155);
      ctx.lineTo(cx - 5, 125);
      ctx.bezierCurveTo(cx - 38, 90, cx - 42, 45, cx - 10, 16);
      ctx.stroke();

      // Glass Stopper at top
      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.ellipse(cx, 12, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stopcock Tap
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(cx - 12, 138, 24, 7);
      break;
    }

    case 'boiling_delivery_tube': {
      const w = width;
      const h = height;

      // Tilted Boiling Tube (Horizontal/Angled setup for gas prep)
      ctx.save();
      ctx.translate(20, 20);
      ctx.rotate((15 * Math.PI) / 180);

      // Solid Reactant (e.g. Sodium acetate + Soda lime)
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(8, 40, 18, 45);

      // Boiling Tube Glass
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(6, 10, 22, 85);
      ctx.beginPath();
      ctx.arc(17, 95, 11, 0, Math.PI);
      ctx.stroke();

      // Rubber Stopper
      ctx.fillStyle = '#374151';
      ctx.fillRect(8, 8, 18, 12);
      ctx.restore();

      // Bent Glass Delivery Tube (L-elbow leading to collector)
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(35, 28);
      ctx.lineTo(85, 20);
      ctx.lineTo(w - 20, 75);
      ctx.lineTo(w - 20, h - 15);
      ctx.stroke();
      break;
    }

    case 'gas_collecting_trough': {
      const w = width;
      const h = height;

      // Transparent Pneumatic Water Trough
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(15, h - 50, w - 30, 42);
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(15, h - 50, w - 30, 42);

      // Beehive shelf
      ctx.fillStyle = '#6B7280';
      ctx.fillRect(w / 2 - 25, h - 35, 50, 25);

      // Inverted Gas Jar
      const jw = 40;
      const jh = 80;
      const jx = w / 2 - jw / 2;
      const jy = h - 45 - jh;

      // Gas bubble zone (collected methane/ethylene)
      ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
      ctx.fillRect(jx + 3, jy + 3, jw - 6, jh - 25);

      // Gas jar outline
      ctx.strokeRect(jx, jy, jw, jh);

      // Gas Bubbles rising
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(w / 2 + (i % 2 === 0 ? 4 : -4), h - 40 - i * 18, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'graduated_cylinder': {
      const w = width;
      const h = height;
      const cw = 28;
      const cx = w / 2 - cw / 2;
      const liqH = (h - 40) * Math.min(Math.max(liquidLevel, 0.1), 0.9);

      // Hexagonal Anti-Roll Base
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(cx - 14, h - 4);
      ctx.lineTo(cx + cw + 14, h - 4);
      ctx.lineTo(cx + cw + 10, h - 14);
      ctx.lineTo(cx - 10, h - 14);
      ctx.closePath();
      ctx.fill();

      // Liquid
      ctx.fillStyle = meniscusFill;
      ctx.globalAlpha = 0.65;
      ctx.fillRect(cx + 3, h - 14 - liqH, cw - 6, liqH);
      ctx.globalAlpha = 1.0;

      // Glass Cylinder
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(cx, 15, cw, h - 29);

      // Pour Spout at Top
      ctx.beginPath();
      ctx.moveTo(cx, 15);
      ctx.lineTo(cx - 5, 10);
      ctx.stroke();

      // Calibration Graduations
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      for (let i = 0; i < 15; i++) {
        const ty = 24 + i * ((h - 45) / 15);
        ctx.beginPath();
        ctx.moveTo(cx + 3, ty);
        ctx.lineTo(cx + (i % 5 === 0 ? 12 : 7), ty);
        ctx.stroke();
      }
      break;
    }

    case 'thermometer': {
      const w = width;
      const h = height;
      const cx = w / 2;

      // Glass stem
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 4, 15, 8, h - 35);

      // Red Reservoir Bulb at bottom
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(cx, h - 14, 9, 0, Math.PI * 2);
      ctx.fill();

      // Red Alcohol Thread
      ctx.fillRect(cx - 1.5, 45, 3, h - 60);

      // Degree Scale Ticks
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      for (let i = 0; i < 16; i++) {
        const ty = 30 + i * ((h - 60) / 16);
        ctx.beginPath();
        ctx.moveTo(cx + 4, ty);
        ctx.lineTo(cx + 9, ty);
        ctx.stroke();
      }
      break;
    }

    case 'dropper': {
      const w = width;
      const h = height;
      const cx = w / 2;

      // Red Rubber Bulb
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(cx, 22, 14, 0, Math.PI * 2);
      ctx.fill();

      // Glass Pipette Body
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 5, 32);
      ctx.lineTo(cx + 5, 32);
      ctx.lineTo(cx + 4, h - 25);
      ctx.lineTo(cx + 1, h - 8);
      ctx.lineTo(cx - 1, h - 8);
      ctx.lineTo(cx - 4, h - 25);
      ctx.closePath();
      ctx.stroke();

      // Falling Solution Droplet
      ctx.fillStyle = meniscusFill;
      ctx.beginPath();
      ctx.arc(cx, h - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'buchner_funnel': {
      const w = width;
      const h = height;
      const cx = w / 2;

      // Side-arm Filtering Flask (thick vacuum walls)
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Flask base & cone
      ctx.moveTo(cx - 40, h - 8);
      ctx.lineTo(cx + 40, h - 8);
      ctx.lineTo(cx + 16, 65);
      ctx.lineTo(cx + 16, 50);
      ctx.lineTo(cx - 16, 50);
      ctx.lineTo(cx - 16, 65);
      ctx.closePath();
      ctx.stroke();

      // Vacuum nipple side-arm
      ctx.strokeRect(cx + 16, 54, 18, 6);

      // Rubber adapter collar
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(cx - 14, 44, 28, 8);

      // Porcelain Buchner Funnel
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#475569';
      ctx.fillRect(cx - 35, 12, 70, 32);
      ctx.strokeRect(cx - 35, 12, 70, 32);

      // Stem into flask
      ctx.strokeRect(cx - 5, 44, 10, 35);
      break;
    }

    case 'crucible_tripod': {
      const w = width;
      const h = height;

      // Pipeclay Triangle
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(15, 65);
      ctx.lineTo(w - 15, 65);
      ctx.lineTo(w / 2, 85);
      ctx.closePath();
      ctx.stroke();

      // Porcelain Crucible & Lid
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      // Crucible cup
      ctx.beginPath();
      ctx.moveTo(w / 2 - 25, 45);
      ctx.lineTo(w / 2 + 25, 45);
      ctx.lineTo(w / 2 + 15, 78);
      ctx.lineTo(w / 2 - 15, 78);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Lid with handle
      ctx.fillRect(w / 2 - 28, 40, 56, 6);
      ctx.strokeRect(w / 2 - 28, 40, 56, 6);
      ctx.beginPath();
      ctx.arc(w / 2, 38, 5, Math.PI, 0);
      ctx.stroke();

      // Tripod legs
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(18, 65);
      ctx.lineTo(8, h - 8);
      ctx.moveTo(w - 18, 65);
      ctx.lineTo(w - 8, h - 8);
      ctx.stroke();
      break;
    }

    case 'watch_glass_dish': {
      const w = width;
      const h = height;

      // Shallow Porcelain Evaporating Basin
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(w / 2, 10, w / 2 - 8, 0.15, Math.PI - 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Evaporating Solution Crystals
      ctx.fillStyle = meniscusFill;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 18, w / 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      break;
    }

    case 'u_tube': {
      const w = width;
      const h = height;
      const r = 24;
      const tubeW = 16;
      const cx = w / 2;

      // U-tube Glass
      ctx.strokeStyle = glassStroke;
      ctx.lineWidth = 2.5;

      // Outer U
      ctx.beginPath();
      ctx.moveTo(cx - r - tubeW / 2, 15);
      ctx.lineTo(cx - r - tubeW / 2, h - r - tubeW / 2);
      ctx.arc(cx, h - r - tubeW / 2, r + tubeW / 2, Math.PI, 0, true);
      ctx.lineTo(cx + r + tubeW / 2, 15);
      ctx.stroke();

      // Inner U
      ctx.beginPath();
      ctx.moveTo(cx - r + tubeW / 2, 15);
      ctx.lineTo(cx - r + tubeW / 2, h - r - tubeW / 2);
      ctx.arc(cx, h - r - tubeW / 2, r - tubeW / 2, Math.PI, 0, true);
      ctx.lineTo(cx + r - tubeW / 2, 15);
      ctx.stroke();

      // Drying Agent Granules (CaCl2)
      ctx.fillStyle = '#94A3B8';
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        const angle = Math.PI + (i / 11) * Math.PI;
        const gx = cx + Math.cos(angle) * r;
        const gy = h - r - tubeW / 2 + Math.sin(angle) * r;
        ctx.arc(gx, gy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    default:
      ctx.strokeRect(0, 0, width, height);
      break;
  }

  // Label text if provided
  if (el.label) {
    ctx.fillStyle = '#501325';
    ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(el.label, width / 2, height + 16);
  }

  ctx.restore();
}
