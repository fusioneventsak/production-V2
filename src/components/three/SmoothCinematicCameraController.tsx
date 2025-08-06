// src/components/three/SmoothCinematicCameraController.tsx - FIXED VERSION 2
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
  interactionSensitivity?: 'low' | 'medium' | 'high';
  ignoreMouseMovement?: boolean;
  mouseMoveThreshold?: number;
  resumeDelay?: number;
  enableManualControl?: boolean;
  resumeFromCurrentPosition?: boolean;
  blendDuration?: number;
  preserveUserDistance?: boolean;
  preserveUserHeight?: boolean;
  // Path variation settings (used during path generation)
  baseHeight?: number;
  baseDistance?: number;
  heightVariation?: number;
  distanceVariation?: number;
  // Dynamic variation settings (applied in real-time on top of path)
  verticalDrift?: number;           // Real-time vertical drift amount
  dynamicDistanceVariation?: number; // Real-time breathing in/out
  // Elevation control (camera angle constraints)
  elevationMin?: number;             // Minimum elevation angle in radians
  elevationMax?: number;             // Maximum elevation angle in radians
  elevationOscillation?: number;     // Oscillate between min and max (0-1)
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
  };
}

// Enhanced smooth curve generator with perfect looping and graceful turns
class SmoothCameraPath {
  private points: THREE.Vector3[] = [];
  private lookAtPoints: THREE.Vector3[] = [];
  private curve: THREE.CatmullRomCurve3 | null = null;
  private lookAtCurve: THREE.CatmullRomCurve3 | null = null;
  private totalLength: number = 0;
  private loopStartPoint: THREE.Vector3 = new THREE.Vector3();
  private loopEndPoint: THREE.Vector3 = new THREE.Vector3();

  constructor(waypoints: THREE.Vector3[], lookAtTargets: THREE.Vector3[], closed: boolean = true) {
    this.generatePerfectLoop(waypoints, lookAtTargets, closed);
  }

  private generatePerfectLoop(waypoints: THREE.Vector3[], lookAtTargets: THREE.Vector3[], closed: boolean) {
    if (waypoints.length < 2) return;

    // PERFECT LOOP: Ensure start and end points create seamless transition
    const smoothPoints: THREE.Vector3[] = [];
    const smoothLookAts: THREE.Vector3[] = [];
    
    // Store original start point for perfect loop closure
    this.loopStartPoint = waypoints[0].clone();
    this.loopEndPoint = waypoints[waypoints.length - 1].clone();
    
    // Add points with smooth interpolation for graceful curves
    for (let i = 0; i < waypoints.length; i++) {
      const current = waypoints[i];
      const currentLookAt = lookAtTargets[i] || waypoints[i].clone();
      const next = waypoints[(i + 1) % waypoints.length];
      const nextLookAt = lookAtTargets[(i + 1) % waypoints.length] || next.clone();
      
      smoothPoints.push(current.clone());
      
      // CRITICAL FIX: Force look-at to NEVER be below camera
      const fixedLookAt = currentLookAt.clone();
      fixedLookAt.y = Math.max(fixedLookAt.y, current.y - 0.5); // Never look down more than 0.5 units
      smoothLookAts.push(fixedLookAt);
      
      // Add intermediate points for ultra-smooth curves (except for last segment if not closed)
      if (i < waypoints.length - 1 || closed) {
        // Create graceful intermediate position
        const intermediate = current.clone().lerp(next, 0.4);
        const intermediateLookAt = currentLookAt.clone().lerp(nextLookAt, 0.4);
        
        // GENTLE height variation for cinematic feel - NO STEEP ANGLES
        intermediate.y += Math.sin(i * 0.8) * 0.3; // Even more reduced vertical movement
        
        // FORCE HORIZONTAL LOOKING
        intermediateLookAt.y = intermediate.y; // Look straight ahead at same height
        
        smoothPoints.push(intermediate);
        smoothLookAts.push(intermediateLookAt);
        
        // Add second intermediate for even smoother curves
        const intermediate2 = current.clone().lerp(next, 0.7);
        const intermediateLookAt2 = currentLookAt.clone().lerp(nextLookAt, 0.7);
        intermediate2.y += Math.cos(i * 0.6) * 0.2;
        
        // FORCE HORIZONTAL LOOKING
        intermediateLookAt2.y = intermediate2.y; // Look straight ahead at same height
        
        smoothPoints.push(intermediate2);
        smoothLookAts.push(intermediateLookAt2);
      }
    }

    // PERFECT LOOP CLOSURE: Ensure seamless transition from end to start
    if (closed && smoothPoints.length > 0) {
      // Don't add extra bridge points - just ensure the curve closes properly
      // The CatmullRomCurve3 with closed=true will handle the smooth closure
    }

    this.points = smoothPoints;
    this.lookAtPoints = smoothLookAts;
    
    // Create ultra-smooth curves with perfect loop closure
    this.curve = new THREE.CatmullRomCurve3(this.points, closed);
    this.lookAtCurve = new THREE.CatmullRomCurve3(this.lookAtPoints, closed);
    
    // Optimize curve tension for cinematics - smoother is better for loops
    this.curve.tension = 0.5; // Standard tension for predictable loops
    this.lookAtCurve.tension = 0.5; // Same tension for consistency
    
    this.totalLength = this.curve.getLength();
  }

  getPositionAt(t: number): THREE.Vector3 {
    if (!this.curve) return new THREE.Vector3();
    
    // Perfect loop: ensure t wraps seamlessly
    const loopT = ((t % 1) + 1) % 1; // Handle negative values
    return this.curve.getPointAt(loopT);
  }

  getLookAtTarget(t: number, photoPositions: PhotoPosition[], focusDistance: number, pathType?: string): THREE.Vector3 {
    const loopT = ((t % 1) + 1) % 1;
    const currentPos = this.getPositionAt(t);
    
    // The focus distance now affects how the camera behaves
    const effectiveFocusDistance = focusDistance || 12;
    
    // GRACEFUL LOOK: Natural forward-looking with gentle vertical limits
    if (pathType === 'showcase' || pathType === 'grid_sweep') {
      // Look ahead in movement direction with focus-based distance
      const lookAheadT = (loopT + (0.01 + (25 - effectiveFocusDistance) * 0.001)) % 1;
      const lookAheadPos = this.getPositionAt(lookAheadT);
      
      // Create natural look direction
      const lookDirection = lookAheadPos.clone().sub(currentPos);
      
      // Focus affects how far we look - smaller focus = look closer, larger = look farther
      const lookMultiplier = effectiveFocusDistance / 12; // Normalized to default
      
      // Gentle vertical constraint
      const horizontalDistance = Math.sqrt(lookDirection.x * lookDirection.x + lookDirection.z * lookDirection.z);
      const verticalAngle = Math.atan2(lookDirection.y, horizontalDistance);
      
      const maxVerticalAngle = 0.26;
      if (Math.abs(verticalAngle) > maxVerticalAngle) {
        const clampedAngle = Math.sign(verticalAngle) * maxVerticalAngle;
        lookDirection.y = Math.tan(clampedAngle) * horizontalDistance;
      }
      
      lookDirection.normalize();
      
      // Focus distance affects how far ahead we look
      const lookTarget = currentPos.clone();
      lookTarget.x += lookDirection.x * effectiveFocusDistance;
      lookTarget.y += lookDirection.y * effectiveFocusDistance * 0.5;
      lookTarget.z += lookDirection.z * effectiveFocusDistance;
      
      // With smaller focus, look for nearby photos to focus on
      if (effectiveFocusDistance < 15) {
        const nearbyPhotos = photoPositions
          .filter(p => !p.id.startsWith('placeholder-'))
          .map(p => ({
            photo: p,
            distance: currentPos.distanceTo(new THREE.Vector3(...p.position))
          }))
          .filter(p => p.distance <= effectiveFocusDistance)
          .sort((a, b) => a.distance - b.distance);

        if (nearbyPhotos.length > 0) {
          const photoTarget = new THREE.Vector3(...nearbyPhotos[0].photo.position);
          // Stronger blend with smaller focus distance
          const blendFactor = Math.min(1.0, (16 - effectiveFocusDistance) / 8);
          lookTarget.lerp(photoTarget, blendFactor);
        }
      }
      
      return lookTarget;
    }
    
    // Special handling for photo_focus path
    if (pathType === 'photo_focus') {
      // Focus distance strongly affects photo detection range
      const detectionRange = effectiveFocusDistance * 1.5;
      
      const nearbyPhotos = photoPositions
        .filter(p => !p.id.startsWith('placeholder-'))
        .map(p => ({
          photo: p,
          distance: currentPos.distanceTo(new THREE.Vector3(...p.position))
        }))
        .filter(p => p.distance <= detectionRange)
        .sort((a, b) => a.distance - b.distance);

      if (nearbyPhotos.length > 0) {
        const photoTarget = new THREE.Vector3(...nearbyPhotos[0].photo.position);
        
        // Graceful viewing angle
        const toPhoto = photoTarget.clone().sub(currentPos);
        const horizontalDist = Math.sqrt(toPhoto.x * toPhoto.x + toPhoto.z * toPhoto.z);
        const currentAngle = Math.atan2(-toPhoto.y, horizontalDist);
        
        const maxDownAngle = 0.52;
        if (currentAngle > maxDownAngle) {
          const adjustedY = currentPos.y - Math.tan(maxDownAngle) * horizontalDist;
          photoTarget.y = adjustedY;
        }
        
        return photoTarget;
      }
      
      // If no photos in range, look ahead based on focus distance
      const lookAheadT = (loopT + 0.05) % 1;
      const lookAheadPos = this.getPositionAt(lookAheadT);
      const direction = lookAheadPos.clone().sub(currentPos);
      direction.normalize();
      return currentPos.clone().add(direction.multiplyScalar(effectiveFocusDistance));
    }
    
    // For other paths, use focus distance to determine look behavior
    if (!this.lookAtCurve) {
      const lookAheadT = (t + 0.05) % 1;
      const lookAheadPos = this.getPositionAt(lookAheadT);
      
      const direction = lookAheadPos.clone().sub(currentPos);
      if (direction.y < -2) direction.y = -2;
      if (direction.y > 2) direction.y = 2;
      direction.normalize();
      
      const target = currentPos.clone().add(direction.multiplyScalar(effectiveFocusDistance));
      return target;
    }
    
    const baseLookAt = this.lookAtCurve.getPointAt(loopT);
    
    // Focus distance affects how we blend with nearby photos
    const nearbyPhotos = photoPositions
      .filter(p => !p.id.startsWith('placeholder-'))
      .map(p => ({
        photo: p,
        distance: currentPos.distanceTo(new THREE.Vector3(...p.position))
      }))
      .filter(p => p.distance <= effectiveFocusDistance)
      .sort((a, b) => a.distance - b.distance);

    if (nearbyPhotos.length > 0) {
      const photoTarget = new THREE.Vector3(...nearbyPhotos[0].photo.position);
      // Stronger blend with closer focus distance
      const blendFactor = Math.min(0.8, effectiveFocusDistance / nearbyPhotos[0].distance);
      
      // Ensure we don't look down too steeply
      const heightDiff = currentPos.y - photoTarget.y;
      if (heightDiff > 3) {
        photoTarget.y = currentPos.y - 2;
      }
      
      return baseLookAt.lerp(photoTarget, blendFactor);
    }
    
    // Gentle constraint on base look-at
    const toLookAt = baseLookAt.clone().sub(currentPos);
    const horizontalDist = Math.sqrt(toLookAt.x * toLookAt.x + toLookAt.z * toLookAt.z);
    const verticalAngle = Math.atan2(toLookAt.y, horizontalDist);
    
    const maxAngle = 0.44;
    if (Math.abs(verticalAngle) > maxAngle) {
      const clampedAngle = Math.sign(verticalAngle) * maxAngle;
      baseLookAt.y = currentPos.y + Math.tan(clampedAngle) * horizontalDist;
    }
    
    return baseLookAt;
  }

  getTotalLength(): number {
    return this.totalLength;
  }

  // Get tangent for smooth orientation transitions
  getTangentAt(t: number): THREE.Vector3 {
    if (!this.curve) return new THREE.Vector3(0, 0, 1);
    
    const loopT = ((t % 1) + 1) % 1;
    return this.curve.getTangentAt(loopT);
  }
}

// Enhanced path generators with perfect loops and graceful turns
class CinematicPathGenerator {
  static generateShowcasePath(photos: PhotoPosition[], settings: any): { positions: THREE.Vector3[], lookAts: THREE.Vector3[] } {
    if (!photos.length) return { positions: [], lookAts: [] };

    const photoSize = settings.photoSize || 4;
    const baseHeight = settings.baseHeight ?? 0; // Use baseHeight from settings
    const heightVar = settings.heightVariation ?? 2; // Use heightVariation
    const distanceVar = settings.distanceVariation ?? 5; // Use distanceVariation
    const baseRadius = (settings.baseDistance ?? photoSize * 4);

    // Find collection center
    const bounds = this.getPhotoBounds(photos);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;

    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];
    
    const totalPoints = 32;
    
    for (let i = 0; i < totalPoints; i++) {
      const progress = i / totalPoints;
      const orbitAngle = progress * Math.PI * 2;
      
      // Apply distance variation - camera moves in and out
      const radiusOffset = Math.sin(progress * Math.PI * 3) * distanceVar;
      const currentRadius = baseRadius + radiusOffset;
      
      // Apply height variation - camera moves up and down
      const heightOffset = Math.sin(progress * Math.PI * 4) * heightVar;
      
      const cameraPos = new THREE.Vector3(
        centerX + Math.cos(orbitAngle) * currentRadius,
        baseHeight + heightOffset,
        centerZ + Math.sin(orbitAngle) * currentRadius
      );
      
      // Look slightly ahead and inward
      const lookAngle = orbitAngle + 0.15;
      const lookRadius = currentRadius * 0.7;
      
      const lookTarget = new THREE.Vector3(
        centerX + Math.cos(lookAngle) * lookRadius,
        baseHeight,
        centerZ + Math.sin(lookAngle) * lookRadius
      );
      
      positions.push(cameraPos);
      lookAts.push(lookTarget);
    }

    return { positions, lookAts };
  }

  static generateGalleryWalkPath(photos: PhotoPosition[], settings: any): { positions: THREE.Vector3[], lookAts: THREE.Vector3[] } {
    if (!photos.length) return { positions: [], lookAts: [] };

    const photoSize = settings.photoSize || 4;
    const walkHeight = -3;
    const walkDistance = photoSize * 2.5;

    // Sort for natural gallery flow
    const sortedPhotos = [...photos].sort((a, b) => {
      if (Math.abs(a.position[2] - b.position[2]) > photoSize) {
        return b.position[2] - a.position[2];
      }
      return a.position[0] - b.position[0];
    });

    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];

    sortedPhotos.forEach((photo, index) => {
      // SMOOTH WALKING PATH: Natural human-like movement
      const walkProgress = index / sortedPhotos.length;
      const pathCurve = Math.sin(walkProgress * Math.PI * 2) * photoSize * 0.15;
      const heightWalk = Math.sin(walkProgress * Math.PI * 4) * 0.8;
      
      const cameraPos = new THREE.Vector3(
        photo.position[0] + pathCurve,
        walkHeight + heightWalk,
        photo.position[2] + walkDistance
      );
      
      // GRACEFUL LOOK-AT: Gallery visitor perspective
      const lookTarget = new THREE.Vector3(...photo.position);
      lookTarget.y = Math.max(lookTarget.y, cameraPos.y - 1.5); // Natural viewing angle
      
      positions.push(cameraPos);
      lookAts.push(lookTarget);
    });

    return { positions, lookAts };
  }

  static generateSpiralTourPath(photos: PhotoPosition[], settings: any): { positions: THREE.Vector3[], lookAts: THREE.Vector3[] } {
    if (!photos.length) return { positions: [], lookAts: [] };

    const photoSize = settings.photoSize || 4;
    const spiralHeight = -2;

    const bounds = this.getPhotoBounds(photos);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const maxRadius = Math.max(bounds.maxX - centerX, bounds.maxZ - centerZ) + photoSize * 2;

    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];
    const spiralTurns = 2.5; // Fewer turns for smoother loop
    const pointsPerTurn = 24; // More points for ultra-smooth spiral
    const totalPoints = Math.floor(spiralTurns * pointsPerTurn);

    for (let i = 0; i < totalPoints; i++) {
      const t = i / totalPoints;
      
      // PERFECT SPIRAL: Smooth radius and angle progression
      const angle = t * spiralTurns * Math.PI * 2;
      const radius = maxRadius * (0.4 + t * 0.6); // Start closer to center
      const height = spiralHeight + Math.sin(t * Math.PI * 3) * 2.5; // Gentle height waves
      
      const cameraPos = new THREE.Vector3(
        centerX + Math.cos(angle) * radius,
        height,
        centerZ + Math.sin(angle) * radius
      );
      
      // FORWARD-FACING SPIRAL: Look towards center with slight lead
      const lookAheadAngle = angle + 0.2; // Look slightly ahead in spiral
      const lookAtPos = new THREE.Vector3(
        centerX + Math.cos(lookAheadAngle) * (radius * 0.3),
        height - 1,
        centerZ + Math.sin(lookAheadAngle) * (radius * 0.3)
      );
      
      positions.push(cameraPos);
      lookAts.push(lookAtPos);
    }

    return { positions, lookAts };
  }

  static generateWaveFollowPath(photos: PhotoPosition[], settings: any): { positions: THREE.Vector3[], lookAts: THREE.Vector3[] } {
    if (!photos.length) return { positions: [], lookAts: [] };

    const photoSize = settings.photoSize || 4;
    const waveHeight = -2;

    const sortedPhotos = [...photos].sort((a, b) => a.position[0] - b.position[0]);
    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];

    sortedPhotos.forEach((photo, index) => {
      const progress = index / sortedPhotos.length;
      
      // SMOOTH WAVE: Flowing sine wave movement
      const waveOffset = Math.sin(progress * Math.PI * 3) * photoSize * 1.2;
      const heightWave = Math.sin(progress * Math.PI * 2) * 2;
      const forwardLead = Math.cos(progress * Math.PI * 4) * photoSize * 0.3;
      
      const cameraPos = new THREE.Vector3(
        photo.position[0] + forwardLead,
        waveHeight + heightWave,
        photo.position[2] - photoSize * 1.8 + waveOffset
      );
      
      // GRACEFUL WAVE LOOK-AT: Follow wave flow
      const nextIndex = (index + 1) % sortedPhotos.length;
      const nextPhoto = sortedPhotos[nextIndex];
      const blendedTarget = new THREE.Vector3(...photo.position).lerp(
        new THREE.Vector3(...nextPhoto.position), 0.3
      );
      blendedTarget.y = Math.max(blendedTarget.y, cameraPos.y - 2);
      
      positions.push(cameraPos);
      lookAts.push(blendedTarget);
    });

    return { positions, lookAts };
  }

  static generateGridSweepPath(photos: PhotoPosition[], settings: any): { positions: THREE.Vector3[], lookAts: THREE.Vector3[] } {
    if (!photos.length) return { positions: [], lookAts: [] };

    const photoSize = settings.photoSize || 4;
    const baseHeight = settings.baseHeight ?? 0;
    const heightVar = settings.heightVariation ?? 1;
    const distanceVar = settings.distanceVariation ?? 3;

    const bounds = this.getPhotoBounds(photos);
    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const baseRadius = (settings.baseDistance ?? Math.max(bounds.maxX - centerX, bounds.maxZ - centerZ) + photoSize * 2.5);

    const totalPoints = 24;
    
    for (let i = 0; i < totalPoints; i++) {
      const progress = i / totalPoints;
      const angle = progress * Math.PI * 2;
      
      // Apply distance variation - breathe in and out
      const radiusOffset = Math.sin(progress * Math.PI * 2) * distanceVar;
      const currentRadius = baseRadius + radiusOffset;
      
      // Apply height variation - gentle wave up and down
      const heightOffset = Math.sin(progress * Math.PI * 3) * heightVar;
      
      const position = new THREE.Vector3(
        centerX + Math.cos(angle) * currentRadius,
        baseHeight + heightOffset,
        centerZ + Math.sin(angle) * currentRadius
      );
      
      // Look ahead in movement direction
      const lookAngle = angle + 0.1;
      const lookRadius = currentRadius * 0.8;
      
      const lookTarget = new THREE.Vector3(
        centerX + Math.cos(lookAngle) * lookRadius,
        baseHeight,
        centerZ + Math.sin(lookAngle) * lookRadius
      );
      
      positions.push(position);
      lookAts.push(lookTarget);
    }

    return { positions, lookAts };
  }

  static generatePhotoFocusPath(photos: PhotoPosition[], settings: any): { positions: THREE.Vector3[], lookAts: THREE.Vector3[] } {
    if (!photos.length) return { positions: [], lookAts: [] };

    const photoSize = settings.photoSize || 4;
    const baseHeight = settings.baseHeight ?? 0;
    const heightVar = settings.heightVariation ?? 2;
    const distanceVar = settings.distanceVariation ?? 4;
    const viewRadius = (settings.baseDistance ?? photoSize * 3);

    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];

    const bounds = this.getPhotoBounds(photos);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const baseRadius = Math.max(bounds.maxX - centerX, bounds.maxZ - centerZ) + viewRadius;

    const totalPoints = 36;
    
    for (let i = 0; i < totalPoints; i++) {
      const progress = i / totalPoints;
      const angle = progress * Math.PI * 2;
      
      // Apply variations for more dynamic movement
      const radiusOffset = Math.sin(progress * Math.PI * 4) * distanceVar;
      const currentRadius = baseRadius + radiusOffset;
      
      const heightOffset = Math.sin(progress * Math.PI * 6) * heightVar;
      
      const cameraPos = new THREE.Vector3(
        centerX + Math.cos(angle) * currentRadius,
        baseHeight + heightOffset,
        centerZ + Math.sin(angle) * currentRadius
      );
      
      // Look inward with dynamic targeting
      const inwardDistance = currentRadius * 0.4;
      const lookTarget = new THREE.Vector3(
        centerX + Math.cos(angle) * inwardDistance,
        baseHeight - 0.5,
        centerZ + Math.sin(angle) * inwardDistance
      );
      
      positions.push(cameraPos);
      lookAts.push(lookTarget);
    }

    return { positions, lookAts };
  }

  private static getPhotoBounds(photos: PhotoPosition[]) {
    const positions = photos.map(p => p.position);
    return {
      minX: Math.min(...positions.map(p => p[0])),
      maxX: Math.max(...positions.map(p => p[0])),
      minZ: Math.min(...positions.map(p => p[2])),
      maxZ: Math.max(...positions.map(p => p[2]))
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
  const pathTypeRef = useRef<string>('');
  
  // Photo focus specific state
  const currentPhotoIndexRef = useRef(0);
  const photoFocusTimerRef = useRef(0);
  const photoFocusDurationRef = useRef(2); // Seconds per photo
  
  // Enhanced interaction tracking
  const lastUserPositionRef = useRef<THREE.Vector3>();
  const lastUserTargetRef = useRef<THREE.Vector3>();
  const resumeBlendRef = useRef(0);
  const isResuming = useRef(false);
  
  // Dynamic variation tracking for real-time effects
  const dynamicVariationRef = useRef(0);

  // Automatic config change detection
  const lastConfigRef = useRef<string>('');
  const isConfigTransitioningRef = useRef(false);
  const configTransitionStartRef = useRef(0);
  const configStartPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const configStartLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // Generate perfect loop camera path
  const cameraPath = useMemo(() => {
    if (!config?.enabled || !photoPositions.length || config.type === 'none') {
      return null;
    }

    const validPhotos = photoPositions.filter(p => p.id && !p.id.startsWith('placeholder-'));
    if (!validPhotos.length) return null;

    console.log(`🎬 Generating PERFECT LOOP ${config.type} path for ${validPhotos.length} photos`);
    console.log(`📊 Config - Focus: ${config.focusDistance}, HeightVar: ${config.heightVariation}, DistanceVar: ${config.distanceVariation}`);

    let pathData: { positions: THREE.Vector3[], lookAts: THREE.Vector3[] };

    pathTypeRef.current = config.type;

    // Pass the config to path generators so they can use variations
    const enhancedSettings = {
      ...settings,
      heightVariation: config.heightVariation,
      distanceVariation: config.distanceVariation,
      baseHeight: config.baseHeight,
      baseDistance: config.baseDistance
    };

    switch (config.type) {
      case 'showcase':
        pathData = CinematicPathGenerator.generateShowcasePath(validPhotos, enhancedSettings);
        break;
      case 'gallery_walk':
        pathData = CinematicPathGenerator.generateGalleryWalkPath(validPhotos, enhancedSettings);
        break;
      case 'spiral_tour':
        pathData = CinematicPathGenerator.generateSpiralTourPath(validPhotos, enhancedSettings);
        break;
      case 'wave_follow':
        pathData = CinematicPathGenerator.generateWaveFollowPath(validPhotos, enhancedSettings);
        break;
      case 'grid_sweep':
        pathData = CinematicPathGenerator.generateGridSweepPath(validPhotos, enhancedSettings);
        break;
      case 'photo_focus':
        pathData = CinematicPathGenerator.generatePhotoFocusPath(validPhotos, enhancedSettings);
        currentPhotoIndexRef.current = 0;
        photoFocusTimerRef.current = 0;
        break;
      default:
        return null;
    }

    if (pathData.positions.length < 2) return null;

    // Create perfect loop with graceful look-at transitions
    const smoothPath = new SmoothCameraPath(pathData.positions, pathData.lookAts, true);
    
    pathProgressRef.current = 0;
    visibilityTrackerRef.current.clear();
    
    return smoothPath;
  }, [photoPositions, config?.type, config?.enabled, settings, animationPattern, config?.focusDistance, config?.heightVariation, config?.distanceVariation, config?.baseHeight, config?.baseDistance]);

  // Update path reference
  useEffect(() => {
    currentPathRef.current = cameraPath;
  }, [cameraPath]);

  // Enhanced user interaction detection - NO MOUSE HOVER
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas || !config?.enabled) return;

    const ignoreMouseMovement = config.ignoreMouseMovement !== false;
    const sensitivity = config.interactionSensitivity || 'medium';

    const handleInteractionStart = (e: Event) => {
      const eventType = e.type;
      
      if (eventType === 'mousedown' || eventType === 'touchstart') {
        console.log('🎮 User interaction started -', eventType);
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
          console.log('🎮 Wheel interaction');
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
          console.log('🎬 Auto-resuming graceful animation');
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

  // OrbitControls integration
  useEffect(() => {
    if (!controls || !config?.enabled) return;

    const handleControlStart = () => {
      console.log('🎮 OrbitControls interaction started');
      userInteractingRef.current = true;
      lastInteractionRef.current = Date.now();
    };

    const handleControlEnd = () => {
      lastInteractionRef.current = Date.now();
      
      const resumeDelay = (config.resumeDelay || 2.0) * 1000;
      setTimeout(() => {
        userInteractingRef.current = false;
        console.log('🎬 Auto-resuming after OrbitControls');
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

  // PERFECT LOOP animation with graceful turns
  useFrame((state, delta) => {
    if (!config?.enabled || !currentPathRef.current || config.type === 'none') {
      isActiveRef.current = false;
      return;
    }

    // Auto config change detection
    const currentConfigKey = `${config.type}-${config.speed}-${animationPattern}-${config.enabled}`;
    
    if (lastConfigRef.current !== '' && lastConfigRef.current !== currentConfigKey) {
      console.log(`🎬 CONFIG CHANGE: ${lastConfigRef.current} → ${currentConfigKey}`);
      
      isConfigTransitioningRef.current = true;
      configTransitionStartRef.current = Date.now();
      
      configStartPositionRef.current.copy(camera.position);
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      configStartLookAtRef.current.addVectors(camera.position, direction.multiplyScalar(50));
      
      // Reset photo focus state on config change
      if (config.type === 'photo_focus') {
        currentPhotoIndexRef.current = 0;
        photoFocusTimerRef.current = 0;
      }
    }
    
    lastConfigRef.current = currentConfigKey;

    // Check for user interaction pause
    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const pauseDuration = (config.resumeDelay || 2.0) * 1000;

    if (userInteractingRef.current || timeSinceInteraction < pauseDuration) {
      isActiveRef.current = false;
      if (userInteractingRef.current && config.enableManualControl !== false) {
        return;
      }
      return;
    }

    // Resume animation with smooth blending
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      isResuming.current = true;
      resumeBlendRef.current = 0;
      console.log('🎬 Gracefully resuming perfect loop');
    }

    // Normal speed-based movement with more dramatic speed range
    const speedMultiplier = config.speed || 1.0;
    
    // Make speed more dramatic: 0.2 = very slow, 1.0 = normal, 3.0 = quite fast
    // Using exponential scaling for better feel
    const effectiveSpeed = Math.pow(speedMultiplier, 1.5) * 0.018;
    
    pathProgressRef.current += delta * effectiveSpeed;
    
    // SEAMLESS LOOP: Perfect modulo handling
    pathProgressRef.current = pathProgressRef.current % 1;
    if (pathProgressRef.current < 0) pathProgressRef.current += 1;
    
    // Update dynamic variation for real-time effects
    dynamicVariationRef.current += delta * 0.5; // Slow oscillation

    // Get base positions from path
    const basePosition = currentPathRef.current.getPositionAt(pathProgressRef.current);
    const baseLookAt = currentPathRef.current.getLookAtTarget(
      pathProgressRef.current, 
      photoPositions, 
      config.focusDistance || 12,
      pathTypeRef.current
    );
    
    // Apply DYNAMIC variations on top of the path (like vertical drift and distance variation)
    let targetPosition = basePosition.clone();
    let lookAtTarget = baseLookAt.clone();
    
    // ENHANCED VERTICAL DRIFT - Much more dramatic effect
    const verticalDrift = config.verticalDrift ?? 0;
    if (verticalDrift > 0) {
      // Multiple wave frequencies for complex movement
      const primaryWave = Math.sin(dynamicVariationRef.current * 0.3) * verticalDrift * 2.0; // Doubled amplitude
      const secondaryWave = Math.sin(dynamicVariationRef.current * 0.7) * verticalDrift * 0.5;
      const tertiaryWave = Math.cos(dynamicVariationRef.current * 1.1) * verticalDrift * 0.3;
      
      // Combine waves for organic movement
      const totalDrift = primaryWave + secondaryWave + tertiaryWave;
      
      targetPosition.y += totalDrift;
      
      // Make look target drift too for more dramatic effect
      lookAtTarget.y += totalDrift * 0.5;
      
      // Add slight position wobble for extreme drift values
      if (verticalDrift > 5) {
        targetPosition.x += Math.sin(dynamicVariationRef.current * 0.4) * verticalDrift * 0.1;
        targetPosition.z += Math.cos(dynamicVariationRef.current * 0.4) * verticalDrift * 0.1;
      }
    }
    
    // ENHANCED DISTANCE VARIATION - Much more dramatic breathing effect
    const dynamicDistanceVar = config.dynamicDistanceVariation ?? 0;
    if (dynamicDistanceVar > 0) {
      const bounds = photoPositions.length > 0 ? 
        photoPositions.reduce((acc, p) => {
          acc.centerX += p.position[0];
          acc.centerZ += p.position[2];
          acc.count++;
          return acc;
        }, { centerX: 0, centerZ: 0, count: 0 }) : 
        { centerX: 0, centerZ: 0, count: 1 };
      
      const centerX = bounds.centerX / bounds.count;
      const centerZ = bounds.centerZ / bounds.count;
      
      // Calculate direction from center
      const dirFromCenter = new THREE.Vector3(
        targetPosition.x - centerX,
        0,
        targetPosition.z - centerZ
      );
      
      if (dirFromCenter.length() > 0.1) {
        dirFromCenter.normalize();
        
        // DRAMATIC breathing effect with multiple frequencies
        const primaryBreath = Math.sin(dynamicVariationRef.current * 0.25) * dynamicDistanceVar * 1.5; // Main breathing
        const secondaryBreath = Math.sin(dynamicVariationRef.current * 0.6) * dynamicDistanceVar * 0.5; // Faster pulse
        const heartbeat = Math.sin(dynamicVariationRef.current * 2.0) * dynamicDistanceVar * 0.2; // Quick heartbeat
        
        const totalBreath = primaryBreath + secondaryBreath + heartbeat;
        
        // Apply dramatic in/out movement
        targetPosition.x += dirFromCenter.x * totalBreath;
        targetPosition.z += dirFromCenter.z * totalBreath;
        
        // For extreme values, also affect height for swooping effect
        if (dynamicDistanceVar > 10) {
          const swoopAmount = Math.sin(dynamicVariationRef.current * 0.3 + Math.PI/2) * dynamicDistanceVar * 0.3;
          targetPosition.y += swoopAmount;
        }
        
        // Make look target breathe too for more immersive effect
        if (dynamicDistanceVar > 5) {
          const lookBreath = totalBreath * 0.3;
          lookAtTarget.x += dirFromCenter.x * lookBreath;
          lookAtTarget.z += dirFromCenter.z * lookBreath;
        }
      }
    }
    
    // COMBINED EFFECT AMPLIFIER - When both are active, create swirling motion
    if (verticalDrift > 3 && dynamicDistanceVar > 5) {
      const swirlAngle = dynamicVariationRef.current * 0.5;
      const swirlRadius = Math.min(verticalDrift, dynamicDistanceVar) * 0.2;
      
      targetPosition.x += Math.cos(swirlAngle) * swirlRadius;
      targetPosition.z += Math.sin(swirlAngle) * swirlRadius;
    }
    
    // Apply ELEVATION CONSTRAINTS if specified
    // This controls the vertical angle range of the camera's view
    if (config.elevationMin !== undefined || config.elevationMax !== undefined) {
      const toTarget = lookAtTarget.clone().sub(targetPosition);
      const horizontalDistance = Math.sqrt(toTarget.x * toTarget.x + toTarget.z * toTarget.z);
      
      if (horizontalDistance > 0.1) {
        // Calculate current elevation angle (negative = looking down, positive = looking up)
        const currentElevation = Math.atan2(toTarget.y, horizontalDistance);
        
        // Apply min/max constraints with defaults
        const minElevation = config.elevationMin ?? -Math.PI / 3; // Default: can look down 60 degrees
        const maxElevation = config.elevationMax ?? Math.PI / 3;   // Default: can look up 60 degrees
        
        // Clamp the elevation angle
        let targetElevation = currentElevation;
        if (currentElevation < minElevation) {
          targetElevation = minElevation;
        } else if (currentElevation > maxElevation) {
          targetElevation = maxElevation;
        }
        
        // If we had to clamp, adjust the look target
        if (targetElevation !== currentElevation) {
          // Calculate new vertical offset based on clamped angle
          const newY = Math.tan(targetElevation) * horizontalDistance;
          lookAtTarget.y = targetPosition.y + newY;
        }
        
        // For dramatic effect: oscillate between min and max if both are set
        const elevationOscillation = config.elevationOscillation ?? 0;
        if (elevationOscillation > 0 && config.elevationMin !== undefined && config.elevationMax !== undefined) {
          const oscAmount = (Math.sin(dynamicVariationRef.current * 0.2) + 1) / 2; // 0 to 1
          const oscElevation = minElevation + (maxElevation - minElevation) * oscAmount;
          const oscY = Math.tan(oscElevation) * horizontalDistance;
          
          // Blend between target and oscillating elevation
          lookAtTarget.y = lookAtTarget.y * (1 - elevationOscillation) + (targetPosition.y + oscY) * elevationOscillation;
        }
      }
    }

    // Handle config transitions
    const configTransitionTime = 3000; // 3 seconds for smooth transitions
    const timeSinceConfigChange = Date.now() - configTransitionStartRef.current;
    
    if (isConfigTransitioningRef.current && timeSinceConfigChange < configTransitionTime) {
      const blendFactor = Math.min(timeSinceConfigChange / configTransitionTime, 1);
      
      // Ultra-smooth easing function
      const easeInOutQuart = (t: number) => {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
      };
      const smoothBlend = easeInOutQuart(blendFactor);
      
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

    // GRACEFUL MOVEMENT: Ultra-smooth lerping
    let lerpFactor = 0.02; // Smooth movement
    
    if (isResuming.current) {
      const blendDuration = config.blendDuration || 2.5;
      resumeBlendRef.current += delta;
      
      if (resumeBlendRef.current < blendDuration) {
        const blendProgress = resumeBlendRef.current / blendDuration;
        const smoothBlend = blendProgress * blendProgress * (3 - 2 * blendProgress); // Smoothstep
        lerpFactor = 0.01 + (smoothBlend * 0.015);
      } else {
        isResuming.current = false;
        console.log('🎬 Resume blend complete');
      }
    }

    // Apply ultra-smooth camera movement
    camera.position.lerp(targetPosition, lerpFactor);
    camera.lookAt(lookAtTarget);

    // Update controls with smooth, graceful transitions
    if (controls && 'target' in controls) {
      const currentTarget = (controls as any).target.clone();
      const targetDiff = lookAtTarget.clone().sub(currentTarget);
      
      // For problematic modes, use stronger but still smooth control
      if (pathTypeRef.current === 'showcase' || pathTypeRef.current === 'grid_sweep' || pathTypeRef.current === 'photo_focus') {
        // Stronger influence but still smooth
        const strongLerpFactor = Math.min(lerpFactor * 2, 0.08); // Faster but capped
        (controls as any).target.lerp(lookAtTarget, strongLerpFactor);
      } else {
        // Normal smooth lerping for other modes
        (controls as any).target.lerp(lookAtTarget, lerpFactor * 0.7);
      }
      
      (controls as any).update();
    }

    // Track visibility
    photoPositions.forEach(photo => {
      if (!photo.id.startsWith('placeholder-')) {
        const photoVec = new THREE.Vector3(...photo.position);
        const distance = camera.position.distanceTo(photoVec);
        if (distance <= (config.focusDistance || 12)) {
          visibilityTrackerRef.current.add(photo.id);
        }
      }
    });

    // Progress logging
    if (Math.floor(pathProgressRef.current * 100) % 25 === 0) {
      const viewedCount = visibilityTrackerRef.current.size;
      const totalPhotos = photoPositions.filter(p => !p.id.startsWith('placeholder-')).length;
      
      console.log(`🎬 Loop Progress: ${Math.round(pathProgressRef.current * 100)}%`);
    }
  });

  // Debug info
  useEffect(() => {
    if (config?.enabled && cameraPath) {
      const speedInfo = config.speed ? 
        `${config.speed.toFixed(1)}x (${config.speed < 0.5 ? 'very slow' : config.speed < 1.5 ? 'normal' : config.speed < 2.5 ? 'fast' : 'very fast'})` : 
        '1.0x (normal)';
      
      console.log(`🎬 ✨ CINEMATIC CAMERA ACTIVE ✨`);
      console.log(`🚀 Speed: ${speedInfo}`);
      console.log(`🎯 Focus Distance: ${config.focusDistance || 12} units`);
      console.log(`📊 Height Variation: ${config.heightVariation ?? 'auto'}`);
      console.log(`📐 Distance Variation: ${config.distanceVariation ?? 'auto'}`);
      console.log(`🎥 Animation Type: ${config.type}`);
    }
  }, [config?.enabled, config?.type, cameraPath, config?.speed, config?.focusDistance, config?.heightVariation, config?.distanceVariation]);

  return null;
};

export default SmoothCinematicCameraController;