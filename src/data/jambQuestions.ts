import { JambQuestion } from '../types';

export const JAMB_QUESTIONS: JambQuestion[] = [
  // Physics 1 - Equations of Motion
  {
    id: 'jamb_phy_01',
    subject: 'Physics',
    exam: 'JAMB UTME',
    year: '2023',
    topic: 'Equations of Motion',
    question:
      'A car uniformly accelerates from rest at 2 m/s² for 10 seconds. Calculate the total distance covered by the car.',
    options: {
      A: '50 m',
      B: '100 m',
      C: '150 m',
      D: '200 m',
    },
    correctAnswer: 'B',
    formula: 's = ut + ½at²',
    steps: [
      'Given: Initial velocity u = 0 m/s (starts from rest)',
      'Acceleration a = 2 m/s²',
      'Time t = 10 s',
      'Formula: s = ut + ½at²',
      'Substitution: s = (0 × 10) + ½ × 2 × (10)²',
      'Calculation: s = 0 + 1 × 100 = 100 m',
    ],
    explanation:
      'Since the car starts from rest, u = 0. The displacement is purely determined by the acceleration term ½at² = 0.5 × 2 × 100 = 100 m.',
    examTip: 'Whenever a question says "from rest", instantly set u = 0. If it says "brought to rest / stops", set v = 0.',
  },

  // Physics 2 - Specific Heat Capacity
  {
    id: 'jamb_phy_02',
    subject: 'Physics',
    exam: 'WAEC SSCE',
    year: '2022',
    topic: 'Heat & Temperature',
    question:
      'How much heat energy is required to raise the temperature of 2 kg of water from 20°C to 70°C? (Specific heat capacity of water c = 4200 J/kg·K)',
    options: {
      A: '210,000 J',
      B: '420,000 J',
      C: '504,000 J',
      D: '840,000 J',
    },
    correctAnswer: 'B',
    formula: 'Q = mcΔθ',
    steps: [
      'Given: Mass m = 2 kg',
      'Specific heat capacity c = 4200 J/kg·K',
      'Temperature rise Δθ = 70°C - 20°C = 50°C (or 50 K)',
      'Formula: Q = mcΔθ',
      'Substitution: Q = 2 × 4200 × 50',
      'Calculation: Q = 420,000 J (or 420 kJ)',
    ],
    explanation:
      'Heat gained Q depends directly on mass, specific heat capacity, and temperature difference. Q = 2 × 4200 × 50 = 420,000 J.',
    examTip: 'Temperature difference in Celsius (°C) is numerically identical to temperature difference in Kelvin (K).',
  },

  // Physics 3 - Ohm's Law & Resistors in Parallel
  {
    id: 'jamb_phy_03',
    subject: 'Physics',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Current Electricity',
    question:
      'Two resistors of resistance 6 Ω and 3 Ω are connected in parallel. What is the equivalent resistance of the combination?',
    options: {
      A: '2 Ω',
      B: '4.5 Ω',
      C: '9 Ω',
      D: '18 Ω',
    },
    correctAnswer: 'A',
    formula: '1/R_eq = 1/R₁ + 1/R₂  (or R_eq = (R₁ × R₂) / (R₁ + R₂))',
    steps: [
      'Given: R₁ = 6 Ω, R₂ = 3 Ω',
      'Formula for two parallel resistors: R_eq = (product) / (sum)',
      'Substitution: R_eq = (6 × 3) / (6 + 3)',
      'Calculation: R_eq = 18 / 9 = 2 Ω',
    ],
    explanation:
      'For two resistors in parallel, equivalent resistance is always smaller than the smallest individual resistor. Here 2 Ω < 3 Ω.',
    examTip: 'Shortcut for two parallel resistors: R_eq = (R1 × R2) / (R1 + R2). Saves immense time in JAMB!',
  },

  // Physics 4 - Optics / Lens Formula
  {
    id: 'jamb_phy_04',
    subject: 'Physics',
    exam: 'WAEC SSCE',
    year: '2021',
    topic: 'Optics & Lenses',
    question:
      'An object is placed 15 cm in front of a converging (convex) lens of focal length 10 cm. Find the image distance v.',
    options: {
      A: '6 cm',
      B: '15 cm',
      C: '30 cm',
      D: '25 cm',
    },
    correctAnswer: 'C',
    formula: '1/f = 1/u + 1/v => 1/v = 1/f - 1/u',
    steps: [
      'Given: Focal length f = +10 cm (convex lens), Object distance u = +15 cm',
      'Formula: 1/f = 1/u + 1/v',
      'Rearrange for 1/v: 1/v = 1/10 - 1/15',
      'Common denominator (30): 1/v = 3/30 - 2/30 = 1/30',
      'Inverting gives: v = 30 cm',
    ],
    explanation:
      'The image is real, inverted, and formed 30 cm behind the lens. Magnification m = v/u = 30/15 = 2.',
    examTip: 'For real-is-positive convention: Convex lens has positive f (+10). Concave lens has negative f (-10).',
  },

  // Physics 5 - Work, Energy & Power
  {
    id: 'jamb_phy_05',
    subject: 'Physics',
    exam: 'JAMB UTME',
    year: '2023',
    topic: 'Work, Energy & Power',
    question:
      'An electric motor raises a load of 500 N through a vertical height of 10 m in 20 seconds. What is the power output of the motor?',
    options: {
      A: '100 W',
      B: '250 W',
      C: '500 W',
      D: '1,000 W',
    },
    correctAnswer: 'B',
    formula: 'Power P = Work / Time = (Force × distance) / Time',
    steps: [
      'Given: Force (weight) F = 500 N, Distance h = 10 m, Time t = 20 s',
      'Work done W = F × d = 500 × 10 = 5,000 J',
      'Power P = W / t = 5000 / 20 = 250 W',
    ],
    explanation: 'Power is the rate of doing work. 5000 J transferred over 20 s gives an average power of 250 W.',
    examTip: 'Check units: Watts = Joules/second (W = J/s). If given in minutes, always convert to seconds!',
  },

  // Physics 6 - Waves & Sound
  {
    id: 'jamb_phy_06',
    subject: 'Physics',
    exam: 'WAEC SSCE',
    year: '2020',
    topic: 'Waves & Sound',
    question:
      'A radio station broadcasts electromagnetic waves of frequency 100 MHz. What is the wavelength of the waves? (Speed of light c = 3 × 10⁸ m/s)',
    options: {
      A: '0.3 m',
      B: '3.0 m',
      C: '30 m',
      D: '300 m',
    },
    correctAnswer: 'B',
    formula: 'v = fλ => λ = v / f',
    steps: [
      'Given: Speed v = c = 3 × 10⁸ m/s',
      'Frequency f = 100 MHz = 100 × 10⁶ Hz = 1 × 10⁸ Hz',
      'Formula: λ = c / f',
      'Substitution: λ = (3 × 10⁸) / (1 × 10⁸) = 3.0 m',
    ],
    explanation: 'Radio waves are electromagnetic waves travelling at the speed of light c. λ = 3.0 m.',
    examTip: 'Remember SI prefixes: Mega (M) = 10⁶, kilo (k) = 10³, micro (µ) = 10⁻⁶.',
  },

  // Math 1 - Quadratic Equations
  {
    id: 'jamb_math_01',
    subject: 'Mathematics',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Algebra & Quadratic Equations',
    question:
      'Solve the quadratic equation: 2x² - 5x - 3 = 0. What are the values of x?',
    options: {
      A: 'x = 3 or x = -½',
      B: 'x = -3 or x = ½',
      C: 'x = 2 or x = -3',
      D: 'x = 1 or x = -3/2',
    },
    correctAnswer: 'A',
    formula: 'x = [-b ± √(b² - 4ac)] / (2a)',
    steps: [
      'Given: a = 2, b = -5, c = -3',
      'Product ac = 2 × (-3) = -6. Sum b = -5.',
      'Two factors of -6 that sum to -5 are -6 and +1.',
      'Split middle term: 2x² - 6x + x - 3 = 0',
      'Group terms: 2x(x - 3) + 1(x - 3) = 0',
      'Factorized form: (2x + 1)(x - 3) = 0',
      'Roots: 2x + 1 = 0 => x = -½; x - 3 = 0 => x = 3',
    ],
    explanation: 'The roots of 2x² - 5x - 3 = 0 are x = 3 and x = -½.',
    examTip: 'You can test roots quickly in the options by substituting x = 3: 2(9) - 5(3) - 3 = 18 - 15 - 3 = 0.',
  },

  // Math 2 - Arithmetic Progression (AP)
  {
    id: 'jamb_math_02',
    subject: 'Mathematics',
    exam: 'WAEC SSCE',
    year: '2023',
    topic: 'Sequences & Series',
    question:
      'The 3rd term of an Arithmetic Progression (AP) is 10 and the 8th term is 25. Find the first term (a) and common difference (d).',
    options: {
      A: 'a = 2, d = 4',
      B: 'a = 4, d = 3',
      C: 'a = 3, d = 5',
      D: 'a = 5, d = 2',
    },
    correctAnswer: 'B',
    formula: 'T_n = a + (n - 1)d',
    steps: [
      '3rd term: T₃ = a + 2d = 10  --- (Eq 1)',
      '8th term: T₈ = a + 7d = 25  --- (Eq 2)',
      'Subtract Eq 1 from Eq 2: (a + 7d) - (a + 2d) = 25 - 10',
      '5d = 15 => d = 3',
      'Substitute d = 3 into Eq 1: a + 2(3) = 10 => a + 6 = 10 => a = 4',
    ],
    explanation: 'The common difference is d = 3 and the first term is a = 4.',
    examTip: 'Subtracting linear terms in AP eliminates "a" immediately!',
  },

  // Math 3 - Calculus / Differentiation
  {
    id: 'jamb_math_03',
    subject: 'Mathematics',
    exam: 'JAMB UTME',
    year: '2022',
    topic: 'Calculus: Differentiation',
    question:
      'Find the gradient (derivative) of the curve y = 3x³ - 5x² + 4 at the point where x = 2.',
    options: {
      A: '12',
      B: '16',
      C: '20',
      D: '24',
    },
    correctAnswer: 'B',
    formula: 'dy/dx = d/dx [a·xⁿ] = a·n·xⁿ⁻¹',
    steps: [
      'Given: y = 3x³ - 5x² + 4',
      'Differentiate with respect to x: dy/dx = 3(3x²) - 5(2x) + 0',
      'dy/dx = 9x² - 10x',
      'Evaluate at x = 2: dy/dx = 9(2)² - 10(2)',
      'Calculation: dy/dx = 9(4) - 20 = 36 - 20 = 16',
    ],
    explanation: 'The gradient of the curve at x = 2 is 16.',
    examTip: 'The derivative of any constant (like +4) is always 0.',
  },

  // Math 4 - Coordinate Geometry
  {
    id: 'jamb_math_04',
    subject: 'Mathematics',
    exam: 'WAEC SSCE',
    year: '2021',
    topic: 'Coordinate Geometry',
    question:
      'Find the distance between the points P(1, 2) and Q(4, 6).',
    options: {
      A: '3 units',
      B: '4 units',
      C: '5 units',
      D: '7 units',
    },
    correctAnswer: 'C',
    formula: 'd = √[(x₂ - x₁)² + (y₂ - y₁)²]',
    steps: [
      'Given: P(x₁ = 1, y₁ = 2) and Q(x₂ = 4, y₂ = 6)',
      'x₂ - x₁ = 4 - 1 = 3',
      'y₂ - y₁ = 6 - 2 = 4',
      'd = √[3² + 4²] = √[9 + 16] = √25 = 5 units',
    ],
    explanation: 'This is the standard 3-4-5 Pythagorean right-angled triangle in Cartesian coordinates.',
    examTip: 'Recognize Pythagorean triples (3-4-5, 5-12-13, 8-15-17) to answer instantly without full arithmetic.',
  },

  // Math 5 - Statistics
  {
    id: 'jamb_math_05',
    subject: 'Mathematics',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Statistics',
    question:
      'The mean of the numbers 2, 5, 8, x, and 12 is 7. What is the value of x?',
    options: {
      A: '6',
      B: '7',
      C: '8',
      D: '9',
    },
    correctAnswer: 'C',
    formula: 'Mean = (Sum of values) / (Total count)',
    steps: [
      'Count of values n = 5',
      'Formula: Mean = (2 + 5 + 8 + x + 12) / 5 = 7',
      'Sum of known numbers: 2 + 5 + 8 + 12 = 27',
      'Equation: (27 + x) / 5 = 7',
      'Multiply both sides by 5: 27 + x = 35',
      'Solve for x: x = 35 - 27 = 8',
    ],
    explanation: 'The sum of all 5 numbers is 7 × 5 = 35. Since the 4 known numbers sum to 27, x must be 35 - 27 = 8.',
    examTip: 'Sum = Mean × Number of items. Total sum = 7 × 5 = 35.',
  },

  // Physics 7 - Projectile Motion
  {
    id: 'jamb_phy_07',
    subject: 'Physics',
    exam: 'JAMB UTME',
    year: '2021',
    topic: 'Projectile Motion',
    question:
      'A projectile is launched with an initial velocity of 40 m/s at an angle of 30° to the horizontal. Calculate the maximum height reached. (Take g = 10 m/s²)',
    options: {
      A: '10 m',
      B: '20 m',
      C: '30 m',
      D: '40 m',
    },
    correctAnswer: 'B',
    formula: 'H_max = (u² sin² θ) / (2g)',
    steps: [
      'Given: u = 40 m/s, θ = 30°, g = 10 m/s²',
      'sin(30°) = 0.5',
      'u sin θ = 40 × 0.5 = 20 m/s (initial vertical velocity)',
      'H_max = (20)² / (2 × 10) = 400 / 20 = 20 m',
    ],
    explanation:
      'At maximum height, vertical velocity is 0. Using v_y² = u_y² - 2gH => 0 = 20² - 2(10)H => H = 20 m.',
    examTip: 'sin(30°) = 0.5, cos(60°) = 0.5, sin(90°) = 1. Memorizing these special angles saves time!',
  },

  // Math 6 - Permutations & Combinations
  {
    id: 'jamb_math_06',
    subject: 'Mathematics',
    exam: 'JAMB UTME',
    year: '2023',
    topic: 'Permutations & Combinations',
    question:
      'In how many ways can a committee of 3 students be chosen from a group of 7 students?',
    options: {
      A: '21',
      B: '35',
      C: '42',
      D: '210',
    },
    correctAnswer: 'B',
    formula: 'ⁿCᵣ = n! / [r!(n - r)!]',
    steps: [
      'Here order does NOT matter, so we use Combinations (⁷C₃)',
      'n = 7, r = 3',
      '⁷C₃ = 7! / [3! × (7 - 3)!] = 7! / [3! × 4!]',
      'Calculation: (7 × 6 × 5) / (3 × 2 × 1) = 210 / 6 = 35',
    ],
    explanation: 'There are 35 distinct ways to choose 3 students out of 7.',
    examTip: 'Committee or selection without specific roles = Combinations (C). Arranging letters or ranking positions = Permutations (P).',
  },
];
