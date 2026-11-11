import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Snowflake,
  RotateCcw,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Activity,
  Gauge,
  Play,
  Pause,
} from 'lucide-react';

type GasLawMode = 'ideal' | 'boyle' | 'charles' | 'gay_lussac';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export const GasLawsLabView: React.FC = () => {
  const [mode, setMode] = useState<GasLawMode>('ideal');
  const [volume, setVolume] = useState<number>(5.0); // Liters (2.0 to 10.0 L)
  const [temperature, setTemperature] = useState<number>(300); // Kelvin (150 K to 600 K)
  const [moles, setMoles] = useState<number>(1.0); // moles (0.5 to 3.0 mol)
  const [isRunning, setIsRunning] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Gas constant R = 8.314 J/(mol·K) = 0.0821 L·atm/(mol·K)
  // Let P be in kiloPascals (kPa): P = (n * R * T) / V where R = 8.314, V in m^3 or L
  // In standard student units: P (atm) = (n * 0.08206 * T) / V
  const R_ATM = 0.08206; // L·atm / (mol·K)
  const R_KPA = 8.314; // kPa·L / (mol·K)
  const pressureAtm = (moles * R_ATM * temperature) / volume;
  const pressureKPa = (moles * R_KPA * temperature) / volume;

  // Temperature in Celsius
  const tempC = temperature - 273.15;

  // Initialize particles
  useEffect(() => {
    const count = Math.min(60, Math.floor(moles * 30));
    const particles: Particle[] = [];
    const colors = ['#38BDF8', '#60A5FA', '#818CF8', '#A78BFA'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: 40 + Math.random() * 200,
        y: 40 + Math.random() * 150,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius: 4,
        color: colors[i % colors.length],
      });
    }
    particlesRef.current = particles;
  }, [moles]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = '#09090B';
      ctx.fillRect(0, 0, width, height);

      // Chamber bounds
      const chamberLeft = 50;
      const chamberRight = width - 260; // Leave room for indicator PV chart on right
      const chamberBottom = height - 60;
      const chamberTop = 40;
      const maxChamberWidth = chamberRight - chamberLeft;

      // Piston X position based on volume (2.0 to 10.0 L)
      // Volume = 2.0 -> min width (90px), Volume = 10.0 -> full chamber
      const minPistonX = chamberLeft + 100;
      const maxPistonX = chamberRight - 20;
      const pistonX = minPistonX + ((volume - 2.0) / 8.0) * (maxPistonX - minPistonX);

      // --- Draw Cylinder & Gas Chamber ---
      // Chamber interior fill
      const tempColorRatio = Math.max(0, Math.min(1, (temperature - 150) / 450));
      ctx.fillStyle = `rgba(${Math.round(56 + tempColorRatio * 180)}, ${Math.round(
        189 - tempColorRatio * 100
      )}, ${Math.round(248 - tempColorRatio * 180)}, 0.08)`;
      ctx.fillRect(chamberLeft, chamberTop, pistonX - chamberLeft, chamberBottom - chamberTop);

      // Cylinder walls (thick metallic)
      ctx.strokeStyle = '#52525B';
      ctx.lineWidth = 6;
      ctx.beginPath();
      // Top wall
      ctx.moveTo(chamberLeft, chamberTop);
      ctx.lineTo(chamberRight, chamberTop);
      // Left back wall
      ctx.moveTo(chamberLeft, chamberTop - 3);
      ctx.lineTo(chamberLeft, chamberBottom + 3);
      // Bottom wall
      ctx.moveTo(chamberLeft, chamberBottom);
      ctx.lineTo(chamberRight, chamberBottom);
      ctx.stroke();

      // --- Draw Movable Piston Head & Rod ---
      ctx.fillStyle = '#3F3F46';
      ctx.fillRect(pistonX, chamberTop + 3, 20, chamberBottom - chamberTop - 6);
      ctx.strokeStyle = '#71717A';
      ctx.lineWidth = 2;
      ctx.strokeRect(pistonX, chamberTop + 3, 20, chamberBottom - chamberTop - 6);

      // Piston connecting rod to the right
      ctx.fillStyle = '#27272A';
      ctx.fillRect(pistonX + 20, chamberTop + (chamberBottom - chamberTop) / 2 - 8, chamberRight - pistonX - 10, 16);
      ctx.strokeStyle = '#52525B';
      ctx.strokeRect(pistonX + 20, chamberTop + (chamberBottom - chamberTop) / 2 - 8, chamberRight - pistonX - 10, 16);

      // Handle at right of rod
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.roundRect(chamberRight + 12, chamberTop + (chamberBottom - chamberTop) / 2 - 24, 10, 48, 4);
      ctx.fill();

      // Piston Label
      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(`Piston (V = ${volume.toFixed(1)} L)`, pistonX - 45, chamberTop - 12);

      // --- Heat Source / Flame / Ice under chamber ---
      if (temperature > 320) {
        // Draw Flame
        const flameCx = (chamberLeft + pistonX) / 2;
        const flameIntensity = (temperature - 300) / 300;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.beginPath();
        ctx.arc(flameCx, chamberBottom + 25, 24 * flameIntensity + 10, 0, Math.PI * 2);
        ctx.fill();

        // Flickering flame icon/shape
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(flameCx - 14, chamberBottom + 35);
        ctx.quadraticCurveTo(flameCx - 20, chamberBottom + 15, flameCx, chamberBottom + 5);
        ctx.quadraticCurveTo(flameCx + 20, chamberBottom + 15, flameCx + 14, chamberBottom + 35);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(flameCx, chamberBottom + 25, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`HEAT SOURCE (+Q)`, flameCx, chamberBottom + 45);
        ctx.textAlign = 'left';
      } else if (temperature < 270) {
        // Draw Ice Bath / Cooling
        const iceCx = (chamberLeft + pistonX) / 2;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.fillRect(chamberLeft + 10, chamberBottom + 10, pistonX - chamberLeft - 20, 24);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1;
        ctx.strokeRect(chamberLeft + 10, chamberBottom + 10, pistonX - chamberLeft - 20, 24);
        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`❄️ ICE BATH COOLING`, iceCx, chamberBottom + 26);
        ctx.textAlign = 'left';
      }

      // --- Animate & Draw Gas Particles ---
      // Speed scales with sqrt(T)
      const speedScale = Math.sqrt(temperature / 300) * 1.5;
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (isRunning) {
          p.x += p.vx * speedScale;
          p.y += p.vy * speedScale;

          // Left wall collision
          if (p.x - p.radius <= chamberLeft + 4) {
            p.x = chamberLeft + 4 + p.radius;
            p.vx = Math.abs(p.vx);
          }
          // Piston head collision (right wall)
          if (p.x + p.radius >= pistonX - 2) {
            p.x = pistonX - 2 - p.radius;
            p.vx = -Math.abs(p.vx);
          }
          // Top wall collision
          if (p.y - p.radius <= chamberTop + 4) {
            p.y = chamberTop + 4 + p.radius;
            p.vy = Math.abs(p.vy);
          }
          // Bottom wall collision
          if (p.y + p.radius >= chamberBottom - 4) {
            p.y = chamberBottom - 4 - p.radius;
            p.vy = -Math.abs(p.vy);
          }
        }

        // Draw particle with glow
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Mini Synchronized PV Isotherm Diagram on the Right ---
      const chartX = width - 210;
      const chartY = 40;
      const chartW = 180;
      const chartH = 150;

      ctx.fillStyle = '#121214';
      ctx.fillRect(chartX, chartY, chartW, chartH);
      ctx.strokeStyle = '#27272A';
      ctx.lineWidth = 1;
      ctx.strokeRect(chartX, chartY, chartW, chartH);

      // Axes
      ctx.strokeStyle = '#71717A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(chartX + 25, chartY + 15);
      ctx.lineTo(chartX + 25, chartY + chartH - 20);
      ctx.lineTo(chartX + chartW - 15, chartY + chartH - 20);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.fillText('P (atm)', chartX + 10, chartY + 12);
      ctx.fillText('V (L)', chartX + chartW - 22, chartY + chartH - 8);

      // Theoretical Isotherm Curve (P = nRT / V)
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let firstPoint = true;
      for (let vTest = 2.0; vTest <= 10.0; vTest += 0.4) {
        const pTest = (moles * R_ATM * temperature) / vTest;
        const px = chartX + 25 + ((vTest - 2.0) / 8.0) * (chartW - 45);
        const py = chartY + chartH - 20 - (Math.min(pTest, 12.0) / 12.0) * (chartH - 40);
        if (firstPoint) {
          ctx.moveTo(px, py);
          firstPoint = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Current State Point Dot (V, P) on the curve
      const currDotX = chartX + 25 + ((volume - 2.0) / 8.0) * (chartW - 45);
      const currDotY = chartY + chartH - 20 - (Math.min(pressureAtm, 12.0) / 12.0) * (chartH - 40);

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(currDotX, currDotY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Title on chart
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(`PV Isotherm (${temperature} K)`, chartX + 35, chartY + 25);

      if (isRunning) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [volume, temperature, moles, isRunning, pressureAtm]);

  const handleModeChange = (newMode: GasLawMode) => {
    setMode(newMode);
    if (newMode === 'boyle') {
      // Constant T = 300K
      setTemperature(300);
    } else if (newMode === 'charles') {
      // Pressure kept roughly steady
    } else if (newMode === 'gay_lussac') {
      // Constant V = 5.0 L
      setVolume(5.0);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] font-bold text-xs uppercase tracking-wider border border-[#F59E0B]/30">
                Thermodynamics & Kinetic Theory
              </span>
              <span className="text-xs text-[#A1A1AA]">· Physics & Chemistry Gas Laws</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] mt-1 flex items-center space-x-2">
              <Gauge className="w-5 h-5 text-[#F59E0B]" />
              <span>Kinetic Gas Laws & Piston Chamber Simulator</span>
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="px-3.5 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              {isRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isRunning ? 'Pause Gas' : 'Resume'}</span>
            </button>
            <button
              onClick={() => {
                setVolume(5.0);
                setTemperature(300);
                setMoles(1.0);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>STP Reset</span>
            </button>
          </div>
        </div>

        {/* Gas Law Presets */}
        <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-none">
          {[
            { id: 'ideal', label: 'Ideal Gas Equation (PV = nRT)' },
            { id: 'boyle', label: "Boyle's Law (P ∝ 1/V, Constant T)" },
            { id: 'charles', label: "Charles's Law (V ∝ T, Constant P)" },
            { id: 'gay_lussac', label: "Gay-Lussac's Law (P ∝ T, Constant V)" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleModeChange(item.id as GasLawMode)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                mode === item.id
                  ? 'bg-[#F59E0B] text-black font-bold shadow-md shadow-amber-500/20'
                  : 'bg-[#121214] border border-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Chamber Viewport */}
        <div className="lg:col-span-2 bg-[#000000] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-ping"></span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Molecular Motion & Piston Chamber
              </span>
            </div>
            <div className="text-[11px] text-[#A1A1AA]">
              v_rms = √(3RT/M) · Collisions create pressure
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-2xl border border-[#27272A]/70 bg-[#09090B]">
            <canvas ref={canvasRef} width={740} height={380} className="w-full h-auto block" />
          </div>

          {/* Quick Temperature State Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-[#A1A1AA]">Quick Thermal:</span>
              <button
                onClick={() => setTemperature(200)}
                className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 flex items-center space-x-1 cursor-pointer"
              >
                <Snowflake className="w-3.5 h-3.5" />
                <span>Cold (200 K)</span>
              </button>
              <button
                onClick={() => setTemperature(273.15)}
                className="px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] text-white hover:bg-[#27272A] cursor-pointer"
              >
                <span>STP (273 K)</span>
              </button>
              <button
                onClick={() => setTemperature(298.15)}
                className="px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] text-white hover:bg-[#27272A] cursor-pointer"
              >
                <span>Room (298 K)</span>
              </button>
              <button
                onClick={() => setTemperature(500)}
                className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 flex items-center space-x-1 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Hot (500 K)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry and Parameter Sliders */}
        <div className="space-y-5">
          {/* Digital Manometer Gauge Readout */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
              <span>Thermodynamic State Coordinates</span>
            </h3>

            <div className="p-3.5 rounded-2xl bg-[#121214] border border-[#27272A] text-center space-y-1">
              <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-semibold">Chamber Pressure:</span>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-[#F59E0B]">
                {pressureAtm.toFixed(2)} <span className="text-sm font-normal text-[#A1A1AA]">atm</span>
              </div>
              <div className="text-xs font-mono text-[#A1A1AA]">
                = {pressureKPa.toFixed(1)} kPa · {(pressureAtm * 760).toFixed(0)} mmHg
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                <span className="text-[10px] text-[#A1A1AA] block">Volume (V)</span>
                <span className="font-mono font-bold text-white text-sm">{volume.toFixed(1)} L</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                <span className="text-[10px] text-[#A1A1AA] block">Temp (T)</span>
                <span className="font-mono font-bold text-white text-sm">{temperature} K</span>
                <span className="text-[9px] text-[#71717A] block">{tempC.toFixed(0)}°C</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                <span className="text-[10px] text-[#A1A1AA] block">Moles (n)</span>
                <span className="font-mono font-bold text-white text-sm">{moles.toFixed(2)} mol</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] text-xs space-y-1">
              <div className="text-[#A1A1AA]">Governing Formula:</div>
              <div className="font-mono font-bold text-white">
                {mode === 'boyle' && 'P₁V₁ = P₂V₂ (T is constant)'}
                {mode === 'charles' && 'V₁/T₁ = V₂/T₂ (P is constant)'}
                {mode === 'gay_lussac' && 'P₁/T₁ = P₂/T₂ (V is constant)'}
                {mode === 'ideal' && 'PV = nRT (R = 0.08206 L·atm/(mol·K))'}
              </div>
            </div>
          </div>

          {/* Interactive Sliders */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-[#F59E0B]" />
              <span>Chamber Controls</span>
            </h3>

            <div className="space-y-4 text-xs">
              {/* Volume Slider (Disabled if Gay-Lussac mode) */}
              <div className={mode === 'gay_lussac' ? 'opacity-40 pointer-events-none' : ''}>
                <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                  <span>Volume V (Piston position):</span>
                  <span className="font-mono text-white font-bold">{volume.toFixed(1)} Liters</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="10.0"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-[#F59E0B] cursor-pointer"
                />
              </div>

              {/* Temperature Slider (Disabled if Boyle mode) */}
              <div className={mode === 'boyle' ? 'opacity-40 pointer-events-none' : ''}>
                <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                  <span>Temperature T (Kelvin):</span>
                  <span className="font-mono text-white font-bold">{temperature} K ({tempC.toFixed(0)}°C)</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="600"
                  step="5"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-[#F59E0B] cursor-pointer"
                />
              </div>

              {/* Moles Slider */}
              <div>
                <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                  <span>Amount of Gas n (Moles):</span>
                  <span className="font-mono text-white font-bold">{moles.toFixed(1)} mol</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={moles}
                  onChange={(e) => setMoles(Number(e.target.value))}
                  className="w-full accent-[#F59E0B] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
