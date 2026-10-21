import React, { useState } from 'react';
import { UNIT_CATEGORIES, convertUnit } from '../services/unitConverter';
import { StepSolutionCard } from './StepSolutionCard';
import { StepSolution } from '../types';
import { saveToHistory } from '../services/historyStorage';
import { formatNum } from '../services/mathEngine';
import {
  ArrowLeftRight,
  Sparkles,
  Scale,
  Ruler,
  Clock,
  Maximize2,
  Box,
  Zap,
  Flame,
  Gauge,
  Thermometer,
  Shield,
  Activity,
  BatteryCharging,
  Cpu,
  Radio,
  Sliders,
  TrendingUp,
} from 'lucide-react';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Ruler,
  Weight: Scale,
  Clock,
  Maximize2,
  Box,
  Zap,
  TrendingUp,
  Shield,
  Flame,
  Cpu,
  Gauge,
  Thermometer,
  Radio,
  BatteryCharging,
  Activity,
  Sliders,
};

export const UnitConverterView: React.FC = () => {
  const [selectedCatName, setSelectedCatName] = useState<string>('Length');
  const currentCat = UNIT_CATEGORIES.find((c) => c.name === selectedCatName) || UNIT_CATEGORIES[0];

  const [fromUnitId, setFromUnitId] = useState<string>(currentCat.units[1]?.id || currentCat.units[0].id);
  const [toUnitId, setToUnitId] = useState<string>(currentCat.units[0].id);
  const [inputValue, setInputValue] = useState<number>(100);
  const [solution, setSolution] = useState<StepSolution | null>(null);

  const handleSelectCategory = (catName: string) => {
    setSelectedCatName(catName);
    const cat = UNIT_CATEGORIES.find((c) => c.name === catName) || UNIT_CATEGORIES[0];
    setFromUnitId(cat.units[1]?.id || cat.units[0].id);
    setToUnitId(cat.units[0].id);
    setSolution(null);
  };

  const handleSwapUnits = () => {
    const prevFrom = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(prevFrom);
    setSolution(null);
  };

  const handleConvert = () => {
    try {
      const res = convertUnit(currentCat.name, fromUnitId, toUnitId, inputValue);
      const fromU = currentCat.units.find((u) => u.id === fromUnitId);
      const toU = currentCat.units.find((u) => u.id === toUnitId);

      const sol: StepSolution = {
        title: `${currentCat.name} Conversion`,
        category: 'Unit Converter',
        subCategory: currentCat.name,
        problemStatement: `Convert ${inputValue} ${fromU?.symbol} to ${toU?.symbol}`,
        formula: res.formula,
        substitution: `${inputValue} ${fromU?.symbol} converted via base unit (${currentCat.baseUnit})`,
        steps: res.steps,
        finalAnswer: `${formatNum(res.result, 6)} ${toU?.symbol}`,
        unit: toU?.symbol,
      };

      setSolution(sol);
      saveToHistory(sol);
    } catch (e: any) {
      console.error(e);
    }
  };

  // Quick preset conversions
  const quickPresets = [
    { cat: 'Speed', from: 'kmh', to: 'ms', label: 'km/h → m/s' },
    { cat: 'Speed', from: 'ms', to: 'kmh', label: 'm/s → km/h' },
    { cat: 'Pressure', from: 'atm', to: 'Pa', label: 'atm → Pa (N/m²)' },
    { cat: 'Temperature', from: 'C', to: 'K', label: '°C → Kelvin' },
    { cat: 'Energy', from: 'cal', to: 'J', label: 'cal → Joules' },
    { cat: 'Mass', from: 'tonne', to: 'kg', label: 'tonne → kg' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Category Grid */}
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Scale className="w-5 h-5 text-emerald-500" />
            <span>Unit Converter</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Convert across 16 scientific & Nigerian/JAMB units with live formulas and conversion multipliers.
          </p>
        </div>

        {/* Category Horizontal list */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {UNIT_CATEGORIES.map((c) => {
            const isSelected = c.name === currentCat.name;
            const Icon = iconMap[c.icon] || Scale;
            return (
              <button
                key={c.name}
                onClick={() => handleSelectCategory(c.name)}
                className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-black font-black text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Conversion Control Card */}
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
            Converting: {currentCat.name}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Base SI Unit: <strong className="text-slate-700 dark:text-slate-300">{currentCat.baseUnit}</strong>
          </span>
        </div>

        {/* Inputs layout */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
          {/* From Value & Unit */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              From
            </label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white font-mono font-bold text-lg"
            />
            <select
              value={fromUnitId}
              onChange={(e) => setFromUnitId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-zinc-900 text-sm font-semibold"
            >
              {currentCat.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex items-center justify-center pt-5">
            <button
              onClick={handleSwapUnits}
              title="Swap Units"
              className="p-3 rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-emerald-500/10 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-500 border border-slate-200 dark:border-slate-700 transition-transform active:rotate-180"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          {/* To Unit */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              To
            </label>
            <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-zinc-900/60 text-slate-700 dark:text-slate-300 font-mono font-bold text-lg min-h-[46px] flex items-center">
              {solution ? solution.finalAnswer : '---'}
            </div>
            <select
              value={toUnitId}
              onChange={(e) => setToUnitId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-zinc-900 text-sm font-semibold"
            >
              {currentCat.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-1.5">Common JAMB & Physics Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setSelectedCatName(p.cat);
                  setFromUnitId(p.from);
                  setToUnitId(p.to);
                  setInputValue(100);
                  setSolution(null);
                }}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-zinc-900 hover:bg-emerald-500/10 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono transition-colors border border-slate-200 dark:border-slate-700"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleConvert}
          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Convert & Show Formula Steps</span>
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
