import { GoogleGenAI, ThinkingLevel } from '@google/genai';

function applyCors(req: any, res: any): boolean {
  const origin = typeof req?.headers?.origin === 'string' ? req.headers.origin : '';
  const allowedStatic = new Set([
    'https://smart-solve-40fb3.web.app',
    'https://smart-solve-40fb3.firebaseapp.com',
  ]);
  let allowed = false;
  if (origin) {
    if (allowedStatic.has(origin)) allowed = true;
    else {
      try {
        const parsed = new URL(origin);
        const host = parsed.hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1') allowed = true;
        else if (
          parsed.protocol === 'https:' &&
          (host.endsWith('.vercel.app') ||
            host.endsWith('.run.app') ||
            ((host.endsWith('.web.app') || host.endsWith('.firebaseapp.com')) &&
              host.startsWith('smart-solve-40fb3')))
        ) {
          allowed = true;
        }
      } catch {
        allowed = false;
      }
    }
  }
  res.setHeader('Vary', 'Origin');
  if (origin && allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  else if (!origin) res.setHeader('Access-Control-Allow-Origin', 'https://smart-solve-40fb3.web.app');
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

async function generateJson(contents: any[], timeoutMs = 25000) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || '';
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('Server AI configuration missing (GEMINI_API_KEY).');
  }
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
    const topic = String(body.topic || body.prompt || '').trim();
    if (!topic) return sendJson(res, 400, { error: 'Please enter a problem or concept for the AI Whiteboard.' });

    const prompt = `
You are an expert STEM visual tutor teaching on a 800x480 digital whiteboard coordinate grid (x from 0 to 800, y from 0 to 480).
Break down and illustrate: "${topic}"

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "Short title",
  "summary": "Brief overview",
  "finalAnswerLatex": "LaTeX final answer e.g. x = 5",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step heading",
      "narration": "Clear 1-2 sentence explanation for the student",
      "formulaLatex": "Relevant LaTeX equation e.g. a^2 + b^2 = c^2",
      "drawCommands": [
        {
          "type": "line | arrow | circle | rect | text | curve | axis",
          "color": "#22C55E | #38BDF8 | #F59E0B | #F43F5E | #FFFFFF",
          "x1": 100, "y1": 100, "x2": 300, "y2": 200,
          "cx": 400, "cy": 240, "r": 80,
          "x": 120, "y": 80, "w": 160, "h": 90,
          "label": "Text label drawn inside canvas (keep short ASCII/Unicode)",
          "points": [{"x": 100, "y": 350}, {"x": 250, "y": 220}, {"x": 400, "y": 140}]
        }
      ]
    }
  ]
}

Rules:
- Generate 4 to 6 progressive visual steps that cumulatively build the diagram and calculation on the 800x480 board.
- Keep all coordinates cleanly inside x: [40, 760], y: [40, 440].
- Put clear geometry sketches, axes, triangles, vectors, force arrows, curves, or circuit blocks in drawCommands.
- Escape any '%' in LaTeX as '\\%'.
`.trim();

    const lesson = await generateJson([{ text: prompt }], 35000);
    return sendJson(res, 200, { success: true, boardLesson: lesson });
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message || 'Failed to generate AI Whiteboard steps.' });
  }
}
