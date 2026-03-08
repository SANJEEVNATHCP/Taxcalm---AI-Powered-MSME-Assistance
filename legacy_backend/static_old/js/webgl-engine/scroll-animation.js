/**
 * TaxClam WebGL Engine — Scroll Animation
 * Drives a cinematic camera journey along a predefined path using GSAP ScrollTrigger.
 * Each scroll section triggers scene reveals and camera transitions.
 *
 * Requires: GSAP 3 + ScrollTrigger (loaded via CDN in landing.html)
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

// ── Camera path waypoints ─────────────────────────────────────────────────────
// These match the Blender camera path export. Adjust after you export your GLB.
const CAMERA_WAYPOINTS = [
  { pos: new THREE.Vector3(0, 2, 12),   target: new THREE.Vector3(0,  0,  0),  section: 0 },
  { pos: new THREE.Vector3(0, 1, 7),    target: new THREE.Vector3(0,  0.5, 0), section: 1 },
  { pos: new THREE.Vector3(3, 2.5, 5),  target: new THREE.Vector3(0,  1,  0),  section: 2 },
  { pos: new THREE.Vector3(-3, 1.5, 4), target: new THREE.Vector3(0,  0,  0),  section: 3 },
  { pos: new THREE.Vector3(0, 3, 9),    target: new THREE.Vector3(0,  0,  0),  section: 4 },
];

// ── CatmullRom curves for smooth interpolation ────────────────────────────────
const camPositionCurve = new THREE.CatmullRomCurve3(
  CAMERA_WAYPOINTS.map(w => w.pos), false, 'catmullrom', 0.5
);
const camTargetCurve = new THREE.CatmullRomCurve3(
  CAMERA_WAYPOINTS.map(w => w.target), false, 'catmullrom', 0.5
);

let _scrollProgress = 0;   // 0-1 driven by GSAP
let _camera = null;
let _sceneObjects = {};     // { sectionIndex: [THREE.Object3D] }

/**
 * Initialize scroll-driven camera animation.
 * @param {import('./scene').TaxClamScene} tcScene
 * @param {Record<number, THREE.Object3D[]>} sceneObjects  — objects to reveal per section
 */
export function initScrollAnimation(tcScene, sceneObjects = {}) {
  _camera = tcScene.camera;
  _sceneObjects = sceneObjects;

  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[TaxClam] GSAP/ScrollTrigger not loaded — scroll animation disabled.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ── Master scroll progress proxy ─────────────────────────────────────────
  const proxy = { progress: 0 };
  gsap.to(proxy, {
    progress: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '#tc-scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
      onUpdate: (self) => {
        _scrollProgress = self.progress;
      },
    },
  });

  // ── Per-section reveal animations ────────────────────────────────────────
  document.querySelectorAll('[data-tc-section]').forEach((el) => {
    const sectionIndex = parseInt(el.dataset.tcSection, 10);

    // Text/overlay content fade-in
    const textEls = el.querySelectorAll('[data-tc-reveal]');
    if (textEls.length) {
      gsap.fromTo(textEls,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    // Dispatch DOM event so 3D objects can react
    ScrollTrigger.create({
      trigger: el,
      start: 'top 60%',
      onEnter: () => _revealSection(sectionIndex),
      onLeaveBack: () => _hideSection(sectionIndex),
    });
  });

  console.log('[TaxClam] Scroll animation initialized.');
}


/**
 * Call this from the render loop each frame to smoothly update camera from scroll.
 * @param {number} delta — frame delta seconds
 */
export function tickScrollCamera(delta) {
  if (!_camera) return;

  const t = Math.max(0, Math.min(1, _scrollProgress));

  const targetPos    = camPositionCurve.getPoint(t);
  const targetLookAt = camTargetCurve.getPoint(t);

  // Lerp camera for cinematic smoothness
  const lerpFactor = 1 - Math.exp(-5 * delta);
  _camera.position.lerp(targetPos, lerpFactor);

  const currentTarget = new THREE.Vector3();
  _camera.getWorldDirection(currentTarget);
  const desiredDir = targetLookAt.clone().sub(_camera.position).normalize();
  currentTarget.lerp(desiredDir, lerpFactor);

  _camera.lookAt(_camera.position.clone().add(currentTarget));
}


// ── Internal section reveal/hide ─────────────────────────────────────────────

function _revealSection(index) {
  const objs = _sceneObjects[index] || [];
  objs.forEach((obj, i) => {
    if (typeof gsap !== 'undefined') {
      gsap.to(obj.scale, {
        x: 1, y: 1, z: 1,
        duration: 0.8,
        delay: i * 0.1,
        ease: 'back.out(1.4)',
      });
      gsap.to(obj, {
        duration: 0.6,
        delay: i * 0.1,
        onStart() { obj.visible = true; },
      });
    } else {
      obj.visible = true;
      obj.scale.set(1, 1, 1);
    }
  });
}

function _hideSection(index) {
  const objs = _sceneObjects[index] || [];
  objs.forEach((obj) => {
    if (typeof gsap !== 'undefined') {
      gsap.to(obj.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.4 });
    } else {
      obj.visible = false;
    }
  });
}
