/**
 * Common types and data structures for SmartSolve Calculator
 */

export interface StepSolution {
  title: string;
  category: 'Mathematics' | 'Physics' | 'Equation Solver' | 'Scientific' | 'Unit Converter';
  subCategory?: string;
  problemStatement?: string;
  formula: string;
  rearrangedFormula?: string;
  substitution: string;
  steps: string[];
  finalAnswer: string;
  unit?: string;
  notes?: string;
  timestamp?: number;
}

export interface HistoryItem extends StepSolution {
  id: string;
  timestamp: number;
}

export interface FormulaParameter {
  symbol: string;
  name: string;
  unit: string;
  description?: string;
  defaultValue?: number;
  min?: number;
  step?: number;
}

export interface PhysicsFormulaDefinition {
  id: string;
  category: string;
  name: string;
  baseFormula: string;
  variables: FormulaParameter[];
  // Map of target variable symbol -> function to calculate it and steps
  solveFor: Record<
    string,
    {
      rearrangedFormula: string;
      unit: string;
      calculate: (inputs: Record<string, number>) => {
        result: number;
        steps: string[];
        substitution: string;
      };
    }
  >;
  description: string;
  jambRelevance?: string;
}

export interface JambQuestion {
  id: string;
  subject: 'Mathematics' | 'Physics';
  year?: string;
  exam: 'JAMB UTME' | 'WAEC SSCE' | 'NECO';
  topic: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  formula: string;
  steps: string[];
  explanation: string;
  examTip?: string;
}

export interface UnitCategory {
  name: string;
  icon: string;
  baseUnit: string;
  units: {
    id: string;
    name: string;
    symbol: string;
    toBase: (val: number) => number;
    fromBase: (val: number) => number;
    description?: string;
  }[];
}
