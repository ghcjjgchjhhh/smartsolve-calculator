import { GoogleGenAI } from '@google/genai';

async function generateWithModelFallback(
  ai: GoogleGenAI,
  contents: any[],
  systemInstruction?: string,
  timeoutMs: number = 25000
) {
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const config: any = {
        temperature: 0.7,
      };
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const generatePromise = ai.models.generateContent({
        model,
        contents,
        config,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Timeout: Model ${model} took longer than ${Math.round(timeoutMs / 1000)} seconds`
              )
            ),
          timeoutMs
        )
      );

      const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
      return response;
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      if (i < candidateModels.length - 1) {
        console.warn(
          `[SmartSolve AI] Model ${model} failed (${msg.slice(0, 90)}). Retrying with ${
            candidateModels[i + 1]
          }...`
        );
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

    const { message, history, imageData, mimeType, subject } = body;
    const problemContext = body.problemContext || body.context;

    if (!message && !imageData) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Please provide a message or question.' }));
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
      (headerKey && headerKey.trim() && headerKey !== 'MY_GEMINI_API_KEY' ? headerKey.trim() : '') ||
      serverKey;

    if (!apiKey) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          error: 'AI reasoning engine is temporarily unavailable. Please try again in a few moments.',
        })
      );
    }

    const systemPrompt = `You are SmartSolve AI, an extraordinarily intelligent, warm, and interactive personal STEM tutor for Mathematics, Physics, and Chemistry (covering JAMB/UTME, WAEC/WASSCE, JUPEB, Calculus, and University STEM).

INTERACTIVE REAL-AI TUTOR BEHAVIOR:
1. Speak directly to the student in an energetic, engaging, and genuinely supportive conversational voice (like a 1-on-1 session with a world-class mentor).
2. Never give dry robotic walls of text. Break down concepts into crystal-clear sections with scannable headers, intuitive everyday analogies, and clear step-by-step logic.
3. ALWAYS render all math symbols, formulas, and chemical equations in standard LaTeX notation:
   - Use $...$ for inline math (e.g. $F = ma$, $\\Delta x$, $E_k = \\frac{1}{2}mv^2$, $\\text{H}_2\\text{SO}_4$).
   - Use $$...$$ for display equations and multi-line derivations.
4. When explaining a problem:
   - Explain the physical intuition or mathematical rule behind each step.
   - Highlight speed shortcuts and dimensional analysis checks for exams.
   - Point out common traps, sign mistakes, or unit mismatch errors students frequently make.
5. ALWAYS conclude your response with an interactive checkpoint or encouraging question:
   - For example: "Would you like me to show you an exam shortcut for this, or shall we try a quick similar practice question together?"
   - Keep the student actively engaged like a real AI assistant!
${problemContext ? `\nACTIVE PROBLEM IN FOCUS:\nTopic: ${problemContext.subject || subject || 'General STEM'}\nProblem Statement: "${problemContext.problemStatement || problemContext.title || problemContext.question || ''}"\nFormula: ${problemContext.formula || 'N/A'}\nFinal Answer: ${problemContext.finalAnswer || 'N/A'}\nSteps: ${Array.isArray(problemContext.steps) ? problemContext.steps.join('; ') : ''}` : ''}`;

    const chatContents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-10)) {
        if (!h.content) continue;
        chatContents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        });
      }
    }

    const currentParts: any[] = [];
    if (imageData) {
      const cleanBase64 = imageData.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      currentParts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }
    currentParts.push({ text: message || 'Please analyze this problem and help me understand it.' });
    chatContents.push({ role: 'user', parts: currentParts });

    const ai = new GoogleGenAI({ apiKey });

    let response: any;
    try {
      response = await generateWithModelFallback(ai, chatContents, systemPrompt, 25000);
    } catch (err: any) {
      if (serverKey && serverKey !== apiKey) {
        const fallbackAi = new GoogleGenAI({ apiKey: serverKey });
        response = await generateWithModelFallback(fallbackAi, chatContents, systemPrompt, 25000);
      } else {
        throw err;
      }
    }

    const replyText = response?.text?.trim() || '';

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        success: true,
        reply: replyText,
      })
    );
  } catch (error: any) {
    console.error('API /api/chat error:', error);
    const rawMsg = error?.message || String(error);
    const is503 =
      rawMsg.includes('503') ||
      rawMsg.includes('high demand') ||
      rawMsg.includes('UNAVAILABLE') ||
      rawMsg.includes('Resource has been exhausted');
    const userFriendlyError = is503
      ? 'The AI Tutor model is currently experiencing high demand. Please tap Retry in a few moments.'
      : rawMsg || 'The AI Tutor encountered an issue. Please try again.';

    res.statusCode = is503 ? 503 : 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: userFriendlyError,
      })
    );
  }
}
