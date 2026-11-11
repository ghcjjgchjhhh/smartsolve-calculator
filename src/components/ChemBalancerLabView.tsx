import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Info,
  TrendingUp,
  Layers,
  Zap,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

// Standard IUPAC Atomic Weights (g/mol)
export const ATOMIC_WEIGHTS: Record<string, { mass: number; name: string }> = {
  H: { mass: 1.008, name: 'Hydrogen' },
  He: { mass: 4.0026, name: 'Helium' },
  Li: { mass: 6.94, name: 'Lithium' },
  Be: { mass: 9.0122, name: 'Beryllium' },
  B: { mass: 10.81, name: 'Boron' },
  C: { mass: 12.011, name: 'Carbon' },
  N: { mass: 14.007, name: 'Nitrogen' },
  O: { mass: 15.999, name: 'Oxygen' },
  F: { mass: 18.998, name: 'Fluorine' },
  Ne: { mass: 20.18, name: 'Neon' },
  Na: { mass: 22.99, name: 'Sodium' },
  Mg: { mass: 24.305, name: 'Magnesium' },
  Al: { mass: 26.982, name: 'Aluminium' },
  Si: { mass: 28.085, name: 'Silicon' },
  P: { mass: 30.974, name: 'Phosphorus' },
  S: { mass: 32.06, name: 'Sulfur' },
  Cl: { mass: 35.45, name: 'Chlorine' },
  Ar: { mass: 39.948, name: 'Argon' },
  K: { mass: 39.098, name: 'Potassium' },
  Ca: { mass: 40.078, name: 'Calcium' },
  Sc: { mass: 44.956, name: 'Scandium' },
  Ti: { mass: 47.867, name: 'Titanium' },
  V: { mass: 50.942, name: 'Vanadium' },
  Cr: { mass: 51.996, name: 'Chromium' },
  Mn: { mass: 54.938, name: 'Manganese' },
  Fe: { mass: 55.845, name: 'Iron' },
  Co: { mass: 58.933, name: 'Cobalt' },
  Ni: { mass: 58.693, name: 'Nickel' },
  Cu: { mass: 63.546, name: 'Copper' },
  Zn: { mass: 65.38, name: 'Zinc' },
  Ga: { mass: 69.723, name: 'Gallium' },
  Ge: { mass: 72.63, name: 'Germanium' },
  As: { mass: 74.922, name: 'Arsenic' },
  Se: { mass: 78.971, name: 'Selenium' },
  Br: { mass: 79.904, name: 'Bromine' },
  Kr: { mass: 83.798, name: 'Krypton' },
  Rb: { mass: 85.468, name: 'Rubidium' },
  Sr: { mass: 87.62, name: 'Strontium' },
  Ag: { mass: 107.868, name: 'Silver' },
  Cd: { mass: 112.414, name: 'Cadmium' },
  Sn: { mass: 118.71, name: 'Tin' },
  Sb: { mass: 121.76, name: 'Antimony' },
  I: { mass: 126.904, name: 'Iodine' },
  Ba: { mass: 137.327, name: 'Barium' },
  Pt: { mass: 195.084, name: 'Platinum' },
  Au: { mass: 196.967, name: 'Gold' },
  Hg: { mass: 200.592, name: 'Mercury' },
  Pb: { mass: 207.2, name: 'Lead' },
  Bi: { mass: 208.98, name: 'Bismuth' },
  U: { mass: 238.029, name: 'Uranium' },
};

export interface ParsedCompound {
  raw: string;
  cleanFormula: string;
  elements: Record<string, number>;
  molarMass: number;
}

export interface BalanceResult {
  success: boolean;
  error?: string;
  reactants: { compound: ParsedCompound; coefficient: number }[];
  products: { compound: ParsedCompound; coefficient: number }[];
  reactionType: string;
  balancedEquationLatex: string;
  elementAudit: { element: string; reactantCount: number; productCount: number; isBalanced: boolean }[];
}

export const PRESET_REACTIONS = [
  {
    name: 'Combustion of Propane (LPG)',
    category: 'Combustion',
    equation: 'C3H8 + O2 -> CO2 + H2O',
    desc: 'Classic hydrocarbon combustion in oxygen releasing heat, carbon dioxide and steam.',
  },
  {
    name: 'Cellular Respiration of Glucose',
    category: 'Biochemistry',
    equation: 'C6H12O6 + O2 -> CO2 + H2O',
    desc: 'Biological oxidation of glucose to power cellular ATP synthesis.',
  },
  {
    name: 'Neutralization of Lime & Nitric Acid',
    category: 'Acid-Base',
    equation: 'Ca(OH)2 + HNO3 -> Ca(NO3)2 + H2O',
    desc: 'Strong acid-base reaction forming aqueous calcium nitrate and water.',
  },
  {
    name: 'Permanganate Redox in Acidic Medium',
    category: 'Redox',
    equation: 'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O',
    desc: 'Potassium permanganate oxidation of hydrochloric acid producing chlorine gas.',
  },
  {
    name: 'Alum Precipitate & Sulfate Salt',
    category: 'Precipitation',
    equation: 'Al2(SO4)3 + BaCl2 -> BaSO4 + AlCl3',
    desc: 'Double displacement forming insoluble dense white barium sulfate precipitate.',
  },
  {
    name: 'Thermite Welding Reaction',
    category: 'Redox & Metallurgy',
    equation: 'Al + Fe2O3 -> Al2O3 + Fe',
    desc: 'Exothermic reduction of iron oxide by aluminium powder used to weld railway tracks.',
  },
  {
    name: 'Haber-Bosch Ammonia Synthesis',
    category: 'Industrial',
    equation: 'N2 + H2 -> NH3',
    desc: 'Industrial catalytic synthesis of ammonia fertilizer from atmospheric nitrogen.',
  },
  {
    name: 'Decomposition of Potassium Chlorate',
    category: 'Decomposition',
    equation: 'KClO3 -> KCl + O2',
    desc: 'Thermal decomposition with manganese dioxide catalyst to generate oxygen gas.',
  },
  {
    name: 'Rusting of Iron (Oxidation)',
    category: 'Oxidation',
    equation: 'Fe + O2 -> Fe2O3',
    desc: 'Slow atmospheric oxidation of metallic iron into hydrated iron(III) oxide.',
  },
  {
    name: 'Effervescence: Marble Chips & Acid',
    category: 'Gas Evolution',
    equation: 'CaCO3 + HCl -> CaCl2 + CO2 + H2O',
    desc: 'Acid reaction with metal carbonate releasing effervescent carbon dioxide.',
  },
];

// Parser: extracts chemical elements and counts with nested parenthesis support
export function parseChemicalFormula(formula: string): Record<string, number> {
  const clean = formula.trim().replace(/\([sSlLgG]|aq|AQ\)/g, ''); // strip states like (s), (aq)
  const elementMap: Record<string, number> = {};

  // Tokenize nested parentheses: e.g. Ca(OH)2 or (NH4)2SO4
  const stack: Record<string, number>[] = [{}];
  let i = 0;

  while (i < clean.length) {
    const char = clean[i];

    if (char === '(' || char === '[') {
      stack.push({});
      i++;
    } else if (char === ')' || char === ']') {
      i++;
      // Parse multiplier following bracket
      let numStr = '';
      while (i < clean.length && /[0-9]/.test(clean[i])) {
        numStr += clean[i];
        i++;
      }
      const mult = numStr ? parseInt(numStr, 10) : 1;
      const top = stack.pop() || {};
      const current = stack[stack.length - 1];

      for (const [el, count] of Object.entries(top)) {
        current[el] = (current[el] || 0) + count * mult;
      }
    } else if (/[A-Z]/.test(char)) {
      // Element symbol starts with capital letter
      let sym = char;
      i++;
      if (i < clean.length && /[a-z]/.test(clean[i])) {
        sym += clean[i];
        i++;
      }
      // Parse subscript count
      let numStr = '';
      while (i < clean.length && /[0-9]/.test(clean[i])) {
        numStr += clean[i];
        i++;
      }
      const count = numStr ? parseInt(numStr, 10) : 1;
      const current = stack[stack.length - 1];
      current[sym] = (current[sym] || 0) + count;
    } else {
      i++;
    }
  }

  // Merge remaining
  while (stack.length > 0) {
    const top = stack.pop() || {};
    for (const [el, count] of Object.entries(top)) {
      elementMap[el] = (elementMap[el] || 0) + count;
    }
  }

  return elementMap;
}

export function calculateMolarMass(elements: Record<string, number>): number {
  let total = 0;
  for (const [sym, count] of Object.entries(elements)) {
    const elData = ATOMIC_WEIGHTS[sym];
    const weight = elData ? elData.mass : 12.0; // fallback if exotic
    total += weight * count;
  }
  return total;
}

// Format a chemical formula into LaTeX subscripts: C3H8 -> \text{C}_3\text{H}_8
export function formulaToLatex(formula: string): string {
  const clean = formula.trim();
  return clean.replace(/([A-Z][a-z]?|[()\[\]])(\d+)?/g, (_, sym, num) => {
    return num ? `\\text{${sym}}_{${num}}` : `\\text{${sym}}`;
  });
}

// Rational number helper for Gaussian Elimination
class Fraction {
  num: number;
  den: number;

  constructor(n: number, d: number = 1) {
    if (d === 0) throw new Error('Division by zero');
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = Fraction.gcd(Math.abs(n), d);
    this.num = n / g;
    this.den = d / g;
  }

  static gcd(a: number, b: number): number {
    return b === 0 ? a : Fraction.gcd(b, a % b);
  }

  add(other: Fraction): Fraction {
    return new Fraction(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  sub(other: Fraction): Fraction {
    return new Fraction(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  mul(other: Fraction): Fraction {
    return new Fraction(this.num * other.num, this.den * other.den);
  }

  div(other: Fraction): Fraction {
    return new Fraction(this.num * other.den, this.den * other.num);
  }

  isZero(): boolean {
    return this.num === 0;
  }
}

// Linear Algebra Nullspace Balancer
export function balanceEquation(equationStr: string): BalanceResult {
  const clean = equationStr.replace(/==>|-->|=/g, '->').trim();
  const parts = clean.split('->');

  if (parts.length !== 2) {
    return {
      success: false,
      error: 'Please enter a valid chemical equation with reactants and products separated by "->" or "=" (e.g. C3H8 + O2 -> CO2 + H2O).',
      reactants: [],
      products: [],
      reactionType: 'Unknown',
      balancedEquationLatex: '',
      elementAudit: [],
    };
  }

  const rawReactants = parts[0].split('+').map((s) => s.trim()).filter(Boolean);
  const rawProducts = parts[1].split('+').map((s) => s.trim()).filter(Boolean);

  if (rawReactants.length === 0 || rawProducts.length === 0) {
    return {
      success: false,
      error: 'Both reactants and products must be present (e.g. H2 + O2 -> H2O).',
      reactants: [],
      products: [],
      reactionType: 'Unknown',
      balancedEquationLatex: '',
      elementAudit: [],
    };
  }

  const reactantsParsed: ParsedCompound[] = rawReactants.map((f) => {
    const el = parseChemicalFormula(f);
    return {
      raw: f,
      cleanFormula: f.replace(/\([sSlLgG]|aq|AQ\)/g, '').trim(),
      elements: el,
      molarMass: calculateMolarMass(el),
    };
  });

  const productsParsed: ParsedCompound[] = rawProducts.map((f) => {
    const el = parseChemicalFormula(f);
    return {
      raw: f,
      cleanFormula: f.replace(/\([sSlLgG]|aq|AQ\)/g, '').trim(),
      elements: el,
      molarMass: calculateMolarMass(el),
    };
  });

  // Collect all unique elements
  const allElements = new Set<string>();
  reactantsParsed.forEach((p) => Object.keys(p.elements).forEach((e) => allElements.add(e)));
  productsParsed.forEach((p) => Object.keys(p.elements).forEach((e) => allElements.add(e)));

  const elementList = Array.from(allElements);
  if (elementList.length === 0) {
    return {
      success: false,
      error: 'No recognizable chemical elements detected. Use standard chemical symbols like H, C, O, Fe, Cl.',
      reactants: [],
      products: [],
      reactionType: 'Unknown',
      balancedEquationLatex: '',
      elementAudit: [],
    };
  }

  // Check element consistency
  const reactantElements = new Set<string>();
  reactantsParsed.forEach((p) => Object.keys(p.elements).forEach((e) => reactantElements.add(e)));
  const productElements = new Set<string>();
  productsParsed.forEach((p) => Object.keys(p.elements).forEach((e) => productElements.add(e)));

  for (const el of reactantElements) {
    if (!productElements.has(el)) {
      return {
        success: false,
        error: `Element "${el}" appears on the reactants side but is missing from products. Chemical reactions conserve elements.`,
        reactants: [],
        products: [],
        reactionType: 'Unknown',
        balancedEquationLatex: '',
        elementAudit: [],
      };
    }
  }
  for (const el of productElements) {
    if (!reactantElements.has(el)) {
      return {
        success: false,
        error: `Element "${el}" appears on the products side but was never present in reactants.`,
        reactants: [],
        products: [],
        reactionType: 'Unknown',
        balancedEquationLatex: '',
        elementAudit: [],
      };
    }
  }

  // Set up stoichiometric matrix: rows = elements, cols = compounds
  // Reactants have positive counts, products have negative counts
  const totalCompounds = reactantsParsed.length + productsParsed.length;
  const numRows = elementList.length;
  const numCols = totalCompounds;

  // Build matrix with Fractions
  const matrix: Fraction[][] = [];
  for (let r = 0; r < numRows; r++) {
    const el = elementList[r];
    const row: Fraction[] = [];

    // Reactants (+count)
    for (const rComp of reactantsParsed) {
      row.push(new Fraction(rComp.elements[el] || 0));
    }
    // Products (-count)
    for (const pComp of productsParsed) {
      row.push(new Fraction(-(pComp.elements[el] || 0)));
    }
    matrix.push(row);
  }

  // Gaussian elimination (Reduced Row Echelon Form)
  let lead = 0;
  for (let r = 0; r < numRows; r++) {
    if (lead >= numCols - 1) break;
    let i = r;
    while (matrix[i][lead].isZero()) {
      i++;
      if (i === numRows) {
        i = r;
        lead++;
        if (lead === numCols - 1) break;
      }
    }
    if (lead >= numCols - 1) break;

    // Swap row i and row r
    const temp = matrix[i];
    matrix[i] = matrix[r];
    matrix[r] = temp;

    // Divide pivot row by pivot value
    const pivot = matrix[r][lead];
    if (!pivot.isZero()) {
      for (let j = 0; j < numCols; j++) {
        matrix[r][j] = matrix[r][j].div(pivot);
      }
    }

    // Eliminate other rows
    for (let k = 0; k < numRows; k++) {
      if (k !== r) {
        const factor = matrix[k][lead];
        for (let j = 0; j < numCols; j++) {
          matrix[k][j] = matrix[k][j].sub(factor.mul(matrix[r][j]));
        }
      }
    }
    lead++;
  }

  // Solve nullspace by setting last compound coefficient to 1 and back-substituting
  // Then finding integer scale
  let rawCoeffs: Fraction[] = new Array(numCols).fill(null);
  rawCoeffs[numCols - 1] = new Fraction(1);

  // Solve for earlier variables
  for (let r = numRows - 1; r >= 0; r--) {
    let pivotCol = -1;
    for (let c = 0; c < numCols - 1; c++) {
      if (!matrix[r][c].isZero()) {
        pivotCol = c;
        break;
      }
    }
    if (pivotCol !== -1 && rawCoeffs[pivotCol] === null) {
      let sum = new Fraction(0);
      for (let c = pivotCol + 1; c < numCols; c++) {
        if (rawCoeffs[c] !== null) {
          sum = sum.add(matrix[r][c].mul(rawCoeffs[c]!));
        }
      }
      rawCoeffs[pivotCol] = new Fraction(0).sub(sum);
    }
  }

  // Fallback if null values remain (e.g. multiple independent reactions)
  for (let c = 0; c < numCols; c++) {
    if (rawCoeffs[c] === null || rawCoeffs[c]!.isZero()) {
      rawCoeffs[c] = new Fraction(1);
    }
  }

  // If any coefficients are negative, invert
  const hasNegative = rawCoeffs.some((f) => f.num < 0);
  if (hasNegative) {
    rawCoeffs = rawCoeffs.map((f) => new Fraction(-f.num, f.den));
  }

  // Find LCM of all denominators to get pure integers
  let lcm = 1;
  rawCoeffs.forEach((f) => {
    lcm = (lcm * f.den) / Fraction.gcd(lcm, f.den);
  });

  const integerCoeffs = rawCoeffs.map((f) => Math.round((f.num * lcm) / f.den));

  // Find GCD of all integer coefficients to reduce to smallest whole numbers
  let overallGcd = integerCoeffs[0] || 1;
  for (let i = 1; i < integerCoeffs.length; i++) {
    overallGcd = Fraction.gcd(overallGcd, integerCoeffs[i]);
  }
  const finalCoeffs = integerCoeffs.map((c) => Math.max(1, Math.round(c / overallGcd)));

  // Partition into reactants and products
  const finalReactants = reactantsParsed.map((p, idx) => ({
    compound: p,
    coefficient: finalCoeffs[idx] || 1,
  }));

  const finalProducts = productsParsed.map((p, idx) => ({
    compound: p,
    coefficient: finalCoeffs[reactantsParsed.length + idx] || 1,
  }));

  // Element conservation audit
  const elementAudit = elementList.map((el) => {
    let rCount = 0;
    finalReactants.forEach((r) => {
      rCount += (r.compound.elements[el] || 0) * r.coefficient;
    });
    let pCount = 0;
    finalProducts.forEach((p) => {
      pCount += (p.compound.elements[el] || 0) * p.coefficient;
    });
    return {
      element: el,
      reactantCount: rCount,
      productCount: pCount,
      isBalanced: rCount === pCount,
    };
  });

  const isAllBalanced = elementAudit.every((a) => a.isBalanced);

  // Reaction Classification
  let reactionType = 'Chemical Reaction';
  const rFormulas = reactantsParsed.map((r) => r.cleanFormula);
  const pFormulas = productsParsed.map((p) => p.cleanFormula);

  if (rFormulas.some((f) => f.includes('C') && f.includes('H')) && rFormulas.includes('O2') && pFormulas.includes('CO2')) {
    reactionType = 'Combustion Reaction (Oxidation of Fuel)';
  } else if (
    (rFormulas.some((f) => f.startsWith('H')) && rFormulas.some((f) => f.includes('OH'))) ||
    pFormulas.includes('H2O')
  ) {
    reactionType = 'Neutralization (Acid-Base Reaction)';
  } else if (reactantsParsed.length === 1 && productsParsed.length > 1) {
    reactionType = 'Thermal / Catalytic Decomposition';
  } else if (reactantsParsed.length > 1 && productsParsed.length === 1) {
    reactionType = 'Synthesis / Combination Reaction';
  } else if (reactantsParsed.some((r) => Object.keys(r.elements).length === 1) && productsParsed.some((p) => Object.keys(p.elements).length === 1)) {
    reactionType = 'Single Displacement (Redox Activity Series)';
  } else if (reactantsParsed.length === 2 && productsParsed.length === 2) {
    reactionType = 'Double Displacement / Precipitation';
  }

  // Build balanced LaTeX string
  const rLatex = finalReactants
    .map((r) => `${r.coefficient > 1 ? `\\mathbf{${r.coefficient}}\\,` : ''}${formulaToLatex(r.compound.cleanFormula)}`)
    .join(' \\;+\\; ');

  const pLatex = finalProducts
    .map((p) => `${p.coefficient > 1 ? `\\mathbf{${p.coefficient}}\\,` : ''}${formulaToLatex(p.compound.cleanFormula)}`)
    .join(' \\;+\\; ');

  const balancedEquationLatex = `${rLatex} \\;\\longrightarrow\\; ${pLatex}`;

  return {
    success: isAllBalanced,
    error: isAllBalanced ? undefined : 'Could not mathematically balance this reaction. Check chemical formulas.',
    reactants: finalReactants,
    products: finalProducts,
    reactionType,
    balancedEquationLatex,
    elementAudit,
  };
}

interface ChemBalancerLabViewProps {
  onOpenInGemini?: (prompt: string, subject?: string) => void;
}

export const ChemBalancerLabView: React.FC<ChemBalancerLabViewProps> = ({ onOpenInGemini }) => {
  // Primary Equation Input
  const [equationInput, setEquationInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Stoichiometry Calculator States
  const [selectedSpeciesIndex, setSelectedSpeciesIndex] = useState<number>(0);
  const [inputAmountType, setInputAmountType] = useState<'mass' | 'moles' | 'volume'>('mass');
  const [inputAmountValue, setInputAmountValue] = useState<string>('44.1'); // grams of propane
  const [actualYieldValue, setActualYieldValue] = useState<string>(''); // grams obtained

  // Multi-Reactant Limiting Reagent Checker
  const [limitingReactantAmounts, setLimitingReactantAmounts] = useState<Record<string, { value: string; unit: 'g' | 'mol' }>>({
    '0': { value: '44.1', unit: 'g' }, // Reactant 1
    '1': { value: '160.0', unit: 'g' }, // Reactant 2
  });

  // Calculate balance results
  const balanceData = useMemo(() => {
    return balanceEquation(equationInput);
  }, [equationInput]);

  const allSpecies = useMemo(() => {
    if (!balanceData.success) return [];
    return [
      ...balanceData.reactants.map((r, i) => ({ ...r, role: 'Reactant', key: `r_${i}`, globalIdx: i })),
      ...balanceData.products.map((p, i) => ({
        ...p,
        role: 'Product',
        key: `p_${i}`,
        globalIdx: balanceData.reactants.length + i,
      })),
    ];
  }, [balanceData]);

  // Stoichiometry calculations based on selected species
  const stoichiometryResult = useMemo(() => {
    if (!balanceData.success || allSpecies.length === 0) return null;

    const baseSpecies = allSpecies[selectedSpeciesIndex] || allSpecies[0];
    const val = parseFloat(inputAmountValue);
    if (isNaN(val) || val <= 0) return null;

    let baseMoles = 0;
    if (inputAmountType === 'mass') {
      baseMoles = val / baseSpecies.compound.molarMass;
    } else if (inputAmountType === 'moles') {
      baseMoles = val;
    } else if (inputAmountType === 'volume') {
      // 22.414 L/mol at STP
      baseMoles = val / 22.414;
    }

    // Reaction progression factor (moles per stoichiometric unit)
    const reactionExtent = baseMoles / baseSpecies.coefficient;

    // Compute expected moles and masses for all species
    const speciesBreakdown = allSpecies.map((sp) => {
      const expectedMoles = reactionExtent * sp.coefficient;
      const expectedGrams = expectedMoles * sp.compound.molarMass;
      const expectedGasVolumeSTP = expectedMoles * 22.414; // in Liters / dm^3

      return {
        ...sp,
        moles: expectedMoles,
        grams: expectedGrams,
        volumeSTP: expectedGasVolumeSTP,
      };
    });

    // Percentage yield if user entered actual yield
    let percentageYield: number | null = null;
    const actualGrams = parseFloat(actualYieldValue);
    if (!isNaN(actualGrams) && actualGrams > 0) {
      const primaryProduct = speciesBreakdown.find((s) => s.role === 'Product');
      if (primaryProduct && primaryProduct.grams > 0) {
        percentageYield = Math.min(100, Math.round((actualGrams / primaryProduct.grams) * 1000) / 10);
      }
    }

    return {
      baseSpecies,
      baseMoles,
      reactionExtent,
      speciesBreakdown,
      percentageYield,
    };
  }, [balanceData, allSpecies, selectedSpeciesIndex, inputAmountType, inputAmountValue, actualYieldValue]);

  // Limiting Reagent Analysis when multiple reactants provided
  const limitingAnalysis = useMemo(() => {
    if (!balanceData.success || balanceData.reactants.length < 2) return null;

    const reactantCalcs = balanceData.reactants.map((r, idx) => {
      const input = limitingReactantAmounts[String(idx)] || { value: '', unit: 'g' };
      const val = parseFloat(input.value);
      if (isNaN(val) || val <= 0) return null;

      const moles = input.unit === 'g' ? val / r.compound.molarMass : val;
      const extent = moles / r.coefficient;

      return {
        compound: r.compound,
        coefficient: r.coefficient,
        moles,
        extent,
        inputGrams: input.unit === 'g' ? val : val * r.compound.molarMass,
      };
    });

    if (reactantCalcs.some((c) => c === null)) return null;
    const validCalcs = reactantCalcs as NonNullable<(typeof reactantCalcs)[number]>[];

    // Find smallest extent -> Limiting reagent!
    let minExtent = Infinity;
    let limitingIdx = 0;
    validCalcs.forEach((c, i) => {
      if (c.extent < minExtent) {
        minExtent = c.extent;
        limitingIdx = i;
      }
    });

    const limiting = validCalcs[limitingIdx];
    const excessList = validCalcs
      .map((c, i) => {
        if (i === limitingIdx) return null;
        const molesUsed = minExtent * c.coefficient;
        const molesLeft = c.moles - molesUsed;
        const gramsLeft = molesLeft * c.compound.molarMass;
        return {
          compound: c.compound,
          molesLeft,
          gramsLeft,
          molesUsed,
          gramsUsed: molesUsed * c.compound.molarMass,
        };
      })
      .filter(Boolean);

    return {
      limiting,
      excessList,
      maxExtent: minExtent,
    };
  }, [balanceData, limitingReactantAmounts]);

  const handleCopyEquation = () => {
    if (!balanceData.success) return;
    const plainText = `${balanceData.reactants.map((r) => `${r.coefficient > 1 ? r.coefficient : ''}${r.compound.cleanFormula}`).join(' + ')} -> ${balanceData.products.map((p) => `${p.coefficient > 1 ? p.coefficient : ''}${p.compound.cleanFormula}`).join(' + ')}`;
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12 select-none">
      {/* Hero Header */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#FFFFFF] tracking-tight">
                Chemical Equation Balancer & Stoichiometry Engine
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-2xl leading-relaxed">
              Balance any chemical reaction using exact stoichiometric conservation of mass, determine limiting reagents, calculate theoretical yield, and explore molar masses.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenInGemini && (
              <button
                type="button"
                onClick={() => {
                  const prompt = `Please provide a detailed step-by-step chemistry tutor analysis of this reaction:
EQUATION: ${equationInput}
BALANCED FORM: ${balanceData.balancedEquationLatex}
REACTION TYPE: ${balanceData.reactionType}

INSTRUCTIONS:
1. Explain the reaction mechanism and oxidation states.
2. Detail how each atom is conserved.
3. Show common exam traps and industrial applications.`;
                  onOpenInGemini(prompt, 'Chemistry');
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-500/20 hover:from-emerald-600/30 hover:to-teal-500/30 text-[#22C55E] border border-[#22C55E]/40 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-[#22C55E]" />
                <span>Explain Reaction with AI</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Equation Input & Live Balancer Card */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
              <span>Enter Any Chemical Equation:</span>
            </label>
            <span className="text-[11px] text-[#71717A]">
              Separate with <code className="text-emerald-400 font-mono">+</code> and <code className="text-emerald-400 font-mono">{'->'}</code>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={equationInput}
                onChange={(e) => setEquationInput(e.target.value)}
                placeholder="e.g. C3H8 + O2 -> CO2 + H2O, KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O"
                className="w-full p-3.5 rounded-2xl bg-[#000000] border border-[#27272A] text-sm sm:text-base font-mono font-bold text-white placeholder:text-zinc-600 focus:border-[#22C55E] focus:outline-none transition-all shadow-inner"
              />
            </div>

            <button
              type="button"
              onClick={handleCopyEquation}
              disabled={!balanceData.success}
              className="px-4 py-3 rounded-2xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#27272A] text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
              title="Copy balanced equation"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="space-y-2 pt-1 border-t border-[#27272A]/70">
          <div className="flex items-center justify-between text-[11px] text-[#A1A1AA]">
            <span className="font-bold text-white">High-Yield Exam Presets:</span>
            <span>Tap to load</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_REACTIONS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setEquationInput(preset.equation)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-95 border ${
                  equationInput === preset.equation
                    ? 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/40 font-bold'
                    : 'bg-[#121216] text-[#A1A1AA] border-[#27272A] hover:text-white hover:border-[#22C55E]/40'
                }`}
                title={preset.desc}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Balancer Output Display */}
        {!equationInput.trim() ? (
          <div className="p-6 rounded-2xl bg-[#08080C] border border-[#27272A] text-center space-y-2">
            <FlaskConical className="w-8 h-8 text-emerald-400/50 mx-auto" />
            <p className="text-sm font-bold text-white">Enter a chemical reaction above</p>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Type any equation (e.g. <code className="text-emerald-400">C3H8 + O2 -&gt; CO2 + H2O</code>) or tap one of the high-yield presets to calculate balanced coefficients and atom audits.
            </p>
          </div>
        ) : balanceData.success ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#000000] border border-[#22C55E]/40 space-y-4 animate-fadeIn shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#27272A]">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#22C55E]">
                  Balanced Chemical Reaction
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold">
                {balanceData.reactionType}
              </span>
            </div>

            {/* LaTeX Formula with Highlighted Coefficients */}
            <div className="py-2 text-center overflow-x-auto touch-pan-x overscroll-x-contain formula-scroll-container">
              <MathRenderer content={`$$${balanceData.balancedEquationLatex}$$`} displayMode={true} />
            </div>

            {/* Stoichiometric Compounds & Molar Masses Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {[...balanceData.reactants, ...balanceData.products].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#0A0A0A] border border-[#27272A] space-y-1 text-center font-mono"
                >
                  <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block font-sans">
                    {idx < balanceData.reactants.length ? 'Reactant' : 'Product'}
                  </span>
                  <div className="text-sm font-black text-white truncate">{item.compound.cleanFormula}</div>
                  <div className="text-xs font-bold text-emerald-400">
                    {item.coefficient} mol · {item.compound.molarMass.toFixed(2)} g/mol
                  </div>
                </div>
              ))}
            </div>

            {/* Atom Count Conservation Table */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block">
                Law of Conservation of Mass (Atom Audit):
              </span>
              <div className="overflow-x-auto rounded-xl border border-[#27272A] bg-[#0A0A0A]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#121217] text-[#A1A1AA] border-b border-[#27272A]">
                    <tr>
                      <th className="p-2.5">Element</th>
                      <th className="p-2.5">Element Name</th>
                      <th className="p-2.5 text-center">Reactant Atoms</th>
                      <th className="p-2.5 text-center">Product Atoms</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]/50">
                    {balanceData.elementAudit.map((row) => (
                      <tr key={row.element} className="hover:bg-white/5 transition-colors">
                        <td className="p-2.5 font-bold text-white">{row.element}</td>
                        <td className="p-2.5 text-[#A1A1AA]">{ATOMIC_WEIGHTS[row.element]?.name || 'Unknown'}</td>
                        <td className="p-2.5 text-center font-bold text-sky-400">{row.reactantCount}</td>
                        <td className="p-2.5 text-center font-bold text-sky-400">{row.productCount}</td>
                        <td className="p-2.5 text-center">
                          <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold">
                            <Check className="w-3.5 h-3.5" />
                            <span>Balanced</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">{balanceData.error}</p>
              <p className="text-[11px] text-zinc-400">
                Tip: Enter chemical formulas like <code className="text-white">C3H8 + O2 -&gt; CO2 + H2O</code>. Capitalize elements accurately (e.g. <code className="text-white">Na</code>, <code className="text-white">Cl</code>, <code className="text-white">Fe</code>).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Stoichiometry & Yield Engine */}
      {balanceData.success && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module 1: Single Compound Mole & Grams Conversion */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#27272A]">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Stoichiometric Yield & Mole Conversion
              </h3>
            </div>

            <div className="space-y-3">
              {/* Select known species */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#A1A1AA] font-bold">Choose Known Substance:</label>
                <select
                  value={selectedSpeciesIndex}
                  onChange={(e) => setSelectedSpeciesIndex(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 rounded-xl bg-[#000000] border border-[#27272A] text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                >
                  {allSpecies.map((sp, idx) => (
                    <option key={sp.key} value={idx}>
                      {sp.compound.cleanFormula} ({sp.role}, {sp.coefficient} mol, M = {sp.compound.molarMass.toFixed(2)} g/mol)
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount input with Unit toggle */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#A1A1AA] font-bold">Known Quantity & Unit:</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    value={inputAmountValue}
                    onChange={(e) => setInputAmountValue(e.target.value)}
                    placeholder="Enter amount..."
                    className="flex-1 p-2.5 rounded-xl bg-[#000000] border border-[#27272A] text-xs font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <div className="flex bg-[#121217] rounded-xl p-1 border border-[#27272A]">
                    {(['mass', 'moles', 'volume'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setInputAmountType(type)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          inputAmountType === type
                            ? 'bg-[#22C55E] text-black font-black'
                            : 'text-[#A1A1AA] hover:text-white'
                        }`}
                      >
                        {type === 'mass' ? 'Grams (g)' : type === 'moles' ? 'Moles (mol)' : 'Liters (STP)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Actual Yield for % Yield calculation */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs text-[#A1A1AA] font-bold flex items-center justify-between">
                  <span>Actual Lab Yield Obtained (Optional):</span>
                  <span className="text-[10px] text-zinc-500">To calculate % yield</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="any"
                    value={actualYieldValue}
                    onChange={(e) => setActualYieldValue(e.target.value)}
                    placeholder="e.g. 110.0 grams"
                    className="flex-1 p-2.5 rounded-xl bg-[#000000] border border-[#27272A] text-xs font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-xs text-[#A1A1AA] font-bold">grams</span>
                </div>
              </div>
            </div>

            {/* Calculated Breakdown List */}
            {stoichiometryResult && (
              <div className="pt-2 space-y-2 border-t border-[#27272A]">
                <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block">
                  Theoretical Stoichiometric Quantities:
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {stoichiometryResult.speciesBreakdown.map((item) => (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl bg-[#050507] border border-[#27272A] flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="font-bold text-white text-sm block">{item.compound.cleanFormula}</span>
                        <span className="text-[11px] text-[#A1A1AA]">
                          {item.role} · M = {item.compound.molarMass.toFixed(2)} g/mol
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold block">{item.grams.toFixed(2)} g</span>
                        <span className="text-[#A1A1AA] text-[11px]">
                          {item.moles.toFixed(3)} mol ({item.volumeSTP.toFixed(2)} L)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {stoichiometryResult.percentageYield !== null && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Calculated Percentage Yield:</span>
                    <span className="text-sm font-black text-emerald-400">
                      {stoichiometryResult.percentageYield}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Module 2: Limiting Reagent & Excess Analyzer */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#27272A]">
              <Layers className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Limiting & Excess Reagent Analyzer
              </h3>
            </div>

            {balanceData.reactants.length < 2 ? (
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-[#27272A] text-xs text-zinc-400">
                This reaction only has 1 reactant. Enter a reaction with 2 or more reactants to analyze the limiting reagent.
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#A1A1AA]">
                  Enter the initial amounts of each reactant present in the reaction vessel:
                </p>

                <div className="space-y-2.5">
                  {balanceData.reactants.map((r, idx) => {
                    const current = limitingReactantAmounts[String(idx)] || { value: '', unit: 'g' };
                    return (
                      <div key={idx} className="p-3 rounded-xl bg-[#050507] border border-[#27272A] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            Reactant {idx + 1}: <strong className="text-emerald-400">{r.compound.cleanFormula}</strong>
                          </span>
                          <span className="text-[11px] text-zinc-500">M = {r.compound.molarMass.toFixed(2)} g/mol</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="any"
                            value={current.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLimitingReactantAmounts((prev) => ({
                                ...prev,
                                [String(idx)]: { ...current, value: val },
                              }));
                            }}
                            placeholder="Initial amount..."
                            className="flex-1 p-2 rounded-lg bg-[#000000] border border-[#27272A] text-xs font-mono font-bold text-white focus:border-sky-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextUnit = current.unit === 'g' ? 'mol' : 'g';
                              setLimitingReactantAmounts((prev) => ({
                                ...prev,
                                [String(idx)]: { ...current, unit: nextUnit },
                              }));
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] text-xs font-bold text-sky-400 cursor-pointer"
                          >
                            {current.unit === 'g' ? 'Grams (g)' : 'Moles (mol)'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Limiting Reagent Verdict Card */}
                {limitingAnalysis && (
                  <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-2.5 animate-fadeIn text-xs">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-sky-400" />
                      <span className="font-bold text-white">
                        Limiting Reagent: <strong className="text-sky-300 font-mono">{limitingAnalysis.limiting.compound.cleanFormula}</strong>
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      {limitingAnalysis.limiting.compound.cleanFormula} runs out first ({limitingAnalysis.limiting.moles.toFixed(3)} moles provided, giving maximum reaction extent of {limitingAnalysis.maxExtent.toFixed(4)} moles).
                    </p>

                    {limitingAnalysis.excessList.length > 0 && (
                      <div className="pt-2 border-t border-sky-500/20 space-y-1">
                        <span className="font-bold text-zinc-400 uppercase text-[10px] block">
                          Excess Reagent Remaining:
                        </span>
                        {limitingAnalysis.excessList.map((ex, i) => (
                          <div key={i} className="flex justify-between items-center text-zinc-300 font-mono text-[11px]">
                            <span>{ex?.compound.cleanFormula}:</span>
                            <span className="font-bold text-amber-300">
                              {ex?.gramsLeft.toFixed(2)} g left over ({ex?.molesLeft.toFixed(3)} mol unreacted)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
