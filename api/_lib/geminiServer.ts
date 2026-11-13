import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export function getServerGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function generateStructuredAI({
  contents,
  systemInstruction,
  responseMimeType = 'application/json',
  useThinking = false,
  timeoutMs = 35000,
}: {
  contents: any[];
  systemInstruction?: string;
  responseMimeType?: string;
  useThinking?: boolean;
  timeoutMs?: number;
}) {
  const ai = getServerGenAI();
  if (!ai) {
    throw new Error('Server AI configuration missing (GEMINI_API_KEY).');
  }

  const models = useThinking
    ? ['gemini-4-hydrogen', 'gemini-3.8-flash', 'gemini-3.1-flash-lite']
    : ['gemini-3.1-flash-lite', 'gemini-4-hydrogen', 'gemini-3.8-flash'];

  let lastError: any = null;

  for (const model of models) {
    try {
      const config: any = {};
      if (responseMimeType) {
        config.responseMimeType = responseMimeType;
      }
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      if (model === 'gemini-4-hydrogen') {
        config.thinkingConfig = {
          thinkingLevel: useThinking ? ThinkingLevel.HIGH : ThinkingLevel.LOW,
        };
      } else if (model === 'gemini-3.1-flash-lite') {
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.MINIMAL,
        };
      } else if (model === 'gemini-3.8-flash') {
        config.thinkingConfig = {
          thinkingLevel: useThinking ? 'MEDIUM' : 'LOW',
        };
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout waiting for ${model}`)),
          timeoutMs
        )
      );

      const response = (await Promise.race([
        ai.models.generateContent({
          model,
          contents,
          config,
        }),
        timeoutPromise,
      ])) as any;

      return response;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('All AI models failed to respond.');
}

export function extractJsonFromAI(rawText: string | undefined): any {
  const txt = (rawText || '{}')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const match = txt.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : txt);
}

export async function parseRequestBody(req: any): Promise<any> {
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

export function sendJson(res: any, status: number, payload: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(payload);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(payload));
}

export function applyCors(req: any, res: any): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
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
