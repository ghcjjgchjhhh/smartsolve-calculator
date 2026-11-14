export type SimCategory = 'all' | 'physics' | 'math' | 'chemistry' | 'biology';

export type SimMode =
  // Existing 7 Physics Labs
  | 'circular'
  | 'projectile'
  | 'gravity'
  | 'forces'
  | 'waves'
  | 'electricity'
  | 'energy'
  // 6 New Physics 3D Models
  | 'spring_shm'
  | 'torque_gyro'
  | 'doppler_3d'
  | 'optics_lens_3d'
  | 'bernoulli_pipe'
  | 'bohr_atom'
  // 6 New Mathematics 3D Shapes & Geometry
  | 'math_sphere'
  | 'math_cylinder'
  | 'math_cone'
  | 'math_pyramid'
  | 'math_torus'
  | 'math_vectors_3d'
  // 5 New Chemistry 3D Models
  | 'chem_methane'
  | 'chem_water'
  | 'chem_ideal_gas'
  | 'chem_lattice'
  | 'chem_benzene'
  // 5 New Biology 3D Models
  | 'bio_dna'
  | 'bio_cell'
  | 'bio_rbc'
  | 'bio_mitochondria'
  | 'bio_neuron';

export interface SimParams {
  // Original 7
  radius: number;
  omega: number;
  mass: number;
  speed: number;
  angleDeg: number;
  gravity: number;
  centralMass: number;
  orbitRadius: number;
  inclineDeg: number;
  frictionMu: number;
  waveAmp: number;
  waveFreq: number;
  wavelength: number;
  voltage: number;
  resistance: number;
  magneticField: number;
  pendulumLen: number;
  pendulumDeg: number;
  // Additional parameters shared cleanly across the 22 new 3D models
  springK: number;
  forceVal: number;
  sourceSpeed: number;
  focalLength: number;
  objDistance: number;
  throatRatio: number;
  fluidDensity: number;
  quantumN: number;
  atomicZ: number;
  shapeRadius: number;
  shapeHeight: number;
  majorRadius: number;
  vecA: number;
  vecB: number;
  temperature: number;
  volumeL: number;
  moles: number;
  scaleFactor: number;
  spinRate: number;
  concentration: number;
}

export const DEFAULT_SIM_PARAMS: SimParams = {
  radius: 3.2,
  omega: 2.0,
  mass: 4.0,
  speed: 14,
  angleDeg: 45,
  gravity: 9.81,
  centralMass: 10,
  orbitRadius: 4.2,
  inclineDeg: 28,
  frictionMu: 0.15,
  waveAmp: 0.7,
  waveFreq: 1.4,
  wavelength: 3.2,
  voltage: 12,
  resistance: 4,
  magneticField: 1.5,
  pendulumLen: 4.0,
  pendulumDeg: 38,
  springK: 28,
  forceVal: 18,
  sourceSpeed: 120,
  focalLength: 2.0,
  objDistance: 4.2,
  throatRatio: 0.5,
  fluidDensity: 1000,
  quantumN: 2,
  atomicZ: 1,
  shapeRadius: 1.8,
  shapeHeight: 3.2,
  majorRadius: 2.2,
  vecA: 2.6,
  vecB: 2.2,
  temperature: 310,
  volumeL: 2.4,
  moles: 1.0,
  scaleFactor: 1.0,
  spinRate: 1.0,
  concentration: 0.75,
};

export interface SliderConfig {
  key: keyof SimParams;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

export interface SimTabDefinition {
  id: SimMode;
  label: string;
  category: Exclude<SimCategory, 'all'>;
  formula: string;
  description: string;
  sliders: SliderConfig[];
}

export const SIM_TABS: SimTabDefinition[] = [
  // --- ORIGINAL 7 PHYSICS ---
  {
    id: 'circular',
    label: 'Circular Motion',
    category: 'physics',
    formula: 'F_c = m\\omega^2 r,\\quad v = \\omega r',
    description: 'Uniform circular motion showing centripetal force & tangential velocity vectors.',
    sliders: [
      { key: 'radius', label: 'Radius r', unit: 'm', min: 1.2, max: 4.5, step: 0.1 },
      { key: 'omega', label: 'Angular Speed ω', unit: 'rad/s', min: 0.4, max: 6.0, step: 0.1 },
      { key: 'mass', label: 'Mass m', unit: 'kg', min: 1, max: 20, step: 0.5 },
    ],
  },
  {
    id: 'projectile',
    label: 'Projectile Motion',
    category: 'physics',
    formula: 'R = \\frac{v_0^2 \\sin(2\\theta)}{g},\\quad H = \\frac{v_0^2 \\sin^2\\theta}{2g}',
    description: '3D parabolic trajectory under constant gravitational acceleration.',
    sliders: [
      { key: 'speed', label: 'Launch Speed v₀', unit: 'm/s', min: 5, max: 28, step: 0.5 },
      { key: 'angleDeg', label: 'Launch Angle θ', unit: '°', min: 10, max: 80, step: 1 },
      { key: 'gravity', label: 'Gravity g', unit: 'm/s²', min: 1.6, max: 20, step: 0.1 },
    ],
  },
  {
    id: 'gravity',
    label: 'Gravity & Orbits',
    category: 'physics',
    formula: 'F = \\frac{GMm}{r^2},\\quad v_{orb} = \\sqrt{\\frac{GM}{r}}',
    description: 'Keplerian orbital mechanics around a central planetary body.',
    sliders: [
      { key: 'centralMass', label: 'Central Mass M', unit: '×10²⁴ kg', min: 2, max: 25, step: 0.5 },
      { key: 'orbitRadius', label: 'Orbital Radius r', unit: '×10⁶ m', min: 2.0, max: 5.5, step: 0.1 },
    ],
  },
  {
    id: 'forces',
    label: 'Forces & Incline',
    category: 'physics',
    formula: 'a = g(\\sin\\theta - \\mu\\cos\\theta),\\quad N = mg\\cos\\theta',
    description: 'Normal reaction, kinetic friction, and gravity component on an inclined plane.',
    sliders: [
      { key: 'inclineDeg', label: 'Ramp Angle θ', unit: '°', min: 5, max: 60, step: 1 },
      { key: 'frictionMu', label: 'Friction Coeff μ', unit: '', min: 0, max: 0.8, step: 0.02 },
      { key: 'mass', label: 'Block Mass m', unit: 'kg', min: 1, max: 25, step: 0.5 },
    ],
  },
  {
    id: 'waves',
    label: '3D Waves',
    category: 'physics',
    formula: 'y(x,z,t) = A\\sin(kx - \\omega t),\\quad v = f\\lambda',
    description: 'Dynamic 3D transverse wave surface demonstrating amplitude and wavelength.',
    sliders: [
      { key: 'waveAmp', label: 'Amplitude A', unit: 'm', min: 0.1, max: 1.4, step: 0.05 },
      { key: 'waveFreq', label: 'Frequency f', unit: 'Hz', min: 0.3, max: 3.5, step: 0.1 },
      { key: 'wavelength', label: 'Wavelength λ', unit: 'm', min: 1.2, max: 6.0, step: 0.1 },
    ],
  },
  {
    id: 'electricity',
    label: 'Electricity & B-Field',
    category: 'physics',
    formula: 'I = \\frac{V}{R},\\quad B = \\mu_0 n I',
    description: 'Solenoid coil current flow generating a central axial magnetic field.',
    sliders: [
      { key: 'voltage', label: 'Source Voltage V', unit: 'V', min: 1, max: 24, step: 0.5 },
      { key: 'resistance', label: 'Resistance R', unit: 'Ω', min: 1, max: 20, step: 0.5 },
      { key: 'magneticField', label: 'Magnetic Field B', unit: 'T', min: 0.2, max: 4.0, step: 0.1 },
    ],
  },
  {
    id: 'energy',
    label: 'Conservation of Energy',
    category: 'physics',
    formula: 'E_k + E_p = \\frac{1}{2}mv^2 + mgh = \\text{const}',
    description: 'Simple pendulum exchanging gravitational potential energy and kinetic energy.',
    sliders: [
      { key: 'pendulumLen', label: 'Pendulum Length L', unit: 'm', min: 1.8, max: 4.4, step: 0.1 },
      { key: 'pendulumDeg', label: 'Release Angle θ₀', unit: '°', min: 5, max: 65, step: 1 },
      { key: 'gravity', label: 'Gravity g', unit: 'm/s²', min: 1.6, max: 20, step: 0.1 },
    ],
  },

  // --- 6 NEW PHYSICS 3D ---
  {
    id: 'spring_shm',
    label: 'Helical Spring SHM',
    category: 'physics',
    formula: 'F = -kx,\\quad T = 2\\pi\\sqrt{\\frac{m}{k}},\\quad E = \\frac{1}{2}kA^2',
    description: '3D vertical helical spring oscillating via Hooke’s law and Simple Harmonic Motion.',
    sliders: [
      { key: 'springK', label: 'Spring Constant k', unit: 'N/m', min: 8, max: 80, step: 1 },
      { key: 'mass', label: 'Mass m', unit: 'kg', min: 1, max: 15, step: 0.5 },
      { key: 'waveAmp', label: 'Amplitude A', unit: 'm', min: 0.2, max: 1.3, step: 0.05 },
    ],
  },
  {
    id: 'torque_gyro',
    label: 'Torque & Gyroscope',
    category: 'physics',
    formula: '\\tau = rF\\sin\\theta,\\quad L = I\\omega,\\quad \\Omega_p = \\frac{\\tau}{L}',
    description: '3D rotating flywheel demonstrating rotational moment τ and angular momentum L.',
    sliders: [
      { key: 'radius', label: 'Lever Arm r', unit: 'm', min: 0.8, max: 3.5, step: 0.1 },
      { key: 'forceVal', label: 'Applied Force F', unit: 'N', min: 5, max: 50, step: 1 },
      { key: 'angleDeg', label: 'Force Angle θ', unit: '°', min: 10, max: 90, step: 1 },
    ],
  },
  {
    id: 'doppler_3d',
    label: '3D Doppler Effect',
    category: 'physics',
    formula: "f' = f\\left(\\frac{v}{v - v_s}\\right),\\quad \\lambda' = \\frac{v - v_s}{f}",
    description: 'Moving wave emitter compressing spherical wavefronts ahead and stretching them behind.',
    sliders: [
      { key: 'sourceSpeed', label: 'Source Speed v_s', unit: 'm/s', min: 0, max: 260, step: 5 },
      { key: 'waveFreq', label: 'Source Freq f', unit: 'kHz', min: 0.5, max: 3.0, step: 0.1 },
      { key: 'spinRate', label: 'Speed of Sound Scale', unit: '×', min: 0.5, max: 2.0, step: 0.1 },
    ],
  },
  {
    id: 'optics_lens_3d',
    label: '3D Convex Lens Optics',
    category: 'physics',
    formula: '\\frac{1}{f} = \\frac{1}{u} + \\frac{1}{v},\\quad M = -\\frac{v}{u}',
    description: '3D biconvex glass lens refracting a cone of light rays to form a real or virtual image.',
    sliders: [
      { key: 'objDistance', label: 'Object Distance u', unit: 'm', min: 1.2, max: 6.0, step: 0.1 },
      { key: 'focalLength', label: 'Focal Length f', unit: 'm', min: 0.8, max: 3.0, step: 0.1 },
      { key: 'scaleFactor', label: 'Object Height h₀', unit: 'm', min: 0.6, max: 2.0, step: 0.1 },
    ],
  },
  {
    id: 'bernoulli_pipe',
    label: 'Bernoulli Venturi Tube',
    category: 'physics',
    formula: 'P_1 + \\frac{1}{2}\\rho v_1^2 = P_2 + \\frac{1}{2}\\rho v_2^2,\\quad A_1 v_1 = A_2 v_2',
    description: 'Fluid continuity and pressure drop across a 3D constricted Venturi pipe with pressure columns.',
    sliders: [
      { key: 'throatRatio', label: 'Throat Radius Ratio', unit: '', min: 0.35, max: 0.85, step: 0.05 },
      { key: 'speed', label: 'Inlet Speed v₁', unit: 'm/s', min: 1, max: 12, step: 0.5 },
      { key: 'fluidDensity', label: 'Fluid Density ρ', unit: 'kg/m³', min: 700, max: 1600, step: 50 },
    ],
  },
  {
    id: 'bohr_atom',
    label: 'Bohr Quantum Atom',
    category: 'physics',
    formula: 'E_n = -\\frac{13.6 Z^2}{n^2}\\,\\text{eV},\\quad r_n = \\frac{n^2 a_0}{Z}',
    description: '3D quantum electron shells orbiting a nucleon core with quantized energy levels.',
    sliders: [
      { key: 'quantumN', label: 'Energy Level n', unit: '', min: 1, max: 4, step: 1 },
      { key: 'atomicZ', label: 'Atomic Number Z', unit: '', min: 1, max: 6, step: 1 },
      { key: 'spinRate', label: 'Orbital Speed', unit: '×', min: 0.2, max: 3.0, step: 0.1 },
    ],
  },

  // --- 6 NEW MATHEMATICS 3D ---
  {
    id: 'math_sphere',
    label: '3D Sphere',
    category: 'math',
    formula: 'V = \\frac{4}{3}\\pi r^3,\\quad A = 4\\pi r^2,\\quad C = 2\\pi r',
    description: 'Interactive 3D sphere with equatorial great-circle ring and internal radius vector r.',
    sliders: [
      { key: 'shapeRadius', label: 'Radius r', unit: 'u', min: 0.6, max: 3.0, step: 0.1 },
      { key: 'spinRate', label: 'Rotation Speed', unit: '×', min: 0, max: 3.0, step: 0.1 },
    ],
  },
  {
    id: 'math_cylinder',
    label: '3D Cylinder',
    category: 'math',
    formula: 'V = \\pi r^2 h,\\quad A_{total} = 2\\pi r(r + h)',
    description: 'Right circular cylinder showing circular cross-sections, radius r, and altitude h.',
    sliders: [
      { key: 'shapeRadius', label: 'Base Radius r', unit: 'u', min: 0.5, max: 2.6, step: 0.1 },
      { key: 'shapeHeight', label: 'Height h', unit: 'u', min: 1.0, max: 5.0, step: 0.1 },
      { key: 'spinRate', label: 'Rotation Speed', unit: '×', min: 0, max: 3.0, step: 0.1 },
    ],
  },
  {
    id: 'math_cone',
    label: '3D Cone & Slant',
    category: 'math',
    formula: 'V = \\frac{1}{3}\\pi r^2 h,\\quad l = \\sqrt{r^2 + h^2},\\quad A = \\pi r(r + l)',
    description: 'Right circular cone illustrating vertical altitude h, radius r, and slant height l.',
    sliders: [
      { key: 'shapeRadius', label: 'Base Radius r', unit: 'u', min: 0.6, max: 2.8, step: 0.1 },
      { key: 'shapeHeight', label: 'Height h', unit: 'u', min: 1.0, max: 5.2, step: 0.1 },
      { key: 'spinRate', label: 'Rotation Speed', unit: '×', min: 0, max: 3.0, step: 0.1 },
    ],
  },
  {
    id: 'math_pyramid',
    label: 'Square Pyramid',
    category: 'math',
    formula: 'V = \\frac{1}{3}a^2 h,\\quad A = a^2 + 2a\\sqrt{\\left(\\frac{a}{2}\\right)^2 + h^2}',
    description: 'Right square pyramid with transparent faces, base square side a, and central altitude h.',
    sliders: [
      { key: 'shapeRadius', label: 'Base Side a', unit: 'u', min: 1.0, max: 4.0, step: 0.1 },
      { key: 'shapeHeight', label: 'Height h', unit: 'u', min: 1.0, max: 5.0, step: 0.1 },
      { key: 'spinRate', label: 'Rotation Speed', unit: '×', min: 0, max: 3.0, step: 0.1 },
    ],
  },
  {
    id: 'math_torus',
    label: '3D Torus Solid',
    category: 'math',
    formula: 'V = 2\\pi^2 R r^2,\\quad A = 4\\pi^2 R r',
    description: '3D torus solid generated by revolving a circle of radius r around a ring of major radius R.',
    sliders: [
      { key: 'majorRadius', label: 'Major Radius R', unit: 'u', min: 1.4, max: 3.2, step: 0.1 },
      { key: 'shapeRadius', label: 'Tube Radius r', unit: 'u', min: 0.25, max: 1.1, step: 0.05 },
      { key: 'spinRate', label: 'Rotation Speed', unit: '×', min: 0, max: 3.0, step: 0.1 },
    ],
  },
  {
    id: 'math_vectors_3d',
    label: '3D Vector Cross Product',
    category: 'math',
    formula: '|\\vec{A} \\times \\vec{B}| = |\\vec{A}||\\vec{B}|\\sin\\theta,\\quad \\vec{A}\\cdot\\vec{B} = |\\vec{A}||\\vec{B}|\\cos\\theta',
    description: 'Right-hand rule visualization of vectors A, B, spanned parallelogram, and orthogonal cross product A × B.',
    sliders: [
      { key: 'vecA', label: 'Magnitude |A|', unit: 'u', min: 1.0, max: 3.5, step: 0.1 },
      { key: 'vecB', label: 'Magnitude |B|', unit: 'u', min: 1.0, max: 3.5, step: 0.1 },
      { key: 'angleDeg', label: 'Angle θ', unit: '°', min: 10, max: 170, step: 1 },
    ],
  },

  // --- 5 NEW CHEMISTRY 3D ---
  {
    id: 'chem_methane',
    label: 'Methane (CH₄) sp³',
    category: 'chemistry',
    formula: '\\theta_{H-C-H} = 109.47^\\circ,\\quad sp^3\\text{ Tetrahedral},\\quad M = 16.04\\text{ g/mol}',
    description: '3D VSEPR tetrahedral geometry of methane with C-H covalent bonds and enclosing tetrahedron.',
    sliders: [
      { key: 'scaleFactor', label: 'Bond Scale', unit: 'Å', min: 0.7, max: 1.5, step: 0.05 },
      { key: 'temperature', label: 'Thermal Vibration T', unit: 'K', min: 100, max: 800, step: 20 },
      { key: 'spinRate', label: 'Rotation Speed', unit: '×', min: 0, max: 3.0, step: 0.1 },
    ],
  },
  {
    id: 'chem_water',
    label: 'Water (H₂O) & Dipole',
    category: 'chemistry',
    formula: '\\theta_{H-O-H} = 104.5^\\circ,\\quad \\mu = 1.85\\text{ D},\\quad \\text{Bent } sp^3',
    description: 'Bent polar water molecule with two lone electron pair lobes and net electric dipole arrow.',
    sliders: [
      { key: 'angleDeg', label: 'H-O-H Angle θ', unit: '°', min: 90, max: 130, step: 0.5 },
      { key: 'temperature', label: 'Thermal Vibration T', unit: 'K', min: 100, max: 700, step: 20 },
      { key: 'spinRate', label: 'Rotation Speed', unit: '×', min: 0, max: 3.0, step: 0.1 },
    ],
  },
  {
    id: 'chem_ideal_gas',
    label: 'Ideal Gas (PV = nRT)',
    category: 'chemistry',
    formula: 'PV = nRT,\\quad v_{rms} = \\sqrt{\\frac{3RT}{M}},\\quad E_k = \\frac{3}{2}k_B T',
    description: '3D piston chamber with kinetic gas molecules whose velocity and pressure respond to T and V.',
    sliders: [
      { key: 'temperature', label: 'Temperature T', unit: 'K', min: 150, max: 900, step: 10 },
      { key: 'volumeL', label: 'Volume V', unit: 'L', min: 1.2, max: 4.2, step: 0.1 },
      { key: 'moles', label: 'Moles n', unit: 'mol', min: 0.5, max: 3.0, step: 0.1 },
    ],
  },
  {
    id: 'chem_lattice',
    label: 'NaCl Ionic Crystal',
    category: 'chemistry',
    formula: 'U \\propto -\\frac{M z^+ z^- e^2}{4\\pi\\varepsilon_0 r_0},\\quad \\rho = \\frac{Z M}{N_A a^3}',
    description: '3D face-centered cubic sodium chloride lattice of alternating Na⁺ and Cl⁻ ions.',
    sliders: [
      { key: 'scaleFactor', label: 'Lattice Constant a', unit: 'Å', min: 0.8, max: 1.4, step: 0.05 },
      { key: 'temperature', label: 'Thermal Agitation', unit: 'K', min: 50, max: 800, step: 25 },
      { key: 'spinRate', label: 'Rotation Speed', unit: '×', min: 0, max: 3.0, step: 0.1 },
    ],
  },
  {
    id: 'chem_benzene',
    label: 'Benzene (C₆H₆) π-Ring',
    category: 'chemistry',
    formula: '\\text{Hückel: } 4n + 2 = 6\\,\\pi e^-,\\quad \\theta = 120^\\circ\\ (sp^2\\text{ Planar})',
    description: 'Planar hexagonal aromatic ring with upper and lower delocalized π-electron torus clouds.',
    sliders: [
      { key: 'scaleFactor', label: 'Ring Scale', unit: 'Å', min: 0.75, max: 1.4, step: 0.05 },
      { key: 'concentration', label: 'π-Cloud Density', unit: '', min: 0.15, max: 1.0, step: 0.05 },
      { key: 'spinRate', label: 'Rotation Speed', unit: '×', min: 0, max: 3.0, step: 0.1 },
    ],
  },

  // --- 5 NEW BIOLOGY 3D ---
  {
    id: 'bio_dna',
    label: 'DNA Double Helix',
    category: 'biology',
    formula: '\\text{Pitch } P = 3.4\\text{ nm},\\quad 10.5\\text{ bp/turn},\\quad A=T,\\; G\\equiv C',
    description: '3D right-handed B-DNA double helix with antiparallel sugar-phosphate backbones and base rungs.',
    sliders: [
      { key: 'scaleFactor', label: 'Helix Radius Scale', unit: 'nm', min: 0.7, max: 1.5, step: 0.05 },
      { key: 'spinRate', label: 'Twist Speed', unit: '×', min: 0, max: 3.0, step: 0.1 },
      { key: 'concentration', label: 'Unwind Factor', unit: '', min: 0.3, max: 1.5, step: 0.05 },
    ],
  },
  {
    id: 'bio_cell',
    label: 'Eukaryotic Cell & SA/V',
    category: 'biology',
    formula: '\\frac{SA}{V} = \\frac{3}{r},\\quad J = -D\\frac{\\Delta C}{\\Delta x}\\text{ (Fick)}',
    description: '3D eukaryotic cell showing nucleus, mitochondria, ER, and surface-area-to-volume diffusion scaling.',
    sliders: [
      { key: 'shapeRadius', label: 'Cell Radius r', unit: 'μm', min: 1.2, max: 3.0, step: 0.1 },
      { key: 'concentration', label: 'Solute Gradient ΔC', unit: 'mM', min: 0.2, max: 1.0, step: 0.05 },
      { key: 'spinRate', label: 'Cytoplasmic Flow', unit: '×', min: 0, max: 3.0, step: 0.1 },
    ],
  },
  {
    id: 'bio_rbc',
    label: 'Red Blood Cell & O₂',
    category: 'biology',
    formula: 'Hb + 4O_2 \\rightleftharpoons Hb(O_2)_4,\\quad y(r) = \\pm\\frac{R}{2}\\sqrt{1-\\rho^2}(c_0 + c_1\\rho^2 + c_2\\rho^4)',
    description: '3D Evans-Fung parametric biconcave erythrocyte profile binding oxygen molecules.',
    sliders: [
      { key: 'concentration', label: 'O₂ Saturation pO₂', unit: '', min: 0.1, max: 1.0, step: 0.05 },
      { key: 'shapeRadius', label: 'Cell Radius R', unit: 'μm', min: 1.4, max: 2.8, step: 0.1 },
      { key: 'spinRate', label: 'Rotation Speed', unit: '×', min: 0, max: 3.0, step: 0.1 },
    ],
  },
  {
    id: 'bio_mitochondria',
    label: 'Mitochondrion & ATP Rotor',
    category: 'biology',
    formula: 'C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + \\approx 32\\,\\text{ATP}',
    description: '3D mitochondrion with folded cristae and rotary ATP synthase driven by an H⁺ proton gradient.',
    sliders: [
      { key: 'concentration', label: 'H⁺ Proton Gradient', unit: 'ΔpH', min: 0.2, max: 1.8, step: 0.1 },
      { key: 'spinRate', label: 'Rotor Speed', unit: '×', min: 0.2, max: 3.5, step: 0.1 },
    ],
  },
  {
    id: 'bio_neuron',
    label: 'Neuron & Action Potential',
    category: 'biology',
    formula: 'E_{ion} = \\frac{RT}{zF}\\ln\\frac{[\\text{ion}]_{out}}{[\\text{ion}]_{in}},\\quad v_{cond} \\propto \\sqrt{d}',
    description: '3D myelinated neuron illustrating saltatory conduction leaping across Nodes of Ranvier.',
    sliders: [
      { key: 'shapeRadius', label: 'Axon Diameter d', unit: 'μm', min: 0.6, max: 2.2, step: 0.1 },
      { key: 'waveFreq', label: 'Firing Freq f', unit: 'Hz', min: 0.4, max: 3.0, step: 0.1 },
      { key: 'temperature', label: 'Temp T', unit: 'K', min: 290, max: 320, step: 1 },
    ],
  },
];

export function computeSimTelemetry(mode: SimMode, p: SimParams): { label: string; value: string }[] {
  switch (mode) {
    case 'circular': {
      const v = p.omega * p.radius;
      const fc = p.mass * p.omega * p.omega * p.radius;
      return [
        { label: 'Tangential Speed', value: `${v.toFixed(2)} m/s` },
        { label: 'Centripetal Force', value: `${fc.toFixed(2)} N` },
        { label: 'Period T', value: `${((2 * Math.PI) / p.omega).toFixed(2)} s` },
      ];
    }
    case 'projectile': {
      const rad = (p.angleDeg * Math.PI) / 180;
      const range = (p.speed * p.speed * Math.sin(2 * rad)) / p.gravity;
      const maxH = Math.pow(p.speed * Math.sin(rad), 2) / (2 * p.gravity);
      const tof = (2 * p.speed * Math.sin(rad)) / p.gravity;
      return [
        { label: 'Range R', value: `${range.toFixed(2)} m` },
        { label: 'Max Height H', value: `${maxH.toFixed(2)} m` },
        { label: 'Flight Time', value: `${tof.toFixed(2)} s` },
      ];
    }
    case 'gravity': {
      const vOrb = Math.sqrt((p.centralMass * 4.5) / p.orbitRadius);
      const period = (2 * Math.PI * p.orbitRadius) / Math.max(0.1, vOrb);
      const gLocal = (p.centralMass * 4.5) / (p.orbitRadius * p.orbitRadius);
      return [
        { label: 'Orbital Speed', value: `${vOrb.toFixed(2)} km/s` },
        { label: 'Orbital Period', value: `${period.toFixed(2)} s` },
        { label: 'Field Strength g', value: `${gLocal.toFixed(2)} m/s²` },
      ];
    }
    case 'forces': {
      const rad = (p.inclineDeg * Math.PI) / 180;
      const normal = p.mass * p.gravity * Math.cos(rad);
      const downSlope = p.mass * p.gravity * Math.sin(rad);
      const frictionMax = p.frictionMu * normal;
      const netF = Math.max(0, downSlope - frictionMax);
      const acc = netF / p.mass;
      return [
        { label: 'Normal Force N', value: `${normal.toFixed(1)} N` },
        { label: 'Friction f', value: `${Math.min(downSlope, frictionMax).toFixed(1)} N` },
        { label: 'Acceleration a', value: `${acc.toFixed(2)} m/s²` },
      ];
    }
    case 'waves': {
      const vWave = p.waveFreq * p.wavelength;
      return [
        { label: 'Wave Speed v', value: `${vWave.toFixed(2)} m/s` },
        { label: 'Angular Freq ω', value: `${(2 * Math.PI * p.waveFreq).toFixed(2)} rad/s` },
        { label: 'Wave Number k', value: `${((2 * Math.PI) / p.wavelength).toFixed(2)} rad/m` },
      ];
    }
    case 'electricity': {
      const current = p.voltage / Math.max(0.5, p.resistance);
      const power = p.voltage * current;
      return [
        { label: 'Current I', value: `${current.toFixed(2)} A` },
        { label: 'Power P', value: `${power.toFixed(1)} W` },
        { label: 'Solenoid Flux Φ', value: `${(p.magneticField * 0.45 * current).toFixed(2)} mWb` },
      ];
    }
    case 'energy': {
      const rad = (p.pendulumDeg * Math.PI) / 180;
      const hMax = p.pendulumLen * (1 - Math.cos(rad));
      const eTotal = p.mass * p.gravity * hMax;
      const vMax = Math.sqrt(2 * p.gravity * hMax);
      return [
        { label: 'Total Energy E', value: `${eTotal.toFixed(1)} J` },
        { label: 'Peak Speed v_max', value: `${vMax.toFixed(2)} m/s` },
        { label: 'Period T', value: `${(2 * Math.PI * Math.sqrt(p.pendulumLen / p.gravity)).toFixed(2)} s` },
      ];
    }
    case 'spring_shm': {
      const period = 2 * Math.PI * Math.sqrt(p.mass / p.springK);
      const maxF = p.springK * p.waveAmp;
      const energy = 0.5 * p.springK * p.waveAmp * p.waveAmp;
      return [
        { label: 'Period T', value: `${period.toFixed(2)} s` },
        { label: 'Max Force F_max', value: `${maxF.toFixed(1)} N` },
        { label: 'Elastic Energy E', value: `${energy.toFixed(2)} J` },
      ];
    }
    case 'torque_gyro': {
      const rad = (p.angleDeg * Math.PI) / 180;
      const tau = p.radius * p.forceVal * Math.sin(rad);
      const angMom = 0.5 * p.mass * p.radius * p.radius * p.omega;
      return [
        { label: 'Torque τ', value: `${tau.toFixed(2)} N·m` },
        { label: 'Ang. Momentum L', value: `${angMom.toFixed(2)} kg·m²/s` },
        { label: 'sin θ', value: `${Math.sin(rad).toFixed(3)}` },
      ];
    }
    case 'doppler_3d': {
      const vSound = 343 * p.spinRate;
      const fObs = p.waveFreq * (vSound / Math.max(15, vSound - p.sourceSpeed));
      const fBehind = p.waveFreq * (vSound / (vSound + p.sourceSpeed));
      return [
        { label: 'Approaching f′', value: `${fObs.toFixed(2)} kHz` },
        { label: 'Receding f″', value: `${fBehind.toFixed(2)} kHz` },
        { label: 'Mach Number', value: `${(p.sourceSpeed / vSound).toFixed(2)} M` },
      ];
    }
    case 'optics_lens_3d': {
      const denom = p.objDistance - p.focalLength;
      const v = Math.abs(denom) < 0.05 ? Infinity : (p.focalLength * p.objDistance) / denom;
      const mag = Number.isFinite(v) ? -v / p.objDistance : 0;
      return [
        { label: 'Image Dist v', value: Number.isFinite(v) ? `${v.toFixed(2)} m` : '∞ (Focal)' },
        { label: 'Magnification M', value: Number.isFinite(v) ? `${mag.toFixed(2)}×` : '∞' },
        { label: 'Image Type', value: v > 0 ? 'Real & Inverted' : 'Virtual & Upright' },
      ];
    }
    case 'bernoulli_pipe': {
      const v2 = p.speed / (p.throatRatio * p.throatRatio);
      const dP = 0.5 * p.fluidDensity * (v2 * v2 - p.speed * p.speed);
      return [
        { label: 'Throat Speed v₂', value: `${v2.toFixed(2)} m/s` },
        { label: 'Pressure Drop ΔP', value: `${(dP / 1000).toFixed(2)} kPa` },
        { label: 'Dynamic Head', value: `${(0.5 * p.fluidDensity * v2 * v2 / 1000).toFixed(2)} kPa` },
      ];
    }
    case 'bohr_atom': {
      const eN = (-13.6 * p.atomicZ * p.atomicZ) / (p.quantumN * p.quantumN);
      const rN = (p.quantumN * p.quantumN * 0.529) / p.atomicZ;
      return [
        { label: `Energy E_${p.quantumN}`, value: `${eN.toFixed(2)} eV` },
        { label: `Bohr Radius r_${p.quantumN}`, value: `${rN.toFixed(3)} Å` },
        { label: 'Orbitals n', value: `n = ${p.quantumN}` },
      ];
    }
    case 'math_sphere': {
      const r = p.shapeRadius;
      return [
        { label: 'Volume V', value: `${((4 / 3) * Math.PI * r ** 3).toFixed(2)} u³` },
        { label: 'Surface Area A', value: `${(4 * Math.PI * r * r).toFixed(2)} u²` },
        { label: 'Great Circle C', value: `${(2 * Math.PI * r).toFixed(2)} u` },
      ];
    }
    case 'math_cylinder': {
      const r = p.shapeRadius;
      const h = p.shapeHeight;
      return [
        { label: 'Volume V', value: `${(Math.PI * r * r * h).toFixed(2)} u³` },
        { label: 'Total Area A', value: `${(2 * Math.PI * r * (r + h)).toFixed(2)} u²` },
        { label: 'Lateral Area', value: `${(2 * Math.PI * r * h).toFixed(2)} u²` },
      ];
    }
    case 'math_cone': {
      const r = p.shapeRadius;
      const h = p.shapeHeight;
      const l = Math.sqrt(r * r + h * h);
      return [
        { label: 'Volume V', value: `${((1 / 3) * Math.PI * r * r * h).toFixed(2)} u³` },
        { label: 'Slant Height l', value: `${l.toFixed(2)} u` },
        { label: 'Total Area A', value: `${(Math.PI * r * (r + l)).toFixed(2)} u²` },
      ];
    }
    case 'math_pyramid': {
      const a = p.shapeRadius;
      const h = p.shapeHeight;
      const slant = Math.sqrt((a / 2) ** 2 + h * h);
      return [
        { label: 'Volume V', value: `${((a * a * h) / 3).toFixed(2)} u³` },
        { label: 'Total Area A', value: `${(a * a + 2 * a * slant).toFixed(2)} u²` },
        { label: 'Slant Apothem', value: `${slant.toFixed(2)} u` },
      ];
    }
    case 'math_torus': {
      const R = p.majorRadius;
      const r = p.shapeRadius;
      return [
        { label: 'Volume V', value: `${(2 * Math.PI * Math.PI * R * r * r).toFixed(2)} u³` },
        { label: 'Surface Area A', value: `${(4 * Math.PI * Math.PI * R * r).toFixed(2)} u²` },
        { label: 'Aspect Ratio R/r', value: `${(R / r).toFixed(2)}` },
      ];
    }
    case 'math_vectors_3d': {
      const rad = (p.angleDeg * Math.PI) / 180;
      const dot = p.vecA * p.vecB * Math.cos(rad);
      const cross = p.vecA * p.vecB * Math.sin(rad);
      return [
        { label: 'Dot A · B', value: `${dot.toFixed(2)}` },
        { label: 'Cross |A × B|', value: `${cross.toFixed(2)} u²` },
        { label: 'Parallelogram Area', value: `${cross.toFixed(2)} u²` },
      ];
    }
    case 'chem_methane':
      return [
        { label: 'Bond Angle', value: '109.47°' },
        { label: 'C-H Length', value: `${(1.09 * p.scaleFactor).toFixed(2)} Å` },
        { label: 'Hybridization', value: 'sp³ Tetrahedral' },
      ];
    case 'chem_water': {
      const dipole = 1.85 * Math.cos(((p.angleDeg / 2) * Math.PI) / 180) / Math.cos((52.25 * Math.PI) / 180);
      return [
        { label: 'H-O-H Angle', value: `${p.angleDeg.toFixed(1)}°` },
        { label: 'Dipole Moment μ', value: `${dipole.toFixed(2)} D` },
        { label: 'Geometry', value: 'Bent (2 Lone Pairs)' },
      ];
    }
    case 'chem_ideal_gas': {
      const R = 0.08206;
      const pressure = (p.moles * R * p.temperature) / p.volumeL;
      const vRms = Math.sqrt((3 * 8.314 * p.temperature) / 0.028);
      return [
        { label: 'Pressure P', value: `${pressure.toFixed(2)} atm` },
        { label: 'v_rms (N₂)', value: `${vRms.toFixed(0)} m/s` },
        { label: 'PV Product', value: `${(pressure * p.volumeL).toFixed(2)} L·atm` },
      ];
    }
    case 'chem_lattice':
      return [
        { label: 'Lattice Edge a', value: `${(5.64 * p.scaleFactor).toFixed(2)} Å` },
        { label: 'Coordination', value: '6 : 6 Octahedral' },
        { label: 'Crystal System', value: 'FCC Cubic (NaCl)' },
      ];
    case 'chem_benzene':
      return [
        { label: 'Aromatic π e⁻', value: '6 Delocalized' },
        { label: 'C-C Bond Order', value: '1.5 (Resonance)' },
        { label: 'C-C Length', value: `${(1.39 * p.scaleFactor).toFixed(2)} Å` },
      ];
    case 'bio_dna':
      return [
        { label: 'Helix Pitch', value: `${(3.4 * p.concentration).toFixed(2)} nm` },
        { label: 'Diameter', value: `${(2.0 * p.scaleFactor).toFixed(2)} nm` },
        { label: 'Pairing Rule', value: 'A=T, G≡C' },
      ];
    case 'bio_cell': {
      const r = p.shapeRadius;
      const saV = 3 / r;
      return [
        { label: 'SA / V Ratio', value: `${saV.toFixed(2)} μm⁻¹` },
        { label: 'Cell Volume', value: `${((4 / 3) * Math.PI * r ** 3).toFixed(1)} μm³` },
        { label: 'Diffusion Flux J', value: `${(p.concentration * saV * 12).toFixed(1)} nmol/s` },
      ];
    }
    case 'bio_rbc': {
      const sat = (100 * (p.concentration ** 2.8)) / (0.35 ** 2.8 + p.concentration ** 2.8);
      return [
        { label: 'HbO₂ Saturation', value: `${sat.toFixed(1)}%` },
        { label: 'Diameter 2R', value: `${(p.shapeRadius * 3.8).toFixed(1)} μm` },
        { label: 'Bound O₂ / Hb', value: `${((sat / 100) * 4).toFixed(2)} mol` },
      ];
    }
    case 'bio_mitochondria': {
      const atpRate = 32 * p.concentration * p.spinRate;
      return [
        { label: 'ATP Yield / Glucose', value: '30–32 ATP' },
        { label: 'Relative Flux', value: `${atpRate.toFixed(1)} mmol/s` },
        { label: 'Proton Force ΔpH', value: `${p.concentration.toFixed(1)}` },
      ];
    }
    case 'bio_neuron': {
      const vCond = 12 * Math.sqrt(p.shapeRadius) * (1 + (p.temperature - 300) * 0.01);
      return [
        { label: 'Conduction v', value: `${vCond.toFixed(1)} m/s` },
        { label: 'Spike Rate', value: `${p.waveFreq.toFixed(1)} Hz` },
        { label: 'Resting / Peak V', value: '-70 / +40 mV' },
      ];
    }
  }
}
