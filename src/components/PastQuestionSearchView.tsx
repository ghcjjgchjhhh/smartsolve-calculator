import React, { useMemo, useState } from 'react';
import { Search, ShieldCheck, Sparkles, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { JAMB_QUESTIONS } from '../data/jambQuestions';
import { generateProceduralQuestion } from '../services/proceduralExamGenerator';
import { JambQuestion } from '../types';
import { MathRenderer } from './MathRenderer';

export const PastQuestionSearchView: React.FC = () => {
  const [mode, setMode] = useState<'verified' | 'generated'>('verified');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [examFilter, setExamFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  // Generated practice state (kept strictly separate from curated official questions)
  const [genSubject, setGenSubject] = useState<string>('Mathematics');
  const [genExam, setGenExam] = useState<string>('JAMB/UTME');
  const [genTopic, setGenTopic] = useState<string>('Quadratic Equations');
  const [generatedQuestions, setGeneratedQuestions] = useState<JambQuestion[]>([]);

  const subjects = useMemo(
    () => ['All', ...Array.from(new Set(JAMB_QUESTIONS.map((q) => q.subject)))],
    []
  );

  const years = useMemo(
    () =>
      [
        'All',
        ...Array.from(new Set(JAMB_QUESTIONS.map((q) => q.year || q.examYear).filter(Boolean) as string[])).sort().reverse(),
      ],
    []
  );

  const filteredVerified = useMemo(() => {
    const qLower = searchQuery.toLowerCase().trim();
    return JAMB_QUESTIONS.filter((item) => {
      if (subjectFilter !== 'All' && item.subject !== subjectFilter) return false;
      if (examFilter !== 'All') {
        const ex = (item.exam || '').toUpperCase();
        if (!ex.includes(examFilter)) return false;
      }
      const yr = item.year || item.examYear || '';
      if (yearFilter !== 'All' && yr !== yearFilter) return false;
      if (qLower) {
        const hay = `${item.question} ${item.topic} ${item.subject} ${item.formula} ${item.exam}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    });
  }, [searchQuery, subjectFilter, examFilter, yearFilter]);

  const handleGeneratePractice = () => {
    const items = Array.from({ length: 4 }, (_, idx) =>
      generateProceduralQuestion(genSubject, genTopic, genExam, 'SSS3 / 100-Level', 'Medium', idx)
    );
    setGeneratedQuestions(items);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Past Question Search Library
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
              Search curated JAMB, WAEC & JUPEB past questions by subject, topic, exam type, and year—generated questions are labeled separately.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#18181B]">
            <button
              type="button"
              onClick={() => setMode('verified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                mode === 'verified' ? 'bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Verified Archive ({JAMB_QUESTIONS.length})
            </button>
            <button
              type="button"
              onClick={() => setMode('generated')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                mode === 'generated' ? 'bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Generated Practice
            </button>
          </div>
        </div>

        {mode === 'verified' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keyword or topic..."
                className="w-full rounded-xl border border-slate-200 dark:border-[#27272A] pl-9 pr-3 py-2 text-xs sm:text-sm"
              />
            </div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs sm:text-sm"
            >
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs sm:text-sm"
            >
              <option value="All">All Exam Types</option>
              <option value="JAMB">JAMB / UTME</option>
              <option value="WAEC">WAEC / SSCE</option>
              <option value="JUPEB">JUPEB</option>
            </select>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs sm:text-sm"
            >
              {years.map((y) => (
                <option key={y}>{y === 'All' ? 'All Years' : y}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <select
              value={genSubject}
              onChange={(e) => setGenSubject(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs sm:text-sm"
            >
              <option>Mathematics</option>
              <option>Physics</option>
              <option>Chemistry</option>
              <option>Biology</option>
              <option>Economics</option>
            </select>
            <select
              value={genExam}
              onChange={(e) => setGenExam(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs sm:text-sm"
            >
              <option>JAMB/UTME</option>
              <option>WAEC/WASSCE</option>
              <option>JUPEB</option>
            </select>
            <input
              type="text"
              value={genTopic}
              onChange={(e) => setGenTopic(e.target.value)}
              placeholder="Topic focus..."
              className="flex-1 min-w-[180px] rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs sm:text-sm"
            />
            <button
              type="button"
              onClick={handleGeneratePractice}
              className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Practice Set</span>
            </button>
          </div>
        )}
      </section>

      {/* Results List */}
      <div className="space-y-4">
        {mode === 'verified' ? (
          filteredVerified.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-8 text-center text-sm text-slate-500">
              No verified archive questions match your filters. Try clearing your year or keyword filter.
            </div>
          ) : (
            filteredVerified.map((q) => (
              <QuestionCard
                key={q.id}
                q={q}
                provenanceLabel="Verified Curated Past Question"
                isVerified={true}
                selectedOpt={selectedAnswers[q.id]}
                onSelectOpt={(opt) => setSelectedAnswers((p) => ({ ...p, [q.id]: opt }))}
                isExpanded={expandedId === q.id}
                onToggleExpand={() => setExpandedId((cur) => (cur === q.id ? null : q.id))}
              />
            ))
          )
        ) : generatedQuestions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-8 text-center text-sm text-slate-500">
            Click <strong>Generate Practice Set</strong> above to create fresh syllabus drill problems (explicitly separated from official past questions).
          </div>
        ) : (
          generatedQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              provenanceLabel="Generated Practice Question (Not Official Past Paper)"
              isVerified={false}
              selectedOpt={selectedAnswers[q.id]}
              onSelectOpt={(opt) => setSelectedAnswers((p) => ({ ...p, [q.id]: opt }))}
              isExpanded={expandedId === q.id}
              onToggleExpand={() => setExpandedId((cur) => (cur === q.id ? null : q.id))}
            />
          ))
        )}
      </div>
    </div>
  );
};

const QuestionCard: React.FC<{
  q: JambQuestion;
  provenanceLabel: string;
  isVerified: boolean;
  selectedOpt?: string;
  onSelectOpt: (opt: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ q, provenanceLabel, isVerified, selectedOpt, onSelectOpt, isExpanded, onToggleExpand }) => {
  const year = q.year || q.examYear;
  return (
    <article className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-slate-500 dark:text-[#A1A1AA] font-medium">
          {q.subject} · {q.topic} · {q.exam}
          {year ? ` (${year})` : ''}
        </div>
        <div className={`flex items-center gap-1 font-semibold ${isVerified ? 'text-[#22C55E]' : 'text-amber-500'}`}>
          {isVerified ? <ShieldCheck className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{provenanceLabel}</span>
        </div>
      </div>

      <div className="text-sm sm:text-base font-medium text-slate-900 dark:text-white">
        <MathRenderer content={q.question} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(['A', 'B', 'C', 'D'] as const).map((key) => {
          const isChosen = selectedOpt === key;
          const isCorrect = q.correctAnswer === key;
          const showFeedback = Boolean(selectedOpt);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectOpt(key)}
              className={`text-left p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                showFeedback && isCorrect
                  ? 'border-[#22C55E] bg-[#22C55E]/10 text-slate-900 dark:text-white'
                  : showFeedback && isChosen && !isCorrect
                  ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                  : 'border-slate-200 dark:border-[#27272A] hover:bg-slate-50 dark:hover:bg-[#121216]'
              }`}
            >
              <span>
                <strong className="mr-2 font-mono">{key}.</strong>
                <MathRenderer content={q.options[key]} />
              </span>
              {showFeedback && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />}
              {showFeedback && isChosen && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="pt-1 flex items-center justify-between">
        <span className="text-xs font-mono text-slate-500">Formula: {q.formula}</span>
        <button
          type="button"
          onClick={onToggleExpand}
          className="text-xs font-bold text-[#22C55E] flex items-center gap-1 cursor-pointer"
        >
          <span>{isExpanded ? 'Hide Solution' : 'View Step Solution'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-4 space-y-2 text-xs sm:text-sm">
          <div className="font-bold text-[#22C55E]">Correct Option: {q.correctAnswer}</div>
          <ol className="space-y-1.5 list-decimal list-inside text-slate-700 dark:text-zinc-300">
            {q.steps.map((s, idx) => (
              <li key={idx}>
                <MathRenderer content={s} />
              </li>
            ))}
          </ol>
          <p className="text-xs text-slate-600 dark:text-[#A1A1AA] pt-1">{q.explanation}</p>
        </div>
      )}
    </article>
  );
};
