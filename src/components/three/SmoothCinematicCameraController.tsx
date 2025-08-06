// src/components/three/SmoothCinematicCameraController.tsx - PERFECT LOOPS + GRACEFUL TURNS
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
      smoothLookAts.push(currentLookAt.clone());
      
      // Add intermediate points for ultra-smooth curves (except for last segment if not closed)
      if (i < waypoints.length - 1 || closed) {
        // Create graceful intermediate position
        const intermediate = current.clone().lerp(next, 0.4);
        const intermediateLookAt = currentLookAt.clone().lerp(nextLookAt, 0.4);
        
        // GENTLE height variation for cinematic feel - NO STEEP ANGLES
        intermediate.y += Math.sin(i * 0.8) * 0.6; // Reduced vertical movement
        
        // CRITICAL FIX: Ensure look-at targets NEVER cause steep downward angles
        const heightDifference = intermediateLookAt.y - intermediate.y;
        if (heightDifference < -1.5) { // If looking down more than 1.5 units
          intermediateLookAt.y = intermediate.y - 1.5; // Limit downward angle
        }
        
        smoothPoints.push(intermediate);
        smoothLookAts.push(intermediateLookAt);
        
        // Add second intermediate for even smoother curves
        const intermediate2 = current.clone().lerp(next, 0.7);
        const intermediateLookAt2 = currentLookAt.clone().lerp(nextLookAt, 0.7);
        intermediate2.y += Math.cos(i * 0.6) * 0.4;
        
        // Apply same height constraint
        const heightDifference2 = intermediateLookAt2.y - intermediate2.y;
        if (heightDifference2 < -1.5) {
          intermediateLookAt2.y = intermediate2.y - 1.5;
        }
        
        smoothPoints.push(intermediate2);
        smoothLookAts.push(intermediateLookAt2);
      }
    }

    // PERFECT LOOP CLOSURE: Ensure seamless transition from end to start
    if (closed && smoothPoints.length > 0) {
      // Add transition points that smoothly connect end back to start
      const endPoint = smoothPoints[smoothPoints.length - 1];
      const startPoint = smoothPoints[0];
      const endLookAt = smoothLookAts[smoothLookAts.length - 1];
      const startLookAt = smoothLookAts[0];
      
      // Create bridge points for perfect loop - more bridge points for smoother closure
      for (let i = 1; i <= 3; i++) {
        const t = i / 4; // 0.25, 0.5, 0.75
        const bridgePoint = endPoint.clone().lerp(startPoint, t);
        const bridgeLookAt = endLookAt.clone().lerp(startLookAt, t);
        
        // Ensure smooth height transition for loop
        bridgePoint.y += Math.sin(smoothPoints.length * 0.1 + i) * 0.2;
        
        // CRITICAL: Apply same height constraint for bridge points
        const heightDifference = bridgeLookAt.y - bridgePoint.y;
        if (heightDifference < -1.5) {
          bridgeLookAt.y = bridgePoint.y - 1.5;
        }
        
        smoothPoints.push(bridgePoint);
        smoothLookAts.push(bridgeLookAt);
      }
    }

    this.points = smoothPoints;
    this.lookAtPoints = smoothLookAts;
    
    // Create ultra-smooth curves with perfect loop closure
    this.curve = new THREE.CatmullRomCurve3(this.points, closed);
    this.lookAtCurve = new THREE.CatmullRomCurve3(this.lookAtPoints, closed);
    
    // Optimize curve tension for cinematics - smoother is better for loops
    this.curve.tension = 0.15; // Even lower tension = smoother curves
    this.lookAtCurve.tension = 0.05; // Ultra-smooth look-at transitions
    
    this.totalLength = this.curve.getLength();
  }

  getPositionAt(t: number): THREE.Vector3 {
    if (!this.curve) return new THREE.Vector3();
    
    // Perfect loop: ensure t wraps seamlessly
    const loopT = ((t % 1) + 1) % 1; // Handle negative values
    return this.curve.getPointAt(loopT);
  }

  getLookAtTarget(t: number, photoPositions: PhotoPosition[], focusDistance: number): THREE.Vector3 {
    if (!this.lookAtCurve) {
      // Fallback: look ahead along path
      const currentPos = this.getPositionAt(t);
      const lookAheadT = (t + 0.05) % 1;
      const lookAheadPos = this.getPositionAt(lookAheadT);
      
      // Ensure forward-facing direction
      const direction = lookAheadPos.clone().sub(currentPos).normalize();
      return currentPos.clone().add(direction.multiplyScalar(focusDistance));
    }
    
    const loopT = ((t % 1) + 1) % 1;
    const baseLookAt = this.lookAtCurve.getPointAt(loopT);
    const currentPos = this.getPositionAt(t);
    
    // Find photos within focus distance
    const nearbyPhotos = photoPositions
      .filter(p => !p.id.startsWith('placeholder-'))
      .map(p => ({
        photo: p,
        distance: currentPos.distanceTo(new THREE.Vector3(...p.position))
      }))
      .filter(p => p.distance <= focusDistance)
      .sort((a, b) => a.distance - b.distance);

    if (nearbyPhotos.length > 0) {
      // Smoothly blend between path look-at and photo focus
      const photoTarget = new THREE.Vector3(...nearbyPhotos[0].photo.position);
      const blendFactor = Math.min(focusDistance / nearbyPhotos[0].distance, 0.7);
      
      // Ensure we don't look down too steeply
      if (photoTarget.y < currentPos.y - 3) {
        photoTarget.y = currentPos.y - 2; // Limit downward angle
      }
      
      return baseLookAt.lerp(photoTarget, blendFactor);
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
    const optimalHeight = -4;
    const viewingDistance = photoSize * 2.2;

    // Sort photos in a continuous path that naturally loops back to start
    const bounds = this.getPhotoBounds(photos);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;

    // Sort photos by angle from center for natural circular showcase
    const sortedPhotos = [...photos].sort((a, b) => {
      const angleA = Math.atan2(a.position[2] - centerZ, a.position[0] - centerX);
      const angleB = Math.atan2(b.position[2] - centerZ, b.position[0] - centerX);
      return angleA - angleB;
    });

    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];
    
    sortedPhotos.forEach((photo, photoIndex) => {
      const totalPhotos = sortedPhotos.length;
      const progress = photoIndex / totalPhotos;
      
      // Create smooth circular viewing path around photo collection
      const angle = progress * Math.PI * 2;
      const radius = viewingDistance + Math.sin(progress * Math.PI * 4) * photoSize * 0.3;
      const heightVar = Math.sin(progress * Math.PI * 3) * 1.2;
      
      const cameraPos = new THREE.Vector3(
        photo.position[0] + Math.cos(angle + Math.PI) * radius * 0.7,
        optimalHeight + heightVar,
        photo.position[2] + Math.sin(angle + Math.PI) * radius * 0.7
      );
      
      // GRACEFUL FORWARD LOOK-AT: Look towards next photo or ahead in path
      const nextPhoto = sortedPhotos[(photoIndex + 1) % totalPhotos];
      const lookDirection = new THREE.Vector3(...nextPhoto.position).sub(new THREE.Vector3(...photo.position));
      const lookTarget = new THREE.Vector3(...photo.position).add(lookDirection.multiplyScalar(0.5));
      
      // Keep look-at at reasonable height - never steep downward
      lookTarget.y = Math.max(lookTarget.y, cameraPos.y - 1.5);
      
      positions.push(cameraPos);
      lookAts.push(lookTarget);
    });

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
    const sweepHeight = -3;

    const bounds = this.getPhotoBounds(photos);
    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];

    // Create a continuous loop pattern instead of grid
    const padding = photoSize * 1.5;
    const corners = [
      new THREE.Vector3(bounds.minX - padding, sweepHeight, bounds.maxZ + padding), // Top-left
      new THREE.Vector3(bounds.maxX + padding, sweepHeight, bounds.maxZ + padding), // Top-right
      new THREE.Vector3(bounds.maxX + padding, sweepHeight, bounds.minZ - padding), // Bottom-right
      new THREE.Vector3(bounds.minX - padding, sweepHeight, bounds.minZ - padding), // Bottom-left
    ];

    // Generate smooth path around perimeter
    const pointsPerSide = 8;
    for (let side = 0; side < 4; side++) {
      const currentCorner = corners[side];
      const nextCorner = corners[(side + 1) % 4];
      
      for (let point = 0; point < pointsPerSide; point++) {
        if (side === 3 && point === pointsPerSide - 1) break; // Skip last point to avoid duplicate with first
        
        const t = point / pointsPerSide;
        const progress = (side * pointsPerSide + point) / (4 * pointsPerSide);
        
        // Smooth interpolation along perimeter
        const position = currentCorner.clone().lerp(nextCorner, t);
        
        // Add gentle height variation for cinematic movement
        position.y += Math.sin(progress * Math.PI * 2) * 1.5;
        
        // GRACEFUL LOOK-AT: Always look toward the photo collection center
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerZ = (bounds.minZ + bounds.maxZ) / 2;
        const lookTarget = new THREE.Vector3(
          centerX + Math.sin(progress * Math.PI * 4) * photoSize * 0.5,
          sweepHeight + 1,
          centerZ + Math.cos(progress * Math.PI * 4) * photoSize * 0.5
        );
        
        positions.push(position);
        lookAts.push(lookTarget);
      }
    }

    return { positions, lookAts };
  }

  static generatePhotoFocusPath(photos: PhotoPosition[], settings: any): { positions: THREE.Vector3[], lookAts: THREE.Vector3[] } {
    if (!photos.length) return { positions: [], lookAts: [] };

    const photoSize = settings.photoSize || 4;
    const focusDistance = photoSize * 1.8;

    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];

    // Create one continuous smooth orbit path connecting all photos
    photos.forEach((photo, photoIndex) => {
      const totalPhotos = photos.length;
      
      // Single smooth orbit around each photo - no multiple angles
      const baseAngle = (photoIndex / totalPhotos) * Math.PI * 2;
      const radius = focusDistance + Math.sin(photoIndex * 0.3) * photoSize * 0.15;
      const heightOffset = Math.cos(photoIndex * 0.4) * photoSize * 0.25;
      
      const cameraPos = new THREE.Vector3(
        photo.position[0] + Math.cos(baseAngle) * radius,
        Math.max(photo.position[1] + heightOffset, -6),
        photo.position[2] + Math.sin(baseAngle) * radius
      );
      
      // GRACEFUL LOOK-AT: Look toward next photo instead of straight down
      const nextPhotoIndex = (photoIndex + 1) % totalPhotos;
      const nextPhoto = photos[nextPhotoIndex];
      
      // Blend between current photo and next photo for smooth transitions
      const currentTarget = new THREE.Vector3(...photo.position);
      const nextTarget = new THREE.Vector3(...nextPhoto.position);
      const blendedTarget = currentTarget.lerp(nextTarget, 0.3);
      
      // CRITICAL: Maintain reasonable viewing angle - no steep downward looks
      blendedTarget.y = Math.max(blendedTarget.y, cameraPos.y - photoSize * 0.8);
      
      positions.push(cameraPos);
      lookAts.push(blendedTarget);
    });

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

  // Generate perfect loop camera path
  const cameraPath = useMemo(() => {
    if (!config?.enabled || !photoPositions.length || config.type === 'none') {
      return null;
    }

    const validPhotos = photoPositions.filter(p => p.id && !p.id.startsWith('placeholder-'));
    if (!validPhotos.length) return null;

    console.log(`🎬 Generating PERFECT LOOP ${config.type} path for ${validPhotos.length} photos`);

    let pathData: { positions: THREE.Vector3[], lookAts: THREE.Vector3[] };

    switch (config.type) {
      case 'showcase':
        pathData = CinematicPathGenerator.generateShowcasePath(validPhotos, settings);
        break;
      case 'gallery_walk':
        pathData = CinematicPathGenerator.generateGalleryWalkPath(validPhotos, settings);
        break;
      case 'spiral_tour':
        pathData = CinematicPathGenerator.generateSpiralTourPath(validPhotos, settings);
        break;
      case 'wave_follow':
        pathData = CinematicPathGenerator.generateWaveFollowPath(validPhotos, settings);
        break;
      case 'grid_sweep':
        pathData = CinematicPathGenerator.generateGridSweepPath(validPhotos, settings);
        break;
      case 'photo_focus':
        pathData = CinematicPathGenerator.generatePhotoFocusPath(validPhotos, settings);
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
  }, [photoPositions, config?.type, config?.enabled, settings, animationPattern]);

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
        console.log('🎮 PERFECT LOOP Camera: User interaction started -', eventType);
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
          console.log('🎮 PERFECT LOOP Camera: Wheel interaction');
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
          console.log('🎬 PERFECT LOOP Camera: Auto-resuming graceful animation');
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
      console.log('🎮 PERFECT LOOP Camera: OrbitControls interaction started');
      userInteractingRef.current = true;
      lastInteractionRef.current = Date.now();
    };

    const handleControlEnd = () => {
      lastInteractionRef.current = Date.now();
      
      const resumeDelay = (config.resumeDelay || 2.0) * 1000;
      setTimeout(() => {
        userInteractingRef.current = false;
        console.log('🎬 PERFECT LOOP Camera: Auto-resuming after OrbitControls');
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
      console.log(`🎬 PERFECT LOOP CONFIG CHANGE: ${lastConfigRef.current} → ${currentConfigKey}`);
      
      isConfigTransitioningRef.current = true;
      configTransitionStartRef.current = Date.now();
      
      configStartPositionRef.current.copy(camera.position);
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      configStartLookAtRef.current.addVectors(camera.position, direction.multiplyScalar(50));
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
      console.log('🎬 PERFECT LOOP Camera: Gracefully resuming perfect loop');
    }

    // PERFECT LOOP MOVEMENT: Ultra-smooth continuous motion
    const speed = (config.speed || 1.0) * 0.015; // Slightly slower for perfect smoothness
    pathProgressRef.current += delta * speed;
    
    // SEAMLESS LOOP: Perfect modulo handling
    pathProgressRef.current = pathProgressRef.current % 1;
    if (pathProgressRef.current < 0) pathProgressRef.current += 1;

    // Get smooth positions and look-at targets
    const targetPosition = currentPathRef.current.getPositionAt(pathProgressRef.current);
    const lookAtTarget = currentPathRef.current.getLookAtTarget(
      pathProgressRef.current, 
      photoPositions, 
      config.focusDistance || 12
    );

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
        console.log('🎬 PERFECT LOOP: Config transition completed - resuming perfect loop');
      }
      
      return;
    }

    // GRACEFUL MOVEMENT: Ultra-smooth lerping
    let lerpFactor = 0.025; // Slightly slower for perfect smoothness
    
    if (isResuming.current) {
      const blendDuration = config.blendDuration || 2.5;
      resumeBlendRef.current += delta;
      
      if (resumeBlendRef.current < blendDuration) {
        const blendProgress = resumeBlendRef.current / blendDuration;
        const smoothBlend = blendProgress * blendProgress * (3 - 2 * blendProgress); // Smoothstep
        lerpFactor = 0.01 + (smoothBlend * 0.02);
      } else {
        isResuming.current = false;
        console.log('🎬 PERFECT LOOP: Resume blend complete - perfect loop active');
      }
    }

    // Apply ultra-smooth camera movement
    camera.position.lerp(targetPosition, lerpFactor);
    camera.lookAt(lookAtTarget);

    // Update controls smoothly
    if (controls && 'target' in controls) {
      (controls as any).target.lerp(lookAtTarget, lerpFactor * 0.6);
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
    if (Math.floor(pathProgressRef.current * 100) % 20 === 0 && Math.floor(pathProgressRef.current * 100) !== 0) {
      const viewedCount = visibilityTrackerRef.current.size;
      const totalPhotos = photoPositions.filter(p => !p.id.startsWith('placeholder-')).length;
      
      if (viewedCount > 0) {
        console.log(`🎬 PERFECT LOOP Progress: ${viewedCount}/${totalPhotos} photos (${Math.round(viewedCount/totalPhotos*100)}%) - Loop: ${Math.round(pathProgressRef.current * 100)}%`);
      }
    }
  });

  // Debug info
  useEffect(() => {
    if (config?.enabled && cameraPath) {
      console.log(`🎬 ✨ PERFECT LOOP CAMERA ACTIVE: ${config.type} ✨`);
      console.log(`🔄 Perfect seamless loops with graceful forward-facing turns`);
      console.log(`🚫 No downward camera angles - always graceful and cinematic`);
      console.log(`⚡ Ultra-smooth curve generation with enhanced interpolation`);
      console.log(`🎯 Forward-facing look-at targets prevent awkward camera angles`);
      console.log(`🎥 Optimized for professional video recording and showcases`);
      console.log(`⚙️ Config: Speed=${config.speed}, Focus=${config.focusDistance}, Pattern=${animationPattern}`);
    }
  }, [config?.enabled, config?.type, cameraPath, animationPattern, config?.speed, config?.focusDistance]);

  return null;
};

export default SmoothCinematicCameraController;