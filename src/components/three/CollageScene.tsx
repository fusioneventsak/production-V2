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
    
    // Update aspect ratios
    safePhotos.forEach(photo => {
      if (photo.width && photo.height) {
        this.photoAspectRatios.set(photo.id, photo.width / photo.height);
      } else {
        // Default to 16:9 if no dimensions provided
        this.photoAspectRatios.set(photo.id, 16/9);
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

  getAspectRatio(photoId: string): number {
    return this.photoAspectRatios.get(photoId) || 16/9;
  }
}

// Ultra-High Quality Texture Loader
const createUltraHighQualityTexture = async (
  imageUrl: string, 
  gl: THREE.WebGLRenderer
): Promise<THREE.Texture> => {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    
    // Create image element for dimension detection
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      loader.load(
        imageUrl,
        (texture) => {
          // Ultra-high quality settings
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.format = THREE.RGBAFormat;
          texture.generateMipmaps = true;
          
          // Maximum anisotropic filtering for crystal clear distant images
          if (gl?.capabilities?.getMaxAnisotropy) {
            texture.anisotropy = gl.capabilities.getMaxAnisotropy();
          }
          
          // Enhanced color management
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.flipY = false;
          texture.premultipliedAlpha = false;
          
          // No compression - maintain original quality
          texture.userData = {
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            aspectRatio: img.naturalWidth / img.naturalHeight
          };
          
          resolve(texture);
        },
        undefined,
        reject
      );
    };
    
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// Advanced Physics-Based Photo Component
const PhysicsPhotoMesh: React.FC<{
  photo: PhotoWithPosition;
  settings: SceneSettings;
  shouldFaceCamera: boolean;
}> = React.memo(({ photo, settings, shouldFaceCamera }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraDistance, setCameraDistance] = useState(20);
  
  const currentPosition = useRef<THREE.Vector3>(new THREE.Vector3(...photo.targetPosition));
  const currentRotation = useRef<THREE.Euler>(new THREE.Euler(...photo.targetRotation));
  const resourceManager = useMemo(() => ResourceManager.getInstance(), []);
  
  // Calculate actual dimensions based on aspect ratio
  const computedDimensions = useMemo(() => {
    const baseSize = settings.photoSize || 4.0;
    const aspectRatio = photo.computedSize ? photo.computedSize[0] / photo.computedSize[1] : 16/9;
    
    if (aspectRatio > 1) {
      // Landscape: maintain width, adjust height
      return [baseSize * aspectRatio, baseSize];
    } else {
      // Portrait: maintain height, adjust width  
      return [baseSize, baseSize / aspectRatio];
    }
  }, [settings.photoSize, photo.computedSize]);

  // Ultra-high quality texture loading
  useEffect(() => {
    if (!photo.url) {
      setIsLoading(false);
      return;
    }

    const imageUrl = photo.url.includes('?') 
      ? `${photo.url}&no_compress=1&quality=100&t=${Date.now()}`
      : `${photo.url}?no_compress=1&quality=100&t=${Date.now()}`;

    resourceManager.getTexture(imageUrl, () => 
      createUltraHighQualityTexture(imageUrl, gl)
    ).then(loadedTexture => {
      setTexture(loadedTexture);
      setIsLoading(false);
    }).catch(error => {
      console.error('High quality texture loading failed:', error);
      setIsLoading(false);
    });
  }, [photo.url, gl, resourceManager]);

  // Distance-based quality optimization
  useFrame(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const distance = camera.position.distanceTo(mesh.position);
    setCameraDistance(distance);

    // Enhanced camera facing with smooth quaternion interpolation
    if (shouldFaceCamera) {
      const targetQuaternion = new THREE.Quaternion();
      const lookAtMatrix = new THREE.Matrix4().lookAt(
        mesh.position,
        camera.position,
        new THREE.Vector3(0, 1, 0)
      );
      targetQuaternion.setFromRotationMatrix(lookAtMatrix);
      mesh.quaternion.slerp(targetQuaternion, 0.05);
    }
  });

  // Smooth physics-based animation
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const targetPosition = new THREE.Vector3(...photo.targetPosition);
    const targetRotation = new THREE.Euler(...photo.targetRotation);
    const distance = currentPosition.current.distanceTo(targetPosition);

    // Enhanced easing with delta time compensation
    const easingFactor = 1 - Math.exp(-6 * delta);
    
    if (distance > TELEPORT_THRESHOLD) {
      currentPosition.current.copy(targetPosition);
      currentRotation.current.copy(targetRotation);
    } else {
      currentPosition.current.lerp(targetPosition, POSITION_SMOOTHING * easingFactor);
      
      if (!shouldFaceCamera) {
        currentRotation.current.x += (targetRotation.x - currentRotation.current.x) * ROTATION_SMOOTHING;
        currentRotation.current.y += (targetRotation.y - currentRotation.current.y) * ROTATION_SMOOTHING;
        currentRotation.current.z += (targetRotation.z - currentRotation.current.z) * ROTATION_SMOOTHING;
      }
    }

    meshRef.current.position.copy(currentPosition.current);
    if (!shouldFaceCamera) {
      meshRef.current.rotation.copy(currentRotation.current);
    }
  });

  // Ultra-high quality material
  const material = useMemo(() => {
    if (texture) {
      return new THREE.MeshStandardMaterial({
        map: texture,
        transparent: false,
        side: THREE.DoubleSide,
        metalness: 0,
        roughness: Math.max(0.05, 0.15 - (cameraDistance * 0.002)), // Sharper at distance
        toneMapped: false, // Preserve original colors
        color: new THREE.Color().setScalar(settings.photoBrightness || 1.0),
        envMapIntensity: 0.2,
      });
    } else {
      // Ultra-high quality empty slot
      const canvas = document.createElement('canvas');
      canvas.width = 2048; // 4K empty slots
      canvas.height = 2048;
      const ctx = canvas.getContext('2d')!;
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = settings.emptySlotColor || '#1A1A1A';
      ctx.fillRect(0, 0, 2048, 2048);
      
      // High-res grid pattern
      if (settings.animationPattern === 'grid') {
        ctx.strokeStyle = '#ffffff10';
        ctx.lineWidth = 4;
        for (let i = 0; i <= 2048; i += 128) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 2048);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(2048, i);
          ctx.stroke();
        }
      }
      
      const emptyTexture = new THREE.CanvasTexture(canvas);
      emptyTexture.minFilter = THREE.LinearMipmapLinearFilter;
      emptyTexture.magFilter = THREE.LinearFilter;
      emptyTexture.anisotropy = 16;
      
      return new THREE.MeshStandardMaterial({
        map: emptyTexture,
        transparent: false,
        side: THREE.DoubleSide,
        roughness: 0.1,
        metalness: 0,
      });
    }
  }, [texture, settings.emptySlotColor, settings.animationPattern, settings.photoBrightness, cameraDistance]);

  // High-subdivision geometry for smooth distant appearance
  const geometry = useMemo(() => {
    const [width, height] = computedDimensions;
    const key = `${width}-${height}`;
    
    return resourceManager.getGeometry(key, () => {
      const segments = Math.max(16, Math.floor(Math.max(width, height) * 4));
      return new THREE.PlaneGeometry(width, height, segments, segments);
    });
  }, [computedDimensions, resourceManager]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
      frustumCulled={false} // Never cull for consistent quality
    />
  );
});

// Instanced Photo Renderer for Performance
const InstancedPhotoRenderer: React.FC<{
  photosWithPositions: PhotoWithPosition[];
  settings: SceneSettings;
}> = ({ photosWithPositions, settings }) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const shouldFaceCamera = settings.animationPattern === 'float';
  
  // Group photos by size for instancing
  const photoGroups = useMemo(() => {
    const groups = new Map<string, PhotoWithPosition[]>();
    
    photosWithPositions.forEach(photo => {
      const [width, height] = photo.computedSize || [16/9 * 4, 4];
      const key = `${width.toFixed(2)}-${height.toFixed(2)}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(photo);
    });
    
    return groups;
  }, [photosWithPositions]);

  return (
    <group>
      {Array.from(photoGroups.entries()).map(([sizeKey, photos]) => (
        <group key={sizeKey}>
          {photos.map((photo) => (
            <PhysicsPhotoMesh
              key={`${photo.id}-${photo.slotIndex}`}
              photo={photo}
              settings={settings}
              shouldFaceCamera={shouldFaceCamera}
            />
          ))}
        </group>
      ))}
    </group>
  );
};

// Enhanced Lighting with Volumetric Effects
const VolumetricLightingSystem: React.FC<{ settings: SceneSettings }> = ({ settings }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const lights = useMemo(() => {
    const lightCount = Math.min(settings.spotlightCount || 4, 6);
    return Array.from({ length: lightCount }, (_, i) => {
      const angle = (i / lightCount) * Math.PI * 2;
      const radius = 25 + Math.sin(i * 2.1) * 8;
      const height = 20 + Math.cos(i * 1.9) * 10;
      
      return {
        position: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        ] as [number, number, number],
        color: settings.spotlightColor || '#ffffff',
        intensity: (settings.spotlightIntensity || 100) / 100 * (0.8 + Math.sin(i * 2.7) * 0.2),
      };
    });
  }, [settings.spotlightCount, settings.spotlightColor, settings.spotlightIntensity]);

  return (
    <group ref={groupRef}>
      <ambientLight intensity={(settings.ambientLightIntensity || 0.4) * 0.3} />
      
      {/* Enhanced directional light with soft shadows */}
      <directionalLight
        position={[30, 40, 30]}
        intensity={0.15}
        castShadow={settings.shadowsEnabled}
        shadow-mapSize={[4096, 4096]} // Higher resolution shadows
        shadow-camera-far={300}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />
      
      {/* Volumetric spotlights */}
      {lights.map((light, index) => (
        <spotLight
          key={index}
          position={light.position}
          intensity={light.intensity * 12}
          angle={Math.PI / 4}
          penumbra={0.5}
          color={light.color}
          distance={100}
          decay={1.5}
          castShadow={settings.shadowsEnabled}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={1}
          shadow-camera-far={80}
        />
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
          
          photosWithPositions.push({
            ...photo,
            targetPosition: patternState.positions[slotIndex] || [0, 0, 0],
            targetRotation: patternState.rotations?.[slotIndex] || [0, 0, 0],
            displayIndex: slotIndex,
            slotIndex,
            computedSize: aspectRatio > 1 
              ? [baseSize * aspectRatio, baseSize]
              : [baseSize, baseSize / aspectRatio]
          });
        }
      }
      
      // Add empty slots
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
            computedSize: [baseSize * (16/9), baseSize]
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
        performance={{ min: 0.7 }} // Slightly lower for quality priority
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
        <VolumetricLightingSystem settings={safeSettings} />
        
        {/* Enhanced Floor and Grid */}
        <ReflectiveFloor settings={safeSettings} />
        
        {safeSettings.gridEnabled && (
          <gridHelper
            args={[
              safeSettings.gridSize || 300,
              safeSettings.gridDivisions || 40,
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
        
        {/* Ultra-High Quality Photo Renderer */}
        <InstancedPhotoRenderer 
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