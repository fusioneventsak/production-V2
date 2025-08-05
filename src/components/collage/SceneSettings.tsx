// src/components/collage/SceneSettings.tsx - COMPLETE with ALL Enhanced Features - FIXED MOUSE MOVEMENT ISSUE
import React from 'react';
import { type SceneSettings } from '../../store/sceneStore';
import { ChevronUp, ChevronDown, Grid, Palette, CameraIcon, ImageIcon, Square, Sun, Lightbulb, RotateCw, Move, Eye, Camera, Sparkles, Building, Cherry as Sphere, GalleryVertical as Gallery, BookAudio as Studio, Home, Layers, Video, Play, Target, Clock, Zap, Settings, ArrowUp, ArrowRight, TrendingUp, Maximize, Ratio, Hash, Ruler } from 'lucide-react';
import { PARTICLE_THEMES } from '../three/MilkyWayParticleSystem';

// Extended settings interface for new features
interface ExtendedSceneSettings extends SceneSettings {
  sceneEnvironment?: 'default' | 'cube' | 'sphere' | 'gallery' | 'studio';
  floorTexture?: 'solid' | 'marble' | 'wood' | 'concrete' | 'metal' | 'glass' | 'checkerboard' | 'custom';
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
  
  // Enhanced Auto-Rotate Camera Settings
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
  
  // ENHANCED: Cinematic Camera Settings with Fine-Tuning Controls + FIXED INTERACTION DETECTION + SMOOTH RESUME
  cameraAnimation?: {
    enabled?: boolean;
    type: 'none' | 'showcase' | 'gallery_walk' | 'spiral_tour' | 'wave_follow' | 'grid_sweep' | 'photo_focus';
    speed: number;
    focusDistance: number;
    heightOffset: number;
    transitionTime: number;
    pauseTime: number;
    randomization: number;
    // FIXED: Interaction detection settings
    interactionSensitivity?: 'low' | 'medium' | 'high'; // How sensitive to user interactions
    ignoreMouseMovement?: boolean; // NEW: Ignore pure mouse movement without clicks
    mouseMoveThreshold?: number; // Pixels of movement before considering interaction
    resumeDelay?: number; // How long to wait after interaction before resuming
    // NEW: Smooth resume behavior
    enableManualControl?: boolean; // Allow full manual control during pause
    resumeFromCurrentPosition?: boolean; // Resume animation from where user left the camera
    blendDuration?: number; // How long to smoothly transition back to animation
    preserveUserDistance?: boolean; // Keep user's zoom level when resuming
    preserveUserHeight?: boolean; // Keep user's height when resuming
    // NEW: Fine-tuning controls
    baseHeight?: number;        // Base camera height for all animations
    baseDistance?: number;      // Base distance from center for all animations
    heightVariation?: number;   // How much height varies during animation
    distanceVariation?: number; // How much distance varies during animation
  };
}

// Helper function for cinematic camera descriptions (fallback if not imported)
const getCinematicCameraTypeDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    'showcase': 'Automatically showcases different photo groups with smooth transitions',
    'gallery_walk': 'Simulates walking through a gallery space',
    'grid_sweep': 'Sweeps across the grid in organized patterns',
    'spiral_tour': 'Spirals around the scene for dynamic viewing',
    'wave_follow': 'Follows wave patterns for fluid movement',
    'photo_focus': 'Focuses on individual photos with artistic framing'
  };
  return descriptions[type] || 'Advanced camera movement for showcasing photos';
};

const EnhancedSceneSettings: React.FC<{
  settings: ExtendedSceneSettings;
  onSettingsChange: (settings: Partial<ExtendedSceneSettings>, debounce?: boolean) => void;
  onReset: () => void;
}> = ({ settings, onSettingsChange, onReset }) => {
  
  // Helper function to update grid pattern settings
  const updateGridSettings = (gridUpdates: Partial<ExtendedSceneSettings['patterns']['grid']>) => {
    onSettingsChange({
      patterns: {
        ...settings.patterns,
        grid: {
          ...settings.patterns?.grid,
          ...gridUpdates
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Scene Environment Section */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Building className="h-4 w-4 mr-2" />
          Scene Environment
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Environment Type</label>
            <select
              value={settings.sceneEnvironment || 'default'}
              onChange={(e) => onSettingsChange({ 
                sceneEnvironment: e.target.value as ExtendedSceneSettings['sceneEnvironment']
              })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
            >
              <option value="default">🌌 Open Space (Default)</option>
              <option value="cube">🏠 Cube Room</option>
              <option value="sphere">🌍 Sphere Interior</option>
              <option value="gallery">🖼️ Art Gallery</option>
              <option value="studio">📸 Photo Studio</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">
              {settings.sceneEnvironment === 'cube' && "Enclosed room with walls and optional ceiling"}
              {settings.sceneEnvironment === 'sphere' && "Immersive 360° spherical environment"}
              {settings.sceneEnvironment === 'gallery' && "Professional gallery with track lighting"}
              {settings.sceneEnvironment === 'studio' && "Photography studio with curved backdrop"}
              {(!settings.sceneEnvironment || settings.sceneEnvironment === 'default') && "Open space with floor and optional grid"}
            </p>
          </div>

          {/* Cube Environment Settings */}
          {settings.sceneEnvironment === 'cube' && (
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-3">
              <h5 className="text-xs font-medium text-gray-300">Cube Room Settings</h5>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Wall Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={settings.wallColor || settings.floorColor || '#3A3A3A'}
                    onChange={(e) => onSettingsChange({ wallColor: e.target.value }, true)}
                    className="w-full h-8 rounded cursor-pointer bg-gray-800"
                  />
                  <select
                    onChange={(e) => onSettingsChange({ wallColor: e.target.value }, true)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 text-white text-xs"
                  >
                    <option value="">Presets</option>
                    <option value="#8B4513">🟤 Saddle Brown</option>
                    <option value="#A0522D">🟤 Sienna</option>
                    <option value="#CD853F">🟤 Peru</option>
                    <option value="#D2691E">🟠 Chocolate</option>
                    <option value="#BC8F8F">🟤 Rosy Brown</option>
                    <option value="#F4A460">🟤 Sandy Brown</option>
                    <option value="#DEB887">🟤 Burlywood</option>
                    <option value="#D2B48C">🟤 Tan</option>
                    <option value="#8FBC8F">🟢 Dark Sea Green</option>
                    <option value="#9ACD32">🟢 Yellow Green</option>
                    <option value="#6B8E23">🟢 Olive Drab</option>
                    <option value="#228B22">🟢 Forest Green</option>
                    <option value="#2F4F4F">🔘 Dark Slate Gray</option>
                    <option value="#696969">🔘 Dim Gray</option>
                    <option value="#708090">🔘 Slate Gray</option>
                    <option value="#F5F5DC">🟡 Beige</option>
                    <option value="#FFFAF0">🟡 Floral White</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Wall Thickness
                  <span className="ml-2 text-xs text-gray-400">{settings.wallThickness || 2} units</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={settings.wallThickness || 2}
                  onChange={(e) => onSettingsChange({ wallThickness: parseFloat(e.target.value) }, true)}
                  className="w-full bg-gray-800"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.ceilingEnabled || false}
                  onChange={(e) => onSettingsChange({ ceilingEnabled: e.target.checked })}
                  className="mr-2 bg-gray-800 border-gray-700"
                />
                <label className="text-sm text-gray-300">Add Ceiling</label>
              </div>

              {settings.ceilingEnabled && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Ceiling Height
                    <span className="ml-2 text-xs text-gray-400">{settings.ceilingHeight || 100} units</span>
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="150"
                    step="5"
                    value={settings.ceilingHeight || 100}
                    onChange={(e) => onSettingsChange({ ceilingHeight: parseFloat(e.target.value) }, true)}
                    className="w-full bg-gray-800"
                  />
                </div>
              )}
            </div>
          )}

          {/* Sphere Environment Settings */}
          {settings.sceneEnvironment === 'sphere' && (
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-3">
              <h5 className="text-xs font-medium text-gray-300">Sphere Settings</h5>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Sphere Interior Color</label>
                <input
                  type="color"
                  value={settings.wallColor || settings.floorColor || '#1A1A2E'}
                  onChange={(e) => onSettingsChange({ wallColor: e.target.value }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Custom Sphere Texture URL</label>
                <input
                  type="url"
                  value={settings.sphereTextureUrl || ''}
                  onChange={(e) => onSettingsChange({ sphereTextureUrl: e.target.value }, true)}
                  placeholder="https://example.com/360-panorama.jpg"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-sm"
                />
              </div>
            </div>
          )}

          {/* Gallery Environment Settings */}
          {settings.sceneEnvironment === 'gallery' && (
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-3">
              <h5 className="text-xs font-medium text-gray-300">Gallery Settings</h5>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Gallery Wall Color</label>
                <input
                  type="color"
                  value={settings.wallColor || '#F5F5F5'}
                  onChange={(e) => onSettingsChange({ wallColor: e.target.value }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Room Depth
                  <span className="ml-2 text-xs text-gray-400">{settings.roomDepth || settings.floorSize || 200} units</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="400"
                  step="20"
                  value={settings.roomDepth || settings.floorSize || 200}
                  onChange={(e) => onSettingsChange({ roomDepth: parseFloat(e.target.value) }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
            </div>
          )}

          {/* Studio Environment Settings */}
          {settings.sceneEnvironment === 'studio' && (
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-3">
              <h5 className="text-xs font-medium text-gray-300">Studio Settings</h5>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Backdrop Color</label>
                <input
                  type="color"
                  value={settings.wallColor || '#E8E8E8'}
                  onChange={(e) => onSettingsChange({ wallColor: e.target.value }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animation Controls */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Move className="h-4 w-4 mr-2" />
          Animation
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.animationEnabled}
              onChange={(e) => onSettingsChange({ 
                animationEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Enable Animations
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Animation Pattern
            </label>
            <select
              value={settings.animationPattern}
              onChange={(e) => onSettingsChange({ 
                animationPattern: e.target.value as 'float' | 'wave' | 'spiral' | 'grid' 
              })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
            >
              <option value="grid">Grid Wall</option>
              <option value="float">Float</option>
              <option value="wave">Wave</option>
              <option value="spiral">Spiral</option>
            </select>
          </div>
          
          {settings.animationEnabled && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                <div className="flex items-center justify-between">
                  <span>Default Photo Count</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onSettingsChange({ photoCount: Math.max(5, (settings.photoCount || 50) - 1) })}
                      className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
                      title="Decrease by 1"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onSettingsChange({ photoCount: Math.min(500, (settings.photoCount || 50) + 1) })}
                      className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition-colors"
                      title="Increase by 1"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <span className="ml-2 text-xs text-gray-400">
                  {settings.animationSpeed}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={settings.animationSpeed}
                onChange={(e) => onSettingsChange({ 
                  animationSpeed: parseFloat(e.target.value) 
                }, true)}
                className="w-full bg-gray-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* ENHANCED: Grid Wall Specific Settings */}
      {settings.animationPattern === 'grid' && (
        <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-700/50 rounded-lg p-4">
          <h4 className="flex items-center text-sm font-medium text-green-200 mb-4">
            <Grid className="h-4 w-4 mr-2" />
            🧱 Grid Wall Settings
          </h4>
          
          <div className="space-y-5">
            {/* Photo Count for Grid */}
            <div>
              <label className="block text-sm text-green-300 mb-2">
                <Hash className="h-3 w-3 inline mr-1" />
                Grid Photo Count
                <span className="ml-2 text-xs text-green-400">{settings.patterns?.grid?.photoCount || settings.photoCount || 50} photos</span>
              </label>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={settings.patterns?.grid?.photoCount || settings.photoCount || 50}
                onChange={(e) => updateGridSettings({ photoCount: parseInt(e.target.value) })}
                className="w-full bg-gray-800"
              />
              <p className="mt-1 text-xs text-green-400/80">
                Number of photos displayed in the grid wall pattern
              </p>
            </div>

            {/* Wall Height */}
            <div>
              <label className="block text-sm text-green-300 mb-2">
                <ArrowUp className="h-3 w-3 inline mr-1" />
                Wall Height
                <span className="ml-2 text-xs text-green-400">{(settings.patterns?.grid?.wallHeight || 0).toFixed(1)} units</span>
              </label>
              <input
                type="range"
                min="-10"
                max="30"
                step="0.5"
                value={settings.patterns?.grid?.wallHeight || 0}
                onChange={(e) => updateGridSettings({ wallHeight: parseFloat(e.target.value) })}
                className="w-full bg-gray-800"
              />
              <p className="mt-1 text-xs text-green-400/80">
                Vertical position of the photo wall (negative = below ground, positive = above ground)
              </p>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-sm text-green-300 mb-2">
                <Ratio className="h-3 w-3 inline mr-1" />
                Grid Aspect Ratio
                <span className="ml-2 text-xs text-green-400">{(settings.patterns?.grid?.aspectRatio || 1.0).toFixed(2)}</span>
              </label>
              <div className="space-y-2">
                {/* Quick presets */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateGridSettings({ aspectRatio: 1.0 })}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      Math.abs((settings.patterns?.grid?.aspectRatio || 1.0) - 1.0) < 0.01
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    1:1 Square
                  </button>
                  <button
                    onClick={() => updateGridSettings({ aspectRatio: 1.33333 })}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      Math.abs((settings.patterns?.grid?.aspectRatio || 1.0) - 1.33333) < 0.01
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    4:3 Classic
                  </button>
                  <button
                    onClick={() => updateGridSettings({ aspectRatio: 1.77778 })}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      Math.abs((settings.patterns?.grid?.aspectRatio || 1.0) - 1.77778) < 0.01
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    16:9 Wide
                  </button>
                  <button
                    onClick={() => updateGridSettings({ aspectRatio: 2.33333 })}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      Math.abs((settings.patterns?.grid?.aspectRatio || 1.0) - 2.33333) < 0.01
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    21:9 Ultra
                  </button>
                </div>
                {/* Fine adjustment slider */}
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.01"
                  value={settings.patterns?.grid?.aspectRatio || 1.0}
                  onChange={(e) => updateGridSettings({ aspectRatio: parseFloat(e.target.value) })}
                  className="w-full bg-gray-800"
                />
              </div>
              <p className="mt-1 text-xs text-green-400/80">
                Controls grid layout: higher values = wider walls, lower values = taller walls
              </p>
            </div>

            {/* Photo Spacing */}
            <div>
              <label className="block text-sm text-green-300 mb-2">
                <Ruler className="h-3 w-3 inline mr-1" />
                Photo Spacing
                <span className="ml-2 text-xs text-green-400">
                  {(settings.patterns?.grid?.spacing || 0) === 0 
                    ? 'Solid Wall' 
                    : `${((settings.patterns?.grid?.spacing || 0) * 200).toFixed(0)}% gaps`
                  }
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.patterns?.grid?.spacing || 0}
                onChange={(e) => updateGridSettings({ spacing: parseFloat(e.target.value) })}
                className="w-full bg-gray-800"
              />
              <div className="mt-2 space-y-1">
                <p className="text-xs text-green-400/80">
                  {(settings.patterns?.grid?.spacing || 0) === 0 && '🧱 Edge-to-edge solid wall (no gaps)'}
                  {(settings.patterns?.grid?.spacing || 0) > 0 && (settings.patterns?.grid?.spacing || 0) < 0.3 && '📐 Small gaps between photos'}
                  {(settings.patterns?.grid?.spacing || 0) >= 0.3 && (settings.patterns?.grid?.spacing || 0) < 0.7 && '🎯 Medium gaps between photos'}
                  {(settings.patterns?.grid?.spacing || 0) >= 0.7 && '🌌 Large gaps between photos'}
                </p>
                {(settings.patterns?.grid?.spacing || 0) > 0 && (
                  <p className="text-xs text-green-500/60">
                    ✨ Spacing enables subtle wave animations when animation is turned on
                  </p>
                )}
              </div>
            </div>

            {/* Grid Pattern Summary */}
            <div className="bg-green-800/20 p-3 rounded border border-green-600/30">
              <p className="text-xs text-green-300 font-medium mb-1">📊 Grid Layout Preview</p>
              <div className="text-xs text-green-400/90 space-y-1">
                <p>• Photos: {settings.patterns?.grid?.photoCount || settings.photoCount || 50}</p>
                <p>• Columns: {Math.ceil(Math.sqrt((settings.patterns?.grid?.photoCount || settings.photoCount || 50) * (settings.patterns?.grid?.aspectRatio || 1.0)))}</p>
                <p>• Rows: {Math.ceil((settings.patterns?.grid?.photoCount || settings.photoCount || 50) / Math.ceil(Math.sqrt((settings.patterns?.grid?.photoCount || settings.photoCount || 50) * (settings.patterns?.grid?.aspectRatio || 1.0))))}</p>
                <p>• Style: {(settings.patterns?.grid?.spacing || 0) === 0 ? 'Solid Wall' : 'Spaced Grid'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pattern-Specific Settings for Other Patterns */}
      {settings.animationPattern === 'float' && (
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-700/50 rounded-lg p-4">
          <h4 className="flex items-center text-sm font-medium text-purple-200 mb-3">
            <Square className="h-4 w-4 mr-2" />
            🎈 Float Pattern Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-purple-300 mb-2">
                Float Photo Count
                <span className="ml-2 text-xs text-purple-400">{settings.patterns?.float?.photoCount || 100} photos</span>
              </label>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={settings.patterns?.float?.photoCount || 100}
                onChange={(e) => onSettingsChange({
                  patterns: {
                    ...settings.patterns,
                    float: {
                      ...settings.patterns?.float,
                      photoCount: parseInt(e.target.value)
                    }
                  }
                })}
                className="w-full bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm text-purple-300 mb-2">
                Float Height
                <span className="ml-2 text-xs text-purple-400">{settings.patterns?.float?.height || 30} units</span>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={settings.patterns?.float?.height || 30}
                onChange={(e) => onSettingsChange({
                  patterns: {
                    ...settings.patterns,
                    float: {
                      ...settings.patterns?.float,
                      height: parseFloat(e.target.value)
                    }
                  }
                }, true)}
                className="w-full bg-gray-800"
              />
              <p className="mt-1 text-xs text-purple-400/80">
                Maximum height photos will float to before recycling
              </p>
            </div>
            
            <div>
              <label className="block text-sm text-purple-300 mb-2">
                Spread Distance
                <span className="ml-2 text-xs text-purple-400">{settings.patterns?.float?.spread || 25} units</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={settings.patterns?.float?.spread || 25}
                onChange={(e) => onSettingsChange({
                  patterns: {
                    ...settings.patterns,
                    float: {
                      ...settings.patterns?.float,
                      spread: parseFloat(e.target.value)
                    }
                  }
                }, true)}
                className="w-full bg-gray-800"
              />
              <p className="mt-1 text-xs text-purple-400/80">
                How far apart photos are spread horizontally
              </p>
            </div>
          </div>
        </div>
      )}

      {settings.animationPattern === 'wave' && (
        <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-700/50 rounded-lg p-4">
          <h4 className="flex items-center text-sm font-medium text-blue-200 mb-3">
            <Move className="h-4 w-4 mr-2" />
            🌊 Wave Pattern Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-blue-300 mb-2">
                Wave Photo Count
                <span className="ml-2 text-xs text-blue-400">{settings.patterns?.wave?.photoCount || 75} photos</span>
              </label>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={settings.patterns?.wave?.photoCount || 75}
                onChange={(e) => onSettingsChange({
                  patterns: {
                    ...settings.patterns,
                    wave: {
                      ...settings.patterns?.wave,
                      photoCount: parseInt(e.target.value)
                    }
                  }
                })}
                className="w-full bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm text-blue-300 mb-2">
                Wave Amplitude
                <span className="ml-2 text-xs text-blue-400">{settings.patterns?.wave?.amplitude || 15} units</span>
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={settings.patterns?.wave?.amplitude || 15}
                onChange={(e) => onSettingsChange({
                  patterns: {
                    ...settings.patterns,
                    wave: {
                      ...settings.patterns?.wave,
                      amplitude: parseFloat(e.target.value)
                    }
                  }
                }, true)}
                className="w-full bg-gray-800"
              />
              <p className="mt-1 text-xs text-blue-400/80">
                Height of the wave motion
              </p>
            </div>

            <div>
              <label className="block text-sm text-blue-300 mb-2">
                Wave Frequency
                <span className="ml-2 text-xs text-blue-400">{(settings.patterns?.wave?.frequency || 0.3).toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={settings.patterns?.wave?.frequency || 0.3}
                onChange={(e) => onSettingsChange({
                  patterns: {
                    ...settings.patterns,
                    wave: {
                      ...settings.patterns?.wave,
                      frequency: parseFloat(e.target.value)
                    }
                  }
                }, true)}
                className="w-full bg-gray-800"
              />
              <p className="mt-1 text-xs text-blue-400/80">
                How tight the wave ripples are
              </p>
            </div>
          </div>
        </div>
      )}

      {settings.animationPattern === 'spiral' && (
        <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-700/50 rounded-lg p-4">
          <h4 className="flex items-center text-sm font-medium text-orange-200 mb-3">
            <RotateCw className="h-4 w-4 mr-2" />
            🌀 Spiral Pattern Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-orange-300 mb-2">
                Spiral Photo Count
                <span className="ml-2 text-xs text-orange-400">{settings.patterns?.spiral?.photoCount || 150} photos</span>
              </label>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={settings.patterns?.spiral?.photoCount || 150}
                onChange={(e) => onSettingsChange({
                  patterns: {
                    ...settings.patterns,
                    spiral: {
                      ...settings.patterns?.spiral,
                      photoCount: parseInt(e.target.value)
                    }
                  }
                })}
                className="w-full bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm text-orange-300 mb-2">
                Spiral Radius
                <span className="ml-2 text-xs text-orange-400">{settings.patterns?.spiral?.radius || 15} units</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={settings.patterns?.spiral?.radius || 15}
                onChange={(e) => onSettingsChange({
                  patterns: {
                    ...settings.patterns,
                    spiral: {
                      ...settings.patterns?.spiral,
                      radius: parseFloat(e.target.value)
                    }
                  }
                }, true)}
                className="w-full bg-gray-800"
              />
              <p className="mt-1 text-xs text-orange-400/80">
                Base radius of the spiral
              </p>
            </div>

            <div>
              <label className="block text-sm text-orange-300 mb-2">
                Height Step
                <span className="ml-2 text-xs text-orange-400">{(settings.patterns?.spiral?.heightStep || 0.5).toFixed(1)} units</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={settings.patterns?.spiral?.heightStep || 0.5}
                onChange={(e) => onSettingsChange({
                  patterns: {
                    ...settings.patterns,
                    spiral: {
                      ...settings.patterns?.spiral,
                      heightStep: parseFloat(e.target.value)
                    }
                  }
                }, true)}
                className="w-full bg-gray-800"
              />
              <p className="mt-1 text-xs text-orange-400/80">
                Height increase per spiral turn
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED: Cinematic Camera Controls with FIXED INTERACTION DETECTION */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <h4 className="flex items-center text-sm font-medium text-blue-200 mb-3">
          <Video className="h-4 w-4 mr-2" />
          🎬 Cinematic Camera (Enhanced + Fixed!)
        </h4>
        
        <div className="space-y-4">
          {/* First ensure basic camera is enabled */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.cameraEnabled !== false}
              onChange={(e) => onSettingsChange({ 
                cameraEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-blue-200">
              Enable Camera Controls
            </label>
          </div>

          {settings.cameraEnabled !== false && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.cameraAnimation?.enabled || false}
                  onChange={(e) => onSettingsChange({ 
                    cameraAnimation: { 
                      ...settings.cameraAnimation, 
                      enabled: e.target.checked 
                    }
                  })}
                  className="mr-2 bg-gray-800 border-gray-700"
                />
                <label className="text-sm text-blue-200">
                  Enable Smart Photo Showcase
                </label>
              </div>

              {settings.cameraAnimation?.enabled && (
                <>
                  <div>
                    <label className="block text-sm text-blue-300 mb-2">Camera Tour Type</label>
                    <select
                      value={settings.cameraAnimation?.type || 'showcase'}
                      onChange={(e) => onSettingsChange({ 
                        cameraAnimation: { 
                          ...settings.cameraAnimation, 
                          type: e.target.value as any 
                        }
                      })}
                      className="w-full bg-gray-800 border border-blue-700 rounded-md py-2 px-3 text-white"
                    >
                      <option value="showcase">Smart Showcase (Recommended)</option>
                      <option value="gallery_walk">Gallery Walk</option>
                      <option value="grid_sweep">Grid Sweep</option>
                      <option value="spiral_tour">Spiral Tour</option>
                      <option value="wave_follow">Wave Follower</option>
                      <option value="photo_focus">Photo Focus</option>
                    </select>
                    <p className="text-xs text-blue-400 mt-1">
                      {getCinematicCameraTypeDescription(settings.cameraAnimation?.type || 'showcase')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-blue-300 mb-1">
                        <Zap className="h-3 w-3 inline mr-1" />
                        Speed: {settings.cameraAnimation?.speed?.toFixed(1) || '1.0'}x
                      </label>
                      <input
                        type="range"
                        min="0.2"
                        max="3.0"
                        step="0.1"
                        value={settings.cameraAnimation?.speed || 1.0}
                        onChange={(e) => onSettingsChange({ 
                          cameraAnimation: { 
                            ...settings.cameraAnimation, 
                            speed: parseFloat(e.target.value) 
                          }
                        })}
                        className="w-full bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-blue-300 mb-1">
                        <Target className="h-3 w-3 inline mr-1" />
                        Focus: {settings.cameraAnimation?.focusDistance?.toFixed(0) || '12'}
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="25"
                        step="1"
                        value={settings.cameraAnimation?.focusDistance || 12}
                        onChange={(e) => onSettingsChange({ 
                          cameraAnimation: { 
                            ...settings.cameraAnimation, 
                            focusDistance: parseFloat(e.target.value) 
                          }
                        })}
                        className="w-full bg-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-blue-300 mb-2">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Pause Time: {settings.cameraAnimation?.pauseTime?.toFixed(1) || '1.5'}s
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="5.0"
                      step="0.5"
                      value={settings.cameraAnimation?.pauseTime || 1.5}
                      onChange={(e) => onSettingsChange({ 
                        cameraAnimation: { 
                          ...settings.cameraAnimation, 
                          pauseTime: parseFloat(e.target.value) 
                        }
                      })}
                      className="w-full bg-gray-800"
                    />
                    <p className="text-xs text-blue-400 mt-1">
                      Time to pause and showcase each photo group
                    </p>
                  </div>

                  {/* ENHANCED: Interaction Detection & Manual Control */}
                  <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center text-sm font-medium text-red-200 mb-2">
                      <Settings className="h-4 w-4 mr-2" />
                      🎮 Manual Control & Interaction Settings (ENHANCED!)
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.cameraAnimation?.enableManualControl !== false}
                          onChange={(e) => onSettingsChange({ 
                            cameraAnimation: { 
                              ...settings.cameraAnimation, 
                              enableManualControl: e.target.checked 
                            }
                          })}
                          className="mr-2 bg-gray-800 border-gray-700"
                        />
                        <label className="text-sm text-red-200">
                          🎯 Enable Full Manual Control During Pause
                        </label>
                      </div>
                      <p className="text-xs text-red-300/80 ml-6">
                        When enabled, you can rotate, zoom, and move the camera freely when animation pauses
                      </p>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.cameraAnimation?.resumeFromCurrentPosition !== false}
                          onChange={(e) => onSettingsChange({ 
                            cameraAnimation: { 
                              ...settings.cameraAnimation, 
                              resumeFromCurrentPosition: e.target.checked 
                            }
                          })}
                          className="mr-2 bg-gray-800 border-gray-700"
                        />
                        <label className="text-sm text-red-200">
                          📍 Resume Animation From Current Position (Recommended ✅)
                        </label>
                      </div>
                      <p className="text-xs text-red-300/80 ml-6">
                        Animation smoothly continues from where you moved the camera, instead of jumping back to original path
                      </p>

                      <div>
                        <label className="block text-sm text-red-300 mb-2">
                          Smooth Transition Duration: {settings.cameraAnimation?.blendDuration?.toFixed(1) || '2.0'}s
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="5.0"
                          step="0.5"
                          value={settings.cameraAnimation?.blendDuration || 2.0}
                          onChange={(e) => onSettingsChange({ 
                            cameraAnimation: { 
                              ...settings.cameraAnimation, 
                              blendDuration: parseFloat(e.target.value) 
                            }
                          })}
                          className="w-full bg-gray-800"
                        />
                        <p className="text-xs text-red-300/80 mt-1">
                          How long it takes to smoothly blend from your position back to the animation path
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.cameraAnimation?.preserveUserDistance !== false}
                            onChange={(e) => onSettingsChange({ 
                              cameraAnimation: { 
                                ...settings.cameraAnimation, 
                                preserveUserDistance: e.target.checked 
                              }
                            })}
                            className="mr-2 bg-gray-800 border-gray-700"
                          />
                          <label className="text-xs text-red-200">
                            🔍 Keep Zoom Level
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.cameraAnimation?.preserveUserHeight !== false}
                            onChange={(e) => onSettingsChange({ 
                              cameraAnimation: { 
                                ...settings.cameraAnimation, 
                                preserveUserHeight: e.target.checked 
                              }
                            })}
                            className="mr-2 bg-gray-800 border-gray-700"
                          />
                          <label className="text-xs text-red-200">
                            📏 Keep Height Level
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-red-300/70">
                        These options preserve your manual adjustments when animation resumes
                      </p>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.cameraAnimation?.ignoreMouseMovement !== false}
                          onChange={(e) => onSettingsChange({ 
                            cameraAnimation: { 
                              ...settings.cameraAnimation, 
                              ignoreMouseMovement: e.target.checked 
                            }
                          })}
                          className="mr-2 bg-gray-800 border-gray-700"
                        />
                        <label className="text-sm text-red-200">
                          🚫 Ignore Mouse Movement (Recommended ✅)
                        </label>
                      </div>
                      <p className="text-xs text-red-300/80 ml-6">
                        Only clicks/drags pause the camera - mouse movement over the scene won't interrupt
                      </p>

                      <div>
                        <label className="block text-sm text-red-300 mb-2">
                          Interaction Sensitivity
                        </label>
                        <select
                          value={settings.cameraAnimation?.interactionSensitivity || 'medium'}
                          onChange={(e) => onSettingsChange({ 
                            cameraAnimation: { 
                              ...settings.cameraAnimation, 
                              interactionSensitivity: e.target.value as 'low' | 'medium' | 'high'
                            }
                          })}
                          className="w-full bg-gray-800 border border-red-700 rounded-md py-2 px-3 text-white"
                        >
                          <option value="low">🐌 Low - Only major interactions pause</option>
                          <option value="medium">⚖️ Medium - Standard sensitivity</option>
                          <option value="high">⚡ High - Any touch pauses</option>
                        </select>
                        <p className="text-xs text-red-300/80 mt-1">
                          Controls how much user input is needed to pause the cinematic camera
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm text-red-300 mb-2">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Resume Delay: {settings.cameraAnimation?.resumeDelay?.toFixed(1) || '2.0'}s
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="10.0"
                          step="0.5"
                          value={settings.cameraAnimation?.resumeDelay || 2.0}
                          onChange={(e) => onSettingsChange({ 
                            cameraAnimation: { 
                              ...settings.cameraAnimation, 
                              resumeDelay: parseFloat(e.target.value) 
                            }
                          })}
                          className="w-full bg-gray-800"
                        />
                        <p className="text-xs text-red-300/80 mt-1">
                          How long to wait after interaction ends before resuming cinematic camera
                        </p>
                      </div>

                      {!settings.cameraAnimation?.ignoreMouseMovement && (
                        <div>
                          <label className="block text-sm text-red-300 mb-2">
                            Mouse Move Threshold: {settings.cameraAnimation?.mouseMoveThreshold || 50}px
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="200"
                            step="10"
                            value={settings.cameraAnimation?.mouseMoveThreshold || 50}
                            onChange={(e) => onSettingsChange({ 
                              cameraAnimation: { 
                                ...settings.cameraAnimation, 
                                mouseMoveThreshold: parseFloat(e.target.value) 
                              }
                            }, true)}
                            className="w-full bg-gray-800"
                          />
                          <p className="text-xs text-red-300/80 mt-1">
                            How much mouse movement triggers interaction detection (when not ignored)
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-green-800/20 p-3 rounded border border-green-600/30">
                      <p className="text-xs text-green-300 font-medium mb-1">🎯 PERFECT MANUAL CONTROL:</p>
                      <p className="text-xs text-green-400/90">
                        With these settings, you can <strong>interact freely</strong> with the scene during cinematic mode. 
                        The camera will pause, let you explore, then <strong>smoothly resume</strong> from your new position!
                        <br />
                        <strong>✨ Best Experience:</strong> Enable all recommended settings above for seamless control.
                      </p>
                    </div>
                  </div>

                  {/* Fine-Tuning Controls Section */}
                  <div className="bg-blue-800/30 border border-blue-600/30 rounded-lg p-4 space-y-4">
                    <div className="flex items-center text-sm font-medium text-blue-200 mb-2">
                      <Settings className="h-4 w-4 mr-2" />
                      🎛️ Fine-Tuning Controls
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-blue-300 mb-1">
                          <ArrowUp className="h-3 w-3 inline mr-1" />
                          Base Height: {settings.cameraAnimation?.baseHeight?.toFixed(0) || 'Auto'}
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="80"
                          step="2"
                          value={settings.cameraAnimation?.baseHeight || 25}
                          onChange={(e) => onSettingsChange({ 
                            cameraAnimation: { 
                              ...settings.cameraAnimation, 
                              baseHeight: parseFloat(e.target.value) 
                            }
                          })}
                          className="w-full bg-gray-800"
                        />
                        <p className="text-xs text-blue-400/80 mt-1">Base camera height for all movements</p>
                      </div>

                      <div>
                        <label className="block text-sm text-blue-300 mb-1">
                          <ArrowRight className="h-3 w-3 inline mr-1" />
                          Base Distance: {settings.cameraAnimation?.baseDistance?.toFixed(0) || 'Auto'}
                        </label>
                        <input
                          type="range"
                          min="15"
                          max="100"
                          step="2"
                          value={settings.cameraAnimation?.baseDistance || 35}
                          onChange={(e) => onSettingsChange({ 
                            cameraAnimation: { 
                              ...settings.cameraAnimation, 
                              baseDistance: parseFloat(e.target.value) 
                            }
                          })}
                          className="w-full bg-gray-800"
                        />
                        <p className="text-xs text-blue-400/80 mt-1">Base distance from photo center</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-blue-300 mb-1">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          Height Variation: {settings.cameraAnimation?.heightVariation?.toFixed(0) || 'Auto'}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="1"
                          value={settings.cameraAnimation?.heightVariation || 8}
                          onChange={(e) => onSettingsChange({ 
                            cameraAnimation: { 
                              ...settings.cameraAnimation, 
                              heightVariation: parseFloat(e.target.value) 
                            }
                          })}
                          className="w-full bg-gray-800"
                        />
                        <p className="text-xs text-blue-400/80 mt-1">How much height varies during animation</p>
                      </div>

                      <div>
                        <label className="block text-sm text-blue-300 mb-1">
                          <Maximize className="h-3 w-3 inline mr-1" />
                          Distance Variation: {settings.cameraAnimation?.distanceVariation?.toFixed(0) || 'Auto'}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="25"
                          step="1"
                          value={settings.cameraAnimation?.distanceVariation || 10}
                          onChange={(e) => onSettingsChange({ 
                            cameraAnimation: { 
                              ...settings.cameraAnimation, 
                              distanceVariation: parseFloat(e.target.value) 
                            }
                          })}
                          className="w-full bg-gray-800"
                        />
                        <p className="text-xs text-blue-400/80 mt-1">How much distance varies during animation</p>
                      </div>
                    </div>

                    <div className="bg-blue-700/20 p-3 rounded border border-blue-500/20">
                      <p className="text-xs text-blue-300 font-medium mb-1">💡 Pattern-Aware Defaults</p>
                      <p className="text-xs text-blue-400/90">
                        Leave controls at "Auto" for smart defaults that adapt to your animation pattern. 
                        <strong>Wave</strong> gets lower heights, <strong>Spiral</strong> gets higher heights and distances, 
                        <strong>Float</strong> gets moderate settings for optimal viewing.
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-800/30 p-3 rounded border border-blue-600/30">
                    <p className="text-xs text-blue-300 flex items-center">
                      <Play className="h-3 w-3 mr-1" />
                      <strong>How it works:</strong> Camera automatically tours your photos with smooth transitions between patterns. 
                      Take manual control anytime - the tour resumes gracefully after user interaction.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Enhanced Camera Controls - Legacy/Manual */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <CameraIcon className="h-4 w-4 mr-2" />
          Manual Camera Controls
        </h4>
        
        <div className="space-y-4">
          {settings.cameraEnabled !== false && !settings.cameraAnimation?.enabled && (
            <div className="space-y-4">
              {/* Camera Movement Type Selector */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Camera Movement Type</label>
                <select
                  value={settings.cameraRotationEnabled ? 'auto-rotate' : 'manual'}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'manual') {
                      onSettingsChange({ 
                        cameraRotationEnabled: false
                      });
                    } else if (value === 'auto-rotate') {
                      onSettingsChange({ 
                        cameraRotationEnabled: true
                      });
                    }
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                >
                  <option value="manual">📱 Manual Control Only</option>
                  <option value="auto-rotate">🔄 Auto Rotate (Enhanced)</option>
                </select>
              </div>

              {/* Enhanced Auto Rotate Settings */}
              {settings.cameraRotationEnabled && (
                <div className="bg-blue-900/20 p-4 rounded-lg space-y-4">
                  <h5 className="text-sm font-medium text-blue-300">🔄 Enhanced Auto Rotate Settings</h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Rotation Speed
                        <span className="ml-2 text-xs text-gray-400">{(settings.cameraAutoRotateSpeed || settings.cameraRotationSpeed || 0.5).toFixed(1)}x</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.1"
                        value={settings.cameraAutoRotateSpeed || settings.cameraRotationSpeed || 0.5}
                        onChange={(e) => onSettingsChange({ 
                          cameraAutoRotateSpeed: parseFloat(e.target.value),
                          cameraRotationSpeed: parseFloat(e.target.value)
                        }, true)}
                        className="w-full bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Distance
                        <span className="ml-2 text-xs text-gray-400">{(settings.cameraAutoRotateRadius || settings.cameraDistance || 25).toFixed(0)} units</span>
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="1"
                        value={settings.cameraAutoRotateRadius || settings.cameraDistance || 25}
                        onChange={(e) => onSettingsChange({ 
                          cameraAutoRotateRadius: parseFloat(e.target.value),
                          cameraDistance: parseFloat(e.target.value)
                        }, true)}
                        className="w-full bg-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Height
                      <span className="ml-2 text-xs text-gray-400">{(settings.cameraAutoRotateHeight || settings.cameraHeight || 5).toFixed(0)} units</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      step="2"
                      value={settings.cameraAutoRotateHeight || settings.cameraHeight || 5}
                      onChange={(e) => onSettingsChange({ 
                        cameraAutoRotateHeight: parseFloat(e.target.value),
                        cameraHeight: parseFloat(e.target.value)
                      }, true)}
                      className="w-full bg-gray-800"
                    />
                  </div>

                  {/* Advanced Controls */}
                  <div className="border-t border-gray-700 pt-4">
                    <h6 className="text-xs font-medium text-gray-300 mb-3">⚙️ Advanced Movement Controls</h6>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Elevation Min
                          <span className="ml-2 text-xs text-gray-400">{Math.round((settings.cameraAutoRotateElevationMin || Math.PI/6) * 180 / Math.PI)}°</span>
                        </label>
                        <input
                          type="range"
                          min={Math.PI/12}
                          max={Math.PI/2}
                          step={Math.PI/180}
                          value={settings.cameraAutoRotateElevationMin || Math.PI/6}
                          onChange={(e) => onSettingsChange({ 
                            cameraAutoRotateElevationMin: parseFloat(e.target.value)
                          }, true)}
                          className="w-full bg-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Elevation Max
                          <span className="ml-2 text-xs text-gray-400">{Math.round((settings.cameraAutoRotateElevationMax || Math.PI/3) * 180 / Math.PI)}°</span>
                        </label>
                        <input
                          type="range"
                          min={Math.PI/6}
                          max={Math.PI/1.5}
                          step={Math.PI/180}
                          value={settings.cameraAutoRotateElevationMax || Math.PI/3}
                          onChange={(e) => onSettingsChange({ 
                            cameraAutoRotateElevationMax: parseFloat(e.target.value)
                          }, true)}
                          className="w-full bg-gray-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Distance Variation
                        <span className="ml-2 text-xs text-gray-400">{(settings.cameraAutoRotateDistanceVariation || 0).toFixed(0)} units</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={settings.cameraAutoRotateDistanceVariation || 0}
                        onChange={(e) => onSettingsChange({ 
                          cameraAutoRotateDistanceVariation: parseFloat(e.target.value)
                        }, true)}
                        className="w-full bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Vertical Drift
                        <span className="ml-2 text-xs text-gray-400">{(settings.cameraAutoRotateVerticalDrift || 0).toFixed(1)} units</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={settings.cameraAutoRotateVerticalDrift || 0}
                        onChange={(e) => onSettingsChange({ 
                          cameraAutoRotateVerticalDrift: parseFloat(e.target.value)
                        }, true)}
                        className="w-full bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Camera Settings */}
              <div className="bg-gray-800/30 p-3 rounded-lg space-y-3">
                <h5 className="text-xs font-medium text-gray-300">📱 Manual Control Settings</h5>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Default Camera Distance
                    <span className="ml-2 text-xs text-gray-400">{settings.cameraDistance} units</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={settings.cameraDistance}
                    onChange={(e) => onSettingsChange({ 
                      cameraDistance: parseFloat(e.target.value) 
                    }, true)}
                    className="w-full bg-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Default Camera Height
                    <span className="ml-2 text-xs text-gray-400">{settings.cameraHeight} units</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    step="2"
                    value={settings.cameraHeight}
                    onChange={(e) => onSettingsChange({ 
                      cameraHeight: parseFloat(e.target.value) 
                    }, true)}
                    className="w-full bg-gray-800"
                  />
                </div>
              </div>
            </div>
          )}
          
          {settings.cameraEnabled === false && (
            <div className="bg-gray-800/20 p-3 rounded border border-gray-600/30">
              <p className="text-xs text-gray-400">
                📵 Camera controls are disabled. Enable camera controls in the Cinematic Camera section above to access manual movement options.
              </p>
            </div>
          )}
          
          {settings.cameraAnimation?.enabled && (
            <div className="bg-blue-800/20 p-3 rounded border border-blue-600/30">
              <p className="text-xs text-blue-300">
                🎬 <strong>Cinematic Mode Active:</strong> Manual camera controls are managed by the cinematic camera system above. Disable cinematic mode to access manual controls.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Display */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <ImageIcon className="h-4 w-4 mr-2" />
          Photo Display
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Default Photo Count
              <span className="ml-2 text-xs text-gray-400">{settings.photoCount} photos</span>
            </label>
            <input
              type="range"
              min="1"
              max="500"
              step="1"
              value={settings.photoCount}
              onChange={(e) => onSettingsChange({ photoCount: parseInt(e.target.value) })}
              className="w-full bg-gray-800"
            />
            <p className="mt-1 text-xs text-gray-400">
              Default photo count for patterns that don't specify their own count
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Photo Size
              <span className="ml-2 text-xs text-gray-400">{settings.photoSize.toFixed(1)} units</span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={settings.photoSize}
              onChange={(e) => onSettingsChange({ 
                photoSize: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Photo Brightness
              <span className="ml-2 text-xs text-gray-400">{(settings.photoBrightness * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={settings.photoBrightness}
              onChange={(e) => onSettingsChange({ 
                photoBrightness: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Empty Slot Color
            </label>
            <input
              type="color"
              value={settings.emptySlotColor}
              onChange={(e) => onSettingsChange({ 
                emptySlotColor: e.target.value 
              }, true)}
              className="w-full h-8 rounded cursor-pointer bg-gray-800"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.photoRotation}
              onChange={(e) => onSettingsChange({ 
                photoRotation: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">Enable Photo Rotation</label>
          </div>
        </div>
      </div>

      {/* Floor Texture Section */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Layers className="h-4 w-4 mr-2" />
          Floor Texture
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.floorEnabled}
              onChange={(e) => onSettingsChange({ 
                floorEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Show Floor
            </label>
          </div>

          {settings.floorEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Texture Type</label>
                <select
                  value={settings.floorTexture || 'solid'}
                  onChange={(e) => onSettingsChange({ 
                    floorTexture: e.target.value as ExtendedSceneSettings['floorTexture']
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                >
                  <option value="solid">🎨 Solid Color</option>
                  <option value="marble">⚪ Marble</option>
                  <option value="wood">🪵 Wood</option>
                  <option value="concrete">🏗️ Concrete</option>
                  <option value="metal">⚙️ Metal</option>
                  <option value="glass">💎 Glass</option>
                  <option value="checkerboard">♟️ Checkerboard</option>
                  <option value="custom">🖼️ Custom Image</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Floor Color</label>
                <input
                  type="color"
                  value={settings.floorColor}
                  onChange={(e) => onSettingsChange({ 
                    floorColor: e.target.value 
                  }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Floor Size
                  <span className="ml-2 text-xs text-gray-400">{settings.floorSize} units</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="10"
                  value={settings.floorSize}
                  onChange={(e) => onSettingsChange({ floorSize: parseFloat(e.target.value) }, true)}
                  className="w-full bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Floor Opacity
                  <span className="ml-2 text-xs text-gray-400">{Math.round(settings.floorOpacity * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.floorOpacity}
                  onChange={(e) => onSettingsChange({
                    floorOpacity: parseFloat(e.target.value)
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lighting Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Lightbulb className="h-4 w-4 mr-2" />
          Lighting
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Ambient Light
              <span className="ml-2 text-xs text-gray-400">{(settings.ambientLightIntensity * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.2"
              value={settings.ambientLightIntensity}
              onChange={(e) => onSettingsChange({ 
                ambientLightIntensity: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Spotlight Color</label>
            <input
              type="color"
              value={settings.spotlightColor}
              onChange={(e) => onSettingsChange({ 
                spotlightColor: e.target.value 
              }, true)}
              className="w-full h-8 rounded cursor-pointer bg-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Number of Spotlights
              <span className="ml-2 text-xs text-gray-400">{settings.spotlightCount}</span>
            </label>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={settings.spotlightCount}
              onChange={(e) => onSettingsChange({ 
                spotlightCount: parseInt(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Spotlight Intensity
              <span className="ml-2 text-xs text-gray-400">{settings.spotlightIntensity.toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="300"
              step="1"
              value={settings.spotlightIntensity}
              onChange={(e) => onSettingsChange({ 
                spotlightIntensity: parseFloat(e.target.value) 
              }, true)}
              className="w-full bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Background Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Palette className="h-4 w-4 mr-2" />
          Background
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.backgroundGradient}
              onChange={(e) => onSettingsChange({ 
                backgroundGradient: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Use Gradient Background
            </label>
          </div>

          {!settings.backgroundGradient ? (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Background Color</label>
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => onSettingsChange({ 
                  backgroundColor: e.target.value 
                }, true)}
                className="w-full h-8 rounded cursor-pointer bg-gray-800"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Gradient Start</label>
                <input
                  type="color"
                  value={settings.backgroundGradientStart}
                  onChange={(e) => onSettingsChange({ 
                    backgroundGradientStart: e.target.value 
                  }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Gradient End</label>
                <input
                  type="color"
                  value={settings.backgroundGradientEnd}
                  onChange={(e) => onSettingsChange({ 
                    backgroundGradientEnd: e.target.value 
                  }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Gradient Angle
                  <span className="ml-2 text-xs text-gray-400">{settings.backgroundGradientAngle}°</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={settings.backgroundGradientAngle}
                  onChange={(e) => onSettingsChange({ 
                    backgroundGradientAngle: parseInt(e.target.value) 
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Particle System Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Sparkles className="h-4 w-4 mr-2" />
          Particle Effects
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.particles?.enabled ?? true}
              onChange={(e) => onSettingsChange({
                particles: {
                  ...settings.particles,
                  enabled: e.target.checked
                }
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Enable Particle Effects
            </label>
          </div>

          {settings.particles?.enabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Particle Theme
                </label>
                <select
                  value={settings.particles?.theme ?? 'Purple Magic'}
                  onChange={(e) => onSettingsChange({
                    particles: {
                      ...settings.particles,
                      theme: e.target.value
                    }
                  })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                >
                  {PARTICLE_THEMES.map((theme) => (
                    <option key={theme.name} value={theme.name}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Particle Intensity
                  <span className="ml-2 text-xs text-gray-400">
                    {Math.round((settings.particles?.intensity ?? 0.7) * 100)}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.particles?.intensity ?? 0.7}
                  onChange={(e) => onSettingsChange({
                    particles: {
                      ...settings.particles,
                      intensity: parseFloat(e.target.value)
                    }
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Button */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={onReset}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm"
        >
          Reset All Settings
        </button>
      </div>
    </div>
  );
};

export default EnhancedSceneSettings;