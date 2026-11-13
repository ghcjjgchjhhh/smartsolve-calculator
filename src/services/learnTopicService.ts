import {
  ExamModeQuestion,
  FormulaQuestion,
  LearnTopicFormula,
  LearnTopicLesson,
} from '../types';
import { detectAndGenerateDiagram } from './aiDiagramDetector';
import { detectAndEnhanceGraphs } from './aiGraphDetector';
import { computeDeterministically } from './deterministicSolver';
import { JAMB_QUESTIONS } from '../data/jambQuestions';
import { AdaptiveMode } from './tutorProgressService';

const STORAGE_KEY = 'smartsolve_recent_lessons';
const FORMULA_Q_CACHE_KEY = 'smartsolve_formula_q_cache_v1';

export interface LearnTopicParams {
  topic: string;
  subject?: string;
  examLevel?: string;
  language?: string;
  adaptiveMode?: AdaptiveMode;
}

export interface FormulaQuestionsParams {
  topic: string;
  subject: string;
  examLevel: string;
  formula: LearnTopicFormula;
  existingQuestions?: string[];
  forceRefresh?: boolean;
}

export interface AdaptiveExplanationResult {
  title: string;
  encouragement: string;
  simpleAnalogy: string;
  stepByStepCore: string[];
  easyCheckQuestion?: {
    question: string;
    hint: string;
    steps: string[];
    finalAnswer: string;
    expectedNumericValue?: number | null;
    unit?: string;
  };
}

function enrichFormulaQuestionsDeterministically(questions: FormulaQuestion[]): FormulaQuestion[] {
  return questions.map((q, idx) => {
    const out: FormulaQuestion = {
      ...q,
      id: q.id || `fq_${Date.now()}_${idx + 1}`,
      steps: Array.isArray(q.steps) ? q.steps : [],
    };
    if (out.evaluableExpression && out.evaluableExpression.trim()) {
      const det = computeDeterministically(out.evaluableExpression, 'deg');
      if (det.computed && det.valueText) {
        const numeric = parseFloat(det.valueText);
        if (!isNaN(numeric) && isFinite(numeric)) {
          out.expectedNumericValue = numeric;
          out.verifiedDeterministically = true;
        }
      }
    }
    return out;
  });
}

function enrichLessonVisuals(lesson: LearnTopicLesson, originalTopic: string): LearnTopicLesson {
  const enriched: LearnTopicLesson = {
    ...lesson,
    formulas: Array.isArray(lesson.formulas)
      ? lesson.formulas.map((f, i) => ({
          ...f,
          id: f.id || `formula_${i + 1}`,
          symbols: Array.isArray(f.symbols) ? f.symbols : [],
          questions: Array.isArray(f.questions)
            ? enrichFormulaQuestionsDeterministically(f.questions)
            : undefined,
        }))
      : [],
    workedExamples: Array.isArray(lesson.workedExamples) ? lesson.workedExamples : [],
    importantNotes: Array.isArray(lesson.importantNotes) ? lesson.importantNotes : [],
    commonPitfalls: Array.isArray(lesson.commonPitfalls) ? lesson.commonPitfalls : [],
    practiceQuestions: Array.isArray(lesson.practiceQuestions) ? lesson.practiceQuestions : [],
    suggestedFollowUps: Array.isArray(lesson.suggestedFollowUps) ? lesson.suggestedFollowUps : [],
  };

  try {
    const mockSolution: any = {
      title: enriched.topic,
      category: enriched.subject,
      problemStatement: `${enriched.topic}. ${enriched.introduction || ''}`,
      formula: enriched.formulas?.[0]?.latex || '',
      steps: [
        ...(enriched.detailedExplanation || []),
        ...(enriched.workedExamples?.flatMap((e) => [e.problemStatement, ...(e.steps || [])]) || []),
      ],
      graphs: enriched.graphs || [],
      diagram: enriched.diagram,
    };

    if (!enriched.diagram) {
      const diag = detectAndGenerateDiagram(mockSolution, originalTopic);
      if (diag) {
        enriched.diagram = diag;
      }
    }

    if (!enriched.graphs || enriched.graphs.length === 0) {
      const enhancedGraphs = detectAndEnhanceGraphs(mockSolution, originalTopic);
      if (enhancedGraphs && enhancedGraphs.length > 0 && !enriched.diagram) {
        enriched.graphs = enhancedGraphs;
      }
    }
  } catch {
    // ignore enrichment errors
  }
  return enriched;
}

/**
 * Matches verified curated past questions from SmartSolve's vetted JAMB/WAEC/JUPEB bank
 * and distinguishes them cleanly from AI-generated questions.
 */
export function findVerifiedPastQuestions(topic: string, subject: string): ExamModeQuestion[] {
  const stopWords = new Set(['the', 'and', 'for', 'with', 'into', 'from', 'that', 'this', 'laws', 'law', 'introduction']);
  const tokens = `${topic} ${subject}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  if (tokens.length === 0) return [];

  const scored = JAMB_QUESTIONS.map((q) => {
    const haystack = `${q.subject} ${q.topic} ${q.question} ${q.formula}`.toLowerCase();
    let score = 0;
    if (subject && subject !== 'Auto-Detect' && q.subject.toLowerCase() === subject.toLowerCase()) {
      score += 2;
    }
    for (const tok of tokens) {
      if (q.topic.toLowerCase().includes(tok)) score += 4;
      else if (haystack.includes(tok)) score += 1;
    }
    return { q, score };
  })
    .filter((item) => item.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return scored.map(({ q }) => ({
    id: `verified_${q.id}`,
    examBody: q.exam.includes('WAEC') ? 'WAEC' : q.exam.includes('JUPEB') ? 'JUPEB' : 'JAMB',
    questionType: 'Multiple-Choice',
    difficulty: q.difficulty === 'Easy' ? 'Easy' : q.difficulty === 'Hard' || q.difficulty === 'Very Hard' ? 'Difficult' : 'Intermediate',
    sourceType: 'verified-past',
    year: q.year || q.examYear || 'Verified Archive',
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    formula: q.formula,
    whyFormula: q.whyFormula || `This curated past question directly tests ${q.topic} using ${q.formula}.`,
    hint: q.examTip || `Identify given quantities and apply ${q.formula}.`,
    steps: q.steps,
    finalAnswer: q.finalAnswer || `Option ${q.correctAnswer}: ${q.options[q.correctAnswer]}`,
  }));
}

export function saveLessonToHistory(lesson: LearnTopicLesson): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: LearnTopicLesson[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((item) => item.topic.toLowerCase() !== lesson.topic.toLowerCase());
    filtered.unshift({ ...lesson, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 20)));
  } catch {
    // ignore
  }
}

export function getSavedLessons(): LearnTopicLesson[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getFormulaCacheKey(topic: string, formulaName: string): string {
  return `${topic.trim().toLowerCase()}::${formulaName.trim().toLowerCase()}`;
}

function getCachedFormulaQuestions(topic: string, formulaName: string): FormulaQuestion[] | null {
  try {
    const raw = localStorage.getItem(FORMULA_Q_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as Record<string, FormulaQuestion[]>;
    const key = getFormulaCacheKey(topic, formulaName);
    return Array.isArray(cache[key]) && cache[key].length > 0 ? cache[key] : null;
  } catch {
    return null;
  }
}

function saveCachedFormulaQuestions(topic: string, formulaName: string, questions: FormulaQuestion[]): void {
  try {
    const raw = localStorage.getItem(FORMULA_Q_CACHE_KEY);
    const cache: Record<string, FormulaQuestion[]> = raw ? JSON.parse(raw) : {};
    const key = getFormulaCacheKey(topic, formulaName);
    cache[key] = questions;
    // Bound cache size cleanly
    const keys = Object.keys(cache);
    if (keys.length > 35) {
      delete cache[keys[0]];
    }
    localStorage.setItem(FORMULA_Q_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage limits
  }
}

/**
 * Fetches a comprehensive universal topic lesson from secure server-side routes.
 */
export async function fetchTopicLesson(params: LearnTopicParams): Promise<LearnTopicLesson> {
  const {
    topic,
    subject = 'Auto-Detect',
    examLevel = 'JUPEB, JAMB, WAEC & University',
    language = 'English',
    adaptiveMode = 'standard',
  } = params;

  const payload = { topic, subject, examLevel, language, adaptiveMode };
  let response: Response;

  try {
    response = await fetch('/api/learn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      response = await fetch('/api/ai/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (response.status === 404) {
      response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'learn_topic', ...payload }),
      });
    }
  } catch {
    const offlineLesson = getOfflineCuratedLesson(topic, subject, examLevel);
    if (offlineLesson) {
      saveLessonToHistory(offlineLesson);
      return offlineLesson;
    }
    throw new Error('Unable to connect to AI Tutor. Please check your connection and tap Retry.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const offlineFallback = getOfflineCuratedLesson(topic, subject, examLevel);
    if (offlineFallback) {
      saveLessonToHistory(offlineFallback);
      return offlineFallback;
    }
    throw new Error(
      errData.error ||
        (response.status === 404
          ? 'Academic Tutor service route not found (404). Please refresh or tap Retry.'
          : `Academic Tutor error (${response.status}). Please tap Retry.`)
    );
  }

  const data = await response.json();
  if (!data.lesson) {
    throw new Error('No lesson data returned from the AI academic tutor. Please tap Retry.');
  }

  const lesson = enrichLessonVisuals(data.lesson, topic);
  // Restore any already-cached 12-question sets per formula for instant zero-token loading
  lesson.formulas = lesson.formulas.map((f) => {
    const cached = getCachedFormulaQuestions(lesson.topic, f.name);
    return cached && (!f.questions || f.questions.length === 0) ? { ...f, questions: cached } : f;
  });

  saveLessonToHistory(lesson);
  return lesson;
}

/**
 * Generates 12 distinct questions (3 Easy, 3 Intermediate, 3 Difficult, 3 Exam-Standard)
 * under ONE formula progressively via server-side route, with local caching.
 */
export async function fetchFormulaQuestions(params: FormulaQuestionsParams): Promise<FormulaQuestion[]> {
  const { topic, subject, examLevel, formula, existingQuestions = [], forceRefresh = false } = params;

  if (!forceRefresh) {
    const cached = getCachedFormulaQuestions(topic, formula.name);
    if (cached && cached.length >= 6) {
      return cached;
    }
  }

  const body = {
    action: 'formula_questions',
    topic,
    subject,
    examLevel,
    formulaName: formula.name,
    formulaLatex: formula.latex,
    whenToUse: formula.whenToUse,
    conditions: formula.conditions || '',
    symbols: formula.symbols,
    existingQuestions,
    nonce: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };

  let response = await fetch('/api/learn/formula-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.status === 404) {
    response = await fetch('/api/learn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Could not load formula practice questions (${response.status}).`);
  }

  const data = await response.json();
  const rawQuestions: FormulaQuestion[] = Array.isArray(data.questions) ? data.questions : [];
  if (rawQuestions.length === 0) {
    throw new Error('No practice questions returned for this formula. Tap Retry.');
  }

  const enriched = enrichFormulaQuestionsDeterministically(rawQuestions);
  saveCachedFormulaQuestions(topic, formula.name, enriched);
  return enriched;
}

/**
 * Generates an adaptive simplified explanation or level-up challenge when triggered.
 */
export async function fetchAdaptiveExplanation(params: {
  topic: string;
  subject: string;
  strugglingPoint?: string;
  mode: 'simplify' | 'challenge';
}): Promise<AdaptiveExplanationResult> {
  const response = await fetch('/api/learn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'adapt_explanation',
      topic: params.topic,
      subject: params.subject,
      strugglingPoint: params.strugglingPoint || params.topic,
      mode: params.mode,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Unable to generate adaptive explanation right now.');
  }

  const data = await response.json();
  return data.adaptation;
}

/**
 * Ask a follow-up clarification question to the AI Academic Tutor (server-side only).
 */
export async function askTopicFollowUp(
  topic: string,
  question: string,
  lessonSummary: string,
  adaptiveMode: AdaptiveMode = 'standard'
): Promise<string> {
  const payload = { topic, question, lessonSummary, adaptiveMode };

  let response = await fetch('/api/learn/follow-up', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.status === 404) {
    response = await fetch('/api/learn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'follow_up', ...payload }),
    });
  }

  if (response.status === 404) {
    const chatRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Regarding the topic "${topic}": ${question}`,
        problemContext: { title: topic, problemStatement: lessonSummary },
      }),
    });
    if (chatRes.ok) {
      const chatData = await chatRes.json();
      if (chatData.reply) return chatData.reply;
    }
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Failed to get follow-up clarification (${response.status}).`);
  }

  const data = await response.json();
  return data.reply || 'Tutor response unavailable.';
}

/**
 * Curated offline fallback lessons for core high-demand topics.
 */
function getOfflineCuratedLesson(topic: string, _subject: string, examLevel: string): LearnTopicLesson | null {
  const lower = topic.toLowerCase();

  if (lower.includes('circle') || lower.includes('chord') || lower.includes('tangent')) {
    return {
      topic: 'Circle Geometry: Chords, Tangents & Perpendicular Distances',
      subject: 'Mathematics',
      targetExamLevel: examLevel,
      summary: 'Master circle theorems, chord bisectors, perpendicular distances from the center, and tangent-radius rules.',
      simpleDefinition: 'Circle geometry studies exact relationships between lines, angles, radii, chords, and tangents inside or touching a circle.',
      introduction:
        'Draw any straight cut across a round cake without passing through the middle—that cut is a chord. Circle geometry gives us surprisingly clean geometric shortcuts to find hidden lengths and angles without measuring with a protractor.',
      realWorldAnalogy:
        'Imagine slicing a circular pizza with a straight knife cut that misses the center. A toothpick pointing straight from the center at 90 degrees to your cut will always split the slice into two equal halves.',
      detailedExplanation: [
        'Foundation: Every point on a circle sits at an identical distance r (the radius) from the center O.',
        'Perpendicular Chord Bisector: Dropping a perpendicular line OM from center O onto chord AB cuts AB cleanly in half, creating a right-angled triangle \\Delta OMB.',
        'Pythagorean Connection: Because \\Delta OMB has a 90° angle at M, the radius r acts as the hypotenuse while half the chord (L/2) and center distance (d) form the legs.',
      ],
      importantConcepts: [
        'A perpendicular from the center O to any chord AB always bisects AB into two equal halves.',
        'Equal chords are equidistant from the center O.',
        'A tangent meets the radius at exactly 90° at the point of contact.',
      ],
      characteristicsAndProperties: [
        'Longest possible chord is the diameter (L = 2r, where distance d = 0).',
        'Angle subtended by a diameter at any point on the circumference is always 90°.',
        'Opposite angles of a cyclic quadrilateral sum to 180°.',
      ],
      typesAndClassifications: [
        { name: 'Chord', description: 'Straight line segment joining two points on the circumference', example: 'Line AB inside the circle' },
        { name: 'Diameter', description: 'Special chord passing directly through center O', example: 'Length = 2r' },
        { name: 'Tangent', description: 'Line touching the circle at exactly one external point', example: 'Wheel touching flat road' },
      ],
      everydayExamples: [
        'Designing arched bridges and curved tunnel clearances using chord-distance calculations.',
        'Measuring circular pipe cross-sections when partially filled with water.',
      ],
      commonExamQuestions: [
        { question: 'Find perpendicular distance from center O to a chord given radius and chord length', examStyle: 'WAEC / JAMB', keyIdea: 'Halve chord length first, then apply Pythagoras' },
        { question: 'Calculate distance between two parallel chords on opposite vs same side of center', examStyle: 'JUPEB / WAEC', keyIdea: 'Add d1 + d2 for opposite sides; subtract |d1 - d2| for same side' },
      ],
      formulas: [
        {
          id: 'chord_perp_dist',
          name: 'Chord Perpendicular Distance Formula',
          latex: '$$r^2 = d^2 + \\left(\\frac{L}{2}\\right)^2 \\iff d = \\sqrt{r^2 - \\left(\\frac{L}{2}\\right)^2}$$',
          whenToUse: 'Whenever given two of {radius r, chord length L, distance from center d} and asked for the third.',
          conditions: 'Applies to flat Euclidean circles where M is the midpoint of chord AB and OM ⊥ AB.',
          derivationSummary: 'Pythagoras theorem on right-angled triangle \\Delta OMB.',
          symbols: [
            { symbol: '$r$', meaning: 'Circle radius', siUnit: 'm (or cm)' },
            { symbol: '$d$', meaning: 'Perpendicular distance from O to chord AB', siUnit: 'm (or cm)' },
            { symbol: '$L$', meaning: 'Total chord length AB', siUnit: 'm (or cm)' },
          ],
          workedExamplesByLevel: {
            simple: {
              title: 'Simple: Radius from Distance & Chord',
              level: 'Simple',
              problemStatement: 'A chord of length $12\\text{ cm}$ is $8\\text{ cm}$ from the center O. Find radius $r$.',
              givenValues: [
                { name: 'Chord length', symbol: 'L', value: '12', unit: 'cm' },
                { name: 'Distance', symbol: 'd', value: '8', unit: 'cm' },
              ],
              formulaUsed: '$$r = \\sqrt{d^2 + (L/2)^2}$$',
              substitution: '$$r = \\sqrt{8^2 + 6^2}$$',
              steps: ['Half chord: $L/2 = 12/2 = 6\\text{ cm}$.', '$r = \\sqrt{64 + 36} = \\sqrt{100} = 10\\text{ cm}$.'],
              finalAnswer: '\\boxed{10\\text{ cm}}',
              unit: 'cm',
              explanation: 'Forms a classic 6-8-10 Pythagorean triple.',
            },
            intermediate: {
              title: 'Intermediate: Distance to Chord',
              level: 'Intermediate',
              problemStatement: 'A circle has radius $14\\text{ cm}$ and chord $AB = 20\\text{ cm}$. Find distance from O to AB.',
              givenValues: [
                { name: 'Radius', symbol: 'r', value: '14', unit: 'cm' },
                { name: 'Chord', symbol: 'L', value: '20', unit: 'cm' },
              ],
              formulaUsed: '$$d = \\sqrt{r^2 - (L/2)^2}$$',
              substitution: '$$d = \\sqrt{14^2 - 10^2}$$',
              steps: ['Half chord: $20/2 = 10\\text{ cm}$.', '$d = \\sqrt{196 - 100} = \\sqrt{96} \\approx 9.80\\text{ cm}$.'],
              finalAnswer: '\\boxed{9.80\\text{ cm}}',
              unit: 'cm',
              explanation: 'Remember to divide L by 2 before squaring.',
            },
            difficult: {
              title: 'Difficult: Parallel Chords Distance',
              level: 'Difficult',
              problemStatement: 'In a circle of radius $10\\text{ cm}$, two parallel chords have lengths $12\\text{ cm}$ and $16\\text{ cm}$ on opposite sides of center O. Find the distance between them.',
              givenValues: [{ name: 'Radius', symbol: 'r', value: '10', unit: 'cm' }],
              formulaUsed: '$$D = d_1 + d_2$$',
              substitution: '$$d_1 = \\sqrt{10^2 - 6^2},\\; d_2 = \\sqrt{10^2 - 8^2}$$',
              steps: ['$d_1 = 8\\text{ cm}$, $d_2 = 6\\text{ cm}$.', 'Opposite sides add: $8 + 6 = 14\\text{ cm}$.'],
              finalAnswer: '\\boxed{14\\text{ cm}}',
              unit: 'cm',
              explanation: 'Compute center-to-chord distances individually before adding.',
            },
          },
        },
      ],
      diagram: {
        id: 'diag_circle_chord',
        type: 'circle_geometry',
        title: 'Circle Geometry: Radius, Chord & Perpendicular Distance',
        topic: 'Circle Geometry',
        caption: 'Circle with center O, radius r = 14 cm, chord AB = 20 cm, and perpendicular OM = 9.80 cm.',
        givenParameters: { radius: '14 cm', chord: '20 cm', distance: '9.80 cm' },
        data: {
          circle: {
            centerLabel: 'O',
            radius: 14,
            subtype: 'chord_distance',
            chordDistance: {
              radius: 14,
              chordLength: 20,
              perpendicularDistance: 9.8,
              chordLabel: 'AB = 20 cm',
              midpointLabel: 'M',
              centerLabel: 'O',
              unit: 'cm',
            },
          },
        },
      },
      workedExamples: [
        {
          title: 'WAEC / JAMB Chord Distance Example',
          level: 'Intermediate',
          problemStatement: 'A circle has radius $14\\text{ cm}$ and center O. A chord AB is $20\\text{ cm}$ long. Calculate the perpendicular distance from O to AB.',
          givenValues: [
            { name: 'Radius', symbol: 'r', value: '14', unit: 'cm' },
            { name: 'Chord', symbol: 'L', value: '20', unit: 'cm' },
          ],
          formulaUsed: '$$d = \\sqrt{r^2 - (L/2)^2}$$',
          substitution: '$$d = \\sqrt{14^2 - 10^2}$$',
          steps: ['Half chord = $10\\text{ cm}$.', '$d = \\sqrt{196 - 100} = \\sqrt{96} = 4\\sqrt{6} \\approx 9.80\\text{ cm}$.'],
          finalAnswer: '\\boxed{9.80\\text{ cm}}',
          unit: 'cm',
          explanation: 'Perpendicular from center always bisects the chord.',
        },
      ],
      importantNotes: [
        'Always halve chord length first ($L/2$) before using Pythagoras.',
        'Equal chords sit at equal perpendicular distances from the center.',
      ],
      commonPitfalls: [
        'Using full chord length L instead of half-chord L/2.',
        'Adding instead of subtracting distances when parallel chords lie on the SAME side of the center.',
      ],
      practiceQuestions: [
        {
          id: 'pq_offline_1',
          question: 'A chord of length 24 cm is 5 cm from the center of a circle. Calculate the radius.',
          difficulty: 'Intermediate',
          formulaUsed: '$$r = \\sqrt{d^2 + (L/2)^2}$$',
          whyThisFormula: 'Radius is the hypotenuse formed by distance d and half-chord L/2.',
          hint: 'Half of 24 cm is 12 cm.',
          solution: ['$r = \\sqrt{5^2 + 12^2} = \\sqrt{25 + 144} = \\sqrt{169} = 13\\text{ cm}$'],
          finalAnswer: '\\boxed{13\\text{ cm}}',
          expectedNumericValue: 13,
          unit: 'cm',
        },
      ],
      topicNavigation: {
        prerequisites: ['Pythagoras Theorem', 'Properties of Triangles'],
        relatedTopics: ['Circle Theorems: Cyclic Quadrilaterals', 'Tangent-Secant Theorem'],
        advancedTopics: ['Coordinate Geometry of Circles', 'Arc Length & Sector Area'],
        keyFormulasToMaster: ['Chord Perpendicular Distance Formula'],
        recommendedNextStep: 'Practice parallel chord problems on both the same side and opposite sides of center O.',
      },
      suggestedFollowUps: [
        'How do I solve when two chords are on the same side of the center?',
        'Explain the Alternate Segment Theorem with a worked example.',
      ],
    };
  }

  return null;
}
