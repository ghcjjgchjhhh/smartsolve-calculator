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
  const models = ['gemini-4-hydrogen', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;
  for (const model of models) {
    try {
      const config: any = { responseMimeType: 'application/json' };
      if (model === 'gemini-4-hydrogen') config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      else if (model === 'gemini-3.1-flash-lite') config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
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
    const imageBase64 = String(body.imageBase64 || '').trim();
    const mimeType = String(body.mimeType || 'image/png');
    const note = String(body.note || '').trim();

    if (!imageBase64) {
      return sendJson(res, 400, { error: 'Please upload or draw an equation image to recognize.' });
    }

    const cleanData = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const prompt = `
Perform high-precision optical handwritten mathematical recognition on this image.
Identify handwritten equations, mathematical symbols, fractions, exponents/powers, square/nth roots, integrals, summations, Greek letters, matrices, or scientific notation (e.g. 6.02 x 10^23).
${note ? `Student hint/context: "${note}"` : ''}

Return ONLY valid JSON:
{
  "recognizedText": "Human-readable transcription of the handwritten math/question",
  "recognizedLatex": "Accurate LaTeX representation (use \\frac, \\sqrt, \\int, \\sum, ^, \\times 10^{...})",
  "evaluableExpression": "ASCII math expression if numeric calculation (e.g. (3/4)^2 + sqrt(25), else empty string)",
  "detectedSymbols": ["Fractions", "Powers", "Integrals", "Scientific Notation"],
  "confidenceNotes": "Brief note if any handwritten digit/symbol could be ambiguous",
  "steps": ["Step 1...", "Step 2..."],
  "finalAnswerLatex": "Exact solved answer in LaTeX",
  "finalAnswerPlain": "Plain text final answer"
}
`.trim();

    const recognized = await generateJson([{ text: prompt }, { inlineData: { mimeType, data: cleanData } }], 40000);
    return sendJson(res, 200, { success: true, recognition: recognized });
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message || 'Failed to recognize handwritten mathematics.' });
  }
}
