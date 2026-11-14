import * as THREE from 'three';
import { SimMode, SimParams } from './threeLabCatalog';

// Pre-allocated scratch vectors for zero-GC animation updates
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _vDir = new THREE.Vector3();
const _vUp = new THREE.Vector3(0, 1, 0);

export function makeArrowGroup(color: number): THREE.Group {
  const grp = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1, 12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 })
  );
  shaft.position.y = 0.5;
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, 0.28, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.2 })
  );
  head.position.y = 1.1;
  grp.add(shaft, head);
  return grp;
}

export function orientArrow(arrow: THREE.Group, origin: THREE.Vector3, dir: THREE.Vector3, length: number) {
  arrow.position.copy(origin);
  if (length < 0.05 || dir.lengthSq() < 1e-8) {
    arrow.visible = false;
    return;
  }
  arrow.visible = true;
  _vDir.copy(dir).normalize();
  arrow.quaternion.setFromUnitVectors(_vUp, _vDir);
  arrow.scale.set(1, Math.min(4.2, Math.max(0.25, length)), 1);
}

function makeBondCylinder(p1: THREE.Vector3, p2: THREE.Vector3, radius: number, color: number): THREE.Mesh {
  const dist = p1.distanceTo(p2);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, dist, 12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.25 })
  );
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  _vDir.copy(p2).sub(p1).normalize();
  mesh.quaternion.setFromUnitVectors(_vUp, _vDir);
  return mesh;
}

export function buildExtendedSimScene(
  mode: SimMode,
  simGroup: THREE.Group,
  runtime: Record<string, any>,
  isSoftwareGl: boolean
): boolean {
  // === 1. HELICAL SPRING & SHM ===
  if (mode === 'spring_shm') {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.35 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.24, 2.2), frameMat);
    base.position.y = 0.12;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 5.2, 16), frameMat);
    pole.position.set(-1.1, 2.7, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 16), frameMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(-0.4, 5.2, 0);

    // Helical coil generated along Y from 0 to -1 (scaled dynamically)
    const helixPts: THREE.Vector3[] = [];
    const turns = 9;
    const segs = 120;
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const ang = u * turns * Math.PI * 2;
      helixPts.push(new THREE.Vector3(Math.cos(ang) * 0.35, -u, Math.sin(ang) * 0.35));
    }
    const springCurve = new THREE.CatmullRomCurve3(helixPts);
    const springMesh = new THREE.Mesh(
      new THREE.TubeGeometry(springCurve, 140, 0.045, 10, false),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
    );
    springMesh.position.set(0.25, 5.15, 0);

    const massBob = new THREE.Group();
    const bobCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.6, 28),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.45, roughness: 0.25 })
    );
    const bobCap = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.05, 12, 28),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.75, roughness: 0.2 })
    );
    bobCap.rotation.x = Math.PI / 2;
    massBob.add(bobCore, bobCap);

    const forceArrow = makeArrowGroup(0xf43f5e);
    simGroup.add(base, pole, arm, springMesh, massBob, forceArrow);
    runtime.springMesh = springMesh;
    runtime.massBob = massBob;
    runtime.forceArrow = forceArrow;
    runtime.t = 0;
    return true;
  }

  // === 2. TORQUE & GYROSCOPE ===
  if (mode === 'torque_gyro') {
    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.65, 0.45, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.35 })
    );
    stand.position.y = 0.225;
    const pivotPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.11, 2.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.25 })
    );
    pivotPost.position.y = 1.3;

    const rotorAssembly = new THREE.Group();
    rotorAssembly.position.set(0, 2.4, 0);

    const axle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 4.0, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
    );
    axle.rotation.z = Math.PI / 2;
    axle.position.x = 1.2;

    const wheelGrp = new THREE.Group();
    const wheelRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.14, 18, 48),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.18 })
    );
    wheelRim.rotation.y = Math.PI / 2;
    const wheelDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.05, 0.12, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.55, roughness: 0.35 })
    );
    wheelDisc.rotation.z = Math.PI / 2;
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 2.1, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.5, roughness: 0.3 })
    );
    wheelGrp.add(wheelRim, wheelDisc, spoke);
    wheelGrp.position.x = 2.2;

    const forceArrow = makeArrowGroup(0x38bdf8);
    const torqueArrow = makeArrowGroup(0x22c55e);

    rotorAssembly.add(axle, wheelGrp, forceArrow, torqueArrow);
    simGroup.add(stand, pivotPost, rotorAssembly);
    runtime.rotorAssembly = rotorAssembly;
    runtime.wheelGrp = wheelGrp;
    runtime.forceArrow = forceArrow;
    runtime.torqueArrow = torqueArrow;
    runtime.precess = 0;
    return true;
  }

  // === 3. 3D DOPPLER WAVEFRONTS ===
  if (mode === 'doppler_3d') {
    const emitter = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.9, 20),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.65, roughness: 0.25 })
    );
    body.rotation.z = -Math.PI / 2;
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.8 })
    );
    glow.position.x = -0.35;
    emitter.add(body, glow);
    emitter.position.y = 2.0;

    const shells: { mesh: THREE.Mesh; spawnX: number; birth: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.035, 10, 48),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, roughness: 0.3 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 2.0;
      simGroup.add(ring);
      shells.push({ mesh: ring, spawnX: -4, birth: i * 0.25 });
    }
    simGroup.add(emitter);
    runtime.emitter = emitter;
    runtime.shells = shells;
    runtime.time = 0;
    return true;
  }

  // === 4. 3D CONVEX LENS OPTICS ===
  if (mode === 'optics_lens_3d') {
    const axis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 13, 12),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 })
    );
    axis.rotation.z = Math.PI / 2;
    axis.position.y = 2.0;

    // Biconvex Lens via LatheGeometry
    const pts: THREE.Vector2[] = [];
    const lensR = 1.65;
    for (let i = -16; i <= 16; i++) {
      const y = (i / 16) * lensR;
      const x = Math.max(0.02, 0.34 * Math.cos((i / 16) * (Math.PI / 2)));
      pts.push(new THREE.Vector2(Math.abs(y), x));
    }
    const lensMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 32, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0x7dd3fc,
        roughness: 0.08,
        metalness: 0.05,
        transmission: isSoftwareGl ? 0 : 0.78,
        transparent: true,
        opacity: isSoftwareGl ? 0.45 : 0.92,
      })
    );
    lensMesh.scale.set(0.24, 1.05, 1.05);
    lensMesh.position.set(0, 2.0, 0);

    const lensRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.58, 0.05, 14, 48),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.25 })
    );
    lensRim.rotation.y = Math.PI / 2;
    lensRim.position.set(0, 2.0, 0);

    const objArrow = makeArrowGroup(0x22c55e);
    const imgArrow = makeArrowGroup(0xf59e0b);

    // 3 Light Ray lines (top, center, bottom) from object tip -> lens -> image tip
    const rayMat = new THREE.LineBasicMaterial({ color: 0xfde047 });
    const rayLines = Array.from({ length: 3 }, () => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]);
      const line = new THREE.Line(geo, rayMat);
      simGroup.add(line);
      return line;
    });

    const fMarkerL = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e })
    );
    const fMarkerR = fMarkerL.clone();
    simGroup.add(axis, lensMesh, lensRim, objArrow, imgArrow, fMarkerL, fMarkerR);

    runtime.objArrow = objArrow;
    runtime.imgArrow = imgArrow;
    runtime.rayLines = rayLines;
    runtime.fMarkerL = fMarkerL;
    runtime.fMarkerR = fMarkerR;
    return true;
  }

  // === 5. BERNOULLI VENTURI PIPE ===
  if (mode === 'bernoulli_pipe') {
    const makeVenturiPts = (throat: number) => {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 40; i++) {
        const x = -4.2 + (i / 40) * 8.4;
        const pinch = Math.exp(-(x * x) / 1.4);
        const r = 1.0 - (1.0 - throat) * pinch;
        pts.push(new THREE.Vector2(r, x));
      }
      return pts;
    };

    const pipeMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      roughness: 0.15,
      metalness: 0.05,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
    });
    const pipeMesh = new THREE.Mesh(new THREE.LatheGeometry(makeVenturiPts(0.5), 32), pipeMat);
    pipeMesh.rotation.z = -Math.PI / 2;
    pipeMesh.position.y = 1.8;

    const colMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.25, metalness: 0.1 });
    const colInlet = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1, 16), colMat);
    const colThroat = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1, 16), colMat);

    const particles: THREE.Mesh[] = [];
    const pMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.5 });
    for (let i = 0; i < 28; i++) {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), pMat);
      simGroup.add(sp);
      particles.push(sp);
    }

    simGroup.add(pipeMesh, colInlet, colThroat);
    runtime.pipeMesh = pipeMesh;
    runtime.makeVenturiPts = makeVenturiPts;
    runtime.lastThroat = 0.5;
    runtime.colInlet = colInlet;
    runtime.colThroat = colThroat;
    runtime.particles = particles;
    runtime.uVals = particles.map((_, i) => i / particles.length);
    return true;
  }

  // === 6. BOHR QUANTUM ATOM ===
  if (mode === 'bohr_atom') {
    const nucleus = new THREE.Group();
    nucleus.position.y = 2.3;
    const protonMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3, metalness: 0.2 });
    const neutronMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35, metalness: 0.2 });
    for (let i = 0; i < 12; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 12);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 14), i % 2 === 0 ? protonMat : neutronMat);
      nuc.position.set(
        0.22 * Math.sin(phi) * Math.cos(theta),
        0.22 * Math.cos(phi),
        0.22 * Math.sin(phi) * Math.sin(theta)
      );
      nucleus.add(nuc);
    }

    const shells: THREE.Mesh[] = [];
    const electrons: THREE.Mesh[] = [];
    const shellRadii = [1.1, 1.85, 2.65, 3.45];
    const eMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.85 });

    for (let s = 0; s < 4; s++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(shellRadii[s], 0.025, 10, 64),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 })
      );
      ring.position.y = 2.3;
      ring.rotation.x = Math.PI / 2 + (s % 2 === 0 ? 0.28 : -0.28);
      ring.rotation.y = s * 0.45;
      simGroup.add(ring);
      shells.push(ring);

      const eMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), eMat);
      simGroup.add(eMesh);
      electrons.push(eMesh);
    }

    simGroup.add(nucleus);
    runtime.nucleus = nucleus;
    runtime.shells = shells;
    runtime.electrons = electrons;
    runtime.shellRadii = shellRadii;
    runtime.t = 0;
    return true;
  }

  // === 7. MATH 3D SPHERE ===
  if (mode === 'math_sphere') {
    const grp = new THREE.Group();
    grp.position.y = 2.4;
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 36, 28),
      new THREE.MeshPhysicalMaterial({
        color: 0x0ea5e9,
        roughness: 0.2,
        metalness: 0.15,
        transparent: true,
        opacity: 0.55,
      })
    );
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(1.005, 18, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.4 })
    );
    const equator = new THREE.Mesh(
      new THREE.TorusGeometry(1.01, 0.025, 10, 64),
      new THREE.MeshStandardMaterial({ color: 0x22c55e })
    );
    equator.rotation.x = Math.PI / 2;
    const radiusRod = makeArrowGroup(0xf59e0b);
    radiusRod.rotation.z = -Math.PI / 2;
    const centerDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    grp.add(sphere, wire, equator, radiusRod, centerDot);
    simGroup.add(grp);
    runtime.shapeGrp = grp;
    return true;
  }

  // === 8. MATH 3D CYLINDER ===
  if (mode === 'math_cylinder') {
    const grp = new THREE.Group();
    const geo = new THREE.CylinderGeometry(1, 1, 1, 36);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: 0x10b981, transparent: true, opacity: 0.52, roughness: 0.25, metalness: 0.2 })
    );
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 12),
      new THREE.LineBasicMaterial({ color: 0x4ade80 })
    );
    const hAxis = makeArrowGroup(0xf59e0b);
    const rRod = makeArrowGroup(0x38bdf8);
    rRod.rotation.z = -Math.PI / 2;
    grp.add(mesh, wire, hAxis, rRod);
    simGroup.add(grp);
    runtime.cylMesh = mesh;
    runtime.cylWire = wire;
    runtime.hAxis = hAxis;
    runtime.rRod = rRod;
    runtime.grp = grp;
    return true;
  }

  // === 9. MATH 3D CONE & SLANT ===
  if (mode === 'math_cone') {
    const grp = new THREE.Group();
    const geo = new THREE.ConeGeometry(1, 1, 36);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.55, roughness: 0.25, metalness: 0.2 })
    );
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 12),
      new THREE.LineBasicMaterial({ color: 0xfde047 })
    );
    const hPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1, 10),
      new THREE.MeshStandardMaterial({ color: 0x22c55e })
    );
    const rRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1, 10),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8 })
    );
    rRod.rotation.z = Math.PI / 2;
    grp.add(mesh, wire, hPole, rRod);
    simGroup.add(grp);
    runtime.coneMesh = mesh;
    runtime.coneWire = wire;
    runtime.hPole = hPole;
    runtime.rRod = rRod;
    runtime.grp = grp;
    return true;
  }

  // === 10. MATH SQUARE PYRAMID ===
  if (mode === 'math_pyramid') {
    const grp = new THREE.Group();
    const geo = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4);
    geo.rotateY(Math.PI / 4);
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.55, roughness: 0.25, metalness: 0.2 })
    );
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 1),
      new THREE.LineBasicMaterial({ color: 0xc4b5fd })
    );
    const hPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1, 10),
      new THREE.MeshStandardMaterial({ color: 0x22c55e })
    );
    grp.add(mesh, wire, hPole);
    simGroup.add(grp);
    runtime.pyrMesh = mesh;
    runtime.pyrWire = wire;
    runtime.hPole = hPole;
    runtime.grp = grp;
    return true;
  }

  // === 11. MATH 3D TORUS SOLID ===
  if (mode === 'math_torus') {
    const grp = new THREE.Group();
    grp.position.y = 2.4;
    const mat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.55, roughness: 0.22 });
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.6, 24, 60), mat);
    const majorRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.025, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    grp.add(mesh, majorRing);
    simGroup.add(grp);
    runtime.torusGrp = grp;
    runtime.torusMesh = mesh;
    runtime.majorRing = majorRing;
    runtime.lastKey = '';
    return true;
  }

  // === 12. MATH 3D VECTORS & CROSS PRODUCT ===
  if (mode === 'math_vectors_3d') {
    const axes = new THREE.AxesHelper(4);
    axes.position.y = 0.04;

    const arrowA = makeArrowGroup(0x22c55e);
    const arrowB = makeArrowGroup(0x38bdf8);
    const arrowCross = makeArrowGroup(0xf43f5e);

    const planeGeo = new THREE.BufferGeometry();
    const verts = new Float32Array(12);
    planeGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    planeGeo.setIndex([0, 1, 2, 0, 2, 3]);
    const spanMesh = new THREE.Mesh(
      planeGeo,
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );

    simGroup.add(axes, arrowA, arrowB, arrowCross, spanMesh);
    runtime.arrowA = arrowA;
    runtime.arrowB = arrowB;
    runtime.arrowCross = arrowCross;
    runtime.spanMesh = spanMesh;
    return true;
  }

  // === 13. METHANE TETRAHEDRAL (CH4) ===
  if (mode === 'chem_methane') {
    const grp = new THREE.Group();
    grp.position.y = 2.3;
    const cAtom = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 28, 28),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.4 })
    );
    grp.add(cAtom);

    // Exact tetrahedral unit vectors
    const tetDirs = [
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(Math.sqrt(8 / 9), -1 / 3, 0),
      new THREE.Vector3(-Math.sqrt(2 / 9), -1 / 3, Math.sqrt(2 / 3)),
      new THREE.Vector3(-Math.sqrt(2 / 9), -1 / 3, -Math.sqrt(2 / 3)),
    ];
    const hMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.1 });
    const origin = new THREE.Vector3(0, 0, 0);
    const hAtoms: THREE.Mesh[] = [];
    tetDirs.forEach((d) => {
      const pos = d.clone().multiplyScalar(1.7);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), hMat);
      h.position.copy(pos);
      grp.add(h, makeBondCylinder(origin, pos, 0.08, 0x94a3b8));
      hAtoms.push(h);
    });

    const cage = new THREE.Mesh(
      new THREE.TetrahedronGeometry(2.15, 0),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true, transparent: true, opacity: 0.35 })
    );
    cage.rotation.y = Math.PI / 4;
    grp.add(cage);

    simGroup.add(grp);
    runtime.molGrp = grp;
    runtime.hAtoms = hAtoms;
    runtime.tetDirs = tetDirs;
    runtime.t = 0;
    return true;
  }

  // === 14. WATER BENT GEOMETRY (H2O) & DIPOLE ===
  if (mode === 'chem_water') {
    const grp = new THREE.Group();
    grp.position.y = 2.3;
    const oAtom = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 28, 28),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.28, metalness: 0.15 })
    );
    const hMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
    const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), hMat);
    const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), hMat);

    const b1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 1.5, 12),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.3 })
    );
    const b2 = b1.clone();

    // Two lone-pair electron orbital lobes
    const lobeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, roughness: 0.2 });
    const lobe1 = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 18), lobeMat);
    lobe1.scale.set(0.8, 1.5, 0.8);
    lobe1.position.set(0, 0.85, 0.62);
    lobe1.rotation.x = 0.6;
    const lobe2 = lobe1.clone();
    lobe2.position.set(0, 0.85, -0.62);
    lobe2.rotation.x = -0.6;

    const dipoleArrow = makeArrowGroup(0xf59e0b);
    dipoleArrow.position.set(0, -0.4, 0);
    dipoleArrow.rotation.z = Math.PI;

    grp.add(oAtom, h1, h2, b1, b2, lobe1, lobe2, dipoleArrow);
    simGroup.add(grp);
    runtime.waterGrp = grp;
    runtime.h1 = h1;
    runtime.h2 = h2;
    runtime.b1 = b1;
    runtime.b2 = b2;
    runtime.t = 0;
    return true;
  }

  // === 15. IDEAL GAS 3D CHAMBER ===
  if (mode === 'chem_ideal_gas') {
    const chamber = new THREE.Mesh(
      new THREE.CylinderGeometry(1.85, 1.85, 4.6, 32, 1, true),
      new THREE.MeshPhysicalMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.25,
        roughness: 0.1,
        side: THREE.DoubleSide,
      })
    );
    chamber.position.y = 2.3;
    const baseCap = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 1.9, 0.2, 32),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.35 })
    );
    baseCap.position.y = 0.1;

    const piston = new THREE.Mesh(
      new THREE.CylinderGeometry(1.82, 1.82, 0.22, 32),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.25 })
    );
    const pistonRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 1.8, 14),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    pistonRod.position.y = 0.9;
    piston.add(pistonRod);

    const atoms: { mesh: THREE.Mesh; vel: THREE.Vector3 }[] = [];
    const aMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.45 });
    for (let i = 0; i < 34; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), aMat);
      m.position.set((Math.random() - 0.5) * 2.2, 0.4 + Math.random() * 2.0, (Math.random() - 0.5) * 2.2);
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      simGroup.add(m);
      atoms.push({ mesh: m, vel: v });
    }

    simGroup.add(chamber, baseCap, piston);
    runtime.piston = piston;
    runtime.atoms = atoms;
    return true;
  }

  // === 16. NaCl IONIC CRYSTAL LATTICE ===
  if (mode === 'chem_lattice') {
    const grp = new THREE.Group();
    grp.position.y = 2.4;
    const naMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.25, metalness: 0.3 });
    const clMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.25, metalness: 0.25 });
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });

    const ions: { mesh: THREE.Mesh; base: THREE.Vector3 }[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const isCl = (x + y + z + 6) % 2 === 0;
          const sp = new THREE.Mesh(new THREE.SphereGeometry(isCl ? 0.32 : 0.21, 18, 18), isCl ? clMat : naMat);
          const base = new THREE.Vector3(x * 1.15, y * 1.15, z * 1.15);
          sp.position.copy(base);
          grp.add(sp);
          ions.push({ mesh: sp, base });
        }
      }
    }
    const cage = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.3, 2.3, 2.3)),
      new THREE.LineBasicMaterial({ color: 0x94a3b8 })
    );
    const strut = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.04, 0.04), strutMat);
    grp.add(cage, strut);
    simGroup.add(grp);
    runtime.latticeGrp = grp;
    runtime.ions = ions;
    runtime.t = 0;
    return true;
  }

  // === 17. BENZENE RING (C6H6) ===
  if (mode === 'chem_benzene') {
    const grp = new THREE.Group();
    grp.position.y = 2.3;
    const cMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.4 });
    const hMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });

    const cPts: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const cp = new THREE.Vector3(Math.cos(ang) * 1.4, 0, Math.sin(ang) * 1.4);
      const hp = new THREE.Vector3(Math.cos(ang) * 2.35, 0, Math.sin(ang) * 2.35);
      cPts.push(cp);
      const cMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 20), cMat);
      cMesh.position.copy(cp);
      const hMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), hMat);
      hMesh.position.copy(hp);
      grp.add(cMesh, hMesh, makeBondCylinder(cp, hp, 0.06, 0x94a3b8));
    }
    for (let i = 0; i < 6; i++) {
      grp.add(makeBondCylinder(cPts[i], cPts[(i + 1) % 6], 0.08, 0x64748b));
    }

    const piMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.5,
      roughness: 0.2,
    });
    const piTop = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.28, 16, 48), piMat);
    piTop.rotation.x = Math.PI / 2;
    piTop.position.y = 0.52;
    const piBot = piTop.clone();
    piBot.position.y = -0.52;

    grp.add(piTop, piBot);
    simGroup.add(grp);
    runtime.benzGrp = grp;
    runtime.piMat = piMat;
    return true;
  }

  // === 18. DNA DOUBLE HELIX ===
  if (mode === 'bio_dna') {
    const grp = new THREE.Group();
    grp.position.y = 2.4;

    const pts1: THREE.Vector3[] = [];
    const pts2: THREE.Vector3[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const y = (u - 0.5) * 4.4;
      const ang = u * Math.PI * 3.2;
      pts1.push(new THREE.Vector3(Math.cos(ang) * 0.95, y, Math.sin(ang) * 0.95));
      pts2.push(new THREE.Vector3(Math.cos(ang + Math.PI) * 0.95, y, Math.sin(ang + Math.PI) * 0.95));
    }
    const strand1 = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts1), 64, 0.1, 10, false),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.3 })
    );
    const strand2 = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 64, 0.1, 10, false),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3, metalness: 0.3 })
    );
    grp.add(strand1, strand2);

    const pairColors = [0xf43f5e, 0xf59e0b, 0xa855f7, 0x0ea5e9];
    for (let i = 2; i < steps - 1; i += 3) {
      const p1 = pts1[i];
      const p2 = pts2[i];
      const mid = _vA.copy(p1).add(p2).multiplyScalar(0.5).clone();
      grp.add(makeBondCylinder(p1, mid, 0.065, pairColors[i % 4]));
      grp.add(makeBondCylinder(mid, p2, 0.065, pairColors[(i + 2) % 4]));
    }

    simGroup.add(grp);
    runtime.dnaGrp = grp;
    return true;
  }

  // === 19. EUKARYOTIC CELL & SA/V ===
  if (mode === 'bio_cell') {
    const grp = new THREE.Group();
    grp.position.y = 2.4;

    const membrane = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0x4ade80,
        transparent: true,
        opacity: 0.25,
        roughness: 0.15,
        side: THREE.DoubleSide,
      })
    );
    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.35 })
    );
    const nucleolus = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.4 })
    );
    nucleus.add(nucleolus);

    const organelles: THREE.Mesh[] = [];
    const mitoMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35 });
    for (let i = 0; i < 6; i++) {
      const mito = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.18, 6, 12), mitoMat);
      const ang = (i / 6) * Math.PI * 2;
      mito.position.set(Math.cos(ang) * 0.65, (i % 2 === 0 ? 0.25 : -0.25), Math.sin(ang) * 0.65);
      mito.rotation.set(i, i * 0.7, 0);
      grp.add(mito);
      organelles.push(mito);
    }

    grp.add(membrane, nucleus);
    simGroup.add(grp);
    runtime.cellGrp = grp;
    runtime.organelles = organelles;
    return true;
  }

  // === 20. RED BLOOD CELL & O2 (EVANS-FUNG PROFILE) ===
  if (mode === 'bio_rbc') {
    const grp = new THREE.Group();
    grp.position.y = 2.2;

    // Evans-Fung mathematical biconcave disc profile rotated via LatheGeometry
    const pts: THREE.Vector2[] = [];
    const R = 1.65;
    for (let i = 0; i <= 24; i++) {
      const rho = i / 24;
      const y = 0.5 * R * Math.sqrt(Math.max(0, 1 - rho * rho)) * (0.21 + 2.0 * rho * rho - 1.12 * rho ** 4);
      pts.push(new THREE.Vector2(rho * R, y * 0.55));
    }
    for (let i = 24; i >= 0; i--) {
      const rho = i / 24;
      const y = -0.5 * R * Math.sqrt(Math.max(0, 1 - rho * rho)) * (0.21 + 2.0 * rho * rho - 1.12 * rho ** 4);
      pts.push(new THREE.Vector2(rho * R, y * 0.55));
    }
    const rbcMesh = new THREE.Mesh(
      new THREE.LatheGeometry(pts, 44),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.1 })
    );
    rbcMesh.rotation.x = 0.35;

    const o2Dots: THREE.Mesh[] = [];
    const o2Mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.55 });
    for (let i = 0; i < 12; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), o2Mat);
      grp.add(dot);
      o2Dots.push(dot);
    }

    grp.add(rbcMesh);
    simGroup.add(grp);
    runtime.rbcGrp = grp;
    runtime.rbcMesh = rbcMesh;
    runtime.o2Dots = o2Dots;
    runtime.t = 0;
    return true;
  }

  // === 21. MITOCHONDRION & ATP ROTOR ===
  if (mode === 'bio_mitochondria') {
    const grp = new THREE.Group();
    grp.position.y = 2.2;

    const outer = new THREE.Mesh(
      new THREE.CapsuleGeometry(1.1, 2.2, 12, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.3,
        roughness: 0.2,
        side: THREE.DoubleSide,
      })
    );
    outer.rotation.z = Math.PI / 2;

    // Folded inner cristae ribs
    const cristaMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    for (let i = -3; i <= 3; i++) {
      const disc = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.08, 12, 28), cristaMat);
      disc.position.x = i * 0.45;
      disc.rotation.y = Math.PI / 2;
      grp.add(disc);
    }

    // Spinning F0F1-ATP Synthase turbine at top
    const rotor = new THREE.Group();
    rotor.position.set(0, 1.15, 0);
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.4 })
    );
    const f1Head = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.35, 6),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, metalness: 0.3 })
    );
    f1Head.position.y = 0.35;
    rotor.add(stalk, f1Head);

    const protons: THREE.Mesh[] = [];
    const hMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.7 });
    for (let i = 0; i < 14; i++) {
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), hMat);
      grp.add(h);
      protons.push(h);
    }

    grp.add(outer, rotor);
    simGroup.add(grp);
    runtime.mitoGrp = grp;
    runtime.rotor = rotor;
    runtime.protons = protons;
    runtime.t = 0;
    return true;
  }

  // === 22. NEURON & ACTION POTENTIAL ===
  if (mode === 'bio_neuron') {
    const soma = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.85, 1),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.35 })
    );
    soma.position.set(-4.2, 2.1, 0);
    simGroup.add(soma);

    // Dendrites branching out of soma
    const dendMat = new THREE.MeshStandardMaterial({ color: 0xa78bfa, roughness: 0.4 });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const p1 = soma.position;
      const p2 = new THREE.Vector3(-4.8, 2.1 + Math.sin(ang) * 1.4, Math.cos(ang) * 1.4);
      simGroup.add(makeBondCylinder(p1, p2, 0.06, 0xa78bfa));
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), dendMat);
      tip.position.copy(p2);
      simGroup.add(tip);
    }

    // Long Axon shaft
    const axon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 8.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
    );
    axon.rotation.z = Math.PI / 2;
    axon.position.set(0.3, 2.1, 0);
    simGroup.add(axon);

    // 4 Myelin Sheath segments separated by Nodes of Ranvier
    const sheaths: THREE.Mesh[] = [];
    const sheathMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.35, transparent: true, opacity: 0.85 });
    [-2.4, -0.6, 1.2, 3.0].forEach((xPos) => {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.95, 8, 16), sheathMat);
      m.rotation.z = Math.PI / 2;
      m.position.set(xPos, 2.1, 0);
      simGroup.add(m);
      sheaths.push(m);
    });

    // Traveling Action Potential Impulse Pulse
    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.2 })
    );
    pulse.position.set(-3.4, 2.1, 0);
    simGroup.add(pulse);

    runtime.axon = axon;
    runtime.sheaths = sheaths;
    runtime.pulse = pulse;
    runtime.u = 0;
    return true;
  }

  return false;
}

export function updateExtendedSimScene(
  mode: SimMode,
  runtime: Record<string, any>,
  p: SimParams,
  dt: number,
  active: boolean
): boolean {
  if (mode === 'spring_shm' && runtime.springMesh) {
    const omega = Math.sqrt(p.springK / p.mass);
    if (active) runtime.t += dt;
    const disp = p.waveAmp * Math.cos(omega * runtime.t);
    const restLen = 2.6;
    const curLen = Math.max(0.8, restLen + disp);
    runtime.springMesh.scale.set(1, curLen, 1);
    const bobY = 5.15 - curLen - 0.3;
    runtime.massBob.position.set(0.25, bobY, 0);
    const bobScale = 0.75 + (p.mass / 15) * 0.55;
    runtime.massBob.scale.setScalar(bobScale);
    _vA.set(0.25, bobY, 0);
    _vB.set(0, -disp, 0);
    orientArrow(runtime.forceArrow, _vA, _vB, Math.abs(disp) * (p.springK / 30) * 1.4);
    return true;
  }

  if (mode === 'torque_gyro' && runtime.wheelGrp) {
    if (active) {
      runtime.wheelGrp.rotation.x += dt * 7.5;
      const rad = (p.angleDeg * Math.PI) / 180;
      const tau = p.radius * p.forceVal * Math.sin(rad);
      runtime.precess += dt * (tau / 45);
      runtime.rotorAssembly.rotation.y = runtime.precess;
    }
    const armX = Math.min(3.2, Math.max(1.0, p.radius));
    runtime.wheelGrp.position.x = armX;
    const rad = (p.angleDeg * Math.PI) / 180;
    _vA.set(armX, 0, 0);
    _vB.set(Math.cos(rad), -Math.sin(rad), 0);
    orientArrow(runtime.forceArrow, _vA, _vB, p.forceVal / 18);
    _vC.set(0, 0, Math.sin(rad));
    orientArrow(runtime.torqueArrow, _vA, _vC, (armX * p.forceVal * Math.sin(rad)) / 35);
    return true;
  }

  if (mode === 'doppler_3d' && runtime.emitter) {
    const vSound = 3.2 * p.spinRate;
    const vSrc = (p.sourceSpeed / 343) * vSound;
    if (active) runtime.time += dt * p.waveFreq;
    const emX = -4.5 + ((runtime.time * vSrc) % 9.0);
    runtime.emitter.position.x = emX;

    runtime.shells.forEach((s: any, idx: number) => {
      const cycle = (runtime.time + idx * 0.25) % 3.0;
      const r = Math.max(0.15, cycle * vSound * 0.85);
      const spawnX = emX - cycle * vSrc;
      s.mesh.position.x = spawnX;
      s.mesh.scale.set(r, r, 1);
      (s.mesh.material as THREE.MeshStandardMaterial).opacity = Math.max(0.05, 1 - cycle / 3.0);
    });
    return true;
  }

  if (mode === 'optics_lens_3d' && runtime.objArrow) {
    const u = p.objDistance;
    const f = p.focalLength;
    const denom = u - f;
    const v = Math.abs(denom) < 0.08 ? (denom >= 0 ? 12 : -12) : (f * u) / denom;
    const ho = p.scaleFactor;
    const hi = -ho * (v / u);

    _vA.set(-u, 2.0, 0);
    _vB.set(0, 1, 0);
    orientArrow(runtime.objArrow, _vA, _vB, ho);

    const imgX = Math.max(-6.5, Math.min(6.5, v));
    _vA.set(imgX, 2.0, 0);
    _vB.set(0, hi >= 0 ? 1 : -1, 0);
    orientArrow(runtime.imgArrow, _vA, _vB, Math.min(3.5, Math.abs(hi)));

    runtime.fMarkerL.position.set(-f, 2.0, 0);
    runtime.fMarkerR.position.set(f, 2.0, 0);

    const rayHeights = [ho, 0, -ho * 0.5];
    runtime.rayLines.forEach((line: THREE.Line, i: number) => {
      const attr = line.geometry.attributes.position as THREE.BufferAttribute;
      attr.setXYZ(0, -u, 2.0 + ho, 0);
      attr.setXYZ(1, 0, 2.0 + (i === 0 ? ho : i === 1 ? 0 : -0.6), 0);
      attr.setXYZ(2, imgX, 2.0 + hi, 0);
      attr.needsUpdate = true;
      void rayHeights;
    });
    return true;
  }

  if (mode === 'bernoulli_pipe' && runtime.particles) {
    if (Math.abs(runtime.lastThroat - p.throatRatio) > 0.01) {
      runtime.lastThroat = p.throatRatio;
      runtime.pipeMesh.geometry.dispose();
      runtime.pipeMesh.geometry = new THREE.LatheGeometry(runtime.makeVenturiPts(p.throatRatio), 32);
    }

    const v2 = p.speed / (p.throatRatio * p.throatRatio);
    const hIn = 2.6;
    const hThroat = Math.max(0.3, hIn - (v2 * v2 - p.speed * p.speed) * 0.012);
    runtime.colInlet.scale.set(1, hIn, 1);
    runtime.colInlet.position.set(-3.2, 2.6 + hIn / 2, 0);
    runtime.colThroat.scale.set(1, hThroat, 1);
    runtime.colThroat.position.set(0, 2.0 + hThroat / 2, 0);

    runtime.particles.forEach((sp: THREE.Mesh, idx: number) => {
      if (active) {
        const xCur = -4.0 + runtime.uVals[idx] * 8.0;
        const pinch = Math.exp(-(xCur * xCur) / 1.4);
        const rLocal = 1.0 - (1.0 - p.throatRatio) * pinch;
        const speedMult = 1 / (rLocal * rLocal);
        runtime.uVals[idx] = (runtime.uVals[idx] + dt * (p.speed * 0.06) * speedMult) % 1;
      }
      const x = -4.0 + runtime.uVals[idx] * 8.0;
      const pinch = Math.exp(-(x * x) / 1.4);
      const rLocal = (1.0 - (1.0 - p.throatRatio) * pinch) * 0.72;
      const laneAng = idx * 1.9;
      sp.position.set(x, 1.8 + Math.sin(laneAng) * rLocal, Math.cos(laneAng) * rLocal);
    });
    return true;
  }

  if (mode === 'bohr_atom' && runtime.shells) {
    if (active) runtime.t += dt * p.spinRate;
    runtime.nucleus.rotation.y += active ? dt * 0.8 : 0;
    runtime.shells.forEach((ring: THREE.Mesh, idx: number) => {
      const isVisible = idx < p.quantumN;
      ring.visible = isVisible;
      const el = runtime.electrons[idx];
      el.visible = isVisible;
      if (isVisible) {
        const r = runtime.shellRadii[idx];
        const ang = runtime.t * (3.2 / (idx + 1)) + idx * 1.4;
        _vA.set(Math.cos(ang) * r, Math.sin(ang) * r, 0).applyEuler(ring.rotation);
        el.position.copy(_vA).add(ring.position);
      }
    });
    return true;
  }

  if (mode === 'math_sphere' && runtime.shapeGrp) {
    runtime.shapeGrp.scale.setScalar(p.shapeRadius);
    if (active) runtime.shapeGrp.rotation.y += dt * 0.7 * p.spinRate;
    return true;
  }

  if (mode === 'math_cylinder' && runtime.grp) {
    const r = p.shapeRadius;
    const h = p.shapeHeight;
    runtime.cylMesh.scale.set(r, h, r);
    runtime.cylWire.scale.set(r, h, r);
    runtime.grp.position.y = h / 2 + 0.1;
    _vA.set(0, -h / 2, 0);
    _vB.set(0, 1, 0);
    orientArrow(runtime.hAxis, _vA, _vB, h * 0.85);
    _vA.set(0, h / 2, 0);
    _vB.set(1, 0, 0);
    orientArrow(runtime.rRod, _vA, _vB, r * 0.85);
    if (active) runtime.grp.rotation.y += dt * 0.65 * p.spinRate;
    return true;
  }

  if (mode === 'math_cone' && runtime.grp) {
    const r = p.shapeRadius;
    const h = p.shapeHeight;
    runtime.coneMesh.scale.set(r, h, r);
    runtime.coneWire.scale.set(r, h, r);
    runtime.grp.position.y = h / 2 + 0.1;
    runtime.hPole.scale.set(1, h, 1);
    runtime.rRod.scale.set(1, r, 1);
    runtime.rRod.position.set(r / 2, -h / 2, 0);
    if (active) runtime.grp.rotation.y += dt * 0.65 * p.spinRate;
    return true;
  }

  if (mode === 'math_pyramid' && runtime.grp) {
    const a = p.shapeRadius;
    const h = p.shapeHeight;
    runtime.pyrMesh.scale.set(a, h, a);
    runtime.pyrWire.scale.set(a, h, a);
    runtime.grp.position.y = h / 2 + 0.1;
    runtime.hPole.scale.set(1, h, 1);
    if (active) runtime.grp.rotation.y += dt * 0.65 * p.spinRate;
    return true;
  }

  if (mode === 'math_torus' && runtime.torusGrp) {
    const key = `${p.majorRadius.toFixed(2)}_${p.shapeRadius.toFixed(2)}`;
    if (runtime.lastKey !== key) {
      runtime.lastKey = key;
      runtime.torusMesh.geometry.dispose();
      runtime.torusMesh.geometry = new THREE.TorusGeometry(p.majorRadius, p.shapeRadius, 24, 60);
      runtime.majorRing.geometry.dispose();
      runtime.majorRing.geometry = new THREE.TorusGeometry(p.majorRadius, 0.025, 8, 64);
    }
    if (active) {
      runtime.torusGrp.rotation.y += dt * 0.75 * p.spinRate;
      runtime.torusGrp.rotation.x = 0.45;
    }
    return true;
  }

  if (mode === 'math_vectors_3d' && runtime.arrowA) {
    const rad = (p.angleDeg * Math.PI) / 180;
    const origin = _vA.set(0, 0.2, 0);
    const dirA = _vB.set(1, 0, 0);
    const dirB = _vC.set(Math.cos(rad), 0, Math.sin(rad));
    orientArrow(runtime.arrowA, origin, dirA, p.vecA);
    orientArrow(runtime.arrowB, origin, dirB, p.vecB);

    const crossLen = p.vecA * p.vecB * Math.sin(rad);
    orientArrow(runtime.arrowCross, origin, _vDir.set(0, 1, 0), crossLen * 0.45);

    const posAttr = runtime.spanMesh.geometry.attributes.position as THREE.BufferAttribute;
    const ax = p.vecA;
    const bx = p.vecB * Math.cos(rad);
    const bz = p.vecB * Math.sin(rad);
    posAttr.setXYZ(0, 0, 0.2, 0);
    posAttr.setXYZ(1, ax, 0.2, 0);
    posAttr.setXYZ(2, ax + bx, 0.2, bz);
    posAttr.setXYZ(3, bx, 0.2, bz);
    posAttr.needsUpdate = true;
    return true;
  }

  if (mode === 'chem_methane' && runtime.molGrp) {
    if (active) {
      runtime.t += dt * 8;
      runtime.molGrp.rotation.y += dt * 0.75 * p.spinRate;
    }
    runtime.molGrp.scale.setScalar(p.scaleFactor);
    const vib = ((p.temperature - 100) / 700) * 0.08;
    runtime.hAtoms.forEach((h: THREE.Mesh, idx: number) => {
      const wobble = 1.7 + Math.sin(runtime.t + idx * 1.5) * vib;
      h.position.copy(runtime.tetDirs[idx]).multiplyScalar(wobble);
    });
    return true;
  }

  if (mode === 'chem_water' && runtime.waterGrp) {
    if (active) {
      runtime.t += dt * 8;
      runtime.waterGrp.rotation.y += dt * 0.75 * p.spinRate;
    }
    const halfRad = ((p.angleDeg / 2) * Math.PI) / 180;
    const bondLen = 1.45;
    const hx = Math.sin(halfRad) * bondLen;
    const hy = -Math.cos(halfRad) * bondLen;
    const vib = ((p.temperature - 100) / 600) * 0.06;
    runtime.h1.position.set(hx, hy + Math.sin(runtime.t) * vib, 0);
    runtime.h2.position.set(-hx, hy - Math.sin(runtime.t) * vib, 0);

    runtime.b1.position.set(hx / 2, hy / 2, 0);
    runtime.b1.quaternion.setFromUnitVectors(_vUp, _vDir.set(hx, hy, 0).normalize());
    runtime.b2.position.set(-hx / 2, hy / 2, 0);
    runtime.b2.quaternion.setFromUnitVectors(_vUp, _vDir.set(-hx, hy, 0).normalize());
    return true;
  }

  if (mode === 'chem_ideal_gas' && runtime.piston) {
    const lidY = Math.min(4.4, Math.max(1.2, (p.volumeL / 4.2) * 4.2));
    runtime.piston.position.y = lidY;
    const speedFactor = Math.sqrt(p.temperature / 300) * 3.8;
    runtime.atoms.forEach((a: any) => {
      if (active) {
        a.mesh.position.addScaledVector(a.vel, dt * speedFactor);
      }
      const pos = a.mesh.position;
      if (pos.y < 0.35) {
        pos.y = 0.35;
        a.vel.y = Math.abs(a.vel.y);
      }
      if (pos.y > lidY - 0.25) {
        pos.y = lidY - 0.25;
        a.vel.y = -Math.abs(a.vel.y);
      }
      const rSq = pos.x * pos.x + pos.z * pos.z;
      if (rSq > 1.65 * 1.65) {
        const s = 1.64 / Math.sqrt(rSq);
        pos.x *= s;
        pos.z *= s;
        a.vel.x *= -1;
        a.vel.z *= -1;
      }
    });
    return true;
  }

  if (mode === 'chem_lattice' && runtime.latticeGrp) {
    if (active) {
      runtime.t += dt * 10;
      runtime.latticeGrp.rotation.y += dt * 0.55 * p.spinRate;
    }
    runtime.latticeGrp.scale.setScalar(p.scaleFactor);
    const vib = (p.temperature / 800) * 0.06;
    runtime.ions.forEach((item: any, i: number) => {
      item.mesh.position.set(
        item.base.x + Math.sin(runtime.t + i) * vib,
        item.base.y + Math.cos(runtime.t + i * 1.3) * vib,
        item.base.z
      );
    });
    return true;
  }

  if (mode === 'chem_benzene' && runtime.benzGrp) {
    runtime.benzGrp.scale.setScalar(p.scaleFactor);
    runtime.piMat.opacity = p.concentration * 0.75;
    if (active) {
      runtime.benzGrp.rotation.y += dt * 0.8 * p.spinRate;
      runtime.benzGrp.rotation.x = 0.42;
    }
    return true;
  }

  if (mode === 'bio_dna' && runtime.dnaGrp) {
    runtime.dnaGrp.scale.set(p.scaleFactor, p.concentration, p.scaleFactor);
    if (active) {
      runtime.dnaGrp.rotation.y += dt * 1.15 * p.spinRate;
    }
    return true;
  }

  if (mode === 'bio_cell' && runtime.cellGrp) {
    runtime.cellGrp.scale.setScalar(p.shapeRadius);
    if (active) {
      runtime.cellGrp.rotation.y += dt * 0.45 * p.spinRate;
      runtime.organelles.forEach((m: THREE.Mesh, i: number) => {
        m.rotation.x += dt * (0.4 + i * 0.1) * p.spinRate;
      });
    }
    return true;
  }

  if (mode === 'bio_rbc' && runtime.rbcGrp) {
    if (active) {
      runtime.t += dt * 1.8;
      runtime.rbcGrp.rotation.y += dt * 0.7 * p.spinRate;
    }
    runtime.rbcMesh.scale.setScalar(p.shapeRadius * 0.65);
    const boundCount = Math.round(p.concentration * runtime.o2Dots.length);
    runtime.o2Dots.forEach((dot: THREE.Mesh, idx: number) => {
      const ang = (idx / runtime.o2Dots.length) * Math.PI * 2 + runtime.t * 0.5;
      const isBound = idx < boundCount;
      const orbitR = isBound ? 1.1 * p.shapeRadius : 2.3;
      dot.position.set(
        Math.cos(ang) * orbitR,
        Math.sin(runtime.t + idx) * (isBound ? 0.35 : 1.1),
        Math.sin(ang) * orbitR
      );
    });
    return true;
  }

  if (mode === 'bio_mitochondria' && runtime.mitoGrp) {
    if (active) {
      runtime.t += dt * p.concentration * 2.5;
      runtime.rotor.rotation.y += dt * p.spinRate * p.concentration * 4.5;
      runtime.mitoGrp.rotation.y += dt * 0.25;
    }
    runtime.protons.forEach((h: THREE.Mesh, i: number) => {
      const u = ((runtime.t * 0.35 + i / runtime.protons.length) % 1);
      h.position.set((i - 6.5) * 0.25, -0.4 + u * 2.1, Math.sin(i * 1.3) * 0.5);
    });
    return true;
  }

  if (mode === 'bio_neuron' && runtime.pulse) {
    const vCond = Math.sqrt(p.shapeRadius) * (1 + (p.temperature - 300) * 0.01);
    runtime.axon.scale.set(p.shapeRadius, 1, p.shapeRadius);
    if (active) {
      runtime.u = (runtime.u + dt * p.waveFreq * vCond * 0.45) % 1;
    }
    const px = -3.6 + runtime.u * 7.8;
    runtime.pulse.position.x = px;
    return true;
  }

  return false;
}
