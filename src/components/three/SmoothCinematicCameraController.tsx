// src/components/three/SmoothCinematicCameraController.tsx - SCENE-COMPATIBLE CINEMATIC CAMERA
import React, { useRef, useEffect, useMemo } from 'react';
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
  // Fine-tuning controls from settings
  baseHeight?: number;
  baseDistance?: number;
  heightVariation?: number;
  distanceVariation?: number;
  // Additional settings
  interactionSensitivity?: 'low' | 'medium' | 'high';
  ignoreMouseMovement?: boolean;
  resumeDelay?: number;
  enableManualControl?: boolean;
  blendDuration?: number;
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
      spiral?: {
        radius?: number;
        heightStep?: number;
      };
      float?: {
        height?: number;
        spread?: number;
      };
    };
  };
}

// Smooth curve generator for continuous camera paths
class SmoothCameraPath {
  private curve: THREE.CatmullRomCurve3 | null = null;

  constructor(waypoints: THREE.Vector3[]) {
    if (waypoints.length >= 2) {
      this.curve = new THREE.CatmullRomCurve3(waypoints, true);
      this.curve.tension = 0.5;
    }
  }

  getPositionAt(t: number): THREE.Vector3 {
    if (!this.curve) return new THREE.Vector3(0, 0, 0);
    return this.curve.getPointAt(t % 1);
  }

  getLookAtTarget(t: number, positions: PhotoPosition[]): THREE.Vector3 {
    if (!this.curve) return new THREE.Vector3(0, 0, 0);
    
    const currentPos = this.getPositionAt(t);
    
    // Look at ALL positions (photos and empty slots)
    let nearest: PhotoPosition | null = null;
    let minDist = Infinity;
    
    positions.forEach(pos => {
      const dist = currentPos.distanceTo(new THREE.Vector3(...pos.position));
      if (dist < minDist) {
        minDist = dist;
        nearest = pos;
      }
    });
    
    // Use a larger focus distance for scene compatibility
    if (nearest && minDist < 50) {
      return new THREE.Vector3(...nearest.position);
    }
    
    // Look ahead on the path
    return this.getPositionAt((t + 0.05) % 1);
  }
}

export const SmoothCinematicCameraController: React.FC<SmoothCinematicCameraControllerProps> = ({
  config,
  photoPositions,
  animationPattern,
  settings
}) => {
  const { camera, controls } = useThree();
  
  // Animation state
  const progressRef = useRef(0);
  const isActiveRef = useRef(false);
  const pathRef = useRef<SmoothCameraPath | null>(null);
  const userInteractingRef = useRef(false);
  const lastInteractionTimeRef = useRef(0);

  // Generate camera path based on configuration
  const cameraPath = useMemo(() => {
    if (!config?.enabled || config.type === 'none' || !photoPositions.length) {
      console.log('🎬 Camera disabled or no positions');
      return null;
    }

    console.log(`🎬 Creating ${config.type} path for ${photoPositions.length} positions`);
    console.log('📐 Scene settings:', {
      photoSize: settings.photoSize,
      floorSize: settings.floorSize,
      pattern: animationPattern
    });
    
    const photoSize = settings.photoSize || 4;
    const floorSize = settings.floorSize || 200;
    const waypoints: THREE.Vector3[] = [];
    
    // Calculate actual bounds from positions
    const positions = photoPositions.map(p => p.position);
    const xs = positions.map(p => p[0]);
    const zs = positions.map(p => p[2]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const fieldRadius = Math.max(maxX - minX, maxZ - minZ) / 2 || floorSize / 4;

    // Get fine-tuning values from config or use smart defaults based on pattern
    const getBaseHeight = () => {
      if (config.baseHeight !== undefined) return config.baseHeight;
      // Smart defaults based on animation pattern
      if (animationPattern === 'wave') return 15;
      if (animationPattern === 'spiral') return 25;
      if (animationPattern === 'grid') return 10;
      return 20;
    };

    const getBaseDistance = () => {
      if (config.baseDistance !== undefined) return config.baseDistance;
      // Smart defaults
      if (animationPattern === 'wave') return 30;
      if (animationPattern === 'spiral') return 40;
      if (animationPattern === 'grid') return 25;
      return 35;
    };

    const baseHeight = getBaseHeight();
    const baseDistance = getBaseDistance();
    const heightVar = config.heightVariation || 8;
    const distVar = config.distanceVariation || 10;

    console.log('📏 Camera parameters:', {
      baseHeight,
      baseDistance,
      heightVar,
      distVar,
      fieldRadius: fieldRadius.toFixed(1)
    });

    switch (config.type) {
      case 'wave_follow':
        // Create a path that follows the wave pattern through the center
        const waveAmplitude = settings.patterns?.wave?.amplitude || 15;
        const waveFrequency = settings.patterns?.wave?.frequency || 0.3;
        
        // Start from center at a good viewing height
        waypoints.push(new THREE.Vector3(centerX, baseHeight + 10, centerZ));
        
        // Descend into the scene
        for (let i = 1; i <= 3; i++) {
          const t = i / 3;
          waypoints.push(new THREE.Vector3(
            centerX + Math.sin(t * Math.PI) * photoSize * 2,
            baseHeight + 10 * (1 - t),
            centerZ + Math.cos(t * Math.PI) * photoSize * 2
          ));
        }
        
        // Main wave following path - multiple passes
        const numPasses = 3;
        for (let pass = 0; pass < numPasses; pass++) {
          const passRadius = fieldRadius * (0.5 + pass * 0.3);
          const numPoints = 20;
          
          for (let i = 0; i < numPoints; i++) {
            const t = i / numPoints;
            const angle = t * Math.PI * 2;
            
            // Calculate wave position
            const x = centerX + Math.cos(angle) * passRadius;
            const z = centerZ + Math.sin(angle) * passRadius;
            const distFromCenter = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);
            const wavePhase = distFromCenter * waveFrequency;
            const waveHeight = Math.sin(wavePhase) * (heightVar / 2);
            
            // Add variation based on pass
            const passOffset = Math.sin(angle * 2 + pass) * (distVar / 2);
            
            waypoints.push(new THREE.Vector3(
              x + Math.cos(angle + Math.PI/2) * passOffset,
              baseHeight + waveHeight,
              z + Math.sin(angle + Math.PI/2) * passOffset
            ));
          }
        }
        
        // Return to center with ascent
        for (let i = 1; i <= 4; i++) {
          const t = i / 4;
          waypoints.push(new THREE.Vector3(
            centerX + Math.cos(t * Math.PI * 2) * fieldRadius * (1 - t),
            baseHeight + t * 10,
            centerZ + Math.sin(t * Math.PI * 2) * fieldRadius * (1 - t)
          ));
        }
        break;
        
      case 'spiral_tour':
        // Spiral path with proper scene scaling
        const spiralRadius = settings.patterns?.spiral?.radius || fieldRadius;
        const spiralHeight = settings.patterns?.spiral?.heightStep || 0.5;
        const spiralPoints = 40;
        
        for (let i = 0; i < spiralPoints; i++) {
          const t = i / spiralPoints;
          const angle = t * Math.PI * 6; // 3 full rotations
          const radius = spiralRadius * (0.3 + t * 0.7);
          const height = baseHeight + t * heightVar + Math.sin(angle * 2) * 2;
          
          waypoints.push(new THREE.Vector3(
            centerX + Math.cos(angle) * radius,
            height,
            centerZ + Math.sin(angle) * radius
          ));
        }
        break;
        
      case 'showcase':
      case 'gallery_walk':
        // Visit each position with proper viewing distance
        const viewingDistance = baseDistance;
        
        photoPositions.forEach((pos, i) => {
          const angle = Math.atan2(pos.position[2] - centerZ, pos.position[0] - centerX);
          const offsetAngle = angle - Math.PI * 0.2; // Slight offset for better viewing
          
          waypoints.push(new THREE.Vector3(
            pos.position[0] - Math.cos(offsetAngle) * viewingDistance,
            baseHeight + Math.sin(i * 0.2) * heightVar,
            pos.position[2] - Math.sin(offsetAngle) * viewingDistance
          ));
          
          // Add intermediate point for smoother movement
          if (i < photoPositions.length - 1) {
            const nextPos = photoPositions[i + 1];
            waypoints.push(new THREE.Vector3(
              (pos.position[0] + nextPos.position[0]) / 2,
              baseHeight + Math.sin((i + 0.5) * 0.2) * heightVar,
              (pos.position[2] + nextPos.position[2]) / 2 + viewingDistance / 2
            ));
          }
        });
        break;
        
      case 'grid_sweep':
        // Grid pattern sweep
        const gridWallHeight = settings.patterns?.grid?.wallHeight || 0;
        const sweepHeight = baseHeight + gridWallHeight;
        const rows = 4;
        const cols = 5;
        
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const colIndex = r % 2 === 0 ? c : cols - 1 - c; // Zigzag
            const x = minX - 10 + (colIndex / (cols - 1)) * (maxX - minX + 20);
            const z = minZ - 10 + (r / (rows - 1)) * (maxZ - minZ + 20);
            
            waypoints.push(new THREE.Vector3(
              x,
              sweepHeight + Math.sin(r * c * 0.3) * heightVar,
              z + baseDistance
            ));
          }
        }
        break;
        
      case 'photo_focus':
        // Close-up views of positions
        const focusDistance = photoSize * 2;
        
        photoPositions.forEach((pos, idx) => {
          // Multiple angles around each position
          for (let a = 0; a < 3; a++) {
            const angle = (a / 3) * Math.PI * 2;
            waypoints.push(new THREE.Vector3(
              pos.position[0] + Math.cos(angle) * focusDistance,
              pos.position[1] + baseHeight / 2,
              pos.position[2] + Math.sin(angle) * focusDistance
            ));
          }
        });
        break;
    }

    if (waypoints.length < 2) {
      console.warn('Not enough waypoints generated');
      return null;
    }

    console.log(`✅ Generated ${waypoints.length} waypoints for ${config.type}`);
    return new SmoothCameraPath(waypoints);
  }, [config?.enabled, config?.type, config?.baseHeight, config?.baseDistance, 
      config?.heightVariation, config?.distanceVariation, photoPositions, settings, animationPattern]);

  // Update path reference
  useEffect(() => {
    pathRef.current = cameraPath;
    if (cameraPath) {
      progressRef.current = 0;
      isActiveRef.current = true;
      console.log('🎬 Camera animation started');
    }
  }, [cameraPath]);

  // Handle user interaction
  useEffect(() => {
    if (!config?.enabled) return;

    const handleInteraction = () => {
      userInteractingRef.current = true;
      lastInteractionTimeRef.current = Date.now();
    };

    const handleInteractionEnd = () => {
      setTimeout(() => {
        userInteractingRef.current = false;
        console.log('🎬 Resuming camera animation');
      }, (config.resumeDelay || 2) * 1000);
    };

    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('wheel', handleInteraction);
    window.addEventListener('mouseup', handleInteractionEnd);
    window.addEventListener('touchend', handleInteractionEnd);

    return () => {
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('wheel', handleInteraction);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [config]);

  // Animation loop
  useFrame((state, delta) => {
    if (!config?.enabled || !pathRef.current || config.type === 'none') {
      return;
    }

    // Check if user is interacting
    const timeSinceInteraction = Date.now() - lastInteractionTimeRef.current;
    if (userInteractingRef.current || timeSinceInteraction < 2000) {
      return;
    }

    // Update progress
    const speed = (config.speed || 1) * 0.01;
    progressRef.current = (progressRef.current + delta * speed) % 1;

    // Get position and look-at target
    const targetPos = pathRef.current.getPositionAt(progressRef.current);
    const lookAt = pathRef.current.getLookAtTarget(progressRef.current, photoPositions);

    // Apply smooth movement
    camera.position.lerp(targetPos, 0.02);
    
    // Smooth look-at
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(50).add(camera.position);
    currentLookAt.lerp(lookAt, 0.02);
    camera.lookAt(currentLookAt);

    // Update controls if present
    if (controls && 'target' in controls) {
      (controls as any).target.lerp(lookAt, 0.02);
      (controls as any).update();
    }

    // Log progress occasionally
    if (Math.floor(progressRef.current * 100) % 25 === 0) {
      const phase = Math.floor(progressRef.current * 100);
      if (phase > 0) {
        console.log(`🎬 Camera tour: ${phase}% complete`);
      }
    }
  });

  return null;
};

export default SmoothCinematicCameraController;