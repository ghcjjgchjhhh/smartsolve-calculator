import React, { useState } from 'react';
import { StepSolution } from '../types';
import { saveToHistory } from '../services/historyStorage';
import { Check, Copy, Bookmark, BookmarkCheck, BookOpen } from 'lucide-react';
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
[SmartSolve Solution: ${solution.title}]
Problem: ${solution.problemStatement || ''}
Formula: ${solution.formula}
${solution.rearrangedFormula ? `Rearranged: ${solution.rearrangedFormula}\n` : ''}Substitution: ${solution.substitution}
Steps:
${solution.steps.map((s, idx) => ` ${idx + 1}. ${s}`).join('\n')}
Answer: ${solution.finalAnswer} ${solution.unit || ''}
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

  // Prepare boxed answer LaTeX
  const formatBoxedAnswer = () => {
    let ans = solution.finalAnswer.trim();
    if (solution.unit && !ans.includes(solution.unit)) {
      ans = `${ans}\\text{ ${solution.unit}}`;
    }
    // If not already boxed, wrap in \boxed{...}
    if (!ans.includes('\\boxed')) {
      // Check if it's purely text (like "No real value of x")
      if (/^[a-zA-Z\s]+$/.test(ans)) {
        return `\\boxed{\\text{${ans}}}`;
      }
      return `\\boxed{${ans}}`;
    }
    return ans;
  };

  return (
    <div className="bg-[#000000] border border-[#27272A] rounded-3xl shadow-2xl overflow-hidden transition-all text-[#FFFFFF]">
      {/* Top Bar */}
      <div className="bg-[#0A0A0A] px-5 py-4 flex items-center justify-between border-b border-[#27272A]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#22C55E]/15 border border-[#22C55E]/30 rounded-xl">
            <BookOpen className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#22C55E]">
                {solution.category}
              </span>
              {solution.subCategory && (
                <span className="text-xs text-[#A1A1AA]">· {solution.subCategory}</span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#FFFFFF] mt-0.5">{solution.title}</h3>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={copySolutionText}
            title="Copy full solution"
            className="p-2 hover:bg-[#18181B] rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSave}
            title="Save to history"
            className="p-2 hover:bg-[#18181B] rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            {saved ? <BookmarkCheck className="w-4 h-4 text-[#22C55E]" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Solution Flow - Textbook & Screenshot Quality */}
      <div className="p-6 sm:p-8 space-y-5 bg-[#000000]">
        {/* Problem Statement / Given Question */}
        {solution.problemStatement && (
          <div className="pb-3 border-b border-[#27272A]/70">
            <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              Problem:
            </span>
            <div className="text-sm sm:text-base text-[#FFFFFF] leading-relaxed">
              <MathRenderer content={solution.problemStatement} />
            </div>
          </div>
        )}

        {/* Governing Formula / Law (if present) */}
        {solution.formula && (
          <div className="py-1">
            <span className="text-xs font-semibold text-[#A1A1AA] block mb-1">
              Formula used:
            </span>
            <div className="text-base sm:text-lg py-1">
              <MathRenderer content={solution.formula} displayMode={true} />
            </div>
          </div>
        )}

        {/* Step-by-Step Derivation Flow - Exactly like screenshot */}
        <div className="space-y-4 pt-1">
          {solution.steps && solution.steps.length > 0 ? (
            solution.steps.map((step, idx) => {
              // Check if step looks like a label/heading e.g. "Squaring:", "Square again:"
              const isLabel = /^[A-Za-z\s]+:$/.test(step.trim());
              const isShortText = step.trim().endsWith(':');

              return (
                <div key={idx} className="space-y-1.5">
                  {isLabel || isShortText ? (
                    <div className="text-sm sm:text-base font-semibold text-[#A1A1AA] pt-2">
                      <MathRenderer content={step} />
                    </div>
                  ) : (
                    <div className="text-sm sm:text-base text-[#FFFFFF] leading-relaxed py-0.5">
                      <MathRenderer content={step} />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Fallback to substitution if steps array is empty
            solution.substitution && (
              <div className="py-2">
                <MathRenderer content={solution.substitution} displayMode={true} />
              </div>
            )
          )}
        </div>

        {/* Boxed Final Answer (Prominently Centered with Crisp White Border Box) */}
        <div className="pt-6 pb-2 text-center">
          <div className="inline-block py-2">
            <MathRenderer content={formatBoxedAnswer()} displayMode={true} />
          </div>
        </div>

        {/* Conceptual Explanation & Tip (Clean Bottom Accordion) */}
        {(solution.explanation || solution.tips) && (
          <div className="mt-6 pt-4 border-t border-[#27272A] space-y-2.5 text-xs text-[#A1A1AA]">
            {solution.explanation && (
              <p className="leading-relaxed">
                <span className="font-bold text-[#22C55E]">Note: </span>
                {solution.explanation}
              </p>
            )}
            {solution.tips && (
              <p className="leading-relaxed">
                <span className="font-bold text-[#FFFFFF]">Exam Tip: </span>
                {solution.tips}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
