// Enhanced CollageScene with Advanced Performance, Quality, and Visual Features
import React, { useRef, useMemo, useEffect, useState, useCallback, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { type SceneSettings } from '../../store/sceneStore';
import { PatternFactory } from './patterns/PatternFactory';
import { addCacheBustToUrl } from '../../lib/supabase';
import { CameraAnimationController } from './CameraAnimationController';
import MilkyWayParticleSystem, { PARTICLE_THEMES } from './MilkyWayParticleSystem';

type Photo = {
  id: string;
  url: string;
  collage_id?: string;
  created_at?: string;
  aspect_ratio?: number; // New: Track original aspect ratio
  width?: number;
  height?: number;
};

type CollageSceneProps = {
  photos: Photo[];
  settings: SceneSettings;
  width?: number;
  height?: number;
  onSettingsChange?: (settings: Partial<SceneSettings>, debounce?: boolean) => void;
};

type PhotoWithPosition = Photo & {
  targetPosition: [number, number, number];
  targetRotation: [number, number, number];
  displayIndex?: number;
  slotIndex: number;
  computedSize: [number, number]; // New: Computed dimensions based on aspect ratio
};

// Enhanced animation constants
const POSITION_SMOOTHING = 0.08;
const ROTATION_SMOOTHING = 0.08;
const TELEPORT_THRESHOLD = 35;

// Advanced Resource Manager for Memory Optimization
class ResourceManager {
  private static instance: ResourceManager;
  private texturePool = new Map<string, THREE.Texture>();
  private materialPool = new Map<string, THREE.Material>();
  private geometryPool = new Map<string, THREE.BufferGeometry>();
  private maxCacheSize = 200; // Prevent memory leaks

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
      // Manage cache size
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

// Enhanced Slot Manager with Aspect Ratio Support
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

  // Enhanced slot assignment with aspect ratio tracking
  assignSlots(photos: Photo[]): Map<string, number> {
    const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
    
    // Update aspect ratios - only for photos that don't already have stored ratios
    safePhotos.forEach(photo => {
      if (!this.photoAspectRatios.has(photo.id)) {
        if (photo.width && photo.height) {
          this.photoAspectRatios.set(photo.id, photo.width / photo.height);
        }
        // Don't set a default - let the component detect it from the actual image
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
    return this.photoAspectRatios.get(photoId) || null; // Return null if not detected
  }
}

// Ultra-High Quality Texture Loader with Transparency Support
const createUltraHighQualityTexture = async (
  imageUrl: string, 
  gl: THREE.WebGLRenderer
): Promise<THREE.Texture> => {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    
    loader.load(
      imageUrl,
      (texture) => {
        // Ultra-high quality settings
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat; // Support transparency
        texture.generateMipmaps = true;
        
        // Maximum anisotropic filtering for crystal clear distant images
        if (gl?.capabilities?.getMaxAnisotropy) {
          texture.anisotropy = gl.capabilities.getMaxAnisotropy();
        }
        
        // Enhanced color management with transparency support
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = true; // FIXED: Restore flipY to prevent upside down images
        texture.premultipliedAlpha = false; // Better transparency handling
        
        resolve(texture);
      },
      undefined,
      reject
    );
  });
};

// Simplified High-Performance Photo Component (Based on Original)
const OptimizedPhotoMesh: React.FC<{
  photo: PhotoWithPosition;
  settings: SceneSettings;
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

  // Initialize position immediately to prevent jarring movements
  useEffect(() => {
    currentPosition.current.set(...photo.targetPosition);
    currentRotation.current.set(...photo.targetRotation);
  }, [photo.targetPosition, photo.targetRotation]);

  // Simple, fast texture loading
  useEffect(() => {
    if (!photo.url) {
      setIsLoading(false);
      return;
    }

    const loader = new THREE.TextureLoader();
    setIsLoading(true);
    setHasError(false);
    
    // Create image for aspect ratio detection
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const actualAspectRatio = img.naturalWidth / img.naturalHeight;
      setDetectedAspectRatio(actualAspectRatio);
      
      const imageUrl = photo.url.includes('?') 
        ? `${photo.url}&t=${Date.now()}`
        : `${photo.url}?t=${Date.now()}`;

      loader.load(imageUrl, (loadedTexture) => {
        // High quality settings but simple and fast
        loadedTexture.generateMipmaps = true;
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        loadedTexture.format = THREE.RGBAFormat;
        
        // Apply anisotropic filtering for distance quality
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

  // Calculate dimensions based on detected aspect ratio
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

  // Camera facing logic (from original)
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

  // Smooth animation (from original)
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

  // Simple, fast material
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
      // Simple empty slot
      const canvas = document.createElement('canvas');
      canvas.width = 256; // Very small for performance
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

// Simple Photo Renderer for Performance
const SimplePhotoRenderer: React.FC<{ 
  photosWithPositions: PhotoWithPosition[]; 
  settings: SceneSettings;
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

// Enhanced Lighting (Simplified for Performance)
const EnhancedLightingSystem: React.FC<{ settings: SceneSettings }> = ({ settings }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetRefs = useRef<THREE.Object3D[]>([]);

  const spotlights = useMemo(() => {
    const lights = [];
    const count = Math.min(settings.spotlightCount || 4, 4);
    
    // Ensure we have enough target refs
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

// Enhanced Camera Controls with Touch Support
const EnhancedCameraControls: React.FC<{ settings: SceneSettings }> = ({ settings }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();
  const userInteractingRef = useRef(false);
  const lastInteractionTimeRef = useRef(0);
  
  // Initialize camera position
  useEffect(() => {
    if (camera && controlsRef.current) {
      const initialDistance = settings.cameraDistance || 25;
      const initialHeight = settings.cameraHeight || 5;
      const initialPosition = new THREE.Vector3(
        initialDistance,
        initialHeight,
        initialDistance
      );
      camera.position.copy(initialPosition);
      
      const target = new THREE.Vector3(0, initialHeight * 0.3, 0);
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, [camera, settings.cameraDistance, settings.cameraHeight]);

  // Handle user interaction detection
  useEffect(() => {
    if (!controlsRef.current) return;

    const handleStart = () => {
      userInteractingRef.current = true;
      lastInteractionTimeRef.current = Date.now();
    };

    const handleEnd = () => {
      lastInteractionTimeRef.current = Date.now();
      setTimeout(() => {
        userInteractingRef.current = false;
      }, 500);
    };

    const controls = controlsRef.current;
    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
    };
  }, []);

  // Auto rotation when enabled
  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    // Only auto-rotate if camera rotation is enabled AND user isn't interacting
    if (settings.cameraRotationEnabled && !userInteractingRef.current) {
      const offset = new THREE.Vector3().copy(camera.position).sub(controlsRef.current.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      
      spherical.theta += (settings.cameraRotationSpeed || 0.5) * delta;
      
      const newPosition = new THREE.Vector3().setFromSpherical(spherical).add(controlsRef.current.target);
      camera.position.copy(newPosition);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={settings.cameraEnabled !== false}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={8}
      maxDistance={300}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI - Math.PI / 6}
      enableDamping={true}
      dampingFactor={0.03}
      zoomSpeed={1.5}
      rotateSpeed={1.2}
      panSpeed={1.2}
      // Enhanced touch controls
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      }}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
    />
  );
};

// Enhanced Animation Controller
const EnhancedAnimationController: React.FC<{
  settings: SceneSettings;
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
          settings,
          safePhotos
        );
        patternState = pattern.generatePositions(time);
      } catch (error) {
        console.error('Pattern generation error:', error);
        const positions = [];
        const rotations = [];
        for (let i = 0; i < (settings.photoCount || 100); i++) {
          const x = (i % 10) * 6 - 30;
          const z = Math.floor(i / 10) * 6 - 30;
          positions.push([x, 0, z]);
          rotations.push([0, 0, 0]);
        }
        patternState = { positions, rotations };
      }
      
      const photosWithPositions: PhotoWithPosition[] = [];
      
      for (const photo of safePhotos) {
        const slotIndex = slotAssignments.get(photo.id);
        if (slotIndex !== undefined && slotIndex < (settings.photoCount || 100)) {
          const aspectRatio = slotManagerRef.current.getAspectRatio(photo.id);
          const baseSize = settings.photoSize || 4.0;
          
          // Only set computedSize if we have aspect ratio data, otherwise let component detect it
          const computedSize = aspectRatio ? (
            aspectRatio > 1 
              ? [baseSize * aspectRatio, baseSize]
              : [baseSize, baseSize / aspectRatio]
          ) : undefined;
          
          photosWithPositions.push({
            ...photo,
            targetPosition: patternState.positions[slotIndex] || [0, 0, 0],
            targetRotation: patternState.rotations?.[slotIndex] || [0, 0, 0],
            displayIndex: slotIndex,
            slotIndex,
            computedSize
          });
        }
      }
      
      // Add empty slots with 9:16 aspect ratio
      for (let i = 0; i < (settings.photoCount || 100); i++) {
        const hasPhoto = photosWithPositions.some(p => p.slotIndex === i);
        if (!hasPhoto) {
          const baseSize = settings.photoSize || 4.0;
          photosWithPositions.push({
            id: `placeholder-${i}`,
            url: '',
            targetPosition: patternState.positions[i] || [0, 0, 0],
            targetRotation: patternState.rotations?.[i] || [0, 0, 0],
            displayIndex: i,
            slotIndex: i,
            computedSize: [baseSize * (9/16), baseSize] // 9:16 empty slots (portrait)
          });
        }
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

// Enhanced Floor with Reflections
const ReflectiveFloor: React.FC<{ settings: SceneSettings }> = ({ settings }) => {
  if (!settings.floorEnabled) return null;

  const floorMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: settings.floorColor || '#1A1A1A',
      transparent: (settings.floorOpacity || 1) < 1,
      opacity: settings.floorOpacity || 1,
      metalness: Math.min(settings.floorMetalness || 0.7, 0.95),
      roughness: Math.max(settings.floorRoughness || 0.3, 0.05),
      side: THREE.DoubleSide,
      envMapIntensity: 1.5, // Enhanced reflections
    });
  }, [settings.floorColor, settings.floorOpacity, settings.floorMetalness, settings.floorRoughness]);

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

  // Background style with enhanced gradients
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

  // Cleanup resources on unmount
  useEffect(() => {
    return () => {
      ResourceManager.getInstance().dispose();
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
          far: 2000 // Increased far plane for distant quality
        }}
        gl={{ 
          antialias: true,
          alpha: safeSettings.backgroundGradient || false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2, // Enhanced exposure
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={(state) => {
          // Enhanced WebGL settings for quality
          state.gl.shadowMap.enabled = true;
          state.gl.shadowMap.type = THREE.PCFSoftShadowMap;
          state.gl.shadowMap.autoUpdate = true;
          
          // High pixel ratio for sharp rendering
          const pixelRatio = Math.min(window.devicePixelRatio, 2);
          state.gl.setPixelRatio(pixelRatio);
          
          // Enhanced texture settings
          state.gl.capabilities.getMaxAnisotropy();
          
          if (safeSettings.backgroundGradient) {
            state.gl.setClearColor('#000000', 0);
          }
        }}
        performance={{ min: 0.8 }} // Back to original performance settings
        linear={true}
      >
        {/* Background Management */}
        <color attach="background" args={[safeSettings.backgroundColor || '#000000']} />
        
        {/* Enhanced Controls */}
        <EnhancedCameraControls settings={safeSettings} />
        <CameraAnimationController config={safeSettings.cameraAnimation} />
        
        {/* Particle System */}
        {safeSettings.particles?.enabled && (
          <MilkyWayParticleSystem
            colorTheme={getCurrentParticleTheme(safeSettings)}
            intensity={safeSettings.particles?.intensity ?? 0.7}
            enabled={safeSettings.particles?.enabled ?? true}
            photoPositions={photosWithPositions.map(p => ({ position: p.targetPosition }))}
          />
        )}
        
        {/* Enhanced Lighting */}
        <EnhancedLightingSystem settings={safeSettings} />
        
        {/* Enhanced Floor and Grid */}
        <ReflectiveFloor settings={safeSettings} />
        
        {safeSettings.gridEnabled && (
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
const getCurrentParticleTheme = (settings: SceneSettings) => {
  const themeName = settings.particles?.theme ?? 'Purple Magic';
  return PARTICLE_THEMES.find(theme => theme.name === themeName) || PARTICLE_THEMES[0];
};

EnhancedCollageScene.displayName = 'EnhancedCollageScene';
export default EnhancedCollageScene;