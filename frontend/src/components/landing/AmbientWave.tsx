'use client';

import React, { useEffect, useRef } from 'react';

export const AmbientWave: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const startTime = performance.now();

    const render = (now: number) => {
      // Continuous, infinite time delta - never resets, never jumps
      const elapsed = (now - startTime) * 0.001;
      const t = elapsed * 0.42; // smooth, majestic flow speed

      ctx.clearRect(0, 0, width, height);

      // Deep radial glow in center
      const centerX = width * 0.5;
      const centerY = height * 0.44;

      const radialGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(width * 0.55, 450)
      );
      radialGlow.addColorStop(0, 'rgba(210, 220, 240, 0.07)');
      radialGlow.addColorStop(0.35, 'rgba(120, 135, 160, 0.03)');
      radialGlow.addColorStop(0.7, 'rgba(40, 45, 60, 0.01)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // Draw 3 layered volumetric undulating silk ribbons
      // Layer 1: Ambient background depth smoke
      drawRibbon(ctx, width, centerY + 18, {
        freq1: 0.0011,
        freq2: 0.0026,
        amp1: 70,
        amp2: 32,
        phase1: t * 0.85,
        phase2: -t * 0.48,
        thickBase: 140,
        thickAmp: 45,
        thickFreq: 0.0014,
        thickPhase: t * 0.65,
        topColor: 'rgba(20, 22, 28, 0)',
        midColor: 'rgba(85, 95, 115, 0.22)',
        botColor: 'rgba(10, 12, 16, 0)',
        sheenOpacity: 0,
      });

      // Layer 2: Main foreground sculptural silk ribbon (volumetric silver/white crest)
      drawRibbon(ctx, width, centerY, {
        freq1: 0.0015,
        freq2: 0.0032,
        amp1: 95,
        amp2: 46,
        phase1: t * 1.05 + 0.6,
        phase2: -t * 0.6 + 1.1,
        thickBase: 165,
        thickAmp: 65,
        thickFreq: 0.0017,
        thickPhase: t * 0.82,
        topColor: 'rgba(40, 44, 54, 0.08)',
        midColor: 'rgba(215, 225, 240, 0.52)', // bright sculpted highlight
        botColor: 'rgba(15, 18, 24, 0.04)',
        sheenOpacity: 0.55,
      });

      // Layer 3: Delicate weaving highlight ribbon
      drawRibbon(ctx, width, centerY - 15, {
        freq1: 0.0018,
        freq2: 0.0036,
        amp1: 65,
        amp2: 30,
        phase1: t * 1.25 + 2.2,
        phase2: -t * 0.72 + 2.8,
        thickBase: 80,
        thickAmp: 30,
        thickFreq: 0.0021,
        thickPhase: -t * 0.55,
        topColor: 'rgba(30, 35, 45, 0)',
        midColor: 'rgba(170, 185, 210, 0.35)',
        botColor: 'rgba(12, 15, 20, 0)',
        sheenOpacity: 0.35,
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
};

interface RibbonConfig {
  freq1: number;
  freq2: number;
  amp1: number;
  amp2: number;
  phase1: number;
  phase2: number;
  thickBase: number;
  thickAmp: number;
  thickFreq: number;
  thickPhase: number;
  topColor: string;
  midColor: string;
  botColor: string;
  sheenOpacity: number;
}

function drawRibbon(
  ctx: CanvasRenderingContext2D,
  width: number,
  baseY: number,
  cfg: RibbonConfig
) {
  const step = 8;
  const count = Math.ceil(width / step) + 1;

  const topPoints: { x: number; y: number }[] = new Array(count);
  const botPoints: { x: number; y: number }[] = new Array(count);

  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < count; i++) {
    const x = i * step;

    // Harmonious sinusoidal wave formula
    const waveY =
      baseY +
      Math.sin(x * cfg.freq1 + cfg.phase1) * cfg.amp1 +
      Math.cos(x * cfg.freq2 + cfg.phase2) * cfg.amp2;

    const thickness =
      cfg.thickBase +
      Math.sin(x * cfg.thickFreq + cfg.thickPhase) * cfg.thickAmp;

    const topY = waveY - thickness * 0.5;
    const botY = waveY + thickness * 0.5;

    topPoints[i] = { x, y: topY };
    botPoints[i] = { x, y: botY };

    if (topY < minY) minY = topY;
    if (botY > maxY) maxY = botY;
  }

  // Draw volumetric filled ribbon body
  ctx.beginPath();
  ctx.moveTo(topPoints[0].x, topPoints[0].y);

  for (let i = 1; i < count; i++) {
    const prev = topPoints[i - 1];
    const curr = topPoints[i];
    const mx = (prev.x + curr.x) * 0.5;
    const my = (prev.y + curr.y) * 0.5;
    ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
  }
  ctx.lineTo(topPoints[count - 1].x, topPoints[count - 1].y);
  ctx.lineTo(botPoints[count - 1].x, botPoints[count - 1].y);

  for (let i = count - 2; i >= 0; i--) {
    const prev = botPoints[i + 1];
    const curr = botPoints[i];
    const mx = (prev.x + curr.x) * 0.5;
    const my = (prev.y + curr.y) * 0.5;
    ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
  }
  ctx.lineTo(botPoints[0].x, botPoints[0].y);
  ctx.closePath();

  // Create vertical gradient spanning the ribbon height
  const gradHeight = Math.max(maxY - minY, 20);
  const grad = ctx.createLinearGradient(0, minY, 0, minY + gradHeight);
  grad.addColorStop(0, cfg.topColor);
  grad.addColorStop(0.48, cfg.midColor);
  grad.addColorStop(1, cfg.botColor);

  ctx.fillStyle = grad;
  ctx.fill();

  // Draw silky crest sheen line
  if (cfg.sheenOpacity > 0) {
    ctx.beginPath();
    ctx.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 1; i < count; i++) {
      const prev = topPoints[i - 1];
      const curr = topPoints[i];
      const mx = (prev.x + curr.x) * 0.5;
      const my = (prev.y + curr.y) * 0.5;
      ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
    }

    const sheenGrad = ctx.createLinearGradient(0, 0, width, 0);
    sheenGrad.addColorStop(0, `rgba(255, 255, 255, 0)`);
    sheenGrad.addColorStop(0.25, `rgba(255, 255, 255, ${cfg.sheenOpacity * 0.6})`);
    sheenGrad.addColorStop(0.5, `rgba(255, 255, 255, ${cfg.sheenOpacity})`);
    sheenGrad.addColorStop(0.75, `rgba(255, 255, 255, ${cfg.sheenOpacity * 0.6})`);
    sheenGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);

    ctx.strokeStyle = sheenGrad;
    ctx.lineWidth = 1.75;
    ctx.stroke();
  }
}
