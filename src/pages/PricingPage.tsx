import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Palette } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { supabase } from '../lib/supabase';

// Particle themes for the 3D scene
const PARTICLE_THEMES = [
  {
    name: "Cosmic Blue",
    primary: "#00d4ff",
    secondary: "#0099cc",
    accent: "#66e5ff"
  },
  {
    name: "Stellar Gold",
    primary: "#ffd700",
    secondary: "#ff8c00",
    accent: "#ffeb3b"
  },
  {
    name: "Nebula Purple",
    primary: "#9c27b0",
    secondary: "#673ab7",
    accent: "#e1bee7"
  },
  {
    name: "Galaxy Green",
    primary: "#00ff88",
    secondary: "#00cc66",
    accent: "#66ffaa"
  },
  {
    name: "Solar Orange",
    primary: "#ff6b35",
    secondary: "#ff4500",
    accent: "#ffa366"
  }
];

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

// 100 Fun party and event photos
const DEMO_PHOTOS = [
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
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=600&fit=crop&crop=center',
];

const PHOTO_COMMENTS = [
  "This is so much fun! 🎉",
  "Best night ever! ✨",
  "Squad goals! 💖",
  "Making memories! 📸",
  "Party vibes! 🕺",
  "Love this moment! ❤️",
  "Can't stop laughing! 😂",
  "Epic celebration! 🎊",
  "Good times! 🌟",
  "So happy right now! 😊",
  "Unforgettable! 🙌",
  "Living our best life! 💃"
];

// --- Internal Helper Components (Not exported) --- //

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const Button = ({ children, className, ...props }: any) => (
  <button className={className} {...props}>
    {children}
  </button>
);

// 3D Scene Components
interface PhotoProps {
  position: [number, number, number];
  rotation: [number, number, number];
  imageUrl: string;
  index: number;
}

const FloatingPhoto: React.FC<PhotoProps> = ({ position, rotation, imageUrl, index }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  const hasComment = React.useMemo(() => Math.random() < 0.4, []);
  const comment = React.useMemo(() => 
    hasComment ? PHOTO_COMMENTS[index % PHOTO_COMMENTS.length] : null, 
    [hasComment, index]
  );
  
  React.useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (loadedTexture) => {
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.anisotropy = 16;
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

  const textTexture = React.useMemo(() => {
    if (!comment) return null;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;
    
    canvas.width = 512;
    canvas.height = 128;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.beginPath();
    context.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 15);
    context.fill();
    
    context.fillStyle = 'white';
    context.font = 'bold 28px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(comment, canvas.width / 2, canvas.height / 2);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [comment]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const floatOffset = Math.sin(time * 0.5 + index * 0.5) * 0.3;
    
    groupRef.current.lookAt(state.camera.position);
    
    const rotationOffset = Math.sin(time * 0.3 + index * 0.3) * 0.05;
    groupRef.current.rotation.z += rotationOffset;
    
    groupRef.current.position.y = position[1] + floatOffset;
  });

  if (!isLoaded || !texture) {
    return null;
  }

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
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
      
      {comment && textTexture && (
        <mesh position={[0, -1.2, 0.01]}>
          <planeGeometry args={[1.4, 0.35]} />
          <meshBasicMaterial 
            map={textTexture} 
            transparent 
            alphaTest={0.1}
          />
        </mesh>
      )}
    </group>
  );
};

interface MilkyWayParticleSystemProps {
  colorTheme: typeof PARTICLE_THEMES[0];
  photoPositions: Array<{ position: [number, number, number] }>;
}

const MilkyWayParticleSystem: React.FC<MilkyWayParticleSystemProps> = ({ colorTheme, photoPositions }) => {
  const mainCloudRef = useRef<THREE.Points>(null);
  const dustCloudRef = useRef<THREE.Points>(null);
  const clustersRef = useRef<THREE.Group>(null);
  
  const MAIN_COUNT = 4000;
  const DUST_COUNT = 2500;
  const CLUSTER_COUNT = 8;
  const PARTICLES_PER_CLUSTER = 300;
  
  const particleData = useMemo(() => {
    const mainPositions = new Float32Array(MAIN_COUNT * 3);
    const mainColors = new Float32Array(MAIN_COUNT * 3);
    const mainSizes = new Float32Array(MAIN_COUNT);
    const mainVelocities = new Float32Array(MAIN_COUNT * 3);
    
    for (let i = 0; i < MAIN_COUNT; i++) {
      const armIndex = Math.floor(Math.random() * 4);
      const armAngle = (armIndex * Math.PI / 2) + (Math.random() - 0.5) * 0.5;
      const distanceFromCenter = Math.pow(Math.random(), 0.5) * 80;
      const spiralTightness = 0.2;
      const angle = armAngle + (distanceFromCenter * spiralTightness);
      
      const noise = (Math.random() - 0.5) * (8 + distanceFromCenter * 0.1);
      const heightNoise = (Math.random() - 0.5) * (2 + distanceFromCenter * 0.05);
      
      mainPositions[i * 3] = Math.cos(angle) * distanceFromCenter + noise;
      mainPositions[i * 3 + 1] = heightNoise + Math.sin(angle * 0.1) * (distanceFromCenter * 0.02);
      mainPositions[i * 3 + 2] = Math.sin(angle) * distanceFromCenter + noise;
      
      mainVelocities[i * 3] = (Math.random() - 0.5) * 0.002;
      mainVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
      mainVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
      
      const sizeRandom = Math.random();
      if (sizeRandom < 0.7) {
        mainSizes[i] = 0.5 + Math.random() * 1.5;
      } else if (sizeRandom < 0.9) {
        mainSizes[i] = 2 + Math.random() * 2;
      } else {
        mainSizes[i] = 4 + Math.random() * 3;
      }
    }
    
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    const dustColors = new Float32Array(DUST_COUNT * 3);
    const dustSizes = new Float32Array(DUST_COUNT);
    const dustVelocities = new Float32Array(DUST_COUNT * 3);
    
    for (let i = 0; i < DUST_COUNT; i++) {
      const radius = Math.pow(Math.random(), 2) * 50 + 10;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 30 + 15;
      
      dustPositions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 15;
      dustPositions[i * 3 + 1] = height;
      dustPositions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 15;
      
      dustVelocities[i * 3] = (Math.random() - 0.5) * 0.003;
      dustVelocities[i * 3 + 1] = Math.random() * 0.002 + 0.001;
      dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
      
      dustSizes[i] = 0.3 + Math.random() * 1.2;
    }
    
    const clusterData = [];
    for (let c = 0; c < CLUSTER_COUNT; c++) {
      const clusterDistance = 30 + Math.random() * 100;
      const clusterAngle = Math.random() * Math.PI * 2;
      const clusterHeight = (Math.random() - 0.5) * 60 + 20;
      
      const clusterCenter = {
        x: Math.cos(clusterAngle) * clusterDistance,
        y: clusterHeight,
        z: Math.sin(clusterAngle) * clusterDistance
      };
      
      const clusterPositions = new Float32Array(PARTICLES_PER_CLUSTER * 3);
      const clusterColors = new Float32Array(PARTICLES_PER_CLUSTER * 3);
      const clusterSizes = new Float32Array(PARTICLES_PER_CLUSTER);
      const clusterVelocities = new Float32Array(PARTICLES_PER_CLUSTER * 3);
      
      for (let i = 0; i < PARTICLES_PER_CLUSTER; i++) {
        const phi = Math.random() * Math.PI * 2;
        const cosTheta = Math.random() * 2 - 1;
        const u = Math.random();
        const clusterRadius = Math.pow(u, 1/3) * (3 + Math.random() * 4);
        
        const theta = Math.acos(cosTheta);
        const r = clusterRadius;
        
        clusterPositions[i * 3] = clusterCenter.x + r * Math.sin(theta) * Math.cos(phi);
        clusterPositions[i * 3 + 1] = clusterCenter.y + r * Math.cos(theta);
        clusterPositions[i * 3 + 2] = clusterCenter.z + r * Math.sin(theta) * Math.sin(phi);
        
        clusterVelocities[i * 3] = (Math.random() - 0.5) * 0.001;
        clusterVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
        clusterVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
        
        clusterSizes[i] = 0.8 + Math.random() * 2.5;
      }
      
      clusterData.push({
        positions: clusterPositions,
        colors: clusterColors,
        sizes: clusterSizes,
        velocities: clusterVelocities,
        center: clusterCenter
      });
    }
    
    return {
      main: {
        positions: mainPositions,
        colors: mainColors,
        sizes: mainSizes,
        velocities: mainVelocities,
        count: MAIN_COUNT
      },
      dust: {
        positions: dustPositions,
        colors: dustColors,
        sizes: dustSizes,
        velocities: dustVelocities,
        count: DUST_COUNT
      },
      clusters: clusterData
    };
  }, []);

  React.useEffect(() => {
    if (!mainCloudRef.current || !dustCloudRef.current || !clustersRef.current) return;
    
    const mainColors = mainCloudRef.current.geometry.attributes.color.array as Float32Array;
    for (let i = 0; i < particleData.main.count; i++) {
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
      
      mainColors[i * 3] = particleColor.r;
      mainColors[i * 3 + 1] = particleColor.g;
      mainColors[i * 3 + 2] = particleColor.b;
    }
    mainCloudRef.current.geometry.attributes.color.needsUpdate = true;
    
    const dustColors = dustCloudRef.current.geometry.attributes.color.array as Float32Array;
    for (let i = 0; i < particleData.dust.count; i++) {
      const baseColor = new THREE.Color(colorTheme.secondary);
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      
      const particleColor = new THREE.Color();
      particleColor.setHSL(
        (hsl.h + (Math.random() - 0.5) * 0.15 + 1) % 1,
        Math.min(1, hsl.s * (0.5 + Math.random() * 0.5)),
        Math.min(1, hsl.l * (0.4 + Math.random() * 0.6))
      );
      
      dustColors[i * 3] = particleColor.r;
      dustColors[i * 3 + 1] = particleColor.g;
      dustColors[i * 3 + 2] = particleColor.b;
    }
    dustCloudRef.current.geometry.attributes.color.needsUpdate = true;
    
    clustersRef.current.children.forEach((cluster, clusterIndex) => {
      if (cluster instanceof THREE.Points && clusterIndex < particleData.clusters.length) {
        const clusterColors = cluster.geometry.attributes.color.array as Float32Array;
        const clusterColorBase = [colorTheme.primary, colorTheme.secondary, colorTheme.accent][clusterIndex % 3];
        
        for (let i = 0; i < PARTICLES_PER_CLUSTER; i++) {
          const baseColor = new THREE.Color(clusterColorBase);
          const hsl = { h: 0, s: 0, l: 0 };
          baseColor.getHSL(hsl);
          
          const particleColor = new THREE.Color();
          particleColor.setHSL(
            (hsl.h + (Math.random() - 0.5) * 0.08 + 1) % 1,
            Math.min(1, hsl.s * (0.7 + Math.random() * 0.6)),
            Math.min(1, hsl.l * (0.5 + Math.random() * 0.5))
          );
          
          clusterColors[i * 3] = particleColor.r;
          clusterColors[i * 3 + 1] = particleColor.g;
          clusterColors[i * 3 + 2] = particleColor.b;
        }
        cluster.geometry.attributes.color.needsUpdate = true;
      }
    });
  }, [colorTheme, particleData]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (mainCloudRef.current) {
      const mainPositions = mainCloudRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleData.main.count; i++) {
        const i3 = i * 3;
        
        mainPositions[i3] += particleData.main.velocities[i3];
        mainPositions[i3 + 1] += particleData.main.velocities[i3 + 1];
        mainPositions[i3 + 2] += particleData.main.velocities[i3 + 2];
        
        const x = mainPositions[i3];
        const z = mainPositions[i3 + 2];
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        
        const orbitalSpeed = distanceFromCenter > 0 ? 0.00008 / Math.sqrt(distanceFromCenter + 10) : 0;
        const angle = Math.atan2(z, x);
        const newAngle = angle + orbitalSpeed;
        
        mainPositions[i3] += Math.cos(newAngle) * orbitalSpeed * 0.1;
        mainPositions[i3 + 2] += Math.sin(newAngle) * orbitalSpeed * 0.1;
        
        const parallaxFreq = time * 0.02 + i * 0.001;
        mainPositions[i3] += Math.sin(parallaxFreq) * 0.001;
        mainPositions[i3 + 1] += Math.cos(parallaxFreq * 0.7) * 0.0005;
        mainPositions[i3 + 2] += Math.sin(parallaxFreq * 1.3) * 0.001;
      }
      
      mainCloudRef.current.geometry.attributes.position.needsUpdate = true;
      mainCloudRef.current.rotation.y = time * 0.003;
    }
    
    if (dustCloudRef.current) {
      const dustPositions = dustCloudRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleData.dust.count; i++) {
        const i3 = i * 3;
        
        dustPositions[i3] += particleData.dust.velocities[i3];
        dustPositions[i3 + 1] += particleData.dust.velocities[i3 + 1];
        dustPositions[i3 + 2] += particleData.dust.velocities[i3 + 2];
        
        const turbulenceFreq = time * 0.1 + i * 0.05;
        dustPositions[i3] += Math.sin(turbulenceFreq) * 0.002;
        dustPositions[i3 + 1] += Math.cos(turbulenceFreq * 1.3) * 0.001;
        dustPositions[i3 + 2] += Math.sin(turbulenceFreq * 0.8) * 0.002;
        
        if (dustPositions[i3 + 1] > 60) {
          dustPositions[i3 + 1] = -10;
          dustPositions[i3] = (Math.random() - 0.5) * 70;
          dustPositions[i3 + 2] = (Math.random() - 0.5) * 70;
        }
        
        if (Math.abs(dustPositions[i3]) > 80) {
          dustPositions[i3] = -Math.sign(dustPositions[i3]) * 20;
        }
        if (Math.abs(dustPositions[i3 + 2]) > 80) {
          dustPositions[i3 + 2] = -Math.sign(dustPositions[i3 + 2]) * 20;
        }
      }
      
      dustCloudRef.current.geometry.attributes.position.needsUpdate = true;
      dustCloudRef.current.rotation.y = time * 0.005;
    }
    
    if (clustersRef.current) {
      clustersRef.current.children.forEach((cluster, clusterIndex) => {
        if (cluster instanceof THREE.Points && clusterIndex < particleData.clusters.length) {
          const positions = cluster.geometry.attributes.position.array as Float32Array;
          const velocities = particleData.clusters[clusterIndex].velocities;
          const expectedLength = PARTICLES_PER_CLUSTER * 3;
          const clusterCenter = particleData.clusters[clusterIndex].center;
          
          if (positions.length === expectedLength && velocities.length === expectedLength) {
            for (let i = 0; i < PARTICLES_PER_CLUSTER; i++) {
              const i3 = i * 3;
              
              positions[i3] += velocities[i3];
              positions[i3 + 1] += velocities[i3 + 1];
              positions[i3 + 2] += velocities[i3 + 2];
              
              const dx = clusterCenter.x - positions[i3];
              const dy = clusterCenter.y - positions[i3 + 1];
              const dz = clusterCenter.z - positions[i3 + 2];
              const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
              
              if (distance > 0) {
                const gravitationalForce = 0.00001;
                positions[i3] += (dx / distance) * gravitationalForce;
                positions[i3 + 1] += (dy / distance) * gravitationalForce;
                positions[i3 + 2] += (dz / distance) * gravitationalForce;
              }
              
              const clusterWave = time * 0.03 + clusterIndex + i * 0.1;
              positions[i3] += Math.sin(clusterWave) * 0.0005;
              positions[i3 + 1] += Math.cos(clusterWave * 0.8) * 0.0003;
              positions[i3 + 2] += Math.sin(clusterWave * 1.2) * 0.0005;
            }
            
            cluster.geometry.attributes.position.needsUpdate = true;
            
            cluster.rotation.x = time * 0.001 * (clusterIndex % 2 ? 1 : -1);
            cluster.rotation.z = time * 0.0015 * (clusterIndex % 3 ? 1 : -1);
          }
        }
      });
    }
  });

  return (
    <group>
      <points ref={mainCloudRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.main.positions}
            count={particleData.main.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.main.colors}
            count={particleData.main.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.main.sizes}
            count={particleData.main.count}
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
              
              gl_FragColor = vec4(vColor, alpha * vOpacity * 0.8);
            }
          `}
        />
      </points>
      
      <points ref={dustCloudRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.dust.positions}
            count={particleData.dust.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.dust.colors}
            count={particleData.dust.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.dust.sizes}
            count={particleData.dust.count}
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
              gl_PointSize = size * (200.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              
              float distance = length(mvPosition.xyz);
              vOpacity = 1.0 - smoothstep(30.0, 100.0, distance);
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
              
              gl_FragColor = vec4(vColor, alpha * vOpacity * 0.6);
            }
          `}
        />
      </points>
      
      <group ref={clustersRef}>
        {particleData.clusters.map((cluster, index) => (
          <points key={index}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={cluster.positions}
                count={PARTICLES_PER_CLUSTER}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-color"
                array={cluster.colors}
                count={PARTICLES_PER_CLUSTER}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-size"
                array={cluster.sizes}
                count={PARTICLES_PER_CLUSTER}
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
                  gl_PointSize = size * (250.0 / -mvPosition.z);
                  gl_Position = projectionMatrix * mvPosition;
                  
                  float distance = length(mvPosition.xyz);
                  vOpacity = 1.0 - smoothstep(80.0, 300.0, distance);
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
                  
                  gl_FragColor = vec4(vColor, alpha * vOpacity * 0.9);
                }
              `}
            />
          </points>
        ))}
      </group>
    </group>
  );
};

const ReflectiveFloor: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.05, 0]}>
      <planeGeometry args={[35, 35]} />
      <meshStandardMaterial 
        color="#0f0f23"
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={1.0}
      />
    </mesh>
  );
};

const Floor: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
      <planeGeometry args={[35, 35]} />
      <meshStandardMaterial 
        color="#1a1a2e"
        metalness={0.8}
        roughness={0.2}
        envMapIntensity={0.9}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

const Grid: React.FC<{ colorTheme: typeof PARTICLE_THEMES[0] }> = ({ colorTheme }) => {
  const gridRef = useRef<THREE.Group>(null);
  
  React.useEffect(() => {
    if (!gridRef.current || !colorTheme || !colorTheme.primary || !colorTheme.secondary) return;
    
    while (gridRef.current.children.length > 0) {
      gridRef.current.remove(gridRef.current.children[0]);
    }
    
    const helper = new THREE.GridHelper(35, 35, colorTheme.primary, colorTheme.secondary);
    helper.position.y = -2.99;
    
    const material = helper.material as THREE.LineBasicMaterial;
    material.transparent = true;
    material.opacity = 0.6;
    
    gridRef.current.add(helper);
  }, [colorTheme]);

  return <group ref={gridRef} />;
};

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

const SmartCameraControls: React.FC = () => {
  const controlsRef = useRef<any>();
  const { camera } = useThree();
  const isUserInteracting = useRef(false);
  const lastInteractionTime = useRef(0);
  const rotationAngle = useRef(0);
  const baseRadius = useRef(15);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    if (camera && camera.position) {
      setIsReady(true);
    }
  }, [camera]);

  useFrame((state) => {
    if (!camera || !camera.position) return;
    
    const currentTime = Date.now();
    const timeSinceInteraction = currentTime - lastInteractionTime.current;
    
    const shouldAutoRotate = !isUserInteracting.current || timeSinceInteraction > 1000;
    
    if (shouldAutoRotate) {
      rotationAngle.current += 0.002;
      
      const radius = baseRadius.current;
      const height = 3 + Math.sin(rotationAngle.current * 0.5) * 0.8;
      
      camera.position.x = Math.cos(rotationAngle.current) * radius;
      camera.position.y = height;
      camera.position.z = Math.sin(rotationAngle.current) * radius;
      
      camera.lookAt(0, 0, 0);
    }
    
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  React.useEffect(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;
    
    const handleStart = () => {
      isUserInteracting.current = true;
      lastInteractionTime.current = Date.now();
    };

    const handleEnd = () => {
      isUserInteracting.current = false;
      lastInteractionTime.current = Date.now();
      
      if (camera && camera.position) {
        const distance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
        baseRadius.current = Math.max(8, Math.min(25, distance));
        
        rotationAngle.current = Math.atan2(camera.position.z, camera.position.x);
      }
    };

    const handleChange = () => {
      if (isUserInteracting.current) {
        lastInteractionTime.current = Date.now();
      }
    };

    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);
    controls.addEventListener('change', handleChange);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
      controls.removeEventListener('change', handleChange);
    };
  }, [camera, isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={false}
      enableRotate={true}
      rotateSpeed={0.6}
      minDistance={8}
      maxDistance={25}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI - Math.PI / 8}
      enableDamping={true}
      dampingFactor={0.1}
      autoRotate={false}
    />
  );
};

const Scene: React.FC<{ particleTheme: typeof PARTICLE_THEMES[0] }> = ({ particleTheme }) => {
  const photoPositions = useMemo(() => {
    const positions: Array<{
      position: [number, number, number];
      rotation: [number, number, number];
      imageUrl: string;
    }> = [];

    const gridSize = 5; // Reduced for pricing page
    const floorSize = 20; // Smaller area
    const spacing = floorSize / (gridSize - 1);
    
    let photoIndex = 0;
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = (col - (gridSize - 1) / 2) * spacing;
        const z = (row - (gridSize - 1) / 2) * spacing;
        
        const xOffset = (Math.random() - 0.5) * 0.5;
        const zOffset = (Math.random() - 0.5) * 0.5;
        
        const baseHeight = 1.5;
        const waveHeight = Math.sin(row * 0.3) * Math.cos(col * 0.3) * 1.5;
        const randomHeight = Math.random() * 0.8;
        const y = baseHeight + waveHeight + randomHeight;
        
        const rotationX = (Math.random() - 0.5) * 0.3;
        const rotationY = (Math.random() - 0.5) * 0.6;
        const rotationZ = (Math.random() - 0.5) * 0.2;
        
        const imageUrl = DEMO_PHOTOS[photoIndex % DEMO_PHOTOS.length];
        photoIndex++;
        
        positions.push({
          position: [x + xOffset, y, z + zOffset] as [number, number, number],
          rotation: [rotationX, rotationY, rotationZ] as [number, number, number],
          imageUrl: imageUrl,
        });
      }
    }
    
    return positions;
  }, []);

  return (
    <>
      <GradientBackground />
      
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight position={[5, 10, 5]} intensity={0.5} color="#ffffff" castShadow={false} />
      <directionalLight position={[-5, 8, -5]} intensity={0.4} color="#ffffff" castShadow={false} />
      <directionalLight position={[0, 12, -8]} intensity={0.3} color="#ffffff" castShadow={false} />
      <directionalLight position={[5, 2, 5]} intensity={0.25} color="#ffffff" castShadow={false} />
      <directionalLight position={[-5, 2, -5]} intensity={0.25} color="#ffffff" castShadow={false} />
      <directionalLight position={[10, 5, 0]} intensity={0.2} color="#ffffff" castShadow={false} />
      <directionalLight position={[-10, 5, 0]} intensity={0.2} color="#ffffff" castShadow={false} />
      <directionalLight position={[0, 5, 10]} intensity={0.25} color="#ffffff" castShadow={false} />
      
      <pointLight position={[0, 6, 0]} intensity={0.3} color="#ffffff" distance={20} decay={2} />
      <pointLight position={[0, 1, 6]} intensity={0.2} color="#ffffff" distance={15} decay={2} />
      <pointLight position={[8, 4, 0]} intensity={0.2} color="#ffffff" distance={12} />
      <pointLight position={[-8, 4, 0]} intensity={0.2} color="#ffffff" distance={12} />
      <pointLight position={[0, 4, 8]} intensity={0.2} color="#ffffff" distance={12} />
      <pointLight position={[0, 4, -8]} intensity={0.2} color="#ffffff" distance={12} />
      
      <spotLight position={[-8, 12, -8]} angle={Math.PI / 4} penumbra={0.8} intensity={0.3} color="#8b5cf6" castShadow={false} />
      <spotLight position={[8, 10, -8]} angle={Math.PI / 4} penumbra={0.8} intensity={0.25} color="#a855f7" castShadow={false} />
      
      <SmartCameraControls />
      
      <ReflectiveFloor />
      <Floor />
      <Grid colorTheme={particleTheme} />
      
      <MilkyWayParticleSystem colorTheme={particleTheme} photoPositions={photoPositions} />
      
      {photoPositions.map((photo, index) => (
        <FloatingPhoto
          key={index}
          position={photo.position}
          rotation={photo.rotation}
          imageUrl={photo.imageUrl}
          index={index}
        />
      ))}
      
      <fog attach="fog" args={['#1a0a2e', 15, 35]} />
    </>
  );
};

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

const LoadingFallback: React.FC = () => (
  <mesh>
    <sphereGeometry args={[0.1, 8, 8]} />
    <meshBasicMaterial color="#8b5cf6" />
  </mesh>
);

// Pricing Card Component
export interface PricingCardProps {
  planName: string;
  description: string;
  price: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  buttonVariant?: 'primary' | 'secondary';
}

export const PricingCard = ({
  planName, description, price, features, buttonText, isPopular = false, buttonVariant = 'primary'
}: PricingCardProps) => {
  const buttonClassName = buttonVariant === 'primary' 
    ? 'w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 bg-cyan-400/90 hover:bg-cyan-300/90 text-black shadow-lg hover:shadow-cyan-400/30 backdrop-blur-sm' 
    : 'w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 backdrop-blur-sm';

  const displayPrice = price.indexOf('$') === 0 ? price : '$' + price;
  const showPeriod = price !== 'Contact Sales';

  return (
    <div className={isPopular ? 'relative flex flex-col min-w-[300px] max-w-[340px] transition-all duration-300 scale-110 z-20' : 'relative flex flex-col min-w-[300px] max-w-[340px] transition-all duration-300 z-10'}>
      <div className={isPopular ? 'absolute inset-0 rounded-2xl p-[2px] animate-pulse' : 'absolute inset-0 rounded-2xl p-[2px]'}>
        <div className={isPopular ? 'absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600' : 'absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-blue-500/30 to-purple-600/30'} />
      </div>
      
      <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-8 flex flex-col h-full shadow-2xl bg-gradient-to-b from-white/10 to-transparent">
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-cyan-400/90 to-blue-500/90 text-black shadow-lg z-30 backdrop-blur-md border border-white/30">
            🚀 Most Popular
          </div>
        )}
        
        <div className="text-center mb-6">
          <h2 className="text-5xl font-extralight tracking-tight text-white leading-none mb-3">{planName}</h2>
          <p className="text-lg text-white/80 font-sans">{description}</p>
        </div>
        
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-extralight text-white">
              {displayPrice}
            </span>
            {showPeriod && (
              <span className="text-base text-white/70">/mo</span>
            )}
          </div>
        </div>
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6"></div>
        
        <ul className="flex flex-col gap-4 text-base text-white/95 mb-8 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckIcon className="text-cyan-400/90 w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button className={buttonClassName}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

// Main PricingPage Component
const PricingPage = () => {
  const [stockPhotos, setStockPhotos] = useState<string[]>([]);
  const [particleTheme, setParticleTheme] = useState(PARTICLE_THEMES[0]);

  // Fetch stock photos from Supabase storage
  useEffect(() => {
    const fetchStockPhotos = async () => {
      try {
        const { data, error } = await supabase.storage.from('stock_photos').list();
        
        if (error) {
          console.error('Error fetching stock photos:', error);
          return;
        }
        
        if (data && data.length > 0) {
          // Filter for image files only
          const imageFiles = data.filter(file => 
            file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
          );
          
          // Convert to public URLs
          const urls = imageFiles.map(file => {
            const { data } = supabase.storage.from('stock_photos').getPublicUrl(file.name);
            return data.publicUrl;
          });
          
          setStockPhotos(urls);
          console.log('Loaded', urls.length, 'stock photos from Supabase storage');
        }
      } catch (err) {
        console.error('Failed to fetch stock photos:', err);
      }
    };
    
    fetchStockPhotos();
  }, []);

  const samplePlans: PricingCardProps[] = [
    {
      planName: "Starter",
      description: "Perfect for small events",
      price: "45",
      features: [
        "5 PhotoSpheres",
        "Virtual PhotoBooth",
        "PhotoSphere Display", 
        "Moderation tools",
        "Up to 500 photos displayed"
      ],
      buttonText: "Get Started",
      buttonVariant: "secondary"
    },
    {
      planName: "Pro",
      description: "Best for growing businesses",
      price: "99",
      features: [
        "Everything in Starter",
        "Advanced camera animations",
        "Built-in video recording",
        "20 PhotoSpheres",
        "Priority support"
      ],
      buttonText: "Start Free Trial",
      isPopular: true
    },
    {
      planName: "Enterprise",
      description: "For large organizations",
      price: "Contact Sales",
      features: [
        "Everything in Pro",
        "White label on your domain",
        "Dedicated Account Manager",
        "Custom training sessions",
        "24/7 premium support"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "secondary"
    }
  ];

  const oneTimePlan: PricingCardProps = {
    planName: "One-Time",
    description: "Perfect for single events",
    price: "499",
    features: [
      "PhotoSphere lasts 30 days post-event",
      "Up to 500 photos displayed",
      "Virtual PhotoBooth included",
      "Basic moderation tools",
      "Single event license"
    ],
    buttonText: "Book Event",
    buttonVariant: "secondary"
  };

  return (
    <Layout>
      <div className="relative w-full min-h-[calc(100vh-160px)] bg-black text-white">
        {/* 3D Scene Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          <ErrorBoundary>
            {/* Theme Controls */}
            <div className="absolute top-4 right-4 z-50">
              <div className="relative">
                <button
                  onClick={() => {
                    const currentIndex = PARTICLE_THEMES.findIndex(theme => theme.name === particleTheme.name);
                    const nextIndex = (currentIndex + 1) % PARTICLE_THEMES.length;
                    setParticleTheme(PARTICLE_THEMES[nextIndex]);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-black/30 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-black/40 transition-all duration-200 shadow-lg text-sm"
                  aria-label="Change particle colors"
                >
                  <Palette size={16} />
                  <span className="hidden sm:inline">{particleTheme.name}</span>
                </button>
              </div>
            </div>

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
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              zIndex: 1
            }}
            onCreated={({ gl }) => {
              gl.shadowMap.enabled = false;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.2;
            }}
            frameloop="always"
            dpr={[1, 2]}
          >
            <Suspense fallback={<LoadingFallback />}>
              <Scene particleTheme={particleTheme} />
            </Suspense>
          </Canvas>
        </ErrorBoundary>
        </div>

        {/* Pricing Content - Above 3D Scene */}
        <main className="relative z-10 w-full flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-7xl mx-auto text-center mb-20">
            <h1 className="text-6xl md:text-7xl font-extralight leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-300 to-blue-400 mb-8">
              Choose Your PhotoSphere Plan
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto font-light leading-relaxed">
              Create immersive photo experiences for your events. Start free and scale as you grow.
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 justify-center items-center lg:items-end w-full max-w-7xl mb-20">
            {samplePlans.map((plan) => (
              <PricingCard key={plan.planName} {...plan} />
            ))}
          </div>
          
          <div className="flex justify-center w-full max-w-7xl mb-20">
            <PricingCard {...oneTimePlan} />
          </div>
          
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-white/70 mb-16">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-400/20 flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-white text-xl font-semibold mb-4">Secure & Private</h3>
                <p className="text-base leading-relaxed">Your photos are encrypted and stored securely with enterprise-grade security.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-400/20 flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-white text-xl font-semibold mb-4">Real-time Updates</h3>
                <p className="text-base leading-relaxed">See photos appear instantly as guests upload them during your event.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-400/20 flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-white text-xl font-semibold mb-4">Easy Setup</h3>
                <p className="text-base leading-relaxed">Get started in minutes with our intuitive setup process and QR code sharing.</p>
              </div>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
              <h3 className="text-white text-2xl font-semibold mb-4">Need a custom solution?</h3>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">We offer tailored packages for large events, multiple locations, and enterprise deployments.</p>
              <Button className="px-8 py-4 bg-cyan-400/90 hover:bg-cyan-300/90 text-black rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-cyan-400/30 backdrop-blur-sm border border-white/20">
                Contact Our Team
              </Button>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default PricingPage;
