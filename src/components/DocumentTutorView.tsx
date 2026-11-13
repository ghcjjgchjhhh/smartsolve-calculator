import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  FileText,
  Upload,
  Sparkles,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface ExtractedPage {
  pageNumber: number;
  text: string;
}

interface DocumentTutorResponse {
  title: string;
  citationsUsed?: number[];
  summarySections?: Array<{
    heading: string;
    pageRange: string;
    summary: string;
    keyTakeaways: string[];
  }>;
  answer?: string;
  generatedQuestions?: Array<{
    question: string;
    pageRef: string;
    answer: string;
  }>;
}

export const DocumentTutorView: React.FC = () => {
  const [fileName, setFileName] = useState<string>('');
  const [pages, setPages] = useState<ExtractedPage[]>([]);
  const [activePageIdx, setActivePageIdx] = useState<number>(0);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>('');

  const [actionMode, setActionMode] = useState<'summarize' | 'explain' | 'quiz' | 'ask'>('summarize');
  const [userQuery, setUserQuery] = useState<string>('');
  const [selectedExcerpt, setSelectedExcerpt] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');
  const [aiResult, setAiResult] = useState<DocumentTutorResponse | null>(null);
  const [revealedQuizAnswers, setRevealedQuizAnswers] = useState<Record<number, boolean>>({});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError('');
    setAiError('');
    setAiResult(null);
    setIsParsing(true);
    setFileName(file.name);

    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const extracted: ExtractedPage[] = [];
        const maxPages = Math.min(pdf.numPages, 40);
        for (let p = 1; p <= maxPages; p++) {
          const page = await pdf.getPage(p);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((it: any) => (typeof it.str === 'string' ? it.str : ''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          extracted.push({ pageNumber: p, text: pageText || '[No selectable text found on this page]' });
        }
        setPages(extracted);
        setActivePageIdx(0);
      } else {
        // Plain text / markdown / CSV document chunked into logical ~1800-char pages
        const fullText = await file.text();
        const chunkSize = 1800;
        const chunks: ExtractedPage[] = [];
        for (let i = 0; i < fullText.length; i += chunkSize) {
          chunks.push({
            pageNumber: chunks.length + 1,
            text: fullText.slice(i, i + chunkSize).trim(),
          });
        }
        setPages(chunks.length > 0 ? chunks : [{ pageNumber: 1, text: '[Empty document]' }]);
        setActivePageIdx(0);
      }
    } catch (err: any) {
      setParseError(err?.message || 'Failed to read document. Ensure the PDF is not encrypted or corrupted.');
      setPages([]);
    } finally {
      setIsParsing(false);
    }
  };

  const runTutorAction = async (mode: 'summarize' | 'explain' | 'quiz' | 'ask') => {
    if (pages.length === 0 || isThinking) return;
    setActionMode(mode);
    setIsThinking(true);
    setAiError('');
    setRevealedQuizAnswers({});

    try {
      const targetSection =
        mode === 'explain'
          ? selectedExcerpt.trim() || `[Page ${pages[activePageIdx]?.pageNumber}] ${pages[activePageIdx]?.text || ''}`
          : '';
      const resp = await fetch('/api/document-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          fileName,
          pages,
          query: userQuery.trim(),
          targetSection,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.result) {
        throw new Error(data?.error || 'Could not process document with AI Tutor.');
      }
      setAiResult(data.result);
    } catch (err: any) {
      setAiError(err?.message || 'Failed to analyze document.');
    } finally {
      setIsThinking(false);
    }
  };

  const totalWords = pages.reduce((acc, p) => acc + p.text.split(/\s+/).filter(Boolean).length, 0);

  return (
    <div className="space-y-6">
      {/* Upload & File Controls */}
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI Document Tutor
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
              Upload textbooks, lecture notes, or PDFs — get chapter summaries, section explanations, practice questions, and cited Q&A with page numbers.
            </p>
          </div>

          <label className="px-4 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer self-start">
            <Upload className="w-4 h-4" />
            <span>{pages.length > 0 ? 'Upload Another File' : 'Upload PDF / TXT / MD'}</span>
            <input type="file" accept=".pdf,.txt,.md,.csv,application/pdf,text/plain" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {isParsing && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#27272A] flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300">
            <Loader2 className="w-4 h-4 animate-spin text-[#22C55E]" />
            <span>Extracting document pages and text index...</span>
          </div>
        )}

        {parseError && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {pages.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-[#27272A]">
            <div className="text-xs text-slate-600 dark:text-[#A1A1AA] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#22C55E]" />
              <span className="font-semibold text-slate-900 dark:text-white">{fileName}</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{pages.length} pages</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{totalWords.toLocaleString()} words</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => runTutorAction('summarize')}
                disabled={isThinking}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  actionMode === 'summarize' ? 'bg-[#22C55E] text-white' : 'border border-slate-200 dark:border-[#27272A]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Summarize Chapters</span>
              </button>
              <button
                type="button"
                onClick={() => runTutorAction('explain')}
                disabled={isThinking}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  actionMode === 'explain' ? 'bg-[#22C55E] text-white' : 'border border-slate-200 dark:border-[#27272A]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain Page {pages[activePageIdx]?.pageNumber}</span>
              </button>
              <button
                type="button"
                onClick={() => runTutorAction('quiz')}
                disabled={isThinking}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  actionMode === 'quiz' ? 'bg-[#22C55E] text-white' : 'border border-slate-200 dark:border-[#27272A]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Generate Quiz</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {pages.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Extracted Page Viewer */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Document Page Browser</span>
              <select
                value={activePageIdx}
                onChange={(e) => setActivePageIdx(Number(e.target.value))}
                className="rounded-lg border border-slate-200 dark:border-[#27272A] px-2.5 py-1 text-xs font-mono"
              >
                {pages.map((p, i) => (
                  <option key={p.pageNumber} value={i}>
                    Page {p.pageNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3.5 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
              {pages[activePageIdx]?.text}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500">
                Optional: Paste a difficult excerpt to explain directly
              </label>
              <textarea
                rows={2}
                value={selectedExcerpt}
                onChange={(e) => setSelectedExcerpt(e.target.value)}
                placeholder="Paste a tricky theorem or paragraph..."
                className="w-full rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs"
              />
            </div>

            {/* Ask Q&A Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (userQuery.trim()) void runTutorAction('ask');
              }}
              className="flex gap-2 pt-2 border-t border-slate-200 dark:border-[#27272A]"
            >
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Ask a question about this document..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-[#27272A] px-3 py-2 text-xs"
              />
              <button
                type="submit"
                disabled={isThinking || !userQuery.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask</span>
              </button>
            </form>
          </div>

          {/* Right: Cited Tutor Output */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-4">
            {isThinking ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
                <span>Analyzing document sections and building page-cited tutor output...</span>
              </div>
            ) : aiError ? (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            ) : !aiResult ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Document Ready for Tutoring</p>
                <p className="text-xs text-slate-500 dark:text-[#A1A1AA]">
                  Click <strong>Summarize Chapters</strong>, <strong>Explain Page {pages[activePageIdx]?.pageNumber}</strong>, <strong>Generate Quiz</strong>, or ask a question about the text.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#27272A] pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{aiResult.title}</h3>
                  {Array.isArray(aiResult.citationsUsed) && aiResult.citationsUsed.length > 0 && (
                    <div className="text-xs font-mono text-[#22C55E]">
                      Pages Cited: {aiResult.citationsUsed.join(', ')}
                    </div>
                  )}
                </div>

                {aiResult.answer && (
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed space-y-2">
                    <MathRenderer content={aiResult.answer} />
                  </div>
                )}

                {Array.isArray(aiResult.summarySections) && aiResult.summarySections.length > 0 && (
                  <div className="space-y-3">
                    {aiResult.summarySections.map((sec, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{sec.heading}</span>
                          <span className="text-xs font-mono text-[#22C55E]">{sec.pageRange}</span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-zinc-300">
                          <MathRenderer content={sec.summary} />
                        </div>
                        {Array.isArray(sec.keyTakeaways) && sec.keyTakeaways.length > 0 && (
                          <ul className="list-disc list-inside text-xs text-slate-600 dark:text-[#A1A1AA] space-y-1">
                            {sec.keyTakeaways.map((t, k) => (
                              <li key={k}>
                                <MathRenderer content={t} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {Array.isArray(aiResult.generatedQuestions) && aiResult.generatedQuestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#22C55E]">Practice Questions From Document</div>
                    {aiResult.generatedQuestions.map((gq, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 dark:border-[#27272A] p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span>Question {idx + 1}</span>
                          <span className="font-mono text-[#22C55E]">{gq.pageRef}</span>
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                          <MathRenderer content={gq.question} />
                        </div>
                        <button
                          type="button"
                          onClick={() => setRevealedQuizAnswers((p) => ({ ...p, [idx]: !p[idx] }))}
                          className="text-xs font-bold text-[#22C55E] hover:underline cursor-pointer"
                        >
                          {revealedQuizAnswers[idx] ? 'Hide Answer' : 'Show Answer & Citation'}
                        </button>
                        {revealedQuizAnswers[idx] && (
                          <div className="rounded-lg bg-slate-50 dark:bg-[#121216] p-3 text-xs text-slate-700 dark:text-zinc-300">
                            <MathRenderer content={gq.answer} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
