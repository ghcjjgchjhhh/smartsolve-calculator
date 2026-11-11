import { StepSolution } from '../types';
import { solveLinear, solveQuadratic, parsePolynomial } from './mathEngine';
import { PHYSICS_FORMULAS, solvePhysicsFormula } from './physicsEngine';

export interface EquationParseResult {
  type: 'algebraic' | 'physics_matched' | 'custom_formula';
  variableName?: string;
  matchedFormulaId?: string;
  formulaTitle?: string;
  variablesFound: string[];
  suggestedVariablesToSolve: string[];
}

export function normalizeEquation(eq: string): string {
  return eq
    .trim()
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/½/g, '0.5');
}

/**
 * Analyzes an equation
 */
export function analyzeEquation(rawEq: string): EquationParseResult {
  const clean = normalizeEquation(rawEq);

  for (const f of PHYSICS_FORMULAS) {
    const baseClean = normalizeEquation(f.baseFormula);
    if (clean.toLowerCase() === baseClean.toLowerCase()) {
      return {
        type: 'physics_matched',
        matchedFormulaId: f.id,
        formulaTitle: f.name,
        variablesFound: f.variables.map((v) => v.symbol),
        suggestedVariablesToSolve: Object.keys(f.solveFor),
      };
    }
  }

  // Common physics formula aliases
  if (/^v\s*=\s*u\s*\+\s*at$/i.test(clean)) {
    return {
      type: 'physics_matched',
      matchedFormulaId: 'acceleration',
      formulaTitle: 'Acceleration & Velocity (v = u + at)',
      variablesFound: ['v', 'u', 'a', 't'],
      suggestedVariablesToSolve: ['a', 'v', 'u', 't'],
    };
  }
  if (/^f\s*=\s*m\s*\*?\s*a$/i.test(clean)) {
    return {
      type: 'physics_matched',
      matchedFormulaId: 'newton_second_law',
      formulaTitle: "Newton's Second Law (F = ma)",
      variablesFound: ['F', 'm', 'a'],
      suggestedVariablesToSolve: ['F', 'm', 'a'],
    };
  }
  if (/^v\s*=\s*i\s*\*?\s*r$/i.test(clean)) {
    return {
      type: 'physics_matched',
      matchedFormulaId: 'ohms_law',
      formulaTitle: "Ohm's Law (V = IR)",
      variablesFound: ['V', 'I', 'R'],
      suggestedVariablesToSolve: ['V', 'I', 'R'],
    };
  }
  if (/^s\s*=\s*ut\s*\+\s*0?\.?5a?t\^?2$/i.test(clean)) {
    return {
      type: 'physics_matched',
      matchedFormulaId: 'motion_s_ut_half_at2',
      formulaTitle: 'Displacement (s = ut + ½at²)',
      variablesFound: ['s', 'u', 'a', 't'],
      suggestedVariablesToSolve: ['s', 'u', 'a'],
    };
  }
  if (/^p\s*=\s*f\s*\/\s*a$/i.test(clean)) {
    return {
      type: 'physics_matched',
      matchedFormulaId: 'pressure',
      formulaTitle: 'Pressure (P = F / A)',
      variablesFound: ['P', 'F', 'A'],
      suggestedVariablesToSolve: ['P', 'F', 'A'],
    };
  }

  // Detect algebraic variables (excluding scientific functions like sin, cos, tan, log, ln, sqrt)
  const strippedOfFunctions = rawEq
    .replace(/\b(sin|cos|tan|asin|acos|atan|log|ln|sqrt|abs)\b/gi, '')
    .replace(/\b(pi)\b/gi, '');
  const letters = Array.from(new Set(strippedOfFunctions.match(/[a-zA-Z]/g) || []));

  if (letters.length === 1) {
    const variable = letters[0];
    return {
      type: 'algebraic',
      variableName: variable,
      variablesFound: [variable],
      suggestedVariablesToSolve: [variable],
    };
  }

  return {
    type: 'custom_formula',
    variablesFound: letters,
    suggestedVariablesToSolve: letters,
  };
}

/**
 * Expand simple brackets like 2(x + 3) -> 2*x + 6 or 3(2x - 4) -> 6x - 12
 */
function expandSimpleParentheses(expr: string, v: string): string {
  // Matches a(bx + c) or a(bx - c) or (bx + c)a
  let result = expr;
  let prev = '';
  // Repeat while brackets exist to handle multiple groups
  while (result !== prev && result.includes('(')) {
    prev = result;
    result = result.replace(/([+-]?\d+(?:\.\d+)?)\s*\(\s*([+-]?\d*(?:\.\d+)?)\s*([a-zA-Z])\s*([+-]\s*\d+(?:\.\d+)?)\s*\)/g, 
      (_, mult, coeffStr, varChar, constStr) => {
        const m = parseFloat(mult);
        const c = coeffStr === '' ? 1 : coeffStr === '-' ? -1 : parseFloat(coeffStr);
        const k = parseFloat(constStr.replace(/\s+/g, ''));
        const newCoeff = m * c;
        const newConst = m * k;
        const constSign = newConst >= 0 ? `+${newConst}` : `${newConst}`;
        return `+${newCoeff}${varChar}${constSign}`;
      }
    );
  }
  return result;
}

/**
 * Robust equation solver for linear and quadratic equations
 */
export function solveSingleVariableEquation(rawEq: string): StepSolution {
  const clean = normalizeEquation(rawEq);
  if (!clean.includes('=')) {
    throw new Error('An equation must contain an equals sign (=). E.g. "2x + 5 = 15"');
  }

  const parts = clean.split('=');
  if (parts.length !== 2) {
    throw new Error('Invalid equation format with multiple "=" signs.');
  }

  let lhs = parts[0];
  let rhs = parts[1];

  const stripped = clean.replace(/\b(sin|cos|tan|log|ln|sqrt)\b/gi, '');
  const letters = Array.from(new Set(stripped.match(/[a-zA-Z]/g) || []));

  if (letters.length === 0) {
    throw new Error('No variable found in equation. Please enter an equation with a variable, e.g. "2x + 5 = 15".');
  }
  if (letters.length > 1) {
    throw new Error(`Multiple variables found (${letters.join(', ')}). Single-variable solver supports 1 variable.`);
  }

  const v = letters[0];

  // Expand parentheses if present
  lhs = expandSimpleParentheses(lhs, v);
  rhs = expandSimpleParentheses(rhs, v);

  // Parse polynomial terms on LHS and RHS
  const leftTerms = parsePolynomial(lhs, v);
  const rightTerms = parsePolynomial(rhs, v);

  // Form (lhs) - (rhs) = 0: a*x^2 + b*x + c = 0
  let totalA = 0; // x^2
  let totalB = 0; // x^1
  let totalC = 0; // x^0 (constant)

  leftTerms.forEach((t) => {
    if (t.power === 2) totalA += t.coeff;
    else if (t.power === 1) totalB += t.coeff;
    else if (t.power === 0) totalC += t.coeff;
    else if (t.power > 2) throw new Error(`Polynomial degree ${t.power} is higher than quadratic (degree 2).`);
  });

  rightTerms.forEach((t) => {
    if (t.power === 2) totalA -= t.coeff;
    else if (t.power === 1) totalB -= t.coeff;
    else if (t.power === 0) totalC -= t.coeff;
    else if (t.power > 2) throw new Error(`Polynomial degree ${t.power} is higher than quadratic (degree 2).`);
  });

  if (Math.abs(totalA) > 1e-9) {
    // Quadratic equation: totalA*x^2 + totalB*x + totalC = 0
    return solveQuadratic(totalA, totalB, totalC, 'formula');
  } else {
    // Linear equation: totalB*x + totalC = 0 => totalB*x = -totalC
    return solveLinear(totalB, totalC, 0, 0);
  }
}
