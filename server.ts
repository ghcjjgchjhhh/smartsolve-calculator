import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

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
    models: ['gemini-3.8-flash', 'gemini-3.1-flash-lite'],
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

// Gemini AI Real Problem Solver Endpoint
app.post('/api/ai/solve', async (req: Request, res: Response) => {
  try {
    const { prompt, imageData, mimeType, subject } = req.body;

    if (!prompt && !imageData) {
      return res.status(400).json({
        error: 'Please provide a text question or an image containing the math/physics problem.',
      });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please check your GEMINI_API_KEY environment variable.',
      });
    }

    const contents: any[] = [];

    // Attach image if provided (photo of math/physics problem from textbook or homework)
    if (imageData) {
      const cleanBase64 = imageData.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const userPrompt = prompt || 'Solve the mathematics or physics problem shown in the image with complete step-by-step working.';
    contents.push({ text: userPrompt });

    // Primary fast model (gemini-3.1-flash-lite) with fallbacks and retry
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let lastError: any = null;
    let resultJson = '';

    for (const model of modelsToTry) {
      // Up to 2 attempts per model to smooth out transient 503 spikes
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, 600));
          }

          const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: `${SYSTEM_INSTRUCTION}\nContext subject: ${subject || 'Mathematics and Physics'}.`,
              responseMimeType: 'application/json',
              responseSchema: SOLUTION_SCHEMA,
            },
          });

          if (response.text) {
            resultJson = response.text.trim();
            break;
          }
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || '';
          console.warn(`Model ${model} attempt ${attempt + 1} failed (${status}):`, err.message || err);
          // If not a transient error (e.g. 400 bad prompt), do not retry
          if (status === 400 || status === 'INVALID_ARGUMENT') {
            break;
          }
        }
      }

      if (resultJson) {
        break;
      }
    }

    if (!resultJson) {
      throw lastError || new Error('No response generated from Gemini AI models.');
    }

    let cleanJson = resultJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    const parsedSolution = JSON.parse(cleanJson);

    return res.json({
      success: true,
      solution: parsedSolution,
    });
  } catch (error: any) {
    console.error('Gemini solver error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to solve question using Gemini AI.',
    });
  }
});

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
