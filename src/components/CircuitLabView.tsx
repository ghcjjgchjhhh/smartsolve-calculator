import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Zap,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Layers,
  Activity,
  CheckCircle2,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const CircuitLabView: React.FC = () => {
  const [circuitType, setCircuitType] = useState<'series' | 'parallel' | 'internal_res' | 'wheatstone'>('series');
  const [voltage, setVoltage] = useState<number>(12); // Volts
  const [r1, setR1] = useState<number>(10); // Ohms
  const [r2, setR2] = useState<number>(20); // Ohms
  const [r3, setR3] = useState<number>(30); // Ohms
  const [internalR, setInternalR] = useState<number>(2); // Ohms
  const [isSwitchClosed, setIsSwitchClosed] = useState<boolean>(true);
  const [selectedComponent, setSelectedComponent] = useState<string>('R1');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const electronOffsetRef = useRef<number>(0);

  // Electrical computations
  const calculations = useMemo(() => {
    if (!isSwitchClosed) {
      return {
        rEq: Infinity,
        iTotal: 0,
        vR1: 0,
        vR2: 0,
        vR3: 0,
        iR1: 0,
        iR2: 0,
        iR3: 0,
        powerTotal: 0,
        terminalV: voltage,
        lostVolts: 0,
        isBridgeBalanced: false,
      };
    }

    if (circuitType === 'series') {
      const rEq = r1 + r2 + r3;
      const iTotal = voltage / (rEq || 1);
      const vR1 = iTotal * r1;
      const vR2 = iTotal * r2;
      const vR3 = iTotal * r3;
      const powerTotal = iTotal * iTotal * rEq;
      return { rEq, iTotal, vR1, vR2, vR3, iR1: iTotal, iR2: iTotal, iR3: iTotal, powerTotal };
    }

    if (circuitType === 'parallel') {
      const gEq = 1 / r1 + 1 / r2 + 1 / r3;
      const rEq = 1 / gEq;
      const iR1 = voltage / r1;
      const iR2 = voltage / r2;
      const iR3 = voltage / r3;
      const iTotal = iR1 + iR2 + iR3;
      const powerTotal = voltage * iTotal;
      return { rEq, iTotal, vR1: voltage, vR2: voltage, vR3: voltage, iR1, iR2, iR3, powerTotal };
    }

    if (circuitType === 'internal_res') {
      const rEq = r1 + internalR;
      const iTotal = voltage / rEq;
      const terminalV = iTotal * r1;
      const lostVolts = iTotal * internalR;
      const powerTotal = voltage * iTotal;
      return { rEq, iTotal, vR1: terminalV, vR2: 0, vR3: 0, iR1: iTotal, iR2: 0, iR3: 0, powerTotal, terminalV, lostVolts };
    }

    // Wheatstone Bridge: R1/R2 vs R3/R4
    const r4 = 20; // fixed R4
    const ratio1 = r1 / r2;
    const ratio2 = r3 / r4;
    const isBridgeBalanced = Math.abs(ratio1 - ratio2) < 0.05;
    const rEq = ((r1 + r2) * (r3 + r4)) / (r1 + r2 + r3 + r4);
    const iTotal = voltage / rEq;
    return { rEq, iTotal, vR1: (voltage * r1) / (r1 + r2), vR2: (voltage * r2) / (r1 + r2), vR3: (voltage * r3) / (r3 + r4), iR1: voltage / (r1 + r2), iR2: voltage / (r1 + r2), iR3: voltage / (r3 + r4), powerTotal: voltage * iTotal, isBridgeBalanced };
  }, [circuitType, voltage, r1, r2, r3, internalR, isSwitchClosed]);

  // Schematic rendering loop with flowing electron current
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);

      // Dark background
      ctx.fillStyle = '#09090B';
      ctx.fillRect(0, 0, width, height);

      // Advance electron animation offset if switch is closed and current flows
      if (isSwitchClosed && calculations.iTotal > 0) {
        electronOffsetRef.current = (electronOffsetRef.current + calculations.iTotal * 3) % 40;
      }

      const offset = electronOffsetRef.current;

      // Draw Series / Parallel / Internal Resistance Schematics
      if (circuitType === 'series' || circuitType === 'internal_res') {
        const left = 70;
        const right = width - 70;
        const top = 60;
        const bottom = height - 70;

        // Draw Wire Path
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(left, top, right - left, bottom - top, 16);
        ctx.stroke();

        // Animated current dots along wires
        if (isSwitchClosed && calculations.iTotal > 0) {
          ctx.save();
          ctx.strokeStyle = '#22C55E';
          ctx.lineWidth = 3;
          ctx.setLineDash([4, 16]);
          ctx.lineDashOffset = -offset;
          ctx.beginPath();
          ctx.roundRect(left, top, right - left, bottom - top, 16);
          ctx.stroke();
          ctx.restore();
        }

        // 1. Draw Battery at Bottom
        const midBottomX = (left + right) / 2;
        ctx.fillStyle = '#09090B';
        ctx.fillRect(midBottomX - 40, bottom - 12, 80, 24); // clear wire under battery

        // Battery Plates
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        // Positive plate (longer)
        ctx.beginPath();
        ctx.moveTo(midBottomX - 10, bottom - 18);
        ctx.lineTo(midBottomX - 10, bottom + 18);
        ctx.stroke();
        // Negative plate (shorter, thicker)
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(midBottomX + 10, bottom - 10);
        ctx.lineTo(midBottomX + 10, bottom + 10);
        ctx.stroke();

        // Battery label
        ctx.fillStyle = '#22C55E';
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`+ ${voltage}V -`, midBottomX, bottom + 34);

        // Switch at Left Wire
        const switchY = (top + bottom) / 2;
        ctx.fillStyle = '#09090B';
        ctx.fillRect(left - 12, switchY - 24, 24, 48);

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(left, switchY - 18, 4, 0, Math.PI * 2);
        ctx.arc(left, switchY + 18, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isSwitchClosed ? '#22C55E' : '#EF4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(left, switchY - 18);
        if (isSwitchClosed) {
          ctx.lineTo(left, switchY + 18);
        } else {
          ctx.lineTo(left + 16, switchY + 6); // open knife
        }
        ctx.stroke();

        ctx.fillStyle = isSwitchClosed ? '#22C55E' : '#EF4444';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.fillText(isSwitchClosed ? 'ON' : 'OPEN', left - 24, switchY + 4);

        // Resistors along top wire
        if (circuitType === 'series') {
          const resWidth = 70;
          const resHeight = 26;
          const segW = (right - left) / 4;

          const drawResistorBox = (rx: number, label: string, val: number, vDrop: number, isSel: boolean) => {
            ctx.fillStyle = isSel ? '#22C55E22' : '#18181B';
            ctx.strokeStyle = isSel ? '#22C55E' : '#FFFFFF';
            ctx.lineWidth = isSel ? 2.5 : 1.5;
            ctx.beginPath();
            ctx.roundRect(rx - resWidth / 2, top - resHeight / 2, resWidth, resHeight, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 11px JetBrains Mono, monospace';
            ctx.fillText(label, rx, top + 4);

            ctx.fillStyle = '#A1A1AA';
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.fillText(`${val}Ω`, rx, top - 18);
            ctx.fillStyle = '#38BDF8';
            ctx.fillText(`V=${vDrop.toFixed(1)}V`, rx, top + 26);
          };

          drawResistorBox(left + segW * 1, 'R₁', r1, calculations.vR1, selectedComponent === 'R1');
          drawResistorBox(left + segW * 2, 'R₂', r2, calculations.vR2, selectedComponent === 'R2');
          drawResistorBox(left + segW * 3, 'R₃', r3, calculations.vR3, selectedComponent === 'R3');
        } else {
          // Internal resistance circuit
          const resWidth = 80;
          const resHeight = 28;
          const rMidX = (left + right) / 2;

          ctx.fillStyle = '#18181B';
          ctx.strokeStyle = '#22C55E';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(rMidX - resWidth / 2, top - resHeight / 2, resWidth, resHeight, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.fillText(`Load R (${r1}Ω)`, rMidX, top + 4);
          ctx.fillStyle = '#38BDF8';
          ctx.fillText(`V_term = ${calculations.terminalV?.toFixed(2)}V`, rMidX, top + 26);

          // Internal resistance box next to battery
          ctx.strokeStyle = '#F59E0B';
          ctx.setLineDash([3, 3]);
          ctx.strokeRect(midBottomX + 22, bottom - 18, 55, 36);
          ctx.setLineDash([]);
          ctx.fillStyle = '#F59E0B';
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.fillText(`r=${internalR}Ω`, midBottomX + 50, bottom + 6);
          ctx.fillText(`Lost: ${calculations.lostVolts?.toFixed(1)}V`, midBottomX + 50, bottom - 24);
        }
      }

      // Parallel Circuit Schematic
      else if (circuitType === 'parallel') {
        const left = 70;
        const right = width - 70;
        const top = 50;
        const bottom = height - 60;
        const branchGap = (bottom - top) / 4;

        // Main rails
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Left rail
        ctx.moveTo(left, top);
        ctx.lineTo(left, bottom);
        // Right rail
        ctx.moveTo(right, top);
        ctx.lineTo(right, bottom);
        ctx.stroke();

        // Draw 3 Branches
        const branches = [
          { y: top + branchGap * 0.8, label: 'R₁', val: r1, current: calculations.iR1 },
          { y: top + branchGap * 1.8, label: 'R₂', val: r2, current: calculations.iR2 },
          { y: top + branchGap * 2.8, label: 'R₃', val: r3, current: calculations.iR3 },
        ];

        branches.forEach((b) => {
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(left, b.y);
          ctx.lineTo(right, b.y);
          ctx.stroke();

          // Resistor Box
          const midX = (left + right) / 2;
          ctx.fillStyle = '#18181B';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(midX - 35, b.y - 14, 70, 28, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.fillText(`${b.label} (${b.val}Ω)`, midX, b.y + 4);

          ctx.fillStyle = '#22C55E';
          ctx.fillText(`I = ${b.current.toFixed(2)}A`, midX + 65, b.y + 4);
        });

        // Bottom Battery & Switch
        ctx.strokeStyle = '#38BDF8';
        ctx.beginPath();
        ctx.moveTo(left, bottom);
        ctx.lineTo(right, bottom);
        ctx.stroke();

        const midBottomX = (left + right) / 2;
        ctx.fillStyle = '#09090B';
        ctx.fillRect(midBottomX - 40, bottom - 12, 80, 24);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(midBottomX - 10, bottom - 18);
        ctx.lineTo(midBottomX - 10, bottom + 18);
        ctx.stroke();
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(midBottomX + 10, bottom - 10);
        ctx.lineTo(midBottomX + 10, bottom + 10);
        ctx.stroke();

        ctx.fillStyle = '#22C55E';
        ctx.font = 'bold 12px JetBrains Mono, monospace';
        ctx.fillText(`+ ${voltage}V -`, midBottomX, bottom + 34);
      }

      if (running) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [circuitType, voltage, r1, r2, r3, internalR, isSwitchClosed, selectedComponent, calculations]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] flex-shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Live Interactive Circuit & Ohm's Law Lab
              </h2>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30">
                DC Simulator
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1AA]">
              Series & parallel networks, Kirchhoff's laws (KCL/KVL), and internal resistance with flowing electron telemetry.
            </p>
          </div>
        </div>

        {/* Circuit Type Tabs */}
        <div className="flex flex-wrap items-center bg-[#18181B] p-1 rounded-2xl border border-[#27272A] text-xs font-semibold">
          <button
            onClick={() => setCircuitType('series')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              circuitType === 'series' ? 'bg-[#38BDF8] text-black font-bold shadow-md' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Series Circuit
          </button>
          <button
            onClick={() => setCircuitType('parallel')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              circuitType === 'parallel' ? 'bg-[#38BDF8] text-black font-bold shadow-md' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Parallel Circuit
          </button>
          <button
            onClick={() => setCircuitType('internal_res')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              circuitType === 'internal_res' ? 'bg-[#38BDF8] text-black font-bold shadow-md' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Internal Resistance (E = V + Ir)
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Schematic Canvas */}
        <div className="lg:col-span-8 bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between text-xs text-[#A1A1AA] pb-1 border-b border-[#27272A]">
            <span className="font-bold text-white flex items-center space-x-2">
              <span>Schematic Canvas</span>
              <span className="text-[10px] text-[#22C55E]">● Real-time Electron Animation</span>
            </span>

            <button
              onClick={() => setIsSwitchClosed(!isSwitchClosed)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                isSwitchClosed ? 'bg-[#22C55E] text-black shadow-md shadow-emerald-500/25' : 'bg-[#EF4444] text-white'
              }`}
            >
              <span>Switch: {isSwitchClosed ? 'CLOSED (Active)' : 'OPEN (Broken)'}</span>
            </button>
          </div>

          {/* Schematic Canvas */}
          <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden bg-[#09090B] border border-[#27272A]">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          {/* Digital Multimeter Readout Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] text-xs">
              <span className="text-[#A1A1AA] text-[11px] block">Total Resistance (R_eq)</span>
              <span className="text-base font-bold font-mono text-[#38BDF8]">
                {calculations.rEq === Infinity ? '∞ Ω' : `${calculations.rEq.toFixed(2)} Ω`}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] text-xs">
              <span className="text-[#A1A1AA] text-[11px] block">Total Current (I_total)</span>
              <span className="text-base font-bold font-mono text-[#22C55E]">
                {calculations.iTotal.toFixed(3)} A
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] text-xs">
              <span className="text-[#A1A1AA] text-[11px] block">Total Power (P = VI)</span>
              <span className="text-base font-bold font-mono text-amber-400">
                {calculations.powerTotal.toFixed(2)} W
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] text-xs">
              <span className="text-[#A1A1AA] text-[11px] block">Supply EMF</span>
              <span className="text-base font-bold font-mono text-white">
                {voltage.toFixed(1)} V
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Component Controls & Equations */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 pb-2 border-b border-[#27272A]">
              <Sliders className="w-4 h-4 text-[#38BDF8]" />
              <span>Circuit Controls & Values</span>
            </h3>

            {/* Battery Voltage */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[#A1A1AA]">
                <span>Battery Voltage (V)</span>
                <span className="text-white font-bold font-mono">{voltage} V</span>
              </div>
              <input
                type="range"
                min={1}
                max={48}
                value={voltage}
                onChange={(e) => setVoltage(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#22C55E]"
              />
            </div>

            {/* R1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[#A1A1AA]">
                <span>Resistor R₁</span>
                <span className="text-white font-bold font-mono">{r1} Ω</span>
              </div>
              <input
                type="range"
                min={2}
                max={100}
                value={r1}
                onChange={(e) => setR1(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
              />
            </div>

            {/* R2 */}
            {circuitType !== 'internal_res' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#A1A1AA]">
                  <span>Resistor R₂</span>
                  <span className="text-white font-bold font-mono">{r2} Ω</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={100}
                  value={r2}
                  onChange={(e) => setR2(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
                />
              </div>
            )}

            {/* R3 */}
            {circuitType !== 'internal_res' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#A1A1AA]">
                  <span>Resistor R₃</span>
                  <span className="text-white font-bold font-mono">{r3} Ω</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={100}
                  value={r3}
                  onChange={(e) => setR3(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#EC4899]"
                />
              </div>
            )}

            {/* Internal Resistance r */}
            {circuitType === 'internal_res' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#A1A1AA]">
                  <span>Internal Resistance (r)</span>
                  <span className="text-white font-bold font-mono">{internalR} Ω</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={internalR}
                  onChange={(e) => setInternalR(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#EF4444]"
                />
              </div>
            )}

            {/* Law Formulation Card */}
            <div className="p-3.5 rounded-2xl bg-[#121214] border border-[#27272A] space-y-2 text-[#D4D4D8]">
              <span className="font-bold text-[#38BDF8] uppercase tracking-wider block text-[11px]">
                {circuitType === 'series' && "Kirchhoff's Voltage Law (KVL)"}
                {circuitType === 'parallel' && "Kirchhoff's Current Law (KCL)"}
                {circuitType === 'internal_res' && 'Lost Volts & Terminal P.D.'}
              </span>
              <p className="text-[11px] leading-relaxed">
                {circuitType === 'series' &&
                  `V = V₁ + V₂ + V₃ = ${calculations.vR1.toFixed(1)}V + ${calculations.vR2.toFixed(1)}V + ${calculations.vR3.toFixed(1)}V = ${voltage}V. The total EMF equals the sum of voltage drops across the series branch.`}
                {circuitType === 'parallel' &&
                  `I_total = I₁ + I₂ + I₃ = ${calculations.iR1.toFixed(2)}A + ${calculations.iR2.toFixed(2)}A + ${calculations.iR3.toFixed(2)}A = ${calculations.iTotal.toFixed(2)}A. Current divides inversely proportional to resistance.`}
                {circuitType === 'internal_res' &&
                  `E = V_term + Ir = ${calculations.terminalV?.toFixed(2)}V + ${calculations.lostVolts?.toFixed(2)}V = ${voltage}V. Internal resistance causes 'lost volts' when driving current through the cell.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
