// src/components/collage/SceneSettings.tsx - COMPLETE with Grid Wall Controls
import React from 'react';
import { type SceneSettings } from '../../store/sceneStore';
import { Grid, Palette, CameraIcon, ImageIcon, Square, Sun, Lightbulb, RotateCw, Move, Eye, Camera, Sparkles, Building, Sphere, Gallery, Studio, Home, Layers, Video, Play, Target, Clock, Zap, Settings, ArrowUp, ArrowRight, TrendingUp, Maximize } from 'lucide-react';
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
  
  // Grid aspect ratio preset
  gridAspectRatioPreset?: '1:1' | '4:3' | '16:9' | '21:9' | 'custom';
  
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

  // Pattern-specific settings that match your existing structure
  patterns?: {
    grid?: {
      enabled?: boolean;
      photoCount?: number;
      aspectRatio?: number;     // Grid aspect ratio (width/height) - supports 1:1, 4:3, 16:9, 21:9, custom
      spacing?: number;         // Space between photos (0 = solid wall, 0.5 = 50% gaps, 1 = 100% gaps)
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
}

const EnhancedSceneSettings: React.FC<{
  settings: ExtendedSceneSettings;
  onSettingsChange: (settings: Partial<ExtendedSceneSettings>, debounce?: boolean) => void;
  onReset: () => void;
}> = ({ settings, onSettingsChange, onReset }) => {
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
              <option value="grid">🧱 Grid Wall</option>
              <option value="float">🎈 Float</option>
              <option value="wave">🌊 Wave</option>
              <option value="spiral">🌀 Spiral</option>
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

      {/* Photo Count and Size */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <ImageIcon className="h-4 w-4 mr-2" />
          Photo Display
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Photo Count (Global Default)
              <span className="ml-2 text-xs text-gray-400">{settings.photoCount} photos</span>
            </label>
            <input
              type="range"
              min="1"
              max="500"
              step="1"
              value={settings.photoCount}
              onChange={(e) => {
                const newCount = parseInt(e.target.value);
                const updates: any = { photoCount: newCount };
                
                // Also update pattern-specific photo count if pattern is selected
                if (settings.animationPattern && settings.patterns) {
                  updates.patterns = {
                    [settings.animationPattern]: {
                      photoCount: newCount
                    }
                  };
                }
                
                onSettingsChange(updates);
              }}
              className="w-full bg-gray-800"
            />
            <p className="mt-1 text-xs text-gray-400">
              Number of photos to display simultaneously (up to 500)
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
            <p className="mt-1 text-xs text-gray-400">
              Photo size multiplier (1 = small, 20 = huge)
            </p>
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
            <p className="mt-1 text-xs text-gray-400">
              Adjust photo brightness independently (10% = very dark, 300% = very bright)
            </p>
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

      {/* Grid Wall Settings - Only show when grid pattern is selected */}
      {settings.animationPattern === 'grid' && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <h4 className="flex items-center text-sm font-medium text-blue-200 mb-3">
            <Grid className="h-4 w-4 mr-2" />
            🧱 Grid Wall Settings
          </h4>
          
          <div className="space-y-4">
            {/* Photo Count - Grid Specific */}
            <div>
              <label className="block text-sm text-blue-300 mb-2">
                Grid Photo Count
                <span className="ml-2 text-xs text-blue-400">{settings.patterns?.grid?.photoCount || settings.photoCount} photos</span>
              </label>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={settings.patterns?.grid?.photoCount || settings.photoCount}
                onChange={(e) => {
                  const newPhotoCount = parseInt(e.target.value);
                  onSettingsChange({ 
                    patterns: {
                      grid: {
                        ...settings.patterns?.grid,
                        photoCount: newPhotoCount
                      }
                    }
                  });
                }}
                className="w-full bg-gray-800"
              />
              <p className="mt-1 text-xs text-blue-400">
                Number of photos in the grid wall (up to 500 supported)
              </p>
            </div>

            {/* Aspect Ratio Preset */}
            <div>
              <label className="block text-sm text-blue-300 mb-2">
                Grid Aspect Ratio Preset
              </label>
              <select
                value={settings.gridAspectRatioPreset || '16:9'}
                onChange={(e) => {
                  const preset = e.target.value as ExtendedSceneSettings['gridAspectRatioPreset'];
                  let ratio = settings.gridAspectRatio || 1.777778;
                  
                  switch (preset) {
                    case '1:1': ratio = 1; break;
                    case '4:3': ratio = 1.333333; break;
                    case '16:9': ratio = 1.777778; break;
                    case '21:9': ratio = 2.333333; break;
                    case 'custom': break;
                  }
                  
                  onSettingsChange({
                    gridAspectRatioPreset: preset,
                    gridAspectRatio: ratio,
                    patterns: {
                      grid: {
                        ...settings.patterns?.grid,
                        aspectRatio: ratio
                      }
                    }
                  });
                }}
                className="w-full bg-gray-800 border border-blue-700 rounded-md py-2 px-3 text-white"
              >
                <option value="1:1">Square (1:1)</option>
                <option value="4:3">Standard (4:3)</option>
                <option value="16:9">Widescreen (16:9)</option>
                <option value="21:9">Ultrawide (21:9)</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Custom Aspect Ratio */}
            {settings.gridAspectRatioPreset === 'custom' && (
              <div>
                <label className="block text-sm text-blue-300 mb-2">
                  Custom Aspect Ratio
                  <span className="ml-2 text-xs text-blue-400">{(settings.gridAspectRatio || 1.777778).toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={settings.gridAspectRatio || 1.777778}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    onSettingsChange({ 
                      gridAspectRatio: value,
                      patterns: {
                        grid: {
                          ...settings.patterns?.grid,
                          aspectRatio: value
                        }
                      }
                    });
                  }}
                  className="w-full bg-gray-800"
                />
              </div>
            )}

            {/* Photo Spacing - The Key Control */}
            <div>
              <label className="block text-sm text-blue-300 mb-2">
                Photo Spacing
                <span className="ml-2 text-xs text-blue-400">
                  {(settings.patterns?.grid?.spacing || 0) === 0 ? 'Solid Wall' : `${((settings.patterns?.grid?.spacing || 0) * 100).toFixed(0)}% gaps`}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.patterns?.grid?.spacing || 0}
                onChange={(e) => onSettingsChange({ 
                  patterns: {
                    grid: {
                      ...settings.patterns?.grid,
                      spacing: parseFloat(e.target.value)
                    }
                  }
                }, true)}
                className="w-full bg-gray-800"
              />
              <p className="mt-1 text-xs text-blue-400">
                {(settings.patterns?.grid?.spacing || 0) === 0 
                  ? '🧱 Edge-to-edge solid wall (no gaps)'
                  : (settings.patterns?.grid?.spacing || 0) < 0.5
                  ? '📐 Small gaps between photos'
                  : '📏 Large gaps between photos'
                }
              </p>
            </div>

            {/* Wall Height */}
            <div>
              <label className="block text-sm text-blue-300 mb-2">
                Wall Height
                <span className="ml-2 text-xs text-blue-400">{(settings.patterns?.grid?.wallHeight || 0).toFixed(1)} units</span>
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={settings.patterns?.grid?.wallHeight || 0}
                onChange={(e) => onSettingsChange({ 
                  patterns: {
                    grid: {
                      ...settings.patterns?.grid,
                      wallHeight: parseFloat(e.target.value)
                    }
                  }
                }, true)}
                className="w-full bg-gray-800"
              />
              <p className="mt-1 text-xs text-blue-400">
                Adjust the vertical position of the photo wall
              </p>
            </div>

            <div className="bg-blue-800/30 p-3 rounded border border-blue-600/30">
              <p className="text-xs text-blue-300 font-medium mb-1">💡 Grid Wall Tips</p>
              <p className="text-xs text-blue-400/90">
                • <strong>Spacing = 0</strong>: Perfect solid wall with no gaps<br/>
                • <strong>Spacing > 0</strong>: Uniform gaps for spaced gallery look<br/>
                • <strong>Aspect Ratio</strong>: Controls wall shape (wide vs tall)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Wave Pattern Settings */}
      {settings.animationPattern === 'wave' && (
        <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4">
          <h4 className="flex items-center text-sm font-medium text-cyan-200 mb-3">
            <Square className="h-4 w-4 mr-2" />
            🌊 Wave Pattern Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-cyan-300 mb-2">
                Wave Photo Count
                <span className="ml-2 text-xs text-cyan-400">{settings.patterns?.wave?.photoCount || settings.photoCount} photos</span>
              </label>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={settings.patterns?.wave?.photoCount || settings.photoCount}
                onChange={(e) => {
                  const newPhotoCount = parseInt(e.target.value);
                  onSettingsChange({ 
                    patterns: {
                      wave: {
                        ...settings.patterns?.wave,
                        photoCount: newPhotoCount
                      }
                    }
                  });
                }}
                className="w-full bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm text-cyan-300 mb-2">
                Wave Amplitude
                <span className="ml-2 text-xs text-cyan-400">{(settings.patterns?.wave?.amplitude || 8).toFixed(1)} units</span>
              </label>
              <input
                type="range"
                min="2"
                max="20"
                step="0.5"
                value={settings.patterns?.wave?.amplitude || 8}
                onChange={(e) => onSettingsChange({ 
                  patterns: {
                    wave: {
                      ...settings.patterns?.wave,
                      amplitude: parseFloat(e.target.value)
                    }
                  }
                }, true)}
                className="w-full bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm text-cyan-300 mb-2">
                Wave Frequency
                <span className="ml-2 text-xs text-cyan-400">{(settings.patterns?.wave?.frequency || 0.06).toFixed(3)}</span>
              </label>
              <input
                type="range"
                min="0.02"
                max="0.15"
                step="0.005"
                value={settings.patterns?.wave?.frequency || 0.06}
                onChange={(e) => onSettingsChange({ 
                  patterns: {
                    wave: {
                      ...settings.patterns?.wave,
                      frequency: parseFloat(e.target.value)
                    }
                  }
                }, true)}
                className="w-full bg-gray-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Spiral Pattern Settings */}
      {settings.animationPattern === 'spiral' && (
        <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
          <h4 className="flex items-center text-sm font-medium text-purple-200 mb-3">
            <RotateCw className="h-4 w-4 mr-2" />
            🌀 Spiral Pattern Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-purple-300 mb-2">
                Spiral Photo Count
                <span className="ml-2 text-xs text-purple-400">{settings.patterns?.spiral?.photoCount || settings.photoCount} photos</span>
              </label>
              <input
                type="range"
                min="1"
                max="500"
                step="1"
                value={settings.patterns?.spiral?.photoCount || settings.photoCount}
                onChange={(e) => {
                  const newPhotoCount = parseInt(e.target.value);
                  onSettingsChange({ 
                    patterns: {
                      spiral: {
                        ...settings.patterns?.spiral,
                        photoCount: newPhotoCount
                      }
                    }
                  });
                }}
                className="w-full bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm text-purple-300 mb-2">
                Spiral Radius
                <span className="ml-2 text-xs text-purple-400">{(settings.patterns?.spiral?.radius || 20).toFixed(1)} units</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={settings.patterns?.spiral?.radius || 20}
                onChange={(e) => onSettingsChange({ 
                  patterns: {
                    spiral: {
                      ...settings.patterns?.spiral,
                      radius: parseFloat(e.target.value)
                    }
                  }
                }, true)}
                className="w-full bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm text-purple-300 mb-2">
                Height Step
                <span className="ml-2 text-xs text-purple-400">{(settings.patterns?.spiral?.heightStep || 0.85).toFixed(2)} units</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.05"
                value={settings.patterns?.spiral?.heightStep || 0.85}
                onChange={(e) => onSettingsChange({ 
                  patterns: {
                    spiral: {
                      ...settings.patterns?.spiral,
                      heightStep: parseFloat(e.target.value)
                    }
                  }
                }, true)}
                className="w-full bg-gray-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Camera Controls */}
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

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.cameraRotationEnabled}
              onChange={(e) => onSettingsChange({ 
                cameraRotationEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Auto Rotate Camera
            </label>
          </div>

          {settings.cameraRotationEnabled && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Rotation Speed
                <span className="ml-2 text-xs text-gray-400">{settings.cameraRotationSpeed.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={settings.cameraRotationSpeed}
                onChange={(e) => onSettingsChange({ 
                  cameraRotationSpeed: parseFloat(e.target.value)
                }, true)}
                className="w-full bg-gray-800"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Camera Distance
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
              Camera Height
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

      {/* Floor Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Layers className="h-4 w-4 mr-2" />
          Floor & Grid
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

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.gridEnabled}
              onChange={(e) => onSettingsChange({ 
                gridEnabled: e.target.checked 
              })}
              className="mr-2 bg-gray-800 border-gray-700"
            />
            <label className="text-sm text-gray-300">
              Show Grid Lines
            </label>
          </div>

          {settings.gridEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Grid Color</label>
                <input
                  type="color"
                  value={settings.gridColor}
                  onChange={(e) => onSettingsChange({ 
                    gridColor: e.target.value 
                  }, true)}
                  className="w-full h-8 rounded cursor-pointer bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Grid Size
                  <span className="ml-2 text-xs text-gray-400">{settings.gridSize} units</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={settings.gridSize}
                  onChange={(e) => onSettingsChange({ gridSize: parseFloat(e.target.value) }, true)}
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