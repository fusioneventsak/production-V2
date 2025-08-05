// Enhanced CollageScene with WORKING Camera Systems and FIXED Touch Interaction for Auto-Rotate & Cinematic
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

// FIXED: Extended settings interface that matches your project's pattern structure
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
  
  // FIXED: Enhanced Cinematic Camera Animation Settings with fine-tuning controls
  cameraAnimation?: {
    enabled?: boolean;
    type: 'none' | 'showcase' | 'gallery_walk' | 'spiral_tour' | 'wave_follow' | 'grid_sweep' | 'photo_focus';
    speed: number;
    focusDistance: number;
    heightOffset: number;
    transitionTime: number;
    pauseTime: number;
    randomization: number;
    // NEW: Fine-tuning controls
    baseHeight?: number;        // Base camera height for all animations
    baseDistance?: number;      // Base distance from center for all animations
    heightVariation?: number;   // How much height varies during animation
    distanceVariation?: number; // How much distance varies during animation
  };
  
  // ENHANCED: Pattern-specific settings that match your existing structure
  patterns?: {
    grid?: {
      enabled?: boolean;
      photoCount?: number;
      aspectRatio?: number;     // Grid aspect ratio (width/height) - supports 1:1, 4:3, 16:9, 21:9, custom
      spacing?: number;         // Space between photos (0 = solid wall, 0.5 = 100% gaps, 1 = 200% gaps)
      wallHeight?: number;      // Height offset from floor
    };
    wave?: {
      enabled?: boolean;
      photoCount?: number;
      amplitude?: number;
      frequency?: number;
      spacing?: number;
    };
    spiral?: {
      enabled?: boolean;
      photoCount?: number;
      radius?: number;
      heightStep?: number;
      spacing?: number;
    };
    float?: {
      enabled?: boolean;
      photoCount?: number;
      height?: number;
      spread?: number;
      spacing?: number;
    };
  };
  
  // Legacy grid settings for backward compatibility
  gridAspectRatio?: number;
  gridAspectRatioPreset?: '1:1' | '4:3' | '16:9' | '21:9' | 'custom';
  photoSpacing?: number; // Legacy spacing setting
  
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

// ENHANCED GRID PATTERN - Perfect solid wall with no overlaps and smooth spacing control
class EnhancedGridPattern {
  constructor(private settings: any) {}

  generatePositions(time: number) {
    const positions: any[] = [];
    const rotations: [number, number, number][] = [];

    // Use pattern-specific photoCount if available, max 500
    const photoCount = this.settings.patterns?.grid?.photoCount !== undefined 
      ? this.settings.patterns.grid.photoCount 
      : this.settings.photoCount;
    
    const totalPhotos = Math.min(Math.max(photoCount, 1), 500); // Allow up to 500 photos
    const photoSize = this.settings.photoSize || 4.0;
    
    // Grid aspect ratio and spacing settings from pattern-specific config
    const aspectRatio = this.settings.patterns?.grid?.aspectRatio || this.settings.gridAspectRatio || 1.777778; // 16:9 default
    const spacingPercentage = this.settings.patterns?.grid?.spacing !== undefined 
      ? this.settings.patterns.grid.spacing 
      : (this.settings.photoSpacing || 0); // 0 to 1 (0% to 100%)
    const wallHeight = this.settings.patterns?.grid?.wallHeight || this.settings.wallHeight || 0;
    
    // Calculate grid dimensions based on aspect ratio
    const columns = Math.ceil(Math.sqrt(totalPhotos * aspectRatio));
    const rows = Math.ceil(totalPhotos / columns);
    
    // PERFECT SPACING: No overlaps, true solid wall when spacing = 0
    const photoWidth = photoSize * (9/16); // 16:9 aspect ratio width
    const photoHeight = photoSize; // Full height
    
    let horizontalSpacing, verticalSpacing;
    
    if (spacingPercentage === 0) { 
      // SOLID WALL: Photos touch perfectly edge-to-edge with NO gaps or overlaps
      horizontalSpacing = photoWidth;   // Exact photo width = perfect edge-to-edge
      verticalSpacing = photoHeight;    // Exact photo height = perfect edge-to-edge
    } else {
      // SPACED WALL: Add gaps proportional to spacing slider
      const horizontalGap = spacingPercentage * photoWidth;  // Gap proportional to photo width
      const verticalGap = spacingPercentage * photoHeight;   // Gap proportional to photo height
      
      horizontalSpacing = photoWidth + horizontalGap;   // Photo + gap
      verticalSpacing = photoHeight + verticalGap;      // Photo + gap
    }
    
    // Calculate total wall dimensions
    const totalWallWidth = (columns - 1) * horizontalSpacing;
    const totalWallHeight = (rows - 1) * verticalSpacing;
    
    // FLAT WALL positioning - ALL PHOTOS ON SAME Z PLANE
    const floorHeight = -12;
    const gridBaseHeight = floorHeight + photoSize * 0.6 + wallHeight;
    const wallZ = 0; // ALL photos on the SAME Z plane - flat wall
    
    // Center the wall
    const startX = -totalWallWidth / 2;
    const startY = gridBaseHeight - totalWallHeight / 2; // Center vertically
    
    // Animation settings
    const speed = this.settings.animationSpeed / 100;
    const animationTime = this.settings.animationEnabled ? time * speed : 0;
    
    // Generate positions in perfect grid layout - ALL ON SAME PLANE
    for (let i = 0; i < totalPhotos; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      // PERFECT positioning with no overlaps
      const x = startX + col * horizontalSpacing;
      const y = startY + row * verticalSpacing;
      const z = wallZ; // ALL photos on the same Z plane = FLAT WALL
      
      // Add very subtle animation only for spaced walls
      let animatedX = x;
      let animatedY = y;
      let animatedZ = z;
      
      if (this.settings.animationEnabled && spacingPercentage > 0) {
        // Only animate when there's spacing to avoid breaking solid wall
        const waveIntensity = spacingPercentage * photoSize * 0.02; // Very subtle
        
        animatedX += Math.sin(animationTime * 0.2 + col * 0.1) * waveIntensity;
        animatedY += Math.cos(animationTime * 0.2 + row * 0.1) * waveIntensity;
        // Keep Z the same for flat wall effect
      }
      
      positions.push([animatedX, animatedY, animatedZ]);
      
      // Minimal rotation for wall effect
      if (this.settings.photoRotation && this.settings.animationEnabled && spacingPercentage > 0) {
        // Very subtle rotations only for spaced walls
        const rotationY = Math.sin(animationTime * 0.1 + i * 0.03) * 0.01;
        const rotationX = Math.cos(animationTime * 0.1 + i * 0.03) * 0.005;
        rotations.push([rotationX, rotationY, 0]);
      } else {
        rotations.push([0, 0, 0]); // Perfect alignment for solid wall
      }
    }
    
    console.log(`🧱 PERFECT Grid Wall: ${columns}x${rows} (${totalPhotos} photos) - AspectRatio: ${aspectRatio.toFixed(2)} - ${spacingPercentage === 0 ? 'SOLID WALL (no gaps)' : `${(spacingPercentage * 100).toFixed(0)}% spacing`} - Flat Z=${wallZ}`);
    
    return { positions, rotations };
  }
}

// FIXED WAVE PATTERN - Properly responds to main photo count slider, supports up to 500 photos
class FixedWavePattern {
  constructor(private settings: any) {}

  generatePositions(time: number) {
    const positions: any[] = [];
    const rotations: [number, number, number][] = [];

    // FIXED: Always use main photoCount setting, not pattern-specific one
    const totalPhotos = Math.min(Math.max(this.settings.photoCount || 100, 1), 500);
    
    // Better spacing that spreads photos out more naturally
    const photoSize = this.settings.photoSize || 4;
    const baseSpacing = Math.max(12, photoSize * 2.5); // Good spacing for up to 500 photos
    const spacingMultiplier = 1 + (this.settings.patterns?.wave?.spacing || 0.15);
    const finalSpacing = baseSpacing * spacingMultiplier;
    
    // Calculate grid dimensions for spread out arrangement - optimized for 500 photos
    const columns = Math.ceil(Math.sqrt(totalPhotos * 1.2)); // Slightly wider grid
    const rows = Math.ceil(totalPhotos / columns);
    
    const speed = this.settings.animationSpeed / 50;
    const wavePhase = time * speed * 0.6; // Slower, more organic
    
    // MUCH HIGHER floating range - never touch the floor
    const floorHeight = -12;
    const minFloatHeight = 10; // High minimum - well above floor
    const maxFloatHeight = 30; // Higher ceiling for dramatic undulation
    const midHeight = (minFloatHeight + maxFloatHeight) / 2;
    
    for (let i = 0; i < totalPhotos; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      // Base positions with organic offset
      let x = (col - columns / 2) * finalSpacing;
      let z = (row - rows / 2) * finalSpacing;
      
      // Add subtle randomness to avoid perfect grid
      x += (Math.sin(i * 0.7) * 0.5 + Math.cos(i * 1.3) * 0.3) * finalSpacing * 0.15;
      z += (Math.cos(i * 0.8) * 0.5 + Math.sin(i * 1.1) * 0.3) * finalSpacing * 0.15;
      
      // Base amplitude that can be controlled
      const amplitude = Math.min(this.settings.patterns?.wave?.amplitude || 8, photoSize * 2.5);
      const frequency = this.settings.patterns?.wave?.frequency || 0.06; // Lower for broader waves
      
      let y = midHeight; // Start from middle of floating range
      
      if (this.settings.animationEnabled) {
        // MULTIPLE OVERLAPPING SINE WAVES for ultra-smooth organic motion
        
        // Primary X-direction wave - main rolling motion
        const primaryWave = Math.sin(x * frequency - wavePhase) * amplitude;
        
        // Secondary Z-direction wave - perpendicular undulation
        const secondaryWave = Math.sin(z * frequency * 0.8 + wavePhase * 0.7) * amplitude * 0.6;
        
        // Diagonal wave - creates natural cross-patterns
        const diagonalWave = Math.sin((x + z) * frequency * 0.5 - wavePhase * 1.2) * amplitude * 0.4;
        
        // Radial wave from center - gentle ripples emanating outward
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const radialWave = Math.sin(distanceFromCenter * frequency * 0.3 - wavePhase * 0.8) * amplitude * 0.5;
        
        // Circular wave - rotational component
        const angle = Math.atan2(z, x);
        const circularWave = Math.sin(angle * 3 + wavePhase * 0.4) * amplitude * 0.3;
        
        // High-frequency detail wave - adds surface texture
        const detailWave = Math.sin(x * frequency * 3 - wavePhase * 2.5) * Math.cos(z * frequency * 2.5 + wavePhase * 1.8) * amplitude * 0.2;
        
        // Temporal breathing wave - overall rise and fall
        const breathingWave = Math.sin(wavePhase * 0.3) * amplitude * 0.7;
        
        // Individual photo variation - each photo has slightly different motion
        const photoSeed = (Math.sin(i * 0.618) + 1) / 2; // Golden ratio for natural distribution
        const personalWave = Math.sin(wavePhase * 0.9 + photoSeed * Math.PI * 2) * amplitude * 0.3;
        
        // Combine all waves with different weights for natural motion
        const totalWaveHeight = 
          primaryWave * 1.0 +      // Main wave
          secondaryWave * 0.8 +    // Cross wave
          diagonalWave * 0.6 +     // Diagonal component
          radialWave * 0.7 +       // Radial ripples
          circularWave * 0.4 +     // Rotational component
          detailWave * 0.3 +       // Surface detail
          breathingWave * 0.5 +    // Overall breathing
          personalWave * 0.4;      // Individual variation
        
        y += totalWaveHeight;
        
        // CRITICAL: Ensure photos NEVER go below minimum height - always floating
        y = Math.max(y, minFloatHeight);
        
        // Also cap at maximum height to keep in view
        y = Math.min(y, maxFloatHeight);
      }
      
      positions.push([x, y, z]);

      if (this.settings.photoRotation) {
        // Organic rotation that follows the wave motion
        const waveInfluence = (y - midHeight) / amplitude; // How much the wave affects rotation
        
        // Gentle tilting that follows wave slopes
        const rotationX = Math.sin(wavePhase * 0.4 + x * frequency * 0.4) * 0.08 * waveInfluence;
        const rotationZ = Math.cos(wavePhase * 0.4 + z * frequency * 0.4) * 0.08 * waveInfluence;
        
        // Base rotation toward camera with wave variation
        const baseAngle = Math.atan2(x, z);
        const rotationY = baseAngle + Math.sin(wavePhase * 0.3 + i * 0.1) * 0.2;
        
        rotations.push([rotationX, rotationY, rotationZ]);
      } else {
        rotations.push([0, 0, 0]);
      }
    }

    console.log(`🌊 Wave Pattern: ${columns}x${rows} (${totalPhotos} photos) - FIXED: Uses main photoCount slider - Floating Y=${minFloatHeight}-${maxFloatHeight}`);

    return { positions, rotations };
  }
}

// FIXED SPIRAL PATTERN - Supports up to 500 photos with better distribution
class FixedSpiralPattern {
  constructor(private settings: any) {}

  generatePositions(time: number) {
    const positions: any[] = [];
    const rotations: [number, number, number][] = [];

    const photoCount = this.settings.patterns?.spiral?.photoCount !== undefined 
      ? this.settings.patterns.spiral.photoCount 
      : this.settings.photoCount;
    
    // FIXED: Support up to 500 photos efficiently
    const totalPhotos = Math.min(Math.max(photoCount, 1), 500);
    const speed = this.settings.animationSpeed / 50;
    const animationTime = time * speed * 2;
    
    // OPTIMIZED: Spiral parameters that work well with up to 500 photos
    const photoSize = this.settings.photoSize || 4;
    const baseRadius = Math.max(6, photoSize * 1.2); // Reasonable minimum radius
    const maxRadius = Math.max(45, photoSize * 9); // Wide spread for 500 photos
    const maxHeight = Math.max(55, photoSize * 11); // Tall enough for 500 photos
    const rotationSpeed = 0.6;
    const orbitalChance = 0.3; // More orbital photos for better area filling with 500 photos
    
    // Proper hover height - well above floor
    const floorHeight = -12;
    const hoverHeight = 4;
    const baseHeight = floorHeight + photoSize + hoverHeight;
    
    // Better vertical distribution for 500 photos
    const verticalBias = 0.35; // Less bias toward bottom for better spread
    const heightStep = this.settings.patterns?.spiral?.heightStep || 0.85;
    
    for (let i = 0; i < totalPhotos; i++) {
      // Generate random but consistent values for each photo
      const randomSeed1 = Math.sin(i * 0.73) * 0.5 + 0.5;
      const randomSeed2 = Math.cos(i * 1.37) * 0.5 + 0.5;
      const randomSeed3 = Math.sin(i * 2.11) * 0.5 + 0.5;
      const randomSeed4 = Math.sin(i * 3.17) * 0.5 + 0.5;
      
      // Determine if this photo is on the main funnel or an outer orbit
      const isOrbital = randomSeed1 < orbitalChance;
      
      // Better height distribution for 500 photos
      let normalizedHeight = Math.pow(randomSeed2, verticalBias);
      
      // Random height boosts for better filling with 500 photos
      if (randomSeed4 > 0.65) {
        normalizedHeight = Math.min(1.0, normalizedHeight + (randomSeed4 - 0.65) * 1.2);
      }
      
      // Apply height step to create spiral layers
      const y = baseHeight + normalizedHeight * maxHeight * heightStep;
      
      // Calculate radius at this height (funnel shape)
      const funnelRadius = baseRadius + (maxRadius - baseRadius) * normalizedHeight;
      
      let radius: number;
      let angleOffset: number;
      let verticalWobble: number = 0;
      
      if (isOrbital) {
        // Orbital photos - spread out more for 500 photos
        const orbitalVariation = 1.2 + randomSeed3 * 1.1;
        radius = funnelRadius * orbitalVariation;
        angleOffset = randomSeed3 * Math.PI * 2;
        
        // Random radius boosts for better area coverage with 500 photos
        if (randomSeed4 > 0.55) {
          radius *= (1.0 + (randomSeed4 - 0.55) * 1.3);
        }
        
        // Add vertical oscillation for orbital photos
        if (this.settings.animationEnabled) {
          verticalWobble = Math.sin(animationTime * 2 + i) * 3.5;
        }
      } else {
        // Main funnel photos with variation for 500 photos
        const radiusVariation = 0.65 + randomSeed3 * 0.7;
        radius = funnelRadius * radiusVariation;
        angleOffset = randomSeed4 * 0.4;
        
        // Scatter some main photos for better filling with 500 photos
        if (randomSeed4 > 0.75) {
          radius *= (1.0 + (randomSeed4 - 0.75) * 1.8);
        }
      }
      
      // Calculate angle with height-based rotation speed
      const heightSpeedFactor = 0.25 + normalizedHeight * 0.75;
      const angle = this.settings.animationEnabled ?
        (animationTime * rotationSpeed * heightSpeedFactor + angleOffset + (i * 0.04)) :
        (angleOffset + (i * 0.08));
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const finalY = y + verticalWobble;
      
      positions.push([x, finalY, z]);
      
      // Photos face camera in spiral pattern for better visibility
      if (this.settings.photoRotation) {
        const rotX = Math.sin(animationTime * 0.4 + i * 0.08) * 0.015;
        const rotY = 0; // Let camera-facing handle Y rotation
        const rotZ = Math.cos(animationTime * 0.4 + i * 0.08) * 0.015;
        rotations.push([rotX, rotY, rotZ]);
      } else {
        rotations.push([0, 0, 0]);
      }
    }

    console.log(`🌀 Spiral Pattern: (${totalPhotos} photos) - Supports up to 500 photos - Height: ${baseHeight.toFixed(1)}-${(baseHeight + maxHeight * heightStep).toFixed(1)}`);

    return { positions, rotations };
  }
}

// FIXED: Basic interaction tracker - handle wheel/zoom events properly
class SimpleInteractionTracker {
  private static instance: SimpleInteractionTracker;
  private userInteracting = false;
  private lastInteractionTime = 0;
  private listeners: Set<(interacting: boolean) => void> = new Set();
  private interactionTimeout: NodeJS.Timeout | null = null;
  private readonly RESUME_DELAY = 2000; // Fixed 2 seconds AFTER interaction stops

  static getInstance(): SimpleInteractionTracker {
    if (!SimpleInteractionTracker.instance) {
      SimpleInteractionTracker.instance = new SimpleInteractionTracker();
    }
    return SimpleInteractionTracker.instance;
  }

  private constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Start interaction - camera pauses immediately
    const handleInteractionStart = (e: Event) => {
      if (!e.isTrusted) return;
      
      const canvas = document.querySelector('canvas');
      if (!canvas || !(e.target === canvas || canvas.contains(e.target as Node))) return;

      // Mark as interacting immediately
      if (!this.userInteracting) {
        console.log('📷 Camera pause: User interaction started');
        this.userInteracting = true;
        this.notifyListeners();
      }
      
      // Update last interaction time and cancel any pending resume
      this.lastInteractionTime = Date.now();
      this.clearInteractionTimeout();
    };

    // Continue interaction - reset the 2-second timer
    const handleInteractionContinue = (e: Event) => {
      if (!e.isTrusted) return;
      
      const canvas = document.querySelector('canvas');
      if (!canvas || !(e.target === canvas || canvas.contains(e.target as Node))) return;

      // Reset the timer - user is still interacting
      this.lastInteractionTime = Date.now();
      this.clearInteractionTimeout();
    };

    // End interaction - start 2-second countdown
    const handleInteractionEnd = (e: Event) => {
      if (!e.isTrusted) return;
      
      const canvas = document.querySelector('canvas');
      if (!canvas || !(e.target === canvas || canvas.contains(e.target as Node))) return;

      // Update last interaction time
      this.lastInteractionTime = Date.now();
      this.clearInteractionTimeout();
      
      // Start 2-second countdown AFTER interaction ends
      this.interactionTimeout = setTimeout(() => {
        console.log('📷 Camera resume: 2 seconds since interaction stopped');
        this.userInteracting = false;
        this.notifyListeners();
      }, this.RESUME_DELAY);
    };

    // FIXED: Special handling for wheel events (zoom) - they don't have an "end" event
    const handleWheelInteraction = (e: Event) => {
      if (!e.isTrusted) return;
      
      const canvas = document.querySelector('canvas');
      if (!canvas || !(e.target === canvas || canvas.contains(e.target as Node))) return;

      // Mark as interacting immediately
      if (!this.userInteracting) {
        console.log('📷 Camera pause: Wheel/zoom interaction');
        this.userInteracting = true;
        this.notifyListeners();
      }
      
      // Update last interaction time and cancel any pending resume
      this.lastInteractionTime = Date.now();
      this.clearInteractionTimeout();
      
      // For wheel events, immediately start the 2-second countdown since there's no "end" event
      this.interactionTimeout = setTimeout(() => {
        console.log('📷 Camera resume: 2 seconds since wheel interaction');
        this.userInteracting = false;
        this.notifyListeners();
      }, this.RESUME_DELAY);
    };

    // Mouse events
    document.addEventListener('mousedown', handleInteractionStart, { passive: true });
    document.addEventListener('mousemove', (e) => {
      // Only count as interaction if dragging (mouse is down)
      if ((e as MouseEvent).buttons > 0) {
        handleInteractionContinue(e);
      }
    }, { passive: true });
    document.addEventListener('mouseup', handleInteractionEnd, { passive: true });
    
    // FIXED: Wheel events get special handling
    document.addEventListener('wheel', handleWheelInteraction, { passive: true });
    
    // Touch events - user can interact as long as they want
    document.addEventListener('touchstart', handleInteractionStart, { passive: true });
    document.addEventListener('touchmove', handleInteractionContinue, { passive: true });
    document.addEventListener('touchend', handleInteractionEnd, { passive: true });
    document.addEventListener('touchcancel', handleInteractionEnd, { passive: true });
    
    // Keyboard events
    document.addEventListener('keydown', handleInteractionStart, { passive: true });
    document.addEventListener('keyup', handleInteractionEnd, { passive: true });
  }

  private clearInteractionTimeout() {
    if (this.interactionTimeout) {
      clearTimeout(this.interactionTimeout);
      this.interactionTimeout = null;
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.userInteracting);
    });
  }

  subscribe(callback: (interacting: boolean) => void) {
    this.listeners.add(callback);
    // Immediately notify with current state
    callback(this.userInteracting);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  isUserInteracting(): boolean {
    return this.userInteracting;
  }
}

// FIXED: Auto-rotate camera - pause ALL timers, resume from current position at original speed
const AutoRotateCamera: React.FC<{
  settings: ExtendedSceneSettings;
}> = ({ settings }) => {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const heightTimeRef = useRef(0);
  const distanceTimeRef = useRef(0);
  const verticalDriftTimeRef = useRef(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  
  // Store ALL timer states when interaction starts
  const pausedTimersRef = useRef<{
    mainTime: number;
    heightTime: number;
    distanceTime: number;
    verticalDriftTime: number;
    pausedAt: number;
  } | null>(null);
  
  const resumeFromAngleRef = useRef<number | null>(null);

  // Subscribe to simple interaction tracker
  useEffect(() => {
    const tracker = SimpleInteractionTracker.getInstance();
    const unsubscribe = tracker.subscribe((interacting) => {
      if (interacting && !isUserInteracting) {
        // PAUSE ALL TIMERS - capture current state
        pausedTimersRef.current = {
          mainTime: timeRef.current,
          heightTime: heightTimeRef.current,
          distanceTime: distanceTimeRef.current,
          verticalDriftTime: verticalDriftTimeRef.current,
          pausedAt: Date.now()
        };
        
        // Calculate current angle from camera position for smooth continuation
        const baseRadius = settings.cameraAutoRotateRadius || settings.cameraDistance || 25;
        const centerX = 0;
        const centerZ = 0;
        
        const deltaX = camera.position.x - centerX;
        const deltaZ = camera.position.z - centerZ;
        resumeFromAngleRef.current = Math.atan2(deltaZ, deltaX);
        
        console.log('📷 Auto-rotate: PAUSED all timers at interaction start', {
          mainAngle: (timeRef.current * 180 / Math.PI).toFixed(1) + '°',
          heightTime: heightTimeRef.current.toFixed(2),
          distanceTime: distanceTimeRef.current.toFixed(2),
          userAngle: (resumeFromAngleRef.current * 180 / Math.PI).toFixed(1) + '°'
        });
        
      } else if (!interacting && isUserInteracting && pausedTimersRef.current && resumeFromAngleRef.current !== null) {
        // RESUME FROM USER'S FINAL POSITION - update main rotation to match user position
        timeRef.current = resumeFromAngleRef.current;
        
        // Keep other animations synchronized by calculating elapsed pause time
        const pauseDuration = (Date.now() - pausedTimersRef.current.pausedAt) / 1000;
        
        // Resume other timers from where they left off (they should stay synchronized)
        heightTimeRef.current = pausedTimersRef.current.heightTime;
        distanceTimeRef.current = pausedTimersRef.current.distanceTime;
        verticalDriftTimeRef.current = pausedTimersRef.current.verticalDriftTime;
        
        console.log('📷 Auto-rotate: RESUMED from user position', {
          resumeAngle: (resumeFromAngleRef.current * 180 / Math.PI).toFixed(1) + '°',
          pauseDuration: pauseDuration.toFixed(1) + 's',
          restoredTimers: 'heightTime, distanceTime, verticalDriftTime'
        });
        
        // Clear stored state
        pausedTimersRef.current = null;
        resumeFromAngleRef.current = null;
      }
      
      setIsUserInteracting(interacting);
    });
    return unsubscribe;
  }, [camera, settings.cameraAutoRotateRadius, settings.cameraDistance, isUserInteracting]);

  useFrame((state, delta) => {
    // Only run if auto-rotate is enabled AND cinematic is disabled AND user is not interacting
    const cinematicActive = settings.cameraAnimation?.enabled && settings.cameraAnimation.type !== 'none';
    
    if (!settings.cameraRotationEnabled || cinematicActive || isUserInteracting) {
      return;
    }

    // CONSISTENT SPEED UPDATE - all timers advance at their original speeds
    const mainSpeed = settings.cameraAutoRotateSpeed || settings.cameraRotationSpeed || 0.5;
    const heightSpeed = settings.cameraAutoRotateElevationSpeed || 0.3;
    const distanceSpeed = settings.cameraAutoRotateDistanceSpeed || 0.2;
    const driftSpeed = settings.cameraAutoRotateVerticalDriftSpeed || 0.1;
    
    // Update all timers consistently
    timeRef.current += delta * mainSpeed;
    heightTimeRef.current += delta * heightSpeed;
    distanceTimeRef.current += delta * distanceSpeed;
    verticalDriftTimeRef.current += delta * driftSpeed;
    
    // Base settings
    const baseRadius = settings.cameraAutoRotateRadius || settings.cameraDistance || 25;
    const baseHeight = settings.cameraAutoRotateHeight || settings.cameraHeight || 8;
    
    // Distance variation - uses its own timer
    const radiusVariation = settings.cameraAutoRotateDistanceVariation || 0;
    const radius = baseRadius + Math.sin(distanceTimeRef.current) * radiusVariation;
    
    // Height oscillation - uses its own timer
    const elevationMin = settings.cameraAutoRotateElevationMin || (Math.PI / 6);
    const elevationMax = settings.cameraAutoRotateElevationMax || (Math.PI / 3);
    const elevationRange = elevationMax - elevationMin;
    const elevationOscillation = (Math.sin(heightTimeRef.current) + 1) / 2; // 0 to 1
    const phi = elevationMin + (elevationOscillation * elevationRange);
    
    // Calculate spherical position using main timeRef for rotation
    const x = radius * Math.sin(phi) * Math.cos(timeRef.current);
    const y = baseHeight + Math.cos(phi) * radius * 0.2;
    const z = radius * Math.sin(phi) * Math.sin(timeRef.current);
    
    // Vertical drift - uses its own timer
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
  });

  return null;
};

// SIMPLIFIED: Cinematic camera - just pause on interaction, resume after 2 seconds
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
    // Fine-tuning controls
    baseHeight?: number;
    baseDistance?: number;
    heightVariation?: number;
    distanceVariation?: number;
  };
  photoPositions: PhotoPosition[];
  settings: ExtendedSceneSettings;
}> = ({ config, photoPositions, settings }) => {
  const { camera } = useThree();
  const timeRef = useRef(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const wasActiveRef = useRef(false);

  // Subscribe to simple interaction tracker
  useEffect(() => {
    const tracker = SimpleInteractionTracker.getInstance();
    const unsubscribe = tracker.subscribe((interacting) => {
      setIsUserInteracting(interacting);
    });
    return unsubscribe;
  }, []);

  // Initialize animation when enabled
  useEffect(() => {
    if (config?.enabled && config.type !== 'none') {
      timeRef.current = 0;
      wasActiveRef.current = false;
      console.log('🎬 Cinematic camera enabled');
    }
  }, [config?.enabled, config?.type]);

  useFrame((state, delta) => {
    if (!config?.enabled || config.type === 'none' || !photoPositions.length) {
      if (wasActiveRef.current) {
        console.log('🎬 Cinematic camera disabled');
        wasActiveRef.current = false;
      }
      return;
    }

    // Simple pause during user interaction
    if (isUserInteracting) {
      if (wasActiveRef.current) {
        console.log('🎬 Cinematic camera paused for user interaction');
        wasActiveRef.current = false;
      }
      return;
    }

    if (!wasActiveRef.current) {
      console.log('🎬 Cinematic camera resumed');
      wasActiveRef.current = true;
    }

    const validPhotos = photoPositions.filter(p => !p.id.startsWith('placeholder-'));
    if (!validPhotos.length) return;

    // Pattern-specific speed adjustments
    const getPatternSpeed = () => {
      switch (settings.animationPattern) {
        case 'spiral':
          return 0.15;
        case 'wave':
          return 0.2;
        case 'float':
          return 0.3;
        default:
          return 0.25;
      }
    };

    const speed = (config.speed || 1.0) * getPatternSpeed();
    timeRef.current += delta * speed;

    // Pattern-aware defaults
    const photoSize = settings.photoSize || 4;
    const floorHeight = -12;
    const photoDisplayHeight = floorHeight + photoSize;
    
    const getPatternAwareDefaults = () => {
      switch (settings.animationPattern) {
        case 'spiral':
          return {
            height: Math.max(35, photoDisplayHeight + photoSize * 8),
            distance: Math.max(60, photoSize * 15),
            heightVar: photoSize * 0.5,
            distanceVar: 5,
          };
        case 'wave':
          return {
            height: Math.max(8, photoDisplayHeight + photoSize * 1.5),
            distance: Math.max(20, photoSize * 5),
            heightVar: photoSize * 0.8,
            distanceVar: 8,
          };
        case 'float':
          return {
            height: Math.max(18, photoDisplayHeight + photoSize * 3.5),
            distance: Math.max(30, photoSize * 8),
            heightVar: photoSize * 1.5,
            distanceVar: 12,
          };
        default: // grid
          return {
            height: Math.max(15, photoDisplayHeight + photoSize * 2.5),
            distance: Math.max(25, photoSize * 7),
            heightVar: photoSize * 1.2,
            distanceVar: 10,
          };
      }
    };

    const patternDefaults = getPatternAwareDefaults();
    
    const baseHeight = config.baseHeight !== undefined ? 
      config.baseHeight : patternDefaults.height;
    const baseDistance = config.baseDistance !== undefined ? 
      config.baseDistance : patternDefaults.distance;
    const heightVariation = config.heightVariation !== undefined ? 
      config.heightVariation : patternDefaults.heightVar;
    const distanceVariation = config.distanceVariation !== undefined ? 
      config.distanceVariation : patternDefaults.distanceVar;

    // Better center calculation
    let centerX = 0, centerZ = 0;
    if (validPhotos.length > 0) {
      centerX = validPhotos.reduce((sum, p) => sum + p.position[0], 0) / validPhotos.length;
      centerZ = validPhotos.reduce((sum, p) => sum + p.position[2], 0) / validPhotos.length;
    }

    let x, y, z, lookX, lookY, lookZ;

    // Calculate animation position based on current time
    switch (config.type) {
      case 'showcase':
        const fig8Time = timeRef.current * 0.4;
        const fig8Radius = baseDistance * (0.8 + Math.sin(fig8Time * 0.1) * 0.1);
        
        x = centerX + Math.sin(fig8Time) * fig8Radius;
        y = baseHeight + Math.sin(fig8Time * 1.1) * heightVariation * 0.4;
        z = centerZ + Math.sin(fig8Time * 2) * fig8Radius * 0.7;
        
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
        break;

      case 'gallery_walk':
        const walkTime = (timeRef.current * 0.25) % 4;
        const walkRadius = baseDistance * 0.8;
        
        const angle = (walkTime / 4) * Math.PI * 2;
        x = centerX + walkRadius * Math.cos(angle);
        z = centerZ + walkRadius * Math.sin(angle) * 0.7;
        y = baseHeight + Math.sin(timeRef.current * 0.2) * heightVariation * 0.3;
        
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
        break;

      case 'spiral_tour':
        const spiralTime = timeRef.current * 0.2;
        
        const orbitRadius = baseDistance;
        const orbitHeight = baseHeight;
        
        x = centerX + Math.cos(spiralTime) * orbitRadius;
        y = orbitHeight + Math.sin(spiralTime * 0.1) * (heightVariation * 0.2);
        z = centerZ + Math.sin(spiralTime) * orbitRadius * 0.9;
        
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 2;
        lookZ = centerZ;
        break;

      case 'wave_follow':
        const waveTime = timeRef.current * 0.3;
        const waveRadius = baseDistance * (0.9 + Math.sin(waveTime * 0.2) * 0.1);
        
        x = centerX + Math.sin(waveTime) * waveRadius;
        y = baseHeight + Math.sin(waveTime * 1.1) * heightVariation * 0.4;
        z = centerZ + Math.cos(waveTime * 0.7) * waveRadius * 0.6;
        
        lookX = centerX + Math.sin(waveTime + 0.3) * waveRadius * 0.2;
        lookY = photoDisplayHeight + photoSize * 0.3;
        lookZ = centerZ + Math.cos(waveTime * 0.7 + 0.3) * waveRadius * 0.1;
        break;

      case 'grid_sweep':
        const sweepTime = (timeRef.current * 0.2) % 6;
        const sweepRadius = baseDistance * 0.75;
        
        if (sweepTime < 2) {
          const t = sweepTime / 2;
          x = centerX + (t * 2 - 1) * sweepRadius;
          z = centerZ + sweepRadius * 0.6;
        } else if (sweepTime < 4) {
          const t = (sweepTime - 2) / 2;
          x = centerX + (1 - t * 2) * sweepRadius;
          z = centerZ - sweepRadius * 0.6;
        } else {
          const t = (sweepTime - 4) / 2;
          x = centerX - sweepRadius + t * sweepRadius * 0.4;
          z = centerZ + (sweepRadius * 0.6) * (1 - t * 2);
        }
        
        y = baseHeight + Math.sin(sweepTime * 0.3) * heightVariation * 0.2;
        
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
        break;

      case 'photo_focus':
        const focusTime = timeRef.current * 0.4;
        const focusRadius = baseDistance * 0.7;
        
        const scale = focusRadius / (1 + Math.sin(focusTime) ** 2 * 0.3);
        x = centerX + scale * Math.cos(focusTime);
        y = baseHeight + Math.sin(focusTime * 0.8) * heightVariation * 0.3;
        z = centerZ + scale * Math.sin(focusTime) * Math.cos(focusTime);
        
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
        break;

      default:
        x = centerX + Math.cos(timeRef.current * 0.3) * baseDistance;
        y = baseHeight;
        z = centerZ + Math.sin(timeRef.current * 0.3) * baseDistance;
        lookX = centerX;
        lookY = photoDisplayHeight + photoSize * 0.5;
        lookZ = centerZ;
    }

    // Ensure reasonable bounds
    y = Math.max(y, photoDisplayHeight + 2);
    lookY = Math.max(lookY, photoDisplayHeight);

    // Apply camera position directly - no complex blending
    camera.position.set(x, y, z);
    camera.lookAt(lookX, lookY, lookZ);
  });

  return null;
};

// FIXED: Updated CameraControls with better coordination and interaction support
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
  
  // FIXED: Better camera initialization that doesn't fight with cinematic
  useEffect(() => {
    if (camera && controlsRef.current) {
      const photoSize = settings.photoSize || 4;
      const distance = Math.max(settings.cameraDistance || 25, photoSize * 6);
      const height = Math.max(settings.cameraHeight || 5, photoSize * 3);
      
      // Only set initial position when cinematic is off or just starting
      if (!isCinematicActive) {
        camera.position.set(distance * 0.7, height, distance * 0.7);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
      
      console.log(`📷 Camera controls - Cinematic: ${isCinematicActive ? 'ACTIVE' : 'MANUAL'}`);
    }
  }, [camera, isCinematicActive, settings.cameraDistance, settings.cameraHeight, settings.photoSize]);

  return (
    <>
      {/* FIXED: OrbitControls that work smoothly alongside cinematic */}
      <OrbitControls
        ref={controlsRef}
        enabled={settings.cameraEnabled !== false}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={Math.max(8, (settings.photoSize || 4) * 2)}
        maxDistance={300}
        enableDamping={true}
        dampingFactor={0.08} // Slightly more responsive
        // FIXED: Auto-rotate only when neither cinematic mode is active
        autoRotate={!isCinematicActive && settings.cameraRotationEnabled}
        autoRotateSpeed={settings.cameraRotationSpeed || 0.5}
        // FIXED: Less aggressive mouse sensitivity when cinematic is active
        rotateSpeed={isCinematicActive ? 0.3 : 0.5}
        panSpeed={isCinematicActive ? 0.5 : 0.8}
        zoomSpeed={isCinematicActive ? 0.8 : 1.2}
      />
      
      {/* Auto-Rotate only when cinematic is OFF */}
      {!isCinematicActive && (
        <AutoRotateCamera settings={settings} />
      )}
      
      {/* Cinematic Camera */}
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

// FIXED: Enhanced Slot Manager with proper photo count handling up to 500
class EnhancedSlotManager {
  private slotAssignments = new Map<string, number>();
  private occupiedSlots = new Set<number>();
  private availableSlots: number[] = [];
  private totalSlots = 0;
  private photoAspectRatios = new Map<string, number>();

  constructor(totalSlots: number) {
    this.updateSlotCount(Math.min(Math.max(totalSlots, 1), 500)); // FIXED: Clamp to 1-500
  }

  updateSlotCount(newTotal: number) {
    // FIXED: Ensure we can handle up to 500 photos
    const clampedTotal = Math.min(Math.max(newTotal, 1), 500);
    
    if (clampedTotal === this.totalSlots) return;
    
    console.log(`📊 Updating slot count from ${this.totalSlots} to ${clampedTotal} (max 500 supported)`);
    this.totalSlots = clampedTotal;
    
    // Clean up slots that are now out of range
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (slotIndex >= clampedTotal) {
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
    
    // Track aspect ratios
    safePhotos.forEach(photo => {
      if (!this.photoAspectRatios.has(photo.id)) {
        if (photo.width && photo.height) {
          this.photoAspectRatios.set(photo.id, photo.width / photo.height);
        }
      }
    });
    
    // Clean up slots for photos that no longer exist
    const currentPhotoIds = new Set(safePhotos.map(p => p.id));
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (!currentPhotoIds.has(photoId)) {
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
        this.photoAspectRatios.delete(photoId);
      }
    }

    this.rebuildAvailableSlots();

    // Sort photos for consistent assignment
    const sortedPhotos = [...safePhotos].sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return a.id.localeCompare(b.id);
    });

    // Assign slots to new photos
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

//FIXED: Environment renderer for different scene environments
const EnvironmentRenderer: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  const { scene } = useThree();
  
  useEffect(() => {
    // Simple environment setup based on settings
    if (!settings.sceneEnvironment || settings.sceneEnvironment === 'default') {
      return;
    }
    
    console.log('🌍 ENVIRONMENT: Setting up', settings.sceneEnvironment);
    
    // Basic environment implementations
    switch (settings.sceneEnvironment) {
      case 'gallery':
        // Add ambient lighting for gallery feel
        scene.fog = new THREE.Fog(0x000000, 50, 200);
        break;
      case 'studio':
        // Clear fog for clean studio look
        scene.fog = null;
        break;
      case 'cube':
        // Could add cube environment map here
        console.log('🌍 Cube environment selected');
        break;
      case 'sphere':
        // Could add sphere environment map here  
        console.log('🌍 Sphere environment selected');
        break;
    }
    
    return () => {
      // Cleanup fog when component unmounts or environment changes
      if (scene.fog) {
        scene.fog = null;
      }
    };
  }, [scene, settings.sceneEnvironment]);

  return null;
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

// FIXED: Textured Floor component that uses the FloorTextureFactory
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

// FIXED: Floor component that actually renders in the scene
const Floor: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  if (!settings.floorEnabled) return null;

  const floorMaterial = useMemo(() => {
    console.log('🏢 FLOOR: Creating floor with settings:', {
      floorEnabled: settings.floorEnabled,
      floorSize: settings.floorSize,
      floorColor: settings.floorColor,
      floorOpacity: settings.floorOpacity
    });

    return new THREE.MeshStandardMaterial({
      color: settings.floorColor || '#1A1A1A',
      transparent: (settings.floorOpacity || 1) < 1,
      opacity: settings.floorOpacity || 1,
      metalness: Math.min(settings.floorMetalness || 0.5, 0.9),
      roughness: Math.max(settings.floorRoughness || 0.5, 0.1),
      side: THREE.DoubleSide,
      envMapIntensity: 0.5,
    });
  }, [settings.floorColor, settings.floorOpacity, settings.floorMetalness, settings.floorRoughness]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -12, 0]} // Match the floor height used in patterns
      receiveShadow
    >
      <planeGeometry args={[settings.floorSize || 200, settings.floorSize || 200, 32, 32]} />
      <primitive object={floorMaterial} attach="material" />
    </mesh>
  );
};

// FIXED: Grid component that actually renders in the scene
const Grid: React.FC<{ settings: ExtendedSceneSettings }> = ({ settings }) => {
  if (!settings.gridEnabled) return null;

  const gridHelper = useMemo(() => {
    console.log('🔧 GRID: Creating grid with settings:', {
      gridEnabled: settings.gridEnabled,
      gridSize: settings.gridSize,
      gridDivisions: settings.gridDivisions,
      gridColor: settings.gridColor,
      gridOpacity: settings.gridOpacity
    });

    const helper = new THREE.GridHelper(
      settings.gridSize || 200,
      settings.gridDivisions || 30,
      settings.gridColor || '#444444',
      settings.gridColor || '#444444'
    );
    
    const material = helper.material as THREE.LineBasicMaterial;
    material.transparent = true;
    material.opacity = Math.min(settings.gridOpacity || 1.0, 1.0);
    material.color = new THREE.Color(settings.gridColor || '#444444');
    
    helper.position.y = -11.99; // Just above the floor to prevent z-fighting
    
    console.log('🔧 GRID: Grid created and positioned at y =', helper.position.y);
    return helper;
  }, [settings.gridEnabled, settings.gridSize, settings.gridDivisions, settings.gridColor, settings.gridOpacity]);

  return <primitive object={gridHelper} />;
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
  // FIXED: Both float and spiral patterns face camera for best visibility
  const shouldFaceCamera = settings.animationPattern === 'float' || settings.animationPattern === 'spiral';
  
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

// FIXED: Enhanced Animation Controller with proper photo count handling
const EnhancedAnimationController: React.FC<{
  settings: ExtendedSceneSettings;
  photos: Photo[];
  onPositionsUpdate: (photos: PhotoWithPosition[]) => void;
}> = ({ settings, photos, onPositionsUpdate }) => {
  const slotManagerRef = useRef(new EnhancedSlotManager(Math.min(Math.max(settings.photoCount || 100, 1), 500)));
  const lastPhotoCount = useRef(Math.min(Math.max(settings.photoCount || 100, 1), 500));
  
  const updatePositions = useCallback((time: number = 0) => {
    try {
      const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
      const slotAssignments = slotManagerRef.current.assignSlots(safePhotos);
      
      let patternState;
      try {
        // FIXED: Use enhanced patterns for better grid wall support
        if (settings.animationPattern === 'grid') {
          const enhancedGridPattern = new EnhancedGridPattern(settings);
          patternState = enhancedGridPattern.generatePositions(time);
        } else if (settings.animationPattern === 'wave') {
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
              photoCount: Math.min(Math.max(settings.photoCount || 100, 1), 500)
            },
            safePhotos
          );
          patternState = pattern.generatePositions(time);
        }
        
        // Apply floor level adjustments - FIXED: Higher hover height for gentle floating
        if (settings.animationPattern === 'spiral' || settings.animationPattern === 'wave') {
          const floorLevel = -12;
          const photoSize = settings.photoSize || 4.0;
          
          // Different hover heights for different patterns
          const hoverHeight = settings.animationPattern === 'wave' ? 8 : 5; // Wave floats higher
          const minPhotoHeight = floorLevel + photoSize + hoverHeight;
          
          patternState.positions = patternState.positions.map((pos, index) => {
            const [x, y, z] = pos;
            
            // FIXED: Ensure photos float gently, never touch floor
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
        const totalSlots = Math.min(Math.max(settings.photoCount || 100, 1), 500); // FIXED: Clamp to 1-500
        
        for (let i = 0; i < totalSlots; i++) {
          const x = (i % 10) * spacing - (spacing * 5);
          const z = Math.floor(i / 10) * spacing - (spacing * 5);
          positions.push([x, -6, z]);
          rotations.push([0, 0, 0]);
        }
        patternState = { positions, rotations };
      }
      
      const photosWithPositions: PhotoWithPosition[] = [];
      const totalSlots = Math.min(Math.max(settings.photoCount || 100, 1), 500); // FIXED: Clamp to 1-500
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
    const newPhotoCount = Math.min(Math.max(settings.photoCount || 100, 1), 500); // FIXED: Clamp to 1-500
    if (newPhotoCount !== lastPhotoCount.current) {
      console.log(`📊 Photo count changed from ${lastPhotoCount.current} to ${newPhotoCount}`);
      slotManagerRef.current.updateSlotCount(newPhotoCount);
      lastPhotoCount.current = newPhotoCount;
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

// Enhanced Scene Settings with Precise Arrow Controls for Fine-tuning
import { ChevronUp, ChevronDown, Grid, Palette, CameraIcon, ImageIcon, Square, Sun, Lightbulb, RotateCw, Move, Eye, Camera, Sparkles, Building, Sphere, Gallery, Studio, Home, Layers, Video, Play, Target, Clock, Zap, Settings, ArrowUp, ArrowRight, TrendingUp, Maximize, Ratio, Hash, Ruler } from 'lucide-react';

// Enhanced Slider Component with Arrow Controls
const EnhancedSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onChangeComplete?: (value: number) => void;
  suffix?: string;
  description?: string;
  formatValue?: (value: number) => string;
  showArrows?: boolean;
  arrowStep?: number;
  fastStep?: number;
}> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onChangeComplete,
  suffix = '',
  description,
  formatValue,
  showArrows = false,
  arrowStep,
  fastStep
}) => {
  const actualArrowStep = arrowStep || step;
  const actualFastStep = fastStep || actualArrowStep * 10;
  
  const displayValue = formatValue ? formatValue(value) : value.toString();
  
  const handleArrowClick = (direction: 'up' | 'down', isFast = false) => {
    const stepSize = isFast ? actualFastStep : actualArrowStep;
    const newValue = direction === 'up' 
      ? Math.min(value + stepSize, max)
      : Math.max(value - stepSize, min);
    
    onChange(newValue);
    onChangeComplete?.(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm text-gray-300">
          {label}
          <span className="ml-2 text-xs text-gray-400">
            {displayValue}{suffix}
          </span>
        </label>
        
        {showArrows && (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => handleArrowClick('down')}
              onMouseDown={(e) => {
                e.preventDefault();
                let interval: NodeJS.Timeout;
                let timeout: NodeJS.Timeout;
                
                timeout = setTimeout(() => {
                  interval = setInterval(() => {
                    handleArrowClick('down', true);
                  }, 100);
                }, 500);
                
                const cleanup = () => {
                  clearTimeout(timeout);
                  clearInterval(interval);
                  document.removeEventListener('mouseup', cleanup);
                  document.removeEventListener('mouseleave', cleanup);
                };
                
                document.addEventListener('mouseup', cleanup);
                document.addEventListener('mouseleave', cleanup);
              }}
              className="flex items-center justify-center w-6 h-6 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-gray-300 hover:text-white transition-colors"
              title={`Decrease by ${actualArrowStep} (hold for fast)`}
            >
              <ChevronDown className="h-3 w-3" />
            </button>
            
            <div className="w-12 text-center">
              <span className="text-xs font-mono text-gray-300">{value}</span>
            </div>
            
            <button
              type="button"
              onClick={() => handleArrowClick('up')}
              onMouseDown={(e) => {
                e.preventDefault();
                let interval: NodeJS.Timeout;
                let timeout: NodeJS.Timeout;
                
                timeout = setTimeout(() => {
                  interval = setInterval(() => {
                    handleArrowClick('up', true);
                  }, 100);
                }, 500);
                
                const cleanup = () => {
                  clearTimeout(timeout);
                  clearInterval(interval);
                  document.removeEventListener('mouseup', cleanup);
                  document.removeEventListener('mouseleave', cleanup);
                };
                
                document.addEventListener('mouseup', cleanup);
                document.addEventListener('mouseleave', cleanup);
              }}
              className="flex items-center justify-center w-6 h-6 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-gray-300 hover:text-white transition-colors"
              title={`Increase by ${actualArrowStep} (hold for fast)`}
            >
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onMouseUp={onChangeComplete ? (e) => onChangeComplete(parseFloat(e.target.value)) : undefined}
        className="w-full bg-gray-800"
      />
      
      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
    </div>
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
        
        {/* FIXED: Environment renderer for different scene types */}
        <EnvironmentRenderer settings={safeSettings} />
        
        {/* FIXED: Scene Environment Manager - Full 3D environments */}
        <SceneEnvironmentManager settings={safeSettings} />
        
        {/* FIXED Camera Controls with Touch Interaction Support */}
        <CameraControls settings={safeSettings} photosWithPositions={photosWithPositions} />
        
        {/* FIXED: Textured Floor - Always show unless sphere environment */}
        {safeSettings.sceneEnvironment !== 'sphere' && (
          <TexturedFloor settings={safeSettings} />
        )}
        
        {/* FIXED: Grid - Only show for default environment */}
        {(!safeSettings.sceneEnvironment || safeSettings.sceneEnvironment === 'default') && 
         safeSettings.gridEnabled && (
          <Grid settings={safeSettings} />
        )}
        
        {/* Particle System - FIXED: Adjust particle positions for wave pattern */}
        {safeSettings.particles?.enabled && (
          <MilkyWayParticleSystem
            colorTheme={getCurrentParticleTheme(safeSettings)}
            intensity={safeSettings.particles?.intensity ?? 0.7}
            enabled={safeSettings.particles?.enabled ?? true}
            photoPositions={photosWithPositions.map(p => {
              // FIXED: For wave pattern, lower particle positions to floor level for better visibility
              if (safeSettings.animationPattern === 'wave') {
                return { 
                  position: [p.targetPosition[0], Math.max(p.targetPosition[1] - 20, -10), p.targetPosition[2]] as [number, number, number]
                };
              }
              return { position: p.targetPosition };
            })}
            floorSize={safeSettings.floorSize || 200}
            gridSize={safeSettings.gridSize || 200}
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
        
        {/* Enhanced Lighting */}
        <EnhancedLightingSystem settings={safeSettings} />
      </Canvas>
    </div>
  );
});

EnhancedCollageScene.displayName = 'EnhancedCollageScene';
export default EnhancedCollageScene;