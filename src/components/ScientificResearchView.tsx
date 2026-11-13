import React, { useState } from 'react';
import {
  Microscope,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { ScientificDiagramRenderer } from './ScientificDiagramRenderer';
import { ScientificDiagramData } from '../types';
import { detectAndGenerateDiagram } from '../services/aiDiagramDetector';

interface ResearchBrief {
  title: string;
  discipline: string;
  summary: string;
  establishedConsensus: Array<{ claim: string; evidence: string }>;
  uncertainOrFrontier: Array<{ topic: string; status: string; explanation: string }>;
  keyEquations: Array<{ name: string; latex: string; variables: string }>;
  landmarkExperiments: Array<{ year: string; scientist: string; experiment: string; finding: string }>;
  workedExample?: { problem: string; steps: string[]; answer: string };
  diagram?: ScientificDiagramData;
}

const FEATURED_TOPICS = [
  { label: 'Photoelectric Effect', discipline: 'Physics' },
  { label: 'Newton’s Law of Universal Gravitation vs General Relativity', discipline: 'Physics' },
  { label: 'Double-Slit Wave-Particle Duality', discipline: 'Physics' },
  { label: 'CRISPR-Cas9 Gene Editing', discipline: 'Biology' },
  { label: 'Haber-Bosch Equilibrium Process', discipline: 'Chemistry' },
  { label: 'Dark Matter & Galaxy Rotation Curves', discipline: 'Astronomy' },
];

export const ScientificResearchView: React.FC = () => {
  const [query, setQuery] = useState<string>(FEATURED_TOPICS[0].label);
  const [discipline, setDiscipline] = useState<string>('Physics');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [brief, setBrief] = useState<ResearchBrief | null>(null);

  const runResearch = async (targetQuery: string, targetDiscipline: string) => {
    if (!targetQuery.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQuery.trim(), discipline: targetDiscipline }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.research) {
        throw new Error(data?.error || 'Could not generate research brief.');
      }
      const research = data.research;
      if (!research.diagram) {
        const diag = detectAndGenerateDiagram(
          {
            title: research.title || targetQuery,
            formula: research.keyEquations?.[0]?.latex || '',
            problemStatement: research.summary || targetQuery,
            steps: (research.workedExample?.steps || []) as string[],
          } as any,
          targetQuery
        );
        if (diag) research.diagram = diag;
      }
      setBrief(research);
    } catch (err: any) {
      setError(err?.message || 'Error retrieving scientific research synthesis.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Scientific Research Mode
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
            Explore scientific laws, landmark experiments, and equations—with established empirical facts strictly separated from frontier uncertainties.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runResearch(query, discipline);
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white"
          >
            <option>Physics</option>
            <option>Chemistry</option>
            <option>Biology</option>
            <option>Mathematics</option>
            <option>Astronomy</option>
          </select>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter any scientific law, discovery, experiment, or theory..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{isLoading ? 'Synthesizing...' : 'Research Concept'}</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {FEATURED_TOPICS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setQuery(item.label);
                setDiscipline(item.discipline);
                void runResearch(item.label, item.discipline);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181B] cursor-pointer"
            >
              {item.label}
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

      {brief && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#A1A1AA]">
              <Microscope className="w-4 h-4 text-[#22C55E]" />
              <span>{brief.discipline}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{brief.title}</h3>
            <div className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
              <MathRenderer content={brief.summary} />
            </div>
          </section>

          {/* Epistemic Split: Established Consensus vs Uncertain/Frontier */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-[#0A0A0A] p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#22C55E]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Established Scientific Consensus</span>
              </div>
              <div className="space-y-3">
                {(brief.establishedConsensus || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3.5 space-y-1.5 text-xs sm:text-sm"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white">
                      <MathRenderer content={item.claim} />
                    </div>
                    <div className="text-xs text-slate-600 dark:text-[#A1A1AA]">
                      <strong>Empirical Basis:</strong> <MathRenderer content={item.evidence} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-amber-500/30 bg-white dark:bg-[#0A0A0A] p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-500">
                <AlertTriangle className="w-4 h-4" />
                <span>Uncertain, Boundary & Frontier Questions</span>
              </div>
              <div className="space-y-3">
                {(brief.uncertainOrFrontier || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3.5 space-y-1.5 text-xs sm:text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{item.topic}</span>
                      <span className="text-[11px] font-mono text-amber-500 shrink-0">{item.status}</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-[#A1A1AA]">
                      <MathRenderer content={item.explanation} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Equations & Landmark Experiments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Governing Equations</h4>
              <div className="space-y-3">
                {(brief.keyEquations || []).map((eq, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 dark:border-[#27272A] p-3.5 space-y-2">
                    <div className="text-xs font-bold text-[#22C55E]">{eq.name}</div>
                    <div className="overflow-x-auto">
                      <MathRenderer content={`$$${eq.latex.replace(/^\$\$|\$\$$/g, '')}$$`} />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#A1A1AA]">
                      <MathRenderer content={eq.variables} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#22C55E]" />
                <span>Landmark Discoveries & Experiments</span>
              </h4>
              <div className="space-y-3">
                {(brief.landmarkExperiments || []).map((exp, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 dark:border-[#27272A] p-3.5 space-y-1">
                    <div className="text-xs text-slate-500 dark:text-[#A1A1AA] font-mono tabular-nums">
                      {exp.year} · {exp.scientist}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{exp.experiment}</div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300">{exp.finding}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {brief.diagram && (
            <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5">
              <ScientificDiagramRenderer diagram={brief.diagram} />
            </section>
          )}

          {brief.workedExample && brief.workedExample.problem && (
            <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-3">
              <h4 className="text-sm font-bold text-[#22C55E]">Worked Quantitative Example</h4>
              <div className="text-sm text-slate-900 dark:text-white font-medium">
                <MathRenderer content={brief.workedExample.problem} />
              </div>
              <ol className="space-y-2">
                {(brief.workedExample.steps || []).map((s, i) => (
                  <li key={i} className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 rounded-lg border border-slate-200 dark:border-[#27272A] p-3">
                    <MathRenderer content={s} />
                  </li>
                ))}
              </ol>
              {brief.workedExample.answer && (
                <div className="rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/40 p-3 text-sm">
                  <MathRenderer content={brief.workedExample.answer} />
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
