// src/store/sceneStore.ts - FIXED with Cinematic Camera Support
import { create } from 'zustand';

export type SceneSettings = {
  animationPattern: 'float' | 'wave' | 'spiral' | 'grid';
  gridAspectRatioPreset: '1:1' | '4:3' | '16:9' | '21:9' | 'custom';
  particles: {
    enabled: boolean;
    theme: string;
    intensity: number;
  };
  patterns: {
    grid: {
      enabled: boolean;
      spacing: number;
      aspectRatio: number;
      wallHeight: number;
      photoCount?: number;
    };
    float: {
      enabled: boolean;
      spacing: number;
      height: number;
      spread: number;
      photoCount?: number;
    };
    wave: {
      enabled: boolean;
      spacing: number;
      amplitude: number;
      frequency: number;
      photoCount?: number;
    };
    spiral: {
      enabled: boolean;
      spacing: number;
      radius: number;
      heightStep: number;
      photoCount?: number;
    };
  };
  
  // UPDATED: New Cinematic Camera Animation Settings
  cameraAnimation: {
    enabled?: boolean;
    type: 'none' | 'showcase' | 'gallery_walk' | 'spiral_tour' | 'wave_follow' | 'grid_sweep' | 'photo_focus';
    speed: number;
    focusDistance: number;
    heightOffset: number;
    transitionTime: number;
    pauseTime: number;
    randomization: number;
  };
  
  animationSpeed: number;
  animationEnabled: boolean;
  photoCount: number;
  backgroundColor: string;
  backgroundGradient: boolean;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  backgroundGradientAngle: number;
  emptySlotColor: string;
  cameraDistance: number;
  cameraRotationEnabled: boolean;
  cameraRotationSpeed: number;
  cameraHeight: number;
  cameraEnabled: boolean;
  spotlightCount: number;
  spotlightHeight: number;
  spotlightDistance: number;
  spotlightAngle: number;
  spotlightWidth: number;
  spotlightPenumbra: number;
  ambientLightIntensity: number;
  spotlightIntensity: number;
  spotlightColor: string;
  floorEnabled: boolean;
  floorColor: string;
  floorOpacity: number;
  floorSize: number;
  floorReflectivity: number;
  floorMetalness: number;
  floorRoughness: number;
  gridEnabled: boolean;
  gridColor: string;
  gridSize: number;
  gridDivisions: number;
  gridOpacity: number;
  photoSize: number;
  photoRotation: boolean;
  photoSpacing: number;
  wallHeight: number;
  gridAspectRatio: number;
  photoBrightness: number;

  // Environment Settings
  sceneEnvironment?: 'default' | 'cube' | 'sphere' | 'gallery' | 'studio';
  floorTexture?: 'solid' | 'marble' | 'wood' | 'concrete' | 'metal' | 'glass' | 'checkerboard' | 'custom';
  customFloorTextureUrl?: string;
  environmentIntensity?: number;
  cubeTextureUrl?: string;
  sphereTextureUrl?: string;
  wallColor?: string;
  wallThickness?: number;
  ceilingEnabled?: boolean;
  ceilingHeight?: number;
  roomDepth?: number;
  shadowsEnabled?: boolean;

  // Legacy Auto-Rotate Settings (for backward compatibility)
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
};

const defaultSettings: SceneSettings = {
  animationPattern: 'grid',
  gridAspectRatioPreset: '16:9',
  animationSpeed: 50,
  animationEnabled: true,
  photoCount: 50,
  backgroundColor: '#000000',
  backgroundGradient: false,
  backgroundGradientStart: '#000000',
  backgroundGradientEnd: '#1a1a1a',
  backgroundGradientAngle: 180,
  emptySlotColor: '#1A1A1A',
  cameraDistance: 25,
  cameraRotationEnabled: false, // Disabled by default when cinematic is active
  cameraRotationSpeed: 0.2,
  cameraHeight: 10,
  cameraEnabled: true,
  
  // NEW: Cinematic Camera Animation (ENABLED BY DEFAULT)
  cameraAnimation: {
    enabled: true, // Enable by default for better photo showcase
    type: 'showcase', // Smart photo-focused animation
    speed: 1.0,
    focusDistance: 12.0, // Distance to focus on photos
    heightOffset: 2.0, // Height above floor particles
    transitionTime: 2.0, // Time to move between waypoints
    pauseTime: 1.5, // Time to pause at each photo group
    randomization: 0.2, // Add slight randomness to paths
  },
  
  spotlightCount: 4,
  spotlightHeight: 30,
  spotlightDistance: 40,
  spotlightAngle: Math.PI / 4,
  spotlightWidth: 0.6,
  spotlightPenumbra: 0.4,
  ambientLightIntensity: 0.8,
  spotlightIntensity: 150.0,
  spotlightColor: '#ffffff',
  floorEnabled: true,
  floorColor: '#1A1A1A',
  floorOpacity: 0.8,
  floorSize: 200,
  floorReflectivity: 0.8,
  floorMetalness: 0.7,
  floorRoughness: 0.2,
  gridEnabled: true,
  gridColor: '#444444',
  gridSize: 200,
  gridDivisions: 30,
  gridOpacity: 1.0,
  photoSize: 6.0,
  photoRotation: true,
  photoSpacing: 0,
  wallHeight: 0,
  gridAspectRatio: 1.77778,
  photoBrightness: 1.0,
  particles: {
    enabled: true,
    theme: 'Purple Magic',
    intensity: 0.7
  },
  patterns: {
    grid: {
      enabled: true,
      spacing: 0.1,
      aspectRatio: 1.77778,
      wallHeight: 0,
      photoCount: 50
    },
    float: {
      enabled: false,
      spacing: 0.1,
      height: 30,
      spread: 25,
      photoCount: 100
    },
    wave: {
      enabled: false,
      spacing: 0.15,
      amplitude: 5,
      frequency: 0.5,
      photoCount: 75
    },
    spiral: {
      enabled: false,
      spacing: 0.1,
      radius: 15,
      heightStep: 0.5,
      photoCount: 150
    }
  },

  // Environment Settings with defaults
  sceneEnvironment: 'default',
  floorTexture: 'solid',
  customFloorTextureUrl: '',
  environmentIntensity: 1.0,
  cubeTextureUrl: '',
  sphereTextureUrl: '',
  wallColor: '#3A3A3A',
  wallThickness: 2,
  ceilingEnabled: false,
  ceilingHeight: 100,
  roomDepth: 200,
  shadowsEnabled: true,

  // Legacy Auto-Rotate Settings (for backward compatibility)
  cameraAutoRotateSpeed: 0.5,
  cameraAutoRotateRadius: 30,
  cameraAutoRotateHeight: 10,
  cameraAutoRotateElevationMin: Math.PI / 6,
  cameraAutoRotateElevationMax: Math.PI / 3,
  cameraAutoRotateElevationSpeed: 0.3,
  cameraAutoRotateDistanceVariation: 5,
  cameraAutoRotateDistanceSpeed: 0.2,
  cameraAutoRotateVerticalDrift: 2,
  cameraAutoRotateVerticalDriftSpeed: 0.1,
  cameraAutoRotateFocusOffset: [0, 0, 0],
  cameraAutoRotatePauseOnInteraction: 500,
};

type SceneState = {
  settings: SceneSettings;
  updateSettings: (settings: Partial<SceneSettings>, debounce?: boolean) => void;
  resetSettings: () => void;
};

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

// Deep merge function for nested objects
const deepMerge = (target: any, source: any): any => {
  const output = { ...target };
  
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
};

export const useSceneStore = create<SceneState>()((set, get) => {
  const immediateUpdate = (newSettings: Partial<SceneSettings>) => {
    const currentSettings = get().settings;

    // Handle pattern changes
    if (newSettings.animationPattern && newSettings.animationPattern !== currentSettings.animationPattern) {
      // Update enabled states for patterns
      const updatedPatterns = { ...currentSettings.patterns };
      const oldPattern = currentSettings.animationPattern;
      const newPattern = newSettings.animationPattern;
      
      // Disable all patterns first
      Object.keys(updatedPatterns).forEach(pattern => {
        updatedPatterns[pattern as keyof typeof updatedPatterns].enabled = false;
      });
      
      // Enable the selected pattern
      if (newPattern && updatedPatterns[newPattern]) {
        updatedPatterns[newPattern].enabled = true;
        
        // Update the global photoCount based on the pattern-specific photoCount
        if (updatedPatterns[newPattern].photoCount !== undefined) {
          newSettings.photoCount = updatedPatterns[newPattern].photoCount;
        }
      }
      
      // Update the patterns in newSettings
      newSettings.patterns = updatedPatterns;
    }

    // Handle photo count validation
    if (newSettings.photoCount !== undefined) {
      const count = Math.min(Math.max(5, Math.floor(Number(newSettings.photoCount))), 500);
      if (!isNaN(count)) {
        newSettings.photoCount = count;
      } else {
        delete newSettings.photoCount;
      }
    }

    // Handle photo brightness validation
    if (newSettings.photoBrightness !== undefined) {
      const brightness = Math.min(Math.max(0.1, Number(newSettings.photoBrightness)), 3);
      if (!isNaN(brightness)) {
        newSettings.photoBrightness = brightness;
      } else {
        delete newSettings.photoBrightness;
      }
    }

    // Handle photo size validation
    if (newSettings.photoSize !== undefined) {
      const size = Math.min(Math.max(1.0, Number(newSettings.photoSize)), 30.0);
      if (!isNaN(size)) {
        newSettings.photoSize = size;
      } else {
        delete newSettings.photoSize;
      }
    }

    // SPECIAL HANDLING: When cinematic camera is enabled, disable legacy rotation
    if (newSettings.cameraAnimation?.enabled === true) {
      newSettings.cameraRotationEnabled = false;
      console.log('🎬 Cinematic camera enabled - disabling legacy rotation');
    }

    // SPECIAL HANDLING: When legacy rotation is enabled, disable cinematic camera
    if (newSettings.cameraRotationEnabled === true && currentSettings.cameraAnimation?.enabled) {
      newSettings.cameraAnimation = {
        ...currentSettings.cameraAnimation,
        enabled: false
      };
      console.log('📷 Legacy rotation enabled - disabling cinematic camera');
    }

    // Deep merge the new settings
    const updatedSettings = deepMerge(currentSettings, newSettings);
    
    console.log('🎨 STORE: Settings updated:', {
      oldCinematic: currentSettings.cameraAnimation,
      newCinematic: updatedSettings.cameraAnimation,
      changes: newSettings
    });
    
    set({ settings: updatedSettings });
  };

  // Create debounced version for expensive operations
  const debouncedUpdate = debounce(immediateUpdate, 150);

  return {
    settings: defaultSettings,
    
    updateSettings: (newSettings: Partial<SceneSettings>, debounce = false) => {
      if (debounce) {
        debouncedUpdate(newSettings);
      } else {
        immediateUpdate(newSettings);
      }
    },
    
    resetSettings: () => set({ settings: { ...defaultSettings } }),
  };
});

// Helper function to get cinematic camera type descriptions
export const getCinematicCameraTypeDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    'none': 'Disabled - Use manual camera controls',
    'showcase': 'Smart Photo Showcase - Automatically visits each photo with optimal viewing angles',
    'gallery_walk': 'Gallery Walk - Simulates walking through a traditional photo gallery',
    'spiral_tour': 'Spiral Tour - Follows spiral patterns with dynamic photo focusing',
    'wave_follow': 'Wave Follower - Tracks wave patterns while showcasing photos',
    'grid_sweep': 'Grid Sweep - Systematically covers grid layouts to show all photos',
    'photo_focus': 'Photo Focus - Prioritizes close-up views of individual photos'
  };
  
  return descriptions[type] || descriptions['none'];
};