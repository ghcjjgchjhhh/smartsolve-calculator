/**
 * Common types and data structures for SmartSolve Calculator
 */

export interface StepSolution {
  title: string;
  category: 'Mathematics' | 'Physics' | 'Equation Solver' | 'Scientific' | 'Unit Converter' | 'AI Solver' | string;
  subCategory?: string;
  problemStatement?: string;
  formula: string;
  rearrangedFormula?: string;
  givenValues?: {
    name: string;
    symbol: string;
    value: string;
    unit?: string;
  }[];
  whatIsRequired?: string;
  substitution: string;
  steps: string[];
  finalAnswer: string;
  unit?: string;
  explanation?: string;
  tips?: string;
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
  subject: 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'English' | 'Literature' | 'Economics' | string;
  year?: string;
  examYear?: string;
  exam: 'JAMB/UTME' | 'WAEC/WASSCE' | 'JUPEB' | 'University Practice' | 'JAMB UTME' | 'WAEC SSCE' | 'University Level' | string;
  level?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  topic: string;
  question: string;
  givenValues?: string;
  whatIsRequired?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  formula: string;
  substitution?: string;
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
