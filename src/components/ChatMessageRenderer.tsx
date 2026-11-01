import React, { useState } from 'react';
import katex from 'katex';
import { Copy, Check } from 'lucide-react';

interface Props {
  content: string;
  isStreaming?: boolean;
}

export const ChatMessageRenderer: React.FC<Props> = ({ content, isStreaming }) => {
  // Parse message into blocks: code blocks, tables, math, and regular text
  const blocks = React.useMemo(() => {
    return parseMessageBlocks(content);
  }, [content]);

  return (
    <div className="space-y-3 leading-relaxed text-sm text-[#F4F4F5] break-words">
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

        return (
          <div key={idx} className="space-y-2">
            <InlineFormattedText text={block.content} />
          </div>
        );
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
    <div className="my-3 rounded-2xl overflow-hidden border border-[#27272A] bg-[#0A0A0C] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#121216] border-b border-[#27272A] text-xs font-mono text-[#A1A1AA]">
        <span className="uppercase font-bold tracking-wider text-[#22C55E]">
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
              <Check className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="text-[#22C55E] font-medium">Copied</span>
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
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch {
      return math;
    }
  }, [math]);

  return (
    <div className="my-2.5 p-3 rounded-xl bg-[#141418] border border-[#27272A] overflow-x-auto text-center scrollbar-thin">
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
    <div className="my-3 overflow-x-auto rounded-2xl border border-[#27272A] bg-[#0A0A0C] shadow-md scrollbar-thin">
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

// Sub-component: Inline Formatted Text (Inline LaTeX $...$, Bold **...**, Lists, Links)
const InlineFormattedText: React.FC<{ text: string }> = ({ text }) => {
  const renderedHtml = React.useMemo(() => {
    if (!text) return '';

    // Split paragraphs
    const paragraphs = text.split(/\n\s*\n/);

    const processedParagraphs = paragraphs.map((para) => {
      // Check for bullet lists
      const lines = para.split('\n');
      const isBulletList = lines.every((l) => /^\s*[-*•]\s+/.test(l));
      const isNumberedList = lines.every((l) => /^\s*\d+\.\s+/.test(l));

      if (isBulletList) {
        const items = lines
          .map((l) => l.replace(/^\s*[-*•]\s+/, '').trim())
          .map((item) => `<li>${formatInlineMathAndText(item)}</li>`)
          .join('');
        return `<ul class="list-disc list-inside space-y-1 my-1.5 pl-1">${items}</ul>`;
      }

      if (isNumberedList) {
        const items = lines
          .map((l) => l.replace(/^\s*\d+\.\s+/, '').trim())
          .map((item) => `<li>${formatInlineMathAndText(item)}</li>`)
          .join('');
        return `<ol class="list-decimal list-inside space-y-1 my-1.5 pl-1">${items}</ol>`;
      }

      // Check for blockquote
      if (para.startsWith('>')) {
        const quoteContent = para.replace(/^>\s*/gm, '');
        return `<blockquote class="border-l-2 border-[#22C55E] pl-3 py-1 my-2 text-zinc-300 italic">${formatInlineMathAndText(
          quoteContent
        )}</blockquote>`;
      }

      // Check for headers
      if (/^#{1,4}\s+/.test(para)) {
        const level = (para.match(/^#+/) || ['#'])[0].length;
        const headingText = para.replace(/^#+\s*/, '');
        const sizeClass =
          level === 1
            ? 'text-base font-black text-white mt-3 mb-1'
            : level === 2
            ? 'text-sm font-bold text-white mt-2.5 mb-1'
            : 'text-xs font-bold text-[#22C55E] mt-2 mb-0.5 uppercase tracking-wider';
        return `<div class="${sizeClass}">${formatInlineMathAndText(headingText)}</div>`;
      }

      // Standard paragraph with line breaks
      const formattedLines = lines.map((line) => formatInlineMathAndText(line)).join('<br/>');
      return `<p>${formattedLines}</p>`;
    });

    return processedParagraphs.join('');
  }, [text]);

  return <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />;
};

function formatInlineMathAndText(str: string): string {
  if (!str) return '';

  // 1. First extract and replace inline math $...$ with KaTeX HTML
  let output = str.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch {
      return `$${escapeHtml(math)}$`;
    }
  });

  // 2. Bold **text**
  output = output.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

  // 3. Italic *text* or _text_
  output = output.replace(/(?<!\*)\*(?!\*)(.*?)\*/g, '<em class="italic">$1</em>');

  // 4. Inline code `code`
  output = output.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-[#1C1C20] border border-[#27272A] font-mono text-xs text-[#22C55E]">$1</code>'
  );

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

  // Split out code blocks ```lang\ncode\n```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
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
