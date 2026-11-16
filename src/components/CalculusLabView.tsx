import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  TrendingUp,
  Pin,
  Check,
  Sparkles,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { evaluateExpression } from '../services/mathEngine';
import { pinFormula } from '../services/cloudSyncService';
import { saveToHistory } from '../services/historyStorage';
import { MathRenderer } from './MathRenderer';

type CalcMode = 'derivative' | 'integral' | 'extrema' | 'limit';

interface ParsedTerm {
  sign: 1 | -1;
  raw: string;
}

interface SymbolicResult {
  isExact: boolean;
  derivativeLatex: string;
  secondDerivativeLatex: string;
  integralLatex: string;
  diffSteps: string[];
  intSteps: string[];
}

const PRESETS: { label: string; expr: string; a: number; b: number; x0: number; limitC: number }[] = [
  { label: 'Cubic Curve', expr: 'x^3 - 3x^2 + 2', a: -1, b: 3, x0: 1.5, limitC: 1 },
  { label: 'Trig Wave', expr: '2sin(x) + cos(2x)', a: 0, b: 3.1416, x0: 1.0, limitC: 0 },
  { label: 'Exponential Growth', expr: 'e^(0.5x) + x^2', a: 0, b: 3, x0: 1.2, limitC: 0 },
  { label: 'Harmonic Polynomial', expr: '2x^2 - 4x + 5', a: 0, b: 4, x0: 2.0, limitC: 2 },
  { label: 'Sinc Limit (x -> 0)', expr: 'sin(x)/x', a: -6, b: 6, x0: 1.0, limitC: 0 },
  { label: 'Removable Hole', expr: '(x^2 - 4)/(x - 2)', a: -1, b: 5, x0: 1.0, limitC: 2 },
];

function evalAt(expr: string, x: number): number {
  const clean = expr
    .replace(/\^/g, '^')
    .replace(/(\d)([a-zA-Z(])/g, '$1*$2')
    .replace(/([\)])([a-zA-Z0-9(])/g, '$1*$2')
    .replace(/\bx\b/g, `(${x})`)
    .replace(/\be\b/g, `${Math.E}`);
  try {
    const res = evaluateExpression(clean, 'rad').result;
    return isFinite(res) ? res : NaN;
  } catch {
    return NaN;
  }
}

function splitTopLevelTerms(expr: string): ParsedTerm[] {
  const s = expr.replace(/\s+/g, '');
  if (!s) return [];
  const terms: ParsedTerm[] = [];
  let depth = 0;
  let start = 0;
  let currentSign: 1 | -1 = 1;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0 && (ch === '+' || ch === '-')) {
      if (i === 0) {
        currentSign = ch === '-' ? -1 : 1;
        start = 1;
      } else if (s[i - 1] !== '^' && s[i - 1] !== '*' && s[i - 1] !== '/') {
        const raw = s.slice(start, i);
        if (raw) terms.push({ sign: currentSign, raw });
        currentSign = ch === '-' ? -1 : 1;
        start = i + 1;
      }
    }
  }
  const tail = s.slice(start);
  if (tail) terms.push({ sign: currentSign, raw: tail });
  return terms;
}

function fmtCoeff(val: number, isFirst: boolean, hideOne = true): string {
  const abs = Math.abs(val);
  const numStr = Number.isInteger(abs) ? String(abs) : Number(abs.toFixed(3)).toString();
  const prefix = val < 0 ? ' - ' : isFirst ? '' : ' + ';
  if (hideOne && Math.abs(abs - 1) < 1e-9) return prefix;
  return `${prefix}${numStr}`;
}

function formatLinearTerms(items: string[]): string {
  if (items.length === 0) return '0';
  return items.join('').replace(/^\s*\+\s*/, '').trim() || '0';
}

function analyzeSymbolic(expr: string): SymbolicResult {
  const terms = splitTopLevelTerms(expr);
  if (terms.length === 0) {
    return {
      isExact: false,
      derivativeLatex: "f'(x)",
      secondDerivativeLatex: "f''(x)",
      integralLatex: '\\int f(x)\\,dx',
      diffSteps: ['Enter a valid expression in x.'],
      intSteps: ['Enter a valid expression in x.'],
    };
  }

  const d1Parts: string[] = [];
  const d2Parts: string[] = [];
  const intParts: string[] = [];
  const diffSteps: string[] = [];
  const intSteps: string[] = [];
  let exactAll = true;

  terms.forEach((term, idx) => {
    const isFirstD1 = d1Parts.length === 0;
    const isFirstD2 = d2Parts.length === 0;
    const isFirstInt = intParts.length === 0;
    const s = term.raw;
    const sign = term.sign;

    // 1. Constant number
    if (/^\d+(?:\.\d+)?$/.test(s)) {
      const c = sign * parseFloat(s);
      diffSteps.push(`Constant rule: \\frac{d}{dx}(${c}) = 0`);
      const cTerm = `${fmtCoeff(c, isFirstInt, false)}x`;
      intParts.push(cTerm);
      intSteps.push(`Constant integral: \\int ${c}\\,dx = ${c}x`);
      return;
    }

    // 2. Polynomial ax^n or ax or x^n or x
    const polyMatch = s.match(/^(\d+(?:\.\d+)?)?\*?x(?:\^(-?\d+(?:\.\d+)?))?$/);
    if (polyMatch) {
      const a = sign * (polyMatch[1] ? parseFloat(polyMatch[1]) : 1);
      const n = polyMatch[2] ? parseFloat(polyMatch[2]) : 1;
      const newCoeff = a * n;
      const newExp = n - 1;

      if (Math.abs(newExp) < 1e-9) {
        d1Parts.push(fmtCoeff(newCoeff, isFirstD1, false));
      } else if (Math.abs(newExp - 1) < 1e-9) {
        d1Parts.push(`${fmtCoeff(newCoeff, isFirstD1, true)}x`);
      } else {
        d1Parts.push(`${fmtCoeff(newCoeff, isFirstD1, true)}x^{${newExp}}`);
      }
      diffSteps.push(
        `Power rule on $${a === 1 ? '' : a === -1 ? '-' : a}x${n === 1 ? '' : `^{${n}}`}$: multiply by $${n}$ and subtract $1$ from exponent.`
      );

      // Second derivative
      const d2Coeff = newCoeff * newExp;
      const d2Exp = newExp - 1;
      if (Math.abs(d2Coeff) > 1e-9) {
        if (Math.abs(d2Exp) < 1e-9) d2Parts.push(fmtCoeff(d2Coeff, isFirstD2, false));
        else if (Math.abs(d2Exp - 1) < 1e-9) d2Parts.push(`${fmtCoeff(d2Coeff, isFirstD2, true)}x`);
        else d2Parts.push(`${fmtCoeff(d2Coeff, isFirstD2, true)}x^{${d2Exp}}`);
      }

      // Antiderivative
      if (Math.abs(n + 1) < 1e-9) {
        intParts.push(`${fmtCoeff(a, isFirstInt, true)}\\ln|x|`);
        intSteps.push(`Logarithmic integral: \\int ${a}x^{-1}\\,dx = ${a}\\ln|x|`);
      } else {
        const intExp = n + 1;
        const intCoeff = a / intExp;
        intParts.push(`${fmtCoeff(intCoeff, isFirstInt, true)}x^{${intExp}}`);
        intSteps.push(
          `Reverse power rule on $${a}x^{${n}}$: divide coefficient by $${intExp}$ to get $${Number(intCoeff.toFixed(3))}x^{${intExp}}$.`
        );
      }
      return;
    }

    // 3. Trig: a*sin(kx) or a*cos(kx)
    const trigMatch = s.match(/^(\d+(?:\.\d+)?)?\*?(sin|cos)\((?:(-?\d+(?:\.\d+)?)?\*?x)\)$/);
    if (trigMatch) {
      const a = sign * (trigMatch[1] ? parseFloat(trigMatch[1]) : 1);
      const fn = trigMatch[2];
      const k = trigMatch[3] ? parseFloat(trigMatch[3]) : 1;
      const kStr = Math.abs(k - 1) < 1e-9 ? 'x' : `${k}x`;
      if (fn === 'sin') {
        d1Parts.push(`${fmtCoeff(a * k, isFirstD1, true)}\\cos(${kStr})`);
        d2Parts.push(`${fmtCoeff(-a * k * k, isFirstD2, true)}\\sin(${kStr})`);
        diffSteps.push(`Chain rule: \\frac{d}{dx}[${a}\\sin(${kStr})] = ${a * k}\\cos(${kStr})`);
        intParts.push(`${fmtCoeff(-a / k, isFirstInt, true)}\\cos(${kStr})`);
        intSteps.push(`Trig integral: \\int ${a}\\sin(${kStr})\\,dx = ${Number((-a / k).toFixed(3))}\\cos(${kStr})`);
      } else {
        d1Parts.push(`${fmtCoeff(-a * k, isFirstD1, true)}\\sin(${kStr})`);
        d2Parts.push(`${fmtCoeff(-a * k * k, isFirstD2, true)}\\cos(${kStr})`);
        diffSteps.push(`Chain rule: \\frac{d}{dx}[${a}\\cos(${kStr})] = ${-a * k}\\sin(${kStr})`);
        intParts.push(`${fmtCoeff(a / k, isFirstInt, true)}\\sin(${kStr})`);
        intSteps.push(`Trig integral: \\int ${a}\\cos(${kStr})\\,dx = ${Number((a / k).toFixed(3))}\\sin(${kStr})`);
      }
      return;
    }

    // 4. Exponential: a*e^(kx) or e^x
    const expMatch = s.match(/^(\d+(?:\.\d+)?)?\*?e\^\(?(?:(-?\d+(?:\.\d+)?)?\*?x)\)?$/);
    if (expMatch) {
      const a = sign * (expMatch[1] ? parseFloat(expMatch[1]) : 1);
      const k = expMatch[2] ? parseFloat(expMatch[2]) : 1;
      const kStr = Math.abs(k - 1) < 1e-9 ? 'x' : `${k}x`;
      d1Parts.push(`${fmtCoeff(a * k, isFirstD1, true)}e^{${kStr}}`);
      d2Parts.push(`${fmtCoeff(a * k * k, isFirstD2, true)}e^{${kStr}}`);
      diffSteps.push(`Exponential rule: \\frac{d}{dx}[${a}e^{${kStr}}] = ${a * k}e^{${kStr}}`);
      intParts.push(`${fmtCoeff(a / k, isFirstInt, true)}e^{${kStr}}`);
      intSteps.push(`Exponential integral: \\int ${a}e^{${kStr}}\\,dx = ${Number((a / k).toFixed(3))}e^{${kStr}}`);
      return;
    }

    // 5. Natural Log: a*ln(x)
    const lnMatch = s.match(/^(\d+(?:\.\d+)?)?\*?ln\(x\)$/);
    if (lnMatch) {
      const a = sign * (lnMatch[1] ? parseFloat(lnMatch[1]) : 1);
      d1Parts.push(`${fmtCoeff(a, isFirstD1, false)}/x`);
      d2Parts.push(`${fmtCoeff(-a, isFirstD2, false)}/x^2`);
      diffSteps.push(`Logarithmic rule: \\frac{d}{dx}[${a}\\ln(x)] = \\frac{${a}}{x}`);
      intParts.push(`${fmtCoeff(a, isFirstInt, true)}(x\\ln(x)-x)`);
      intSteps.push(`Integration by parts: \\int ${a}\\ln(x)\\,dx = ${a}(x\\ln(x) - x)`);
      return;
    }

    exactAll = false;
    diffSteps.push(`Term #${idx + 1} ($${s}$): evaluated via high-precision central difference numeric stencil.`);
    intSteps.push(`Term #${idx + 1} ($${s}$): integrated via Simpson’s composite quadrature ($n=200$).`);
  });

  return {
    isExact: exactAll,
    derivativeLatex: exactAll ? formatLinearTerms(d1Parts) : `\\frac{d}{dx}\\left[${expr}\\right]`,
    secondDerivativeLatex: exactAll ? formatLinearTerms(d2Parts) : `\\frac{d^2}{dx^2}\\left[${expr}\\right]`,
    integralLatex: exactAll ? `${formatLinearTerms(intParts)} + C` : `\\int \\left(${expr}\\right)\\,dx`,
    diffSteps,
    intSteps,
  };
}

function numericDeriv(expr: string, x: number): number {
  const h = 1e-4;
  return (evalAt(expr, x + h) - evalAt(expr, x - h)) / (2 * h);
}

function numericSecondDeriv(expr: string, x: number): number {
  const h = 1e-3;
  return (evalAt(expr, x + h) - 2 * evalAt(expr, x) + evalAt(expr, x - h)) / (h * h);
}

function simpsonIntegral(expr: string, a: number, b: number, n = 200): number {
  if (a === b) return 0;
  const h = (b - a) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const x = a + i * h;
    const y = evalAt(expr, x);
    if (!isFinite(y)) return NaN;
    const w = i === 0 || i === n ? 1 : i % 2 === 0 ? 2 : 4;
    sum += w * y;
  }
  return (h / 3) * sum;
}

export const CalculusLabView: React.FC = () => {
  const [mode, setMode] = useState<CalcMode>('derivative');
  const [expr, setExpr] = useState<string>('x^3 - 3x^2 + 2');
  const [x0, setX0] = useState<number>(1.5);
  const [lowerA, setLowerA] = useState<number>(0);
  const [upperB, setUpperB] = useState<number>(3);
  const [riemannN, setRiemannN] = useState<number>(8);
  const [limitC, setLimitC] = useState<number>(1);
  const [pinnedOk, setPinnedOk] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const symbolic = useMemo(() => analyzeSymbolic(expr), [expr]);

  const y0 = useMemo(() => evalAt(expr, x0), [expr, x0]);
  const slope0 = useMemo(() => numericDeriv(expr, x0), [expr, x0]);
  const d2_0 = useMemo(() => numericSecondDeriv(expr, x0), [expr, x0]);
  const defArea = useMemo(() => simpsonIntegral(expr, lowerA, upperB, 200), [expr, lowerA, upperB]);

  const riemannMidpoint = useMemo(() => {
    const n = Math.max(1, riemannN);
    const dx = (upperB - lowerA) / n;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const xm = lowerA + (i + 0.5) * dx;
      const y = evalAt(expr, xm);
      if (isFinite(y)) sum += y * dx;
    }
    return sum;
  }, [expr, lowerA, upperB, riemannN]);

  // Turning points scan on [lowerA, upperB]
  const extremaPoints = useMemo(() => {
    const pts: { x: number; y: number; kind: 'Local Max' | 'Local Min' | 'Inflection' }[] = [];
    const span = Math.max(0.5, upperB - lowerA);
    const steps = 160;
    const dx = span / steps;
    let prevD = numericDeriv(expr, lowerA);
    for (let i = 1; i <= steps; i++) {
      const xc = lowerA + i * dx;
      const curD = numericDeriv(expr, xc);
      if (isFinite(prevD) && isFinite(curD) && ((prevD > 0 && curD <= 0) || (prevD < 0 && curD >= 0))) {
        const rootX = xc - dx * 0.5;
        const d2 = numericSecondDeriv(expr, rootX);
        const kind = d2 < -1e-2 ? 'Local Max' : d2 > 1e-2 ? 'Local Min' : 'Inflection';
        const ry = evalAt(expr, rootX);
        if (isFinite(ry)) pts.push({ x: Number(rootX.toFixed(3)), y: Number(ry.toFixed(3)), kind });
      }
      prevD = curD;
    }
    return pts.slice(0, 6);
  }, [expr, lowerA, upperB]);

  // Left/right limit table
  const limitRows = useMemo(() => {
    const deltas = [0.1, 0.01, 0.001, 0.0001];
    return deltas.map((d) => ({
      delta: d,
      leftX: Number((limitC - d).toFixed(5)),
      leftY: evalAt(expr, limitC - d),
      rightX: Number((limitC + d).toFixed(5)),
      rightY: evalAt(expr, limitC + d),
    }));
  }, [expr, limitC]);

  const limitEstimate = useMemo(() => {
    const last = limitRows[limitRows.length - 1];
    if (!last || !isFinite(last.leftY) || !isFinite(last.rightY)) return null;
    const diff = Math.abs(last.leftY - last.rightY);
    if (diff < 0.05) {
      return { exists: true, value: Number(((last.leftY + last.rightY) / 2).toFixed(4)) };
    }
    return { exists: false, value: NaN };
  }, [limitRows]);

  // Render high-DPI Calculus Canvas (curve, shaded integral, Riemann rectangles, tangent line)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const w = c.width;
    const h = c.height;
    ctx.fillStyle = '#090D14';
    ctx.fillRect(0, 0, w, h);

    const minX = Math.min(lowerA, upperB, x0, limitC) - 1.5;
    const maxX = Math.max(lowerA, upperB, x0, limitC) + 1.5;
    const spanX = Math.max(4, maxX - minX);

    // Sample range for Y auto-fit
    const samples: { x: number; y: number }[] = [];
    let minY = -4;
    let maxY = 4;
    for (let i = 0; i <= 220; i++) {
      const sx = minX + (i / 220) * spanX;
      const sy = evalAt(expr, sx);
      samples.push({ x: sx, y: sy });
      if (isFinite(sy) && Math.abs(sy) < 120) {
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
      }
    }
    const padY = Math.max(1, (maxY - minY) * 0.16);
    minY -= padY;
    maxY += padY;
    const spanY = Math.max(2, maxY - minY);

    const toPx = (x: number) => ((x - minX) / spanX) * w;
    const toPy = (y: number) => h - ((y - minY) / spanY) * h;

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const gxStep = Math.max(0.5, Math.pow(10, Math.floor(Math.log10(spanX / 6))));
    for (let gx = Math.ceil(minX / gxStep) * gxStep; gx <= maxX; gx += gxStep) {
      const px = toPx(gx);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
    const gyStep = Math.max(0.5, Math.pow(10, Math.floor(Math.log10(spanY / 5))));
    for (let gy = Math.ceil(minY / gyStep) * gyStep; gy <= maxY; gy += gyStep) {
      const py = toPy(gy);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(148,163,184,0.45)';
    ctx.lineWidth = 1.5;
    if (minY <= 0 && maxY >= 0) {
      const yAxis = toPy(0);
      ctx.beginPath();
      ctx.moveTo(0, yAxis);
      ctx.lineTo(w, yAxis);
      ctx.stroke();
    }
    if (minX <= 0 && maxX >= 0) {
      const xAxis = toPx(0);
      ctx.beginPath();
      ctx.moveTo(xAxis, 0);
      ctx.lineTo(xAxis, h);
      ctx.stroke();
    }

    // Integral mode: Shaded definite area + Riemann rectangles
    if (mode === 'integral') {
      const a = Math.min(lowerA, upperB);
      const b = Math.max(lowerA, upperB);
      const y0Px = toPy(0);

      // Shaded exact fill
      ctx.save();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.24)';
      ctx.beginPath();
      ctx.moveTo(toPx(a), y0Px);
      for (let i = 0; i <= 100; i++) {
        const sx = a + (i / 100) * (b - a);
        const sy = evalAt(expr, sx);
        if (isFinite(sy)) ctx.lineTo(toPx(sx), toPy(sy));
      }
      ctx.lineTo(toPx(b), y0Px);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Midpoint Riemann rectangles
      const n = Math.max(1, riemannN);
      const dx = (b - a) / n;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < n; i++) {
        const rx = a + i * dx;
        const ym = evalAt(expr, rx + dx * 0.5);
        if (!isFinite(ym)) continue;
        const px1 = toPx(rx);
        const px2 = toPx(rx + dx);
        const pyM = toPy(ym);
        ctx.fillRect(px1, Math.min(y0Px, pyM), px2 - px1, Math.abs(y0Px - pyM));
        ctx.strokeRect(px1, Math.min(y0Px, pyM), px2 - px1, Math.abs(y0Px - pyM));
      }
    }

    // Plot primary function f(x)
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    let penDown = false;
    samples.forEach((pt) => {
      if (!isFinite(pt.y) || Math.abs(pt.y) > 200) {
        penDown = false;
        return;
      }
      const px = toPx(pt.x);
      const py = toPy(pt.y);
      if (!penDown) {
        ctx.moveTo(px, py);
        penDown = true;
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.stroke();

    // Derivative mode: tangent line at x0
    if (mode === 'derivative' && isFinite(y0) && isFinite(slope0)) {
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 4]);
      const tx1 = minX;
      const ty1 = y0 + slope0 * (tx1 - x0);
      const tx2 = maxX;
      const ty2 = y0 + slope0 * (tx2 - x0);
      ctx.beginPath();
      ctx.moveTo(toPx(tx1), toPy(ty1));
      ctx.lineTo(toPx(tx2), toPy(ty2));
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(toPx(x0), toPy(y0), 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Extrema mode: draw f'(x) dashed + mark turning points
    if (mode === 'extrema') {
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      let down = false;
      samples.forEach((pt) => {
        const d = numericDeriv(expr, pt.x);
        if (!isFinite(d) || Math.abs(d) > 200) {
          down = false;
          return;
        }
        if (!down) {
          ctx.moveTo(toPx(pt.x), toPy(d));
          down = true;
        } else {
          ctx.lineTo(toPx(pt.x), toPy(d));
        }
      });
      ctx.stroke();
      ctx.restore();

      extremaPoints.forEach((ep) => {
        ctx.fillStyle = ep.kind === 'Local Max' ? '#F43F5E' : '#38BDF8';
        ctx.beginPath();
        ctx.arc(toPx(ep.x), toPy(ep.y), 6, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Limit mode marker
    if (mode === 'limit' && limitEstimate?.exists) {
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(toPx(limitC), toPy(limitEstimate.value), 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [expr, mode, x0, y0, slope0, lowerA, upperB, riemannN, limitC, extremaPoints, limitEstimate]);

  const handlePinResult = () => {
    const formulaLatex =
      mode === 'derivative'
        ? `\\frac{d}{dx}[${expr}] = ${symbolic.derivativeLatex}`
        : mode === 'integral'
        ? `\\int_{${lowerA}}^{${upperB}} (${expr})\\,dx \\approx ${isFinite(defArea) ? defArea.toFixed(4) : '\\text{undef}'}`
        : mode === 'limit'
        ? `\\lim_{x \\to ${limitC}} (${expr}) = ${limitEstimate?.exists ? limitEstimate.value : '\\text{DNE}'}`
        : `f'(x) = ${symbolic.derivativeLatex}`;

    pinFormula({
      title: `Calculus (${mode}) of ${expr}`,
      subject: 'Calculus',
      latex: formulaLatex,
      notes: mode === 'derivative' ? `Tangent slope at x=${x0} is ${slope0.toFixed(3)}` : undefined,
    });
    saveToHistory({
      title: `Calculus (${mode}): ${expr}`,
      problemStatement: `Calculus ${mode}: ${expr}`,
      formula: formulaLatex,
      substitution: mode === 'derivative' ? `x_0 = ${x0}` : mode === 'limit' ? `x \\to ${limitC}` : `[${lowerA}, ${upperB}]`,
      finalAnswer: formulaLatex,
      category: 'Calculus',
      steps: mode === 'integral' ? symbolic.intSteps : symbolic.diffSteps,
    });
    setPinnedOk(true);
    setTimeout(() => setPinnedOk(false), 1800);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#22C55E]" />
              <span>Offline Symbolic Calculus & Area Lab</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
              100% offline step-by-step differentiation, antiderivatives, definite Riemann integration, turning points & two-sided limits.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePinResult}
            className="px-3.5 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
          >
            {pinnedOk ? <Check className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            <span>{pinnedOk ? 'Pinned & Saved!' : 'Pin & Save Result'}</span>
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'derivative', label: 'Differentiate & Tangent' },
              { id: 'integral', label: 'Integrate & Area' },
              { id: 'extrema', label: 'Turning Points & Slope' },
              { id: 'limit', label: 'Limits (x → c)' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                mode === m.id
                  ? 'bg-[#22C55E] text-white'
                  : 'bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-[#27272A]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Function Input & Presets */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 bg-slate-50 dark:bg-[#121216]">
            <span className="font-mono text-xs font-bold text-[#22C55E]">f(x) =</span>
            <input
              type="text"
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              placeholder="e.g. x^3 - 3x^2 + 2 or 2sin(x) + e^(0.5x)"
              className="flex-1 bg-transparent text-sm font-mono focus:outline-none text-slate-900 dark:text-white"
            />
          </div>
          <div className="md:col-span-6 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setExpr(p.expr);
                  setLowerA(p.a);
                  setUpperB(p.b);
                  setX0(p.x0);
                  setLimitC(p.limitC);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] text-[11px] font-semibold hover:border-[#22C55E] cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Calculus Canvas */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 space-y-4">
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#27272A]">
            <canvas ref={canvasRef} width={680} height={380} className="w-full h-auto block" />
          </div>

          {/* Interactive Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {mode === 'derivative' && (
              <div className="sm:col-span-3 rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Tangent Point x₀</span>
                  <span className="font-mono text-[#22C55E] font-bold">x₀ = {x0}</span>
                </div>
                <input
                  type="range"
                  min={-4}
                  max={4}
                  step={0.1}
                  value={x0}
                  onChange={(e) => setX0(parseFloat(e.target.value))}
                  className="w-full accent-[#22C55E] cursor-pointer"
                />
              </div>
            )}

            {(mode === 'integral' || mode === 'extrema') && (
              <>
                <label className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3 block">
                  <span className="font-bold block mb-1">Lower Bound (a)</span>
                  <input
                    type="number"
                    step={0.5}
                    value={lowerA}
                    onChange={(e) => setLowerA(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 dark:border-[#27272A] px-2.5 py-1.5 font-mono"
                  />
                </label>
                <label className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3 block">
                  <span className="font-bold block mb-1">Upper Bound (b)</span>
                  <input
                    type="number"
                    step={0.5}
                    value={upperB}
                    onChange={(e) => setUpperB(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 dark:border-[#27272A] px-2.5 py-1.5 font-mono"
                  />
                </label>
                {mode === 'integral' && (
                  <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3">
                    <div className="flex justify-between font-bold mb-1">
                      <span>Riemann Rectangles</span>
                      <span className="text-[#22C55E]">{riemannN}</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={40}
                      step={1}
                      value={riemannN}
                      onChange={(e) => setRiemannN(Number(e.target.value))}
                      className="w-full accent-[#22C55E] cursor-pointer"
                    />
                  </div>
                )}
              </>
            )}

            {mode === 'limit' && (
              <label className="sm:col-span-3 rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3 block">
                <span className="font-bold block mb-1">Target Point c (evaluate lim x → c)</span>
                <input
                  type="number"
                  step={0.5}
                  value={limitC}
                  onChange={(e) => setLimitC(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 dark:border-[#27272A] px-2.5 py-1.5 font-mono"
                />
              </label>
            )}
          </div>
        </div>

        {/* Right: Step-by-Step Symbolic Rules & Exact Numeric Readouts */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 text-xs text-[#22C55E] font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Symbolic & Numeric Result</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setExpr('x^3 - 3x^2 + 2');
                  setLowerA(0);
                  setUpperB(3);
                  setX0(1.5);
                }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {mode === 'derivative' && (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3.5 overflow-x-auto">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">First Derivative f&apos;(x)</div>
                  <MathRenderer content={`$$f'(x) = ${symbolic.derivativeLatex}$$`} />
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3.5 overflow-x-auto">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">Second Derivative f&apos;&apos;(x)</div>
                  <MathRenderer content={`$$f''(x) = ${symbolic.secondDerivativeLatex}$$`} />
                </div>
                <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-3.5 space-y-1">
                  <div className="font-bold text-[#22C55E]">Evaluation & Tangent at x₀ = {x0}</div>
                  <div>f({x0}) = {isFinite(y0) ? y0.toFixed(4) : 'undefined'}</div>
                  <div>Slope f&apos;({x0}) = {isFinite(slope0) ? slope0.toFixed(4) : 'undefined'}</div>
                  <div>Concavity f&apos;&apos;({x0}) = {isFinite(d2_0) ? d2_0.toFixed(3) : '—'} ({d2_0 > 0 ? 'Concave Up' : d2_0 < 0 ? 'Concave Down' : 'Inflection'})</div>
                  {isFinite(y0) && isFinite(slope0) && (
                    <div className="font-mono pt-1 text-slate-900 dark:text-white">
                      Tangent: y = {slope0.toFixed(2)}x {(y0 - slope0 * x0) >= 0 ? '+' : '-'} {Math.abs(y0 - slope0 * x0).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {mode === 'integral' && (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3.5 overflow-x-auto">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">Indefinite Antiderivative</div>
                  <MathRenderer content={`$$\\int f(x)\\,dx = ${symbolic.integralLatex}$$`} />
                </div>
                <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-3.5 space-y-1">
                  <div className="font-bold text-[#22C55E]">
                    Definite Integral [{lowerA}, {upperB}]
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                    Simpson Exact Area: {isFinite(defArea) ? defArea.toFixed(5) : 'Undefined'}
                  </div>
                  <div className="text-slate-600 dark:text-zinc-300 tabular-nums">
                    Midpoint Riemann Sum ({riemannN} rects): {isFinite(riemannMidpoint) ? riemannMidpoint.toFixed(5) : 'Undefined'}
                  </div>
                </div>
              </div>
            )}

            {mode === 'extrema' && (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3.5 overflow-x-auto">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">Critical Condition f&apos;(x) = 0</div>
                  <MathRenderer content={`$$f'(x) = ${symbolic.derivativeLatex} = 0$$`} />
                </div>
                {extremaPoints.length === 0 ? (
                  <p className="text-slate-500">No stationary points detected inside [{lowerA}, {upperB}]. Widen bounds to scan further.</p>
                ) : (
                  <div className="space-y-2">
                    {extremaPoints.map((pt, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 dark:border-[#27272A] p-3 flex items-center justify-between">
                        <span className="font-bold text-[#22C55E]">{pt.kind}</span>
                        <span className="font-mono">({pt.x}, {pt.y})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mode === 'limit' && (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-3.5">
                  <div className="font-bold text-[#22C55E]">Estimated Two-Sided Limit</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {limitEstimate?.exists ? `lim (x → ${limitC}) ≈ ${limitEstimate.value}` : 'Limit Does Not Exist (Jump / Asymptote)'}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#27272A]">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-slate-100 dark:bg-[#141418]">
                      <tr>
                        <th className="p-2">x⁻ (Left)</th>
                        <th className="p-2">f(x⁻)</th>
                        <th className="p-2">x⁺ (Right)</th>
                        <th className="p-2">f(x⁺)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {limitRows.map((r) => (
                        <tr key={r.delta} className="border-t border-slate-200 dark:border-[#27272A]">
                          <td className="p-2">{r.leftX}</td>
                          <td className="p-2 text-[#22C55E]">{isFinite(r.leftY) ? r.leftY.toFixed(5) : 'undef'}</td>
                          <td className="p-2">{r.rightX}</td>
                          <td className="p-2 text-[#38BDF8]">{isFinite(r.rightY) ? r.rightY.toFixed(5) : 'undef'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Step-by-step Rule Breakdown */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 space-y-2.5">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#22C55E]" />
              <span>Step-by-Step Rules Applied</span>
            </div>
            <div className="space-y-2 text-xs">
              {(mode === 'integral' ? symbolic.intSteps : symbolic.diffSteps).map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3 overflow-x-auto"
                >
                  <span className="font-mono font-bold text-[#22C55E] mr-2">Step {idx + 1}:</span>
                  <MathRenderer content={step} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
