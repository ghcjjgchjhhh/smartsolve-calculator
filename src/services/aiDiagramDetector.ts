import { StepSolution, ScientificDiagramData, ScientificDiagramType } from '../types';

/**
 * Intelligent Diagram Detector & Procedural Synthesizer
 *
 * Strictly ensures diagrams are ONLY generated when the problem genuinely involves
 * physical or geometric concepts that benefit from an accurate diagram (e.g. forces/FBD,
 * inclined planes, vectors/parallelogram of forces, levers/moments, electric circuits,
 * geometric optics, circle theorems, triangles, bearings, or mechanical waves).
 *
 * Never triggers on incidental words in chemistry, pure algebra, calculus, matrices, or text steps.
 */
export function detectAndGenerateDiagram(
  solution: StepSolution,
  promptText?: string
): ScientificDiagramData | null {
  // Primary semantic scope: focus on the actual question being asked, not arbitrary filler words in steps
  const primaryParts = [
    promptText,
    solution.problemStatement,
    solution.title,
    solution.whatIsRequired,
    solution.subCategory,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const questionScope = (
    primaryParts.length >= 6
      ? primaryParts
      : `${primaryParts} ${(solution.steps || []).slice(0, 3).join(' ')}`
  ).toLowerCase();

  // Secondary scope for extracting numeric parameters after diagram intent is confirmed
  const valueScope = [
    promptText,
    solution.problemStatement,
    solution.title,
    (solution.givenValues || []).map((g) => `${g.name} ${g.symbol} = ${g.value} ${g.unit || ''}`).join(' '),
    solution.finalAnswer,
    solution.formula,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const extractNumber = (pattern: RegExp, defaultValue: number, text = valueScope): number => {
    const match = text.match(pattern);
    if (match) {
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          const val = parseFloat(match[i]);
          if (Number.isFinite(val)) return val;
        }
      }
    }
    return defaultValue;
  };

  const extractOptionalNumber = (pattern: RegExp, text = valueScope): number | null => {
    const match = text.match(pattern);
    if (match) {
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          const val = parseFloat(match[i]);
          if (Number.isFinite(val)) return val;
        }
      }
    }
    return null;
  };

  // 0a. EXPLICIT GRAPH DISAMBIGUATION:
  // If the question is explicitly a graph/plotting/kinematics-curve question, do NOT draw a static diagram.
  const isExplicitGraph =
    /\b(velocity-time|displacement-time|acceleration-time|speed-time|distance-time|v-t\s+graph|s-t\s+graph|a-t\s+graph|plot\s+the\s+graph|draw\s+(?:the\s+)?graph|sketch\s+(?:the\s+)?graph|cartesian|x-axis|y-axis|curve\s+tracing)\b/i.test(
      questionScope
    ) ||
    (/\b(y\s*=|f\(x\)\s*=)\b/i.test(questionScope) && /\b(graph|plot|sketch|vertex|parabola)\b/i.test(questionScope));

  if (isExplicitGraph) {
    return null;
  }

  // 0b. NON-DIAGRAM DOMAIN EXCLUSIONS:
  // Pure chemistry, pure symbolic algebra/matrices/calculus/statistics, or scalar nuclear/thermal/quantum physics.
  const isChemistrySubject =
    /\bchemistry\b/i.test(solution.category || '') ||
    /\b(molarity|molality|stoichiometry|enthalpy|entropy|gibbs\s+free|titration|molar\s+mass|avogadro|ideal\s+gas|boyle|charles|equilibrium\s+constant|electrolysis|faraday|galvanic|reduction\s+potential|half[\s-]reaction|enantiomer|stereoisomer|mirror\s+image|hybridization|electron\s+configuration|quantum\s+number|esterification|precipitate|qualitative\s+analysis|hydrocarbon|alkane|alkene|carboxylic|dipole\s+moment)\b/i.test(
      questionScope
    );

  const isPureNonGeometricMath =
    /\b(eigenvalue|eigenvector|determinant|gaussian\s+elimination|matrix|matrices|vector\s+space|linear\s+independence|dot\s+product|cross\s+product|scalar\s+product|quadratic\s+equation|quadratic\s+formula|factoriz|factoris|logarithm|exponential|derivative|differentiat|antiderivative|definite\s+integral|indefinite\s+integral|taylor\s+series|maclaurin|fourier\s+series|arithmetic\s+progression|geometric\s+progression|binomial\s+theorem|permutation|combination|probability|standard\s+deviation|variance|simultaneous\s+equations|partial\s+fraction|modular\s+arithmetic|complex\s+number)\b/i.test(
      questionScope
    );

  const isNonDiagramPhysics =
    /\b(photoelectric|work\s+function|stopping\s+potential|de\s+broglie|wave\s+function|schrodinger|half[\s-]life|radioactive|nuclear\s+fission|nuclear\s+fusion|specific\s+heat|latent\s+heat|calorimetry|thermal\s+expansion|step[\s-]down\s+transformer|step[\s-]up\s+transformer|universal\s+gravitation|coulomb(?:'s)?\s+law|electrostatic\s+force\s+between\s+two\s+charges)\b/i.test(
      questionScope
    );

  if (isChemistrySubject || isPureNonGeometricMath || isNonDiagramPhysics) {
    return null;
  }

  // Check if an already-attached diagram is genuinely valid for this question
  const hasValidExistingData = (diag: ScientificDiagramData | undefined): boolean => {
    if (!diag || !diag.type || !diag.data) return false;
    switch (diag.type) {
      case 'circle_geometry':
        return Boolean(diag.data.circle);
      case 'inclined_plane':
        return Boolean(diag.data.inclinedPlane);
      case 'free_body_diagram':
        return Boolean(diag.data.freeBody && Array.isArray(diag.data.freeBody.forces) && diag.data.freeBody.forces.length > 0);
      case 'optics_ray':
        return Boolean(diag.data.optics);
      case 'bearing_trig':
        return Boolean(diag.data.bearing);
      case 'triangle_trig':
        return Boolean(diag.data.triangle);
      case 'circuit':
        return Boolean(diag.data.circuit);
      case 'wave':
        return Boolean(diag.data.wave);
      case 'moments_lever':
        return Boolean(diag.data.lever);
      case 'vectors':
        return Boolean(diag.data.vectors);
      default:
        return false;
    }
  };

  let detectedDiagram: ScientificDiagramData | null = null;

  // 1. CIRCLE GEOMETRY (Chords, tangents, secants, cyclic quadrilaterals, circle theorems)
  const isCircleGeometry =
    (/\b(circle|circles)\b/i.test(questionScope) &&
      /\b(theorem|chord|chords|secant|secants|tangent\s+to\s+(?:the|a)\s+circle|tangents?\s+(?:from|at)|cyclic|inscribed|subtend|subtends|subtended|circumference|angle\s+at\s+(?:the\s+)?cent(?:er|re)|point\s+of\s+contact|alternate\s+segment|perpendicular\s+distance)\b/i.test(
        questionScope
      ) &&
      !/\b(x\^2\s*\+\s*y\^2|x²\s*\+\s*y²|equation\s+of\s+(?:the|a)\s+circle)\b/i.test(questionScope)) ||
    /\b(circle\s+theorems?|circle\s+geometry|cyclic\s+quadrilateral|tangent[\s-]secant)\b/i.test(questionScope);

  if (isCircleGeometry) {
    const isChordPerpendicular =
      /\b(chord|chords)\b/i.test(questionScope) &&
      /\b(perpendicular|distance|bisect|bisects|cent(?:re|er)|length\s+of\s+(?:the\s+)?chord)\b/i.test(
        questionScope
      );

    if (isChordPerpendicular) {
      const r = extractNumber(/(?:radius(?:\s+of)?|r\s*=)\s*([0-9.]+)\s*(?:cm|m)?/i, 14);
      const chordL = extractNumber(
        /(?:chord(?:\s+[a-z]{1,2})?(?:\s+of|\s+is|\s+has\s+length)?|length(?:\s+of)?)\s*([0-9.]+)\s*(?:cm|m)?/i,
        20
      );
      const halfL = chordL / 2;
      const d = r > halfL ? Math.round(Math.sqrt(r * r - halfL * halfL) * 100) / 100 : 0;

      detectedDiagram = {
        id: `circle_chord_${Date.now()}`,
        type: 'circle_geometry',
        title: `Circle Chord & Perpendicular Distance (r = ${r} cm, AB = ${chordL} cm)`,
        topic: 'Circle Theorems & Chords',
        caption: `Perpendicular from centre O bisects chord AB at M. By Pythagoras: d = √(${r}² - ${halfL}²) = ${d} cm.`,
        data: {
          circle: {
            subtype: 'chord_distance',
            centerLabel: 'O',
            radius: r,
            chordDistance: {
              radius: r,
              chordLength: chordL,
              perpendicularDistance: d,
              chordLabel: 'AB',
              midpointLabel: 'M',
              centerLabel: 'O',
              unit: 'cm',
            },
            theoremsApplied: [
              `The perpendicular from the centre of a circle to a chord bisects the chord (AM = MB = ${halfL} cm).`,
              `Pythagorean theorem in △OMA: OA² = OM² + AM² ⇒ d = √(${r}² - ${halfL}²) = ${d} cm.`,
            ],
          },
        },
      };
    } else {
      detectedDiagram = {
        id: `circle_${Date.now()}`,
        type: 'circle_geometry',
        title: 'Circle Geometry & Tangent Theorems',
        topic: 'Circle Theorems',
        caption: 'Circle geometry illustrating chord, secant, tangent, and inscribed angle relationships.',
        data: {
          circle: {
            subtype: 'tangent_secant',
            centerLabel: 'O',
            radius: 110,
            tangents: [{ from: 'A', pointOfContact: 'B', to: 'F', label: 'AF (Tangent)' }],
            secants: [{ from: 'A', through: ['E', 'C'], label: 'AEC (Secant)' }],
            chords: [
              { from: 'E', to: 'C' },
              { from: 'E', to: 'D' },
              { from: 'D', to: 'C' },
              { from: 'E', to: 'B' },
            ],
            theoremsApplied: [
              'Tangent-Secant Theorem: AB² = AE · AC',
              'Angles in the same segment are equal',
              'Radius is perpendicular to tangent at point of contact',
            ],
          },
        },
      };
    }
  }

  // 2. INCLINED PLANE & FORCES ON A RAMP
  if (
    !detectedDiagram &&
    /\b(inclined\s*plane|(?:rough|smooth|frictionless)\s+incline|incline\s+of\s+[0-9]|angle\s+of\s+inclination|inclined\s+at\s+[0-9]|on\s+(?:an?|the)\s+incline|on\s+(?:a|the)\s+ramp|(?:up|down)\s+(?:a|the)\s+(?:ramp|incline)|plane\s+inclined\s+at)\b/i.test(
      questionScope
    )
  ) {
    const angleDeg = extractNumber(/(?:inclined\s+at|incline\s+of|angle(?:\s+of\s+inclination)?(?:\s+is|\s+of|=)?)\s*([0-9.]+)\s*(?:deg|degrees?|°)?/i, 30);
    const g = /\bg\s*=\s*10(?:\.0+)?\b/i.test(valueScope) ? 10 : 9.8;
    const explicitWeightN = extractOptionalNumber(/\bweight(?:\s+of|\s*=|\s+is)?\s*([0-9.]+)\s*n\b/i);
    const massKg =
      extractOptionalNumber(/(?:mass(?:\s+of)?|block\s+of|body\s+of|box\s+of)\s*([0-9.]+)\s*kg\b/i) ??
      extractOptionalNumber(/\b([0-9.]+)\s*kg\b/i) ??
      (explicitWeightN !== null ? Math.round((explicitWeightN / g) * 100) / 100 : 5);
    const mu =
      /\bsmooth|frictionless\b/i.test(questionScope)
        ? 0
        : extractNumber(/(?:coefficient\s+of\s+(?:static\s+|kinetic\s+)?friction|μ|mu)\s*(?:is|=|of)?\s*([0-9.]+)/i, 0.25);

    const rad = (angleDeg * Math.PI) / 180;
    const weightN = explicitWeightN ?? Math.round(massKg * g * 10) / 10;
    const normalForceN = Math.round(weightN * Math.cos(rad) * 10) / 10;
    const mgCosN = normalForceN;
    const mgSinN = Math.round(weightN * Math.sin(rad) * 10) / 10;
    const frictionN = Math.round(mu * normalForceN * 10) / 10;
    const appliedForceN = extractOptionalNumber(/(?:applied\s+force|pull(?:ed|ing)?\s+(?:up|with)|tension|force\s+of)\s*([0-9.]+)\s*n\b/i) ?? undefined;
    const motionDirection = /\b(pull(?:ed|ing)?\s+up|push(?:ed|ing)?\s+up|sliding\s+up|moving\s+up)\b/i.test(questionScope)
      ? 'up'
      : 'down';

    detectedDiagram = {
      id: `incline_${Date.now()}`,
      type: 'inclined_plane',
      title: `Forces on Inclined Plane (${angleDeg}°)`,
      topic: "Newton's Laws & Inclined Plane",
      caption: `Free-body resolution on ${angleDeg}° incline: W = ${weightN} N, Normal R = ${normalForceN} N, mg sin θ = ${mgSinN} N${mu > 0 ? `, Friction f = ${frictionN} N` : ' (Smooth plane)'}.`,
      data: {
        inclinedPlane: {
          angleDeg,
          massKg,
          weightN,
          normalForceN,
          mgSinN,
          mgCosN,
          frictionN,
          appliedForceN,
          coefficientOfFriction: mu,
          motionDirection,
          showComponents: true,
        },
      },
    };
  }

  // 3. OPTICS & RAY DIAGRAMS
  if (
    !detectedDiagram &&
    /\b(concave\s+mirror|convex\s+mirror|spherical\s+mirror|converging\s+lens|diverging\s+lens|convex\s+lens|concave\s+lens|focal\s+length|ray\s+diagram|principal\s+focus|cent(?:er|re)\s+of\s+curvature|lens\s+formula|mirror\s+formula|magnification\s+of\s+(?:the\s+)?(?:lens|mirror))\b/i.test(
      questionScope
    )
  ) {
    const isLens = /\b(lens|converging\s+lens|diverging\s+lens)\b/i.test(questionScope);
    const isConvex = /\b(convex|converging)\b/i.test(questionScope);
    const f = extractNumber(/focal\s+length(?:\s+of|\s+is|=)?\s*([0-9.]+)\s*cm/i, 15);
    const u = extractNumber(/object(?:\s+distance|\s+placed\s+at|\s+is\s+at)?\s*([0-9.]+)\s*cm/i, 25);
    const ho = extractNumber(/(?:height\s+of\s+object|object\s+of\s+height)\s*([0-9.]+)\s*cm/i, 5);

    let opticType: 'concave_mirror' | 'convex_mirror' | 'convex_lens' | 'concave_lens' = 'concave_mirror';
    if (isLens) {
      opticType = isConvex ? 'convex_lens' : 'concave_lens';
    } else {
      opticType = isConvex ? 'convex_mirror' : 'concave_mirror';
    }

    const v = u !== f ? Math.round(((f * u) / (u - f)) * 10) / 10 : 999;
    const isVirtual = u < f || opticType === 'convex_mirror' || opticType === 'concave_lens';

    detectedDiagram = {
      id: `optics_${Date.now()}`,
      type: 'optics_ray',
      title: `${opticType.replace('_', ' ').toUpperCase()} Ray Diagram`,
      topic: 'Geometric Optics',
      caption: `${isLens ? 'Lens' : 'Mirror'} ray diagram: f = ${f} cm, object distance u = ${u} cm, image distance |v| = ${Math.abs(v)} cm.`,
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

  // 4. BEARINGS & NAVIGATION
  if (
    !detectedDiagram &&
    /\b(true\s+bearing|compass\s+bearing|back\s+bearing|three-figure\s+bearing|3-figure\s+bearing|bearing\s+of\s+[a-z0-9]|degrees?\s+(?:clockwise\s+)?from\s+(?:true\s+)?north|due\s+(?:north|south)\b.*\bdue\s+(?:east|west)|angle\s+of\s+(?:elevation|depression))\b/i.test(
      questionScope
    ) &&
    !/\bball\s+bearing\b/i.test(questionScope)
  ) {
    const bearingDeg = extractNumber(/(?:bearing(?:\s+of)?|from\s+north(?:\s+of)?)\s*([0-9]{1,3})/i, 60);
    const distanceKm = extractNumber(/(?:distance(?:\s+of)?|sails?|travels?|walks?|flies?)\s*([0-9.]+)\s*(?:km|m|miles)/i, 120);

    detectedDiagram = {
      id: `bearing_${Date.now()}`,
      type: 'bearing_trig',
      title: `Bearing & Navigation (${String(bearingDeg).padStart(3, '0')}°)`,
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

  // 5. TRIANGLES & GEOMETRIC TRIGONOMETRY
  if (
    !detectedDiagram &&
    /\b(right-angled\s+triangle|right\s+triangle|hypotenuse|soh\s*cah\s*toa|pythagoras(?:'s)?\s+theorem|pythagorean\s+theorem|sine\s+rule|cosine\s+rule|law\s+of\s+sines|law\s+of\s+cosines|(?:sides?|angles?)\s+of\s+(?:a|an|the)\s+triangle|isosceles\s+triangle|equilateral\s+triangle)\b/i.test(
      questionScope
    ) &&
    !/\b(circle|sphere|inclined\s*plane)\b/i.test(questionScope)
  ) {
    const opp = extractOptionalNumber(/\bopposite\s*(?:side)?\s*(?:is|=|of)?\s*([0-9.]+)\s*(?:cm|m)?\b/i);
    const adj = extractOptionalNumber(/\b(?:adjacent|base)\s*(?:side)?\s*(?:is|=|of)?\s*([0-9.]+)\s*(?:cm|m)?\b/i);
    const hyp = extractOptionalNumber(/\bhypotenuse\s*(?:is|=|of)?\s*([0-9.]+)\s*(?:cm|m)?\b/i);

    detectedDiagram = {
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
          opposite: opp !== null ? `${opp}` : 'Opp',
          adjacent: adj !== null ? `${adj}` : 'Adj',
          hypotenuse: hyp !== null ? `${hyp}` : 'Hyp',
        },
      },
    };
  }

  // 6. ELECTRIC CIRCUITS
  if (
    !detectedDiagram &&
    /\b(electric(?:al)?\s+circuit|ohm'?s\s+law|resistors?\s+in\s+(?:series|parallel)|(?:series|parallel)\s+circuit|cell\s+of\s+emf|internal\s+resistance|ammeter|voltmeter|resistor\s+of\s+[0-9.]+\s*(?:ohm|Ω)|potential\s+difference\s+(?:across|of).*(?:resistor|ohm|Ω))\b/i.test(
      questionScope
    ) &&
    !/\b(air\s+resistance|taylor\s+series|maclaurin|fourier|parallel\s+lines)\b/i.test(questionScope)
  ) {
    const vOpt = extractOptionalNumber(/(?:emf(?:\s+of)?|voltage(?:\s+of)?|pd(?:\s+of)?|potential\s+difference(?:\s+of)?|battery(?:\s+of)?)\s*([0-9.]+)\s*v\b/i)
      ?? extractOptionalNumber(/\b([0-9.]+)\s*v(?:\s+(?:cell|battery|supply|source))\b/i);
    const rOpt = extractOptionalNumber(/(?:resistance(?:\s+of)?|resistor(?:\s+of)?)\s*([0-9.]+)\s*(?:ohm|ohms|Ω)\b/i)
      ?? extractOptionalNumber(/\b([0-9.]+)\s*(?:ohm|ohms|Ω)\s*resistor\b/i);
    const iOpt = extractOptionalNumber(/(?:current(?:\s+of)?)\s*([0-9.]+)\s*a\b/i)
      ?? extractOptionalNumber(/\b([0-9.]+)\s*a(?:mp(?:ere)?s?)?\s*(?:current|flows)\b/i);

    let v = vOpt ?? 12;
    let r = rOpt ?? 4;
    let currentA = iOpt ?? Math.round((v / (r || 1)) * 100) / 100;
    if (vOpt !== null && iOpt !== null && rOpt === null && iOpt > 0) {
      r = Math.round((vOpt / iOpt) * 100) / 100;
    } else if (iOpt !== null && rOpt !== null && vOpt === null) {
      v = Math.round(iOpt * rOpt * 100) / 100;
    }

    const circuitType = /\bparallel\b/i.test(questionScope)
      ? 'parallel'
      : /\bseries\b/i.test(questionScope)
      ? 'series'
      : 'simple';

    detectedDiagram = {
      id: `circuit_${Date.now()}`,
      type: 'circuit',
      title: `DC Electric Circuit (${circuitType.toUpperCase()})`,
      topic: 'Current Electricity',
      caption: `Ohm's Law: V = IR. Source: ${v} V, Resistance: ${r} Ω, Current: ${currentA} A.`,
      data: {
        circuit: {
          voltageV: v,
          totalResistanceOhm: r,
          currentA,
          circuitType,
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

  // 7. MECHANICAL WAVES (Only when wave diagram/anatomy/amplitude+wavelength applies)
  if (
    !detectedDiagram &&
    /\b(transverse\s+wave|longitudinal\s+wave|progressive\s+wave|standing\s+wave|crest\s+and\s+trough|wave\s+diagram|wave\s+profile|sinusoidal\s+wave)\b/i.test(
      questionScope
    )
  ) {
    const amp = extractNumber(/amplitude(?:\s+of|\s+is|=)?\s*([0-9.]+)\s*(?:m|cm)/i, 2);
    const wavelength = extractNumber(/wavelength(?:\s+of|\s+is|=)?\s*([0-9.]+)\s*(?:m|cm)/i, 4);

    detectedDiagram = {
      id: `wave_${Date.now()}`,
      type: 'wave',
      title: 'Transverse Wave Diagram',
      topic: 'Waves & Oscillations',
      caption: `Wave anatomy: Amplitude A = ${amp} m, Wavelength λ = ${wavelength} m (v = fλ).`,
      data: {
        wave: {
          waveType: 'transverse',
          amplitude: amp,
          wavelength,
          crestLabel: 'Crest',
          troughLabel: 'Trough',
          wavelengthLabel: `λ = ${wavelength} m`,
          amplitudeLabel: `A = ${amp} m`,
        },
      },
    };
  }

  // 8. MOMENTS & LEVERS (Balanced beam, fulcrum, clockwise/anticlockwise moments)
  if (
    !detectedDiagram &&
    /\b(principle\s+of\s+moments|moment\s+of\s+(?:a\s+)?force|clockwise\s+moments?|anticlockwise\s+moments?|counter-clockwise\s+moments?|fulcrum|knife\s+edge|uniform\s+(?:metre|meter)\s*rule|seesaw|balanced\s+horizontally|lever\s+arm)\b/i.test(
      questionScope
    )
  ) {
    const forceMatches = [...valueScope.matchAll(/([0-9.]+)\s*n\b/gi)].map((m) => parseFloat(m[1]));
    const distMatches = [...valueScope.matchAll(/([0-9.]+)\s*(?:m|cm)\b/gi)].map((m) => parseFloat(m[1]));
    const f1 = forceMatches[0] || 30;
    const f2 = forceMatches[1] || 15;
    const d1 = distMatches[0] || 0.6;
    const d2 = distMatches[1] || (f2 > 0 ? Math.round(((f1 * d1) / f2) * 100) / 100 : 1.2);

    detectedDiagram = {
      id: `lever_${Date.now()}`,
      type: 'moments_lever',
      title: 'Principle of Moments & Lever',
      topic: 'Rotational Equilibrium',
      caption: `Sum of clockwise moments = Sum of anticlockwise moments about the fulcrum (F₁·d₁ = F₂·d₂).`,
      data: {
        lever: {
          lengthM: Math.max(d1 + d2, 2.0),
          pivotPosM: d1,
          leftLoads: [{ forceN: f1, distanceM: d1, label: `${f1} N` }],
          rightLoads: [{ forceN: f2, distanceM: d2, label: `${f2} N` }],
          isEquilibrium: true,
        },
      },
    };
  }

  // 9. VECTORS & PARALLELOGRAM OF FORCES (Two forces acting at an angle)
  if (
    !detectedDiagram &&
    /\b(parallelogram\s+of\s+forces|triangle\s+of\s+forces|resultant\s+(?:of\s+two\s+forces|force)|two\s+forces\s+(?:of|acting)|forces?\s+of\s+[0-9.]+\s*n\s+and\s+[0-9.]+\s*n|acting\s+at\s+(?:an\s+angle\s+of|right\s+angles)|concurrent\s+forces|equilibrant)\b/i.test(
      questionScope
    ) &&
    !/\b(dot\s+product|cross\s+product|unit\s+vector|eigenvector|kinematics)\b/i.test(questionScope)
  ) {
    const forceVals = [...valueScope.matchAll(/([0-9.]+)\s*n\b/gi)].map((m) => parseFloat(m[1]));
    const magA = forceVals[0] || 20;
    const magB = forceVals[1] || 15;
    const angleBetween = /\bright\s+angles?|perpendicular\b/i.test(questionScope)
      ? 90
      : extractNumber(/(?:at\s+an\s+angle\s+of|angle\s+between(?:\s+them)?(?:\s+is|\s+of)?)\s*([0-9.]+)\s*(?:deg|degrees?|°)?/i, 60);

    const rad = (angleBetween * Math.PI) / 180;
    const resultantMag = Math.round(Math.sqrt(magA * magA + magB * magB + 2 * magA * magB * Math.cos(rad)) * 100) / 100;

    detectedDiagram = {
      id: `vectors_${Date.now()}`,
      type: 'vectors',
      title: `Parallelogram of Forces (θ = ${angleBetween}°)`,
      topic: 'Vectors & Equilibrium',
      caption: `Resultant R = √(${magA}² + ${magB}² + 2·${magA}·${magB}·cos(${angleBetween}°)) = ${resultantMag} N.`,
      data: {
        vectors: {
          vectorA: { name: 'F₁', magnitude: magA, angleDeg: 0 },
          vectorB: { name: 'F₂', magnitude: magB, angleDeg: angleBetween },
          resultant: { name: 'R', magnitude: resultantMag, angleDeg: angleBetween / 2 },
          angleBetweenDeg: angleBetween,
        },
      },
    };
  }

  // 10. FORCES & FREE BODY DIAGRAM (FBD) — Newton's laws, applied force, tension, normal reaction, friction
  const isForceDiagramQuestion =
    /\b(free[\s-]body|fbd|normal\s+(?:reaction|force)|forces?\s+acting\s+on|equilibrium\s+of\s+forces|tension\s+in\s+(?:the\s+|a\s+)?(?:string|rope|cable|wire|cord)|frictional\s+force|coefficient\s+of\s+(?:static\s+|kinetic\s+|sliding\s+)?friction|applied\s+force|horizontal\s+force|net\s+force|upward\s+force|downward\s+force|pull(?:ed|ing|s)?\s+(?:across|along|with|by)\s+(?:a\s+)?(?:rough|smooth|horizontal|floor|surface|force)|push(?:ed|ing|es)?\s+(?:across|along|with|by)\s+(?:a\s+)?(?:rough|smooth|horizontal|floor|surface|force)|newton(?:'s)?\s+second\s+law)\b/i.test(
      questionScope
    ) ||
    (/\bforce\b/i.test(questionScope) &&
      /\b(mass|kg|block|box|crate|body|object|elevator|lift|pulley|friction|tension|normal|acceleration|m\/s|accelerate)\b/i.test(
        questionScope
      ));

  if (!detectedDiagram && isForceDiagramQuestion) {
    const g = /\bg\s*=\s*10(?:\.0+)?\b/i.test(valueScope) ? 10 : 9.8;
    const massKg =
      extractOptionalNumber(/(?:mass(?:\s+of)?|block\s+of|box\s+of|crate\s+of|body\s+of)\s*([0-9.]+)\s*kg\b/i) ??
      extractOptionalNumber(/\b([0-9.]+)\s*kg\b/i);

    const appliedForce =
      extractOptionalNumber(/(?:applied\s+force|horizontal\s+force|pulls?(?:\s+with)?|push(?:es|ed)?(?:\s+with)?|force\s+of)\s*(?:=|:)?\s*([0-9.]+)\s*n\b/i) ??
      extractOptionalNumber(/\b([0-9.]+)\s*n\s*(?:force|horizontal|pull|push)\b/i);

    const tensionForce = extractOptionalNumber(/\btension(?:\s+in\s+(?:the\s+)?(?:string|rope|cable|wire))?(?:\s+of|\s+is|=)?\s*([0-9.]+)\s*n\b/i);
    const mu = extractOptionalNumber(/(?:coefficient\s+of\s+(?:static\s+|kinetic\s+)?friction|μ|mu)\s*(?:is|=|of)?\s*([0-9.]+)/i);
    const explicitFriction = extractOptionalNumber(/\b(?:frictional?\s+force|friction|resistive\s+force|resistance)\s*(?:of|is|=)?\s*([0-9.]+)\s*n\b/i);

    const weightN = massKg !== null ? Math.round(massKg * g * 10) / 10 : null;
    const frictionN = explicitFriction ?? (mu !== null && weightN !== null ? Math.round(mu * weightN * 10) / 10 : null);
    const isVerticalSuspension =
      /\b(hangs?|suspended|rope|string|cable|elevator|lift)\b/i.test(questionScope) &&
      appliedForce === null &&
      frictionN === null;

    const forces: NonNullable<ScientificDiagramData['data']['freeBody']>['forces'] = [];

    if (isVerticalSuspension) {
      const tVal = tensionForce ?? weightN;
      forces.push({
        name: 'Tension (T)',
        value: tVal !== null ? `${tVal} N` : undefined,
        directionDeg: 90,
        color: '#22C55E',
      });
      forces.push({
        name: 'Weight (W)',
        value: weightN !== null ? `${weightN} N` : undefined,
        directionDeg: 270,
        color: '#EF4444',
      });
    } else {
      if (weightN !== null || /\b(normal|weight|rough|friction|floor|table|surface)\b/i.test(questionScope)) {
        forces.push({
          name: 'Normal (N)',
          value: weightN !== null ? `${weightN} N` : undefined,
          directionDeg: 90,
          color: '#22C55E',
        });
        forces.push({
          name: 'Weight (mg)',
          value: weightN !== null ? `${weightN} N` : undefined,
          directionDeg: 270,
          color: '#EF4444',
        });
      }

      const driveForce = appliedForce ?? tensionForce;
      if (driveForce !== null || /\b(force|pull|push|applied|net\s+force|accelerate)\b/i.test(questionScope)) {
        forces.push({
          name: tensionForce !== null && appliedForce === null ? 'Tension (T)' : 'Applied (F)',
          value: driveForce !== null ? `${driveForce} N` : undefined,
          directionDeg: 0,
          color: '#38BDF8',
        });
      }

      if (frictionN !== null || /\b(friction|rough|resistive|mu|μ)\b/i.test(questionScope)) {
        forces.push({
          name: 'Friction (f)',
          value: frictionN !== null ? `${frictionN} N` : undefined,
          directionDeg: 180,
          color: '#F59E0B',
        });
      }
    }

    if (forces.length > 0) {
      detectedDiagram = {
        id: `fbd_${Date.now()}`,
        type: 'free_body_diagram',
        title: `Free Body Diagram${massKg !== null ? ` (m = ${massKg} kg)` : ''}`,
        topic: "Newton's Laws & Forces",
        caption: `Force vector diagram acting on ${massKg !== null ? `${massKg} kg body` : 'the body'}: ${forces
          .map((f) => `${f.name}${f.value ? ` = ${f.value}` : ''}`)
          .join(', ')}.`,
        data: {
          freeBody: {
            bodyLabel: massKg !== null ? `${massKg} kg` : 'm',
            massKg: massKg ?? undefined,
            forces,
          },
        },
      };
    }
  }

  // Only keep a pre-existing AI diagram if it matches our detected valid diagram domain!
  // Otherwise prefer our verified procedural diagram (with accurate extracted values), or return null.
  if (!detectedDiagram) {
    return null;
  }

  const allowedTypes: Set<ScientificDiagramType> = new Set([detectedDiagram.type]);
  if (solution.diagram && allowedTypes.has(solution.diagram.type) && hasValidExistingData(solution.diagram)) {
    // If existing diagram already has populated non-placeholder data of the exact matching type, prefer freshly extracted if it's FBD/vectors/circuit/incline
    return detectedDiagram;
  }

  return detectedDiagram;
}
