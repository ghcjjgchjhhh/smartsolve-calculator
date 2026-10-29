import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  ArrowLeft,
  X,
  Layers,
  Pause,
  Play,
} from 'lucide-react';

import { generateProceduralQuestion } from '../services/proceduralExamGenerator';

interface JambPracticeViewProps {
  onOpenInGemini?: (prompt: string, subject?: string) => void;
}

export const TOPIC_PRESETS: Record<string, string[]> = {
  Mathematics: [
    'Calculus (Differentiation & Integration)',
    'Quadratic Equations & Polynomials',
    'Trigonometry & Bearing',
    'Indices, Logarithms & Surds',
    'Matrices & Determinants',
    'Sequences & Series (AP & GP)',
    'Coordinate Geometry & Circle',
    'Statistics & Probability',
    'Vectors & 3D Geometry',
    'Commercial Arithmetic & Percentages',
  ],
  Physics: [
    'Projectiles & Equations of Motion',
    "Newton's Laws, Momentum & Impulse",
    'Work, Energy, Power & Friction',
    "Current Electricity & Ohm's Law",
    'Electromagnetic Induction & Transformers',
    'Waves, Sound & Light Optics',
    'Thermal Physics, Heat & Gas Laws',
    'Atomic, Nuclear & Photoelectric Physics',
    'Gravitational & Electric Fields',
    'Simple Harmonic Motion (SHM)',
  ],
  Chemistry: [
    'Mole Concept & Stoichiometry',
    'Gas Laws & Kinetic Theory',
    'Atomic Structure & Periodicity',
    'Chemical Bonding & Hybridization',
    'Acids, Bases & Salts (pH & Titration)',
    'Electrochemistry, Redox & Faraday Laws',
    'Chemical Equilibrium & Le Chatelier',
    'Thermochemistry & Enthalpy of Reaction',
    'Organic Chemistry & Hydrocarbons',
    'Qualitative Analysis & Salt Tests',
  ],
  Biology: [
    'Cell Biology & Organelles',
    'Genetics, Heredity & DNA',
    'Ecology, Ecosystems & Biomes',
    'Plant Physiology & Photosynthesis',
    'Human Circulatory & Digestive Systems',
    'Nervous System & Sense Organs',
    'Evolution & Natural Selection',
    'Reproduction & Embryology',
    'Microorganisms & Infectious Diseases',
  ],
  English: [
    'Lexis & Structure',
    'Concord & Subject-Verb Agreement',
    'Idioms & Figurative Expressions',
    'Antonyms & Synonyms',
    'Sentence Completion & Fillers',
    'Reading Comprehension & Analysis',
    'Oral English, Stress & Vowel Patterns',
    'Prepositions & Phrasal Verbs',
  ],
  Literature: [
    'Literary Appreciation & Figures of Speech',
    'African Prose (Achebe, Soyinka, Emecheta)',
    'Non-African Prose & Classical Novels',
    'African Poetry (Structure, Tone & Imagery)',
    'Non-African Poetry & Romantic Verses',
    'African Drama & Traditional Spectacle',
    'Shakespearean Drama & Tragic Flaws (Hamartia)',
    'Unseen Prose & Poetry Analysis',
    'Literary Terms (Irony, Satire, Soliloquy, Metaphor)',
  ],
  Economics: [
    'Theory of Demand & Supply and Price Determination',
    'Elasticity of Demand & Supply (Price, Income & Cross)',
    'Theory of Consumer Behaviour & Utility',
    'Theory of Production & Law of Diminishing Returns',
    'Cost & Revenue Analysis (TC, MC, AC, MR)',
    'Market Structures (Perfect Competition, Monopoly, Oligopoly)',
    'National Income Accounting (GDP, GNP, NNP & Multiplier)',
    'Money, Banking & Central Bank Monetary Policy',
    'Inflation, Deflation & Unemployment in Nigeria',
    'Public Finance, Taxation & Government Budget',
    'International Trade & Balance of Payments (BOP)',
    'Petroleum & The Nigerian Economy',
  ],
  Government: [
    'Basic Concepts of Government & Rule of Law',
    'Constitutional Developments in Nigeria (1922-1999)',
    'Federalism, Decentralization & State Creation',
    'Arms of Government: Legislature, Executive & Judiciary',
    'Political Parties, Pressure Groups & Electoral Systems',
    'Public Administration & Civil Service Reforms',
    'Nigeria Foreign Policy & International Organizations (ECOWAS, AU, UN)',
    'Local Government Administration in Nigeria',
  ],
  Commerce: [
    'Introduction to Commerce, Trade & Aids to Trade',
    'Home Trade (Wholesale & Retail Distributions)',
    'Foreign Trade, Export, Import & Customs',
    'Banking, Financial Institutions & Capital Markets',
    'Insurance & Principles of Indemnity',
    'Advertising, Sales Promotion & Consumer Protection',
  ],
  Accounting: [
    'Principles of Double Entry & Ledger Accounts',
    'Cash Book, Petty Cash & Bank Reconciliation',
    'Trial Balance & Correction of Errors',
    'Final Accounts of Sole Trader (Trading, P&L, Balance Sheet)',
    'Partnership Accounts (Appropriation & Goodwill)',
    'Company Accounts, Shares & Debentures',
    'Manufacturing Accounts & Production Costs',
  ],
  'Agricultural Science': [
    'Basic Concepts, Soil Formation & Fertility',
    'Crop Production, Agronomy & Pest Control',
    'Animal Science, Nutrition & Livestock Diseases',
    'Agricultural Economics & Extension Services',
    'Farm Mechanization, Surveying & Irrigation',
  ],
  Geography: [
    'Earth Surface, Rotation, Revolution & Latitudes/Longitudes',
    'Rocks, Weathering & Landforms',
    'Climatology, Weather Elements & Vegetation Zones',
    'Map Reading, Contours & Scale Interpretation',
    'Economic Geography of Nigeria & Mineral Resources',
  ],
  'Computer Studies': [
    'Computer Hardware, Architecture & Logic Gates',
    'System Software, Operating Systems & File Management',
    'Data Processing, Number Systems & Binary Conversions',
    'Networking, Internet & Cyber Security',
    'Algorithms, Flowcharts & Programming Concepts',
  ],
  CRS: [
    'Sovereignty of God & Creation',
    'Leadership Qualities (Moses, Joshua, Deborah, Gideon)',
    'The Early Life, Ministry & Teachings of Jesus Christ',
    'Passion, Death, Resurrection & Ascension of Christ',
    'Fellowship in the Early Church & Mission of Paul',
  ],
  IRS: [
    'Tawheed (Faith & Oneness of Allah)',
    'The Holy Quran: Revelation, Preservation & Exegesis',
    'Hadith: Authenticity, Six Canonical Books & Sunnah',
    'Fiqh (Islamic Jurisprudence): Taharah, Salat, Zakat & Hajj',
    'Sirah (Life of Prophet Muhammad SAW in Makkah & Madinah)',
  ],
  'Civic Education': [
    'Values, Moral Obligations & Youth Empowerment',
    'Human Rights, Universal Declaration of Human Rights (UDHR)',
    'Democracy, Rule of Law & Citizen Participation',
    'Combating Social Vices (Cultism, Drug Abuse, Human Trafficking)',
    'Structure of Governance & National Consciousness in Nigeria',
  ],
};

const CBT_STORAGE_KEY = 'smartsolve_cbt_session_v3';

interface CbtPersistedSession {
  activeMode?: 'ai_exam' | 'bank';
  examType?: 'JAMB/UTME' | 'WAEC/WASSCE' | 'JUPEB' | 'University Practice';
  courseDuration?: number;
  alwaysShowDerivations?: boolean;
  aiSubject?: 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'English' | 'Literature' | 'Economics' | string;
  isCustomSubject?: boolean;
  customSubjectName?: string;
  levelClass?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  aiTopic?: string;
  aiCount?: number;
  subjectFilter?: 'All' | 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'English' | 'Literature' | 'Economics' | string;
  aiQuestions?: JambQuestion[];
  currentIndex?: number;
  selectedAnswers?: Record<string, 'A' | 'B' | 'C' | 'D'>;
  showSolution?: Record<string, boolean>;
  examSubmitted?: boolean;
  showResultsModal?: boolean;
  resultsFilter?: 'all' | 'wrong' | 'correct';
  studyMode?: boolean;
  initialDuration?: number;
  timeLeft?: number;
  isTimerRunning?: boolean;
  lastSavedTimestamp?: number;
}

const loadPersistedCbtSession = (): CbtPersistedSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CBT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const JambPracticeView: React.FC<JambPracticeViewProps> = ({ onOpenInGemini }) => {
  const topicPresets = TOPIC_PRESETS;
  const initialSession = useRef(loadPersistedCbtSession()).current;

  // Mode: AI Custom Exam Generator vs Standard Questions Bank (Restored from localStorage)
  const [activeMode, setActiveMode] = useState<'ai_exam' | 'bank'>(
    () => initialSession?.activeMode || 'ai_exam'
  );

  // Exam Configuration Settings (Flow: Exam -> Subject -> Level/Class -> Topic -> Difficulty -> Number of Questions)
  const [examType, setExamType] = useState<'JAMB/UTME' | 'WAEC/WASSCE' | 'JUPEB' | 'University Practice'>(
    () => initialSession?.examType || 'JAMB/UTME'
  );
  const [courseDuration, setCourseDuration] = useState<number>(
    () => initialSession?.courseDuration || 4
  );
  const [alwaysShowDerivations, setAlwaysShowDerivations] = useState<boolean>(
    () => Boolean(initialSession?.alwaysShowDerivations)
  );
  const [aiSubject, setAiSubject] = useState<'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'English' | 'Literature' | 'Economics' | string>(
    () => initialSession?.aiSubject || 'Mathematics'
  );
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(
    () => Boolean(initialSession?.isCustomSubject)
  );
  const [customSubjectName, setCustomSubjectName] = useState<string>(
    () => initialSession?.customSubjectName || ''
  );
  const [levelClass, setLevelClass] = useState<string>(
    () => initialSession?.levelClass || 'UTME Candidate'
  );
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Very Hard'>(
    () => initialSession?.difficulty || 'Medium'
  );
  const [aiTopic, setAiTopic] = useState<string>(
    () => initialSession?.aiTopic || 'Calculus (Differentiation & Integration)'
  );
  const [aiCount, setAiCount] = useState<number>(
    () => (typeof initialSession?.aiCount === 'number' ? initialSession.aiCount : 10)
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [aiQuestions, setAiQuestions] = useState<JambQuestion[]>(
    () => (Array.isArray(initialSession?.aiQuestions) ? initialSession.aiQuestions : [])
  );

  // Effective Subject Name (evaluates typed custom subject or selected standard subject)
  const effectiveSubject = (isCustomSubject && customSubjectName.trim() ? customSubjectName.trim() : aiSubject).trim() || 'Mathematics';

  // Bank Filter
  const [subjectFilter, setSubjectFilter] = useState<'All' | 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'English' | 'Literature' | 'Economics' | string>(
    () => (initialSession?.subjectFilter as any) || 'All'
  );

  // Helper for available levels per examination target (supports course duration: 100L - 600L)
  const getLevelsForExam = (exam: string, duration: number = 4): string[] => {
    switch (exam) {
      case 'University Practice':
        if (duration === 6) {
          return ['100L (100 Level)', '200L (200 Level)', '300L (300 Level)', '400L (400 Level)', '500L (500 Level)', '600L (600 Level)'];
        }
        if (duration === 5) {
          return ['100L (100 Level)', '200L (200 Level)', '300L (300 Level)', '400L (400 Level)', '500L (500 Level)'];
        }
        return ['100L (100 Level)', '200L (200 Level)', '300L (300 Level)', '400L (400 Level)'];
      case 'WAEC/WASSCE':
        return ['SS1 (Senior Secondary 1)', 'SS2 (Senior Secondary 2)', 'SS3 (Senior Secondary 3)'];
      case 'JUPEB':
        return ['JUPEB Foundation Year (100L Direct Entry)', 'JUPEB Advanced Level (A-Level)'];
      case 'JAMB/UTME':
      default:
        return ['UTME Candidate', 'Pre-Degree / Post-UTME Preparatory'];
    }
  };

  const handleExamChange = (newExam: 'JAMB/UTME' | 'WAEC/WASSCE' | 'JUPEB' | 'University Practice') => {
    setExamType(newExam);
    const levels = getLevelsForExam(newExam, courseDuration);
    setLevelClass(levels[0]);
  };

  const handleCourseDurationChange = (newDuration: number) => {
    setCourseDuration(newDuration);
    const levels = getLevelsForExam(examType, newDuration);
    if (!levels.includes(levelClass)) {
      setLevelClass(levels[0]);
    }
  };

  const handleSubjectChange = (newSubject: string) => {
    if (newSubject === 'CUSTOM') {
      setIsCustomSubject(true);
      return;
    }
    setIsCustomSubject(false);
    setAiSubject(newSubject as any);
    const presets = topicPresets[newSubject as keyof typeof topicPresets];
    if (presets && presets[0]) {
      setAiTopic(presets[0]);
    }
  };

  // Active Questions List
  const questions: JambQuestion[] =
    activeMode === 'ai_exam' && aiQuestions.length > 0
      ? aiQuestions
      : JAMB_QUESTIONS.filter((q) => {
          if (subjectFilter === 'All') return true;
          const qSub = (q.subject || '').toLowerCase();
          const fSub = subjectFilter.toLowerCase();
          return (
            qSub === fSub ||
            (fSub.includes('lit') && qSub.includes('lit')) ||
            (fSub.includes('econ') && qSub.includes('econ'))
          );
        });

  // Exam Interaction States (Restored seamlessly from localStorage)
  const [currentIndex, setCurrentIndex] = useState<number>(
    () => (typeof initialSession?.currentIndex === 'number' ? initialSession.currentIndex : 0)
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>(
    () => initialSession?.selectedAnswers || {}
  );
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>(
    () => initialSession?.showSolution || {}
  );
  const [examSubmitted, setExamSubmitted] = useState<boolean>(
    () => Boolean(initialSession?.examSubmitted)
  );
  const [showResultsModal, setShowResultsModal] = useState<boolean>(
    () => Boolean(initialSession?.showResultsModal)
  );
  const [resultsFilter, setResultsFilter] = useState<'all' | 'wrong' | 'correct'>(
    () => initialSession?.resultsFilter || 'all'
  );
  const [studyMode, setStudyMode] = useState<boolean>(
    () => Boolean(initialSession?.studyMode)
  );
  const savedApiKey = typeof window !== 'undefined'
    ? (import.meta as any).env?.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_user_api_key') || ''
    : '';

  // CBT Countdown Timer (in seconds)
  const [initialDuration, setInitialDuration] = useState<number>(
    () => initialSession?.initialDuration || 40 * 60
  );
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!initialSession) return 40 * 60;
    if (initialSession.examSubmitted) return typeof initialSession.timeLeft === 'number' ? initialSession.timeLeft : 0;
    if (initialSession.isTimerRunning && initialSession.lastSavedTimestamp) {
      const elapsed = Math.floor((Date.now() - initialSession.lastSavedTimestamp) / 1000);
      return Math.max(0, (initialSession.timeLeft ?? 40 * 60) - elapsed);
    }
    return initialSession.timeLeft ?? 40 * 60;
  });
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(() => {
    if (!initialSession || initialSession.examSubmitted) return false;
    return Boolean(initialSession.isTimerRunning);
  });

  // Handle back gesture / history back when results modal is open
  useEffect(() => {
    if (!showResultsModal) return;

    try {
      window.history.pushState({ modal: 'cbt_results' }, '', window.location.href);
    } catch {
      // ignore
    }

    const handlePopState = () => {
      setShowResultsModal(false);
    };

    window.addEventListener('popstate', handlePopState, { once: true });
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showResultsModal]);

  // Persistent Storage Sync: Keep localStorage updated on every state change
  useEffect(() => {
    try {
      const sessionData: CbtPersistedSession = {
        activeMode,
        examType,
        courseDuration,
        alwaysShowDerivations,
        aiSubject,
        levelClass,
        difficulty,
        aiTopic,
        aiCount,
        subjectFilter,
        aiQuestions,
        currentIndex,
        selectedAnswers,
        showSolution,
        examSubmitted,
        showResultsModal,
        resultsFilter,
        studyMode,
        initialDuration,
        timeLeft,
        isTimerRunning,
        lastSavedTimestamp: Date.now(),
      };
      localStorage.setItem(CBT_STORAGE_KEY, JSON.stringify(sessionData));
    } catch {
      // ignore
    }
  }, [
    activeMode,
    examType,
    courseDuration,
    alwaysShowDerivations,
    aiSubject,
    levelClass,
    difficulty,
    aiTopic,
    aiCount,
    subjectFilter,
    aiQuestions,
    currentIndex,
    selectedAnswers,
    showSolution,
    examSubmitted,
    showResultsModal,
    resultsFilter,
    studyMode,
    initialDuration,
    timeLeft,
    isTimerRunning,
  ]);

  // App Lifecycle / Visibility handler: Flush and recalculate timer when app goes to background/foreground
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        try {
          const raw = localStorage.getItem(CBT_STORAGE_KEY);
          const current = raw ? JSON.parse(raw) : {};
          current.lastSavedTimestamp = Date.now();
          current.timeLeft = timeLeft;
          current.isTimerRunning = isTimerRunning;
          localStorage.setItem(CBT_STORAGE_KEY, JSON.stringify(current));
        } catch {
          // ignore
        }
      } else if (document.visibilityState === 'visible') {
        try {
          const raw = localStorage.getItem(CBT_STORAGE_KEY);
          if (raw) {
            const saved = JSON.parse(raw);
            if (saved.isTimerRunning && !saved.examSubmitted && saved.lastSavedTimestamp) {
              const elapsed = Math.floor((Date.now() - saved.lastSavedTimestamp) / 1000);
              if (elapsed > 0) {
                setTimeLeft((prev) => {
                  const updated = Math.max(0, prev - elapsed);
                  if (updated === 0) {
                    setExamSubmitted(true);
                    setIsTimerRunning(false);
                    setShowResultsModal(true);
                  }
                  return updated;
                });
              }
            }
          }
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleVisibility);
    window.addEventListener('beforeunload', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleVisibility);
      window.removeEventListener('beforeunload', handleVisibility);
    };
  }, [timeLeft, isTimerRunning]);

  // Timer Tick Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !examSubmitted) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setExamSubmitted(true);
            setIsTimerRunning(false);
            setShowResultsModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, examSubmitted]);

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

  const handleClearAndStartFresh = () => {
    setSelectedAnswers({});
    setShowSolution({});
    setExamSubmitted(false);
    setShowResultsModal(false);
    setCurrentIndex(0);
    setIsTimerRunning(false);
    setAiQuestions([]);
    const dur = aiCount * 60;
    setInitialDuration(dur);
    setTimeLeft(dur);
    try {
      localStorage.removeItem(CBT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const questionCardRef = useRef<HTMLDivElement>(null);

  const handleNavigateQuestion = (newIndex: number) => {
    setCurrentIndex(newIndex);
    if (questionCardRef.current) {
      questionCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Generate 10, 20, or 40 questions with AI
  const handleGenerateAiExam = async (
    overrideCount?: number,
    overrideTopic?: string,
    overrideSubject?: string
  ) => {
    setIsGenerating(true);
    setGenerationError(null);

    const effectiveCount = overrideCount || aiCount;
    if (overrideCount && overrideCount !== aiCount) {
      setAiCount(overrideCount);
    }
    if (overrideTopic && overrideTopic !== aiTopic) {
      setAiTopic(overrideTopic);
    }
    const targetSubject = (
      overrideSubject !== undefined
        ? overrideSubject
        : isCustomSubject && customSubjectName.trim()
        ? customSubjectName.trim()
        : aiSubject
    ).trim() || 'Mathematics';

    const targetTopic = (
      overrideTopic !== undefined ? overrideTopic : aiTopic
    ).trim() || 'General Syllabus';

    const randomNonce = `${Date.now()}_${Math.floor(Math.random() * 100000)}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_user_api_key') || '' : '';

      // 1. Direct browser call if user entered key
      if (storedKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: storedKey });
          const batchCount = Math.ceil(effectiveCount / 10);
          const partDescriptions = [
            'Part 1: Key concepts, fundamental laws, definitions and primary formula applications',
            'Part 2: Direct calculations, standard problem types, value substitutions and units',
            'Part 3: Multi-step derivations, combined formulas, algebraic rearrangements and graphs',
            'Part 4: High-yield past examination problems, subtle distractors and comprehensive synthesis',
          ];

          const batchPromises = Array.from({ length: batchCount }, async (_, idx) => {
            const batchSize = Math.min(10, effectiveCount - idx * 10);
            const partFocus = partDescriptions[idx] || `Part ${idx + 1}: Core topic questions`;

            const promptText = `
You are SmartSolve AI, an expert examination tutor and university professor for ${examType} in ${targetSubject}.
Target Level / Class: ${levelClass}
Selected Difficulty: ${difficulty}
Topic / Formula / Scope: "${targetTopic}"
Section / Subtopic Focus: ${partFocus}
Uniqueness Nonce / Seed: ${randomNonce}_${idx}
Number of Questions in this section: Exactly ${batchSize}

CRITICAL RULES:
1. Generate EXACTLY ${batchSize} realistic, distinct multiple-choice questions for ${examType}. Do NOT repeat previous questions; provide a FRESH, UNIQUE test on "${targetTopic}".
2. Format all formulas, powers, fractions, and symbols using standard LaTeX notation ($...$, \\frac{a}{b}, \\sqrt{...}, x^2, \\text{₦}).
3. For Literature in English: test figures of speech (personification, oxymoron, paradox, metaphor), dramatic terms (soliloquy, aside, comic relief), and African/Non-African prose/poetry.
4. For Economics: test price elasticity, demand/supply functions, market equilibrium, cost/revenue, national income multiplier, inflation, and monetary/fiscal policy.
5. Every question must have exactly 4 plausible options labeled A, B, C, D with 1 unambiguous correct answer.
6. Keep step derivations concise (1-2 lines per step) and clear.

Respond with ONLY a valid JSON object matching this exact structure:
{
  "questions": [
    {
      "id": "q${idx * 10 + 1}",
      "question": "Question statement in LaTeX notation...",
      "options": {
        "A": "Option A text with math",
        "B": "Option B text with math",
        "C": "Option C text with math",
        "D": "Option D text with math"
      },
      "correctAnswer": "A",
      "givenValues": "Given values with units (e.g. m = 2 kg, v = 10 m/s)",
      "whatIsRequired": "Required quantity and symbol",
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

            const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
            for (let i = 0; i < candidateModels.length; i++) {
              const model = candidateModels[i];
              try {
                const generatePromise = ai.models.generateContent({
                  model,
                  contents: [{ text: promptText }],
                  config: {
                    responseMimeType: 'application/json',
                    temperature: 0.85,
                  },
                });
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Batch timeout')), 20000)
                );
                const response = await Promise.race([generatePromise, timeoutPromise]) as any;

                const resultText = response.text?.trim() || '{}';
                let tempClean = resultText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
                const match = tempClean.match(/\{[\s\S]*\}/);
                if (match) tempClean = match[0];
                const parsed = JSON.parse(tempClean);
                return Array.isArray(parsed.questions) ? parsed.questions : [];
              } catch {
                if (i < candidateModels.length - 1) {
                  continue;
                }
                return [];
              }
            }
            return [];
          });

          const results = await Promise.all(batchPromises);
          const allQuestions = results.flat();

          if (allQuestions.length > 0) {
            let formatted = allQuestions.map((q: any, i: number) => ({
              ...q,
              id: `ai_${Date.now()}_${i + 1}`,
              subject: targetSubject,
              exam: examType,
              level: levelClass,
              difficulty: difficulty,
              topic: targetTopic,
              examYear: `${examType} (${levelClass}) AI Mock`,
            }));

            // Top up if any batch returned short using procedural topic generator
            while (formatted.length < effectiveCount) {
              const freshQ = generateProceduralQuestion(
                targetSubject,
                targetTopic,
                examType,
                levelClass,
                difficulty,
                formatted.length + 1
              );
              formatted.push(freshQ);
            }

            const guaranteedQuestions = formatted.slice(0, effectiveCount);
            setAiQuestions(guaranteedQuestions);
            setActiveMode('ai_exam');
            setSelectedAnswers({});
            setShowSolution({});
            setExamSubmitted(false);
            setShowResultsModal(false);
            setCurrentIndex(0);
            const duration = guaranteedQuestions.length * 60;
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
      const reqHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedKey) {
        reqHeaders['x-gemini-key'] = storedKey;
      }

      let response = await fetch('/api/solve', {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          action: 'generate_questions',
          subject: targetSubject,
          exam: examType,
          level: levelClass,
          difficulty: difficulty,
          topic: targetTopic,
          count: effectiveCount,
          seed: randomNonce,
          nonce: randomNonce,
          apiKey: storedKey || undefined,
        }),
      });

      if (response.status === 404) {
        response = await fetch('/api/ai/solve', {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify({
            action: 'generate_questions',
            subject: targetSubject,
            exam: examType,
            level: levelClass,
            difficulty: difficulty,
            topic: targetTopic,
            count: effectiveCount,
            seed: randomNonce,
            nonce: randomNonce,
            apiKey: storedKey || undefined,
          }),
        });
      }

      const resText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(resText);
      } catch {
        throw new Error('AI examination setter is currently unavailable. Please try again in a few moments.');
      }

      if (!response.ok || !data?.success || !data?.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error(data?.error || 'Unable to generate questions right now. Please try again shortly.');
      }

      let formatted = data.questions.map((q: any, i: number) => ({
        ...q,
        id: `ai_${Date.now()}_${i + 1}`,
        subject: targetSubject,
        exam: examType,
        level: levelClass,
        difficulty: difficulty,
        topic: targetTopic,
        examYear: `${examType} (${levelClass}) AI Mock`,
      }));

      // Top up if short
      while (formatted.length < effectiveCount) {
        const freshQ = generateProceduralQuestion(
          targetSubject,
          targetTopic,
          examType,
          levelClass,
          difficulty,
          formatted.length + 1
        );
        formatted.push(freshQ);
      }

      const guaranteedQuestions = formatted.slice(0, effectiveCount);
      setAiQuestions(guaranteedQuestions);
      setActiveMode('ai_exam');
      setSelectedAnswers({});
      setShowSolution({});
      setExamSubmitted(false);
      setShowResultsModal(false);
      setCurrentIndex(0);
      const duration = guaranteedQuestions.length * 60;
      setInitialDuration(duration);
      setTimeLeft(duration);
      setIsTimerRunning(true);
    } catch (err: any) {
      console.warn('AI exam generation fell back to topic-specific procedural questions:', err);
      handleLoadInstantBank(effectiveCount, targetTopic, targetSubject);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadInstantBank = (
    overrideCount?: number,
    targetTopicOverride?: string,
    targetSubjectOverride?: string
  ) => {
    const targetCount = overrideCount || aiCount;
    const activeTargetSubject = (
      targetSubjectOverride !== undefined
        ? targetSubjectOverride
        : isCustomSubject && customSubjectName.trim()
        ? customSubjectName.trim()
        : aiSubject
    ).trim() || 'Mathematics';

    const activeTargetTopic = (targetTopicOverride || aiTopic).trim();

    // 1. Filter bank matches for this subject (case-insensitive with aliases)
    const subjectMatches = JAMB_QUESTIONS.filter((q) => {
      const qSub = (q.subject || '').toLowerCase();
      const sSub = activeTargetSubject.toLowerCase();
      return (
        qSub === sSub ||
        (sSub.includes('lit') && qSub.includes('lit')) ||
        (sSub.includes('econ') && qSub.includes('econ'))
      );
    });

    // 2. Prioritize exact or partial topic matches
    const topicMatches = subjectMatches.filter((q) =>
      activeTargetTopic && (
        q.topic.toLowerCase().includes(activeTargetTopic.toLowerCase()) ||
        activeTargetTopic.toLowerCase().includes(q.topic.toLowerCase())
      )
    );

    // 3. Shuffle pool randomly so pressing again produces DIFFERENT questions!
    const pool = (topicMatches.length > 0 ? topicMatches : subjectMatches)
      .slice()
      .sort(() => Math.random() - 0.5);

    let formatted: JambQuestion[] = [];
    let poolIdx = 0;

    while (formatted.length < targetCount) {
      if (pool.length > 0 && poolIdx < pool.length) {
        const base = pool[poolIdx % pool.length];
        formatted.push({
          ...base,
          id: `bank_${Date.now()}_${formatted.length + 1}_${Math.random().toString(36).substring(2, 6)}`,
          subject: activeTargetSubject,
          level: levelClass,
          difficulty: difficulty,
          topic: activeTargetTopic || base.topic,
          examYear: `${examType} Official Practice`,
        });
        poolIdx++;
      } else {
        // Procedurally synthesize a fresh question matching this exact topic and subject
        const freshQ = generateProceduralQuestion(
          activeTargetSubject,
          activeTargetTopic,
          examType,
          levelClass,
          difficulty,
          formatted.length + 1
        );
        formatted.push(freshQ);
      }
    }

    const guaranteedQuestions = formatted.slice(0, targetCount);
    setAiQuestions(guaranteedQuestions);
    setActiveMode('ai_exam');
    setSelectedAnswers({});
    setShowSolution({});
    setExamSubmitted(false);
    setShowResultsModal(false);
    setCurrentIndex(0);
    const duration = guaranteedQuestions.length * 60;
    setInitialDuration(duration);
    setTimeLeft(duration);
    setIsTimerRunning(true);
    setGenerationError(null);
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
              <span className="text-xs text-[#A1A1AA]">· 7 Subjects: Maths, Physics, Chem, Bio, English, Literature & Economics</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1 flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-[#22C55E]" />
              <span>Nigerian Exam CBT Simulator & AI Setter</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-xl leading-relaxed">
              Set customized 40-question mock exams on any subject or formula with AI, auto-calculate your final score, and review verified step-by-step derivations!
            </p>
          </div>

          {/* Real-time CBT Timer / Score & Review Room Button */}
          <div className="flex items-center space-x-2 shrink-0">
            {examSubmitted ? (
              <button
                type="button"
                onClick={() => setShowResultsModal(true)}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] p-2 sm:px-3.5 sm:py-2.5 rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center space-x-2.5 transition-all active:scale-95 cursor-pointer text-left border border-emerald-400/40"
                title="Open Submit Review Room & Results Breakdown"
              >
                <div className="w-8 h-8 rounded-xl bg-black/30 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-black/80 flex items-center space-x-1">
                    <ArrowLeft className="w-3 h-3 text-black/80" />
                    <span>Submit Review Room</span>
                  </div>
                  <div className="text-sm sm:text-base font-black font-mono leading-tight">
                    {correctCount}/{totalQuestions} ({scorePercent}%)
                  </div>
                </div>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="bg-[#000000] p-2.5 sm:p-3 rounded-2xl border border-[#27272A] text-center min-w-[125px] flex flex-col items-center">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-[#22C55E]" />
                    <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">
                      CBT Timer
                    </span>
                    {!isTimerRunning && (
                      <span className="text-[10px] font-black text-amber-400 animate-pulse">PAUSED</span>
                    )}
                  </div>
                  <div className={`text-xl font-black mt-0.5 font-mono ${!isTimerRunning ? 'text-amber-400' : 'text-[#FFFFFF]'}`}>
                    {formatTimer(timeLeft)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning((prev) => !prev)}
                    className={`mt-1 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95 ${
                      isTimerRunning
                        ? 'bg-[#18181B] hover:bg-[#27272A] text-amber-400 border border-amber-500/20'
                        : 'bg-[#22C55E] hover:bg-[#16A34A] text-black font-black shadow-md shadow-emerald-500/20'
                    }`}
                    title={isTimerRunning ? 'Pause countdown timer' : 'Resume countdown timer'}
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-2.5 h-2.5 fill-current" />
                        <span>Pause Time</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Resume Time</span>
                      </>
                    )}
                  </button>
                </div>
                {questions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleFinalizeExam}
                    className="bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 px-3 py-3 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center"
                    title="Submit exam and open review room"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span className="text-[10px] font-black mt-0.5">Submit</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mode Selector Tabs & Auto-Save Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#27272A]">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveMode('ai_exam')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeMode === 'ai_exam'
                  ? 'bg-[#22C55E] text-[#FFFFFF] shadow-md shadow-emerald-500/25'
                  : 'bg-[#18181B] text-[#A1A1AA] hover:text-[#FFFFFF]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Exam Setter ({aiCount} Questions)</span>
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

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#22C55E]/10 text-[#22C55E] text-[11px] font-semibold border border-[#22C55E]/20 flex items-center space-x-1">
              <Check className="w-3 h-3 text-[#22C55E]" />
              <span>Session Auto-Saved</span>
            </span>
            {aiQuestions.length > 0 && (
              <button
                type="button"
                onClick={handleClearAndStartFresh}
                className="px-3 py-1 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] text-xs font-semibold border border-[#27272A] cursor-pointer active:scale-95 transition-all"
                title="Clear current exam and reconfigure"
              >
                Start Fresh
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI EXAM GENERATOR CONTROL CARD */}
      {activeMode === 'ai_exam' && (
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#27272A]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#22C55E]" />
              <h3 className="text-base font-bold text-[#FFFFFF]">Configure AI Examination Setter</h3>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#000000] border border-[#27272A] text-xs font-bold text-[#22C55E]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Flow: Exam → Subject → Level → Topic → Difficulty → Count</span>
            </div>
          </div>

          {/* 1. Examination Target Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#A1A1AA] flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center text-[10px]">1</span>
                <span>Select Examination Target</span>
              </span>
              <span className="text-[11px] text-[#22C55E] font-medium">JAMB · WAEC · JUPEB · University</span>
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                { id: 'JAMB/UTME', label: 'JAMB / UTME', desc: 'UTME Entrance Exam', icon: GraduationCap },
                { id: 'WAEC/WASSCE', label: 'WAEC / WASSCE', desc: 'Senior School Certificate', icon: BookOpen },
                { id: 'JUPEB', label: 'JUPEB', desc: 'A-Level Foundation Year', icon: Layers },
                { id: 'University Practice', label: 'University Practice', desc: '100L – 600L Undergrad', icon: Target },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = examType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleExamChange(item.id as any)}
                    className={`p-3 rounded-2xl text-left transition-all border cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-[#22C55E] text-black border-[#22C55E] shadow-md shadow-emerald-500/25 font-bold'
                        : 'bg-[#000000] text-[#FFFFFF] border-[#27272A] hover:border-[#22C55E]/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-black' : 'text-[#22C55E]'}`} />
                      <span className="text-xs font-black">{item.label}</span>
                    </div>
                    <p className={`text-[11px] mt-1 line-clamp-1 ${isSelected ? 'text-black/80 font-medium' : 'text-[#A1A1AA]'}`}>
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Course Duration & Level / Class Selection */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-[#000000] border border-[#27272A]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#A1A1AA] flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center text-[10px]">2</span>
                <span>
                  {examType === 'University Practice'
                    ? 'Select Course Duration & Academic Level (100L – 600L)'
                    : examType === 'WAEC/WASSCE'
                    ? 'Select Class Level (SS1, SS2, SS3)'
                    : examType === 'JUPEB'
                    ? 'Select JUPEB Program Level'
                    : 'Candidate Status / Level'}
                </span>
              </label>

              {/* Course Duration Selector for University Practice */}
              {examType === 'University Practice' && (
                <div className="flex items-center space-x-1.5 bg-[#18181B] p-1 rounded-xl border border-[#27272A]">
                  <span className="text-[10px] text-[#A1A1AA] uppercase font-bold px-1.5">Course Length:</span>
                  {[
                    { years: 4, label: '4-Year Degree' },
                    { years: 5, label: '5-Year (Engr/Law/Pharm)' },
                    { years: 6, label: '6-Year (MBBS)' },
                  ].map((dur) => (
                    <button
                      key={dur.years}
                      type="button"
                      onClick={() => handleCourseDurationChange(dur.years)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        courseDuration === dur.years
                          ? 'bg-[#22C55E] text-black shadow-xs'
                          : 'text-[#A1A1AA] hover:text-[#FFFFFF]'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Level Pills Grid */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {getLevelsForExam(examType, courseDuration).map((lvl) => {
                const isSelected = levelClass === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevelClass(lvl)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
                      isSelected
                        ? 'bg-[#22C55E] text-black border-[#22C55E] shadow-sm font-black'
                        : 'bg-[#18181B] text-[#A1A1AA] border-[#27272A] hover:text-[#FFFFFF] hover:border-[#22C55E]/50'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepped Selection Grid: Subject & Difficulty & Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 3. Subject Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#A1A1AA] flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center text-[10px]">3</span>
                <span>Subject</span>
              </label>
              <select
                value={isCustomSubject ? 'CUSTOM' : aiSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#000000] border border-[#27272A] text-xs font-bold text-[#FFFFFF] focus:border-[#22C55E] focus:outline-none transition-colors"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="English">English Language</option>
                <option value="Literature">Literature in English</option>
                <option value="Economics">Economics</option>
                <option value="Government">Government</option>
                <option value="Commerce">Commerce</option>
                <option value="Accounting">Accounting / Principles of Accounts</option>
                <option value="Agricultural Science">Agricultural Science</option>
                <option value="Geography">Geography</option>
                <option value="Computer Studies">Computer Studies</option>
                <option value="CRS">CRS (Christian Religious Studies)</option>
                <option value="IRS">IRS (Islamic Religious Studies)</option>
                <option value="Civic Education">Civic Education</option>
                <option value="CUSTOM">✍️ Other Subject (Type Custom Subject Below)...</option>
              </select>
              {isCustomSubject && (
                <div className="pt-1.5">
                  <input
                    type="text"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerateAiExam(undefined, aiTopic, customSubjectName);
                      }
                    }}
                    placeholder="Enter subject name (e.g. Further Maths, Anatomy, Mechanical Engr)..."
                    className="w-full p-2.5 rounded-xl bg-[#000000] border border-[#22C55E]/60 text-xs font-bold text-[#FFFFFF] placeholder:text-[#A1A1AA]/50 focus:border-[#22C55E] focus:outline-none transition-colors"
                  />
                </div>
              )}
            </div>

            {/* 4. Difficulty Selector (Easy, Medium, Hard, Very Hard) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#A1A1AA] flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center text-[10px]">4</span>
                <span>Difficulty (Tap to Pick)</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'Easy', label: 'Easy', color: 'text-emerald-400' },
                  { id: 'Medium', label: 'Medium', color: 'text-sky-400' },
                  { id: 'Hard', label: 'Hard', color: 'text-amber-400' },
                  { id: 'Very Hard', label: 'Very Hard', color: 'text-rose-400' },
                ].map((diff) => {
                  const isSelected = difficulty === diff.id;
                  return (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => setDifficulty(diff.id as any)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 text-center ${
                        isSelected
                          ? 'bg-[#22C55E] text-black border-[#22C55E] shadow-sm font-black'
                          : 'bg-[#000000] text-[#A1A1AA] border-[#27272A] hover:text-[#FFFFFF] hover:border-[#22C55E]/50'
                      }`}
                    >
                      {diff.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Question Count Selector (10, 20, 40) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#A1A1AA] flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center text-[10px]">5</span>
                <span>Question Count</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[10, 20, 40].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setAiCount(count)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 text-center ${
                      aiCount === count
                        ? 'bg-[#22C55E] text-black border-[#22C55E] shadow-sm font-black'
                        : 'bg-[#000000] text-[#A1A1AA] border-[#27272A] hover:text-[#FFFFFF] hover:border-[#22C55E]/50'
                    }`}
                  >
                    {count === 40 ? '40 (Mock)' : `${count} Qs`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Topic / Formula Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#A1A1AA] flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center text-[10px]">6</span>
                <span>Topic or Governing Formula (Type any custom topic and tap Set Topic or Enter)</span>
              </label>
              {aiTopic && (
                <button
                  type="button"
                  onClick={() => setAiTopic('')}
                  className="text-[11px] text-[#A1A1AA] hover:text-[#FFFFFF] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerateAiExam(undefined, aiTopic, effectiveSubject);
                  }
                }}
                placeholder="e.g. Price Elasticity of Demand, Literary Devices & Figures of Speech, Projectiles, Calculus..."
                className="flex-1 p-3 rounded-xl bg-[#000000] border border-[#27272A] text-sm text-[#FFFFFF] font-medium placeholder:text-[#A1A1AA]/50 focus:border-[#22C55E] focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => handleGenerateAiExam(undefined, aiTopic, effectiveSubject)}
                disabled={isGenerating}
                className="px-4 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0 shadow-md shadow-emerald-500/20"
                title="Generate fresh questions for this topic immediately"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Set Topic</span>
              </button>
            </div>
          </div>

          {/* Quick Topic Chips for Selected Subject */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-[#A1A1AA]">
              <span className="font-bold text-[#FFFFFF]">Recommended Syllabus Topics:</span>
              <span className="text-[#22C55E]">Tap any topic to set fresh questions instantly</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(topicPresets[effectiveSubject] || topicPresets[aiSubject] || topicPresets['Literature'] || []).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAiTopic(preset);
                    handleGenerateAiExam(undefined, preset, effectiveSubject);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer active:scale-95 ${
                    aiTopic === preset
                      ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 font-bold'
                      : 'bg-[#000000] text-[#A1A1AA] border border-[#27272A] hover:text-[#FFFFFF] hover:border-[#22C55E]/40'
                  }`}
                  title={`Tap to generate fresh questions on: ${preset}`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-3 border-t border-[#27272A]">
            <span className="text-xs text-[#A1A1AA]">
              {examType} · {effectiveSubject} ({levelClass}) · {difficulty} · {aiCount} Questions
            </span>
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={() => handleLoadInstantBank(undefined, aiTopic, effectiveSubject)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#18181B] hover:bg-[#27272A] active:scale-95 text-[#22C55E] border border-[#22C55E]/40 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
                title="Launch full 40 questions immediately in 0.2s using the official Nigerian syllabus bank"
              >
                <Zap className="w-4 h-4 text-[#22C55E]" />
                <span>⚡ Instant {aiCount}-Question Mock (0.2s)</span>
              </button>

              <button
                onClick={() => handleGenerateAiExam(undefined, aiTopic, effectiveSubject)}
                disabled={isGenerating}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] active:scale-95 disabled:opacity-50 text-[#FFFFFF] font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting {aiCount} Questions with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate {aiCount} with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error notice with Multi-Option Recovery */}
          {generationError && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] space-y-3">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold leading-relaxed">{generationError}</p>
                  <p className="text-[11px] text-[#A1A1AA]">
                    Choose an action below to start practicing immediately without delay:
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#EF4444]/20 justify-end">
                {aiCount > 10 && (
                  <button
                    type="button"
                    onClick={() => handleGenerateAiExam(10)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs cursor-pointer whitespace-nowrap transition-all border border-amber-500/30 active:scale-95 flex items-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Try 10 Questions (~3s)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleLoadInstantBank()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#22C55E]/20 hover:bg-[#22C55E]/30 text-[#22C55E] font-bold text-xs cursor-pointer whitespace-nowrap transition-all border border-[#22C55E]/30 active:scale-95 flex items-center space-x-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Practice Instant Syllabus Bank</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateAiExam()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-bold text-xs cursor-pointer whitespace-nowrap transition-all active:scale-95"
                >
                  Retry Live AI
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationError(null)}
                  className="px-3 py-1.5 rounded-xl bg-[#27272A] hover:bg-[#3F3F46] text-[#FFFFFF] font-semibold text-xs cursor-pointer whitespace-nowrap transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STANDARD QUESTION BANK CONTROLS */}
      {activeMode === 'bank' && (
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#27272A]">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-[#22C55E]" />
              <h3 className="text-base font-bold text-[#FFFFFF]">Official Nigerian Exam Question Bank</h3>
            </div>
            <span className="text-xs text-[#A1A1AA]">
              {questions.length} questions available in current filter
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#A1A1AA] flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Filter by Subject:</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Literature', 'Economics'] as const).map((subj) => {
                const count = subj === 'All'
                  ? JAMB_QUESTIONS.length
                  : JAMB_QUESTIONS.filter((q) => {
                      const qSub = (q.subject || '').toLowerCase();
                      const sSub = subj.toLowerCase();
                      return (
                        qSub === sSub ||
                        (sSub.includes('lit') && qSub.includes('lit')) ||
                        (sSub.includes('econ') && qSub.includes('econ'))
                      );
                    }).length;
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => {
                      setSubjectFilter(subj);
                      setCurrentIndex(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
                      subjectFilter === subj
                        ? 'bg-[#22C55E] text-[#FFFFFF] border-[#22C55E] shadow-sm shadow-emerald-500/20'
                        : 'bg-[#18181B] text-[#A1A1AA] border-[#27272A] hover:text-[#FFFFFF] hover:border-[#22C55E]/40'
                    }`}
                  >
                    {subj === 'Literature' ? 'Literature in English' : subj} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CBT 40-QUESTION PALETTE WORKSTATION GRID */}
      {questions.length > 0 && (
        <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-[#27272A]">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-[#22C55E]" />
              <span className="text-xs font-black text-[#FFFFFF] uppercase tracking-wider">
                Exam Question Palette ({questions.length} Questions Total)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#A1A1AA]">
              {examSubmitted && (
                <button
                  type="button"
                  onClick={() => setShowResultsModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Submit Review Room</span>
                </button>
              )}
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] inline-block"></span>
                <span>{Object.keys(selectedAnswers).length} Answered</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#18181B] border border-[#3F3F46] inline-block"></span>
                <span>{questions.length - Object.keys(selectedAnswers).length} Remaining</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full ring-2 ring-[#22C55E] bg-black inline-block"></span>
                <span className="text-[#22C55E] font-semibold">Q{currentIndex + 1} Current</span>
              </span>
            </div>
          </div>

          {/* Quick Jump Buttons (1 to 40) */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 sm:gap-2 max-h-44 overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(selectedAnswers[q.id]);
              const isCurrent = idx === currentIndex;
              let style = 'bg-[#18181B] text-[#A1A1AA] border border-[#27272A] hover:border-[#22C55E]/60 hover:text-[#FFFFFF]';
              if (isCurrent) {
                style = isAnswered
                  ? 'bg-[#22C55E] text-[#FFFFFF] font-black ring-2 ring-white ring-offset-2 ring-offset-black scale-105'
                  : 'bg-[#18181B] text-[#22C55E] font-black ring-2 ring-[#22C55E] ring-offset-1 ring-offset-black scale-105';
              } else if (isAnswered) {
                style = 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/50 font-bold';
              }

              return (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => handleNavigateQuestion(idx)}
                  className={`h-8 sm:h-9 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 ${style}`}
                  title={`Jump to Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CBT EXAM QUESTION CARD */}
      {currentQ ? (
        <div ref={questionCardRef} className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
          {/* Question Header & Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-3 py-1 rounded-lg bg-[#18181B] text-[#FFFFFF] font-mono text-xs font-bold border border-white/5">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#22C55E]/15 text-[#22C55E] text-xs font-bold uppercase tracking-wider border border-[#22C55E]/30">
                {currentQ.subject}
              </span>
              {currentQ.level && (
                <span className="px-2 py-0.5 rounded-md bg-[#18181B] text-[#FFFFFF] text-[11px] font-semibold border border-[#27272A]">
                  {currentQ.level}
                </span>
              )}
              {currentQ.difficulty && (
                <span className="px-2 py-0.5 rounded-md bg-[#18181B] text-amber-400 text-[11px] font-semibold border border-amber-500/20">
                  {currentQ.difficulty}
                </span>
              )}
              {currentQ.topic && (
                <span className="text-xs text-[#A1A1AA] hidden md:inline truncate max-w-xs">· {currentQ.topic}</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Live In-Question Timer & Pause/Resume Control */}
              {!examSubmitted && (
                <button
                  type="button"
                  onClick={() => setIsTimerRunning((prev) => !prev)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                    isTimerRunning
                      ? 'bg-[#18181B] hover:bg-[#27272A] text-[#FFFFFF] border border-[#27272A]'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  }`}
                  title={isTimerRunning ? 'Click to Pause Exam Timer' : 'Click to Resume Exam Timer'}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formatTimer(timeLeft)}</span>
                  <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-white/10 uppercase flex items-center space-x-1">
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-2.5 h-2.5 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Resume</span>
                      </>
                    )}
                  </span>
                </button>
              )}

              {examSubmitted && (
                <button
                  type="button"
                  onClick={() => setShowResultsModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                  title="Return to the Submit Review Room"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Submit Review Room</span>
                </button>
              )}

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

          {/* Exam Paused Notice Banner */}
          {!isTimerRunning && !examSubmitted && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-300">
              <div className="flex items-center space-x-2">
                <Pause className="w-4 h-4 text-amber-400 fill-current shrink-0 animate-pulse" />
                <span>
                  <strong>Exam Timer Paused ({formatTimer(timeLeft)} left).</strong> Solve on paper or review your question calmly.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTimerRunning(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Resume Timer</span>
              </button>
            </div>
          )}

          {/* Question Statement in KaTeX (Inside dedicated horizontal scroll container) */}
          <div className="text-base sm:text-lg text-[#FFFFFF] font-medium leading-relaxed py-1 formula-scroll-container">
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
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start space-x-3 cursor-pointer min-w-0 ${style}`}
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
                  <div className="pt-0.5 text-sm sm:text-base flex-1 min-w-0 overflow-x-auto touch-pan-x overscroll-x-contain formula-scroll-container">
                    <MathRenderer content={optText} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Row: Derivations, AI Solver & Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#27272A]">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleToggleSolution}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm ${
                  isRevealed
                    ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40'
                    : 'bg-[#18181B] hover:bg-[#27272A] text-[#FFFFFF] border border-white/5'
                }`}
                title="Only shows derivation when you click here"
              >
                <Lightbulb className={`w-3.5 h-3.5 ${isRevealed ? 'text-[#22C55E]' : 'text-amber-400'}`} />
                <span>{isRevealed ? 'Hide Derivation' : '💡 Show Derivation'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSolution}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm ${
                  isRevealed
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[#18181B] hover:bg-[#27272A] text-amber-400 border border-amber-500/20'
                }`}
                title="Stuck or confused on this question? Click to reveal full working steps"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{isRevealed ? 'Hide Working' : '🤔 Confused? Show Working'}</span>
              </button>

              {onOpenInGemini && (
                <button
                  type="button"
                  onClick={() => {
                    // Reveal the derivation for this question when clicking AI Solver
                    setShowSolution((prev) => ({ ...prev, [currentQ.id]: true }));
                    const fullQ = `[Examination: ${examType} | Level: ${levelClass} | Difficulty: ${currentQ.difficulty || difficulty}]\nSubject: ${currentQ.subject} — Topic: ${currentQ.topic || 'General'}\n\nQuestion:\n${currentQ.question}\n\nOptions:\nA. ${currentQ.options.A}\nB. ${currentQ.options.B}\nC. ${currentQ.options.C}\nD. ${currentQ.options.D}\n\nTask: Solve this question with complete step-by-step mathematical derivation, governing laws/formulas in LaTeX, value substitution, clear step calculations, final boxed answer, and exam tips.`;
                    onOpenInGemini(fullQ, currentQ.subject);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600/25 via-[#22C55E]/20 to-teal-500/25 hover:from-emerald-600/35 hover:to-teal-500/35 text-[#22C55E] border border-[#22C55E]/40 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                  title="Click to solve with AI and reveal verified step-by-step derivation"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#22C55E] animate-pulse" />
                  <span>✨ AI Solver</span>
                </button>
              )}
            </div>

            {/* Navigation & Submit */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {examSubmitted && (
                <button
                  type="button"
                  onClick={() => setShowResultsModal(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#22C55E]/20 hover:bg-[#22C55E]/30 text-[#22C55E] border border-[#22C55E]/40 flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
                  title="Return to the Submit Review Room"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Submit Review Room</span>
                </button>
              )}

              <button
                disabled={currentIndex === 0}
                onClick={() => handleNavigateQuestion(Math.max(0, currentIndex - 1))}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#18181B] hover:bg-[#27272A] disabled:opacity-30 text-[#FFFFFF] cursor-pointer"
              >
                Prev
              </button>

              {currentIndex < questions.length - 1 ? (
                <>
                  <button
                    onClick={() => handleNavigateQuestion(Math.min(questions.length - 1, currentIndex + 1))}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] cursor-pointer"
                  >
                    Next
                  </button>
                  {!examSubmitted && (
                    <button
                      type="button"
                      onClick={handleFinalizeExam}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40 flex items-center space-x-1 cursor-pointer"
                      title="Submit exam and review results"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Submit</span>
                    </button>
                  )}
                </>
              ) : (
                !examSubmitted && (
                  <button
                    onClick={handleFinalizeExam}
                    className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] flex items-center space-x-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Submit & View Result</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Step-by-Step Rigorous Derivation Panel (ONLY on-demand when clicked) */}
          {isRevealed && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#000000] border border-[#27272A] space-y-4 animate-fadeIn text-[#FFFFFF] shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#27272A]">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 text-xs font-black text-[#22C55E] flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Correct Answer: Option {currentQ.correctAnswer}</span>
                  </span>
                  {currentQ.difficulty && (
                    <span className="text-[11px] font-semibold text-amber-400 px-2 py-0.5 rounded-md bg-[#18181B] border border-amber-500/20">
                      {currentQ.difficulty}
                    </span>
                  )}
                </div>

                {onOpenInGemini && (
                  <button
                    type="button"
                    onClick={() => {
                      const fullQ = `[Deep AI Derivation Request]\nQuestion: ${currentQ.question}\nOptions:\nA: ${currentQ.options.A}\nB: ${currentQ.options.B}\nC: ${currentQ.options.C}\nD: ${currentQ.options.D}\nCorrect Answer: Option ${currentQ.correctAnswer}\n\nPlease explain alternative derivation methods and in-depth conceptual breakdown.`;
                      onOpenInGemini(fullQ, currentQ.subject);
                    }}
                    className="text-xs text-[#22C55E] hover:underline flex items-center space-x-1 cursor-pointer font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Deep Explanation</span>
                  </button>
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
                  <div className="text-base text-[#FFFFFF] py-1 text-center formula-scroll-container">
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
                  <div className="text-sm sm:text-base text-[#FFFFFF] py-1 text-center formula-scroll-container">
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
                    <div key={i} className="text-sm text-[#FFFFFF] py-0.5 formula-scroll-container">
                      <MathRenderer content={st} />
                    </div>
                  ))}
                </div>
              )}

              {/* 5. Boxed Final Answer */}
              <div className="pt-3 pb-1 text-center formula-scroll-container">
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
                  type="button"
                  onClick={() => setShowResultsModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
                  title="Return to the Submit Review Room"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Submit Review Room</span>
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
            {/* Top Back & Close Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <button
                type="button"
                onClick={() => setShowResultsModal(false)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#22C55E] hover:text-[#4ADE80] border border-[#22C55E]/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
                title="Go back to question workstation"
              >
                <ArrowLeft className="w-4 h-4 text-[#22C55E]" />
                <span>Back to Questions</span>
              </button>
              <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider hidden sm:inline">
                Submit & Review Room
              </span>
              <button
                type="button"
                onClick={() => setShowResultsModal(false)}
                className="p-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] cursor-pointer"
                title="Close Review Room"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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

              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowResultsModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] border border-[#27272A] text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Questions</span>
                </button>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] text-xs font-black shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
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
