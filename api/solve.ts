import { GoogleGenAI } from '@google/genai';

async function generateWithModelFallback(
  ai: GoogleGenAI,
  contents: any[],
  timeoutMs: number = 22000,
  requireValidJson: boolean = false
) {
  // Candidate models: prioritize gemini-3.1-flash-lite for instant speed, fallback to gemini-3.8-flash
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const config: any = {
        responseMimeType: 'application/json',
      };
      if (model === 'gemini-3.8-flash') {
        config.thinkingConfig = { thinkingLevel: 'LOW' };
      } else if (model === 'gemini-3.1-flash-lite') {
        config.thinkingConfig = { thinkingLevel: 'MINIMAL' };
      }

      const generatePromise = ai.models.generateContent({
        model,
        contents,
        config,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: Model ${model} took longer than ${Math.round(timeoutMs / 1000)} seconds`)), timeoutMs)
      );

      const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
      if (requireValidJson) {
        const resultText = response.text?.trim() || '{}';
        let cleanJson = resultText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const match = cleanJson.match(/\{[\s\S]*\}/);
        if (match) cleanJson = match[0];
        JSON.parse(cleanJson);
      }
      return response;
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      if (i < candidateModels.length - 1) {
        console.warn(`[SmartSolve AI] Model ${model} failed (${msg.slice(0, 90)}). Retrying with ${candidateModels[i + 1]}...`);
        await new Promise((r) => setTimeout(r, 650));
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

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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
Solve this ${subject || 'Mathematics, Physics or Chemistry'} problem with crystal-clear, textbook-grade step-by-step reasoning matching official WAEC, Cambridge, and textbook marking schemes.

CRITICAL SOLVER BEHAVIOUR & PRESENTATION RULES:
1. MULTI-PART QUESTION STRUCTURING (MANDATORY):
   If the question asks for multiple items (e.g. Part 1, 2, 3, 4 or (a), (b), (c), (i), (ii)):
   - Clearly delineate each sub-problem using an explicit section header in "steps", e.g. "Part 1: The Acceleration of the Car", "Part 2: The Total Distance Travelled", etc.
   - For EACH sub-problem, provide:
     a) Governing formula or graphical property in LaTeX display mode ($$...$$).
     b) Direct numerical substitution showing actual numbers with SI units plugged in ($$...$$).
     c) Intermediate arithmetic reduction steps (never jump directly to answer).
     d) Intermediate result with proper units.
2. VERIFIED ARITHMETIC & DIMENSIONAL CONSISTENCY:
   - Double check all calculations: addition, subtraction, fractions, square roots, and powers.
   - Standard SI units must accompany every numerical value (e.g. m/s, m/s^2, N, J, kg, mol/dm^3).
3. GRAPH-BASED PROBLEMS (MOTION, WAVES, CALCULUS, OR OPTICS):
   - Explicitly relate the working to the graph features (e.g. "From the velocity-time graph, acceleration is the gradient of line OA:", "Total distance is the area of trapezium OABC under the v-t graph:", "Deceleration is the negative slope of line BC:").
4. MULTIPLE-CHOICE QUESTIONS:
   - If multiple-choice options (A, B, C, D) are given in the problem, explicitly identify the correct letter and state why that option is correct.
5. FINAL ANSWER BOXING (STRICT LATEX):
   - The "finalAnswer" field MUST be formatted with \\boxed{...}.
   - All text words and units inside math mode must be properly wrapped in \\text{...} (e.g. \\text{deceleration} = 3\\text{ m/s}^2, v_{\\text{avg}} = 22.5\\text{ m/s}).
   - For multi-part answers, combine all answers cleanly separated by ",\\quad ":
     e.g. "\\boxed{a = 3\\text{ m/s}^2,\\quad s = 900\\text{ m},\\quad \\text{deceleration} = 3\\text{ m/s}^2,\\quad v_{\\text{avg}} = 22.5\\text{ m/s}}"
   - Ensure all braces are closed and never produce trailing or truncated macros like \\tex.

Problem to solve: "${prompt || 'Solve the question shown in the image.'}"

You MUST respond with a valid JSON object with EXACTLY this structure:
{
  "title": "Descriptive title of the problem (e.g. Uniform Acceleration & Velocity-Time Graph Analysis)",
  "category": "${subject || 'Science'}",
  "subCategory": "Topic name (e.g. Kinematics, Dynamics, Calculus, Stoichiometry)",
  "problemStatement": "Clear, complete restatement of the question with LaTeX notation",
  "formula": "Primary governing formula or law in LaTeX",
  "rearrangedFormula": "Formula rearranged for target unknown in LaTeX (if applicable)",
  "whatIsRequired": "Summary of required quantities with symbols and units",
  "givenValues": [
    { "name": "Initial velocity", "symbol": "u", "value": "0", "unit": "m/s" },
    { "name": "Maximum velocity", "symbol": "v", "value": "30", "unit": "m/s" }
  ],
  "substitution": "Formula with numbers and SI units plugged in LaTeX",
  "steps": [
    "Part 1: The Acceleration of the Car",
    "Formula for acceleration from velocity-time graph (gradient):",
    "$$a = \\frac{v - u}{t}$$",
    "Substituting the given values ($u = 0\\text{ m/s}$, $v = 30\\text{ m/s}$, $t = 10\\text{ s}$):",
    "$$a = \\frac{30\\text{ m/s} - 0\\text{ m/s}}{10\\text{ s}} = \\frac{30}{10} = 3\\text{ m/s}^2$$",
    "Part 2: The Total Distance Travelled",
    "Total distance is the total area under the velocity-time graph (area of trapezium):",
    "$$s = \\frac{1}{2}(a + b)h$$",
    "Where parallel sides are $a = 20\\text{ s}$ (constant velocity duration), $b = 40\\text{ s}$ (total time), and height $h = 30\\text{ m/s}$:",
    "$$s = \\frac{1}{2}(20\\text{ s} + 40\\text{ s}) \\times 30\\text{ m/s} = \\frac{1}{2}(60) \\times 30 = 30 \\times 30 = 900\\text{ m}$$"
  ],
  "finalAnswer": "\\boxed{a = 3\\text{ m/s}^2,\\quad s = 900\\text{ m},\\quad \\text{deceleration} = 3\\text{ m/s}^2,\\quad v_{\\text{avg}} = 22.5\\text{ m/s}}",
  "unit": "SI unit",
  "explanation": "Clear educational explanation of the physical or mathematical principles demonstrated",
  "tips": "Practical exam tip or common pitfall to avoid"
}
`.trim();

    contents.push({ text: promptText });

    const response = await generateWithModelFallback(ai, contents, 22000, true);

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
