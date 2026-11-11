import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  Sliders,
  RotateCcw,
  Info,
  Maximize2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Sun,
  Layers,
} from 'lucide-react';

type OpticsMode = 'convex_lens' | 'concave_lens' | 'concave_mirror' | 'convex_mirror' | 'refraction';

export const OpticsLabView: React.FC = () => {
  const [mode, setMode] = useState<OpticsMode>('convex_lens');

  // Lens/Mirror parameters (in cm)
  const [focalLength, setFocalLength] = useState<number>(20);
  const [objectDistance, setObjectDistance] = useState<number>(35); // u in cm
  const [objectHeight, setObjectHeight] = useState<number>(15); // ho in cm

  // Refraction parameters
  const [incidentAngle, setIncidentAngle] = useState<number>(45); // degrees
  const [n1, setN1] = useState<number>(1.0); // Medium 1 (air = 1.0)
  const [n2, setN2] = useState<number>(1.5); // Medium 2 (glass = 1.5)

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculations for Lens & Mirrors
  const isLens = mode === 'convex_lens' || mode === 'concave_lens';
  const isMirror = mode === 'concave_mirror' || mode === 'convex_mirror';

  // Sign convention
  // For convex lens: f is positive (+20)
  // For concave lens: f is negative (-20)
  // For concave mirror: f is negative (-20) in Cartesian or focal point in front
  const effectiveF = mode === 'concave_lens' || mode === 'convex_mirror' ? -Math.abs(focalLength) : Math.abs(focalLength);
  const u = Math.abs(objectDistance); // Object is in front (u > 0)

  // Lens formula: 1/f = 1/v - 1/(-u) = 1/v + 1/u  => 1/v = 1/f - 1/u => v = (f * u) / (u - f)
  // Mirror formula: 1/f = 1/v + 1/u => 1/v = 1/f - 1/u => v = (f * u) / (u - f)
  const denominator = u - effectiveF;
  const isAtFocus = Math.abs(denominator) < 0.2;
  const imageDistance = isAtFocus ? Infinity : (effectiveF * u) / denominator; // v in cm
  const magnification = isAtFocus ? Infinity : isLens ? -imageDistance / u : -imageDistance / u;
  const imageHeight = isAtFocus ? Infinity : magnification * objectHeight;

  // Nature of image
  let imageNature = '';
  let imagePositionText = '';
  if (isAtFocus) {
    imageNature = 'At Infinity (Parallel rays, highly magnified)';
    imagePositionText = 'v = ∞';
  } else if (isLens) {
    if (imageDistance > 0) {
      imageNature = 'Real, Inverted, on opposite side of lens';
    } else {
      imageNature = 'Virtual, Upright, on same side as object (Magnifying Glass)';
    }
    imagePositionText = `v = ${Math.abs(imageDistance).toFixed(1)} cm (${imageDistance > 0 ? 'Behind lens' : 'In front of lens'})`;
  } else if (isMirror) {
    if (mode === 'concave_mirror') {
      if (imageDistance > 0) {
        imageNature = 'Real, Inverted, in front of mirror';
        imagePositionText = `v = ${Math.abs(imageDistance).toFixed(1)} cm (In front of mirror)`;
      } else {
        imageNature = 'Virtual, Upright, behind mirror (Shaving/Dentist mirror)';
        imagePositionText = `v = ${Math.abs(imageDistance).toFixed(1)} cm (Behind mirror)`;
      }
    } else {
      imageNature = 'Virtual, Upright, Diminished, behind mirror (Rearview mirror)';
      imagePositionText = `v = ${Math.abs(imageDistance).toFixed(1)} cm (Behind mirror)`;
    }
  }

  // Refraction calculations
  const rad1 = (incidentAngle * Math.PI) / 180;
  // Snell's Law: n1 * sin(theta1) = n2 * sin(theta2)
  const sinTheta2 = (n1 * Math.sin(rad1)) / n2;
  const isTotalInternalReflection = sinTheta2 > 1.0;
  const refractedAngleDeg = isTotalInternalReflection ? null : (Math.asin(sinTheta2) * 180) / Math.PI;
  const criticalAngleDeg = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;

  // Render optical ray diagram on canvas
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

    // Grid lines
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (mode === 'refraction') {
      // Draw Refraction / Snell's Law Diagram
      const cx = width / 2;
      const cy = height / 2;

      // Top medium
      ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.fillRect(0, 0, width, cy);
      // Bottom medium
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.fillRect(0, cy, width, height - cy);

      // Boundary line
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      // Normal line (dashed)
      ctx.strokeStyle = '#A1A1AA';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, 30);
      ctx.lineTo(cx, height - 30);
      ctx.stroke();
      ctx.setLineDash([]);

      // Medium labels
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = '#60A5FA';
      ctx.fillText(`Medium 1 (n₁ = ${n1.toFixed(2)})`, 20, 40);
      ctx.fillStyle = '#34D399';
      ctx.fillText(`Medium 2 (n₂ = ${n2.toFixed(2)})`, 20, cy + 35);

      // Normal label
      ctx.fillStyle = '#A1A1AA';
      ctx.fillText('Normal (N)', cx + 8, 45);

      // Incident ray (from top-left to center)
      const rayLen = Math.min(width, height) * 0.42;
      const incRad = (incidentAngle * Math.PI) / 180;
      const incX = cx - rayLen * Math.sin(incRad);
      const incY = cy - rayLen * Math.cos(incRad);

      ctx.strokeStyle = '#FBBF24'; // Yellow light ray
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(incX, incY);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Arrow on incident ray
      const midIncX = (incX + cx) / 2;
      const midIncY = (incY + cy) / 2;
      drawArrowHead(ctx, incX, incY, cx, cy, '#FBBF24');

      // Incident angle arc
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 35, -Math.PI / 2 - incRad, -Math.PI / 2);
      ctx.stroke();
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = '#FBBF24';
      ctx.fillText(`θ₁ = ${incidentAngle}°`, cx - 55, cy - 40);

      if (isTotalInternalReflection) {
        // Total Internal Reflection Ray (Reflected back into medium 1)
        const refX = cx + rayLen * Math.sin(incRad);
        const refY = cy - rayLen * Math.cos(incRad);

        ctx.strokeStyle = '#EF4444'; // Red reflected ray
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(refX, refY);
        ctx.stroke();
        drawArrowHead(ctx, cx, cy, refX, refY, '#EF4444');

        // Reflected angle arc
        ctx.strokeStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(cx, cy, 35, -Math.PI / 2, -Math.PI / 2 + incRad);
        ctx.stroke();
        ctx.fillStyle = '#EF4444';
        ctx.fillText(`θ_r = ${incidentAngle}°`, cx + 20, cy - 40);

        // TIR Badge on canvas
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.strokeStyle = '#EF4444';
        ctx.beginPath();
        ctx.roundRect(cx - 130, cy + 50, 260, 40, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ TOTAL INTERNAL REFLECTION (TIR)', cx, cy + 74);
        ctx.textAlign = 'left';
      } else if (refractedAngleDeg !== null) {
        // Refracted ray (into medium 2)
        const refrRad = (refractedAngleDeg * Math.PI) / 180;
        const refrX = cx + rayLen * Math.sin(refrRad);
        const refrY = cy + rayLen * Math.cos(refrRad);

        ctx.strokeStyle = '#22C55E'; // Green refracted ray
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(refrX, refrY);
        ctx.stroke();
        drawArrowHead(ctx, cx, cy, refrX, refrY, '#22C55E');

        // Partial weak reflection ray back into medium 1
        const refX = cx + rayLen * 0.7 * Math.sin(incRad);
        const refY = cy - rayLen * 0.7 * Math.cos(incRad);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(refX, refY);
        ctx.stroke();

        // Refracted angle arc
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 35, Math.PI / 2 - refrRad, Math.PI / 2);
        ctx.stroke();
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = '#22C55E';
        ctx.fillText(`θ₂ = ${refractedAngleDeg.toFixed(1)}°`, cx + 18, cy + 45);
      }
      return;
    }

    // --- Lens / Mirror Ray Tracing ---
    const cx = width / 2; // Optical center / Pole
    const cy = height / 2; // Principal axis
    const scale = 5.0; // 1 cm = 5.0 pixels

    // Principal Axis line
    ctx.strokeStyle = '#52525B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();

    // Optical element (Lens or Mirror) vertical line at cx
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 140);
    ctx.lineTo(cx, cy + 140);
    ctx.stroke();

    // Lens / Mirror shape decoration
    if (mode === 'convex_lens') {
      // Double convex lens curve
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 14, 130, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (mode === 'concave_lens') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 130);
      ctx.lineTo(cx + 10, cy - 130);
      ctx.quadraticCurveTo(cx, cy, cx + 10, cy + 130);
      ctx.lineTo(cx - 10, cy + 130);
      ctx.quadraticCurveTo(cx, cy, cx - 10, cy - 130);
      ctx.fill();
      ctx.stroke();
    } else if (mode === 'concave_mirror') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.arc(cx + 80, cy, 120, Math.PI * 0.75, Math.PI * 1.25);
      ctx.stroke();
    } else if (mode === 'convex_mirror') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.arc(cx - 80, cy, 120, -Math.PI * 0.25, Math.PI * 0.25);
      ctx.stroke();
    }

    // Focal Points and 2F / Center of Curvature C
    const fPx = Math.abs(focalLength) * scale;
    const f1X = cx - fPx;
    const f2X = cx + fPx;
    const c1X = cx - 2 * fPx;
    const c2X = cx + 2 * fPx;

    const drawFocalPoint = (x: number, label: string) => {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(x, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = '#F87171';
      ctx.fillText(label, x - 6, cy + 18);
    };

    drawFocalPoint(f1X, 'F₁');
    drawFocalPoint(f2X, 'F₂');
    drawFocalPoint(c1X, isLens ? '2F₁' : 'C');
    if (isLens) drawFocalPoint(c2X, '2F₂');

    // Optical Center / Pole O
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#E4E4E7';
    ctx.fillText(isLens ? 'O' : 'P', cx + 6, cy - 8);

    // Draw Object Arrow (Upright arrow on the left)
    const objX = cx - u * scale;
    const objH = objectHeight * scale;
    const objTopY = cy - objH;

    // Object Line & Arrowhead
    ctx.strokeStyle = '#22C55E';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(objX, cy);
    ctx.lineTo(objX, objTopY);
    ctx.stroke();
    drawArrowHead(ctx, objX, cy, objX, objTopY, '#22C55E');

    ctx.fillStyle = '#22C55E';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`Object (h₀=${objectHeight}cm)`, Math.max(10, objX - 45), objTopY - 10);

    // Draw Image Arrow
    if (!isAtFocus && Math.abs(imageDistance) < 200) {
      const imgX = isLens
        ? cx + imageDistance * scale
        : mode === 'concave_mirror'
        ? imageDistance > 0
          ? cx - imageDistance * scale
          : cx + Math.abs(imageDistance) * scale
        : cx + Math.abs(imageDistance) * scale;

      const imgH = imageHeight * scale;
      const imgTopY = cy - imgH;
      const isVirtual = isLens ? imageDistance < 0 : imageDistance < 0 || mode === 'convex_mirror';

      ctx.strokeStyle = isVirtual ? '#A855F7' : '#EAB308';
      ctx.lineWidth = 3;
      if (isVirtual) {
        ctx.setLineDash([5, 4]);
      }
      ctx.beginPath();
      ctx.moveTo(imgX, cy);
      ctx.lineTo(imgX, imgTopY);
      ctx.stroke();
      ctx.setLineDash([]);
      drawArrowHead(ctx, imgX, cy, imgX, imgTopY, isVirtual ? '#A855F7' : '#EAB308');

      ctx.fillStyle = isVirtual ? '#C084FC' : '#FDE047';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(
        `Image (hᵢ=${Math.abs(imageHeight).toFixed(1)}cm)`,
        Math.min(width - 130, Math.max(10, imgX - 40)),
        imgTopY < cy ? imgTopY - 10 : imgTopY + 20
      );
    }

    // --- Draw the 3 Standard Optical Rays ---
    ctx.lineWidth = 1.5;

    // Ray 1: Parallel to principal axis from object top to lens/mirror
    ctx.strokeStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(objX, objTopY);
    ctx.lineTo(cx, objTopY);
    ctx.stroke();

    if (mode === 'convex_lens') {
      // Ray 1 continues through F2 on the right
      const slope = (cy - objTopY) / (f2X - cx);
      const farX = width;
      const farY = objTopY + slope * (farX - cx);

      ctx.beginPath();
      ctx.moveTo(cx, objTopY);
      ctx.lineTo(farX, farY);
      ctx.stroke();

      // If virtual image, trace dashed ray backward
      if (imageDistance < 0) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, objTopY);
        const backX = 0;
        const backY = objTopY - slope * cx;
        ctx.lineTo(backX, backY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ray 2: Passing straight through Optical Center O undeviated
      ctx.strokeStyle = '#F43F5E';
      const slope2 = (cy - objTopY) / (cx - objX);
      const r2FarX = width;
      const r2FarY = cy + slope2 * (r2FarX - cx);

      ctx.beginPath();
      ctx.moveTo(objX, objTopY);
      ctx.lineTo(r2FarX, r2FarY);
      ctx.stroke();

      if (imageDistance < 0) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const backX = 0;
        const backY = cy - slope2 * cx;
        ctx.lineTo(backX, backY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (mode === 'concave_lens') {
      // Ray 1 diverges as if coming from focal point F1 in front
      const slope = (objTopY - cy) / (cx - f1X);
      ctx.beginPath();
      ctx.moveTo(cx, objTopY);
      ctx.lineTo(width, objTopY + slope * (width - cx));
      ctx.stroke();

      // Virtual back-trace to F1
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, objTopY);
      ctx.lineTo(f1X, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ray 2: straight through O
      ctx.strokeStyle = '#F43F5E';
      ctx.beginPath();
      ctx.moveTo(objX, objTopY);
      ctx.lineTo(width, cy + ((cy - objTopY) / (cx - objX)) * (width - cx));
      ctx.stroke();
    } else if (mode === 'concave_mirror') {
      // Ray 1 reflects through focal point F1
      const slope = (cy - objTopY) / (cx - f1X);
      ctx.beginPath();
      ctx.moveTo(cx, objTopY);
      ctx.lineTo(0, objTopY - slope * cx);
      ctx.stroke();

      // If virtual image behind mirror, back trace
      if (imageDistance < 0) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, objTopY);
        ctx.lineTo(width, objTopY + slope * (width - cx));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ray 2: Hits pole P and reflects symmetrically
      ctx.strokeStyle = '#F43F5E';
      ctx.beginPath();
      ctx.moveTo(objX, objTopY);
      ctx.lineTo(cx, cy);
      ctx.lineTo(0, cy + (cy - objTopY) * (cx / (cx - objX)));
      ctx.stroke();

      if (imageDistance < 0) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(width, cy - (cy - objTopY) * ((width - cx) / (cx - objX)));
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [mode, focalLength, objectDistance, objectHeight, incidentAngle, n1, n2, imageDistance, imageHeight, isAtFocus]);

  const drawArrowHead = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string
  ) => {
    const headLen = 9;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] font-bold text-xs uppercase tracking-wider border border-[#38BDF8]/30">
                Physics Practical Lab
              </span>
              <span className="text-xs text-[#A1A1AA]">· WAEC · JAMB · IGCSE Optics</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] mt-1 flex items-center space-x-2">
              <Eye className="w-5 h-5 text-[#38BDF8]" />
              <span>Interactive Optical Ray Tracing & Refraction Simulator</span>
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setFocalLength(20);
                setObjectDistance(35);
                setObjectHeight(15);
                setIncidentAngle(45);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Values</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-none">
          {[
            { id: 'convex_lens', label: 'Convex Lens (Converging)' },
            { id: 'concave_lens', label: 'Concave Lens (Diverging)' },
            { id: 'concave_mirror', label: 'Concave Mirror' },
            { id: 'convex_mirror', label: 'Convex Mirror' },
            { id: 'refraction', label: "Snell's Law & Refraction / TIR" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as OpticsMode)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                mode === item.id
                  ? 'bg-[#38BDF8] text-black font-bold shadow-md shadow-sky-500/20'
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
        {/* Canvas Display Viewport */}
        <div className="lg:col-span-2 bg-[#000000] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse"></span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {mode === 'refraction' ? 'Refraction & TIR Wavefront Ray Tracer' : 'Principal Ray Tracing Canvas'}
              </span>
            </div>
            <div className="text-[11px] text-[#A1A1AA]">
              {mode === 'refraction' ? 'Light travels from Medium 1 to 2' : 'Focal Length f | Object Distance u'}
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-2xl border border-[#27272A]/70 bg-[#09090B]">
            <canvas ref={canvasRef} width={740} height={380} className="w-full h-auto block" />
          </div>

          {/* Color Key / Ray Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
            {mode === 'refraction' ? (
              <>
                <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-[#121214] border border-[#27272A]">
                  <span className="w-3 h-1 bg-[#FBBF24] rounded-full"></span>
                  <span className="text-[#A1A1AA]">Incident Ray (θ₁)</span>
                </div>
                <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-[#121214] border border-[#27272A]">
                  <span className="w-3 h-1 bg-[#22C55E] rounded-full"></span>
                  <span className="text-[#A1A1AA]">Refracted Ray (θ₂)</span>
                </div>
                <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-[#121214] border border-[#27272A]">
                  <span className="w-3 h-1 bg-[#EF4444] rounded-full"></span>
                  <span className="text-[#A1A1AA]">Reflected / TIR Ray</span>
                </div>
                <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-[#121214] border border-[#27272A]">
                  <span className="w-3 h-1 border-t border-dashed border-[#A1A1AA]"></span>
                  <span className="text-[#A1A1AA]">Normal Line (90°)</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-[#121214] border border-[#27272A]">
                  <span className="w-3 h-1 bg-[#22C55E] rounded-full"></span>
                  <span className="text-[#A1A1AA]">Object (h₀)</span>
                </div>
                <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-[#121214] border border-[#27272A]">
                  <span className="w-3 h-1 bg-[#38BDF8] rounded-full"></span>
                  <span className="text-[#A1A1AA]">Ray 1 (Parallel $\to$ F)</span>
                </div>
                <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-[#121214] border border-[#27272A]">
                  <span className="w-3 h-1 bg-[#F43F5E] rounded-full"></span>
                  <span className="text-[#A1A1AA]">Ray 2 (Through Center)</span>
                </div>
                <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-[#121214] border border-[#27272A]">
                  <span className="w-3 h-1 bg-[#EAB308] rounded-full"></span>
                  <span className="text-[#A1A1AA]">Image (hᵢ)</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Controls and Telemetry Panel */}
        <div className="space-y-5">
          {/* Real-Time Optical Readout */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
              <span>Optical Telemetry & Formula</span>
            </h3>

            {mode === 'refraction' ? (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] space-y-1">
                  <div className="text-[11px] text-[#A1A1AA]">Snell's Law:</div>
                  <div className="text-sm font-mono font-bold text-white">n₁ · sin(θ₁) = n₂ · sin(θ₂)</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA] block text-[10px]">Incident Angle (θ₁)</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{incidentAngle}°</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA] block text-[10px]">Refracted Angle (θ₂)</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {isTotalInternalReflection ? 'TIR (Reflected)' : `${refractedAngleDeg?.toFixed(1)}°`}
                    </span>
                  </div>
                </div>

                {criticalAngleDeg !== null && (
                  <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] text-xs flex justify-between items-center">
                    <span className="text-[#A1A1AA]">Critical Angle (θ_c):</span>
                    <span className="font-mono font-bold text-white">{criticalAngleDeg.toFixed(1)}°</span>
                  </div>
                )}

                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    isTotalInternalReflection
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {isTotalInternalReflection
                    ? `⚠️ Total Internal Reflection occurs! Since θ₁ (${incidentAngle}°) > θ_c (${criticalAngleDeg?.toFixed(1)}°), light cannot enter Medium 2 and is completely reflected.`
                    : `Light refracts into Medium 2 bending ${n2 > n1 ? 'TOWARDS the normal' : 'AWAY from the normal'}.`}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] space-y-1">
                  <div className="text-[11px] text-[#A1A1AA]">Lens & Mirror Formula:</div>
                  <div className="text-sm font-mono font-bold text-white">1/f = 1/v + 1/u</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA] block text-[10px]">Image Distance (v)</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{imagePositionText}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#121214] border border-[#27272A]">
                    <span className="text-[#A1A1AA] block text-[10px]">Magnification (m)</span>
                    <span className="font-mono font-bold text-sky-400 text-sm">
                      {isAtFocus ? '∞' : `${magnification.toFixed(2)}x`}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] text-xs space-y-1">
                  <span className="text-[#A1A1AA] block text-[10px] font-semibold uppercase">Image Nature:</span>
                  <span className="font-bold text-white block">{imageNature}</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Sliders */}
          <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-[#38BDF8]" />
              <span>Adjust Optical Parameters</span>
            </h3>

            {mode === 'refraction' ? (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                    <span>Angle of Incidence (θ₁):</span>
                    <span className="font-mono text-white font-bold">{incidentAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="89"
                    value={incidentAngle}
                    onChange={(e) => setIncidentAngle(Number(e.target.value))}
                    className="w-full accent-[#38BDF8] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                    <span>Medium 1 Refractive Index (n₁):</span>
                    <span className="font-mono text-white font-bold">{n1.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.05"
                    value={n1}
                    onChange={(e) => setN1(Number(e.target.value))}
                    className="w-full accent-[#38BDF8] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#71717A] mt-0.5">
                    <button onClick={() => setN1(1.0)} className="hover:underline">Air (1.0)</button>
                    <button onClick={() => setN1(1.33)} className="hover:underline">Water (1.33)</button>
                    <button onClick={() => setN1(1.5)} className="hover:underline">Glass (1.5)</button>
                    <button onClick={() => setN1(2.42)} className="hover:underline">Diamond (2.42)</button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                    <span>Medium 2 Refractive Index (n₂):</span>
                    <span className="font-mono text-white font-bold">{n2.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.05"
                    value={n2}
                    onChange={(e) => setN2(Number(e.target.value))}
                    className="w-full accent-[#38BDF8] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#71717A] mt-0.5">
                    <button onClick={() => setN2(1.0)} className="hover:underline">Air (1.0)</button>
                    <button onClick={() => setN2(1.33)} className="hover:underline">Water (1.33)</button>
                    <button onClick={() => setN2(1.5)} className="hover:underline">Glass (1.5)</button>
                    <button onClick={() => setN2(2.42)} className="hover:underline">Diamond (2.42)</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                    <span>Object Distance u (cm):</span>
                    <span className="font-mono text-white font-bold">{objectDistance} cm</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={objectDistance}
                    onChange={(e) => setObjectDistance(Number(e.target.value))}
                    className="w-full accent-[#38BDF8] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#71717A] mt-0.5">
                    <button onClick={() => setObjectDistance(focalLength / 2)} className="hover:underline">u &lt; f (Virtual)</button>
                    <button onClick={() => setObjectDistance(focalLength)} className="hover:underline">u = f (Infinity)</button>
                    <button onClick={() => setObjectDistance(focalLength * 1.5)} className="hover:underline">f &lt; u &lt; 2f</button>
                    <button onClick={() => setObjectDistance(focalLength * 2)} className="hover:underline">u = 2f (Same)</button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                    <span>Focal Length f (cm):</span>
                    <span className="font-mono text-white font-bold">{focalLength} cm</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="35"
                    value={focalLength}
                    onChange={(e) => setFocalLength(Number(e.target.value))}
                    className="w-full accent-[#38BDF8] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#A1A1AA] mb-1.5">
                    <span>Object Height h₀ (cm):</span>
                    <span className="font-mono text-white font-bold">{objectHeight} cm</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    value={objectHeight}
                    onChange={(e) => setObjectHeight(Number(e.target.value))}
                    className="w-full accent-[#38BDF8] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
