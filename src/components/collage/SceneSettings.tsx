// src/components/collage/SceneSettings.tsx - Enhanced with Environment Controls
import React from 'react';
import { type SceneSettings } from '../../store/sceneStore';
import { Grid, Palette, CameraIcon, ImageIcon, Square, Sun, Lightbulb, RotateCw, Move, Eye, Camera, Sparkles, Building, Sphere, Gallery, Studio, Home, Layers } from 'lucide-react';
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
  ceilingEnabled?: boolean;
  ceilingHeight?: number;
  roomDepth?: number;
}

const EnhancedSceneSettings: React.FC<{
  settings: ExtendedSceneSettings;
  onSettingsChange: (settings: Partial<ExtendedSceneSettings>, debounce?: boolean) => void;
  onReset: () => void;
}> = ({ settings, onSettingsChange, onReset }) => {
  return (
    <div className="space-y-6">
      {/* NEW: Scene Environment Section */}
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

          {/* Environment-specific settings */}
          {settings.sceneEnvironment === 'cube' && (
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-3">
              <h5 className="text-xs font-medium text-gray-300">Cube Room Settings</h5>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Wall Height
                  <span className="ml-2 text-xs text-gray-400">{settings.wallHeight || 40} units</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={settings.wallHeight || 40}
                  onChange={(e) => onSettingsChange({ wallHeight: parseFloat(e.target.value) }, true)}
                  className="w-full bg-gray-800"
                />
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
                    <span className="ml-2 text-xs text-gray-400">{settings.ceilingHeight || settings.wallHeight || 40} units</span>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={settings.ceilingHeight || settings.wallHeight || 40}
                    onChange={(e) => onSettingsChange({ ceilingHeight: parseFloat(e.target.value) }, true)}
                    className="w-full bg-gray-800"
                  />
                </div>
              )}
            </div>
          )}

          {settings.sceneEnvironment === 'sphere' && (
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-3">
              <h5 className="text-xs font-medium text-gray-300">Sphere Settings</h5>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Custom Sphere Texture URL</label>
                <input
                  type="url"
                  value={settings.sphereTextureUrl || ''}
                  onChange={(e) => onSettingsChange({ sphereTextureUrl: e.target.value }, true)}
                  placeholder="https://example.com/sphere-texture.jpg"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-sm"
                />
                <p className="mt-1 text-xs text-gray-400">Optional: URL to a panoramic image for sphere interior</p>
              </div>
            </div>
          )}

          {settings.sceneEnvironment === 'gallery' && (
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-3">
              <h5 className="text-xs font-medium text-gray-300">Gallery Settings</h5>
              
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

          {settings.sceneEnvironment === 'studio' && (
            <div className="bg-gray-800/50 p-3 rounded-lg">
              <h5 className="text-xs font-medium text-gray-300">Studio Settings</h5>
              <p className="text-xs text-gray-400 mt-1">Studio environment includes automatic curved backdrop and 6-point lighting rig.</p>
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
              Photo Count
              <span className="ml-2 text-xs text-gray-400">
                {settings.animationPattern === 'grid' && settings.patterns?.grid?.photoCount !== undefined
                  ? settings.patterns.grid.photoCount
                  : settings.animationPattern === 'float' && settings.patterns?.float?.photoCount !== undefined
                  ? settings.patterns.float.photoCount
                  : settings.animationPattern === 'wave' && settings.patterns?.wave?.photoCount !== undefined
                  ? settings.patterns.wave.photoCount
                  : settings.animationPattern === 'spiral' && settings.patterns?.spiral?.photoCount !== undefined
                  ? settings.patterns.spiral.photoCount
                  : settings.photoCount} photos
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="500"
              step="1"
              value={
                settings.animationPattern === 'grid' && settings.patterns?.grid?.photoCount !== undefined
                  ? settings.patterns.grid.photoCount
                  : settings.animationPattern === 'float' && settings.patterns?.float?.photoCount !== undefined
                  ? settings.patterns.float.photoCount
                  : settings.animationPattern === 'wave' && settings.patterns?.wave?.photoCount !== undefined
                  ? settings.patterns.wave.photoCount
                  : settings.animationPattern === 'spiral' && settings.patterns?.spiral?.photoCount !== undefined
                  ? settings.patterns.spiral.photoCount
                  : settings.photoCount
              }
              onChange={(e) => {
                const value = parseInt(e.target.value);
                
                // Update both the global photoCount and the pattern-specific photoCount
                const updates: Partial<ExtendedSceneSettings> = {
                  photoCount: value
                };
                
                // Add pattern-specific update
                if (settings.animationPattern === 'grid') {
                  updates.patterns = {
                    grid: {
                      photoCount: value
                    }
                  };
                } else if (settings.animationPattern === 'float') {
                  updates.patterns = {
                    float: {
                      photoCount: value
                    }
                  };
                } else if (settings.animationPattern === 'wave') {
                  updates.patterns = {
                    wave: {
                      photoCount: value
                    }
                  };
                } else if (settings.animationPattern === 'spiral') {
                  updates.patterns = {
                    spiral: {
                      photoCount: value
                    }
                  };
                }
                
                onSettingsChange(updates);
              }}
              className="w-full bg-gray-800"
            />
            <p className="mt-1 text-xs text-gray-400">
              Number of photos to display simultaneously
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
        </div>
      </div>

      {/* NEW: Floor Texture Section */}
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

              {settings.floorTexture === 'custom' && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Custom Texture URL</label>
                  <input
                    type="url"
                    value={settings.customFloorTextureUrl || ''}
                    onChange={(e) => onSettingsChange({ customFloorTextureUrl: e.target.value }, true)}
                    placeholder="https://example.com/floor-texture.jpg"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-400">URL to your custom floor texture image</p>
                </div>
              )}

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
                <p className="mt-1 text-xs text-gray-400">
                  {settings.floorTexture === 'solid' ? 'Main floor color' : 'Tints the texture with this color'}
                </p>
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

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Metalness
                  <span className="ml-2 text-xs text-gray-400">{Math.round((settings.floorMetalness || 0.5) * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.floorMetalness || 0.5}
                  onChange={(e) => onSettingsChange({
                    floorMetalness: parseFloat(e.target.value)
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Roughness
                  <span className="ml-2 text-xs text-gray-400">{Math.round((settings.floorRoughness || 0.5) * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.floorRoughness || 0.5}
                  onChange={(e) => onSettingsChange({
                    floorRoughness: parseFloat(e.target.value)
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Grid className="h-4 w-4 mr-2" />
          Grid Lines
        </h4>
        
        <div className="space-y-4">
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
                  max="400"
                  step="10"
                  value={settings.gridSize}
                  onChange={(e) => onSettingsChange({ gridSize: parseFloat(e.target.value) }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Grid Divisions
                  <span className="ml-2 text-xs text-gray-400">{Math.round(settings.gridDivisions)} lines</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={settings.gridDivisions}
                  onChange={(e) => onSettingsChange({
                    gridDivisions: parseFloat(e.target.value)
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Grid Opacity
                  <span className="ml-2 text-xs text-gray-400">{Math.round(settings.gridOpacity * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.gridOpacity}
                  onChange={(e) => onSettingsChange({
                    gridOpacity: parseFloat(e.target.value)
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Controls */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <CameraIcon className="h-4 w-4 mr-2" />
          Camera
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
                  Auto Rotate
                </label>
              </div>

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
                  max="50"
                  step="1"
                  value={settings.cameraHeight}
                  onChange={(e) => onSettingsChange({ 
                    cameraHeight: parseFloat(e.target.value) 
                  }, true)}
                  className="w-full bg-gray-800"
                />
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
                    max="2"
                    step="0.1"
                    value={settings.cameraRotationSpeed}
                    onChange={(e) => onSettingsChange({ 
                      cameraRotationSpeed: parseFloat(e.target.value) 
                    }, true)}
                    className="w-full bg-gray-800"
                  />
                </div>
              )}
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
            <p className="mt-1 text-xs text-gray-400">
              Global scene brightness (0% = pitch black, 1000% = very bright)
            </p>
          </div>
        </div>
      </div>

      {/* Spotlight Settings */}
      <div>
        <h4 className="flex items-center text-sm font-medium text-gray-200 mb-3">
          <Sun className="h-4 w-4 mr-2" />
          Spotlights
        </h4>
        
        <div className="space-y-4">
          <div className="bg-gray-800 p-3 rounded">
            <div className="space-y-3">
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
            </div>
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
          {/* Enable/Disable Particles */}
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
              {/* Particle Theme Selector */}
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

              {/* Particle Intensity */}
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

              {/* Theme Preview */}
              <div className="p-3 bg-gray-800 rounded-lg">
                <div className="text-xs text-gray-400 mb-2">Preview Colors:</div>
                <div className="flex space-x-2">
                  {PARTICLE_THEMES.find(t => t.name === (settings.particles?.theme ?? 'Purple Magic')) && (
                    <>
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-600"
                        style={{ 
                          backgroundColor: PARTICLE_THEMES.find(t => t.name === (settings.particles?.theme ?? 'Purple Magic'))?.primary 
                        }}
                        title="Primary"
                      />
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-600"
                        style={{ 
                          backgroundColor: PARTICLE_THEMES.find(t => t.name === (settings.particles?.theme ?? 'Purple Magic'))?.secondary 
                        }}
                        title="Secondary"
                      />
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-600"
                        style={{ 
                          backgroundColor: PARTICLE_THEMES.find(t => t.name === (settings.particles?.theme ?? 'Purple Magic'))?.accent 
                        }}
                        title="Accent"
                      />
                    </>
                  )}
                </div>
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