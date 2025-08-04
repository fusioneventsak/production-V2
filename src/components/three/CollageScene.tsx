// Enhanced CollageScene with WORKING Camera Systems and FIXED Pattern Spacing
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

// Extended settings for scene environments + Camera Systems
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
  
  // Cinematic Camera Animation Settings
  cameraAnimation?: {
    enabled?: boolean;
    type: 'none' | 'showcase' | 'gallery_walk' | 'spiral_tour' | 'wave_follow' | 'grid_sweep' | 'photo_focus';
    speed: number;
    focusDistance: number;
    heightOffset: number;
    transitionTime: number;
    pauseTime: number;
    randomization: number;
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
    
    // Debug occasionally
    if (Math.floor(timeRef.current * 10) % 100 === 0) {
      console.log('🔄 Auto-rotate:', {
        radius: radius.toFixed(1),
        height: (y + focusPoint.y).toFixed(1),
        angle: (timeRef.current % (Math.PI * 2)).toFixed(2),
        phi: phi.toFixed(2)
      });
    }
  });

  return null;
};

// FIXED CINEMATIC CAMERA - Much more graceful movements
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
  };
  photoPositions: PhotoPosition[];
  settings: ExtendedSceneSettings;
}> = ({ config, photoPositions, settings }) => {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const userInteractingRef = useRef(false);
  const lastInteractionRef = useRef(0);

  // User interaction detection (only on canvas, not UI)
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === canvas) {
        userInteractingRef.current = true;
        lastInteractionRef.current = Date.now();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.target === canvas) {
        userInteractingRef.current = false;
        lastInteractionRef.current = Date.now();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.target === canvas) {
        userInteractingRef.current = true;
        lastInteractionRef.current = Date.now();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.target === canvas) {
        userInteractingRef.current = false;
        lastInteractionRef.current = Date.now();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.target === canvas) {
        lastInteractionRef.current = Date.now();
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useFrame((state, delta) => {
    if (!config?.enabled || config.type === 'none' || !photoPositions.length) {
      return;
    }

    // Check for user interaction pause
    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const pauseDuration = (config.pauseTime || 2) * 1000;

    if (userInteractingRef.current || timeSinceInteraction < pauseDuration) {
      return;
    }

    const validPhotos = photoPositions.filter(p => !p.id.startsWith('placeholder-'));
    if (!validPhotos.length) return;

    const speed = (config.speed || 1.0) * 0.2;
    timeRef.current += delta * speed;

    // FIXED: Better height calculations to prevent looking down at floor
    const photoSize = settings.photoSize || 4;
    const floorHeight = -12;
    const minCameraHeight = floorHeight + photoSize * 2; // Stay well above floor
    const preferredHeight = Math.max(settings.cameraHeight || 5, minCameraHeight);
    const photoDisplayHeight = floorHeight + photoSize; // Where photos are displayed
    
    // Get photo bounds for centered tours
    const centerX = validPhotos.reduce((sum, p) => sum + p.position[0], 0) / validPhotos.length;
    const centerZ = validPhotos.reduce((sum, p) => sum + p.position[2], 0) / validPhotos.length;
    const maxDistance = Math.max(...validPhotos.map(p => 
      Math.sqrt((p.position[0] - centerX) ** 2 + (p.position[2] - centerZ) ** 2)
    ));

    // FIXED: Better distance scaling
    const baseDistance = Math.max(settings.cameraDistance || 25, maxDistance + photoSize * 3);
    const scaleDistance = baseDistance * 0.8; // Slightly closer for better viewing

    let x, y, z, lookX, lookY, lookZ;

    switch (config.type) {
      case 'showcase':
        // FIXED: Elegant figure-8 with proper height management
        const fig8Time = timeRef.current * 0.4;
        const fig8Radius = scaleDistance * 0.9;
        
        x = centerX + Math.sin(fig8Time) * fig8Radius;
        y = preferredHeight + Math.sin(fig8Time * 1.5) * (photoSize * 0.4); // Gentler height variation
        z = centerZ + Math.sin(fig8Time * 2) * fig8Radius * 0.6;
        
        // FIXED: Look at photo display area, not floor
        lookX = centerX + Math.sin(fig8Time + 0.5) * fig8Radius * 0.2; // Look slightly ahead
        lookY = photoDisplayHeight + photoSize * 0.5; // Look at middle of photos
        lookZ = centerZ;
        break;

      case 'gallery_walk':
        // FIXED: More graceful rectangular walk
        const walkTime = (timeRef.current * 0.25) % 4;
        const walkMargin = scaleDistance * 0.7;
        const walkHeight = preferredHeight;
        
        if (walkTime < 1) {
          x = centerX - walkMargin + (walkTime * walkMargin * 2);
          z = centerZ + walkMargin;
        } else if (walkTime < 2) {
          x = centerX + walkMargin;
          z = centerZ + walkMargin - ((walkTime - 1) * walkMargin * 2);
        } else if (walkTime < 3) {
          x = centerX + walkMargin - ((walkTime - 2) * walkMargin * 2);
          z = centerZ - walkMargin;
        } else {
          x = centerX - walkMargin;
          z = centerZ - walkMargin + ((walkTime - 3) * walkMargin * 2);
        }
        
        y = walkHeight + Math.sin(timeRef.current * 0.3) * (photoSize * 0.2); // Gentle bobbing
        
        // FIXED: Always look toward photos at proper height
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
        break;

      case 'spiral_tour':
        // FIXED: Smooth spiral with consistent height
        const spiralTime = timeRef.current * 0.6;
        const spiralRadiusMin = scaleDistance * 0.4;
        const spiralRadiusMax = scaleDistance * 1.1;
        const spiralRadius = spiralRadiusMin + (spiralRadiusMax - spiralRadiusMin) * 
          (Math.sin(spiralTime * 0.15) + 1) / 2;
        
        x = centerX + Math.cos(spiralTime) * spiralRadius;
        y = preferredHeight + Math.sin(spiralTime * 0.2) * (photoSize * 0.3); // Gentle height variation
        z = centerZ + Math.sin(spiralTime) * spiralRadius;
        
        // FIXED: Look toward center at photo height
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
        break;

      case 'wave_follow':
        // FIXED: Smoother wave motion
        const waveTime = timeRef.current * 0.35;
        const waveAmplitude = scaleDistance * 0.8;
        
        x = centerX + Math.sin(waveTime) * waveAmplitude;
        y = preferredHeight + Math.sin(waveTime * 1.7) * (photoSize * 0.4);
        z = centerZ + Math.cos(waveTime * 0.6) * waveAmplitude * 0.7;
        
        // FIXED: Look ahead smoothly along wave path
        const lookAheadTime = waveTime + 0.4;
        lookX = centerX + Math.sin(lookAheadTime) * waveAmplitude * 0.3;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ + Math.cos(lookAheadTime * 0.6) * waveAmplitude * 0.3;
        break;

      case 'grid_sweep':
        // FIXED: Smoother lawnmower pattern
        const sweepTime = (timeRef.current * 0.2) % 8;
        const sweepWidth = scaleDistance * 0.8;
        const sweepHeight = preferredHeight;
        const rows = 4;
        
        const currentRow = Math.floor(sweepTime / 2);
        const rowProgress = (sweepTime % 2);
        const isEvenRow = currentRow % 2 === 0;
        
        // Smooth interpolation
        const smoothProgress = 0.5 - 0.5 * Math.cos(rowProgress * Math.PI);
        
        x = centerX + (isEvenRow ? 
          -sweepWidth + smoothProgress * sweepWidth * 2 : 
          sweepWidth - smoothProgress * sweepWidth * 2);
        y = sweepHeight - (currentRow * photoSize * 0.3);
        z = centerZ - sweepWidth + (currentRow / (rows - 1)) * sweepWidth * 2;
        
        // FIXED: Look at photos, not floor
        lookX = x + (isEvenRow ? photoSize * 2 : -photoSize * 2);
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = z;
        break;

      case 'photo_focus':
        // FIXED: Elegant infinity symbol
        const focusTime = timeRef.current * 0.5;
        const focusRadius = Math.max(scaleDistance * 0.5, photoSize * 4);
        
        const denominator = 1 + Math.sin(focusTime) ** 2;
        
        x = centerX + (focusRadius * Math.cos(focusTime)) / denominator;
        y = preferredHeight + Math.sin(focusTime * 1.3) * (photoSize * 0.2);
        z = centerZ + (focusRadius * Math.sin(focusTime) * Math.cos(focusTime)) / denominator;
        
        // FIXED: Always look at photos
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
        break;

      default:
        x = centerX + Math.cos(timeRef.current) * scaleDistance;
        y = preferredHeight;
        z = centerZ + Math.sin(timeRef.current) * scaleDistance;
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
    }

    // FIXED: Ensure camera never looks below photo level
    lookY = Math.max(lookY, photoDisplayHeight);
    y = Math.max(y, minCameraHeight);

    // Smooth camera updates
    camera.position.x = x;
    camera.position.y = y;
    camera.position.z = z;
    
    camera.lookAt(lookX, lookY, lookZ);

    // Debug occasionally
    if (Math.floor(timeRef.current * 5) % 50 === 0) {
      console.log(`🎬 ${config.type}: Camera Y=${y.toFixed(1)}, LookAt Y=${lookY.toFixed(1)}, Photos at Y=${photoDisplayHeight.toFixed(1)}`);
    }
  });

  return null;
};

// SIMPLE CAMERA CONTROLS - With cinematic interaction support
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
  
  // Initialize camera
  useEffect(() => {
    if (camera && !isCinematicActive && controlsRef.current) {
      const photoSize = settings.photoSize || 4;
      const distance = Math.max(settings.cameraDistance || 25, photoSize * 3);
      const height = Math.max(settings.cameraHeight || 5, photoSize + 2);
      
      camera.position.set(distance * 0.7, height, distance * 0.7);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      
      console.log('📷 Camera initialized for manual control');
    }
  }, [camera, isCinematicActive]);

  return (
    <>
      {/* OrbitControls - ALWAYS available for user interaction */}
      <OrbitControls
        ref={controlsRef}
        enabled={settings.cameraEnabled !== false}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={Math.max(10, (settings.photoSize || 4) * 2)}
        maxDistance={200}
        enableDamping={true}
        dampingFactor={0.05}
      />
      
      {/* Auto-Rotate only when cinematic is OFF */}
      {!isCinematicActive && (
        <AutoRotateCamera settings={settings} />
      )}
      
      {/* Cinematic Camera works alongside OrbitControls */}
      {isCinematicActive && (
        <CinematicCamera 
          config={settings.cameraAnimation}
          photoPositions={photoPositions}
          settings={settings}
        />
      )}
    </>
  );
};

// Enhanced Cube Environment
const CubeEnvironment: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const wallSize = Math.max((settings.floorSize || 200) * 3, 600);
  const wallHeight = Math.max(settings.wallHeight || 40, 300);
  const wallThickness = settings.wallThickness || 2;
  const wallColor = settings.wallColor || settings.floorColor || '#3A3A3A';

  const wallMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: wallColor,
      metalness: 0.1,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
  }, [wallColor]);

  return (
    <group>
      <mesh position={[0, wallHeight / 2 - 50, -wallSize / 2]} receiveShadow>
        <boxGeometry args={[wallSize, wallHeight, wallThickness]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[-wallSize / 2, wallHeight / 2 - 50, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, wallSize]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[wallSize / 2, wallHeight / 2 - 50, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, wallSize]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[0, wallHeight / 2 - 50, wallSize / 2]} receiveShadow>
        <boxGeometry args={[wallSize, wallHeight, wallThickness]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      {settings.ceilingEnabled && (
        <mesh position={[0, (settings.ceilingHeight || wallHeight) - 50, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[wallSize, wallSize]} />
          <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

const SphereEnvironment: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const sphereRadius = (settings.floorSize || 200) * 0.6;
  const wallColor = settings.wallColor || settings.floorColor || '#1A1A2E';

  const sphereMaterial = useMemo(() => {
    if (settings.sphereTextureUrl) {
      const texture = new THREE.TextureLoader().load(settings.sphereTextureUrl);
      return new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.BackSide,
        metalness: 0,
        roughness: 0.8,
      });
    }
    
    return new THREE.MeshStandardMaterial({
      color: wallColor,
      side: THREE.BackSide,
      metalness: 0.1,
      roughness: 0.9,
    });
  }, [wallColor, settings.sphereTextureUrl]);

  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[sphereRadius, 64, 32]} />
      <primitive object={sphereMaterial} attach="material" />
    </mesh>
  );
};

const GalleryEnvironment: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const roomWidth = Math.max(settings.floorSize || 200, 400) * 2;
  const roomHeight = Math.max(settings.wallHeight || 50, 200);
  const roomDepth = settings.roomDepth || roomWidth;
  const wallColor = settings.wallColor || '#F5F5F5';

  const wallMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: wallColor,
      metalness: 0.0,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
  }, [wallColor]);

  return (
    <group>
      <mesh position={[0, roomHeight / 2 - 50, -roomDepth / 2]} receiveShadow>
        <planeGeometry args={[roomWidth, roomHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[-roomWidth / 2, roomHeight / 2 - 50, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[roomDepth, roomHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[roomWidth / 2, roomHeight / 2 - 50, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[roomDepth, roomHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[0, roomHeight / 2 - 50, roomDepth / 2]} receiveShadow>
        <planeGeometry args={[roomWidth, roomHeight]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[0, roomHeight - 50, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roomWidth, roomDepth]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i}>
          <mesh position={[(i - 3.5) * (roomWidth / 8), roomHeight - 55, 0]}>
            <cylinderGeometry args={[1, 1.5, 3, 8]} />
            <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
          </mesh>
          <spotLight
            position={[(i - 3.5) * (roomWidth / 8), roomHeight - 55, 0]}
            target-position={[(i - 3.5) * (roomWidth / 8), -10, 0]}
            angle={Math.PI / 6}
            penumbra={0.3}
            intensity={2}
            color="#FFFFFF"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
        </group>
      ))}
    </group>
  );
};

const StudioEnvironment: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const studioSize = Math.max(settings.floorSize || 200, 300) * 2;
  const backdropColor = settings.wallColor || '#E8E8E8';

  const backdropMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: backdropColor,
      metalness: 0.0,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
  }, [backdropColor]);

  const backdropGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(
      studioSize,
      studioSize,
      studioSize * 1.2,
      32,
      1,
      true,
      0,
      Math.PI
    );
    return geometry;
  }, [studioSize]);

  const lightPositions = useMemo(() => [
    [studioSize * 0.3, studioSize * 0.4, studioSize * 0.5],
    [-studioSize * 0.3, studioSize * 0.4, studioSize * 0.5],
    [0, studioSize * 0.6, -studioSize * 0.3],
    [studioSize * 0.2, studioSize * 0.8, 0],
    [-studioSize * 0.2, studioSize * 0.8, 0],
    [0, studioSize * 0.2, -studioSize * 0.8]
  ], [studioSize]);

  return (
    <group>
      <mesh 
        geometry={backdropGeometry} 
        material={backdropMaterial}
        position={[0, studioSize * 0.2 - 50, -studioSize * 0.6]}
        rotation={[0, 0, 0]}
      />
      <mesh position={[0, -50, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[studioSize * 2, studioSize * 2]} />
        <primitive object={backdropMaterial} attach="material" />
      </mesh>
      <group position={[0, studioSize / 2, 0]}>
        {lightPositions.map((pos, i) => (
          <group key={i}>
            <mesh position={pos as [number, number, number]}>
              <cylinderGeometry args={[1, 2, 4, 8]} />
              <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.1} />
            </mesh>
            <spotLight
              position={pos as [number, number, number]}
              target-position={[0, -25, 0]}
              angle={i < 2 ? Math.PI / 4 : Math.PI / 6}
              penumbra={0.5}
              intensity={i === 0 ? 3 : i === 1 ? 2 : 1.5}
              color="#FFFFFF"
              castShadow={i < 3}
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
          </group>
        ))}
      </group>
    </group>
  );
};

const SceneEnvironmentManager: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const environment = settings.sceneEnvironment || 'default';

  switch (environment) {
    case 'cube':
      return <CubeEnvironment settings={settings} />;
    case 'sphere':
      return <SphereEnvironment settings={settings} />;
    case 'gallery':
      return <GalleryEnvironment settings={settings} />;
    case 'studio':
      return <StudioEnvironment settings={settings} />;
    case 'default':
    default:
      return null;
  }
};

class ResourceManager {
  private static instance: ResourceManager;
  private texturePool = new Map<string, THREE.Texture>();
  private materialPool = new Map<string, THREE.Material>();
  private geometryPool = new Map<string, THREE.BufferGeometry>();
  private maxCacheSize = 200;

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  getTexture(url: string, loader: () => Promise<THREE.Texture>): Promise<THREE.Texture> {
    if (this.texturePool.has(url)) {
      return Promise.resolve(this.texturePool.get(url)!.clone());
    }

    return loader().then(texture => {
      if (this.texturePool.size >= this.maxCacheSize) {
        const firstKey = this.texturePool.keys().next().value;
        const oldTexture = this.texturePool.get(firstKey);
        oldTexture?.dispose();
        this.texturePool.delete(firstKey);
      }

      this.texturePool.set(url, texture);
      return texture.clone();
    });
  }

  getGeometry(key: string, creator: () => THREE.BufferGeometry): THREE.BufferGeometry {
    if (!this.geometryPool.has(key)) {
      this.geometryPool.set(key, creator());
    }
    return this.geometryPool.get(key)!;
  }

  dispose(): void {
    this.texturePool.forEach(texture => texture.dispose());
    this.materialPool.forEach(material => material.dispose());
    this.geometryPool.forEach(geometry => geometry.dispose());
    this.texturePool.clear();
    this.materialPool.clear();
    this.geometryPool.clear();
  }
}

class FloorTextureFactory {
  static createTexture(type: FloorTexture, size: number = 512, customUrl?: string): THREE.Texture {
    if (type === 'custom' && customUrl) {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(customUrl);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(8, 8);
      return texture;
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    switch (type) {
      case 'marble':
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#f8f8ff');
        gradient.addColorStop(0.3, '#e6e6fa');
        gradient.addColorStop(0.6, '#dda0dd');
        gradient.addColorStop(1, '#d8bfd8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
          ctx.beginPath();
          ctx.moveTo(Math.random() * size, Math.random() * size);
          ctx.bezierCurveTo(
            Math.random() * size, Math.random() * size,
            Math.random() * size, Math.random() * size,
            Math.random() * size, Math.random() * size
          );
          ctx.stroke();
        }
        break;

      case 'wood':
        const woodGradient = ctx.createLinearGradient(0, 0, 0, size);
        woodGradient.addColorStop(0, '#8B4513');
        woodGradient.addColorStop(0.3, '#A0522D');
        woodGradient.addColorStop(0.7, '#CD853F');
        woodGradient.addColorStop(1, '#DEB887');
        ctx.fillStyle = woodGradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let y = 0; y < size; y += 8) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(size, y + Math.sin(y * 0.1) * 4);
          ctx.stroke();
        }
        break;

      case 'concrete':
        ctx.fillStyle = '#696969';
        ctx.fillRect(0, 0, size, size);
        
        for (let i = 0; i < 1000; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? '#808080' : '#556B2F';
          ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
        }
        break;

      case 'metal':
        const metalGradient = ctx.createLinearGradient(0, 0, size, 0);
        metalGradient.addColorStop(0, '#C0C0C0');
        metalGradient.addColorStop(0.5, '#A9A9A9');
        metalGradient.addColorStop(1, '#808080');
        ctx.fillStyle = metalGradient;
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = '#B8B8B8';
        ctx.lineWidth = 1;
        for (let x = 0; x < size; x += 4) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, size);
          ctx.stroke();
        }
        break;

      case 'glass':
        ctx.fillStyle = '#E0F6FF';
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = '#FFFFFF80';
        ctx.lineWidth = 3;
        for (let i = 0; i < 10; i++) {
          const x = (i * size) / 10;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + 50, size);
          ctx.stroke();
        }
        break;

      case 'checkerboard':
        const tileSize = size / 16;
        for (let x = 0; x < 16; x++) {
          for (let y = 0; y < 16; y++) {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#FFFFFF' : '#000000';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          }
        }
        break;

      default:
        ctx.fillStyle = '#2C2C2C';
        ctx.fillRect(0, 0, size, size);
        break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    
    return texture;
  }
}

class EnhancedSlotManager {
  private slotAssignments = new Map<string, number>();
  private occupiedSlots = new Set<number>();
  private availableSlots: number[] = [];
  private totalSlots = 0;
  private photoAspectRatios = new Map<string, number>();

  constructor(totalSlots: number) {
    this.updateSlotCount(totalSlots);
  }

  updateSlotCount(newTotal: number) {
    if (newTotal === this.totalSlots) return;
    this.totalSlots = newTotal;
    
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (slotIndex >= newTotal) {
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
    
    safePhotos.forEach(photo => {
      if (!this.photoAspectRatios.has(photo.id)) {
        if (photo.width && photo.height) {
          this.photoAspectRatios.set(photo.id, photo.width / photo.height);
        }
      }
    });
    
    const currentPhotoIds = new Set(safePhotos.map(p => p.id));
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (!currentPhotoIds.has(photoId)) {
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
        this.photoAspectRatios.delete(photoId);
      }
    }

    this.rebuildAvailableSlots();

    const sortedPhotos = [...safePhotos].sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return a.id.localeCompare(b.id);
    });

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

// FIXED WAVE PATTERN - Better spacing and height
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
    
    const totalPhotos = Math.min(photoCount, 500);
    
    // Calculate grid dimensions
    const columns = Math.ceil(Math.sqrt(totalPhotos));
    const rows = Math.ceil(totalPhotos / columns);
    
    const speed = this.settings.animationSpeed / 50;
    const wavePhase = time * speed * 2;
    
    // FIXED: Much lower base height - closer to floor
    const floorHeight = -12;
    const baseHeight = floorHeight + photoSize + 2; // Just above floor level
    
    for (let i = 0; i < totalPhotos; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      // FIXED: Base positions with much better spacing
      let x = (col - columns / 2) * finalSpacing;
      let z = (row - rows / 2) * finalSpacing;
      
      // Wave effect - much more reasonable amplitude
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const amplitude = Math.min(this.settings.patterns?.wave?.amplitude || 8, photoSize * 2); // Reasonable amplitude
      const frequency = this.settings.patterns?.wave?.frequency || 0.3;
      
      let y = baseHeight; // Start from reasonable height
      
      if (this.settings.animationEnabled) {
        y += Math.sin(distanceFromCenter * frequency - wavePhase) * amplitude;
        y += Math.sin(wavePhase * 0.5) * (distanceFromCenter * 0.02); // Reduced secondary wave
      }
      
      positions.push([x, y, z]);

      if (this.settings.photoRotation) {
        const angle = Math.atan2(x, z);
        const rotationX = Math.sin(wavePhase * 0.5 + distanceFromCenter * 0.1) * 0.1;
        const rotationY = angle;
        const rotationZ = Math.cos(wavePhase * 0.5 + distanceFromCenter * 0.1) * 0.1;
        rotations.push([rotationX, rotationY, rotationZ]);
      } else {
        rotations.push([0, 0, 0]);
      }
    }

    return { positions, rotations };
  }
}

// FIXED SPIRAL PATTERN - Much better spacing and reasonable height
class FixedSpiralPattern {
  constructor(private settings: any) {}

  generatePositions(time: number) {
    const positions: any[] = [];
    const rotations: [number, number, number][] = [];

    const photoCount = this.settings.patterns?.spiral?.photoCount !== undefined 
      ? this.settings.patterns.spiral.photoCount 
      : this.settings.photoCount;
    
    const totalPhotos = Math.min(photoCount, 500);
    const speed = this.settings.animationSpeed / 50;
    const animationTime = time * speed * 2;
    
    // FIXED: Much better spiral parameters
    const photoSize = this.settings.photoSize || 4;
    const baseRadius = Math.max(8, photoSize * 1.5); // Reasonable minimum radius
    const maxRadius = Math.max(40, photoSize * 8); // Much wider spread
    const maxHeight = Math.max(30, photoSize * 6); // Reasonable max height
    const rotationSpeed = 0.4; // Slower rotation
    const orbitalChance = 0.1; // Fewer orbital photos for cleaner look
    
    // FIXED: Much lower base height - closer to floor
    const floorHeight = -12;
    const baseHeight = floorHeight + photoSize + 1; // Just above floor
    
    // FIXED: Better vertical distribution
    const verticalBias = 0.5; // Less bias toward bottom
    const minVerticalSpacing = Math.max(photoSize * 1.2, 6); // Reasonable layer spacing
    
    for (let i = 0; i < totalPhotos; i++) {
      // Consistent random values for each photo
      const randomSeed1 = Math.sin(i * 0.73) * 0.5 + 0.5;
      const randomSeed2 = Math.cos(i * 1.37) * 0.5 + 0.5;
      const randomSeed3 = Math.sin(i * 2.11) * 0.5 + 0.5;
      
      const isOrbital = randomSeed1 < orbitalChance;
      
      // FIXED: Better height distribution starting from reasonable base
      let normalizedHeight = Math.pow(randomSeed2, verticalBias);
      const layerIndex = Math.floor(normalizedHeight * 8); // Fewer layers for better spacing
      const y = baseHeight + (layerIndex * minVerticalSpacing) + 
                (randomSeed3 * minVerticalSpacing * 0.3); // Small random offset
      
      // FIXED: Better radius calculation with wider spread
      const heightFactor = normalizedHeight;
      const funnelRadius = baseRadius + (maxRadius - baseRadius) * heightFactor;
      
      let radius: number;
      let angleOffset: number;
      let verticalWobble: number = 0;
      
      if (isOrbital) {
        // FIXED: Orbital photos with better spacing
        radius = funnelRadius * (1.4 + randomSeed3 * 0.3); // Reasonable orbital distance
        angleOffset = randomSeed3 * Math.PI * 2;
        
        if (this.settings.animationEnabled) {
          verticalWobble = Math.sin(animationTime * 1.2 + i) * 1.5; // Gentle wobble
        }
      } else {
        // FIXED: Main spiral with good spacing
        const radiusVariation = 0.95 + randomSeed3 * 0.1; // Very tight variation for consistency
        radius = funnelRadius * radiusVariation;
        angleOffset = (i * 0.15) % (Math.PI * 2); // Better angular distribution
      }
      
      // FIXED: Smoother angle calculation
      const heightSpeedFactor = 0.3 + normalizedHeight * 0.4; // Gentler speed variation
      const angle = this.settings.animationEnabled ?
        (animationTime * rotationSpeed * heightSpeedFactor + angleOffset + (i * 0.08)) :
        (angleOffset + (i * 0.12));
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const finalY = y + verticalWobble;
      
      positions.push([x, finalY, z]);
      
      if (this.settings.photoRotation) {
        const rotY = angle + Math.PI / 2; // Face outward from spiral
        const rotX = Math.sin(animationTime * 0.4 + i * 0.1) * 0.03; // Gentle tilt
        const rotZ = Math.cos(animationTime * 0.4 + i * 0.1) * 0.03;
        rotations.push([rotX, rotY, rotZ]);
      } else {
        rotations.push([0, 0, 0]);
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
  const shouldFaceCamera = settings.animationPattern === 'float';
  
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

// Update the Enhanced Animation Controller to use fixed patterns
const EnhancedAnimationController: React.FC<{
  settings: ExtendedSceneSettings;
  photos: Photo[];
  onPositionsUpdate: (photos: PhotoWithPosition[]) => void;
}> = ({ settings, photos, onPositionsUpdate }) => {
  const slotManagerRef = useRef(new EnhancedSlotManager(settings.photoCount || 100));
  const lastPhotoCount = useRef(settings.photoCount || 100);
  
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
              photoCount: settings.photoCount || 100
            },
            safePhotos
          );
          patternState = pattern.generatePositions(time);
        }
        
        const expectedSlots = settings.photoCount || 100;
        
        // Apply floor level adjustments for spiral and wave - FIXED: Much lower heights
        if (settings.animationPattern === 'spiral' || settings.animationPattern === 'wave') {
          const floorLevel = -12;
          const photoSize = settings.photoSize || 4.0;
          const minPhotoHeight = floorLevel + photoSize; // Just above floor
          
          patternState.positions = patternState.positions.map((pos, index) => {
            const [x, y, z] = pos;
            
            // FIXED: Keep photos much closer to floor - only ensure they don't clip through
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
        const totalSlots = settings.photoCount || 100;
        
        for (let i = 0; i < totalSlots; i++) {
          const x = (i % 10) * spacing - (spacing * 5);
          const z = Math.floor(i / 10) * spacing - (spacing * 5);
          positions.push([x, -6, z]);
          rotations.push([0, 0, 0]);
        }
        patternState = { positions, rotations };
      }
      
      const photosWithPositions: PhotoWithPosition[] = [];
      const totalSlots = settings.photoCount || 100;
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
    if ((settings.photoCount || 100) !== lastPhotoCount.current) {
      slotManagerRef.current.updateSlotCount(settings.photoCount || 100);
      lastPhotoCount.current = settings.photoCount || 100;
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

const TexturedFloor: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  if (!settings.floorEnabled) return null;

  const floorTexture = useMemo(() => {
    return FloorTextureFactory.createTexture(
      settings.floorTexture || 'solid',
      1024,
      settings.customFloorTextureUrl
    );
  }, [settings.floorTexture, settings.customFloorTextureUrl]);

  const floorMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      map: floorTexture,
      color: settings.floorColor || '#FFFFFF',
      transparent: (settings.floorOpacity || 1) < 1,
      opacity: settings.floorOpacity || 1,
      metalness: Math.min(settings.floorMetalness || 0.5, 0.9),
      roughness: Math.max(settings.floorRoughness || 0.5, 0.1),
      side: THREE.DoubleSide,
      envMapIntensity: 0.5,
    });

    switch (settings.floorTexture) {
      case 'marble':
        material.metalness = 0.1;
        material.roughness = 0.2;
        break;
      case 'metal':
        material.metalness = 0.9;
        material.roughness = 0.1;
        break;
      case 'glass':
        material.metalness = 0;
        material.roughness = 0.05;
        material.transparent = true;
        material.opacity = 0.8;
        break;
      case 'wood':
        material.metalness = 0;
        material.roughness = 0.8;
        break;
    }

    return material;
  }, [settings.floorColor, settings.floorOpacity, settings.floorMetalness, settings.floorRoughness, settings.floorTexture, floorTexture]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -12, 0]}
      receiveShadow
    >
      <planeGeometry args={[settings.floorSize || 300, settings.floorSize || 300, 64, 64]} />
      <primitive object={floorMaterial} attach="material" />
    </mesh>
  );
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
        
        {/* Scene Environment Manager */}
        <SceneEnvironmentManager settings={safeSettings} />
        
        {/* Enhanced Lighting */}
        <EnhancedLightingSystem settings={safeSettings} />
        
        {/* Textured Floor - Always show unless sphere environment */}
        {safeSettings.sceneEnvironment !== 'sphere' && (
          <TexturedFloor settings={safeSettings} />
        )}
        
        {/* Grid - Only show for default environment */}
        {(!safeSettings.sceneEnvironment || safeSettings.sceneEnvironment === 'default') && 
         safeSettings.gridEnabled && (
          <gridHelper
            args={[
              safeSettings.gridSize || 200,
              safeSettings.gridDivisions || 30,
              safeSettings.gridColor || '#444444',
              safeSettings.gridColor || '#444444'
            ]}
            position={[0, -11.99, 0]}
            material-opacity={safeSettings.gridOpacity || 1.0}
            material-transparent={true}
          />
        )}
        
        {/* FIXED Enhanced Animation Controller */}
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
      </Canvas>
    </div>
  );
});

EnhancedCollageScene.displayName = 'EnhancedCollageScene';
export default EnhancedCollageScene;