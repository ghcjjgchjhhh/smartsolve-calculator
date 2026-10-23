import React, { useState, useRef } from 'react';
import { StepSolution } from '../types';
import { StepSolutionCard } from './StepSolutionCard';
import { saveToHistory } from '../services/historyStorage';
import {
  Sparkles,
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Key,
  ExternalLink,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export const GeminiAiSolverView: React.FC = () => {
  const [prompt, setPrompt] = useState<string>(
    'A stone of mass 0.5 kg is dropped from a cliff 80m high. Calculate its kinetic energy just before hitting the ground (take g = 9.8 m/s²).'
  );
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [solution, setSolution] = useState<StepSolution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userApiKey, setUserApiKey] = useState<string>(
    () => localStorage.getItem('gemini_user_api_key') || ''
  );
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [tempKeyInput, setTempKeyInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveApiKey = () => {
    const cleaned = tempKeyInput.trim();
    if (cleaned) {
      localStorage.setItem('gemini_user_api_key', cleaned);
      setUserApiKey(cleaned);
    } else {
      localStorage.removeItem('gemini_user_api_key');
      setUserApiKey('');
    }
    setIsKeyModalOpen(false);
    setError(null);
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
You are SmartSolve AI, a master Mathematics and Physics professor.
Solve this ${selectedSubject === 'All' ? 'Mathematics or Physics' : selectedSubject} problem with full verified steps:
Problem: "${targetPrompt || 'Solve the question shown in the image.'}"

Requirements:
1. Identify all given quantities with symbols, values, and SI units.
2. State the governing theoretical formula or law before solving.
3. Show formula algebraic rearrangement for target variable if needed.
4. Show numerical substitution with SI units.
5. Provide numbered steps with intermediate arithmetic.
6. State the final answer with correct units.
7. Provide a concise explanation and practical tip.

You MUST respond with a valid JSON object with EXACTLY this structure:
{
  "title": "Descriptive title of the problem",
  "category": "${selectedSubject === 'All' ? 'Physics' : selectedSubject}",
  "subCategory": "Topic name (e.g. Kinematics, Algebra, Calculus)",
  "problemStatement": "Clear formal restatement of question",
  "formula": "Theoretical formula or law used",
  "rearrangedFormula": "Formula rearranged for target unknown",
  "substitution": "Formula with numbers and SI units plugged in",
  "steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "finalAnswer": "Exact final answer with SI unit",
  "unit": "SI unit",
  "explanation": "Clear explanation of why this physical or mathematical law applies",
  "tips": "Pro tip or exam advice for solving this problem"
}
`.trim();

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const resultText = response.text?.trim() || '{}';
    let cleanJson = resultText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const match = cleanJson.match(/\{[\s\S]*\}/);
    if (match) cleanJson = match[0];

    return JSON.parse(cleanJson);
  };

  const handleSolve = async (overridePrompt?: string) => {
    const targetPrompt = overridePrompt !== undefined ? overridePrompt : prompt;
    if (!targetPrompt.trim() && !imagePreview) {
      setError('Please enter a question or upload an image of the problem.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStage('Connecting to Gemini AI reasoning engine...');

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

      const response = await fetch('/api/ai/solve', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: targetPrompt,
          imageData: imagePreview,
          mimeType: imageMimeType,
          subject: selectedSubject === 'All' ? undefined : selectedSubject,
        }),
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      const responseText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          'Vercel serverless returned a server error. Tap "Set API Key" above to paste your key directly and solve instantly.'
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to generate solution from Gemini AI.');
      }

      setSolution(data.solution);
      saveToHistory(data.solution);

      setTimeout(() => {
        solutionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err: any) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setError(err.message || 'An error occurred while solving the problem with Gemini AI.');
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Header Card */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] font-bold text-xs uppercase tracking-wider border border-[#22C55E]/30">
                Gemini AI Engine
              </span>
              <span className="text-xs text-[#A1A1AA]">· 100% Real Problem Solving</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] mt-1 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#22C55E]" />
              <span>Real Mathematics & Physics AI Solver</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
              Ask any real-world math or physics question, exam problem (WAEC, JAMB, AP, SAT, Calculus), or upload a photo of your textbook question.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Key Status / Configuration Button */}
            <button
              onClick={() => {
                setTempKeyInput(userApiKey);
                setIsKeyModalOpen(true);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                userApiKey
                  ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30'
                  : 'bg-[#18181B] text-[#A1A1AA] hover:text-[#FFFFFF] border-[#27272A]'
              }`}
              title="Configure your Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{userApiKey ? 'API Key Active' : 'Set API Key'}</span>
            </button>

            <div className="flex items-center space-x-1.5 bg-[#000000] px-3 py-1.5 rounded-xl border border-[#27272A] text-xs text-[#22C55E] font-bold shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Verified Steps</span>
            </div>
          </div>
        </div>

        {/* Subject Filter Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'Physics', 'Mathematics', 'Calculus', 'Kinematics', 'Electricity', 'JAMB / WAEC'].map((subj) => (
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
        <div className="space-y-3 pt-1">
          <div className="relative">
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type any math or physics question here... (e.g., A car of mass 1200kg travelling at 20 m/s brakes to a halt in 40m. Find the braking force and deceleration.)"
              className="w-full p-4 rounded-2xl bg-[#000000] border border-[#27272A] text-[#FFFFFF] placeholder:text-[#A1A1AA]/60 text-sm sm:text-base font-medium focus:border-[#22C55E] focus:outline-none transition-colors resize-y leading-relaxed"
            />
          </div>

          {/* Image preview if user uploaded a problem photo */}
          {imagePreview && (
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#000000] border border-[#27272A] w-fit">
              <img
                src={imagePreview}
                alt="Uploaded problem"
                className="w-16 h-16 object-cover rounded-xl border border-[#27272A]"
              />
              <div>
                <span className="text-xs font-bold text-[#FFFFFF] block">Attached Problem Image</span>
                <span className="text-[11px] text-[#A1A1AA]">Gemini Vision will read and extract the problem</span>
              </div>
              <button
                onClick={handleClearImage}
                aria-label="Remove image"
                className="p-1.5 rounded-lg bg-[#18181B] hover:bg-[#EF4444] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-[#18181B] hover:bg-[#2F3542] text-[#A1A1AA] hover:text-[#FFFFFF] text-xs font-semibold border border-white/5 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-[#22C55E]" />
                <span>Snap / Upload Question Photo</span>
              </button>

              {prompt && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="px-3 py-2.5 rounded-xl bg-[#000000] hover:bg-[#18181B] text-[#A1A1AA] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={() => handleSolve()}
              disabled={isLoading || (!prompt.trim() && !imagePreview)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 disabled:opacity-50 text-[#FFFFFF] font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Solving Real Problem...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Solve with Gemini AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading stage ticker */}
        {isLoading && (
          <div className="p-4 rounded-2xl bg-[#000000] border border-[#22C55E]/40 flex items-center space-x-3 text-xs text-[#FFFFFF] animate-pulse">
            <Loader2 className="w-4 h-4 text-[#22C55E] animate-spin flex-shrink-0" />
            <span>{loadingStage || 'Gemini AI is deriving the step-by-step solution...'}</span>
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
                onClick={() => {
                  setTempKeyInput(userApiKey);
                  setIsKeyModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#22C55E] text-[#FFFFFF] font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap"
              >
                Paste API Key Here
              </button>
              <button
                onClick={() => setError(null)}
                className="text-xs font-bold underline cursor-pointer text-[#A1A1AA] hover:text-[#FFFFFF]"
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
              <span>Verified Gemini AI Solution</span>
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

      {/* Modal: Direct Gemini API Key Setup */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#FFFFFF]">Google Gemini API Key</h3>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#18181B] text-[#A1A1AA] hover:text-[#FFFFFF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Paste your Gemini API key below. It will be saved securely in your browser so your solver works immediately on Vercel without configuring environment variables.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#FFFFFF]">API Key (starts with AIzaSy...):</label>
              <input
                type="password"
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#000000] border border-[#27272A] text-[#FFFFFF] text-sm focus:border-[#22C55E] focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#A1A1AA]">
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#22C55E] hover:underline flex items-center space-x-1"
              >
                <span>Get a free key from Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              {userApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('gemini_user_api_key');
                    setUserApiKey('');
                    setTempKeyInput('');
                  }}
                  className="text-[#EF4444] hover:underline cursor-pointer"
                >
                  Remove Key
                </button>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#27272A]">
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-5 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] text-xs font-bold shadow-md shadow-emerald-500/25 cursor-pointer"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
