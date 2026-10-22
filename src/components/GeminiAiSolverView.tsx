import React, { useState, useRef } from 'react';
import { StepSolution } from '../types';
import { StepSolutionCard } from './StepSolutionCard';
import { saveToHistory } from '../services/historyStorage';
import {
  Sparkles,
  Send,
  Upload,
  Image as ImageIcon,
  X,
  RotateCcw,
  BookOpen,
  Atom,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);

  const realProblemSamples = [
    {
      subject: 'Mathematics',
      label: 'Calculus: Quotient Rule Derivative',
      text: 'Find the derivative of f(x) = (3x² - 4x + 1) / (2x + 3) with step-by-step working and evaluate f\'(1).',
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
      label: 'Vectors: Dot & Cross Product',
      text: 'Given vectors A = 3i - 2j + 4k and B = i + 5j - 2k, find their dot product A·B, the angle between them, and the cross product A × B.',
    },
    {
      subject: 'Mathematics',
      label: 'Financial: Monthly Compounding',
      text: 'A principal of $5,000 is invested at an annual interest rate of 6.5% compounded monthly. Calculate the accumulated amount and total compound interest after 4 years.',
    },
    {
      subject: 'Physics',
      label: 'Free Fall & Energy Conservation',
      text: 'A stone of mass 0.5 kg is dropped from a cliff 80m high. Calculate its kinetic energy just before hitting the ground (take g = 9.8 m/s²).',
    },
    {
      subject: 'Physics',
      label: 'Inelastic Vehicle Collision',
      text: 'A 1500 kg car travelling at 25 m/s collides with a stationary 1000 kg vehicle and they stick together. Calculate their common velocity after impact and the kinetic energy lost.',
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

  const handleSolve = async (overridePrompt?: string) => {
    const targetPrompt = overridePrompt !== undefined ? overridePrompt : prompt;
    if (!targetPrompt.trim() && !imagePreview) {
      setError('Please enter a question or upload an image of the problem.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStage('Connecting to Gemini AI reasoning engine...');

    try {
      const stageTimer1 = setTimeout(() => {
        setLoadingStage('Extracting physical laws, given quantities and units...');
      }, 900);

      const stageTimer2 = setTimeout(() => {
        setLoadingStage('Executing verified mathematical substitution & algebraic derivation...');
      }, 1900);

      const response = await fetch('/api/ai/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          imageData: imagePreview,
          mimeType: imageMimeType,
          subject: selectedSubject === 'All' ? undefined : selectedSubject,
        }),
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        if (response.status === 404) {
          throw new Error('AI Solver API (/api/ai/solve) was not found. Please ensure the server is running on port 3000.');
        }
        throw new Error(`Server returned status ${response.status}. Please check your connection and try again.`);
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to generate solution.');
      }

      setSolution(data.solution);
      saveToHistory(data.solution);

      // Smoothly scroll down to the solution
      setTimeout(() => {
        solutionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err: any) {
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

          <div className="flex items-center space-x-2 bg-[#000000] px-3.5 py-2 rounded-xl border border-[#27272A] text-xs text-[#22C55E] font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            <span>Real Step Verification</span>
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
          <div className="p-4 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Calculation Notice</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
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
    </div>
  );
};
