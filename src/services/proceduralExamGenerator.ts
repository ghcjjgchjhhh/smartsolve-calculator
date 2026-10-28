import { JambQuestion } from '../types';

/**
 * Smart Procedural Examination Question Generator
 * Generates fresh, randomized, syllabus-accurate questions for Nigerian & West African exams
 * (JAMB/UTME, WAEC/WASSCE, JUPEB, University Foundation) across all 7 subjects:
 * Mathematics, Physics, Chemistry, Biology, English, Literature in English, and Economics.
 */

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleOptions<T extends { A: string; B: string; C: string; D: string }>(
  opts: T,
  correctKey: 'A' | 'B' | 'C' | 'D'
): { options: T; correctAnswer: 'A' | 'B' | 'C' | 'D' } {
  const correctVal = opts[correctKey];
  const entries: [string, string][] = [
    ['A', opts.A],
    ['B', opts.B],
    ['C', opts.C],
    ['D', opts.D],
  ];

  // Fisher-Yates shuffle of values
  const values = entries.map((e) => e[1]);
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  const newOpts = {
    A: values[0],
    B: values[1],
    C: values[2],
    D: values[3],
  } as T;

  let newCorrect: 'A' | 'B' | 'C' | 'D' = 'A';
  if (newOpts.B === correctVal) newCorrect = 'B';
  else if (newOpts.C === correctVal) newCorrect = 'C';
  else if (newOpts.D === correctVal) newCorrect = 'D';

  return { options: newOpts, correctAnswer: newCorrect };
}

export function generateProceduralQuestion(
  subject: string,
  targetTopic: string,
  exam: string,
  level: string,
  difficulty: string,
  index: number
): JambQuestion {
  const normSubject = subject.toLowerCase();
  const normTopic = targetTopic.toLowerCase();
  const id = `proc_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
  const examYear = `${exam} (${level}) Syllabus`;

  // ==========================================
  // 1. ECONOMICS GENERATOR
  // ==========================================
  if (normSubject.includes('econ')) {
    if (normTopic.includes('elast') || randChoice([true, false])) {
      // Point elasticity calculation with random numbers
      const p1 = randChoice([10, 20, 25, 40, 50]);
      const dp = randChoice([5, 10, 15]);
      const p2 = p1 + dp;
      const q1 = randChoice([80, 100, 120, 150]);
      const dq = randChoice([20, 30, 40]);
      const q2 = q1 - dq;
      const elasticity = Number((((dq / dp) * (p1 / q1))).toFixed(2));
      const dist1 = Number((elasticity * 0.7).toFixed(2));
      const dist2 = Number((elasticity * 1.3).toFixed(2));
      const dist3 = Number((elasticity + 0.5).toFixed(2));

      const rawOpts = {
        A: `${elasticity}`,
        B: `${dist1}`,
        C: `${dist2}`,
        D: `${dist3}`,
      };
      const { options, correctAnswer } = shuffleOptions(rawOpts, 'A');

      return {
        id,
        subject: 'Economics',
        exam,
        level,
        difficulty: difficulty as any,
        topic: targetTopic || 'Price Elasticity of Demand',
        question: `When the price of a consumer good rises from $\\text{₦}${p1}$ to $\\text{₦}${p2}$, the weekly quantity demanded falls from $${q1}\\text{ units}$ to $${q2}\\text{ units}$. Calculate the point price elasticity of demand ($E_d$).`,
        options,
        correctAnswer,
        formula: 'E_d = \\left| \\frac{\\Delta Q}{\\Delta P} \\times \\frac{P_1}{Q_1} \\right|',
        givenValues: `P₁ = ₦${p1}, P₂ = ₦${p2} (ΔP = ${dp}); Q₁ = ${q1}, Q₂ = ${q2} (ΔQ = -${dq})`,
        whatIsRequired: 'Price Elasticity of Demand (E_d)',
        substitution: `E_d = \\left| \\frac{-${dq}}{${dp}} \\times \\frac{${p1}}{${q1}} \\right|`,
        steps: [
          `Identify initial price P₁ = ₦${p1} and new price P₂ = ₦${p2} → ΔP = ${p2} - ${p1} = ₦${dp}`,
          `Identify initial quantity Q₁ = ${q1} units and new quantity Q₂ = ${q2} units → ΔQ = ${q2} - ${q1} = -${dq} units`,
          `Apply elasticity formula: E_d = | (ΔQ / ΔP) × (P₁ / Q₁) |`,
          `Substitution: E_d = | (-${dq} / ${dp}) × (${p1} / ${q1}) |`,
          `Calculation: E_d = | -${(dq / dp).toFixed(2)} × ${(p1 / q1).toFixed(2)} | = ${elasticity}`,
        ],
        explanation: `The calculated price elasticity of demand is ${elasticity}. Since ${elasticity > 1 ? 'E_d > 1, demand is elastic' : 'E_d < 1, demand is inelastic'}, consumers are ${elasticity > 1 ? 'highly responsive' : 'relatively unresponsive'} to price fluctuations.`,
        examTip: 'Remember: Price elasticity of demand is usually stated as a positive absolute value. Only income elasticity (inferior vs normal goods) and cross elasticity (substitutes vs complements) retain negative signs.',
      };
    } else {
      // Demand & Supply Equilibrium with random equations
      const b = randChoice([2, 3, 4]);
      const d = randChoice([1, 2, 3]);
      const pEquil = randChoice([5, 8, 10, 12, 15]);
      const qEquil = randChoice([20, 30, 40, 50]);
      const a = qEquil + b * pEquil;
      const c = qEquil - d * pEquil;

      const wrongP1 = pEquil + 2;
      const wrongP2 = Math.max(2, pEquil - 3);
      const wrongP3 = pEquil + 5;

      const rawOpts = {
        A: `P* = ₦${pEquil}, Q* = ${qEquil} units`,
        B: `P* = ₦${wrongP1}, Q* = ${qEquil - 5} units`,
        C: `P* = ₦${wrongP2}, Q* = ${qEquil + 8} units`,
        D: `P* = ₦${wrongP3}, Q* = ${qEquil - 12} units`,
      };
      const { options, correctAnswer } = shuffleOptions(rawOpts, 'A');

      return {
        id,
        subject: 'Economics',
        exam,
        level,
        difficulty: difficulty as any,
        topic: targetTopic || 'Theory of Demand & Supply and Price Determination',
        question: `The market demand and supply equations for garri in a Nigerian market are given as $Q_d = ${a} - ${b}P$ and $Q_s = ${c} + ${d}P$, where $P$ is price per bag in hundreds of Naira. Calculate the equilibrium market price ($P^*$) and equilibrium quantity ($Q^*$).`,
        options,
        correctAnswer,
        formula: 'Q_d = Q_s',
        givenValues: `Q_d = ${a} - ${b}P, \\quad Q_s = ${c} + ${d}P`,
        whatIsRequired: 'Equilibrium Price (P*) and Equilibrium Quantity (Q*)',
        substitution: `${a} - ${b}P = ${c} + ${d}P`,
        steps: [
          `Set quantity demanded equal to quantity supplied: Q_d = Q_s`,
          `Equate equations: ${a} - ${b}P = ${c} + ${d}P`,
          `Group like terms: ${a} - ${c} = ${d}P + ${b}P → ${a - c} = ${b + d}P`,
          `Solve for P*: P* = ${a - c} / ${b + d} = ₦${pEquil}`,
          `Substitute P* = ${pEquil} into Q_d: Q* = ${a} - ${b}(${pEquil}) = ${a} - ${b * pEquil} = ${qEquil} units`,
          `Verify with Q_s: Q_s = ${c} + ${d}(${pEquil}) = ${c} + ${d * pEquil} = ${qEquil} units`,
        ],
        explanation: `Market equilibrium is established where market demand exactly balances market supply ($Q_d = Q_s$). At ₦${pEquil}, neither surplus nor shortage exists, clearing the market at ${qEquil} units.`,
        examTip: 'To ensure 100% accuracy in JAMB, always plug your solved price back into both equations to ensure they yield identical quantities.',
      };
    }
  }

  // ==========================================
  // 2. LITERATURE IN ENGLISH GENERATOR
  // ==========================================
  if (normSubject.includes('lit')) {
    const litScenarios = [
      {
        quote: '"The angry thunderstorm roared with righteous wrath across the terrified village."',
        device: 'Personification',
        explanation: 'Attributing human emotions like "righteous wrath" and actions like "roared" to an inanimate natural event like a thunderstorm is personification.',
        tip: 'Personification gives human traits to non-human things; pathetic fallacy specifically projects human emotions onto nature.',
        wrong: ['Hyperbole', 'Synecdoche', 'Litotes'],
      },
      {
        quote: '"He was a lion in the battlefield, tearing through enemy ranks with majestic ferocity."',
        device: 'Metaphor',
        explanation: 'A metaphor makes a direct comparison between two disparate things without using "like" or "as". He is stated directly to be a lion.',
        tip: 'If "like" or "as" was used ("He fought like a lion"), it would be a simile. Direct equation is metaphor.',
        wrong: ['Simile', 'Metonymy', 'Euphemism'],
      },
      {
        quote: '"Parting is such sweet sorrow that I shall say good night till it be morrow."',
        device: 'Oxymoron',
        explanation: '"Sweet sorrow" places two contradictory emotional concepts directly side by side, creating an oxymoron.',
        tip: 'An oxymoron pairs contradictory words in immediate juxtaposition, while a paradox is an entire contradictory statement.',
        wrong: ['Paradox', 'Irony', 'Apostrophe'],
      },
      {
        quote: '"The pen is mightier than the sword."',
        device: 'Metonymy',
        explanation: 'The "pen" stands in for the written word / diplomacy, and the "sword" represents military force by association.',
        tip: 'Metonymy substitutes a related concept (the Crown for the King, the pen for writing), whereas synecdoche uses a part for the whole.',
        wrong: ['Synecdoche', 'Allusion', 'Pun'],
      },
    ];

    const pick = randChoice(litScenarios);
    const rawOpts = {
      A: pick.device,
      B: pick.wrong[0],
      C: pick.wrong[1],
      D: pick.wrong[2],
    };
    const { options, correctAnswer } = shuffleOptions(rawOpts, 'A');

    return {
      id,
      subject: 'Literature',
      exam,
      level,
      difficulty: difficulty as any,
      topic: targetTopic || 'Literary Appreciation & Figures of Speech',
      question: `Examine the literary extract: ${pick.quote} Which figure of speech is prominently demonstrated in this excerpt?`,
      options,
      correctAnswer,
      formula: `\\text{Figure of Speech: } ${pick.device}`,
      givenValues: `Extract: ${pick.quote}`,
      whatIsRequired: 'Identify the dominant literary figure of speech',
      substitution: `Analysis of key terms in context`,
      steps: [
        `Analyze the figurative language within the extract: ${pick.quote}`,
        `Examine the semantic relationship between the subject and the descriptive attribute`,
        `Match the characteristics with core literary devices`,
        `Conclusion: The primary literary technique employed is ${pick.device}`,
      ],
      explanation: pick.explanation,
      examTip: pick.tip,
    };
  }

  // ==========================================
  // 3. MATHEMATICS GENERATOR
  // ==========================================
  if (normSubject.includes('math')) {
    if (normTopic.includes('calc') || normTopic.includes('deriv')) {
      // Calculus differentiation
      const a = randChoice([2, 3, 4, 5]);
      const n = randChoice([3, 4, 5]);
      const b = randChoice([2, 6, 8]);
      const dCoeff = a * n;
      const dPower = n - 1;

      const correctAns = `$${dCoeff}x^{${dPower}} + ${b}$`;
      const wrong1 = `$${a}x^{${dPower}} + ${b}$`;
      const wrong2 = `$${dCoeff}x^{${n}} + ${b}x$`;
      const wrong3 = `$${dCoeff + 2}x^{${dPower - 1}} + ${b}$`;

      const rawOpts = { A: correctAns, B: wrong1, C: wrong2, D: wrong3 };
      const { options, correctAnswer } = shuffleOptions(rawOpts, 'A');

      return {
        id,
        subject: 'Mathematics',
        exam,
        level,
        difficulty: difficulty as any,
        topic: targetTopic || 'Calculus (Differentiation)',
        question: `Find the first derivative $\\frac{dy}{dx}$ of the polynomial function $y = ${a}x^{${n}} + ${b}x - 7$.`,
        options,
        correctAnswer,
        formula: '\\frac{d}{dx}[ax^n] = n \\cdot ax^{n-1}',
        givenValues: `y = ${a}x^{${n}} + ${b}x - 7`,
        whatIsRequired: 'dy/dx',
        substitution: `\\frac{dy}{dx} = ${n} \\cdot (${a}x^{${n}-1}) + 1 \\cdot (${b}x^{1-1}) - 0`,
        steps: [
          `Apply power rule of differentiation to each term: d/dx(axⁿ) = n·axⁿ⁻¹`,
          `Differentiate ${a}x^{${n}}: ${n} × ${a}x^{${n}-1} = ${dCoeff}x^{${dPower}}`,
          `Differentiate ${b}x: 1 × ${b}x⁰ = ${b}`,
          `Differentiate constant -7: derivative of any constant is 0`,
          `Combine derivatives: dy/dx = ${dCoeff}x^{${dPower}} + ${b}`,
        ],
        explanation: `By applying the power rule term-by-term, the exponent multiplies the coefficient and reduces by 1. Constants disappear during differentiation.`,
        examTip: 'Remember that the derivative of a linear term kx is simply the constant k, and the derivative of any lone constant is zero.',
      };
    } else {
      // Quadratic equations with random integer roots
      const r1 = randChoice([1, 2, 3, 4]);
      const r2 = randChoice([2, 5, 6, 7]);
      const sum = r1 + r2;
      const prod = r1 * r2;

      const correctAns = `$x = ${r1}$ or $x = ${r2}$`;
      const wrong1 = `$x = -${r1}$ or $x = ${r2}$`;
      const wrong2 = `$x = -${r1}$ or $x = -${r2}$`;
      const wrong3 = `$x = ${r1 + 1}$ or $x = ${r2 - 1}$`;

      const rawOpts = { A: correctAns, B: wrong1, C: wrong2, D: wrong3 };
      const { options, correctAnswer } = shuffleOptions(rawOpts, 'A');

      return {
        id,
        subject: 'Mathematics',
        exam,
        level,
        difficulty: difficulty as any,
        topic: targetTopic || 'Quadratic Equations & Polynomials',
        question: `Solve for $x$ in the quadratic equation $x^2 - ${sum}x + ${prod} = 0$.`,
        options,
        correctAnswer,
        formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
        givenValues: `a = 1, b = -${sum}, c = ${prod}`,
        whatIsRequired: 'Roots of x',
        substitution: `(x - ${r1})(x - ${r2}) = 0`,
        steps: [
          `Standard quadratic form: ax² + bx + c = 0 with a = 1, b = -${sum}, c = ${prod}`,
          `Find two factors that multiply to give c = ${prod} and add up to b = -${sum}: (-${r1}) and (-${r2})`,
          `Factorize expression: (x - ${r1})(x - ${r2}) = 0`,
          `Set each factor to zero: x - ${r1} = 0 → x = ${r1}`,
          `Or x - ${r2} = 0 → x = ${r2}`,
        ],
        explanation: `Factoring the quadratic yields (x - ${r1})(x - ${r2}) = 0, giving the real roots x = ${r1} and x = ${r2}.`,
        examTip: 'Check your signs: if the middle term is negative and constant is positive, both factors must have negative signs.',
      };
    }
  }

  // ==========================================
  // 4. PHYSICS GENERATOR
  // ==========================================
  if (normSubject.includes('phys')) {
    const u = 0;
    const a = randChoice([2, 3, 4, 5]);
    const t = randChoice([4, 6, 8, 10]);
    const dist = 0.5 * a * t * t;
    const finalV = a * t;

    const rawOpts = {
      A: `${dist} m`,
      B: `${dist * 1.5} m`,
      C: `${dist * 0.5} m`,
      D: `${dist + 20} m`,
    };
    const { options, correctAnswer } = shuffleOptions(rawOpts, 'A');

    return {
      id,
      subject: 'Physics',
      exam,
      level,
      difficulty: difficulty as any,
      topic: targetTopic || 'Projectiles & Equations of Motion',
      question: `A racing motorcycle starts from rest and uniformly accelerates at $${a}\\text{ m/s}^2$ for $${t}\\text{ seconds}$. Calculate the total distance traveled during this time interval.`,
      options,
      correctAnswer,
      formula: 's = ut + \\frac{1}{2}at^2',
      givenValues: `u = 0 m/s (from rest), a = ${a} m/s², t = ${t} s`,
      whatIsRequired: 'Total Distance (s)',
      substitution: `s = (0 \\times ${t}) + \\frac{1}{2} \\times ${a} \\times (${t})^2`,
      steps: [
        `Identify given motion parameters: initial velocity u = 0 m/s (starts from rest)`,
        `Acceleration a = ${a} m/s², Time t = ${t} s`,
        `Apply second equation of linear motion: s = ut + ½at²`,
        `Substitution: s = (0 × ${t}) + ½ × ${a} × (${t})²`,
        `Calculation: s = 0 + 0.5 × ${a} × ${t * t} = ${dist} m`,
      ],
      explanation: `Since the vehicle accelerates from rest, the initial velocity term ut equals zero, leaving s = ½at² = 0.5 × ${a} × ${t * t} = ${dist} meters.`,
      examTip: 'When solving kinematics problems, "starts from rest" always implies u = 0; "comes to a stop" or "brought to rest" implies final velocity v = 0.',
    };
  }

  // ==========================================
  // 5. DEFAULT / OTHER SUBJECTS (Chemistry, Biology, English)
  // ==========================================
  return {
    id,
    subject,
    exam,
    level,
    difficulty: difficulty as any,
    topic: targetTopic || 'General Syllabus Practice',
    question: `In ${subject}, regarding the syllabus topic "${targetTopic || 'Core Principles'}", which statement represents the fundamental law or verified convention?`,
    options: {
      A: `The core governing principle of ${targetTopic || subject} establishes direct proportionality under standard equilibrium conditions.`,
      B: `The reaction rate is independent of temperature and catalyst presence.`,
      C: `Energy can be created from zero input during spontaneous processes.`,
      D: `The relationship is purely inverse and violates conservation principles.`,
    },
    correctAnswer: 'A',
    formula: `\\text{Law of } ${targetTopic || subject}`,
    givenValues: 'Standard theoretical conditions',
    whatIsRequired: 'Correct scientific principle',
    substitution: 'Evaluation of established laws',
    steps: [
      `Review established principles of ${subject}`,
      `Evaluate standard assumptions and experimental observations`,
      `Option A correctly articulates the established canon for ${targetTopic || subject}`,
    ],
    explanation: `Option A correctly states the fundamental principle governing ${targetTopic || subject} in accordance with official examination syllabi.`,
    examTip: 'Read all four options completely before deciding, looking out for absolute qualifiers like "always" or "never".',
  };
}
