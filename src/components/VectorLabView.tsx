import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  RotateCcw,
  Sliders,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Download,
  Info,
  TrendingUp,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

export interface VectorItem {
  id: string;
  name: string;
  magnitude: number;
  angleDeg: number;
  color: string;
  visible: boolean;
}

const VECTOR_COLORS = ['#22C55E', '#38BDF8', '#F59E0B', '#EC4899', '#A855F7', '#EAB308'];

export const VectorLabView: React.FC = () => {
  const [vectors, setVectors] = useState<VectorItem[]>([
    { id: 'v1', name: 'F₁', magnitude: 40, angleDeg: 30, color: '#22C55E', visible: true },
    { id: 'v2', name: 'F₂', magnitude: 30, angleDeg: 120, color: '#38BDF8', visible: true },
  ]);

  const [mode, setMode] = useState<'concurrent' | 'head_to_tail' | 'inclined_plane'>('concurrent');
  const [showComponents, setShowComponents] = useState(true);
  const [showResultant, setShowResultant] = useState(true);
  const [showEquilibrant, setShowEquilibrant] = useState(false);

  // Inclined plane parameters
  const [inclineAngle, setInclineAngle] = useState(30);
  const [mass, setMass] = useState(5); // kg
  const [frictionCoeff, setFrictionCoeff] = useState(0.2);
  const g = 9.8;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate Resultant Vector
  const resultant = useCallback(() => {
    let rx = 0;
    let ry = 0;
    vectors.forEach((v) => {
      if (v.visible) {
        const rad = (v.angleDeg * Math.PI) / 180;
        rx += v.magnitude * Math.cos(rad);
        ry += v.magnitude * Math.sin(rad);
      }
    });
    const mag = Math.sqrt(rx * rx + ry * ry);
    let angleRad = Math.atan2(ry, rx);
    let angleDeg = (angleRad * 180) / Math.PI;
    if (angleDeg < 0) angleDeg += 360;
    return { rx, ry, mag, angleDeg };
  }, [vectors]);

  // Canvas drawing
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

    // Dark sleek canvas
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // MODE 1 & 2: CONCURRENT OR HEAD-TO-TAIL
    if (mode === 'concurrent' || mode === 'head_to_tail') {
      const centerX = width * 0.48;
      const centerY = height * 0.52;

      // Draw subtle coordinate grid
      ctx.strokeStyle = '#1F1F23';
      ctx.lineWidth = 1;
      const gridSize = 35;
      for (let x = centerX % gridSize; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = centerY % gridSize; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Main Axes
      ctx.strokeStyle = '#3F3F46';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(30, centerY);
      ctx.lineTo(width - 30, centerY);
      ctx.moveTo(centerX, 30);
      ctx.lineTo(centerX, height - 30);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#71717A';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText('+X', width - 25, centerY + 14);
      ctx.fillText('+Y', centerX + 8, 25);
      ctx.fillText('(0,0)', centerX - 26, centerY + 14);

      // Scale factor so vectors fit nicely
      const maxMag = Math.max(...vectors.map((v) => v.magnitude), 50);
      const scale = (Math.min(width, height) * 0.36) / (maxMag || 50);

      const drawArrow = (
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        color: string,
        label: string,
        isDashed = false,
        arrowSize = 8
      ) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.5;
        if (isDashed) ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(toY - fromY, toX - fromX);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - arrowSize * Math.cos(angle - Math.PI / 6), toY - arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - arrowSize * Math.cos(angle + Math.PI / 6), toY - arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        ctx.fillText(label, midX + 8, midY - 6);
        ctx.restore();
      };

      if (mode === 'concurrent') {
        // Draw each vector from origin
        vectors.forEach((v) => {
          if (!v.visible) return;
          const rad = (v.angleDeg * Math.PI) / 180;
          const vx = v.magnitude * Math.cos(rad);
          const vy = v.magnitude * Math.sin(rad);

          const endX = centerX + vx * scale;
          const endY = centerY - vy * scale; // invert Y for screen coords

          // Optional rectangular components
          if (showComponents) {
            ctx.save();
            ctx.strokeStyle = `${v.color}55`;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(endX, centerY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.restore();
          }

          drawArrow(centerX, centerY, endX, endY, v.color, `${v.name} (${v.magnitude.toFixed(0)}N)`);
        });
      } else {
        // HEAD-TO-TAIL POLYGON
        let currX = centerX;
        let currY = centerY;

        vectors.forEach((v) => {
          if (!v.visible) return;
          const rad = (v.angleDeg * Math.PI) / 180;
          const vx = v.magnitude * Math.cos(rad);
          const vy = v.magnitude * Math.sin(rad);

          const nextX = currX + vx * scale;
          const nextY = currY - vy * scale;

          drawArrow(currX, currY, nextX, nextY, v.color, `${v.name}`);
          currX = nextX;
          currY = nextY;
        });
      }

      // Draw Resultant R
      const res = resultant();
      if (showResultant && res.mag > 0.01) {
        const resEndX = centerX + res.rx * scale;
        const resEndY = centerY - res.ry * scale;

        drawArrow(
          centerX,
          centerY,
          resEndX,
          resEndY,
          '#E11D48',
          `R (${res.mag.toFixed(1)}N, ${res.angleDeg.toFixed(1)}°)`,
          false,
          10
        );

        // Angle arc for resultant
        ctx.save();
        ctx.strokeStyle = '#E11D4888';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 32, 0, -(res.angleDeg * Math.PI) / 180, true);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Equilibrant E = -R
      if (showEquilibrant && res.mag > 0.01) {
        const eqEndX = centerX - res.rx * scale;
        const eqEndY = centerY + res.ry * scale;
        const eqAngle = (res.angleDeg + 180) % 360;

        drawArrow(
          centerX,
          centerY,
          eqEndX,
          eqEndY,
          '#F59E0B',
          `E = -R (${res.mag.toFixed(1)}N, ${eqAngle.toFixed(1)}°)`,
          true,
          10
        );
      }
    }

    // MODE 3: INCLINED PLANE MECHANICS
    else if (mode === 'inclined_plane') {
      const alphaRad = (inclineAngle * Math.PI) / 180;
      const baseLen = width * 0.65;
      const startX = 60;
      const groundY = height * 0.78;

      const topX = startX + baseLen * Math.cos(alphaRad);
      const topY = groundY - baseLen * Math.sin(alphaRad);

      // 1. Draw Incline Triangle
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.moveTo(startX, groundY);
      ctx.lineTo(topX, groundY);
      ctx.lineTo(topX, topY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#3F3F46';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Incline Angle Arc
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(startX, groundY, 40, 0, -alphaRad, true);
      ctx.stroke();
      ctx.fillStyle = '#22C55E';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText(`θ = ${inclineAngle}°`, startX + 46, groundY - 10);

      // 2. Position Block on Ramp (at midpoint of slope)
      const slopeMidX = (startX + topX) / 2;
      const slopeMidY = (groundY + topY) / 2;

      ctx.save();
      ctx.translate(slopeMidX, slopeMidY);
      ctx.rotate(-alphaRad);

      const blockW = 54;
      const blockH = 34;

      // Draw block
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-blockW / 2, -blockH, blockW, blockH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${mass}kg`, 0, -blockH / 2 + 4);
      ctx.restore();

      // 3. Draw Force Vectors from Block Center
      const blockCenterX = slopeMidX - (blockH / 2) * Math.sin(alphaRad);
      const blockCenterY = slopeMidY - (blockH / 2) * Math.cos(alphaRad);

      const weight = mass * g; // W = mg
      const normal = weight * Math.cos(alphaRad); // N = mg cos θ
      const parallelGravity = weight * Math.sin(alphaRad); // F_p = mg sin θ
      const maxFriction = frictionCoeff * normal; // f_s = μ N
      const netForce = parallelGravity - maxFriction;
      const acceleration = netForce > 0 ? netForce / mass : 0;

      const fScale = 1.2;

      const drawPlaneArrow = (toDx: number, toDy: number, color: string, label: string) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.5;
        const targetX = blockCenterX + toDx;
        const targetY = blockCenterY + toDy;

        ctx.beginPath();
        ctx.moveTo(blockCenterX, blockCenterY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        const ang = Math.atan2(toDy, toDx);
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(targetX - 8 * Math.cos(ang - Math.PI / 6), targetY - 8 * Math.sin(ang - Math.PI / 6));
        ctx.lineTo(targetX - 8 * Math.cos(ang + Math.PI / 6), targetY - 8 * Math.sin(ang + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.fillText(label, targetX + 6, targetY + 4);
        ctx.restore();
      };

      // Weight W = mg (straight down)
      drawPlaneArrow(0, weight * fScale * 0.8, '#EF4444', `W = mg (${weight.toFixed(1)}N)`);

      // Normal Reaction N (perpendicular to plane, pointing away)
      const nx = -normal * fScale * Math.sin(alphaRad);
      const ny = -normal * fScale * Math.cos(alphaRad);
      drawPlaneArrow(nx, ny, '#38BDF8', `N = mg·cosθ (${normal.toFixed(1)}N)`);

      // Downslope Gravity mg sin θ (along plane pointing down)
      const gx = -parallelGravity * fScale * Math.cos(alphaRad);
      const gy = parallelGravity * fScale * Math.sin(alphaRad);
      drawPlaneArrow(gx, gy, '#22C55E', `mg·sinθ (${parallelGravity.toFixed(1)}N)`);

      // Friction Force f = μN (along plane pointing up)
      const fx = maxFriction * fScale * Math.cos(alphaRad);
      const fy = -maxFriction * fScale * Math.sin(alphaRad);
      drawPlaneArrow(fx, fy, '#F59E0B', `f = μN (${maxFriction.toFixed(1)}N)`);

      // Telemetry HUD overlay in top-right
      ctx.fillStyle = '#0F172AEE';
      ctx.strokeStyle = '#27272A';
      ctx.lineWidth = 1.5;
      const hudW = 210;
      const hudH = 115;
      const hudX = width - hudW - 20;
      const hudY = 20;
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, hudW, hudH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Net Force: ${netForce.toFixed(2)} N`, hudX + 14, hudY + 28);
      ctx.fillStyle = acceleration > 0 ? '#22C55E' : '#A1A1AA';
      ctx.fillText(`Acceleration: ${acceleration.toFixed(2)} m/s²`, hudX + 14, hudY + 48);
      ctx.fillStyle = '#38BDF8';
      ctx.fillText(`State: ${acceleration > 0 ? 'Accelerating Down' : 'Stationary (Static Equilibrium)'}`, hudX + 14, hudY + 68);
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`Friction Coeff μ: ${frictionCoeff}`, hudX + 14, hudY + 88);
    }
  }, [vectors, mode, showComponents, showResultant, showEquilibrant, inclineAngle, mass, frictionCoeff, resultant]);

  const addVector = () => {
    const nextIdx = vectors.length + 1;
    const color = VECTOR_COLORS[(nextIdx - 1) % VECTOR_COLORS.length];
    setVectors([
      ...vectors,
      {
        id: `v_${Date.now()}`,
        name: `F${nextIdx}`,
        magnitude: 35,
        angleDeg: (nextIdx * 60) % 360,
        color,
        visible: true,
      },
    ]);
  };

  const removeVector = (id: string) => {
    if (vectors.length <= 1) return;
    setVectors(vectors.filter((v) => v.id !== id));
  };

  const updateVector = (id: string, updates: Partial<VectorItem>) => {
    setVectors(vectors.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  // Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'perpendicular') {
      setMode('concurrent');
      setVectors([
        { id: 'v1', name: 'F_x', magnitude: 40, angleDeg: 0, color: '#22C55E', visible: true },
        { id: 'v2', name: 'F_y', magnitude: 30, angleDeg: 90, color: '#38BDF8', visible: true },
      ]);
    } else if (presetName === 'equilibrium') {
      setMode('concurrent');
      setVectors([
        { id: 'v1', name: 'F₁', magnitude: 40, angleDeg: 0, color: '#22C55E', visible: true },
        { id: 'v2', name: 'F₂', magnitude: 40, angleDeg: 120, color: '#38BDF8', visible: true },
        { id: 'v3', name: 'F₃', magnitude: 40, angleDeg: 240, color: '#F59E0B', visible: true },
      ]);
    } else if (presetName === 'incline') {
      setMode('inclined_plane');
      setInclineAngle(35);
      setMass(6);
      setFrictionCoeff(0.25);
    }
  };

  const res = resultant();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] flex-shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                2D Vector & Force Polygon Lab
              </h2>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                Interactive
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1AA]">
              Vector addition, force resolution, polygon closure, and inclined plane mechanics.
            </p>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex flex-wrap items-center bg-[#18181B] p-1 rounded-2xl border border-[#27272A] text-xs font-semibold">
          <button
            onClick={() => setMode('concurrent')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              mode === 'concurrent' ? 'bg-[#22C55E] text-white font-bold shadow-md' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Concurrent Forces
          </button>
          <button
            onClick={() => setMode('head_to_tail')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              mode === 'head_to_tail' ? 'bg-[#22C55E] text-white font-bold shadow-md' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Head-to-Tail Polygon
          </button>
          <button
            onClick={() => setMode('inclined_plane')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              mode === 'inclined_plane' ? 'bg-[#22C55E] text-white font-bold shadow-md' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Inclined Plane Lab
          </button>
        </div>
      </div>

      {/* Main Interactive Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Canvas Vector Simulation Stage */}
        <div className="lg:col-span-8 bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between text-xs text-[#A1A1AA] pb-1 border-b border-[#27272A]">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <span>Canvas Visualizer</span>
              <span className="text-[10px] text-[#22C55E]">({mode.replace('_', ' ').toUpperCase()})</span>
            </span>

            {mode !== 'inclined_plane' && (
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showComponents}
                    onChange={(e) => setShowComponents(e.target.checked)}
                    className="accent-[#22C55E] rounded"
                  />
                  <span>Components</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showResultant}
                    onChange={(e) => setShowResultant(e.target.checked)}
                    className="accent-[#E11D48] rounded"
                  />
                  <span>Resultant R</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showEquilibrant}
                    onChange={(e) => setShowEquilibrant(e.target.checked)}
                    className="accent-[#F59E0B] rounded"
                  />
                  <span>Equilibrant E</span>
                </label>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="relative w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden bg-[#09090B] border border-[#27272A]">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          {/* Quick Presets Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-bold text-[#A1A1AA]">Standard Exam Presets:</span>
            <button
              onClick={() => applyPreset('perpendicular')}
              className="px-2.5 py-1 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] cursor-pointer"
            >
              3-4-5 Perpendicular (30N & 40N)
            </button>
            <button
              onClick={() => applyPreset('equilibrium')}
              className="px-2.5 py-1 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] cursor-pointer"
            >
              3 Forces Equilibrium (120°)
            </button>
            <button
              onClick={() => applyPreset('incline')}
              className="px-2.5 py-1 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A] cursor-pointer"
            >
              Inclined Plane (35° Incline)
            </button>
          </div>
        </div>

        {/* Right Side: Controls & Numerical Derivation */}
        <div className="lg:col-span-4 space-y-5">
          {mode !== 'inclined_plane' ? (
            /* Vector Controls List */
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-[#22C55E]" />
                  <span>Forces / Vectors ({vectors.length})</span>
                </h3>
                <button
                  onClick={addVector}
                  disabled={vectors.length >= 6}
                  className="px-2.5 py-1 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Vector</span>
                </button>
              </div>

              {/* Vector sliders list */}
              <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
                {vectors.map((v) => {
                  const rad = (v.angleDeg * Math.PI) / 180;
                  const fx = v.magnitude * Math.cos(rad);
                  const fy = v.magnitude * Math.sin(rad);

                  return (
                    <div
                      key={v.id}
                      className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color }} />
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => updateVector(v.id, { name: e.target.value })}
                            className="w-14 bg-transparent font-bold text-white focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center space-x-2 text-[#A1A1AA]">
                          <span>
                            {v.magnitude.toFixed(0)}N @ {v.angleDeg.toFixed(0)}°
                          </span>
                          {vectors.length > 1 && (
                            <button
                              onClick={() => removeVector(v.id)}
                              className="text-[#71717A] hover:text-[#EF4444] p-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Magnitude Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-[#71717A]">
                          <span>Magnitude</span>
                          <span className="text-white font-mono">{v.magnitude} N</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={100}
                          value={v.magnitude}
                          onChange={(e) => updateVector(v.id, { magnitude: parseFloat(e.target.value) })}
                          className="w-full h-1.5 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#22C55E]"
                        />
                      </div>

                      {/* Angle Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-[#71717A]">
                          <span>Direction Angle θ</span>
                          <span className="text-white font-mono">{v.angleDeg}°</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={360}
                          value={v.angleDeg}
                          onChange={(e) => updateVector(v.id, { angleDeg: parseFloat(e.target.value) })}
                          className="w-full h-1.5 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
                        />
                      </div>

                      {/* Components Preview */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono text-[#A1A1AA]">
                        <div className="bg-[#18181B] px-2 py-1 rounded-lg">
                          F_x = {fx.toFixed(1)} N
                        </div>
                        <div className="bg-[#18181B] px-2 py-1 rounded-lg">
                          F_y = {fy.toFixed(1)} N
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resultant Summary Card */}
              <div className="p-3.5 rounded-2xl bg-[#E11D48]/10 border border-[#E11D48]/30 space-y-1.5 text-xs">
                <span className="font-bold text-[#E11D48] uppercase tracking-wider block text-[11px]">
                  Net Resultant Vector (R)
                </span>
                <div className="space-y-1 font-mono text-white text-xs">
                  <div>
                    R_x = Σ F_x = <strong>{res.rx.toFixed(2)} N</strong>
                  </div>
                  <div>
                    R_y = Σ F_y = <strong>{res.ry.toFixed(2)} N</strong>
                  </div>
                  <div className="text-sm font-bold text-[#E11D48] pt-1">
                    |R| = √(R_x² + R_y²) = {res.mag.toFixed(2)} N @ {res.angleDeg.toFixed(1)}°
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Inclined Plane Parameter Controls */
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 pb-2 border-b border-[#27272A]">
                <Sliders className="w-4 h-4 text-[#22C55E]" />
                <span>Inclined Plane Parameters</span>
              </h3>

              {/* Incline Angle */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#A1A1AA]">
                  <span>Plane Angle (θ)</span>
                  <span className="text-white font-bold font-mono">{inclineAngle}°</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={75}
                  value={inclineAngle}
                  onChange={(e) => setInclineAngle(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#22C55E]"
                />
              </div>

              {/* Mass */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#A1A1AA]">
                  <span>Block Mass (m)</span>
                  <span className="text-white font-bold font-mono">{mass} kg</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.5}
                  value={mass}
                  onChange={(e) => setMass(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
                />
              </div>

              {/* Friction Coefficient */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[#A1A1AA]">
                  <span>Coefficient of Friction (μ)</span>
                  <span className="text-white font-bold font-mono">{frictionCoeff}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={frictionCoeff}
                  onChange={(e) => setFrictionCoeff(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
                />
              </div>

              {/* Incline Physics Equations Card */}
              <div className="p-3.5 rounded-2xl bg-[#121214] border border-[#27272A] space-y-2 text-[#D4D4D8]">
                <span className="font-bold text-[#22C55E] uppercase tracking-wider block text-[11px]">
                  Governing Force Equations
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div>Weight: W = mg = {(mass * g).toFixed(1)} N</div>
                  <div>Normal: N = mg·cosθ = {(mass * g * Math.cos((inclineAngle * Math.PI) / 180)).toFixed(1)} N</div>
                  <div>Pull: F_p = mg·sinθ = {(mass * g * Math.sin((inclineAngle * Math.PI) / 180)).toFixed(1)} N</div>
                  <div>Friction: f = μN = {(frictionCoeff * mass * g * Math.cos((inclineAngle * Math.PI) / 180)).toFixed(1)} N</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
