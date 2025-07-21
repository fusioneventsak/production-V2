// src/pages/PhotoboothPage.tsx - FIXED: Proper JSX structure for mobile header
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Upload, 
  RotateCcw, 
  Download, 
  Share2, 
  ChevronLeft, 
  Settings, 
  Zap, 
  ZapOff,
  Smartphone,
  Monitor,
  Globe
} from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import { compressImage, COMPRESSION_PRESETS } from '../utils/imageCompression';

// Types
type CameraFacing = 'user' | 'environment';
type PhotoMode = 'camera' | 'upload';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
  deviceInfo?: string;
}

// Device detection
const getDeviceInfo = (): string => {
  const userAgent = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Mac/.test(userAgent)) return 'Mac';
  return 'Unknown';
};

const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Camera component
const CameraCapture: React.FC<{
  onPhotoCapture: (photo: CapturedPhoto) => void;
  facing: CameraFacing;
  onFacingChange: (facing: CameraFacing) => void;
  flashEnabled: boolean;
  onFlashToggle: () => void;
}> = ({ onPhotoCapture, facing, onFacingChange, flashEnabled, onFlashToggle }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Get available camera devices
  const getDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length > 0 && !selectedDeviceId) {
        // Default to back camera on mobile, front camera on desktop
        const preferredDevice = isMobileDevice() 
          ? videoDevices.find(d => d.label.toLowerCase().includes('back')) || videoDevices[0]
          : videoDevices.find(d => d.label.toLowerCase().includes('front')) || videoDevices[0];
        setSelectedDeviceId(preferredDevice.deviceId);
      }
    } catch (err) {
      console.error('Error getting devices:', err);
    }
  }, [selectedDeviceId]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError(`Camera access failed: ${err.message}`);
      setIsStreaming(false);
    }
  }, [facing, selectedDeviceId]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Apply flash effect
    if (flashEnabled) {
      const flashOverlay = document.createElement('div');
      flashOverlay.style.position = 'fixed';
      flashOverlay.style.top = '0';
      flashOverlay.style.left = '0';
      flashOverlay.style.width = '100%';
      flashOverlay.style.height = '100%';
      flashOverlay.style.backgroundColor = 'white';
      flashOverlay.style.zIndex = '9999';
      flashOverlay.style.pointerEvents = 'none';
      document.body.appendChild(flashOverlay);

      setTimeout(() => {
        document.body.removeChild(flashOverlay);
      }, 100);
    }

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    // Create photo object
    const photo: CapturedPhoto = {
      id: `photo-${Date.now()}`,
      dataUrl,
      timestamp: Date.now(),
      deviceInfo: getDeviceInfo()
    };

    onPhotoCapture(photo);
  }, [isStreaming, flashEnabled, onPhotoCapture]);

  // Initialize camera
  useEffect(() => {
    getDevices();
  }, [getDevices]);

  useEffect(() => {
    if (selectedDeviceId) {
      startCamera();
    }
  }, [selectedDeviceId, startCamera]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {error ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="text-red-400 mb-4">
            <Camera className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Camera Error</p>
          </div>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={startCamera}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Camera Controls Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top Controls */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-auto">
              {/* Flash Toggle */}
              <button
                onClick={onFlashToggle}
                className={`p-3 rounded-full backdrop-blur-md border transition-colors ${
                  flashEnabled 
                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' 
                    : 'bg-black/30 border-white/20 text-white/70'
                }`}
              >
                {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
              </button>

              {/* Camera Switch */}
              {devices.length > 1 && (
                <button
                  onClick={() => onFacingChange(facing === 'user' ? 'environment' : 'user')}
                  className="p-3 bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-white/70 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
              <button
                onClick={capturePhoto}
                disabled={!isStreaming}
                className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                <div className="w-full h-full bg-white rounded-full" />
              </button>
            </div>

            {/* Device Selector */}
            {devices.length > 2 && (
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 pointer-events-auto">
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="bg-black/50 backdrop-blur-md border border-white/20 rounded-lg text-white text-sm px-3 py-2"
                >
                  {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${devices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Photo preview component
const PhotoPreview: React.FC<{
  photo: CapturedPhoto;
  onRetake: () => void;
  onUpload: () => void;
  isUploading: boolean;
}> = ({ photo, onRetake, onUpload, isUploading }) => {
  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <img
        src={photo.dataUrl}
        alt="Captured photo"
        className="w-full h-full object-cover"
      />
      
      {/* Controls Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex flex-col justify-end p-6">
        <div className="flex space-x-4">
          <button
            onClick={onRetake}
            disabled={isUploading}
            className="flex-1 py-3 px-6 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
          >
            Retake
          </button>
          <button
            onClick={onUpload}
            disabled={isUploading}
            className="flex-1 py-3 px-6 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// File upload component
const FileUpload: React.FC<{
  onFileSelect: (files: File[]) => void;
  isUploading: boolean;
}> = ({ onFileSelect, isUploading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileSelect(files);
    }
    e.target.value = '';
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <div
        className={`w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
          dragActive 
            ? 'border-purple-400 bg-purple-400/10' 
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          {dragActive ? 'Drop photos here' : 'Upload Photos'}
        </h3>
        <p className="text-gray-400 text-center mb-4">
          Drag and drop photos here, or click to browse
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
        >
          {isUploading ? 'Uploading...' : 'Choose Files'}
        </button>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Supports JPEG, PNG, GIF, WebP • Max 10MB per file
        </p>
      </div>
    </div>
  );
};

// Main PhotoboothPage component
const PhotoboothPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { 
    currentCollage, 
    fetchCollageByCode, 
    uploadPhoto, 
    loading, 
    error,
    cleanupRealtimeSubscription
  } = useCollageStore();

  // State
  const [photoMode, setPhotoMode] = useState<PhotoMode>('camera');
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  // Get available devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
      } catch (err) {
        console.error('Error getting devices:', err);
      }
    };
    
    getDevices();
  }, []);

  // Normalize code and fetch collage
  const normalizedCode = code?.toUpperCase();

  useEffect(() => {
    if (normalizedCode) {
      console.log('🎬 PHOTOBOOTH: Fetching collage with code:', normalizedCode);
      fetchCollageByCode(normalizedCode);
    }
    
    return () => {
      console.log('🎬 PHOTOBOOTH: Cleaning up subscription');
      cleanupRealtimeSubscription();
    };
  }, [normalizedCode, fetchCollageByCode, cleanupRealtimeSubscription]);

  // Handle photo capture
  const handlePhotoCapture = useCallback((photo: CapturedPhoto) => {
    setCapturedPhoto(photo);
  }, []);

  // Handle photo retake
  const handleRetake = useCallback(() => {
    setCapturedPhoto(null);
    setUploadError(null);
  }, []);

  // Handle photo upload
  const handleUpload = useCallback(async () => {
    if (!capturedPhoto || !currentCollage?.id) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Convert data URL to blob
      const response = await fetch(capturedPhoto.dataUrl);
      const blob = await response.blob();
      
      // Create file from blob
      const file = new File([blob], `photo-${capturedPhoto.timestamp}.jpg`, {
        type: 'image/jpeg'
      });

      // Compress the image
      const compressionResult = await compressImage(file, COMPRESSION_PRESETS.balanced);

      // Upload to collage
      await uploadPhoto(currentCollage.id, compressionResult.file);

      // Reset state
      setCapturedPhoto(null);
      
      // Show success message briefly
      setTimeout(() => {
        // Could show a success toast here
      }, 1000);

    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [capturedPhoto, currentCollage?.id, uploadPhoto]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (!currentCollage?.id || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Process files one by one
      for (const file of files) {
        // Validate file
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validImageTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}`);
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File too large: ${file.name}`);
        }

        // Compress the image
        const compressionResult = await compressImage(file, COMPRESSION_PRESETS.balanced);

        // Upload to collage
        await uploadPhoto(currentCollage.id, compressionResult.file);
      }

      // Show success message
      setTimeout(() => {
        // Could show a success toast here
      }, 1000);

    } catch (err: any) {
      console.error('File upload failed:', err);
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [currentCollage?.id, uploadPhoto]);

  // Handle camera facing change
  const handleCameraFacingChange = useCallback((facing: CameraFacing) => {
    setCameraFacing(facing);
  }, []);

  // Handle flash toggle
  const handleFlashToggle = useCallback(() => {
    setFlashEnabled(prev => !prev);
  }, []);

  // Loading state
  if (loading && !currentCollage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="mt-2 text-gray-400">Loading photobooth...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentCollage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Photobooth Not Found</h2>
          <p className="text-gray-400 mb-6">
            {error || `The photobooth "${normalizedCode}" doesn't exist or might have been removed.`}
          </p>
          <div className="space-y-4">
            <Link
              to="/join"
              className="block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
            >
              Try Another Code
            </Link>
            <Link
              to="/"
              className="block px-6 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg transition-colors"
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
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back button and title */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/join" 
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  <span>PhotoSphere</span>
                </h1>
                <p className="text-gray-400">{currentCollage?.name} • Code: {currentCollage?.code}</p>
              </div>
            </div>

            {/* Right side - Mode toggle and settings */}
            <div className="flex items-center space-x-2">
              {/* Mode Toggle */}
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setPhotoMode('camera')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    photoMode === 'camera'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Camera</span>
                </button>
                <button
                  onClick={() => setPhotoMode('upload')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    photoMode === 'upload'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </button>
              </div>

              {/* View Collage Link */}
              <Link
                to={`/collage/${currentCollage.code}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                View Collage
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Upload Error */}
          {uploadError && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              <p>{uploadError}</p>
              <button 
                onClick={() => setUploadError(null)}
                className="mt-2 text-sm underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Camera Mode */}
          {photoMode === 'camera' && (
            <div className="aspect-[9/16] max-w-md mx-auto bg-gray-900 rounded-lg overflow-hidden">
              {capturedPhoto ? (
                <PhotoPreview
                  photo={capturedPhoto}
                  onRetake={handleRetake}
                  onUpload={handleUpload}
                  isUploading={isUploading}
                />
              ) : (
                <CameraCapture
                  onPhotoCapture={handlePhotoCapture}
                  facing={cameraFacing}
                  onFacingChange={handleCameraFacingChange}
                  flashEnabled={flashEnabled}
                  onFlashToggle={handleFlashToggle}
                />
              )}
            </div>
          )}

          {/* Upload Mode */}
          {photoMode === 'upload' && (
            <div className="aspect-[9/16] max-w-md mx-auto bg-gray-900 rounded-lg overflow-hidden">
              <FileUpload
                onFileSelect={handleFileUpload}
                isUploading={isUploading}
              />
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              {photoMode === 'camera' ? 'Take a Photo' : 'Upload Photos'}
            </h2>
            <p className="text-gray-400 mb-6">
              {photoMode === 'camera' 
                ? 'Use the camera to capture moments and add them to the collage instantly.'
                : 'Select photos from your device to add to the collage.'
              }
            </p>
            
            {/* Device Info */}
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                {isMobileDevice() ? (
                  <Smartphone className="w-4 h-4" />
                ) : (
                  <Monitor className="w-4 h-4" />
                )}
                <span>{getDeviceInfo()}</span>
              </div>
              {photoMode === 'camera' && devices.length > 1 && (
                <div className="flex items-center space-x-1">
                  <Camera className="w-4 h-4" />
                  <span>{devices.length} cameras</span>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
            <h3 className="text-purple-300 font-medium mb-3">📸 Photo Tips</h3>
            <ul className="text-purple-200 text-sm space-y-2">
              <li>• Hold your device steady for the best quality</li>
              <li>• Make sure you have good lighting</li>
              <li>• Photos appear in the collage immediately after upload</li>
              <li>• Use the flash in low light conditions</li>
              <li>• Switch between front and back cameras as needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoboothPage;