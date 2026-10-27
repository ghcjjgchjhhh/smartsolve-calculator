import React, { useState, useMemo } from 'react';
import { PHYSICS_FORMULAS } from '../services/physicsEngine';
import { UNIT_CATEGORIES } from '../services/unitConverter';
import { Search, X, Atom, FunctionSquare, Scale } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (tab: string, formulaId?: string) => void;
}

export const SearchModal: React.FC<Props> = ({ isOpen, onClose, onSelectAction }) => {
  const [query, setQuery] = useState('');

  const mathEntries = [
    { name: 'AI Real-World Solver', sub: 'Solves complex physics, math & chemistry questions with step-by-step reasoning', tab: 'ai_solver' },
    { name: 'JAMB / WAEC / JUPEB CBT Practice', sub: 'Timed CBT simulator with instant score calculation, Chemistry, Physics & Mathematics', tab: 'jamb' },
    { name: 'Chemistry Exam Practice', sub: 'Mole concept, stoichiometry, gas laws, electrochemistry, and organic chemistry', tab: 'jamb' },
    { name: 'Quadratic Equation Solver', sub: 'ax² + bx + c = 0 (Formula, Factorization, Completing Square)', tab: 'math' },
    { name: 'Linear Equations Solver', sub: 'Single variable ax + b = cx + d', tab: 'math' },
    { name: 'Simultaneous Equations', sub: '2-variable system elimination & Cramer rule', tab: 'math' },
    { name: 'Financial Interest & Compound', sub: 'Simple interest, compound interest A = P(1+r/n)^(nt), loan amortization', tab: 'math' },
    { name: 'Logarithms & Exponentials', sub: 'Change of base, natural logs ln, solve b^y = x', tab: 'math' },
    { name: 'Circle Geometry & Sectors', sub: 'Area πr², circumference, arc length s = rθ, sector area', tab: 'math' },
    { name: 'Binomial Theorem Expansion', sub: '(a + b)^n expansion using combination coefficients (n choose k)', tab: 'math' },
    { name: 'Fractions Calculator', sub: 'Add, subtract, multiply, divide, LCM & GCD', tab: 'math' },
    { name: 'Percentages & Ratios', sub: 'Percentage change & proportional sharing', tab: 'math' },
    { name: 'Arithmetic Progression (AP)', sub: 'Tn = a + (n-1)d and Sn sum', tab: 'math' },
    { name: 'Geometric Progression (GP)', sub: 'Tn = ar^(n-1), Sn, and Sum to infinity S∞', tab: 'math' },
    { name: 'Coordinate Geometry', sub: 'Distance, midpoint, gradient, and line equation', tab: 'math' },
    { name: 'Descriptive Statistics', sub: 'Mean, median, mode, range, variance, standard deviation', tab: 'math' },
    { name: 'Permutations & Combinations', sub: 'nPr, nCr, and factorials', tab: 'math' },
    { name: 'Calculus Differentiation', sub: 'Power rule derivative d/dx [ax^n]', tab: 'math' },
    { name: 'Calculus Integration', sub: 'Definite & indefinite polynomial integrals', tab: 'math' },
    { name: '2x2 Matrix & Vectors', sub: 'Determinant, trace, inverse, 3D dot & cross product', tab: 'math' },
  ];

  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return {
        physics: PHYSICS_FORMULAS.slice(0, 4),
        math: mathEntries.slice(0, 4),
        units: UNIT_CATEGORIES.slice(0, 4),
      };
    }

    const q = query.toLowerCase();

    const physics = PHYSICS_FORMULAS.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.baseFormula.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );

    const math = mathEntries.filter(
      (m) => m.name.toLowerCase().includes(q) || m.sub.toLowerCase().includes(q)
    );

    const units = UNIT_CATEGORIES.filter((u) => u.name.toLowerCase().includes(q));

    return { physics, math, units };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-start justify-center">
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden mt-12 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-[#27272A] flex items-center space-x-3">
          <Search className="w-5 h-5 text-[#22C55E]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search formulas, laws, equations or units (e.g. Ohm, motion, quadratic)..."
            className="flex-1 bg-transparent text-base sm:text-lg font-medium text-[#FFFFFF] placeholder:text-[#A1A1AA] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-[#18181B] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Physics */}
          {searchResults.physics.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#22C55E] flex items-center space-x-1.5">
                <Atom className="w-3.5 h-3.5" />
                <span>Physics Calculators ({searchResults.physics.length})</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.physics.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectAction('physics', f.id);
                      onClose();
                    }}
                    className="p-3 text-left rounded-xl bg-[#000000] hover:bg-[#18181B] border border-[#27272A] transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-[#FFFFFF] line-clamp-1">{f.name}</div>
                    <div className="text-xs font-mono font-semibold text-[#22C55E] mt-0.5">
                      {f.baseFormula}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mathematics */}
          {searchResults.math.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#22C55E] flex items-center space-x-1.5">
                <FunctionSquare className="w-3.5 h-3.5" />
                <span>Mathematics Hub</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.math.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => {
                      onSelectAction(m.tab);
                      onClose();
                    }}
                    className="p-3 text-left rounded-xl bg-[#000000] hover:bg-[#18181B] border border-[#27272A] transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-[#FFFFFF] line-clamp-1">{m.name}</div>
                    <div className="text-[11px] text-[#A1A1AA] line-clamp-1 mt-0.5">{m.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Unit Converter */}
          {searchResults.units.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Unit Categories</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {searchResults.units.map((u) => (
                  <button
                    key={u.name}
                    onClick={() => {
                      onSelectAction('converter');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#000000] hover:bg-[#18181B] text-xs font-semibold text-[#FFFFFF] border border-[#27272A] cursor-pointer"
                  >
                    {u.name} ({u.baseUnit})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
