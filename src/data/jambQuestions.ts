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

  // Biology 1 - Cell Biology & Genetics
  {
    id: 'jamb_bio_01',
    subject: 'Biology',
    exam: 'JAMB/UTME',
    year: '2024',
    topic: 'Genetics & Heredity',
    question:
      'In humans, normal pigmentation is dominant over albinism. If two heterozygous parents (Aa) have children, what is the probability that their first child will be an albino?',
    options: {
      A: '0%',
      B: '25% (1/4)',
      C: '50% (1/2)',
      D: '75% (3/4)',
    },
    correctAnswer: 'B',
    formula: 'Mendelian Monohybrid Cross (Aa × Aa)',
    steps: [
      'Parental Genotypes: Aa × Aa',
      'Gametes: A, a and A, a',
      'Offspring Genotypes: 1 AA (Normal), 2 Aa (Carrier Normal), 1 aa (Albino)',
      'Albino phenotype corresponds to the homozygous recessive genotype (aa)',
      'Probability = 1 / 4 = 25%',
    ],
    explanation:
      'A monohybrid cross of two heterozygous carriers yields a phenotypic ratio of 3 normal to 1 albino. The probability of having an albino child is 1 in 4 (25%).',
    examTip: 'Remember that each pregnancy is an independent event with exactly the same 25% probability.',
  },

  // English 1 - Concord & Lexis
  {
    id: 'jamb_eng_01',
    subject: 'English',
    exam: 'JAMB/UTME',
    year: '2024',
    topic: 'Concord & Grammatical Agreement',
    question:
      'Choose the option that best completes the sentence: "The chairman, as well as the members of the board of directors, ________ present at the inauguration ceremony yesterday."',
    options: {
      A: 'were',
      B: 'was',
      C: 'are',
      D: 'have been',
    },
    correctAnswer: 'B',
    formula: 'Subject-Verb Concord with Parenthetical Expressions',
    steps: [
      'Identify the true grammatical subject: "The chairman" (singular)',
      'Analyze the phrase "as well as the members...": this is a parenthetical quasi-coordinator, not a conjunction that pluralizes the subject',
      'A singular subject requires a singular verb: "was"',
      'Tense marker "yesterday" confirms past tense ("was", not "is")',
    ],
    explanation:
      'When phrases like "as well as", "together with", "in addition to", or "accompanied by" connect two nouns, the verb strictly agrees with the FIRST subject ("The chairman", which is singular).',
    examTip: 'Ignore all intervening parenthetical words between commas when matching subject and verb in JAMB/WAEC English.',
  },

  // Chemistry 4 - Gas Laws / Ideal Gas Equation
  {
    id: 'jamb_chem_04',
    subject: 'Chemistry',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Gas Laws & Molar Volume',
    question: 'Calculate the volume occupied by $0.5\\text{ moles}$ of an ideal gas at standard temperature and pressure (STP). [Molar volume of gas at STP $= 22.4\\text{ dm}^3\\text{mol}^{-1}$]',
    options: {
      A: '5.6 dm³',
      B: '11.2 dm³',
      C: '22.4 dm³',
      D: '44.8 dm³',
    },
    correctAnswer: 'B',
    formula: 'V = n \\times V_m',
    steps: [
      'Given: Number of moles n = 0.5 mol',
      'Molar gas volume at STP V_m = 22.4 dm³/mol',
      'Formula: V = n × V_m',
      'Substitution: V = 0.5 × 22.4',
      'Calculation: V = 11.2 dm³ (or 11,200 cm³)',
    ],
    explanation: 'One mole of any ideal gas occupies 22.4 dm³ at STP (0°C, 1 atm). Therefore, 0.5 mol occupies half that volume: 11.2 dm³.',
    examTip: 'Remember that 1 dm³ = 1000 cm³ = 1 Liter.',
  },

  // Chemistry 5 - Periodic Table & Electron Configuration
  {
    id: 'jamb_chem_05',
    subject: 'Chemistry',
    exam: 'WAEC SSCE',
    year: '2023',
    topic: 'Atomic Structure & Periodicity',
    question: 'An element X has atomic number 17. What is its group and period in the Periodic Table?',
    options: {
      A: 'Group 7, Period 3',
      B: 'Group 3, Period 7',
      C: 'Group 5, Period 3',
      D: 'Group 7, Period 4',
    },
    correctAnswer: 'A',
    formula: '\\text{Electronic Configuration: } 1s^2 2s^2 2p^6 3s^2 3p^5',
    steps: [
      'Atomic number Z = 17 (Chlorine)',
      'Shell configuration: 2, 8, 7',
      'Number of valence electrons (outermost shell) = 7, which gives Group 7 (Halogens)',
      'Number of occupied energy levels (shells) = 3, which gives Period 3',
    ],
    explanation: 'Period is determined by the highest principal quantum number n (3 shells = Period 3). Group is determined by valence electrons (7 electrons = Group 7 / Group 17).',
    examTip: 'Number of shells = Period; Number of valence electrons = Group.',
  },

  // Chemistry 6 - Faraday Laws of Electrolysis
  {
    id: 'jamb_chem_06',
    subject: 'Chemistry',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Electrochemistry & Faraday Laws',
    question: 'How many Faradays of electricity are required to deposit $0.2\\text{ moles}$ of Copper from a solution of $\\text{CuSO}_4$? [Half-reaction: $\\text{Cu}^{2+} + 2e^- \\rightarrow \\text{Cu}$]',
    options: {
      A: '0.1 F',
      B: '0.2 F',
      C: '0.4 F',
      D: '0.8 F',
    },
    correctAnswer: 'C',
    formula: 'Q = n \\times z \\text{ Faradays}',
    steps: [
      'Given: Moles of copper deposited n = 0.2 mol',
      'Valency factor z = 2 (Cu²⁺ requires 2 moles of electrons per mole of Cu)',
      'Formula: Faradays required = n × z',
      'Substitution: 0.2 × 2 = 0.4 F',
    ],
    explanation: 'Depositing 1 mole of Cu²⁺ requires 2 Faradays of charge. Therefore, 0.2 mol requires 0.2 × 2 = 0.4 F (or 0.4 × 96,500 C = 38,600 C).',
    examTip: 'Always check the charge of the cation in solution: Cu²⁺ requires 2F, Al³⁺ requires 3F, Ag⁺ requires 1F.',
  },

  // Chemistry 7 - Chemical Equilibrium (Le Chatelier)
  {
    id: 'jamb_chem_07',
    subject: 'Chemistry',
    exam: 'WAEC SSCE',
    year: '2022',
    topic: 'Chemical Equilibrium',
    question: 'For the exothermic synthesis of ammonia: $\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g), \\ \\Delta H = -92\\text{ kJ}$, what change increases the yield of $\\text{NH}_3$?',
    options: {
      A: 'Increasing temperature',
      B: 'Increasing pressure',
      C: 'Decreasing pressure',
      D: 'Adding an inert gas at constant volume',
    },
    correctAnswer: 'B',
    formula: 'Le Chatelier Principle: \\Delta n_{gas} = 2 - (1 + 3) = -2',
    steps: [
      'Gaseous moles on reactant side = 1 + 3 = 4 moles',
      'Gaseous moles on product side = 2 moles',
      'Increasing pressure shifts equilibrium toward fewer gas molecules (product side, yielding more NH₃)',
      'Since forward reaction is exothermic, increasing temperature would unfavorably shift it left',
    ],
    explanation: 'By Le Chatelier principle, increasing pressure shifts the position of equilibrium toward the side with fewer moles of gas (from 4 moles to 2 moles), thus increasing the equilibrium yield of ammonia.',
    examTip: 'High pressure favors the side with fewer gaseous moles. Low temperature favors exothermic reactions.',
  },

  // Chemistry 8 - Organic Chemistry (Alkanes & Combustion)
  {
    id: 'jamb_chem_08',
    subject: 'Chemistry',
    exam: 'JAMB UTME',
    year: '2023',
    topic: 'Organic Chemistry & Hydrocarbons',
    question: 'What is the volume of Oxygen gas required for the complete combustion of $20\\text{ cm}^3$ of Propane ($\\text{C}_3\\text{H}_8$)? [$\\text{C}_3\\text{H}_8 + 5\\text{O}_2 \\rightarrow 3\\text{CO}_2 + 4\\text{H}_2\\text{O}$]',
    options: {
      A: '20 cm³',
      B: '60 cm³',
      C: '80 cm³',
      D: '100 cm³',
    },
    correctAnswer: 'D',
    formula: 'Gay-Lussac Law of Combining Volumes: \\text{Volume ratio} = 1 : 5',
    steps: [
      'Balanced equation: C₃H₈(g) + 5O₂(g) → 3CO₂(g) + 4H₂O(l)',
      'Volume ratio of C₃H₈ : O₂ = 1 : 5',
      'Volume of C₃H₈ reacting = 20 cm³',
      'Volume of O₂ required = 20 × 5 = 100 cm³',
    ],
    explanation: 'According to Gay-Lussac Law of Combining Volumes, gases react in simple whole-number volume ratios. 1 volume of C₃H₈ requires 5 volumes of O₂, so 20 cm³ requires 100 cm³ of O₂.',
    examTip: 'Ensure chemical equations are fully balanced before applying Gay-Lussac volume ratios.',
  },

  // Math 3 - Differentiation / Calculus
  {
    id: 'jamb_math_03',
    subject: 'Mathematics',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Calculus (Differentiation)',
    question: 'Find the derivative $\\frac{dy}{dx}$ if $y = 3x^4 - 5x^2 + 7x - 9$.',
    options: {
      A: '12x³ - 10x + 7',
      B: '12x³ - 5x + 7',
      C: '3x³ - 10x + 7',
      D: '12x⁴ - 10x² + 7',
    },
    correctAnswer: 'A',
    formula: '\\frac{d}{dx}(ax^n) = n \\cdot a \\cdot x^{n-1}',
    steps: [
      'Derivative of 3x⁴ = 4 × 3x³ = 12x³',
      'Derivative of -5x² = 2 × (-5)x = -10x',
      'Derivative of 7x = 7',
      'Derivative of constant -9 = 0',
      'Combining terms: dy/dx = 12x³ - 10x + 7',
    ],
    explanation: 'Differentiating term by term using the power rule yields 12x³ - 10x + 7.',
    examTip: 'The derivative of any constant term (without x) is always 0.',
  },

  // Math 4 - Integration / Calculus
  {
    id: 'jamb_math_04',
    subject: 'Mathematics',
    exam: 'JAMB UTME',
    year: '2023',
    topic: 'Calculus (Integration)',
    question: 'Evaluate the definite integral: $\\int_{1}^{3} (2x + 3) \\, dx$.',
    options: {
      A: '10',
      B: '14',
      C: '16',
      D: '18',
    },
    correctAnswer: 'B',
    formula: '\\int (ax + b) \\, dx = \\frac{a x^2}{2} + bx',
    steps: [
      'Indefinite integral: ∫(2x + 3) dx = x² + 3x',
      'Evaluate at upper limit x = 3: (3)² + 3(3) = 9 + 9 = 18',
      'Evaluate at lower limit x = 1: (1)² + 3(1) = 1 + 3 = 4',
      'Subtract: 18 - 4 = 14',
    ],
    explanation: 'By the Fundamental Theorem of Calculus, [x² + 3x] from 1 to 3 equals F(3) - F(1) = 18 - 4 = 14.',
    examTip: 'Always calculate upper limit first, then subtract lower limit: F(b) - F(a).',
  },

  // Math 5 - Matrices & Determinants
  {
    id: 'jamb_math_05',
    subject: 'Mathematics',
    exam: 'WAEC SSCE',
    year: '2023',
    topic: 'Matrices & Determinants',
    question: 'Find the determinant of the $2 \\times 2$ matrix $M = \\begin{pmatrix} 4 & 2 \\\\ 3 & 5 \\end{pmatrix}$.',
    options: {
      A: '14',
      B: '26',
      C: '10',
      D: '6',
    },
    correctAnswer: 'A',
    formula: '\\det(M) = ad - bc',
    steps: [
      'Identify elements: a = 4, b = 2, c = 3, d = 5',
      'Main diagonal product: ad = 4 × 5 = 20',
      'Off-diagonal product: bc = 2 × 3 = 6',
      'Formula: det(M) = 20 - 6 = 14',
    ],
    explanation: 'The determinant of a 2x2 matrix is the product of the main diagonal minus the product of the secondary diagonal: 4(5) - 2(3) = 14.',
    examTip: 'Watch signs carefully when off-diagonal elements are negative.',
  },

  // Math 6 - Arithmetic Progression (AP)
  {
    id: 'jamb_math_06',
    subject: 'Mathematics',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Sequences & Series (AP)',
    question: 'The first term of an Arithmetic Progression is 5 and the common difference is 3. Find the 20th term.',
    options: {
      A: '58',
      B: '62',
      C: '65',
      D: '68',
    },
    correctAnswer: 'B',
    formula: 'T_n = a + (n - 1)d',
    steps: [
      'Given: First term a = 5',
      'Common difference d = 3',
      'Term number n = 20',
      'Formula: T₂₀ = 5 + (20 - 1) × 3',
      'Calculation: T₂₀ = 5 + 19 × 3 = 5 + 57 = 62',
    ],
    explanation: 'In an AP, the nth term increases by (n-1) steps of the common difference d. 5 + 19(3) = 62.',
    examTip: 'Remember it is (n-1)d, not nd.',
  },

  // Math 7 - Trigonometry & Bearing
  {
    id: 'jamb_math_07',
    subject: 'Mathematics',
    exam: 'JAMB UTME',
    year: '2023',
    topic: 'Trigonometry & Bearing',
    question: 'If $\\sin \\theta = \\frac{3}{5}$ where $\\theta$ is an acute angle, find the exact value of $\\cos \\theta$.',
    options: {
      A: '4/5',
      B: '3/4',
      C: '5/4',
      D: '1/2',
    },
    correctAnswer: 'A',
    formula: '\\sin^2 \\theta + \\cos^2 \\theta = 1',
    steps: [
      'Using Pythagorean identity: cos²θ = 1 - sin²θ',
      'Substitution: cos²θ = 1 - (3/5)² = 1 - 9/25 = 16/25',
      'Taking square root (acute angle, so positive): cos θ = 4/5',
    ],
    explanation: 'This corresponds to the classic 3-4-5 right-angled triangle. Opposite = 3, Hypotenuse = 5, Adjacent = 4, thus cos θ = Adjacent / Hypotenuse = 4/5.',
    examTip: 'Familiarize yourself with standard Pythagorean triples: (3, 4, 5), (5, 12, 13), (7, 24, 25).',
  },

  // Physics 7 - Projectile Motion (Maximum Height)
  {
    id: 'jamb_phy_07',
    subject: 'Physics',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Projectiles & Equations of Motion',
    question: 'A ball is launched with initial speed $20\\text{ m/s}$ at an angle of $30^\\circ$ to the horizontal. What is the maximum vertical height reached? [$g = 10\\text{ m/s}^2$]',
    options: {
      A: '5 m',
      B: '10 m',
      C: '15 m',
      D: '20 m',
    },
    correctAnswer: 'A',
    formula: 'H_{\\max} = \\frac{u^2 \\sin^2 \\theta}{2g}',
    steps: [
      'Given: Initial speed u = 20 m/s, θ = 30°, g = 10 m/s²',
      'sin(30°) = 0.5 => sin²(30°) = 0.25',
      'Formula: H_max = (20² × 0.25) / (2 × 10)',
      'Calculation: H_max = (400 × 0.25) / 20 = 100 / 20 = 5 m',
    ],
    explanation: 'Maximum height depends only on the vertical component of velocity u_y = u sin θ = 10 m/s. H = u_y² / 2g = 100 / 20 = 5 m.',
    examTip: 'At maximum height, the vertical velocity v_y is instantaneously zero, while horizontal velocity remains u cos θ.',
  },

  // Physics 8 - Transformer Formula
  {
    id: 'jamb_phy_08',
    subject: 'Physics',
    exam: 'WAEC SSCE',
    year: '2023',
    topic: 'Electromagnetic Induction & Transformers',
    question: 'A step-down transformer has 1,000 turns in the primary winding and 200 turns in the secondary winding. If the primary voltage is $240\\text{ V}$, what is the secondary voltage?',
    options: {
      A: '24 V',
      B: '48 V',
      C: '120 V',
      D: '1,200 V',
    },
    correctAnswer: 'B',
    formula: '\\frac{V_s}{V_p} = \\frac{N_s}{N_p}',
    steps: [
      'Given: Primary turns N_p = 1000, Secondary turns N_s = 200',
      'Primary voltage V_p = 240 V',
      'Formula: V_s = V_p × (N_s / N_p)',
      'Substitution: V_s = 240 × (200 / 1000) = 240 × 0.2',
      'Calculation: V_s = 48 V',
    ],
    explanation: 'In an ideal transformer, the voltage ratio equals the turns ratio. Because secondary turns are 1/5 of primary, voltage drops to 240 / 5 = 48 V.',
    examTip: 'Step-down reduces voltage (N_s < N_p). Step-up increases voltage (N_s > N_p).',
  },

  // Physics 9 - Photoelectric Effect
  {
    id: 'jamb_phy_09',
    subject: 'Physics',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Modern Physics & Photoelectric Effect',
    question: 'Einstein photoelectric equation is $E = W_0 + K_{\\max}$. If the work function $W_0 = 2.5\\text{ eV}$ and incident photon energy $E = 4.0\\text{ eV}$, what is the maximum kinetic energy of the emitted photoelectrons?',
    options: {
      A: '1.5 eV',
      B: '2.5 eV',
      C: '4.0 eV',
      D: '6.5 eV',
    },
    correctAnswer: 'A',
    formula: 'K_{\\max} = E - W_0 = hf - W_0',
    steps: [
      'Given: Incident photon energy E = 4.0 eV',
      'Work function W_0 = 2.5 eV',
      'Formula: K_max = E - W_0',
      'Calculation: K_max = 4.0 - 2.5 = 1.5 eV',
    ],
    explanation: 'Energy of the photon is divided between liberating the electron (work function) and imparting kinetic energy to it. K_max = 4.0 - 2.5 = 1.5 eV.',
    examTip: 'Photoemission only occurs when photon energy E is greater than or equal to the work function W_0 (i.e. frequency f ≥ threshold frequency f_0).',
  },

  // Physics 10 - Thermal Physics / Boyle Law
  {
    id: 'jamb_phy_10',
    subject: 'Physics',
    exam: 'JAMB UTME',
    year: '2022',
    topic: 'Thermal Physics & Gas Laws',
    question: 'A fixed mass of gas at constant temperature occupies a volume of $400\\text{ cm}^3$ at a pressure of $750\\text{ mmHg}$. If the pressure is increased to $1000\\text{ mmHg}$, what is the new volume?',
    options: {
      A: '200 cm³',
      B: '300 cm³',
      C: '450 cm³',
      D: '533 cm³',
    },
    correctAnswer: 'B',
    formula: 'P_1 V_1 = P_2 V_2 \\text{ (Boyle Law)}',
    steps: [
      'Given: P₁ = 750 mmHg, V₁ = 400 cm³',
      'P₂ = 1000 mmHg',
      'Formula: V₂ = (P₁ × V₁) / P₂',
      'Substitution: V₂ = (750 × 400) / 1000',
      'Calculation: V₂ = 300,000 / 1000 = 300 cm³',
    ],
    explanation: 'Boyle Law states that for a fixed mass of gas at constant temperature, pressure is inversely proportional to volume. Higher pressure compresses the gas to 300 cm³.',
    examTip: 'Remember Boyle Law assumes constant temperature (isothermal process).',
  },

  // Biology 2 - Photosynthesis
  {
    id: 'jamb_bio_02',
    subject: 'Biology',
    exam: 'WAEC SSCE',
    year: '2023',
    topic: 'Plant Physiology & Photosynthesis',
    question: 'During photosynthesis in green plants, oxygen gas is released as a byproduct. What is the immediate source of this oxygen?',
    options: {
      A: 'Carbon dioxide',
      B: 'Water (photolysis)',
      C: 'Glucose',
      D: 'Chlorophyll',
    },
    correctAnswer: 'B',
    formula: '2\\text{H}_2\\text{O} \\xrightarrow{h\\nu, \\text{chlorophyll}} 4\\text{H}^+ + 4e^- + \\text{O}_2',
    steps: [
      'In the light-dependent stage of photosynthesis, light energy absorbed by chlorophyll splits water molecules (photolysis)',
      'Water (H₂O) dissociates into protons (H⁺), electrons (e⁻), and oxygen gas (O₂)',
      'The oxygen released into the atmosphere originates exclusively from water, not carbon dioxide',
    ],
    explanation: 'Van Niel and Ruben experiments proved using oxygen-18 isotope tracing that photolysis of water is the sole source of evolved photosynthetic oxygen.',
    examTip: 'A very common JAMB trick: students mistakenly choose carbon dioxide. Remember: Oxygen comes from WATER.',
  },

  // Biology 3 - Human Blood Circulation
  {
    id: 'jamb_bio_03',
    subject: 'Biology',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Human Circulatory System',
    question: 'Which blood vessel carries oxygenated blood from the lungs directly back into the left atrium of the heart?',
    options: {
      A: 'Pulmonary Artery',
      B: 'Pulmonary Vein',
      C: 'Aorta',
      D: 'Vena Cava',
    },
    correctAnswer: 'B',
    formula: '\\text{Lungs} \\xrightarrow{\\text{Pulmonary Vein}} \\text{Left Atrium (Oxygenated)}',
    steps: [
      'Arteries normally carry blood away from the heart, while veins carry blood toward the heart',
      'Pulmonary vein carries oxygenated blood from the lungs to the left atrium',
      'Pulmonary artery is the only artery carrying deoxygenated blood (from right ventricle to lungs)',
    ],
    explanation: 'The pulmonary vein is unique because it is the only vein in the human body that carries fully oxygenated blood (from lungs to heart).',
    examTip: 'Exception rule: Pulmonary artery carries deoxygenated blood; Pulmonary vein carries oxygenated blood.',
  },

  // English 2 - Stress & Oral English
  {
    id: 'jamb_eng_02',
    subject: 'English',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Oral English & Syllable Stress',
    question: 'Choose the word with the primary stress placed on the second syllable.',
    options: {
      A: 'PHO-to-graph',
      B: 'pho-TO-gra-phy',
      C: 'PHO-to-gra-pher',
      D: 'PHO-to-sta-tic',
    },
    correctAnswer: 'B',
    formula: '\\text{Suffix Rule: -graphy shifts primary stress to the antepenultimate syllable}',
    steps: [
      'Photograph is stressed on the first syllable: PHO-to-graph',
      'Photography is stressed on the second syllable: pho-TOG-ra-phy',
      'Words ending in -graphy, -logy, -ical place stress on the syllable before the suffix',
    ],
    explanation: 'The suffix -graphy causes primary stress to fall on the antepenultimate (third from last) syllable: pho-TOG-ra-phy.',
    examTip: 'Notice vowel and stress shift when suffixes change: PHOtograph vs phoTOGraphy vs photoGRAPHic.',
  },

  // English 3 - Antonyms
  {
    id: 'jamb_eng_03',
    subject: 'English',
    exam: 'WAEC SSCE',
    year: '2023',
    topic: 'Antonyms & Lexis',
    question: 'Choose the word opposite in meaning to the capitalized word: "The minister was praised for his FRUGAL management of state resources during the economic crisis."',
    options: {
      A: 'careful',
      B: 'extravagant',
      C: 'generous',
      D: 'shrewd',
    },
    correctAnswer: 'B',
    formula: '\\text{Frugal (economical/sparing) } \\leftrightarrow \\text{ Extravagant (wasteful/spendthrift)}',
    steps: [
      'Define "frugal": careful in spending money or using resources, economical, sparing',
      'Analyze options: "careful" and "shrewd" are synonyms; "generous" relates to giving',
      '"Extravagant" means spending money excessively or wastefully, which is the exact direct antonym',
    ],
    explanation: 'Frugal means prudent and avoiding waste; extravagant means recklessly wasteful or lavish with money.',
    examTip: 'Pay attention to instructions: Ensure you are selecting the OPPOSITE (antonym), not the synonym.',
  },

  // Chemistry 9 - Thermochemistry & Neutralization
  {
    id: 'jamb_chem_09',
    subject: 'Chemistry',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Thermochemistry & Enthalpy of Neutralization',
    question: 'The standard enthalpy of neutralization of a strong acid with a strong base is approximately $-57.4\\text{ kJ/mol}$. What represents the net ionic equation for this reaction?',
    options: {
      A: 'H⁺(aq) + OH⁻(aq) → H₂O(l)',
      B: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)',
      C: 'Na⁺(aq) + Cl⁻(aq) → NaCl(s)',
      D: 'H⁺(aq) + Cl⁻(aq) → HCl(aq)',
    },
    correctAnswer: 'A',
    formula: '\\text{H}^+(aq) + \\text{OH}^-(aq) \\rightarrow \\text{H}_2\\text{O}(l), \\ \\Delta H^\\circ = -57.4\\text{ kJ/mol}',
    steps: [
      'Strong acids and bases are completely dissociated in aqueous solution',
      'Spectator ions (e.g. Na⁺ and Cl⁻) do not participate in the heat-releasing process',
      'The actual reaction is the combination of hydrated hydrogen ions with hydroxide ions to form water',
    ],
    explanation: 'Regardless of the identity of the strong acid or strong base, the heat of neutralization is constant (-57.4 kJ/mol) because the net chemical change is always H⁺ + OH⁻ → H₂O.',
    examTip: 'Weak acids or weak bases yield less heat (less negative ΔH) because energy is consumed in ionizing the weak electrolyte first.',
  },

  // Chemistry 10 - Solubility Product (Ksp)
  {
    id: 'jamb_chem_10',
    subject: 'Chemistry',
    exam: 'JUPEB / UTME',
    year: '2023',
    topic: 'Solubility & Equilibrium',
    question: 'The solubility of Silver Chloride ($\\text{AgCl}$) in pure water is $1.0 \\times 10^{-5}\\text{ mol dm}^{-3}$. What is the solubility product ($K_{sp}$) of $\\text{AgCl}$?',
    options: {
      A: '1.0 × 10⁻¹⁰ mol² dm⁻⁶',
      B: '2.0 × 10⁻¹⁰ mol² dm⁻⁶',
      C: '1.0 × 10⁻⁵ mol² dm⁻⁶',
      D: '1.0 × 10⁻²⁵ mol² dm⁻⁶',
    },
    correctAnswer: 'A',
    formula: 'K_{sp} = [\\text{Ag}^+][\\text{Cl}^-] = s^2',
    steps: [
      'Dissociation: AgCl(s) ⇌ Ag⁺(aq) + Cl⁻(aq)',
      'If solubility is s, then [Ag⁺] = s and [Cl⁻] = s',
      'Given: s = 1.0 × 10⁻⁵ mol dm⁻³',
      'Formula: K_sp = s × s = (1.0 × 10⁻⁵)²',
      'Calculation: K_sp = 1.0 × 10⁻¹⁰ mol² dm⁻⁶',
    ],
    explanation: 'For a 1:1 binary salt, the solubility product equals the square of molar solubility s² = (1.0 × 10⁻⁵)² = 1.0 × 10⁻¹⁰.',
    examTip: 'For a 1:2 salt like PbCl₂: K_sp = [Pb²⁺][Cl⁻]² = (s)(2s)² = 4s³.',
  },

  // Math 8 - Probability & Combinatorics
  {
    id: 'jamb_math_08',
    subject: 'Mathematics',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Statistics & Probability',
    question: 'A fair die is rolled once. What is the probability of obtaining a prime number?',
    options: {
      A: '1/6',
      B: '1/3',
      C: '1/2',
      D: '2/3',
    },
    correctAnswer: 'C',
    formula: 'P(E) = \\frac{n(E)}{n(S)}',
    steps: [
      'Total sample space S = {1, 2, 3, 4, 5, 6} => n(S) = 6',
      'Prime numbers in sample space E = {2, 3, 5} (Note: 1 is NOT a prime number) => n(E) = 3',
      'Probability: P = 3 / 6 = 1 / 2',
    ],
    explanation: 'The prime numbers on a standard die are 2, 3, and 5. There are 3 favorable outcomes out of 6 possible, giving a probability of 1/2.',
    examTip: 'Common mistake in exams: 1 is neither prime nor composite. The smallest prime number is 2.',
  },

  // Math 9 - Coordinate Geometry (Perpendicular Lines)
  {
    id: 'jamb_math_09',
    subject: 'Mathematics',
    exam: 'WAEC SSCE',
    year: '2023',
    topic: 'Coordinate Geometry & Lines',
    question: 'What is the gradient of a straight line perpendicular to the line with equation $2x + 4y = 8$?',
    options: {
      A: '-1/2',
      B: '1/2',
      C: '-2',
      D: '2',
    },
    correctAnswer: 'D',
    formula: 'm_1 \\times m_2 = -1 \\implies m_2 = -\\frac{1}{m_1}',
    steps: [
      'Rewrite equation in slope-intercept form (y = mx + c): 4y = -2x + 8 => y = -1/2 x + 2',
      'Gradient of original line m₁ = -1/2',
      'For perpendicular lines: m₂ = -1 / (-1/2) = +2',
    ],
    explanation: 'Two non-vertical lines are perpendicular if and only if the product of their gradients is -1. The negative reciprocal of -1/2 is +2.',
    examTip: 'Parallel lines have equal slopes (m₁ = m₂); Perpendicular lines have negative reciprocal slopes (m₁ · m₂ = -1).',
  },

  // Physics 11 - Electric Field & Coulomb Law
  {
    id: 'jamb_phy_11',
    subject: 'Physics',
    exam: 'JAMB UTME',
    year: '2024',
    topic: 'Electric & Gravitational Fields',
    question: 'Two point charges of $+2\\mu\\text{C}$ and $+8\\mu\\text{C}$ are placed $0.2\\text{ m}$ apart in vacuum. Find the electrostatic repulsive force between them. [$k = \\frac{1}{4\\pi\\varepsilon_0} = 9 \\times 10^9\\text{ N m}^2\\text{C}^{-2}$]',
    options: {
      A: '0.9 N',
      B: '1.8 N',
      C: '3.6 N',
      D: '7.2 N',
    },
    correctAnswer: 'C',
    formula: 'F = \\frac{k |q_1 q_2|}{r^2}',
    steps: [
      'Given: q₁ = 2 × 10⁻⁶ C, q₂ = 8 × 10⁻⁶ C, r = 0.2 m',
      'Formula: F = (9 × 10⁹ × 2 × 10⁻⁶ × 8 × 10⁻⁶) / (0.2)²',
      'Numerator: 9 × 10⁹ × 16 × 10⁻¹² = 144 × 10⁻³ = 0.144',
      'Denominator: (0.2)² = 0.04',
      'Calculation: F = 0.144 / 0.04 = 3.6 N',
    ],
    explanation: 'Coulomb Law states electrostatic force is directly proportional to the product of charges and inversely proportional to the square of the distance. F = 3.6 N.',
    examTip: 'Always convert microcoulombs (μC) to Coulombs (× 10⁻⁶) and distance to meters.',
  },

  // Physics 12 - Uniform Circular Motion
  {
    id: 'jamb_phy_12',
    subject: 'Physics',
    exam: 'JAMB UTME',
    year: '2023',
    topic: 'Circular Motion & Centripetal Force',
    question: 'A mass of $0.5\\text{ kg}$ is whirled in a horizontal circle of radius $2\\text{ m}$ at a constant speed of $4\\text{ m/s}$. What is the centripetal force acting on the mass?',
    options: {
      A: '2 N',
      B: '4 N',
      C: '8 N',
      D: '16 N',
    },
    correctAnswer: 'B',
    formula: 'F_c = \\frac{m v^2}{r}',
    steps: [
      'Given: Mass m = 0.5 kg',
      'Speed v = 4 m/s',
      'Radius r = 2 m',
      'Formula: F_c = (0.5 × 4²) / 2',
      'Calculation: F_c = (0.5 × 16) / 2 = 8 / 2 = 4 N',
    ],
    explanation: 'Centripetal force is directed toward the center of the circular path and is given by mv²/r = (0.5 × 16) / 2 = 4 N.',
    examTip: 'Centripetal acceleration is a = v²/r; multiplying by mass gives force F = ma = mv²/r.',
  },

  // Biology 4 - Ecology & Trophic Levels
  {
    id: 'jamb_bio_04',
    subject: 'Biology',
    exam: 'WAEC SSCE',
    year: '2024',
    topic: 'Ecology & Ecosystems',
    question: 'In a grassland ecosystem, which trophic level possesses the highest total available energy?',
    options: {
      A: 'Primary producers (green grasses)',
      B: 'Primary consumers (grasshoppers)',
      C: 'Secondary consumers (toads)',
      D: 'Tertiary consumers (hawks)',
    },
    correctAnswer: 'A',
    formula: '\\text{Lindeman 10\\% Energy Transfer Rule}',
    steps: [
      'According to the Second Law of Thermodynamics and Lindeman 10% rule, only about 10% of energy is transferred from one trophic level to the next',
      '90% of energy is lost as heat through respiration and metabolic activities',
      'Primary producers trap solar energy directly via photosynthesis and possess 100% of the initial energy base',
    ],
    explanation: 'Energy decreases progressively up the trophic levels. The pyramid of energy is always upright, meaning primary producers always contain the greatest amount of energy.',
    examTip: 'The pyramid of energy can NEVER be inverted, unlike pyramids of numbers or biomass.',
  },

  // Economics 1 - Price Elasticity of Demand
  {
    id: 'jamb_eco_01',
    subject: 'Economics',
    exam: 'JAMB/UTME',
    year: '2023',
    topic: 'Elasticity of Demand & Supply',
    question: 'When the price of a commodity increases from $\\text{\\N20}$ to $\\text{\\N25}$, the quantity demanded falls from $100\\text{ units}$ to $70\\text{ units}$. Calculate the point price elasticity of demand.',
    options: {
      A: '0.8',
      B: '1.2',
      C: '1.5',
      D: '2.0',
    },
    correctAnswer: 'B',
    formula: 'E_d = \\left| \\frac{\\Delta Q}{\\Delta P} \\times \\frac{P_1}{Q_1} \\right|',
    steps: [
      'Given: Initial Price P₁ = 20, New Price P₂ = 25 → ΔP = 25 - 20 = 5',
      'Initial Quantity Q₁ = 100, New Quantity Q₂ = 70 → ΔQ = 70 - 100 = -30',
      'Formula: E_d = | (ΔQ / ΔP) × (P₁ / Q₁) |',
      'Substitution: E_d = | (-30 / 5) × (20 / 100) |',
      'Calculation: E_d = | -6 × 0.2 | = 1.2',
    ],
    explanation: 'Since E_d = 1.2 is greater than 1, demand for this commodity is price-elastic. Consumers are relatively responsive to price increases.',
    examTip: 'Price elasticity of demand is usually reported as a positive absolute value unless cross-elasticity or income elasticity is requested.',
  },

  // Economics 2 - Market Equilibrium
  {
    id: 'jamb_eco_02',
    subject: 'Economics',
    exam: 'WAEC/WASSCE',
    year: '2024',
    topic: 'Theory of Demand & Supply and Price Determination',
    question: 'The demand and supply functions for a commodity are given as $Q_d = 50 - 3P$ and $Q_s = 10 + 2P$, where $P$ is price in Naira. Determine the equilibrium price ($P^*$) and equilibrium quantity ($Q^*$).',
    options: {
      A: 'P* = ₦6, Q* = 32 units',
      B: 'P* = ₦8, Q* = 26 units',
      C: 'P* = ₦10, Q* = 20 units',
      D: 'P* = ₦12, Q* = 14 units',
    },
    correctAnswer: 'B',
    formula: 'Q_d = Q_s',
    steps: [
      'Equilibrium condition: Q_d = Q_s',
      'Equate functions: 50 - 3P = 10 + 2P',
      'Collect like terms: 50 - 10 = 2P + 3P → 40 = 5P',
      'Solve for P*: P* = 40 / 5 = 8 Naira',
      'Substitute P* = 8 into Q_d: Q* = 50 - 3(8) = 50 - 24 = 26 units',
      'Verify with Q_s: Q_s = 10 + 2(8) = 10 + 16 = 26 units',
    ],
    explanation: 'At equilibrium, quantity demanded equals quantity supplied ($Q_d = Q_s$). Solving gives equilibrium price P* = ₦8 and quantity Q* = 26 units.',
    examTip: 'Always verify your equilibrium price by plugging it into both equations; both Q_d and Q_s must yield the exact same quantity!',
  },

  // Economics 3 - Marginal Cost Calculation
  {
    id: 'jamb_eco_03',
    subject: 'Economics',
    exam: 'JAMB/UTME',
    year: '2022',
    topic: 'Cost & Revenue Analysis',
    question: 'When a firm produces 5 units of output, its total cost is $\\text{\\N150}$. When output expands to 6 units, the total cost rises to $\\text{\\N185}$. Calculate the Marginal Cost (MC) of the 6th unit.',
    options: {
      A: '₦25',
      B: '₦30',
      C: '₦35',
      D: '₦40',
    },
    correctAnswer: 'C',
    formula: 'MC = \\frac{\\Delta TC}{\\Delta Q} = \\frac{TC_n - TC_{n-1}}{Q_n - Q_{n-1}}',
    steps: [
      'Given: TC at 5 units (TC₅) = ₦150',
      'TC at 6 units (TC₆) = ₦185',
      'Change in Total Cost ΔTC = 185 - 150 = ₦35',
      'Change in Output ΔQ = 6 - 5 = 1 unit',
      'Calculation: MC = 35 / 1 = ₦35',
    ],
    explanation: 'Marginal Cost is the additional cost incurred by producing one extra unit of output: MC = TC₆ - TC₅ = ₦185 - ₦150 = ₦35.',
    examTip: 'Marginal cost depends solely on variable costs because fixed costs do not change when output expands.',
  },

  // Economics 4 - National Income Multiplier
  {
    id: 'jamb_eco_04',
    subject: 'Economics',
    exam: 'JUPEB',
    year: '2023',
    topic: 'National Income Accounting',
    question: 'If the Marginal Propensity to Consume (MPC) in an economy is $0.75$, calculate the value of the investment multiplier ($K$).',
    options: {
      A: '2.5',
      B: '3.0',
      C: '4.0',
      D: '5.0',
    },
    correctAnswer: 'C',
    formula: 'K = \\frac{1}{1 - MPC} = \\frac{1}{MPS}',
    steps: [
      'Given: Marginal Propensity to Consume MPC = 0.75',
      'Formula: K = 1 / (1 - MPC)',
      'Calculate Marginal Propensity to Save (MPS): MPS = 1 - 0.75 = 0.25',
      'Calculation: K = 1 / 0.25 = 4.0',
    ],
    explanation: 'The multiplier represents the magnified change in national income resulting from an injection of investment: K = 1 / (1 - 0.75) = 1 / 0.25 = 4.',
    examTip: 'Remember that MPC + MPS = 1. A higher MPC always leads to a larger multiplier effect.',
  },

  // Literature 1 - Literary Devices / Figures of Speech
  {
    id: 'jamb_lit_01',
    subject: 'Literature',
    exam: 'JAMB/UTME',
    year: '2023',
    topic: 'Literary Appreciation & Figures of Speech',
    question: 'Read the line: "The lonely headlights of the night crawler blinked through the silent sorrow of the empty highway." Which figure of speech is primarily employed in this line?',
    options: {
      A: 'Hyperbole',
      B: 'Personification',
      C: 'Euphemism',
      D: 'Synecdoche',
    },
    correctAnswer: 'B',
    formula: '\\text{Literary Device: Personification (Endowing inanimate objects with human attributes)}',
    steps: [
      'Identify the inanimate elements: "headlights" and "empty highway"',
      'Identify the human attributes ascribed to them: "lonely", "blinked", and "silent sorrow"',
      'Match with literary devices: Attributing human feelings, sorrows, and actions to non-human or inanimate objects is Personification.',
    ],
    explanation: 'Personification is the literary device where human qualities, emotions, and consciousness are attributed to inanimate objects, animals, or natural phenomena.',
    examTip: 'Distinguish personification from apostrophe: apostrophe addresses an absent person or entity directly, while personification attributes human actions to things.',
  },

  // Literature 2 - Dramatic Techniques
  {
    id: 'jamb_lit_02',
    subject: 'Literature',
    exam: 'WAEC/WASSCE',
    year: '2024',
    topic: 'Dramatic Techniques & Conflict',
    question: 'In drama, what is the term for a speech delivered by a character alone on stage that reveals their innermost thoughts, motives, and psychological conflicts to the audience?',
    options: {
      A: 'Aside',
      B: 'Monologue',
      C: 'Soliloquy',
      D: 'Prologue',
    },
    correctAnswer: 'C',
    formula: '\\text{Dramatic Term: Soliloquy (Solo Dramatic Speech)}',
    steps: [
      'Distinguish dramatic conventions:',
      'Soliloquy: A character speaks alone on stage, revealing private thoughts directly to the audience (e.g. Hamlet\'s "To be or not to be").',
      'Aside: A brief comment made while other characters are on stage, but supposedly unheard by them.',
      'Monologue: A long speech addressed to other active characters on stage.',
      'Conclusion: Character speaking alone on stage is a Soliloquy.',
    ],
    explanation: 'A soliloquy is a dramatic convention where a character stands solitary on stage and voices their candid internal contemplation directly to the audience.',
    examTip: 'Key difference: Monologue = spoken to other characters. Soliloquy = spoken entirely alone. Aside = spoken in presence of others but unheard by them.',
  },

  // Literature 3 - African Prose / Themes
  {
    id: 'jamb_lit_03',
    subject: 'Literature',
    exam: 'JAMB/UTME',
    year: '2023',
    topic: 'African Prose (Themes & Characterization)',
    question: 'In Chinua Achebe\'s classic African novel "Things Fall Apart", what is Okonkwo\'s dominant tragic flaw (hamartia) that precipitates his eventual downfall?',
    options: {
      A: 'Greed and avarice for chieftaincy titles',
      B: 'Deep-seated fear of weakness, failure, and resembling his father Unoka',
      C: 'Disloyalty to the traditional gods and ancestors of Umuofia',
      D: 'Excessive sympathy towards the British colonial missionaries',
    },
    correctAnswer: 'B',
    formula: '\\text{Character Analysis: Hamartia (Tragic Flaw)}',
    steps: [
      'Analyze Okonkwo\'s core psychological motivation in the narrative:',
      'Achebe writes explicitly: "Okonkwo was ruled by one passion—to hate everything that his father Unoka had loved."',
      'His entire life was driven by mortal fear of being thought weak, idle, or unmanly.',
      'This fear drove him to kill Ikemefuna and violently sever himself from changing societal norms.',
      'Conclusion: Fear of failure and weakness is his central tragic flaw.',
    ],
    explanation: 'Okonkwo\'s tragic downfall is driven by his profound terror of appearing weak or ineffectual like his father Unoka. This obsessive dread leads him to rash, violent actions that ultimately alienate his community and cause his tragedy.',
    examTip: 'In classical tragedy and African literary analysis, "hamartia" is the internal flaw or error of judgment in the protagonist that leads to their tragic fate.',
  },

  // Literature 4 - Poetic Devices
  {
    id: 'jamb_lit_04',
    subject: 'Literature',
    exam: 'JUPEB',
    year: '2024',
    topic: 'Poetic Devices & Imagery',
    question: 'Consider the phrase: "The sweet sorrow of departure left them with a deafening silence." Which two complementary figures of speech are juxtaposed in this phrase?',
    options: {
      A: 'Metonymy and Irony',
      B: 'Oxymoron and Oxymoron',
      C: 'Paradox and Litotes',
      D: 'Alliteration and Onomatopoeia',
    },
    correctAnswer: 'B',
    formula: '\\text{Poetic Device: Oxymoron (Juxtaposition of contradictory terms)}',
    steps: [
      'Analyze term 1: "sweet sorrow" brings together two opposite emotional states (sweet + sorrow) in direct conjunction.',
      'Analyze term 2: "deafening silence" pairs contradictory auditory concepts (deafening noise + absolute silence).',
      'Both instances directly juxtapose contrasting, contradictory words side-by-side.',
      'Conclusion: Both "sweet sorrow" and "deafening silence" are classic Oxymorons.',
    ],
    explanation: 'An oxymoron is a figure of speech in which two contradictory terms appear in direct conjunction (e.g. "sweet sorrow", "deafening silence", "cruel kindness").',
    examTip: 'An oxymoron involves two contradictory words side by side (e.g. "sweet sorrow"), whereas a paradox is a whole statement or situation that appears self-contradictory yet reveals a truth.',
  },

  // Economics 5 - GDP & National Income Components
  {
    id: 'jamb_eco_05',
    subject: 'Economics',
    exam: 'JAMB/UTME',
    year: '2024',
    topic: 'National Income Accounting (GDP & GNP)',
    question: 'In an open economy, Consumer Expenditure $C = \\text{₦}450\\text{bn}$, Gross Investment $I = \\text{₦}180\\text{bn}$, Government Purchases $G = \\text{₦}120\\text{bn}$, Exports $X = \\text{₦}90\\text{bn}$, and Imports $M = \\text{₦}60\\text{bn}$. Calculate the Gross Domestic Product ($GDP$) at market prices.',
    options: {
      A: '₦720 bn',
      B: '₦780 bn',
      C: '₦840 bn',
      D: '₦900 bn',
    },
    correctAnswer: 'B',
    formula: 'GDP = C + I + G + (X - M)',
    steps: [
      'Given: Consumption C = ₦450bn, Investment I = ₦180bn, Government Spending G = ₦120bn',
      'Net Exports (X - M) = 90 - 60 = ₦30bn',
      'Formula: GDP = C + I + G + (X - M)',
      'Substitution: GDP = 450 + 180 + 120 + 30',
      'Calculation: GDP = ₦780bn',
    ],
    explanation: 'Using the expenditure approach, GDP equals aggregate spending: GDP = C + I + G + (X - M) = 450 + 180 + 120 + 30 = ₦780 billion.',
    examTip: 'Remember that Net Exports is Exports minus Imports (X - M). If imports exceed exports, net exports is negative.',
  },

  // Economics 6 - Opportunity Cost & Production Possibility Curve
  {
    id: 'jamb_eco_06',
    subject: 'Economics',
    exam: 'WAEC/WASSCE',
    year: '2023',
    topic: 'Basic Economic Concepts (Opportunity Cost & PPC)',
    question: 'A country produces only Rice and Tractors. Moving from Point A to Point B on its Production Possibility Curve (PPC), Rice output increases from 200 tonnes to 280 tonnes, while Tractor production falls from 50 units to 30 units. What is the real opportunity cost of producing the additional 80 tonnes of Rice?',
    options: {
      A: '50 tractors',
      B: '30 tractors',
      C: '20 tractors',
      D: '80 tonnes of rice',
    },
    correctAnswer: 'C',
    formula: '\\text{Opportunity Cost} = \\Delta \\text{Sacrificed Alternative} = T_A - T_B',
    steps: [
      'Given: Initial tractor production = 50 units, New tractor production = 30 units',
      'Rice production increases from 200 to 280 (+80 tonnes)',
      'Opportunity Cost is the quantity of the alternative forgone to produce the extra good.',
      'Calculation: Tractors sacrificed = 50 - 30 = 20 tractors.',
    ],
    explanation: 'Opportunity cost in economics is defined as the real cost of forgone alternatives. To gain 80 tonnes of rice, 20 tractors had to be sacrificed.',
    examTip: 'Opportunity cost is always measured in terms of the sacrificed alternative forgone, not monetary expenditure.',
  },

  // Economics 7 - Market Structures
  {
    id: 'jamb_eco_07',
    subject: 'Economics',
    exam: 'JAMB/UTME',
    year: '2024',
    topic: 'Market Structures (Monopoly & Perfect Competition)',
    question: 'Which of the following conditions distinguishes a pure monopoly from a perfectly competitive market?',
    options: {
      A: 'Horizontal demand curve facing the individual seller',
      B: 'Downward-sloping demand curve where Marginal Revenue is less than Average Revenue ($MR < AR$)',
      C: 'Large number of buyers and sellers with zero barriers to entry',
      D: 'Price equals Marginal Cost ($P = MC$) in both short and long runs',
    },
    correctAnswer: 'B',
    formula: 'MR < AR = P \\text{ (in Monopoly)}',
    steps: [
      'Analyze demand curve in Perfect Competition: Perfectly elastic (horizontal), so P = AR = MR.',
      'Analyze demand curve in Monopoly: The monopolist faces the entire downward-sloping market demand curve.',
      'To sell additional output, the monopolist must reduce price on all units sold.',
      'Therefore, Marginal Revenue falls faster than price: MR < AR.',
    ],
    explanation: 'A monopolist faces the market downward-sloping demand curve, which means Marginal Revenue (MR) is always below Average Revenue (AR = Price) for all positive sales beyond the first unit.',
    examTip: 'Remember: In Perfect Competition, P = AR = MR. In Monopoly, P = AR > MR.',
  },

  // Economics 8 - Inflation & Consumer Price Index
  {
    id: 'jamb_eco_08',
    subject: 'Economics',
    exam: 'JUPEB',
    year: '2024',
    topic: 'Money, Price Levels & Inflation',
    question: 'The Consumer Price Index (CPI) of an economy was 120 in 2022 and rose to 138 in 2023. Calculate the annual rate of inflation between 2022 and 2023.',
    options: {
      A: '12%',
      B: '15%',
      C: '18%',
      D: '20%',
    },
    correctAnswer: 'B',
    formula: '\\text{Inflation Rate} = \\frac{CPI_{t} - CPI_{t-1}}{CPI_{t-1}} \\times 100\\%',
    steps: [
      'Given: CPI in base year 2022 = 120, CPI in current year 2023 = 138',
      'Change in CPI = 138 - 120 = 18',
      'Formula: Rate = (18 / 120) × 100%',
      'Calculation: 18 / 120 = 0.15 × 100% = 15%',
    ],
    explanation: 'The annual inflation rate measures the percentage change in the price index over the period: ((138 - 120) / 120) × 100% = (18 / 120) × 100% = 15%.',
    examTip: 'Always divide by the earlier (base) period CPI, never the later one!',
  },

  // Economics 9 - International Trade
  {
    id: 'jamb_eco_09',
    subject: 'Economics',
    exam: 'WAEC/WASSCE',
    year: '2024',
    topic: 'International Trade & Comparative Advantage',
    question: 'According to David Ricardo\'s Theory of Comparative Advantage, a country should specialize in producing and exporting a commodity if:',
    options: {
      A: 'It can produce more absolute units of the commodity than any competitor',
      B: 'It can produce the commodity at a lower opportunity cost compared to other nations',
      C: 'Its domestic currency is legally pegged to gold bullion',
      D: 'It imposes heavy protective tariffs on foreign substitutes',
    },
    correctAnswer: 'B',
    formula: '\\text{Comparative Advantage} = \\min(\\text{Opportunity Cost of Production})',
    steps: [
      'Distinguish Absolute Advantage vs Comparative Advantage:',
      'Absolute Advantage (Adam Smith): Producing more output with the same inputs.',
      'Comparative Advantage (David Ricardo): Producing at a lower relative opportunity cost.',
      'Specialization based on comparative advantage maximizes global output even if one nation has an absolute advantage in all goods.',
    ],
    explanation: 'Comparative advantage exists when a country can produce a good at a lower relative opportunity cost than trading partners, which serves as the basis for mutually beneficial international trade.',
    examTip: 'Adam Smith = Absolute Advantage (superior efficiency). David Ricardo = Comparative Advantage (lower opportunity cost).',
  },

  // Economics 10 - Public Finance & Fiscal Policy
  {
    id: 'jamb_eco_10',
    subject: 'Economics',
    exam: 'JAMB/UTME',
    year: '2024',
    topic: 'Public Finance, Taxation & Fiscal Policy',
    question: 'During a period of demand-pull hyperinflation in an economy, which fiscal policy measure should the Federal Ministry of Finance enact to stabilize aggregate demand?',
    options: {
      A: 'Increase government capital expenditures and lower corporate taxes',
      B: 'Reduce personal income tax rates and increase transfer payments',
      C: 'Decrease government expenditure and increase direct tax rates (Contractionary Fiscal Policy)',
      D: 'Instruct the Central Bank to print more legal tender currency',
    },
    correctAnswer: 'C',
    formula: '\\text{Contractionary Fiscal Policy: } \\downarrow G \\text{ and } \\uparrow T',
    steps: [
      'Demand-pull inflation is caused by excessive aggregate demand (AD > AS).',
      'To restrain aggregate demand, fiscal authorities use contractionary fiscal policy.',
      'Tools: Decrease government spending (G) to directly reduce demand, and raise taxes (T) to curb disposable income and consumption.',
      'Conclusion: Option C is the correct counter-cyclical measure.',
    ],
    explanation: 'Contractionary fiscal policy involves reducing government expenditure and increasing taxes to drain excess liquidity and curb spending during high inflation.',
    examTip: 'Do not confuse fiscal policy (Ministry of Finance / government spending and taxation) with monetary policy (Central Bank / interest rates and cash reserve ratio).',
  },

  // Literature 5 - African Drama (Wole Soyinka)
  {
    id: 'jamb_lit_05',
    subject: 'Literature',
    exam: 'JAMB/UTME',
    year: '2024',
    topic: 'African Drama (Wole Soyinka - The Lion and the Jewel)',
    question: 'In Wole Soyinka\'s drama "The Lion and the Jewel", how does the cunning Bale Baroka outwit the conceited village belle Sidi to win her hand in marriage?',
    options: {
      A: 'By bribing the village elders with gold coins and royal land',
      B: 'By fabricating a deceptive rumor that he has lost his virility and manhood',
      C: 'By challenging Lakunle to a public wrestling duel at the village square',
      D: 'By converting to Western Christianity and promising to renounce polygamy',
    },
    correctAnswer: 'B',
    formula: '\\text{Dramatic Irony & Plot Conflict: Tradition vs Modernity}',
    steps: [
      'Recall the central plot of "The Lion and the Jewel" by Wole Soyinka:',
      'Baroka (The Lion) wants to marry Sidi (The Jewel), whose vanity was inflated by photographs published in a Lagos magazine.',
      'Sidi refuses him, believing herself superior.',
      'Baroka feigns impotence and spreads the false rumor through Sadiku.',
      'Sidi visits his palace to mock his condition, falls into his trap, and is seduced.',
    ],
    explanation: 'Baroka cleverly crafts a false rumor through Sadiku that his virility is gone. Sidi goes to taunt the Bale, only to find herself outmaneuvered by Baroka\'s virile strength and traditional wit.',
    examTip: 'The clash between Lakunle (shallow Western modernity) and Baroka (cunning African tradition) is a frequent JAMB/WAEC question.',
  },

  // Literature 6 - Shakespearean Drama / Tragic Conventions
  {
    id: 'jamb_lit_06',
    subject: 'Literature',
    exam: 'WAEC/WASSCE',
    year: '2023',
    topic: 'Shakespearean Drama & Dramatic Conventions',
    question: 'In Shakespearean tragedy (such as "Macbeth"), what is the function of the "Comic Relief" scene (such as the Porter\'s drunken speech after King Duncan\'s murder)?',
    options: {
      A: 'To signal the official conclusion of the tragic play',
      B: 'To momentarily alleviate intense emotional tension while heightening the underlying horror and dramatic suspense',
      C: 'To introduce new primary characters who resolve the conflict',
      D: 'To provide a musical interlude for the audience to leave their seats',
    },
    correctAnswer: 'B',
    formula: '\\text{Dramatic Technique: Comic Relief}',
    steps: [
      'Define Comic Relief in classical and Renaissance drama:',
      'A humorous scene, incident, or character introduced into a serious tragedy.',
      'Function: It breaks harrowing tension, allows emotional recalibration, and ironically sharpens the impending dread (Macbeth\'s hellish castle gate).',
    ],
    explanation: 'Comic relief is a dramatic technique used in tragedies to temporarily relieve intense emotional tension, while satirically mirroring or heightening the tragic atmosphere.',
    examTip: 'The Porter Scene in Macbeth is the textbook exemplar of Shakespearean comic relief; note how the Porter jokes about opening the gates of hell right after Duncan\'s murder.',
  },

  // Literature 7 - African Poetry (Leopold Sedar Senghor & Negritude)
  {
    id: 'jamb_lit_07',
    subject: 'Literature',
    exam: 'JAMB/UTME',
    year: '2024',
    topic: 'African Poetry (Negritude & Cultural Affirmation)',
    question: 'In Leopold Sedar Senghor\'s famous poem "Black Woman" ("Femme Noire"), what is the principal philosophical and aesthetic theme?',
    options: {
      A: 'A scathing Marxist critique of Western industrial capitalism',
      B: 'The celebration and veneration of the African woman as the physical embodiment of African culture, beauty, and soul',
      C: 'A lamentation over the decline of traditional agrarian farming methods',
      D: 'A satire of European colonial administrative bureaucracy',
    },
    correctAnswer: 'B',
    formula: '\\text{Theme: Negritude & Aesthetic Deification of African Identity}',
    steps: [
      'Analyze Senghor\'s background: Pioneer of the Negritude movement.',
      'Analyze "Black Woman": "Naked woman, black woman / Clothed in your colour which is life..."',
      'The woman is praised not only as a mother and lover, but as Mother Africa herself.',
      'Conclusion: Celebration and veneration of African beauty, culture, and blackness.',
    ],
    explanation: 'Senghor\'s "Black Woman" is an iconic Negritude hymn that exalts the African woman as the spiritual, emotional, and aesthetic symbol of Africa\'s enduring grace and identity.',
    examTip: 'Whenever you see Senghor or Negritude, remember it is an ideological celebration of Black African identity, beauty, and heritage.',
  },

  // Literature 8 - Non-African Prose (Charles Dickens)
  {
    id: 'jamb_lit_08',
    subject: 'Literature',
    exam: 'WAEC/WASSCE',
    year: '2024',
    topic: 'Non-African Prose (Themes & Narrative Point of View)',
    question: 'In Charles Dickens\' novel "Great Expectations", what type of novel is it formally categorized as, tracing Pip\'s moral, psychological, and social growth from childhood to maturity?',
    options: {
      A: 'Epistolary novel',
      B: 'Picaresque novel',
      C: 'Bildungsroman (Coming-of-Age novel)',
      D: 'Gothic romance',
    },
    correctAnswer: 'C',
    formula: '\\text{Genre: Bildungsroman (Coming-of-Age narrative)}',
    steps: [
      'Define literary genres:',
      'Bildungsroman: A novel that follows the personal, moral, and psychological development of a protagonist from youth to adulthood (e.g. Pip).',
      'Epistolary: Told through a series of letters or diary entries.',
      'Picaresque: Relates the episodic adventures of an unscrupulous, roguish hero.',
      'Conclusion: Pip\'s journey from the blacksmith forge to gentlemanhood is a classic Bildungsroman.',
    ],
    explanation: 'A Bildungsroman is a literary genre focusing on the psychological and moral development of the protagonist from youth to maturity, exemplified by Pip in "Great Expectations".',
    examTip: 'German literary term "Bildungsroman" literally means "novel of formation/education"—essential for JAMB and WASSCE literary classification.',
  },

  // Literature 9 - Figures of Speech (Synecdoche & Metonymy)
  {
    id: 'jamb_lit_09',
    subject: 'Literature',
    exam: 'JUPEB',
    year: '2024',
    topic: 'Literary Devices (Metonymy vs Synecdoche)',
    question: 'Examine the statement: "The pen is mightier than the sword, and the crown gave its royal assent." What specific figure of speech is demonstrated by using "pen" for journalism and "crown" for the monarch?',
    options: {
      A: 'Synecdoche',
      B: 'Metonymy',
      C: 'Litotes',
      D: 'Hyperbole',
    },
    correctAnswer: 'B',
    formula: '\\text{Literary Device: Metonymy (Association by proximity)}',
    steps: [
      'Distinguish Metonymy from Synecdoche:',
      'Metonymy: Substituting the name of an object with something closely related or associated with it (e.g., "the pen" for the written word, "the crown" for the sovereign monarch).',
      'Synecdoche: A part representing the whole (e.g., "all hands on deck" where hands = sailors).',
      'Pen is associated with writing; Crown is associated with monarchy.',
      'Conclusion: This is Metonymy.',
    ],
    explanation: 'Metonymy is a figure of speech in which a concept or thing is referred to by the name of something closely associated with that thing (e.g. "the crown" for royalty, "the press" for journalists).',
    examTip: 'Memory key: Synecdoche is Part of the thing itself. Metonymy is an external Association.',
  },

  // Literature 10 - Dramatic Terminology (Catharsis)
  {
    id: 'jamb_lit_10',
    subject: 'Literature',
    exam: 'JAMB/UTME',
    year: '2024',
    topic: 'Dramatic Appreciation & Classical Tragedy',
    question: 'According to Aristotle\'s "Poetics", the emotional cleansing or purging of pity and terror experienced by the audience at the culmination of a tragic drama is termed:',
    options: {
      A: 'Hamartia',
      B: 'Peripeteia',
      C: 'Anagnorisis',
      D: 'Catharsis',
    },
    correctAnswer: 'D',
    formula: '\\text{Aristotelian Dramatic Term: Catharsis (Emotional Purgation)}',
    steps: [
      'Review Greek dramatic terminology from Aristotle\'s Poetics:',
      'Hamartia: The tragic flaw or fatal error.',
      'Peripeteia: A sudden reversal of fortune or circumstances.',
      'Anagnorisis: The moment of critical discovery or recognition.',
      'Catharsis: The release or purging of pity (eleos) and fear/terror (phobos) in the audience.',
      'Conclusion: Emotional purging is Catharsis.',
    ],
    explanation: 'Catharsis is the Aristotelian term for the psychological and emotional purgation of pity and fear experienced by the spectators at the end of a classical tragedy.',
    examTip: 'Master the Greek quartet: Hamartia (flaw), Peripeteia (reversal), Anagnorisis (discovery), Catharsis (purging). All 4 appear regularly in JAMB Literature.',
  },
];
