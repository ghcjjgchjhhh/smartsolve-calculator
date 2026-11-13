import { GoogleGenAI } from '@google/genai';

async function generateWithModelFallback(
  ai: GoogleGenAI,
  contents: any[],
  responseMimeType?: string,
  timeoutMs: number = 40000
) {
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const config: any = {};
      if (responseMimeType) {
        config.responseMimeType = responseMimeType;
      }
      if (model === 'gemini-3.8-flash') {
        config.thinkingConfig = { thinkingLevel: 'LOW' };
      } else if (model === 'gemini-3.1-flash-lite') {
        config.thinkingConfig = { thinkingLevel: 'MINIMAL' };
      }

      const generatePromise = ai.models.generateContent({
        model,
        contents,
        config,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Timeout: Model ${model} took longer than ${Math.round(timeoutMs / 1000)} seconds`)),
          timeoutMs
        )
      );

      const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
      return response;
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      if (i < candidateModels.length - 1) {
        console.warn(`[SmartSolve Learn API] Model ${model} failed (${msg.slice(0, 90)}). Retrying with ${candidateModels[i + 1]}...`);
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
      (headerKey && headerKey.trim()) ||
      (body.apiKey && String(body.apiKey).trim()) ||
      serverKey;

    if (!apiKey) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          error: 'AI academic tutor is temporarily unavailable. Please try again in a few moments.',
        })
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Follow-up Question Handler
    if (body.action === 'follow_up' || body.question) {
      const { topic, question, lessonSummary } = body;
      if (!question || !String(question).trim()) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Please enter a follow-up question.' }));
      }

      const followUpPrompt = `
You are SmartSolve AI, an acclaimed professor and master academic tutor.
You are in an interactive 1-on-1 tutoring session with a student studying "${topic || 'Academic STEM'}".
Lesson Context:
${lessonSummary ? String(lessonSummary).slice(0, 1500) : ''}

Student's Follow-up Question:
"${question}"

Provide a crystal-clear, pedagogical response:
1. Directly answer the student's question with academic precision and warmth.
2. Format all mathematical expressions, derivations, chemical equations, and formulas in standard LaTeX ($...$ and $$...$$).
3. If giving an extra example, show given values, formula, numerical steps, and boxed final answer (\\boxed{...}).
4. Keep the explanation rigorous yet easy to understand for WAEC, JAMB, JUPEB, and University undergraduate students.
5. Provide a quick follow-up challenge or thought-provoking check at the end.
`.trim();

      const response = await generateWithModelFallback(ai, [{ text: followUpPrompt }], undefined, 30000);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, reply: response.text?.trim() || '' }));
    }

    // Topic Masterclass Lesson Generator
    const topic = String(body.topic || body.prompt || '').trim();
    const subject = String(body.subject || 'General STEM').trim();
    const examLevel = String(body.examLevel || 'JUPEB, JAMB, WAEC & University').trim();
    const language = String(body.language || body.preferredLanguage || 'English').trim();

    if (!topic) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Please enter a topic, concept, formula, or academic question to learn.' }));
    }

    const learnPrompt = `
You are SmartSolve AI, an acclaimed professor and master academic tutor specializing in teaching Mathematics, Physics, Chemistry, Biology, Further Mathematics, and Economics for WAEC, JAMB, JUPEB, and University undergraduate students.

The student wants to learn:
Topic / Concept / Formula / Question: "${topic}"
Academic Subject: "${subject}"
Target Academic Level: "${examLevel}"
Preferred Language: "${language}"

CRITICAL TUTOR TEACHING GUIDELINES:
1. NEVER invent non-existent formulas or provide hand-wavy or incomplete explanations. Provide comprehensive, textbook-rigorous academic depth.
2. Format ALL formulas, math expressions, equations, and powers using clean standard LaTeX notation ($...$ and $$...$$). NEVER leave unformatted raw ascii equations.
3. In LaTeX, NEVER use raw '%' (always escape as '\\%'). Ensure matching braces (\\left( matched with \\right), \\{ ... \\}).
4. MEANINGS OF ALL SYMBOLS & SI UNITS: For every formula introduced, explicitly detail every variable symbol, what physical/mathematical quantity it represents, and its standard SI unit (e.g. $m$: mass in kilograms [\\text{kg}], $v$: final velocity in meters per second [\\text{m/s}]).
5. WHEN TO USE EACH FORMULA: Clearly explain the exact physical conditions, assumptions, or problem types where each formula applies (and when NOT to use it).
6. STEP-BY-STEP WORKED EXAMPLES: Provide 2 to 3 fully worked, high-yield examination examples showing:
   - Problem statement
   - Given values with symbols and units
   - Governing formula
   - Direct numerical substitution
   - Step-by-step arithmetic/algebraic calculations
   - Boxed final answer with correct SI unit (\\boxed{...})
   - Conceptual explanation of the physical/mathematical principle
7. IMPORTANT NOTES & COMMON PITFALLS:
   - Provide crucial exam tips, boundary conditions, and sign conventions.
   - List frequent student misconceptions and trap answers.
8. PRACTICE QUESTIONS: Provide 2 to 3 challenging exam-style practice questions with hints, detailed solutions, and final answers suitable for WAEC, JAMB, JUPEB, and University levels.
9. RESPOND ONLY WITH A VALID JSON OBJECT matching this exact structure:
{
  "topic": "Clean descriptive topic title",
  "subject": "${subject}",
  "targetExamLevel": "${examLevel}",
  "summary": "1-2 sentence high-yield summary of the concept",
  "introduction": "Engaging, thorough pedagogical introduction explaining what this concept is and why it matters",
  "realWorldAnalogy": "A brilliant, intuitive real-world analogy that makes the concept instantly click in the student's mind",
  "detailedExplanation": [
    "Comprehensive academic explanation paragraph 1 with fundamental principles...",
    "Detailed theoretical breakdown paragraph 2 with derivations or scientific mechanisms...",
    "Key laws, theorems, or governing principles paragraph 3..."
  ],
  "formulas": [
    {
      "name": "Name of the formula/law",
      "latex": "LaTeX formula (e.g. $$v^2 = u^2 + 2as$$)",
      "whenToUse": "Exact conditions and problem contexts when to apply this equation",
      "derivationSummary": "Brief mathematical origin or derivation rationale",
      "symbols": [
        { "symbol": "$v$", "meaning": "Final velocity", "siUnit": "m/s" },
        { "symbol": "$u$", "meaning": "Initial velocity", "siUnit": "m/s" }
      ]
    }
  ],
  "tables": [
    {
      "title": "Key Comparisons / Values",
      "headers": ["Parameter / Type", "Description / Formula", "SI Unit / Standard Value"],
      "rows": [
        ["Parameter A", "Description", "Unit"],
        ["Parameter B", "Description", "Unit"]
      ]
    }
  ],
  "workedExamples": [
    {
      "title": "Worked Example 1 (Standard Exam Level)",
      "problemStatement": "A full question statement in LaTeX...",
      "givenValues": [
        { "name": "Initial velocity", "symbol": "u", "value": "0", "unit": "m/s" }
      ],
      "formulaUsed": "$$v = u + at$$",
      "substitution": "$$v = 0 + (9.8)(4)$$",
      "steps": [
        "1. Identify given values: ...",
        "2. State governing formula: ...",
        "3. Substitute numerical values: ...",
        "4. Calculate intermediate step: ...",
        "5. State final answer with units: ..."
      ],
      "finalAnswer": "\\boxed{39.2\\text{ m/s}}",
      "unit": "m/s",
      "explanation": "Why this formula was appropriate and physical meaning of the result"
    }
  ],
  "importantNotes": [
    "High-yield exam tip or boundary condition 1",
    "High-yield exam tip 2"
  ],
  "commonPitfalls": [
    "Frequent student error or trap 1",
    "Sign convention mistake or unit trap 2"
  ],
  "practiceQuestions": [
    {
      "id": "pq1",
      "question": "Challenging practice question statement...",
      "difficulty": "Medium",
      "hint": "Useful conceptual hint to get started",
      "solution": [
        "Step 1: ...",
        "Step 2: ...",
        "Step 3: ..."
      ],
      "finalAnswer": "\\boxed{...}"
    }
  ],
  "suggestedFollowUps": [
    "Can you derive the primary formula from first principles?",
    "How does this apply to University 100-level exam questions?",
    "Show me another challenging example with friction or resistance",
    "Explain the graph of this concept in detail"
  ]
}
`.trim();

    const response = await generateWithModelFallback(ai, [{ text: learnPrompt }], 'application/json', 40000);

    const resultJson = response.text?.trim() || '{}';
    let cleanJson = resultJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    const parsedLesson = JSON.parse(cleanJson);
    parsedLesson.timestamp = Date.now();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: true, lesson: parsedLesson }));
  } catch (error: any) {
    console.error('API /api/learn error:', error);
    const rawMsg = error?.message || String(error);
    const is503 = rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE');
    res.statusCode = is503 ? 503 : 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: is503
          ? 'The AI academic tutor is currently experiencing temporary high demand. Please tap Retry in a few seconds.'
          : rawMsg || 'Failed to generate academic lesson. Please tap Retry.',
      })
    );
  }
}
