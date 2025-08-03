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
  wallColor?: string;
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
              
              <p className="text-xs text-gray-400">
                💡 Walls automatically extend to floor edges with infinite height
              </p>
            </div>
          )}

          {/* Sphere Environment Settings */}
          {settings.sceneEnvironment === 'sphere' && (
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-3">
              <h5 className="text-xs font-medium text-gray-300">Sphere Settings</h5>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Sphere Interior Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={settings.wallColor || settings.floorColor || '#1A1A2E'}
                    onChange={(e) => onSettingsChange({ wallColor: e.target.value }, true)}
                    className="w-full h-8 rounded cursor-pointer bg-gray-800"
                  />
                  <select
                    onChange={(e) => onSettingsChange({ wallColor: e.target.value }, true)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 text-white text-xs"
                  >
                    <option value="">Space Presets</option>
                    <option value="#000080">🌌 Navy Space</option>
                    <option value="#191970">🌌 Midnight Blue</option>
                    <option value="#4B0082">🌌 Indigo</option>
                    <option value="#2E0854">🌌 Dark Purple</option>
                    <option value="#1a1a2e">🌌 Deep Space</option>
                    <option value="#16213e">🌌 Dark Blue</option>
                    <option value="#0f3460">🌌 Ocean Deep</option>
                  </select>
                </div>
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
                <p className="mt-1 text-xs text-gray-400">Optional: 360° panoramic image for immersive interior</p>
              </div>
              
              <p className="text-xs text-gray-400">
                🌍 Photos are automatically contained within the sphere boundary
              </p>
            </div>
          )}

          {/* Gallery Environment Settings */}
          {settings.sceneEnvironment === 'gallery' && (
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-3">
              <h5 className="text-xs font-medium text-gray-300">Gallery Settings</h5>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Gallery Wall Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={settings.wallColor || '#F5F5F5'}
                    onChange={(e) => onSettingsChange({ wallColor: e.target.value }, true)}
                    className="w-full h-8 rounded cursor-pointer bg-gray-800"
                  />
                  <select
                    onChange={(e) => onSettingsChange({ wallColor: e.target.value }, true)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 text-white text-xs"
                  >
                    <option value="">Gallery Presets</option>
                    <option value="#FFFFFF">⚪ Pure White</option>
                    <option value="#F8F8FF">⚪ Ghost White</option>
                    <option value="#F5F5F5">⚪ White Smoke</option>
                    <option value="#DCDCDC">⚪ Gainsboro</option>
                    <option value="#D3D3D3">⚪ Light Gray</option>
                    <option value="#C0C0C0">⚪ Silver</option>
                    <option value="#FFF8DC">🟡 Cornsilk</option>
                    <option value="#FFFAF0">🟡 Floral White</option>
                  </select>
                </div>
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
              
              <p className="text-xs text-gray-400">
                🖼️ Includes professional track lighting and infinite height walls
              </p>
            </div>
          )}

          {/* Studio Environment Settings */}
          {settings.sceneEnvironment === 'studio' && (
            <div className="bg-gray-800/50 p-3 rounded-lg space-y-3">
              <h5 className="text-xs font-medium text-gray-300">Studio Settings</h5>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Backdrop Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={settings.wallColor || '#E8E8E8'}
                    onChange={(e) => onSettingsChange({ wallColor: e.target.value }, true)}
                    className="w-full h-8 rounded cursor-pointer bg-gray-800"
                  />
                  <select
                    onChange={(e) => onSettingsChange({ wallColor: e.target.value }, true)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 text-white text-xs"
                  >
                    <option value="">Studio Presets</option>
                    <option value="#FFFFFF">⚪ White Cyc</option>
                    <option value="#E8E8E8">⚪ Light Gray</option>
                    <option value="#D3D3D3">⚪ Silver Cyc</option>
                    <option value="#000000">⚫ Black Cyc</option>
                    <option value="#2F4F4F">⚫ Dark Slate</option>
                    <option value="#008000">🟢 Green Screen</option>
                    <option value="#0000FF">🔵 Blue Screen</option>
                  </select>
                </div>
              </div>
              
              <p className="text-xs text-gray-400">
                📸 Features curved backdrop and 6-point professional lighting rig
              </p>
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

          {settings.cameraEnabled && (
            <div className="space-y-4">
              {/* Camera Movement Type Selector */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Camera Movement Type</label>
                <select
                  value={settings.cameraRotationEnabled ? 'auto-rotate' : (settings.cameraAnimation?.enabled ? 'cinematic' : 'manual')}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'manual') {
                      onSettingsChange({ 
                        cameraRotationEnabled: false,
                        cameraAnimation: { ...settings.cameraAnimation, enabled: false }
                      });
                    } else if (value === 'auto-rotate') {
                      onSettingsChange({ 
                        cameraRotationEnabled: true,
                        cameraAnimation: { ...settings.cameraAnimation, enabled: false }
                      });
                    } else if (value === 'cinematic') {
                      onSettingsChange({ 
                        cameraRotationEnabled: false,
                        cameraAnimation: { ...settings.cameraAnimation, enabled: true }
                      });
                    }
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                >
                  <option value="manual">📱 Manual Control Only</option>
                  <option value="auto-rotate">🔄 Auto Rotate (Simple)</option>
                  <option value="cinematic">🎬 Cinematic Animations</option>
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  {settings.cameraRotationEnabled ? 'Simple circular rotation around the scene' : 
                   settings.cameraAnimation?.enabled ? 'Advanced cinematic camera movements' : 
                   'Full manual control with mouse/touch only'}
                </p>
              </div>

              {/* Auto Rotate Settings */}
              {settings.cameraRotationEnabled && (
                <div className="bg-blue-900/20 p-3 rounded-lg space-y-3">
                  <h5 className="text-xs font-medium text-blue-300">Auto Rotate Settings</h5>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Rotation Speed
                      <span className="ml-2 text-xs text-gray-400">{settings.cameraRotationSpeed?.toFixed(1) || '0.5'}x</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={settings.cameraRotationSpeed || 0.5}
                      onChange={(e) => onSettingsChange({ 
                        cameraRotationSpeed: parseFloat(e.target.value) 
                      }, true)}
                      className="w-full bg-gray-800"
                    />
                  </div>
                </div>
              )}

              {/* Cinematic Camera Animation Settings */}
              {settings.cameraAnimation?.enabled && (
                <div className="bg-purple-900/20 p-3 rounded-lg space-y-3">
                  <h5 className="text-xs font-medium text-purple-300">🎬 Cinematic Animation Settings</h5>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Animation Style</label>
                    <select
                      value={settings.cameraAnimation?.type || 'orbit'}
                      onChange={(e) => onSettingsChange({ 
                        cameraAnimation: { ...settings.cameraAnimation, type: e.target.value as any }
                      })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white"
                    >
                      <option value="orbit">🌍 Orbit (Classic circular movement)</option>
                      <option value="figure8">♾️ Figure-8 (Smooth infinity pattern)</option>
                      <option value="centerRotate">🎯 Center Focus (Stay focused on center)</option>
                      <option value="wave">🌊 Wave (Undulating motion)</option>
                      <option value="spiral">🌀 Spiral (Ascending/descending spiral)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-400">
                      {settings.cameraAnimation?.type === 'figure8' && '♾️ Perfect for Float pattern - smooth infinity loops'}
                      {settings.cameraAnimation?.type === 'orbit' && '🌍 Classic circular orbit around photos'}
                      {settings.cameraAnimation?.type === 'centerRotate' && '🎯 Always keeps center in focus while rotating'}
                      {settings.cameraAnimation?.type === 'wave' && '🌊 Gentle wave-like camera movement'}
                      {settings.cameraAnimation?.type === 'spiral' && '🌀 Dynamic spiral ascending and descending'}
                      {(!settings.cameraAnimation?.type || settings.cameraAnimation?.type === 'none') && '📱 Manual control only'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Animation Speed
                      <span className="ml-2 text-xs text-gray-400">{settings.cameraAnimation?.speed?.toFixed(1) || '1.0'}x</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={settings.cameraAnimation?.speed || 1.0}
                      onChange={(e) => onSettingsChange({ 
                        cameraAnimation: { ...settings.cameraAnimation, speed: parseFloat(e.target.value) }
                      })}
                      className="w-full bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Camera Distance
                      <span className="ml-2 text-xs text-gray-400">{settings.cameraAnimation?.radius?.toFixed(0) || '30'} units</span>
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="80"
                      step="1"
                      value={settings.cameraAnimation?.radius || 30}
                      onChange={(e) => onSettingsChange({ 
                        cameraAnimation: { ...settings.cameraAnimation, radius: parseFloat(e.target.value) }
                      })}
                      className="w-full bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Camera Height
                      <span className="ml-2 text-xs text-gray-400">{settings.cameraAnimation?.height?.toFixed(0) || '10'} units</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={settings.cameraAnimation?.height || 10}
                      onChange={(e) => onSettingsChange({ 
                        cameraAnimation: { ...settings.cameraAnimation, height: parseFloat(e.target.value) }
                      })}
                      className="w-full bg-gray-800"
                    />
                  </div>

                  {(settings.cameraAnimation?.type === 'wave' || 
                    settings.cameraAnimation?.type === 'figure8' || 
                    settings.cameraAnimation?.type === 'spiral') && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Movement Intensity
                          <span className="ml-2 text-xs text-gray-400">{settings.cameraAnimation?.amplitude?.toFixed(0) || '5'} units</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="25"
                          step="1"
                          value={settings.cameraAnimation?.amplitude || 5}
                          onChange={(e) => onSettingsChange({ 
                            cameraAnimation: { ...settings.cameraAnimation, amplitude: parseFloat(e.target.value) }
                          })}
                          className="w-full bg-gray-800"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          Controls how dramatic the camera movement is
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Movement Frequency
                          <span className="ml-2 text-xs text-gray-400">{settings.cameraAnimation?.frequency?.toFixed(1) || '0.5'}</span>
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="2.0"
                          step="0.1"
                          value={settings.cameraAnimation?.frequency || 0.5}
                          onChange={(e) => onSettingsChange({ 
                            cameraAnimation: { ...settings.cameraAnimation, frequency: parseFloat(e.target.value) }
                          })}
                          className="w-full bg-gray-800"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          How often the camera changes direction
                        </p>
                      </div>
                    </>
                  )}

                  <div className="bg-gray-800/50 p-2 rounded text-xs text-gray-400">
                    💡 <strong>Tip:</strong> Combine different animation patterns with camera movements:
                    <br />• Float + Figure-8 = Dreamy floating effect
                    <br />• Grid + Orbit = Classic gallery walkthrough  
                    <br />• Spiral + Spiral Camera = Dynamic spiral experience
                  </div>
                </div>
              )}

              {/* Manual Camera Settings (always available) */}
              <div className="bg-gray-800/30 p-3 rounded-lg space-y-3">
                <h5 className="text-xs font-medium text-gray-300">📱 Manual Control Settings</h5>
                <p className="text-xs text-gray-400 mb-2">These settings apply to manual control and as base values for animations</p>
                
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
                    max="50"
                    step="1"
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
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={settings.floorColor}
                    onChange={(e) => onSettingsChange({ 
                      floorColor: e.target.value 
                    }, true)}
                    className="w-full h-8 rounded cursor-pointer bg-gray-800"
                  />
                  <select
                    onChange={(e) => onSettingsChange({ floorColor: e.target.value }, true)}
                    className="bg-gray-700 border border-gray-600 rounded px-2 text-white text-xs"
                  >
                    <option value="">Earth Tone Presets</option>
                    <option value="#8B4513">🟤 Saddle Brown</option>
                    <option value="#A0522D">🟤 Sienna</option>
                    <option value="#CD853F">🟤 Peru</option>
                    <option value="#D2691E">🟠 Chocolate</option>
                    <option value="#BC8F8F">🟤 Rosy Brown</option>
                    <option value="#F4A460">🟤 Sandy Brown</option>
                    <option value="#DEB887">🟤 Burlywood</option>
                    <option value="#D2B48C">🟤 Tan</option>
                    <option value="#DAA520">🟡 Goldenrod</option>
                    <option value="#B8860B">🟡 Dark Goldenrod</option>
                    <option value="#228B22">🟢 Forest Green</option>
                    <option value="#6B8E23">🟢 Olive Drab</option>
                    <option value="#9ACD32">🟢 Yellow Green</option>
                    <option value="#8FBC8F">🟢 Dark Sea Green</option>
                    <option value="#20B2AA">🔵 Light Sea Green</option>
                    <option value="#5F9EA0">🔵 Cadet Blue</option>
                    <option value="#708090">🔘 Slate Gray</option>
                    <option value="#2F4F4F">🔘 Dark Slate Gray</option>
                    <option value="#696969">🔘 Dim Gray</option>
                    <option value="#778899">🔘 Light Slate Gray</option>
                    <option value="#F5F5DC">🟡 Beige</option>
                    <option value="#FFFAF0">🟡 Floral White</option>
                    <option value="#FDF5E6">🟡 Old Lace</option>
                    <option value="#FAEBD7">🟡 Antique White</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {settings.floorTexture === 'solid' ? 'Main floor color' : 'Base color that influences the texture pattern'}
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