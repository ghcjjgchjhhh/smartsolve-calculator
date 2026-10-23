import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        'GEMINI_API_KEY is not configured in Vercel Environment Variables. Please go to your Vercel Project Settings > Environment Variables, add GEMINI_API_KEY, and redeploy.',
    });
  }

  try {
    const { prompt, imageData, mimeType, subject } = req.body || {};

    if (!prompt && !imageData) {
      return res.status(400).json({ error: 'Please provide a math or physics question.' });
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

    contents.push({
      text: prompt || 'Solve the mathematics or physics problem shown in the image with complete step-by-step working.',
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
          description: 'Primary discipline, e.g. Physics, Mathematics, Calculus, Mechanics',
        },
        subCategory: {
          type: Type.STRING,
          description: 'Specific topic, e.g. Projectile Motion, Quadratic Equations, Integration',
        },
        problemStatement: {
          type: Type.STRING,
          description: 'Clean formal restatement of the problem question',
        },
        formula: {
          type: Type.STRING,
          description: 'The fundamental theoretical formula, law, theorem, or equation applied',
        },
        rearrangedFormula: {
          type: Type.STRING,
          description: 'Algebraic formula rearranged for target unknown',
        },
        substitution: {
          type: Type.STRING,
          description: 'Formula with specific values and SI units substituted',
        },
        steps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Step-by-step intermediate calculation working',
        },
        finalAnswer: {
          type: Type.STRING,
          description: 'Exact final computed answer with SI units',
        },
        unit: {
          type: Type.STRING,
          description: 'SI unit of the final result',
        },
        explanation: {
          type: Type.STRING,
          description: 'Clear conceptual explanation of why this physical or mathematical law applies',
        },
        tips: {
          type: Type.STRING,
          description: 'Pro exam tips or common pitfalls to avoid for this type of problem',
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

    const SYSTEM_INSTRUCTION = `You are SmartSolve AI, a master Mathematics and Physics professor.
Solve real-world STEM problems with 100% genuine, verified step-by-step solutions:
1. Identify all given quantities with symbols, values, and SI units.
2. State the governing theoretical formula or law before solving.
3. Show formula algebraic rearrangement for target variable if needed.
4. Show numerical substitution with units.
5. Provide numbered steps with intermediate arithmetic and units.
6. State the final answer with correct units.
7. Provide a concise explanation and practical tip.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION}\nContext subject: ${subject || 'Mathematics and Physics'}.`,
        responseMimeType: 'application/json',
        responseSchema: SOLUTION_SCHEMA,
      },
    });

    const resultText = response.text?.trim() || '{}';
    let cleanJson = resultText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const match = cleanJson.match(/\{[\s\S]*\}/);
    if (match) cleanJson = match[0];

    const parsedSolution = JSON.parse(cleanJson);
    return res.status(200).json({ success: true, solution: parsedSolution });
  } catch (error: any) {
    console.error('Vercel Gemini solver error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to solve question using Gemini AI on Vercel.',
    });
  }
}
