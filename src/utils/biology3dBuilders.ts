import * as THREE from 'three';

export interface Bio3DRuntime {
  partGroups: Map<string, THREE.Object3D[]>;
  partCenters: Map<string, THREE.Vector3>;
  baseOffsets: Map<THREE.Object3D, THREE.Vector3>;
  anim: Record<string, any>;
}

/** Recursively tag every mesh in an Object3D subtree with a biology part ID */
function tagBioPart(
  root: THREE.Group,
  runtime: Bio3DRuntime,
  partId: string,
  obj: THREE.Object3D,
  explodeDir?: THREE.Vector3
) {
  obj.traverse((child) => {
    child.userData.bioPartId = partId;
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  const list = runtime.partGroups.get(partId) || [];
  list.push(obj);
  runtime.partGroups.set(partId, list);
  if (explodeDir) {
    runtime.baseOffsets.set(obj, obj.position.clone());
    obj.userData.explodeVec = explodeDir.clone();
  }
  root.add(obj);
}

/** Update highlight emissive state and explode offset cleanly without GC churn */
export function applyBio3DState(
  runtime: Bio3DRuntime,
  selectedPartId: string | null,
  explodeAmount: number
) {
  runtime.partGroups.forEach((objs, partId) => {
    const isSel = partId === selectedPartId;
    objs.forEach((obj) => {
      const basePos = runtime.baseOffsets.get(obj);
      const expVec = obj.userData.explodeVec as THREE.Vector3 | undefined;
      if (basePos && expVec && !obj.userData.skipExplode) {
        obj.position.set(
          basePos.x + expVec.x * explodeAmount,
          basePos.y + expVec.y * explodeAmount,
          basePos.z + expVec.z * explodeAmount
        );
      }
      obj.traverse((child: any) => {
        if (child.isMesh && child.material && 'emissive' in child.material) {
          if (child.userData.baseEmissive === undefined) {
            child.userData.baseEmissive = child.material.emissive.getHex();
            child.userData.baseEmissiveIntensity = child.material.emissiveIntensity ?? 0.2;
          }
          if (isSel) {
            child.material.emissive.setHex(0x22c55e);
            child.material.emissiveIntensity = 0.52;
          } else {
            child.material.emissive.setHex(child.userData.baseEmissive);
            child.material.emissiveIntensity = child.userData.baseEmissiveIntensity;
          }
        }
      });
    });
  });
}

function makeTube(
  points: [number, number, number][],
  radius: number,
  color: number,
  roughness = 0.45,
  metalness = 0.08,
  tubularSegments = 36,
  radialSegments = 12,
  opacity = 1
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    transparent: opacity < 1,
    opacity,
  });
  return new THREE.Mesh(geo, mat);
}

/** Build the procedural composite 3D anatomical specimen for any Biology Lab modelId */
export function buildBiology3DModel(
  modelId: string,
  root: THREE.Group,
  isSoftwareGl: boolean
): Bio3DRuntime {
  const runtime: Bio3DRuntime = {
    partGroups: new Map(),
    partCenters: new Map(),
    baseOffsets: new Map(),
    anim: {},
  };

  const seg = isSoftwareGl ? 18 : 30;

  // =========================================================================
  // 1. SKELETAL BONE (3D Long Bone Femur Cutaway)
  // =========================================================================
  if (modelId === 'skeletal_bone') {
    // 1. Articular Cartilage caps (smooth bluish-white hyaline cartilage)
    const cartilageMat = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      roughness: 0.18,
      clearcoat: 0.65,
      metalness: 0.05,
    });
    const cartTopL = new THREE.Mesh(new THREE.SphereGeometry(0.92, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.55), cartilageMat);
    cartTopL.position.set(-0.65, 2.38, 0);
    cartTopL.rotation.z = 0.35;
    tagBioPart(root, runtime, 'cartilage', cartTopL, new THREE.Vector3(0, 0.85, 0));

    const cartBot = new THREE.Mesh(new THREE.SphereGeometry(0.86, seg, seg, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), cartilageMat.clone());
    cartBot.scale.set(1.25, 0.72, 0.9);
    cartBot.position.set(0.1, -2.05, 0);
    tagBioPart(root, runtime, 'cartilage', cartBot, new THREE.Vector3(0, -0.75, 0));

    // 2. Spongy Trabecular Bone (porous red-pink cancellous head)
    const spongyGrp = new THREE.Group();
    spongyGrp.position.set(0, 1.85, 0);
    const spongyCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, seg, seg),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.85, metalness: 0.04 })
    );
    spongyCore.scale.set(1.32, 0.85, 0.78);
    spongyGrp.add(spongyCore);
    // Porous trabecular struts
    const trabMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.72 });
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const pore = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), trabMat);
      pore.position.set(Math.cos(ang) * 0.65, Math.sin(ang * 2) * 0.35, Math.sin(ang) * 0.45);
      spongyGrp.add(pore);
    }
    tagBioPart(root, runtime, 'spongy_bone', spongyGrp, new THREE.Vector3(-0.7, 0.5, 0.3));

    // 3. Epiphyseal Growth Plate (disc separating epiphysis & diaphysis)
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.72, 0.14, seg),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35, metalness: 0.1 })
    );
    plate.position.set(0, 1.28, 0);
    tagBioPart(root, runtime, 'epiphyseal_plate', plate, new THREE.Vector3(-0.6, 0.25, 0.6));

    // 4. Compact Cortical Bone (cutaway C-shaped ivory diaphysis shell)
    const compactShell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.68, 3.0, seg, 1, false, Math.PI * 0.35, Math.PI * 1.45),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.48, metalness: 0.05, side: THREE.DoubleSide })
    );
    compactShell.position.set(0, -0.25, 0);
    tagBioPart(root, runtime, 'compact_bone', compactShell, new THREE.Vector3(-0.75, 0, -0.45));

    // Cutaway wall thickness rim
    const wallRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.46, 2.98, seg, 1, false, Math.PI * 0.35, Math.PI * 1.45),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.58, side: THREE.DoubleSide })
    );
    wallRim.position.set(0, -0.25, 0);
    tagBioPart(root, runtime, 'compact_bone', wallRim, new THREE.Vector3(-0.75, 0, -0.45));

    // 5. Medullary Cavity & Yellow Bone Marrow + Nutrient Artery
    const marrowGrp = new THREE.Group();
    marrowGrp.position.set(0, -0.25, 0);
    const marrowCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 2.7, seg),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.42, metalness: 0.05 })
    );
    const nutrientArtery = makeTube(
      [
        [0.42, 0.3, 0.38],
        [0.18, 0.0, 0.2],
        [0.05, -0.8, 0.12],
        [0.02, 1.0, 0.08],
      ],
      0.045,
      0xef4444,
      0.35
    );
    marrowGrp.add(marrowCore, nutrientArtery);
    tagBioPart(root, runtime, 'bone_marrow', marrowGrp, new THREE.Vector3(0.8, 0, 0.7));

    // 6. Periosteum (outer vascularized sleeve cuff)
    const periosteum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.73, 0.73, 0.95, seg, 1, true, Math.PI * 0.4, Math.PI * 1.35),
      new THREE.MeshStandardMaterial({ color: 0xfb923c, roughness: 0.65, side: THREE.DoubleSide })
    );
    periosteum.position.set(0, -0.85, 0);
    tagBioPart(root, runtime, 'periosteum', periosteum, new THREE.Vector3(0.75, -0.25, -0.5));
  }

  // =========================================================================
  // 2. MUSCULAR ANATOMY (Antagonistic Arm Muscles & Sliding Sarcomere)
  // =========================================================================
  else if (modelId === 'muscular_anatomy') {
    // 1. Humerus (upper bone) + Forearm Pivot (Radius & Ulna)
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45, metalness: 0.05 });
    const humerus = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 2.8, seg), boneMat);
    humerus.position.set(-1.35, 1.05, 0);
    tagBioPart(root, runtime, 'tendon', humerus);

    const elbowBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, seg, seg),
      new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.25 })
    );
    elbowBall.position.set(-1.35, -0.45, 0);
    tagBioPart(root, runtime, 'tendon', elbowBall);

    const forearmPivot = new THREE.Group();
    forearmPivot.position.set(-1.35, -0.45, 0);
    const radiusBone = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 2.4, seg), boneMat);
    radiusBone.rotation.z = -Math.PI / 2;
    radiusBone.position.set(1.2, 0.08, 0.1);
    const ulnaBone = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 2.45, seg), boneMat);
    ulnaBone.rotation.z = -Math.PI / 2;
    ulnaBone.position.set(1.2, -0.1, -0.1);
    forearmPivot.add(radiusBone, ulnaBone);
    forearmPivot.userData.skipExplode = true;
    tagBioPart(root, runtime, 'tendon', forearmPivot);

    // 2. Biceps Brachii (flexor - bulges smoothly on contraction)
    const bicepsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, seg, seg),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.55, metalness: 0.06 })
    );
    bicepsMesh.scale.set(0.85, 2.05, 0.9);
    bicepsMesh.position.set(-0.92, 0.95, 0);
    tagBioPart(root, runtime, 'biceps', bicepsMesh, new THREE.Vector3(0.4, 0.2, 0.6));

    // Biceps Tendon anchoring to Radius
    const bicepsTendon = makeTube(
      [
        [-0.95, 0.15, 0],
        [-0.85, -0.25, 0.08],
        [-0.55, -0.4, 0.1],
      ],
      0.08,
      0xe2e8f0,
      0.32
    );
    tagBioPart(root, runtime, 'tendon', bicepsTendon, new THREE.Vector3(0.3, -0.2, 0.5));

    // 3. Triceps Brachii (extensor - posterior side of humerus)
    const tricepsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, seg, seg),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6, metalness: 0.05 })
    );
    tricepsMesh.scale.set(0.8, 2.15, 0.85);
    tricepsMesh.position.set(-1.78, 1.0, 0);
    tagBioPart(root, runtime, 'triceps', tricepsMesh, new THREE.Vector3(-0.65, 0.15, -0.35));

    // 4. Magnified Sarcomere & Myofibril Display (right half of stage)
    const sarcoGrp = new THREE.Group();
    sarcoGrp.position.set(1.55, 1.15, 0);

    // Z-discs
    const zMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35, metalness: 0.25 });
    const zLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.7, 1.15), zMat);
    zLeft.position.x = -1.15;
    const zRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.7, 1.15), zMat);
    zRight.position.x = 1.15;
    sarcoGrp.add(zLeft, zRight);

    // Thin Actin Filaments attached to Z-discs
    const actinMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });
    const actinLeftGrp = new THREE.Group();
    const actinRightGrp = new THREE.Group();
    [-0.55, -0.18, 0.18, 0.55].forEach((yOff) => {
      [-0.25, 0.25].forEach((zOff) => {
        const aL = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.88, 10), actinMat);
        aL.rotation.z = Math.PI / 2;
        aL.position.set(-0.7, yOff, zOff);
        actinLeftGrp.add(aL);

        const aR = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.88, 10), actinMat);
        aR.rotation.z = Math.PI / 2;
        aR.position.set(0.7, yOff, zOff);
        actinRightGrp.add(aR);
      });
    });
    sarcoGrp.add(actinLeftGrp, actinRightGrp);
    tagBioPart(root, runtime, 'actin_myosin', sarcoGrp, new THREE.Vector3(0.65, 0.3, 0));

    // Thick Myosin filaments (A-band)
    const myosinGrp = new THREE.Group();
    myosinGrp.position.set(1.55, 1.15, 0);
    const myosinMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.38, metalness: 0.15 });
    [-0.36, 0, 0.36].forEach((yOff) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.25, 12), myosinMat);
      m.rotation.z = Math.PI / 2;
      m.position.set(0, yOff, 0);
      myosinGrp.add(m);
    });
    tagBioPart(root, runtime, 'sarcomere', myosinGrp, new THREE.Vector3(0.65, 0.3, 0.45));

    // Muscle Fascicle cross-section cylinder
    const fascicleGrp = new THREE.Group();
    fascicleGrp.position.set(1.55, -0.85, 0);
    const epimysium = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 1.1, seg, 1, false, 0, Math.PI * 1.7),
      new THREE.MeshStandardMaterial({ color: 0xfca5a5, roughness: 0.55, side: THREE.DoubleSide })
    );
    epimysium.rotation.z = Math.PI / 2;
    fascicleGrp.add(epimysium);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const fiber = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 1.25, 12),
        new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 })
      );
      fiber.rotation.z = Math.PI / 2;
      fiber.position.set(0.05, Math.sin(a) * 0.28, Math.cos(a) * 0.28);
      fascicleGrp.add(fiber);
    }
    tagBioPart(root, runtime, 'fascicle', fascicleGrp, new THREE.Vector3(0.5, -0.5, 0.4));

    runtime.anim = { forearmPivot, bicepsMesh, tricepsMesh, zLeft, zRight, actinLeftGrp, actinRightGrp };
  }

  // =========================================================================
  // 3. RESPIRATORY SYSTEM (Trachea, Bronchi, Breathing Lungs, Diaphragm, Alveoli)
  // =========================================================================
  else if (modelId === 'respiratory_system') {
    // 1. Trachea + C-shaped hyaline cartilage rings
    const tracheaGrp = new THREE.Group();
    const windpipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 2.1, seg),
      new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.55 })
    );
    windpipe.position.y = 1.65;
    tracheaGrp.add(windpipe);

    const ringMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.1 });
    for (let i = 0; i < 8; i++) {
      const cRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 10, seg, Math.PI * 1.55), ringMat);
      cRing.rotation.x = Math.PI / 2;
      cRing.rotation.z = -Math.PI * 0.27;
      cRing.position.y = 0.8 + i * 0.24;
      tracheaGrp.add(cRing);
    }
    tagBioPart(root, runtime, 'trachea', tracheaGrp, new THREE.Vector3(0, 0.8, 0));

    // 2. Bronchi & Bronchial Tree
    const bronchiGrp = new THREE.Group();
    const leftBronchus = makeTube([[0, 0.65, 0], [-0.55, 0.35, 0], [-1.05, 0.12, 0.08]], 0.16, 0xfb7185, 0.45);
    const rightBronchus = makeTube([[0, 0.65, 0], [0.55, 0.32, 0], [1.05, 0.05, 0.08]], 0.17, 0xfb7185, 0.45);
    const b1 = makeTube([[-0.7, 0.28, 0.04], [-1.25, -0.35, 0.15]], 0.08, 0xfda4af, 0.5);
    const b2 = makeTube([[0.7, 0.25, 0.04], [1.25, -0.45, 0.15]], 0.08, 0xfda4af, 0.5);
    bronchiGrp.add(leftBronchus, rightBronchus, b1, b2);
    tagBioPart(root, runtime, 'bronchi', bronchiGrp, new THREE.Vector3(0, 0.35, 0.5));

    // 3. Translucent Spongy Lung Lobes (inflate/deflate smoothly)
    const lungMatR = new THREE.MeshPhysicalMaterial({
      color: 0xf472b6,
      roughness: 0.42,
      transparent: true,
      opacity: 0.72,
      clearcoat: 0.3,
    });
    const lungR = new THREE.Mesh(new THREE.SphereGeometry(0.95, seg, seg), lungMatR);
    lungR.scale.set(0.88, 1.48, 0.85);
    lungR.position.set(-1.12, -0.05, 0);
    tagBioPart(root, runtime, 'lungs_pleura', lungR, new THREE.Vector3(-0.75, 0.1, 0));

    const lungL = new THREE.Mesh(new THREE.SphereGeometry(0.92, seg, seg), lungMatR.clone());
    lungL.scale.set(0.84, 1.44, 0.84);
    lungL.position.set(1.12, -0.08, 0);
    tagBioPart(root, runtime, 'lungs_pleura', lungL, new THREE.Vector3(0.75, 0.1, 0));

    // 4. Muscular Diaphragm Dome
    const diaphragm = new THREE.Mesh(
      new THREE.SphereGeometry(1.75, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.42),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.58, side: THREE.DoubleSide })
    );
    diaphragm.scale.set(1.18, 0.45, 0.65);
    diaphragm.position.set(0, -1.75, 0);
    tagBioPart(root, runtime, 'diaphragm', diaphragm, new THREE.Vector3(0, -0.75, 0));

    // 5. Enlarged Alveolar Gas-Exchange Cluster (placed clearly to side-front)
    const alvGrp = new THREE.Group();
    alvGrp.position.set(2.35, -0.75, 0.55);
    const alvMat = new THREE.MeshStandardMaterial({ color: 0xfecdd3, roughness: 0.35 });
    [
      [0, 0, 0],
      [0.32, 0.22, 0.1],
      [-0.3, 0.2, 0.12],
      [0.15, -0.28, 0.18],
      [-0.22, -0.24, -0.1],
    ].forEach(([ax, ay, az]) => {
      const sac = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), alvMat);
      sac.position.set(ax, ay, az);
      alvGrp.add(sac);
    });
    const capRed = makeTube([[-0.48, 0.3, 0.2], [0, 0.05, 0.32], [0.45, -0.3, 0.18]], 0.045, 0xef4444, 0.3);
    const capBlue = makeTube([[-0.45, -0.25, -0.15], [0, 0.2, -0.28], [0.48, 0.25, 0.05]], 0.045, 0x3b82f6, 0.3);
    alvGrp.add(capRed, capBlue);
    tagBioPart(root, runtime, 'alveoli', alvGrp, new THREE.Vector3(0.7, -0.2, 0.6));

    runtime.anim = { lungR, lungL, diaphragm };
  }

  // =========================================================================
  // 4. NERVOUS SYSTEM & MOTOR NEURON (Brain + Myelinated Neuron + Pulse)
  // =========================================================================
  else if (modelId === 'nervous_neuron') {
    // 1. Brain Reference (Cerebrum + Cerebellum + Stem on upper left)
    const brainGrp = new THREE.Group();
    brainGrp.position.set(-2.0, 1.5, -0.4);
    const hemiMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.62 });
    const leftHemi = new THREE.Mesh(new THREE.SphereGeometry(0.75, seg, seg), hemiMat);
    leftHemi.scale.set(1.1, 0.85, 0.72);
    leftHemi.position.set(0, 0, -0.32);
    const rightHemi = new THREE.Mesh(new THREE.SphereGeometry(0.75, seg, seg), hemiMat);
    rightHemi.scale.set(1.1, 0.85, 0.72);
    rightHemi.position.set(0, 0, 0.32);
    const cerebellum = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.72 })
    );
    cerebellum.position.set(-0.45, -0.52, 0);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.14, 0.75, 14),
      new THREE.MeshStandardMaterial({ color: 0xfecdd3, roughness: 0.55 })
    );
    stem.position.set(-0.15, -0.78, 0);
    brainGrp.add(leftHemi, rightHemi, cerebellum, stem);
    tagBioPart(root, runtime, 'brain_cns', brainGrp, new THREE.Vector3(-0.7, 0.6, -0.4));

    // 2. Neuron Soma (Cell Body) & Nucleus
    const somaGrp = new THREE.Group();
    somaGrp.position.set(-1.3, -0.15, 0.25);
    const soma = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, seg, seg),
      new THREE.MeshPhysicalMaterial({ color: 0x6366f1, roughness: 0.32, transparent: true, opacity: 0.85 })
    );
    const nNucleus = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 })
    );
    somaGrp.add(soma, nNucleus);
    tagBioPart(root, runtime, 'soma', somaGrp, new THREE.Vector3(-0.5, 0.3, 0.4));

    // 3. Branched Dendrites
    const dendGrp = new THREE.Group();
    dendGrp.position.set(-1.3, -0.15, 0.25);
    const dendAngles = [2.2, 2.7, 3.2, 3.8, 4.3];
    dendAngles.forEach((ang, idx) => {
      const dx = Math.cos(ang) * 1.15;
      const dy = Math.sin(ang) * 1.05;
      const dz = (idx % 2 === 0 ? 1 : -1) * 0.35;
      const branch = makeTube([[0, 0, 0], [dx * 0.5, dy * 0.5, dz * 0.4], [dx, dy, dz]], 0.06, 0x818cf8, 0.4);
      dendGrp.add(branch);
    });
    tagBioPart(root, runtime, 'dendrites', dendGrp, new THREE.Vector3(-0.85, 0, 0.3));

    // 4. Long Axon Fiber
    const axon = makeTube(
      [
        [-0.7, -0.15, 0.25],
        [0.4, -0.18, 0.25],
        [1.5, -0.15, 0.25],
        [2.55, -0.15, 0.25],
      ],
      0.075,
      0x38bdf8,
      0.3,
      0.15
    );
    tagBioPart(root, runtime, 'axon_myelin', axon);

    // 5. Segmented Schwann Myelin Sheaths (Nodes of Ranvier gaps between them)
    const myelinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.38, metalness: 0.08 });
    [-0.15, 0.65, 1.45, 2.2].forEach((mx) => {
      const sheath = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.36, 10, seg), myelinMat.clone());
      sheath.rotation.z = Math.PI / 2;
      sheath.position.set(mx, -0.16, 0.25);
      tagBioPart(root, runtime, 'axon_myelin', sheath, new THREE.Vector3(0, 0.45, 0.35));
    });

    // 6. Axon Terminals & Synaptic Boutons
    const synGrp = new THREE.Group();
    synGrp.position.set(2.55, -0.15, 0.25);
    [
      [0.65, 0.45, 0.2],
      [0.72, 0.0, -0.25],
      [0.62, -0.45, 0.15],
    ].forEach(([tx, ty, tz]) => {
      const twig = makeTube([[0, 0, 0], [tx * 0.5, ty * 0.5, tz * 0.5], [tx, ty, tz]], 0.045, 0x38bdf8, 0.35);
      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.35, roughness: 0.3 })
      );
      knob.position.set(tx, ty, tz);
      synGrp.add(twig, knob);
    });
    tagBioPart(root, runtime, 'synapse', synGrp, new THREE.Vector3(0.75, 0, 0.2));

    // Action Potential Saltatory Impulse Sphere
    const impulseSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x4ade80,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.78,
      })
    );
    impulseSphere.position.set(-0.7, -0.16, 0.25);
    root.add(impulseSphere);
    runtime.anim = { impulseSphere };
  }

  // =========================================================================
  // 5. DIGESTIVE SYSTEM (Oesophagus, Stomach, Liver/Gallbladder, Pancreas, Intestines)
  // =========================================================================
  else if (modelId === 'digestive_system') {
    // 1. Oesophagus
    const oesophagus = makeTube([[0, 2.55, 0], [0.05, 1.85, 0], [0.22, 1.35, 0.05]], 0.16, 0xfb7185, 0.5);
    tagBioPart(root, runtime, 'oesophagus', oesophagus, new THREE.Vector3(0, 0.75, 0));

    // 2. J-Shaped Stomach
    const stomach = makeTube(
      [
        [0.22, 1.35, 0.05],
        [0.78, 1.15, 0.15],
        [0.85, 0.55, 0.22],
        [0.35, 0.42, 0.12],
        [-0.05, 0.55, 0.05],
      ],
      0.34,
      0xf43f5e,
      0.42
    );
    tagBioPart(root, runtime, 'stomach', stomach, new THREE.Vector3(0.7, 0.35, 0.4));

    // 3. Liver (large brown-red triangular wedge) & Green Gallbladder
    const liverGrp = new THREE.Group();
    const liver = new THREE.Mesh(
      new THREE.ConeGeometry(0.92, 1.45, seg),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.48, metalness: 0.06 })
    );
    liver.rotation.z = -Math.PI * 0.42;
    liver.scale.set(0.85, 1.0, 0.65);
    liver.position.set(-0.68, 1.08, 0.18);
    const gallbladder = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.25 })
    );
    gallbladder.scale.set(0.85, 1.3, 0.85);
    gallbladder.position.set(-0.5, 0.62, 0.32);
    liverGrp.add(liver, gallbladder);
    tagBioPart(root, runtime, 'liver_gallbladder', liverGrp, new THREE.Vector3(-0.75, 0.4, 0.45));

    // 4. Pancreas (yellowish leaf-shaped gland tucked behind stomach/duodenum)
    const pancreas = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.17, 0.85, 10, seg),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55 })
    );
    pancreas.rotation.z = Math.PI * 0.44;
    pancreas.position.set(0.28, 0.38, -0.25);
    tagBioPart(root, runtime, 'pancreas', pancreas, new THREE.Vector3(0.45, 0.1, -0.65));

    // 5. Coiled Small Intestine (Ileum & Duodenum)
    const smallPts: [number, number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = Math.sin(t * Math.PI * 5) * 0.62;
      const y = 0.05 - t * 1.15;
      const z = Math.cos(t * Math.PI * 4) * 0.28;
      smallPts.push([x, y, z]);
    }
    const smallIntestine = makeTube(smallPts, 0.14, 0xfda4af, 0.45);
    tagBioPart(root, runtime, 'small_intestine', smallIntestine, new THREE.Vector3(0, 0, 0.85));

    // 6. Large Intestine Colon Frame (ascending -> transverse -> descending -> rectum)
    const colon = makeTube(
      [
        [-0.98, -1.25, 0],
        [-1.08, -0.1, 0.08],
        [-0.92, 0.22, 0.12],
        [0.0, 0.18, 0.18],
        [0.95, 0.2, 0.12],
        [1.05, -0.85, 0.05],
        [0.45, -1.35, -0.05],
        [0.05, -1.75, -0.1],
      ],
      0.24,
      0xc2410c,
      0.58
    );
    tagBioPart(root, runtime, 'large_intestine', colon, new THREE.Vector3(0, -0.65, -0.3));
  }

  // =========================================================================
  // 6. INSECT-POLLINATED FLOWER REPRODUCTION (Stigma, Ovary, Stamens, Petals, Sepals)
  // =========================================================================
  else if (modelId === 'flower_reproduction') {
    // 1. Receptacle & Pedicel Stem + Green Sepals
    const pedicel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 1.8, seg),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 })
    );
    pedicel.position.y = -1.45;
    const receptacle = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, seg, seg),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55 })
    );
    receptacle.scale.set(1.2, 0.65, 1.2);
    receptacle.position.y = -0.55;
    tagBioPart(root, runtime, 'sepal_receptacle', pedicel);
    tagBioPart(root, runtime, 'sepal_receptacle', receptacle);

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const sepal = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.95, 12),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.55 })
      );
      sepal.position.set(Math.cos(a) * 0.68, -0.52, Math.sin(a) * 0.68);
      sepal.rotation.z = -Math.cos(a) * 1.1;
      sepal.rotation.x = Math.sin(a) * 1.1;
      tagBioPart(root, runtime, 'sepal_receptacle', sepal, new THREE.Vector3(Math.cos(a) * 0.4, -0.45, Math.sin(a) * 0.4));
    }

    // 2. Bright Curved Petals (Corolla)
    const petalMat = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      roughness: 0.35,
      clearcoat: 0.25,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.78, seg, seg, 0, Math.PI, 0, Math.PI * 0.7), petalMat);
      petal.scale.set(0.75, 1.35, 0.16);
      petal.position.set(Math.cos(a) * 1.12, 0.25, Math.sin(a) * 1.12);
      petal.rotation.y = -a + Math.PI / 2;
      petal.rotation.x = 0.68;
      tagBioPart(root, runtime, 'petals', petal, new THREE.Vector3(Math.cos(a) * 0.8, 0.15, Math.sin(a) * 0.8));
    }

    // 3. Central Carpel: Stigma & Style
    const style = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.13, 1.45, seg),
      new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.4 })
    );
    style.position.y = 0.75;
    const stigma = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, seg, seg),
      new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.35 })
    );
    stigma.scale.set(1.25, 0.65, 1.25);
    stigma.position.y = 1.52;
    tagBioPart(root, runtime, 'stigma_style', style, new THREE.Vector3(0, 0.65, 0));
    tagBioPart(root, runtime, 'stigma_style', stigma, new THREE.Vector3(0, 0.85, 0));

    // 4. Cutaway Swollen Ovary containing Ovules
    const ovaryGrp = new THREE.Group();
    ovaryGrp.position.y = -0.1;
    const ovaryWall = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, seg, seg, 0, Math.PI * 1.4),
      new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.45, side: THREE.DoubleSide })
    );
    ovaryWall.scale.set(1, 1.25, 1);
    ovaryGrp.add(ovaryWall);
    const ovuleMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.3 });
    [0.15, -0.12].forEach((oy) => {
      [-0.14, 0.14].forEach((ox) => {
        const ovule = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), ovuleMat);
        ovule.position.set(ox, oy, 0);
        ovaryGrp.add(ovule);
      });
    });
    tagBioPart(root, runtime, 'ovary_ovules', ovaryGrp, new THREE.Vector3(0, 0.15, 0.65));

    // 5. Stamens (Filaments + Pollen-Dusted Anthers)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const stamenGrp = new THREE.Group();
      const filament = makeTube(
        [
          [Math.cos(a) * 0.36, -0.35, Math.sin(a) * 0.36],
          [Math.cos(a) * 0.65, 0.35, Math.sin(a) * 0.65],
          [Math.cos(a) * 0.72, 1.05, Math.sin(a) * 0.72],
        ],
        0.038,
        0xfef08a,
        0.4
      );
      const anther = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.1, 0.22, 8, 12),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 })
      );
      anther.position.set(Math.cos(a) * 0.72, 1.12, Math.sin(a) * 0.72);
      anther.rotation.z = Math.PI / 2;
      anther.rotation.y = a;
      stamenGrp.add(filament, anther);
      tagBioPart(root, runtime, 'anther_filament', stamenGrp, new THREE.Vector3(Math.cos(a) * 0.5, 0.45, Math.sin(a) * 0.5));
    }
  }

  // =========================================================================
  // 7. HUMAN HEART (Beating 4-Chambered Heart + Aortic Arch)
  // =========================================================================
  else if (modelId === 'human_heart') {
    const heartPivot = new THREE.Group();
    root.add(heartPivot);

    const ra = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, seg, seg),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45 })
    );
    ra.position.set(-0.68, 0.65, 0.12);
    tagBioPart(root, runtime, 'ra', ra, new THREE.Vector3(-0.6, 0.4, 0.3));

    const rv = new THREE.Mesh(
      new THREE.ConeGeometry(0.74, 1.55, seg),
      new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.5 })
    );
    rv.rotation.z = Math.PI;
    rv.position.set(-0.46, -0.45, 0.15);
    tagBioPart(root, runtime, 'rv', rv, new THREE.Vector3(-0.5, -0.4, 0.35));

    const la = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, seg, seg),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 })
    );
    la.position.set(0.68, 0.72, 0.05);
    tagBioPart(root, runtime, 'la', la, new THREE.Vector3(0.6, 0.45, 0.3));

    const lv = new THREE.Mesh(
      new THREE.ConeGeometry(0.84, 1.78, seg),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.48 })
    );
    lv.rotation.z = Math.PI - 0.18;
    lv.position.set(0.45, -0.52, 0.05);
    tagBioPart(root, runtime, 'lv', lv, new THREE.Vector3(0.55, -0.45, 0.3));

    const aorta = makeTube(
      [
        [0.2, 0.45, 0],
        [0.25, 1.35, 0],
        [-0.2, 1.78, -0.05],
        [-0.55, 1.35, -0.25],
        [-0.45, 0.0, -0.45],
      ],
      0.24,
      0xef4444,
      0.35
    );
    tagBioPart(root, runtime, 'aorta', aorta, new THREE.Vector3(0, 0.75, 0));

    runtime.anim = { ra, rv, la, lv };
  }

  // =========================================================================
  // 8. EUKARYOTIC ANIMAL CELL (3D Cutaway Organelles)
  // =========================================================================
  else if (modelId === 'animal_cell') {
    const mem = new THREE.Mesh(
      new THREE.SphereGeometry(2.15, seg, seg, 0, Math.PI * 1.45),
      new THREE.MeshPhysicalMaterial({
        color: 0x22c55e,
        roughness: 0.25,
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
      })
    );
    tagBioPart(root, runtime, 'membrane', mem);

    const nucGrp = new THREE.Group();
    const nucShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.74, seg, seg),
      new THREE.MeshPhysicalMaterial({ color: 0x4f46e5, roughness: 0.3, transparent: true, opacity: 0.65 })
    );
    const nucleolus = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xa5b4fc, roughness: 0.4 })
    );
    nucGrp.add(nucShell, nucleolus);
    tagBioPart(root, runtime, 'nucleus', nucGrp, new THREE.Vector3(0, 0.5, 0));

    const er = makeTube(
      [
        [-0.78, 0.2, 0.2],
        [-1.18, 0.45, 0.35],
        [-1.25, -0.05, 0.5],
        [-0.95, -0.42, 0.3],
      ],
      0.13,
      0x06b6d4,
      0.4
    );
    tagBioPart(root, runtime, 'er', er, new THREE.Vector3(-0.6, 0.2, 0.4));

    const mitoGrp = new THREE.Group();
    mitoGrp.position.set(1.15, 0.45, 0.45);
    mitoGrp.rotation.z = -0.45;
    const mitoBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.24, 0.55, 10, seg),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.38 })
    );
    mitoGrp.add(mitoBody);
    tagBioPart(root, runtime, 'mitochondrion', mitoGrp, new THREE.Vector3(0.6, 0.3, 0.4));

    const golgiGrp = new THREE.Group();
    golgiGrp.position.set(0.85, -0.75, 0.55);
    [-0.14, 0, 0.14].forEach((gy, i) => {
      const sac = new THREE.Mesh(
        new THREE.TorusGeometry(0.32 - i * 0.04, 0.055, 10, 20, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 })
      );
      sac.position.y = gy;
      golgiGrp.add(sac);
    });
    tagBioPart(root, runtime, 'golgi', golgiGrp, new THREE.Vector3(0.5, -0.5, 0.45));

    const lyso = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 })
    );
    lyso.position.set(-0.95, -0.82, 0.45);
    tagBioPart(root, runtime, 'lysosome', lyso, new THREE.Vector3(-0.5, -0.5, 0.4));

    runtime.anim = { spinGroup: mitoGrp };
  }

  // =========================================================================
  // 9. PLANT PARENCHYMA CELL (Hexagonal Wall, Central Vacuole, Chloroplasts)
  // =========================================================================
  else if (modelId === 'plant_cell') {
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.1, 2.2, 6, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
    );
    tagBioPart(root, runtime, 'cell_wall', wall);

    const vacuole = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, seg, seg),
      new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.15, transparent: true, opacity: 0.58, clearcoat: 0.5 })
    );
    vacuole.scale.set(1.15, 0.82, 0.9);
    tagBioPart(root, runtime, 'vacuole', vacuole, new THREE.Vector3(0, 0.65, 0));

    [
      [-1.25, 0.45, 0.45],
      [1.2, 0.5, -0.4],
      [-1.1, -0.45, -0.5],
    ].forEach(([cx, cy, cz]) => {
      const chloro = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.2, 0.42, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.35 })
      );
      chloro.position.set(cx, cy, cz);
      chloro.rotation.z = 0.6;
      tagBioPart(root, runtime, 'chloroplast', chloro, new THREE.Vector3(cx * 0.4, cy * 0.3, cz * 0.4));
    });

    const pNuc = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, seg, seg),
      new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.35 })
    );
    pNuc.position.set(1.15, -0.45, 0.48);
    tagBioPart(root, runtime, 'p_nucleus', pNuc, new THREE.Vector3(0.55, -0.35, 0.45));

    const pMito = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.16, 0.36, 8, 14),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.38 })
    );
    pMito.position.set(-0.95, -0.55, 0.65);
    tagBioPart(root, runtime, 'p_mito', pMito, new THREE.Vector3(-0.45, -0.35, 0.45));
  }

  // =========================================================================
  // 10. KIDNEY NEPHRON (Bowman's Capsule, PCT, Loop of Henle, DCT & Duct)
  // =========================================================================
  else if (modelId === 'nephron') {
    const bowmanGrp = new THREE.Group();
    bowmanGrp.position.set(-1.65, 1.1, 0);
    const cup = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, seg, seg, 0, Math.PI * 1.45),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45, side: THREE.DoubleSide })
    );
    const glom = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.24, 0.06, 36, 8, 2, 3),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 })
    );
    bowmanGrp.add(cup, glom);
    tagBioPart(root, runtime, 'bowman', bowmanGrp, new THREE.Vector3(-0.65, 0.45, 0.25));

    const pct = makeTube(
      [
        [-1.12, 1.1, 0],
        [-0.75, 1.45, 0.25],
        [-0.45, 0.95, -0.15],
        [-0.15, 1.32, 0.2],
        [0.05, 0.85, 0],
      ],
      0.13,
      0xf59e0b,
      0.42
    );
    tagBioPart(root, runtime, 'pct', pct, new THREE.Vector3(-0.2, 0.55, 0.3));

    const henle = makeTube(
      [
        [0.05, 0.85, 0],
        [0.08, -0.5, 0],
        [0.12, -1.65, 0.05],
        [0.38, -1.9, 0.05],
        [0.65, -1.65, 0],
        [0.68, 0.85, 0],
      ],
      0.11,
      0xfbbf24,
      0.45
    );
    tagBioPart(root, runtime, 'henle', henle, new THREE.Vector3(0, -0.65, 0.3));

    const dctGrp = new THREE.Group();
    const dct = makeTube(
      [
        [0.68, 0.85, 0],
        [1.0, 1.25, 0.2],
        [1.3, 0.9, -0.1],
        [1.55, 1.05, 0],
      ],
      0.13,
      0xf59e0b,
      0.42
    );
    const duct = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.21, 3.3, seg),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35 })
    );
    duct.position.set(1.62, -0.15, 0);
    dctGrp.add(dct, duct);
    tagBioPart(root, runtime, 'dct', dctGrp, new THREE.Vector3(0.65, 0, 0.25));

    // Filtrate drop flowing down Loop of Henle & Collecting Duct
    const drop = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: 0.55 })
    );
    drop.position.set(1.62, 1.1, 0);
    root.add(drop);
    runtime.anim = { filtrateDrop: drop };
  }

  // =========================================================================
  // 11. DICOT LEAF CROSS-SECTION (3D Tissue Block)
  // =========================================================================
  else if (modelId === 'leaf_flower') {
    const upperEpi = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.26, 2.2),
      new THREE.MeshPhysicalMaterial({ color: 0x86efac, roughness: 0.2, clearcoat: 0.5, transparent: true, opacity: 0.78 })
    );
    upperEpi.position.y = 1.25;
    tagBioPart(root, runtime, 'cuticle', upperEpi, new THREE.Vector3(0, 0.75, 0));

    const palGrp = new THREE.Group();
    const palMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.45 });
    for (let x = -1.65; x <= 1.65; x += 0.66) {
      for (let z = -0.65; z <= 0.65; z += 0.65) {
        const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.92, 14), palMat);
        cell.position.set(x, 0.62, z);
        palGrp.add(cell);
      }
    }
    tagBioPart(root, runtime, 'palisade', palGrp, new THREE.Vector3(0, 0.35, 0));

    const veinGrp = new THREE.Group();
    veinGrp.position.set(0.85, -0.25, 0);
    const sheath = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 2.35, seg),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, transparent: true, opacity: 0.55 })
    );
    sheath.rotation.x = Math.PI / 2;
    const xylem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 2.45, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
    );
    xylem.rotation.x = Math.PI / 2;
    xylem.position.y = 0.16;
    const phloem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 2.45, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 })
    );
    phloem.rotation.x = Math.PI / 2;
    phloem.position.y = -0.16;
    veinGrp.add(sheath, xylem, phloem);
    tagBioPart(root, runtime, 'vascular', veinGrp, new THREE.Vector3(0.65, 0, 0.45));

    const spongyGrp = new THREE.Group();
    const spMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });
    [
      [-1.4, -0.35, 0.4],
      [-0.75, -0.55, -0.4],
      [-0.1, -0.25, 0.5],
      [-1.1, -0.75, -0.2],
      [-0.3, -0.7, 0.25],
    ].forEach(([sx, sy, sz]) => {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), spMat);
      sp.position.set(sx, sy, sz);
      spongyGrp.add(sp);
    });
    tagBioPart(root, runtime, 'spongy', spongyGrp, new THREE.Vector3(-0.65, -0.2, 0.4));

    const lowerGrp = new THREE.Group();
    lowerGrp.position.y = -1.25;
    const lowL = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.24, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.5 })
    );
    lowL.position.x = -1.25;
    const lowR = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 0.24, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.5 })
    );
    lowR.position.x = 1.25;
    const guard1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.08, 10, 20, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.35 })
    );
    guard1.rotation.x = Math.PI / 2;
    guard1.position.set(0, 0, 0.08);
    const guard2 = guard1.clone();
    guard2.rotation.z = Math.PI;
    guard2.position.set(0, 0, -0.08);
    lowerGrp.add(lowL, lowR, guard1, guard2);
    tagBioPart(root, runtime, 'stomata', lowerGrp, new THREE.Vector3(0, -0.75, 0));
  }

  return runtime;
}

/** Animate physiological processes at zero allocation cost per frame */
export function updateBiology3DAnimation(
  modelId: string,
  runtime: Bio3DRuntime | null,
  elapsed: number,
  explodeAmount: number
) {
  if (!runtime) return;
  const a = runtime.anim;

  if (modelId === 'respiratory_system' && a.lungR && a.lungL && a.diaphragm) {
    const breath = 0.5 + 0.5 * Math.sin(elapsed * 1.9); // 0..1 inhale-exhale cycle
    const sx = 1 + breath * 0.14;
    a.lungR.scale.set(0.88 * sx, 1.48 * (1 + breath * 0.06), 0.85 * sx);
    a.lungL.scale.set(0.84 * sx, 1.44 * (1 + breath * 0.06), 0.84 * sx);
    const diagBase = runtime.baseOffsets.get(a.diaphragm);
    if (diagBase) {
      a.diaphragm.position.y = diagBase.y - breath * 0.28 - explodeAmount * 0.75;
    }
  } else if (modelId === 'muscular_anatomy' && a.forearmPivot) {
    const flex = 0.5 + 0.5 * Math.sin(elapsed * 1.6); // 0=extended, 1=flexed
    a.forearmPivot.rotation.z = flex * 1.15;
    if (a.bicepsMesh && a.tricepsMesh) {
      a.bicepsMesh.scale.set(0.85 + flex * 0.35, 2.05 - flex * 0.32, 0.9 + flex * 0.3);
      a.tricepsMesh.scale.set(0.8 + (1 - flex) * 0.25, 2.15 - (1 - flex) * 0.22, 0.85);
    }
    if (a.zLeft && a.zRight && a.actinLeftGrp && a.actinRightGrp) {
      const slide = flex * 0.26;
      a.zLeft.position.x = -1.15 + slide;
      a.zRight.position.x = 1.15 - slide;
      a.actinLeftGrp.position.x = slide;
      a.actinRightGrp.position.x = -slide;
    }
  } else if (modelId === 'human_heart' && a.ra && a.rv && a.la && a.lv) {
    const phase = (elapsed * 1.25) % 1;
    // Lub-dub physiological double beat
    const atrialPulse = phase < 0.25 ? Math.sin((phase / 0.25) * Math.PI) : 0;
    const ventPulse = phase >= 0.2 && phase < 0.55 ? Math.sin(((phase - 0.2) / 0.35) * Math.PI) : 0;
    const aScale = 1 + atrialPulse * 0.1;
    const vScale = 1 - ventPulse * 0.09;
    a.ra.scale.setScalar(aScale);
    a.la.scale.setScalar(aScale);
    a.rv.scale.setScalar(vScale);
    a.lv.scale.setScalar(vScale);
  } else if (modelId === 'nervous_neuron' && a.impulseSphere) {
    // Saltatory conduction leaping across Nodes of Ranvier (-0.7 -> 2.55)
    const t = (elapsed * 0.65) % 1;
    a.impulseSphere.position.x = -0.7 + t * 3.25;
  } else if (modelId === 'nephron' && a.filtrateDrop) {
    const t = (elapsed * 0.45) % 1;
    a.filtrateDrop.position.y = 1.4 - t * 3.0;
  } else if (modelId === 'animal_cell' && a.spinGroup) {
    a.spinGroup.rotation.y = elapsed * 0.5;
  }
}
