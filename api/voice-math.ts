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
  if (origin && allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', 'https://smart-solve-40fb3.web.app');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-gemini-key');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req?.method === 'OPTIONS') {
    if (typeof res.sendStatus === 'function') {
      res.sendStatus(200);
    } else {
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

function normalizeAudioMime(raw?: string): string {
  let mime = String(raw || 'audio/webm').trim().toLowerCase();
  if (mime.includes(';')) mime = mime.split(';')[0].trim();
  if (mime === 'audio/x-m4a' || mime === 'audio/m4a') return 'audio/mp4';
  if (mime === 'audio/x-wav') return 'audio/wav';
  if (mime === 'audio/mp3') return 'audio/mpeg';
  return mime || 'audio/webm';
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

async function transcribeAudioForMath(
  apiKey: string,
  cleanAudioData: string,
  mimeType: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  const audioPart = { inlineData: { mimeType, data: cleanAudioData } };
  const textPrompt =
    'Transcribe this speech recording accurately verbatim into clean text. Preserve all spoken numbers, variables (x, y, z, theta, pi), fractions, exponents, square roots, integrals, derivatives, chemical formulas, and physics units accurately. If there is no intelligible speech, output exactly "[NO_SPEECH]". Output ONLY the transcription text.';

  const models = ['gemini-3.5-transcribe', 'gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
  for (const model of models) {
    try {
      const config: any = {};
      if (model === 'gemini-3.1-flash-lite') config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      else if (model === 'gemini-4-hydrogen') config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };

      const response = (await Promise.race([
        ai.models.generateContent({
          model,
          contents: { parts: [audioPart, { text: textPrompt }] },
          ...(Object.keys(config).length > 0 ? { config } : {}),
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error(`Timeout on ${model}`)), 20000)),
      ])) as any;

      const text = String(response?.text || '').trim();
      if (!text) continue;
      if (
        text === '[NO_SPEECH]' ||
        /^\[?no[_\s-]?speech\]?$/i.test(text) ||
        /^(\d{1,2}:)?\d{1,2}:\d{2}(\.\d+)?$/.test(text)
      ) {
        return '';
      }
      return text.replace(/^["“]|["”]$/g, '').trim();
    } catch {
      // try fallback model
    }
  }
  return '';
}

async function generateJson(apiKey: string, contents: any[], timeoutMs = 25000) {
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
    const apiKey = resolveApiKey(req);
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return sendJson(res, 503, { error: 'Server AI configuration missing (GEMINI_API_KEY).' });
    }

    const body = parseBody(req);
    let transcript = String(body.transcript || '').trim();
    const audioBase64 = body.audioBase64 ? String(body.audioBase64) : '';
    const audioMimeType = normalizeAudioMime(body.audioMimeType);

    if (!transcript && !audioBase64) {
      return sendJson(res, 400, { error: 'Please speak or record a mathematical question.' });
    }

    const cleanAudioData = audioBase64
      ? (audioBase64.includes(',') ? audioBase64.split(',')[1].trim() : audioBase64.trim())
      : '';

    if (!transcript && (!cleanAudioData || cleanAudioData.length < 64)) {
      return sendJson(res, 400, { error: 'The voice recording was too short or empty. Please speak clearly and try again.' });
    }

    if (cleanAudioData && !transcript) {
      const heard = await transcribeAudioForMath(apiKey, cleanAudioData, audioMimeType);
      if (heard) {
        transcript = heard;
      }
    }

    const prompt = `
Convert this spoken mathematics or science request into exact mathematical notation and solve it cleanly.
${transcript ? `Spoken Transcript: "${transcript}"` : 'Audio recording attached.'}

Return ONLY valid JSON:
{
  "spokenInterpretation": "Clean, accurate English transcription of what the student asked",
  "latex": "Exact formatted LaTeX equation/expression (e.g. \\\\int_{0}^{3} x^2 \\\\, dx or \\\\frac{3}{4} + \\\\sqrt{16})",
  "evaluableExpression": "Plain ASCII JS/math expression if purely numeric/evaluable (e.g. (3/4) + sqrt(16), or empty string if algebraic equation/calculus)",
  "plotExpression": "JavaScript expression in variable x if plottable function (e.g. x*x - 4, or empty string)",
  "subject": "Mathematics | Physics | Chemistry | Calculus",
  "steps": ["Step 1...", "Step 2...", "Step 3..."],
  "finalAnswerLatex": "LaTeX formatted final answer",
  "finalAnswerPlain": "Plain readable final answer"
}
`.trim();

    const contents: any[] = [{ text: prompt }];
    if (cleanAudioData) {
      contents.push({ inlineData: { mimeType: audioMimeType, data: cleanAudioData } });
    }

    const parsed = await generateJson(apiKey, contents, 35000);
    if (!parsed.spokenInterpretation && transcript) {
      parsed.spokenInterpretation = transcript;
    }
    return sendJson(res, 200, { success: true, transcript: parsed.spokenInterpretation || transcript, result: parsed });
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message || 'Failed to parse spoken mathematical expression.' });
  }
}
