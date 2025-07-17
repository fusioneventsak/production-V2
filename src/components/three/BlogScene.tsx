import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';
import { PARTICLE_THEMES } from './MilkyWayParticleSystem';

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

// Simplified photo list for blog background - fewer photos for better performance
const BLOG_PHOTOS = [
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1574391884720-bbc049ec09ad?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1520637836862-4d197d17c13a?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=600&fit=crop&crop=center'
];

interface PhotoProps {
  position: [number, number, number];
  rotation: [number, number, number];
  imageUrl: string;
  index: number;
  isMobile: boolean;
}

const FloatingPhoto: React.FC<PhotoProps> = ({ position, rotation, imageUrl, index, isMobile }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  // Load texture with error handling
  React.useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (loadedTexture) => {
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTexture);
        setIsLoaded(true);
      },
      undefined,
      (error) => {
        console.warn('Failed to load texture:', imageUrl, error);
        setIsLoaded(false);
      }
    );
  }, [imageUrl]);

  // Simplified animation for better performance
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Simpler animation for mobile
    if (isMobile) {
      // Very gentle floating motion
      const floatOffset = Math.sin(time * 0.3 + index * 0.5) * 0.2;
      groupRef.current.position.y = position[1] + floatOffset;
      
      // Always face camera on mobile
      groupRef.current.lookAt(state.camera.position);
    } else {
      // More complex animation for desktop
      const floatOffset = Math.sin(time * 0.5 + index * 0.5) * 0.3;
      
      groupRef.current.lookAt(state.camera.position);
      
      const rotationOffset = Math.sin(time * 0.3 + index * 0.3) * 0.05;
      groupRef.current.rotation.z += rotationOffset;
      
      groupRef.current.position.y = position[1] + floatOffset;
    }
  });

  if (!isLoaded || !texture) {
    return null;
  }

  // Smaller photos on mobile
  const scale = isMobile ? 0.7 : 1.0;

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <mesh>
        <planeGeometry args={[1.4, 2.1]} />
        <meshStandardMaterial 
          map={texture}
          transparent
          side={THREE.DoubleSide}
          metalness={0}
          roughness={0.2}
          envMapIntensity={1.0}
          emissive="#ffffff"
          emissiveIntensity={0.25}
          emissiveMap={texture}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

// Simplified particle system for blog background
const SimplifiedParticleSystem: React.FC<{ colorTheme: typeof PARTICLE_THEMES[0], isMobile: boolean }> = ({ colorTheme, isMobile }) => {
  const particlesRef = useRef<THREE.Points>(null);
  
  // Fewer particles on mobile
  const PARTICLE_COUNT = isMobile ? 1000 : 2000;
  
  // Create particle distribution
  const particleData = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spread particles across a wide area
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      
      // Smaller particles on mobile
      sizes[i] = isMobile ? 
        0.5 + Math.random() * 1.0 : // Mobile: smaller particles
        0.5 + Math.random() * 2.0;  // Desktop: larger particles
    }
    
    return {
      positions,
      colors,
      sizes,
      count: PARTICLE_COUNT
    };
  }, [isMobile, PARTICLE_COUNT]);

  // Update colors when theme changes
  React.useEffect(() => {
    if (!particlesRef.current) return;
    
    const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
    for (let i = 0; i < particleData.count; i++) {
      const baseColor = new THREE.Color(colorTheme.primary);
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      
      const hueVariation = (Math.random() - 0.5) * 0.1;
      const saturationVariation = 0.8 + Math.random() * 0.4;
      const lightnessVariation = 0.3 + Math.random() * 0.7;
      
      const particleColor = new THREE.Color();
      particleColor.setHSL(
        (hsl.h + hueVariation + 1) % 1,
        Math.min(1, hsl.s * saturationVariation),
        Math.min(1, hsl.l * lightnessVariation)
      );
      
      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;
    }
    particlesRef.current.geometry.attributes.color.needsUpdate = true;
  }, [colorTheme, particleData]);

  // Simple animation
  useFrame((state) => {
    if (!particlesRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    // Simplified animation for better performance
    for (let i = 0; i < particleData.count; i += 10) { // Only update 1/10th of particles each frame
      const i3 = i * 3;
      const idx = (i + Math.floor(time * 10) % 10) * 3; // Stagger updates
      
      if (idx < positions.length - 3) {
        // Very gentle movement
        positions[idx] += Math.sin(time * 0.1 + i * 0.01) * 0.01;
        positions[idx + 1] += Math.cos(time * 0.1 + i * 0.01) * 0.01;
        positions[idx + 2] += Math.sin(time * 0.1 + i * 0.02) * 0.01;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.rotation.y = time * 0.02; // Very slow rotation
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={particleData.positions}
          count={particleData.count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={particleData.colors}
          count={particleData.count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          array={particleData.sizes}
          count={particleData.count}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        vertexShader={`
          attribute float size;
          varying vec3 vColor;
          varying float vOpacity;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            
            float distance = length(mvPosition.xyz);
            vOpacity = 1.0 - smoothstep(50.0, 200.0, distance);
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          varying float vOpacity;
          void main() {
            float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
            if (distanceToCenter > 0.5) discard;
            
            float alpha = 1.0 - (distanceToCenter * 2.0);
            alpha = smoothstep(0.0, 1.0, alpha);
            
            gl_FragColor = vec4(vColor, alpha * vOpacity * 0.5);
          }
        `}
      />
    </points>
  );
};

// Background gradient
const GradientBackground: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const gradientMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        colorTop: { value: new THREE.Color('#000000') },
        colorMid: { value: new THREE.Color('#4c1d95') },
        colorBottom: { value: new THREE.Color('#000000') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 colorTop;
        uniform vec3 colorMid;
        uniform vec3 colorBottom;
        varying vec2 vUv;
        void main() {
          vec3 color;
          if (vUv.y > 0.6) {
            color = colorTop;
          } else if (vUv.y > 0.3) {
            float factor = (vUv.y - 0.3) / 0.3;
            color = mix(colorMid, colorTop, factor);
          } else {
            float factor = vUv.y / 0.3;
            color = mix(colorBottom, colorMid, factor);
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
    });
  }, []);

  return (
    <mesh ref={meshRef} material={gradientMaterial}>
      <sphereGeometry args={[50, 32, 32]} />
    </mesh>
  );
};

// Smart camera controls - optimized for mobile
const SmartCameraControls: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const controlsRef = useRef<any>();
  const { camera } = useThree();
  const rotationAngle = useRef(0);
  
  useFrame((state) => {
    if (!camera || !camera.position) return;
    
    // Mobile: simple auto-rotation only, no user interaction
    if (isMobile) {
      rotationAngle.current += 0.001; // Very slow rotation for mobile
      
      const radius = 20;
      const height = 5;
      
      camera.position.x = Math.cos(rotationAngle.current) * radius;
      camera.position.y = height;
      camera.position.z = Math.sin(rotationAngle.current) * radius;
      
      camera.lookAt(0, 0, 0);
    }
    
    // Update controls for desktop
    if (!isMobile && controlsRef.current) {
      controlsRef.current.update();
    }
  });

  // Only render OrbitControls for desktop
  if (isMobile) {
    return null;
  }

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={false}
      enableRotate={true}
      rotateSpeed={0.5}
      minDistance={15}
      maxDistance={25}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI - Math.PI / 6}
      enableDamping={true}
      dampingFactor={0.1}
      autoRotate={true}
      autoRotateSpeed={0.5}
    />
  );
};

// Main scene component
const Scene: React.FC<{ particleTheme: typeof PARTICLE_THEMES[0], isMobile: boolean }> = ({ particleTheme, isMobile }) => {
  // Generate photo positions - fewer on mobile
  const photoCount = isMobile ? 8 : 15;
  
  const photoPositions = useMemo(() => {
    const positions: Array<{
      position: [number, number, number];
      rotation: [number, number, number];
      imageUrl: string;
    }> = [];

    // Distribute photos in a sphere around the camera
    for (let i = 0; i < photoCount; i++) {
      // Use golden ratio distribution for even spacing
      const phi = Math.acos(-1 + (2 * i) / photoCount);
      const theta = Math.sqrt(photoCount * Math.PI) * phi;
      
      // Radius varies with device
      const radius = isMobile ? 15 : 20;
      
      // Convert to Cartesian coordinates
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta) * 0.5; // Flatten vertically
      const z = radius * Math.cos(phi);
      
      // Random rotation
      const rotationX = (Math.random() - 0.5) * 0.3;
      const rotationY = (Math.random() - 0.5) * 0.6;
      const rotationZ = (Math.random() - 0.5) * 0.2;
      
      // Cycle through photos
      const imageUrl = BLOG_PHOTOS[i % BLOG_PHOTOS.length];
      
      positions.push({
        position: [x, y, z] as [number, number, number],
        rotation: [rotationX, rotationY, rotationZ] as [number, number, number],
        imageUrl: imageUrl,
      });
    }
    
    return positions;
  }, [photoCount, isMobile]);

  return (
    <>
      <GradientBackground />
      
      {/* Simplified lighting for better performance */}
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight position={[5, 10, 5]} intensity={0.5} color="#ffffff" />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} color="#ffffff" />
      
      <SmartCameraControls isMobile={isMobile} />
      
      {/* Simplified particle system */}
      <SimplifiedParticleSystem colorTheme={particleTheme} isMobile={isMobile} />
      
      {/* Floating Photos */}
      {photoPositions.map((photo, index) => (
        <FloatingPhoto
          key={index}
          position={photo.position}
          rotation={photo.rotation}
          imageUrl={photo.imageUrl}
          index={index}
          isMobile={isMobile}
        />
      ))}
      
      {/* Subtle fog for depth */}
      <fog attach="fog" args={['#1a0a2e', 15, 35]} />
    </>
  );
};

// Error boundary for 3D scene
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-black/40">
        <div className="text-center text-white/60">
          <div className="w-16 h-16 border-2 border-purple-500/30 rounded-full mx-auto mb-4"></div>
          <p>3D Scene Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Loading fallback
const LoadingFallback: React.FC = () => (
  <mesh>
    <sphereGeometry args={[0.1, 8, 8]} />
    <meshBasicMaterial color="#8b5cf6" />
  </mesh>
);

// Main exported component
const BlogScene: React.FC = () => {
  const isMobile = useIsMobile();
  const [particleTheme] = React.useState(PARTICLE_THEMES[0]); // Purple Magic theme
  
  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
      <ErrorBoundary>
        <Canvas
          className="absolute inset-0 w-full h-full"
          camera={{ position: [15, 3, 15], fov: 45 }}
          shadows={false}
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
          }}
          style={{ 
            background: 'transparent',
            pointerEvents: 'none',
            touchAction: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            zIndex: 1
          }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = false;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.2;
            
            // Lower pixel ratio for mobile
            gl.setPixelRatio(isMobile ? 1 : window.devicePixelRatio);
          }}
          frameloop="demand" // Only render when needed for better performance
          dpr={isMobile ? 1 : [1, 2]} // Lower resolution on mobile
        >
          <Suspense fallback={<LoadingFallback />}>
            <Scene particleTheme={particleTheme} isMobile={isMobile} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};

export default BlogScene;