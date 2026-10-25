import React, { useState, useEffect } from 'react';
import { JAMB_QUESTIONS } from '../data/jambQuestions';
import { JambQuestion } from '../types';
import { MathRenderer } from './MathRenderer';
import { GoogleGenAI } from '@google/genai';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Award,
  BookOpen,
  Filter,
  Lightbulb,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
  TrendingUp,
  Target,
  Flame,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface JambPracticeViewProps {
  onOpenInGemini?: (prompt: string, subject?: string) => void;
}

export const JambPracticeView: React.FC<JambPracticeViewProps> = ({ onOpenInGemini }) => {
  // Mode: AI Custom Exam Generator vs Standard Questions Bank
  const [activeMode, setActiveMode] = useState<'ai_exam' | 'bank'>('ai_exam');

  // Exam Configuration Settings
  const [examType, setExamType] = useState<'JAMB UTME' | 'WAEC SSCE' | 'JUPEB' | 'University Level'>('JAMB UTME');
  const [aiSubject, setAiSubject] = useState<'Physics' | 'Mathematics' | 'Chemistry'>('Physics');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Very Hard'>('Medium');
  const [aiTopic, setAiTopic] = useState<string>('Projectiles & Equations of Motion');
  const [aiCount, setAiCount] = useState<number>(40);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [aiQuestions, setAiQuestions] = useState<JambQuestion[]>([]);

  // Bank Filter
  const [subjectFilter, setSubjectFilter] = useState<'All' | 'Mathematics' | 'Physics' | 'Chemistry'>('All');

  // Active Questions List
  const questions: JambQuestion[] =
    activeMode === 'ai_exam' && aiQuestions.length > 0
      ? aiQuestions
      : JAMB_QUESTIONS.filter((q) => {
          if (subjectFilter === 'All') return true;
          return q.subject === subjectFilter;
        });

  // Exam Interaction States
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [resultsFilter, setResultsFilter] = useState<'all' | 'wrong' | 'correct'>('all');
  const [studyMode, setStudyMode] = useState<boolean>(false);

  // CBT Countdown Timer (in seconds)
  const [initialDuration, setInitialDuration] = useState<number>(40 * 60);
  const [timeLeft, setTimeLeft] = useState<number>(40 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0 && !examSubmitted) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !examSubmitted && questions.length > 0) {
      handleFinalizeExam();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, examSubmitted, questions.length]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex] || questions[0];
  const userChoice = currentQ ? selectedAnswers[currentQ.id] : undefined;
  const isRevealed = currentQ ? showSolution[currentQ.id] : false;

  // Score Calculation
  const totalQuestions = questions.length;
  let correctCount = 0;
  let wrongCount = 0;
  questions.forEach((q) => {
    const userAns = selectedAnswers[q.id];
    if (userAns === q.correctAnswer) {
      correctCount++;
    } else if (userAns) {
      wrongCount++;
    }
  });
  const unansweredCount = totalQuestions - Object.keys(selectedAnswers).length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const jambScaledScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const timeSpentSeconds = initialDuration - timeLeft;
  const timeSpentFormatted = `${Math.floor(timeSpentSeconds / 60)}m ${timeSpentSeconds % 60}s`;

  // Finalize & Calculate Results
  const handleFinalizeExam = () => {
    setExamSubmitted(true);
    setIsTimerRunning(false);
    setShowResultsModal(true);
  };

  // Option Selection with Auto-Finish Detection
  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (examSubmitted) return;
    if (!currentQ) return;

    const nextAnswers = {
      ...selectedAnswers,
      [currentQ.id]: opt,
    };
    setSelectedAnswers(nextAnswers);

    // If user has answered all questions in the test, automatically calculate results!
    const newlyAnsweredCount = Object.keys(nextAnswers).length;
    if (newlyAnsweredCount === questions.length) {
      // Brief 400ms delay so user sees option highlight before results pop up
      setTimeout(() => {
        handleFinalizeExam();
      }, 400);
    }
  };

  const handleToggleSolution = () => {
    if (!currentQ) return;
    setShowSolution((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  const handleResetExam = () => {
    setSelectedAnswers({});
    setShowSolution({});
    setExamSubmitted(false);
    setShowResultsModal(false);
    setCurrentIndex(0);
    const dur = questions.length * 60;
    setInitialDuration(dur);
    setTimeLeft(dur);
    setIsTimerRunning(true);
  };

  // Generate 10, 20, or 40 questions with AI
  const handleGenerateAiExam = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    const targetTopic = aiTopic.trim() || 'General Syllabus';

    try {
      const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_user_api_key') || '' : '';

      // 1. Direct browser call if user entered key
      if (storedKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: storedKey });
          const promptText = `
You are SmartSolve AI, an expert Nigerian examination tutor for ${examType} in ${aiSubject}.
Generate exactly ${aiCount} realistic, standard examination questions on:
Topic / Formula: "${targetTopic}"
Difficulty Level: "${difficulty}".

SYLLABUS & EXAM STANDARDS:
- For JAMB/UTME: Use current JAMB syllabus and CBT examination style.
- For WAEC/WASSCE: Use current WAEC syllabus and examination style.
- For JUPEB: Use JUPEB university-foundation syllabus and rigor.
- For Chemistry: Cover authentic concepts like mole concept, stoichiometry, atomic structure, gas laws, electrochemistry, acids/bases, or equilibrium.
- For Mathematics & Physics: Ensure 100% computational and dimensional accuracy.

STYLING & 8-STEP SOLUTION RULES (CRITICAL):
1. Format all formulas, powers, fractions, and symbols using standard LaTeX notation ($...$, \\frac{a}{b}, \\sqrt{...}, x^2).
2. Every question must have exactly 4 plausible options labeled A, B, C, D.
3. Specify the exact correct answer ('A', 'B', 'C', or 'D').
4. For every calculation, provide:
   - Given information with SI units
   - Governing theoretical formula
   - Value substitution
   - Step-by-step calculation
   - Final answer with unit
   - Educational explanation of why the answer is correct and why the chosen option is right.

Respond with ONLY a valid JSON object matching this exact structure:
{
  "subject": "${aiSubject}",
  "exam": "${examType}",
  "difficulty": "${difficulty}",
  "topic": "${targetTopic}",
  "total": ${aiCount},
  "questions": [
    {
      "id": "q1",
      "question": "Question statement in LaTeX notation...",
      "options": {
        "A": "Option A text with math",
        "B": "Option B text with math",
        "C": "Option C text with math",
        "D": "Option D text with math"
      },
      "correctAnswer": "A",
      "givenValues": "Given values with units (e.g. m = 2 kg, v = 10 m/s)",
      "formula": "Governing formula in LaTeX",
      "substitution": "Formula with numbers plugged in",
      "steps": [
        "Given: ...",
        "Formula: ...",
        "Substitution: ...",
        "Calculation: ...",
        "Final: ..."
      ],
      "explanation": "Educational explanation of why Option A is the correct answer",
      "examTip": "Useful exam advice or common pitfall to avoid"
    }
  ]
}
`.trim();

          const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: [{ text: promptText }],
            config: { responseMimeType: 'application/json' },
          });

          const resultText = response.text?.trim() || '{}';
          let cleanJson = resultText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
          const match = cleanJson.match(/\{[\s\S]*\}/);
          if (match) cleanJson = match[0];

          const data = JSON.parse(cleanJson);
          if (data?.questions && data.questions.length > 0) {
            const formatted = data.questions.map((q: any, i: number) => ({
              ...q,
              id: `ai_${Date.now()}_${i}`,
              subject: aiSubject,
              exam: examType,
              difficulty: difficulty,
              topic: targetTopic,
              examYear: `${examType} AI Mock`,
            }));
            setAiQuestions(formatted);
            setActiveMode('ai_exam');
            setSelectedAnswers({});
            setShowSolution({});
            setExamSubmitted(false);
            setShowResultsModal(false);
            setCurrentIndex(0);
            const duration = aiCount * 60;
            setInitialDuration(duration);
            setTimeLeft(duration);
            setIsTimerRunning(true);
            return;
          }
        } catch (clientErr) {
          console.warn('Client direct generate fallback to server:', clientErr);
        }
      }

      // 2. Serverless API call
      let response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_questions',
          subject: aiSubject,
          exam: examType,
          difficulty: difficulty,
          topic: targetTopic,
          count: aiCount,
        }),
      });

      if (response.status === 404) {
        response = await fetch('/api/ai/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate_questions',
            subject: aiSubject,
            exam: examType,
            difficulty: difficulty,
            topic: targetTopic,
            count: aiCount,
          }),
        });
      }

      const resText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(resText);
      } catch {
        throw new Error('Server returned non-JSON. Please verify your Vercel deployment.');
      }

      if (!response.ok || !data?.success || !data?.questions) {
        throw new Error(data?.error || 'Failed to generate questions. Please try again.');
      }

      const formatted = data.questions.map((q: any, i: number) => ({
        ...q,
        id: `ai_${Date.now()}_${i}`,
        subject: aiSubject,
        exam: examType,
        difficulty: difficulty,
        topic: targetTopic,
        examYear: `${examType} AI Mock`,
      }));

      setAiQuestions(formatted);
      setActiveMode('ai_exam');
      setSelectedAnswers({});
      setShowSolution({});
      setExamSubmitted(false);
      setShowResultsModal(false);
      setCurrentIndex(0);
      const duration = aiCount * 60;
      setInitialDuration(duration);
      setTimeLeft(duration);
      setIsTimerRunning(true);
    } catch (err: any) {
      setGenerationError(err.message || 'Failed to generate questions with AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Topic presets across Physics, Mathematics, and Chemistry
  const topicPresets: Record<'Physics' | 'Mathematics' | 'Chemistry', string[]> = {
    Physics: [
      'Projectiles & Equations of Motion',
      'Current Electricity & Ohm\'s Law',
      'Work, Energy, Power & Friction',
      'Waves, Sound & Light Optics',
      'Thermal Physics & Gas Laws',
      'Gravitational & Electric Fields',
    ],
    Mathematics: [
      'Quadratic Equations & Roots',
      'Indices, Logarithms & Surds',
      'Calculus (Differentiation & Integration)',
      'Trigonometry & Bearing',
      'Sequences & Series (AP & GP)',
      'Circle Geometry & Coordinate Geometry',
    ],
    Chemistry: [
      'Mole Concept & Stoichiometry',
      'Atomic Structure & Periodicity',
      'Chemical Bonding & Hybridization',
      'Gas Laws & Kinetic Theory',
      'Acids, Bases & Salts (pH & Titration)',
      'Electrochemistry & Faraday Laws',
      'Chemical Equilibrium & Le Chatelier',
      'Organic Chemistry & Hydrocarbons',
      'Thermochemistry & Energetics',
      'Qualitative Analysis & Salt Tests',
    ],
  };

  // Performance Badge & Assessment Feedback
  const getPerformanceFeedback = (percent: number) => {
    if (percent >= 85) {
      return {
        badge: '🏆 Distinction & Top 1% Percentile',
        color: 'text-[#22C55E]',
        bg: 'bg-[#22C55E]/15 border-[#22C55E]/30',
        message: 'Outstanding mastery! You comfortably exceed the cutoff for top university programs (Medicine, Engineering, Computer Science, Law).',
      };
    }
    if (percent >= 70) {
      return {
        badge: '🌟 Very Good Standing',
        color: 'text-[#38BDF8]',
        bg: 'bg-[#38BDF8]/15 border-[#38BDF8]/30',
        message: 'Strong score! You meet the admission threshold for most prestigious university departments. Review missed questions below to aim for 90%+.',
      };
    }
    if (percent >= 50) {
      return {
        badge: '⚡ Credit Standing (Average)',
        color: 'text-[#F59E0B]',
        bg: 'bg-[#F59E0B]/15 border-[#F59E0B]/30',
        message: 'You passed, but you need more practice with speed, formula substitutions, and units. Carefully review the step-by-step derivations below.',
      };
    }
    return {
      badge: '📚 Needs Intensive Revision',
      color: 'text-[#EF4444]',
      bg: 'bg-[#EF4444]/15 border-[#EF4444]/30',
      message: 'Below the desired exam cutoff. Do not worry—read each question\'s 8-step solution, write down the governing formulas, and retake the test!',
    };
  };

  const feedback = getPerformanceFeedback(scorePercent);

  // Filtered review questions
  const filteredQuestions = questions.filter((q) => {
    const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
    if (resultsFilter === 'correct') return isCorrect;
    if (resultsFilter === 'wrong') return !isCorrect;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner with Exam Mode Switcher */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-6 text-white shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] text-xs font-bold uppercase tracking-wider border border-[#22C55E]/30">
                {examType} · AI CBT Simulator
              </span>
              <span className="text-xs text-[#A1A1AA]">· Mathematics, Physics & Chemistry</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1 flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-[#22C55E]" />
              <span>Nigerian Exam CBT Simulator & AI Setter</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-xl leading-relaxed">
              Set customized 40-question mock exams on any subject or formula with AI, auto-calculate your final score, and review verified step-by-step derivations!
            </p>
          </div>

          {/* Real-time CBT Timer / Score */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="bg-[#000000] p-3 rounded-2xl border border-[#27272A] text-center min-w-[110px]">
              <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider block">
                {examSubmitted ? 'Score' : 'CBT Timer'}
              </span>
              <div className="text-xl font-black text-[#FFFFFF] mt-0.5 font-mono">
                {examSubmitted ? `${correctCount}/${totalQuestions}` : formatTimer(timeLeft)}
              </div>
              <span className="text-[10px] font-bold text-[#22C55E]">
                {examSubmitted ? `${scorePercent}%` : `${questions.length} Questions`}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center space-x-2 pt-2 border-t border-[#27272A]">
          <button
            onClick={() => setActiveMode('ai_exam')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeMode === 'ai_exam'
                ? 'bg-[#22C55E] text-[#FFFFFF] shadow-md shadow-emerald-500/25'
                : 'bg-[#18181B] text-[#A1A1AA] hover:text-[#FFFFFF]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Exam Setter (40 Questions)</span>
          </button>
          <button
            onClick={() => setActiveMode('bank')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeMode === 'bank'
                ? 'bg-[#22C55E] text-[#FFFFFF] shadow-md shadow-emerald-500/25'
                : 'bg-[#18181B] text-[#A1A1AA] hover:text-[#FFFFFF]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Standard Question Bank</span>
          </button>
        </div>
      </div>

      {/* AI EXAM GENERATOR CONTROL CARD */}
      {activeMode === 'ai_exam' && (
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#22C55E]" />
              <h3 className="text-base font-bold text-[#FFFFFF]">Configure AI Examination Setter</h3>
            </div>
            <span className="text-xs text-[#A1A1AA]">Syllabus-Accurate Generation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Exam Board */}
            <div>
              <label className="text-xs font-bold text-[#A1A1AA] block mb-1">Exam Target</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-[#000000] border border-[#27272A] text-xs font-bold text-[#FFFFFF] focus:border-[#22C55E] focus:outline-none transition-colors"
              >
                <option value="JAMB UTME">JAMB / UTME</option>
                <option value="WAEC SSCE">WAEC / WASSCE</option>
                <option value="JUPEB">JUPEB Foundation</option>
                <option value="University Level">General University Level</option>
              </select>
            </div>

            {/* Subject Selector (Math, Physics, Chemistry) */}
            <div>
              <label className="text-xs font-bold text-[#A1A1AA] block mb-1">Subject</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#000000] border border-[#27272A] rounded-xl">
                {(['Physics', 'Mathematics', 'Chemistry'] as const).map((subj) => (
                  <button
                    key={subj}
                    onClick={() => {
                      setAiSubject(subj);
                      setAiTopic(topicPresets[subj][0]);
                    }}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      aiSubject === subj
                        ? 'bg-[#22C55E] text-[#FFFFFF]'
                        : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {subj === 'Mathematics' ? 'Math' : subj === 'Chemistry' ? 'Chem' : 'Phys'}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="text-xs font-bold text-[#A1A1AA] block mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-[#000000] border border-[#27272A] text-xs font-bold text-[#FFFFFF] focus:border-[#22C55E] focus:outline-none transition-colors"
              >
                <option value="Easy">Easy (Foundational)</option>
                <option value="Medium">Medium (Standard Exam)</option>
                <option value="Hard">Hard (Multi-Step Calculations)</option>
                <option value="Very Hard">Very Hard (Challenging & Tricky)</option>
              </select>
            </div>

            {/* Question Count Selector (10, 20, 40) */}
            <div>
              <label className="text-xs font-bold text-[#A1A1AA] block mb-1">Count</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#000000] border border-[#27272A] rounded-xl">
                {[10, 20, 40].map((count) => (
                  <button
                    key={count}
                    onClick={() => setAiCount(count)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      aiCount === count
                        ? 'bg-[#22C55E] text-[#FFFFFF]'
                        : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {count === 40 ? '40 (Full)' : `${count}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Topic / Formula Input */}
          <div>
            <label className="text-xs font-bold text-[#A1A1AA] block mb-1.5">
              Topic or Governing Formula (Type any custom topic or formula)
            </label>
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g. Mole Concept, Projectiles, Ohm's Law, Quadratic Equations, Calculus..."
              className="w-full p-3 rounded-xl bg-[#000000] border border-[#27272A] text-sm text-[#FFFFFF] font-medium placeholder:text-[#A1A1AA]/50 focus:border-[#22C55E] focus:outline-none transition-all"
            />
          </div>

          {/* Quick Topic Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-[#A1A1AA] mr-1">Quick Select:</span>
            {topicPresets[aiSubject].map((preset) => (
              <button
                key={preset}
                onClick={() => setAiTopic(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  aiTopic === preset
                    ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 font-bold'
                    : 'bg-[#000000] text-[#A1A1AA] border border-[#27272A] hover:text-[#FFFFFF]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-[#A1A1AA]">
              Generates {aiCount} verified questions with 8-step solutions & derivations.
            </span>
            <button
              onClick={handleGenerateAiExam}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 disabled:opacity-50 text-[#FFFFFF] font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Setting {aiCount} Questions with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {aiCount} Exam Questions</span>
                </>
              )}
            </button>
          </div>

          {/* Error notice */}
          {generationError && (
            <div className="p-3.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{generationError}</span>
            </div>
          )}
        </div>
      )}

      {/* CBT EXAM QUESTION CARD */}
      {currentQ ? (
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
          {/* Question Header & Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-lg bg-[#18181B] text-[#FFFFFF] font-mono text-xs font-bold border border-white/5">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider">
                {currentQ.subject}
              </span>
              {currentQ.topic && (
                <span className="text-xs text-[#A1A1AA] hidden sm:inline">· {currentQ.topic}</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Study mode toggle */}
              <button
                onClick={() => setStudyMode((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  studyMode
                    ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 font-bold'
                    : 'bg-[#18181B] text-[#A1A1AA] hover:text-[#FFFFFF]'
                }`}
                title="Toggle Study Mode (reveal instant answers)"
              >
                Study Mode: {studyMode ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={handleResetExam}
                className="p-1.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] cursor-pointer"
                title="Reset Exam"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Question Statement in KaTeX */}
          <div className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed py-1">
            <MathRenderer content={currentQ.question} />
          </div>

          {/* Multiple Choice Options A, B, C, D */}
          <div className="space-y-2.5">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const optText = currentQ.options[opt];
              const isSelected = userChoice === opt;
              const isCorrectOption = opt === currentQ.correctAnswer;

              let style = 'bg-[#000000] border-[#27272A] text-[#FFFFFF] hover:border-[#22C55E]/60';
              if (examSubmitted || studyMode) {
                if (isCorrectOption) {
                  style = 'bg-[#22C55E]/20 border-[#22C55E] text-[#FFFFFF] font-bold';
                } else if (isSelected && !isCorrectOption) {
                  style = 'bg-[#EF4444]/20 border-[#EF4444] text-[#FFFFFF]';
                }
              } else if (isSelected) {
                style = 'bg-[#22C55E]/15 border-[#22C55E] text-[#FFFFFF] font-bold shadow-xs';
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer ${style}`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected
                        ? 'bg-[#22C55E] text-[#FFFFFF]'
                        : 'bg-[#18181B] text-[#A1A1AA]'
                    }`}
                  >
                    {opt}
                  </span>
                  <div className="pt-0.5 text-sm sm:text-base flex-1">
                    <MathRenderer content={optText} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#27272A]">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleToggleSolution}
                className="px-4 py-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#FFFFFF] text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>{isRevealed ? 'Hide Derivation' : 'Show 8-Step Working'}</span>
              </button>

              {onOpenInGemini && (
                <button
                  onClick={() => {
                    const fullQ = `${currentQ.subject} — ${currentQ.topic || ''}: ${currentQ.question}\nOptions:\nA. ${currentQ.options.A}\nB. ${currentQ.options.B}\nC. ${currentQ.options.C}\nD. ${currentQ.options.D}\n\nSolve with complete 8-step verified derivation.`;
                    onOpenInGemini(fullQ, currentQ.subject);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-[#22C55E]" />
                  <span>Solve with AI</span>
                </button>
              )}
            </div>

            {/* Navigation & Submit */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#18181B] hover:bg-[#27272A] disabled:opacity-30 text-[#FFFFFF] cursor-pointer"
              >
                Prev
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] cursor-pointer"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleFinalizeExam}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] flex items-center space-x-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Submit & View Result</span>
                </button>
              )}
            </div>
          </div>

          {/* Step-by-Step 8-Step Derivation Revealed Panel */}
          {(isRevealed || (examSubmitted && studyMode)) && (
            <div className="p-6 rounded-2xl bg-[#000000] border border-[#27272A] space-y-4 animate-fadeIn text-[#FFFFFF]">
              <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
                <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Correct Answer: Option {currentQ.correctAnswer}</span>
                </span>
                {currentQ.difficulty && (
                  <span className="text-xs text-[#A1A1AA]">Level: {currentQ.difficulty}</span>
                )}
              </div>

              {/* 1. Given Values */}
              {currentQ.givenValues && (
                <div className="py-1">
                  <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1">
                    1. Given Data:
                  </span>
                  <div className="text-sm font-mono text-[#FFFFFF] bg-[#0A0A0A] p-2.5 rounded-xl border border-[#27272A]">
                    {currentQ.givenValues}
                  </div>
                </div>
              )}

              {/* 2. Formula Required */}
              {currentQ.formula && (
                <div className="py-1">
                  <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1">
                    2. Governing Law & Formula:
                  </span>
                  <div className="text-base text-[#FFFFFF] py-1 text-center">
                    <MathRenderer content={currentQ.formula} displayMode={true} />
                  </div>
                </div>
              )}

              {/* 3. Value Substitution */}
              {currentQ.substitution && (
                <div className="py-1">
                  <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1">
                    3. Value Substitution:
                  </span>
                  <div className="text-sm sm:text-base text-[#FFFFFF] py-1 text-center">
                    <MathRenderer content={currentQ.substitution} displayMode={true} />
                  </div>
                </div>
              )}

              {/* 4. Calculation Steps */}
              {currentQ.steps && currentQ.steps.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#27272A]">
                  <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1">
                    4. Mathematical Working:
                  </span>
                  {currentQ.steps.map((st, i) => (
                    <div key={i} className="text-sm text-[#FFFFFF] py-0.5">
                      <MathRenderer content={st} />
                    </div>
                  ))}
                </div>
              )}

              {/* 5. Boxed Final Answer */}
              <div className="pt-3 pb-1 text-center">
                <div className="inline-block py-1">
                  <MathRenderer
                    content={`\\boxed{\\text{Option } ${currentQ.correctAnswer}: ${currentQ.options[currentQ.correctAnswer]}}`}
                    displayMode={true}
                  />
                </div>
              </div>

              {/* 6. Educational Explanation & Exam Tips */}
              {(currentQ.explanation || currentQ.examTip) && (
                <div className="pt-3 border-t border-[#27272A] space-y-2 text-xs text-[#A1A1AA]">
                  {currentQ.explanation && (
                    <p className="leading-relaxed">
                      <span className="font-bold text-[#FFFFFF]">Why This Answer is Correct: </span>
                      {currentQ.explanation}
                    </p>
                  )}
                  {currentQ.examTip && (
                    <p className="leading-relaxed">
                      <span className="font-bold text-[#22C55E]">Exam Trap & Tip: </span>
                      {currentQ.examTip}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Question Number Palette (1 to 40) */}
          <div className="pt-3 border-t border-[#27272A]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider block">
                Question Navigator ({Object.keys(selectedAnswers).length}/{questions.length} Attempted)
              </span>
              {examSubmitted && (
                <button
                  onClick={() => setShowResultsModal(true)}
                  className="text-xs font-bold text-[#22C55E] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Full Results</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {questions.map((_, i) => {
                const isAns = !!selectedAnswers[questions[i].id];
                const isCurr = i === currentIndex;
                const isCorrect = selectedAnswers[questions[i].id] === questions[i].correctAnswer;

                let btnStyle = 'bg-[#18181B] text-[#A1A1AA] hover:text-[#FFFFFF]';
                if (examSubmitted) {
                  btnStyle = isCorrect
                    ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40'
                    : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40';
                } else if (isAns) {
                  btnStyle = 'bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/40 font-bold';
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCurr ? 'ring-2 ring-[#FFFFFF] scale-110' : ''
                    } ${btnStyle}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-[#A1A1AA] bg-[#0A0A0A] rounded-3xl border border-[#27272A]">
          No questions available. Click above to generate 40 questions on your topic!
        </div>
      )}

      {/* COMPREHENSIVE CBT EXAM RESULTS MODAL (Auto-Triggered on Completion) */}
      {showResultsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-[#FFFFFF] space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header Badge & Title */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-[#22C55E]/20 border border-[#22C55E]/30 text-[#22C55E] mb-1">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#FFFFFF]">
                {examType} Examination Result
              </h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA]">
                {aiSubject} · {aiTopic} ({totalQuestions} Questions)
              </p>
            </div>

            {/* Score Showcase Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-[#000000] p-4 rounded-2xl border border-[#27272A]">
                <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider block">
                  Raw Score
                </span>
                <div className="text-2xl font-black text-[#FFFFFF] mt-1 font-mono">
                  {correctCount} / {totalQuestions}
                </div>
              </div>

              <div className="bg-[#000000] p-4 rounded-2xl border border-[#27272A]">
                <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider block">
                  Percentage
                </span>
                <div className="text-2xl font-black text-[#22C55E] mt-1 font-mono">
                  {scorePercent}%
                </div>
              </div>

              <div className="bg-[#000000] p-4 rounded-2xl border border-[#27272A]">
                <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider block">
                  JAMB Scaled
                </span>
                <div className="text-2xl font-black text-[#38BDF8] mt-1 font-mono">
                  {jambScaledScore} / 100
                </div>
              </div>

              <div className="bg-[#000000] p-4 rounded-2xl border border-[#27272A]">
                <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider block">
                  Time Taken
                </span>
                <div className="text-lg font-black text-[#FFFFFF] mt-2 font-mono">
                  {timeSpentFormatted}
                </div>
              </div>
            </div>

            {/* Performance Grade Banner */}
            <div className={`p-4 rounded-2xl border ${feedback.bg} space-y-1 text-left`}>
              <div className="flex items-center space-x-2">
                <Flame className={`w-4 h-4 ${feedback.color}`} />
                <span className={`text-sm font-black ${feedback.color}`}>{feedback.badge}</span>
              </div>
              <p className="text-xs text-[#E4E4E7] leading-relaxed">{feedback.message}</p>
            </div>

            {/* Diagnostic Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
                  Diagnostic Breakdown
                </span>
                <div className="flex items-center space-x-1 p-1 bg-[#000000] border border-[#27272A] rounded-xl text-xs">
                  <button
                    onClick={() => setResultsFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                      resultsFilter === 'all' ? 'bg-[#22C55E] text-[#FFFFFF]' : 'text-[#A1A1AA]'
                    }`}
                  >
                    All ({totalQuestions})
                  </button>
                  <button
                    onClick={() => setResultsFilter('wrong')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                      resultsFilter === 'wrong' ? 'bg-[#EF4444] text-[#FFFFFF]' : 'text-[#A1A1AA]'
                    }`}
                  >
                    Wrong ({wrongCount + unansweredCount})
                  </button>
                  <button
                    onClick={() => setResultsFilter('correct')}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                      resultsFilter === 'correct' ? 'bg-[#22C55E] text-[#FFFFFF]' : 'text-[#A1A1AA]'
                    }`}
                  >
                    Correct ({correctCount})
                  </button>
                </div>
              </div>

              {/* List of Questions with status and derivation link */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredQuestions.map((q, idx) => {
                  const userAns = selectedAnswers[q.id];
                  const isCorrect = userAns === q.correctAnswer;
                  const originalIndex = questions.findIndex((item) => item.id === q.id);

                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(originalIndex);
                        setShowResultsModal(false);
                        setShowSolution((prev) => ({ ...prev, [q.id]: true }));
                      }}
                      className="p-3 rounded-xl bg-[#000000] border border-[#27272A] hover:border-[#22C55E]/50 flex items-center justify-between text-xs cursor-pointer transition-all"
                    >
                      <div className="flex items-center space-x-2.5 truncate flex-1 pr-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                        )}
                        <span className="font-bold text-[#FFFFFF] shrink-0">
                          Q{originalIndex + 1}:
                        </span>
                        <span className="truncate text-[#A1A1AA]">{q.question}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md ${
                            isCorrect
                              ? 'bg-[#22C55E]/20 text-[#22C55E]'
                              : 'bg-[#EF4444]/20 text-[#EF4444]'
                          }`}
                        >
                          {userAns ? `Your: ${userAns} | Ans: ${q.correctAnswer}` : `Skipped | Ans: ${q.correctAnswer}`}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#27272A]">
              <button
                onClick={handleResetExam}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#FFFFFF] text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake This Exam</span>
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] text-xs font-black shadow-lg shadow-emerald-500/25 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Review All Derivations</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
