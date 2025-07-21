import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, RotateCcw, Download, Upload, Type, Palette, Sparkles, SwitchCamera, Settings, X, Check } from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import { compressImage, COMPRESSION_PRESETS } from '../utils/imageCompression';

// Text overlay component
const TextOverlay: React.FC<{
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  fontFamily: string;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: any) => void;
}> = ({ text, position, fontSize, color, fontFamily, isSelected, onSelect, onUpdate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    onSelect();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      onUpdate({
        position: {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        }
      });
    }
  }, [isDragging, dragStart, onUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`absolute cursor-move select-none ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        fontSize: `${fontSize}px`,
        color: color,
        fontFamily: fontFamily,
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        zIndex: 20
      }}
      onMouseDown={handleMouseDown}
      onClick={onSelect}
    >
      {text}
    </div>
  );
};

const PhotoboothPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { currentCollage, fetchCollageByCode, uploadPhoto } = useCollageStore();
  
  // Camera and photo states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isUploading, setIsUploading] = useState(false);
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  
  // Text editing states
  const [textOverlays, setTextOverlays] = useState<Array<{
    id: string;
    text: string;
    position: { x: number; y: number };
    fontSize: number;
    color: string;
    fontFamily: string;
  }>>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [newText, setNewText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState('Arial');
  
  // Photo filters
  const [selectedFilter, setSelectedFilter] = useState('none');
  
  const filters = [
    { name: 'none', label: 'Original', style: '' },
    { name: 'vintage', label: 'Vintage', style: 'sepia(0.8) contrast(1.2) brightness(1.1)' },
    { name: 'bw', label: 'B&W', style: 'grayscale(1) contrast(1.1)' },
    { name: 'warm', label: 'Warm', style: 'hue-rotate(15deg) saturate(1.3) brightness(1.1)' },
    { name: 'cool', label: 'Cool', style: 'hue-rotate(-15deg) saturate(1.2) brightness(1.05)' },
    { name: 'dramatic', label: 'Dramatic', style: 'contrast(1.5) brightness(0.9) saturate(1.4)' }
  ];

  const normalizedCode = code?.toUpperCase();

  // Load collage on mount
  useEffect(() => {
    if (normalizedCode) {
      fetchCollageByCode(normalizedCode);
    }
  }, [normalizedCode, fetchCollageByCode]);

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(cameras);
        
        if (cameras.length > 0 && !selectedCameraId) {
          setSelectedCameraId(cameras[0].deviceId);
        }
      } catch (error) {
        console.error('Error getting cameras:', error);
      }
    };

    getCameras();
  }, [selectedCameraId]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: selectedCameraId 
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: facingMode },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error starting camera:', error);
    }
  }, [selectedCameraId, facingMode, stream]);

  // Start camera on mount and when camera changes
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  // Toggle between front and back camera (mobile)
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Capture photo with countdown
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    // 3-second countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setCountdown(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Apply filter
      if (selectedFilter !== 'none') {
        const filter = filters.find(f => f.name === selectedFilter);
        context.filter = filter?.style || '';
      }

      // Draw video frame
      context.drawImage(video, 0, 0);

      // Draw text overlays
      textOverlays.forEach(overlay => {
        context.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
        context.fillStyle = overlay.color;
        context.strokeStyle = 'rgba(0,0,0,0.8)';
        context.lineWidth = 2;
        context.strokeText(overlay.text, overlay.position.x, overlay.position.y);
        context.fillText(overlay.text, overlay.position.x, overlay.position.y);
      });

      // Get photo data
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(photoDataUrl);
    }

    setIsCapturing(false);
  };

  // Add text overlay
  const addTextOverlay = () => {
    if (!newText.trim()) return;

    const newOverlay = {
      id: Date.now().toString(),
      text: newText,
      position: { x: 50, y: 100 },
      fontSize: fontSize,
      color: textColor,
      fontFamily: fontFamily
    };

    setTextOverlays(prev => [...prev, newOverlay]);
    setNewText('');
    setShowTextEditor(false);
  };

  // Update text overlay
  const updateTextOverlay = (id: string, updates: any) => {
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === id ? { ...overlay, ...updates } : overlay
    ));
  };

  // Delete selected text
  const deleteSelectedText = () => {
    if (selectedTextId) {
      setTextOverlays(prev => prev.filter(overlay => overlay.id !== selectedTextId));
      setSelectedTextId(null);
    }
  };

  // Upload photo to collage
  const uploadToCollage = async () => {
    if (!capturedPhoto || !currentCollage) return;

    setIsUploading(true);
    try {
      // Convert data URL to blob
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      
      // Compress the image
      const file = new File([blob], `photobooth-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const compressed = await compressImage(file, COMPRESSION_PRESETS.balanced);
      
      // Upload to collage
      await uploadPhoto(currentCollage.id, compressed.file);
      
      // Reset for next photo
      setCapturedPhoto(null);
      setTextOverlays([]);
      setSelectedTextId(null);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Download photo
  const downloadPhoto = () => {
    if (!capturedPhoto) return;
    
    const link = document.createElement('a');
    link.download = `photobooth-${Date.now()}.jpg`;
    link.href = capturedPhoto;
    link.click();
  };

  // Upload from device
  const uploadFromDevice = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentCollage) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file, COMPRESSION_PRESETS.balanced);
      await uploadPhoto(currentCollage.id, compressed.file);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!currentCollage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading photobooth...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      {/* Full-screen camera/photo background */}
      <div className="absolute inset-0 w-full h-full">
        {capturedPhoto ? (
          <img
            src={capturedPhoto}
            alt="Captured"
            className="w-full h-full object-cover"
            style={{ filter: selectedFilter !== 'none' ? filters.find(f => f.name === selectedFilter)?.style : '' }}
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ filter: selectedFilter !== 'none' ? filters.find(f => f.name === selectedFilter)?.style : '' }}
          />
        )}
        
        {/* Text overlays */}
        {capturedPhoto && textOverlays.map(overlay => (
          <TextOverlay
            key={overlay.id}
            text={overlay.text}
            position={overlay.position}
            fontSize={overlay.fontSize}
            color={overlay.color}
            fontFamily={overlay.fontFamily}
            isSelected={selectedTextId === overlay.id}
            onSelect={() => setSelectedTextId(overlay.id)}
            onUpdate={(updates) => updateTextOverlay(overlay.id, updates)}
          />
        ))}
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 bg-black/30 backdrop-blur-sm">
          <button
            onClick={() => navigate(`/collage/${normalizedCode}`)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h1 className="text-white font-semibold text-lg">
            {currentCollage.name} Photobooth
          </h1>
          
          <button
            onClick={() => setShowCameraSettings(!showCameraSettings)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Camera settings dropdown */}
        {showCameraSettings && (
          <div className="absolute top-16 right-4 bg-black/80 backdrop-blur-md rounded-lg p-4 min-w-[200px] z-20">
            <h3 className="text-white font-medium mb-3">Camera Settings</h3>
            
            {availableCameras.length > 1 && (
              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-2">Select Camera</label>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm"
                >
                  {availableCameras.map((camera) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <button
              onClick={toggleCamera}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm transition-colors"
            >
              <SwitchCamera className="w-4 h-4" />
              <span>Toggle Camera</span>
            </button>
          </div>
        )}

        {/* Countdown overlay */}
        {countdown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
            <div className="text-white text-9xl font-bold animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {/* Main content area - flex-1 to fill remaining space */}
        <div className="flex-1 flex flex-col justify-end">
          {/* Photo editing tools - only show when photo is captured */}
          {capturedPhoto && (
            <div className="p-4 space-y-4">
              {/* Filter selection */}
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {filters.map((filter) => (
                  <button
                    key={filter.name}
                    onClick={() => setSelectedFilter(filter.name)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedFilter === filter.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/20 text-white/80 hover:bg-white/30'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Text editing controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowTextEditor(!showTextEditor)}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white rounded-lg px-4 py-2 transition-colors"
                >
                  <Type className="w-4 h-4" />
                  <span>Add Text</span>
                </button>
                
                {selectedTextId && (
                  <button
                    onClick={deleteSelectedText}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              {/* Text editor */}
              {showTextEditor && (
                <div className="bg-black/80 backdrop-blur-md rounded-lg p-4 space-y-4">
                  <input
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter text..."
                    className="w-full bg-gray-800 text-white rounded px-3 py-2"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/80 text-sm mb-1">Color</label>
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-full h-10 rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/80 text-sm mb-1">Size</label>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={addTextOverlay}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                    
                    <button
                      onClick={() => setShowTextEditor(false)}
                      className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white rounded px-4 py-2 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom controls */}
          <div className="p-6 bg-black/30 backdrop-blur-sm">
            {!capturedPhoto ? (
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={uploadFromDevice}
                  className="flex items-center justify-center w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
                >
                  <Upload className="w-6 h-6" />
                </button>
                
                <button
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="flex items-center justify-center w-20 h-20 bg-white border-4 border-white rounded-full hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-8 h-8 text-black" />
                </button>
                
                <button
                  onClick={toggleCamera}
                  className="flex items-center justify-center w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setCapturedPhoto(null)}
                  className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg px-6 py-3 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Retake</span>
                </button>
                
                <button
                  onClick={downloadPhoto}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </button>
                
                <button
                  onClick={uploadToCollage}
                  disabled={isUploading}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-3 transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  <span>{isUploading ? 'Uploading...' : 'Add to Collage'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default PhotoboothPage;