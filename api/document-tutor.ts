import {
  applyCors,
  extractJsonFromAI,
  generateStructuredAI,
  parseRequestBody,
  sendJson,
} from './_lib/geminiServer';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const action = String(body.action || 'summarize'); // 'summarize' | 'explain' | 'quiz' | 'ask'
    const fileName = String(body.fileName || 'Uploaded Document');
    const pages: Array<{ pageNumber: number; text: string }> = Array.isArray(body.pages) ? body.pages : [];
    const query = String(body.query || '').trim();
    const targetSection = String(body.targetSection || '').trim();

    if (pages.length === 0) {
      return sendJson(res, 400, { error: 'Please upload and extract a document first.' });
    }

    // Build bounded, page-tagged context (preserve page numbers accurately)
    let combinedContext = '';
    const MAX_CHARS = 48000;
    for (const p of pages) {
      const snippet = `\n[Page ${p.pageNumber}]\n${String(p.text || '').trim()}\n`;
      if (combinedContext.length + snippet.length > MAX_CHARS) {
        combinedContext += `\n[Document truncated after Page ${p.pageNumber - 1} due to context size]`;
        break;
      }
      combinedContext += snippet;
    }

    const prompt = `
You are SmartSolve AI Document Tutor analyzing "${fileName}" (${pages.length} total pages).
Every excerpt below is labeled with [Page N]. Cite specific page numbers in brackets like [Page 3] whenever summarizing, explaining, or answering! Never fabricate page numbers or content not supported by the uploaded text.

Action Requested: "${action}"
${query ? `Student Question: "${query}"` : ''}
${targetSection ? `Selected Section / Difficult Passage: "${targetSection}"` : ''}

UPLOADED DOCUMENT TEXT:
${combinedContext}

Return ONLY valid JSON:
{
  "title": "Action result title",
  "citationsUsed": [1, 2],
  "summarySections": [
    {
      "heading": "Chapter / Section title",
      "pageRange": "e.g. Pages 1–3",
      "summary": "Clear academic summary citing [Page N]",
      "keyTakeaways": ["Point 1 [Page N]", "Point 2 [Page N]"]
    }
  ],
  "answer": "Detailed answer or plain-language explanation with LaTeX ($...$) and [Page N] references",
  "generatedQuestions": [
    {
      "question": "Practice or exam question derived strictly from document",
      "pageRef": "Page N",
      "answer": "Model answer & explanation citing [Page N]"
    }
  ]
}
`.trim();

    const response = await generateStructuredAI({
      contents: [{ text: prompt }],
      responseMimeType: 'application/json',
      useThinking: false,
      timeoutMs: 40000,
    });

    const tutorResult = extractJsonFromAI(response.text);
    return sendJson(res, 200, { success: true, result: tutorResult });
  } catch (err: any) {
    return sendJson(res, 500, {
      error: err?.message || 'Failed to analyze uploaded document.',
    });
  }
}
