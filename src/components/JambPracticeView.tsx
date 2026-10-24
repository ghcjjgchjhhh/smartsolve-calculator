import React, { useState } from 'react';
import { JAMB_QUESTIONS } from '../data/jambQuestions';
import { JambQuestion } from '../types';
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
} from 'lucide-react';

interface JambPracticeViewProps {
  onOpenInGemini?: (prompt: string, subject?: string) => void;
}

export const JambPracticeView: React.FC<JambPracticeViewProps> = ({ onOpenInGemini }) => {
  const [subjectFilter, setSubjectFilter] = useState<'All' | 'Mathematics' | 'Physics'>('All');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);

  const questions = JAMB_QUESTIONS.filter((q) => {
    if (subjectFilter === 'All') return true;
    return q.subject === subjectFilter;
  });

  const currentQ = questions[currentIndex] || questions[0];
  const userChoice = selectedAnswers[currentQ.id];
  const isRevealed = showSolution[currentQ.id];

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: opt,
    }));
  };

  const handleToggleSolution = () => {
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
  };

  // Score calculation
  const totalQuestions = questions.length;
  let correctCount = 0;
  questions.forEach((q) => {
    if (selectedAnswers[q.id] === q.correctAnswer) {
      correctCount++;
    }
  });
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#181B22] via-[#1E232E] to-[#252A34] border border-[#27272A] rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              WAEC & JAMB UTME Prep
            </span>
            <span className="text-xs text-white/80">· Secondary School Physics & Math</span>
          </div>
          <h2 className="text-2xl font-black mt-1">JAMB / WAEC Practice Mode</h2>
          <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-lg">
            Master authentic examination questions with authentic multiple-choice options, step-by-step working, and exam tips.
          </p>
        </div>

        {/* Score widget */}
        <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center min-w-[130px]">
          <span className="text-xs font-semibold text-white/80 uppercase block">Current Score</span>
          <div className="text-2xl font-black mt-0.5">
            {correctCount} / {totalQuestions}
          </div>
          <span className="text-[11px] font-bold text-emerald-200">({scorePercent}%)</span>
        </div>
      </div>

      {/* Filter and navigation controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A0A0A] border border-[#27272A] p-4 rounded-2xl">
        {/* Subject filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {(['All', 'Physics', 'Mathematics'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSubjectFilter(s);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                subjectFilter === s
                  ? 'bg-[#22C55E] text-[#FFFFFF] font-bold shadow-sm'
                  : 'bg-[#000000] text-[#A1A1AA] hover:text-[#FFFFFF]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Question Counter & Reset */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-semibold text-[#A1A1AA]">
            Question <strong className="text-[#FFFFFF]">{currentIndex + 1}</strong> of{' '}
            <strong className="text-[#FFFFFF]">{totalQuestions}</strong>
          </span>
          <button
            onClick={handleResetExam}
            title="Reset All Answers"
            className="flex items-center space-x-1 text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-2xl p-6 shadow-sm space-y-6">
          {/* Question Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-lg bg-[#22C55E]/20 text-[#22C55E] font-bold text-xs">
                {currentQ.exam} {currentQ.year ? `(${currentQ.year})` : ''}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#000000] text-[#A1A1AA] font-semibold text-xs">
                {currentQ.subject}
              </span>
            </div>
            <span className="text-xs font-semibold text-[#A1A1AA]">{currentQ.topic}</span>
          </div>

          {/* Question Statement */}
          <div className="text-base sm:text-lg font-semibold text-[#FFFFFF] leading-relaxed">
            {currentQ.question}
          </div>

          {/* Options Grid (A, B, C, D) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const optText = currentQ.options[opt];
              const isSelected = userChoice === opt;
              const isCorrectAnswer = currentQ.correctAnswer === opt;

              let style =
                'bg-[#000000] border-[#27272A] hover:border-emerald-400 dark:hover:border-emerald-500 text-[#FFFFFF]';

              if (userChoice) {
                if (isCorrectAnswer) {
                  style = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30';
                } else if (isSelected && !isCorrectAnswer) {
                  style = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200';
                }
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-4 rounded-xl border-2 text-left font-medium transition-all flex items-start space-x-3 ${style}`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center flex-shrink-0 text-xs transition-colors ${
                      isSelected
                        ? 'bg-[#22C55E] text-[#FFFFFF]'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt}
                  </span>
                  <span className="pt-0.5 text-sm sm:text-base font-mono">{optText}</span>
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
                <span>{isRevealed ? 'Hide Solution' : 'Show Answer'}</span>
              </button>

              {onOpenInGemini && (
                <button
                  onClick={() => {
                    const fullQ = `${currentQ.subject} — ${currentQ.topic}: ${currentQ.question}\nOptions:\nA. ${currentQ.options.A}\nB. ${currentQ.options.B}\nC. ${currentQ.options.C}\nD. ${currentQ.options.D}\n\nSolve step-by-step with complete mathematical derivation and verify the correct option.`;
                    onOpenInGemini(fullQ, currentQ.subject);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-[#22C55E]" />
                  <span>Solve with Gemini AI</span>
                </button>
              )}
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#18181B] disabled:opacity-40 text-slate-700 dark:text-slate-300"
              >
                Previous
              </button>
              <button
                disabled={currentIndex >= questions.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] disabled:opacity-40"
              >
                Next Question
              </button>
            </div>
          </div>

          {/* Step-by-step Solution Revealed Panel */}
          {isRevealed && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Correct Answer: Option {currentQ.correctAnswer} ({currentQ.options[currentQ.correctAnswer]})</span>
                </span>
              </div>

              {/* Formula Used */}
              <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/30 rounded-xl border border-emerald-500/30 dark:border-zinc-800">
                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 block mb-1">
                  Formula Required
                </span>
                <span className="font-mono text-sm font-bold text-white dark:text-emerald-300">
                  {currentQ.formula}
                </span>
              </div>

              {/* Working Steps */}
              <div>
                <span className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider block mb-2">
                  Solution Steps
                </span>
                <div className="space-y-1.5">
                  {currentQ.steps.map((st, i) => (
                    <div
                      key={i}
                      className="flex items-start space-x-2 text-xs sm:text-sm font-mono text-slate-700 dark:text-slate-300"
                    >
                      <span className="text-emerald-500 font-bold">{i + 1}.</span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation & Exam Tip */}
              <div className="text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                <p>
                  <strong>Explanation:</strong> {currentQ.explanation}
                </p>
                {currentQ.examTip && (
                  <p className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                    💡 <strong>JAMB/WAEC Tip:</strong> {currentQ.examTip}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
