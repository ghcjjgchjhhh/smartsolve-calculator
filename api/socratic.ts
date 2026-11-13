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
    const problem = String(body.problem || '').trim();
    const mode = String(body.mode || 'start');
    const studentAttempt = String(body.studentAttempt || '').trim();
    const hintLevel = Number(body.hintLevel || 1);
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

    if (!problem) return sendJson(res, 400, { error: 'Please enter a problem for Socratic tutoring.' });

    const conversationSummary = history.map((h: any) => `${h.role === 'student' ? 'Student' : 'Tutor'}: ${h.content}`).join('\n');

    const prompt = `
You are a patient, brilliant Socratic STEM Tutor.
Problem: "${problem}"
Current Mode: "${mode}"
Requested Hint Level (1=gentle nudge, 2=formula/strategy clue, 3=near-complete setup): ${hintLevel}
${studentAttempt ? `Student's Attempt / Response: "${studentAttempt}"` : ''}
${conversationSummary ? `Recent Dialogue:\n${conversationSummary}` : ''}

STRICT PEDAGOGICAL RULES:
- If mode is "start", "next_hint", or "check_attempt": DO NOT reveal the final numerical or symbolic answer! Guide the student with a sharp Socratic question, check if their attempt is on the right track (or gently spot any algebraic/unit mistake), and give a progressive hint matching hintLevel.
- ONLY if mode is "reveal_solution": Provide the complete step-by-step worked solution and final answer!
- Format math expressions cleanly with $...$ and $$...$$ LaTeX.

Return ONLY valid JSON:
{
  "feedback": "Encouraging response evaluating student's attempt or setting up the step (without spoiling answer unless mode=reveal_solution)",
  "guidingQuestion": "One targeted Socratic question for the student to think about next",
  "hint": "Progressive hint for level ${hintLevel} (empty if reveal_solution)",
  "isAttemptCorrect": false,
  "solvedCompletely": false,
  "fullSolution": {
    "formula": "",
    "steps": [],
    "finalAnswer": "",
    "conceptTakeaway": ""
  }
}
`.trim();

    const socratic = await generateJson([{ text: prompt }], 35000);
    return sendJson(res, 200, { success: true, socratic });
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message || 'Failed to generate Socratic tutor response.' });
  }
}
