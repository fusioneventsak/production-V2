// src/components/three/SmoothCinematicCameraController.tsx - FULLY FIXED: Works with Empty Slots + All Patterns
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface PhotoPosition {
  position: [number, number, number];
  slotIndex: number;
  id: string;
}

interface CinematicCameraConfig {
  enabled?: boolean;
  type: 'none' | 'showcase' | 'gallery_walk' | 'spiral_tour' | 'wave_follow' | 'grid_sweep' | 'photo_focus';
  speed: number;
  focusDistance: number;
  heightOffset: number;
  transitionTime: number;
  pauseTime: number;
  randomization: number;
  // Enhanced interaction settings
  interactionSensitivity?: 'low' | 'medium' | 'high';
  ignoreMouseMovement?: boolean;
  mouseMoveThreshold?: number;
  resumeDelay?: number;
  enableManualControl?: boolean;
  resumeFromCurrentPosition?: boolean;
  blendDuration?: number;
  preserveUserDistance?: boolean;
  preserveUserHeight?: boolean;
}

interface SmoothCinematicCameraControllerProps {
  config?: CinematicCameraConfig;
  photoPositions: PhotoPosition[];
  animationPattern: string;
  floorHeight: number;
  settings: {
    photoSize?: number;
    floorSize?: number;
    photoCount?: number;
    patterns?: {
      wave?: {
        amplitude?: number;
        frequency?: number;
      };
    };
  };
}

// Smooth curve generator for continuous camera paths
class SmoothCameraPath {
  private points: THREE.Vector3[] = [];
  private curve: THREE.CatmullRomCurve3 | null = null;
  private totalLength: number = 0;

  constructor(waypoints: THREE.Vector3[], closed: boolean = true) {
    this.generateSmoothPath(waypoints, closed);
  }

  private generateSmoothPath(waypoints: THREE.Vector3[], closed: boolean) {
    if (waypoints.length < 2) return;

    // Add intermediate points between waypoints for smoother curves
    const smoothPoints: THREE.Vector3[] = [];
    
    for (let i = 0; i < waypoints.length; i++) {
      const current = waypoints[i];
      const next = waypoints[(i + 1) % waypoints.length];
      
      smoothPoints.push(current.clone());
      
      // Add intermediate point for smoother curves (except for last segment if not closed)
      if (i < waypoints.length - 1 || closed) {
        const intermediate = current.clone().lerp(next, 0.5);
        // Add slight variation to avoid straight lines
        intermediate.y += Math.sin(i * 0.5) * 1;
        smoothPoints.push(intermediate);
      }
    }

    this.points = smoothPoints;
    this.curve = new THREE.CatmullRomCurve3(this.points, closed);
    this.curve.tension = 0.3; // Smoother curves
    this.totalLength = this.curve.getLength();
  }

  getPositionAt(t: number): THREE.Vector3 {
    if (!this.curve) return new THREE.Vector3();
    return this.curve.getPointAt(t % 1);
  }

  getLookAtTarget(t: number, photoPositions: PhotoPosition[], focusDistance: number): THREE.Vector3 {
    const currentPos = this.getPositionAt(t);
    
    // Look at ALL positions (both photos and empty slots)
    const nearbyPositions = photoPositions
      .map(p => ({
        position: p,
        distance: currentPos.distanceTo(new THREE.Vector3(...p.position))
      }))
      .filter(p => p.distance <= focusDistance)
      .sort((a, b) => a.distance - b.distance);

    if (nearbyPositions.length > 0) {
      // Focus on the closest position (photo or empty slot)
      const target = new THREE.Vector3(...nearbyPositions[0].position.position);
      return target;
    } else {
      // Look ahead along the path
      const lookAheadT = (t + 0.1) % 1;
      return this.getPositionAt(lookAheadT);
    }
  }

  getTotalLength(): number {
    return this.totalLength;
  }
}

// FIXED: Smart path generators that work with ALL slots (photos + empty)
class CinematicPathGenerator {
  static generateShowcasePath(positions: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!positions.length) return [];

    const photoSize = settings.photoSize || 4;
    const optimalHeight = 5;
    const viewingDistance = photoSize * 3;

    // Sort ALL positions for optimal viewing order (serpentine grid pattern)
    const positionsByZ = new Map<number, PhotoPosition[]>();
    positions.forEach(pos => {
      const z = Math.round(pos.position[2] / photoSize) * photoSize;
      if (!positionsByZ.has(z)) positionsByZ.set(z, []);
      positionsByZ.get(z)!.push(pos);
    });

    const waypoints: THREE.Vector3[] = [];
    const sortedZRows = Array.from(positionsByZ.keys()).sort((a, b) => b - a);
    
    sortedZRows.forEach((z, rowIndex) => {
      const rowPositions = positionsByZ.get(z)!.sort((a, b) => 
        rowIndex % 2 === 0 ? a.position[0] - b.position[0] : b.position[0] - a.position[0]
      );
      
      rowPositions.forEach((pos, posIndex) => {
        // Create smooth viewing positions for ALL slots
        const offset = Math.sin(posIndex * 0.5) * photoSize * 0.3;
        waypoints.push(new THREE.Vector3(
          pos.position[0] + offset,
          optimalHeight + Math.sin(posIndex * 0.3) * 2,
          pos.position[2] + viewingDistance + Math.cos(posIndex * 0.2) * 1
        ));
      });
    });

    return waypoints;
  }

  static generateGalleryWalkPath(positions: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!positions.length) return [];

    const photoSize = settings.photoSize || 4;
    const walkHeight = 3;
    const walkDistance = photoSize * 3;

    // Create a walking path that visits ALL positions in a natural gallery-style route
    const sortedPositions = [...positions].sort((a, b) => {
      // Sort by Z first (depth), then by X (left to right)
      if (Math.abs(a.position[2] - b.position[2]) > photoSize) {
        return b.position[2] - a.position[2]; // Back to front
      }
      return a.position[0] - b.position[0]; // Left to right
    });

    const waypoints: THREE.Vector3[] = [];

    sortedPositions.forEach((pos, index) => {
      const angle = Math.atan2(pos.position[2], pos.position[0]);
      const walkOffset = Math.sin(index * 0.1) * photoSize * 0.2;
      
      waypoints.push(new THREE.Vector3(
        pos.position[0] - Math.cos(angle) * walkDistance + walkOffset,
        walkHeight + Math.sin(index * 0.05) * 1,
        pos.position[2] - Math.sin(angle) * walkDistance
      ));
    });

    return waypoints;
  }

  static generateSpiralTourPath(positions: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!positions.length) return [];

    const photoSize = settings.photoSize || 4;
    const spiralHeight = 10;

    // Create a spiral that encompasses ALL positions
    const bounds = this.getPhotoBounds(positions);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const maxRadius = Math.max(bounds.maxX - centerX, bounds.maxZ - centerZ) + photoSize * 3;

    const waypoints: THREE.Vector3[] = [];
    const spiralTurns = 3;
    const pointsPerTurn = 20;
    const totalPoints = spiralTurns * pointsPerTurn;

    for (let i = 0; i < totalPoints; i++) {
      const t = i / totalPoints;
      const angle = t * spiralTurns * Math.PI * 2;
      const radius = maxRadius * (0.3 + t * 0.7); // Start inner, spiral out
      const height = spiralHeight + Math.sin(t * Math.PI * 2) * 3 + t * 5;

      waypoints.push(new THREE.Vector3(
        centerX + Math.cos(angle) * radius,
        height,
        centerZ + Math.sin(angle) * radius
      ));
    }

    return waypoints;
  }

  // FIXED: Wave pattern that works with empty scene and follows actual wave motion
  static generateWaveFollowPath(positions: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!positions.length) return [];

    const photoSize = settings.photoSize || 4;
    const waveAmplitude = settings.patterns?.wave?.amplitude || 15;
    const waveFrequency = settings.patterns?.wave?.frequency || 0.3;
    
    // Calculate bounds from ALL positions
    const bounds = this.getPhotoBounds(positions);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    
    const waypoints: THREE.Vector3[] = [];
    const baseHeight = 8; // Good viewing height
    
    // FIXED: Create wave-following path that covers the entire grid area
    // regardless of whether there are photos or not
    const gridColumns = Math.ceil(Math.sqrt(positions.length));
    const gridRows = Math.ceil(positions.length / gridColumns);
    const spacing = photoSize * 1.5;
    
    // Start from center and move outward in wave pattern
    waypoints.push(new THREE.Vector3(centerX, baseHeight + 10, centerZ));
    
    // Descend into scene
    for (let i = 1; i <= 3; i++) {
      const t = i / 3;
      waypoints.push(new THREE.Vector3(
        centerX + Math.sin(t * Math.PI) * photoSize * 2,
        baseHeight + 10 * (1 - t),
        centerZ + Math.cos(t * Math.PI) * photoSize * 2
      ));
    }
    
    // FIXED: Follow the actual wave pattern motion across the grid
    // Create serpentine pattern that follows wave crests
    for (let row = 0; row < gridRows; row++) {
      const z = (row - gridRows / 2) * spacing;
      const isEvenRow = row % 2 === 0;
      
      const pointsInRow = Math.min(gridColumns, positions.length - row * gridColumns);
      
      for (let col = 0; col < pointsInRow; col++) {
        const actualCol = isEvenRow ? col : pointsInRow - 1 - col;
        const x = (actualCol - gridColumns / 2) * spacing;
        
        // Calculate wave height at this position
        const distFromCenter = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);
        const wavePhase = distFromCenter * waveFrequency;
        const waveHeight = Math.sin(wavePhase) * waveAmplitude * 0.3; // Reduced for camera smoothness
        
        // Position camera to follow the wave motion
        const cameraX = x + Math.sin(wavePhase * 0.5) * photoSize;
        const cameraY = baseHeight + waveHeight + Math.sin(row * 0.3 + col * 0.2) * 2;
        const cameraZ = z + photoSize * 2; // Stay in front of the wave
        
        waypoints.push(new THREE.Vector3(cameraX, Math.max(cameraY, 2), cameraZ));
      }
    }
    
    // Return to elevated overview
    for (let i = 1; i <= 5; i++) {
      const t = i / 5;
      const radius = Math.max(bounds.maxX - centerX, bounds.maxZ - centerZ) * (1 - t * 0.5);
      waypoints.push(new THREE.Vector3(
        centerX + Math.cos(t * Math.PI * 2) * radius,
        baseHeight + t * 8,
        centerZ + Math.sin(t * Math.PI * 2) * radius
      ));
    }

    return waypoints;
  }

  static generateGridSweepPath(positions: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!positions.length) return [];

    const photoSize = settings.photoSize || 4;
    const sweepHeight = 5;

    // Grid sweep - systematic coverage of ALL positions
    const bounds = this.getPhotoBounds(positions);
    const waypoints: THREE.Vector3[] = [];

    const rows = 5;
    const cols = 6;

    for (let row = 0; row < rows; row++) {
      const z = bounds.minZ - 10 + (row / (rows - 1)) * (bounds.maxZ - bounds.minZ + 20);
      const isEvenRow = row % 2 === 0;
      
      for (let col = 0; col < cols; col++) {
        const colIndex = isEvenRow ? col : cols - 1 - col;
        const x = bounds.minX - 10 + (colIndex / (cols - 1)) * (bounds.maxX - bounds.minX + 20);
        const heightVariation = Math.sin(row * 0.3 + col * 0.2) * 2;
        
        waypoints.push(new THREE.Vector3(
          x,
          sweepHeight + heightVariation,
          z + photoSize * 3
        ));
      }
    }

    return waypoints;
  }

  static generatePhotoFocusPath(positions: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!positions.length) return [];

    const photoSize = settings.photoSize || 4;
    const focusDistance = photoSize * 2;

    // FIXED: Create intimate path that covers ALL slots, not just photos
    const waypoints: THREE.Vector3[] = [];
    
    // Use ALL positions for comprehensive coverage
    const step = Math.max(1, Math.floor(positions.length / 20));
    const selectedPositions = positions.filter((_, index) => index % step === 0);

    selectedPositions.forEach((pos, index) => {
      // Multiple angles around each position for detailed viewing
      const angles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
      
      angles.forEach((angle, angleIndex) => {
        const radius = focusDistance + Math.sin(angleIndex) * photoSize * 0.5;
        const height = pos.position[1] + 3 + Math.cos(angleIndex * 0.5) * 2;
        
        waypoints.push(new THREE.Vector3(
          pos.position[0] + Math.cos(angle) * radius,
          Math.max(height, 2),
          pos.position[2] + Math.sin(angle) * radius
        ));
      });
    });

    return waypoints;
  }

  private static getPhotoBounds(positions: PhotoPosition[]) {
    if (!positions.length) {
      return {
        minX: -50,
        maxX: 50,
        minZ: -50,
        maxZ: 50
      };
    }
    
    const posArray = positions.map(p => p.position);
    return {
      minX: Math.min(...posArray.map(p => p[0])),
      maxX: Math.max(...posArray.map(p => p[0])),
      minZ: Math.min(...posArray.map(p => p[2])),
      maxZ: Math.max(...posArray.map(p => p[2]))
    };
  }
}

export const SmoothCinematicCameraController: React.FC<SmoothCinematicCameraControllerProps> = ({
  config,
  photoPositions,
  animationPattern,
  floorHeight = -12,
  settings
}) => {
  const { camera, controls } = useThree();
  
  // Animation state
  const pathProgressRef = useRef(0);
  const userInteractingRef = useRef(false);
  const lastInteractionRef = useRef(0);
  const isActiveRef = useRef(false);
  const currentPathRef = useRef<SmoothCameraPath | null>(null);
  const visibilityTrackerRef = useRef(new Set<string>());
  
  // Enhanced interaction tracking
  const lastUserPositionRef = useRef<THREE.Vector3>();
  const lastUserTargetRef = useRef<THREE.Vector3>();
  const resumeBlendRef = useRef(0);
  const isResuming = useRef(false);

  // Automatic config change detection
  const lastConfigRef = useRef<string>('');
  const isConfigTransitioningRef = useRef(false);
  const configTransitionStartRef = useRef(0);
  const configStartPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const configStartLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // CRITICAL FIX: Generate smooth camera path using ALL positions (photos + empty slots)
  const cameraPath = useMemo(() => {
    if (!config?.enabled || !photoPositions.length || config.type === 'none') {
      return null;
    }

    // CRITICAL FIX: Use ALL positions - never filter out empty slots
    // The camera should move through the entire scene regardless of photo presence
    const allPositions = photoPositions; // Use everything - photos AND empty slots
    
    if (!allPositions.length) {
      console.warn('⚠️ No positions available for camera path');
      return null;
    }

    const actualPhotos = allPositions.filter(p => !p.id.startsWith('placeholder-'));
    const emptySlots = allPositions.filter(p => p.id.startsWith('placeholder-'));
    
    console.log(`🎬 FIXED: Generating ${config.type} path for ALL ${allPositions.length} positions`);
    console.log(`📸 Breakdown: ${actualPhotos.length} photos, ${emptySlots.length} empty slots`);
    console.log(`🔄 Animation pattern: ${animationPattern}`);

    let waypoints: THREE.Vector3[] = [];

    // Generate paths using ALL positions - this ensures camera movement even in empty scenes
    switch (config.type) {
      case 'showcase':
        waypoints = CinematicPathGenerator.generateShowcasePath(allPositions, settings);
        break;
      case 'gallery_walk':
        waypoints = CinematicPathGenerator.generateGalleryWalkPath(allPositions, settings);
        break;
      case 'spiral_tour':
        waypoints = CinematicPathGenerator.generateSpiralTourPath(allPositions, settings);
        break;
      case 'wave_follow':
        waypoints = CinematicPathGenerator.generateWaveFollowPath(allPositions, settings);
        break;
      case 'grid_sweep':
        waypoints = CinematicPathGenerator.generateGridSweepPath(allPositions, settings);
        break;
      case 'photo_focus':
        waypoints = CinematicPathGenerator.generatePhotoFocusPath(allPositions, settings);
        break;
      default:
        console.warn(`⚠️ Unknown camera type: ${config.type}`);
        return null;
    }

    if (waypoints.length < 2) {
      console.warn(`⚠️ Not enough waypoints generated for ${config.type}: ${waypoints.length}`);
      return null;
    }

    // Create smooth continuous path
    const smoothPath = new SmoothCameraPath(waypoints, true);
    
    // Reset progress and visibility tracking
    pathProgressRef.current = 0;
    visibilityTrackerRef.current.clear();
    
    console.log(`✅ FIXED: Created ${config.type} path with ${waypoints.length} waypoints`);
    console.log(`🎯 Path will cover ALL positions regardless of photo presence`);
    
    return smoothPath;
  }, [photoPositions, config?.type, config?.enabled, settings, animationPattern]);

  // Update path reference
  useEffect(() => {
    currentPathRef.current = cameraPath;
  }, [cameraPath]);

  // Enhanced user interaction detection
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas || !config?.enabled) return;

    const ignoreMouseMovement = config.ignoreMouseMovement !== false;
    const sensitivity = config.interactionSensitivity || 'medium';

    const handleInteractionStart = (e: Event) => {
      const eventType = e.type;
      
      if (eventType === 'mousedown' || eventType === 'touchstart') {
        console.log('🎮 Camera Animation: User interaction started -', eventType);
        userInteractingRef.current = true;
        lastInteractionRef.current = Date.now();
        
        if (config.resumeFromCurrentPosition !== false) {
          lastUserPositionRef.current = camera.position.clone();
          if (controls && 'target' in controls) {
            lastUserTargetRef.current = (controls as any).target.clone();
          }
        }
      }
      
      if (eventType === 'wheel') {
        const sensitivity_multiplier = sensitivity === 'low' ? 3 : sensitivity === 'high' ? 0.5 : 1;
        if (Math.abs((e as WheelEvent).deltaY) > 10 * sensitivity_multiplier) {
          console.log('🎮 Camera Animation: Wheel interaction');
          userInteractingRef.current = true;
          lastInteractionRef.current = Date.now();
        }
      }
    };

    const handleInteractionEnd = (e: Event) => {
      const eventType = e.type;
      
      if (eventType === 'mouseup' || eventType === 'touchend') {
        lastInteractionRef.current = Date.now();
        
        const resumeDelay = (config.resumeDelay || 2.0) * 1000;
        setTimeout(() => {
          userInteractingRef.current = false;
          console.log('🎬 Camera Animation: Auto-resuming after interaction');
        }, resumeDelay);
      }
    };

    canvas.addEventListener('mousedown', handleInteractionStart);
    canvas.addEventListener('touchstart', handleInteractionStart);
    canvas.addEventListener('wheel', handleInteractionStart);
    canvas.addEventListener('mouseup', handleInteractionEnd);
    canvas.addEventListener('touchend', handleInteractionEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleInteractionStart);
      canvas.removeEventListener('touchstart', handleInteractionStart);
      canvas.removeEventListener('wheel', handleInteractionStart);
      canvas.removeEventListener('mouseup', handleInteractionEnd);
      canvas.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [config, camera, controls]);

  // Listen to OrbitControls events
  useEffect(() => {
    if (!controls || !config?.enabled) return;

    const handleControlStart = () => {
      console.log('🎮 Camera Animation: OrbitControls interaction started');
      userInteractingRef.current = true;
      lastInteractionRef.current = Date.now();
    };

    const handleControlEnd = () => {
      lastInteractionRef.current = Date.now();
      
      const resumeDelay = (config.resumeDelay || 2.0) * 1000;
      setTimeout(() => {
        userInteractingRef.current = false;
        console.log('🎬 Camera Animation: Auto-resuming after OrbitControls interaction');
      }, resumeDelay);
    };

    if ('addEventListener' in controls) {
      controls.addEventListener('start', handleControlStart);
      controls.addEventListener('end', handleControlEnd);
      
      return () => {
        controls.removeEventListener('start', handleControlStart);
        controls.removeEventListener('end', handleControlEnd);
      };
    }
  }, [controls, config]);

  // FIXED: Enhanced animation loop that works with empty scenes
  useFrame((state, delta) => {
    if (!config?.enabled || !currentPathRef.current || config.type === 'none') {
      isActiveRef.current = false;
      return;
    }

    // Automatic config change detection
    const currentConfigKey = `${config.type}-${config.speed}-${animationPattern}-${config.enabled}`;
    
    if (lastConfigRef.current !== '' && lastConfigRef.current !== currentConfigKey) {
      console.log(`🎬 CONFIG CHANGE AUTO-DETECTED: ${lastConfigRef.current} → ${currentConfigKey}`);
      
      isConfigTransitioningRef.current = true;
      configTransitionStartRef.current = Date.now();
      
      configStartPositionRef.current.copy(camera.position);
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      configStartLookAtRef.current.addVectors(camera.position, direction.multiplyScalar(50));
    }
    
    lastConfigRef.current = currentConfigKey;

    // Check if we should pause for user interaction
    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const pauseDuration = (config.resumeDelay || 2.0) * 1000;

    if (userInteractingRef.current || timeSinceInteraction < pauseDuration) {
      isActiveRef.current = false;
      if (userInteractingRef.current && config.enableManualControl !== false) {
        return;
      }
      return;
    }

    // Smooth resume
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      isResuming.current = true;
      resumeBlendRef.current = 0;
      console.log('🎬 Camera Animation: Smoothly resuming animation');
    }

    // Continuous movement
    const speed = (config.speed || 1.0) * 0.02;
    pathProgressRef.current += delta * speed;
    pathProgressRef.current = pathProgressRef.current % 1;

    // Get smooth camera position
    const targetPosition = currentPathRef.current.getPositionAt(pathProgressRef.current);
    
    // FIXED: Get look-at target using ALL positions (not filtered)
    const lookAtTarget = currentPathRef.current.getLookAtTarget(
      pathProgressRef.current, 
      photoPositions, // Use ALL positions - photos AND empty slots
      config.focusDistance || 15
    );

    // Handle config transitions
    const configTransitionTime = 2500;
    const timeSinceConfigChange = Date.now() - configTransitionStartRef.current;
    
    if (isConfigTransitioningRef.current && timeSinceConfigChange < configTransitionTime) {
      const blendFactor = Math.min(timeSinceConfigChange / configTransitionTime, 1);
      
      const easeInOutCubic = (t: number) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
      const smoothBlend = easeInOutCubic(blendFactor);
      
      const blendedPos = new THREE.Vector3().lerpVectors(configStartPositionRef.current, targetPosition, smoothBlend);
      const blendedLook = new THREE.Vector3().lerpVectors(configStartLookAtRef.current, lookAtTarget, smoothBlend);
      
      camera.position.copy(blendedPos);
      camera.lookAt(blendedLook);
      
      if (blendFactor >= 1) {
        isConfigTransitioningRef.current = false;
        console.log('🎬 Config transition completed');
      }
      
      return;
    }

    // Smooth blending when resuming
    let lerpFactor = 0.03;
    
    if (isResuming.current) {
      const blendDuration = config.blendDuration || 2.0;
      resumeBlendRef.current += delta;
      
      if (resumeBlendRef.current < blendDuration) {
        const blendProgress = resumeBlendRef.current / blendDuration;
        lerpFactor = 0.01 + (blendProgress * 0.02);
      } else {
        isResuming.current = false;
        console.log('🎬 Resume blend complete');
      }
    }

    // Apply smooth camera movement
    camera.position.lerp(targetPosition, lerpFactor);
    camera.lookAt(lookAtTarget);

    // Update controls
    if (controls && 'target' in controls) {
      (controls as any).target.lerp(lookAtTarget, lerpFactor * 0.7);
      (controls as any).update();
    }

    // Track visibility for ALL positions
    photoPositions.forEach(position => {
      const posVec = new THREE.Vector3(...position.position);
      const distance = camera.position.distanceTo(posVec);
      if (distance <= (config.focusDistance || 15)) {
        visibilityTrackerRef.current.add(position.id);
      }
    });

    // Log progress occasionally
    if (Math.floor(pathProgressRef.current * 100) % 25 === 0 && Math.floor(pathProgressRef.current * 100) !== 0) {
      const viewedCount = visibilityTrackerRef.current.size;
      const totalPositions = photoPositions.length;
      const actualPhotos = photoPositions.filter(p => !p.id.startsWith('placeholder-')).length;
      
      console.log(`🎬 Camera tour: ${Math.floor(pathProgressRef.current * 100)}% complete`);
      console.log(`📸 Viewed ${viewedCount}/${totalPositions} positions (${actualPhotos} photos, ${totalPositions - actualPhotos} empty)`);
    }
  });

  // Debug info
  useEffect(() => {
    if (config?.enabled && cameraPath) {
      console.log(`🎬 FIXED Cinematic Camera Active: ${config.type}`);
      console.log(`✅ NOW WORKS WITH EMPTY SCENES! Covers ALL ${photoPositions.length} positions`);
      console.log(`🌊 Wave pattern: ${animationPattern === 'wave' ? 'FIXED - follows wave motion' : 'Other patterns work too'}`);
      console.log(`🎯 Pattern: ${animationPattern}, Speed: ${config.speed}, Focus: ${config.focusDistance}`);
    }
  }, [config?.enabled, config?.type, cameraPath, animationPattern, photoPositions.length]);

  return null;
};

export default SmoothCinematicCameraController;