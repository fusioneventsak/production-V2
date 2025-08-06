// src/components/three/SmoothCinematicCameraController.tsx - FIXED WAVE PATTERN CAMERA
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
    if (!waypoints || waypoints.length < 2) {
      console.warn('⚠️ Not enough waypoints for smooth path');
      // Create a simple circular path as fallback
      const fallbackPoints = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        fallbackPoints.push(new THREE.Vector3(
          Math.cos(angle) * 20,
          0,
          Math.sin(angle) * 20
        ));
      }
      this.points = fallbackPoints;
      this.curve = new THREE.CatmullRomCurve3(fallbackPoints, true);
      this.totalLength = 100;
      return;
    }

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
    
    // FIXED: Look at ALL positions equally (photos AND empty slots)
    const nearbyPositions = photoPositions
      .map(p => ({
        position: p,
        distance: currentPos.distanceTo(new THREE.Vector3(...p.position))
      }))
      .filter(p => p.distance <= focusDistance * 1.5)
      .sort((a, b) => a.distance - b.distance);

    if (nearbyPositions.length > 0) {
      // Focus on closest positions (whether photo or empty slot)
      const maxBlend = Math.min(nearbyPositions.length, 2);
      if (maxBlend === 1) {
        return new THREE.Vector3(...nearbyPositions[0].position.position);
      }
      
      // Blend between two closest for smoother transitions
      const target = new THREE.Vector3();
      let totalWeight = 0;
      for (let i = 0; i < maxBlend; i++) {
        const weight = 1 / (nearbyPositions[i].distance + 1);
        target.add(new THREE.Vector3(...nearbyPositions[i].position.position).multiplyScalar(weight));
        totalWeight += weight;
      }
      return target.divideScalar(totalWeight);
    } else {
      // Look ahead along the path
      const lookAheadT = (t + 0.05) % 1;
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

  // COMPLETELY REWRITTEN: Wave follow that treats ALL positions equally
  static generateWaveFollowPath(positions: PhotoPosition[], settings: any): THREE.Vector3[] {
    if (!positions.length) {
      console.warn('⚠️ No positions provided for wave follow path');
      return [];
    }

    const photoSize = settings.photoSize || 4;
    const waveAmplitude = settings.patterns?.wave?.amplitude || 15;
    const waveFrequency = settings.patterns?.wave?.frequency || 0.3;
    
    // Count actual photos vs empty slots for logging only
    const actualPhotos = positions.filter(p => !p.id.startsWith('placeholder-'));
    const emptySlots = positions.filter(p => p.id.startsWith('placeholder-'));
    
    console.log('🌊 Generating wave follow path - treating ALL positions EQUALLY');
    console.log(`📸 Total positions: ${positions.length} (${actualPhotos.length} photos, ${emptySlots.length} empty slots)`);
    console.log('✅ Camera will showcase the ENTIRE wave pattern!');

    // Analyze the complete layout
    const bounds = this.getPhotoBounds(positions);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const fieldWidth = bounds.maxX - bounds.minX;
    const fieldDepth = bounds.maxZ - bounds.minZ;
    const fieldRadius = Math.sqrt(fieldWidth * fieldWidth + fieldDepth * fieldDepth) / 2;
    
    console.log('📍 Wave field bounds:', {
      center: `(${centerX.toFixed(1)}, ${centerZ.toFixed(1)})`,
      size: `${fieldWidth.toFixed(1)} x ${fieldDepth.toFixed(1)}`,
      radius: fieldRadius.toFixed(1)
    });

    const waypoints: THREE.Vector3[] = [];
    
    // Calculate optimal viewing distance
    const optimalDistance = photoSize * 3.5;
    
    // START FROM CENTER - Dramatic entrance
    const startHeight = 8;
    waypoints.push(new THREE.Vector3(centerX, startHeight, centerZ));
    
    // Dramatic descent into the scene
    for (let i = 1; i <= 4; i++) {
      const t = i / 4;
      const height = startHeight * (1 - t) + (-1) * t;
      const spiralAngle = t * Math.PI;
      waypoints.push(new THREE.Vector3(
        centerX + Math.sin(spiralAngle) * photoSize * 2,
        height,
        centerZ + Math.cos(spiralAngle) * photoSize * 2
      ));
    }

    // PATH 1: Expanding spiral to see ALL positions
    const spiralTurns = 2.5;
    const spiralPoints = 40;
    for (let i = 0; i < spiralPoints; i++) {
      const t = i / spiralPoints;
      const angle = t * spiralTurns * Math.PI * 2;
      const radius = photoSize * 2 + (t * fieldRadius * 0.9);
      
      const wavePhase = radius * waveFrequency;
      const waveHeight = Math.sin(wavePhase) * 2.5;
      
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;
      const y = -2 + waveHeight + Math.sin(t * Math.PI * 3) * 1.5;
      
      waypoints.push(new THREE.Vector3(x, y, z));
    }

    // PATH 2: Grid sweep to ensure we see EVERY position
    const gridRows = 5;
    const gridCols = 5;
    for (let row = 0; row < gridRows; row++) {
      const rowT = row / (gridRows - 1);
      const z = bounds.minZ - optimalDistance + rowT * (fieldDepth + optimalDistance * 2);
      
      for (let col = 0; col < gridCols; col++) {
        const colT = col / (gridCols - 1);
        // Zigzag pattern
        const actualColT = row % 2 === 0 ? colT : 1 - colT;
        const x = bounds.minX - optimalDistance/2 + actualColT * (fieldWidth + optimalDistance);
        
        const distFromCenter = Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);
        const wavePhase = distFromCenter * waveFrequency;
        const y = -3 + Math.sin(wavePhase) * 3 + Math.cos(row * col * 0.3) * 1;
        
        waypoints.push(new THREE.Vector3(x, y, z));
      }
    }

    // PATH 3: Circular orbits at different heights
    const orbitCount = 3;
    for (let orbit = 0; orbit < orbitCount; orbit++) {
      const orbitRadius = fieldRadius * (0.5 + orbit * 0.25);
      const orbitHeight = -4 + orbit * 2;
      const pointsPerOrbit = 24;
      
      for (let i = 0; i < pointsPerOrbit; i++) {
        const angle = (i / pointsPerOrbit) * Math.PI * 2;
        
        const wavePhase = orbitRadius * waveFrequency + orbit;
        const waveModulation = Math.sin(wavePhase) * 2;
        
        const x = centerX + Math.cos(angle) * orbitRadius;
        const z = centerZ + Math.sin(angle) * orbitRadius;
        const y = orbitHeight + waveModulation + Math.sin(angle * 3) * 1;
        
        waypoints.push(new THREE.Vector3(x, y, z));
      }
    }

    // PATH 4: Direct position visits - ensure we get close to ALL positions
    const visitStep = Math.max(1, Math.floor(positions.length / 20)); // Visit up to 20 positions directly
    for (let i = 0; i < positions.length; i += visitStep) {
      const pos = positions[i];
      const angle = Math.atan2(pos.position[2] - centerZ, pos.position[0] - centerX);
      
      // Approach position from a good viewing angle
      const viewX = pos.position[0] - Math.cos(angle) * optimalDistance;
      const viewZ = pos.position[2] - Math.sin(angle) * optimalDistance;
      
      const dist = Math.sqrt((pos.position[0] - centerX) ** 2 + (pos.position[2] - centerZ) ** 2);
      const wavePhase = dist * waveFrequency;
      const viewY = -2 + Math.sin(wavePhase) * 2;
      
      waypoints.push(new THREE.Vector3(viewX, viewY, viewZ));
    }

    // PATH 5: Return sweep with ascent
    const returnPoints = 10;
    for (let i = 0; i < returnPoints; i++) {
      const t = i / returnPoints;
      const angle = Math.PI * 2 * (1 - t * 0.5);
      const radius = fieldRadius * (0.7 - t * 0.4);
      const height = -2 + t * 6;
      
      waypoints.push(new THREE.Vector3(
        centerX + Math.cos(angle) * radius,
        height,
        centerZ + Math.sin(angle) * radius
      ));
    }

    console.log(`🌊 Successfully generated ${waypoints.length} waypoints`);
    console.log('✅ Path will showcase ALL positions in the wave pattern');
    console.log('📹 Ready for cinematic animation!');
    
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

  private static getPhotoBounds(positions: PhotoPosition[]) {
    if (!positions || positions.length === 0) {
      console.warn('⚠️ No positions to calculate bounds');
      return {
        minX: -50,
        maxX: 50,
        minZ: -50,
        maxZ: 50
      };
    }
    
    const validPositions = positions.filter(p => 
      p && p.position && 
      typeof p.position[0] === 'number' && 
      typeof p.position[2] === 'number' &&
      !isNaN(p.position[0]) && 
      !isNaN(p.position[2])
    );
    
    if (validPositions.length === 0) {
      console.warn('⚠️ No valid positions found, using default bounds');
      return {
        minX: -50,
        maxX: 50,
        minZ: -50,
        maxZ: 50
      };
    }
    
    const xValues = validPositions.map(p => p.position[0]);
    const zValues = validPositions.map(p => p.position[2]);
    
    return {
      minX: Math.min(...xValues),
      maxX: Math.max(...xValues),
      minZ: Math.min(...zValues),
      maxZ: Math.max(...zValues)
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

  // Add automatic config change detection
  const lastConfigRef = useRef<string>('');
  const isConfigTransitioningRef = useRef(false);
  const configTransitionStartRef = useRef(0);
  const configStartPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const configStartLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // Generate smooth camera path based on photo positions and tour type
  const cameraPath = useMemo(() => {
    if (!config?.enabled || !photoPositions.length || config.type === 'none') {
      return null;
    }

    // Use ALL positions - no filtering
    const allPositions = [...photoPositions]; // Create a copy
    if (!allPositions.length) {
      console.warn('⚠️ No positions available for camera path');
      return null;
    }
    
    const actualPhotos = allPositions.filter(p => p.id && !p.id.startsWith('placeholder-'));
    const emptySlots = allPositions.filter(p => p.id && p.id.startsWith('placeholder-'));
    
    console.log(`🎬 Generating ${config.type} path for ${allPositions.length} positions`);
    console.log(`📸 Breakdown: ${actualPhotos.length} photos, ${emptySlots.length} empty slots`);

    let waypoints: THREE.Vector3[] = [];

    // Generate waypoints based on type
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

    if (!waypoints || waypoints.length < 2) {
      console.warn(`⚠️ Not enough waypoints generated (${waypoints?.length || 0}). Need at least 2.`);
      return null;
    }

    // Create smooth continuous path
    const smoothPath = new SmoothCameraPath(waypoints, true);
    
    // Reset progress and visibility tracking
    pathProgressRef.current = 0;
    visibilityTrackerRef.current.clear();
    
    console.log(`✅ Camera path created with ${waypoints.length} waypoints`);
    
    return smoothPath;

    if (waypoints.length < 2) {
      console.warn(`⚠️ Not enough waypoints generated (${waypoints.length}). Need at least 2.`);
      return null;
    }

    // Create smooth continuous path
    const smoothPath = new SmoothCameraPath(waypoints, true);
    
    // Reset progress and visibility tracking
    pathProgressRef.current = 0;
    visibilityTrackerRef.current.clear();
    
    console.log(`✅ Camera path created with ${waypoints.length} waypoints`);
    
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

    // Get interaction settings with defaults - ALWAYS ignore mouse movement by default
    const ignoreMouseMovement = config.ignoreMouseMovement !== false; // Default: true
    const sensitivity = config.interactionSensitivity || 'medium';

    const handleInteractionStart = (e: Event) => {
      const eventType = e.type;
      
      // Only detect clicks, touches, and wheel - NEVER mouse movement
      if (eventType === 'mousedown' || eventType === 'touchstart') {
        console.log('🎮 Camera Animation: User interaction started -', eventType);
        userInteractingRef.current = true;
        lastInteractionRef.current = Date.now();
        
        // Store current position for resume-from-position
        if (config.resumeFromCurrentPosition !== false) {
          lastUserPositionRef.current = camera.position.clone();
          if (controls && 'target' in controls) {
            lastUserTargetRef.current = (controls as any).target.clone();
          }
        }
      }
      
      // Wheel events (zoom) - always detect
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
        
        // Start resume process after delay
        const resumeDelay = (config.resumeDelay || 2.0) * 1000;
        setTimeout(() => {
          userInteractingRef.current = false;
          console.log('🎬 Camera Animation: Auto-resuming after interaction');
        }, resumeDelay);
      }
    };

    // Only listen to actual interaction events - NO MOUSE MOVEMENT AT ALL
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

  // Also listen to OrbitControls events for better integration
  useEffect(() => {
    if (!controls || !config?.enabled) return;

    const handleControlStart = () => {
      console.log('🎮 Camera Animation: OrbitControls interaction started');
      userInteractingRef.current = true;
      lastInteractionRef.current = Date.now();
    };

    const handleControlEnd = () => {
      lastInteractionRef.current = Date.now();
      
      // Auto-resume after delay
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

  // Enhanced animation loop with automatic config change detection and smooth resume
  useFrame((state, delta) => {
    if (!config?.enabled || !currentPathRef.current || config.type === 'none') {
      isActiveRef.current = false;
      return;
    }

    // Automatic config change detection
    const currentConfigKey = `${config.type}-${config.speed}-${animationPattern}-${config.enabled}`;
    
    if (lastConfigRef.current !== '' && lastConfigRef.current !== currentConfigKey) {
      // Config changed! Start smooth transition automatically
      console.log(`🎬 CONFIG CHANGE AUTO-DETECTED: ${lastConfigRef.current} → ${currentConfigKey}`);
      
      isConfigTransitioningRef.current = true;
      configTransitionStartRef.current = Date.now();
      
      // Capture current camera state as starting point for transition
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

    // Check if we should pause for user interaction
    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const pauseDuration = (config.resumeDelay || 2.0) * 1000;

    if (userInteractingRef.current || timeSinceInteraction < pauseDuration) {
      isActiveRef.current = false;
      if (userInteractingRef.current && config.enableManualControl !== false) {
        // Allow full manual control during pause
        return;
      }
      return;
    }

    // Smooth resume with blending
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      isResuming.current = true;
      resumeBlendRef.current = 0;
      console.log('🎬 Camera Animation: Smoothly resuming animation');
    }

    // Smooth continuous movement
    const speed = (config.speed || 1.0) * 0.015; // Slightly slower for smoother movement
    pathProgressRef.current += delta * speed;
    pathProgressRef.current = pathProgressRef.current % 1; // Loop the path

    // Get smooth camera position
    const targetPosition = currentPathRef.current.getPositionAt(pathProgressRef.current);
    
    // Get smooth look-at target with better blending
    const lookAtTarget = currentPathRef.current.getLookAtTarget(
      pathProgressRef.current, 
      photoPositions, 
      config.focusDistance || 15
    );

    // Handle automatic config transitions (takes priority)
    const configTransitionTime = 2500; // 2.5 seconds for config transitions
    const timeSinceConfigChange = Date.now() - configTransitionStartRef.current;
    
    if (isConfigTransitioningRef.current && timeSinceConfigChange < configTransitionTime) {
      // SMOOTH CONFIG TRANSITION
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
        console.log('🎬 Automatic config transition completed - now following new animation type');
      }
      
      return; // Skip other logic during config transition
    }

    // Smooth blending when resuming from user interaction
    let lerpFactor = 0.025; // Slightly slower for smoother movement
    
    if (isResuming.current) {
      const blendDuration = config.blendDuration || 2.0;
      resumeBlendRef.current += delta;
      
      if (resumeBlendRef.current < blendDuration) {
        // Gradual blend from current position to animation path
        const blendProgress = resumeBlendRef.current / blendDuration;
        lerpFactor = 0.008 + (blendProgress * 0.017); // Start very slow, speed up gradually
      } else {
        isResuming.current = false;
        console.log('🎬 Camera Animation: Resume blend complete');
      }
    }

    // Apply smooth camera movement
    camera.position.lerp(targetPosition, lerpFactor);
    
    // Smooth look-at with easing
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(50).add(camera.position);
    currentLookAt.lerp(lookAtTarget, lerpFactor * 0.6);
    camera.lookAt(currentLookAt);

    // Update controls
    if (controls && 'target' in controls) {
      (controls as any).target.lerp(lookAtTarget, lerpFactor * 0.4);
      (controls as any).update();
    }

    // Track visibility for ALL positions (photos AND empty slots)
    photoPositions.forEach(position => {
      const posVec = new THREE.Vector3(...position.position);
      const distance = camera.position.distanceTo(posVec);
      if (distance <= (config.focusDistance || 15)) {
        visibilityTrackerRef.current.add(position.id);
      }
    });

    // Log progress occasionally
    if (Math.floor(pathProgressRef.current * 100) % 20 === 0 && Math.floor(pathProgressRef.current * 100) !== 0) {
      const viewedCount = visibilityTrackerRef.current.size;
      const totalPositions = photoPositions.length;
      const actualPhotos = photoPositions.filter(p => !p.id.startsWith('placeholder-')).length;
      
      console.log(`🎬 Camera tour progress: ${viewedCount}/${totalPositions} positions viewed (${actualPhotos} photos, ${totalPositions - actualPhotos} empty slots)`);
      console.log(`📍 Current position: (${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)})`);
    }
  });

  // Debug info
  useEffect(() => {
    if (config?.enabled && cameraPath) {
      console.log(`🎬 FIXED Cinematic Camera Active: ${config.type}`);
      console.log(`🌊 Wave pattern: Now visits ALL photos in spiral pattern!`);
      console.log(`📸 Photos will be viewed from multiple angles`);
      console.log(`🚫 Mouse hover ignored: ${config.ignoreMouseMovement !== false}`);
      console.log(`🔄 Auto config change detection: ENABLED`);
      console.log(`⚙️ Auto-resume after: ${config.resumeDelay || 2.0}s`);
      console.log(`🎮 Manual control: ${config.enableManualControl !== false ? 'enabled' : 'disabled'}`);
      console.log(`📹 Smooth continuous loops - perfect for video recording!`);
      console.log(`🎯 Pattern: ${animationPattern}, Speed: ${config.speed}, Focus: ${config.focusDistance}`);
    }
  }, [config?.enabled, config?.type, cameraPath, animationPattern, config?.ignoreMouseMovement, config?.resumeDelay, config?.enableManualControl]);

  return null;
};

export default SmoothCinematicCameraController;