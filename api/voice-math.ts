import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { applyCorsHeaders } from './_cors';
import { transcribeAudioWithGemini } from './transcribe';

function applyCors(req: any, res: any): boolean {
  return applyCorsHeaders(req, res);
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

function normalizeAudioMime(raw?: string): string {
  let mime = String(raw || 'audio/webm').trim().toLowerCase();
  if (mime.includes(';')) mime = mime.split(';')[0].trim();
  if (mime === 'audio/x-m4a' || mime === 'audio/m4a') return 'audio/mp4';
  if (mime === 'audio/x-wav') return 'audio/wav';
  if (mime === 'audio/mp3') return 'audio/mpeg';
  return mime || 'audio/webm';
}

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
    return JSON.parse(txt.replace(/,\s*([}\]])/g, '$1').replace(/\\(?!["\\/bfnrtu])/g, '\\\\'));
  }
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

async function generateJson(apiKey: string, contents: any[], timeoutMs = 25000) {
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  const models = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
  let lastError: any = null;
  for (const model of models) {
    try {
      const config: any = { responseMimeType: 'application/json' };
      if (model === 'gemini-3.1-flash-lite') config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      else if (model === 'gemini-4-hydrogen') config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      const response = (await Promise.race([
        ai.models.generateContent({ model, contents, config }),
        new Promise((_, rej) => setTimeout(() => rej(new Error(`Timeout waiting for ${model}`)), timeoutMs)),
      ])) as any;
      return repairAndParseJson(response.text);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('AI service temporarily unavailable.');
}

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });

  try {
    const apiKey = resolveApiKey(req);
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return sendJson(res, 503, { error: 'Server AI configuration missing (GEMINI_API_KEY).' });
    }

    const body = parseBody(req);
    let transcript = String(body.transcript || '').trim();
    const audioBase64 = body.audioBase64 ? String(body.audioBase64) : '';
    const audioMimeType = normalizeAudioMime(body.audioMimeType);

    if (!transcript && !audioBase64) {
      return sendJson(res, 400, { error: 'Please speak or record a mathematical question.' });
    }

    const cleanAudioData = audioBase64
      ? (audioBase64.includes(',') ? audioBase64.split(',')[1].trim() : audioBase64.trim())
      : '';

    if (!transcript && (!cleanAudioData || cleanAudioData.length < 64)) {
      return sendJson(res, 400, { error: 'The voice recording was too short or empty. Please speak clearly and try again.' });
    }

    // Two-stage high-accuracy speech transcription first when audio is present
    if (cleanAudioData && !transcript) {
      try {
        const heard = await transcribeAudioWithGemini(apiKey, cleanAudioData, audioMimeType, {
          mode: 'math',
        });
        if (!heard) {
          return sendJson(res, 400, {
            error: 'No clear speech was detected in your recording. Please hold your mic closer and speak clearly.',
          });
        }
        transcript = heard;
      } catch (transcribeErr: any) {
        console.warn('[api/voice-math] Direct transcribe fallback warning:', transcribeErr?.message);
        // Continue so multimodal solve model still inspects the audio directly
      }
    }

    const prompt = `
Convert this spoken mathematics or science request into exact mathematical notation and solve it cleanly.
${transcript ? `Spoken Transcript: "${transcript}"` : 'Audio recording attached.'}

Return ONLY valid JSON:
{
  "spokenInterpretation": "Clean, accurate English transcription of what the student asked",
  "latex": "Exact formatted LaTeX equation/expression (e.g. \\\\int_{0}^{3} x^2 \\\\, dx or \\\\frac{3}{4} + \\\\sqrt{16})",
  "evaluableExpression": "Plain ASCII JS/math expression if purely numeric/evaluable (e.g. (3/4) + sqrt(16), or empty string if algebraic equation/calculus)",
  "plotExpression": "JavaScript expression in variable x if plottable function (e.g. x*x - 4, or empty string)",
  "subject": "Mathematics | Physics | Chemistry | Calculus",
  "steps": ["Step 1...", "Step 2...", "Step 3..."],
  "finalAnswerLatex": "LaTeX formatted final answer",
  "finalAnswerPlain": "Plain readable final answer"
}
`.trim();

    const contents: any[] = [{ text: prompt }];
    if (cleanAudioData) {
      contents.push({ inlineData: { mimeType: audioMimeType, data: cleanAudioData } });
    }

    const parsed = await generateJson(apiKey, contents, 35000);
    if (!parsed.spokenInterpretation && transcript) {
      parsed.spokenInterpretation = transcript;
    }
    return sendJson(res, 200, { success: true, transcript: parsed.spokenInterpretation || transcript, result: parsed });
  } catch (err: any) {
    return sendJson(res, 500, { error: err?.message || 'Failed to parse spoken mathematical expression.' });
  }
}
