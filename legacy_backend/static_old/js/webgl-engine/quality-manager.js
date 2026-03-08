/**
 * TaxClam WebGL Engine — Quality Manager
 * Detects GPU tier using the existing gpu-accelerator.js detection and
 * auto-selects a quality preset (high / medium / low) to keep 60 fps
 * across the widest range of devices.
 *
 * Presets
 * ─────────────────────────────
 * high   : Full bloom, DOF, film grain, 40k particles, 2× pixel ratio
 * medium : Bloom only (reduced), 15k particles, 1.5× pixel ratio
 * low    : No post-processing, 3k particles, 1× pixel ratio, CSS fallback hint
 */

export const QUALITY_PRESETS = {
  high: {
    particles: 40000,
    bloom: true,
    dof: false,        // DOF is expensive; enable only if you need it
    filmGrain: true,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    shadowMapType: 'PCFSoft',
    renderSamples: 8,
  },
  medium: {
    particles: 15000,
    bloom: true,
    dof: false,
    filmGrain: false,
    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
    shadowMapType: 'Basic',
    renderSamples: 4,
  },
  low: {
    particles: 3000,
    bloom: false,
    dof: false,
    filmGrain: false,
    pixelRatio: 1,
    shadowMapType: 'Basic',
    renderSamples: 1,
  },
};


/**
 * Detect the appropriate quality tier.
 * Priority: URL param → saved preference → GPU detection → mobile check → high
 *
 * @returns {'high'|'medium'|'low'}
 */
export function detectQualityTier() {
  // 1. Developer override via URL: ?quality=low
  const urlParam = new URLSearchParams(location.search).get('quality');
  if (urlParam && QUALITY_PRESETS[urlParam]) return urlParam;

  // 2. User preference stored in localStorage
  const saved = localStorage.getItem('taxclam_quality');
  if (saved && QUALITY_PRESETS[saved]) return saved;

  // 3. Mobile devices
  if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) return 'medium';

  // 4. GPU detection via existing gpu-accelerator data
  try {
    const gpuInfo = _readGPUInfo();
    if (gpuInfo) {
      const vendor = gpuInfo.toLowerCase();
      if (vendor.includes('intel') || vendor.includes('mesa') || vendor.includes('vmware')) {
        return 'medium';
      }
      if (vendor.includes('geforce') || vendor.includes('radeon') || vendor.includes('apple')) {
        return 'high';
      }
    }
  } catch (_) { /* ignore */ }

  // 5. WebGL capabilities check
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 'low';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
      if (/Intel|Mesa|Software/i.test(renderer)) return 'medium';
    }
  } catch (_) { /* ignore */ }

  return 'high';
}


/** Save user quality preference. */
export function saveQualityPreference(tier) {
  localStorage.setItem('taxclam_quality', tier);
}


/** Apply a quality preset to an already-initialized tcScene and composer. */
export function applyQualityPreset(tcScene, composer, bloomPass, tier) {
  const preset = QUALITY_PRESETS[tier];
  if (!preset) return;

  tcScene.renderer.setPixelRatio(preset.pixelRatio);

  if (bloomPass) {
    bloomPass.enabled = preset.bloom;
    if (preset.bloom) {
      bloomPass.strength = tier === 'high' ? 1.4 : 0.8;
    }
  }

  // Emit an event so the particle system can resize itself
  document.dispatchEvent(new CustomEvent('taxclam:quality-change', {
    detail: { tier, preset }
  }));

  console.log(`[TaxClam] Quality preset applied: ${tier}`);
}


/** Check if WebGL2 is supported. */
export function isWebGL2Supported() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch (_) {
    return false;
  }
}


// ── Internal helpers ─────────────────────────────────────────────────────────

function _readGPUInfo() {
  // Try to read from gpu-accelerator output stored on window
  if (window.taxclamGPU && window.taxclamGPU.renderer) {
    return window.taxclamGPU.renderer;
  }
  // Fallback: direct WebGL query
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) return null;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  if (!ext) return null;
  return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
}
