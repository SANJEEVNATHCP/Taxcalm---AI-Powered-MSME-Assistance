/**
 * TaxClam — 10-Second Cinematic Web Intro
 * Blender-quality intro animation built with Three.js + GSAP.
 *
 * Usage:  import { playIntroAnimation } from './intro-animation.js';
 *         await playIntroAnimation();
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

// ─── Constants ───────────────────────────────────────────────────────────────
const INTRO_DURATION = 10.0;   // seconds
const N_PARTICLES    = 2800;

// ─── Position generators ─────────────────────────────────────────────────────

/** Dense central cluster — the "big bang" origin */
function genCenterPos(n) {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = Math.random() * 0.25;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    a[i*3]   = r * Math.sin(p) * Math.cos(t);
    a[i*3+1] = r * Math.sin(p) * Math.sin(t);
    a[i*3+2] = r * Math.cos(p);
  }
  return a;
}

/** Explosion shell — scattered large sphere */
function genExplodePos(n) {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 7 + Math.random() * 15;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    a[i*3]   = r * Math.sin(p) * Math.cos(t);
    a[i*3+1] = r * Math.sin(p) * Math.sin(t);
    a[i*3+2] = r * Math.cos(p) - 3;
  }
  return a;
}

/** Fibonacci sphere orbit — evenly-distributed shell for the orbit phase */
function genOrbitPos(n) {
  const a = new Float32Array(n * 3);
  const gr = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < n; i++) {
    const theta = (2 * Math.PI * i) / gr;
    const phi   = Math.acos(1 - (2 * (i + 0.5)) / n);
    const r     = 4.2 + (Math.random() - 0.5) * 1.2;
    a[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    a[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    a[i*3+2] = r * Math.cos(phi);
  }
  return a;
}

// ─── Particle shaders ────────────────────────────────────────────────────────
const PART_VERT = /* glsl */`
  attribute vec3  aCenterPos;
  attribute vec3  aExplodePos;
  attribute vec3  aOrbitPos;
  attribute float aRand;

  uniform float uPhase;    // 0→1 : center→explode,  1→2 : explode→orbit
  uniform float uTime;
  uniform float uSize;

  varying float vRand;
  varying float vAlpha;

  void main() {
    float p1 = clamp(uPhase,        0.0, 1.0);
    float p2 = clamp(uPhase - 1.0,  0.0, 1.0);

    // Smooth step each phase for ease-in-out feel
    float s1 = smoothstep(0.0, 1.0, p1);
    float s2 = smoothstep(0.0, 1.0, p2);

    vec3 pos = mix(aCenterPos, aExplodePos, s1);
    pos       = mix(pos,        aOrbitPos,  s2);

    // Slow orbital drift when in orbit phase
    float angle = uTime * 0.28 * s2 + aRand * 6.2832;
    float cosA  = cos(angle * 0.35);
    float sinA  = sin(angle * 0.35);
    vec3 rotated = vec3(
      pos.x * cosA - pos.z * sinA,
      pos.y,
      pos.x * sinA + pos.z * cosA
    );
    pos = mix(pos, rotated, s2);

    // Turbulent jitter during mid-flight
    float jitter = s1 * (1.0 - s2) * 0.6;
    pos += vec3(
      sin(uTime * 2.3 + aRand * 29.7) * jitter,
      cos(uTime * 1.8 + aRand * 17.5) * jitter,
      sin(uTime * 1.5 + aRand * 23.1) * jitter
    );

    // Fade in from center, fade out near orbit edge
    vAlpha = mix(0.6, 1.0, aRand);
    vRand  = aRand;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (280.0 / max(-mv.z, 1.0));
    gl_Position  = projectionMatrix * mv;
  }
`;

const PART_FRAG = /* glsl */`
  uniform float uOpacity;
  uniform vec3  uColor;
  uniform vec3  uColor2;

  varying float vRand;
  varying float vAlpha;

  void main() {
    vec2  uv   = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    // Soft glow disk
    float core = 1.0 - smoothstep(0.0, 0.5, dist);
    core = pow(core, 2.0);

    // Color: mostly gold, occasional emerald accent
    vec3 col = mix(uColor, uColor2, step(0.75, vRand));
    col = mix(col, vec3(1.0, 0.97, 0.85), core * 0.5);   // brighten center

    gl_FragColor = vec4(col, core * uOpacity * vAlpha);
  }
`;

// ─── Liquid-gold torus knot shaders ──────────────────────────────────────────
const GOLD_VERT = /* glsl */`
  uniform float uTime;
  varying vec3  vNormal;
  varying vec3  vViewPos;
  varying vec2  vUv;

  void main() {
    vNormal  = normalize(normalMatrix * normal);
    vUv      = uv;
    float wave = sin(position.x * 5.0 + uTime * 1.4) * 0.035
               + cos(position.y * 4.0 + uTime * 1.1) * 0.028
               + sin(position.z * 3.5 + uTime * 0.9) * 0.022;
    vec3 displaced = position + normal * wave;
    vec4 mv  = modelViewMatrix * vec4(displaced, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const GOLD_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  varying vec3  vNormal;
  varying vec3  vViewPos;
  varying vec2  vUv;

  void main() {
    vec3  n    = normalize(vNormal);
    vec3  v    = normalize(-vViewPos);
    float rim  = pow(1.0 - abs(dot(n, v)), 3.5);

    // Animated scan-line shimmer
    float scan = 0.5 + 0.5 * sin(vUv.y * 26.0 + uTime * 2.8);
    float scan2= 0.5 + 0.5 * cos(vUv.x * 14.0 - uTime * 1.6);

    vec3 base  = vec3(1.00, 0.82, 0.10);   // deep gold
    vec3 light = vec3(1.00, 0.97, 0.70);   // warm highlight

    vec3 col = mix(base, light, scan * 0.35 + scan2 * 0.15 + rim * 0.55);
    col += vec3(1.0, 0.75, 0.15) * rim * 1.8;   // gold rim emission
    col += vec3(0.05, 0.65, 0.50) * (1.0 - rim) * scan * 0.08;  // faint emerald tint

    gl_FragColor = vec4(col, uOpacity);
  }
`;

// ─── Holographic card shaders ────────────────────────────────────────────────
const HOLO_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv     = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HOLO_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3  uColor;
  varying vec3  vNormal;
  varying vec2  vUv;

  void main() {
    vec3  n    = normalize(vNormal);
    float rim  = pow(1.0 - abs(n.z), 2.5);
    float stripe = 0.5 + 0.5 * sin(vUv.y * 28.0 + uTime * 1.8);
    float glint  = 0.5 + 0.5 * cos(vUv.x * 16.0 - uTime * 2.2);

    vec3 col   = mix(uColor, vec3(1.0), stripe * 0.20 + glint * 0.10 + rim * 0.45);
    float alpha = (0.18 + rim * 0.55 + stripe * 0.08) * uOpacity;

    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Overlay HTML + CSS ───────────────────────────────────────────────────────
function buildOverlayDOM() {
  const el = document.createElement('div');
  el.id = 'tc-intro-overlay';
  el.innerHTML = `
    <canvas id="tc-intro-canvas"></canvas>
    <div id="tc-intro-bars-top"></div>
    <div id="tc-intro-bars-bottom"></div>
    <div id="tc-intro-ui">
      <div id="tc-intro-logo">
        <span class="tc-logo-tax">Tax</span><span class="tc-logo-clam">Clam</span>
      </div>
      <div id="tc-intro-tagline">Smart GST for Indian MSMEs</div>
      <div id="tc-intro-sub">Cinematic financial intelligence · 2026</div>
    </div>
    <div id="tc-intro-timer"><div id="tc-intro-timer-bar"></div></div>
    <button id="tc-intro-skip">Skip intro ↓</button>
    <div id="tc-intro-grain"></div>
  `;

  const css = document.createElement('style');
  css.id = 'tc-intro-styles';
  css.textContent = `
    #tc-intro-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: #000;
      overflow: hidden;
      transition: opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #tc-intro-canvas {
      position: absolute; inset: 0;
      width: 100%; height: 100%; display: block;
    }

    /* Cinematic letterbox bars */
    #tc-intro-bars-top,
    #tc-intro-bars-bottom {
      position: absolute; left: 0; right: 0;
      height: 0; background: #000; z-index: 4;
      transition: height 0.8s cubic-bezier(0.16,1,0.3,1);
    }
    #tc-intro-bars-top    { top: 0; }
    #tc-intro-bars-bottom { bottom: 0; }
    #tc-intro-overlay.bars-open #tc-intro-bars-top,
    #tc-intro-overlay.bars-open #tc-intro-bars-bottom { height: 8vh; }

    /* UI layer */
    #tc-intro-ui {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      pointer-events: none; z-index: 5;
      gap: 0.6rem;
    }

    /* Logo */
    #tc-intro-logo {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: clamp(4.5rem, 14vw, 10rem);
      font-weight: 900;
      letter-spacing: -0.05em;
      line-height: 1;
      opacity: 0;
      transform: scale(0.88) translateY(24px);
      filter: blur(24px);
      transition:
        opacity 1.4s cubic-bezier(0.16,1,0.3,1),
        transform 1.4s cubic-bezier(0.16,1,0.3,1),
        filter 1.4s cubic-bezier(0.16,1,0.3,1);
    }
    #tc-intro-logo.visible {
      opacity: 1; transform: scale(1) translateY(0); filter: blur(0);
    }
    .tc-logo-tax  { color: #F8FAFC; }
    .tc-logo-clam {
      color: #FFD700;
      text-shadow: 0 0 80px rgba(255,215,0,0.9),
                   0 0 160px rgba(255,215,0,0.4);
    }

    /* Tagline */
    #tc-intro-tagline {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: clamp(0.85rem, 2.5vw, 1.5rem);
      font-weight: 300;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #94A3B8;
      opacity: 0; transform: translateY(12px);
      transition: opacity 1.1s ease 0.15s, transform 1.1s ease 0.15s;
    }
    #tc-intro-tagline.visible { opacity: 1; transform: translateY(0); }

    /* Sub-label */
    #tc-intro-sub {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: clamp(0.65rem, 1.2vw, 0.85rem);
      font-weight: 400;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: #10B981;
      opacity: 0;
      transition: opacity 1.0s ease;
    }
    #tc-intro-sub.visible { opacity: 0.85; }

    /* Progress timer bar */
    #tc-intro-timer {
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 3px; background: rgba(255,255,255,0.06); z-index: 6;
    }
    #tc-intro-timer-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(to right, #FFD700, #10B981);
      transition: width 0.3s linear;
    }

    /* Skip button */
    #tc-intro-skip {
      position: absolute; bottom: 2rem; right: 2rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.10);
      color: #64748B;
      font-family: 'Inter', sans-serif;
      font-size: 0.75rem; font-weight: 500;
      letter-spacing: 0.08em;
      padding: 0.45rem 1.1rem; border-radius: 6px;
      cursor: pointer; pointer-events: all; z-index: 6;
      opacity: 0;
      transition: opacity 0.6s ease, background 0.2s, color 0.2s;
    }
    #tc-intro-skip.visible { opacity: 1; }
    #tc-intro-skip:hover { background: rgba(255,255,255,0.10); color: #F8FAFC; }

    /* Film grain overlay */
    #tc-intro-grain {
      position: absolute; inset: 0; z-index: 7;
      pointer-events: none; opacity: 0.04;
      background-image: url('data:image/svg+xml,\
        <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">\
        <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.75"\
        numOctaves="4" stitchTiles="stitch"/></filter>\
        <rect width="256" height="256" filter="url(%23n)" opacity="1"/></svg>');
      background-size: 200px 200px;
      animation: grain-shift 0.35s steps(1) infinite;
    }
    @keyframes grain-shift {
      0%  { background-position: 0   0;   }
      25% { background-position: -50px -30px; }
      50% { background-position: 20px  60px; }
      75% { background-position: -80px 10px;  }
    }
  `;

  return { el, css };
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function playIntroAnimation() {
  return new Promise((resolve) => {

    // ── DOM ───────────────────────────────────────────────────────────────────
    const { el: overlay, css } = buildOverlayDOM();
    document.head.appendChild(css);
    document.body.prepend(overlay);

    // Open letterbox bars after a tick
    requestAnimationFrame(() => overlay.classList.add('bars-open'));

    // ── Renderer ──────────────────────────────────────────────────────────────
    const canvas = document.getElementById('tc-intro-canvas');
    const W = window.innerWidth, H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;

    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x000510, 0.018);

    const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 300);
    camera.position.set(0, 0, 4.5);

    const clock = new THREE.Clock();

    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', onResize);

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    const keyLight = new THREE.PointLight(0xFFD700, 6, 40);
    keyLight.position.set(0, 4, 6);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x10B981, 3, 25);
    fillLight.position.set(-5, -2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x3B82F6, 2, 30);
    rimLight.position.set(5, 1, -4);
    scene.add(rimLight);

    // ── Star field ────────────────────────────────────────────────────────────
    {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(800 * 3);
      for (let i = 0; i < 800; i++) {
        pos[i*3]   = (Math.random() - 0.5) * 180;
        pos[i*3+1] = (Math.random() - 0.5) * 180;
        pos[i*3+2] = (Math.random() - 0.5) * 180;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0xffffff, size: 0.09, transparent: true, opacity: 0.35,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })));
    }

    // ── Particles ─────────────────────────────────────────────────────────────
    const centerPos  = genCenterPos(N_PARTICLES);
    const explodePos = genExplodePos(N_PARTICLES);
    const orbitPos   = genOrbitPos(N_PARTICLES);
    const randArr    = new Float32Array(N_PARTICLES);
    for (let i = 0; i < N_PARTICLES; i++) randArr[i] = Math.random();

    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute('position',    new THREE.BufferAttribute(centerPos.slice(), 3));
    partGeo.setAttribute('aCenterPos',  new THREE.BufferAttribute(centerPos,  3));
    partGeo.setAttribute('aExplodePos', new THREE.BufferAttribute(explodePos, 3));
    partGeo.setAttribute('aOrbitPos',   new THREE.BufferAttribute(orbitPos,   3));
    partGeo.setAttribute('aRand',       new THREE.BufferAttribute(randArr,    1));

    const partUniforms = {
      uPhase:   { value: 0.0 },
      uTime:    { value: 0.0 },
      uSize:    { value: 3.2 },
      uOpacity: { value: 1.0 },
      uColor:   { value: new THREE.Color(0xFFD700) },
      uColor2:  { value: new THREE.Color(0x10B981) },
    };

    const partMat = new THREE.ShaderMaterial({
      vertexShader:   PART_VERT,
      fragmentShader: PART_FRAG,
      uniforms:       partUniforms,
      transparent:    true,
      depthWrite:     false,
      blending:       THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(partGeo, partMat);
    particles.frustumCulled = false;
    scene.add(particles);

    // ── Torus knot — liquid gold ───────────────────────────────────────────────
    const knotMat = new THREE.ShaderMaterial({
      vertexShader:   GOLD_VERT,
      fragmentShader: GOLD_FRAG,
      uniforms: {
        uTime:    { value: 0.0 },
        uOpacity: { value: 0.0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.35, 0.40, 220, 32, 2, 3),
      knotMat
    );
    scene.add(knot);

    // ── Holographic dashboard cards ────────────────────────────────────────────
    const CARD_COLORS  = [0xFFD700, 0x10B981, 0x3B82F6];
    const CARD_START   = [[-14, -1.8, -3.5], [14, -1.8, -3.5], [0, -9, -3.5]];
    const CARD_FINAL   = [[-2.9, -1.8, -3.5], [ 2.9, -1.8, -3.5], [0, -1.8, -3.5]];

    const cards = CARD_COLORS.map((col, i) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader:   HOLO_VERT,
        fragmentShader: HOLO_FRAG,
        uniforms: {
          uTime:    { value: 0.0 },
          uOpacity: { value: 0.0 },
          uColor:   { value: new THREE.Color(col) },
        },
        transparent: true,
        side:        THREE.DoubleSide,
        depthWrite:  false,
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.25, 0.07), mat);
      mesh.position.set(...CARD_START[i]);
      scene.add(mesh);
      return mesh;
    });

    // ── Ground grid (Blender viewport feel) ───────────────────────────────────
    const grid = new THREE.GridHelper(50, 40, 0x1a2f55, 0x0d1c38);
    grid.position.y = -5;
    grid.material.transparent = true;
    grid.material.opacity = 0.25;
    scene.add(grid);

    // ── GSAP Timeline ─────────────────────────────────────────────────────────
    const G = window.gsap;
    if (!G) {
      // GSAP not available — skipanimation gracefully
      console.warn('[TaxClam Intro] GSAP not found, skipping.');
      finish(); return;
    }

    const tl = G.timeline({ onComplete: waitForFade });

    // Phase 0→1 : center → explosion  (0 – 2.5 s)
    tl.to(partUniforms.uPhase, { value: 1.0, duration: 2.5, ease: 'power3.out' }, 0);
    // Camera pull-back during explosion
    tl.to(camera.position, { z: 11, y: 1.8, duration: 4.0, ease: 'power2.inOut' }, 0.3);

    // Phase 1→2 : explosion → orbit  (2.5 – 5.5 s)
    tl.to(partUniforms.uPhase, { value: 2.0, duration: 3.0, ease: 'power2.inOut' }, 2.5);

    // Torus knot materialises  (3.5 – 6 s)
    tl.to(knotMat.uniforms.uOpacity, { value: 1.0, duration: 2.5, ease: 'power3.out' }, 3.5);
    // Dim particles once knot appears
    tl.to(partUniforms.uOpacity, { value: 0.45, duration: 2.0, ease: 'power2.in' }, 3.8);

    // Camera sweeps to a dramatic side angle  (4 – 7 s)
    tl.to(camera.position, { x: 3.5, y: 3.5, z: 14, duration: 3.0, ease: 'power1.inOut' }, 4.0);

    // Cards fly in  (5 – 7.5 s)
    cards.forEach((card, i) => {
      const t0 = 5.0 + i * 0.35;
      tl.to(card.material.uniforms.uOpacity, { value: 1.0, duration: 1.0, ease: 'power2.out'  }, t0);
      if (i === 0) tl.to(card.position, { x: CARD_FINAL[i][0], duration: 1.3, ease: 'back.out(1.3)' }, t0);
      if (i === 1) tl.to(card.position, { x: CARD_FINAL[i][0], duration: 1.3, ease: 'back.out(1.3)' }, t0);
      if (i === 2) tl.to(card.position, { y: CARD_FINAL[i][1], duration: 1.3, ease: 'back.out(1.3)' }, t0);
    });

    // Final cinematic boom — camera pulls back, centres up  (7.2 – 9.5 s)
    tl.to(camera.position, { x: 0, y: 2.2, z: 15, duration: 2.3, ease: 'power2.inOut' }, 7.2);

    // Fade-out everything  (8.5 – 10 s)
    tl.to(partUniforms.uOpacity,        { value: 0, duration: 1.5, ease: 'power2.in' }, 8.5);
    tl.to(knotMat.uniforms.uOpacity,    { value: 0, duration: 1.5, ease: 'power2.in' }, 8.5);
    cards.forEach(c => tl.to(c.material.uniforms.uOpacity, { value: 0, duration: 1.5, ease: 'power2.in' }, 8.5));
    tl.to(overlay, { opacity: 0, duration: 1.5, ease: 'power2.inOut' }, 8.5);

    // ── CSS text reveals (setTimeout for simplicity) ──────────────────────────
    const logo    = document.getElementById('tc-intro-logo');
    const tagline = document.getElementById('tc-intro-tagline');
    const sub     = document.getElementById('tc-intro-sub');
    const skipBtn = document.getElementById('tc-intro-skip');
    const timerBar= document.getElementById('tc-intro-timer-bar');

    setTimeout(() => logo?.classList.add('visible'),    1100);
    setTimeout(() => tagline?.classList.add('visible'), 3400);
    setTimeout(() => sub?.classList.add('visible'),     4800);
    setTimeout(() => skipBtn?.classList.add('visible'), 1600);

    // Animated progress timer bar  (10 s linear fill)
    if (timerBar) {
      timerBar.style.transition = `width ${INTRO_DURATION}s linear`;
      requestAnimationFrame(() => { timerBar.style.width = '100%'; });
    }

    // ── Light animation hints ─────────────────────────────────────────────────
    if (G) {
      G.to(keyLight, {
        intensity: 3, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut',
      });
    }

    // ── Skip button ────────────────────────────────────────────────────────────
    skipBtn?.addEventListener('click', () => {
      tl.seek(8.5);
      tl.timeScale(3);
    });

    // ── Render loop ───────────────────────────────────────────────────────────
    let rafId, done = false;

    function tick() {
      if (done) return;
      rafId = requestAnimationFrame(tick);

      const elapsed = clock.getElapsedTime();

      // Update shader uniforms
      partUniforms.uTime.value        = elapsed;
      knotMat.uniforms.uTime.value    = elapsed;
      cards.forEach(c => { c.material.uniforms.uTime.value = elapsed; });

      // Knot rotation
      knot.rotation.y += 0.007;
      knot.rotation.x  = Math.sin(elapsed * 0.38) * 0.22;

      // Card float + tilt
      cards.forEach((card, i) => {
        card.rotation.y   = Math.sin(elapsed * 0.55 + i * 1.18) * 0.14;
        card.rotation.x   = Math.sin(elapsed * 0.42 + i * 0.90) * 0.06;
        card.position.y   = CARD_FINAL[i][1] + Math.sin(elapsed * 0.85 + i * 2.1) * 0.10;
      });

      // Grid parallax
      grid.position.x = Math.sin(elapsed * 0.12) * 1.5;

      // Camera always looks at origin
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    tick();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    function waitForFade() {
      // Give a brief moment after opacity → 0 before destroying DOM
      setTimeout(finish, 200);
    }

    function finish() {
      if (done) return;
      done = true;

      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      tl?.kill();

      // Dispose Three.js resources
      renderer.dispose();
      partGeo.dispose(); partMat.dispose();
      knot.geometry.dispose(); knotMat.dispose();
      cards.forEach(c => { c.geometry.dispose(); c.material.dispose(); });

      // Remove DOM
      overlay.remove();
      css.remove();

      sessionStorage.setItem('tc_intro_seen', '1');
      resolve();
    }

    // Hard safety fallback — always resolves within 12 s
    setTimeout(finish, (INTRO_DURATION + 2) * 1000);
  });
}
