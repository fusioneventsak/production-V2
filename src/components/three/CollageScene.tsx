// Enhanced CollageScene with Fixed Camera Animations and Improved Wave Pattern
import React, { useRef, useMemo, useEffect, useState, useCallback, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { type SceneSettings } from '../../store/sceneStore';
import { PatternFactory } from './patterns/PatternFactory';
import { addCacheBustToUrl } from '../../lib/supabase';
import MilkyWayParticleSystem, { PARTICLE_THEMES } from './MilkyWayParticleSystem';

type Photo = {
  id: string;
  url: string;
  collage_id?: string;
  created_at?: string;
  aspect_ratio?: number;
  width?: number;
  height?: number;
};

type CollageSceneProps = {
  photos: Photo[];
  settings: ExtendedSceneSettings;
  width?: number;
  height?: number;
  onSettingsChange?: (settings: Partial<ExtendedSceneSettings>, debounce?: boolean) => void;
};

type PhotoWithPosition = Photo & {
  targetPosition: [number, number, number];
  targetRotation: [number, number, number];
  displayIndex?: number;
  slotIndex: number;
  computedSize: [number, number];
};

// Enhanced animation constants
const POSITION_SMOOTHING = 0.08;
const ROTATION_SMOOTHING = 0.08;
const TELEPORT_THRESHOLD = 35;

// Scene Environment Types
type SceneEnvironment = 'default' | 'cube' | 'sphere' | 'gallery' | 'studio';
type FloorTexture = 'solid' | 'marble' | 'wood' | 'concrete' | 'metal' | 'glass' | 'checkerboard' | 'custom';

// Extended settings for scene environments
interface ExtendedSceneSettings extends SceneSettings {
  sceneEnvironment?: SceneEnvironment;
  floorTexture?: FloorTexture;
  customFloorTextureUrl?: string;
  environmentIntensity?: number;
  cubeTextureUrl?: string;
  sphereTextureUrl?: string;
  wallHeight?: number;
  wallThickness?: number;
  wallColor?: string;
  ceilingEnabled?: boolean;
  ceilingHeight?: number;
  roomDepth?: number;
  
  // Enhanced Auto-Rotate Camera Settings
  cameraAutoRotateSpeed?: number;
  cameraAutoRotateRadius?: number;
  cameraAutoRotateHeight?: number;
  cameraAutoRotateElevationMin?: number;
  cameraAutoRotateElevationMax?: number;
  cameraAutoRotateElevationSpeed?: number;
  cameraAutoRotateDistanceVariation?: number;
  cameraAutoRotateDistanceSpeed?: number;
  cameraAutoRotateVerticalDrift?: number;
  cameraAutoRotateVerticalDriftSpeed?: number;
  cameraAutoRotateFocusOffset?: [number, number, number];
  cameraAutoRotatePauseOnInteraction?: number;
}

// FIXED Camera Animation Controller with Proper Interaction Handling
const CameraAnimationController: React.FC<{
  config?: {
    enabled?: boolean;
    type: 'none' | 'orbit' | 'figure8' | 'centerRotate' | 'wave' | 'spiral';
    speed: number;
    radius: number;
    height: number;
    amplitude: number;
    frequency: number;
  };
  photosWithPositions?: PhotoWithPosition[];
  settings?: ExtendedSceneSettings;
}> = ({ config, photosWithPositions = [], settings }) => {
  const { camera, controls } = useThree();
  const timeRef = useRef(0);
  const userInteractingRef = useRef(false);
  const lastInteractionRef = useRef(0);
  const isActiveRef = useRef(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate photo bounds for better camera coverage
  const photoBounds = useMemo(() => {
    if (!photosWithPositions.length) {
      return { 
        minX: -50, maxX: 50, 
        minY: -10, maxY: 10, 
        minZ: -50, maxZ: 50,
        centerX: 0, centerY: 0, centerZ: 0,
        spanX: 100, spanY: 20, spanZ: 100
      };
    }

    const positions = photosWithPositions
      .filter(p => p.url) // Only consider actual photos
      .map(p => p.targetPosition);

    if (positions.length === 0) {
      return { 
        minX: -50, maxX: 50, 
        minY: -10, maxY: 10, 
        minZ: -50, maxZ: 50,
        centerX: 0, centerY: 0, centerZ: 0,
        spanX: 100, spanY: 20, spanZ: 100
      };
    }

    const minX = Math.min(...positions.map(p => p[0]));
    const maxX = Math.max(...positions.map(p => p[0]));
    const minY = Math.min(...positions.map(p => p[1]));
    const maxY = Math.max(...positions.map(p => p[1]));
    const minZ = Math.min(...positions.map(p => p[2]));
    const maxZ = Math.max(...positions.map(p => p[2]));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const spanX = Math.max(maxX - minX, 20);
    const spanY = Math.max(maxY - minY, 10);
    const spanZ = Math.max(maxZ - minZ, 20);

    return { 
      minX, maxX, minY, maxY, minZ, maxZ,
      centerX, centerY, centerZ,
      spanX, spanY, spanZ
    };
  }, [photosWithPositions]);

  // Detect user interaction with controls - FIXED
  useEffect(() => {
    if (!controls) return;

    const handleStart = () => {
      userInteractingRef.current = true;
      lastInteractionRef.current = Date.now();
      isActiveRef.current = false; // Stop animation immediately
      
      // Clear any existing pause timeout
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };

    const handleEnd = () => {
      userInteractingRef.current = false;
      lastInteractionRef.current = Date.now();
      
      // Store current camera position to resume from where user left off
      if (camera && camera.position) {
        const spherical = new THREE.Spherical();
        const offset = new THREE.Vector3().copy(camera.position).sub(photoBounds.centerX, photoBounds.centerY, photoBounds.centerZ);
        spherical.setFromVector3(offset);
        
        // Update time reference to current position to prevent jumps
        timeRef.current = spherical.theta / (config?.speed || 1);
      }
      
      // Pause animation for 2 seconds after user interaction ends
      pauseTimeoutRef.current = setTimeout(() => {
        if (!userInteractingRef.current) {
          isActiveRef.current = true; // Resume animation from current position
        }
      }, 2000);
    };

    const handleChange = () => {
      if (userInteractingRef.current) {
        lastInteractionRef.current = Date.now();
      }
    };

    if ('addEventListener' in controls) {
      controls.addEventListener('start', handleStart);
      controls.addEventListener('end', handleEnd);
      controls.addEventListener('change', handleChange);
      
      return () => {
        controls.removeEventListener('start', handleStart);
        controls.removeEventListener('end', handleEnd);
        controls.removeEventListener('change', handleChange);
        
        if (pauseTimeoutRef.current) {
          clearTimeout(pauseTimeoutRef.current);
        }
      };
    }
  }, [controls, camera, config?.speed, photoBounds]);

  // ENHANCED Animation calculation functions with Photo-Aware Coverage
  const getAnimationPosition = (time: number, config: any): THREE.Vector3 => {
    const t = time * (config.speed || 1);
    
    // Calculate adaptive parameters based on photo distribution and count
    const photoCount = photosWithPositions.filter(p => p.url).length;
    const adaptiveRadius = Math.max(
      config.radius || 30,
      Math.max(photoBounds.spanX, photoBounds.spanZ) * 0.9
    );
    
    const adaptiveHeight = Math.max(
      config.height || 15,
      photoBounds.centerY + Math.max(photoBounds.spanY, 20)
    );

    // Enhanced randomness factors for better photo coverage
    const randomSeed1 = Math.sin(t * 0.17) * 0.3; // Slow variation
    const randomSeed2 = Math.cos(t * 0.23) * 0.2; // Different frequency
    const randomSeed3 = Math.sin(t * 0.31) * 0.15; // Another variation

    switch (config.type) {
      case 'orbit':
        // ENHANCED Orbit: Multiple orbital paths with height and radius variation
        const orbitCycle = t * 0.1; // Very slow cycle change
        const orbitVariation = Math.sin(orbitCycle) * 0.4;
        const heightVariation = Math.sin(t * 0.3 + orbitCycle) * (photoBounds.spanY * 0.3 + 8);
        
        return new THREE.Vector3(
          photoBounds.centerX + Math.cos(t + orbitVariation) * (adaptiveRadius + randomSeed1 * 15),
          adaptiveHeight + heightVariation + randomSeed2 * 10,
          photoBounds.centerZ + Math.sin(t + orbitVariation) * (adaptiveRadius + randomSeed3 * 12)
        );

      case 'figure8':
        // ENHANCED Figure-8: Multiple intersecting paths with randomness
        const figure8Scale = Math.max(adaptiveRadius * 0.8, 25);
        const pathVariation = Math.sin(t * 0.13) * 0.6; // Path morphing
        const heightOscillation = Math.sin(t * 0.4) * (photoBounds.spanY * 0.4 + 10);
        
        // Multiple figure-8 patterns that morph over time
        const primaryPath = Math.sin(t + pathVariation) * figure8Scale;
        const secondaryPath = Math.sin(t * 2 + pathVariation * 0.5) * (figure8Scale * 0.7);
        
        return new THREE.Vector3(
          photoBounds.centerX + primaryPath + randomSeed1 * 8,
          adaptiveHeight + heightOscillation + randomSeed2 * 6,
          photoBounds.centerZ + secondaryPath + randomSeed3 * 10
        );

      case 'centerRotate':
        // ENHANCED Center Rotate: Much longer cycle with multiple phases
        const longCycleTime = 45; // Increased from 20 to 45 seconds
        const phase = (t % longCycleTime) / longCycleTime;
        const angle = t * 1.5 + randomSeed1; // Slower rotation with variation
        
        let currentRadius: number;
        let currentHeight: number;
        let currentVariation: number;
        
        if (phase < 0.2) {
          // Phase 1: Close inspection (0-20%)
          const phaseT = phase / 0.2;
          currentRadius = adaptiveRadius * (0.3 + phaseT * 0.2) + randomSeed2 * 5;
          currentHeight = adaptiveHeight * (0.6 + phaseT * 0.3) + randomSeed3 * 8;
          currentVariation = Math.sin(phaseT * Math.PI) * 10;
        } else if (phase < 0.4) {
          // Phase 2: Medium distance sweep (20-40%)
          const phaseT = (phase - 0.2) / 0.2;
          currentRadius = adaptiveRadius * (0.5 + phaseT * 0.3) + randomSeed1 * 8;
          currentHeight = adaptiveHeight * (0.9 + phaseT * 0.4) + randomSeed2 * 12;
          currentVariation = Math.sin(phaseT * Math.PI * 2) * 15;
        } else if (phase < 0.6) {
          // Phase 3: Wide overview (40-60%)
          const phaseT = (phase - 0.4) / 0.2;
          currentRadius = adaptiveRadius * (0.8 + phaseT * 0.4) + randomSeed3 * 12;
          currentHeight = adaptiveHeight * (1.3 + phaseT * 0.5) + randomSeed1 * 15;
          currentVariation = Math.sin(phaseT * Math.PI * 1.5) * 20;
        } else if (phase < 0.8) {
          // Phase 4: Dynamic exploration (60-80%)
          const phaseT = (phase - 0.6) / 0.2;
          currentRadius = adaptiveRadius * (1.0 + Math.sin(phaseT * Math.PI * 3) * 0.3) + randomSeed2 * 10;
          currentHeight = adaptiveHeight * (1.1 + Math.cos(phaseT * Math.PI * 2) * 0.4) + randomSeed3 * 18;
          currentVariation = Math.sin(phaseT * Math.PI * 4) * 25;
        } else {
          // Phase 5: Return journey (80-100%)
          const phaseT = (phase - 0.8) / 0.2;
          currentRadius = adaptiveRadius * (1.2 - phaseT * 0.9) + randomSeed1 * 6;
          currentHeight = adaptiveHeight * (1.6 - phaseT * 1.0) + randomSeed2 * 10;
          currentVariation = Math.sin(phaseT * Math.PI) * 12;
        }
        
        return new THREE.Vector3(
          photoBounds.centerX + Math.cos(angle) * currentRadius + currentVariation,
          currentHeight,
          photoBounds.centerZ + Math.sin(angle) * currentRadius + currentVariation * 0.7
        );

      case 'wave':
        // ENHANCED Wave: Multiple wave patterns with photo-aware coverage
        const waveFreq1 = config.frequency || 0.4;
        const waveFreq2 = waveFreq1 * 0.7; // Harmonic frequency
        const waveFreq3 = waveFreq1 * 1.3; // Another harmonic
        
        // Multi-layered wave motion
        const waveRadius1 = adaptiveRadius + Math.sin(t * waveFreq1) * (config.amplitude || adaptiveRadius * 0.3);
        const waveRadius2 = Math.sin(t * waveFreq2) * (adaptiveRadius * 0.2);
        const waveRadius3 = Math.cos(t * waveFreq3) * (adaptiveRadius * 0.15);
        
        const totalRadius = waveRadius1 + waveRadius2 + waveRadius3 + randomSeed1 * 8;
        
        // Enhanced height variation with multiple frequencies
        const heightWave1 = Math.sin(t * waveFreq1 * 2) * (photoBounds.spanY * 0.3 + 8);
        const heightWave2 = Math.cos(t * waveFreq2 * 1.5) * (photoBounds.spanY * 0.2 + 5);
        const heightWave3 = Math.sin(t * waveFreq3 * 0.8) * (photoBounds.spanY * 0.15 + 3);
        
        const totalHeight = adaptiveHeight + heightWave1 + heightWave2 + heightWave3 + randomSeed2 * 6;
        
        // Orbital motion with wave variations
        const orbitAngle = t + Math.sin(t * waveFreq1) * 0.5; // Wave affects orbit path
        
        return new THREE.Vector3(
          photoBounds.centerX + Math.cos(orbitAngle) * totalRadius + randomSeed3 * 5,
          totalHeight,
          photoBounds.centerZ + Math.sin(orbitAngle) * totalRadius + randomSeed1 * 4
        );

      case 'spiral':
        // ENHANCED Spiral: Multi-dimensional spiral with photo exploration
        const spiralFreq = config.frequency || 0.3;
        const longSpiralCycle = t * 0.08; // Very slow expansion/contraction cycle
        
        // Multiple spiral components
        const spiralMod1 = 1 + Math.sin(longSpiralCycle) * 0.5;
        const spiralMod2 = 1 + Math.cos(longSpiralCycle * 0.7) * 0.3;
        const spiralMod3 = 1 + Math.sin(longSpiralCycle * 1.3) * 0.2;
        
        const combinedMod = (spiralMod1 + spiralMod2 + spiralMod3) / 3;
        
        // Enhanced spiral radius with multiple variations
        const spiralRadius = adaptiveRadius * combinedMod + randomSeed1 * 12;
        
        // Complex height variation
        const heightSpiral1 = Math.sin(t * spiralFreq * 0.5) * (photoBounds.spanY * 0.4 + 10);
        const heightSpiral2 = Math.cos(t * spiralFreq * 0.3) * (photoBounds.spanY * 0.2 + 6);
        const heightSpiral3 = Math.sin(longSpiralCycle * 2) * (photoBounds.spanY * 0.3 + 8);
        
        const spiralHeight = adaptiveHeight + heightSpiral1 + heightSpiral2 + heightSpiral3 + randomSeed2 * 8;
        
        // Multiple spiral arms for better coverage
        const armOffset = (photoCount > 50) ? Math.sin(t * 0.1) * Math.PI * 0.5 : 0;
        const spiralAngle = t * 1.8 + armOffset; // Slower spiral rotation
        
        return new THREE.Vector3(
          photoBounds.centerX + Math.cos(spiralAngle) * spiralRadius + randomSeed3 * 6,
          spiralHeight,
          photoBounds.centerZ + Math.sin(spiralAngle) * spiralRadius + randomSeed1 * 5
        );

      default:
        return camera.position.clone();
    }
  };

  // Main animation frame update - FIXED
  useFrame((state, delta) => {
    if (!config || !config.enabled || config.type === 'none') {
      return;
    }

    // Don't animate while user is interacting or during pause period
    if (userInteractingRef.current || !isActiveRef.current) {
      return;
    }

    // Initialize animation if not active
    if (!isActiveRef.current) {
      isActiveRef.current = true;
    }

    // Update time smoothly
    const smoothDelta = Math.min(delta, 0.016);
    timeRef.current += smoothDelta;

    // Calculate new position
    const targetPosition = getAnimationPosition(timeRef.current, config);
    
    // Smooth camera movement - more gradual
    camera.position.lerp(targetPosition, 0.015);
    
  // ENHANCED Look-at system for better photo coverage
  const calculateLookAtTarget = (time: number, cameraPosition: THREE.Vector3): THREE.Vector3 => {
    const actualPhotos = photosWithPositions.filter(p => p.url);
    if (actualPhotos.length === 0) {
      return new THREE.Vector3(photoBounds.centerX, photoBounds.centerY, photoBounds.centerZ);
    }

    // Intelligent look-at targeting based on camera position and time
    const t = time * 0.1; // Slow target switching
    
    // Calculate which photos are in a good viewing cone from current camera position
    const viewablePhotos = actualPhotos.filter(photo => {
      const photoPos = new THREE.Vector3(...photo.targetPosition);
      const distance = cameraPosition.distanceTo(photoPos);
      return distance > 5 && distance < 100; // Not too close, not too far
    });
    
    if (viewablePhotos.length === 0) {
      return new THREE.Vector3(photoBounds.centerX, photoBounds.centerY, photoBounds.centerZ);
    }
    
    // Use time-based selection with some randomness to see different photos
    const targetIndex = Math.floor((Math.sin(t) + 1) * 0.5 * viewablePhotos.length);
    const primaryTarget = viewablePhotos[Math.min(targetIndex, viewablePhotos.length - 1)];
    
    // Add some offset variation to explore around the target photo
    const offset = new THREE.Vector3(
      Math.sin(t * 1.7) * 3,
      Math.cos(t * 1.3) * 2,
      Math.sin(t * 2.1) * 3
    );
    
    const targetPos = new THREE.Vector3(...primaryTarget.targetPosition).add(offset);
    
    // Blend with overall scene center for stability
    const sceneCenter = new THREE.Vector3(photoBounds.centerX, photoBounds.centerY, photoBounds.centerZ);
    const blendFactor = 0.7; // 70% specific photo, 30% scene center
    
    return targetPos.lerp(sceneCenter, 1 - blendFactor);
  };
    
    camera.lookAt(lookAtTarget);
    
    // Update controls target smoothly
    if (controls && 'target' in controls) {
      (controls as any).target.lerp(lookAtTarget, 0.015);
      (controls as any).update();
    }
  });

  // Initialize animation state and log detailed info
  useEffect(() => {
    if (config?.enabled && config.type !== 'none') {
      const photoCount = photosWithPositions.filter(p => p.url).length;
      console.log('🎬 Enhanced Cinematic Camera Animation Started:', {
        type: config.type,
        speed: config.speed,
        radius: config.radius,
        height: config.height,
        photoCount,
        photoBounds,
        estimatedCycleTime: config.type === 'centerRotate' ? '45 seconds' : 
                           config.type === 'spiral' ? '30+ seconds' :
                           config.type === 'wave' ? '25+ seconds' : '20+ seconds'
      });
      
      // Start animation in a ready state
      setTimeout(() => {
        isActiveRef.current = true;
      }, 100);
    }
  }, [config?.enabled, config?.type, photosWithPositions]);

  return null;
};

// Enhanced Cube Environment with Full Background Scale
const CubeEnvironment: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  // Much larger walls to fill entire background
  const wallSize = Math.max((settings.floorSize || 200) * 3, 600);
  const wallHeight = Math.max(settings.wallHeight || 40, 300);
  const wallThickness = settings.wallThickness || 2;
  const wallColor = settings.wallColor || settings.floorColor || '#3A3A3A';

  const wallMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: wallColor,
      metalness: 0.1,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
  }, [wallColor]);

  console.log('🏢 CUBE: Rendering large cube environment with size:', wallSize, 'height:', wallHeight, 'color:', wallColor);

  return (
    <group>
      {/* Back Wall - Much larger and taller */}
      <mesh position={[0, wallHeight / 2 - 50, -wallSize / 2]} receiveShadow>
        <boxGeometry args={[wallSize, wallHeight, wallThickness]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      
      {/* Left Wall */}
      <mesh position={[-wallSize / 2, wallHeight / 2 - 50, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, wallSize]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      
      {/* Right Wall */}
      <mesh position={[wallSize / 2, wallHeight / 2 - 50, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, wallSize]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Front Wall (optional - can be removed for open front) */}
      <mesh position={[0, wallHeight / 2 - 50, wallSize / 2]} receiveShadow>
        <boxGeometry args={[wallSize, wallHeight, wallThickness]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Ceiling (if enabled) */}
      {settings.ceilingEnabled && (
        <mesh position={[0, (settings.ceilingHeight || wallHeight) - 50, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[wallSize, wallSize]} />
          <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

const SphereEnvironment: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const sphereRadius = (settings.floorSize || 200) * 0.6;
  const wallColor = settings.wallColor || settings.floorColor || '#1A1A2E';

  const sphereMaterial = useMemo(() => {
    if (settings.sphereTextureUrl) {
      const texture = new THREE.TextureLoader().load(settings.sphereTextureUrl);
      return new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.BackSide,
        metalness: 0,
        roughness: 0.8,
      });
    }
    
    return new THREE.MeshStandardMaterial({
      color: wallColor,
      side: THREE.BackSide,
      metalness: 0.1,
      roughness: 0.9,
    });
  }, [wallColor, settings.sphereTextureUrl]);

  console.log('🌍 SPHERE: Rendering sphere environment with color:', wallColor);

  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[sphereRadius, 64, 32]} />
      <primitive object={sphereMaterial} attach="material" />
    </mesh>
  );
};

// Enhanced Gallery Environment with Full Background Scale and Fixed Colors
const GalleryEnvironment: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const roomWidth = Math.max(settings.floorSize || 200, 400) * 2;
  const roomHeight = Math.max(settings.wallHeight || 50, 200);
  const roomDepth = settings.roomDepth || roomWidth;
  const wallColor = settings.wallColor || '#F5F5F5';

  const wallMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: wallColor,
      metalness: 0.0,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
  }, [wallColor]);

  console.log('🖼️ GALLERY: Rendering large gallery with dimensions:', { roomWidth, roomHeight, roomDepth }, 'color:', wallColor);

  return (
    <group>
      {/* Back Wall - Much larger */}
      <mesh position={[0, roomHeight / 2 - 50, -roomDepth / 2]} receiveShadow>
        <planeGeometry args={[roomWidth, roomHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      
      {/* Left Wall */}
      <mesh position={[-roomWidth / 2, roomHeight / 2 - 50, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[roomDepth, roomHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      
      {/* Right Wall */}
      <mesh position={[roomWidth / 2, roomHeight / 2 - 50, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[roomDepth, roomHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Front Wall */}
      <mesh position={[0, roomHeight / 2 - 50, roomDepth / 2]} receiveShadow>
        <planeGeometry args={[roomWidth, roomHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Gallery Ceiling */}
      <mesh position={[0, roomHeight - 50, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roomWidth, roomDepth]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Enhanced Gallery Track Lighting */}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i}>
          {/* Track Light Fixture */}
          <mesh position={[(i - 3.5) * (roomWidth / 8), roomHeight - 55, 0]}>
            <cylinderGeometry args={[1, 1.5, 3, 8]} />
            <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Spot Light */}
          <spotLight
            position={[(i - 3.5) * (roomWidth / 8), roomHeight - 55, 0]}
            target-position={[(i - 3.5) * (roomWidth / 8), -10, 0]}
            angle={Math.PI / 6}
            penumbra={0.3}
            intensity={2}
            color="#FFFFFF"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
        </group>
      ))}
    </group>
  );
};

// Enhanced Studio Environment with Full Background Scale and Fixed Colors
const StudioEnvironment: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const studioSize = Math.max(settings.floorSize || 200, 300) * 2;
  const backdropColor = settings.wallColor || '#E8E8E8';

  const backdropMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: backdropColor,
      metalness: 0.0,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
  }, [backdropColor]);

  // Create curved backdrop geometry - much larger
  const backdropGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(
      studioSize, // radius top
      studioSize, // radius bottom  
      studioSize * 1.2, // height - taller
      32, // radial segments
      1, // height segments
      true, // open ended
      0, // theta start
      Math.PI // theta length (half circle)
    );
    return geometry;
  }, [studioSize]);

  // Studio lighting positions (6-point lighting) - adjusted for larger space
  const lightPositions = useMemo(() => [
    // Key light
    [studioSize * 0.3, studioSize * 0.4, studioSize * 0.5],
    // Fill light
    [-studioSize * 0.3, studioSize * 0.4, studioSize * 0.5],
    // Back light
    [0, studioSize * 0.6, -studioSize * 0.3],
    // Hair lights
    [studioSize * 0.2, studioSize * 0.8, 0],
    [-studioSize * 0.2, studioSize * 0.8, 0],
    // Background light
    [0, studioSize * 0.2, -studioSize * 0.8]
  ], [studioSize]);

  console.log('📸 STUDIO: Rendering large studio with size:', studioSize, 'backdrop color:', backdropColor);

  return (
    <group>
      {/* Curved Backdrop (Cyc Wall) - Much larger */}
      <mesh 
        geometry={backdropGeometry} 
        material={backdropMaterial}
        position={[0, studioSize * 0.2 - 50, -studioSize * 0.6]}
        rotation={[0, 0, 0]}
      />

      {/* Studio Floor Extension - Large seamless backdrop */}
      <mesh position={[0, -50, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[studioSize * 2, studioSize * 2]} />
        <primitive object={backdropMaterial} attach="material" />
      </mesh>

      {/* Studio Lighting Rig */}
      <group position={[0, studioSize / 2, 0]}>
        {lightPositions.map((pos, i) => (
          <group key={i}>
            {/* Light Stand/Fixture */}
            <mesh position={pos as [number, number, number]}>
              <cylinderGeometry args={[1, 2, 4, 8]} />
              <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.1} />
            </mesh>
            
            {/* Studio Light */}
            <spotLight
              position={pos as [number, number, number]}
              target-position={[0, -25, 0]}
              angle={i < 2 ? Math.PI / 4 : Math.PI / 6} // Wider angle for key/fill
              penumbra={0.5}
              intensity={i === 0 ? 3 : i === 1 ? 2 : 1.5} // Key light brightest
              color="#FFFFFF"
              castShadow={i < 3} // Only first 3 lights cast shadows for performance
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
          </group>
        ))}
      </group>
    </group>
  );
};

// Scene Environment Manager
const SceneEnvironmentManager: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const environment = settings.sceneEnvironment || 'default';

  console.log('🌟 ENVIRONMENT: Rendering environment type:', environment, 'with settings:', {
    wallColor: settings.wallColor,
    floorColor: settings.floorColor,
    wallThickness: settings.wallThickness
  });

  switch (environment) {
    case 'cube':
      return <CubeEnvironment settings={settings} />;
    case 'sphere':
      return <SphereEnvironment settings={settings} />;
    case 'gallery':
      return <GalleryEnvironment settings={settings} />;
    case 'studio':
      return <StudioEnvironment settings={settings} />;
    case 'default':
    default:
      return null;
  }
};

// Advanced Resource Manager for Memory Optimization
class ResourceManager {
  private static instance: ResourceManager;
  private texturePool = new Map<string, THREE.Texture>();
  private materialPool = new Map<string, THREE.Material>();
  private geometryPool = new Map<string, THREE.BufferGeometry>();
  private maxCacheSize = 200;

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  getTexture(url: string, loader: () => Promise<THREE.Texture>): Promise<THREE.Texture> {
    if (this.texturePool.has(url)) {
      return Promise.resolve(this.texturePool.get(url)!.clone());
    }

    return loader().then(texture => {
      if (this.texturePool.size >= this.maxCacheSize) {
        const firstKey = this.texturePool.keys().next().value;
        const oldTexture = this.texturePool.get(firstKey);
        oldTexture?.dispose();
        this.texturePool.delete(firstKey);
      }

      this.texturePool.set(url, texture);
      return texture.clone();
    });
  }

  getGeometry(key: string, creator: () => THREE.BufferGeometry): THREE.BufferGeometry {
    if (!this.geometryPool.has(key)) {
      this.geometryPool.set(key, creator());
    }
    return this.geometryPool.get(key)!;
  }

  dispose(): void {
    this.texturePool.forEach(texture => texture.dispose());
    this.materialPool.forEach(material => material.dispose());
    this.geometryPool.forEach(geometry => geometry.dispose());
    this.texturePool.clear();
    this.materialPool.clear();
    this.geometryPool.clear();
  }
}

// Floor Texture Creator
class FloorTextureFactory {
  static createTexture(type: FloorTexture, size: number = 512, customUrl?: string): THREE.Texture {
    if (type === 'custom' && customUrl) {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(customUrl);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(8, 8);
      return texture;
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    switch (type) {
      case 'marble':
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#f8f8ff');
        gradient.addColorStop(0.3, '#e6e6fa');
        gradient.addColorStop(0.6, '#dda0dd');
        gradient.addColorStop(1, '#d8bfd8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
          ctx.beginPath();
          ctx.moveTo(Math.random() * size, Math.random() * size);
          ctx.bezierCurveTo(
            Math.random() * size, Math.random() * size,
            Math.random() * size, Math.random() * size,
            Math.random() * size, Math.random() * size
          );
          ctx.stroke();
        }
        break;

      case 'wood':
        const woodGradient = ctx.createLinearGradient(0, 0, 0, size);
        woodGradient.addColorStop(0, '#8B4513');
        woodGradient.addColorStop(0.3, '#A0522D');
        woodGradient.addColorStop(0.7, '#CD853F');
        woodGradient.addColorStop(1, '#DEB887');
        ctx.fillStyle = woodGradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let y = 0; y < size; y += 8) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(size, y + Math.sin(y * 0.1) * 4);
          ctx.stroke();
        }
        break;

      case 'concrete':
        ctx.fillStyle = '#696969';
        ctx.fillRect(0, 0, size, size);
        
        for (let i = 0; i < 1000; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? '#808080' : '#556B2F';
          ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
        }
        break;

      case 'metal':
        const metalGradient = ctx.createLinearGradient(0, 0, size, 0);
        metalGradient.addColorStop(0, '#C0C0C0');
        metalGradient.addColorStop(0.5, '#A9A9A9');
        metalGradient.addColorStop(1, '#808080');
        ctx.fillStyle = metalGradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = '#B8B8B8';
        ctx.lineWidth = 1;
        for (let x = 0; x < size; x += 4) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, size);
          ctx.stroke();
        }
        break;

      case 'glass':
        ctx.fillStyle = '#E0F6FF';
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = '#FFFFFF80';
        ctx.lineWidth = 3;
        for (let i = 0; i < 10; i++) {
          const x = (i * size) / 10;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + 50, size);
          ctx.stroke();
        }
        break;

      case 'checkerboard':
        const tileSize = size / 16;
        for (let x = 0; x < 16; x++) {
          for (let y = 0; y < 16; y++) {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#FFFFFF' : '#000000';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          }
        }
        break;

      default:
        ctx.fillStyle = '#2C2C2C';
        ctx.fillRect(0, 0, size, size);
        break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    
    return texture;
  }
}

class EnhancedSlotManager {
  private slotAssignments = new Map<string, number>();
  private occupiedSlots = new Set<number>();
  private availableSlots: number[] = [];
  private totalSlots = 0;
  private photoAspectRatios = new Map<string, number>();

  constructor(totalSlots: number) {
    this.updateSlotCount(totalSlots);
  }

  updateSlotCount(newTotal: number) {
    if (newTotal === this.totalSlots) return;
    this.totalSlots = newTotal;
    
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (slotIndex >= newTotal) {
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
        this.photoAspectRatios.delete(photoId);
      }
    }
    
    this.rebuildAvailableSlots();
  }

  private rebuildAvailableSlots() {
    this.availableSlots = [];
    for (let i = 0; i < this.totalSlots; i++) {
      if (!this.occupiedSlots.has(i)) {
        this.availableSlots.push(i);
      }
    }
    this.availableSlots.sort((a, b) => a - b);
  }

  assignSlots(photos: Photo[]): Map<string, number> {
    const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
    
    safePhotos.forEach(photo => {
      if (!this.photoAspectRatios.has(photo.id)) {
        if (photo.width && photo.height) {
          this.photoAspectRatios.set(photo.id, photo.width / photo.height);
        }
      }
    });
    
    const currentPhotoIds = new Set(safePhotos.map(p => p.id));
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (!currentPhotoIds.has(photoId)) {
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
        this.photoAspectRatios.delete(photoId);
      }
    }

    this.rebuildAvailableSlots();

    const sortedPhotos = [...safePhotos].sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return a.id.localeCompare(b.id);
    });

    for (const photo of sortedPhotos) {
      if (!this.slotAssignments.has(photo.id) && this.availableSlots.length > 0) {
        const newSlot = this.availableSlots.shift()!;
        this.slotAssignments.set(photo.id, newSlot);
        this.occupiedSlots.add(newSlot);
      }
    }

    return new Map(this.slotAssignments);
  }

  getAspectRatio(photoId: string): number | null {
    return this.photoAspectRatios.get(photoId) || null;
  }
}

// Background renderer with gradient support
const BackgroundRenderer: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const { scene, gl } = useThree();
  
  useEffect(() => {
    try {
      if (settings.backgroundGradient) {
        scene.background = null;
        gl.setClearColor('#000000', 0);
      } else {
        scene.background = new THREE.Color(settings.backgroundColor || '#000000');
        gl.setClearColor(settings.backgroundColor || '#000000', 1);
      }
    } catch (error) {
      console.error('Background render error:', error);
    }
  }, [
    scene, 
    gl, 
    settings.backgroundColor, 
    settings.backgroundGradient,
    settings.backgroundGradientStart,
    settings.backgroundGradientEnd,
    settings.backgroundGradientAngle
  ]);

  return null;
};

// Optimized Photo Component
const OptimizedPhotoMesh: React.FC<{
  photo: PhotoWithPosition;
  settings: ExtendedSceneSettings;
  shouldFaceCamera: boolean;
}> = React.memo(({ photo, settings, shouldFaceCamera }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<number | null>(null);
  
  const isInitializedRef = useRef(false);
  const lastPositionRef = useRef<[number, number, number]>([0, 0, 0]);
  const currentPosition = useRef<THREE.Vector3>(new THREE.Vector3(...photo.targetPosition));
  const currentRotation = useRef<THREE.Euler>(new THREE.Euler(...photo.targetRotation));

  useEffect(() => {
    currentPosition.current.set(...photo.targetPosition);
    currentRotation.current.set(...photo.targetRotation);
  }, [photo.targetPosition, photo.targetRotation]);

  useEffect(() => {
    if (!photo.url) {
      setIsLoading(false);
      return;
    }

    const loader = new THREE.TextureLoader();
    setIsLoading(true);
    setHasError(false);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const actualAspectRatio = img.naturalWidth / img.naturalHeight;
      setDetectedAspectRatio(actualAspectRatio);
      
      const imageUrl = photo.url.includes('?') 
        ? `${photo.url}&t=${Date.now()}`
        : `${photo.url}?t=${Date.now()}`;

      loader.load(imageUrl, (loadedTexture) => {
        loadedTexture.generateMipmaps = true;
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.format = THREE.RGBAFormat;
        
        if (gl && gl.capabilities.getMaxAnisotropy) {
          loadedTexture.anisotropy = gl.capabilities.getMaxAnisotropy();
        }

        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.flipY = true;
        loadedTexture.premultipliedAlpha = false;

        setTexture(loadedTexture);
        setIsLoading(false);
      }, undefined, () => {
        setHasError(true);
        setIsLoading(false);
      });
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };
    
    img.src = photo.url;

    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [photo.url, gl]);

  const computedDimensions = useMemo(() => {
    const baseSize = settings.photoSize || 4.0;
    
    let aspectRatio = 1;
    if (detectedAspectRatio) {
      aspectRatio = detectedAspectRatio;
    } else if (photo.computedSize && photo.computedSize[0] && photo.computedSize[1]) {
      aspectRatio = photo.computedSize[0] / photo.computedSize[1];
    }
    
    if (aspectRatio > 1) {
      return [baseSize * aspectRatio, baseSize];
    } else {
      return [baseSize, baseSize / aspectRatio];
    }
  }, [settings.photoSize, photo.computedSize, detectedAspectRatio]);

  useFrame(() => {
    if (!meshRef.current || !shouldFaceCamera) return;

    const mesh = meshRef.current;
    const currentPositionArray = mesh.position.toArray() as [number, number, number];
    
    const positionChanged = currentPositionArray.some((coord, index) => 
      Math.abs(coord - lastPositionRef.current[index]) > 0.01
    );

    if (positionChanged || !isInitializedRef.current) {
      mesh.lookAt(camera.position);
      lastPositionRef.current = currentPositionArray;
      isInitializedRef.current = true;
    }
  });

  useFrame(() => {
    if (!meshRef.current) return;

    const targetPosition = new THREE.Vector3(...photo.targetPosition);
    const targetRotation = new THREE.Euler(...photo.targetRotation);

    const distance = currentPosition.current.distanceTo(targetPosition);
    const isTeleport = distance > TELEPORT_THRESHOLD;

    if (isTeleport) {
      currentPosition.current.copy(targetPosition);
      currentRotation.current.copy(targetRotation);
    } else {
      currentPosition.current.lerp(targetPosition, POSITION_SMOOTHING);
      currentRotation.current.x += (targetRotation.x - currentRotation.current.x) * ROTATION_SMOOTHING;
      currentRotation.current.y += (targetRotation.y - currentRotation.current.y) * ROTATION_SMOOTHING;
      currentRotation.current.z += (targetRotation.z - currentRotation.current.z) * ROTATION_SMOOTHING;
    }

    meshRef.current.position.copy(currentPosition.current);
    if (!shouldFaceCamera) {
      meshRef.current.rotation.copy(currentRotation.current);
    }
  });

  const material = useMemo(() => {
    if (texture) {
      const hasTransparency = photo.url.toLowerCase().includes('.png') || 
                             photo.url.toLowerCase().includes('.webp');
      
      return new THREE.MeshStandardMaterial({
        map: texture,
        transparent: hasTransparency,
        side: THREE.DoubleSide,
        toneMapped: false,
        color: new THREE.Color().setScalar(settings.photoBrightness || 1.0),
        metalness: 0,
        roughness: 0.2,
        alphaTest: hasTransparency ? 0.01 : 0,
        premultipliedAlpha: false,
      });
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = settings.emptySlotColor || '#1A1A1A';
      ctx.fillRect(0, 0, 256, 256);
      
      if (settings.animationPattern === 'grid') {
        ctx.strokeStyle = '#ffffff20';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 256; i += 32) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 256);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(256, i);
          ctx.stroke();
        }
      }
      
      const emptyTexture = new THREE.CanvasTexture(canvas);
      return new THREE.MeshStandardMaterial({
        map: emptyTexture,
        transparent: false,
        side: THREE.DoubleSide,
        color: 0xffffff,
      });
    }
  }, [texture, settings.emptySlotColor, settings.animationPattern, settings.photoBrightness, photo.url]);

  return (
    <mesh
      ref={meshRef}
      material={material}
      castShadow
      receiveShadow
    >
      <planeGeometry args={[computedDimensions[0], computedDimensions[1]]} />
    </mesh>
  );
});

const SimplePhotoRenderer: React.FC<{ 
  photosWithPositions: PhotoWithPosition[]; 
  settings: ExtendedSceneSettings;
}> = ({ photosWithPositions, settings }) => {
  const shouldFaceCamera = settings.animationPattern === 'float';
  
  return (
    <group>
      {photosWithPositions.map((photo) => (
        <OptimizedPhotoMesh
          key={`${photo.id}-${photo.slotIndex}`}
          photo={photo}
          settings={settings}
          shouldFaceCamera={shouldFaceCamera}
        />
      ))}
    </group>
  );
};

const EnhancedLightingSystem: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetRefs = useRef<THREE.Object3D[]>([]);

  const spotlights = useMemo(() => {
    const lights = [];
    const count = Math.min(settings.spotlightCount || 4, 4);
    
    while (targetRefs.current.length < count) {
      targetRefs.current.push(new THREE.Object3D());
    }
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = Math.max(20, settings.spotlightDistance || 30);
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = Math.max(15, settings.spotlightHeight || 25);
      
      targetRefs.current[i].position.set(0, (settings.wallHeight || 0) / 2, 0);
      
      lights.push({
        key: `spotlight-${i}`,
        position: [x, y, z] as [number, number, number],
        target: targetRefs.current[i],
      });
    }
    return lights;
  }, [settings.spotlightCount, settings.spotlightDistance, settings.spotlightHeight, settings.wallHeight]);

  return (
    <group ref={groupRef}>
      <ambientLight 
        intensity={(settings.ambientLightIntensity || 0.4) * 0.5} 
        color="#ffffff" 
      />
      
      <directionalLight
        position={[20, 30, 20]}
        intensity={0.1}
        color="#ffffff"
        castShadow={settings.shadowsEnabled}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0001}
      />
      
      {spotlights.map((light, index) => (
        <group key={light.key}>
          <spotLight
            position={light.position}
            target={light.target}
            angle={Math.max(0.2, Math.min(Math.PI / 3, settings.spotlightAngle || 0.8))}
            penumbra={settings.spotlightPenumbra || 0.4}
            intensity={((settings.spotlightIntensity || 150) / 100) * 8}
            color={settings.spotlightColor || '#ffffff'}
            distance={settings.spotlightDistance * 3 || 120}
            decay={1}
            castShadow={settings.shadowsEnabled}
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.5}
            shadow-camera-far={settings.spotlightDistance * 2 || 100}
            shadow-bias={-0.0001}
          />
          <primitive object={light.target} />
        </group>
      ))}
    </group>
  );
};

// Enhanced Camera Controls with FIXED Interaction Handling
const EnhancedCameraControls: React.FC<{ 
  settings: ExtendedSceneSettings;
  photosWithPositions?: PhotoWithPosition[];
}> = ({ settings, photosWithPositions = [] }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();
  const userInteractingRef = useRef(false);
  const lastInteractionTimeRef = useRef(0);
  const autoRotateTimeRef = useRef(0);
  const heightOscillationRef = useRef(0);
  const distanceOscillationRef = useRef(0);
  const verticalDriftRef = useRef(0);
  
  // Calculate focus point based on photo positions
  const focusPoint = useMemo(() => {
    if (!photosWithPositions.length) {
      return new THREE.Vector3(0, 0, 0);
    }

    const actualPhotos = photosWithPositions.filter(p => p.url);
    if (actualPhotos.length === 0) {
      return new THREE.Vector3(0, 0, 0);
    }

    const center = actualPhotos.reduce(
      (acc, photo) => {
        acc.x += photo.targetPosition[0];
        acc.y += photo.targetPosition[1];
        acc.z += photo.targetPosition[2];
        return acc;
      },
      { x: 0, y: 0, z: 0 }
    );

    return new THREE.Vector3(
      center.x / actualPhotos.length,
      center.y / actualPhotos.length,
      center.z / actualPhotos.length
    );
  }, [photosWithPositions]);
  
  // Initialize camera position
  useEffect(() => {
    if (camera && controlsRef.current) {
      const initialDistance = settings.cameraDistance || 25;
      const initialHeight = Math.max(settings.cameraHeight || 5, focusPoint.y + 10);
      const initialPosition = new THREE.Vector3(
        focusPoint.x + initialDistance,
        initialHeight,
        focusPoint.z + initialDistance
      );
      camera.position.copy(initialPosition);
      
      controlsRef.current.target.copy(focusPoint);
      controlsRef.current.update();
    }
  }, [camera, settings.cameraDistance, settings.cameraHeight, focusPoint]);

  // Handle user interaction detection - SIMPLIFIED
  useEffect(() => {
    if (!controlsRef.current) return;

    const handleStart = () => {
      userInteractingRef.current = true;
      lastInteractionTimeRef.current = Date.now();
    };

    const handleEnd = () => {
      userInteractingRef.current = false;
      lastInteractionTimeRef.current = Date.now();
    };

    const controls = controlsRef.current;
    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
    };
  }, []);

  // SIMPLIFIED auto rotation - only when NOT interacting
  useFrame((state, delta) => {
    if (!controlsRef.current || !settings.cameraRotationEnabled || userInteractingRef.current) {
      return;
    }

    // Simple pause after interaction
    const timeSinceInteraction = Date.now() - lastInteractionTimeRef.current;
    if (timeSinceInteraction < 1000) { // 1 second pause
      return;
    }

    // Smooth delta for consistent animation
    const smoothDelta = Math.min(delta, 0.016);
    
    // Simple orbital rotation around focus point
    autoRotateTimeRef.current += smoothDelta * (settings.cameraRotationSpeed || 0.5);
    
    const currentOffset = new THREE.Vector3().copy(camera.position).sub(focusPoint);
    const currentSpherical = new THREE.Spherical().setFromVector3(currentOffset);
    
    // Apply rotation
    currentSpherical.theta = autoRotateTimeRef.current;
    
    // Calculate new position
    const newPosition = new THREE.Vector3().setFromSpherical(currentSpherical).add(focusPoint);
    
    // Smooth movement
    camera.position.lerp(newPosition, 0.03);
    controlsRef.current.target.lerp(focusPoint, 0.03);
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={settings.cameraEnabled !== false}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={8}
      maxDistance={300}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI - Math.PI / 6}
      enableDamping={true}
      dampingFactor={0.05}
      zoomSpeed={1.2}
      rotateSpeed={1.0}
      panSpeed={1.0}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      }}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
    />
  );
};

// IMPROVED Animation Controller with Fixed Wave Pattern Spacing
const EnhancedAnimationController: React.FC<{
  settings: ExtendedSceneSettings;
  photos: Photo[];
  onPositionsUpdate: (photos: PhotoWithPosition[]) => void;
}> = ({ settings, photos, onPositionsUpdate }) => {
  const slotManagerRef = useRef(new EnhancedSlotManager(settings.photoCount || 100));
  const lastPhotoCount = useRef(settings.photoCount || 100);
  
  const updatePositions = useCallback((time: number = 0) => {
    try {
      const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
      const slotAssignments = slotManagerRef.current.assignSlots(safePhotos);
      
      let patternState;
      try {
        // Create pattern with consistent spacing regardless of photo size
        const pattern = PatternFactory.createPattern(
          settings.animationPattern || 'grid',
          {
            ...settings,
            photoCount: settings.photoCount || 100,
            // FIXED: Ensure consistent spacing for wave pattern
            waveSpacing: Math.max(12, (settings.photoSize || 4.0) * 2.5), // Minimum spacing based on photo size
            spiralSpacing: Math.max(10, (settings.photoSize || 4.0) * 2.0), // Better spiral spacing
          },
          safePhotos
        );
        patternState = pattern.generatePositions(time);
        
        // DEBUG: Check if pattern generated the right number of positions
        const expectedSlots = settings.photoCount || 100;
        console.log(`Pattern generated ${patternState.positions.length} positions for ${expectedSlots} expected slots`);
        
        // IMPROVED: Better height adjustments for different patterns
        const floorLevel = -8; // Just above the floor at Y=-12
        const photoSize = settings.photoSize || 4.0;
        
        if (settings.animationPattern === 'spiral' || settings.animationPattern === 'wave') {
          patternState.positions = patternState.positions.map((pos, index) => {
            const [x, y, z] = pos;
            let adjustedY = y;
            
            if (settings.animationPattern === 'spiral') {
              // IMPROVED: Better spiral height management
              const heightScale = Math.max(0.4, Math.min(1.2, photoSize / 6.0));
              const baseHeight = floorLevel + (photoSize * 0.6);
              
              // Progressive height increase for better viewing
              const heightProgression = Math.sin(index * 0.1) * photoSize * 0.3;
              adjustedY = baseHeight + (y * heightScale) + heightProgression;
              
            } else if (settings.animationPattern === 'wave') {
              // FIXED: Wave pattern stays well above floor with consistent height
              const minWaveHeight = floorLevel + (photoSize * 1.2); // Start well above floor
              const waveAmplitude = Math.max(2, photoSize * 0.3); // Controlled amplitude
              
              // Ensure wave never goes below minimum height
              const waveOscillation = Math.sin(time * 0.5 + index * 0.2) * waveAmplitude;
              adjustedY = Math.max(minWaveHeight + waveOscillation, minWaveHeight);
            }
            
            return [x, adjustedY, z];
          });
        }
        
      } catch (error) {
        console.error('Pattern generation error:', error);
        // Create fallback pattern that generates the correct number of positions
        const positions = [];
        const rotations = [];
        const spacing = Math.max(8, (settings.photoSize || 4.0) * 2);
        const totalSlots = settings.photoCount || 100;
        
        for (let i = 0; i < totalSlots; i++) {
          const x = (i % 10) * spacing - (spacing * 5);
          const z = Math.floor(i / 10) * spacing - (spacing * 5);
          positions.push([x, -6, z]);
          rotations.push([0, 0, 0]);
        }
        patternState = { positions, rotations };
      }
      
      const photosWithPositions: PhotoWithPosition[] = [];
      const totalSlots = settings.photoCount || 100;
      
      // Only use positions that actually exist in the pattern
      const availablePositions = Math.min(patternState.positions.length, totalSlots);
      
      for (const photo of safePhotos) {
        const slotIndex = slotAssignments.get(photo.id);
        if (slotIndex !== undefined && slotIndex < availablePositions) {
          const aspectRatio = slotManagerRef.current.getAspectRatio(photo.id);
          const baseSize = settings.photoSize || 4.0;
          
          const computedSize = aspectRatio ? (
            aspectRatio > 1 
              ? [baseSize * aspectRatio, baseSize]
              : [baseSize, baseSize / aspectRatio]
          ) : undefined;
          
          photosWithPositions.push({
            ...photo,
            targetPosition: patternState.positions[slotIndex],
            targetRotation: patternState.rotations?.[slotIndex] || [0, 0, 0],
            displayIndex: slotIndex,
            slotIndex,
            computedSize
          });
        }
      }
      
      // Generate empty slots only for positions that exist in pattern
      for (let i = 0; i < availablePositions; i++) {
        const hasPhoto = photosWithPositions.some(p => p.slotIndex === i);
        if (!hasPhoto) {
          const baseSize = settings.photoSize || 4.0;
          
          photosWithPositions.push({
            id: `placeholder-${i}`,
            url: '',
            targetPosition: patternState.positions[i],
            targetRotation: patternState.rotations?.[i] || [0, 0, 0],
            displayIndex: i,
            slotIndex: i,
            computedSize: [baseSize * (9/16), baseSize]
          });
        }
      }
      
      // If we have fewer pattern positions than requested slots, 
      // only show the slots that fit the pattern properly
      if (availablePositions < totalSlots) {
        console.log(`Pattern only supports ${availablePositions} positions, limiting display to match pattern`);
      }
      
      photosWithPositions.sort((a, b) => a.slotIndex - b.slotIndex);
      onPositionsUpdate(photosWithPositions);
      
    } catch (error) {
      console.error('Error in updatePositions:', error);
    }
  }, [photos, settings, onPositionsUpdate]);

  useEffect(() => {
    if ((settings.photoCount || 100) !== lastPhotoCount.current) {
      slotManagerRef.current.updateSlotCount(settings.photoCount || 100);
      lastPhotoCount.current = settings.photoCount || 100;
      updatePositions(0);
    }
  }, [settings.photoCount, updatePositions]);

  useFrame((state) => {
    const time = settings.animationEnabled ? 
      state.clock.elapsedTime * ((settings.animationSpeed || 50) / 50) : 0;
    updatePositions(time);
  });

  return null;
};

const TexturedFloor: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  if (!settings.floorEnabled) return null;

  const floorTexture = useMemo(() => {
    return FloorTextureFactory.createTexture(
      settings.floorTexture || 'solid',
      1024,
      settings.customFloorTextureUrl
    );
  }, [settings.floorTexture, settings.customFloorTextureUrl]);

  const floorMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      map: floorTexture,
      color: settings.floorColor || '#FFFFFF',
      transparent: (settings.floorOpacity || 1) < 1,
      opacity: settings.floorOpacity || 1,
      metalness: Math.min(settings.floorMetalness || 0.5, 0.9),
      roughness: Math.max(settings.floorRoughness || 0.5, 0.1),
      side: THREE.DoubleSide,
      envMapIntensity: 0.5,
    });

    switch (settings.floorTexture) {
      case 'marble':
        material.metalness = 0.1;
        material.roughness = 0.2;
        break;
      case 'metal':
        material.metalness = 0.9;
        material.roughness = 0.1;
        break;
      case 'glass':
        material.metalness = 0;
        material.roughness = 0.05;
        material.transparent = true;
        material.opacity = 0.8;
        break;
      case 'wood':
        material.metalness = 0;
        material.roughness = 0.8;
        break;
    }

    return material;
  }, [settings.floorColor, settings.floorOpacity, settings.floorMetalness, settings.floorRoughness, settings.floorTexture, floorTexture]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -12, 0]}
      receiveShadow
    >
      <planeGeometry args={[settings.floorSize || 300, settings.floorSize || 300, 64, 64]} />
      <primitive object={floorMaterial} attach="material" />
    </mesh>
  );
};

// Main Enhanced CollageScene Component
const EnhancedCollageScene = forwardRef<HTMLCanvasElement, CollageSceneProps>(({ 
  photos, 
  settings, 
  width = 2560, 
  height = 1440,
  onSettingsChange 
}, ref) => {
  const [photosWithPositions, setPhotosWithPositions] = useState<PhotoWithPosition[]>([]);
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = (ref || internalCanvasRef) as React.RefObject<HTMLCanvasElement>;

  const safePhotos = Array.isArray(photos) ? photos : [];
  const safeSettings = { ...settings };

  const backgroundStyle = useMemo(() => {
    if (safeSettings.backgroundGradient) {
      return {
        background: `linear-gradient(${safeSettings.backgroundGradientAngle || 45}deg, ${safeSettings.backgroundGradientStart || '#000000'}, ${safeSettings.backgroundGradientEnd || '#000000'})`
      };
    }
    return {
      background: safeSettings.backgroundColor || '#000000'
    };
  }, [
    safeSettings.backgroundGradient,
    safeSettings.backgroundColor,
    safeSettings.backgroundGradientStart,
    safeSettings.backgroundGradientEnd,
    safeSettings.backgroundGradientAngle
  ]);

  useEffect(() => {
    return () => {
      // Cleanup function
    };
  }, []);

  return (
    <div style={backgroundStyle} className="w-full h-full">
      <Canvas
        ref={canvasRef}
        width={width}
        height={height}
        shadows={safeSettings.shadowsEnabled}
        camera={{ 
          position: [0, 5, 25], 
          fov: 75,
          near: 0.1,
          far: 2000
        }}
        gl={{ 
          antialias: true,
          alpha: safeSettings.backgroundGradient || false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={(state) => {
          state.gl.shadowMap.enabled = true;
          state.gl.shadowMap.type = THREE.PCFSoftShadowMap;
          state.gl.shadowMap.autoUpdate = true;
          
          const pixelRatio = Math.min(window.devicePixelRatio, 2);
          state.gl.setPixelRatio(pixelRatio);
          
          if (safeSettings.backgroundGradient) {
            state.gl.setClearColor('#000000', 0);
          } else {
            state.gl.setClearColor(safeSettings.backgroundColor || '#000000', 1);
          }
        }}
        performance={{ min: 0.8 }}
        linear={true}
      >
        {/* Background Management */}
        <BackgroundRenderer settings={safeSettings} />
        
        {/* IMPROVED Camera Controls with Photo Position Awareness */}
        <EnhancedCameraControls 
          settings={safeSettings} 
          photosWithPositions={photosWithPositions}
        />
        <CameraAnimationController 
          config={safeSettings.cameraAnimation} 
          photosWithPositions={photosWithPositions}
          settings={safeSettings}
        />
        
        {/* Particle System */}
        {safeSettings.particles?.enabled && (
          <MilkyWayParticleSystem
            colorTheme={getCurrentParticleTheme(safeSettings)}
            intensity={safeSettings.particles?.intensity ?? 0.7}
            enabled={safeSettings.particles?.enabled ?? true}
            photoPositions={photosWithPositions.map(p => ({ position: p.targetPosition }))}
            floorSize={safeSettings.floorSize || 200}
            gridSize={safeSettings.gridSize || 200}
          />
        )}
        
        {/* Scene Environment Manager with Wall Color Support */}
        <SceneEnvironmentManager settings={safeSettings} />
        
        {/* Enhanced Lighting */}
        <EnhancedLightingSystem settings={safeSettings} />
        
        {/* Textured Floor - Always show unless sphere environment */}
        {safeSettings.sceneEnvironment !== 'sphere' && (
          <TexturedFloor settings={safeSettings} />
        )}
        
        {/* Grid - Only show for default environment */}
        {(!safeSettings.sceneEnvironment || safeSettings.sceneEnvironment === 'default') && 
         safeSettings.gridEnabled && (
          <gridHelper
            args={[
              safeSettings.gridSize || 200,
              safeSettings.gridDivisions || 30,
              safeSettings.gridColor || '#444444',
              safeSettings.gridColor || '#444444'
            ]}
            position={[0, -11.99, 0]}
            material-opacity={safeSettings.gridOpacity || 1.0}
            material-transparent={true}
          />
        )}
        
        {/* IMPROVED Animation Controller with Better Wave Spacing */}
        <EnhancedAnimationController
          settings={safeSettings}
          photos={safePhotos}
          onPositionsUpdate={setPhotosWithPositions}
        />
        
        {/* Simple High-Performance Photo Renderer */}
        <SimplePhotoRenderer 
          photosWithPositions={photosWithPositions}
          settings={safeSettings}
        />
      </Canvas>
    </div>
  );
});

// Helper function to get current particle theme
const getCurrentParticleTheme = (settings: ExtendedSceneSettings) => {
  const themeName = settings.particles?.theme ?? 'Purple Magic';
  return PARTICLE_THEMES.find(theme => theme.name === themeName) || PARTICLE_THEMES[0];
};

EnhancedCollageScene.displayName = 'EnhancedCollageScene';
export default EnhancedCollageScene;