```typescript
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ... (PARTICLE_THEMES and other imports remain unchanged)

// Define maximum particle counts to prevent buffer resizing
const MAX_MAIN_COUNT = 5000;
const MAX_DUST_COUNT = 3000;
const MAX_CLUSTER_COUNT = 10;
const MAX_PARTICLES_PER_CLUSTER = 250;
const MAX_ATMOSPHERIC_COUNT = 4000;
const MAX_DISTANT_SWIRL_COUNT = 2000;
const MAX_BIG_SWIRLS_COUNT = 5;
const MAX_PARTICLES_PER_SWIRL = 800;
const MAX_SNOW_COUNT = 2000;
const MAX_TWINKLE_COUNT = 600;
const MAX_GEOMETRIC_SNOWFLAKES_COUNT = 150;

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

  const recordingMultiplier = isRecording ? 1.2 : 1.0;
  const MAIN_COUNT = Math.min(Math.floor(3000 * intensity * recordingMultiplier), MAX_MAIN_COUNT);
  const DUST_COUNT = Math.min(Math.floor(2000 * intensity * recordingMultiplier), MAX_DUST_COUNT);
  const CLUSTER_COUNT = Math.min(Math.floor(6 * intensity), MAX_CLUSTER_COUNT);
  const ATMOSPHERIC_COUNT = Math.min(Math.floor(2500 * intensity * recordingMultiplier), MAX_ATMOSPHERIC_COUNT);
  const DISTANT_SWIRL_COUNT = Math.min(Math.floor(1200 * intensity * recordingMultiplier), MAX_DISTANT_SWIRL_COUNT);
  const BIG_SWIRLS_COUNT = Math.min(Math.floor(3 * intensity), MAX_BIG_SWIRLS_COUNT);
  const SNOW_COUNT = Math.min(Math.floor(1500 * intensity * recordingMultiplier), MAX_SNOW_COUNT);
  const TWINKLE_COUNT = Math.min(Math.floor(400 * intensity * recordingMultiplier), MAX_TWINKLE_COUNT);
  const GEOMETRIC_SNOWFLAKES_COUNT = Math.min(Math.floor(100 * intensity * recordingMultiplier), MAX_GEOMETRIC_SNOWFLAKES_COUNT);

  const isRainbowTheme = colorTheme.name === 'Rainbow Spectrum';
  const isWhiteTheme = colorTheme.name === 'Pure White';
  const isChristmasTheme = colorTheme.name === 'Christmas Magic';

  // Particle data with fixed-size buffers
  const particleData = useMemo(() => {
    if (!enabled || intensity === 0) {
      return {
        main: { positions: new Float32Array(MAX_MAIN_COUNT * 3), colors: new Float32Array(MAX_MAIN_COUNT * 3), sizes: new Float32Array(MAX_MAIN_COUNT), velocities: new Float32Array(MAX_MAIN_COUNT * 3), count: 0 },
        dust: { positions: new Float32Array(MAX_DUST_COUNT * 3), colors: new Float32Array(MAX_DUST_COUNT * 3), sizes: new Float32Array(MAX_DUST_COUNT), velocities: new Float32Array(MAX_DUST_COUNT * 3), count: 0 },
        clusters: [],
        atmospheric: { positions: new Float32Array(MAX_ATMOSPHERIC_COUNT * 3), colors: new Float32Array(MAX_ATMOSPHERIC_COUNT * 3), sizes: new Float32Array(MAX_ATMOSPHERIC_COUNT), velocities: new Float32Array(MAX_ATMOSPHERIC_COUNT * 3), count: 0 },
        distantSwirl: { positions: new Float32Array(MAX_DISTANT_SWIRL_COUNT * 3), colors: new Float32Array(MAX_DISTANT_SWIRL_COUNT * 3), sizes: new Float32Array(MAX_DISTANT_SWIRL_COUNT), velocities: new Float32Array(MAX_DISTANT_SWIRL_COUNT * 3), count: 0 },
        bigSwirls: [],
        snow: { positions: new Float32Array(MAX_SNOW_COUNT * 3), colors: new Float32Array(MAX_SNOW_COUNT * 3), sizes: new Float32Array(MAX_SNOW_COUNT), velocities: new Float32Array(MAX_SNOW_COUNT * 3), count: 0 },
        twinkle: { positions: new Float32Array(MAX_TWINKLE_COUNT * 3), colors: new Float32Array(MAX_TWINKLE_COUNT * 3), sizes: new Float32Array(MAX_TWINKLE_COUNT), velocities: new Float32Array(MAX_TWINKLE_COUNT * 3), phases: new Float32Array(MAX_TWINKLE_COUNT), count: 0 }
      };
    }

    // Main cloud particles
    const mainPositions = new Float32Array(MAX_MAIN_COUNT * 3);
    const mainColors = new Float32Array(MAX_MAIN_COUNT * 3);
    const mainSizes = new Float32Array(MAX_MAIN_COUNT);
    const mainVelocities = new Float32Array(MAX_MAIN_COUNT * 3);

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
    const dustPositions = new Float32Array(MAX_DUST_COUNT * 3);
    const dustColors = new Float32Array(MAX_DUST_COUNT * 3);
    const dustSizes = new Float32Array(MAX_DUST_COUNT);
    const dustVelocities = new Float32Array(MAX_DUST_COUNT * 3);

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

      const clusterPositions = new Float32Array(MAX_PARTICLES_PER_CLUSTER * 3);
      const clusterColors = new Float32Array(MAX_PARTICLES_PER_CLUSTER * 3);
      const clusterSizes = new Float32Array(MAX_PARTICLES_PER_CLUSTER);
      const clusterVelocities = new Float32Array(MAX_PARTICLES_PER_CLUSTER * 3);

      for (let i = 0; i < MAX_PARTICLES_PER_CLUSTER; i++) {
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
        center: clusterCenter,
        count: MAX_PARTICLES_PER_CLUSTER
      });
    }

    // Atmospheric particles
    const atmosphericPositions = new Float32Array(MAX_ATMOSPHERIC_COUNT * 3);
    const atmosphericColors = new Float32Array(MAX_ATMOSPHERIC_COUNT * 3);
    const atmosphericSizes = new Float32Array(MAX_ATMOSPHERIC_COUNT);
    const atmosphericVelocities = new Float32Array(MAX_ATMOSPHERIC_COUNT * 3);

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
    const distantSwirlPositions = new Float32Array(MAX_DISTANT_SWIRL_COUNT * 3);
    const distantSwirlColors = new Float32Array(MAX_DISTANT_SWIRL_COUNT * 3);
    const distantSwirlSizes = new Float32Array(MAX_DISTANT_SWIRL_COUNT);
    const distantSwirlVelocities = new Float32Array(MAX_DISTANT_SWIRL_COUNT * 3);

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

      const swirlCenter = {
        x: Math.cos(swirlAngle) * swirlDistance,
        y: swirlHeight,
        z: Math.sin(swirlAngle) * swirlDistance
      };

      const swirlPositions = new Float32Array(MAX_PARTICLES_PER_SWIRL * 3);
      const swirlColors = new Float32Array(MAX_PARTICLES_PER_SWIRL * 3);
      const swirlSizes = new Float32Array(MAX_PARTICLES_PER_SWIRL);
      const swirlVelocities = new Float32Array(MAX_PARTICLES_PER_SWIRL * 3);

      for (let i = 0; i < MAX_PARTICLES_PER_SWIRL; i++) {
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
        center: swirlCenter,
        count: MAX_PARTICLES_PER_SWIRL
      });
    }

    // Snow particles
    const snowPositions = new Float32Array(MAX_SNOW_COUNT * 3);
    const snowColors = new Float32Array(MAX_SNOW_COUNT * 3);
    const snowSizes = new Float32Array(MAX_SNOW_COUNT);
    const snowVelocities = new Float32Array(MAX_SNOW_COUNT * 3);

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
    const twinklePositions = new Float32Array(MAX_TWINKLE_COUNT * 3);
    const twinkleColors = new Float32Array(MAX_TWINKLE_COUNT * 3);
    const twinkleSizes = new Float32Array(MAX_TWINKLE_COUNT);
    const twinkleVelocities = new Float32Array(MAX_TWINKLE_COUNT * 3);
    const twinklePhases = new Float32Array(MAX_TWINKLE_COUNT);

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
      main: { positions: mainPositions, colors: mainColors, sizes: mainSizes, velocities: mainVelocities, count: MAIN_COUNT },
      dust: { positions: dustPositions, colors: dustColors, sizes: dustSizes, velocities: dustVelocities, count: DUST_COUNT },
      clusters: clusterData,
      atmospheric: { positions: atmosphericPositions, colors: atmosphericColors, sizes: atmosphericSizes, velocities: atmosphericVelocities, count: ATMOSPHERIC_COUNT },
      distantSwirl: { positions: distantSwirlPositions, colors: distantSwirlColors, sizes: distantSwirlSizes, velocities: distantSwirlVelocities, count: DISTANT_SWIRL_COUNT },
      bigSwirls: bigSwirlData,
      snow: { positions: snowPositions, colors: snowColors, sizes: snowSizes, velocities: snowVelocities, count: SNOW_COUNT },
      twinkle: { positions: twinklePositions, colors: twinkleColors, sizes: twinkleSizes, velocities: twinkleVelocities, phases: twinklePhases, count: TWINKLE_COUNT }
    };
  }, [enabled, intensity, isRecording, isChristmasTheme]);

  // Update buffer geometries with dynamic counts
  const updateGeometries = () => {
    if (mainCloudRef.current && particleData.main.count > 0) {
      const geometry = mainCloudRef.current.geometry as THREE.BufferGeometry;
      geometry.setAttribute('position', new THREE.BufferAttribute(particleData.main.positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(particleData.main.colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(particleData.main.sizes, 1));
      geometry.setDrawRange(0, particleData.main.count);
    }

    if (dustCloudRef.current && particleData.dust.count > 0) {
      const geometry = dustCloudRef.current.geometry as THREE.BufferGeometry;
      geometry.setAttribute('position', new THREE.BufferAttribute(particleData.dust.positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(particleData.dust.colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(particleData.dust.sizes, 1));
      geometry.setDrawRange(0, particleData.dust.count);
    }

    if (clustersRef.current) {
      clustersRef.current.children.forEach((cluster, index) => {
        if (cluster instanceof THREE.Points && index < particleData.clusters.length) {
          const geometry = cluster.geometry as THREE.BufferGeometry;
          const clusterData = particleData.clusters[index];
          geometry.setAttribute('position', new THREE.BufferAttribute(clusterData.positions, 3));
          geometry.setAttribute('color', new THREE.BufferAttribute(clusterData.colors, 3));
          geometry.setAttribute('size', new THREE.BufferAttribute(clusterData.sizes, 1));
          geometry.setDrawRange(0, clusterData.count);
        }
      });
    }

    if (atmosphericRef.current && particleData.atmospheric.count > 0) {
      const geometry = atmosphericRef.current.geometry as THREE.BufferGeometry;
      geometry.setAttribute('position', new THREE.BufferAttribute(particleData.atmospheric.positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(particleData.atmospheric.colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(particleData.atmospheric.sizes, 1));
      geometry.setDrawRange(0, particleData.atmospheric.count);
    }

    if (distantSwirlRef.current && particleData.distantSwirl.count > 0) {
      const geometry = distantSwirlRef.current.geometry as THREE.BufferGeometry;
      geometry.setAttribute('position', new THREE.BufferAttribute(particleData.distantSwirl.positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(particleData.distantSwirl.colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(particleData.distantSwirl.sizes, 1));
      geometry.setDrawRange(0, particleData.distantSwirl.count);
    }

    if (bigSwirlsRef.current) {
      bigSwirlsRef.current.children.forEach((swirl, index) => {
        if (swirl instanceof THREE.Points && index < particleData.bigSwirls.length) {
          const geometry = swirl.geometry as THREE.BufferGeometry;
          const swirlData = particleData.bigSwirls[index];
          geometry.setAttribute('position', new THREE.BufferAttribute(swirlData.positions, 3));
          geometry.setAttribute('color', new THREE.BufferAttribute(swirlData.colors, 3));
          geometry.setAttribute('size', new THREE.BufferAttribute(swirlData.sizes, 1));
          geometry.setDrawRange(0, swirlData.count);
        }
      });
    }

    if (snowParticlesRef.current && particleData.snow.count > 0) {
      const geometry = snowParticlesRef.current.geometry as THREE.BufferGeometry;
      geometry.setAttribute('position', new THREE.BufferAttribute(particleData.snow.positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(particleData.snow.colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(particleData.snow.sizes, 1));
      geometry.setDrawRange(0, particleData.snow.count);
    }

    if (twinkleParticlesRef.current && particleData.twinkle.count > 0) {
      const geometry = twinkleParticlesRef.current.geometry as THREE.BufferGeometry;
      geometry.setAttribute('position', new THREE.BufferAttribute(particleData.twinkle.positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(particleData.twinkle.colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(particleData.twinkle.sizes, 1));
      geometry.setDrawRange(0, particleData.twinkle.count);
    }
  };

  // Update geometries when particleData changes
  React.useEffect(() => {
    updateGeometries();
  }, [particleData]);

  // ... (Rest of the component remains unchanged, including useFrame, color updates, and render logic)

  // Render logic (same as previous artifacts, with updated geometry references)
  if (!enabled || intensity === 0) {
    return null;
  }

  const particleKey = `particles-${enabled ? 1 : 0}-${intensity.toFixed(1)}-${colorTheme.name}`;

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
      {/* Main Milky Way Cloud */}
      <points ref={mainCloudRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.main.positions}
            count={MAX_MAIN_COUNT}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.main.colors}
            count={MAX_MAIN_COUNT}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.main.sizes}
            count={MAX_MAIN_COUNT}
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
            count={MAX_DUST_COUNT}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.dust.colors}
            count={MAX_DUST_COUNT}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.dust.sizes}
            count={MAX_DUST_COUNT}
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
                count={MAX_PARTICLES_PER_CLUSTER}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-color"
                array={cluster.colors}
                count={MAX_PARTICLES_PER_CLUSTER}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-size"
                array={cluster.sizes}
                count={MAX_PARTICLES_PER_CLUSTER}
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
            count={MAX_ATMOSPHERIC_COUNT}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.atmospheric.colors}
            count={MAX_ATMOSPHERIC_COUNT}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.atmospheric.sizes}
            count={MAX_ATMOSPHERIC_COUNT}
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
            count={MAX_DISTANT_SWIRL_COUNT}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={particleData.distantSwirl.colors}
            count={MAX_DISTANT_SWIRL_COUNT}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={particleData.distantSwirl.sizes}
            count={MAX_DISTANT_SWIRL_COUNT}
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
              gl_PointSize = size * (${isRecording ? '300.0' : '250.0'} / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
              float distance = length(mvPosition.xyz);
              vOpacity = 1.0 - smoothstep(150.0, 400.0, distance);
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
              gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '0.8' : '0.7'});
            }
          `}
        />
      </points>

      {/* Big swirls */}
      <group ref={bigSwirlsRef}>
        {particleData.bigSwirls.map((swirl, index) => (
          <points key={`${particleKey}-big-swirl-${index}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                array={swirl.positions}
                count={MAX_PARTICLES_PER_SWIRL}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-color"
                array={swirl.colors}
                count={MAX_PARTICLES_PER_SWIRL}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-size"
                array={swirl.sizes}
                count={MAX_PARTICLES_PER_SWIRL}
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
                  gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '0.9' : '0.8'});
                }
              `}
            />
          </points>
        ))}
      </group>

      {/* Snow particles */}
      {isChristmasTheme && particleData.snow.count > 0 && (
        <points ref={snowParticlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={particleData.snow.positions}
              count={MAX_SNOW_COUNT}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              array={particleData.snow.colors}
              count={MAX_SNOW_COUNT}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              array={particleData.snow.sizes}
              count={MAX_SNOW_COUNT}
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
                gl_PointSize = size * (${isRecording ? '200.0' : '150.0'} / -mvPosition.z);
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
                gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '0.7' : '0.6'});
              }
            `}
          />
        </points>
      )}

      {/* Twinkle particles */}
      {isChristmasTheme && particleData.twinkle.count > 0 && (
        <points ref={twinkleParticlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={particleData.twinkle.positions}
              count={MAX_TWINKLE_COUNT}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              array={particleData.twinkle.colors}
              count={MAX_TWINKLE_COUNT}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              array={particleData.twinkle.sizes}
              count={MAX_TWINKLE_COUNT}
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
                gl_PointSize = size * (${isRecording ? '250.0' : '200.0'} / -mvPosition.z);
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
                gl_FragColor = vec4(vColor, alpha * vOpacity * ${isRecording ? '0.8' : '0.7'});
              }
            `}
          />
        </points>
      )}

      {/* Geometric snowflakes */}
      {isChristmasTheme && geometricSnowflakesData.length > 0 && (
        <group ref={geometricSnowflakesRef}>
          {geometricSnowflakesData.slice(0, GEOMETRIC_SNOWFLAKES_COUNT).map((snowflake, index) => (
            <mesh
              key={`${particleKey}-snowflake-${index}`}
              geometry={snowflake.geometry}
              scale={[snowflake.scale, snowflake.scale, snowflake.scale]}
            >
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={snowflake.emissiveIntensity}
                roughness={0.3}
                metalness={0.7}
                transparent
                opacity={0.9}
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
```