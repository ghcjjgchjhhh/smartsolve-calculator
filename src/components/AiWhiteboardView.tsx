import React, { useEffect, useRef, useState } from 'react';
import {
  PenTool,
  Eraser,
  Minus,
  Square,
  Circle as CircleIcon,
  ArrowUpRight,
  Undo2,
  Redo2,
  Trash2,
  Download,
  BookmarkPlus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sparkles,
  Loader2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface DrawCommand {
  type: 'line' | 'arrow' | 'circle' | 'rect' | 'text' | 'curve' | 'axis';
  color?: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  label?: string;
  points?: Array<{ x: number; y: number }>;
}

interface WhiteboardStep {
  stepNumber: number;
  title: string;
  narration: string;
  formulaLatex?: string;
  drawCommands?: DrawCommand[];
}

interface BoardLesson {
  title: string;
  summary: string;
  finalAnswerLatex?: string;
  steps: WhiteboardStep[];
}

interface SavedBoard {
  id: string;
  title: string;
  dataUrl: string;
  savedAt: number;
}

type ToolType = 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle';

const BOARD_W = 800;
const BOARD_H = 480;
const STORAGE_KEY = 'smartsolve_saved_whiteboards_v1';

const PRESET_TOPICS = [
  'Prove Pythagoras theorem a^2 + b^2 = c^2 for a 3-4-5 right triangle',
  'Sketch projectile motion trajectory with initial velocity 25 m/s at 45 degrees',
  'Illustrate circle chord theorem: radius 13 cm, chord length 24 cm, find distance from center',
  'Draw and solve a force diagram on a 30-degree inclined plane with mass 10 kg',
];

export const AiWhiteboardView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);
  const startPtRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);

  const [tool, setTool] = useState<ToolType>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#22C55E');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [boardSurface, setBoardSurface] = useState<'chalkboard' | 'paper'>('chalkboard');

  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);

  const [promptInput, setPromptInput] = useState<string>(PRESET_TOPICS[0]);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');
  const [lesson, setLesson] = useState<BoardLesson | null>(null);
  const [visibleStepIdx, setVisibleStepIdx] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  const [savedBoards, setSavedBoards] = useState<SavedBoard[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [saveNotice, setSaveNotice] = useState<string>('');

  const initBlankBoard = (surface: 'chalkboard' | 'paper') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = surface === 'chalkboard' ? '#0B1117' : '#FFFFFF';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    // Subtle coordinate grid
    ctx.strokeStyle = surface === 'chalkboard' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
    ctx.lineWidth = 1;
    for (let x = 40; x < BOARD_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, BOARD_H);
      ctx.stroke();
    }
    for (let y = 40; y < BOARD_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(BOARD_W, y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    initBlankBoard(boardSurface);
  }, []);

  const drawSingleCommand = (ctx: CanvasRenderingContext2D, cmd: DrawCommand) => {
    const fallbackColor = boardSurface === 'chalkboard' ? '#F8FAFC' : '#0F172A';
    const color =
      cmd.color === '#FFFFFF' && boardSurface === 'paper'
        ? '#0F172A'
        : cmd.color || fallbackColor;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';

    if (cmd.type === 'axis') {
      const ox = cmd.cx ?? BOARD_W / 2;
      const oy = cmd.cy ?? BOARD_H / 2;
      ctx.strokeStyle = boardSurface === 'chalkboard' ? '#64748B' : '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(50, oy);
      ctx.lineTo(BOARD_W - 50, oy);
      ctx.moveTo(ox, 40);
      ctx.lineTo(ox, BOARD_H - 40);
      ctx.stroke();
      if (cmd.label) {
        ctx.fillText(cmd.label, ox + 10, 56);
      }
    } else if (cmd.type === 'line' && cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x2 !== undefined && cmd.y2 !== undefined) {
      ctx.beginPath();
      ctx.moveTo(cmd.x1, cmd.y1);
      ctx.lineTo(cmd.x2, cmd.y2);
      ctx.stroke();
      if (cmd.label) {
        ctx.fillText(cmd.label, (cmd.x1 + cmd.x2) / 2 + 6, (cmd.y1 + cmd.y2) / 2 - 6);
      }
    } else if (cmd.type === 'arrow' && cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x2 !== undefined && cmd.y2 !== undefined) {
      const dx = cmd.x2 - cmd.x1;
      const dy = cmd.y2 - cmd.y1;
      const angle = Math.atan2(dy, dx);
      const headLen = 11;
      ctx.beginPath();
      ctx.moveTo(cmd.x1, cmd.y1);
      ctx.lineTo(cmd.x2, cmd.y2);
      ctx.lineTo(cmd.x2 - headLen * Math.cos(angle - Math.PI / 6), cmd.y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(cmd.x2, cmd.y2);
      ctx.lineTo(cmd.x2 - headLen * Math.cos(angle + Math.PI / 6), cmd.y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
      if (cmd.label) {
        ctx.fillText(cmd.label, cmd.x2 + 8, cmd.y2 - 6);
      }
    } else if (cmd.type === 'circle' && cmd.cx !== undefined && cmd.cy !== undefined && cmd.r !== undefined) {
      ctx.beginPath();
      ctx.arc(cmd.cx, cmd.cy, Math.max(4, cmd.r), 0, Math.PI * 2);
      ctx.stroke();
      if (cmd.label) {
        ctx.fillText(cmd.label, cmd.cx - 20, cmd.cy - cmd.r - 8);
      }
    } else if (cmd.type === 'rect' && cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined && cmd.h !== undefined) {
      ctx.strokeRect(cmd.x, cmd.y, cmd.w, cmd.h);
      if (cmd.label) {
        ctx.fillText(cmd.label, cmd.x + 6, cmd.y - 8);
      }
    } else if (cmd.type === 'curve' && Array.isArray(cmd.points) && cmd.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(cmd.points[0].x, cmd.points[0].y);
      for (let i = 1; i < cmd.points.length; i++) {
        ctx.lineTo(cmd.points[i].x, cmd.points[i].y);
      }
      ctx.stroke();
      if (cmd.label) {
        const last = cmd.points[cmd.points.length - 1];
        ctx.fillText(cmd.label, Math.min(last.x + 8, BOARD_W - 140), Math.max(last.y - 8, 24));
      }
    } else if (cmd.type === 'text' && cmd.x !== undefined && cmd.y !== undefined && cmd.label) {
      ctx.fillText(cmd.label, cmd.x, cmd.y);
    }

    ctx.restore();
  };

  // Render cumulative AI lesson steps up to visibleStepIdx
  const renderAiStepsToStep = (targetLesson: BoardLesson, stepLimitIdx: number) => {
    initBlankBoard(boardSurface);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let i = 0; i <= stepLimitIdx && i < targetLesson.steps.length; i++) {
      const cmds = targetLesson.steps[i].drawCommands || [];
      cmds.forEach((cmd) => drawSingleCommand(ctx, cmd));
    }
  };

  useEffect(() => {
    if (!lesson) return;
    renderAiStepsToStep(lesson, visibleStepIdx);
  }, [lesson, visibleStepIdx, boardSurface]);

  // Progressive auto-playback
  useEffect(() => {
    if (!isAutoPlaying || !lesson) return;
    if (visibleStepIdx >= lesson.steps.length - 1) {
      setIsAutoPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setVisibleStepIdx((prev) => Math.min(prev + 1, lesson.steps.length - 1));
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [isAutoPlaying, visibleStepIdx, lesson]);

  const getBoardCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * BOARD_W,
      y: ((e.clientY - rect.top) / rect.height) * BOARD_H,
    };
  };

  const pushUndoSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, BOARD_W, BOARD_H);
    setUndoStack((prev) => [...prev.slice(-19), snap]);
    setRedoStack([]);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    pushUndoSnapshot();
    const pt = getBoardCoords(e);
    startPtRef.current = pt;
    snapshotRef.current = ctx.getImageData(0, 0, BOARD_W, BOARD_H);
    isDrawingRef.current = true;

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getBoardCoords(e);
    const start = startPtRef.current || pt;

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (tool === 'eraser') {
        ctx.strokeStyle = boardSurface === 'chalkboard' ? '#0B1117' : '#FFFFFF';
        ctx.lineWidth = Math.max(14, strokeWidth * 4);
        ctx.globalAlpha = 1;
      } else if (tool === 'highlighter') {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(12, strokeWidth * 3);
        ctx.globalAlpha = 0.25;
      } else {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = 1;
      }
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Shape preview restore
    if (snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
    }
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';

    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    } else if (tool === 'arrow') {
      const angle = Math.atan2(pt.y - start.y, pt.x - start.x);
      const head = 12;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.lineTo(pt.x - head * Math.cos(angle - Math.PI / 6), pt.y - head * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x - head * Math.cos(angle + Math.PI / 6), pt.y - head * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    } else if (tool === 'rect') {
      ctx.strokeRect(start.x, start.y, pt.x - start.x, pt.y - start.y);
    } else if (tool === 'circle') {
      const r = Math.hypot(pt.x - start.x, pt.y - start.y);
      ctx.beginPath();
      ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || undoStack.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const current = ctx.getImageData(0, 0, BOARD_W, BOARD_H);
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, current]);
    setUndoStack((prev) => prev.slice(0, -1));
    ctx.putImageData(previous, 0, 0);
  };

  const handleRedo = () => {
    const canvas = canvasRef.current;
    if (!canvas || redoStack.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const current = ctx.getImageData(0, 0, BOARD_W, BOARD_H);
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, current]);
    setRedoStack((prev) => prev.slice(0, -1));
    ctx.putImageData(next, 0, 0);
  };

  const handleClear = () => {
    pushUndoSnapshot();
    initBlankBoard(boardSurface);
    setLesson(null);
    setVisibleStepIdx(0);
    setIsAutoPlaying(false);
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `smartsolve-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleSaveBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const title = lesson?.title || promptInput.slice(0, 42) || 'Untitled Board';
    const newEntry: SavedBoard = {
      id: `wb_${Date.now()}`,
      title,
      dataUrl: canvas.toDataURL('image/png'),
      savedAt: Date.now(),
    };
    const updated = [newEntry, ...savedBoards].slice(0, 8);
    setSavedBoards(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSaveNotice('Saved to My Boards');
      setTimeout(() => setSaveNotice(''), 2500);
    } catch {
      setSaveNotice('Storage limit reached');
    }
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedBoards.filter((b) => b.id !== id);
    setSavedBoards(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleGenerateAiBoard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isLoadingAi) return;
    setIsLoadingAi(true);
    setAiError('');
    setIsAutoPlaying(false);

    try {
      const resp = await fetch('/api/whiteboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: promptInput.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.boardLesson) {
        throw new Error(data?.error || 'Could not generate AI Whiteboard lesson.');
      }
      setLesson(data.boardLesson);
      setVisibleStepIdx(0);
      setIsAutoPlaying(true);
    } catch (err: any) {
      setAiError(err?.message || 'Network error generating board steps.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const currentStep = lesson?.steps?.[visibleStepIdx];

  return (
    <div className="space-y-6">
      {/* Header & AI Prompt Bar */}
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI Interactive Whiteboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
              Watch AI sketch diagrams & derivations step by step, annotate freely, and save your boards.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBoardSurface((s) => (s === 'chalkboard' ? 'paper' : 'chalkboard'))}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#27272A] text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-[#18181B] cursor-pointer whitespace-nowrap"
            >
              {boardSurface === 'chalkboard' ? 'Switch to Light Board' : 'Switch to Dark Chalkboard'}
            </button>
          </div>
        </div>

        <form onSubmit={handleGenerateAiBoard} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Ask AI to illustrate a theorem, trajectory, circuit, or equation..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
          />
          <button
            type="submit"
            disabled={isLoadingAi}
            className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-colors"
          >
            {isLoadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isLoadingAi ? 'Drawing...' : 'Teach on Board'}</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mt-3">
          {PRESET_TOPICS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setPromptInput(preset)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181B] cursor-pointer text-left truncate max-w-xs"
            >
              {preset}
            </button>
          ))}
        </div>

        {aiError && (
          <div className="mt-3 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}
      </section>

      {/* Whiteboard Canvas + Progressive AI Step Deck */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left/Top: Drawing Canvas & Toolbar */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 space-y-3">
          {/* Drawing Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#27272A]">
            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: 'pen', label: 'Pen', icon: PenTool },
                  { id: 'highlighter', label: 'Highlight', icon: PenTool },
                  { id: 'eraser', label: 'Eraser', icon: Eraser },
                  { id: 'line', label: 'Line', icon: Minus },
                  { id: 'arrow', label: 'Arrow', icon: ArrowUpRight },
                  { id: 'rect', label: 'Rect', icon: Square },
                  { id: 'circle', label: 'Circle', icon: CircleIcon },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = tool === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTool(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#22C55E] text-white'
                        : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#18181B]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {['#22C55E', '#38BDF8', '#F59E0B', '#F43F5E', '#FFFFFF', '#0F172A'].map((col) => (
                <button
                  key={col}
                  type="button"
                  aria-label={`Color ${col}`}
                  onClick={() => setStrokeColor(col)}
                  style={{ backgroundColor: col }}
                  className={`w-5 h-5 rounded-full border cursor-pointer ${
                    strokeColor === col ? 'ring-2 ring-[#22C55E] ring-offset-1' : 'border-slate-400'
                  }`}
                />
              ))}
              <input
                type="range"
                min={1}
                max={12}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                title="Stroke Thickness"
                className="w-16 accent-[#22C55E]"
              />
            </div>
          </div>

          {/* Canvas */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#27272A]">
            <canvas
              ref={canvasRef}
              width={BOARD_W}
              height={BOARD_H}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-auto block touch-none cursor-crosshair"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] text-xs font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-[#18181B] flex items-center gap-1 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] text-xs font-semibold disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-[#18181B] flex items-center gap-1 cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span>Redo</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] text-xs font-semibold text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {saveNotice && <span className="text-xs font-semibold text-[#22C55E]">{saveNotice}</span>}
              <button
                type="button"
                onClick={handleSaveBoard}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#27272A] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#18181B] flex items-center gap-1.5 cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Save Board</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPng}
                className="px-3 py-1.5 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PNG</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Progressive Step Playback & Saved Gallery */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#22C55E]" />
                <span>Progressive AI Steps</span>
              </h3>
              {lesson && (
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-[#A1A1AA]">
                  Step {visibleStepIdx + 1} / {lesson.steps.length}
                </span>
              )}
            </div>

            {!lesson ? (
              <p className="text-xs text-slate-500 dark:text-[#A1A1AA] leading-relaxed">
                Enter any mathematics or physics topic above and click <strong>Teach on Board</strong>. AI will progressively draw diagrams and equations here while you draw alongside it.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{lesson.title}</div>
                  <p className="text-xs text-slate-500 dark:text-[#A1A1AA] mt-1">{lesson.summary}</p>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setVisibleStepIdx((p) => Math.max(0, p - 1));
                    }}
                    disabled={visibleStepIdx === 0}
                    className="p-2 rounded-lg border border-slate-200 dark:border-[#27272A] disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-[#18181B] cursor-pointer"
                    title="Previous step"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (visibleStepIdx >= lesson.steps.length - 1) setVisibleStepIdx(0);
                      setIsAutoPlaying((v) => !v);
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isAutoPlaying ? 'Pause' : 'Play Progressive Steps'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setVisibleStepIdx((p) => Math.min(lesson.steps.length - 1, p + 1));
                    }}
                    disabled={visibleStepIdx >= lesson.steps.length - 1}
                    className="p-2 rounded-lg border border-slate-200 dark:border-[#27272A] disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-[#18181B] cursor-pointer"
                    title="Next step"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Active Step Card */}
                {currentStep && (
                  <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3.5 space-y-2">
                    <div className="text-xs font-bold text-[#22C55E]">
                      Step {currentStep.stepNumber}: {currentStep.title}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                      {currentStep.narration}
                    </p>
                    {currentStep.formulaLatex && (
                      <div className="pt-1 overflow-x-auto">
                        <MathRenderer content={`$$${currentStep.formulaLatex.replace(/^\$\$|\$\$$/g, '')}$$`} />
                      </div>
                    )}
                  </div>
                )}

                {/* Step Timeline List */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {lesson.steps.map((st, idx) => (
                    <button
                      key={st.stepNumber}
                      type="button"
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setVisibleStepIdx(idx);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        idx === visibleStepIdx
                          ? 'bg-[#22C55E]/15 text-[#22C55E] font-bold border border-[#22C55E]/40'
                          : idx < visibleStepIdx
                          ? 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#18181B]'
                          : 'text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-[#18181B]'
                      }`}
                    >
                      {idx + 1}. {st.title}
                    </button>
                  ))}
                </div>

                {lesson.finalAnswerLatex && visibleStepIdx === lesson.steps.length - 1 && (
                  <div className="rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 p-3 text-xs">
                    <div className="font-bold text-[#22C55E] mb-1">Final Result</div>
                    <MathRenderer content={`$$${lesson.finalAnswerLatex.replace(/^\$\$|\$\$$/g, '')}$$`} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Saved Boards */}
          {savedBoards.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 space-y-3">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Saved Whiteboards ({savedBoards.length})
              </div>
              <div className="grid grid-cols-2 gap-2">
                {savedBoards.map((sb) => (
                  <div
                    key={sb.id}
                    className="rounded-xl border border-slate-200 dark:border-[#27272A] overflow-hidden bg-slate-50 dark:bg-[#121216]"
                  >
                    <img
                      src={sb.dataUrl}
                      alt={sb.title}
                      className="w-full h-20 object-cover cursor-pointer"
                      onClick={() => {
                        const img = new Image();
                        img.onload = () => {
                          const ctx = canvasRef.current?.getContext('2d');
                          if (ctx) {
                            pushUndoSnapshot();
                            ctx.drawImage(img, 0, 0, BOARD_W, BOARD_H);
                          }
                        };
                        img.src = sb.dataUrl;
                      }}
                    />
                    <div className="p-2 flex items-center justify-between gap-1">
                      <span className="text-[11px] font-medium truncate text-slate-700 dark:text-zinc-300">
                        {sb.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(sb.id)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        title="Delete board"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
