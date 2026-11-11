import React, { useState, useMemo } from 'react';
import {
  Cpu,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Layers,
  ArrowRight,
  Maximize2,
  Table,
} from 'lucide-react';

type MatrixSize = '2x2' | '3x3';

export const MatrixLabView: React.FC = () => {
  const [size, setSize] = useState<MatrixSize>('3x3');

  // Matrix A entries (Row-major)
  const [m3, setM3] = useState<number[][]>([
    [2, 1, -1],
    [-3, -1, 2],
    [-2, 1, 2],
  ]);

  // Constants vector B for linear system Ax = B
  const [b3, setB3] = useState<number[]>([8, -11, -3]);

  // 2x2 state
  const [m2, setM2] = useState<number[][]>([
    [4, 7],
    [2, 6],
  ]);
  const [b2, setB2] = useState<number[]>([15, 10]);

  const handleCellChange = (row: number, col: number, val: string) => {
    const num = parseFloat(val) || 0;
    if (size === '3x3') {
      const next = m3.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? num : c)));
      setM3(next);
    } else {
      const next = m2.map((r, ri) => r.map((c, ci) => (ri === row && ci === col ? num : c)));
      setM2(next);
    }
  };

  const handleBChange = (idx: number, val: string) => {
    const num = parseFloat(val) || 0;
    if (size === '3x3') {
      const next = [...b3];
      next[idx] = num;
      setB3(next);
    } else {
      const next = [...b2];
      next[idx] = num;
      setB2(next);
    }
  };

  // Computations
  const results = useMemo(() => {
    if (size === '2x2') {
      const [[a, b], [c, d]] = m2;
      const det = a * d - b * c;
      const trace = a + d;
      const isSingular = Math.abs(det) < 1e-9;

      let inv: number[][] | null = null;
      if (!isSingular) {
        inv = [
          [d / det, -b / det],
          [-c / det, a / det],
        ];
      }

      // Solve Ax = B using Cramer's rule
      let solution: { x: number; y: number } | null = null;
      if (!isSingular) {
        const [k1, k2] = b2;
        const detX = k1 * d - b * k2;
        const detY = a * k2 - k1 * c;
        solution = { x: detX / det, y: detY / det };
      }

      return {
        det,
        trace,
        isSingular,
        inv,
        solution,
        detSteps: `det(A) = (${a} × ${d}) - (${b} × ${c}) = ${a * d} - ${b * c} = ${det}`,
      };
    } else {
      // 3x3 Matrix computations
      const [
        [a11, a12, a13],
        [a21, a22, a23],
        [a31, a32, a33],
      ] = m3;

      // Minors for row 1
      const m11 = a22 * a33 - a23 * a32;
      const m12 = a21 * a33 - a23 * a31;
      const m13 = a21 * a32 - a22 * a31;

      const det = a11 * m11 - a12 * m12 + a13 * m13;
      const trace = a11 + a22 + a33;
      const isSingular = Math.abs(det) < 1e-9;

      // Full Cofactor Matrix C
      const c11 = m11;
      const c12 = -m12;
      const c13 = m13;

      const c21 = -(a12 * a33 - a13 * a32);
      const c22 = a11 * a33 - a13 * a31;
      const c23 = -(a11 * a32 - a12 * a31);

      const c31 = a12 * a23 - a13 * a22;
      const c32 = -(a11 * a23 - a13 * a21);
      const c33 = a11 * a22 - a12 * a21;

      // Adjugate is transpose of Cofactor matrix
      let inv: number[][] | null = null;
      if (!isSingular) {
        inv = [
          [c11 / det, c21 / det, c31 / det],
          [c12 / det, c22 / det, c32 / det],
          [c13 / det, c23 / det, c33 / det],
        ];
      }

      // Cramer's rule for 3x3 system Ax = B
      let solution: { x: number; y: number; z: number } | null = null;
      if (!isSingular) {
        const [k1, k2, k3] = b3;
        // Matrix replacing col 1 with B
        const detX =
          k1 * (a22 * a33 - a23 * a32) -
          a12 * (k2 * a33 - a23 * k3) +
          a13 * (k2 * a32 - a22 * k3);
        // Matrix replacing col 2 with B
        const detY =
          a11 * (k2 * a33 - a23 * k3) -
          k1 * (a21 * a33 - a23 * a31) +
          a13 * (a21 * k3 - k2 * a31);
        // Matrix replacing col 3 with B
        const detZ =
          a11 * (a22 * k3 - k2 * a32) -
          a12 * (a21 * k3 - k2 * a31) +
          k1 * (a21 * a32 - a22 * a31);

        solution = { x: detX / det, y: detY / det, z: detZ / det };
      }

      const detSteps = `det(A) = ${a11}·(${a22}×${a33} - ${a23}×${a32}) - ${a12}·(${a21}×${a33} - ${a23}×${a31}) + ${a13}·(${a21}×${a32} - ${a22}×${a31})
= ${a11}·(${m11}) - ${a12}·(${m12}) + ${a13}·(${m13})
= ${a11 * m11} - ${a12 * m12} + ${a13 * m13} = ${det}`;

      return {
        det,
        trace,
        isSingular,
        inv,
        solution,
        detSteps,
      };
    }
  }, [size, m2, m3, b2, b3]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] font-bold text-xs uppercase tracking-wider border border-[#3B82F6]/30">
                Advanced Mathematics & Linear Algebra
              </span>
              <span className="text-xs text-[#A1A1AA]">· Further Maths · Engineering · Matrices</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] mt-1 flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-[#3B82F6]" />
              <span>Matrix Algebra & Linear System Gaussian Solver</span>
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (size === '3x3') {
                  setM3([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
                  setB3([1, 1, 1]);
                } else {
                  setM2([[1, 0], [0, 1]]);
                  setB2([1, 1]);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Identity Matrix</span>
            </button>
          </div>
        </div>

        {/* Matrix Dimension Selector */}
        <div className="flex space-x-2">
          <button
            onClick={() => setSize('3x3')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              size === '3x3'
                ? 'bg-[#3B82F6] text-white font-bold shadow-md shadow-blue-500/20'
                : 'bg-[#121214] border border-[#27272A] text-[#A1A1AA] hover:text-white'
            }`}
          >
            3×3 Matrix & 3-Variable Linear System (x, y, z)
          </button>
          <button
            onClick={() => setSize('2x2')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              size === '2x2'
                ? 'bg-[#3B82F6] text-white font-bold shadow-md shadow-blue-500/20'
                : 'bg-[#121214] border border-[#27272A] text-[#A1A1AA] hover:text-white'
            }`}
          >
            2×2 Matrix & 2-Variable System (x, y)
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matrix Entry Board */}
        <div className="lg:col-span-2 bg-[#000000] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Table className="w-4 h-4 text-[#3B82F6]" />
              <span>Interactive Matrix [A] & Constants Vector [B]</span>
            </span>
            <span className="text-xs text-[#A1A1AA]">Directly edit any cell</span>
          </div>

          {/* Matrix Input Bracket Container */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-5 py-4 overflow-x-auto">
            {/* Matrix A Brackets */}
            <div className="flex items-center">
              <span className="text-4xl sm:text-5xl font-light text-[#71717A]">[</span>
              <div
                className={`grid gap-2 p-2 ${
                  size === '3x3' ? 'grid-cols-3' : 'grid-cols-2'
                }`}
              >
                {(size === '3x3' ? m3 : m2).map((row, r) =>
                  row.map((val, c) => (
                    <input
                      key={`${r}-${c}`}
                      type="number"
                      step="any"
                      value={val}
                      onChange={(e) => handleCellChange(r, c, e.target.value)}
                      className="w-16 sm:w-20 h-12 bg-[#121214] border border-[#27272A] focus:border-[#3B82F6] rounded-xl text-center font-mono font-bold text-white text-base focus:outline-none focus:ring-1 focus:ring-[#3B82F6] transition-all"
                    />
                  ))
                )}
              </div>
              <span className="text-4xl sm:text-5xl font-light text-[#71717A]">]</span>
            </div>

            {/* Unknown Variable Vector x */}
            <div className="flex items-center">
              <span className="text-4xl sm:text-5xl font-light text-[#71717A]">[</span>
              <div className="grid grid-cols-1 gap-2 p-2 text-center font-mono font-bold text-emerald-400">
                <div className="w-8 h-12 flex items-center justify-center">x</div>
                <div className="w-8 h-12 flex items-center justify-center">y</div>
                {size === '3x3' && <div className="w-8 h-12 flex items-center justify-center">z</div>}
              </div>
              <span className="text-4xl sm:text-5xl font-light text-[#71717A]">]</span>
            </div>

            <span className="text-2xl font-bold text-[#A1A1AA]">=</span>

            {/* Constants Vector B */}
            <div className="flex items-center">
              <span className="text-4xl sm:text-5xl font-light text-[#71717A]">[</span>
              <div className="grid grid-cols-1 gap-2 p-2">
                {(size === '3x3' ? b3 : b2).map((val, i) => (
                  <input
                    key={i}
                    type="number"
                    step="any"
                    value={val}
                    onChange={(e) => handleBChange(i, e.target.value)}
                    className="w-14 sm:w-16 h-12 bg-[#18181B] border border-[#3B82F6]/50 focus:border-[#3B82F6] rounded-xl text-center font-mono font-bold text-amber-400 text-base focus:outline-none"
                  />
                ))}
              </div>
              <span className="text-4xl sm:text-5xl font-light text-[#71717A]">]</span>
            </div>
          </div>

          {/* Step-by-Step Determinant Expansion Breakdown */}
          <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-[#27272A] space-y-2 text-xs">
            <span className="font-bold text-white uppercase text-[11px] block">
              Determinant Expansion along Row 1:
            </span>
            <pre className="p-3 rounded-xl bg-[#121214] font-mono text-[#E4E4E7] overflow-x-auto whitespace-pre-wrap leading-relaxed border border-[#27272A]/60">
              {results.detSteps}
            </pre>
          </div>

          {/* Inverse Matrix Display A^-1 */}
          <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-[#27272A] space-y-2 text-xs">
            <span className="font-bold text-white uppercase text-[11px] block">
              Inverse Matrix A⁻¹ = (1 / det(A)) · adj(A):
            </span>
            {results.isSingular ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold">
                ⚠️ Matrix is Singular (det(A) = 0). The inverse does not exist!
              </div>
            ) : (
              <div className="flex items-center justify-center p-3 rounded-xl bg-[#121214] border border-[#27272A] overflow-x-auto">
                <span className="text-3xl font-light text-[#71717A]">[</span>
                <div
                  className={`grid gap-3 p-1.5 ${
                    size === '3x3' ? 'grid-cols-3' : 'grid-cols-2'
                  }`}
                >
                  {results.inv?.map((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`${r}-${c}`}
                        className="px-2.5 py-1.5 bg-[#18181B] rounded-lg text-center font-mono text-white text-xs border border-[#27272A]"
                      >
                        {Number.isInteger(val) ? val : val.toFixed(3)}
                      </div>
                    ))
                  )}
                </div>
                <span className="text-3xl font-light text-[#71717A]">]</span>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry and System Solution */}
        <div className="space-y-5">
          {/* Linear System Exact Solution */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#3B82F6]" />
              <span>System Solution (Cramer & Gauss)</span>
            </h3>

            {results.isSingular ? (
              <div className="p-4 rounded-2xl bg-[#121214] border border-rose-500/30 text-xs text-rose-400 space-y-1">
                <span className="font-bold block">No Unique Solution</span>
                <span>The matrix determinant is zero. The system is either inconsistent (no solution) or dependent (infinitely many solutions).</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] flex items-center justify-between">
                  <span className="font-mono text-sm text-[#A1A1AA]">x =</span>
                  <span className="font-mono text-xl font-bold text-emerald-400">
                    {Number.isInteger(results.solution?.x)
                      ? results.solution?.x
                      : results.solution?.x.toFixed(3)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] flex items-center justify-between">
                  <span className="font-mono text-sm text-[#A1A1AA]">y =</span>
                  <span className="font-mono text-xl font-bold text-emerald-400">
                    {Number.isInteger(results.solution?.y)
                      ? results.solution?.y
                      : results.solution?.y.toFixed(3)}
                  </span>
                </div>
                {size === '3x3' && (
                  <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] flex items-center justify-between">
                    <span className="font-mono text-sm text-[#A1A1AA]">z =</span>
                    <span className="font-mono text-xl font-bold text-emerald-400">
                      {Number.isInteger((results.solution as any)?.z)
                        ? (results.solution as any)?.z
                        : (results.solution as any)?.z.toFixed(3)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Invariants: Det, Trace, Rank */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#3B82F6]" />
              <span>Matrix Properties & Invariants</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A]">
                <span className="text-[10px] text-[#A1A1AA] block">Determinant |A|</span>
                <span className="text-xl font-mono font-bold text-white">{results.det.toFixed(1)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A]">
                <span className="text-[10px] text-[#A1A1AA] block">Trace Tr(A)</span>
                <span className="text-xl font-mono font-bold text-sky-400">{results.trace}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] text-xs space-y-1 text-[#A1A1AA]">
              <span className="font-bold text-white block">Matrix Classification:</span>
              <div>• {results.isSingular ? 'Singular Matrix (det = 0)' : 'Non-Singular (Invertible)'}</div>
              <div>• Dimension: {size} square matrix</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
