import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Calculator,
  Save,
  Check,
  Sparkles,
  Sliders,
  HelpCircle,
  Copy,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

export interface CustomFormula {
  id: string;
  name: string;
  category: string;
  expression: string; // e.g. "P * (1 + r/n)^(n*t)"
  description: string;
  variables: { symbol: string; label: string; defaultValue: number; unit?: string }[];
}

const DEFAULT_NOTEBOOK_FORMULAS: CustomFormula[] = [
  {
    id: 'f1',
    name: 'Compound Interest with Periodic Compounding',
    category: 'Finance & Math',
    expression: 'P * (1 + r / n)^(n * t)',
    description: 'Calculates the future accumulated value of an investment with periodic compounding interest.',
    variables: [
      { symbol: 'P', label: 'Principal Initial Amount', defaultValue: 1000, unit: '$' },
      { symbol: 'r', label: 'Annual Interest Rate (decimal, e.g. 0.05 for 5%)', defaultValue: 0.07 },
      { symbol: 'n', label: 'Compounding frequency per year (e.g. 12 = monthly)', defaultValue: 12 },
      { symbol: 't', label: 'Time duration in years', defaultValue: 5, unit: 'years' },
    ],
  },
  {
    id: 'f2',
    name: "Ohm's Electrical Power Dissipation",
    category: 'Physics & Engineering',
    expression: 'V^2 / R',
    description: 'Calculates the rate of electrical energy dissipation in a circuit resistor.',
    variables: [
      { symbol: 'V', label: 'Applied Voltage across load', defaultValue: 220, unit: 'V' },
      { symbol: 'R', label: 'Resistance of the load', defaultValue: 50, unit: 'Ω' },
    ],
  },
  {
    id: 'f3',
    name: 'Body Mass Index (BMI)',
    category: 'Health & Science',
    expression: 'weight / (height^2)',
    description: 'Measures body mass relative to height in standard metric units.',
    variables: [
      { symbol: 'weight', label: 'Total Body Weight', defaultValue: 70, unit: 'kg' },
      { symbol: 'height', label: 'Height in meters', defaultValue: 1.75, unit: 'm' },
    ],
  },
  {
    id: 'f4',
    name: 'Relativistic Kinetic Energy',
    category: 'Modern Physics',
    expression: '0.5 * m * v^2',
    description: 'Classical kinetic energy of an object in rectilinear motion.',
    variables: [
      { symbol: 'm', label: 'Mass of moving body', defaultValue: 1200, unit: 'kg' },
      { symbol: 'v', label: 'Speed of body', defaultValue: 25, unit: 'm/s' },
    ],
  },
];

const STORAGE_KEY = 'smartsolve_custom_notebook_v1';

export const CustomFormulaNotebookView: React.FC = () => {
  const [formulas, setFormulas] = useState<CustomFormula[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NOTEBOOK_FORMULAS;
  });

  const [activeFormulaId, setActiveFormulaId] = useState<string>(formulas[0]?.id || 'f1');
  const [varValues, setVarValues] = useState<Record<string, number>>({});
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // New formula form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newExpression, setNewExpression] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newVarsString, setNewVarsString] = useState('a, b, c');

  const activeFormula = formulas.find((f) => f.id === activeFormulaId) || formulas[0];

  // Initialize variable inputs when active formula changes
  useEffect(() => {
    if (!activeFormula) return;
    const initial: Record<string, number> = {};
    activeFormula.variables.forEach((v) => {
      initial[v.symbol] = varValues[v.symbol] !== undefined ? varValues[v.symbol] : v.defaultValue;
    });
    setVarValues(initial);
  }, [activeFormulaId]);

  // Persist to local storage
  const saveFormulas = (updated: CustomFormula[]) => {
    setFormulas(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Evaluate formula calculation
  const calculateResult = (): { value: number | null; error?: string } => {
    if (!activeFormula) return { value: null };
    try {
      let expr = activeFormula.expression.replace(/\^/g, '**');

      // Replace variable symbols with their values
      activeFormula.variables.forEach((v) => {
        const val = varValues[v.symbol] !== undefined ? varValues[v.symbol] : v.defaultValue;
        const regex = new RegExp(`\\b${v.symbol}\\b`, 'g');
        expr = expr.replace(regex, `(${val})`);
      });

      const fn = new Function(`"use strict"; return (${expr});`);
      const res = fn();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return { value: res };
      }
      return { value: null, error: 'Result is undefined or indeterminate' };
    } catch (err: any) {
      return { value: null, error: err.message || 'Invalid formula expression' };
    }
  };

  const calcResult = calculateResult();

  const handleCreateFormula = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newExpression.trim()) return;

    const varSymbols = newVarsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const created: CustomFormula = {
      id: `custom_${Date.now()}`,
      name: newName.trim(),
      category: newCategory.trim() || 'Custom',
      expression: newExpression.trim(),
      description: newDescription.trim() || 'Custom user formula',
      variables: varSymbols.map((sym) => ({
        symbol: sym,
        label: `Variable ${sym}`,
        defaultValue: 1,
      })),
    };

    const updated = [created, ...formulas];
    saveFormulas(updated);
    setActiveFormulaId(created.id);
    setIsAddingNew(false);

    // Reset inputs
    setNewName('');
    setNewExpression('');
    setNewDescription('');
    setNewVarsString('a, b, c');
  };

  const handleDeleteFormula = (id: string) => {
    const updated = formulas.filter((f) => f.id !== id);
    saveFormulas(updated);
    if (activeFormulaId === id && updated.length > 0) {
      setActiveFormulaId(updated[0].id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fadeIn select-none">
      {/* Header Bar */}
      <div className="bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center text-[#22C55E] shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                Custom Formula Notebook ("My Formulas")
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 uppercase tracking-wider">
                Personalized
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Create, save, and calculate custom formulas with interactive parameter inputs, stored offline
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingNew((prev) => !prev)}
          className="px-3.5 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{isAddingNew ? 'Close Form' : 'Add Custom Formula'}</span>
        </button>
      </div>

      {/* Add New Formula Modal / Drawer Form */}
      {isAddingNew && (
        <form
          onSubmit={handleCreateFormula}
          className="bg-[#0A0A0C] border border-[#22C55E]/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-fadeIn"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#22C55E]" />
            <span>Create New Formula</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-zinc-400 font-semibold block mb-1">Formula Name:</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Kinetic Energy, Loan Monthly Payment..."
                className="w-full bg-[#121417] border border-[#27272A] focus:border-[#22C55E] rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-zinc-400 font-semibold block mb-1">Category:</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Physics, Finance, Engineering..."
                className="w-full bg-[#121417] border border-[#27272A] focus:border-[#22C55E] rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-zinc-400 font-semibold block mb-1">
                Mathematical Expression (use ^ for power, standard variables):
              </label>
              <input
                type="text"
                required
                value={newExpression}
                onChange={(e) => setNewExpression(e.target.value)}
                placeholder="e.g. 0.5 * m * v^2 or P * (1 + r)^t"
                className="w-full bg-[#121417] border border-[#27272A] focus:border-[#22C55E] rounded-xl px-3 py-2 font-mono text-white text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-zinc-400 font-semibold block mb-1">
                Variable Symbols (comma-separated):
              </label>
              <input
                type="text"
                value={newVarsString}
                onChange={(e) => setNewVarsString(e.target.value)}
                placeholder="e.g. m, v or P, r, t"
                className="w-full bg-[#121417] border border-[#27272A] focus:border-[#22C55E] rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-zinc-400 font-semibold block mb-1">Brief Description:</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What does this formula compute?"
                className="w-full bg-[#121417] border border-[#27272A] focus:border-[#22C55E] rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 rounded-xl bg-[#18181B] text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold cursor-pointer shadow-md shadow-emerald-500/20"
            >
              Save Formula to Notebook
            </button>
          </div>
        </form>
      )}

      {/* Main Split View: Left List of Formulas, Right Interactive Solver */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Formula List (5 cols) */}
        <div className="lg:col-span-5 bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 shadow-2xl space-y-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block pb-2 border-b border-[#27272A]">
            Saved Formulas ({formulas.length})
          </span>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {formulas.map((f) => {
              const isSelected = f.id === activeFormulaId;
              return (
                <div
                  key={f.id}
                  onClick={() => setActiveFormulaId(f.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-[#22C55E]/15 border-[#22C55E] text-white shadow-md'
                      : 'bg-[#121417] hover:bg-[#1A1D23] border-[#27272A] text-zinc-300 hover:text-white'
                  }`}
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold truncate block">{f.name}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 shrink-0">
                        {f.category}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#22C55E] font-semibold truncate">
                      {f.expression}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFormula(f.id);
                    }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer"
                    title="Delete formula"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Parameter Inputs & Result Calculator (7 cols) */}
        {activeFormula && (
          <div className="lg:col-span-7 bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">{activeFormula.name}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{activeFormula.description}</p>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 text-[10px] font-bold uppercase shrink-0">
                  {activeFormula.category}
                </span>
              </div>

              {/* Governing Equation Display */}
              <div className="p-3.5 rounded-2xl bg-[#121417] border border-[#27272A] text-center font-mono text-base sm:text-lg font-bold text-[#22C55E] overflow-x-auto scrollbar-none">
                {activeFormula.expression}
              </div>

              {/* Interactive Variable Inputs */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Input Variables:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeFormula.variables.map((v) => (
                    <div key={v.symbol} className="p-2.5 rounded-xl bg-[#121417] border border-[#27272A] space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-white">
                          {v.symbol} <span className="font-normal text-zinc-400">({v.label})</span>
                        </span>
                        {v.unit && <span className="text-[10px] text-zinc-500 font-mono">{v.unit}</span>}
                      </div>
                      <input
                        type="number"
                        value={varValues[v.symbol] !== undefined ? varValues[v.symbol] : v.defaultValue}
                        onChange={(e) =>
                          setVarValues((prev) => ({
                            ...prev,
                            [v.symbol]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full bg-[#18181B] border border-white/5 rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold text-white focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Calculated Output Result */}
            <div className="p-4 rounded-2xl bg-[#121417] border border-[#22C55E]/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Evaluated Result
                </span>
                <span className="text-xs text-zinc-400">Calculated instantly from current inputs</span>
              </div>
              <div className="text-right">
                {calcResult.value !== null ? (
                  <span className="text-2xl sm:text-3xl font-mono font-black text-[#22C55E]">
                    {Number(calcResult.value.toFixed(4))}
                  </span>
                ) : (
                  <span className="text-xs text-rose-400 font-semibold">{calcResult.error}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
