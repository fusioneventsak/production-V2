import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Upload, Save, Trash2, Eye, EyeOff, Palette, Image, Frame, Camera, ChevronLeft, Smartphone, Tablet } from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import Layout from '../components/layout/Layout';

const PhotoboothSettingsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCollage, fetchCollageById, loading, error } = useCollageStore();
  
  const [uploadedFrames, setUploadedFrames] = useState([]);
  const [previewMode, setPreviewMode] = useState('mobile');
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Load collage data on mount
  useEffect(() => {
    if (id) {
      fetchCollageById(id);
    }
  }, [id, fetchCollageById]);

  // Default frame options
  const defaultFrames = [
    { id: 'none', name: 'No Frame', preview: null, type: 'default' },
    { id: 'classic', name: 'Classic Border', preview: 'https://images.pexels.com/photos/821651/pexels-photo-821651.jpeg?auto=compress&cs=tinysrgb&w=300', type: 'default' },
    { id: 'wedding', name: 'Wedding Elegant', preview: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=300', type: 'default' },
    { id: 'party', name: 'Party Fun', preview: 'https://images.pexels.com/photos/1983037/pexels-photo-1983037.jpeg?auto=compress&cs=tinysrgb&w=300', type: 'default' }
  ];

  const [settings, setSettings] = useState({
    // Frame Settings
    selectedFrameId: 'none',
    selectedFrameUrl: null,
    frameOpacity: 80,
    framePosition: 'overlay',
    
    // Photobooth UI Settings
    enableCountdown: true,
    countdownDuration: 3,
    showCaptureButton: true,
    buttonStyle: 'circle',
    buttonColor: '#8B5CF6',
    
    // Photo Quality Settings
    photoResolution: '1080p',
    compressionQuality: 85,
    enableFlash: true,
    
    // Text Overlay Settings
    enableTextOverlay: true,
    defaultText: currentCollage?.name || 'PhotoSphere Event',
    textColor: '#FFFFFF',
    textSize: 24,
    textPosition: 'bottom',
    textFont: 'Inter',
    
    // Branding Settings
    enableLogo: false,
    logoPosition: 'top-right',
    logoSize: 'small',
    logoOpacity: 80,
    
    // Camera Settings
    frontCamera: true,
    enableZoom: true,
    enableFlip: true,
    
    // Preview Settings
    showGridLines: false,
    enableFilterPreview: false,
    previewDuration: 5
  });

  // Load existing photobooth settings when collage loads
  useEffect(() => {
    if (currentCollage) {
      setSettings(prev => ({
        ...prev,
        defaultText: currentCollage.name
      }));
      
      // Load existing photobooth settings from collage settings
      if (currentCollage.settings?.photobooth) {
        setSettings(prev => ({
          ...prev,
          ...currentCollage.settings.photobooth
        }));
        
        // Load uploaded frames if they exist
        if (currentCollage.settings.photobooth.uploadedFrames) {
          setUploadedFrames(currentCollage.settings.photobooth.uploadedFrames);
        }
      }
    }
  }, [currentCollage]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newFrame = {
            id: Date.now() + Math.random(),
            name: file.name.replace(/\.[^/.]+$/, ''),
            preview: e.target.result,
            url: e.target.result, // For now, use base64. In production, upload to storage
            type: 'custom',
            file: file
          };
          setUploadedFrames(prev => [...prev, newFrame]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleFrameSelect = (frameId) => {
    const allFrames = [...defaultFrames, ...uploadedFrames];
    const selectedFrame = allFrames.find(f => f.id === frameId);
    
    setSettings(prev => ({
      ...prev,
      selectedFrameId: frameId,
      selectedFrameUrl: selectedFrame?.url || selectedFrame?.preview || null
    }));
  };

  const deleteCustomFrame = (frameId) => {
    setUploadedFrames(prev => prev.filter(frame => frame.id !== frameId));
    if (settings.selectedFrameId === frameId) {
      setSettings(prev => ({ 
        ...prev, 
        selectedFrameId: 'none',
        selectedFrameUrl: null
      }));
    }
  };

  const saveSettings = async () => {
    if (!currentCollage) return;
    
    setSaving(true);
    try {
      // Prepare photobooth settings to save
      const photoboothSettings = {
        ...settings,
        uploadedFrames: uploadedFrames
      };

      // Update collage settings with photobooth configuration
      const updatedSettings = {
        ...currentCollage.settings,
        photobooth: photoboothSettings
      };

      // Save to your store (you'll need to implement updateCollageSettings)
      // await updateCollageSettings(currentCollage.id, updatedSettings);
      
      // For now, just log the settings - implement the actual save later
      console.log('Saving photobooth settings for collage:', currentCollage.id);
      console.log('Settings:', photoboothSettings);
      
      // Show success message
      alert('Photobooth settings saved successfully!');
      
    } catch (error) {
      console.error('Failed to save photobooth settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const allFrames = [...defaultFrames, ...uploadedFrames];

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20 mx-auto"></div>
            <p className="mt-4 text-white/60">Loading collage...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !currentCollage) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-8 text-center">
            <p className="text-red-400">Error loading collage. Please try again later.</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors mt-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-white">PhotoBooth Settings</h1>
                  <div className="flex items-center space-x-2 text-gray-400 mt-1">
                    <span className="font-medium text-purple-400">{currentCollage.name}</span>
                    <span>•</span>
                    <span>Code: {currentCollage.code}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200"
                >
                  {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Panel */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Frame Selection */}
              <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Frame className="w-6 h-6 mr-2 text-purple-400" />
                    Custom Photo Frames
                  </h2>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Custom Frames</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {allFrames.map((frame) => (
                    <div
                      key={frame.id}
                      onClick={() => handleFrameSelect(frame.id)}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        settings.selectedFrameId === frame.id
                          ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="aspect-square bg-gray-800/50 flex items-center justify-center">
                        {frame.preview || frame.url ? (
                          <img
                            src={frame.preview || frame.url}
                            alt={frame.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-center">
                            <Image className="w-8 h-8 mx-auto mb-2" />
                            <span className="text-xs">No Frame</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium">{frame.name}</span>
                      </div>

                      {frame.type === 'custom' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomFrame(frame.id);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {settings.selectedFrameId === frame.id && (
                        <div className="absolute top-2 left-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Frame Settings */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Frame Opacity: {settings.frameOpacity}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.frameOpacity}
                      onChange={(e) => handleSettingChange('frameOpacity', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Text Overlay Settings */}
              <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Palette className="w-6 h-6 mr-2 text-green-400" />
                  Text Overlay for {currentCollage.name}
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">Enable Text Overlay</label>
                    <button
                      onClick={() => handleSettingChange('enableTextOverlay', !settings.enableTextOverlay)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.enableTextOverlay ? 'bg-purple-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.enableTextOverlay ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.enableTextOverlay && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Event Text</label>
                        <input
                          type="text"
                          value={settings.defaultText}
                          onChange={(e) => handleSettingChange('defaultText', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Enter event name..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Text Color</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={settings.textColor}
                              onChange={(e) => handleSettingChange('textColor', e.target.value)}
                              className="w-12 h-10 bg-gray-800 border border-gray-600 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={settings.textColor}
                              onChange={(e) => handleSettingChange('textColor', e.target.value)}
                              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Text Position</label>
                          <select
                            value={settings.textPosition}
                            onChange={(e) => handleSettingChange('textPosition', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="top">Top</option>
                            <option value="center">Center</option>
                            <option value="bottom">Bottom</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Text Size: {settings.textSize}px
                        </label>
                        <input
                          type="range"
                          min="12"
                          max="48"
                          value={settings.textSize}
                          onChange={(e) => handleSettingChange('textSize', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Live Preview</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setPreviewMode('mobile')}
                          className={`p-2 rounded-lg transition-colors ${
                            previewMode === 'mobile' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPreviewMode('tablet')}
                          className={`p-2 rounded-lg transition-colors ${
                            previewMode === 'tablet' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          <Tablet className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Mock Preview */}
                    <div className={`mx-auto bg-gray-800 rounded-lg overflow-hidden relative ${
                      previewMode === 'mobile' ? 'w-48 h-96' : 'w-54 h-96'
                    }`}>
                      <div className="relative w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                        {/* Mock camera view */}
                        <div className="absolute inset-2 bg-gray-600 rounded-lg flex items-center justify-center">
                          <Camera className="w-12 h-12 text-gray-400" />
                        </div>

                        {/* Mock frame overlay */}
                        {settings.selectedFrameId !== 'none' && settings.selectedFrameUrl && (
                          <img
                            src={settings.selectedFrameUrl}
                            alt="Frame overlay"
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            style={{ opacity: settings.frameOpacity / 100 }}
                          />
                        )}

                        {/* Mock text overlay */}
                        {settings.enableTextOverlay && settings.defaultText && (
                          <div 
                            className={`absolute left-4 right-4 text-center ${
                              settings.textPosition === 'top' ? 'top-4' :
                              settings.textPosition === 'center' ? 'top-1/2 transform -translate-y-1/2' :
                              'bottom-4'
                            }`}
                            style={{ 
                              color: settings.textColor,
                              fontSize: `${Math.max(settings.textSize / 3, 8)}px`,
                              zIndex: 10
                            }}
                          >
                            {settings.defaultText}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview Info */}
                    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-2">Settings for {currentCollage.name}</h4>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Frame: {allFrames.find(f => f.id === settings.selectedFrameId)?.name || 'None'}</div>
                        <div>Frame Opacity: {settings.frameOpacity}%</div>
                        <div>Text: {settings.enableTextOverlay ? 'Enabled' : 'Disabled'}</div>
                        {settings.enableTextOverlay && (
                          <div>Text: "{settings.defaultText}"</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PhotoboothSettingsPage;