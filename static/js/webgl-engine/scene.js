/**
 * TaxClam WebGL Engine — Scene Setup
 * Initializes the Three.js renderer, camera, clock, and scene graph.
 * Exposes a singleton `tcScene` used by all other engine modules.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

class TaxClamScene {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.clock = new THREE.Clock();
    this.canvas = null;
    this._initialized = false;
    this._resizeObserver = null;
  }

  /**
   * Initialize the renderer and mount it on the given canvas element.
   * @param {HTMLCanvasElement} canvas
   */
  init(canvas) {
    if (this._initialized) return;
    this.canvas = canvas;

    // ── Renderer ──────────────────────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Scene ─────────────────────────────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1120);  // TaxClam deep navy

    // Subtle fog for depth
    this.scene.fog = new THREE.FogExp2(0x0b1120, 0.035);

    // ── Camera ────────────────────────────────────────────────────────────────
    const aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 200);
    this.camera.position.set(0, 2, 12);
    this.camera.lookAt(0, 0, 0);

    // ── Ambient light ─────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.15);
    this.scene.add(ambient);

    // ── Resize handling ───────────────────────────────────────────────────────
    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(canvas.parentElement || canvas);
    this._onResize();

    this._initialized = true;
    console.log('[TaxClam] Scene initialized.');
  }

  _onResize() {
    if (!this.canvas) return;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  /**
   * Start the render loop. `onFrame(delta, elapsed)` is called each frame.
   * Pass `useComposer: true` when an EffectComposer handles rendering externally
   * (prevents double-render).
   */
  startLoop(onFrame, { useComposer = false } = {}) {
    const tick = () => {
      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();
      onFrame(delta, elapsed);
      if (!useComposer) {
        this.renderer.render(this.scene, this.camera);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  dispose() {
    this._resizeObserver?.disconnect();
    this.renderer?.dispose();
  }
}

export const tcScene = new TaxClamScene();
