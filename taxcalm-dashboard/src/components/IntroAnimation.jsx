/**
 * TaxCalm — 10-Second Cinematic Web Intro
 * Built with @react-three/fiber + GSAP.
 * Plays once per session, then calls onComplete().
 */

import { useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from 'gsap'

// ─── Constants ───────────────────────────────────────────────────────────────
const N = 2600
const VIOLET  = new THREE.Color('#8b5cf6')
const INDIGO  = new THREE.Color('#818cf8')
const CYAN    = new THREE.Color('#38bdf8')

// ─── Position generators ─────────────────────────────────────────────────────
function genCenter(n) {
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const r = Math.random() * 0.3
    const t = Math.random() * Math.PI * 2
    const p = Math.acos(2 * Math.random() - 1)
    a[i*3]   = r * Math.sin(p) * Math.cos(t)
    a[i*3+1] = r * Math.sin(p) * Math.sin(t)
    a[i*3+2] = r * Math.cos(p)
  }
  return a
}
function genExplode(n) {
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const r = 8 + Math.random() * 14
    const t = Math.random() * Math.PI * 2
    const p = Math.acos(2 * Math.random() - 1)
    a[i*3]   = r * Math.sin(p) * Math.cos(t)
    a[i*3+1] = r * Math.sin(p) * Math.sin(t)
    a[i*3+2] = r * Math.cos(p) - 3
  }
  return a
}
function genOrbit(n) {
  const a = new Float32Array(n * 3)
  const gr = (1 + Math.sqrt(5)) / 2
  for (let i = 0; i < n; i++) {
    const theta = (2 * Math.PI * i) / gr
    const phi   = Math.acos(1 - (2 * (i + 0.5)) / n)
    const r     = 4.0 + (Math.random() - 0.5) * 1.4
    a[i*3]   = r * Math.sin(phi) * Math.cos(theta)
    a[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
    a[i*3+2] = r * Math.cos(phi)
  }
  return a
}

// ─── Shaders ─────────────────────────────────────────────────────────────────
const PART_VERT = /* glsl */`
  attribute vec3  aCenterPos;
  attribute vec3  aExplodePos;
  attribute vec3  aOrbitPos;
  attribute float aRand;
  uniform float uPhase;
  uniform float uTime;
  varying float vRand;

  void main() {
    float p1 = clamp(uPhase,       0.0, 1.0);
    float p2 = clamp(uPhase - 1.0, 0.0, 1.0);
    float s1 = smoothstep(0.0, 1.0, p1);
    float s2 = smoothstep(0.0, 1.0, p2);

    vec3 pos = mix(aCenterPos, aExplodePos, s1);
    pos       = mix(pos,        aOrbitPos,  s2);

    float angle = uTime * 0.3 * s2 + aRand * 6.283;
    float cosA = cos(angle * 0.4), sinA = sin(angle * 0.4);
    vec3 rotated = vec3(pos.x*cosA - pos.z*sinA, pos.y, pos.x*sinA + pos.z*cosA);
    pos = mix(pos, rotated, s2);

    float jitter = s1 * (1.0 - s2) * 0.7;
    pos += vec3(
      sin(uTime*2.3 + aRand*29.7)*jitter,
      cos(uTime*1.8 + aRand*17.5)*jitter,
      sin(uTime*1.5 + aRand*23.1)*jitter
    );

    vRand = aRand;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 3.0 * (260.0 / max(-mv.z, 1.0));
    gl_Position  = projectionMatrix * mv;
  }
`
const PART_FRAG = /* glsl */`
  uniform float uOpacity;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  varying float vRand;

  void main() {
    vec2  uv   = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;
    float core = pow(1.0 - smoothstep(0.0, 0.5, dist), 2.0);
    // three-way mix: violet → indigo → cyan
    vec3  col  = vRand < 0.5 ? mix(uColorA, uColorB, vRand * 2.0)
                              : mix(uColorB, vec3(0.22, 0.74, 0.98), (vRand - 0.5) * 2.0);
    col = mix(col, vec3(0.95, 0.93, 1.0), core * 0.45);
    gl_FragColor = vec4(col, core * uOpacity * mix(0.55, 1.0, vRand));
  }
`
const GOLD_VERT = /* glsl */`
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    float w = sin(position.x*5.0+uTime*1.4)*0.035
            + cos(position.y*4.0+uTime*1.1)*0.028
            + sin(position.z*3.5+uTime*0.9)*0.022;
    vec3 d = position + normal * w;
    vec4 mv = modelViewMatrix * vec4(d,1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`
const GOLD_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec2 vUv;
  void main() {
    vec3  n   = normalize(vNormal);
    vec3  v   = normalize(-vViewPos);
    float rim = pow(1.0 - abs(dot(n,v)), 3.5);
    float sc1 = 0.5 + 0.5*sin(vUv.y*26.0 + uTime*2.8);
    float sc2 = 0.5 + 0.5*cos(vUv.x*14.0 - uTime*1.6);
    // violet core → indigo shimmer → cyan rim glow
    vec3 base  = vec3(0.55, 0.36, 0.98);  // #8b5cf6 violet
    vec3 mid   = vec3(0.51, 0.55, 0.98);  // #818cf8 indigo
    vec3 edge  = vec3(0.22, 0.74, 0.98);  // #38bdf8 cyan
    vec3 col = mix(base, mid, sc1*0.5 + sc2*0.25);
    col = mix(col, edge, rim * 0.65);
    col += vec3(0.70, 0.60, 1.0)*rim*1.2;
    col += mix(base, edge, sc2) * sc1 * 0.15;
    gl_FragColor = vec4(col, uOpacity);
  }
`
const HOLO_VERT = /* glsl */`
  varying vec3 vNormal; varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`
const HOLO_FRAG = /* glsl */`
  uniform float uTime; uniform float uOpacity; uniform vec3 uColor;
  varying vec3 vNormal; varying vec2 vUv;
  void main() {
    vec3  n  = normalize(vNormal);
    float rim = pow(1.0 - abs(n.z), 2.5);
    float s1  = 0.5 + 0.5*sin(vUv.y*28.0 + uTime*1.8);
    float s2  = 0.5 + 0.5*cos(vUv.x*16.0 - uTime*2.2);
    // Tint toward landing page accent colors on edges
    vec3 tint = mix(uColor, vec3(0.22, 0.74, 0.98), rim * 0.4);  // cyan rim
    vec3 col  = mix(tint, vec3(1.0), s1*0.18 + s2*0.08 + rim*0.38);
    gl_FragColor = vec4(col, (0.15 + rim*0.60 + s1*0.09)*uOpacity);
  }
`

// ─── Particle mesh ────────────────────────────────────────────────────────────
function Particles({ phaseRef, opacityRef }) {
  const meshRef = useRef()
  const { center, explode, orbit, rand } = useMemo(() => ({
    center:  genCenter(N),
    explode: genExplode(N),
    orbit:   genOrbit(N),
    rand:    Float32Array.from({ length: N }, () => Math.random()),
  }), [])

  const uniforms = useMemo(() => ({
    uPhase:   { value: 0.0 },
    uTime:    { value: 0.0 },
    uOpacity: { value: 1.0 },
    uColorA:  { value: VIOLET.clone() },
    uColorB:  { value: INDIGO.clone() },
  }), [])

  useFrame(({ clock }) => {
    uniforms.uPhase.value   = phaseRef.current
    uniforms.uTime.value    = clock.getElapsedTime()
    uniforms.uOpacity.value = opacityRef.current
  })

  return (
    <points ref={meshRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position"    args={[center.slice(), 3]} />
        <bufferAttribute attach="attributes-aCenterPos"  args={[center,  3]} />
        <bufferAttribute attach="attributes-aExplodePos" args={[explode, 3]} />
        <bufferAttribute attach="attributes-aOrbitPos"   args={[orbit,   3]} />
        <bufferAttribute attach="attributes-aRand"       args={[rand,    1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={PART_VERT}
        fragmentShader={PART_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ─── Torus knot ────────────────────────────────────────────────────────────
function GoldKnot({ knotOpacityRef }) {
  const meshRef = useRef()
  const matRef  = useRef()
  const uniforms = useMemo(() => ({
    uTime:    { value: 0.0 },
    uOpacity: { value: 0.0 },
  }), [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    uniforms.uTime.value    = clock.getElapsedTime()
    uniforms.uOpacity.value = knotOpacityRef.current
    meshRef.current.rotation.y += 0.007
    meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.38) * 0.22
  })

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1.35, 0.40, 220, 32, 2, 3]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={GOLD_VERT}
        fragmentShader={GOLD_FRAG}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─── Holographic cards ────────────────────────────────────────────────────────
const CARD_COLORS  = ['#8b5cf6', '#38bdf8', '#818cf8']
const CARD_FINAL_X = [-2.9, 2.9, 0]
const CARD_FINAL_Y = -1.8

function HoloCards({ cardOpacitiesRef, cardPosRef }) {
  const refs    = [useRef(), useRef(), useRef()]
  const matRefs = [useRef(), useRef(), useRef()]

  const uniformsArr = useMemo(() =>
    CARD_COLORS.map(col => ({
      uTime:    { value: 0.0 },
      uOpacity: { value: 0.0 },
      uColor:   { value: new THREE.Color(col) },
    })), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    refs.forEach((ref, i) => {
      if (!ref.current) return
      uniformsArr[i].uTime.value    = t
      uniformsArr[i].uOpacity.value = cardOpacitiesRef.current[i]
      ref.current.position.x   = cardPosRef.current[i].x
      ref.current.position.y   = CARD_FINAL_Y + Math.sin(t * 0.85 + i * 2.1) * 0.10
      ref.current.rotation.y   = Math.sin(t * 0.55 + i * 1.18) * 0.14
      ref.current.rotation.x   = Math.sin(t * 0.42 + i * 0.90) * 0.06
    })
  })

  return (
    <>
      {CARD_COLORS.map((_, i) => (
        <mesh key={i} ref={refs[i]}
          position={[i === 0 ? -14 : i === 1 ? 14 : 0, i === 2 ? -9 : CARD_FINAL_Y, -3.5]}>
          <boxGeometry args={[2.3, 1.25, 0.07]} />
          <shaderMaterial
            ref={matRefs[i]}
            vertexShader={HOLO_VERT}
            fragmentShader={HOLO_FRAG}
            uniforms={uniformsArr[i]}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  )
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars() {
  const pos = useMemo(() => {
    const a = new Float32Array(700 * 3)
    for (let i = 0; i < 700; i++) {
      a[i*3]   = (Math.random() - 0.5) * 180
      a[i*3+1] = (Math.random() - 0.5) * 180
      a[i*3+2] = (Math.random() - 0.5) * 180
    }
    return a
  }, [])
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.09} transparent opacity={0.35}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

// ─── Grid ─────────────────────────────────────────────────────────────────────
function Grid() {
  return <gridHelper args={[50, 40, '#1a2f55', '#0d1c38']} position={[0, -5, 0]}
    material-transparent material-opacity={0.22} />
}

// ─── Camera controller ────────────────────────────────────────────────────────
function CameraRig({ camPosRef }) {
  const { camera } = useThree()
  useFrame(() => {
    camera.position.lerp(camPosRef.current, 0.04)
    camera.lookAt(0, 0, 0)
  })
  return null
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function IntroScene({ phaseRef, opacityRef, knotOpacityRef, cardOpacitiesRef, cardPosRef, camPosRef }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 4, 6]}    intensity={6}  distance={40} color="#8b5cf6" />
      <pointLight position={[-5, -2, 3]}  intensity={3}  distance={25} color="#38bdf8" />
      <pointLight position={[5, 1, -4]}   intensity={2}  distance={30} color="#818cf8" />
      <Stars />
      <Grid />
      <Particles phaseRef={phaseRef} opacityRef={opacityRef} />
      <GoldKnot knotOpacityRef={knotOpacityRef} />
      <HoloCards cardOpacitiesRef={cardOpacitiesRef} cardPosRef={cardPosRef} />
      <CameraRig camPosRef={camPosRef} />
    </>
  )
}

// ── Sound Effects: disabled (now using audio file) ──────────────────────────
function initIntroAudio() {
  // Create audio element lazily (only after user interaction)
  let audio = null
  let started = false
  
  const playAudio = () => {
    if (started) return
    started = true
    
    console.log('[Audio] Creating audio element after user interaction...')
    
    try {
      audio = new Audio()
      audio.volume = 0.8
      audio.src = '/audio/intro.m4a'
      audio.preload = 'auto'
      audio.crossOrigin = 'anonymous'
      
      console.log('[Audio] Audio created, src:', audio.src)
      
      audio.addEventListener('play', () => console.log('[Audio] Playing!'))
      audio.addEventListener('playing', () => console.log('[Audio] Audio is playing!'))
      audio.addEventListener('error', () => console.error('[Audio] Error loading:', audio.error?.message))
      
      // Play immediately (will work because we're in a user interaction handler)
      const playPromise = audio.play()
      if (playPromise) {
        playPromise
          .then(() => console.log('[Audio] Play succeeded!'))
          .catch(err => console.error('[Audio] Play failed:', err.message))
      }
    } catch (e) {
      console.error('[Audio] Error:', e.message)
    }
  }
  
  // Listen for first click or touch anywhere on document
  const handleInteraction = (e) => {
    console.log('[Audio] User interaction detected:', e.type)
    playAudio()
    cleanup()
  }
  
  const cleanup = () => {
    document.removeEventListener('click', handleInteraction)
    document.removeEventListener('touchstart', handleInteraction)
  }
  
  document.addEventListener('click', handleInteraction)
  document.addEventListener('touchstart', handleInteraction)
  
  return { 
    audio: () => audio,
    timers: [],
    cleanup
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function IntroAnimation({ onComplete }) {
  const overlayRef  = useRef()
  const logoRef     = useRef()
  const taglineRef  = useRef()
  const subRef      = useRef()
  const skipRef     = useRef()


  // Shared mutable refs (written by GSAP, read by R3F each frame — no re-renders)
  const phaseRef        = useRef(0)
  const opacityRef      = useRef(1)
  const knotOpacityRef  = useRef(0)
  const cardOpacitiesRef= useRef([0, 0, 0])
  const cardPosRef      = useRef([
    new THREE.Vector3(-14, CARD_FINAL_Y, -3.5),
    new THREE.Vector3( 14, CARD_FINAL_Y, -3.5),
    new THREE.Vector3(  0,          -9, -3.5),
  ])
  const camPosRef = useRef(new THREE.Vector3(0, 0, 4.5))

  const [overlayOpacity, setOverlayOpacity] = useState(1)

  useEffect(() => {
    // Clear any previous session flag so sound + intro always plays on page load
    sessionStorage.removeItem('tc_intro_seen')
    const tl = gsap.timeline()

    // 0–2.5s : center → explosion
    tl.to(phaseRef, { current: 1.0, duration: 2.5, ease: 'power3.out' }, 0)
    tl.to(camPosRef.current, { z: 11, y: 1.8, duration: 4.0, ease: 'power2.inOut' }, 0.3)

    // 2.5–5.5s : explosion → orbit
    tl.to(phaseRef, { current: 2.0, duration: 3.0, ease: 'power2.inOut' }, 2.5)

    // 3.5–6s : gold knot materialises
    tl.to(knotOpacityRef, { current: 1.0, duration: 2.5, ease: 'power3.out' }, 3.5)
    tl.to(opacityRef,     { current: 0.45, duration: 2.0, ease: 'power2.in' }, 3.8)

    // 4–7s : camera sweep
    tl.to(camPosRef.current, { x: 3.5, y: 3.5, z: 14, duration: 3.0, ease: 'power1.inOut' }, 4.0)

    // 5–7.5s : cards fly in
    ;[0, 1, 2].forEach(i => {
      const t0 = 5.0 + i * 0.35
      tl.to(cardOpacitiesRef.current, {
        [i]: 1.0, duration: 1.0, ease: 'power2.out',
      }, t0)
      if (i === 0) tl.to(cardPosRef.current[0], { x: -2.9, duration: 1.3, ease: 'back.out(1.3)' }, t0)
      if (i === 1) tl.to(cardPosRef.current[1], { x:  2.9, duration: 1.3, ease: 'back.out(1.3)' }, t0)
      if (i === 2) tl.to(cardPosRef.current[2], { y: CARD_FINAL_Y, duration: 1.3, ease: 'back.out(1.3)' }, t0)
    })

    // 7.2–9.5s : boom shot
    tl.to(camPosRef.current, { x: 0, y: 2.2, z: 15, duration: 2.3, ease: 'power2.inOut' }, 7.2)

    // 8.5–10s : fade out everything
    tl.to(opacityRef,      { current: 0, duration: 1.5, ease: 'power2.in' }, 8.5)
    tl.to(knotOpacityRef,  { current: 0, duration: 1.5, ease: 'power2.in' }, 8.5)
    ;[0, 1, 2].forEach(i => {
      tl.to(cardOpacitiesRef.current, { [i]: 0, duration: 1.5, ease: 'power2.in' }, 8.5)
    })
    tl.to({ v: 1 }, {
      v: 0, duration: 1.5, ease: 'power2.inOut',
      onUpdate: function() { setOverlayOpacity(this.targets()[0].v) },
      onComplete: () => {
        sessionStorage.setItem('tc_intro_seen', '1')
        onComplete()
      },
    }, 8.5)

    // CSS reveals
    const timers = [
      setTimeout(() => logoRef.current?.classList.add('tc-visible'),    1100),
      setTimeout(() => taglineRef.current?.classList.add('tc-visible'), 3400),
      setTimeout(() => subRef.current?.classList.add('tc-visible'),     4800),
      setTimeout(() => skipRef.current?.classList.add('tc-visible'),    1600),
    ]

    const skipFn = () => { tl.seek(8.5); tl.timeScale(3) }
    skipRef.current?.addEventListener('click', skipFn)

    // Hard safety
    const safetyId = setTimeout(() => {
      sessionStorage.setItem('tc_intro_seen', '1')
      onComplete()
    }, 12000)

    // Auto SFX (plays on first click/touch)
    const audio   = initIntroAudio()
    
    return () => {
      tl.kill()
      timers.forEach(clearTimeout)
      clearTimeout(safetyId)
      skipRef.current?.removeEventListener('click', skipFn)
      audio?.timers?.forEach(clearTimeout)
      audio?.audio?.()?.pause()
      audio?.cleanup?.()
    }
  }, [onComplete])

  return (
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#050510', overflow: 'hidden',
      opacity: overlayOpacity,
    }}>
      {/* Three.js canvas */}
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        camera={{ fov: 58, near: 0.1, far: 300, position: [0, 0, 4.5] }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
        onCreated={({ scene }) => { scene.fog = new THREE.FogExp2(0x050510, 0.016) }}
      >
        <IntroScene
          phaseRef={phaseRef}
          opacityRef={opacityRef}
          knotOpacityRef={knotOpacityRef}
          cardOpacitiesRef={cardOpacitiesRef}
          cardPosRef={cardPosRef}
          camPosRef={camPosRef}
        />
      </Canvas>

      {/* Letterbox bars */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '8vh',
        background: '#050510', zIndex: 4,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '8vh',
        background: '#050510', zIndex: 4,
      }} />

      {/* UI layer */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', zIndex: 5, gap: '0.6rem',
      }}>
        <div ref={logoRef} className="tc-intro-logo">
          <span style={{ color: '#ffffff' }}>Tax</span>
          <span style={{
            background: 'linear-gradient(120deg, #a78bfa, #818cf8, #38bdf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 40px rgba(139,92,246,0.8))',
          }}>Calm</span>
        </div>
        <div ref={taglineRef} className="tc-intro-tagline">AI-Powered Tax Platform for Indian MSMEs</div>
        <div ref={subRef} className="tc-intro-sub">GSTN Compliant · Bank-grade AES-256 · 2026</div>
      </div>

      {/* Skip button */}
      <button ref={skipRef} className="tc-intro-skip">Skip intro ↓</button>

      {/* Film grain */}
      <div className="tc-intro-grain" />

      <style>{`
        .tc-intro-logo {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: clamp(4.5rem, 14vw, 10rem);
          font-weight: 900;
          letter-spacing: -0.05em;
          line-height: 1;
          opacity: 0;
          transform: scale(0.88) translateY(24px);
          filter: blur(24px);
          transition: opacity 1.4s cubic-bezier(0.16,1,0.3,1),
                      transform 1.4s cubic-bezier(0.16,1,0.3,1),
                      filter 1.4s cubic-bezier(0.16,1,0.3,1);
        }
        .tc-intro-logo.tc-visible {
          opacity: 1; transform: scale(1) translateY(0); filter: blur(0);
        }
        .tc-intro-tagline {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: clamp(0.85rem, 2.5vw, 1.5rem);
          font-weight: 300;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          opacity: 0; transform: translateY(12px);
          transition: opacity 1.1s ease 0.1s, transform 1.1s ease 0.1s;
        }
        .tc-intro-tagline.tc-visible { opacity: 1; transform: translateY(0); }
        .tc-intro-sub {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: clamp(0.65rem, 1.2vw, 0.85rem);
          font-weight: 400;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #a78bfa;
          opacity: 0;
          transition: opacity 1.0s ease;
        }
        .tc-intro-sub.tc-visible { opacity: 0.85; }
        .tc-intro-skip {
          position: absolute; bottom: calc(8vh + 1.5rem); right: 2rem;
          background: rgba(124,58,237,0.12);
          border: 1px solid rgba(124,58,237,0.25);
          color: rgba(167,139,250,0.6);
          font-family: 'Inter', sans-serif;
          font-size: 0.75rem; font-weight: 500;
          letter-spacing: 0.08em;
          padding: 0.45rem 1.1rem; border-radius: 6px;
          cursor: pointer; pointer-events: all; z-index: 6;
          opacity: 0;
          transition: opacity 0.6s ease, background 0.2s, color 0.2s;
        }
        .tc-intro-skip.tc-visible { opacity: 1; }
        .tc-intro-skip:hover { background: rgba(124,58,237,0.25); color: #e9d5ff; }
        .tc-intro-grain {
          position: absolute; inset: 0; z-index: 7;
          pointer-events: none; opacity: 0.04;
          background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/></filter><rect width='256' height='256' filter='url(%23n)' opacity='1'/></svg>");
          background-size: 200px 200px;
          animation: tc-grain 0.35s steps(1) infinite;
        }
        @keyframes tc-grain {
          0%  { background-position: 0 0; }
          25% { background-position: -50px -30px; }
          50% { background-position: 20px 60px; }
          75% { background-position: -80px 10px; }
        }
      `}</style>
    </div>
  )
}
