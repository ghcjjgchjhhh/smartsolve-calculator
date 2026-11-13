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
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
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
    const query = String(body.query || body.topic || '').trim();
    const discipline = String(body.discipline || 'Physics & General Science').trim();

    if (!query) return sendJson(res, 400, { error: 'Please enter a scientific law, theory, discovery, or experiment.' });

    const prompt = `
You are an academic scientific research synthesizer explaining STEM laws, theories, discoveries, and experiments with strict epistemic honesty.
Topic / Query: "${query}"
Discipline: "${discipline}"

CRITICAL EPISTEMIC RULE:
Explicitly separate **Established Scientific Consensus / Empirically Verified Facts** from **Uncertain, Open, Hypothetical, or Frontier Scientific Areas**. Never state unproven hypotheses as settled fact.

Return ONLY valid JSON:
{
  "title": "Formal scientific title",
  "discipline": "Physics | Chemistry | Biology | Mathematics | Astronomy | Interdisciplinary",
  "summary": "2-3 sentence rigorous executive summary",
  "establishedConsensus": [
    {
      "claim": "Verified scientific principle or experimental law",
      "evidence": "How this has been repeatedly tested and verified empirically"
    }
  ],
  "uncertainOrFrontier": [
    {
      "topic": "Open question, limit of validity, or competing hypothesis",
      "status": "Hypothetical | Theoretical Limit | Under Active Research | Scope Boundary",
      "explanation": "Why this remains uncertain, where the law breaks down (e.g. relativistic/quantum scales), or what experiments are still testing it"
    }
  ],
  "keyEquations": [
    {
      "name": "Equation / Law name",
      "latex": "LaTeX equation",
      "variables": "Meaning and SI units of symbols"
    }
  ],
  "landmarkExperiments": [
    {
      "year": "e.g. 1887 or 1909",
      "scientist": "Researcher(s)",
      "experiment": "Name and setup of experiment",
      "finding": "What was directly observed and concluded"
    }
  ],
  "workedExample": {
    "problem": "Quantitative or conceptual example problem",
    "steps": ["Step 1...", "Step 2..."],
    "answer": "Final answer in LaTeX"
  },
  "diagramDescription": "Visual setup summary if applicable"
}
`.trim();

    const research = await generateJson([{ text: prompt }], 40000);
    return sendJson(res, 200, { success: true, research });
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message || 'Failed to generate scientific research brief.' });
  }
}
