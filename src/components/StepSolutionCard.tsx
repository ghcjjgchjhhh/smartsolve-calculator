import React, { useState } from 'react';
import { StepSolution } from '../types';
import { saveToHistory } from '../services/historyStorage';
import { Check, Copy, Bookmark, BookmarkCheck } from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface Props {
  solution: StepSolution;
  onClose?: () => void;
}

export const StepSolutionCard: React.FC<Props> = ({ solution }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const copySolutionText = () => {
    const text = `
${solution.problemStatement ? `${solution.problemStatement}\n\n` : ''}${solution.steps.join('\n\n')}

Answer: ${solution.finalAnswer}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveToHistory(solution);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Prepare clean boxed answer LaTeX matching Screenshot 1
  const formatBoxedAnswer = () => {
    let ans = solution.finalAnswer.trim();

    // Remove trailing dot
    if (ans.endsWith('.')) {
      ans = ans.slice(0, -1).trim();
    }

    // Ignore 'None', 'none', 'N/A' units
    if (
      solution.unit &&
      solution.unit.toLowerCase() !== 'none' &&
      solution.unit.toLowerCase() !== 'n/a' &&
      !ans.includes(solution.unit)
    ) {
      ans = `${ans}\\text{ ${solution.unit}}`;
    }

    // If not already wrapped in \boxed{...}
    if (!ans.includes('\\boxed')) {
      // Check if it's purely text (e.g. "No real value of x" or "No real solution")
      if (/^[a-zA-Z\s]+$/.test(ans)) {
        return `\\boxed{\\text{${ans}}}`;
      }
      return `\\boxed{${ans}}`;
    }
    return ans;
  };

  // Parse each step into clean text label, display equation, or explanation matching Screenshot 1
  const renderCleanStep = (rawStep: string, idx: number) => {
    let s = rawStep.trim();

    // Strip "Step 1:", "Step 2:", "1.", "2." prefixes
    s = s.replace(/^(?:Step\s*\d+[:.]?|\d+[\).])\s*/i, '').trim();

    // 1. Check if it's a short transition label (e.g. "Squaring:", "Square again:")
    if (/^[A-Za-z\s]+:$/.test(s)) {
      return (
        <div key={idx} className="text-sm sm:text-base font-normal text-[#E4E4E7] pt-2">
          {s}
        </div>
      );
    }

    // 2. Check if it's description followed by an equation (e.g. "Description text: 6 / 2 * 3 = 9")
    const colonSplit = s.match(/^([^:=]+):\s*([^:]+)$/);
    if (colonSplit && /[=+\-*/^_\\]/.test(colonSplit[2])) {
      const desc = colonSplit[1].trim();
      const eq = colonSplit[2].trim();
      return (
        <div key={idx} className="space-y-2 pt-1">
          <div className="text-sm sm:text-base font-normal text-[#E4E4E7]">
            {desc}:
          </div>
          <div className="py-1 text-center formula-scroll-container">
            <MathRenderer content={eq} displayMode={true} />
          </div>
        </div>
      );
    }

    // 3. Pure equation check
    const isPureEquation =
      s.startsWith('$$') ||
      s.startsWith('\\') ||
      (!s.includes(' ') && /[=]/.test(s)) ||
      (/^[a-zA-Z0-9\s+\-*/^_.=()\\[\]{}]+$/.test(s) &&
        /[=]/.test(s) &&
        !/\b(the|is|and|or|for|to|of|in|at|from|with|by|let|since|therefore|first|finally|substitute)\b/i.test(
          s
        ));

    if (isPureEquation) {
      return (
        <div key={idx} className="py-1 text-center formula-scroll-container">
          <MathRenderer content={s} displayMode={true} />
        </div>
      );
    }

    // 4. Natural text explanation (may contain inline math like "Since the left side is nonnegative, $x \ge 1$.")
    return (
      <div key={idx} className="text-sm sm:text-base font-normal text-[#E4E4E7] leading-relaxed py-1 break-words">
        <MathRenderer content={s} />
      </div>
    );
  };

  return (
    <div className="bg-[#000000] border border-[#27272A] rounded-3xl p-6 sm:p-8 shadow-2xl relative transition-all text-[#FFFFFF] max-w-full overflow-hidden">
      {/* Discreet Action Toolbar in Top Right */}
      <div className="flex items-center justify-between pb-4 border-b border-[#27272A]/60 mb-6">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
          <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">
            {solution.category || 'Mathematics'} {solution.subCategory ? `· ${solution.subCategory}` : ''}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={copySolutionText}
            title="Copy full solution"
            className="p-1.5 hover:bg-[#18181B] rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSave}
            title="Save to history"
            className="p-1.5 hover:bg-[#18181B] rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            {saved ? <BookmarkCheck className="w-4 h-4 text-[#22C55E]" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Clean Mathematical Solution Flow Matching Screenshot 1 */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Given Problem Expression (Centered Display) */}
        {solution.problemStatement && (
          <div className="pb-3 text-center formula-scroll-container">
            <MathRenderer content={solution.problemStatement} displayMode={true} />
          </div>
        )}

        {/* Given values & Required summary if structured */}
        {(solution.givenValues && solution.givenValues.length > 0) && (
          <div className="p-3.5 rounded-xl bg-[#0A0A0A] border border-[#27272A] space-y-1.5 text-xs text-[#A1A1AA]">
            <span className="font-bold text-[#FFFFFF] uppercase tracking-wider block text-[11px]">
              Given Values:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {solution.givenValues.map((gv, i) => (
                <div key={i} className="flex items-center justify-between bg-[#121212] px-2.5 py-1.5 rounded-lg border border-[#27272A]/50">
                  <span className="text-[#A1A1AA]">{gv.name} ({gv.symbol}):</span>
                  <span className="font-mono text-[#FFFFFF] font-bold">{gv.value} {gv.unit || ''}</span>
                </div>
              ))}
            </div>
            {solution.whatIsRequired && (
              <div className="pt-1 text-[#22C55E] flex items-center space-x-1.5">
                <span className="font-bold text-[#A1A1AA]">Required:</span>
                <span className="font-semibold">{solution.whatIsRequired}</span>
              </div>
            )}
          </div>
        )}

        {/* Steps: Clear, unboxed mathematical derivation flow */}
        {solution.steps && solution.steps.length > 0 ? (
          solution.steps.map((step, idx) => renderCleanStep(step, idx))
        ) : (
          solution.substitution && (
            <div className="py-2 text-center formula-scroll-container">
              <MathRenderer content={solution.substitution} displayMode={true} />
            </div>
          )
        )}

        {/* Boxed Final Answer Exactly Like Screenshot 1 */}
        <div className="pt-6 pb-2 text-center formula-scroll-container">
          <div className="inline-block py-2 max-w-full">
            <MathRenderer content={formatBoxedAnswer()} displayMode={true} />
          </div>
        </div>

        {/* Optional Conceptual Note / Exam Tip at bottom */}
        {(solution.explanation || solution.tips) && (
          <div className="mt-8 pt-4 border-t border-[#27272A]/60 space-y-2 text-xs text-[#A1A1AA]">
            {solution.explanation && (
              <p className="leading-relaxed">
                <span className="font-semibold text-[#FFFFFF]">Note: </span>
                {solution.explanation}
              </p>
            )}
            {solution.tips && (
              <p className="leading-relaxed">
                <span className="font-semibold text-[#22C55E]">Tip: </span>
                {solution.tips}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
