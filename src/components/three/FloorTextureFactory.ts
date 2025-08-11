import * as THREE from 'three';

interface ExtendedSceneSettings {
  floorColor?: string;
  floorOpacity?: number;
  mirrorTileCount?: number;
  floorSize?: number;
  floorTexture?: string;
  floorMetalness?: number;
  floorRoughness?: number;
  floorReflectivity?: number;
}

export class FloorTextureFactory {
  // Create special mirror floor shader material - ENHANCED MIRRORED LED FLOOR
  static createMirrorFloorMaterial(settings: ExtendedSceneSettings): THREE.ShaderMaterial {
    // Create normal texture for surface scratches/details
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Generate normal map for glass surface scratches
    ctx.fillStyle = '#8080ff'; // Neutral normal color
    ctx.fillRect(0, 0, 512, 512);
    
    // Add random scratches
    ctx.strokeStyle = '#9090ff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, Math.random() * 512);
      ctx.bezierCurveTo(
        Math.random() * 512, Math.random() * 512,
        Math.random() * 512, Math.random() * 512,
        Math.random() * 512, Math.random() * 512
      );
      ctx.stroke();
    }
    
    const normalTexture = new THREE.CanvasTexture(canvas);
    normalTexture.wrapS = THREE.RepeatWrapping;
    normalTexture.wrapT = THREE.RepeatWrapping;
    normalTexture.repeat.set(4, 4);

    // Shader material inspired by the A-Frame infinite mirror effect
    return new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_tileCount: { value: settings.mirrorTileCount || 8.0 },
        u_normalTex: { value: normalTexture },
        u_floorColor: { value: new THREE.Color(settings.floorColor || '#003366') },
        u_opacity: { value: settings.floorOpacity || 0.8 },
        u_cameraPosition: { value: new THREE.Vector3() },
        u_lightPosition: { value: new THREE.Vector3(1.0, 4.0, 0.0) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform float u_tileCount;
        uniform sampler2D u_normalTex;
        uniform vec3 u_floorColor;
        uniform float u_opacity;
        uniform vec3 u_cameraPosition;
        uniform vec3 u_lightPosition;
        
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        // Enhanced noise function for LED patterns
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        // Fractal noise for complex patterns
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        // LED grid pattern with pulsing
        float ledPattern(vec2 uv, float time) {
          vec2 grid = fract(uv * u_tileCount) - 0.5;
          float dist = length(grid);
          
          // Create LED dots
          float led = smoothstep(0.4, 0.2, dist);
          
          // Add pulsing animation
          float pulse = sin(time * 0.003 + dot(uv, vec2(10.0, 10.0))) * 0.5 + 0.5;
          led *= (0.7 + pulse * 0.3);
          
          // Add traveling waves
          float wave1 = sin(uv.x * 20.0 + time * 0.002) * 0.5 + 0.5;
          float wave2 = sin(uv.y * 15.0 + time * 0.0015) * 0.5 + 0.5;
          led *= (0.8 + wave1 * wave2 * 0.2);
          
          return led;
        }
        
        // Infinite mirror reflection calculation
        vec3 calculateMirrorReflection(vec3 viewDir, vec3 normal, vec3 worldPos) {
          vec3 reflectDir = reflect(viewDir, normal);
          
          // Create infinite reflection effect
          float reflectionDepth = 10.0;
          vec3 reflectionPos = worldPos + reflectDir * reflectionDepth;
          
          // Add perspective distortion for depth
          float perspective = 1.0 / (1.0 + length(reflectionPos.xz) * 0.01);
          
          return reflectionPos * perspective;
        }
        
        void main() {
          vec2 tiledUv = vUv;
          
          // Sample normal map for surface details
          vec3 normalMap = texture2D(u_normalTex, tiledUv).rgb;
          vec3 perturbedNormal = normalize(vNormal + (normalMap - 0.5) * 0.1);
          
          // Calculate view direction
          vec3 viewDir = normalize(vViewPosition);
          
          // LED pattern calculation
          float ledIntensity = ledPattern(tiledUv, u_time);
          
          // Mirror reflection calculation
          vec3 mirrorReflection = calculateMirrorReflection(viewDir, perturbedNormal, vWorldPosition);
          
          // Create depth-based color variation
          float depth = length(vViewPosition);
          float depthFactor = 1.0 / (1.0 + depth * 0.02);
          
          // Base floor color with LED enhancement
          vec3 baseColor = u_floorColor;
          vec3 ledColor = baseColor * (1.0 + ledIntensity * 2.0);
          
          // Add mirror reflection tint
          float reflectionStrength = 0.6;
          vec3 reflectionColor = mix(baseColor, vec3(0.8, 0.9, 1.0), reflectionStrength);
          
          // Combine LED and reflection effects
          vec3 finalColor = mix(ledColor, reflectionColor, 0.4);
          
          // Add distance-based brightness falloff
          finalColor *= depthFactor;
          
          // Add subtle animated highlights
          float highlight = sin(u_time * 0.001 + vWorldPosition.x * 0.1 + vWorldPosition.z * 0.1) * 0.5 + 0.5;
          finalColor += highlight * 0.1;
          
          // Fresnel effect for realistic glass reflection
          float fresnel = pow(1.0 - dot(viewDir, perturbedNormal), 2.0);
          finalColor = mix(finalColor, vec3(1.0), fresnel * 0.3);
          
          gl_FragColor = vec4(finalColor, u_opacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }

  // Create standard floor materials for other texture types
  static createStandardFloorMaterial(settings: ExtendedSceneSettings): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: settings.floorColor || '#1A1A1A',
      metalness: settings.floorMetalness || 0.7,
      roughness: settings.floorRoughness || 0.2,
      transparent: true,
      opacity: settings.floorOpacity || 0.8,
      envMapIntensity: settings.floorReflectivity || 0.8,
    });
  }
}