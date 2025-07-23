import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Enhanced particle color themes with new additions
export const PARTICLE_THEMES = [
  { name: 'Purple Magic', primary: '#8b5cf6', secondary: '#a855f7', accent: '#c084fc' },
  { name: 'Ocean Breeze', primary: '#06b6d4', secondary: '#0891b2', accent: '#67e8f9' },
  { name: 'Sunset Glow', primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
  { name: 'Forest Dream', primary: '#10b981', secondary: '#059669', accent: '#34d399' },
  { name: 'Rose Petals', primary: '#ec4899', secondary: '#db2777', accent: '#f9a8d4' },
  { name: 'Electric Blue', primary: '#3b82f6', secondary: '#2563eb', accent: '#93c5fd' },
  { name: 'Cosmic Red', primary: '#ef4444', secondary: '#dc2626', accent: '#fca5a5' },
  // NEW THEMES
  { name: 'Rainbow Spectrum', primary: '#ff0000', secondary: '#00ff00', accent: '#0000ff' },
  { name: 'Pure White', primary: '#ffffff', secondary: '#f8f8ff', accent: '#fffff0' },
  { name: 'Christmas Magic', primary: '#dc2626', secondary: '#16a34a', accent: '#ffffff' },
  { name: 'Disabled', primary: '#000000', secondary: '#000000', accent: '#000000' }
];

interface MilkyWayParticleSystemProps {
  colorTheme: typeof PARTICLE_THEMES[0];
  intensity?: number;
  enabled?: boolean;
  photoPositions?: Array<{ position: [number, number, number] }>;
  isRecording?: boolean;
}

const MilkyWayParticleSystem: React.FC<MilkyWayParticleSystemProps> = ({ 
  colorTheme, 
  intensity = 1.0, 
  enabled = true,
  photoPositions = [],
  isRecording = false
}) => {
  const mainCloudRef = useRef<THREE.Points>(null);
  const dustCloudRef = useRef<THREE.Points>(null);
  const clustersRef = useRef<THREE.Group>(null);
  const atmosphericRef = useRef<THREE.Points>(null);
  const distantSwirlRef = useRef<THREE.Points>(null);
  const bigSwirlsRef = useRef<THREE.Group>(null);
  const snowParticlesRef = useRef<THREE.Points>(null);
  const twinkleParticlesRef = useRef<THREE.Points>(null);
  const geometricSnowflakesRef = useRef<THREE.Group>(null);
  
  // Use consistent particle counts regardless of theme to avoid buffer resize issues
  const recordingMultiplier = isRecording ? 1.2 : 1.0;
  const MAIN_COUNT = Math.floor(4000 * intensity * recordingMultiplier);
  const DUST_COUNT = Math.floor(2500 * intensity * recordingMultiplier);
  const CLUSTER_COUNT = Math.floor(8 * intensity);
  const PARTICLES_PER_CLUSTER = 300;
  const ATMOSPHERIC_COUNT = Math.floor(3000 * intensity * recordingMultiplier);
  const DISTANT_SWIRL_COUNT = Math.floor(1500 * intensity * recordingMultiplier);
  const BIG_SWIRLS_COUNT = Math.floor(4 * intensity);
  const SNOW_COUNT = Math.floor(2000 * intensity * recordingMultiplier);
  const TWINKLE_COUNT = Math.floor(500 * intensity * recordingMultiplier);
  const GEOMETRIC_SNOWFLAKES_COUNT = Math.floor(80 * intensity * recordingMultiplier);
  
  // Determine if we're using special themes
  const isRainbowTheme = colorTheme.name === 'Rainbow Spectrum';
  const isWhiteTheme = colorTheme.name === 'Pure White';
  const isChristmasTheme = colorTheme.name === 'Christmas Magic';

  // Helper function to create geometric snowflake geometry
  const createSnowflakeGeometry = (complexity: number = 1) => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const branches = 6;
    const size = 0.8 + Math.random() * 1.2;
    
    vertices.push(0, 0, 0);
    
    for (let i = 0; i < branches; i++) {
      const angle = (i / branches) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const branchLength = size;
      vertices.push(cos * branchLength, sin * branchLength, 0);
      
      for (let j = 0.3; j <= 0.9; j += 0.3) {
        const subLength = branchLength * j;
        const subBranchSize = (1 - j) * 0.4 * size;
        
        const leftAngle = angle - Math.PI / 6;
        vertices.push(
          cos * subLength + Math.cos(leftAngle) * subBranchSize,
          sin * subLength + Math.sin(leftAngle) * subBranchSize,
          0
        );
        
        const rightAngle = angle + Math.PI / 6;
        vertices.push(
          cos * subLength + Math.cos(rightAngle) * subBranchSize,
          sin * subLength + Math.sin(rightAngle) * subBranchSize,
          0
        );
        
        const mainIndex = 1 + i;
        const leftIndex = vertices.length / 3 - 2;
        const rightIndex = vertices.length / 3 - 1;
        
        indices.push(0, mainIndex, leftIndex);
        indices.push(0, mainIndex, rightIndex);
      }
      
      indices.push(0, 1 + i, 1 + ((i + 1) % branches));
    }
    
    const innerSize = size * 0.3;
    const innerStartIndex = vertices.length / 3;
    for (let i = 0; i < branches; i++) {
      const angle = (i / branches) * Math.PI * 2 + Math.PI / 6;
      vertices.push(
        Math.cos(angle) * innerSize,
        Math.sin(angle) * innerSize,
        0
      );
      
      indices.push(0, innerStartIndex + i, innerStartIndex + ((i + 1) % branches));
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  };

  // Helper functions for color generation
  const getRainbowColor = (index: number, total: number) => {
    const hue = (index / total) * 360;
    const color = new THREE.Color();
    color.setHSL(hue / 360, 1, 0.6);
    return color;
  };

  const getChristmasColor = (index: number) => {
    const rand = Math.random();
    if (rand < 0.4) return new THREE.Color('#dc2626');
    if (rand < 0.8) return new THREE.Color('#16a34a');
    return new THREE.Color('#ffffff');
  };

  // Create geometric snowflakes data
  const geometricSnowflakesData = useMemo(() => {
    const snowflakes = [];
    
    for (let i = 0; i < GEOMETRIC_SNOWFLAKES_COUNT; i++) {
      snowflakes.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 500,
          Math.random() * 300 + 100,
          (Math.random() - 0.5) * 500
        ] as [number, number, number],
        rotation: [0, 0, Math.random() * Math.PI * 2] as [number, number, number],
        scale: 0.5 + Math.random() * 1.5,
        fallSpeed: 0.008 + Math.random() * 0.012,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        swaySpeed: Math.random() * 0.5 + 0.3,
        swayAmount: Math.random() * 0.002 + 0.001,
        geometry: createSnowflakeGeometry(1 + Math.random())
      });
    }
    
    return snowflakes;
  }, [GEOMETRIC_SNOWFLAKES_COUNT, isChristmasTheme]);

  // Create realistic particle distribution with new theme support
  const particleData = useMemo(() => {
    if (!enabled || intensity === 0) {
      return {
        main: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), count: 0 },
        dust: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), count: 0 },
        clusters: [],
        atmospheric: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), count: 0 },
        distantSwirl: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), count: 0 },
        bigSwirls: [],
        snow: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), count: 0 },
        twinkle: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), phases: new Float32Array(0), count: 0 }
      };
    }

    // Main cloud particles
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
      const heightNoise = (Math.random() - 0.5) * (1 + distanceFromCenter * 0.02);
      
      mainPositions[i * 3] = Math.cos(angle) * distanceFromCenter + noise;
      mainPositions[i * 3 + 1] = heightNoise + Math.sin(angle * 0.1) * (distanceFromCenter * 0.01) - 5;
      mainPositions[i * 3 + 2] = Math.sin(angle) * distanceFromCenter + noise;
      
      mainVelocities[i * 3] = (Math.random() - 0.5) * 0.002;
      mainVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0005;
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
    
    // Dust cloud particles
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    const dustColors = new Float32Array(DUST_COUNT * 3);
    const dustSizes = new Float32Array(DUST_COUNT);
    const dustVelocities = new Float32Array(DUST_COUNT * 3);
    
    for (let i = 0; i < DUST_COUNT; i++) {
      const radius = Math.pow(Math.random(), 2) * 50 + 10;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 10 - 5;
      
      dustPositions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 15;
      dustPositions[i * 3 + 1] = height;
      dustPositions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 15;
      
      dustVelocities[i * 3] = (Math.random() - 0.5) * 0.003;
      dustVelocities[i * 3 + 1] = Math.random() * 0.001 + 0.0005;
      dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
      
      dustSizes[i] = 0.3 + Math.random() * 1.2;
    }
    
    // Create star clusters
    const clusterData = [];
    for (let c = 0; c < CLUSTER_COUNT; c++) {
      const clusterDistance = 30 + Math.random() * 100;
      const clusterAngle = Math.random() * Math.PI * 2;
      const clusterHeight = (Math.random() - 0.5) * 20 - 10;
      
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
        clusterVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0005;
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
    
    // Atmospheric particles
    const atmosphericPositions = new Float32Array(ATMOSPHERIC_COUNT * 3);
    const atmosphericColors = new Float32Array(ATMOSPHERIC_COUNT * 3);
    const atmosphericSizes = new Float32Array(ATMOSPHERIC_COUNT);
    const atmosphericVelocities = new Float32Array(ATMOSPHERIC_COUNT * 3);
    
    for (let i = 0; i < ATMOSPHERIC_COUNT; i++) {
      atmosphericPositions[i * 3] = (Math.random() - 0.5) * 200;
      atmosphericPositions[i * 3 + 1] = Math.random() * 80 + 5;
      atmosphericPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
      
      atmosphericVelocities[i * 3] = (Math.random() - 0.5) * 0.001;
      atmosphericVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0008;
      atmosphericVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
      
      const sizeRandom = Math.random();
      if (sizeRandom < 0.6) {
        atmosphericSizes[i] = 0.2 + Math.random() * 0.8;
      } else if (sizeRandom < 0.85) {
        atmosphericSizes[i] = 1 + Math.random() * 1.5;
      } else {
        atmosphericSizes[i] = 2.5 + Math.random() * 2;
      }
    }
    
    // Distant swirl particles
    const distantSwirlPositions = new Float32Array(DISTANT_SWIRL_COUNT * 3);
    const distantSwirlColors = new Float32Array(DISTANT_SWIRL_COUNT * 3);
    const distantSwirlSizes = new Float32Array(DISTANT_SWIRL_COUNT);
    const distantSwirlVelocities = new Float32Array(DISTANT_SWIRL_COUNT * 3);
    
    for (let i = 0; i < DISTANT_SWIRL_COUNT; i++) {
      const swirlArm = Math.floor(Math.random() * 6);
      const armAngle = (swirlArm * Math.PI / 3) + (Math.random() - 0.5) * 0.3;
      const distanceFromCenter = Math.pow(Math.random(), 0.3) * 150 + 80;
      const spiralTightness = 0.15;
      const angle = armAngle + (distanceFromCenter * spiralTightness);
      
      const noise = (Math.random() - 0.5) * 20;
      const heightVariation = (Math.random() - 0.5) * 40 + 30;
      
      distantSwirlPositions[i * 3] = Math.cos(angle) * distanceFromCenter + noise;
      distantSwirlPositions[i * 3 + 1] = heightVariation + Math.sin(angle * 0.05) * 15;
      distantSwirlPositions[i * 3 + 2] = Math.sin(angle) * distanceFromCenter + noise;
      
      distantSwirlVelocities[i * 3] = (Math.random() - 0.5) * 0.0008;
      distantSwirlVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0005;
      distantSwirlVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0008;
      
      distantSwirlSizes[i] = 1.5 + Math.random() * 3.5;
    }
    
    // Big swirl formations
    const bigSwirlData = [];
    for (let s = 0; s < BIG_SWIRLS_COUNT; s++) {
      const swirlDistance = 120 + Math.random() * 100;
      const swirlAngle = Math.random() * Math.PI * 2;
      const swirlHeight = 40 + Math.random() * 60;
      const particlesPerSwirl = 800;
      
      const swirlCenter = {
        x: Math.cos(swirlAngle) * swirlDistance,
        y: swirlHeight,
        z: Math.sin(swirlAngle) * swirlDistance
      };
      
      const swirlPositions = new Float32Array(particlesPerSwirl * 3);
      const swirlColors = new Float32Array(particlesPerSwirl * 3);
      const swirlSizes = new Float32Array(particlesPerSwirl);
      const swirlVelocities = new Float32Array(particlesPerSwirl * 3);
      
      for (let i = 0; i < particlesPerSwirl; i++) {
        const spiralRadius = Math.pow(Math.random(), 0.4) * 30;
        const spiralAngle = Math.random() * Math.PI * 4 + (spiralRadius * 0.3);
        const spiralHeight = (Math.random() - 0.5) * 25;
        
        swirlPositions[i * 3] = swirlCenter.x + Math.cos(spiralAngle) * spiralRadius;
        swirlPositions[i * 3 + 1] = swirlCenter.y + spiralHeight;
        swirlPositions[i * 3 + 2] = swirlCenter.z + Math.sin(spiralAngle) * spiralRadius;
        
        swirlVelocities[i * 3] = (Math.random() - 0.5) * 0.0005;
        swirlVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0003;
        swirlVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0005;
        
        swirlSizes[i] = 1.2 + Math.random() * 4;
      }
      
      bigSwirlData.push({
        positions: swirlPositions,
        colors: swirlColors,
        sizes: swirlSizes,
        velocities: swirlVelocities,
        center: swirlCenter
      });
    }
    
    // Snow particles
    const snowPositions = new Float32Array(SNOW_COUNT * 3);
    const snowColors = new Float32Array(SNOW_COUNT * 3);
    const snowSizes = new Float32Array(SNOW_COUNT);
    const snowVelocities = new Float32Array(SNOW_COUNT * 3);
    
    for (let i = 0; i < SNOW_COUNT; i++) {
      if (isChristmasTheme) {
        snowPositions[i * 3] = (Math.random() - 0.5) * 400;
        snowPositions[i * 3 + 1] = Math.random() * 200 + 100;
        snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 400;
        
        snowVelocities[i * 3] = (Math.random() - 0.5) * 0.004;
        snowVelocities[i * 3 + 1] = -Math.random() * 0.012 - 0.003;
        snowVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
        
        const sizeRand = Math.random();
        if (sizeRand < 0.4) {
          snowSizes[i] = 0.3 + Math.random() * 0.7;
        } else if (sizeRand < 0.8) {
          snowSizes[i] = 1.0 + Math.random() * 1.5;
        } else {
          snowSizes[i] = 2.0 + Math.random() * 2.0;
        }
      } else {
        snowPositions[i * 3] = 0;
        snowPositions[i * 3 + 1] = -1000;
        snowPositions[i * 3 + 2] = 0;
        
        snowVelocities[i * 3] = 0;
        snowVelocities[i * 3 + 1] = 0;
        snowVelocities[i * 3 + 2] = 0;
        
        snowSizes[i] = 0.1;
      }
    }
    
    // Twinkle particles
    const twinklePositions = new Float32Array(TWINKLE_COUNT * 3);
    const twinkleColors = new Float32Array(TWINKLE_COUNT * 3);
    const twinkleSizes = new Float32Array(TWINKLE_COUNT);
    const twinkleVelocities = new Float32Array(TWINKLE_COUNT * 3);
    const twinklePhases = new Float32Array(TWINKLE_COUNT);
    
    for (let i = 0; i < TWINKLE_COUNT; i++) {
      if (isChristmasTheme) {
        twinklePositions[i * 3] = (Math.random() - 0.5) * 250;
        twinklePositions[i * 3 + 1] = Math.random() * 100 - 10;
        twinklePositions[i * 3 + 2] = (Math.random() - 0.5) * 250;
        
        twinkleVelocities[i * 3] = (Math.random() - 0.5) * 0.001;
        twinkleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
        twinkleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
        
        twinkleSizes[i] = 1 + Math.random() * 3;
        twinklePhases[i] = Math.random() * Math.PI * 2;
      } else {
        twinklePositions[i * 3] = 0;
        twinklePositions[i * 3 + 1] = -1000;
        twinklePositions[i * 3 + 2] = 0;
        
        twinkleVelocities[i * 3] = 0;
        twinkleVelocities[i * 3 + 1] = 0;
        twinkleVelocities[i * 3 + 2] = 0;
        
        twinkleSizes[i] = 0.1;
        twinklePhases[i] = 0;
      }
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
      clusters: clusterData,
      atmospheric: {
        positions: atmosphericPositions,
        colors: atmosphericColors,
        sizes: atmosphericSizes,
        velocities: atmosphericVelocities,
        count: ATMOSPHERIC_COUNT
      },
      distantSwirl: {
        positions: distantSwirlPositions,
        colors: distantSwirlColors,
        sizes: distantSwirlSizes,
        velocities: distantSwirlVelocities,
        count: DISTANT_SWIRL_COUNT
      },
      bigSwirls: bigSwirlData,
      snow: {
        positions: snowPositions,
        colors: snowColors,
        sizes: snowSizes,
        velocities: snowVelocities,
        count: SNOW_COUNT
      },
      twinkle: {
        positions: twinklePositions,
        colors: twinkleColors,
        sizes: twinkleSizes,
        velocities: twinkleVelocities,
        phases: twinklePhases,
        count: TWINKLE_COUNT
      }
    };
  }, [intensity, enabled, MAIN_COUNT, DUST_COUNT, CLUSTER_COUNT, ATMOSPHERIC_COUNT, DISTANT_SWIRL_COUNT, BIG_SWIRLS_COUNT, SNOW_COUNT, TWINKLE_COUNT, isRecording, isChristmasTheme]);

  // Update colors when theme changes
  React.useEffect(() => {
    if (!enabled || !mainCloudRef.current || !dustCloudRef.current || !clustersRef.current || 
        !atmosphericRef.current || !distantSwirlRef.current || !bigSwirlsRef.current) return;
    
    // Update main cloud colors
    if (particleData.main.count > 0) {
      const mainColors = mainCloudRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.main.count; i++) {
        let particleColor: THREE.Color;
        
        if (isRainbowTheme) {
          particleColor = getRainbowColor(i, particleData.main.count);
        } else if (isWhiteTheme) {
          particleColor = new THREE.Color('#ffffff');
          const brightness = 0.7 + Math.random() * 0.3;
          particleColor.multiplyScalar(brightness);
        } else if (isChristmasTheme) {
          particleColor = getChristmasColor(i);
        } else {
          const baseColor = new THREE.Color(colorTheme.primary);
          const hsl = { h: 0, s: 0, l: 0 };
          baseColor.getHSL(hsl);
          
          const hueVariation = (Math.random() - 0.5) * 0.1;
          const saturationVariation = 0.8 + Math.random() * 0.4;
          const lightnessVariation = 0.3 + Math.random() * 0.7;
          
          particleColor = new THREE.Color();
          particleColor.setHSL(
            (hsl.h + hueVariation + 1) % 1,
            Math.min(1, hsl.s * saturationVariation),
            Math.min(1, hsl.l * lightnessVariation)
          );
        }
        
        mainColors[i * 3] = particleColor.r;
        mainColors[i * 3 + 1] = particleColor.g;
        mainColors[i * 3 + 2] = particleColor.b;
      }
      mainCloudRef.current.geometry.attributes.color.needsUpdate = true;
    }
    
    // Update other particle colors (dust, clusters, atmospheric, etc.)
    // Similar color updates for other particle systems...
    
    // Update snow colors
    if (particleData.snow.count > 0 && snowParticlesRef.current) {
      const snowColors = snowParticlesRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.snow.count; i++) {
        if (isChristmasTheme) {
          snowColors[i * 3] = 1;
          snowColors[i * 3 + 1] = 1;
          snowColors[i * 3 + 2] = 1;
        } else {
          snowColors[i * 3] = 0;
          snowColors[i * 3 + 1] = 0;
          snowColors[i * 3 + 2] = 0;
        }
      }
      snowParticlesRef.current.geometry.attributes.color.needsUpdate = true;
    }
    
    // Update twinkle colors
    if (particleData.twinkle.count > 0 && twinkleParticlesRef.current) {
      const twinkleColors = twinkleParticlesRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.twinkle.count; i++) {
        if (isChristmasTheme) {
          const particleColor = getChristmasColor(i);
          twinkleColors[i * 3] = particleColor.r;
          twinkleColors[i * 3 + 1] = particleColor.g;
          twinkleColors[i * 3 + 2] = particleColor.b;
        } else {
          twinkleColors[i * 3] = 0;
          twinkleColors[i * 3 + 1] = 0;
          twinkleColors[i * 3 + 2] = 0;
        }
      }
      twinkleParticlesRef.current.geometry.attributes.color.needsUpdate = true;
    }
  }, [colorTheme, particleData, enabled, isRainbowTheme, isWhiteTheme, isChristmasTheme]);

  // Animation system
  useFrame((state) => {
    if (!enabled) return;
    
    const time = state.clock.getElapsedTime();
    const animationSpeed = isRecording ? 0.5 : 1.0;
    
    // Animate geometric snowflakes
    if (isChristmasTheme && geometricSnowflakesRef.current) {
      geometricSnowflakesRef.current.children.forEach((snowflake, index) => {
        if (index < geometricSnowflakesData.length) {
          const data = geometricSnowflakesData[index];
          
          snowflake.position.y -= data.fallSpeed * animationSpeed;
          
          const swayTime = time * data.swaySpeed;
          snowflake.position.x += Math.sin(swayTime) * data.swayAmount * animationSpeed;
          snowflake.position.z += Math.cos(swayTime * 0.7) * data.swayAmount * animationSpeed;
          
          snowflake.rotation.z += data.rotationSpeed * animationSpeed;
          snowflake.rotation.x += data.rotationSpeed * 0.3 * animationSpeed;
          snowflake.rotation.y += data.rotationSpeed * 0.5 * animationSpeed;
          
          if (snowflake.position.y < -100) {
            snowflake.position.y = 300 + Math.random() * 100;
            snowflake.position.x = (Math.random() - 0.5) * 500;
            snowflake.position.z = (Math.random() - 0.5) * 500;
            snowflake.rotation.set(0, 0, Math.random() * Math.PI * 2);
          }
          
          if (Math.abs(snowflake.position.x) > 300) {
            snowflake.position.x = -Math.sign(snowflake.position.x) * 100;
          }
          if (Math.abs(snowflake.position.z) > 300) {
            snowflake.position.z = -Math.sign(snowflake.position.z) * 100;
          }
        }
      });
    }
    
    // Animate main cloud with rainbow color cycling
    if (mainCloudRef.current && particleData.main.count > 0) {
      const mainPositions = mainCloudRef.current.geometry.attributes.position.array as Float32Array;
      const mainColors = mainCloudRef.current.geometry.attributes.color.array as Float32Array;
      
      for (let i = 0; i < particleData.main.count; i++) {
        const i3 = i * 3;
        
        mainPositions[i3] += particleData.main.velocities[i3] * animationSpeed;
        mainPositions[i3 + 1] += particleData.main.velocities[i3 + 1] * animationSpeed;
        mainPositions[i3 + 2] += particleData.main.velocities[i3 + 2] * animationSpeed;
        
        const x = mainPositions[i3];
        const z = mainPositions[i3 + 2];
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        
        const orbitalSpeed = distanceFromCenter > 0 ? 0.00008 / Math.sqrt(distanceFromCenter + 10) : 0;
        const angle = Math.atan2(z, x);
        const newAngle = angle + orbitalSpeed * animationSpeed;
        
        mainPositions[i3] += Math.cos(newAngle) * orbitalSpeed * 0.1 * animationSpeed;
        mainPositions[i3 + 2] += Math.sin(newAngle) * orbitalSpeed * 0.1 * animationSpeed;
        
        const parallaxFreq = time * 0.02 * animationSpeed + i * 0.001;
        mainPositions[i3] += Math.sin(parallaxFreq) * 0.002 * animationSpeed;
        mainPositions[i3 + 1] += Math.cos(parallaxFreq * 0.7) * 0.0008 * animationSpeed;
        mainPositions[i3 + 2] += Math.sin(parallaxFreq * 1.3) * 0.002 * animationSpeed;
        
        const bobFreq = time * 0.5 * animationSpeed + i * 0.1;
        mainPositions[i3 + 1] += Math.sin(bobFreq) * 0.003 * animationSpeed;
        
        if (isRainbowTheme) {
          const hue = ((time * 0.1 + i * 0.01) % 1);
          const color = new THREE.Color();
          color.setHSL(hue, 1, 0.6);
          mainColors[i3] = color.r;
          mainColors[i3 + 1] = color.g;
          mainColors[i3 + 2] = color.b;
        }
      }
      
      mainCloudRef.current.geometry.attributes.position.needsUpdate = true;
      if (isRainbowTheme) {
        mainCloudRef.current.geometry.attributes.color.needsUpdate = true;
      }
      mainCloudRef.current.rotation.y = time * 0.003 * animationSpeed;
    }
    
    // Animate snow particles
    if (snowParticlesRef.current && particleData.snow.count > 0) {
      const snowPositions = snowParticlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleData.snow.count; i++) {
        const i3 = i * 3;
        
        if (isChristmasTheme) {
          snowPositions[i3] += particleData.snow.velocities[i3] * animationSpeed;
          snowPositions[i3 + 1] += particleData.snow.velocities[i3 + 1] * animationSpeed;
          snowPositions[i3 + 2] += particleData.snow.velocities[i3 + 2] * animationSpeed;
          
          const swayFreq1 = time * 0.3 + i * 0.05;
          const swayFreq2 = time * 0.7 + i * 0.1;
          snowPositions[i3] += Math.sin(swayFreq1) * 0.003 * animationSpeed;
          snowPositions[i3] += Math.cos(swayFreq2) * 0.001 * animationSpeed;
          snowPositions[i3 + 2] += Math.cos(swayFreq1 * 0.8) * 0.003 * animationSpeed;
          snowPositions[i3 + 2] += Math.sin(swayFreq2 * 0.6) * 0.001 * animationSpeed;
          
          const turbulence = time * 0.5 + i * 0.02;
          snowPositions[i3] += Math.sin(turbulence * 3) * 0.0008 * animationSpeed;
          snowPositions[i3 + 2] += Math.cos(turbulence * 2.5) * 0.0008 * animationSpeed;
          
          if (snowPositions[i3 + 1] < -80) {
            snowPositions[i3 + 1] = 200 + Math.random() * 100;
            snowPositions[i3] = (Math.random() - 0.5) * 400;
            snowPositions[i3 + 2] = (Math.random() - 0.5) * 400;
            
            particleData.snow.velocities[i3] = (Math.random() - 0.5) * 0.004;
            particleData.snow.velocities[i3 + 1] = -Math.random() * 0.012 - 0.003;
            particleData.snow.velocities[i3 + 2] = (Math.random() - 0.5) * 0.004;
          }
          
          if (Math.abs(snowPositions[i3]) > 250) {
            snowPositions[i3] = -Math.sign(snowPositions[i3]) * 100;
          }
          if (Math.abs(snowPositions[i3 + 2]) > 250) {
            snowPositions[i3 + 2] = -Math.sign(snowPositions[i3 + 2]) * 100;
          }
        } else {
          snowPositions[i3] = 0;
          snowPositions[i3 + 1] = -1000;
          snowPositions[i3 + 2] = 0;
        }
      }
      
      snowParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Animate twinkle particles
    if (twinkleParticlesRef.current && particleData.twinkle.count > 0) {
      const twinklePositions = twinkleParticlesRef.current.geometry.attributes.position.array as Float32Array;
      const twinkleColors = twinkleParticlesRef.current.geometry.attributes.color.array as Float32Array;
      const twinkleSizes = twinkleParticlesRef.current.geometry.attributes.size.array as Float32Array;
      
      for (let i = 0; i < particleData.twinkle.count; i++) {
        const i3 = i * 3;
        
        if (isChristmasTheme) {
          twinklePositions[i3] += particleData.twinkle.velocities[i3] * animationSpeed;
          twinklePositions[i3 + 1] += particleData.twinkle.velocities[i3 + 1] * animationSpeed;
          twinklePositions[i3 + 2] += particleData.twinkle.velocities[i3 + 2] * animationSpeed;
          
          const twinklePhase = time * 2 + particleData.twinkle.phases[i];
          const twinkleIntensity = (Math.sin(twinklePhase) + 1) * 0.5;
          
          const rand = (Math.sin(time * 0.5 + i) + 1) * 0.5;
          let twinkleColor: THREE.Color;
          if (rand < 0.33) {
            twinkleColor = new THREE.Color('#dc2626');
          } else if (rand < 0.66) {
            twinkleColor = new THREE.Color('#16a34a');
          } else {
            twinkleColor = new THREE.Color('#ffffff');
          }
          
          twinkleColor.multiplyScalar(twinkleIntensity);
          twinkleColors[i3] = twinkleColor.r;
          twinkleColors[i3 + 1] = twinkleColor.g;
          twinkleColors[i3 + 2] = twinkleColor.b;
          
          const baseSizes = particleData.twinkle.sizes;
          twinkleSizes[i] = baseSizes[i] * (0.5 + twinkleIntensity * 0.8);
        } else {
          twinklePositions[i3] = 0;
          twinklePositions[i3 + 1] = -1000;
          twinklePositions[i3 + 2] = 0;
          
          twinkleColors[i3] = 0;
          twinkleColors[i3 + 1] = 0;
          twinkleColors[i3 + 2] = 0;
          
          twinkleSizes[i] = 0.1;
        }
      }
      
      twinkleParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      twinkleParticlesRef.current.geometry.attributes.color.needsUpdate = true;
      twinkleParticlesRef.current.geometry.attributes.size.needsUpdate = true;
    }
  });

  if (!enabled || intensity === 0) {
    return null;
  }

  const particleKey = `particles-${enabled ? 1 : 0}-${intensity.toFixed(1)}-${colorTheme.name}`;

  return (
    <group key={particleKey}>
      {/* Main Milky Way Cloud */}
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
              gl_PointSize = size * (${isRecording ? '350.0' : '300.0'} / -mvPosition.z);
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
              
              gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '0.9' : '0.8'});
            }
          `}
        />
      </points>
      
      {/* Geometric Snowflakes for Christmas Theme */}
      <group ref={geometricSnowflakesRef}>
        {isChristmasTheme && geometricSnowflakesData.map((snowflakeData, index) => (
          <mesh
            key={`snowflake-${index}`}
            position={snowflakeData.position}
            rotation={snowflakeData.rotation}
            scale={snowflakeData.scale}
          >
            <primitive object={snowflakeData.geometry} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
      
      {/* Snow and Twinkle Particles */}
      <points ref={snowParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.snow.positions}
            count={particleData.snow.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.snow.colors}
            count={particleData.snow.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.snow.sizes}
            count={particleData.snow.count}
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
              gl_PointSize = size * (${isRecording ? '250.0' : '220.0'} / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              
              float distance = length(mvPosition.xyz);
              vOpacity = 1.0 - smoothstep(50.0, 400.0, distance);
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vOpacity;
            void main() {
              if (length(vColor) < 0.1) discard;
              
              vec2 center = gl_PointCoord - vec2(0.5);
              float distanceToCenter = length(center);
              
              if (distanceToCenter > 0.5) discard;
              
              float angle = atan(center.y, center.x);
              float radius = length(center);
              
              float snowflake1 = abs(sin(angle * 6.0)) * 0.15 + 0.85;
              float snowflake2 = abs(cos(angle * 3.0)) * 0.1 + 0.9;
              float snowflake3 = smoothstep(0.1, 0.0, abs(sin(angle * 12.0))) * 0.2;
              
              float snowflakePattern = snowflake1 * snowflake2 + snowflake3;
              float sparkle = sin(radius * 20.0) * 0.1 + 0.9;
              
              float alpha = (1.0 - radius * 2.0) * snowflakePattern * sparkle;
              alpha = smoothstep(0.0, 1.0, alpha);
              
              gl_FragColor = vec4(vColor * 1.5, alpha * vOpacity * ${isRecording ? '1.2' : '1.0'});
            }
          `}
        />
      </points>
      
      <points ref={twinkleParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.twinkle.positions}
            count={particleData.twinkle.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.twinkle.colors}
            count={particleData.twinkle.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.twinkle.sizes}
            count={particleData.twinkle.count}
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
              gl_PointSize = size * (${isRecording ? '350.0' : '320.0'} / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              
              float distance = length(mvPosition.xyz);
              vOpacity = 1.0 - smoothstep(60.0, 400.0, distance);
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vOpacity;
            void main() {
              if (length(vColor) < 0.1) discard;
              
              vec2 center = gl_PointCoord - vec2(0.5);
              float distanceToCenter = length(center);
              
              if (distanceToCenter > 0.5) discard;
              
              float angle = atan(center.y, center.x);
              float star = abs(cos(angle * 4.0)) * 0.3 + 0.7;
              float cross = max(
                smoothstep(0.02, 0.0, abs(center.x)),
                smoothstep(0.02, 0.0, abs(center.y))
              ) * 0.5;
              
              float alpha = (1.0 - distanceToCenter * 2.0) * star + cross;
              alpha = smoothstep(0.0, 1.0, alpha);
              
              gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '1.4' : '1.2'});
            }
          `}
        />
      </points>
    </group>
  );
};

export default MilkyWayParticleSystem;