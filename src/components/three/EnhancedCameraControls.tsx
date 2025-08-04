// src/components/three/SmoothCinematicCameraController.tsx
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
      // Focus on the closest photo
      const target = new THREE.Vector3(...nearbyPhotos[0].photo.position);
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

// Smart path generators for different showcase types
class CinematicPathGenerator {
  static generateShowcasePath(photos: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!photos.length) return [];

    const photoSize = settings.photoSize || 4;
    const optimalHeight = -4; // Just above floor particles
    const viewingDistance = photoSize * 2;

    // Sort photos for optimal viewing order (serpentine grid pattern)
    const photosByZ = new Map<number, PhotoPosition[]>();
    photos.forEach(photo => {
      const z = Math.round(photo.position[2] / photoSize) * photoSize;
      if (!photosByZ.has(z)) photosByZ.set(z, []);
      photosByZ.get(z)!.push(photo);
    });

    const waypoints: THREE.Vector3[] = [];
    const sortedZRows = Array.from(photosByZ.keys()).sort((a, b) => b - a);
    
    sortedZRows.forEach((z, rowIndex) => {
      const rowPhotos = photosByZ.get(z)!.sort((a, b) => 
        rowIndex % 2 === 0 ? a.position[0] - b.position[0] : b.position[0] - a.position[0]
      );
      
      rowPhotos.forEach((photo, photoIndex) => {
        // Create smooth viewing positions
        const offset = Math.sin(photoIndex * 0.5) * photoSize * 0.3;
        waypoints.push(new THREE.Vector3(
          photo.position[0] + offset,
          optimalHeight + Math.sin(photoIndex * 0.3) * 2,
          photo.position[2] + viewingDistance + Math.cos(photoIndex * 0.2) * 1
        ));
      });
    });

    return waypoints;
  }

  static generateGalleryWalkPath(photos: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!photos.length) return [];

    const photoSize = settings.photoSize || 4;
    const walkHeight = -3;
    const walkDistance = photoSize * 2.5;

    // Create a walking path that visits photos in a natural gallery-style route
    const sortedPhotos = [...photos].sort((a, b) => {
      // Sort by Z first (depth), then by X (left to right)
      if (Math.abs(a.position[2] - b.position[2]) > photoSize) {
        return b.position[2] - a.position[2]; // Back to front
      }
      return a.position[0] - b.position[0]; // Left to right
    });

    const waypoints: THREE.Vector3[] = [];

    sortedPhotos.forEach((photo, index) => {
      const angle = Math.atan2(photo.position[2], photo.position[0]);
      const walkOffset = Math.sin(index * 0.1) * photoSize * 0.2;
      
      waypoints.push(new THREE.Vector3(
        photo.position[0] - Math.cos(angle) * walkDistance + walkOffset,
        walkHeight + Math.sin(index * 0.05) * 1,
        photo.position[2] - Math.sin(angle) * walkDistance
      ));
    });

    return waypoints;
  }

  static generateSpiralTourPath(photos: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!photos.length) return [];

    const photoSize = settings.photoSize || 4;
    const spiralHeight = -2;

    // Create a spiral that encompasses all photos
    const bounds = this.getPhotoBounds(photos);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const maxRadius = Math.max(bounds.maxX - centerX, bounds.maxZ - centerZ) + photoSize * 2;

    const waypoints: THREE.Vector3[] = [];
    const spiralTurns = 3;
    const pointsPerTurn = 20;
    const totalPoints = spiralTurns * pointsPerTurn;

    for (let i = 0; i < totalPoints; i++) {
      const t = i / totalPoints;
      const angle = t * spiralTurns * Math.PI * 2;
      const radius = maxRadius * (0.3 + t * 0.7); // Start inner, spiral out
      const height = spiralHeight + Math.sin(t * Math.PI * 2) * 3;

      waypoints.push(new THREE.Vector3(
        centerX + Math.cos(angle) * radius,
        height,
        centerZ + Math.sin(angle) * radius
      ));
    }

    return waypoints;
  }

  static generateWaveFollowPath(photos: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!photos.length) return [];

    const photoSize = settings.photoSize || 4;
    const waveHeight = -2;

    // Sort photos by X position to follow wave
    const sortedPhotos = [...photos].sort((a, b) => a.position[0] - b.position[0]);
    const waypoints: THREE.Vector3[] = [];

    sortedPhotos.forEach((photo, index) => {
      const waveOffset = Math.sin(index * 0.2) * photoSize;
      const heightVariation = Math.sin(index * 0.1) * 2;
      
      waypoints.push(new THREE.Vector3(
        photo.position[0],
        waveHeight + heightVariation,
        photo.position[2] - photoSize * 1.8 + waveOffset
      ));
    });

    return waypoints;
  }

  static generateGridSweepPath(photos: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!photos.length) return [];

    const photoSize = settings.photoSize || 4;
    const sweepHeight = -3;

    // Grid sweep - systematic left-to-right, top-to-bottom
    const bounds = this.getPhotoBounds(photos);
    const waypoints: THREE.Vector3[] = [];

    const rows = Math.ceil((bounds.maxZ - bounds.minZ) / photoSize) + 2;
    const cols = Math.ceil((bounds.maxX - bounds.minX) / photoSize) + 2;

    for (let row = 0; row < rows; row++) {
      const z = bounds.minZ + (row / rows) * (bounds.maxZ - bounds.minZ);
      const isEvenRow = row % 2 === 0;
      
      for (let col = 0; col < cols; col++) {
        const colIndex = isEvenRow ? col : cols - 1 - col;
        const x = bounds.minX + (colIndex / cols) * (bounds.maxX - bounds.minX);
        const heightVariation = Math.sin(row * 0.3 + col * 0.2) * 1;
        
        waypoints.push(new THREE.Vector3(
          x,
          sweepHeight + heightVariation,
          z + photoSize * 2
        ));
      }
    }

    return waypoints;
  }

  static generatePhotoFocusPath(photos: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!photos.length) return [];

    const photoSize = settings.photoSize || 4;
    const focusDistance = photoSize * 1.5;

    // Create intimate close-up path
    const waypoints: THREE.Vector3[] = [];

    photos.forEach((photo, index) => {
      // Multiple angles around each photo for detailed viewing
      const angles = [0, Math.PI * 0.4, Math.PI * 0.8, Math.PI * 1.2, Math.PI * 1.6];
      
      angles.forEach((angle, angleIndex) => {
        const radius = focusDistance + Math.sin(angleIndex) * photoSize * 0.3;
        const height = photo.position[1] + Math.cos(angleIndex * 0.5) * photoSize * 0.4;
        
        waypoints.push(new THREE.Vector3(
          photo.position[0] + Math.cos(angle) * radius,
          Math.max(height, -6),
          photo.position[2] + Math.sin(angle) * radius
        ));
      });
    });

    return waypoints;
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

  // Generate smooth camera path based on photo positions and tour type
  const cameraPath = useMemo(() => {
    if (!config?.enabled || !photoPositions.length || config.type === 'none') {
      return null;
    }

    const validPhotos = photoPositions.filter(p => p.id && !p.id.startsWith('placeholder-'));
    if (!validPhotos.length) return null;

    console.log(`🎬 Generating smooth ${config.type} path for ${validPhotos.length} photos`);

    let waypoints: THREE.Vector3[] = [];

    switch (config.type) {
      case 'showcase':
        waypoints = CinematicPathGenerator.generateShowcasePath(validPhotos, settings);
        break;
      case 'gallery_walk':
        waypoints = CinematicPathGenerator.generateGalleryWalkPath(validPhotos, settings);
        break;
      case 'spiral_tour':
        waypoints = CinematicPathGenerator.generateSpiralTourPath(validPhotos, settings);
        break;
      case 'wave_follow':
        waypoints = CinematicPathGenerator.generateWaveFollowPath(validPhotos, settings);
        break;
      case 'grid_sweep':
        waypoints = CinematicPathGenerator.generateGridSweepPath(validPhotos, settings);
        break;
      case 'photo_focus':
        waypoints = CinematicPathGenerator.generatePhotoFocusPath(validPhotos, settings);
        break;
      default:
        return null;
    }

    if (waypoints.length < 2) return null;

    // Create smooth continuous path
    const smoothPath = new SmoothCameraPath(waypoints, true);
    
    // Reset progress and visibility tracking
    pathProgressRef.current = 0;
    visibilityTrackerRef.current.clear();
    
    return smoothPath;
  }, [photoPositions, config?.type, config?.enabled, settings, animationPattern]);

  // Update path reference
  useEffect(() => {
    currentPathRef.current = cameraPath;
  }, [cameraPath]);

  // User interaction detection
  useEffect(() => {
    if (!controls) return;

    const handleStart = () => {
      userInteractingRef.current = true;
      lastInteractionRef.current = Date.now();
    };

    const handleEnd = () => {
      userInteractingRef.current = false;
      lastInteractionRef.current = Date.now();
    };

    if ('addEventListener' in controls) {
      controls.addEventListener('start', handleStart);
      controls.addEventListener('end', handleEnd);
      
      return () => {
        controls.removeEventListener('start', handleStart);
        controls.removeEventListener('end', handleEnd);
      };
    }
  }, [controls]);

  // Smooth animation loop
  useFrame((state, delta) => {
    if (!config?.enabled || !currentPathRef.current || config.type === 'none') {
      isActiveRef.current = false;
      return;
    }

    // Pause during user interaction
    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const pauseDuration = 2000;

    if (userInteractingRef.current || timeSinceInteraction < pauseDuration) {
      isActiveRef.current = false;
      return;
    }

    // Activate smooth animation
    if (!isActiveRef.current) {
      isActiveRef.current = true;
    }

    // Smooth continuous movement
    const speed = (config.speed || 1.0) * 0.02; // Slower for smoother movement
    pathProgressRef.current += delta * speed;
    pathProgressRef.current = pathProgressRef.current % 1; // Loop the path

    // Get smooth camera position
    const targetPosition = currentPathRef.current.getPositionAt(pathProgressRef.current);
    
    // Get smooth look-at target
    const lookAtTarget = currentPathRef.current.getLookAtTarget(
      pathProgressRef.current, 
      photoPositions, 
      config.focusDistance || 12
    );

    // Apply smooth camera movement
    camera.position.lerp(targetPosition, 0.03); // Very smooth lerping
    camera.lookAt(lookAtTarget);

    // Update controls
    if (controls && 'target' in controls) {
      (controls as any).target.lerp(lookAtTarget, 0.02);
      (controls as any).update();
    }

    // Track photo visibility for progress
    photoPositions.forEach(photo => {
      if (!photo.id.startsWith('placeholder-')) {
        const photoVec = new THREE.Vector3(...photo.position);
        const distance = camera.position.distanceTo(photoVec);
        if (distance <= (config.focusDistance || 12)) {
          visibilityTrackerRef.current.add(photo.id);
        }
      }
    });

    // Log progress occasionally
    if (Math.floor(pathProgressRef.current * 100) % 25 === 0 && Math.floor(pathProgressRef.current * 100) !== 0) {
      const viewedCount = visibilityTrackerRef.current.size;
      const totalPhotos = photoPositions.filter(p => !p.id.startsWith('placeholder-')).length;
      
      if (viewedCount > 0) {
        console.log(`🎬 Smooth camera tour: ${viewedCount}/${totalPhotos} photos showcased (${Math.round(viewedCount/totalPhotos*100)}%)`);
      }
    }
  });

  // Debug info
  useEffect(() => {
    if (config?.enabled && cameraPath) {
      console.log(`🎬 Smooth Cinematic Camera Active: ${config.type}`);
      console.log(`📹 Continuous path generated - perfect for video recording!`);
      console.log(`🎯 Pattern: ${animationPattern}, Speed: ${config.speed}, Focus: ${config.focusDistance}`);
    }
  }, [config?.enabled, config?.type, cameraPath, animationPattern]);

  return null;
};

export default SmoothCinematicCameraController;