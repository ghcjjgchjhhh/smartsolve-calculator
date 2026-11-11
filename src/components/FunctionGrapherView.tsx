import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  HelpCircle,
  Crosshair,
  Sliders,
  Play,
  Copy,
  Check,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAppLanguage } from '../contexts/LanguageContext';

interface FunctionCurve {
  id: string;
  expression: string;
  color: string;
  name: string;
  visible: boolean;
  isDerivative?: boolean;
}

const PRESET_FUNCTIONS = [
  { name: 'Quadratic Parabola', expr: 'x^2 - 4', desc: 'Standard parabola with vertex at (0, -4)' },
  { name: 'Sine Wave', expr: 'sin(x)', desc: 'Periodic trigonometric wave, period 2π' },
  { name: 'Cubic with Inflection', expr: 'x^3 - 3*x', desc: 'Two local extrema and inflection at origin' },
  { name: 'Damped Oscillator', expr: 'exp(-0.2*x)*sin(2*x)', desc: 'Decaying wave modeled in physics' },
  { name: 'Gaussian Normal Bell', expr: 'exp(-x^2)', desc: 'Standard normal probability distribution' },
  { name: 'Rational Hyperbola', expr: '1/x', desc: 'Classic inverse curve with asymptotes at x=0, y=0' },
  { name: 'Cosine Harmonic', expr: '2*cos(x) + sin(2*x)', desc: 'Composite harmonic wave interference' },
  { name: 'Absolute Value V-Curve', expr: 'abs(x) - 2', desc: 'Piecewise linear absolute value function' },
];

export const FunctionGrapherView: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { t } = useAppLanguage();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport bounds
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-8);
  const [yMax, setYMax] = useState<number>(8);

  // Active Curves
  const [curves, setCurves] = useState<FunctionCurve[]>([
    { id: '1', expression: 'x^2 - 4', color: '#22C55E', name: 'f₁(x)', visible: true },
    { id: '2', expression: '2*x + 1', color: '#38BDF8', name: 'f₂(x)', visible: false },
  ]);

  const [inputExpr, setInputExpr] = useState('x^2 - 4');
  const [showDerivative, setShowDerivative] = useState(false);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [isTracing, setIsTracing] = useState(true);
  const [copied, setCopied] = useState(false);

  // Drag pan state
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Safe mathematical evaluation function for x -> y
  const evaluateMath = useCallback((expr: string, xVal: number): number => {
    try {
      let clean = expr
        .replace(/\s+/g, '')
        .replace(/\^/g, '**')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/asin/g, 'Math.asin')
        .replace(/acos/g, 'Math.acos')
        .replace(/atan/g, 'Math.atan')
        .replace(/exp/g, 'Math.exp')
        .replace(/log/g, 'Math.log10')
        .replace(/ln/g, 'Math.log')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/abs/g, 'Math.abs')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e(?![a-zA-Z])/g, 'Math.E');

      // Handle implicit multiplication like 2x, 3sin(x), (x+1)(x-2)
      clean = clean.replace(/(\d)(Math\.[a-zA-Z]+|\(|x)/g, '$1*$2');
      clean = clean.replace(/(x)(\()/g, '$1*$2');
      clean = clean.replace(/(\))(x)/g, '$1*$2');
      clean = clean.replace(/(\))(\()/g, '$1*$2');

      const fn = new Function('x', `"use strict"; return (${clean});`);
      const res = fn(xVal);
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return res;
      }
      return NaN;
    } catch {
      return NaN;
    }
  }, []);

  // Numerical derivative (finite differences)
  const evaluateDerivative = useCallback(
    (expr: string, xVal: number): number => {
      const h = 0.0001;
      const yPlus = evaluateMath(expr, xVal + h);
      const yMinus = evaluateMath(expr, xVal - h);
      if (!isNaN(yPlus) && !isNaN(yMinus)) {
        return (yPlus - yMinus) / (2 * h);
      }
      return NaN;
    },
    [evaluateMath]
  );

  // Draw coordinate plane and curves
  const renderGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pixel ratio scaling for crisp retina display
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Coordinate conversion helpers
    const toScreenX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;
    const toWorldX = (px: number) => xMin + (px / width) * (xMax - xMin);
    const toWorldY = (py: number) => yMax - (py / height) * (yMax - yMin);

    // Background
    ctx.fillStyle = isDark ? '#0A0A0C' : '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // 1. Grid Lines
    const xSpan = xMax - xMin;
    const ySpan = yMax - yMin;

    // Determine nice step interval
    const getGridStep = (span: number) => {
      const rough = span / 10;
      const power = Math.pow(10, Math.floor(Math.log10(rough)));
      const normalized = rough / power;
      if (normalized < 1.5) return power;
      if (normalized < 3.5) return 2 * power;
      if (normalized < 7.5) return 5 * power;
      return 10 * power;
    };

    const xStep = getGridStep(xSpan);
    const yStep = getGridStep(ySpan);

    // Minor grid lines
    ctx.strokeStyle = isDark ? '#1C1F26' : '#F1F5F9';
    ctx.lineWidth = 1;

    const startX = Math.floor(xMin / xStep) * xStep;
    for (let x = startX; x <= xMax; x += xStep) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }

    const startY = Math.floor(yMin / yStep) * yStep;
    for (let y = startY; y <= yMax; y += yStep) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    // 2. Axes (X & Y)
    ctx.strokeStyle = isDark ? '#3E4451' : '#94A3B8';
    ctx.lineWidth = 1.5;

    const zeroX = toScreenX(0);
    const zeroY = toScreenY(0);

    // X Axis
    if (zeroY >= 0 && zeroY <= height) {
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(width, zeroY);
      ctx.stroke();
    }

    // Y Axis
    if (zeroX >= 0 && zeroX <= width) {
      ctx.beginPath();
      ctx.moveTo(zeroX, 0);
      ctx.lineTo(zeroX, height);
      ctx.stroke();
    }

    // Axis Labels & Numbers
    ctx.font = '10px monospace';
    ctx.fillStyle = isDark ? '#717888' : '#64748B';

    // X axis tick numbers
    for (let x = startX; x <= xMax; x += xStep) {
      if (Math.abs(x) < 0.0001) continue; // skip 0
      const sx = toScreenX(x);
      const text = Number(x.toFixed(2)).toString();
      const textY = Math.min(Math.max(zeroY + 13, 14), height - 4);
      ctx.fillText(text, sx - ctx.measureText(text).width / 2, textY);
    }

    // Y axis tick numbers
    for (let y = startY; y <= yMax; y += yStep) {
      if (Math.abs(y) < 0.0001) continue;
      const sy = toScreenY(y);
      const text = Number(y.toFixed(2)).toString();
      const textX = Math.min(Math.max(zeroX + 5, 4), width - 30);
      ctx.fillText(text, textX, sy + 3);
    }

    // Origin label '0'
    if (zeroX >= 0 && zeroX <= width && zeroY >= 0 && zeroY <= height) {
      ctx.fillText('0', zeroX + 4, zeroY + 12);
    }

    // 3. Render Each Active Curve
    curves.forEach((curve) => {
      if (!curve.visible) return;

      ctx.strokeStyle = curve.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      const pixelStep = 1;
      let isFirst = true;

      for (let px = 0; px <= width; px += pixelStep) {
        const wx = toWorldX(px);
        const wy = evaluateMath(curve.expression, wx);

        if (isNaN(wy) || !isFinite(wy)) {
          isFirst = true;
          continue;
        }

        const py = toScreenY(wy);

        // Clamp extreme jumps (e.g. tan(x) vertical asymptotes)
        if (py < -height * 2 || py > height * 3) {
          isFirst = true;
          continue;
        }

        if (isFirst) {
          ctx.moveTo(px, py);
          isFirst = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Render Derivative if enabled on first curve
      if (showDerivative && curve.id === '1') {
        ctx.strokeStyle = '#F59E0B';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let isFirstD = true;

        for (let px = 0; px <= width; px += 2) {
          const wx = toWorldX(px);
          const wy = evaluateDerivative(curve.expression, wx);
          if (isNaN(wy) || !isFinite(wy)) {
            isFirstD = true;
            continue;
          }
          const py = toScreenY(wy);
          if (py < -height || py > height * 2) {
            isFirstD = true;
            continue;
          }
          if (isFirstD) {
            ctx.moveTo(px, py);
            isFirstD = false;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // 4. Hover Crosshair & Coordinate Tooltip
    if (hoverCoord && isTracing) {
      const activeCurve = curves[0];
      const hx = hoverCoord.x;
      const hy = evaluateMath(activeCurve.expression, hx);

      const sx = toScreenX(hx);
      const sy = toScreenY(hy);

      if (!isNaN(hy) && isFinite(hy) && sx >= 0 && sx <= width && sy >= 0 && sy <= height) {
        // Crosshair ring
        ctx.strokeStyle = activeCurve.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = activeCurve.color;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Coordinate text badge
        const label = `(${hx.toFixed(2)}, ${hy.toFixed(2)})`;
        ctx.font = 'bold 11px monospace';
        const labelW = ctx.measureText(label).width + 12;
        const badgeX = Math.min(Math.max(sx - labelW / 2, 8), width - labelW - 8);
        const badgeY = sy > 40 ? sy - 14 : sy + 24;

        ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = activeCurve.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY - 14, labelW, 20, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
        ctx.fillText(label, badgeX + 6, badgeY);
      }
    }

    ctx.restore();
  }, [
    xMin,
    xMax,
    yMin,
    yMax,
    curves,
    showDerivative,
    hoverCoord,
    isTracing,
    isDark,
    evaluateMath,
    evaluateDerivative,
  ]);

  // Handle canvas resize and re-render
  useEffect(() => {
    renderGraph();
    window.addEventListener('resize', renderGraph);
    return () => window.removeEventListener('resize', renderGraph);
  }, [renderGraph]);

  // Mouse / Touch interaction handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const worldDx = (dx / rect.width) * (xMax - xMin);
      const worldDy = (dy / rect.height) * (yMax - yMin);

      setXMin((prev) => prev - worldDx);
      setXMax((prev) => prev - worldDx);
      setYMin((prev) => prev + worldDy);
      setYMax((prev) => prev + worldDy);
    } else {
      // Hover coordinate calculation
      const px = e.clientX - rect.left;
      const worldX = xMin + (px / rect.width) * (xMax - xMin);
      setHoverCoord({ x: worldX, y: 0 });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Zoom controls
  const handleZoom = (factor: number) => {
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;
    const newHalfX = ((xMax - xMin) * factor) / 2;
    const newHalfY = ((yMax - yMin) * factor) / 2;

    setXMin(xCenter - newHalfX);
    setXMax(xCenter + newHalfX);
    setYMin(yCenter - newHalfY);
    setYMax(yCenter + newHalfY);
  };

  const handleResetZoom = () => {
    setXMin(-10);
    setXMax(10);
    setYMin(-8);
    setYMax(8);
  };

  const handleSetTrigView = () => {
    setXMin(-2 * Math.PI);
    setXMax(2 * Math.PI);
    setYMin(-2.5);
    setYMax(2.5);
  };

  const handleUpdatePrimaryFunction = (expr: string) => {
    setInputExpr(expr);
    setCurves((prev) =>
      prev.map((c) => (c.id === '1' ? { ...c, expression: expr } : c))
    );
  };

  // Find approximate roots in domain
  const findRoots = () => {
    const roots: number[] = [];
    const step = (xMax - xMin) / 500;
    const expr = curves[0].expression;
    let prevY = evaluateMath(expr, xMin);

    for (let x = xMin + step; x <= xMax; x += step) {
      const y = evaluateMath(expr, x);
      if (!isNaN(y) && !isNaN(prevY)) {
        if ((prevY < 0 && y > 0) || (prevY > 0 && y < 0)) {
          // Linear interpolation for exact root
          const rootX = x - (y * step) / (y - prevY);
          roots.push(Number(rootX.toFixed(3)));
        } else if (Math.abs(y) < 0.0001) {
          roots.push(Number(x.toFixed(3)));
        }
      }
      prevY = y;
    }
    return roots.slice(0, 6);
  };

  const rootsList = findRoots();
  const yIntercept = evaluateMath(curves[0].expression, 0);

  const handleCopyFormula = () => {
    navigator.clipboard.writeText(`y = ${curves[0].expression}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fadeIn select-none">
      {/* Header Bar */}
      <div className="bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center text-[#22C55E] shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                Interactive 2D Function Grapher
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 uppercase tracking-wider">
                Real-Time
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Plot functions, analyze roots, derivatives, extrema, and trace coordinates live on canvas
            </p>
          </div>
        </div>

        {/* Viewport Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleZoom(0.75)}
            className="p-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-zinc-300 hover:text-white border border-[#27272A] transition-colors cursor-pointer text-xs font-semibold flex items-center space-x-1"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-[#22C55E]" />
            <span className="hidden sm:inline">Zoom In</span>
          </button>

          <button
            type="button"
            onClick={() => handleZoom(1.33)}
            className="p-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-zinc-300 hover:text-white border border-[#27272A] transition-colors cursor-pointer text-xs font-semibold flex items-center space-x-1"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-[#22C55E]" />
            <span className="hidden sm:inline">Zoom Out</span>
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="p-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-zinc-300 hover:text-white border border-[#27272A] transition-colors cursor-pointer text-xs font-semibold flex items-center space-x-1"
            title="Reset standard [-10, 10] view"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Standard</span>
          </button>

          <button
            type="button"
            onClick={handleSetTrigView}
            className="p-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-zinc-300 hover:text-white border border-[#27272A] transition-colors cursor-pointer text-xs font-semibold"
            title="Trigonometric View [-2π, 2π]"
          >
            [-2π, 2π]
          </button>

          <button
            type="button"
            onClick={() => setShowDerivative((prev) => !prev)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              showDerivative
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-[#18181B] hover:bg-[#27272A] text-zinc-400 border-[#27272A]'
            }`}
            title="Toggle numerical derivative curve f'(x)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>f'(x) Derivative</span>
          </button>
        </div>
      </div>

      {/* Main Graph Canvas & Interactive Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: Interactive Coordinate Canvas (3 cols) */}
        <div className="lg:col-span-3 bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-3 sm:p-4 shadow-2xl relative flex flex-col">
          {/* Function Input Strip */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex items-center space-x-2 bg-[#121417] px-3 py-2 rounded-2xl border border-[#27272A] flex-1">
              <span className="text-sm font-mono font-bold text-[#22C55E]">f(x) =</span>
              <input
                type="text"
                value={inputExpr}
                onChange={(e) => handleUpdatePrimaryFunction(e.target.value)}
                placeholder="e.g. x^2 - 4, sin(x), exp(-x^2), 2*x + 1..."
                className="bg-transparent text-sm sm:text-base font-mono font-semibold text-white placeholder-zinc-500 focus:outline-none w-full"
              />
            </div>

            <button
              type="button"
              onClick={handleCopyFormula}
              className="p-2.5 rounded-2xl bg-[#18181B] hover:bg-[#27272A] text-zinc-300 hover:text-white border border-[#27272A] transition-colors cursor-pointer shrink-0"
              title="Copy formula"
            >
              {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* High-Performance Canvas Container */}
          <div className="relative w-full h-[360px] sm:h-[460px] rounded-2xl overflow-hidden border border-[#27272A] touch-none">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-full cursor-crosshair block"
            />

            {/* Floating Coordinate HUD overlay */}
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-zinc-300 pointer-events-none flex items-center space-x-2">
              <Crosshair className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Drag canvas to pan • Pinch / buttons to zoom</span>
            </div>

            {/* Quick Domain Indicator Bottom Right */}
            <div className="absolute bottom-2.5 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-zinc-400 pointer-events-none">
              x: [{xMin.toFixed(1)}, {xMax.toFixed(1)}] • y: [{yMin.toFixed(1)}, {yMax.toFixed(1)}]
            </div>
          </div>
        </div>

        {/* Right Column: Analysis & Curve Presets (1 col) */}
        <div className="space-y-4">
          {/* Curve Analysis Card */}
          <div className="bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Crosshair className="w-4 h-4 text-[#22C55E]" />
              <span>Curve Analysis</span>
            </h3>

            <div className="space-y-2 text-xs">
              {/* Y-Intercept */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#121417] border border-[#27272A]">
                <span className="text-zinc-400 font-medium">Y-Intercept (x=0):</span>
                <span className="font-mono font-bold text-white">
                  {!isNaN(yIntercept) ? `(0, ${yIntercept.toFixed(2)})` : 'None / Undefined'}
                </span>
              </div>

              {/* Real Roots */}
              <div className="p-2 rounded-xl bg-[#121417] border border-[#27272A] space-y-1">
                <span className="text-zinc-400 font-medium block">Roots (f(x) = 0):</span>
                {rootsList.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {rootsList.map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-[#22C55E]/15 border border-[#22C55E]/40 font-mono text-[11px] font-bold text-[#22C55E]"
                      >
                        x = {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-zinc-500 italic block">No real roots in current view</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Function Presets */}
          <div className="bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 shadow-xl space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Library of Curves</span>
            </h3>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {PRESET_FUNCTIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleUpdatePrimaryFunction(preset.expr)}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    inputExpr === preset.expr
                      ? 'bg-[#22C55E]/15 border-[#22C55E] text-white shadow-sm'
                      : 'bg-[#121417] hover:bg-[#1A1D23] border-[#27272A] text-zinc-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{preset.name}</span>
                    <span className="text-[10px] font-mono text-[#22C55E] font-semibold">{preset.expr}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
