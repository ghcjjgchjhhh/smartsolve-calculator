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
You are SmartSolve AI, a master Mathematics, Physics, and Chemistry professor.
Solve this ${subject || 'Mathematics, Physics or Chemistry'} problem with crystal-clear, textbook-grade step-by-step mathematical reasoning matching official WAEC, Cambridge, and university exam standards.

CRITICAL PRESENTATION & SOLVING RULES:
1. MULTI-PART QUESTION STRUCTURING:
   If the question asks for multiple items (e.g. 1, 2, 3, 4 or (a), (b), (c)):
   - Delineate each part with an explicit section header in "steps", e.g. "Part 1: The Acceleration of the Car", "Part 2: Total Distance Travelled".
   - For EACH part, show:
     a) The formula in LaTeX ($$...$$).
     b) Direct numerical substitution with SI units attached ($$...$$).
     c) Intermediate calculations (never skip arithmetic).
     d) The intermediate answer with units.
2. RIGOROUS ARITHMETIC & UNITS:
   - Always attach proper SI units (e.g. m/s, m/s^2, J, N, kg, mol/dm^3).
   - Double check all algebraic steps.
3. FINAL ANSWER BOXING:
   - "finalAnswer" MUST be formatted with \\boxed{...}.
   - Wrap non-mathematical words inside \\text{...}.
   - Multi-part answers must be separated by ",\\quad ":
     e.g. "\\boxed{a = 3\\text{ m/s}^2,\\quad s = 900\\text{ m},\\quad \\text{deceleration} = 3\\text{ m/s}^2,\\quad v_{\\text{avg}} = 22.5\\text{ m/s}}"
   - Ensure all braces are closed and never produce trailing or truncated macros like \\tex.

Problem: "${prompt || 'Solve the question shown in the image.'}"

You MUST respond with a valid JSON object with EXACTLY this structure:
{
  "title": "Descriptive title of the problem",
  "category": "${subject || 'Physics'}",
  "subCategory": "Topic name (e.g. Kinematics, Algebra, Calculus)",
  "problemStatement": "Clear restatement of question in LaTeX",
  "formula": "Theoretical formula or law in LaTeX",
  "rearrangedFormula": "Formula rearranged for target unknown in LaTeX",
  "whatIsRequired": "Summary of required quantities with symbols and units",
  "givenValues": [
    { "name": "Initial velocity", "symbol": "u", "value": "0", "unit": "m/s" },
    { "name": "Maximum velocity", "symbol": "v", "value": "30", "unit": "m/s" }
  ],
  "substitution": "Formula with numbers and SI units plugged in LaTeX",
  "steps": [
    "Part 1: The Acceleration of the Car",
    "Formula for acceleration (gradient):",
    "$$a = \\frac{v - u}{t}$$",
    "Substitution:",
    "$$a = \\frac{30\\text{ m/s} - 0\\text{ m/s}}{10\\text{ s}} = 3\\text{ m/s}^2$$",
    "Part 2: The Total Distance Travelled",
    "$$s = \\frac{1}{2}(20\\text{ s} + 40\\text{ s}) \\times 30\\text{ m/s} = 900\\text{ m}$$"
  ],
  "finalAnswer": "\\boxed{a = 3\\text{ m/s}^2,\\quad s = 900\\text{ m},\\quad \\text{deceleration} = 3\\text{ m/s}^2,\\quad v_{\\text{avg}} = 22.5\\text{ m/s}}",
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
