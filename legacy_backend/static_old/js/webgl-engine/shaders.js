/**
 * TaxClam WebGL Engine — GLSL Shaders
 * Custom shader materials for the cinematic experience:
 *   - HolographicMaterial: shimmer glass panels (dashboard cards)
 *   - LiquidGoldMaterial: animated gold molten effect (₹ symbol)
 *   - ParticleShader: GPU instanced particle field
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

// ── Noise utility (shared by multiple shaders) ───────────────────────────────
const NOISE_GLSL = /* glsl */`
float hash(vec3 p) {
  p = fract(p * vec3(443.8975, 397.2973, 491.1871));
  p += dot(p.zxy, p.yxz + 19.19);
  return fract(p.x * p.y * p.z);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i),           hash(i+vec3(1,0,0)), f.x),
        mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)), f.x),
        mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)), f.x), f.y),
    f.z);
}
`;


// ═══════════════════════════════════════════════════════════════════════════════
// 1. Holographic Glass Material — for floating dashboard cards
// ═══════════════════════════════════════════════════════════════════════════════

const holographicVert = /* glsl */`
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const holographicFrag = /* glsl */`
${NOISE_GLSL}

uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  // Fresnel rim
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - dot(vNormal, viewDir), 3.0);

  // Holographic scan lines
  float scan = sin(vUv.y * 80.0 + uTime * 2.5) * 0.5 + 0.5;
  scan = pow(scan, 6.0) * 0.4;

  // Shimmer noise
  float shimmer = noise(vec3(vUv * 4.0, uTime * 0.3)) * 0.2;

  vec3 col = uColor;
  col += vec3(scan + shimmer) * 0.6;
  col += fresnel * vec3(0.4, 0.9, 1.0) * 0.7;

  float alpha = uOpacity + fresnel * 0.4 + scan * 0.1;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;

/**
 * Create a holographic glass material for dashboard card meshes.
 * @param {THREE.Color|number} color  — base tint color
 */
export function createHolographicMaterial(color = 0x10b981) {
  return new THREE.ShaderMaterial({
    vertexShader: holographicVert,
    fragmentShader: holographicFrag,
    uniforms: {
      uTime:    { value: 0 },
      uColor:   { value: new THREE.Color(color) },
      uOpacity: { value: 0.12 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}


// ═══════════════════════════════════════════════════════════════════════════════
// 2. Liquid Gold Material — for the ₹ hero symbol
// ═══════════════════════════════════════════════════════════════════════════════

const liquidGoldVert = /* glsl */`
uniform float uTime;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

${NOISE_GLSL}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Subtle vertex displacement for molten look
  vec3 displaced = position;
  float disp = noise(position * 2.5 + uTime * 0.4) * 0.04;
  displaced += normal * disp;

  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const liquidGoldFrag = /* glsl */`
${NOISE_GLSL}

uniform float uTime;
uniform vec3  uGold;
uniform vec3  uDark;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPos);

  // Flowing noise for molten gold
  float n1 = noise(vec3(vUv * 3.0, uTime * 0.5));
  float n2 = noise(vec3(vUv * 6.0 + 1.7, uTime * 0.8));
  float flow = n1 * 0.6 + n2 * 0.4;

  // Metallic reflection
  float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.0);
  float spec    = pow(max(dot(reflect(-viewDir, vNormal), vec3(0.0, 1.0, 0.5)), 0.0), 32.0);

  vec3 col = mix(uDark, uGold, flow);
  col += spec * uGold * 1.5;
  col += fresnel * uGold * 0.8;

  // Emissive pulse
  float pulse = sin(uTime * 1.5) * 0.5 + 0.5;
  col += uGold * pulse * 0.15;

  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Create a liquid gold animated material (for the ₹ symbol / hero objects).
 */
export function createLiquidGoldMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: liquidGoldVert,
    fragmentShader: liquidGoldFrag,
    uniforms: {
      uTime: { value: 0 },
      uGold: { value: new THREE.Color(0xffd700) },
      uDark: { value: new THREE.Color(0x7a5c00) },
    },
  });
}


// ═══════════════════════════════════════════════════════════════════════════════
// 3. Particle Field Shader — 50k GPU-instanced data particles
// ═══════════════════════════════════════════════════════════════════════════════

const particleVert = /* glsl */`
${NOISE_GLSL}

uniform float uTime;
uniform float uSize;

attribute float aRandom;
attribute vec3  aOffset;

varying float vLife;
varying float vBrightness;

void main() {
  // Each particle drifts upward with individual phase
  float phase = aRandom * 6.2832;
  float speed = 0.3 + aRandom * 0.5;
  float t     = mod(uTime * speed + aRandom * 10.0, 12.0);

  vec3 pos = aOffset;
  pos.y += t * 0.4;
  pos.x += sin(t * 0.8 + phase) * 0.6;
  pos.z += cos(t * 0.7 + phase) * 0.6;

  // Noise turbulence
  pos += vec3(
    noise(pos + uTime * 0.1) - 0.5,
    0.0,
    noise(pos.zxy + uTime * 0.1) - 0.5
  ) * 0.3;

  vLife       = 1.0 - (t / 12.0);
  vBrightness = 0.3 + aRandom * 0.7;

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = uSize * (1.0 / -mvPos.z) * vLife;
  gl_Position  = projectionMatrix * mvPos;
}
`;

const particleFrag = /* glsl */`
uniform vec3 uColor;
varying float vLife;
varying float vBrightness;

void main() {
  // Soft circular point
  vec2 coord = gl_PointCoord - 0.5;
  float dist  = length(coord);
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.0, dist) * vLife * vBrightness;
  gl_FragColor = vec4(uColor * vBrightness, alpha);
}
`;

/**
 * Create an instanced particle system with `count` particles.
 * Returns { mesh, material } — add mesh to scene, tick material.uniforms.uTime each frame.
 *
 * @param {number} count        — particle count (default 40000)
 * @param {number} spread       — world-space spread radius (default 18)
 * @param {THREE.Color} color   — particle color
 */
export function createParticleSystem(count = 40000, spread = 18, color = new THREE.Color(0xffd700)) {
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(count * 3);
  const randoms   = new Float32Array(count);
  const offsets   = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r     = Math.random() * spread;
    const y     = (Math.random() - 0.5) * 10;
    positions[i * 3    ] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
    offsets[i * 3    ] = Math.cos(theta) * r;
    offsets[i * 3 + 1] = y;
    offsets[i * 3 + 2] = Math.sin(theta) * r;
    randoms[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aRandom',  new THREE.BufferAttribute(randoms, 1));
  geometry.setAttribute('aOffset',  new THREE.BufferAttribute(offsets, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader:   particleVert,
    fragmentShader: particleFrag,
    uniforms: {
      uTime:  { value: 0 },
      uSize:  { value: 180 },
      uColor: { value: color },
    },
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  });

  const mesh = new THREE.Points(geometry, material);
  return { mesh, material };
}


// ═══════════════════════════════════════════════════════════════════════════════
// Shader Tick — call each frame with elapsed time
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Update the `uTime` uniform on any ShaderMaterial or array of materials.
 * @param {THREE.ShaderMaterial|THREE.ShaderMaterial[]} materials
 * @param {number} elapsed — seconds since start
 */
export function tickShaders(materials, elapsed) {
  const list = Array.isArray(materials) ? materials : [materials];
  for (const mat of list) {
    if (mat?.uniforms?.uTime !== undefined) {
      mat.uniforms.uTime.value = elapsed;
    }
  }
}
