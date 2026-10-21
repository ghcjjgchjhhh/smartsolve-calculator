import React, { useState, useEffect } from 'react';
import { evaluateExpression, formatNum } from '../services/mathEngine';
import { StepSolutionCard } from './StepSolutionCard';
import { StepSolution } from '../types';
import { saveToHistory } from '../services/historyStorage';
import { Delete, Equal, Sparkles } from 'lucide-react';

export const ScientificCalculator: React.FC = () => {
  const [expression, setExpression] = useState<string>('');
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [isShift, setIsShift] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<string>('');
  const [lastSolution, setLastSolution] = useState<StepSolution | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleInput = (char: string) => {
    setErrorMsg(null);
    setExpression((prev) => prev + char);
  };

  const handleClear = () => {
    setExpression('');
    setPreviewResult('');
    setErrorMsg(null);
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleCalculate = () => {
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Modern Card Body (Sleek Pitch Black & Emerald Engineering Theme) */}
      <div className="bg-white dark:bg-black rounded-3xl p-5 sm:p-6 shadow-2xl border border-zinc-200 dark:border-zinc-850 transition-colors">
        {/* LCD Screen Display */}
        <div className="bg-black text-white rounded-2xl p-4 sm:p-5 mb-5 border border-zinc-800 shadow-inner">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAngleMode(angleMode === 'deg' ? 'rad' : 'deg')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  angleMode === 'deg' ? 'bg-emerald-500 text-black font-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {angleMode.toUpperCase()}
              </button>
              <button
                onClick={() => setIsShift(!isShift)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  isShift ? 'bg-amber-400 text-black font-black' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                2nd / INV
              </button>
            </div>
            <span className="text-[11px] font-bold text-emerald-500/80 tracking-wider">SmartSolve FX</span>
          </div>

          {/* Main Input Text */}
          <div className="min-h-12 flex items-center justify-end overflow-x-auto text-right math-display text-2xl sm:text-3xl text-emerald-400 dark:text-emerald-300 whitespace-nowrap tracking-wider">
            {expression || <span className="text-zinc-600">0</span>}
          </div>

          {/* Live Preview / Error */}
          <div className="min-h-6 flex items-center justify-end text-right font-mono text-sm sm:text-base">
            {errorMsg ? (
              <span className="text-rose-400 text-xs sm:text-sm font-sans">{errorMsg}</span>
            ) : previewResult ? (
              <span className="text-emerald-400 flex items-center space-x-1 font-bold">
                <span className="text-xs text-zinc-500 mr-1 font-normal">=</span> {previewResult}
              </span>
            ) : null}
          </div>
        </div>

        {/* Buttons Grid (Crisp high-contrast keys) */}
        <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
          {/* Scientific Row 1 */}
          <button
            onClick={() => handleInput(isShift ? 'asin(' : 'sin(')}
            className="p-3 sm:p-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/10 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-800 dark:text-emerald-400 font-semibold text-xs sm:text-sm transition-all border border-zinc-200 dark:border-zinc-800"
          >
            {isShift ? 'sin⁻¹' : 'sin'}
          </button>
          <button
            onClick={() => handleInput(isShift ? 'acos(' : 'cos(')}
            className="p-3 sm:p-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/10 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-800 dark:text-emerald-400 font-semibold text-xs sm:text-sm transition-all border border-zinc-200 dark:border-zinc-800"
          >
            {isShift ? 'cos⁻¹' : 'cos'}
          </button>
          <button
            onClick={() => handleInput(isShift ? 'atan(' : 'tan(')}
            className="p-3 sm:p-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/10 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-800 dark:text-emerald-400 font-semibold text-xs sm:text-sm transition-all border border-zinc-200 dark:border-zinc-800"
          >
            {isShift ? 'tan⁻¹' : 'tan'}
          </button>
          <button
            onClick={() => handleInput('π')}
            className="p-3 sm:p-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/10 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-800 dark:text-emerald-300 font-semibold text-xs sm:text-sm transition-all border border-zinc-200 dark:border-zinc-800"
          >
            π
          </button>
          <button
            onClick={() => handleInput('e')}
            className="p-3 sm:p-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/10 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-800 dark:text-emerald-300 font-semibold text-xs sm:text-sm transition-all border border-zinc-200 dark:border-zinc-800"
          >
            e
          </button>

          {/* Scientific Row 2 */}
          <button
            onClick={() => handleInput('log(')}
            className="p-3 sm:p-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/10 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-800 dark:text-emerald-400 font-semibold text-xs sm:text-sm transition-all border border-zinc-200 dark:border-zinc-800"
          >
            log
          </button>
          <button
            onClick={() => handleInput('ln(')}
            className="p-3 sm:p-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/10 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-800 dark:text-emerald-400 font-semibold text-xs sm:text-sm transition-all border border-zinc-200 dark:border-zinc-800"
          >
            ln
          </button>
          <button
            onClick={() => handleInput('sqrt(')}
            className="p-3 sm:p-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/10 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-800 dark:text-emerald-400 font-semibold text-xs sm:text-sm transition-all border border-zinc-200 dark:border-zinc-800"
          >
            √
          </button>
          <button
            onClick={() => handleInput('^2')}
            className="p-3 sm:p-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/10 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-800 dark:text-emerald-300 font-semibold text-xs sm:text-sm transition-all border border-zinc-200 dark:border-zinc-800"
          >
            x²
          </button>
          <button
            onClick={() => handleInput('^')}
            className="p-3 sm:p-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/10 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-800 dark:text-emerald-300 font-semibold text-xs sm:text-sm transition-all border border-zinc-200 dark:border-zinc-800"
          >
            xʸ
          </button>

          {/* Controls & Brackets Row */}
          <button
            onClick={() => handleInput('(')}
            className="p-3 sm:p-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-700 dark:text-zinc-200 font-bold text-sm transition-all border border-zinc-200/80 dark:border-zinc-800"
          >
            (
          </button>
          <button
            onClick={() => handleInput(')')}
            className="p-3 sm:p-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-700 dark:text-zinc-200 font-bold text-sm transition-all border border-zinc-200/80 dark:border-zinc-800"
          >
            )
          </button>
          <button
            onClick={() => handleInput('!')}
            className="p-3 sm:p-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-zinc-700 dark:text-zinc-200 font-semibold text-xs sm:text-sm transition-all border border-zinc-200/80 dark:border-zinc-800"
          >
            n!
          </button>
          <button
            onClick={handleClear}
            className="p-3 sm:p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 dark:text-rose-300 active:scale-95 rounded-xl font-bold text-xs sm:text-sm transition-all border border-rose-200/60 dark:border-zinc-800"
          >
            AC
          </button>
          <button
            onClick={handleBackspace}
            className="p-3 sm:p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 dark:text-rose-300 active:scale-95 rounded-xl flex items-center justify-center transition-all border border-rose-200/60 dark:border-zinc-800"
          >
            <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Number Keypad Row 1 */}
          <button
            onClick={() => handleInput('7')}
            className="p-3.5 sm:p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-zinc-800 dark:text-white transition-all border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
          >
            7
          </button>
          <button
            onClick={() => handleInput('8')}
            className="p-3.5 sm:p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-zinc-800 dark:text-white transition-all border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
          >
            8
          </button>
          <button
            onClick={() => handleInput('9')}
            className="p-3.5 sm:p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-zinc-800 dark:text-white transition-all border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
          >
            9
          </button>
          <button
            onClick={() => handleInput(' / ')}
            className="p-3.5 sm:p-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 active:scale-95 rounded-xl text-xl font-bold transition-all border border-emerald-500/30 dark:border-zinc-800"
          >
            ÷
          </button>
          <button
            onClick={() => handleInput('%')}
            className="p-3 sm:p-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 active:scale-95 rounded-xl font-semibold text-xs sm:text-sm transition-all border border-zinc-200/80 dark:border-zinc-800"
          >
            %
          </button>

          {/* Number Keypad Row 2 */}
          <button
            onClick={() => handleInput('4')}
            className="p-3.5 sm:p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-zinc-800 dark:text-white transition-all border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
          >
            4
          </button>
          <button
            onClick={() => handleInput('5')}
            className="p-3.5 sm:p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-zinc-800 dark:text-white transition-all border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
          >
            5
          </button>
          <button
            onClick={() => handleInput('6')}
            className="p-3.5 sm:p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-zinc-800 dark:text-white transition-all border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
          >
            6
          </button>
          <button
            onClick={() => handleInput(' * ')}
            className="p-3.5 sm:p-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 active:scale-95 rounded-xl text-xl font-bold transition-all border border-emerald-500/30 dark:border-zinc-800"
          >
            ×
          </button>
          <button
            onClick={() => handleInput('abs(')}
            className="p-3 sm:p-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 active:scale-95 rounded-xl font-semibold text-xs sm:text-sm transition-all border border-zinc-200/80 dark:border-zinc-800"
          >
            |x|
          </button>

          {/* Number Keypad Row 3 */}
          <button
            onClick={() => handleInput('1')}
            className="p-3.5 sm:p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-zinc-800 dark:text-white transition-all border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
          >
            1
          </button>
          <button
            onClick={() => handleInput('2')}
            className="p-3.5 sm:p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-zinc-800 dark:text-white transition-all border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
          >
            2
          </button>
          <button
            onClick={() => handleInput('3')}
            className="p-3.5 sm:p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-zinc-800 dark:text-white transition-all border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
          >
            3
          </button>
          <button
            onClick={() => handleInput(' - ')}
            className="p-3.5 sm:p-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 active:scale-95 rounded-xl text-xl font-bold transition-all border border-emerald-500/30 dark:border-zinc-800"
          >
            −
          </button>
          <button
            onClick={() => handleInput('* 10^')}
            className="p-3 sm:p-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 active:scale-95 rounded-xl font-semibold text-xs sm:text-sm transition-all border border-zinc-200/80 dark:border-zinc-800"
          >
            EXP
          </button>

          {/* Number Keypad Row 4 */}
          <button
            onClick={() => handleInput('0')}
            className="p-3.5 sm:p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-zinc-800 dark:text-white transition-all border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
          >
            0
          </button>
          <button
            onClick={() => handleInput('.')}
            className="p-3.5 sm:p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 active:scale-95 rounded-xl text-lg sm:text-xl font-bold text-zinc-800 dark:text-white transition-all border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
          >
            .
          </button>
          <button
            onClick={() => handleInput(' + ')}
            className="p-3.5 sm:p-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 active:scale-95 rounded-xl text-xl font-bold transition-all border border-emerald-500/30 dark:border-zinc-800"
          >
            +
          </button>
          <button
            onClick={handleCalculate}
            className="col-span-2 p-3.5 sm:p-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black rounded-xl text-xl font-black shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Equal className="w-5 h-5 stroke-[3]" />
            <span>SOLVE</span>
          </button>
        </div>
      </div>

      {/* Step by Step Breakdown Solution Display */}
      {lastSolution && (
        <div className="pt-2">
          <StepSolutionCard solution={lastSolution} />
        </div>
      )}
    </div>
  );
};
