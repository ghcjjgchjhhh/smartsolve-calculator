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
    const problem = String(body.problem || '').trim();
    const mode = String(body.mode || 'start'); // 'start' | 'next_hint' | 'check_attempt' | 'reveal_solution'
    const studentAttempt = String(body.studentAttempt || '').trim();
    const hintLevel = Number(body.hintLevel || 1);
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

    if (!problem) {
      return sendJson(res, 400, { error: 'Please enter a problem for Socratic tutoring.' });
    }

    const conversationSummary = history
      .map((h: any) => `${h.role === 'student' ? 'Student' : 'Tutor'}: ${h.content}`)
      .join('\n');

    const prompt = `
You are a patient, brilliant Socratic STEM Tutor.
Problem: "${problem}"
Current Mode: "${mode}"
Requested Hint Level (1=gentle nudge, 2=formula/strategy clue, 3=near-complete setup): ${hintLevel}
${studentAttempt ? `Student's Attempt / Response: "${studentAttempt}"` : ''}
${conversationSummary ? `Recent Dialogue:\n${conversationSummary}` : ''}

STRICT PEDAGOGICAL RULES:
- If mode is "start", "next_hint", or "check_attempt": DO NOT reveal the final numerical or symbolic answer! Guide the student with a sharp Socratic question, check if their attempt is on the right track (or gently spot any algebraic/unit mistake), and give a progressive hint matching hintLevel.
- ONLY if mode is "reveal_solution": Provide the complete step-by-step worked solution and final answer!
- Format math expressions cleanly with $...$ and $$...$$ LaTeX.

Return ONLY valid JSON:
{
  "feedback": "Encouraging response evaluating student's attempt or setting up the step (without spoiling answer unless mode=reveal_solution)",
  "guidingQuestion": "One targeted Socratic question for the student to think about next",
  "hint": "Progressive hint for level ${hintLevel} (empty if reveal_solution)",
  "isAttemptCorrect": false,
  "solvedCompletely": false,
  "fullSolution": {
    "formula": "",
    "steps": [],
    "finalAnswer": "",
    "conceptTakeaway": ""
  }
}
`.trim();

    const response = await generateStructuredAI({
      contents: [{ text: prompt }],
      responseMimeType: 'application/json',
      useThinking: mode === 'reveal_solution',
      timeoutMs: 35000,
    });

    const socratic = extractJsonFromAI(response.text);
    return sendJson(res, 200, { success: true, socratic });
  } catch (err: any) {
    return sendJson(res, 500, {
      error: err?.message || 'Failed to generate Socratic tutor response.',
    });
  }
}
