import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  Atom,
  Sliders,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Info,
} from 'lucide-react';

interface FunctionalGroup {
  id: string;
  name: string;
  suffix: string;
  generalFormula: string;
  prefix: string;
  description: string;
}

const FUNCTIONAL_GROUPS: FunctionalGroup[] = [
  { id: 'alkane', name: 'Alkane', suffix: '-ane', generalFormula: 'C_n H_{2n+2}', prefix: 'Alkyl', description: 'Saturated hydrocarbons with single C-C bonds' },
  { id: 'alkene', name: 'Alkene', suffix: '-ene', generalFormula: 'C_n H_{2n}', prefix: 'Alkenyl', description: 'Unsaturated hydrocarbons containing at least one C=C double bond' },
  { id: 'alkyne', name: 'Alkyne', suffix: '-yne', generalFormula: 'C_n H_{2n-2}', prefix: 'Alkynyl', description: 'Unsaturated hydrocarbons containing at least one C≡C triple bond' },
  { id: 'alcohol', name: 'Alcohol', suffix: '-anol', generalFormula: 'C_n H_{2n+1}OH', prefix: 'Hydroxy-', description: 'Contains hydroxyl (-OH) functional group bonded to saturated carbon' },
  { id: 'acid', name: 'Carboxylic Acid', suffix: '-anoic acid', generalFormula: 'C_n H_{2n}O_2', prefix: 'Carboxy-', description: 'Contains carboxyl (-COOH) group; acidic organic compounds' },
  { id: 'aldehyde', name: 'Aldehyde', suffix: '-anal', generalFormula: 'C_n H_{2n}O', prefix: 'Formyl-', description: 'Carbonyl group (-CHO) located at terminal carbon position' },
  { id: 'ketone', name: 'Ketone', suffix: '-anone', generalFormula: 'C_n H_{2n}O', prefix: 'Oxo-', description: 'Carbonyl group (>C=O) bonded to two other carbon atoms' },
  { id: 'ester', name: 'Ester', suffix: '-anoate', generalFormula: 'R-COO-R\'', prefix: 'Alkoxycarbonyl', description: 'Sweet-smelling compounds formed by reaction of alcohol and carboxylic acid' },
];

const ROOT_NAMES = ['Meth', 'Eth', 'Prop', 'But', 'Pent', 'Hex', 'Hept', 'Oct'];

export const OrganicChemistryView: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<string>('alcohol');
  const [carbonCount, setCarbonCount] = useState<number>(2); // e.g. 2 = Ethanol
  const [activeReactionTab, setActiveReactionTab] = useState<'structure' | 'reactions'>('structure');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const groupInfo = useMemo(() => {
    return FUNCTIONAL_GROUPS.find((g) => g.id === selectedGroup) || FUNCTIONAL_GROUPS[0];
  }, [selectedGroup]);

  // Compute IUPAC name, formulas and molecular weight
  const compoundData = useMemo(() => {
    const root = ROOT_NAMES[carbonCount - 1] || 'Meth';
    let iupacName = `${root}${groupInfo.suffix.toLowerCase()}`;
    if (selectedGroup === 'acid') {
      iupacName = `${root}${groupInfo.suffix.toLowerCase()}`;
    }

    let formula = '';
    let condensed = '';
    let molarMass = 0;

    const cMass = 12.011;
    const hMass = 1.008;
    const oMass = 15.999;

    if (selectedGroup === 'alkane') {
      const hCount = 2 * carbonCount + 2;
      formula = `C${carbonCount}H${hCount}`;
      molarMass = carbonCount * cMass + hCount * hMass;
      condensed = carbonCount === 1 ? 'CH₄' : `CH₃(CH₂)_${carbonCount - 2}CH₃`;
    } else if (selectedGroup === 'alkene') {
      const hCount = 2 * carbonCount;
      formula = `C${carbonCount}H${hCount}`;
      molarMass = carbonCount * cMass + hCount * hMass;
      condensed = carbonCount === 2 ? 'CH₂=CH₂' : `CH₂=CH(CH₂)_${carbonCount - 3}CH₃`;
    } else if (selectedGroup === 'alkyne') {
      const hCount = 2 * carbonCount - 2;
      formula = `C${carbonCount}H${hCount}`;
      molarMass = carbonCount * cMass + hCount * hMass;
      condensed = carbonCount === 2 ? 'CH≡CH' : `CH≡C(CH₂)_${carbonCount - 3}CH₃`;
    } else if (selectedGroup === 'alcohol') {
      const hCount = 2 * carbonCount + 1;
      formula = `C${carbonCount}H${hCount}OH`;
      molarMass = carbonCount * cMass + (hCount + 1) * hMass + oMass;
      condensed = carbonCount === 1 ? 'CH₃OH' : `CH₃(CH₂)_${carbonCount - 2}CH₂OH`;
    } else if (selectedGroup === 'acid') {
      const hCount = 2 * carbonCount;
      formula = `C${carbonCount}H${hCount}O₂`;
      molarMass = carbonCount * cMass + hCount * hMass + 2 * oMass;
      condensed = carbonCount === 1 ? 'HCOOH' : `CH₃(CH₂)_${carbonCount - 2}COOH`;
    } else {
      formula = `C${carbonCount}H${2 * carbonCount}O`;
      molarMass = carbonCount * cMass + 2 * carbonCount * hMass + oMass;
      condensed = `${root}-derivative`;
    }

    return { iupacName, formula, condensed, molarMass };
  }, [selectedGroup, carbonCount, groupInfo]);

  // 2D Structural Formula Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // Draw 2D structural Lewis chain
    const centerY = height * 0.52;
    const spacing = Math.min((width - 120) / (carbonCount + 1 || 2), 65);
    const startX = (width - (carbonCount - 1) * spacing) / 2;

    const drawAtom = (x: number, y: number, text: string, color: string) => {
      ctx.fillStyle = color;
      ctx.font = 'bold 16px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    };

    const drawBond = (x1: number, y1: number, x2: number, y2: number, type = 'single') => {
      ctx.strokeStyle = '#52525B';
      ctx.lineWidth = 2.5;

      if (type === 'single') {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      } else if (type === 'double') {
        const perpX = -(y2 - y1) / Math.hypot(x2 - x1, y2 - y1) * 3;
        const perpY = (x2 - x1) / Math.hypot(x2 - x1, y2 - y1) * 3;
        ctx.beginPath();
        ctx.moveTo(x1 + perpX, y1 + perpY);
        ctx.lineTo(x2 + perpX, y2 + perpY);
        ctx.moveTo(x1 - perpX, y1 - perpY);
        ctx.lineTo(x2 - perpX, y2 - perpY);
        ctx.stroke();
      } else if (type === 'triple') {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.moveTo(x1, y1 - 4);
        ctx.lineTo(x2, y2 - 4);
        ctx.moveTo(x1, y1 + 4);
        ctx.lineTo(x2, y2 + 4);
        ctx.stroke();
      }
    };

    // Draw Carbon Chain and Attached Hydrogens
    for (let i = 0; i < carbonCount; i++) {
      const cx = startX + i * spacing;

      // Draw C-C bond to next carbon
      if (i < carbonCount - 1) {
        const nextCx = startX + (i + 1) * spacing;
        let bondType = 'single';
        if (selectedGroup === 'alkene' && i === 0) bondType = 'double';
        if (selectedGroup === 'alkyne' && i === 0) bondType = 'triple';
        drawBond(cx + 12, centerY, nextCx - 12, centerY, bondType);
      }

      // Top H bond
      drawBond(cx, centerY - 12, cx, centerY - 36);
      drawAtom(cx, centerY - 46, 'H', '#A1A1AA');

      // Bottom H bond
      drawBond(cx, centerY + 12, cx, centerY + 36);
      drawAtom(cx, centerY + 46, 'H', '#A1A1AA');

      // Left terminal H
      if (i === 0) {
        drawBond(cx - 12, centerY, cx - 36, centerY);
        drawAtom(cx - 46, centerY, 'H', '#A1A1AA');
      }

      // Right terminal group
      if (i === carbonCount - 1) {
        if (selectedGroup === 'alcohol') {
          drawBond(cx + 12, centerY, cx + 36, centerY);
          drawAtom(cx + 52, centerY, 'O', '#EF4444');
          drawBond(cx + 62, centerY, cx + 80, centerY);
          drawAtom(cx + 90, centerY, 'H', '#38BDF8');
        } else if (selectedGroup === 'acid') {
          // Double bonded O upward
          drawBond(cx + 8, centerY - 8, cx + 28, centerY - 28, 'double');
          drawAtom(cx + 36, centerY - 36, 'O', '#EF4444');
          // OH downward
          drawBond(cx + 8, centerY + 8, cx + 28, centerY + 28);
          drawAtom(cx + 36, centerY + 36, 'OH', '#38BDF8');
        } else {
          drawBond(cx + 12, centerY, cx + 36, centerY);
          drawAtom(cx + 46, centerY, 'H', '#A1A1AA');
        }
      }

      // Draw Carbon Atom
      drawAtom(cx, centerY, 'C', '#22C55E');
    }
  }, [carbonCount, selectedGroup]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EC4899]/15 border border-[#EC4899]/30 flex items-center justify-center text-[#EC4899] flex-shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Organic Chemistry Structure & Reaction Lab
              </h2>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/30">
                2D Molecular Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1AA]">
              IUPAC systematic nomenclature, 2D skeletal structures, homologous series, and reaction pathways.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-[#18181B] p-1 rounded-2xl border border-[#27272A] text-xs font-semibold">
          <button
            onClick={() => setActiveReactionTab('structure')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeReactionTab === 'structure' ? 'bg-[#EC4899] text-white font-bold shadow-md' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            2D Structure Builder
          </button>
          <button
            onClick={() => setActiveReactionTab('reactions')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeReactionTab === 'reactions' ? 'bg-[#EC4899] text-white font-bold shadow-md' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Reaction Pathways
          </button>
        </div>
      </div>

      {/* Main Grid */}
      {activeReactionTab === 'structure' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 2D Chemical Canvas */}
          <div className="lg:col-span-8 bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#27272A] gap-2">
              <div>
                <span className="text-xs font-bold text-[#EC4899] uppercase tracking-wider block">
                  IUPAC Name
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {compoundData.iupacName}
                </h3>
              </div>

              <div className="flex items-center space-x-3 text-xs font-mono text-[#A1A1AA]">
                <span className="bg-[#18181B] px-3 py-1.5 rounded-xl border border-[#27272A]">
                  Formula: <strong className="text-white">{compoundData.formula}</strong>
                </span>
                <span className="bg-[#18181B] px-3 py-1.5 rounded-xl border border-[#27272A]">
                  Mass: <strong className="text-[#22C55E]">{compoundData.molarMass.toFixed(2)} g/mol</strong>
                </span>
              </div>
            </div>

            {/* Canvas */}
            <div className="relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden bg-[#09090B] border border-[#27272A]">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            {/* Carbon Length Slider */}
            <div className="p-4 rounded-2xl bg-[#121214] border border-[#27272A] space-y-2">
              <div className="flex justify-between text-xs text-[#A1A1AA]">
                <span>Carbon Chain Length (n)</span>
                <span className="text-white font-bold font-mono">
                  {carbonCount} Carbon{carbonCount > 1 ? 's' : ''} ({ROOT_NAMES[carbonCount - 1]}-)
                </span>
              </div>
              <input
                type="range"
                min={selectedGroup === 'alkene' || selectedGroup === 'alkyne' ? 2 : 1}
                max={7}
                value={carbonCount}
                onChange={(e) => setCarbonCount(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-[#EC4899]"
              />
            </div>
          </div>

          {/* Right: Functional Groups Selector & Properties */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-3xl p-5 shadow-xl space-y-3.5 text-xs">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 pb-2 border-b border-[#27272A]">
                <Sliders className="w-4 h-4 text-[#EC4899]" />
                <span>Homologous Series</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {FUNCTIONAL_GROUPS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroup(g.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      selectedGroup === g.id
                        ? 'bg-[#EC4899]/15 border-[#EC4899] text-white font-bold'
                        : 'bg-[#121214] border-[#27272A] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-semibold">{g.name}</div>
                    <div className="text-[10px] text-[#71717A] font-mono">{g.suffix}</div>
                  </button>
                ))}
              </div>

              {/* Group Description Card */}
              <div className="p-3.5 rounded-2xl bg-[#121214] border border-[#27272A] space-y-1.5 text-[#D4D4D8]">
                <span className="font-bold text-[#EC4899] uppercase tracking-wider block text-[11px]">
                  General Characteristics
                </span>
                <p className="text-[11px] leading-relaxed">{groupInfo.description}</p>
                <div className="pt-1 text-[11px] font-mono text-[#38BDF8]">
                  General Formula: {groupInfo.generalFormula}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* High-Yield Reaction Pathways */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-3xl bg-[#0A0A0A] border border-[#27272A] space-y-3">
            <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider">
              1. Esterification (Fischer)
            </span>
            <h4 className="text-base font-bold text-white">Carboxylic Acid + Alcohol → Ester + Water</h4>
            <div className="p-3 rounded-xl bg-[#121214] font-mono text-xs text-[#38BDF8] border border-[#27272A]">
              CH₃COOH + C₂H₅OH ⇄ (H₂SO₄ catalyst) ⇄ CH₃COOC₂H₅ + H₂O
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Ethanoic acid reacts with ethanol in the presence of concentrated tetraoxosulphate(VI) acid as a dehydrating agent to produce ethyl ethanoate (sweet fruity smell) and water.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-[#0A0A0A] border border-[#27272A] space-y-3">
            <span className="text-xs font-bold text-[#38BDF8] uppercase tracking-wider">
              2. Addition Reaction (Bromine Water Test)
            </span>
            <h4 className="text-base font-bold text-white">Alkene Decolourization of Bromine</h4>
            <div className="p-3 rounded-xl bg-[#121214] font-mono text-xs text-[#38BDF8] border border-[#27272A]">
              CH₂=CH₂ + Br₂ (reddish-brown) → CH₂Br-CH₂Br (colourless)
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Diagnostic test for unsaturation. Alkenes and alkynes immediately decolorize reddish-brown bromine water by electrophilic addition across the double bond.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-[#0A0A0A] border border-[#27272A] space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              3. Saponification (Soap Making)
            </span>
            <h4 className="text-base font-bold text-white">Alkaline Hydrolysis of Fats</h4>
            <div className="p-3 rounded-xl bg-[#121214] font-mono text-xs text-[#38BDF8] border border-[#27272A]">
              Triglyceride + 3 NaOH → Glycerol + 3 Sodium Salts of Fatty Acids (Soap)
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Boiling vegetable oil or animal fat with concentrated caustic soda (sodium hydroxide) yields propane-1,2,3-triol (glycerol) and soap salts.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-[#0A0A0A] border border-[#27272A] space-y-3">
            <span className="text-xs font-bold text-[#EC4899] uppercase tracking-wider">
              4. Complete Hydrocarbon Combustion
            </span>
            <h4 className="text-base font-bold text-white">Exothermic Oxidation</h4>
            <div className="p-3 rounded-xl bg-[#121214] font-mono text-xs text-[#38BDF8] border border-[#27272A]">
              C_x H_y + (x + y/4) O₂ → x CO₂ + (y/2) H₂O + Heat (ΔH &lt; 0)
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Complete burning in excess oxygen yields carbon dioxide and water vapor with large heat release. In limited oxygen, toxic carbon monoxide (CO) and carbon soot (C) are formed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
