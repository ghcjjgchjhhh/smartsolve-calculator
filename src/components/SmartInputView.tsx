import React, { useState } from 'react';
import { parseSmartInput } from '../services/smartInputParser';
import { StepSolutionCard } from './StepSolutionCard';
import { StepSolution } from '../types';
import { saveToHistory } from '../services/historyStorage';
import { Sparkles, MessageSquareCode, ArrowRight, CornerDownLeft, Info } from 'lucide-react';

export const SmartInputView: React.FC = () => {
  const [inputQuery, setInputQuery] = useState<string>('find acceleration when v=20, u=5 and t=3');
  const [solution, setSolution] = useState<StepSolution | null>(() => {
    try {
      return parseSmartInput('find acceleration when v=20, u=5 and t=3');
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);

  const samplePrompts = [
    'solve 2x + 7 = 19',
    'find acceleration when v=20, u=5 and t=3',
    'calculate kinetic energy of a 5 kg object moving at 10 m/s',
    'find speed if distance is 120m and time is 10s',
    'calculate force for mass 15kg acceleration 2m/s^2',
    'what is the power when work is 500J and time is 25s',
    'mean of 12, 15, 20, 25, 28',
    'convert 100 km/h to m/s',
    'solve x^2 + 5x + 6 = 0',
  ];

  const handleExecute = (queryToRun?: string) => {
    const q = queryToRun || inputQuery;
    setError(null);
    try {
      const res = parseSmartInput(q);
      setSolution(res);
      saveToHistory(res);
    } catch (err: any) {
      setError(err.message || 'Could not parse request.');
    }
  };

  const handleSelectSample = (sample: string) => {
    setInputQuery(sample);
    handleExecute(sample);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Intro */}
      <div className="bg-[#181B22] border border-[#252A34] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] font-bold text-xs uppercase tracking-wider">
              Smart Natural Language Processing
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#FFFFFF] mt-1 flex items-center space-x-2">
            <MessageSquareCode className="w-5 h-5 text-[#3B82F6]" />
            <span>Smart Problem Solver</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
            Type problems naturally in plain English. The smart parser identifies the variables, quantities, and formulas, solving with complete step-by-step substitution.
          </p>
        </div>

        {/* Input bar */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block">
            Your Question or Problem
          </label>
          <div className="relative">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
              placeholder="e.g. calculate kinetic energy of a 5 kg object moving at 10 m/s..."
              className="w-full pl-4 pr-12 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-zinc-900 text-[#FFFFFF] text-sm sm:text-base font-medium focus:border-emerald-500 focus:outline-none transition-colors"
            />
            <button
              onClick={() => handleExecute()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#3B82F6] text-[#FFFFFF] hover:bg-[#2563EB] transition-colors"
            >
              <CornerDownLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Suggested Queries */}
        <div>
          <span className="text-xs font-semibold text-[#A1A1AA] block mb-2">
            Try these example natural queries:
          </span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((sample) => (
              <button
                key={sample}
                onClick={() => handleSelectSample(sample)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 hover:bg-emerald-500/10 hover:text-[#3B82F6] dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start space-x-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={() => handleExecute()}
          className="w-full py-3.5 bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-bold active:scale-[0.99] rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Parse & Solve Instantly</span>
        </button>
      </div>

      {/* Solution presentation */}
      {solution && (
        <div className="pt-2">
          <StepSolutionCard solution={solution} />
        </div>
      )}
    </div>
  );
};
