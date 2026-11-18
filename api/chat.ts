import { GoogleGenAI, ThinkingLevel } from '@google/genai';

function applyCorsHeaders(req: any, res: any): boolean {
  const origin = typeof req?.headers?.origin === 'string' ? req.headers.origin : '';
  let allowed = false;
  if (origin) {
    try {
      const parsed = new URL(origin);
      const host = parsed.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1') allowed = true;
      else if (
        parsed.protocol === 'https:' &&
        (host.endsWith('.vercel.app') || host.endsWith('.run.app'))
      ) {
        allowed = true;
      }
    } catch {
      allowed = false;
    }
  }

  res.setHeader('Vary', 'Origin');
  if (origin && allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-gemini-key');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req?.method === 'OPTIONS') {
    if (typeof res.sendStatus === 'function') {
      res.sendStatus(200);
    } else {
      res.statusCode = 200;
      res.end();
    }
    return true;
  }
  return false;
}

async function generateWithModelFallback(
  ai: GoogleGenAI,
  contents: any[],
  systemInstruction?: string,
  timeoutMs: number = 25000
) {
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const config: any = {};
      if (model === 'gemini-3.1-flash-lite') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
        config.temperature = 0.7;
      } else if (model === 'gemini-4-hydrogen') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }
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
    if (applyCorsHeaders(req, res)) {
      return;
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
    const preferredLanguage = body.preferredLanguage || body.language || 'English (Nigerian)';
    const preferredGender = body.preferredGender || body.gender || 'female';
    const shouldStream = Boolean(body.stream) || Boolean(req.headers?.accept?.includes('text/event-stream'));

    if (!message && !imageData && !audioData && (!attachments || attachments.length === 0)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Please provide a message, question, image, or audio recording.' }));
    }

    const isValidKey = (v: unknown) => {
      const s = typeof v === 'string' ? v.trim() : '';
      return !s || s === 'MY_GEMINI_API_KEY' || s === 'YOUR_GEMINI_API_KEY' || s.length < 16 ? '' : s;
    };
    const headerKey =
      (req.headers?.['x-gemini-key'] as string) ||
      (req.headers?.['authorization'] as string)?.replace(/^Bearer\s+/i, '') ||
      '';
    const serverKey =
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
        .map(isValidKey)
        .find(Boolean) || '';
    const apiKey = serverKey || isValidKey(headerKey) || isValidKey(body.apiKey) || '';

    if (!apiKey) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          error:
            'Server AI configuration missing (GEMINI_API_KEY). Add GEMINI_API_KEY in Vercel Environment Variables and redeploy.',
        })
      );
    }

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

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // 1. Streaming SSE Response (instant first-token delivery)
    if (shouldStream) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
      }
      res.write(': connected\n\n');

      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
      let streamSuccess = false;

      for (const model of candidateModels) {
        let firstChunkEmitted = false;
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
          const stream = (await Promise.race([
            ai.models.generateContentStream({
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
              firstChunkEmitted = true;
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
              if (typeof (res as any).flush === 'function') {
                (res as any).flush();
              }
            }
          }
          streamSuccess = true;
          break;
        } catch (modelErr) {
          console.warn(`[api/chat] Model ${model} stream error:`, modelErr);
          if (firstChunkEmitted) {
            streamSuccess = true;
            break;
          }
        }
      }

      if (!streamSuccess) {
        let fallbackRes: any = null;
        try {
          fallbackRes = await generateWithModelFallback(ai, chatContents, systemPrompt, 25000);
        } catch (err: any) {
          if (serverKey && serverKey !== apiKey) {
            const fallbackAi = new GoogleGenAI({
              apiKey: serverKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                },
              },
            });
            fallbackRes = await generateWithModelFallback(fallbackAi, chatContents, systemPrompt, 25000);
          } else {
            throw err;
          }
        }
        const text = fallbackRes?.text?.trim() || '';
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // 2. Standard JSON Response
    let response: any;
    try {
      response = await generateWithModelFallback(ai, chatContents, systemPrompt, 25000);
    } catch (err: any) {
      if (serverKey && serverKey !== apiKey) {
        try {
          const fallbackAi = new GoogleGenAI({ apiKey: serverKey });
          response = await generateWithModelFallback(fallbackAi, chatContents, systemPrompt, 25000);
        } catch (fbErr) {
          throw fbErr;
        }
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
    const isRateLimit =
      rawMsg.includes('429') ||
      rawMsg.includes('Resource has been exhausted') ||
      rawMsg.includes('quota');
    const is503 =
      rawMsg.includes('503') ||
      rawMsg.includes('high demand') ||
      rawMsg.includes('UNAVAILABLE');

    let userFriendlyError = 'The AI assistant encountered an issue. Please tap Retry.';
    if (isRateLimit) {
      userFriendlyError =
        'The AI service is experiencing heavy traffic. Please wait a moment and tap Retry.';
    } else if (is503) {
      userFriendlyError =
        'The AI reasoning model is momentarily busy with high traffic. Please tap Retry.';
    } else if (rawMsg.includes('INVALID_ARGUMENT')) {
      userFriendlyError =
        'The audio or image attachment could not be decoded. Please try again with a clear photo or re-record the voice note.';
    } else if (rawMsg) {
      userFriendlyError = rawMsg;
    }

    res.statusCode = isRateLimit ? 429 : is503 ? 503 : 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: userFriendlyError,
      })
    );
  }
}
