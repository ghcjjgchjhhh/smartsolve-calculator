import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AiGraphData, AiGraphCurve, AiGraphKeyPoint } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Activity,
  Layers,
  Compass,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Download,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export type SimulationObjectType =
  | 'plane'
  | 'stone'
  | 'car'
  | 'ball'
  | 'rocket'
  | 'train'
  | 'runner'
  | 'bicycle'
  | 'boat';

export const SIMULATION_OBJECTS: {
  id: SimulationObjectType;
  label: string;
  icon: string;
}[] = [
  { id: 'plane', label: 'Plane', icon: '✈️' },
  { id: 'stone', label: 'Stone', icon: '🪨' },
  { id: 'car', label: 'Car', icon: '🚗' },
  { id: 'ball', label: 'Ball', icon: '⚽' },
  { id: 'rocket', label: 'Rocket', icon: '🚀' },
  { id: 'train', label: 'Train', icon: '🚆' },
  { id: 'runner', label: 'Runner', icon: '🏃' },
  { id: 'bicycle', label: 'Bike', icon: '🚲' },
  { id: 'boat', label: 'Boat', icon: '⛵' },
];

export function detectSimObjectType(graph: AiGraphData, problemContext?: string): SimulationObjectType {
  const fullText = `${problemContext || ''} ${graph.title || ''} ${graph.graphType || ''} ${graph.xAxis.label || ''} ${graph.yAxis.label || ''}`.toLowerCase();
  const objLabel = (graph.simulation?.objectLabel || '').toLowerCase();

  // 1. Plane / Airplane / Aeroplane / Jet / Aircraft
  if (
    /plane|airplane|aeroplane|jet|aircraft|airliner|flight|runway|takeoff|take off|aviation|flying|pilot/i.test(fullText) ||
    /plane|airplane|aeroplane|jet|aircraft/i.test(objLabel)
  ) {
    return 'plane';
  }

  // 2. Stone / Rock / Pebble / Cliff / Boulder / Free Fall drop
  if (
    /stone|rock|pebble|cliff|boulder|dropped|free fall|freefall|height of|falls from|thrown vertically|tower|plummet/i.test(fullText) ||
    /stone|rock|pebble|boulder/i.test(objLabel)
  ) {
    return 'stone';
  }

  // 3. Rocket / Missile / Spacecraft / Shuttle
  if (
    /rocket|missile|spacecraft|shuttle|launch|thrust|booster|propulsion/i.test(fullText) ||
    /rocket|missile/i.test(objLabel)
  ) {
    return 'rocket';
  }

  // 4. Train / Locomotive / Railway
  if (
    /train|locomotive|rail|railway|railroad|carriage|subway|metro|station/i.test(fullText) ||
    /train|locomotive/i.test(objLabel)
  ) {
    return 'train';
  }

  // 5. Bicycle / Bike / Cyclist
  if (
    /bicycle|bike|cyclist|cycling|cycle|pedal/i.test(fullText) ||
    /bicycle|bike|cyclist/i.test(objLabel)
  ) {
    return 'bicycle';
  }

  // 6. Runner / Sprinter / Athlete / Running
  if (
    /runner|sprinter|athlete|running|sprint|jogger|jogging|marathon/i.test(fullText) ||
    /runner|sprinter|athlete/i.test(objLabel)
  ) {
    return 'runner';
  }

  // 7. Boat / Ship / Canoe / Vessel / Water
  if (
    /boat|ship|canoe|ferry|vessel|submarine|sailing|sail|kayak/i.test(fullText) ||
    /boat|ship|canoe|vessel/i.test(objLabel)
  ) {
    return 'boat';
  }

  // 8. Ball / Football / Basketball / Tennis / Projectile
  if (
    /ball|football|basketball|tennis|cricket|sphere|cannonball|bullet|projectile|kicked/i.test(fullText) ||
    /ball|sphere|projectile/i.test(objLabel)
  ) {
    return 'ball';
  }

  // 9. Car / Automobile / Truck / Bus / Vehicle
  if (
    /car|automobile|truck|bus|sedan|van|motorist|driver|vehicle/i.test(fullText) ||
    /car|vehicle|truck|bus/i.test(objLabel)
  ) {
    return 'car';
  }

  return 'car';
}

// -------------------------------------------------------------
// Dedicated Realistic 2D Vector Drawing Routines for Physics Lab
// -------------------------------------------------------------

function drawPlane(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  speed: number,
  time: number,
  isAirborne: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  const pitch = isAirborne ? -0.15 : Math.max(-0.12, -Math.abs(speed) * 0.003);
  ctx.rotate(pitch);

  // Jet Engine Pod & Exhaust flame underneath wing
  const flameLen = 6 + Math.min(Math.abs(speed) * 0.45, 26) + Math.sin(time * 35) * 3;
  if (flameLen > 4) {
    const flameGrad = ctx.createLinearGradient(-4, 6, -4 - flameLen, 6);
    flameGrad.addColorStop(0, '#38BDF8');
    flameGrad.addColorStop(0.3, '#F59E0B');
    flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-4, 4);
    ctx.lineTo(-4 - flameLen, 6);
    ctx.lineTo(-4, 8);
    ctx.closePath();
    ctx.fill();
  }

  // Engine nacelle
  ctx.fillStyle = '#64748B';
  ctx.beginPath();
  ctx.roundRect(-5, 4, 14, 5, 2);
  ctx.fill();

  // Swept delta wings
  ctx.fillStyle = '#CBD5E1';
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(6, -4);
  ctx.lineTo(-14, -18);
  ctx.lineTo(-8, -18);
  ctx.lineTo(14, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wingtip navigation strobe light (red/green)
  ctx.fillStyle = Math.sin(time * 12) > 0 ? '#22C55E' : '#EF4444';
  ctx.beginPath();
  ctx.arc(-14, -18, 2, 0, Math.PI * 2);
  ctx.fill();

  // Streamlined fuselage
  const bodyGrad = ctx.createLinearGradient(-26, -12, 28, 4);
  bodyGrad.addColorStop(0, '#E2E8F0');
  bodyGrad.addColorStop(0.5, '#FFFFFF');
  bodyGrad.addColorStop(1, '#CBD5E1');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(2, -4, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Airline cheatline & cockpit windows
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -4);
  ctx.lineTo(16, -4);
  ctx.stroke();

  // Cockpit windshield
  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.moveTo(14, -7);
  ctx.lineTo(23, -4);
  ctx.lineTo(16, -2);
  ctx.closePath();
  ctx.fill();

  // Vertical tail fin
  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.moveTo(-18, -4);
  ctx.lineTo(-26, -20);
  ctx.lineTo(-20, -20);
  ctx.lineTo(-12, -4);
  ctx.closePath();
  ctx.fill();

  // Landing gear wheels (when touching track)
  if (!isAirborne) {
    ctx.fillStyle = '#18181B';
    ctx.strokeStyle = '#71717A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-4, 6, 3, 0, Math.PI * 2);
    ctx.arc(14, 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawStone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  speed: number,
  time: number,
  isAirborne: boolean
) {
  ctx.save();
  ctx.translate(x, y);
  const rot = isAirborne ? time * 4.5 : x * 0.08;
  ctx.rotate(rot);

  // Faceted 3D rock polygon
  const pts: [number, number][] = [
    [-15, -3],
    [-11, -13],
    [-3, -16],
    [9, -14],
    [15, -6],
    [16, 5],
    [10, 13],
    [-2, 15],
    [-12, 10],
  ];

  // Shaded granite gradient
  const stoneGrad = ctx.createLinearGradient(-15, -16, 16, 15);
  stoneGrad.addColorStop(0, '#9CA3AF');
  stoneGrad.addColorStop(0.4, '#6B7280');
  stoneGrad.addColorStop(1, '#374151');

  ctx.fillStyle = stoneGrad;
  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  pts.forEach(([px, py], i) => {
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Internal facet cracks & specular mineral highlights
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-11, -13);
  ctx.lineTo(0, 0);
  ctx.lineTo(9, -14);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(10, 13);
  ctx.moveTo(0, 0);
  ctx.lineTo(-12, 10);
  ctx.stroke();

  // Mineral flecks
  ctx.fillStyle = '#E5E7EB';
  ctx.fillRect(-4, -6, 2, 2);
  ctx.fillRect(5, 2, 2, 2);

  ctx.restore();

  // Trailing ground dust puffs when rolling fast
  if (!isAirborne && Math.abs(speed) > 2) {
    ctx.save();
    ctx.fillStyle = 'rgba(156, 163, 175, 0.25)';
    ctx.beginPath();
    ctx.arc(x - 18, y + 6, 4, 0, Math.PI * 2);
    ctx.arc(x - 26, y + 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  speed: number,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 26, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Headlight beam cone
  const headGrad = ctx.createLinearGradient(22, -6, 65, -6);
  headGrad.addColorStop(0, 'rgba(253, 224, 71, 0.35)');
  headGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.moveTo(22, -8);
  ctx.lineTo(65, -16);
  ctx.lineTo(65, 4);
  ctx.lineTo(22, -4);
  ctx.closePath();
  ctx.fill();

  // Aerodynamic body chassis
  const carGrad = ctx.createLinearGradient(-24, -14, 24, 0);
  carGrad.addColorStop(0, '#10B981');
  carGrad.addColorStop(1, '#059669');
  ctx.fillStyle = carGrad;
  ctx.beginPath();
  ctx.roundRect(-24, -14, 48, 14, [4, 9, 2, 2]);
  ctx.fill();

  // Tinted windshield & cabin
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.roundRect(-10, -23, 22, 10, [5, 7, 0, 0]);
  ctx.fill();

  // Glass specular reflection
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-5, -21);
  ctx.lineTo(8, -15);
  ctx.stroke();

  // Headlight & taillight
  ctx.fillStyle = '#FDE047';
  ctx.fillRect(21, -10, 4, 5);
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(-24, -10, 3, 5);

  // Alloy spinning wheels
  const wAngle = x * 0.15;
  [-14, 14].forEach((wx) => {
    ctx.save();
    ctx.translate(wx, 0);
    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#71717A';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D4D4D8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(wAngle) * 4, Math.sin(wAngle) * 4);
    ctx.lineTo(-Math.cos(wAngle) * 4, -Math.sin(wAngle) * 4);
    ctx.moveTo(Math.cos(wAngle + Math.PI / 2) * 4, Math.sin(wAngle + Math.PI / 2) * 4);
    ctx.lineTo(-Math.cos(wAngle + Math.PI / 2) * 4, -Math.sin(wAngle + Math.PI / 2) * 4);
    ctx.stroke();
    ctx.restore();
  });

  ctx.restore();
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  speed: number,
  time: number,
  isAirborne: boolean
) {
  ctx.save();
  ctx.translate(x, y - 4);
  const rot = x * 0.12;

  // Ground shadow
  if (!isAirborne) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3D Sphere gradient
  const r = 10;
  const ballGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, r);
  ballGrad.addColorStop(0, '#93C5FD');
  ballGrad.addColorStop(0.3, '#3B82F6');
  ballGrad.addColorStop(1, '#1E3A8A');

  ctx.fillStyle = ballGrad;
  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Rotating sports seam arcs
  ctx.save();
  ctx.rotate(rot);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 4, 9, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function drawRocket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  speed: number,
  time: number,
  isAirborne: boolean
) {
  ctx.save();
  ctx.translate(x, y - 2);
  const tilt = isAirborne ? -0.28 : -0.06;
  ctx.rotate(tilt);

  // Thrust exhaust flame
  const flameLen = 10 + Math.min(Math.abs(speed) * 0.5, 34) + Math.sin(time * 30) * 4;
  const flameGrad = ctx.createLinearGradient(-18, 0, -18 - flameLen, 0);
  flameGrad.addColorStop(0, '#FFFFFF');
  flameGrad.addColorStop(0.2, '#FDE047');
  flameGrad.addColorStop(0.6, '#F97316');
  flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(-18, -4);
  ctx.lineTo(-18 - flameLen, 0);
  ctx.lineTo(-18, 4);
  ctx.closePath();
  ctx.fill();

  // Stabilizer fins
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.moveTo(-16, -4);
  ctx.lineTo(-24, -13);
  ctx.lineTo(-18, -4);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-16, 4);
  ctx.lineTo(-24, 13);
  ctx.lineTo(-18, 4);
  ctx.closePath();
  ctx.fill();

  // Rocket body cylinder
  const rocketGrad = ctx.createLinearGradient(-18, -6, 12, 6);
  rocketGrad.addColorStop(0, '#E4E4E7');
  rocketGrad.addColorStop(0.5, '#FAFAFA');
  rocketGrad.addColorStop(1, '#A1A1AA');
  ctx.fillStyle = rocketGrad;
  ctx.beginPath();
  ctx.roundRect(-18, -6, 30, 12, 2);
  ctx.fill();

  // Aerodynamic nosecone
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.moveTo(12, -6);
  ctx.lineTo(24, 0);
  ctx.lineTo(12, 6);
  ctx.closePath();
  ctx.fill();

  // Porthole window
  ctx.fillStyle = '#0284C7';
  ctx.beginPath();
  ctx.arc(2, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTrain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  speed: number,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Train aerodynamic body
  const trainGrad = ctx.createLinearGradient(-32, -18, 30, 0);
  trainGrad.addColorStop(0, '#F4F4F5');
  trainGrad.addColorStop(0.7, '#E4E4E7');
  trainGrad.addColorStop(1, '#CBD5E1');
  ctx.fillStyle = trainGrad;
  ctx.beginPath();
  ctx.moveTo(-32, 0);
  ctx.lineTo(-32, -18);
  ctx.lineTo(12, -18);
  ctx.bezierCurveTo(24, -18, 32, -8, 32, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#71717A';
  ctx.lineWidth = 1;
  ctx.stroke();

  // High-speed speedline stripe
  ctx.fillStyle = '#06B6D4';
  ctx.fillRect(-32, -8, 56, 3);

  // Cabin panoramic windows
  ctx.fillStyle = '#0284C7';
  for (let w = -26; w <= 6; w += 10) {
    ctx.fillRect(w, -15, 7, 5);
  }

  // Slanted cockpit window
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.moveTo(14, -15);
  ctx.lineTo(22, -10);
  ctx.lineTo(14, -10);
  ctx.closePath();
  ctx.fill();

  // Headlights
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(29, -3, 2, 0, Math.PI * 2);
  ctx.fill();

  // Steel wheels
  ctx.fillStyle = '#27272A';
  [-22, -10, 8, 20].forEach((wx) => {
    ctx.beginPath();
    ctx.arc(wx, 2, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawRunner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  speed: number,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);
  const phase = x * 0.14;

  // Athletic lean
  ctx.rotate(0.12);

  // Head & sweatband
  ctx.fillStyle = '#FDBA74';
  ctx.beginPath();
  ctx.arc(2, -26, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(-1, -28, 6, 2);

  // Torso & sports tank top
  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.roundRect(-3, -21, 8, 12, 2);
  ctx.fill();

  // Kinetic legs cycling
  const hipX = 1;
  const hipY = -9;
  const legSwing = Math.sin(phase) * 11;
  const kneeSwing = Math.cos(phase) * 8;

  // Leg 1 (Front)
  ctx.strokeStyle = '#FDBA74';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(hipX + legSwing, hipY + 8);
  ctx.lineTo(hipX + legSwing + kneeSwing, hipY + 16);
  ctx.stroke();

  // Shoe 1
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(hipX + legSwing + kneeSwing - 2, hipY + 14, 6, 3);

  // Leg 2 (Back)
  ctx.strokeStyle = '#D97706';
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(hipX - legSwing, hipY + 8);
  ctx.lineTo(hipX - legSwing - kneeSwing, hipY + 16);
  ctx.stroke();

  // Shoe 2
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(hipX - legSwing - kneeSwing - 2, hipY + 14, 6, 3);

  // Pumping arms
  ctx.strokeStyle = '#FDBA74';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(2, -18);
  ctx.lineTo(2 - legSwing * 0.7, -13);
  ctx.lineTo(2 - legSwing, -16);
  ctx.stroke();

  ctx.restore();
}

function drawBicycle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  speed: number,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  const wAngle = x * 0.16;

  // Wheels
  [-16, 16].forEach((wx) => {
    ctx.save();
    ctx.translate(wx, 0);
    ctx.strokeStyle = '#52525B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
    // Spokes
    ctx.strokeStyle = '#A1A1AA';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(wAngle) * 6, Math.sin(wAngle) * 6);
    ctx.lineTo(-Math.cos(wAngle) * 6, -Math.sin(wAngle) * 6);
    ctx.moveTo(Math.cos(wAngle + 1.57) * 6, Math.sin(wAngle + 1.57) * 6);
    ctx.lineTo(-Math.cos(wAngle + 1.57) * 6, -Math.sin(wAngle + 1.57) * 6);
    ctx.stroke();
    ctx.restore();
  });

  // Diamond bike frame
  ctx.strokeStyle = '#06B6D4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(-5, -12);
  ctx.lineTo(8, -12);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(8, -12);
  ctx.lineTo(16, 0);
  ctx.moveTo(8, -12);
  ctx.lineTo(9, -16);
  ctx.lineTo(12, -16);
  ctx.moveTo(-5, -12);
  ctx.lineTo(-7, -15);
  ctx.lineTo(-2, -15);
  ctx.stroke();

  // Cyclist silhouette
  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.arc(5, -22, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-5, -13);
  ctx.lineTo(2, -19);
  ctx.lineTo(10, -15);
  ctx.stroke();

  ctx.restore();
}

function drawBoat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  speed: number,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Water ripples & trailing wake foam
  const wakeLen = 12 + Math.min(Math.abs(speed) * 0.4, 25);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-20, 2);
  ctx.lineTo(-20 - wakeLen, 6);
  ctx.stroke();

  // Hull
  const hullGrad = ctx.createLinearGradient(-22, -8, 22, 4);
  hullGrad.addColorStop(0, '#1E3A8A');
  hullGrad.addColorStop(0.5, '#3B82F6');
  hullGrad.addColorStop(1, '#FFFFFF');
  ctx.fillStyle = hullGrad;
  ctx.beginPath();
  ctx.moveTo(-22, -6);
  ctx.lineTo(14, -6);
  ctx.bezierCurveTo(20, -6, 24, -2, 24, 0);
  ctx.lineTo(18, 4);
  ctx.lineTo(-18, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Cabin
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(-10, -14, 16, 8, [3, 3, 0, 0]);
  ctx.fill();

  // Window
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(-6, -12, 10, 4);

  ctx.restore();
}

function drawTrack(
  ctx: CanvasRenderingContext2D,
  type: SimulationObjectType,
  trackStart: number,
  trackEnd: number,
  trackY: number,
  xMin: number,
  xMax: number
) {
  const trackLen = trackEnd - trackStart;

  if (type === 'plane') {
    // Airport Runway
    ctx.fillStyle = '#18181B';
    ctx.fillRect(trackStart - 10, trackY - 15, trackLen + 20, 30);
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;
    ctx.strokeRect(trackStart - 10, trackY - 15, trackLen + 20, 30);

    // Runway threshold stripes (piano keys)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let k = 0; k < 6; k++) {
      ctx.fillRect(trackStart + k * 4, trackY - 11, 2, 22);
    }

    // Yellow runway dashed centerline
    ctx.save();
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(trackStart + 30, trackY);
    ctx.lineTo(trackEnd - 10, trackY);
    ctx.stroke();
    ctx.restore();

    // Runway blue edge taxiway lights
    for (let i = 0; i <= 6; i++) {
      const lx = trackStart + (i / 6) * trackLen;
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(lx, trackY - 15, 1.5, 0, Math.PI * 2);
      ctx.arc(lx, trackY + 15, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'train') {
    // Railway tracks with ballast and sleepers
    ctx.fillStyle = '#27272A';
    ctx.fillRect(trackStart - 10, trackY - 14, trackLen + 20, 28);

    // Sleepers (railroad ties)
    ctx.fillStyle = '#3F3F46';
    for (let x = trackStart - 5; x <= trackEnd + 5; x += 14) {
      ctx.fillRect(x, trackY - 12, 5, 24);
    }

    // Twin steel rails
    ctx.strokeStyle = '#E4E4E7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(trackStart - 10, trackY - 5);
    ctx.lineTo(trackEnd + 10, trackY - 5);
    ctx.moveTo(trackStart - 10, trackY + 5);
    ctx.lineTo(trackEnd + 10, trackY + 5);
    ctx.stroke();
  } else if (type === 'runner') {
    // Olympic Tartan Running Track
    ctx.fillStyle = '#7F1D1D';
    ctx.fillRect(trackStart - 10, trackY - 14, trackLen + 20, 28);

    // White lane dividers
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(trackStart - 10, trackY - 12);
    ctx.lineTo(trackEnd + 10, trackY - 12);
    ctx.moveTo(trackStart - 10, trackY + 12);
    ctx.lineTo(trackEnd + 10, trackY + 12);
    ctx.stroke();

    // Starting line marker
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(trackStart + 10, trackY - 12, 4, 24);
  } else if (type === 'boat') {
    // Water Canal
    ctx.fillStyle = '#075985';
    ctx.fillRect(trackStart - 10, trackY - 14, trackLen + 20, 28);
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1;
    ctx.strokeRect(trackStart - 10, trackY - 14, trackLen + 20, 28);

    // Gentle ripples
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1;
    for (let r = 0; r < 5; r++) {
      ctx.beginPath();
      ctx.moveTo(trackStart + r * 60, trackY - 4);
      ctx.lineTo(trackStart + r * 60 + 35, trackY - 4);
      ctx.stroke();
    }
  } else if (type === 'stone') {
    // Mountain rugged trail / cliff ledge
    ctx.fillStyle = '#262626';
    ctx.fillRect(trackStart - 10, trackY - 14, trackLen + 20, 28);
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 1;
    ctx.strokeRect(trackStart - 10, trackY - 14, trackLen + 20, 28);

    // Textured gravel flecks
    ctx.fillStyle = '#52525B';
    for (let g = trackStart; g < trackEnd; g += 18) {
      ctx.fillRect(g, trackY + 2, 3, 2);
      ctx.fillRect(g + 8, trackY - 8, 2, 2);
    }
  } else {
    // Modern High-Tech Proving Track (Car, Ball, Rocket, Bicycle)
    ctx.fillStyle = '#18181B';
    ctx.fillRect(trackStart - 10, trackY - 14, trackLen + 20, 28);
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;
    ctx.strokeRect(trackStart - 10, trackY - 14, trackLen + 20, 28);

    // Neon edge guide
    ctx.strokeStyle = '#22C55E44';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(trackStart - 10, trackY - 13);
    ctx.lineTo(trackEnd + 10, trackY - 13);
    ctx.stroke();
  }

  // Calibrated distance hash marks below track
  ctx.strokeStyle = '#3F3F46';
  ctx.fillStyle = '#71717A';
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  const markCount = 8;
  for (let i = 0; i <= markCount; i++) {
    const mx = trackStart + (i / markCount) * trackLen;
    ctx.beginPath();
    ctx.moveTo(mx, trackY + 14);
    ctx.lineTo(mx, trackY + 22);
    ctx.stroke();

    const distVal = (xMin + (i / markCount) * (xMax - xMin)).toFixed(0);
    ctx.fillText(`${distVal}m`, mx, trackY + 34);
  }
}

function drawSimulationObject(
  ctx: CanvasRenderingContext2D,
  type: SimulationObjectType,
  x: number,
  y: number,
  speed: number,
  time: number,
  isAirborne: boolean = false
) {
  switch (type) {
    case 'plane':
      drawPlane(ctx, x, y, speed, time, isAirborne);
      break;
    case 'stone':
      drawStone(ctx, x, y, speed, time, isAirborne);
      break;
    case 'rocket':
      drawRocket(ctx, x, y, speed, time, isAirborne);
      break;
    case 'train':
      drawTrain(ctx, x, y, speed, time);
      break;
    case 'runner':
      drawRunner(ctx, x, y, speed, time);
      break;
    case 'bicycle':
      drawBicycle(ctx, x, y, speed, time);
      break;
    case 'boat':
      drawBoat(ctx, x, y, speed, time);
      break;
    case 'ball':
      drawBall(ctx, x, y, speed, time, isAirborne);
      break;
    case 'car':
    default:
      drawCar(ctx, x, y, speed, time);
      break;
  }
}

interface Props {
  graphs: AiGraphData[];
  graphExplanation?: string;
  missingInformation?: string;
  problemContext?: string;
}

export const InteractiveSolverGraph: React.FC<Props> = ({
  graphs,
  graphExplanation,
  missingInformation,
  problemContext,
}) => {
  if (!graphs || graphs.length === 0) {
    if (missingInformation) {
      return (
        <div className="bg-[#121214] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
          <div className="flex items-center space-x-2.5 text-amber-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h4 className="text-sm font-bold text-white">Graph Information Required</h4>
          </div>
          <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed">
            {missingInformation}
          </p>
        </div>
      );
    }
    return null;
  }

  const [activeGraphIndex, setActiveGraphIndex] = useState(0);
  const graph = graphs[activeGraphIndex] || graphs[0];

  // Animation & simulation playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSimStage, setShowSimStage] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; curveY?: number } | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<SimulationObjectType | null>(null);

  const detectedType = useMemo(
    () => detectSimObjectType(graph, problemContext),
    [graph, problemContext]
  );
  const activeObjectType = selectedObjectType || detectedType;

  // Reset manual selection when the problem or active graph changes
  useEffect(() => {
    setSelectedObjectType(null);
  }, [graph.id, graph.title, problemContext]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimestamp = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Graph domains
  const xMin = graph.xAxis.min;
  const xMax = graph.xAxis.max;
  const yMin = graph.yAxis.min;
  const yMax = graph.yAxis.max;

  const simDuration = graph.simulation?.duration || Math.max(xMax - xMin, 5);

  // Safe evaluation of mathematical curve expressions
  const evaluateCurve = useCallback(
    (curve: AiGraphCurve, xVal: number): number => {
      // 1. Piecewise segments
      if (curve.type === 'piecewise' && curve.segments && curve.segments.length > 0) {
        // Clamp below lowest t0
        if (xVal <= curve.segments[0].t0) {
          const seg0 = curve.segments[0];
          try {
            const expr = seg0.fn
              .replace(/\bsin\b/g, 'Math.sin')
              .replace(/\bcos\b/g, 'Math.cos')
              .replace(/\btan\b/g, 'Math.tan')
              .replace(/\bsqrt\b/g, 'Math.sqrt')
              .replace(/\babs\b/g, 'Math.abs')
              .replace(/\^/g, '**');
            const fn = new Function('t', 'x', `return (${expr});`);
            return fn(seg0.t0, seg0.t0);
          } catch {
            return 0;
          }
        }

        // Clamp above highest t1
        const lastSeg = curve.segments[curve.segments.length - 1];
        if (xVal >= lastSeg.t1) {
          try {
            const expr = lastSeg.fn
              .replace(/\bsin\b/g, 'Math.sin')
              .replace(/\bcos\b/g, 'Math.cos')
              .replace(/\btan\b/g, 'Math.tan')
              .replace(/\bsqrt\b/g, 'Math.sqrt')
              .replace(/\babs\b/g, 'Math.abs')
              .replace(/\^/g, '**');
            const fn = new Function('t', 'x', `return (${expr});`);
            return fn(lastSeg.t1, lastSeg.t1);
          } catch {
            return 0;
          }
        }

        for (const seg of curve.segments) {
          if (xVal >= seg.t0 - 1e-5 && xVal <= seg.t1 + 1e-5) {
            try {
              const expr = seg.fn
                .replace(/\bsin\b/g, 'Math.sin')
                .replace(/\bcos\b/g, 'Math.cos')
                .replace(/\btan\b/g, 'Math.tan')
                .replace(/\bsqrt\b/g, 'Math.sqrt')
                .replace(/\babs\b/g, 'Math.abs')
                .replace(/\bpi\b/gi, 'Math.PI')
                .replace(/\^/g, '**');
              const fn = new Function('t', 'x', `return (${expr});`);
              const val = fn(xVal, xVal);
              if (Number.isFinite(val)) return val;
            } catch {
              // fallback
            }
          }
        }
      }

      // 2. Direct function expression
      if (curve.fnExpression) {
        try {
          const expr = curve.fnExpression
            .replace(/\bsin\b/g, 'Math.sin')
            .replace(/\bcos\b/g, 'Math.cos')
            .replace(/\btan\b/g, 'Math.tan')
            .replace(/\bsqrt\b/g, 'Math.sqrt')
            .replace(/\babs\b/g, 'Math.abs')
            .replace(/\bln\b/g, 'Math.log')
            .replace(/\bexp\b/g, 'Math.exp')
            .replace(/\bpi\b/gi, 'Math.PI')
            .replace(/\^/g, '**');
          const fn = new Function('t', 'x', `return (${expr});`);
          const val = fn(xVal, xVal);
          if (Number.isFinite(val)) return val;
        } catch {
          // fallback
        }
      }

      // 3. Discrete points interpolation
      if (curve.points && curve.points.length > 0) {
        const sorted = [...curve.points].sort((a, b) => a.x - b.x);
        if (xVal <= sorted[0].x) return sorted[0].y;
        if (xVal >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y;
        for (let i = 0; i < sorted.length - 1; i++) {
          const p1 = sorted[i];
          const p2 = sorted[i + 1];
          if (xVal >= p1.x && xVal <= p2.x) {
            const frac = (xVal - p1.x) / (p2.x - p1.x || 1);
            return p1.y + frac * (p2.y - p1.y);
          }
        }
      }

      return 0;
    },
    []
  );

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      lastTimestamp.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (lastTimestamp.current === null) {
        lastTimestamp.current = timestamp;
      }
      const delta = (timestamp - lastTimestamp.current) / 1000;
      lastTimestamp.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + delta * playbackSpeed;
        if (next >= simDuration) {
          setIsPlaying(false);
          return simDuration;
        }
        return next;
      });

      animationFrameId.current = requestAnimationFrame(step);
    };

    animationFrameId.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, playbackSpeed, simDuration]);

  // Main Graph Canvas drawing routine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI Retina scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    // Dark sleek background
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // Layout margins
    const padLeft = 60;
    const padRight = 30;
    const padTop = 35;
    const padBottom = 45;

    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    // View boundaries with zoomLevel
    const currentXSpan = (xMax - xMin) / zoomLevel;
    const currentYSpan = (yMax - yMin) / zoomLevel;
    const curXMin = xMin;
    const curXMax = curXMin + currentXSpan;
    const curYMin = yMin;
    const curYMax = curYMin + currentYSpan;

    // Transform coordinate helpers
    const toCanvasX = (x: number) => padLeft + ((x - curXMin) / (curXMax - curXMin || 1)) * plotWidth;
    const toCanvasY = (y: number) => padTop + plotHeight - ((y - curYMin) / (curYMax - curYMin || 1)) * plotHeight;

    // 1. Draw Grid Lines
    ctx.strokeStyle = '#27272A';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    const xStep = graph.xAxis.step || Math.max((curXMax - curXMin) / 8, 1);
    const yStep = graph.yAxis.step || Math.max((curYMax - curYMin) / 6, 1);

    // Vertical grid & X-axis tick labels
    ctx.fillStyle = '#A1A1AA';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let x = Math.ceil(curXMin / xStep) * xStep; x <= curXMax; x += xStep) {
      const cx = toCanvasX(x);
      if (cx >= padLeft && cx <= width - padRight) {
        ctx.beginPath();
        ctx.moveTo(cx, padTop);
        ctx.lineTo(cx, padTop + plotHeight);
        ctx.stroke();

        const xLabel = Math.abs(x) < 0.0001 ? '0' : Number(x.toFixed(2)).toString();
        ctx.fillText(xLabel, cx, padTop + plotHeight + 8);
      }
    }

    // Horizontal grid & Y-axis tick labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.ceil(curYMin / yStep) * yStep; y <= curYMax; y += yStep) {
      const cy = toCanvasY(y);
      if (cy >= padTop && cy <= padTop + plotHeight) {
        ctx.beginPath();
        ctx.moveTo(padLeft, cy);
        ctx.lineTo(padLeft + plotWidth, cy);
        ctx.stroke();

        const yLabel = Math.abs(y) < 0.0001 ? '0' : Number(y.toFixed(2)).toString();
        ctx.fillText(yLabel, padLeft - 10, cy);
      }
    }
    ctx.setLineDash([]);

    // 2. Draw Zero Axes (if visible in viewport)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#52525B';

    if (curYMin <= 0 && curYMax >= 0) {
      const cy0 = toCanvasY(0);
      ctx.beginPath();
      ctx.moveTo(padLeft, cy0);
      ctx.lineTo(padLeft + plotWidth, cy0);
      ctx.stroke();
    }
    if (curXMin <= 0 && curXMax >= 0) {
      const cx0 = toCanvasX(0);
      ctx.beginPath();
      ctx.moveTo(cx0, padTop);
      ctx.lineTo(cx0, padTop + plotHeight);
      ctx.stroke();
    }

    // 3. Draw Axis Labels
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    // X label
    const xUnit = graph.xAxis.unit ? ` (${graph.xAxis.unit})` : '';
    ctx.fillText(`${graph.xAxis.label}${xUnit}`, padLeft + plotWidth / 2, height - 6);

    // Y label (rotated)
    ctx.save();
    ctx.translate(18, padTop + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    const yUnit = graph.yAxis.unit ? ` (${graph.yAxis.unit})` : '';
    ctx.fillText(`${graph.yAxis.label}${yUnit}`, 0, 0);
    ctx.restore();

    // 4. Shaded Areas (e.g. area under v-t graph = displacement)
    graph.curves.forEach((curve) => {
      if (curve.shadedArea) {
        const { fromX, toX, color, label } = curve.shadedArea;
        const areaColor = color || '#22C55E';
        ctx.save();
        ctx.beginPath();
        const startX = Math.max(fromX, curXMin);
        const endX = Math.min(toX, curXMax);
        const steps = 150;
        const dx = (endX - startX) / steps;

        // Trace upper curve
        for (let i = 0; i <= steps; i++) {
          const x = startX + i * dx;
          const y = evaluateCurve(curve, x);
          const cx = toCanvasX(x);
          const cy = toCanvasY(y);
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        // Trace back along y=0 axis
        ctx.lineTo(toCanvasX(endX), toCanvasY(0));
        ctx.lineTo(toCanvasX(startX), toCanvasY(0));
        ctx.closePath();

        ctx.fillStyle = areaColor.startsWith('#')
          ? `${areaColor}33`
          : 'rgba(34, 197, 94, 0.22)';
        ctx.fill();

        // Shaded boundary border
        ctx.strokeStyle = areaColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label inside shaded area
        if (label) {
          const midX = (startX + endX) / 2;
          const midY = evaluateCurve(curve, midX) / 2;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, toCanvasX(midX), toCanvasY(midY));
        }
        ctx.restore();
      }
    });

    // 5. Plot Curves
    graph.curves.forEach((curve) => {
      const strokeColor = curve.color || '#22C55E';
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      if (curve.dashed) {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }

      const sampleCount = 350;
      const stepX = (curXMax - curXMin) / sampleCount;
      let started = false;

      for (let i = 0; i <= sampleCount; i++) {
        const x = curXMin + i * stepX;
        const y = evaluateCurve(curve, x);
        const cx = toCanvasX(x);
        const cy = toCanvasY(y);

        // Clip inside plot area
        if (cy >= padTop - 20 && cy <= padTop + plotHeight + 20) {
          if (!started) {
            ctx.moveTo(cx, cy);
            started = true;
          } else {
            ctx.lineTo(cx, cy);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
      ctx.restore();
    });

    // 6. Draw Key Critical Points (Roots, Max, Min, Intercepts)
    if (graph.keyPoints && graph.keyPoints.length > 0) {
      graph.keyPoints.forEach((kp) => {
        const kx = toCanvasX(kp.x);
        const ky = toCanvasY(kp.y);

        if (kx >= padLeft && kx <= width - padRight && ky >= padTop && ky <= height - padBottom) {
          ctx.save();
          // Halo glow
          ctx.beginPath();
          ctx.arc(kx, ky, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#38BDF833';
          ctx.fill();

          // Core point
          ctx.beginPath();
          ctx.arc(kx, ky, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#38BDF8';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Pill tag
          ctx.font = '10px JetBrains Mono, monospace';
          const label = `${kp.label} (${Number(kp.x.toFixed(2))}, ${Number(kp.y.toFixed(2))})`;
          const tagW = ctx.measureText(label).width + 12;
          const tagH = 18;
          const tagX = Math.min(Math.max(kx - tagW / 2, padLeft + 4), width - padRight - tagW - 4);
          const tagY = ky > padTop + 30 ? ky - 26 : ky + 10;

          ctx.fillStyle = '#18181BE6';
          ctx.strokeStyle = '#38BDF866';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(tagX, tagY, tagW, tagH, 5);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#E0F2FE';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, tagX + tagW / 2, tagY + tagH / 2);
          ctx.restore();
        }
      });
    }

    // 7. Draw Live Animated Tracer Dot & Value Crosshair
    const primaryCurve = graph.curves[0];
    if (primaryCurve) {
      const activeX = currentTime;
      const activeY = evaluateCurve(primaryCurve, activeX);
      const tracerX = toCanvasX(activeX);
      const tracerY = toCanvasY(activeY);

      if (tracerX >= padLeft && tracerX <= width - padRight && tracerY >= padTop && tracerY <= height - padBottom) {
        ctx.save();
        // Drop lines to axes
        ctx.strokeStyle = '#22C55E66';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(tracerX, tracerY);
        ctx.lineTo(tracerX, toCanvasY(0));
        ctx.moveTo(tracerX, tracerY);
        ctx.lineTo(padLeft, tracerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pulsing radar ripple
        const pulse = (Date.now() % 1200) / 1200;
        ctx.beginPath();
        ctx.arc(tracerX, tracerY, 6 + pulse * 12, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 197, 94, ${1 - pulse})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Solid marker
        ctx.beginPath();
        ctx.arc(tracerX, tracerY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#22C55E';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Live Tracer HUD callout
        const text = `t=${activeX.toFixed(2)}s | y=${activeY.toFixed(2)}${graph.yAxis.unit || ''}`;
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        const w = ctx.measureText(text).width + 16;
        const h = 22;
        const boxX = Math.min(Math.max(tracerX - w / 2, padLeft + 6), width - padRight - w - 6);
        const boxY = tracerY > padTop + 35 ? tracerY - 32 : tracerY + 12;

        ctx.fillStyle = '#0F172AEE';
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, w, h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, boxX + w / 2, boxY + h / 2);
        ctx.restore();
      }
    }

    // 8. Hover cursor crosshair
    if (hoverCoord) {
      const hx = toCanvasX(hoverCoord.x);
      const hy = toCanvasY(hoverCoord.y);
      if (hx >= padLeft && hx <= width - padRight && hy >= padTop && hy <= height - padBottom) {
        ctx.save();
        ctx.strokeStyle = '#E4E4E766';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hx, padTop);
        ctx.lineTo(hx, padTop + plotHeight);
        ctx.moveTo(padLeft, hy);
        ctx.lineTo(padLeft + plotWidth, hy);
        ctx.stroke();
        ctx.restore();
      }
    }
  }, [graph, currentTime, zoomLevel, hoverCoord, xMin, xMax, yMin, yMax, evaluateCurve]);

  // Secondary Animated Physical Simulation Canvas (The "Virtual Lab")
  useEffect(() => {
    const simCanvas = simCanvasRef.current;
    if (!simCanvas || !showSimStage) return;
    const ctx = simCanvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = simCanvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    simCanvas.width = width * dpr;
    simCanvas.height = height * dpr;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, width, height);

    const simType = graph.simulation?.type || 'motion_1d';
    const primaryCurve = graph.curves[0];
    const currentVal = primaryCurve ? evaluateCurve(primaryCurve, currentTime) : 0;

    // A. 1D MOTION SIMULATION (Car / Particle on track)
    if (simType === 'motion_1d' || graph.graphType.includes('time') || graph.graphType === 'velocity_time') {
      const trackY = height * 0.65;
      const trackStart = 45;
      const trackEnd = width - 45;
      const trackLen = trackEnd - trackStart;

      // Draw track styled dynamically to match the object entity (e.g. runway for plane, rails for train, tartan track for runner)
      drawTrack(ctx, activeObjectType, trackStart, trackEnd, trackY, xMin, xMax);

      // Compute vehicle / object position
      // For velocity-time, displacement s = area under curve up to currentTime
      let objectFraction = 0;
      if (graph.graphType === 'velocity_time') {
        // Approximate numerical integration for displacement
        let disp = 0;
        const dt = 0.05;
        for (let t = 0; t <= currentTime; t += dt) {
          disp += evaluateCurve(primaryCurve, t) * dt;
        }
        // Total displacement across entire duration
        let totalDisp = 0;
        for (let t = 0; t <= simDuration; t += dt) {
          totalDisp += Math.abs(evaluateCurve(primaryCurve, t)) * dt;
        }
        objectFraction = totalDisp > 0 ? Math.min(Math.max(disp / totalDisp, 0), 1) : currentTime / simDuration;
      } else {
        objectFraction = Math.min(Math.max((currentTime - xMin) / (xMax - xMin || 1), 0), 1);
      }

      const objX = trackStart + objectFraction * trackLen;

      // Draw the authentic object (Plane, Stone, Car, Ball, Rocket, Train, Runner, Bike, Boat)
      drawSimulationObject(ctx, activeObjectType, objX, trackY - 4, currentVal, currentTime, false);

      // Velocity vector arrow above object
      const currentSpeed = currentVal;
      const arrowLen = Math.min(Math.max(currentSpeed * 2.5, -60), 60);
      if (Math.abs(arrowLen) > 3) {
        ctx.save();
        ctx.strokeStyle = '#38BDF8';
        ctx.fillStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(objX, trackY - 32);
        ctx.lineTo(objX + arrowLen, trackY - 32);
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        const headDir = arrowLen > 0 ? 1 : -1;
        ctx.moveTo(objX + arrowLen, trackY - 32);
        ctx.lineTo(objX + arrowLen - headDir * 6, trackY - 36);
        ctx.lineTo(objX + arrowLen - headDir * 6, trackY - 28);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`v = ${currentSpeed.toFixed(1)} m/s`, objX + arrowLen / 2, trackY - 42);
        ctx.restore();
      }

      // Telemetry HUD overlay in top left
      ctx.fillStyle = '#A1A1AA';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Elapsed Time: ${currentTime.toFixed(2)} s`, 20, 24);
      ctx.fillStyle = '#22C55E';
      ctx.fillText(`Current Value (${graph.yAxis.label}): ${currentVal.toFixed(2)} ${graph.yAxis.unit || ''}`, 20, 42);
    }

    // B. PROJECTILE MOTION 2D SIMULATION
    else if (simType === 'projectile_2d' || graph.graphType === 'projectile_motion') {
      const groundY = height * 0.82;
      const cannonX = 40;
      const groundWidth = width - 80;

      // Draw ground
      ctx.strokeStyle = '#27272A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, groundY);
      ctx.lineTo(width - 20, groundY);
      ctx.stroke();

      // Parabolic flight path preview
      ctx.strokeStyle = '#22C55E44';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      const projSteps = 100;
      for (let i = 0; i <= projSteps; i++) {
        const x = xMin + (i / projSteps) * (xMax - xMin);
        const y = evaluateCurve(primaryCurve, x);
        const px = cannonX + ((x - xMin) / (xMax - xMin || 1)) * groundWidth;
        const py = groundY - (y / (yMax || 1)) * (groundY - 30);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Current projectile position
      const curX = currentTime;
      const curY = evaluateCurve(primaryCurve, curX);
      const ballX = cannonX + ((curX - xMin) / (xMax - xMin || 1)) * groundWidth;
      const ballY = groundY - (Math.max(curY, 0) / (yMax || 1)) * (groundY - 30);

      // Trajectory vapor trail
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const trailCount = Math.floor((curX / (xMax || 1)) * projSteps);
      for (let i = 0; i <= trailCount; i++) {
        const x = xMin + (i / projSteps) * (xMax - xMin);
        const y = evaluateCurve(primaryCurve, x);
        const px = cannonX + ((x - xMin) / (xMax - xMin || 1)) * groundWidth;
        const py = groundY - (y / (yMax || 1)) * (groundY - 30);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Draw authentic projectile object (Stone, Ball, Rocket, Plane, etc.)
      drawSimulationObject(ctx, activeObjectType, ballX, ballY, curY, currentTime, true);

      // Launch structure / origin
      if (activeObjectType === 'stone') {
        // Rocky cliff edge at origin
        ctx.fillStyle = '#3F3F46';
        ctx.fillRect(cannonX - 25, groundY - 20, 25, 20);
        ctx.strokeStyle = '#52525B';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cannonX - 25, groundY - 20, 25, 20);
      } else {
        // Launch cannon / platform
        ctx.fillStyle = '#52525B';
        ctx.beginPath();
        ctx.arc(cannonX, groundY, 12, 0, Math.PI, true);
        ctx.fill();
      }

      // Live Telemetry
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Time t: ${curX.toFixed(2)}s | Altitude y: ${curY.toFixed(2)}m`, 20, 24);
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`Range x: ${curX.toFixed(2)}m`, 20, 42);
    }

    // C. SIMPLE HARMONIC MOTION (Oscillator / Pendulum)
    else if (simType === 'shm_oscillator' || graph.graphType === 'shm') {
      const centerX = width / 2;
      const anchorY = 30;
      const maxLen = height * 0.6;
      // Angle theta or displacement x
      const theta = (currentVal / (yMax || 1)) * 0.6; // radians
      const bobX = centerX + Math.sin(theta) * maxLen;
      const bobY = anchorY + Math.cos(theta) * maxLen;

      // Anchor point
      ctx.fillStyle = '#52525B';
      ctx.fillRect(centerX - 20, anchorY - 8, 40, 8);

      // Rod/string
      ctx.strokeStyle = '#71717A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, anchorY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Bob
      ctx.beginPath();
      ctx.arc(bobX, bobY, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#38BDF8';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Energy bar HUD in top right
      const keFrac = Math.pow(Math.cos(theta * 2), 2);
      const peFrac = 1 - keFrac;
      ctx.fillStyle = '#A1A1AA';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`KE (Kinetic): ${(keFrac * 100).toFixed(0)}%`, 20, 24);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(20, 30, keFrac * 90, 8);

      ctx.fillStyle = '#A1A1AA';
      ctx.fillText(`PE (Potential): ${(peFrac * 100).toFixed(0)}%`, 20, 52);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(20, 58, peFrac * 90, 8);
    }

    // D. WAVE MOTION SIMULATOR
    else if (simType === 'wave_propagation' || graph.graphType === 'wave_motion') {
      const midY = height / 2;
      const waveStartX = 30;
      const waveEndX = width - 30;
      const numParticles = 40;

      ctx.strokeStyle = '#27272A';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(waveStartX, midY);
      ctx.lineTo(waveEndX, midY);
      ctx.stroke();

      for (let i = 0; i <= numParticles; i++) {
        const frac = i / numParticles;
        const px = waveStartX + frac * (waveEndX - waveStartX);
        const spatialPhase = frac * 4 * Math.PI;
        const temporalPhase = currentTime * 3;
        const py = midY + Math.sin(spatialPhase - temporalPhase) * (height * 0.3);

        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = i % 5 === 0 ? '#EC4899' : '#38BDF8';
        ctx.fill();
      }

      ctx.fillStyle = '#A1A1AA';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Wave Propagation | t = ${currentTime.toFixed(2)}s`, 20, 24);
    }

    // E. GENERAL FUNCTION TANGENT & CURVE TRACING (Mathematics)
    else {
      const midY = height / 2;
      ctx.fillStyle = '#A1A1AA';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Mathematical Curve Simulator: x = ${currentTime.toFixed(2)}`, 20, 24);
      ctx.fillStyle = '#22C55E';
      ctx.fillText(`Function Value: f(x) = ${currentVal.toFixed(3)}`, 20, 42);

      // Visual horizontal progress gauge
      const barW = width - 40;
      ctx.fillStyle = '#18181B';
      ctx.fillRect(20, height - 30, barW, 10);
      const frac = Math.min(Math.max((currentTime - xMin) / (xMax - xMin || 1), 0), 1);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(20, height - 30, frac * barW, 10);
    }
  }, [graph, currentTime, showSimStage, xMin, xMax, yMin, yMax, simDuration, evaluateCurve, activeObjectType]);

  // Canvas mouse / touch interaction for inspection
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const padLeft = 60;
    const padRight = 30;
    const padTop = 35;
    const padBottom = 45;
    const plotWidth = rect.width - padLeft - padRight;
    const plotHeight = rect.height - padTop - padBottom;

    if (px >= padLeft && px <= rect.width - padRight && py >= padTop && py <= rect.height - padBottom) {
      const curXSpan = (xMax - xMin) / zoomLevel;
      const curYSpan = (yMax - yMin) / zoomLevel;
      const xVal = xMin + ((px - padLeft) / plotWidth) * curXSpan;
      const yVal = yMin + ((plotHeight - (py - padTop)) / plotHeight) * curYSpan;
      const curveY = graph.curves[0] ? evaluateCurve(graph.curves[0], xVal) : undefined;
      setHoverCoord({ x: xVal, y: yVal, curveY });
    } else {
      setHoverCoord(null);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoverCoord(null);
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-[#0A0A0A] border border-[#27272A] rounded-3xl shadow-2xl overflow-hidden transition-all text-white ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto p-4 sm:p-6 bg-black' : 'my-4'
      }`}
    >
      {/* Top Header & Tab Ribbon (if multiple graphs exist) */}
      <div className="p-4 sm:p-5 border-b border-[#27272A] bg-[#121214] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center flex-shrink-0 text-[#22C55E]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {graph.title || 'Interactive Graph & Simulation'}
              </h3>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                Virtual Lab
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] truncate">
              {graph.category === 'physics' ? 'Physics Motion Telemetry' : 'Mathematical Curve Analysis'} · {graph.curves.length} Plot Curve{graph.curves.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Action Controls & Fullscreen toggle */}
        <div className="flex items-center space-x-2 self-end sm:self-center">
          {graphs.length > 1 && (
            <div className="flex items-center bg-[#18181B] rounded-xl p-0.5 border border-[#27272A] text-xs font-semibold mr-1">
              {graphs.map((g, idx) => (
                <button
                  key={g.id || idx}
                  onClick={() => {
                    setActiveGraphIndex(idx);
                    setCurrentTime(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeGraphIndex === idx
                      ? 'bg-[#22C55E] text-white font-bold'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {g.title.split(' ')[0] || `Graph ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setZoomLevel((z) => Math.min(z * 1.25, 4))}
            title="Zoom In"
            className="p-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#27272A] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z / 1.25, 0.5))}
            title="Zoom Out"
            className="p-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#27272A] transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            title="Reset Zoom"
            className="px-2.5 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white border border-[#27272A] transition-colors cursor-pointer"
          >
            100%
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Lab'}
            className="p-2 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#27272A] transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Graph Canvas Display */}
      <div className="relative w-full h-[320px] sm:h-[420px] bg-[#09090B] select-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair block"
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        />

        {/* Legend Overlay at Top Right of Canvas */}
        <div className="absolute top-3 right-3 bg-[#18181BE6] backdrop-blur-md border border-[#27272A] rounded-xl px-3 py-2 text-[11px] font-mono space-y-1 shadow-lg pointer-events-none">
          {graph.curves.map((c) => (
            <div key={c.id} className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || '#22C55E' }} />
              <span className="text-white font-semibold">{c.label}</span>
              {c.equationText && <span className="text-[#A1A1AA]">({c.equationText})</span>}
            </div>
          ))}
        </div>

        {/* Live Hover Inspection HUD Bar */}
        {hoverCoord && (
          <div className="absolute bottom-2 left-4 bg-[#18181BEE] border border-[#38BDF8]/40 px-3 py-1.5 rounded-xl text-xs font-mono text-[#E0F2FE] shadow-lg flex items-center space-x-3 pointer-events-none">
            <span>
              x: <strong className="text-white">{hoverCoord.x.toFixed(2)}</strong>
            </span>
            <span>
              y: <strong className="text-white">{hoverCoord.y.toFixed(2)}</strong>
            </span>
            {hoverCoord.curveY !== undefined && (
              <span className="text-[#22C55E]">
                f(x): <strong>{hoverCoord.curveY.toFixed(2)}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Synchronized Physical Simulation Stage (Virtual Lab Canvas) */}
      {showSimStage && (
        <div className="border-t border-[#27272A] bg-[#050507]">
          <div className="px-4 py-2.5 bg-[#121214] border-b border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#22C55E] flex items-center space-x-1.5 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" />
                <span>Real-Time Motion Laboratory</span>
              </span>
              <span className="text-[#71717A] text-[11px] hidden sm:inline">
                • 60 FPS Physics Demonstration
              </span>
            </div>

            {/* Object entity switcher pills */}
            <div className="flex items-center space-x-1 overflow-x-auto py-0.5 scrollbar-none">
              <span className="text-[10px] text-[#71717A] uppercase font-mono tracking-wider mr-1 shrink-0">
                Entity:
              </span>
              {SIMULATION_OBJECTS.map((obj) => {
                const isSelected = activeObjectType === obj.id;
                const isAuto = detectedType === obj.id;
                return (
                  <button
                    type="button"
                    key={obj.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedObjectType(obj.id);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-[#22C55E] text-black font-bold shadow-sm shadow-emerald-500/25'
                        : 'bg-[#18181B] text-[#A1A1AA] hover:text-white hover:bg-[#27272A] border border-[#27272A]'
                    }`}
                    title={`Switch simulation object to ${obj.label}`}
                  >
                    <span>{obj.icon}</span>
                    <span>{obj.label}</span>
                    {isAuto && (
                      <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-black/30 text-emerald-950 font-bold' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        auto
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="w-full h-[150px] sm:h-[180px]">
            <canvas ref={simCanvasRef} className="w-full h-full block" />
          </div>
        </div>
      )}

      {/* Animation Control Bar (Play, Pause, Scrubber, Speed) */}
      <div className="p-4 sm:p-5 bg-[#121214] border-t border-[#27272A] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Play/Pause & Time */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={handleRestart}
              className="p-2.5 rounded-2xl bg-[#18181B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white border border-[#27272A] active:scale-95 transition-all cursor-pointer"
              title="Restart from t = 0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="font-mono text-xs text-white pl-2">
              <span className="font-bold text-[#22C55E]">{currentTime.toFixed(2)}s</span>
              <span className="text-[#71717A]"> / {simDuration.toFixed(2)}s</span>
            </div>
          </div>

          {/* Speed Pills & Stage Toggle */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-[#18181B] rounded-xl p-0.5 border border-[#27272A] text-xs font-mono">
              {[0.25, 0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-[#22C55E] text-white font-bold'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSimStage(!showSimStage)}
              className="px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-[#A1A1AA] hover:text-white border border-[#27272A] flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{showSimStage ? 'Hide Lab Stage' : 'Show Lab Stage'}</span>
            </button>
          </div>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex items-center space-x-3 pt-1">
          <span className="text-[11px] font-mono text-[#71717A]">0.0s</span>
          <input
            type="range"
            min={0}
            max={simDuration}
            step={0.02}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#22C55E]"
          />
          <span className="text-[11px] font-mono text-[#71717A]">{simDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Physics / Mathematical Interpretation Breakdown Cards */}
      {graph.featuresExplanation && (
        <div className="p-4 sm:p-5 bg-[#0A0A0A] border-t border-[#27272A] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Graph Meaning, Gradients & Physical Relationships</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {graph.featuresExplanation.gradientMeaning && (
              <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] space-y-1">
                <span className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider block">
                  Gradient / Slope (dy/dx)
                </span>
                <p className="text-xs text-[#D4D4D8] leading-relaxed">
                  {graph.featuresExplanation.gradientMeaning}
                </p>
              </div>
            )}

            {graph.featuresExplanation.areaMeaning && (
              <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] space-y-1">
                <span className="text-[11px] font-bold text-[#22C55E] uppercase tracking-wider block">
                  Area Under Graph (∫ y dx)
                </span>
                <p className="text-xs text-[#D4D4D8] leading-relaxed">
                  {graph.featuresExplanation.areaMeaning}
                </p>
              </div>
            )}

            {graph.featuresExplanation.interceptsMeaning && (
              <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] space-y-1">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Intercepts & Boundaries
                </span>
                <p className="text-xs text-[#D4D4D8] leading-relaxed">
                  {graph.featuresExplanation.interceptsMeaning}
                </p>
              </div>
            )}
          </div>

          {graph.featuresExplanation.physicalInterpretation && (
            <p className="text-xs text-[#A1A1AA] pt-1 leading-relaxed border-t border-[#27272A]/40">
              <span className="font-bold text-white">Physical Interpretation: </span>
              {graph.featuresExplanation.physicalInterpretation}
            </p>
          )}
        </div>
      )}

      {/* Global Graph Explanation (if provided by AI solver) */}
      {graphExplanation && (
        <div className="p-4 bg-[#121214] border-t border-[#27272A] text-xs text-[#D4D4D8] leading-relaxed flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block mb-0.5">AI Graph Summary:</span>
            <span>{graphExplanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};
