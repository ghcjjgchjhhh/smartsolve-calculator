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
    const topic = String(body.topic || body.prompt || '').trim();
    if (!topic) {
      return sendJson(res, 400, { error: 'Please enter a problem or concept for the AI Whiteboard.' });
    }

    const prompt = `
You are an expert STEM visual tutor teaching on a 800x480 digital whiteboard coordinate grid (x from 0 to 800, y from 0 to 480).
Break down and illustrate: "${topic}"

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "Short title",
  "summary": "Brief overview",
  "finalAnswerLatex": "LaTeX final answer e.g. x = 5",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step heading",
      "narration": "Clear 1-2 sentence explanation for the student",
      "formulaLatex": "Relevant LaTeX equation e.g. a^2 + b^2 = c^2",
      "drawCommands": [
        {
          "type": "line | arrow | circle | rect | text | curve | axis",
          "color": "#22C55E | #38BDF8 | #F59E0B | #F43F5E | #FFFFFF",
          "x1": 100, "y1": 100, "x2": 300, "y2": 200,
          "cx": 400, "cy": 240, "r": 80,
          "x": 120, "y": 80, "w": 160, "h": 90,
          "label": "Text label drawn inside canvas (keep short ASCII/Unicode)",
          "points": [{"x": 100, "y": 350}, {"x": 250, "y": 220}, {"x": 400, "y": 140}]
        }
      ]
    }
  ]
}

Rules:
- Generate 4 to 6 progressive visual steps that cumulatively build the diagram and calculation on the 800x480 board.
- Keep all coordinates cleanly inside x: [40, 760], y: [40, 440].
- Put clear geometry sketches, axes, triangles, vectors, force arrows, curves, or circuit blocks in drawCommands.
- Escape any '%' in LaTeX as '\\%'.
`.trim();

    const response = await generateStructuredAI({
      contents: [{ text: prompt }],
      responseMimeType: 'application/json',
      useThinking: false,
      timeoutMs: 35000,
    });

    const lesson = extractJsonFromAI(response.text);
    return sendJson(res, 200, { success: true, boardLesson: lesson });
  } catch (err: any) {
    return sendJson(res, 500, {
      error: err?.message || 'Failed to generate AI Whiteboard steps.',
    });
  }
}
