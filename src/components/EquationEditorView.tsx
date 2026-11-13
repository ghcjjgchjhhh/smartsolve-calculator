import React, { useRef, useState } from 'react';
import {
  Copy,
  Check,
  Trash2,
  Delete,
  Sparkles,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { computeDeterministically } from '../services/deterministicSolver';

interface SymbolKey {
  label: string;
  latex: string;
  title?: string;
}

const SYMBOL_TABS: Record<string, SymbolKey[]> = {
  'Basic & Algebra': [
    { label: '+', latex: '+' },
    { label: '−', latex: '-' },
    { label: '×', latex: '\\times ' },
    { label: '÷', latex: '\\div ' },
    { label: '=', latex: '=' },
    { label: '≠', latex: '\\neq ' },
    { label: '±', latex: '\\pm ' },
    { label: '≤', latex: '\\le ' },
    { label: '≥', latex: '\\ge ' },
    { label: '( )', latex: '\\left(  \\right)' },
    { label: '|x|', latex: '\\left| x \\right|' },
    { label: '≈', latex: '\\approx ' },
  ],
  'Fractions, Powers & Roots': [
    { label: 'a/b', latex: '\\frac{a}{b}' },
    { label: 'x²', latex: 'x^{2}' },
    { label: 'xⁿ', latex: 'x^{n}' },
    { label: 'xₙ', latex: 'x_{n}' },
    { label: '√x', latex: '\\sqrt{x}' },
    { label: 'ⁿ√x', latex: '\\sqrt[n]{x}' },
    { label: '10ⁿ', latex: '\\times 10^{n}' },
    { label: 'eˣ', latex: 'e^{x}' },
    { label: 'ln(x)', latex: '\\ln(x)' },
    { label: 'log₁₀', latex: '\\log_{10}(x)' },
  ],
  'Calculus & Series': [
    { label: 'd/dx', latex: '\\frac{d}{dx}' },
    { label: '∂/∂x', latex: '\\frac{\\partial}{\\partial x}' },
    { label: '∫', latex: '\\int ' },
    { label: '∫ₐᵇ', latex: '\\int_{0}^{3} x^{2} \\, dx' },
    { label: '∮', latex: '\\oint ' },
    { label: 'lim', latex: '\\lim_{x \\to 0} ' },
    { label: '∑', latex: '\\sum_{i=1}^{5} i' },
    { label: '∏', latex: '\\prod_{i=1}^{n} ' },
    { label: '∞', latex: '\\infty' },
  ],
  'Matrices & Vectors': [
    { label: '2×2 Mat', latex: '\\begin{pmatrix} 2 & 1 \\\\ 3 & 4 \\end{pmatrix}' },
    { label: '3×3 Mat', latex: '\\begin{pmatrix} 1 & 0 & 2 \\\\ 0 & 3 & 1 \\\\ 2 & 1 & 4 \\end{pmatrix}' },
    { label: 'det(A)', latex: '\\det(A) = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}' },
    { label: 'v⃗', latex: '\\vec{v}' },
    { label: 'î', latex: '\\hat{i}' },
    { label: 'ĵ', latex: '\\hat{j}' },
    { label: 'k̂', latex: '\\hat{k}' },
    { label: '·', latex: '\\cdot ' },
    { label: '∇', latex: '\\nabla ' },
  ],
  'Greek Letters': [
    { label: 'α', latex: '\\alpha ' },
    { label: 'β', latex: '\\beta ' },
    { label: 'γ', latex: '\\gamma ' },
    { label: 'δ', latex: '\\delta ' },
    { label: 'ε', latex: '\\varepsilon ' },
    { label: 'θ', latex: '\\theta ' },
    { label: 'λ', latex: '\\lambda ' },
    { label: 'μ', latex: '\\mu ' },
    { label: 'π', latex: '\\pi ' },
    { label: 'ρ', latex: '\\rho ' },
    { label: 'σ', latex: '\\sigma ' },
    { label: 'φ', latex: '\\phi ' },
    { label: 'ω', latex: '\\omega ' },
    { label: 'Δ', latex: '\\Delta ' },
    { label: 'Σ', latex: '\\Sigma ' },
    { label: 'Ω', latex: '\\Omega ' },
  ],
  'Trig, Sets & Logic': [
    { label: 'sin', latex: '\\sin(\\theta)' },
    { label: 'cos', latex: '\\cos(\\theta)' },
    { label: 'tan', latex: '\\tan(\\theta)' },
    { label: '∈', latex: '\\in ' },
    { label: '∉', latex: '\\notin ' },
    { label: '⊂', latex: '\\subset ' },
    { label: '∪', latex: '\\cup ' },
    { label: '∩', latex: '\\cap ' },
    { label: '∀', latex: '\\forall ' },
    { label: '∃', latex: '\\exists ' },
    { label: '⇒', latex: '\\Rightarrow ' },
    { label: '⇔', latex: '\\iff ' },
  ],
};

const QUICK_TEMPLATES = [
  { label: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { label: 'Definite Integral', latex: '\\int_{0}^{3} x^{2} \\, dx' },
  { label: '2×2 Matrix', latex: '\\begin{pmatrix} 5 & 2 \\\\ 1 & 3 \\end{pmatrix}' },
  { label: 'Summation', latex: '\\sum_{i=1}^{10} i^{2}' },
  { label: 'Kinetic & Potential', latex: 'E = \\frac{1}{2}mv^{2} + mgh' },
];

interface Props {
  onOpenInGemini?: (prompt: string) => void;
}

export const EquationEditorView: React.FC<Props> = ({ onOpenInGemini }) => {
  const [latex, setLatex] = useState<string>('\\int_{0}^{3} x^{2} \\, dx');
  const [activeGroup, setActiveGroup] = useState<string>('Basic & Algebra');
  const [copied, setCopied] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<{
    ok: boolean;
    value?: string;
    latex?: string;
    steps?: string[];
    msg?: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertToken = (token: string) => {
    const el = textareaRef.current;
    if (!el) {
      setLatex((prev) => prev + token);
      return;
    }
    const start = el.selectionStart ?? latex.length;
    const end = el.selectionEnd ?? latex.length;
    const next = latex.slice(0, start) + token + latex.slice(end);
    setLatex(next);
    setTimeout(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleBackspace = () => {
    const el = textareaRef.current;
    if (!el) {
      setLatex((prev) => prev.slice(0, -1));
      return;
    }
    const start = el.selectionStart ?? latex.length;
    const end = el.selectionEnd ?? latex.length;
    if (start !== end) {
      setLatex(latex.slice(0, start) + latex.slice(end));
    } else if (start > 0) {
      setLatex(latex.slice(0, start - 1) + latex.slice(end));
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start - 1, start - 1);
      }, 0);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleEvaluate = () => {
    const res = computeDeterministically(latex, 'deg');
    if (res.computed) {
      setEvalResult({
        ok: true,
        value: res.valueText,
        latex: res.latex,
        steps: res.steps,
      });
    } else {
      setEvalResult({
        ok: false,
        msg: 'Expression contains free symbolic variables or calculus forms beyond direct scalar evaluation. Click "Solve in AI Solver" for full symbolic working.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Mathematical Equation Editor
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
              Compose fractions, roots, matrices, integrals, summations, and Greek notation with live KaTeX preview and computation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#27272A] text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#18181B]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied LaTeX' : 'Copy LaTeX'}</span>
            </button>
            <button
              type="button"
              onClick={handleEvaluate}
              className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Evaluate</span>
            </button>
          </div>
        </div>

        {/* Live Rendered Math Display */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-5 min-h-[96px] flex items-center justify-center overflow-x-auto">
          {latex.trim() ? (
            <MathRenderer content={`$$${latex.replace(/^\$\$|\$\$$/g, '')}$$`} />
          ) : (
            <span className="text-xs text-slate-400">Your formatted equation renders live here...</span>
          )}
        </div>

        {/* LaTeX Editor Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 dark:text-[#A1A1AA]">LaTeX Source</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackspace}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#27272A] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Delete className="w-3.5 h-3.5" />
                <span>Backspace</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLatex('');
                  setEvalResult(null);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#27272A] text-xs font-semibold text-rose-500 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            rows={2}
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="Use buttons below or type LaTeX directly..."
            className="w-full rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3.5 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          />
        </div>

        {/* Keyboard Palette Tabs */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(SYMBOL_TABS).map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setActiveGroup(grp)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  activeGroup === grp
                    ? 'bg-[#22C55E] text-white'
                    : 'bg-slate-100 dark:bg-[#18181B] text-slate-600 dark:text-zinc-300'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {SYMBOL_TABS[activeGroup].map((sym) => (
              <button
                key={sym.label}
                type="button"
                onClick={() => insertToken(sym.latex)}
                className="py-2.5 px-2 rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#141418] hover:border-[#22C55E] hover:text-[#22C55E] text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white cursor-pointer transition-colors"
              >
                {sym.label}
              </button>
            ))}
          </div>
        </div>

        {/* Starter Templates */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#27272A] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Templates:</span>
            {QUICK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => {
                  setLatex(tpl.latex);
                  setEvalResult(null);
                }}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                {tpl.label}
              </button>
            ))}
          </div>

          {onOpenInGemini && (
            <button
              type="button"
              onClick={() => onOpenInGemini(`Solve / simplify: ${latex}`)}
              disabled={!latex.trim()}
              className="px-4 py-2 rounded-xl border border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E]/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Solve in AI Solver</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>

      {evalResult && (
        <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-3">
          {evalResult.ok ? (
            <>
              <div className="text-xs font-bold text-[#22C55E]">Deterministic Computation Result</div>
              <div className="rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/40 p-4 overflow-x-auto">
                <MathRenderer content={`$$${evalResult.latex || evalResult.value}$$`} />
              </div>
              {evalResult.steps && evalResult.steps.length > 0 && (
                <ol className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
                  {evalResult.steps.map((s, idx) => (
                    <li key={idx}>
                      <MathRenderer content={s} />
                    </li>
                  ))}
                </ol>
              )}
            </>
          ) : (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300">{evalResult.msg}</p>
          )}
        </section>
      )}
    </div>
  );
};
