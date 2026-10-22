import React, { useState } from 'react';
import {
  calculateFractions,
  calculatePercentage,
  calculateRatioSharing,
  solveQuadratic,
  solveSimultaneous,
  solveLinear,
  calculateAP,
  calculateGP,
  calculateCoordinateGeometry,
  calculateStatistics,
  calculateCombinatorics,
  calculateDifferentiation,
  calculateIntegration,
  calculateMatrix2x2,
  calculateVectors3D,
  calculatePythagoras,
  calculateMensuration,
  parsePolynomial,
  calculateFinancialInterest,
  calculateLogarithms,
  calculateCircleGeometry,
  calculateBinomialExpansion,
} from '../services/mathEngine';
import { StepSolutionCard } from './StepSolutionCard';
import { StepSolution } from '../types';
import { saveToHistory } from '../services/historyStorage';
import {
  Sigma,
  FunctionSquare,
  Divide,
  Percent,
  GitCommit,
  TrendingUp,
  Compass,
  BarChart2,
  Boxes,
  Activity,
  Grid3X3,
  Sparkles,
  Triangle,
  Shapes,
} from 'lucide-react';

export const MathHub: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>('quadratic');
  const [solution, setSolution] = useState<StepSolution | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Quadratic
  const [quadA, setQuadA] = useState<number>(1);
  const [quadB, setQuadB] = useState<number>(5);
  const [quadC, setQuadC] = useState<number>(6);
  const [quadMethod, setQuadMethod] = useState<'formula' | 'factor' | 'square'>('formula');

  // 2. Linear
  const [linA, setLinA] = useState<number>(2);
  const [linB, setLinB] = useState<number>(5);
  const [linC, setLinC] = useState<number>(0);
  const [linD, setLinD] = useState<number>(15);

  // 3. Simultaneous
  const [simA1, setSimA1] = useState<number>(2);
  const [simB1, setSimB1] = useState<number>(3);
  const [simC1, setSimC1] = useState<number>(13);
  const [simA2, setSimA2] = useState<number>(1);
  const [simB2, setSimB2] = useState<number>(-1);
  const [simC2, setSimC2] = useState<number>(4);

  // 4. Fractions
  const [fNum1, setFNum1] = useState<number>(3);
  const [fDen1, setFDen1] = useState<number>(4);
  const [fOp, setFOp] = useState<'+' | '-' | '*' | '/'>('+');
  const [fNum2, setFNum2] = useState<number>(2);
  const [fDen2, setFDen2] = useState<number>(5);

  // 5. Percentages & Ratios
  const [pctType, setPctType] = useState<'of' | 'increase' | 'decrease' | 'is_what_percent'>('of');
  const [pctA, setPctA] = useState<number>(15);
  const [pctB, setPctB] = useState<number>(200);
  const [ratioAmount, setRatioAmount] = useState<number>(60000);
  const [ratioParts, setRatioParts] = useState<string>('2:3:5');

  // 6. AP & GP
  const [apA, setApA] = useState<number>(4);
  const [apD, setApD] = useState<number>(3);
  const [apN, setApN] = useState<number>(10);
  const [gpA, setGpA] = useState<number>(2);
  const [gpR, setGpR] = useState<number>(3);
  const [gpN, setGpN] = useState<number>(5);

  // 7. Coordinate Geometry
  const [coordX1, setCoordX1] = useState<number>(1);
  const [coordY1, setCoordY1] = useState<number>(2);
  const [coordX2, setCoordX2] = useState<number>(4);
  const [coordY2, setCoordY2] = useState<number>(6);

  // 8. Statistics
  const [statData, setStatData] = useState<string>('12, 15, 20, 25, 28, 30, 25, 18');

  // 9. Combinatorics & Permutations
  const [combN, setCombN] = useState<number>(7);
  const [combR, setCombR] = useState<number>(3);
  const [combType, setCombType] = useState<'perm' | 'comb'>('comb');

  // 10. Calculus (Differentiation & Integration)
  const [calcTerms, setCalcTerms] = useState<string>('3x^2 - 5x + 4');
  const [calcEvalAt, setCalcEvalAt] = useState<number>(2);
  const [intLower, setIntLower] = useState<number>(0);
  const [intUpper, setIntUpper] = useState<number>(3);

  // 11. Trigonometry & Pythagoras
  const [pythFind, setPythFind] = useState<'hypotenuse' | 'leg'>('hypotenuse');
  const [pythA, setPythA] = useState<number>(3);
  const [pythB, setPythB] = useState<number>(4);

  // 12. Mensuration
  const [mensShape, setMensShape] = useState<'circle' | 'cylinder' | 'sphere' | 'cone'>('cylinder');
  const [mensR, setMensR] = useState<number>(7);
  const [mensH, setMensH] = useState<number>(10);

  // 13. Matrices & Vectors
  const [matA, setMatA] = useState<number>(3);
  const [matB, setMatB] = useState<number>(1);
  const [matC, setMatC] = useState<number>(2);
  const [matD, setMatD] = useState<number>(4);
  const [v1, setV1] = useState<string>('1, 2, 3');
  const [v2, setV2] = useState<string>('4, 5, 6');

  // 14. Financial Interest
  const [interestPrincipal, setInterestPrincipal] = useState<number>(50000);
  const [interestRate, setInterestRate] = useState<number>(12);
  const [interestTime, setInterestTime] = useState<number>(3);
  const [interestType, setInterestType] = useState<'simple' | 'compound'>('compound');
  const [interestCompounds, setInterestCompounds] = useState<number>(1);

  // 15. Logarithms
  const [logBase, setLogBase] = useState<number>(2);
  const [logValue, setLogValue] = useState<number>(64);
  const [logTargetBase, setLogTargetBase] = useState<number>(10);

  // 16. Circle Geometry
  const [circleH, setCircleH] = useState<number>(0);
  const [circleK, setCircleK] = useState<number>(0);
  const [circleR, setCircleR] = useState<number>(5);
  const [circleAngle, setCircleAngle] = useState<number>(60);

  // 17. Binomial Theorem
  const [binA, setBinA] = useState<number>(2);
  const [binB, setBinB] = useState<number>(3);
  const [binN, setBinN] = useState<number>(4);

  const executeSolve = (fn: () => StepSolution) => {
    setError(null);
    try {
      const res = fn();
      setSolution(res);
      saveToHistory(res);
    } catch (err: any) {
      setError(err.message || 'An error occurred during calculation.');
    }
  };

  const topicsList = [
    { id: 'quadratic', name: 'Quadratic Equations', icon: FunctionSquare },
    { id: 'linear', name: 'Linear Equations', icon: GitCommit },
    { id: 'simultaneous', name: 'Simultaneous Equations', icon: Boxes },
    { id: 'calculus', name: 'Calculus (Diff & Int)', icon: Activity },
    { id: 'trig', name: 'Trig & Pythagoras', icon: Triangle },
    { id: 'mensuration', name: 'Mensuration (2D & 3D)', icon: Shapes },
    { id: 'ap_gp', name: 'AP & GP Sequences', icon: TrendingUp },
    { id: 'fractions', name: 'Fractions', icon: Divide },
    { id: 'percentages', name: 'Percentages & Ratios', icon: Percent },
    { id: 'coordinate', name: 'Coordinate Geometry', icon: Compass },
    { id: 'statistics', name: 'Statistics', icon: BarChart2 },
    { id: 'combinatorics', name: 'Permutations & Comb.', icon: Sigma },
    { id: 'matrices', name: 'Matrices & Vectors', icon: Grid3X3 },
    { id: 'interest', name: 'Interest (Simple & Compound)', icon: TrendingUp },
    { id: 'logarithms', name: 'Logarithms & Powers', icon: FunctionSquare },
    { id: 'circles', name: 'Circle Geometry & Equation', icon: Compass },
    { id: 'binomial', name: 'Binomial Theorem Expansion', icon: Boxes },
  ];

  return (
    <div className="space-y-6">
      {/* Topic Switcher Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {topicsList.map((t) => {
          const Icon = t.icon;
          const isActive = activeTopic === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTopic(t.id);
                setError(null);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#3B82F6] text-[#FFFFFF] font-bold shadow-md shadow-blue-500/25'
                  : 'bg-[#181B22] border border-[#252A34] text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-[#252A34]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Solver Card */}
      <div className="bg-[#181B22] border border-[#252A34] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs font-bold underline ml-3">
              Dismiss
            </button>
          </div>
        )}

        {/* 1. QUADRATIC EQUATIONS */}
        {activeTopic === 'quadratic' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF] flex items-center space-x-2">
                <span>Quadratic Equation Solver (ax² + bx + c = 0)</span>
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Solves with complete steps using Formula, Factorization, or Completing the Square.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Coefficient a (x²)
                </label>
                <input
                  type="number"
                  value={quadA}
                  onChange={(e) => setQuadA(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Coefficient b (x)
                </label>
                <input
                  type="number"
                  value={quadB}
                  onChange={(e) => setQuadB(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Constant c
                </label>
                <input
                  type="number"
                  value={quadC}
                  onChange={(e) => setQuadC(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#A1A1AA] mr-1">Method:</span>
              {(['formula', 'factor', 'square'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setQuadMethod(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    quadMethod === m
                      ? 'bg-[#3B82F6] text-[#FFFFFF] font-bold'
                      : 'bg-slate-100 dark:bg-zinc-900 text-[#A1A1AA]'
                  }`}
                >
                  {m === 'formula' ? 'Quadratic Formula' : m === 'factor' ? 'Factorization' : 'Completing Square'}
                </button>
              ))}
            </div>

            <button
              onClick={() => executeSolve(() => solveQuadratic(quadA, quadB, quadC, quadMethod))}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.99] text-[#FFFFFF] font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Solve Quadratic Step-by-Step</span>
            </button>
          </div>
        )}

        {/* 2. LINEAR EQUATIONS */}
        {activeTopic === 'linear' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">
                Linear Equation Solver (ax + b = cx + d)
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Isolates x and balances constants with step-by-step arithmetic.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">a (LHS x)</label>
                <input
                  type="number"
                  value={linA}
                  onChange={(e) => setLinA(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-slate-50 dark:bg-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">b (LHS const)</label>
                <input
                  type="number"
                  value={linB}
                  onChange={(e) => setLinB(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-slate-50 dark:bg-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">c (RHS x)</label>
                <input
                  type="number"
                  value={linC}
                  onChange={(e) => setLinC(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-slate-50 dark:bg-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">d (RHS const)</label>
                <input
                  type="number"
                  value={linD}
                  onChange={(e) => setLinD(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-slate-50 dark:bg-zinc-900 font-mono"
                />
              </div>
            </div>

            <button
              onClick={() => executeSolve(() => solveLinear(linA, linB, linC, linD))}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.99] text-[#FFFFFF] font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Solve Linear Equation</span>
            </button>
          </div>
        )}

        {/* 3. SIMULTANEOUS EQUATIONS */}
        {activeTopic === 'simultaneous' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">
                Simultaneous Equations (2 Variables)
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Solves Eq 1 (a₁x + b₁y = c₁) and Eq 2 (a₂x + b₂y = c₂) using elimination.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl space-y-2 border border-[#252A34]">
                <span className="text-xs font-bold text-emerald-500 uppercase">Equation 1</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={simA1}
                    onChange={(e) => setSimA1(parseFloat(e.target.value) || 0)}
                    placeholder="a1"
                    className="px-2.5 py-2 rounded-lg border border-[#252A34] bg-white dark:bg-zinc-900 text-center font-mono"
                  />
                  <input
                    type="number"
                    value={simB1}
                    onChange={(e) => setSimB1(parseFloat(e.target.value) || 0)}
                    placeholder="b1"
                    className="px-2.5 py-2 rounded-lg border border-[#252A34] bg-white dark:bg-zinc-900 text-center font-mono"
                  />
                  <input
                    type="number"
                    value={simC1}
                    onChange={(e) => setSimC1(parseFloat(e.target.value) || 0)}
                    placeholder="c1"
                    className="px-2.5 py-2 rounded-lg border border-[#252A34] bg-white dark:bg-zinc-900 text-center font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl space-y-2 border border-[#252A34]">
                <span className="text-xs font-bold text-indigo-600 uppercase">Equation 2</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={simA2}
                    onChange={(e) => setSimA2(parseFloat(e.target.value) || 0)}
                    placeholder="a2"
                    className="px-2.5 py-2 rounded-lg border border-[#252A34] bg-white dark:bg-zinc-900 text-center font-mono"
                  />
                  <input
                    type="number"
                    value={simB2}
                    onChange={(e) => setSimB2(parseFloat(e.target.value) || 0)}
                    placeholder="b2"
                    className="px-2.5 py-2 rounded-lg border border-[#252A34] bg-white dark:bg-zinc-900 text-center font-mono"
                  />
                  <input
                    type="number"
                    value={simC2}
                    onChange={(e) => setSimC2(parseFloat(e.target.value) || 0)}
                    placeholder="c2"
                    className="px-2.5 py-2 rounded-lg border border-[#252A34] bg-white dark:bg-zinc-900 text-center font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => executeSolve(() => solveSimultaneous(simA1, simB1, simC1, simA2, simB2, simC2))}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.99] text-[#FFFFFF] font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Solve Simultaneous Equations</span>
            </button>
          </div>
        )}

        {/* 4. CALCULUS WITH DYNAMIC POLYNOMIAL PARSER */}
        {activeTopic === 'calculus' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">Calculus: Differentiation & Integration</h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Enter any polynomial expression. The engine automatically parses terms, powers, and coefficients.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Polynomial Expression f(x)
                </label>
                <input
                  type="text"
                  value={calcTerms}
                  onChange={(e) => setCalcTerms(e.target.value)}
                  placeholder="e.g. 4x^3 - 2x^2 + 5x - 7"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono text-sm font-bold text-[#FFFFFF]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Evaluate Derivative at x =
                </label>
                <input
                  type="number"
                  value={calcEvalAt}
                  onChange={(e) => setCalcEvalAt(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono text-sm font-bold text-[#FFFFFF]"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500 block mb-2">Definite Integration Bounds:</span>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <div>
                  <label className="text-[11px] text-slate-500 block">Lower limit (a)</label>
                  <input
                    type="number"
                    value={intLower}
                    onChange={(e) => setIntLower(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#252A34] bg-white dark:bg-black font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block">Upper limit (b)</label>
                  <input
                    type="number"
                    value={intUpper}
                    onChange={(e) => setIntUpper(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#252A34] bg-white dark:bg-black font-mono text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() =>
                  executeSolve(() => {
                    const terms = parsePolynomial(calcTerms, 'x');
                    return calculateDifferentiation(terms, calcEvalAt);
                  })
                }
                className="py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Differentiate f'(x)</span>
              </button>
              <button
                onClick={() =>
                  executeSolve(() => {
                    const terms = parsePolynomial(calcTerms, 'x');
                    return calculateIntegration(terms, false);
                  })
                }
                className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Indefinite Integral (∫dx)</span>
              </button>
              <button
                onClick={() =>
                  executeSolve(() => {
                    const terms = parsePolynomial(calcTerms, 'x');
                    return calculateIntegration(terms, true, intLower, intUpper);
                  })
                }
                className="py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Definite Integral</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. TRIGONOMETRY & PYTHAGORAS */}
        {activeTopic === 'trig' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">Trigonometry & Pythagoras Theorem</h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Solve right-angled triangles, find missing sides (hypotenuse or legs), area, and acute angles.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPythFind('hypotenuse')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pythFind === 'hypotenuse'
                    ? 'bg-[#3B82F6] text-[#FFFFFF] font-bold shadow-sm'
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                Find Hypotenuse (c = √(a² + b²))
              </button>
              <button
                onClick={() => setPythFind('leg')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pythFind === 'leg'
                    ? 'bg-[#3B82F6] text-[#FFFFFF] font-bold shadow-sm'
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                Find Leg (a = √(c² - b²))
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  {pythFind === 'hypotenuse' ? 'Leg a' : 'Known Leg'}
                </label>
                <input
                  type="number"
                  value={pythA}
                  onChange={(e) => setPythA(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  {pythFind === 'hypotenuse' ? 'Leg b' : 'Hypotenuse (c)'}
                </label>
                <input
                  type="number"
                  value={pythB}
                  onChange={(e) => setPythB(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
              </div>
            </div>

            <button
              onClick={() => executeSolve(() => calculatePythagoras(pythFind, pythA, pythB))}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Calculate Triangle Geometry</span>
            </button>
          </div>
        )}

        {/* 6. MENSURATION (2D & 3D) */}
        {activeTopic === 'mensuration' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">Mensuration (2D & 3D Shapes)</h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Calculate Area, Volume, Total Surface Area (TSA), and Curved Surface Area (CSA).
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['circle', 'cylinder', 'sphere', 'cone'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setMensShape(s)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                    mensShape === s
                      ? 'bg-[#3B82F6] text-[#FFFFFF] font-bold shadow-sm'
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Radius (r)
                </label>
                <input
                  type="number"
                  value={mensR}
                  onChange={(e) => setMensR(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
              </div>
              {(mensShape === 'cylinder' || mensShape === 'cone') && (
                <div>
                  <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                    Height (h)
                  </label>
                  <input
                    type="number"
                    value={mensH}
                    onChange={(e) => setMensH(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => executeSolve(() => calculateMensuration(mensShape, mensR, mensH))}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Calculate Shape Properties</span>
            </button>
          </div>
        )}

        {/* 7. AP & GP */}
        {activeTopic === 'ap_gp' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">
                Sequences & Series (AP & GP)
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Arithmetic and Geometric Progression terms (Tn), sums (Sn), and sum to infinity (S∞).
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900/40 rounded-xl space-y-3">
              <span className="text-xs font-bold text-emerald-500 uppercase">Arithmetic Progression (AP)</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">First term (a)</label>
                  <input
                    type="number"
                    value={apA}
                    onChange={(e) => setApA(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Common diff (d)</label>
                  <input
                    type="number"
                    value={apD}
                    onChange={(e) => setApD(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Term number (n)</label>
                  <input
                    type="number"
                    value={apN}
                    onChange={(e) => setApN(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
              </div>
              <button
                onClick={() => executeSolve(() => calculateAP(apA, apD, apN))}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-lg text-xs transition-all shadow-sm"
              >
                Calculate AP (Tn & Sn)
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900/40 rounded-xl space-y-3">
              <span className="text-xs font-bold text-indigo-600 uppercase">Geometric Progression (GP)</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">First term (a)</label>
                  <input
                    type="number"
                    value={gpA}
                    onChange={(e) => setGpA(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Common ratio (r)</label>
                  <input
                    type="number"
                    value={gpR}
                    onChange={(e) => setGpR(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Term number (n)</label>
                  <input
                    type="number"
                    value={gpN}
                    onChange={(e) => setGpN(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                  />
                </div>
              </div>
              <button
                onClick={() => executeSolve(() => calculateGP(gpA, gpR, gpN))}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Calculate GP (Tn, Sn & S∞)
              </button>
            </div>
          </div>
        )}

        {/* 8. FRACTIONS */}
        {activeTopic === 'fractions' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">
                Fractions Arithmetic & Simplification
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Addition, subtraction, multiplication, and division with LCM, GCD & mixed form.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
              <div className="flex flex-col items-center w-28">
                <input
                  type="number"
                  value={fNum1}
                  onChange={(e) => setFNum1(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#252A34] text-center font-mono font-bold"
                />
                <div className="w-full h-0.5 bg-slate-400 my-1.5" />
                <input
                  type="number"
                  value={fDen1}
                  onChange={(e) => setFDen1(parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#252A34] text-center font-mono font-bold"
                />
              </div>

              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl">
                {(['+', '-', '*', '/'] as const).map((op) => (
                  <button
                    key={op}
                    onClick={() => setFOp(op)}
                    className={`w-9 h-9 rounded-lg font-bold text-base transition-colors ${
                      fOp === op ? 'bg-[#3B82F6] text-[#FFFFFF] font-bold shadow' : 'text-[#A1A1AA]'
                    }`}
                  >
                    {op === '*' ? '×' : op === '/' ? '÷' : op}
                  </button>
                ))}
              </div>

              <div className="flex flex-col items-center w-28">
                <input
                  type="number"
                  value={fNum2}
                  onChange={(e) => setFNum2(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#252A34] text-center font-mono font-bold"
                />
                <div className="w-full h-0.5 bg-slate-400 my-1.5" />
                <input
                  type="number"
                  value={fDen2}
                  onChange={(e) => setFDen2(parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#252A34] text-center font-mono font-bold"
                />
              </div>
            </div>

            <button
              onClick={() => executeSolve(() => calculateFractions(fNum1, fDen1, fOp, fNum2, fDen2))}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.99] text-[#FFFFFF] font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Compute Fractions Step-by-Step</span>
            </button>
          </div>
        )}

        {/* 9. PERCENTAGES & RATIOS */}
        {activeTopic === 'percentages' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">Percentages & Ratio Sharing</h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Percentage increase/decrease, ratios and proportional division.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900/40 rounded-xl space-y-3">
              <span className="text-xs font-bold text-emerald-500 uppercase">Percentage Calculator</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={pctType}
                  onChange={(e: any) => setPctType(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 text-sm font-semibold"
                >
                  <option value="of">P% of Value</option>
                  <option value="increase">Increase Value by P%</option>
                  <option value="decrease">Decrease Value by P%</option>
                  <option value="is_what_percent">A is what % of B?</option>
                </select>
                <input
                  type="number"
                  value={pctA}
                  onChange={(e) => setPctA(parseFloat(e.target.value) || 0)}
                  placeholder="Percentage (P)"
                  className="px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
                <input
                  type="number"
                  value={pctB}
                  onChange={(e) => setPctB(parseFloat(e.target.value) || 0)}
                  placeholder="Total / Base"
                  className="px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
              </div>
              <button
                onClick={() => executeSolve(() => calculatePercentage(pctType, pctA, pctB))}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-lg text-xs transition-all shadow-sm"
              >
                Calculate Percentage
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900/40 rounded-xl space-y-3">
              <span className="text-xs font-bold text-indigo-600 uppercase">Ratio Sharing</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="number"
                  value={ratioAmount}
                  onChange={(e) => setRatioAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Total Amount to Share"
                  className="px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
                <input
                  type="text"
                  value={ratioParts}
                  onChange={(e) => setRatioParts(e.target.value)}
                  placeholder="Ratio e.g. 2:3:5"
                  className="px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
              </div>
              <button
                onClick={() => executeSolve(() => calculateRatioSharing(ratioAmount, ratioParts))}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Share Ratio
              </button>
            </div>
          </div>
        )}

        {/* 10. COORDINATE GEOMETRY */}
        {activeTopic === 'coordinate' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">Coordinate Geometry</h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Distance between points, midpoint, gradient, and straight line equation.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">x₁</label>
                <input
                  type="number"
                  value={coordX1}
                  onChange={(e) => setCoordX1(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">y₁</label>
                <input
                  type="number"
                  value={coordY1}
                  onChange={(e) => setCoordY1(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">x₂</label>
                <input
                  type="number"
                  value={coordX2}
                  onChange={(e) => setCoordX2(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">y₂</label>
                <input
                  type="number"
                  value={coordY2}
                  onChange={(e) => setCoordY2(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
              </div>
            </div>

            <button
              onClick={() => executeSolve(() => calculateCoordinateGeometry(coordX1, coordY1, coordX2, coordY2))}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.99] text-[#FFFFFF] font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Compute Distance, Midpoint & Gradient</span>
            </button>
          </div>
        )}

        {/* 11. STATISTICS */}
        {activeTopic === 'statistics' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">Descriptive Statistics</h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Computes Mean, Median, Mode, Range, Variance, and Standard Deviation.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                Enter numbers (separated by commas or spaces)
              </label>
              <input
                type="text"
                value={statData}
                onChange={(e) => setStatData(e.target.value)}
                placeholder="e.g. 12, 15, 20, 25, 28"
                className="w-full px-3.5 py-3 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono text-sm"
              />
            </div>

            <button
              onClick={() => executeSolve(() => calculateStatistics(statData))}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.99] text-[#FFFFFF] font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Calculate Statistics</span>
            </button>
          </div>
        )}

        {/* 12. COMBINATORICS */}
        {activeTopic === 'combinatorics' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">
                Permutations & Combinations (ⁿPᵣ & ⁿCᵣ)
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Factorials, permutations (arrangements), and combinations (selections).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Total items (n)</label>
                <input
                  type="number"
                  value={combN}
                  onChange={(e) => setCombN(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Items chosen (r)</label>
                <input
                  type="number"
                  value={combR}
                  onChange={(e) => setCombR(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Type</label>
                <select
                  value={combType}
                  onChange={(e: any) => setCombType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 text-sm font-semibold"
                >
                  <option value="comb">Combinations (ⁿCᵣ)</option>
                  <option value="perm">Permutations (ⁿPᵣ)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => executeSolve(() => calculateCombinatorics(combN, combR, combType))}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.99] text-[#FFFFFF] font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Compute {combType === 'comb' ? 'Combinations' : 'Permutations'}</span>
            </button>
          </div>
        )}

        {/* 13. MATRICES & VECTORS */}
        {activeTopic === 'matrices' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">Matrices & Vectors</h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                2x2 Matrix Determinant, Trace, Inverse & 3D Vectors dot/cross product.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900/40 rounded-xl space-y-3">
              <span className="text-xs font-bold text-emerald-500 uppercase">2x2 Matrix [[a, b], [c, d]]</span>
              <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                <input
                  type="number"
                  value={matA}
                  onChange={(e) => setMatA(parseFloat(e.target.value) || 0)}
                  placeholder="a"
                  className="px-3 py-2 rounded-lg border border-[#252A34] text-center font-mono"
                />
                <input
                  type="number"
                  value={matB}
                  onChange={(e) => setMatB(parseFloat(e.target.value) || 0)}
                  placeholder="b"
                  className="px-3 py-2 rounded-lg border border-[#252A34] text-center font-mono"
                />
                <input
                  type="number"
                  value={matC}
                  onChange={(e) => setMatC(parseFloat(e.target.value) || 0)}
                  placeholder="c"
                  className="px-3 py-2 rounded-lg border border-[#252A34] text-center font-mono"
                />
                <input
                  type="number"
                  value={matD}
                  onChange={(e) => setMatD(parseFloat(e.target.value) || 0)}
                  placeholder="d"
                  className="px-3 py-2 rounded-lg border border-[#252A34] text-center font-mono"
                />
              </div>
              <button
                onClick={() => executeSolve(() => calculateMatrix2x2(matA, matB, matC, matD))}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-lg text-xs transition-all shadow-sm"
              >
                Analyze Matrix (Det, Trace & Inverse)
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-900/40 rounded-xl space-y-3">
              <span className="text-xs font-bold text-indigo-600 uppercase">3D Vectors (Dot & Cross Product)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={v1}
                  onChange={(e) => setV1(e.target.value)}
                  placeholder="Vector A (x, y, z)"
                  className="px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono text-sm"
                />
                <input
                  type="text"
                  value={v2}
                  onChange={(e) => setV2(e.target.value)}
                  placeholder="Vector B (x, y, z)"
                  className="px-3 py-2 rounded-xl border border-[#252A34] bg-white dark:bg-zinc-900 font-mono text-sm"
                />
              </div>
              <button
                onClick={() =>
                  executeSolve(() => {
                    const a = v1.split(',').map((s) => parseFloat(s.trim()) || 0);
                    const b = v2.split(',').map((s) => parseFloat(s.trim()) || 0);
                    return calculateVectors3D([a[0] || 0, a[1] || 0, a[2] || 0], [b[0] || 0, b[1] || 0, b[2] || 0]);
                  })
                }
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Compute Vector Dot & Cross Products
              </button>
            </div>
          </div>
        )}

        {/* 14. SIMPLE & COMPOUND INTEREST */}
        {activeTopic === 'interest' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">
                Financial Interest Calculator (Simple & Compound)
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Calculates accrued amount, simple interest, and compound growth with customizable compounding intervals.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#A1A1AA]">Type:</span>
              <button
                onClick={() => setInterestType('compound')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  interestType === 'compound'
                    ? 'bg-[#3B82F6] text-[#FFFFFF]'
                    : 'bg-[#0F1115] text-[#A1A1AA] border border-[#252A34]'
                }`}
              >
                Compound Interest (A = P(1 + r/n)^nt)
              </button>
              <button
                onClick={() => setInterestType('simple')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  interestType === 'simple'
                    ? 'bg-[#3B82F6] text-[#FFFFFF]'
                    : 'bg-[#0F1115] text-[#A1A1AA] border border-[#252A34]'
                }`}
              >
                Simple Interest (I = PRT/100)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Principal Amount (P)
                </label>
                <input
                  type="number"
                  value={interestPrincipal}
                  onChange={(e) => setInterestPrincipal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Annual Interest Rate (% R)
                </label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Time Period (Years T)
                </label>
                <input
                  type="number"
                  value={interestTime}
                  onChange={(e) => setInterestTime(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
            </div>

            {interestType === 'compound' && (
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Compounding Frequency (Times per year n)
                </label>
                <select
                  value={interestCompounds}
                  onChange={(e) => setInterestCompounds(parseInt(e.target.value) || 1)}
                  className="w-full sm:w-64 px-3 py-2 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] text-xs font-semibold"
                >
                  <option value={1}>Annually (n = 1)</option>
                  <option value={2}>Semi-annually (n = 2)</option>
                  <option value={4}>Quarterly (n = 4)</option>
                  <option value={12}>Monthly (n = 12)</option>
                  <option value={365}>Daily (n = 365)</option>
                </select>
              </div>
            )}

            <button
              onClick={() =>
                executeSolve(() =>
                  calculateFinancialInterest(
                    interestPrincipal,
                    interestRate,
                    interestTime,
                    interestType,
                    interestCompounds
                  )
                )
              }
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Calculate Interest & Show Steps</span>
            </button>
          </div>
        )}

        {/* 15. LOGARITHMS & POWERS */}
        {activeTopic === 'logarithms' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">
                Logarithms & Change of Base Calculator
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Evaluates log_b(x) with change of base theorem, verifying exponential form b^y = x.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Logarithm Base (b)
                </label>
                <input
                  type="number"
                  value={logBase}
                  onChange={(e) => setLogBase(parseFloat(e.target.value) || 2)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Argument Value (x)
                </label>
                <input
                  type="number"
                  value={logValue}
                  onChange={(e) => setLogValue(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Change to Base (Optional)
                </label>
                <input
                  type="number"
                  value={logTargetBase}
                  onChange={(e) => setLogTargetBase(parseFloat(e.target.value) || 10)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
            </div>

            <button
              onClick={() => executeSolve(() => calculateLogarithms(logBase, logValue, logTargetBase))}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Evaluate Logarithm Step-by-Step</span>
            </button>
          </div>
        )}

        {/* 16. CIRCLE GEOMETRY */}
        {activeTopic === 'circles' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">
                Circle Geometry, Equation & Theorems
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Derives standard equation (x - h)² + (y - k)² = r², circumference, area, sector area, and arc length.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Center X (h)
                </label>
                <input
                  type="number"
                  value={circleH}
                  onChange={(e) => setCircleH(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Center Y (k)
                </label>
                <input
                  type="number"
                  value={circleK}
                  onChange={(e) => setCircleK(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Radius (r)
                </label>
                <input
                  type="number"
                  value={circleR}
                  onChange={(e) => setCircleR(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Sector Angle (θ°)
                </label>
                <input
                  type="number"
                  value={circleAngle}
                  onChange={(e) => setCircleAngle(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
            </div>

            <button
              onClick={() => executeSolve(() => calculateCircleGeometry(circleH, circleK, circleR, circleAngle))}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Compute Circle Equation & Geometry</span>
            </button>
          </div>
        )}

        {/* 17. BINOMIAL THEOREM EXPANSION */}
        {activeTopic === 'binomial' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-[#FFFFFF]">
                Binomial Theorem Expansion (ax + b)ⁿ
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-1">
                Expands any binomial polynomial using Pascal's coefficients and combinatorial formula ⁿCᵣ.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Coefficient a (for x)
                </label>
                <input
                  type="number"
                  value={binA}
                  onChange={(e) => setBinA(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Constant b
                </label>
                <input
                  type="number"
                  value={binB}
                  onChange={(e) => setBinB(parseFloat(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#A1A1AA] block mb-1">
                  Power Exponent n (0 to 12)
                </label>
                <input
                  type="number"
                  min={0}
                  max={12}
                  value={binN}
                  onChange={(e) => setBinN(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#252A34] bg-[#0F1115] text-[#FFFFFF] font-mono font-bold"
                />
              </div>
            </div>

            <button
              onClick={() => executeSolve(() => calculateBinomialExpansion(binA, binB, binN))}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Expand Binomial with Full Terms</span>
            </button>
          </div>
        )}
      </div>

      {/* Solution Presentation */}
      {solution && (
        <div className="pt-2">
          <StepSolutionCard solution={solution} />
        </div>
      )}
    </div>
  );
};
