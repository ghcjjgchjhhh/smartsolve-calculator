import React, { useState, useMemo } from 'react';
import { PHYSICS_FORMULAS } from '../services/physicsEngine';
import { UNIT_CATEGORIES } from '../services/unitConverter';
import { Search, X, Atom, FunctionSquare, Scale } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (tab: string, formulaId?: string) => void;
}

export const SearchModal: React.FC<Props> = ({ isOpen, onClose, onSelectAction }) => {
  const [query, setQuery] = useState('');

  const mathEntries = [
    { name: 'AI Interactive Whiteboard', sub: 'Progressive AI chalkboard diagrams, step-by-step equations, drawing & board saving', tab: 'ai_whiteboard' },
    { name: 'Interactive 3D Physics Studio', sub: 'Real 3D WebGL simulations for circular motion, projectile, gravity, inclined forces, 3D waves, E&M, and energy', tab: 'physics_3d' },
    { name: 'Voice-to-Mathematics Studio', sub: 'Speak mathematical questions, auto-format into LaTeX equations, and solve deterministically', tab: 'voice_math' },
    { name: 'Handwriting Equation Recognition', sub: 'Recognize handwritten fractions, powers, roots, integrals & scientific notation from pad or photos', tab: 'handwriting' },
    { name: 'Socratic AI Tutor', sub: 'Guided coaching with progressive hints and step checking before revealing the complete solution', tab: 'socratic_tutor' },
    { name: 'Scientific Research Mode', sub: 'Explore scientific laws, experiments & theories distinguishing empirical consensus from frontier uncertainty', tab: 'scientific_research' },
    { name: 'Formula Relationship Explorer', sub: 'Interactive variable sliders showing real-time deterministic recalculation and response curves', tab: 'formula_explorer' },
    { name: 'AI Document Tutor (PDF & Notes)', sub: 'Upload PDFs and notes for chapter summaries, difficult passage explanations, quizzes & cited Q&A', tab: 'document_tutor' },
    { name: 'Past Question Search Library', sub: 'Filter verified JAMB, WAEC & JUPEB past questions by subject, topic, exam & year plus separate drill generator', tab: 'past_questions' },
    { name: 'Interactive Biology Lab', sub: 'Clickable anatomical and cellular models (Animal/Plant cells, Heart, Nephron, Leaf cross-section)', tab: 'biology_lab' },
    { name: 'Advanced Mathematical Equation Editor', sub: 'Multi-tab LaTeX keyboard for fractions, roots, matrices, integrals, summations, Greek & sets', tab: 'equation_editor' },
    { name: 'Collaborative Study Rooms', sub: 'Authenticated public & private study rooms with real-time synced whiteboard, questions, chat & moderation', tab: 'study_rooms' },
    { name: 'Learn Any Topic (AI Master Tutor)', sub: 'Complete academic masterclasses: introduction, formulas, symbols, SI units, when to use, diagrams, graphs, and practice problems for WAEC, JAMB, JUPEB & University', tab: 'learn_topic' },
    { name: '2D Function Grapher', sub: 'Interactive canvas plotting, roots, derivatives, trigonometric & polynomial curves', tab: 'grapher' },
    { name: '2D Vector & Force Polygon Lab', sub: 'Interactive vector addition, resolution Fx/Fy, resultant R, equilibrant, and inclined plane simulator', tab: 'vectors' },
    { name: 'DC Circuit & Ohm’s Law Simulator', sub: 'Series & parallel resistor circuits, internal resistance (lost volts), live electron dot animation & digital multimeter', tab: 'circuits' },
    { name: 'Organic Chemistry Molecule & Reaction Lab', sub: 'Lewis & skeletal 2D structures, homologous series (alkanes to esters), IUPAC naming, and esterification/combustion reactions', tab: 'organic' },
    { name: 'Exam Readiness Radar & Weakness Diagnostics', sub: 'Spider-web mastery radar chart across Physics, Math & Chemistry, weakness pinpointing, and JAMB practice shortcuts', tab: 'diagnostics' },
    { name: 'Interactive Optical Ray Tracing & Refraction Lab', sub: 'Convex/concave lenses, spherical mirrors, Snell’s law refraction, critical angle & total internal reflection (TIR)', tab: 'optics' },
    { name: 'Kinetic Gas Laws & Piston Chamber Simulator', sub: 'Boyle’s, Charles’s, Gay-Lussac’s & ideal gas PV=nRT simulator with live animated bouncing particles & PV isotherm curves', tab: 'gas_laws' },
    { name: 'Acid-Base Titration & pH S-Curve Laboratory', sub: 'Burette volumetric analysis, dynamic indicator color changes (phenolphthalein, methyl orange) and CA*VA/CB*VB solver', tab: 'titration' },
    { name: 'Chemistry AI Solver & Workstation', sub: 'Solves WAEC, JAMB, JUPEB & university chemistry, 5-step notebook working, empirical formula, ICE tables, electrochemistry, and balancing', tab: 'chem_balancer' },
    { name: 'Statistics, Ogive & Normal Distribution Lab', sub: 'WAEC grouped data frequency table, smooth cumulative frequency Ogive curve, quartiles Q1/Q2/Q3, box-plot & Gaussian Z-score bell curve', tab: 'statistics' },
    { name: 'Matrix Algebra & Linear System Gaussian Solver', sub: '2x2 and 3x3 matrices, determinant expansion with minors, matrix inversion A^-1, and 3-variable Gaussian elimination', tab: 'matrix' },
    { name: 'Printable Formula Cheat-Sheets & Revision Cards', sub: '1-page printable summary sheets covering Physics, Math & Chemistry with formulas, SI units, and exam pitfalls', tab: 'revision' },
    { name: 'Periodic Table & Stoichiometry', sub: 'Interactive elements table, molar mass calculation, % composition, mole-to-mass', tab: 'periodic_table' },
    { name: 'Physics Lab Simulators', sub: 'Real-time projectile motion, pendulum mechanics, kinetic & potential energy graphs', tab: 'physics_sim' },
    { name: 'Formula Flashcards & CBT Trainer', sub: '3D interactive formula flashcards, exam tips, mastery tracking for Math & Physics', tab: 'flashcards' },
    { name: 'My Formulas (Custom Notebook)', sub: 'Create custom formulas, live parameter sliders, variable solvers & offline persistence', tab: 'notebook' },
    { name: 'AI Chat Assistant (ChatGPT Multimodal)', sub: 'Ask everyday questions, coding, STEM, record voice notes & snap photo homework', tab: 'ai_chat' },
    { name: 'AI Real-World Solver', sub: 'Solves complex physics, math & chemistry questions with step-by-step reasoning', tab: 'ai_solver' },
    { name: 'JAMB / WAEC / JUPEB CBT Practice', sub: 'Timed CBT simulator with instant score calculation, Chemistry, Physics & Mathematics', tab: 'jamb' },
    { name: 'Chemistry Exam Practice', sub: 'Mole concept, stoichiometry, gas laws, electrochemistry, and organic chemistry', tab: 'jamb' },
    { name: 'Quadratic Equation Solver', sub: 'ax² + bx + c = 0 (Formula, Factorization, Completing Square)', tab: 'math' },
    { name: 'Linear Equations Solver', sub: 'Single variable ax + b = cx + d', tab: 'math' },
    { name: 'Simultaneous Equations', sub: '2-variable system elimination & Cramer rule', tab: 'math' },
    { name: 'Financial Interest & Compound', sub: 'Simple interest, compound interest A = P(1+r/n)^(nt), loan amortization', tab: 'math' },
    { name: 'Logarithms & Exponentials', sub: 'Change of base, natural logs ln, solve b^y = x', tab: 'math' },
    { name: 'Circle Geometry & Sectors', sub: 'Area πr², circumference, arc length s = rθ, sector area', tab: 'math' },
    { name: 'Binomial Theorem Expansion', sub: '(a + b)^n expansion using combination coefficients (n choose k)', tab: 'math' },
    { name: 'Fractions Calculator', sub: 'Add, subtract, multiply, divide, LCM & GCD', tab: 'math' },
    { name: 'Percentages & Ratios', sub: 'Percentage change & proportional sharing', tab: 'math' },
    { name: 'Arithmetic Progression (AP)', sub: 'Tn = a + (n-1)d and Sn sum', tab: 'math' },
    { name: 'Geometric Progression (GP)', sub: 'Tn = ar^(n-1), Sn, and Sum to infinity S∞', tab: 'math' },
    { name: 'Coordinate Geometry', sub: 'Distance, midpoint, gradient, and line equation', tab: 'math' },
    { name: 'Descriptive Statistics', sub: 'Mean, median, mode, range, variance, standard deviation', tab: 'math' },
    { name: 'Permutations & Combinations', sub: 'nPr, nCr, and factorials', tab: 'math' },
    { name: 'Calculus Differentiation', sub: 'Power rule derivative d/dx [ax^n]', tab: 'math' },
    { name: 'Calculus Integration', sub: 'Definite & indefinite polynomial integrals', tab: 'math' },
    { name: '2x2 Matrix & Vectors', sub: 'Determinant, trace, inverse, 3D dot & cross product', tab: 'math' },
  ];

  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return {
        physics: PHYSICS_FORMULAS.slice(0, 4),
        math: mathEntries.slice(0, 4),
        units: UNIT_CATEGORIES.slice(0, 4),
      };
    }

    const q = query.toLowerCase();

    const physics = PHYSICS_FORMULAS.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.baseFormula.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );

    const math = mathEntries.filter(
      (m) => m.name.toLowerCase().includes(q) || m.sub.toLowerCase().includes(q)
    );

    const units = UNIT_CATEGORIES.filter((u) => u.name.toLowerCase().includes(q));

    return { physics, math, units };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-start justify-center">
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden mt-12 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-[#27272A] flex items-center space-x-3">
          <Search className="w-5 h-5 text-[#22C55E]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search formulas, laws, equations or units (e.g. Ohm, motion, quadratic)..."
            className="flex-1 bg-transparent text-base sm:text-lg font-medium text-[#FFFFFF] placeholder:text-[#A1A1AA] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-[#18181B] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Physics */}
          {searchResults.physics.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#22C55E] flex items-center space-x-1.5">
                <Atom className="w-3.5 h-3.5" />
                <span>Physics Calculators ({searchResults.physics.length})</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.physics.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectAction('physics', f.id);
                      onClose();
                    }}
                    className="p-3 text-left rounded-xl bg-[#000000] hover:bg-[#18181B] border border-[#27272A] transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-[#FFFFFF] line-clamp-1">{f.name}</div>
                    <div className="text-xs font-mono font-semibold text-[#22C55E] mt-0.5">
                      {f.baseFormula}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mathematics */}
          {searchResults.math.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#22C55E] flex items-center space-x-1.5">
                <FunctionSquare className="w-3.5 h-3.5" />
                <span>Mathematics Hub</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.math.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => {
                      onSelectAction(m.tab);
                      onClose();
                    }}
                    className="p-3 text-left rounded-xl bg-[#000000] hover:bg-[#18181B] border border-[#27272A] transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-[#FFFFFF] line-clamp-1">{m.name}</div>
                    <div className="text-[11px] text-[#A1A1AA] line-clamp-1 mt-0.5">{m.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Unit Converter */}
          {searchResults.units.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>Unit Categories</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {searchResults.units.map((u) => (
                  <button
                    key={u.name}
                    onClick={() => {
                      onSelectAction('converter');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#000000] hover:bg-[#18181B] text-xs font-semibold text-[#FFFFFF] border border-[#27272A] cursor-pointer"
                  >
                    {u.name} ({u.baseUnit})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
