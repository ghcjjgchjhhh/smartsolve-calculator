import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Award,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import { getHistory } from '../services/historyStorage';

interface TopicMastery {
  topic: string;
  category: 'Physics' | 'Mathematics' | 'Chemistry';
  score: number; // 0 - 100
  questionsAttempted: number;
  recommendation: string;
}

const DEFAULT_TOPICS: TopicMastery[] = [
  { topic: 'Mechanics & Motion Graphs', category: 'Physics', score: 88, questionsAttempted: 14, recommendation: 'Mastered! Review angular momentum and friction on inclines.' },
  { topic: 'Calculus & Derivatives', category: 'Mathematics', score: 72, questionsAttempted: 11, recommendation: 'Good progress. Practice quotient rule and definite integrals.' },
  { topic: 'Electricity & DC Circuits', category: 'Physics', score: 80, questionsAttempted: 9, recommendation: 'Strong understanding of Ohm’s law; practice Wheatstone bridge.' },
  { topic: 'Stoichiometry & Mole Concept', category: 'Chemistry', score: 65, questionsAttempted: 12, recommendation: 'Review limiting reactants and gas molar volumes at STP.' },
  { topic: 'Quadratic & Polynomials', category: 'Mathematics', score: 92, questionsAttempted: 16, recommendation: 'Excellent mastery of roots, vertices, and factorization.' },
  { topic: 'Waves, SHM & Optics', category: 'Physics', score: 58, questionsAttempted: 8, recommendation: 'Urgent attention: Practice resonance, Snell’s law, and wave velocity.' },
  { topic: 'Organic Chemistry & Esters', category: 'Chemistry', score: 74, questionsAttempted: 10, recommendation: 'Solid grasp of functional groups; practice isomer drawing.' },
];

export const ExamDiagnosticsView: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const [selectedSubject, setSelectedSubject] = useState<'All' | 'Physics' | 'Mathematics' | 'Chemistry'>('All');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const filteredTopics = useMemo(() => {
    if (selectedSubject === 'All') return DEFAULT_TOPICS;
    return DEFAULT_TOPICS.filter((t) => t.category === selectedSubject);
  }, [selectedSubject]);

  const aggregateScore = useMemo(() => {
    const total = filteredTopics.reduce((acc, t) => acc + t.score, 0);
    return Math.round(total / (filteredTopics.length || 1));
  }, [filteredTopics]);

  // Draw Radar / Spider Web Chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.36;

    const topics = DEFAULT_TOPICS;
    const numPoints = topics.length;
    const angleStep = (2 * Math.PI) / numPoints;

    // 1. Draw concentric polygon grid webs (20%, 40%, 60%, 80%, 100%)
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;

    for (let level = 1; level <= 5; level++) {
      const r = (radius / 5) * level;
      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const ang = i * angleStep - Math.PI / 2;
        const px = centerX + r * Math.cos(ang);
        const py = centerY + r * Math.sin(ang);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Percentage label along top axis
      ctx.fillStyle = '#52525B';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(`${level * 20}%`, centerX + 4, centerY - r + 3);
    }

    // 2. Draw Spokes from center to vertices
    ctx.strokeStyle = '#27272A';
    for (let i = 0; i < numPoints; i++) {
      const ang = i * angleStep - Math.PI / 2;
      const px = centerX + radius * Math.cos(ang);
      const py = centerY + radius * Math.sin(ang);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Topic label at vertex
      const labelDist = radius + 22;
      const lx = centerX + labelDist * Math.cos(ang);
      const ly = centerY + labelDist * Math.sin(ang);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const shortName = topics[i].topic.split('&')[0].trim();
      ctx.fillText(shortName, lx, ly);
    }

    // 3. Draw Student Data Polygon
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const ang = i * angleStep - Math.PI / 2;
      const frac = topics[i].score / 100;
      const r = radius * frac;
      const px = centerX + r * Math.cos(ang);
      const py = centerY + r * Math.sin(ang);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
    ctx.fill();
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Data points dots
    for (let i = 0; i < numPoints; i++) {
      const ang = i * angleStep - Math.PI / 2;
      const frac = topics[i].score / 100;
      const r = radius * frac;
      const px = centerX + r * Math.cos(ang);
      const py = centerY + r * Math.sin(ang);

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#22C55E';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Exam Readiness Radar & Weak-Topic Diagnostics
              </h2>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                AI Diagnostics
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1AA]">
              Syllabus mastery tracking across Mathematics, Physics, and Chemistry for JAMB / WAEC / JUPEB.
            </p>
          </div>
        </div>

        {/* Aggregate Readiness Score Badge */}
        <div className="flex items-center space-x-3 bg-[#18181B] px-4 py-2.5 rounded-2xl border border-[#27272A]">
          <div className="text-right">
            <span className="text-[10px] text-[#A1A1AA] uppercase font-bold block">Overall Readiness</span>
            <span className="text-xs font-bold text-[#22C55E]">High Proficiency</span>
          </div>
          <div className="text-2xl font-black text-white font-mono bg-[#22C55E]/20 text-[#22C55E] px-3 py-1 rounded-xl border border-[#22C55E]/30">
            {aggregateScore}%
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart */}
        <div className="lg:col-span-6 bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-2xl flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between text-xs text-[#A1A1AA] pb-2 border-b border-[#27272A]">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Syllabus Multi-Axis Radar</span>
            </span>
            <span className="text-[#22C55E] text-[11px] font-mono">Top: Quadratic (92%)</span>
          </div>

          <div className="relative w-full h-[320px] sm:h-[380px] my-2">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          <div className="text-center text-xs text-[#71717A]">
            Polygon vertices expand outward as your quiz scores and step-by-step problem accuracy increase.
          </div>
        </div>

        {/* Topic Breakdown Bars & Actionable Recommendations */}
        <div className="lg:col-span-6 space-y-3.5">
          {/* Subject Filter Pills */}
          <div className="flex items-center space-x-2 bg-[#18181B] p-1 rounded-2xl border border-[#27272A] text-xs font-semibold">
            {(['All', 'Mathematics', 'Physics', 'Chemistry'] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedSubject === sub ? 'bg-[#22C55E] text-white font-bold shadow-md' : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Topics List */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredTopics.map((t) => {
              const barColor =
                t.score >= 80 ? 'bg-[#22C55E]' : t.score >= 65 ? 'bg-[#38BDF8]' : t.score >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]';

              return (
                <div key={t.topic} className="p-3.5 rounded-2xl bg-[#0A0A0A] border border-[#27272A] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block text-sm">{t.topic}</span>
                      <span className="text-[10px] text-[#A1A1AA] font-mono">
                        {t.category} · {t.questionsAttempted} Questions Solved
                      </span>
                    </div>
                    <span className="text-sm font-black font-mono text-white">{t.score}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-[#18181B] overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${t.score}%` }} />
                  </div>

                  {/* Action Recommendation */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <p className="text-[#A1A1AA] italic line-clamp-1">{t.recommendation}</p>
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab('jamb')}
                        className="text-[#22C55E] hover:underline font-bold flex items-center space-x-1 shrink-0 ml-2 cursor-pointer"
                      >
                        <span>Practice</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
