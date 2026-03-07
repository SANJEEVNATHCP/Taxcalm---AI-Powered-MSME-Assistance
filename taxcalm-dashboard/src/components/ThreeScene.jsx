import { useRef, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sphere, Torus, Octahedron } from '@react-three/drei'
import * as THREE from 'three'

function MouseLight() {
  const light = useRef()
  const mouse = useRef({ x: 0, y: 0 })
  const target = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const h = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 14
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 10
    }
    window.addEventListener('mousemove', h, { passive: true })
    return () => window.removeEventListener('mousemove', h)
  }, [])
  useFrame(() => {
    target.current.x += (mouse.current.x - target.current.x) * 0.05
    target.current.y += (mouse.current.y - target.current.y) * 0.05
    if (light.current) {
      light.current.position.x = target.current.x
      light.current.position.y = target.current.y
    }
  })
  return <pointLight ref={light} intensity={60} distance={20} color="#8b5cf6" decay={2} />
}

function Particles({ count = 1000 }) {
  const mesh = useRef()
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const palette = [
      new THREE.Color('#8b5cf6'),
      new THREE.Color('#6366f1'),
      new THREE.Color('#38bdf8'),
      new THREE.Color('#c084fc'),
    ]
    for (let i = 0; i < count; i++) {
      const r = 18 + Math.random() * 12
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi) - 5
      const c = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }
    return { positions, colors }
  }, [count])
  useFrame((_, delta) => { if (mesh.current) mesh.current.rotation.y += delta * 0.02 })
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.065} vertexColors sizeAttenuation transparent opacity={0.7} />
    </points>
  )
}

function WireShape({ position, scale = 1, speed = 1, color = '#8b5cf6' }) {
  const mesh = useRef()
  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * 0.18 * speed
      mesh.current.rotation.y += delta * 0.22 * speed
    }
  })
  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.8}>
      <Octahedron ref={mesh} args={[1, 0]} position={position} scale={scale}>
        <meshStandardMaterial color={color} wireframe opacity={0.35} transparent />
      </Octahedron>
    </Float>
  )
}

function FloatOrb({ position, color, scale = 1, speed = 1, distort = 0.4 }) {
  return (
    <Float speed={speed} rotationIntensity={0.6} floatIntensity={1.2}>
      <Sphere args={[1, 48, 48]} position={position} scale={scale}>
        <MeshDistortMaterial color={color} distort={distort} speed={2}
          roughness={0} metalness={0.1} transparent opacity={0.18} />
      </Sphere>
    </Float>
  )
}

function RingGroup() {
  const group = useRef()
  const mouse = useRef({ x: 0, y: 0 })
  const target = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const h = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 0.6
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 0.4
    }
    window.addEventListener('mousemove', h, { passive: true })
    return () => window.removeEventListener('mousemove', h)
  }, [])
  useFrame((_, delta) => {
    target.current.x += (mouse.current.x - target.current.x) * 0.03
    target.current.y += (mouse.current.y - target.current.y) * 0.03
    if (group.current) {
      group.current.rotation.y = target.current.x
      group.current.rotation.x = target.current.y
      group.current.rotation.z += delta * 0.05
    }
  })
  return (
    <group ref={group} position={[3.5, 0, 0]}>
      <Sphere args={[1.8, 48, 48]}>
        <meshStandardMaterial color="#4c1d95" roughness={0.05} metalness={0.8} transparent opacity={0.12} />
      </Sphere>
      <Torus args={[2.2, 0.06, 16, 100]}>
        <meshStandardMaterial color="#a78bfa" opacity={0.45} transparent emissive="#7c3aed" emissiveIntensity={0.3} />
      </Torus>
      <Torus args={[2.7, 0.04, 16, 100]} rotation={[0.5, 0, 0.3]}>
        <meshStandardMaterial color="#818cf8" opacity={0.3} transparent emissive="#6d28d9" emissiveIntensity={0.2} />
      </Torus>
    </group>
  )
}

function CameraRig() {
  const { camera } = useThree()
  const mouse = useRef({ x: 0, y: 0 })
  const target = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const h = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 1.5
    }
    window.addEventListener('mousemove', h, { passive: true })
    return () => window.removeEventListener('mousemove', h)
  }, [])
  useFrame((_, delta) => {
    target.current.x += (mouse.current.x * 0.5 - target.current.x) * 0.04
    target.current.y += (mouse.current.y * 0.3 - target.current.y) * 0.04
    camera.position.x += (target.current.x - camera.position.x) * 0.05
    camera.position.y += (target.current.y - camera.position.y) * 0.05
    camera.lookAt(0, 0, 0)
  })
  return null
}

function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, -2]}>
      <planeGeometry args={[60, 60, 40, 40]} />
      <meshBasicMaterial color="#4c1d95" wireframe opacity={0.07} transparent />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.4} color="#e0d7ff" />
      <pointLight position={[0, 0, 8]} intensity={8} color="#7c3aed" />
      <MouseLight />
      <CameraRig />
      <Suspense fallback={null}>
        <Particles count={1000} />
        <RingGroup />
        <FloatOrb position={[-6, 3, -3]} color="#6d28d9" scale={2} speed={0.8} distort={0.35} />
        <FloatOrb position={[-4, -3, -5]} color="#1d4ed8" scale={1.4} speed={1.1} distort={0.5} />
        <FloatOrb position={[6, -2, -6]} color="#7c3aed" scale={1.8} speed={0.7} distort={0.3} />
        <WireShape position={[-7, 1, -2]} scale={0.7} speed={0.6} color="#a78bfa" />
        <WireShape position={[7, 4, -4]} scale={0.9} speed={0.9} color="#818cf8" />
        <WireShape position={[-3, -4, -1]} scale={0.5} speed={1.2} color="#c084fc" />
        <WireShape position={[2, 5, -3]} scale={0.6} speed={0.7} color="#38bdf8" />
        <GridFloor />
      </Suspense>
    </>
  )
}

export default function ThreeScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      onCreated={({ gl }) => { gl.setClearColor(0x000000, 0) }}>
      <Scene />
    </Canvas>
  )
}
