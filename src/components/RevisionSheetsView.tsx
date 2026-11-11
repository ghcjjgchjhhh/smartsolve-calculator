import React, { useState, useMemo } from 'react';
import {
  Printer,
  Search,
  BookOpen,
  Sparkles,
  Download,
  Filter,
  CheckCircle2,
  Atom,
  FunctionSquare,
  FlaskConical,
  Award,
} from 'lucide-react';

interface RevisionCard {
  topic: string;
  subject: 'Physics' | 'Mathematics' | 'Chemistry';
  formula: string;
  name: string;
  unit?: string;
  dimensions?: string;
  explanation: string;
  examTip: string;
}

const REVISION_DATABASE: RevisionCard[] = [
  // --- PHYSICS ---
  {
    topic: 'Mechanics & Motion',
    subject: 'Physics',
    formula: 'v = u + at, s = ut + ½at², v² = u² + 2as, s = ½(u+v)t',
    name: 'Equations of Uniformly Accelerated Motion',
    unit: 'm, m/s, m/s²',
    dimensions: '[L], [LT⁻¹], [LT⁻²]',
    explanation: 'Only applicable for constant acceleration. For free fall under gravity, replace a with g (9.8 or 10 m/s²).',
    examTip: 'Trap: If a body starts from rest, u = 0. If it comes to rest/stops, v = 0. Deceleration is negative acceleration.',
  },
  {
    topic: 'Dynamics & Friction',
    subject: 'Physics',
    formula: 'F_net = ma, F_f = μN, N = mg cos θ, F_∥ = mg sin θ',
    name: "Newton's Second Law & Inclined Plane Friction",
    unit: 'Newton (N) = kg·m/s²',
    dimensions: '[MLT⁻²]',
    explanation: 'Normal reaction N is perpendicular to contact surface. On an inclined plane of angle θ, N = mg cos θ.',
    examTip: 'To just start moving, applied force = limiting friction μ_s·N. Once moving, kinetic friction μ_k is slightly lower.',
  },
  {
    topic: 'Work, Energy & Power',
    subject: 'Physics',
    formula: 'W = F·s·cos θ, KE = ½mv², PE = mgh, P = W/t = F·v',
    name: 'Work-Energy Theorem & Mechanical Power',
    unit: 'Joule (J), Watt (W)',
    dimensions: '[ML²T⁻²], [ML²T⁻³]',
    explanation: 'Work is dot product of Force and Displacement. If displacement is perpendicular to force (θ = 90°), Work = 0.',
    examTip: 'A waiter carrying a tray horizontally at constant velocity does NO work on the tray against gravity!',
  },
  {
    topic: 'Electricity & DC Circuits',
    subject: 'Physics',
    formula: 'V = IR, E = I(R + r) = V + Ir, P = IV = I²R = V²/R',
    name: "Ohm's Law, Lost Volts & Electric Power",
    unit: 'Volt (V), Ohm (Ω), Ampere (A)',
    dimensions: '[ML²T⁻³I⁻¹], [ML²T⁻³I⁻²]',
    explanation: 'EMF E is total energy per unit charge. Lost volts = Ir across internal resistance of cell.',
    examTip: 'For resistors in series, current is constant. For resistors in parallel, voltage across each branch is identical.',
  },
  {
    topic: 'Waves & Optics',
    subject: 'Physics',
    formula: 'v = f·λ, 1/f = 1/u + 1/v, m = -v/u, n = sin i / sin r = 1 / sin θ_c',
    name: 'Wave Equation, Lens Formula & Snell’s Law',
    unit: 'm/s, Hz, cm',
    dimensions: '[LT⁻¹], [T⁻¹]',
    explanation: 'Refractive index n = c/v. Total internal reflection occurs when light travels from denser to rarer medium and i > θ_c.',
    examTip: 'Frequency f does NOT change when light enters another medium; only wavelength λ and velocity v change.',
  },

  // --- MATHEMATICS ---
  {
    topic: 'Quadratic Equations & Roots',
    subject: 'Mathematics',
    formula: 'x = (-b ± √(b² - 4ac)) / (2a), α + β = -b/a, αβ = c/a',
    name: 'Quadratic Formula & Vieta’s Relations',
    unit: 'Dimensionless',
    explanation: 'Discriminant Δ = b² - 4ac determines roots: Δ > 0 (real & distinct), Δ = 0 (equal/tangent), Δ < 0 (complex).',
    examTip: 'To find equation given roots α, β: x² - (α + β)x + αβ = 0.',
  },
  {
    topic: 'Calculus Differentiation',
    subject: 'Mathematics',
    formula: 'd/dx [ax^n] = n·a·x^(n-1), Product: (uv)′ = u′v + uv′, Quotient: (u/v)′ = (u′v - uv′)/v²',
    name: 'Derivative Rules & Stationary Points',
    unit: 'Dimensionless / rate',
    explanation: 'Gradient of curve m = dy/dx. At stationary turning points, dy/dx = 0. If d²y/dx² < 0, it is a Maximum.',
    examTip: 'Velocity v = ds/dt and acceleration a = dv/dt = d²s/dt².',
  },
  {
    topic: 'Calculus Integration',
    subject: 'Mathematics',
    formula: '∫ ax^n dx = (a x^(n+1))/(n+1) + C  (n ≠ -1), Area = ∫_a^b [y_upper - y_lower] dx',
    name: 'Indefinite & Definite Integrals',
    unit: 'Area units²',
    explanation: 'Area between curve and x-axis. Never forget constant of integration +C for indefinite integrals.',
    examTip: 'Displacement s = ∫ v dt and velocity v = ∫ a dt.',
  },
  {
    topic: 'Trigonometry & Identities',
    subject: 'Mathematics',
    formula: 'sin²θ + cos²θ = 1, sin(2θ) = 2sinθ·cosθ, cos(2θ) = cos²θ - sin²θ = 2cos²θ - 1',
    name: 'Pythagorean & Double Angle Identities',
    unit: 'Degrees / Radians',
    explanation: 'Sine rule: a/sin A = b/sin B = c/sin C = 2R. Cosine rule: a² = b² + c² - 2bc cos A.',
    examTip: 'Use Sine rule when you know a side and its opposite angle. Use Cosine rule when you have 2 sides and included angle.',
  },
  {
    topic: 'Sequences & Series',
    subject: 'Mathematics',
    formula: 'AP: T_n = a + (n-1)d, S_n = n/2[2a + (n-1)d]; GP: T_n = a·r^(n-1), S_∞ = a / (1 - r)',
    name: 'Arithmetic (AP) & Geometric (GP) Progressions',
    unit: 'Sequence terms',
    explanation: 'Sum to infinity S_∞ of GP converges ONLY when |r| < 1 (-1 < r < 1).',
    examTip: 'If 3 consecutive terms are in AP: 2b = a + c. If in GP: b² = ac.',
  },

  // --- CHEMISTRY ---
  {
    topic: 'Stoichiometry & Mole Concept',
    subject: 'Chemistry',
    formula: 'n = m / M, n = N / N_A, V = n · 22.4 dm³ (at STP), C = n / V = m / (M · V)',
    name: 'Avogadro Moles, Gas Molar Volume & Molarity',
    unit: 'mol, g/mol, dm³',
    dimensions: 'N_A = 6.022 × 10²³ particles/mol',
    explanation: '1 mole of any ideal gas occupies 22.4 dm³ (liters) at Standard Temperature & Pressure (0°C, 1 atm).',
    examTip: 'Always convert cm³ to dm³ by dividing by 1000 before calculating molar concentration C = n/V.',
  },
  {
    topic: 'Volumetric Titration Analysis',
    subject: 'Chemistry',
    formula: '(C_A · V_A) / (C_B · V_B) = n_A / n_B, Mass conc = Molar conc · Molar mass',
    name: 'Acid-Base Titration Equation',
    unit: 'mol/dm³, g/dm³',
    explanation: 'C_A and C_B are concentrations in mol/dm³; V_A and V_B are volumes; n_A and n_B are stoichiometric coefficients in balanced reaction.',
    examTip: 'Phenolphthalein turns from colorless to pink at endpoint. Methyl orange turns from red to yellow-orange.',
  },
  {
    topic: 'Gas Laws & States of Matter',
    subject: 'Chemistry',
    formula: 'P₁V₁/T₁ = P₂V₂/T₂, PV = nRT, R = 0.08206 L·atm/(mol·K) = 8.314 J/(mol·K)',
    name: 'General Gas Equation & Ideal Gas Law',
    unit: 'atm, L, K, mol',
    explanation: 'Temperature T MUST ALWAYS be converted to Kelvin: T(K) = T(°C) + 273.15.',
    examTip: "Graham's Law: Rate of diffusion is inversely proportional to square root of molar mass: R₁/R₂ = √(M₂/M₁).",
  },
  {
    topic: 'Electrochemistry & Faraday',
    subject: 'Chemistry',
    formula: 'm = Z·I·t = (M · I · t) / (n · F), F = 96,500 C/mol',
    name: "Faraday's Laws of Electrolysis",
    unit: 'grams (g), Coulombs (C)',
    explanation: '1 Faraday (96,500 C) deposits 1 mole of electrons. For Cu²⁺, n = 2, so 2 Faradays are required per mole of Cu.',
    examTip: 'Current must be in Amperes, and time t must ALWAYS be in seconds (multiply minutes by 60, hours by 3600).',
  },
];

export const RevisionSheetsView: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<'All' | 'Physics' | 'Mathematics' | 'Chemistry'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCards = useMemo(() => {
    return REVISION_DATABASE.filter((card) => {
      const matchSubject = selectedSubject === 'All' || card.subject === selectedSubject;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        card.name.toLowerCase().includes(q) ||
        card.formula.toLowerCase().includes(q) ||
        card.topic.toLowerCase().includes(q) ||
        card.examTip.toLowerCase().includes(q);
      return matchSubject && matchSearch;
    });
  }, [selectedSubject, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] font-bold text-xs uppercase tracking-wider border border-[#10B981]/30">
                Exam Preparation & Revision
              </span>
              <span className="text-xs text-[#A1A1AA]">· 1-Page Summary Cheat-Sheets</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] mt-1 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-[#10B981]" />
              <span>Printable Formula Cheat-Sheets & Revision Cards</span>
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#10B981] hover:from-[#16A34A] hover:to-[#059669] text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF Sheet</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Subject Pills */}
          <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-none">
            {(['All', 'Physics', 'Mathematics', 'Chemistry'] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-[#10B981] text-black font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-[#121214] border border-[#27272A] text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
                }`}
              >
                {sub} ({sub === 'All' ? REVISION_DATABASE.length : REVISION_DATABASE.filter((c) => c.subject === sub).length})
              </button>
            ))}
          </div>

          {/* Search filter */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search formula, topic, or tip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#121214] border border-[#27272A] rounded-xl text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#10B981]"
            />
          </div>
        </div>
      </div>

      {/* Printable Sheet Watermark / Header for Print Mode Only */}
      <div className="hidden print:block text-black pb-4 border-b border-black mb-6">
        <h1 className="text-2xl font-bold">SmartSolve Formula & Revision Cheat-Sheet</h1>
        <p className="text-sm">Comprehensive Mathematics, Physics & Chemistry Exam Formula Reference</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCards.map((card, i) => (
          <div
            key={i}
            className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-3.5 hover:border-[#10B981]/50 transition-colors print:border-black print:bg-white print:text-black print:rounded-none print:shadow-none print:p-3"
          >
            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-[#27272A]/70 print:border-black">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    card.subject === 'Physics'
                      ? 'bg-sky-400'
                      : card.subject === 'Mathematics'
                      ? 'bg-purple-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider print:text-black">
                  {card.subject} · {card.topic}
                </span>
              </div>
              {card.unit && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#18181B] text-sky-400 print:bg-gray-100 print:text-black border border-[#27272A]/40">
                  {card.unit}
                </span>
              )}
            </div>

            {/* Name */}
            <h3 className="text-base font-bold text-white print:text-black">{card.name}</h3>

            {/* Formula Block */}
            <div className="p-3 rounded-2xl bg-[#121214] border border-[#27272A] print:bg-gray-50 print:border-black font-mono font-bold text-sm sm:text-base text-center text-emerald-400 print:text-black overflow-x-auto whitespace-pre-wrap">
              {card.formula}
            </div>

            {/* Explanation */}
            <p className="text-xs text-[#E4E4E7] print:text-black leading-relaxed">
              {card.explanation}
            </p>

            {/* Exam Tip / Trap */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 print:bg-yellow-50 print:border-black text-xs text-amber-300 print:text-black space-y-1">
              <div className="flex items-center space-x-1 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 print:hidden" />
                <span>EXAM TIP & PITFALL:</span>
              </div>
              <div className="leading-relaxed">{card.examTip}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
