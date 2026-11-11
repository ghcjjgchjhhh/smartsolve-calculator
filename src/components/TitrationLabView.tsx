import React, { useState, useRef, useEffect } from 'react';
import {
  FlaskConical,
  RotateCcw,
  Play,
  Pause,
  Droplet,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Info,
} from 'lucide-react';

type TitrationType = 'strong_strong' | 'weak_strong' | 'strong_weak';
type IndicatorType = 'phenolphthalein' | 'methyl_orange' | 'bromothymol_blue';

export const TitrationLabView: React.FC = () => {
  const [titrationType, setTitrationType] = useState<TitrationType>('strong_strong');
  const [indicator, setIndicator] = useState<IndicatorType>('phenolphthalein');

  // Solution concentrations & volumes
  // Analyte in flask: Acid (e.g. HCl 0.1 M, 25.0 mL)
  const [analyteVol, setAnalyteVol] = useState<number>(25.0); // VA in mL
  const [analyteConc, setAnalyteConc] = useState<number>(0.1); // CA in M (mol/L)
  const [titrantConc, setTitrantConc] = useState<number>(0.1); // CB in M (mol/L) NaOH in burette
  const [titrantAdded, setTitrantAdded] = useState<number>(0.0); // VB in mL (0 to 50 mL)
  const [isFlowing, setIsFlowing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Theoretical Equivalence Volume Ve = (CA * VA) / CB
  const equivalenceVolume = (analyteConc * analyteVol) / titrantConc;

  // Calculate pH based on titrantAdded
  const calculatePH = (volB: number): number => {
    const molesA = (analyteConc * analyteVol) / 1000;
    const molesB = (titrantConc * volB) / 1000;
    const totalVol = (analyteVol + volB) / 1000; // in L

    if (titrationType === 'strong_strong') {
      // Strong Acid (HCl) + Strong Base (NaOH)
      if (volB < equivalenceVolume) {
        // Excess H+
        const excessH = (molesA - molesB) / totalVol;
        return Math.max(1.0, -Math.log10(Math.max(1e-14, excessH)));
      } else if (Math.abs(volB - equivalenceVolume) < 0.05) {
        // Equivalence point
        return 7.0;
      } else {
        // Excess OH-
        const excessOH = (molesB - molesA) / totalVol;
        const pOH = -Math.log10(Math.max(1e-14, excessOH));
        return Math.min(14.0, 14.0 - pOH);
      }
    } else if (titrationType === 'weak_strong') {
      // Weak Acid (CH3COOH, Ka = 1.8e-5) + Strong Base (NaOH)
      const pKa = 4.76;
      if (volB === 0) {
        // Pure weak acid pH = 0.5 * (pKa - log(C))
        return 0.5 * (pKa - Math.log10(analyteConc));
      } else if (volB < equivalenceVolume) {
        // Buffer region: Henderson-Hasselbalch pH = pKa + log([A-] / [HA])
        const ratio = molesB / (molesA - molesB);
        return Math.max(2.8, Math.min(8.0, pKa + Math.log10(ratio)));
      } else if (Math.abs(volB - equivalenceVolume) < 0.05) {
        // Equivalence point: weak conjugate base hydrolysis, pH ~ 8.7
        return 8.72;
      } else {
        // Excess strong base
        const excessOH = (molesB - molesA) / totalVol;
        const pOH = -Math.log10(Math.max(1e-14, excessOH));
        return Math.min(14.0, 14.0 - pOH);
      }
    } else {
      // Strong Acid (HCl) + Weak Base (NH3, Kb = 1.8e-5)
      if (volB < equivalenceVolume) {
        const excessH = (molesA - molesB) / totalVol;
        return Math.max(1.0, -Math.log10(Math.max(1e-14, excessH)));
      } else if (Math.abs(volB - equivalenceVolume) < 0.05) {
        // Equivalence point: weak conjugate acid hydrolysis, pH ~ 5.3
        return 5.28;
      } else {
        const excessB = molesB - molesA;
        return Math.min(11.0, 9.25 + Math.log10(excessB / molesA));
      }
    }
  };

  const currentPH = calculatePH(titrantAdded);

  // Indicator color based on current pH
  const getIndicatorColor = (ph: number): { css: string; name: string } => {
    if (indicator === 'phenolphthalein') {
      if (ph < 8.2) return { css: 'rgba(255, 255, 255, 0.05)', name: 'Colorless' };
      if (ph <= 10.0) {
        const alpha = ((ph - 8.2) / 1.8) * 0.7 + 0.1;
        return { css: `rgba(244, 63, 94, ${alpha.toFixed(2)})`, name: 'Faint Pink' };
      }
      return { css: 'rgba(225, 29, 72, 0.85)', name: 'Deep Pink / Magenta' };
    } else if (indicator === 'methyl_orange') {
      if (ph < 3.1) return { css: 'rgba(239, 68, 68, 0.8)', name: 'Red' };
      if (ph <= 4.4) return { css: 'rgba(249, 115, 22, 0.85)', name: 'Orange (Endpoint)' };
      return { css: 'rgba(234, 179, 8, 0.85)', name: 'Yellow' };
    } else {
      // bromothymol_blue
      if (ph < 6.0) return { css: 'rgba(234, 179, 8, 0.8)', name: 'Yellow' };
      if (ph <= 7.6) return { css: 'rgba(34, 197, 94, 0.85)', name: 'Green (Neutral)' };
      return { css: 'rgba(59, 130, 246, 0.85)', name: 'Blue' };
    }
  };

  const currentColor = getIndicatorColor(currentPH);

  // Automated continuous flow timer
  useEffect(() => {
    let timer: any = null;
    if (isFlowing) {
      timer = setInterval(() => {
        setTitrantAdded((prev) => {
          if (prev >= 50.0) {
            setIsFlowing(false);
            return 50.0;
          }
          return Math.min(50.0, +(prev + 0.4).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isFlowing]);

  // Render Burette, Conical Flask and Titration Curve on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dark sleek background
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // Apparatus Left Area (Burette & Conical Flask)
    const appLeft = 30;
    const buretteX = 110;
    const buretteTop = 25;
    const buretteBottom = 220;
    const buretteW = 20;

    // --- Burette Stand ---
    ctx.strokeStyle = '#3F3F46';
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Base
    ctx.moveTo(appLeft + 10, height - 25);
    ctx.lineTo(appLeft + 160, height - 25);
    // Vertical rod
    ctx.moveTo(appLeft + 40, buretteTop - 10);
    ctx.lineTo(appLeft + 40, height - 25);
    // Clamps
    ctx.moveTo(appLeft + 40, 70);
    ctx.lineTo(buretteX - 5, 70);
    ctx.moveTo(appLeft + 40, 180);
    ctx.lineTo(buretteX - 5, 180);
    ctx.stroke();

    // --- Burette Tube (Glass) ---
    ctx.strokeStyle = '#71717A';
    ctx.lineWidth = 2;
    ctx.strokeRect(buretteX, buretteTop, buretteW, buretteBottom - buretteTop);

    // Burette liquid remaining (starts full at 0 mL, drains down to 50 mL)
    const liquidTopY = buretteTop + (titrantAdded / 50.0) * (buretteBottom - buretteTop - 20);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(buretteX + 2, liquidTopY, buretteW - 4, buretteBottom - liquidTopY);

    // Burette graduation tick marks
    ctx.strokeStyle = '#A1A1AA';
    ctx.lineWidth = 1;
    for (let ml = 0; ml <= 50; ml += 5) {
      const ty = buretteTop + (ml / 50.0) * (buretteBottom - buretteTop - 20);
      ctx.beginPath();
      ctx.moveTo(buretteX + buretteW, ty);
      ctx.lineTo(buretteX + buretteW - (ml % 10 === 0 ? 8 : 4), ty);
      ctx.stroke();
      if (ml % 10 === 0) {
        ctx.fillStyle = '#71717A';
        ctx.font = '8px Inter, sans-serif';
        ctx.fillText(`${ml}`, buretteX - 14, ty + 3);
      }
    }

    // Stopcock valve
    ctx.fillStyle = isFlowing ? '#22C55E' : '#EF4444';
    ctx.fillRect(buretteX + 3, buretteBottom, buretteW - 6, 12);
    // Nozzle tip
    ctx.strokeStyle = '#71717A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(buretteX + buretteW / 2, buretteBottom + 12);
    ctx.lineTo(buretteX + buretteW / 2, buretteBottom + 26);
    ctx.stroke();

    // Falling Drops animation when flowing
    if (isFlowing) {
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(buretteX + buretteW / 2, buretteBottom + 32, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Conical Flask (Erlenmeyer) below burette ---
    const flaskTopY = buretteBottom + 38;
    const flaskNeckW = 24;
    const flaskBaseW = 80;
    const flaskH = 75;
    const flaskCx = buretteX + buretteW / 2;

    // Flask Glass Outline
    ctx.strokeStyle = '#A1A1AA';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(flaskCx - flaskNeckW / 2, flaskTopY);
    ctx.lineTo(flaskCx - flaskNeckW / 2, flaskTopY + 16);
    ctx.lineTo(flaskCx - flaskBaseW / 2, flaskTopY + flaskH);
    ctx.lineTo(flaskCx + flaskBaseW / 2, flaskTopY + flaskH);
    ctx.lineTo(flaskCx + flaskNeckW / 2, flaskTopY + 16);
    ctx.lineTo(flaskCx + flaskNeckW / 2, flaskTopY);
    ctx.stroke();

    // Liquid in Flask with dynamic indicator color
    ctx.fillStyle = currentColor.css;
    ctx.beginPath();
    ctx.moveTo(flaskCx - flaskBaseW / 2 + 4, flaskTopY + flaskH - 2);
    ctx.lineTo(flaskCx - flaskNeckW * 0.9, flaskTopY + 36);
    ctx.lineTo(flaskCx + flaskNeckW * 0.9, flaskTopY + 36);
    ctx.lineTo(flaskCx + flaskBaseW / 2 - 4, flaskTopY + flaskH - 2);
    ctx.closePath();
    ctx.fill();

    // Magnetic stir bar spinning
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(flaskCx - 8, flaskTopY + flaskH - 6, 16, 4);

    // --- Dynamic pH Titration Curve on Right ---
    const chartX = 230;
    const chartY = 30;
    const chartW = width - chartX - 25;
    const chartH = height - 60;

    ctx.fillStyle = '#121214';
    ctx.fillRect(chartX, chartY, chartW, chartH);
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;
    ctx.strokeRect(chartX, chartY, chartW, chartH);

    // Grid lines for pH 0 to 14
    ctx.strokeStyle = '#1E1E22';
    ctx.lineWidth = 1;
    for (let ph = 2; ph <= 14; ph += 2) {
      const gy = chartY + chartH - 25 - (ph / 14) * (chartH - 45);
      ctx.beginPath();
      ctx.moveTo(chartX + 35, gy);
      ctx.lineTo(chartX + chartW - 15, gy);
      ctx.stroke();

      ctx.fillStyle = '#71717A';
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(`${ph}`, chartX + 18, gy + 3);
    }

    // Grid lines for Volume 0 to 50 mL
    for (let v = 10; v <= 50; v += 10) {
      const gx = chartX + 35 + (v / 50.0) * (chartW - 55);
      ctx.beginPath();
      ctx.moveTo(gx, chartY + 15);
      ctx.lineTo(gx, chartY + chartH - 25);
      ctx.stroke();

      ctx.fillStyle = '#71717A';
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(`${v}`, gx - 5, chartY + chartH - 10);
    }

    // Axes
    ctx.strokeStyle = '#A1A1AA';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(chartX + 35, chartY + 15);
    ctx.lineTo(chartX + 35, chartY + chartH - 25);
    ctx.lineTo(chartX + chartW - 15, chartY + chartH - 25);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#A1A1AA';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText('pH', chartX + 12, chartY + 18);
    ctx.fillText('Volume of Titrant Added (mL)', chartX + chartW / 2 - 50, chartY + chartH - 5);

    // Neutral pH 7 dashed line
    const neutralY = chartY + chartH - 25 - (7 / 14) * (chartH - 45);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(chartX + 35, neutralY);
    ctx.lineTo(chartX + chartW - 15, neutralY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Equivalence Point Vertical Dashed Line
    const eqX = chartX + 35 + (equivalenceVolume / 50.0) * (chartW - 55);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(eqX, chartY + 15);
    ctx.lineTo(eqX, chartY + chartH - 25);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw full theoretical S-Curve in background
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let v = 0; v <= 50; v += 0.5) {
      const ph = calculatePH(v);
      const px = chartX + 35 + (v / 50.0) * (chartW - 55);
      const py = chartY + chartH - 25 - (ph / 14) * (chartH - 45);
      if (v === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Highlight current titration progress line
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let v = 0; v <= titrantAdded; v += 0.5) {
      const ph = calculatePH(v);
      const px = chartX + 35 + (v / 50.0) * (chartW - 55);
      const py = chartY + chartH - 25 - (ph / 14) * (chartH - 45);
      if (v === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Current State Dot
    const currX = chartX + 35 + (titrantAdded / 50.0) * (chartW - 55);
    const currY = chartY + chartH - 25 - (currentPH / 14) * (chartH - 45);

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(currX, currY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Equivalence Point Marker (Star/Dot)
    const eqPH = calculatePH(equivalenceVolume);
    const eqDotY = chartY + chartH - 25 - (eqPH / 14) * (chartH - 45);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(eqX, eqDotY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F43F5E';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText(`Equiv Point (${equivalenceVolume.toFixed(1)}mL, pH ${eqPH.toFixed(1)})`, Math.min(chartX + chartW - 130, eqX + 6), eqDotY - 6);
  }, [titrationType, indicator, analyteVol, analyteConc, titrantConc, titrantAdded, isFlowing, currentPH, currentColor]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EC4899]/20 text-[#EC4899] font-bold text-xs uppercase tracking-wider border border-[#EC4899]/30">
                Chemistry Practical Lab
              </span>
              <span className="text-xs text-[#A1A1AA]">· WAEC · NECO · JAMB Volumetric Analysis</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] mt-1 flex items-center space-x-2">
              <FlaskConical className="w-5 h-5 text-[#EC4899]" />
              <span>Acid-Base Titration & pH Curve Laboratory</span>
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setTitrantAdded(0);
                setIsFlowing(false);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refill Burette</span>
            </button>
          </div>
        </div>

        {/* Titration Reaction Mode Selectors */}
        <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-none">
          {[
            { id: 'strong_strong', label: 'Strong Acid + Strong Base (HCl + NaOH)' },
            { id: 'weak_strong', label: 'Weak Acid + Strong Base (CH₃COOH + NaOH)' },
            { id: 'strong_weak', label: 'Strong Acid + Weak Base (HCl + NH₃)' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTitrationType(item.id as TitrationType);
                setTitrantAdded(0);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                titrationType === item.id
                  ? 'bg-[#EC4899] text-white font-bold shadow-md shadow-pink-500/20'
                  : 'bg-[#121214] border border-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Burette & S-Curve Viewport */}
        <div className="lg:col-span-2 bg-[#000000] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899] animate-pulse"></span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Burette & pH S-Curve Diagram
              </span>
            </div>
            <div className="text-[11px] text-[#A1A1AA]">
              Equivalence Volume: <span className="text-white font-bold">{equivalenceVolume.toFixed(1)} mL</span>
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-2xl border border-[#27272A]/70 bg-[#09090B]">
            <canvas ref={canvasRef} width={740} height={380} className="w-full h-auto block" />
          </div>

          {/* Burette Delivery Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTitrantAdded((p) => Math.min(50, +(p + 0.5).toFixed(1)))}
                className="px-3 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-white border border-[#27272A] flex items-center space-x-1 cursor-pointer"
              >
                <Droplet className="w-3.5 h-3.5 text-sky-400" />
                <span>+0.5 mL (Drop)</span>
              </button>
              <button
                onClick={() => setTitrantAdded((p) => Math.min(50, +(p + 2.0).toFixed(1)))}
                className="px-3 py-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-white border border-[#27272A] flex items-center space-x-1 cursor-pointer"
              >
                <span>+2.0 mL</span>
              </button>
              <button
                onClick={() => setIsFlowing(!isFlowing)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isFlowing
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                }`}
              >
                {isFlowing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isFlowing ? 'Stop Flow' : 'Continuous Flow'}</span>
              </button>
            </div>

            {/* Indicator Selectors */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-[#A1A1AA]">Indicator:</span>
              <select
                value={indicator}
                onChange={(e) => setIndicator(e.target.value as IndicatorType)}
                className="bg-[#18181B] border border-[#27272A] text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#EC4899] cursor-pointer"
              >
                <option value="phenolphthalein">Phenolphthalein (pH 8.2 - 10)</option>
                <option value="methyl_orange">Methyl Orange (pH 3.1 - 4.4)</option>
                <option value="bromothymol_blue">Bromothymol Blue (pH 6.0 - 7.6)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Telemetry and Volumetric Calculation Card */}
        <div className="space-y-5">
          {/* Real-time pH & Endpoint Telemetry */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#EC4899]" />
              <span>Titration Telemetry & Endpoint</span>
            </h3>

            <div className="p-3.5 rounded-2xl bg-[#121214] border border-[#27272A] text-center space-y-1">
              <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-semibold">Flask pH:</span>
              <div className="text-3xl font-mono font-bold text-[#EC4899]">{currentPH.toFixed(2)}</div>
              <div className="text-xs text-[#A1A1AA]">
                {currentPH < 7 ? 'Acidic Solution' : currentPH === 7 ? 'Neutral Solution' : 'Alkaline / Basic Solution'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                <span className="text-[10px] text-[#A1A1AA] block">Titrant Added (V_B)</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{titrantAdded.toFixed(1)} mL</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                <span className="text-[10px] text-[#A1A1AA] block">Indicator Color</span>
                <span className="font-semibold text-white text-xs block truncate">{currentColor.name}</span>
              </div>
            </div>

            {/* WAEC Practical Volumetric Formula Card */}
            <div className="p-3.5 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-2 text-xs">
              <span className="font-bold text-white uppercase text-[11px] block">
                WAEC / NECO Titration Formula:
              </span>
              <div className="p-2 rounded-lg bg-[#0A0A0A] font-mono text-center text-sm font-bold text-sky-400 border border-[#27272A]">
                (C_A · V_A) / (C_B · V_B) = n_A / n_B
              </div>
              <div className="space-y-1 text-[#A1A1AA] text-[11px]">
                <div>• C_A (Acid Conc) = {analyteConc} mol/dm³</div>
                <div>• V_A (Pipette Vol) = {analyteVol} cm³</div>
                <div>• C_B (Base Conc) = {titrantConc} mol/dm³</div>
                <div>• V_B (Titre Value at End) = {equivalenceVolume.toFixed(1)} cm³</div>
              </div>
            </div>
          </div>

          {/* Concentration Parameters */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#EC4899]" />
              <span>Titration Parameters</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                  <span>Flask Acid Volume (V_A):</span>
                  <span className="font-mono text-white font-bold">{analyteVol} mL</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={analyteVol}
                  onChange={(e) => setAnalyteVol(Number(e.target.value))}
                  className="w-full accent-[#EC4899] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                  <span>Flask Acid Molarity (C_A):</span>
                  <span className="font-mono text-white font-bold">{analyteConc.toFixed(2)} M</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={analyteConc}
                  onChange={(e) => setAnalyteConc(Number(e.target.value))}
                  className="w-full accent-[#EC4899] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                  <span>Burette Base Molarity (C_B):</span>
                  <span className="font-mono text-white font-bold">{titrantConc.toFixed(2)} M</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={titrantConc}
                  onChange={(e) => setTitrantConc(Number(e.target.value))}
                  className="w-full accent-[#EC4899] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
