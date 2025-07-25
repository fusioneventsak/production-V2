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
    // Create a more realistic photosphere interface simulation
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Dark background like the actual site
      const gradient = ctx.createLinearGradient(0, 0, 1280, 800);
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(0.5, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1280, 800);
      
      // Add the main title
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Selfie Holosphere', 640, 120);
      
      ctx.font = '28px Arial';
      ctx.fillStyle = '#a0a0a0';
      ctx.fillText('BCBJ Collection - Live Interactive Experience', 640, 160);
      
      // Add floating 3D photo representations in a sphere-like arrangement
      const photos = [
        { x: 320, y: 280, size: 80, rotation: -15, color: '#8b5cf6' },
        { x: 520, y: 240, size: 90, rotation: 10, color: '#06b6d4' },
        { x: 760, y: 290, size: 75, rotation: -8, color: '#f59e0b' },
        { x: 960, y: 260, size: 85, rotation: 20, color: '#10b981' },
        { x: 400, y: 380, size: 70, rotation: 25, color: '#ec4899' },
        { x: 640, y: 340, size: 95, rotation: -12, color: '#3b82f6' },
        { x: 880, y: 390, size: 80, rotation: 15, color: '#ef4444' },
        { x: 280, y: 480, size: 75, rotation: -20, color: '#8b5cf6' },
        { x: 580, y: 450, size: 85, rotation: 8, color: '#06b6d4' },
        { x: 840, y: 500, size: 90, rotation: -25, color: '#f59e0b' },
      ];
      
      // Draw floating photos with perspective
      photos.forEach((photo, i) => {
        ctx.save();
        ctx.translate(photo.x, photo.y);
        ctx.rotate((photo.rotation * Math.PI) / 180);
        
        // Add shadow for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-photo.size/2 + 3, -photo.size*0.6 + 3, photo.size, photo.size * 0.6);
        
        // Photo frame
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-photo.size/2 - 2, -photo.size*0.6 - 2, photo.size + 4, photo.size * 0.6 + 4);
        
        // Photo content
        ctx.fillStyle = photo.color;
        ctx.fillRect(-photo.size/2, -photo.size*0.6, photo.size, photo.size * 0.6);
        
        // Add some photo details
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-photo.size/2 + 5, -photo.size*0.6 + 5, photo.size - 10, 8);
        ctx.fillRect(-photo.size/2 + 5, -photo.size*0.6 + 18, photo.size - 20, 6);
        
        ctx.restore();
      });
      
      // Add connecting lines to show 3D space
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      for (let i = 0; i < photos.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(photos[i].x, photos[i].y);
        ctx.lineTo(photos[i + 1].x, photos[i + 1].y);
        ctx.stroke();
      }
      
      // Add UI elements
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.fillRect(50, 650, 200, 100);
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 650, 200, 100);
      
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('🎯 Controls', 70, 680);
      ctx.fillText('📸 Photos: 47', 70, 700);
      ctx.fillText('🎨 Animation: Wave', 70, 720);
      ctx.fillText('⚡ Live Updates', 70, 740);
      
      // Add upload indicator
      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.fillRect(1030, 650, 200, 100);
      ctx.strokeStyle = '#06b6d4';
      ctx.strokeRect(1030, 650, 200, 100);
      
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.fillText('📱 Upload', 1050, 680);
      ctx.fillText('QR Code: BCBJ', 1050, 700);
      ctx.fillText('Recent: 2m ago', 1050, 720);
      ctx.fillText('✨ Real-time', 1050, 740);
      
      // Add floating particles
      ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 1280;
        const y = Math.random() * 800;
        const size = Math.random() * 3 + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    setIframeTexture(texture);
  }, []);

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.1}>
      <group
        ref={meshRef}
        position={position}
        rotation={rotation}
        scale={scale * 1.8}
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
    // Ensure camera is properly positioned for prominence
    if (camera) {
      camera.position.set(0, 1, 5)
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
    }
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
      
      {camera && (
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          minDistance={3}
          maxDistance={8}
          autoRotate={false}
          enableRotate={true}
          maxAzimuthAngle={Math.PI / 4}
          minAzimuthAngle={-Math.PI / 4}
        />
      )}
    </>
  )
}

const LaptopPhotosphereShowcase: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleError = (error: Error) => {
    console.error('3D Scene Error:', error)
    setError(error.message)
  }

  if (error) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="text-red-400 mb-2">Error loading 3D scene</div>
          <div className="text-gray-400 text-sm">WebGL might not be supported</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[600px] relative">
      {/* 3D Canvas */}
      <div className="w-full h-full">
        {isLoaded && (
          <Canvas
            shadows
            camera={{ position: [0, 1, 5], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
            onError={handleError}
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