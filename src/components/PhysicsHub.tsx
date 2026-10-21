import React, { useState } from 'react';
import { PHYSICS_FORMULAS, solvePhysicsFormula } from '../services/physicsEngine';
import { StepSolutionCard } from './StepSolutionCard';
import { StepSolution, PhysicsFormulaDefinition } from '../types';
import { saveToHistory } from '../services/historyStorage';
import { Atom, Search, Sparkles, SlidersHorizontal, ArrowRight, HelpCircle } from 'lucide-react';

export const PhysicsHub: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('speed_dist_time');

  // Solver states
  const [targetVar, setTargetVar] = useState<string>('v');
  const [inputValues, setInputValues] = useState<Record<string, number>>({});
  const [solution, setSolution] = useState<StepSolution | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'All',
    'Mechanics',
    'Energy & Work',
    'Fluids & Pressure',
    'Machines',
    'Thermal Physics',
    'Waves & Sound',
    'Electricity & Magnetism',
    'Optics',
    'Modern & Advanced',
    'Atomic & Nuclear',
  ];

  const currentFormula = PHYSICS_FORMULAS.find((f) => f.id === selectedFormulaId) || PHYSICS_FORMULAS[0];

  // Initialize target var and default inputs when switching formula
  const handleSelectFormula = (formula: PhysicsFormulaDefinition) => {
    setSelectedFormulaId(formula.id);
    const availableTargets = Object.keys(formula.solveFor);
    const initialTarget = availableTargets[0] || formula.variables[0].symbol;
    setTargetVar(initialTarget);

    const initialInputs: Record<string, number> = {};
    formula.variables.forEach((v) => {
      if (v.defaultValue !== undefined) {
        initialInputs[v.symbol] = v.defaultValue;
      }
    });
    setInputValues(initialInputs);
    setSolution(null);
    setError(null);
  };

  const handleInputChange = (symbol: string, val: string) => {
    setError(null);
    setInputValues((prev) => ({
      ...prev,
      [symbol]: parseFloat(val) || 0,
    }));
  };

  const handleCalculate = () => {
    setError(null);
    try {
      const res = solvePhysicsFormula(currentFormula.id, targetVar, inputValues);
      setSolution(res);
      saveToHistory(res);
    } catch (err: any) {
      setError(err.message || 'Error solving physics formula.');
    }
  };

  const filteredFormulas = PHYSICS_FORMULAS.filter((f) => {
    const matchesCat = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.baseFormula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Category Pills & Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search physics formulas (e.g. velocity, Ohm's law, heat, waves, projectile)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c
                  ? 'bg-emerald-500 text-black font-black text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-zinc-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Formula Selector Cards list */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Available Formulas ({filteredFormulas.length})
          </div>

          {filteredFormulas.map((f) => {
            const isSelected = f.id === currentFormula.id;
            return (
              <button
                key={f.id}
                onClick={() => handleSelectFormula(f)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between ${
                  isSelected
                    ? 'bg-emerald-500/15 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-black border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400">
                      {f.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{f.name}</h4>
                  <div className="text-xs font-mono font-semibold text-emerald-500 dark:text-emerald-400 mt-0.5">
                    {f.baseFormula}
                  </div>
                </div>
                <ArrowRight
                  className={`w-4 h-4 mt-1 transition-transform ${
                    isSelected ? 'text-emerald-500 translate-x-0.5' : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            );
          })}

          {filteredFormulas.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-zinc-800">
              No formulas match "{searchQuery}"
            </div>
          )}
        </div>

        {/* Right: Active Formula Calculator */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Header */}
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  {currentFormula.category}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{currentFormula.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{currentFormula.description}</p>
            </div>

            {/* Base Formula Banner */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/30 dark:border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider block">
                  Base Formula
                </span>
                <span className="text-lg font-black text-zinc-100 dark:text-emerald-300 math-display">
                  {currentFormula.baseFormula}
                </span>
              </div>
              <Atom className="w-6 h-6 text-emerald-500/50" />
            </div>

            {/* Target Variable Chooser */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                Quantity to Find (Unknown Variable)
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(currentFormula.solveFor).map((sym) => {
                  const param = currentFormula.variables.find((v) => v.symbol === sym);
                  const isTarget = targetVar === sym;
                  return (
                    <button
                      key={sym}
                      onClick={() => {
                        setTargetVar(sym);
                        setSolution(null);
                        setError(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                        isTarget
                          ? 'bg-emerald-500 text-black font-black text-white shadow-md shadow-emerald-500/30'
                          : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>Find {sym}</span>
                      {param && <span className="opacity-75">({param.name})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Parameter Input Fields */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Enter Given Values
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentFormula.variables.map((v) => {
                  const isTarget = v.symbol === targetVar;
                  return (
                    <div
                      key={v.symbol}
                      className={`p-3 rounded-xl border transition-all ${
                        isTarget
                          ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50/60 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {v.name} ({v.symbol})
                        </label>
                        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">{v.unit}</span>
                      </div>

                      {isTarget ? (
                        <div className="py-2 text-xs font-bold text-emerald-500 dark:text-emerald-400 italic">
                          Unknown to calculate →
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={inputValues[v.symbol] !== undefined ? inputValues[v.symbol] : ''}
                          onChange={(e) => handleInputChange(v.symbol, e.target.value)}
                          placeholder={`Enter ${v.symbol}`}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-black font-mono text-sm font-bold text-slate-900 dark:text-white"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={handleCalculate}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.99] text-black font-black font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Calculate & Show Step-by-Step Solution</span>
            </button>
          </div>

          {/* Solution display */}
          {solution && (
            <div className="pt-2">
              <StepSolutionCard solution={solution} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
