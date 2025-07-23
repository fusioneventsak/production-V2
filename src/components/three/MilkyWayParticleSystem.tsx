import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Enhanced particle color themes
export const PARTICLE_THEMES = [
  { name: 'Purple Magic', primary: '#8b5cf6', secondary: '#a855f7', accent: '#c084fc' },
  { name: 'Ocean Breeze', primary: '#06b6d4', secondary: '#0891b2', accent: '#67e8f9' },
  { name: 'Sunset Glow', primary: '#f59e0b', secondary: '#d97706', accent: '#fbbf24' },
  { name: 'Forest Dream', primary: '#10b981', secondary: '#059669', accent: '#34d399' },
  { name: 'Rose Petals', primary: '#ec4899', secondary: '#db2777', accent: '#f9a8d4' },
  { name: 'Electric Blue', primary: '#3b82f6', secondary: '#2563eb', accent: '#93c5fd' },
  { name: 'Cosmic Red', primary: '#ef4444', secondary: '#dc2626', accent: '#fca5a5' },
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
  const nebulaCloudsRef = useRef<THREE.Points>(null);
  const cosmicRaysRef = useRef<THREE.Points>(null);

  // Adjusted particle counts for better performance and visual impact
  const recordingMultiplier = isRecording ? 1.2 : 1.0;
  const MAIN_COUNT = Math.floor(3000 * intensity * recordingMultiplier);
  const DUST_COUNT = Math.floor(2000 * intensity * recordingMultiplier);
  const CLUSTER_COUNT = Math.floor(6 * intensity);
  const PARTICLES_PER_CLUSTER = 250;
  const ATMOSPHERIC_COUNT = Math.floor(2500 * intensity * recordingMultiplier);
  const DISTANT_SWIRL_COUNT = Math.floor(1200 * intensity * recordingMultiplier);
  const BIG_SWIRLS_COUNT = Math.floor(3 * intensity);
  const SNOW_COUNT = Math.floor(1500 * intensity * recordingMultiplier);
  const TWINKLE_COUNT = Math.floor(400 * intensity * recordingMultiplier);
  const GEOMETRIC_SNOWFLAKES_COUNT = Math.floor(100 * intensity * recordingMultiplier);
  const NEBULA_COUNT = Math.floor(800 * intensity * recordingMultiplier);
  const COSMIC_RAYS_COUNT = Math.floor(150 * intensity * recordingMultiplier);

  const isRainbowTheme = colorTheme.name === 'Rainbow Spectrum';
  const isWhiteTheme = colorTheme.name === 'Pure White';
  const isChristmasTheme = colorTheme.name === 'Christmas Magic';

  // Enhanced snowflake geometry with intricate details
  const createSnowflakeGeometry = (complexity: number = 1) => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    const branches = 6;
    const size = 1.5 + Math.random() * 2.0;

    // Center point
    vertices.push(0, 0, 0);

    // Create main branches with intricate details
    for (let i = 0; i < branches; i++) {
      const angle = (i / branches) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Main branch points
      const branchLength = size;
      vertices.push(cos * branchLength, sin * branchLength, 0);

      // Sub-branches with additional details
      for (let j = 0.2; j <= 0.9; j += 0.2) {
        const subLength = branchLength * j;
        const subBranchSize = (1 - j) * 0.5 * size;

        // Left sub-branch
        const leftAngle = angle - Math.PI / 4;
        vertices.push(
          cos * subLength + Math.cos(leftAngle) * subBranchSize,
          sin * subLength + Math.sin(leftAngle) * subBranchSize,
          0
        );

        // Right sub-branch
        const rightAngle = angle + Math.PI / 4;
        vertices.push(
          cos * subLength + Math.cos(rightAngle) * subBranchSize,
          sin * subLength + Math.sin(rightAngle) * subBranchSize,
          0
        );

        // Additional small branches for complexity
        const microBranchSize = subBranchSize * 0.5;
        const microLeftAngle = angle - Math.PI / 3;
        const microRightAngle = angle + Math.PI / 3;
        vertices.push(
          cos * subLength + Math.cos(microLeftAngle) * microBranchSize,
          sin * subLength + Math.sin(microLeftAngle) * microBranchSize,
          0
        );
        vertices.push(
          cos * subLength + Math.cos(microRightAngle) * microBranchSize,
          sin * subLength + Math.sin(microRightAngle) * microBranchSize,
          0
        );

        // Connect sub-branches
        const mainIndex = 1 + i;
        const leftIndex = vertices.length / 3 - 4;
        const rightIndex = vertices.length / 3 - 3;
        const microLeftIndex = vertices.length / 3 - 2;
        const microRightIndex = vertices.length / 3 - 1;

        indices.push(0, mainIndex, leftIndex);
        indices.push(0, mainIndex, rightIndex);
        indices.push(leftIndex, mainIndex, microLeftIndex);
        indices.push(rightIndex, mainIndex, microRightIndex);
      }

      // Connect center to main branch
      indices.push(0, 1 + i, 1 + ((i + 1) % branches));
    }

    // Inner star pattern
    const innerSize = size * 0.4;
    const innerStartIndex = vertices.length / 3;
    for (let i = 0; i < branches; i++) {
      const angle = (i / branches) * Math.PI * 2 + Math.PI / 12;
      vertices.push(
        Math.cos(angle) * innerSize,
        Math.sin(angle) * innerSize,
        0
      );
      indices.push(innerStartIndex + i, innerStartIndex + ((i + 1) % branches), 0);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  };

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

  // Enhanced snowflake data with dynamic lighting properties
  const geometricSnowflakesData = useMemo(() => {
    const snowflakes = [];

    for (let i = 0; i < GEOMETRIC_SNOWFLAKES_COUNT; i++) {
      snowflakes.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 600,
          Math.random() * 400 + 150,
          (Math.random() - 0.5) * 600
        ] as [number, number, number],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: 1.0 + Math.random() * 2.0,
        fallSpeed: 0.01 + Math.random() * 0.015,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        swaySpeed: Math.random() * 0.6 + 0.4,
        swayAmount: Math.random() * 0.003 + 0.002,
        geometry: createSnowflakeGeometry(1 + Math.random() * 0.5),
        emissiveIntensity: 0.5 + Math.random() * 0.5
      });
    }

    return snowflakes;
  }, [GEOMETRIC_SNOWFLAKES_COUNT, isChristmasTheme]);

  // Particle data generation
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
        twinkle: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), phases: new Float32Array(0), count: 0 },
        nebula: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), count: 0 },
        cosmicRays: { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0), velocities: new Float32Array(0), count: 0 }
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
      mainSizes[i] = sizeRandom < 0.7 ? 0.5 + Math.random() * 1.5 : sizeRandom < 0.9 ? 2 + Math.random() * 2 : 4 + Math.random() * 3;
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

    // Star clusters
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
        const clusterRadius = Math.pow(u, 1 / 3) * (3 + Math.random() * 4);

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
      atmosphericSizes[i] = sizeRandom < 0.6 ? 0.2 + Math.random() * 0.8 : sizeRandom < 0.85 ? 1 + Math.random() * 1.5 : 2.5 + Math.random() * 2;
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
        snowSizes[i] = sizeRand < 0.4 ? 0.3 + Math.random() * 0.7 : sizeRand < 0.8 ? 1.0 + Math.random() * 1.5 : 2.0 + Math.random() * 2.0;
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

    // Nebula particles
    const nebulaPositions = new Float32Array(NEBULA_COUNT * 3);
    const nebulaColors = new Float32Array(NEBULA_COUNT * 3);
    const nebulaSizes = new Float32Array(NEBULA_COUNT);
    const nebulaVelocities = new Float32Array(NEBULA_COUNT * 3);

    for (let i = 0; i < NEBULA_COUNT; i++) {
      const nebulaRadius = Math.pow(Math.random(), 0.3) * 200 + 50;
      const nebulaAngle = Math.random() * Math.PI * 2;
      const nebulaHeight = (Math.random() - 0.5) * 150;

      nebulaPositions[i * 3] = Math.cos(nebulaAngle) * nebulaRadius + (Math.random() - 0.5) * 60;
      nebulaPositions[i * 3 + 1] = nebulaHeight;
      nebulaPositions[i * 3 + 2] = Math.sin(nebulaAngle) * nebulaRadius + (Math.random() - 0.5) * 60;

      nebulaVelocities[i * 3] = (Math.random() - 0.5) * 0.0003;
      nebulaVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.0002;
      nebulaVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.0003;

      nebulaSizes[i] = 8 + Math.random() * 25;
    }

    // Cosmic rays
    const cosmicRaysPositions = new Float32Array(COSMIC_RAYS_COUNT * 3);
    const cosmicRaysColors = new Float32Array(COSMIC_RAYS_COUNT * 3);
    const cosmicRaysSizes = new Float32Array(COSMIC_RAYS_COUNT);
    const cosmicRaysVelocities = new Float32Array(COSMIC_RAYS_COUNT * 3);

    for (let i = 0; i < COSMIC_RAYS_COUNT; i++) {
      cosmicRaysPositions[i * 3] = (Math.random() - 0.5) * 800;
      cosmicRaysPositions[i * 3 + 1] = (Math.random() - 0.5) * 800;
      cosmicRaysPositions[i * 3 + 2] = (Math.random() - 0.5) * 800;

      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      
      const speed = 0.05 + Math.random() * 0.1;
      cosmicRaysVelocities[i * 3] = direction.x * speed;
      cosmicRaysVelocities[i * 3 + 1] = direction.y * speed;
      cosmicRaysVelocities[i * 3 + 2] = direction.z * speed;

      cosmicRaysSizes[i] = 0.5 + Math.random() * 2;
    }

    return {
      main: { positions: mainPositions, colors: mainColors, sizes: mainSizes, velocities: mainVelocities, count: MAIN_COUNT },
      dust: { positions: dustPositions, colors: dustColors, sizes: dustSizes, velocities: dustVelocities, count: DUST_COUNT },
      clusters: clusterData,
      atmospheric: { positions: atmosphericPositions, colors: atmosphericColors, sizes: atmosphericSizes, velocities: atmosphericVelocities, count: ATMOSPHERIC_COUNT },
      distantSwirl: { positions: distantSwirlPositions, colors: distantSwirlColors, sizes: distantSwirlSizes, velocities: distantSwirlVelocities, count: DISTANT_SWIRL_COUNT },
      bigSwirls: bigSwirlData,
      snow: { positions: snowPositions, colors: snowColors, sizes: snowSizes, velocities: snowVelocities, count: SNOW_COUNT },
      twinkle: { positions: twinklePositions, colors: twinkleColors, sizes: twinkleSizes, velocities: twinkleVelocities, phases: twinklePhases, count: TWINKLE_COUNT },
      nebula: { positions: nebulaPositions, colors: nebulaColors, sizes: nebulaSizes, velocities: nebulaVelocities, count: NEBULA_COUNT },
      cosmicRays: { positions: cosmicRaysPositions, colors: cosmicRaysColors, sizes: cosmicRaysSizes, velocities: cosmicRaysVelocities, count: COSMIC_RAYS_COUNT }
    };
  }, [intensity, enabled, MAIN_COUNT, DUST_COUNT, CLUSTER_COUNT, ATMOSPHERIC_COUNT, DISTANT_SWIRL_COUNT, BIG_SWIRLS_COUNT, SNOW_COUNT, TWINKLE_COUNT, NEBULA_COUNT, COSMIC_RAYS_COUNT, isRecording]);

  // Update colors - COMPLETE COLOR SYSTEM
  React.useEffect(() => {
    if (!enabled || !mainCloudRef.current || !dustCloudRef.current || !clustersRef.current ||
        !atmosphericRef.current || !distantSwirlRef.current || !bigSwirlsRef.current) return;

    // Main cloud colors
    if (particleData.main.count > 0) {
      const mainColors = mainCloudRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.main.count; i++) {
        let particleColor: THREE.Color;

        if (isRainbowTheme) {
          particleColor = getRainbowColor(i, particleData.main.count);
        } else if (isWhiteTheme) {
          particleColor = new THREE.Color('#ffffff').multiplyScalar(0.7 + Math.random() * 0.3);
        } else if (isChristmasTheme) {
          particleColor = getChristmasColor(i);
        } else {
          const baseColor = new THREE.Color(colorTheme.primary);
          const hsl = { h: 0, s: 0, l: 0 };
          baseColor.getHSL(hsl);

          particleColor = new THREE.Color();
          particleColor.setHSL(
            (hsl.h + (Math.random() - 0.5) * 0.1 + 1) % 1,
            Math.min(1, hsl.s * (0.8 + Math.random() * 0.4)),
            Math.min(1, hsl.l * (0.3 + Math.random() * 0.7))
          );
        }

        mainColors[i * 3] = particleColor.r;
        mainColors[i * 3 + 1] = particleColor.g;
        mainColors[i * 3 + 2] = particleColor.b;
      }
      mainCloudRef.current.geometry.attributes.color.needsUpdate = true;
    }

    // Dust cloud colors
    if (particleData.dust.count > 0) {
      const dustColors = dustCloudRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.dust.count; i++) {
        let particleColor: THREE.Color;

        if (isRainbowTheme) {
          particleColor = getRainbowColor(i, particleData.dust.count).multiplyScalar(0.7);
        } else if (isWhiteTheme) {
          particleColor = new THREE.Color('#f8f8ff').multiplyScalar(0.5 + Math.random() * 0.3);
        } else if (isChristmasTheme) {
          particleColor = getChristmasColor(i).multiplyScalar(0.8);
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

    // Cluster colors
    clustersRef.current.children.forEach((cluster, clusterIndex) => {
      if (cluster instanceof THREE.Points && clusterIndex < particleData.clusters.length) {
        const clusterColors = cluster.geometry.attributes.color.array as Float32Array;

        for (let i = 0; i < PARTICLES_PER_CLUSTER; i++) {
          let particleColor: THREE.Color;

          if (isRainbowTheme) {
            particleColor = getRainbowColor(i + clusterIndex * PARTICLES_PER_CLUSTER, particleData.clusters.length * PARTICLES_PER_CLUSTER);
          } else if (isWhiteTheme) {
            particleColor = new THREE.Color('#ffffff').multiplyScalar(0.8 + Math.random() * 0.2);
          } else if (isChristmasTheme) {
            particleColor = getChristmasColor(i + clusterIndex);
          } else {
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

    // Atmospheric colors
    if (particleData.atmospheric.count > 0) {
      const atmosphericColors = atmosphericRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.atmospheric.count; i++) {
        let particleColor: THREE.Color;

        if (isRainbowTheme) {
          particleColor = getRainbowColor(i, particleData.atmospheric.count).multiplyScalar(0.4);
        } else if (isWhiteTheme) {
          particleColor = new THREE.Color('#fffff0').multiplyScalar(0.3 + Math.random() * 0.4);
        } else if (isChristmasTheme) {
          particleColor = getChristmasColor(i).multiplyScalar(0.5);
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

    // Distant swirl colors
    if (particleData.distantSwirl.count > 0) {
      const distantColors = distantSwirlRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.distantSwirl.count; i++) {
        let particleColor: THREE.Color;

        if (isRainbowTheme) {
          particleColor = getRainbowColor(i, particleData.distantSwirl.count).multiplyScalar(0.6);
        } else if (isWhiteTheme) {
          particleColor = new THREE.Color('#ffffff').multiplyScalar(0.4 + Math.random() * 0.4);
        } else if (isChristmasTheme) {
          particleColor = getChristmasColor(i).multiplyScalar(0.7);
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

    // Big swirl colors
    bigSwirlsRef.current.children.forEach((swirl, swirlIndex) => {
      if (swirl instanceof THREE.Points && swirlIndex < particleData.bigSwirls.length) {
        const swirlColors = swirl.geometry.attributes.color.array as Float32Array;

        for (let i = 0; i < 800; i++) {
          let particleColor: THREE.Color;

          if (isRainbowTheme) {
            particleColor = getRainbowColor(i + swirlIndex * 800, particleData.bigSwirls.length * 800);
          } else if (isWhiteTheme) {
            particleColor = new THREE.Color('#ffffff').multiplyScalar(0.5 + Math.random() * 0.3);
          } else if (isChristmasTheme) {
            particleColor = getChristmasColor(i + swirlIndex);
          } else {
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

    // Snow colors
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

    // Twinkle colors
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

    // Nebula colors
    if (particleData.nebula.count > 0 && nebulaCloudsRef.current) {
      const nebulaColors = nebulaCloudsRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.nebula.count; i++) {
        let particleColor: THREE.Color;

        if (isRainbowTheme) {
          particleColor = getRainbowColor(i, particleData.nebula.count).multiplyScalar(0.3);
        } else if (isWhiteTheme) {
          particleColor = new THREE.Color('#f0f8ff').multiplyScalar(0.2 + Math.random() * 0.3);
        } else if (isChristmasTheme) {
          particleColor = getChristmasColor(i).multiplyScalar(0.4);
        } else {
          const baseColor = new THREE.Color(colorTheme.accent);
          const hsl = { h: 0, s: 0, l: 0 };
          baseColor.getHSL(hsl);

          particleColor = new THREE.Color();
          particleColor.setHSL(
            (hsl.h + (Math.random() - 0.5) * 0.3 + 1) % 1,
            Math.min(1, hsl.s * (0.4 + Math.random() * 0.6)),
            Math.min(1, hsl.l * (0.1 + Math.random() * 0.4))
          );
        }

        nebulaColors[i * 3] = particleColor.r;
        nebulaColors[i * 3 + 1] = particleColor.g;
        nebulaColors[i * 3 + 2] = particleColor.b;
      }
      nebulaCloudsRef.current.geometry.attributes.color.needsUpdate = true;
    }

    // Cosmic ray colors
    if (particleData.cosmicRays.count > 0 && cosmicRaysRef.current) {
      const cosmicColors = cosmicRaysRef.current.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < particleData.cosmicRays.count; i++) {
        let particleColor: THREE.Color;

        if (isRainbowTheme) {
          particleColor = getRainbowColor(i, particleData.cosmicRays.count);
        } else if (isWhiteTheme) {
          particleColor = new THREE.Color('#ffffff').multiplyScalar(0.9 + Math.random() * 0.1);
        } else if (isChristmasTheme) {
          particleColor = getChristmasColor(i);
        } else {
          const baseColor = new THREE.Color(colorTheme.primary);
          const hsl = { h: 0, s: 0, l: 0 };
          baseColor.getHSL(hsl);

          particleColor = new THREE.Color();
          particleColor.setHSL(
            (hsl.h + (Math.random() - 0.5) * 0.05 + 1) % 1,
            Math.min(1, hsl.s * (0.9 + Math.random() * 0.1)),
            Math.min(1, hsl.l * (0.8 + Math.random() * 0.2))
          );
        }

        cosmicColors[i * 3] = particleColor.r;
        cosmicColors[i * 3 + 1] = particleColor.g;
        cosmicColors[i * 3 + 2] = particleColor.b;
      }
      cosmicRaysRef.current.geometry.attributes.color.needsUpdate = true;
    }
  }, [colorTheme, particleData, enabled, isRainbowTheme, isWhiteTheme, isChristmasTheme]);

  // Animation system with enhanced snowflake dynamics
  useFrame((state) => {
    if (!enabled) return;

    const time = state.clock.getElapsedTime();
    const animationSpeed = isRecording ? 0.5 : 1.0;

    // Main cloud animation with enhanced galactic rotation
    if (mainCloudRef.current && particleData.main.count > 0) {
      const mainPositions = mainCloudRef.current.geometry.attributes.position.array as Float32Array;
      const mainColors = mainCloudRef.current.geometry.attributes.color.array as Float32Array;

      for (let i = 0; i < particleData.main.count; i++) {
        const i3 = i * 3;

        // Apply velocities
        mainPositions[i3] += particleData.main.velocities[i3] * animationSpeed;
        mainPositions[i3 + 1] += particleData.main.velocities[i3 + 1] * animationSpeed;
        mainPositions[i3 + 2] += particleData.main.velocities[i3 + 2] * animationSpeed;

        // Galactic rotation
        const x = mainPositions[i3];
        const z = mainPositions[i3 + 2];
        const distanceFromCenter = Math.sqrt(x * x + z * z);

        if (distanceFromCenter > 0) {
          const orbitalSpeed = 0.00008 / Math.sqrt(distanceFromCenter + 10);
          const angle = Math.atan2(z, x);
          const newAngle = angle + orbitalSpeed * animationSpeed;

          mainPositions[i3] += Math.cos(newAngle) * orbitalSpeed * 0.1 * animationSpeed;
          mainPositions[i3 + 2] += Math.sin(newAngle) * orbitalSpeed * 0.1 * animationSpeed;
        }

        // Parallax and bobbing motion
        const parallaxFreq = time * 0.02 * animationSpeed + i * 0.001;
        mainPositions[i3] += Math.sin(parallaxFreq) * 0.002 * animationSpeed;
        mainPositions[i3 + 1] += Math.cos(parallaxFreq * 0.7) * 0.0008 * animationSpeed;
        mainPositions[i3 + 2] += Math.sin(parallaxFreq * 1.3) * 0.002 * animationSpeed;

        const bobFreq = time * 0.5 * animationSpeed + i * 0.1;
        mainPositions[i3 + 1] += Math.sin(bobFreq) * 0.003 * animationSpeed;

        // Rainbow color animation
        if (isRainbowTheme) {
          const hue = ((time * 0.1 + i * 0.01) % 1);
          const color = new THREE.Color().setHSL(hue, 1, 0.6);
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

    // Dust cloud animation
    if (dustCloudRef.current && particleData.dust.count > 0) {
      const dustPositions = dustCloudRef.current.geometry.attributes.position.array as Float32Array;
      const dustColors = dustCloudRef.current.geometry.attributes.color.array as Float32Array;

      for (let i = 0; i < particleData.dust.count; i++) {
        const i3 = i * 3;

        dustPositions[i3] += particleData.dust.velocities[i3] * animationSpeed;
        dustPositions[i3 + 1] += particleData.dust.velocities[i3 + 1] * animationSpeed;
        dustPositions[i3 + 2] += particleData.dust.velocities[i3 + 2] * animationSpeed;

        const turbulenceFreq = time * 0.1 * animationSpeed + i * 0.05;
        dustPositions[i3] += Math.sin(turbulenceFreq) * 0.003 * animationSpeed;
        dustPositions[i3 + 1] += Math.cos(turbulenceFreq * 1.3) * 0.002 * animationSpeed;
        dustPositions[i3 + 2] += Math.sin(turbulenceFreq * 0.8) * 0.003 * animationSpeed;

        const dustFloatFreq = time * 0.3 * animationSpeed + i * 0.08;
        dustPositions[i3] += Math.cos(dustFloatFreq) * 0.001 * animationSpeed;
        dustPositions[i3 + 1] += Math.sin(dustFloatFreq * 0.6) * 0.002 * animationSpeed;

        if (isRainbowTheme) {
          const hue = ((time * 0.08 + i * 0.02) % 1);
          const color = new THREE.Color().setHSL(hue, 0.8, 0.4);
          dustColors[i3] = color.r;
          dustColors[i3 + 1] = color.g;
          dustColors[i3 + 2] = color.b;
        }

        if (dustPositions[i3 + 1] > 15) {
          dustPositions[i3 + 1] = -15;
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
      if (isRainbowTheme) {
        dustCloudRef.current.geometry.attributes.color.needsUpdate = true;
      }
      dustCloudRef.current.rotation.y = time * 0.005 * animationSpeed;
    }

    // Snow animation
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

    // Twinkle animation
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

    // Enhanced cosmic ray animation
    if (cosmicRaysRef.current && particleData.cosmicRays.count > 0) {
      const cosmicPositions = cosmicRaysRef.current.geometry.attributes.position.array as Float32Array;
      const cosmicColors = cosmicRaysRef.current.geometry.attributes.color.array as Float32Array;

      for (let i = 0; i < particleData.cosmicRays.count; i++) {
        const i3 = i * 3;

        // Move cosmic rays in straight lines
        cosmicPositions[i3] += particleData.cosmicRays.velocities[i3] * animationSpeed;
        cosmicPositions[i3 + 1] += particleData.cosmicRays.velocities[i3 + 1] * animationSpeed;
        cosmicPositions[i3 + 2] += particleData.cosmicRays.velocities[i3 + 2] * animationSpeed;

        // Reset position if too far
        const distance = Math.sqrt(
          cosmicPositions[i3] ** 2 + 
          cosmicPositions[i3 + 1] ** 2 + 
          cosmicPositions[i3 + 2] ** 2
        );

        if (distance > 600) {
          cosmicPositions[i3] = (Math.random() - 0.5) * 800;
          cosmicPositions[i3 + 1] = (Math.random() - 0.5) * 800;
          cosmicPositions[i3 + 2] = (Math.random() - 0.5) * 800;

          const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          ).normalize();
          
          const speed = 0.05 + Math.random() * 0.1;
          particleData.cosmicRays.velocities[i3] = direction.x * speed;
          particleData.cosmicRays.velocities[i3 + 1] = direction.y * speed;
          particleData.cosmicRays.velocities[i3 + 2] = direction.z * speed;
        }

        // Cosmic ray color animation
        if (isRainbowTheme) {
          const hue = ((time * 0.2 + i * 0.05) % 1);
          const color = new THREE.Color().setHSL(hue, 1, 0.8);
          cosmicColors[i3] = color.r;
          cosmicColors[i3 + 1] = color.g;
          cosmicColors[i3 + 2] = color.b;
        }
      }

      cosmicRaysRef.current.geometry.attributes.position.needsUpdate = true;
      if (isRainbowTheme) {
        cosmicRaysRef.current.geometry.attributes.color.needsUpdate = true;
      }
    }

    // Nebula animation
    if (nebulaCloudsRef.current && particleData.nebula.count > 0) {
      const nebulaPositions = nebulaCloudsRef.current.geometry.attributes.position.array as Float32Array;
      const nebulaColors = nebulaCloudsRef.current.geometry.attributes.color.array as Float32Array;

      for (let i = 0; i < particleData.nebula.count; i++) {
        const i3 = i * 3;

        // Slow drift motion
        nebulaPositions[i3] += particleData.nebula.velocities[i3] * animationSpeed;
        nebulaPositions[i3 + 1] += particleData.nebula.velocities[i3 + 1] * animationSpeed;
        nebulaPositions[i3 + 2] += particleData.nebula.velocities[i3 + 2] * animationSpeed;

        // Gentle swirling motion
        const swirlFreq = time * 0.008 * animationSpeed + i * 0.001;
        nebulaPositions[i3] += Math.sin(swirlFreq) * 0.001 * animationSpeed;
        nebulaPositions[i3 + 1] += Math.cos(swirlFreq * 0.7) * 0.0008 * animationSpeed;
        nebulaPositions[i3 + 2] += Math.sin(swirlFreq * 1.1) * 0.001 * animationSpeed;

        // Pulsating effect
        const pulseFreq = time * 0.1 + i * 0.05;
        const pulseFactor = 0.8 + Math.sin(pulseFreq) * 0.2;

        if (isRainbowTheme) {
          const hue = ((time * 0.02 + i * 0.003) % 1);
          const color = new THREE.Color().setHSL(hue, 0.6, 0.2 * pulseFactor);
          nebulaColors[i3] = color.r;
          nebulaColors[i3 + 1] = color.g;
          nebulaColors[i3 + 2] = color.b;
        }
      }

      nebulaCloudsRef.current.geometry.attributes.position.needsUpdate = true;
      if (isRainbowTheme) {
        nebulaCloudsRef.current.geometry.attributes.color.needsUpdate = true;
      }
      nebulaCloudsRef.current.rotation.y = time * 0.0008 * animationSpeed;
    }

    // Geometric snowflakes animation
    if (geometricSnowflakesRef.current && isChristmasTheme) {
      geometricSnowflakesRef.current.children.forEach((snowflake, index) => {
        if (index < geometricSnowflakesData.length) {
          const data = geometricSnowflakesData[index];
          snowflake.position.set(...data.position);
          snowflake.rotation.set(
            data.rotation[0] + time * data.rotationSpeed * animationSpeed,
            data.rotation[1] + time * data.rotationSpeed * animationSpeed,
            data.rotation[2] + time * data.rotationSpeed * animationSpeed
          );

          // Falling motion
          data.position[1] -= data.fallSpeed * animationSpeed;
          
          // Swaying motion
          const sway = time * data.swaySpeed;
          data.position[0] += Math.sin(sway) * data.swayAmount * animationSpeed;
          data.position[2] += Math.cos(sway * 0.7) * data.swayAmount * animationSpeed;

          // Turbulence
          const turbulence = time * 0.4 + index * 0.03;
          data.position[0] += Math.sin(turbulence * 2.5) * 0.001 * animationSpeed;
          data.position[2] += Math.cos(turbulence * 2) * 0.001 * animationSpeed;

          // Reset if fallen too far
          if (data.position[1] < -100) {
            data.position[1] = 300 + Math.random() * 100;
            data.position[0] = (Math.random() - 0.5) * 600;
            data.position[2] = (Math.random() - 0.5) * 600;
          }

          // Boundary check
          if (Math.abs(data.position[0]) > 300) {
            data.position[0] = -Math.sign(data.position[0]) * 150;
          }
          if (Math.abs(data.position[2]) > 300) {
            data.position[2] = -Math.sign(data.position[2]) * 150;
          }

          // Dynamic emissive intensity
          const emissivePulse = (Math.sin(time * 2 + index * 0.5) + 1) * 0.5;
          const material = snowflake.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = data.emissiveIntensity * (0.8 + emissivePulse * 0.4);
        }
      });
    }
  });

  if (!enabled || intensity === 0) {
    return null;
  }

  const particleKey = `particles-${enabled ? 1 : 0}-${intensity.toFixed(1)}-${colorTheme.name}`;

  // Enhanced shader for main particles
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

  const nebulaVertexShader = `
    attribute float size;
    varying vec3 vColor;
    varying float vOpacity;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (100.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      float distance = length(mvPosition.xyz);
      vOpacity = 1.0 - smoothstep(200.0, 800.0, distance);
    }
  `;

  const nebulaFragmentShader = `
    varying vec3 vColor;
    varying float vOpacity;
    void main() {
      float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
      if (distanceToCenter > 0.5) discard;
      float alpha = 1.0 - (distanceToCenter * 2.0);
      alpha = smoothstep(0.0, 1.0, alpha);
      alpha *= 0.3; // Make nebula more translucent
      gl_FragColor = vec4(vColor, alpha * vOpacity);
    }
  `;

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
          vertexShader={recordingVertexShader}
          fragmentShader={recordingFragmentShader}
        />
      </points>

      {/* Cosmic dust cloud */}
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

      {/* Star clusters */}
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

      {/* Atmospheric particles */}
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
              gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '0.5' : '0.4'});
            }
          `}
        />
      </points>

      {/* Distant swirl particles */}
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
          vertexShader={recordingVertexShader}
          fragmentShader={recordingFragmentShader}
        />
      </points>

      {/* Big swirl formations */}
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
              vertexShader={recordingVertexShader}
              fragmentShader={recordingFragmentShader}
            />
          </points>
        ))}
      </group>

      {/* Snow particles */}
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
              gl_PointSize = size * (180.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              float distance = length(mvPosition.xyz);
              vOpacity = 1.0 - smoothstep(100.0, 300.0, distance);
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

      {/* Twinkle particles */}
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
              vec4 vPosition = vec4(position, 1.0);
              vec4 mvPosition = modelViewMatrix * vPosition;
              gl_PointSize = size * (200.0 / -mvPosition.z);
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
              
              // Create star shape effect
              float angle = atan(gl_PointCoord.y - 0.5, gl_PointCoord.x - 0.5);
              float starPattern = sin(angle * 4.0) * 0.3 + 0.7;
              alpha *= starPattern;
              
              gl_FragColor = vec4(vColor, alpha * vOpacity * 1.2);
            }
          `}
        />
      </points>

      {/* Nebula Clouds */}
      <points ref={nebulaCloudsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.nebula.positions}
            count={particleData.nebula.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.nebula.colors}
            count={particleData.nebula.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.nebula.sizes}
            count={particleData.nebula.count}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          transparent
          vertexColors
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexShader={nebulaVertexShader}
          fragmentShader={nebulaFragmentShader}
        />
      </points>

      {/* Cosmic Rays */}
      <points ref={cosmicRaysRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.cosmicRays.positions}
            count={particleData.cosmicRays.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.cosmicRays.colors}
            count={particleData.cosmicRays.count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.cosmicRays.sizes}
            count={particleData.cosmicRays.count}
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
              gl_PointSize = size * (400.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              float distance = length(mvPosition.xyz);
              vOpacity = 1.0 - smoothstep(100.0, 800.0, distance);
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
              gl_FragColor = vec4(vColor, alpha * vOpacity * 1.2);
            }
          `}
        />
      </points>

      {/* Geometric Snowflakes for Christmas Theme */}
      {isChristmasTheme && (
        <group ref={geometricSnowflakesRef}>
          {geometricSnowflakesData.map((data, index) => (
            <mesh
              key={`snowflake-${index}`}
              geometry={data.geometry}
              scale={[data.scale, data.scale, data.scale]}
            >
              <meshStandardMaterial
                color={getChristmasColor(index)}
                emissive={getChristmasColor(index)}
                emissiveIntensity={data.emissiveIntensity}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

export default MilkyWayParticleSystem;