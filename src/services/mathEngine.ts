import { StepSolution } from '../types';

/**
 * Format numbers cleanly (trimming floating point inaccuracies)
 */
export function formatNum(n: number, decimals: number = 4): string {
  if (isNaN(n)) return 'NaN';
  if (!isFinite(n)) return n > 0 ? '∞' : '-∞';
  if (Math.abs(n) < 1e-12 && n !== 0) return '0';
  if (Number.isInteger(n)) return n.toString();
  // Round to prevent floating point inaccuracies like 0.30000000000000004
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(n * factor) / factor;
  return rounded.toString();
}

/**
 * Greatest common divisor
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

/**
 * Lowest common multiple
 */
export function lcm(a: number, b: number): number {
  return Math.abs(Math.round(a * b)) / gcd(a, b);
}

/**
 * Factorial function
 */
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// -------------------------------------------------------------
// 1. SCIENTIFIC EXPRESSION EVALUATOR (BODMAS compliant)
// -------------------------------------------------------------

export function evaluateExpression(expr: string, angleMode: 'deg' | 'rad' = 'deg'): { result: number; steps: string[] } {
  const steps: string[] = [];
  if (!expr || !expr.trim()) {
    throw new Error('Please enter a mathematical expression.');
  }

  steps.push(`Original Expression: ${expr}`);
  steps.push(`Angle Mode: ${angleMode.toUpperCase()}`);

  let clean = expr
    .trim()
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/½/g, '0.5');

  // Handle implicit multiplication:
  // e.g. 2(3) -> 2*(3), (2)(3) -> (2)*(3), 2sin(30) -> 2*sin(30), 5pi -> 5*pi, 3e -> 3*e, 2sqrt(4) -> 2*sqrt(4)
  clean = clean.replace(/(\d)(\()/g, '$1*$2');
  clean = clean.replace(/(\))(\d)/g, '$1*$2');
  clean = clean.replace(/(\))(\()/g, '$1*$2');
  clean = clean.replace(/(\d)(sin|cos|tan|asin|acos|atan|log|ln|sqrt|π|pi|e)\b/gi, '$1*$2');
  clean = clean.replace(/(\))(sin|cos|tan|asin|acos|atan|log|ln|sqrt|π|pi|e)\b/gi, '$1*$2');

  // Handle percentages: e.g. 50% -> (50*0.01)
  clean = clean.replace(/(\d+(\.\d+)?)%/g, '($1 * 0.01)');

  // Auto-close missing parentheses
  const openCount = (clean.match(/\(/g) || []).length;
  const closeCount = (clean.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    clean = clean + ')'.repeat(openCount - closeCount);
    steps.push(`Balanced unclosed parentheses`);
  }

  // Trigonometry helpers with exact degree handling
  const safeSin = (val: number) => {
    if (angleMode === 'deg') {
      const normalized = ((val % 360) + 360) % 360;
      if (normalized === 0 || normalized === 180 || normalized === 360) return 0;
      if (normalized === 90) return 1;
      if (normalized === 270) return -1;
      if (normalized === 30 || normalized === 150) return 0.5;
      if (normalized === 210 || normalized === 330) return -0.5;
      return Math.sin((val * Math.PI) / 180);
    }
    return Math.sin(val);
  };

  const safeCos = (val: number) => {
    if (angleMode === 'deg') {
      const normalized = ((val % 360) + 360) % 360;
      if (normalized === 90 || normalized === 270) return 0;
      if (normalized === 0 || normalized === 360) return 1;
      if (normalized === 180) return -1;
      if (normalized === 60 || normalized === 300) return 0.5;
      if (normalized === 120 || normalized === 240) return -0.5;
      return Math.cos((val * Math.PI) / 180);
    }
    return Math.cos(val);
  };

  const safeTan = (val: number) => {
    if (angleMode === 'deg') {
      const normalized = ((val % 360) + 360) % 360;
      if (normalized === 90 || normalized === 270) throw new Error('tan(90°) is undefined');
      if (normalized === 45 || normalized === 225) return 1;
      if (normalized === 135 || normalized === 315) return -1;
      return Math.tan((val * Math.PI) / 180);
    }
    return Math.tan(val);
  };

  const safeAsin = (val: number) => {
    if (val < -1 || val > 1) throw new Error('asin argument must be in [-1, 1]');
    const rad = Math.asin(val);
    return angleMode === 'deg' ? (rad * 180) / Math.PI : rad;
  };

  const safeAcos = (val: number) => {
    if (val < -1 || val > 1) throw new Error('acos argument must be in [-1, 1]');
    const rad = Math.acos(val);
    return angleMode === 'deg' ? (rad * 180) / Math.PI : rad;
  };

  const safeAtan = (val: number) => {
    const rad = Math.atan(val);
    return angleMode === 'deg' ? (rad * 180) / Math.PI : rad;
  };

  try {
    const parseTokens = clean
      .replace(/π/g, `${Math.PI}`)
      .replace(/\bpi\b/gi, `${Math.PI}`)
      .replace(/\be\b/g, `${Math.E}`)
      .replace(/(\d+)!/g, (_, n) => `${factorial(parseInt(n))}`)
      .replace(/asin\(([^)]+)\)/gi, (_, v) => `safeAsin(${v})`)
      .replace(/acos\(([^)]+)\)/gi, (_, v) => `safeAcos(${v})`)
      .replace(/atan\(([^)]+)\)/gi, (_, v) => `safeAtan(${v})`)
      .replace(/sin\(([^)]+)\)/gi, (_, v) => `safeSin(${v})`)
      .replace(/cos\(([^)]+)\)/gi, (_, v) => `safeCos(${v})`)
      .replace(/tan\(([^)]+)\)/gi, (_, v) => `safeTan(${v})`)
      .replace(/sqrt\(([^)]+)\)/gi, (_, v) => `Math.sqrt(${v})`)
      .replace(/√\(([^)]+)\)/g, (_, v) => `Math.sqrt(${v})`)
      .replace(/√(\d+(\.\d+)?)/g, (_, v) => `Math.sqrt(${v})`)
      .replace(/log\(([^)]+)\)/gi, (_, v) => `Math.log10(${v})`)
      .replace(/ln\(([^)]+)\)/gi, (_, v) => `Math.log(${v})`)
      .replace(/abs\(([^)]+)\)/gi, (_, v) => `Math.abs(${v})`)
      .replace(/\^/g, '**');

    const evalFunc = new Function(
      'safeSin',
      'safeCos',
      'safeTan',
      'safeAsin',
      'safeAcos',
      'safeAtan',
      'Math',
      `return (${parseTokens});`
    );

    const val = evalFunc(safeSin, safeCos, safeTan, safeAsin, safeAcos, safeAtan, Math);

    if (typeof val !== 'number' || isNaN(val)) {
      throw new Error('Invalid calculation result');
    }

    steps.push(`Evaluated expression: ${formatNum(val, 6)}`);
    return { result: val, steps };
  } catch (err: any) {
    throw new Error('Syntax error: ' + (err.message || 'Check numbers and brackets.'));
  }
}

// -------------------------------------------------------------
// 2. FRACTIONS CALCULATOR
// -------------------------------------------------------------

export function calculateFractions(
  num1: number,
  den1: number,
  op: '+' | '-' | '*' | '/',
  num2: number,
  den2: number
): StepSolution {
  if (den1 === 0 || den2 === 0) {
    throw new Error('Denominator cannot be zero.');
  }

  const steps: string[] = [];
  let resNum = 0;
  let resDen = 1;
  const f1 = `${num1}/${den1}`;
  const f2 = `${num2}/${den2}`;

  steps.push(`First fraction: ${f1}, Second fraction: ${f2}`);

  if (op === '+' || op === '-') {
    const commonDen = lcm(den1, den2);
    const m1 = commonDen / den1;
    const m2 = commonDen / den2;
    const scaledNum1 = num1 * m1;
    const scaledNum2 = num2 * m2;

    steps.push(`Find LCM of denominators ${den1} and ${den2} = ${commonDen}`);
    steps.push(`Convert fractions: (${num1}×${m1})/${commonDen} = ${scaledNum1}/${commonDen}, (${num2}×${m2})/${commonDen} = ${scaledNum2}/${commonDen}`);

    if (op === '+') {
      resNum = scaledNum1 + scaledNum2;
      steps.push(`Add numerators: (${scaledNum1} + ${scaledNum2}) / ${commonDen} = ${resNum}/${commonDen}`);
    } else {
      resNum = scaledNum1 - scaledNum2;
      steps.push(`Subtract numerators: (${scaledNum1} - ${scaledNum2}) / ${commonDen} = ${resNum}/${commonDen}`);
    }
    resDen = commonDen;
  } else if (op === '*') {
    resNum = num1 * num2;
    resDen = den1 * den2;
    steps.push(`Multiply numerators: ${num1} × ${num2} = ${resNum}`);
    steps.push(`Multiply denominators: ${den1} × ${den2} = ${resDen}`);
    steps.push(`Unsimplified fraction: ${resNum}/${resDen}`);
  } else if (op === '/') {
    if (num2 === 0) throw new Error('Cannot divide by zero fraction.');
    steps.push(`Multiply by reciprocal of second fraction: (${f1}) × (${den2}/${num2})`);
    resNum = num1 * den2;
    resDen = den1 * num2;
    steps.push(`Result before simplification: ${resNum}/${resDen}`);
  }

  if (resDen < 0) {
    resNum = -resNum;
    resDen = -resDen;
  }

  const divisor = gcd(resNum, resDen);
  const simpNum = resNum / divisor;
  const simpDen = resDen / divisor;

  if (divisor > 1) {
    steps.push(`Simplify by dividing both numerator and denominator by GCD (${divisor}): ${simpNum}/${simpDen}`);
  }

  let finalAnswer = `${simpNum}/${simpDen}`;
  if (simpDen === 1) {
    finalAnswer = `${simpNum}`;
  } else if (Math.abs(simpNum) > simpDen) {
    const whole = Math.trunc(simpNum / simpDen);
    const rem = Math.abs(simpNum % simpDen);
    finalAnswer += ` (or mixed fraction: ${whole} ${rem}/${simpDen})`;
  }
  const decimalVal = (resNum / resDen).toFixed(4);
  finalAnswer += ` ≈ ${decimalVal}`;

  return {
    title: 'Fraction Arithmetic',
    category: 'Mathematics',
    subCategory: 'Fractions',
    problemStatement: `${f1} ${op} ${f2}`,
    formula: op === '+' ? 'a/b + c/d = (ad + bc)/bd' : op === '*' ? '(a/b) × (c/d) = (ac)/(bd)' : '(a/b) ÷ (c/d) = (ad)/(bc)',
    substitution: `(${num1}/${den1}) ${op} (${num2}/${den2})`,
    steps,
    finalAnswer,
  };
}

// -------------------------------------------------------------
// 3. PERCENTAGES, RATIOS & PROPORTIONS
// -------------------------------------------------------------

export function calculatePercentage(type: 'of' | 'increase' | 'decrease' | 'is_what_percent', a: number, b: number): StepSolution {
  const steps: string[] = [];
  let formula = '';
  let substitution = '';
  let finalAnswer = '';

  if (type === 'of') {
    formula = 'Result = (P / 100) × Total';
    substitution = `(${a} / 100) × ${b}`;
    steps.push(`Convert ${a}% to decimal: ${a} / 100 = ${a / 100}`);
    steps.push(`Multiply by ${b}: ${a / 100} × ${b}`);
    const ans = (a / 100) * b;
    finalAnswer = `${formatNum(ans)}`;
  } else if (type === 'increase') {
    formula = 'New Value = Original × (1 + P / 100)';
    substitution = `${b} × (1 + ${a} / 100)`;
    const inc = (a / 100) * b;
    const ans = b + inc;
    steps.push(`Calculate increase amount: (${a} / 100) × ${b} = ${formatNum(inc)}`);
    steps.push(`Add to original: ${b} + ${formatNum(inc)} = ${formatNum(ans)}`);
    finalAnswer = `${formatNum(ans)}`;
  } else if (type === 'decrease') {
    formula = 'New Value = Original × (1 - P / 100)';
    substitution = `${b} × (1 - ${a} / 100)`;
    const dec = (a / 100) * b;
    const ans = b - dec;
    steps.push(`Calculate decrease amount: (${a} / 100) × ${b} = ${formatNum(dec)}`);
    steps.push(`Subtract from original: ${b} - ${formatNum(dec)} = ${formatNum(ans)}`);
    finalAnswer = `${formatNum(ans)}`;
  } else {
    if (b === 0) throw new Error('Base cannot be zero');
    formula = 'Percentage = (Part / Whole) × 100%';
    substitution = `(${a} / ${b}) × 100%`;
    const ans = (a / b) * 100;
    steps.push(`Divide part by whole: ${a} / ${b} = ${formatNum(a / b, 6)}`);
    steps.push(`Multiply by 100%: ${formatNum(a / b, 6)} × 100% = ${formatNum(ans)}%`);
    finalAnswer = `${formatNum(ans)}%`;
  }

  return {
    title: 'Percentage Calculation',
    category: 'Mathematics',
    subCategory: 'Percentages',
    formula,
    substitution,
    steps,
    finalAnswer,
  };
}

export function calculateRatioSharing(totalAmount: number, ratioStr: string): StepSolution {
  const parts = ratioStr
    .split(':')
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);

  if (parts.length < 2) {
    throw new Error('Please enter at least two ratio parts, e.g., 2:3 or 1:2:3');
  }

  const sumParts = parts.reduce((acc, curr) => acc + curr, 0);
  const steps: string[] = [];

  steps.push(`Given total amount: ${totalAmount}`);
  steps.push(`Given ratio: ${parts.join(' : ')}`);
  steps.push(`Sum of ratio parts = ${parts.join(' + ')} = ${sumParts}`);
  steps.push(`Value of 1 part = Total / Sum = ${totalAmount} / ${sumParts} = ${formatNum(totalAmount / sumParts, 4)}`);

  const shares = parts.map((p, idx) => {
    const val = (p / sumParts) * totalAmount;
    steps.push(`Share ${idx + 1} (${p} parts) = (${p} / ${sumParts}) × ${totalAmount} = ${formatNum(val, 2)}`);
    return formatNum(val, 2);
  });

  return {
    title: 'Ratio Sharing',
    category: 'Mathematics',
    subCategory: 'Ratios and Proportions',
    problemStatement: `Share ${totalAmount} in ratio ${ratioStr}`,
    formula: 'Share_i = (Ratio_i / Total Ratio Parts) × Total Amount',
    substitution: `(${parts.join(' : ')}) applied to ${totalAmount}`,
    steps,
    finalAnswer: shares.join(' : '),
  };
}

// -------------------------------------------------------------
// 4. QUADRATIC EQUATIONS (All 3 Methods)
// -------------------------------------------------------------

export function solveQuadratic(a: number, b: number, c: number, method: 'formula' | 'factor' | 'square' = 'formula'): StepSolution {
  if (a === 0) {
    throw new Error("Coefficient 'a' cannot be zero in a quadratic equation (ax² + bx + c = 0).");
  }

  const steps: string[] = [];
  const discriminant = b * b - 4 * a * c;
  const eqStr = `${a === 1 ? '' : a === -1 ? '-' : a}x² ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}x ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} = 0`;

  steps.push(`Identified coefficients: a = ${a}, b = ${b}, c = ${c}`);

  if (method === 'formula') {
    steps.push(`Quadratic Formula: x = [-b ± √(b² - 4ac)] / (2a)`);
    steps.push(`Calculate Discriminant (Δ) = b² - 4ac`);
    steps.push(`Δ = (${b})² - 4(${a})(${c}) = ${b * b} - ${4 * a * c} = ${discriminant}`);

    if (discriminant > 0) {
      const sqrtD = Math.sqrt(discriminant);
      steps.push(`Since Δ > 0, there are two distinct real roots.`);
      steps.push(`√Δ = √${discriminant} = ${formatNum(sqrtD, 4)}`);
      const x1 = (-b + sqrtD) / (2 * a);
      const x2 = (-b - sqrtD) / (2 * a);
      steps.push(`x₁ = [-(${b}) + ${formatNum(sqrtD, 4)}] / (2 × ${a}) = ${formatNum(-b + sqrtD, 4)} / ${2 * a} = ${formatNum(x1, 4)}`);
      steps.push(`x₂ = [-(${b}) - ${formatNum(sqrtD, 4)}] / (2 × ${a}) = ${formatNum(-b - sqrtD, 4)} / ${2 * a} = ${formatNum(x2, 4)}`);
      return {
        title: 'Quadratic Equation (Formula Method)',
        category: 'Mathematics',
        subCategory: 'Quadratic equations',
        problemStatement: eqStr,
        formula: 'x = (-b ± √(b² - 4ac)) / (2a)',
        substitution: `x = (-(${b}) ± √(${b}² - 4(${a})(${c}))) / (2(${a}))`,
        steps,
        finalAnswer: `x = ${formatNum(x1, 4)} or x = ${formatNum(x2, 4)}`,
      };
    } else if (discriminant === 0) {
      const x = -b / (2 * a);
      steps.push(`Since Δ = 0, there is a single repeated real root.`);
      steps.push(`x = -(${b}) / (2 × ${a}) = ${formatNum(x, 4)}`);
      return {
        title: 'Quadratic Equation (Formula Method)',
        category: 'Mathematics',
        subCategory: 'Quadratic equations',
        problemStatement: eqStr,
        formula: 'x = -b / (2a)',
        substitution: `x = -(${b}) / (2 × ${a})`,
        steps,
        finalAnswer: `x = ${formatNum(x, 4)} (repeated root)`,
      };
    } else {
      const realPart = -b / (2 * a);
      const imagPart = Math.sqrt(-discriminant) / (2 * Math.abs(a));
      steps.push(`Since Δ < 0, roots are complex conjugates.`);
      steps.push(`x = ${formatNum(realPart, 4)} ± ${formatNum(imagPart, 4)}i`);
      return {
        title: 'Quadratic Equation (Formula Method)',
        category: 'Mathematics',
        subCategory: 'Quadratic equations',
        problemStatement: eqStr,
        formula: 'x = (-b ± i√|b² - 4ac|) / (2a)',
        substitution: `x = (-(${b}) ± √(${discriminant})) / (2 × ${a})`,
        steps,
        finalAnswer: `x = ${formatNum(realPart, 4)} + ${formatNum(imagPart, 4)}i or x = ${formatNum(realPart, 4)} - ${formatNum(imagPart, 4)}i`,
      };
    }
  } else if (method === 'square') {
    steps.push(`Completing the square method:`);
    steps.push(`1. Divide entire equation by a (${a}):`);
    const bOverA = b / a;
    const cOverA = c / a;
    steps.push(`   x² + (${formatNum(bOverA, 4)})x + (${formatNum(cOverA, 4)}) = 0`);
    steps.push(`2. Move constant term to RHS:`);
    steps.push(`   x² + (${formatNum(bOverA, 4)})x = ${formatNum(-cOverA, 4)}`);
    const halfB = bOverA / 2;
    const halfBSq = halfB * halfB;
    steps.push(`3. Add (b/2a)² = (${formatNum(halfB, 4)})² = ${formatNum(halfBSq, 4)} to both sides:`);
    const rhs = -cOverA + halfBSq;
    steps.push(`   (x + ${formatNum(halfB, 4)})² = ${formatNum(-cOverA, 4)} + ${formatNum(halfBSq, 4)} = ${formatNum(rhs, 4)}`);
    if (rhs >= 0) {
      const sqrtRHS = Math.sqrt(rhs);
      steps.push(`4. Take square root of both sides:`);
      steps.push(`   x + ${formatNum(halfB, 4)} = ±${formatNum(sqrtRHS, 4)}`);
      const x1 = -halfB + sqrtRHS;
      const x2 = -halfB - sqrtRHS;
      steps.push(`5. Solve for x:`);
      steps.push(`   x₁ = ${formatNum(-halfB, 4)} + ${formatNum(sqrtRHS, 4)} = ${formatNum(x1, 4)}`);
      steps.push(`   x₂ = ${formatNum(-halfB, 4)} - ${formatNum(sqrtRHS, 4)} = ${formatNum(x2, 4)}`);
      return {
        title: 'Quadratic Equation (Completing the Square)',
        category: 'Mathematics',
        subCategory: 'Completing the square',
        problemStatement: eqStr,
        formula: '(x + b/2a)² = (b² - 4ac) / 4a²',
        substitution: `(x + ${formatNum(halfB, 4)})² = ${formatNum(rhs, 4)}`,
        steps,
        finalAnswer: `x = ${formatNum(x1, 4)} or x = ${formatNum(x2, 4)}`,
      };
    } else {
      steps.push(`4. Right hand side is negative (${formatNum(rhs, 4)}), yielding imaginary roots.`);
      const imag = Math.sqrt(-rhs);
      return {
        title: 'Quadratic Equation (Completing the Square)',
        category: 'Mathematics',
        subCategory: 'Completing the square',
        problemStatement: eqStr,
        formula: '(x + b/2a)² = negative number',
        substitution: `(x + ${formatNum(halfB, 4)})² = ${formatNum(rhs, 4)}`,
        steps,
        finalAnswer: `x = ${formatNum(-halfB, 4)} ± ${formatNum(imag, 4)}i`,
      };
    }
  } else {
    // Factorization
    steps.push(`Factorization method:`);
    const ac = a * c;
    steps.push(`Multiply a and c: ac = ${a} × ${c} = ${ac}`);
    steps.push(`Find two numbers that multiply to ${ac} and add up to b = ${b}`);

    let factor1: number | null = null;
    let factor2: number | null = null;

    for (let i = -Math.abs(ac); i <= Math.abs(ac); i++) {
      if (i !== 0 && ac % i === 0) {
        const j = ac / i;
        if (i + j === b) {
          factor1 = i;
          factor2 = j;
          break;
        }
      }
    }

    if (factor1 !== null && factor2 !== null) {
      steps.push(`Factors found: ${factor1} and ${factor2} (since ${factor1} × ${factor2} = ${ac} and ${factor1} + ${factor2} = ${b})`);
      steps.push(`Rewrite middle term: ${a}x² ${factor1 >= 0 ? '+' : ''}${factor1}x ${factor2 >= 0 ? '+' : ''}${factor2}x ${c >= 0 ? '+' : ''}${c} = 0`);
      const x1 = -factor1 / a;
      const x2 = -factor2 / a;
      steps.push(`Factor by grouping: x = -(${factor1})/${a} or x = -(${factor2})/${a}`);
      return {
        title: 'Quadratic Equation (Factorization)',
        category: 'Mathematics',
        subCategory: 'Factorization',
        problemStatement: eqStr,
        formula: 'ax² + bx + c = (px + q)(rx + s) = 0',
        substitution: `Splitting bx into ${factor1}x + ${factor2}x`,
        steps,
        finalAnswer: `x = ${formatNum(x1, 4)} or x = ${formatNum(x2, 4)}`,
      };
    } else {
      steps.push(`Integer factorization is not cleanly possible. Falling back to the quadratic formula.`);
      return solveQuadratic(a, b, c, 'formula');
    }
  }
}

// -------------------------------------------------------------
// 5. SIMULTANEOUS EQUATIONS (2 Variables)
// -------------------------------------------------------------

export function solveSimultaneous(
  a1: number,
  b1: number,
  c1: number,
  a2: number,
  b2: number,
  c2: number
): StepSolution {
  const steps: string[] = [];
  const eq1 = `${a1}x + ${b1}y = ${c1}`;
  const eq2 = `${a2}x + ${b2}y = ${c2}`;

  steps.push(`Equation (1): ${eq1}`);
  steps.push(`Equation (2): ${eq2}`);

  const D = a1 * b2 - a2 * b1;
  const Dx = c1 * b2 - c2 * b1;
  const Dy = a1 * c2 - a2 * c1;

  steps.push(`Using Elimination / Determinant Method:`);
  steps.push(`Main Determinant D = (a1·b2 - a2·b1) = (${a1} × ${b2}) - (${a2} × ${b1}) = ${D}`);

  if (Math.abs(D) < 1e-9) {
    if (Math.abs(Dx) < 1e-9 && Math.abs(Dy) < 1e-9) {
      throw new Error('Infinite solutions exist (the two lines are coincident / identical).');
    } else {
      throw new Error('No solution exists (the two lines are parallel and never intersect).');
    }
  }

  steps.push(`Determinant for x (Dx) = (c1·b2 - c2·b1) = (${c1} × ${b2}) - (${c2} × ${b1}) = ${Dx}`);
  steps.push(`Determinant for y (Dy) = (a1·c2 - a2·c1) = (${a1} × ${c2}) - (${a2} × ${c1}) = ${Dy}`);

  const x = Dx / D;
  const y = Dy / D;

  steps.push(`Calculate x = Dx / D = ${Dx} / ${D} = ${formatNum(x, 4)}`);
  steps.push(`Calculate y = Dy / D = ${Dy} / ${D} = ${formatNum(y, 4)}`);
  steps.push(`Verification in Eq (1): ${a1}(${formatNum(x, 2)}) + ${b1}(${formatNum(y, 2)}) = ${formatNum(a1 * x + b1 * y, 2)} = ${c1} ✓`);

  return {
    title: 'Simultaneous Linear Equations',
    category: 'Mathematics',
    subCategory: 'Simultaneous equations',
    problemStatement: `${eq1} and ${eq2}`,
    formula: 'x = (c₁b₂ - c₂b₁) / (a₁b₂ - a₂b₁),  y = (a₁c₂ - a₂c₁) / (a₁b₂ - a₂b₁)',
    substitution: `D = ${D}, Dx = ${Dx}, Dy = ${Dy}`,
    steps,
    finalAnswer: `x = ${formatNum(x, 4)},  y = ${formatNum(y, 4)}`,
  };
}

// -------------------------------------------------------------
// 6. LINEAR EQUATIONS (ax + b = cx + d)
// -------------------------------------------------------------

export function solveLinear(a: number, b: number, c: number, d: number = 0): StepSolution {
  const steps: string[] = [];
  const eqStr = d === 0 ? `${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} = ${c}` : `${a}x + ${b} = ${c}x + ${d}`;

  steps.push(`Equation: ${eqStr}`);
  const coeffX = a - c;
  const constant = d - b;

  steps.push(`Collect terms with 'x' on LHS and constants on RHS:`);
  steps.push(`(${a} - ${c})x = ${d} - ${b}`);
  steps.push(`${coeffX}x = ${constant}`);

  if (Math.abs(coeffX) < 1e-9) {
    if (Math.abs(constant) < 1e-9) {
      throw new Error('Identity: Any real number x is a valid solution.');
    } else {
      throw new Error('Contradiction: No solution exists.');
    }
  }

  const x = constant / coeffX;
  steps.push(`Divide both sides by ${coeffX}:`);
  steps.push(`x = ${constant} / ${coeffX} = ${formatNum(x, 4)}`);

  return {
    title: 'Linear Equation',
    category: 'Mathematics',
    subCategory: 'Linear equations',
    problemStatement: eqStr,
    formula: 'x = (d - b) / (a - c)',
    substitution: `x = (${d} - ${b}) / (${a} - ${c})`,
    steps,
    finalAnswer: `x = ${formatNum(x, 4)}`,
  };
}

// -------------------------------------------------------------
// 7. SEQUENCES & SERIES (AP & GP)
// -------------------------------------------------------------

export function calculateAP(a: number, d: number, n: number): StepSolution {
  const steps: string[] = [];
  steps.push(`First term (a) = ${a}`);
  steps.push(`Common difference (d) = ${d}`);
  steps.push(`Number of terms (n) = ${n}`);

  const Tn = a + (n - 1) * d;
  steps.push(`Formula for nth term: Tn = a + (n - 1)d`);
  steps.push(`T_${n} = ${a} + (${n} - 1) × ${d} = ${a} + ${(n - 1) * d} = ${formatNum(Tn)}`);

  const Sn = (n / 2) * (2 * a + (n - 1) * d);
  steps.push(`Formula for Sum of n terms: Sn = (n/2) × [2a + (n - 1)d]`);
  steps.push(`S_${n} = (${n}/2) × [2(${a}) + (${n}-1)(${d})]`);
  steps.push(`S_${n} = ${n / 2} × [${2 * a} + ${(n - 1) * d}] = ${n / 2} × ${2 * a + (n - 1) * d} = ${formatNum(Sn)}`);

  return {
    title: 'Arithmetic Progression (AP)',
    category: 'Mathematics',
    subCategory: 'Arithmetic progression (AP)',
    problemStatement: `AP with first term a = ${a}, common difference d = ${d}, n = ${n}`,
    formula: 'Tn = a + (n - 1)d;  Sn = n/2 [2a + (n - 1)d]',
    substitution: `T_${n} = ${a} + (${n}-1)(${d}); S_${n} = (${n}/2)[2(${a}) + (${n}-1)(${d})]`,
    steps,
    finalAnswer: `T_${n} = ${formatNum(Tn)},  S_${n} = ${formatNum(Sn)}`,
  };
}

export function calculateGP(a: number, r: number, n: number): StepSolution {
  const steps: string[] = [];
  steps.push(`First term (a) = ${a}`);
  steps.push(`Common ratio (r) = ${r}`);
  steps.push(`Number of terms (n) = ${n}`);

  const Tn = a * Math.pow(r, n - 1);
  steps.push(`Formula for nth term: Tn = a · r^(n-1)`);
  steps.push(`T_${n} = ${a} × (${r})^(${n} - 1) = ${a} × (${r})^${n - 1} = ${formatNum(Tn, 4)}`);

  let Sn = 0;
  if (r === 1) {
    Sn = a * n;
    steps.push(`Since r = 1, Sn = n × a = ${n} × ${a} = ${Sn}`);
  } else {
    Sn = (a * (1 - Math.pow(r, n))) / (1 - r);
    steps.push(`Formula for Sum: Sn = a(1 - r^n) / (1 - r)`);
    steps.push(`S_${n} = [${a} × (1 - (${r})^${n})] / (1 - ${r}) = ${formatNum(Sn, 4)}`);
  }

  let sumInf = 'Undefined (|r| ≥ 1)';
  if (Math.abs(r) < 1) {
    const sInfVal = a / (1 - r);
    sumInf = `${formatNum(sInfVal, 4)}`;
    steps.push(`Sum to infinity (S∞): S∞ = a / (1 - r) = ${a} / (1 - ${r}) = ${sumInf}`);
  }

  return {
    title: 'Geometric Progression (GP)',
    category: 'Mathematics',
    subCategory: 'Geometric progression (GP)',
    problemStatement: `GP with a = ${a}, r = ${r}, n = ${n}`,
    formula: 'Tn = a·r^(n-1);  Sn = a(1 - r^n)/(1 - r);  S∞ = a/(1 - r)',
    substitution: `T_${n} = ${a}·(${r})^${n-1}; S_${n} = ${a}(1 - ${r}^${n})/(1 - ${r})`,
    steps,
    finalAnswer: `T_${n} = ${formatNum(Tn, 4)},  S_${n} = ${formatNum(Sn, 4)}${Math.abs(r) < 1 ? ', S∞ = ' + sumInf : ''}`,
  };
}

// -------------------------------------------------------------
// 8. COORDINATE GEOMETRY
// -------------------------------------------------------------

export function calculateCoordinateGeometry(x1: number, y1: number, x2: number, y2: number): StepSolution {
  const steps: string[] = [];
  steps.push(`Points given: P₁(${x1}, ${y1}) and P₂(${x2}, ${y2})`);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const distSq = dx * dx + dy * dy;
  const dist = Math.sqrt(distSq);
  steps.push(`1. Distance Formula: d = √[(x₂ - x₁)² + (y₂ - y₁)²]`);
  steps.push(`   d = √[(${x2} - ${x1})² + (${y2} - ${y1})²] = √[(${dx})² + (${dy})²]`);
  steps.push(`   d = √[${dx * dx} + ${dy * dy}] = √${distSq} ≈ ${formatNum(dist, 4)} units`);

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  steps.push(`2. Midpoint Formula: M = ((x₁ + x₂)/2, (y₁ + y₂)/2)`);
  steps.push(`   M = ((${x1} + ${x2})/2, (${y1} + ${y2})/2) = (${formatNum(mx, 2)}, ${formatNum(my, 2)})`);

  let gradientStr = '';
  let lineEq = '';
  if (Math.abs(dx) < 1e-9) {
    gradientStr = 'Undefined (vertical line)';
    lineEq = `x = ${x1}`;
    steps.push(`3. Gradient m = (y₂ - y₁)/(x₂ - x₁) = ${dy}/0 -> Undefined (Vertical line)`);
    steps.push(`4. Equation of line: ${lineEq}`);
  } else {
    const m = dy / dx;
    gradientStr = formatNum(m, 4);
    steps.push(`3. Gradient Formula: m = (y₂ - y₁) / (x₂ - x₁) = (${y2} - ${y1}) / (${x2} - ${x1}) = ${dy} / ${dx} = ${gradientStr}`);

    const c = y1 - m * x1;
    const cStr = c >= 0 ? `+ ${formatNum(c, 2)}` : `- ${formatNum(Math.abs(c), 2)}`;
    lineEq = `y = ${formatNum(m, 2)}x ${cStr}`;
    steps.push(`4. Equation of straight line: y - y₁ = m(x - x₁)`);
    steps.push(`   y - (${y1}) = ${gradientStr}(x - (${x1}))`);
    steps.push(`   ${lineEq}`);
  }

  return {
    title: 'Coordinate Geometry',
    category: 'Mathematics',
    subCategory: 'Coordinate geometry',
    problemStatement: `Line connecting (${x1}, ${y1}) and (${x2}, ${y2})`,
    formula: 'd = √((Δx)² + (Δy)²);  m = Δy/Δx;  M = ((x₁+x₂)/2, (y₁+y₂)/2)',
    substitution: `Δx = ${dx}, Δy = ${dy}`,
    steps,
    finalAnswer: `Distance = ${formatNum(dist, 4)},  Midpoint = (${formatNum(mx, 2)}, ${formatNum(my, 2)}),  Gradient = ${gradientStr},  Equation: ${lineEq}`,
  };
}

// -------------------------------------------------------------
// 9. STATISTICS
// -------------------------------------------------------------

export function calculateStatistics(numbersStr: string): StepSolution {
  const nums = numbersStr
    .split(/[,\s]+/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));

  if (nums.length === 0) {
    throw new Error('Please enter at least one valid number separated by commas or spaces.');
  }

  const steps: string[] = [];
  const n = nums.length;
  steps.push(`Count of data points (n) = ${n}`);
  steps.push(`Original data: ${nums.join(', ')}`);

  const sorted = [...nums].sort((a, b) => a - b);
  steps.push(`Sorted data: ${sorted.join(', ')}`);

  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  steps.push(`1. Mean (x̄) = Σx / n = (${sum}) / ${n} = ${formatNum(mean, 4)}`);

  let median = 0;
  if (n % 2 === 1) {
    median = sorted[Math.floor(n / 2)];
    steps.push(`2. Median = Middle value at position (${n} + 1)/2 = item ${Math.floor(n / 2) + 1} = ${median}`);
  } else {
    const mid1 = sorted[n / 2 - 1];
    const mid2 = sorted[n / 2];
    median = (mid1 + mid2) / 2;
    steps.push(`2. Median = Average of 2 middle values at pos ${n / 2} and ${n / 2 + 1}: (${mid1} + ${mid2}) / 2 = ${median}`);
  }

  const freq: Record<number, number> = {};
  nums.forEach((val) => (freq[val] = (freq[val] || 0) + 1));
  let maxFreq = 0;
  for (const k in freq) {
    if (freq[k] > maxFreq) maxFreq = freq[k];
  }
  let modeStr = '';
  if (maxFreq <= 1) {
    modeStr = 'No mode (all values appear once)';
  } else {
    const modes = Object.keys(freq).filter((k) => freq[Number(k)] === maxFreq);
    modeStr = modes.join(', ');
  }
  steps.push(`3. Mode (highest frequency = ${maxFreq}): ${modeStr}`);

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;
  steps.push(`4. Range = Max - Min = ${max} - ${min} = ${range}`);

  const sumSquaredDiff = nums.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0);
  const sampleVariance = n > 1 ? sumSquaredDiff / (n - 1) : 0;
  const sampleSD = Math.sqrt(sampleVariance);
  steps.push(`5. Variance (s²) = Σ(x - x̄)² / (n - 1) = ${formatNum(sumSquaredDiff, 4)} / ${n - 1} = ${formatNum(sampleVariance, 4)}`);
  steps.push(`6. Standard Deviation (s) = √Variance = √${formatNum(sampleVariance, 4)} = ${formatNum(sampleSD, 4)}`);

  return {
    title: 'Descriptive Statistics',
    category: 'Mathematics',
    subCategory: 'Statistics',
    problemStatement: `Dataset of ${n} numbers: [${nums.join(', ')}]`,
    formula: 'Mean = Σx/n, Median = middle, Range = Max - Min, SD = √(Σ(x-x̄)²/(n-1))',
    substitution: `Σx = ${sum}, n = ${n}`,
    steps,
    finalAnswer: `Mean = ${formatNum(mean, 4)}, Median = ${formatNum(median, 4)}, Mode = ${modeStr}, Range = ${range}, SD = ${formatNum(sampleSD, 4)}`,
  };
}

// -------------------------------------------------------------
// 10. PERMUTATIONS, COMBINATIONS
// -------------------------------------------------------------

export function calculateCombinatorics(n: number, r: number, type: 'perm' | 'comb'): StepSolution {
  if (n < 0 || r < 0 || !Number.isInteger(n) || !Number.isInteger(r)) {
    throw new Error('n and r must be non-negative integers.');
  }
  if (r > n) {
    throw new Error('r cannot be greater than n.');
  }

  const steps: string[] = [];
  steps.push(`Total items (n) = ${n}`);
  steps.push(`Items chosen (r) = ${r}`);

  const factN = factorial(n);
  const factR = factorial(r);
  const factNminusR = factorial(n - r);

  steps.push(`n! = ${n}! = ${factN}`);
  steps.push(`(n - r)! = (${n} - ${r})! = ${n - r}! = ${factNminusR}`);

  if (type === 'perm') {
    const result = factN / factNminusR;
    steps.push(`Permutation Formula: ⁿPᵣ = n! / (n - r)!`);
    steps.push(`ⁿPᵣ = ${factN} / ${factNminusR} = ${result}`);
    return {
      title: 'Permutations (ⁿPᵣ)',
      category: 'Mathematics',
      subCategory: 'Permutations and combinations',
      problemStatement: `Arranging ${r} items from ${n} items`,
      formula: 'ⁿPᵣ = n! / (n - r)!',
      substitution: `${n}! / (${n} - ${r})!`,
      steps,
      finalAnswer: `${result}`,
    };
  } else {
    const result = factN / (factR * factNminusR);
    steps.push(`r! = ${r}! = ${factR}`);
    steps.push(`Combination Formula: ⁿCᵣ = n! / [r! · (n - r)!]`);
    steps.push(`ⁿCᵣ = ${factN} / [${factR} × ${factNminusR}] = ${factN} / ${factR * factNminusR} = ${result}`);
    return {
      title: 'Combinations (ⁿCᵣ)',
      category: 'Mathematics',
      subCategory: 'Permutations and combinations',
      problemStatement: `Choosing ${r} items from ${n} items`,
      formula: 'ⁿCᵣ = n! / (r! × (n - r)!)',
      substitution: `${n}! / (${r}! × ${n - r}!)`,
      steps,
      finalAnswer: `${result}`,
    };
  }
}

// -------------------------------------------------------------
// 11. DYNAMIC POLYNOMIAL PARSER & CALCULUS
// -------------------------------------------------------------

export interface PolyTerm {
  coeff: number;
  power: number;
}

/**
 * Parses any polynomial string (e.g. "3x^2 - 5x + 4" or "4x^3 - 2x + 7") into terms
 */
export function parsePolynomial(polyStr: string, variable: string = 'x'): PolyTerm[] {
  let clean = polyStr
    .trim()
    .replace(/\s+/g, '')
    .replace(/−/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3');

  if (!clean) return [{ coeff: 0, power: 0 }];

  // Standardize signs: prepend + if positive first term
  if (!clean.startsWith('+') && !clean.startsWith('-')) {
    clean = '+' + clean;
  }

  // Regex matches: ([+-])(\d*(?:\.\d+)?)?(?:x(?:\^([+-]?\d+))?)?
  const regex = new RegExp(`([+-])(\\d*(?:\\.\\d+)?)?(?:${variable}(?:\\^([+-]?\\d+))?)?`, 'gi');
  const termsMap: Record<number, number> = {};

  let match: RegExpExecArray | null;
  while ((match = regex.exec(clean)) !== null) {
    if (match.index === regex.lastIndex) regex.lastIndex++;
    const sign = match[1] === '-' ? -1 : 1;
    const rawCoeff = match[2];
    const fullMatch = match[0];
    if (!fullMatch || fullMatch === '+' || fullMatch === '-') continue;

    const hasVar = fullMatch.toLowerCase().includes(variable.toLowerCase());
    let coeff = 1;
    if (rawCoeff !== undefined && rawCoeff !== '') {
      coeff = parseFloat(rawCoeff);
    } else if (!hasVar) {
      continue;
    }

    coeff = coeff * sign;

    let power = 0;
    if (hasVar) {
      const rawPower = match[3];
      if (rawPower !== undefined && rawPower !== '') {
        power = parseInt(rawPower);
      } else {
        power = 1;
      }
    }

    termsMap[power] = (termsMap[power] || 0) + coeff;
  }

  const terms: PolyTerm[] = Object.keys(termsMap)
    .map((p) => ({ power: parseInt(p), coeff: termsMap[parseInt(p)] }))
    .filter((t) => t.coeff !== 0)
    .sort((a, b) => b.power - a.power);

  return terms.length > 0 ? terms : [{ coeff: 0, power: 0 }];
}

export function calculateDifferentiation(terms: PolyTerm[], evalAt?: number): StepSolution {
  const steps: string[] = [];
  const origTermsStr = terms
    .map((t) => {
      if (t.power === 0) return `${t.coeff}`;
      if (t.power === 1) return `${t.coeff === 1 ? '' : t.coeff === -1 ? '-' : t.coeff}x`;
      return `${t.coeff === 1 ? '' : t.coeff === -1 ? '-' : t.coeff}x^${t.power}`;
    })
    .join(' + ')
    .replace(/\+ -/g, '- ');

  steps.push(`Function: f(x) = ${origTermsStr}`);
  steps.push(`Power Rule of Differentiation: d/dx (a·xⁿ) = a·n·x^(n-1)`);

  const diffTerms = terms
    .map((t) => {
      const newCoeff = t.coeff * t.power;
      const newPower = t.power - 1;
      steps.push(`Derivative of ${t.coeff}x^${t.power} = ${t.coeff} × ${t.power} · x^(${t.power} - 1) = ${newCoeff}x^${newPower}`);
      return { coeff: newCoeff, power: newPower };
    })
    .filter((t) => t.coeff !== 0);

  const diffStr =
    diffTerms.length === 0
      ? '0'
      : diffTerms
          .map((t) => {
            if (t.power === 0) return `${formatNum(t.coeff)}`;
            if (t.power === 1) return `${t.coeff === 1 ? '' : t.coeff === -1 ? '-' : formatNum(t.coeff)}x`;
            return `${t.coeff === 1 ? '' : t.coeff === -1 ? '-' : formatNum(t.coeff)}x^${t.power}`;
          })
          .join(' + ')
          .replace(/\+ -/g, '- ');

  steps.push(`f'(x) = ${diffStr}`);

  let finalAnswer = `f'(x) = ${diffStr}`;
  if (evalAt !== undefined && !isNaN(evalAt)) {
    const val = diffTerms.reduce((acc, t) => acc + t.coeff * Math.pow(evalAt, t.power), 0);
    steps.push(`Evaluate derivative at x = ${evalAt}:`);
    steps.push(`f'(${evalAt}) = ${formatNum(val, 4)}`);
    finalAnswer += `,  at x = ${evalAt}: f'(${evalAt}) = ${formatNum(val, 4)}`;
  }

  return {
    title: 'Differentiation',
    category: 'Mathematics',
    subCategory: 'Calculus: differentiation and integration',
    problemStatement: `Differentiate f(x) = ${origTermsStr}`,
    formula: 'd/dx [a·xⁿ] = a·n·x^(n-1)',
    substitution: `Applied term-by-term`,
    steps,
    finalAnswer,
  };
}

export function calculateIntegration(
  terms: PolyTerm[],
  definite: boolean = false,
  lowerBound: number = 0,
  upperBound: number = 0
): StepSolution {
  const steps: string[] = [];
  const origStr = terms
    .map((t) => (t.power === 0 ? `${t.coeff}` : t.power === 1 ? `${t.coeff}x` : `${t.coeff}x^${t.power}`))
    .join(' + ')
    .replace(/\+ -/g, '- ');

  steps.push(`Integrand: f(x) = ${origStr}`);
  steps.push(`Power Rule of Integration: ∫ (a·xⁿ) dx = [a / (n + 1)] · x^(n + 1) + C  (for n ≠ -1)`);

  const intTerms = terms.map((t) => {
    if (t.power === -1) {
      steps.push(`Integral of ${t.coeff}/x = ${t.coeff} · ln|x|`);
      return { coeff: t.coeff, power: 0, isLog: true };
    }
    const newCoeff = t.coeff / (t.power + 1);
    const newPower = t.power + 1;
    steps.push(`Integral of ${t.coeff}x^${t.power} = (${t.coeff} / ${t.power + 1}) · x^${newPower} = ${formatNum(newCoeff, 3)}x^${newPower}`);
    return { coeff: newCoeff, power: newPower, isLog: false };
  });

  const intStr = intTerms
    .map((t) => {
      if (t.isLog) return `${formatNum(t.coeff)} ln|x|`;
      if (t.power === 1) return `${formatNum(t.coeff)}x`;
      return `${formatNum(t.coeff)}x^${t.power}`;
    })
    .join(' + ')
    .replace(/\+ -/g, '- ');

  if (!definite) {
    return {
      title: 'Indefinite Integration',
      category: 'Mathematics',
      subCategory: 'Calculus: differentiation and integration',
      problemStatement: `∫ (${origStr}) dx`,
      formula: '∫ a·xⁿ dx = (a / (n+1))·x^(n+1) + C',
      substitution: `Applied term-by-term`,
      steps,
      finalAnswer: `${intStr || '0'} + C`,
    };
  } else {
    steps.push(`Evaluate definite integral from x = ${lowerBound} to x = ${upperBound}:`);
    const evalAt = (x: number) => {
      return intTerms.reduce((sum, t) => {
        if (t.isLog) return sum + t.coeff * Math.log(Math.abs(x) || 1e-12);
        return sum + t.coeff * Math.pow(x, t.power);
      }, 0);
    };

    const valUpper = evalAt(upperBound);
    const valLower = evalAt(lowerBound);
    const defResult = valUpper - valLower;

    steps.push(`F(${upperBound}) = ${formatNum(valUpper, 4)}`);
    steps.push(`F(${lowerBound}) = ${formatNum(valLower, 4)}`);
    steps.push(`Result = F(${upperBound}) - F(${lowerBound}) = ${formatNum(valUpper, 4)} - (${formatNum(valLower, 4)}) = ${formatNum(defResult, 4)}`);

    return {
      title: 'Definite Integration',
      category: 'Mathematics',
      subCategory: 'Calculus: differentiation and integration',
      problemStatement: `∫ from ${lowerBound} to ${upperBound} of (${origStr}) dx`,
      formula: '∫[a, b] f(x) dx = F(b) - F(a)',
      substitution: `F(${upperBound}) - F(${lowerBound})`,
      steps,
      finalAnswer: `${formatNum(defResult, 4)}`,
    };
  }
}

// -------------------------------------------------------------
// 12. TRIGONOMETRY & PYTHAGORAS
// -------------------------------------------------------------

export function calculatePythagoras(find: 'hypotenuse' | 'leg', a: number, b: number): StepSolution {
  const steps: string[] = [];
  if (find === 'hypotenuse') {
    steps.push(`Right-angled triangle with legs a = ${a}, b = ${b}`);
    steps.push(`Pythagoras Theorem: c² = a² + b² => c = √(a² + b²)`);
    const cSq = a * a + b * b;
    const c = Math.sqrt(cSq);
    steps.push(`c = √(${a}² + ${b}²) = √(${a * a} + ${b * b}) = √${cSq} = ${formatNum(c, 4)}`);
    const area = 0.5 * a * b;
    steps.push(`Area of right triangle = ½ × a × b = 0.5 × ${a} × ${b} = ${formatNum(area, 4)}`);
    const angleA = (Math.atan(a / b) * 180) / Math.PI;
    const angleB = 90 - angleA;
    steps.push(`Angles: θ₁ = ${formatNum(angleA, 2)}°, θ₂ = ${formatNum(angleB, 2)}°`);

    return {
      title: 'Pythagoras Theorem (Find Hypotenuse)',
      category: 'Mathematics',
      subCategory: 'Trigonometry',
      problemStatement: `Right triangle with legs a = ${a}, b = ${b}`,
      formula: 'c = √(a² + b²)',
      substitution: `c = √(${a}² + ${b}²)`,
      steps,
      finalAnswer: `Hypotenuse c = ${formatNum(c, 4)} (Area = ${formatNum(area, 2)})`,
    };
  } else {
    // b is hypotenuse, a is known leg
    if (b <= a) throw new Error('Hypotenuse must be strictly greater than the leg.');
    steps.push(`Right triangle with known leg = ${a}, hypotenuse = ${b}`);
    steps.push(`Pythagoras Theorem: leg = √(hypotenuse² - leg²)`);
    const diff = b * b - a * a;
    const leg = Math.sqrt(diff);
    steps.push(`leg = √(${b}² - ${a}²) = √(${b * b} - ${a * a}) = √${diff} = ${formatNum(leg, 4)}`);
    const area = 0.5 * a * leg;
    return {
      title: 'Pythagoras Theorem (Find Leg)',
      category: 'Mathematics',
      subCategory: 'Trigonometry',
      problemStatement: `Right triangle with leg = ${a}, hypotenuse = ${b}`,
      formula: 'leg = √(hypotenuse² - leg²)',
      substitution: `leg = √(${b}² - ${a}²)`,
      steps,
      finalAnswer: `Unknown Leg = ${formatNum(leg, 4)} (Area = ${formatNum(area, 2)})`,
    };
  }
}

// -------------------------------------------------------------
// 13. MENSURATION (2D & 3D Shapes)
// -------------------------------------------------------------

export function calculateMensuration(shape: 'circle' | 'cylinder' | 'sphere' | 'cone', p1: number, p2?: number): StepSolution {
  const steps: string[] = [];

  if (shape === 'circle') {
    const r = p1;
    const area = Math.PI * r * r;
    const circum = 2 * Math.PI * r;
    steps.push(`Radius r = ${r}`);
    steps.push(`1. Circumference C = 2πr = 2 × π × ${r} = ${formatNum(circum, 4)}`);
    steps.push(`2. Area A = πr² = π × (${r})² = ${formatNum(area, 4)}`);
    return {
      title: 'Mensuration: Circle',
      category: 'Mathematics',
      subCategory: 'Mensuration',
      problemStatement: `Circle with radius r = ${r}`,
      formula: 'A = πr²,  C = 2πr',
      substitution: `A = π(${r})², C = 2π(${r})`,
      steps,
      finalAnswer: `Area = ${formatNum(area, 4)}, Circumference = ${formatNum(circum, 4)}`,
    };
  } else if (shape === 'cylinder') {
    const r = p1;
    const h = p2 || 1;
    const vol = Math.PI * r * r * h;
    const csa = 2 * Math.PI * r * h;
    const tsa = 2 * Math.PI * r * (r + h);
    steps.push(`Radius r = ${r}, Height h = ${h}`);
    steps.push(`1. Volume V = πr²h = π × ${r}² × ${h} = ${formatNum(vol, 4)}`);
    steps.push(`2. Curved Surface Area CSA = 2πrh = 2 × π × ${r} × ${h} = ${formatNum(csa, 4)}`);
    steps.push(`3. Total Surface Area TSA = 2πr(r + h) = 2 × π × ${r} × (${r} + ${h}) = ${formatNum(tsa, 4)}`);
    return {
      title: 'Mensuration: Cylinder',
      category: 'Mathematics',
      subCategory: 'Mensuration',
      problemStatement: `Cylinder with radius r = ${r}, height h = ${h}`,
      formula: 'V = πr²h,  CSA = 2πrh,  TSA = 2πr(r+h)',
      substitution: `V = π(${r})²(${h})`,
      steps,
      finalAnswer: `Volume = ${formatNum(vol, 4)}, TSA = ${formatNum(tsa, 4)}, CSA = ${formatNum(csa, 4)}`,
    };
  } else if (shape === 'sphere') {
    const r = p1;
    const vol = (4 / 3) * Math.PI * Math.pow(r, 3);
    const sa = 4 * Math.PI * r * r;
    steps.push(`Radius r = ${r}`);
    steps.push(`1. Volume V = 4/3 π r³ = 4/3 × π × (${r})³ = ${formatNum(vol, 4)}`);
    steps.push(`2. Surface Area A = 4πr² = 4 × π × (${r})² = ${formatNum(sa, 4)}`);
    return {
      title: 'Mensuration: Sphere',
      category: 'Mathematics',
      subCategory: 'Mensuration',
      problemStatement: `Sphere with radius r = ${r}`,
      formula: 'V = (4/3)πr³,  A = 4πr²',
      substitution: `V = (4/3)π(${r})³, A = 4π(${r})²`,
      steps,
      finalAnswer: `Volume = ${formatNum(vol, 4)}, Surface Area = ${formatNum(sa, 4)}`,
    };
  } else {
    // cone
    const r = p1;
    const h = p2 || 1;
    const l = Math.sqrt(r * r + h * h);
    const vol = (1 / 3) * Math.PI * r * r * h;
    const csa = Math.PI * r * l;
    const tsa = Math.PI * r * (r + l);
    steps.push(`Radius r = ${r}, Height h = ${h}`);
    steps.push(`1. Slant Height l = √(r² + h²) = √(${r}² + ${h}²) = ${formatNum(l, 4)}`);
    steps.push(`2. Volume V = 1/3 π r² h = 1/3 × π × ${r}² × ${h} = ${formatNum(vol, 4)}`);
    steps.push(`3. Total Surface Area TSA = πr(r + l) = π × ${r} × (${r} + ${formatNum(l, 2)}) = ${formatNum(tsa, 4)}`);
    return {
      title: 'Mensuration: Cone',
      category: 'Mathematics',
      subCategory: 'Mensuration',
      problemStatement: `Cone with radius r = ${r}, height h = ${h}`,
      formula: 'l = √(r²+h²), V = (1/3)πr²h, TSA = πr(r+l)',
      substitution: `V = 1/3 π(${r})²(${h})`,
      steps,
      finalAnswer: `Volume = ${formatNum(vol, 4)}, Slant Height = ${formatNum(l, 4)}, TSA = ${formatNum(tsa, 4)}`,
    };
  }
}

// -------------------------------------------------------------
// 14. MATRICES & VECTORS
// -------------------------------------------------------------

export function calculateMatrix2x2(a: number, b: number, c: number, d: number): StepSolution {
  const steps: string[] = [];
  steps.push(`Matrix A = [[${a}, ${b}], [${c}, ${d}]]`);

  const det = a * d - b * c;
  steps.push(`1. Determinant: det(A) = (a·d) - (b·c)`);
  steps.push(`   det(A) = (${a} × ${d}) - (${b} × ${c}) = ${a * d} - ${b * c} = ${det}`);

  const trace = a + d;
  steps.push(`2. Trace: tr(A) = a + d = ${a} + ${d} = ${trace}`);

  let invStr = 'Matrix is singular (det = 0), inverse does not exist.';
  if (Math.abs(det) > 1e-9) {
    const invA = formatNum(d / det, 3);
    const invB = formatNum(-b / det, 3);
    const invC = formatNum(-c / det, 3);
    const invD = formatNum(a / det, 3);
    invStr = `[[${invA}, ${invB}], [${invC}, ${invD}]]`;
    steps.push(`3. Inverse Matrix Formula: A⁻¹ = (1 / det(A)) × [[d, -b], [-c, a]]`);
    steps.push(`   A⁻¹ = (1 / ${det}) × [[${d}, ${-b}], [${-c}, ${a}]]`);
    steps.push(`   A⁻¹ = ${invStr}`);
  } else {
    steps.push(`3. Inverse does not exist because det(A) = 0`);
  }

  return {
    title: '2x2 Matrix Analysis',
    category: 'Mathematics',
    subCategory: 'Matrices and vectors',
    problemStatement: `Matrix [[${a}, ${b}], [${c}, ${d}]]`,
    formula: 'det = ad - bc,  A⁻¹ = 1/det [[d, -b], [-c, a]]',
    substitution: `det = (${a})(${d}) - (${b})(${c})`,
    steps,
    finalAnswer: `Determinant = ${det}, Trace = ${trace}, Inverse = ${invStr}`,
  };
}

export function calculateVectors3D(
  v1: [number, number, number],
  v2: [number, number, number]
): StepSolution {
  const steps: string[] = [];
  const [x1, y1, z1] = v1;
  const [x2, y2, z2] = v2;

  steps.push(`Vector A = ${x1}i + ${y1}j + ${z1}k`);
  steps.push(`Vector B = ${x2}i + ${y2}j + ${z2}k`);

  const magA = Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1);
  const magB = Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2);
  steps.push(`|A| = √(${x1}² + ${y1}² + ${z1}²) = √${x1 * x1 + y1 * y1 + z1 * z1} = ${formatNum(magA, 4)}`);
  steps.push(`|B| = √(${x2}² + ${y2}² + ${z2}²) = √${x2 * x2 + y2 * y2 + z2 * z2} = ${formatNum(magB, 4)}`);

  const dot = x1 * x2 + y1 * y2 + z1 * z2;
  steps.push(`Dot Product: A · B = (x₁x₂ + y₁y₂ + z₁z₂)`);
  steps.push(`A · B = (${x1}×${x2}) + (${y1}×${y2}) + (${z1}×${z2}) = ${dot}`);

  let angleDeg = 0;
  if (magA > 0 && magB > 0) {
    const cosTheta = Math.max(-1, Math.min(1, dot / (magA * magB)));
    angleDeg = (Math.acos(cosTheta) * 180) / Math.PI;
    steps.push(`cos(θ) = (A · B) / (|A| |B|) = ${dot} / (${formatNum(magA, 3)} × ${formatNum(magB, 3)})`);
    steps.push(`θ = ${formatNum(angleDeg, 2)}°`);
  }

  const cx = y1 * z2 - z1 * y2;
  const cy = z1 * x2 - x1 * z2;
  const cz = x1 * y2 - y1 * x2;
  steps.push(`Cross Product: A × B = i(y₁z₂ - z₁y₂) - j(x₁z₂ - z₁x₂) + k(x₁y₂ - y₁x₂)`);
  steps.push(`A × B = ${cx}i + ${cy}j + ${cz}k`);

  return {
    title: '3D Vector Operations',
    category: 'Mathematics',
    subCategory: 'Matrices and vectors',
    problemStatement: `A = (${x1}, ${y1}, ${z1}), B = (${x2}, ${y2}, ${z2})`,
    formula: 'A · B = x₁x₂ + y₁y₂ + z₁z₂,  cos θ = (A · B)/(|A||B|),  A × B = det',
    substitution: `A · B = ${dot}`,
    steps,
    finalAnswer: `Dot Product = ${dot}, Angle = ${formatNum(angleDeg, 2)}°, Cross Product = (${cx}, ${cy}, ${cz})`,
  };
}

// -------------------------------------------------------------
// 14. SIMPLE & COMPOUND INTEREST CALCULATOR
// -------------------------------------------------------------

export function calculateFinancialInterest(
  principal: number,
  annualRatePct: number,
  timeYears: number,
  type: 'simple' | 'compound' = 'compound',
  compoundsPerYear: number = 1
): StepSolution {
  const steps: string[] = [];
  const P = principal;
  const R = annualRatePct;
  const T = timeYears;

  steps.push(`Principal (P) = ${formatNum(P)}`);
  steps.push(`Annual Interest Rate (R) = ${R}%`);
  steps.push(`Time (T) = ${T} years`);

  if (type === 'simple') {
    const interest = (P * R * T) / 100;
    const totalAmount = P + interest;
    steps.push(`Simple Interest Formula: I = (P × R × T) / 100`);
    steps.push(`Substitute: I = (${P} × ${R} × ${T}) / 100`);
    steps.push(`Numerator: ${P * R * T}`);
    steps.push(`Simple Interest (I) = ${formatNum(interest)}`);
    steps.push(`Total Accrued Amount (A) = Principal + Interest = ${P} + ${formatNum(interest)} = ${formatNum(totalAmount)}`);

    return {
      title: 'Simple Interest Calculation',
      category: 'Mathematics',
      subCategory: 'Financial Mathematics',
      problemStatement: `P = ${P}, Rate = ${R}%, Time = ${T} years (Simple Interest)`,
      formula: 'I = (P × R × T) / 100,  A = P + I',
      substitution: `I = (${P} × ${R} × ${T}) / 100 = ${formatNum(interest)}`,
      steps,
      finalAnswer: `Interest = ${formatNum(interest)}, Total Amount = ${formatNum(totalAmount)}`,
    };
  } else {
    const n = compoundsPerYear || 1;
    steps.push(`Compounding frequency (n) = ${n} time(s) per year`);
    const rateDecimal = R / 100;
    const base = 1 + rateDecimal / n;
    const exponent = n * T;
    const totalAmount = P * Math.pow(base, exponent);
    const compoundInterest = totalAmount - P;

    steps.push(`Compound Interest Formula: A = P × (1 + r/n)^(n×t)`);
    steps.push(`Rate in decimal (r) = ${R} / 100 = ${rateDecimal}`);
    steps.push(`Term (1 + r/n) = 1 + (${rateDecimal} / ${n}) = ${formatNum(base, 6)}`);
    steps.push(`Total compounding periods (n × t) = ${n} × ${T} = ${exponent}`);
    steps.push(`Growth Factor = (${formatNum(base, 6)})^${exponent} = ${formatNum(Math.pow(base, exponent), 6)}`);
    steps.push(`Total Amount (A) = ${P} × ${formatNum(Math.pow(base, exponent), 6)} = ${formatNum(totalAmount, 2)}`);
    steps.push(`Compound Interest Earned = A - P = ${formatNum(totalAmount, 2)} - ${P} = ${formatNum(compoundInterest, 2)}`);

    return {
      title: 'Compound Interest Calculation',
      category: 'Mathematics',
      subCategory: 'Financial Mathematics',
      problemStatement: `P = ${P}, Rate = ${R}%, Time = ${T} yrs, Compounded ${n}x/yr`,
      formula: 'A = P(1 + r/n)^(nt),  CI = A - P',
      substitution: `A = ${P} × (1 + ${rateDecimal}/${n})^(${n}×${T})`,
      steps,
      finalAnswer: `Total Amount = ${formatNum(totalAmount, 2)}, Compound Interest = ${formatNum(compoundInterest, 2)}`,
    };
  }
}

// -------------------------------------------------------------
// 15. LOGARITHMS & EXPONENTIAL LAWS
// -------------------------------------------------------------

export function calculateLogarithms(
  base: number,
  value: number,
  targetBase: number = 10
): StepSolution {
  const steps: string[] = [];

  if (base <= 0 || base === 1) throw new Error('Base must be positive and not equal to 1.');
  if (value <= 0) throw new Error('Logarithm argument must be strictly positive (> 0).');

  steps.push(`Evaluating: log_${base}(${value})`);
  steps.push(`Definition: If y = log_b(x), then b^y = x`);

  const result = Math.log(value) / Math.log(base);

  steps.push(`Change of Base Formula: log_b(x) = ln(x) / ln(b)`);
  steps.push(`ln(${value}) = ${formatNum(Math.log(value), 6)}`);
  steps.push(`ln(${base}) = ${formatNum(Math.log(base), 6)}`);
  steps.push(`Compute: ${formatNum(Math.log(value), 6)} ÷ ${formatNum(Math.log(base), 6)} = ${formatNum(result, 6)}`);
  steps.push(`Verification: ${base}^(${formatNum(result, 4)}) = ${formatNum(Math.pow(base, result), 4)} ≈ ${value}`);

  if (targetBase && targetBase !== base) {
    const converted = Math.log(value) / Math.log(targetBase);
    steps.push(`Converted to base ${targetBase}: log_${targetBase}(${value}) = ${formatNum(converted, 6)}`);
  }

  return {
    title: 'Logarithm Evaluation',
    category: 'Mathematics',
    subCategory: 'Algebra & Logarithms',
    problemStatement: `log_${base}(${value})`,
    formula: 'log_b(x) = ln(x) / ln(b)  ⟺  b^y = x',
    substitution: `log_${base}(${value}) = ln(${value}) / ln(${base})`,
    steps,
    finalAnswer: `${formatNum(result, 6)}`,
  };
}

// -------------------------------------------------------------
// 16. CIRCLE THEOREMS & CIRCLE EQUATION
// -------------------------------------------------------------

export function calculateCircleGeometry(
  centerX: number,
  centerY: number,
  radius: number,
  sectorAngleDeg: number = 60
): StepSolution {
  const steps: string[] = [];
  const h = centerX;
  const k = centerY;
  const r = radius;

  if (r <= 0) throw new Error('Circle radius must be strictly positive.');

  steps.push(`Circle Center C(h, k) = (${h}, ${k})`);
  steps.push(`Radius (r) = ${r}`);

  const hSign = h >= 0 ? `- ${h}` : `+ ${Math.abs(h)}`;
  const kSign = k >= 0 ? `- ${k}` : `+ ${Math.abs(k)}`;
  const rSquared = r * r;
  const circleEq = `(x ${hSign})² + (y ${kSign})² = ${rSquared}`;

  steps.push(`Standard Circle Equation: (x - h)² + (y - k)² = r²`);
  steps.push(`Equation: ${circleEq}`);

  const diameter = 2 * r;
  const circumference = 2 * Math.PI * r;
  const area = Math.PI * r * r;

  steps.push(`Diameter (D) = 2r = 2 × ${r} = ${diameter}`);
  steps.push(`Circumference (C) = 2πr = 2 × π × ${r} = ${formatNum(circumference, 4)}`);
  steps.push(`Area (A) = πr² = π × (${r})² = ${formatNum(area, 4)}`);

  let sectorArea = 0;
  let arcLength = 0;
  if (sectorAngleDeg > 0) {
    arcLength = (sectorAngleDeg / 360) * 2 * Math.PI * r;
    sectorArea = (sectorAngleDeg / 360) * Math.PI * r * r;
    steps.push(`Sector Angle (θ) = ${sectorAngleDeg}°`);
    steps.push(`Arc Length (s) = (θ / 360) × 2πr = (${sectorAngleDeg} / 360) × ${formatNum(circumference, 4)} = ${formatNum(arcLength, 4)}`);
    steps.push(`Sector Area = (θ / 360) × πr² = (${sectorAngleDeg} / 360) × ${formatNum(area, 4)} = ${formatNum(sectorArea, 4)}`);
  }

  return {
    title: 'Circle Geometry and Equation',
    category: 'Mathematics',
    subCategory: 'Coordinate Geometry',
    problemStatement: `Center (${h}, ${k}), Radius r = ${r}`,
    formula: '(x - h)² + (y - k)² = r²,  Area = πr²,  Circumference = 2πr',
    substitution: circleEq,
    steps,
    finalAnswer: `Eq: ${circleEq}, Area = ${formatNum(area, 4)}, Circumference = ${formatNum(circumference, 4)}`,
  };
}

// -------------------------------------------------------------
// 17. BINOMIAL THEOREM EXPANSION
// -------------------------------------------------------------

export function calculateBinomialExpansion(
  aCoeff: number,
  bCoeff: number,
  n: number
): StepSolution {
  const steps: string[] = [];

  if (n < 0 || !Number.isInteger(n) || n > 12) {
    throw new Error('Exponent n must be an integer between 0 and 12 for expansion.');
  }

  const exprStr = `(${aCoeff === 1 ? '' : aCoeff}x + ${bCoeff})^${n}`;
  steps.push(`Binomial Expression: ${exprStr}`);
  steps.push(`Binomial Theorem Formula: (a + b)ⁿ = Σ [nCr × aⁿ⁻ʳ × bʳ] for r = 0 to n`);

  const terms: string[] = [];
  const termDetails: string[] = [];

  for (let r = 0; r <= n; r++) {
    // nCr
    const comb = factorial(n) / (factorial(r) * factorial(n - r));
    const powerA = n - r;
    const powerB = r;

    const coeffA = Math.pow(aCoeff, powerA);
    const coeffB = Math.pow(bCoeff, powerB);
    const finalCoeff = comb * coeffA * coeffB;

    let termVar = '';
    if (powerA > 1) termVar = `x^${powerA}`;
    else if (powerA === 1) termVar = 'x';

    const termFormatted = termVar ? `${finalCoeff === 1 && termVar ? '' : finalCoeff}${termVar}` : `${finalCoeff}`;
    terms.push(termFormatted);

    termDetails.push(
      `Term ${r + 1} (r=${r}): ⁿCᵣ × (${aCoeff}x)^${powerA} × (${bCoeff})^${powerB} = ${comb} × ${coeffA}${termVar ? termVar : ''} × ${coeffB} = ${termFormatted}`
    );
  }

  steps.push(...termDetails);
  const expansion = terms.join(' + ').replace(/\+\s\-/g, '- ');
  steps.push(`Full Expanded Polynomial: ${expansion}`);

  return {
    title: 'Binomial Theorem Expansion',
    category: 'Mathematics',
    subCategory: 'Algebra',
    problemStatement: `Expand ${exprStr}`,
    formula: '(a + b)ⁿ = Σ [ⁿCᵣ × aⁿ⁻ʳ × bʳ]',
    substitution: `Expanded with n = ${n}`,
    steps,
    finalAnswer: expansion,
  };
}

