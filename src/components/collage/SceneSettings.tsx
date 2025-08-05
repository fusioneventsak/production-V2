import React from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Palette } from 'lucide-react';

interface SceneSettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
  onReset?: () => void;
}

const SceneSettings: React.FC<SceneSettingsProps> = ({ settings, onSettingsChange, onReset }) => {
  return (
    <div className="space-y-6 text-sm">
      {/* Animation Pattern Selection */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-white">Animation Pattern</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'grid', name: 'Grid Wall', emoji: '🏗️' },
            { id: 'float', name: 'Float', emoji: '🎈' },
            { id: 'wave', name: 'Wave', emoji: '🌊' },
            { id: 'spiral', name: 'Spiral', emoji: '🌪️' }
          ].map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => onSettingsChange({ animationPattern: pattern.id })}
              className={`p-3 rounded-lg text-left transition-colors ${
                settings.animationPattern === pattern.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="text-lg mb-1">{pattern.emoji}</div>
              <div className="text-xs font-medium">{pattern.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Photo Count */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-white">Photo Settings</h3>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            <div className="flex items-center justify-between">
              <span>Photo Count</span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={settings.photoCount || 50}
                  onChange={(e) => onSettingsChange({ photoCount: Math.min(500, Math.max(5, parseInt(e.target.value) || 5)) })}
                  className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <span className="text-xs text-gray-400">photos</span>
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
          </label>
          <input
            type="range"
            min="5"
            max="500"
            step="1"
            value={settings.photoCount || 50}
            onChange={(e) => onSettingsChange({ photoCount: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5</span>
            <span>500</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Photo Size: {(settings.photoSize || 4.0).toFixed(1)}
          </label>
          <input
            type="range"
            min="1.0"
            max="15.0"
            step="0.1"
            value={settings.photoSize || 4.0}
            onChange={(e) => onSettingsChange({ photoSize: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Photo Brightness: {(settings.photoBrightness || 1.0).toFixed(1)}
          </label>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={settings.photoBrightness || 1.0}
            onChange={(e) => onSettingsChange({ photoBrightness: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>
      </div>

      {/* Animation Settings */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-white">Animation</h3>
        
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-300">Enable Animation</label>
          <button
            onClick={() => onSettingsChange({ animationEnabled: !settings.animationEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.animationEnabled ? 'bg-purple-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.animationEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Animation Speed: {settings.animationSpeed || 50}%
          </label>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={settings.animationSpeed || 50}
            onChange={(e) => onSettingsChange({ animationSpeed: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Slow (1%)</span>
            <span>Fast (100%)</span>
          </div>
        </div>
      </div>

      {/* Camera Settings */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-white">Camera</h3>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Camera Distance: {(settings.cameraDistance || 25).toFixed(1)}
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="0.5"
            value={settings.cameraDistance || 25}
            onChange={(e) => onSettingsChange({ cameraDistance: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Camera Height: {(settings.cameraHeight || 10).toFixed(1)}
          </label>
          <input
            type="range"
            min="-5"
            max="30"
            step="0.5"
            value={settings.cameraHeight || 10}
            onChange={(e) => onSettingsChange({ cameraHeight: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-300">Auto Rotation</label>
          <button
            onClick={() => onSettingsChange({ cameraRotationEnabled: !settings.cameraRotationEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.cameraRotationEnabled ? 'bg-purple-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.cameraRotationEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.cameraRotationEnabled && (
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Rotation Speed: {(settings.cameraRotationSpeed || 0.2).toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={settings.cameraRotationSpeed || 0.2}
              onChange={(e) => onSettingsChange({ cameraRotationSpeed: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
          </div>
        )}
      </div>

      {/* Lighting Settings */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-white">Lighting</h3>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Ambient Light: {(settings.ambientLightIntensity || 0.6).toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.ambientLightIntensity || 0.6}
            onChange={(e) => onSettingsChange({ ambientLightIntensity: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Spotlight Intensity: {(settings.spotlightIntensity || 600).toFixed(0)}
          </label>
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={settings.spotlightIntensity || 600}
            onChange={(e) => onSettingsChange({ spotlightIntensity: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">
            Spotlight Count: {settings.spotlightCount || 3}
          </label>
          <input
            type="range"
            min="0"
            max="8"
            step="1"
            value={settings.spotlightCount || 3}
            onChange={(e) => onSettingsChange({ spotlightCount: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>
      </div>

      {/* Background Settings */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-white">Background</h3>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">Background Color</label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={settings.backgroundColor || '#000000'}
              onChange={(e) => onSettingsChange({ backgroundColor: e.target.value })}
              className="w-12 h-8 bg-gray-700 border border-gray-600 rounded cursor-pointer"
            />
            <input
              type="text"
              value={settings.backgroundColor || '#000000'}
              onChange={(e) => onSettingsChange({ backgroundColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-300">Background Gradient</label>
          <button
            onClick={() => onSettingsChange({ backgroundGradient: !settings.backgroundGradient })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.backgroundGradient ? 'bg-purple-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.backgroundGradient ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.backgroundGradient && (
          <>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Gradient Start</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.backgroundGradientStart || '#000000'}
                  onChange={(e) => onSettingsChange({ backgroundGradientStart: e.target.value })}
                  className="w-12 h-8 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.backgroundGradientStart || '#000000'}
                  onChange={(e) => onSettingsChange({ backgroundGradientStart: e.target.value })}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Gradient End</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.backgroundGradientEnd || '#1a1a1a'}
                  onChange={(e) => onSettingsChange({ backgroundGradientEnd: e.target.value })}
                  className="w-12 h-8 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.backgroundGradientEnd || '#1a1a1a'}
                  onChange={(e) => onSettingsChange({ backgroundGradientEnd: e.target.value })}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Gradient Angle: {settings.backgroundGradientAngle || 180}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={settings.backgroundGradientAngle || 180}
                onChange={(e) => onSettingsChange({ backgroundGradientAngle: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
            </div>
          </>
        )}
      </div>

      {/* Floor Settings */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-white">Floor</h3>
        
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-300">Show Floor</label>
          <button
            onClick={() => onSettingsChange({ floorEnabled: !settings.floorEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.floorEnabled ? 'bg-purple-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.floorEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.floorEnabled && (
          <>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Floor Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.floorColor || '#1A1A1A'}
                  onChange={(e) => onSettingsChange({ floorColor: e.target.value })}
                  className="w-12 h-8 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.floorColor || '#1A1A1A'}
                  onChange={(e) => onSettingsChange({ floorColor: e.target.value })}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Floor Size: {settings.floorSize || 200}
              </label>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={settings.floorSize || 200}
                onChange={(e) => onSettingsChange({ floorSize: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Floor Opacity: {(settings.floorOpacity || 0.8).toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.floorOpacity || 0.8}
                onChange={(e) => onSettingsChange({ floorOpacity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
            </div>
          </>
        )}
      </div>

      {/* Reset Button */}
      {onReset && (
        <div className="pt-4">
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SceneSettings;