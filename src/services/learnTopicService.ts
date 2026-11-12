import { LearnTopicLesson } from '../types';
import { detectAndGenerateDiagram } from './aiDiagramDetector';

const STORAGE_KEY = 'smartsolve_recent_lessons';

export interface LearnTopicParams {
  topic: string;
  subject?: string;
  examLevel?: string;
  language?: string;
  userApiKey?: string;
}

/**
 * Saves completed lesson to local storage for quick revision
 */
export function saveLessonToHistory(lesson: LearnTopicLesson): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: LearnTopicLesson[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((item) => item.topic.toLowerCase() !== lesson.topic.toLowerCase());
    filtered.unshift({ ...lesson, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 20)));
  } catch {
    // ignore
  }
}

export function getSavedLessons(): LearnTopicLesson[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Fetches a comprehensive lesson from the AI academic tutor
 */
export async function fetchTopicLesson(params: LearnTopicParams): Promise<LearnTopicLesson> {
  const { topic, subject = 'General STEM', examLevel = 'JUPEB, JAMB, WAEC & University', language = 'English', userApiKey } = params;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userApiKey) {
    headers['x-gemini-key'] = userApiKey;
  }

  let response: Response;
  try {
    response = await fetch('/api/learn', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        topic,
        subject,
        examLevel,
        language,
      }),
    });

    if (response.status === 404) {
      response = await fetch('/api/ai/learn', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic,
          subject,
          examLevel,
          language,
        }),
      });
    }
  } catch (netErr: any) {
    // If network fails (e.g., offline mode), check curated offline database
    const offlineLesson = getOfflineCuratedLesson(topic, subject, examLevel);
    if (offlineLesson) {
      return offlineLesson;
    }
    throw new Error('Unable to connect to AI Tutor. Please check your internet connection or try again.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    // Check if offline curated lesson can help
    const offlineFallback = getOfflineCuratedLesson(topic, subject, examLevel);
    if (offlineFallback) {
      return offlineFallback;
    }
    throw new Error(errData.error || `Academic Tutor error (${response.status})`);
  }

  const data = await response.json();
  if (!data.lesson) {
    throw new Error('No lesson data returned from the AI academic tutor.');
  }

  const lesson: LearnTopicLesson = data.lesson;
  saveLessonToHistory(lesson);
  return lesson;
}

/**
 * Ask a follow-up clarification question to the AI Academic Tutor
 */
export async function askTopicFollowUp(
  topic: string,
  question: string,
  lessonSummary: string,
  userApiKey?: string
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userApiKey) {
    headers['x-gemini-key'] = userApiKey;
  }

  const response = await fetch('/api/learn/follow-up', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      topic,
      question,
      lessonSummary,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to get follow-up clarification.');
  }

  const data = await response.json();
  return data.reply || 'Tutor response unavailable.';
}

/**
 * High-yield curated offline lessons for instant study and offline resilience
 */
function getOfflineCuratedLesson(topic: string, subject: string, examLevel: string): LearnTopicLesson | null {
  const lower = topic.toLowerCase();

  // 1. Circle Geometry & Chord Perpendicular Distance
  if (lower.includes('circle') || lower.includes('chord') || lower.includes('tangent')) {
    const lesson: LearnTopicLesson = {
      topic: 'Circle Geometry: Chords, Tangents & Perpendicular Distances',
      subject: 'Mathematics',
      targetExamLevel: examLevel,
      summary: 'Master circle theorems, chord properties, perpendicular distances from the center, and tangent-radius relationships.',
      introduction:
        'Circle geometry is a foundational pillar of high-school and university Euclidean mathematics. A circle consists of all points equidistant from a fixed center O. Key properties govern the relationship between radii, chords, secants, and tangents.',
      realWorldAnalogy:
        'Imagine a pizza sliced with a single straight knife cut that doesn’t pass through the center. That cut is a chord. A line drawn straight from the center point of the pizza to meet that slice at a 90° angle will always divide the slice into two perfectly identical halves.',
      detailedExplanation: [
        'Theorem 1 (Perpendicular Chord Bisector): The perpendicular line drawn from the center of a circle to a chord bisects the chord. Conversely, the line joining the center of a circle to the midpoint of a chord is perpendicular to the chord.',
        'Pythagorean Right Triangle in Circles: By joining the center O to one endpoint of the chord (radius r), and dropping a perpendicular OM of distance d to the chord AB of length L, a right-angled triangle \\Delta OMB is formed where the hypotenuse is r, one leg is the perpendicular distance d, and the other leg is the half-chord \\frac{L}{2}.',
        'Theorem 2 (Tangents and Radii): A tangent to a circle is perpendicular to the radius drawn to the point of contact. Furthermore, tangents drawn from an external point to a circle are equal in length.',
      ],
      formulas: [
        {
          name: 'Chord Perpendicular Distance Formula',
          latex: '$$r^2 = d^2 + \\left(\\frac{L}{2}\\right)^2 \\iff d = \\sqrt{r^2 - \\left(\\frac{L}{2}\\right)^2}$$',
          whenToUse: 'When given the radius r and chord length L, or when calculating the distance from the circle center to any chord.',
          derivationSummary: 'Direct application of Pythagoras theorem on \\Delta OMB with hypotenuse OB = r, base MB = L/2, and altitude OM = d.',
          symbols: [
            { symbol: '$r$', meaning: 'Radius of the circle', siUnit: 'm (or cm)' },
            { symbol: '$d$', meaning: 'Perpendicular distance from center O to chord AB', siUnit: 'm (or cm)' },
            { symbol: '$L$', meaning: 'Total length of the chord AB', siUnit: 'm (or cm)' },
          ],
        },
        {
          name: 'Length of Chord from Subtended Angle',
          latex: '$$L = 2r \\sin\\left(\\frac{\\theta}{2}\\right)$$',
          whenToUse: 'When the angle subtended by the chord at the circle center \\theta is known.',
          symbols: [
            { symbol: '$L$', meaning: 'Chord length', siUnit: 'cm' },
            { symbol: '$r$', meaning: 'Radius', siUnit: 'cm' },
            { symbol: '$\\theta$', meaning: 'Angle subtended at center O', siUnit: 'degrees or radians' },
          ],
        },
      ],
      tables: [
        {
          title: 'Circle Theorem Summary for WAEC, JAMB & JUPEB',
          headers: ['Theorem', 'Geometric Condition', 'Mathematical Relation'],
          rows: [
            ['Perpendicular to Chord', 'OM \\perp AB at midpoint M', 'AM = MB = \\frac{1}{2}AB'],
            ['Angle at Center', 'Arc subtends \\angle AOB at center and \\angle APB at circumference', '\\angle AOB = 2\\angle APB'],
            ['Angles in Same Segment', 'Two angles subtended by same chord', '\\angle APB = \\angle AQB'],
            ['Angle in Semicircle', 'Diameter subtends angle at circumference', '\\angle APB = 90^\\circ'],
            ['Tangent & Radius', 'Tangent at T meets radius OT', 'OT \\perp PT \\implies \\angle OTP = 90^\\circ'],
          ],
        },
      ],
      diagram: {
        id: 'diag_circle_chord',
        type: 'circle_geometry',
        title: 'Circle Geometry: Radius, Chord & Perpendicular Distance',
        topic: 'Circle Geometry',
        caption: 'Circle with center O, radius r = 14 cm, chord AB = 20 cm, and perpendicular altitude OM = 9.80 cm.',
        givenParameters: { radius: '14 cm', chord: '20 cm', distance: '9.80 cm' },
        data: {
          circle: {
            centerLabel: 'O',
            radius: 14,
            subtype: 'chord_distance',
            chordDistance: {
              radius: 14,
              chordLength: 20,
              perpendicularDistance: 9.8,
              chordLabel: 'AB = 20 cm',
              midpointLabel: 'M',
              centerLabel: 'O',
              unit: 'cm',
            },
          },
        },
      },
      workedExamples: [
        {
          title: 'WAEC / JAMB Standard Question',
          problemStatement:
            'A circle has a radius of 14 cm and center O. A chord AB is 20 cm long. Calculate the perpendicular distance from the center O to the chord AB. Take \\pi = \\frac{22}{7} where necessary.',
          givenValues: [
            { name: 'Radius of circle', symbol: 'r', value: '14', unit: 'cm' },
            { name: 'Length of chord AB', symbol: 'L', value: '20', unit: 'cm' },
          ],
          formulaUsed: '$$d = \\sqrt{r^2 - \\left(\\frac{L}{2}\\right)^2}$$',
          substitution: '$$d = \\sqrt{14^2 - \\left(\\frac{20}{2}\\right)^2} = \\sqrt{196 - 100}$$',
          steps: [
            '1. State given quantities: radius $r = 14\\text{ cm}$, chord $AB = 20\\text{ cm}$.',
            '2. The perpendicular from center O to chord AB bisects the chord at M. Therefore: $$MB = \\frac{AB}{2} = \\frac{20}{2} = 10\\text{ cm}$$',
            '3. Triangle \\Delta OMB is a right-angled triangle with hypotenuse $OB = r = 14\\text{ cm}$, leg $MB = 10\\text{ cm}$, and perpendicular $OM = d$.',
            '4. Apply Pythagoras theorem: $$OM^2 + MB^2 = OB^2 \\implies d^2 + 10^2 = 14^2$$',
            '5. Solve for $d$: $$d^2 = 196 - 100 = 96$$',
            '6. Extract square root: $$d = \\sqrt{96} = 4\\sqrt{6} \\approx 9.797959\\text{ cm} \\approx 9.80\\text{ cm}$$',
          ],
          finalAnswer: '\\boxed{d = 4\\sqrt{6}\\text{ cm} \\approx 9.80\\text{ cm}}',
          unit: 'cm',
          explanation:
            'The perpendicular distance represents the shortest straight-line distance from the center to any point along the chord.',
        },
      ],
      importantNotes: [
        'The perpendicular from the center of a circle to a chord ALWAYS bisects the chord into two equal halves.',
        'Chords that are equidistant from the center are equal in length ($d_1 = d_2 \\iff L_1 = L_2$).',
        'The longest chord in any circle is the diameter ($L_{\\max} = 2r$), which has a perpendicular distance of $d = 0$.',
      ],
      commonPitfalls: [
        'Forgetting to divide the chord length by 2 before squaring in the Pythagorean formula ($14^2 - 20^2$ gives a negative number).',
        'Confusing the chord length with arc length ($L_{\\text{chord}} \\neq s = r\\theta$).',
      ],
      practiceQuestions: [
        {
          id: 'pq1',
          question:
            'A chord of length 24 cm is at a distance of 5 cm from the center of a circle. What is the radius of the circle?',
          difficulty: 'Medium',
          hint: 'Use $r = \\sqrt{d^2 + (L/2)^2}$ where $d = 5\\text{ cm}$ and $L/2 = 12\\text{ cm}$.',
          solution: [
            'Half chord: $12\\text{ cm}$.',
            'Pythagoras: $r^2 = 5^2 + 12^2 = 25 + 144 = 169$.',
            'Radius: $r = \\sqrt{169} = 13\\text{ cm}$.',
          ],
          finalAnswer: '\\boxed{r = 13\\text{ cm}}',
        },
        {
          id: 'pq2',
          question:
            'Two parallel chords in a circle of radius 10 cm have lengths 12 cm and 16 cm. If they lie on opposite sides of the center, calculate the distance between them.',
          difficulty: 'Challenging (JUPEB/University)',
          hint: 'Calculate the perpendicular distance from the center to each chord separately, then add the distances.',
          solution: [
            'For chord 1 (12 cm): $d_1 = \\sqrt{10^2 - 6^2} = \\sqrt{64} = 8\\text{ cm}$.',
            'For chord 2 (16 cm): $d_2 = \\sqrt{10^2 - 8^2} = \\sqrt{36} = 6\\text{ cm}$.',
            'Since chords lie on opposite sides of center: Distance $= d_1 + d_2 = 8 + 6 = 14\\text{ cm}$.',
          ],
          finalAnswer: '\\boxed{14\\text{ cm}}',
        },
      ],
      suggestedFollowUps: [
        'How do I solve when two parallel chords are on the SAME side of the center?',
        'Can you explain the Alternate Segment Theorem with an example?',
        'Show how to calculate the area of the minor segment formed by this chord.',
      ],
    };
    return lesson;
  }

  // 2. Projectile Motion at an Angle
  if (lower.includes('projectile') || lower.includes('trajectory')) {
    const lesson: LearnTopicLesson = {
      topic: 'Projectile Motion at an Angle',
      subject: 'Physics',
      targetExamLevel: examLevel,
      summary: 'Two-dimensional kinematic motion under constant gravitational acceleration neglecting air resistance.',
      introduction:
        'Projectile motion is the 2D curved path (parabola) traced by an object launched into the air under the sole influence of gravity. The horizontal motion proceeds at constant velocity, while the vertical motion experiences constant downward acceleration $g = 9.8\\text{ m/s}^2$.',
      realWorldAnalogy:
        'Think of tossing a basketball to a teammate. While the ball travels steadily forward across the floor, gravity pulls it upward to a stop and drops it back down. The two movements happen at the same time completely independent of each other.',
      detailedExplanation: [
        'Principle of Independence of Orthogonal Motions: Galileo discovered that the horizontal motion and vertical motion of a projectile do not affect each other. They share only one variable: elapsed time $t$.',
        'Horizontal Component: Since there is no horizontal acceleration ($a_x = 0$), the horizontal velocity remains constant throughout: $$u_x = u\\cos\\theta$$',
        'Vertical Component: Gravity exerts downward acceleration ($a_y = -g$). The vertical velocity decreases to zero at the peak and reverses: $$u_y = u\\sin\\theta - gt$$',
      ],
      formulas: [
        {
          name: 'Time of Flight (T)',
          latex: '$$T = \\frac{2u\\sin\\theta}{g}$$',
          whenToUse: 'When finding total elapsed time from launch to landing on level ground.',
          symbols: [
            { symbol: '$T$', meaning: 'Total time of flight', siUnit: 's' },
            { symbol: '$u$', meaning: 'Initial launch speed', siUnit: 'm/s' },
            { symbol: '$\\theta$', meaning: 'Launch angle with horizontal', siUnit: 'degrees' },
            { symbol: '$g$', meaning: 'Acceleration due to gravity ($9.8\\text{ m/s}^2$)', siUnit: 'm/s²' },
          ],
        },
        {
          name: 'Maximum Height ($H_{\\max}$)',
          latex: '$$H_{\\max} = \\frac{u^2 \\sin^2\\theta}{2g}$$',
          whenToUse: 'When determining the highest vertical point reached by the projectile.',
          symbols: [
            { symbol: '$H_{\\max}$', meaning: 'Maximum vertical altitude', siUnit: 'm' },
            { symbol: '$u$', meaning: 'Launch velocity', siUnit: 'm/s' },
            { symbol: '$\\theta$', meaning: 'Launch angle', siUnit: 'degrees' },
          ],
        },
        {
          name: 'Horizontal Range (R)',
          latex: '$$R = \\frac{u^2 \\sin 2\\theta}{g}$$',
          whenToUse: 'When determining total horizontal ground distance covered on level terrain.',
          symbols: [
            { symbol: '$R$', meaning: 'Horizontal range', siUnit: 'm' },
            { symbol: '$\\theta$', meaning: 'Launch angle (Maximum range occurs at $\\theta = 45^\\circ$)', siUnit: 'degrees' },
          ],
        },
      ],
      tables: [
        {
          title: 'Kinematics Breakdown: Horizontal vs Vertical',
          headers: ['Parameter', 'Horizontal Axis (X)', 'Vertical Axis (Y)'],
          rows: [
            ['Acceleration', '$a_x = 0$', '$a_y = -g = -9.8\\text{ m/s}^2$'],
            ['Initial Velocity', '$u_x = u\\cos\\theta$', '$u_y = u\\sin\\theta$'],
            ['Velocity at time t', '$v_x = u\\cos\\theta$ (constant)', '$v_y = u\\sin\\theta - gt$'],
            ['Displacement', '$x = (u\\cos\\theta)t$', '$y = (u\\sin\\theta)t - \\frac{1}{2}gt^2$'],
            ['Peak Condition', 'Velocity still equals $u\\cos\\theta$', '$v_y = 0$ at peak'],
          ],
        },
      ],
      graphs: [
        {
          id: 'proj_graph_1',
          title: 'Projectile Trajectory (Y vs X)',
          category: 'physics',
          graphType: 'projectile_motion',
          xAxis: { label: 'Horizontal Distance x', unit: 'm', min: 0, max: 80, step: 10 },
          yAxis: { label: 'Vertical Height y', unit: 'm', min: 0, max: 25, step: 5 },
          curves: [
            {
              id: 'parabola',
              label: 'Trajectory y(x)',
              color: '#10B981',
              type: 'function',
              fnExpression: 'x * Math.tan(45 * Math.PI / 180) - (9.8 * x * x) / (2 * 28 * 28 * Math.cos(45 * Math.PI / 180) ** 2)',
            },
          ],
          keyPoints: [
            { x: 0, y: 0, label: 'Launch (0,0)', type: 'intercept' },
            { x: 40, y: 20, label: 'Apex H_max', type: 'max' },
            { x: 80, y: 0, label: 'Landing R_max', type: 'root' },
          ],
        },
      ],
      workedExamples: [
        {
          title: 'WAEC / JAMB Projectile Calculation',
          problemStatement:
            'A ball is kicked from ground level with an initial velocity of $20\\text{ m/s}$ at an angle of $30^\\circ$ to the horizontal. Taking $g = 10\\text{ m/s}^2$, calculate: (a) Time of flight, (b) Maximum height reached, (c) Horizontal range.',
          givenValues: [
            { name: 'Initial speed', symbol: 'u', value: '20', unit: 'm/s' },
            { name: 'Launch angle', symbol: '\\theta', value: '30', unit: 'degrees' },
            { name: 'Gravity', symbol: 'g', value: '10', unit: 'm/s²' },
          ],
          formulaUsed: '$$T = \\frac{2u\\sin\\theta}{g}, \\quad H = \\frac{u^2\\sin^2\\theta}{2g}, \\quad R = \\frac{u^2\\sin 2\\theta}{g}$$',
          substitution: '$$T = \\frac{2(20)\\sin 30^\\circ}{10}, \\quad H = \\frac{20^2 (0.5)^2}{2(10)}, \\quad R = \\frac{20^2 \\sin 60^\\circ}{10}$$',
          steps: [
            '1. Evaluate trigonometric ratios: $\\sin 30^\\circ = 0.5$, $\\sin 60^\\circ = \\frac{\\sqrt{3}}{2} \\approx 0.866$.',
            '2. Time of flight: $$T = \\frac{40 \\times 0.5}{10} = \\frac{20}{10} = 2.0\\text{ s}$$',
            '3. Maximum height: $$H_{\\max} = \\frac{400 \\times 0.25}{20} = \\frac{100}{20} = 5.0\\text{ m}$$',
            '4. Range: $$R = \\frac{400 \\times 0.866}{10} = 40 \\times 0.866 = 34.64\\text{ m}$$',
          ],
          finalAnswer: '\\boxed{T = 2.0\\text{ s}, \\quad H_{\\max} = 5.0\\text{ m}, \\quad R = 34.6\\text{ m}}',
          unit: 's, m, m',
          explanation: 'At the highest point, the vertical velocity is zero, but the horizontal velocity remains $20\\cos 30^\\circ = 17.32\\text{ m/s}$.',
        },
      ],
      importantNotes: [
        'Maximum range on level ground occurs at $\\theta = 45^\\circ$ because $\\sin(2 \\times 45^\\circ) = \\sin 90^\\circ = 1$.',
        'Complementary launch angles (e.g., $30^\\circ$ and $60^\\circ$, or $15^\\circ$ and $75^\\circ$) achieve the exact same horizontal range for the same launch speed.',
        'At the apex of flight, the total velocity is NOT zero; it equals the horizontal velocity $u_x = u\\cos\\theta$.',
      ],
      commonPitfalls: [
        'Confusing $\\sin^2\\theta$ ($(\\sin\\theta)^2$) with $\\sin 2\\theta$ in the height and range equations.',
        'Setting velocity to zero at the highest point and forgetting that horizontal velocity $u\\cos\\theta$ never vanishes.',
      ],
      practiceQuestions: [
        {
          id: 'pq_proj1',
          question:
            'A bullet is fired horizontally from a cliff 80 m high with a velocity of 120 m/s. How long does it take to strike the ground? ($g = 10\\text{ m/s}^2$)',
          difficulty: 'Medium',
          hint: 'Since initial vertical velocity $u_y = 0$, use $h = \\frac{1}{2}gt^2$.',
          solution: [
            '$80 = \\frac{1}{2}(10)t^2 = 5t^2$',
            '$t^2 = 16 \\implies t = 4\\text{ s}$',
          ],
          finalAnswer: '\\boxed{t = 4.0\\text{ s}}',
        },
      ],
      suggestedFollowUps: [
        'How do I calculate projectile motion on an inclined plane?',
        'What happens when launch and landing heights are different?',
        'Can you show the derivation of the trajectory parabola equation $y(x)$?',
      ],
    };
    return lesson;
  }

  return null;
}
