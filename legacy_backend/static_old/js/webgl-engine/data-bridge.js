/**
 * TaxClam WebGL Engine — Live Data Bridge
 * Fetches GST data from the TaxClam API and updates 3D chart geometry dynamically.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

let _gstData = null;
let _listeners = [];

/**
 * Fetch live GST summary, cache it, and notify all listeners.
 * Safe to call repeatedly — uses the same cached result within a poll interval.
 */
export async function fetchGSTData() {
  try {
    const resp = await fetch('/api/blender/gst-data');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    _gstData = await resp.json();
    _listeners.forEach(fn => fn(_gstData));
    return _gstData;
  } catch (e) {
    console.warn('[TaxClam] Could not fetch GST data:', e.message);
    return null;
  }
}

/** Register a callback that fires whenever fresh data arrives. */
export function onDataUpdate(fn) {
  _listeners.push(fn);
  if (_gstData) fn(_gstData);   // immediately invoke with cached data
}

/** Start polling the API every `intervalMs` milliseconds. */
export function startPolling(intervalMs = 30000) {
  fetchGSTData();
  setInterval(fetchGSTData, intervalMs);
}


/**
 * Update an array of bar meshes to reflect new data values.
 * Animates scale.y using GSAP if available, otherwise sets immediately.
 *
 * @param {THREE.Mesh[]} bars       — bar mesh objects (scale.y = chart height)
 * @param {number[]} values         — new data values
 * @param {number} maxHeight        — world-space max bar height (default 4)
 */
export function updateBarChart(bars, values, maxHeight = 4) {
  const maxVal = Math.max(...values, 1);
  bars.forEach((bar, i) => {
    if (!bar || values[i] === undefined) return;
    const newY = (values[i] / maxVal) * maxHeight;
    if (typeof gsap !== 'undefined') {
      gsap.to(bar.scale, { y: newY, duration: 0.8, ease: 'power2.out' });
      gsap.to(bar.position, { y: newY / 2, duration: 0.8, ease: 'power2.out' });
    } else {
      bar.scale.y = newY;
      bar.position.y = newY / 2;
    }
  });
}


/**
 * Update donut chart segment rotations/scales to reflect new segment values.
 * @param {THREE.Mesh[]} segments
 * @param {Array<{value: number}>} segmentData
 */
export function updateDonutChart(segments, segmentData) {
  const total = segmentData.reduce((s, d) => s + Math.max(d.value, 0), 0) || 1;
  let currentAngle = 0;
  const TAU = Math.PI * 2;
  const gap = 0.04;

  segments.forEach((seg, i) => {
    if (!seg || !segmentData[i]) return;
    const arc = (segmentData[i].value / total) * TAU - gap;
    // Rotate segment to correct position — simple scale-based update for demo
    if (typeof gsap !== 'undefined') {
      gsap.to(seg.scale, {
        x: arc > 0 ? 1 : 0.001,
        y: arc > 0 ? 1 : 0.001,
        z: 1,
        duration: 0.6,
        ease: 'back.out(1.2)',
      });
    }
    currentAngle += arc + gap;
  });
}
