// Enhanced CollageScene with WORKING Camera Systems
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

// ULTRA-SIMPLE CINEMATIC CAMERA - Direct position updates, no interpolation
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
}> = ({ config, photoPositions }) => {
  const { camera } = useThree();
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!config?.enabled || config.type === 'none' || !photoPositions.length) {
      return;
    }

    const validPhotos = photoPositions.filter(p => !p.id.startsWith('placeholder-'));
    if (!validPhotos.length) return;

    // Simple time-based movement
    const speed = (config.speed || 1.0) * 0.5;
    timeRef.current += delta * speed;

    const height = -4;
    const distance = 15;

    let x, y, z, lookX, lookY, lookZ;

    switch (config.type) {
      case 'showcase':
      case 'gallery_walk':
        // Simple circular path around all photos
        const centerX = validPhotos.reduce((sum, p) => sum + p.position[0], 0) / validPhotos.length;
        const centerZ = validPhotos.reduce((sum, p) => sum + p.position[2], 0) / validPhotos.length;
        
        x = centerX + Math.cos(timeRef.current) * distance;
        y = height;
        z = centerZ + Math.sin(timeRef.current) * distance;
        
        lookX = centerX;
        lookY = height;
        lookZ = centerZ;
        break;

      case 'spiral_tour':
        // Simple expanding spiral
        const spiralRadius = 10 + Math.sin(timeRef.current * 0.1) * 15;
        x = Math.cos(timeRef.current) * spiralRadius;
        y = height + Math.sin(timeRef.current * 0.2) * 3;
        z = Math.sin(timeRef.current) * spiralRadius;
        
        lookX = 0;
        lookY = height;
        lookZ = 0;
        break;

      case 'photo_focus':
        // Focus on one photo at a time
        const photoIndex = Math.floor(timeRef.current * 0.1) % validPhotos.length;
        const currentPhoto = validPhotos[photoIndex];
        const orbitAngle = timeRef.current * 2;
        
        x = currentPhoto.position[0] + Math.cos(orbitAngle) * 8;
        y = currentPhoto.position[1] + 2;
        z = currentPhoto.position[2] + Math.sin(orbitAngle) * 8;
        
        lookX = currentPhoto.position[0];
        lookY = currentPhoto.position[1];
        lookZ = currentPhoto.position[2];
        break;

      default:
        // Simple orbit
        x = Math.cos(timeRef.current) * 20;
        y = height;
        z = Math.sin(timeRef.current) * 20;
        
        lookX = 0;
        lookY = height;
        lookZ = 0;
    }

    // Direct camera updates - NO LERPING OR INTERPOLATION
    camera.position.x = x;
    camera.position.y = y;
    camera.position.z = z;
    
    camera.lookAt(lookX, lookY, lookZ);

    // Debug every 2 seconds
    if (Math.floor(timeRef.current) % 2 === 0 && Math.floor(timeRef.current * 10) % 10 === 0) {
      console.log(`🎬 ${config.type}: pos(${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}) time:${timeRef.current.toFixed(1)}`);
    }
  });

  return null;
};

// SIMPLE CAMERA CONTROLS - Clean and working
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
      {/* ONLY render OrbitControls when cinematic is completely OFF */}
      {!isCinematicActive && (
        <>
          <OrbitControls
            ref={controlsRef}
            enabled={settings.cameraEnabled !== false}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={10}
            maxDistance={200}
            enableDamping={true}
            dampingFactor={0.05}
          />
          
          {/* Auto-Rotate only when manual controls are available */}
          <AutoRotateCamera settings={settings} />
        </>
      )}
      
      {/* Cinematic Camera - NO other components in scene */}
      {isCinematicActive && (
        <CinematicCamera 
          config={settings.cameraAnimation}
          photoPositions={photoPositions}
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
        const pattern = PatternFactory.createPattern(
          settings.animationPattern || 'grid',
          {
            ...settings,
            photoCount: settings.photoCount || 100
          },
          safePhotos
        );
        patternState = pattern.generatePositions(time);
        
        const expectedSlots = settings.photoCount || 100;
        
        if (settings.animationPattern === 'spiral' || settings.animationPattern === 'wave') {
          const floorLevel = -8;
          const photoSize = settings.photoSize || 4.0;
          
          patternState.positions = patternState.positions.map((pos, index) => {
            const [x, y, z] = pos;
            let adjustedY = y;
            
            if (settings.animationPattern === 'spiral') {
              const heightScale = Math.max(0.3, Math.min(1.0, photoSize / 8.0));
              const baseHeight = floorLevel + (photoSize * 0.5);
              
              adjustedY = baseHeight + (y * heightScale);
              
              if (photoSize > 6) {
                adjustedY = baseHeight + (y * 0.4) + (index * photoSize * 0.1);
              }
              
            } else if (settings.animationPattern === 'wave') {
              const waveHeight = Math.max(2, photoSize * 0.3);
              adjustedY = floorLevel + waveHeight + (y * 0.2);
            }
            
            return [x, adjustedY, z];
          });
        }
        
      } catch (error) {
        console.error('Pattern generation error:', error);
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
        console.log(`Pattern only supports ${availablePositions} positions, limiting display to match pattern`);
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
        
        {/* SIMPLE Camera Controls - Actually Working */}
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
        
        {/* Enhanced Animation Controller */}
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

// Helper function to get current particle theme
const getCurrentParticleTheme = (settings: ExtendedSceneSettings) => {
  const themeName = settings.particles?.theme ?? 'Purple Magic';
  return PARTICLE_THEMES.find(theme => theme.name === themeName) || PARTICLE_THEMES[0];
};

EnhancedCollageScene.displayName = 'EnhancedCollageScene';
export default EnhancedCollageScene;