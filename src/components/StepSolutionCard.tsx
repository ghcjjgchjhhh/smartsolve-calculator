import React, { useState } from 'react';
import { StepSolution } from '../types';
import { saveToHistory } from '../services/historyStorage';
import { Check, Copy, Bookmark, BookmarkCheck, BookOpen, Layers } from 'lucide-react';

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

  return (
    <div className="bg-[#181B22] border border-[#252A34] rounded-3xl shadow-2xl shadow-black/60 overflow-hidden transition-all">
      {/* Header */}
      <div className="bg-[#13161D] px-5 py-4 text-[#FFFFFF] flex items-center justify-between border-b border-[#252A34]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#3B82F6]/15 border border-[#3B82F6]/30 rounded-xl">
            <BookOpen className="w-5 h-5 text-[#3B82F6]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                {solution.category}
              </span>
              {solution.subCategory && (
                <span className="text-xs text-[#A1A1AA]">· {solution.subCategory}</span>
              )}
            </div>
            <h3 className="text-lg font-bold text-[#FFFFFF] mt-0.5">{solution.title}</h3>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={copySolutionText}
            title="Copy full solution"
            className="p-2 hover:bg-[#252A34] rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSave}
            title="Save to history"
            className="p-2 hover:bg-[#252A34] rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors"
          >
            {saved ? <BookmarkCheck className="w-4 h-4 text-[#22C55E]" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Problem Statement if available */}
        {solution.problemStatement && (
          <div className="p-3 bg-[#0F1115] rounded-xl border border-[#252A34]">
            <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block mb-1">
              Input Expression
            </span>
            <div className="font-mono font-medium text-[#FFFFFF] math-display">
              {solution.problemStatement}
            </div>
          </div>
        )}

        {/* Formula Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 bg-[#0F1115] rounded-xl border border-[#252A34]">
            <span className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider block mb-1">
              Evaluation Rule
            </span>
            <div className="text-base font-bold text-[#FFFFFF] math-display">
              {solution.formula}
            </div>
          </div>

          {solution.rearrangedFormula && (
            <div className="p-3.5 bg-[#0F1115] rounded-xl border border-[#252A34]">
              <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider block mb-1">
                Rearranged For Target
              </span>
              <div className="text-base font-bold text-[#FFFFFF] math-display">
                {solution.rearrangedFormula}
              </div>
            </div>
          )}
        </div>

        {/* Substitution */}
        {solution.substitution && (
          <div className="p-3.5 bg-[#0F1115] rounded-xl border border-[#252A34]">
            <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block mb-1">
              Value Substitution
            </span>
            <div className="font-mono text-sm text-[#FFFFFF] break-words">
              {solution.substitution}
            </div>
          </div>
        )}

        {/* Given Values Grid if available */}
        {solution.givenValues && solution.givenValues.length > 0 && (
          <div>
            <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block mb-2">
              Given Quantities Extracted
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {solution.givenValues.map((g, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-[#0F1115] border border-[#252A34]">
                  <div className="text-[11px] text-[#A1A1AA] truncate">{g.name}</div>
                  <div className="text-xs font-mono font-bold text-[#FFFFFF] mt-0.5">
                    {g.symbol} = {g.value} {g.unit || ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Working Steps */}
        {solution.steps && solution.steps.length > 0 && (
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Step-by-Step Working</span>
            </div>
            <div className="space-y-2">
              {solution.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-3 rounded-xl bg-[#0F1115] border border-[#252A34] text-sm"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[#252A34] text-[#FFFFFF] font-bold flex items-center justify-center text-xs border border-white/5">
                    {idx + 1}
                  </span>
                  <div className="text-[#A1A1AA] font-mono text-xs sm:text-sm pt-0.5 leading-relaxed break-words flex-1">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Highlighted Final Answer */}
        <div className="p-4 bg-[#0F1115] rounded-2xl border border-[#22C55E]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm shadow-emerald-500/10">
          <div>
            <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider block">
              Final Answer
            </span>
            <div className="text-2xl font-black text-[#FFFFFF] math-display mt-0.5">
              {solution.finalAnswer} {solution.unit ? <span className="text-lg font-bold text-[#22C55E]">{solution.unit}</span> : ''}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-[#FFFFFF] bg-[#22C55E]/20 px-3 py-1.5 rounded-lg border border-[#22C55E]/40 w-fit">
            <Check className="w-4 h-4 text-[#22C55E]" />
            <span>Verified Computation</span>
          </div>
        </div>

        {/* Explanation if available */}
        {solution.explanation && (
          <div className="p-3.5 rounded-xl bg-[#0F1115] border border-[#252A34] text-xs">
            <span className="font-bold text-[#3B82F6] uppercase tracking-wider block mb-1">
              Physical & Mathematical Principle
            </span>
            <p className="text-[#A1A1AA] leading-relaxed">
              {solution.explanation}
            </p>
          </div>
        )}

        {/* Pro Tip / Common Pitfall if available */}
        {solution.tips && (
          <div className="p-3.5 rounded-xl bg-[#0F1115] border border-[#3B82F6]/30 text-xs flex items-start space-x-2">
            <div>
              <span className="font-bold text-[#FFFFFF] block mb-0.5">
                Pro Tip & Exam Advice
              </span>
              <p className="text-[#A1A1AA] leading-relaxed">
                {solution.tips}
              </p>
            </div>
          </div>
        )}

        {solution.notes && (
          <p className="text-xs text-[#A1A1AA] italic">
            Note: {solution.notes}
          </p>
        )}
      </div>
    </div>
  );
};
