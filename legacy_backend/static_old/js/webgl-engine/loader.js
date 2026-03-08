/**
 * TaxClam WebGL Engine — Asset Loader
 * Wraps Three.js GLTFLoader + DRACOLoader for Blender-exported GLB files.
 * Provides a simple promise-based API.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/DRACOLoader.js';

const DRACO_DECODER_PATH =
  'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';

// Singleton loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
dracoLoader.preload();

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (url, loaded, total) => {
  const pct = Math.round((loaded / total) * 100);
  document.dispatchEvent(new CustomEvent('taxclam:load-progress', { detail: { url, pct } }));
};
loadingManager.onLoad = () => {
  document.dispatchEvent(new CustomEvent('taxclam:load-complete'));
};


/**
 * Load a GLB file and return the GLTF result.
 * @param {string} url  — e.g. '/static/models/taxclam_scene.glb'
 * @returns {Promise<import('three/examples/jsm/loaders/GLTFLoader').GLTF>}
 */
export function loadGLB(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        // Enable shadows on all meshes
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        resolve(gltf);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          console.log(`[TaxClam] Loading ${url}: ${pct}%`);
        }
      },
      (error) => {
        console.error('[TaxClam] GLB load error:', url, error);
        reject(error);
      }
    );
  });
}


/**
 * Fetch the list of Blender-exported assets from the TaxClam API.
 * @returns {Promise<{models: string[], images: string[], animations: string[], svgs: string[]}>}
 */
export async function fetchAssetManifest() {
  try {
    const resp = await fetch('/api/blender/assets');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (e) {
    console.warn('[TaxClam] Could not fetch asset manifest:', e.message);
    return { models: [], images: [], animations: [], svgs: [] };
  }
}


/**
 * Load all GLB models listed in the server manifest.
 * @param {import('../webgl-engine/scene').TaxClamScene} tcScene
 * @returns {Promise<THREE.Group[]>}
 */
export async function loadAllModels(tcScene) {
  const manifest = await fetchAssetManifest();
  const groups = [];
  for (const modelPath of manifest.models) {
    try {
      const gltf = await loadGLB('/' + modelPath.replace(/^\//, ''));
      tcScene.scene.add(gltf.scene);
      groups.push(gltf.scene);
      console.log('[TaxClam] Loaded model:', modelPath);
    } catch (e) {
      console.warn('[TaxClam] Failed to load model:', modelPath, e);
    }
  }
  return groups;
}
