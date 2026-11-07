import React, { useState, useEffect, useRef } from 'react';
import { evaluateExpression, formatNum } from '../services/mathEngine';
import { StepSolutionCard } from './StepSolutionCard';
import { StepSolution, HistoryItem } from '../types';
import { saveToHistory, getHistory } from '../services/historyStorage';
import { useAppLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  History,
  Delete,
  Menu,
  Sparkles,
  Palette,
  Sigma,
  Settings,
  Camera,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Props {
  onOpenHistory?: () => void;
  onOpenSearch?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ScientificCalculator: React.FC<Props> = ({
  onOpenHistory,
  onOpenSearch,
  onNavigateTab,
}) => {
  const { t, setIsLanguageModalOpen } = useAppLanguage();
  const { resolvedTheme } = useTheme();

  const [expression, setExpression] = useState<string>('');
  const [previousExpression, setPreviousExpression] = useState<string>('');
  const [lastResultStr, setLastResultStr] = useState<string>('');
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [isShift, setIsShift] = useState<boolean>(false);
  const [isAlpha, setIsAlpha] = useState<boolean>(false);
  const [isHyp, setIsHyp] = useState<boolean>(false);
  const [is2nd, setIs2nd] = useState<boolean>(false);
  const [memoryVal, setMemoryVal] = useState<number>(0);
  const [hasMemory, setHasMemory] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<string>('');
  const [lastSolution, setLastSolution] = useState<StepSolution | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [historyCursor, setHistoryCursor] = useState<number>(-1);

  const displayEndRef = useRef<HTMLDivElement>(null);

  /**
   * Format mathematical expression for clean, authentic scientific display
   * Uses proper mathematical symbols: ×, ÷, −, √, ∛, π, ∞, superscripts
   */
  const formatMathDisplay = (expr: string): string => {
    if (!expr) return '';
    return expr
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\b([0-9]+)\s*-\s*([0-9]+)/g, '$1 − $2')
      .replace(/(^|\s)-(\d+)/g, '$1−$2')
      .replace(/\bsqrt\(/gi, '√(')
      .replace(/\bcbrt\(/gi, '∛(')
      .replace(/\bpi\b/gi, 'π')
      .replace(/\bInfinity\b/gi, '∞')
      .replace(/\^2\b/g, '²')
      .replace(/\^3\b/g, '³')
      .replace(/\^\(-1\)/g, '⁻¹')
      .replace(/\^-1\b/g, '⁻¹')
      .replace(/\^0\b/g, '⁰')
      .replace(/\^1\b/g, '¹')
      .replace(/\^4\b/g, '⁴')
      .replace(/\^5\b/g, '⁵')
      .replace(/\^6\b/g, '⁶')
      .replace(/\^7\b/g, '⁷')
      .replace(/\^8\b/g, '⁸')
      .replace(/\^9\b/g, '⁹')
      .replace(/\s+/g, ' ');
  };

  const formatMathResult = (val: string): string => {
    if (!val) return '';
    return val
      .replace(/-Infinity/gi, '−∞')
      .replace(/\bInfinity\b/gi, '∞')
      .replace(/^-/, '−');
  };

  const refreshHistory = () => {
    try {
      const all = getHistory();
      setHistoryCount(all.length);
      setRecentHistory(all.slice(0, 4));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshHistory();
    window.addEventListener('smartsolve_history_changed', refreshHistory);
    return () => {
      window.removeEventListener('smartsolve_history_changed', refreshHistory);
    };
  }, []);

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
      setPreviewResult(formatNum(res.result, 8));
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
        handleInput(' − ');
      } else if (e.key === '*' || e.key === 'x') {
        handleInput(' × ');
      } else if (e.key === '/') {
        e.preventDefault();
        handleInput(' ÷ ');
      } else if (e.key === '%') {
        handleInput('%');
      } else if (e.key === '(' || e.key === ')') {
        handleInput(e.key);
      } else if (e.key === '^') {
        handleInput('^');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'ArrowUp') {
        handleDpad('up');
      } else if (e.key === 'ArrowDown') {
        handleDpad('down');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, angleMode, historyCursor]);

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
    if (isShift) setIsShift(false);
    if (isAlpha) setIsAlpha(false);
  };

  const handleSetValue = (val: string) => {
    triggerHaptic();
    setErrorMsg(null);
    setExpression(val);
  };

  const handleClear = () => {
    triggerHaptic();
    setExpression('');
    setPreviousExpression('');
    setLastResultStr('');
    setPreviewResult('');
    setErrorMsg(null);
    setIsShift(false);
    setIsAlpha(false);
    setHistoryCursor(-1);
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
      const finalStr = formatNum(res.result, 8);

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

      setPreviousExpression(expression);
      setLastResultStr(finalStr);
      setLastSolution(solution);
      saveToHistory(solution);
      setExpression(finalStr);
      setErrorMsg(null);
      setIsShift(false);
      setIsAlpha(false);
      setHistoryCursor(-1);
    } catch (err: any) {
      setErrorMsg(err.message || 'Syntax error in calculation.');
    }
  };

  // Directional D-Pad Navigation
  const handleDpad = (direction: 'up' | 'down' | 'left' | 'right' | 'center') => {
    triggerHaptic();
    const all = getHistory();

    if (direction === 'center') {
      handleCalculate();
      return;
    }

    if (direction === 'up') {
      if (all.length === 0) return;
      const nextIndex = Math.min(all.length - 1, historyCursor + 1);
      setHistoryCursor(nextIndex);
      const item = all[nextIndex];
      if (item) {
        setExpression(item.problemStatement || item.finalAnswer);
      }
      return;
    }

    if (direction === 'down') {
      if (historyCursor <= 0) {
        setHistoryCursor(-1);
        setExpression('');
        return;
      }
      const prevIndex = historyCursor - 1;
      setHistoryCursor(prevIndex);
      const item = all[prevIndex];
      if (item) {
        setExpression(item.problemStatement || item.finalAnswer);
      }
      return;
    }

    if (direction === 'left') {
      // Move back or remove last token
      handleBackspace();
      return;
    }

    if (direction === 'right') {
      // Repeat last answer or append Ans
      if (lastResultStr) {
        handleInput(lastResultStr);
      }
    }
  };

  // Fraction to Decimal toggle (S <=> D key)
  const handleFractionToggle = () => {
    triggerHaptic();
    if (!expression.trim()) return;
    try {
      const num = parseFloat(expression);
      if (!isNaN(num) && isFinite(num)) {
        if (expression.includes('/')) {
          setExpression(num.toString());
        } else {
          // Approximate decimal to fraction
          const tolerance = 1.0e-6;
          let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
          let b = num;
          do {
            const a = Math.floor(b);
            let aux = h1; h1 = a * h1 + h2; h2 = aux;
            aux = k1; k1 = a * k1 + k2; k2 = aux;
            b = 1 / (b - a);
          } while (Math.abs(num - h1 / k1) > num * tolerance);
          if (k1 !== 1 && k1 > 0) {
            setExpression(`${h1}/${k1}`);
            return;
          }
        }
      }
      handleCalculate();
    } catch {
      handleCalculate();
    }
  };

  // Memory keys handlers
  const handleMemoryAdd = () => {
    triggerHaptic();
    try {
      const val = parseFloat(previewResult || expression);
      if (!isNaN(val)) {
        setMemoryVal((prev) => prev + val);
        setHasMemory(true);
      }
    } catch {}
  };

  const handleMemoryRecall = () => {
    triggerHaptic();
    if (isShift) {
      // STO
      try {
        const val = parseFloat(previewResult || expression);
        if (!isNaN(val)) {
          setMemoryVal(val);
          setHasMemory(true);
          setIsShift(false);
        }
      } catch {}
    } else {
      // RCL
      handleInput(memoryVal.toString());
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto space-y-3 sm:space-y-4 select-none pb-8 px-0.5 sm:px-0">
      {/* =========================================================
          AUTHENTIC CASIO fx-991EX CLASSWIZ HARDWARE CHASSIS
          Matches the reference image layout, proportions, and styling
          ========================================================= */}
      <div
        className="rounded-3xl sm:rounded-[28px] p-2.5 xs:p-3 sm:p-4.5 shadow-2xl border border-[#2E333B] relative overflow-hidden transition-all"
        style={{
          backgroundColor: '#121417',
          backgroundImage:
            'radial-gradient(#252A30 0.85px, transparent 0.85px), radial-gradient(#252A30 0.85px, #121417 0.85px)',
          backgroundSize: '10px 10px',
          backgroundPosition: '0 0, 5px 5px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Top Status Indicators Row (Directly above LCD screen) */}
        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest px-2 mb-1.5 text-zinc-500 font-bold select-none">
          <div className="flex items-center space-x-2">
            <span
              className={`transition-colors ${
                isShift ? 'text-[#FBBF24] font-black scale-110 drop-shadow' : 'text-zinc-600'
              }`}
            >
              S
            </span>
            <span
              className={`transition-colors ${
                isAlpha ? 'text-[#C084FC] font-black scale-110 drop-shadow' : 'text-zinc-600'
              }`}
            >
              A
            </span>
            <span className={hasMemory ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
              STO
            </span>
            <span className={hasMemory ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
              RCL
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-zinc-500">NORM-11</span>
            <span className="text-zinc-400 font-bold">MATH</span>
            <button
              onClick={() => {
                triggerHaptic();
                setAngleMode((prev) => (prev === 'deg' ? 'rad' : 'deg'));
              }}
              className="text-[#22C55E] hover:underline font-extrabold cursor-pointer"
              title="Toggle DEG / RAD angle mode"
            >
              {angleMode === 'deg' ? 'DECI' : 'RAD'}
            </button>
          </div>
        </div>

        {/* =========================================================
            LCD DISPLAY SCREEN (Authentic Sage-Grey Retro Dot-Matrix)
            Matches reference image LCD glass with top expression,
            right-aligned result and blinking purple caret cursor.
            ========================================================= */}
        {/* =========================================================
            LCD DISPLAY SCREEN (Authentic Sage-Grey Retro Dot-Matrix)
            Completely BLANK on initial load per user instruction #1.
            Only shows content when user enters something or calculates.
            ========================================================= */}
        <div
          className="rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 mb-2 sm:mb-2.5 relative overflow-hidden transition-all border border-[#8EA194] flex flex-col justify-between min-h-[92px] sm:min-h-[110px]"
          style={{
            backgroundColor: '#C5D6CC',
            boxShadow: 'inset 0 2px 7px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Top Line: Previous Expression (ONLY rendered if a previous calculation exists) */}
          <div className="flex items-center justify-between font-mono text-xs sm:text-sm text-[#111613] tracking-wide min-h-[18px]">
            {previousExpression ? (
              <>
                <div className="truncate font-semibold opacity-85 overflow-x-auto scrollbar-none whitespace-nowrap flex-1">
                  {formatMathDisplay(previousExpression)}
                </div>
                <div className="text-[10px] text-[#202722] opacity-60 flex flex-col items-center leading-none ml-1 shrink-0">
                  <span>•</span>
                  <span>•</span>
                  <span>•</span>
                </div>
              </>
            ) : (
              <div />
            )}
          </div>

          {/* Middle Line: Evaluated Result (ONLY rendered if a result exists) */}
          <div className="flex items-center justify-between text-right font-mono font-bold text-[#0D120F] tracking-tight min-h-[26px] sm:min-h-[32px] my-0.5">
            {lastResultStr ? (
              <>
                <div className="text-[10px] text-[#202722] opacity-40 flex flex-col items-center leading-none mr-1 shrink-0">
                  <span>•</span>
                  <span>•</span>
                  <span>•</span>
                </div>
                <div className="truncate text-right w-full text-lg sm:text-2xl font-mono overflow-x-auto scrollbar-none whitespace-nowrap">
                  {formatMathResult(lastResultStr)}
                </div>
              </>
            ) : (
              <div />
            )}
          </div>

          {/* Bottom Line: Active Input Line with Purple Vertical Cursor */}
          <div className="flex items-center justify-between pt-0.5 border-t border-[#9EB0A3]/50 min-h-[24px] sm:min-h-[28px]">
            <div className="flex items-center text-sm sm:text-lg font-mono font-bold text-[#0F1411] tracking-wide overflow-x-auto scrollbar-none flex-1 mr-1.5 whitespace-nowrap">
              <span className="w-0.5 h-4 sm:h-5 bg-[#9333EA] animate-pulse mr-1 shrink-0 rounded-full" />
              {expression ? (
                <span>{formatMathDisplay(expression)}</span>
              ) : null}
              <div ref={displayEndRef} />
            </div>
            {expression ? (
              <div className="text-[10px] text-[#202722] opacity-60 flex flex-col items-center leading-none shrink-0">
                <span>•</span>
                <span>•</span>
                <span>•</span>
              </div>
            ) : null}
          </div>

          {/* Live Preview / Error Banner */}
          {(errorMsg || (previewResult && expression && previewResult !== lastResultStr)) && (
            <div className="mt-0.5 flex items-center justify-end text-[10px] sm:text-[11px] font-mono font-semibold">
              {errorMsg ? (
                <span className="text-rose-700 font-bold truncate">{errorMsg}</span>
              ) : previewResult ? (
                <span className="text-[#134E2E] truncate">= {formatMathResult(previewResult)}</span>
              ) : null}
            </div>
          )}
        </div>

        {/* =========================================================
            TOOLBAR BUTTONS STRIP (Directly below the LCD screen)
            8 high-contrast circular/pill buttons perfectly fitted for mobile
            ========================================================= */}
        <div className="grid grid-cols-8 gap-0.5 xs:gap-1 sm:gap-1.5 mb-2.5 sm:mb-3 px-0.5 items-center justify-items-center w-full">
          {/* 1. Menu Icon */}
          <button
            type="button"
            onClick={() => onOpenHistory?.()}
            className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full bg-[#1E2228] hover:bg-[#2A2E35] border border-[#333842] flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Menu & History"
          >
            <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* 2. PRO Badge Pill */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('ai_solver')}
            className="px-2 xs:px-2.5 py-0.5 xs:py-1 rounded-full bg-[#1E2228] hover:bg-[#2A2E35] border border-[#9333EA]/70 flex items-center space-x-1 text-white transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Open AI Step-by-Step Solver"
          >
            <Sparkles className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-[#C084FC]" />
            <span className="text-[10px] xs:text-[11px] font-extrabold text-[#C084FC]">PRO</span>
          </button>

          {/* 3. Theme Palette Icon */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event('smartsolve_open_theme_modal'));
            }}
            className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full bg-[#1E2228] hover:bg-[#2A2E35] border border-[#333842] flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Theme & Colors"
          >
            <Palette className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-zinc-300" />
          </button>

          {/* 4. Sigma ∑ Icon (Math Hub) */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('math')}
            className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full bg-[#1E2228] hover:bg-[#2A2E35] border border-[#333842] flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Mathematics Hub & Formulas"
          >
            <Sigma className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
          </button>

          {/* 5. Settings Gear Icon (Language & Writing Settings) */}
          <button
            type="button"
            onClick={() => setIsLanguageModalOpen(true)}
            className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full bg-[#1E2228] hover:bg-[#2A2E35] border border-[#333842] flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="App Language & Writing Settings"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
          </button>

          {/* 6. Plus-Minus Tool Icon */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('equation')}
            className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full bg-[#1E2228] hover:bg-[#2A2E35] border border-[#333842] flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Equation Solver"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v8M8 8h8M8 18h8" />
            </svg>
          </button>

          {/* 7. Camera Icon (AI Scanner) */}
          <button
            type="button"
            onClick={() => onNavigateTab?.('ai_solver')}
            className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full bg-[#1E2228] hover:bg-[#2A2E35] border border-[#333842] flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Snap Photo of Problem"
          >
            <Camera className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-zinc-300" />
          </button>

          {/* 8. MORE Badge Pill */}
          <button
            type="button"
            onClick={() => onOpenSearch?.()}
            className="px-2 xs:px-2.5 py-0.5 xs:py-1 rounded-full bg-[#1E2228] hover:bg-[#2A2E35] border border-[#333842] flex items-center text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            title="Quick Search & 60+ Tools"
          >
            <span className="text-[9.5px] xs:text-[10px] font-bold">MORE</span>
          </button>
        </div>

        {/* =========================================================
            UPPER CONTROL SECTION
            SHIFT (Yellow), ALPHA (Purple), D-PAD (Center), MODE, 2nd
            ========================================================= */}
        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-center mb-2 px-0.5">
          {/* Left: SHIFT & ALPHA Buttons */}
          <div className="col-span-3 flex flex-col gap-1.5">
            {/* SHIFT Button (Yellow Background) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setIsShift((prev) => !prev);
              }}
              className={`h-8 xs:h-8.5 sm:h-9.5 rounded-lg sm:rounded-xl font-black text-[11px] xs:text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center ${
                isShift
                  ? 'bg-[#FBBF24] text-black ring-2 ring-yellow-400 ring-offset-1 ring-offset-black'
                  : 'bg-[#EAB308] text-black hover:bg-[#FACC15]'
              }`}
            >
              SHIFT
            </button>

            {/* ALPHA Button (Purple Background) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setIsAlpha((prev) => !prev);
              }}
              className={`h-8 xs:h-8.5 sm:h-9.5 rounded-lg sm:rounded-xl font-black text-[11px] xs:text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center ${
                isAlpha
                  ? 'bg-[#9333EA] text-white ring-2 ring-purple-400 ring-offset-1 ring-offset-black'
                  : 'bg-[#7E22CE] text-white hover:bg-[#9333EA]'
              }`}
            >
              ALPHA
            </button>
          </div>

          {/* Center: Circular Directional Navigation Pad (D-Pad) */}
          <div className="col-span-6 flex items-center justify-center">
            <div
              className="w-20 h-20 xs:w-22 xs:h-22 sm:w-26 sm:h-26 rounded-full border-2 border-[#404652] relative shadow-lg flex items-center justify-center transition-all"
              style={{
                backgroundColor: '#2D323A',
                boxShadow:
                  '0 8px 18px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.4)',
              }}
            >
              {/* Up Triangle */}
              <button
                type="button"
                onClick={() => handleDpad('up')}
                className="absolute top-1 left-1/2 -translate-x-1/2 text-zinc-300 hover:text-white active:scale-90 p-1 cursor-pointer transition-transform"
                title="Previous calculation history (Up)"
              >
                <ChevronUp className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
              </button>

              {/* Down Triangle */}
              <button
                type="button"
                onClick={() => handleDpad('down')}
                className="absolute bottom-1 left-1/2 -translate-x-1/2 text-zinc-300 hover:text-white active:scale-90 p-1 cursor-pointer transition-transform"
                title="Next calculation history (Down)"
              >
                <ChevronDown className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
              </button>

              {/* Left Triangle */}
              <button
                type="button"
                onClick={() => handleDpad('left')}
                className="absolute left-1 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-white active:scale-90 p-1 cursor-pointer transition-transform"
                title="Move cursor left / Backspace"
              >
                <ChevronLeft className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
              </button>

              {/* Right Triangle */}
              <button
                type="button"
                onClick={() => handleDpad('right')}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-white active:scale-90 p-1 cursor-pointer transition-transform"
                title="Move cursor right / Insert Ans"
              >
                <ChevronRight className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5" />
              </button>

              {/* Center Dot Button */}
              <button
                type="button"
                onClick={() => handleDpad('center')}
                className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded-full bg-[#181B20] border border-[#3E4552] text-zinc-400 hover:text-white shadow-inner flex items-center justify-center active:scale-95 cursor-pointer"
                title="Calculate / Confirm"
              >
                <span className="w-2 h-2 xs:w-2.5 xs:h-2.5 rounded-full bg-zinc-500 hover:bg-emerald-400" />
              </button>
            </div>
          </div>

          {/* Right: MODE & 2nd Buttons */}
          <div className="col-span-3 flex flex-col gap-1.5">
            {/* MODE Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setAngleMode((prev) => (prev === 'deg' ? 'rad' : 'deg'));
              }}
              className="h-8 xs:h-8.5 sm:h-9.5 rounded-lg sm:rounded-xl bg-[#373C44] hover:bg-[#434A54] border border-[#4B525E] font-bold text-[11px] xs:text-xs sm:text-sm text-white transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center uppercase tracking-wider"
              title="Toggle DEG / RAD Angle Mode"
            >
              MODE
            </button>

            {/* 2nd Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setIs2nd((prev) => !prev);
              }}
              className={`h-8 xs:h-8.5 sm:h-9.5 rounded-lg sm:rounded-xl border font-bold text-[11px] xs:text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center italic tracking-wider ${
                is2nd
                  ? 'bg-[#22C55E] text-white border-[#22C55E]'
                  : 'bg-[#373C44] text-white hover:bg-[#434A54] border-[#4B525E]'
              }`}
            >
              2nd
            </button>
          </div>
        </div>

        {/* =========================================================
            ROW OF 4 KEYS UNDER D-PAD: CALC, ∫dx, x^-1, Log_x y
            ========================================================= */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2 px-0.5">
          {/* 1. CALC (Shift: SOLVE, Alpha: =) */}
          <FunctionKey
            mainLabel="CALC"
            shiftLabel="SOLVE"
            alphaLabel="="
            onClick={() => (isShift ? handleCalculate() : handleCalculate())}
          />

          {/* 2. ∫dx (Shift: d/dx, Alpha: ;) */}
          <FunctionKey
            mainLabel="∫dx"
            shiftLabel="d/dx"
            alphaLabel=";"
            onClick={() => handleInput(isShift ? 'd/dx(' : 'integrate(')}
          />

          {/* 3. x^-1 (Shift: x!, Alpha: Σ) */}
          <FunctionKey
            mainLabel="x⁻¹"
            shiftLabel="x!"
            alphaLabel="Σ"
            onClick={() => handleInput(isShift ? '!' : '⁻¹')}
          />

          {/* 4. Log_x y (Shift: ∏) */}
          <FunctionKey
            mainLabel="Log_x y"
            shiftLabel="∏"
            alphaLabel=""
            onClick={() => handleInput('log(')}
          />
        </div>

        {/* =========================================================
            ROW 1 OF SCIENTIFIC KEYS (6 keys):
            x/y, √x, x², x^y, Log, Ln
            ========================================================= */}
        <div className="grid grid-cols-6 gap-0.5 xs:gap-1 sm:gap-1.5 mb-2 px-0.5">
          <FunctionKey
            mainLabel="x/y"
            shiftLabel="x y/z"
            alphaLabel="÷R"
            onClick={() => handleInput(' ÷ ')}
          />
          <FunctionKey
            mainLabel="√x"
            shiftLabel="³√x"
            alphaLabel="mod"
            onClick={() => handleInput(isShift ? '∛(' : '√(')}
          />
          <FunctionKey
            mainLabel="x²"
            shiftLabel="x³"
            alphaLabel="¯"
            onClick={() => handleInput(isShift ? '³' : '²')}
          />
          <FunctionKey
            mainLabel="xʸ"
            shiftLabel="ˣ√y"
            alphaLabel=""
            onClick={() => handleInput('^')}
          />
          <FunctionKey
            mainLabel="Log"
            shiftLabel="10ˣ"
            alphaLabel=""
            onClick={() => handleInput(isShift ? '10^(' : 'log(')}
          />
          <FunctionKey
            mainLabel="Ln"
            shiftLabel="eˣ"
            alphaLabel="t"
            onClick={() => handleInput(isShift ? 'e^(' : 'ln(')}
          />
        </div>

        {/* =========================================================
            ROW 2 OF SCIENTIFIC KEYS (6 keys):
            ( - ), ° ' ", hyp, Sin, Cos, Tan
            ========================================================= */}
        <div className="grid grid-cols-6 gap-0.5 xs:gap-1 sm:gap-1.5 mb-2 px-0.5">
          <FunctionKey
            mainLabel="( - )"
            shiftLabel="∠"
            alphaLabel="a"
            onClick={() => handleInput('(−')}
          />
          <FunctionKey
            mainLabel="° ' ″"
            shiftLabel="FACT"
            alphaLabel="b"
            onClick={() => handleInput('°')}
          />
          <FunctionKey
            mainLabel="hyp"
            shiftLabel="|x|"
            alphaLabel="c"
            onClick={() => {
              triggerHaptic();
              setIsHyp((prev) => !prev);
            }}
            isActive={isHyp}
          />
          <FunctionKey
            mainLabel="Sin"
            shiftLabel="Sin⁻¹"
            alphaLabel="d"
            onClick={() =>
              handleInput(isShift ? 'asin(' : isHyp ? 'sinh(' : 'sin(')
            }
          />
          <FunctionKey
            mainLabel="Cos"
            shiftLabel="Cos⁻¹"
            alphaLabel="e"
            onClick={() =>
              handleInput(isShift ? 'acos(' : isHyp ? 'cosh(' : 'cos(')
            }
          />
          <FunctionKey
            mainLabel="Tan"
            shiftLabel="Tan⁻¹"
            alphaLabel="f"
            onClick={() =>
              handleInput(isShift ? 'atan(' : isHyp ? 'tanh(' : 'tan(')
            }
          />
        </div>

        {/* =========================================================
            ROW 3 OF SCIENTIFIC KEYS (6 keys):
            RCL, ENG, (, ), S<=>D, M+
            ========================================================= */}
        <div className="grid grid-cols-6 gap-1 sm:gap-1.5 mb-2.5 px-0.5">
          <FunctionKey
            mainLabel="RCL"
            shiftLabel="STO"
            alphaLabel="CLRv"
            onClick={handleMemoryRecall}
          />
          <FunctionKey
            mainLabel="ENG"
            shiftLabel="i"
            alphaLabel="Cot"
            onClick={() => handleInput(' × 10^')}
          />
          <FunctionKey
            mainLabel="("
            shiftLabel="%"
            alphaLabel="Cot⁻¹"
            onClick={() => handleInput(isShift ? '%' : '(')}
          />
          <FunctionKey
            mainLabel=")"
            shiftLabel=","
            alphaLabel="x"
            onClick={() => handleInput(')')}
          />
          <FunctionKey
            mainLabel="S ⇔ D"
            shiftLabel="a b/c"
            alphaLabel="y"
            onClick={handleFractionToggle}
          />
          <FunctionKey
            mainLabel="M+"
            shiftLabel="M-"
            alphaLabel="m"
            onClick={handleMemoryAdd}
          />
        </div>

        {/* =========================================================
            MAIN NUMERIC & OPERATOR KEYPAD (5 Columns x 4 Rows)
            Matching Casio fx-991EX layout with Orange DEL & AC keys
            ========================================================= */}
        <div className="space-y-1 xs:space-y-1.5 sm:space-y-2 px-0.5">
          {/* Row 1: 7, 8, 9, DEL (Orange), AC (Orange) */}
          <div className="grid grid-cols-5 gap-1 xs:gap-1.5 sm:gap-2">
            <KeypadButton
              mainLabel="7"
              shiftLabel="CONST"
              alphaLabel=""
              onClick={() => handleInput('7')}
            />
            <KeypadButton
              mainLabel="8"
              shiftLabel="CONV"
              alphaLabel="SI"
              onClick={() => handleInput('8')}
            />
            <KeypadButton
              mainLabel="9"
              shiftLabel="Limit"
              alphaLabel="∞"
              onClick={() => handleInput('9')}
            />
            {/* DEL Key (Orange with Backspace icon) */}
            <div className="flex flex-col items-center min-w-0 w-full">
              <div className="h-3 text-[9px] font-bold text-zinc-500 font-mono invisible">DEL</div>
              <button
                type="button"
                onClick={handleBackspace}
                className="w-full h-10.5 xs:h-11.5 sm:h-13.5 rounded-xl sm:rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-black font-black text-lg flex items-center justify-center shadow-md active:scale-95 cursor-pointer transition-all border border-[#F97316] min-w-0"
                title="Delete previous character"
              >
                <Delete className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </button>
            </div>
            {/* AC Key (Orange with bold text) */}
            <div className="flex flex-col items-center min-w-0 w-full">
              <div className="h-3 text-[8px] xs:text-[9px] font-bold text-[#FBBF24] font-mono leading-none truncate">
                CLR ALL
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="w-full h-10.5 xs:h-11.5 sm:h-13.5 rounded-xl sm:rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-black font-black text-base xs:text-lg sm:text-xl flex items-center justify-center shadow-md active:scale-95 cursor-pointer transition-all border border-[#FB923C] min-w-0"
                title="All Clear"
              >
                AC
              </button>
            </div>
          </div>

          {/* Row 2: 4, 5, 6, ×, ÷ */}
          <div className="grid grid-cols-5 gap-1 xs:gap-1.5 sm:gap-2">
            <KeypadButton
              mainLabel="4"
              shiftLabel="MATRIX"
              alphaLabel="⁞⁞"
              onClick={() => handleInput('4')}
            />
            <KeypadButton
              mainLabel="5"
              shiftLabel="VECTOR"
              alphaLabel=""
              onClick={() => handleInput('5')}
            />
            <KeypadButton
              mainLabel="6"
              shiftLabel="FUNC"
              alphaLabel="HELP"
              onClick={() => handleInput('6')}
            />
            <KeypadButton
              mainLabel="×"
              shiftLabel="nPr"
              alphaLabel="GCD"
              onClick={() => handleInput(' × ')}
            />
            <KeypadButton
              mainLabel="÷"
              shiftLabel="nCr"
              alphaLabel="LCM"
              onClick={() => handleInput(' ÷ ')}
            />
          </div>

          {/* Row 3: 1, 2, 3, +, − */}
          <div className="grid grid-cols-5 gap-1 xs:gap-1.5 sm:gap-2">
            <KeypadButton
              mainLabel="1"
              shiftLabel="STAT"
              alphaLabel=""
              onClick={() => handleInput('1')}
            />
            <KeypadButton
              mainLabel="2"
              shiftLabel="CMPLX"
              alphaLabel=""
              onClick={() => handleInput('2')}
            />
            <KeypadButton
              mainLabel="3"
              shiftLabel="DISTR"
              alphaLabel=""
              onClick={() => handleInput('3')}
            />
            <KeypadButton
              mainLabel="+"
              shiftLabel="Pol"
              alphaLabel="Ceil"
              onClick={() => handleInput(' + ')}
            />
            <KeypadButton
              mainLabel="−"
              shiftLabel="Rec"
              alphaLabel="Floor"
              onClick={() => handleInput(' − ')}
            />
          </div>

          {/* Row 4: 0, ., Exp, Ans, = */}
          <div className="grid grid-cols-5 gap-1 xs:gap-1.5 sm:gap-2">
            <KeypadButton
              mainLabel="0"
              shiftLabel="COPY"
              alphaLabel="PASTE"
              onClick={() => handleInput('0')}
            />
            <KeypadButton
              mainLabel="."
              shiftLabel="Ran#"
              alphaLabel="RanInt"
              onClick={() => handleInput('.')}
            />
            <KeypadButton
              mainLabel="Exp"
              shiftLabel="π"
              alphaLabel="e"
              onClick={() => handleInput(isShift ? 'π' : isAlpha ? 'e' : ' × 10^')}
            />
            <KeypadButton
              mainLabel="Ans"
              shiftLabel=""
              alphaLabel="PreAns"
              onClick={() => handleInput(lastResultStr || 'Ans')}
            />
            <KeypadButton
              mainLabel="="
              shiftLabel="History"
              alphaLabel=""
              isPrimary
              onClick={() => (isShift ? onOpenHistory?.() : handleCalculate())}
            />
          </div>
        </div>
      </div>

      {/* =========================================================
          RECENT CALCULATIONS ACCESS STRIP
          Preserves convenient click-to-load calculations
          ========================================================= */}
      {recentHistory.length > 0 && (
        <div className="bg-[#121417] border border-[#27272A] rounded-2xl p-2.5 shadow-md">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#A1A1AA] mb-1.5 px-1">
            <span className="flex items-center space-x-1.5">
              <History className="w-3 h-3 text-[#22C55E]" />
              <span>{t('recent_history', 'Recent Calculations')}:</span>
            </span>
            <button
              type="button"
              onClick={() => onOpenHistory?.()}
              className="text-[#22C55E] hover:underline font-bold text-[11px] cursor-pointer"
            >
              {t('view_all', 'View All')} ({historyCount}) →
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {recentHistory.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  handleSetValue(h.finalAnswer);
                }}
                className="flex-shrink-0 px-2.5 py-1 rounded-xl bg-[#1C1F26] hover:bg-[#272C35] border border-[#2E333D] hover:border-[#22C55E]/60 text-xs font-mono transition-all text-left flex items-center space-x-1.5 cursor-pointer group active:scale-95 text-white"
                title={`Tap to load answer (${h.finalAnswer}) into calculator`}
              >
                <span className="text-[#A1A1AA] group-hover:text-white max-w-[130px] truncate">
                  {h.problemStatement || h.title}
                </span>
                <span className="text-[#22C55E] font-bold">= {h.finalAnswer}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Verified Step-by-Step Solution Card */}
      {lastSolution && (
        <div className="animate-fadeIn mt-4">
          <StepSolutionCard solution={lastSolution} />
        </div>
      )}
    </div>
  );
};

// =========================================================
// SUB-COMPONENTS FOR AUTHENTIC SCIENTIFIC KEYPAD
// =========================================================

interface FunctionKeyProps {
  mainLabel: string;
  shiftLabel: string;
  alphaLabel: string;
  onClick: () => void;
  isActive?: boolean;
}

const FunctionKey: React.FC<FunctionKeyProps> = ({
  mainLabel,
  shiftLabel,
  alphaLabel,
  onClick,
  isActive,
}) => {
  return (
    <div className="flex flex-col items-center select-none min-w-0 w-full">
      {/* Yellow Shift Label & Purple Alpha Label above key */}
      <div className="h-3 sm:h-3.5 w-full flex items-center justify-between px-0.5 text-[7px] xs:text-[8px] sm:text-[9.5px] font-bold font-mono leading-none truncate">
        <span className="text-[#FBBF24] truncate mr-0.5">{shiftLabel}</span>
        <span className="text-[#C084FC] truncate">{alphaLabel}</span>
      </div>

      {/* Main Scientific Button */}
      <button
        type="button"
        onClick={onClick}
        className={`w-full h-7.5 xs:h-8 sm:h-9 rounded-lg sm:rounded-xl border text-[11px] xs:text-xs sm:text-sm font-semibold flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer min-w-0 ${
          isActive
            ? 'bg-[#22C55E] text-white border-[#22C55E]'
            : 'bg-[#2B3037] hover:bg-[#383F49] text-white border-[#3C434E]'
        }`}
        style={{
          boxShadow: '0 2px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <span className="truncate px-0.5">{mainLabel}</span>
      </button>
    </div>
  );
};

interface KeypadButtonProps {
  mainLabel: string;
  shiftLabel: string;
  alphaLabel: string;
  onClick: () => void;
  isPrimary?: boolean;
}

const KeypadButton: React.FC<KeypadButtonProps> = ({
  mainLabel,
  shiftLabel,
  alphaLabel,
  onClick,
  isPrimary,
}) => {
  return (
    <div className="flex flex-col items-center select-none min-w-0 w-full">
      {/* Shift & Alpha Labels */}
      <div className="h-3 w-full flex items-center justify-between px-0.5 text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] font-bold font-mono leading-none truncate">
        <span className="text-[#FBBF24] truncate mr-0.5">{shiftLabel}</span>
        <span className="text-[#C084FC] truncate">{alphaLabel}</span>
      </div>

      {/* Main Key */}
      <button
        type="button"
        onClick={onClick}
        className={`w-full h-10.5 xs:h-11.5 sm:h-13.5 rounded-xl sm:rounded-2xl border text-base xs:text-lg sm:text-xl font-bold flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer min-w-0 ${
          isPrimary
            ? 'bg-[#22C55E] hover:bg-[#16A34A] text-white border-[#22C55E] shadow-emerald-500/20'
            : 'bg-[#2A2E35] hover:bg-[#373C45] text-white border-[#3B424D]'
        }`}
        style={{
          boxShadow: '0 3px 6px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.1)',
        }}
      >
        <span>{mainLabel}</span>
      </button>
    </div>
  );
};
