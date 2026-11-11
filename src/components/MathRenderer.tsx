import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content?: string;
  text?: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Sanitizes and repairs common LaTeX syntax glitches that cause KaTeX to throw or render red errors.
 */
function sanitizeLatexForKaTeX(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();

  // Strip wrapping $$ or $ if present
  if (str.startsWith('$$') && str.endsWith('$$') && str.length >= 4) {
    str = str.slice(2, -2).trim();
  } else if (str.startsWith('$') && str.endsWith('$') && str.length >= 2) {
    str = str.slice(1, -1).trim();
  } else if (str.startsWith('\\[') && str.endsWith('\\]') && str.length >= 4) {
    str = str.slice(2, -2).trim();
  } else if (str.startsWith('\\(') && str.endsWith('\\)') && str.length >= 4) {
    str = str.slice(2, -2).trim();
  }

  // 1. CRITICAL: Escape unescaped % signs.
  // In TeX/KaTeX, an unescaped '%' is treated as a comment character and strips everything
  // until the end of the line (e.g. \text{rounded to 82.9%} comments out the closing '}')
  str = str.replace(/(?<!\\)%/g, '\\%');

  // 2. Fix unclosed braces for KaTeX safety
  const openBraces = (str.match(/\{/g) || []).length;
  const closeBraces = (str.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    str = str + '}'.repeat(openBraces - closeBraces);
  } else if (closeBraces > openBraces) {
    let diff = closeBraces - openBraces;
    while (diff > 0 && str.endsWith('}')) {
      str = str.slice(0, -1);
      diff--;
    }
  }

  // 3. Balance \left and \right delimiters (KaTeX requirement)
  const leftMatches = (str.match(/\\left\b/g) || []).length;
  const rightMatches = (str.match(/\\right\b/g) || []).length;
  if (leftMatches > rightMatches) {
    str = str + ' \\right.'.repeat(leftMatches - rightMatches);
  } else if (rightMatches > leftMatches) {
    str = ' \\left.'.repeat(rightMatches - leftMatches) + str;
  }

  // 4. Convert degree symbols °C and ° to valid LaTeX
  str = str.replace(/°C/g, '^\\circ\\text{C}').replace(/°/g, '^\\circ');

  // 5. Convert reaction arrows and comparisons
  str = str
    .replace(/<==>/g, ' \\rightleftharpoons ')
    .replace(/<=>/g, ' \\rightleftharpoons ')
    .replace(/-->/g, ' \\rightarrow ')
    .replace(/->/g, ' \\rightarrow ')
    .replace(/ ÷ /g, ' \\div ')
    .replace(/>=/g, ' \\ge ')
    .replace(/<=/g, ' \\le ')
    .replace(/\+-/g, ' \\pm ');

  // 6. Clean up trailing broken LaTeX syntax like \tex, \text, \t, or trailing backslash
  str = str.replace(/\\(?:text|tex|te|t)?\s*$/i, '').trim();

  return str;
}

/**
 * Converts broken LaTeX strings into clean, human-readable Unicode math text.
 * Guarantees students NEVER see raw red backslash code on error.
 */
function formatHumanReadableMath(latex: string): string {
  let s = latex;

  // Unbox \boxed{...}
  s = s.replace(/\\boxed\{([^{}]*)\}/g, '$1');

  // Fractions: \frac{a}{b} -> (a) / (b)
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1) / ($2)');

  // \text{...} -> ...
  s = s.replace(/\\text\{([^{}]+)\}/g, '$1');

  // Standard symbols
  s = s
    .replace(/\\times/g, ' × ')
    .replace(/\\cdot/g, ' · ')
    .replace(/\\div/g, ' ÷ ')
    .replace(/\\approx/g, ' ≈ ')
    .replace(/\\pm/g, ' ± ')
    .replace(/\\le\b|\\leq\b/g, ' ≤ ')
    .replace(/\\ge\b|\\geq\b/g, ' ≥ ')
    .replace(/\\ne\b|\\neq\b/g, ' ≠ ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\rightarrow/g, ' → ')
    .replace(/\\rightleftharpoons/g, ' ⇌ ')
    .replace(/\\left[.(|[\]{}]/g, '')
    .replace(/\\right[.)|[\]{}]/g, '')
    .replace(/\\%/g, '%')
    .replace(/\{([^{}]+)\}/g, '$1');

  // Superscripts
  s = s.replace(/\^2\b/g, '²').replace(/\^3\b/g, '³').replace(/\^(-?\d+)/g, '^$1');

  // Clean hanging backslashes
  s = s.replace(/\\[a-zA-Z]+/g, '');
  s = s.replace(/\\/g, '');

  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Safely renders a math expression via KaTeX.
 * If KaTeX fails, gracefully recovers without red error text.
 */
function renderMathSafe(mathStr: string, displayMode: boolean): string {
  const sanitized = sanitizeLatexForKaTeX(mathStr);
  if (!sanitized) return '';

  // Attempt 1: Strict parse with throwOnError: true so we intercept any parsing errors
  try {
    return katex.renderToString(sanitized, {
      displayMode,
      throwOnError: true,
      output: 'htmlAndMathml',
      strict: false,
    });
  } catch {
    // Attempt 2: Relaxed cleanup (remove \left / \right and flatten \text)
    try {
      const relaxed = sanitized
        .replace(/\\left\s*([([{.|])/g, '$1')
        .replace(/\\right\s*([)\]}.|])/g, '$1')
        .replace(/\\text\{([^{}]+)\}/g, '$1');

      return katex.renderToString(relaxed, {
        displayMode,
        throwOnError: true,
        output: 'htmlAndMathml',
        strict: false,
      });
    } catch {
      // Attempt 3: Pristine fallback to clean Unicode mathematical text
      const cleanText = formatHumanReadableMath(sanitized);
      return `<span class="katex-clean-fallback text-white font-mono font-medium ${
        displayMode ? 'block text-center text-sm sm:text-base py-1' : 'inline text-xs sm:text-sm'
      }">${escapeHtml(cleanText)}</span>`;
    }
  }
}

/**
 * Detects unwrapped mathematical equations and formulas in mixed text
 * and safely encloses them in $...$ delimiters so KaTeX can render them.
 */
function autoWrapMathInText(str: string): string {
  if (!str) return '';

  // If already contains math delimiters, return as-is
  if (str.includes('$')) return str;

  const lines = str.split('\n');
  const processed = lines.map((line) => {
    // 1. "Label: equation" pattern (e.g. "Initial coordinates: y_0 = d \sin 30^\circ")
    const colonMatch = line.match(/^([^:=]+):\s*([^:]*[=+\-*/\\^_{}][^:]*)$/);
    if (colonMatch && !/\b(http|https)\b/.test(colonMatch[1])) {
      const label = colonMatch[1].trim();
      const math = colonMatch[2].trim();
      return `**${label}:** $${math}$`;
    }

    // 2. Equation assignment with LaTeX commands or math symbols
    if (
      /[=]/.test(line) &&
      /\\(?:frac|times|cdot|approx|sqrt|sin|cos|tan|Delta|pi|pm|le|ge|ne|rightarrow|rightleftharpoons|boxed|text|circ)/.test(
        line
      )
    ) {
      const eqMatch = line.match(
        /^(.*?)((?:[a-zA-Z0-9_^{}()\\]+\s*=\s*)?[^=]+?\\(?:frac|times|cdot|approx|sqrt|sin|cos|tan|Delta|pi|pm|le|ge|ne|rightarrow|rightleftharpoons|text|circ)[\s\S]*)$/
      );
      if (eqMatch && eqMatch[1].trim().length > 0) {
        return `${eqMatch[1].trim()} $${eqMatch[2].trim()}$`;
      }
    }

    return line;
  });

  return processed.join('\n');
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  text: textProp,
  displayMode = false,
  className = '',
}) => {
  const sourceText = content !== undefined ? content : textProp || '';

  const renderedHtml = useMemo(() => {
    if (!sourceText) return '';

    let text = sourceText.trim();

    // Standardize LaTeX delimiters \[...\] and \(...\) to $$...$$ and $...$
    text = text
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$')
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

    // Check if the text contains multi-word English sentences or commentary
    const hasEnglishWords = /\b(the|is|and|or|for|to|of|in|at|from|with|by|let|since|therefore|first|finally|substitute|substituting|solving|calculate|calculating|initial|final|where|assume|because|equation|values|units|mass|moles|volume|pressure|yield)\b/i.test(
      text
    );

    // 1. Standalone pure equation check (NEVER treat multi-word English sentences as pure math)
    const isPureMath =
      !hasEnglishWords &&
      (displayMode ||
        text.startsWith('$$') ||
        (text.startsWith('$') && text.endsWith('$')) ||
        text.startsWith('\\') ||
        text.startsWith('%') ||
        text.startsWith('\\%') ||
        (!text.includes(' ') && /[=+\-*/^_{}\\]/.test(text)) ||
        (/^[\d\s+\-*/=^_{}()a-zA-Z\\]+$/.test(text) && /[=^_\\]/.test(text)));

    if (isPureMath) {
      return renderMathSafe(text, displayMode);
    }

    // 2. Pre-process mixed text: auto-wrap unwrapped equations and clauses
    let mixedText = text;
    if (!mixedText.includes('$')) {
      mixedText = autoWrapMathInText(mixedText);
    }

    // 3. Mixed text and math expressions (e.g. "Calculate yield: $x = 42$")
    try {
      const parts = mixedText.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
      const htmlParts = parts.map((part) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          return `<div class="my-2 max-w-full overflow-x-auto scrollbar-thin">${renderMathSafe(math, true)}</div>`;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();

          // Check if user or AI accidentally wrapped an entire English sentence or clause inside $...$
          const hasEnglishWords = /\b(solving|position|velocity|components|initial|final|coordinates|vertical|horizontal|after|substituting|therefore|where|when|at|time|value|yield|reaction|pressure|volume|mass)\b/i.test(math);
          if (hasEnglishWords && math.includes(' ')) {
            // Check for "Label: equation" pattern
            const colonMatch = math.match(/^([^:=]+):\s*([^:]+)$/);
            if (colonMatch) {
              const label = colonMatch[1].trim();
              const eq = colonMatch[2].trim();
              return `<span class="text-white font-semibold">${escapeHtml(label)}: </span><span class="inline-block max-w-full overflow-x-auto align-middle">${renderMathSafe(eq, false)}</span>`;
            }
            // Check for "Words equation = value"
            const wordEqMatch = math.match(/^([A-Za-z\s]{3,})\s*([a-zA-Z0-9_^{}()\\]+\s*=\s*[\s\S]+)$/);
            if (wordEqMatch) {
              const label = wordEqMatch[1].trim();
              const eq = wordEqMatch[2].trim();
              return `<span class="text-slate-200">${escapeHtml(label)} </span><span class="inline-block max-w-full overflow-x-auto align-middle">${renderMathSafe(eq, false)}</span>`;
            }
          }

          return `<span class="inline-block max-w-full overflow-x-auto align-middle">${renderMathSafe(math, false)}</span>`;
        }
        // Handle markdown bold, italic, and clean line-breaks in plain text segments
        let formattedText = escapeHtml(part);
        formattedText = formattedText
          .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em class="italic text-slate-200">$1</em>')
          .replace(/\n\n/g, '<div class="my-2"></div>')
          .replace(/\n/g, '<br/>');
        return formattedText;
      });
      return htmlParts.join('');
    } catch {
      return escapeHtml(mixedText);
    }
  }, [sourceText, displayMode]);

  return (
    <div
      className={`w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x formula-scroll-container py-0.5 break-words ${
        displayMode ? 'text-center' : ''
      }`}
    >
      <div
        className={`math-rendered-block text-white leading-relaxed break-words min-w-0 max-w-full ${
          displayMode ? 'text-center' : ''
        } ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
