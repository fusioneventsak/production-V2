// src/components/three/SmoothCinematicCameraController.tsx - ENHANCED VERSION WITH ALL FEATURES
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
    // Add auto-rotate settings that might be passed
    cameraAutoRotateVerticalDrift?: number;
    cameraAutoRotateDistanceVariation?: number;
    cameraAutoRotateElevationMin?: number;
    cameraAutoRotateElevationMax?: number;
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

    const smoothPoints: THREE.Vector3[] = [];
    const smoothLookAts: THREE.Vector3[] = [];
    
    this.loopStartPoint = waypoints[0].clone();
    this.loopEndPoint = waypoints[waypoints.length - 1].clone();
    
    for (let i = 0; i < waypoints.length; i++) {
      const current = waypoints[i];
      const currentLookAt = lookAtTargets[i] || waypoints[i].clone();
      const next = waypoints[(i + 1) % waypoints.length];
      const nextLookAt = lookAtTargets[(i + 1) % waypoints.length] || next.clone();
      
      smoothPoints.push(current.clone());
      
      const fixedLookAt = currentLookAt.clone();
      fixedLookAt.y = Math.max(fixedLookAt.y, current.y - 0.5);
      smoothLookAts.push(fixedLookAt);
      
      if (i < waypoints.length - 1 || closed) {
        const intermediate = current.clone().lerp(next, 0.4);
        const intermediateLookAt = currentLookAt.clone().lerp(nextLookAt, 0.4);
        
        intermediate.y += Math.sin(i * 0.8) * 0.3;
        intermediateLookAt.y = intermediate.y;
        
        smoothPoints.push(intermediate);
        smoothLookAts.push(intermediateLookAt);
        
        const intermediate2 = current.clone().lerp(next, 0.7);
        const intermediateLookAt2 = currentLookAt.clone().lerp(nextLookAt, 0.7);
        intermediate2.y += Math.cos(i * 0.6) * 0.2;
        intermediateLookAt2.y = intermediate2.y;
        
        smoothPoints.push(intermediate2);
        smoothLookAts.push(intermediateLookAt2);
      }
    }

    this.points = smoothPoints;
    this.lookAtPoints = smoothLookAts;
    
    this.curve = new THREE.CatmullRomCurve3(this.points, closed);
    this.lookAtCurve = new THREE.CatmullRomCurve3(this.lookAtPoints, closed);
    
    this.curve.tension = 0.5;
    this.lookAtCurve.tension = 0.5;
    
    this.totalLength = this.curve.getLength();
  }

  getPositionAt(t: number): THREE.Vector3 {
    if (!this.curve) return new THREE.Vector3();
    const loopT = ((t % 1) + 1) % 1;
    return this.curve.getPointAt(loopT);
  }

  getLookAtTarget(t: number, photoPositions: PhotoPosition[], focusDistance: number, pathType?: string): THREE.Vector3 {
    const loopT = ((t % 1) + 1) % 1;
    const currentPos = this.getPositionAt(t);
    
    const effectiveFocusDistance = focusDistance || 12;
    
    if (pathType === 'showcase' || pathType === 'grid_sweep') {
      const lookAheadT = (loopT + (0.01 + (25 - effectiveFocusDistance) * 0.001)) % 1;
      const lookAheadPos = this.getPositionAt(lookAheadT);
      
      const lookDirection = lookAheadPos.clone().sub(currentPos);
      const lookMultiplier = effectiveFocusDistance / 12;
      
      const horizontalDistance = Math.sqrt(lookDirection.x * lookDirection.x + lookDirection.z * lookDirection.z);
      const verticalAngle = Math.atan2(lookDirection.y, horizontalDistance);
      
      const maxVerticalAngle = 0.26;
      if (Math.abs(verticalAngle) > maxVerticalAngle) {
        const clampedAngle = Math.sign(verticalAngle) * maxVerticalAngle;
        lookDirection.y = Math.tan(clampedAngle) * horizontalDistance;
      }
      
      lookDirection.normalize();
      
      const lookTarget = currentPos.clone();
      lookTarget.x += lookDirection.x * effectiveFocusDistance;
      lookTarget.y += lookDirection.y * effectiveFocusDistance * 0.5;
      lookTarget.z += lookDirection.z * effectiveFocusDistance;
      
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
          const blendFactor = Math.min(1.0, (16 - effectiveFocusDistance) / 8);
          lookTarget.lerp(photoTarget, blendFactor);
        }
      }
      
      return lookTarget;
    }
    
    if (pathType === 'photo_focus') {
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
      
      const lookAheadT = (loopT + 0.05) % 1;
      const lookAheadPos = this.getPositionAt(lookAheadT);
      const direction = lookAheadPos.clone().sub(currentPos);
      direction.normalize();
      return currentPos.clone().add(direction.multiplyScalar(effectiveFocusDistance));
    }
    
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
      const blendFactor = Math.min(0.8, effectiveFocusDistance / nearbyPhotos[0].distance);
      
      const heightDiff = currentPos.y - photoTarget.y;
      if (heightDiff > 3) {
        photoTarget.y = currentPos.y - 2;
      }
      
      return baseLookAt.lerp(photoTarget, blendFactor);
    }
    
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
    const baseHeight = settings.baseHeight ?? 0;
    const heightVar = settings.heightVariation ?? 2;
    const distanceVar = settings.distanceVariation ?? 5;
    const baseRadius = (settings.baseDistance ?? photoSize * 4);

    const bounds = this.getPhotoBounds(photos);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;

    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];
    
    const totalPoints = 32;
    
    for (let i = 0; i < totalPoints; i++) {
      const progress = i / totalPoints;
      const orbitAngle = progress * Math.PI * 2;
      
      const radiusOffset = Math.sin(progress * Math.PI * 3) * distanceVar;
      const currentRadius = baseRadius + radiusOffset;
      
      const heightOffset = Math.sin(progress * Math.PI * 4) * heightVar;
      
      const cameraPos = new THREE.Vector3(
        centerX + Math.cos(orbitAngle) * currentRadius,
        baseHeight + heightOffset,
        centerZ + Math.sin(orbitAngle) * currentRadius
      );
      
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

    const sortedPhotos = [...photos].sort((a, b) => {
      if (Math.abs(a.position[2] - b.position[2]) > photoSize) {
        return b.position[2] - a.position[2];
      }
      return a.position[0] - b.position[0];
    });

    const positions: THREE.Vector3[] = [];
    const lookAts: THREE.Vector3[] = [];

    sortedPhotos.forEach((photo, index) => {
      const walkProgress = index / sortedPhotos.length;
      const pathCurve = Math.sin(walkProgress * Math.PI * 2) * photoSize * 0.15;
      const heightWalk = Math.sin(walkProgress * Math.PI * 4) * 0.8;
      
      const cameraPos = new THREE.Vector3(
        photo.position[0] + pathCurve,
        walkHeight + heightWalk,
        photo.position[2] + walkDistance
      );
      
      const lookTarget = new THREE.Vector3(...photo.position);
      lookTarget.y = Math.max(lookTarget.y, cameraPos.y - 1.5);
      
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
    const spiralTurns = 2.5;
    const pointsPerTurn = 24;
    const totalPoints = Math.floor(spiralTurns * pointsPerTurn);

    for (let i = 0; i < totalPoints; i++) {
      const t = i / totalPoints;
      
      const angle = t * spiralTurns * Math.PI * 2;
      const radius = maxRadius * (0.4 + t * 0.6);
      const height = spiralHeight + Math.sin(t * Math.PI * 3) * 2.5;
      
      const cameraPos = new THREE.Vector3(
        centerX + Math.cos(angle) * radius,
        height,
        centerZ + Math.sin(angle) * radius
      );
      
      const lookAheadAngle = angle + 0.2;
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
      
      const waveOffset = Math.sin(progress * Math.PI * 3) * photoSize * 1.2;
      const heightWave = Math.sin(progress * Math.PI * 2) * 2;
      const forwardLead = Math.cos(progress * Math.PI * 4) * photoSize * 0.3;
      
      const cameraPos = new THREE.Vector3(
        photo.position[0] + forwardLead,
        waveHeight + heightWave,
        photo.position[2] - photoSize * 1.8 + waveOffset
      );
      
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
      
      const radiusOffset = Math.sin(progress * Math.PI * 2) * distanceVar;
      const currentRadius = baseRadius + radiusOffset;
      
      const heightOffset = Math.sin(progress * Math.PI * 3) * heightVar;
      
      const position = new THREE.Vector3(
        centerX + Math.cos(angle) * currentRadius,
        baseHeight + heightOffset,
        centerZ + Math.sin(angle) * currentRadius
      );
      
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
      
      const radiusOffset = Math.sin(progress * Math.PI * 4) * distanceVar;
      const currentRadius = baseRadius + radiusOffset;
      
      const heightOffset = Math.sin(progress * Math.PI * 6) * heightVar;
      
      const cameraPos = new THREE.Vector3(
        centerX + Math.cos(angle) * currentRadius,
        baseHeight + heightOffset,
        centerZ + Math.sin(angle) * currentRadius
      );
      
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
  const photoFocusDurationRef = useRef(2);
  
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

  // Merge config with auto-rotate settings if they exist
  const mergedConfig = useMemo(() => {
    if (!config) return config;
    
    return {
      ...config,
      // Use auto-rotate settings if not already specified in config
      verticalDrift: config.verticalDrift ?? settings.cameraAutoRotateVerticalDrift,
      dynamicDistanceVariation: config.dynamicDistanceVariation ?? settings.cameraAutoRotateDistanceVariation,
      elevationMin: config.elevationMin ?? settings.cameraAutoRotateElevationMin,
      elevationMax: config.elevationMax ?? settings.cameraAutoRotateElevationMax,
    };
  }, [config, settings]);

  // Generate perfect loop camera path
  const cameraPath = useMemo(() => {
    if (!mergedConfig?.enabled || !photoPositions.length || mergedConfig.type === 'none') {
      return null;
    }

    const validPhotos = photoPositions.filter(p => p.id && !p.id.startsWith('placeholder-'));
    if (!validPhotos.length) return null;

    console.log(`🎬 Generating ENHANCED ${mergedConfig.type} path for ${validPhotos.length} photos`);
    console.log(`📊 Config - Focus: ${mergedConfig.focusDistance}, HeightVar: ${mergedConfig.heightVariation}, DistanceVar: ${mergedConfig.distanceVariation}`);
    console.log(`🌊 Dynamic - VerticalDrift: ${mergedConfig.verticalDrift}, DynamicDistance: ${mergedConfig.dynamicDistanceVariation}`);

    let pathData: { positions: THREE.Vector3[], lookAts: THREE.Vector3[] };

    pathTypeRef.current = mergedConfig.type;

    const enhancedSettings = {
      ...settings,
      heightVariation: mergedConfig.heightVariation,
      distanceVariation: mergedConfig.distanceVariation,
      baseHeight: mergedConfig.baseHeight,
      baseDistance: mergedConfig.baseDistance
    };

    switch (mergedConfig.type) {
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

    const smoothPath = new SmoothCameraPath(pathData.positions, pathData.lookAts, true);
    
    pathProgressRef.current = 0;
    visibilityTrackerRef.current.clear();
    
    return smoothPath;
  }, [photoPositions, mergedConfig, settings, animationPattern]);

  // Update path reference
  useEffect(() => {
    currentPathRef.current = cameraPath;
  }, [cameraPath]);

  // Enhanced user interaction detection
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas || !mergedConfig?.enabled) return;

    const ignoreMouseMovement = mergedConfig.ignoreMouseMovement !== false;
    const sensitivity = mergedConfig.interactionSensitivity || 'medium';

    const handleInteractionStart = (e: Event) => {
      const eventType = e.type;
      
      if (eventType === 'mousedown' || eventType === 'touchstart') {
        console.log('🎮 User interaction started -', eventType);
        userInteractingRef.current = true;
        lastInteractionRef.current = Date.now();
        
        if (mergedConfig.resumeFromCurrentPosition !== false) {
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
        
        const resumeDelay = (mergedConfig.resumeDelay || 2.0) * 1000;
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
  }, [mergedConfig, camera, controls]);

  // OrbitControls integration
  useEffect(() => {
    if (!controls || !mergedConfig?.enabled) return;

    const handleControlStart = () => {
      console.log('🎮 OrbitControls interaction started');
      userInteractingRef.current = true;
      lastInteractionRef.current = Date.now();
    };

    const handleControlEnd = () => {
      lastInteractionRef.current = Date.now();
      
      const resumeDelay = (mergedConfig.resumeDelay || 2.0) * 1000;
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
  }, [controls, mergedConfig]);

  // ENHANCED animation loop with all features
  useFrame((state, delta) => {
    if (!mergedConfig?.enabled || !currentPathRef.current || mergedConfig.type === 'none') {
      isActiveRef.current = false;
      return;
    }

    const currentConfigKey = `${mergedConfig.type}-${mergedConfig.speed}-${animationPattern}-${mergedConfig.enabled}`;
    
    if (lastConfigRef.current !== '' && lastConfigRef.current !== currentConfigKey) {
      console.log(`🎬 CONFIG CHANGE: ${lastConfigRef.current} → ${currentConfigKey}`);
      
      isConfigTransitioningRef.current = true;
      configTransitionStartRef.current = Date.now();
      
      configStartPositionRef.current.copy(camera.position);
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      configStartLookAtRef.current.addVectors(camera.position, direction.multiplyScalar(50));
      
      if (mergedConfig.type === 'photo_focus') {
        currentPhotoIndexRef.current = 0;
        photoFocusTimerRef.current = 0;
      }
    }
    
    lastConfigRef.current = currentConfigKey;

    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const pauseDuration = (mergedConfig.resumeDelay || 2.0) * 1000;

    if (userInteractingRef.current || timeSinceInteraction < pauseDuration) {
      isActiveRef.current = false;
      if (userInteractingRef.current && mergedConfig.enableManualControl !== false) {
        return;
      }
      return;
    }

    if (!isActiveRef.current) {
      isActiveRef.current = true;
      isResuming.current = true;
      resumeBlendRef.current = 0;
      console.log('🎬 Gracefully resuming perfect loop');
    }

    // Enhanced speed with exponential scaling
    const speedMultiplier = mergedConfig.speed || 1.0;
    const effectiveSpeed = Math.pow(speedMultiplier, 1.5) * 0.018;
    
    pathProgressRef.current += delta * effectiveSpeed;
    pathProgressRef.current = pathProgressRef.current % 1;
    if (pathProgressRef.current < 0) pathProgressRef.current += 1;
    
    // Update dynamic variation for real-time effects
    dynamicVariationRef.current += delta * 0.5;

    // Get base positions from path
    const basePosition = currentPathRef.current.getPositionAt(pathProgressRef.current);
    const baseLookAt = currentPathRef.current.getLookAtTarget(
      pathProgressRef.current, 
      photoPositions, 
      mergedConfig.focusDistance || 12,
      pathTypeRef.current
    );
    
    // Apply ENHANCED DYNAMIC variations
    let targetPosition = basePosition.clone();
    let lookAtTarget = baseLookAt.clone();
    
    // ENHANCED VERTICAL DRIFT
    const verticalDrift = mergedConfig.verticalDrift ?? 0;
    if (verticalDrift > 0) {
      const primaryWave = Math.sin(dynamicVariationRef.current * 0.3) * verticalDrift * 2.0;
      const secondaryWave = Math.sin(dynamicVariationRef.current * 0.7) * verticalDrift * 0.5;
      const tertiaryWave = Math.cos(dynamicVariationRef.current * 1.1) * verticalDrift * 0.3;
      
      const totalDrift = primaryWave + secondaryWave + tertiaryWave;
      
      targetPosition.y += totalDrift;
      lookAtTarget.y += totalDrift * 0.5;
      
      if (verticalDrift > 5) {
        targetPosition.x += Math.sin(dynamicVariationRef.current * 0.4) * verticalDrift * 0.1;
        targetPosition.z += Math.cos(dynamicVariationRef.current * 0.4) * verticalDrift * 0.1;
      }
    }
    
    // ENHANCED DISTANCE VARIATION
    const dynamicDistanceVar = mergedConfig.dynamicDistanceVariation ?? 0;
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
      
      const dirFromCenter = new THREE.Vector3(
        targetPosition.x - centerX,
        0,
        targetPosition.z - centerZ
      );
      
      if (dirFromCenter.length() > 0.1) {
        dirFromCenter.normalize();
        
        const primaryBreath = Math.sin(dynamicVariationRef.current * 0.25) * dynamicDistanceVar * 1.5;
        const secondaryBreath = Math.sin(dynamicVariationRef.current * 0.6) * dynamicDistanceVar * 0.5;
        const heartbeat = Math.sin(dynamicVariationRef.current * 2.0) * dynamicDistanceVar * 0.2;
        
        const totalBreath = primaryBreath + secondaryBreath + heartbeat;
        
        targetPosition.x += dirFromCenter.x * totalBreath;
        targetPosition.z += dirFromCenter.z * totalBreath;
        
        if (dynamicDistanceVar > 10) {
          const swoopAmount = Math.sin(dynamicVariationRef.current * 0.3 + Math.PI/2) * dynamicDistanceVar * 0.3;
          targetPosition.y += swoopAmount;
        }
        
        if (dynamicDistanceVar > 5) {
          const lookBreath = totalBreath * 0.3;
          lookAtTarget.x += dirFromCenter.x * lookBreath;
          lookAtTarget.z += dirFromCenter.z * lookBreath;
        }
      }
    }
    
    // COMBINED EFFECT AMPLIFIER
    if (verticalDrift > 3 && dynamicDistanceVar > 5) {
      const swirlAngle = dynamicVariationRef.current * 0.5;
      const swirlRadius = Math.min(verticalDrift, dynamicDistanceVar) * 0.2;
      
      targetPosition.x += Math.cos(swirlAngle) * swirlRadius;
      targetPosition.z += Math.sin(swirlAngle) * swirlRadius;
    }
    
    // Apply ELEVATION CONSTRAINTS
    if (mergedConfig.elevationMin !== undefined || mergedConfig.elevationMax !== undefined) {
      const toTarget = lookAtTarget.clone().sub(targetPosition);
      const horizontalDistance = Math.sqrt(toTarget.x * toTarget.x + toTarget.z * toTarget.z);
      
      if (horizontalDistance > 0.1) {
        const currentElevation = Math.atan2(toTarget.y, horizontalDistance);
        
        const minElevation = mergedConfig.elevationMin ?? -Math.PI / 3;
        const maxElevation = mergedConfig.elevationMax ?? Math.PI / 3;
        
        let targetElevation = currentElevation;
        if (currentElevation < minElevation) {
          targetElevation = minElevation;
        } else if (currentElevation > maxElevation) {
          targetElevation = maxElevation;
        }
        
        if (targetElevation !== currentElevation) {
          const newY = Math.tan(targetElevation) * horizontalDistance;
          lookAtTarget.y = targetPosition.y + newY;
        }
        
        const elevationOscillation = mergedConfig.elevationOscillation ?? 0;
        if (elevationOscillation > 0 && mergedConfig.elevationMin !== undefined && mergedConfig.elevationMax !== undefined) {
          const oscAmount = (Math.sin(dynamicVariationRef.current * 0.2) + 1) / 2;
          const oscElevation = minElevation + (maxElevation - minElevation) * oscAmount;
          const oscY = Math.tan(oscElevation) * horizontalDistance;
          
          lookAtTarget.y = lookAtTarget.y * (1 - elevationOscillation) + (targetPosition.y + oscY) * elevationOscillation;
        }
      }
    }

    // Handle config transitions
    const configTransitionTime = 3000;
    const timeSinceConfigChange = Date.now() - configTransitionStartRef.current;
    
    if (isConfigTransitioningRef.current && timeSinceConfigChange < configTransitionTime) {
      const blendFactor = Math.min(timeSinceConfigChange / configTransitionTime, 1);
      
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

    // Apply smooth camera movement
    let lerpFactor = 0.02;
    
    if (isResuming.current) {
      const blendDuration = mergedConfig.blendDuration || 2.5;
      resumeBlendRef.current += delta;
      
      if (resumeBlendRef.current < blendDuration) {
        const blendProgress = resumeBlendRef.current / blendDuration;
        const smoothBlend = blendProgress * blendProgress * (3 - 2 * blendProgress);
        lerpFactor = 0.01 + (smoothBlend * 0.015);
      } else {
        isResuming.current = false;
        console.log('🎬 Resume blend complete');
      }
    }

    camera.position.lerp(targetPosition, lerpFactor);
    camera.lookAt(lookAtTarget);

    // Update controls with smooth transitions
    if (controls && 'target' in controls) {
      const currentTarget = (controls as any).target.clone();
      const targetDiff = lookAtTarget.clone().sub(currentTarget);
      
      if (pathTypeRef.current === 'showcase' || pathTypeRef.current === 'grid_sweep' || pathTypeRef.current === 'photo_focus') {
        const strongLerpFactor = Math.min(lerpFactor * 2, 0.08);
        (controls as any).target.lerp(lookAtTarget, strongLerpFactor);
      } else {
        (controls as any).target.lerp(lookAtTarget, lerpFactor * 0.7);
      }
      
      (controls as any).update();
    }

    // Track visibility
    photoPositions.forEach(photo => {
      if (!photo.id.startsWith('placeholder-')) {
        const photoVec = new THREE.Vector3(...photo.position);
        const distance = camera.position.distanceTo(photoVec);
        if (distance <= (mergedConfig.focusDistance || 12)) {
          visibilityTrackerRef.current.add(photo.id);
        }
      }
    });

    if (Math.floor(pathProgressRef.current * 100) % 25 === 0) {
      const viewedCount = visibilityTrackerRef.current.size;
      const totalPhotos = photoPositions.filter(p => !p.id.startsWith('placeholder-')).length;
      
      console.log(`🎬 Loop Progress: ${Math.round(pathProgressRef.current * 100)}%`);
    }
  });

  // Debug info
  useEffect(() => {
    if (mergedConfig?.enabled && cameraPath) {
      const speedInfo = mergedConfig.speed ? 
        `${mergedConfig.speed.toFixed(1)}x (${mergedConfig.speed < 0.5 ? 'very slow' : mergedConfig.speed < 1.5 ? 'normal' : mergedConfig.speed < 2.5 ? 'fast' : 'very fast'})` : 
        '1.0x (normal)';
      
      console.log(`🎬 ✨ ENHANCED CINEMATIC CAMERA ACTIVE ✨`);
      console.log(`🚀 Speed: ${speedInfo}`);
      console.log(`🎯 Focus Distance: ${mergedConfig.focusDistance || 12} units`);
      console.log(`📊 Height Variation: ${mergedConfig.heightVariation ?? 'auto'}`);
      console.log(`📐 Distance Variation: ${mergedConfig.distanceVariation ?? 'auto'}`);
      console.log(`🌊 Vertical Drift: ${mergedConfig.verticalDrift ?? 0}`);
      console.log(`💨 Dynamic Distance: ${mergedConfig.dynamicDistanceVariation ?? 0}`);
      console.log(`📏 Elevation Min/Max: ${mergedConfig.elevationMin?.toFixed(2) ?? 'auto'} / ${mergedConfig.elevationMax?.toFixed(2) ?? 'auto'}`);
      console.log(`🎥 Animation Type: ${mergedConfig.type}`);
    }
  }, [mergedConfig, cameraPath]);

  return null;
};

export default SmoothCinematicCameraController;