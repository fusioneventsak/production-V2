// src/components/collage/SceneSettings.tsx - COMPLETE with Enhanced Grid Wall Settings
import React from 'react';
import { type SceneSettings } from '../../store/sceneStore';
import { Grid, Palette, CameraIcon, ImageIcon, Square, Sun, Lightbulb, RotateCw, Move, Eye, Camera, Sparkles, Building, Sphere, Gallery, Studio, Home, Layers, Video, Play, Target, Clock, Zap, Settings, ArrowUp, ArrowRight, TrendingUp, Maximize, Aspect, Hash, Ruler } from 'lucide-react';
import { PARTICLE_THEMES } from '../three/MilkyWayParticleSystem';
import { getCinematicCameraTypeDescription } from '../../store/sceneStore';

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
  
  // ENHANCED: Cinematic Camera Settings with Fine-Tuning Controls
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
}

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
                Animation Speed
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
                <Aspect className="h-3 w-3 inline mr-1" />
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

      {/* Camera Controls */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <CameraIcon className="h-4 w-4 mr-2" />
          Camera Controls
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.cameraEnabled}
              onChange={(e) => onSettingsChange({ 
                cameraEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Enable Camera Movement
            </label>
          </div>

          {settings.cameraEnabled && (
            <div className="space-y-4">
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

      {/* Floor Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Layers className="h-4 w-4 mr-2" />
          Floor
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