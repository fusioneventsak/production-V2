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
  const gasCloudsRef = useRef<THREE.Group>(null);
  // NEW: Christmas theme specific refs
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
  const GAS_CLOUD_COUNT = Math.floor(5 * intensity);
  const PARTICLES_PER_GAS_CLOUD = 60;
  // Use consistent counts for special particles to avoid buffer issues
  const SNOW_COUNT = Math.floor(2000 * intensity * recordingMultiplier);
  const TWINKLE_COUNT = Math.floor(500 * intensity * recordingMultiplier);
  // NEW: Geometric snowflakes - fewer but much more detailed
  const GEOMETRIC_SNOWFLAKES_COUNT = Math.floor(80 * intensity * recordingMultiplier);
  
  // Determine if we're using special themes
  const isRainbowTheme = colorTheme.name === 'Rainbow Spectrum';
  const isWhiteTheme = colorTheme.name === 'Pure White';
  const isChristmasTheme = colorTheme.name === 'Christmas Magic';

  // Helper function to create geometric snowflake geometry
  const createSnowflakeGeometry = (complexity: number = 1) => {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // Create a 6-pointed snowflake with intricate details
    const branches = 6;
    const size = 0.8 + Math.random() * 1.2; // Varied sizes
    
    // Center point
    vertices.push(0, 0, 0);
    
    // Create main branches
    for (let i = 0; i < branches; i++) {
      const angle = (i / branches) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      // Main branch points
      const branchLength = size;
      vertices.push(cos * branchLength, sin * branchLength, 0);
      
      // Create sub-branches at different points along main branch
      for (let j = 0.3; j <= 0.9; j += 0.3) {
        const subLength = branchLength * j;
        const subBranchSize = (1 - j) * 0.4 * size;
        
        // Left sub-branch
        const leftAngle = angle - Math.PI / 6;
        vertices.push(
          cos * subLength + Math.cos(leftAngle) * subBranchSize,
          sin * subLength + Math.sin(leftAngle) * subBranchSize,
          0
        );
        
        // Right sub-branch
        const rightAngle = angle + Math.PI / 6;
        vertices.push(
          cos * subLength + Math.cos(rightAngle) * subBranchSize,
          sin * subLength + Math.sin(rightAngle) * subBranchSize,
          0
        );
        
        // Connect sub-branches to main branch
        const mainIndex = 1 + i;
        const leftIndex = vertices.length / 3 - 2;
        const rightIndex = vertices.length / 3 - 1;
        
        indices.push(0, mainIndex, leftIndex);
        indices.push(0, mainIndex, rightIndex);
      }
      
      // Connect center to main branch
      indices.push(0, 1 + i, 1 + ((i + 1) % branches));
    }
    
    // Add crystalline details - inner hexagon
    const innerSize = size * 0.3;
    const innerStartIndex = vertices.length / 3;
    for (let i = 0; i < branches; i++) {
      const angle = (i / branches) * Math.PI * 2 + Math.PI / 6; // Offset for star pattern
      vertices.push(
        Math.cos(angle) * innerSize,
        Math.sin(angle) * innerSize,
        0
      );
      
      // Connect inner hexagon
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
    if (rand < 0.4) return new THREE.Color('#dc2626'); // Red
    if (rand < 0.8) return new THREE.Color('#16a34a'); // Green
    return new THREE.Color('#ffffff'); // White
  };

  // Create geometric snowflakes data (for Christmas Magic theme)
  const geometricSnowflakesData = useMemo(() => {
    const snowflakes = [];
    for (let i = 0; i < GEOMETRIC_SNOWFLAKES_COUNT; i++) {
      snowflakes.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 500, // Wider spread area
          Math.random() * 300 + 100,   // Start high in the sky
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
        gas: [],
        snow: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), count: 0 },
        twinkle: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), phases: new Float32Array(0), count: 0 }
      };
    }

    // Main galaxy cloud particles (spiral arms)
    const mainPositions = new Float32Array(MAIN_COUNT * 3);
    const mainColors = new Float32Array(MAIN_COUNT * 3);
    const mainSizes = new Float32Array(MAIN_COUNT);
    const mainVelocities = new Float32Array(MAIN_COUNT * 3);
    
    for (let i = 0; i < MAIN_COUNT; i++) {
      // Four spiral arms with some noise
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
      
      // Vary star sizes (mostly small, some medium, a few large)
      const sizeRandom = Math.random();
      if (sizeRandom < 0.7) {
        mainSizes[i] = 0.5 + Math.random() * 1.5;
      } else if (sizeRandom < 0.9) {
        mainSizes[i] = 2 + Math.random() * 2;
      } else {
        mainSizes[i] = 4 + Math.random() * 3;
      }
    }
    
    // Dust cloud particles (scattered smaller points around the galaxy)
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
    
    // Create star clusters (localized clusters of stars)
    const clusterData: {
      positions: Float32Array;
      colors: Float32Array;
      sizes: Float32Array;
      velocities: Float32Array;
      center: { x: number; y: number; z: number };
    }[] = [];
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
        // Random distribution within a sphere around cluster center
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
    
    // Atmospheric background particles (very scattered faint points for depth)
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
    
    // Distant swirl particles (large-scale spiral arms further out)
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
    
    // Big swirl formations (large star cluster swirls at the edges)
    const bigSwirlData: {
      positions: Float32Array;
      colors: Float32Array;
      sizes: Float32Array;
      velocities: Float32Array;
      center: { x: number; y: number; z: number };
    }[] = [];
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
    
    // NEW: Gas cloud clusters (distant colorful nebula-like clouds)
    const gasData: {
      positions: Float32Array;
      colors: Float32Array;
      sizes: Float32Array;
      velocities: Float32Array;
      center: { x: number; y: number; z: number };
    }[] = [];
    if (!isChristmasTheme && !isWhiteTheme) {
      for (let g = 0; g < GAS_CLOUD_COUNT; g++) {
        const clusterDistance = 200 + Math.random() * 100;
        const clusterAngle = Math.random() * Math.PI * 2;
        const clusterHeight = 30 + Math.random() * 60;
        const clusterCenter = {
          x: Math.cos(clusterAngle) * clusterDistance,
          y: clusterHeight,
          z: Math.sin(clusterAngle) * clusterDistance
        };
        const clusterPositions = new Float32Array(PARTICLES_PER_GAS_CLOUD * 3);
        const clusterColors = new Float32Array(PARTICLES_PER_GAS_CLOUD * 3);
        const clusterSizes = new Float32Array(PARTICLES_PER_GAS_CLOUD);
        const clusterVelocities = new Float32Array(PARTICLES_PER_GAS_CLOUD * 3);
        for (let i = 0; i < PARTICLES_PER_GAS_CLOUD; i++) {
          // Random spherical distribution for gas cloud shape
          const phi = Math.random() * Math.PI * 2;
          const cosTheta = Math.random() * 2 - 1;
          const u = Math.random();
          const r = Math.pow(u, 1/3) * (10 + Math.random() * 20);
          const theta = Math.acos(cosTheta);
          clusterPositions[i * 3] = clusterCenter.x + r * Math.sin(theta) * Math.cos(phi);
          clusterPositions[i * 3 + 1] = clusterCenter.y + r * Math.cos(theta);
          clusterPositions[i * 3 + 2] = clusterCenter.z + r * Math.sin(theta) * Math.sin(phi);
          clusterVelocities[i * 3] = (Math.random() - 0.5) * 0.0003;
          clusterVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0003;
          clusterVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0003;
          // Assign varied particle sizes (few very large, some big, some medium, many small)
          const sizeRand = Math.random();
          if (sizeRand < 0.1) {
            clusterSizes[i] = 12 + Math.random() * 8;
          } else if (sizeRand < 0.3) {
            clusterSizes[i] = 8 + Math.random() * 4;
          } else if (sizeRand < 0.6) {
            clusterSizes[i] = 4 + Math.random() * 4;
          } else {
            clusterSizes[i] = 1 + Math.random() * 3;
          }
        }
        gasData.push({
          positions: clusterPositions,
          colors: clusterColors,
          sizes: clusterSizes,
          velocities: clusterVelocities,
          center: clusterCenter
        });
      }
    }
    
    // NEW: Enhanced Snow particles (visible only in Christmas theme)
    const snowPositions = new Float32Array(SNOW_COUNT * 3);
    const snowColors = new Float32Array(SNOW_COUNT * 3);
    const snowSizes = new Float32Array(SNOW_COUNT);
    const snowVelocities = new Float32Array(SNOW_COUNT * 3);
    
    for (let i = 0; i < SNOW_COUNT; i++) {
      if (isChristmasTheme) {
        // Active snow particles for Christmas theme (falling snow)
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
        // Inactive snow for other themes (place off-screen)
        snowPositions[i * 3] = 0;
        snowPositions[i * 3 + 1] = -1000;
        snowPositions[i * 3 + 2] = 0;
        snowVelocities[i * 3] = 0;
        snowVelocities[i * 3 + 1] = 0;
        snowVelocities[i * 3 + 2] = 0;
        snowSizes[i] = 0.1;
      }
    }
    
    // NEW: Twinkle particles (sparkling points, visible only in Christmas theme)
    const twinklePositions = new Float32Array(TWINKLE_COUNT * 3);
    const twinkleColors = new Float32Array(TWINKLE_COUNT * 3);
    const twinkleSizes = new Float32Array(TWINKLE_COUNT);
    const twinkleVelocities = new Float32Array(TWINKLE_COUNT * 3);
    const twinklePhases = new Float32Array(TWINKLE_COUNT);
    
    for (let i = 0; i < TWINKLE_COUNT; i++) {
      if (isChristmasTheme) {
        // Active twinkle particles for Christmas theme (colored sparkles)
        twinklePositions[i * 3] = (Math.random() - 0.5) * 250;
        twinklePositions[i * 3 + 1] = Math.random() * 100 - 10;
        twinklePositions[i * 3 + 2] = (Math.random() - 0.5) * 250;
        
        twinkleVelocities[i * 3] = (Math.random() - 0.5) * 0.001;
        twinkleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
        twinkleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
        
        twinkleSizes[i] = 1 + Math.random() * 3;
        twinklePhases[i] = Math.random() * Math.PI * 2;
      } else {
        // Inactive twinkles for other themes (hidden)
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
      gas: gasData,
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
  }, [intensity, enabled, MAIN_COUNT, DUST_COUNT, CLUSTER_COUNT, ATMOSPHERIC_COUNT, DISTANT_SWIRL_COUNT, BIG_SWIRLS_COUNT, SNOW_COUNT, TWINKLE_COUNT, GAS_CLOUD_COUNT, isRecording]);

  // Update colors when theme changes (or on initial load) – enhanced for new themes
  React.useEffect(() => {
    if (!enabled || !mainCloudRef.current || !dustCloudRef.current || !clustersRef.current || 
        !atmosphericRef.current || !distantSwirlRef.current || !bigSwirlsRef.current) return;
    
    // Update main cloud star colors
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
    
    // Update dust cloud colors
    if (particleData.dust.count > 0) {
      const dustColors = dustCloudRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.dust.count; i++) {
        let particleColor: THREE.Color;
        if (isRainbowTheme) {
          particleColor = getRainbowColor(i, particleData.dust.count);
          particleColor.multiplyScalar(0.7);
        } else if (isWhiteTheme) {
          particleColor = new THREE.Color('#f8f8ff');
          const brightness = 0.5 + Math.random() * 0.3;
          particleColor.multiplyScalar(brightness);
        } else if (isChristmasTheme) {
          particleColor = getChristmasColor(i);
          particleColor.multiplyScalar(0.8);
        } else {
          const baseColor = new THREE.Color(colorTheme.secondary);
          const hsl = { h: 0, s: 0, l: 0 };
          baseColor.getHSL(hsl);
          particleColor = new THREE.Color();
          particleColor.setHSL(
            (hsl.h + (Math.random() - 0.5) * 0.15 + 1) % 1,
            Math.min(1, hsl.s * (0.5 + Math.random() * 0.5)),
            Math.min(1, hsl.l * (0.4 + Math.random() * 0.6))
          );
        }
        dustColors[i * 3] = particleColor.r;
        dustColors[i * 3 + 1] = particleColor.g;
        dustColors[i * 3 + 2] = particleColor.b;
      }
      dustCloudRef.current.geometry.attributes.color.needsUpdate = true;
    }
    
    // Update cluster colors
    clustersRef.current.children.forEach((cluster, clusterIndex) => {
      if (cluster instanceof THREE.Points && clusterIndex < particleData.clusters.length) {
        const clusterColors = cluster.geometry.attributes.color.array as Float32Array;
        for (let i = 0; i < PARTICLES_PER_CLUSTER; i++) {
          let particleColor: THREE.Color;
          if (isRainbowTheme) {
            particleColor = getRainbowColor(i + clusterIndex * PARTICLES_PER_CLUSTER, particleData.clusters.length * PARTICLES_PER_CLUSTER);
          } else if (isWhiteTheme) {
            particleColor = new THREE.Color('#ffffff');
            const brightness = 0.8 + Math.random() * 0.2;
            particleColor.multiplyScalar(brightness);
          } else if (isChristmasTheme) {
            particleColor = getChristmasColor(i + clusterIndex);
          } else {
            // Alternate base color between theme primary, secondary, accent for different clusters
            const clusterColorBase = [colorTheme.primary, colorTheme.secondary, colorTheme.accent][clusterIndex % 3];
            const baseColor = new THREE.Color(clusterColorBase);
            const hsl = { h: 0, s: 0, l: 0 };
            baseColor.getHSL(hsl);
            particleColor = new THREE.Color();
            particleColor.setHSL(
              (hsl.h + (Math.random() - 0.5) * 0.08 + 1) % 1,
              Math.min(1, hsl.s * (0.7 + Math.random() * 0.6)),
              Math.min(1, hsl.l * (0.5 + Math.random() * 0.5))
            );
          }
          clusterColors[i * 3] = particleColor.r;
          clusterColors[i * 3 + 1] = particleColor.g;
          clusterColors[i * 3 + 2] = particleColor.b;
        }
        cluster.geometry.attributes.color.needsUpdate = true;
      }
    });
    
    // Update atmospheric particle colors
    if (particleData.atmospheric.count > 0) {
      const atmosphericColors = atmosphericRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.atmospheric.count; i++) {
        let particleColor: THREE.Color;
        if (isRainbowTheme) {
          particleColor = getRainbowColor(i, particleData.atmospheric.count);
          particleColor.multiplyScalar(0.4);
        } else if (isWhiteTheme) {
          particleColor = new THREE.Color('#fffff0');
          const brightness = 0.3 + Math.random() * 0.4;
          particleColor.multiplyScalar(brightness);
        } else if (isChristmasTheme) {
          particleColor = getChristmasColor(i);
          particleColor.multiplyScalar(0.5);
        } else {
          const baseColor = new THREE.Color(colorTheme.accent);
          const hsl = { h: 0, s: 0, l: 0 };
          baseColor.getHSL(hsl);
          particleColor = new THREE.Color();
          particleColor.setHSL(
            (hsl.h + (Math.random() - 0.5) * 0.2 + 1) % 1,
            Math.min(1, hsl.s * (0.3 + Math.random() * 0.4)),
            Math.min(1, hsl.l * (0.2 + Math.random() * 0.5))
          );
        }
        atmosphericColors[i * 3] = particleColor.r;
        atmosphericColors[i * 3 + 1] = particleColor.g;
        atmosphericColors[i * 3 + 2] = particleColor.b;
      }
      atmosphericRef.current.geometry.attributes.color.needsUpdate = true;
    }
    
    // Update distant swirl colors
    if (particleData.distantSwirl.count > 0) {
      const distantColors = distantSwirlRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.distantSwirl.count; i++) {
        let particleColor: THREE.Color;
        if (isRainbowTheme) {
          particleColor = getRainbowColor(i, particleData.distantSwirl.count);
          particleColor.multiplyScalar(0.6);
        } else if (isWhiteTheme) {
          particleColor = new THREE.Color('#ffffff');
          const brightness = 0.4 + Math.random() * 0.4;
          particleColor.multiplyScalar(brightness);
        } else if (isChristmasTheme) {
          particleColor = getChristmasColor(i);
          particleColor.multiplyScalar(0.7);
        } else {
          const baseColor = new THREE.Color(colorTheme.primary);
          const hsl = { h: 0, s: 0, l: 0 };
          baseColor.getHSL(hsl);
          particleColor = new THREE.Color();
          particleColor.setHSL(
            (hsl.h + (Math.random() - 0.5) * 0.1 + 1) % 1,
            Math.min(1, hsl.s * (0.6 + Math.random() * 0.4)),
            Math.min(1, hsl.l * (0.4 + Math.random() * 0.4))
          );
        }
        distantColors[i * 3] = particleColor.r;
        distantColors[i * 3 + 1] = particleColor.g;
        distantColors[i * 3 + 2] = particleColor.b;
      }
      distantSwirlRef.current.geometry.attributes.color.needsUpdate = true;
    }
    
    // Update big swirl cluster colors
    bigSwirlsRef.current.children.forEach((swirl, swirlIndex) => {
      if (swirl instanceof THREE.Points && swirlIndex < particleData.bigSwirls.length) {
        const swirlColors = swirl.geometry.attributes.color.array as Float32Array;
        for (let i = 0; i < 800; i++) {
          let particleColor: THREE.Color;
          if (isRainbowTheme) {
            particleColor = getRainbowColor(i + swirlIndex * 800, particleData.bigSwirls.length * 800);
          } else if (isWhiteTheme) {
            particleColor = new THREE.Color('#ffffff');
            const brightness = 0.5 + Math.random() * 0.3;
            particleColor.multiplyScalar(brightness);
          } else if (isChristmasTheme) {
            particleColor = getChristmasColor(i + swirlIndex);
          } else {
            // Rotate base colors for big swirl clusters (use primary, secondary, accent in turn)
            const swirlColorBase = [colorTheme.primary, colorTheme.secondary, colorTheme.accent][swirlIndex % 3];
            const baseColor = new THREE.Color(swirlColorBase);
            const hsl = { h: 0, s: 0, l: 0 };
            baseColor.getHSL(hsl);
            particleColor = new THREE.Color();
            particleColor.setHSL(
              (hsl.h + (Math.random() - 0.5) * 0.15 + 1) % 1,
              Math.min(1, hsl.s * (0.5 + Math.random() * 0.5)),
              Math.min(1, hsl.l * (0.3 + Math.random() * 0.4))
            );
          }
          swirlColors[i * 3] = particleColor.r;
          swirlColors[i * 3 + 1] = particleColor.g;
          swirlColors[i * 3 + 2] = particleColor.b;
        }
        swirl.geometry.attributes.color.needsUpdate = true;
      }
    });
    
    // NEW: Update gas cloud colors
    if (gasCloudsRef.current) {
      gasCloudsRef.current.children.forEach((cluster, clusterIndex) => {
        if (cluster instanceof THREE.Points && clusterIndex < particleData.gas.length) {
          const clusterColors = cluster.geometry.attributes.color.array as Float32Array;
          for (let i = 0; i < PARTICLES_PER_GAS_CLOUD; i++) {
            let particleColor: THREE.Color;
            if (isRainbowTheme) {
              particleColor = getRainbowColor(i + clusterIndex * PARTICLES_PER_GAS_CLOUD, particleData.gas.length * PARTICLES_PER_GAS_CLOUD);
              // Dim slightly to blend with background
              particleColor = particleColor.clone();
              particleColor.multiplyScalar(0.8);
            } else if (isWhiteTheme) {
              particleColor = new THREE.Color('#ffffff');
              const brightness = 0.6 + Math.random() * 0.3;
              particleColor.multiplyScalar(brightness);
            } else if (isChristmasTheme) {
              particleColor = getChristmasColor(i + clusterIndex);
              particleColor.multiplyScalar(0.5);
            } else {
              // Determine base color for each gas cloud cluster
              let baseColor: THREE.Color;
              if (clusterIndex === 0 && particleData.gas.length === 1) {
                // If only one gas cluster, use complementary of primary theme color
                baseColor = new THREE.Color(colorTheme.primary);
                const hsl = { h: 0, s: 0, l: 0 };
                baseColor.getHSL(hsl);
                baseColor.setHSL((hsl.h + 0.5) % 1, Math.min(1, hsl.s * 0.7), Math.min(1, 0.7));
              } else {
                // Multiple clusters: alternate between theme palette and complements
                if (clusterIndex % 2 === 1) {
                  // Odd-index clusters: use complement of primary or secondary
                  const refColor = new THREE.Color(clusterIndex % 4 === 1 ? colorTheme.primary : colorTheme.secondary);
                  const hsl = { h: 0, s: 0, l: 0 };
                  refColor.getHSL(hsl);
                  baseColor = new THREE.Color();
                  baseColor.setHSL((hsl.h + 0.5) % 1, Math.min(1, hsl.s * 0.7), Math.min(1, 0.7));
                } else {
                  // Even-index clusters: use theme accent or secondary
                  const refHex = clusterIndex % 4 === 0 ? colorTheme.accent : colorTheme.secondary;
                  baseColor = new THREE.Color(refHex);
                }
              }
              // Apply slight random variation to base color
              const hslBase = { h: 0, s: 0, l: 0 };
              baseColor.getHSL(hslBase);
              particleColor = new THREE.Color();
              particleColor.setHSL(
                (hslBase.h + (Math.random() - 0.5) * 0.1 + 1) % 1,
                Math.min(1, hslBase.s * (0.4 + Math.random() * 0.4)),
                Math.min(1, hslBase.l * (0.6 + Math.random() * 0.3))
              );
            }
            clusterColors[i * 3] = particleColor.r;
            clusterColors[i * 3 + 1] = particleColor.g;
            clusterColors[i * 3 + 2] = particleColor.b;
          }
          cluster.geometry.attributes.color.needsUpdate = true;
        }
      });
    }
    
    // NEW: Update snow colors (white for Christmas, invisible for other themes)
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
    
    // NEW: Update twinkle colors (red/green/white for Christmas, none otherwise)
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

  // Animation loop – enhanced for new particle layers and optimized for recording
  useFrame((state) => {
    if (!enabled) return;
    const time = state.clock.getElapsedTime();
    const animationSpeed = isRecording ? 0.5 : 1.0;
    
    // Animate main galaxy cloud (rotate slowly and bob)
    if (mainCloudRef.current && particleData.main.count > 0) {
      const mainPositions = mainCloudRef.current.geometry.attributes.position.array as Float32Array;
      const mainColors = mainCloudRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.main.count; i++) {
        const i3 = i * 3;
        // Apply small velocity offsets
        mainPositions[i3] += particleData.main.velocities[i3] * animationSpeed;
        mainPositions[i3 + 1] += particleData.main.velocities[i3 + 1] * animationSpeed;
        mainPositions[i3 + 2] += particleData.main.velocities[i3 + 2] * animationSpeed;
        // Simulate orbital motion around center
        const x = mainPositions[i3];
        const z = mainPositions[i3 + 2];
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const orbitalSpeed = distanceFromCenter > 0 ? 0.00008 / Math.sqrt(distanceFromCenter + 10) : 0;
        const angle = Math.atan2(z, x);
        const newAngle = angle + orbitalSpeed * animationSpeed;
        mainPositions[i3] += Math.cos(newAngle) * orbitalSpeed * 0.1 * animationSpeed;
        mainPositions[i3 + 2] += Math.sin(newAngle) * orbitalSpeed * 0.1 * animationSpeed;
        // Parallax jitter for depth effect
        const parallaxFreq = time * 0.02 * animationSpeed + i * 0.001;
        mainPositions[i3] += Math.sin(parallaxFreq) * 0.002 * animationSpeed;
        mainPositions[i3 + 1] += Math.cos(parallaxFreq * 0.7) * 0.0008 * animationSpeed;
        mainPositions[i3 + 2] += Math.sin(parallaxFreq * 1.3) * 0.002 * animationSpeed;
        // Vertical bobbing
        const bobFreq = time * 0.5 * animationSpeed + i * 0.1;
        mainPositions[i3 + 1] += Math.sin(bobFreq) * 0.003 * animationSpeed;
        // Rainbow theme: cycle star colors over time
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
      // Slow rotation of whole main cloud
      mainCloudRef.current.rotation.y = time * 0.003 * animationSpeed;
    }
    
    // Animate dust cloud (float upwards and around)
    if (dustCloudRef.current && particleData.dust.count > 0) {
      const dustPositions = dustCloudRef.current.geometry.attributes.position.array as Float32Array;
      const dustColors = dustCloudRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.dust.count; i++) {
        const i3 = i * 3;
        dustPositions[i3] += particleData.dust.velocities[i3] * animationSpeed;
        dustPositions[i3 + 1] += particleData.dust.velocities[i3 + 1] * animationSpeed;
        dustPositions[i3 + 2] += particleData.dust.velocities[i3 + 2] * animationSpeed;
        // Turbulent swirling motion
        const turbulenceFreq = time * 0.1 * animationSpeed + i * 0.05;
        dustPositions[i3] += Math.sin(turbulenceFreq) * 0.003 * animationSpeed;
        dustPositions[i3 + 1] += Math.cos(turbulenceFreq * 1.3) * 0.002 * animationSpeed;
        dustPositions[i3 + 2] += Math.sin(turbulenceFreq * 0.8) * 0.003 * animationSpeed;
        // Gentle floating motion
        const dustFloatFreq = time * 0.3 * animationSpeed + i * 0.08;
        dustPositions[i3] += Math.cos(dustFloatFreq) * 0.001 * animationSpeed;
        dustPositions[i3 + 1] += Math.sin(dustFloatFreq * 0.6) * 0.002 * animationSpeed;
        // Rainbow theme: cycle dust colors
        if (isRainbowTheme) {
          const hue = ((time * 0.08 + i * 0.02) % 1);
          const color = new THREE.Color();
          color.setHSL(hue, 0.8, 0.4);
          dustColors[i3] = color.r;
          dustColors[i3 + 1] = color.g;
          dustColors[i3 + 2] = color.b;
        }
        // Wrap dust around vertical bounds
        if (dustPositions[i3 + 1] > 15) {
          dustPositions[i3 + 1] = -15;
          dustPositions[i3] = (Math.random() - 0.5) * 70;
          dustPositions[i3 + 2] = (Math.random() - 0.5) * 70;
        }
        // Confine dust within radius
        if (Math.abs(dustPositions[i3]) > 80) {
          dustPositions[i3] = -Math.sign(dustPositions[i3]) * 20;
        }
        if (Math.abs(dustPositions[i3 + 2]) > 80) {
          dustPositions[i3 + 2] = -Math.sign(dustPositions[i3 + 2]) * 20;
        }
      }
      dustCloudRef.current.geometry.attributes.position.needsUpdate = true;
      if (isRainbowTheme) {
        dustCloudRef.current.geometry.attributes.color.needsUpdate = true;
      }
      // Slight rotation of dust layer
      dustCloudRef.current.rotation.y = time * 0.005 * animationSpeed;
    }
    
    // Animate star clusters (internal subtle motion + slight rotation)
    if (clustersRef.current) {
      clustersRef.current.children.forEach((cluster, clusterIndex) => {
        if (cluster instanceof THREE.Points && clusterIndex < particleData.clusters.length) {
          const positions = cluster.geometry.attributes.position.array as Float32Array;
          const colors = cluster.geometry.attributes.color.array as Float32Array;
          const velocities = particleData.clusters[clusterIndex].velocities;
          const clusterCenter = particleData.clusters[clusterIndex].center;
          const expectedLength = PARTICLES_PER_CLUSTER * 3;
          if (positions.length === expectedLength && velocities.length === expectedLength) {
            for (let i = 0; i < PARTICLES_PER_CLUSTER; i++) {
              const i3 = i * 3;
              positions[i3] += velocities[i3] * animationSpeed;
              positions[i3 + 1] += velocities[i3 + 1] * animationSpeed;
              positions[i3 + 2] += velocities[i3 + 2] * animationSpeed;
              // Weak gravitational pull towards cluster center
              const dx = clusterCenter.x - positions[i3];
              const dy = clusterCenter.y - positions[i3 + 1];
              const dz = clusterCenter.z - positions[i3 + 2];
              const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (distance > 0) {
                const gravitationalForce = 0.00001;
                positions[i3] += (dx / distance) * gravitationalForce * animationSpeed;
                positions[i3 + 1] += (dy / distance) * gravitationalForce * animationSpeed;
                positions[i3 + 2] += (dz / distance) * gravitationalForce * animationSpeed;
              }
              // Local oscillation within cluster
              const clusterWave = time * 0.03 * animationSpeed + clusterIndex + i * 0.1;
              positions[i3] += Math.sin(clusterWave) * 0.001 * animationSpeed;
              positions[i3 + 1] += Math.cos(clusterWave * 0.8) * 0.0008 * animationSpeed;
              positions[i3 + 2] += Math.sin(clusterWave * 1.2) * 0.001 * animationSpeed;
              // Slow vertical float
              const clusterFloatFreq = time * 0.4 * animationSpeed + clusterIndex * 2 + i * 0.05;
              positions[i3 + 1] += Math.sin(clusterFloatFreq) * 0.002 * animationSpeed;
              // Rainbow theme: cycle cluster star colors
              if (isRainbowTheme) {
                const hue = ((time * 0.05 + clusterIndex * 0.3 + i * 0.01) % 1);
                const color = new THREE.Color();
                color.setHSL(hue, 0.9, 0.7);
                colors[i3] = color.r;
                colors[i3 + 1] = color.g;
                colors[i3 + 2] = color.b;
              }
            }
            cluster.geometry.attributes.position.needsUpdate = true;
            if (isRainbowTheme) {
              cluster.geometry.attributes.color.needsUpdate = true;
            }
            // Rotate clusters slowly around different axes for slight sparkle effect
            cluster.rotation.x = time * 0.001 * animationSpeed * (clusterIndex % 2 ? 1 : -1);
            cluster.rotation.z = time * 0.0015 * animationSpeed * (clusterIndex % 3 ? 1 : -1);
          }
        }
      });
    }
    
    // Animate atmospheric particles (drifting in background)
    if (atmosphericRef.current && particleData.atmospheric.count > 0) {
      const atmosphericPositions = atmosphericRef.current.geometry.attributes.position.array as Float32Array;
      const atmosphericColors = atmosphericRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.atmospheric.count; i++) {
        const i3 = i * 3;
        atmosphericPositions[i3] += particleData.atmospheric.velocities[i3] * animationSpeed;
        atmosphericPositions[i3 + 1] += particleData.atmospheric.velocities[i3 + 1] * animationSpeed;
        atmosphericPositions[i3 + 2] += particleData.atmospheric.velocities[i3 + 2] * animationSpeed;
        // Mild randomized drift
        const floatFreq = time * 0.05 * animationSpeed + i * 0.02;
        atmosphericPositions[i3] += Math.sin(floatFreq) * 0.002 * animationSpeed;
        atmosphericPositions[i3 + 1] += Math.cos(floatFreq * 0.7) * 0.003 * animationSpeed;
        atmosphericPositions[i3 + 2] += Math.sin(floatFreq * 1.1) * 0.002 * animationSpeed;
        // Slow vertical bob
        const atmosphericBobFreq = time * 0.8 * animationSpeed + i * 0.15;
        atmosphericPositions[i3 + 1] += Math.sin(atmosphericBobFreq) * 0.001 * animationSpeed;
        // Rainbow theme: color shift atmospheric specks
        if (isRainbowTheme) {
          const hue = ((time * 0.03 + i * 0.005) % 1);
          const color = new THREE.Color();
          color.setHSL(hue, 0.6, 0.3);
          atmosphericColors[i3] = color.r;
          atmosphericColors[i3 + 1] = color.g;
          atmosphericColors[i3 + 2] = color.b;
        }
        // Wrap around boundaries (keep particles in a large box region)
        if (Math.abs(atmosphericPositions[i3]) > 120) {
          atmosphericPositions[i3] = -Math.sign(atmosphericPositions[i3]) * 50;
        }
        if (atmosphericPositions[i3 + 1] > 90) {
          atmosphericPositions[i3 + 1] = 5;
        }
        if (atmosphericPositions[i3 + 1] < -5) {
          atmosphericPositions[i3 + 1] = 85;
        }
        if (Math.abs(atmosphericPositions[i3 + 2]) > 120) {
          atmosphericPositions[i3 + 2] = -Math.sign(atmosphericPositions[i3 + 2]) * 50;
        }
      }
      atmosphericRef.current.geometry.attributes.position.needsUpdate = true;
      if (isRainbowTheme) {
        atmosphericRef.current.geometry.attributes.color.needsUpdate = true;
      }
      // Subtle rotation of entire atmospheric layer
      atmosphericRef.current.rotation.y = time * 0.001 * animationSpeed;
    }
    
    // Animate distant swirl (galactic band far in background)
    if (distantSwirlRef.current && particleData.distantSwirl.count > 0) {
      const distantPositions = distantSwirlRef.current.geometry.attributes.position.array as Float32Array;
      const distantColors = distantSwirlRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.distantSwirl.count; i++) {
        const i3 = i * 3;
        distantPositions[i3] += particleData.distantSwirl.velocities[i3] * animationSpeed;
        distantPositions[i3 + 1] += particleData.distantSwirl.velocities[i3 + 1] * animationSpeed;
        distantPositions[i3 + 2] += particleData.distantSwirl.velocities[i3 + 2] * animationSpeed;
        // Orbital motion for swirl arms
        const x = distantPositions[i3];
        const z = distantPositions[i3 + 2];
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const orbitalSpeed = distanceFromCenter > 0 ? 0.00005 / Math.sqrt(distanceFromCenter + 20) : 0;
        const angle = Math.atan2(z, x);
        const newAngle = angle + orbitalSpeed * animationSpeed;
        distantPositions[i3] += Math.cos(newAngle) * orbitalSpeed * 0.05 * animationSpeed;
        distantPositions[i3 + 2] += Math.sin(newAngle) * orbitalSpeed * 0.05 * animationSpeed;
        // Vertical wave motion for distant swirl
        const waveFreq = time * 0.01 * animationSpeed + i * 0.001;
        distantPositions[i3 + 1] += Math.sin(waveFreq) * 0.005 * animationSpeed;
        // Slow drift to make swirl arms dynamic
        const distantDriftFreq = time * 0.02 * animationSpeed + i * 0.003;
        distantPositions[i3] += Math.cos(distantDriftFreq) * 0.001 * animationSpeed;
        distantPositions[i3 + 2] += Math.sin(distantDriftFreq * 1.3) * 0.001 * animationSpeed;
        // Rainbow theme: cycle distant swirl colors
        if (isRainbowTheme) {
          const hue = ((time * 0.04 + i * 0.008) % 1);
          const color = new THREE.Color();
          color.setHSL(hue, 0.8, 0.5);
          distantColors[i3] = color.r;
          distantColors[i3 + 1] = color.g;
          distantColors[i3 + 2] = color.b;
        }
      }
      distantSwirlRef.current.geometry.attributes.position.needsUpdate = true;
      if (isRainbowTheme) {
        distantSwirlRef.current.geometry.attributes.color.needsUpdate = true;
      }
      // Rotate entire distant swirl band slowly
      distantSwirlRef.current.rotation.y = time * 0.002 * animationSpeed;
    }
    
    // Animate big swirl clusters
    if (bigSwirlsRef.current) {
      bigSwirlsRef.current.children.forEach((swirl, swirlIndex) => {
        if (swirl instanceof THREE.Points && swirlIndex < particleData.bigSwirls.length) {
          const positions = swirl.geometry.attributes.position.array as Float32Array;
          const colors = swirl.geometry.attributes.color.array as Float32Array;
          const velocities = particleData.bigSwirls[swirlIndex].velocities;
          const swirlCenter = particleData.bigSwirls[swirlIndex].center;
          for (let i = 0; i < 800; i++) {
            const i3 = i * 3;
            positions[i3] += velocities[i3] * animationSpeed;
            positions[i3 + 1] += velocities[i3 + 1] * animationSpeed;
            positions[i3 + 2] += velocities[i3 + 2] * animationSpeed;
            // Orbit points around swirl center
            const dx = positions[i3] - swirlCenter.x;
            const dz = positions[i3 + 2] - swirlCenter.z;
            const radius = Math.sqrt(dx * dx + dz * dz);
            if (radius > 0.1) {
              const swirlSpeed = 0.0002 * animationSpeed;
              const currentAngle = Math.atan2(dz, dx);
              const newAngle = currentAngle + swirlSpeed;
              positions[i3] = swirlCenter.x + Math.cos(newAngle) * radius;
              positions[i3 + 2] = swirlCenter.z + Math.sin(newAngle) * radius;
            }
            // Small vertical oscillation within swirl
            const oscillation = time * 0.02 * animationSpeed + swirlIndex + i * 0.01;
            positions[i3 + 1] += Math.sin(oscillation) * 0.003 * animationSpeed;
            // Slight random float
            const bigSwirlFloatFreq = time * 0.06 * animationSpeed + swirlIndex * 3 + i * 0.02;
            positions[i3] += Math.cos(bigSwirlFloatFreq) * 0.0008 * animationSpeed;
            positions[i3 + 2] += Math.sin(bigSwirlFloatFreq * 0.9) * 0.0008 * animationSpeed;
            // Rainbow theme: cycle big swirl cluster star colors
            if (isRainbowTheme) {
              const hue = ((time * 0.06 + swirlIndex * 0.2 + i * 0.003) % 1);
              const color = new THREE.Color();
              color.setHSL(hue, 0.9, 0.6);
              colors[i3] = color.r;
              colors[i3 + 1] = color.g;
              colors[i3 + 2] = color.b;
            }
          }
          swirl.geometry.attributes.position.needsUpdate = true;
          if (isRainbowTheme) {
            swirl.geometry.attributes.color.needsUpdate = true;
          }
          // Slowly rotate each big swirl cluster in alternating directions
          swirl.rotation.y = time * 0.003 * animationSpeed * (swirlIndex % 2 ? 1 : -1);
        }
      });
    }
    
    // Animate gas cloud clusters (drifting nebula clouds)
    if (gasCloudsRef.current) {
      gasCloudsRef.current.children.forEach((cluster, clusterIndex) => {
        if (cluster instanceof THREE.Points && clusterIndex < particleData.gas.length) {
          const positions = cluster.geometry.attributes.position.array as Float32Array;
          const colors = cluster.geometry.attributes.color.array as Float32Array;
          const velocities = particleData.gas[clusterIndex].velocities;
          const clusterCenter = particleData.gas[clusterIndex].center;
          const expectedLength = PARTICLES_PER_GAS_CLOUD * 3;
          if (positions.length === expectedLength && velocities.length === expectedLength) {
            for (let i = 0; i < PARTICLES_PER_GAS_CLOUD; i++) {
              const i3 = i * 3;
              positions[i3] += velocities[i3] * animationSpeed;
              positions[i3 + 1] += velocities[i3 + 1] * animationSpeed;
              positions[i3 + 2] += velocities[i3 + 2] * animationSpeed;
              // Gentle gravitational pull to keep cloud cohesive
              const dx = clusterCenter.x - positions[i3];
              const dy = clusterCenter.y - positions[i3 + 1];
              const dz = clusterCenter.z - positions[i3 + 2];
              const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (distance > 0) {
                const gravitationalForce = 0.000005;
                positions[i3] += (dx / distance) * gravitationalForce * animationSpeed;
                positions[i3 + 1] += (dy / distance) * gravitationalForce * animationSpeed;
                positions[i3 + 2] += (dz / distance) * gravitationalForce * animationSpeed;
              }
              // Slow oscillation of points within the cloud
              const clusterWave = time * 0.02 * animationSpeed + clusterIndex + i * 0.1;
              positions[i3] += Math.sin(clusterWave) * 0.0005 * animationSpeed;
              positions[i3 + 1] += Math.cos(clusterWave * 0.8) * 0.0004 * animationSpeed;
              positions[i3 + 2] += Math.sin(clusterWave * 1.2) * 0.0005 * animationSpeed;
              // Subtle vertical float
              const clusterFloatFreq = time * 0.3 * animationSpeed + clusterIndex * 1.5 + i * 0.05;
              positions[i3 + 1] += Math.sin(clusterFloatFreq) * 0.001 * animationSpeed;
              // Rainbow theme: cycle gas cloud colors
              if (isRainbowTheme) {
                const hue = ((time * 0.04 + clusterIndex * 0.2 + i * 0.005) % 1);
                const color = new THREE.Color();
                color.setHSL(hue, 0.7, 0.5);
                colors[i3] = color.r;
                colors[i3 + 1] = color.g;
                colors[i3 + 2] = color.b;
              }
            }
            cluster.geometry.attributes.position.needsUpdate = true;
            if (isRainbowTheme) {
              cluster.geometry.attributes.color.needsUpdate = true;
            }
          }
        }
      });
    }
    
    // Enhanced Christmas snow animation (falling snowflakes)
    if (snowParticlesRef.current && particleData.snow.count > 0) {
      const snowPositions = snowParticlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleData.snow.count; i++) {
        const i3 = i * 3;
        if (isChristmasTheme) {
          // Move snow particles downward and sway
          snowPositions[i3] += particleData.snow.velocities[i3] * animationSpeed;
          snowPositions[i3 + 1] += particleData.snow.velocities[i3 + 1] * animationSpeed;
          snowPositions[i3 + 2] += particleData.snow.velocities[i3 + 2] * animationSpeed;
          // Sway left-right with multiple frequencies for natural drift
          const swayFreq1 = time * 0.3 + i * 0.05;
          const swayFreq2 = time * 0.7 + i * 0.1;
          snowPositions[i3] += Math.sin(swayFreq1) * 0.003 * animationSpeed;
          snowPositions[i3] += Math.cos(swayFreq2) * 0.001 * animationSpeed;
          snowPositions[i3 + 2] += Math.cos(swayFreq1 * 0.8) * 0.003 * animationSpeed;
          snowPositions[i3 + 2] += Math.sin(swayFreq2 * 0.6) * 0.001 * animationSpeed;
          // Small turbulent jitter
          const turbulence = time * 0.5 + i * 0.02;
          snowPositions[i3] += Math.sin(turbulence * 3) * 0.0008 * animationSpeed;
          snowPositions[i3 + 2] += Math.cos(turbulence * 2.5) * 0.0008 * animationSpeed;
          // Respawn snowflake at top when it falls out of view
          if (snowPositions[i3 + 1] < -80) {
            snowPositions[i3 + 1] = 200 + Math.random() * 100;
            snowPositions[i3] = (Math.random() - 0.5) * 400;
            snowPositions[i3 + 2] = (Math.random() - 0.5) * 400;
            // Reset velocity for new snowflake
            particleData.snow.velocities[i3] = (Math.random() - 0.5) * 0.004;
            particleData.snow.velocities[i3 + 1] = -Math.random() * 0.012 - 0.003;
            particleData.snow.velocities[i3 + 2] = (Math.random() - 0.5) * 0.004;
          }
          // Wrap horizontal boundaries to keep snow in area
          if (Math.abs(snowPositions[i3]) > 250) {
            snowPositions[i3] = -Math.sign(snowPositions[i3]) * 100;
          }
          if (Math.abs(snowPositions[i3 + 2]) > 250) {
            snowPositions[i3 + 2] = -Math.sign(snowPositions[i3 + 2]) * 100;
          }
        } else {
          // Keep particles hidden when not Christmas theme
          snowPositions[i3] = 0;
          snowPositions[i3 + 1] = -1000;
          snowPositions[i3 + 2] = 0;
        }
      }
      snowParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Enhanced Christmas twinkle animation (blinking colorful stars)
    if (twinkleParticlesRef.current && particleData.twinkle.count > 0) {
      const twinklePositions = twinkleParticlesRef.current.geometry.attributes.position.array as Float32Array;
      const twinkleColors = twinkleParticlesRef.current.geometry.attributes.color.array as Float32Array;
      const twinkleSizes = twinkleParticlesRef.current.geometry.attributes.size.array as Float32Array;
      for (let i = 0; i < particleData.twinkle.count; i++) {
        const i3 = i * 3;
        if (isChristmasTheme) {
          // Subtle movement for twinkle particles (mostly stationary)
          twinklePositions[i3] += particleData.twinkle.velocities[i3] * animationSpeed;
          twinklePositions[i3 + 1] += particleData.twinkle.velocities[i3 + 1] * animationSpeed;
          twinklePositions[i3 + 2] += particleData.twinkle.velocities[i3 + 2] * animationSpeed;
          // Twinkling brightness using phase
          const twinklePhase = time * 2 + particleData.twinkle.phases[i];
          const twinkleIntensity = (Math.sin(twinklePhase) + 1) * 0.5;
          // Cycle color between red, green, white
          const rand = (Math.sin(time * 0.5 + i) + 1) * 0.5;
          let twinkleColor: THREE.Color;
          if (rand < 0.33) {
            twinkleColor = new THREE.Color('#dc2626'); // Red
          } else if (rand < 0.66) {
            twinkleColor = new THREE.Color('#16a34a'); // Green
          } else {
            twinkleColor = new THREE.Color('#ffffff'); // White
          }
          twinkleColor.multiplyScalar(twinkleIntensity);
          twinkleColors[i3] = twinkleColor.r;
          twinkleColors[i3 + 1] = twinkleColor.g;
          twinkleColors[i3 + 2] = twinkleColor.b;
          // Vary point size with brightness
          const baseSize = particleData.twinkle.sizes[i];
          twinkleSizes[i] = baseSize * (0.5 + twinkleIntensity * 0.8);
        } else {
          // Hidden for other themes
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

  // Enhanced shader chunk for high-quality points (scaled differently when recording)
  const recordingVertexShader = `
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
  `;
  const recordingFragmentShader = `
    varying vec3 vColor;
    varying float vOpacity;
    void main() {
      float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
      if (distanceToCenter > 0.5) discard;
      float alpha = 1.0 - (distanceToCenter * 2.0);
      alpha = smoothstep(0.0, 1.0, alpha);
      gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '0.9' : '0.8'});
    }
  `;

  return (
    <group key={particleKey}>
      {/* Main Milky Way Cloud (core star field) */}
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
          vertexShader={recordingVertexShader}
          fragmentShader={recordingFragmentShader}
        />
      </points>
      
      {/* Cosmic dust cloud (smaller background stars) */}
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
              gl_PointSize = size * (${isRecording ? '220.0' : '200.0'} / -mvPosition.z);
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
              gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '0.7' : '0.6'});
            }
          `}
        />
      </points>
      
      {/* Star clusters (concentrated groups of stars) */}
      <group ref={clustersRef}>
        {particleData.clusters.map((cluster, index) => (
          <points key={`${particleKey}-cluster-${index}`}>
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
                  gl_PointSize = size * (${isRecording ? '270.0' : '250.0'} / -mvPosition.z);
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
                  gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '1.0' : '0.9'});
                }
              `}
            />
          </points>
        ))}
      </group>
      
      {/* Atmospheric particles (faint distant stars) */}
      <points ref={atmosphericRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.atmospheric.positions}
            count={particleData.atmospheric.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.atmospheric.colors}
            count={particleData.atmospheric.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.atmospheric.sizes}
            count={particleData.atmospheric.count}
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
              gl_PointSize = size * (${isRecording ? '170.0' : '150.0'} / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              float distance = length(mvPosition.xyz);
              vOpacity = 1.0 - smoothstep(100.0, 400.0, distance);
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
              gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '0.4' : '0.3'});
            }
          `}
        />
      </points>
      
      {/* Distant swirl particles (Milky Way band far away) */}
      <points ref={distantSwirlRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.distantSwirl.positions}
            count={particleData.distantSwirl.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.distantSwirl.colors}
            count={particleData.distantSwirl.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.distantSwirl.sizes}
            count={particleData.distantSwirl.count}
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
              gl_PointSize = size * (${isRecording ? '420.0' : '400.0'} / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              float distance = length(mvPosition.xyz);
              vOpacity = 1.0 - smoothstep(200.0, 600.0, distance);
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
              gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '0.6' : '0.5'});
            }
          `}
        />
      </points>
      
      {/* Big swirls (large star cluster swirls at periphery) */}
      <group ref={bigSwirlsRef}>
        {particleData.bigSwirls.map((swirl, index) => (
          <points key={`${particleKey}-bigswirl-${index}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={swirl.positions}
                count={800}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-color"
                array={swirl.colors}
                count={800}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-size"
                array={swirl.sizes}
                count={800}
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
                  gl_PointSize = size * (${isRecording ? '520.0' : '500.0'} / -mvPosition.z);
                  gl_Position = projectionMatrix * mvPosition;
                  float distance = length(mvPosition.xyz);
                  vOpacity = 1.0 - smoothstep(150.0, 500.0, distance);
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
                  gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '0.5' : '0.4'});
                }
              `}
            />
          </points>
        ))}
      </group>
      
      {/* Gas cloud clusters (distant colorful nebula clouds) */}
      <group ref={gasCloudsRef}>
        {particleData.gas.map((cluster, index) => (
          <points key={`${particleKey}-gas-${index}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={cluster.positions}
                count={PARTICLES_PER_GAS_CLOUD}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-color"
                array={cluster.colors}
                count={PARTICLES_PER_GAS_CLOUD}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-size"
                array={cluster.sizes}
                count={PARTICLES_PER_GAS_CLOUD}
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
                  gl_PointSize = size * (${isRecording ? '550.0' : '520.0'} / -mvPosition.z);
                  gl_Position = projectionMatrix * mvPosition;
                  
                  float distance = length(mvPosition.xyz);
                  vOpacity = 1.0 - smoothstep(100.0, 500.0, distance);
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
                  gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '0.5' : '0.4'});
                }
              `}
            />
          </points>
        ))}
      </group>
      
      {/* Snow and Twinkle Particles (conditionally visible in Christmas Magic theme) */}
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
            varying vec2 vUv;
            void main() {
              vColor = color;
              vUv = uv;
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
              // Skip rendering if color is black (hidden particles)
              if (length(vColor) < 0.1) discard;
              vec2 center = gl_PointCoord - vec2(0.5);
              float distanceToCenter = length(center);
              if (distanceToCenter > 0.5) discard;
              // Snowflake pattern (6-point star + sparkle)
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
              // Skip rendering if color is black (hidden particles)
              if (length(vColor) < 0.1) discard;
              vec2 center = gl_PointCoord - vec2(0.5);
              float distanceToCenter = length(center);
              if (distanceToCenter > 0.5) discard;
              // Twinkle pattern (star + cross)
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
