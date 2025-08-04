// src/components/three/CameraAnimationController.tsx - FIXED VERSION
import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraAnimationConfig {
  enabled?: boolean;
  type: 'none' | 'orbit' | 'figure8' | 'centerRotate' | 'wave' | 'spiral';
  speed: number;
  radius: number;
  height: number;
  amplitude: number;
  frequency: number;
}

interface CameraAnimationControllerProps {
  config?: CameraAnimationConfig;
}

export const CameraAnimationController: React.FC<CameraAnimationControllerProps> = ({ config }) => {
  const { camera, controls } = useThree();
  const timeRef = useRef(0);
  const initialPositionRef = useRef(camera.position.clone());
  const userInteractingRef = useRef(false);
  const lastInteractionRef = useRef(0);
  const isActiveRef = useRef(false);

  // Store initial camera setup
  useEffect(() => {
    initialPositionRef.current = camera.position.clone();
  }, [camera]);

  // Detect user interaction with controls
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

    // Add event listeners for different control types
    if ('addEventListener' in controls) {
      controls.addEventListener('start', handleStart);
      controls.addEventListener('end', handleEnd);
      
      return () => {
        controls.removeEventListener('start', handleStart);
        controls.removeEventListener('end', handleEnd);
      };
    }
  }, [controls]);

  // Animation calculation functions
  const getAnimationPosition = (time: number, config: CameraAnimationConfig): THREE.Vector3 => {
    const t = time * (config.speed || 1);
    
    switch (config.type) {
      case 'orbit':
        return new THREE.Vector3(
          Math.cos(t) * (config.radius || 30),
          config.height || 15,
          Math.sin(t) * (config.radius || 30)
        );

      case 'figure8':
        // Perfect figure-8 pattern
        return new THREE.Vector3(
          Math.sin(t) * (config.radius || 30),
          (config.height || 15) + Math.sin(t * 2) * 3,
          Math.sin(t * 2) * (config.amplitude || 10)
        );

      case 'centerRotate':
        // Multi-phase center-focused rotation
        const cycleTime = 20;
        const phase = (t % cycleTime) / cycleTime;
        const angle = t * 2;
        
        let currentRadius: number;
        let currentHeight: number;
        
        if (phase < 0.3) {
          // Spiral inward
          const phaseT = phase / 0.3;
          currentRadius = (config.radius || 30) * (1 - phaseT * 0.7);
          currentHeight = (config.height || 15) + Math.sin(phaseT * Math.PI) * 5;
        } else if (phase < 0.7) {
          // Center rotation
          currentRadius = (config.radius || 30) * 0.3;
          currentHeight = (config.height || 15) * 0.8;
        } else {
          // Spiral outward
          const phaseT = (phase - 0.7) / 0.3;
          currentRadius = (config.radius || 30) * (0.3 + phaseT * 0.7);
          currentHeight = (config.height || 15) + Math.sin(phaseT * Math.PI) * 5;
        }
        
        return new THREE.Vector3(
          Math.cos(angle) * currentRadius,
          currentHeight,
          Math.sin(angle) * currentRadius
        );

      case 'wave':
        // Wave pattern with radius oscillation
        const waveRadius = (config.radius || 30) + Math.sin(t * (config.frequency || 0.5)) * (config.amplitude || 8);
        return new THREE.Vector3(
          Math.cos(t) * waveRadius,
          (config.height || 15) + Math.sin(t * (config.frequency || 0.5) * 2) * 3,
          Math.sin(t) * waveRadius
        );

      case 'spiral':
        // Expanding/contracting spiral with height variation
        const spiralMod = 1 + Math.sin(t * (config.frequency || 0.5)) * 0.4;
        return new THREE.Vector3(
          Math.cos(t * 2) * (config.radius || 30) * spiralMod,
          (config.height || 15) + Math.sin(t * (config.frequency || 0.5) * 0.5) * (config.amplitude || 8),
          Math.sin(t * 2) * (config.radius || 30) * spiralMod
        );

      default:
        return camera.position.clone();
    }
  };

  // Main animation frame update
  useFrame((state, delta) => {
    // Early return if no config or animation disabled
    if (!config || !config.enabled || config.type === 'none') {
      isActiveRef.current = false;
      return;
    }

    // Check if user recently interacted (pause animation for 3 seconds after interaction)
    const timeSinceInteraction = Date.now() - lastInteractionRef.current;
    const pauseAfterInteraction = 3000; // 3 seconds

    if (userInteractingRef.current || timeSinceInteraction < pauseAfterInteraction) {
      isActiveRef.current = false;
      return;
    }

    // Resume animation
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      // Smooth transition back to animation
      timeRef.current = Date.now() * 0.001;
    }

    // Update time
    timeRef.current += delta;

    // Calculate new position
    const targetPosition = getAnimationPosition(timeRef.current, config);
    
    // Smooth camera movement with lerp
    camera.position.lerp(targetPosition, 0.02);
    
    // Always look at center (0, 0, 0)
    camera.lookAt(0, 0, 0);
    
    // Update controls target if available
    if (controls && 'target' in controls) {
      (controls as any).target.set(0, 0, 0);
      (controls as any).update();
    }
  });

  // Debug logging
  useEffect(() => {
    if (config?.enabled && config.type !== 'none') {
      console.log('🎬 Camera Animation Started:', {
        type: config.type,
        speed: config.speed,
        radius: config.radius,
        height: config.height
      });
    }
  }, [config?.enabled, config?.type]);

  return null; // This component doesn't render anything visual
};

export default CameraAnimationController;