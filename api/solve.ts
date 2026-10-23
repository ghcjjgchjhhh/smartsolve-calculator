import { GoogleGenAI } from '@google/genai';

export const config = {
  maxDuration: 30,
};

function sendJson(res: any, status: number, data: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(data);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-gemini-key'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  // Safely parse body whether it's an object, string, or stream
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  } else if (!body) {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {}
  }

  const { prompt, imageData, mimeType, subject } = body || {};

  // Check header key first, then environment variable
  const headerKey = (req.headers?.['x-gemini-key'] as string) || '';
  const apiKey = headerKey.trim() || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return sendJson(res, 400, {
      error:
        'Gemini API Key is not set. Please add GEMINI_API_KEY in Vercel Settings > Environment Variables, or enter it directly in the app using the "Set API Key" button.',
    });
  }

  if (!prompt && !imageData) {
    return sendJson(res, 400, { error: 'Please provide a math or physics question.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const contents: any[] = [];
    if (imageData) {
      const cleanBase64 = imageData.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const promptText = `
You are SmartSolve AI, a master Mathematics and Physics professor.
Solve this ${subject || 'Mathematics or Physics'} problem with full verified steps:
Problem: "${prompt || 'Solve the question shown in the image.'}"

Requirements:
1. Identify all given quantities with symbols, values, and SI units.
2. State the governing theoretical formula or law before solving.
3. Show formula algebraic rearrangement for target variable if needed.
4. Show numerical substitution with SI units.
5. Provide numbered steps with intermediate arithmetic.
6. State the final answer with correct units.
7. Provide a concise explanation and practical tip.

You MUST respond with a valid JSON object with EXACTLY this structure:
{
  "title": "Descriptive title of the problem",
  "category": "${subject || 'Physics'}",
  "subCategory": "Topic name (e.g. Kinematics, Algebra, Calculus)",
  "problemStatement": "Clear formal restatement of question",
  "formula": "Theoretical formula or law used",
  "rearrangedFormula": "Formula rearranged for target unknown",
  "substitution": "Formula with numbers and SI units plugged in",
  "steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "finalAnswer": "Exact final answer with SI unit",
  "unit": "SI unit",
  "explanation": "Clear explanation of why this physical or mathematical law applies",
  "tips": "Pro tip or exam advice for solving this problem"
}
`.trim();

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const resultText = response.text?.trim() || '{}';
    let cleanJson = resultText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const match = cleanJson.match(/\{[\s\S]*\}/);
    if (match) cleanJson = match[0];

    const parsedSolution = JSON.parse(cleanJson);
    return sendJson(res, 200, { success: true, solution: parsedSolution });
  } catch (error: any) {
    console.error('Vercel Gemini solver error:', error);
    return sendJson(res, 500, {
      error: error.message || 'Failed to solve question using Gemini AI on Vercel.',
    });
  }
}
