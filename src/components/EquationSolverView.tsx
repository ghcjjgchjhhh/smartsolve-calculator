import React, { useState } from 'react';
import { analyzeEquation, solveSingleVariableEquation } from '../services/equationSolver';
import { PHYSICS_FORMULAS, solvePhysicsFormula } from '../services/physicsEngine';
import { StepSolutionCard } from './StepSolutionCard';
import { StepSolution } from '../types';
import { saveToHistory } from '../services/historyStorage';
import { Cpu, Sparkles, HelpCircle, Check, ArrowRight } from 'lucide-react';

export const EquationSolverView: React.FC = () => {
  const [equationInput, setEquationInput] = useState<string>('v = u + at');
  const [analyzed, setAnalyzed] = useState<ReturnType<typeof analyzeEquation> | null>(() =>
    analyzeEquation('v = u + at')
  );
  const [selectedTarget, setSelectedTarget] = useState<string>('a');
  const [formulaInputs, setFormulaInputs] = useState<Record<string, number>>({
    v: 25,
    u: 10,
    t: 5,
  });
  const [solution, setSolution] = useState<StepSolution | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleEquations = [
    '2x + 5 = 15',
    'x² + 5x + 6 = 0',
    'v = u + at',
    's = ut + ½at²',
    'F = ma',
    'V = IR',
    '3x - 7 = x + 9',
    'P = F / A',
  ];

  const handleInputChange = (val: string) => {
    setEquationInput(val);
    setError(null);
    try {
      const res = analyzeEquation(val);
      setAnalyzed(res);
      if (res.suggestedVariablesToSolve.length > 0) {
        setSelectedTarget(res.suggestedVariablesToSolve[0]);
      }
    } catch {
      setAnalyzed(null);
    }
  };

  const handleSelectSample = (sample: string) => {
    setEquationInput(sample);
    setError(null);
    setSolution(null);
    const res = analyzeEquation(sample);
    setAnalyzed(res);

    if (res.type === 'physics_matched' && res.matchedFormulaId) {
      const formDef = PHYSICS_FORMULAS.find((f) => f.id === res.matchedFormulaId);
      if (formDef) {
        const availableTargets = Object.keys(formDef.solveFor);
        const target = availableTargets[0] || 'a';
        setSelectedTarget(target);

        const initVals: Record<string, number> = {};
        formDef.variables.forEach((v) => {
          if (v.defaultValue !== undefined) initVals[v.symbol] = v.defaultValue;
        });
        setFormulaInputs(initVals);
      }
    } else if (res.type === 'algebraic') {
      // Auto solve sample
      try {
        const sol = solveSingleVariableEquation(sample);
        setSolution(sol);
        saveToHistory(sol);
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  const handleSolve = () => {
    setError(null);
    try {
      if (!analyzed) {
        throw new Error('Please enter a valid equation.');
      }

      if (analyzed.type === 'algebraic') {
        const sol = solveSingleVariableEquation(equationInput);
        setSolution(sol);
        saveToHistory(sol);
      } else if (analyzed.type === 'physics_matched' && analyzed.matchedFormulaId) {
        const sol = solvePhysicsFormula(analyzed.matchedFormulaId, selectedTarget, formulaInputs);
        setSolution(sol);
        saveToHistory(sol);
      } else {
        // Fallback single variable
        const sol = solveSingleVariableEquation(equationInput);
        setSolution(sol);
        saveToHistory(sol);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to solve equation. Check that required values are provided.');
    }
  };

  // Matched physics formula definition if applicable
  const matchedPhysicsDef =
    analyzed?.type === 'physics_matched' && analyzed.matchedFormulaId
      ? PHYSICS_FORMULAS.find((f) => f.id === analyzed.matchedFormulaId)
      : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Intro & Samples */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-xl font-bold text-[#FFFFFF] flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-emerald-500" />
            <span>Smart Equation Solver</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
            Type any math or physics equation. The solver automatically detects the variables, rearranges the formula, and presents full substitution steps with SI units.
          </p>
        </div>

        {/* Input box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block">
            Enter Equation
          </label>
          <div className="relative">
            <input
              type="text"
              value={equationInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="e.g. 2x + 5 = 15 or v = u + at"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-[#27272A] bg-[#000000] text-[#FFFFFF] font-mono text-lg font-bold focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Quick Example Chips */}
        <div>
          <span className="text-xs font-semibold text-[#A1A1AA] block mb-2">
            Click to try sample equations:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleEquations.map((sample) => (
              <button
                key={sample}
                onClick={() => handleSelectSample(sample)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-900 hover:bg-emerald-500/10 hover:text-emerald-500 dark:hover:bg-slate-700 text-xs font-mono font-semibold text-[#A1A1AA] transition-colors border border-[#27272A]"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Equation Status / Detection */}
        {analyzed && (
          <div className="p-4 bg-[#000000] rounded-xl border border-[#27272A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#22C55E]">
                Equation Type Detected:
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 dark:bg-emerald-950 text-[#22C55E] capitalize">
                {analyzed.type.replace('_', ' ')}
              </span>
            </div>

            {/* If matched a physics formula, offer target selector & parameter inputs */}
            {matchedPhysicsDef && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-bold text-[#A1A1AA] block mb-1.5">
                    Select Quantity to Find (Solve For):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(matchedPhysicsDef.solveFor).map((sym) => {
                      const param = matchedPhysicsDef.variables.find((v) => v.symbol === sym);
                      const isTarget = selectedTarget === sym;
                      return (
                        <button
                          key={sym}
                          onClick={() => setSelectedTarget(sym)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isTarget
                              ? 'bg-[#22C55E] text-[#FFFFFF] font-bold shadow-sm'
                              : 'bg-white dark:bg-zinc-900 text-[#A1A1AA] border border-[#27272A]'
                          }`}
                        >
                          Find {sym} {param ? `(${param.name})` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Values inputs for known quantities */}
                <div>
                  <label className="text-xs font-bold text-[#A1A1AA] block mb-1.5">
                    Enter Values for Known Variables:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {matchedPhysicsDef.variables
                      .filter((v) => v.symbol !== selectedTarget)
                      .map((v) => (
                        <div key={v.symbol} className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-[#27272A]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-[#A1A1AA]">{v.name} ({v.symbol})</span>
                            <span className="font-mono text-[#A1A1AA] font-bold">{v.unit}</span>
                          </div>
                          <input
                            type="number"
                            value={formulaInputs[v.symbol] !== undefined ? formulaInputs[v.symbol] : ''}
                            onChange={(e) =>
                              setFormulaInputs((prev) => ({
                                ...prev,
                                [v.symbol]: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-full px-2.5 py-1.5 rounded border border-[#27272A] bg-[#0A0A0A] text-[#FFFFFF] font-mono text-sm font-bold"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Solve button */}
        <button
          onClick={handleSolve}
          className="w-full py-3.5 bg-[#22C55E] hover:bg-[#16A34A] active:scale-[0.99] text-[#FFFFFF] font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Solve Equation Automatically</span>
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
