/* ─────────────────────────────────────────────────────────
   V8 — "THE CORE" · Live Infrastructure Portfolio
   Three.js r128 · Vanilla JS · no build step
   ───────────────────────────────────────────────────────── */

(() => {
  'use strict';

  // ───────────────────────────────────────────────────────
  //   0. UTILITIES
  // ───────────────────────────────────────────────────────
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // inOutCubic
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // ───────────────────────────────────────────────────────
  //   1. BOOT SEQUENCE
  // ───────────────────────────────────────────────────────
  const bootLog = $('#bootLog');
  const bootBar = $('#bootBarFill');
  const bootEl = $('#boot');

  const bootLines = [
    { t: 0,    cls: 'dim',  text: '> init vg.os kernel v8.0.1 ...' },
    { t: 120,  cls: 'ok',   text: '[ OK ] kernel loaded' },
    { t: 200,  cls: 'dim',  text: '> mount /dev/redis@0 ...' },
    { t: 320,  cls: 'ok',   text: '[ OK ] redis cluster online · 5k events/sec' },
    { t: 360,  cls: 'dim',  text: '> mount /dev/kafka@0 ...' },
    { t: 460,  cls: 'ok',   text: '[ OK ] kafka brokers synced' },
    { t: 500,  cls: 'dim',  text: '> open /multi-cloud-router ...' },
    { t: 620,  cls: 'hi',   text: '[ RT ] aws · gcp · azure handshake complete' },
    { t: 660,  cls: 'dim',  text: '> spawn vishwakarma sre daemon ...' },
    { t: 780,  cls: 'ok',   text: '[ OK ] 16 parallel investigators armed' },
    { t: 820,  cls: 'dim',  text: '> warmup gtfs in-memory cache ...' },
    { t: 950,  cls: 'ok',   text: '[ OK ] hot-path preload · 5k req/sec ready' },
    { t: 990,  cls: 'dim',  text: '> boot portfolio.render.three ...' },
    { t: 1150, cls: 'hi',   text: '> THE CORE IS LIVE · SCROLL TO NAVIGATE' }
  ];

  function runBoot(onDone) {
    if (prefersReducedMotion) {
      bootEl.classList.add('is-done');
      if (bootBar) bootBar.style.width = '100%';
      setTimeout(onDone, 100);
      return;
    }
    const total = bootLines[bootLines.length - 1].t + 600;
    bootLines.forEach((line) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = line.cls;
        div.textContent = line.text;
        bootLog.appendChild(div);
        bootLog.scrollTop = bootLog.scrollHeight;
        bootBar.style.width = `${Math.min(100, (line.t / total) * 100)}%`;
      }, line.t);
    });
    setTimeout(() => {
      bootBar.style.width = '100%';
      setTimeout(() => {
        bootEl.classList.add('is-done');
        onDone();
      }, 380);
    }, total);
  }

  // ───────────────────────────────────────────────────────
  //   2. CUSTOM CURSOR
  // ───────────────────────────────────────────────────────
  const cursorEl = $('#cursor');
  const cursorLabel = $('#cursorLabel');

  if (!isTouch && cursorEl) {
    const cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2, tx: 0, ty: 0 };
    const dot = cursorEl.querySelector('.cursor-dot');
    const ring = cursorEl.querySelector('.cursor-ring');

    document.addEventListener('mousemove', (e) => {
      cursor.tx = e.clientX;
      cursor.ty = e.clientY;
    });

    document.addEventListener('mousedown', () => cursorEl.classList.add('is-click'));
    document.addEventListener('mouseup',   () => cursorEl.classList.remove('is-click'));

    // hover magnet on interactive elements
    const hoverables = 'a, button, input, textarea, select, [data-magnet], .chip, .tag, .panel, .hud-link, .rail-tick';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverables)) {
        cursorEl.classList.add('is-hover');
        const label = e.target.closest('[data-cursor]')?.dataset.cursor;
        if (label) {
          cursorLabel.textContent = label;
          cursorEl.classList.add('is-labeled');
        }
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverables)) {
        cursorEl.classList.remove('is-hover', 'is-labeled');
      }
    });

    const tick = () => {
      cursor.x = lerp(cursor.x, cursor.tx, 0.22);
      cursor.y = lerp(cursor.y, cursor.ty, 0.22);
      if (dot) {
        dot.style.left = `${cursor.tx}px`;
        dot.style.top  = `${cursor.ty}px`;
      }
      if (ring) {
        ring.style.left = `${cursor.x}px`;
        ring.style.top  = `${cursor.y}px`;
      }
      if (cursorLabel) {
        cursorLabel.style.left = `${cursor.tx}px`;
        cursorLabel.style.top  = `${cursor.ty}px`;
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  // ───────────────────────────────────────────────────────
  //   3. THREE.JS SCENE — "THE CORE"
  // ───────────────────────────────────────────────────────
  const canvas = $('#bgCanvas');

  let renderer, scene, camera;
  let core, coreInner, coreWire, coreRings = [];
  let nodes = [];
  let starField, gridFloor;
  let flowParticles, flowPositions, flowVel, flowTargets, flowLife;
  const FLOW_COUNT = 1800;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const clock = new THREE.Clock();
  let renderLoopId = null;

  // service node spec — colors + shapes tied to real infra
  const NODES = [
    { name: 'Redis',       color: 0xff3d9a, shape: 'octa',  size: 0.95, speed: 0.35, phase: 0.0 },
    { name: 'Kafka',       color: 0x00f5ff, shape: 'dodec', size: 1.05, speed: 0.28, phase: 0.7 },
    { name: 'Postgres',    color: 0x8affa5, shape: 'icos',  size: 0.95, speed: 0.42, phase: 1.4 },
    { name: 'ClickHouse',  color: 0xffcc4d, shape: 'octa',  size: 0.85, speed: 0.32, phase: 2.1 },
    { name: 'AWS',         color: 0xff9933, shape: 'cube',  size: 1.00, speed: 0.25, phase: 2.8 },
    { name: 'GCP',         color: 0x4f8cff, shape: 'cube',  size: 0.95, speed: 0.38, phase: 3.5 },
    { name: 'Haskell',     color: 0xb685ff, shape: 'icos',  size: 1.10, speed: 0.22, phase: 4.2 },
    { name: 'Kubernetes',  color: 0x3c6cf0, shape: 'dodec', size: 0.95, speed: 0.45, phase: 4.9 },
    { name: 'Prometheus',  color: 0xff6b3c, shape: 'icos',  size: 0.80, speed: 0.30, phase: 5.6 }
  ];

  function createShape(type) {
    switch (type) {
      case 'octa':  return new THREE.OctahedronGeometry(1, 0);
      case 'dodec': return new THREE.DodecahedronGeometry(1, 0);
      case 'icos':  return new THREE.IcosahedronGeometry(1, 0);
      case 'cube':  return new THREE.BoxGeometry(1.4, 1.4, 1.4);
      default:      return new THREE.TetrahedronGeometry(1, 0);
    }
  }

  function initThree() {
    if (!canvas || typeof THREE === 'undefined') return false;

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !prefersReducedMotion,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04040a, 0.018);

    camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    camera.position.set(0, 1.2, 17);
    camera.lookAt(0, 0, 0);

    // ── lights ──
    scene.add(new THREE.AmbientLight(0x1a1b35, 1.1));

    const cyanLight = new THREE.PointLight(0x00f5ff, 2.4, 40);
    cyanLight.position.set(8, 6, 8);
    scene.add(cyanLight);

    const magentaLight = new THREE.PointLight(0xff3d9a, 1.8, 40);
    magentaLight.position.set(-10, -4, -6);
    scene.add(magentaLight);

    const amberLight = new THREE.PointLight(0xffcc4d, 1.0, 30);
    amberLight.position.set(0, -8, 6);
    scene.add(amberLight);

    // ── THE CORE ──
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);
    core = coreGroup;

    // inner emissive sphere
    const innerGeo = new THREE.IcosahedronGeometry(1.4, 2);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x0a1a3a,
      emissive: 0x00a0ff,
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0.7,
      flatShading: true
    });
    coreInner = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(coreInner);

    // outer wire shell
    const wireGeo = new THREE.IcosahedronGeometry(2.3, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });
    coreWire = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(coreWire);

    // outer filament shell (magenta)
    const wire2Geo = new THREE.IcosahedronGeometry(3.2, 2);
    const wire2Mat = new THREE.MeshBasicMaterial({
      color: 0xff3d9a,
      wireframe: true,
      transparent: true,
      opacity: 0.14
    });
    const wire2 = new THREE.Mesh(wire2Geo, wire2Mat);
    coreGroup.add(wire2);

    // orbital rings around core (3 tilted torus)
    const ringData = [
      { r: 4.2, tube: 0.02, tilt: [0.3, 0.1, 0.0], color: 0x00f5ff, opacity: 0.45 },
      { r: 5.0, tube: 0.015, tilt: [0.7, -0.3, 0.2], color: 0xff3d9a, opacity: 0.35 },
      { r: 5.8, tube: 0.012, tilt: [-0.4, 0.5, -0.2], color: 0xffcc4d, opacity: 0.28 }
    ];
    ringData.forEach(rd => {
      const rg = new THREE.TorusGeometry(rd.r, rd.tube, 12, 200);
      const rm = new THREE.MeshBasicMaterial({
        color: rd.color,
        transparent: true,
        opacity: rd.opacity
      });
      const ring = new THREE.Mesh(rg, rm);
      ring.rotation.set(rd.tilt[0], rd.tilt[1], rd.tilt[2]);
      coreGroup.add(ring);
      coreRings.push(ring);
    });

    // ── ORBITAL SERVICE NODES ──
    nodes = [];
    NODES.forEach((spec, i) => {
      const group = new THREE.Group();

      // solid + wire combo for each node
      const solidMat = new THREE.MeshStandardMaterial({
        color: 0x181833,
        emissive: spec.color,
        emissiveIntensity: 0.55,
        roughness: 0.4,
        metalness: 0.6,
        flatShading: true
      });
      const solid = new THREE.Mesh(createShape(spec.shape).scale(spec.size, spec.size, spec.size), solidMat);
      group.add(solid);

      const wireMat = new THREE.MeshBasicMaterial({
        color: spec.color,
        wireframe: true,
        transparent: true,
        opacity: 0.7
      });
      const wire = new THREE.Mesh(createShape(spec.shape).scale(spec.size * 1.15, spec.size * 1.15, spec.size * 1.15), wireMat);
      group.add(wire);

      // subtle point light for glow
      const glow = new THREE.PointLight(spec.color, 0.8, 6);
      group.add(glow);

      scene.add(group);
      nodes.push({ group, solid, wire, spec, baseOrbit: 7.2 + (i % 3) * 0.8, tilt: (Math.sin(i) * 0.5) });
    });

    // ── STARFIELD ──
    const starCount = prefersReducedMotion ? 1200 : 3500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColor = new Float32Array(starCount * 3);
    const palette = [
      [1.0, 1.0, 1.0],
      [0.0, 0.96, 1.0],
      [1.0, 0.24, 0.6],
      [1.0, 0.8, 0.3]
    ];
    for (let i = 0; i < starCount; i++) {
      const r = 60 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i*3+0] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i*3+2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)];
      starColor[i*3+0] = c[0];
      starColor[i*3+1] = c[1];
      starColor[i*3+2] = c[2];
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColor, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // ── GRID FLOOR ──
    const grid = new THREE.GridHelper(120, 60, 0x00f5ff, 0x122040);
    grid.position.y = -10;
    grid.material.transparent = true;
    grid.material.opacity = 0.18;
    grid.material.depthWrite = false;
    gridFloor = grid;
    scene.add(grid);

    // ── DATA FLOW PARTICLES (core <-> nodes) ──
    const flowCount = prefersReducedMotion ? 600 : FLOW_COUNT;
    const fGeo = new THREE.BufferGeometry();
    flowPositions = new Float32Array(flowCount * 3);
    flowVel = new Float32Array(flowCount * 3);
    flowTargets = new Int16Array(flowCount);      // which node index they target (-1 = core)
    flowLife = new Float32Array(flowCount);
    const fColor = new Float32Array(flowCount * 3);
    for (let i = 0; i < flowCount; i++) {
      spawnFlow(i, fColor);
    }
    fGeo.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));
    fGeo.setAttribute('color', new THREE.BufferAttribute(fColor, 3));
    const fMat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    flowParticles = new THREE.Points(fGeo, fMat);
    flowParticles.userData.colorBuffer = fColor;
    scene.add(flowParticles);

    // ── RESIZE ──
    window.addEventListener('resize', onResize, { passive: true });
    return true;
  }

  function spawnFlow(i, colorBuf) {
    // decide direction: 70% core→node (outbound), 30% node→core (inbound)
    const outbound = Math.random() < 0.7;
    const nodeIdx = Math.floor(Math.random() * NODES.length);
    flowTargets[i] = outbound ? nodeIdx : -(nodeIdx + 100);  // encoded: -100-idx means "inbound"
    flowLife[i] = Math.random() * 0.6;

    // spawn at source
    if (outbound) {
      flowPositions[i*3+0] = (Math.random() - 0.5) * 0.6;
      flowPositions[i*3+1] = (Math.random() - 0.5) * 0.6;
      flowPositions[i*3+2] = (Math.random() - 0.5) * 0.6;
    } else {
      // spawn near the node position (we'll set exact position on first tick)
      flowPositions[i*3+0] = 0;
      flowPositions[i*3+1] = 0;
      flowPositions[i*3+2] = 0;
    }

    // color from node spec
    const spec = NODES[nodeIdx];
    const hex = spec.color;
    if (colorBuf) {
      colorBuf[i*3+0] = ((hex >> 16) & 255) / 255;
      colorBuf[i*3+1] = ((hex >> 8) & 255) / 255;
      colorBuf[i*3+2] = (hex & 255) / 255;
    }
  }

  function onResize() {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  // ───────────────────────────────────────────────────────
  //   4. CAMERA CHOREOGRAPHY (scroll-driven)
  // ───────────────────────────────────────────────────────
  // Each station has a camera "pose" — interpolated by scroll progress.
  // Total pages = number of stations; progress 0..1 across full doc scroll.
  const KEYFRAMES = [
    // hero: centered on core, z out
    { pos: [0,   1.2,  17],  look: [0, 0, 0] },
    // about: tilt up + orbit around
    { pos: [-8,  3.0,  13],  look: [0, 0.5, 0] },
    // stack: orbit to the side, closer
    { pos: [12,  1.5,  10],  look: [0, 0, -1] },
    // work: camera high, look down
    { pos: [4,   9.0,  12],  look: [0, -1, 0] },
    // builds: pull back diagonal
    { pos: [-14, 4.0,  -6],  look: [0, 1, 0] },
    // education: far + wide
    { pos: [9,   2.0,  -14], look: [0, 0, 0] },
    // contact: extreme close to core
    { pos: [0,   0.5,  7],   look: [0, 0, 0] }
  ];
  const STATIONS = ['HERO', 'ABOUT', 'STACK', 'WORK', 'BUILDS', 'EDU', 'CONTACT'];

  // compute scroll progress
  function scrollProgress() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    if (docH <= 0) return 0;
    return clamp(window.scrollY / docH, 0, 1);
  }

  // interpolate pose
  const tmpFrom = new THREE.Vector3();
  const tmpTo = new THREE.Vector3();
  const tmpLookFrom = new THREE.Vector3();
  const tmpLookTo = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();

  function applyCameraFromScroll() {
    const p = scrollProgress();
    const segs = KEYFRAMES.length - 1;
    const raw = p * segs;
    const idx = clamp(Math.floor(raw), 0, segs - 1);
    const t = ease(raw - idx);

    const a = KEYFRAMES[idx], b = KEYFRAMES[idx + 1];
    tmpFrom.fromArray(a.pos); tmpTo.fromArray(b.pos);
    tmpLookFrom.fromArray(a.look); tmpLookTo.fromArray(b.look);

    camPos.lerpVectors(tmpFrom, tmpTo, t);
    camLook.lerpVectors(tmpLookFrom, tmpLookTo, t);

    // mouse parallax
    const mouseInfluence = 0.8;
    camPos.x += mouse.x * mouseInfluence;
    camPos.y += -mouse.y * mouseInfluence * 0.5;

    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // update rail caption
    const activeIdx = Math.round(p * segs);
    const activeName = STATIONS[clamp(activeIdx, 0, STATIONS.length - 1)];
    if (railCaption.textContent !== activeName) railCaption.textContent = activeName;
  }

  // ───────────────────────────────────────────────────────
  //   5. ANIMATION LOOP
  // ───────────────────────────────────────────────────────
  let lastTime = performance.now();
  let fps = 60, fpsAccum = 0, fpsCount = 0;

  function render() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    const elapsed = clock.getElapsedTime();

    // fps
    fpsAccum += (1 / dt);
    fpsCount++;
    if (fpsCount >= 30) {
      fps = Math.round(fpsAccum / fpsCount);
      if (fpsEl) fpsEl.textContent = String(fps);
      fpsAccum = 0;
      fpsCount = 0;
    }

    // smooth mouse
    mouse.x = lerp(mouse.x, mouse.tx, 0.04);
    mouse.y = lerp(mouse.y, mouse.ty, 0.04);

    // core animation
    if (core) {
      core.rotation.y = elapsed * 0.15;
      core.rotation.x = Math.sin(elapsed * 0.1) * 0.15;
      const pulse = 1 + Math.sin(elapsed * 1.4) * 0.04;
      coreInner.scale.setScalar(pulse);
      coreWire.rotation.x = elapsed * 0.2;
      coreWire.rotation.z = elapsed * 0.1;
    }

    // orbital rings
    coreRings.forEach((r, i) => {
      r.rotation.z += dt * (0.2 + i * 0.15);
      r.rotation.x += dt * 0.05;
    });

    // node orbits
    nodes.forEach((n, i) => {
      const t = elapsed * n.spec.speed + n.spec.phase;
      const orbit = n.baseOrbit;
      n.group.position.x = Math.cos(t) * orbit;
      n.group.position.z = Math.sin(t) * orbit;
      n.group.position.y = Math.sin(t * 1.6 + n.tilt) * 1.4;
      n.group.rotation.x = elapsed * 0.5 + i;
      n.group.rotation.y = elapsed * 0.3 + i * 0.4;
    });

    // flow particles — fly from core to node (or reverse) along a bent path
    if (flowParticles) {
      const pos = flowPositions;
      const life = flowLife;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        life[i] += dt * 0.6;
        if (life[i] >= 1) {
          // respawn
          spawnFlow(i, flowParticles.userData.colorBuffer);
          flowParticles.geometry.attributes.color.needsUpdate = true;
        }
        const t = clamp(life[i], 0, 1);
        const target = flowTargets[i];
        const outbound = target >= 0;
        const nodeIdx = outbound ? target : (-target - 100);
        const node = nodes[nodeIdx];
        if (!node) continue;

        // interpolate with slight arc
        const sx = outbound ? 0 : node.group.position.x;
        const sy = outbound ? 0 : node.group.position.y;
        const sz = outbound ? 0 : node.group.position.z;
        const ex = outbound ? node.group.position.x : 0;
        const ey = outbound ? node.group.position.y : 0;
        const ez = outbound ? node.group.position.z : 0;

        const easeT = t * t * (3 - 2 * t);
        const arcLift = Math.sin(t * Math.PI) * 0.6;
        pos[i*3+0] = lerp(sx, ex, easeT);
        pos[i*3+1] = lerp(sy, ey, easeT) + arcLift;
        pos[i*3+2] = lerp(sz, ez, easeT);
      }
      flowParticles.geometry.attributes.position.needsUpdate = true;
    }

    // starfield slow rotation
    if (starField) {
      starField.rotation.y += dt * 0.008;
      starField.rotation.x += dt * 0.003;
    }

    // grid drift
    if (gridFloor) {
      gridFloor.position.z = ((elapsed * 1.2) % 4) - 2;
    }

    // apply camera choreography
    applyCameraFromScroll();

    // render
    renderer.render(scene, camera);
    renderLoopId = requestAnimationFrame(render);
  }

  // ───────────────────────────────────────────────────────
  //   6. HUD  — nav, rail, counters, stats
  // ───────────────────────────────────────────────────────
  const railContainer = $('#railTicks');
  const railCaption = $('#railCaption');
  const upTimeEl = $('#upTime');
  const fpsEl = $('#fpsCounter');
  const camCoordsEl = $('#camCoords');

  function buildRail() {
    if (!railContainer) return;
    railContainer.innerHTML = '';
    STATIONS.forEach((name, i) => {
      const tick = document.createElement('button');
      tick.className = 'rail-tick';
      tick.setAttribute('aria-label', `Jump to ${name}`);
      tick.dataset.section = name.toLowerCase() === 'edu' ? 'education' : name.toLowerCase();
      tick.addEventListener('click', () => {
        const id = tick.dataset.section;
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      railContainer.appendChild(tick);
    });
  }

  function updateRailActive() {
    const p = scrollProgress();
    const segs = STATIONS.length - 1;
    const activeIdx = Math.round(p * segs);
    railContainer?.querySelectorAll('.rail-tick').forEach((t, i) => {
      t.classList.toggle('is-active', i === activeIdx);
    });
    // nav active link
    const hudLinks = $$('.hud-link');
    hudLinks.forEach(link => {
      const sec = link.dataset.section;
      const idx = STATIONS.findIndex(s => {
        const id = s.toLowerCase() === 'edu' ? 'education' : s.toLowerCase();
        return id === sec;
      });
      link.classList.toggle('is-active', idx === activeIdx);
    });
    // camera coords
    if (camCoordsEl && camera) {
      camCoordsEl.textContent =
        `${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)}`;
    }
  }

  function startUptime() {
    const start = performance.now();
    const fmt = s => String(s).padStart(2, '0');
    setInterval(() => {
      const s = Math.floor((performance.now() - start) / 1000);
      const hh = fmt(Math.floor(s / 3600));
      const mm = fmt(Math.floor((s % 3600) / 60));
      const ss = fmt(s % 60);
      if (upTimeEl) upTimeEl.textContent = `${hh}:${mm}:${ss}`;
    }, 1000);
  }

  // ───────────────────────────────────────────────────────
  //   7. COUNTER ANIMATIONS (data-count)
  // ───────────────────────────────────────────────────────
  function animateCounter(el, target, duration = 1800) {
    const start = performance.now();
    const isFloat = target % 1 !== 0;
    const step = () => {
      const t = clamp((performance.now() - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = target * eased;
      if (target >= 1000) {
        el.textContent = Math.floor(val).toLocaleString('en-US');
      } else if (isFloat) {
        el.textContent = val.toFixed(1);
      } else {
        el.textContent = Math.floor(val).toString();
      }
      if (t < 1) requestAnimationFrame(step);
    };
    step();
  }

  function initCounters() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !e.target.dataset.counted) {
          const target = Number(e.target.dataset.count);
          if (!isNaN(target)) {
            e.target.dataset.counted = '1';
            animateCounter(e.target, target);
          }
        }
      });
    }, { threshold: 0.5 });
    $$('[data-count]').forEach(el => observer.observe(el));
  }

  // ───────────────────────────────────────────────────────
  //   8. SECTION REVEAL
  // ───────────────────────────────────────────────────────
  function initReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('is-visible');
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -12% 0px' });
    $$('.station').forEach(s => io.observe(s));
  }

  // ───────────────────────────────────────────────────────
  //   9. PORTFOLIO SWITCHER
  // ───────────────────────────────────────────────────────
  function initSwitcher() {
    const sel = $('#portfolioSwitcher');
    if (!sel) return;
    sel.addEventListener('change', (e) => {
      window.location.href = e.target.value;
    });
  }

  // ───────────────────────────────────────────────────────
  //   10. RESUME MODAL
  // ───────────────────────────────────────────────────────
  function initResumeModal() {
    const modal = $('#resumeModal');
    const opener = $('#resumeNavBtn');
    const closer = $('#resumeClose');
    if (!modal || !opener) return;

    const open = (e) => {
      if (e) e.preventDefault();
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      modal.classList.remove('is-open');
      setTimeout(() => {
        modal.hidden = true;
        document.body.style.overflow = '';
      }, 260);
    };
    opener.addEventListener('click', open);
    closer?.addEventListener('click', close);
    modal.querySelector('.modal-backdrop')?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  }

  // ───────────────────────────────────────────────────────
  //   11. CONTACT FORM (EmailJS optional)
  // ───────────────────────────────────────────────────────
  function initContactForm() {
    const form = $('#contactForm');
    const toast = $('#toast');
    if (!form) return;

    const showToast = (msg, isErr = false) => {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.toggle('is-error', isErr);
      toast.classList.add('is-show');
      setTimeout(() => toast.classList.remove('is-show'), 3400);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>Transmitting…</span>';

      const data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        subject: form.subject.value.trim() || '(no subject)',
        message: form.message.value.trim()
      };

      if (!data.name || !data.email || !data.message) {
        showToast('Missing required fields.', true);
        btn.disabled = false;
        btn.innerHTML = orig;
        return;
      }

      try {
        // If EmailJS is wired up by the user, use it; otherwise fallback to mailto.
        if (window.emailjs && typeof window.emailjs.send === 'function' && window.VG_EMAIL_CFG) {
          const { serviceId, templateId, publicKey } = window.VG_EMAIL_CFG;
          if (publicKey) window.emailjs.init(publicKey);
          await window.emailjs.send(serviceId, templateId, data);
          showToast('Transmission received. Acknowledged.');
          form.reset();
        } else {
          const mailto = `mailto:vijayrauniyar1818@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(`From: ${data.name} <${data.email}>\n\n${data.message}`)}`;
          window.location.href = mailto;
          showToast('Opening your mail client…');
        }
      } catch (err) {
        console.error(err);
        showToast('Transmission failed. Try again.', true);
      } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    });
  }

  // ───────────────────────────────────────────────────────
  //   12. AUDIO (ambient drone, WebAudio synth)
  // ───────────────────────────────────────────────────────
  function initAudio() {
    const btn = $('#audioToggle');
    if (!btn) return;
    let ctx, gain, oscA, oscB, lfoGain, filter;
    let isOn = false;

    const turnOn = () => {
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(ctx.destination);

        filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 900;
        filter.Q.value = 5;
        filter.connect(gain);

        oscA = ctx.createOscillator();
        oscA.type = 'sine';
        oscA.frequency.value = 55;   // A1
        oscA.connect(filter);
        oscA.start();

        oscB = ctx.createOscillator();
        oscB.type = 'triangle';
        oscB.frequency.value = 82.4; // E2
        oscB.connect(filter);
        oscB.start();

        // slow LFO on filter
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.08;
        lfoGain = ctx.createGain();
        lfoGain.gain.value = 200;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.2);
        isOn = true;
        btn.setAttribute('aria-pressed', 'true');
      } catch (e) { /* audio blocked */ }
    };

    const turnOff = () => {
      if (!ctx) return;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      setTimeout(() => {
        try { oscA.stop(); oscB.stop(); } catch(_){}
        ctx.close();
        ctx = null;
      }, 600);
      isOn = false;
      btn.setAttribute('aria-pressed', 'false');
    };

    btn.addEventListener('click', () => isOn ? turnOff() : turnOn());
  }

  // ───────────────────────────────────────────────────────
  //   13. MOUSE PARALLAX
  // ───────────────────────────────────────────────────────
  function initMouseParallax() {
    document.addEventListener('mousemove', (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;  // -1..1
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  // ───────────────────────────────────────────────────────
  //   14. MAIN — wait for DOM, boot, then start scene
  // ───────────────────────────────────────────────────────
  function start() {
    // HUD immediately available
    buildRail();
    startUptime();
    initSwitcher();
    initResumeModal();
    initContactForm();
    initCounters();
    initReveal();
    initMouseParallax();
    initAudio();

    // kick off boot then three.js
    runBoot(() => {
      const ok = initThree();
      if (!ok) {
        // canvas fallback — degrade gracefully
        canvas.style.display = 'none';
        return;
      }
      // scroll updates rail caption + active indices
      window.addEventListener('scroll', () => {
        updateRailActive();
      }, { passive: true });
      updateRailActive();

      // start loop
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Pause rendering when tab hidden to save battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && renderLoopId) {
      cancelAnimationFrame(renderLoopId);
      renderLoopId = null;
    } else if (!renderLoopId && renderer) {
      lastTime = performance.now();
      render();
    }
  });
})();
