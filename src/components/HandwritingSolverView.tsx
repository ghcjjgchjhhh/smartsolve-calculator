import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  PenTool,
  Eraser,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { computeDeterministically } from '../services/deterministicSolver';

interface HandwritingResult {
  recognizedText: string;
  recognizedLatex: string;
  evaluableExpression?: string;
  detectedSymbols?: string[];
  confidenceNotes?: string;
  steps: string[];
  finalAnswerLatex: string;
  finalAnswerPlain?: string;
  verifiedDeterministic?: boolean;
}

interface Props {
  onOpenInGemini?: (prompt: string) => void;
}

export const HandwritingSolverView: React.FC<Props> = ({ onOpenInGemini }) => {
  const [inputMode, setInputMode] = useState<'draw' | 'upload'>('draw');
  const padRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef<boolean>(false);
  const [padTool, setPadTool] = useState<'pen' | 'eraser'>('pen');

  const [uploadedPreview, setUploadedPreview] = useState<string>('');
  const [uploadedMime, setUploadedMime] = useState<string>('image/png');
  const [note, setNote] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<HandwritingResult | null>(null);
  const [editableLatex, setEditableLatex] = useState<string>('');

  const clearPad = () => {
    const c = padRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, c.width, c.height);
    // Faint ruled lines for clean handwriting
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let y = 60; y < c.height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(c.width, y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (inputMode === 'draw') {
      clearPad();
    }
  }, [inputMode]);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = padRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * c.width,
      y: ((e.clientY - rect.top) / rect.height) * c.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = padRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    c.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const pt = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const c = padRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const pt = getCoords(e);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = padTool === 'eraser' ? '#FFFFFF' : '#0F172A';
    ctx.lineWidth = padTool === 'eraser' ? 22 : 4;
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    try {
      padRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    setUploadedMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPreview(String(reader.result || ''));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const compressImageDataUrl = (dataUrl: string, maxDim = 1280): Promise<{ dataUrl: string; mime: string }> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
        const ctx = off.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl, mime: uploadedMime });
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ dataUrl: off.toDataURL('image/jpeg', 0.85), mime: 'image/jpeg' });
      };
      img.onerror = () => resolve({ dataUrl, mime: uploadedMime });
      img.src = dataUrl;
    });

  const handleRecognize = async () => {
    setError('');
    let imageBase64 = '';
    let mimeType = uploadedMime;

    if (inputMode === 'draw') {
      if (!padRef.current) return;
      imageBase64 = padRef.current.toDataURL('image/jpeg', 0.88);
      mimeType = 'image/jpeg';
    } else {
      if (!uploadedPreview) {
        setError('Please upload a handwritten mathematics image first.');
        return;
      }
      const compressed = await compressImageDataUrl(uploadedPreview);
      imageBase64 = compressed.dataUrl;
      mimeType = compressed.mime;
    }

    setIsAnalyzing(true);
    try {
      const resp = await fetch('/api/handwriting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          note: note.trim(),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.recognition) {
        throw new Error(data?.error || 'Handwriting recognition failed.');
      }

      const rec: HandwritingResult = { ...data.recognition };
      const detCheck = computeDeterministically(rec.evaluableExpression || rec.recognizedLatex || '');
      if (detCheck.computed && detCheck.valueText) {
        rec.finalAnswerPlain = detCheck.valueText;
        rec.finalAnswerLatex = `\\boxed{${detCheck.valueText}}`;
        rec.verifiedDeterministic = true;
      }

      setResult(rec);
      setEditableLatex(rec.recognizedLatex || rec.recognizedText || '');
    } catch (err: any) {
      setError(err?.message || 'Error recognizing handwritten image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecomputeEditedLatex = () => {
    if (!editableLatex.trim() || !result) return;
    const det = computeDeterministically(editableLatex);
    if (det.computed && det.valueText) {
      setResult({
        ...result,
        recognizedLatex: editableLatex,
        steps: det.steps || result.steps,
        finalAnswerLatex: `\\boxed{${det.valueText}}`,
        finalAnswerPlain: det.valueText,
        verifiedDeterministic: true,
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Handwriting Equation Recognition
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
              Write fractions, roots, powers, integrals, or scientific notation by hand—or upload a notebook photo—and verify the solution.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#18181B]">
            <button
              type="button"
              onClick={() => setInputMode('draw')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                inputMode === 'draw' ? 'bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Handwrite on Pad
            </button>
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                inputMode === 'upload' ? 'bg-white dark:bg-[#0A0A0A] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Upload Image
            </button>
          </div>
        </div>

        {inputMode === 'draw' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPadTool('pen')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    padTool === 'pen' ? 'bg-[#22C55E] text-white' : 'border border-slate-200 dark:border-[#27272A]'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Pen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPadTool('eraser')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    padTool === 'eraser' ? 'bg-[#22C55E] text-white' : 'border border-slate-200 dark:border-[#27272A]'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Eraser</span>
                </button>
              </div>
              <button
                type="button"
                onClick={clearPad}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] text-xs font-semibold text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Pad</span>
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-[#27272A] bg-white">
              <canvas
                ref={padRef}
                width={840}
                height={420}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="w-full h-auto block touch-none cursor-crosshair"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-[#27272A] p-8 sm:p-10 text-center cursor-pointer hover:border-[#22C55E] transition-colors">
              <Upload className="w-8 h-8 text-[#22C55E] mb-2" />
              <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                Upload handwritten photo or screenshot
              </span>
              <span className="text-xs text-slate-500 dark:text-[#A1A1AA] mt-1">
                Supports fractions, powers, roots, integrals, matrices, and scientific notation
              </span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {uploadedPreview && (
              <div className="rounded-xl border border-slate-200 dark:border-[#27272A] p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ImageIcon className="w-5 h-5 text-[#22C55E] shrink-0" />
                  <img src={uploadedPreview} alt="Handwritten math preview" className="max-h-56 rounded-lg object-contain" />
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedPreview('')}
                  className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer shrink-0"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional context (e.g. 'Solve for x', 'Evaluate integral', 'Find derivative')..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          />
          <button
            type="button"
            onClick={handleRecognize}
            disabled={isAnalyzing}
            className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isAnalyzing ? 'Recognizing...' : 'Recognize & Solve'}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {result && (
        <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#27272A] pb-3">
            <div className="text-xs text-slate-500 dark:text-[#A1A1AA]">
              Detected Notation: {(result.detectedSymbols || ['Mathematical Equation']).join(' · ')}
            </div>
            {result.verifiedDeterministic && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Computation</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-500 dark:text-[#A1A1AA]">Rendered Equation</div>
              <div className="overflow-x-auto">
                <MathRenderer content={`$$${(editableLatex || result.recognizedLatex).replace(/^\$\$|\$\$$/g, '')}$$`} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-[#A1A1AA]">Edit LaTeX Correction</span>
                <button
                  type="button"
                  onClick={handleRecomputeEditedLatex}
                  className="text-xs font-bold text-[#22C55E] hover:underline cursor-pointer"
                >
                  Re-Evaluate
                </button>
              </div>
              <input
                type="text"
                value={editableLatex}
                onChange={(e) => setEditableLatex(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          {result.confidenceNotes && (
            <p className="text-xs text-slate-500 dark:text-[#A1A1AA]">{result.confidenceNotes}</p>
          )}

          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white">Step-by-Step Solution</div>
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
              <MathRenderer content={`$$${(result.finalAnswerLatex || '').replace(/^\$\$|\$\$$/g, '')}$$`} />
            </div>
            {onOpenInGemini && (
              <button
                type="button"
                onClick={() => onOpenInGemini(editableLatex || result.recognizedText)}
                className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Deep Dive in AI Solver</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
