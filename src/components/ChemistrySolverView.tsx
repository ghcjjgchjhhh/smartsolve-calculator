import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Play,
  Pause,
  Upload,
  Camera,
  X,
  Eye,
  FileText,
  Activity,
  Mic,
  MicOff,
  Table,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { MathRenderer } from './MathRenderer';
import { useVoiceInput } from '../hooks/useVoiceInput';
import {
  ATOMIC_WEIGHTS,
  ParsedCompound,
  BalanceResult,
  balanceEquation,
  PRESET_REACTIONS,
} from './ChemBalancerLabView';

export interface ChemistrySolution {
  title?: string;
  category?: string;
  subCategory?: string;
  problemStatement?: string;
  problemRestatement?: string;
  whatIsRequired?: string;
  formula?: string;
  rearrangedFormula?: string;
  whyFormula?: string;
  given?: string;
  givenValues?: Array<{
    name?: string;
    symbol?: string;
    value?: string | number;
    unit?: string;
  }>;
  substitution?: string;
  steps?: string[];
  detailedDerivation?: string[];
  finalAnswer?: string;
  unit?: string;
  explanation?: string;
  intuitiveConcept?: string;
  tips?: string;
  examTip?: string;
  alternativeMethod?: string;
  commonMistakes?: string;
}

export interface ChemistrySolverViewProps {
  onOpenInGemini?: (prompt: string, subject?: string) => void;
}

export type SolverTab = 'ai_solver' | 'balancer' | 'empirical' | 'electrochem' | 'ice_table' | 'diagrams';

// Curated High-Yield Syllabus Chemistry Problems
export const CHEMISTRY_EXAM_PRESETS = [
  {
    title: 'Empirical & Molecular Formula',
    exam: 'WAEC / JAMB',
    topic: 'Stoichiometry & Analysis',
    question:
      'A compound contains 40.0% Carbon, 6.7% Hydrogen, and 53.3% Oxygen by mass. If its relative molecular mass is 180 g/mol, calculate: (a) The empirical formula, (b) The molecular formula of the compound. [C = 12, H = 1, O = 16]',
  },
  {
    title: 'Hess’s Law & Enthalpy of Combustion',
    exam: 'JUPEB / University',
    topic: 'Thermodynamics & Thermochemistry',
    question:
      'Given the standard enthalpies of formation:\nΔH°f [CO2(g)] = -393.5 kJ/mol\nΔH°f [H2O(l)] = -285.8 kJ/mol\nΔH°f [C3H8(g)] = -103.8 kJ/mol\nCalculate the standard enthalpy of combustion (ΔH°c) for 1 mole of propane gas (C3H8) according to:\nC3H8(g) + 5O2(g) -> 3CO2(g) + 4H2O(l).',
  },
  {
    title: 'Equilibrium Constant & ICE Table',
    exam: 'JUPEB / A-Level',
    topic: 'Chemical Equilibrium',
    question:
      'At 450°C, a 2.0 dm³ vessel is filled with 1.00 mol of N2 and 3.00 mol of H2. At equilibrium, 0.40 mol of NH3 is present according to:\nN2(g) + 3H2(g) <=> 2NH3(g).\nConstruct an ICE table and calculate the equilibrium constant Kc at this temperature.',
  },
  {
    title: 'Faraday’s 1st Law of Electrolysis',
    exam: 'WAEC / JAMB',
    topic: 'Electrochemistry',
    question:
      'A steady electric current of 5.0 A is passed through an aqueous copper(II) sulfate (CuSO4) solution for 40 minutes and 15 seconds. Calculate the mass of copper metal deposited at the cathode. [Cu = 63.55 g/mol, Faraday constant F = 96,500 C/mol]',
  },
  {
    title: 'Buffer Solution & Henderson-Hasselbalch pH',
    exam: 'University Chemistry 101',
    topic: 'Acids, Bases & Buffers',
    question:
      'A buffer solution is prepared by mixing 500 mL of 0.20 M ethanoic acid (CH3COOH) and 500 mL of 0.30 M sodium ethanoate (CH3COONa). Given Ka for CH3COOH = 1.8 x 10^-5 (pKa = 4.74), calculate:\n(a) The pH of the buffer solution\n(b) The pH change after adding 0.02 mol of solid NaOH.',
  },
  {
    title: 'Colligative Properties & Molar Mass',
    exam: 'JUPEB / University',
    topic: 'Solutions & Colligative Properties',
    question:
      'When 15.0 g of an unknown non-volatile, non-electrolyte solute is dissolved in 250 g of water, the freezing point of the solution is found to be -0.620°C. Calculate the molar mass of the solute. [Kf for water = 1.86 °C·kg/mol]',
  },
];

export const ChemistrySolverView: React.FC<ChemistrySolverViewProps> = ({ onOpenInGemini }) => {
  const [activeTab, setActiveTab] = useState<SolverTab>('ai_solver');

  // AI Chemistry Solver State
  const [questionPrompt, setQuestionPrompt] = useState<string>('');
  const [examLevel, setExamLevel] = useState<string>('JUPEB / WAEC / JAMB & University');
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solveError, setSolveError] = useState<string | null>(null);
  const [aiSolution, setAiSolution] = useState<ChemistrySolution | null>(null);
  const [copiedSolution, setCopiedSolution] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const solutionCardRef = useRef<HTMLDivElement | null>(null);

  // Equation Balancer States
  const [equationInput, setEquationInput] = useState<string>('');
  const [copiedEquation, setCopiedEquation] = useState<boolean>(false);

  // Empirical Formula Workstation States
  const [empiricalElements, setEmpiricalElements] = useState<
    { element: string; massOrPercent: string; atomicWeight: number }[]
  >([
    { element: 'C', massOrPercent: '40.0', atomicWeight: 12.011 },
    { element: 'H', massOrPercent: '6.7', atomicWeight: 1.008 },
    { element: 'O', massOrPercent: '53.3', atomicWeight: 15.999 },
  ]);
  const [givenMolarMass, setGivenMolarMass] = useState<string>('180.0');

  // Concentration & Dilution States
  const [c1, setC1] = useState<string>('2.5'); // initial conc (M)
  const [v1, setV1] = useState<string>('20.0'); // initial volume (mL)
  const [c2, setC2] = useState<string>('0.5'); // target conc (M)
  const [v2, setV2] = useState<string>(''); // target volume

  // Electrochemistry Faraday States
  const [currentAmps, setCurrentAmps] = useState<string>('5.0');
  const [timeSeconds, setTimeSeconds] = useState<string>('2415'); // 40m 15s
  const [selectedMetal, setSelectedMetal] = useState<string>('Cu2');

  // Voice Input Hook for Chemistry Problem Dictation
  const { isListening, toggleListening } = useVoiceInput((transcript) => {
    setQuestionPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
  });

  // Chemical Equilibrium & ICE Table Workstation States
  const [icePreset, setIcePreset] = useState<'nh3' | 'hi' | 'pcl5'>('nh3');
  const [iceMolesA, setIceMolesA] = useState<string>('1.00'); // Initial moles of Reactant 1
  const [iceMolesB, setIceMolesB] = useState<string>('3.00'); // Initial moles of Reactant 2
  const [iceEquilMolesC, setIceEquilMolesC] = useState<string>('0.40'); // Equilibrium moles of Product
  const [iceVesselVolume, setIceVesselVolume] = useState<string>('2.0'); // Vessel volume (dm3)

  // Moving Diagram Simulation States
  const [diagramType, setDiagramType] = useState<'collision' | 'galvanic' | 'electrolytic' | 'equilibrium'>('collision');
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [chamberTemp, setChamberTemp] = useState<number>(300); // Kelvin
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Chemical Balancer Calculation
  const balanceData = useMemo(() => {
    return balanceEquation(equationInput);
  }, [equationInput]);

  // Direct client solve using user API key if provided
  const solveDirectChemistryWithGemini = async (
    apiKey: string,
    promptText: string,
    imageData?: string
  ): Promise<ChemistrySolution> => {
    const ai = new GoogleGenAI({ apiKey });
    const contents: any[] = [];
    if (imageData) {
      const cleanBase64 = imageData.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const systemInstruction = `You are an advanced Chemistry AI Solver and Tutor for ${examLevel}.
Solve this chemistry question strictly following Nigerian and international examination standards (JUPEB, JAMB, WAEC, Cambridge A-Levels, University Chemistry).
Always produce a notebook-ready solution with:
1. Given: list all given values, symbols, and SI units in givenValues array.
2. Required: target unknown quantity and symbol.
3. Formula: governing scientific law and formula in LaTeX ($...$), explaining why it applies.
4. Rearranged Formula: formula isolated for the target unknown in LaTeX.
5. Substitution: formula with numerical values and units plugged in.
6. Step-by-Step Substitution & Calculation: provide 4 to 7 clear, well-arranged core steps with verified calculations. Never generate 15+ excessive micro-steps.
7. Final Answer: clearly stated boxed answer in LaTeX (\\boxed{...}) with correct SI unit.
8. Tutor explanation, conceptual analogy, and exam advice.

CRITICAL LATEX SYNTAX:
- NEVER use raw '%' inside LaTeX equations (e.g. always write '\\% \\text{Yield} = ... \\times 100\\%' or '82.9\\%').
- Ensure all brackets '\\left(' have matching '\\right)'.
- Keep all steps clean, elegant, and readable without broken syntax.

Respond strictly in valid JSON format adhering to:
{
  "title": "Descriptive title of the problem",
  "category": "Chemistry",
  "subCategory": "Topic (e.g. Stoichiometry, Thermodynamics, Equilibrium, Electrochemistry, Gas Laws)",
  "problemStatement": "Clear restatement of the question in LaTeX",
  "formula": "Governing formula in LaTeX ($...$)",
  "rearrangedFormula": "Formula rearranged for target unknown in LaTeX",
  "whatIsRequired": "What is required with symbol and unit",
  "givenValues": [
    { "name": "Quantity name", "symbol": "m", "value": "2.5", "unit": "g" }
  ],
  "substitution": "Formula with numbers and units substituted in LaTeX",
  "steps": [
    "Step 1 or description",
    "$$equation$$"
  ],
  "finalAnswer": "\\boxed{Final answer with unit}",
  "unit": "SI unit",
  "explanation": "Clear explanation of why this law applies",
  "intuitiveConcept": "Clear physical/chemical analogy in plain English",
  "detailedDerivation": ["Derivation point 1", "Derivation point 2"],
  "tips": "Exam advice or common trap to avoid"
}`;

    contents.push({ text: `Question to solve:\n"${promptText}"` });

    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastErr = null;

    for (const model of candidateModels) {
      try {
        const config: any = {
          responseMimeType: 'application/json',
          systemInstruction,
        };
        if (model === 'gemini-3.8-flash') {
          config.thinkingConfig = { thinkingLevel: 'LOW' };
        } else if (model === 'gemini-3.1-flash-lite') {
          config.thinkingConfig = { thinkingLevel: 'MINIMAL' };
        }

        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });

        const responseText = response.text || '';
        const cleanJson = responseText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        return JSON.parse(cleanJson);
      } catch (e) {
        lastErr = e;
        continue;
      }
    }
    throw lastErr;
  };

  // Handle AI Chemistry Solve Request
  const handleSolveChemistryProblem = async () => {
    if (!questionPrompt.trim() && !imagePreview) return;
    setIsSolving(true);
    setSolveError(null);
    setAiSolution(null);

    const userApiKey =
      localStorage.getItem('gemini_user_api_key') ||
      localStorage.getItem('custom_gemini_api_key') ||
      '';

    // 1. Direct browser solve with Gemini if user provided an API key
    if (userApiKey) {
      try {
        const directSolution = await solveDirectChemistryWithGemini(
          userApiKey,
          questionPrompt,
          imagePreview || undefined
        );
        if (directSolution && (directSolution.formula || directSolution.steps || directSolution.finalAnswer || directSolution.title)) {
          setAiSolution(directSolution);
          setIsSolving(false);
          setTimeout(() => {
            solutionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
          return;
        }
      } catch (clientErr: any) {
        console.warn('Direct client solve failed, falling back to server /api/solve:', clientErr);
      }
    }

    // 2. Call server-side /api/solve route
    const fullTutorPrompt = `You are an advanced Chemistry AI Solver and Tutor for ${examLevel}.
Solve this chemistry question strictly following Nigerian and international university examination standards (JUPEB, JAMB, WAEC, Cambridge A-Levels, University Chemistry).

Question:
"${questionPrompt}"

MANDATORY RESPONSE REQUIREMENTS:
1. Provide a comprehensive, complete step-by-step notebook-ready solution that students can copy directly into their chemistry notebooks.
2. Structure every calculation into:
   - Given: Clearly list all values, symbols, and units in givenValues array.
   - Required: Target unknown quantity and symbol.
   - Formula: State the governing scientific law and formula in LaTeX ($...$), explaining why it applies.
   - Rearranged Formula: Rearrange for the required unknown.
   - Substitution: Plug numerical values and units into the formula.
   - Step-by-Step Substitution & Solution: Provide 4 to 7 clean, well-arranged core steps with verified calculations (never generate 15+ excessive micro-steps).
   - Final Answer: Clearly state the final answer boxed in LaTeX (\\boxed{...}) with correct SI units and significant figures.
3. Whenever a table is helpful or required, create a clean, properly formatted Markdown table with headings, values, and units (e.g. Empirical formula 6-column tables, Equilibrium ICE tables, titration readings, thermodynamic data).
4. Verify all arithmetic, units, and chemical equations. Never invent missing values.
5. CRITICAL LATEX SYNTAX: In LaTeX formulas, NEVER use raw '%' (always escape as '\\%' e.g. '\\% \\text{Yield} = ... \\times 100\\%' or '82.9\\%'). Always ensure matching '\\left(' and '\\right)'.`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (userApiKey) {
        headers['x-gemini-key'] = userApiKey;
      }

      let response = await fetch('/api/solve', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: fullTutorPrompt,
          subject: 'Chemistry',
          imageData: imagePreview || undefined,
        }),
      });

      if (response.status === 404) {
        response = await fetch('/api/ai/solve', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: fullTutorPrompt,
            subject: 'Chemistry',
            imageData: imagePreview || undefined,
          }),
        });
      }

      const resData = await response.json();
      if (!response.ok || !resData || resData.error || resData.success === false) {
        throw new Error(resData?.error || 'Unable to solve this problem right now. Please check internet connection.');
      }

      const rawSolution = resData.solution || resData;
      const parsedSolution: ChemistrySolution =
        typeof rawSolution === 'string' ? JSON.parse(rawSolution) : rawSolution;

      setAiSolution(parsedSolution);

      setTimeout(() => {
        solutionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err: any) {
      setSolveError(err.message || 'Error communicating with Chemistry AI Solver.');
    } finally {
      setIsSolving(false);
    }
  };

  // Copy full notebook working to clipboard
  const handleCopySolution = () => {
    if (!aiSolution) return;
    const parts: string[] = [];
    if (aiSolution.title) parts.push(`TITLE: ${aiSolution.title}`);
    if (aiSolution.problemStatement || aiSolution.problemRestatement) {
      parts.push(`PROBLEM:\n${aiSolution.problemStatement || aiSolution.problemRestatement}`);
    }
    if (aiSolution.givenValues && aiSolution.givenValues.length > 0) {
      parts.push(
        `1. GIVEN:\n` +
          aiSolution.givenValues
            .map((g) => ` - ${g.name || 'Quantity'} (${g.symbol || '-'}): ${g.value} ${g.unit || ''}`)
            .join('\n')
      );
    } else if (aiSolution.given) {
      parts.push(`1. GIVEN:\n${aiSolution.given}`);
    }
    if (aiSolution.whatIsRequired) {
      parts.push(`2. REQUIRED:\n${aiSolution.whatIsRequired}`);
    }
    if (aiSolution.formula) {
      parts.push(`3. FORMULA / LAW:\n${aiSolution.formula}`);
      if (aiSolution.rearrangedFormula) {
        parts.push(`Rearranged: ${aiSolution.rearrangedFormula}`);
      }
    }
    if (aiSolution.substitution) {
      parts.push(`4. SUBSTITUTION:\n${aiSolution.substitution}`);
    }
    if (aiSolution.steps && aiSolution.steps.length > 0) {
      parts.push(
        `STEPS:\n` + aiSolution.steps.map((s, idx) => `Step ${idx + 1}: ${s}`).join('\n')
      );
    }
    if (aiSolution.finalAnswer) {
      parts.push(`5. FINAL ANSWER:\n${aiSolution.finalAnswer}`);
    }
    if (aiSolution.explanation) {
      parts.push(`EXPLANATION:\n${aiSolution.explanation}`);
    }
    if (aiSolution.tips || aiSolution.examTip) {
      parts.push(`EXAM TIP:\n${aiSolution.tips || aiSolution.examTip}`);
    }

    navigator.clipboard.writeText(parts.join('\n\n'));
    setCopiedSolution(true);
    setTimeout(() => setCopiedSolution(false), 2000);
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Empirical Formula Calculation
  const empiricalResult = useMemo(() => {
    const rows = empiricalElements.map((row) => {
      const val = parseFloat(row.massOrPercent);
      const aw = row.atomicWeight || ATOMIC_WEIGHTS[row.element]?.mass || 12.0;
      const moles = !isNaN(val) && val > 0 ? val / aw : 0;
      return {
        ...row,
        val,
        aw,
        moles,
      };
    });

    if (rows.some((r) => r.moles <= 0)) return null;

    // Smallest moles
    const minMoles = Math.min(...rows.map((r) => r.moles));
    if (minMoles <= 0) return null;

    // Ratios
    const ratios = rows.map((r) => r.moles / minMoles);

    // Multiplier for fractions like .5 (x2), .33 (x3), .25 (x4)
    let multiplier = 1;
    for (const r of ratios) {
      const frac = r - Math.floor(r);
      if (Math.abs(frac - 0.5) < 0.08) multiplier = Math.max(multiplier, 2);
      else if (Math.abs(frac - 0.33) < 0.08 || Math.abs(frac - 0.67) < 0.08) multiplier = Math.max(multiplier, 3);
      else if (Math.abs(frac - 0.25) < 0.08 || Math.abs(frac - 0.75) < 0.08) multiplier = Math.max(multiplier, 4);
    }

    const integerCounts = ratios.map((r) => Math.round(r * multiplier));

    let empiricalFormula = '';
    let empiricalMass = 0;
    rows.forEach((r, idx) => {
      const count = integerCounts[idx];
      empiricalFormula += count > 1 ? `${r.element}${count}` : r.element;
      empiricalMass += count * r.aw;
    });

    // Molecular formula if molar mass provided
    let molecularFormula = empiricalFormula;
    let nFactor = 1;
    const mm = parseFloat(givenMolarMass);
    if (!isNaN(mm) && mm > 0 && empiricalMass > 0) {
      nFactor = Math.max(1, Math.round(mm / empiricalMass));
      molecularFormula = rows
        .map((r, idx) => {
          const totalCount = integerCounts[idx] * nFactor;
          return totalCount > 1 ? `${r.element}${totalCount}` : r.element;
        })
        .join('');
    }

    return {
      rows: rows.map((r, idx) => ({
        ...r,
        ratio: ratios[idx],
        integerRatio: integerCounts[idx],
      })),
      minMoles,
      multiplier,
      empiricalFormula,
      empiricalMass,
      nFactor,
      molecularFormula,
    };
  }, [empiricalElements, givenMolarMass]);

  // Dilution Calculation: C1*V1 = C2*V2
  const dilutionResult = useMemo(() => {
    const numC1 = parseFloat(c1);
    const numV1 = parseFloat(v1);
    const numC2 = parseFloat(c2);
    const numV2 = parseFloat(v2);

    if (!isNaN(numC1) && !isNaN(numV1) && !isNaN(numC2) && numC2 > 0) {
      // Calculate target V2
      const calcV2 = (numC1 * numV1) / numC2;
      const waterToAdd = Math.max(0, calcV2 - numV1);
      return {
        mode: 'V2',
        v2: calcV2,
        waterToAdd,
        latex: `V_2 = \\frac{C_1 \\times V_1}{C_2} = \\frac{${numC1} \\times ${numV1}}{${numC2}} = \\mathbf{${calcV2.toFixed(2)}\\text{ mL}}`,
      };
    }
    return null;
  }, [c1, v1, c2, v2]);

  // Faraday's Law Calculation: m = (I * t * M) / (z * F)
  const faradayResult = useMemo(() => {
    const I = parseFloat(currentAmps);
    const t = parseFloat(timeSeconds);
    if (isNaN(I) || isNaN(t) || I <= 0 || t <= 0) return null;

    const metalData: Record<string, { name: string; M: number; z: number; ion: string }> = {
      Cu2: { name: 'Copper', M: 63.55, z: 2, ion: 'Cu^{2+} + 2e^- \\to Cu' },
      Ag: { name: 'Silver', M: 107.87, z: 1, ion: 'Ag^{+} + e^- \\to Ag' },
      Al: { name: 'Aluminium', M: 26.98, z: 3, ion: 'Al^{3+} + 3e^- \\to Al' },
      Zn: { name: 'Zinc', M: 65.38, z: 2, ion: 'Zn^{2+} + 2e^- \\to Zn' },
      Ni: { name: 'Nickel', M: 58.69, z: 2, ion: 'Ni^{2+} + 2e^- \\to Ni' },
    };

    const metal = metalData[selectedMetal] || metalData.Cu2;
    const F = 96500;
    const Q = I * t;
    const molesElectrons = Q / F;
    const molesMetal = molesElectrons / metal.z;
    const massGrams = molesMetal * metal.M;

    return {
      metal,
      Q,
      molesElectrons,
      molesMetal,
      massGrams,
      latex: `m = \\frac{M \\cdot I \\cdot t}{z \\cdot F} = \\frac{${metal.M} \\times ${I} \\times ${t}}{${metal.z} \\times 96500} = \\mathbf{${massGrams.toFixed(4)}\\text{ g}}`,
    };
  }, [currentAmps, timeSeconds, selectedMetal]);

  // Chemical Equilibrium ICE Table Calculation
  const iceTableResult = useMemo(() => {
    const v = Math.max(0.1, parseFloat(iceVesselVolume) || 1.0);
    const nA = Math.max(0, parseFloat(iceMolesA) || 1.0);
    const nB = Math.max(0, parseFloat(iceMolesB) || 1.0);
    const nC_eq = Math.max(0.001, parseFloat(iceEquilMolesC) || 0.1);

    if (icePreset === 'nh3') {
      // N2(g) + 3H2(g) <=> 2NH3(g)
      const x = nC_eq / 2;
      const nA_eq = Math.max(0.001, nA - x);
      const nB_eq = Math.max(0.001, nB - 3 * x);
      const cA = nA_eq / v;
      const cB = nB_eq / v;
      const cC = nC_eq / v;
      const denom = cA * Math.pow(cB, 3);
      const Kc = denom > 0 ? Math.pow(cC, 2) / denom : 0;
      return {
        name: 'Haber Ammonia Synthesis (JUPEB Exam Standard)',
        reaction: '\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g)',
        species: ['\\text{N}_2', '\\text{H}_2', '\\text{NH}_3'],
        initialMoles: [nA, nB, 0],
        changeLabels: ['-x', '-3x', '+2x'],
        changeMoles: [-x, -3 * x, 2 * x],
        equilMoles: [nA_eq, nB_eq, nC_eq],
        equilConc: [cA, cB, cC],
        Kc,
        KcUnit: '\\text{dm}^6\\cdot\\text{mol}^{-2}',
        x,
        formula: 'K_c = \\frac{[\\text{NH}_3]^2}{[\\text{N}_2][\\text{H}_2]^3}',
        sub: `K_c = \\frac{(${cC.toFixed(3)})^2}{(${cA.toFixed(3)})(${cB.toFixed(3)})^3} = \\mathbf{${Kc.toFixed(4)}\\text{ dm}^6\\cdot\\text{mol}^{-2}}`,
      };
    } else if (icePreset === 'hi') {
      // H2(g) + I2(g) <=> 2HI(g)
      const x = nC_eq / 2;
      const nA_eq = Math.max(0.001, nA - x);
      const nB_eq = Math.max(0.001, nB - x);
      const cA = nA_eq / v;
      const cB = nB_eq / v;
      const cC = nC_eq / v;
      const denom = cA * cB;
      const Kc = denom > 0 ? Math.pow(cC, 2) / denom : 0;
      return {
        name: 'Hydrogen Iodide Equilibrium (Homogeneous Gas)',
        reaction: '\\text{H}_2(g) + \\text{I}_2(g) \\rightleftharpoons 2\\text{HI}(g)',
        species: ['\\text{H}_2', '\\text{I}_2', '\\text{HI}'],
        initialMoles: [nA, nB, 0],
        changeLabels: ['-x', '-x', '+2x'],
        changeMoles: [-x, -x, 2 * x],
        equilMoles: [nA_eq, nB_eq, nC_eq],
        equilConc: [cA, cB, cC],
        Kc,
        KcUnit: '\\text{(dimensionless)}',
        x,
        formula: 'K_c = \\frac{[\\text{HI}]^2}{[\\text{H}_2][\\text{I}_2]}',
        sub: `K_c = \\frac{(${cC.toFixed(3)})^2}{(${cA.toFixed(3)})(${cB.toFixed(3)})} = \\mathbf{${Kc.toFixed(3)}}`,
      };
    } else {
      // PCl5(g) <=> PCl3(g) + Cl2(g)
      const x = nC_eq;
      const nA_eq = Math.max(0.001, nA - x);
      const cA = nA_eq / v;
      const cC = x / v;
      const Kc = cA > 0 ? (cC * cC) / cA : 0;
      return {
        name: 'Phosphorus Pentachloride Dissociation',
        reaction: '\\text{PCl}_5(g) \\rightleftharpoons \\text{PCl}_3(g) + \\text{Cl}_2(g)',
        species: ['\\text{PCl}_5', '\\text{PCl}_3', '\\text{Cl}_2'],
        initialMoles: [nA, 0, 0],
        changeLabels: ['-x', '+x', '+x'],
        changeMoles: [-x, x, x],
        equilMoles: [nA_eq, x, x],
        equilConc: [cA, cC, cC],
        Kc,
        KcUnit: '\\text{mol}\\cdot\\text{dm}^{-3}',
        x,
        formula: 'K_c = \\frac{[\\text{PCl}_3][\\text{Cl}_2]}{[\\text{PCl}_5]}',
        sub: `K_c = \\frac{(${cC.toFixed(3)})(${cC.toFixed(3)})}{${cA.toFixed(3)}} = \\mathbf{${Kc.toFixed(4)}\\text{ mol}\\cdot\\text{dm}^{-3}}`,
      };
    }
  }, [icePreset, iceMolesA, iceMolesB, iceEquilMolesC, iceVesselVolume]);

  // HTML5 Animated Chemistry Canvas ("draw diagram to moving things to explain well")
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || activeTab !== 'diagrams') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    // Particle state for collision chamber
    const particles: { x: number; y: number; vx: number; vy: number; type: 'A' | 'B' | 'AB'; radius: number }[] = [];
    const countA = 12;
    const countB = 12;
    const w = canvas.width;
    const h = canvas.height;

    for (let i = 0; i < countA; i++) {
      particles.push({
        x: Math.random() * (w - 40) + 20,
        y: Math.random() * (h - 40) + 20,
        vx: (Math.random() - 0.5) * (chamberTemp / 60),
        vy: (Math.random() - 0.5) * (chamberTemp / 60),
        type: 'A',
        radius: 7,
      });
    }
    for (let i = 0; i < countB; i++) {
      particles.push({
        x: Math.random() * (w - 40) + 20,
        y: Math.random() * (h - 40) + 20,
        vx: (Math.random() - 0.5) * (chamberTemp / 60),
        vy: (Math.random() - 0.5) * (chamberTemp / 60),
        type: 'B',
        radius: 7,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      tick++;

      if (diagramType === 'collision') {
        // 1. COLLISION & ACTIVATION ENERGY SIMULATOR
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, w, h);

        // Vessel border
        ctx.strokeStyle = '#27272A';
        ctx.lineWidth = 3;
        ctx.strokeRect(15, 15, w - 30, h - 30);

        // Grid lines
        ctx.strokeStyle = '#18181B';
        ctx.lineWidth = 1;
        for (let x = 30; x < w - 30; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 15);
          ctx.lineTo(x, h - 15);
          ctx.stroke();
        }

        // Update and draw particles
        const speedScale = (chamberTemp / 150);
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (isSimRunning) {
            p.x += p.vx * speedScale;
            p.y += p.vy * speedScale;

            if (p.x <= 25 || p.x >= w - 25) p.vx *= -1;
            if (p.y <= 25 || p.y >= h - 25) p.vy *= -1;
          }

          // Check collisions between A and B
          if (isSimRunning) {
            for (let j = i + 1; j < particles.length; j++) {
              const p2 = particles[j];
              const dx = p2.x - p.x;
              const dy = p2.y - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < p.radius + p2.radius) {
                // If collision has enough energy (temperature >= 350K)
                if (p.type === 'A' && p2.type === 'B' && chamberTemp >= 350) {
                  p.type = 'AB';
                  p2.type = 'AB';
                  // Flash effect
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
                  ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
                  ctx.fill();
                }
                p.vx *= -1;
                p2.vx *= -1;
              }
            }
          }

          // Draw particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          if (p.type === 'A') {
            ctx.fillStyle = '#38BDF8'; // Sky Blue A
          } else if (p.type === 'B') {
            ctx.fillStyle = '#F59E0B'; // Amber B
          } else {
            ctx.fillStyle = '#22C55E'; // Emerald Product AB
          }
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Label
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(p.type, p.x, p.y + 3);
        }

        // Legend & Header
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Thermal Collision Chamber (T = ${chamberTemp} K)`, 25, 38);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#38BDF8';
        ctx.fillText('● Reactant A', 25, h - 25);
        ctx.fillStyle = '#F59E0B';
        ctx.fillText('● Reactant B', 120, h - 25);
        ctx.fillStyle = '#22C55E';
        ctx.fillText('● Product AB (Formed on High-Energy Collision)', 215, h - 25);
      } else if (diagramType === 'galvanic') {
        // 2. GALVANIC DANIELL CELL ANIMATION
        ctx.fillStyle = '#08080A';
        ctx.fillRect(0, 0, w, h);

        const beakerY = 120;
        const beakerW = 140;
        const beakerH = 150;

        // Beaker 1: Zinc Anode Beaker (Left)
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.strokeRect(60, beakerY, beakerW, beakerH);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)'; // ZnSO4 solution
        ctx.fillRect(60, beakerY + 30, beakerW, beakerH - 30);

        // Zinc Strip
        ctx.fillStyle = '#71717A';
        ctx.fillRect(100, beakerY - 30, 24, 130);
        ctx.strokeStyle = '#A1A1AA';
        ctx.strokeRect(100, beakerY - 30, 24, 130);

        // Beaker 2: Copper Cathode Beaker (Right)
        const b2X = w - 60 - beakerW;
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3;
        ctx.strokeRect(b2X, beakerY, beakerW, beakerH);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.25)'; // Deep blue CuSO4 solution
        ctx.fillRect(b2X, beakerY + 30, beakerW, beakerH - 30);

        // Copper Strip
        ctx.fillStyle = '#B45309';
        ctx.fillRect(b2X + 50, beakerY - 30, 24, 130);
        ctx.strokeStyle = '#D97706';
        ctx.strokeRect(b2X + 50, beakerY - 30, 24, 130);

        // External Wire
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(112, beakerY - 30);
        ctx.lineTo(112, 45);
        ctx.lineTo(w / 2 - 25, 45);
        ctx.moveTo(w / 2 + 25, 45);
        ctx.lineTo(b2X + 62, 45);
        ctx.lineTo(b2X + 62, beakerY - 30);
        ctx.stroke();

        // Voltmeter Circle
        ctx.beginPath();
        ctx.arc(w / 2, 45, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#18181B';
        ctx.fill();
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#22C55E';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('+1.10V', w / 2, 48);

        // Salt Bridge (Inverted U-Tube)
        ctx.strokeStyle = '#E4E4E7';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(150, beakerY + 70);
        ctx.lineTo(150, beakerY - 10);
        ctx.lineTo(b2X + 30, beakerY - 10);
        ctx.lineTo(b2X + 30, beakerY + 70);
        ctx.stroke();

        ctx.fillStyle = '#18181B';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('KCl Salt Bridge', w / 2, beakerY - 14);

        // Moving electrons along external wire
        if (isSimRunning) {
          const eCount = 6;
          for (let e = 0; e < eCount; e++) {
            const progress = ((tick * 2 + (e * 300) / eCount) % 300) / 300;
            let ex = 112;
            let ey = 45;
            if (progress < 0.2) {
              ex = 112;
              ey = beakerY - 30 - progress * (beakerY - 30 - 45) * 5;
            } else if (progress < 0.8) {
              const hProg = (progress - 0.2) / 0.6;
              ex = 112 + hProg * (b2X + 62 - 112);
              ey = 45;
            } else {
              const vProg = (progress - 0.8) / 0.2;
              ex = b2X + 62;
              ey = 45 + vProg * (beakerY - 30 - 45);
            }

            ctx.beginPath();
            ctx.arc(ex, ey, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FACC15'; // yellow electron
            ctx.fill();
          }
        }

        // Labels
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('(-) ANODE: Zn Electrode', 120, beakerY + beakerH + 18);
        ctx.fillText('(+) CATHODE: Cu Electrode', b2X + 70, beakerY + beakerH + 18);

        ctx.font = '10px monospace';
        ctx.fillStyle = '#38BDF8';
        ctx.fillText('Zn(s) -> Zn2+(aq) + 2e-', 120, beakerY + beakerH + 34);
        ctx.fillStyle = '#F59E0B';
        ctx.fillText('Cu2+(aq) + 2e- -> Cu(s)', b2X + 70, beakerY + beakerH + 34);
      } else if (diagramType === 'electrolytic') {
        // 3. ELECTROLYTIC CELL (CuSO4 Electrolysis & Metal Deposition)
        ctx.fillStyle = '#08080C';
        ctx.fillRect(0, 0, w, h);

        const tankX = w / 2 - 160;
        const tankY = 110;
        const tankW = 320;
        const tankH = 170;

        // Solution in tank (CuSO4 deep blue)
        ctx.fillStyle = 'rgba(14, 116, 144, 0.35)';
        ctx.fillRect(tankX, tankY + 20, tankW, tankH - 20);

        // Glass Tank
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.strokeRect(tankX, tankY, tankW, tankH);

        // Anode Rod (+) (Left) - Inert Platinum or Carbon
        const anodeX = tankX + 60;
        ctx.fillStyle = '#52525B';
        ctx.fillRect(anodeX, tankY - 30, 26, 140);
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(anodeX, tankY - 30, 26, 140);

        // Cathode Rod (-) (Right) - Pure Cu rod
        const cathodeX = tankX + tankW - 86;
        ctx.fillStyle = '#B45309';
        ctx.fillRect(cathodeX, tankY - 30, 26, 140);
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 2;
        ctx.strokeRect(cathodeX, tankY - 30, 26, 140);

        // Copper layer accumulating on cathode
        ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.fillRect(cathodeX - 4, tankY + 20, 34, 90);

        // External DC Power Supply (Battery)
        const batteryX = w / 2;
        const batteryY = 45;
        ctx.fillStyle = '#18181B';
        ctx.fillRect(batteryX - 45, batteryY - 20, 90, 40);
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 2;
        ctx.strokeRect(batteryX - 45, batteryY - 20, 90, 40);

        ctx.fillStyle = '#FACC15';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DC BATTERY', batteryX, batteryY - 3);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#EF4444';
        ctx.fillText('(+) ANODE', batteryX - 22, batteryY + 12);
        ctx.fillStyle = '#22C55E';
        ctx.fillText('(-) CATH', batteryX + 22, batteryY + 12);

        // Wires
        ctx.strokeStyle = '#E4E4E7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Anode to Battery (+)
        ctx.moveTo(anodeX + 13, tankY - 30);
        ctx.lineTo(anodeX + 13, batteryY);
        ctx.lineTo(batteryX - 45, batteryY);
        // Battery (-) to Cathode
        ctx.moveTo(batteryX + 45, batteryY);
        ctx.lineTo(cathodeX + 13, batteryY);
        ctx.lineTo(cathodeX + 13, tankY - 30);
        ctx.stroke();

        if (isSimRunning) {
          // 1. Moving Electrons in Wire: from Anode (+) through battery to Cathode (-)
          const eCount = 6;
          for (let e = 0; e < eCount; e++) {
            const prog = ((tick * 2 + (e * 300) / eCount) % 300) / 300;
            let ex = anodeX + 13;
            let ey = batteryY;
            if (prog < 0.25) {
              ex = anodeX + 13;
              ey = tankY - 30 - prog * 4 * (tankY - 30 - batteryY);
            } else if (prog < 0.75) {
              const hp = (prog - 0.25) / 0.5;
              ex = anodeX + 13 + hp * (cathodeX - anodeX);
              ey = batteryY;
            } else {
              const vp = (prog - 0.75) / 0.25;
              ex = cathodeX + 13;
              ey = batteryY + vp * (tankY - 30 - batteryY);
            }
            ctx.beginPath();
            ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#FACC15';
            ctx.fill();
          }

          // 2. Rising O2/Gas Bubbles at Anode
          for (let b = 0; b < 6; b++) {
            const by = tankY + 120 - ((tick * 1.5 + b * 25) % 110);
            const bx = anodeX + 13 + Math.sin(tick * 0.1 + b) * 8;
            ctx.beginPath();
            ctx.arc(bx, by, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fill();
          }

          // 3. Cu2+ Cations Drifting Toward Cathode
          for (let c = 0; c < 5; c++) {
            const cProg = ((tick + c * 40) % 200) / 200;
            const cx = anodeX + 40 + cProg * (cathodeX - anodeX - 50);
            const cy = tankY + 45 + ((c * 27) % 80);
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#38BDF8';
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 7px sans-serif';
            ctx.fillText('Cu²⁺', cx, cy + 2.5);
          }
        }

        // Labels
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('(+) ANODE: Oxidation', anodeX + 13, tankY + tankH + 18);
        ctx.fillText('(-) CATHODE: Reduction', cathodeX + 13, tankY + tankH + 18);

        ctx.font = '10px monospace';
        ctx.fillStyle = '#EF4444';
        ctx.fillText('2H2O -> O2(g) + 4H+ + 4e-', anodeX + 13, tankY + tankH + 34);
        ctx.fillStyle = '#22C55E';
        ctx.fillText('Cu2+(aq) + 2e- -> Cu(s)', cathodeX + 13, tankY + tankH + 34);
      } else if (diagramType === 'equilibrium') {
        // 3. DYNAMIC EQUILIBRIUM FORWARD & REVERSE FLUX
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Dynamic Chemical Equilibrium: A + B ⇌ C + D', w / 2, 40);

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#A1A1AA';
        ctx.fillText('Rate of Forward Reaction (Rf) = Rate of Reverse Reaction (Rr)', w / 2, 60);

        // Reactant Box (Left)
        ctx.fillStyle = '#121217';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.strokeRect(60, 95, 150, 150);
        ctx.fillRect(60, 95, 150, 150);

        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('Reactants [A + B]', 135, 125);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Constant Concentration', 135, 150);

        // Product Box (Right)
        ctx.fillStyle = '#121217';
        ctx.strokeStyle = '#22C55E';
        ctx.strokeRect(w - 210, 95, 150, 150);
        ctx.fillRect(w - 210, 95, 150, 150);

        ctx.fillStyle = '#22C55E';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('Products [C + D]', w - 135, 125);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Constant Concentration', w - 135, 150);

        // Forward Flux Arrow (Top)
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(220, 140);
        ctx.lineTo(w - 220, 140);
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(w - 220, 140);
        ctx.lineTo(w - 235, 132);
        ctx.lineTo(w - 235, 148);
        ctx.fillStyle = '#38BDF8';
        ctx.fill();

        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('Rf (Forward Rate)', w / 2, 130);

        // Reverse Flux Arrow (Bottom)
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w - 220, 195);
        ctx.lineTo(220, 195);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(220, 195);
        ctx.lineTo(235, 187);
        ctx.lineTo(235, 203);
        ctx.fillStyle = '#22C55E';
        ctx.fill();

        ctx.fillStyle = '#22C55E';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('Rr (Reverse Rate)', w / 2, 215);

        // Equal sign in center
        ctx.fillStyle = '#FACC15';
        ctx.font = 'black 22px sans-serif';
        ctx.fillText('=', w / 2, 172);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [diagramType, isSimRunning, chamberTemp, activeTab]);

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
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#FFFFFF] tracking-tight">
                  Chemistry AI Solver & Workstation
                </h1>
                <span className="text-[11px] font-bold text-emerald-400">
                  WAEC · JAMB · JUPEB · Cambridge A-Level & University Chem 101/201
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1AA] max-w-2xl leading-relaxed">
              Step-by-step chemistry problem solver, chemical equation balancer with atom audit tables, empirical & molecular formula generator, dilution, electrochemistry, and interactive reaction diagrams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-[#121216] border border-[#27272A] text-xs font-mono font-bold text-white">
              5-Step Notebook Working
            </span>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex space-x-1.5 overflow-x-auto pt-5 mt-5 border-t border-[#27272A]/70 scrollbar-none">
          {[
            { id: 'ai_solver', label: '🤖 AI Chemistry Solver', desc: 'Any Question Step-by-Step' },
            { id: 'balancer', label: '🧪 Equation Balancer', desc: 'Stoichiometry & Yield' },
            { id: 'empirical', label: '📋 Empirical & Dilution', desc: 'Formulas & C1V1=C2V2' },
            { id: 'electrochem', label: '⚡ Electrochemistry', desc: "Faraday's Electrolysis" },
            { id: 'ice_table', label: '⚖️ ICE Equilibrium', desc: 'Equilibrium & Kc Tables' },
            { id: 'diagrams', label: '🔬 Moving Diagrams', desc: 'Particle & Cell Canvas' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SolverTab)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 border ${
                  isActive
                    ? 'bg-[#22C55E] text-black border-[#22C55E] shadow-md shadow-emerald-500/20 font-black'
                    : 'bg-[#121216] text-[#A1A1AA] border-[#27272A] hover:text-white hover:border-[#22C55E]/40'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: AI CHEMISTRY SOLVER */}
      {activeTab === 'ai_solver' && (
        <div className="space-y-6">
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#27272A]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Solve Any Chemistry Question with AI Tutor
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#A1A1AA]">Target Level:</span>
                <select
                  value={examLevel}
                  onChange={(e) => setExamLevel(e.target.value)}
                  className="p-1.5 rounded-xl bg-[#121216] border border-[#27272A] text-xs font-bold text-emerald-400 focus:outline-none"
                >
                  <option value="WAEC / SSCE">WAEC / SSCE Level</option>
                  <option value="JAMB (UTME)">JAMB (UTME) Level</option>
                  <option value="JUPEB / IJMB / A-Level">JUPEB / IJMB / A-Level</option>
                  <option value="University Chemistry 101/201">University Chemistry 101 / 201</option>
                </select>
              </div>
            </div>

            {/* Question Input Textarea & Image Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#A1A1AA]">
                  Type or Paste Your Chemistry Problem (or upload homework photo):
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="text-xs text-rose-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>

              <textarea
                rows={4}
                value={questionPrompt}
                onChange={(e) => setQuestionPrompt(e.target.value)}
                placeholder="Type any chemistry question: e.g. A compound contains 40% C, 6.7% H, 53.3% O... or balance redox equations, Hess's law, pH of buffers, titration, Faraday's electrolysis..."
                className="w-full p-4 rounded-2xl bg-[#000000] border border-[#27272A] text-xs sm:text-sm font-sans font-medium text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none transition-all leading-relaxed"
              />

              {/* Image Preview if uploaded */}
              {imagePreview && (
                <div className="p-2 rounded-2xl border border-emerald-500/40 bg-black/60 inline-block">
                  <img src={imagePreview} alt="Homework Question" className="max-h-40 rounded-xl object-contain" />
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] text-xs font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4 text-sky-400" />
                  <span>Attach Question Photo</span>
                </button>

                <button
                  type="button"
                  onClick={toggleListening}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500 animate-pulse'
                      : 'bg-[#18181B] hover:bg-[#27272A] text-zinc-300 border-[#27272A]'
                  }`}
                  title="Speak your chemistry problem into the microphone"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4 text-rose-400" />
                      <span>Listening... (Tap to stop)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <span>Voice Question</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSolveChemistryProblem}
                disabled={isSolving || (!questionPrompt.trim() && !imagePreview)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-black font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-40 transition-all"
              >
                {isSolving ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-black" />
                    <span>Deriving 5-Step Notebook Solution...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-black" />
                    <span>Solve Step-by-Step with Chemistry AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {solveError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{solveError}</span>
              </div>
            )}

            {/* Quick Practice Presets */}
            <div className="pt-2 border-t border-[#27272A]/70 space-y-2">
              <span className="text-xs font-bold text-white block">
                Load High-Yield Examination Questions (Click to Solve):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {CHEMISTRY_EXAM_PRESETS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuestionPrompt(item.question);
                      setImagePreview(null);
                    }}
                    className="p-3 rounded-xl bg-[#121217] hover:bg-[#181820] border border-[#27272A] hover:border-emerald-500/40 text-left transition-all cursor-pointer space-y-1 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-emerald-400">{item.exam}</span>
                      <span className="text-zinc-500">{item.topic}</span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">{item.title}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Solution Notebook Result Card */}
          {aiSolution && (
            <div
              ref={solutionCardRef}
              className="bg-[#0A0A0A] border border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 animate-fadeIn"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      {aiSolution.title || 'Verified Chemistry Notebook Solution'}
                    </h3>
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-400">
                      <span className="text-emerald-400 font-bold">
                        {aiSolution.subCategory || aiSolution.category || 'JUPEB / JAMB / WAEC Standard Working'}
                      </span>
                      <span>•</span>
                      <span>5-Step Verified Working</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopySolution}
                    className="px-3.5 py-1.5 rounded-xl bg-[#121216] hover:bg-[#181820] text-zinc-300 hover:text-white border border-[#27272A] text-xs font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    {copiedSolution ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied to Notebook!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Copy Notebook Working</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Problem Restatement */}
              {(aiSolution.problemStatement || aiSolution.problemRestatement) && (
                <div className="p-3.5 rounded-2xl bg-[#050507] border border-[#27272A] text-xs text-zinc-300 space-y-1">
                  <span className="font-bold text-emerald-400 uppercase text-[10px] block tracking-wider">
                    Problem Restatement:
                  </span>
                  <div className="leading-relaxed">
                    <MathRenderer content={aiSolution.problemStatement || aiSolution.problemRestatement || ''} />
                  </div>
                </div>
              )}

              {/* 5-Step Notebook Structure */}
              <div className="space-y-4">
                {/* 1. Given */}
                {((aiSolution.givenValues && aiSolution.givenValues.length > 0) || aiSolution.given) && (
                  <div className="p-4 rounded-2xl bg-[#050507] border border-[#27272A] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                        1. Given Parameters & Known Quantities:
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">Standard Chemistry Table</span>
                    </div>

                    {/* Formatted Parameter Table if givenValues array exists */}
                    {aiSolution.givenValues && aiSolution.givenValues.length > 0 && (
                      <div className="overflow-x-auto rounded-xl border border-[#27272A]/70 bg-[#0A0A0E]">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-[#27272A] text-zinc-400 font-semibold bg-[#121217]">
                              <th className="py-2 px-3">Parameter / Substance</th>
                              <th className="py-2 px-3">Symbol</th>
                              <th className="py-2 px-3">Given Value</th>
                              <th className="py-2 px-3">SI Unit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aiSolution.givenValues.map((gv, i) => (
                              <tr
                                key={i}
                                className="border-b border-[#27272A]/40 font-mono text-zinc-200 hover:bg-[#15151b] transition-colors"
                              >
                                <td className="py-2 px-3 font-sans font-medium text-white">
                                  {gv.name || 'Quantity'}
                                </td>
                                <td className="py-2 px-3 text-emerald-400 font-bold">{gv.symbol || '-'}</td>
                                <td className="py-2 px-3 text-white font-bold">{gv.value}</td>
                                <td className="py-2 px-3 text-sky-400">{gv.unit || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Raw given text if present */}
                    {aiSolution.given && (
                      <div className="text-xs sm:text-sm text-white font-mono leading-relaxed pt-1">
                        <MathRenderer content={aiSolution.given} />
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Required */}
                {aiSolution.whatIsRequired && (
                  <div className="p-4 rounded-2xl bg-[#050507] border border-[#27272A] space-y-1.5">
                    <span className="text-xs font-black text-sky-400 uppercase tracking-wider block">
                      2. What Is Required (Target Unknown):
                    </span>
                    <div className="text-xs sm:text-sm text-white font-mono">
                      <MathRenderer content={aiSolution.whatIsRequired} />
                    </div>
                  </div>
                )}

                {/* 3. Formula & Law */}
                {aiSolution.formula && (
                  <div className="p-4 rounded-2xl bg-[#050507] border border-[#27272A] space-y-2">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                      3. Governing Scientific Law & Formula:
                    </span>
                    <div className="text-sm sm:text-base text-white text-center py-1.5 bg-[#0A0A0E] rounded-xl border border-[#27272A]/60">
                      <MathRenderer content={aiSolution.formula} displayMode={true} />
                    </div>

                    {/* Rearranged formula */}
                    {aiSolution.rearrangedFormula && (
                      <div className="p-2.5 rounded-xl bg-[#0e0e13] border border-[#27272A]/70 space-y-1">
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                          Formula Rearranged for Target Unknown:
                        </span>
                        <div className="text-xs sm:text-sm text-white text-center">
                          <MathRenderer content={aiSolution.rearrangedFormula} displayMode={true} />
                        </div>
                      </div>
                    )}

                    {aiSolution.whyFormula && (
                      <p className="text-xs text-zinc-400 pt-1 border-t border-[#27272A]/70">
                        <strong className="text-white">Why This Law Applies: </strong>
                        {aiSolution.whyFormula}
                      </p>
                    )}
                  </div>
                )}

                {/* 4. Step-by-Step Calculations & Tables */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#050507] border border-[#27272A] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white uppercase tracking-wider block">
                      4. Detailed Step-by-Step Substitution & Arithmetic:
                    </span>
                    <span className="text-[10px] text-zinc-500">Every Step Verified</span>
                  </div>

                  {/* Direct Numerical Substitution */}
                  {aiSolution.substitution && (
                    <div className="p-3 rounded-xl bg-[#0A0A0E] border border-sky-500/30 space-y-1 min-w-0 max-w-full overflow-hidden">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                        Numerical Substitution with Units:
                      </span>
                      <div className="formula-scroll-container text-xs sm:text-sm text-white py-1 break-words min-w-0">
                        <MathRenderer content={aiSolution.substitution} />
                      </div>
                    </div>
                  )}

                  {/* Calculation Steps */}
                  {aiSolution.steps && aiSolution.steps.length > 0 && (
                    <div className="space-y-2.5">
                      {aiSolution.steps.map((st: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-[#0A0A0E] border border-[#27272A]/70 text-xs sm:text-sm text-white space-y-1.5 min-w-0 max-w-full overflow-hidden"
                        >
                          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
                              Step {idx + 1}
                            </span>
                          </div>
                          <div className="formula-scroll-container break-words min-w-0">
                            <MathRenderer content={st} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Detailed Derivation Breakdown if available */}
                  {aiSolution.detailedDerivation && aiSolution.detailedDerivation.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#0e0e14] border border-[#27272A] space-y-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Step-by-Step Algebraic Derivation:
                      </span>
                      <ul className="space-y-1.5 text-xs text-zinc-300">
                        {aiSolution.detailedDerivation.map((point: string, pIdx: number) => (
                          <li key={pIdx} className="flex items-start space-x-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <div className="flex-1">
                              <MathRenderer content={point} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 5. Final Answer Boxed */}
                {aiSolution.finalAnswer && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#050507] border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10 space-y-2 text-center">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                      5. Final Answer with Unit:
                    </span>
                    <div className="text-base sm:text-xl py-1 text-white">
                      <MathRenderer content={aiSolution.finalAnswer} displayMode={true} />
                    </div>
                    {aiSolution.unit && (
                      <div className="inline-block px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                        SI Unit: {aiSolution.unit}
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation, Intuitive Analogy & Exam Advice */}
                {(aiSolution.explanation ||
                  aiSolution.intuitiveConcept ||
                  aiSolution.tips ||
                  aiSolution.examTip ||
                  aiSolution.alternativeMethod ||
                  aiSolution.commonMistakes) && (
                  <div className="p-4 rounded-2xl bg-[#121216] border border-[#27272A] text-xs text-zinc-300 space-y-2.5">
                    {aiSolution.explanation && (
                      <div className="space-y-1">
                        <span className="font-bold text-white block">Tutor Explanation:</span>
                        <p className="leading-relaxed">{aiSolution.explanation}</p>
                      </div>
                    )}

                    {aiSolution.intuitiveConcept && (
                      <div className="p-2.5 rounded-xl bg-[#181820] border border-[#27272A] space-y-1 text-zinc-300">
                        <span className="font-bold text-emerald-400 block text-[11px] uppercase tracking-wider">
                          Intuitive Concept & Physical Analogy:
                        </span>
                        <p className="leading-relaxed">{aiSolution.intuitiveConcept}</p>
                      </div>
                    )}

                    {(aiSolution.tips || aiSolution.examTip) && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1">
                        <span className="font-bold text-amber-300 block text-[11px] uppercase tracking-wider">
                          Exam Hall Tip & Scoring Advice:
                        </span>
                        <p className="leading-relaxed">{aiSolution.tips || aiSolution.examTip}</p>
                      </div>
                    )}

                    {aiSolution.commonMistakes && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 space-y-1">
                        <span className="font-bold text-rose-300 block text-[11px] uppercase tracking-wider">
                          Common Student Traps to Avoid:
                        </span>
                        <p className="leading-relaxed">{aiSolution.commonMistakes}</p>
                      </div>
                    )}

                    {aiSolution.alternativeMethod && (
                      <div className="p-2.5 rounded-xl bg-[#181820] border border-[#27272A] space-y-1 text-zinc-300">
                        <span className="font-bold text-sky-400 block text-[11px] uppercase tracking-wider">
                          Alternative Method / Quick Cross-Check:
                        </span>
                        <p className="leading-relaxed">{aiSolution.alternativeMethod}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EQUATION BALANCER & STOICHIOMETRY */}
      {activeTab === 'balancer' && (
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Chemical Equation Balancer & Conservation Matrix
              </h3>
            </div>
            <span className="text-xs text-zinc-400">Exact Stoichiometric Nullspace Algorithm</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#A1A1AA]">Enter Chemical Reaction:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={equationInput}
                onChange={(e) => setEquationInput(e.target.value)}
                placeholder="e.g. KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O"
                className="flex-1 p-3.5 rounded-2xl bg-[#000000] border border-[#27272A] text-sm font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(equationInput);
                  setCopiedEquation(true);
                  setTimeout(() => setCopiedEquation(false), 2000);
                }}
                className="px-4 py-2 rounded-2xl bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] text-xs font-bold flex items-center space-x-1 cursor-pointer"
              >
                {copiedEquation ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedEquation ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Reactions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PRESET_REACTIONS.slice(0, 6).map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setEquationInput(preset.equation)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer active:scale-95 transition-all ${
                  equationInput === preset.equation
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-[#121217] text-zinc-400 border-[#27272A] hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Balance Output */}
          {!equationInput.trim() ? (
            <div className="p-6 rounded-2xl bg-[#08080C] border border-[#27272A] text-center space-y-2">
              <Scale className="w-8 h-8 text-emerald-400/50 mx-auto" />
              <p className="text-xs sm:text-sm font-bold text-white">
                Enter a chemical equation above to balance and audit atoms
              </p>
              <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                Type any chemical reaction (e.g. <code className="text-emerald-400">C3H8 + O2 -&gt; CO2 + H2O</code>) or select one of the high-yield presets above to view stoichiometric balancing, molar masses, and mass conservation.
              </p>
            </div>
          ) : balanceData.success ? (
            <div className="p-5 rounded-2xl bg-[#000000] border border-emerald-500/40 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase">Balanced Equation:</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {balanceData.reactionType}
                </span>
              </div>

              <div className="py-2 text-center overflow-x-auto formula-scroll-container">
                <MathRenderer content={`$$${balanceData.balancedEquationLatex}$$`} displayMode={true} />
              </div>

              {/* Atom Conservation Table */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-zinc-400 uppercase block">
                  Atom Audit (Mass Conservation):
                </span>
                <div className="overflow-x-auto rounded-xl border border-[#27272A] bg-[#0A0A0A]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#121217] text-[#A1A1AA] border-b border-[#27272A]">
                      <tr>
                        <th className="p-2.5">Element</th>
                        <th className="p-2.5 text-center">Reactant Atoms</th>
                        <th className="p-2.5 text-center">Product Atoms</th>
                        <th className="p-2.5 text-center">Balance Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A]/50">
                      {balanceData.elementAudit.map((a) => (
                        <tr key={a.element}>
                          <td className="p-2.5 font-bold text-white">
                            {a.element} ({ATOMIC_WEIGHTS[a.element]?.name || 'Element'})
                          </td>
                          <td className="p-2.5 text-center font-bold text-sky-400">{a.reactantCount}</td>
                          <td className="p-2.5 text-center font-bold text-sky-400">{a.productCount}</td>
                          <td className="p-2.5 text-center text-emerald-400 font-bold">✓ Equal (Conserved)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{balanceData.error || 'Please check equation syntax (e.g. Reactants -> Products).'}</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EMPIRICAL FORMULA & DILUTION WORKSTATIONS */}
      {activeTab === 'empirical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Empirical & Molecular Formula Generator */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#27272A]">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Empirical & Molecular Formula Solver
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Element Composition (% or grams):</span>
                <button
                  type="button"
                  onClick={() =>
                    setEmpiricalElements((prev) => [
                      ...prev,
                      { element: 'N', massOrPercent: '10.0', atomicWeight: 14.007 },
                    ])
                  }
                  className="text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  + Add Element
                </button>
              </div>

              {empiricalElements.map((el, i) => (
                <div key={i} className="flex gap-2 items-center bg-[#050507] p-2 rounded-xl border border-[#27272A]">
                  <input
                    type="text"
                    value={el.element}
                    onChange={(e) => {
                      const sym = e.target.value.trim();
                      const aw = ATOMIC_WEIGHTS[sym]?.mass || el.atomicWeight;
                      setEmpiricalElements((prev) => {
                        const copy = [...prev];
                        copy[i] = { ...copy[i], element: sym, atomicWeight: aw };
                        return copy;
                      });
                    }}
                    placeholder="Symbol"
                    className="w-16 p-1.5 rounded-lg bg-black border border-[#27272A] text-xs font-bold text-center text-white"
                  />
                  <input
                    type="number"
                    step="any"
                    value={el.massOrPercent}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEmpiricalElements((prev) => {
                        const copy = [...prev];
                        copy[i] = { ...copy[i], massOrPercent: v };
                        return copy;
                      });
                    }}
                    placeholder="Mass / %"
                    className="flex-1 p-1.5 rounded-lg bg-black border border-[#27272A] text-xs font-mono text-white"
                  />
                  <span className="text-xs text-zinc-500 font-mono">AW: {el.atomicWeight}</span>
                  {empiricalElements.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setEmpiricalElements((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              <div className="space-y-1 pt-1">
                <label className="text-xs text-zinc-400">Known Molecular Mass (g/mol):</label>
                <input
                  type="number"
                  value={givenMolarMass}
                  onChange={(e) => setGivenMolarMass(e.target.value)}
                  placeholder="e.g. 180.0 g/mol"
                  className="w-full p-2 rounded-xl bg-black border border-[#27272A] text-xs font-mono text-white"
                />
              </div>
            </div>

            {/* Empirical Formula 6-Column Output Table */}
            {empiricalResult && (
              <div className="pt-2 space-y-3 border-t border-[#27272A]">
                <div className="overflow-x-auto rounded-xl border border-[#27272A] bg-black">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-[#121217] text-zinc-400 border-b border-[#27272A]">
                      <tr>
                        <th className="p-2">Element</th>
                        <th className="p-2">Mass %</th>
                        <th className="p-2">Atomic Mass</th>
                        <th className="p-2">Moles (n = m/M)</th>
                        <th className="p-2">Mole Ratio</th>
                        <th className="p-2 text-center">Integer Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A]/50">
                      {empiricalResult.rows.map((r, i) => (
                        <tr key={i}>
                          <td className="p-2 font-bold text-white">{r.element}</td>
                          <td className="p-2 text-zinc-300">{r.val}%</td>
                          <td className="p-2 text-zinc-400">{r.aw}</td>
                          <td className="p-2 text-sky-400">{r.moles.toFixed(3)}</td>
                          <td className="p-2 text-zinc-300">{r.ratio.toFixed(2)}</td>
                          <td className="p-2 text-center font-bold text-emerald-400">{r.integerRatio}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 rounded-xl bg-[#050507] border border-emerald-500/40 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Empirical Formula:</span>
                    <strong className="text-emerald-400 font-mono text-sm">{empiricalResult.empiricalFormula}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Empirical Formula Mass:</span>
                    <strong className="text-white font-mono">{empiricalResult.empiricalMass.toFixed(2)} g/mol</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Molecular Multiplier (n):</span>
                    <strong className="text-sky-400 font-mono">
                      n = {givenMolarMass} / {empiricalResult.empiricalMass.toFixed(2)} = {empiricalResult.nFactor}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#27272A]">
                    <span className="text-zinc-300 font-bold">Molecular Formula:</span>
                    <strong className="text-emerald-300 font-mono text-base">{empiricalResult.molecularFormula}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dilution Calculator C1V1 = C2V2 */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-[#27272A]">
              <Activity className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Solution Concentration & Dilution (C1V1 = C2V2)
              </h3>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                Calculate the required volume of stock solution or target dilution volume using the conservation of moles.
              </p>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-400 block font-sans">Stock Conc (C1):</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="any"
                      value={c1}
                      onChange={(e) => setC1(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black border border-[#27272A] text-white"
                    />
                    <span className="text-zinc-500">M</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 block font-sans">Stock Volume (V1):</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="any"
                      value={v1}
                      onChange={(e) => setV1(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black border border-[#27272A] text-white"
                    />
                    <span className="text-zinc-500">mL</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 block font-sans">Target Conc (C2):</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="any"
                      value={c2}
                      onChange={(e) => setC2(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black border border-[#27272A] text-white"
                    />
                    <span className="text-zinc-500">M</span>
                  </div>
                </div>
              </div>

              {dilutionResult && (
                <div className="p-4 rounded-2xl bg-[#050507] border border-sky-500/40 text-xs space-y-2 pt-3">
                  <span className="font-bold text-white block">Step-by-Step Dilution Working:</span>
                  <div className="text-sm text-center py-1">
                    <MathRenderer content={`$$${dilutionResult.latex}$$`} displayMode={true} />
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300">
                    <strong>Laboratory Instruction:</strong> Take <strong>{v1} mL</strong> of stock solution and add{' '}
                    <strong>{dilutionResult.waterToAdd.toFixed(2)} mL</strong> of distilled water to obtain{' '}
                    <strong>{dilutionResult.v2.toFixed(2)} mL</strong> of {c2} M diluted solution.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ELECTROCHEMISTRY & FARADAY'S LAWS */}
      {activeTab === 'electrochem' && (
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Faraday’s Laws of Electrolysis Calculator
              </h3>
            </div>
            <span className="text-xs text-zinc-400 font-mono">m = (M · I · t) / (z · F)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold">Electrolyte & Deposited Metal:</label>
              <select
                value={selectedMetal}
                onChange={(e) => setSelectedMetal(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black border border-[#27272A] text-xs font-bold text-white"
              >
                <option value="Cu2">Copper (Cu2+, z = 2, M = 63.55 g/mol)</option>
                <option value="Ag">Silver (Ag+, z = 1, M = 107.87 g/mol)</option>
                <option value="Al">Aluminium (Al3+, z = 3, M = 26.98 g/mol)</option>
                <option value="Zn">Zinc (Zn2+, z = 2, M = 65.38 g/mol)</option>
                <option value="Ni">Nickel (Ni2+, z = 2, M = 58.69 g/mol)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold">Current (I in Amperes):</label>
              <input
                type="number"
                step="any"
                value={currentAmps}
                onChange={(e) => setCurrentAmps(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black border border-[#27272A] text-xs font-mono text-white font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold">Time (t in Seconds):</label>
              <input
                type="number"
                step="any"
                value={timeSeconds}
                onChange={(e) => setTimeSeconds(e.target.value)}
                placeholder="Seconds (e.g. 2415 for 40m 15s)"
                className="w-full p-2.5 rounded-xl bg-black border border-[#27272A] text-xs font-mono text-white font-bold"
              />
            </div>
          </div>

          {faradayResult && (
            <div className="p-5 rounded-2xl bg-[#050507] border border-amber-500/40 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
                <span className="text-xs font-bold text-amber-400 uppercase">
                  Cathode Reduction Half-Reaction:
                </span>
                <span className="font-mono text-xs text-white">
                  <MathRenderer content={`$${faradayResult.metal.ion}$`} />
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono text-xs">
                <div className="p-3 rounded-xl bg-black border border-[#27272A]">
                  <span className="text-[10px] text-zinc-500 uppercase block font-sans">Charge Q (I × t)</span>
                  <span className="text-base font-bold text-white">{faradayResult.Q.toLocaleString()} C</span>
                </div>
                <div className="p-3 rounded-xl bg-black border border-[#27272A]">
                  <span className="text-[10px] text-zinc-500 uppercase block font-sans">Moles of Electrons</span>
                  <span className="text-base font-bold text-sky-400">{faradayResult.molesElectrons.toFixed(4)} mol</span>
                </div>
                <div className="p-3 rounded-xl bg-black border border-[#27272A]">
                  <span className="text-[10px] text-zinc-500 uppercase block font-sans">Moles of Metal</span>
                  <span className="text-base font-bold text-amber-400">{faradayResult.molesMetal.toFixed(4)} mol</span>
                </div>
                <div className="p-3 rounded-xl bg-black border border-emerald-500/40">
                  <span className="text-[10px] text-zinc-500 uppercase block font-sans">Deposited Mass</span>
                  <span className="text-base font-black text-emerald-400">{faradayResult.massGrams.toFixed(4)} g</span>
                </div>
              </div>

              <div className="py-1 text-center">
                <MathRenderer content={`$$${faradayResult.latex}$$`} displayMode={true} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: CHEMICAL EQUILIBRIUM & ICE TABLE WORKSTATION */}
      {activeTab === 'ice_table' && (
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
            <div className="flex items-center space-x-2">
              <Table className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Chemical Equilibrium & ICE Table Workstation
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Initial, Change, Equilibrium Tables & Kc Derivation (JUPEB / A-Level Standard)
                </span>
              </div>
            </div>

            {/* Reaction Selector */}
            <div className="flex bg-[#121217] p-1 rounded-xl border border-[#27272A] overflow-x-auto max-w-full">
              {[
                { id: 'nh3', label: 'Haber N2 + 3H2 ⇌ 2NH3' },
                { id: 'hi', label: 'H2 + I2 ⇌ 2HI' },
                { id: 'pcl5', label: 'PCl5 ⇌ PCl3 + Cl2' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setIcePreset(p.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                    icePreset === p.id
                      ? 'bg-emerald-500 text-black font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-zinc-400 block font-sans">Initial Reactant 1 (mol):</label>
              <input
                type="number"
                step="any"
                value={iceMolesA}
                onChange={(e) => setIceMolesA(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black border border-[#27272A] text-white"
              />
            </div>
            {icePreset !== 'pcl5' && (
              <div className="space-y-1">
                <label className="text-zinc-400 block font-sans">Initial Reactant 2 (mol):</label>
                <input
                  type="number"
                  step="any"
                  value={iceMolesB}
                  onChange={(e) => setIceMolesB(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black border border-[#27272A] text-white"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-zinc-400 block font-sans">Equilibrium Product (mol):</label>
              <input
                type="number"
                step="any"
                value={iceEquilMolesC}
                onChange={(e) => setIceEquilMolesC(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black border border-[#27272A] text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 block font-sans">Vessel Volume V (dm³):</label>
              <input
                type="number"
                step="any"
                value={iceVesselVolume}
                onChange={(e) => setIceVesselVolume(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black border border-[#27272A] text-white"
              />
            </div>
          </div>

          {/* Governing Equation */}
          <div className="p-3 rounded-2xl bg-[#09090D] border border-emerald-500/30 text-center py-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">
              Balanced Chemical Equilibrium ({iceTableResult.name}):
            </span>
            <MathRenderer content={`$$${iceTableResult.reaction}$$`} displayMode={true} />
          </div>

          {/* Official ICE Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#27272A] bg-[#050507]">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#27272A] bg-[#121217] text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="p-3">ICE Parameter</th>
                  {iceTableResult.species.map((sp, sIdx) => (
                    <th key={sIdx} className="p-3 text-center">
                      <MathRenderer content={`$${sp}$`} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]/60 font-mono">
                <tr>
                  <td className="p-3 font-sans font-bold text-zinc-300">
                    <span className="text-emerald-400 font-black">I</span> — Initial Moles (mol)
                  </td>
                  {iceTableResult.initialMoles.map((im, idx) => (
                    <td key={idx} className="p-3 text-center text-white">
                      {im.toFixed(3)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-sans font-bold text-zinc-300">
                    <span className="text-sky-400 font-black">C</span> — Change in Moles (Δn)
                  </td>
                  {iceTableResult.changeLabels.map((ch, idx) => (
                    <td key={idx} className="p-3 text-center text-sky-400">
                      {ch} ({iceTableResult.changeMoles[idx] >= 0 ? `+${iceTableResult.changeMoles[idx].toFixed(3)}` : iceTableResult.changeMoles[idx].toFixed(3)})
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-sans font-bold text-zinc-300">
                    <span className="text-amber-400 font-black">E</span> — Equilibrium Moles (mol)
                  </td>
                  {iceTableResult.equilMoles.map((em, idx) => (
                    <td key={idx} className="p-3 text-center font-bold text-amber-300">
                      {em.toFixed(3)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-emerald-500/5">
                  <td className="p-3 font-sans font-bold text-emerald-400">
                    [E] — Equilibrium Conc (mol/dm³)
                  </td>
                  {iceTableResult.equilConc.map((ec, idx) => (
                    <td key={idx} className="p-3 text-center font-bold text-emerald-300">
                      {ec.toFixed(3)} M
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Equilibrium Constant Derivation */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#050507] border border-emerald-500/40 space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              Equilibrium Constant (Kc) Expression & Substitution:
            </span>
            <div className="py-1 text-center formula-scroll-container">
              <MathRenderer content={`$$${iceTableResult.formula}$$`} displayMode={true} />
            </div>
            <div className="py-1 text-center formula-scroll-container">
              <MathRenderer content={`$$${iceTableResult.sub}$$`} displayMode={true} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MOVING PARTICLE & REACTION DIAGRAMS */}
      {activeTab === 'diagrams' && (
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Interactive Moving Chemistry Diagrams
                </h3>
                <span className="text-[11px] text-zinc-400">Visual kinetic & electrochemical simulation</span>
              </div>
            </div>

            {/* Diagram selector */}
            <div className="flex bg-[#121217] p-1 rounded-xl border border-[#27272A] overflow-x-auto max-w-full">
              {[
                { id: 'collision', label: '1. Particle Collisions' },
                { id: 'galvanic', label: '2. Galvanic Cell' },
                { id: 'electrolytic', label: '3. Electrolytic Cell' },
                { id: 'equilibrium', label: '4. Dynamic Equilibrium' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDiagramType(d.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    diagramType === d.id
                      ? 'bg-emerald-500 text-black font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsSimRunning((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                {isSimRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isSimRunning ? 'Pause Motion' : 'Play Motion'}</span>
              </button>
            </div>

            {diagramType === 'collision' && (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-zinc-400">Temperature:</span>
                <input
                  type="range"
                  min={150}
                  max={600}
                  step={10}
                  value={chamberTemp}
                  onChange={(e) => setChamberTemp(parseInt(e.target.value, 10))}
                  className="w-36 accent-emerald-500 cursor-pointer"
                />
                <span className="font-mono text-emerald-400 font-bold">{chamberTemp} K</span>
                <span className="text-[10px] text-zinc-500">(Reacts when T ≥ 350K)</span>
              </div>
            )}
          </div>

          {/* Interactive HTML5 Canvas */}
          <div className="rounded-2xl border border-[#27272A] overflow-hidden bg-black shadow-inner flex justify-center">
            <canvas ref={canvasRef} width={760} height={380} className="w-full h-auto block max-w-full" />
          </div>

          <p className="text-xs text-zinc-400 text-center">
            {diagramType === 'collision' &&
              'Molecules move with velocities proportional to temperature. At high temperatures (T ≥ 350 K), kinetic energy exceeds the Activation Energy barrier (Ea), triggering reaction upon collision.'}
            {diagramType === 'galvanic' &&
              'Zinc atoms lose electrons at the anode (oxidation). Electrons travel through the wire generating +1.10 V potential to reduce copper ions onto the cathode (reduction), while ions flow through the salt bridge.'}
            {diagramType === 'electrolytic' &&
              'External DC battery forces non-spontaneous electrolysis: blue Cu²⁺ cations drift to the negative cathode gaining electrons to plate metallic copper (reduction), while oxygen gas bubbles evolve at the positive anode (oxidation).'}
            {diagramType === 'equilibrium' &&
              'Chemical equilibrium is dynamic: reactant conversion to products continues at the exact same rate as product reversal to reactants (Rf = Rr), keeping all concentrations constant.'}
          </p>
        </div>
      )}
    </div>
  );
};
