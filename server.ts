import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { detectAndGenerateDiagram } from './src/services/aiDiagramDetector';
import { detectAndEnhanceGraphs } from './src/services/aiGraphDetector';
import whiteboardHandler from './api/whiteboard';
import voiceMathHandler from './api/voice-math';
import handwritingHandler from './api/handwriting';
import socraticHandler from './api/socratic';
import researchHandler from './api/research';
import documentTutorHandler from './api/document-tutor';
import learnHandler from './api/learn';
import transcribeHandler from './api/transcribe';
import authHandler from './api/auth';
import userDataHandler from './api/user-data';
import studyRoomsHandler from './api/study-rooms';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.set('trust proxy', 1);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware for iframe, credentials cookies, and preview support
app.use((req, res, next) => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-gemini-key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize GoogleGenAI SDK server-side
const apiKey =
  [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_GENAI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GEMINI_KEY,
    process.env.GENAI_API_KEY,
    process.env.VITE_GEMINI_API_KEY,
    process.env.VITE_GOOGLE_API_KEY,
    process.env.API_KEY,
  ]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .find((v) => v && v !== 'MY_GEMINI_API_KEY' && v !== 'YOUR_GEMINI_API_KEY' && v.length >= 16) || '';
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
    hasApiKey: Boolean(apiKey),
    models: ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'],
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

function repairAndParseJson(rawText: string | undefined): any {
  let txt = (rawText || '{}')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const match = txt.match(/\{[\s\S]*\}/);
  if (match) txt = match[0];
  try {
    return JSON.parse(txt);
  } catch {
    return JSON.parse(
      txt
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
    );
  }
}

// Resilient model fallback across modern @google/genai supported models
async function generateWithModelFallback(
  ai: GoogleGenAI,
  contents: any[],
  timeoutMs: number = 30000,
  temperature?: number,
  useThinking: boolean = false,
  responseMimeType?: string,
  systemInstruction?: string
) {
  // Prioritize gemini-3.1-flash-lite for fast response, fallback to gemini-4-hydrogen
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const config: any = {};
      if (responseMimeType) {
        config.responseMimeType = responseMimeType;
      }
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      if (model === 'gemini-3.1-flash-lite') {
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.MINIMAL,
        };
        if (typeof temperature === 'number') {
          config.temperature = temperature;
        }
      } else if (model === 'gemini-4-hydrogen') {
        config.thinkingConfig = {
          thinkingLevel: useThinking ? ThinkingLevel.MEDIUM : ThinkingLevel.LOW,
        };
      }

      const generatePromise = ai.models.generateContent({
        model,
        contents,
        config,
      });

      const perModelTimeout = timeoutMs;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(`Timeout: Model ${model} took longer than ${Math.round(perModelTimeout / 1000)} seconds`)
            ),
          perModelTimeout
        )
      );

      const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
      if (responseMimeType === 'application/json') {
        repairAndParseJson(response.text);
      }
      return response;
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      if (i < candidateModels.length - 1) {
        console.warn(`[SmartSolve Server] Model ${model} failed (${msg.slice(0, 90)}). Retrying with ${candidateModels[i + 1]}...`);
        await new Promise((r) => setTimeout(r, 650));
        continue;
      }
    }
  }
  throw lastError;
}

// Resilient client resolver that ensures smooth fallback between client key and server environment key
function getGenAIClient(headerKey?: string): { activeAi: GoogleGenAI; isCustomKey: boolean } {
  const cleanHeader = (headerKey || '').trim();
  if (cleanHeader && cleanHeader !== 'MY_GEMINI_API_KEY' && cleanHeader.length > 15) {
    try {
      return {
        activeAi: new GoogleGenAI({
          apiKey: cleanHeader,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        }),
        isCustomKey: true,
      };
    } catch {
      // ignore bad format and fall back to server key
    }
  }
  if (ai) {
    return { activeAi: ai, isCustomKey: false };
  }
  if (apiKey) {
    return {
      activeAi: new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      }),
      isCustomKey: false,
    };
  }
  throw new Error('AI reasoning engine is temporarily unavailable. Please try again in a few moments.');
}

// Shared solver and question generator handler
const handleSolveRequest = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const headerKey = (req.headers['x-gemini-key'] as string) || '';
    const { activeAi, isCustomKey } = getGenAIClient(headerKey);

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
          const response = await generateWithModelFallback(activeAi, [{ text: promptText }], 25000, 0.85, false, 'application/json');
          const parsed = repairAndParseJson(response.text);
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

    const solveLanguage = body.preferredLanguage || body.language || 'English';

    const promptText = `
You are SmartSolve AI, an expert examination tutor and university professor for Mathematics, Physics, and Chemistry.
Solve this ${subject || 'Mathematics, Physics or Chemistry'} problem with crystal-clear, textbook-grade step-by-step reasoning.

CRITICAL LANGUAGE REQUIREMENT:
The user's preferred language is "${solveLanguage}".
Write the title, problem statement restatement, step descriptions, explanation, intuitiveConcept, and tips completely and naturally in ${solveLanguage}! (Keep mathematical variables, chemical equations, standard formulas, and SI units in standard scientific notation).

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

GRAPH & DIAGRAM STRICTNESS (CRITICAL):
- NEVER draw or invent random diagrams or placeholder graphs for algebra, arithmetic, symbolic calculus (unless plotting is explicitly requested), stoichiometry, chemistry, gas laws, or conceptual questions.
- For non-visual problems, strictly return "graphs": [] and "diagram": null.
- ONLY populate "graphs" when the question explicitly asks to plot/sketch/draw a graph, or involves a motion-time graph (velocity-time, displacement-time, acceleration-time), 2D projectile trajectory, or SHM oscillator curve:
  1. Formulate 100% accurate equations for the graph lines/curves (never fabricate unrelated curves).
  2. In "featuresExplanation", state gradient/slope (dy/dx) and area under the curve meanings.
  3. In "simulation", configure 'motion_1d', 'projectile_2d', 'shm_oscillator', 'wave_propagation', or 'curve_tracing'.
  4. If essential graph data is missing, populate "missingInformation".
- Keep "diagram": null unless the question physically/geometrically involves forces (free-body diagram), an inclined plane, levers/moments, electric circuits, ray optics, circle theorems, bearings, triangles, or transverse wave anatomy.

Problem: "${prompt || 'Solve the question shown in the image.'}"

STYLING & NOTATION RULES:
1. Format all formulas, equations, fractions, square roots, exponents, and chemical symbols using clean standard LaTeX notation (e.g. \\frac{a}{b}, \\sqrt{...}, x^2, \\pm, \\text{CuSO}_4, \\Delta H).
2. CRITICAL LATEX SYNTAX: In LaTeX formulas, NEVER use raw '%' because '%' acts as a comment delimiter in TeX! Always escape percent signs as '\\%' (e.g. 100\\%, 82.9\\%, \\% \\text{Yield} = ...). Always ensure matching brackets (\\left( matched with \\right)).
3. In "steps", present a clear, textbook-grade student notebook solution of 4 to 7 well-arranged core steps (never generate 15+ fragmented micro-steps).
4. In "finalAnswer", format the answer cleanly with \\boxed{...} (e.g. "\\boxed{\\text{Option B: } x = 4}" or "\\boxed{E_k = 392\\text{ J}}" or "\\boxed{m = 1.97\\text{ g}}").
5. SPEED & CONCISENESS: Deliver direct, high-yield mathematical and scientific solutions promptly without excessive verbosity, filler essays, or redundant repetition. Keep derivations concise and punchy.

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
  "tips": "Pro tip or exam advice for solving this problem",
  "graphs": [],
  "diagram": null,
  "graphExplanation": "",
  "missingInformation": ""
}
`.trim();

    contents.push({ text: promptText });

    const response = await generateWithModelFallback(
      activeAi,
      contents,
      45000,
      undefined,
      false,
      'application/json'
    );

    let parsedSolution: any;
    try {
      parsedSolution = repairAndParseJson(response.text);
    } catch {
      throw new Error('AI engine returned an invalid response structure. Please try again.');
    }

    const validatedGraphs = detectAndEnhanceGraphs(parsedSolution, prompt);
    parsedSolution.graphs = validatedGraphs && validatedGraphs.length > 0 ? validatedGraphs : [];

    const diag = detectAndGenerateDiagram(parsedSolution, prompt);
    if (diag && parsedSolution.graphs.length === 0) {
      parsedSolution.diagram = diag;
    } else {
      delete parsedSolution.diagram;
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

// 3. INTERACTIVE AI TUTOR & MULTIMODAL CHAT ASSISTANT
const handleChatRequest = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const {
      message,
      history,
      imageData,
      mimeType,
      audioData,
      audioMimeType,
      attachments,
      subject,
    } = body;
    const problemContext = body.problemContext || body.context;
    const preferredLanguage = body.preferredLanguage || body.language || 'English (Nigerian)';
    const preferredGender = body.preferredGender || body.gender || 'female';
    const persona = body.persona || body.voicePersona || (preferredGender === 'female' ? 'Breeze' : 'Cove');
    const shouldStream = req.query.stream === 'true' || body.stream === true;

    if (!message && !imageData && !audioData && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Please provide a message, question, image, or audio recording.' });
    }

    const headerKey = (req.headers['x-gemini-key'] as string) || '';
    const { activeAi, isCustomKey } = getGenAIClient(headerKey);

    const isCustomNonEnglish =
      preferredLanguage &&
      !preferredLanguage.toLowerCase().startsWith('english');

    const systemPrompt = `You are a brilliant, warm, and crystal-clear AI tutor and conversational assistant—explaining ideas with the clarity, structure, and natural flow of ChatGPT.

CONVERSATION & TONE:
- Be natural, friendly, direct, and helpful. Never introduce yourself, never state your title or capabilities, and never say "As an AI...".
- Match length to the prompt: reply to casual greetings (like "Hi" or "Hey") in one short, warm sentence; give clear, thorough walkthroughs for academic, technical, or multi-step questions.
${isCustomNonEnglish ? `- LANGUAGE: Conduct the entire conversation and explanation fluently in ${preferredLanguage}, while keeping mathematical formulas in standard LaTeX ($...$ and $$...$$).` : '- Use clear, natural standard English (unless the user explicitly writes in or requests another language or Pidgin).'}

CHATGPT-STYLE STRUCTURE & SPACING (CRITICAL):
- NEVER write a dense wall of text. Always leave clear blank lines between paragraphs, headings, lists, steps, and equation blocks so every explanation breathes cleanly.
- Lead with a crisp, intuitive summary or direct answer in 1–2 sentences.
- Break explanations down using clear section headings (### ...), short paragraphs, and bullet points with **bold lead-ins** (e.g., - **Force ($F$):** ...).
- For math, physics, chemistry, and multi-step problems:
  - Separate each stage with a blank line (**Step 1: ...**, **Step 2: ...**).
  - Put key formulas and calculations in standalone display blocks ($$...$$) on their own lines with a blank line above and below.
  - Use inline LaTeX ($...$) for variables and symbols inside sentences.
- For coding questions, use labeled fenced code blocks (\`\`\`python, \`\`\`typescript, etc.) with brief, well-spaced explanations before and after.
- For comparisons, use clean Markdown tables.

MULTIMODAL AUDIO & IMAGE UNDERSTANDING:
- Listen closely to voice notes across all accents (including Nigerian/West African English). Briefly note what was heard (e.g., 🎙️ *Heard:* "...") on its own line, leave a blank line, and write out the complete, well-spaced explanation and all equations in full text.
- Inspect uploaded photos, handwritten notes, diagrams, and equations carefully and walk through the solution clearly step by step.
${problemContext ? `\nACTIVE PROBLEM IN FOCUS:\nTopic: ${problemContext.subject || subject || 'General STEM'}\nProblem Statement: "${problemContext.problemStatement || problemContext.title || problemContext.question || ''}"\nFormula: ${problemContext.formula || 'N/A'}\nFinal Answer: ${problemContext.finalAnswer || 'N/A'}` : ''}`;

    const chatContents: any[] = [];

    // Reconstruct recent conversation history (prune old heavy base64 to keep payload lightweight and fast)
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-6)) {
        if (!h.content && (!h.attachments || h.attachments.length === 0)) continue;
        const parts: any[] = [];

        // For previous turns, do not re-upload massive duplicate image binaries
        if (Array.isArray(h.attachments)) {
          for (const att of h.attachments) {
            if (att.name) {
              parts.push({ text: `[Attached: ${att.name}]` });
            }
          }
        }

        if (h.content) {
          parts.push({ text: h.content });
        }

        if (parts.length > 0) {
          chatContents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts,
          });
        }
      }
    }

    const currentParts: any[] = [];
    const addedHashes = new Set<string>();

    const appendInlinePart = (dataStr: string, rawMime?: string) => {
      if (!dataStr) return;
      const cleanData = dataStr.includes(';base64,')
        ? dataStr.split(';base64,')[1]
        : dataStr;
      if (!cleanData || addedHashes.has(cleanData)) return;
      addedHashes.add(cleanData);

      let mime = (rawMime || 'image/jpeg').trim();
      if (mime.includes(';')) mime = mime.split(';')[0].trim();

      currentParts.push({
        inlineData: {
          mimeType: mime,
          data: cleanData,
        },
      });
    };

    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.data) appendInlinePart(att.data, att.mimeType);
      }
    }
    if (imageData) appendInlinePart(imageData, mimeType || 'image/jpeg');
    if (audioData) appendInlinePart(audioData, audioMimeType || 'audio/webm');

    // Text content
    let textPrompt = message || '';
    if (!textPrompt && audioData) {
      textPrompt = `Listen to this voice note, briefly note what was asked, and write out a clear, well-spaced, step-by-step explanation${isCustomNonEnglish ? ` in ${preferredLanguage}` : ''}.`;
    } else if (!textPrompt && imageData) {
      textPrompt = `Inspect this image and provide a clear, well-spaced, step-by-step explanation${isCustomNonEnglish ? ` in ${preferredLanguage}` : ''}.`;
    }

    if (isCustomNonEnglish && textPrompt) {
      textPrompt += `\n\n[Respond in ${preferredLanguage}]`;
    }

    if (textPrompt) {
      currentParts.push({ text: textPrompt });
    }

    chatContents.push({ role: 'user', parts: currentParts });

    // Handle streaming request
    if (shouldStream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Prevent proxy buffering for immediate token arrival
      if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
      }
      // Prime stream immediately so proxies open the pipe without waiting
      res.write(': connected\n\n');

      try {
        const streamClient = activeAi;
        const candidateModels = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
        let streamSuccess = false;

        for (const model of candidateModels) {
          const reqStart = Date.now();
          let firstChunkLogged = false;
          try {
            const streamConfig: any = {
              systemInstruction: systemPrompt,
            };
            if (model === 'gemini-3.1-flash-lite') {
              streamConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
              streamConfig.temperature = 0.7;
            } else if (model === 'gemini-4-hydrogen') {
              streamConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
            }

            // Race initial stream handshake so a stalled model fails over promptly
            const stream = (await Promise.race([
              streamClient.models.generateContentStream({
                model,
                contents: chatContents,
                config: streamConfig,
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Stream handshake timeout on ${model}`)), 8000)
              ),
            ])) as AsyncIterable<any>;

            for await (const chunk of stream) {
              const text = chunk.text || '';
              if (text) {
                if (!firstChunkLogged) {
                  firstChunkLogged = true;
                  const ttft = Date.now() - reqStart;
                  console.log(`[Chat Stream] ${model} TTFT: ${ttft}ms`);
                }
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
                if (typeof (res as any).flush === 'function') {
                  (res as any).flush();
                }
              }
            }
            streamSuccess = true;
            break;
          } catch (modelErr: any) {
            const errMs = Date.now() - reqStart;
            const errMsg = String(modelErr?.message || modelErr).slice(0, 120).replace(/[\r\n]+/g, ' ');
            console.warn(`[SmartSolve Streaming] Model ${model} stream error (${errMs}ms):`, errMsg);
            // If partial text was already flushed to client, do not restart with a second model
            if (firstChunkLogged) {
              streamSuccess = true;
              break;
            }
          }
        }

        if (!streamSuccess) {
          // Fallback to non-streaming inside the stream
          const resNonStream = await generateWithModelFallback(activeAi, chatContents, 15000, 0.7, false, undefined, systemPrompt);
          const fullText = resNonStream?.text?.trim() || '';
          res.write(`data: ${JSON.stringify({ text: fullText })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        return res.end();
      } catch (streamErr: any) {
        console.error('[SmartSolve Streaming] Critical error:', streamErr);
        res.write(`data: ${JSON.stringify({ error: streamErr.message || 'Stream error occurred' })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
    }

    // Non-streaming response
    let response: any;
    try {
      response = await generateWithModelFallback(activeAi, chatContents, 25000, 0.75, false, undefined, systemPrompt);
    } catch (primaryErr: any) {
      if (isCustomKey && ai) {
        console.warn('[SmartSolve Server] Client custom key failed, falling back to server default GEMINI_API_KEY...');
        response = await generateWithModelFallback(ai, chatContents, 25000, 0.75, false, undefined, systemPrompt);
      } else {
        throw primaryErr;
      }
    }

    const replyText = response?.text?.trim() || '';

    return res.json({
      success: true,
      reply: replyText,
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    const rawMsg = error?.message || String(error);
    const is503 = rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('Resource has been exhausted');
    const userFriendlyError = is503
      ? 'The AI Assistant model is currently experiencing high demand. Please tap Retry in a few moments.'
      : (rawMsg || 'The AI Assistant encountered an issue. Please try again.');

    return res.status(is503 ? 503 : 500).json({
      error: userFriendlyError,
    });
  }
};

app.post('/api/solve', handleSolveRequest);
app.post('/api/ai/solve', handleSolveRequest);
app.post('/api/chat', handleChatRequest);
app.post('/api/ai/chat', handleChatRequest);

// 4. LEARN ANY TOPIC ENGINE & INTERACTIVE ACADEMIC TUTOR (Unified with Vercel /api/learn handlers)
app.post('/api/learn', (req, res) => learnHandler(req, res));
app.post('/api/ai/learn', (req, res) => learnHandler(req, res));
app.post('/api/learn/follow-up', (req, res) => {
  req.body = { ...(req.body || {}), action: 'follow_up' };
  return learnHandler(req, res);
});
app.post('/api/learn/formula-questions', (req, res) => {
  req.body = { ...(req.body || {}), action: 'formula_questions' };
  return learnHandler(req, res);
});

// 5. NEW ADVANCED PLATFORM ROUTES (Whiteboard, Voice Math, Handwriting, Socratic, Research, Document Tutor)
app.post('/api/whiteboard', (req, res) => whiteboardHandler(req, res));
app.post('/api/voice-math', (req, res) => voiceMathHandler(req, res));
app.post('/api/handwriting', (req, res) => handwritingHandler(req, res));
app.post('/api/socratic', (req, res) => socraticHandler(req, res));
app.post('/api/research', (req, res) => researchHandler(req, res));
app.post('/api/document-tutor', (req, res) => documentTutorHandler(req, res));
app.post('/api/transcribe', (req, res) => transcribeHandler(req, res));
app.post('/api/ai/transcribe', (req, res) => transcribeHandler(req, res));

// 6. AUTH.JS GOOGLE OAUTH & PROTECTED USER WORKSPACE / STUDY ROOM ROUTES
app.all('/api/auth', (req, res) => authHandler(req, res));
app.all('/api/auth/*', (req, res) => authHandler(req, res));
app.all('/api/user-data', (req, res) => userDataHandler(req, res));
app.all('/api/study-rooms', (req, res) => studyRoomsHandler(req, res));

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
