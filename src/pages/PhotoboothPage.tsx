import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Camera, Download, Upload, Settings, X, RotateCcw, Zap, ZapOff, Smartphone, Monitor, Palette, Type, Image as ImageIcon, Eye, EyeOff, ChevronLeft, Share2 } from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import { compressImage, COMPRESSION_PRESETS } from '../utils/imageCompression';
import FrameOverlay from '../components/photobooth/FrameOverlay';

const PhotoboothPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { 
    currentCollage, 
    fetchCollageByCode, 
    uploadPhoto, 
    loading, 
    error 
  } = useCollageStore();

  // Camera and capture states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Camera settings
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('mobile');

  // Photobooth settings from collage
  const [photoboothSettings, setPhotoboothSettings] = useState({
    selectedFrameId: 'none',
    selectedFrameUrl: null,
    frameOpacity: 80,
    enableTextOverlay: true,
    defaultText: '',
    textColor: '#FFFFFF',
    textSize: 24,
    textPosition: 'bottom',
    enableCountdown: true,
    countdownDuration: 3,
    uploadedFrames: []
  });

  // Detect device type
  useEffect(() => {
    const checkDeviceType = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setDeviceType(isMobileDevice ? 'mobile' : 'desktop');
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  // Load collage and photobooth settings
  useEffect(() => {
    if (code) {
      console.log('📸 PHOTOBOOTH: Loading collage with code:', code);
      fetchCollageByCode(code.toUpperCase()).then(() => {
        console.log('📸 PHOTOBOOTH: Collage loaded successfully');
      }).catch(err => {
        console.error('📸 PHOTOBOOTH: Error loading collage:', err);
      });
    }
  }, [code, fetchCollageByCode]);

  // Load photobooth settings when collage loads
  useEffect(() => {
    if (currentCollage?.settings?.photobooth) {
      console.log('📸 PHOTOBOOTH: Loading photobooth settings:', currentCollage.settings.photobooth);
      setPhotoboothSettings(prev => ({
        ...prev,
        ...currentCollage.settings.photobooth,
        defaultText: currentCollage.settings.photobooth.defaultText || currentCollage.name
      }));
    } else if (currentCollage) {
      // Set default text to collage name if no photobooth settings exist
      setPhotoboothSettings(prev => ({
        ...prev,
        defaultText: currentCollage.name
      }));
    }
  }, [currentCollage]);

  // Camera initialization
  const initializeCamera = useCallback(async () => {
    try {
      setCameraError(null);
      console.log('📸 PHOTOBOOTH: Initializing camera with facing mode:', facingMode);

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: deviceType === 'mobile' ? 720 : 1280 },
          height: { ideal: deviceType === 'mobile' ? 1280 : 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        console.log('📸 PHOTOBOOTH: Camera initialized successfully');
      }
    } catch (error) {
      console.error('📸 PHOTOBOOTH: Camera initialization error:', error);
      setCameraError('Unable to access camera. Please check permissions and try again.');
      setIsCameraActive(false);
    }
  }, [facingMode, deviceType]);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeCamera]);

  // Countdown logic
  const startCountdown = useCallback(() => {
    if (!photoboothSettings.enableCountdown) {
      capturePhoto();
      return;
    }

    const duration = photoboothSettings.countdownDuration || 3;
    setCountdown(duration);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            setCountdown(null);
            capturePhoto();
          }, 1000);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [photoboothSettings.enableCountdown, photoboothSettings.countdownDuration]);

  // Flash effect
  const triggerFlash = useCallback(() => {
    if (flashEnabled) {
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 200);
    }
  }, [flashEnabled]);

  // Capture photo function
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);
    triggerFlash();

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Unable to get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Add text overlay if enabled
      if (photoboothSettings.enableTextOverlay && photoboothSettings.defaultText) {
        context.save();
        
        // Calculate responsive font size
        const baseFontSize = Math.min(canvas.width, canvas.height) * 0.05;
        const fontSize = Math.max(baseFontSize, 24);
        
        context.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
        context.fillStyle = photoboothSettings.textColor;
        context.textAlign = 'center';
        context.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        context.lineWidth = fontSize * 0.1;

        // Position text based on settings
        let textY;
        switch (photoboothSettings.textPosition) {
          case 'top':
            textY = fontSize + 20;
            break;
          case 'center':
            textY = canvas.height / 2;
            break;
          case 'bottom':
          default:
            textY = canvas.height - 30;
            break;
        }

        const textX = canvas.width / 2;
        
        // Draw text with stroke for better visibility
        context.strokeText(photoboothSettings.defaultText, textX, textY);
        context.fillText(photoboothSettings.defaultText, textX, textY);
        
        context.restore();
      }

      // Convert to data URL
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(dataURL);
      
      console.log('📸 PHOTOBOOTH: Photo captured successfully');
    } catch (error) {
      console.error('📸 PHOTOBOOTH: Error capturing photo:', error);
      setCameraError('Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, triggerFlash, photoboothSettings]);

  // Upload photo to collage
  const uploadCapturedPhoto = useCallback(async () => {
    if (!capturedPhoto || !currentCollage) return;

    setUploadStatus('uploading');
    setUploadError(null);

    try {
      // Convert data URL to blob
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      
      // Create file from blob
      const file = new File([blob], `photobooth-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Compress the image
      const compressionResult = await compressImage(file, COMPRESSION_PRESETS.balanced);
      
      // Upload to collage
      await uploadPhoto(currentCollage.id, compressionResult.file);
      
      setUploadStatus('success');
      console.log('📸 PHOTOBOOTH: Photo uploaded successfully');
      
      // Reset after success
      setTimeout(() => {
        setCapturedPhoto(null);
        setUploadStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('📸 PHOTOBOOTH: Upload error:', error);
      setUploadError(error.message || 'Failed to upload photo');
      setUploadStatus('error');
    }
  }, [capturedPhoto, currentCollage, uploadPhoto]);

  // Download photo
  const downloadPhoto = useCallback(() => {
    if (!capturedPhoto) return;

    const link = document.createElement('a');
    link.href = capturedPhoto;
    link.download = `photobooth-${Date.now()}.jpg`;
    link.click();
  }, [capturedPhoto]);

  // Switch camera
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    setUploadStatus('idle');
    setUploadError(null);
  }, []);

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
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">Photobooth Not Found</h2>
          <p className="text-gray-400 mb-6">
            {error || `The photobooth "${code}" doesn't exist or might have been removed.`}
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
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to={`/collage/${currentCollage.code}`}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">📸 PhotoBooth</h1>
                <p className="text-sm text-gray-400">{currentCollage.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to={`/collage/${currentCollage.code}`}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-white/15 hover:bg-white/25 text-white/90 text-sm rounded-lg transition-colors backdrop-blur-md border border-white/20"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">View Gallery</span>
              </Link>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-white/15 hover:bg-white/25 text-white/90 rounded-lg transition-colors backdrop-blur-md border border-white/20"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Flash overlay */}
      {flashActive && (
        <div className="fixed inset-0 bg-white z-50 pointer-events-none" />
      )}

      {/* Main Content */}
      <div className="flex-1 p-4">
        {deviceType === 'mobile' ? (
          /* Mobile Layout - Full Screen */
          <div className="h-[calc(100vh-120px)] flex flex-col">
            {/* Camera Preview */}
            <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden">
              {cameraError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center p-6">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-4">{cameraError}</p>
                    <button
                      onClick={initializeCamera}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                  
                  {/* Frame Overlay */}
                  {photoboothSettings.selectedFrameUrl && (
                    <FrameOverlay
                      frameUrl={photoboothSettings.selectedFrameUrl}
                      frameOpacity={photoboothSettings.frameOpacity}
                      videoDimensions={{ width: 720, height: 1280 }}
                    />
                  )}
                  
                  {/* Text Overlay Preview */}
                  {photoboothSettings.enableTextOverlay && photoboothSettings.defaultText && (
                    <div 
                      className={`absolute left-4 right-4 text-center pointer-events-none ${
                        photoboothSettings.textPosition === 'top' ? 'top-4' :
                        photoboothSettings.textPosition === 'center' ? 'top-1/2 transform -translate-y-1/2' :
                        'bottom-4'
                      }`}
                      style={{ 
                        color: photoboothSettings.textColor,
                        fontSize: `${photoboothSettings.textSize}px`,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        fontWeight: 'bold',
                        zIndex: 5
                      }}
                    >
                      {photoboothSettings.defaultText}
                    </div>
                  )}
                  
                  {/* Countdown Overlay */}
                  {countdown !== null && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <div className="text-8xl font-bold text-white animate-pulse">
                        {countdown}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={switchCamera}
                  className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors"
                  title="Switch Camera"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setFlashEnabled(!flashEnabled)}
                  className={`p-3 rounded-full transition-colors ${
                    flashEnabled ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 hover:bg-gray-600'
                  } text-white`}
                  title={flashEnabled ? 'Disable Flash' : 'Enable Flash'}
                >
                  {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                </button>
              </div>

              {/* Capture Button */}
              <button
                onClick={startCountdown}
                disabled={!isCameraActive || isCapturing || countdown !== null}
                className="w-20 h-20 bg-white border-4 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Take Photo"
              >
                <div className="w-16 h-16 bg-white rounded-full shadow-inner" />
              </button>

              <div className="w-16" /> {/* Spacer for centering */}
            </div>
          </div>
        ) : (
          /* Desktop Layout - Side by Side */
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-160px)]">
              {/* Camera Section */}
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Camera className="w-6 h-6 mr-2" />
                  Camera Preview
                </h2>
                
                {/* Camera Preview - Fixed smaller size for desktop */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden w-80 h-[480px] mx-auto">
                  {cameraError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <div className="text-center p-6">
                        <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-300 mb-4 text-sm">{cameraError}</p>
                        <button
                          onClick={initializeCamera}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                      />
                      
                      {/* Frame Overlay */}
                      {photoboothSettings.selectedFrameUrl && (
                        <FrameOverlay
                          frameUrl={photoboothSettings.selectedFrameUrl}
                          frameOpacity={photoboothSettings.frameOpacity}
                          videoDimensions={{ width: 320, height: 480 }}
                        />
                      )}
                      
                      {/* Text Overlay Preview */}
                      {photoboothSettings.enableTextOverlay && photoboothSettings.defaultText && (
                        <div 
                          className={`absolute left-2 right-2 text-center pointer-events-none ${
                            photoboothSettings.textPosition === 'top' ? 'top-2' :
                            photoboothSettings.textPosition === 'center' ? 'top-1/2 transform -translate-y-1/2' :
                            'bottom-2'
                          }`}
                          style={{ 
                            color: photoboothSettings.textColor,
                            fontSize: `${Math.max(photoboothSettings.textSize / 2, 12)}px`,
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            fontWeight: 'bold',
                            zIndex: 5
                          }}
                        >
                          {photoboothSettings.defaultText}
                        </div>
                      )}
                      
                      {/* Countdown Overlay */}
                      {countdown !== null && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                          <div className="text-6xl font-bold text-white animate-pulse">
                            {countdown}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Desktop Camera Controls */}
                <div className="mt-6 flex items-center justify-center space-x-4">
                  <button
                    onClick={switchCamera}
                    className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    title="Switch Camera"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => setFlashEnabled(!flashEnabled)}
                    className={`p-3 rounded-lg transition-colors ${
                      flashEnabled ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 hover:bg-gray-600'
                    } text-white`}
                    title={flashEnabled ? 'Disable Flash' : 'Enable Flash'}
                  >
                    {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                  </button>

                  {/* Desktop Capture Button */}
                  <button
                    onClick={startCountdown}
                    disabled={!isCameraActive || isCapturing || countdown !== null}
                    className="w-20 h-20 bg-white border-4 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Take Photo"
                  >
                    <div className="w-16 h-16 bg-white rounded-full shadow-inner" />
                  </button>
                </div>
              </div>

              {/* Controls Section */}
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-white mb-4">Photo Actions</h2>
                
                {capturedPhoto ? (
                  /* Photo Review */
                  <div className="space-y-4">
                    <div className="relative bg-gray-900 rounded-lg overflow-hidden w-80 h-[480px] mx-auto">
                      <img
                        src={capturedPhoto}
                        alt="Captured photo"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-3">
                      {uploadStatus === 'idle' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={uploadCapturedPhoto}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                          >
                            <Upload className="w-5 h-5" />
                            <span>Add to Gallery</span>
                          </button>
                          
                          <button
                            onClick={downloadPhoto}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                          >
                            <Download className="w-5 h-5" />
                            <span>Download</span>
                          </button>
                        </div>
                      )}

                      {uploadStatus === 'uploading' && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-blue-300">Uploading to gallery...</span>
                          </div>
                        </div>
                      )}

                      {uploadStatus === 'success' && (
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                            <span className="text-green-300">Photo added to gallery!</span>
                          </div>
                        </div>
                      )}

                      {uploadStatus === 'error' && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                          <p className="text-red-300 text-sm">
                            {uploadError || 'Failed to upload photo'}
                          </p>
                          <button
                            onClick={uploadCapturedPhoto}
                            className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
                          >
                            Try Again
                          </button>
                        </div>
                      )}

                      <button
                        onClick={retakePhoto}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
                      >
                        Take Another Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Instructions */
                  <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-4">How to Use</h3>
                      <ol className="space-y-2 text-gray-300 text-sm">
                        <li className="flex items-start">
                          <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
                          Position yourself in the camera preview
                        </li>
                        <li className="flex items-start">
                          <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
                          Click the capture button to take your photo
                        </li>
                        <li className="flex items-start">
                          <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
                          Review and add your photo to the gallery
                        </li>
                      </ol>
                    </div>

                    {/* Event Info */}
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-2">{currentCollage.name}</h3>
                      <p className="text-purple-200 text-sm mb-4">
                        Share your memories with everyone at this event!
                      </p>
                      <div className="text-xs text-purple-300">
                        Event Code: <span className="font-mono bg-purple-800/30 px-2 py-1 rounded">{currentCollage.code}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Camera Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Device Type Display */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Device Type</span>
                  <div className="flex items-center space-x-2">
                    {deviceType === 'mobile' ? (
                      <>
                        <Smartphone className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400">Mobile</span>
                      </>
                    ) : (
                      <>
                        <Monitor className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Desktop</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Camera Direction */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Camera</span>
                  <button
                    onClick={switchCamera}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    {facingMode === 'user' ? 'Front Camera' : 'Back Camera'}
                  </button>
                </div>

                {/* Flash Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Flash</span>
                  <button
                    onClick={() => setFlashEnabled(!flashEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      flashEnabled ? 'bg-yellow-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        flashEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Frame Info */}
                {photoboothSettings.selectedFrameId !== 'none' && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Active Frame</h4>
                    <p className="text-gray-300 text-sm">
                      Frame overlay is active with {photoboothSettings.frameOpacity}% opacity
                    </p>
                  </div>
                )}

                {/* Text Overlay Info */}
                {photoboothSettings.enableTextOverlay && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Text Overlay</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      "{photoboothSettings.defaultText}"
                    </p>
                    <div className="text-xs text-gray-400">
                      Position: {photoboothSettings.textPosition} • 
                      Size: {photoboothSettings.textSize}px • 
                      Color: {photoboothSettings.textColor}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PhotoboothPage;