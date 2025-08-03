// src/components/three/EnvironmentRenderer.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnvironmentSettings {
  sceneEnvironment?: 'default' | 'cube' | 'sphere' | 'gallery' | 'studio';
  wallColor?: string;
  wallThickness?: number;
  ceilingEnabled?: boolean;
  ceilingHeight?: number;
  roomDepth?: number;
  floorSize?: number;
  floorColor?: string;
  sphereTextureUrl?: string;
  cubeTextureUrl?: string;
}

interface EnvironmentRendererProps {
  settings: EnvironmentSettings;
}

// Cube Room Environment
const CubeEnvironment: React.FC<{ settings: EnvironmentSettings }> = ({ settings }) => {
  const wallColor = settings.wallColor || settings.floorColor || '#3A3A3A';
  const wallThickness = settings.wallThickness || 2;
  const floorSize = settings.floorSize || 200;
  const ceilingHeight = settings.ceilingHeight || 100;
  const halfSize = floorSize / 2;

  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: wallColor,
    side: THREE.DoubleSide,
    metalness: 0.1,
    roughness: 0.8,
  }), [wallColor]);

  return (
    <group>
      {/* Back Wall */}
      <mesh position={[0, ceilingHeight/2 - 10, -halfSize]} material={wallMaterial}>
        <boxGeometry args={[floorSize, ceilingHeight, wallThickness]} />
      </mesh>

      {/* Front Wall (optional, can be removed for open front) */}
      <mesh position={[0, ceilingHeight/2 - 10, halfSize]} material={wallMaterial}>
        <boxGeometry args={[floorSize, ceilingHeight, wallThickness]} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-halfSize, ceilingHeight/2 - 10, 0]} material={wallMaterial}>
        <boxGeometry args={[wallThickness, ceilingHeight, floorSize]} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[halfSize, ceilingHeight/2 - 10, 0]} material={wallMaterial}>
        <boxGeometry args={[wallThickness, ceilingHeight, floorSize]} />
      </mesh>

      {/* Ceiling (if enabled) */}
      {settings.ceilingEnabled && (
        <mesh position={[0, ceilingHeight - 10, 0]} material={wallMaterial}>
          <boxGeometry args={[floorSize, wallThickness, floorSize]} />
        </mesh>
      )}
    </group>
  );
};

// Sphere Environment
const SphereEnvironment: React.FC<{ settings: EnvironmentSettings }> = ({ settings }) => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const radius = Math.max((settings.floorSize || 200) * 0.8, 150);
  const wallColor = settings.wallColor || settings.floorColor || '#1A1A2E';

  const sphereMaterial = useMemo(() => {
    if (settings.sphereTextureUrl) {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(settings.sphereTextureUrl);
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      
      return new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.BackSide, // Render on inside
        metalness: 0.1,
        roughness: 0.9,
      });
    }

    return new THREE.MeshStandardMaterial({
      color: wallColor,
      side: THREE.BackSide, // Render on inside
      metalness: 0.1,
      roughness: 0.9,
    });
  }, [wallColor, settings.sphereTextureUrl]);

  return (
    <mesh ref={sphereRef} material={sphereMaterial}>
      <sphereGeometry args={[radius, 64, 32]} />
    </mesh>
  );
};

// Gallery Environment
const GalleryEnvironment: React.FC<{ settings: EnvironmentSettings }> = ({ settings }) => {
  const wallColor = settings.wallColor || '#F5F5F5';
  const roomDepth = settings.roomDepth || settings.floorSize || 200;
  const wallHeight = 120;

  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: wallColor,
    side: THREE.DoubleSide,
    metalness: 0.0,
    roughness: 0.9,
  }), [wallColor]);

  const trackLightPositions = useMemo(() => {
    const positions = [];
    const trackCount = 3;
    const lightsPerTrack = 8;
    
    for (let track = 0; track < trackCount; track++) {
      const z = (track - 1) * roomDepth * 0.3;
      for (let light = 0; light < lightsPerTrack; light++) {
        const x = (light - lightsPerTrack/2 + 0.5) * (roomDepth / lightsPerTrack);
        positions.push([x, wallHeight - 20, z]);
      }
    }
    return positions;
  }, [roomDepth, wallHeight]);

  return (
    <group>
      {/* Gallery Walls */}
      <mesh position={[0, wallHeight/2 - 10, -roomDepth/2]} material={wallMaterial}>
        <boxGeometry args={[roomDepth * 1.5, wallHeight, 2]} />
      </mesh>
      
      <mesh position={[-roomDepth*0.75, wallHeight/2 - 10, 0]} material={wallMaterial}>
        <boxGeometry args={[2, wallHeight, roomDepth]} />
      </mesh>
      
      <mesh position={[roomDepth*0.75, wallHeight/2 - 10, 0]} material={wallMaterial}>
        <boxGeometry args={[2, wallHeight, roomDepth]} />
      </mesh>

      {/* Gallery Track Lighting */}
      {trackLightPositions.map((pos, i) => (
        <group key={i}>
          {/* Track Light Fixture */}
          <mesh position={pos as [number, number, number]}>
            <cylinderGeometry args={[0.5, 0.8, 2, 8]} />
            <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Spot Light */}
          <spotLight
            position={pos as [number, number, number]}
            target-position={[pos[0], -10, pos[2]]}
            intensity={2}
            angle={Math.PI / 6}
            penumbra={0.3}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
        </group>
      ))}
    </group>
  );
};

// Studio Environment with Curved Backdrop
const StudioEnvironment: React.FC<{ settings: EnvironmentSettings }> = ({ settings }) => {
  const backdropColor = settings.wallColor || '#E8E8E8';
  const studioSize = (settings.floorSize || 200) * 0.8;

  const backdropMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: backdropColor,
    side: THREE.DoubleSide,
    metalness: 0.0,
    roughness: 0.9,
  }), [backdropColor]);

  // Create curved backdrop geometry
  const backdropGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(
      studioSize, // radius top
      studioSize, // radius bottom  
      studioSize * 0.8, // height
      32, // radial segments
      1, // height segments
      true, // open ended
      0, // theta start
      Math.PI // theta length (half circle)
    );
    return geometry;
  }, [studioSize]);

  // Studio lighting positions (6-point lighting)
  const lightPositions = useMemo(() => [
    // Key light
    [studioSize * 0.3, studioSize * 0.4, studioSize * 0.5],
    // Fill light
    [-studioSize * 0.3, studioSize * 0.4, studioSize * 0.5],
    // Back light
    [0, studioSize * 0.6, -studioSize * 0.3],
    // Hair lights
    [studioSize * 0.2, studioSize * 0.8, 0],
    [-studioSize * 0.2, studioSize * 0.8, 0],
    // Background light
    [0, studioSize * 0.2, -studioSize * 0.8]
  ], [studioSize]);

  return (
    <group>
      {/* Curved Backdrop */}
      <mesh 
        geometry={backdropGeometry} 
        material={backdropMaterial}
        position={[0, studioSize * 0.2 - 10, -studioSize * 0.6]}
        rotation={[0, 0, 0]}
      />

      {/* Studio Lighting Rig */}
      {lightPositions.map((pos, i) => (
        <group key={i}>
          {/* Light Stand/Fixture */}
          <mesh position={pos as [number, number, number]}>
            <cylinderGeometry args={[0.3, 0.5, 1.5, 8]} />
            <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.1} />
          </mesh>
          
          {/* Studio Light */}
          <spotLight
            position={pos as [number, number, number]}
            target-position={[0, -5, 0]}
            intensity={i === 0 ? 3 : i === 1 ? 2 : 1.5} // Key light brightest
            angle={i < 2 ? Math.PI / 4 : Math.PI / 6} // Wider angle for key/fill
            penumbra={0.5}
            color="#ffffff"
            castShadow={i < 3} // Only first 3 lights cast shadows for performance
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
        </group>
      ))}
    </group>
  );
};

// Main Environment Renderer
const EnvironmentRenderer: React.FC<EnvironmentRendererProps> = ({ settings }) => {
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
      return null; // Default open space - just floor and optional grid
  }
};

export default EnvironmentRenderer;