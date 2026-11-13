import React, { useState } from 'react';
import { Microscope, CheckCircle2, HelpCircle } from 'lucide-react';

interface OrganelleSpec {
  id: string;
  name: string;
  x: number;
  y: number;
  structure: string;
  functionSummary: string;
  examNote: string;
}

interface BioModelSpec {
  id: string;
  title: string;
  category: string;
  overview: string;
  parts: OrganelleSpec[];
}

const BIOLOGY_MODELS: BioModelSpec[] = [
  {
    id: 'animal_cell',
    title: 'Eukaryotic Animal Cell',
    category: 'Cell Biology',
    overview: 'Click any cellular structure on the diagram or index to inspect its ultrastructure, metabolic role, and WAEC/JAMB exam adaptations.',
    parts: [
      { id: 'nucleus', name: 'Nucleus & Nucleolus', x: 240, y: 165, structure: 'Double nuclear membrane with nuclear pores enclosing chromatin DNA and a dense nucleolus.', functionSummary: 'Stores hereditary genetic material, controls gene transcription, and assembles ribosomal subunits.', examNote: 'Controls all cellular activities; absent in mature mammalian red blood cells.' },
      { id: 'mitochondrion', name: 'Mitochondrion', x: 385, y: 125, structure: 'Double-membraned organelle with folded inner membrane (cristae) and enzyme-rich matrix.', functionSummary: 'Site of aerobic cellular respiration (Krebs cycle & oxidative phosphorylation) generating ATP.', examNote: 'Richly abundant in metabolically active cells such as sperm midpiece and cardiac muscle.' },
      { id: 'er', name: 'Rough Endoplasmic Reticulum', x: 165, y: 115, structure: 'Flattened membranous sacs studded with 80S ribosomes continuous with the outer nuclear envelope.', functionSummary: 'Synthesizes, folds, and transports secretory and membrane proteins.', examNote: 'Distinguished from Smooth ER by surface ribosomes; Smooth ER synthesizes lipids and detoxifies drugs.' },
      { id: 'golgi', name: 'Golgi Apparatus', x: 355, y: 235, structure: 'Stacked cisternae (dictyosomes) with budding transport vesicles.', functionSummary: 'Modifies, sorts, packages, and dispatches proteins and lipids (e.g. forming lysosomes and digestive enzymes).', examNote: 'Crucial in glandular secretory cells like pancreatic acinar cells.' },
      { id: 'lysosome', name: 'Lysosome', x: 145, y: 245, structure: 'Single-membrane spherical vesicle containing acidic hydrolytic enzymes.', functionSummary: 'Digests worn-out organelles (autophagy), engulfed pathogens, and damaged cells.', examNote: 'Known clinically as the “suicidal bag” of the cell during controlled autolysis.' },
      { id: 'membrane', name: 'Plasma Membrane', x: 455, y: 195, structure: 'Fluid-mosaic phospholipid bilayer embedded with integral/peripheral proteins and cholesterol.', functionSummary: 'Selectively permeable boundary regulating osmosis, active transport, and cell signalling.', examNote: 'Plant cells additionally surround this membrane with a rigid cellulose cell wall.' },
    ],
  },
  {
    id: 'plant_cell',
    title: 'Plant Parenchyma Cell',
    category: 'Botany & Cytology',
    overview: 'Explore specialized photosynthetic and turgor-maintaining organelles unique to autotrophic plant cells.',
    parts: [
      { id: 'cell_wall', name: 'Cellulose Cell Wall', x: 472, y: 150, structure: 'Rigid outer structural layer composed of cross-linked cellulose microfibrils.', functionSummary: 'Provides mechanical support, definite shape, and prevents osmotic bursting in hypotonic water.', examNote: 'Freely permeable to water and dissolved solutes; linked between adjacent cells via plasmodesmata.' },
      { id: 'chloroplast', name: 'Chloroplast', x: 150, y: 115, structure: 'Double-membrane plastid containing thylakoid stacks (grana) bearing chlorophyll inside stroma.', functionSummary: 'Converts light energy into chemical glucose via photosynthesis (light-dependent & Calvin cycle).', examNote: 'Contains its own circular DNA and 70S ribosomes (endosymbiotic origin).' },
      { id: 'vacuole', name: 'Large Central Vacuole', x: 265, y: 185, structure: 'Fluid-filled sac bounded by a selectively permeable tonoplast membrane.', functionSummary: 'Stores cell sap, sugars, and mineral ions while maintaining osmotic turgor pressure.', examNote: 'Loss of water from this vacuole pulls the cytoplasm away from the wall (plasmolysis).' },
      { id: 'p_nucleus', name: 'Peripheral Nucleus', x: 385, y: 245, structure: 'Pressed near the cell periphery by the expanding central vacuole.', functionSummary: 'Coordinates protein synthesis and mitotic cell division.', examNote: 'Always displaced toward the margin in mature plant cells.' },
      { id: 'p_mito', name: 'Plant Mitochondrion', x: 165, y: 255, structure: 'Oval cristae-folded respiratory organelle within peripheral cytoplasm.', functionSummary: 'Supplies ATP for active root ion uptake, phloem loading, and night respiration.', examNote: 'Plants perform BOTH photosynthesis (day) and cellular respiration (24/7).' },
    ],
  },
  {
    id: 'human_heart',
    title: 'Human Four-Chambered Heart',
    category: 'Human Anatomy & Physiology',
    overview: 'Inspect systemic vs pulmonary double circulation pathways, unidirectional heart valves, and chamber wall thickness.',
    parts: [
      { id: 'ra', name: 'Right Atrium', x: 170, y: 135, structure: 'Thin-walled upper right receiving chamber housing the sinoatrial (SA) pacemaker node.', functionSummary: 'Receives deoxygenated venous blood from the body via Superior & Inferior Vena Cava.', examNote: 'Passes blood downward through the tricuspid valve into the Right Ventricle.' },
      { id: 'rv', name: 'Right Ventricle', x: 185, y: 225, structure: 'Moderate-thickness muscular lower chamber pumping along a short pulmonary circuit.', functionSummary: 'Pumps deoxygenated blood through the pulmonary artery directly to the lungs for oxygenation.', examNote: 'Thinner wall than Left Ventricle because lung capillary pressure must stay gentle.' },
      { id: 'la', name: 'Left Atrium', x: 325, y: 130, structure: 'Upper left receiving chamber connected to four pulmonary veins.', functionSummary: 'Receives freshly oxygenated blood returning from both lungs.', examNote: 'Opens via the bicuspid (mitral) valve into the Left Ventricle.' },
      { id: 'lv', name: 'Left Ventricle', x: 315, y: 235, structure: 'Thickest myocardium wall (~3× thicker than Right Ventricle).', functionSummary: 'Generates high hydrostatic pressure to pump oxygenated blood via the Aorta to the entire body.', examNote: 'Classic WAEC/JAMB question: Why is Left Ventricle thickest? To overcome high systemic resistance.' },
      { id: 'aorta', name: 'Aortic Arch & Semilunar Valve', x: 255, y: 65, structure: 'Main elastic systemic artery exiting the Left Ventricle above aortic semilunar valves.', functionSummary: 'Distributes oxygenated blood to carotid, subclavian, coronary, and systemic arteries.', examNote: 'Semilunar valves snap shut to create the second heart sound (“dub”).' },
    ],
  },
  {
    id: 'nephron',
    title: 'Kidney Nephron (Osmoregulation)',
    category: 'Excretory System',
    overview: 'Follow ultrafiltration, selective reabsorption, and ADH-regulated water balance along the functional unit of the kidney.',
    parts: [
      { id: 'bowman', name: 'Bowman’s Capsule & Glomerulus', x: 115, y: 115, structure: 'Cup-shaped epithelial capsule enclosing a high-pressure capillary knot (afferent arteriole wider than efferent).', functionSummary: 'Forces plasma water, urea, glucose, and salts across basement membrane (ultrafiltration), retaining blood cells and plasma proteins.', examNote: 'Afferent arteriole diameter > Efferent arteriole creates the high hydrostatic filtration pressure.' },
      { id: 'pct', name: 'Proximal Convoluted Tubule (PCT)', x: 215, y: 100, structure: 'Coiled tubule lined with microvilli (brush border) and abundant mitochondria.', functionSummary: 'Selectively reabsorbs 100% of glucose and amino acids plus ~65% of water and Na⁺ back into blood.', examNote: 'Presence of glucose in urine (glucosuria) points to diabetes mellitus or PCT overload.' },
      { id: 'henle', name: 'Loop of Henle', x: 270, y: 255, structure: 'U-shaped hairpin tubule descending into the hypertonic renal medulla.', functionSummary: 'Establishes a medullary osmotic gradient (counter-current multiplier) enabling urine concentration.', examNote: 'Longer in desert mammals (e.g. kangaroo rat) to maximize water conservation.' },
      { id: 'dct', name: 'Distal Convoluted Tubule & Collecting Duct', x: 390, y: 160, structure: 'Final regulatory duct passing down into the renal pelvis.', functionSummary: 'Fine-tunes water permeability under Antidiuretic Hormone (ADH) and ion secretion.', examNote: 'High blood osmolarity triggers pituitary ADH release -> aquaporin channels open -> concentrated urine.' },
    ],
  },
  {
    id: 'leaf_flower',
    title: 'Dicot Leaf Cross-Section',
    category: 'Plant Physiology',
    overview: 'Examine tissue specializations maximizing light capture, CO₂ diffusion, and vascular transport inside a leaf.',
    parts: [
      { id: 'cuticle', name: 'Waxy Cuticle & Upper Epidermis', x: 250, y: 65, structure: 'Transparent non-cellular waxy lipid film over single-layered epidermal cells lacking chloroplasts.', functionSummary: 'Allows sunlight penetration while sharply reducing uncontrolled evaporation (transpiration).', examNote: 'Thicker in xerophytes living in arid habitats.' },
      { id: 'palisade', name: 'Palisade Mesophyll Layer', x: 205, y: 125, structure: 'Tightly packed columnar cells oriented vertically right beneath upper epidermis, packed with chloroplasts.', functionSummary: 'Primary site of photosynthesis; upright arrangement minimizes cell-wall light reflection.', examNote: 'Contains far more chloroplasts per cell than spongy mesophyll.' },
      { id: 'vascular', name: 'Vascular Bundle (Xylem & Phloem)', x: 350, y: 170, structure: 'Central leaf vein containing lignified dead Xylem vessels (top) and living Phloem sieve tubes (bottom).', functionSummary: 'Xylem transports water & mineral ions upward; Phloem translocates sucrose bi-directionally.', examNote: 'Xylem sits on upper (adaxial) side of leaf vein; Phloem on lower side.' },
      { id: 'spongy', name: 'Spongy Mesophyll & Air Spaces', x: 165, y: 195, structure: 'Loosely arranged irregular cells surrounded by interconnected intercellular air chambers.', functionSummary: 'Facilitates rapid diffusion of CO₂ and O₂ across moist mesophyll cell surfaces.', examNote: 'Air chambers open directly to substomatal cavities.' },
      { id: 'stomata', name: 'Guard Cells & Stoma', x: 255, y: 255, structure: 'Pair of kidney-shaped chloroplast-containing epidermal cells flanking a microscopic pore on lower surface.', functionSummary: 'Regulates stomatal opening/closing for CO₂ entry and transpirational water loss.', examNote: 'Unlike normal epidermal cells, guard cells DO contain chloroplasts and uneven inner wall thickening.' },
    ],
  },
];

export const BiologyLabView: React.FC = () => {
  const [modelId, setModelId] = useState<string>(BIOLOGY_MODELS[0].id);
  const activeModel = BIOLOGY_MODELS.find((m) => m.id === modelId) || BIOLOGY_MODELS[0];
  const [selectedPartId, setSelectedPartId] = useState<string>(activeModel.parts[0].id);
  const [quizTargetId, setQuizTargetId] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string>('');

  const selectedPart =
    activeModel.parts.find((p) => p.id === selectedPartId) || activeModel.parts[0];

  const handleSelectModel = (id: string) => {
    const next = BIOLOGY_MODELS.find((m) => m.id === id) || BIOLOGY_MODELS[0];
    setModelId(next.id);
    setSelectedPartId(next.parts[0].id);
    setQuizTargetId(null);
    setQuizFeedback('');
  };

  const startIdentifyQuiz = () => {
    const pick = activeModel.parts[Math.floor(Math.random() * activeModel.parts.length)];
    setQuizTargetId(pick.id);
    setQuizFeedback(`Tap the diagram structure matching: "${pick.name}"`);
  };

  const handlePartClick = (part: OrganelleSpec) => {
    setSelectedPartId(part.id);
    if (quizTargetId) {
      if (part.id === quizTargetId) {
        setQuizFeedback(`Correct! You identified ${part.name}.`);
        setQuizTargetId(null);
      } else {
        setQuizFeedback(`You clicked ${part.name}. Keep looking for the target structure!`);
      }
    }
  };

  const quizTargetName = activeModel.parts.find((p) => p.id === quizTargetId)?.name;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Interactive Biology Lab
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
              Click any anatomical region or organelle inside cells, organs, and botanical cross-sections to inspect structures and test identification.
            </p>
          </div>
          <button
            type="button"
            onClick={startIdentifyQuiz}
            className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Identify Structure Quiz</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {BIOLOGY_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelectModel(m.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                modelId === m.id
                  ? 'bg-[#22C55E] text-white font-bold'
                  : 'bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-[#27272A]'
              }`}
            >
              {m.title}
            </button>
          ))}
        </div>

        {quizFeedback && (
          <div className="p-3 rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
            <span>{quizTargetName ? `Locate on diagram: ${quizTargetName}` : quizFeedback}</span>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Labelled Diagram */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 space-y-3">
          <div className="text-xs text-slate-500 dark:text-[#A1A1AA]">
            {activeModel.category} · {activeModel.overview}
          </div>

          <svg viewBox="0 0 540 320" className="w-full h-auto rounded-xl border border-slate-200 dark:border-[#27272A] bg-[#0B1117]">
            {/* Render anatomical silhouette tailored to modelId */}
            {activeModel.id === 'animal_cell' && (
              <g>
                <ellipse cx="270" cy="165" rx="215" ry="125" fill="#13222F" stroke="#22C55E" strokeWidth="4" />
                <ellipse cx="270" cy="165" rx="205" ry="116" fill="#172A3A" stroke="#38BDF8" strokeDasharray="6 4" strokeWidth="1.5" />
                {/* Nucleus */}
                <circle cx="240" cy="165" r="46" fill="#312E81" stroke="#818CF8" strokeWidth="3" />
                <circle cx="245" cy="160" r="14" fill="#6366F1" />
                {/* Rough ER */}
                <path d="M 190 120 Q 150 110 140 140 Q 170 148 188 135 Z" fill="#0E7490" stroke="#22D3EE" strokeWidth="1.5" />
                {/* Mitochondrion */}
                <ellipse cx="385" cy="125" rx="34" ry="17" transform="rotate(-18 385 125)" fill="#9A3412" stroke="#FB923C" strokeWidth="2" />
                {/* Golgi */}
                <path d="M 325 225 Q 355 215 385 225 M 330 238 Q 355 228 380 238 M 335 250 Q 355 242 375 250" fill="none" stroke="#FACC15" strokeWidth="4" strokeLinecap="round" />
                {/* Lysosome */}
                <circle cx="145" cy="245" r="16" fill="#9F1239" stroke="#FB7185" strokeWidth="2" />
              </g>
            )}

            {activeModel.id === 'plant_cell' && (
              <g>
                <polygon points="85,45 455,45 495,160 455,275 85,275 45,160" fill="#14532D" stroke="#22C55E" strokeWidth="6" />
                <polygon points="96,57 444,57 480,160 444,263 96,263 60,160" fill="#166534" stroke="#86EFAC" strokeWidth="2" />
                {/* Central Vacuole */}
                <ellipse cx="265" cy="185" rx="115" ry="62" fill="#0369A1" stroke="#38BDF8" strokeWidth="2.5" opacity="0.85" />
                {/* Chloroplasts */}
                <ellipse cx="150" cy="115" rx="30" ry="15" fill="#15803D" stroke="#4ADE80" strokeWidth="2" />
                <ellipse cx="360" cy="105" rx="28" ry="14" fill="#15803D" stroke="#4ADE80" strokeWidth="2" />
                {/* Nucleus */}
                <circle cx="385" cy="245" r="28" fill="#4338CA" stroke="#A5B4FC" strokeWidth="2.5" />
                {/* Mitochondrion */}
                <ellipse cx="165" cy="255" rx="26" ry="13" fill="#9A3412" stroke="#FB923C" strokeWidth="2" />
              </g>
            )}

            {activeModel.id === 'human_heart' && (
              <g>
                {/* Heart Chambers */}
                <path d="M 270 285 C 165 250 115 180 135 120 C 155 75 220 80 265 115 C 300 75 375 75 395 125 C 415 185 355 255 270 285 Z" fill="#7F1D1D" stroke="#F87171" strokeWidth="3" />
                {/* Septum */}
                <line x1="255" y1="120" x2="268" y2="278" stroke="#FCA5A5" strokeWidth="5" strokeLinecap="round" />
                {/* Right Side (Deoxygenated Blue tint) */}
                <ellipse cx="178" cy="140" rx="36" ry="26" fill="#1D4ED8" opacity="0.7" />
                <ellipse cx="192" cy="222" rx="42" ry="38" fill="#1E40AF" opacity="0.75" />
                {/* Left Side (Oxygenated Red tint) */}
                <ellipse cx="325" cy="135" rx="36" ry="26" fill="#DC2626" opacity="0.8" />
                <ellipse cx="315" cy="230" rx="44" ry="42" fill="#B91C1C" opacity="0.85" />
                {/* Aortic Arch */}
                <path d="M 275 125 C 275 50 220 55 220 100" fill="none" stroke="#EF4444" strokeWidth="18" strokeLinecap="round" />
              </g>
            )}

            {activeModel.id === 'nephron' && (
              <g>
                {/* Bowman's Capsule */}
                <circle cx="115" cy="115" r="34" fill="#1E293B" stroke="#FACC15" strokeWidth="4" />
                <circle cx="115" cy="115" r="18" fill="#DC2626" opacity="0.85" />
                {/* PCT -> Loop of Henle -> DCT -> Collecting Duct */}
                <path
                  d="M 149 115 Q 185 80 215 105 Q 245 130 245 255 Q 270 290 295 255 L 295 140 Q 335 110 385 135 L 395 275"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Collecting Duct Vertical */}
                <line x1="395" y1="75" x2="395" y2="290" stroke="#38BDF8" strokeWidth="14" strokeLinecap="round" />
              </g>
            )}

            {activeModel.id === 'leaf_flower' && (
              <g>
                {/* Upper Epidermis */}
                <rect x="65" y="55" width="410" height="24" rx="4" fill="#86EFAC" opacity="0.8" />
                {/* Palisade Cells */}
                {[90, 145, 200, 255, 310].map((px) => (
                  <rect key={px} x={px} y="82" width="42" height="72" rx="6" fill="#16A34A" stroke="#4ADE80" strokeWidth="2" />
                ))}
                {/* Vascular Bundle */}
                <circle cx="350" cy="170" r="34" fill="#1E293B" stroke="#F59E0B" strokeWidth="3" />
                <circle cx="350" cy="158" r="12" fill="#EF4444" />
                <circle cx="350" cy="182" r="12" fill="#38BDF8" />
                {/* Spongy Mesophyll */}
                {[110, 165, 225, 420].map((sx, idx) => (
                  <circle key={sx} cx={sx} cy={idx % 2 === 0 ? 195 : 210} r="22" fill="#15803D" stroke="#4ADE80" strokeWidth="2" />
                ))}
                {/* Lower Epidermis + Stoma */}
                <rect x="65" y="246" width="165" height="22" rx="4" fill="#86EFAC" opacity="0.8" />
                <rect x="280" y="246" width="195" height="22" rx="4" fill="#86EFAC" opacity="0.8" />
                <ellipse cx="255" cy="257" rx="18" ry="10" fill="#22C55E" stroke="#FFFFFF" strokeWidth="1.5" />
              </g>
            )}

            {/* Clickable Callout Pins */}
            {activeModel.parts.map((part, idx) => {
              const isSelected = part.id === selectedPartId;
              return (
                <g
                  key={part.id}
                  onClick={() => handlePartClick(part)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={part.x}
                    cy={part.y}
                    r={isSelected ? 15 : 12}
                    fill={isSelected ? '#22C55E' : '#0F172A'}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />
                  <text
                    x={part.x}
                    y={part.y + 4}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right: Structure Inspector & Index */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs text-[#22C55E] font-bold">
              <Microscope className="w-4 h-4" />
              <span>Selected Structure</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedPart.name}</h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3.5">
                <div className="font-bold text-slate-900 dark:text-white mb-1">Structural Features</div>
                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">{selectedPart.structure}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-slate-50 dark:bg-[#121216] p-3.5">
                <div className="font-bold text-slate-900 dark:text-white mb-1">Biological Function</div>
                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">{selectedPart.functionSummary}</p>
              </div>
              <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-3.5">
                <div className="font-bold text-[#22C55E] mb-1">WAEC / JAMB / JUPEB Exam Focus</div>
                <p className="text-slate-800 dark:text-zinc-200 leading-relaxed">{selectedPart.examNote}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white mb-2">
              Labelled Structures Index ({activeModel.parts.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
              {activeModel.parts.map((part, idx) => (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => handlePartClick(part)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer transition-colors ${
                    part.id === selectedPartId
                      ? 'bg-[#22C55E] text-white'
                      : 'border border-slate-200 dark:border-[#27272A] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#18181B]'
                  }`}
                >
                  <span className="font-mono font-bold tabular-nums">{idx + 1}.</span>
                  <span className="truncate">{part.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
