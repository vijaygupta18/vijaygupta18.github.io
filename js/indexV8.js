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
    { t: 0,    cls: 'dim', text: 'loading real planetary textures from NASA archives' },
    { t: 240,  cls: 'dim', text: 'computing Keplerian orbits · mercury → neptune' },
    { t: 520,  cls: 'dim', text: 'placing Earth · cloud layer · city lights' },
    { t: 780,  cls: 'dim', text: 'wiring VG.AI — trained on vijay\'s work' },
    { t: 1040, cls: 'hi',  text: 'ready.' }
  ];

  function runBoot(onDone) {
    if (prefersReducedMotion) {
      bootEl.classList.add('is-done');
      if (bootBar) bootBar.style.width = '100%';
      setTimeout(onDone, 100);
      return;
    }
    const total = bootLines[bootLines.length - 1].t + 600;
    // smooth continuous progress (independent of line timing)
    const progStart = performance.now();
    const progDur = total + 400;
    function tickProgress() {
      const p = Math.min(1, (performance.now() - progStart) / progDur);
      if (bootBar) bootBar.style.width = (p * 100).toFixed(1) + '%';
      if (p < 1) requestAnimationFrame(tickProgress);
    }
    requestAnimationFrame(tickProgress);

    bootLines.forEach((line, idx) => {
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = line.cls;
        div.style.animationDelay = '0ms';
        div.textContent = line.text;
        bootLog.appendChild(div);
        bootLog.scrollTop = bootLog.scrollHeight;
      }, line.t);
    });
    setTimeout(() => {
      if (bootBar) bootBar.style.width = '100%';
      setTimeout(() => {
        bootEl.classList.add('is-done');
        onDone();
      }, 520);
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
  //   3. THREE.JS SCENE — REALISTIC SOLAR SYSTEM
  //   Data: NASA JPL / IAU · Textures: threex.planets + three.js
  //   (All 9 bodies: Sun + 8 planets + Moon. Kepler orbits,
  //   real relative periods, axial tilts, eccentricities.)
  // ───────────────────────────────────────────────────────
  const canvas = $('#bgCanvas');

  let renderer, scene, camera;
  let sun, sunCorona1, sunCorona2, sunLight;
  let galaxySkybox, starField, asteroidBelt;
  let planets = [];
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const clock = new THREE.Clock();
  let renderLoopId = null;

  // Texture CDNs (CORS-verified via jsDelivr)
  const TX_BASE  = 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/';
  const TX_EARTH = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/';

  // Real astronomical data — source: NASA JPL fact sheets
  // a = semi-major axis (AU), T = orbital period (Earth years),
  // r = equatorial radius (km), rot = sidereal rotation (days, negative = retrograde),
  // tilt = axial tilt (°), ecc = orbital eccentricity
  const PLANET_DATA = [
    { key: 'mercury', name: 'Mercury', a: 0.387,  T: 0.2408,  r: 2439.7, rot: 58.646,  tilt: 0.034,  ecc: 0.2056, color: 0x8a8681, tex: TX_BASE + 'mercurymap.jpg' },
    { key: 'venus',   name: 'Venus',   a: 0.7233, T: 0.6152,  r: 6051.8, rot: -243.02, tilt: 177.36, ecc: 0.0068, color: 0xe2c295, tex: TX_BASE + 'venusmap.jpg' },
    { key: 'earth',   name: 'Earth',   a: 1.0000, T: 1.0000,  r: 6371,   rot: 0.9973,  tilt: 23.44,  ecc: 0.0167, color: 0x2a6cff, tex: TX_BASE + 'earthmap1k.jpg', special: 'earth' },
    { key: 'mars',    name: 'Mars',    a: 1.5237, T: 1.8809,  r: 3389.5, rot: 1.0259,  tilt: 25.19,  ecc: 0.0934, color: 0xc1440e, tex: TX_BASE + 'marsmap1k.jpg' },
    { key: 'jupiter', name: 'Jupiter', a: 5.2028, T: 11.862,  r: 69911,  rot: 0.4135,  tilt: 3.13,   ecc: 0.0489, color: 0xd8b684, tex: TX_BASE + 'jupitermap.jpg' },
    { key: 'saturn',  name: 'Saturn',  a: 9.5388, T: 29.457,  r: 58232,  rot: 0.4440,  tilt: 26.73,  ecc: 0.0565, color: 0xd9c089, tex: TX_BASE + 'saturnmap.jpg', rings: 'saturn' },
    { key: 'uranus',  name: 'Uranus',  a: 19.191, T: 84.011,  r: 25362,  rot: -0.7183, tilt: 97.77,  ecc: 0.0457, color: 0x81c9e4, tex: TX_BASE + 'uranusmap.jpg', rings: 'uranus' },
    { key: 'neptune', name: 'Neptune', a: 30.069, T: 164.79,  r: 24622,  rot: 0.6713,  tilt: 28.32,  ecc: 0.0113, color: 0x2d62b5, tex: TX_BASE + 'neptunemap.jpg' }
  ];

  // Scaling — real distances & sizes are impossible to render at 1:1 (Neptune would be ~500km off-screen
  // if Earth is 1 pixel). Standard astronomy visualization compromise: log-compressed orbits, boosted radii.
  const SUN_VISUAL_RADIUS = 3.8;
  const auToUnits     = (au) => 6 + Math.log(1 + au * 2) * 9;
  const kmToUnits     = (km) => km > 50000 ? 0.55 + Math.log(km / 1000) * 0.22
                                            : 0.18 + Math.log(1 + km / 1000) * 0.22;
  const EARTH_YEAR_S  = 24; // Earth completes an orbit every 24 real seconds — everything else scales from that
  const DAY_TO_SEC    = 1.8; // 1 Earth day = 1.8 real seconds of rotation

  // Kepler's equation solver — Newton iteration (3-4 iters is plenty for eccentricities <0.25)
  function solveKepler(M, e) {
    let E = M;
    for (let i = 0; i < 5; i++) {
      const f  = E - e * Math.sin(E) - M;
      const fp = 1 - e * Math.cos(E);
      E = E - f / fp;
    }
    return E;
  }

  function loadTexture(loader, url) {
    return new Promise((resolve) => {
      loader.load(url,
        (tex) => {
          tex.encoding = THREE.sRGBEncoding;
          resolve(tex);
        },
        undefined,
        () => { console.warn('[solar] texture failed:', url); resolve(null); }
      );
    });
  }

  async function initThree() {
    if (!canvas || typeof THREE === 'undefined') return false;

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !prefersReducedMotion,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x00000a, 1);
    renderer.outputEncoding = THREE.sRGBEncoding;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      2200
    );
    camera.position.set(0, 14, 42);
    camera.lookAt(0, 0, 0);

    // ── TEXTURES — loaded in parallel ──
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    const textureUrls = {
      sun:         TX_BASE + 'sunmap.jpg',
      galaxy:      TX_BASE + 'galaxy_starfield.png',
      earthClouds: TX_BASE + 'earthcloudmaptrans.jpg',
      earthLights: TX_EARTH + 'earth_lights_2048.png',
      earthBump:   TX_BASE + 'earthbump1k.jpg',
      moon:        TX_BASE + 'moonmap1k.jpg',
      saturnRingC: TX_BASE + 'saturnringcolor.jpg',
      saturnRingA: TX_BASE + 'saturnringpattern.gif',
      uranusRing:  TX_BASE + 'uranusringcolour.jpg'
    };
    const [sunT, galaxyT, cloudsT, lightsT, bumpT, moonT, sRingC, sRingA, uRing, ...planetTs] =
      await Promise.all([
        loadTexture(loader, textureUrls.sun),
        loadTexture(loader, textureUrls.galaxy),
        loadTexture(loader, textureUrls.earthClouds),
        loadTexture(loader, textureUrls.earthLights),
        loadTexture(loader, textureUrls.earthBump),
        loadTexture(loader, textureUrls.moon),
        loadTexture(loader, textureUrls.saturnRingC),
        loadTexture(loader, textureUrls.saturnRingA),
        loadTexture(loader, textureUrls.uranusRing),
        ...PLANET_DATA.map(p => loadTexture(loader, p.tex))
      ]);

    // ── LIGHTS ──
    // Faint ambient so the dark side of planets isn't pure black (Milky Way glow)
    scene.add(new THREE.AmbientLight(0xffffff, 0.08));

    // Sun is the dominant light source (point light at origin)
    sunLight = new THREE.PointLight(0xfff3d8, 3.3, 400, 1.2);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // ── GALAXY SKYBOX — Milky Way backdrop ──
    if (galaxyT) {
      const skyGeo = new THREE.SphereGeometry(1400, 64, 64);
      const skyMat = new THREE.MeshBasicMaterial({
        map: galaxyT,
        side: THREE.BackSide,
        color: 0x777799,
        depthWrite: false
      });
      galaxySkybox = new THREE.Mesh(skyGeo, skyMat);
      scene.add(galaxySkybox);
    }

    // ── SUN ──
    const sunGeo = new THREE.SphereGeometry(SUN_VISUAL_RADIUS, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunT, color: 0xffffff
    });
    sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);

    // inner corona
    sunCorona1 = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_VISUAL_RADIUS * 1.18, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffdda0,
        transparent: true,
        opacity: 0.22,
        side: THREE.BackSide,
        depthWrite: false
      })
    );
    sun.add(sunCorona1);

    // outer halo
    sunCorona2 = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_VISUAL_RADIUS * 1.55, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0xff8844,
        transparent: true,
        opacity: 0.09,
        side: THREE.BackSide,
        depthWrite: false
      })
    );
    sun.add(sunCorona2);

    // ── PLANETS ──
    planets = PLANET_DATA.map((data, i) => {
      const group = new THREE.Group();
      scene.add(group);

      const radius = kmToUnits(data.r);
      const geo = new THREE.SphereGeometry(radius, 56, 56);
      const texMap = planetTs[i];
      const mat = new THREE.MeshStandardMaterial({
        map: texMap,
        color: texMap ? 0xffffff : data.color,
        roughness: 0.95,
        metalness: 0.02
      });
      // Earth gets bump for terrain
      if (data.special === 'earth' && bumpT) {
        mat.bumpMap = bumpT;
        mat.bumpScale = 0.04;
      }
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.z = THREE.MathUtils.degToRad(data.tilt);
      group.add(mesh);

      let clouds = null, night = null, moon = null, rings = null;

      // ── EARTH specials: clouds + city lights + Moon ──
      if (data.special === 'earth') {
        if (cloudsT) {
          const cloudsMat = new THREE.MeshStandardMaterial({
            map: cloudsT,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            alphaTest: 0.04,
            blending: THREE.NormalBlending
          });
          clouds = new THREE.Mesh(
            new THREE.SphereGeometry(radius * 1.013, 48, 48),
            cloudsMat
          );
          clouds.rotation.z = THREE.MathUtils.degToRad(data.tilt);
          group.add(clouds);
        }
        if (lightsT) {
          const nightMat = new THREE.MeshBasicMaterial({
            map: lightsT,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.9,
            depthWrite: false
          });
          night = new THREE.Mesh(
            new THREE.SphereGeometry(radius * 1.004, 48, 48),
            nightMat
          );
          night.rotation.z = THREE.MathUtils.degToRad(data.tilt);
          group.add(night);
        }
        // Moon
        const moonRadius = kmToUnits(1737);
        const moonMat = new THREE.MeshStandardMaterial({
          map: moonT, color: 0xffffff, roughness: 0.98
        });
        moon = new THREE.Mesh(new THREE.SphereGeometry(moonRadius, 32, 32), moonMat);
        group.add(moon);
      }

      // ── SATURN rings ──
      if (data.rings === 'saturn') {
        const inner = radius * 1.3;
        const outer = radius * 2.35;
        const rGeo = new THREE.RingGeometry(inner, outer, 128, 1);
        // Remap UVs so ring texture reads radially (default triangulated UVs look wrong)
        const pos = rGeo.attributes.position;
        const uv  = rGeo.attributes.uv;
        for (let j = 0; j < pos.count; j++) {
          const x = pos.getX(j), y = pos.getY(j);
          const r = Math.sqrt(x*x + y*y);
          uv.setXY(j, (r - inner) / (outer - inner), 0.5);
        }
        rGeo.attributes.uv.needsUpdate = true;
        const rMat = new THREE.MeshBasicMaterial({
          map: sRingC,
          alphaMap: sRingA,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
          depthWrite: false
        });
        rings = new THREE.Mesh(rGeo, rMat);
        // Rings lie in the planet's equatorial plane (tilted with the planet)
        rings.rotation.x = Math.PI / 2;
        rings.rotation.y = THREE.MathUtils.degToRad(data.tilt);
        group.add(rings);
      }

      // ── URANUS faint rings (runs perpendicular due to its 98° tilt) ──
      if (data.rings === 'uranus') {
        const inner = radius * 1.45;
        const outer = radius * 2.0;
        const rGeo = new THREE.RingGeometry(inner, outer, 96, 1);
        const rMat = new THREE.MeshBasicMaterial({
          map: uRing,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.35,
          depthWrite: false
        });
        rings = new THREE.Mesh(rGeo, rMat);
        rings.rotation.x = Math.PI / 2;
        rings.rotation.y = THREE.MathUtils.degToRad(data.tilt);
        group.add(rings);
      }

      // ── Orbit trail (true elliptical, sun at focus) ──
      const orbitRadius = auToUnits(data.a);
      const bMinor = orbitRadius * Math.sqrt(1 - data.ecc * data.ecc);
      const cFocal = orbitRadius * data.ecc;
      const pts = [];
      const SEGS = 220;
      for (let j = 0; j <= SEGS; j++) {
        const th = (j / SEGS) * Math.PI * 2;
        pts.push(new THREE.Vector3(
          orbitRadius * Math.cos(th) - cFocal,
          0,
          bMinor * Math.sin(th)
        ));
      }
      const trailGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const trailMat = new THREE.LineBasicMaterial({
        color: data.color,
        transparent: true,
        opacity: 0.14,
        depthWrite: false
      });
      const trail = new THREE.LineLoop(trailGeo, trailMat);
      scene.add(trail);

      return {
        key: data.key,
        name: data.name,
        data,
        group, mesh, clouds, night, moon, rings, trail,
        a: orbitRadius,
        b: bMinor,
        c: cFocal,
        periodSec: Math.max(0.5, data.T * EARTH_YEAR_S),
        rotSec: Math.max(1.2, Math.abs(data.rot) * DAY_TO_SEC),
        rotSign: data.rot < 0 ? -1 : 1,
        phase: (i * 1.3 + 0.6) % (Math.PI * 2),
        position: new THREE.Vector3()
      };
    });

    // ── ASTEROID BELT (Mars/Jupiter gap, 2.2–3.2 AU) ──
    const beltInner = auToUnits(2.2);
    const beltOuter = auToUnits(3.25);
    const beltCount = prefersReducedMotion ? 1200 : 3600;
    const beltGeo = new THREE.BufferGeometry();
    const beltPos = new Float32Array(beltCount * 3);
    const beltCol = new Float32Array(beltCount * 3);
    for (let i = 0; i < beltCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = beltInner + Math.pow(Math.random(), 0.6) * (beltOuter - beltInner);
      beltPos[i*3]   = Math.cos(ang) * rad;
      beltPos[i*3+1] = (Math.random() - 0.5) * 0.7;
      beltPos[i*3+2] = Math.sin(ang) * rad;
      const shade = 0.4 + Math.random() * 0.5;
      beltCol[i*3]   = shade * 0.75;
      beltCol[i*3+1] = shade * 0.6;
      beltCol[i*3+2] = shade * 0.45;
    }
    beltGeo.setAttribute('position', new THREE.BufferAttribute(beltPos, 3));
    beltGeo.setAttribute('color', new THREE.BufferAttribute(beltCol, 3));
    const beltMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false
    });
    asteroidBelt = new THREE.Points(beltGeo, beltMat);
    scene.add(asteroidBelt);

    // ── Extra star layer — in front of the galaxy skybox so stars twinkle as camera moves ──
    const extraStarCount = prefersReducedMotion ? 800 : 2500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(extraStarCount * 3);
    const starCol = new Float32Array(extraStarCount * 3);
    for (let i = 0; i < extraStarCount; i++) {
      const r = 120 + Math.random() * 900;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i*3+2] = r * Math.cos(phi);
      const tint = Math.random();
      starCol[i*3]   = 1.0;
      starCol[i*3+1] = 0.92 + tint * 0.08;
      starCol[i*3+2] = 0.75 + tint * 0.25;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    window.addEventListener('resize', onResize, { passive: true });
    return true;
  }

  function onResize() {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  // ───────────────────────────────────────────────────────
  //   4. CAMERA CHOREOGRAPHY — scroll-driven planet tour
  //   Each keyframe is anchored to a body; camera follows
  //   that body's moving position with a fixed offset.
  // ───────────────────────────────────────────────────────
  const CAM_KEYFRAMES = [
    { target: 'sun',     offset: [0,  16, 42], label: 'SUN' },      // Hero: inner solar system overview
    { target: 'earth',   offset: [3,  2.2, 4.8], label: 'EARTH' },  // About: home planet
    { target: 'mars',    offset: [2.4, 1.5, 3.5], label: 'MARS' },  // Stack: red techy world
    { target: 'jupiter', offset: [5,  3,   7],   label: 'JUPITER' },// Work: biggest gas giant
    { target: 'saturn',  offset: [6,  4,   8],   label: 'SATURN' },// Builds: iconic rings
    { target: 'neptune', offset: [3,  2,   5],   label: 'NEPTUNE' },// Education: far, deep
    { target: 'earth',   offset: [2,  1.5, 3.5], label: 'EARTH' }   // Contact: back home
  ];
  const STATIONS = ['HERO', 'ABOUT', 'STACK', 'WORK', 'BUILDS', 'EDU', 'CONTACT'];

  function scrollProgress() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    if (docH <= 0) return 0;
    return clamp(window.scrollY / docH, 0, 1);
  }

  const _tmpTgtA    = new THREE.Vector3();
  const _tmpTgtB    = new THREE.Vector3();
  const _tmpTgt     = new THREE.Vector3();
  const _tmpOffA    = new THREE.Vector3();
  const _tmpOffB    = new THREE.Vector3();
  const _tmpOff     = new THREE.Vector3();
  const _tmpCamPos  = new THREE.Vector3();

  function planetPositionByKey(key, outV) {
    if (key === 'sun') return outV.set(0, 0, 0);
    const p = planets.find(pl => pl.key === key);
    if (p) outV.copy(p.position);
    else outV.set(0, 0, 0);
    return outV;
  }

  function applyCameraFromScroll() {
    if (!camera) return;
    const p = scrollProgress();
    const segs = CAM_KEYFRAMES.length - 1;
    const raw = p * segs;
    const idx = clamp(Math.floor(raw), 0, segs - 1);
    const t = ease(raw - idx);
    const a = CAM_KEYFRAMES[idx], b = CAM_KEYFRAMES[idx + 1];

    planetPositionByKey(a.target, _tmpTgtA);
    planetPositionByKey(b.target, _tmpTgtB);
    _tmpTgt.lerpVectors(_tmpTgtA, _tmpTgtB, t);

    _tmpOffA.fromArray(a.offset);
    _tmpOffB.fromArray(b.offset);
    _tmpOff.lerpVectors(_tmpOffA, _tmpOffB, t);

    // mouse parallax on offset
    _tmpOff.x += mouse.x * 0.7;
    _tmpOff.y += -mouse.y * 0.4;

    _tmpCamPos.addVectors(_tmpTgt, _tmpOff);
    camera.position.copy(_tmpCamPos);
    camera.lookAt(_tmpTgt);

    // HUD label + target readout
    const activeIdx = Math.round(p * segs);
    const active = CAM_KEYFRAMES[clamp(activeIdx, 0, CAM_KEYFRAMES.length - 1)];
    if (railCaption && railCaption.textContent !== active.label) railCaption.textContent = active.label;
    if (hudTargetEl && hudTargetEl.textContent !== active.label)  hudTargetEl.textContent  = active.label;
    if (active.target === 'sun') {
      if (hudAuEl)     hudAuEl.textContent     = '0.00';
      if (hudRadiusEl) hudRadiusEl.textContent = '696,340';
      if (hudPeriodEl) hudPeriodEl.textContent = '—';
    } else {
      const pd = PLANET_DATA.find(x => x.key === active.target);
      if (pd) {
        if (hudAuEl)     hudAuEl.textContent     = pd.a.toFixed(2);
        if (hudRadiusEl) hudRadiusEl.textContent = pd.r.toLocaleString('en-US');
        if (hudPeriodEl) hudPeriodEl.textContent =
          pd.T < 1 ? (pd.T * 365.25).toFixed(0) + 'd'
                   : pd.T.toFixed(1) + 'y';
      }
    }
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
    fpsAccum += (1 / (dt || 0.016));
    fpsCount++;
    if (fpsCount >= 30) {
      fps = Math.round(fpsAccum / fpsCount);
      if (fpsEl) fpsEl.textContent = String(fps);
      fpsAccum = 0;
      fpsCount = 0;
    }

    // smooth mouse
    mouse.x = lerp(mouse.x, mouse.tx, 0.05);
    mouse.y = lerp(mouse.y, mouse.ty, 0.05);

    // Sun — slow equatorial rotation + corona pulse
    if (sun) {
      sun.rotation.y = elapsed * 0.035;
      if (sunCorona1) sunCorona1.scale.setScalar(1 + Math.sin(elapsed * 1.1) * 0.035);
      if (sunCorona2) sunCorona2.scale.setScalar(1 + Math.sin(elapsed * 0.7 + 1) * 0.05);
    }

    // Planets — Kepler orbit (sun at ellipse focus) + axial rotation
    for (let i = 0; i < planets.length; i++) {
      const p = planets[i];
      const M = (2 * Math.PI * elapsed) / p.periodSec + p.phase;
      const E = solveKepler(M, p.data.ecc);
      const px = p.a * Math.cos(E) - p.c;
      const pz = p.b * Math.sin(E);
      p.group.position.set(px, 0, pz);
      p.position.set(px, 0, pz);

      const rotSpeed = (2 * Math.PI / p.rotSec) * p.rotSign;
      const rotY = elapsed * rotSpeed;
      if (p.mesh)   p.mesh.rotation.y   = rotY;
      if (p.clouds) p.clouds.rotation.y = rotY * 1.15; // clouds drift faster than ground
      if (p.night)  p.night.rotation.y  = rotY;

      // Moon — orbits Earth (27.3-day period sped up so it's visible in one Earth orbit)
      if (p.moon) {
        const moonAng = elapsed * 0.85;
        const moonOrbit = kmToUnits(p.data.r) * 3.6;
        p.moon.position.set(
          Math.cos(moonAng) * moonOrbit,
          Math.sin(moonAng * 0.2) * 0.08,
          Math.sin(moonAng) * moonOrbit
        );
        p.moon.rotation.y = moonAng; // tidally locked (same face always toward Earth)
      }
    }

    // Ambient drifts
    if (galaxySkybox) galaxySkybox.rotation.y += dt * 0.0006;
    if (starField)    starField.rotation.y    += dt * 0.003;
    if (asteroidBelt) asteroidBelt.rotation.y += dt * 0.012;

    applyCameraFromScroll();
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
  const hudTargetEl = $('#hudTarget');
  const hudAuEl = $('#hudTargetAU');
  const hudRadiusEl = $('#hudTargetRadius');
  const hudPeriodEl = $('#hudTargetPeriod');

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
  //   12a. AI TERMINAL (VG.AI · Cloudflare Worker · Gemini)
  // ───────────────────────────────────────────────────────
  const AI_WORKER_URL = 'https://portfolio-ai.vijay-gupta-932.workers.dev';
  let aiHistory = [];

  function aiEscape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function aiScroll(log) {
    requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
  }

  // Minimal-but-correct markdown → HTML for chat answers.
  // Handles: **bold**, *italic*, `code`, unordered (-,*) + ordered (1.) lists,
  // line breaks, inline links, and escapes HTML first.
  function aiRenderMarkdown(src) {
    const raw = String(src).replace(/\r\n/g, '\n');
    const lines = raw.split('\n');
    const blocks = [];
    let list = null; // { type: 'ul'|'ol', items: [] }
    let para = null;

    const flushPara = () => { if (para) { blocks.push(['p', para.join(' ')]); para = null; } };
    const flushList = () => { if (list) { blocks.push([list.type, list.items]); list = null; } };

    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');
      if (!line.trim()) { flushPara(); flushList(); continue; }
      const u = /^\s*[-*]\s+(.+)/.exec(line);
      const o = /^\s*(\d+)\.\s+(.+)/.exec(line);
      if (u) {
        flushPara();
        if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
        list.items.push(u[1]);
      } else if (o) {
        flushPara();
        if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
        list.items.push(o[2]);
      } else {
        flushList();
        if (!para) para = [];
        para.push(line);
      }
    }
    flushPara(); flushList();

    const inlineMd = (s) => {
      let x = aiEscape(s);
      // inline code `code`
      x = x.replace(/`([^`]+?)`/g, '<code>$1</code>');
      // bold **text**
      x = x.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // italic *text* (avoid matching inside **..**)
      x = x.replace(/(^|[\s(])\*([^*\n]+?)\*(?=$|[\s,.;:!?)])/g, '$1<em>$2</em>');
      // autolink http(s)://
      x = x.replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
      return x;
    };

    return blocks.map(([tag, content]) => {
      if (tag === 'p')  return `<p>${inlineMd(content)}</p>`;
      if (tag === 'ul') return `<ul>${content.map(i => `<li>${inlineMd(i)}</li>`).join('')}</ul>`;
      if (tag === 'ol') return `<ol>${content.map(i => `<li>${inlineMd(i)}</li>`).join('')}</ol>`;
      return '';
    }).join('');
  }

  function aiAppendMsg(log, kind, textOrHtml, { asHtml = false } = {}) {
    const el = document.createElement('div');
    el.className = `ai-msg ai-msg--${kind}`;
    const tag = document.createElement('span');
    tag.className = 'ai-msg-tag';
    tag.textContent = kind === 'sys'  ? 'sys' :
                      kind === 'user' ? 'you' :
                      kind === 'err'  ? 'err' :
                                        'vg.ai';
    const body = document.createElement('div');
    body.className = 'ai-msg-body';
    if (asHtml) body.innerHTML = textOrHtml;
    else body.textContent = textOrHtml;
    el.appendChild(tag);
    el.appendChild(body);
    log.appendChild(el);
    aiScroll(log);
    return { el, body };
  }

  async function aiSubmit(query, log, inputEl, sendBtn) {
    if (!query || !log) return;
    // user turn
    aiAppendMsg(log, 'user', query);

    inputEl.value = '';
    inputEl.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    // thinking — one bubble with pulsing dots
    const thinking = document.createElement('div');
    thinking.className = 'ai-msg ai-msg--ai';
    thinking.innerHTML = `
      <span class="ai-msg-tag">vg.ai</span>
      <div class="ai-msg-body ai-thinking">
        <span class="ai-thinking-dots"><span></span><span></span><span></span></span>
      </div>`;
    log.appendChild(thinking);
    aiScroll(log);

    try {
      const resp = await fetch(AI_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, history: aiHistory })
      });
      if (!resp.ok) {
        let errData = {};
        try { errData = await resp.json(); } catch (_) {}
        throw new Error(errData.error || `API returned ${resp.status}`);
      }
      const data = await resp.json();
      const answer = (data.answer || '').trim();
      if (!answer) throw new Error('Empty response');

      aiHistory.push({ role: 'user',      content: query });
      aiHistory.push({ role: 'assistant', content: answer });
      if (aiHistory.length > 10) aiHistory = aiHistory.slice(-6);

      thinking.remove();

      // render as ONE message, markdown-aware, with a soft fade-in
      const html = aiRenderMarkdown(answer);
      const { body } = aiAppendMsg(log, 'ai', html, { asHtml: true });
      body.classList.add('ai-reveal');
      aiScroll(log);
    } catch (err) {
      thinking.remove();
      aiAppendMsg(log, 'err',
        `Transmission failed: ${err.message || 'request failed'}. Try again in a sec — the worker may be waking up.`);
    } finally {
      inputEl.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  function initAiTerminal() {
    const form = $('#aiTermForm');
    const input = $('#aiTermInput');
    const sendBtn = form ? form.querySelector('.ai-term-send') : null;
    const log = $('#aiTermLog');
    const chips = $('#aiTermChips');
    const clearBtn = $('#aiTermClear');
    if (!form || !input || !log) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (q) aiSubmit(q, log, input, sendBtn);
    });

    chips?.addEventListener('click', (e) => {
      const btn = e.target.closest('.ai-chip');
      if (!btn) return;
      const q = btn.dataset.q || btn.textContent.trim();
      aiSubmit(q, log, input, sendBtn);
    });

    clearBtn?.addEventListener('click', () => {
      aiHistory = [];
      log.innerHTML = `
        <div class="ai-msg ai-msg--sys">
          <span class="ai-msg-tag">[sys]</span>
          <span>Memory wiped. Fresh session — ask away.</span>
        </div>`;
    });
  }

  // ───────────────────────────────────────────────────────
  //   12b. DATA STREAMS (side ambient hex/binary)
  // ───────────────────────────────────────────────────────
  function initDataStreams() {
    const l = $('#dsTrackL');
    const r = $('#dsTrackR');
    if (!l || !r) return;
    const hexChars = '0123456789ABCDEF';
    const tokens = ['REDIS', 'KAFKA', 'OK', 'VALKEY', 'HTTP', 'TLS', 'ZSTD', 'HS', 'RPC', '200', '204', '404', 'P95', 'P99', 'RCA', 'SRE', 'IOPS', 'GB', 'TPS', 'EOF'];
    const genLine = () => {
      if (Math.random() < 0.25) {
        return tokens[Math.floor(Math.random() * tokens.length)];
      }
      let s = '';
      for (let i = 0; i < 4; i++) s += hexChars[Math.floor(Math.random() * hexChars.length)];
      return s;
    };
    const buildFeed = () => {
      let feed = '';
      for (let i = 0; i < 160; i++) feed += genLine() + '\n';
      return feed + feed; // double for seamless loop
    };
    l.textContent = buildFeed();
    r.textContent = buildFeed();
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
  //   12c. HERO TITLE — 3D char split + mouse-tracked tilt
  // ───────────────────────────────────────────────────────
  function initHeroTitle() {
    const title = $('#heroTitle');
    if (!title) return;
    const words = $$('.hero-title-word', title);

    // split each word into .tw-char spans with --d for stagger
    let delayIdx = 0;
    words.forEach((word) => {
      const text = word.dataset.text || word.textContent || '';
      word.textContent = '';
      for (const ch of text) {
        const span = document.createElement('span');
        if (ch === ' ') {
          span.className = 'tw-char tw-space';
          span.innerHTML = '&nbsp;';
        } else {
          span.className = 'tw-char';
          span.textContent = ch;
        }
        span.style.setProperty('--d', String(delayIdx++));
        word.appendChild(span);
      }
    });

    if (prefersReducedMotion || isTouch) return;

    // mouse-tracked tilt on the whole title — clamped
    const heroSection = $('#hero');
    if (!heroSection) return;
    let rafId = null;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    heroSection.addEventListener('mousemove', (e) => {
      const rect = title.getBoundingClientRect();
      const localX = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5..0.5
      const localY = (e.clientY - rect.top)  / rect.height - 0.5;
      tx = clamp(-localY * 18, -14, 14);  // rotateX inverts Y
      ty = clamp( localX * 22, -16, 16);  // rotateY
      if (!rafId) rafId = requestAnimationFrame(applyTilt);
    }, { passive: true });

    heroSection.addEventListener('mouseleave', () => {
      tx = 0; ty = 0;
      if (!rafId) rafId = requestAnimationFrame(applyTilt);
    });

    function applyTilt() {
      cx = lerp(cx, tx, 0.12);
      cy = lerp(cy, ty, 0.12);
      title.style.setProperty('--rx', cx.toFixed(2) + 'deg');
      title.style.setProperty('--ry', cy.toFixed(2) + 'deg');
      if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) {
        rafId = requestAnimationFrame(applyTilt);
      } else {
        rafId = null;
      }
    }
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
    initAiTerminal();
    initDataStreams();
    initHeroTitle();

    // kick off boot then three.js (initThree is async — textures load in parallel)
    runBoot(async () => {
      let ok = false;
      try { ok = await initThree(); }
      catch (err) { console.error('[solar] init failed:', err); ok = false; }
      if (!ok) {
        canvas.style.display = 'none';
        return;
      }
      window.addEventListener('scroll', () => {
        updateRailActive();
      }, { passive: true });
      updateRailActive();
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
