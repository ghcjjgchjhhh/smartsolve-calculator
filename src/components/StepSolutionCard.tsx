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
    <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="bg-zinc-900 dark:bg-zinc-950 px-5 py-4 text-white flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl">
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {solution.category}
              </span>
              {solution.subCategory && (
                <span className="text-xs text-zinc-400">· {solution.subCategory}</span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">{solution.title}</h3>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={copySolutionText}
            title="Copy full solution"
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-emerald-400 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSave}
            title="Save to history"
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-emerald-400 transition-colors"
          >
            {saved ? <BookmarkCheck className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Problem Statement if available */}
        {solution.problemStatement && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-1">
              Problem / Given
            </span>
            <div className="font-medium text-zinc-800 dark:text-zinc-200 math-display">
              {solution.problemStatement}
            </div>
          </div>
        )}

        {/* Formula Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 bg-emerald-500/10 dark:bg-zinc-900/80 rounded-xl border border-emerald-500/30 dark:border-zinc-800">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
              Primary Formula
            </span>
            <div className="text-base font-bold text-zinc-900 dark:text-emerald-300 math-display">
              {solution.formula}
            </div>
          </div>

          {solution.rearrangedFormula && (
            <div className="p-3.5 bg-zinc-100 dark:bg-zinc-900/80 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider block mb-1">
                Rearranged For Target
              </span>
              <div className="text-base font-bold text-zinc-900 dark:text-amber-300 math-display">
                {solution.rearrangedFormula}
              </div>
            </div>
          )}
        </div>

        {/* Substitution */}
        {solution.substitution && (
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-1">
              Value Substitution
            </span>
            <div className="font-mono text-sm text-zinc-800 dark:text-zinc-300 break-words">
              {solution.substitution}
            </div>
          </div>
        )}

        {/* Working Steps */}
        {solution.steps && solution.steps.length > 0 && (
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>Step-by-Step Working</span>
            </div>
            <div className="space-y-2">
              {solution.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-2.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 text-sm"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-black font-black flex items-center justify-center text-xs">
                    {idx + 1}
                  </span>
                  <div className="text-zinc-700 dark:text-zinc-300 font-mono text-xs sm:text-sm pt-0.5 leading-relaxed break-words flex-1">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Highlighted Final Answer */}
        <div className="p-4 bg-emerald-500/10 dark:bg-zinc-900 rounded-xl border-2 border-emerald-500/40 dark:border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Final Answer
            </span>
            <div className="text-2xl font-black text-zinc-950 dark:text-white math-display mt-0.5">
              {solution.finalAnswer} {solution.unit ? <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{solution.unit}</span> : ''}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 dark:bg-black/60 px-3 py-1.5 rounded-lg border border-emerald-500/30 w-fit">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>Verified Computation</span>
          </div>
        </div>

        {solution.notes && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
            Note: {solution.notes}
          </p>
        )}
      </div>
    </div>
  );
};
