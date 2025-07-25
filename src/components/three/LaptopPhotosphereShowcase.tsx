"use client"

import React, { useRef, useState, useEffect, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Float } from "@react-three/drei"
import * as THREE from "three"

interface LaptopModelProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

const LaptopModel: React.FC<LaptopModelProps> = ({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1 
}) => {
  const meshRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [iframeTexture, setIframeTexture] = useState<THREE.CanvasTexture | null>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
    }
  })

  useEffect(() => {
    // Create a canvas that will display the iframe content
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 640
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Create a loading state
      const gradient = ctx.createLinearGradient(0, 0, 1024, 640)
      gradient.addColorStop(0, '#1a1a2e')
      gradient.addColorStop(0.5, '#16213e')
      gradient.addColorStop(1, '#0f0f23')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 1024, 640)
      
      // Add loading text
      ctx.fillStyle = 'white'
      ctx.font = 'bold 32px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Selfie Holosphere', 512, 280)
      ctx.font = '20px Arial'
      ctx.fillText('Interactive Photosphere Experience', 512, 320)
      ctx.font = '16px Arial'
      ctx.fillStyle = '#888'
      ctx.fillText('Loading...', 512, 360)
      
      // Add some visual elements
      ctx.strokeStyle = '#667eea'
      ctx.lineWidth = 2
      ctx.strokeRect(50, 50, 924, 540)
      
      // Add dots animation placeholder
      ctx.fillStyle = '#667eea'
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(480 + i * 20, 400, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    setIframeTexture(texture)
  }, [])

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.1}>
      <group
        ref={meshRef}
        position={position}
        rotation={rotation}
        scale={scale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Laptop Base */}
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[3, 2, 0.1]} />
          <meshStandardMaterial 
            color={hovered ? "#4a5568" : "#2d3748"} 
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Laptop Screen Frame */}
        <group position={[0, 0.8, -0.9]} rotation={[-Math.PI * 0.15, 0, 0]}>
          <mesh>
            <boxGeometry args={[2.8, 1.8, 0.05]} />
            <meshStandardMaterial 
              color="#1a202c" 
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          
          {/* Screen Bezel */}
          <mesh position={[0, 0, 0.026]}>
            <planeGeometry args={[2.6, 1.6]} />
            <meshBasicMaterial color="#000000" />
          </mesh>

          {/* Actual Screen Content */}
          <mesh position={[0, 0, 0.027]}>
            <planeGeometry args={[2.5, 1.5]} />
            <meshBasicMaterial map={iframeTexture} />
          </mesh>
        </group>

        {/* Keyboard */}
        <mesh position={[0, 0.01, 0.3]}>
          <boxGeometry args={[2.4, 0.02, 1.2]} />
          <meshStandardMaterial 
            color="#2d3748" 
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>

        {/* Individual Keys */}
        {Array.from({ length: 60 }, (_, i) => {
          const row = Math.floor(i / 12)
          const col = i % 12
          const x = (col - 5.5) * 0.18
          const z = (row - 2) * 0.18 + 0.3
          return (
            <mesh key={i} position={[x, 0.025, z]}>
              <boxGeometry args={[0.15, 0.01, 0.15]} />
              <meshStandardMaterial 
                color="#3a4a5c" 
                metalness={0.1}
                roughness={0.8}
              />
            </mesh>
          )
        })}

        {/* Trackpad */}
        <mesh position={[0, 0.02, 0.7]}>
          <boxGeometry args={[0.8, 0.01, 0.5]} />
          <meshStandardMaterial 
            color="#4a5568" 
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>

        {/* Screen glow */}
        <pointLight 
          position={[0, 1, -0.5]} 
          intensity={hovered ? 0.6 : 0.3} 
          color="#667eea"
          distance={2}
        />
      </group>
    </Float>
  )
}

const Scene: React.FC = () => {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(0, 2, 4)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-3, 3, 3]} intensity={0.3} color="#764ba2" />
      
      <LaptopModel />
      
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        minDistance={2.5}
        maxDistance={8}
        autoRotate={true}
        autoRotateSpeed={0.8}
      />
    </>
  )
}

const LaptopPhotosphereShowcase: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full h-96 relative">
      {/* 3D Canvas */}
      <div className="w-full h-full">
        {isLoaded && (
          <Canvas
            shadows
            camera={{ position: [0, 2, 4], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
          >
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-600 text-lg">Loading 3D Model...</div>
        </div>
      )}

      {/* Hidden iframe for actual functionality */}
      <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none opacity-0">
        <iframe
          src="https://selfieholosphere.com/collage/BCBJ"
          title="Selfie Holosphere Collage"
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  )
}

export default LaptopPhotosphereShowcase