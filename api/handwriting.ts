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
    const imageBase64 = String(body.imageBase64 || '').trim();
    const mimeType = String(body.mimeType || 'image/png');
    const note = String(body.note || '').trim();

    if (!imageBase64) {
      return sendJson(res, 400, { error: 'Please upload or draw an equation image to recognize.' });
    }

    const cleanData = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const prompt = `
Perform high-precision optical handwritten mathematical recognition on this image.
Identify handwritten equations, mathematical symbols, fractions, exponents/powers, square/nth roots, integrals, summations, Greek letters, matrices, or scientific notation (e.g. 6.02 x 10^23).
${note ? `Student hint/context: "${note}"` : ''}

Return ONLY valid JSON:
{
  "recognizedText": "Human-readable transcription of the handwritten math/question",
  "recognizedLatex": "Accurate LaTeX representation (use \\frac, \\sqrt, \\int, \\sum, ^, \\times 10^{...})",
  "evaluableExpression": "ASCII math expression if numeric calculation (e.g. (3/4)^2 + sqrt(25), else empty string)",
  "detectedSymbols": ["Fractions", "Powers", "Integrals", "Scientific Notation"],
  "confidenceNotes": "Brief note if any handwritten digit/symbol could be ambiguous",
  "steps": ["Step 1...", "Step 2..."],
  "finalAnswerLatex": "Exact solved answer in LaTeX",
  "finalAnswerPlain": "Plain text final answer"
}
`.trim();

    const response = await generateStructuredAI({
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: cleanData,
          },
        },
      ],
      responseMimeType: 'application/json',
      useThinking: true,
      timeoutMs: 40000,
    });

    const recognized = extractJsonFromAI(response.text);
    return sendJson(res, 200, { success: true, recognition: recognized });
  } catch (err: any) {
    return sendJson(res, 500, {
      error: err?.message || 'Failed to recognize handwritten mathematics.',
    });
  }
}
