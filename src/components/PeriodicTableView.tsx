import React, { useState, useMemo } from 'react';
import {
  Atom,
  Search,
  Filter,
  Sparkles,
  Layers,
  Scale,
  Calculator,
  Info,
  Check,
  ChevronRight,
  Flame,
  Droplets,
  Wind,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export interface ChemicalElement {
  number: number;
  symbol: string;
  name: string;
  mass: number;
  category:
    | 'alkali-metal'
    | 'alkaline-earth'
    | 'transition-metal'
    | 'post-transition'
    | 'metalloid'
    | 'reactive-nonmetal'
    | 'noble-gas'
    | 'lanthanide'
    | 'actinide';
  period: number;
  group: number;
  electronConfig: string;
  electronegativity?: number;
  phase: 'Solid' | 'Liquid' | 'Gas';
  density?: number;
  summary: string;
}

// Complete scientific element registry
export const PERIODIC_ELEMENTS: ChemicalElement[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', mass: 1.008, category: 'reactive-nonmetal', period: 1, group: 1, electronConfig: '1s¹', electronegativity: 2.2, phase: 'Gas', summary: 'The lightest and most abundant element in the universe, fuel for stellar fusion.' },
  { number: 2, symbol: 'He', name: 'Helium', mass: 4.0026, category: 'noble-gas', period: 1, group: 18, electronConfig: '1s²', phase: 'Gas', summary: 'Colorless, odorless, unreactive noble gas formed by nuclear fusion in stars.' },
  { number: 3, symbol: 'Li', name: 'Lithium', mass: 6.94, category: 'alkali-metal', period: 2, group: 1, electronConfig: '[He] 2s¹', electronegativity: 0.98, phase: 'Solid', summary: 'Soft, silvery-white alkali metal critical for rechargeable high-density batteries.' },
  { number: 4, symbol: 'Be', name: 'Beryllium', mass: 9.0122, category: 'alkaline-earth', period: 2, group: 2, electronConfig: '[He] 2s²', electronegativity: 1.57, phase: 'Solid', summary: 'Light, rigid metal utilized in aerospace structures and X-ray windows.' },
  { number: 5, symbol: 'B', name: 'Boron', mass: 10.81, category: 'metalloid', period: 2, group: 13, electronConfig: '[He] 2s² 2p¹', electronegativity: 2.04, phase: 'Solid', summary: 'Hard metalloid utilized in borosilicate glass, semiconductors, and ceramic armor.' },
  { number: 6, symbol: 'C', name: 'Carbon', mass: 12.011, category: 'reactive-nonmetal', period: 2, group: 14, electronConfig: '[He] 2s² 2p²', electronegativity: 2.55, phase: 'Solid', summary: 'The fundamental chemical backbone of all organic life, graphite, and diamonds.' },
  { number: 7, symbol: 'N', name: 'Nitrogen', mass: 14.007, category: 'reactive-nonmetal', period: 2, group: 15, electronConfig: '[He] 2s² 2p³', electronegativity: 3.04, phase: 'Gas', summary: 'Makes up 78% of Earth atmosphere; essential in amino acids and fertilizers.' },
  { number: 8, symbol: 'O', name: 'Oxygen', mass: 15.999, category: 'reactive-nonmetal', period: 2, group: 16, electronConfig: '[He] 2s² 2p⁴', electronegativity: 3.44, phase: 'Gas', summary: 'Highly reactive nonmetal supporting cellular respiration and rapid combustion.' },
  { number: 9, symbol: 'F', name: 'Fluorine', mass: 18.998, category: 'reactive-nonmetal', period: 2, group: 17, electronConfig: '[He] 2s² 2p⁵', electronegativity: 3.98, phase: 'Gas', summary: 'The most chemically electronegative element, reacting with almost all materials.' },
  { number: 10, symbol: 'Ne', name: 'Neon', mass: 20.18, category: 'noble-gas', period: 2, group: 18, electronConfig: '[He] 2s² 2p⁶', phase: 'Gas', summary: 'Inert noble gas emitting a brilliant reddish-orange glow in discharge tubes.' },
  { number: 11, symbol: 'Na', name: 'Sodium', mass: 22.99, category: 'alkali-metal', period: 3, group: 1, electronConfig: '[Ne] 3s¹', electronegativity: 0.93, phase: 'Solid', summary: 'Soft reactive metal reacting vigorously with water; component of table salt NaCl.' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', mass: 24.305, category: 'alkaline-earth', period: 3, group: 2, electronConfig: '[Ne] 3s²', electronegativity: 1.31, phase: 'Solid', summary: 'Light structural metal with intense white flame; central ion in plant chlorophyll.' },
  { number: 13, symbol: 'Al', name: 'Aluminium', mass: 26.982, category: 'post-transition', period: 3, group: 13, electronConfig: '[Ne] 3s² 3p¹', electronegativity: 1.61, phase: 'Solid', summary: 'Lightweight, corrosion-resistant metal used universally in aircraft, foil, and cans.' },
  { number: 14, symbol: 'Si', name: 'Silicon', mass: 28.085, category: 'metalloid', period: 3, group: 14, electronConfig: '[Ne] 3s² 3p²', electronegativity: 1.9, phase: 'Solid', summary: 'Semiconductor material at the foundation of modern computer microprocessors.' },
  { number: 15, symbol: 'P', name: 'Phosphorus', mass: 30.974, category: 'reactive-nonmetal', period: 3, group: 15, electronConfig: '[Ne] 3s² 3p³', electronegativity: 2.19, phase: 'Solid', summary: 'Crucial for DNA, RNA, ATP cellular energy storage, and agricultural fertilizers.' },
  { number: 16, symbol: 'S', name: 'Sulfur', mass: 32.06, category: 'reactive-nonmetal', period: 3, group: 16, electronConfig: '[Ne] 3s² 3p⁴', electronegativity: 2.58, phase: 'Solid', summary: 'Bright yellow nonmetal in volcanic deposits and sulfuric acid H₂SO₄ manufacture.' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', mass: 35.45, category: 'reactive-nonmetal', period: 3, group: 17, electronConfig: '[Ne] 3s² 3p⁵', electronegativity: 3.16, phase: 'Gas', summary: 'Yellow-green halogen gas used extensively in water purification and PVC plastics.' },
  { number: 18, symbol: 'Ar', name: 'Argon', mass: 39.948, category: 'noble-gas', period: 3, group: 18, electronConfig: '[Ne] 3s² 3p⁶', phase: 'Gas', summary: 'Third-most abundant atmospheric gas, provides inert shielding in arc welding.' },
  { number: 19, symbol: 'K', name: 'Potassium', mass: 39.098, category: 'alkali-metal', period: 4, group: 1, electronConfig: '[Ar] 4s¹', electronegativity: 0.82, phase: 'Solid', summary: 'Essential nutrient for nerve transmission and cardiovascular muscle health.' },
  { number: 20, symbol: 'Ca', name: 'Calcium', mass: 40.078, category: 'alkaline-earth', period: 4, group: 2, electronConfig: '[Ar] 4s²', electronegativity: 1.0, phase: 'Solid', summary: 'Vital for human bones, teeth, concrete cement, and cellular signaling.' },
  { number: 21, symbol: 'Sc', name: 'Scandium', mass: 44.956, category: 'transition-metal', period: 4, group: 3, electronConfig: '[Ar] 3d¹ 4s²', electronegativity: 1.36, phase: 'Solid', summary: 'Transition metal alloyed with aluminium for lightweight aerospace components.' },
  { number: 22, symbol: 'Ti', name: 'Titanium', mass: 47.867, category: 'transition-metal', period: 4, group: 4, electronConfig: '[Ar] 3d² 4s²', electronegativity: 1.54, phase: 'Solid', summary: 'High strength-to-weight ratio metal resistant to seawater and bodily fluids.' },
  { number: 23, symbol: 'V', name: 'Vanadium', mass: 50.942, category: 'transition-metal', period: 4, group: 5, electronConfig: '[Ar] 3d³ 4s²', electronegativity: 1.63, phase: 'Solid', summary: 'Added to steel alloys for extraordinary strength in wrenches and armor plate.' },
  { number: 24, symbol: 'Cr', name: 'Chromium', mass: 51.996, category: 'transition-metal', period: 4, group: 6, electronConfig: '[Ar] 3d⁵ 4s¹', electronegativity: 1.66, phase: 'Solid', summary: 'Lustrous, corrosion-resistant metal providing the stainless quality in stainless steel.' },
  { number: 25, symbol: 'Mn', name: 'Manganese', mass: 54.938, category: 'transition-metal', period: 4, group: 7, electronConfig: '[Ar] 3d⁵ 4s²', electronegativity: 1.55, phase: 'Solid', summary: 'Crucial for iron steelmaking and the cathode chemistry of alkaline batteries.' },
  { number: 26, symbol: 'Fe', name: 'Iron', mass: 55.845, category: 'transition-metal', period: 4, group: 8, electronConfig: '[Ar] 3d⁶ 4s²', electronegativity: 1.83, phase: 'Solid', summary: 'Most used metal by mass worldwide; core component of human hemoglobin.' },
  { number: 27, symbol: 'Co', name: 'Cobalt', mass: 58.933, category: 'transition-metal', period: 4, group: 9, electronConfig: '[Ar] 3d⁷ 4s²', electronegativity: 1.88, phase: 'Solid', summary: 'Hard ferromagnetic metal critical for EV lithium-ion battery cathodes.' },
  { number: 28, symbol: 'Ni', name: 'Nickel', mass: 58.693, category: 'transition-metal', period: 4, group: 10, electronConfig: '[Ar] 3d⁸ 4s²', electronegativity: 1.91, phase: 'Solid', summary: 'Silvery metal used in coin minting, superalloys, and electroplating.' },
  { number: 29, symbol: 'Cu', name: 'Copper', mass: 63.546, category: 'transition-metal', period: 4, group: 11, electronConfig: '[Ar] 3d¹⁰ 4s¹', electronegativity: 1.9, phase: 'Solid', summary: 'Supreme electrical conductor; ductile metal in electrical grid wiring and pipes.' },
  { number: 30, symbol: 'Zn', name: 'Zinc', mass: 65.38, category: 'transition-metal', period: 4, group: 12, electronConfig: '[Ar] 3d¹⁰ 4s²', electronegativity: 1.65, phase: 'Solid', summary: 'Anti-corrosion galvanizing agent for steel; key cofactor in human immune enzymes.' },
  { number: 35, symbol: 'Br', name: 'Bromine', mass: 79.904, category: 'reactive-nonmetal', period: 4, group: 17, electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁵', electronegativity: 2.96, phase: 'Liquid', summary: 'Dense reddish-brown fuming liquid halogen, one of only two liquid elements at STP.' },
  { number: 47, symbol: 'Ag', name: 'Silver', mass: 107.87, category: 'transition-metal', period: 5, group: 11, electronConfig: '[Kr] 4d¹⁰ 5s¹', electronegativity: 1.93, phase: 'Solid', summary: 'Highest electrical conductivity, thermal conductivity, and reflectivity of any metal.' },
  { number: 53, symbol: 'I', name: 'Iodine', mass: 126.9, category: 'reactive-nonmetal', period: 5, group: 17, electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁵', electronegativity: 2.66, phase: 'Solid', summary: 'Deep purple-black lustrous solid subliming into violet gas; critical for thyroid health.' },
  { number: 79, symbol: 'Au', name: 'Gold', mass: 196.97, category: 'transition-metal', period: 6, group: 11, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', electronegativity: 2.54, phase: 'Solid', summary: 'Precious noble metal unaffected by air and moisture; supreme monetary reserve.' },
  { number: 80, symbol: 'Hg', name: 'Mercury', mass: 200.59, category: 'transition-metal', period: 6, group: 12, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', electronegativity: 2.0, phase: 'Liquid', summary: 'Only metallic element that is liquid at standard temperature and pressure.' },
  { number: 82, symbol: 'Pb', name: 'Lead', mass: 207.2, category: 'post-transition', period: 6, group: 14, electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', electronegativity: 2.33, phase: 'Solid', summary: 'Dense heavy metal absorbing X-ray and nuclear radiation; used in car batteries.' },
  { number: 92, symbol: 'U', name: 'Uranium', mass: 238.03, category: 'actinide', period: 7, group: 3, electronConfig: '[Rn] 5f³ 6d¹ 7s²', electronegativity: 1.38, phase: 'Solid', summary: 'Dense radioactive actinide fueling nuclear power reactors and atomic energy.' },
];

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'alkali-metal': { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400' },
  'alkaline-earth': { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
  'transition-metal': { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  'post-transition': { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  'metalloid': { bg: 'bg-teal-500/20', border: 'border-teal-500/50', text: 'text-teal-400' },
  'reactive-nonmetal': { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  'noble-gas': { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  'lanthanide': { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400' },
  'actinide': { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
};

// Formula Parser for Molar Mass (e.g. H2SO4, Ca(OH)2, C6H12O6)
interface ElementCount {
  element: ChemicalElement;
  count: number;
  totalMass: number;
  percentage: number;
}

export const parseChemicalFormula = (formula: string): { elements: ElementCount[]; totalMolarMass: number; valid: boolean } => {
  if (!formula.trim()) return { elements: [], totalMolarMass: 0, valid: true };

  try {
    let clean = formula.trim().replace(/\s+/g, '');

    // Expand parentheses like (OH)2 -> O2H2 or Ca(NO3)2
    const expandParentheses = (str: string): string => {
      const parenRegex = /\(([^()]+)\)(\d+)/g;
      let expanded = str;
      while (parenRegex.test(expanded)) {
        expanded = expanded.replace(parenRegex, (_, inside, multiplierStr) => {
          const mult = parseInt(multiplierStr, 10);
          return inside.replace(/([A-Z][a-z]*)(\d*)/g, (__: string, elem: string, countStr: string) => {
            const count = countStr ? parseInt(countStr, 10) : 1;
            return `${elem}${count * mult}`;
          });
        });
      }
      return expanded;
    };

    const expandedFormula = expandParentheses(clean);
    const elementRegex = /([A-Z][a-z]*)(\d*)/g;
    const counts: Record<string, number> = {};

    let match;
    while ((match = elementRegex.exec(expandedFormula)) !== null) {
      const symbol = match[1];
      const count = match[2] ? parseInt(match[2], 10) : 1;
      counts[symbol] = (counts[symbol] || 0) + count;
    }

    const elementMap = new Map(PERIODIC_ELEMENTS.map((el) => [el.symbol, el]));
    const result: ElementCount[] = [];
    let totalMass = 0;

    for (const [symbol, count] of Object.entries(counts)) {
      const elem = elementMap.get(symbol);
      if (!elem) {
        return { elements: [], totalMolarMass: 0, valid: false };
      }
      const mass = elem.mass * count;
      totalMass += mass;
      result.push({
        element: elem,
        count,
        totalMass: mass,
        percentage: 0,
      });
    }

    result.forEach((item) => {
      item.percentage = totalMass > 0 ? (item.totalMass / totalMass) * 100 : 0;
    });

    return { elements: result, totalMolarMass: totalMass, valid: true };
  } catch {
    return { elements: [], totalMolarMass: 0, valid: false };
  }
};

export const PeriodicTableView: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedElement, setSelectedElement] = useState<ChemicalElement>(PERIODIC_ELEMENTS[0]);

  // Stoichiometry Calculator State
  const [formulaInput, setFormulaInput] = useState('');
  const [massGrams, setMassGrams] = useState<string>('');

  const stoichiometry = useMemo(() => {
    return parseChemicalFormula(formulaInput);
  }, [formulaInput]);

  const calculatedMoles = useMemo(() => {
    const g = parseFloat(massGrams);
    if (!isNaN(g) && stoichiometry.totalMolarMass > 0) {
      return (g / stoichiometry.totalMolarMass).toFixed(4);
    }
    return '';
  }, [massGrams, stoichiometry.totalMolarMass]);

  const filteredElements = useMemo(() => {
    return PERIODIC_ELEMENTS.filter((el) => {
      const matchesSearch =
        el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.number.toString().includes(searchQuery);

      const matchesCat = selectedCategory === 'all' || el.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fadeIn select-none">
      {/* Header Bar */}
      <div className="bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center text-[#22C55E] shrink-0">
            <Atom className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                Interactive Periodic Table & Stoichiometry
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 uppercase tracking-wider">
                Chemistry
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Inspect atomic properties, electron configurations, and calculate molar mass & percent composition
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search symbol, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121417] border border-[#27272A] focus:border-[#22C55E] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#121417] border border-[#27272A] text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="all">All Series</option>
            <option value="alkali-metal">Alkali Metals</option>
            <option value="alkaline-earth">Alkaline Earth</option>
            <option value="transition-metal">Transition Metals</option>
            <option value="reactive-nonmetal">Reactive Nonmetals</option>
            <option value="noble-gas">Noble Gases</option>
            <option value="post-transition">Post-Transition</option>
          </select>
        </div>
      </div>

      {/* Main Chemistry Workstation (Periodic Grid & Molar Calculator) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Element Grid (8 cols) */}
        <div className="lg:col-span-8 bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Elements Palette ({filteredElements.length} Available)
            </span>
            <span className="text-[11px] text-[#22C55E] font-medium">Tap any element to inspect details</span>
          </div>

          {/* Element Cards Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredElements.map((el) => {
              const isSelected = selectedElement.number === el.number;
              const catStyle = CATEGORY_COLORS[el.category] || {
                bg: 'bg-zinc-800/40',
                border: 'border-zinc-700',
                text: 'text-zinc-300',
              };

              return (
                <button
                  key={el.number}
                  type="button"
                  onClick={() => setSelectedElement(el)}
                  className={`p-2 rounded-2xl border flex flex-col items-center justify-between transition-all cursor-pointer aspect-square ${
                    isSelected
                      ? 'ring-2 ring-white scale-105 shadow-lg bg-[#22C55E]/20 border-[#22C55E]'
                      : `${catStyle.bg} ${catStyle.border} hover:scale-102 hover:border-white/40`
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[9px] font-mono leading-none text-zinc-400">
                    <span>{el.number}</span>
                    <span>{el.period}</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-white">{el.symbol}</span>
                  <div className="text-[8.5px] truncate w-full text-center text-zinc-400 font-medium">
                    {el.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Element Deep Inspector Card */}
          {selectedElement && (
            <div className="p-4 rounded-2xl bg-[#121417] border border-[#27272A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-2xl bg-[#18181B] border border-[#22C55E]/40 flex flex-col items-center justify-center text-white shrink-0 shadow-md">
                  <span className="text-[10px] font-mono text-zinc-400">{selectedElement.number}</span>
                  <span className="text-xl font-black text-[#22C55E]">{selectedElement.symbol}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black text-white">{selectedElement.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 uppercase">
                      {selectedElement.category.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 max-w-lg">
                    {selectedElement.summary}
                  </p>
                </div>
              </div>

              {/* Numerical Properties */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full sm:w-auto text-xs shrink-0 font-mono">
                <div className="bg-[#18181B] p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-zinc-400 block font-sans">Atomic Mass</span>
                  <span className="font-bold text-white">{selectedElement.mass} g/mol</span>
                </div>
                <div className="bg-[#18181B] p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-zinc-400 block font-sans">Electron Config</span>
                  <span className="font-bold text-white text-[11px]">{selectedElement.electronConfig}</span>
                </div>
                <div className="bg-[#18181B] p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-zinc-400 block font-sans">Phase at STP</span>
                  <span className="font-bold text-emerald-400">{selectedElement.phase}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Stoichiometry & Molar Mass Calculator (4 cols) */}
        <div className="lg:col-span-4 bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Scale className="w-4 h-4 text-[#22C55E]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Molar Mass & Stoichiometry Engine
              </h3>
            </div>

            {/* Chemical Formula Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-semibold block">
                Chemical Formula (e.g. H2SO4, Ca(OH)2, C6H12O6):
              </label>
              <input
                type="text"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                placeholder="Enter formula..."
                className="w-full bg-[#121417] border border-[#27272A] focus:border-[#22C55E] rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white uppercase placeholder-zinc-500 focus:outline-none"
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1">
              {['H2O', 'NaCl', 'H2SO4', 'Ca(OH)2', 'C6H12O6', 'Fe2(SO4)3'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFormulaInput(preset)}
                  className="px-2 py-1 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-[10px] font-mono text-zinc-300 border border-[#27272A] cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Total Molar Mass Result Display */}
            {!formulaInput.trim() ? (
              <div className="p-3.5 rounded-2xl bg-[#121417] border border-[#27272A] text-center text-xs text-zinc-400">
                Enter a chemical formula above or tap a preset to view molar mass and composition breakdown.
              </div>
            ) : stoichiometry.valid && stoichiometry.totalMolarMass > 0 ? (
              <div className="p-3.5 rounded-2xl bg-[#121417] border border-[#22C55E]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Total Molar Mass:</span>
                  <span className="text-base font-mono font-black text-[#22C55E]">
                    {stoichiometry.totalMolarMass.toFixed(3)} g/mol
                  </span>
                </div>

                {/* Elemental Breakdown */}
                <div className="space-y-2 pt-1 border-t border-[#27272A]">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Mass Composition Percentage:
                  </span>
                  {stoichiometry.elements.map((item) => (
                    <div key={item.element.symbol} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-white font-bold">
                          {item.element.name} ({item.element.symbol} × {item.count}):
                        </span>
                        <span className="text-zinc-300 font-bold">{item.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-[#22C55E] rounded-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                Please enter a valid chemical formula with standard capital element symbols (e.g. NaCl, H2O).
              </div>
            )}

            {/* Mass to Moles Converter */}
            <div className="p-3 rounded-2xl bg-[#121417] border border-[#27272A] space-y-2 text-xs">
              <span className="font-bold text-white block">Mass ↔ Moles Conversion:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block">Mass in Grams (g):</label>
                  <input
                    type="number"
                    value={massGrams}
                    onChange={(e) => setMassGrams(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-2.5 py-1.5 font-mono text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block">Amount in Moles (mol):</label>
                  <div className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-2.5 py-1.5 font-mono text-[#22C55E] font-bold text-xs">
                    {calculatedMoles || '0.00'} mol
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
