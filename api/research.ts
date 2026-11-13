import {
  applyCors,
  extractJsonFromAI,
  generateStructuredAI,
  parseRequestBody,
  sendJson,
} from './_lib/geminiServer';
import { detectAndGenerateDiagram } from '../src/services/aiDiagramDetector';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const query = String(body.query || body.topic || '').trim();
    const discipline = String(body.discipline || 'Physics & General Science').trim();

    if (!query) {
      return sendJson(res, 400, { error: 'Please enter a scientific law, theory, discovery, or experiment.' });
    }

    const prompt = `
You are an academic scientific research synthesizer explaining STEM laws, theories, discoveries, and experiments with strict epistemic honesty.
Topic / Query: "${query}"
Discipline: "${discipline}"

CRITICAL EPISTEMIC RULE:
Explicitly separate **Established Scientific Consensus / Empirically Verified Facts** from **Uncertain, Open, Hypothetical, or Frontier Scientific Areas**. Never state unproven hypotheses as settled fact.

Return ONLY valid JSON:
{
  "title": "Formal scientific title",
  "discipline": "Physics | Chemistry | Biology | Mathematics | Astronomy | Interdisciplinary",
  "summary": "2-3 sentence rigorous executive summary",
  "establishedConsensus": [
    {
      "claim": "Verified scientific principle or experimental law",
      "evidence": "How this has been repeatedly tested and verified empirically"
    }
  ],
  "uncertainOrFrontier": [
    {
      "topic": "Open question, limit of validity, or competing hypothesis",
      "status": "Hypothetical | Theoretical Limit | Under Active Research | Scope Boundary",
      "explanation": "Why this remains uncertain, where the law breaks down (e.g. relativistic/quantum scales), or what experiments are still testing it"
    }
  ],
  "keyEquations": [
    {
      "name": "Equation / Law name",
      "latex": "LaTeX equation",
      "variables": "Meaning and SI units of symbols"
    }
  ],
  "landmarkExperiments": [
    {
      "year": "e.g. 1887 or 1909",
      "scientist": "Researcher(s)",
      "experiment": "Name and setup of experiment",
      "finding": "What was directly observed and concluded"
    }
  ],
  "workedExample": {
    "problem": "Quantitative or conceptual example problem",
    "steps": ["Step 1...", "Step 2..."],
    "answer": "Final answer in LaTeX"
  },
  "diagramDescription": "Visual setup summary if applicable"
}
`.trim();

    const response = await generateStructuredAI({
      contents: [{ text: prompt }],
      responseMimeType: 'application/json',
      useThinking: true,
      timeoutMs: 40000,
    });

    const research = extractJsonFromAI(response.text);
    const diagram = detectAndGenerateDiagram(
      {
        title: research.title || query,
        formula: research.keyEquations?.[0]?.latex || '',
        problemStatement: research.summary || query,
        steps: (research.workedExample?.steps || []) as string[],
      } as any,
      query
    );
    if (diagram) {
      research.diagram = diagram;
    }

    return sendJson(res, 200, { success: true, research });
  } catch (err: any) {
    return sendJson(res, 500, {
      error: err?.message || 'Failed to generate scientific research brief.',
    });
  }
}
