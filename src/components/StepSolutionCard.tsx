import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StepSolution } from '../types';
import { saveToHistory } from '../services/historyStorage';
import { Check, Copy, Bookmark, BookmarkCheck, Printer, Volume2, VolumeX, Pause, Play, Sparkles } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { ScientificDiagramRenderer } from './ScientificDiagramRenderer';
import { detectAndGenerateDiagram } from '../services/aiDiagramDetector';
import { InteractiveSolverGraph } from './InteractiveSolverGraph';
import { detectAndEnhanceGraphs } from '../services/aiGraphDetector';

interface Props {
  solution: StepSolution;
  onClose?: () => void;
  onGenerateSimilar?: (solution: StepSolution) => void;
}

export const StepSolutionCard: React.FC<Props> = ({ solution, onGenerateSimilar }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [speechState, setSpeechState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [speechProgress, setSpeechProgress] = useState<string>('');
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const activeGraphs = useMemo(() => {
    if (solution.graphs && solution.graphs.length > 0) return solution.graphs;
    return detectAndEnhanceGraphs(solution);
  }, [solution]);

  const activeDiagram = useMemo(() => {
    // If the problem is a GRAPH problem, prioritize the GRAPH and DO NOT draw an unrelated diagram
    if (activeGraphs && activeGraphs.length > 0) return null;
    return solution.diagram || detectAndGenerateDiagram(solution);
  }, [solution, activeGraphs]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [solution]);

  const convertToSpokenText = (text: string): string => {
    return text
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
      .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\times|\\cdot/g, ' multiplied by ')
      .replace(/\\pm/g, ' plus or minus ')
      .replace(/\\approx/g, ' approximately ')
      .replace(/\\le/g, ' less than or equal to ')
      .replace(/\\ge/g, ' greater than or equal to ')
      .replace(/\\ne/g, ' not equal to ')
      .replace(/m\/s\^2/gi, ' meters per second squared ')
      .replace(/m\/s/gi, ' meters per second ')
      .replace(/\^2/g, ' squared ')
      .replace(/\^3/g, ' cubed ')
      .replace(/[\$\\]/g, ' ')
      .replace(/[{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (speechState === 'playing') {
      window.speechSynthesis.pause();
      setSpeechState('paused');
      return;
    }

    if (speechState === 'paused') {
      window.speechSynthesis.resume();
      setSpeechState('playing');
      return;
    }

    // Prepare complete narrated speech
    window.speechSynthesis.cancel();
    const spokenParts: string[] = [];

    if (solution.problemStatement) {
      spokenParts.push(`Problem: ${convertToSpokenText(solution.problemStatement)}.`);
    }

    if (solution.steps && solution.steps.length > 0) {
      solution.steps.forEach((st, i) => {
        spokenParts.push(`Step ${i + 1}: ${convertToSpokenText(st)}.`);
      });
    } else if (solution.substitution) {
      spokenParts.push(`Working: ${convertToSpokenText(solution.substitution)}.`);
    }

    spokenParts.push(`Final answer: ${convertToSpokenText(solution.finalAnswer)}.`);

    if (solution.explanation) {
      spokenParts.push(`Explanation: ${convertToSpokenText(solution.explanation)}.`);
    }

    const fullSpokenScript = spokenParts.join(' ');
    const utterance = new SpeechSynthesisUtterance(fullSpokenScript);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setSpeechState('playing');
      setSpeechProgress('Playing audio narration...');
    };

    utterance.onend = () => {
      setSpeechState('idle');
      setSpeechProgress('');
    };

    utterance.onerror = () => {
      setSpeechState('idle');
      setSpeechProgress('');
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeechState('idle');
    setSpeechProgress('');
  };

  const handlePracticeSimilar = () => {
    if (onGenerateSimilar) {
      onGenerateSimilar(solution);
    } else {
      window.dispatchEvent(new CustomEvent('smartsolve:generate-similar', { detail: solution }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const copySolutionText = () => {
    const text = `
${solution.problemStatement ? `${solution.problemStatement}\n\n` : ''}${solution.steps.join('\n\n')}

Answer: ${solution.finalAnswer}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveToHistory(solution);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Prepare clean boxed answer LaTeX matching official textbook & WAEC standards
  const formatBoxedAnswer = () => {
    let ans = solution.finalAnswer.trim();

    // Clean up any trailing broken LaTeX syntax like \tex, \text, \t, or trailing backslash
    ans = ans.replace(/\\(?:text|tex|te|t)?\s*$/i, '').trim();

    // Remove trailing dot
    if (ans.endsWith('.')) {
      ans = ans.slice(0, -1).trim();
    }

    // Wrap common bare words in \text{...} inside subscripts (e.g. v_{avg} -> v_{\text{avg}})
    ans = ans.replace(/_([a-zA-Z]{2,})\b/g, '_{\\text{$1}}');
    ans = ans.replace(/_\{([a-zA-Z]{2,})\}/g, '_{\\text{$1}}');

    // Ensure bare words at beginning of equations are wrapped in \text{} (e.g. deceleration = 3 m/s^2)
    ans = ans.replace(/\b(deceleration|acceleration|distance|velocity|speed|height|work|energy|force|power|mass|area|volume)\b(?!\s*\{)/gi, '\\text{$1}');

    // If answer already contains \boxed{...}, fix unclosed braces and format multi-part commas
    if (ans.includes('\\boxed')) {
      // Ensure proper mathematical spacing for comma-separated items
      ans = ans.replace(/,(?!\s*\\quad)\s*/g, ',\\quad ');

      const openCount = (ans.match(/\{/g) || []).length;
      const closeCount = (ans.match(/\}/g) || []).length;
      if (openCount > closeCount) {
        ans = ans + '}'.repeat(openCount - closeCount);
      }
      return ans;
    }

    // If not boxed yet, format commas with \quad spacing
    ans = ans.replace(/,(?!\s*\\quad)\s*/g, ',\\quad ');

    // Only append unit for single numeric answers where unit is not already present
    if (
      solution.unit &&
      solution.unit.toLowerCase() !== 'none' &&
      solution.unit.toLowerCase() !== 'n/a' &&
      !ans.includes(solution.unit) &&
      !ans.includes(',') &&
      !ans.includes(';')
    ) {
      ans = `${ans}\\text{ ${solution.unit}}`;
    }

    // Check if it's purely text (e.g. "No real value of x" or "No real solution")
    if (/^[a-zA-Z\s]+$/.test(ans)) {
      return `\\boxed{\\text{${ans}}}`;
    }
    return `\\boxed{${ans}}`;
  };

  // Parse each step into clean section header, display equation, or textbook explanation
  const renderCleanStep = (rawStep: string, idx: number) => {
    let s = rawStep.trim();

    // 1. Detect major Sub-Problem / Sub-Part Headers (e.g. "Part 1: The Acceleration of the Car", "1. Acceleration:", "(a) Initial speed:")
    const subPartMatch = s.match(/^(?:Part\s*([0-9a-zA-Z]+)|(?:(?:Step\s*)?(\d+|[a-zA-Z])[\).]))\s*[:.-]?\s*(.+)$/i);
    if (subPartMatch) {
      const partNum = subPartMatch[1] || subPartMatch[2];
      const partTitle = subPartMatch[3]?.trim();
      // If partTitle is descriptive text and not an isolated standalone equation
      if (partTitle && !partTitle.startsWith('$$') && partTitle.length > 2) {
        return (
          <div key={idx} className="pt-6 pb-2 border-t border-[#27272A]/80 first:border-0 first:pt-1">
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-[#22C55E]/15 text-[#22C55E] font-bold text-xs uppercase tracking-wider border border-[#22C55E]/30 font-mono">
                Part {partNum}
              </span>
              <span className="font-bold text-[#FFFFFF] text-sm sm:text-base tracking-tight">
                {partTitle}
              </span>
            </div>
          </div>
        );
      }
    }

    // Strip generic "Step 1:", "Step 2:" prefixes from inner calculation steps
    s = s.replace(/^(?:Step\s*\d+[:.]?)\s*/i, '').trim();

    // 2. Short transitional or step labels (e.g. "Formula:", "Substitution:", "Calculation:", "Squaring both sides:")
    if (/^[A-Za-z\s]+:$/.test(s)) {
      return (
        <div key={idx} className="text-xs sm:text-sm font-semibold text-[#A1A1AA] pt-2 uppercase tracking-wide">
          {s}
        </div>
      );
    }

    // 3. Description followed by an equation (e.g. "Formula: a = (v - u) / t")
    const colonSplit = s.match(/^([^:=]+):\s*([^:]+)$/);
    if (colonSplit && /[=+\-*/^_\\]/.test(colonSplit[2])) {
      const desc = colonSplit[1].trim();
      const eq = colonSplit[2].trim();
      return (
        <div key={idx} className="space-y-1.5 pt-1 min-w-0 max-w-full">
          <div className="text-xs sm:text-sm font-medium text-[#D4D4D8] break-words">
            {desc}:
          </div>
          <div className="py-2 px-3 rounded-2xl bg-[#09090B] border border-[#27272A]/70 text-center formula-scroll-container shadow-inner min-w-0 max-w-full overflow-x-auto">
            <MathRenderer content={eq} displayMode={true} />
          </div>
        </div>
      );
    }

    // 4. Pure equation check
    const isPureEquation =
      s.startsWith('$$') ||
      s.startsWith('\\') ||
      (!s.includes(' ') && /[=]/.test(s)) ||
      (/^[a-zA-Z0-9\s+\-*/^_.=()\\[\]{}]+$/.test(s) &&
        /[=]/.test(s) &&
        !/\b(the|is|and|or|for|to|of|in|at|from|with|by|let|since|therefore|first|finally|substitute)\b/i.test(
          s
        ));

    if (isPureEquation) {
      return (
        <div key={idx} className="py-2.5 px-3 my-1 rounded-2xl bg-[#09090B] border border-[#27272A]/70 text-center formula-scroll-container shadow-inner min-w-0 max-w-full overflow-x-auto">
          <MathRenderer content={s} displayMode={true} />
        </div>
      );
    }

    // 5. Natural text explanation with potential inline math ($...$)
    return (
      <div key={idx} className="text-sm sm:text-base font-normal text-[#E4E4E7] leading-relaxed py-1 break-words min-w-0 max-w-full">
        <MathRenderer content={s} />
      </div>
    );
  };

  return (
    <div className="bg-[#000000] border border-[#27272A] rounded-3xl p-6 sm:p-8 shadow-2xl relative transition-all text-[#FFFFFF] max-w-full overflow-hidden">
      {/* Discreet Action Toolbar in Top Right */}
      <div className="flex items-center justify-between pb-4 border-b border-[#27272A]/60 mb-6">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
          <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">
            {solution.category || 'Mathematics'} {solution.subCategory ? `· ${solution.subCategory}` : ''}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 print:hidden">
          {/* Spoken Audio Narration */}
          <div className="flex items-center bg-[#121214] border border-[#27272A] rounded-xl px-1.5 py-0.5">
            <button
              onClick={handleToggleSpeech}
              title={speechState === 'playing' ? 'Pause audio narration' : speechState === 'paused' ? 'Resume audio' : 'Listen to solution'}
              className="p-1 hover:bg-[#27272A] rounded-lg text-[#22C55E] hover:text-[#4ADE80] transition-colors cursor-pointer flex items-center space-x-1"
            >
              {speechState === 'playing' ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold text-[#22C55E]">Pause</span>
                </>
              ) : speechState === 'paused' ? (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold text-[#22C55E]">Resume</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline font-semibold">Listen</span>
                </>
              )}
            </button>
            {speechState !== 'idle' && (
              <button
                onClick={handleStopSpeech}
                title="Stop narration"
                className="p-1 hover:bg-[#27272A] rounded-lg text-[#EF4444] hover:text-[#F87171] transition-colors cursor-pointer ml-0.5"
              >
                <VolumeX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={handlePrint}
            title="Print or Save PDF Worksheet"
            className="p-1.5 hover:bg-[#18181B] rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer flex items-center space-x-1"
          >
            <Printer className="w-4 h-4" />
            <span className="text-[10px] hidden sm:inline font-semibold">Print / PDF</span>
          </button>
          <button
            onClick={copySolutionText}
            title="Copy full solution"
            className="p-1.5 hover:bg-[#18181B] rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSave}
            title="Save to history"
            className="p-1.5 hover:bg-[#18181B] rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
          >
            {saved ? <BookmarkCheck className="w-4 h-4 text-[#22C55E]" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Clean Mathematical Solution Flow Matching Screenshot 1 */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Given Problem Expression (Centered Display) */}
        {solution.problemStatement && (
          <div className="pb-3 text-center formula-scroll-container">
            <MathRenderer content={solution.problemStatement} displayMode={true} />
          </div>
        )}

        {/* Given values & Required summary if structured */}
        {(solution.givenValues && solution.givenValues.length > 0) && (
          <div className="p-3.5 rounded-xl bg-[#0A0A0A] border border-[#27272A] space-y-1.5 text-xs text-[#A1A1AA]">
            <span className="font-bold text-[#FFFFFF] uppercase tracking-wider block text-[11px]">
              Given Values:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {solution.givenValues.map((gv, i) => (
                <div key={i} className="flex items-center justify-between bg-[#121212] px-2.5 py-1.5 rounded-lg border border-[#27272A]/50">
                  <span className="text-[#A1A1AA]">{gv.name} ({gv.symbol}):</span>
                  <span className="font-mono text-[#FFFFFF] font-bold">{gv.value} {gv.unit || ''}</span>
                </div>
              ))}
            </div>
            {solution.whatIsRequired && (
              <div className="pt-1 text-white flex items-center space-x-1.5">
                <span className="font-bold text-[#A1A1AA]">Required:</span>
                <span className="font-semibold text-white">{solution.whatIsRequired}</span>
              </div>
            )}
          </div>
        )}

        {/* Automated Interactive Mathematical / Physics Graph */}
        {activeGraphs && activeGraphs.length > 0 && (
          <div className="py-2 animate-fadeIn">
            <div className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Accurate Mathematical & Kinematics Graph</span>
            </div>
            <InteractiveSolverGraph
              graphs={activeGraphs}
              graphExplanation={solution.graphExplanation}
              missingInformation={solution.missingInformation}
              problemContext={`${solution.title || ''} ${solution.problemStatement || ''} ${(solution.steps || []).join(' ')}`}
            />
          </div>
        )}

        {/* Automated Mathematical Diagram / Physics Visual Illustration */}
        {activeDiagram && (
          <div className="py-2 animate-fadeIn">
            <div className="text-[11px] font-bold text-[#22C55E] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Accurate Geometric & Physical Diagram</span>
            </div>
            <ScientificDiagramRenderer diagram={activeDiagram} />
          </div>
        )}

        {/* Steps: Clear, unboxed mathematical derivation flow */}
        {solution.steps && solution.steps.length > 0 ? (
          solution.steps.map((step, idx) => renderCleanStep(step, idx))
        ) : (
          solution.substitution && (
            <div className="py-2 text-center formula-scroll-container">
              <MathRenderer content={solution.substitution} displayMode={true} />
            </div>
          )
        )}

        {/* Boxed Final Answer Exactly Like Screenshot 1 */}
        <div className="pt-6 pb-2 text-center formula-scroll-container">
          <div className="inline-block py-2 max-w-full">
            <MathRenderer content={formatBoxedAnswer()} displayMode={true} />
          </div>
        </div>

        {/* Live Audio Narration Status Bar */}
        {speechState !== 'idle' && (
          <div className="p-3 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-between animate-fadeIn text-xs text-[#22C55E]">
            <div className="flex items-center space-x-2.5">
              <span className="flex space-x-1 items-end h-3">
                <span className="w-1 bg-[#22C55E] h-2 animate-bounce"></span>
                <span className="w-1 bg-[#22C55E] h-3 animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-1 bg-[#22C55E] h-1.5 animate-bounce [animation-delay:0.3s]"></span>
              </span>
              <span className="font-semibold">{speechProgress || (speechState === 'playing' ? 'Narrating solution...' : 'Audio paused')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleSpeech}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#22C55E]/20 hover:bg-[#22C55E]/30 text-white font-medium cursor-pointer"
              >
                {speechState === 'playing' ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={handleStopSpeech}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] font-medium cursor-pointer"
              >
                Stop
              </button>
            </div>
          </div>
        )}

        {/* Practice Similar Problem Quick-Action */}
        <div className="pt-2 print:hidden">
          <button
            onClick={handlePracticeSimilar}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#22C55E]/15 via-[#10B981]/20 to-[#3B82F6]/15 hover:from-[#22C55E]/25 hover:to-[#3B82F6]/25 border border-[#22C55E]/30 text-white text-xs sm:text-sm font-semibold transition-all shadow-lg hover:shadow-[#22C55E]/10 cursor-pointer active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 text-[#22C55E]" />
            <span>Generate Similar Practice Problem</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] font-mono uppercase ml-1">AI Powered</span>
          </button>
        </div>

        {/* Optional Conceptual Note / Exam Tip at bottom */}
        {(solution.explanation || solution.tips) && (
          <div className="mt-8 pt-4 border-t border-[#27272A]/60 space-y-2 text-xs text-[#A1A1AA]">
            {solution.explanation && (
              <p className="leading-relaxed">
                <span className="font-semibold text-[#FFFFFF]">Note: </span>
                {solution.explanation}
              </p>
            )}
            {solution.tips && (
              <p className="leading-relaxed">
                <span className="font-semibold text-white">Tip: </span>
                {solution.tips}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
