import React, { useMemo, useState } from 'react';
import { SlidersHorizontal, TrendingUp } from 'lucide-react';
import { PHYSICS_FORMULAS } from '../services/physicsEngine';
import { formatNum } from '../services/mathEngine';
import { MathRenderer } from './MathRenderer';

export const FormulaExplorerView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [formulaId, setFormulaId] = useState<string>(PHYSICS_FORMULAS[0]?.id || 'speed_dist_time');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(PHYSICS_FORMULAS.map((f) => f.category)))],
    []
  );

  const filteredFormulas = useMemo(
    () =>
      selectedCategory === 'All'
        ? PHYSICS_FORMULAS
        : PHYSICS_FORMULAS.filter((f) => f.category === selectedCategory),
    [selectedCategory]
  );

  const activeFormula = useMemo(
    () => PHYSICS_FORMULAS.find((f) => f.id === formulaId) || PHYSICS_FORMULAS[0],
    [formulaId]
  );

  const targetKeys = Object.keys(activeFormula.solveFor);
  const [targetVar, setTargetVar] = useState<string>(targetKeys[0] || '');
  const [xAxisVar, setXAxisVar] = useState<string>(
    activeFormula.variables.find((v) => v.symbol !== targetKeys[0])?.symbol || activeFormula.variables[0]?.symbol || ''
  );

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    activeFormula.variables.forEach((v) => {
      init[v.symbol] = v.defaultValue ?? 10;
    });
    return init;
  });

  const handleSelectFormula = (newId: string) => {
    const nextF = PHYSICS_FORMULAS.find((f) => f.id === newId) || PHYSICS_FORMULAS[0];
    setFormulaId(nextF.id);
    const nextTargets = Object.keys(nextF.solveFor);
    const nextTarget = nextTargets[0] || '';
    setTargetVar(nextTarget);
    const nextX =
      nextF.variables.find((v) => v.symbol !== nextTarget)?.symbol || nextF.variables[0]?.symbol || '';
    setXAxisVar(nextX);
    const nextVals: Record<string, number> = {};
    nextF.variables.forEach((v) => {
      nextVals[v.symbol] = v.defaultValue ?? 10;
    });
    setValues(nextVals);
  };

  const handleSelectTarget = (nextTarget: string) => {
    setTargetVar(nextTarget);
    if (xAxisVar === nextTarget) {
      const alt = activeFormula.variables.find((v) => v.symbol !== nextTarget)?.symbol || '';
      setXAxisVar(alt);
    }
  };

  const solverSpec = activeFormula.solveFor[targetVar] || activeFormula.solveFor[targetKeys[0]];
  const otherInputs = activeFormula.variables.filter((v) => v.symbol !== targetVar);

  // Compute current deterministic value
  const currentResult = useMemo(() => {
    try {
      const res = solverSpec.calculate(values);
      return { ok: true, ...res };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Undefined at current values' };
    }
  }, [solverSpec, values]);

  // Sweep X variable across a clean range to visualize exact relationship Y(X)
  const graphData = useMemo(() => {
    const xMeta = activeFormula.variables.find((v) => v.symbol === xAxisVar);
    if (!xMeta || !solverSpec) return null;

    const currentX = values[xAxisVar] ?? xMeta.defaultValue ?? 10;
    const minBase = xMeta.min ?? 0.5;
    const xMin = Math.max(minBase, currentX > 0 ? currentX * 0.1 : 0.2);
    const xMax = Math.max(xMin + 5, currentX > 0 ? currentX * 2.5 : 20);
    const samples = 60;
    const pts: Array<{ x: number; y: number }> = [];

    for (let i = 0; i <= samples; i++) {
      const x = xMin + (i / samples) * (xMax - xMin);
      try {
        const res = solverSpec.calculate({ ...values, [xAxisVar]: x });
        if (typeof res.result === 'number' && isFinite(res.result)) {
          pts.push({ x, y: res.result });
        }
      } catch {
        // skip singularities like x = 0
      }
    }

    if (pts.length < 3) return null;

    const yVals = pts.map((p) => p.y);
    let yMin = Math.min(...yVals);
    let yMax = Math.max(...yVals);
    if (Math.abs(yMax - yMin) < 1e-6) {
      yMin -= 1;
      yMax += 1;
    }

    // Determine relationship trend label
    const first = pts[0].y;
    const mid = pts[Math.floor(pts.length / 2)].y;
    const last = pts[pts.length - 1].y;
    const slope1 = mid - first;
    const slope2 = last - mid;
    let relationship = 'Non-linear response';
    if (slope1 > 0 && slope2 > 0) {
      relationship = slope2 > slope1 * 1.15 ? 'Direct Super-Linear (Increasing Rate)' : Math.abs(slope2 - slope1) <= Math.abs(slope1) * 0.15 ? 'Direct Linear (Proportional)' : 'Sub-Linear Growth (e.g. √x)';
    } else if (slope1 < 0 && slope2 < 0) {
      relationship = 'Inverse Decay (Decreasing with ' + xAxisVar + ')';
    }

    return { pts, xMin, xMax, yMin, yMax, currentX, currentY: currentResult.ok ? (currentResult as any).result : null, relationship };
  }, [activeFormula, solverSpec, values, xAxisVar, currentResult]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Formula Relationship Explorer
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
              Adjust any physical variable using sliders and observe exact deterministic recalculation alongside live response curves.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                const cat = e.target.value;
                setSelectedCategory(cat);
                const list = cat === 'All' ? PHYSICS_FORMULAS : PHYSICS_FORMULAS.filter((f) => f.category === cat);
                if (list.length > 0) handleSelectFormula(list[0].id);
              }}
              className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] px-3 py-2 text-xs font-semibold"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={activeFormula.id}
              onChange={(e) => handleSelectFormula(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] px-3 py-2 text-xs font-semibold max-w-xs"
            >
              {filteredFormulas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.baseFormula})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-5">
          <div>
            <div className="text-xs text-slate-500 dark:text-[#A1A1AA]">{activeFormula.category}</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeFormula.name}</h3>
            <p className="text-xs text-slate-600 dark:text-[#A1A1AA] mt-1">{activeFormula.description}</p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3.5">
            <div className="text-[11px] font-semibold text-slate-500 mb-1">Rearranged Formula for Output</div>
            <div className="text-base font-mono font-bold text-[#22C55E]">
              {solverSpec?.rearrangedFormula || activeFormula.baseFormula}
            </div>
          </div>

          {/* Target Output Selector */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800 dark:text-zinc-200">Solve For (Dependent Variable Y)</div>
            <div className="flex flex-wrap gap-1.5">
              {targetKeys.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleSelectTarget(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                    targetVar === k
                      ? 'bg-[#22C55E] text-white'
                      : 'bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Parameter Sliders */}
          <div className="space-y-4 pt-1 border-t border-slate-200 dark:border-[#27272A]">
            <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Adjust Input Variables</span>
            </div>
            {otherInputs.map((param) => {
              const val = values[param.symbol] ?? param.defaultValue ?? 10;
              const min = param.min ?? 0.5;
              const max = Math.max(min + 20, (param.defaultValue ?? 10) * 4, val * 1.5);
              const step = param.step ?? (max <= 10 ? 0.1 : 0.5);
              return (
                <div key={param.symbol} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setXAxisVar(param.symbol)}
                      className={`font-semibold cursor-pointer ${
                        xAxisVar === param.symbol ? 'text-[#22C55E] underline' : 'text-slate-700 dark:text-zinc-300'
                      }`}
                      title="Click to plot this variable on the X-axis"
                    >
                      {param.name} ({param.symbol}) {xAxisVar === param.symbol ? '· [X-Axis]' : ''}
                    </button>
                    <input
                      type="number"
                      step={step}
                      value={val}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [param.symbol]: Number(e.target.value),
                        }))
                      }
                      className="w-24 rounded-lg border border-slate-200 dark:border-[#27272A] px-2 py-1 text-right font-mono text-xs tabular-nums"
                    />
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={val}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [param.symbol]: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-[#22C55E] cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Output & Responsive Graph */}
        <div className="lg:col-span-7 space-y-5">
          {/* Result Card */}
          <div className="rounded-2xl border border-[#22C55E]/40 bg-[#22C55E]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#22C55E]">Computed Output ({targetVar})</div>
              {currentResult.ok ? (
                <div className="text-3xl font-mono font-bold tabular-nums text-slate-900 dark:text-white mt-1">
                  {formatNum((currentResult as any).result, 4)}{' '}
                  <span className="text-sm font-normal text-slate-600 dark:text-zinc-300">
                    {solverSpec?.unit}
                  </span>
                </div>
              ) : (
                <div className="text-sm font-semibold text-rose-500 mt-1">{(currentResult as any).error}</div>
              )}
            </div>
            {currentResult.ok && (
              <div className="text-xs font-mono text-slate-700 dark:text-zinc-300 bg-white dark:bg-[#0A0A0A] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#27272A]">
                {(currentResult as any).substitution}
              </div>
            )}
          </div>

          {/* Interactive Sweep Plot */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <TrendingUp className="w-4 h-4 text-[#22C55E]" />
                <span>
                  Response Curve: {targetVar} vs {xAxisVar}
                </span>
              </div>
              {graphData && (
                <span className="text-xs font-semibold text-[#22C55E]">{graphData.relationship}</span>
              )}
            </div>

            {graphData ? (
              <ResponsiveRelationshipSvg
                pts={graphData.pts}
                xMin={graphData.xMin}
                xMax={graphData.xMax}
                yMin={graphData.yMin}
                yMax={graphData.yMax}
                currentX={graphData.currentX}
                currentY={graphData.currentY}
                xLabel={xAxisVar}
                yLabel={`${targetVar} (${solverSpec?.unit || ''})`}
              />
            ) : (
              <p className="text-xs text-slate-500 py-8 text-center">
                Select an input variable with non-zero span to plot its relationship curve.
              </p>
            )}

            {currentResult.ok && (
              <div className="pt-2 border-t border-slate-200 dark:border-[#27272A] space-y-1.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Deterministic Calculation Steps</div>
                {(currentResult as any).steps.map((s: string, i: number) => (
                  <div key={i} className="text-xs text-slate-600 dark:text-[#A1A1AA]">
                    <MathRenderer content={s} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ResponsiveRelationshipSvg: React.FC<{
  pts: Array<{ x: number; y: number }>;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  currentX: number;
  currentY: number | null;
  xLabel: string;
  yLabel: string;
}> = ({ pts, xMin, xMax, yMin, yMax, currentX, currentY, xLabel, yLabel }) => {
  const W = 600;
  const H = 260;
  const PAD = 44;

  const mapX = (x: number) => PAD + ((x - xMin) / Math.max(1e-6, xMax - xMin)) * (W - PAD * 2);
  const mapY = (y: number) => H - PAD - ((y - yMin) / Math.max(1e-6, yMax - yMin)) * (H - PAD * 2);

  const pathD = pts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(p.y).toFixed(1)}`)
    .join(' ');

  const cx = mapX(currentX);
  const cy = currentY !== null && isFinite(currentY) ? mapY(currentY) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl bg-slate-50 dark:bg-[#111115] border border-slate-200 dark:border-[#27272A]">
      {/* Grid */}
      {[0.25, 0.5, 0.75].map((f) => {
        const y = PAD + f * (H - PAD * 2);
        const x = PAD + f * (W - PAD * 2);
        return (
          <g key={f} stroke="currentColor" className="text-slate-200 dark:text-zinc-800" strokeWidth="1">
            <line x1={PAD} y1={y} x2={W - PAD} y2={y} />
            <line x1={x} y1={PAD} x2={x} y2={H - PAD} />
          </g>
        );
      })}
      {/* Axes */}
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#64748B" strokeWidth="1.5" />
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#64748B" strokeWidth="1.5" />

      {/* Curve */}
      <path d={pathD} fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Active Operating Point */}
      {cy !== null && (
        <g>
          <line x1={cx} y1={H - PAD} x2={cx} y2={cy} stroke="#38BDF8" strokeDasharray="4 4" strokeWidth="1.5" />
          <line x1={PAD} y1={cy} x2={cx} y2={cy} stroke="#38BDF8" strokeDasharray="4 4" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="6" fill="#22C55E" stroke="#FFFFFF" strokeWidth="2" />
        </g>
      )}

      {/* Axis Labels */}
      <text x={W / 2} y={H - 12} textAnchor="middle" fill="#94A3B8" fontSize="11" fontWeight="600">
        {xLabel} ({formatNum(xMin, 2)} → {formatNum(xMax, 2)})
      </text>
      <text x={14} y={H / 2} textAnchor="middle" transform={`rotate(-90 14 ${H / 2})`} fill="#94A3B8" fontSize="11" fontWeight="600">
        {yLabel}
      </text>
    </svg>
  );
};
