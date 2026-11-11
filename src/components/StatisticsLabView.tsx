import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  BarChart2,
  TrendingUp,
  Activity,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Award,
  Layers,
} from 'lucide-react';

interface ClassInterval {
  lower: number;
  upper: number;
  freq: number;
}

const DEFAULT_DATASET: ClassInterval[] = [
  { lower: 20, upper: 29, freq: 4 },
  { lower: 30, upper: 39, freq: 8 },
  { lower: 40, upper: 49, freq: 14 },
  { lower: 50, upper: 59, freq: 22 },
  { lower: 60, upper: 69, freq: 18 },
  { lower: 70, upper: 79, freq: 10 },
  { lower: 80, upper: 89, freq: 4 },
];

export const StatisticsLabView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'ogive' | 'normal_dist'>('ogive');
  const [data, setData] = useState<ClassInterval[]>(DEFAULT_DATASET);

  // Normal distribution parameters
  const [mean, setMean] = useState<number>(50);
  const [stdDev, setStdDev] = useState<number>(10);
  const [xVal, setXVal] = useState<number>(62);
  const [probMode, setProbMode] = useState<'less' | 'greater' | 'between'>('less');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculations for Grouped Data & Ogive
  const { tableRows, totalFreq, meanScore, stdDevScore, quartiles } = useMemo(() => {
    let cf = 0;
    let sumFx = 0;
    let sumFx2 = 0;
    let n = 0;

    const rows = data.map((item) => {
      const lowerBound = item.lower - 0.5;
      const upperBound = item.upper + 0.5;
      const midpoint = (item.lower + item.upper) / 2;
      cf += item.freq;
      n += item.freq;
      sumFx += item.freq * midpoint;
      sumFx2 += item.freq * midpoint * midpoint;

      return {
        ...item,
        lowerBound,
        upperBound,
        midpoint,
        cf,
      };
    });

    const m = n > 0 ? sumFx / n : 0;
    const variance = n > 0 ? sumFx2 / n - m * m : 0;
    const sd = Math.sqrt(Math.max(0, variance));

    // Approximate quartiles from Ogive (linear interpolation on CF)
    const findValueAtCF = (targetCF: number): number => {
      for (let i = 0; i < rows.length; i++) {
        const prevCF = i === 0 ? 0 : rows[i - 1].cf;
        const currCF = rows[i].cf;
        if (targetCF <= currCF) {
          const f = rows[i].freq;
          if (f === 0) return rows[i].lowerBound;
          const fraction = (targetCF - prevCF) / f;
          return rows[i].lowerBound + fraction * (rows[i].upperBound - rows[i].lowerBound);
        }
      }
      return rows[rows.length - 1].upperBound;
    };

    const q1 = findValueAtCF(0.25 * n);
    const q2 = findValueAtCF(0.5 * n); // Median
    const q3 = findValueAtCF(0.75 * n);
    const iqr = q3 - q1;

    return {
      tableRows: rows,
      totalFreq: n,
      meanScore: m,
      stdDevScore: sd,
      quartiles: { q1, q2, q3, iqr },
    };
  }, [data]);

  // Normal distribution Z-score and CDF approximation
  const zScore = stdDev > 0 ? (xVal - mean) / stdDev : 0;

  // Error function approximation for Gaussian CDF
  const erf = (x: number): number => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
    return sign * y;
  };

  const normalCDF = (z: number): number => {
    return 0.5 * (1 + erf(z / Math.SQRT2));
  };

  const probLess = normalCDF(zScore);
  const probGreater = 1 - probLess;

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    if (activeSubTab === 'ogive') {
      // --- Render Cumulative Frequency Ogive & Box Plot ---
      const chartX = 55;
      const chartY = 30;
      const chartW = width - chartX - 30;
      const chartH = height - 100; // Leave 70px at bottom for box plot

      // Grid lines
      const minX = 15;
      const maxX = 95;
      const maxCF = totalFreq > 0 ? totalFreq : 80;

      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = 1;
      for (let cf = 0; cf <= maxCF; cf += Math.max(10, Math.floor(maxCF / 5))) {
        const gy = chartY + chartH - (cf / maxCF) * chartH;
        ctx.beginPath();
        ctx.moveTo(chartX, gy);
        ctx.lineTo(chartX + chartW, gy);
        ctx.stroke();

        ctx.fillStyle = '#71717A';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(`${cf}`, chartX - 25, gy + 3);
      }

      // X-Axis grid
      for (let x = 20; x <= 90; x += 10) {
        const gx = chartX + ((x - minX) / (maxX - minX)) * chartW;
        ctx.beginPath();
        ctx.moveTo(gx, chartY);
        ctx.lineTo(gx, chartY + chartH);
        ctx.stroke();

        ctx.fillStyle = '#71717A';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(`${x}`, gx - 6, chartY + chartH + 14);
      }

      // Axes
      ctx.strokeStyle = '#A1A1AA';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(chartX, chartY);
      ctx.lineTo(chartX, chartY + chartH);
      ctx.lineTo(chartX + chartW, chartY + chartH);
      ctx.stroke();

      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('Cum. Freq (CF)', chartX - 10, chartY - 10);
      ctx.fillText('Upper Class Boundaries (Score)', chartX + chartW / 2 - 60, chartY + chartH + 30);

      // Plot Ogive S-Curve
      const points: { x: number; y: number }[] = [];
      // Starting point at lower bound of first class (CF = 0)
      if (tableRows.length > 0) {
        const startX = chartX + ((tableRows[0].lowerBound - minX) / (maxX - minX)) * chartW;
        const startY = chartY + chartH;
        points.push({ x: startX, y: startY });
      }

      tableRows.forEach((row) => {
        const px = chartX + ((row.upperBound - minX) / (maxX - minX)) * chartW;
        const py = chartY + chartH - (row.cf / maxCF) * chartH;
        points.push({ x: px, y: py });
      });

      // Smooth Curve Drawing
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Draw Ogive Data Dots
      points.forEach((pt) => {
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Quartile Projection Lines (Q1, Median Q2, Q3)
      const drawProjection = (cfVal: number, scoreVal: number, label: string, color: string) => {
        const py = chartY + chartH - (cfVal / maxCF) * chartH;
        const px = chartX + ((scoreVal - minX) / (maxX - minX)) * chartW;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(chartX, py);
        ctx.lineTo(px, py);
        ctx.lineTo(px, chartY + chartH);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = color;
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(`${label} = ${scoreVal.toFixed(1)}`, px + 4, py - 6);
      };

      drawProjection(totalFreq * 0.25, quartiles.q1, 'Q₁', '#A78BFA');
      drawProjection(totalFreq * 0.5, quartiles.q2, 'Median (Q₂)', '#22C55E');
      drawProjection(totalFreq * 0.75, quartiles.q3, 'Q₃', '#F59E0B');

      // --- Box-and-Whisker Plot below axis ---
      const boxY = height - 35;
      const boxH = 18;
      const q1X = chartX + ((quartiles.q1 - minX) / (maxX - minX)) * chartW;
      const medX = chartX + ((quartiles.q2 - minX) / (maxX - minX)) * chartW;
      const q3X = chartX + ((quartiles.q3 - minX) / (maxX - minX)) * chartW;
      const minValX = chartX + ((tableRows[0]?.lowerBound - minX) / (maxX - minX)) * chartW;
      const maxValX = chartX + ((tableRows[tableRows.length - 1]?.upperBound - minX) / (maxX - minX)) * chartW;

      // Whiskers
      ctx.strokeStyle = '#A1A1AA';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Left whisker
      ctx.moveTo(minValX, boxY + boxH / 2);
      ctx.lineTo(q1X, boxY + boxH / 2);
      ctx.moveTo(minValX, boxY + 2);
      ctx.lineTo(minValX, boxY + boxH - 2);
      // Right whisker
      ctx.moveTo(q3X, boxY + boxH / 2);
      ctx.lineTo(maxValX, boxY + boxH / 2);
      ctx.moveTo(maxValX, boxY + 2);
      ctx.lineTo(maxValX, boxY + boxH - 2);
      ctx.stroke();

      // Interquartile Box
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fillRect(q1X, boxY, q3X - q1X, boxH);
      ctx.strokeStyle = '#38BDF8';
      ctx.strokeRect(q1X, boxY, q3X - q1X, boxH);

      // Median Line in Box
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(medX, boxY);
      ctx.lineTo(medX, boxY + boxH);
      ctx.stroke();

      ctx.fillStyle = '#71717A';
      ctx.font = '8px Inter, sans-serif';
      ctx.fillText('Box Plot', chartX - 45, boxY + boxH / 2 + 3);
    } else {
      // --- Render Gaussian Normal Distribution Bell Curve ---
      const chartX = 50;
      const chartY = 30;
      const chartW = width - chartX - 30;
      const chartH = height - 70;

      const minX = mean - 3.8 * stdDev;
      const maxX = mean + 3.8 * stdDev;

      // Gaussian PDF formula: f(x) = (1 / (sigma * sqrt(2pi))) * exp(-0.5 * ((x-mu)/sigma)^2)
      const pdf = (x: number): number => {
        const factor = 1 / (stdDev * Math.sqrt(2 * Math.PI));
        const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
        return factor * Math.exp(exponent);
      };

      const maxPDF = pdf(mean);

      // Draw Shaded Probability Area
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.moveTo(chartX, chartY + chartH);

      for (let px = chartX; px <= chartX + chartW; px += 2) {
        const x = minX + ((px - chartX) / chartW) * (maxX - minX);
        const shouldShade = probMode === 'less' ? x <= xVal : x >= xVal;
        if (shouldShade) {
          const y = chartY + chartH - (pdf(x) / maxPDF) * (chartH - 20);
          ctx.lineTo(px, y);
        }
      }

      const xValPixel = chartX + ((xVal - minX) / (maxX - minX)) * chartW;
      ctx.lineTo(xValPixel, chartY + chartH);
      ctx.closePath();
      ctx.fill();

      // Draw Bell Curve Line
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let px = chartX; px <= chartX + chartW; px += 2) {
        const x = minX + ((px - chartX) / chartW) * (maxX - minX);
        const y = chartY + chartH - (pdf(x) / maxPDF) * (chartH - 20);
        if (px === chartX) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      // Mean Line (mu)
      const meanPixel = chartX + ((mean - minX) / (maxX - minX)) * chartW;
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(meanPixel, chartY + 10);
      ctx.lineTo(meanPixel, chartY + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#22C55E';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(`μ = ${mean}`, meanPixel - 15, chartY + 8);

      // Test value vertical line (X)
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xValPixel, chartY + 30);
      ctx.lineTo(xValPixel, chartY + chartH);
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`X = ${xVal} (Z = ${zScore.toFixed(2)})`, Math.min(chartX + chartW - 120, xValPixel + 4), chartY + 35);

      // Axis ticks for +/- 1s, 2s, 3s
      for (let s = -3; s <= 3; s++) {
        const tickVal = mean + s * stdDev;
        const tx = chartX + ((tickVal - minX) / (maxX - minX)) * chartW;
        ctx.strokeStyle = '#71717A';
        ctx.beginPath();
        ctx.moveTo(tx, chartY + chartH);
        ctx.lineTo(tx, chartY + chartH + 6);
        ctx.stroke();

        ctx.fillStyle = '#A1A1AA';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(`${tickVal.toFixed(0)}`, tx - 8, chartY + chartH + 18);
        ctx.fillText(s === 0 ? '0' : `${s > 0 ? '+' : ''}${s}σ`, tx - 6, chartY + chartH + 28);
      }
    }
  }, [activeSubTab, tableRows, totalFreq, quartiles, mean, stdDev, xVal, probMode, zScore]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] font-bold text-xs uppercase tracking-wider border border-[#8B5CF6]/30">
                Mathematics & Statistics
              </span>
              <span className="text-xs text-[#A1A1AA]">· WAEC Paper 2 (12 Marks) · AP & IGCSE Stats</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] mt-1 flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-[#8B5CF6]" />
              <span>Interactive Statistics, Ogive & Normal Distribution Lab</span>
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setData(DEFAULT_DATASET)}
              className="px-3.5 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset WAEC Dataset</span>
            </button>
          </div>
        </div>

        {/* Sub-tab selection */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('ogive')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'ogive'
                ? 'bg-[#8B5CF6] text-white font-bold shadow-md shadow-purple-500/20'
                : 'bg-[#121214] border border-[#27272A] text-[#A1A1AA] hover:text-white'
            }`}
          >
            Cumulative Frequency (Ogive) & Box-Plot
          </button>
          <button
            onClick={() => setActiveSubTab('normal_dist')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'normal_dist'
                ? 'bg-[#8B5CF6] text-white font-bold shadow-md shadow-purple-500/20'
                : 'bg-[#121214] border border-[#27272A] text-[#A1A1AA] hover:text-white'
            }`}
          >
            Gaussian Normal Distribution & Z-Score
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Chart Viewport */}
        <div className="lg:col-span-2 bg-[#000000] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] animate-pulse"></span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {activeSubTab === 'ogive' ? 'Ogive S-Curve & Box-and-Whisker Plot' : 'Gaussian Probability Density Bell Curve'}
              </span>
            </div>
            <div className="text-[11px] text-[#A1A1AA]">
              {activeSubTab === 'ogive' ? `Total Frequency N = ${totalFreq}` : `Z = (X - μ) / σ`}
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-2xl border border-[#27272A]/70 bg-[#09090B]">
            <canvas ref={canvasRef} width={740} height={380} className="w-full h-auto block" />
          </div>

          {/* Grouped Data Table View (for Ogive) */}
          {activeSubTab === 'ogive' && (
            <div className="overflow-x-auto rounded-2xl border border-[#27272A] bg-[#0A0A0A]">
              <table className="w-full text-left text-xs text-[#A1A1AA]">
                <thead className="bg-[#121214] text-white uppercase text-[10px] tracking-wider border-b border-[#27272A]">
                  <tr>
                    <th className="px-3 py-2.5">Class Interval</th>
                    <th className="px-3 py-2.5">Frequency (f)</th>
                    <th className="px-3 py-2.5">Class Boundaries</th>
                    <th className="px-3 py-2.5">Midpoint (x)</th>
                    <th className="px-3 py-2.5">Cum. Freq (CF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]/50">
                  {tableRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#18181B]/40">
                      <td className="px-3 py-2 font-mono text-white font-medium">{row.lower} - {row.upper}</td>
                      <td className="px-3 py-2 font-mono text-emerald-400 font-bold">{row.freq}</td>
                      <td className="px-3 py-2 font-mono">{row.lowerBound} - {row.upperBound}</td>
                      <td className="px-3 py-2 font-mono">{row.midpoint}</td>
                      <td className="px-3 py-2 font-mono text-sky-400 font-bold">{row.cf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Telemetry and Controls */}
        <div className="space-y-5">
          {activeSubTab === 'ogive' ? (
            <>
              {/* Ogive Statistical Telemetry */}
              <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#8B5CF6]" />
                  <span>WAEC Statistics Summary</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A]">
                    <span className="text-[10px] text-[#A1A1AA] block">Mean (x̄)</span>
                    <span className="text-xl font-mono font-bold text-white">{meanScore.toFixed(2)}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A]">
                    <span className="text-[10px] text-[#A1A1AA] block">Std Dev (σ)</span>
                    <span className="text-xl font-mono font-bold text-sky-400">{stdDevScore.toFixed(2)}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A]">
                    <span className="text-[10px] text-[#A1A1AA] block">Median (Q₂)</span>
                    <span className="text-xl font-mono font-bold text-emerald-400">{quartiles.q2.toFixed(1)}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A]">
                    <span className="text-[10px] text-[#A1A1AA] block">IQR (Q₃ - Q₁)</span>
                    <span className="text-xl font-mono font-bold text-amber-400">{quartiles.iqr.toFixed(1)}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#A1A1AA]">Lower Quartile (Q₁):</span>
                    <span className="font-mono font-bold text-white">{quartiles.q1.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A1A1AA]">Upper Quartile (Q₃):</span>
                    <span className="font-mono font-bold text-white">{quartiles.q3.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A1A1AA]">Semi-Interquartile Range:</span>
                    <span className="font-mono font-bold text-white">{(quartiles.iqr / 2).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Normal Distribution Z-Score Telemetry */}
              <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Z-Score & Probability Telemetry</span>
                </h3>

                <div className="p-3.5 rounded-2xl bg-[#121214] border border-[#27272A] text-center space-y-1">
                  <span className="text-[10px] text-[#A1A1AA] uppercase font-semibold">Standard Score (Z):</span>
                  <div className="text-3xl font-mono font-bold text-[#8B5CF6]">
                    Z = {zScore.toFixed(2)}
                  </div>
                  <div className="text-xs text-[#A1A1AA]">
                    Z = (X - μ) / σ = ({xVal} - {mean}) / {stdDev}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                    <span className="text-[10px] text-[#A1A1AA] block">P(X ≤ {xVal})</span>
                    <span className="font-mono font-bold text-sky-400 text-sm">{(probLess * 100).toFixed(2)}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                    <span className="text-[10px] text-[#A1A1AA] block">P(X ≥ {xVal})</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{(probGreater * 100).toFixed(2)}%</span>
                  </div>
                </div>

                {/* Empirical Rule */}
                <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] text-[11px] space-y-1 text-[#A1A1AA]">
                  <span className="font-bold text-white block">Empirical Rule (68-95-99.7):</span>
                  <div>• μ ± 1σ ({mean - stdDev} to {mean + stdDev}): 68.27% of data</div>
                  <div>• μ ± 2σ ({mean - 2 * stdDev} to {mean + 2 * stdDev}): 95.45% of data</div>
                  <div>• μ ± 3σ ({mean - 3 * stdDev} to {mean + 3 * stdDev}): 99.73% of data</div>
                </div>
              </div>

              {/* Sliders for Normal Distribution */}
              <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
                  <Sliders className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Gaussian Controls</span>
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                      <span>Mean (μ):</span>
                      <span className="font-mono text-white font-bold">{mean}</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={mean}
                      onChange={(e) => setMean(Number(e.target.value))}
                      className="w-full accent-[#8B5CF6] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                      <span>Standard Deviation (σ):</span>
                      <span className="font-mono text-white font-bold">{stdDev}</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="25"
                      value={stdDev}
                      onChange={(e) => setStdDev(Number(e.target.value))}
                      className="w-full accent-[#8B5CF6] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                      <span>Test Value (X):</span>
                      <span className="font-mono text-white font-bold">{xVal}</span>
                    </div>
                    <input
                      type="range"
                      min={mean - 3 * stdDev}
                      max={mean + 3 * stdDev}
                      value={xVal}
                      onChange={(e) => setXVal(Number(e.target.value))}
                      className="w-full accent-[#8B5CF6] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-[#A1A1AA]">Shading:</span>
                    <button
                      onClick={() => setProbMode('less')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        probMode === 'less' ? 'bg-[#8B5CF6] text-white' : 'bg-[#18181B] text-[#A1A1AA]'
                      }`}
                    >
                      P(X ≤ x)
                    </button>
                    <button
                      onClick={() => setProbMode('greater')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        probMode === 'greater' ? 'bg-[#8B5CF6] text-white' : 'bg-[#18181B] text-[#A1A1AA]'
                      }`}
                    >
                      P(X ≥ x)
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
