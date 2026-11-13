import { evaluateExpression, formatNum } from './mathEngine';

export interface DeterministicComputeResult {
  computed: boolean;
  valueText?: string;
  latex?: string;
  steps?: string[];
  error?: string;
}

/**
 * Converts common LaTeX constructs into plain BODMAS expressions that evaluateExpression understands.
 */
export function latexToPlainExpression(latexInput: string): string {
  let s = latexInput.trim();
  // Remove outer math delimiters
  s = s.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '').trim();
  // Convert nested \frac{a}{b} up to 3 levels deep
  for (let pass = 0; pass < 3; pass++) {
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))');
  }
  // Convert \sqrt[n]{x} and \sqrt{x}
  s = s.replace(/\\sqrt\[3\]\{([^{}]+)\}/g, 'cbrt($1)');
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)');
  // Powers & constants
  s = s
    .replace(/\\times/g, '*')
    .replace(/\\cdot/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\pi/g, 'pi')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\ln/g, 'ln')
    .replace(/\\log/g, 'log')
    .replace(/\^\{([^{}]+)\}/g, '^($1)')
    .replace(/\{([^{}]+)\}/g, '($1)')
    .replace(/\s+/g, '');
  return s;
}

/**
 * Evaluates a real function f(x) safely at scalar x using deterministic arithmetic.
 */
export function evaluateRealFunction(expr: string, xVal: number): number {
  const normalized = latexToPlainExpression(expr)
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\bpi\b/gi, String(Math.PI))
    .replace(/π/g, String(Math.PI))
    .replace(/\be\b/g, String(Math.E))
    .replace(/(\d)(x)/gi, '$1*$2')
    .replace(/(x)(\d)/gi, '$1*$2')
    .replace(/(\))(x)/gi, '$1*$2')
    .replace(/(x)(\()/gi, '$1*$2')
    .replace(/\bx\b/gi, `(${xVal})`)
    .replace(/sqrt\(/gi, 'Math.sqrt(')
    .replace(/cbrt\(/gi, 'Math.cbrt(')
    .replace(/sin\(/gi, 'Math.sin(')
    .replace(/cos\(/gi, 'Math.cos(')
    .replace(/tan\(/gi, 'Math.tan(')
    .replace(/log\(/gi, 'Math.log10(')
    .replace(/ln\(/gi, 'Math.log(')
    .replace(/abs\(/gi, 'Math.abs(')
    .replace(/\^/g, '**');

  const fn = new Function('Math', `return (${normalized});`);
  const res = fn(Math);
  if (typeof res !== 'number' || isNaN(res)) {
    throw new Error('Expression did not evaluate to a real number.');
  }
  return res;
}

/**
 * Composite Simpson's Rule numerical definite integral for deterministic calculus verification.
 */
export function simpsonDefiniteIntegral(
  expr: string,
  a: number,
  b: number,
  n: number = 200
): number {
  const steps = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / steps;
  let sum = evaluateRealFunction(expr, a) + evaluateRealFunction(expr, b);
  for (let i = 1; i < steps; i++) {
    const coeff = i % 2 === 0 ? 2 : 4;
    sum += coeff * evaluateRealFunction(expr, a + i * h);
  }
  return (h / 3) * sum;
}

/**
 * Central-difference numerical derivative df/dx at x0.
 */
export function numericalDerivative(expr: string, x0: number): number {
  const h = 1e-5;
  return (evaluateRealFunction(expr, x0 + h) - evaluateRealFunction(expr, x0 - h)) / (2 * h);
}

/**
 * Parses and solves spoken or LaTeX math deterministically whenever feasible.
 */
export function computeDeterministically(
  rawInput: string,
  angleMode: 'deg' | 'rad' = 'deg'
): DeterministicComputeResult {
  const clean = rawInput.trim();
  if (!clean) return { computed: false };

  // 1. Definite integral pattern: \int_{a}^{b} expr dx
  const intMatch = clean.match(/\\int_\{?([^}]+)\}?\^\{?([^}]+)\}?\s*(.+?)(?:\\,|\s)*(?:dx|d\\,x)$/i);
  if (intMatch) {
    try {
      const a = evaluateExpression(latexToPlainExpression(intMatch[1]), 'rad').result;
      const b = evaluateExpression(latexToPlainExpression(intMatch[2]), 'rad').result;
      const integrand = intMatch[3];
      const val = simpsonDefiniteIntegral(integrand, a, b, 240);
      const formatted = formatNum(val, 6);
      return {
        computed: true,
        valueText: formatted,
        latex: `${formatted}`,
        steps: [
          `Identified definite integral limits: $a = ${formatNum(a)}$, $b = ${formatNum(b)}$`,
          `Integrand: $f(x) = ${integrand}$`,
          `Evaluated deterministically via composite Simpson's numerical integration (240 subintervals): $${formatted}$`,
        ],
      };
    } catch {
      // fall through
    }
  }

  // 2. Summation pattern: \sum_{i=a}^{b} expr
  const sumMatch = clean.match(/\\sum_\{?([a-zA-Z])=([^}]+)\}?\^\{?([^}]+)\}?\s*(.+)$/);
  if (sumMatch) {
    try {
      const varName = sumMatch[1];
      const start = Math.round(evaluateExpression(latexToPlainExpression(sumMatch[2]), 'rad').result);
      const end = Math.round(evaluateExpression(latexToPlainExpression(sumMatch[3]), 'rad').result);
      if (end >= start && end - start <= 5000) {
        let total = 0;
        for (let k = start; k <= end; k++) {
          const termExpr = sumMatch[4].replace(new RegExp(`\\b${varName}\\b`, 'g'), String(k));
          total += evaluateExpression(latexToPlainExpression(termExpr), angleMode).result;
        }
        const formatted = formatNum(total, 6);
        return {
          computed: true,
          valueText: formatted,
          latex: formatted,
          steps: [
            `Summation index $${varName}$ runs from $${start}$ to $${end}$ (${end - start + 1} terms)`,
            `Computed exact sum across all terms: $\\sum = ${formatted}$`,
          ],
        };
      }
    } catch {
      // fall through
    }
  }

  // 3. 2x2 matrix determinant: \begin{pmatrix} a & b \\ c & d \end{pmatrix}
  const mat2Match = clean.match(/\\begin\{[pv]?matrix\}\s*([^&]+)&([^\\]+)\\{2}\s*([^&]+)&([^\\]+)\\end\{[pv]?matrix\}/);
  if (mat2Match) {
    try {
      const a = evaluateExpression(latexToPlainExpression(mat2Match[1]), 'rad').result;
      const b = evaluateExpression(latexToPlainExpression(mat2Match[2]), 'rad').result;
      const c = evaluateExpression(latexToPlainExpression(mat2Match[3]), 'rad').result;
      const d = evaluateExpression(latexToPlainExpression(mat2Match[4]), 'rad').result;
      const det = a * d - b * c;
      const trace = a + d;
      return {
        computed: true,
        valueText: `det = ${formatNum(det)}, trace = ${formatNum(trace)}`,
        latex: `\\det(A) = ${formatNum(det)},\\quad \\operatorname{tr}(A) = ${formatNum(trace)}`,
        steps: [
          `Extracted 2×2 matrix entries: $a=${formatNum(a)}, b=${formatNum(b)}, c=${formatNum(c)}, d=${formatNum(d)}$`,
          `Determinant: $\\det(A) = ad - bc = (${formatNum(a)})(${formatNum(d)}) - (${formatNum(b)})(${formatNum(c)}) = ${formatNum(det)}$`,
          `Trace: $\\operatorname{tr}(A) = a + d = ${formatNum(trace)}$`,
        ],
      };
    } catch {
      // fall through
    }
  }

  // 4. Plain / LaTeX scalar expression evaluation
  const plain = latexToPlainExpression(clean);
  if (plain && !/[a-df-zA-Z_]{1}(?![a-z])/.test(plain.replace(/\b(sin|cos|tan|asin|acos|atan|log|ln|sqrt|cbrt|abs|pi|e)\b/gi, ''))) {
    try {
      const { result, steps } = evaluateExpression(plain, angleMode);
      const formatted = formatNum(result, 6);
      return {
        computed: true,
        valueText: formatted,
        latex: formatted,
        steps,
      };
    } catch {
      // ignore if contains unresolved variables
    }
  }

  return { computed: false };
}

/**
 * Simple deterministic English spoken math phrase converter before hitting server AI.
 */
export function normalizeSpokenMathToExpression(spoken: string): string {
  return spoken
    .toLowerCase()
    .replace(/\bwhat is\b|\bcalculate\b|\bcompute\b|\bevaluate\b/g, '')
    .replace(/\bsquare root of\b/g, 'sqrt(')
    .replace(/\bcube root of\b/g, 'cbrt(')
    .replace(/\bsquared\b/g, '^2')
    .replace(/\bcubed\b/g, '^3')
    .replace(/\bto the power of\b/g, '^')
    .replace(/\bplus\b/g, '+')
    .replace(/\bminus\b/g, '-')
    .replace(/\btimes\b|\bmultiplied by\b/g, '*')
    .replace(/\bdivided by\b|\bover\b/g, '/')
    .replace(/\bpi\b/g, 'pi')
    .replace(/\s+/g, ' ')
    .trim();
}
