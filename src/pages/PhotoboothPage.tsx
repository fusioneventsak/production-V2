// src/pages/PhotoboothPage.tsx - COMPLETE PHOTOBOOTH WITH FRAME OVERLAY AND TEXT
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Camera, Download, RotateCcw, Settings, Upload, X, ChevronLeft, Smartphone, Monitor } from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import { supabase } from '../lib/supabase';
import { compressImage, COMPRESSION_PRESETS } from '../utils/imageCompression';
import FrameOverlay from '../components/photobooth/FrameOverlay';

const PhotoboothPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { currentCollage, fetchCollageByCode, uploadPhoto, loading, error } = useCollageStore();
  
  // Camera and capture state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error2, setError2] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Camera settings
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [showSettings, setShowSettings] = useState(false);
  
  // Countdown and capture
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showCaptureButton, setShowCaptureButton] = useState(true);
  
  // Text overlay state
  const [textOverlay, setTextOverlay] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  
  // Frame settings from database
  const [frameSettings, setFrameSettings] = useState({
    selectedFrameUrl: null as string | null,
    frameOpacity: 80,
    enableTextOverlay: true,
    defaultText: '',
    textColor: '#FFFFFF',
    textSize: 24,
    textPosition: 'bottom' as 'top' | 'center' | 'bottom'
  });

  // Normalize code to uppercase for consistent database lookup
  const normalizedCode = code?.toUpperCase();

  // Load collage and settings on mount
  useEffect(() => {
    if (normalizedCode) {
      console.log('📱 PHOTOBOOTH: Loading collage with code:', normalizedCode);
      fetchCollageByCode(normalizedCode);
    }
  }, [normalizedCode, fetchCollageByCode]);

  // Load photobooth settings when collage loads
  useEffect(() => {
    if (currentCollage?.settings?.photobooth) {
      console.log('📱 PHOTOBOOTH: Loading settings from database:', currentCollage.settings.photobooth);
      
      const photoboothSettings = currentCollage.settings.photobooth;
      setFrameSettings({
        selectedFrameUrl: photoboothSettings.selectedFrameUrl || null,
        frameOpacity: photoboothSettings.frameOpacity || 80,
        enableTextOverlay: photoboothSettings.enableTextOverlay !== false,
        defaultText: photoboothSettings.defaultText || currentCollage.name || '',
        textColor: photoboothSettings.textColor || '#FFFFFF',
        textSize: photoboothSettings.textSize || 24,
        textPosition: photoboothSettings.textPosition || 'bottom'
      });
      
      // Set initial text overlay to default text
      if (photoboothSettings.enableTextOverlay !== false) {
        setTextOverlay(photoboothSettings.defaultText || currentCollage.name || '');
      }
    }
  }, [currentCollage]);

  // Get resolution dimensions
  const getResolutionDimensions = () => {
    switch (resolution) {
      case '4k': return { width: 3840, height: 2160 };
      case '1080p': return { width: 1920, height: 1080 };
      case '720p': return { width: 1280, height: 720 };
      default: return { width: 1920, height: 1080 };
    }
  };

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setError2(null);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const dimensions = getResolutionDimensions();
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: dimensions.width },
          height: { ideal: dimensions.height },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      console.log('📱 PHOTOBOOTH: Requesting camera with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
          console.log('📱 PHOTOBOOTH: Camera stream started successfully');
        };
      }
    } catch (err: any) {
      console.error('📱 PHOTOBOOTH: Camera initialization failed:', err);
      setError2(`Camera access failed: ${err.message}`);
      setIsStreaming(false);
    }
  }, [facingMode, resolution]);

  // Initialize camera on mount and when settings change
  useEffect(() => {
    initializeCamera();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeCamera]);

  // Countdown function
  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsCountingDown(false);
          capturePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Capture photo function with frame and text overlay
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      setError2('Camera not ready. Please wait for the camera to initialize.');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setError2('Canvas context not available');
        return;
      }

      // Set canvas dimensions to match video
      const videoWidth = video.videoWidth || video.clientWidth;
      const videoHeight = video.videoHeight || video.clientHeight;
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      console.log('📱 PHOTOBOOTH: Capturing photo at resolution:', videoWidth, 'x', videoHeight);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Apply frame overlay if selected
      if (frameSettings.selectedFrameUrl) {
        console.log('🖼️ PHOTOBOOTH: Applying frame overlay:', frameSettings.selectedFrameUrl);
        
        const frameImg = new Image();
        frameImg.crossOrigin = 'anonymous';
        
        frameImg.onload = () => {
          // Save current context state
          ctx.save();
          
          // Set frame opacity
          ctx.globalAlpha = frameSettings.frameOpacity / 100;
          
          // Draw frame overlay
          ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          
          // Restore context state
          ctx.restore();
          
          // Apply text overlay after frame
          applyTextOverlay(ctx, canvas.width, canvas.height);
          
          // Convert to data URL and set captured photo
          const dataURL = canvas.toDataURL('image/jpeg', 0.9);
          setCapturedPhoto(dataURL);
          setSuccess('Photo captured successfully!');
          setTimeout(() => setSuccess(null), 3000);
        };
        
        frameImg.onerror = () => {
          console.error('🖼️ PHOTOBOOTH: Frame image failed to load');
          // Continue without frame
          applyTextOverlay(ctx, canvas.width, canvas.height);
          const dataURL = canvas.toDataURL('image/jpeg', 0.9);
          setCapturedPhoto(dataURL);
        };
        
        frameImg.src = frameSettings.selectedFrameUrl;
      } else {
        // No frame - just apply text overlay
        applyTextOverlay(ctx, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPhoto(dataURL);
        setSuccess('Photo captured successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
      
    } catch (err: any) {
      console.error('📱 PHOTOBOOTH: Photo capture failed:', err);
      setError2(`Photo capture failed: ${err.message}`);
    }
  }, [isStreaming, frameSettings, textOverlay]);

  // Apply text overlay to canvas
  const applyTextOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!frameSettings.enableTextOverlay || !textOverlay.trim()) {
      return;
    }

    console.log('📝 PHOTOBOOTH: Applying text overlay:', textOverlay);

    // Save context state
    ctx.save();

    // Set text properties
    const fontSize = Math.max(frameSettings.textSize * (width / 800), 16); // Scale with canvas size
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = frameSettings.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text shadow for better readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Calculate text position
    let textY: number;
    switch (frameSettings.textPosition) {
      case 'top':
        textY = fontSize + 20;
        break;
      case 'center':
        textY = height / 2;
        break;
      case 'bottom':
      default:
        textY = height - fontSize - 20;
        break;
    }

    // Draw text
    ctx.fillText(textOverlay, width / 2, textY);

    // Restore context state
    ctx.restore();
  };

  // Upload photo to collage
  const handleUpload = async () => {
    if (!capturedPhoto || !currentCollage) {
      setError2('No photo to upload or collage not loaded');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError2(null);

    try {
      // Convert data URL to blob
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      
      // Create file from blob
      const file = new File([blob], `photobooth-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      console.log('📱 PHOTOBOOTH: Compressing photo before upload...');
      setUploadProgress(20);
      
      // Compress the image
      const compressionResult = await compressImage(file, COMPRESSION_PRESETS.balanced);
      setUploadProgress(50);
      
      console.log('📱 PHOTOBOOTH: Uploading compressed photo to collage...');
      
      // Upload to collage
      await uploadPhoto(currentCollage.id, compressionResult.file);
      setUploadProgress(100);
      
      setSuccess('Photo uploaded to collage successfully!');
      setCapturedPhoto(null); // Clear captured photo
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
        setUploadProgress(0);
      }, 3000);
      
    } catch (err: any) {
      console.error('📱 PHOTOBOOTH: Upload failed:', err);
      setError2(`Upload failed: ${err.message}`);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // Download photo
  const handleDownload = () => {
    if (!capturedPhoto) return;
    
    const link = document.createElement('a');
    link.download = `photobooth-${Date.now()}.jpg`;
    link.href = capturedPhoto;
    link.click();
  };

  // Switch camera
  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Clear messages
  const clearMessages = () => {
    setError2(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="mt-2 text-gray-400">Loading photobooth...</p>
        </div>
      </div>
    );
  }

  if (error || !currentCollage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-white mb-4">PhotoBooth Not Found</h2>
          <p className="text-gray-400 mb-6">
            {error || `The photobooth "${normalizedCode}" doesn't exist or might have been removed.`}
          </p>
          <div className="space-x-4">
            <Link
              to="/join"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              Try Another Code
            </Link>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 hover:text-white hover:border-gray-500"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/join" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  📸 {currentCollage.name}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span>Code: {currentCollage.code}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <Link
                to={`/collage/${currentCollage.code}`}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
              >
                View Collage
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Camera Settings */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Camera Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Resolution</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as any)}
                      className="w-full bg-gray-800 border border-gray-600 rounded text-white text-sm p-2"
                    >
                      <option value="720p">720p (1280x720)</option>
                      <option value="1080p">1080p (1920x1080)</option>
                      <option value="4k">4K (3840x2160)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Camera</label>
                    <button
                      onClick={switchCamera}
                      className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-white text-sm p-2 transition-colors flex items-center justify-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{facingMode === 'user' ? 'Front Camera' : 'Back Camera'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Settings */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Text Overlay</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Event Text</label>
                    <input
                      type="text"
                      value={textOverlay}
                      onChange={(e) => setTextOverlay(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded text-white text-sm p-2"
                      placeholder="Enter text for photos..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Position</label>
                      <select
                        value={frameSettings.textPosition}
                        onChange={(e) => setFrameSettings(prev => ({ ...prev, textPosition: e.target.value as any }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded text-white text-sm p-2"
                      >
                        <option value="top">Top</option>
                        <option value="center">Center</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Size</label>
                      <input
                        type="range"
                        min="12"
                        max="48"
                        value={frameSettings.textSize}
                        onChange={(e) => setFrameSettings(prev => ({ ...prev, textSize: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Frame Settings */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Frame Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Frame Opacity: {frameSettings.frameOpacity}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={frameSettings.frameOpacity}
                      onChange={(e) => setFrameSettings(prev => ({ ...prev, frameOpacity: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  {frameSettings.selectedFrameUrl && (
                    <div className="text-xs text-green-400">
                      Frame active
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Camera Preview */}
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 relative">
                {/* Camera Stream */}
                <div className="relative aspect-[9/16] bg-gray-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                  
                  {/* Frame Overlay */}
                  {frameSettings.selectedFrameUrl && (
                    <FrameOverlay
                      frameUrl={frameSettings.selectedFrameUrl}
                      frameOpacity={frameSettings.frameOpacity}
                      videoDimensions={getResolutionDimensions()}
                    />
                  )}
                  
                  {/* Text Overlay Preview */}
                  {frameSettings.enableTextOverlay && textOverlay && (
                    <div 
                      className={`absolute left-4 right-4 text-center pointer-events-none ${
                        frameSettings.textPosition === 'top' ? 'top-4' :
                        frameSettings.textPosition === 'center' ? 'top-1/2 transform -translate-y-1/2' :
                        'bottom-4'
                      }`}
                      style={{ 
                        color: frameSettings.textColor,
                        fontSize: `${frameSettings.textSize}px`,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        fontWeight: 'bold',
                        zIndex: 20
                      }}
                    >
                      {textOverlay}
                    </div>
                  )}
                  
                  {/* Countdown Overlay */}
                  {isCountingDown && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                      <div className="text-8xl font-bold text-white animate-pulse">
                        {countdown}
                      </div>
                    </div>
                  )}
                  
                  {/* Camera Status */}
                  {!isStreaming && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">Initializing camera...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Camera Controls */}
                <div className="p-4 bg-gray-800 flex items-center justify-center space-x-4">
                  {showCaptureButton && !isCountingDown && (
                    <button
                      onClick={startCountdown}
                      disabled={!isStreaming}
                      className="w-16 h-16 bg-white hover:bg-gray-200 disabled:bg-gray-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                    >
                      <div className="w-12 h-12 bg-red-500 rounded-full"></div>
                    </button>
                  )}
                  
                  <button
                    onClick={switchCamera}
                    disabled={!isStreaming}
                    className="p-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-full transition-colors"
                    title="Switch Camera"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Text Input */}
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add Text to Photos
                </label>
                <input
                  type="text"
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg text-white p-3"
                  placeholder={frameSettings.defaultText || "Enter text for your photos..."}
                />
                <p className="text-xs text-gray-400 mt-2">
                  This text will appear on all captured photos
                </p>
              </div>
            </div>
            
            {/* Captured Photo & Actions */}
            <div className="space-y-4">
              {capturedPhoto ? (
                <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="text-lg font-medium text-white">Captured Photo</h3>
                  </div>
                  
                  <div className="relative">
                    <img
                      src={capturedPhoto}
                      alt="Captured"
                      className="w-full h-auto"
                    />
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Uploading...</span>
                          <span className="text-gray-400">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{isUploading ? 'Uploading...' : 'Add to Collage'}</span>
                      </button>
                      
                      <button
                        onClick={handleDownload}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setCapturedPhoto(null)}
                      className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                    >
                      Take Another Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 rounded-xl border border-gray-700 p-8 text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Ready to Capture</h3>
                  <p className="text-gray-400 mb-4">
                    Position yourself in the camera view and press the capture button
                  </p>
                  {frameSettings.selectedFrameUrl && (
                    <p className="text-green-400 text-sm">
                      Custom frame will be applied to your photo
                    </p>
                  )}
                </div>
              )}
              
              {/* Messages */}
              {(error2 || success) && (
                <div className={`p-4 rounded-lg border ${
                  error2 
                    ? 'bg-red-900/50 border-red-500/50 text-red-200' 
                    : 'bg-green-900/50 border-green-500/50 text-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{error2 || success}</span>
                    <button
                      onClick={clearMessages}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Instructions */}
              <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
                <h4 className="text-sm font-medium text-white mb-2">How to Use</h4>
                <ol className="text-xs text-gray-400 space-y-1">
                  <li>1. Position yourself in the camera view</li>
                  <li>2. Add custom text if desired</li>
                  <li>3. Press the red capture button</li>
                  <li>4. Wait for the 3-second countdown</li>
                  <li>5. Upload to the collage or download</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden canvas for photo capture */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default PhotoboothPage;