import { GoogleGenAI, ThinkingLevel } from '@google/genai';

function applyCors(req: any, res: any): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    if (typeof res.sendStatus === 'function') res.sendStatus(200);
    else {
      res.statusCode = 200;
      res.end();
    }
    return true;
  }
  return false;
}

function sendJson(res: any, status: number, payload: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(payload);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(payload));
}

function parseBody(req: any): any {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

async function generateJson(contents: any[], timeoutMs = 40000) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '';
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('Server AI configuration missing (GEMINI_API_KEY).');
  }
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  const models = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen', 'gemini-3.8-flash'];
  let lastError: any = null;
  for (const model of models) {
    try {
      const config: any = { responseMimeType: 'application/json' };
      if (model === 'gemini-3.1-flash-lite') config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      else if (model === 'gemini-4-hydrogen') config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      else config.thinkingConfig = { thinkingLevel: 'LOW' };
      const response = (await Promise.race([
        ai.models.generateContent({ model, contents, config }),
        new Promise((_, rej) => setTimeout(() => rej(new Error(`Timeout waiting for ${model}`)), timeoutMs)),
      ])) as any;
      const txt = (response.text || '{}').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const match = txt.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : txt);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('AI service temporarily unavailable.');
}

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });

  try {
    const body = parseBody(req);
    const action = String(body.action || 'summarize');
    const fileName = String(body.fileName || 'Uploaded Document');
    const pages: Array<{ pageNumber: number; text: string }> = Array.isArray(body.pages) ? body.pages : [];
    const query = String(body.query || '').trim();
    const targetSection = String(body.targetSection || '').trim();

    if (pages.length === 0) return sendJson(res, 400, { error: 'Please upload and extract a document first.' });

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

    const tutorResult = await generateJson([{ text: prompt }], 40000);
    return sendJson(res, 200, { success: true, result: tutorResult });
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message || 'Failed to analyze uploaded document.' });
  }
}
