/**
 * SmartSolve AI - ChatGPT Advanced Voice Mode Engine
 * Provides natural, fluent, expressive, human-like voice synthesis with:
 * - Curated voice personas (Breeze, Cove, Ember, Juniper, Sol, Amara, Chidi)
 * - Deep neural / natural voice scoring (Siri, Google Natural, Microsoft Natural, Apple Premium)
 * - Intelligent math, science & markdown phonetic prosody preprocessor
 * - Natural breathing pauses, pacing, and human cadence
 * - Immediate interruptibility, seeking, rewind (-5s), fast-forward (+5s)
 */

export interface VoicePersona {
  id: string;
  name: string;
  gender: 'female' | 'male';
  tagline: string;
  description: string;
  emoji: string;
  accent: string;
  accentCode: string;
  pitch: number;
  rate: number;
  preferredKeywords: string[];
  sampleGreeting: string;
}

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'breeze',
    name: 'Breeze',
    gender: 'female',
    tagline: 'Warm, articulate & natural',
    description: 'Expressive and friendly with natural conversational flow (like ChatGPT Breeze)',
    emoji: '🌸',
    accent: 'American / Global',
    accentCode: 'en-US',
    pitch: 1.0,
    rate: 1.0,
    preferredKeywords: [
      'natural', 'siri', 'ava', 'samantha', 'jenny', 'aria', 'google us',
      'neural', 'premium', 'enhanced', 'female', 'victoria'
    ],
    sampleGreeting: "Hey! I'm ready whenever you are. Let's dig into whatever you're working on!",
  },
  {
    id: 'cove',
    name: 'Cove',
    gender: 'male',
    tagline: 'Calm, grounded & thoughtful',
    description: 'Relaxed, resonant, and clear explanations (like ChatGPT Cove)',
    emoji: '🌊',
    accent: 'American / Global',
    accentCode: 'en-US',
    pitch: 0.98,
    rate: 0.98,
    preferredKeywords: [
      'natural', 'siri', 'guy', 'david', 'daniel', 'christopher', 'google us',
      'neural', 'premium', 'enhanced', 'male', 'oliver'
    ],
    sampleGreeting: "Hey there. Take your time, walk me through what you have, and we'll break it down together.",
  },
  {
    id: 'ember',
    name: 'Ember',
    gender: 'male',
    tagline: 'Dynamic, confident & engaging',
    description: 'Upbeat and punchy with enthusiastic conversational cadence (like ChatGPT Ember)',
    emoji: '🔥',
    accent: 'American / British',
    accentCode: 'en-US',
    pitch: 1.0,
    rate: 1.05,
    preferredKeywords: [
      'natural', 'siri', 'alex', 'guy', 'arthur', 'mark', 'google uk',
      'neural', 'premium', 'enhanced', 'male', 'steffan'
    ],
    sampleGreeting: "Alright, let's do this! What problem are we tackling today?",
  },
  {
    id: 'juniper',
    name: 'Juniper',
    gender: 'female',
    tagline: 'Upbeat, witty & encouraging',
    description: 'Bright, cheerful, and insightful with a touch of wit (like ChatGPT Juniper)',
    emoji: '✨',
    accent: 'American / Global',
    accentCode: 'en-US',
    pitch: 1.02,
    rate: 1.02,
    preferredKeywords: [
      'natural', 'siri', 'karen', 'moira', 'michelle', 'emma', 'google uk',
      'neural', 'premium', 'enhanced', 'female', 'zoe'
    ],
    sampleGreeting: "Hi! Ready when you are. Ask me anything, or drop a photo or voice note and let's jump right in!",
  },
  {
    id: 'sol',
    name: 'Sol',
    gender: 'female',
    tagline: 'Smooth, balanced & serene',
    description: 'Balanced, clear, and easy to follow through complex STEM derivations (like ChatGPT Sol)',
    emoji: '☀️',
    accent: 'Global English',
    accentCode: 'en-US',
    pitch: 1.0,
    rate: 0.98,
    preferredKeywords: [
      'natural', 'siri', 'allison', 'susan', 'serena', 'google',
      'neural', 'premium', 'enhanced', 'female'
    ],
    sampleGreeting: "Hello! I'm here to help. Whether it's math, physics, coding, or just casual questions, let's explore it.",
  },
  {
    id: 'amara',
    name: 'Amara',
    gender: 'female',
    tagline: 'Warm & authentic Nigerian English',
    description: 'Vibrant, fluent Nigerian & West African conversational English cadence',
    emoji: '🇳🇬',
    accent: 'Nigerian English',
    accentCode: 'en-NG',
    pitch: 1.0,
    rate: 1.0,
    preferredKeywords: [
      'nigeria', 'ng', 'en-ng', 'african', 'natural', 'siri', 'ava',
      'female', 'google'
    ],
    sampleGreeting: "Hello! How are you doing today? Let's solve whatever question you have—math, physics, exam prep, anything at all!",
  },
  {
    id: 'chidi',
    name: 'Chidi',
    gender: 'male',
    tagline: 'Resonant & authentic Nigerian English',
    description: 'Articulate, friendly Nigerian & West African conversational male voice',
    emoji: '🇳🇬',
    accent: 'Nigerian English',
    accentCode: 'en-NG',
    pitch: 0.96,
    rate: 1.0,
    preferredKeywords: [
      'nigeria', 'ng', 'en-ng', 'african', 'natural', 'siri', 'guy',
      'male', 'google'
    ],
    sampleGreeting: "Welcome! Tell me what problem or formula you want to tackle, and we'll walk through it step-by-step.",
  },
];

/**
 * Advanced voice scoring algorithm:
 * Ranks all installed OS voices to pick the highest fidelity neural / natural voice.
 */
export function scoreAndSelectVoice(
  voices: SpeechSynthesisVoice[],
  persona: VoicePersona,
  customVoiceURI?: string,
  targetLanguageCode?: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // 1. Explicit user override
  if (customVoiceURI) {
    const exact = voices.find((v) => v.voiceURI === customVoiceURI);
    if (exact) return exact;
  }

  const isFemale = persona.gender === 'female';
  const targetKeywords = persona.preferredKeywords;

  // Resolve target language: use explicit targetLanguageCode if provided, else persona accentCode
  const effectiveLang = (targetLanguageCode || persona.accentCode || 'en-US')
    .toLowerCase()
    .replace('_', '-');
  const targetPrefix = effectiveLang.split('-')[0];
  const isNonEnglishTarget = targetPrefix !== 'en';

  // Keywords that denote ultra-high-quality neural synthesis
  const highQualityKeywords = [
    'natural', 'neural', 'online', 'premium', 'enhanced', 'siri',
    'studio', 'wavenet', 'neural2', 'google'
  ];

  // Robotic / legacy synthesizers to avoid if better voices exist
  const lowQualityKeywords = ['espeak', 'compact', 'desktop', 'classic', 'synthesizer'];

  let bestVoice: SpeechSynthesisVoice | null = null;
  let highestScore = -Infinity;

  for (const voice of voices) {
    let score = 0;
    const voiceName = voice.name.toLowerCase();
    const voiceLang = voice.lang.toLowerCase().replace('_', '-');
    const voicePrefix = voiceLang.split('-')[0];

    // Language matching
    if (voiceLang === effectiveLang) {
      score += 2500;
    } else if (voicePrefix === targetPrefix) {
      score += 1800;
    } else if (isNonEnglishTarget) {
      // Heavily penalize English or mismatched language when user explicitly selected Spanish/French/etc.
      score -= 2000;
    } else if (voicePrefix === 'en') {
      score += 300;
    }

    // High quality neural bonuses
    for (const kw of highQualityKeywords) {
      if (voiceName.includes(kw)) {
        score += 800;
      }
    }

    // Persona-specific preference matches
    for (const kw of targetKeywords) {
      if (voiceName.includes(kw)) {
        score += 500;
      }
    }

    // Gender suitability
    const hasFemaleMarkers = /female|woman|girl|samantha|victoria|karen|zira|jenny|ava|moira|fiona|zoe|allison|kendra/i.test(voiceName);
    const hasMaleMarkers = /male|man|boy|david|daniel|george|guy|mark|alex|fred|bruce|tom|arthur|oliver/i.test(voiceName);

    if (isFemale) {
      if (hasFemaleMarkers) score += 600;
      if (hasMaleMarkers) score -= 900;
    } else {
      if (hasMaleMarkers) score += 600;
      if (hasFemaleMarkers) score -= 900;
    }

    // Penalize low quality or robotic synthesizers
    for (const kw of lowQualityKeywords) {
      if (voiceName.includes(kw)) {
        score -= 1000;
      }
    }

    // Local / default device voices
    if (voice.default) {
      score += 50;
    }

    if (score > highestScore) {
      highestScore = score;
      bestVoice = voice;
    }
  }

  // If a non-English target language was requested, verify if we found a voice matching that prefix
  if (isNonEnglishTarget && bestVoice) {
    const bestPrefix = bestVoice.lang.toLowerCase().replace('_', '-').split('-')[0];
    if (bestPrefix !== targetPrefix) {
      // Find ANY voice matching the language prefix
      const match = voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix));
      if (match) return match;
    }
  }

  return bestVoice || voices[0] || null;
}

/**
 * Converts mathematical formulas, STEM symbols, and Markdown into natural,
 * fluent human speech, avoiding robotic literal readings.
 */
export function convertTextToConversationalSpeech(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Remove code blocks cleanly and replace with a natural human transition
  text = text.replace(/```[a-zA-Z]*\n([\s\S]*?)```/g, (_match, code) => {
    const lines = code.trim().split('\n');
    return ` Here is the code snippet with ${lines.length} lines. `;
  });

  // 2. Remove inline code backticks
  text = text.replace(/`([^`]+)`/g, '$1');

  // 3. LaTeX Display math: $$\frac{-b \pm \sqrt{b^2-4ac}}{2a}$$
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, math) => {
    return ' ' + convertMathFormulaToSpeech(math) + ' ';
  });

  // 4. LaTeX Inline math: $x^2 + 5x = 0$
  text = text.replace(/\$([^\$]+)\$/g, (_match, math) => {
    return ' ' + convertMathFormulaToSpeech(math) + ' ';
  });

  // 5. Clean stand-alone math formulas
  text = convertMathFormulaToSpeech(text);

  // 6. Natural conversational replacements for bullet points and lists
  text = text.replace(/^(\s*)[-*+]\s+/gm, 'Also, ');
  text = text.replace(/^(\s*)\d+\.\s+/gm, 'Next, ');

  // 7. Strip markdown headers, bold, italics, strikethroughs, blockquotes
  text = text.replace(/#{1,6}\s+/g, '');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/~~([^~]+)~~/g, '$1');
  text = text.replace(/^\s*>\s+/gm, '');

  // 8. Clean up extra spaces, line breaks, and punctuation
  text = text.replace(/\r\n|\r|\n/g, ' ');
  text = text.replace(/\s+/g, ' ');

  // 9. Add natural conversational breathing pauses around clauses
  text = text.replace(/([.?!])\s+/g, '$1 ... ');
  text = text.replace(/([,;])\s+/g, '$1 ');

  return text.trim();
}

/**
 * Phonetically translates mathematical expressions to spoken English.
 */
function convertMathFormulaToSpeech(math: string): string {
  let m = math;

  // Fractions: \frac{a}{b} -> "a over b"
  m = m.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1 over $2');
  m = m.replace(/\\frac\s*(\w)\s*(\w)/g, '$1 over $2');

  // Square roots: \sqrt{x} -> "square root of x", \sqrt[3]{x} -> "cube root of x"
  m = m.replace(/\\sqrt\[3\]\{([^{}]+)\}/g, 'cube root of $1');
  m = m.replace(/\\sqrt\{([^{}]+)\}/g, 'square root of $1');

  // Exponents: x^2 -> "x squared", x^3 -> "x cubed", x^n -> "x to the power of n"
  m = m.replace(/([a-zA-Z0-9]+)\^2\b/g, '$1 squared');
  m = m.replace(/([a-zA-Z0-9]+)\^3\b/g, '$1 cubed');
  m = m.replace(/([a-zA-Z0-9]+)\^\{([^{}]+)\}/g, '$1 to the power of $2');
  m = m.replace(/([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '$1 to the power of $2');

  // Common physics & math symbols
  m = m.replace(/\\times/g, ' times ');
  m = m.replace(/\\cdot/g, ' times ');
  m = m.replace(/\\div/g, ' divided by ');
  m = m.replace(/\\pm/g, ' plus or minus ');
  m = m.replace(/\\mp/g, ' minus or plus ');
  m = m.replace(/\\approx/g, ' is approximately ');
  m = m.replace(/\\neq/g, ' is not equal to ');
  m = m.replace(/\\leq/g, ' is less than or equal to ');
  m = m.replace(/\\geq/g, ' is greater than or equal to ');
  m = m.replace(/\\le\b/g, ' is less than or equal to ');
  m = m.replace(/\\ge\b/g, ' is greater than or equal to ');
  m = m.replace(/\\infty/g, ' infinity ');
  m = m.replace(/\\pi/g, ' pi ');
  m = m.replace(/\\theta/g, ' theta ');
  m = m.replace(/\\alpha/g, ' alpha ');
  m = m.replace(/\\beta/g, ' beta ');
  m = m.replace(/\\lambda/g, ' lambda ');
  m = m.replace(/\\Delta/g, ' change in ');
  m = m.replace(/\\mu/g, ' micro ');
  m = m.replace(/\\sigma/g, ' sigma ');
  m = m.replace(/\\omega/g, ' omega ');
  m = m.replace(/\\int/g, ' the integral of ');
  m = m.replace(/\\sum/g, ' the sum of ');
  m = m.replace(/\\boxed\{([^{}]+)\}/g, '$1');

  // Units
  m = m.replace(/\bm\/s\^2\b/g, ' meters per second squared ');
  m = m.replace(/\bm\/s\b/g, ' meters per second ');
  m = m.replace(/\bkm\/h\b/g, ' kilometers per hour ');
  m = m.replace(/\bkg\b/g, ' kilograms ');
  m = m.replace(/\bcm\b/g, ' centimeters ');
  m = m.replace(/\bmm\b/g, ' millimeters ');

  // Chemistry notation
  m = m.replace(/\bH2O\b/g, ' H 2 O ');
  m = m.replace(/\bCO2\b/g, ' C O 2 ');

  // Clean remaining backslashes
  m = m.replace(/\\([a-zA-Z]+)/g, '$1');

  return m;
}

/**
 * Splits text into fluent, human-paced speech chunks.
 * Keeps sentences conversational and easy to scrub, seek, rewind, and forward.
 */
export function splitSpeechChunks(rawText: string): string[] {
  const speechReady = convertTextToConversationalSpeech(rawText);
  if (!speechReady) return [];

  // Split on natural sentence endings or pauses
  const rawParts = speechReady.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/);
  const chunks: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // If a sentence is very long, split at major commas or conjunctions for fluid breathing rhythm
    if (trimmed.length > 140) {
      const subParts = trimmed.split(/(?<=[,;])\s+(?=[a-zA-Z])/);
      for (const sp of subParts) {
        const spTrimmed = sp.trim();
        if (spTrimmed) chunks.push(spTrimmed);
      }
    } else {
      chunks.push(trimmed);
    }
  }

  return chunks.length > 0 ? chunks : [speechReady];
}
