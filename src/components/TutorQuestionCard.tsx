import React, { useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { checkStudentAnswer } from '../services/tutorProgressService';

export interface UnifiedTutorQuestion {
  id: string;
  question: string;
  difficulty: string;
  skillType?: string;
  sourceLabel?: string; // e.g., "Verified Curated Past Question · JAMB 2023" or "AI-Generated Practice"
  isVerifiedPast?: boolean;
  verifiedDeterministically?: boolean;
  options?: { A: string; B: string; C: string; D: string };
  correctOption?: string;
  hint?: string;
  formulaUsed?: string;
  whyThisFormula?: string;
  steps: string[];
  finalAnswer: string;
  expectedNumericValue?: number;
  unit?: string;
  markingPoints?: string[];
}

interface TutorQuestionCardProps {
  q: UnifiedTutorQuestion;
  indexNumber: number;
  isDark: boolean;
  onAttemptRecorded?: (q: UnifiedTutorQuestion, isCorrect: boolean) => void;
}

export const TutorQuestionCard: React.FC<TutorQuestionCardProps> = ({
  q,
  indexNumber,
  isDark,
  onAttemptRecorded,
}) => {
  const [studentInput, setStudentInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [checkResult, setCheckResult] = useState<{
    checked: boolean;
    isCorrect: boolean;
    feedback: string;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const handleCheck = () => {
    const attempt = q.options ? selectedOption : studentInput;
    const result = checkStudentAnswer({
      studentInput: attempt,
      expectedNumericValue: q.expectedNumericValue,
      finalAnswerText: q.finalAnswer,
      correctOption: q.correctOption,
      unit: q.unit,
    });
    setCheckResult(result);
    if (result.checked && onAttemptRecorded) {
      onAttemptRecorded(q, result.isCorrect);
    }
  };

  const handleResetAttempt = () => {
    setStudentInput('');
    setSelectedOption('');
    setCheckResult(null);
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 transition-all ${
        isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50/80 border-slate-200'
      }`}
    >
      {/* Clean Typographic Metadata Header (no static pill clutter) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 border-zinc-700/20 text-xs">
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          <span className="text-[#22C55E] font-bold">Question {indexNumber}</span>
          <span aria-hidden="true" className="text-zinc-500">·</span>
          <span
            className={
              q.difficulty.includes('Difficult') || q.difficulty.includes('Hard')
                ? 'text-rose-500'
                : q.difficulty.includes('Exam')
                ? 'text-amber-500'
                : q.difficulty.includes('Easy')
                ? 'text-emerald-500'
                : 'text-sky-500'
            }
          >
            {q.difficulty}
          </span>
          {q.skillType && (
            <>
              <span aria-hidden="true" className="text-zinc-500">·</span>
              <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>{q.skillType}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          {q.sourceLabel && (
            <span
              className={`font-semibold ${
                q.isVerifiedPast ? 'text-emerald-500' : isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}
            >
              {q.sourceLabel}
            </span>
          )}
          {q.verifiedDeterministically && (
            <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold" title="Numerically checked by SmartSolve deterministic solver">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Math
            </span>
          )}
        </div>
      </div>

      {/* Question Prompt */}
      <div className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
        <MathRenderer content={q.question} />
      </div>

      {/* Attempt Section: MCQ Options or Open Input */}
      {q.options ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(['A', 'B', 'C', 'D'] as const).map((letter) => {
            const optText = q.options?.[letter];
            if (!optText) return null;
            const isSelected = selectedOption === letter;
            const isCorrectLetter =
              checkResult?.checked && q.correctOption?.toUpperCase() === letter;
            const isWrongPicked =
              checkResult?.checked && isSelected && !checkResult.isCorrect;

            return (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedOption(letter)}
                className={`px-3 py-2 rounded-xl border text-left text-xs sm:text-sm flex items-start gap-2 transition-all cursor-pointer ${
                  isCorrectLetter
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                    : isWrongPicked
                    ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                    : isSelected
                    ? 'border-[#22C55E] bg-[#22C55E]/15 text-[#22C55E]'
                    : isDark
                    ? 'border-[#27272A] bg-[#0B0B0E] text-zinc-200 hover:border-zinc-500'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-400'
                }`}
              >
                <span className="font-bold shrink-0">{letter}.</span>
                <span className="flex-1 min-w-0">
                  <MathRenderer content={optText} />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={studentInput}
            onChange={(e) => setStudentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCheck();
              }
            }}
            placeholder={
              q.unit
                ? `Try solving first — enter your answer (in ${q.unit})...`
                : 'Try solving first — type your answer...'
            }
            className={`flex-1 px-3.5 py-2 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
              isDark
                ? 'bg-[#09090B] text-white border-[#27272A] focus:border-[#22C55E]'
                : 'bg-white text-slate-900 border-slate-300 focus:border-emerald-600'
            }`}
          />
        </div>
      )}

      {/* Interactive Solver Controls Row */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={handleCheck}
          disabled={q.options ? !selectedOption : !studentInput.trim()}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            (q.options ? !selectedOption : !studentInput.trim())
              ? 'bg-zinc-700/40 text-zinc-500 cursor-not-allowed'
              : 'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-sm'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Check Answer</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSolution((v) => !v)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
            showSolution
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : isDark
              ? 'bg-[#1C1C22] hover:bg-[#27272A] text-zinc-200 border-[#27272A]'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>{showSolution ? 'Hide Solve' : 'Solve'}</span>
          {showSolution ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {q.hint && (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              showHint
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/35'
                : isDark
                ? 'bg-[#18181D] text-zinc-300 hover:text-white border-[#27272A]'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
          </button>
        )}

        {q.formulaUsed && (
          <button
            type="button"
            onClick={() => setShowFormula((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              showFormula
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/35'
                : isDark
                ? 'bg-[#18181D] text-zinc-300 hover:text-white border-[#27272A]'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-sky-400" />
            <span>{showFormula ? 'Hide Formula' : 'Show Formula'}</span>
          </button>
        )}

        {checkResult?.checked && (
          <button
            type="button"
            onClick={handleResetAttempt}
            className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Clear attempt and try again"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Attempt Check Feedback */}
      {checkResult?.checked && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
            checkResult.isCorrect
              ? isDark
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : isDark
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {checkResult.isCorrect ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          )}
          <span>{checkResult.feedback}</span>
        </div>
      )}

      {/* Revealed Hint */}
      {showHint && q.hint && (
        <div
          className={`p-3 rounded-xl border text-xs ${
            isDark
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-200'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <strong className="font-bold">Hint: </strong>
          <MathRenderer content={q.hint} />
        </div>
      )}

      {/* Revealed Formula */}
      {showFormula && q.formulaUsed && (
        <div
          className={`p-3 rounded-xl border text-xs space-y-1 ${
            isDark
              ? 'bg-sky-500/10 border-sky-500/25 text-sky-200'
              : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          <strong className="font-bold block">Governing Formula:</strong>
          <MathRenderer content={q.formulaUsed} displayMode={false} />
        </div>
      )}

      {/* Full Step-by-Step Solve Drawer */}
      {showSolution && (
        <div
          className={`rounded-xl p-4 border space-y-3 ${
            isDark ? 'bg-black/50 border-emerald-500/30' : 'bg-emerald-50/40 border-emerald-200'
          }`}
        >
          {q.whyThisFormula && (
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-sky-500 uppercase tracking-wide flex items-center gap-1 mb-0.5">
                <HelpCircle className="w-3.5 h-3.5" /> Why This Formula Was Selected
              </span>
              <MathRenderer content={q.whyThisFormula} />
            </div>
          )}

          {q.steps && q.steps.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#22C55E] uppercase tracking-wider block">
                Step-by-Step Solution
              </span>
              {q.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`text-xs sm:text-sm p-2 rounded-lg ${
                    isDark ? 'bg-white/[0.03] text-zinc-200' : 'bg-white text-slate-800'
                  }`}
                >
                  <MathRenderer content={step} />
                </div>
              ))}
            </div>
          )}

          {q.markingPoints && q.markingPoints.length > 0 && (
            <div className="space-y-1 text-xs">
              <span className="font-bold text-amber-500 uppercase tracking-wider block">
                Examiner Marking Points
              </span>
              <ul className="list-disc list-inside space-y-0.5">
                {q.markingPoints.map((mp, idx) => (
                  <li key={idx}>{mp}</li>
                ))}
              </ul>
            </div>
          )}

          <div
            className={`p-3 rounded-lg border text-center font-bold text-xs sm:text-sm ${
              isDark
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-100 border-emerald-400 text-emerald-900'
            }`}
          >
            <span className="text-[11px] block text-[#22C55E] uppercase tracking-wider mb-1">
              Final Answer {q.unit ? `(${q.unit})` : ''}
            </span>
            <MathRenderer content={q.finalAnswer} />
          </div>
        </div>
      )}
    </div>
  );
};
