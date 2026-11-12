import React, { useState, useRef } from 'react';
import { ScientificDiagramData } from '../types';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Info,
  Maximize2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface Props {
  diagram: ScientificDiagramData;
  className?: string;
}

export const ScientificDiagramRenderer: React.FC<Props> = ({ diagram, className = '' }) => {
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2.2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.6));
  const handleResetZoom = () => setZoom(1);

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${diagram.type}_diagram.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  // Render specific diagram types
  const renderDiagramContent = () => {
    switch (diagram.type) {
      case 'circle_geometry':
        return renderCircleGeometry();
      case 'inclined_plane':
        return renderInclinedPlane();
      case 'free_body_diagram':
        return renderFreeBodyDiagram();
      case 'optics_ray':
        return renderOpticsRay();
      case 'bearing_trig':
        return renderBearingTrig();
      case 'triangle_trig':
        return renderTriangleTrig();
      case 'circuit':
        return renderElectricCircuit();
      case 'wave':
        return renderWaveMotion();
      case 'moments_lever':
        return renderMomentsLever();
      case 'vectors':
        return renderVectors();
      default:
        return renderCircleGeometry();
    }
  };

  // 1a. Circle Chord & Perpendicular Distance
  const renderCircleChordDistance = () => {
    const cData = diagram.data.circle;
    const cd = cData?.chordDistance;
    const rVal = cd?.radius || 14;
    const chordLen = cd?.chordLength || 20;
    const halfChord = chordLen / 2;
    // Calculate perpendicular distance d = sqrt(r^2 - halfChord^2)
    const dVal = cd?.perpendicularDistance || (rVal > halfChord ? Math.sqrt(rVal * rVal - halfChord * halfChord) : 9.8);
    const dFormatted = dVal.toFixed(2);

    const cx = 300;
    const cy = 165;
    const R_px = 125;

    // Scale factor
    const ratioD = Math.min(Math.max(dVal / rVal, 0.2), 0.85);
    const ratioHalf = Math.sqrt(Math.max(0.1, 1 - ratioD * ratioD));
    const d_px = R_px * ratioD;
    const half_px = R_px * ratioHalf;

    const my = cy + d_px; // Midpoint M Y
    const mx = cx; // Midpoint M X
    const ax = cx - half_px; // Point A X
    const ay = my; // Point A Y
    const bx = cx + half_px; // Point B X
    const by = my; // Point B Y

    return (
      <g>
        {/* Circle Body */}
        <circle
          cx={cx}
          cy={cy}
          r={R_px}
          fill="#101827"
          fillOpacity="0.4"
          stroke="#38BDF8"
          strokeWidth="2.5"
        />

        {/* Shaded Right-Angled Triangle OMA */}
        <polygon
          points={`${cx},${cy} ${ax},${ay} ${mx},${my}`}
          fill="#22C55E"
          fillOpacity="0.15"
          stroke="#22C55E"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* Center O */}
        <circle cx={cx} cy={cy} r="5" fill="#38BDF8" />
        {showLabels && (
          <text x={cx} y={cy - 12} fill="#38BDF8" fontSize="14" fontWeight="bold" textAnchor="middle">
            O (Centre)
          </text>
        )}

        {/* Radius OA to endpoint A */}
        <line x1={cx} y1={cy} x2={ax} y2={ay} stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="5 3" />
        {showLabels && (
          <text
            x={(cx + ax) / 2 - 25}
            y={(cy + ay) / 2 - 6}
            fill="#38BDF8"
            fontSize="12"
            fontWeight="bold"
          >
            r = {rVal} cm
          </text>
        )}

        {/* Radius OB to endpoint B */}
        <line x1={cx} y1={cy} x2={bx} y2={by} stroke="#38BDF8" strokeWidth="2" strokeDasharray="5 3" />
        {showLabels && (
          <text
            x={(cx + bx) / 2 + 10}
            y={(cy + by) / 2 - 6}
            fill="#38BDF8"
            fontSize="12"
            fontWeight="bold"
          >
            r = {rVal} cm
          </text>
        )}

        {/* Perpendicular Segment OM (Distance d) */}
        <line x1={cx} y1={cy} x2={mx} y2={my} stroke="#22C55E" strokeWidth="3" markerEnd="url(#arrow-green)" />
        {showLabels && (
          <text
            x={cx + 12}
            y={(cy + my) / 2 + 4}
            fill="#22C55E"
            fontSize="13"
            fontWeight="bold"
          >
            d = {dFormatted} cm
          </text>
        )}

        {/* Right-Angle Square Marker at M */}
        <path
          d={`M ${mx} ${my - 14} L ${mx - 14} ${my - 14} L ${mx - 14} ${my}`}
          fill="none"
          stroke="#22C55E"
          strokeWidth="2"
        />

        {/* Chord AB */}
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#F59E0B" strokeWidth="3.5" />

        {/* Points A, B, M */}
        <circle cx={ax} cy={ay} r="5" fill="#F59E0B" />
        <circle cx={bx} cy={by} r="5" fill="#F59E0B" />
        <circle cx={mx} cy={my} r="4" fill="#22C55E" />

        {showLabels && (
          <>
            <text x={ax - 18} y={ay + 5} fill="#F59E0B" fontSize="14" fontWeight="bold">
              A
            </text>
            <text x={bx + 12} y={by + 5} fill="#F59E0B" fontSize="14" fontWeight="bold">
              B
            </text>
            <text x={mx} y={my + 18} fill="#22C55E" fontSize="12" fontWeight="bold" textAnchor="middle">
              M (Midpoint)
            </text>
            {/* Chord segment measurements */}
            <text x={(ax + mx) / 2} y={my + 18} fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="middle">
              {halfChord} cm
            </text>
            <text x={(mx + bx) / 2} y={my + 18} fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="middle">
              {halfChord} cm
            </text>
          </>
        )}

        {/* Theorem & Formula Box at Bottom */}
        <g transform="translate(40, 305)">
          <rect width="520" height="62" rx="10" fill="#18181B" stroke="#27272A" />
          <text x="16" y="24" fill="#22C55E" fontSize="12" fontWeight="bold">
            Chord Bisector Theorem:
          </text>
          <text x="180" y="24" fill="#E2E8F0" fontSize="12">
            Perpendicular from centre O bisects chord AB (AM = MB = {halfChord} cm)
          </text>
          <text x="16" y="48" fill="#F59E0B" fontSize="12" fontWeight="bold">
            Pythagoras in △OMA:
          </text>
          <text x="180" y="48" fill="#38BDF8" fontSize="12" fontFamily="monospace">
            d = √(OA² - AM²) = √({rVal}² - {halfChord}²) = √({rVal * rVal - halfChord * halfChord}) = {dFormatted} cm
          </text>
        </g>
      </g>
    );
  };

  // 1b. Circle Tangent & Secant Geometry
  const renderCircleGeometry = () => {
    const cData = diagram.data.circle;
    if (
      cData?.subtype === 'chord_distance' ||
      cData?.chordDistance ||
      diagram.topic.toLowerCase().includes('chord') ||
      diagram.title.toLowerCase().includes('chord')
    ) {
      return renderCircleChordDistance();
    }

    const cx = 300;
    const cy = 200;
    const r = cData?.radius || 110;

    // Default or specified points along circumference
    // E.g. A tangent AF, line AEC intersecting circle at E and C, inscribed triangle
    const points = cData?.points || [
      { id: 'E', angleDeg: 140, label: 'E' },
      { id: 'C', angleDeg: 35, label: 'C' },
      { id: 'D', angleDeg: 280, label: 'D' },
      { id: 'B', angleDeg: 210, label: 'B' },
    ];

    // Compute coordinate for angle in degrees
    const getPointCoord = (angleDeg: number, radius = r) => {
      const rad = (angleDeg * Math.PI) / 180;
      return {
        x: cx + radius * Math.cos(rad),
        y: cy - radius * Math.sin(rad),
      };
    };

    const ptE = getPointCoord(140);
    const ptC = getPointCoord(35);
    const ptD = getPointCoord(280);
    const ptB = getPointCoord(210);

    // Tangent point and external point A
    // Tangent line at B or contact point
    const ptA = { x: 90, y: 110 }; // External point A
    const ptF = { x: 80, y: 310 }; // Tangent line continues to F

    return (
      <g>
        {/* Circle Body */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="#101827"
          fillOpacity="0.4"
          stroke="#38BDF8"
          strokeWidth="2.5"
        />

        {/* Center O */}
        <circle cx={cx} cy={cy} r="4" fill="#38BDF8" />
        {showLabels && (
          <text x={cx + 10} y={cy - 6} fill="#94A3B8" fontSize="13" fontWeight="bold">
            {cData?.centerLabel || 'O'}
          </text>
        )}

        {/* Secant AEC passing through E and C from external point A */}
        <line
          x1={ptA.x}
          y1={ptA.y}
          x2={ptC.x + 30}
          y2={ptC.y - 12}
          stroke="#F59E0B"
          strokeWidth="2"
        />

        {/* Tangent line AF from A through B/contact point to F */}
        <line
          x1={ptA.x}
          y1={ptA.y}
          x2={ptF.x}
          y2={ptF.y}
          stroke="#22C55E"
          strokeWidth="2.5"
        />

        {/* Inscribed chords: E-D, D-C, E-B, D-B */}
        <line x1={ptE.x} y1={ptE.y} x2={ptD.x} y2={ptD.y} stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1={ptD.x} y1={ptD.y} x2={ptC.x} y2={ptC.y} stroke="#E2E8F0" strokeWidth="1.8" />
        <line x1={ptE.x} y1={ptE.y} x2={ptB.x} y2={ptB.y} stroke="#E2E8F0" strokeWidth="1.8" />
        <line x1={ptB.x} y1={ptB.y} x2={ptD.x} y2={ptD.y} stroke="#E2E8F0" strokeWidth="1.8" />
        <line x1={ptE.x} y1={ptE.y} x2={ptC.x} y2={ptC.y} stroke="#F59E0B" strokeWidth="2" />

        {/* Radius to tangent point (shows 90 deg theorem) */}
        <line x1={cx} y1={cy} x2={ptB.x} y2={ptB.y} stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Right-angle indicator at contact point */}
        <path
          d={`M ${ptB.x - 8} ${ptB.y - 4} L ${ptB.x - 3} ${ptB.y - 14} L ${ptB.x + 8} ${ptB.y - 10}`}
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1.2"
        />

        {/* Points & Labels */}
        {[
          { pt: ptA, label: 'A', color: '#F59E0B', dx: -18, dy: -4 },
          { pt: ptE, label: 'E', color: '#FFFFFF', dx: -10, dy: -12 },
          { pt: ptC, label: 'C', color: '#FFFFFF', dx: 14, dy: -6 },
          { pt: ptD, label: 'D', color: '#FFFFFF', dx: 6, dy: 18 },
          { pt: ptB, label: 'B (Contact)', color: '#22C55E', dx: -35, dy: 16 },
          { pt: ptF, label: 'F', color: '#22C55E', dx: -14, dy: 18 },
        ].map(({ pt, label, color, dx, dy }, idx) => (
          <g key={idx}>
            <circle cx={pt.x} cy={pt.y} r="4.5" fill={color} />
            {showLabels && (
              <text
                x={pt.x + dx}
                y={pt.y + dy}
                fill={color}
                fontSize="13"
                fontWeight="bold"
                className="select-none"
              >
                {label}
              </text>
            )}
          </g>
        ))}

        {/* Theorem & Property Callout Badge */}
        <g transform="translate(370, 310)">
          <rect width="210" height="60" rx="8" fill="#18181B" stroke="#27272A" />
          <text x="12" y="22" fill="#22C55E" fontSize="11" fontWeight="bold">
            Tangent-Secant Theorem:
          </text>
          <text x="12" y="42" fill="#E2E8F0" fontSize="12" fontFamily="monospace">
            AB² = AE × AC
          </text>
        </g>
      </g>
    );
  };

  // 2. Forces on Inclined Plane
  const renderInclinedPlane = () => {
    const ip = diagram.data.inclinedPlane;
    const angleDeg = ip?.angleDeg || 30;
    const massKg = ip?.massKg || 5;
    const rad = (angleDeg * Math.PI) / 180;

    // Triangle vertices for inclined wedge
    const x0 = 70;
    const y0 = 320;
    const baseLength = 460;
    const height = Math.min(baseLength * Math.tan(rad), 240);
    const x1 = x0 + baseLength;
    const y1 = y0;
    const x2 = x0;
    const y2 = y0 - height;

    // Block position along incline (at 55% of the slope)
    const t = 0.52;
    const blockCenter = {
      x: x2 + t * (x1 - x2),
      y: y2 + t * (y1 - y2),
    };

    // Inclination angle relative to horizontal
    const slopeAngleDeg = Math.atan2(y1 - y2, x1 - x2) * (180 / Math.PI);

    // Forces vectors calculations
    const weightMag = 90;
    const normalMag = weightMag * Math.cos(rad);
    const mgSinMag = weightMag * Math.sin(rad);
    const frictionMag = ip?.frictionN ? 55 : 45;

    return (
      <g>
        {/* Inclined Wedge Ground */}
        <polygon
          points={`${x0},${y0} ${x1},${y1} ${x0},${y2}`}
          fill="#1E293B"
          fillOpacity="0.7"
          stroke="#475569"
          strokeWidth="2.5"
        />

        {/* Ground Hatching */}
        <line x1={x0 - 20} y1={y0} x2={x1 + 30} y2={y0} stroke="#64748B" strokeWidth="2" />

        {/* Angle Arc at Bottom Right */}
        <path
          d={`M ${x1 - 60} ${y0} A 60 60 0 0 0 ${x1 - 60 * Math.cos(rad)} ${y0 - 60 * Math.sin(rad)}`}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2"
        />
        <text
          x={x1 - 85}
          y={y0 - 14}
          fill="#F59E0B"
          fontSize="14"
          fontWeight="bold"
        >
          θ = {angleDeg}°
        </text>

        {/* Mass Block on Slope */}
        <g
          transform={`translate(${blockCenter.x}, ${blockCenter.y}) rotate(${slopeAngleDeg})`}
        >
          {/* Block body */}
          <rect
            x="-35"
            y="-40"
            width="70"
            height="40"
            rx="4"
            fill="#3B82F6"
            fillOpacity="0.85"
            stroke="#60A5FA"
            strokeWidth="2"
          />
          <text
            x="0"
            y="-16"
            fill="#FFFFFF"
            fontSize="13"
            fontWeight="bold"
            textAnchor="middle"
          >
            m = {massKg} kg
          </text>
        </g>

        {/* Center of Mass for Force Origin */}
        <circle cx={blockCenter.x} cy={blockCenter.y - 15} r="4" fill="#FFFFFF" />

        {/* Force 1: Gravity Weight W = mg (straight down) */}
        <line
          x1={blockCenter.x}
          y1={blockCenter.y - 15}
          x2={blockCenter.x}
          y2={blockCenter.y - 15 + weightMag}
          stroke="#EF4444"
          strokeWidth="2.5"
          markerEnd="url(#arrow-red)"
        />
        {showLabels && (
          <text
            x={blockCenter.x + 8}
            y={blockCenter.y + weightMag - 10}
            fill="#EF4444"
            fontSize="12"
            fontWeight="bold"
          >
            W = mg {ip?.weightN ? `(${ip.weightN}N)` : ''}
          </text>
        )}

        {/* Force 2: Normal Reaction R / N (perpendicular to slope) */}
        {(() => {
          const normAngle = rad - Math.PI / 2;
          const nx = blockCenter.x + normalMag * Math.sin(rad);
          const ny = blockCenter.y - 15 - normalMag * Math.cos(rad);
          return (
            <g>
              <line
                x1={blockCenter.x}
                y1={blockCenter.y - 15}
                x2={nx}
                y2={ny}
                stroke="#22C55E"
                strokeWidth="2.5"
                markerEnd="url(#arrow-green)"
              />
              {showLabels && (
                <text x={nx + 8} y={ny + 2} fill="#22C55E" fontSize="12" fontWeight="bold">
                  R (Normal Reaction)
                </text>
              )}
            </g>
          );
        })()}

        {/* Force 3: Downslope Component mg sin θ */}
        {(() => {
          const dsx = blockCenter.x - mgSinMag * Math.cos(rad);
          const dsy = blockCenter.y - 15 + mgSinMag * Math.sin(rad);
          return (
            <g>
              <line
                x1={blockCenter.x}
                y1={blockCenter.y - 15}
                x2={dsx}
                y2={dsy}
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray="4 3"
                markerEnd="url(#arrow-amber)"
              />
              {showLabels && (
                <text x={dsx - 70} y={dsy + 14} fill="#F59E0B" fontSize="11" fontWeight="bold">
                  mg sin θ
                </text>
              )}
            </g>
          );
        })()}

        {/* Force 4: Friction Force f opposing motion (up the slope) */}
        {(() => {
          const fx = blockCenter.x + frictionMag * Math.cos(rad);
          const fy = blockCenter.y - 15 - frictionMag * Math.sin(rad);
          return (
            <g>
              <line
                x1={blockCenter.x}
                y1={blockCenter.y - 15}
                x2={fx}
                y2={fy}
                stroke="#A855F7"
                strokeWidth="2.5"
                markerEnd="url(#arrow-purple)"
              />
              {showLabels && (
                <text x={fx + 8} y={fy - 6} fill="#A855F7" fontSize="12" fontWeight="bold">
                  f (Friction) = μR
                </text>
              )}
            </g>
          );
        })()}

        {/* Legend Card */}
        <g transform="translate(20, 20)">
          <rect width="180" height="74" rx="8" fill="#18181B" stroke="#27272A" />
          <text x="10" y="20" fill="#FFFFFF" fontSize="11" fontWeight="bold">
            Equilibrium / Motion:
          </text>
          <text x="10" y="38" fill="#22C55E" fontSize="11">
            • R = mg cos({angleDeg}°)
          </text>
          <text x="10" y="56" fill="#F59E0B" fontSize="11">
            • F_net = mg sin({angleDeg}°) - f
          </text>
        </g>
      </g>
    );
  };

  // 3. Free Body Diagram
  const renderFreeBodyDiagram = () => {
    const fbd = diagram.data.freeBody;
    const cx = 300;
    const cy = 200;
    const forces = fbd?.forces || [
      { name: 'Normal (N)', value: '49 N', directionDeg: 90, color: '#22C55E' },
      { name: 'Gravity (W)', value: '49 N', directionDeg: 270, color: '#EF4444' },
      { name: 'Applied (F)', value: '30 N', directionDeg: 0, color: '#38BDF8' },
      { name: 'Friction (f)', value: '15 N', directionDeg: 180, color: '#F59E0B' },
    ];

    return (
      <g>
        {/* Central Mass Box */}
        <rect
          x={cx - 35}
          y={cy - 35}
          width="70"
          height="70"
          rx="8"
          fill="#1E293B"
          stroke="#60A5FA"
          strokeWidth="2.5"
        />
        <text x={cx} y={cy + 5} fill="#FFFFFF" fontSize="13" fontWeight="bold" textAnchor="middle">
          {fbd?.bodyLabel || 'm'}
        </text>

        {/* Forces Arrows */}
        {forces.map((force, idx) => {
          const rad = (force.directionDeg * Math.PI) / 180;
          const arrowLen = 110;
          const ex = cx + arrowLen * Math.cos(rad);
          const ey = cy - arrowLen * Math.sin(rad);

          return (
            <g key={idx}>
              <line
                x1={cx}
                y1={cy}
                x2={ex}
                y2={ey}
                stroke={force.color || '#38BDF8'}
                strokeWidth="2.5"
                markerEnd="url(#arrow-cyan)"
              />
              {showLabels && (
                <text
                  x={ex + (Math.cos(rad) > 0 ? 10 : Math.cos(rad) < 0 ? -70 : -30)}
                  y={ey + (Math.sin(rad) > 0 ? -10 : Math.sin(rad) < 0 ? 20 : 5)}
                  fill={force.color || '#38BDF8'}
                  fontSize="12"
                  fontWeight="bold"
                >
                  {force.name} {force.value ? `(${force.value})` : ''}
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // 4. Optics Ray Diagram (Concave / Convex Mirror or Lens)
  const renderOpticsRay = () => {
    const opt = diagram.data.optics;
    const opticType = opt?.opticType || 'concave_mirror';
    const f = opt?.focalLengthCm || 15;
    const u = opt?.objectDistanceCm || 25;
    const ho = opt?.objectHeightCm || 6;

    // Optical Center / Pole P
    const px = 420;
    const py = 200;

    // Scale factors: 1 cm = 8 px
    const scale = 7.5;
    const fx = px - f * scale; // Focal point F
    const cx = px - 2 * f * scale; // Center of curvature C
    const ox = px - u * scale; // Object position X
    const objH = ho * 8; // Object height in px

    // Mirror formula: 1/f = 1/v + 1/u => 1/v = 1/f - 1/u => v = (f * u) / (u - f)
    const isVirtual = u < f;
    const v = u !== f ? (f * u) / (u - f) : 999;
    const ix = px - v * scale;
    const ih = isVirtual ? -(objH * Math.abs(v)) / u : (objH * v) / u;

    return (
      <g>
        {/* Principal Axis */}
        <line x1="50" y1={py} x2="560" y2={py} stroke="#64748B" strokeWidth="2" strokeDasharray="6 4" />
        <text x="50" y={py - 10} fill="#94A3B8" fontSize="11" fontWeight="bold">
          Principal Axis
        </text>

        {/* Optical Element (Concave Mirror Curved Arc) */}
        <path
          d={`M ${px} 80 A 240 240 0 0 1 ${px} 320`}
          fill="none"
          stroke="#38BDF8"
          strokeWidth="3.5"
        />
        {/* Mirror Silvering Hash Marks */}
        {[100, 130, 160, 190, 220, 250, 280, 300].map((y, i) => (
          <line key={i} x1={px + 4} y1={y} x2={px + 12} y2={y - 8} stroke="#475569" strokeWidth="1.5" />
        ))}

        {/* Optical Pole P */}
        <circle cx={px} cy={py} r="4" fill="#38BDF8" />
        <text x={px + 8} y={py + 18} fill="#38BDF8" fontSize="13" fontWeight="bold">
          P
        </text>

        {/* Focal Point F */}
        <circle cx={fx} cy={py} r="4" fill="#22C55E" />
        <text x={fx - 6} y={py + 18} fill="#22C55E" fontSize="13" fontWeight="bold">
          F
        </text>

        {/* Center of Curvature C */}
        <circle cx={cx} cy={py} r="4" fill="#F59E0B" />
        <text x={cx - 6} y={py + 18} fill="#F59E0B" fontSize="13" fontWeight="bold">
          C
        </text>

        {/* Object Arrow (Upright, Yellow) */}
        <line
          x1={ox}
          y1={py}
          x2={ox}
          y2={py - objH}
          stroke="#F59E0B"
          strokeWidth="3"
          markerEnd="url(#arrow-amber)"
        />
        {showLabels && (
          <text x={ox - 15} y={py - objH - 8} fill="#F59E0B" fontSize="12" fontWeight="bold">
            Object (u={u}cm)
          </text>
        )}

        {/* Ray 1: Parallel to Principal Axis -> Reflects through Focus F */}
        <line x1={ox} y1={py - objH} x2={px} y2={py - objH} stroke="#22C55E" strokeWidth="2" markerMid="url(#arrow-green)" />
        <line x1={px} y1={py - objH} x2={ix < 50 ? 50 : ix - 60} y2={py + ih + 40} stroke="#22C55E" strokeWidth="2" />

        {/* Ray 2: Passing through Focus F -> Reflects Parallel to Axis */}
        <line x1={ox} y1={py - objH} x2={px} y2={py + 45} stroke="#38BDF8" strokeWidth="2" />
        <line x1={px} y1={py + 45} x2="80" y2={py + 45} stroke="#38BDF8" strokeWidth="2" markerMid="url(#arrow-cyan)" />

        {/* Image Arrow */}
        {ix > 60 && ix < 540 && (
          <g>
            <line
              x1={ix}
              y1={py}
              x2={ix}
              y2={py + ih}
              stroke="#EF4444"
              strokeWidth="3"
              strokeDasharray={isVirtual ? '4 3' : undefined}
              markerEnd="url(#arrow-red)"
            />
            {showLabels && (
              <text x={ix - 25} y={py + ih + 18} fill="#EF4444" fontSize="12" fontWeight="bold">
                Image ({isVirtual ? 'Virtual' : 'Real & Inverted'}, v={Math.abs(Math.round(v))}cm)
              </text>
            )}
          </g>
        )}

        {/* Optics Nature Summary Badge */}
        <g transform="translate(30, 20)">
          <rect width="210" height="74" rx="8" fill="#18181B" stroke="#27272A" />
          <text x="10" y="20" fill="#38BDF8" fontSize="11" fontWeight="bold">
            Mirror Equation: 1/f = 1/v + 1/u
          </text>
          <text x="10" y="38" fill="#FFFFFF" fontSize="11">
            • Focal Length: f = {f} cm
          </text>
          <text x="10" y="56" fill="#22C55E" fontSize="11">
            • Nature: {isVirtual ? 'Virtual & Magnified' : 'Real, Inverted'}
          </text>
        </g>
      </g>
    );
  };

  // 5. Bearings & Navigation
  const renderBearingTrig = () => {
    const bData = diagram.data.bearing;
    const bearingDeg = bData?.bearingDeg || 60;
    const distKm = bData?.distanceKm || 120;
    const ax = 180;
    const ay = 250;

    // Angle in standard math coords: 0 deg = North (up) => rad = (90 - bearing)
    const rad = ((90 - bearingDeg) * Math.PI) / 180;
    const lineLen = 170;
    const bx = ax + lineLen * Math.cos(rad);
    const by = ay - lineLen * Math.sin(rad);

    return (
      <g>
        {/* Origin North Reference Line */}
        <line x1={ax} y1={ay} x2={ax} y2={ay - 120} stroke="#22C55E" strokeWidth="2.5" markerEnd="url(#arrow-green)" />
        <text x={ax - 5} y={ay - 130} fill="#22C55E" fontSize="14" fontWeight="bold">
          N
        </text>

        {/* Origin Point A */}
        <circle cx={ax} cy={ay} r="5" fill="#38BDF8" />
        <text x={ax - 20} y={ay + 18} fill="#38BDF8" fontSize="13" fontWeight="bold">
          {bData?.originLabel || 'A'}
        </text>

        {/* Bearing Line to B */}
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#F59E0B" strokeWidth="2.5" markerEnd="url(#arrow-amber)" />

        {/* Destination Point B */}
        <circle cx={bx} cy={by} r="5" fill="#EF4444" />
        <text x={bx + 10} y={by + 5} fill="#EF4444" fontSize="13" fontWeight="bold">
          {bData?.destinationLabel || 'B'}
        </text>

        {/* Second North Line at B for Back Bearing */}
        <line x1={bx} y1={by} x2={bx} y2={by - 100} stroke="#22C55E" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow-green)" />
        <text x={bx - 4} y={by - 108} fill="#22C55E" fontSize="13" fontWeight="bold">
          N
        </text>

        {/* Clockwise Angle Arc from North at A */}
        <path
          d={`M ${ax} ${ay - 45} A 45 45 0 0 1 ${ax + 45 * Math.sin((bearingDeg * Math.PI) / 180)} ${ay - 45 * Math.cos((bearingDeg * Math.PI) / 180)}`}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2"
        />
        <text x={ax + 25} y={ay - 50} fill="#F59E0B" fontSize="13" fontWeight="bold">
          {String(bearingDeg).padStart(3, '0')}°
        </text>

        {/* Distance label */}
        <text
          x={(ax + bx) / 2 + 10}
          y={(ay + by) / 2 - 10}
          fill="#FFFFFF"
          fontSize="12"
          fontWeight="bold"
        >
          {distKm} km
        </text>
      </g>
    );
  };

  // 6. Trigonometry & Triangles
  const renderTriangleTrig = () => {
    const tData = diagram.data.triangle;
    const ax = 120;
    const ay = 280;
    const bx = 460;
    const by = 280;
    const cx = 120;
    const cy = 100;

    return (
      <g>
        {/* Right Triangle */}
        <polygon
          points={`${ax},${ay} ${bx},${by} ${cx},${cy}`}
          fill="#1E293B"
          fillOpacity="0.5"
          stroke="#38BDF8"
          strokeWidth="2.5"
        />

        {/* Right Angle Symbol at A */}
        <rect x={ax} y={ay - 20} width="20" height="20" fill="none" stroke="#22C55E" strokeWidth="2" />

        {/* Vertices */}
        <circle cx={ax} cy={ay} r="4" fill="#38BDF8" />
        <text x={ax - 18} y={ay + 18} fill="#FFFFFF" fontSize="13" fontWeight="bold">
          A
        </text>

        <circle cx={bx} cy={by} r="4" fill="#38BDF8" />
        <text x={bx + 10} y={by + 18} fill="#FFFFFF" fontSize="13" fontWeight="bold">
          B
        </text>

        <circle cx={cx} cy={cy} r="4" fill="#38BDF8" />
        <text x={cx - 18} y={cy - 8} fill="#FFFFFF" fontSize="13" fontWeight="bold">
          C
        </text>

        {/* Side Labels */}
        <text x={(ax + bx) / 2} y={ay + 25} fill="#94A3B8" fontSize="12" fontWeight="bold" textAnchor="middle">
          Adjacent (Base) {tData?.adjacent ? `= ${tData.adjacent}` : ''}
        </text>
        <text x={ax - 35} y={(ay + cy) / 2} fill="#94A3B8" fontSize="12" fontWeight="bold" textAnchor="middle">
          Opposite {tData?.opposite ? `= ${tData.opposite}` : ''}
        </text>
        <text x={(bx + cx) / 2 + 25} y={(by + cy) / 2 - 10} fill="#F59E0B" fontSize="12" fontWeight="bold">
          Hypotenuse {tData?.hypotenuse ? `= ${tData.hypotenuse}` : ''}
        </text>

        {/* Angle θ Arc at B */}
        <path d={`M ${bx - 50} ${by} A 50 50 0 0 1 ${bx - 44} ${by - 24}`} fill="none" stroke="#F59E0B" strokeWidth="2" />
        <text x={bx - 70} y={by - 10} fill="#F59E0B" fontSize="13" fontWeight="bold">
          θ
        </text>
      </g>
    );
  };

  // 7. Electric Circuit
  const renderElectricCircuit = () => {
    const cData = diagram.data.circuit;
    const v = cData?.voltageV || 12;
    const r = cData?.totalResistanceOhm || 4;
    const i = cData?.currentA || 3;

    return (
      <g>
        {/* Closed Circuit Wire Loop */}
        <rect x="100" y="90" width="400" height="200" fill="none" stroke="#475569" strokeWidth="2.5" rx="6" />

        {/* DC Voltage Cell / Battery at Left */}
        <rect x="90" y="160" width="20" height="60" fill="#0E0E12" />
        {/* Long thin positive plate */}
        <line x1="90" y1="175" x2="110" y2="175" stroke="#22C55E" strokeWidth="3.5" />
        <text x="75" y="180" fill="#22C55E" fontSize="14" fontWeight="bold">
          +
        </text>
        {/* Short thick negative plate */}
        <line x1="95" y1="200" x2="105" y2="200" stroke="#EF4444" strokeWidth="5" />
        <text x="75" y="205" fill="#EF4444" fontSize="14" fontWeight="bold">
          -
        </text>
        <text x="50" y="235" fill="#22C55E" fontSize="12" fontWeight="bold">
          {v} V Cell
        </text>

        {/* Current Arrow on Top Wire */}
        <line x1="220" y1="90" x2="280" y2="90" stroke="#38BDF8" strokeWidth="2.5" markerEnd="url(#arrow-cyan)" />
        <text x="240" y="80" fill="#38BDF8" fontSize="12" fontWeight="bold">
          I = {i} A
        </text>

        {/* Resistor R on Right Branch */}
        <rect x="490" y="160" width="20" height="60" fill="#0E0E12" />
        {/* Zig-zag resistor symbol */}
        <path
          d="M 500 150 L 500 160 L 512 166 L 488 178 L 512 190 L 488 202 L 512 214 L 500 220 L 500 230"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2.5"
        />
        <text x="525" y="195" fill="#F59E0B" fontSize="13" fontWeight="bold">
          R = {r} Ω
        </text>

        {/* Ammeter in series at bottom */}
        <circle cx="300" cy="290" r="18" fill="#18181B" stroke="#38BDF8" strokeWidth="2" />
        <text x="300" y="295" fill="#38BDF8" fontSize="14" fontWeight="bold" textAnchor="middle">
          A
        </text>
        <text x="300" y="325" fill="#38BDF8" fontSize="11" textAnchor="middle">
          Ammeter
        </text>

        {/* Switch on top right */}
        <line x1="400" y1="90" x2="430" y2="76" stroke="#E2E8F0" strokeWidth="2.5" />
        <circle cx="400" cy="90" r="3.5" fill="#E2E8F0" />
        <circle cx="435" cy="90" r="3.5" fill="#E2E8F0" />
        <text x="405" y="65" fill="#94A3B8" fontSize="11">
          Switch (Closed)
        </text>
      </g>
    );
  };

  // 8. Wave Motion
  const renderWaveMotion = () => {
    const wData = diagram.data.wave;
    const amp = 60;
    const wavelength = 180;
    const py = 200;

    // Generate sinusoidal wave path points
    let wavePath = `M 60 ${py}`;
    for (let x = 60; x <= 540; x += 4) {
      const y = py - amp * Math.sin(((x - 60) * 2 * Math.PI) / wavelength);
      wavePath += ` L ${x} ${y}`;
    }

    return (
      <g>
        {/* Equilibrium Line */}
        <line x1="40" y1={py} x2="560" y2={py} stroke="#64748B" strokeWidth="1.5" strokeDasharray="5 4" />
        <text x="40" y={py - 10} fill="#94A3B8" fontSize="11">
          Equilibrium Axis
        </text>

        {/* Transverse Wave Curve */}
        <path d={wavePath} fill="none" stroke="#38BDF8" strokeWidth="3" />

        {/* Crest Point and Arrow */}
        <circle cx="105" cy={py - amp} r="4" fill="#22C55E" />
        <text x="90" y={py - amp - 12} fill="#22C55E" fontSize="12" fontWeight="bold">
          Crest
        </text>

        {/* Trough Point */}
        <circle cx="195" cy={py + amp} r="4" fill="#EF4444" />
        <text x="180" y={py + amp + 20} fill="#EF4444" fontSize="12" fontWeight="bold">
          Trough
        </text>

        {/* Amplitude A Dimension */}
        <line x1="105" y1={py} x2="105" y2={py - amp} stroke="#F59E0B" strokeWidth="2" markerEnd="url(#arrow-amber)" />
        <text x="115" y={py - amp / 2} fill="#F59E0B" fontSize="12" fontWeight="bold">
          Amplitude (A)
        </text>

        {/* Wavelength λ Dimension between two crests */}
        <line x1="105" y1="80" x2="285" y2="80" stroke="#A855F7" strokeWidth="2" markerStart="url(#arrow-purple)" markerEnd="url(#arrow-purple)" />
        <text x="175" y="70" fill="#A855F7" fontSize="13" fontWeight="bold">
          Wavelength (λ)
        </text>
      </g>
    );
  };

  // 9. Moments & Lever
  const renderMomentsLever = () => {
    const lData = diagram.data.lever;
    const py = 220;
    const pivotX = 260;

    return (
      <g>
        {/* Fulcrum / Pivot Triangle */}
        <polygon points={`${pivotX},${py} ${pivotX - 25},${py + 50} ${pivotX + 25},${py + 50}`} fill="#38BDF8" stroke="#60A5FA" strokeWidth="2" />
        <text x={pivotX - 18} y={py + 70} fill="#38BDF8" fontSize="12" fontWeight="bold">
          Pivot
        </text>

        {/* Horizontal Uniform Beam */}
        <rect x="70" y={py - 14} width="460" height="14" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />

        {/* Left Load W1 */}
        <line x1="120" y1={py} x2="120" y2={py + 80} stroke="#EF4444" strokeWidth="3" markerEnd="url(#arrow-red)" />
        <text x="100" y={py + 100} fill="#EF4444" fontSize="12" fontWeight="bold">
          W₁ (Load)
        </text>
        {/* Distance d1 */}
        <line x1="120" y1={py - 30} x2={pivotX} y2={py - 30} stroke="#F59E0B" strokeWidth="1.8" strokeDasharray="3 3" />
        <text x={(120 + pivotX) / 2 - 10} y={py - 36} fill="#F59E0B" fontSize="11" fontWeight="bold">
          d₁
        </text>

        {/* Right Load W2 */}
        <line x1="460" y1={py} x2="460" y2={py + 60} stroke="#22C55E" strokeWidth="3" markerEnd="url(#arrow-green)" />
        <text x="440" y={py + 80} fill="#22C55E" fontSize="12" fontWeight="bold">
          W₂ (Effort)
        </text>
        {/* Distance d2 */}
        <line x1={pivotX} y1={py - 30} x2="460" y2={py - 30} stroke="#F59E0B" strokeWidth="1.8" strokeDasharray="3 3" />
        <text x={(pivotX + 460) / 2 - 10} y={py - 36} fill="#F59E0B" fontSize="11" fontWeight="bold">
          d₂
        </text>

        {/* Principle of Moments formula banner */}
        <g transform="translate(180, 40)">
          <rect width="240" height="40" rx="8" fill="#18181B" stroke="#27272A" />
          <text x="12" y="25" fill="#22C55E" fontSize="12" fontWeight="bold">
            W₁ × d₁ = W₂ × d₂ (Equilibrium)
          </text>
        </g>
      </g>
    );
  };

  // 10. Vectors Parallelogram of Forces
  const renderVectors = () => {
    const vData = diagram.data.vectors;
    const ox = 150;
    const oy = 280;

    // Vector A along horizontal
    const ax = ox + 220;
    const ay = oy;

    // Vector B at angle 50 deg
    const bx = ox + 140;
    const by = oy - 140;

    // Resultant R = Vector A + Vector B
    const rx = ax + (bx - ox);
    const ry = by;

    return (
      <g>
        {/* Vector A */}
        <line x1={ox} y1={oy} x2={ax} y2={ay} stroke="#38BDF8" strokeWidth="3" markerEnd="url(#arrow-cyan)" />
        <text x={ax - 30} y={ay + 22} fill="#38BDF8" fontSize="13" fontWeight="bold">
          Vector A ({vData?.vectorA?.magnitude || '20 N'})
        </text>

        {/* Vector B */}
        <line x1={ox} y1={oy} x2={bx} y2={by} stroke="#F59E0B" strokeWidth="3" markerEnd="url(#arrow-amber)" />
        <text x={bx - 45} y={by - 10} fill="#F59E0B" fontSize="13" fontWeight="bold">
          Vector B ({vData?.vectorB?.magnitude || '15 N'})
        </text>

        {/* Parallelogram dotted lines */}
        <line x1={ax} y1={ay} x2={rx} y2={ry} stroke="#64748B" strokeWidth="1.8" strokeDasharray="4 4" />
        <line x1={bx} y1={by} x2={rx} y2={ry} stroke="#64748B" strokeWidth="1.8" strokeDasharray="4 4" />

        {/* Resultant Vector R (Diagonal) */}
        <line x1={ox} y1={oy} x2={rx} y2={ry} stroke="#22C55E" strokeWidth="3.5" markerEnd="url(#arrow-green)" />
        <text x={rx + 10} y={ry + 5} fill="#22C55E" fontSize="13" fontWeight="bold">
          Resultant R ({vData?.resultant?.magnitude || '32 N'})
        </text>

        {/* Angle θ Arc */}
        <path d={`M ${ox + 45} ${oy} A 45 45 0 0 0 ${ox + 35} ${oy - 28}`} fill="none" stroke="#F59E0B" strokeWidth="2" />
        <text x={ox + 50} y={oy - 10} fill="#F59E0B" fontSize="12" fontWeight="bold">
          θ = {vData?.angleBetweenDeg || '50'}°
        </text>
      </g>
    );
  };

  return (
    <div
      className={`bg-[#0A0A0E] border border-[#27272A] rounded-2xl overflow-hidden shadow-xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 flex flex-col bg-[#0A0A0E]/95 backdrop-blur-xl' : ''
      } ${className}`}
    >
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#121217] border-b border-[#27272A] gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            {diagram.title}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-semibold">
            {diagram.topic}
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            title={showLabels ? 'Hide Measurements' : 'Show Measurements'}
            className="p-1.5 rounded-lg bg-[#18181F] hover:bg-[#27272A] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            {showLabels ? <Eye className="w-4 h-4 text-[#22C55E]" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg bg-[#18181F] hover:bg-[#27272A] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg bg-[#18181F] hover:bg-[#27272A] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="p-1.5 rounded-lg bg-[#18181F] hover:bg-[#27272A] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            title="Export Clean Vector SVG"
            className="p-1.5 rounded-lg bg-[#18181F] hover:bg-[#27272A] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-lg bg-[#18181F] hover:bg-[#27272A] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full flex-1 min-h-[260px] max-h-[460px] flex items-center justify-center p-2 overflow-hidden bg-[#0A0A0E]">
        <svg
          ref={svgRef}
          viewBox="0 0 600 380"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto max-h-[420px] transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Arrowhead Markers */}
          <defs>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#22C55E" />
            </marker>
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
            </marker>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#A855F7" />
            </marker>
          </defs>

          {/* Grid Background Pattern */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#161620" strokeWidth="0.8" />
          </pattern>
          <rect width="600" height="380" fill="url(#grid)" />

          {/* Render Active Diagram */}
          {renderDiagramContent()}
        </svg>
      </div>

      {/* Caption & Mathematical Notes */}
      {diagram.caption && (
        <div className="px-4 py-2.5 bg-[#121217] border-t border-[#27272A] flex items-center justify-between text-xs text-[#94A3B8]">
          <div className="flex items-center space-x-2">
            <Info className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>{diagram.caption}</span>
          </div>
          <span className="text-[10px] text-[#22C55E] font-mono font-semibold">
            Vector Diagram Verified
          </span>
        </div>
      )}
    </div>
  );
};
