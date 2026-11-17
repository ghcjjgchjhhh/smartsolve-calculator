import { GoogleGenAI, ThinkingLevel } from '@google/genai';

function applyCorsHeaders(req: any, res: any): boolean {
  const origin = typeof req?.headers?.origin === 'string' ? req.headers.origin : '';
  const allowedStatic = new Set([
    'https://smart-solve-40fb3.web.app',
    'https://smart-solve-40fb3.firebaseapp.com',
  ]);
  let allowed = false;
  if (origin) {
    if (allowedStatic.has(origin)) allowed = true;
    else {
      try {
        const parsed = new URL(origin);
        const host = parsed.hostname.toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1') allowed = true;
        else if (
          parsed.protocol === 'https:' &&
          (host.endsWith('.vercel.app') ||
            host.endsWith('.run.app') ||
            ((host.endsWith('.web.app') || host.endsWith('.firebaseapp.com')) &&
              host.startsWith('smart-solve-40fb3')))
        ) {
          allowed = true;
        }
      } catch {
        allowed = false;
      }
    }
  }

  res.setHeader('Vary', 'Origin');
  if (origin && allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', 'https://smart-solve-40fb3.web.app');
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

function sendJson(res: any, status: number, payload: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(payload);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(payload));
}

function parseBody(req: any): any {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeMimeType(raw?: string): string {
  let mime = String(raw || 'audio/webm').trim().toLowerCase();
  if (mime.includes(';')) {
    mime = mime.split(';')[0].trim();
  }
  if (mime === 'audio/x-m4a' || mime === 'audio/m4a') return 'audio/mp4';
  if (mime === 'audio/x-wav') return 'audio/wav';
  if (mime === 'audio/mp3') return 'audio/mpeg';
  if (!mime.startsWith('audio/') && !mime.startsWith('video/')) {
    return 'audio/webm';
  }
  return mime;
}

function resolveApiKey(req: any): string {
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

  if (headerKey && headerKey.trim() && headerKey !== 'MY_GEMINI_API_KEY' && headerKey.trim().length > 15) {
    return headerKey.trim();
  }
  return serverKey;
}

export async function transcribeAudioWithGemini(
  apiKey: string,
  base64Audio: string,
  rawMimeType?: string,
  options?: { language?: string; mode?: 'math' | 'general' }
): Promise<string> {
  const cleanData = base64Audio.includes(',') ? base64Audio.split(',')[1].trim() : base64Audio.trim();
  if (!cleanData || cleanData.length < 64) {
    throw new Error('Recording was empty or too short. Please speak clearly and try again.');
  }

  const mimeType = normalizeMimeType(rawMimeType);
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const isMath = options?.mode === 'math';
  const languageHint = options?.language ? `Preferred language/accent hint: ${options.language}. ` : '';
  const promptText = isMath
    ? `${languageHint}Transcribe the attached speech recording accurately verbatim into clean text with proper punctuation. Preserve all spoken numbers, variables (x, y, z, theta, pi), fractions, exponents ("squared", "cubed", "to the power of"), square roots, integrals, derivatives, chemical formulas, and physics units accurately. If there is no intelligible speech (only silence or background noise), respond with exactly "[NO_SPEECH]". Output ONLY the transcription text with no preamble or quotes.`
    : `${languageHint}Transcribe the attached speech recording accurately verbatim with natural punctuation and spelling. Understand diverse global accents clearly (including Nigerian/West African, British, American, Indian, etc.) as well as academic, STEM, and everyday terms. If there is no intelligible speech (only silence or background noise), respond with exactly "[NO_SPEECH]". Output ONLY the transcription text with no preamble or quotes.`;

  const audioPart = {
    inlineData: {
      mimeType,
      data: cleanData,
    },
  };

  const candidateModels = ['gemini-3.5-transcribe', 'gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const config: any = {};
      if (model === 'gemini-3.1-flash-lite') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      } else if (model === 'gemini-4-hydrogen') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const response = (await Promise.race([
        ai.models.generateContent({
          model,
          contents: { parts: [audioPart, { text: promptText }] },
          ...(Object.keys(config).length > 0 ? { config } : {}),
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Transcription timeout on ${model}`)), 25000)
        ),
      ])) as any;

      const transcript = String(response?.text || '').trim();
      if (!transcript) {
        continue;
      }
      if (
        transcript === '[NO_SPEECH]' ||
        /^\[?no[_\s-]?speech\]?$/i.test(transcript) ||
        /^(\d{1,2}:)?\d{1,2}:\d{2}(\.\d+)?$/.test(transcript)
      ) {
        return '';
      }
      // Strip accidental surrounding quotes added by fallback chat models
      return transcript.replace(/^["“]|["”]$/g, '').trim();
    } catch (err: any) {
      lastError = err;
      console.warn(`[api/transcribe] Model ${model} failed:`, err?.message || err);
    }
  }

  throw lastError || new Error('Unable to transcribe audio right now.');
}

export default async function handler(req: any, res: any) {
  if (applyCorsHeaders(req, res)) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = parseBody(req);
    const audioBase64 = String(body.audioBase64 || body.audioData || '');
    const audioMimeType = String(body.audioMimeType || body.mimeType || 'audio/webm');
    const language = body.language ? String(body.language) : undefined;
    const mode = body.mode === 'math' ? 'math' : 'general';

    if (!audioBase64) {
      return sendJson(res, 400, { error: 'No audio recording provided.' });
    }

    const apiKey = resolveApiKey(req);
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return sendJson(res, 503, { error: 'Server AI configuration missing (GEMINI_API_KEY).' });
    }

    const transcript = await transcribeAudioWithGemini(apiKey, audioBase64, audioMimeType, {
      language,
      mode,
    });

    if (!transcript) {
      return sendJson(res, 200, {
        success: true,
        transcript: '',
        noSpeech: true,
      });
    }

    return sendJson(res, 200, {
      success: true,
      transcript,
      noSpeech: false,
    });
  } catch (err: any) {
    console.error('[api/transcribe] error:', err);
    const msg = err?.message || 'Failed to transcribe audio recording.';
    const status = msg.includes('empty or too short') ? 400 : 500;
    return sendJson(res, status, { error: msg });
  }
}
