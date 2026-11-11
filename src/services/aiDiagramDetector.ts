import { StepSolution, ScientificDiagramData } from '../types';

/**
 * Intelligent Diagram Detector & Procedural Synthesizer
 * Analyzes question context, given values, formulas, and steps to determine
 * whether a visual diagram is required, and constructs an accurate SVG data model.
 */
export function detectAndGenerateDiagram(
  solution: StepSolution,
  promptText?: string
): ScientificDiagramData | null {
  // If solution already has a complete diagram, retain it
  if (solution.diagram) {
    return solution.diagram;
  }

  const combined = `
    ${solution.title || ''}
    ${solution.subCategory || ''}
    ${solution.category || ''}
    ${solution.problemStatement || ''}
    ${solution.formula || ''}
    ${solution.substitution || ''}
    ${(solution.steps || []).join(' ')}
    ${(solution.givenValues || []).map((g) => `${g.name} ${g.symbol} ${g.value}`).join(' ')}
    ${promptText || ''}
  `.toLowerCase();

  // Extract common numbers
  const extractNumber = (pattern: RegExp, defaultValue: number): number => {
    const match = combined.match(pattern);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (!isNaN(val)) return val;
    }
    return defaultValue;
  };

  // 1. CIRCLE GEOMETRY (Tangents, Secants, Chords, Cyclic Quadrilateral)
  if (
    /circle|tangent|secant|chord|circumference|inscribed|cyclic|subtended|radius|diameter|arc\b/i.test(
      combined
    ) &&
    !/kinematics|velocity|circuit/i.test(combined)
  ) {
    return {
      id: `circle_${Date.now()}`,
      type: 'circle_geometry',
      title: 'Circle Geometry & Tangent Theorems',
      topic: 'Circle Theorems',
      caption: 'Secant AEC intersecting circle; AF is tangent; chords forming inscribed cyclic relations.',
      data: {
        circle: {
          centerLabel: 'O',
          radius: 110,
          tangents: [
            { from: 'A', pointOfContact: 'B', to: 'F', label: 'AF (Tangent)' },
          ],
          secants: [
            { from: 'A', through: ['E', 'C'], label: 'AEC (Secant)' },
          ],
          chords: [
            { from: 'E', to: 'C' },
            { from: 'E', to: 'D' },
            { from: 'D', to: 'C' },
            { from: 'E', to: 'B' },
          ],
          theoremsApplied: [
            'Tangent-Secant Theorem: AB² = AE · AC',
            'Angles in the same segment are equal',
            'Radius is perpendicular to tangent at contact point',
          ],
        },
      },
    };
  }

  // 2. INCLINED PLANE & FORCES (Ramp, slope, friction, mass)
  if (
    /inclined\s*plane|incline|ramp|slope|angle of inclination|mass on a slope|sliding down|sliding up|coefficient of friction|pulling up|pulling down/i.test(
      combined
    )
  ) {
    const angleDeg = extractNumber(/(?:angle|inclined at|incline of)\s*([0-9.]+)\s*(?:deg|°)?/i, 30);
    const massKg = extractNumber(/(?:mass|block of)\s*([0-9.]+)\s*kg/i, 5);
    const mu = extractNumber(/(?:mu|coefficient of friction|μ)\s*=?\s*([0-9.]+)/i, 0.25);
    const g = 9.8;
    const rad = (angleDeg * Math.PI) / 180;
    const weightN = Math.round(massKg * g * 10) / 10;
    const normalForceN = Math.round(weightN * Math.cos(rad) * 10) / 10;
    const mgCosN = normalForceN;
    const mgSinN = Math.round(weightN * Math.sin(rad) * 10) / 10;
    const frictionN = Math.round(mu * normalForceN * 10) / 10;

    return {
      id: `incline_${Date.now()}`,
      type: 'inclined_plane',
      title: `Forces on Inclined Plane (${angleDeg}°)`,
      topic: "Newton's Laws & Friction",
      caption: `Free-body resolution: Weight W = mg resolved into mg sin(${angleDeg}°) along incline and mg cos(${angleDeg}°) perpendicular to incline.`,
      data: {
        inclinedPlane: {
          angleDeg,
          massKg,
          weightN,
          normalForceN,
          mgSinN,
          mgCosN,
          frictionN,
          coefficientOfFriction: mu,
          motionDirection: 'down',
          showComponents: true,
        },
      },
    };
  }

  // 3. OPTICS & RAY DIAGRAMS (Mirror, lens, focal length, image formation)
  if (
    /optics|mirror|concave mirror|convex mirror|convex lens|concave lens|focal length|ray diagram|object placed at|real image|virtual image|magnification/i.test(
      combined
    )
  ) {
    const isLens = /lens|refraction/i.test(combined);
    const isConvex = /convex/i.test(combined);
    const f = extractNumber(/focal length(?: of)?\s*([0-9.]+)\s*cm/i, 15);
    const u = extractNumber(/object(?: distance| placed at)?\s*([0-9.]+)\s*cm/i, 25);
    const ho = extractNumber(/height of object|object of height\s*([0-9.]+)\s*cm/i, 5);

    let opticType: 'concave_mirror' | 'convex_mirror' | 'convex_lens' | 'concave_lens' = 'concave_mirror';
    if (isLens) {
      opticType = isConvex ? 'convex_lens' : 'concave_lens';
    } else {
      opticType = isConvex ? 'convex_mirror' : 'concave_mirror';
    }

    const v = u !== f ? Math.round(((f * u) / (u - f)) * 10) / 10 : 999;
    const isVirtual = u < f;

    return {
      id: `optics_${Date.now()}`,
      type: 'optics_ray',
      title: `${opticType.replace('_', ' ').toUpperCase()} Ray Tracing`,
      topic: 'Geometric Optics',
      caption: `Ray diagram: 1/f = 1/v + 1/u. Object at ${u}cm (f = ${f}cm) yields ${isVirtual ? 'virtual upright' : 'real inverted'} image at v = ${Math.abs(v)}cm.`,
      data: {
        optics: {
          opticType,
          focalLengthCm: f,
          objectDistanceCm: u,
          objectHeightCm: ho,
          imageDistanceCm: Math.abs(v),
          imageNature: isVirtual ? 'Virtual & Upright' : 'Real & Inverted',
          showRays: true,
        },
      },
    };
  }

  // 4. BEARINGS & NAVIGATION (Compass, true bearing from north, elevation, depression)
  if (
    /bearing|due north|due south|due east|due west|degrees from north|back bearing|angle of elevation|angle of depression|top of a cliff|lighthouse/i.test(
      combined
    )
  ) {
    const bearingDeg = extractNumber(/(?:bearing of|bearing)\s*([0-9]{1,3})/i, 60);
    const distanceKm = extractNumber(/(?:distance of|travels|moves)\s*([0-9.]+)\s*(?:km|m|miles)/i, 120);

    return {
      id: `bearing_${Date.now()}`,
      type: 'bearing_trig',
      title: `Bearing & Compass Navigation (${String(bearingDeg).padStart(3, '0')}°)`,
      topic: 'Trigonometry & Bearings',
      caption: `3-figure bearing of ${String(bearingDeg).padStart(3, '0')}° measured clockwise from True North.`,
      data: {
        bearing: {
          originLabel: 'A',
          destinationLabel: 'B',
          bearingDeg,
          distanceKm,
        },
      },
    };
  }

  // 5. TRIANGLES & TRIGONOMETRY (Right-angled triangle, Pythagoras, hypotenuse)
  if (
    /right-angled triangle|hypotenuse|adjacent|opposite side|soh cah toa|pythagoras|sine rule|cosine rule|height and distance/i.test(
      combined
    ) &&
    !/circle|sphere/i.test(combined)
  ) {
    return {
      id: `trig_${Date.now()}`,
      type: 'triangle_trig',
      title: 'Right-Angled Triangle Trigonometry',
      topic: 'Trigonometry',
      caption: 'Trigonometric ratios: sin θ = Opp/Hyp, cos θ = Adj/Hyp, tan θ = Opp/Adj.',
      data: {
        triangle: {
          vertices: ['A', 'B', 'C'],
          isRightAngled: true,
          rightAngleVertex: 'A',
          opposite: 'h (Opposite)',
          adjacent: 'b (Base/Adjacent)',
          hypotenuse: 'c (Hypotenuse)',
        },
      },
    };
  }

  // 6. ELECTRIC CIRCUITS (Ohm's law, resistors in series/parallel)
  if (
    /circuit|resistor|resistance|in series|in parallel|ammeter|voltmeter|cell of emf|potential difference|ohm's law|current flowing/i.test(
      combined
    )
  ) {
    const v = extractNumber(/(?:emf of|voltage of|pd of|potential difference of)\s*([0-9.]+)\s*v/i, 12);
    const r = extractNumber(/(?:resistance of|resistor of)\s*([0-9.]+)\s*(?:ohm|Ω)/i, 4);
    const currentA = Math.round((v / r) * 10) / 10;

    return {
      id: `circuit_${Date.now()}`,
      type: 'circuit',
      title: "DC Electric Circuit & Ohm's Law",
      topic: 'Current Electricity',
      caption: `Ohm's Law: V = IR. Source: ${v}V, Total Resistance: ${r}Ω, Resulting Current: I = ${currentA}A.`,
      data: {
        circuit: {
          voltageV: v,
          totalResistanceOhm: r,
          currentA,
          circuitType: 'simple',
          components: [
            { id: 'cell1', type: 'cell', label: `${v}V Cell`, position: 'left' },
            { id: 'r1', type: 'resistor', label: `${r}Ω Resistor`, position: 'right' },
            { id: 'a1', type: 'ammeter', label: 'Ammeter', position: 'bottom' },
            { id: 'sw1', type: 'switch', label: 'Switch', position: 'top' },
          ],
        },
      },
    };
  }

  // 7. WAVES (Transverse wave, wavelength, amplitude, crest, trough)
  if (/wave|wavelength|transverse wave|frequency of wave|amplitude of|speed of wave|v = f\s*\\lambda/i.test(combined)) {
    const amp = extractNumber(/amplitude(?: of)?\s*([0-9.]+)\s*(?:m|cm)/i, 2);
    const wavelength = extractNumber(/wavelength(?: of)?\s*([0-9.]+)\s*(?:m|cm)/i, 4);

    return {
      id: `wave_${Date.now()}`,
      type: 'wave',
      title: 'Transverse Wave Structure',
      topic: 'Waves & Oscillations',
      caption: 'Wave anatomy: Crest, Trough, Amplitude (A), and Wavelength (λ). Fundamental equation: v = fλ.',
      data: {
        wave: {
          waveType: 'transverse',
          amplitude: amp,
          wavelength,
          crestLabel: 'Crest',
          troughLabel: 'Trough',
          wavelengthLabel: 'Wavelength (λ)',
          amplitudeLabel: 'Amplitude (A)',
        },
      },
    };
  }

  // 8. MOMENTS & LEVERS (Balanced beam, pivot, fulcrum, clockwise moment)
  if (/lever|pivot|fulcrum|moment of a force|principle of moments|balanced horizontally|knife edge/i.test(combined)) {
    return {
      id: `lever_${Date.now()}`,
      type: 'moments_lever',
      title: 'Principle of Moments & Lever Equilibrium',
      topic: 'Rotational Equilibrium',
      caption: 'Sum of clockwise moments = Sum of counter-clockwise moments about the pivot.',
      data: {
        lever: {
          lengthM: 2.0,
          pivotPosM: 0.8,
          leftLoads: [{ forceN: 30, distanceM: 0.6, label: 'W₁' }],
          rightLoads: [{ forceN: 15, distanceM: 1.2, label: 'W₂' }],
          isEquilibrium: true,
        },
      },
    };
  }

  // 9. VECTORS & PARALLELOGRAM OF FORCES
  if (
    /vector|resultant force|two forces of|acting at an angle of|parallelogram of forces|triangle of forces/i.test(
      combined
    ) &&
    !/kinematics/i.test(combined)
  ) {
    const angleBetween = extractNumber(/(?:at an angle of|angle between)\s*([0-9.]+)\s*(?:deg|°)?/i, 60);

    return {
      id: `vectors_${Date.now()}`,
      type: 'vectors',
      title: 'Parallelogram of Forces & Vector Resolution',
      topic: 'Vectors & Statics',
      caption: 'Resultant R² = A² + B² + 2AB cos(θ). The diagonal represents the net resultant vector.',
      data: {
        vectors: {
          vectorA: { name: 'F₁', magnitude: 20, angleDeg: 0 },
          vectorB: { name: 'F₂', magnitude: 15, angleDeg: angleBetween },
          angleBetweenDeg: angleBetween,
        },
      },
    };
  }

  // 10. GENERAL FREE BODY DIAGRAM (Multiple forces acting on a body)
  if (/free body|fbd|normal reaction|forces acting on a body|equilibrium of forces|tension in string/i.test(combined)) {
    return {
      id: `fbd_${Date.now()}`,
      type: 'free_body_diagram',
      title: 'Free Body Diagram (FBD)',
      topic: "Newton's Laws & Statics",
      caption: 'Coplanar force resolution: Normal reaction, gravity, applied force, and friction.',
      data: {
        freeBody: {
          bodyLabel: 'm',
          massKg: 5,
          forces: [
            { name: 'Normal (N)', value: '49 N', directionDeg: 90, color: '#22C55E' },
            { name: 'Gravity (W)', value: '49 N', directionDeg: 270, color: '#EF4444' },
            { name: 'Applied (F)', value: '30 N', directionDeg: 0, color: '#38BDF8' },
            { name: 'Friction (f)', value: '15 N', directionDeg: 180, color: '#F59E0B' },
          ],
        },
      },
    };
  }

  return null;
}
