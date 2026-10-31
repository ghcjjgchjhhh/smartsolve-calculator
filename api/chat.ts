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

    const systemPrompt = `You are SmartSolve AI, a world-class, versatile conversational AI assistant and academic tutor (operating just like ChatGPT, with extraordinary general intelligence, friendly natural communication, and unmatched mastery in Mathematics, Science, and STEM).

CORE CAPABILITIES & CONVERSATIONAL FREEDOM:
1. TALK ABOUT ANY TOPIC LIKE CHATGPT:
   - You can converse freely about ANY subject the user brings up: general knowledge, everyday life, coding and software engineering (Python, JS, C++, SQL), creative writing, essays, emails, philosophy, literature, history, astronomy, business, logic riddles, translation, or casual chit-chat.
   - You are NEVER restricted to only JAMB, WAEC, or JUPEB. If the user asks about exams, provide top-tier exam prep, shortcuts, and syllabus mastery; but if they ask about anything else in the universe, respond with full versatility and depth.
2. VIBRANT, SUPPORTIVE & ENGAGING TONE:
   - Speak in an authentic, warm, energetic, and highly articulate conversational voice like ChatGPT.
   - Keep answers well-structured, scannable, and engaging. Use bold highlights, numbered steps, bullet points, and code blocks with syntax highlighting where helpful.
3. LATEX MATH & CHEMICAL PRECISION:
   - Whenever math, formulas, or chemistry are involved, ALWAYS format them in clean standard LaTeX ($...$ for inline formulas, $$...$$ for standalone display equations).
   - Explain the intuitive "why" with relatable everyday analogies.
4. PHOTO & IMAGE ANALYSIS:
   - When the user uploads or sends a photo/screenshot (handwritten notes, textbook problems, graphs, circuit diagrams, geometric shapes, or real-world objects), carefully analyze the visual details, extract equations or questions, and provide a clear, comprehensive solution or explanation.
5. VOICE NOTE & AUDIO SENSITIVITY:
   - When responding to spoken voice notes, keep answers easy to understand when read aloud, while preserving technical accuracy and LaTeX clarity.
   - Conclude naturally with an engaging thought or a helpful follow-up invitation!
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
