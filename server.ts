import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware for iframe and preview support
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize GoogleGenAI SDK server-side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health / Status endpoint
app.get('/api/ai/status', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    models: ['gemini-3.8-flash', 'gemini-3.8-flash-lite'],
  });
});

const SOLUTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'Clear, descriptive title of the problem or concept being solved',
    },
    category: {
      type: Type.STRING,
      description: 'Primary discipline, e.g. Physics, Mathematics, Calculus, Mechanics, Electromagnetism',
    },
    subCategory: {
      type: Type.STRING,
      description: 'Specific topic, e.g. Projectile Motion, Quadratic Equations, Heat Transfer, Electric Circuits, Integration',
    },
    problemStatement: {
      type: Type.STRING,
      description: 'Clean formal restatement of the problem question',
    },
    formula: {
      type: Type.STRING,
      description: 'The fundamental formula, law, theorem, or equation applied',
    },
    rearrangedFormula: {
      type: Type.STRING,
      description: 'The formula rearranged explicitly for the target unknown variable (if applicable)',
    },
    givenValues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          symbol: { type: Type.STRING },
          value: { type: Type.STRING },
          unit: { type: Type.STRING },
        },
        required: ['name', 'symbol', 'value'],
      },
      description: 'List of given quantities and values extracted from the question',
    },
    substitution: {
      type: Type.STRING,
      description: 'Formula with actual numerical values and units plugged in',
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Clear, sequential, verified calculation and algebraic steps leading to the solution',
    },
    finalAnswer: {
      type: Type.STRING,
      description: 'The exact final computed answer with units',
    },
    unit: {
      type: Type.STRING,
      description: 'Measurement unit of the final answer',
    },
    explanation: {
      type: Type.STRING,
      description: 'Brief conceptual explanation of the physical/mathematical principle behind the answer',
    },
    tips: {
      type: Type.STRING,
      description: 'Key exam tip, shortcut, or common misconception to avoid',
    },
  },
  required: [
    'title',
    'category',
    'problemStatement',
    'formula',
    'substitution',
    'steps',
    'finalAnswer',
  ],
};

const SYSTEM_INSTRUCTION = `You are SmartSolve AI, a master Mathematics and Physics professor and world-class STEM problem solver.
Your task is to solve REAL questions with 100% genuine, rigorous, and verified mathematical and physical step-by-step solutions.
Never provide fake, mocked, or placeholder solutions.

Rules for your solution:
1. Accurately identify all given quantities with proper symbols, values, and SI units.
2. Clearly state the governing theoretical formula, law, theorem, or equation (e.g. Newton's laws, kinematic equations, Ohm's law, quadratic formula, integration by parts, Gauss's law, etc.).
3. If necessary, algebraically rearrange the formula for the target unknown variable BEFORE plugging in numbers.
4. Show the explicit numerical substitution step with units attached.
5. Provide detailed, numbered working steps showing intermediate arithmetic operations, algebraic simplifications, and unit conversions (e.g., converting km/h to m/s, cm to m, grams to kg, degrees to radians).
6. Give the exact final answer, properly rounded with standard significant figures, along with the correct unit.
7. Provide a concise, clear conceptual explanation of the physical/mathematical principle behind the answer.
8. Include an expert tip or common exam pitfall to avoid.`;

// Resilient model fallback across modern @google/genai supported models
async function generateWithModelFallback(
  ai: GoogleGenAI,
  contents: any[],
  timeoutMs: number = 25000,
  temperature: number = 0.8,
  useThinking: boolean = false,
  responseMimeType: string = 'application/json'
) {
  // Candidate models: gemini-3.1-flash-lite (fast ~2s), gemini-3.8-flash, gemini-flash-latest
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const config: any = {
        temperature,
      };
      if (responseMimeType) {
        config.responseMimeType = responseMimeType;
      }
      if (useThinking) {
        config.thinkingConfig = {
          thinkingLevel: 'LOW' as any,
        };
      }
      const generatePromise = ai.models.generateContent({
        model,
        contents,
        config,
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
        console.warn(`[SmartSolve Server] Model ${model} failed (${msg.slice(0, 90)}). Retrying with ${candidateModels[i + 1]}...`);
        continue;
      }
    }
  }
  throw lastError;
}

// Shared solver and question generator handler
const handleSolveRequest = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const headerKey = (req.headers['x-gemini-key'] as string) || '';
    const activeApiKey = headerKey.trim() || apiKey;

    if (!activeApiKey) {
      return res.status(503).json({
        error: 'AI reasoning engine is temporarily unavailable. Please try again in a few moments.',
      });
    }

    const activeAi = activeApiKey === apiKey && ai ? ai : new GoogleGenAI({ apiKey: activeApiKey });

    // 1. GENERATE EXAM QUESTIONS (Parallel Batching for 10, 20, or 40 questions)
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
        const randomNonce = `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`;

        const promptText = `
You are SmartSolve AI, an expert examination tutor and university professor for ${exam} in ${subject}.
Target Level / Class: ${level}
Selected Difficulty: ${difficulty}
Topic / Formula / Scope: "${topic}"
Section / Subtopic Focus: ${partFocus}
Batch Nonce (Uniqueness Seed): ${randomNonce}
Number of Questions in this section: Exactly ${batchSize}

CRITICAL RULES:
1. Generate EXACTLY ${batchSize} realistic, distinct multiple-choice questions for ${exam}. Do NOT repeat questions or cliches; ensure this is a FRESH, UNIQUE set of questions on "${topic}".
2. For subjects with math/calculations (Mathematics, Physics, Chemistry, Economics): format all formulas, powers, fractions, and symbols using standard LaTeX notation ($...$, \\frac{a}{b}, \\sqrt{...}, x^2, \\text{₦}).
3. For Literature in English: test literary devices, African prose (e.g. Things Fall Apart), non-African prose, African poetry, drama/Shakespeare, figures of speech (oxymoron, paradox, metaphor, personification), dramatic techniques (soliloquy, aside, dramatic irony).
4. For Economics: test both calculation problems (elasticity, equilibrium price/quantity, marginal/average cost, multiplier, inflation rate) and conceptual analysis (opportunity cost, production possibility curve, market structures, public finance, monetary policy).
5. Every question must have exactly 4 plausible options labeled A, B, C, D with 1 unambiguous correct answer.
6. For calculation questions show given values, formula, substitution, concise steps, and final answer.
7. Keep derivations concise (1-2 lines per step) and clear.

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
          const response = await generateWithModelFallback(activeAi, [{ text: promptText }], 25000, 0.85, false);
          const resultText = response.text?.trim() || '{}';
          let cleanJson = resultText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
          const match = cleanJson.match(/\{[\s\S]*\}/);
          if (match) cleanJson = match[0];
          const parsed = JSON.parse(cleanJson);
          return Array.isArray(parsed.questions) ? parsed.questions : [];
        } catch (err) {
          console.warn(`[SmartSolve Server] Batch ${idx + 1} failed:`, err);
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

      return res.json({
        success: true,
        subject,
        exam,
        level,
        difficulty,
        topic,
        total: formattedQuestions.length,
        questions: formattedQuestions,
      });
    }

    // 2. SOLVE INDIVIDUAL PROBLEM
    const { prompt, imageData, mimeType, subject } = body;
    if (!prompt && !imageData) {
      return res.status(400).json({
        error: 'Please provide a text question or an image containing the math/physics/chemistry problem.',
      });
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
  "intuitiveConcept": "Intuitive plain-English conceptual breakdown with an easy-to-grasp analogy explaining what is actually happening physically or mathematically",
  "detailedDerivation": [
    "1. Rationale for step 1...",
    "2. Rationale for step 2...",
    "3. Algebraic simplification logic..."
  ],
  "alternativeMethod": "Alternative method, verification check, or shortcut to solve or double-check this problem",
  "commonMistakes": "Most frequent student pitfalls, unit conversion traps, or sign errors to avoid",
  "tips": "Pro tip or exam advice for solving this problem"
}
`.trim();

    contents.push({ text: promptText });

    const response = await generateWithModelFallback(activeAi, contents);

    const resultJson = response.text?.trim() || '{}';
    let cleanJson = resultJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    let parsedSolution: any;
    try {
      parsedSolution = JSON.parse(cleanJson);
    } catch {
      throw new Error('AI engine returned an invalid response structure. Please try again.');
    }

    return res.json({
      success: true,
      solution: parsedSolution,
    });
  } catch (error: any) {
    console.error('Gemini solver error:', error);
    const rawMsg = error?.message || String(error);
    const is503 = rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('Resource has been exhausted');
    const userFriendlyError = is503
      ? 'The AI reasoning model is currently experiencing temporary high demand. Please tap Retry in a few moments.'
      : (rawMsg || 'The AI solver encountered an issue. Please tap Retry to try again.');

    return res.status(is503 ? 503 : 500).json({
      error: userFriendlyError,
    });
  }
};

// 3. INTERACTIVE AI TUTOR STEM CHAT
const handleChatRequest = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const { message, history, problemContext, imageData, mimeType, subject } = body;
    if (!message && !imageData) {
      return res.status(400).json({ error: 'Please provide a message or question.' });
    }

    const activeApiKey = (req.headers['x-gemini-key'] as string) || apiKey;
    if (!activeApiKey) {
      return res.status(503).json({ error: 'AI reasoning engine is not configured.' });
    }

    const activeAi = activeApiKey === apiKey && ai ? ai : new GoogleGenAI({ apiKey: activeApiKey });

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

    let systemContext = `You are SmartSolve AI, an expert, extraordinarily patient, and encouraging personal STEM tutor for Mathematics, Physics, and Chemistry (covering JAMB/UTME, WAEC/WASSCE, JUPEB, and University levels).
Your job is to provide clear, thorough, and intuitive explanations.

GUIDELINES:
1. Explain deeply, logically, and intuitively. Use plain-English analogies alongside formal mathematical proofs.
2. Format all mathematical symbols, equations, and chemical formulas using LaTeX notation ($...$ for inline math, $$...$$ for display equations).
3. If the user asks about a specific step in a calculation, explain the exact mathematical operation, the theorem/law justifying it, and why other paths might be harder or invalid.
4. If asked for alternative methods, provide shortcuts, dimensional analysis, or alternative physics laws (e.g. conservation of energy vs equations of motion).
5. If asked to generate a practice problem, give a similar high-yield problem and offer to check their answer.
6. Keep tone respectful, encouraging, and pedagogically sound.`;

    if (problemContext) {
      systemContext += `\n\nCURRENT PROBLEM CONTEXT BEING DISCUSSED:
Subject: ${problemContext.subject || subject || 'General STEM'}
Question: "${problemContext.problemStatement || problemContext.question || ''}"
Formula: ${problemContext.formula || 'N/A'}
Final Answer: ${problemContext.finalAnswer || 'N/A'}
Working Steps:
${Array.isArray(problemContext.steps) ? problemContext.steps.join('\n') : ''}`;
    }

    let formattedChatPrompt = `${systemContext}\n\n`;
    if (Array.isArray(history) && history.length > 0) {
      formattedChatPrompt += `CONVERSATION HISTORY:\n`;
      history.slice(-8).forEach((h: any) => {
        formattedChatPrompt += `${h.role === 'user' ? 'Student' : 'SmartSolve Tutor'}: ${h.content}\n`;
      });
      formattedChatPrompt += `\n`;
    }
    formattedChatPrompt += `Student's Question: ${message || 'Please explain the attached problem.'}\n\nSmartSolve Tutor Response:`;

    contents.push({ text: formattedChatPrompt });

    const response = await generateWithModelFallback(activeAi, contents, 25000, 0.7, false, 'text/plain');
    const replyText = response.text?.trim() || '';

    return res.json({
      success: true,
      reply: replyText,
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    const rawMsg = error?.message || String(error);
    const is503 = rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('Resource has been exhausted');
    const userFriendlyError = is503
      ? 'The AI Tutor model is currently experiencing high demand. Please tap Retry in a few moments.'
      : (rawMsg || 'The AI Tutor encountered an issue. Please try again.');

    return res.status(is503 ? 503 : 500).json({
      error: userFriendlyError,
    });
  }
};

app.post('/api/solve', handleSolveRequest);
app.post('/api/ai/solve', handleSolveRequest);
app.post('/api/chat', handleChatRequest);
app.post('/api/ai/chat', handleChatRequest);

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartSolve server running on port ${PORT} (Prod: ${isProd})`);
  });
}

startServer();
