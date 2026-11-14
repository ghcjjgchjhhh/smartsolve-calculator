import { GoogleGenAI, ThinkingLevel } from '@google/genai';

function resolveApiKey(req: any, body: any): string {
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
  return (
    (headerKey && headerKey.trim()) ||
    (body?.apiKey && String(body.apiKey).trim()) ||
    serverKey
  );
}

function repairAndParseJson(rawText: string | undefined): any {
  let txt = (rawText || '{}')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const match = txt.match(/\{[\s\S]*\}/);
  if (match) {
    txt = match[0];
  }

  try {
    return JSON.parse(txt);
  } catch {
    // Repair invalid backslash escapes (common in LaTeX like \frac, \boxed, \text, \Delta)
    // and trailing commas before } or ]
    const repaired = txt
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    return JSON.parse(repaired);
  }
}

async function generateWithModelFallback(
  ai: GoogleGenAI,
  contents: any[],
  options: {
    responseMimeType?: string;
    timeoutMs?: number;
    validateJson?: (parsed: any) => boolean;
  } = {}
) {
  const {
    responseMimeType,
    timeoutMs = 35000,
    validateJson,
  } = options;

  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];

  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const config: any = {};
      if (responseMimeType) {
        config.responseMimeType = responseMimeType;
      }
      if (model === 'gemini-4-hydrogen') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else if (model === 'gemini-3.1-flash-lite') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
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
              new Error(`Timeout: Model ${model} took longer than ${Math.round(timeoutMs / 1000)} seconds`)
            ),
          timeoutMs
        )
      );

      const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
      const text = response?.text?.trim();
      if (!text) {
        throw new Error(`Model ${model} returned an empty response.`);
      }

      if (responseMimeType === 'application/json') {
        const parsed = repairAndParseJson(text);
        if (validateJson && !validateJson(parsed)) {
          throw new Error(`Model ${model} returned incomplete structured data.`);
        }
        return { response, parsed };
      }

      return { response, parsed: null };
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      if (i < candidateModels.length - 1) {
        console.warn(
          `[SmartSolve Learn API] Model ${model} failed (${msg.slice(0, 100)}). Retrying with ${candidateModels[i + 1]}...`
        );
        await new Promise((r) => setTimeout(r, 350));
        continue;
      }
    }
  }
  throw lastError;
}

function sendJsonResponse(res: any, statusCode: number, payload: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(payload));
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
      return sendJsonResponse(res, 405, { error: 'Method Not Allowed' });
    }

    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const apiKey = resolveApiKey(req, body);
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return sendJsonResponse(res, 503, {
        error: 'AI academic tutor is temporarily unavailable. Please verify server API key configuration.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const effectiveAction = String(body.action || req.query?.action || '').trim();

    // ACTION 1: CONVERSATIONAL FOLLOW-UP TUTOR
    if (effectiveAction === 'follow_up' || body.question) {
      const { topic, question, lessonSummary, adaptiveMode } = body;
      if (!question || !String(question).trim()) {
        return sendJsonResponse(res, 400, { error: 'Please enter a follow-up question.' });
      }

      const toneHint =
        adaptiveMode === 'simplify'
          ? 'The student found earlier problems tricky—break everything down gently with plain everyday words before formal equations, and encourage them warmly.'
          : adaptiveMode === 'challenge'
          ? 'The student is excelling—feel free to include sharp JUPEB/university insights and subtle exam traps.'
          : 'Balance intuitive everyday explanations with full WAEC/JAMB/JUPEB rigor.';

      const followUpPrompt = `
You are an extraordinary human STEM & academic teacher conversing 1-on-1 with a student studying "${topic || 'Academic Study'}".
Lesson Context:
${lessonSummary ? String(lessonSummary).slice(0, 1800) : ''}

Student's Follow-up Question:
"${question}"

TEACHING VOICE & RULES:
- Sound like a brilliant, patient, warm human teacher—clear natural English, engaging everyday analogies, occasional light academic humor, and ZERO robotic openings like "As an AI..." or "Great question!".
- ${toneHint}
- Start simple before introducing technical terminology.
- NEVER skip important algebraic, logical, or unit-conversion steps.
- Format all formulas, equations, and powers in standard LaTeX ($...$ and $$...$$). Escape percent signs in LaTeX as \\%.
- End with one quick, encouraging check-for-understanding question.
`.trim();

      const { response } = await generateWithModelFallback(ai, [{ text: followUpPrompt }], {
        timeoutMs: 18000,
      });
      return sendJsonResponse(res, 200, { success: true, reply: response.text?.trim() || '' });
    }

    // ACTION 2: PROGRESSIVE 12-QUESTION GENERATOR UNDER ONE FORMULA
    if (effectiveAction === 'formula_questions') {
      const topic = String(body.topic || '').trim();
      const subject = String(body.subject || 'STEM').trim();
      const examLevel = String(body.examLevel || 'JUPEB, JAMB, WAEC & University').trim();
      const formulaName = String(body.formulaName || '').trim();
      const formulaLatex = String(body.formulaLatex || '').trim();
      const whenToUse = String(body.whenToUse || '').trim();
      const conditions = String(body.conditions || '').trim();
      const symbols = Array.isArray(body.symbols) ? body.symbols : [];
      const existingQuestions: string[] = Array.isArray(body.existingQuestions) ? body.existingQuestions.slice(0, 12) : [];
      const nonce = String(body.nonce || Date.now());

      if (!formulaName && !formulaLatex) {
        return sendJsonResponse(res, 400, { error: 'Formula details are required to generate practice questions.' });
      }

      const symbolText = symbols
        .map((s: any) => `${s.symbol} (${s.meaning}, unit: ${s.siUnit})`)
        .join('; ');

      const prompt = `
You are an expert STEM examiner and teacher creating a rich 12-question drill set under ONE specific formula for "${topic}" (${subject}, level: ${examLevel}).
Uniqueness Seed: ${nonce}

TARGET FORMULA:
- Name: ${formulaName}
- Expression: ${formulaLatex}
- When to use: ${whenToUse}
- Conditions: ${conditions || 'Standard physical/mathematical assumptions'}
- Symbols & Units: ${symbolText}
${existingQuestions.length > 0 ? `- DO NOT REPEAT these already-seen questions:\n${existingQuestions.map((q, i) => `  ${i + 1}. ${q}`).join('\n')}` : ''}

STRICT REQUIREMENTS:
Generate EXACTLY 12 genuinely distinct practice questions:
- 3 with difficulty "Easy"
- 3 with difficulty "Intermediate"
- 3 with difficulty "Difficult"
- 3 with difficulty "Examination-Standard" (realistic JAMB, WAEC, or JUPEB exam questions)

CRITICAL VARIETY RULE:
Do NOT repeat the same sentence structure with changed numbers! Across the 12 questions, cover ALL 6 skillTypes:
1. "Direct Substitution"
2. "Formula Rearrangement" (solving for a different variable in the formula)
3. "Formula Identification" (e.g. comparing conditions to recognize why THIS formula fits vs another)
4. "Unit Conversion" (converting cm/km/h/g/minutes/kJ/etc. to SI units first)
5. "Real-Life Application" (practical engineering, everyday, or lab scenario)
6. "Multi-Step" (combining an intermediate step or two-stage calculation)

MATH & VERIFICATION RULES:
- Verify every arithmetic calculation carefully. Never round mid-calculation carelessly.
- Whenever a question yields a single numerical answer, include BOTH "expectedNumericValue" (clean JS float number in target unit) AND "evaluableExpression" (pure ASCII arithmetic expression evaluating to that number, e.g. "(20^2 * (0.5)^2) / (2 * 9.8)").
- Escape % in LaTeX as \\%. Use $...$ and $$...$$ cleanly.
- Include "whyThisFormula" (1 crisp sentence) explaining why this formula is selected.
- Keep "steps" concise (3–4 short lines with clear arithmetic) and only include "options" & "correctOption" for Multiple-Choice / Formula Identification / Examination-Standard questions (omit "options" for open calculation questions) so all 12 questions generate quickly.

Return ONLY valid JSON:
{
  "formulaName": "${formulaName}",
  "questions": [
    {
      "id": "fq_1",
      "difficulty": "Easy | Intermediate | Difficult | Examination-Standard",
      "skillType": "Direct Substitution | Formula Rearrangement | Formula Identification | Unit Conversion | Real-Life Application | Multi-Step",
      "question": "Full question statement with units and LaTeX",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correctOption": "A",
      "hint": "Helpful conceptual nudge without spoiling final number",
      "formulaUsed": "${formulaLatex}",
      "whyThisFormula": "1 sentence explaining why this formula applies here",
      "steps": ["Given: ...", "Substitution: ...", "Result with unit"],
      "finalAnswer": "\\boxed{...}",
      "expectedNumericValue": 25.5,
      "unit": "m/s",
      "evaluableExpression": ""
    }
  ]
}
Ensure all 12 questions are present!
`.trim();

      const { parsed } = await generateWithModelFallback(ai, [{ text: prompt }], {
        responseMimeType: 'application/json',
        timeoutMs: 24000,
        validateJson: (p) => Array.isArray(p?.questions) && p.questions.length > 0,
      });
      const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
      return sendJsonResponse(res, 200, { success: true, questions });
    }

    // ACTION 3: ADAPTIVE EXPLANATION SIMPLIFIER (WHEN STUDENT STRUGGLES OR ASKS FOR SIMPLER)
    if (effectiveAction === 'adapt_explanation') {
      const topic = String(body.topic || '').trim();
      const subject = String(body.subject || 'STEM').trim();
      const strugglingPoint = String(body.strugglingPoint || topic).trim();
      const mode = String(body.mode || 'simplify');

      if (!topic) {
        return sendJsonResponse(res, 400, { error: 'Topic is required.' });
      }

      const prompt = `
You are a patient, warm human teacher helping a student who is finding "${strugglingPoint}" (inside "${topic}", ${subject}) challenging.
Mode: ${mode === 'challenge' ? 'Level-up challenge with deeper university intuition' : 'Gentle step-by-step beginner simplification'}

Return ONLY valid JSON:
{
  "title": "Plain-language breakdown title",
  "encouragement": "Warm 1-2 sentence human encouragement",
  "simpleAnalogy": "Crystal-clear everyday analogy",
  "stepByStepCore": ["Plain step 1...", "Plain step 2...", "Plain step 3..."],
  "easyCheckQuestion": {
    "question": "A gentle confidence-building question using $...$ LaTeX",
    "hint": "Friendly hint",
    "steps": ["Step 1...", "Step 2..."],
    "finalAnswer": "\\boxed{...}",
    "expectedNumericValue": null,
    "unit": ""
  }
}
`.trim();

      const { parsed: simplified } = await generateWithModelFallback(ai, [{ text: prompt }], {
        responseMimeType: 'application/json',
        timeoutMs: 18000,
        validateJson: (p) => Boolean(p && (p.title || p.encouragement)),
      });
      return sendJsonResponse(res, 200, { success: true, adaptation: simplified });
    }

    // ACTION 4: COMPREHENSIVE UNIVERSAL TOPIC LESSON GENERATOR
    const topic = String(body.topic || body.prompt || '').trim();
    const subjectInput = String(body.subject || 'Auto-Detect').trim();
    const examLevel = String(body.examLevel || 'JUPEB, JAMB, WAEC & University').trim();
    const language = String(body.language || body.preferredLanguage || 'English').trim();
    const adaptiveMode = String(body.adaptiveMode || 'standard');

    if (!topic) {
      return sendJsonResponse(res, 400, {
        error: 'Please enter any subject, topic, formula, concept, or academic question to learn.',
      });
    }

    const subjectRule =
      subjectInput === 'Auto-Detect' || subjectInput === 'All Subjects' || subjectInput === 'General STEM'
        ? 'Identify and return the exact official academic subject (e.g., Mathematics, Physics, Chemistry, Biology, Further Mathematics, English Language, Economics, Geography, Computer Science, Government, Literature, Accounting, etc.).'
        : `Teach strictly within the academic discipline of "${subjectInput}".`;

    const levelTone =
      adaptiveMode === 'simplify'
        ? 'The student has struggled on recent exercises—start extra gently, use clear everyday intuition before formal jargon, and make every algebraic step crystal clear.'
        : adaptiveMode === 'challenge'
        ? 'The student has strong mastery—include deeper derivations, boundary limits, and JUPEB/university-grade exam insights alongside the foundations.'
        : 'Start with simple intuitive language and progressively build up to rigorous WAEC, JAMB, JUPEB, and university concepts.';

    const learnPrompt = `
You are an extraordinary human teacher and academic professor teaching in ${language}.
The student entered: "${topic}"
Target Level: "${examLevel}"
${subjectRule}
${levelTone}

TEACHING VOICE & PEDAGOGY:
- Write like a warm, inspiring human teacher—clear, concise, engaging everyday examples. Never use robotic phrases like "As an AI..." or "In this lesson we will explore...".
- NEVER invent formulas, laws, or facts. Only teach verified scientific/academic formulas and principles.
- Format all equations, fractions, exponents, and chemical formulas cleanly in LaTeX ($...$ and $$...$$). Never leave '%' unescaped in LaTeX (write \\%). Balance all \\left( and \\right).
- KEEP EVERY FIELD CRISP AND HIGH-YIELD (1–2 sentences per description/explanation, 2–3 short calculation lines per worked example step) so the entire JSON lesson loads rapidly without bloat.

MUST-INCLUDE LESSON SECTIONS:
1. COMPLETE TOPIC EXPLANATION:
   - "introduction": engaging 2-sentence human introduction
   - "simpleDefinition": crisp 1-sentence beginner definition
   - "detailedExplanation": 3 crisp progressive paragraphs (simple intuition → core mechanism → exam/university depth)
   - "importantConcepts": 3 bullet takeaways
   - "characteristicsAndProperties": 3 bullet characteristics/properties
   - "typesAndClassifications": 2–3 classifications/types with short description and example
   - "everydayExamples": 2–3 concrete examples from daily life
   - "realWorldAnalogy": vivid 1-sentence relatable mental model
   - "commonExamQuestions": 2–3 typical questions examiners ask + key idea
   - "importantNotes": 2–3 key facts & boundary rules
   - "commonPitfalls": 2–3 frequent student mistakes
   - "summary": 1-sentence wrap-up of the topic

2. FORMULAS OR NON-FORMULA PRINCIPLES:
   - If the topic involves mathematical/scientific formulas: populate "formulas" as an array of 2 to 3 separate objects—one object for EACH core formula (e.g., Projectile Motion: Time of Flight, Maximum Height, Horizontal Range).
   - For EACH formula include: name, latex (KaTeX), symbols (symbol, meaning, siUnit), whenToUse (1 sentence), conditions (1 sentence), and "workedExamplesByLevel" with ONE "simple", ONE "intermediate", and ONE "difficult" worked example (each 2–3 crisp steps, substitution, boxed finalAnswer, 1-sentence explanation).
   - If the topic is non-mathematical: leave "formulas" as [] and populate "principlesAndRules" with 3 core rules/principles.

3. VISUAL TEACHING:
   - Populate "visualConceptModel" (3–4 nodes) and "tables" (1 high-yield table).

4. EXAMINATION MODE QUESTIONS (4 crisp questions):
   - Populate "examModeQuestions" covering JAMB, WAEC, and JUPEB across Multiple-Choice, Theory, Calculation, and Application, with sourceType: "ai-generated".

5. SMART TOPIC NAVIGATION:
   - Populate "topicNavigation" with prerequisites, relatedTopics, advancedTopics, keyFormulasToMaster, and recommendedNextStep.

Return ONLY a valid JSON object matching this exact schema:
{
  "topic": "Descriptive Topic Title",
  "subject": "Detected Academic Subject",
  "targetExamLevel": "${examLevel}",
  "summary": "Concise wrap-up summary",
  "simpleDefinition": "Simple 1-2 sentence definition",
  "introduction": "Engaging human introduction",
  "realWorldAnalogy": "Intuitive everyday analogy",
  "detailedExplanation": ["Beginner foundation...", "Core mechanism...", "Intermediate/Exam depth...", "Advanced nuance..."],
  "importantConcepts": ["Concept 1...", "Concept 2..."],
  "characteristicsAndProperties": ["Property 1...", "Property 2..."],
  "typesAndClassifications": [
    { "name": "Type A", "description": "How it works", "example": "Concrete example" }
  ],
  "everydayExamples": ["Everyday example 1...", "Everyday example 2..."],
  "commonExamQuestions": [
    { "question": "Typical exam prompt...", "examStyle": "WAEC / JAMB / JUPEB", "keyIdea": "What the examiner is testing" }
  ],
  "formulas": [
    {
      "id": "f1",
      "name": "Formula Name",
      "latex": "$$...$$",
      "whenToUse": "When and how to recognize this formula in questions",
      "conditions": "Assumptions and conditions under which it applies",
      "derivationSummary": "Brief origin/rationale",
      "symbols": [
        { "symbol": "$x$", "meaning": "Quantity", "siUnit": "m", "standardValue": "" }
      ],
      "workedExamplesByLevel": {
        "simple": {
          "title": "Simple Worked Example",
          "level": "Simple",
          "problemStatement": "...",
          "givenValues": [{ "name": "...", "symbol": "...", "value": "...", "unit": "..." }],
          "formulaUsed": "$$...$$",
          "substitution": "$$...$$",
          "steps": ["1. ...", "2. ..."],
          "finalAnswer": "\\boxed{...}",
          "unit": "",
          "explanation": "..."
        },
        "intermediate": {
          "title": "Intermediate Worked Example",
          "level": "Intermediate",
          "problemStatement": "...",
          "givenValues": [],
          "formulaUsed": "$$...$$",
          "substitution": "$$...$$",
          "steps": ["1. ...", "2. ..."],
          "finalAnswer": "\\boxed{...}",
          "unit": "",
          "explanation": "..."
        },
        "difficult": {
          "title": "Difficult Worked Example",
          "level": "Difficult",
          "problemStatement": "...",
          "givenValues": [],
          "formulaUsed": "$$...$$",
          "substitution": "$$...$$",
          "steps": ["1. ...", "2. ..."],
          "finalAnswer": "\\boxed{...}",
          "unit": "",
          "explanation": "..."
        }
      }
    }
  ],
  "principlesAndRules": [],
  "visualConceptModel": {
    "kind": "process_flow | reaction | classification | structure",
    "title": "Visual Conceptual Diagram Title",
    "caption": "Short visual takeaway",
    "nodes": [
      { "label": "Stage 1", "symbol": "A", "detail": "What happens here" },
      { "label": "Stage 2", "symbol": "B", "detail": "What happens next" }
    ]
  },
  "tables": [
    {
      "title": "Comparison / Reference Table",
      "headers": ["Item", "Formula / Rule", "Unit / Key Note"],
      "rows": [["...", "...", "..."]]
    }
  ],
  "workedExamples": [],
  "importantNotes": ["Key fact 1", "Key fact 2"],
  "commonPitfalls": ["Common mistake 1", "Common mistake 2"],
  "practiceQuestions": [],
  "examModeQuestions": [
    {
      "id": "em1",
      "examBody": "JAMB",
      "questionType": "Multiple-Choice",
      "difficulty": "Intermediate",
      "sourceType": "ai-generated",
      "question": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correctAnswer": "A",
      "formula": "$$...$$",
      "whyFormula": "...",
      "hint": "...",
      "steps": ["..."],
      "finalAnswer": "\\boxed{...}",
      "unit": ""
    },
    {
      "id": "em2",
      "examBody": "WAEC",
      "questionType": "Theory",
      "difficulty": "Difficult",
      "sourceType": "ai-generated",
      "question": "...",
      "formula": "$$...$$",
      "whyFormula": "...",
      "hint": "...",
      "steps": ["..."],
      "finalAnswer": "...",
      "markingPoints": ["1 mark for stating law", "2 marks for correct substitution and unit"]
    },
    {
      "id": "em3",
      "examBody": "JUPEB",
      "questionType": "Calculation",
      "difficulty": "Difficult",
      "sourceType": "ai-generated",
      "question": "...",
      "formula": "$$...$$",
      "whyFormula": "...",
      "hint": "...",
      "steps": ["..."],
      "finalAnswer": "\\boxed{...}",
      "unit": ""
    },
    {
      "id": "em4",
      "examBody": "JAMB",
      "questionType": "Conceptual",
      "difficulty": "Easy",
      "sourceType": "ai-generated",
      "question": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correctAnswer": "B",
      "formula": "",
      "whyFormula": "...",
      "hint": "...",
      "steps": ["..."],
      "finalAnswer": "..."
    },
    {
      "id": "em5",
      "examBody": "WAEC",
      "questionType": "Application",
      "difficulty": "Intermediate",
      "sourceType": "ai-generated",
      "question": "...",
      "formula": "$$...$$",
      "whyFormula": "...",
      "hint": "...",
      "steps": ["..."],
      "finalAnswer": "\\boxed{...}",
      "unit": ""
    }
  ],
  "topicNavigation": {
    "prerequisites": ["Prerequisite Topic 1", "Prerequisite Topic 2"],
    "relatedTopics": ["Related Topic 1", "Related Topic 2"],
    "advancedTopics": ["Advanced Topic 1", "Advanced Topic 2"],
    "keyFormulasToMaster": ["Core Formula 1", "Core Formula 2"],
    "recommendedNextStep": "Actionable study recommendation"
  },
  "suggestedFollowUps": [
    "Why does this formula fail if its main assumption is broken?",
    "Walk me through another multi-step JUPEB exam question on this.",
    "Give me a quick memory trick for remembering every symbol and unit."
  ]
}
`.trim();

    const { parsed: parsedLesson } = await generateWithModelFallback(ai, [{ text: learnPrompt }], {
      responseMimeType: 'application/json',
      timeoutMs: 25000,
      validateJson: (p) => Boolean(p && typeof p === 'object' && (p.topic || p.introduction || p.summary)),
    });
    if (!parsedLesson.topic) parsedLesson.topic = topic;
    if (!parsedLesson.subject) parsedLesson.subject = subjectInput === 'Auto-Detect' ? 'General STEM' : subjectInput;
    if (!parsedLesson.targetExamLevel) parsedLesson.targetExamLevel = examLevel;
    parsedLesson.timestamp = Date.now();

    return sendJsonResponse(res, 200, { success: true, lesson: parsedLesson });
  } catch (error: any) {
    console.error('API /api/learn error:', error);
    const rawMsg = error?.message || String(error);
    const is503 = rawMsg.includes('503') || rawMsg.includes('high demand') || rawMsg.includes('UNAVAILABLE');
    return sendJsonResponse(res, is503 ? 503 : 500, {
      error: is503
        ? 'The AI academic tutor is currently experiencing temporary high demand. Please tap Retry in a few seconds.'
        : rawMsg || 'Failed to generate academic lesson. Please tap Retry.',
    });
  }
}
