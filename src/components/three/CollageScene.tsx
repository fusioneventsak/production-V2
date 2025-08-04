// Enhanced CollageScene with WORKING Camera Systems and FIXED Pattern Spacing + Camera Fine-tuning
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

// Photo position interface for cinematic camera
interface PhotoPosition {
  position: [number, number, number];
  slotIndex: number;
  id: string;
}

// FIXED: Extended settings interface that matches your project's pattern structure
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
  
  // FIXED: Enhanced Cinematic Camera Animation Settings with fine-tuning controls
  cameraAnimation?: {
    enabled?: boolean;
    type: 'none' | 'showcase' | 'gallery_walk' | 'spiral_tour' | 'wave_follow' | 'grid_sweep' | 'photo_focus';
    speed: number;
    focusDistance: number;
    heightOffset: number;
    transitionTime: number;
    pauseTime: number;
    randomization: number;
    // NEW: Fine-tuning controls
    baseHeight?: number;        // Base camera height for all animations
    baseDistance?: number;      // Base distance from center for all animations
    heightVariation?: number;   // How much height varies during animation
    distanceVariation?: number; // How much distance varies during animation
  };
  
  // ENHANCED: Pattern-specific settings that match your existing structure
  patterns?: {
    grid?: {
      enabled?: boolean;
      photoCount?: number;
      aspectRatio?: number;     // Grid aspect ratio (width/height) - supports 1:1, 4:3, 16:9, 21:9, custom
      spacing?: number;         // Space between photos (0 = solid wall, 0.5 = 100% gaps, 1 = 200% gaps)
      wallHeight?: number;      // Height offset from floor
    };
    wave?: {
      enabled?: boolean;
      photoCount?: number;
      amplitude?: number;
      frequency?: number;
      spacing?: number;
    };
    spiral?: {
      enabled?: boolean;
      photoCount?: number;
      radius?: number;
      heightStep?: number;
      spacing?: number;
    };
    float?: {
      enabled?: boolean;
      photoCount?: number;
      height?: number;
      spread?: number;
      spacing?: number;
    };
  };
  
  // Legacy grid settings for backward compatibility
  gridAspectRatio?: number;
  gridAspectRatioPreset?: '1:1' | '4:3' | '16:9' | '21:9' | 'custom';
  photoSpacing?: number; // Legacy spacing setting
  
  // Auto-Rotate Camera Settings
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

// ENHANCED GRID PATTERN - True edge-to-edge solid wall with configurable spacing and aspect ratio
class EnhancedGridPattern {
  constructor(private settings: any) {}

  generatePositions(time: number) {
    const positions: any[] = [];
    const rotations: [number, number, number][] = [];

    // Use pattern-specific photoCount if available
    const photoCount = this.settings.patterns?.grid?.photoCount !== undefined 
      ? this.settings.patterns.grid.photoCount 
      : this.settings.photoCount;
    
    const totalPhotos = Math.min(Math.max(photoCount, 1), 500);
    const photoSize = this.settings.photoSize || 4.0;
    
    // Grid aspect ratio and spacing settings from pattern-specific config
    const aspectRatio = this.settings.patterns?.grid?.aspectRatio || this.settings.gridAspectRatio || 1.777778; // 16:9 default
    const spacingPercentage = this.settings.patterns?.grid?.spacing !== undefined 
      ? this.settings.patterns.grid.spacing 
      : (this.settings.photoSpacing || 0); // 0 to 1 (0% to 100%)
    const wallHeight = this.settings.patterns?.grid?.wallHeight || this.settings.wallHeight || 0;
    
    // Calculate grid dimensions based on aspect ratio
    const columns = Math.ceil(Math.sqrt(totalPhotos * aspectRatio));
    const rows = Math.ceil(totalPhotos / columns);
    
    // SOLID WALL SPACING: True edge-to-edge when spacing is 0, equal spacing when spacing > 0
    let horizontalSpacing, verticalSpacing;
    
    if (spacingPercentage === 0) { 
      // SOLID WALL: Photos touch edge-to-edge with NO gaps or overlaps
      horizontalSpacing = photoSize * 0.562; // 56.2% = exact edge-to-edge for 16:9 photos
      verticalSpacing = photoSize;           // Full photo height = no vertical overlap
    } else {
      // SPACED WALL: Equal gaps between photos horizontally and vertically
      const gapSize = spacingPercentage * photoSize * 2; // Wide range: 0 to 200% of photo size
      
      // Apply IDENTICAL spacing calculation for both directions
      horizontalSpacing = photoSize + gapSize;  // photoSize + equal gap
      verticalSpacing = photoSize + gapSize;    // photoSize + equal gap (same calculation)
    }
    
    // Calculate total wall dimensions
    const totalWallWidth = (columns - 1) * horizontalSpacing;
    const totalWallHeight = (rows - 1) * verticalSpacing;
    
    // Wall positioning
    const floorHeight = -12;
    const gridBaseHeight = floorHeight + photoSize * 0.6 + wallHeight;
    
    // Center the wall
    const startX = -totalWallWidth / 2;
    const startZ = -totalWallHeight / 2;
    
    // Animation settings
    const speed = this.settings.animationSpeed / 100;
    const animationTime = this.settings.animationEnabled ? time * speed : 0;
    
    // Generate positions in grid layout
    for (let i = 0; i < totalPhotos; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      const x = startX + col * horizontalSpacing;
      const z = startZ + row * verticalSpacing;
      
      // Base Y position
      let y = gridBaseHeight;
      
      // Add subtle animation if enabled
      if (this.settings.animationEnabled && spacingPercentage > 0) {
        // Only animate spaced walls to avoid breaking solid wall alignment
        const heightVariation = Math.sin(animationTime * 0.5 + i * 0.3) * (photoSize * 0.05);
        y += heightVariation;
      }
      
      positions.push([x, y, z]);
      
      // Rotation settings
      if (this.settings.photoRotation && this.settings.animationEnabled && spacingPercentage > 0) {
        // Only animate spaced walls to maintain solid wall appearance
        const rotationY = Math.sin(animationTime * 0.2 + i * 0.1) * 0.03;
        const rotationX = Math.cos(animationTime * 0.3 + i * 0.2) * 0.01;
        rotations.push([rotationX, rotationY, 0]);
      } else {
        rotations.push([0, 0, 0]);
      }
    }
    
    console.log(`🧱 Grid Wall: ${columns}x${rows} (${totalPhotos} photos) - AspectRatio: ${aspectRatio.toFixed(2)} - ${spacingPercentage === 0 ? 'SOLID WALL' : `${(spacingPercentage * 200).toFixed(0)}% gaps`}`);
    
    return { positions, rotations };
  }
}

// COMPLETELY REDESIGNED WAVE PATTERN - Ultra-smooth organic undulation with multiple harmonics
class FixedWavePattern {
  constructor(private settings: any) {}

  generatePositions(time: number) {
    const positions: any[] = [];
    const rotations: [number, number, number][] = [];

    const photoCount = this.settings.patterns?.wave?.photoCount !== undefined 
      ? this.settings.patterns.wave.photoCount 
      : this.settings.photoCount;
    
    // Much better spacing that spreads photos out more naturally
    const photoSize = this.settings.photoSize || 4;
    const baseSpacing = Math.max(15, photoSize * 3.0); // Even wider spacing
    const spacingMultiplier = 1 + (this.settings.patterns?.wave?.spacing || 0.2);
    const finalSpacing = baseSpacing * spacingMultiplier;
    
    const totalPhotos = Math.min(Math.max(photoCount, 1), 500);
    
    // Calculate grid dimensions for spread out arrangement
    const columns = Math.ceil(Math.sqrt(totalPhotos * 1.4)); // Wider grid
    const rows = Math.ceil(totalPhotos / columns);
    
    const speed = this.settings.animationSpeed / 50;
    const wavePhase = time * speed * 0.6; // Slower, more organic
    
    // MUCH HIGHER floating range - never touch the floor
    const floorHeight = -12;
    const minFloatHeight = 12; // MUCH higher minimum - well above floor
    const maxFloatHeight = 25; // Higher ceiling for dramatic undulation
    const midHeight = (minFloatHeight + maxFloatHeight) / 2;
    
    for (let i = 0; i < totalPhotos; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      // Base positions with organic offset
      let x = (col - columns / 2) * finalSpacing;
      let z = (row - rows / 2) * finalSpacing;
      
      // Add subtle randomness to avoid perfect grid
      x += (Math.sin(i * 0.7) * 0.5 + Math.cos(i * 1.3) * 0.3) * finalSpacing * 0.2;
      z += (Math.cos(i * 0.8) * 0.5 + Math.sin(i * 1.1) * 0.3) * finalSpacing * 0.2;
      
      // Base amplitude that can be controlled
      const amplitude = Math.min(this.settings.patterns?.wave?.amplitude || 6, photoSize * 2.0);
      const frequency = this.settings.patterns?.wave?.frequency || 0.08; // Much lower for broader waves
      
      let y = midHeight; // Start from middle of floating range
      
      if (this.settings.animationEnabled) {
        // MULTIPLE OVERLAPPING SINE WAVES for ultra-smooth organic motion
        
        // Primary X-direction wave - main rolling motion
        const primaryWave = Math.sin(x * frequency - wavePhase) * amplitude;
        
        // Secondary Z-direction wave - perpendicular undulation
        const secondaryWave = Math.sin(z * frequency * 0.8 + wavePhase * 0.7) * amplitude * 0.6;
        
        // Diagonal wave - creates natural cross-patterns
        const diagonalWave = Math.sin((x + z) * frequency * 0.5 - wavePhase * 1.2) * amplitude * 0.4;
        
        // Radial wave from center - gentle ripples emanating outward
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const radialWave = Math.sin(distanceFromCenter * frequency * 0.3 - wavePhase * 0.8) * amplitude * 0.5;
        
        // Circular wave - rotational component
        const angle = Math.atan2(z, x);
        const circularWave = Math.sin(angle * 3 + wavePhase * 0.4) * amplitude * 0.3;
        
        // High-frequency detail wave - adds surface texture
        const detailWave = Math.sin(x * frequency * 3 - wavePhase * 2.5) * Math.cos(z * frequency * 2.5 + wavePhase * 1.8) * amplitude * 0.2;
        
        // Temporal breathing wave - overall rise and fall
        const breathingWave = Math.sin(wavePhase * 0.3) * amplitude * 0.7;
        
        // Individual photo variation - each photo has slightly different motion
        const photoSeed = (Math.sin(i * 0.618) + 1) / 2; // Golden ratio for natural distribution
        const personalWave = Math.sin(wavePhase * 0.9 + photoSeed * Math.PI * 2) * amplitude * 0.3;
        
        // Combine all waves with different weights for natural motion
        const totalWaveHeight = 
          primaryWave * 1.0 +      // Main wave
          secondaryWave * 0.8 +    // Cross wave
          diagonalWave * 0.6 +     // Diagonal component
          radialWave * 0.7 +       // Radial ripples
          circularWave * 0.4 +     // Rotational component
          detailWave * 0.3 +       // Surface detail
          breathingWave * 0.5 +    // Overall breathing
          personalWave * 0.4;      // Individual variation
        
        y += totalWaveHeight;
        
        // CRITICAL: Ensure photos NEVER go below minimum height - always floating
        y = Math.max(y, minFloatHeight);
        
        // Also cap at maximum height to keep in view
        y = Math.min(y, maxFloatHeight);
      }
      
      positions.push([x, y, z]);

      if (this.settings.photoRotation) {
        // Organic rotation that follows the wave motion
        const waveInfluence = (y - midHeight) / amplitude; // How much the wave affects rotation
        
        // Gentle tilting that follows wave slopes
        const rotationX = Math.sin(wavePhase * 0.4 + x * frequency * 0.4) * 0.08 * waveInfluence;
        const rotationZ = Math.cos(wavePhase * 0.4 + z * frequency * 0.4) * 0.08 * waveInfluence;
        
        // Base rotation toward camera with wave variation
        const baseAngle = Math.atan2(x, z);
        const rotationY = baseAngle + Math.sin(wavePhase * 0.3 + i * 0.1) * 0.2;
        
        rotations.push([rotationX, rotationY, rotationZ]);
      } else {
        rotations.push([0, 0, 0]);
      }
    }

    return { positions, rotations };
  }
}

// FIXED SPIRAL PATTERN - TALLER cyclone with better distribution and some randomness
class FixedSpiralPattern {
  constructor(private settings: any) {}

  generatePositions(time: number) {
    const positions: any[] = [];
    const rotations: [number, number, number][] = [];

    const photoCount = this.settings.patterns?.spiral?.photoCount !== undefined 
      ? this.settings.patterns.spiral.photoCount 
      : this.settings.photoCount;
    
    // FIXED: Support up to 500 photos efficiently
    const totalPhotos = Math.min(Math.max(photoCount, 1), 500);
    const speed = this.settings.animationSpeed / 50;
    const animationTime = time * speed * 2;
    
    // FIXED: MUCH TALLER spiral parameters for better visibility
    const photoSize = this.settings.photoSize || 4;
    const baseRadius = Math.max(8, photoSize * 1.5); // Reasonable minimum radius
    const maxRadius = Math.max(50, photoSize * 10); // Even wider spread
    const maxHeight = Math.max(60, photoSize * 12); // MUCH TALLER - doubled the height
    const rotationSpeed = 0.6;
    const orbitalChance = 0.25; // Slightly more orbital photos for area filling
    
    // FIXED: Proper hover height - well above floor
    const floorHeight = -12;
    const hoverHeight = 5; // Slightly higher hover
    const baseHeight = floorHeight + photoSize + hoverHeight; // Hover above floor
    
    // FIXED: BETTER vertical distribution - less bottom-heavy, more spread out
    const verticalBias = 0.4; // MUCH less bias toward bottom (was 0.7)
    const heightStep = this.settings.patterns?.spiral?.heightStep || 0.8; // Taller steps between layers
    
    for (let i = 0; i < totalPhotos; i++) {
      // Generate random but consistent values for each photo
      const randomSeed1 = Math.sin(i * 0.73) * 0.5 + 0.5;
      const randomSeed2 = Math.cos(i * 1.37) * 0.5 + 0.5;
      const randomSeed3 = Math.sin(i * 2.11) * 0.5 + 0.5;
      const randomSeed4 = Math.sin(i * 3.17) * 0.5 + 0.5; // Additional randomness
      
      // Determine if this photo is on the main funnel or an outer orbit
      const isOrbital = randomSeed1 < orbitalChance;
      
      // FIXED: Better height distribution - more spread throughout the height
      let normalizedHeight = Math.pow(randomSeed2, verticalBias);
      
      // ADD RANDOMNESS: Some photos get random height boosts for better filling
      if (randomSeed4 > 0.7) {
        normalizedHeight = Math.min(1.0, normalizedHeight + (randomSeed4 - 0.7) * 1.5); // Random height boost
      }
      
      // Apply height step to create taller spiral layers
      const y = baseHeight + normalizedHeight * maxHeight * heightStep;
      
      // Calculate radius at this height (funnel shape)
      const funnelRadius = baseRadius + (maxRadius - baseRadius) * normalizedHeight;
      
      let radius: number;
      let angleOffset: number;
      let verticalWobble: number = 0;
      
      if (isOrbital) {
        // Orbital photos - farther out with more randomness for area filling
        const orbitalVariation = 1.3 + randomSeed3 * 1.0; // More variation (was 0.8)
        radius = funnelRadius * orbitalVariation;
        angleOffset = randomSeed3 * Math.PI * 2; // Random starting angle
        
        // ADD RANDOMNESS: Some orbital photos get random radius boosts
        if (randomSeed4 > 0.6) {
          radius *= (1.0 + (randomSeed4 - 0.6) * 1.5); // Random radius boost
        }
        
        // Add vertical oscillation for orbital photos
        if (this.settings.animationEnabled) {
          verticalWobble = Math.sin(animationTime * 2 + i) * 4; // Slightly more wobble
        }
      } else {
        // Main funnel photos with some randomness
        const radiusVariation = 0.7 + randomSeed3 * 0.6; // More variation (was 0.8 to 1.2)
        radius = funnelRadius * radiusVariation;
        angleOffset = randomSeed4 * 0.5; // Small random angle offset
        
        // ADD RANDOMNESS: Some main photos get scattered for filling
        if (randomSeed4 > 0.8) {
          radius *= (1.0 + (randomSeed4 - 0.8) * 2.0); // Scatter some photos further
        }
      }
      
      // Calculate angle with height-based rotation speed
      // Photos at the bottom rotate slower, creating a realistic vortex effect
      const heightSpeedFactor = 0.3 + normalizedHeight * 0.7; // Slower at bottom
      const angle = this.settings.animationEnabled ?
        (animationTime * rotationSpeed * heightSpeedFactor + angleOffset + (i * 0.05)) :
        (angleOffset + (i * 0.1));
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const finalY = y + verticalWobble;
      
      positions.push([x, finalY, z]);
      
      // FIXED: Photos should face camera in spiral pattern for better visibility
      if (this.settings.photoRotation) {
        // Add subtle animation while letting camera-facing handle main orientation
        const rotX = Math.sin(animationTime * 0.4 + i * 0.1) * 0.02;
        const rotY = 0; // Let camera-facing handle Y rotation
        const rotZ = Math.cos(animationTime * 0.4 + i * 0.1) * 0.02;
        rotations.push([rotX, rotY, rotZ]);
      } else {
        rotations.push([0, 0, 0]); // No rotation - pure camera facing
      }
    }

    return { positions, rotations };
  }
}

// SIMPLE AUTO-ROTATE CAMERA - Actually works with all settings
const AutoRotateCamera: React.FC<{
  settings: ExtendedSceneSettings;
}> = ({ settings }) => {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const heightTimeRef = useRef(0);
  const distanceTimeRef = useRef(0);
  const verticalDriftTimeRef = useRef(0);

  useFrame((state, delta) => {
    // Only run if auto-rotate is enabled AND cinematic is disabled
    const cinematicActive = settings.cameraAnimation?.enabled && settings.cameraAnimation.type !== 'none';
    
    if (!settings.cameraRotationEnabled || cinematicActive) {
      return;
    }

    // Update all time counters
    const speed = settings.cameraAutoRotateSpeed || settings.cameraRotationSpeed || 0.5;
    timeRef.current += delta * speed;
    heightTimeRef.current += delta * (settings.cameraAutoRotateElevationSpeed || 0.3);
    distanceTimeRef.current += delta * (settings.cameraAutoRotateDistanceSpeed || 0.2);
    verticalDriftTimeRef.current += delta * (settings.cameraAutoRotateVerticalDriftSpeed || 0.1);
    
    // Base settings
    const baseRadius = settings.cameraAutoRotateRadius || settings.cameraDistance || 25;
    const baseHeight = settings.cameraAutoRotateHeight || settings.cameraHeight || 8;
    
    // Distance variation
    const radiusVariation = settings.cameraAutoRotateDistanceVariation || 0;
    const radius = baseRadius + Math.sin(distanceTimeRef.current) * radiusVariation;
    
    // Height oscillation between min and max elevation
    const elevationMin = settings.cameraAutoRotateElevationMin || (Math.PI / 6);
    const elevationMax = settings.cameraAutoRotateElevationMax || (Math.PI / 3);
    const elevationRange = elevationMax - elevationMin;
    const elevationOscillation = (Math.sin(heightTimeRef.current) + 1) / 2; // 0 to 1
    const phi = elevationMin + (elevationOscillation * elevationRange);
    
    // Calculate spherical position
    const x = radius * Math.sin(phi) * Math.cos(timeRef.current);
    const y = baseHeight + Math.cos(phi) * radius * 0.2;
    const z = radius * Math.sin(phi) * Math.sin(timeRef.current);
    
    // Vertical drift
    const verticalDrift = settings.cameraAutoRotateVerticalDrift || 0;
    const driftOffset = Math.sin(verticalDriftTimeRef.current) * verticalDrift;
    
    // Focus offset
    const focusOffset = settings.cameraAutoRotateFocusOffset || [0, 0, 0];
    const focusPoint = new THREE.Vector3(
      focusOffset[0],
      focusOffset[1] + driftOffset,
      focusOffset[2]
    );
    
    // Set camera position and look at focus point
    camera.position.set(x + focusPoint.x, y + focusPoint.y, z + focusPoint.z);
    camera.lookAt(focusPoint.x, focusPoint.y, focusPoint.z);
  });

  return null;
};

// FIXED: Enhanced Cinematic Camera with SMOOTH RESUMPTION and AUTOMATIC PATTERN TRANSITIONS
const CinematicCamera: React.FC<{
  config?: {
    enabled?: boolean;
    type: 'none' | 'showcase' | 'gallery_walk' | 'spiral_tour' | 'wave_follow' | 'grid_sweep' | 'photo_focus';
    speed: number;
    focusDistance: number;
    heightOffset: number;
    transitionTime: number;
    pauseTime: number;
    randomization: number;
    // Fine-tuning controls
    baseHeight?: number;
    baseDistance?: number;
    heightVariation?: number;
    distanceVariation?: number;
  };
  photoPositions: PhotoPosition[];
  settings: ExtendedSceneSettings;
}> = ({ config, photoPositions, settings }) => {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const userInteractingRef = useRef(false);
  const lastInteractionRef = useRef(0);
  const resumeTimeRef = useRef(0);
  const wasActiveRef = useRef(false);
  
  // FIXED: Add state for smooth resumption
  const pausedPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const pausedLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const timeOffsetRef = useRef(0);
  const isResumingRef = useRef(false);
  const resumeStartTimeRef = useRef(0);
  
  // FIXED: Add state for automatic pattern transitions
  const lastPatternRef = useRef<string>('');
  const lastAnimationPatternRef = useRef<string>('');
  const isPatternTransitioningRef = useRef(false);
  const patternTransitionStartRef = useRef(0);
  const patternStartPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const patternStartLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // FIXED: Restored and improved user interaction detection
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    let interactionTimeout: NodeJS.Timeout;

    const handleInteractionStart = (e: Event) => {
      // Detect actual user interactions on the canvas
      if (e.isTrusted && (e.target === canvas || canvas.contains(e.target as Node))) {
        if (!userInteractingRef.current) {
          // FIXED: Capture current camera state when interaction starts
          pausedPositionRef.current.copy(camera.position);
          pausedLookAtRef.current.set(0, 0, 0); // Will be calculated from camera direction
          
          // Calculate where camera is looking by using camera's direction
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);
          pausedLookAtRef.current.addVectors(camera.position, direction.multiplyScalar(50));
          
          console.log('🎬 User interaction START - capturing position:', {
            x: pausedPositionRef.current.x.toFixed(2),
            y: pausedPositionRef.current.y.toFixed(2), 
            z: pausedPositionRef.current.z.toFixed(2)
          });
        }
        
        userInteractingRef.current = true;
        lastInteractionRef.current = Date.now();
        clearTimeout(interactionTimeout);
      }
    };

    const handleInteractionEnd = (e: Event) => {
      if (e.isTrusted && (e.target === canvas || canvas.contains(e.target as Node))) {
        lastInteractionRef.current = Date.now();
        clearTimeout(interactionTimeout);
        
        // Shorter delay before resuming based on user setting
        const pauseTime = Math.max((config?.pauseTime || 1) * 1000, 800);
        interactionTimeout = setTimeout(() => {
          // FIXED: Start smooth resumption process
          userInteractingRef.current = false;
          resumeTimeRef.current = Date.now();
          resumeStartTimeRef.current = Date.now();
          isResumingRef.current = true;
          
          // Update paused position to current camera position at end of interaction
          pausedPositionRef.current.copy(camera.position);
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);
          pausedLookAtRef.current.addVectors(camera.position, direction.multiplyScalar(50));
          
          console.log('🎬 Starting SMOOTH resumption from position:', {
            x: pausedPositionRef.current.x.toFixed(2),
            y: pausedPositionRef.current.y.toFixed(2),
            z: pausedPositionRef.current.z.toFixed(2)
          });
        }, pauseTime);
      }
    };

    // Listen to more interaction types for better detection
    canvas.addEventListener('mousedown', handleInteractionStart, { passive: true });
    canvas.addEventListener('touchstart', handleInteractionStart, { passive: true });
    canvas.addEventListener('wheel', handleInteractionStart, { passive: true });
    canvas.addEventListener('mouseup', handleInteractionEnd, { passive: true });
    canvas.addEventListener('touchend', handleInteractionEnd, { passive: true });
    canvas.addEventListener('mousemove', handleInteractionStart, { passive: true }); // Added mouse move
    canvas.addEventListener('touchmove', handleInteractionStart, { passive: true }); // Added touch move

    // Also listen for keyboard interactions
    document.addEventListener('keydown', handleInteractionStart, { passive: true });

    return () => {
      clearTimeout(interactionTimeout);
      canvas.removeEventListener('mousedown', handleInteractionStart);
      canvas.removeEventListener('touchstart', handleInteractionStart);
      canvas.removeEventListener('wheel', handleInteractionStart);
      canvas.removeEventListener('mouseup', handleInteractionEnd);
      canvas.removeEventListener('touchend', handleInteractionEnd);
      canvas.removeEventListener('mousemove', handleInteractionStart);
      canvas.removeEventListener('touchmove', handleInteractionStart);
      document.removeEventListener('keydown', handleInteractionStart);
    };
  }, [config?.pauseTime]);

  useFrame((state, delta) => {
    if (!config?.enabled || config.type === 'none' || !photoPositions.length) {
      if (wasActiveRef.current) {
        console.log('🎬 Cinematic camera disabled');
        wasActiveRef.current = false;
      }
      return;
    }

    // FIXED: Detect pattern changes and start smooth transitions
    const currentPattern = config.type;
    const currentAnimationPattern = settings.animationPattern || 'grid';
    const patternKey = `${currentPattern}-${currentAnimationPattern}`;
    
    if (lastPatternRef.current !== '' && lastPatternRef.current !== patternKey) {
      // Pattern changed! Start smooth transition
      console.log(`🎬 PATTERN CHANGE detected: ${lastPatternRef.current} → ${patternKey}`);
      
      isPatternTransitioningRef.current = true;
      patternTransitionStartRef.current = Date.now();
      
      // Capture current camera state as starting point for transition
      patternStartPositionRef.current.copy(camera.position);
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      patternStartLookAtRef.current.addVectors(camera.position, direction.multiplyScalar(50));
      
      console.log('🎬 Starting pattern transition from:', {
        x: patternStartPositionRef.current.x.toFixed(2),
        y: patternStartPositionRef.current.y.toFixed(2),
        z: patternStartPositionRef.current.z.toFixed(2)
      });
    }
    
    lastPatternRef.current = patternKey;

    // FIXED: Better pause logic with smooth resumption
    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const resumeDelay = Math.max((config.pauseTime || 1) * 1000, 800);
    const timeSinceResume = Date.now() - resumeTimeRef.current;

    // Pause during interaction or right after
    if (userInteractingRef.current || (timeSinceInteraction < resumeDelay && timeSinceResume < 300)) {
      if (wasActiveRef.current) {
        console.log('🎬 Cinematic camera paused for user interaction');
        wasActiveRef.current = false;
      }
      return;
    }

    if (!wasActiveRef.current) {
      console.log('🎬 Cinematic camera resumed with smooth transition');
      wasActiveRef.current = true;
    }

    const validPhotos = photoPositions.filter(p => !p.id.startsWith('placeholder-'));
    if (!validPhotos.length) return;

    // FIXED: Pattern-specific speed adjustments to reduce conflicts
    const getPatternSpeed = () => {
      switch (settings.animationPattern) {
        case 'spiral':
          return 0.15; // MUCH slower for spiral to avoid conflicts
        case 'wave':
          return 0.2; // Slower for wave
        case 'float':
          return 0.3; // Normal speed for float (works great)
        default:
          return 0.25;
      }
    };

    const speed = (config.speed || 1.0) * getPatternSpeed();
    timeRef.current += delta * speed;

    // Use fine-tuning controls with MUCH better pattern-aware defaults
    const photoSize = settings.photoSize || 4;
    const floorHeight = -12;
    const photoDisplayHeight = floorHeight + photoSize;
    
    // FIXED: Much better pattern-aware defaults, especially for wave
    const getPatternAwareDefaults = () => {
      switch (settings.animationPattern) {
        case 'spiral':
          return {
            height: Math.max(35, photoDisplayHeight + photoSize * 8), // MUCH higher for spiral
            distance: Math.max(60, photoSize * 15), // MUCH further from spiral center
            heightVar: photoSize * 0.5, // Minimal height variation
            distanceVar: 5, // Minimal distance variation to reduce jitter
          };
        case 'wave':
          return {
            // FIXED: Much lower height for wave - human perspective, not bird's eye
            height: Math.max(8, photoDisplayHeight + photoSize * 1.5), // Much lower - at photo level
            distance: Math.max(20, photoSize * 5), // Closer to photos for better viewing
            heightVar: photoSize * 0.8, // Moderate height variation
            distanceVar: 8, // Moderate distance variation
          };
        case 'float':
          return {
            height: Math.max(18, photoDisplayHeight + photoSize * 3.5),
            distance: Math.max(30, photoSize * 8),
            heightVar: photoSize * 1.5,
            distanceVar: 12,
          };
        default: // grid
          return {
            height: Math.max(15, photoDisplayHeight + photoSize * 2.5),
            distance: Math.max(25, photoSize * 7),
            heightVar: photoSize * 1.2,
            distanceVar: 10,
          };
      }
    };

    const patternDefaults = getPatternAwareDefaults();
    
    const baseHeight = config.baseHeight !== undefined ? 
      config.baseHeight : patternDefaults.height;
    const baseDistance = config.baseDistance !== undefined ? 
      config.baseDistance : patternDefaults.distance;
    const heightVariation = config.heightVariation !== undefined ? 
      config.heightVariation : patternDefaults.heightVar;
    const distanceVariation = config.distanceVariation !== undefined ? 
      config.distanceVariation : patternDefaults.distanceVar;

    // Better center calculation
    let centerX = 0, centerZ = 0;
    if (validPhotos.length > 0) {
      centerX = validPhotos.reduce((sum, p) => sum + p.position[0], 0) / validPhotos.length;
      centerZ = validPhotos.reduce((sum, p) => sum + p.position[2], 0) / validPhotos.length;
    }

    let x, y, z, lookX, lookY, lookZ;

    // FIXED: Calculate the "ideal" animation position based on current time
    // This is where the camera would be if there was no interruption
    switch (config.type) {
      case 'showcase':
        const fig8Time = timeRef.current * 0.4;
        const fig8Radius = baseDistance * (0.8 + Math.sin(fig8Time * 0.1) * 0.1);
        
        x = centerX + Math.sin(fig8Time) * fig8Radius;
        y = baseHeight + Math.sin(fig8Time * 1.1) * heightVariation * 0.4;
        z = centerZ + Math.sin(fig8Time * 2) * fig8Radius * 0.7;
        
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
        break;

      case 'gallery_walk':
        const walkTime = (timeRef.current * 0.25) % 4;
        const walkRadius = baseDistance * 0.8;
        
        // Smooth rounded rectangle path
        const angle = (walkTime / 4) * Math.PI * 2;
        x = centerX + walkRadius * Math.cos(angle);
        z = centerZ + walkRadius * Math.sin(angle) * 0.7;
        y = baseHeight + Math.sin(timeRef.current * 0.2) * heightVariation * 0.3;
        
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
        break;

      case 'spiral_tour':
        // FIXED: Completely reworked for spiral pattern - high orbit camera
        const spiralTime = timeRef.current * 0.2; // Very slow
        
        // High orbital view that doesn't interfere with spiral photos
        const orbitRadius = baseDistance; // Keep consistent distance
        const orbitHeight = baseHeight; // Stay high above spiral
        
        // Simple circular orbit high above the spiral
        x = centerX + Math.cos(spiralTime) * orbitRadius;
        y = orbitHeight + Math.sin(spiralTime * 0.1) * (heightVariation * 0.2); // Minimal height change
        z = centerZ + Math.sin(spiralTime) * orbitRadius * 0.9;
        
        // Always look down at spiral center
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 2; // Look down into spiral
        lookZ = centerZ;
        break;

      case 'wave_follow':
        // FIXED: Much better wave camera - human perspective at photo level
        const waveTime = timeRef.current * 0.3;
        const waveRadius = baseDistance * (0.9 + Math.sin(waveTime * 0.2) * 0.1);
        
        // Camera follows wave motion at human eye level
        x = centerX + Math.sin(waveTime) * waveRadius;
        y = baseHeight + Math.sin(waveTime * 1.1) * heightVariation * 0.4; // Gentle bobbing motion
        z = centerZ + Math.cos(waveTime * 0.7) * waveRadius * 0.6;
        
        // FIXED: Look at photos at their level, not down from above
        lookX = centerX + Math.sin(waveTime + 0.3) * waveRadius * 0.2; // Look slightly ahead
        lookY = photoDisplayHeight + photoSize * 0.3; // Look at photo level, not down
        lookZ = centerZ + Math.cos(waveTime * 0.7 + 0.3) * waveRadius * 0.1;
        break;

      case 'grid_sweep':
        const sweepTime = (timeRef.current * 0.2) % 6;
        const sweepRadius = baseDistance * 0.75;
        
        if (sweepTime < 2) {
          const t = sweepTime / 2;
          x = centerX + (t * 2 - 1) * sweepRadius;
          z = centerZ + sweepRadius * 0.6;
        } else if (sweepTime < 4) {
          const t = (sweepTime - 2) / 2;
          x = centerX + (1 - t * 2) * sweepRadius;
          z = centerZ - sweepRadius * 0.6;
        } else {
          const t = (sweepTime - 4) / 2;
          x = centerX - sweepRadius + t * sweepRadius * 0.4;
          z = centerZ + (sweepRadius * 0.6) * (1 - t * 2);
        }
        
        y = baseHeight + Math.sin(sweepTime * 0.3) * heightVariation * 0.2;
        
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
        break;

      case 'photo_focus':
        const focusTime = timeRef.current * 0.4;
        const focusRadius = baseDistance * 0.7;
        
        const scale = focusRadius / (1 + Math.sin(focusTime) ** 2 * 0.3);
        x = centerX + scale * Math.cos(focusTime);
        y = baseHeight + Math.sin(focusTime * 0.8) * heightVariation * 0.3;
        z = centerZ + scale * Math.sin(focusTime) * Math.cos(focusTime);
        
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
        break;

      default:
        x = centerX + Math.cos(timeRef.current * 0.3) * baseDistance;
        y = baseHeight;
        z = centerZ + Math.sin(timeRef.current * 0.3) * baseDistance;
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
    }

    // Ensure reasonable bounds
    y = Math.max(y, photoDisplayHeight + 2);
    lookY = Math.max(lookY, photoDisplayHeight);

    // FIXED: SMOOTH RESUMPTION and AUTOMATIC PATTERN TRANSITIONS
    const targetPos = new THREE.Vector3(x, y, z);
    const targetLook = new THREE.Vector3(lookX, lookY, lookZ);
    
    // PRIORITY 1: Handle pattern transitions (takes precedence over user resumption)
    const patternTransitionTime = 2500; // 2.5 seconds for pattern transitions
    const timeSincePatternChange = Date.now() - patternTransitionStartRef.current;
    
    if (isPatternTransitioningRef.current && timeSincePatternChange < patternTransitionTime) {
      // SMOOTH PATTERN TRANSITION: Blend from old pattern position to new pattern position
      const blendFactor = Math.min(timeSincePatternChange / patternTransitionTime, 1);
      
      // Use easeInOutCubic for smooth acceleration/deceleration
      const easeInOutCubic = (t: number) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
      const smoothBlend = easeInOutCubic(blendFactor);
      
      // Interpolate from pattern start position to current target
      const blendedPos = new THREE.Vector3().lerpVectors(patternStartPositionRef.current, targetPos, smoothBlend);
      const blendedLook = new THREE.Vector3().lerpVectors(patternStartLookAtRef.current, targetLook, smoothBlend);
      
      // Apply the blended position
      camera.position.copy(blendedPos);
      camera.lookAt(blendedLook);
      
      // End pattern transition when complete
      if (blendFactor >= 1) {
        isPatternTransitioningRef.current = false;
        console.log('🎬 Pattern transition completed - now following new pattern');
      } else {
        console.log(`🎬 Pattern transition: ${(blendFactor * 100).toFixed(1)}% complete`);
      }
      
      return; // Skip other transition logic during pattern transition
    }
    
    // PRIORITY 2: Handle user interaction resumption
    const resumeTransitionTime = 3000; // 3 seconds to smoothly transition back
    const timeSinceResumeStart = Date.now() - resumeStartTimeRef.current;
    
    if (isResumingRef.current && timeSinceResumeStart < resumeTransitionTime) {
      // SMOOTH USER RESUMPTION: Blend from paused position to target position
      const blendFactor = Math.min(timeSinceResumeStart / resumeTransitionTime, 1);
      
      // Use easeInOutCubic for smooth acceleration/deceleration
      const easeInOutCubic = (t: number) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
      const smoothBlend = easeInOutCubic(blendFactor);
      
      // Interpolate position
      const blendedPos = new THREE.Vector3().lerpVectors(pausedPositionRef.current, targetPos, smoothBlend);
      const blendedLook = new THREE.Vector3().lerpVectors(pausedLookAtRef.current, targetLook, smoothBlend);
      
      // Apply the blended position
      camera.position.copy(blendedPos);
      camera.lookAt(blendedLook);
      
      // End resumption phase when transition is complete
      if (blendFactor >= 1) {
        isResumingRef.current = false;
        console.log('🎬 Smooth user resumption completed - back to normal cinematic mode');
      } else {
        console.log(`🎬 User resuming: ${(blendFactor * 100).toFixed(1)}% complete`);
      }
    } else {
      // NORMAL CINEMATIC MODE: Use regular smooth movement
      const resumeBlend = Math.min((timeSinceResume) / 1000, 1); // 1 second blend-in
      const smoothFactor = 0.035 * Math.max(resumeBlend, 0.3); // Always have some smoothing
      
      // Apply smooth movement
      camera.position.lerp(targetPos, smoothFactor);
      camera.lookAt(targetLook);
      
      // End resumption flags if they're still set
      if (isResumingRef.current) {
        isResumingRef.current = false;
      }
      if (isPatternTransitioningRef.current) {
        isPatternTransitioningRef.current = false;
      }
    }

    // Debug logging for wave issues
    if (settings.animationPattern === 'wave' && Math.floor(timeRef.current * 1) % 100 === 0) {
      console.log(`🌊 Wave Camera: H=${y.toFixed(1)} D=${Math.sqrt(x*x + z*z).toFixed(1)} LookY=${lookY.toFixed(1)}`);
    }
  });

  return null;
};

// FIXED: Updated CameraControls with better coordination and SmoothCinematicCameraController integration
const CameraControls: React.FC<{ 
  settings: ExtendedSceneSettings; 
  photosWithPositions: PhotoWithPosition[];
}> = ({ settings, photosWithPositions }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();
  
  // Photo positions for cinematic camera
  const photoPositions = useMemo(() => {
    return photosWithPositions
      .filter(photo => photo.id && !photo.id.startsWith('placeholder-'))
      .map(photo => ({
        position: photo.targetPosition,
        slotIndex: photo.slotIndex,
        id: photo.id
      }));
  }, [photosWithPositions]);
  
  const isCinematicActive = settings.cameraAnimation?.enabled && settings.cameraAnimation.type !== 'none';
  
  // FIXED: Better camera initialization that doesn't fight with cinematic
  useEffect(() => {
    if (camera && controlsRef.current) {
      const photoSize = settings.photoSize || 4;
      const distance = Math.max(settings.cameraDistance || 25, photoSize * 6);
      const height = Math.max(settings.cameraHeight || 5, photoSize * 3);
      
      // Only set initial position when cinematic is off or just starting
      if (!isCinematicActive) {
        camera.position.set(distance * 0.7, height, distance * 0.7);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
      
      console.log(`📷 Camera controls - Cinematic: ${isCinematicActive ? 'ACTIVE' : 'MANUAL'}`);
    }
  }, [camera, isCinematicActive, settings.cameraDistance, settings.cameraHeight, settings.photoSize]);

  return (
    <>
      {/* FIXED: OrbitControls that work smoothly alongside cinematic */}
      <OrbitControls
        ref={controlsRef}
        enabled={settings.cameraEnabled !== false}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={Math.max(8, (settings.photoSize || 4) * 2)}
        maxDistance={300}
        enableDamping={true}
        dampingFactor={0.08} // Slightly more responsive
        // FIXED: Auto-rotate only when neither cinematic mode is active
        autoRotate={!isCinematicActive && settings.cameraRotationEnabled}
        autoRotateSpeed={settings.cameraRotationSpeed || 0.5}
        // FIXED: Less aggressive mouse sensitivity when cinematic is active
        rotateSpeed={isCinematicActive ? 0.3 : 0.5}
        panSpeed={isCinematicActive ? 0.5 : 0.8}
        zoomSpeed={isCinematicActive ? 0.8 : 1.2}
      />
      
      {/* Auto-Rotate only when cinematic is OFF */}
      {!isCinematicActive && (
        <AutoRotateCamera settings={settings} />
      )}
      
      {/* Cinematic Camera */}
      {isCinematicActive && (
        <CinematicCamera 
          config={settings.cameraAnimation}
          photoPositions={photoPositions}
          settings={settings}
        />
      )}
    </>
  );
};

// FIXED: Enhanced Slot Manager with proper photo count handling up to 500
class EnhancedSlotManager {
  private slotAssignments = new Map<string, number>();
  private occupiedSlots = new Set<number>();
  private availableSlots: number[] = [];
  private totalSlots = 0;
  private photoAspectRatios = new Map<string, number>();

  constructor(totalSlots: number) {
    this.updateSlotCount(Math.min(Math.max(totalSlots, 1), 500)); // FIXED: Clamp to 1-500
  }

  updateSlotCount(newTotal: number) {
    // FIXED: Ensure we can handle up to 500 photos
    const clampedTotal = Math.min(Math.max(newTotal, 1), 500);
    
    if (clampedTotal === this.totalSlots) return;
    
    console.log(`📊 Updating slot count from ${this.totalSlots} to ${clampedTotal}`);
    this.totalSlots = clampedTotal;
    
    // Clean up slots that are now out of range
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (slotIndex >= clampedTotal) {
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
    
    // Track aspect ratios
    safePhotos.forEach(photo => {
      if (!this.photoAspectRatios.has(photo.id)) {
        if (photo.width && photo.height) {
          this.photoAspectRatios.set(photo.id, photo.width / photo.height);
        }
      }
    });
    
    // Clean up slots for photos that no longer exist
    const currentPhotoIds = new Set(safePhotos.map(p => p.id));
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (!currentPhotoIds.has(photoId)) {
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
        this.photoAspectRatios.delete(photoId);
      }
    }

    this.rebuildAvailableSlots();

    // Sort photos for consistent assignment
    const sortedPhotos = [...safePhotos].sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return a.id.localeCompare(b.id);
    });

    // Assign slots to new photos
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

//FIXED: Environment renderer for different scene environments
const EnvironmentRenderer: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const { scene } = useThree();
  
  useEffect(() => {
    // Simple environment setup based on settings
    if (!settings.sceneEnvironment || settings.sceneEnvironment === 'default') {
      return;
    }
    
    console.log('🌍 ENVIRONMENT: Setting up', settings.sceneEnvironment);
    
    // Basic environment implementations
    switch (settings.sceneEnvironment) {
      case 'gallery':
        // Add ambient lighting for gallery feel
        scene.fog = new THREE.Fog(0x000000, 50, 200);
        break;
      case 'studio':
        // Clear fog for clean studio look
        scene.fog = null;
        break;
      case 'cube':
        // Could add cube environment map here
        console.log('🌍 Cube environment selected');
        break;
      case 'sphere':
        // Could add sphere environment map here  
        console.log('🌍 Sphere environment selected');
        break;
    }
    
    return () => {
      // Cleanup fog when component unmounts or environment changes
      if (scene.fog) {
        scene.fog = null;
      }
    };
  }, [scene, settings.sceneEnvironment]);

  return null;
};

// Enhanced Cube Environment
const CubeEnvironment: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
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

  return (
    <group>
      <mesh position={[0, wallHeight / 2 - 50, -wallSize / 2]} receiveShadow>
        <boxGeometry args={[wallSize, wallHeight, wallThickness]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[-wallSize / 2, wallHeight / 2 - 50, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, wallSize]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[wallSize / 2, wallHeight / 2 - 50, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, wallSize]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[0, wallHeight / 2 - 50, wallSize / 2]} receiveShadow>
        <boxGeometry args={[wallSize, wallHeight, wallThickness]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
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

  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[sphereRadius, 64, 32]} />
      <primitive object={sphereMaterial} attach="material" />
    </mesh>
  );
};

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

  return (
    <group>
      <mesh position={[0, roomHeight / 2 - 50, -roomDepth / 2]} receiveShadow>
        <planeGeometry args={[roomWidth, roomHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[-roomWidth / 2, roomHeight / 2 - 50, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[roomDepth, roomHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[roomWidth / 2, roomHeight / 2 - 50, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[roomDepth, roomHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[0, roomHeight / 2 - 50, roomDepth / 2]} receiveShadow>
        <planeGeometry args={[roomWidth, roomHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[0, roomHeight - 50, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roomWidth, roomDepth]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i}>
          <mesh position={[(i - 3.5) * (roomWidth / 8), roomHeight - 55, 0]}>
            <cylinderGeometry args={[1, 1.5, 3, 8]} />
            <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
          </mesh>
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

  const backdropGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(
      studioSize,
      studioSize,
      studioSize * 1.2,
      32,
      1,
      true,
      0,
      Math.PI
    );
    return geometry;
  }, [studioSize]);

  const lightPositions = useMemo(() => [
    [studioSize * 0.3, studioSize * 0.4, studioSize * 0.5],
    [-studioSize * 0.3, studioSize * 0.4, studioSize * 0.5],
    [0, studioSize * 0.6, -studioSize * 0.3],
    [studioSize * 0.2, studioSize * 0.8, 0],
    [-studioSize * 0.2, studioSize * 0.8, 0],
    [0, studioSize * 0.2, -studioSize * 0.8]
  ], [studioSize]);

  return (
    <group>
      <mesh 
        geometry={backdropGeometry} 
        material={backdropMaterial}
        position={[0, studioSize * 0.2 - 50, -studioSize * 0.6]}
        rotation={[0, 0, 0]}
      />
      <mesh position={[0, -50, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[studioSize * 2, studioSize * 2]} />
        <primitive object={backdropMaterial} attach="material" />
      </mesh>
      <group position={[0, studioSize / 2, 0]}>
        {lightPositions.map((pos, i) => (
          <group key={i}>
            <mesh position={pos as [number, number, number]}>
              <cylinderGeometry args={[1, 2, 4, 8]} />
              <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.1} />
            </mesh>
            <spotLight
              position={pos as [number, number, number]}
              target-position={[0, -25, 0]}
              angle={i < 2 ? Math.PI / 4 : Math.PI / 6}
              penumbra={0.5}
              intensity={i === 0 ? 3 : i === 1 ? 2 : 1.5}
              color="#FFFFFF"
              castShadow={i < 3}
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
          </group>
        ))}
      </group>
    </group>
  );
};

const SceneEnvironmentManager: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const environment = settings.sceneEnvironment || 'default';

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

// FIXED: Textured Floor component that uses the FloorTextureFactory
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

// FIXED: Floor component that actually renders in the scene
const Floor: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  if (!settings.floorEnabled) return null;

  const floorMaterial = useMemo(() => {
    console.log('🏢 FLOOR: Creating floor with settings:', {
      floorEnabled: settings.floorEnabled,
      floorSize: settings.floorSize,
      floorColor: settings.floorColor,
      floorOpacity: settings.floorOpacity
    });

    return new THREE.MeshStandardMaterial({
      color: settings.floorColor || '#1A1A1A',
      transparent: (settings.floorOpacity || 1) < 1,
      opacity: settings.floorOpacity || 1,
      metalness: Math.min(settings.floorMetalness || 0.5, 0.9),
      roughness: Math.max(settings.floorRoughness || 0.5, 0.1),
      side: THREE.DoubleSide,
      envMapIntensity: 0.5,
    });
  }, [settings.floorColor, settings.floorOpacity, settings.floorMetalness, settings.floorRoughness]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -12, 0]} // Match the floor height used in patterns
      receiveShadow
    >
      <planeGeometry args={[settings.floorSize || 200, settings.floorSize || 200, 32, 32]} />
      <primitive object={floorMaterial} attach="material" />
    </mesh>
  );
};

// FIXED: Grid component that actually renders in the scene
const Grid: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  if (!settings.gridEnabled) return null;

  const gridHelper = useMemo(() => {
    console.log('🔧 GRID: Creating grid with settings:', {
      gridEnabled: settings.gridEnabled,
      gridSize: settings.gridSize,
      gridDivisions: settings.gridDivisions,
      gridColor: settings.gridColor,
      gridOpacity: settings.gridOpacity
    });

    const helper = new THREE.GridHelper(
      settings.gridSize || 200,
      settings.gridDivisions || 30,
      settings.gridColor || '#444444',
      settings.gridColor || '#444444'
    );
    
    const material = helper.material as THREE.LineBasicMaterial;
    material.transparent = true;
    material.opacity = Math.min(settings.gridOpacity || 1.0, 1.0);
    material.color = new THREE.Color(settings.gridColor || '#444444');
    
    helper.position.y = -11.99; // Just above the floor to prevent z-fighting
    
    console.log('🔧 GRID: Grid created and positioned at y =', helper.position.y);
    return helper;
  }, [settings.gridEnabled, settings.gridSize, settings.gridDivisions, settings.gridColor, settings.gridOpacity]);

  return <primitive object={gridHelper} />;
};

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
  // FIXED: Both float and spiral patterns face camera for best visibility
  const shouldFaceCamera = settings.animationPattern === 'float' || settings.animationPattern === 'spiral';
  
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

// FIXED: Enhanced Animation Controller with proper photo count handling
const EnhancedAnimationController: React.FC<{
  settings: ExtendedSceneSettings;
  photos: Photo[];
  onPositionsUpdate: (photos: PhotoWithPosition[]) => void;
}> = ({ settings, photos, onPositionsUpdate }) => {
  const slotManagerRef = useRef(new EnhancedSlotManager(Math.min(Math.max(settings.photoCount || 100, 1), 500)));
  const lastPhotoCount = useRef(Math.min(Math.max(settings.photoCount || 100, 1), 500));
  
  const updatePositions = useCallback((time: number = 0) => {
    try {
      const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
      const slotAssignments = slotManagerRef.current.assignSlots(safePhotos);
      
      let patternState;
      try {
        // FIXED: Use enhanced grid pattern for perfect symmetrical layouts
        if (settings.animationPattern === 'grid') {
          const enhancedGridPattern = new EnhancedGridPattern(settings);
          patternState = enhancedGridPattern.generatePositions(time);
        } else if (settings.animationPattern === 'wave') {
          const fixedWavePattern = new FixedWavePattern(settings);
          patternState = fixedWavePattern.generatePositions(time);
        } else if (settings.animationPattern === 'spiral') {
          const fixedSpiralPattern = new FixedSpiralPattern(settings);
          patternState = fixedSpiralPattern.generatePositions(time);
        } else {
          // Use original pattern factory for other patterns
          const pattern = PatternFactory.createPattern(
            settings.animationPattern || 'grid',
            {
              ...settings,
              photoCount: Math.min(Math.max(settings.photoCount || 100, 1), 500) // FIXED: Clamp to 1-500
            },
            safePhotos
          );
          patternState = pattern.generatePositions(time);
        }
        
        // Apply floor level adjustments - FIXED: Higher hover height for gentle floating
        if (settings.animationPattern === 'spiral' || settings.animationPattern === 'wave') {
          const floorLevel = -12;
          const photoSize = settings.photoSize || 4.0;
          
          // Different hover heights for different patterns
          const hoverHeight = settings.animationPattern === 'wave' ? 8 : 5; // Wave floats higher
          const minPhotoHeight = floorLevel + photoSize + hoverHeight;
          
          patternState.positions = patternState.positions.map((pos, index) => {
            const [x, y, z] = pos;
            
            // FIXED: Ensure photos float gently, never touch floor
            let adjustedY = Math.max(y, minPhotoHeight);
            
            return [x, adjustedY, z];
          });
        }
        
      } catch (error) {
        console.error('Pattern generation error:', error);
        // Fallback grid
        const positions = [];
        const rotations = [];
        const spacing = Math.max(6, (settings.photoSize || 4.0) * 1.5);
        const totalSlots = Math.min(Math.max(settings.photoCount || 100, 1), 500); // FIXED: Clamp to 1-500
        
        for (let i = 0; i < totalSlots; i++) {
          const x = (i % 10) * spacing - (spacing * 5);
          const z = Math.floor(i / 10) * spacing - (spacing * 5);
          positions.push([x, -6, z]);
          rotations.push([0, 0, 0]);
        }
        patternState = { positions, rotations };
      }
      
      const photosWithPositions: PhotoWithPosition[] = [];
      const totalSlots = Math.min(Math.max(settings.photoCount || 100, 1), 500); // FIXED: Clamp to 1-500
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
      
      if (availablePositions < totalSlots) {
        console.log(`🔧 Pattern supports ${availablePositions} positions for ${totalSlots} slots`);
      }
      
      photosWithPositions.sort((a, b) => a.slotIndex - b.slotIndex);
      onPositionsUpdate(photosWithPositions);
      
    } catch (error) {
      console.error('Error in updatePositions:', error);
    }
  }, [photos, settings, onPositionsUpdate]);

  useEffect(() => {
    const newPhotoCount = Math.min(Math.max(settings.photoCount || 100, 1), 500); // FIXED: Clamp to 1-500
    if (newPhotoCount !== lastPhotoCount.current) {
      console.log(`📊 Photo count changed from ${lastPhotoCount.current} to ${newPhotoCount}`);
      slotManagerRef.current.updateSlotCount(newPhotoCount);
      lastPhotoCount.current = newPhotoCount;
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

// Helper function to get current particle theme
const getCurrentParticleTheme = (settings: ExtendedSceneSettings) => {
  const themeName = settings.particles?.theme ?? 'Purple Magic';
  return PARTICLE_THEMES.find(theme => theme.name === themeName) || PARTICLE_THEMES[0];
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
        
        {/* FIXED: Environment renderer for different scene types */}
        <EnvironmentRenderer settings={safeSettings} />
        
        {/* FIXED: Scene Environment Manager - Full 3D environments */}
        <SceneEnvironmentManager settings={safeSettings} />
        
        {/* FIXED Camera Controls - Actually Working */}
        <CameraControls settings={safeSettings} photosWithPositions={photosWithPositions} />
        
        {/* FIXED: Textured Floor - Always show unless sphere environment */}
        {safeSettings.sceneEnvironment !== 'sphere' && (
          <TexturedFloor settings={safeSettings} />
        )}
        
        {/* FIXED: Grid - Only show for default environment */}
        {(!safeSettings.sceneEnvironment || safeSettings.sceneEnvironment === 'default') && 
         safeSettings.gridEnabled && (
          <Grid settings={safeSettings} />
        )}
        
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
        
        {/* Enhanced Animation Controller */}
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
        
        {/* Enhanced Lighting */}
        <EnhancedLightingSystem settings={safeSettings} />
      </Canvas>
    </div>
  );
});

EnhancedCollageScene.displayName = 'EnhancedCollageScene';
export default EnhancedCollageScene;