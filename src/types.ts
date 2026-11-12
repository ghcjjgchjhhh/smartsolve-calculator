/**
 * Common types and data structures for SmartSolve Calculator
 */

export interface StepSolution {
  title: string;
  category: 'Mathematics' | 'Physics' | 'Equation Solver' | 'Scientific' | 'Unit Converter' | 'AI Solver' | string;
  subCategory?: string;
  problemStatement?: string;
  formula: string;
  rearrangedFormula?: string;
  givenValues?: {
    name: string;
    symbol: string;
    value: string;
    unit?: string;
  }[];
  whatIsRequired?: string;
  substitution: string;
  steps: string[];
  finalAnswer: string;
  unit?: string;
  explanation?: string;
  intuitiveConcept?: string;
  detailedDerivation?: string[];
  alternativeMethod?: string;
  commonMistakes?: string;
  tips?: string;
  notes?: string;
  timestamp?: number;
  /**
   * Interactive Graph Drawing & Animated Simulation Data
   * Automatically populated whenever the question involves graph kinematics,
   * trajectories, functions, calculus, oscillations, waves, circuits, etc.
   */
  graphs?: AiGraphData[];
  graphExplanation?: string;
  missingInformation?: string;
  /**
   * Scientific & Mathematical Diagram (Circle geometry, Triangles, Forces, Inclined planes, Optics, Circuits, etc.)
   */
  diagram?: ScientificDiagramData;
  diagrams?: ScientificDiagramData[];
}

export interface AiGraphCurve {
  id: string;
  label: string;
  color: string;
  equationText?: string;
  type?: 'function' | 'piecewise' | 'points' | 'parametric';
  /** JavaScript-evaluable expression with 'x' or 't', e.g. "4*t - 0.5*9.8*t*t" or "Math.sin(2*x)" */
  fnExpression?: string;
  /** For piecewise curves (e.g. constant accel then constant velocity then braking) */
  segments?: Array<{
    t0: number;
    t1: number;
    fn: string;
    label?: string;
  }>;
  /** Explicit coordinate points */
  points?: Array<{ x: number; y: number; label?: string }>;
  dashed?: boolean;
  shadedArea?: {
    fromX: number;
    toX: number;
    label?: string;
    color?: string;
  };
}

export interface AiGraphKeyPoint {
  x: number;
  y: number;
  label: string;
  type?: 'intercept' | 'vertex' | 'root' | 'inflection' | 'max' | 'min' | 'critical';
  details?: string;
}

export interface AiGraphSimulation {
  hasSimulation: boolean;
  type:
    | 'motion_1d'
    | 'projectile_2d'
    | 'shm_oscillator'
    | 'wave_propagation'
    | 'pv_piston'
    | 'curve_tracing'
    | 'circuit_iv';
  duration: number; // e.g. 8 seconds
  objectLabel?: string; // e.g. "Vehicle", "Particle", "Projectile", "Pendulum Bob", "Gas Piston"
  parameters?: Record<string, any>;
  realTimeValueFormat?: {
    tLabel?: string;
    xLabel?: string;
    yLabel?: string;
    extraTelemetry?: string;
  };
}

export interface AiGraphData {
  id: string;
  title: string;
  category: 'physics' | 'mathematics' | 'general';
  graphType:
    | 'velocity_time'
    | 'distance_time'
    | 'displacement_time'
    | 'acceleration_time'
    | 'speed_time'
    | 'projectile_motion'
    | 'shm'
    | 'wave_motion'
    | 'force_time'
    | 'momentum_time'
    | 'pv_diagram'
    | 'temperature_time'
    | 'iv_characteristic'
    | 'linear'
    | 'quadratic'
    | 'cubic'
    | 'polynomial'
    | 'rational'
    | 'exponential'
    | 'logarithmic'
    | 'trigonometric'
    | 'calculus'
    | 'inequality'
    | 'simultaneous'
    | 'coordinate_geometry'
    | 'conic'
    | 'custom';
  xAxis: {
    label: string;
    unit?: string;
    min: number;
    max: number;
    step?: number;
  };
  yAxis: {
    label: string;
    unit?: string;
    min: number;
    max: number;
    step?: number;
  };
  curves: AiGraphCurve[];
  keyPoints?: AiGraphKeyPoint[];
  featuresExplanation?: {
    gradientMeaning?: string;
    areaMeaning?: string;
    interceptsMeaning?: string;
    physicalInterpretation?: string;
  };
  simulation?: AiGraphSimulation;
}

export interface ChatAttachment {
  type: 'image' | 'audio';
  data: string; // Base64 data URL
  mimeType: string;
  name?: string;
  size?: string;
  duration?: number; // duration in seconds for audio
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: ChatAttachment[];
  isStreaming?: boolean;
  error?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface HistoryItem extends StepSolution {
  id: string;
  timestamp: number;
}

export interface FormulaParameter {
  symbol: string;
  name: string;
  unit: string;
  description?: string;
  defaultValue?: number;
  min?: number;
  step?: number;
}

export interface PhysicsFormulaDefinition {
  id: string;
  category: string;
  name: string;
  baseFormula: string;
  variables: FormulaParameter[];
  // Map of target variable symbol -> function to calculate it and steps
  solveFor: Record<
    string,
    {
      rearrangedFormula: string;
      unit: string;
      calculate: (inputs: Record<string, number>) => {
        result: number;
        steps: string[];
        substitution: string;
      };
    }
  >;
  description: string;
  jambRelevance?: string;
}

export interface JambQuestion {
  id: string;
  subject: 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'English' | 'Literature' | 'Economics' | string;
  year?: string;
  examYear?: string;
  exam: 'JAMB/UTME' | 'WAEC/WASSCE' | 'JUPEB' | 'University Practice' | 'JAMB UTME' | 'WAEC SSCE' | 'University Level' | string;
  level?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  topic: string;
  question: string;
  givenValues?: string;
  whatIsRequired?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  formula: string;
  whyFormula?: string;
  substitution?: string;
  steps: string[];
  finalAnswer?: string;
  explanation: string;
  examTip?: string;
}

export interface UnitCategory {
  name: string;
  icon: string;
  baseUnit: string;
  units: {
    id: string;
    name: string;
    symbol: string;
    toBase: (val: number) => number;
    fromBase: (val: number) => number;
    description?: string;
  }[];
}

/**
 * Scientific Diagram Types for Mathematics & Physics Visual Problem Solving
 */
export type ScientificDiagramType =
  | 'circle_geometry'
  | 'inclined_plane'
  | 'free_body_diagram'
  | 'optics_ray'
  | 'bearing_trig'
  | 'triangle_trig'
  | 'circuit'
  | 'wave'
  | 'moments_lever'
  | 'vectors'
  | 'projectile_trajectory'
  | 'kinematics_graph';

export interface ScientificDiagramData {
  id: string;
  type: ScientificDiagramType;
  title: string;
  topic: string;
  caption?: string;
  givenParameters?: Record<string, string | number>;
  data: {
    // Circle geometry
    circle?: {
      centerLabel?: string;
      radius?: number;
      tangents?: Array<{
        from: string;
        pointOfContact: string;
        to?: string;
        label?: string;
        length?: string | number;
      }>;
      secants?: Array<{
        from: string;
        through: string[];
        label?: string;
      }>;
      chords?: Array<{
        from: string;
        to: string;
        label?: string;
        length?: string | number;
      }>;
      points?: Array<{
        id: string;
        angleDeg: number; // angle in degrees along circumference
        label: string;
        isCenter?: boolean;
      }>;
      angles?: Array<{
        vertex: string;
        arm1: string;
        arm2: string;
        degrees?: number;
        label?: string;
      }>;
      theoremsApplied?: string[];
      notes?: string;
      subtype?: 'tangent_secant' | 'chord_distance' | 'cyclic_quad' | 'inscribed_angles';
      chordDistance?: {
        radius: number;
        chordLength: number;
        perpendicularDistance?: number;
        chordLabel?: string;
        midpointLabel?: string;
        centerLabel?: string;
        unit?: string;
      };
    };

    // Forces on an inclined plane
    inclinedPlane?: {
      angleDeg: number;
      massKg?: number;
      weightN?: number;
      normalForceN?: number;
      mgSinN?: number;
      mgCosN?: number;
      frictionN?: number;
      appliedForceN?: number;
      tensionN?: number;
      accelerationMs2?: number;
      coefficientOfFriction?: number;
      motionDirection?: 'up' | 'down' | 'stationary' | 'impending_down' | 'impending_up';
      showComponents?: boolean;
    };

    // Free body diagram (horizontal/vertical)
    freeBody?: {
      bodyLabel?: string;
      massKg?: number;
      forces: Array<{
        name: string;
        value?: string | number;
        unit?: string;
        directionDeg: number; // 0=right, 90=up, 180=left, 270=down
        color?: string;
      }>;
    };

    // Optics ray diagram
    optics?: {
      opticType:
        | 'concave_mirror'
        | 'convex_mirror'
        | 'convex_lens'
        | 'concave_lens'
        | 'refraction_prism'
        | 'plane_mirror';
      focalLengthCm: number;
      objectDistanceCm: number;
      objectHeightCm: number;
      imageDistanceCm?: number;
      imageHeightCm?: number;
      imageNature?: 'Real & Inverted' | 'Virtual & Upright' | 'At Infinity';
      magnification?: number;
      showRays?: boolean;
    };

    // Bearings & Navigation
    bearing?: {
      originLabel: string;
      destinationLabel: string;
      bearingDeg: number; // 3-figure bearing from North, 0 to 360
      distanceKm?: number;
      elevationOrDepressionDeg?: number;
      elevationType?: 'elevation' | 'depression';
      referencePoints?: Array<{ label: string; x: number; y: number }>;
    };

    // Trigonometry / Triangles
    triangle?: {
      vertices: [string, string, string];
      sides?: {
        ab?: string | number;
        bc?: string | number;
        ca?: string | number;
      };
      angles?: {
        a?: number;
        b?: number;
        c?: number;
      };
      isRightAngled?: boolean;
      rightAngleVertex?: string;
      heightLine?: boolean;
      heightValue?: string | number;
      opposite?: string | number;
      adjacent?: string | number;
      hypotenuse?: string | number;
    };

    // Moments & Levers
    lever?: {
      lengthM: number;
      pivotPosM: number;
      leftLoads: Array<{ forceN: number; distanceM: number; label?: string }>;
      rightLoads: Array<{ forceN: number; distanceM: number; label?: string }>;
      fulcrumReactionN?: number;
      isEquilibrium?: boolean;
    };

    // Electric Circuit
    circuit?: {
      voltageV?: number;
      currentA?: number;
      totalResistanceOhm?: number;
      circuitType: 'series' | 'parallel' | 'series_parallel' | 'simple';
      components: Array<{
        id: string;
        type: 'cell' | 'resistor' | 'ammeter' | 'voltmeter' | 'switch' | 'bulb';
        value?: string;
        label: string;
        position: 'top' | 'right' | 'bottom' | 'left' | 'parallel_branch';
      }>;
    };

    // Transverse / Longitudinal Wave
    wave?: {
      waveType: 'transverse' | 'longitudinal';
      amplitude: number;
      wavelength: number;
      frequencyHz?: number;
      velocityMs?: number;
      crestLabel?: string;
      troughLabel?: string;
      wavelengthLabel?: string;
      amplitudeLabel?: string;
    };

    // Vector Addition & Parallelogram
    vectors?: {
      vectorA: { name: string; magnitude: number; angleDeg: number };
      vectorB: { name: string; magnitude: number; angleDeg: number };
      resultant?: { name: string; magnitude: number; angleDeg: number };
      angleBetweenDeg?: number;
    };
  };
}

