// src/store/sceneStore.ts - UPDATED with Environment Settings
import { create } from 'zustand';

export type SceneSettings = {
  // Animation Settings
  animationPattern: 'float' | 'wave' | 'spiral' | 'grid';
  gridAspectRatioPreset: '1:1' | '4:3' | '16:9' | '21:9' | 'custom';
  animationSpeed: number;
  animationEnabled: boolean;

  // Environment Settings (NEW!)
  sceneEnvironment?: 'default' | 'cube' | 'sphere' | 'gallery' | 'studio';
  wallColor?: string;
  wallThickness?: number;
  ceilingEnabled?: boolean;
  ceilingHeight?: number;
  roomDepth?: number;
  sphereTextureUrl?: string;
  cubeTextureUrl?: string;

  // Floor Texture Settings (ENHANCED!)
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

  // Camera Animation Settings (ENHANCED!)
  cameraAnimation: {
    enabled?: boolean;
    type: 'none' | 'orbit' | 'figure8' | 'centerRotate' | 'wave' | 'spiral';
    speed: number;
    radius: number;
    height: number;
    amplitude: number;
    frequency: number;
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

  // Camera Settings
  cameraDistance: number;
  cameraRotationEnabled: boolean;
  cameraRotationSpeed: number;
  cameraHeight: number;
  cameraEnabled: boolean;

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

// Default settings with new environment options
const defaultSettings: SceneSettings = {
  // Animation
  animationPattern: 'grid',
  gridAspectRatioPreset: '16:9',
  animationSpeed: 50,
  animationEnabled: true,

  // Environment (NEW!)
  sceneEnvironment: 'default',
  wallColor: '#3A3A3A',
  wallThickness: 2,
  ceilingEnabled: false,
  ceilingHeight: 100,
  roomDepth: 200,
  sphereTextureUrl: '',
  cubeTextureUrl: '',

  // Floor Texture (ENHANCED!)
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

  // Camera Animation (ENHANCED!)
  cameraAnimation: {
    enabled: false,
    type: 'orbit',
    speed: 1.0,
    radius: 30,
    height: 15,
    amplitude: 8,
    frequency: 0.5,
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

  // Camera
  cameraDistance: 30,
  cameraRotationEnabled: false,
  cameraRotationSpeed: 0.5,
  cameraHeight: 10,
  cameraEnabled: true,

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