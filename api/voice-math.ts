import {
  applyCors,
  extractJsonFromAI,
  generateStructuredAI,
  parseRequestBody,
  sendJson,
} from './_lib/geminiServer';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const transcript = String(body.transcript || '').trim();
    const audioBase64 = body.audioBase64 ? String(body.audioBase64) : '';
    const audioMimeType = body.audioMimeType ? String(body.audioMimeType) : 'audio/webm';

    if (!transcript && !audioBase64) {
      return sendJson(res, 400, { error: 'Please speak or record a mathematical question.' });
    }

    const prompt = `
Convert this spoken mathematics or science request into exact mathematical notation and solve it cleanly.
${transcript ? `Spoken Transcript: "${transcript}"` : 'Audio recording attached.'}

Return ONLY valid JSON:
{
  "spokenInterpretation": "Clean English transcription of what the student asked",
  "latex": "Exact formatted LaTeX equation/expression (e.g. \\int_{0}^{3} x^2 \\, dx or \\frac{3}{4} + \\sqrt{16})",
  "evaluableExpression": "Plain ASCII JS/math expression if purely numeric/evaluable (e.g. (3/4) + sqrt(16), or empty string if algebraic equation/calculus)",
  "plotExpression": "JavaScript expression in variable x if plottable function (e.g. x*x - 4, or empty string)",
  "subject": "Mathematics | Physics | Chemistry | Calculus",
  "steps": ["Step 1...", "Step 2...", "Step 3..."],
  "finalAnswerLatex": "LaTeX formatted final answer",
  "finalAnswerPlain": "Plain readable final answer"
}
`.trim();

    const contents: any[] = [{ text: prompt }];
    if (audioBase64) {
      const cleanData = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
      contents.push({
        inlineData: {
          mimeType: audioMimeType,
          data: cleanData,
        },
      });
    }

    const response = await generateStructuredAI({
      contents,
      responseMimeType: 'application/json',
      useThinking: false,
      timeoutMs: 35000,
    });

    const parsed = extractJsonFromAI(response.text);
    return sendJson(res, 200, { success: true, result: parsed });
  } catch (err: any) {
    return sendJson(res, 500, {
      error: err?.message || 'Failed to parse spoken mathematical expression.',
    });
  }
}
