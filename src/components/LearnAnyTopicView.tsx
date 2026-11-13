import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Printer,
  Compass,
  Bookmark,
  Share2,
  Cpu,
  Layers,
  Search,
} from 'lucide-react';
import { LearnTopicLesson, LearnTopicPracticeQuestion } from '../types';
import { MathRenderer } from './MathRenderer';
import { ScientificDiagramRenderer } from './ScientificDiagramRenderer';
import { InteractiveSolverGraph } from './InteractiveSolverGraph';
import {
  fetchTopicLesson,
  askTopicFollowUp,
  getSavedLessons,
  saveLessonToHistory,
} from '../services/learnTopicService';
import { useTheme } from '../contexts/ThemeContext';
import { useAppLanguage } from '../contexts/LanguageContext';

const SUBJECT_OPTIONS = [
  'All Subjects',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Further Mathematics',
  'Economics',
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
    title: 'Circle Geometry: Chords & Perpendiculars',
    subject: 'Mathematics',
    query: 'A circle has a radius of 14 cm and center O. A chord AB is 20 cm long. Find the perpendicular distance from center O to chord AB.',
  },
  {
    title: 'Projectile Motion at an Angle',
    subject: 'Physics',
    query: 'Projectile motion launched at an angle to the horizontal: time of flight, maximum height, and horizontal range.',
  },
  {
    title: "Le Chatelier's Principle & Equilibrium",
    subject: 'Chemistry',
    query: "Chemical equilibrium and Le Chatelier's principle with effect of temperature, pressure and concentration.",
  },
  {
    title: 'Integration by Parts & Substitution',
    subject: 'Mathematics',
    query: 'Integration by parts formula and u-substitution techniques with university exam examples.',
  },
  {
    title: "Newton's Laws on an Inclined Plane",
    subject: 'Physics',
    query: "Forces acting on an object sliding down a rough inclined plane with friction and resolving components.",
  },
  {
    title: 'Cell Division: Mitosis vs Meiosis',
    subject: 'Biology',
    query: 'Stages and differences between Mitosis and Meiosis, chromosome numbers, crossing over and biological significance.',
  },
  {
    title: "Ohm's Law & Circuit Calculations",
    subject: 'Physics',
    query: "Electric circuits in series and parallel, internal resistance of cells, terminal p.d. and Ohm's law.",
  },
  {
    title: 'Matrices, Determinants & Inverse',
    subject: 'Further Mathematics',
    query: '3x3 Matrix determinant, adjoint, matrix inversion and solving simultaneous equations using Cramer rule.',
  },
];

export const LearnAnyTopicView: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { currentLanguage } = useAppLanguage();

  const [topicInput, setTopicInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedLevel, setSelectedLevel] = useState('JUPEB, JAMB, WAEC & University');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LearnTopicLesson | null>(null);

  // Accordion state for practice questions
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  // Follow-up tutor state
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpHistory, setFollowUpHistory] = useState<Array<{ role: 'user' | 'tutor'; text: string }>>([]);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  // Copy status
  const [copied, setCopied] = useState(false);

  // Saved lessons history
  const [savedLessons, setSavedLessons] = useState<LearnTopicLesson[]>([]);

  const lessonTopRef = useRef<HTMLDivElement | null>(null);
  const followUpBottomRef = useRef<HTMLDivElement | null>(null);
  const lastAttemptRef = useRef<{ query: string; subject?: string } | null>(null);

  useEffect(() => {
    setSavedLessons(getSavedLessons());
  }, []);

  const handleTeachMe = async (customQuery?: string, subjectOverride?: string) => {
    const query = (customQuery ?? topicInput).trim();
    if (!query) return;

    const effectiveSubject =
      subjectOverride ?? (selectedSubject === 'All Subjects' ? undefined : selectedSubject);
    lastAttemptRef.current = { query, subject: effectiveSubject };

    setIsLoading(true);
    setError(null);
    setFollowUpHistory([]);

    try {
      const userApiKey =
        localStorage.getItem('gemini_user_api_key') ||
        localStorage.getItem('gemini_api_key') ||
        (import.meta as any).env?.VITE_GEMINI_API_KEY ||
        undefined;
      const result = await fetchTopicLesson({
        topic: query,
        subject: effectiveSubject,
        examLevel: selectedLevel,
        language: currentLanguage.name,
        userApiKey,
      });

      setLesson(result);
      setSavedLessons(getSavedLessons());
      setRevealedSolutions({});
      setRevealedHints({});

      // Scroll smoothly down to the lesson
      setTimeout(() => {
        lessonTopRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      console.error('Teach Me failed:', err);
      setError(err?.message || 'Unable to generate academic lesson. Please try again.');
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

  const handleFollowUpSubmit = async (customText?: string) => {
    const questionText = (customText || followUpQuestion).trim();
    if (!questionText || !lesson || isFollowUpLoading) return;

    setFollowUpQuestion('');
    const newHistory = [...followUpHistory, { role: 'user' as const, text: questionText }];
    setFollowUpHistory(newHistory);
    setIsFollowUpLoading(true);

    try {
      const userApiKey =
        localStorage.getItem('gemini_user_api_key') ||
        localStorage.getItem('gemini_api_key') ||
        (import.meta as any).env?.VITE_GEMINI_API_KEY ||
        undefined;
      const lessonSummary = `${lesson.topic}: ${lesson.summary}. Formulas: ${lesson.formulas.map((f) => f.name + ': ' + f.latex).join('; ')}`;
      const reply = await askTopicFollowUp(lesson.topic, questionText, lessonSummary, userApiKey);

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

  const handleCopySummary = () => {
    if (!lesson) return;
    const textToCopy = `📚 Topic: ${lesson.topic} (${lesson.subject})
🎯 Level: ${lesson.targetExamLevel}

💡 Introduction:
${lesson.introduction}

🔬 Real-World Mental Model:
${lesson.realWorldAnalogy}

📐 Core Formulas:
${lesson.formulas.map((f) => `• ${f.name}: ${f.latex} (${f.whenToUse})`).join('\n')}

✍️ Exam Tips:
${lesson.importantNotes.map((n) => `• ${n}`).join('\n')}

Generated via SmartSolve Calculator Pro`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintLesson = () => {
    window.print();
  };

  const toggleSolution = (id: string) => {
    setRevealedSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleHint = (id: string) => {
    setRevealedHints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Hero Card */}
      <section
        className={`rounded-3xl border p-5 sm:p-8 shadow-xl transition-all relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-[#101014] via-[#0D0D10] to-[#0A0A0C] border-[#27272A]'
            : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/30 border-slate-200'
        }`}
      >
        {/* Decorative backdrop glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Badge & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#22C55E] shadow-md shadow-emerald-500/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1
                    className={`text-xl sm:text-2xl font-black tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Learn Any Topic
                  </h1>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#22C55E] border border-emerald-500/30 flex items-center space-x-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>AI Master Tutor</span>
                  </span>
                </div>
                <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Instant masterclasses with verified formulas, symbol tables, SI units, vector diagrams, graphs & worked solutions.
                </p>
              </div>
            </div>

            {/* Target Exam Level Selector */}
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Level:
              </span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer outline-none transition-colors ${
                  isDark
                    ? 'bg-[#18181B] text-white border-[#27272A] focus:border-emerald-500'
                    : 'bg-white text-slate-900 border-slate-300 focus:border-emerald-600'
                }`}
              >
                {EXAM_LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl} value={lvl} className={isDark ? 'bg-[#18181B]' : 'bg-white'}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUBJECT_OPTIONS.map((sub) => {
              const active = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[#22C55E] text-white shadow-md shadow-emerald-500/20 scale-[1.02]'
                      : isDark
                      ? 'bg-[#18181B] text-zinc-300 hover:bg-[#27272A] hover:text-white border border-[#27272A]'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>

          {/* Main Input Box & Teach Me Button */}
          <div className="space-y-3">
            <div
              className={`p-2 rounded-2xl border transition-all shadow-inner ${
                isDark
                  ? 'bg-[#000000] border-[#27272A] focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20'
                  : 'bg-white border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20'
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

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dashed border-zinc-700/40 px-1">
                <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">Ctrl+Enter</kbd> to teach
                </span>

                <div className="flex items-center space-x-2">
                  {topicInput && (
                    <button
                      type="button"
                      onClick={() => setTopicInput('')}
                      className={`text-xs px-2.5 py-1 rounded-lg ${
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
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 cursor-pointer ${
                      isLoading || !topicInput.trim()
                        ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-60'
                        : 'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-emerald-500/30'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Teaching Topic...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Teach Me</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* High-Yield Suggestion Chips */}
            <div className="space-y-1.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                High-Yield Syllabus Topics (Tap to Learn):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TOPICS.map((sug) => (
                  <button
                    key={sug.title}
                    onClick={() => {
                      setTopicInput(sug.query);
                      setSelectedSubject(sug.subject);
                      handleTeachMe(sug.query, sug.subject);
                    }}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all text-left flex items-center space-x-1.5 cursor-pointer ${
                      isDark
                        ? 'bg-[#18181B] hover:bg-[#27272A] text-zinc-300 hover:text-white border-[#27272A]'
                        : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{sug.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loading Progress State */}
      {isLoading && (
        <div
          className={`rounded-3xl border p-8 sm:p-12 text-center shadow-xl space-y-4 animate-pulse ${
            isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#22C55E]">
            <GraduationCap className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Preparing Your Comprehensive Academic Lesson...
            </h3>
            <p className={`text-xs sm:text-sm mt-1 max-w-md mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Analyzing academic laws, formulating equations in KaTeX, verifying SI units, generating visual diagrams, and compiling textbook worked examples.
            </p>
          </div>
          <div className="w-48 h-1.5 mx-auto rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 animate-pulse w-3/4 rounded-full" />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && !isLoading && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 sm:p-5 flex items-start space-x-3 text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-red-200">Lesson Generation Issue</h4>
            <p className="text-xs text-red-300 mt-0.5">{error}</p>
            <button
              type="button"
              onClick={handleRetryLesson}
              className="mt-2.5 inline-flex items-center space-x-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* Completed Lesson View */}
      {lesson && !isLoading && (
        <div ref={lessonTopRef} className="space-y-6 sm:space-y-8 animate-fadeIn">
          {/* Lesson Header Banner */}
          <div
            className={`rounded-3xl border p-5 sm:p-7 shadow-xl transition-all ${
              isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b pb-4 border-zinc-700/30">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-[#22C55E] border border-emerald-500/30">
                    {lesson.subject}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                    isDark ? 'bg-[#18181B] text-zinc-300 border-[#27272A]' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    🎓 {lesson.targetExamLevel}
                  </span>
                </div>
                <h2 className={`text-xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {lesson.topic}
                </h2>
                <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  {lesson.summary}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : isDark
                      ? 'bg-[#18181B] hover:bg-[#27272A] text-zinc-300 border-[#27272A]'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title="Copy lesson summary"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintLesson}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#18181B] hover:bg-[#27272A] text-zinc-300 border-[#27272A]'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title="Print or save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>
              </div>
            </div>

            {/* Quick Navigation Anchor Bar */}
            <div className="flex items-center space-x-2 overflow-x-auto pt-3 text-xs font-bold scrollbar-none">
              <span className={`text-[11px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                Contents:
              </span>
              <a
                href="#introduction"
                className={`px-2.5 py-1 rounded-lg ${isDark ? 'bg-[#18181B] text-zinc-300 hover:text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                1. Intro
              </a>
              <a
                href="#formulas"
                className={`px-2.5 py-1 rounded-lg ${isDark ? 'bg-[#18181B] text-zinc-300 hover:text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                2. Formulas & Symbols
              </a>
              {(lesson.diagram || (lesson.graphs && lesson.graphs.length > 0)) && (
                <a
                  href="#visuals"
                  className={`px-2.5 py-1 rounded-lg ${isDark ? 'bg-[#18181B] text-zinc-300 hover:text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                  3. Diagram / Graph
                </a>
              )}
              <a
                href="#examples"
                className={`px-2.5 py-1 rounded-lg ${isDark ? 'bg-[#18181B] text-zinc-300 hover:text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                4. Worked Examples
              </a>
              <a
                href="#practice"
                className={`px-2.5 py-1 rounded-lg ${isDark ? 'bg-[#18181B] text-zinc-300 hover:text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                5. Practice
              </a>
              <a
                href="#tutor-qa"
                className={`px-2.5 py-1 rounded-lg text-emerald-400 ${isDark ? 'bg-emerald-950/40 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700'}`}
              >
                💬 Ask Tutor
              </a>
            </div>
          </div>

          {/* Section 1: Introduction & Intuitive Mental Model */}
          <section id="introduction" className="space-y-4">
            <div
              className={`rounded-3xl border p-5 sm:p-7 shadow-xl space-y-4 ${
                isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 text-[#22C55E]">
                <BookOpen className="w-5 h-5" />
                <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  1. Introduction & Theoretical Foundations
                </h3>
              </div>

              <div className={`text-sm sm:text-base leading-relaxed space-y-3 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                <p>{lesson.introduction}</p>

                {lesson.detailedExplanation && lesson.detailedExplanation.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-zinc-700/20">
                    {lesson.detailedExplanation.map((para, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <MathRenderer content={para} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Intuitive Mental Model Card */}
              {lesson.realWorldAnalogy && (
                <div
                  className={`rounded-2xl p-4 sm:p-5 border flex items-start space-x-3.5 ${
                    isDark
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-amber-500">
                      Real-World Intuition & Mental Model
                    </h4>
                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-amber-100/90' : 'text-amber-950'}`}>
                      {lesson.realWorldAnalogy}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Formulas, When to Use Each, Symbols & SI Units */}
          <section id="formulas" className="space-y-4">
            <div
              className={`rounded-3xl border p-5 sm:p-7 shadow-xl space-y-6 ${
                isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 text-[#22C55E]">
                <Cpu className="w-5 h-5" />
                <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  2. Governing Formulas, Symbols & SI Units
                </h3>
              </div>

              <div className="space-y-5">
                {lesson.formulas.map((form, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 sm:p-5 space-y-4 transition-all ${
                      isDark
                        ? 'bg-[#18181D] border-[#27272A] hover:border-emerald-500/40'
                        : 'bg-slate-50 border-slate-200 hover:border-emerald-600/40'
                    }`}
                  >
                    {/* Formula Name & KaTeX Display */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3 border-zinc-700/30">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-[#22C55E] flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <h4 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {form.name}
                        </h4>
                      </div>
                    </div>

                    {/* Centered KaTeX Math Formula */}
                    <div
                      className={`p-4 rounded-xl text-center overflow-x-auto ${
                        isDark ? 'bg-black/60 border border-white/5' : 'bg-white border border-slate-200 shadow-2xs'
                      }`}
                    >
                      <MathRenderer content={form.latex} displayMode={true} />
                    </div>

                    {/* When to use callout */}
                    <div
                      className={`rounded-xl p-3 text-xs sm:text-sm flex items-start space-x-2.5 ${
                        isDark ? 'bg-blue-500/10 border border-blue-500/25 text-blue-200' : 'bg-blue-50 border border-blue-200 text-blue-900'
                      }`}
                    >
                      <Compass className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">When to Apply:</strong> {form.whenToUse}
                      </div>
                    </div>

                    {/* Derivation summary if present */}
                    {form.derivationSummary && (
                      <p className={`text-xs italic ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        <strong>Derivation:</strong> {form.derivationSummary}
                      </p>
                    )}

                    {/* Symbols & SI Units Table */}
                    {form.symbols && form.symbols.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Meanings of Symbols & SI Units:
                        </span>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr
                                className={`border-b ${
                                  isDark ? 'border-[#27272A] text-zinc-400' : 'border-slate-200 text-slate-600'
                                }`}
                              >
                                <th className="py-1.5 px-3 font-semibold">Symbol</th>
                                <th className="py-1.5 px-3 font-semibold">Quantity / Meaning</th>
                                <th className="py-1.5 px-3 font-semibold">SI Unit</th>
                                {form.symbols.some((s) => s.standardValue) && (
                                  <th className="py-1.5 px-3 font-semibold">Standard Value</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-700/20">
                              {form.symbols.map((sym, sIdx) => (
                                <tr key={sIdx} className={isDark ? 'text-zinc-200' : 'text-slate-800'}>
                                  <td className="py-1.5 px-3 font-mono font-bold text-emerald-400">
                                    <MathRenderer content={sym.symbol} />
                                  </td>
                                  <td className="py-1.5 px-3">{sym.meaning}</td>
                                  <td className="py-1.5 px-3 font-mono font-semibold text-blue-400">
                                    {sym.siUnit}
                                  </td>
                                  {form.symbols.some((s) => s.standardValue) && (
                                    <td className="py-1.5 px-3 font-mono text-amber-400">
                                      {sym.standardValue || '—'}
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3: Visual Diagrams & Interactive Graphs (if applicable) */}
          {(lesson.diagram || (lesson.graphs && lesson.graphs.length > 0)) && (
            <section id="visuals" className="space-y-4">
              <div
                className={`rounded-3xl border p-5 sm:p-7 shadow-xl space-y-6 ${
                  isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2 text-[#22C55E]">
                  <Layers className="w-5 h-5" />
                  <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    3. Visual Mathematical Diagram & Scientific Graph
                  </h3>
                </div>

                {/* Vector Diagram Renderer */}
                {lesson.diagram && (
                  <div className="space-y-2">
                    <ScientificDiagramRenderer diagram={lesson.diagram} />
                  </div>
                )}

                {/* Kinematic / Interactive Graph Renderer */}
                {lesson.graphs && lesson.graphs.length > 0 && (
                  <div className="space-y-2">
                    <InteractiveSolverGraph
                      graphs={lesson.graphs}
                      problemContext={lesson.topic}
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section 4: Comparative Reference Tables (if any) */}
          {lesson.tables && lesson.tables.length > 0 && (
            <section className="space-y-4">
              {lesson.tables.map((tbl, tIdx) => (
                <div
                  key={tIdx}
                  className={`rounded-3xl border p-5 sm:p-7 shadow-xl space-y-3 ${
                    isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
                  }`}
                >
                  <h4 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    📊 {tbl.title}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr
                          className={`border-b ${
                            isDark ? 'border-[#27272A] bg-[#18181B] text-zinc-300' : 'border-slate-200 bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tbl.headers.map((h, i) => (
                            <th key={i} className="py-2.5 px-3.5 font-bold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-700/20">
                        {tbl.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}
                          >
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="py-2.5 px-3.5">
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
            </section>
          )}

          {/* Section 5: Step-by-Step Worked Textbook Examples */}
          <section id="examples" className="space-y-4">
            <div
              className={`rounded-3xl border p-5 sm:p-7 shadow-xl space-y-6 ${
                isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 text-[#22C55E]">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  4. Step-by-Step Worked Textbook Examples
                </h3>
              </div>

              <div className="space-y-6">
                {lesson.workedExamples.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className={`rounded-2xl border p-4 sm:p-6 space-y-4 ${
                      isDark ? 'bg-[#18181D] border-[#27272A]' : 'bg-slate-50 border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center space-x-2 border-b pb-3 border-zinc-700/30">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
                        Ex {exIdx + 1}
                      </span>
                      <h4 className={`text-sm sm:text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {ex.title}
                      </h4>
                    </div>

                    {/* Problem Statement */}
                    <div
                      className={`p-3.5 rounded-xl border font-medium text-xs sm:text-sm leading-relaxed ${
                        isDark ? 'bg-black/40 border-white/5 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <strong className="font-bold text-emerald-400 block mb-1">Problem Question:</strong>
                      <MathRenderer content={ex.problemStatement} />
                    </div>

                    {/* Given Quantities */}
                    {ex.givenValues && ex.givenValues.length > 0 && (
                      <div className="space-y-1">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Given Information:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {ex.givenValues.map((gv, gIdx) => (
                            <span
                              key={gIdx}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-mono ${
                                isDark ? 'bg-black/30 border-white/10 text-zinc-300' : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            >
                              <strong>{gv.name}</strong> ({gv.symbol}) = {gv.value} {gv.unit || ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Relevant Formula & Substitution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div
                        className={`p-3 rounded-xl border ${
                          isDark ? 'bg-black/30 border-white/5' : 'bg-white border-slate-200'
                        }`}
                      >
                        <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Relevant Formula:
                        </span>
                        <div className="mt-1">
                          <MathRenderer content={ex.formulaUsed} />
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-xl border ${
                          isDark ? 'bg-black/30 border-white/5' : 'bg-white border-slate-200'
                        }`}
                      >
                        <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Direct Substitution:
                        </span>
                        <div className="mt-1">
                          <MathRenderer content={ex.substitution} />
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Calculation */}
                    <div className="space-y-2">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Step-by-Step Calculation:
                      </span>
                      <div className="space-y-1.5">
                        {ex.steps.map((st, sIdx) => (
                          <div
                            key={sIdx}
                            className={`p-2.5 rounded-xl text-xs sm:text-sm leading-relaxed ${
                              isDark ? 'bg-black/25 text-zinc-300' : 'bg-white text-slate-700'
                            }`}
                          >
                            <MathRenderer content={st} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Final Boxed Answer */}
                    <div
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                        isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-300'
                      }`}
                    >
                      <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                        Final Answer:
                      </span>
                      <div className="text-sm sm:text-base font-mono font-bold text-emerald-400">
                        <MathRenderer content={ex.finalAnswer} />
                      </div>
                    </div>

                    {/* Takeaway / Physical Meaning */}
                    {ex.explanation && (
                      <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        <strong>Conceptual Takeaway:</strong> {ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 6: Important Exam Notes & Common Pitfalls */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* High-Yield Exam Notes */}
            <div
              className={`rounded-3xl border p-5 sm:p-6 shadow-xl space-y-3 ${
                isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Crucial Exam Notes & Rules
                </h4>
              </div>
              <ul className="space-y-2">
                {lesson.importantNotes.map((note, nIdx) => (
                  <li key={nIdx} className="flex items-start space-x-2 text-xs sm:text-sm">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    <span className={isDark ? 'text-zinc-300' : 'text-slate-700'}>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Pitfalls & Traps */}
            <div
              className={`rounded-3xl border p-5 sm:p-6 shadow-xl space-y-3 ${
                isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
                <h4 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Common Student Pitfalls & Traps
                </h4>
              </div>
              <ul className="space-y-2">
                {lesson.commonPitfalls.map((pit, pIdx) => (
                  <li key={pIdx} className="flex items-start space-x-2 text-xs sm:text-sm">
                    <span className="text-amber-500 font-bold mt-0.5">⚠</span>
                    <span className={isDark ? 'text-zinc-300' : 'text-slate-700'}>{pit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Section 7: Challenging Practice Questions with Self-Assessment */}
          <section id="practice" className="space-y-4">
            <div
              className={`rounded-3xl border p-5 sm:p-7 shadow-xl space-y-6 ${
                isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 text-[#22C55E]">
                <HelpCircle className="w-5 h-5" />
                <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  5. Challenging Practice Questions with Step-by-Step Solutions
                </h3>
              </div>

              <div className="space-y-4">
                {lesson.practiceQuestions.map((pq, pqIdx) => {
                  const isRevealed = revealedSolutions[pq.id] || false;
                  const isHintRevealed = revealedHints[pq.id] || false;

                  return (
                    <div
                      key={pq.id || pqIdx}
                      className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition-all ${
                        isDark ? 'bg-[#18181D] border-[#27272A]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b pb-2.5 border-zinc-700/30">
                        <span className="text-xs font-bold text-emerald-400">
                          Question {pqIdx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            pq.difficulty.includes('Challenging')
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : pq.difficulty === 'Hard'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {pq.difficulty}
                        </span>
                      </div>

                      <div className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <MathRenderer content={pq.question} />
                      </div>

                      {/* Hint button & toggle */}
                      {pq.hint && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => toggleHint(pq.id)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
                              isHintRevealed
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : isDark
                                ? 'bg-black/30 text-zinc-400 hover:text-white border-white/5'
                                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                            }`}
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isHintRevealed ? 'Hide Hint' : 'Show Hint'}</span>
                          </button>

                          {isHintRevealed && (
                            <div
                              className={`p-3 rounded-xl border text-xs animate-fadeIn ${
                                isDark
                                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                                  : 'bg-amber-50 border-amber-200 text-amber-900'
                              }`}
                            >
                              <strong>Hint:</strong> <MathRenderer content={pq.hint} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Solution accordion button */}
                      <button
                        type="button"
                        onClick={() => toggleSolution(pq.id)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-between transition-all cursor-pointer ${
                          isRevealed
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : isDark
                            ? 'bg-black/40 hover:bg-black/60 text-zinc-300 border-white/5'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-2xs'
                        }`}
                      >
                        <span className="flex items-center space-x-1.5">
                          <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                          <span>{isRevealed ? 'Hide Full Solution & Answer' : 'Reveal Step-by-Step Solution'}</span>
                        </span>
                        {isRevealed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {/* Revealed Solution Box */}
                      {isRevealed && (
                        <div
                          className={`rounded-xl p-4 border space-y-3 animate-fadeIn ${
                            isDark ? 'bg-black/50 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                              Solution Steps:
                            </span>
                            {pq.solution.map((s, sIdx) => (
                              <div key={sIdx} className="text-xs sm:text-sm">
                                <MathRenderer content={s} />
                              </div>
                            ))}
                          </div>

                          <div
                            className={`p-3 rounded-lg border text-center font-bold ${
                              isDark ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-emerald-100 border-emerald-400 text-emerald-900'
                            }`}
                          >
                            <span className="text-xs block text-emerald-400 uppercase tracking-wider">Answer:</span>
                            <MathRenderer content={pq.finalAnswer} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 8: Interactive AI Tutor Follow-Up Chat */}
          <section id="tutor-qa" className="space-y-4">
            <div
              className={`rounded-3xl border p-5 sm:p-7 shadow-xl space-y-5 ${
                isDark ? 'bg-[#101014] border-[#27272A]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-zinc-700/30">
                <div className="flex items-center space-x-2 text-[#22C55E]">
                  <MessageSquare className="w-5 h-5" />
                  <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    6. Interactive Academic Tutor (Follow-up Questions)
                  </h3>
                </div>
                <span className="text-[11px] text-[#22C55E] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Live Context
                </span>
              </div>

              <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Have a doubt or need a deeper proof? Ask the AI tutor any follow-up question regarding <strong className="text-emerald-400">"{lesson.topic}"</strong>:
              </p>

              {/* Suggested Follow-up Chips */}
              {lesson.suggestedFollowUps && lesson.suggestedFollowUps.length > 0 && (
                <div className="space-y-1.5">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Suggested Questions to Ask Tutor:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {lesson.suggestedFollowUps.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleFollowUpSubmit(chip)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all text-left flex items-center space-x-1.5 cursor-pointer ${
                          isDark
                            ? 'bg-[#18181D] hover:bg-[#27272A] text-zinc-300 hover:text-white border-[#27272A]'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Bubble Thread */}
              {followUpHistory.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-zinc-700/20 max-h-96 overflow-y-auto pr-1">
                  {followUpHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        item.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed ${
                          item.role === 'user'
                            ? 'bg-[#22C55E] text-white rounded-br-none shadow-md shadow-emerald-500/20'
                            : isDark
                            ? 'bg-[#18181D] text-zinc-200 border border-[#27272A] rounded-bl-none'
                            : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <div className="text-[10px] font-bold opacity-75 mb-1">
                          {item.role === 'user' ? 'You' : '🎓 AI Tutor'}
                        </div>
                        <MathRenderer content={item.text} />
                      </div>
                    </div>
                  ))}
                  {isFollowUpLoading && (
                    <div className="flex items-center space-x-2 text-xs text-emerald-400 p-2">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                      <span>Tutor is formulating response...</span>
                    </div>
                  )}
                  <div ref={followUpBottomRef} />
                </div>
              )}

              {/* Follow-up Question Input */}
              <div className="flex items-center space-x-2 pt-2">
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
                  placeholder={`Ask a follow-up about ${lesson.topic}...`}
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${
                    isDark
                      ? 'bg-[#000000] text-white border-[#27272A] focus:border-emerald-500'
                      : 'bg-white text-slate-900 border-slate-300 focus:border-emerald-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleFollowUpSubmit()}
                  disabled={isFollowUpLoading || !followUpQuestion.trim()}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer ${
                    isFollowUpLoading || !followUpQuestion.trim()
                      ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-60'
                      : 'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-md shadow-emerald-500/20'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ask</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Previously Studied Lessons Drawer / List (if lessons saved in history) */}
      {savedLessons.length > 0 && !isLoading && (
        <section
          className={`rounded-3xl border p-5 sm:p-6 shadow-xl space-y-3 ${
            isDark ? 'bg-[#0E0E12] border-[#27272A]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bookmark className="w-4 h-4 text-[#22C55E]" />
              <h4 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Recent Studied Topics ({savedLessons.length})
              </h4>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {savedLessons.slice(0, 6).map((saved, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setLesson(saved);
                  setTopicInput(saved.topic);
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
                  <span className="text-[10px] font-black uppercase text-emerald-400">
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
