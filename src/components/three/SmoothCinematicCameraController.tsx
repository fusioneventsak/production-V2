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
  // Fine-tuning controls from SceneSettings
  baseHeight?: number;
  baseDistance?: number;
  heightVariation?: number;
  distanceVariation?: number;
  // Interaction settings
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
      grid?: {
        wallHeight?: number;
        aspectRatio?: number;
        spacing?: number;
      };
      float?: {
        height?: number;
        spread?: number;
      };
      spiral?: {
        radius?: number;
        heightStep?: number;
      };
    };
    sceneEnvironment?: 'default' | 'cube' | 'sphere' | 'gallery' | 'studio';
    wallHeight?: number;
    roomDepth?: number;
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
    const smoothPoints: THREE.Vector3[] = [];
    for (let i = 0; i < waypoints.length; i++) {
      const current = waypoints[i];
      const next = waypoints[(i + 1) % waypoints.length];
      smoothPoints.push(current.clone());
      if (i < waypoints.length - 1 || closed) {
        const intermediate = current.clone().lerp(next, 0.5);
        intermediate.y += Math.sin(i * 0.5) * 1;
        smoothPoints.push(intermediate);
      }
    }
    this.points = smoothPoints;
    this.curve = new THREE.CatmullRomCurve3(this.points, closed);
    this.curve.tension = 0.3;
    this.totalLength = this.curve.getLength();
  }

  getPositionAt(t: number): THREE.Vector3 {
    if (!this.curve) return new THREE.Vector3();
    return this.curve.getPointAt(t % 1);
  }

  getLookAtTarget(t: number, photoPositions: PhotoPosition[], focusDistance: number): THREE.Vector3 {
    const currentPos = this.getPositionAt(t);
    const nearbyPositions = photoPositions
      .map(p => ({
        position: p,
        distance: currentPos.distanceTo(new THREE.Vector3(...p.position))
      }))
      .filter(p => p.distance <= focusDistance)
      .sort((a, b) => a.distance - b.distance);
    if (nearbyPositions.length > 0) {
      return new THREE.Vector3(...nearbyPositions[0].position.position);
    } else {
      const lookAheadT = (t + 0.1) % 1;
      return this.getPositionAt(lookAheadT);
    }
  }

  getTotalLength(): number {
    return this.totalLength;
  }
}

// Smart path generators for different showcase types
class CinematicPathGenerator {
  static generateShowcasePath(positions: PhotoPosition[], settings: any, config: CinematicCameraConfig): THREE.Vector3[] {
    if (!positions.length) return [];
    const photoSize = settings.photoSize || 4;
    const baseHeight = config.baseHeight || 5;
    const baseDistance = config.baseDistance || (photoSize * 3);
    const heightVariation = config.heightVariation || 2;
    const distanceVariation = config.distanceVariation || 1;

    const positionsByZ = new Map<number, PhotoPosition[]>();
    positions.forEach(pos => {
      const z _

System: _ = Math.round(pos.position[2] / photoSize) * photoSize;
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
        const offset = Math.sin(posIndex * 0.5) * photoSize * 0.3;
        waypoints.push(new THREE.Vector3(
          pos.position[0] + offset,
          baseHeight + Math.sin(posIndex * 0.3) * heightVariation,
          pos.position[2] + baseDistance + Math.cos(posIndex * 0.2) * distanceVariation
        ));
      });
    });
    return waypoints;
  }

  static generateGalleryWalkPath(positions: PhotoPosition[], settings: any, config: CinematicCameraConfig): THREE.Vector3[] {
    if (!positions.length) return [];
    const photoSize = settings.photoSize || 4;
    const baseHeight = config.baseHeight || 3;
    const baseDistance = config.baseDistance || (photoSize * 3);
    const heightVariation = config.heightVariation || 1;
    const distanceVariation = config.distanceVariation || 0.5;

    const sortedPositions = [...positions].sort((a, b) => {
      if (Math.abs(a.position[2] - b.position[2]) > photoSize) {
        return b.position[2] - a.position[2];
      }
      return a.position[0] - b.position[0];
    });

    const waypoints: THREE.Vector3[] = [];
    sortedPositions.forEach((pos, index) => {
      const angle = Math.atan2(pos.position[2], pos.position[0]);
      const walkOffset = Math.sin(index * 0.1) * photoSize * 0.2;

      waypoints.push(new THREE.Vector3(
        pos.position[0] - Math.cos(angle) * (baseDistance + distanceVariation * Math.sin(index)),
        baseHeight + Math.sin(index * 0.05) * heightVariation,
        pos.position[2] - Math.sin(angle) * (baseDistance + distanceVariation * Math.cos(index))
      ));
    });
    return waypoints;
  }

  static generateSpiralTourPath(positions: PhotoPosition[], settings: any, config: CinematicCameraConfig): THREE.Vector3[] {
    if (!positions.length) return [];
    const photoSize = settings.photoSize || 4;
    const floorSize = settings.floorSize || 200;
    const baseHeight = config.baseHeight || 10;
    const baseDistance = config.baseDistance || (Math.max(settings.patterns?.spiral?.radius || 15, photoSize * 3));
    const heightVariation = config.heightVariation || 3;
    const distanceVariation = config.distanceVariation || 2;

    const bounds = this.getPhotoBounds(positions);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const maxRadius = Math.max(bounds.maxX - centerX, bounds.maxZ - centerZ) + baseDistance;

    const waypoints: THREE.Vector3[] = [];
    const spiralTurns = 3;
    const pointsPerTurn = 20;
    const totalPoints = spiralTurns * pointsPerTurn;

    for (let i = 0; i < totalPoints; i++) {
      const t = i / totalPoints;
      const angle = t * spiralTurns * Math.PI * 2;
      const radius = maxRadius * (0.3 + t * 0.7);
      waypoints.push(new THREE.Vector3(
        centerX + Math.cos(angle) * (radius + distanceVariation * Math.sin(t * Math.PI)),
        baseHeight + Math.sin(t * Math.PI * 2) * heightVariation + t * 5,
        centerZ + Math.sin(angle) * (radius + distanceVariation * Math.cos(t * Math.PI))
      ));
    }
    return waypoints;
  }

  static generateWaveFollowPath(positions: PhotoPosition[], settings: any, config: CinematicCameraConfig): THREE.Vector3[] {
    if (!positions.length) return [];
    const photoSize = settings.photoSize || 4;
    const floorSize = settings.floorSize || 200;
    const waveAmplitude = settings.patterns?.wave?.amplitude || 15;
    const waveFrequency = settings.patterns?.wave?.frequency || 0.3;
    const baseHeight = config.baseHeight || 8;
    const baseDistance = config.baseDistance || (floorSize / 4);
    const heightVariation = config.heightVariation || 2;
    const distanceVariation = config.distanceVariation || 2;

    const bounds = this.getPhotoBounds(positions);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const fieldRadius = Math.max(bounds.maxX - centerX, bounds.maxZ - centerZ, baseDistance);

    const waypoints: THREE.Vector3[] = [];
    waypoints.push(new THREE.Vector3(centerX, baseHeight + 10, centerZ));

    for (let i = 1; i <= 3; i++) {
      const t = i / 3;
      waypoints.push(new THREE.Vector3(
        centerX + Math.sin(t * Math.PI) * photoSize * 2,
        baseHeight + 10 * (1 - t) + heightVariation * Math.sin(t),
        centerZ + Math.cos(t * Math.PI) * photoSize * 2
      ));
    }

    for (let pass = 0; pass < 3; pass++) {
      const radius = fieldRadius * (0.4 + pass * 0.3);
      const points = 24;

      for (let i = 0; i < points; i++) {
        const t = i / points;
        const angle = t * Math.PI * 2;
        const x = centerX + Math.cos(angle) * (radius + distanceVariation * Math.sin(t));
        const z = centerZ + Math.sin(angle) * (radius + distanceVariation * Math.cos(t));
        const distFromCenter = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);
        const wavePhase = distFromCenter * waveFrequency;
        const waveHeight = Math.sin(wavePhase) * 3;

        waypoints.push(new THREE.Vector3(
          x + Math.sin(angle * 3) * photoSize,
          baseHeight + waveHeight + Math.sin(t * Math.PI * 4) * heightVariation,
          z + Math.cos(angle * 3) * photoSize
        ));
      }
    }

    for (let i = 1; i <= 5; i++) {
      const t = i / 5;
      waypoints.push(new THREE.Vector3(
        centerX + Math.cos(t * Math.PI * 2) * fieldRadius * (1 - t),
        baseHeight + t * 8 + heightVariation * Math.sin(t),
        centerZ + Math.sin(t * Math.PI * 2) * fieldRadius * (1 - t)
      ));
    }
    return waypoints;
  }

  static generateGridSweepPath(positions: PhotoPosition[], settings: any, config: CinematicCameraConfig): THREE.Vector3[] {
    if (!positions.length) return [];
    const photoSize = settings.photoSize || 4;
    const baseHeight = config.baseHeight || 5;
    const baseDistance = config.baseDistance || (photoSize * 3);
    const heightVariation = config.heightVariation || 2;
    const distanceVariation = config.distanceVariation || 1;

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
        waypoints.push(new THREE.Vector3(
          x + distanceVariation * Math.sin(row * 0.3),
          baseHeight + heightVariation * Math.sin(row * 0.3 + col * 0.2),
          z + baseDistance + distanceVariation * Math.cos(col * 0.2)
        ));
      }
    }
    return waypoints;
  }

  static generatePhotoFocusPath(positions: PhotoPosition[], settings: any, config: CinematicCameraConfig): THREE.Vector3[] {
    if (!positions.length) return [];
    const photoSize = settings.photoSize || 4;
    const baseHeight = config.baseHeight || 3;
    const baseDistance = config.baseDistance || (photoSize * 2);
    const heightVariation = config.heightVariation || 2;
    const distanceVariation = config.distanceVariation || 0.5;

    const waypoints: THREE.Vector3[] = [];
    const step = Math.max(1, Math.floor(positions.length / 20));
    const selectedPositions = positions.filter((_, index) => index % step === 0);

    selectedPositions.forEach((pos, index) => {
      const angles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
      angles.forEach((angle, angleIndex) => {
        const radius = baseDistance + distanceVariation * Math.sin(angleIndex);
        waypoints.push(new THREE.Vector3(
          pos.position[0] + Math.cos(angle) * radius,
          Math.max(baseHeight + heightVariation * Math.cos(angleIndex * 0.5), 2),
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
  const lastUserPositionRef = useRef<THREE.Vector3>();
  const lastUserTargetRef = useRef<THREE.Vector3>();
  const resumeBlendRef = useRef(0);
  const isResuming = useRef(false);
  const lastConfigRef = useRef<string>('');
  const isConfigTransitioningRef = useRef(false);
  const configTransitionStartRef = useRef(0);
  const configStartPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const configStartLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // Generate smooth camera path with environment constraints
  const cameraPath = useMemo(() => {
    if (!config?.enabled || !photoPositions.length || config.type === 'none') {
      return null;
    }

    const allPositions = photoPositions.filter(p => p.id);
    if (!allPositions.length) return null;

    const actualPhotos = allPositions.filter(p => !p.id.startsWith('placeholder-'));
    const emptySlots = allPositions.filter(p => p.id.startsWith('placeholder-'));

    console.log(`🎬 Generating ${config.type} path for ${allPositions.length} positions`);
    console.log(`📸 Breakdown: ${actualPhotos.length} photos, ${emptySlots.length} empty slots`);

    let waypoints: THREE.Vector3[] = [];
    const environment = settings.sceneEnvironment || 'default';

    // Adjust waypoints based on environment
    switch (config.type) {
      case 'showcase':
        waypoints = CinematicPathGenerator.generateShowcasePath(allPositions, settings, config);
        break;
      case 'gallery_walk':
        waypoints = CinematicPathGenerator.generateGalleryWalkPath(allPositions, settings, config);
        break;
      case 'spiral_tour':
        waypoints = CinematicPathGenerator.generateSpiralTourPath(allPositions, settings, config);
        break;
      case 'wave_follow':
        waypoints = CinematicPathGenerator.generateWaveFollowPath(allPositions, settings, config);
        break;
      case 'grid_sweep':
        waypoints = CinematicPathGenerator.generateGridSweepPath(allPositions, settings, config);
        break;
      case 'photo_focus':
        waypoints = CinematicPathGenerator.generatePhotoFocusPath(allPositions, settings, config);
        break;
      default:
        return null;
    }

    // Apply environment constraints
    if (environment === 'cube' || environment === 'gallery') {
      const wallHeight = settings.wallHeight || 100;
      const roomDepth = settings.roomDepth || settings.floorSize || 200;
      waypoints = waypoints.map(wp => {
        const constrainedY = Math.min(wp.y, wallHeight * 0.9);
        const constrainedZ = Math.max(Math.min(wp.z, roomDepth / 2), -roomDepth / 2);
        return new THREE.Vector3(wp.x, constrainedY, constrainedZ);
      });
    } else if (environment === 'sphere') {
      const sphereRadius = settings.floorSize || 200;
      waypoints = waypoints.map(wp => {
        const dist = Math.sqrt(wp.x ** 2 + wp.z ** 2);
        if (dist > sphereRadius * 0.8) {
          const scale = (sphereRadius * 0.8) / dist;
          return new THREE.Vector3(wp.x * scale, wp.y, wp.z * scale);
        }
        return wp;
      });
    }

    if (waypoints.length < 2) {
      console.warn('⚠️ Not enough waypoints generated');
      return null;
    }

    const smoothPath = new SmoothCameraPath(waypoints, true);
    pathProgressRef.current = 0;
    visibilityTrackerRef.current.clear();

    console.log(`✅ Created path with ${waypoints.length} waypoints for ${environment} environment`);
    return smoothPath;
  }, [photoPositions, config?.type, config?.enabled, settings, animationPattern]);

  useEffect(() => {
    currentPathRef.current = cameraPath;
  }, [cameraPath]);

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

  useFrame((state, delta) => {
    if (!config?.enabled || !currentPathRef.current || config.type === 'none') {
      isActiveRef.current = false;
      return;
    }

    const currentConfigKey = `${config.type}-${config.speed}-${animationPattern}-${config.enabled}-${config.baseHeight}-${config.baseDistance}-${config.heightVariation}-${config.distanceVariation}-${settings.sceneEnvironment}`;
    if (lastConfigRef.current !== '' && lastConfigRef.current !== currentConfigKey) {
      console.log(`🎬 CONFIG CHANGE AUTO-DETECTED: ${lastConfigRef.current} → ${currentConfigKey}`);
      isConfigTransitioningRef.current = true;
      configTransitionStartRef.current = Date.now();
      configStartPositionRef.current.copy(camera.position);
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      configStartLookAtRef.current.addVectors(camera.position, direction.multiplyScalar(50));
      console.log('🎬 Starting automatic config transition from:', {
        x: configStartPositionRef.current.x.toFixed(2),
        y: configStartPositionRef.current.y.toFixed(2),
        z: configStartPositionRef.current.z.toFixed(2)
      });
    }

    lastConfigRef.current = currentConfigKey;

    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const pauseDuration = (config.resumeDelay || 2.0) * 1000;
    if (userInteractingRef.current || timeSinceInteraction < pauseDuration) {
      isActiveRef.current = false;
      if (userInteractingRef.current && config.enableManualControl !== false) {
        return;
      }
      return;
    }

    if (!isActiveRef.current) {
      isActiveRef.current = true;
      isResuming.current = true;
      resumeBlendRef.current = 0;
      console.log('🎬 Camera Animation: Smoothly resuming animation');
    }

    const speed = (config.speed || 1.0) * 0.02;
    pathProgressRef.current += delta * speed;
    pathProgressRef.current = pathProgressRef.current % 1;

    const targetPosition = currentPathRef.current.getPositionAt(pathProgressRef.current);
    const lookAtTarget = currentPathRef.current.getLookAtTarget(
      pathProgressRef.current,
      photoPositions,
      config.focusDistance || 15
    );

    // Pause at photos based on pauseTime
    const pauseTime = config.pauseTime || 1.5;
    const normalizedProgress = pathProgressRef.current % 1;
    const shouldPause = normalizedProgress % (1 / photoPositions.length) < 0.01 && pauseTime > 0;
    if (shouldPause && timeSinceInteraction > pauseDuration) {
      pathProgressRef.current -= delta * speed; // Pause by counteracting progress
    }

    const configTransitionTime = 2500;
    const timeSinceConfigChange = Date.now() - configTransitionStartRef.current;

    if (isConfigTransitioningRef.current && timeSinceConfigChange < configTransitionTime) {
      const blendFactor = Math.min(timeSinceConfigChange / configTransitionTime, 1);
      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const smoothBlend = easeInOutCubic(blendFactor);

      const blendedPos = new THREE.Vector3().lerpVectors(configStartPositionRef.current, targetPosition, smoothBlend);
      const blendedLook = new THREE.Vector3().lerpVectors(configStartLookAtRef.current, lookAtTarget, smoothBlend);

      camera.position.copy(blendedPos);
      camera.lookAt(blendedLook);

      if (blendFactor >= 1) {
        isConfigTransitioningRef.current = false;
        console.log('🎬 Automatic config transition completed - now following new animation type');
      }
      return;
    }

    let lerpFactor = 0.03;
    if (isResuming.current) {
      const blendDuration = config.blendDuration || 2.0;
      resumeBlendRef.current += delta;
      if (resumeBlendRef.current < blendDuration) {
        const blendProgress = resumeBlendRef.current / blendDuration;
        lerpFactor = 0.01 + (blendProgress * 0.02);
      } else {
        isResuming.current = false;
        console.log('🎬 Camera Animation: Resume blend complete');
      }
    }

    // Preserve user distance and height if specified
    if (config.preserveUserDistance && lastUserPositionRef.current) {
      const currentDist = camera.position.distanceTo(lookAtTarget);
      const userDist = lastUserPositionRef.current.distanceTo(lastUserTargetRef.current || lookAtTarget);
      const scale = userDist / currentDist;
      targetPosition.multiplyScalar(scale);
    }
    if (config.preserveUserHeight && lastUserPositionRef.current) {
      targetPosition.y = lastUserPositionRef.current.y;
    }

    camera.position.lerp(targetPosition, lerpFactor);
    camera.lookAt(lookAtTarget);

    if (controls && 'target' in controls) {
      (controls as any).target.lerp(lookAtTarget, lerpFactor * 0.7);
      (controls as any).update();
    }

    photoPositions.forEach(position => {
      const posVec = new THREE.Vector3(...position.position);
      const distance = camera.position.distanceTo(posVec);
      if (distance <= (config.focusDistance || 15)) {
        visibilityTrackerRef.current.add(position.id);
      }
    });

    if (Math.floor(pathProgressRef.current * 100) % 25 === 0 && Math.floor(pathProgressRef.current * 100) !== 0) {
      const viewedCount = visibilityTrackerRef.current.size;
      const totalPositions = photoPositions.length;
      const actualPhotos = photoPositions.filter(p => !p.id.startsWith('placeholder-')).length;

      console.log(`🎬 Camera tour: ${Math.floor(pathProgressRef.current * 100)}% complete`);
      console.log(`📸 Viewed ${viewedCount}/${totalPositions} positions (${actualPhotos} photos, ${totalPositions - actualPhotos} empty)`);
    }
  });

  useEffect(() => {
    if (config?.enabled && cameraPath) {
      console.log(`🎬 FULLY WORKING Cinematic Camera Active: ${config.type}`);
      console.log(`✅ Now works with BOTH photos AND empty slots!`);
      console.log(`🚫 Mouse hover completely ignored: ${config.ignoreMouseMovement !== false}`);
      console.log(`🔄 Auto config change detection: ENABLED`);
      console.log(`⚙️ Auto-resume after: ${config.resumeDelay || 2.0}s`);
      console.log(`🎮 Manual control: ${config.enableManualControl !== false ? 'enabled' : 'disabled'}`);
      console.log(`📹 Continuous path generated - perfect for video recording!`);
      console.log(`🎯 Pattern: ${animationPattern}, Speed: ${config.speed}, Focus: ${config.focusDistance}`);
      console.log(`🖼️ Environment: ${settings.sceneEnvironment || 'default'}`);
      console.log(`🔧 Fine-tuning - Base Height: ${config.baseHeight || 'Auto'}, Base Distance: ${config.baseDistance || 'Auto'}, Height Variation: ${config.heightVariation || 'Auto'}, Distance Variation: ${config.distanceVariation || 'Auto'}`);
    }
  }, [config?.enabled, config?.type, cameraPath, animationPattern, config?.ignoreMouseMovement, config?.resumeDelay, config?.enableManualControl, settings.sceneEnvironment, config?.baseHeight, config?.baseDistance, config?.heightVariation, config?.distanceVariation]);

  return null;
};

export default SmoothCinematicCameraController;