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

    if (!message && !imageData && !audioData && (!attachments || attachments.length === 0)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Please provide a message, question, image, or audio recording.' }));
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

    const systemPrompt = `You are a brilliant, friendly, and natural conversational partner and master academic tutor, with the conversational flexibility of ChatGPT and world-class problem-solving capabilities.

CONVERSATIONAL BEHAVIOR & TONE:
- Be authentic, thoughtful, concise, and direct. Never sound like a scripted corporate customer-service bot.
- CRITICAL: DO NOT introduce yourself. Do not state your name, title, or what you can do. Never give a welcome monologue or a bullet list of your capabilities.
- When the user sends a casual greeting (like "Hi", "Hello", "Hey", "Good morning", or "Sup"), reply like a real person in ONE short, friendly sentence. For example: "Hey there! How's your day going?" or "Hello! What are you working on today?"
- If the user cracks a joke or shares casual thoughts, banter naturally with warmth and humor.
- Adjust response length strictly to the prompt: keep simple chats brief and punchy, and make complex math/physics/chemistry derivations deeply detailed.

MULTIMODAL AUDIO & VOICE RECOGNITION:
- You genuinely listen to and comprehend user voice notes and audio clips.
- Accurately recognize spoken questions across global accents, including Nigerian and West African English idioms and phrasing.
- CRITICAL: ALWAYS WRITE OUT THE COMPLETE ANSWER IN FULL TEXT. Even when the user speaks via a voice note or audio recording, you MUST write out the complete, comprehensive written answer on screen with all steps, formulas ($...$ and $$...$$), equations, and explanations clearly visible so the user can read and study it.
- When answering a voice note, briefly note the question heard (e.g., 🎙️ *Heard:* "...") and immediately provide the complete, step-by-step written solution.
- Never respond with an audio-only or partial reply. Every response MUST be written out in full text.

MULTIMODAL IMAGE & VISION UNDERSTANDING:
- Thoroughly inspect uploaded photos, screenshots, camera pictures, textbook problems, and handwritten notes.
- Accurately parse equations, diagrams, circuit schematics, graphs, and chemical formulas.
- Provide step-by-step walkthroughs for visual problems.
- Support follow-up questions referencing previously uploaded images in the conversation.

ACADEMIC & GENERAL SCOPE:
- Full spectrum: Everyday conversation, programming (Python, JS, TS, C++, Java, etc.), STEM (Mathematics, Physics, Chemistry, Biology), philosophy, history, essays, and exam prep (JAMB/UTME, WAEC/WASSCE, NECO, JUPEB, and University).
- Mathematics & Physics: Show clear step-by-step working, use standard LaTeX ($...$ for inline, $$...$$ for display equations), and explain key conceptual principles.
- Code blocks: Use labeled markdown code blocks (\`\`\`python, \`\`\`typescript, etc.).
- Tables: Use standard Markdown tables for comparisons.
${problemContext ? `\nACTIVE PROBLEM IN FOCUS:\nTopic: ${problemContext.subject || subject || 'General STEM'}\nProblem Statement: "${problemContext.problemStatement || problemContext.title || problemContext.question || ''}"\nFormula: ${problemContext.formula || 'N/A'}\nFinal Answer: ${problemContext.finalAnswer || 'N/A'}` : ''}`;

    const chatContents: any[] = [];

    // Reconstruct history with attachments
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-12)) {
        if (!h.content && (!h.attachments || h.attachments.length === 0)) continue;
        const parts: any[] = [];

        if (Array.isArray(h.attachments)) {
          for (const att of h.attachments) {
            if (att.data && att.mimeType) {
              const cleanData = att.data.replace(/^data:[a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+;base64,/, '');
              parts.push({
                inlineData: {
                  mimeType: att.mimeType,
                  data: cleanData,
                },
              });
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

    // Image attachment
    if (imageData) {
      const cleanBase64 = imageData.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      currentParts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    // Audio attachment
    if (audioData) {
      const cleanAudio = audioData.replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, '');
      currentParts.push({
        inlineData: {
          mimeType: audioMimeType || 'audio/webm',
          data: cleanAudio,
        },
      });
    }

    // Additional attachments
    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.data && att.mimeType) {
          const cleanData = att.data.replace(/^data:[a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+;base64,/, '');
          currentParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: cleanData,
            },
          });
        }
      }
    }

    const textPrompt = message || (audioData ? 'Please listen to this voice note carefully, transcribe what was asked, and write out the complete, step-by-step written answer in full detail.' : (imageData ? 'Please inspect this image and provide a detailed analysis or step-by-step solution.' : ''));
    if (textPrompt) {
      currentParts.push({ text: textPrompt });
    }

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
