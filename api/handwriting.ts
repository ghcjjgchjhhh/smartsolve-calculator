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
    const repaired = txt
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    return JSON.parse(repaired);
  }
}

async function generateJson(contents: any[], timeoutMs = 18000) {
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

      const parsed = repairAndParseJson(response.text);
      if (!parsed || (!parsed.recognizedText && !parsed.recognizedLatex)) {
        throw new Error(`Model ${model} returned empty OCR recognition.`);
      }
      return parsed;
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
    const imageBase64 = String(body.imageBase64 || '').trim();
    const mimeType = String(body.mimeType || 'image/png');
    const note = String(body.note || '').trim();

    if (!imageBase64) {
      return sendJson(res, 400, { error: 'Please upload or draw an equation image to recognize.' });
    }

    const cleanData = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const prompt = `
Transcribe this handwritten math/STEM image with high accuracy (fractions, roots, powers, integrals, summations, Greek letters, matrices, scientific notation).
${note ? `Student hint: "${note}"` : ''}

Return ONLY valid JSON with concise steps (2–4 short lines):
{
  "recognizedText": "Plain transcription of the handwritten math",
  "recognizedLatex": "Accurate LaTeX (use \\frac, \\sqrt, \\int, \\sum, ^, \\times 10^{...})",
  "evaluableExpression": "Pure ASCII arithmetic expression if numeric calculation, else empty string",
  "detectedSymbols": ["Fractions", "Powers"],
  "confidenceNotes": "Short note only if a symbol is ambiguous, else empty string",
  "steps": ["Step 1...", "Step 2..."],
  "finalAnswerLatex": "Exact solved answer in LaTeX",
  "finalAnswerPlain": "Plain text final answer"
}
`.trim();

    const recognized = await generateJson([{ text: prompt }, { inlineData: { mimeType, data: cleanData } }], 18000);
    return sendJson(res, 200, { success: true, recognition: recognized });
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message || 'Failed to recognize handwritten mathematics.' });
  }
}
