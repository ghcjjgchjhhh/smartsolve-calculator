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
  Play,
  Check,
  Send,
} from 'lucide-react';

interface JambPracticeViewProps {
  onOpenInGemini?: (prompt: string, subject?: string) => void;
}

export const JambPracticeView: React.FC<JambPracticeViewProps> = ({ onOpenInGemini }) => {
  // Mode: AI Custom Exam Generator vs Standard Questions Bank
  const [activeMode, setActiveMode] = useState<'ai_exam' | 'bank'>('ai_exam');

  // AI Exam Settings
  const [aiSubject, setAiSubject] = useState<'Physics' | 'Mathematics'>('Physics');
  const [aiTopic, setAiTopic] = useState<string>('Projectiles & Equations of Motion');
  const [aiCount, setAiCount] = useState<number>(40);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [aiQuestions, setAiQuestions] = useState<JambQuestion[]>([]);

  // Bank Filter
  const [subjectFilter, setSubjectFilter] = useState<'All' | 'Mathematics' | 'Physics'>('All');

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
  const [studyMode, setStudyMode] = useState<boolean>(false);

  // CBT Countdown Timer (in seconds)
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
      setExamSubmitted(true);
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

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (examSubmitted) return;
    if (!currentQ) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: opt,
    }));
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
    setCurrentIndex(0);
    setTimeLeft(questions.length * 60);
    setIsTimerRunning(true);
  };

  // Generate 10, 20, or 40 questions with AI
  const handleGenerateAiExam = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    const targetTopic = aiTopic.trim() || 'General Syllabus';

    try {
      const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_user_api_key') || '' : '';

      // 1. Direct browser call if user has local key
      if (storedKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: storedKey });
          const promptText = `
You are an expert Nigerian JAMB UTME & WAEC examination setter for ${aiSubject}.
Generate exactly ${aiCount} realistic, standard JAMB UTME multiple-choice questions on:
Topic / Formula: "${targetTopic}".

STYLING & NOTATION RULES:
1. Grade the questions from easy foundational questions to realistic exam calculations and conceptual traps.
2. Use clear standard LaTeX notation for all formulas, powers, fractions, and symbols ($...$, \\frac{a}{b}, \\sqrt{...}, x^2).
3. Every question must have exactly 4 plausible options labeled A, B, C, D.
4. Specify the exact correct answer ('A', 'B', 'C', or 'D').
5. Provide the governing theoretical formula and a verified step-by-step mathematical derivation showing substitutions and intermediate arithmetic.

Respond with ONLY a valid JSON object matching this exact structure:
{
  "subject": "${aiSubject}",
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
      "formula": "Governing formula in LaTeX",
      "steps": [
        "Given: ...",
        "Formula: ...",
        "Substitution: ...",
        "Final: ..."
      ]
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
              topic: targetTopic,
              examYear: 'JAMB AI Mock',
            }));
            setAiQuestions(formatted);
            setActiveMode('ai_exam');
            setSelectedAnswers({});
            setShowSolution({});
            setExamSubmitted(false);
            setCurrentIndex(0);
            setTimeLeft(aiCount * 60);
            setIsTimerRunning(true);
            return;
          }
        } catch (clientErr) {
          console.warn('Client direct generate fallback to server:', clientErr);
        }
      }

      // 2. Server API call
      let response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_questions',
          subject: aiSubject,
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
        topic: targetTopic,
        examYear: 'JAMB AI Mock',
      }));

      setAiQuestions(formatted);
      setActiveMode('ai_exam');
      setSelectedAnswers({});
      setShowSolution({});
      setExamSubmitted(false);
      setCurrentIndex(0);
      setTimeLeft(aiCount * 60);
      setIsTimerRunning(true);
    } catch (err: any) {
      setGenerationError(err.message || 'Failed to generate questions with AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Score calculation
  const totalQuestions = questions.length;
  let correctCount = 0;
  questions.forEach((q) => {
    if (selectedAnswers[q.id] === q.correctAnswer) {
      correctCount++;
    }
  });
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Topic presets for quick 1-tap selection
  const topicPresets: Record<'Physics' | 'Mathematics', string[]> = {
    Physics: [
      'Projectiles & Equations of Motion',
      'Current Electricity & Ohm\'s Law',
      'Work, Energy & Power',
      'Waves, Light & Sound',
      'Thermal Physics & Gas Laws',
      'Gravitational Field & Keplers Laws',
    ],
    Mathematics: [
      'Quadratic Equations & Roots',
      'Indices & Logarithms',
      'Calculus (Differentiation & Integration)',
      'Trigonometry & Bearing',
      'Sequences & Series (AP & GP)',
      'Circle Geometry & Coordinate Geometry',
    ],
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner with Mode Switcher */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-6 text-white shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] text-xs font-bold uppercase tracking-wider border border-[#22C55E]/30">
                JAMB UTME & WAEC CBT
              </span>
              <span className="text-xs text-[#A1A1AA]">· 100% Connected to AI Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1 flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-[#22C55E]" />
              <span>Nigerian Exam Practice & AI CBT Simulator</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-xl">
              Set customized 40-question mock exams on any subject or specific formula with AI, or practice verified past exam questions with step-by-step derivations.
            </p>
          </div>

          {/* Real-time CBT Timer / Score */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="bg-[#000000] p-3 rounded-2xl border border-[#27272A] text-center min-w-[100px]">
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
            <span>AI 40-Question Exam Setter</span>
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

      {/* AI EXAM GENERATOR CONTROL CARD (When activeMode === 'ai_exam') */}
      {activeMode === 'ai_exam' && (
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#22C55E]" />
              <h3 className="text-base font-bold text-[#FFFFFF]">Generate Custom Exam with AI</h3>
            </div>
            <span className="text-xs text-[#A1A1AA]">Syllabus-accurate questions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Subject Selector */}
            <div>
              <label className="text-xs font-bold text-[#A1A1AA] block mb-1">Subject</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#000000] border border-[#27272A] rounded-xl">
                {(['Physics', 'Mathematics'] as const).map((subj) => (
                  <button
                    key={subj}
                    onClick={() => {
                      setAiSubject(subj);
                      setAiTopic(topicPresets[subj][0]);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      aiSubject === subj
                        ? 'bg-[#22C55E] text-[#FFFFFF]'
                        : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count Selector (10, 20, 40) */}
            <div>
              <label className="text-xs font-bold text-[#A1A1AA] block mb-1">Question Count</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#000000] border border-[#27272A] rounded-xl">
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
                    {count === 40 ? '40 (Full)' : `${count} Qs`}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="flex flex-col justify-end">
              <button
                onClick={handleGenerateAiExam}
                disabled={isGenerating}
                className="w-full h-10 px-4 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 disabled:opacity-50 text-[#FFFFFF] font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting {aiCount} Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate {aiCount} Exam Qs</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Topic or Formula Input */}
          <div>
            <label className="text-xs font-bold text-[#A1A1AA] block mb-1.5">
              Topic or Governing Formula (or type any customized topic)
            </label>
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g. Projectiles, Ohm's Law, Quadratic Equations, Calculus..."
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

          {/* Generation Error banner */}
          {generationError && (
            <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center space-x-2">
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

          {/* Question Text in KaTeX */}
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
                <span>{isRevealed ? 'Hide Solution' : 'Show Derivation'}</span>
              </button>

              {onOpenInGemini && (
                <button
                  onClick={() => {
                    const fullQ = `${currentQ.subject} — ${currentQ.topic || ''}: ${currentQ.question}\nOptions:\nA. ${currentQ.options.A}\nB. ${currentQ.options.B}\nC. ${currentQ.options.C}\nD. ${currentQ.options.D}\n\nSolve step-by-step with complete mathematical derivation and verify the correct option.`;
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
                  onClick={() => setExamSubmitted(true)}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] flex items-center space-x-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Exam</span>
                </button>
              )}
            </div>
          </div>

          {/* Step-by-Step Derivation Revealed Panel */}
          {(isRevealed || (examSubmitted && studyMode)) && (
            <div className="p-5 rounded-2xl bg-[#000000] border border-[#27272A] space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Correct Option: Option {currentQ.correctAnswer}</span>
                </span>
              </div>

              {/* Formula Required */}
              {currentQ.formula && (
                <div className="py-1">
                  <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block mb-1">
                    Governing Law & Formula
                  </span>
                  <div className="text-base text-[#FFFFFF] py-1">
                    <MathRenderer content={currentQ.formula} displayMode={true} />
                  </div>
                </div>
              )}

              {/* Working Derivation Steps */}
              {currentQ.steps && currentQ.steps.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#27272A]">
                  <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block mb-1">
                    Verified Mathematical Working:
                  </span>
                  {currentQ.steps.map((st, i) => (
                    <div key={i} className="text-sm text-[#FFFFFF] py-0.5">
                      <MathRenderer content={st} />
                    </div>
                  ))}
                </div>
              )}

              {/* Final Boxed Answer */}
              <div className="pt-3 text-center">
                <div className="inline-block py-1">
                  <MathRenderer
                    content={`\\boxed{\\text{Option } ${currentQ.correctAnswer}: ${currentQ.options[currentQ.correctAnswer]}}`}
                    displayMode={true}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick Question Number Palette (1 to 40) */}
          <div className="pt-3 border-t border-[#27272A]">
            <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider block mb-2">
              Question Navigator ({Object.keys(selectedAnswers).length}/{questions.length} Answered)
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {questions.map((_, i) => {
                const isAns = !!selectedAnswers[questions[i].id];
                const isCurr = i === currentIndex;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCurr
                        ? 'ring-2 ring-[#FFFFFF] bg-[#22C55E] text-[#FFFFFF]'
                        : isAns
                        ? 'bg-[#22C55E]/30 text-[#22C55E] border border-[#22C55E]/40'
                        : 'bg-[#18181B] text-[#A1A1AA] hover:text-[#FFFFFF]'
                    }`}
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
    </div>
  );
};
