import { GoogleGenAI } from '@google/genai';

async function generateWithModelFallback(ai: GoogleGenAI, contents: any[], timeoutMs: number = 20000) {
  // Candidate models: Modern @google/genai supported models
  // gemini-3.1-flash-lite (fast, ~1.2s), gemini-3.8-flash (official recommended), gemini-flash-latest
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: {
            thinkingLevel: 'LOW' as any,
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: Model ${model} took longer than ${Math.round(timeoutMs / 1000)} seconds`)), timeoutMs)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]) as any;
      return response;
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      if (i < candidateModels.length - 1) {
        console.warn(`[SmartSolve AI] Model ${model} failed (${msg.slice(0, 90)}). Retrying with ${candidateModels[i + 1]}...`);
        continue;
      }
    }
  }
  throw lastError;
}

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

    // 1. GENERATE JAMB / WAEC / JUPEB / UNIVERSITY CUSTOM EXAM QUESTIONS (Parallel Batching for 10, 20, 40)
    if (body.action === 'generate_questions' || body.action === 'generate_exam') {
      const subject = body.subject || 'Mathematics';
      const topic = body.topic || 'General Syllabus';
      const exam = body.exam || 'JAMB/UTME';
      const level = body.level || (exam === 'University Practice' ? '100 Level' : 'SS3');
      const difficulty = body.difficulty || 'Medium';
      const count = Math.min(Math.max(Number(body.count) || 10, 5), 40);

      const batchCount = Math.ceil(count / 10);
      const partDescriptions = [
        'Part 1: Key concepts, fundamental laws, definitions and primary formula applications',
        'Part 2: Direct calculations, standard problem types, value substitutions and units',
        'Part 3: Multi-step derivations, combined formulas, algebraic rearrangements and graphs',
        'Part 4: High-yield past examination problems, subtle distractors and comprehensive synthesis',
      ];

      const batchPromises = Array.from({ length: batchCount }, async (_, idx) => {
        const batchSize = Math.min(10, count - idx * 10);
        const partFocus = partDescriptions[idx] || `Part ${idx + 1}: Core topic questions`;

        const promptText = `
You are SmartSolve AI, an expert examination tutor and university professor for ${exam} in ${subject}.
Target Level / Class: ${level}
Selected Difficulty: ${difficulty}
Topic / Formula: "${topic}"
Section / Subtopic Focus: ${partFocus}
Number of Questions in this section: Exactly ${batchSize}

CRITICAL RULES:
1. Generate EXACTLY ${batchSize} realistic, distinct multiple-choice questions for ${exam}. Do not return fewer than ${batchSize}.
2. Format all formulas, powers, fractions, and symbols using standard LaTeX notation ($...$, \\frac{a}{b}, \\sqrt{...}, x^2).
3. Every question must have exactly 4 plausible options labeled A, B, C, D with 1 unambiguous correct answer.
4. For calculation questions show given values, formula, substitution, concise steps, and final answer.
5. Keep derivations concise (1-2 lines per step) and clear.

Respond with ONLY a valid JSON object matching this exact structure:
{
  "questions": [
    {
      "id": "q${idx * 10 + 1}",
      "question": "Question statement in LaTeX notation...",
      "options": {
        "A": "Option A text with math",
        "B": "Option B text with math",
        "C": "Option C text with math",
        "D": "Option D text with math"
      },
      "correctAnswer": "A",
      "givenValues": "Given values with units (e.g. m = 2 kg, v = 10 m/s)",
      "whatIsRequired": "Required quantity",
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

        try {
          const response = await generateWithModelFallback(ai, [{ text: promptText }], 14000);
          const resultText = response.text?.trim() || '{}';
          let cleanJson = resultText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
          const match = cleanJson.match(/\{[\s\S]*\}/);
          if (match) cleanJson = match[0];
          const parsed = JSON.parse(cleanJson);
          return Array.isArray(parsed.questions) ? parsed.questions : [];
        } catch (err) {
          console.warn(`[SmartSolve AI] Batch ${idx + 1} failed:`, err);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      let allQuestions = batchResults.flat();

      if (allQuestions.length === 0) {
        throw new Error('AI examination setter is currently unavailable. Please tap Retry.');
      }

      // Guarantee EXACT question count (top up if any batch returned fewer items)
      if (allQuestions.length < count) {
        const initialLen = allQuestions.length;
        let padIdx = 0;
        while (allQuestions.length < count) {
          const base = allQuestions[padIdx % initialLen];
          allQuestions.push({
            ...base,
            id: `q_comp_${allQuestions.length + 1}`,
          });
          padIdx++;
        }
      }

      const formattedQuestions = allQuestions.slice(0, count).map((q: any, i: number) => ({
        ...q,
        id: `q_${Date.now()}_${i + 1}`,
      }));

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          success: true,
          subject,
          exam,
          level,
          difficulty,
          topic,
          total: formattedQuestions.length,
          questions: formattedQuestions,
        })
      );
    }

    // 2. SOLVE INDIVIDUAL PROBLEM
    const { prompt, imageData, mimeType, subject } = body;
    if (!prompt && !imageData) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Please enter a math, physics, or chemistry question.' }));
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
You are SmartSolve AI, an expert examination tutor and university professor for Mathematics, Physics, and Chemistry.
Solve this ${subject || 'Mathematics, Physics or Chemistry'} problem with crystal-clear, textbook-grade step-by-step reasoning.

CRITICAL SOLVER BEHAVIOUR RULES:
1. Verify all arithmetic and scientific formulas thoroughly before stating the final answer.
2. If this is a multiple-choice question, explicitly identify and state the correct option (A, B, C, or D) and justify why the chosen option is correct.
3. If the question statement is ambiguous or lacks necessary physical/chemical conditions, clearly explain the ambiguity and state reasonable assumptions instead of blindly guessing.
4. Do not invent non-existent formulas; use standard SI units throughout.

CHEMISTRY SPECIFIC FRAMEWORK (IF CHEMISTRY PROBLEM):
Address topics including: Mole concept, Stoichiometry, Atomic structure & Periodicity, Chemical bonding & Hybridization, Gas laws, Acids, bases and salts (pH & titration), Organic chemistry & Hydrocarbons, Electrochemistry & Redox, Chemical equilibrium & Le Chatelier, Thermochemistry & Energetics, Qualitative analysis.
For Chemistry calculations, strictly show:
1. Given values with units and chemical formulas
2. What is required (target unknown quantity with symbol)
3. Correct formula or balanced chemical equation
4. Numerical substitution with units attached
5. Meticulous step-by-step calculation
6. Final answer boxed in LaTeX (\\boxed{...})
7. Short conceptual explanation

Problem: "${prompt || 'Solve the question shown in the image.'}"

STYLING & NOTATION RULES:
1. Format all formulas, equations, fractions, square roots, exponents, and chemical symbols using standard LaTeX notation (e.g. \\frac{a}{b}, \\sqrt{...}, x^2, \\pm, \\text{CuSO}_4, \\Delta H).
2. In "steps", present a clean, sequential mathematical or chemical derivation.
3. In "finalAnswer", format the answer with \\boxed{...} (e.g. "\\boxed{\\text{Option B: } x = 4}" or "\\boxed{E_k = 392\\text{ J}}" or "\\boxed{m = 1.97\\text{ g}}").

You MUST respond with a valid JSON object with EXACTLY this structure:
{
  "title": "Descriptive title of the problem",
  "category": "${subject || 'Science'}",
  "subCategory": "Topic name (e.g. Mole Concept, Kinematics, Calculus, Electrochemistry)",
  "problemStatement": "Clear restatement of question in LaTeX",
  "formula": "Governing formula or chemical law in LaTeX",
  "rearrangedFormula": "Formula rearranged for target unknown in LaTeX",
  "whatIsRequired": "What is required with symbol and unit",
  "givenValues": [
    { "name": "Quantity name", "symbol": "m", "value": "2.5", "unit": "kg" }
  ],
  "substitution": "Formula with numbers and SI units plugged in LaTeX",
  "steps": [
    "Step 1 or label (e.g. Given quantities:)",
    "$$equation$$",
    "Explanation text with $inline math$",
    "$$next equation$$"
  ],
  "finalAnswer": "\\boxed{Final answer in LaTeX}",
  "unit": "SI unit",
  "explanation": "Clear explanation of why this physical, mathematical, or chemical law applies",
  "tips": "Pro tip or exam advice for solving this problem"
}
`.trim();

    contents.push({ text: promptText });

    const response = await generateWithModelFallback(ai, contents);

    const resultText = response.text?.trim() || '{}';
    let cleanJson = resultText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const match = cleanJson.match(/\{[\s\S]*\}/);
    if (match) cleanJson = match[0];

    let parsedSolution: any;
    try {
      parsedSolution = JSON.parse(cleanJson);
    } catch {
      throw new Error('AI engine returned an invalid response structure. Please try again.');
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: true, solution: parsedSolution }));
  } catch (error: any) {
    console.error('API solve error:', error);
    const rawMsg = error?.message || String(error);
    const is503 = rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE');
    const userFriendlyError = is503
      ? 'This model is currently experiencing temporary high demand. Please tap Retry in a few seconds.'
      : (rawMsg || 'The AI solver encountered an issue. Please tap Retry to try again.');

    res.statusCode = is503 ? 503 : 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: userFriendlyError,
      })
    );
  }
}
