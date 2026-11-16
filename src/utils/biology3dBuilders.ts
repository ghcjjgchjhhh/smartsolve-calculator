import * as THREE from 'three';

export interface Bio3DRuntime {
  partGroups: Map<string, THREE.Object3D[]>;
  baseOffsets: Map<THREE.Object3D, THREE.Vector3>;
  textures: THREE.Texture[];
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

/** Update highlight emissive state (selected + hovered) and explode offset cleanly */
export function applyBio3DState(
  runtime: Bio3DRuntime,
  selectedPartId: string | null,
  explodeAmount: number,
  hoveredPartId: string | null = null
) {
  runtime.partGroups.forEach((objs, partId) => {
    const isSel = partId === selectedPartId;
    const isHover = partId === hoveredPartId && !isSel;
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
            child.userData.baseEmissiveIntensity = child.material.emissiveIntensity ?? 0.08;
          }
          if (isSel) {
            child.material.emissive.setHex(0x22c55e);
            child.material.emissiveIntensity = 0.42;
          } else if (isHover) {
            child.material.emissive.setHex(0x38bdf8);
            child.material.emissiveIntensity = 0.28;
          } else {
            child.material.emissive.setHex(child.userData.baseEmissive);
            child.material.emissiveIntensity = child.userData.baseEmissiveIntensity;
          }
        }
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Procedural Anatomical Canvas Textures (Color + Bump/Roughness Detail)
// ---------------------------------------------------------------------------
function makeProceduralTexture(
  runtime: Bio3DRuntime,
  size: number,
  drawFn: (ctx: CanvasRenderingContext2D, s: number) => void,
  isColor = true,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  drawFn(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  runtime.textures.push(tex);
  return tex;
}

function createBoneTextures(runtime: Bio3DRuntime) {
  const colorMap = makeProceduralTexture(runtime, 256, (ctx, s) => {
    ctx.fillStyle = '#efe7d6';
    ctx.fillRect(0, 0, s, s);
    // Subtle vertical osteon/lamellae bone grain
    for (let i = 0; i < 160; i++) {
      const x = (i * 29) % s;
      const w = 1 + (i % 3);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(214, 198, 170, 0.35)' : 'rgba(255, 252, 245, 0.35)';
      ctx.fillRect(x, 0, w, s);
    }
    // Mineral speckles
    for (let i = 0; i < 400; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const y = (Math.sin(i * 78.233) * 19341.123) % 1;
      ctx.fillStyle = 'rgba(180, 160, 130, 0.16)';
      ctx.fillRect(Math.abs(x) * s, Math.abs(y) * s, 2, 3);
    }
  });
  const bumpMap = makeProceduralTexture(runtime, 256, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(200,200,200,0.3)' : 'rgba(60,60,60,0.28)';
      ctx.fillRect((i * 19) % s, 0, 2, s);
    }
  }, false);
  return { colorMap, bumpMap };
}

function createSpongyBoneTexture(runtime: Bio3DRuntime) {
  const colorMap = makeProceduralTexture(runtime, 256, (ctx, s) => {
    ctx.fillStyle = '#991b2e';
    ctx.fillRect(0, 0, s, s);
    // Trabecular ivory pores
    for (let i = 0; i < 260; i++) {
      const px = Math.abs(Math.sin(i * 19.3) * 9123) % s;
      const py = Math.abs(Math.cos(i * 41.7) * 7411) % s;
      const r = 3 + (i % 6);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? '#7f1d1d' : '#be123c';
      ctx.fill();
      ctx.strokeStyle = '#f3e5d8';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  });
  const bumpMap = makeProceduralTexture(runtime, 256, (ctx, s) => {
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      const px = Math.abs(Math.sin(i * 19.3) * 9123) % s;
      const py = Math.abs(Math.cos(i * 41.7) * 7411) % s;
      const r = 3 + (i % 6);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = '#262626';
      ctx.fill();
    }
  }, false);
  return { colorMap, bumpMap };
}

function createMuscleStriationTextures(runtime: Bio3DRuntime, baseHex = '#9e1c24', fiberHex = '#d94848') {
  const colorMap = makeProceduralTexture(runtime, 256, (ctx, s) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 110; i++) {
      const x = (i / 110) * s;
      ctx.strokeStyle = i % 3 === 0 ? fiberHex : 'rgba(90, 12, 18, 0.55)';
      ctx.lineWidth = i % 4 === 0 ? 2.4 : 1.2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 4, s * 0.33, x - 4, s * 0.66, x, s);
      ctx.stroke();
    }
    // Delicate silver-white perimysium connective threads
    for (let i = 0; i < 16; i++) {
      const x = (i / 16) * s + 6;
      ctx.strokeStyle = 'rgba(255, 225, 225, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 3, s);
      ctx.stroke();
    }
  }, true, 2, 1);

  const bumpMap = makeProceduralTexture(runtime, 256, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      const x = (i / 90) * s;
      ctx.strokeStyle = i % 2 === 0 ? '#d8d8d8' : '#3a3a3a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, s);
      ctx.stroke();
    }
  }, false, 2, 1);

  return { colorMap, bumpMap };
}

function createLungTissueTexture(runtime: Bio3DRuntime) {
  const colorMap = makeProceduralTexture(runtime, 256, (ctx, s) => {
    const grad = ctx.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0, '#f09ba8');
    grad.addColorStop(0.5, '#e27c8d');
    grad.addColorStop(1, '#c95c71');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // Polygonal secondary pulmonary lobule marbling
    ctx.strokeStyle = 'rgba(130, 38, 60, 0.25)';
    ctx.lineWidth = 1.4;
    const step = 32;
    for (let y = 0; y <= s; y += step) {
      for (let x = 0; x <= s; x += step) {
        const jx = x + Math.sin(y * 0.13 + x) * 6;
        const jy = y + Math.cos(x * 0.17 + y) * 6;
        ctx.strokeRect(jx, jy, step * 0.9, step * 0.9);
      }
    }
    // Fine pleural capillary tracery
    for (let i = 0; i < 45; i++) {
      const sx = (i * 53) % s;
      const sy = (i * 97) % s;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(200, 30, 50, 0.22)' : 'rgba(56, 110, 190, 0.18)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + 14, sy - 8, sx + 28, sy + 10);
      ctx.stroke();
    }
  });
  const bumpMap = makeProceduralTexture(runtime, 256, (ctx, s) => {
    ctx.fillStyle = '#909090';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 2;
    for (let y = 0; y < s; y += 30) {
      for (let x = 0; x < s; x += 30) {
        ctx.strokeRect(x + Math.sin(y) * 4, y + Math.cos(x) * 4, 26, 26);
      }
    }
  }, false);
  return { colorMap, bumpMap };
}

function createBrainCortexTexture(runtime: Bio3DRuntime) {
  const colorMap = makeProceduralTexture(runtime, 256, (ctx, s) => {
    ctx.fillStyle = '#eab2b6';
    ctx.fillRect(0, 0, s, s);
    // Sulci grooves (darker rose curves) + gyri highlights
    for (let i = 0; i < 65; i++) {
      const x = (i * 37) % s;
      const y = (i * 71) % s;
      ctx.strokeStyle = 'rgba(138, 52, 68, 0.58)';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 22, y - 16, x + 36, y + 22, x + 54, y - 4);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 224, 226, 0.42)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.bezierCurveTo(x + 22, y - 20, x + 36, y + 18, x + 54, y - 8);
      ctx.stroke();
    }
  });
  const bumpMap = makeProceduralTexture(runtime, 256, (ctx, s) => {
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 65; i++) {
      const x = (i * 37) % s;
      const y = (i * 71) % s;
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 22, y - 16, x + 36, y + 22, x + 54, y - 4);
      ctx.stroke();
    }
  }, false);
  return { colorMap, bumpMap };
}

function createPetalTexture(runtime: Bio3DRuntime) {
  return makeProceduralTexture(runtime, 256, (ctx, s) => {
    const grad = ctx.createRadialGradient(s * 0.5, s, 10, s * 0.5, s * 0.3, s);
    grad.addColorStop(0, '#fde047');
    grad.addColorStop(0.28, '#fb7185');
    grad.addColorStop(0.75, '#e11d48');
    grad.addColorStop(1, '#9f1239');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // Fine botanical petal venation
    ctx.strokeStyle = 'rgba(255, 220, 230, 0.25)';
    ctx.lineWidth = 1.4;
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(s * 0.5, s);
      ctx.quadraticCurveTo(s * 0.5 + i * 16, s * 0.5, s * 0.5 + i * 24, 0);
      ctx.stroke();
    }
  });
}

// ---------------------------------------------------------------------------
// Organic Geometry Builders (Tubes, Variable-Radius Tubes, Vertex Displacement)
// ---------------------------------------------------------------------------
function makeTube(
  points: [number, number, number][],
  radius: number,
  color: number,
  roughness = 0.45,
  metalness = 0.06,
  tubularSegments = 36,
  radialSegments = 14,
  opacity = 1
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    clearcoat: opacity < 1 ? 0.35 : 0.25,
    transparent: opacity < 1,
    opacity,
  });
  return new THREE.Mesh(geo, mat);
}

/** Variable-radius smooth anatomical tube (ideal for haustrated colon, tapered horns, stomach) */
function makeOrganicTube(
  points: [number, number, number][],
  radiusFn: (t: number, angle: number) => number,
  tubularSegs: number,
  radialSegs: number,
  material: THREE.Material
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const frames = curve.computeFrenetFrames(tubularSegs, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    const P = curve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    for (let j = 0; j <= radialSegs; j++) {
      const v = j / radialSegs;
      const theta = v * Math.PI * 2;
      const r = radiusFn(t, theta);
      const sin = Math.sin(theta);
      const cos = -Math.cos(theta);
      const vx = P.x + r * (cos * N.x + sin * B.x);
      const vy = P.y + r * (cos * N.y + sin * B.y);
      const vz = P.z + r * (cos * N.z + sin * B.z);
      positions.push(vx, vy, vz);
      uvs.push(t, v);
    }
  }

  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * (radialSegs + 1) + j;
      const b = (i + 1) * (radialSegs + 1) + j;
      const c = (i + 1) * (radialSegs + 1) + (j + 1);
      const d = i * (radialSegs + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

/** Displace sphere vertices organically using deterministic multi-frequency sine ripples */
function makeSculptedOrganGeometry(
  radius: number,
  wSeg: number,
  hSeg: number,
  scaleX: number,
  scaleY: number,
  scaleZ: number,
  freq = 5.5,
  amp = 0.06,
  phiLength = Math.PI * 2
): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(radius, wSeg, hSeg, 0, phiLength);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = 1 + amp * Math.sin(x * freq + y * (freq * 0.7)) * Math.cos(z * freq - y * 2.1);
    pos.setXYZ(i, x * scaleX * n, y * scaleY * n, z * scaleZ * n);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Build museum-grade procedural 3D anatomical specimens for all 11 Biology Lab models */
export function buildBiology3DModel(
  modelId: string,
  root: THREE.Group,
  isSoftwareGl: boolean
): Bio3DRuntime {
  const runtime: Bio3DRuntime = {
    partGroups: new Map(),
    baseOffsets: new Map(),
    textures: [],
    anim: {},
  };

  const seg = isSoftwareGl ? 22 : 36;

  // =========================================================================
  // 1. SKELETAL BONE (Sculpted Femur with Trochanter, Condyles, Cutaway Marrow)
  // =========================================================================
  if (modelId === 'skeletal_bone') {
    const boneTex = createBoneTextures(runtime);
    const spongyTex = createSpongyBoneTexture(runtime);

    const ivoryMat = new THREE.MeshPhysicalMaterial({
      map: boneTex.colorMap,
      bumpMap: boneTex.bumpMap,
      bumpScale: 0.025,
      roughness: 0.44,
      metalness: 0.04,
      clearcoat: 0.18,
    });

    // 1. Articular Hyaline Cartilage (Femoral Head + Bicondylar Distal Knee Caps)
    const cartMat = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      roughness: 0.14,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      sheen: 0.35,
      sheenColor: new THREE.Color(0x93c5fd),
    });

    const femoralHeadCart = new THREE.Mesh(new THREE.SphereGeometry(0.58, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.68), cartMat);
    femoralHeadCart.position.set(-1.12, 2.18, 0);
    femoralHeadCart.rotation.z = 0.78;
    tagBioPart(root, runtime, 'cartilage', femoralHeadCart, new THREE.Vector3(-0.45, 0.75, 0));

    // Distal Medial & Lateral Knee Condyles wrapped in glassy articular cartilage
    const condyleGrp = new THREE.Group();
    condyleGrp.position.set(0.05, -2.02, 0);
    const condL = new THREE.Mesh(makeSculptedOrganGeometry(0.48, seg, seg, 0.92, 0.86, 1.15, 3, 0.03), cartMat);
    condL.position.set(-0.36, 0, 0);
    const condR = new THREE.Mesh(makeSculptedOrganGeometry(0.46, seg, seg, 0.92, 0.86, 1.15, 3, 0.03), cartMat);
    condR.position.set(0.36, 0, 0);
    condyleGrp.add(condL, condR);
    tagBioPart(root, runtime, 'cartilage', condyleGrp, new THREE.Vector3(0, -0.75, 0));

    // 2. Proximal Epiphysis Neck + Greater Trochanter (Spongy Trabecular Cutaway)
    const spongyMat = new THREE.MeshStandardMaterial({
      map: spongyTex.colorMap,
      bumpMap: spongyTex.bumpMap,
      bumpScale: 0.06,
      roughness: 0.78,
      metalness: 0.03,
    });
    const spongyGrp = new THREE.Group();
    const proxHead = new THREE.Mesh(makeSculptedOrganGeometry(0.53, seg, seg, 1.0, 0.98, 0.95, 6, 0.03), spongyMat);
    proxHead.position.set(-1.05, 2.08, 0);
    const trochanter = new THREE.Mesh(makeSculptedOrganGeometry(0.56, seg, seg, 1.05, 1.25, 0.88, 5, 0.05), spongyMat);
    trochanter.position.set(0.28, 1.78, -0.06);
    const neck = makeOrganicTube(
      [[-0.95, 2.0, 0], [-0.45, 1.68, 0], [0, 1.4, 0]],
      (t) => 0.34 + 0.14 * t,
      18,
      seg,
      spongyMat
    );
    spongyGrp.add(proxHead, trochanter, neck);
    tagBioPart(root, runtime, 'spongy_bone', spongyGrp, new THREE.Vector3(-0.5, 0.5, 0.4));

    // 3. Epiphyseal Growth Plate (curved cartilage seam between metaphysis and epiphysis)
    const plate = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.065, 12, seg),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.25, clearcoat: 0.6 })
    );
    plate.rotation.x = Math.PI / 2;
    plate.scale.set(1.22, 0.95, 1);
    plate.position.set(0.02, 1.26, 0);
    tagBioPart(root, runtime, 'epiphyseal_plate', plate, new THREE.Vector3(-0.6, 0.2, 0.6));

    // 4. Sculpted Curved Femur Diaphysis (Cortical Compact Bone Cutaway via Lathe + curve)
    const lathePts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const y = -1.85 + t * 3.15;
      // Realistic hour-glass flare at proximal & distal ends of femur shaft
      const flare = 0.42 + 0.32 * Math.pow(Math.abs(t - 0.48) * 2.05, 2.2);
      lathePts.push(new THREE.Vector2(flare, y));
    }
    const shaftOuterGeo = new THREE.LatheGeometry(lathePts, seg, Math.PI * 0.28, Math.PI * 1.48);
    const shaftOuter = new THREE.Mesh(shaftOuterGeo, ivoryMat);
    shaftOuter.material.side = THREE.DoubleSide;
    tagBioPart(root, runtime, 'compact_bone', shaftOuter, new THREE.Vector3(-0.75, 0, -0.45));

    const innerPts = lathePts.map((p) => new THREE.Vector2(Math.max(0.24, p.x - 0.15), p.y));
    const shaftInner = new THREE.Mesh(
      new THREE.LatheGeometry(innerPts, seg, Math.PI * 0.28, Math.PI * 1.48),
      new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.65, side: THREE.DoubleSide })
    );
    tagBioPart(root, runtime, 'compact_bone', shaftInner, new THREE.Vector3(-0.75, 0, -0.45));

    // 5. Medullary Cavity Yellow Bone Marrow + Nutrient Artery & Vein
    const marrowGrp = new THREE.Group();
    const marrowCore = makeOrganicTube(
      [[0.02, -1.65, 0], [-0.04, -0.2, 0.03], [0.02, 1.15, 0]],
      (t) => 0.24 + 0.06 * Math.sin(t * Math.PI * 2),
      20,
      seg,
      new THREE.MeshPhysicalMaterial({ color: 0xfacc15, roughness: 0.36, clearcoat: 0.35 })
    );
    const nutrientArtery = makeTube(
      [[0.46, 0.15, 0.32], [0.16, -0.05, 0.16], [0.03, -0.95, 0.1], [0.02, 0.95, 0.08]],
      0.038,
      0xdc2626,
      0.28
    );
    const nutrientVein = makeTube(
      [[0.48, 0.22, 0.28], [0.18, 0.02, 0.12], [-0.03, -0.85, 0.08], [-0.02, 0.9, 0.06]],
      0.032,
      0x2563eb,
      0.3
    );
    marrowGrp.add(marrowCore, nutrientArtery, nutrientVein);
    tagBioPart(root, runtime, 'bone_marrow', marrowGrp, new THREE.Vector3(0.75, 0, 0.75));

    // 6. Vascularized Periosteum Sheath Sleeve (partially peeled back on lower shaft)
    const periGeo = new THREE.LatheGeometry(
      lathePts.slice(3, 12).map((p) => new THREE.Vector2(p.x + 0.035, p.y)),
      seg,
      Math.PI * 0.34,
      Math.PI * 1.38
    );
    const periosteum = new THREE.Mesh(
      periGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0xea8c55,
        roughness: 0.55,
        clearcoat: 0.25,
        side: THREE.DoubleSide,
      })
    );
    tagBioPart(root, runtime, 'periosteum', periosteum, new THREE.Vector3(0.72, -0.2, -0.45));
  }

  // =========================================================================
  // 2. MUSCULAR ANATOMY (Sculpted Fusiform Biceps/Triceps, Joint Bones, Sliding Sarcomere)
  // =========================================================================
  else if (modelId === 'muscular_anatomy') {
    const boneTex = createBoneTextures(runtime);
    const muscleTex = createMuscleStriationTextures(runtime);
    const deepMuscleTex = createMuscleStriationTextures(runtime, '#7f1d1d', '#b91c1c');

    const boneMat = new THREE.MeshStandardMaterial({
      map: boneTex.colorMap,
      bumpMap: boneTex.bumpMap,
      bumpScale: 0.02,
      roughness: 0.45,
    });
    const tendonMat = new THREE.MeshPhysicalMaterial({
      color: 0xf1f5f9,
      roughness: 0.26,
      clearcoat: 0.55,
      sheen: 0.65,
      sheenColor: new THREE.Color(0xffffff),
    });

    // 1. Articulated Humerus + Condyle + Forearm Pivot (Radius & Ulna)
    const humerus = makeOrganicTube(
      [[-1.4, 2.35, 0], [-1.38, 1.0, 0.03], [-1.36, -0.35, 0]],
      (t) => 0.16 + 0.14 * Math.pow(Math.abs(t - 0.5) * 2, 2.4),
      20,
      seg,
      boneMat
    );
    tagBioPart(root, runtime, 'tendon', humerus);

    const elbowJoint = new THREE.Mesh(
      makeSculptedOrganGeometry(0.28, seg, seg, 1.15, 0.9, 1.05, 4, 0.04),
      new THREE.MeshPhysicalMaterial({ color: 0xdbeafe, roughness: 0.16, clearcoat: 0.75 })
    );
    elbowJoint.position.set(-1.36, -0.46, 0);
    tagBioPart(root, runtime, 'tendon', elbowJoint);

    const forearmPivot = new THREE.Group();
    forearmPivot.position.set(-1.36, -0.46, 0);
    const radiusBone = makeOrganicTube(
      [[0, 0.05, 0.09], [1.1, 0.06, 0.1], [2.2, 0.08, 0.07]],
      (t) => 0.09 + 0.06 * Math.pow(Math.abs(t - 0.5) * 2, 2),
      18,
      16,
      boneMat
    );
    const ulnaBone = makeOrganicTube(
      [[-0.14, -0.06, -0.09], [1.0, -0.09, -0.1], [2.18, -0.06, -0.07]],
      (t) => 0.13 * (1 - t * 0.45),
      18,
      16,
      boneMat
    );
    forearmPivot.add(radiusBone, ulnaBone);
    forearmPivot.userData.skipExplode = true;
    tagBioPart(root, runtime, 'tendon', forearmPivot);

    // 2. Sculpted Fusiform Biceps Brachii (belly + glistening proximal/distal tendons)
    const bicepsMat = new THREE.MeshPhysicalMaterial({
      map: muscleTex.colorMap,
      bumpMap: muscleTex.bumpMap,
      bumpScale: 0.035,
      roughness: 0.36,
      clearcoat: 0.48,
      clearcoatRoughness: 0.25,
    });
    const bicepsPts = Array.from({ length: 18 }, (_, i) => {
      const t = i / 17;
      const y = -0.95 + t * 1.9;
      const r = 0.09 + 0.36 * Math.pow(Math.sin(t * Math.PI), 0.75);
      return new THREE.Vector2(r, y);
    });
    const bicepsMesh = new THREE.Mesh(new THREE.LatheGeometry(bicepsPts, seg), bicepsMat);
    bicepsMesh.position.set(-0.98, 0.92, 0.04);
    bicepsMesh.scale.set(0.88, 1.0, 1.04);
    tagBioPart(root, runtime, 'biceps', bicepsMesh, new THREE.Vector3(0.45, 0.15, 0.65));

    // Distal Bicipital Tendon wrapping to Radius
    const bicepsTendon = makeOrganicTube(
      [[-0.98, 0.02, 0.04], [-0.96, -0.25, 0.07], [-0.72, -0.38, 0.09]],
      (t) => 0.1 - 0.04 * t,
      14,
      14,
      tendonMat
    );
    tagBioPart(root, runtime, 'tendon', bicepsTendon, new THREE.Vector3(0.35, -0.15, 0.45));

    // 3. Sculpted Posterior Triceps Brachii
    const tricepsMat = new THREE.MeshPhysicalMaterial({
      map: deepMuscleTex.colorMap,
      bumpMap: deepMuscleTex.bumpMap,
      bumpScale: 0.035,
      roughness: 0.42,
      clearcoat: 0.4,
    });
    const tricepsMesh = new THREE.Mesh(new THREE.LatheGeometry(bicepsPts, seg), tricepsMat);
    tricepsMesh.position.set(-1.74, 0.98, -0.02);
    tricepsMesh.scale.set(0.78, 1.08, 0.92);
    tagBioPart(root, runtime, 'triceps', tricepsMesh, new THREE.Vector3(-0.65, 0.15, -0.4));

    // 4. Magnified 3D Sarcomere & Myofibril Display
    const sarcoGrp = new THREE.Group();
    sarcoGrp.position.set(1.55, 1.25, 0);

    // Z-Disc protein zig-zag plates
    const zMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.25, clearcoat: 0.5, metalness: 0.15 });
    const zLeft = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.68, 1.1), zMat);
    zLeft.position.x = -1.18;
    const zRight = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.68, 1.1), zMat);
    zRight.position.x = 1.18;
    sarcoGrp.add(zLeft, zRight);

    const actinMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.32, metalness: 0.1 });
    const actinLeftGrp = new THREE.Group();
    const actinRightGrp = new THREE.Group();
    [-0.55, -0.18, 0.18, 0.55].forEach((yOff) => {
      [-0.25, 0.25].forEach((zOff) => {
        const aL = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.88, 10), actinMat);
        aL.rotation.z = Math.PI / 2;
        aL.position.set(-0.72, yOff, zOff);
        actinLeftGrp.add(aL);

        const aR = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.88, 10), actinMat);
        aR.rotation.z = Math.PI / 2;
        aR.position.set(0.72, yOff, zOff);
        actinRightGrp.add(aR);
      });
    });
    sarcoGrp.add(actinLeftGrp, actinRightGrp);
    tagBioPart(root, runtime, 'actin_myosin', sarcoGrp, new THREE.Vector3(0.65, 0.35, 0));

    // Thick Myosin filaments studded with protruding cross-bridge heads
    const myosinGrp = new THREE.Group();
    myosinGrp.position.set(1.55, 1.25, 0);
    const myosinMat = new THREE.MeshPhysicalMaterial({ color: 0xf43f5e, roughness: 0.32, clearcoat: 0.4 });
    [-0.36, 0, 0.36].forEach((yOff) => {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 1.26, 14), myosinMat);
      shaft.rotation.z = Math.PI / 2;
      shaft.position.set(0, yOff, 0);
      myosinGrp.add(shaft);
      for (let h = -0.5; h <= 0.5; h += 0.25) {
        if (Math.abs(h) < 0.05) continue; // bare H-zone center
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), myosinMat);
        head.position.set(h, yOff + (h > 0 ? 0.09 : -0.09), 0.05);
        myosinGrp.add(head);
      }
    });
    tagBioPart(root, runtime, 'sarcomere', myosinGrp, new THREE.Vector3(0.65, 0.35, 0.45));

    // 5. Cutaway Muscle Fascicle Cylinder showing telescoping myofibrils
    const fascicleGrp = new THREE.Group();
    fascicleGrp.position.set(1.55, -0.95, 0);
    const epimysium = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.58, 0.95, seg, 1, false),
      new THREE.MeshPhysicalMaterial({
        map: muscleTex.colorMap,
        bumpMap: muscleTex.bumpMap,
        bumpScale: 0.03,
        roughness: 0.4,
        clearcoat: 0.35,
      })
    );
    epimysium.rotation.z = Math.PI / 2;
    fascicleGrp.add(epimysium);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const fiber = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 1.38, 12),
        bicepsMat
      );
      fiber.rotation.z = Math.PI / 2;
      fiber.position.set(0.22, Math.sin(a) * 0.28, Math.cos(a) * 0.28);
      fascicleGrp.add(fiber);
    }
    tagBioPart(root, runtime, 'fascicle', fascicleGrp, new THREE.Vector3(0.5, -0.5, 0.4));

    runtime.anim = { forearmPivot, bicepsMesh, tricepsMesh, zLeft, zRight, actinLeftGrp, actinRightGrp };
  }

  // =========================================================================
  // 3. RESPIRATORY SYSTEM (Larynx, C-Ring Trachea, Wet Lobed Lungs w/ Cardiac Notch, Diaphragm, Alveoli)
  // =========================================================================
  else if (modelId === 'respiratory_system') {
    const lungTex = createLungTissueTexture(runtime);

    // 1. Larynx (Thyroid Cartilage Shield) + Trachea with 10 C-shaped cartilage rings
    const tracheaGrp = new THREE.Group();
    const cartMat = new THREE.MeshPhysicalMaterial({ color: 0xe2e8f0, roughness: 0.24, clearcoat: 0.5 });
    const larynx = new THREE.Mesh(
      makeSculptedOrganGeometry(0.36, seg, seg, 1.0, 1.15, 0.95, 3, 0.05),
      cartMat
    );
    larynx.position.set(0, 2.38, 0.04);
    tracheaGrp.add(larynx);

    const windpipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 1.85, seg),
      new THREE.MeshPhysicalMaterial({ color: 0xf48b99, roughness: 0.45, clearcoat: 0.3 })
    );
    windpipe.position.y = 1.45;
    tracheaGrp.add(windpipe);

    for (let i = 0; i < 9; i++) {
      const cRing = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.036, 10, seg, Math.PI * 1.55), cartMat);
      cRing.rotation.x = Math.PI / 2;
      cRing.rotation.z = -Math.PI * 0.27;
      cRing.position.y = 0.72 + i * 0.18;
      tracheaGrp.add(cRing);
    }
    tagBioPart(root, runtime, 'trachea', tracheaGrp, new THREE.Vector3(0, 0.85, 0));

    // 2. Recursive Bronchial Tree
    const bronchiGrp = new THREE.Group();
    const bMatColor = 0xf47285;
    const branches: [number, number, number][][] = [
      [[0, 0.58, 0], [-0.55, 0.32, 0.02], [-1.05, 0.08, 0.08]],
      [[0, 0.58, 0], [0.58, 0.28, 0.02], [1.1, 0.02, 0.08]],
      [[-0.7, 0.24, 0.04], [-1.15, 0.55, 0.14], [-1.42, 0.72, 0.1]],
      [[-0.85, 0.15, 0.06], [-1.32, -0.45, 0.16], [-1.45, -0.82, 0.12]],
      [[0.72, 0.22, 0.04], [1.22, 0.52, 0.12], [1.48, 0.65, 0.08]],
      [[0.88, 0.12, 0.06], [1.32, -0.48, 0.15], [1.46, -0.88, 0.1]],
    ];
    branches.forEach((pts, i) => {
      bronchiGrp.add(makeTube(pts, i < 2 ? 0.15 : 0.075, bMatColor, 0.4));
    });
    tagBioPart(root, runtime, 'bronchi', bronchiGrp, new THREE.Vector3(0, 0.35, 0.55));

    // 3. Sculpted Asymmetrical Wet Pleural Lungs (Right 3-lobe contour, Left 2-lobe w/ Cardiac Notch)
    const lungMat = new THREE.MeshPhysicalMaterial({
      map: lungTex.colorMap,
      bumpMap: lungTex.bumpMap,
      bumpScale: 0.025,
      roughness: 0.28,
      clearcoat: 0.75,
      clearcoatRoughness: 0.16,
      transparent: true,
      opacity: 0.78,
    });

    const rightLungGeo = new THREE.SphereGeometry(0.95, seg, seg);
    const rPos = rightLungGeo.attributes.position;
    for (let i = 0; i < rPos.count; i++) {
      const x = rPos.getX(i);
      const y = rPos.getY(i);
      const z = rPos.getZ(i);
      // Taper apex up, broaden base flat over diaphragm, indent mediastinal face
      const taper = y > 0 ? 1 - y * 0.32 : 1.06;
      const flatBot = y < -0.55 ? -0.55 + (y + 0.55) * 0.45 : y;
      const medIndent = x > 0.2 ? x * 0.75 : x;
      rPos.setXYZ(i, medIndent * 0.88 * taper, flatBot * 1.48, z * 0.88 * taper);
    }
    rightLungGeo.computeVertexNormals();
    const lungR = new THREE.Mesh(rightLungGeo, lungMat);
    lungR.position.set(-1.08, 0.04, 0);
    tagBioPart(root, runtime, 'lungs_pleura', lungR, new THREE.Vector3(-0.75, 0.1, 0));

    // Left lung sculpted with realistic medial cardiac notch
    const leftLungGeo = new THREE.SphereGeometry(0.92, seg, seg);
    const lPos = leftLungGeo.attributes.position;
    for (let i = 0; i < lPos.count; i++) {
      const x = lPos.getX(i);
      const y = lPos.getY(i);
      const z = lPos.getZ(i);
      const taper = y > 0 ? 1 - y * 0.32 : 1.05;
      const flatBot = y < -0.55 ? -0.55 + (y + 0.55) * 0.45 : y;
      // Carve cardiac notch on lower-medial side (x < 0, y < 0.1)
      let notch = 0;
      if (x < -0.1 && y < 0.2 && y > -0.75) {
        notch = 0.26 * Math.sin(((y + 0.75) / 0.95) * Math.PI);
      }
      lPos.setXYZ(i, (x * 0.84 + notch) * taper, flatBot * 1.44, z * 0.86 * taper);
    }
    leftLungGeo.computeVertexNormals();
    const lungL = new THREE.Mesh(leftLungGeo, lungMat.clone());
    lungL.position.set(1.08, 0.02, 0);
    tagBioPart(root, runtime, 'lungs_pleura', lungL, new THREE.Vector3(0.75, 0.1, 0));

    // 4. Muscular Diaphragm Dome (muscle perimeter + pale central tendon)
    const diaMuscleTex = createMuscleStriationTextures(runtime, '#8f1d28', '#c83e4b');
    const diaphragm = new THREE.Mesh(
      new THREE.SphereGeometry(1.75, seg, seg, 0, Math.PI * 2, 0, Math.PI * 0.42),
      new THREE.MeshPhysicalMaterial({
        map: diaMuscleTex.colorMap,
        bumpMap: diaMuscleTex.bumpMap,
        bumpScale: 0.03,
        roughness: 0.45,
        clearcoat: 0.35,
        side: THREE.DoubleSide,
      })
    );
    diaphragm.scale.set(1.18, 0.48, 0.68);
    diaphragm.position.set(0, -1.72, 0);
    tagBioPart(root, runtime, 'diaphragm', diaphragm, new THREE.Vector3(0, -0.75, 0));

    // 5. Enlarged Grape-like Alveolar Cluster + Capillary Network
    const alvGrp = new THREE.Group();
    alvGrp.position.set(2.45, -0.68, 0.55);
    const alvMat = new THREE.MeshPhysicalMaterial({
      color: 0xfecdd3,
      roughness: 0.24,
      clearcoat: 0.65,
      sheen: 0.4,
    });
    const sacOffsets = [
      [0, 0, 0], [0.3, 0.22, 0.1], [-0.28, 0.18, 0.14],
      [0.18, -0.26, 0.16], [-0.2, -0.22, -0.12], [0.04, 0.35, -0.14], [-0.08, -0.02, 0.3],
    ];
    sacOffsets.forEach(([ax, ay, az]) => {
      const sac = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), alvMat);
      sac.position.set(ax, ay, az);
      alvGrp.add(sac);
    });
    alvGrp.add(
      makeTube([[-0.48, 0.32, 0.2], [-0.08, 0.12, 0.36], [0.46, -0.28, 0.18]], 0.04, 0xef4444, 0.25),
      makeTube([[-0.44, -0.26, -0.16], [0.05, 0.26, -0.3], [0.48, 0.24, 0.05]], 0.04, 0x3b82f6, 0.25)
    );
    tagBioPart(root, runtime, 'alveoli', alvGrp, new THREE.Vector3(0.7, -0.2, 0.6));

    runtime.anim = { lungR, lungL, diaphragm };
  }

  // =========================================================================
  // 4. BRAIN & MYELINATED MOTOR NEURON (Gyri/Sulci Brain + Stellate Soma + Saltatory Impulse)
  // =========================================================================
  else if (modelId === 'nervous_neuron') {
    const brainTex = createBrainCortexTexture(runtime);

    // 1. Sculpted Cerebrum (Left/Right Gyri Hemispheres) + Striated Cerebellum + Medulla Stem
    const brainGrp = new THREE.Group();
    brainGrp.position.set(-2.0, 1.48, -0.35);
    const brainMat = new THREE.MeshPhysicalMaterial({
      map: brainTex.colorMap,
      bumpMap: brainTex.bumpMap,
      bumpScale: 0.085,
      roughness: 0.38,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
    });
    const leftHemi = new THREE.Mesh(makeSculptedOrganGeometry(0.72, seg, seg, 1.15, 0.88, 0.72, 9, 0.06), brainMat);
    leftHemi.position.set(0, 0, -0.32);
    const rightHemi = new THREE.Mesh(makeSculptedOrganGeometry(0.72, seg, seg, 1.15, 0.88, 0.72, 9, 0.06), brainMat);
    rightHemi.position.set(0, 0, 0.32);

    const cerebellumMat = new THREE.MeshStandardMaterial({
      map: brainTex.colorMap,
      bumpMap: brainTex.bumpMap,
      bumpScale: 0.05,
      color: 0xd48a94,
      roughness: 0.55,
    });
    const cerebellum = new THREE.Mesh(makeSculptedOrganGeometry(0.4, 20, 20, 0.95, 0.82, 1.15, 12, 0.045), cerebellumMat);
    cerebellum.position.set(-0.46, -0.52, 0);

    const stem = makeOrganicTube(
      [[-0.08, -0.28, 0], [-0.14, -0.65, 0], [-0.22, -1.05, 0]],
      (t) => 0.22 - t * 0.08,
      14,
      16,
      new THREE.MeshPhysicalMaterial({ color: 0xf5d0d4, roughness: 0.4, clearcoat: 0.35 })
    );
    brainGrp.add(leftHemi, rightHemi, cerebellum, stem);
    tagBioPart(root, runtime, 'brain_cns', brainGrp, new THREE.Vector3(-0.7, 0.6, -0.4));

    // 2. Stellate Cell Body (Soma) + Translucent Membrane + Prominent Nucleus
    const somaGrp = new THREE.Group();
    somaGrp.position.set(-1.28, -0.16, 0.25);
    const soma = new THREE.Mesh(
      makeSculptedOrganGeometry(0.58, seg, seg, 1.05, 0.95, 0.92, 5, 0.06),
      new THREE.MeshPhysicalMaterial({
        color: 0x6366f1,
        roughness: 0.22,
        clearcoat: 0.65,
        transparent: true,
        opacity: 0.78,
      })
    );
    const nNucleus = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 18, 18),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 })
    );
    somaGrp.add(soma, nNucleus);
    tagBioPart(root, runtime, 'soma', somaGrp, new THREE.Vector3(-0.5, 0.3, 0.4));

    // 3. Tapered Branching Dendrites (rooting thick at soma -> fine tips)
    const dendGrp = new THREE.Group();
    dendGrp.position.set(-1.28, -0.16, 0.25);
    const dendMat = new THREE.MeshPhysicalMaterial({ color: 0x818cf8, roughness: 0.35, clearcoat: 0.4 });
    [2.1, 2.65, 3.15, 3.7, 4.25].forEach((ang, idx) => {
      const dx = Math.cos(ang) * 1.18;
      const dy = Math.sin(ang) * 1.08;
      const dz = (idx % 2 === 0 ? 1 : -1) * 0.35;
      dendGrp.add(
        makeOrganicTube(
          [[0, 0, 0], [dx * 0.48, dy * 0.48, dz * 0.4], [dx, dy, dz]],
          (t) => 0.14 * Math.pow(1 - t * 0.78, 1.2),
          14,
          12,
          dendMat
        )
      );
    });
    tagBioPart(root, runtime, 'dendrites', dendGrp, new THREE.Vector3(-0.85, 0, 0.3));

    // 4. Tapered Axon Hillock + Axon Core Fiber
    const axon = makeOrganicTube(
      [[-0.78, -0.16, 0.25], [0.25, -0.18, 0.25], [1.45, -0.15, 0.25], [2.55, -0.15, 0.25]],
      (t) => 0.072 + (t < 0.12 ? (0.12 - t) * 1.1 : 0),
      28,
      14,
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.25, clearcoat: 0.5 })
    );
    tagBioPart(root, runtime, 'axon_myelin', axon);

    // 5. Creamy-Gold Lipid Schwann Myelin Sheaths (Nodes of Ranvier visible between them)
    const myelinMat = new THREE.MeshPhysicalMaterial({
      color: 0xfef08a,
      roughness: 0.3,
      clearcoat: 0.6,
      sheen: 0.3,
    });
    [-0.12, 0.66, 1.44, 2.2].forEach((mx) => {
      const sheath = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.34, 12, seg), myelinMat);
      sheath.rotation.z = Math.PI / 2;
      sheath.position.set(mx, -0.16, 0.25);
      tagBioPart(root, runtime, 'axon_myelin', sheath, new THREE.Vector3(0, 0.45, 0.35));
    });

    // 6. Axon Terminals & Cupped Synaptic Boutons
    const synGrp = new THREE.Group();
    synGrp.position.set(2.55, -0.15, 0.25);
    const synMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.3, clearcoat: 0.4 });
    [
      [0.65, 0.46, 0.22],
      [0.74, 0.0, -0.24],
      [0.62, -0.46, 0.16],
    ].forEach(([tx, ty, tz]) => {
      synGrp.add(
        makeOrganicTube([[0, 0, 0], [tx * 0.5, ty * 0.5, tz * 0.5], [tx, ty, tz]], (t) => 0.05 * (1 - t * 0.4), 12, 10, synMat)
      );
      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.135, 14, 14),
        new THREE.MeshPhysicalMaterial({
          color: 0x22c55e,
          emissive: 0x16a34a,
          emissiveIntensity: 0.3,
          roughness: 0.25,
          clearcoat: 0.7,
        })
      );
      knob.position.set(tx, ty, tz);
      synGrp.add(knob);
    });
    tagBioPart(root, runtime, 'synapse', synGrp, new THREE.Vector3(0.75, 0, 0.2));

    const impulseSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x4ade80,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.76,
      })
    );
    impulseSphere.position.set(-0.7, -0.16, 0.25);
    root.add(impulseSphere);
    runtime.anim = { impulseSphere };
  }

  // =========================================================================
  // 5. DIGESTIVE TRACT (J-Stomach, Bilobed Liver, Gallbladder, Haustrated Colon)
  // =========================================================================
  else if (modelId === 'digestive_system') {
    const serosaMat = (c: number) =>
      new THREE.MeshPhysicalMaterial({
        color: c,
        roughness: 0.34,
        clearcoat: 0.65,
        clearcoatRoughness: 0.2,
      });

    // 1. Oesophagus
    const oesophagus = makeOrganicTube(
      [[0.02, 2.55, 0], [0.06, 1.85, 0], [0.2, 1.38, 0.04]],
      () => 0.14,
      18,
      16,
      serosaMat(0xf48b99)
    );
    tagBioPart(root, runtime, 'oesophagus', oesophagus, new THREE.Vector3(0, 0.75, 0));

    // 2. Sculpted Variable-Radius J-Shaped Stomach (Fundus -> Body -> Pylorus)
    const stomach = makeOrganicTube(
      [
        [0.2, 1.38, 0.04],
        [0.72, 1.32, 0.14],
        [0.95, 0.85, 0.2],
        [0.65, 0.42, 0.16],
        [0.1, 0.48, 0.05],
      ],
      (t) => 0.15 + 0.32 * Math.sin(t * Math.PI * 0.92),
      28,
      20,
      serosaMat(0xe1495b)
    );
    tagBioPart(root, runtime, 'stomach', stomach, new THREE.Vector3(0.7, 0.35, 0.4));

    // 3. Bilobed Liver (Right & Left tapered lobes) + Emerald Gallbladder
    const liverGrp = new THREE.Group();
    const liverMat = new THREE.MeshPhysicalMaterial({ color: 0x7f1d1d, roughness: 0.32, clearcoat: 0.68 });
    const rightLobe = new THREE.Mesh(makeSculptedOrganGeometry(0.8, seg, seg, 1.15, 0.72, 0.65, 3, 0.04), liverMat);
    rightLobe.position.set(-0.78, 1.12, 0.16);
    rightLobe.rotation.z = 0.22;
    const leftLobe = new THREE.Mesh(makeSculptedOrganGeometry(0.54, seg, seg, 1.1, 0.56, 0.55, 3, 0.03), liverMat);
    leftLobe.position.set(-0.08, 1.24, 0.2);
    leftLobe.rotation.z = -0.25;
    const gallbladder = new THREE.Mesh(
      makeSculptedOrganGeometry(0.16, 16, 16, 0.85, 1.38, 0.85, 3, 0.02),
      serosaMat(0x16a34a)
    );
    gallbladder.position.set(-0.52, 0.68, 0.34);
    gallbladder.rotation.z = 0.3;
    liverGrp.add(rightLobe, leftLobe, gallbladder);
    tagBioPart(root, runtime, 'liver_gallbladder', liverGrp, new THREE.Vector3(-0.75, 0.4, 0.45));

    // 4. Lobulated Pancreas
    const pancreas = new THREE.Mesh(
      makeSculptedOrganGeometry(0.45, 20, 20, 1.55, 0.42, 0.42, 10, 0.08),
      serosaMat(0xfacc15)
    );
    pancreas.rotation.z = 0.16;
    pancreas.position.set(0.28, 0.36, -0.22);
    tagBioPart(root, runtime, 'pancreas', pancreas, new THREE.Vector3(0.45, 0.1, -0.65));

    // 5. Tightly Coiled Small Intestine (Ileum & Jejunum loops)
    const smallPts: [number, number, number][] = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const x = Math.sin(t * Math.PI * 6.5) * 0.64;
      const y = 0.04 - t * 1.18;
      const z = Math.cos(t * Math.PI * 5.2) * 0.28 + 0.08;
      smallPts.push([x, y, z]);
    }
    const smallIntestine = makeOrganicTube(smallPts, () => 0.135, 56, 14, serosaMat(0xfda4af));
    tagBioPart(root, runtime, 'small_intestine', smallIntestine, new THREE.Vector3(0, 0, 0.85));

    // 6. Sacculated Haustrated Colon Frame
    const colon = makeOrganicTube(
      [
        [-0.98, -1.28, 0],
        [-1.08, -0.1, 0.08],
        [-0.92, 0.22, 0.12],
        [0.0, 0.16, 0.18],
        [0.95, 0.2, 0.12],
        [1.06, -0.88, 0.05],
        [0.45, -1.35, -0.05],
        [0.05, -1.78, -0.1],
      ],
      (t) => 0.2 + 0.048 * Math.abs(Math.sin(t * Math.PI * 16)),
      64,
      16,
      serosaMat(0xc2410c)
    );
    tagBioPart(root, runtime, 'large_intestine', colon, new THREE.Vector3(0, -0.65, -0.3));
  }

  // =========================================================================
  // 6. INSECT-POLLINATED FLOWER (Vein-Textured Petals, Cutaway Ovary/Ovules, Pollen Anthers)
  // =========================================================================
  else if (modelId === 'flower_reproduction') {
    const petalTex = createPetalTexture(runtime);

    const pedicel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 1.8, seg),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.62 })
    );
    pedicel.position.y = -1.45;
    const receptacle = new THREE.Mesh(
      makeSculptedOrganGeometry(0.46, seg, seg, 1.2, 0.68, 1.2, 4, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55 })
    );
    receptacle.position.y = -0.55;
    tagBioPart(root, runtime, 'sepal_receptacle', pedicel);
    tagBioPart(root, runtime, 'sepal_receptacle', receptacle);

    // Sculpted arched green Sepals
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const sepal = makeOrganicTube(
        [
          [Math.cos(a) * 0.35, -0.56, Math.sin(a) * 0.35],
          [Math.cos(a) * 0.85, -0.52, Math.sin(a) * 0.85],
          [Math.cos(a) * 1.25, -0.7, Math.sin(a) * 1.25],
        ],
        (t) => 0.18 * (1 - t * 0.82),
        12,
        10,
        new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 })
      );
      tagBioPart(root, runtime, 'sepal_receptacle', sepal, new THREE.Vector3(Math.cos(a) * 0.4, -0.45, Math.sin(a) * 0.4));
    }

    // Layered Botanical Petals with radial gradient & venation
    const petalMat = new THREE.MeshPhysicalMaterial({
      map: petalTex,
      roughness: 0.42,
      sheen: 0.8,
      sheenColor: new THREE.Color(0xfecdd3),
      side: THREE.DoubleSide,
    });
    for (let ring = 0; ring < 2; ring++) {
      const count = 6;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + ring * 0.52;
        const pShape = new THREE.Shape();
        pShape.moveTo(0, 0);
        pShape.bezierCurveTo(-0.55, 0.55, -0.68, 1.35, 0, 1.65);
        pShape.bezierCurveTo(0.68, 1.35, 0.55, 0.55, 0, 0);
        const pGeo = new THREE.ShapeGeometry(pShape, 18);
        // Cup the petal gracefully outward
        const pPos = pGeo.attributes.position;
        for (let k = 0; k < pPos.count; k++) {
          const px = pPos.getX(k);
          const py = pPos.getY(k);
          pPos.setZ(k, -0.22 * Math.sin((py / 1.65) * Math.PI) + 0.14 * (px * px));
        }
        pGeo.computeVertexNormals();
        const petal = new THREE.Mesh(pGeo, petalMat);
        petal.position.set(Math.cos(a) * 0.34, -0.35 + ring * 0.08, Math.sin(a) * 0.34);
        petal.rotation.y = -a + Math.PI / 2;
        petal.rotation.x = 0.72 - ring * 0.16;
        tagBioPart(root, runtime, 'petals', petal, new THREE.Vector3(Math.cos(a) * 0.8, 0.15, Math.sin(a) * 0.8));
      }
    }

    // Central Pistil: Stigma & Style
    const style = makeOrganicTube(
      [[0, 0.32, 0], [0, 0.95, 0], [0, 1.5, 0]],
      (t) => 0.12 - t * 0.04,
      14,
      14,
      new THREE.MeshPhysicalMaterial({ color: 0x86efac, roughness: 0.35, clearcoat: 0.4 })
    );
    const stigma = new THREE.Mesh(
      makeSculptedOrganGeometry(0.24, 18, 18, 1.35, 0.65, 1.35, 4, 0.12),
      new THREE.MeshPhysicalMaterial({ color: 0xfde047, roughness: 0.25, clearcoat: 0.7 })
    );
    stigma.position.y = 1.55;
    tagBioPart(root, runtime, 'stigma_style', style, new THREE.Vector3(0, 0.65, 0));
    tagBioPart(root, runtime, 'stigma_style', stigma, new THREE.Vector3(0, 0.85, 0));

    // Cutaway Ovary + Visible Ovules
    const ovaryGrp = new THREE.Group();
    ovaryGrp.position.y = -0.08;
    const ovaryWall = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, seg, seg, 0, Math.PI * 1.38),
      new THREE.MeshPhysicalMaterial({ color: 0x4ade80, roughness: 0.38, clearcoat: 0.35, side: THREE.DoubleSide })
    );
    ovaryWall.scale.set(1, 1.25, 1);
    ovaryGrp.add(ovaryWall);
    const ovuleMat = new THREE.MeshPhysicalMaterial({ color: 0xfef9c3, roughness: 0.25, clearcoat: 0.5 });
    [0.16, -0.14].forEach((oy) => {
      [-0.13, 0.13].forEach((ox) => {
        const ovule = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), ovuleMat);
        ovule.position.set(ox, oy, 0);
        ovaryGrp.add(ovule);
      });
    });
    tagBioPart(root, runtime, 'ovary_ovules', ovaryGrp, new THREE.Vector3(0, 0.15, 0.65));

    // Stamens (Filaments + Bi-lobed Anthers)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.15;
      const stamenGrp = new THREE.Group();
      const filament = makeTube(
        [
          [Math.cos(a) * 0.34, -0.35, Math.sin(a) * 0.34],
          [Math.cos(a) * 0.62, 0.38, Math.sin(a) * 0.62],
          [Math.cos(a) * 0.72, 1.08, Math.sin(a) * 0.72],
        ],
        0.032,
        0xfef08a,
        0.35
      );
      const lobe1 = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.068, 0.18, 8, 12),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.55 })
      );
      lobe1.position.set(Math.cos(a) * 0.72, 1.15, Math.sin(a) * 0.72);
      lobe1.rotation.z = Math.PI / 2;
      lobe1.rotation.y = a;
      stamenGrp.add(filament, lobe1);
      tagBioPart(root, runtime, 'anther_filament', stamenGrp, new THREE.Vector3(Math.cos(a) * 0.5, 0.45, Math.sin(a) * 0.5));
    }
  }

  // =========================================================================
  // 7. HUMAN HEART (Beating Asymmetric Chambers, Coronary Vessels, Aortic Arch w/ 3 Branches)
  // =========================================================================
  else if (modelId === 'human_heart') {
    const heartTex = createMuscleStriationTextures(runtime, '#8f1d28', '#be123c');
    const oxMat = new THREE.MeshPhysicalMaterial({
      map: heartTex.colorMap,
      bumpMap: heartTex.bumpMap,
      bumpScale: 0.03,
      color: 0xdc2626,
      roughness: 0.3,
      clearcoat: 0.78,
    });
    const deoxMat = new THREE.MeshPhysicalMaterial({
      map: heartTex.colorMap,
      bumpMap: heartTex.bumpMap,
      bumpScale: 0.03,
      color: 0x1d4ed8,
      roughness: 0.32,
      clearcoat: 0.72,
    });

    const ra = new THREE.Mesh(makeSculptedOrganGeometry(0.58, seg, seg, 1.05, 0.95, 0.95, 4, 0.05), deoxMat);
    ra.position.set(-0.68, 0.68, 0.14);
    tagBioPart(root, runtime, 'ra', ra, new THREE.Vector3(-0.6, 0.4, 0.3));

    const rv = new THREE.Mesh(makeSculptedOrganGeometry(0.76, seg, seg, 0.92, 1.28, 0.88, 3, 0.04), deoxMat);
    rv.position.set(-0.42, -0.42, 0.16);
    rv.rotation.z = 0.22;
    tagBioPart(root, runtime, 'rv', rv, new THREE.Vector3(-0.5, -0.4, 0.35));

    const la = new THREE.Mesh(makeSculptedOrganGeometry(0.56, seg, seg, 1.05, 0.95, 0.92, 4, 0.05), oxMat);
    la.position.set(0.68, 0.74, 0.04);
    tagBioPart(root, runtime, 'la', la, new THREE.Vector3(0.6, 0.45, 0.3));

    const lv = new THREE.Mesh(makeSculptedOrganGeometry(0.86, seg, seg, 0.94, 1.42, 0.92, 3, 0.04), oxMat);
    lv.position.set(0.4, -0.52, 0.06);
    lv.rotation.z = -0.22;
    tagBioPart(root, runtime, 'lv', lv, new THREE.Vector3(0.55, -0.45, 0.3));

    // Aortic Arch + 3 Great Systemic Arterial Branches (Brachiocephalic, Left Carotid, Subclavian)
    const aortaGrp = new THREE.Group();
    const arch = makeTube(
      [[0.15, 0.45, 0], [0.22, 1.35, 0.04], [-0.18, 1.78, -0.05], [-0.52, 1.32, -0.28], [-0.45, -0.1, -0.46]],
      0.22,
      0xef4444,
      0.28
    );
    const b1 = makeTube([[0.12, 1.62, 0.02], [0.22, 2.15, 0.04]], 0.075, 0xef4444, 0.3);
    const b2 = makeTube([[-0.08, 1.76, -0.02], [-0.05, 2.24, -0.02]], 0.065, 0xef4444, 0.3);
    const b3 = makeTube([[-0.28, 1.72, -0.08], [-0.36, 2.18, -0.1]], 0.065, 0xef4444, 0.3);
    // Anterior Descending Coronary Artery
    const coronary = makeTube([[0.05, 0.5, 0.68], [0.02, -0.15, 0.8], [0.18, -0.88, 0.68]], 0.042, 0xf87171, 0.25);
    aortaGrp.add(arch, b1, b2, b3, coronary);
    tagBioPart(root, runtime, 'aorta', aortaGrp, new THREE.Vector3(0, 0.75, 0));

    runtime.anim = { ra, rv, la, lv };
  }

  // =========================================================================
  // 8. EUKARYOTIC ANIMAL CELL (Glass Cutaway + Folded Cristae Mitochondrion + Ribosome ER)
  // =========================================================================
  else if (modelId === 'animal_cell') {
    const mem = new THREE.Mesh(
      new THREE.SphereGeometry(2.15, seg, seg, 0, Math.PI * 1.42),
      new THREE.MeshPhysicalMaterial({
        color: 0x22c55e,
        roughness: 0.16,
        clearcoat: 0.8,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      })
    );
    tagBioPart(root, runtime, 'membrane', mem);

    const nucGrp = new THREE.Group();
    const nucShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.74, seg, seg, 0, Math.PI * 1.5),
      new THREE.MeshPhysicalMaterial({ color: 0x4f46e5, roughness: 0.25, clearcoat: 0.6, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
    );
    const nucleolus = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 18, 18),
      new THREE.MeshStandardMaterial({ color: 0xc7d2fe, roughness: 0.35 })
    );
    nucGrp.add(nucShell, nucleolus);
    tagBioPart(root, runtime, 'nucleus', nucGrp, new THREE.Vector3(0, 0.5, 0));

    // Rough ER Folded Membrane + Ribosome Studs
    const erGrp = new THREE.Group();
    const erTube = makeTube([[-0.78, 0.22, 0.2], [-1.18, 0.45, 0.35], [-1.26, -0.05, 0.5], [-0.95, -0.42, 0.3]], 0.12, 0x06b6d4, 0.35);
    erGrp.add(erTube);
    const riboMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });
    [-0.95, -1.12, -1.24, -1.06].forEach((rx, idx) => {
      const r = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), riboMat);
      r.position.set(rx, 0.28 - idx * 0.2, 0.42);
      erGrp.add(r);
    });
    tagBioPart(root, runtime, 'er', erGrp, new THREE.Vector3(-0.6, 0.2, 0.4));

    // Mitochondrion Outer Shell + Inner Zigzag Cristae Ribbon
    const mitoGrp = new THREE.Group();
    mitoGrp.position.set(1.18, 0.42, 0.45);
    mitoGrp.rotation.z = -0.45;
    const mitoBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.25, 0.58, 10, seg),
      new THREE.MeshPhysicalMaterial({ color: 0xf97316, roughness: 0.28, clearcoat: 0.5, transparent: true, opacity: 0.72 })
    );
    const cristae = makeTube([[0, -0.3, 0.08], [0.1, -0.15, 0.1], [-0.1, 0, 0.1], [0.1, 0.15, 0.1], [0, 0.3, 0.08]], 0.032, 0xfef08a, 0.3);
    mitoGrp.add(mitoBody, cristae);
    tagBioPart(root, runtime, 'mitochondrion', mitoGrp, new THREE.Vector3(0.6, 0.3, 0.4));

    const golgiGrp = new THREE.Group();
    golgiGrp.position.set(0.85, -0.75, 0.55);
    [-0.14, 0, 0.14].forEach((gy, i) => {
      const sac = new THREE.Mesh(
        new THREE.TorusGeometry(0.32 - i * 0.04, 0.055, 10, 22, Math.PI),
        new THREE.MeshPhysicalMaterial({ color: 0xfacc15, roughness: 0.28, clearcoat: 0.5 })
      );
      sac.position.y = gy;
      golgiGrp.add(sac);
    });
    tagBioPart(root, runtime, 'golgi', golgiGrp, new THREE.Vector3(0.5, -0.5, 0.45));

    const lyso = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 18, 18),
      new THREE.MeshPhysicalMaterial({ color: 0xf43f5e, roughness: 0.25, clearcoat: 0.65 })
    );
    lyso.position.set(-0.95, -0.82, 0.45);
    tagBioPart(root, runtime, 'lysosome', lyso, new THREE.Vector3(-0.5, -0.5, 0.4));

    runtime.anim = { spinGroup: mitoGrp };
  }

  // =========================================================================
  // 9. PLANT PARENCHYMA CELL (Hexagonal Cellulose Wall + Vacuole + Grana Chloroplasts)
  // =========================================================================
  else if (modelId === 'plant_cell') {
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(2.12, 2.12, 2.2, 6, 1, true),
      new THREE.MeshPhysicalMaterial({ color: 0x16a34a, roughness: 0.5, clearcoat: 0.25, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    tagBioPart(root, runtime, 'cell_wall', wall);

    const vacuole = new THREE.Mesh(
      makeSculptedOrganGeometry(1.02, seg, seg, 1.15, 0.82, 0.9, 4, 0.05),
      new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.12, transparent: true, opacity: 0.56, clearcoat: 0.8 })
    );
    tagBioPart(root, runtime, 'vacuole', vacuole, new THREE.Vector3(0, 0.65, 0));

    [
      [-1.25, 0.45, 0.45],
      [1.2, 0.5, -0.4],
      [-1.1, -0.45, -0.5],
    ].forEach(([cx, cy, cz]) => {
      const chloroGrp = new THREE.Group();
      chloroGrp.position.set(cx, cy, cz);
      chloroGrp.rotation.z = 0.6;
      const shell = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.22, 0.44, 10, 16),
        new THREE.MeshPhysicalMaterial({ color: 0x22c55e, roughness: 0.25, clearcoat: 0.5, transparent: true, opacity: 0.72 })
      );
      chloroGrp.add(shell);
      [-0.12, 0, 0.12].forEach((gy) => {
        const grana = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.11, 0.05, 12),
          new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.4 })
        );
        grana.position.y = gy;
        chloroGrp.add(grana);
      });
      tagBioPart(root, runtime, 'chloroplast', chloroGrp, new THREE.Vector3(cx * 0.4, cy * 0.3, cz * 0.4));
    });

    const pNuc = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, seg, seg),
      new THREE.MeshPhysicalMaterial({ color: 0x6366f1, roughness: 0.3, clearcoat: 0.5 })
    );
    pNuc.position.set(1.15, -0.45, 0.48);
    tagBioPart(root, runtime, 'p_nucleus', pNuc, new THREE.Vector3(0.55, -0.35, 0.45));

    const pMito = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.16, 0.36, 8, 14),
      new THREE.MeshPhysicalMaterial({ color: 0xf97316, roughness: 0.32, clearcoat: 0.45 })
    );
    pMito.position.set(-0.95, -0.55, 0.65);
    tagBioPart(root, runtime, 'p_mito', pMito, new THREE.Vector3(-0.45, -0.35, 0.45));
  }

  // =========================================================================
  // 10. KIDNEY NEPHRON (Cutaway Bowman's Cup + Glomerulus + Convoluted Tubules)
  // =========================================================================
  else if (modelId === 'nephron') {
    const bowmanGrp = new THREE.Group();
    bowmanGrp.position.set(-1.65, 1.1, 0);
    const cup = new THREE.Mesh(
      new THREE.SphereGeometry(0.56, seg, seg, 0, Math.PI * 1.4),
      new THREE.MeshPhysicalMaterial({ color: 0xfacc15, roughness: 0.38, clearcoat: 0.45, side: THREE.DoubleSide })
    );
    const glom = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.24, 0.06, 48, 10, 2, 3),
      new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.28, clearcoat: 0.6 })
    );
    bowmanGrp.add(cup, glom);
    tagBioPart(root, runtime, 'bowman', bowmanGrp, new THREE.Vector3(-0.65, 0.45, 0.25));

    const pct = makeTube(
      [[-1.12, 1.1, 0], [-0.75, 1.45, 0.25], [-0.45, 0.95, -0.15], [-0.15, 1.32, 0.2], [0.05, 0.85, 0]],
      0.13,
      0xf59e0b,
      0.35
    );
    tagBioPart(root, runtime, 'pct', pct, new THREE.Vector3(-0.2, 0.55, 0.3));

    const henle = makeTube(
      [[0.05, 0.85, 0], [0.08, -0.5, 0], [0.12, -1.65, 0.05], [0.38, -1.9, 0.05], [0.65, -1.65, 0], [0.68, 0.85, 0]],
      0.11,
      0xfbbf24,
      0.38
    );
    tagBioPart(root, runtime, 'henle', henle, new THREE.Vector3(0, -0.65, 0.3));

    const dctGrp = new THREE.Group();
    const dct = makeTube([[0.68, 0.85, 0], [1.0, 1.25, 0.2], [1.3, 0.9, -0.1], [1.55, 1.05, 0]], 0.13, 0xf59e0b, 0.35);
    const duct = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.21, 3.3, seg),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.28, clearcoat: 0.55 })
    );
    duct.position.set(1.62, -0.15, 0);
    dctGrp.add(dct, duct);
    tagBioPart(root, runtime, 'dct', dctGrp, new THREE.Vector3(0.65, 0, 0.25));

    const drop = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: 0.55 })
    );
    drop.position.set(1.62, 1.1, 0);
    root.add(drop);
    runtime.anim = { filtrateDrop: drop };
  }

  // =========================================================================
  // 11. DICOT LEAF CROSS-SECTION (3D Tissue Block w/ Waxy Cuticle, Palisade & Stoma)
  // =========================================================================
  else if (modelId === 'leaf_flower') {
    const upperEpi = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.26, 2.2),
      new THREE.MeshPhysicalMaterial({ color: 0x86efac, roughness: 0.14, clearcoat: 0.85, transparent: true, opacity: 0.78 })
    );
    upperEpi.position.y = 1.25;
    tagBioPart(root, runtime, 'cuticle', upperEpi, new THREE.Vector3(0, 0.75, 0));

    const palGrp = new THREE.Group();
    const palMat = new THREE.MeshPhysicalMaterial({ color: 0x16a34a, roughness: 0.38, clearcoat: 0.35 });
    for (let x = -1.65; x <= 1.65; x += 0.66) {
      for (let z = -0.65; z <= 0.65; z += 0.65) {
        const cell = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.54, 8, 14), palMat);
        cell.position.set(x, 0.62, z);
        palGrp.add(cell);
      }
    }
    tagBioPart(root, runtime, 'palisade', palGrp, new THREE.Vector3(0, 0.35, 0));

    const veinGrp = new THREE.Group();
    veinGrp.position.set(0.85, -0.25, 0);
    const sheath = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 2.35, seg),
      new THREE.MeshPhysicalMaterial({ color: 0x334155, roughness: 0.5, transparent: true, opacity: 0.5 })
    );
    sheath.rotation.x = Math.PI / 2;
    const xylem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.45, 16), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 }));
    xylem.rotation.x = Math.PI / 2;
    xylem.position.y = 0.16;
    const phloem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.45, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35 }));
    phloem.rotation.x = Math.PI / 2;
    phloem.position.y = -0.16;
    veinGrp.add(sheath, xylem, phloem);
    tagBioPart(root, runtime, 'vascular', veinGrp, new THREE.Vector3(0.65, 0, 0.45));

    const spongyGrp = new THREE.Group();
    const spMat = new THREE.MeshPhysicalMaterial({ color: 0x15803d, roughness: 0.48, clearcoat: 0.25 });
    [[-1.4, -0.35, 0.4], [-0.75, -0.55, -0.4], [-0.1, -0.25, 0.5], [-1.1, -0.75, -0.2], [-0.3, -0.7, 0.25]].forEach(([sx, sy, sz]) => {
      const sp = new THREE.Mesh(makeSculptedOrganGeometry(0.28, 16, 16, 1.1, 0.9, 1.0, 4, 0.08), spMat);
      sp.position.set(sx, sy, sz);
      spongyGrp.add(sp);
    });
    tagBioPart(root, runtime, 'spongy', spongyGrp, new THREE.Vector3(-0.65, -0.2, 0.4));

    const lowerGrp = new THREE.Group();
    lowerGrp.position.y = -1.25;
    const lowL = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.24, 2.2), new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.45 }));
    lowL.position.x = -1.25;
    const lowR = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.24, 2.2), new THREE.MeshStandardMaterial({ color: 0x86efac, roughness: 0.45 }));
    lowR.position.x = 1.25;
    const guard1 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 10, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.35 }));
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
    const breath = 0.5 + 0.5 * Math.sin(elapsed * 1.9);
    const sx = 1 + breath * 0.13;
    a.lungR.scale.set(sx, 1 + breath * 0.06, sx);
    a.lungL.scale.set(sx, 1 + breath * 0.06, sx);
    const diagBase = runtime.baseOffsets.get(a.diaphragm);
    if (diagBase) {
      a.diaphragm.position.y = diagBase.y - breath * 0.26 - explodeAmount * 0.75;
    }
  } else if (modelId === 'muscular_anatomy' && a.forearmPivot) {
    const flex = 0.5 + 0.5 * Math.sin(elapsed * 1.6);
    a.forearmPivot.rotation.z = flex * 1.15;
    if (a.bicepsMesh && a.tricepsMesh) {
      a.bicepsMesh.scale.set(0.88 + flex * 0.32, 1.0 - flex * 0.14, 1.04 + flex * 0.28);
      a.tricepsMesh.scale.set(0.78 + (1 - flex) * 0.22, 1.08 - (1 - flex) * 0.1, 0.92);
    }
    if (a.zLeft && a.zRight && a.actinLeftGrp && a.actinRightGrp) {
      const slide = flex * 0.26;
      a.zLeft.position.x = -1.18 + slide;
      a.zRight.position.x = 1.18 - slide;
      a.actinLeftGrp.position.x = slide;
      a.actinRightGrp.position.x = -slide;
    }
  } else if (modelId === 'human_heart' && a.ra && a.rv && a.la && a.lv) {
    const phase = (elapsed * 1.25) % 1;
    const atrialPulse = phase < 0.25 ? Math.sin((phase / 0.25) * Math.PI) : 0;
    const ventPulse = phase >= 0.2 && phase < 0.55 ? Math.sin(((phase - 0.2) / 0.35) * Math.PI) : 0;
    const aScale = 1 + atrialPulse * 0.09;
    const vScale = 1 - ventPulse * 0.085;
    a.ra.scale.setScalar(aScale);
    a.la.scale.setScalar(aScale);
    a.rv.scale.setScalar(vScale);
    a.lv.scale.setScalar(vScale);
  } else if (modelId === 'nervous_neuron' && a.impulseSphere) {
    const t = (elapsed * 0.65) % 1;
    a.impulseSphere.position.x = -0.7 + t * 3.25;
  } else if (modelId === 'nephron' && a.filtrateDrop) {
    const t = (elapsed * 0.45) % 1;
    a.filtrateDrop.position.y = 1.4 - t * 3.0;
  } else if (modelId === 'animal_cell' && a.spinGroup) {
    a.spinGroup.rotation.y = elapsed * 0.45;
  }
}
