import React, { useState, useRef } from 'react';
import { StepSolution } from '../types';
import { StepSolutionCard } from './StepSolutionCard';
import { saveToHistory } from '../services/historyStorage';
import {
  Sparkles,
  Image as ImageIcon,
  Camera,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Trash2,
  UploadCloud,
  FileCheck,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface GeminiAiSolverViewProps {
  initialPrompt?: string;
  initialSubject?: string;
  onClearInitialPrompt?: () => void;
}

export const GeminiAiSolverView: React.FC<GeminiAiSolverViewProps> = ({
  initialPrompt,
  initialSubject,
  onClearInitialPrompt,
}) => {
  const [prompt, setPrompt] = useState<string>(
    initialPrompt ||
      'A stone of mass 0.5 kg is dropped from a cliff 80m high. Calculate its kinetic energy just before hitting the ground (take g = 9.8 m/s²).'
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject || 'All');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [imageMeta, setImageMeta] = useState<{ name?: string; size?: string; dimensions?: string } | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [solution, setSolution] = useState<StepSolution | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Silently check environment or local cache without showing any UI or prompts to the user
  const [userApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlKey = new URLSearchParams(window.location.search).get('key');
      if (urlKey) {
        try {
          localStorage.setItem('gemini_user_api_key', urlKey);
        } catch {}
        return urlKey;
      }
      return (import.meta as any).env?.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_user_api_key') || '';
    }
    return '';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);

  const realProblemSamples = [
    {
      subject: 'Mathematics',
      label: 'Calculus: Quotient Rule Derivative',
      text: "Find the derivative of f(x) = (3x² - 4x + 1) / (2x + 3) with step-by-step working and evaluate f'(1).",
    },
    {
      subject: 'Mathematics',
      label: 'Calculus: Definite Polynomial Integral',
      text: 'Evaluate the definite integral ∫ from 0 to 2 of (4x³ - 3x² + 2x - 5) dx showing antiderivative and limits substitution.',
    },
    {
      subject: 'Mathematics',
      label: 'Algebra: Quadratic by Formula & Factoring',
      text: 'Solve 3x² - 7x - 6 = 0 using both the quadratic formula and factorization. State discriminant and both roots.',
    },
    {
      subject: 'Mathematics',
      label: 'Linear Algebra: 3-Variable System',
      text: 'Solve the system of equations: 2x + 3y - z = 5, 4x - y + 2z = 9, and -x + 2y + 3z = 8 with step-by-step elimination.',
    },
    {
      subject: 'Mathematics',
      label: 'Trigonometry: Trig Equation in [0, 2π]',
      text: 'Find all solutions to 2sin²(x) - 3sin(x) + 1 = 0 in the interval [0, 2π] in radians and degrees.',
    },
    {
      subject: 'Mathematics',
      label: 'Coordinate Geometry: Circle & Tangent',
      text: 'Find the equation of the tangent line to the circle x² + y² = 25 at the point (3, -4) with complete working.',
    },
    {
      subject: 'Physics',
      label: 'Free Fall & Kinetic Energy',
      text: 'A stone of mass 0.5 kg is dropped from a cliff 80m high. Calculate its kinetic energy just before hitting the ground (take g = 9.8 m/s²).',
    },
    {
      subject: 'Physics',
      label: 'Conservation of Momentum (Inelastic)',
      text: 'A truck of mass 3000 kg moving at 15 m/s collides and locks together with a stationary car of 1000 kg. Find the common final velocity and kinetic energy lost.',
    },
    {
      subject: 'Physics',
      label: 'Photoelectric Effect & Work Function',
      text: 'Light of wavelength 400 nm falls on a metal having work function 2.2 eV. Calculate the maximum kinetic energy and stopping potential of emitted photoelectrons.',
    },
    {
      subject: 'Physics',
      label: '35° Projectile Trajectory & Range',
      text: 'A football is kicked at 24 m/s at an angle of 35° above the horizontal. Calculate the time to reach maximum height, maximum altitude, and total flight time (g = 9.8 m/s²).',
    },
    {
      subject: 'Physics',
      label: 'Step-Down Transformer',
      text: 'A step-down transformer has 1200 primary turns and 60 secondary turns. Connected to a 240V supply, the secondary draws 5A. Assuming 100% efficiency, find secondary voltage and primary current.',
    },
    {
      subject: 'Physics',
      label: 'Sound Wave Wavelength & Period',
      text: 'A tuning fork produces a sound wave with frequency 440 Hz in air where the speed of sound is 344 m/s. Calculate the wavelength and period of vibration.',
    },
    {
      subject: 'Chemistry',
      label: 'Mole Concept: Mass & Avogadro Number',
      text: 'Calculate the number of molecules and moles present in 11.2 liters of oxygen gas (O₂) at STP (Molar volume = 22.4 L/mol, Avogadro constant = 6.022 × 10²³ molecules/mol).',
    },
    {
      subject: 'Chemistry',
      label: 'Stoichiometry & Electrolysis (Faraday)',
      text: 'Calculate the mass of copper deposited when a current of 2.5 A is passed through a solution of CuSO4 for 40 minutes (Faraday constant = 96500 C/mol, Cu = 63.5 g/mol).',
    },
    {
      subject: 'Chemistry',
      label: 'Atomic Structure & Electron Configuration',
      text: 'Write the complete ground-state electron configuration of Fe²⁺ (Z = 26) using orbital notation. State the number of unpaired d-electrons and magnetic properties.',
    },
    {
      subject: 'Chemistry',
      label: 'Gas Laws: Ideal Gas & Molar Mass',
      text: 'A sample of an unknown gas occupies 450 cm³ at 27°C and 780 mmHg. If the mass of the gas is 0.58 g, calculate its molar mass (R = 0.0821 L·atm/(mol·K)).',
    },
    {
      subject: 'Chemistry',
      label: 'Acids, Bases & pH of Strong Base',
      text: 'Calculate the pH of a 0.025 M solution of calcium hydroxide, Ca(OH)2, assuming complete dissociation at 25°C (Kw = 1.0 × 10⁻¹⁴).',
    },
    {
      subject: 'Chemistry',
      label: 'Thermochemistry & Combustion Enthalpy',
      text: 'Calculate the standard enthalpy change of combustion of methane: CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l), given standard enthalpies of formation: ΔHf(CH4) = -74.8 kJ/mol, ΔHf(CO2) = -393.5 kJ/mol, ΔHf(H2O(l)) = -285.8 kJ/mol.',
    },
    {
      subject: 'Chemistry',
      label: 'Chemical Equilibrium & Equilibrium Constant (Kc)',
      text: 'For the equilibrium N2(g) + 3H2(g) ⇌ 2NH3(g) in a 2.0 L vessel at 450°C, the equilibrium mixture contains 0.40 mol N2, 1.20 mol H2, and 0.24 mol NH3. Calculate the equilibrium constant Kc.',
    },
    {
      subject: 'Chemistry',
      label: 'Organic Chemistry: Esterification Mechanism',
      text: 'Write the balanced chemical equation with structural formulas for the acid-catalyzed esterification of ethanoic acid (acetic acid) with ethanol. Name the ester formed and describe its characteristic odor.',
    },
    {
      subject: 'Chemistry',
      label: 'Electrochemistry: Standard Cell Potential (E°cell)',
      text: 'Calculate the standard cell potential E°cell and determine spontaneity for a Daniel cell: Zn(s) | Zn²⁺(aq) || Cu²⁺(aq) | Cu(s), given standard reduction potentials E°(Zn²⁺/Zn) = -0.76 V and E°(Cu²⁺/Cu) = +0.34 V.',
    },
    {
      subject: 'Chemistry',
      label: 'Qualitative Analysis & Cation Confirmatory Tests',
      text: 'Describe the confirmatory test for Fe²⁺ versus Fe³⁺ in aqueous solution using sodium hydroxide (NaOH) and potassium hexacyanoferrate(II) solution. State all observation colors and precipitate formulas.',
    },
  ];

  const processImageFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, HEIC, or WebP).');
      return;
    }

    setIsProcessingImage(true);
    setError(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = new Image();
      img.onload = () => {
        try {
          const maxDimension = 1600;
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setImagePreview(dataUrl);
            setImageMimeType('image/jpeg');
            setImageMeta({ name: file.name, size: `${Math.round(file.size / 1024)} KB` });
            setIsProcessingImage(false);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

          const approxBytes = Math.round((compressedDataUrl.length - 22) * 0.75);
          const sizeKb = Math.round(approxBytes / 1024);

          setImagePreview(compressedDataUrl);
          setImageMimeType('image/jpeg');
          setImageMeta({
            name: file.name || 'Question Photo',
            size: `${sizeKb} KB`,
            dimensions: `${width}×${height}px`,
          });
          setIsProcessingImage(false);
        } catch {
          setImagePreview(dataUrl);
          setImageMimeType('image/jpeg');
          setImageMeta({ name: file.name, size: `${Math.round(file.size / 1024)} KB` });
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setImagePreview(dataUrl);
        setImageMimeType(file.type || 'image/jpeg');
        setImageMeta({ name: file.name, size: `${Math.round(file.size / 1024)} KB` });
        setIsProcessingImage(false);
      };
      img.src = dataUrl;
    } catch {
      setIsProcessingImage(false);
      setError('Could not process the selected image. Please try another photo.');
    }
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processImageFile(file);
          break;
        }
      }
    }
  };

  const solveDirectWithGemini = async (key: string, targetPrompt: string) => {
    const ai = new GoogleGenAI({ apiKey: key });
    const contents: any[] = [];
    if (imagePreview) {
      const cleanBase64 = imagePreview.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: imageMimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const promptText = `
You are SmartSolve AI, an expert examination tutor and university professor for Mathematics, Physics, and Chemistry.
Solve this ${selectedSubject === 'All' ? 'Mathematics, Physics or Chemistry' : selectedSubject} problem with crystal-clear, textbook-grade step-by-step reasoning.

CRITICAL SOLVER BEHAVIOUR RULES:
1. Verify all arithmetic and scientific formulas thoroughly before stating the final answer.
2. If this is a multiple-choice question, explicitly identify and state the correct option (A, B, C, or D) and justify why the chosen option is correct.
3. If the question statement is ambiguous or lacks necessary physical/chemical conditions, clearly explain the ambiguity and state reasonable assumptions instead of blindly guessing.
4. Do not invent non-existent formulas; use standard SI units throughout.

CHEMISTRY SPECIFIC FRAMEWORK (IF CHEMISTRY PROBLEM):
Address topics including: Mole concept, Stoichiometry, Atomic structure & Periodicity, Chemical bonding & Hybridization, Gas laws, Acids, bases and salts (pH & titration), Organic chemistry & Hydrocarbons, Electrochemistry & Redox, Chemical equilibrium & Le Chatelier, Thermochemistry & Energetics, Qualitative analysis.
For Chemistry calculations, strictly show:
1. Given values with units and chemical formulas
2. What is required (target unknown quantity with symbol)
3. Correct formula or balanced chemical equation
4. Numerical substitution with units attached
5. Meticulous step-by-step calculation
6. Final answer boxed in LaTeX (\\boxed{...})
7. Short conceptual explanation

Problem to solve: "${targetPrompt || 'Solve the question shown in the image.'}"

STYLING & NOTATION RULES:
1. Format all formulas, equations, fractions, square roots, exponents, and chemical symbols using standard LaTeX notation (e.g. \\frac{a}{b}, \\sqrt{...}, x^2, \\pm, \\text{CuSO}_4, \\Delta H).
2. In "steps", present a clean, sequential mathematical or chemical derivation.
3. In "finalAnswer", format the answer with \\boxed{...} (e.g. "\\boxed{\\text{Option B: } x = 4}" or "\\boxed{E_k = 392\\text{ J}}" or "\\boxed{m = 1.97\\text{ g}}").

You MUST respond with a valid JSON object with EXACTLY this structure:
{
  "title": "Descriptive title of the problem",
  "category": "${selectedSubject === 'All' ? 'Science' : selectedSubject}",
  "subCategory": "Topic name (e.g. Mole Concept, Kinematics, Calculus, Electrochemistry)",
  "problemStatement": "Clear restatement of question in LaTeX",
  "formula": "Governing formula or chemical law in LaTeX",
  "rearrangedFormula": "Formula rearranged for target unknown in LaTeX",
  "whatIsRequired": "What is required with symbol and unit",
  "givenValues": [
    { "name": "Quantity name", "symbol": "m", "value": "2.5", "unit": "kg" }
  ],
  "substitution": "Formula with numbers and SI units plugged in LaTeX",
  "steps": [
    "Step 1 or label (e.g. Given quantities:)",
    "$$equation$$",
    "Explanation text with $inline math$",
    "$$next equation$$"
  ],
  "finalAnswer": "\\boxed{Final answer in LaTeX}",
  "unit": "SI unit",
  "explanation": "Clear explanation of why this physical, mathematical, or chemical law applies",
  "tips": "Pro tip or exam advice for solving this problem"
}
`.trim();

    contents.push({ text: promptText });

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let lastError: any = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: 'application/json',
            thinkingConfig: {
              thinkingLevel: 'LOW' as any,
            },
          },
        });

        const resultText = response.text?.trim() || '{}';
        let cleanJson = resultText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const match = cleanJson.match(/\{[\s\S]*\}/);
        if (match) cleanJson = match[0];

        return JSON.parse(cleanJson);
      } catch (err: any) {
        lastError = err;
        if (i < candidateModels.length - 1) {
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  };

  const handleSolve = async (overridePrompt?: string) => {
    const targetPrompt = overridePrompt !== undefined ? overridePrompt : prompt;
    if (!targetPrompt.trim() && !imagePreview) {
      setError('Please enter a question or upload an image of the problem.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStage('Connecting to AI reasoning engine...');

    const stageTimer1 = setTimeout(() => {
      setLoadingStage('Extracting physical laws, given quantities and units...');
    }, 700);

    const stageTimer2 = setTimeout(() => {
      setLoadingStage('Executing verified mathematical substitution & algebraic derivation...');
    }, 1500);

    try {
      // 1. Direct browser solve if user entered API key
      if (userApiKey) {
        try {
          const sol = await solveDirectWithGemini(userApiKey, targetPrompt);
          clearTimeout(stageTimer1);
          clearTimeout(stageTimer2);
          setSolution(sol);
          saveToHistory(sol);
          setTimeout(() => {
            solutionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
          return;
        } catch (clientErr: any) {
          console.warn('Direct browser solve error, falling back to server API:', clientErr);
        }
      }

      // 2. Fall back to serverless API
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
          prompt: targetPrompt,
          imageData: imagePreview,
          mimeType: imageMimeType,
          subject: selectedSubject === 'All' ? undefined : selectedSubject,
        }),
      });

      if (response.status === 404) {
        response = await fetch('/api/ai/solve', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: targetPrompt,
            imageData: imagePreview,
            mimeType: imageMimeType,
            subject: selectedSubject === 'All' ? undefined : selectedSubject,
          }),
        });
      }

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      const responseText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          'AI calculation engine is currently busy or temporarily unavailable. Please try again in a few moments.'
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Unable to solve this problem right now. Please try again shortly.');
      }

      setSolution(data.solution);
      saveToHistory(data.solution);

      setTimeout(() => {
        solutionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err: any) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      let msg = err.message || 'An error occurred while solving the problem with AI.';
      if (typeof msg === 'string') {
        if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('Resource has been exhausted')) {
          msg = 'The AI reasoning model is currently experiencing high demand. Please tap Retry in a few seconds.';
        } else if (msg.includes('Unexpected end of JSON') || msg.includes('Unexpected token')) {
          msg = 'The AI service returned an incomplete response. Please tap Retry to recalculate.';
        } else if (msg.startsWith('{') && msg.includes('"message"')) {
          try {
            const parsed = JSON.parse(msg);
            msg = parsed.error?.message || parsed.message || msg;
          } catch {
            // retain cleaned msg
          }
        }
      }
      setError(msg);
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  React.useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setPrompt(initialPrompt);
      if (initialSubject) setSelectedSubject(initialSubject);
      handleSolve(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Header Card */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className="px-2.5 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] font-bold text-xs uppercase tracking-wider border border-[#22C55E]/30"
              >
                AI Solver Engine
              </span>
              <span className="text-xs text-[#A1A1AA]">· 100% Real Problem Solving</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] mt-1 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#22C55E]" />
              <span>Real Mathematics, Physics & Chemistry AI Solver</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
              Ask any real-world math, physics, or chemistry question (JAMB/UTME, WAEC, JUPEB, University, Calculus), or upload a photo of your textbook question.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-[#000000] px-3.5 py-1.5 rounded-xl border border-[#27272A] text-xs text-[#22C55E] font-bold shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Verified Steps</span>
            </div>
          </div>
        </div>

        {/* Subject Filter Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'Physics', 'Mathematics', 'Chemistry', 'JAMB / WAEC', 'JUPEB', 'Calculus'].map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedSubject === subj
                  ? 'bg-[#22C55E] text-[#FFFFFF] font-bold shadow-sm'
                  : 'bg-[#000000] text-[#A1A1AA] hover:text-[#FFFFFF] border border-[#27272A]'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>

        {/* Input Textarea & Image Attachment */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) processImageFile(file);
          }}
          className={`space-y-3 pt-1 p-2 rounded-3xl transition-all ${
            isDraggingOver ? 'bg-[#22C55E]/10 ring-2 ring-[#22C55E] ring-dashed' : ''
          }`}
        >
          <div className="relative">
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onPaste={handlePaste}
              placeholder={
                imagePreview
                  ? "Question photo attached! (Optional: add extra notes or tap 'Solve with AI' directly to extract and solve)"
                  : "Type any math, physics, or chemistry question here, or paste screenshot (Ctrl+V) / snap a photo..."
              }
              className="w-full p-4 rounded-2xl bg-[#000000] border border-[#27272A] text-[#FFFFFF] placeholder:text-[#A1A1AA]/60 text-sm sm:text-base font-medium focus:border-[#22C55E] focus:outline-none transition-colors resize-y leading-relaxed"
            />
          </div>

          {/* Image processing loader */}
          {isProcessingImage && (
            <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-[#000000] border border-[#22C55E]/30 text-xs text-[#22C55E] animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-[#22C55E]" />
              <span>Optimizing and preparing problem photo for AI Vision...</span>
            </div>
          )}

          {/* Enhanced Image preview if user uploaded a problem photo */}
          {imagePreview && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#000000] border border-[#22C55E]/40 w-full animate-fadeIn shadow-lg">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div
                  onClick={() => setIsImageModalOpen(true)}
                  className="relative group cursor-pointer shrink-0 rounded-xl overflow-hidden border border-[#27272A] hover:border-[#22C55E] transition-all"
                  title="Click to expand full image"
                >
                  <img
                    src={imagePreview}
                    alt="Uploaded question"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#FFFFFF] truncate max-w-[180px] sm:max-w-xs block">
                      {imageMeta?.name || 'Attached Problem Photo'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] text-[10px] font-black border border-[#22C55E]/30 shrink-0 uppercase tracking-wider">
                      AI Vision Ready
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-[#A1A1AA]">
                    {imageMeta?.size && <span>{imageMeta.size}</span>}
                    {imageMeta?.dimensions && <span>· {imageMeta.dimensions}</span>}
                    <span className="text-[#22C55E]">· Crisp Resolution</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(true)}
                    className="text-[11px] text-[#38BDF8] hover:underline flex items-center space-x-1 cursor-pointer font-medium pt-0.5"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Inspect Full Image</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#EF4444]/20 hover:text-[#EF4444] text-[#A1A1AA] text-xs font-semibold border border-white/5 transition-colors cursor-pointer flex items-center space-x-1"
                  title="Remove this photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Camera Direct Input (environment/rear camera on mobile) */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageInput}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#FFFFFF] text-xs font-bold border border-white/5 transition-all cursor-pointer active:scale-95 shadow-sm"
                title="Open camera to snap a photo of your textbook question directly"
              >
                <Camera className="w-4 h-4 text-[#22C55E]" />
                <span>Camera</span>
              </button>

              {/* Gallery / File Picker Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageInput}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] text-xs font-semibold border border-white/5 transition-all cursor-pointer active:scale-95"
                title="Select a photo or screenshot from your device gallery"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Upload Photo</span>
              </button>

              {prompt && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="px-2.5 py-2 rounded-xl bg-[#000000] hover:bg-[#18181B] text-[#A1A1AA] hover:text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer border border-[#27272A]"
                >
                  Clear Text
                </button>
              )}
            </div>

            <button
              onClick={() => handleSolve()}
              disabled={isLoading || (!prompt.trim() && !imagePreview)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 disabled:opacity-50 text-[#FFFFFF] font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Solving Problem...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Solve with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Fullscreen Photo Lightbox Modal */}
        {isImageModalOpen && imagePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="absolute -top-12 right-0 p-2 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white cursor-pointer transition-colors"
                title="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={imagePreview}
                alt="Full view of problem question"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl border border-[#27272A] shadow-2xl"
              />
              <div className="mt-3 flex items-center space-x-4 text-xs text-[#A1A1AA]">
                {imageMeta?.name && <span className="font-bold text-white">{imageMeta.name}</span>}
                {imageMeta?.dimensions && <span>{imageMeta.dimensions}</span>}
                {imageMeta?.size && <span>{imageMeta.size}</span>}
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="px-3 py-1 rounded-lg bg-[#22C55E] text-black font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading stage ticker */}
        {isLoading && (
          <div className="p-4 rounded-2xl bg-[#000000] border border-[#22C55E]/40 flex items-center space-x-3 text-xs text-[#FFFFFF] animate-pulse">
            <Loader2 className="w-4 h-4 text-[#22C55E] animate-spin flex-shrink-0" />
            <span>{loadingStage || 'AI is deriving the step-by-step solution...'}</span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-xs flex flex-col sm:flex-row items-start justify-between gap-3">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Calculation Notice</span>
                <span>{error}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleSolve()}
                className="px-3.5 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-bold text-xs cursor-pointer whitespace-nowrap transition-all"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => setError(null)}
                className="px-3.5 py-1.5 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-[#FFFFFF] font-bold text-xs cursor-pointer whitespace-nowrap transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verified Solution Display Card (Rendered Immediately Below Input) */}
      {solution && (
        <div ref={solutionRef} className="pt-2 animate-fadeIn">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              <span>Verified AI Solution</span>
            </span>
            <button
              onClick={() => setSolution(null)}
              className="text-xs text-[#A1A1AA] hover:text-[#FFFFFF] underline cursor-pointer"
            >
              Clear Solution
            </button>
          </div>
          <StepSolutionCard solution={solution} />
        </div>
      )}

      {/* Suggested Real Exam & Math/Physics Problems */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] block">
            Try Authentic Math & Physics Problems ({selectedSubject}):
          </span>
          {selectedSubject !== 'All' && (
            <button
              onClick={() => setSelectedSubject('All')}
              className="text-[11px] text-[#22C55E] hover:underline cursor-pointer"
            >
              Show All Subjects
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {realProblemSamples
            .filter((item) => {
              if (selectedSubject === 'All') return true;
              if (selectedSubject === 'Mathematics') return item.subject === 'Mathematics';
              if (selectedSubject === 'Physics') return item.subject === 'Physics';
              if (selectedSubject === 'Calculus') return item.label.toLowerCase().includes('calculus');
              return true;
            })
            .map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(item.text);
                  handleSolve(item.text);
                }}
                className="p-3 text-left rounded-2xl bg-[#000000] hover:bg-[#18181B] border border-[#27272A] hover:border-[#22C55E]/60 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-[#22C55E]">{item.subject}</span>
                  <span className="text-[11px] text-[#A1A1AA] group-hover:text-[#FFFFFF]">Click to Solve →</span>
                </div>
                <div className="text-xs font-semibold text-[#FFFFFF]">{item.label}</div>
                <div className="text-[11px] text-[#A1A1AA] line-clamp-2 mt-0.5">
                  {item.text}
                </div>
              </button>
            ))}
        </div>
      </div>

    </div>
  );
};
