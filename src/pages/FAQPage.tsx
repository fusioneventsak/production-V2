import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { ChevronDown, Search, Camera, Zap, Shield, Palette, Monitor, Globe, Settings, Users, Award, Sparkles, ArrowRight } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Layout from '../components/layout/Layout';
import DemoRequestModal from '../components/modals/DemoRequestModal';

// Particle themes for the 3D scene (from pricing page)
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

// Demo photos for background scene
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

// 3D Scene Components (from pricing page)
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

    const gridSize = 5; // Reduced for FAQ page
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
const faqData = [
  {
    id: 1,
    category: 'general',
    question: 'What is PhotoSphere photobooth software?',
    answer: 'PhotoSphere is a revolutionary 3D photobooth display platform that transforms how event photos are shared and experienced. Unlike traditional photobooths that print or display static images, PhotoSphere creates an immersive 3D environment where uploaded photos float, wave, and spiral in real-time.',
    icon: Camera,
    color: '#ff00dd'
  },
  {
    id: 2,
    category: 'general',
    question: 'Is PhotoSphere free photobooth software?',
    answer: 'PhotoSphere offers various pricing tiers to accommodate different needs. While we don\'t offer a completely free version, we provide a 14-day free trial that includes all Pro features so you can test everything before committing. Our starter plan is extremely affordable and includes all core features like 3D displays, real-time uploads, and basic customization.',
    icon: Award,
    color: '#00ffe1'
  },
  {
    id: 3,
    category: 'technical',
    question: 'Does PhotoSphere work with DSLR cameras?',
    answer: 'Yes! PhotoSphere supports photos from any source, including professional DSLR cameras. You can upload high-quality images in large batches, whether they\'re from DSLRs, mirrorless cameras, or smartphones. The platform automatically optimizes photos for the 3D display while maintaining quality.',
    icon: Camera,
    color: '#ffae00'
  },
  {
    id: 4,
    category: 'technical',
    question: 'Can I use PhotoSphere with my existing photobooth equipment?',
    answer: 'Absolutely! PhotoSphere is designed to complement, not replace, your existing photobooth setup. Use your professional cameras and lighting for capturing high-quality photos, then upload them to PhotoSphere for the stunning 3D display.',
    icon: Settings,
    color: '#9966ff'
  },
  {
    id: 5,
    category: 'features',
    question: 'What\'s the best way to display photobooth pictures with PhotoSphere?',
    answer: 'PhotoSphere offers multiple stunning display options: 3D Floating (photos float gently with realistic physics), Wave Animation (beautiful wave patterns), Spiral Display (dynamic spiral formations), Orbit Patterns (rotation around central points), and Custom Arrangements (design your own layouts).',
    icon: Monitor,
    color: '#00ff88'
  },
  {
    id: 6,
    category: 'features',
    question: 'Can I add overlays and graphics to photos?',
    answer: 'Yes! PhotoSphere supports multiple types of overlays: logo overlays with transparency support, text overlays for event names and hashtags, frame overlays for borders, sponsor graphics, social media elements, and custom graphics for themed events. All overlays can be positioned, resized, and layered.',
    icon: Palette,
    color: '#ff6600'
  },
  {
    id: 7,
    category: 'customization',
    question: 'Can PhotoSphere be fully branded for my business?',
    answer: 'Yes! PhotoSphere offers comprehensive branding options: custom logos with transparency support, brand colors throughout the interface, custom overlays for additional branding elements, themed environments that match your brand aesthetic, white-label options for professional event companies, and custom domain support.',
    icon: Palette,
    color: '#ff0088'
  },
  {
    id: 8,
    category: 'features',
    question: 'Can I record or export the 3D display?',
    answer: 'Yes! PhotoSphere includes a built-in screen recording feature that lets you capture the live 3D display directly from the platform. You can also use external recording software like OBS Studio, Zoom, Loom, or built-in OS tools to create highlight reels and social media content.',
    icon: Zap,
    color: '#4400ff'
  },
  {
    id: 9,
    category: 'features',
    question: 'How do I prevent inappropriate photos from appearing?',
    answer: 'PhotoSphere includes comprehensive moderation tools: pre-approval mode to review all photos before they appear, real-time monitoring to watch uploads as they happen, quick removal to delete inappropriate content instantly, bulk actions to manage multiple photos efficiently, and activity logs to track all moderation actions.',
    icon: Shield,
    color: '#ff4400'
  },
  {
    id: 10,
    category: 'professional',
    question: 'Is PhotoSphere suitable for professional event photographers?',
    answer: 'Absolutely! Many professional photographers use PhotoSphere to showcase work in real-time during events, engage clients with interactive displays, differentiate services with unique 3D presentations, upload batches of professional photos efficiently, and provide added value beyond traditional photography packages.',
    icon: Award,
    color: '#8800ff'
  },
  {
    id: 11,
    category: 'professional', 
    question: 'How do I make more money with my photobooth business?',
    answer: 'PhotoSphere helps photobooth businesses increase revenue in multiple ways: charge premium rates for unique 3D experiences ($200-500+ more per event), offer it as an exclusive add-on service, create recurring revenue with venue partnerships, attract higher-end corporate clients who want cutting-edge technology, and increase booking frequency through social media buzz and word-of-mouth from the "wow factor" of 3D displays.',
    icon: Award,
    color: '#00ddff'
  }
];

// Use case data with magical properties
const useCaseData = [
  {
    id: 1,
    title: 'Photobooth Business',
    description: '🚀 Charge premium rates with unique 3D experiences. Perfect add-on service that differentiates your business and increases revenue per event.',
    highlight: '💸 $200-500+ more per event',
    icon: Camera,
    color: '#ff00dd',
    premium: true,
    gradient: 'from-purple-900/30 to-pink-900/30',
    borderColor: 'border-purple-500/50',
    hoverBorder: 'hover:border-purple-400',
    shadowColor: 'hover:shadow-purple-500/25'
  },
  {
    id: 2,
    title: 'Corporate Events',
    description: '🏢 Conferences, product launches, team building. Add professional branding and create networking experiences that employees remember.',
    icon: Users,
    color: '#0088ff',
    gradient: 'from-blue-900/20 to-cyan-900/20',
    borderColor: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-400',
    shadowColor: 'hover:shadow-blue-500/20'
  },
  {
    id: 3,
    title: 'Family Events',
    description: '💕 Weddings, reunions, anniversaries. Create magical moments that bring families together and preserve memories in stunning 3D displays.',
    icon: () => (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: '#00ff88',
    gradient: 'from-green-900/20 to-emerald-900/20',
    borderColor: 'border-green-500/30',
    hoverBorder: 'hover:border-green-400',
    shadowColor: 'hover:shadow-green-500/20'
  },
  {
    id: 4,
    title: 'Birthdays & Parties',
    description: '🎉 Make any celebration unforgettable. From kids\' parties to milestone birthdays, guests love seeing their photos come alive in 3D.',
    icon: Sparkles,
    color: '#ffae00',
    gradient: 'from-yellow-900/20 to-orange-900/20',
    borderColor: 'border-yellow-500/30',
    hoverBorder: 'hover:border-yellow-400',
    shadowColor: 'hover:shadow-yellow-500/20'
  },
  {
    id: 5,
    title: 'Bands & Musicians',
    description: '🎵 Concerts, gigs, album launches. Fans share photos that create stunning visual backdrops, adding energy to your performances.',
    icon: () => (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    color: '#ff4400',
    gradient: 'from-red-900/20 to-pink-900/20',
    borderColor: 'border-red-500/30',
    hoverBorder: 'hover:border-red-400',
    shadowColor: 'hover:shadow-red-500/20'
  },
  {
    id: 6,
    title: 'DJ/VJ\'s',
    description: '🎧 Add visual storytelling to your sets. Create immersive experiences where crowd photos become part of your visual performance.',
    icon: () => (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    color: '#9966ff',
    gradient: 'from-indigo-900/20 to-purple-900/20',
    borderColor: 'border-indigo-500/30',
    hoverBorder: 'hover:border-indigo-400',
    shadowColor: 'hover:shadow-indigo-500/20'
  },
  {
    id: 7,
    title: 'Entertainers',
    description: '🎭 Magicians, comedians, performers. Engage your audience with interactive displays that make them part of the show.',
    icon: () => (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: '#00ffe1',
    gradient: 'from-teal-900/20 to-cyan-900/20',
    borderColor: 'border-teal-500/30',
    hoverBorder: 'hover:border-teal-400',
    shadowColor: 'hover:shadow-teal-500/20'
  },
  {
    id: 8,
    title: 'Festivals',
    description: '🎪 Music festivals, art shows, food festivals. Create massive community displays on big screens and projectors for shared experiences.',
    icon: () => (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: '#ff6600',
    gradient: 'from-orange-900/20 to-red-900/20',
    borderColor: 'border-orange-500/30',
    hoverBorder: 'hover:border-orange-400',
    shadowColor: 'hover:shadow-orange-500/20'
  },
  {
    id: 9,
    title: 'Retail & Business',
    description: '🛍️ Store openings, promotions, trade shows. Customer photos with your products create organic marketing and memorable brand experiences.',
    icon: Monitor,
    color: '#8800ff',
    gradient: 'from-violet-900/20 to-purple-900/20',
    borderColor: 'border-violet-500/30',
    hoverBorder: 'hover:border-violet-400',
    shadowColor: 'hover:shadow-violet-500/20'
  },
  {
    id: 10,
    title: 'Event Planners',
    description: '📋 Offer clients something unique that sets your events apart. Easy add-on service that increases your value and client satisfaction.',
    icon: Settings,
    color: '#00ddff',
    gradient: 'from-emerald-900/20 to-teal-900/20',
    borderColor: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-400',
    shadowColor: 'hover:shadow-emerald-500/20'
  },
  {
    id: 11,
    title: 'Venues & Restaurants',
    description: '🍽️ Create unique attractions that bring customers back. Perfect for special events, themed nights, and generating social media buzz.',
    icon: () => (
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: '#ff0088',
    gradient: 'from-rose-900/20 to-pink-900/20',
    borderColor: 'border-rose-500/30',
    hoverBorder: 'hover:border-rose-400',
    shadowColor: 'hover:shadow-rose-500/20'
  }
];

// Error Boundary component for better UX - REMOVED DUPLICATE

const FAQPage: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [particleTheme, setParticleTheme] = useState(PARTICLE_THEMES[0]);

  // Add magical card interactions and CSS animations
  useEffect(() => {
    // Add comprehensive magical card CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float-1 {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(-10px) rotate(5deg); }
        66% { transform: translateY(5px) rotate(-3deg); }
      }
      @keyframes float-2 {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(8px) rotate(-4deg); }
        66% { transform: translateY(-12px) rotate(6deg); }
      }
      @keyframes float-3 {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(-6px) rotate(3deg); }
        66% { transform: translateY(10px) rotate(-5deg); }
      }
      @keyframes gradient-x {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes magical-glow {
        0% { 
          box-shadow: 0 0 20px var(--card-color, #7b00ff); 
          filter: brightness(1);
        }
        50% { 
          box-shadow: 0 0 30px var(--card-color, #7b00ff), 0 0 40px var(--card-color, #7b00ff); 
          filter: brightness(1.2);
        }
        100% { 
          box-shadow: 0 0 20px var(--card-color, #7b00ff); 
          filter: brightness(1);
        }
      }
      @keyframes ripple-effect {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(4);
          opacity: 0;
        }
      }
      @keyframes magnetic-particle {
        0% {
          transform: translateY(0px) translateX(0px) scale(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
          transform: scale(1);
        }
        90% {
          opacity: 0.8;
        }
        100% {
          transform: translateY(-30px) translateX(15px) scale(0);
          opacity: 0;
        }
      }
      @keyframes edge-shine {
        0% {
          transform: translateX(-100%) skewX(-15deg);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          transform: translateX(100%) skewX(-15deg);
          opacity: 0;
        }
      }
      @keyframes float-particle {
        0%, 100% {
          transform: translateY(0px) translateX(0px);
          opacity: 0.3;
        }
        25% {
          transform: translateY(-20px) translateX(10px);
          opacity: 0.7;
        }
        50% {
          transform: translateY(-40px) translateX(-5px);
          opacity: 0.5;
        }
        75% {
          transform: translateY(-20px) translateX(-10px);
          opacity: 0.8;
        }
      }

      @keyframes float-photo {
        0%, 100% {
          transform: translateY(0px) rotate(var(--rotation, 0deg));
          opacity: var(--opacity, 0.2);
        }
        33% {
          transform: translateY(-15px) rotate(calc(var(--rotation, 0deg) + 3deg));
          opacity: calc(var(--opacity, 0.2) + 0.1);
        }
        66% {
          transform: translateY(8px) rotate(calc(var(--rotation, 0deg) - 2deg));
          opacity: var(--opacity, 0.2);
        }
      }
      
      .animate-float-1 { 
        animation: float-1 6s ease-in-out infinite; 
        --rotation: -12deg;
        --opacity: 0.2;
      }
      .animate-float-2 { 
        animation: float-2 8s ease-in-out infinite; 
        --rotation: 6deg;
        --opacity: 0.25;
      }
      .animate-float-3 { 
        animation: float-3 7s ease-in-out infinite; 
        --rotation: 12deg;
        --opacity: 0.15;
      }
      .animate-gradient-x { 
        background-size: 400% 400%;
        animation: gradient-x 8s ease infinite;
      }
      
      /* Magical card effects - ALWAYS ON by default */
      .magical-card {
        position: relative;
        overflow: hidden;
        perspective: 1000px;
      }
      
      .magical-card::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: radial-gradient(
          600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
          var(--card-color, #a855f7)15 0%,
          transparent 40%
        );
        opacity: 0.2;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 1;
      }
      
      .magical-card:hover::after {
        opacity: 0.4;
      }
      
      .card-ripple {
        position: absolute;
        border-radius: 50%;
        background: var(--card-color, #a855f7);
        pointer-events: none;
        z-index: 2;
        animation: ripple-effect 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0.8;
      }
      
      .magnetic-particles {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        border-radius: inherit;
        z-index: 1;
      }
      
      .magnetic-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: var(--card-color, #a855f7);
        border-radius: 50%;
        opacity: 0;
        animation: magnetic-particle 3s ease-in-out infinite;
        box-shadow: 0 0 10px var(--card-color, #a855f7);
        filter: blur(1px);
      }
      
      .edge-glow {
        position: absolute;
        inset: -4px;
        border-radius: inherit;
        background: var(--card-color, #a855f7);
        opacity: 0.4;
        filter: blur(15px);
        animation: magical-glow 3s ease-in-out infinite;
        z-index: -1;
      }
      
      .magical-card:hover .edge-glow {
        opacity: 0.6;
        animation: magical-glow 2s ease-in-out infinite;
      }
      
      .card-highlight {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: radial-gradient(
          400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
          rgba(255, 255, 255, 0.2) 0%,
          rgba(255, 255, 255, 0.1) 30%,
          transparent 50%
        );
        opacity: 0.3;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 2;
        mix-blend-mode: overlay;
      }
      
      .magical-card:hover .card-highlight {
        opacity: 0.5;
      }

      .absolute.w-1.h-1 {
        animation: float-particle linear infinite;
      }

      /* Enhanced card animations for magical effects */
      @keyframes floating {
        0% { transform: translateY(0px); }
        100% { transform: translateY(-8px); }
      }

      .card.flipped .rune {
        opacity: 1 !important;
        visibility: visible !important;
      }

      .card.flipped .secret-content {
        opacity: 1 !important;
        visibility: visible !important;
        display: flex !important;
      }

      /* Fix text direction for flipped cards */
      .card-back {
        transform: rotateY(180deg);
      }
      
      .card.flipped .card-back {
        transform: rotateY(0deg);
      }

      /* Use case cards specific animations */
      .use-case-card {
        position: relative;
        overflow: hidden;
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .use-case-card:hover {
        transform: scale(1.05) translateY(-5px);
      }

      .use-case-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--card-gradient);
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: inherit;
      }

      .use-case-card:hover::before {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
    
    // Add magical card interactions
    const cards = document.querySelectorAll('.magical-card');
    
    const handleMouseMove = (e, card) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
      
      // 3D tilt effect
      const rotateY = -(x - 50) * 0.3;
      const rotateX = (y - 50) * 0.3;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };
    
    const handleMouseLeave = (card) => {
      card.style.transform = '';
      card.style.setProperty('--mouse-x', '50%');
      card.style.setProperty('--mouse-y', '50%');
    };
    
    const handleClick = (e, card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create ripple effect
      const ripple = document.createElement('div');
      ripple.className = 'card-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '0px';
      ripple.style.height = '0px';
      
      card.appendChild(ripple);
      
      // Remove ripple after animation
      setTimeout(() => {
        ripple.remove();
      }, 600);
      
      // Create magnetic particles
      createMagneticParticles(card, x, y);
    };
    
    const createMagneticParticles = (card, x, y) => {
      const container = card.querySelector('.magnetic-particles');
      if (!container) return;
      
      // Create multiple particles for better effect
      for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'magnetic-particle';
        
        const angle = (i / 12) * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance;
        
        particle.style.left = `${particleX}px`;
        particle.style.top = `${particleY}px`;
        particle.style.animationDelay = `${i * 0.05}s`;
        particle.style.animationDuration = `${2 + Math.random()}s`;
        
        // Use card's color
        const cardColor = card.style.getPropertyValue('--card-color') || '#a855f7';
        particle.style.background = cardColor;
        particle.style.boxShadow = `0 0 10px ${cardColor}`;
        
        container.appendChild(particle);
        
        setTimeout(() => {
          if (particle.parentNode) {
            particle.remove();
          }
        }, 3000);
      }
    };
    
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => handleMouseMove(e, card));
      card.addEventListener('mouseleave', () => handleMouseLeave(card));
      card.addEventListener('click', (e) => handleClick(e, card));
    });
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      cards.forEach(card => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
        card.removeEventListener('click', handleClick);
      });
    };
  }, []);

  const categories = [
    { id: 'all', name: 'All Topics', icon: Globe },
    { id: 'general', name: 'General', icon: Camera },
    { id: 'technical', name: 'Technical', icon: Settings },
    { id: 'features', name: 'Features', icon: Zap },
    { id: 'customization', name: 'Customization', icon: Palette },
    { id: 'professional', name: 'Professional', icon: Award }
  ];

  // Search component
  const SearchBar = ({ searchTerm, onSearchChange }) => {
    return (
      <div className="relative max-w-2xl mx-auto mb-12">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search FAQ topics..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
        />
      </div>
    );
  };

  // Category filter buttons
  const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
    return (
      <div className="flex flex-wrap gap-3 justify-center mb-12">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`
              px-6 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm
              ${activeCategory === category.id
                ? 'bg-gradient-to-r from-purple-600/40 to-blue-600/40 border border-purple-500/50 text-white shadow-lg'
                : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20 hover:text-white'
              }
            `}
          >
            <category.icon className="w-4 h-4 inline mr-2" />
            {category.name}
          </button>
        ))}
      </div>
    );
  };

  const flipCard = (card: HTMLDivElement, toAnswerSide: boolean) => {
    const cardInner = card.querySelector('.card-inner');
    const cardFront = card.querySelector('.card-front');
    const cardBack = card.querySelector('.card-back');
    const secretContent = card.querySelector('.secret-content');
    const runes = card.querySelectorAll('.rune');

    if (toAnswerSide) {
      card.classList.add('flipped');
      
      if (cardInner) (cardInner as HTMLElement).style.transform = 'rotateY(180deg)';
      if (cardBack) {
        (cardBack as HTMLElement).style.opacity = '1';
        (cardBack as HTMLElement).style.visibility = 'visible';
        (cardBack as HTMLElement).style.zIndex = '3';
        (cardBack as HTMLElement).style.display = 'flex';
      }
      if (cardFront) {
        (cardFront as HTMLElement).style.opacity = '0';
        (cardFront as HTMLElement).style.visibility = 'hidden';
        (cardFront as HTMLElement).style.zIndex = '0';
      }
      
      // Animate runes and content appearing
      setTimeout(() => {
        runes.forEach((rune, index) => {
          setTimeout(() => {
            (rune as HTMLElement).style.opacity = '1';
            (rune as HTMLElement).style.visibility = 'visible';
          }, 50 * index);
        });
        
        if (secretContent) {
          (secretContent as HTMLElement).style.opacity = '1';
          (secretContent as HTMLElement).style.visibility = 'visible';
          (secretContent as HTMLElement).style.display = 'flex';
        }
      }, 300);
    } else {
      card.classList.remove('flipped');
      
      if (cardInner) (cardInner as HTMLElement).style.transform = 'rotateY(0deg)';
      if (cardFront) {
        (cardFront as HTMLElement).style.opacity = '1';
        (cardFront as HTMLElement).style.visibility = 'visible';
        (cardFront as HTMLElement).style.zIndex = '2';
      }
      if (cardBack) {
        (cardBack as HTMLElement).style.opacity = '0';
        (cardBack as HTMLElement).style.visibility = 'hidden';
        (cardBack as HTMLElement).style.zIndex = '1';
        (cardBack as HTMLElement).style.display = 'none';
      }
      if (secretContent) {
        (secretContent as HTMLElement).style.opacity = '0';
        (secretContent as HTMLElement).style.visibility = 'hidden';
        (secretContent as HTMLElement).style.display = 'none';
      }

      // Hide runes
      runes.forEach(rune => {
        (rune as HTMLElement).style.opacity = '0';
        (rune as HTMLElement).style.visibility = 'hidden';
      });
    }
  };

  const addClickEffect = (button: HTMLButtonElement, card: HTMLDivElement) => {
    const ripple = document.createElement('div');
    ripple.className = 'button-ripple';
    button.appendChild(ripple);

    ripple.style.position = 'absolute';
    ripple.style.top = '50%';
    ripple.style.left = '50%';
    ripple.style.width = '150%';
    ripple.style.height = '150%';
    ripple.style.transform = 'translate(-50%, -50%) scale(0)';
    ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    ripple.style.borderRadius = '50%';
    ripple.style.zIndex = '-1';
    ripple.style.animation = 'ripple-effect 0.6s cubic-bezier(0.1, 0.7, 0.3, 1) forwards';

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <ErrorBoundary>
        <div className="relative w-full min-h-[calc(100vh-160px)] bg-black text-white overflow-y-auto">
          {/* 3D Scene Background - Same as pricing page */}
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
          
          <div className="relative z-5">
            {/* Hero Section */}
            <div className="relative overflow-hidden min-h-[70vh] flex items-center">
              {/* Hero Content */}
              <div className="relative z-[20] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
                <div className="text-center lg:text-left lg:w-1/2">
                  {/* Abstract diffused gradient overlay behind text */}
                  <div className="relative">
                    <div className="absolute -inset-8 bg-gradient-radial from-black/50 via-black/30 to-transparent opacity-80 blur-xl"></div>
                    <div className="absolute -inset-4 bg-gradient-to-br from-black/40 via-transparent to-black/20 opacity-60 blur-lg"></div>
                    <div className="absolute -inset-2 bg-gradient-to-r from-black/30 via-black/10 to-transparent opacity-70 blur-md"></div>
                    
                    <div className="relative">
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-lg">
                          Frequently Asked
                        </span>
                        <span className="block drop-shadow-lg">Questions</span>
                      </h1>
                      
                      <p className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow-lg">
                        Everything you need to know about PhotoSphere's revolutionary 3D photobooth platform. 
                        Find answers about compatibility, features, pricing, and setup.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                        <button
                          onClick={() => setIsDemoModalOpen(true)}
                          className="px-8 py-3 text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-colors flex items-center justify-center shadow-lg hover:shadow-purple-500/25"
                        >
                          Request Demo
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[20] pointer-events-none">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">500+</div>
                    <div className="text-sm text-gray-400">Photos Per Event</div>
                  </div>
                  <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">&lt;1s</div>
                    <div className="text-sm text-gray-400">Real-time Display</div>
                  </div>
                  <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">∞</div>
                    <div className="text-sm text-gray-400">Simultaneous Users</div>
                  </div>
                  <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400 mb-1">0</div>
                    <div className="text-sm text-gray-400">Hardware Required</div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Content Section */}
            <div className="relative z-10 py-20 bg-gradient-to-b from-black/10 to-black/30">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Search and Category Filters */}
                <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                <CategoryFilter 
                  categories={categories} 
                  activeCategory={activeCategory} 
                  onCategoryChange={setActiveCategory} 
                />

                {/* FAQ Cards Grid */}
                <div className="flex justify-center items-center flex-wrap gap-8 p-8 max-w-7xl mx-auto" ref={cardsContainerRef}>
                  {filteredFAQs.map((faq, index) => (
                    <div
                      key={faq.id}
                      className="magical-card relative w-80 h-[450px] bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-all duration-600 cursor-pointer"
                      style={{ '--card-color': faq.color }}
                      ref={(el) => (cardRefs.current[index] = el)}
                      onClick={(e) => {
                        const card = cardRefs.current[index];
                        if (card && !(e.target as HTMLElement).closest('.btn')) {
                          const isFlipped = card.classList.contains('flipped');
                          flipCard(card, !isFlipped);
                        }
                      }}
                    >
                      {/* Magical effects containers */}
                      <div className="magnetic-particles"></div>
                      <div className="edge-glow"></div>
                      <div className="card-highlight"></div>
                      
                      <div className="card-inner relative w-full h-full transition-transform duration-800 transform-style-3d rounded-3xl">
                        {/* Default State - Using the beautiful third state as the first state */}
                        <div className="card-front absolute w-full h-full rounded-3xl overflow-hidden flex flex-col justify-center items-center p-6 bg-[linear-gradient(135deg,rgba(0,10,30,0.8)_0%,rgba(0,10,40,0.9)_100%)]">
                          {/* Magical circle with vibrant glow */}
                          <div 
                            className="magical-circle absolute w-[220px] h-[220px] rounded-full border-2 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-2 opacity-70 pointer-events-none"
                            style={{ 
                              borderColor: faq.color + '80',
                              boxShadow: `0 0 30px ${faq.color}AA, inset 0 0 30px ${faq.color}40`
                            }}
                          />
                          
                          {/* Magical runes always visible and glowing */}
                          {['✧', '⦿', '⚝', '⚜', '✴', '⚹', '⦾'].map((rune, runeIndex) => (
                            <div 
                              key={runeIndex}
                              className="rune absolute text-xl opacity-80 transition-all duration-500 animate-pulse z-3 pointer-events-none" 
                              style={{ 
                                color: faq.color,
                                top: `${25 + Math.sin(runeIndex * Math.PI * 2 / 7) * 25 + 25}%`,
                                left: `${25 + Math.cos(runeIndex * Math.PI * 2 / 7) * 25 + 25}%`,
                                filter: `drop-shadow(0 0 15px ${faq.color}) brightness(1.3)`,
                                textShadow: `0 0 20px ${faq.color}`
                              }}
                            >
                              {rune}
                            </div>
                          ))}
                          
                          <div className="card-content relative flex flex-col justify-center items-center p-8 h-full text-center z-10">
                            <faq.icon 
                              className="text-4xl mb-4 drop-shadow-lg animate-pulse" 
                              style={{ 
                                color: faq.color,
                                filter: `drop-shadow(0 0 20px ${faq.color}) brightness(1.2)`,
                                textShadow: `0 0 25px ${faq.color}`
                              }}
                            />
                            <h2 className="font-orbitron text-xl font-bold mb-4 text-white text-center leading-tight">
                              {faq.question}
                            </h2>
                            <p className="text-sm leading-relaxed mb-6 text-white/90">
                              Click to reveal the full answer
                            </p>
                            <button
                              className="btn relative inline-block px-6 py-3 text-white border-2 border-white/30 rounded-full font-orbitron text-xs font-semibold uppercase tracking-wide cursor-pointer transition-all duration-300 shadow-lg backdrop-blur-sm hover:scale-105"
                              style={{ 
                                backgroundColor: faq.color + 'B0',
                                boxShadow: `0 0 15px ${faq.color}80`
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const card = cardRefs.current[index];
                                if (card) {
                                  addClickEffect(e.currentTarget, card);
                                  setTimeout(() => flipCard(card, true), 200);
                                }
                              }}
                            >
                              Read Answer
                            </button>
                          </div>
                        </div>
                        
                        {/* Answer State - Full answer content */}
                        <div className="card-back absolute w-full h-full rounded-3xl overflow-hidden flex flex-col justify-center items-center p-6 bg-[linear-gradient(135deg,rgba(0,10,30,0.8)_0%,rgba(0,10,40,0.9)_100%)] z-1">
                          {/* Dimmed magical circle */}
                          <div 
                            className="magical-circle absolute w-[300px] h-[300px] rounded-full border top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-1 opacity-20 pointer-events-none"
                            style={{ 
                              borderColor: faq.color + '30',
                              boxShadow: `0 0 30px ${faq.color}20`
                            }}
                          />
                          
                          {/* Dimmed runes */}
                          {['✧', '⦿', '⚝', '⚜', '✴', '⚹', '⦾'].map((rune, runeIndex) => (
                            <div 
                              key={runeIndex}
                              className="rune absolute text-lg opacity-0 transition-all duration-500 z-2 pointer-events-none" 
                              style={{ 
                                color: faq.color + '60',
                                top: `${15 + Math.sin(runeIndex * Math.PI * 2 / 7) * 35 + 25}%`,
                                left: `${15 + Math.cos(runeIndex * Math.PI * 2 / 7) * 35 + 25}%`,
                                filter: `drop-shadow(0 0 5px ${faq.color}50)`
                              }}
                            >
                              {rune}
                            </div>
                          ))}
                          
                          <div className="secret-content absolute top-1/2 left-1/2 w-[90%] -translate-x-1/2 -translate-y-1/2 opacity-0 invisible transition-all duration-500 flex flex-col items-center justify-center text-center z-5">
                            <faq.icon 
                              className="text-3xl mb-3 drop-shadow-lg" 
                              style={{ color: faq.color }}
                            />
                            <h2 className="font-orbitron text-lg font-bold mb-3 text-white leading-tight">
                              {faq.question}
                            </h2>
                            <p className="text-sm leading-relaxed mb-6 text-white/90 max-h-48 overflow-y-auto">
                              {faq.answer}
                            </p>
                            <button
                              className="btn text-white border-2 border-white/30 px-6 py-2 rounded-full font-orbitron uppercase font-bold text-xs tracking-wide cursor-pointer transition-all duration-300 hover:scale-105"
                              style={{ 
                                backgroundColor: faq.color + 'B0',
                                boxShadow: `0 0 15px ${faq.color}80`
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const card = cardRefs.current[index];
                                if (card) {
                                  addClickEffect(e.currentTarget, card);
                                  setTimeout(() => flipCard(card, false), 200);
                                }
                              }}
                            >
                              Back
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* No Results */}
                {filteredFAQs.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-purple-500/30">
                      <Search className="w-12 h-12 text-white/70" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">No results found</h3>
                    <p className="text-gray-400 mb-6">Try adjusting your search terms or category filter.</p>
                    <button 
                      onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
                      className="px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30 hover:from-purple-500/40 hover:to-blue-500/40 backdrop-blur-xl transition-all duration-500 transform hover:scale-105"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

                {/* Contact CTA */}
                <div className="text-center mt-20">
                  <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12">
                    <div className="max-w-3xl mx-auto">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-purple-500/30">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">Still Have Questions?</h3>
                      <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                        Can't find what you're looking for? We're here to help! Contact our support team 
                        for personalized assistance with your PhotoSphere setup, technical questions, 
                        or custom requirements for your events.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                          onClick={() => setIsDemoModalOpen(true)}
                          className="px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-500 transform hover:scale-105 bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30 hover:from-purple-500/40 hover:to-blue-500/40 backdrop-blur-xl"
                        >
                          Contact Support
                        </button>
                        <button 
                          onClick={() => setIsDemoModalOpen(true)}
                          className="px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-500 transform hover:scale-105 bg-white/10 border border-white/20 hover:bg-white/20 backdrop-blur-xl"
                        >
                          Schedule Demo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Use Cases Section - Moved After FAQ */}
            <div className="relative z-10 py-20 bg-gradient-to-b from-black/50 to-black/70">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-20 right-20 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
                  <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-2000"></div>
                </div>

                <div className="text-center mb-16 relative">
                  <div className="inline-block mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl animate-pulse"></div>
                      <h2 className="relative text-5xl md:text-6xl font-bold text-white mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-gradient-x">
                          Who Can Use PhotoSphere?
                        </span>
                      </h2>
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                    <span className="text-white font-semibold">Anyone can create magic</span> ✨ From intimate gatherings to massive festivals, 
                    discover how different industries transform ordinary events into <span className="text-purple-400 font-semibold">extraordinary 3D experiences</span>.
                  </p>
                  
                  {/* Floating icons animation */}
                  <div className="relative mt-8 h-16">
                    <div className="absolute inset-0 flex justify-center items-center space-x-8">
                      <div className="animate-float-1 opacity-60">
                        <Camera className="w-8 h-8 text-purple-400" />
                      </div>
                      <div className="animate-float-2 opacity-60">
                        <Users className="w-8 h-8 text-blue-400" />
                      </div>
                      <div className="animate-float-3 opacity-60">
                        <Sparkles className="w-8 h-8 text-pink-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Use Cases Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
                  {useCaseData.map((useCase) => (
                    <div
                      key={useCase.id}
                      className={`
                        use-case-card group relative backdrop-blur-xl border-2 rounded-3xl p-8 transition-all duration-500 transform-gpu
                        ${useCase.premium 
                          ? `bg-gradient-to-br ${useCase.gradient} ${useCase.borderColor} hover:scale-110 hover:shadow-2xl ${useCase.shadowColor}` 
                          : `bg-black/30 ${useCase.borderColor} ${useCase.hoverBorder} hover:scale-105 hover:shadow-xl ${useCase.shadowColor}`
                        }
                      `}
                      style={{ 
                        '--card-gradient': `linear-gradient(135deg, ${useCase.color}10, ${useCase.color}05)`,
                        '--card-color': useCase.color
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${useCase.gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                      {useCase.premium && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-3 py-1 rounded-full transform rotate-12 animate-pulse">
                          💰 HIGH ROI
                        </div>
                      )}
                      <div className="relative">
                        <div 
                          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg"
                          style={{ 
                            background: `linear-gradient(135deg, ${useCase.color}, ${useCase.color}CC)`
                          }}
                        >
                          <useCase.icon className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-opacity-90 transition-colors">
                          {useCase.title}
                        </h3>
                        <p className="text-gray-300 leading-relaxed mb-4">
                          {useCase.description}
                        </p>
                        {useCase.highlight && (
                          <div className="text-sm font-semibold" style={{ color: useCase.color }}>
                            {useCase.highlight}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Bottom CTA with Animation */}
                <div className="text-center relative">
                  <div className="relative bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-2 border-purple-500/30 rounded-3xl p-12 hover:border-purple-400/50 transition-all duration-500 overflow-hidden">
                    {/* Animated background patterns */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
                      <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="inline-block mb-6">
                        <div className="animate-bounce">
                          <Sparkles className="w-12 h-12 text-yellow-400 mx-auto" />
                        </div>
                      </div>
                      <h3 className="text-4xl font-bold text-white mb-6">
                        Ready to Transform Your Events?
                      </h3>
                      <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                        No matter what type of events you host or what industry you're in, PhotoSphere adapts to your needs. 
                        Join <span className="text-purple-400 font-bold">thousands of event professionals</span> who've discovered the power of 3D photo experiences.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-6 justify-center mb-6">
                        <button 
                          onClick={() => setIsDemoModalOpen(true)}
                          className="text-lg px-10 py-5 transform hover:scale-110 px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-500 bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30 hover:from-purple-500/40 hover:to-blue-500/40 backdrop-blur-xl"
                        >
                          🚀 Start Your Free Trial
                        </button>
                        <button 
                          onClick={() => setIsDemoModalOpen(true)}
                          className="text-lg px-10 py-5 transform hover:scale-110 px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-500 bg-white/10 border border-white/20 hover:bg-white/20 backdrop-blur-xl"
                        >
                          👀 See It In Action
                        </button>
                      </div>
                      <p className="text-sm text-gray-400">
                        ✨ <strong>14-day free trial</strong> • 💳 No credit card required • ⚡ Setup in minutes
                      </p>
                    </div>
                  </div>
                </div>

                <footer className="text-center py-8 text-white/70 text-sm w-full z-10 mt-12">
                  <p>PhotoSphere FAQ - Revolutionary 3D Photobooth Platform</p>
                </footer>
              </div>
            </div>
          </div>
        </div>

        <DemoRequestModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
      </ErrorBoundary>
    </Layout>
  );
};

export default FAQPage;