import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Microscope,
  CheckCircle2,
  HelpCircle,
  Box,
  Layers,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  applyBio3DState,
  Bio3DRuntime,
  buildBiology3DModel,
  updateBiology3DAnimation,
} from '../utils/biology3dBuilders';

interface OrganelleSpec {
  id: string;
  name: string;
  x: number;
  y: number;
  structure: string;
  functionSummary: string;
  examNote: string;
}

type BioCategory = 'all' | 'anatomy' | 'cell_renal' | 'botany';

interface BioModelSpec {
  id: string;
  title: string;
  category: string;
  group: Exclude<BioCategory, 'all'>;
  overview: string;
  parts: OrganelleSpec[];
}

const BIOLOGY_MODELS: BioModelSpec[] = [
  {
    id: 'skeletal_bone',
    title: 'Long Bone & Skeletal Cross-Section',
    category: 'Skeletal Anatomy',
    group: 'anatomy',
    overview: 'Inspect the macroscopic and histological layers of a mammalian femur — from articular cartilage to compact bone and yellow marrow.',
    parts: [
      {
        id: 'cartilage',
        name: 'Articular Hyaline Cartilage',
        x: 225,
        y: 52,
        structure: 'Smooth, glassy blue-white avascular layer capping the epiphyses inside synovial joints.',
        functionSummary: 'Reduces joint friction to near zero and absorbs compressive mechanical shock during locomotion.',
        examNote: 'Degrades in osteoarthritis; nourished exclusively by synovial fluid diffusion rather than direct capillaries.',
      },
      {
        id: 'spongy_bone',
        name: 'Spongy (Cancellous) Bone & Red Marrow',
        x: 265,
        y: 95,
        structure: 'Honeycomb network of bony trabeculae aligned along lines of mechanical stress inside the epiphysis.',
        functionSummary: 'Lightens bone weight while withstanding multidirectional forces; houses hematopoietic red marrow.',
        examNote: 'Red bone marrow produces erythrocytes (RBCs), leukocytes (WBCs), and platelets.',
      },
      {
        id: 'epiphyseal_plate',
        name: 'Epiphyseal (Growth) Plate',
        x: 270,
        y: 132,
        structure: 'Band of actively dividing hyaline cartilage separating epiphysis and diaphysis in growing skeletons.',
        functionSummary: 'Drives longitudinal bone lengthening under growth hormone (GH) until ossification in adulthood.',
        examNote: 'Fuses into an epiphyseal line once adult height is attained (~18–21 years).',
      },
      {
        id: 'compact_bone',
        name: 'Compact (Cortical) Bone & Haversian Systems',
        x: 195,
        y: 195,
        structure: 'Dense outer shaft cylinder packed tightly with concentric lamellae around central Haversian canals.',
        functionSummary: 'Provides maximum bending rigidity and longitudinal weight-bearing support for the diaphysis.',
        examNote: 'Contains osteocytes inside lacunae linked via canaliculi; calcium phosphate hydroxyapatite gives hardness.',
      },
      {
        id: 'bone_marrow',
        name: 'Medullary Cavity & Yellow Marrow',
        x: 270,
        y: 205,
        structure: 'Hollow central shaft tunnel filled with adipose-rich yellow marrow and a nutrient artery.',
        functionSummary: 'Stores triglyceride energy reserves and houses major blood supply feeding inner osteocytes.',
        examNote: 'Yellow marrow can revert back to red blood-forming marrow during severe chronic anemia.',
      },
      {
        id: 'periosteum',
        name: 'Periosteum Membrane',
        x: 332,
        y: 235,
        structure: 'Tough, vascularized outer fibrous sheath anchoring tendons and ligaments via Sharpey’s fibres.',
        functionSummary: 'Supplies blood and osteoblasts for appositional bone thickening and fracture callus repair.',
        examNote: 'Richly innervated with pain receptors — bone fracture pain originates primarily here.',
      },
    ],
  },
  {
    id: 'muscular_anatomy',
    title: 'Muscle Anatomy & Sarcomere',
    category: 'Muscular Physiology',
    group: 'anatomy',
    overview: 'Observe antagonistic biceps/triceps leverage across the elbow hinge alongside sliding actin-myosin filaments inside a sarcomere.',
    parts: [
      {
        id: 'biceps',
        name: 'Biceps Brachii (Flexor)',
        x: 165,
        y: 118,
        structure: 'Spindle-shaped anterior upper-arm skeletal muscle attached across shoulder and radius.',
        functionSummary: 'Contracts and thickens (shortens) to flex the forearm upward toward the humerus.',
        examNote: 'Works as an antagonistic pair with the triceps — muscles can only pull, never push.',
      },
      {
        id: 'triceps',
        name: 'Triceps Brachii (Extensor)',
        x: 92,
        y: 125,
        structure: 'Three-headed posterior muscle running down the back of the humerus to the ulna olecranon.',
        functionSummary: 'Contracts to straighten/extend the forearm while biceps relaxes.',
        examNote: 'Exam classic: during arm lifting/flexion, Biceps contracts while Triceps relaxes.',
      },
      {
        id: 'tendon',
        name: 'Inelastic Tendons & Elbow Hinge',
        x: 170,
        y: 225,
        structure: 'Dense collagen cords transmitting contractile tension to radius/ulna bones across a class-3 lever.',
        functionSummary: 'Anchors skeletal muscles firmly to bone without stretching, maximizing speed of movement.',
        examNote: 'Tendons join muscle-to-bone (inelastic collagen); Ligaments join bone-to-bone (elastic stability).',
      },
      {
        id: 'fascicle',
        name: 'Muscle Fascicle & Multinucleate Fibres',
        x: 385,
        y: 235,
        structure: 'Bundle of elongated striated muscle fibres wrapped inside connective perimysium sheaths.',
        functionSummary: 'Synchronizes calcium release from sarcoplasmic reticulum to coordinate whole-muscle tension.',
        examNote: 'Striated appearance comes from alternating dark A-bands and light I-bands.',
      },
      {
        id: 'sarcomere',
        name: 'Sarcomere Unit (Z-Disc to Z-Disc)',
        x: 390,
        y: 95,
        structure: 'Repeating microscopic contractile unit bounded by Z-discs containing overlapping protein bands.',
        functionSummary: 'Shortens during contraction as Z-discs are pulled closer together while filament lengths remain constant.',
        examNote: 'Functional contractile unit of skeletal & cardiac muscle; I-band and H-zone narrow during contraction, A-band stays constant!',
      },
      {
        id: 'actin_myosin',
        name: 'Actin & Myosin Cross-Bridges',
        x: 390,
        y: 145,
        structure: 'Thin Actin filaments anchored at Z-discs interleaved with thick ATPase Myosin heads.',
        functionSummary: 'ATP hydrolysis cocks myosin heads to bind actin and perform the power stroke (Sliding Filament Theory).',
        examNote: 'Calcium ions (Ca²⁺) bind troponin to expose myosin-binding sites on actin; ATP is required both for power stroke and detachment (explaining rigor mortis).',
      },
    ],
  },
  {
    id: 'respiratory_system',
    title: 'Human Respiratory & Alveoli',
    category: 'Respiratory Anatomy',
    group: 'anatomy',
    overview: 'Inspect ventilation mechanics (diaphragm & lung inflation), C-shaped tracheal cartilage rings, bronchial tree, and alveolar gas exchange.',
    parts: [
      {
        id: 'trachea',
        name: 'Trachea (C-Shaped Cartilage Rings)',
        x: 215,
        y: 68,
        structure: 'Wide vertical airway reinforced by incomplete C-shaped hyaline cartilage rings and ciliated mucus epithelium.',
        functionSummary: 'Keeps the airway permanently open against negative inspiratory pressure while sweeping trapped dust upward.',
        examNote: 'Rings are C-shaped (incomplete posteriorly) so the oesophagus behind it can bulge forward when swallowing food.',
      },
      {
        id: 'bronchi',
        name: 'Primary Bronchi & Bronchioles',
        x: 215,
        y: 132,
        structure: 'Bifurcating airways branching recursively like an inverted tree into right and left lung lobes.',
        functionSummary: 'Distributes warmed, humidified, and filtered air evenly to respiratory bronchioles.',
        examNote: 'Smooth muscle in bronchioles constricts during asthma attacks, increasing airway resistance.',
      },
      {
        id: 'lungs_pleura',
        name: 'Spongy Lungs & Pleural Membranes',
        x: 135,
        y: 165,
        structure: 'Elastic paired thoracic organs enclosed by double pleural membranes containing lubricating pleural fluid.',
        functionSummary: 'Expand passively when thoracic volume increases and pressure drops below atmospheric pressure.',
        examNote: 'Right lung has 3 lobes; Left lung has 2 lobes and a cardiac notch accommodating the heart.',
      },
      {
        id: 'diaphragm',
        name: 'Muscular Diaphragm',
        x: 215,
        y: 252,
        structure: 'Dome-shaped skeletal muscle sheet separating thoracic cavity (lungs/heart) from abdominal viscera.',
        functionSummary: 'Contracts and flattens downward during inhalation (increasing thoracic volume); relaxes upward into a dome on exhalation.',
        examNote: 'Inhalation: External intercostals contract (ribs up & out) + Diaphragm contracts (flattens) -> pressure drops -> air rushes in.',
      },
      {
        id: 'alveoli',
        name: 'Alveoli & Pulmonary Capillary Bed',
        x: 418,
        y: 172,
        structure: 'Microscopic grape-like air sacs (1 cell thick squamous epithelium) wrapped by moist capillaries and surfactant.',
        functionSummary: 'Maximizes surface area (~70 m²) for rapid diffusion of O₂ into blood and CO₂ out to expired air.',
        examNote: '4 key adaptations of alveoli: (1) huge surface area, (2) one-cell-thick moist wall, (3) dense blood supply, (4) steep concentration gradient.',
      },
    ],
  },
  {
    id: 'nervous_neuron',
    title: 'Brain & Myelinated Motor Neuron',
    category: 'Nervous System',
    group: 'anatomy',
    overview: 'Follow electrical impulse transmission from dendrites across a myelinated axon via saltatory conduction to synaptic terminals.',
    parts: [
      {
        id: 'brain_cns',
        name: 'Cerebrum, Cerebellum & Medulla',
        x: 105,
        y: 78,
        structure: 'Central control centres enclosed by cranial meninges and cerebrospinal fluid.',
        functionSummary: 'Cerebrum handles conscious memory/reasoning; Cerebellum coordinates balance/posture; Medulla controls breathing & heart rate.',
        examNote: 'Classic distinction: Cerebellum = muscular coordination & balance; Medulla oblongata = involuntary autonomic reflexes.',
      },
      {
        id: 'dendrites',
        name: 'Branched Dendrites',
        x: 92,
        y: 192,
        structure: 'Short, highly branched protoplasmic extensions radiating from the cell body.',
        functionSummary: 'Receive chemical neurotransmitter signals from adjacent neurons or receptors and conduct impulses toward the soma.',
        examNote: 'Always carry nerve impulses TOWARD the cell body (soma).',
      },
      {
        id: 'soma',
        name: 'Cell Body (Soma) & Nissl Granules',
        x: 162,
        y: 192,
        structure: 'Metabolic hub housing a prominent nucleus, mitochondria, and protein-synthesizing Nissl bodies.',
        functionSummary: 'Integrates excitatory/inhibitory synaptic inputs to initiate action potentials at the axon hillock.',
        examNote: 'Clustered cell bodies inside the CNS form grey matter; outside the CNS they form ganglia.',
      },
      {
        id: 'axon_myelin',
        name: 'Myelinated Axon & Nodes of Ranvier',
        x: 315,
        y: 192,
        structure: 'Long conducting fibre insulated by lipid-rich Schwann myelin sheaths punctuated by bare Nodes of Ranvier.',
        functionSummary: 'Transmits action potentials rapidly away from soma via jumping saltatory conduction from node to node.',
        examNote: 'Myelinated axons conduct impulses up to 100× faster (~120 m/s) than unmyelinated fibres.',
      },
      {
        id: 'synapse',
        name: 'Axon Terminals & Synaptic Cleft',
        x: 448,
        y: 192,
        structure: 'Terminal boutons packed with acetylcholine synaptic vesicles adjacent to an effector muscle or dendrite.',
        functionSummary: 'Releases neurotransmitters across the synaptic cleft upon Ca²⁺ influx, triggering unidirectional signal transfer.',
        examNote: 'Synapses guarantee one-way impulse transmission because vesicles exist ONLY on the presynaptic side.',
      },
    ],
  },
  {
    id: 'digestive_system',
    title: 'Human Digestive Tract',
    category: 'Digestive Anatomy',
    group: 'anatomy',
    overview: 'Trace mechanical & enzymatic digestion, bile emulsification, villus absorption, and water reclamation through the alimentary canal.',
    parts: [
      {
        id: 'oesophagus',
        name: 'Oesophagus (Peristalsis)',
        x: 265,
        y: 55,
        structure: 'Muscular food tube lined with circular and longitudinal smooth muscle layers.',
        functionSummary: 'Propels chewed bolus into the stomach through rhythmic waves of muscular contraction (peristalsis).',
        examNote: 'Salivary amylase (ptyalin) continues digesting starch inside the bolus until stomach acid stops it.',
      },
      {
        id: 'stomach',
        name: 'Stomach (Gastric Chyme Chamber)',
        x: 325,
        y: 112,
        structure: 'J-shaped muscular sac lined with rugae folds and gastric glands secreting HCl, pepsinogen, and mucus.',
        functionSummary: 'Acidifies chyme (pH ~1.5–2) to kill bacteria and activates pepsin to hydrolyze proteins into peptides.',
        examNote: 'Protective alkaline mucus prevents pepsin & HCl from digesting the stomach wall (ulcers happen if breached).',
      },
      {
        id: 'liver_gallbladder',
        name: 'Liver & Gallbladder (Bile)',
        x: 192,
        y: 118,
        structure: 'Largest visceral metabolic gland paired with a green sac storing alkaline bile salts.',
        functionSummary: 'Bile neutralizes acidic chyme and physically emulsifies large fat globules into tiny droplets for lipase.',
        examNote: 'Trick question alert: Bile contains NO digestive enzymes — it only emulsifies lipids physically!',
      },
      {
        id: 'pancreas',
        name: 'Pancreas (Enzymes & Insulin)',
        x: 265,
        y: 162,
        structure: 'Dual exocrine-endocrine leaf-shaped organ draining pancreatic juice into the duodenum.',
        functionSummary: 'Secretes pancreatic amylase, trypsin, and lipase; Islets of Langerhans secrete insulin & glucagon.',
        examNote: 'Alkaline HCO₃⁻ creates optimum pH ~8 for small-intestinal enzymes.',
      },
      {
        id: 'small_intestine',
        name: 'Small Intestine (Ileum & Villi)',
        x: 265,
        y: 218,
        structure: 'Highly coiled ~6 m lumen folded into finger-like villi and microscopic brush-border microvilli.',
        functionSummary: 'Completes chemical digestion and absorbs glucose/amino acids (capillaries) and fatty acids (lacteals).',
        examNote: 'Villi adaptations: 1-cell thin epithelium, vast surface area, dense capillary network, and central lacteal.',
      },
      {
        id: 'large_intestine',
        name: 'Colon (Large Intestine) & Rectum',
        x: 162,
        y: 235,
        structure: 'Wide frame of ascending, transverse, and descending colon hosting vitamin-producing gut flora.',
        functionSummary: 'Reabsorbs remaining water and mineral electrolytes while compacting undigested fibre into faeces.',
        examNote: 'Symbiotic colon bacteria synthesize Vitamin K and B-complex vitamins; rapid transit causes diarrhoea.',
      },
    ],
  },
  {
    id: 'flower_reproduction',
    title: 'Insect-Pollinated Flower',
    category: 'Plant Reproduction',
    group: 'botany',
    overview: 'Inspect floral whorls adapted for entomophilous cross-pollination, pollen tube growth, and double fertilization inside the ovule.',
    parts: [
      {
        id: 'stigma_style',
        name: 'Stigma & Style (Gynoecium)',
        x: 270,
        y: 78,
        structure: 'Sticky lobed receptive tip atop a slender tubular style leading into the ovary.',
        functionSummary: 'Captures compatible pollen grains and provides sucrose nutrients for pollen tube germination down toward ovules.',
        examNote: 'Insect-pollinated stigmas are compact & sticky inside the flower; wind-pollinated ones are feathery & hanging out.',
      },
      {
        id: 'anther_filament',
        name: 'Anther & Filament (Stamen)',
        x: 175,
        y: 112,
        structure: 'Male reproductive whorl comprising a supporting filament bearing pollen sacs (anthers).',
        functionSummary: 'Produces haploid male microspores (pollen grains) containing generative and tube nuclei.',
        examNote: 'Together Anther + Filament form the Stamen (Androecium).',
      },
      {
        id: 'petals',
        name: 'Brightly Coloured Petals (Corolla)',
        x: 385,
        y: 135,
        structure: 'Large fragrant modified leaves bearing nectar guides and basal nectaries.',
        functionSummary: 'Visually attract pollinating insects (bees, butterflies) and offer landing platforms.',
        examNote: 'Absent or greatly reduced in wind-pollinated flowers (e.g. maize, grasses).',
      },
      {
        id: 'ovary_ovules',
        name: 'Ovary & Ovules',
        x: 270,
        y: 205,
        structure: 'Swollen basal chamber of the carpel housing ovules containing embryo sacs and egg nuclei.',
        functionSummary: 'Site of double fertilization; after fertilization, Ovule matures into the SEED and Ovary into the FRUIT.',
        examNote: 'High-frequency WAEC/JAMB fact: Ovule -> Seed; Ovary -> Fruit; Ovary wall -> Pericarp.',
      },
      {
        id: 'sepal_receptacle',
        name: 'Sepals (Calyx) & Receptacle',
        x: 270,
        y: 265,
        structure: 'Protective green leaf-like whorl enclosing the unopened flower bud atop the swollen stem base.',
        functionSummary: 'Shields delicate developing reproductive organs against desiccation and herbivorous insects.',
        examNote: 'All four whorls attach onto the receptacle.',
      },
    ],
  },
  {
    id: 'human_heart',
    title: 'Human Four-Chambered Heart',
    category: 'Cardiovascular Anatomy',
    group: 'anatomy',
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
    id: 'animal_cell',
    title: 'Eukaryotic Animal Cell',
    category: 'Cell Biology',
    group: 'cell_renal',
    overview: 'Click any cellular structure in 3D or 2D to inspect its ultrastructure, metabolic role, and WAEC/JAMB exam adaptations.',
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
    category: 'Cytology',
    group: 'cell_renal',
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
    id: 'nephron',
    title: 'Kidney Nephron (Osmoregulation)',
    category: 'Excretory System',
    group: 'cell_renal',
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
    group: 'botany',
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

const CATEGORY_FILTER_OPTIONS: { id: BioCategory; label: string }[] = [
  { id: 'all', label: `All Specimens (${BIOLOGY_MODELS.length})` },
  { id: 'anatomy', label: 'Human Anatomy (6)' },
  { id: 'cell_renal', label: 'Cell & Renal (3)' },
  { id: 'botany', label: 'Botany & Plant (2)' },
];

export const BiologyLabView: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<BioCategory>('all');
  const [modelId, setModelId] = useState<string>(BIOLOGY_MODELS[0].id);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedPartId, setSelectedPartId] = useState<string>(BIOLOGY_MODELS[0].parts[0].id);
  const [quizTargetId, setQuizTargetId] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string>('');

  // 3D Viewer controls
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [explodeAmount, setExplodeAmount] = useState<number>(0);
  const [controlsOpen, setControlsOpen] = useState<boolean>(true);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [resetSeed, setResetSeed] = useState<number>(0);

  const visibleModels =
    categoryFilter === 'all'
      ? BIOLOGY_MODELS
      : BIOLOGY_MODELS.filter((m) => m.group === categoryFilter);

  const activeModel = BIOLOGY_MODELS.find((m) => m.id === modelId) || BIOLOGY_MODELS[0];
  const selectedPart =
    activeModel.parts.find((p) => p.id === selectedPartId) || activeModel.parts[0];

  // Refs synced cleanly inside Three.js animation + click handler
  const runtimeRef = useRef<Bio3DRuntime | null>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;
  const explodeRef = useRef(explodeAmount);
  explodeRef.current = explodeAmount;
  const modelIdRef = useRef(modelId);
  modelIdRef.current = modelId;
  const quizTargetRef = useRef(quizTargetId);
  quizTargetRef.current = quizTargetId;
  const activeModelRef = useRef(activeModel);
  activeModelRef.current = activeModel;

  const handleSelectCategory = (cat: BioCategory) => {
    setCategoryFilter(cat);
    if (cat !== 'all') {
      const current = BIOLOGY_MODELS.find((m) => m.id === modelId);
      if (!current || current.group !== cat) {
        const first = BIOLOGY_MODELS.find((m) => m.group === cat);
        if (first) handleSelectModel(first.id);
      }
    }
  };

  const handleSelectModel = (id: string) => {
    const next = BIOLOGY_MODELS.find((m) => m.id === id) || BIOLOGY_MODELS[0];
    setModelId(next.id);
    setSelectedPartId(next.parts[0].id);
    setQuizTargetId(null);
    setQuizFeedback('');
    setExplodeAmount(0);
  };

  const startIdentifyQuiz = () => {
    const pick = activeModel.parts[Math.floor(Math.random() * activeModel.parts.length)];
    setQuizTargetId(pick.id);
    setQuizFeedback(
      `Click the ${viewMode === '3d' ? '3D model region' : 'diagram pin'} matching: "${pick.name}"`
    );
  };

  const handlePartClick = (part: OrganelleSpec) => {
    setSelectedPartId(part.id);
    if (quizTargetRef.current) {
      if (part.id === quizTargetRef.current) {
        setQuizFeedback(`Correct! You identified ${part.name}.`);
        setQuizTargetId(null);
      } else {
        setQuizFeedback(`You selected ${part.name}. Keep looking for the target structure!`);
      }
    }
  };

  // Sync highlight + explode smoothly whenever selectedPartId or explodeAmount updates
  useEffect(() => {
    if (runtimeRef.current) {
      applyBio3DState(runtimeRef.current, selectedPartId, explodeAmount);
    }
  }, [selectedPartId, explodeAmount, modelId, viewMode]);

  // WebGL Interactive 3D Specimen Lifecycle
  useEffect(() => {
    if (viewMode !== '3d') return;
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 420;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      setContextLost(true);
      return;
    }

    let isSoftwareGl = false;
    try {
      const gl = renderer.getContext();
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const rStr = dbg
        ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
        : String(gl.getParameter(gl.RENDERER));
      if (/(swiftshader|llvmpipe|softpipe|mesa offscreen)/i.test(rStr)) {
        isSoftwareGl = true;
      }
    } catch {
      // ignore probe failure
    }

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onRestored = () => setContextLost(false);
    renderer.domElement.addEventListener('webglcontextlost', onLost);
    renderer.domElement.addEventListener('webglcontextrestored', onRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090D14');
    scene.fog = new THREE.FogExp2('#090D14', 0.032);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 80);
    camera.position.set(0.4, 1.35, 6.8);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.6;
    controls.maxDistance = 14.5;
    controls.target.set(0, 0.1, 0);

    // Three-point clinical studio lighting
    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.65);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.25);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    // Grounded specimen pedestal disc + clinical grid
    const stageGeo = new THREE.CylinderGeometry(3.2, 3.4, 0.14, 48);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.72, metalness: 0.25 });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.y = -2.42;
    stageMesh.receiveShadow = true;
    scene.add(stageMesh);

    const ringGeo = new THREE.TorusGeometry(3.25, 0.025, 10, 64);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -2.35;
    scene.add(ringMesh);

    const specimenGroup = new THREE.Group();
    scene.add(specimenGroup);

    const builtRuntime = buildBiology3DModel(modelId, specimenGroup, isSoftwareGl);
    runtimeRef.current = builtRuntime;
    applyBio3DState(builtRuntime, selectedPartId, explodeRef.current);

    // Raycast click-to-inspect (distinguish clean clicks from camera drags)
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const handlePointerDown = (ev: PointerEvent) => {
      downX = ev.clientX;
      downY = ev.clientY;
    };

    const handlePointerUp = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - downX, ev.clientY - downY);
      if (dist > 6) return; // ignore orbit drag
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(specimenGroup.children, true);
      const matched = hits.find((h) => typeof h.object.userData?.bioPartId === 'string');
      if (matched) {
        const hitId = matched.object.userData.bioPartId as string;
        const foundPart = activeModelRef.current.parts.find((p) => p.id === hitId);
        if (foundPart) {
          handlePartClick(foundPart);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    let rafId = 0;
    let timerId = 0;
    let disposed = false;
    let elapsed = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      if (disposed) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (isPlayingRef.current) {
        elapsed += dt;
        updateBiology3DAnimation(modelIdRef.current, runtimeRef.current, elapsed, explodeRef.current);
      }

      controls.autoRotate = autoRotateRef.current;
      controls.autoRotateSpeed = 1.6;
      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        timerId = window.setTimeout(() => {
          rafId = requestAnimationFrame(tick);
        }, 55);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      disposed = true;
      window.clearTimeout(timerId);
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onRestored);

      specimenGroup.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
          else obj.material.dispose();
        }
      });
      stageGeo.dispose();
      stageMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      envRT.dispose();
      controls.dispose();
      renderer.dispose();
      runtimeRef.current = null;
    };
  }, [modelId, viewMode, resetSeed]);

  const quizTargetName = activeModel.parts.find((p) => p.id === quizTargetId)?.name;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Interactive 3D Biology & Anatomy Lab
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
              Rotate, explode, and click directly onto 3D bones, muscles, lungs, neurons, organs, and plant cross-sections — or switch to 2D labelled diagrams.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-[#27272A] p-1 bg-slate-100 dark:bg-[#141418]">
              <button
                type="button"
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  viewMode === '3d'
                    ? 'bg-[#22C55E] text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D Specimen</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('2d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  viewMode === '2d'
                    ? 'bg-[#22C55E] text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2D Diagram</span>
              </button>
            </div>
            <button
              type="button"
              onClick={startIdentifyQuiz}
              className="px-3.5 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Identify Structure Quiz</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-[#27272A]">
          {CATEGORY_FILTER_OPTIONS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 mb-1.5 transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/40'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#18181B]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Specimen Model Buttons */}
        <div className="flex flex-wrap gap-2">
          {visibleModels.map((m) => (
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
            <span>{quizTargetName ? `Locate & click: ${quizTargetName}` : quizFeedback}</span>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 3D WebGL Viewport OR 2D SVG Labelled Diagram */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#A1A1AA]">
            <span>
              <strong className="text-slate-900 dark:text-white">{activeModel.category}</strong> ·{' '}
              {activeModel.overview}
            </span>
          </div>

          {viewMode === '3d' ? (
            <div className="rounded-xl border border-slate-200 dark:border-[#27272A] bg-[#090D14] overflow-hidden">
              <div className="px-3.5 py-2 bg-[#0D131D] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                <span>Drag to rotate 360° · Scroll to zoom · Click any 3D part to inspect</span>
                <span className="font-semibold text-[#22C55E]">{selectedPart.name}</span>
              </div>

              {contextLost ? (
                <div className="p-10 text-center text-xs text-slate-300 space-y-3">
                  <p>WebGL 3D context could not initialize on this browser. You can use the 2D Labelled Diagram view anytime.</p>
                  <button
                    type="button"
                    onClick={() => setViewMode('2d')}
                    className="px-4 py-2 rounded-xl bg-[#22C55E] text-white font-bold cursor-pointer"
                  >
                    Switch to 2D Labelled Diagram
                  </button>
                </div>
              ) : (
                <div ref={mountRef} className="w-full h-[360px] sm:h-[430px] cursor-grab active:cursor-grabbing" />
              )}

              {/* Compact Bottom 3D Control Dock */}
              <div className="bg-[#0D131D] border-t border-white/10 px-3.5 py-2.5 text-xs text-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((v) => !v)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoRotate((v) => !v)}
                      className={`px-2.5 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                        autoRotate
                          ? 'border-[#22C55E] text-[#22C55E] bg-[#22C55E]/15'
                          : 'border-white/15 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      Auto-Spin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExplodeAmount(0);
                        setResetSeed((s) => s + 1);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-white/15 text-slate-300 hover:bg-white/5 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset View</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setControlsOpen((v) => !v)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <span>Explode</span>
                    {controlsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {controlsOpen && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">Explode Layers:</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={explodeAmount}
                      onChange={(e) => setExplodeAmount(parseFloat(e.target.value))}
                      className="flex-1 accent-[#22C55E] cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-[#22C55E] tabular-nums w-10 text-right">
                      {Math.round(explodeAmount * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <svg viewBox="0 0 540 320" className="w-full h-auto rounded-xl border border-slate-200 dark:border-[#27272A] bg-[#0B1117]">
              {/* NEW 1: Skeletal Long Bone */}
              {activeModel.id === 'skeletal_bone' && (
                <g>
                  <ellipse cx="225" cy="52" rx="48" ry="22" fill="#DBEAFE" stroke="#60A5FA" strokeWidth="2.5" />
                  <ellipse cx="270" cy="95" rx="68" ry="38" fill="#BE123C" stroke="#FB7185" strokeWidth="2.5" />
                  <rect x="202" y="128" width="136" height="9" rx="4" fill="#38BDF8" />
                  <rect x="200" y="138" width="140" height="125" rx="14" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="3" />
                  <rect x="234" y="142" width="72" height="115" rx="10" fill="#FACC15" opacity="0.9" />
                  <line x1="270" y1="145" x2="270" y2="255" stroke="#EF4444" strokeWidth="3.5" />
                  <rect x="336" y="170" width="9" height="86" rx="4" fill="#FB923C" />
                  <ellipse cx="270" cy="278" rx="62" ry="26" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2.5" />
                </g>
              )}

              {/* NEW 2: Muscle Anatomy & Sarcomere */}
              {activeModel.id === 'muscular_anatomy' && (
                <g>
                  <rect x="115" y="42" width="32" height="175" rx="12" fill="#F1F5F9" />
                  <path d="M 115 215 L 250 235 L 250 255 L 115 235 Z" fill="#E2E8F0" />
                  <ellipse cx="165" cy="120" rx="32" ry="62" fill="#DC2626" stroke="#FCA5A5" strokeWidth="2" />
                  <ellipse cx="92" cy="128" rx="22" ry="56" fill="#991B1B" stroke="#F87171" strokeWidth="2" />
                  {/* Sarcomere inset */}
                  <rect x="295" y="45" width="195" height="130" rx="12" fill="#111827" stroke="#334155" strokeWidth="2" />
                  <line x1="315" y1="62" x2="315" y2="160" stroke="#38BDF8" strokeWidth="5" />
                  <line x1="465" y1="62" x2="465" y2="160" stroke="#38BDF8" strokeWidth="5" />
                  {[82, 110, 138].map((sy) => (
                    <g key={sy}>
                      <line x1="315" y1={sy} x2="375" y2={sy} stroke="#FEF08A" strokeWidth="3" />
                      <line x1="405" y1={sy} x2="465" y2={sy} stroke="#FEF08A" strokeWidth="3" />
                      <line x1="350" y1={sy + 12} x2="430" y2={sy + 12} stroke="#F43F5E" strokeWidth="6" strokeLinecap="round" />
                    </g>
                  ))}
                  <circle cx="385" cy="235" r="36" fill="#B91C1C" stroke="#FCA5A5" strokeWidth="3" />
                  <circle cx="375" cy="226" r="10" fill="#EF4444" />
                  <circle cx="398" cy="240" r="11" fill="#EF4444" />
                </g>
              )}

              {/* NEW 3: Human Respiratory & Alveoli */}
              {activeModel.id === 'respiratory_system' && (
                <g>
                  <rect x="200" y="34" width="30" height="82" rx="6" fill="#FDA4AF" stroke="#E2E8F0" strokeWidth="2.5" />
                  {[46, 62, 78, 94].map((ry) => (
                    <line key={ry} x1="199" y1={ry} x2="231" y2={ry} stroke="#F1F5F9" strokeWidth="3.5" />
                  ))}
                  <path d="M 215 114 L 155 155 M 215 114 L 275 155" stroke="#FB7185" strokeWidth="14" strokeLinecap="round" />
                  <ellipse cx="135" cy="175" rx="62" ry="72" fill="#BE185D" opacity="0.65" stroke="#F472B6" strokeWidth="2.5" />
                  <ellipse cx="295" cy="175" rx="60" ry="70" fill="#BE185D" opacity="0.65" stroke="#F472B6" strokeWidth="2.5" />
                  <path d="M 85 268 Q 215 230 345 268" fill="none" stroke="#DC2626" strokeWidth="12" strokeLinecap="round" />
                  {/* Alveoli */}
                  <circle cx="418" cy="172" r="44" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" />
                  <circle cx="406" cy="160" r="14" fill="#FECDD3" />
                  <circle cx="430" cy="162" r="14" fill="#FECDD3" />
                  <circle cx="418" cy="184" r="15" fill="#FECDD3" />
                </g>
              )}

              {/* NEW 4: Brain & Myelinated Motor Neuron */}
              {activeModel.id === 'nervous_neuron' && (
                <g>
                  <ellipse cx="105" cy="78" rx="52" ry="34" fill="#FDA4AF" stroke="#F43F5E" strokeWidth="2.5" />
                  <circle cx="74" cy="104" r="16" fill="#E11D48" />
                  {/* Soma & Dendrites */}
                  <path d="M 162 192 L 75 155 M 162 192 L 68 192 M 162 192 L 78 232 M 162 192 L 105 250" stroke="#818CF8" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="162" cy="192" r="32" fill="#4F46E5" stroke="#A5B4FC" strokeWidth="2.5" />
                  <circle cx="162" cy="192" r="12" fill="#FACC15" />
                  {/* Axon + Myelin */}
                  <line x1="194" y1="192" x2="435" y2="192" stroke="#38BDF8" strokeWidth="6" />
                  {[225, 290, 355].map((mx) => (
                    <rect key={mx} x={mx} y="177" width="46" height="30" rx="12" fill="#FDE047" stroke="#F59E0B" strokeWidth="2" />
                  ))}
                  {/* Synaptic Terminals */}
                  <path d="M 435 192 L 480 160 M 435 192 L 485 192 M 435 192 L 478 225" stroke="#38BDF8" strokeWidth="3.5" />
                  <circle cx="482" cy="160" r="8" fill="#22C55E" />
                  <circle cx="488" cy="192" r="8" fill="#22C55E" />
                  <circle cx="480" cy="225" r="8" fill="#22C55E" />
                </g>
              )}

              {/* NEW 5: Human Digestive System */}
              {activeModel.id === 'digestive_system' && (
                <g>
                  <line x1="265" y1="24" x2="265" y2="95" stroke="#FB7185" strokeWidth="14" strokeLinecap="round" />
                  <polygon points="150,92 248,92 175,152" fill="#7F1D1D" stroke="#B91C1C" strokeWidth="2" />
                  <circle cx="195" cy="142" r="10" fill="#16A34A" />
                  <path d="M 265 92 C 345 92 365 155 295 162 C 255 165 245 140 265 115" fill="#F43F5E" stroke="#FDA4AF" strokeWidth="2.5" />
                  <rect x="230" y="152" width="76" height="18" rx="9" fill="#FACC15" />
                  <rect x="160" y="178" width="210" height="104" rx="22" fill="none" stroke="#C2410C" strokeWidth="20" />
                  <path d="M 205 202 Q 265 188 315 205 Q 205 225 320 238 Q 210 255 310 262" fill="none" stroke="#FDA4AF" strokeWidth="12" strokeLinecap="round" />
                </g>
              )}

              {/* NEW 6: Insect-Pollinated Flower */}
              {activeModel.id === 'flower_reproduction' && (
                <g>
                  {[0, 1, 2, 3, 4].map((i) => {
                    const ang = (i - 2) * 0.42;
                    return (
                      <ellipse
                        key={i}
                        cx={270 + Math.sin(ang) * 105}
                        cy={140 - Math.cos(ang) * 40}
                        rx="45"
                        ry="78"
                        transform={`rotate(${ang * 38} ${270 + Math.sin(ang) * 105} ${140 - Math.cos(ang) * 40})`}
                        fill="#F43F5E"
                        opacity="0.88"
                        stroke="#FDA4AF"
                        strokeWidth="2"
                      />
                    );
                  })}
                  <path d="M 185 205 Q 168 150 175 112 M 355 205 Q 372 150 365 112" fill="none" stroke="#FEF08A" strokeWidth="5" />
                  <ellipse cx="175" cy="112" rx="16" ry="9" fill="#F59E0B" />
                  <ellipse cx="365" cy="112" rx="16" ry="9" fill="#F59E0B" />
                  <line x1="270" y1="80" x2="270" y2="195" stroke="#86EFAC" strokeWidth="12" strokeLinecap="round" />
                  <ellipse cx="270" cy="76" rx="22" ry="10" fill="#FDE047" />
                  <ellipse cx="270" cy="208" rx="44" ry="38" fill="#4ADE80" stroke="#16A34A" strokeWidth="3" />
                  <circle cx="258" cy="204" r="9" fill="#FEF9C3" />
                  <circle cx="282" cy="204" r="9" fill="#FEF9C3" />
                  <path d="M 205 262 Q 270 242 335 262" fill="none" stroke="#22C55E" strokeWidth="14" strokeLinecap="round" />
                  <line x1="270" y1="255" x2="270" y2="305" stroke="#15803D" strokeWidth="12" />
                </g>
              )}

              {/* Existing 5 SVG Models */}
              {activeModel.id === 'animal_cell' && (
                <g>
                  <ellipse cx="270" cy="165" rx="215" ry="125" fill="#13222F" stroke="#22C55E" strokeWidth="4" />
                  <ellipse cx="270" cy="165" rx="205" ry="116" fill="#172A3A" stroke="#38BDF8" strokeDasharray="6 4" strokeWidth="1.5" />
                  <circle cx="240" cy="165" r="46" fill="#312E81" stroke="#818CF8" strokeWidth="3" />
                  <circle cx="245" cy="160" r="14" fill="#6366F1" />
                  <path d="M 190 120 Q 150 110 140 140 Q 170 148 188 135 Z" fill="#0E7490" stroke="#22D3EE" strokeWidth="1.5" />
                  <ellipse cx="385" cy="125" rx="34" ry="17" transform="rotate(-18 385 125)" fill="#9A3412" stroke="#FB923C" strokeWidth="2" />
                  <path d="M 325 225 Q 355 215 385 225 M 330 238 Q 355 228 380 238 M 335 250 Q 355 242 375 250" fill="none" stroke="#FACC15" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="145" cy="245" r="16" fill="#9F1239" stroke="#FB7185" strokeWidth="2" />
                </g>
              )}

              {activeModel.id === 'plant_cell' && (
                <g>
                  <polygon points="85,45 455,45 495,160 455,275 85,275 45,160" fill="#14532D" stroke="#22C55E" strokeWidth="6" />
                  <polygon points="96,57 444,57 480,160 444,263 96,263 60,160" fill="#166534" stroke="#86EFAC" strokeWidth="2" />
                  <ellipse cx="265" cy="185" rx="115" ry="62" fill="#0369A1" stroke="#38BDF8" strokeWidth="2.5" opacity="0.85" />
                  <ellipse cx="150" cy="115" rx="30" ry="15" fill="#15803D" stroke="#4ADE80" strokeWidth="2" />
                  <ellipse cx="360" cy="105" rx="28" ry="14" fill="#15803D" stroke="#4ADE80" strokeWidth="2" />
                  <circle cx="385" cy="245" r="28" fill="#4338CA" stroke="#A5B4FC" strokeWidth="2.5" />
                  <ellipse cx="165" cy="255" rx="26" ry="13" fill="#9A3412" stroke="#FB923C" strokeWidth="2" />
                </g>
              )}

              {activeModel.id === 'human_heart' && (
                <g>
                  <path d="M 270 285 C 165 250 115 180 135 120 C 155 75 220 80 265 115 C 300 75 375 75 395 125 C 415 185 355 255 270 285 Z" fill="#7F1D1D" stroke="#F87171" strokeWidth="3" />
                  <line x1="255" y1="120" x2="268" y2="278" stroke="#FCA5A5" strokeWidth="5" strokeLinecap="round" />
                  <ellipse cx="178" cy="140" rx="36" ry="26" fill="#1D4ED8" opacity="0.7" />
                  <ellipse cx="192" cy="222" rx="42" ry="38" fill="#1E40AF" opacity="0.75" />
                  <ellipse cx="325" cy="135" rx="36" ry="26" fill="#DC2626" opacity="0.8" />
                  <ellipse cx="315" cy="230" rx="44" ry="42" fill="#B91C1C" opacity="0.85" />
                  <path d="M 275 125 C 275 50 220 55 220 100" fill="none" stroke="#EF4444" strokeWidth="18" strokeLinecap="round" />
                </g>
              )}

              {activeModel.id === 'nephron' && (
                <g>
                  <circle cx="115" cy="115" r="34" fill="#1E293B" stroke="#FACC15" strokeWidth="4" />
                  <circle cx="115" cy="115" r="18" fill="#DC2626" opacity="0.85" />
                  <path
                    d="M 149 115 Q 185 80 215 105 Q 245 130 245 255 Q 270 290 295 255 L 295 140 Q 335 110 385 135 L 395 275"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line x1="395" y1="75" x2="395" y2="290" stroke="#38BDF8" strokeWidth="14" strokeLinecap="round" />
                </g>
              )}

              {activeModel.id === 'leaf_flower' && (
                <g>
                  <rect x="65" y="55" width="410" height="24" rx="4" fill="#86EFAC" opacity="0.8" />
                  {[90, 145, 200, 255, 310].map((px) => (
                    <rect key={px} x={px} y="82" width="42" height="72" rx="6" fill="#16A34A" stroke="#4ADE80" strokeWidth="2" />
                  ))}
                  <circle cx="350" cy="170" r="34" fill="#1E293B" stroke="#F59E0B" strokeWidth="3" />
                  <circle cx="350" cy="158" r="12" fill="#EF4444" />
                  <circle cx="350" cy="182" r="12" fill="#38BDF8" />
                  {[110, 165, 225, 420].map((sx, idx) => (
                    <circle key={sx} cx={sx} cy={idx % 2 === 0 ? 195 : 210} r="22" fill="#15803D" stroke="#4ADE80" strokeWidth="2" />
                  ))}
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
          )}
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
