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
    
    // AGGRESSIVE FIX: Always look forward/horizontally, NEVER down
    if (pathType === 'showcase' || pathType === 'grid_sweep') {
      // For showcase and grid sweep, ALWAYS look straight ahead in movement direction
      const lookAheadT = (loopT + 0.02) % 1; // Small look-ahead
      const lookAheadPos = this.getPositionAt(lookAheadT);
      
      // Create horizontal look direction
      const lookDirection = lookAheadPos.clone().sub(currentPos);
      lookDirection.y = 0; // FORCE horizontal - no vertical component
      lookDirection.normalize();
      
      // Look far ahead horizontally
      const lookTarget = currentPos.clone();
      lookTarget.x += lookDirection.x * focusDistance * 2;
      lookTarget.z += lookDirection.z * focusDistance * 2;
      lookTarget.y = currentPos.y + 1; // Look slightly UP, never down
      
      return lookTarget;
    }
    
    // Special handling for photo_focus path - look at actual photos but not down
    if (pathType === 'photo_focus') {
      // Find the nearest photo to focus on
      const nearbyPhotos = photoPositions
        .filter(p => !p.id.startsWith('placeholder-'))
        .map(p => ({
          photo: p,
          distance: currentPos.distanceTo(new THREE.Vector3(...p.position))
        }))
        .sort((a, b) => a.distance - b.distance);

      if (nearbyPhotos.length > 0 && nearbyPhotos[0].distance <= focusDistance * 2) {
        // Focus on the nearest photo
        const photoTarget = new THREE.Vector3(...nearbyPhotos[0].photo.position);
        
        // NEVER look down at photos - adjust target height
        if (photoTarget.y < currentPos.y - 1) {
          // If photo is below us, look forward instead of down
          const direction = photoTarget.clone().sub(currentPos);
          direction.y = 0; // Remove downward component
          direction.normalize();
          return currentPos.clone().add(direction.multiplyScalar(focusDistance));
        }
        
        return photoTarget;
      }
    }
    
    // Default: look ahead horizontally
    if (!this.lookAtCurve) {
      const lookAheadT = (t + 0.05) % 1;
      const lookAheadPos = this.getPositionAt(lookAheadT);
      
      const direction = lookAheadPos.clone().sub(currentPos);
      direction.y = 0; // Force horizontal
      direction.normalize();
      
      const target = currentPos.clone().add(direction.multiplyScalar(focusDistance));
      target.y = currentPos.y; // Same height
      return target;
    }
    
    const baseLookAt = this.lookAtCurve.getPointAt(loopT);
    
    // FORCE: Never look down
    if (baseLookAt.y < currentPos.y - 1) {
      baseLookAt.y = currentPos.y;
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
    const showcaseHeight = 2; // ELEVATED - eye level above photos
    const orbitRadius = photoSize * 4;

    // Find collection center
    const bounds = this.getPhotoBounds(photos);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;

    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];
    
    const totalPoints = 32; // Perfect loop division
    
    for (let i = 0; i < totalPoints; i++) {
      const progress = i / totalPoints;
      const orbitAngle = progress * Math.PI * 2;
      
      // Camera position on smooth circular orbit at eye level
      const cameraPos = new THREE.Vector3(
        centerX + Math.cos(orbitAngle) * orbitRadius,
        showcaseHeight + Math.sin(progress * Math.PI * 4) * 0.3, // Very gentle height variation
        centerZ + Math.sin(orbitAngle) * orbitRadius
      );
      
      // FORCE HORIZONTAL LOOKING - look outward from the circle
      const lookAngle = orbitAngle; // Look in the same direction we're facing
      const lookDistance = orbitRadius * 3; // Look far into the distance
      
      const lookTarget = new THREE.Vector3(
        centerX + Math.cos(lookAngle) * lookDistance,
        showcaseHeight + 2, // Always look slightly UP into the horizon
        centerZ + Math.sin(lookAngle) * lookDistance
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
    const sweepHeight = 1; // Higher up to ensure we're above photos

    const bounds = this.getPhotoBounds(photos);
    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];

    // Create perfect smooth circular sweep
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const radius = Math.max(bounds.maxX - centerX, bounds.maxZ - centerZ) + photoSize * 2.5;

    const totalPoints = 24; // Fewer points for smoother interpolation
    
    for (let i = 0; i < totalPoints; i++) {
      const progress = i / totalPoints;
      const angle = progress * Math.PI * 2;
      
      // Perfect circular motion with minimal height variation
      const position = new THREE.Vector3(
        centerX + Math.cos(angle) * radius,
        sweepHeight, // Constant height - no variation for perfect loop
        centerZ + Math.sin(angle) * radius
      );
      
      // Look straight ahead tangent to the circle - NEVER inward or down
      const lookAngle = angle + Math.PI / 2; // Look perpendicular to radius (tangent to circle)
      const lookDistance = radius * 2;
      
      const lookTarget = new THREE.Vector3(
        position.x + Math.cos(lookAngle) * lookDistance,
        sweepHeight + 1, // Look slightly up, creating a horizon view
        position.z + Math.sin(lookAngle) * lookDistance
      );
      
      positions.push(position);
      lookAts.push(lookTarget);
    }

    // CRITICAL: Ensure the path closes perfectly by making sure first and last points match
    if (positions.length > 0) {
      // The CatmullRomCurve3 with closed=true will handle the interpolation
      // But we ensure our points form a perfect circle
    }

    return { positions, lookAts };
  }

  static generatePhotoFocusPath(photos: PhotoPosition[], settings: any): { positions: THREE.Vector3[], lookAts: THREE.Vector3[] } {
    if (!photos.length) return { positions: [], lookAts: [] };

    const photoSize = settings.photoSize || 4;
    const focusHeight = 2; // Elevated height - looking at photos from above at an angle
    const viewRadius = photoSize * 3;

    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];

    // Get bounds for circular tour
    const bounds = this.getPhotoBounds(photos);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const tourRadius = Math.max(bounds.maxX - centerX, bounds.maxZ - centerZ) + viewRadius;

    // Create a smooth circular path that gives good views of photos
    const totalPoints = 36;
    
    for (let i = 0; i < totalPoints; i++) {
      const progress = i / totalPoints;
      const angle = progress * Math.PI * 2;
      
      // Circular path around the photos
      const cameraPos = new THREE.Vector3(
        centerX + Math.cos(angle) * tourRadius,
        focusHeight + Math.sin(progress * Math.PI * 4) * 0.3, // Very gentle bobbing
        centerZ + Math.sin(angle) * tourRadius
      );
      
      // Look toward center area where photos are, but HORIZONTALLY
      const inwardDistance = tourRadius * 0.5;
      const lookTarget = new THREE.Vector3(
        centerX + Math.cos(angle) * inwardDistance * 0.3,
        focusHeight, // Look at same height - HORIZONTAL view
        centerZ + Math.sin(angle) * inwardDistance * 0.3
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

    pathTypeRef.current = config.type;

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

    // Normal speed-based movement
    const speed = (config.speed || 1.0) * 0.012; // Slightly slower for smoothness
    pathProgressRef.current += delta * speed;
    
    // SEAMLESS LOOP: Perfect modulo handling
    pathProgressRef.current = pathProgressRef.current % 1;
    if (pathProgressRef.current < 0) pathProgressRef.current += 1;

    // Get smooth positions and look-at targets
    const targetPosition = currentPathRef.current.getPositionAt(pathProgressRef.current);
    const lookAtTarget = currentPathRef.current.getLookAtTarget(
      pathProgressRef.current, 
      photoPositions, 
      config.focusDistance || 12,
      pathTypeRef.current
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

    // Update controls but OVERRIDE their target completely for certain modes
    if (controls && 'target' in controls) {
      if (pathTypeRef.current === 'showcase' || pathTypeRef.current === 'grid_sweep' || pathTypeRef.current === 'photo_focus') {
        // For these modes, completely override OrbitControls target
        (controls as any).target.copy(lookAtTarget);
        (controls as any).update();
      } else {
        // For other modes, use smooth lerping
        (controls as any).target.lerp(lookAtTarget, lerpFactor * 0.7);
        (controls as any).update();
      }
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
      console.log(`🎬 ✨ CAMERA CONTROLLER FIXED V3 - OrbitControls Override ✨`);
      console.log(`✅ Smart Showcase: OrbitControls target OVERRIDDEN - looks horizontally`);
      console.log(`✅ Grid Sweep: OrbitControls target OVERRIDDEN - perfect loop`);
      console.log(`✅ Photo Focus: OrbitControls target OVERRIDDEN - horizontal viewing`);
      console.log(`🔧 Fix: Directly setting OrbitControls.target for problem modes`);
      console.log(`🚫 Prevents OrbitControls from forcing camera to look at (0,0,0)`);
      console.log(`⚙️ Config: Speed=${config.speed}, Focus=${config.focusDistance}, Pattern=${animationPattern}`);
    }
  }, [config?.enabled, config?.type, cameraPath, animationPattern, config?.speed, config?.focusDistance]);

  return null;
};

export default SmoothCinematicCameraController;