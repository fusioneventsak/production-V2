import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Upload, Save, Trash2, Eye, EyeOff, Palette, Image, Frame, Camera, ChevronLeft, Smartphone, Tablet } from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import { supabase } from '../lib/supabase';
import Layout from '../components/layout/Layout';

const PhotoboothSettingsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCollage, fetchCollageById, loading, error } = useCollageStore();
  
  const [uploadedFrames, setUploadedFrames] = useState([]);
  const [previewMode, setPreviewMode] = useState('mobile');
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
        console.log('📋 Loading existing photobooth settings:', currentCollage.settings.photobooth);
        
        setSettings(prev => ({
          ...prev,
          ...currentCollage.settings.photobooth
        }));
        
        // Load uploaded frames if they exist
        if (currentCollage.settings.photobooth.uploadedFrames) {
          console.log('🖼️ Loading uploaded frames:', currentCollage.settings.photobooth.uploadedFrames);
          setUploadedFrames(currentCollage.settings.photobooth.uploadedFrames);
        }
      }
    }
  }, [currentCollage]);

  // Helper function to save settings to database
  const saveToDatabase = async (photoboothSettings) => {
    if (!currentCollage?.id) return false;

    try {
      const updatedSettings = {
        ...currentCollage.settings,
        photobooth: photoboothSettings
      };

      console.log('💾 Saving to database:', updatedSettings);

      // First, try to get existing settings
      const { data: existingSettings, error: fetchError } = await supabase
        .from('collage_settings')
        .select('*')
        .eq('collage_id', currentCollage.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Error other than "not found"
        console.error('❌ Error fetching existing settings:', fetchError);
        throw fetchError;
      }

      let result;
      if (existingSettings) {
        // Update existing record
        console.log('📝 Updating existing settings record');
        result = await supabase
          .from('collage_settings')
          .update({
            settings: updatedSettings,
            updated_at: new Date().toISOString()
          })
          .eq('collage_id', currentCollage.id);
      } else {
        // Insert new record
        console.log('➕ Creating new settings record');
        result = await supabase
          .from('collage_settings')
          .insert({
            collage_id: currentCollage.id,
            settings: updatedSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) {
        console.error('❌ Database save error:', result.error);
        throw result.error;
      }

      console.log('✅ Settings saved to database successfully');
      
      // Update the current collage in memory with the new settings
      if (currentCollage) {
        currentCollage.settings = updatedSettings;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to save to database:', error);
      return false;
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (!currentCollage?.id) {
      alert('No collage selected for frame upload');
      return;
    }
    
    setUploading(true);
    let newFrames = [];
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          // Upload to Supabase Storage in the new structure
          const fileExt = file.name.split('.').pop();
          const fileName = `photobooth-frames/${currentCollage.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          
          console.log('📤 Uploading frame to:', fileName);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName);

          console.log('✅ Frame uploaded successfully:', publicUrl);

          // Add to uploaded frames
          const newFrame = {
            id: Date.now() + Math.random(),
            name: file.name.replace(/\.[^/.]+$/, ''),
            preview: publicUrl,
            url: publicUrl,
            type: 'custom',
            storagePath: fileName
          };
          
          newFrames.push(newFrame);
          
        } catch (error) {
          console.error('Failed to upload frame:', error);
          alert(`Failed to upload ${file.name}. Please try again.`);
        }
      }
    }
    
    if (newFrames.length > 0) {
      const updatedFrames = [...uploadedFrames, ...newFrames];
      setUploadedFrames(updatedFrames);
      
      // **AUTO-SAVE: Save uploaded frames immediately**
      const photoboothSettings = {
        ...settings,
        uploadedFrames: updatedFrames
      };

      const saveSuccess = await saveToDatabase(photoboothSettings);
      if (saveSuccess) {
        console.log('✅ Uploaded frames auto-saved');
      } else {
        console.error('❌ Failed to auto-save uploaded frames');
      }
    }
    
    setUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleFrameSelect = async (frameId) => {
    const allFrames = [...defaultFrames, ...uploadedFrames];
    const selectedFrame = allFrames.find(f => f.id === frameId);
    
    const newSettings = {
      ...settings,
      selectedFrameId: frameId,
      selectedFrameUrl: selectedFrame?.url || selectedFrame?.preview || null
    };
    
    setSettings(newSettings);
    
    // **AUTO-SAVE: Immediately save frame selection**
    if (currentCollage?.id) {
      console.log('🖼️ Auto-saving frame selection:', frameId);
      
      const photoboothSettings = {
        ...newSettings,
        uploadedFrames: uploadedFrames
      };

      const saveSuccess = await saveToDatabase(photoboothSettings);
      if (saveSuccess) {
        console.log('✅ Frame selection auto-saved');
      } else {
        console.error('❌ Failed to auto-save frame selection');
      }
    }
  };

  const deleteCustomFrame = async (frameId) => {
    const frameToDelete = uploadedFrames.find(frame => frame.id === frameId);
    if (!frameToDelete) return;
    
    try {
      // Delete from storage if it has a storage path
      if (frameToDelete.storagePath) {
        console.log('🗑️ Deleting frame from storage:', frameToDelete.storagePath);
        
        const { error: deleteError } = await supabase.storage
          .from('photos')
          .remove([frameToDelete.storagePath]);
        
        if (deleteError) {
          console.warn('Failed to delete from storage:', deleteError);
          // Continue with local deletion even if storage deletion fails
        }
      }
      
      // Remove from local state
      const updatedFrames = uploadedFrames.filter(frame => frame.id !== frameId);
      setUploadedFrames(updatedFrames);
      
      // Reset selection if this frame was selected
      let updatedSettings = settings;
      if (settings.selectedFrameId === frameId) {
        updatedSettings = { 
          ...settings, 
          selectedFrameId: 'none',
          selectedFrameUrl: null
        };
        setSettings(updatedSettings);
      }
      
      // **AUTO-SAVE: Save after deletion**
      const photoboothSettings = {
        ...updatedSettings,
        uploadedFrames: updatedFrames
      };

      const saveSuccess = await saveToDatabase(photoboothSettings);
      if (saveSuccess) {
        console.log('✅ Frame deletion auto-saved');
      } else {
        console.error('❌ Failed to auto-save after frame deletion');
      }
      
    } catch (error) {
      console.error('Error deleting frame:', error);
      alert('Failed to delete frame. Please try again.');
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

      console.log('💾 Manual save - photobooth settings for collage:', currentCollage.id);
      console.log('📋 Settings to save:', photoboothSettings);

      const saveSuccess = await saveToDatabase(photoboothSettings);
      
      if (saveSuccess) {
        alert('Photobooth settings saved successfully!');
      } else {
        throw new Error('Failed to save to database');
      }
      
    } catch (error) {
      console.error('❌ Failed to save photobooth settings:', error);
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
                <Link
                  to={`/photobooth/${currentCollage.code}`}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200"
                >
                  <Camera className="w-5 h-5" />
                  <span>Test PhotoBooth</span>
                </Link>
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
                    disabled={uploading}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload Custom Frames</span>
                      </>
                    )}
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
                          title="Delete custom frame"
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
            
            {/* Upload Progress/Status */}
            {uploading && (
              <div className="lg:col-span-3">
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-blue-300 text-sm">Uploading frames to storage...</span>
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