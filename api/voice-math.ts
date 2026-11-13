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

async function generateJson(contents: any[], timeoutMs = 35000) {
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
    const transcript = String(body.transcript || '').trim();
    const audioBase64 = body.audioBase64 ? String(body.audioBase64) : '';
    const audioMimeType = body.audioMimeType ? String(body.audioMimeType) : 'audio/webm';

    if (!transcript && !audioBase64) {
      return sendJson(res, 400, { error: 'Please speak or record a mathematical question.' });
    }

    const prompt = `
Convert this spoken mathematics or science request into exact mathematical notation and solve it cleanly.
${transcript ? `Spoken Transcript: "${transcript}"` : 'Audio recording attached.'}

Return ONLY valid JSON:
{
  "spokenInterpretation": "Clean English transcription of what the student asked",
  "latex": "Exact formatted LaTeX equation/expression (e.g. \\int_{0}^{3} x^2 \\, dx or \\frac{3}{4} + \\sqrt{16})",
  "evaluableExpression": "Plain ASCII JS/math expression if purely numeric/evaluable (e.g. (3/4) + sqrt(16), or empty string if algebraic equation/calculus)",
  "plotExpression": "JavaScript expression in variable x if plottable function (e.g. x*x - 4, or empty string)",
  "subject": "Mathematics | Physics | Chemistry | Calculus",
  "steps": ["Step 1...", "Step 2...", "Step 3..."],
  "finalAnswerLatex": "LaTeX formatted final answer",
  "finalAnswerPlain": "Plain readable final answer"
}
`.trim();

    const contents: any[] = [{ text: prompt }];
    if (audioBase64) {
      const cleanData = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
      contents.push({ inlineData: { mimeType: audioMimeType, data: cleanData } });
    }

    const parsed = await generateJson(contents, 35000);
    return sendJson(res, 200, { success: true, result: parsed });
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message || 'Failed to parse spoken mathematical expression.' });
  }
}
