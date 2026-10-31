import React, { useState, useRef, useEffect } from 'react';
import { StepSolution, ChatMessage } from '../types';
import { StepSolutionCard } from './StepSolutionCard';
import { MathRenderer } from './MathRenderer';
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
  MessageSquare,
  Send,
  Bot,
  User,
  RotateCcw,
  HelpCircle,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Zap,
  Award,
  Info,
  CornerDownLeft,
  ArrowRight,
  Calculator,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Paperclip,
  Play,
  Pause,
  Square,
  Sliders,
  Headphones,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface GeminiAiSolverViewProps {
  initialPrompt?: string;
  initialSubject?: string;
  onClearInitialPrompt?: () => void;
  initialTab?: 'solver' | 'chat';
}

export const GeminiAiSolverView: React.FC<GeminiAiSolverViewProps> = ({
  initialPrompt,
  initialSubject,
  onClearInitialPrompt,
  initialTab = 'solver',
}) => {
  const [activeSolverTab, setActiveSolverTab] = useState<'solver' | 'chat'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveSolverTab(initialTab);
    }
  }, [initialTab]);
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

  // Chat Features State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am **SmartSolve AI**, your versatile conversational companion and academic tutor (just like ChatGPT).\n\nAsk me anything! From coding, essays, everyday questions, and philosophy to deep derivations in Math, Physics, and Chemistry. You can type, send a voice note 🎙️, or upload a photo 📷 of your homework!',
      timestamp: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Chat Photo Upload State
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
  const [chatImageMimeType, setChatImageMimeType] = useState<string>('image/jpeg');
  const [chatImageMeta, setChatImageMeta] = useState<{ name: string; size: string } | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatCameraInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp-Style Voice Note Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordingTranscript, setRecordingTranscript] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Voice Customization Settings
  const [voiceSettings, setVoiceSettings] = useState<{
    voiceURI: string;
    rate: number;
    pitch: number;
    autoSpeak: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('smartsolve_voice_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      voiceURI: '',
      rate: 1.0,
      pitch: 1.0,
      autoSpeak: false,
    };
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  const [expandedExplanation, setExpandedExplanation] = useState<{
    concept: boolean;
    derivation: boolean;
    alternative: boolean;
    mistakes: boolean;
  }>({
    concept: true,
    derivation: true,
    alternative: true,
    mistakes: true,
  });

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
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

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
  "intuitiveConcept": "Crystal-clear conceptual analogy explaining what is actually happening physically or mathematically in plain English without confusing jargon.",
  "detailedDerivation": [
    "Derivation point 1: First fundamental law or axiom establishing the relation.",
    "Derivation point 2: Rigorous algebraic substitution step and cancellation logic.",
    "Derivation point 3: Dimensional consistency verification and why this exact formula holds."
  ],
  "alternativeMethod": "Alternative solving method, shortcut, or dimensional cross-check.",
  "commonMistakes": "Frequent student traps, unit conversion pitfalls, or invalid assumptions to avoid on exams.",
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

  const chatDirectWithGemini = async (
    key: string,
    text: string,
    ctx?: any,
    hist?: Array<{ role: string; content: string }>
  ) => {
    const aiClient = new GoogleGenAI({ apiKey: key });
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

    let prompt = `You are SmartSolve AI, an expert, extraordinarily patient, and encouraging personal STEM tutor for Mathematics, Physics, and Chemistry (covering JAMB/UTME, WAEC/WASSCE, JUPEB, and University levels).
Format all mathematical symbols, calculations, and chemical equations using LaTeX ($...$ and $$...$$).`;
    if (ctx) {
      prompt += `\n\nActive Problem Context: ${ctx.title || ctx.problemStatement || ''}\nFormula: ${ctx.formula || 'N/A'}\nFinal Answer: ${ctx.finalAnswer || 'N/A'}`;
      if (Array.isArray(ctx.steps)) {
        prompt += `\nWorking Steps:\n${ctx.steps.join('\n')}`;
      }
    }
    if (hist && hist.length > 0) {
      prompt += `\n\nRecent History:\n${hist.map((h) => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.content}`).join('\n')}`;
    }
    prompt += `\n\nStudent: ${text}\n\nTutor:`;
    contents.push({ text: prompt });

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let lastErr: any = null;
    for (const m of candidateModels) {
      try {
        const res = await aiClient.models.generateContent({
          model: m,
          contents,
          config: { temperature: 0.7 },
        });
        return res.text?.trim() || '';
      } catch (err: any) {
        lastErr = err;
      }
    }
    throw lastErr;
  };

  const handleSendChatMessage = async (
    overrideText?: string,
    overrideImage?: string,
    isVoice?: boolean,
    voiceDurationSeconds?: number
  ) => {
    const textToSend = (overrideText !== undefined ? overrideText : chatInput).trim();
    const activeImage = overrideImage !== undefined ? overrideImage : chatImagePreview;
    const activeMime = chatImageMimeType || 'image/jpeg';

    if (!textToSend && !activeImage) return;
    if (isChatLoading) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend || (activeImage ? 'Analyze and explain this attached image' : ''),
      timestamp: Date.now(),
      imageData: activeImage || undefined,
      imageMimeType: activeImage ? activeMime : undefined,
      isVoiceNote: Boolean(isVoice),
      voiceDuration: voiceDurationSeconds,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    if (overrideText === undefined) {
      setChatInput('');
    }
    setChatImagePreview(null);
    setChatImageMeta(null);

    setIsChatLoading(true);
    setChatError(null);

    setTimeout(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    const problemContext = solution
      ? {
          title: solution.title,
          category: solution.category,
          subCategory: solution.subCategory,
          problemStatement: solution.problemStatement,
          formula: solution.formula,
          finalAnswer: solution.finalAnswer,
          explanation: solution.explanation,
          intuitiveConcept: solution.intuitiveConcept,
          steps: solution.steps,
        }
      : undefined;

    const historyPayload = chatMessages
      .filter((m) => m.id !== 'welcome')
      .slice(-8)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      // 1. Direct browser solve if user entered API key
      if (userApiKey) {
        try {
          const directReply = await chatDirectWithGemini(userApiKey, textToSend, problemContext, historyPayload);
          if (directReply) {
            const botMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: directReply,
              timestamp: Date.now(),
            };
            setChatMessages((prev) => [...prev, botMessage]);
            setTimeout(() => {
              chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 80);

            if (voiceSettings.autoSpeak) {
              setTimeout(() => {
                handleToggleSpeech(botMessage.id, directReply);
              }, 300);
            }
            return;
          }
        } catch (directChatErr) {
          console.warn('Direct chat failed, falling back to server /api/chat:', directChatErr);
        }
      }

      // 2. Server API call
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (userApiKey && userApiKey.length > 20) {
        headers['x-gemini-key'] = userApiKey;
      }

      const requestPayload = {
        message: textToSend,
        history: historyPayload,
        context: problemContext,
        problemContext: problemContext,
        imageData: activeImage || imagePreview,
        mimeType: activeImage ? activeMime : imageMimeType,
      };

      let response: Response;
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestPayload),
        });

        // If server was temporarily restarting or busy, automatically retry once
        if (!response.ok && (response.status === 503 || response.status === 502 || response.status === 500)) {
          await new Promise((r) => setTimeout(r, 700));
          response = await fetch('/api/chat', {
            method: 'POST',
            headers,
            body: JSON.stringify(requestPayload),
          });
        }
      } catch (netErr) {
        // Automatic fallback retry to /api/ai/chat
        await new Promise((r) => setTimeout(r, 600));
        response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestPayload),
        });
      }

      if (response.status === 404) {
        response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestPayload),
        });
      }

      const responseText = await response.text();
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        throw new Error('AI Tutor service is refreshing. Please tap Retry in a moment.');
      }

      let responseData: any = null;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { success: response.ok, reply: responseText };
      }

      if (!response.ok || (responseData && responseData.success === false)) {
        let errStr = responseData?.error || responseData?.message;
        if (!errStr) {
          errStr = response.status === 503
            ? 'The AI Tutor model is currently experiencing high demand. Please tap Retry in a few moments.'
            : `AI Tutor service notice (${response.status}). Please tap Retry.`;
        }
        if (typeof errStr === 'string' && errStr.startsWith('{') && errStr.includes('"message"')) {
          try {
            const parsed = JSON.parse(errStr);
            errStr = parsed.error?.message || parsed.message || errStr;
          } catch {}
        }
        throw new Error(errStr);
      }

      const botReply = responseData.reply || responseData.text || 'I have analyzed your question.';
      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: botReply,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, botMessage]);
      setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);

      // Auto-speak reply if enabled
      if (voiceSettings.autoSpeak) {
        setTimeout(() => {
          handleToggleSpeech(botMessage.id, botReply);
        }, 300);
      }
    } catch (chatErr: any) {
      console.error('Chat error:', chatErr);
      let msg = chatErr.message || 'The AI Tutor model is currently experiencing temporary high demand. Please tap Retry.';
      if (typeof msg === 'string') {
        if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('Resource has been exhausted')) {
          msg = 'The AI Tutor model is currently experiencing temporary high demand. Please tap Retry in a few moments.';
        } else if (msg.includes('API key not valid') || msg.includes('INVALID_ARGUMENT')) {
          msg = 'AI reasoning service is reconnecting. Please tap Retry.';
        }
      }
      setChatError(msg);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setChatError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setChatImagePreview(result);
      setChatImageMimeType(file.type || 'image/jpeg');
      setChatImageMeta({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
      });
    };
    reader.readAsDataURL(file);
  };

  const startVoiceRecording = async () => {
    if (typeof window === 'undefined') return;
    try {
      setRecordingSeconds(0);
      setRecordingTranscript('');
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.onresult = (event: any) => {
            let full = '';
            for (let i = 0; i < event.results.length; i++) {
              full += event.results[i][0].transcript;
            }
            setRecordingTranscript(full);
          };
          recognition.onerror = () => {};
          recognition.start();
          recognitionRef.current = recognition;
        } catch {}
      }

      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setChatError('Microphone permission is required to send voice notes. Please allow microphone access.');
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setRecordingTranscript('');
    audioChunksRef.current = [];
  };

  const sendVoiceRecording = () => {
    const finalSeconds = recordingSeconds;
    const finalTranscript = recordingTranscript.trim();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    setIsRecording(false);
    setRecordingSeconds(0);

    const spokenText = finalTranscript || 'Voice note audio message';
    handleSendChatMessage(spokenText, undefined, true, Math.max(finalSeconds, 1));
  };

  const handleAskAboutStep = (stepNumber: number, stepText: string) => {
    setActiveSolverTab('chat');
    const promptMessage = `Can you explain Step ${stepNumber} in more detail? Step: "${stepText}". Why is this operation performed and what is the underlying physical/mathematical principle?`;
    handleSendChatMessage(promptMessage);
  };

  const handleLaunchChatPrompt = (promptText: string) => {
    setActiveSolverTab('chat');
    handleSendChatMessage(promptText);
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Hello! I am **SmartSolve AI**, your versatile conversational companion and academic tutor (just like ChatGPT).\n\nAsk me anything! From coding, essays, everyday questions, and philosophy to deep derivations in Math, Physics, and Chemistry. You can type, send a voice note 🎙️, or upload a photo 📷 of your homework!',
        timestamp: Date.now(),
      },
    ]);
    setChatError(null);
  };

  const handleCopyMessage = (id: string, text: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  const handleToggleSpeech = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanSpeech = text
      .replace(/\$\$(.*?)\$\$/g, ' equation: $1 ')
      .replace(/\$(.*?)\$/g, ' $1 ')
      .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '$1 over $2')
      .replace(/\\sqrt\{(.*?)\}/g, 'square root of $1')
      .replace(/\\times/g, 'times')
      .replace(/\\pm/g, 'plus or minus')
      .replace(/\\boxed\{(.*?)\}/g, '$1')
      .replace(/[*#_`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    if (voiceSettings.voiceURI && availableVoices.length > 0) {
      const selected = availableVoices.find((v) => v.voiceURI === voiceSettings.voiceURI);
      if (selected) utterance.voice = selected;
    }
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveVoiceSettings = (newSettings: typeof voiceSettings) => {
    setVoiceSettings(newSettings);
    try {
      localStorage.setItem('smartsolve_voice_settings', JSON.stringify(newSettings));
    } catch {}
  };

  const toggleExplanation = (section: 'concept' | 'derivation' | 'alternative' | 'mistakes') => {
    setExpandedExplanation((prev) => ({ ...prev, [section]: !prev[section] }));
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
      {/* Top Mode Navigation Tabs: AI Step Solver vs AI STEM Tutor Chat */}
      <div className="flex items-center space-x-2 bg-[#0A0A0A] p-1.5 rounded-2xl border border-[#27272A] shadow-md">
        <button
          type="button"
          onClick={() => setActiveSolverTab('solver')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSolverTab === 'solver'
              ? 'bg-[#22C55E] text-white shadow-lg shadow-emerald-500/20'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>AI Step Solver</span>
          {solution && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeSolverTab === 'solver' ? 'bg-black/30 text-white' : 'bg-[#22C55E]/20 text-[#22C55E]'
              }`}
            >
              Active Solution
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSolverTab('chat')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSolverTab === 'chat'
              ? 'bg-[#22C55E] text-white shadow-lg shadow-emerald-500/20'
              : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>AI STEM Tutor Chat</span>
          {chatMessages.length > 1 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeSolverTab === 'chat' ? 'bg-black/30 text-white' : 'bg-[#22C55E]/20 text-[#22C55E]'
              }`}
            >
              {chatMessages.length - 1} msg{chatMessages.length > 2 ? 's' : ''}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: AI Step Solver */}
      {activeSolverTab === 'solver' && (
        <div className="space-y-6 animate-fadeIn">
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
        <div ref={solutionRef} className="pt-2 space-y-4 animate-fadeIn">
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

          {/* Deep Conceptual & Derivation Breakdown */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#27272A] gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Deep Conceptual & Derivation Breakdown</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E]">
                      Mastery
                    </span>
                  </h3>
                  <p className="text-xs text-[#A1A1AA]">
                    Intuitive mental model, mathematical rationale, alternate shortcuts & traps to avoid.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleLaunchChatPrompt(
                    `I want to understand the concept behind "${solution.title || 'this problem'}" more deeply. Can you explain the intuitive concept and give me a relatable real-life analogy?`
                  )
                }
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-[#22C55E] border border-[#27272A] transition-colors cursor-pointer shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discuss with Tutor</span>
              </button>
            </div>

            {/* 1. Intuitive Concept & Physical Meaning */}
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleExplanation('concept')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#18181B]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Intuitive Concept & Physical Meaning</h4>
                    <p className="text-[11px] text-[#A1A1AA]">What is actually happening in plain English</p>
                  </div>
                </div>
                <div className="text-[#A1A1AA]">
                  {expandedExplanation.concept ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedExplanation.concept && (
                <div className="p-4 pt-1 border-t border-[#27272A]/50 text-xs sm:text-sm text-[#D4D4D8] leading-relaxed">
                  <MathRenderer
                    text={
                      solution.intuitiveConcept ||
                      solution.explanation ||
                      'This problem relies on fundamental physical conservation laws and algebraic relationships between the given quantities. Energy or quantity balance dictates the outcome without external losses.'
                    }
                  />
                </div>
              )}
            </div>

            {/* 2. Step-by-Step Derivation & Mathematical Rationale */}
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleExplanation('derivation')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#18181B]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Mathematical Rationale & Derivation</h4>
                    <p className="text-[11px] text-[#A1A1AA]">Why each step and formula substitution is valid</p>
                  </div>
                </div>
                <div className="text-[#A1A1AA]">
                  {expandedExplanation.derivation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedExplanation.derivation && (
                <div className="p-4 pt-1 border-t border-[#27272A]/50 space-y-2.5">
                  {solution.detailedDerivation && solution.detailedDerivation.length > 0 ? (
                    solution.detailedDerivation.map((point, pIdx) => (
                      <div key={pIdx} className="flex items-start space-x-2 text-xs sm:text-sm text-[#D4D4D8]">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center mt-0.5">
                          {pIdx + 1}
                        </span>
                        <div className="flex-1">
                          <MathRenderer text={point} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-2 text-xs sm:text-sm text-[#D4D4D8]">
                      <div className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center mt-0.5">
                          1
                        </span>
                        <div className="flex-1">
                          <MathRenderer text={`State fundamental relationship: $${solution.formula || 'F = ma'}$ and identify knowns vs unknowns.`} />
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center mt-0.5">
                          2
                        </span>
                        <div className="flex-1">
                          <MathRenderer text={`Rearrange rigorously to isolate target variable: $${solution.rearrangedFormula || solution.formula}$`} />
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center mt-0.5">
                          3
                        </span>
                        <div className="flex-1">
                          <MathRenderer text={`Perform verified numerical substitution with SI units attached: $${solution.substitution || solution.finalAnswer}$`} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Alternative Method & Quick Verification */}
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleExplanation('alternative')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#18181B]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Alternative Method & Quick Check</h4>
                    <p className="text-[11px] text-[#A1A1AA]">Speed shortcut, dimensional check or secondary proof</p>
                  </div>
                </div>
                <div className="text-[#A1A1AA]">
                  {expandedExplanation.alternative ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedExplanation.alternative && (
                <div className="p-4 pt-1 border-t border-[#27272A]/50 text-xs sm:text-sm text-[#D4D4D8] leading-relaxed">
                  <MathRenderer
                    text={
                      solution.alternativeMethod ||
                      solution.tips ||
                      'Always perform a dimensional analysis check to ensure the units on the left-hand side match the right-hand side. In multiple-choice exams, order-of-magnitude estimation can immediately eliminate extreme outliers.'
                    }
                  />
                </div>
              )}
            </div>

            {/* 4. Common Student Traps & Errors to Avoid */}
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleExplanation('mistakes')}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#18181B]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Common Pitfalls & Exam Traps</h4>
                    <p className="text-[11px] text-[#A1A1AA]">Frequent mistakes students make on this exact topic</p>
                  </div>
                </div>
                <div className="text-[#A1A1AA]">
                  {expandedExplanation.mistakes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedExplanation.mistakes && (
                <div className="p-4 pt-1 border-t border-[#27272A]/50 text-xs sm:text-sm text-[#FCA5A5] leading-relaxed">
                  <MathRenderer
                    text={
                      solution.commonMistakes ||
                      'Watch out for unit mismatch (e.g. cm instead of m, or minutes instead of seconds), sign errors when rearranging formulas across the equals sign, and forgetting to square terms in kinetic energy or acceleration formulas.'
                    }
                  />
                </div>
              )}
            </div>

            {/* Interactive Tutor Ask Chips directly below solution */}
            <div className="pt-2 border-t border-[#27272A] space-y-2.5">
              <div className="flex items-center space-x-2 text-xs text-[#22C55E] font-bold">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask AI Tutor Follow-up Questions:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleLaunchChatPrompt(
                      `Can you explain the step-by-step logic of "${solution.title || 'this solution'}" more simply, using an intuitive everyday analogy?`
                    )
                  }
                  className="p-2.5 rounded-xl bg-[#121214] hover:bg-[#1E1E22] border border-[#27272A] hover:border-[#22C55E]/50 text-left text-xs text-[#E4E4E7] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="line-clamp-1">🤔 Explain this in simpler terms with an analogy</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#22C55E] ml-2 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleLaunchChatPrompt(
                      `Is there an alternative or faster method to solve "${solution.title || 'this question'}" for exam speed (e.g. JAMB/WAEC)?`
                    )
                  }
                  className="p-2.5 rounded-xl bg-[#121214] hover:bg-[#1E1E22] border border-[#27272A] hover:border-[#22C55E]/50 text-left text-xs text-[#E4E4E7] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="line-clamp-1">⚡ Show faster alternative or shortcut method</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#22C55E] ml-2 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleLaunchChatPrompt(
                      `What are the most common traps or negative marking pitfalls examiners set for "${solution.title || 'this topic'}"?`
                    )
                  }
                  className="p-2.5 rounded-xl bg-[#121214] hover:bg-[#1E1E22] border border-[#27272A] hover:border-[#22C55E]/50 text-left text-xs text-[#E4E4E7] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="line-clamp-1">⚠️ What common traps do examiners test here?</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#22C55E] ml-2 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleLaunchChatPrompt(
                      `Give me a similar practice problem based on "${solution.title || 'this concept'}" with different values to test my understanding.`
                    )
                  }
                  className="p-2.5 rounded-xl bg-[#121214] hover:bg-[#1E1E22] border border-[#27272A] hover:border-[#22C55E]/50 text-left text-xs text-[#E4E4E7] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="line-clamp-1">📝 Test me with a similar practice question</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#22C55E] ml-2 shrink-0" />
                </button>
              </div>
            </div>
          </div>
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
  )}

  {/* TAB 2: AI STEM Tutor Chat */}
  {activeSolverTab === 'chat' && (
    <div className="space-y-4 animate-fadeIn">
      {/* Tutor Info Header */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/20 border border-[#22C55E]/40 flex items-center justify-center text-[#22C55E] shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">SmartSolve AI Assistant</h3>
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[11px] text-[#22C55E] font-medium">Voice & Vision Ready</span>
            </div>
            <p className="text-xs text-[#A1A1AA]">
              Universal AI companion & STEM master. Type, send voice notes 🎙️, or upload photos 📷.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Auto Speak Toggle */}
          <button
            type="button"
            onClick={() => {
              const updated = { ...voiceSettings, autoSpeak: !voiceSettings.autoSpeak };
              handleSaveVoiceSettings(updated);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all cursor-pointer ${
              voiceSettings.autoSpeak
                ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40 shadow-sm'
                : 'bg-[#18181B] text-[#A1A1AA] hover:text-white border-[#27272A]'
            }`}
            title="Auto-speak AI responses out loud for a continuous voice conversation"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Auto Voice: {voiceSettings.autoSpeak ? 'ON' : 'OFF'}</span>
          </button>

          {/* Voice Customization Button */}
          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white border border-[#27272A] flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Change voice, accent, pitch, and speed"
          >
            <Sliders className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Change Voice</span>
          </button>

          {/* Reset Chat Button */}
          <button
            type="button"
            onClick={handleClearChat}
            className="px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white border border-[#27272A] flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Restart Chat Conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Active Problem Context Banner (if discussing a problem from solver) */}
      {solution && (
        <div className="p-3.5 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <Calculator className="w-4 h-4 text-[#22C55E] shrink-0" />
            <div className="truncate text-xs">
              <span className="font-bold text-[#22C55E]">Active Problem Context: </span>
              <span className="text-white">{solution.title || solution.problemStatement}</span>
              {solution.finalAnswer && (
                <span className="text-[#A1A1AA] ml-1.5">({solution.finalAnswer})</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveSolverTab('solver')}
            className="text-xs text-[#22C55E] hover:underline whitespace-nowrap font-semibold cursor-pointer shrink-0"
          >
            Back to Solution →
          </button>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-4 sm:p-6 shadow-xl min-h-[460px] flex flex-col justify-between space-y-4">
        <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
          {chatMessages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#22C55E]/20 border border-[#22C55E]/40 flex items-center justify-center text-[#22C55E] shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#22C55E] text-white rounded-tr-none font-medium shadow-md shadow-emerald-500/10'
                    : 'bg-[#141416] text-[#E4E4E7] border border-[#27272A] rounded-tl-none space-y-3'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="space-y-2">
                    {/* Uploaded Photo Attachment in User Bubble */}
                    {msg.imageData && (
                      <div className="rounded-xl overflow-hidden border border-white/20 max-w-[260px] sm:max-w-[320px]">
                        <img
                          src={msg.imageData}
                          alt="Uploaded attachment"
                          className="w-full h-auto object-cover max-h-56 rounded-xl"
                        />
                      </div>
                    )}

                    {/* WhatsApp-Style User Voice Note */}
                    {msg.isVoiceNote ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-2.5 bg-black/25 px-3 py-2 rounded-xl border border-white/20">
                          <button
                            type="button"
                            onClick={() => handleToggleSpeech(msg.id, msg.content)}
                            className="w-8 h-8 rounded-full bg-white text-[#22C55E] flex items-center justify-center shrink-0 shadow cursor-pointer active:scale-95 transition-transform"
                            title={speakingMessageId === msg.id ? 'Pause Voice Note' : 'Play Voice Note'}
                          >
                            {speakingMessageId === msg.id ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>
                          <div className="flex-1 flex items-center space-x-1">
                            {[40, 75, 30, 95, 50, 85, 60, 100, 45, 70, 90, 35, 60, 80].map((h, i) => (
                              <div
                                key={i}
                                className={`w-1 rounded-full transition-all ${
                                  speakingMessageId === msg.id ? 'bg-white animate-pulse' : 'bg-white/60'
                                }`}
                                style={{ height: `${h * 0.22}px` }}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-mono opacity-90">
                            {msg.voiceDuration
                              ? `${Math.floor(msg.voiceDuration / 60)}:${(msg.voiceDuration % 60)
                                  .toString()
                                  .padStart(2, '0')}`
                              : '0:05'}
                          </span>
                        </div>
                        {msg.content && msg.content !== 'Voice note audio message' && (
                          <div className="text-xs opacity-95 italic">"{msg.content}"</div>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* WhatsApp-Style AI Voice Note Card */}
                    <div className="flex items-center space-x-2.5 bg-[#0D0D10] px-3 py-2 rounded-xl border border-[#27272A] text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleSpeech(msg.id, msg.content)}
                        className="w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25 cursor-pointer active:scale-95 hover:bg-[#16A34A] transition-all"
                        title={speakingMessageId === msg.id ? 'Pause Voice Note' : 'Listen to Voice Note'}
                      >
                        {speakingMessageId === msg.id ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1 flex items-center space-x-1 py-1 overflow-hidden">
                        {[30, 55, 85, 40, 95, 65, 80, 50, 70, 90, 45, 60, 75, 40, 85, 55].map((h, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full transition-all ${
                              speakingMessageId === msg.id
                                ? 'bg-[#22C55E] animate-bounce-subtle'
                                : 'bg-[#3F3F46]'
                            }`}
                            style={{
                              height: `${h * 0.22}px`,
                              animationDelay: `${i * 60}ms`,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-[#A1A1AA] font-mono">
                        {speakingMessageId === msg.id ? 'Playing...' : 'AI Voice Note'}
                      </span>
                    </div>

                    <MathRenderer text={msg.content} />

                    <div className="flex items-center justify-between pt-2 border-t border-[#27272A]/60 text-[10px] text-[#A1A1AA]">
                      <span className="font-semibold text-[#22C55E]">SmartSolve AI</span>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleToggleSpeech(msg.id, msg.content)}
                          className="inline-flex items-center space-x-1 text-[#22C55E] hover:text-[#4ADE80] transition-colors cursor-pointer"
                          title={speakingMessageId === msg.id ? 'Stop Voice' : 'Play Voice'}
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <VolumeX className="w-3 h-3 text-[#EF4444]" />
                              <span className="text-[#EF4444]">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              <span>Voice</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="inline-flex items-center space-x-1 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#22C55E]" />
                              <span className="text-[#22C55E]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Follow-up Chips under latest response */}
                    {idx === chatMessages.length - 1 && !isChatLoading && (
                      <div className="pt-2 border-t border-[#27272A]/40 flex flex-wrap gap-1.5 animate-fadeIn">
                        {[
                          { label: '⚡ Fast Exam Shortcut', prompt: 'Can you show me the fastest shortcut or speed trick for this?' },
                          { label: '🤔 Everyday Analogy', prompt: 'Can you explain this with a relatable real-life analogy without jargon?' },
                          { label: '📝 Practice Quiz', prompt: 'Give me a similar multiple-choice practice question based on this to test me.' },
                          { label: '⚠️ Traps & Mistakes', prompt: 'What is the most frequent trap or sign mistake students make here in exams?' },
                        ].map((chip, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => handleSendChatMessage(chip.prompt)}
                            className="text-[11px] px-2.5 py-1 rounded-xl bg-[#1E1E22] hover:bg-[#22C55E]/20 text-[#A1A1AA] hover:text-[#22C55E] border border-[#27272A] hover:border-[#22C55E]/40 transition-all cursor-pointer font-medium"
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[#27272A] flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isChatLoading && (
            <div className="flex items-start space-x-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-[#22C55E]/20 border border-[#22C55E]/40 flex items-center justify-center text-[#22C55E] shrink-0 mt-0.5">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-[#141416] border border-[#27272A] rounded-2xl rounded-tl-none p-3.5 text-xs text-[#A1A1AA] flex items-center space-x-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#22C55E]" />
                <span>SmartSolve AI is thinking and composing reply...</span>
              </div>
            </div>
          )}

          {chatError && (
            <div className="p-3.5 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-xs flex items-center justify-between gap-3">
              <span className="flex-1">{chatError}</span>
              <button
                type="button"
                onClick={() => {
                  const lastUserMsg = [...chatMessages].reverse().find((m) => m.role === 'user')?.content;
                  if (lastUserMsg) {
                    handleSendChatMessage(lastUserMsg);
                  } else {
                    handleSendChatMessage();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold cursor-pointer transition-colors shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={chatMessagesEndRef} />
        </div>

        {/* Quick Starter Chips when chat has only welcome message */}
        {chatMessages.length === 1 && (
          <div className="pt-2 border-t border-[#27272A] space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#A1A1AA]">
              Recommended Prompts to Try:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Write a Python script to sort and analyze statistical data",
                "Explain Newton's Laws with a swimming analogy",
                "How do I determine the oxidation state of Cr in K2Cr2O7?",
                "Give me a 3-step shortcut to solve quadratic equations by factoring",
              ].map((chipPrompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChatMessage(chipPrompt)}
                  className="p-2.5 rounded-xl bg-[#141416] hover:bg-[#1E1E22] border border-[#27272A] hover:border-[#22C55E]/50 text-left text-xs text-[#D4D4D8] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="line-clamp-1">{chipPrompt}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#22C55E] ml-2 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input Bar */}
        <div className="pt-3 border-t border-[#27272A] space-y-2">
          {/* Selected Photo Attachment Preview */}
          {chatImagePreview && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#141416] border border-[#22C55E]/30 animate-fadeIn">
              <div className="flex items-center space-x-3">
                <img
                  src={chatImagePreview}
                  alt="Attachment preview"
                  className="w-12 h-12 object-cover rounded-xl border border-white/20"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                    {chatImageMeta?.name || 'Attached Photo'}
                  </div>
                  <div className="text-[11px] text-[#22C55E]">
                    {chatImageMeta?.size || 'Image ready'} · AI will analyze this photo
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChatImagePreview(null);
                  setChatImageMeta(null);
                }}
                className="p-1.5 rounded-lg bg-[#27272A] hover:bg-[#EF4444] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={chatFileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleChatImageSelect(e.target.files[0]);
              }
              e.target.value = '';
            }}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={chatCameraInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleChatImageSelect(e.target.files[0]);
              }
              e.target.value = '';
            }}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* If Recording Voice Note: WhatsApp-Style Bar */}
          {isRecording ? (
            <div className="flex items-center justify-between p-2 sm:p-2.5 bg-[#160B0B] border border-[#EF4444]/40 rounded-2xl animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-[#EF4444] animate-ping" />
                  <span className="text-xs font-bold text-[#EF4444]">Recording Voice Note</span>
                </div>
                <span className="font-mono text-xs text-white bg-black/40 px-2 py-0.5 rounded-md">
                  {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-xs text-[#A1A1AA] hidden sm:inline truncate max-w-[220px]">
                  {recordingTranscript ? `"${recordingTranscript}"` : 'Listening to your voice...'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={cancelVoiceRecording}
                  className="p-2 rounded-xl bg-[#27272A] hover:bg-[#EF4444] text-white transition-colors cursor-pointer"
                  title="Cancel voice note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={sendVoiceRecording}
                  className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                  title="Send voice note"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Voice</span>
                </button>
              </div>
            </div>
          ) : (
            /* Normal Chat Input Bar with Photo Upload, Camera, and Voice Note buttons */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="flex items-center space-x-1.5 sm:space-x-2"
            >
              {/* Photo Upload Attachment Button */}
              <button
                type="button"
                onClick={() => chatFileInputRef.current?.click()}
                className="p-2.5 sm:p-3 rounded-xl bg-[#141416] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#22C55E] border border-[#27272A] transition-colors cursor-pointer shrink-0"
                title="Upload Photo or Homework Diagram"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Camera Photo Button */}
              <button
                type="button"
                onClick={() => chatCameraInputRef.current?.click()}
                className="p-2.5 sm:p-3 rounded-xl bg-[#141416] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#22C55E] border border-[#27272A] transition-colors cursor-pointer shrink-0"
                title="Snap Photo with Camera"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  chatImagePreview
                    ? 'Add a question about this photo (optional) and send...'
                    : 'Ask anything, write code, essays, or send a voice note...'
                }
                className="flex-1 bg-[#000000] border border-[#27272A] focus:border-[#22C55E] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-[#71717A] focus:outline-none transition-colors"
              />

              {/* Record Voice Note Button */}
              <button
                type="button"
                onClick={startVoiceRecording}
                className="p-2.5 sm:p-3 rounded-xl bg-[#141416] hover:bg-[#22C55E]/20 text-[#A1A1AA] hover:text-[#22C55E] border border-[#27272A] transition-colors cursor-pointer shrink-0"
                title="Record voice note (like WhatsApp)"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={isChatLoading || (!chatInput.trim() && !chatImagePreview)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
              >
                {isChatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Voice Customization Modal */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#27272A] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#22C55E]" />
                <h3 className="text-base font-bold text-white">Customize AI Voice</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#27272A] hover:bg-[#3F3F46] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#A1A1AA] block">
                Choose Voice / Accent:
              </label>
              <select
                value={voiceSettings.voiceURI}
                onChange={(e) => {
                  const updated = { ...voiceSettings, voiceURI: e.target.value };
                  handleSaveVoiceSettings(updated);
                }}
                className="w-full bg-[#000000] border border-[#27272A] focus:border-[#22C55E] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="">Default Natural Voice</option>
                {availableVoices.map((v, i) => (
                  <option key={i} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Speech Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#A1A1AA]">Speaking Speed:</span>
                <span className="text-[#22C55E] font-mono">{voiceSettings.rate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.1"
                value={voiceSettings.rate}
                onChange={(e) => {
                  const updated = { ...voiceSettings, rate: parseFloat(e.target.value) };
                  handleSaveVoiceSettings(updated);
                }}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>

            {/* Pitch Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#A1A1AA]">Voice Pitch:</span>
                <span className="text-[#22C55E] font-mono">{voiceSettings.pitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.1"
                value={voiceSettings.pitch}
                onChange={(e) => {
                  const updated = { ...voiceSettings, pitch: parseFloat(e.target.value) };
                  handleSaveVoiceSettings(updated);
                }}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>

            {/* Auto-Speak Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#000000] border border-[#27272A]">
              <div>
                <div className="text-xs font-semibold text-white">Auto-Speak Replies (Hands-Free)</div>
                <div className="text-[11px] text-[#A1A1AA]">Play voice note automatically when AI answers</div>
              </div>
              <input
                type="checkbox"
                checked={voiceSettings.autoSpeak}
                onChange={(e) => {
                  const updated = { ...voiceSettings, autoSpeak: e.target.checked };
                  handleSaveVoiceSettings(updated);
                }}
                className="w-4 h-4 accent-[#22C55E] rounded cursor-pointer"
              />
            </div>

            {/* Test Voice & Done Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleToggleSpeech(
                    'test-voice',
                    "Hello! I am SmartSolve AI. How does this voice sound to you?"
                  );
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-white text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Test Voice Sample</span>
              </button>
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )}
</div>
);
};
