import React, { useState } from 'react';
import katex from 'katex';
import { Copy, Check } from 'lucide-react';

interface Props {
  content: string;
  isStreaming?: boolean;
}

export const ChatMessageRenderer: React.FC<Props> = ({ content, isStreaming }) => {
  // Normalize \(...\) and \[...\] delimiters before block splitting
  const normalizedContent = React.useMemo(() => {
    if (!content) return '';
    return content
      .replace(/\\\[([\s\S]*?)\\\]/g, (_, expr) => `\n\n$$${expr}$$\n\n`)
      .replace(/\\\(([^\n]*?)\\\)/g, (_, expr) => `$${expr}$`);
  }, [content]);

  // Parse message into blocks: code blocks, tables, math, and regular text
  const blocks = React.useMemo(() => {
    return parseMessageBlocks(normalizedContent);
  }, [normalizedContent]);

  return (
    <div className="space-y-4 leading-7 text-[14.5px] text-[#F4F4F5] break-words">
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return (
            <CodeBlockCard
              key={idx}
              language={block.language || 'text'}
              code={block.content}
            />
          );
        }

        if (block.type === 'table') {
          return <TableBlockCard key={idx} rawTable={block.content} />;
        }

        if (block.type === 'display_math') {
          return <DisplayMathCard key={idx} math={block.content} />;
        }

        return <InlineFormattedText key={idx} text={block.content} />;
      })}

      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-[#22C55E] animate-pulse align-middle rounded-sm" />
      )}
    </div>
  );
};

// Sub-component: Code Block with Copy
const CodeBlockCard: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-[#27272A] bg-[#0A0A0C] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#121216] border-b border-[#27272A] text-xs font-mono text-[#A1A1AA]">
        <span className="uppercase font-bold tracking-wider text-white">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg hover:bg-[#27272A] text-[#D4D4D8] hover:text-white transition-all cursor-pointer text-xs"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span className="text-white font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto font-mono text-xs text-[#E4E4E7] leading-relaxed scrollbar-thin">
        <pre className="whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

// Sub-component: Standalone Display Math Block ($$...$$)
const DisplayMathCard: React.FC<{ math: string }> = ({ math }) => {
  const html = React.useMemo(() => {
    const clean = math.trim().replace(/(?<!\\)%/g, '\\%');
    try {
      return katex.renderToString(clean, {
        displayMode: true,
        throwOnError: true,
        output: 'htmlAndMathml',
      });
    } catch {
      try {
        const relaxed = clean.replace(/\\left\b/g, '').replace(/\\right\b/g, '');
        return katex.renderToString(relaxed, {
          displayMode: true,
          throwOnError: true,
          output: 'htmlAndMathml',
        });
      } catch {
        return `<span class="font-mono text-white">${escapeHtml(clean.replace(/\\/g, ''))}</span>`;
      }
    }
  }, [math]);

  return (
    <div className="my-3.5 px-4 py-3.5 rounded-xl bg-[#141418] border border-[#27272A] overflow-x-auto text-center scrollbar-thin">
      <div dangerouslySetInnerHTML={{ __html: html }} className="text-white inline-block" />
    </div>
  );
};

// Sub-component: Markdown Table Block
const TableBlockCard: React.FC<{ rawTable: string }> = ({ rawTable }) => {
  const tableData = React.useMemo(() => {
    const lines = rawTable.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return null;

    const parseRow = (line: string) =>
      line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());

    const headers = parseRow(lines[0]);
    // Skip separator line if it contains dashes
    const startIdx = lines[1].includes('---') ? 2 : 1;
    const rows = lines.slice(startIdx).map(parseRow);

    return { headers, rows };
  }, [rawTable]);

  if (!tableData) return <div className="font-mono text-xs">{rawTable}</div>;

  return (
    <div className="my-4 overflow-x-auto rounded-2xl border border-[#27272A] bg-[#0A0A0C] shadow-md scrollbar-thin">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-[#18181B] text-[#FFFFFF] font-bold border-b border-[#27272A]">
          <tr>
            {tableData.headers.map((h, i) => (
              <th key={i} className="p-3 whitespace-nowrap">
                <InlineFormattedText text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#27272A]/70 text-[#D4D4D8]">
          {tableData.rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-[#18181B]/40 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="p-3">
                  <InlineFormattedText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Sub-component: Inline Formatted Text with ChatGPT-style paragraph/list/heading spacing
const InlineFormattedText: React.FC<{ text: string }> = ({ text }) => {
  const renderedHtml = React.useMemo(() => {
    if (!text) return '';

    const rawLines = text.split(/\r?\n/);
    const out: string[] = [];
    let i = 0;

    while (i < rawLines.length) {
      const line = rawLines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      // Horizontal rule
      if (/^([-*_]){3,}$/.test(trimmed)) {
        out.push('<hr class="my-4 border-[#27272A]" />');
        i++;
        continue;
      }

      // Markdown heading (# ... ####)
      const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        const sizeClass =
          level === 1
            ? 'text-base font-extrabold text-white mt-5 mb-2.5 first:mt-0 tracking-tight'
            : level === 2
            ? 'text-[15px] font-bold text-white mt-4 mb-2 first:mt-0'
            : 'text-[14px] font-bold text-[#22C55E] mt-4 mb-1.5 first:mt-0';
        out.push(`<div class="${sizeClass}">${formatInlineMathAndText(headingText)}</div>`);
        i++;
        continue;
      }

      // Blockquote lines (> ...)
      if (/^>\s?/.test(trimmed)) {
        const quoteLines: string[] = [];
        while (i < rawLines.length && /^\s*>/.test(rawLines[i])) {
          quoteLines.push(rawLines[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        out.push(
          `<blockquote class="border-l-2 border-[#22C55E] pl-3.5 py-1.5 my-3.5 text-zinc-300 bg-[#18181D]/60 rounded-r-xl leading-7">${quoteLines
            .map((ql) => formatInlineMathAndText(ql))
            .join('<br/>')}</blockquote>`
        );
        continue;
      }

      // Unordered bullet list (-, *, •)
      if (/^\s*[-*•]\s+/.test(line)) {
        const items: string[] = [];
        while (i < rawLines.length && /^\s*[-*•]\s+/.test(rawLines[i])) {
          const itemText = rawLines[i].replace(/^\s*[-*•]\s+/, '').trim();
          items.push(`<li class="leading-7">${formatInlineMathAndText(itemText)}</li>`);
          i++;
        }
        out.push(`<ul class="list-disc pl-5 space-y-2 my-3 text-[#E4E4E7]">${items.join('')}</ul>`);
        continue;
      }

      // Ordered numbered list (1. , 2) )
      if (/^\s*\d+[.)]\s+/.test(line)) {
        const items: string[] = [];
        while (i < rawLines.length && /^\s*\d+[.)]\s+/.test(rawLines[i])) {
          const itemText = rawLines[i].replace(/^\s*\d+[.)]\s+/, '').trim();
          items.push(`<li class="leading-7">${formatInlineMathAndText(itemText)}</li>`);
          i++;
        }
        out.push(`<ol class="list-decimal pl-5 space-y-2.5 my-3 text-[#E4E4E7]">${items.join('')}</ol>`);
        continue;
      }

      // Regular paragraph: collect consecutive prose lines until blank or structural line
      const paraLines: string[] = [];
      while (i < rawLines.length) {
        const cur = rawLines[i];
        const curTrim = cur.trim();
        if (
          !curTrim ||
          /^([-*_]){3,}$/.test(curTrim) ||
          /^#{1,4}\s+/.test(curTrim) ||
          /^\s*>/.test(cur) ||
          /^\s*[-*•]\s+/.test(cur) ||
          /^\s*\d+[.)]\s+/.test(cur)
        ) {
          break;
        }
        paraLines.push(cur);
        i++;
      }

      if (paraLines.length > 0) {
        const formattedLines = paraLines.map((l) => formatInlineMathAndText(l)).join('<br/>');
        out.push(`<p class="mb-3.5 last:mb-0 leading-7 text-[#F4F4F5]">${formattedLines}</p>`);
      }
    }

    return out.join('');
  }, [text]);

  return <div className="space-y-1" dangerouslySetInnerHTML={{ __html: renderedHtml }} />;
};

function formatInlineMathAndText(str: string): string {
  if (!str) return '';

  // Extract protected tokens (inline math & inline code) so markdown emphasis never breaks inside them
  const tokens: string[] = [];
  const stash = (html: string) => {
    const idx = tokens.length;
    tokens.push(html);
    return `\u0000TOK_${idx}\u0000`;
  };

  // 1. Protect inline code `code`
  let output = str.replace(/`([^`]+)`/g, (_, code) =>
    stash(
      `<code class="px-1.5 py-0.5 rounded bg-[#1C1C20] border border-[#27272A] font-mono text-xs text-white">${escapeHtml(
        code
      )}</code>`
    )
  );

  // 2. Protect and render inline math $...$
  output = output.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    const clean = math.trim().replace(/(?<!\\)%/g, '\\%');
    try {
      return stash(
        katex.renderToString(clean, {
          displayMode: false,
          throwOnError: true,
          output: 'htmlAndMathml',
        })
      );
    } catch {
      return stash(`<span class="font-mono text-white">${escapeHtml(clean.replace(/\\/g, ''))}</span>`);
    }
  });

  // 3. Escape any raw HTML in remaining prose before adding safe markup tags
  output = escapeHtml(output);

  // 4. Markdown links [label](https://...)
  output = output.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#22C55E] underline underline-offset-2 hover:text-emerald-300">$1</a>'
  );

  // 5. Bold **text**
  output = output.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

  // 6. Italic *text*
  output = output.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="italic text-zinc-200">$1</em>');

  // 7. Restore stashed inline code & KaTeX math
  output = output.replace(/\u0000TOK_(\d+)\u0000/g, (_, idx) => tokens[Number(idx)] ?? '');

  return output;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface MessageBlock {
  type: 'text' | 'code' | 'table' | 'display_math';
  content: string;
  language?: string;
}

function parseMessageBlocks(raw: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  if (!raw) return blocks;

  // Split out code blocks ```lang\ncode\n``` (also tolerate unclosed trailing code fence while streaming)
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)(?:```|$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = raw.slice(lastIndex, match.index);
      parseSubBlocks(textChunk, blocks);
    }

    blocks.push({
      type: 'code',
      language: match[1]?.trim() || 'code',
      content: match[2]?.trim() || '',
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    const textChunk = raw.slice(lastIndex);
    parseSubBlocks(textChunk, blocks);
  }

  return blocks;
}

function parseSubBlocks(chunk: string, blocks: MessageBlock[]) {
  // Check for display math $$...$$
  const displayMathRegex = /\$\$([\s\S]*?)\$\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = displayMathRegex.exec(chunk)) !== null) {
    if (match.index > lastIndex) {
      const subText = chunk.slice(lastIndex, match.index);
      checkAndAddTablesOrText(subText, blocks);
    }

    blocks.push({
      type: 'display_math',
      content: match[1].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < chunk.length) {
    const remaining = chunk.slice(lastIndex);
    checkAndAddTablesOrText(remaining, blocks);
  }
}

function checkAndAddTablesOrText(text: string, blocks: MessageBlock[]) {
  const trimmed = text.trim();
  if (!trimmed) return;

  // Check if text block contains a Markdown table
  const tableRegex = /(?:^|\n)(\|.+?\|\n\|[-:| ]+?\|\n(?:\|.+?\|\n?)+)/;
  const match = text.match(tableRegex);

  if (match && match.index !== undefined) {
    const before = text.slice(0, match.index).trim();
    if (before) {
      blocks.push({ type: 'text', content: before });
    }
    blocks.push({ type: 'table', content: match[1].trim() });
    const after = text.slice(match.index + match[0].length).trim();
    if (after) {
      checkAndAddTablesOrText(after, blocks);
    }
  } else {
    blocks.push({ type: 'text', content: text });
  }
}
