import React, { useCallback, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Square,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { MathRenderer } from './MathRenderer';
import {
  computeDeterministically,
  normalizeSpokenMathToExpression,
} from '../services/deterministicSolver';

interface VoiceMathResult {
  spokenInterpretation: string;
  latex: string;
  evaluableExpression?: string;
  plotExpression?: string;
  subject?: string;
  steps: string[];
  finalAnswerLatex: string;
  finalAnswerPlain?: string;
  verifiedDeterministic?: boolean;
}

interface Props {
  onOpenInGemini?: (prompt: string, subject?: string) => void;
}

const SAMPLE_PHRASES = [
  'What is the square root of 144 plus 5 cubed divided by 25',
  'Integral of x squared from 0 to 3 dx',
  'Solve 2 x squared minus 5 x minus 3 equals 0',
  'Find gravitational force between 10 kg and 20 kg separated by 2 meters',
];

export const VoiceToMathView: React.FC<Props> = ({ onOpenInGemini }) => {
  const [transcript, setTranscript] = useState<string>('');
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<VoiceMathResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const onTranscriptUpdate = useCallback((chunk: string) => {
    setTranscript((prev) => {
      const cleanedPrev = prev.trim();
      if (!cleanedPrev) return chunk;
      // Avoid repeating trailing interim duplicates
      if (chunk.toLowerCase().startsWith(cleanedPrev.toLowerCase())) return chunk;
      return `${cleanedPrev} ${chunk}`;
    });
  }, []);

  const { isListening, isSupported, voiceError, toggleListening } = useVoiceInput(onTranscriptUpdate);

  const solveTranscript = async (textToSolve: string, audioBase64?: string, audioMimeType?: string) => {
    if (!textToSolve.trim() && !audioBase64) {
      setError('Please dictate a question or speak/type a mathematical phrase first.');
      return;
    }

    setIsSolving(true);
    setError('');

    // Fast deterministic path when spoken phrase reduces directly to evaluable arithmetic
    if (textToSolve.trim() && !audioBase64) {
      const normalized = normalizeSpokenMathToExpression(textToSolve);
      const det = computeDeterministically(normalized);
      if (det.computed && det.valueText) {
        setResult({
          spokenInterpretation: textToSolve.trim(),
          latex: normalized,
          evaluableExpression: normalized,
          subject: 'Mathematics (Deterministic)',
          steps: det.steps || [`Evaluated ${normalized} = ${det.valueText}`],
          finalAnswerLatex: `\\boxed{${det.valueText}}`,
          finalAnswerPlain: det.valueText,
          verifiedDeterministic: true,
        });
        setIsSolving(false);
        return;
      }
    }

    try {
      const resp = await fetch('/api/voice-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textToSolve.trim(),
          audioBase64,
          audioMimeType,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.result) {
        throw new Error(data?.error || 'Could not convert spoken math.');
      }

      const parsed: VoiceMathResult = { ...data.result };

      // Verify arithmetic locally via deterministic engine if expression is purely evaluable
      if (parsed.evaluableExpression) {
        const detCheck = computeDeterministically(parsed.evaluableExpression);
        if (detCheck.computed && detCheck.valueText) {
          parsed.finalAnswerPlain = detCheck.valueText;
          parsed.finalAnswerLatex = `\\boxed{${detCheck.valueText}}`;
          parsed.verifiedDeterministic = true;
        }
      } else if (parsed.latex) {
        const detLatex = computeDeterministically(parsed.latex);
        if (detLatex.computed && detLatex.valueText) {
          parsed.finalAnswerPlain = detLatex.valueText;
          parsed.finalAnswerLatex = `\\boxed{${detLatex.valueText}}`;
          parsed.verifiedDeterministic = true;
        }
      }

      if (parsed.spokenInterpretation && !transcript.trim()) {
        setTranscript(parsed.spokenInterpretation);
      }
      setResult(parsed);
    } catch (err: any) {
      setError(err?.message || 'Failed to process voice math.');
    } finally {
      setIsSolving(false);
    }
  };

  const toggleAudioRecording = async () => {
    if (isRecordingAudio) {
      mediaRecorderRef.current?.stop();
      setIsRecordingAudio(false);
      return;
    }

    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = String(reader.result || '');
          void solveTranscript('', base64, mimeType);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingAudio(true);
    } catch (err: any) {
      setError(err?.message || 'Microphone access denied or unavailable.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Voice-to-Mathematics Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
            Speak equations, calculus expressions, or physics questions naturally — formatted into LaTeX and solved with verified arithmetic.
          </p>
        </div>

        {/* Voice Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleListening}
            disabled={!isSupported}
            className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-[#22C55E] hover:bg-[#16A34A] text-white disabled:opacity-40'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isListening ? 'Stop Dictation' : 'Start Live Dictation'}</span>
          </button>

          <button
            type="button"
            onClick={toggleAudioRecording}
            className={`px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              isRecordingAudio
                ? 'border-rose-500 bg-rose-500/15 text-rose-500'
                : 'border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-[#18181B]'
            }`}
          >
            {isRecordingAudio ? <Square className="w-4 h-4" /> : <Radio className="w-4 h-4 text-[#22C55E]" />}
            <span>{isRecordingAudio ? 'Stop & Transcribe Audio' : 'Record Voice Clip (AI Audio)'}</span>
          </button>

          {transcript && (
            <button
              type="button"
              onClick={() => {
                setTranscript('');
                setResult(null);
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#27272A] text-xs font-semibold text-slate-500 hover:text-rose-500 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {(voiceError || error) && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error || voiceError}</span>
          </div>
        )}

        {/* Spoken Transcript Input & Convert Button */}
        <div className="space-y-3">
          <textarea
            rows={3}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder='Speak or type naturally, e.g. "Integral of x squared from 0 to 3 dx" or "Three quarters plus square root of 16"'
            className="w-full rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => {
                    setTranscript(phrase);
                    void solveTranscript(phrase);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181B] cursor-pointer text-left"
                >
                  {phrase}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => solveTranscript(transcript)}
              disabled={isSolving || !transcript.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white text-sm font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {isSolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isSolving ? 'Converting...' : 'Format & Solve'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Output Card */}
      {result && (
        <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#27272A] pb-3">
            <div className="text-xs text-slate-500 dark:text-[#A1A1AA]">
              {result.subject || 'Mathematics'} · Spoken Form: “{result.spokenInterpretation}”
            </div>
            {result.verifiedDeterministic && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Computation</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-[#A1A1AA] mb-2">
              Formatted Mathematical Equation
            </div>
            <div className="overflow-x-auto">
              <MathRenderer content={`$$${result.latex.replace(/^\$\$|\$\$$/g, '')}$$`} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white">Step-by-Step Working</div>
            <ol className="space-y-2">
              {(result.steps || []).map((st, idx) => (
                <li
                  key={idx}
                  className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 rounded-xl border border-slate-200 dark:border-[#27272A] p-3"
                >
                  <MathRenderer content={st} />
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#22C55E] mb-1">Final Answer</div>
              <MathRenderer content={`$$${result.finalAnswerLatex.replace(/^\$\$|\$\$$/g, '')}$$`} />
            </div>
            {onOpenInGemini && (
              <button
                type="button"
                onClick={() => onOpenInGemini(result.spokenInterpretation || result.latex, result.subject)}
                className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
              >
                <span>Open Full Tutor View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
