import React, { useState } from 'react';
import {
  HelpCircle,
  Lightbulb,
  Send,
  Eye,
  Loader2,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface SocraticTurn {
  role: 'tutor' | 'student';
  content: string;
  hint?: string;
  guidingQuestion?: string;
  isCorrect?: boolean;
}

interface RevealedSolution {
  formula: string;
  steps: string[];
  finalAnswer: string;
  conceptTakeaway?: string;
}

const STARTER_PROBLEMS = [
  'A ball is thrown vertically upward at 20 m/s. Find the maximum height reached (g = 10 m/s²).',
  'Solve the quadratic equation 3x² - 7x + 2 = 0 by factorization.',
  'Calculate the pH of a 0.005 M solution of H₂SO₄.',
  'Find dy/dx for y = (2x + 1)⁴ using the chain rule.',
];

export const SocraticTutorView: React.FC = () => {
  const [problem, setProblem] = useState<string>(STARTER_PROBLEMS[0]);
  const [activeProblem, setActiveProblem] = useState<string>('');
  const [turns, setTurns] = useState<SocraticTurn[]>([]);
  const [studentAttempt, setStudentAttempt] = useState<string>('');
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [revealed, setRevealed] = useState<RevealedSolution | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const callSocratic = async (
    mode: 'start' | 'next_hint' | 'check_attempt' | 'reveal_solution',
    targetProblem: string,
    attemptText: string,
    targetHintLevel: number,
    currentTurns: SocraticTurn[]
  ) => {
    setIsLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/socratic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: targetProblem,
          mode,
          studentAttempt: attemptText,
          hintLevel: targetHintLevel,
          history: currentTurns.map((t) => ({ role: t.role, content: `${t.content} ${t.guidingQuestion || ''}`.trim() })),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.socratic) {
        throw new Error(data?.error || 'Failed to get Socratic response.');
      }

      const s = data.socratic;
      if (mode === 'reveal_solution' && s.fullSolution) {
        setRevealed(s.fullSolution);
      } else {
        const tutorTurn: SocraticTurn = {
          role: 'tutor',
          content: s.feedback || '',
          guidingQuestion: s.guidingQuestion || '',
          hint: s.hint || '',
          isCorrect: Boolean(s.isAttemptCorrect),
        };
        setTurns((prev) => [...prev, tutorTurn]);
        if (s.solvedCompletely && s.fullSolution?.finalAnswer) {
          setRevealed(s.fullSolution);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error contacting Socratic Tutor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!problem.trim()) return;
    setActiveProblem(problem.trim());
    setTurns([]);
    setRevealed(null);
    setHintLevel(1);
    await callSocratic('start', problem.trim(), '', 1, []);
  };

  const handleCheckAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAttempt.trim() || !activeProblem || isLoading) return;
    const studentTurn: SocraticTurn = { role: 'student', content: studentAttempt.trim() };
    const nextTurns = [...turns, studentTurn];
    setTurns(nextTurns);
    setStudentAttempt('');
    await callSocratic('check_attempt', activeProblem, studentTurn.content, hintLevel, nextTurns);
  };

  const handleRequestHint = async () => {
    if (!activeProblem || isLoading) return;
    const nextLvl = Math.min(3, hintLevel + 1);
    setHintLevel(nextLvl);
    await callSocratic('next_hint', activeProblem, '', nextLvl, turns);
  };

  const handleRevealSolution = async () => {
    if (!activeProblem || isLoading) return;
    await callSocratic('reveal_solution', activeProblem, '', 3, turns);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Socratic AI Tutor
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
            Learn through guided questions and progressive hints without spoiling the answer—unlock the full worked solution whenever you choose.
          </p>
        </div>

        <form onSubmit={handleStartSession} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Enter a math, physics, or chemistry question..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          />
          <button
            type="submit"
            disabled={isLoading || !problem.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            {isLoading && !activeProblem ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
            <span>Start Guided Coaching</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {STARTER_PROBLEMS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setProblem(st)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181B] cursor-pointer text-left truncate max-w-sm"
            >
              {st}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {activeProblem && (
        <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 space-y-5">
          {/* Active Problem Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#27272A]">
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#22C55E]">Current Problem · Hint Level {hintLevel} / 3</div>
              <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                <MathRenderer content={activeProblem} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRequestHint}
                disabled={isLoading || Boolean(revealed)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#27272A] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#18181B] disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Next Hint</span>
              </button>
              <button
                type="button"
                onClick={handleRevealSolution}
                disabled={isLoading || Boolean(revealed)}
                className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Reveal Complete Solution</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveProblem('');
                  setTurns([]);
                  setRevealed(null);
                }}
                className="p-2 rounded-xl border border-slate-200 dark:border-[#27272A] text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title="Reset session"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dialogue History */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {turns.map((turn, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-4 text-xs sm:text-sm space-y-2 border ${
                  turn.role === 'student'
                    ? 'bg-slate-100 dark:bg-[#18181B] border-slate-200 dark:border-[#27272A] ml-6'
                    : 'bg-slate-50 dark:bg-[#111115] border-slate-200 dark:border-[#27272A] mr-6'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {turn.role === 'student' ? 'Your Attempt' : 'Socratic Coach'}
                  </span>
                  {turn.isCorrect && (
                    <span className="text-xs font-semibold text-[#22C55E] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      On Track
                    </span>
                  )}
                </div>
                {turn.content && <MathRenderer content={turn.content} />}
                {turn.guidingQuestion && (
                  <div className="p-3 rounded-lg bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#27272A] font-medium text-slate-900 dark:text-white">
                    <span className="text-xs font-bold text-[#22C55E] block mb-1">Next Question for You</span>
                    <MathRenderer content={turn.guidingQuestion} />
                  </div>
                )}
                {turn.hint && (
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    <strong>Hint:</strong> <MathRenderer content={turn.hint} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#22C55E]" />
                <span>Thinking of the best guiding step...</span>
              </div>
            )}
          </div>

          {/* Student Reply Box */}
          {!revealed && (
            <form onSubmit={handleCheckAttempt} className="flex gap-2.5 pt-2">
              <input
                type="text"
                value={studentAttempt}
                onChange={(e) => setStudentAttempt(e.target.value)}
                placeholder="Write your next step, formula choice, or numerical attempt..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
              <button
                type="submit"
                disabled={isLoading || !studentAttempt.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Check Step</span>
              </button>
            </form>
          )}

          {/* Complete Revealed Solution */}
          {revealed && (
            <div className="rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 p-4 sm:p-5 space-y-4">
              <div className="text-sm font-bold text-[#22C55E]">Complete Worked Solution</div>
              {revealed.formula && (
                <div className="rounded-lg bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#27272A] p-3">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Governing Formula</div>
                  <MathRenderer content={revealed.formula} />
                </div>
              )}
              <ol className="space-y-2">
                {(revealed.steps || []).map((st, idx) => (
                  <li key={idx} className="rounded-lg bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-[#27272A] p-3 text-xs sm:text-sm">
                    <MathRenderer content={st} />
                  </li>
                ))}
              </ol>
              <div className="rounded-lg bg-white dark:bg-[#0A0A0A] border border-[#22C55E]/40 p-3">
                <div className="text-xs font-bold text-[#22C55E] mb-1">Final Answer</div>
                <MathRenderer content={revealed.finalAnswer} />
              </div>
              {revealed.conceptTakeaway && (
                <p className="text-xs text-slate-700 dark:text-zinc-300">
                  <strong>Key Takeaway:</strong> {revealed.conceptTakeaway}
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
