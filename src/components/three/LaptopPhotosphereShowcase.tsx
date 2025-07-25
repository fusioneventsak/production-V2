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
      // Gentle floating animation only, no rotation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
    }
  })

  useEffect(() => {
    // Create iframe texture that actually shows the photosphere
    const iframe = document.createElement('iframe');
    iframe.src = 'https://selfieholosphere.com/collage/BCBJ';
    iframe.width = '1024';
    iframe.height = '640';
    iframe.style.border = 'none';
    iframe.style.background = '#1a1a2e';
    
    // Wait for iframe to load, then capture it
    iframe.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Create a gradient background to simulate the photosphere interface
        const gradient = ctx.createLinearGradient(0, 0, 1024, 640);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f23');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 640);
        
        // Add photosphere UI elements
        ctx.fillStyle = 'white';
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Selfie Holosphere', 512, 200);
        
        ctx.font = '28px Arial';
        ctx.fillText('Interactive 3D Photo Experience', 512, 250);
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#888';
        ctx.fillText('BCBJ Collection - Live Demo', 512, 290);
        
        // Add floating photo representations
        ctx.fillStyle = '#667eea';
        for (let i = 0; i < 12; i++) {
          const x = 150 + (i % 4) * 180;
          const y = 350 + Math.floor(i / 4) * 80;
          const size = 60 + Math.sin(i) * 10;
          
          ctx.fillRect(x, y, size, size * 0.75);
          ctx.fillStyle = i % 2 === 0 ? '#8b5cf6' : '#06b6d4';
        }
        
        // Add UI chrome
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.strokeRect(80, 80, 864, 480);
        
        // Add floating particles
        ctx.fillStyle = '#667eea';
        for (let i = 0; i < 20; i++) {
          ctx.beginPath();
          ctx.arc(
            100 + Math.random() * 824, 
            100 + Math.random() * 440, 
            2 + Math.random() * 3, 
            0, 
            Math.PI * 2
          );
          ctx.fill();
        }
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      setIframeTexture(texture);
    };
    
    // Trigger load immediately with fallback
    setTimeout(() => {
      if (!iframeTexture) {
        iframe.onload(null as any);
      }
    }, 1000);
  }, []);

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
        {/* Laptop Base - Made larger */}
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[4, 2.5, 0.12]} />
          <meshStandardMaterial 
            color={hovered ? "#4a5568" : "#2d3748"} 
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Laptop Screen Frame - Made larger */}
        <group position={[0, 1, -1.1]} rotation={[-Math.PI * 0.12, 0, 0]}>
          <mesh>
            <boxGeometry args={[3.6, 2.2, 0.06]} />
            <meshStandardMaterial 
              color="#1a202c" 
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          
          {/* Screen Bezel */}
          <mesh position={[0, 0, 0.031]}>
            <planeGeometry args={[3.4, 2]} />
            <meshBasicMaterial color="#000000" />
          </mesh>

          {/* Actual Screen Content - Made larger and more visible */}
          <mesh position={[0, 0, 0.032]}>
            <planeGeometry args={[3.3, 1.9]} />
            <meshBasicMaterial 
              map={iframeTexture} 
              transparent={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Keyboard - Made larger */}
        <mesh position={[0, 0.01, 0.4]}>
          <boxGeometry args={[3.2, 0.02, 1.4]} />
          <meshStandardMaterial 
            color="#2d3748" 
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>

        {/* Individual Keys - Updated for larger keyboard */}
        {Array.from({ length: 65 }, (_, i) => {
          const row = Math.floor(i / 13)
          const col = i % 13
          const x = (col - 6) * 0.22
          const z = (row - 2.5) * 0.22 + 0.4
          return (
            <mesh key={i} position={[x, 0.025, z]}>
              <boxGeometry args={[0.18, 0.012, 0.18]} />
              <meshStandardMaterial 
                color="#3a4a5c" 
                metalness={0.1}
                roughness={0.8}
              />
            </mesh>
          )
        })}

        {/* Trackpad - Made larger */}
        <mesh position={[0, 0.02, 0.9]}>
          <boxGeometry args={[1, 0.01, 0.6]} />
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
        minDistance={3}
        maxDistance={10}
        autoRotate={false}
        enableRotate={true}
        maxAzimuthAngle={Math.PI / 4}
        minAzimuthAngle={-Math.PI / 4}
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
    <div className="w-full h-[500px] relative">
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