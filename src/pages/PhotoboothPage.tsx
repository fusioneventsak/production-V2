// src/pages/PhotoboothPage.tsx - FIXED: Black screen photo capture with proper syntax
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, Download, RotateCcw, Type, Palette, Move, Trash2, Plus, X } from 'lucide-react';
import Webcam from 'react-webcam';
import { useCollageStore } from '../store/collageStore';
import Layout from '../components/layout/Layout';

// Text element interface
interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  isDragging?: boolean;
}

// Font options
const FONT_FAMILIES = [
  'Arial, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Helvetica, sans-serif',
  'Verdana, sans-serif',
  'Comic Sans MS, cursive',
  'Impact, sans-serif',
  'Trebuchet MS, sans-serif'
];

// Color presets
const COLOR_PRESETS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#32CD32'
];

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

  // Camera and photo states
  const webcamRef = useRef<Webcam>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Text overlay states
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showTextControls, setShowTextControls] = useState(false);
  const [newText, setNewText] = useState('');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Webcam configuration
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
  };

  // Normalize code to uppercase for consistent database lookup
  const normalizedCode = code?.toUpperCase();

  // Load collage on mount
  useEffect(() => {
    if (normalizedCode) {
      console.log('🔍 Fetching collage with code:', normalizedCode);
      fetchCollageByCode(normalizedCode);
    }
  }, [normalizedCode, fetchCollageByCode]);

  // Countdown effect
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      performCapture();
    }
  }, [countdown]);

  // Enhanced photo capture with delay and validation
  const performCapture = useCallback(async () => {
    if (!webcamRef.current) {
      console.error('❌ Webcam reference not available');
      setIsCapturing(false);
      setCountdown(null);
      return;
    }

    try {
      console.log('📸 Starting photo capture process...');
      
      // Add a small delay to ensure the frame is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Double-check webcam is still available after delay
      if (!webcamRef.current) {
        console.error('❌ Webcam reference lost during capture delay');
        setIsCapturing(false);
        setCountdown(null);
        return;
      }

      console.log('📸 Taking screenshot...');
      const imageSrc = webcamRef.current.getScreenshot();
      
      // Validate screenshot
      if (!imageSrc) {
        console.error('❌ Screenshot returned null or undefined');
        alert('Failed to capture photo. Please try again.');
        setIsCapturing(false);
        setCountdown(null);
        return;
      }

      // Check if screenshot is too short (indicates empty/black image)
      if (imageSrc.length < 1000) {
        console.error('❌ Screenshot data too short:', imageSrc.length, 'characters');
        alert('Captured image appears to be empty. Please ensure your camera is working and try again.');
        setIsCapturing(false);
        setCountdown(null);
        return;
      }

      console.log('✅ Screenshot captured successfully, length:', imageSrc.length, 'characters');
      setPhoto(imageSrc);
      setIsCapturing(false);
      setCountdown(null);
      
    } catch (error) {
      console.error('❌ Error during photo capture:', error);
      alert('Failed to capture photo. Please try again.');
      setIsCapturing(false);
      setCountdown(null);
    }
  }, []);

  const startCapture = useCallback(() => {
    setIsCapturing(true);
    setCountdown(3);
    setUploadError(null);
  }, []);

  // Add text element
  const addTextElement = useCallback(() => {
    if (!newText.trim()) return;

    const newElement: TextElement = {
      id: Date.now().toString(),
      text: newText,
      x: 50, // Center-ish position
      y: 50,
      fontSize: 24,
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif'
    };

    setTextElements(prev => [...prev, newElement]);
    setNewText('');
    setSelectedElement(newElement.id);
  }, [newText]);

  // Update text element
  const updateTextElement = useCallback((id: string, updates: Partial<TextElement>) => {
    setTextElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  }, []);

  // Delete text element
  const deleteTextElement = useCallback((id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  }, [selectedElement]);

  // Handle mouse events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const element = textElements.find(el => el.id === elementId);
    if (!element) return;

    setDragOffset({
      x: e.clientX - rect.left - (element.x * rect.width / 100),
      y: e.clientY - rect.top - (element.y * rect.height / 100)
    });

    setSelectedElement(elementId);
    updateTextElement(elementId, { isDragging: true });
  }, [textElements, updateTextElement]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const draggingElement = textElements.find(el => el.isDragging);
    if (!draggingElement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100));

    updateTextElement(draggingElement.id, { x, y });
  }, [textElements, dragOffset, updateTextElement]);

  const handleMouseUp = useCallback(() => {
    setTextElements(prev => prev.map(el => ({ ...el, isDragging: false })));
  }, []);

  // Render text to canvas
  const renderTextToCanvas = useCallback((canvas: HTMLCanvasElement, baseImage: HTMLImageElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = baseImage.width;
    canvas.height = baseImage.height;

    // Draw the base image
    ctx.drawImage(baseImage, 0, 0);

    // Draw text elements
    textElements.forEach(element => {
      const x = (element.x / 100) * canvas.width;
      const y = (element.y / 100) * canvas.height;

      ctx.font = `${element.fontSize}px ${element.fontFamily}`;
      ctx.fillStyle = element.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Add text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(element.text, x, y);

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    });
  }, [textElements]);

  // Enhanced download with text overlay
  const downloadPhoto = useCallback(async () => {
    if (!photo) return;

    try {
      setIsDownloading(true);
      console.log('📥 Starting download process...');

      // Create image from photo data
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = photo;
      });

      console.log('🖼️ Base image loaded, size:', img.width, 'x', img.height);

      // Create canvas for compositing
      const canvas = document.createElement('canvas');
      renderTextToCanvas(canvas, img);

      // Convert to blob with validation
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }
          
          // Validate blob size
          if (blob.size < 1000) {
            reject(new Error('Generated image is too small, may be corrupted'));
            return;
          }
          
          console.log('✅ Canvas converted to blob, size:', blob.size, 'bytes');
          resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photobooth-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Download completed successfully');
    } catch (error) {
      console.error('❌ Download failed:', error);
      alert('Failed to download photo. Please try again.');
    } finally {
      setIsDownloading(false);
      console.log('🏁 Download process finished');
    }
  }, [photo, textElements, renderTextToCanvas]);

  const retakePhoto = useCallback(() => {
    setPhoto(null);
    setTextElements([]);
    setSelectedElement(null);
    setUploadError(null);
  }, []);

  // Enhanced upload with text overlay
  const uploadToCollage = useCallback(async () => {
    if (!photo || !currentCollage) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      console.log('📤 Starting upload process...');

      // Create image from photo data
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = photo;
      });

      console.log('🖼️ Base image loaded for upload, size:', img.width, 'x', img.height);

      // Create canvas for compositing
      const canvas = document.createElement('canvas');
      renderTextToCanvas(canvas, img);

      // Convert to blob with validation
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }
          
          // Validate blob size
          if (blob.size < 1000) {
            reject(new Error('Generated image is too small, may be corrupted'));
            return;
          }
          
          console.log('✅ Canvas converted to blob for upload, size:', blob.size, 'bytes');
          resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      // Create file from blob
      const file = new File([blob], `photobooth-${Date.now()}.jpg`, { type: 'image/jpeg' });
      console.log('📁 File created, size:', file.size, 'bytes');

      // Upload to collage
      console.log('🚀 Uploading to collage:', currentCollage.id);
      await uploadPhoto(currentCollage.id, file);
      
      console.log('✅ Upload completed successfully');
      
      // Reset state after successful upload
      setPhoto(null);
      setTextElements([]);
      setSelectedElement(null);
      
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      setUploadError(error.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      console.log('🏁 Upload process finished');
    }
  }, [photo, currentCollage, uploadPhoto, textElements, renderTextToCanvas]);

  if (loading && !currentCollage) {
    return (
      <Layout>
        <div className="min-h-screen bg-black">
          <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="mt-2 text-gray-400">Loading photobooth...</p>
              <p className="text-gray-500 text-sm mt-1">
                Looking for: {normalizedCode}
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !currentCollage) {
    return (
      <Layout>
        <div className="min-h-screen bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-white mb-4">Photobooth Not Found</h2>
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
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="bg-gray-900/95 backdrop-blur border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link 
                  to={`/collage/${currentCollage.code}`}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                  <h1 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Camera className="w-5 h-5 text-purple-400" />
                    <span>Photobooth</span>
                  </h1>
                  <p className="text-gray-300 text-sm">{currentCollage?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link
                  to={`/collage/${currentCollage.code}`}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm transition-colors"
                >
                  View Collage
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Camera/Photo Area */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
                {!photo ? (
                  <div className="relative">
                    {/* Webcam */}
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      className="w-full h-auto"
                      mirrored={true}
                    />
                    
                    {/* Countdown Overlay */}
                    {countdown !== null && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-8xl font-bold text-white mb-4 animate-pulse">
                            {countdown > 0 ? countdown : '📸'}
                          </div>
                          <p className="text-white text-xl">
                            {countdown > 0 ? 'Get ready!' : 'Smile!'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Capture Button */}
                    {!isCapturing && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                        <button
                          onClick={startCapture}
                          className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                        >
                          📸 Take Photo
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    {/* Photo Preview with Text Overlay */}
                    <div 
                      className="relative w-full"
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <img 
                        src={photo} 
                        alt="Captured" 
                        className="w-full h-auto"
                      />
                      
                      {/* Text Elements Overlay */}
                      {textElements.map(element => (
                        <div
                          key={element.id}
                          className={`absolute cursor-move select-none ${
                            selectedElement === element.id ? 'ring-2 ring-blue-400' : ''
                          }`}
                          style={{
                            left: `${element.x}%`,
                            top: `${element.y}%`,
                            transform: 'translate(-50%, -50%)',
                            fontSize: `${element.fontSize}px`,
                            color: element.color,
                            fontFamily: element.fontFamily,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            pointerEvents: 'auto'
                          }}
                          onMouseDown={(e) => handleMouseDown(e, element.id)}
                          onClick={() => setSelectedElement(element.id)}
                        >
                          {element.text}
                        </div>
                      ))}
                    </div>
                    
                    {/* Photo Actions */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                      <button
                        onClick={retakePhoto}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Retake</span>
                      </button>
                      
                      <button
                        onClick={downloadPhoto}
                        disabled={isDownloading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                      </button>
                      
                      <button
                        onClick={uploadToCollage}
                        disabled={isUploading}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isUploading ? 'Uploading...' : 'Add to Collage'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Upload Error */}
              {uploadError && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                  <p className="font-medium">Upload Failed</p>
                  <p className="text-sm">{uploadError}</p>
                </div>
              )}
            </div>

            {/* Text Controls Sidebar */}
            <div className="space-y-6">
              {/* Add Text Section */}
              <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Type className="w-5 h-5 mr-2" />
                  Add Text
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Enter your text..."
                      className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onKeyPress={(e) => e.key === 'Enter' && addTextElement()}
                    />
                  </div>
                  
                  <button
                    onClick={addTextElement}
                    disabled={!newText.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Text</span>
                  </button>
                </div>
              </div>

              {/* Text Elements List */}
              {textElements.length > 0 && (
                <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Text Elements</h3>
                  
                  <div className="space-y-3">
                    {textElements.map(element => (
                      <div
                        key={element.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedElement === element.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => setSelectedElement(element.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white text-sm truncate">{element.text}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTextElement(element.id);
                            }}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Editing Controls */}
              {selectedElement && (
                <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Edit Text
                  </h3>
                  
                  {(() => {
                    const element = textElements.find(el => el.id === selectedElement);
                    if (!element) return null;

                    return (
                      <div className="space-y-4">
                        {/* Text Content */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Text</label>
                          <input
                            type="text"
                            value={element.text}
                            onChange={(e) => updateTextElement(element.id, { text: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Font Size */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Font Size: {element.fontSize}px
                          </label>
                          <input
                            type="range"
                            min="12"
                            max="72"
                            value={element.fontSize}
                            onChange={(e) => updateTextElement(element.id, { fontSize: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        {/* Font Family */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Font</label>
                          <select
                            value={element.fontFamily}
                            onChange={(e) => updateTextElement(element.id, { fontFamily: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            {FONT_FAMILIES.map(font => (
                              <option key={font} value={font}>
                                {font.split(',')[0]}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Color Picker */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                          <div className="grid grid-cols-5 gap-2 mb-2">
                            {COLOR_PRESETS.map(color => (
                              <button
                                key={color}
                                onClick={() => updateTextElement(element.id, { color })}
                                className={`w-8 h-8 rounded border-2 ${
                                  element.color === color ? 'border-white' : 'border-gray-600'
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <input
                            type="color"
                            value={element.color}
                            onChange={(e) => updateTextElement(element.id, { color: e.target.value })}
                            className="w-full h-8 rounded border border-gray-600"
                          />
                        </div>

                        {/* Position Controls */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">X: {element.x.toFixed(0)}%</label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={element.x}
                                onChange={(e) => updateTextElement(element.id, { x: parseFloat(e.target.value) })}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Y: {element.y.toFixed(0)}%</label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={element.y}
                                onChange={(e) => updateTextElement(element.id, { y: parseFloat(e.target.value) })}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-2">📸 How to Use</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• Click "Take Photo" to capture</li>
                  <li>• Add text overlays to personalize</li>
                  <li>• Drag text to reposition</li>
                  <li>• Download or add to collage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PhotoboothPage;