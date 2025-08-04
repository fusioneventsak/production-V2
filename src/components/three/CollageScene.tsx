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

// FIXED: Extended settings with cinematic camera height and distance controls
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

// FIXED: Enhanced Cinematic Camera with Better Spiral Handling and Restored User Interaction
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

  // FIXED: Restored and improved user interaction detection
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    let interactionTimeout: NodeJS.Timeout;

    const handleInteractionStart = (e: Event) => {
      // Detect actual user interactions on the canvas
      if (e.isTrusted && (e.target === canvas || canvas.contains(e.target as Node))) {
        userInteractingRef.current = true;
        lastInteractionRef.current = Date.now();
        clearTimeout(interactionTimeout);
        
        console.log('🎬 User interaction detected - pausing cinematic camera');
      }
    };

    const handleInteractionEnd = (e: Event) => {
      if (e.isTrusted && (e.target === canvas || canvas.contains(e.target as Node))) {
        lastInteractionRef.current = Date.now();
        clearTimeout(interactionTimeout);
        
        // Shorter delay before resuming based on user setting
        const pauseTime = Math.max((config?.pauseTime || 1) * 1000, 800);
        interactionTimeout = setTimeout(() => {
          userInteractingRef.current = false;
          resumeTimeRef.current = Date.now();
          console.log('🎬 Resuming cinematic camera after user interaction');
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

    // FIXED: Better pause logic that actually works
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
      console.log('🎬 Cinematic camera resumed');
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
    
    // FIXED: Greatly improved spiral pattern handling
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
            height: Math.max(25, photoDisplayHeight + photoSize * 5),
            distance: Math.max(45, photoSize * 11),
            heightVar: photoSize * 1.0,
            distanceVar: 8,
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

    // FIXED: Much better camera movements, especially for spiral
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
        const waveTime = timeRef.current * 0.3;
        const waveRadius = baseDistance * (0.9 + Math.sin(waveTime * 0.2) * 0.05);
        
        x = centerX + Math.sin(waveTime) * waveRadius;
        y = baseHeight + Math.sin(waveTime * 1.1) * heightVariation * 0.4;
        z = centerZ + Math.cos(waveTime * 0.7) * waveRadius * 0.6;
        
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
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

    // FIXED: More responsive camera transitions
    const resumeBlend = Math.min((timeSinceResume) / 1000, 1); // 1 second blend-in
    const smoothFactor = 0.035 * Math.max(resumeBlend, 0.3); // Always have some smoothing
    
    const targetPos = new THREE.Vector3(x, y, z);
    const targetLook = new THREE.Vector3(lookX, lookY, lookZ);
    
    // Apply smooth movement
    camera.position.lerp(targetPos, smoothFactor);
    camera.lookAt(targetLook);

    // Debug logging for spiral issues
    if (settings.animationPattern === 'spiral' && Math.floor(timeRef.current * 1) % 100 === 0) {
      console.log(`🌀 Spiral Camera: H=${y.toFixed(1)} D=${Math.sqrt(x*x + z*z).toFixed(1)} Speed=${speed.toFixed(3)}`);
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
      
      {/* CHOICE: Use either the existing CinematicCamera OR SmoothCinematicCameraController */}
      {isCinematicActive && (
        <>
          {/* Option 1: Use your existing SmoothCinematicCameraController */}
          {/* Uncomment this if you want to use the SmoothCinematicCameraController instead */}
          {/* 
          <SmoothCinematicCameraController
            config={settings.cameraAnimation}
            photoPositions={photoPositions}
            animationPattern={settings.animationPattern || 'grid'}
            floorHeight={-12}
            settings={{
              photoSize: settings.photoSize,
              floorSize: settings.floorSize,
              photoCount: settings.photoCount
            }}
          />
          */}
          
          {/* Option 2: Use the updated CinematicCamera (current choice) */}
          <CinematicCamera 
            config={settings.cameraAnimation}
            photoPositions={photoPositions}
            settings={settings}
          />
        </>
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

// FIXED WAVE PATTERN - Gentle flowing like water hovering over floor
class FixedWavePattern {
  constructor(private settings: any) {}

  generatePositions(time: number) {
    const positions: any[] = [];
    const rotations: [number, number, number][] = [];

    const photoCount = this.settings.patterns?.wave?.photoCount !== undefined 
      ? this.settings.patterns.wave.photoCount 
      : this.settings.photoCount;
    
    // FIXED: Much better spacing - wider spread, proper photo size consideration
    const photoSize = this.settings.photoSize || 4;
    const baseSpacing = Math.max(12, photoSize * 2.5); // Much wider base spacing
    const spacingMultiplier = 1 + (this.settings.patterns?.wave?.spacing || 0.15);
    const finalSpacing = baseSpacing * spacingMultiplier;
    
    // FIXED: Support up to 500 photos efficiently
    const totalPhotos = Math.min(Math.max(photoCount, 1), 500);
    
    // Calculate grid dimensions
    const columns = Math.ceil(Math.sqrt(totalPhotos));
    const rows = Math.ceil(totalPhotos / columns);
    
    const speed = this.settings.animationSpeed / 50;
    const wavePhase = time * speed * 1.0; // Even slower for gentle flow
    
    // FIXED: Higher hover height for gentle floating effect
    const floorHeight = -12;
    const minHoverHeight = 8; // Much higher minimum hover
    const maxHoverHeight = 16; // Higher ceiling for wave motion
    const baseHeight = floorHeight + photoSize + minHoverHeight; // Higher base
    
    for (let i = 0; i < totalPhotos; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      // FIXED: Base positions with much better spacing
      let x = (col - columns / 2) * finalSpacing;
      let z = (row - rows / 2) * finalSpacing;
      
      // GENTLE FLOATING WAVE: Much smoother amplitude that never gets too low
      const amplitude = Math.min(this.settings.patterns?.wave?.amplitude || 4, photoSize * 1.0); // Smaller, gentler waves
      const frequency = this.settings.patterns?.wave?.frequency || 0.1; // Even lower frequency for broader, gentler waves
      
      let y = baseHeight; // Start from higher base
      
      if (this.settings.animationEnabled) {
        // MAIN GENTLE WAVE: Soft rolling motion like floating on water
        const mainWave = Math.sin(x * frequency - wavePhase) * amplitude;
        
        // PERPENDICULAR GENTLE WAVE: Soft crossing patterns
        const crossWave = Math.sin(z * frequency * 0.7 + wavePhase * 0.6) * amplitude * 0.5;
        
        // FLOATING RIPPLES: Very gentle radial ripples
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const radialWave = Math.sin(distanceFromCenter * frequency * 0.2 - wavePhase * 0.4) * amplitude * 0.3;
        
        // GENTLE BREATHING: Soft overall rise and fall
        const breathingWave = Math.sin(wavePhase * 0.25) * amplitude * 0.4;
        
        // Combine into very gentle water-like floating motion
        const totalWaveHeight = mainWave + crossWave + radialWave + breathingWave;
        
        // ENSURE ALWAYS FLOATING: Never let photos get too close to floor
        y += Math.max(totalWaveHeight, -amplitude * 0.5); // Clamp the minimum
        
        // Additional safety: ensure minimum hover height is maintained
        y = Math.max(y, baseHeight - amplitude * 0.3);
      }
      
      positions.push([x, y, z]);

      if (this.settings.photoRotation) {
        const angle = Math.atan2(x, z);
        // Very gentle rotation that follows the gentle wave motion
        const rotationX = Math.sin(wavePhase * 0.3 + x * frequency * 0.3) * 0.02;
        const rotationY = angle + Math.sin(wavePhase * 0.2) * 0.015;
        const rotationZ = Math.cos(wavePhase * 0.3 + z * frequency * 0.3) * 0.02;
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
        // FIXED: Use our fixed patterns for wave and spiral
        if (settings.animationPattern === 'wave') {
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
        
        const expectedSlots = Math.min(Math.max(settings.photoCount || 100, 1), 500); // FIXED: Clamp to 1-500
        
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
        
        {/* FIXED Camera Controls - Actually Working */}
        <CameraControls settings={safeSettings} photosWithPositions={photosWithPositions} />
        
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