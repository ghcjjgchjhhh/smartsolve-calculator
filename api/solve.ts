import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      return res.end();
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    }

    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const headerKey =
      (req.headers?.['x-gemini-key'] as string) ||
      (req.headers?.['authorization'] as string)?.replace(/^Bearer\s+/i, '') ||
      '';
    const apiKey = (headerKey && headerKey.trim()) ? headerKey.trim() : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          error:
            'Gemini API Key is not configured. Please tap "Set API Key" in the app to paste your key.',
        })
      );
    }

    const { prompt, imageData, mimeType, subject } = body;
    if (!prompt && !imageData) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Please enter a math or physics question.' }));
    }

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
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: true, solution: parsedSolution }));
  } catch (error: any) {
    console.error('API solve error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: error.message || 'Failed to solve question using Gemini AI on Vercel.',
      })
    );
  }
}
