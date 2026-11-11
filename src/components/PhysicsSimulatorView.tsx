import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Sparkles,
  Layers,
  Compass,
  Activity,
  Zap,
  Globe2,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const PhysicsSimulatorView: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [activeSim, setActiveSim] = useState<'projectile' | 'pendulum'>('projectile');

  // ==========================================
  // PROJECTILE MOTION LAB STATE
  // ==========================================
  const [velocity, setVelocity] = useState<number>(30); // m/s
  const [angleDeg, setAngleDeg] = useState<number>(45); // degrees
  const [initialHeight, setInitialHeight] = useState<number>(0); // meters
  const [gravityPreset, setGravityPreset] = useState<number>(9.81); // Earth
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simTime, setSimTime] = useState<number>(0);

  const projectileCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Physics formulas for projectile
  const thetaRad = (angleDeg * Math.PI) / 180;
  const vx0 = velocity * Math.cos(thetaRad);
  const vy0 = velocity * Math.sin(thetaRad);

  // Time of flight: y(t) = h0 + vy0*t - 0.5*g*t^2 = 0
  const timeOfFlight =
    (vy0 + Math.sqrt(vy0 * vy0 + 2 * gravityPreset * initialHeight)) / gravityPreset;
  const maxHeight = initialHeight + (vy0 * vy0) / (2 * gravityPreset);
  const totalRange = vx0 * timeOfFlight;

  // Animation frame loop for Projectile Motion
  useEffect(() => {
    let animId: number;
    if (isPlaying && activeSim === 'projectile') {
      const interval = 1000 / 60; // 60 fps
      animId = window.setInterval(() => {
        setSimTime((prev) => {
          if (prev >= timeOfFlight) {
            return 0; // loop
          }
          return prev + 0.03;
        });
      }, interval);
    }
    return () => clearInterval(animId);
  }, [isPlaying, activeSim, timeOfFlight]);

  // Projectile Motion Canvas Render
  useEffect(() => {
    if (activeSim !== 'projectile') return;
    const canvas = projectileCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = isDark ? '#0A0A0C' : '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Margins
    const padX = 40;
    const padY = 40;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    const scaleX = plotW / Math.max(totalRange * 1.15, 30);
    const scaleY = plotH / Math.max(maxHeight * 1.25, 20);

    const toScreenX = (x: number) => padX + x * scaleX;
    const toScreenY = (y: number) => height - padY - y * scaleY;

    // Ground line
    ctx.strokeStyle = isDark ? '#27272A' : '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padX - 10, height - padY);
    ctx.lineTo(width - padX + 10, height - padY);
    ctx.stroke();

    // Trajectory path curve
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const steps = 150;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * timeOfFlight;
      const x = vx0 * t;
      const y = initialHeight + vy0 * t - 0.5 * gravityPreset * t * t;
      const sx = toScreenX(x);
      const sy = toScreenY(Math.max(0, y));
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // Apex marker
    const apexTime = vy0 / gravityPreset;
    const apexX = vx0 * apexTime;
    const sxApex = toScreenX(apexX);
    const syApex = toScreenY(maxHeight);

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(sxApex, syApex, 4, 0, Math.PI * 2);
    ctx.fill();

    // Apex label
    ctx.fillStyle = isDark ? '#FCD34D' : '#D97706';
    ctx.font = '10px monospace';
    ctx.fillText(`H_max: ${maxHeight.toFixed(1)}m`, sxApex - 25, syApex - 8);

    // Active ball position
    const currentX = vx0 * simTime;
    const currentY = Math.max(0, initialHeight + vy0 * simTime - 0.5 * gravityPreset * simTime * simTime);
    const sxCurrent = toScreenX(currentX);
    const syCurrent = toScreenY(currentY);

    // Glow ball
    ctx.fillStyle = '#22C55E';
    ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(sxCurrent, syCurrent, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Velocity Vector Arrow
    const currentVy = vy0 - gravityPreset * simTime;
    const vecScale = 0.8;
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sxCurrent, syCurrent);
    ctx.lineTo(sxCurrent + vx0 * vecScale, syCurrent - currentVy * vecScale);
    ctx.stroke();

    ctx.restore();
  }, [
    activeSim,
    simTime,
    velocity,
    angleDeg,
    initialHeight,
    gravityPreset,
    maxHeight,
    totalRange,
    timeOfFlight,
    vx0,
    vy0,
    isDark,
  ]);

  // ==========================================
  // SIMPLE PENDULUM SIMULATION STATE
  // ==========================================
  const [pendulumLength, setPendulumLength] = useState<number>(1.5); // meters
  const [pendulumMass, setPendulumMass] = useState<number>(2.0); // kg
  const [initialAngleDeg, setInitialAngleDeg] = useState<number>(30); // degrees
  const [pendulumTime, setPendulumTime] = useState<number>(0);

  const pendulumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Period T = 2π * sqrt(L / g)
  const pendulumPeriod = 2 * Math.PI * Math.sqrt(pendulumLength / gravityPreset);
  const angularFrequency = Math.sqrt(gravityPreset / pendulumLength);

  // Instantaneous angle θ(t) = θ₀ * cos(ω * t)
  const currentAngleRad =
    ((initialAngleDeg * Math.PI) / 180) * Math.cos(angularFrequency * pendulumTime);
  const currentAngularVelocity =
    -((initialAngleDeg * Math.PI) / 180) * angularFrequency * Math.sin(angularFrequency * pendulumTime);

  // Energy calculations
  const linearVelocity = currentAngularVelocity * pendulumLength;
  const kineticEnergy = 0.5 * pendulumMass * linearVelocity * linearVelocity;
  const heightDrop = pendulumLength * (1 - Math.cos(currentAngleRad));
  const potentialEnergy = pendulumMass * gravityPreset * heightDrop;
  const totalMechanicalEnergy = kineticEnergy + potentialEnergy;

  // Animation frame loop for Pendulum
  useEffect(() => {
    let animId: number;
    if (isPlaying && activeSim === 'pendulum') {
      const interval = 1000 / 60;
      animId = window.setInterval(() => {
        setPendulumTime((prev) => prev + 0.025);
      }, interval);
    }
    return () => clearInterval(animId);
  }, [isPlaying, activeSim]);

  // Pendulum Canvas Render
  useEffect(() => {
    if (activeSim !== 'pendulum') return;
    const canvas = pendulumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = isDark ? '#0A0A0C' : '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const pivotX = width / 2;
    const pivotY = 50;
    const renderLength = Math.min(height * 0.65, pendulumLength * 120);

    const bobX = pivotX + renderLength * Math.sin(currentAngleRad);
    const bobY = pivotY + renderLength * Math.cos(currentAngleRad);

    // Pivot mount
    ctx.fillStyle = isDark ? '#3F3F46' : '#94A3B8';
    ctx.fillRect(pivotX - 30, pivotY - 6, 60, 6);

    ctx.fillStyle = isDark ? '#71717A' : '#64748B';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Equilibrium dashed line
    ctx.strokeStyle = isDark ? '#27272A' : '#E2E8F0';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, pivotY + renderLength + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // String / Rod
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Pendulum Bob
    ctx.fillStyle = '#38BDF8';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    const bobRadius = Math.min(18, 10 + pendulumMass * 1.5);
    ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }, [activeSim, currentAngleRad, pendulumLength, pendulumMass, isDark]);

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fadeIn select-none">
      {/* Header Bar */}
      <div className="bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center text-[#22C55E] shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                Visual Physics Lab & Interactive Simulators
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 uppercase tracking-wider">
                Simulations
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Real-time kinematic trajectories, pendulum harmonic motion, and live mechanical energy conservation
            </p>
          </div>
        </div>

        {/* Simulator Selector Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveSim('projectile');
              setSimTime(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeSim === 'projectile'
                ? 'bg-[#22C55E] text-white border-[#22C55E] shadow-sm shadow-emerald-500/20'
                : 'bg-[#18181B] text-zinc-400 border-[#27272A] hover:text-white'
            }`}
          >
            Projectile Motion
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSim('pendulum');
              setPendulumTime(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeSim === 'pendulum'
                ? 'bg-[#22C55E] text-white border-[#22C55E] shadow-sm shadow-emerald-500/20'
                : 'bg-[#18181B] text-zinc-400 border-[#27272A] hover:text-white'
            }`}
          >
            Simple Pendulum
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport */}
      {activeSim === 'projectile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Canvas Viewport (8 cols) */}
          <div className="lg:col-span-8 bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-[#22C55E]" />
                <span>Kinematic Trajectory & Apex</span>
              </span>

              {/* Play / Pause / Reset Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimTime(0)}
                  className="p-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-zinc-400 hover:text-white border border-[#27272A] transition-colors cursor-pointer"
                  title="Reset simulation time"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden my-3 border border-[#27272A] relative">
              <canvas ref={projectileCanvasRef} className="w-full h-full block" />
              <div className="absolute top-3 right-3 bg-black/80 px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-zinc-300 pointer-events-none">
                Time: {simTime.toFixed(2)}s / {timeOfFlight.toFixed(2)}s
              </div>
            </div>

            {/* Results Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-[#121417] p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] font-sans text-zinc-400 block">Max Height (H_max)</span>
                <span className="text-sm font-bold text-amber-400">{maxHeight.toFixed(2)} m</span>
              </div>
              <div className="bg-[#121417] p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] font-sans text-zinc-400 block">Total Range (R)</span>
                <span className="text-sm font-bold text-[#22C55E]">{totalRange.toFixed(2)} m</span>
              </div>
              <div className="bg-[#121417] p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] font-sans text-zinc-400 block">Flight Time (T)</span>
                <span className="text-sm font-bold text-white">{timeOfFlight.toFixed(2)} s</span>
              </div>
              <div className="bg-[#121417] p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] font-sans text-zinc-400 block">Velocity (vx, vy0)</span>
                <span className="text-sm font-bold text-sky-400">
                  {vx0.toFixed(1)}, {vy0.toFixed(1)} m/s
                </span>
              </div>
            </div>
          </div>

          {/* Controls Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-[#22C55E]" />
              <span>Launch Parameters</span>
            </h3>

            {/* Launch Speed */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-zinc-400">Launch Velocity (u):</span>
                <span className="text-white font-bold">{velocity} m/s</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={velocity}
                onChange={(e) => setVelocity(parseFloat(e.target.value))}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>

            {/* Launch Angle */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-zinc-400">Launch Angle (θ):</span>
                <span className="text-white font-bold">{angleDeg}°</span>
              </div>
              <input
                type="range"
                min="5"
                max="85"
                value={angleDeg}
                onChange={(e) => setAngleDeg(parseFloat(e.target.value))}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>

            {/* Initial Height */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-zinc-400">Platform Height (h₀):</span>
                <span className="text-white font-bold">{initialHeight} m</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={initialHeight}
                onChange={(e) => setInitialHeight(parseFloat(e.target.value))}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>

            {/* Gravity Planet Presets */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-[#27272A]">
              <label className="text-zinc-400 font-semibold flex items-center space-x-1">
                <Globe2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Planetary Gravity (g):</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { name: 'Earth', g: 9.81 },
                  { name: 'Moon', g: 1.62 },
                  { name: 'Mars', g: 3.71 },
                  { name: 'Jupiter', g: 24.79 },
                ].map((planet) => (
                  <button
                    key={planet.name}
                    type="button"
                    onClick={() => setGravityPreset(planet.g)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      gravityPreset === planet.g
                        ? 'bg-[#22C55E]/15 border-[#22C55E] text-white font-bold'
                        : 'bg-[#121417] border-[#27272A] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-xs">{planet.name}</span>
                    <span className="text-[10px] font-mono text-zinc-400">{planet.g} m/s²</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PENDULUM SIMULATION VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-[#22C55E]" />
                <span>Simple Harmonic Motion & Energy Conservation</span>
              </span>

              <button
                type="button"
                onClick={() => setIsPlaying((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
            </div>

            <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden my-3 border border-[#27272A] relative">
              <canvas ref={pendulumCanvasRef} className="w-full h-full block" />
            </div>

            {/* Energy Conservation Meter */}
            <div className="p-3.5 rounded-2xl bg-[#121417] border border-[#27272A] space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Conservation of Mechanical Energy (E = KE + PE):</span>
                <span>{totalMechanicalEnergy.toFixed(2)} Joules</span>
              </div>

              {/* Kinetic Energy Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Kinetic Energy (KE = ½mv²):</span>
                  <span className="text-sky-400 font-bold">{kineticEnergy.toFixed(2)} J</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-400 transition-all duration-75"
                    style={{
                      width: `${totalMechanicalEnergy > 0 ? (kineticEnergy / totalMechanicalEnergy) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Potential Energy Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Potential Energy (PE = mgh):</span>
                  <span className="text-[#22C55E] font-bold">{potentialEnergy.toFixed(2)} J</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-[#22C55E] transition-all duration-75"
                    style={{
                      width: `${totalMechanicalEnergy > 0 ? (potentialEnergy / totalMechanicalEnergy) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pendulum Controls */}
          <div className="lg:col-span-4 bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-[#22C55E]" />
              <span>Pendulum Parameters</span>
            </h3>

            {/* Length */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-zinc-400">String Length (L):</span>
                <span className="text-white font-bold">{pendulumLength} m</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={pendulumLength}
                onChange={(e) => setPendulumLength(parseFloat(e.target.value))}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>

            {/* Mass */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-zinc-400">Bob Mass (m):</span>
                <span className="text-white font-bold">{pendulumMass} kg</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={pendulumMass}
                onChange={(e) => setPendulumMass(parseFloat(e.target.value))}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>

            {/* Release Angle */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-zinc-400">Release Angle (θ₀):</span>
                <span className="text-white font-bold">{initialAngleDeg}°</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={initialAngleDeg}
                onChange={(e) => setInitialAngleDeg(parseFloat(e.target.value))}
                className="w-full accent-[#22C55E] cursor-pointer"
              />
            </div>

            {/* Period output */}
            <div className="p-3 rounded-2xl bg-[#121417] border border-[#27272A] space-y-1 text-xs font-mono">
              <span className="text-[10px] text-zinc-400 block font-sans">Oscillation Period T = 2π√(L/g)</span>
              <span className="text-base font-bold text-[#22C55E]">{pendulumPeriod.toFixed(2)} seconds</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
