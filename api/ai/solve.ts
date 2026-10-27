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
    const serverKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.API_KEY ||
      '';
    const apiKey =
      (headerKey && headerKey.trim()) ||
      (body.apiKey && String(body.apiKey).trim()) ||
      serverKey;

    if (!apiKey) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          error:
            'AI reasoning engine is temporarily unavailable. Please try again in a few moments.',
        })
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. GENERATE JAMB / WAEC / JUPEB / UNIVERSITY CUSTOM EXAM QUESTIONS
    if (body.action === 'generate_questions' || body.action === 'generate_exam') {
      const subject = body.subject || 'Physics';
      const topic = body.topic || 'General Syllabus';
      const exam = body.exam || 'JAMB UTME';
      const difficulty = body.difficulty || 'Medium';
      const count = Math.min(Math.max(body.count || 10, 5), 40);

      const promptText = `
You are SmartSolve AI, an expert Nigerian examination tutor for ${exam} in ${subject}.
Generate exactly ${count} realistic, standard examination questions on:
Topic / Formula: "${topic}"
Difficulty Level: "${difficulty}".

SYLLABUS & EXAM STANDARDS:
- For JAMB/UTME: Use current JAMB syllabus and CBT examination style.
- For WAEC/WASSCE: Use current WAEC syllabus and examination style.
- For JUPEB: Use JUPEB university-foundation syllabus and rigor.
- For Chemistry: Cover authentic concepts like mole concept, stoichiometry, atomic structure, gas laws, electrochemistry, acids/bases, or equilibrium.
- For Mathematics & Physics: Ensure 100% computational and dimensional accuracy.

STYLING & 8-STEP SOLUTION RULES (CRITICAL):
1. Format all formulas, powers, fractions, and symbols using standard LaTeX notation ($...$, \\frac{a}{b}, \\sqrt{...}, x^2).
2. Every question must have exactly 4 plausible options labeled A, B, C, D.
3. Specify the exact correct answer ('A', 'B', 'C', or 'D').
4. For every calculation, provide:
   - Given information with SI units
   - Governing theoretical formula
   - Value substitution
   - Step-by-step calculation
   - Final answer with unit
   - Educational explanation of why the answer is correct and why the chosen option is right.

Respond with ONLY a valid JSON object matching this exact structure:
{
  "subject": "${subject}",
  "exam": "${exam}",
  "difficulty": "${difficulty}",
  "topic": "${topic}",
  "total": ${count},
  "questions": [
    {
      "id": "q1",
      "question": "Question statement in LaTeX notation...",
      "options": {
        "A": "Option A text with math",
        "B": "Option B text with math",
        "C": "Option C text with math",
        "D": "Option D text with math"
      },
      "correctAnswer": "A",
      "givenValues": "Given values with units (e.g. m = 2 kg, v = 10 m/s)",
      "formula": "Governing formula in LaTeX",
      "substitution": "Formula with numbers plugged in",
      "steps": [
        "Given: ...",
        "Formula: ...",
        "Substitution: ...",
        "Calculation: ...",
        "Final: ..."
      ],
      "explanation": "Educational explanation of why Option A is the correct answer",
      "examTip": "Useful exam advice or common pitfall to avoid"
    }
  ]
}
`.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ text: promptText }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const resultText = response.text?.trim() || '{}';
      let cleanJson = resultText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const match = cleanJson.match(/\{[\s\S]*\}/);
      if (match) cleanJson = match[0];

      const parsedData = JSON.parse(cleanJson);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, ...parsedData }));
    }

    // 2. SOLVE INDIVIDUAL PROBLEM
    const { prompt, imageData, mimeType, subject } = body;
    if (!prompt && !imageData) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Please enter a math or physics question.' }));
    }

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
Solve this ${subject || 'Mathematics or Physics'} problem with crystal-clear, textbook-grade step-by-step mathematical reasoning.
Problem: "${prompt || 'Solve the question shown in the image.'}"

STYLING & NOTATION RULES (MATCHING TEXTBOOK & CHATGPT MATH CLARITY):
1. Format all equations, fractions, square roots, exponents, and expressions using standard LaTeX notation (e.g. \\frac{a}{b}, \\sqrt{...}, x^2, \\pm, \\approx, \\ge, \\le).
2. In "steps", present a clean, sequential mathematical derivation:
   - Alternate between short text labels (e.g. "Squaring:", "Since the left side is nonnegative, $x \\ge 1$.", "Square again:", "Therefore, there is no real solution.") and display equations (e.g. "$$2\\sqrt{(x+6)(2x-1)} = 2x - 2$$", "$$x = \\frac{-13 \\pm \\sqrt{197}}{2}$$").
3. In "formula", provide the theoretical formula or law in LaTeX (e.g. "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$" or "$$K = \\frac{1}{2}mv^2$$").
4. In "finalAnswer", provide the exact clean result (e.g. "$$x = \\frac{-13 \\pm \\sqrt{197}}{2}$$" or "\\text{No real value of } x" or "100\\text{ J}").

You MUST respond with a valid JSON object with EXACTLY this structure:
{
  "title": "Descriptive title of the problem",
  "category": "${subject || 'Physics'}",
  "subCategory": "Topic name (e.g. Kinematics, Algebra, Calculus)",
  "problemStatement": "Clear restatement of question in LaTeX",
  "formula": "Theoretical formula or law in LaTeX",
  "rearrangedFormula": "Formula rearranged for target unknown in LaTeX",
  "substitution": "Formula with numbers and SI units plugged in LaTeX",
  "steps": [
    "Step 1 or label (e.g. Squaring:)",
    "$$equation$$",
    "Explanation text with $inline math$",
    "$$next equation$$"
  ],
  "finalAnswer": "Final answer in LaTeX",
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
        error: error.message || 'Failed to solve question using AI.',
      })
    );
  }
}
