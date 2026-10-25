import React, { useState, useEffect, useRef } from 'react';
import { evaluateExpression, formatNum } from '../services/mathEngine';
import { StepSolutionCard } from './StepSolutionCard';
import { StepSolution } from '../types';
import { saveToHistory } from '../services/historyStorage';
import { Delete, Equal } from 'lucide-react';

export const ScientificCalculator: React.FC = () => {
  const [expression, setExpression] = useState<string>('');
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [isShift, setIsShift] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<string>('');
  const [lastSolution, setLastSolution] = useState<StepSolution | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [calcMode, setCalcMode] = useState<'standard' | 'scientific'>('standard');
  const displayEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll display to the end as user types
  useEffect(() => {
    if (displayEndRef.current) {
      displayEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
    }
  }, [expression]);

  // Live preview evaluation
  useEffect(() => {
    if (!expression.trim()) {
      setPreviewResult('');
      setErrorMsg(null);
      return;
    }

    try {
      const res = evaluateExpression(expression, angleMode);
      setPreviewResult(formatNum(res.result, 6));
      setErrorMsg(null);
    } catch {
      setPreviewResult('');
    }
  }, [expression, angleMode]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        handleInput(e.key);
      } else if (e.key === '.') {
        handleInput('.');
      } else if (e.key === '+') {
        handleInput(' + ');
      } else if (e.key === '-') {
        handleInput(' - ');
      } else if (e.key === '*' || e.key === 'x') {
        handleInput(' * ');
      } else if (e.key === '/') {
        e.preventDefault();
        handleInput(' / ');
      } else if (e.key === '%') {
        handleInput('%');
      } else if (e.key === '(' || e.key === ')') {
        handleInput(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, angleMode]);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        // ignore
      }
    }
  };

  const handleInput = (char: string) => {
    triggerHaptic();
    setErrorMsg(null);
    setExpression((prev) => prev + char);
  };

  const handleClear = () => {
    triggerHaptic();
    setExpression('');
    setPreviewResult('');
    setErrorMsg(null);
  };

  const handleBackspace = () => {
    triggerHaptic();
    setErrorMsg(null);
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    triggerHaptic();
    if (!expression.trim()) return;

    try {
      const res = evaluateExpression(expression, angleMode);
      const finalStr = formatNum(res.result, 6);

      const solution: StepSolution = {
        title: 'Scientific Calculation',
        category: 'Scientific',
        problemStatement: expression,
        formula: 'BODMAS / Standard Scientific Evaluation',
        substitution: expression,
        steps: [
          `Original input: ${expression}`,
          `Angle mode: ${angleMode.toUpperCase()}`,
          ...res.steps.filter((s) => !s.startsWith('Original') && !s.startsWith('Angle')),
        ],
        finalAnswer: finalStr,
      };

      setLastSolution(solution);
      saveToHistory(solution);
      setExpression(finalStr);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Syntax error in calculation.');
    }
  };

  return (
    <div className="max-w-md sm:max-w-lg lg:max-w-xl mx-auto space-y-6">
      {/* Polished Modern Calculator Chassis (Pure Black & Emerald Green) */}
      <div className="bg-[#000000] border border-[#27272A] rounded-3xl p-4 sm:p-6 shadow-2xl shadow-black transition-all">
        {/* Top Control Bar: Mode Toggle & Angle Settings */}
        <div className="flex items-center justify-between gap-2 mb-3.5 pb-2 border-b border-[#27272A]">
          {/* Segmented Mode Switcher */}
          <div className="flex items-center p-1 bg-[#0A0A0A] border border-[#27272A] rounded-xl">
            <button
              onClick={() => {
                triggerHaptic();
                setCalcMode('standard');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                calcMode === 'standard'
                  ? 'bg-[#22C55E] text-[#FFFFFF] shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => {
                triggerHaptic();
                setCalcMode('scientific');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                calcMode === 'scientific'
                  ? 'bg-[#22C55E] text-[#FFFFFF] shadow-sm'
                  : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
              }`}
            >
              Scientific
            </button>
          </div>

          {/* Angle Mode & 2nd INV toggles */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                triggerHaptic();
                setAngleMode(angleMode === 'deg' ? 'rad' : 'deg');
              }}
              aria-label="Toggle degree or radian mode"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                angleMode === 'deg'
                  ? 'bg-[#18181B] text-[#FFFFFF] border-[#22C55E]/60 shadow-xs'
                  : 'bg-[#0A0A0A] text-[#A1A1AA] border-[#27272A] hover:text-[#FFFFFF]'
              }`}
            >
              {angleMode.toUpperCase()}
            </button>

            {calcMode === 'scientific' && (
              <button
                onClick={() => {
                  triggerHaptic();
                  setIsShift((prev) => !prev);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  isShift
                    ? 'bg-[#22C55E] text-[#FFFFFF] border-[#22C55E] shadow-sm'
                    : 'bg-[#0A0A0A] text-[#A1A1AA] border-[#27272A] hover:text-[#FFFFFF]'
                }`}
              >
                2nd
              </button>
            )}
          </div>
        </div>

        {/* Calculator Display (Deep Black #0A0A0A with Green Accents) */}
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-2xl p-4 sm:p-5 mb-4 shadow-inner">
          {/* Status line */}
          <div className="flex items-center justify-between text-xs text-[#A1A1AA] font-mono mb-1">
            <span className="text-[11px] font-semibold tracking-wider text-[#A1A1AA]">
              {calcMode.toUpperCase()} · {angleMode.toUpperCase()}
              {isShift ? ' · INV' : ''}
            </span>
            <span className="text-[11px] font-semibold text-[#A1A1AA]">SmartSolve FX</span>
          </div>

          {/* Main Input Text (#FFFFFF) */}
          <div className="min-h-12 flex items-center justify-end overflow-x-auto text-right math-display text-2xl sm:text-3xl text-[#FFFFFF] font-bold whitespace-nowrap tracking-wide scrollbar-none">
            {expression || <span className="text-[#A1A1AA]/50 font-normal">0</span>}
            <div ref={displayEndRef} />
          </div>

          {/* Live Preview / Error line */}
          <div className="min-h-6 flex items-center justify-end text-right font-mono text-sm sm:text-base mt-1">
            {errorMsg ? (
              <span className="text-[#EF4444] text-xs sm:text-sm font-sans font-medium">{errorMsg}</span>
            ) : previewResult ? (
              <span className="text-[#22C55E] flex items-center space-x-1 font-bold">
                <span className="text-xs text-[#A1A1AA] mr-1 font-normal">=</span> {previewResult}
              </span>
            ) : (
              <span className="text-xs text-[#A1A1AA]/40 select-none">Ready</span>
            )}
          </div>
        </div>

        {/* Keypad Section (White, Black, and Emerald Green) */}
        {calcMode === 'standard' ? (
          /* STANDARD 4-COLUMN PHONE LAYOUT */
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
            {/* Row 1 */}
            <button
              onClick={handleClear}
              className="h-14 sm:h-16 bg-[#EF4444] hover:bg-[#DC2626] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-base sm:text-lg shadow-sm shadow-red-500/20 flex items-center justify-center transition-all cursor-pointer"
            >
              AC
            </button>
            <button
              onClick={handleBackspace}
              aria-label="Backspace"
              className="h-14 sm:h-16 bg-[#EF4444] hover:bg-[#DC2626] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold shadow-sm shadow-red-500/20 flex items-center justify-center transition-all cursor-pointer"
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={() => handleInput('%')}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-lg sm:text-xl border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              %
            </button>
            <button
              onClick={() => handleInput(' / ')}
              className="h-14 sm:h-16 bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl shadow-md shadow-emerald-500/25 flex items-center justify-center transition-all cursor-pointer"
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              onClick={() => handleInput('7')}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              7
            </button>
            <button
              onClick={() => handleInput('8')}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              8
            </button>
            <button
              onClick={() => handleInput('9')}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              9
            </button>
            <button
              onClick={() => handleInput(' * ')}
              className="h-14 sm:h-16 bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl shadow-md shadow-emerald-500/25 flex items-center justify-center transition-all cursor-pointer"
            >
              ×
            </button>

            {/* Row 3 */}
            <button
              onClick={() => handleInput('4')}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              4
            </button>
            <button
              onClick={() => handleInput('5')}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              5
            </button>
            <button
              onClick={() => handleInput('6')}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              6
            </button>
            <button
              onClick={() => handleInput(' - ')}
              className="h-14 sm:h-16 bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl shadow-md shadow-emerald-500/25 flex items-center justify-center transition-all cursor-pointer"
            >
              −
            </button>

            {/* Row 4 */}
            <button
              onClick={() => handleInput('1')}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              1
            </button>
            <button
              onClick={() => handleInput('2')}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              2
            </button>
            <button
              onClick={() => handleInput('3')}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              3
            </button>
            <button
              onClick={() => handleInput(' + ')}
              className="h-14 sm:h-16 bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl shadow-md shadow-emerald-500/25 flex items-center justify-center transition-all cursor-pointer"
            >
              +
            </button>

            {/* Row 5 */}
            <button
              onClick={() => {
                if (expression.startsWith('-(') && expression.endsWith(')')) {
                  setExpression(expression.slice(2, -1));
                } else if (expression.startsWith('-')) {
                  setExpression(expression.slice(1));
                } else if (expression) {
                  setExpression(`-(${expression})`);
                }
              }}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-base sm:text-lg border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              ±
            </button>
            <button
              onClick={() => handleInput('0')}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              0
            </button>
            <button
              onClick={() => handleInput('.')}
              className="h-14 sm:h-16 bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#FFFFFF] rounded-2xl font-bold text-xl sm:text-2xl border border-white/5 shadow-xs flex items-center justify-center transition-all cursor-pointer"
            >
              .
            </button>
            <button
              onClick={handleCalculate}
              className="h-14 sm:h-16 bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 text-[#FFFFFF] rounded-2xl font-extrabold text-xl sm:text-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all cursor-pointer"
            >
              <Equal className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        ) : (
          /* SCIENTIFIC 5-COLUMN HIGH-PERFORMANCE GRID */
          <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
            {/* Scientific Function Row 1 */}
            <button
              onClick={() => handleInput(isShift ? 'asin(' : 'sin(')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#A1A1AA] hover:text-[#FFFFFF] font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              {isShift ? 'sin⁻¹' : 'sin'}
            </button>
            <button
              onClick={() => handleInput(isShift ? 'acos(' : 'cos(')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#A1A1AA] hover:text-[#FFFFFF] font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              {isShift ? 'cos⁻¹' : 'cos'}
            </button>
            <button
              onClick={() => handleInput(isShift ? 'atan(' : 'tan(')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#A1A1AA] hover:text-[#FFFFFF] font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              {isShift ? 'tan⁻¹' : 'tan'}
            </button>
            <button
              onClick={() => handleInput('π')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#A1A1AA] hover:text-[#FFFFFF] font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              π
            </button>
            <button
              onClick={() => handleInput('e')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#A1A1AA] hover:text-[#FFFFFF] font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              e
            </button>

            {/* Scientific Function Row 2 */}
            <button
              onClick={() => handleInput('log(')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#A1A1AA] hover:text-[#FFFFFF] font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              log
            </button>
            <button
              onClick={() => handleInput('ln(')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#A1A1AA] hover:text-[#FFFFFF] font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              ln
            </button>
            <button
              onClick={() => handleInput('sqrt(')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#A1A1AA] hover:text-[#FFFFFF] font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              √
            </button>
            <button
              onClick={() => handleInput('^2')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#A1A1AA] hover:text-[#FFFFFF] font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              x²
            </button>
            <button
              onClick={() => handleInput('^')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#A1A1AA] hover:text-[#FFFFFF] font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              xʸ
            </button>

            {/* Scientific Function Row 3: Brackets & Clear/Del */}
            <button
              onClick={() => handleInput('(')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#FFFFFF] font-bold text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              (
            </button>
            <button
              onClick={() => handleInput(')')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#FFFFFF] font-bold text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              )
            </button>
            <button
              onClick={() => handleInput('!')}
              className="h-11 sm:h-12 bg-[#121212] hover:bg-[#18181B] active:scale-95 rounded-xl text-[#A1A1AA] hover:text-[#FFFFFF] font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              n!
            </button>
            <button
              onClick={handleClear}
              className="h-11 sm:h-12 bg-[#EF4444] hover:bg-[#DC2626] active:scale-95 rounded-xl text-[#FFFFFF] font-bold text-xs sm:text-sm shadow-sm shadow-red-500/20 transition-all cursor-pointer"
            >
              AC
            </button>
            <button
              onClick={handleBackspace}
              aria-label="Backspace"
              className="h-11 sm:h-12 bg-[#EF4444] hover:bg-[#DC2626] active:scale-95 rounded-xl text-[#FFFFFF] flex items-center justify-center shadow-sm shadow-red-500/20 transition-all cursor-pointer"
            >
              <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Scientific Row 4: 7, 8, 9, ÷, % */}
            <button
              onClick={() => handleInput('7')}
              className="h-12 sm:h-14 bg-[#18181B] hover:bg-[#27272A] active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-[#FFFFFF] border border-white/5 shadow-xs transition-all cursor-pointer"
            >
              7
            </button>
            <button
              onClick={() => handleInput('8')}
              className="h-12 sm:h-14 bg-[#18181B] hover:bg-[#27272A] active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-[#FFFFFF] border border-white/5 shadow-xs transition-all cursor-pointer"
            >
              8
            </button>
            <button
              onClick={() => handleInput('9')}
              className="h-12 sm:h-14 bg-[#18181B] hover:bg-[#27272A] active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-[#FFFFFF] border border-white/5 shadow-xs transition-all cursor-pointer"
            >
              9
            </button>
            <button
              onClick={() => handleInput(' / ')}
              className="h-12 sm:h-14 bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 text-[#FFFFFF] rounded-xl text-xl font-bold shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
            >
              ÷
            </button>
            <button
              onClick={() => handleInput('%')}
              className="h-12 sm:h-14 bg-[#121212] hover:bg-[#18181B] active:scale-95 text-[#A1A1AA] hover:text-[#FFFFFF] rounded-xl font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              %
            </button>

            {/* Scientific Row 5: 4, 5, 6, ×, |x| */}
            <button
              onClick={() => handleInput('4')}
              className="h-12 sm:h-14 bg-[#18181B] hover:bg-[#27272A] active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-[#FFFFFF] border border-white/5 shadow-xs transition-all cursor-pointer"
            >
              4
            </button>
            <button
              onClick={() => handleInput('5')}
              className="h-12 sm:h-14 bg-[#18181B] hover:bg-[#27272A] active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-[#FFFFFF] border border-white/5 shadow-xs transition-all cursor-pointer"
            >
              5
            </button>
            <button
              onClick={() => handleInput('6')}
              className="h-12 sm:h-14 bg-[#18181B] hover:bg-[#27272A] active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-[#FFFFFF] border border-white/5 shadow-xs transition-all cursor-pointer"
            >
              6
            </button>
            <button
              onClick={() => handleInput(' * ')}
              className="h-12 sm:h-14 bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 text-[#FFFFFF] rounded-xl text-xl font-bold shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
            >
              ×
            </button>
            <button
              onClick={() => handleInput('abs(')}
              className="h-12 sm:h-14 bg-[#121212] hover:bg-[#18181B] active:scale-95 text-[#A1A1AA] hover:text-[#FFFFFF] rounded-xl font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              |x|
            </button>

            {/* Scientific Row 6: 1, 2, 3, −, EXP */}
            <button
              onClick={() => handleInput('1')}
              className="h-12 sm:h-14 bg-[#18181B] hover:bg-[#27272A] active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-[#FFFFFF] border border-white/5 shadow-xs transition-all cursor-pointer"
            >
              1
            </button>
            <button
              onClick={() => handleInput('2')}
              className="h-12 sm:h-14 bg-[#18181B] hover:bg-[#27272A] active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-[#FFFFFF] border border-white/5 shadow-xs transition-all cursor-pointer"
            >
              2
            </button>
            <button
              onClick={() => handleInput('3')}
              className="h-12 sm:h-14 bg-[#18181B] hover:bg-[#27272A] active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-[#FFFFFF] border border-white/5 shadow-xs transition-all cursor-pointer"
            >
              3
            </button>
            <button
              onClick={() => handleInput(' - ')}
              className="h-12 sm:h-14 bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 text-[#FFFFFF] rounded-xl text-xl font-bold shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
            >
              −
            </button>
            <button
              onClick={() => handleInput('* 10^')}
              className="h-12 sm:h-14 bg-[#121212] hover:bg-[#18181B] active:scale-95 text-[#A1A1AA] hover:text-[#FFFFFF] rounded-xl font-semibold text-xs sm:text-sm border border-[#27272A] transition-all cursor-pointer"
            >
              EXP
            </button>

            {/* Scientific Row 7: 0, ., +, Equals (Span 2) */}
            <button
              onClick={() => handleInput('0')}
              className="h-12 sm:h-14 bg-[#18181B] hover:bg-[#27272A] active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-[#FFFFFF] border border-white/5 shadow-xs transition-all cursor-pointer"
            >
              0
            </button>
            <button
              onClick={() => handleInput('.')}
              className="h-12 sm:h-14 bg-[#18181B] hover:bg-[#27272A] active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-[#FFFFFF] border border-white/5 shadow-xs transition-all cursor-pointer"
            >
              .
            </button>
            <button
              onClick={() => handleInput(' + ')}
              className="h-12 sm:h-14 bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 text-[#FFFFFF] rounded-xl text-xl font-bold shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
            >
              +
            </button>
            <button
              onClick={handleCalculate}
              className="col-span-2 h-12 sm:h-14 bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 text-[#FFFFFF] rounded-xl text-lg sm:text-xl font-extrabold shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Equal className="w-5 h-5 stroke-[3]" />
              <span>SOLVE</span>
            </button>
          </div>
        )}
      </div>

      {/* Step by Step Breakdown Solution Display */}
      {lastSolution && (
        <div className="pt-2 animate-fadeIn">
          <StepSolutionCard solution={lastSolution} />
        </div>
      )}
    </div>
  );
};
