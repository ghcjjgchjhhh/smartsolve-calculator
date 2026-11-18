import { GoogleGenAI, ThinkingLevel } from '@google/genai';

function applyCors(req: any, res: any): boolean {
  const origin = typeof req?.headers?.origin === 'string' ? req.headers.origin : '';
  let allowed = false;
  if (origin) {
    try {
      const parsed = new URL(origin);
      const host = parsed.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1') allowed = true;
      else if (
        parsed.protocol === 'https:' &&
        (host.endsWith('.vercel.app') || host.endsWith('.run.app'))
      ) {
        allowed = true;
      }
    } catch {
      allowed = false;
    }
  }
  res.setHeader('Vary', 'Origin');
  if (origin && allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  else if (!origin) res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-gemini-key');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req?.method === 'OPTIONS') {
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

function repairAndParseJson(rawText: string | undefined): any {
  let txt = (rawText || '{}')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const match = txt.match(/\{[\s\S]*\}/);
  if (match) txt = match[0];
  try {
    return JSON.parse(txt);
  } catch {
    return JSON.parse(txt.replace(/,\s*([}\]])/g, '$1').replace(/\\(?!["\\/bfnrtu])/g, '\\\\'));
  }
}

function isValidApiKey(val: unknown): string {
  const s = typeof val === 'string' ? val.trim() : '';
  if (!s || s === 'MY_GEMINI_API_KEY' || s === 'YOUR_GEMINI_API_KEY' || s.length < 16) return '';
  return s;
}

function resolveApiKey(req: any, body?: any): string {
  const envCandidates = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_GENAI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GEMINI_KEY,
    process.env.GENAI_API_KEY,
    process.env.VITE_GEMINI_API_KEY,
    process.env.VITE_GOOGLE_API_KEY,
    process.env.API_KEY,
  ];
  const headerKey =
    (req?.headers?.['x-gemini-key'] as string) ||
    (req?.headers?.['authorization'] as string)?.replace(/^Bearer\s+/i, '') ||
    '';

  return (
    envCandidates.map(isValidApiKey).find(Boolean) ||
    isValidApiKey(headerKey) ||
    isValidApiKey(body?.apiKey) ||
    ''
  );
}

async function generateJson(apiKey: string, contents: any[], timeoutMs = 28000) {
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  const models = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
  let lastError: any = null;
  for (const model of models) {
    try {
      const config: any = { responseMimeType: 'application/json' };
      if (model === 'gemini-3.1-flash-lite') config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      else if (model === 'gemini-4-hydrogen') config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      const response = (await Promise.race([
        ai.models.generateContent({ model, contents, config }),
        new Promise((_, rej) => setTimeout(() => rej(new Error(`Timeout waiting for ${model}`)), timeoutMs)),
      ])) as any;
      return repairAndParseJson(response.text);
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
    const apiKey = resolveApiKey(req, body);
    if (!apiKey) {
      return sendJson(res, 503, {
        error:
          'Server AI configuration missing (GEMINI_API_KEY). Add GEMINI_API_KEY in Vercel Environment Variables and redeploy.',
      });
    }

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

    const tutorResult = await generateJson(apiKey, [{ text: prompt }], 40000);
    return sendJson(res, 200, { success: true, result: tutorResult });
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message || 'Failed to analyze uploaded document.' });
  }
}
