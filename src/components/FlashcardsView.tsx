import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Sparkles,
  RotateCw,
  Check,
  X,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Award,
  Layers,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { MathRenderer } from './MathRenderer';

export interface Flashcard {
  id: string;
  category: 'Calculus' | 'Trigonometry' | 'Mechanics' | 'Electricity' | 'Chemistry' | 'Algebra';
  title: string;
  frontFormula: string;
  explanation: string;
  examTip: string;
  variables: string[];
}

export const FLASHCARD_DECK: Flashcard[] = [
  {
    id: 'c1',
    category: 'Calculus',
    title: 'Power Rule for Differentiation',
    frontFormula: '\\frac{d}{dx}[a \\cdot x^n] = a \\cdot n \\cdot x^{n-1}',
    explanation: 'Multiply by the current power, then reduce the power by 1. The derivative of a constant is 0.',
    examTip: 'Remember: d/dx(x) = 1, and d/dx(1/x) = -1/x².',
    variables: ['a = coefficient', 'n = exponent / power', 'x = independent variable'],
  },
  {
    id: 'c2',
    category: 'Calculus',
    title: 'Fundamental Integral of Power',
    frontFormula: '\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)',
    explanation: 'Increase the exponent by 1 and divide by the new exponent. Always add the arbitrary constant C for indefinite integrals.',
    examTip: 'When n = -1, the integral is ln|x| + C, not 1/0!',
    variables: ['n = power', 'C = constant of integration'],
  },
  {
    id: 'm1',
    category: 'Mechanics',
    title: 'Newton Second Law of Motion',
    frontFormula: 'F_{\\text{net}} = m \\cdot a = \\frac{\\Delta p}{\\Delta t}',
    explanation: 'The net external force on a body is directly proportional to its mass and resultant acceleration.',
    examTip: 'Force and acceleration are vector quantities pointing in the exact same direction.',
    variables: ['F = Net force (N)', 'm = Mass (kg)', 'a = Acceleration (m/s²)'],
  },
  {
    id: 'm2',
    category: 'Mechanics',
    title: 'Kinematics Equation (No Time)',
    frontFormula: 'v^2 = u^2 + 2 \\cdot a \\cdot s',
    explanation: 'Connects initial velocity, final velocity, acceleration, and displacement without needing time t.',
    examTip: 'For vertical upward motion, set a = -g and at maximum height v = 0.',
    variables: ['u = Initial velocity (m/s)', 'v = Final velocity (m/s)', 's = Displacement (m)', 'a = Acceleration (m/s²)'],
  },
  {
    id: 'm3',
    category: 'Mechanics',
    title: 'Conservation of Mechanical Energy',
    frontFormula: 'E_{\\text{total}} = \\frac{1}{2}mv^2 + mgh = \\text{constant}',
    explanation: 'In an isolated system with only conservative forces, kinetic energy and potential energy sum to a constant.',
    examTip: 'At maximum height, all energy is potential; at ground level, all is kinetic.',
    variables: ['m = Mass (kg)', 'v = Speed (m/s)', 'g = Gravity (9.8 m/s²)', 'h = Height (m)'],
  },
  {
    id: 'e1',
    category: 'Electricity',
    title: "Ohm's Law & Electrical Power",
    frontFormula: 'V = I \\cdot R \\quad \\Longrightarrow \\quad P = V \\cdot I = I^2 R = \\frac{V^2}{R}',
    explanation: 'Voltage across a conductor is proportional to current under constant temperature.',
    examTip: 'Use P = I²R for series circuits and P = V²/R for parallel circuits with shared voltage.',
    variables: ['V = Potential difference (V)', 'I = Electric current (A)', 'R = Resistance (Ω)', 'P = Power (W)'],
  },
  {
    id: 'e2',
    category: 'Electricity',
    title: 'Coulomb Law of Electrostatic Force',
    frontFormula: 'F = \\frac{1}{4\\pi \\epsilon_0} \\cdot \\frac{q_1 q_2}{r^2} = k \\cdot \\frac{q_1 q_2}{r^2}',
    explanation: 'The electric electrostatic force between two point charges is inversely proportional to square of distance.',
    examTip: 'Like charges repel (+); opposite charges attract (-). In vacuum, k = 9 × 10⁹ N·m²/C².',
    variables: ['q₁, q₂ = Point charges (C)', 'r = Distance between charges (m)', 'k = Coulomb constant'],
  },
  {
    id: 't1',
    category: 'Trigonometry',
    title: 'Pythagorean Trigonometric Identity',
    frontFormula: '\\sin^2\\theta + \\cos^2\\theta = 1 \\quad \\Longrightarrow \\quad 1 + \\tan^2\\theta = \\sec^2\\theta',
    explanation: 'Fundamental trigonometric identity derived from the Pythagorean theorem on a unit circle.',
    examTip: 'Dividing by cos²θ yields 1 + tan²θ = sec²θ. Dividing by sin²θ yields 1 + cot²θ = csc²θ.',
    variables: ['θ = Angle in radians or degrees'],
  },
  {
    id: 'a1',
    category: 'Algebra',
    title: 'Quadratic Formula & Discriminant',
    frontFormula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\quad [\\Delta = b^2 - 4ac]',
    explanation: 'Roots of ax² + bx + c = 0. The discriminant Δ reveals the nature of roots.',
    examTip: 'Δ > 0: two distinct real roots. Δ = 0: one repeated real root. Δ < 0: two complex conjugate roots.',
    variables: ['a, b, c = Polynomial coefficients', 'Δ = Discriminant'],
  },
  {
    id: 'ch1',
    category: 'Chemistry',
    title: 'Ideal Gas Equation & Mole Concept',
    frontFormula: 'P \\cdot V = n \\cdot R \\cdot T = \\frac{m}{M} \\cdot R \\cdot T',
    explanation: 'Equation of state for ideal gases relating pressure, volume, temperature, and amount in moles.',
    examTip: 'Always convert temperature to Kelvin: T(K) = θ(°C) + 273.15! R = 8.314 J/(mol·K).',
    variables: ['P = Pressure (Pa / atm)', 'V = Volume (m³ / L)', 'n = Moles (mol)', 'T = Absolute temp (K)'],
  },
];

export const FlashcardsView: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [mastered, setMastered] = useState<Record<string, boolean>>({});

  const filteredCards = useMemo(() => {
    if (selectedCategory === 'All') return FLASHCARD_DECK;
    return FLASHCARD_DECK.filter((c) => c.category === selectedCategory);
  }, [selectedCategory]);

  const currentCard = filteredCards[currentIndex] || filteredCards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleToggleMastered = (id: string, isDone: boolean) => {
    setMastered((prev) => ({ ...prev, [id]: isDone }));
    handleNext();
  };

  const masteredCount = Object.values(mastered).filter(Boolean).length;
  const progressPercent = Math.round((masteredCount / FLASHCARD_DECK.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn select-none">
      {/* Header Bar */}
      <div className="bg-[#0A0A0C] border border-[#27272A] rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/40 flex items-center justify-center text-[#22C55E] shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                Formula Flashcards & Memory Trainer
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 uppercase tracking-wider">
                CBT Prep
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Interactive 3D flipcards with governing equations, variable definitions, and rapid exam tips
            </p>
          </div>
        </div>

        {/* Mastery Progress Badge */}
        <div className="flex items-center space-x-2 bg-[#121417] px-3.5 py-1.5 rounded-2xl border border-[#27272A]">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white">
            Mastered: {masteredCount} / {FLASHCARD_DECK.length} ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Category Pills Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'Calculus', 'Mechanics', 'Electricity', 'Trigonometry', 'Algebra', 'Chemistry'].map(
          (cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#22C55E] text-white border-[#22C55E] shadow-sm shadow-emerald-500/20'
                  : 'bg-[#121417] text-zinc-400 border-[#27272A] hover:text-white'
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      {/* Main Flashcard 3D Interactive Container */}
      {currentCard && (
        <div className="perspective-1000 w-full min-h-[340px] sm:min-h-[380px] flex flex-col justify-between">
          <div
            onClick={() => setIsFlipped((prev) => !prev)}
            className={`w-full min-h-[320px] rounded-3xl p-6 sm:p-8 cursor-pointer transition-all duration-500 border relative flex flex-col justify-between shadow-2xl ${
              isFlipped
                ? 'bg-[#121417] border-[#22C55E]/50 text-white'
                : 'bg-[#0A0A0C] border-[#27272A] text-white hover:border-[#22C55E]/40'
            }`}
          >
            {/* Card Header Top Row */}
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="px-2.5 py-1 rounded-xl bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 uppercase tracking-wider text-[10px]">
                {currentCard.category}
              </span>

              <div className="flex items-center space-x-2 text-zinc-400">
                <span className="font-mono text-xs">
                  Card {currentIndex + 1} of {filteredCards.length}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#18181B] text-[10px] text-zinc-400">
                  Tap to flip ↺
                </span>
              </div>
            </div>

            {/* Card Body: Front vs Back */}
            {!isFlipped ? (
              /* FRONT OF CARD */
              <div className="space-y-4 my-auto text-center py-4">
                <h3 className="text-lg sm:text-2xl font-black text-white">{currentCard.title}</h3>
                <div className="py-4 text-xl sm:text-3xl text-[#22C55E] font-bold overflow-x-auto scrollbar-none">
                  <MathRenderer content={currentCard.frontFormula} displayMode={true} />
                </div>
                <p className="text-xs text-zinc-400 font-medium">
                  Tap card to reveal full explanation, variables & exam shortcuts
                </p>
              </div>
            ) : (
              /* BACK OF CARD */
              <div className="space-y-3.5 my-auto py-2 animate-fadeIn">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase font-bold text-[#22C55E] tracking-wider block">
                    Concept & Governing Principle:
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
                    {currentCard.explanation}
                  </p>
                </div>

                {/* Variable Breakdown */}
                <div className="p-3 rounded-2xl bg-[#0A0A0C] border border-[#27272A] space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Variables & Scientific Units:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-[11px] text-zinc-300">
                    {currentCard.variables.map((v, i) => (
                      <div key={i} className="flex items-center space-x-1.5">
                        <span className="text-[#22C55E]">•</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exam Tip */}
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-x-1">
                  <span className="font-bold">Exam Tip: </span>
                  <span>{currentCard.examTip}</span>
                </div>
              </div>
            )}

            {/* Card Footer Status */}
            <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-[#27272A]/60">
              <span>SmartSolve CBT Master Deck</span>
              {mastered[currentCard.id] && (
                <span className="text-[#22C55E] font-bold flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Mastered</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Navigation Controls */}
          <div className="flex items-center justify-between gap-2 pt-3">
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl bg-[#121417] hover:bg-[#1A1D23] text-white border border-[#27272A] text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Mastery Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleToggleMastered(currentCard.id, false)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all"
                title="Needs more practice"
              >
                <X className="w-4 h-4" />
                <span>Review Again</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleMastered(currentCard.id, true)}
                className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                title="Mark formula as mastered"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Mastered</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-[#121417] hover:bg-[#1A1D23] text-white border border-[#27272A] text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
