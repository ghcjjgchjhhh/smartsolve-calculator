import { evaluateExpression } from './mathEngine';
import { latexToPlainExpression } from './deterministicSolver';

const PROGRESS_STORAGE_KEY = 'smartsolve_tutor_progress_v2';

export interface TopicProgressRecord {
  topic: string;
  subject: string;
  completedAt: number;
  lastPracticedAt: number;
  attempted: number;
  correct: number;
}

export interface FormulaPracticeStat {
  key: string;
  formulaName: string;
  topic: string;
  attempts: number;
  correct: number;
  lastPracticedAt: number;
}

export interface QuestionAttemptRecord {
  id: string;
  topic: string;
  formulaName?: string;
  question: string;
  difficulty: string;
  hint?: string;
  formulaUsed?: string;
  whyThisFormula?: string;
  steps?: string[];
  finalAnswer?: string;
  expectedNumericValue?: number;
  unit?: string;
  isCorrect: boolean;
  attempts: number;
  timestamp: number;
}

export interface TutorProgressState {
  topics: Record<string, TopicProgressRecord>;
  formulas: Record<string, FormulaPracticeStat>;
  questions: Record<string, QuestionAttemptRecord>;
  recentOutcomes: boolean[]; // rolling last 10 attempts for adaptive difficulty
  streak: number;
}

export type AdaptiveMode = 'simplify' | 'standard' | 'challenge';

export interface AdaptiveDifficultyProfile {
  skillBand: 'Foundational' | 'Developing' | 'Proficient' | 'Mastery';
  recommendedDifficulty: 'Easy' | 'Intermediate' | 'Difficult' | 'Examination-Standard';
  adaptiveMode: AdaptiveMode;
  recentAccuracyPct: number;
  streak: number;
  coachNote: string;
}

const DEFAULT_PROGRESS: TutorProgressState = {
  topics: {},
  formulas: {},
  questions: {},
  recentOutcomes: [],
  streak: 0,
};

export function loadTutorProgress(): TutorProgressState {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    return {
      topics: parsed.topics || {},
      formulas: parsed.formulas || {},
      questions: parsed.questions || {},
      recentOutcomes: Array.isArray(parsed.recentOutcomes) ? parsed.recentOutcomes : [],
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveTutorProgress(state: TutorProgressState): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

export function markTopicStudied(topic: string, subject: string): TutorProgressState {
  const state = loadTutorProgress();
  const key = topic.trim().toLowerCase();
  if (!key) return state;
  const now = Date.now();
  const existing = state.topics[key];
  state.topics[key] = existing
    ? { ...existing, subject: subject || existing.subject, lastPracticedAt: now }
    : {
        topic: topic.trim(),
        subject: subject || 'General STEM',
        completedAt: now,
        lastPracticedAt: now,
        attempted: 0,
        correct: 0,
      };
  saveTutorProgress(state);
  return state;
}

export function recordQuestionOutcome(params: {
  id: string;
  topic: string;
  subject: string;
  formulaName?: string;
  question: string;
  difficulty: string;
  hint?: string;
  formulaUsed?: string;
  whyThisFormula?: string;
  steps?: string[];
  finalAnswer?: string;
  expectedNumericValue?: number;
  unit?: string;
  isCorrect: boolean;
}): TutorProgressState {
  const state = loadTutorProgress();
  const now = Date.now();
  const topicKey = params.topic.trim().toLowerCase();

  // Topic record
  const prevTopic = state.topics[topicKey] || {
    topic: params.topic.trim(),
    subject: params.subject || 'General STEM',
    completedAt: now,
    lastPracticedAt: now,
    attempted: 0,
    correct: 0,
  };
  state.topics[topicKey] = {
    ...prevTopic,
    lastPracticedAt: now,
    attempted: prevTopic.attempted + 1,
    correct: prevTopic.correct + (params.isCorrect ? 1 : 0),
  };

  // Formula record
  if (params.formulaName) {
    const fKey = `${topicKey}::${params.formulaName.trim().toLowerCase()}`;
    const prevFormula = state.formulas[fKey] || {
      key: fKey,
      formulaName: params.formulaName.trim(),
      topic: params.topic.trim(),
      attempts: 0,
      correct: 0,
      lastPracticedAt: now,
    };
    state.formulas[fKey] = {
      ...prevFormula,
      attempts: prevFormula.attempts + 1,
      correct: prevFormula.correct + (params.isCorrect ? 1 : 0),
      lastPracticedAt: now,
    };
  }

  // Question record (keeps missed questions in queue until resolved!)
  const qKey = params.id || `${topicKey}_${params.question.slice(0, 40)}`;
  const prevQ = state.questions[qKey];
  state.questions[qKey] = {
    id: qKey,
    topic: params.topic,
    formulaName: params.formulaName,
    question: params.question,
    difficulty: params.difficulty,
    hint: params.hint,
    formulaUsed: params.formulaUsed,
    whyThisFormula: params.whyThisFormula,
    steps: params.steps,
    finalAnswer: params.finalAnswer,
    expectedNumericValue: params.expectedNumericValue,
    unit: params.unit,
    isCorrect: params.isCorrect,
    attempts: (prevQ?.attempts || 0) + 1,
    timestamp: now,
  };

  state.recentOutcomes = [...state.recentOutcomes, params.isCorrect].slice(-10);
  state.streak = params.isCorrect ? state.streak + 1 : 0;

  saveTutorProgress(state);
  return state;
}

export function getAdaptiveDifficultyProfile(state: TutorProgressState): AdaptiveDifficultyProfile {
  const recent = state.recentOutcomes;
  if (recent.length === 0) {
    return {
      skillBand: 'Developing',
      recommendedDifficulty: 'Intermediate',
      adaptiveMode: 'standard',
      recentAccuracyPct: 0,
      streak: 0,
      coachNote: 'Attempt practice questions under any formula to calibrate your adaptive tutor level.',
    };
  }

  const hits = recent.filter(Boolean).length;
  const pct = Math.round((hits / recent.length) * 100);
  const lastTwoWrong =
    recent.length >= 2 && !recent[recent.length - 1] && !recent[recent.length - 2];

  if (lastTwoWrong || (recent.length >= 3 && pct < 50)) {
    return {
      skillBand: 'Foundational',
      recommendedDifficulty: 'Easy',
      adaptiveMode: 'simplify',
      recentAccuracyPct: pct,
      streak: state.streak,
      coachNote:
        'You hit a couple of tricky steps recently. Switch to Simplify Mode or Easy warm-ups so we nail the basics step by step.',
    };
  }

  if (state.streak >= 3 || (recent.length >= 4 && pct >= 85)) {
    return {
      skillBand: 'Mastery',
      recommendedDifficulty: 'Examination-Standard',
      adaptiveMode: 'challenge',
      recentAccuracyPct: pct,
      streak: state.streak,
      coachNote: `Strong momentum (${pct}% recent accuracy, ${state.streak}-question streak)! Stepping up to Examination-Standard & Difficult challenges.`,
    };
  }

  if (pct >= 70) {
    return {
      skillBand: 'Proficient',
      recommendedDifficulty: 'Difficult',
      adaptiveMode: 'standard',
      recentAccuracyPct: pct,
      streak: state.streak,
      coachNote: `Solid grasp (${pct}% accuracy). Try Difficult multi-step variations to sharpen exam readiness.`,
    };
  }

  return {
    skillBand: 'Developing',
    recommendedDifficulty: 'Intermediate',
    adaptiveMode: 'standard',
    recentAccuracyPct: pct,
    streak: state.streak,
    coachNote: `Good progress (${pct}% accuracy). Keep practicing Intermediate applications and unit conversions.`,
  };
}

export function getProgressSummary(state: TutorProgressState) {
  const topicList = Object.values(state.topics).sort((a, b) => b.lastPracticedAt - a.lastPracticedAt);
  const formulaList = Object.values(state.formulas).sort((a, b) => b.lastPracticedAt - a.lastPracticedAt);
  const questionList = Object.values(state.questions);
  const totalAnswered = questionList.reduce((acc, q) => acc + q.attempts, 0);
  const uniqueAnswered = questionList.length;
  const correctCount = questionList.filter((q) => q.isCorrect).length;
  const incorrectCount = questionList.filter((q) => !q.isCorrect).length;
  const missedQuestions = questionList
    .filter((q) => !q.isCorrect)
    .sort((a, b) => b.timestamp - a.timestamp);

  const topicsNeedingRevision = topicList.filter(
    (t) => t.attempted >= 2 && t.correct / t.attempted < 0.65
  );

  return {
    topicsCompletedCount: topicList.length,
    topicList,
    formulasPracticedCount: formulaList.length,
    formulaList,
    totalAnswered,
    uniqueAnswered,
    correctCount,
    incorrectCount,
    overallAccuracyPct: uniqueAnswered > 0 ? Math.round((correctCount / uniqueAnswered) * 100) : 0,
    missedQuestions,
    topicsNeedingRevision,
  };
}

export interface AnswerCheckResult {
  checked: boolean;
  isCorrect: boolean;
  feedback: string;
}

/**
 * Deterministically evaluates a student's numeric/expression/MCQ answer against expected values.
 */
export function checkStudentAnswer(params: {
  studentInput: string;
  expectedNumericValue?: number;
  finalAnswerText?: string;
  correctOption?: string;
  unit?: string;
}): AnswerCheckResult {
  const raw = params.studentInput.trim();
  if (!raw) {
    return { checked: false, isCorrect: false, feedback: 'Enter an answer or select an option first.' };
  }

  // 1. Multiple-choice comparison
  if (params.correctOption) {
    const cleanOpt = raw.replace(/[^A-Za-z]/g, '').toUpperCase();
    const expectedOpt = params.correctOption.trim().toUpperCase();
    if (cleanOpt === expectedOpt || (cleanOpt.length === 1 && 'ABCD'.includes(cleanOpt))) {
      const ok = cleanOpt === expectedOpt;
      return {
        checked: true,
        isCorrect: ok,
        feedback: ok
          ? `Correct! Option ${expectedOpt} matches the verified solution.`
          : `Not quite — you picked Option ${cleanOpt}. Use Hint or Show Formula before retrying, or tap Solve to inspect the full working.`,
      };
    }
  }

  // 2. Numeric / expression comparison against expectedNumericValue or numeric parsed from finalAnswerText
  let targetNum =
    typeof params.expectedNumericValue === 'number' && isFinite(params.expectedNumericValue)
      ? params.expectedNumericValue
      : NaN;

  if (isNaN(targetNum) && params.finalAnswerText) {
    const strippedBox = params.finalAnswerText
      .replace(/\\boxed\{|\}/g, ' ')
      .replace(/\\text\{[^}]*\}/g, ' ')
      .replace(/≈|=/g, ' = ');
    const rhs = strippedBox.includes('=') ? strippedBox.split('=').pop() || strippedBox : strippedBox;
    const numMatches = rhs.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi);
    if (numMatches && numMatches.length === 1) {
      targetNum = parseFloat(numMatches[0]);
    }
  }

  if (!isNaN(targetNum)) {
    // Strip trailing common unit tokens from student input cleanly (e.g. "9.8 m/s", "14 cm", "200 J")
    const cleanedExpr = raw
      .replace(/^[a-zA-Z_]+\s*=\s*/, '')
      .replace(/\s*(?:m\/s\^?2|m\/s²|m\/s|km\/h|cm|mm|km|kg|g|mg|s|ms|min|hr|h|N|J|kJ|W|kW|V|mV|A|mA|Ω|ohm|ohms|Hz|kHz|MHz|Pa|kPa|atm|K|°C|deg|rad|mol|M|L|mL)\s*$/i, '')
      .trim();

    let studentNum = NaN;
    try {
      const plain = latexToPlainExpression(cleanedExpr);
      studentNum = evaluateExpression(plain, 'deg').result;
    } catch {
      const directMatch = cleanedExpr.match(/-?\d+(?:\.\d+)?/);
      if (directMatch) {
        studentNum = parseFloat(directMatch[0]);
      }
    }

    if (!isNaN(studentNum) && isFinite(studentNum)) {
      const tol = Math.max(0.02, Math.abs(targetNum) * 0.02);
      const isMatch = Math.abs(studentNum - targetNum) <= tol;
      return {
        checked: true,
        isCorrect: isMatch,
        feedback: isMatch
          ? `Exact match! Your answer (${studentNum}${params.unit ? ' ' + params.unit : ''}) agrees with ${targetNum}${params.unit ? ' ' + params.unit : ''}.`
          : `Close check: you entered ${studentNum}${params.unit ? ' ' + params.unit : ''}, which doesn't match the verified calculation yet. Double-check unit conversions or tap Show Hint.`,
      };
    }
  }

  // 3. Normalized text/LaTeX fallback match (for algebraic expressions & non-numerical questions)
  if (params.finalAnswerText) {
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/\\boxed|\\text|\$|\{|\}|\s+/g, '')
        .replace(/\\frac/g, '')
        .trim();
    const sNorm = norm(raw);
    const fNorm = norm(params.finalAnswerText);
    if (sNorm.length >= 2 && (fNorm === sNorm || fNorm.endsWith('=' + sNorm))) {
      return {
        checked: true,
        isCorrect: true,
        feedback: 'Spot on! Your expression matches the model answer.',
      };
    }
  }

  return {
    checked: true,
    isCorrect: false,
    feedback:
      'Could not automatically confirm that exact form — compare your working with Show Hint or click Solve to review step by step.',
  };
}

export function resetTutorProgress(): TutorProgressState {
  saveTutorProgress({ ...DEFAULT_PROGRESS });
  return { ...DEFAULT_PROGRESS };
}
