import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Play, Pause, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import {
  DEFAULT_SIM_PARAMS,
  SIM_TABS,
  SimCategory,
  SimMode,
  SimParams,
  computeSimTelemetry,
} from '../utils/threeLabCatalog';
import {
  buildExtendedSimScene,
  makeArrowGroup,
  orientArrow,
  updateExtendedSimScene,
} from '../utils/threeLabBuilders';

const CATEGORY_OPTIONS: { id: SimCategory; label: string }[] = [
  { id: 'all', label: 'All 3D Models (29)' },
  { id: 'physics', label: 'Physics (13)' },
  { id: 'math', label: 'Math 3D Shapes (6)' },
  { id: 'chemistry', label: 'Chemistry 3D (5)' },
  { id: 'biology', label: 'Biology 3D (5)' },
];

export const ThreePhysicsLabView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<SimCategory>('all');
  const [simMode, setSimMode] = useState<SimMode>('circular');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [controlsOpen, setControlsOpen] = useState<boolean>(true);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [resetSeed, setResetSeed] = useState<number>(0);

  const [params, setParams] = useState<SimParams>(DEFAULT_SIM_PARAMS);

  const paramsRef = useRef(params);
  paramsRef.current = params;
  const simModeRef = useRef(simMode);
  simModeRef.current = simMode;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const visibleTabs =
    categoryFilter === 'all'
      ? SIM_TABS
      : SIM_TABS.filter((tab) => tab.category === categoryFilter);

  const handleSelectCategory = (cat: SimCategory) => {
    setCategoryFilter(cat);
    if (cat !== 'all') {
      const currentTab = SIM_TABS.find((t) => t.id === simMode);
      if (!currentTab || currentTab.category !== cat) {
        const firstInCat = SIM_TABS.find((t) => t.category === cat);
        if (firstInCat) setSimMode(firstInCat.id);
      }
    }
  };

  // Deterministic live telemetry derived from physics, math, chemistry & biology equations
  const telemetry = computeSimTelemetry(simMode, params);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 460;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch {
      setContextLost(true);
      return;
    }

    // GPU Software Renderer Probe (SwiftShader / llvmpipe)
    let isSoftwareGl = false;
    try {
      const gl = renderer.getContext();
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const rStr = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
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
    renderer.toneMappingExposure = 1.05;
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
    scene.fog = new THREE.FogExp2('#090D14', 0.025);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(6.5, 5.2, 8.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 3.0;
    controls.maxDistance = 26;
    controls.maxPolarAngle = Math.PI * 0.49;

    // Three-Point Studio Lighting
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.6);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.2);
    keyLight.position.set(7, 11, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    rimLight.position.set(-8, 6, -6);
    scene.add(rimLight);

    // Laboratory Ground Plane + Grid
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.1 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const gridHelper = new THREE.GridHelper(24, 24, 0x22c55e, 0x1e293b);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Simulation Root Group
    const simGroup = new THREE.Group();
    scene.add(simGroup);

    const clearSimGroup = () => {
      while (simGroup.children.length > 0) {
        const child = simGroup.children.pop()!;
        simGroup.remove(child);
        child.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
            else obj.material.dispose();
          }
        });
      }
    };

    // Mutable runtime handles updated inside animation loop without allocations
    const runtime: Record<string, any> = {};
    const _vA = new THREE.Vector3();
    const _vB = new THREE.Vector3();

    // Build Composite 3D Rig per Selected Mode
    const buildSimulationScene = (mode: SimMode) => {
      clearSimGroup();
      Object.keys(runtime).forEach((k) => delete runtime[k]);

      if (buildExtendedSimScene(mode, simGroup, runtime, isSoftwareGl)) {
        return;
      }

      if (mode === 'circular') {
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(0.55, 0.7, 0.4, 24),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.35 })
        );
        base.position.y = 0.2;
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.14, 1.4, 16),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.25 })
        );
        post.position.y = 1.1;
        const hub = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 20, 20),
          new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.5, roughness: 0.3 })
        );
        hub.position.y = 1.8;

        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 1, 12),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.2 })
        );
        arm.rotation.z = Math.PI / 2;

        const bobGrp = new THREE.Group();
        const bobCore = new THREE.Mesh(
          new THREE.SphereGeometry(0.36, 28, 28),
          new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.4, roughness: 0.25 })
        );
        const bobRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.42, 0.05, 12, 32),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.2 })
        );
        bobRing.rotation.x = Math.PI / 2;
        bobGrp.add(bobCore, bobRing);

        const orbitRing = new THREE.Mesh(
          new THREE.TorusGeometry(1, 0.02, 8, 64),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 })
        );
        orbitRing.rotation.x = Math.PI / 2;
        orbitRing.position.y = 1.8;

        const forceArrow = makeArrowGroup(0xf43f5e);
        const velArrow = makeArrowGroup(0x38bdf8);

        simGroup.add(base, post, hub, arm, bobGrp, orbitRing, forceArrow, velArrow);
        runtime.arm = arm;
        runtime.bobGrp = bobGrp;
        runtime.orbitRing = orbitRing;
        runtime.forceArrow = forceArrow;
        runtime.velArrow = velArrow;
        runtime.theta = 0;
      } else if (mode === 'projectile') {
        const pad = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.25, 1.4),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.4 })
        );
        pad.position.set(-5, 0.125, 0);

        const barrelGrp = new THREE.Group();
        barrelGrp.position.set(-5, 0.45, 0);
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.22, 1.3, 20),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.25 })
        );
        barrel.rotation.z = -Math.PI / 2;
        barrel.position.x = 0.55;
        barrelGrp.add(barrel);

        const projectile = new THREE.Mesh(
          new THREE.SphereGeometry(0.26, 24, 24),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.3, roughness: 0.35 })
        );

        const pts = Array.from({ length: 48 }, () => new THREE.Vector3());
        const trailGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const trailLine = new THREE.Line(
          trailGeo,
          new THREE.LineBasicMaterial({ color: 0x22c55e })
        );

        simGroup.add(pad, barrelGrp, projectile, trailLine);
        runtime.barrelGrp = barrelGrp;
        runtime.projectile = projectile;
        runtime.trailLine = trailLine;
        runtime.t = 0;
      } else if (mode === 'gravity') {
        const planet = new THREE.Mesh(
          new THREE.SphereGeometry(1.15, 36, 36),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45, metalness: 0.15 })
        );
        planet.position.y = 2.0;

        const atmo = new THREE.Mesh(
          new THREE.SphereGeometry(1.26, 32, 32),
          new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.18,
            roughness: 0.2,
          })
        );
        atmo.position.y = 2.0;

        const satGrp = new THREE.Group();
        const satBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.35, 0.35),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.75, roughness: 0.25 })
        );
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.6, roughness: 0.2 });
        const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.28), wingMat);
        wingL.position.x = -0.58;
        const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.28), wingMat);
        wingR.position.x = 0.58;
        satGrp.add(satBody, wingL, wingR);

        const orbitPath = new THREE.Mesh(
          new THREE.TorusGeometry(1, 0.018, 8, 72),
          new THREE.MeshStandardMaterial({ color: 0x22c55e })
        );
        orbitPath.rotation.x = Math.PI / 2;
        orbitPath.position.y = 2.0;

        const gravArrow = makeArrowGroup(0xf43f5e);
        simGroup.add(planet, atmo, satGrp, orbitPath, gravArrow);
        runtime.satGrp = satGrp;
        runtime.orbitPath = orbitPath;
        runtime.gravArrow = gravArrow;
        runtime.planetPos = planet.position;
        runtime.angle = 0;
      } else if (mode === 'forces') {
        const rampGrp = new THREE.Group();
        rampGrp.position.set(-3, 0, 0);

        const plank = new THREE.Mesh(
          new THREE.BoxGeometry(7.2, 0.22, 2.2),
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55, metalness: 0.2 })
        );
        plank.position.set(3.4, 0.11, 0);

        const blockGrp = new THREE.Group();
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 0.7, 0.95),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.2 })
        );
        crate.position.y = 0.57;
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 0.12, 0.75),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
        );
        cap.position.y = 0.95;
        blockGrp.add(crate, cap);

        const normArrow = makeArrowGroup(0x22c55e);
        const slideArrow = makeArrowGroup(0x38bdf8);
        const fricArrow = makeArrowGroup(0xf43f5e);

        rampGrp.add(plank, blockGrp, normArrow, slideArrow, fricArrow);
        simGroup.add(rampGrp);
        runtime.rampGrp = rampGrp;
        runtime.blockGrp = blockGrp;
        runtime.normArrow = normArrow;
        runtime.slideArrow = slideArrow;
        runtime.fricArrow = fricArrow;
        runtime.s = 6.2;
        runtime.v = 0;
      } else if (mode === 'waves') {
        const segX = 48;
        const segZ = 24;
        const geo = new THREE.PlaneGeometry(10, 5, segX, segZ);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x0ea5e9,
          wireframe: false,
          roughness: 0.25,
          metalness: 0.45,
          side: THREE.DoubleSide,
        });
        const waveMesh = new THREE.Mesh(geo, mat);
        waveMesh.position.y = 1.8;

        const wire = new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true, transparent: true, opacity: 0.35 })
        );
        wire.position.y = 1.805;

        simGroup.add(waveMesh, wire);
        runtime.waveGeo = geo;
        runtime.phase = 0;
      } else if (mode === 'electricity') {
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(8, 0.25, 4.4),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
        );
        board.position.y = 0.125;
        simGroup.add(board);

        const coilMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 });
        for (let i = -3; i <= 3; i++) {
          const turn = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 14, 32), coilMat);
          turn.position.set(i * 0.55, 1.4, 0);
          turn.rotation.y = Math.PI / 2;
          simGroup.add(turn);
        }

        const charges: THREE.Mesh[] = [];
        const chargeMat = new THREE.MeshStandardMaterial({
          color: 0x22c55e,
          emissive: 0x16a34a,
          emissiveIntensity: 0.6,
        });
        for (let i = 0; i < 16; i++) {
          const ch = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), chargeMat);
          simGroup.add(ch);
          charges.push(ch);
        }

        const bArrow = makeArrowGroup(0x38bdf8);
        bArrow.position.set(-2.3, 1.4, 0);
        bArrow.rotation.z = -Math.PI / 2;
        simGroup.add(bArrow);

        runtime.charges = charges;
        runtime.bArrow = bArrow;
        runtime.flowOffset = 0;
      } else if (mode === 'energy') {
        const standBase = new THREE.Mesh(
          new THREE.BoxGeometry(4, 0.22, 2.2),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.4 })
        );
        standBase.position.y = 0.11;

        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.25 });
        const pLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.4, 16), pillarMat);
        pLeft.position.set(-1.6, 2.7, 0);
        const pRight = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.4, 16), pillarMat);
        pRight.position.set(1.6, 2.7, 0);
        const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.6, 16), pillarMat);
        topBar.rotation.z = Math.PI / 2;
        topBar.position.y = 5.4;

        const pivotGrp = new THREE.Group();
        pivotGrp.position.set(0, 5.4, 0);

        const rod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, 1, 12),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7 })
        );
        const bob = new THREE.Mesh(
          new THREE.SphereGeometry(0.38, 28, 28),
          new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.6, roughness: 0.25 })
        );
        pivotGrp.add(rod, bob);
        simGroup.add(standBase, pLeft, pRight, topBar, pivotGrp);

        runtime.pivotGrp = pivotGrp;
        runtime.rod = rod;
        runtime.bob = bob;
        runtime.t = 0;
      }
    };

    buildSimulationScene(simModeRef.current);

    let lastLoadedMode = simModeRef.current;
    let rafId = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (lastLoadedMode !== simModeRef.current) {
        lastLoadedMode = simModeRef.current;
        buildSimulationScene(lastLoadedMode);
      }

      const p = paramsRef.current;
      const mode = simModeRef.current;
      const active = isPlayingRef.current;

      if (!updateExtendedSimScene(mode, runtime, p, dt, active)) {
        if (mode === 'circular' && runtime.bobGrp) {
          if (active) runtime.theta += p.omega * dt;
          const r = Math.min(4.6, Math.max(1.2, p.radius));
          const x = Math.cos(runtime.theta) * r;
          const z = Math.sin(runtime.theta) * r;
          runtime.bobGrp.position.set(x, 1.8, z);
          runtime.arm.position.set(x / 2, 1.8, z / 2);
          runtime.arm.scale.set(1, r, 1);
          runtime.arm.rotation.set(0, -runtime.theta, Math.PI / 2);
          runtime.orbitRing.scale.set(r, r, 1);

          _vA.set(x, 1.8, z);
          _vB.set(-x, 0, -z);
          orientArrow(runtime.forceArrow, _vA, _vB, (p.mass * p.omega * p.omega * r) / 28);
          _vB.set(-Math.sin(runtime.theta), 0, Math.cos(runtime.theta));
          orientArrow(runtime.velArrow, _vA, _vB, (p.omega * r) / 4);
        } else if (mode === 'projectile' && runtime.projectile) {
          const rad = (p.angleDeg * Math.PI) / 180;
          const vx = p.speed * Math.cos(rad);
          const vy = p.speed * Math.sin(rad);
          const tof = Math.max(0.2, (2 * vy) / p.gravity);
          const range = vx * tof;
          const scale = Math.min(0.45, 10 / Math.max(10, range));

          if (active) {
            runtime.t = (runtime.t + dt) % (tof + 0.5);
          }
          const tCur = Math.min(tof, runtime.t);
          const px = -5 + vx * tCur * scale;
          const py = Math.max(0.25, 0.45 + (vy * tCur - 0.5 * p.gravity * tCur * tCur) * scale);
          runtime.projectile.position.set(px, py, 0);
          runtime.barrelGrp.rotation.z = rad;

          const posAttr = runtime.trailLine.geometry.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < 48; i++) {
            const ti = (i / 47) * tof;
            posAttr.setXYZ(
              i,
              -5 + vx * ti * scale,
              Math.max(0.1, 0.45 + (vy * ti - 0.5 * p.gravity * ti * ti) * scale),
              0
            );
          }
          posAttr.needsUpdate = true;
        } else if (mode === 'gravity' && runtime.satGrp) {
          const r = Math.min(5.5, Math.max(2.0, p.orbitRadius));
          const speed = Math.sqrt((p.centralMass * 4.5) / r) * 0.25;
          if (active) runtime.angle += speed * dt;
          const sx = Math.cos(runtime.angle) * r;
          const sz = Math.sin(runtime.angle) * r;
          runtime.satGrp.position.set(sx, 2.0, sz);
          runtime.satGrp.lookAt(0, 2.0, 0);
          runtime.orbitPath.scale.set(r, r, 1);

          _vA.set(sx, 2.0, sz);
          _vB.set(-sx, 0, -sz);
          orientArrow(runtime.gravArrow, _vA, _vB, (p.centralMass * 2.5) / (r * r));
        } else if (mode === 'forces' && runtime.rampGrp) {
          const rad = (p.inclineDeg * Math.PI) / 180;
          runtime.rampGrp.rotation.z = rad;
          const acc = p.gravity * (Math.sin(rad) - p.frictionMu * Math.cos(rad));
          if (active) {
            if (acc > 0) {
              runtime.v += acc * dt * 0.65;
              runtime.s -= runtime.v * dt;
              if (runtime.s < 0.7) {
                runtime.s = 6.2;
                runtime.v = 0;
              }
            }
          }
          runtime.blockGrp.position.set(runtime.s, 0, 0);
          _vA.set(runtime.s, 0.6, 0);
          orientArrow(runtime.normArrow, _vA, _vB.set(0, 1, 0), 1.3);
          orientArrow(runtime.slideArrow, _vA, _vB.set(-1, 0, 0), Math.sin(rad) * 2.2);
          orientArrow(runtime.fricArrow, _vA, _vB.set(1, 0, 0), Math.min(2.0, p.frictionMu * 2.5));
        } else if (mode === 'waves' && runtime.waveGeo) {
          if (active) runtime.phase += dt * p.waveFreq * Math.PI * 2;
          const pos = runtime.waveGeo.attributes.position as THREE.BufferAttribute;
          const k = (Math.PI * 2) / p.wavelength;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const y = p.waveAmp * Math.sin(k * x - runtime.phase) * Math.cos(z * 0.35);
            pos.setY(i, y);
          }
          pos.needsUpdate = true;
          runtime.waveGeo.computeVertexNormals();
        } else if (mode === 'electricity' && runtime.charges) {
          const current = p.voltage / Math.max(0.5, p.resistance);
          if (active) runtime.flowOffset += current * dt * 0.35;
          runtime.charges.forEach((ch: THREE.Mesh, idx: number) => {
            const u = ((idx / runtime.charges.length) + runtime.flowOffset) % 1;
            const ang = u * Math.PI * 2 * 6;
            const x = -1.65 + u * 3.3;
            ch.position.set(x, 1.4 + Math.sin(ang) * 0.85, Math.cos(ang) * 0.85);
          });
          runtime.bArrow.scale.set(1, Math.min(4.6, 0.8 + p.magneticField * current * 0.25), 1);
        } else if (mode === 'energy' && runtime.pivotGrp) {
          const len = Math.min(4.4, Math.max(1.8, p.pendulumLen));
          const omegaP = Math.sqrt(p.gravity / len);
          if (active) runtime.t += dt;
          const theta0 = (p.pendulumDeg * Math.PI) / 180;
          const theta = theta0 * Math.cos(omegaP * runtime.t);
          runtime.pivotGrp.rotation.z = theta;
          runtime.rod.scale.set(1, len, 1);
          runtime.rod.position.y = -len / 2;
          runtime.bob.position.y = -len;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        rafId = window.setTimeout(() => {
          rafId = requestAnimationFrame(animate);
        }, 45) as any;
      } else {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      window.clearTimeout(rafId);
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
      clearSimGroup();
      floorGeo.dispose();
      floorMat.dispose();
      envRT.dispose();
      controls.dispose();
      renderer.dispose();
    };
  }, [resetSeed]);

  const activeTabInfo = SIM_TABS.find((t) => t.id === simMode) || SIM_TABS[0];

  return (
    <div className="space-y-5">
      {/* Subject Filter & 3D Shape Selector Ribbon */}
      <section className="rounded-2xl border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#0A0A0A] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Interactive 3D Physics, Math, Chemistry & Biology Studio
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#A1A1AA]">
              Explore 29 interactive 3D models with live formulas — drag to orbit 360°, pinch to zoom, and tune variables.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPlaying((v) => !v)}
              className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              type="button"
              onClick={() => setResetSeed((s) => s + 1)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#27272A] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#18181B] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Camera</span>
            </button>
          </div>
        </div>

        {/* Subject Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-[#27272A]">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 mb-2 ${
                categoryFilter === cat.id
                  ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/40'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#18181B]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sideways-Scrollable / Wrapped 3D Shape Selector */}
        <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSimMode(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                simMode === tab.id
                  ? 'bg-[#22C55E] text-white font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-[#18181B] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-[#27272A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3D Viewport Container */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-[#27272A] bg-[#090D14] overflow-hidden">
        {/* Top Formula & Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0D131D] border-b border-white/10">
          <div className="space-y-1 max-w-full overflow-x-auto">
            <div className="text-[11px] font-semibold text-slate-400">
              {activeTabInfo.label} · {activeTabInfo.description}
            </div>
            <div className="overflow-x-auto max-w-full">
              <MathRenderer content={`$$${activeTabInfo.formula}$$`} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {telemetry.map((m) => (
              <div key={m.label} className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">{m.label}</div>
                <div className="text-sm font-mono font-bold tabular-nums text-[#22C55E]">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WebGL Mount */}
        {contextLost ? (
          <div className="h-[440px] flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
            <p className="text-sm font-semibold">3D WebGL viewport was suspended by the browser.</p>
            <button
              type="button"
              onClick={() => {
                setContextLost(false);
                setResetSeed((s) => s + 1);
              }}
              className="px-4 py-2 rounded-xl bg-[#22C55E] text-white text-xs font-bold cursor-pointer"
            >
              Restore 3D Viewport
            </button>
          </div>
        ) : (
          <div ref={mountRef} className="w-full h-[400px] sm:h-[480px]" />
        )}

        {/* Collapsible Parameter Dock */}
        <div className="bg-[#0D131D] border-t border-white/10 text-white">
          <button
            type="button"
            onClick={() => setControlsOpen((o) => !o)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-200 hover:bg-white/5 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Simulation Variables ({activeTabInfo.label})</span>
            </span>
            {controlsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {controlsOpen && (
            <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {activeTabInfo.sliders.map((slider) => (
                <SliderField
                  key={slider.key}
                  label={slider.label}
                  unit={slider.unit}
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={params[slider.key]}
                  onChange={(v) => setParams((prev) => ({ ...prev, [slider.key]: v }))}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SliderField: React.FC<{
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
}> = ({ label, unit, min, max, step, value, onChange }) => (
  <label className="block space-y-1.5">
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-300 font-medium">{label}</span>
      <span className="font-mono font-bold tabular-nums text-[#22C55E]">
        {value} {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-[#22C55E] cursor-pointer"
    />
  </label>
);
