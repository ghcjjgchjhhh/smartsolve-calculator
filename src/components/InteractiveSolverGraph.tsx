import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AiGraphData, AiGraphCurve, AiGraphKeyPoint } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Activity,
  Layers,
  Compass,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Download,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  graphs: AiGraphData[];
  graphExplanation?: string;
  missingInformation?: string;
}

export const InteractiveSolverGraph: React.FC<Props> = ({
  graphs,
  graphExplanation,
  missingInformation,
}) => {
  if (!graphs || graphs.length === 0) {
    if (missingInformation) {
      return (
        <div className="bg-[#121214] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
          <div className="flex items-center space-x-2.5 text-amber-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h4 className="text-sm font-bold text-white">Graph Information Required</h4>
          </div>
          <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed">
            {missingInformation}
          </p>
        </div>
      );
    }
    return null;
  }

  const [activeGraphIndex, setActiveGraphIndex] = useState(0);
  const graph = graphs[activeGraphIndex] || graphs[0];

  // Animation & simulation playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSimStage, setShowSimStage] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; curveY?: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimestamp = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Graph domains
  const xMin = graph.xAxis.min;
  const xMax = graph.xAxis.max;
  const yMin = graph.yAxis.min;
  const yMax = graph.yAxis.max;

  const simDuration = graph.simulation?.duration || Math.max(xMax - xMin, 5);

  // Safe evaluation of mathematical curve expressions
  const evaluateCurve = useCallback(
    (curve: AiGraphCurve, xVal: number): number => {
      // 1. Piecewise segments
      if (curve.type === 'piecewise' && curve.segments && curve.segments.length > 0) {
        for (const seg of curve.segments) {
          if (xVal >= seg.t0 && xVal <= seg.t1) {
            try {
              // Sanitize math string: replace common math functions
              const expr = seg.fn
                .replace(/\bsin\b/g, 'Math.sin')
                .replace(/\bcos\b/g, 'Math.cos')
                .replace(/\btan\b/g, 'Math.tan')
                .replace(/\bsqrt\b/g, 'Math.sqrt')
                .replace(/\babs\b/g, 'Math.abs')
                .replace(/\bpi\b/gi, 'Math.PI')
                .replace(/\^/g, '**');
              const fn = new Function('t', 'x', `return (${expr});`);
              const val = fn(xVal, xVal);
              if (Number.isFinite(val)) return val;
            } catch {
              // fallback
            }
          }
        }
      }

      // 2. Direct function expression
      if (curve.fnExpression) {
        try {
          const expr = curve.fnExpression
            .replace(/\bsin\b/g, 'Math.sin')
            .replace(/\bcos\b/g, 'Math.cos')
            .replace(/\btan\b/g, 'Math.tan')
            .replace(/\bsqrt\b/g, 'Math.sqrt')
            .replace(/\babs\b/g, 'Math.abs')
            .replace(/\bln\b/g, 'Math.log')
            .replace(/\bexp\b/g, 'Math.exp')
            .replace(/\bpi\b/gi, 'Math.PI')
            .replace(/\^/g, '**');
          const fn = new Function('t', 'x', `return (${expr});`);
          const val = fn(xVal, xVal);
          if (Number.isFinite(val)) return val;
        } catch {
          // fallback
        }
      }

      // 3. Discrete points interpolation
      if (curve.points && curve.points.length > 0) {
        const sorted = [...curve.points].sort((a, b) => a.x - b.x);
        if (xVal <= sorted[0].x) return sorted[0].y;
        if (xVal >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y;
        for (let i = 0; i < sorted.length - 1; i++) {
          const p1 = sorted[i];
          const p2 = sorted[i + 1];
          if (xVal >= p1.x && xVal <= p2.x) {
            const frac = (xVal - p1.x) / (p2.x - p1.x || 1);
            return p1.y + frac * (p2.y - p1.y);
          }
        }
      }

      return 0;
    },
    []
  );

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      lastTimestamp.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (lastTimestamp.current === null) {
        lastTimestamp.current = timestamp;
      }
      const delta = (timestamp - lastTimestamp.current) / 1000;
      lastTimestamp.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + delta * playbackSpeed;
        if (next >= simDuration) {
          setIsPlaying(false);
          return simDuration;
        }
        return next;
      });

      animationFrameId.current = requestAnimationFrame(step);
    };

    animationFrameId.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, playbackSpeed, simDuration]);

  // Main Graph Canvas drawing routine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI Retina scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    // Dark sleek background
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // Layout margins
    const padLeft = 60;
    const padRight = 30;
    const padTop = 35;
    const padBottom = 45;

    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    // View boundaries with zoomLevel
    const currentXSpan = (xMax - xMin) / zoomLevel;
    const currentYSpan = (yMax - yMin) / zoomLevel;
    const curXMin = xMin;
    const curXMax = curXMin + currentXSpan;
    const curYMin = yMin;
    const curYMax = curYMin + currentYSpan;

    // Transform coordinate helpers
    const toCanvasX = (x: number) => padLeft + ((x - curXMin) / (curXMax - curXMin || 1)) * plotWidth;
    const toCanvasY = (y: number) => padTop + plotHeight - ((y - curYMin) / (curYMax - curYMin || 1)) * plotHeight;

    // 1. Draw Grid Lines
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    const xStep = graph.xAxis.step || Math.max((curXMax - curXMin) / 8, 1);
    const yStep = graph.yAxis.step || Math.max((curYMax - curYMin) / 6, 1);

    // Vertical grid & X-axis tick labels
    ctx.fillStyle = '#A1A1AA';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let x = Math.ceil(curXMin / xStep) * xStep; x <= curXMax; x += xStep) {
      const cx = toCanvasX(x);
      if (cx >= padLeft && cx <= width - padRight) {
        ctx.beginPath();
        ctx.moveTo(cx, padTop);
        ctx.lineTo(cx, padTop + plotHeight);
        ctx.stroke();

        const xLabel = Math.abs(x) < 0.0001 ? '0' : Number(x.toFixed(2)).toString();
        ctx.fillText(xLabel, cx, padTop + plotHeight + 8);
      }
    }

    // Horizontal grid & Y-axis tick labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.ceil(curYMin / yStep) * yStep; y <= curYMax; y += yStep) {
      const cy = toCanvasY(y);
      if (cy >= padTop && cy <= padTop + plotHeight) {
        ctx.beginPath();
        ctx.moveTo(padLeft, cy);
        ctx.lineTo(padLeft + plotWidth, cy);
        ctx.stroke();

        const yLabel = Math.abs(y) < 0.0001 ? '0' : Number(y.toFixed(2)).toString();
        ctx.fillText(yLabel, padLeft - 10, cy);
      }
    }
    ctx.setLineDash([]);

    // 2. Draw Zero Axes (if visible in viewport)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#52525B';

    if (curYMin <= 0 && curYMax >= 0) {
      const cy0 = toCanvasY(0);
      ctx.beginPath();
      ctx.moveTo(padLeft, cy0);
      ctx.lineTo(padLeft + plotWidth, cy0);
      ctx.stroke();
    }
    if (curXMin <= 0 && curXMax >= 0) {
      const cx0 = toCanvasX(0);
      ctx.beginPath();
      ctx.moveTo(cx0, padTop);
      ctx.lineTo(cx0, padTop + plotHeight);
      ctx.stroke();
    }

    // 3. Draw Axis Labels
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    // X label
    const xUnit = graph.xAxis.unit ? ` (${graph.xAxis.unit})` : '';
    ctx.fillText(`${graph.xAxis.label}${xUnit}`, padLeft + plotWidth / 2, height - 6);

    // Y label (rotated)
    ctx.save();
    ctx.translate(18, padTop + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    const yUnit = graph.yAxis.unit ? ` (${graph.yAxis.unit})` : '';
    ctx.fillText(`${graph.yAxis.label}${yUnit}`, 0, 0);
    ctx.restore();

    // 4. Shaded Areas (e.g. area under v-t graph = displacement)
    graph.curves.forEach((curve) => {
      if (curve.shadedArea) {
        const { fromX, toX, color, label } = curve.shadedArea;
        const areaColor = color || '#22C55E';
        ctx.save();
        ctx.beginPath();
        const startX = Math.max(fromX, curXMin);
        const endX = Math.min(toX, curXMax);
        const steps = 150;
        const dx = (endX - startX) / steps;

        // Trace upper curve
        for (let i = 0; i <= steps; i++) {
          const x = startX + i * dx;
          const y = evaluateCurve(curve, x);
          const cx = toCanvasX(x);
          const cy = toCanvasY(y);
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        // Trace back along y=0 axis
        ctx.lineTo(toCanvasX(endX), toCanvasY(0));
        ctx.lineTo(toCanvasX(startX), toCanvasY(0));
        ctx.closePath();

        ctx.fillStyle = areaColor.startsWith('#')
          ? `${areaColor}33`
          : 'rgba(34, 197, 94, 0.22)';
        ctx.fill();

        // Shaded boundary border
        ctx.strokeStyle = areaColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label inside shaded area
        if (label) {
          const midX = (startX + endX) / 2;
          const midY = evaluateCurve(curve, midX) / 2;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, toCanvasX(midX), toCanvasY(midY));
        }
        ctx.restore();
      }
    });

    // 5. Plot Curves
    graph.curves.forEach((curve) => {
      const strokeColor = curve.color || '#22C55E';
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      if (curve.dashed) {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }

      const sampleCount = 350;
      const stepX = (curXMax - curXMin) / sampleCount;
      let started = false;

      for (let i = 0; i <= sampleCount; i++) {
        const x = curXMin + i * stepX;
        const y = evaluateCurve(curve, x);
        const cx = toCanvasX(x);
        const cy = toCanvasY(y);

        // Clip inside plot area
        if (cy >= padTop - 20 && cy <= padTop + plotHeight + 20) {
          if (!started) {
            ctx.moveTo(cx, cy);
            started = true;
          } else {
            ctx.lineTo(cx, cy);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
      ctx.restore();
    });

    // 6. Draw Key Critical Points (Roots, Max, Min, Intercepts)
    if (graph.keyPoints && graph.keyPoints.length > 0) {
      graph.keyPoints.forEach((kp) => {
        const kx = toCanvasX(kp.x);
        const ky = toCanvasY(kp.y);

        if (kx >= padLeft && kx <= width - padRight && ky >= padTop && ky <= height - padBottom) {
          ctx.save();
          // Halo glow
          ctx.beginPath();
          ctx.arc(kx, ky, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#38BDF833';
          ctx.fill();

          // Core point
          ctx.beginPath();
          ctx.arc(kx, ky, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#38BDF8';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Pill tag
          ctx.font = '10px JetBrains Mono, monospace';
          const label = `${kp.label} (${Number(kp.x.toFixed(2))}, ${Number(kp.y.toFixed(2))})`;
          const tagW = ctx.measureText(label).width + 12;
          const tagH = 18;
          const tagX = Math.min(Math.max(kx - tagW / 2, padLeft + 4), width - padRight - tagW - 4);
          const tagY = ky > padTop + 30 ? ky - 26 : ky + 10;

          ctx.fillStyle = '#18181BE6';
          ctx.strokeStyle = '#38BDF866';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(tagX, tagY, tagW, tagH, 5);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#E0F2FE';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, tagX + tagW / 2, tagY + tagH / 2);
          ctx.restore();
        }
      });
    }

    // 7. Draw Live Animated Tracer Dot & Value Crosshair
    const primaryCurve = graph.curves[0];
    if (primaryCurve) {
      const activeX = currentTime;
      const activeY = evaluateCurve(primaryCurve, activeX);
      const tracerX = toCanvasX(activeX);
      const tracerY = toCanvasY(activeY);

      if (tracerX >= padLeft && tracerX <= width - padRight && tracerY >= padTop && tracerY <= height - padBottom) {
        ctx.save();
        // Drop lines to axes
        ctx.strokeStyle = '#22C55E66';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(tracerX, tracerY);
        ctx.lineTo(tracerX, toCanvasY(0));
        ctx.moveTo(tracerX, tracerY);
        ctx.lineTo(padLeft, tracerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pulsing radar ripple
        const pulse = (Date.now() % 1200) / 1200;
        ctx.beginPath();
        ctx.arc(tracerX, tracerY, 6 + pulse * 12, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 197, 94, ${1 - pulse})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Solid marker
        ctx.beginPath();
        ctx.arc(tracerX, tracerY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#22C55E';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Live Tracer HUD callout
        const text = `t=${activeX.toFixed(2)}s | y=${activeY.toFixed(2)}${graph.yAxis.unit || ''}`;
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        const w = ctx.measureText(text).width + 16;
        const h = 22;
        const boxX = Math.min(Math.max(tracerX - w / 2, padLeft + 6), width - padRight - w - 6);
        const boxY = tracerY > padTop + 35 ? tracerY - 32 : tracerY + 12;

        ctx.fillStyle = '#0F172AEE';
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, w, h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, boxX + w / 2, boxY + h / 2);
        ctx.restore();
      }
    }

    // 8. Hover cursor crosshair
    if (hoverCoord) {
      const hx = toCanvasX(hoverCoord.x);
      const hy = toCanvasY(hoverCoord.y);
      if (hx >= padLeft && hx <= width - padRight && hy >= padTop && hy <= height - padBottom) {
        ctx.save();
        ctx.strokeStyle = '#E4E4E766';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hx, padTop);
        ctx.lineTo(hx, padTop + plotHeight);
        ctx.moveTo(padLeft, hy);
        ctx.lineTo(padLeft + plotWidth, hy);
        ctx.stroke();
        ctx.restore();
      }
    }
  }, [graph, currentTime, zoomLevel, hoverCoord, xMin, xMax, yMin, yMax, evaluateCurve]);

  // Secondary Animated Physical Simulation Canvas (The "Virtual Lab")
  useEffect(() => {
    const simCanvas = simCanvasRef.current;
    if (!simCanvas || !showSimStage) return;
    const ctx = simCanvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = simCanvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    simCanvas.width = width * dpr;
    simCanvas.height = height * dpr;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, width, height);

    const simType = graph.simulation?.type || 'motion_1d';
    const primaryCurve = graph.curves[0];
    const currentVal = primaryCurve ? evaluateCurve(primaryCurve, currentTime) : 0;

    // A. 1D MOTION SIMULATION (Car / Particle on track)
    if (simType === 'motion_1d' || graph.graphType.includes('time') || graph.graphType === 'velocity_time') {
      const trackY = height * 0.65;
      const trackStart = 45;
      const trackEnd = width - 45;
      const trackLen = trackEnd - trackStart;

      // Draw asphalt track
      ctx.fillStyle = '#18181B';
      ctx.fillRect(trackStart - 10, trackY - 14, trackLen + 20, 28);
      ctx.strokeStyle = '#27272A';
      ctx.lineWidth = 1;
      ctx.strokeRect(trackStart - 10, trackY - 14, trackLen + 20, 28);

      // Calibrated distance hash marks
      ctx.strokeStyle = '#3F3F46';
      ctx.fillStyle = '#71717A';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      const markCount = 8;
      for (let i = 0; i <= markCount; i++) {
        const mx = trackStart + (i / markCount) * trackLen;
        ctx.beginPath();
        ctx.moveTo(mx, trackY + 14);
        ctx.lineTo(mx, trackY + 22);
        ctx.stroke();

        const distVal = (xMin + (i / markCount) * (xMax - xMin)).toFixed(0);
        ctx.fillText(`${distVal}m`, mx, trackY + 34);
      }

      // Compute vehicle / object position
      // For velocity-time, displacement s = area under curve up to currentTime
      let objectFraction = 0;
      if (graph.graphType === 'velocity_time') {
        // Approximate numerical integration for displacement
        let disp = 0;
        const dt = 0.05;
        for (let t = 0; t <= currentTime; t += dt) {
          disp += evaluateCurve(primaryCurve, t) * dt;
        }
        // Total displacement across entire duration
        let totalDisp = 0;
        for (let t = 0; t <= simDuration; t += dt) {
          totalDisp += Math.abs(evaluateCurve(primaryCurve, t)) * dt;
        }
        objectFraction = totalDisp > 0 ? Math.min(Math.max(disp / totalDisp, 0), 1) : currentTime / simDuration;
      } else {
        objectFraction = Math.min(Math.max((currentTime - xMin) / (xMax - xMin || 1), 0), 1);
      }

      const objX = trackStart + objectFraction * trackLen;

      // Draw sporty animated car / object
      ctx.save();
      ctx.translate(objX, trackY - 4);

      // Chassis
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.roundRect(-24, -14, 48, 14, [4, 8, 2, 2]);
      ctx.fill();

      // Cabin / windshield
      ctx.fillStyle = '#09090B';
      ctx.beginPath();
      ctx.roundRect(-10, -22, 22, 10, [4, 6, 0, 0]);
      ctx.fill();

      // Headlight glow
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(20, -10, 4, 6);

      // Wheels
      ctx.fillStyle = '#18181B';
      ctx.strokeStyle = '#71717A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-14, 0, 6, 0, Math.PI * 2);
      ctx.arc(14, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Velocity vector arrow above car
      const currentSpeed = currentVal;
      const arrowLen = Math.min(Math.max(currentSpeed * 2.5, -60), 60);
      if (Math.abs(arrowLen) > 3) {
        ctx.save();
        ctx.strokeStyle = '#38BDF8';
        ctx.fillStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(objX, trackY - 32);
        ctx.lineTo(objX + arrowLen, trackY - 32);
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        const headDir = arrowLen > 0 ? 1 : -1;
        ctx.moveTo(objX + arrowLen, trackY - 32);
        ctx.lineTo(objX + arrowLen - headDir * 6, trackY - 36);
        ctx.lineTo(objX + arrowLen - headDir * 6, trackY - 28);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`v = ${currentSpeed.toFixed(1)} m/s`, objX + arrowLen / 2, trackY - 42);
        ctx.restore();
      }

      // Telemetry HUD overlay in top left
      ctx.fillStyle = '#A1A1AA';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Elapsed Time: ${currentTime.toFixed(2)} s`, 20, 24);
      ctx.fillStyle = '#22C55E';
      ctx.fillText(`Current Value (${graph.yAxis.label}): ${currentVal.toFixed(2)} ${graph.yAxis.unit || ''}`, 20, 42);
    }

    // B. PROJECTILE MOTION 2D SIMULATION
    else if (simType === 'projectile_2d' || graph.graphType === 'projectile_motion') {
      const groundY = height * 0.82;
      const cannonX = 40;
      const groundWidth = width - 80;

      // Draw ground
      ctx.strokeStyle = '#27272A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, groundY);
      ctx.lineTo(width - 20, groundY);
      ctx.stroke();

      // Parabolic flight path preview
      ctx.strokeStyle = '#22C55E44';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const projSteps = 100;
      for (let i = 0; i <= projSteps; i++) {
        const x = xMin + (i / projSteps) * (xMax - xMin);
        const y = evaluateCurve(primaryCurve, x);
        const px = cannonX + ((x - xMin) / (xMax - xMin || 1)) * groundWidth;
        const py = groundY - (y / (yMax || 1)) * (groundY - 30);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Current projectile position
      const curX = currentTime;
      const curY = evaluateCurve(primaryCurve, curX);
      const ballX = cannonX + ((curX - xMin) / (xMax - xMin || 1)) * groundWidth;
      const ballY = groundY - (Math.max(curY, 0) / (yMax || 1)) * (groundY - 30);

      // Trajectory vapor trail
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const trailCount = Math.floor((curX / (xMax || 1)) * projSteps);
      for (let i = 0; i <= trailCount; i++) {
        const x = xMin + (i / projSteps) * (xMax - xMin);
        const y = evaluateCurve(primaryCurve, x);
        const px = cannonX + ((x - xMin) / (xMax - xMin || 1)) * groundWidth;
        const py = groundY - (y / (yMax || 1)) * (groundY - 30);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Projectile sphere
      ctx.beginPath();
      ctx.arc(ballX, ballY, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Launch Cannon at origin
      ctx.fillStyle = '#52525B';
      ctx.beginPath();
      ctx.arc(cannonX, groundY, 12, 0, Math.PI, true);
      ctx.fill();

      // Live Telemetry
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Time t: ${curX.toFixed(2)}s | Altitude y: ${curY.toFixed(2)}m`, 20, 24);
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`Range x: ${curX.toFixed(2)}m`, 20, 42);
    }

    // C. SIMPLE HARMONIC MOTION (Oscillator / Pendulum)
    else if (simType === 'shm_oscillator' || graph.graphType === 'shm') {
      const centerX = width / 2;
      const anchorY = 30;
      const maxLen = height * 0.6;
      // Angle theta or displacement x
      const theta = (currentVal / (yMax || 1)) * 0.6; // radians
      const bobX = centerX + Math.sin(theta) * maxLen;
      const bobY = anchorY + Math.cos(theta) * maxLen;

      // Anchor point
      ctx.fillStyle = '#52525B';
      ctx.fillRect(centerX - 20, anchorY - 8, 40, 8);

      // Rod/string
      ctx.strokeStyle = '#71717A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, anchorY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Bob
      ctx.beginPath();
      ctx.arc(bobX, bobY, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#38BDF8';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Energy bar HUD in top right
      const keFrac = Math.pow(Math.cos(theta * 2), 2);
      const peFrac = 1 - keFrac;
      ctx.fillStyle = '#A1A1AA';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`KE (Kinetic): ${(keFrac * 100).toFixed(0)}%`, 20, 24);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(20, 30, keFrac * 90, 8);

      ctx.fillStyle = '#A1A1AA';
      ctx.fillText(`PE (Potential): ${(peFrac * 100).toFixed(0)}%`, 20, 52);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(20, 58, peFrac * 90, 8);
    }

    // D. WAVE MOTION SIMULATOR
    else if (simType === 'wave_propagation' || graph.graphType === 'wave_motion') {
      const midY = height / 2;
      const waveStartX = 30;
      const waveEndX = width - 30;
      const numParticles = 40;

      ctx.strokeStyle = '#27272A';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(waveStartX, midY);
      ctx.lineTo(waveEndX, midY);
      ctx.stroke();

      for (let i = 0; i <= numParticles; i++) {
        const frac = i / numParticles;
        const px = waveStartX + frac * (waveEndX - waveStartX);
        const spatialPhase = frac * 4 * Math.PI;
        const temporalPhase = currentTime * 3;
        const py = midY + Math.sin(spatialPhase - temporalPhase) * (height * 0.3);

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = i % 5 === 0 ? '#EC4899' : '#38BDF8';
        ctx.fill();
      }

      ctx.fillStyle = '#A1A1AA';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Wave Propagation | t = ${currentTime.toFixed(2)}s`, 20, 24);
    }

    // E. GENERAL FUNCTION TANGENT & CURVE TRACING (Mathematics)
    else {
      const midY = height / 2;
      ctx.fillStyle = '#A1A1AA';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Mathematical Curve Simulator: x = ${currentTime.toFixed(2)}`, 20, 24);
      ctx.fillStyle = '#22C55E';
      ctx.fillText(`Function Value: f(x) = ${currentVal.toFixed(3)}`, 20, 42);

      // Visual horizontal progress gauge
      const barW = width - 40;
      ctx.fillStyle = '#18181B';
      ctx.fillRect(20, height - 30, barW, 10);
      const frac = Math.min(Math.max((currentTime - xMin) / (xMax - xMin || 1), 0), 1);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(20, height - 30, frac * barW, 10);
    }
  }, [graph, currentTime, showSimStage, xMin, xMax, yMin, yMax, simDuration, evaluateCurve]);

  // Canvas mouse / touch interaction for inspection
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const padLeft = 60;
    const padRight = 30;
    const padTop = 35;
    const padBottom = 45;
    const plotWidth = rect.width - padLeft - padRight;
    const plotHeight = rect.height - padTop - padBottom;

    if (px >= padLeft && px <= rect.width - padRight && py >= padTop && py <= rect.height - padBottom) {
      const curXSpan = (xMax - xMin) / zoomLevel;
      const curYSpan = (yMax - yMin) / zoomLevel;
      const xVal = xMin + ((px - padLeft) / plotWidth) * curXSpan;
      const yVal = yMin + ((plotHeight - (py - padTop)) / plotHeight) * curYSpan;
      const curveY = graph.curves[0] ? evaluateCurve(graph.curves[0], xVal) : undefined;
      setHoverCoord({ x: xVal, y: yVal, curveY });
    } else {
      setHoverCoord(null);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoverCoord(null);
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-[#0A0A0A] border border-[#27272A] rounded-3xl shadow-2xl overflow-hidden transition-all text-white ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto p-4 sm:p-6 bg-black' : 'my-4'
      }`}
    >
      {/* Top Header & Tab Ribbon (if multiple graphs exist) */}
      <div className="p-4 sm:p-5 border-b border-[#27272A] bg-[#121214] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center flex-shrink-0 text-[#22C55E]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {graph.title || 'Interactive Graph & Simulation'}
              </h3>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                Virtual Lab
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] truncate">
              {graph.category === 'physics' ? 'Physics Motion Telemetry' : 'Mathematical Curve Analysis'} · {graph.curves.length} Plot Curve{graph.curves.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Action Controls & Fullscreen toggle */}
        <div className="flex items-center space-x-2 self-end sm:self-center">
          {graphs.length > 1 && (
            <div className="flex items-center bg-[#18181B] rounded-xl p-0.5 border border-[#27272A] text-xs font-semibold mr-1">
              {graphs.map((g, idx) => (
                <button
                  key={g.id || idx}
                  onClick={() => {
                    setActiveGraphIndex(idx);
                    setCurrentTime(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeGraphIndex === idx
                      ? 'bg-[#22C55E] text-white font-bold'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {g.title.split(' ')[0] || `Graph ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setZoomLevel((z) => Math.min(z * 1.25, 4))}
            title="Zoom In"
            className="p-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#27272A] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z / 1.25, 0.5))}
            title="Zoom Out"
            className="p-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#27272A] transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            title="Reset Zoom"
            className="px-2.5 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white border border-[#27272A] transition-colors cursor-pointer"
          >
            100%
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Lab'}
            className="p-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#27272A] transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Graph Canvas Display */}
      <div className="relative w-full h-[320px] sm:h-[420px] bg-[#09090B] select-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair block"
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        />

        {/* Legend Overlay at Top Right of Canvas */}
        <div className="absolute top-3 right-3 bg-[#18181BE6] backdrop-blur-md border border-[#27272A] rounded-xl px-3 py-2 text-[11px] font-mono space-y-1 shadow-lg pointer-events-none">
          {graph.curves.map((c) => (
            <div key={c.id} className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || '#22C55E' }} />
              <span className="text-white font-semibold">{c.label}</span>
              {c.equationText && <span className="text-[#A1A1AA]">({c.equationText})</span>}
            </div>
          ))}
        </div>

        {/* Live Hover Inspection HUD Bar */}
        {hoverCoord && (
          <div className="absolute bottom-2 left-4 bg-[#18181BEE] border border-[#38BDF8]/40 px-3 py-1.5 rounded-xl text-xs font-mono text-[#E0F2FE] shadow-lg flex items-center space-x-3 pointer-events-none">
            <span>
              x: <strong className="text-white">{hoverCoord.x.toFixed(2)}</strong>
            </span>
            <span>
              y: <strong className="text-white">{hoverCoord.y.toFixed(2)}</strong>
            </span>
            {hoverCoord.curveY !== undefined && (
              <span className="text-[#22C55E]">
                f(x): <strong>{hoverCoord.curveY.toFixed(2)}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Synchronized Physical Simulation Stage (Virtual Lab Canvas) */}
      {showSimStage && (
        <div className="border-t border-[#27272A] bg-[#050507]">
          <div className="px-4 py-2 bg-[#121214] border-b border-[#27272A] flex items-center justify-between text-xs">
            <span className="font-bold text-[#22C55E] flex items-center space-x-1.5 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              <span>Real-Time Motion Laboratory</span>
            </span>
            <span className="text-[#A1A1AA] text-[11px]">
              Synchronized 60 FPS Object Demonstration
            </span>
          </div>
          <div className="w-full h-[150px] sm:h-[180px]">
            <canvas ref={simCanvasRef} className="w-full h-full block" />
          </div>
        </div>
      )}

      {/* Animation Control Bar (Play, Pause, Scrubber, Speed) */}
      <div className="p-4 sm:p-5 bg-[#121214] border-t border-[#27272A] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Play/Pause & Time */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={handleRestart}
              className="p-2.5 rounded-2xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#27272A] active:scale-95 transition-all cursor-pointer"
              title="Restart from t = 0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="font-mono text-xs text-white pl-2">
              <span className="font-bold text-[#22C55E]">{currentTime.toFixed(2)}s</span>
              <span className="text-[#71717A]"> / {simDuration.toFixed(2)}s</span>
            </div>
          </div>

          {/* Speed Pills & Stage Toggle */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-[#18181B] rounded-xl p-0.5 border border-[#27272A] text-xs font-mono">
              {[0.25, 0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-[#22C55E] text-white font-bold'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSimStage(!showSimStage)}
              className="px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white border border-[#27272A] flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{showSimStage ? 'Hide Lab Stage' : 'Show Lab Stage'}</span>
            </button>
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex items-center space-x-3 pt-1">
          <span className="text-[11px] font-mono text-[#71717A]">0.0s</span>
          <input
            type="range"
            min={0}
            max={simDuration}
            step={0.02}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#22C55E]"
          />
          <span className="text-[11px] font-mono text-[#71717A]">{simDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Physics / Mathematical Interpretation Breakdown Cards */}
      {graph.featuresExplanation && (
        <div className="p-4 sm:p-5 bg-[#0A0A0A] border-t border-[#27272A] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Graph Meaning, Gradients & Physical Relationships</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {graph.featuresExplanation.gradientMeaning && (
              <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] space-y-1">
                <span className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider block">
                  Gradient / Slope (dy/dx)
                </span>
                <p className="text-xs text-[#D4D4D8] leading-relaxed">
                  {graph.featuresExplanation.gradientMeaning}
                </p>
              </div>
            )}

            {graph.featuresExplanation.areaMeaning && (
              <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] space-y-1">
                <span className="text-[11px] font-bold text-[#22C55E] uppercase tracking-wider block">
                  Area Under Graph (∫ y dx)
                </span>
                <p className="text-xs text-[#D4D4D8] leading-relaxed">
                  {graph.featuresExplanation.areaMeaning}
                </p>
              </div>
            )}

            {graph.featuresExplanation.interceptsMeaning && (
              <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] space-y-1">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Intercepts & Boundaries
                </span>
                <p className="text-xs text-[#D4D4D8] leading-relaxed">
                  {graph.featuresExplanation.interceptsMeaning}
                </p>
              </div>
            )}
          </div>

          {graph.featuresExplanation.physicalInterpretation && (
            <p className="text-xs text-[#A1A1AA] pt-1 leading-relaxed border-t border-[#27272A]/40">
              <span className="font-bold text-white">Physical Interpretation: </span>
              {graph.featuresExplanation.physicalInterpretation}
            </p>
          )}
        </div>
      )}

      {/* Global Graph Explanation (if provided by AI solver) */}
      {graphExplanation && (
        <div className="p-4 bg-[#121214] border-t border-[#27272A] text-xs text-[#D4D4D8] leading-relaxed flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block mb-0.5">AI Graph Summary:</span>
            <span>{graphExplanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};
