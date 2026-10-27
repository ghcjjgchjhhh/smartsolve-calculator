import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  displayMode?: boolean;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  displayMode = false,
  className = '',
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    const text = content.trim();

    // Check if the entire string is already a standalone math equation
    // (e.g. begins with \frac, \sqrt, \boxed, contains =, ^, _, \pm, or starts and ends with $$ or $)
    const isPureMath =
      text.startsWith('$$') ||
      (text.startsWith('$') && text.endsWith('$')) ||
      text.startsWith('\\') ||
      (!text.includes(' ') && /[=+\-*/^_{}\\]/.test(text)) ||
      (/^[\d\s+\-*/=^_{}()a-zA-Z\\]+$/.test(text) && /[=^_\\]/.test(text));

    if (isPureMath) {
      let cleanMath = text;
      if (cleanMath.startsWith('$$') && cleanMath.endsWith('$$')) {
        cleanMath = cleanMath.slice(2, -2).trim();
      } else if (cleanMath.startsWith('$') && cleanMath.endsWith('$')) {
        cleanMath = cleanMath.slice(1, -1).trim();
      }

      // Format common operators into LaTeX equivalents if not already LaTeX
      cleanMath = cleanMath
        .replace(/\b\*\b/g, '\\times ')
        .replace(/ ÷ /g, ' \\div ')
        .replace(/÷/g, ' \\div ')
        .replace(/>=/g, ' \\ge ')
        .replace(/<=/g, ' \\le ')
        .replace(/\+-/g, ' \\pm ');

      try {
        return katex.renderToString(cleanMath, {
          displayMode: true,
          throwOnError: false,
          output: 'htmlAndMathml',
        });
      } catch (e) {
        // Fallback to text
        return `<span class="font-mono text-white">${text}</span>`;
      }
    }

    // Mixed text and math (e.g. "Since the left side is nonnegative, $x \ge 1$.")
    // Replace $$...$$ and $...$ with KaTeX rendered spans
    try {
      const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
      const htmlParts = parts.map((part) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          return katex.renderToString(math, { displayMode: true, throwOnError: false });
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          return katex.renderToString(math, { displayMode: false, throwOnError: false });
        }
        // Plain text
        return escapeHtml(part);
      });
      return htmlParts.join('');
    } catch {
      return escapeHtml(text);
    }
  }, [content, displayMode]);

  return (
    <div className={`w-full max-w-full overflow-x-auto touch-pan-x scrollbar-thin py-0.5 ${displayMode ? 'text-center' : ''}`}>
      <div
        className={`math-rendered-block text-white leading-relaxed break-words ${displayMode ? 'text-center' : ''} ${className}`}
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
