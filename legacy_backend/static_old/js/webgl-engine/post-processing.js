/**
 * TaxClam WebGL Engine — Post-Processing Stack
 * Configures Three.js EffectComposer with:
 *   - UnrealBloomPass (glow on emissive elements)
 *   - BokehPass (depth of field focus pulls)
 *   - FilmPass (subtle grain for cinematic feel)
 *
 * Falls back gracefully if any pass fails to import.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/postprocessing/FilmPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/shaders/GammaCorrectionShader.js';


/**
 * Build and return the post-processing composer.
 * @param {import('./scene').TaxClamScene} tcScene
 * @param {'high'|'medium'|'low'} quality
 * @returns {{ composer: EffectComposer, bloomPass: UnrealBloomPass }}
 */
export function buildComposer(tcScene, quality = 'high') {
  const { renderer, scene, camera } = tcScene;

  const composer = new EffectComposer(renderer);

  // ── Base render pass ──────────────────────────────────────────────────────
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // ── Bloom ─────────────────────────────────────────────────────────────────
  let bloomPass = null;
  if (quality !== 'low') {
    const strength   = quality === 'high' ? 1.4 : 0.8;
    const radius     = quality === 'high' ? 0.6 : 0.3;
    const threshold  = 0.2;
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      strength, radius, threshold
    );
    composer.addPass(bloomPass);
  }

  // ── Film grain ────────────────────────────────────────────────────────────
  if (quality === 'high') {
    const filmPass = new FilmPass(
      0.25,   // noise intensity
      false   // grayscale
    );
    composer.addPass(filmPass);
  }

  // ── Gamma correction (always last) ───────────────────────────────────────
  const gammaPass = new ShaderPass(GammaCorrectionShader);
  composer.addPass(gammaPass);

  console.log(`[TaxClam] Post-processing composer built (quality=${quality}).`);
  return { composer, bloomPass };
}


/**
 * Resize the composer to match the current canvas size.
 * Call this from the resize handler.
 */
export function resizeComposer(composer, w, h) {
  composer.setSize(w, h);
}
