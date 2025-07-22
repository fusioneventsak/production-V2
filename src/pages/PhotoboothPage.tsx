// src/pages/PhotoboothPage.tsx - Full-screen mobile experience with desktop layout preserved
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Download, Upload, X, Plus, Minus, RotateCw, Type, Palette, Move, Globe, RefreshCw, Send, Settings, ZoomIn, SwitchCamera, Frame } from 'lucide-react';
import { useCollageStore } from '../store/collageStore';
import MobileVideoRecorder from '../components/video/MobileVideoRecorder';
import FrameOverlay from '../components/photobooth/FrameOverlay';

type VideoDevice = {
  deviceId: string;
  label: string;
};

type CameraState = 'idle' | 'starting' | 'active' | 'error';

type TextStyle = {
  fontFamily: string;
  backgroundColor: string;
  backgroundOpacity: number;
  align: 'left' | 'center' | 'right';
  outline: boolean;
  padding: number;
};

const PhotoboothPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInitializingRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [textSize, setTextSize] = useState(24);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textShadow, setTextShadow] = useState(true);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [recordingResolution, setRecordingResolution] = useState({ width: 1920, height: 1080 });
  
  // Frame overlay state
  const [customFrame, setCustomFrame] = useState<{
    id: string;
    url: string;
    opacity: number;
  } | null>(null);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  
  // New Instagram Story-like states
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [textElements, setTextElements] = useState<Array<{
    id: string;
    text: string;
    position: { x: number; y: number };
    size: number;
    color: string;
    style: TextStyle;
    rotation: number;
    scale: number;
  }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [initialRotation, setInitialRotation] = useState(0);
  const [showTextStylePanel, setShowTextStylePanel] = useState(false);
  
  const [showError, setShowError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { currentCollage, fetchCollageByCode, uploadPhoto, setupRealtimeSubscription, cleanupRealtimeSubscription, loading, error: storeError, photos } = useCollageStore();

  const textOverlayRef = useRef<HTMLDivElement>(null);
  const photoContainerRef = useRef<HTMLDivElement>(null);
  
  const safePhotos = Array.isArray(photos) ? photos : [];
  const normalizedCode = code?.toUpperCase();

  // Frame-related state
  const [frameSettings, setFrameSettings] = useState({
    selectedFrameId: 'none',
    selectedFrameUrl: null,
    frameOpacity: 80,
    enableTextOverlay: true,
    defaultText: '',
    textColor: '#FFFFFF',
    textSize: 24,
    textPosition: 'bottom'
  });

  // Text style presets
  const textStylePresets = [
    { name: 'Classic', fontFamily: 'Arial', backgroundColor: 'transparent', backgroundOpacity: 0, align: 'center' as const, outline: true, padding: 0 },
    { name: 'Highlight', fontFamily: 'Arial', backgroundColor: '#000000', backgroundOpacity: 0.7, align: 'center' as const, outline: false, padding: 8 },
    { name: 'Neon', fontFamily: 'Impact', backgroundColor: 'transparent', backgroundOpacity: 0, align: 'center' as const, outline: true, padding: 0 },
    { name: 'Modern', fontFamily: 'Helvetica', backgroundColor: '#ffffff', backgroundOpacity: 0.9, align: 'center' as const, outline: false, padding: 12 },
  ];

  const colorPresets = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', 
    '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff'
  ];

  // Check if device is mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
    
    setCameraState('idle');
  }, []);

  const getVideoDevices = useCallback(async (): Promise<VideoDevice[]> => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId}`
        }));
      
      return videoDevices;
    } catch (error) {
      return [];
    }
  }, []);

  const waitForVideoElement = useCallback(async (maxWaitMs: number = 5000): Promise<HTMLVideoElement | null> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      if (videoRef.current) {
        return videoRef.current;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return null;
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    if (isInitializingRef.current) {
      return;
    }

    isInitializingRef.current = true;
    setCameraState('starting');
    setError(null);

    try {
      cleanupCamera();
      const videoElement = await waitForVideoElement();
      if (!videoElement) {
        throw new Error('Video element not available - component may not be fully mounted');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isMobileDevice = isIOS || isAndroid;
      
      let constraints: MediaStreamConstraints;
      
      if (deviceId) {
        constraints = {
          video: {
            deviceId: { exact: deviceId },
            ...(isMobileDevice ? { facingMode: "user" } : {}),
            ...(isIOS ? {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 }
            } : {})
          },
          audio: false
        };
      } else {
        constraints = {
          video: isMobileDevice ? { facingMode: "user" } : true,
          audio: false
        };
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const videoDevices = await getVideoDevices();
      setDevices(videoDevices);
      
      if (!selectedDevice && videoDevices.length > 0 && isMobileDevice) {
        const frontCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('front') ||
          device.label.toLowerCase().includes('user') ||
          device.label.toLowerCase().includes('selfie') ||
          device.label.toLowerCase().includes('facetime')
        );
        
        if (frontCamera) {
          setSelectedDevice(frontCamera.deviceId);
        } else {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      }
      
      if (!videoRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        throw new Error('Video element became unavailable during setup');
      }
      
      videoRef.current.srcObject = mediaStream;
      
      const video = videoRef.current;
      
      let hasStartedPlaying = false;
      let eventListeners: { element: HTMLElement, event: string, handler: EventListener }[] = [];
      
      const ensureVideoPlay = async (video: HTMLVideoElement) => {
        try {
          const playPromise = video.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            return true;
          }
        } catch (error: any) {
          if (error.name === 'NotAllowedError') {
            setError('Camera ready - tap anywhere to start video');
            
            const enablePlay = () => {
              video.play().then(() => {
                setError(null);
                document.removeEventListener('click', enablePlay);
                document.removeEventListener('touchstart', enablePlay);
              }).catch(err => {});
            };
            
            document.addEventListener('click', enablePlay, { once: true });
            document.addEventListener('touchstart', enablePlay, { once: true });
          }
          
          return false;
        }
        return false;
      };
      
      const addTrackedEventListener = (element: HTMLElement, event: string, handler: EventListener) => {
        element.addEventListener(event, handler);
        eventListeners.push({ element, event, handler });
      };
      
      const cleanupEventListeners = () => {
        eventListeners.forEach(({ element, event, handler }) => {
          element.removeEventListener(event, handler);
        });
        eventListeners = [];
      };
      
      const handleLoadedMetadata = async () => {
        if (!hasStartedPlaying && video) {
          const success = await ensureVideoPlay(video);
          if (success) {
            hasStartedPlaying = true;
            streamRef.current = mediaStream;
            setCameraState('active');
            cleanupEventListeners();
          }
        }
      };
      
      const handleCanPlay = async () => {
        if (!hasStartedPlaying && video && video.paused) {
          const success = await ensureVideoPlay(video);
          if (success) {
            hasStartedPlaying = true;
            streamRef.current = mediaStream;
            setCameraState('active');
            cleanupEventListeners();
          }
        }
      };
      
      const handleLoadedData = async () => {
        if (!hasStartedPlaying && video && video.readyState >= 2) {
          const success = await ensureVideoPlay(video);
          if (success) {
            hasStartedPlaying = true;
            streamRef.current = mediaStream;
            setCameraState('active');
            cleanupEventListeners();
          }
        }
      };
      
      const handleError = (event: Event) => {
        setCameraState('error');
        setError('Video playback error');
        mediaStream.getTracks().forEach(track => track.stop());
        cleanupEventListeners();
      };
      
      addTrackedEventListener(video, 'loadedmetadata', handleLoadedMetadata);
      addTrackedEventListener(video, 'canplay', handleCanPlay);
      addTrackedEventListener(video, 'loadeddata', handleLoadedData);
      addTrackedEventListener(video, 'error', handleError);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      video.srcObject = mediaStream;
      
      setTimeout(() => {
        if (!hasStartedPlaying) {
          hasStartedPlaying = true;
          streamRef.current = mediaStream;
          setCameraState('active');
          cleanupEventListeners();
        }
      }, 1000);
      
      setTimeout(() => {
        if (!hasStartedPlaying && video && video.readyState >= 1) {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            ensureVideoPlay(video).then(success => {
              if (success) {
                hasStartedPlaying = true;
                streamRef.current = mediaStream;
                setCameraState('active');
                cleanupEventListeners();
              }
            });
          }
        }
      }, 500);
      
      const forcePlayTimeout = setTimeout(async () => {
        if (!hasStartedPlaying && video && video.readyState >= 1) {
          const success = await ensureVideoPlay(video);
          if (success) {
            hasStartedPlaying = true;
            streamRef.current = mediaStream;
            setCameraState('active');
            cleanupEventListeners();
          } else {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              hasStartedPlaying = true;
              streamRef.current = mediaStream;
              setCameraState('active');
              cleanupEventListeners();
            } else {
              setCameraState('error');
              setError('Camera initialization timeout - try refreshing the page');
              mediaStream.getTracks().forEach(track => track.stop());
              cleanupEventListeners();
            }
          }
        }
      }, 2000);
      
      const checkActive = setInterval(() => {
        if (hasStartedPlaying || cameraState === 'active') {
          clearTimeout(forcePlayTimeout);
          clearInterval(checkActive);
          cleanupEventListeners();
        }
      }, 100);
      
    } catch (err: any) {
      setCameraState('error');
      
      let errorMessage = 'Failed to access camera. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera access denied. Please allow camera access and refresh the page.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please check your camera and try again.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is busy. Please close other apps using the camera and try again.';
      } else if (err.name === 'OverconstrainedError') {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: false 
          });
          
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
            streamRef.current = fallbackStream;
            setCameraState('active');
            setError(null);
            return;
          } else {
            fallbackStream.getTracks().forEach(track => track.stop());
            throw new Error('Video element not available for fallback');
          }
        } catch (fallbackError) {
          errorMessage = 'Camera not compatible with this device.';
        }
      } else {
        errorMessage += err.message || 'Unknown camera error.';
      }
      
      setError(errorMessage);
    } finally {
      isInitializingRef.current = false;
    }
  }, [selectedDevice, cameraState, cleanupCamera, getVideoDevices, waitForVideoElement]);

  const switchCamera = useCallback(() => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    handleDeviceChange(devices[nextIndex].deviceId);
  }, [devices, selectedDevice]);

  const handleDeviceChange = useCallback((newDeviceId: string) => {
    if (newDeviceId === selectedDevice) return;
    
    setSelectedDevice(newDeviceId);
    
    if (!photo && cameraState !== 'starting') {
      startCamera(newDeviceId);
    }
  }, [selectedDevice, photo, cameraState, startCamera]);

  // Add new text element
  const addTextElement = useCallback(() => {
    const newId = Date.now().toString();
    const newElement = {
      id: newId,
      text: '',
      position: { x: 50, y: 50 },
      size: 32,
      color: '#ffffff',
      style: textStylePresets[0],
      rotation: 0,
      scale: 1,
    };
    
    setTextElements(prev => [...prev, newElement]);
    setSelectedTextId(newId);
    setIsEditingText(true);
  }, []);

  // Delete text element
  const deleteTextElement = useCallback((id: string) => {
    setTextElements(prev => prev.filter(el => el.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
      setIsEditingText(false);
      setShowTextStylePanel(false);
    }
  }, [selectedTextId]);

  // Update text element
  const updateTextElement = useCallback((id: string, updates: Partial<typeof textElements[0]>) => {
    setTextElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  }, []);

  // Get touch distance for pinch gestures
  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Get touch angle for rotation
  const getTouchAngle = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX) * 180 / Math.PI;
  };

  const handleTextInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent, textId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!photoContainerRef.current) return;
    
    setSelectedTextId(textId);
    setIsDragging(true);
    
    const container = photoContainerRef.current.getBoundingClientRect();
    
    if ('touches' in e && e.touches.length === 2) {
      setIsResizing(true);
      setInitialDistance(getTouchDistance(e.touches));
      setInitialRotation(getTouchAngle(e.touches));
      
      const element = textElements.find(el => el.id === textId);
      if (element) {
        setInitialScale(element.scale);
      }
    } else {
      setIsResizing(false);
    }
    
    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      if ('touches' in moveEvent && moveEvent.touches.length === 2 && isResizing) {
        const currentDistance = getTouchDistance(moveEvent.touches);
        const currentAngle = getTouchAngle(moveEvent.touches);
        
        const scaleChange = currentDistance / initialDistance;
        const rotationChange = currentAngle - initialRotation;
        
        updateTextElement(textId, {
          scale: Math.max(0.5, Math.min(3, initialScale * scaleChange)),
          rotation: rotationChange
        });
      } else {
        const clientX = 'touches' in moveEvent 
          ? moveEvent.touches[0].clientX 
          : moveEvent.clientX;
        const clientY = 'touches' in moveEvent 
          ? moveEvent.touches[0].clientY 
          : moveEvent.clientY;
        
        const x = Math.max(5, Math.min(95, ((clientX - container.left) / container.width) * 100));
        const y = Math.max(5, Math.min(95, ((clientY - container.top) / container.height) * 100));
        
        updateTextElement(textId, { position: { x, y } });
      }
    };
    
    const endHandler = () => {
      setIsDragging(false);
      setIsResizing(false);
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchend', endHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchend', endHandler);
  }, [textElements, isResizing, initialDistance, initialRotation, initialScale, updateTextElement]);

  const handleResizeCornerStart = useCallback((e: React.MouseEvent, textId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = textElements.find(el => el.id === textId);
    if (!element) return;
    
    setInitialScale(element.scale);
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    const moveHandler = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const scaleChange = 1 + (delta / 100);
      
      updateTextElement(textId, {
        scale: Math.max(0.5, Math.min(3, initialScale * scaleChange))
      });
    };
    
    const endHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
  }, [textElements, initialScale, updateTextElement]);

  const wrapText = useCallback((context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
      const metrics = context.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }, []);

  // Load custom frame from collage settings
  useEffect(() => {
    if (currentCollage?.settings?.photobooth) {
      const photoboothSettings = currentCollage.settings.photobooth;
      
      if (photoboothSettings.selectedFrameUrl && photoboothSettings.selectedFrameId !== 'none') {
        setCustomFrame({
          id: photoboothSettings.selectedFrameId,
          url: photoboothSettings.selectedFrameUrl,
          opacity: photoboothSettings.frameOpacity || 80
        });
        setFrameLoaded(false);
      } else {
        setCustomFrame(null);
        setFrameLoaded(false);
      }
    }
  }, [currentCollage]);

  // Preload frame image to ensure it's ready for capture
  useEffect(() => {
    if (customFrame?.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        setFrameLoaded(true);
      };
      
      img.onerror = (error) => {
        setFrameLoaded(false);
      };
      
      img.src = customFrame.url;
    } else {
      setFrameLoaded(false);
    }
  }, [customFrame]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || cameraState !== 'active') {
      return;
    }

    setIsEditingText(false);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    // Always capture in 9:16 aspect ratio for perfect frame fit
    const targetAspectRatio = 9 / 16;
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    
    let sourceWidth, sourceHeight, sourceX, sourceY;
    
    // Calculate the crop area from video that matches 9:16 aspect ratio
    if (videoAspectRatio > targetAspectRatio) {
      // Video is wider than 9:16, crop the sides
      sourceHeight = video.videoHeight;
      sourceWidth = sourceHeight * targetAspectRatio;
      sourceX = (video.videoWidth - sourceWidth) / 2;
      sourceY = 0;
    } else {
      // Video is taller than 9:16, crop top and bottom
      sourceWidth = video.videoWidth;
      sourceHeight = sourceWidth / targetAspectRatio;
      sourceX = 0;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    // Set canvas to exact 9:16 dimensions for perfect frame fit
    const canvasWidth = 540;
    const canvasHeight = 960;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas completely
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw cropped video frame to fill entire canvas (perfect 9:16)
    context.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvasWidth, canvasHeight
    );

    // Function to complete the capture process
    const completeCapture = () => {
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      setPhoto(dataUrl);
      cleanupCamera();
    };

    // Draw custom frame if present and loaded - it will fit perfectly since both are 9:16
    if (customFrame?.url && frameLoaded) {
      const frameImg = new Image();
      frameImg.crossOrigin = 'anonymous';
      
      frameImg.onload = () => {
        // Save current context state
        context.save();
        
        // Set frame opacity
        const opacity = customFrame.opacity / 100;
        context.globalAlpha = opacity;
        
        // Draw frame covering the entire canvas - perfect fit since both are 9:16
        context.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
        
        // Restore context state
        context.restore();
        
        completeCapture();
      };
      
      frameImg.onerror = (error) => {
        completeCapture();
      };
      
      // Load the frame image
      frameImg.src = customFrame.url;
    } else {
      // No frame to add, complete capture
      completeCapture();
    }
  }, [cameraState, cleanupCamera, customFrame, frameLoaded, textElements]);

  // Enhanced renderTextToCanvas that also handles frames for final upload
  const renderTextToCanvas = useCallback((canvas: HTMLCanvasElement, imageData: string) => {
    return new Promise<string>((resolve) => {
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(imageData);
        return;
      }

      const img = new Image();
      img.onload = () => {
        // High-resolution output dimensions - maintaining perfect 9:16
        const HIGH_RES_WIDTH = 1080;
        const HIGH_RES_HEIGHT = 1920;
        
        // Calculate proper scaling factor to match preview appearance
        let textScaleFactor = 1;
        
        if (photoContainerRef.current) {
          const rect = photoContainerRef.current.getBoundingClientRect();
          textScaleFactor = HIGH_RES_WIDTH / rect.width;
        } else {
          textScaleFactor = HIGH_RES_WIDTH / 360;
        }

        // Function to render text elements
        const renderTextElements = () => {
          // Render all text elements with proportional scaling to match preview
          textElements.forEach((element, index) => {
            if (!element.text || element.text.trim() === '') {
              return;
            }

            // Calculate positions (these scale with the resolution)
            const x = (element.position.x / 100) * HIGH_RES_WIDTH;
            const y = (element.position.y / 100) * HIGH_RES_HEIGHT;
            
            // Scale font size proportionally to match preview appearance
            const baseFontSize = element.size * (element.scale || 1);
            const fontSize = baseFontSize * textScaleFactor;

            context.save();
            context.translate(x, y);
            context.rotate((element.rotation || 0) * Math.PI / 180);

            context.font = `bold ${fontSize}px ${element.style.fontFamily || 'Arial'}`;
            context.textAlign = element.style.align || 'center';
            context.textBaseline = 'middle';

            // Calculate maximum width for text wrapping (scale the 280px constraint)
            const maxTextWidth = 280 * textScaleFactor;

            // Process text - handle both manual line breaks and automatic wrapping
            let allLines: string[] = [];
            const manualLines = element.text.split('\n');
            
            manualLines.forEach(line => {
              if (line.trim() === '') {
                allLines.push(''); // Preserve empty lines
              } else {
                // Wrap each manual line if it's too long
                const wrappedLines = wrapText(context, line, maxTextWidth);
                allLines = allLines.concat(wrappedLines);
              }
            });

            const lineHeight = fontSize * 1.2;
            const totalTextHeight = allLines.length * lineHeight;
            const startY = -(totalTextHeight - lineHeight) / 2;

            // Draw background if needed
            if (element.style.backgroundColor && element.style.backgroundColor !== 'transparent') {
              const padding = 8 * textScaleFactor;
              const bgWidth = Math.max(...allLines.map(line => context.measureText(line).width)) + padding * 2;
              const bgHeight = totalTextHeight + padding * 2;
              
              context.fillStyle = element.style.backgroundColor;
              context.fillRect(-bgWidth/2, startY - padding, bgWidth, bgHeight);
            }

            // Draw each line of text
            allLines.forEach((line, lineIndex) => {
              const lineY = startY + (lineIndex * lineHeight);

              // Outline text style
              if (element.style.name === 'Bold Outline') {
                context.lineWidth = 8 * textScaleFactor;
                context.strokeStyle = '#000000';
                context.strokeText(line, 0, lineY);
              } else {
                // Standard shadow for non-outline text
                context.shadowColor = 'rgba(0,0,0,0.8)';
                context.shadowBlur = 8 * textScaleFactor;
                context.shadowOffsetX = 3 * textScaleFactor;
                context.shadowOffsetY = 3 * textScaleFactor;
              }

              // Draw main text line by line
              context.fillStyle = element.color;
              context.fillText(line, 0, lineY);

              // Reset shadow properties after each line
              context.shadowColor = 'transparent';
              context.shadowBlur = 0;
              context.shadowOffsetX = 0;
              context.shadowOffsetY = 0;
            });

            context.restore();
          });

          // Return the final high-resolution image with text (perfect 9:16)
          const finalImageData = canvas.toDataURL('image/jpeg', 1.0);
          resolve(finalImageData);
        };

        // Set high-resolution canvas dimensions (perfect 9:16)
        canvas.width = HIGH_RES_WIDTH;
        canvas.height = HIGH_RES_HEIGHT;

        // Clear and draw the original image at high resolution
        context.clearRect(0, 0, HIGH_RES_WIDTH, HIGH_RES_HEIGHT);
        context.drawImage(img, 0, 0, HIGH_RES_WIDTH, HIGH_RES_HEIGHT);

        // Apply frame to high-res image if present, then render text
        if (customFrame?.url && frameLoaded && customFrame.opacity > 0) {
          const frameImg = new Image();
          frameImg.crossOrigin = 'anonymous';
          
          frameImg.onload = () => {
            context.save();
            context.globalAlpha = customFrame.opacity / 100;
            // Perfect fit since both are 9:16
            context.drawImage(frameImg, 0, 0, HIGH_RES_WIDTH, HIGH_RES_HEIGHT);
            context.restore();
            
            renderTextElements();
          };
          
          frameImg.onerror = (error) => {
            renderTextElements();
          };
          
          frameImg.src = customFrame.url;
        } else {
          // No frame, just render text
          renderTextElements();
        }
      };

      img.src = imageData;
    });
  }, [textElements, photoContainerRef, wrapText, customFrame, frameLoaded]);

  const uploadToCollage = useCallback(async () => {
    if (!photo || !currentCollage) return;

    setUploading(true);
    setError(null);
    setIsEditingText(false);
    
    try {
      // Render text to the photo BEFORE uploading
      let finalPhoto = photo;
      
      if (textElements.length > 0 && canvasRef.current) {
        finalPhoto = await renderTextToCanvas(canvasRef.current, photo);
      }

      // Upload the final photo WITH text rendered
      const response = await fetch(finalPhoto);
      const blob = await response.blob();
      const file = new File([blob], 'photobooth.jpg', { type: 'image/jpeg' });

      const result = await uploadPhoto(currentCollage.id, file);
      if (result) {        
        setPhoto(null);
        setTextElements([]);
        setSelectedTextId(null);
        setShowTextStylePanel(false);
        
        setError('Photo uploaded successfully! Your photo will appear in the collage automatically.');
        setTimeout(() => setError(null), 3000);
        
        // Ensure camera restarts immediately after upload
        await cleanupCamera();
        await new Promise(resolve => setTimeout(resolve, 300));
        startCamera(selectedDevice);
        
      } else {
        throw new Error('Failed to upload photo');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  }, [photo, currentCollage, uploadPhoto, startCamera, selectedDevice, textElements, renderTextToCanvas, cleanupCamera]);

  const downloadPhoto = useCallback(async () => {
    if (!photo || isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      let finalPhoto = photo;
      
      // Render text to the photo before downloading
      if (textElements.length > 0 && canvasRef.current) {
        finalPhoto = await renderTextToCanvas(canvasRef.current, photo);
      }

      // Simple download approach
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
      const filename = `photobooth-${timestamp}.jpg`;

      // Try the most compatible download method
      if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        // iOS specific handling
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>Download Photo</title></head>
              <body style="margin:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;">
                <img src="${finalPhoto}" style="max-width:90%;max-height:70vh;border-radius:10px;" />
                <div style="color:white;text-align:center;margin-top:20px;padding:20px;">
                  <h2>Your Photobooth Picture</h2>
                  <p>Long-press the image above and select<br/><strong>"Save to Photos"</strong> or <strong>"Add to Photos"</strong></p>
                  <p style="font-size:14px;opacity:0.8;">Filename: ${filename}</p>
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      } else {
        // Standard download for other browsers
        const link = document.createElement('a');
        link.href = finalPhoto;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Show success message
      setError('Photo download started! Check your downloads folder.');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError('Download failed. Opening photo in new tab...');
      
      // Ultimate fallback
      try {
        let finalPhoto = photo;
        if (textElements.length > 0 && canvasRef.current) {
          finalPhoto = await renderTextToCanvas(canvasRef.current, photo);
        }
        
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>Your Photobooth Photo</title></head>
              <body style="margin:0;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;">
                <img src="${finalPhoto}" style="max-width:90%;max-height:70vh;border-radius:10px;" />
                <div style="color:white;text-align:center;margin-top:20px;padding:20px;">
                  <h2>Save Your Photo</h2>
                  <p><strong>Desktop:</strong> Right-click image → "Save image as..."</p>
                  <p><strong>Mobile:</strong> Long-press image → "Save to Photos"</p>
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      } catch (fallbackErr) {
        setError('Could not download photo. Please try again.');
      }
      
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsDownloading(false);
    }
  }, [photo, textElements, renderTextToCanvas, isDownloading]);

  const retakePhoto = useCallback(() => {
    setPhoto(null);
    setTextElements([]);
    setSelectedTextId(null);
    setIsEditingText(false);
    setShowTextStylePanel(false);
    
    // Ensure camera restarts properly
    cleanupCamera();
    setTimeout(() => {
      startCamera(selectedDevice);
    }, 300);
  }, [startCamera, selectedDevice, cleanupCamera]);

  // Render text elements on photo
  const renderTextElements = () => {
    return textElements.map((element) => (
      <div
        key={element.id}
        className={`absolute cursor-move select-none ${selectedTextId === element.id ? 'ring-2 ring-white ring-opacity-70' : ''}`}
        style={{
          left: `${element.position.x}%`,
          top: `${element.position.y}%`,
          transform: `translate(-50%, -50%) scale(${element.scale}) rotate(${element.rotation}deg)`,
          touchAction: 'none',
          zIndex: selectedTextId === element.id ? 20 : 10,
        }}
        onMouseDown={(e) => {
          // Only handle drag if not editing - allow click to edit
          if (!isEditingText) {
            handleTextInteractionStart(e, element.id);
          }
        }}
        onTouchStart={(e) => {
          // Only handle drag if not editing - allow tap to edit
          if (!isEditingText) {
            handleTextInteractionStart(e, element.id);
          }
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Single click/tap to select and edit
          setSelectedTextId(element.id);
          // Close style panel when selecting different text
          if (selectedTextId !== element.id) {
            setShowTextStylePanel(false);
          }
          if (!isEditingText) {
            setIsEditingText(true);
          }
        }}
        onDoubleClick={() => {
          // Double click also works for editing
          setSelectedTextId(element.id);
          setIsEditingText(true);
        }}
      >
        {selectedTextId === element.id && isEditingText ? (
          <textarea
            value={element.text}
            onChange={(e) => updateTextElement(element.id, { text: e.target.value })}
            className="bg-transparent border-none outline-none text-center resize-none"
            style={{
              fontSize: `${element.size}px`,
              color: element.color,
              fontFamily: element.style.fontFamily,
              textAlign: element.style.align,
              backgroundColor: element.style.backgroundColor !== 'transparent' 
                ? `${element.style.backgroundColor}${Math.round(element.style.backgroundOpacity * 255).toString(16).padStart(2, '0')}`
                : 'transparent',
              padding: `${element.style.padding}px`,
              borderRadius: element.style.padding > 0 ? '8px' : '0',
              textShadow: element.style.outline ? 
                '3px 3px 0px rgba(0,0,0,0.8), -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 4px 4px 8px rgba(0,0,0,0.6)' : 
                '2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9), 0px 0px 8px rgba(0,0,0,0.5)',
              caretColor: 'white',
              minWidth: '100px',
              maxWidth: '280px', // Constrain to viewport width
              width: 'auto',
              minHeight: '40px',
              maxHeight: '200px', // Prevent too tall text
              overflow: 'hidden',
              lineHeight: '1.2',
            }}
            autoFocus
            placeholder="Type something..."
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsEditingText(false);
              }
            }}
            onBlur={() => setIsEditingText(false)}
          />
        ) : (
          <div
            style={{
              fontSize: `${element.size}px`,
              color: element.color,
              fontFamily: element.style.fontFamily,
              textAlign: element.style.align,
              backgroundColor: element.style.backgroundColor !== 'transparent' 
                ? `${element.style.backgroundColor}${Math.round(element.style.backgroundOpacity * 255).toString(16).padStart(2, '0')}`
                : 'transparent',
              padding: `${element.style.padding}px`,
              borderRadius: element.style.padding > 0 ? '8px' : '0',
              textShadow: element.style.outline ? 
                '3px 3px 0px rgba(0,0,0,0.8), -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 4px 4px 8px rgba(0,0,0,0.6)' : 
                '2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9), 0px 0px 8px rgba(0,0,0,0.5)',
              whiteSpace: 'pre-wrap', // Allow line breaks
              maxWidth: '280px', // Constrain to viewport width
              overflow: 'hidden',
              userSelect: 'none',
              lineHeight: '1.2',
              wordWrap: 'break-word',
              minHeight: element.text ? 'auto' : '40px', // Show minimum height when empty
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.style.align === 'left' ? 'flex-start' : element.style.align === 'right' ? 'flex-end' : 'center',
            }}
          >
            {element.text || (selectedTextId === element.id ? 'Type something...' : '')}
          </div>
        )}
        
        {/* Delete button for selected text */}
        {selectedTextId === element.id && !isEditingText && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTextElement(element.id);
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs z-30"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        
        {/* Resize corner for mobile and desktop */}
        {selectedTextId === element.id && !isEditingText && (
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border-2 border-gray-400 rounded-full cursor-se-resize z-30 flex items-center justify-center shadow-lg"
            onMouseDown={(e) => handleResizeCornerStart(e, element.id)}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              const element = textElements.find(el => el.id === element.id);
              if (!element) return;
              
              setInitialScale(element.scale || 1);
              
              const startTouch = e.touches[0];
              const startX = startTouch.clientX;
              const startY = startTouch.clientY;
              
              const moveHandler = (moveEvent: TouchEvent) => {
                if (moveEvent.touches.length > 0) {
                  const currentTouch = moveEvent.touches[0];
                  const deltaX = currentTouch.clientX - startX;
                  const deltaY = currentTouch.clientY - startY;
                  const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                  const scaleChange = 1 + (delta / 100); // Adjust sensitivity
                  
                  updateTextElement(element.id, {
                    scale: Math.max(0.5, Math.min(3, (initialScale || 1) * scaleChange))
                  });
                }
              };
              
              const endHandler = () => {
                document.removeEventListener('touchmove', moveHandler);
                document.removeEventListener('touchend', endHandler);
              };
              
              document.addEventListener('touchmove', moveHandler, { passive: false });
              document.addEventListener('touchend', endHandler);
            }}
            style={{ touchAction: 'none' }}
          >
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          </div>
        )}
      </div>
    ));
  };
  
  useEffect(() => {
    if (normalizedCode) {
      setShowError(false);
      fetchCollageByCode(normalizedCode);
    }
  }, [normalizedCode, fetchCollageByCode]);

  // Load frame settings when collage loads
  useEffect(() => {
    if (currentCollage?.settings?.photobooth) {
      const photoboothSettings = currentCollage.settings.photobooth;
      
      // Load custom frame if selected
      if (photoboothSettings.selectedFrameId && 
          photoboothSettings.selectedFrameId !== 'none' && 
          photoboothSettings.selectedFrameUrl) {
        
        setCustomFrame({
          url: photoboothSettings.selectedFrameUrl,
          opacity: photoboothSettings.frameOpacity || 80
        });
      } else {
        setCustomFrame(null);
      }
      
      setFrameSettings({
        selectedFrameId: photoboothSettings.selectedFrameId || 'none',
        selectedFrameUrl: photoboothSettings.selectedFrameUrl || null,
        frameOpacity: photoboothSettings.frameOpacity || 80,
        enableTextOverlay: photoboothSettings.enableTextOverlay || false,
        defaultText: photoboothSettings.defaultText || currentCollage.name,
        textColor: photoboothSettings.textColor || '#FFFFFF',
        textSize: photoboothSettings.textSize || 24,
        textPosition: photoboothSettings.textPosition || 'bottom'
      });
    }
  }, [currentCollage]);

  useEffect(() => {
    if (!videoRef.current) return;

    const updateVideoDimensions = () => {
      if (videoRef.current) {
        const rect = videoRef.current.getBoundingClientRect();
        setVideoDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateVideoDimensions();

    resizeObserverRef.current = new ResizeObserver(updateVideoDimensions);
    resizeObserverRef.current.observe(videoRef.current);

    window.addEventListener('resize', updateVideoDimensions);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateVideoDimensions, 100);
    });

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', updateVideoDimensions);
      window.removeEventListener('orientationchange', updateVideoDimensions);
    };
  }, [streamRef.current]);

  useEffect(() => {
    if (storeError && !loading && !currentCollage) {
      const timer = setTimeout(() => {
        setShowError(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [storeError, loading, currentCollage]);

  useEffect(() => {
    if (currentCollage?.id) {
      setupRealtimeSubscription(currentCollage.id);
    }
    
    return () => {
      cleanupRealtimeSubscription();
    };
  }, [currentCollage?.id, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  useEffect(() => {
    if (currentCollage && !photo && cameraState === 'idle' && !isInitializingRef.current) {
      const timer = setTimeout(() => {
        if (!selectedDevice) {
          startCamera();
        } else {
          startCamera(selectedDevice);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [photo, cameraState, startCamera, selectedDevice, currentCollage]);

  useEffect(() => {
    if (cameraState === 'error' && currentCollage) {
      const retryTimer = setTimeout(() => {
        startCamera(selectedDevice);
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [cameraState, startCamera, selectedDevice, currentCollage]);

  useEffect(() => {
    return () => {
      cleanupCamera();
    };
  }, [cleanupCamera]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (!photo && cameraState === 'idle') {
          setTimeout(() => startCamera(selectedDevice), 500);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [photo, cameraState, startCamera, selectedDevice]);

  if (loading || (!currentCollage && !storeError)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p className="text-white">Loading photobooth...</p>
            <p className="text-gray-400 text-sm mt-2">
              Looking for collage: {normalizedCode}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showError && storeError && !loading && !currentCollage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Collage Not Found</h2>
              <p className="text-red-200 mb-4">
                {storeError || `No collage found with code "${normalizedCode}"`}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/join')}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Try Another Code
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCollage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p className="text-white">Loading photobooth...</p>
            <p className="text-gray-400 text-sm mt-2">
              Looking for collage: {normalizedCode}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen bg-gradient-to-b from-gray-900 to-black text-white ${isMobile ? 'overflow-hidden' : ''}`}>
        {/* Mobile/Tablet Full-Screen Layout */}
        {isMobile ? (
          <div className="relative w-full h-screen overflow-hidden">
            {/* Header - Fixed at top */}
            <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate(`/collage/${currentCollage?.code || ''}`)}
                    className="text-gray-200 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h1 className="text-lg font-bold text-white flex items-center space-x-2">
                      <span className="text-purple-400">📸</span>
                      <span>See PhotoSphere</span>
                    </h1>
                    <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                      <Camera className="w-5 h-5 text-purple-400" />
                      <span>Photobooth</span>
                    </h2>
                    <p className="text-gray-300 text-sm">{currentCollage?.name}</p>
                  </div>
                </div>
                
                {!photo && devices.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
                    title="Switch Camera"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`absolute top-20 left-4 right-4 z-40 p-3 rounded-lg ${
                error.includes('successfully') 
                  ? 'bg-green-900/80 border border-green-500/50 text-green-200'
                  : 'bg-red-900/80 border border-red-500/50 text-red-200'
              } backdrop-blur-sm`}>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Full-Screen Camera/Photo Container with perfect 9:16 aspect ratio */}
            <div className="w-full h-full flex items-center justify-center bg-black">
              {photo ? (
                <div ref={photoContainerRef} className="relative w-full max-w-full" style={{ aspectRatio: '9/16', maxHeight: '100vh' }}>
                  <img 
                    src={photo} 
                    alt="Captured photo" 
                    className="w-full h-full object-cover"
                    style={{ aspectRatio: '9/16' }}
                  />
                  
                  {renderTextElements()}
                  
                  {/* Always show text controls when we have a photo - Mobile */}
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4" style={{ zIndex: 9998 }}>
                    {/* Add Text Button - Always visible */}
                    <button
                      onClick={addTextElement}
                      className="w-14 h-14 bg-purple-600/80 backdrop-blur-sm hover:bg-purple-700/80 text-white rounded-full flex items-center justify-center border border-white/20 transition-all shadow-lg active:scale-95"
                      title="Add Text"
                      style={{ zIndex: 9999 }}
                    >
                      <Type className="w-7 h-7" />
                    </button>

                    {/* Text editing controls - Show when text is selected */}
                    {selectedTextId && (
                      <>
                        {/* Color Picker Icon - Modified for mobile touch */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              // Cycle through colors
                              const currentElement = textElements.find(el => el.id === selectedTextId);
                              const currentColorIndex = colorPresets.findIndex(c => c === currentElement?.color);
                              const nextColorIndex = (currentColorIndex + 1) % colorPresets.length;
                              updateTextElement(selectedTextId, { color: colorPresets[nextColorIndex] });
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              // Show color palette on touch
                              const popup = e.currentTarget.parentElement?.querySelector('.color-popup') as HTMLElement;
                              if (popup) {
                                popup.style.opacity = '1';
                                popup.style.pointerEvents = 'auto';
                                setTimeout(() => {
                                  popup.style.opacity = '0';
                                  popup.style.pointerEvents = 'none';
                                }, 3000);
                              }
                            }}
                            className="w-14 h-14 rounded-full border-2 border-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform active:scale-95"
                            style={{ 
                              backgroundColor: textElements.find(el => el.id === selectedTextId)?.color || '#ffffff',
                              zIndex: 9999
                            }}
                          >
                            <Palette className="w-7 h-7 text-black" />
                          </button>
                          
                          {/* Color Palette Popup - Modified for mobile */}
                          <div 
                            className="color-popup absolute left-16 top-0 bg-black/95 backdrop-blur-md rounded-lg p-3 opacity-0 transition-opacity pointer-events-none"
                            style={{ zIndex: 10001 }}
                          >
                            <div className="grid grid-cols-2 gap-3">
                              {colorPresets.map((color) => (
                                <button
                                  key={color}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateTextElement(selectedTextId, { color });
                                    // Hide popup after selection
                                    const popup = e.currentTarget.closest('.color-popup') as HTMLElement;
                                    if (popup) {
                                      popup.style.opacity = '0';
                                      popup.style.pointerEvents = 'none';
                                    }
                                  }}
                                  className="w-10 h-10 rounded-full border-2 border-white/40 hover:border-white transition-colors active:scale-95"
                                  style={{ backgroundColor: color, zIndex: 10002 }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Text Size Icon with Slider - Modified for mobile */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              // Cycle text size on tap
                              const element = textElements.find(el => el.id === selectedTextId);
                              if (element) {
                                const sizes = [16, 24, 32, 40, 48, 56, 64, 72];
                                const currentIndex = sizes.findIndex(s => s >= element.size);
                                const nextIndex = (currentIndex + 1) % sizes.length;
                                updateTextElement(selectedTextId, { size: sizes[nextIndex] });
                              }
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              // Show size controls on touch
                              const popup = e.currentTarget.parentElement?.querySelector('.size-popup') as HTMLElement;
                              if (popup) {
                                popup.style.opacity = '1';
                                popup.style.pointerEvents = 'auto';
                                setTimeout(() => {
                                  popup.style.opacity = '0';
                                  popup.style.pointerEvents = 'none';
                                }, 4000);
                              }
                            }}
                            className="w-14 h-14 bg-black/70 backdrop-blur-sm rounded-full border-2 border-white/80 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                            style={{ zIndex: 9999 }}
                          >
                            <ZoomIn className="w-7 h-7 text-white" />
                          </button>
                          
                          {/* Size Slider Popup - Modified for mobile */}
                          <div 
                            className="size-popup absolute left-16 top-0 bg-black/95 backdrop-blur-md rounded-lg p-4 opacity-0 transition-opacity pointer-events-none"
                            style={{ zIndex: 10001 }}
                          >
                            <div className="flex items-center space-x-3 w-40">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const element = textElements.find(el => el.id === selectedTextId);
                                  if (element && selectedTextId) {
                                    updateTextElement(selectedTextId, { size: Math.max(16, element.size - 4) });
                                  }
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation();
                                  const element = textElements.find(el => el.id === selectedTextId);
                                  if (element && selectedTextId) {
                                    updateTextElement(selectedTextId, { size: Math.max(16, element.size - 4) });
                                  }
                                }}
                                className="w-8 h-8 bg-white/30 hover:bg-white/50 text-white rounded-full flex items-center justify-center text-lg font-bold active:scale-95"
                                style={{ zIndex: 10002 }}
                              >
                                -
                              </button>
                              <input
                                type="range"
                                min="16"
                                max="72"
                                value={textElements.find(el => el.id === selectedTextId)?.size || 32}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (selectedTextId) {
                                    updateTextElement(selectedTextId, { size: parseInt(e.target.value) });
                                  }
                                }}
                                onInput={(e) => {
                                  e.stopPropagation();
                                  if (selectedTextId) {
                                    updateTextElement(selectedTextId, { size: parseInt((e.target as HTMLInputElement).value) });
                                  }
                                }}
                                className="flex-1 h-3 bg-white/30 rounded-full appearance-none cursor-pointer"
                                style={{ zIndex: 10002 }}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const element = textElements.find(el => el.id === selectedTextId);
                                  if (element && selectedTextId) {
                                    updateTextElement(selectedTextId, { size: Math.min(72, element.size + 4) });
                                  }
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation();
                                  const element = textElements.find(el => el.id === selectedTextId);
                                  if (element && selectedTextId) {
                                    updateTextElement(selectedTextId, { size: Math.min(72, element.size + 4) });
                                  }
                                }}
                                className="w-8 h-8 bg-white/30 hover:bg-white/50 text-white rounded-full flex items-center justify-center text-lg font-bold active:scale-95"
                                style={{ zIndex: 10002 }}
                              >
                                +
                              </button>
                            </div>
                            <div className="text-white text-sm text-center mt-2 font-medium">
                              {textElements.find(el => el.id === selectedTextId)?.size || 32}px
                            </div>
                          </div>
                        </div>
                        
                        {/* Background/Style Icon - Modified for mobile */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              // Cycle through background styles
                              const currentElement = textElements.find(el => el.id === selectedTextId);
                              const currentStyleIndex = textStylePresets.findIndex(s => s.name === currentElement?.style.name);
                              const nextStyleIndex = (currentStyleIndex + 1) % textStylePresets.length;
                              updateTextElement(selectedTextId, { style: textStylePresets[nextStyleIndex] });
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              // Show style options on touch
                              const popup = e.currentTarget.parentElement?.querySelector('.style-popup') as HTMLElement;
                              if (popup) {
                                popup.style.opacity = '1';
                                popup.style.pointerEvents = 'auto';
                                setTimeout(() => {
                                  popup.style.opacity = '0';
                                  popup.style.pointerEvents = 'none';
                                }, 3000);
                              }
                            }}
                            className="w-14 h-14 bg-black/70 backdrop-blur-sm rounded-full border-2 border-white/80 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                            style={{ zIndex: 9999 }}
                          >
                            <Settings className="w-7 h-7 text-white" />
                          </button>
                          
                          {/* Background Style Popup - Modified for mobile */}
                          <div 
                            className="style-popup absolute left-16 top-0 bg-black/95 backdrop-blur-md rounded-lg p-3 opacity-0 transition-opacity pointer-events-none"
                            style={{ zIndex: 10001 }}
                          >
                            <div className="space-y-2">
                              {textStylePresets.map((preset) => {
                                const selectedElement = textElements.find(el => el.id === selectedTextId);
                                const isSelected = selectedElement?.style.name === preset.name;
                                return (
                                  <button
                                    key={preset.name}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateTextElement(selectedTextId, { style: preset });
                                      // Hide popup after selection
                                      const popup = e.currentTarget.closest('.style-popup') as HTMLElement;
                                      if (popup) {
                                        popup.style.opacity = '0';
                                        popup.style.pointerEvents = 'none';
                                      }
                                    }}
                                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap active:scale-95 ${
                                      isSelected 
                                        ? 'bg-white text-black' 
                                        : 'bg-white/30 text-white hover:bg-white/50'
                                    }`}
                                    style={{ zIndex: 10002 }}
                                  >
                                    {preset.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Delete All Text Button - Show when we have text */}
                    {textElements.length > 0 && (
                      <button
                        onClick={() => {
                          setTextElements([]);
                          setSelectedTextId(null);
                          setIsEditingText(false);
                          setShowTextStylePanel(false);
                        }}
                        className="w-14 h-14 bg-red-600/70 backdrop-blur-sm hover:bg-red-600/80 text-white rounded-full flex items-center justify-center border border-white/20 transition-all shadow-lg active:scale-95"
                        title="Delete All Text"
                        style={{ zIndex: 9999 }}
                      >
                        <X className="w-7 h-7" />
                      </button>
                    )}
                  </div>
                  
                  {/* Instagram Story-like UI Controls - Top Right - Fixed z-index for mobile */}
                  <div className="absolute top-4 right-4 flex flex-col space-y-3" style={{ zIndex: 9999 }}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadPhoto();
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        downloadPhoto();
                      }}
                      disabled={isDownloading}
                      className="w-14 h-14 bg-green-600/90 backdrop-blur-sm hover:bg-green-700/90 disabled:bg-gray-600/70 text-white rounded-full flex items-center justify-center border-2 border-white/30 transition-all shadow-xl active:scale-95"
                      title="Download Photo"
                      style={{ 
                        touchAction: 'manipulation',
                        zIndex: 10000,
                        WebkitTapHighlightColor: 'transparent',
                        position: 'relative'
                      }}
                    >
                      {isDownloading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-7 h-7" />
                      )}
                    </button>
                  </div>
                  
                  {/* Bottom Action Bar */}
                  <div className="absolute bottom-8 left-4 right-4 flex justify-center space-x-4 z-30">
                    <button
                      onClick={retakePhoto}
                      className="px-6 py-3 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white rounded-full transition-all border border-white/20 flex items-center space-x-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Retake</span>
                    </button>
                    
                    <button
                      onClick={uploadToCollage}
                      disabled={uploading}
                      className="px-6 py-3 bg-green-600/80 hover:bg-green-600 disabled:bg-green-800/60 text-white rounded-full transition-colors border border-white/20 flex items-center space-x-2 backdrop-blur-sm"
                    >
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Upload</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full max-w-full bg-gray-900" style={{ aspectRatio: '9/16', maxHeight: '100vh' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ aspectRatio: '9/16' }}
                  />
                  
                  {/* Custom Frame Overlay - shows in live preview with perfect fit */}
                  {customFrame?.url && frameLoaded && (
                    <img
                      src={customFrame.url}
                      alt="Custom frame overlay"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      style={{ 
                        opacity: customFrame.opacity / 100,
                        zIndex: 10,
                        aspectRatio: '9/16'
                      }}
                      onLoad={() => {}}
                      onError={() => {}}
                    />
                  )}

                  {/* Default Text Overlay */}
                  {frameSettings.enableTextOverlay && frameSettings.defaultText && (
                    <div 
                      className={`absolute left-4 right-4 text-center z-20 ${
                        frameSettings.textPosition === 'top' ? 'top-4' :
                        frameSettings.textPosition === 'center' ? 'top-1/2 transform -translate-y-1/2' :
                        'bottom-4'
                      }`}
                      style={{ 
                        color: frameSettings.textColor,
                        fontSize: `${frameSettings.textSize}px`,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                      }}
                    >
                      {frameSettings.defaultText}
                    </div>
                  )}
                  
                  {/* Frame Status Indicator */}
                  {/* Removed frame status indicator */}
                  
                  {cameraState !== 'active' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <div className="text-center text-white">
                        {cameraState === 'starting' && (
                          <>
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                            <p className="text-lg">Starting camera...</p>
                          </>
                        )}
                        {cameraState === 'error' && (
                          <>
                            <Camera className="w-12 h-12 mx-auto mb-4 text-red-400" />
                            <p className="text-red-200 text-lg mb-4">Camera unavailable</p>
                            <button
                              onClick={() => startCamera(selectedDevice)}
                              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full text-lg transition-colors"
                            >
                              Retry
                            </button>
                          </>
                        )}
                        {cameraState === 'idle' && (
                          <>
                            <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg mb-4">Camera not started</p>
                            <button
                              onClick={() => {
                                if (selectedDevice) {
                                  startCamera(selectedDevice);
                                } else {
                                  startCamera();
                                }
                              }}
                              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-lg transition-colors"
                            >
                              Start Camera
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Capture Button - Full Screen */}
                  {cameraState === 'active' && (
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
                      <button 
                        onClick={capturePhoto}
                        className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 transition-all active:scale-95 flex items-center justify-center shadow-xl focus:outline-none"
                        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                      >
                        <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
        ) : (
          /* Desktop Layout - Updated with perfect 9:16 aspect ratio */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(`/collage/${currentCollage?.code || ''}`)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-purple-400" />
                    </div>
                    <span>See PhotoSphere</span>
                  </h1>
                  <p className="text-gray-400">{currentCollage?.name} • Code: {currentCollage?.code}</p>
                </div>
              </div>
              
              {!photo && devices.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  title="Switch Camera"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              )}
            </div>

            {error && (
              <div className={`mb-4 p-4 rounded-lg ${
                error.includes('successfully') 
                  ? 'bg-green-900/30 border border-green-500/50 text-green-200'
                  : 'bg-red-900/30 border border-red-500/50 text-red-200'
              }`}>
                {error}
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
              <div className="flex-1 flex justify-center" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ width: '360px', aspectRatio: '9/16' }}>
                  {photo ? (
                    <div ref={photoContainerRef} className="relative w-full h-full" style={{ aspectRatio: '9/16' }}>
                      <img 
                        src={photo} 
                        alt="Captured photo" 
                        className="w-full h-full object-cover"
                        style={{ aspectRatio: '9/16' }}
                      />
                      
                      {renderTextElements()}
                      
                      {/* VERTICAL TEXT SETTINGS - LEFT SIDE (Show when text is selected) */}
                      {selectedTextId && (
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4" style={{ zIndex: 50 }}>
                          {/* Color Picker Icon */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                // Cycle through colors
                                const currentElement = textElements.find(el => el.id === selectedTextId);
                                const currentColorIndex = colorPresets.findIndex(c => c === currentElement?.color);
                                const nextColorIndex = (currentColorIndex + 1) % colorPresets.length;
                                updateTextElement(selectedTextId, { color: colorPresets[nextColorIndex] });
                              }}
                              className="w-12 h-12 rounded-full border-2 border-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                              style={{ 
                                backgroundColor: textElements.find(el => el.id === selectedTextId)?.color || '#ffffff',
                                zIndex: 51
                              }}
                            >
                              <Palette className="w-6 h-6 text-black" />
                            </button>
                            
                            {/* Color Palette Popup */}
                            <div 
                              className="absolute left-14 top-0 bg-black/90 backdrop-blur-md rounded-lg p-3 opacity-0 hover:opacity-100 transition-opacity"
                              style={{ zIndex: 52 }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                            >
                              <div className="grid grid-cols-2 gap-2">
                                {colorPresets.map((color) => (
                                  <button
                                    key={color}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateTextElement(selectedTextId, { color });
                                    }}
                                    className="w-8 h-8 rounded-full border border-white/40 hover:border-white transition-colors"
                                    style={{ backgroundColor: color, zIndex: 53 }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Text Size Icon with Slider */}
                          <div className="relative">
                            <button
                              className="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full border-2 border-white/80 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                              style={{ zIndex: 51 }}
                            >
                              <Type className="w-6 h-6 text-white" />
                            </button>
                            
                            {/* Size Slider Popup */}
                            <div 
                              className="absolute left-14 top-0 bg-black/90 backdrop-blur-md rounded-lg p-3 opacity-0 hover:opacity-100 transition-opacity"
                              style={{ zIndex: 52 }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                            >
                              <div className="flex items-center space-x-3 w-32">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const element = textElements.find(el => el.id === selectedTextId);
                                    if (element) {
                                      updateTextElement(selectedTextId, { size: Math.max(16, element.size - 4) });
                                    }
                                  }}
                                  className="w-6 h-6 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center text-xs font-bold"
                                  style={{ zIndex: 53 }}
                                >
                                  -
                                </button>
                                <input
                                  type="range"
                                  min="16"
                                  max="72"
                                  value={textElements.find(el => el.id === selectedTextId)?.size || 32}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updateTextElement(selectedTextId, { size: parseInt(e.target.value) });
                                  }}
                                  className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
                                  style={{ zIndex: 53 }}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const element = textElements.find(el => el.id === selectedTextId);
                                    if (element) {
                                      updateTextElement(selectedTextId, { size: Math.min(72, element.size + 4) });
                                    }
                                  }}
                                  className="w-6 h-6 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center text-xs font-bold"
                                  style={{ zIndex: 53 }}
                                >
                                  +
                                </button>
                              </div>
                              <div className="text-white text-xs text-center mt-1">
                                {textElements.find(el => el.id === selectedTextId)?.size || 32}px
                              </div>
                            </div>
                          </div>
                          
                          {/* Background/Style Icon */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                // Cycle through background styles
                                const currentElement = textElements.find(el => el.id === selectedTextId);
                                const currentStyleIndex = textStylePresets.findIndex(s => s.name === currentElement?.style.name);
                                const nextStyleIndex = (currentStyleIndex + 1) % textStylePresets.length;
                                updateTextElement(selectedTextId, { style: textStylePresets[nextStyleIndex] });
                              }}
                              className="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full border-2 border-white/80 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                              style={{ zIndex: 51 }}
                            >
                              <Settings className="w-6 h-6 text-white" />
                            </button>
                            
                            {/* Background Style Popup */}
                            <div 
                              className="absolute left-14 top-0 bg-black/90 backdrop-blur-md rounded-lg p-2 opacity-0 hover:opacity-100 transition-opacity"
                              style={{ zIndex: 52 }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                            >
                              <div className="space-y-2">
                                {textStylePresets.map((preset) => {
                                  const selectedElement = textElements.find(el => el.id === selectedTextId);
                                  const isSelected = selectedElement?.style.name === preset.name;
                                  return (
                                    <button
                                      key={preset.name}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateTextElement(selectedTextId, { style: preset });
                                      }}
                                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                        isSelected 
                                          ? 'bg-white text-black' 
                                          : 'bg-white/20 text-white hover:bg-white/40'
                                      }`}
                                      style={{ zIndex: 53 }}
                                    >
                                      {preset.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Instagram Story-like UI Controls - Top Right */}
                      <div className="absolute top-4 right-4 flex flex-col space-y-3 z-20">
                        <button
                          onClick={addTextElement}
                          className="w-12 h-12 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white rounded-full flex items-center justify-center border border-white/20 transition-all"
                          title="Add Text"
                        >
                          <Type className="w-6 h-6" />
                        </button>
                        
                        <button
                          onClick={downloadPhoto}
                          disabled={isDownloading}
                          className="w-12 h-12 bg-black/60 backdrop-blur-sm hover:bg-black/80 disabled:bg-gray-600/60 text-white rounded-full flex items-center justify-center border border-white/20 transition-all"
                          title="Download"
                        >
                          {isDownloading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-6 h-6" />
                          )}
                        </button>
                        
                        {/* Delete All Text Button */}
                        {textElements.length > 0 && (
                          <button
                            onClick={() => {
                              setTextElements([]);
                              setSelectedTextId(null);
                              setIsEditingText(false);
                              setShowTextStylePanel(false);
                            }}
                            className="w-12 h-12 bg-red-600/60 backdrop-blur-sm hover:bg-red-600/80 text-white rounded-full flex items-center justify-center border border-white/20 transition-all"
                            title="Delete All Text"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        )}
                      </div>
                      
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30 flex space-x-4">
                          <button
                            onClick={retakePhoto}
                            className="px-4 py-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white rounded-full transition-all border border-white/20"
                          >
                            <RefreshCw className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={uploadToCollage}
                            disabled={uploading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-full transition-colors border border-white/20"
                          >
                            {uploading ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full bg-gray-800" style={{ aspectRatio: '9/16' }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ aspectRatio: '9/16' }}
                      />
                      
                      {/* Custom Frame Overlay - shows in live preview with perfect 9:16 fit */}
                      {customFrame?.url && frameLoaded && (
                        <img
                          src={customFrame.url}
                          alt="Custom frame overlay"
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                          style={{ 
                            opacity: customFrame.opacity / 100,
                            zIndex: 10,
                            aspectRatio: '9/16'
                          }}
                          onLoad={() => {}}
                          onError={() => {}}
                        />
                      )}

                      {/* Default Text Overlay */}
                      {frameSettings.enableTextOverlay && frameSettings.defaultText && (
                        <div 
                          className={`absolute left-4 right-4 text-center z-20 ${
                            frameSettings.textPosition === 'top' ? 'top-4' :
                            frameSettings.textPosition === 'center' ? 'top-1/2 transform -translate-y-1/2' :
                            'bottom-4'
                          }`}
                          style={{ 
                            color: frameSettings.textColor,
                            fontSize: `${frameSettings.textSize}px`,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                          }}
                        >
                          {frameSettings.defaultText}
                        </div>
                      )}
                      
                      {/* Frame Status Indicator */}
                      {/* Removed frame status indicator */}
                      
                      {cameraState !== 'active' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="text-center text-white">
                            {cameraState === 'starting' && (
                              <>
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2"></div>
                                <p className="text-sm">Starting camera...</p>
                              </>
                            )}
                            {cameraState === 'error' && (
                              <>
                                <Camera className="w-8 h-8 mx-auto mb-2 text-red-400" />
                                <p className="text-red-200 text-sm mb-2">Camera unavailable</p>
                                <button
                                  onClick={() => startCamera(selectedDevice)}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                                >
                                  Retry
                                </button>
                              </>
                            )}
                            {cameraState === 'idle' && (
                              <>
                                <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm mb-2">Camera not started</p>
                                <button
                                  onClick={() => {
                                    if (selectedDevice) {
                                      startCamera(selectedDevice);
                                    } else {
                                      startCamera();
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                                >
                                  Start Camera
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* DESKTOP CAPTURE BUTTON - With perfect positioning for 9:16 */}
                      {cameraState === 'active' && (
                        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              capturePhoto();
                            }}
                            className="w-12 h-12 bg-white rounded-full border-3 border-gray-300 hover:border-gray-100 transition-all active:scale-95 flex items-center justify-center shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/50"
                            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                            title="Take Photo"
                          >
                            <div className="w-8 h-8 bg-gray-300 hover:bg-gray-400 rounded-full transition-colors"></div>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>

              <div className="w-full lg:w-72 space-y-4 lg:space-y-6">
                {devices.length > 1 && (
                  <div className="bg-gray-900 rounded-lg p-4 lg:p-6">
                    <div className="flex items-center space-x-2 mb-3 lg:mb-4">
                      <Settings className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" />
                      <h3 className="text-base lg:text-lg font-semibold text-white">Camera Settings</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300">
                        Camera Device
                        {devices.length > 0 && (
                          <span className="text-xs text-gray-400 ml-2">
                            ({devices.length} available)
                          </span>
                        )}
                      </label>
                      <select
                        value={selectedDevice}
                        onChange={(e) => handleDeviceChange(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        style={{ fontSize: '16px' }}
                      >
                        {devices.map((device, index) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${index + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Frame Settings Display */}
                {customFrame && (
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                    <h4 className="text-purple-300 font-medium mb-2 flex items-center">
                      <Frame className="w-4 h-4 mr-2" />
                      Custom Frame Active
                    </h4>
                    <div className="text-purple-200 text-sm space-y-1">
                      <div>Opacity: {customFrame.opacity}%</div>
                      <div>Status: {frameLoaded ? 'Loaded' : 'Loading...'}</div>
                      <div className="text-xs text-purple-300">Perfect 9:16 fit enabled</div>
                    </div>
                  </div>
                )}

                {currentCollage && (
                  <div className="bg-gray-900 rounded-lg p-4 lg:p-6">
                    <h3 className="text-base lg:text-lg font-semibold text-white mb-3">Collage Info</h3>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Name:</span>
                        <span className="text-white truncate ml-2">{currentCollage.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Code:</span>
                        <span className="text-white font-mono">{currentCollage.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Photos:</span>
                        <span className="text-white">{safePhotos.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Format:</span>
                        <span className="text-green-400 text-xs">9:16 Portrait</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {showVideoRecorder && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/50 backdrop-blur-md p-4 rounded-lg border border-white/20">
            <MobileVideoRecorder 
              canvasRef={canvasRef} 
              onClose={() => setShowVideoRecorder(false)}
              onResolutionChange={(width, height) => setRecordingResolution({ width, height })}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default PhotoboothPage;