// src/store/sceneStore.ts - UPDATED with Cinematic Camera Settings
import { create } from 'zustand';

export type SceneSettings = {
  // Animation Settings
  animationPattern: 'float' | 'wave' | 'spiral' | 'grid';
  gridAspectRatioPreset: '1:1' | '4:3' | '16:9' | '21:9' | 'custom';
  animationSpeed: number;
  animationEnabled: boolean;

  // Environment Settings
  sceneEnvironment?: 'default' | 'cube' | 'sphere' | 'gallery' | 'studio';
  wallColor?: string;
  wallThickness?: number;
  ceilingEnabled?: boolean;
  ceilingHeight?: number;
  roomDepth?: number;
  sphereTextureUrl?: string;
  cubeTextureUrl?: string;

  // Floor Texture Settings
  floorTexture?: 'solid' | 'marble' | 'wood' | 'concrete' | 'metal' | 'glass' | 'checkerboard' | 'custom';
  customFloorTextureUrl?: string;

  // Particle Settings
  particles: {
    enabled: boolean;
    theme: string;
    intensity: number;
  };

  // Pattern Settings
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

  // NEW: Enhanced Cinematic Camera Animation Settings
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

  // Photo Settings
  photoCount: number;
  photoSize: number;
  photoBrightness: number;
  emptySlotColor: string;

  // Background Settings
  backgroundColor: string;
  backgroundGradient: boolean;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  backgroundGradientAngle: number;

  // Camera Settings (Legacy + New)
  cameraDistance: number;
  cameraRotationEnabled: boolean;
  cameraRotationSpeed: number;
  cameraHeight: number;
  cameraEnabled: boolean;

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

  // Lighting Settings
  spotlightCount: number;
  spotlightHeight: number;
  spotlightDistance: number;
  spotlightAngle: number;
  spotlightWidth: number;
  spotlightPenumbra: number;
  ambientLightIntensity: number;
  spotlightIntensity: number;
  spotlightColor: string;

  // Floor Settings
  floorEnabled: boolean;
  floorColor: string;
  floorOpacity: number;
  floorSize: number;
  floorReflectivity: number;
  floorMetalness: number;
  floorRoughness: number;

  // Grid Settings
  gridEnabled: boolean;
  gridColor: string;
  gridSize: number;
  gridDivisions: number;
  gridOpacity: number;

  // Misc Settings
  shadowsEnabled?: boolean;
  environmentIntensity?: number;
};

interface SceneStore {
  settings: SceneSettings;
  updateSettings: (newSettings: Partial<SceneSettings>) => void;
  resetSettings: () => void;
}

// Default settings with new cinematic camera options
const defaultSettings: SceneSettings = {
  // Animation
  animationPattern: 'grid',
  gridAspectRatioPreset: '16:9',
  animationSpeed: 50,
  animationEnabled: true,

  // Environment
  sceneEnvironment: 'default',
  wallColor: '#3A3A3A',
  wallThickness: 2,
  ceilingEnabled: false,
  ceilingHeight: 100,
  roomDepth: 200,
  sphereTextureUrl: '',
  cubeTextureUrl: '',

  // Floor Texture
  floorTexture: 'solid',
  customFloorTextureUrl: '',

  // Particles
  particles: {
    enabled: true,
    theme: 'Purple Magic',
    intensity: 0.7,
  },

  // Patterns
  patterns: {
    grid: {
      enabled: true,
      spacing: 5,
      aspectRatio: 16/9,
      wallHeight: 50,
      photoCount: undefined,
    },
    float: {
      enabled: false,
      spacing: 8,
      height: 30,
      spread: 40,
      photoCount: undefined,
    },
    wave: {
      enabled: false,
      spacing: 6,
      amplitude: 10,
      frequency: 0.5,
      photoCount: undefined,
    },
    spiral: {
      enabled: false,
      spacing: 4,
      radius: 25,
      heightStep: 3,
      photoCount: undefined,
    },
  },

  // NEW: Cinematic Camera Animation (Replaces old cameraAnimation)
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

  // Photos
  photoCount: 50,
  photoSize: 5.0,
  photoBrightness: 1.0,
  emptySlotColor: '#1A1A1A',

  // Background
  backgroundColor: '#000000',
  backgroundGradient: false,
  backgroundGradientStart: '#000000',
  backgroundGradientEnd: '#1a1a2e',
  backgroundGradientAngle: 45,

  // Camera (Legacy settings maintained for compatibility)
  cameraDistance: 30,
  cameraRotationEnabled: false, // Disabled by default when cinematic is active
  cameraRotationSpeed: 0.5,
  cameraHeight: 10,
  cameraEnabled: true,

  // Legacy Auto-Rotate (for backward compatibility)
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

  // Lighting
  spotlightCount: 3,
  spotlightHeight: 50,
  spotlightDistance: 100,
  spotlightAngle: Math.PI / 6,
  spotlightWidth: 10,
  spotlightPenumbra: 0.5,
  ambientLightIntensity: 0.4,
  spotlightIntensity: 100,
  spotlightColor: '#ffffff',

  // Floor
  floorEnabled: true,
  floorColor: '#1A1A1A',
  floorOpacity: 1.0,
  floorSize: 200,
  floorReflectivity: 0.5,
  floorMetalness: 0.5,
  floorRoughness: 0.5,

  // Grid
  gridEnabled: false,
  gridColor: '#444444',
  gridSize: 200,
  gridDivisions: 30,
  gridOpacity: 1.0,

  // Misc
  shadowsEnabled: true,
  environmentIntensity: 1.0,
};

export const useSceneStore = create<SceneStore>((set) => ({
  settings: defaultSettings,
  
  updateSettings: (newSettings: Partial<SceneSettings>) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
  
  resetSettings: () =>
    set({ settings: { ...defaultSettings } }),
}));

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