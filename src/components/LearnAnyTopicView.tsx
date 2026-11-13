import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Bookmark,
  Check,
  Compass,
  Copy,
  Cpu,
  Flame,
  GraduationCap,
  Layers,
  Lightbulb,
  Loader2,
  MessageSquare,
  Printer,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  FormulaQuestion,
  LearnTopicFormula,
  LearnTopicLesson,
  LearnTopicWorkedExample,
} from '../types';
import { MathRenderer } from './MathRenderer';
import { ScientificDiagramRenderer } from './ScientificDiagramRenderer';
import { InteractiveSolverGraph } from './InteractiveSolverGraph';
import {
  AdaptiveExplanationResult,
  askTopicFollowUp,
  fetchAdaptiveExplanation,
  fetchFormulaQuestions,
  fetchTopicLesson,
  findVerifiedPastQuestions,
  getSavedLessons,
  saveLessonToHistory,
} from '../services/learnTopicService';
import {
  getAdaptiveDifficultyProfile,
  getProgressSummary,
  loadTutorProgress,
  markTopicStudied,
  recordQuestionOutcome,
  resetTutorProgress,
  TutorProgressState,
} from '../services/tutorProgressService';
import { TutorQuestionCard, UnifiedTutorQuestion } from './TutorQuestionCard';
import { useTheme } from '../contexts/ThemeContext';
import { useAppLanguage } from '../contexts/LanguageContext';

const SUBJECT_OPTIONS = [
  'Auto-Detect',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Further Mathematics',
  'English Language',
  'Economics',
  'Geography',
  'Computer Science',
];

const EXAM_LEVEL_OPTIONS = [
  'JUPEB, JAMB, WAEC & University',
  'WAEC / WASSCE (Senior Secondary)',
  'JAMB / UTME (Tertiary Entry)',
  'JUPEB / A-Level / Pre-Degree',
  'University Undergraduate (100–300L)',
];

const SUGGESTED_TOPICS = [
  {
    title: 'Circle Geometry & Chords',
    subject: 'Mathematics',
    query: 'Circle geometry: chord perpendicular distance from center, radius, tangent properties and circle theorems.',
  },
  {
    title: 'Projectile Motion',
    subject: 'Physics',
    query: 'Projectile motion launched at an angle: time of flight, maximum height, horizontal range and trajectory.',
  },
  {
    title: 'Chemical Equilibrium',
    subject: 'Chemistry',
    query: "Chemical equilibrium, Le Chatelier's principle, equilibrium constant Kc and industrial Haber process.",
  },
  {
    title: 'Cellular Respiration',
    subject: 'Biology',
    query: 'Aerobic vs anaerobic cellular respiration, glycolysis, Krebs cycle, ATP yield and mitochondria structure.',
  },
  {
    title: 'Demand & Elasticity',
    subject: 'Economics',
    query: 'Price elasticity of demand, equilibrium price, consumer surplus and elasticity formulas.',
  },
  {
    title: 'Figures of Speech & Essay',
    subject: 'English Language',
    query: 'Figures of speech, literary devices, clause types and formal essay structure for WAEC & JAMB.',
  },
  {
    title: 'Matrices & Determinants',
    subject: 'Further Mathematics',
    query: 'Matrices, determinants, inverse matrix and solving simultaneous linear equations using Cramer rule.',
  },
  {
    title: 'Algorithms & Big-O',
    subject: 'Computer Science',
    query: 'Time complexity, Big-O notation, binary search vs linear search and recursion with worked steps.',
  },
];

type StudioSectionTab = 'lesson' | 'formulas' | 'formula_practice' | 'exam_mode' | 'visuals_tutor';

export const LearnAnyTopicView: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { currentLanguage } = useAppLanguage();

  const [topicInput, setTopicInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Auto-Detect');
  const [customSubject, setCustomSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('JUPEB, JAMB, WAEC & University');
  const [activeStudioTab, setActiveStudioTab] = useState<StudioSectionTab>('lesson');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LearnTopicLesson | null>(null);

  // Per-formula progressive 12-question loading states
  const [formulaLoadingMap, setFormulaLoadingMap] = useState<Record<string, boolean>>({});
  const [formulaErrorMap, setFormulaErrorMap] = useState<Record<string, string>>({});
  const [expandedFormulaPractice, setExpandedFormulaPractice] = useState<Record<string, boolean>>({});
  const [formulaDiffFilter, setFormulaDiffFilter] = useState<Record<string, string>>({});

  // Formula Practice Mode state
  const [practiceFormulaIdx, setPracticeFormulaIdx] = useState(0);
  const [practiceDiff, setPracticeDiff] = useState<'All' | 'Easy' | 'Intermediate' | 'Difficult' | 'Examination-Standard'>('All');
  const [practiceSourceFilter, setPracticeSourceFilter] = useState<'formula' | 'missed'>('formula');

  // Exam Mode filters
  const [examBodyFilter, setExamBodyFilter] = useState<'All' | 'JAMB' | 'WAEC' | 'JUPEB'>('All');
  const [examTypeFilter, setExamTypeFilter] = useState<string>('All');

  // Adaptive Simplification / Coaching
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptationResult, setAdaptationResult] = useState<AdaptiveExplanationResult | null>(null);

  // Follow-up AI tutor chat
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpHistory, setFollowUpHistory] = useState<Array<{ role: 'user' | 'tutor'; text: string }>>([]);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  // Progress & History
  const [progress, setProgress] = useState<TutorProgressState>(() => loadTutorProgress());
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [savedLessons, setSavedLessons] = useState<LearnTopicLesson[]>(() => getSavedLessons());
  const [copied, setCopied] = useState(false);

  const lessonTopRef = useRef<HTMLDivElement | null>(null);
  const followUpBottomRef = useRef<HTMLDivElement | null>(null);
  const lastAttemptRef = useRef<{ query: string; subject?: string } | null>(null);

  const adaptiveProfile = useMemo(() => getAdaptiveDifficultyProfile(progress), [progress]);
  const progressSummary = useMemo(() => getProgressSummary(progress), [progress]);

  const effectiveSubjectChoice = customSubject.trim()
    ? customSubject.trim()
    : selectedSubject;

  const verifiedPastMatches = useMemo(() => {
    if (!lesson) return [];
    return findVerifiedPastQuestions(lesson.topic, lesson.subject);
  }, [lesson?.topic, lesson?.subject]);

  // Helper to load 12 questions for any formula in the current lesson
  const loadQuestionsForFormula = async (
    targetLesson: LearnTopicLesson,
    formulaIdx: number,
    forceRefresh: boolean = false
  ) => {
    const formula = targetLesson.formulas?.[formulaIdx];
    if (!formula) return;
    const fKey = formula.id || formula.name || `f_${formulaIdx}`;
    if (!forceRefresh && formula.questions && formula.questions.length >= 6) {
      return;
    }

    setFormulaLoadingMap((prev) => ({ ...prev, [fKey]: true }));
    setFormulaErrorMap((prev) => ({ ...prev, [fKey]: '' }));

    try {
      const existingQs = (formula.questions || []).map((q) => q.question);
      const generated = await fetchFormulaQuestions({
        topic: targetLesson.topic,
        subject: targetLesson.subject,
        examLevel: targetLesson.targetExamLevel,
        formula,
        existingQuestions: forceRefresh ? existingQs : [],
        forceRefresh,
      });

      setLesson((prev) => {
        if (!prev || prev.topic !== targetLesson.topic) return prev;
        const nextFormulas = prev.formulas.map((f, idx) =>
          idx === formulaIdx ? { ...f, questions: generated } : f
        );
        const updated = { ...prev, formulas: nextFormulas };
        saveLessonToHistory(updated);
        return updated;
      });
    } catch (err: any) {
      setFormulaErrorMap((prev) => ({
        ...prev,
        [fKey]: err?.message || 'Could not generate formula questions.',
      }));
    } finally {
      setFormulaLoadingMap((prev) => ({ ...prev, [fKey]: false }));
    }
  };

  // Automatically trigger progressive background generation of Formula #1's 12 questions right after a lesson loads
  useEffect(() => {
    if (!lesson || !lesson.formulas || lesson.formulas.length === 0) return;
    const f0 = lesson.formulas[0];
    const fKey = f0.id || f0.name || 'f_0';
    if ((!f0.questions || f0.questions.length === 0) && !formulaLoadingMap[fKey]) {
      setExpandedFormulaPractice((prev) => ({ ...prev, [fKey]: true }));
      loadQuestionsForFormula(lesson, 0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.topic]);

  const handleTeachMe = async (customQuery?: string, subjectOverride?: string) => {
    const query = (customQuery ?? topicInput).trim();
    if (!query) return;

    const subjectArg = subjectOverride ?? effectiveSubjectChoice;
    lastAttemptRef.current = { query, subject: subjectArg };

    setIsLoading(true);
    setError(null);
    setAdaptationResult(null);
    setFollowUpHistory([]);
    setFormulaErrorMap({});
    setFormulaLoadingMap({});
    setPracticeFormulaIdx(0);
    setPracticeSourceFilter('formula');

    try {
      const result = await fetchTopicLesson({
        topic: query,
        subject: subjectArg,
        examLevel: selectedLevel,
        language: currentLanguage.name,
        adaptiveMode: adaptiveProfile.adaptiveMode,
      });

      setLesson(result);
      setActiveStudioTab('lesson');
      const nextProgress = markTopicStudied(result.topic, result.subject);
      setProgress(nextProgress);
      setSavedLessons(getSavedLessons());

      setTimeout(() => {
        lessonTopRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      setError(err?.message || 'Unable to generate academic lesson. Please tap Retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryLesson = () => {
    const attempt = lastAttemptRef.current;
    if (attempt?.query) {
      handleTeachMe(attempt.query, attempt.subject);
    } else if (topicInput.trim()) {
      handleTeachMe(topicInput.trim());
    }
  };

  const handleRequestAdaptation = async (mode: 'simplify' | 'challenge', strugglingPoint?: string) => {
    if (!lesson || isAdapting) return;
    setIsAdapting(true);
    try {
      const res = await fetchAdaptiveExplanation({
        topic: lesson.topic,
        subject: lesson.subject,
        strugglingPoint: strugglingPoint || lesson.topic,
        mode,
      });
      setAdaptationResult(res);
    } catch (err: any) {
      setAdaptationResult({
        title: mode === 'simplify' ? 'Simpler Breakdown Unavailable' : 'Challenge Mode Issue',
        encouragement: err?.message || 'Please try again in a moment.',
        simpleAnalogy: '',
        stepByStepCore: [],
      });
    } finally {
      setIsAdapting(false);
    }
  };

  const handleFollowUpSubmit = async (customText?: string) => {
    const questionText = (customText || followUpQuestion).trim();
    if (!questionText || !lesson || isFollowUpLoading) return;

    setFollowUpQuestion('');
    const newHistory = [...followUpHistory, { role: 'user' as const, text: questionText }];
    setFollowUpHistory(newHistory);
    setIsFollowUpLoading(true);

    try {
      const lessonSummary = `${lesson.topic} (${lesson.subject}): ${lesson.summary}. Formulas: ${lesson.formulas
        .map((f) => `${f.name}: ${f.latex}`)
        .join('; ')}`;
      const reply = await askTopicFollowUp(
        lesson.topic,
        questionText,
        lessonSummary,
        adaptiveProfile.adaptiveMode
      );

      setFollowUpHistory([...newHistory, { role: 'tutor' as const, text: reply }]);
      setTimeout(() => {
        followUpBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setFollowUpHistory([
        ...newHistory,
        {
          role: 'tutor' as const,
          text: `I encountered an issue answering: "${err?.message || 'Network error'}". Please try asking again.`,
        },
      ]);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleRecordAttempt = (
    uq: UnifiedTutorQuestion,
    isCorrect: boolean,
    formulaName?: string
  ) => {
    if (!lesson) return;
    const next = recordQuestionOutcome({
      id: uq.id,
      topic: lesson.topic,
      subject: lesson.subject,
      formulaName,
      question: uq.question,
      difficulty: uq.difficulty,
      hint: uq.hint,
      formulaUsed: uq.formulaUsed,
      whyThisFormula: uq.whyThisFormula,
      steps: uq.steps,
      finalAnswer: uq.finalAnswer,
      expectedNumericValue: uq.expectedNumericValue,
      unit: uq.unit,
      isCorrect,
    });
    setProgress(next);
  };

  const handleCopySummary = () => {
    if (!lesson) return;
    const textToCopy = `Topic: ${lesson.topic} (${lesson.subject})
Level: ${lesson.targetExamLevel}

Simple Definition:
${lesson.simpleDefinition || lesson.summary}

Introduction:
${lesson.introduction}

Core Formulas:
${lesson.formulas.map((f) => `- ${f.name}: ${f.latex} (${f.whenToUse})`).join('\n')}

Summary:
${lesson.summary}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mapFormulaQuestion = (fq: FormulaQuestion): UnifiedTutorQuestion => ({
    id: fq.id,
    question: fq.question,
    difficulty: fq.difficulty,
    skillType: fq.skillType,
    verifiedDeterministically: fq.verifiedDeterministically,
    options: fq.options,
    correctOption: fq.correctOption,
    hint: fq.hint,
    formulaUsed: fq.formulaUsed,
    whyThisFormula: fq.whyThisFormula,
    steps: fq.steps,
    finalAnswer: fq.finalAnswer,
    expectedNumericValue: fq.expectedNumericValue,
    unit: fq.unit,
  });

  const renderWorkedExampleBlock = (ex: LearnTopicWorkedExample, labelBadge: string) => (
    <div
      className={`rounded-xl border p-3.5 sm:p-4 space-y-2.5 ${
        isDark ? 'bg-black/35 border-white/10' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 border-zinc-700/20">
        <span className="text-xs font-bold text-[#22C55E]">{labelBadge}</span>
        <span className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
          {ex.title}
        </span>
      </div>
      <div className={`text-xs sm:text-sm ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
        <MathRenderer content={ex.problemStatement} />
      </div>
      {ex.givenValues && ex.givenValues.length > 0 && (
        <div className={`text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
          Given: {ex.givenValues.map((g) => `${g.symbol || g.name} = ${g.value}${g.unit ? ' ' + g.unit : ''}`).join(' · ')}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div className={`p-2 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
          <span className="text-[10px] font-bold uppercase text-zinc-500 block">Formula</span>
          <MathRenderer content={ex.formulaUsed} />
        </div>
        <div className={`p-2 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
          <span className="text-[10px] font-bold uppercase text-zinc-500 block">Substitution</span>
          <MathRenderer content={ex.substitution} />
        </div>
      </div>
      <div className="space-y-1 text-xs">
        {ex.steps.map((st, idx) => (
          <div key={idx} className={isDark ? 'text-zinc-300' : 'text-slate-700'}>
            <MathRenderer content={st} />
          </div>
        ))}
      </div>
      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#22C55E]">
        <span>Final Answer:</span>
        <MathRenderer content={ex.finalAnswer} />
      </div>
      {ex.explanation && (
        <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
          {ex.explanation}
        </p>
      )}
    </div>
  );

  // Combined Examination Questions (Verified Curated Past Questions first, then AI-Generated)
  const combinedExamQuestions: UnifiedTutorQuestion[] = useMemo(() => {
    if (!lesson) return [];
    const verified: UnifiedTutorQuestion[] = verifiedPastMatches.map((em) => ({
      id: em.id,
      question: em.question,
      difficulty: em.difficulty,
      skillType: `${em.examBody} · ${em.questionType}`,
      sourceLabel: `Verified Curated Past Question · ${em.examBody} ${em.year || ''}`.trim(),
      isVerifiedPast: true,
      options: em.options,
      correctOption: em.correctAnswer,
      hint: em.hint,
      formulaUsed: em.formula,
      whyThisFormula: em.whyFormula,
      steps: em.steps,
      finalAnswer: em.finalAnswer,
      unit: em.unit,
    }));

    const aiGen: UnifiedTutorQuestion[] = (lesson.examModeQuestions || []).map((em, i) => ({
      id: em.id || `ai_em_${i}`,
      question: em.question,
      difficulty: em.difficulty,
      skillType: `${em.examBody} · ${em.questionType}`,
      sourceLabel: `AI-Generated Practice · ${em.examBody}`,
      isVerifiedPast: false,
      options: em.options,
      correctOption: em.correctAnswer,
      hint: em.hint,
      formulaUsed: em.formula,
      whyThisFormula: em.whyFormula,
      steps: em.steps,
      finalAnswer: em.finalAnswer,
      unit: em.unit,
      markingPoints: em.markingPoints,
    }));

    return [...verified, ...aiGen].filter((item) => {
      const skill = item.skillType || '';
      const bodyOk = examBodyFilter === 'All' || skill.includes(examBodyFilter);
      const typeOk = examTypeFilter === 'All' || skill.includes(examTypeFilter);
      return bodyOk && typeOk;
    });
  }, [lesson, verifiedPastMatches, examBodyFilter, examTypeFilter]);

  const activePracticeFormula = lesson?.formulas?.[practiceFormulaIdx];

  return (
    <div className="space-y-5 sm:space-y-7 animate-fadeIn">
      {/* Top Hero & Universal Input */}
      <section
        className={`rounded-3xl border p-5 sm:p-7 shadow-xl transition-all relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-[#101014] via-[#0D0D10] to-[#0A0A0C] border-[#27272A]'
            : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 border-slate-200'
        }`}
      >
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#22C55E]">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Learn Any Topic — Personal AI Teacher
                </h1>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Any subject, beginner-to-advanced explanations, formulas A–I, 12 questions per formula, adaptive coaching, diagrams & exam drills.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className={`text-xs font-semibold px-3 py-2 rounded-xl border outline-none cursor-pointer ${
                  isDark
                    ? 'bg-[#18181B] text-white border-[#27272A] focus:border-[#22C55E]'
                    : 'bg-white text-slate-900 border-slate-300 focus:border-emerald-600'
                }`}
              >
                {EXAM_LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowProgressPanel((v) => !v)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  showProgressPanel
                    ? 'bg-[#22C55E] text-white border-[#22C55E]'
                    : isDark
                    ? 'bg-[#18181B] text-zinc-200 border-[#27272A] hover:border-[#22C55E]'
                    : 'bg-white text-slate-800 border-slate-300 hover:border-emerald-600'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Progress</span>
                <span className="font-mono opacity-80">
                  ({progressSummary.topicsCompletedCount} topics · {progressSummary.overallAccuracyPct}%)
                </span>
              </button>
            </div>
          </div>

          {/* Learning Progress & Revision Dashboard */}
          {showProgressPanel && (
            <div
              className={`rounded-2xl border p-4 space-y-4 ${
                isDark ? 'bg-[#09090B] border-[#27272A]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 border-zinc-700/20">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#22C55E]" />
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Your Learning Progress
                  </h3>
                  <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Skill Band: <strong className="text-[#22C55E]">{adaptiveProfile.skillBand}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setProgress(resetTutorProgress())}
                  className="text-xs text-zinc-400 hover:text-rose-400 cursor-pointer"
                >
                  Reset Progress
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-lg font-black text-[#22C55E]">{progressSummary.topicsCompletedCount}</div>
                  <div className="text-[11px] text-zinc-500">Topics Studied</div>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-lg font-black text-sky-400">{progressSummary.formulasPracticedCount}</div>
                  <div className="text-[11px] text-zinc-500">Formulas Practiced</div>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{progressSummary.totalAnswered}</div>
                  <div className="text-[11px] text-zinc-500">Questions Answered</div>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-lg font-black text-emerald-400">
                    {progressSummary.correctCount} / {progressSummary.incorrectCount}
                  </div>
                  <div className="text-[11px] text-zinc-500">Correct / Incorrect</div>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-lg font-black text-amber-400">{adaptiveProfile.streak}</div>
                  <div className="text-[11px] text-zinc-500">Current Streak</div>
                </div>
              </div>

              {progressSummary.topicsNeedingRevision.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-amber-500 block">
                    Topics Requiring Revision (Accuracy below 65%):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {progressSummary.topicsNeedingRevision.map((t) => (
                      <button
                        key={t.topic}
                        type="button"
                        onClick={() => {
                          setTopicInput(t.topic);
                          handleTeachMe(t.topic, t.subject);
                          setShowProgressPanel(false);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                      >
                        {t.topic} ({Math.round((t.correct / t.attempted) * 100)}%) — Revise
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {progressSummary.missedQuestions.length > 0 && lesson && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-zinc-400">
                    You have {progressSummary.missedQuestions.length} previously missed question(s) ready for review.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStudioTab('formula_practice');
                      setPracticeSourceFilter('missed');
                      setShowProgressPanel(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Repeat Missed Questions
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Subject Selector + Custom Subject Input */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SUBJECT_OPTIONS.map((sub) => {
              const active = selectedSubject === sub && !customSubject.trim();
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    setSelectedSubject(sub);
                    setCustomSubject('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#22C55E] text-white shadow-sm'
                      : isDark
                      ? 'bg-[#18181B] text-zinc-300 hover:bg-[#27272A] border border-[#27272A]'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Other subject (e.g. Accounting, Government)..."
              className={`px-3 py-1.5 rounded-xl border text-xs outline-none w-56 ${
                isDark
                  ? 'bg-[#121216] text-white border-[#27272A] focus:border-[#22C55E]'
                  : 'bg-white text-slate-900 border-slate-200 focus:border-emerald-600'
              }`}
            />
          </div>

          {/* Main Universal Input Box */}
          <div
            className={`p-2 rounded-2xl border transition-all ${
              isDark
                ? 'bg-[#000000] border-[#27272A] focus-within:border-[#22C55E]'
                : 'bg-white border-slate-300 focus-within:border-emerald-600'
            }`}
          >
            <textarea
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleTeachMe();
                }
              }}
              rows={3}
              placeholder="Enter any subject, topic, formula or question..."
              className={`w-full p-2.5 bg-transparent resize-none outline-none text-sm sm:text-base leading-relaxed ${
                isDark ? 'text-white placeholder-zinc-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-700/20 px-1">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span>Press Ctrl+Enter to start lesson</span>
                {progressSummary.totalAnswered > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#22C55E] font-semibold">
                      Adaptive Level: {adaptiveProfile.skillBand} ({adaptiveProfile.recommendedDifficulty})
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {topicInput && (
                  <button
                    type="button"
                    onClick={() => setTopicInput('')}
                    className={`text-xs px-2.5 py-1.5 rounded-lg cursor-pointer ${
                      isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleTeachMe()}
                  disabled={isLoading || !topicInput.trim()}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    isLoading || !topicInput.trim()
                      ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-60'
                      : 'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-md shadow-emerald-500/25'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Preparing Lesson...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Teach Me</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Topic Suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_TOPICS.map((sug) => (
              <button
                key={sug.title}
                type="button"
                onClick={() => {
                  setTopicInput(sug.query);
                  setSelectedSubject(sug.subject);
                  setCustomSubject('');
                  handleTeachMe(sug.query, sug.subject);
                }}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] text-zinc-300 border-[#27272A]'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {sug.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading State */}
      {isLoading && (
        <div
          className={`rounded-3xl border p-8 sm:p-12 text-center space-y-3 ${
            isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
          }`}
        >
          <Loader2 className="w-10 h-10 mx-auto text-[#22C55E] animate-spin" />
          <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Building Your Personal Masterclass Lesson...
          </h3>
          <p className={`text-xs sm:text-sm max-w-lg mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Identifying subject depth, organizing beginner-to-advanced concepts, generating A–I formula guides, worked examples, diagrams, and exam drills.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 flex items-start gap-3 text-rose-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="text-sm font-bold">Could not load lesson</h4>
            <p className="text-xs">{error}</p>
            <button
              type="button"
              onClick={handleRetryLesson}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Lesson Studio */}
      {lesson && !isLoading && (
        <div ref={lessonTopRef} className="space-y-5 animate-fadeIn">
          {/* Lesson Header + Smart Difficulty Bar */}
          <div
            className={`rounded-3xl border p-5 sm:p-6 shadow-lg space-y-4 ${
              isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="text-[#22C55E] font-bold uppercase">{lesson.subject}</span>
                  <span aria-hidden="true" className="text-zinc-500">·</span>
                  <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>{lesson.targetExamLevel}</span>
                  <span aria-hidden="true" className="text-zinc-500">·</span>
                  <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>
                    {lesson.formulas.length > 0
                      ? `${lesson.formulas.length} Core Formula(s)`
                      : `${lesson.principlesAndRules?.length || 0} Key Principle(s)`}
                  </span>
                </div>
                <h2 className={`text-xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {lesson.topic}
                </h2>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  {lesson.summary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : isDark
                      ? 'bg-[#18181B] text-zinc-300 border-[#27272A]'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                    isDark ? 'bg-[#18181B] text-zinc-300 border-[#27272A]' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>
              </div>
            </div>

            {/* Smart Adaptive Coaching Strip */}
            <div
              className={`rounded-2xl border p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                adaptiveProfile.adaptiveMode === 'simplify'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : adaptiveProfile.adaptiveMode === 'challenge'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : isDark
                  ? 'bg-[#18181D] border-[#27272A]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start gap-2.5 text-xs">
                <Flame
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    adaptiveProfile.adaptiveMode === 'simplify' ? 'text-amber-400' : 'text-[#22C55E]'
                  }`}
                />
                <div>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Smart Difficulty: {adaptiveProfile.skillBand} ({adaptiveProfile.recommendedDifficulty})
                  </span>
                  <p className={`mt-0.5 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
                    {adaptiveProfile.coachNote}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRequestAdaptation('simplify')}
                  disabled={isAdapting}
                  className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-400 text-xs font-bold cursor-pointer hover:bg-amber-500/25"
                >
                  {isAdapting ? 'Adapting...' : 'Explain Simpler'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestAdaptation('challenge')}
                  disabled={isAdapting}
                  className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 text-xs font-bold cursor-pointer hover:bg-emerald-500/25"
                >
                  Challenge Me
                </button>
              </div>
            </div>

            {adaptationResult && (
              <div
                className={`rounded-2xl border p-4 space-y-2.5 ${
                  isDark ? 'bg-black/40 border-[#22C55E]/40' : 'bg-emerald-50/40 border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#22C55E]">{adaptationResult.title}</h4>
                  <button
                    type="button"
                    onClick={() => setAdaptationResult(null)}
                    className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                  {adaptationResult.encouragement}
                </p>
                {adaptationResult.simpleAnalogy && (
                  <p className={`text-xs italic ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                    Analogy: {adaptationResult.simpleAnalogy}
                  </p>
                )}
                <div className="space-y-1 text-xs sm:text-sm">
                  {adaptationResult.stepByStepCore.map((st, idx) => (
                    <div key={idx} className={isDark ? 'text-zinc-300' : 'text-slate-700'}>
                      <MathRenderer content={`${idx + 1}. ${st}`} />
                    </div>
                  ))}
                </div>
                {adaptationResult.easyCheckQuestion && (
                  <TutorQuestionCard
                    q={{
                      id: `adapt_${Date.now()}`,
                      question: adaptationResult.easyCheckQuestion.question,
                      difficulty: 'Easy',
                      skillType: 'Adaptive Warm-Up',
                      hint: adaptationResult.easyCheckQuestion.hint,
                      steps: adaptationResult.easyCheckQuestion.steps,
                      finalAnswer: adaptationResult.easyCheckQuestion.finalAnswer,
                      expectedNumericValue:
                        adaptationResult.easyCheckQuestion.expectedNumericValue ?? undefined,
                      unit: adaptationResult.easyCheckQuestion.unit,
                    }}
                    indexNumber={1}
                    isDark={isDark}
                    onAttemptRecorded={(q, ok) => handleRecordAttempt(q, ok)}
                  />
                )}
              </div>
            )}

            {/* Studio Section Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
              {[
                { id: 'lesson', label: 'Complete Lesson', icon: BookOpen },
                {
                  id: 'formulas',
                  label:
                    lesson.formulas.length > 0
                      ? `Formulas & 12-Q Drills (${lesson.formulas.length})`
                      : 'Principles & Rules',
                  icon: Cpu,
                },
                { id: 'formula_practice', label: 'Formula Practice Mode', icon: Target },
                {
                  id: 'exam_mode',
                  label: `Exam Mode (${combinedExamQuestions.length})`,
                  icon: Award,
                },
                { id: 'visuals_tutor', label: 'Visuals & Ask Tutor', icon: Layers },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeStudioTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveStudioTab(tab.id as StudioSectionTab)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-all ${
                      active
                        ? 'bg-[#22C55E] text-white shadow-sm'
                        : isDark
                        ? 'bg-[#18181B] text-zinc-300 hover:bg-[#27272A]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: COMPLETE 11-PART TOPIC EXPLANATION + NAVIGATION */}
          {activeStudioTab === 'lesson' && (
            <div className="space-y-5">
              <div
                className={`rounded-3xl border p-5 sm:p-7 space-y-5 ${
                  isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
                }`}
              >
                {/* 1 & 2: Introduction & Simple Definition */}
                <div className="space-y-3">
                  <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    1. Topic Introduction & Simple Definition
                  </h3>
                  {lesson.simpleDefinition && (
                    <div
                      className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-medium ${
                        isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      }`}
                    >
                      <strong className="text-[#22C55E] block text-[11px] uppercase mb-1">
                        Simple Definition
                      </strong>
                      <MathRenderer content={lesson.simpleDefinition} />
                    </div>
                  )}
                  <div className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                    <MathRenderer content={lesson.introduction} />
                  </div>
                </div>

                {/* 3: Detailed Explanation (Beginner -> Advanced) */}
                {lesson.detailedExplanation.length > 0 && (
                  <div className="space-y-2.5 pt-3 border-t border-zinc-700/20">
                    <h4 className={`text-sm sm:text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      2. Step-by-Step Detailed Explanation (Beginner → Advanced)
                    </h4>
                    <div className="space-y-2.5 text-xs sm:text-sm leading-relaxed">
                      {lesson.detailedExplanation.map((para, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl ${isDark ? 'bg-white/[0.03] text-zinc-200' : 'bg-slate-50 text-slate-800'}`}
                        >
                          <MathRenderer content={para} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4 & 5: Important Concepts + Characteristics & Properties */}
                {(lesson.importantConcepts?.length || lesson.characteristicsAndProperties?.length) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-zinc-700/20">
                    {lesson.importantConcepts && lesson.importantConcepts.length > 0 && (
                      <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'}`}>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#22C55E]">
                          3. Important Concepts
                        </h4>
                        <ul className="space-y-1.5 text-xs sm:text-sm">
                          {lesson.importantConcepts.map((c, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-[#22C55E] font-bold">•</span>
                              <span className="flex-1"><MathRenderer content={c} /></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {lesson.characteristicsAndProperties && lesson.characteristicsAndProperties.length > 0 && (
                      <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'}`}>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                          4. Characteristics & Properties
                        </h4>
                        <ul className="space-y-1.5 text-xs sm:text-sm">
                          {lesson.characteristicsAndProperties.map((p, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-sky-400 font-bold">•</span>
                              <span className="flex-1"><MathRenderer content={p} /></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* 6: Types & Classifications */}
                {lesson.typesAndClassifications && lesson.typesAndClassifications.length > 0 && (
                  <div className="space-y-2.5 pt-3 border-t border-zinc-700/20">
                    <h4 className={`text-sm sm:text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      5. Types & Classifications
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {lesson.typesAndClassifications.map((t, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border space-y-1 ${
                            isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="text-xs font-bold text-[#22C55E]">{t.name}</div>
                          <div className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                            <MathRenderer content={t.description} />
                          </div>
                          {t.example && (
                            <div className="text-[11px] text-zinc-500">
                              Example: <MathRenderer content={t.example} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7: Everyday Life Examples & Real-World Analogy */}
                <div className="space-y-3 pt-3 border-t border-zinc-700/20">
                  <h4 className={`text-sm sm:text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    6. Everyday Life Examples & Real-World Analogy
                  </h4>
                  {lesson.realWorldAnalogy && (
                    <div
                      className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-950'
                      }`}
                    >
                      <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm">
                        <strong className="block text-[11px] uppercase tracking-wider text-amber-500 mb-0.5">
                          Mental Model
                        </strong>
                        <MathRenderer content={lesson.realWorldAnalogy} />
                      </div>
                    </div>
                  )}
                  {lesson.everydayExamples && lesson.everydayExamples.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {lesson.everydayExamples.map((ex, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border ${
                            isDark ? 'bg-[#141418] border-[#27272A] text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <MathRenderer content={ex} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 8, 9, 10: Common Exam Questions, Mistakes, Important Facts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-3 border-t border-zinc-700/20">
                  {lesson.commonExamQuestions && lesson.commonExamQuestions.length > 0 && (
                    <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'}`}>
                      <h4 className="text-xs font-bold uppercase text-sky-400">Common Exam Questions</h4>
                      <div className="space-y-2 text-xs">
                        {lesson.commonExamQuestions.map((ceq, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="font-semibold"><MathRenderer content={ceq.question} /></div>
                            <div className="text-[11px] text-zinc-500">{ceq.examStyle} · Key idea: {ceq.keyIdea}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {lesson.commonPitfalls.length > 0 && (
                    <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-rose-500/5 border-rose-500/25' : 'bg-rose-50 border-rose-200'}`}>
                      <h4 className="text-xs font-bold uppercase text-rose-400">Common Student Mistakes</h4>
                      <ul className="space-y-1.5 text-xs">
                        {lesson.commonPitfalls.map((pit, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-400 font-bold">!</span>
                            <span className="flex-1"><MathRenderer content={pit} /></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lesson.importantNotes.length > 0 && (
                    <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'}`}>
                      <h4 className="text-xs font-bold uppercase text-[#22C55E]">Important Facts to Remember</h4>
                      <ul className="space-y-1.5 text-xs">
                        {lesson.importantNotes.map((note, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#22C55E] font-bold">✓</span>
                            <span className="flex-1"><MathRenderer content={note} /></span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Visual Teaching Preview (Diagrams, Plotted Graphs & Concept Models) */}
                {(lesson.diagram ||
                  (lesson.graphs && lesson.graphs.length > 0) ||
                  (lesson.visualConceptModel && lesson.visualConceptModel.nodes?.length > 0)) && (
                  <div className="space-y-4 pt-3 border-t border-zinc-700/20">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm sm:text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Visual Teaching — Diagram & Graph Model
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveStudioTab('visuals_tutor')}
                        className="text-xs font-semibold text-[#22C55E] hover:underline cursor-pointer"
                      >
                        Open Full Visuals & Ask Tutor →
                      </button>
                    </div>
                    {lesson.diagram && <ScientificDiagramRenderer diagram={lesson.diagram} />}
                    {lesson.graphs && lesson.graphs.length > 0 && (
                      <InteractiveSolverGraph graphs={lesson.graphs} problemContext={lesson.topic} />
                    )}
                    {lesson.visualConceptModel && lesson.visualConceptModel.nodes?.length > 0 && (
                      <div
                        className={`rounded-2xl border p-4 space-y-2.5 ${
                          isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {lesson.visualConceptModel.title}
                          </span>
                          <span className="text-[11px] uppercase font-bold text-[#22C55E]">
                            {lesson.visualConceptModel.kind.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {lesson.visualConceptModel.nodes.map((node, nIdx) => (
                            <div
                              key={nIdx}
                              className={`p-3 rounded-xl border space-y-1 ${
                                isDark ? 'bg-black/40 border-[#27272A]' : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-bold text-[#22C55E]">
                                <span>{node.label}</span>
                                {node.symbol && <span className="font-mono text-sky-400">{node.symbol}</span>}
                              </div>
                              <div className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                                <MathRenderer content={node.detail} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 11: Topic Summary */}
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-black/40 border-[#27272A]' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="text-xs font-bold uppercase text-[#22C55E] mb-1">Topic Summary</h4>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                    <MathRenderer content={lesson.summary} />
                  </p>
                </div>

                {/* Quick Switch CTA to Formulas / Visuals */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveStudioTab('formulas')}
                    className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>
                      {lesson.formulas.length > 0
                        ? `Explore Formulas & 12 Questions Per Formula (${lesson.formulas.length})`
                        : 'Explore Key Principles & Relationships'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStudioTab('visuals_tutor')}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      isDark ? 'bg-[#18181B] text-zinc-200 border-[#27272A]' : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>View Diagrams, Graphs & Ask Tutor</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FORMULAS A–I + 12 QUESTIONS UNDER EVERY FORMULA (OR PRINCIPLES) */}
          {activeStudioTab === 'formulas' && (
            <div className="space-y-5">
              {lesson.formulas.length > 0 ? (
                lesson.formulas.map((form, fIdx) => {
                  const fKey = form.id || form.name || `f_${fIdx}`;
                  const isExpanded = expandedFormulaPractice[fKey] ?? false;
                  const isLoadingQ = formulaLoadingMap[fKey] ?? false;
                  const qError = formulaErrorMap[fKey] ?? '';
                  const fQuestions = form.questions || [];
                  const selectedDiff = formulaDiffFilter[fKey] || 'All';
                  const filteredQs =
                    selectedDiff === 'All'
                      ? fQuestions
                      : fQuestions.filter((q) => q.difficulty === selectedDiff);

                  return (
                    <div
                      key={fKey}
                      className={`rounded-3xl border p-5 sm:p-6 space-y-5 ${
                        isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* A. Formula Name & Practice Mode Jump */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 border-zinc-700/20">
                        <div>
                          <span className="text-[11px] font-bold uppercase text-[#22C55E]">
                            Formula {fIdx + 1} of {lesson.formulas.length}
                          </span>
                          <h3 className={`text-base sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {form.name}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPracticeFormulaIdx(fIdx);
                            setPracticeSourceFilter('formula');
                            setActiveStudioTab('formula_practice');
                            if (!form.questions || form.questions.length === 0) {
                              loadQuestionsForFormula(lesson, fIdx, false);
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-[#22C55E] text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-500/25"
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>Practice This Formula</span>
                        </button>
                      </div>

                      {/* B. Correct Mathematical Expression */}
                      <div
                        className={`p-4 rounded-2xl text-center overflow-x-auto ${
                          isDark ? 'bg-black/60 border border-white/10' : 'bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <MathRenderer content={form.latex} displayMode={true} />
                      </div>

                      {/* C & D. Meaning of Every Symbol & SI Units */}
                      {form.symbols && form.symbols.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className={`border-b ${isDark ? 'border-[#27272A] text-zinc-400' : 'border-slate-200 text-slate-600'}`}>
                                <th className="py-2 px-3 font-bold">Symbol</th>
                                <th className="py-2 px-3 font-bold">Meaning</th>
                                <th className="py-2 px-3 font-bold">SI Unit</th>
                                {form.symbols.some((s) => s.standardValue) && (
                                  <th className="py-2 px-3 font-bold">Standard Value</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-700/20">
                              {form.symbols.map((sym, sIdx) => (
                                <tr key={sIdx} className={isDark ? 'text-zinc-200' : 'text-slate-800'}>
                                  <td className="py-2 px-3 font-mono font-bold text-[#22C55E]">
                                    <MathRenderer content={sym.symbol} />
                                  </td>
                                  <td className="py-2 px-3">{sym.meaning}</td>
                                  <td className="py-2 px-3 font-mono font-semibold text-sky-400">{sym.siUnit}</td>
                                  {form.symbols.some((s) => s.standardValue) && (
                                    <td className="py-2 px-3 font-mono text-amber-400">{sym.standardValue || '—'}</td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* E & F. When to Use & Conditions Under Which It Applies */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-sky-500/10 border-sky-500/25 text-sky-100' : 'bg-sky-50 border-sky-200 text-sky-950'}`}>
                          <strong className="block text-[11px] uppercase text-sky-400 mb-1">
                            When to Use This Formula
                          </strong>
                          <MathRenderer content={form.whenToUse} />
                        </div>
                        <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-amber-500/10 border-amber-500/25 text-amber-100' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                          <strong className="block text-[11px] uppercase text-amber-400 mb-1">
                            Conditions & Validity Limits
                          </strong>
                          <MathRenderer content={form.conditions || 'Ensure all units are converted consistently into SI units before substitution.'} />
                        </div>
                      </div>

                      {/* G, H, I. Simple, Intermediate & Difficult Worked Examples */}
                      {form.workedExamplesByLevel && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Progressive Worked Examples (Simple · Intermediate · Difficult)
                          </h4>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            {form.workedExamplesByLevel.simple &&
                              renderWorkedExampleBlock(form.workedExamplesByLevel.simple, 'Simple Example')}
                            {form.workedExamplesByLevel.intermediate &&
                              renderWorkedExampleBlock(form.workedExamplesByLevel.intermediate, 'Intermediate Example')}
                            {form.workedExamplesByLevel.difficult &&
                              renderWorkedExampleBlock(form.workedExamplesByLevel.difficult, 'Difficult Example')}
                          </div>
                        </div>
                      )}

                      {/* Section 4: 12 Diverse Practice Questions Under THIS Formula */}
                      <div className="pt-2 border-t border-zinc-700/25 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              Practice Questions Under This Formula ({fQuestions.length || 12})
                            </h4>
                            <p className="text-[11px] text-zinc-500">
                              3 Easy · 3 Intermediate · 3 Difficult · 3 Examination-Standard (across substitution, rearrangement, identification, unit conversion, real-life & multi-step)
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {fQuestions.length > 0 && (
                              <button
                                type="button"
                                onClick={() => loadQuestionsForFormula(lesson, fIdx, true)}
                                disabled={isLoadingQ}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                                  isDark ? 'bg-[#18181B] text-zinc-300 border-[#27272A]' : 'bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                <RefreshCw className={`w-3 h-3 ${isLoadingQ ? 'animate-spin' : ''}`} />
                                <span>Fresh 12</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const nextState = !isExpanded;
                                setExpandedFormulaPractice((prev) => ({ ...prev, [fKey]: nextState }));
                                if (nextState && fQuestions.length === 0 && !isLoadingQ) {
                                  loadQuestionsForFormula(lesson, fIdx, false);
                                }
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-[#22C55E] text-white text-xs font-bold cursor-pointer"
                            >
                              {isExpanded
                                ? 'Collapse Questions'
                                : fQuestions.length > 0
                                ? `Show ${fQuestions.length} Questions`
                                : 'Load 12 Formula Questions'}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="space-y-3">
                            {isLoadingQ && (
                              <div className="p-6 rounded-2xl border border-[#27272A] flex items-center justify-center gap-2 text-xs text-zinc-400">
                                <Loader2 className="w-4 h-4 animate-spin text-[#22C55E]" />
                                <span>Generating 12 non-repetitive questions & verifying calculations for {form.name}...</span>
                              </div>
                            )}

                            {qError && !isLoadingQ && (
                              <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs text-rose-400 flex items-center justify-between gap-2">
                                <span>{qError}</span>
                                <button
                                  type="button"
                                  onClick={() => loadQuestionsForFormula(lesson, fIdx, true)}
                                  className="px-3 py-1 rounded-lg bg-rose-500 text-white font-bold cursor-pointer"
                                >
                                  Retry
                                </button>
                              </div>
                            )}

                            {!isLoadingQ && fQuestions.length > 0 && (
                              <>
                                {/* Difficulty Filter Row */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {['All', 'Easy', 'Intermediate', 'Difficult', 'Examination-Standard'].map((lvl) => (
                                    <button
                                      key={lvl}
                                      type="button"
                                      onClick={() => setFormulaDiffFilter((prev) => ({ ...prev, [fKey]: lvl }))}
                                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                        selectedDiff === lvl
                                          ? 'bg-[#22C55E] text-white'
                                          : isDark
                                          ? 'bg-[#18181B] text-zinc-300 border border-[#27272A]'
                                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                                      }`}
                                    >
                                      {lvl}
                                    </button>
                                  ))}
                                </div>

                                <div className="space-y-3">
                                  {filteredQs.map((fq, qIdx) => (
                                    <TutorQuestionCard
                                      key={fq.id || qIdx}
                                      q={mapFormulaQuestion(fq)}
                                      indexNumber={qIdx + 1}
                                      isDark={isDark}
                                      onAttemptRecorded={(uq, ok) => handleRecordAttempt(uq, ok, form.name)}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Non-Formula Subject Principles, Rules & Relationships */
                <div
                  className={`rounded-3xl border p-5 sm:p-7 space-y-4 ${
                    isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
                  }`}
                >
                  <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Core Rules, Principles & Key Relationships
                  </h3>
                  {lesson.principlesAndRules && lesson.principlesAndRules.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lesson.principlesAndRules.map((pr, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border space-y-2 ${
                            isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="text-sm font-bold text-[#22C55E]">{pr.title}</div>
                          <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                            <MathRenderer content={pr.statement} />
                          </p>
                          <div className="text-xs text-zinc-400">
                            <strong>When it applies:</strong> {pr.whenApplies}
                          </div>
                          <div className="text-xs text-zinc-400">
                            <strong>Key Relationship:</strong> {pr.keyRelationship}
                          </div>
                          <div className="text-xs text-amber-400">
                            <strong>Example:</strong> {pr.everydayExample}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-zinc-400">
                      This topic is primarily conceptual rather than formula-driven. Review the Complete Lesson concepts or test yourself in Exam Mode.
                    </p>
                  )}

                  {/* Also render general practice questions for non-formula topics */}
                  {lesson.practiceQuestions.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-zinc-700/20">
                      <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Interactive Practice Questions
                      </h4>
                      {lesson.practiceQuestions.map((pq, i) => (
                        <TutorQuestionCard
                          key={pq.id || i}
                          q={{
                            id: pq.id,
                            question: pq.question,
                            difficulty: pq.difficulty,
                            hint: pq.hint,
                            formulaUsed: pq.formulaUsed,
                            whyThisFormula: pq.whyThisFormula,
                            steps: pq.solution,
                            finalAnswer: pq.finalAnswer,
                            expectedNumericValue: pq.expectedNumericValue,
                            unit: pq.unit,
                          }}
                          indexNumber={i + 1}
                          isDark={isDark}
                          onAttemptRecorded={(uq, ok) => handleRecordAttempt(uq, ok)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEDICATED FORMULA PRACTICE MODE */}
          {activeStudioTab === 'formula_practice' && (
            <div
              className={`rounded-3xl border p-5 sm:p-7 space-y-5 ${
                isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3 border-zinc-700/20">
                <div>
                  <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Dedicated Formula Practice Mode
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Master one formula at a time, check numerical answers, generate fresh variations, and repeat missed questions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPracticeSourceFilter('formula')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      practiceSourceFilter === 'formula'
                        ? 'bg-[#22C55E] text-white'
                        : isDark
                        ? 'bg-[#18181B] text-zinc-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Formula Drills
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticeSourceFilter('missed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      practiceSourceFilter === 'missed'
                        ? 'bg-amber-500 text-white'
                        : isDark
                        ? 'bg-[#18181B] text-zinc-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Repeat Missed ({progressSummary.missedQuestions.length})
                  </button>
                </div>
              </div>

              {practiceSourceFilter === 'missed' ? (
                progressSummary.missedQuestions.length === 0 ? (
                  <div className="p-8 text-center text-xs sm:text-sm text-zinc-400">
                    No incorrect questions waiting for review—nice work! Answer questions in Formula Drills or Exam Mode to build your personal revision queue.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {progressSummary.missedQuestions.map((mq, idx) => (
                      <TutorQuestionCard
                        key={mq.id}
                        q={{
                          id: mq.id,
                          question: mq.question,
                          difficulty: mq.difficulty,
                          skillType: mq.formulaName ? `Formula: ${mq.formulaName}` : mq.topic,
                          hint: mq.hint,
                          formulaUsed: mq.formulaUsed,
                          whyThisFormula: mq.whyThisFormula,
                          steps: mq.steps || [],
                          finalAnswer: mq.finalAnswer || '',
                          expectedNumericValue: mq.expectedNumericValue,
                          unit: mq.unit,
                        }}
                        indexNumber={idx + 1}
                        isDark={isDark}
                        onAttemptRecorded={(uq, ok) => handleRecordAttempt(uq, ok, mq.formulaName)}
                      />
                    ))}
                  </div>
                )
              ) : lesson.formulas.length === 0 ? (
                <div className="p-8 text-center text-xs sm:text-sm text-zinc-400">
                  This topic does not use mathematical formulas. Try Examination Mode or Ask Tutor!
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select Formula & Difficulty */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={practiceFormulaIdx}
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        setPracticeFormulaIdx(idx);
                        if (!lesson.formulas[idx]?.questions?.length) {
                          loadQuestionsForFormula(lesson, idx, false);
                        }
                      }}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border outline-none cursor-pointer ${
                        isDark ? 'bg-[#18181B] text-white border-[#27272A]' : 'bg-white text-slate-900 border-slate-300'
                      }`}
                    >
                      {lesson.formulas.map((f, i) => (
                        <option key={i} value={i}>
                          Formula {i + 1}: {f.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={practiceDiff}
                      onChange={(e) => setPracticeDiff(e.target.value as any)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border outline-none cursor-pointer ${
                        isDark ? 'bg-[#18181B] text-white border-[#27272A]' : 'bg-white text-slate-900 border-slate-300'
                      }`}
                    >
                      <option value="All">All Difficulties (12)</option>
                      <option value="Easy">Easy Only (3)</option>
                      <option value="Intermediate">Intermediate Only (3)</option>
                      <option value="Difficult">Difficult Only (3)</option>
                      <option value="Examination-Standard">Exam-Standard Only (3)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => loadQuestionsForFormula(lesson, practiceFormulaIdx, true)}
                      disabled={
                        formulaLoadingMap[
                          activePracticeFormula?.id || activePracticeFormula?.name || `f_${practiceFormulaIdx}`
                        ]
                      }
                      className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Generate Fresh Questions</span>
                    </button>
                  </div>

                  {activePracticeFormula && (
                    <div
                      className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                        isDark ? 'bg-black/40 border-[#27272A]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <MathRenderer content={activePracticeFormula.latex} displayMode={false} />
                      <span className="text-[11px] text-zinc-400">{activePracticeFormula.whenToUse}</span>
                    </div>
                  )}

                  {activePracticeFormula &&
                  formulaLoadingMap[
                    activePracticeFormula.id || activePracticeFormula.name || `f_${practiceFormulaIdx}`
                  ] ? (
                    <div className="p-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#22C55E]" />
                      <span>Generating fresh non-repetitive questions for {activePracticeFormula.name}...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(activePracticeFormula?.questions || [])
                        .filter((q) => practiceDiff === 'All' || q.difficulty === practiceDiff)
                        .map((fq, idx) => (
                          <TutorQuestionCard
                            key={fq.id || idx}
                            q={mapFormulaQuestion(fq)}
                            indexNumber={idx + 1}
                            isDark={isDark}
                            onAttemptRecorded={(uq, ok) =>
                              handleRecordAttempt(uq, ok, activePracticeFormula?.name)
                            }
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXAMINATION MODE (JAMB, WAEC, JUPEB — VERIFIED VS AI CLEARLY LABELED) */}
          {activeStudioTab === 'exam_mode' && (
            <div
              className={`rounded-3xl border p-5 sm:p-7 space-y-5 ${
                isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3 border-zinc-700/20">
                <div>
                  <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Examination Mode (JAMB · WAEC · JUPEB)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Verified curated archive past questions are strictly labeled separately from AI-generated practice questions.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(['All', 'JAMB', 'WAEC', 'JUPEB'] as const).map((body) => (
                    <button
                      key={body}
                      type="button"
                      onClick={() => setExamBodyFilter(body)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        examBodyFilter === body
                          ? 'bg-[#22C55E] text-white'
                          : isDark
                          ? 'bg-[#18181B] text-zinc-300 border border-[#27272A]'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {body}
                    </button>
                  ))}

                  <select
                    value={examTypeFilter}
                    onChange={(e) => setExamTypeFilter(e.target.value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border outline-none cursor-pointer ${
                      isDark ? 'bg-[#18181B] text-white border-[#27272A]' : 'bg-white text-slate-900 border-slate-300'
                    }`}
                  >
                    <option value="All">All Question Types</option>
                    <option value="Multiple-Choice">Multiple-Choice</option>
                    <option value="Theory">Theory</option>
                    <option value="Calculation">Calculation</option>
                    <option value="Conceptual">Conceptual</option>
                    <option value="Application">Application</option>
                  </select>
                </div>
              </div>

              {combinedExamQuestions.length === 0 ? (
                <div className="p-8 text-center text-xs sm:text-sm text-zinc-400">
                  No questions matched that exam filter. Choose "All" to view all JAMB, WAEC, and JUPEB items.
                </div>
              ) : (
                <div className="space-y-3">
                  {combinedExamQuestions.map((eq, idx) => (
                    <TutorQuestionCard
                      key={eq.id || idx}
                      q={eq}
                      indexNumber={idx + 1}
                      isDark={isDark}
                      onAttemptRecorded={(uq, ok) => handleRecordAttempt(uq, ok)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: VISUAL TEACHING, TABLES & 1-ON-1 ASK TUTOR */}
          {activeStudioTab === 'visuals_tutor' && (
            <div className="space-y-5">
              {/* Visual Diagrams, Graphs & Reaction/Process Concept Models */}
              {(lesson.diagram ||
                (lesson.graphs && lesson.graphs.length > 0) ||
                lesson.visualConceptModel ||
                (lesson.tables && lesson.tables.length > 0)) && (
                <div
                  className={`rounded-3xl border p-5 sm:p-7 space-y-6 ${
                    isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
                  }`}
                >
                  <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Visual Diagrams, Graphs & Reference Models
                  </h3>

                  {lesson.diagram && <ScientificDiagramRenderer diagram={lesson.diagram} />}

                  {lesson.graphs && lesson.graphs.length > 0 && (
                    <InteractiveSolverGraph graphs={lesson.graphs} problemContext={lesson.topic} />
                  )}

                  {lesson.visualConceptModel && lesson.visualConceptModel.nodes?.length > 0 && (
                    <div
                      className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                        isDark ? 'bg-[#141418] border-[#27272A]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {lesson.visualConceptModel.title}
                        </h4>
                        <span className="text-[11px] uppercase font-bold text-[#22C55E]">
                          {lesson.visualConceptModel.kind.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {lesson.visualConceptModel.nodes.map((node, nIdx) => (
                          <div
                            key={nIdx}
                            className={`p-3 rounded-xl border relative space-y-1 ${
                              isDark ? 'bg-black/40 border-[#27272A]' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-[#22C55E]">
                              <span>{node.label}</span>
                              {node.symbol && <span className="font-mono text-sky-400">{node.symbol}</span>}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                              <MathRenderer content={node.detail} />
                            </div>
                          </div>
                        ))}
                      </div>
                      {lesson.visualConceptModel.caption && (
                        <p className="text-xs text-zinc-500">{lesson.visualConceptModel.caption}</p>
                      )}
                    </div>
                  )}

                  {lesson.tables &&
                    lesson.tables.map((tbl, tIdx) => (
                      <div key={tIdx} className="space-y-2">
                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {tbl.title}
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs sm:text-sm border-collapse">
                            <thead>
                              <tr className={`border-b ${isDark ? 'border-[#27272A] bg-[#18181B]' : 'border-slate-200 bg-slate-100'}`}>
                                {tbl.headers.map((h, i) => (
                                  <th key={i} className="py-2 px-3 font-bold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-700/20">
                              {tbl.rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="py-2 px-3">
                                      <MathRenderer content={cell} />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 1-on-1 Conversational AI Tutor Follow-Up */}
              <div
                className={`rounded-3xl border p-5 sm:p-7 space-y-4 ${
                  isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-3 border-zinc-700/20">
                  <div className="flex items-center gap-2 text-[#22C55E]">
                    <MessageSquare className="w-5 h-5" />
                    <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Ask Your Personal AI Teacher
                    </h3>
                  </div>
                  <span className="text-xs text-[#22C55E] font-semibold">Live Lesson Context</span>
                </div>

                {lesson.suggestedFollowUps && lesson.suggestedFollowUps.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {lesson.suggestedFollowUps.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleFollowUpSubmit(chip)}
                        className={`text-xs px-3 py-1.5 rounded-xl border text-left cursor-pointer ${
                          isDark
                            ? 'bg-[#18181D] hover:bg-[#27272A] text-zinc-300 border-[#27272A]'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                {followUpHistory.length > 0 && (
                  <div className="space-y-3 pt-2 max-h-96 overflow-y-auto pr-1">
                    {followUpHistory.map((item, idx) => (
                      <div key={idx} className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm ${
                            item.role === 'user'
                              ? 'bg-[#22C55E] text-white'
                              : isDark
                              ? 'bg-[#18181D] text-zinc-200 border border-[#27272A]'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          <div className="text-[10px] font-bold opacity-75 mb-1">
                            {item.role === 'user' ? 'You' : 'AI Teacher'}
                          </div>
                          <MathRenderer content={item.text} />
                        </div>
                      </div>
                    ))}
                    {isFollowUpLoading && (
                      <div className="flex items-center gap-2 text-xs text-[#22C55E]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Teacher is writing out the explanation...</span>
                      </div>
                    )}
                    <div ref={followUpBottomRef} />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFollowUpSubmit();
                      }
                    }}
                    placeholder={`Ask any follow-up about ${lesson.topic}...`}
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none ${
                      isDark
                        ? 'bg-[#000000] text-white border-[#27272A] focus:border-[#22C55E]'
                        : 'bg-white text-slate-900 border-slate-300 focus:border-emerald-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleFollowUpSubmit()}
                    disabled={isFollowUpLoading || !followUpQuestion.trim()}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer ${
                      isFollowUpLoading || !followUpQuestion.trim()
                        ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-60'
                        : 'bg-[#22C55E] hover:bg-[#16A34A] text-white'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 11: Smart Topic Navigation (Always Visible Beneath Active Lesson) */}
          {lesson.topicNavigation && (
            <section
              className={`rounded-3xl border p-5 sm:p-6 space-y-4 ${
                isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-[#22C55E]">
                <Compass className="w-5 h-5" />
                <h3 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Smart Topic Navigation — Where to Go Next
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <span className="font-bold uppercase text-zinc-400 block">Prerequisite Topics</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(lesson.topicNavigation.prerequisites || []).map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setTopicInput(t);
                          handleTeachMe(t, lesson.subject);
                        }}
                        className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                          isDark ? 'bg-[#18181D] border-[#27272A] text-zinc-200 hover:border-[#22C55E]' : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-emerald-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold uppercase text-sky-400 block">Related Topics</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(lesson.topicNavigation.relatedTopics || []).map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setTopicInput(t);
                          handleTeachMe(t, lesson.subject);
                        }}
                        className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                          isDark ? 'bg-[#18181D] border-[#27272A] text-zinc-200 hover:border-sky-400' : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-sky-500'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-bold uppercase text-amber-400 block">More Advanced Topics</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(lesson.topicNavigation.advancedTopics || []).map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setTopicInput(t);
                          handleTeachMe(t, lesson.subject);
                        }}
                        className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                          isDark ? 'bg-[#18181D] border-[#27272A] text-zinc-200 hover:border-amber-400' : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-amber-500'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {lesson.topicNavigation.keyFormulasToMaster?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-700/20 text-xs">
                  <span className="font-bold text-zinc-400">Formulas to Master:</span>
                  {lesson.topicNavigation.keyFormulasToMaster.map((fn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const matchIdx = lesson.formulas.findIndex((f) =>
                          f.name.toLowerCase().includes(fn.toLowerCase()) ||
                          fn.toLowerCase().includes(f.name.toLowerCase())
                        );
                        setPracticeFormulaIdx(matchIdx >= 0 ? matchIdx : 0);
                        setPracticeSourceFilter('formula');
                        setActiveStudioTab('formula_practice');
                      }}
                      className="text-[#22C55E] font-semibold hover:underline cursor-pointer"
                    >
                      {fn} →
                    </button>
                  ))}
                </div>
              )}

              {lesson.topicNavigation.recommendedNextStep && (
                <div className="text-xs text-zinc-400 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                  <span>
                    <strong className={isDark ? 'text-zinc-200' : 'text-slate-800'}>Recommended Next Step:</strong>{' '}
                    {lesson.topicNavigation.recommendedNextStep}
                  </span>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Saved / Previously Studied Lessons */}
      {savedLessons.length > 0 && !isLoading && (
        <section
          className={`rounded-3xl border p-5 sm:p-6 space-y-3 ${
            isDark ? 'bg-[#0E0E12] border-[#27272A]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#22C55E]" />
            <h4 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Recent Studied Topics ({savedLessons.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {savedLessons.slice(0, 6).map((saved, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setLesson(saved);
                  setTopicInput(saved.topic);
                  setActiveStudioTab('lesson');
                  setTimeout(() => {
                    lessonTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isDark
                    ? 'bg-[#18181D] hover:bg-[#27272A] border-[#27272A] text-zinc-300 hover:text-white'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div>
                  <span className="text-[10px] font-black uppercase text-[#22C55E]">
                    {saved.subject}
                  </span>
                  <h5 className="text-xs font-bold line-clamp-1 mt-0.5">{saved.topic}</h5>
                  <p className="text-[11px] opacity-70 line-clamp-2 mt-0.5">{saved.summary}</p>
                </div>
                <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                  {saved.timestamp ? new Date(saved.timestamp).toLocaleDateString() : ''}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
