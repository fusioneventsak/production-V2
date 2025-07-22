Looking at your script, I can see it's missing several closing brackets. Here's the corrected version:

```typescript
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
  const [recordingResolution, setRecordingResolution] = useState({ width: 1080, height: 1920 });
  
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
    console.log('🧹 Cleaning up camera...');
    
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
      
      console.log('📹 Available video devices:', videoDevices);
      return videoDevices;
    } catch (error) {
      console.warn('⚠️ Could not enumerate devices:', error);
      return [];
    }
  }, []);

  const waitForVideoElement = useCallback(async (maxWaitMs: number = 5000): Promise<HTMLVideoElement | null> => {
    const startTime = Date.now();
    
    console.log('⏳ Waiting for video element to be available...');
    while (Date.now() - startTime < maxWaitMs) {
      if (videoRef.current) {
        console.log('✅ Video element is available');
        return videoRef.current;
      }
      
      console.log('⏳ Waiting for video element...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.error('❌ Video element not available after waiting');
    return null;
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    if (isInitializingRef.current) {
      console.log('🔄 Camera initialization already in progress, skipping...');
      return;
    }

    console.log('🎥 Starting camera initialization with device:', deviceId);
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
      
      console.log('📱 Platform detected:', { isIOS, isAndroid, isMobileDevice });
      
      let constraints: MediaStreamConstraints;
      
      if (deviceId) {
        constraints = {
          video: {
            deviceId: { exact: deviceId },
            ...(isMobileDevice ? { facingMode: "user" } : {}),
            width: { ideal: 1080, max: 1920 },
            height: { ideal: 1920, max: 1920 },
            aspectRatio: { ideal: 9/16 }
          },
          audio: false
        };
      } else {
        constraints = {
          video: {
            ...(isMobileDevice ? { facingMode: "user" } : true),
            width: { ideal: 1080, max: 1920 },
            height: { ideal: 1920, max: 1920 },
            aspectRatio: { ideal: 9/16 }
          },
          audio: false
        };
      }
      
      console.log('🔧 Using constraints:', constraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Got media stream:', mediaStream.active);
      
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
          console.log('📱 Auto-selecting front camera:', frontCamera.label);
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
      
      // Enhanced event handling with better timing
      let hasStartedPlaying = false;
      let eventListeners: { element: HTMLElement, event: string, handler: EventListener }[] = [];
      
      // Helper function to ensure video plays
      const ensureVideoPlay = async (video: HTMLVideoElement) => {
        try {
          // Check if video can autoplay
          const playPromise = video.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            console.log('✅ Video autoplay successful');
            return true;
          }
        } catch (error: any) {
          console.warn('⚠️ Autoplay prevented:', error.message);
          
          // If autoplay fails, try to enable play after user interaction
          if (error.name === 'NotAllowedError') {
            console.log('👆 Autoplay blocked - waiting for user interaction');
            setError('Camera ready - tap anywhere to start video');
            
            const enablePlay = () => {
              video.play().then(() => {
                console.log('✅ Video play after interaction successful');
                setError(null);
                document.removeEventListener('click', enablePlay);
                document.removeEventListener('touchstart', enablePlay);
              }).catch(err => console.error('❌ Play after interaction failed:', err));
            };
            
            document.addEventListener('click', enablePlay, { once: true });
            document.addEventListener('touchstart', enablePlay, { once: true });
          }
          
          return false;
        }
        return false;
      };
      
      // Add event listener with tracking for cleanup
      const addTrackedEventListener = (element: HTMLElement, event: string, handler: EventListener) => {
        element.addEventListener(event, handler);
        eventListeners.push({ element, event, handler });
      };
      
      // Clean up all tracked event listeners
      const cleanupEventListeners = () => {
        eventListeners.forEach(({ element, event, handler }) => {
          element.removeEventListener(event, handler);
        });
        eventListeners = [];
      };
      
      const handleLoadedMetadata = async () => {
        console.log('📹 Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
        if (!hasStartedPlaying && video) {
          const success = await ensureVideoPlay(video);
          if (success) {
            hasStartedPlaying = true;
            streamRef.current = mediaStream;
            setCameraState('active');
            console.log('✅ Camera active and streaming from loadedmetadata');
            cleanupEventListeners();
          }
        }
      };
      
      const handleCanPlay = async () => {
        console.log('📹 Video can play - attempting play if not already playing');
        if (!hasStartedPlaying && video && video.paused) {
          const success = await ensureVideoPlay(video);
          if (success) {
            hasStartedPlaying = true;
            streamRef.current = mediaStream;
            setCameraState('active');
            console.log('✅ Camera active and streaming from canplay');
            cleanupEventListeners();
          }
        }
      };
      
      const handleLoadedData = async () => {
        console.log('📹 Video data loaded');
        // Additional attempt to play
        if (!hasStartedPlaying && video && video.readyState >= 2) {
          const success = await ensureVideoPlay(video);
          if (success) {
            hasStartedPlaying = true;
            streamRef.current = mediaStream;
            setCameraState('active');
            console.log('✅ Camera active and streaming from loadeddata');
            cleanupEventListeners();
          }
        }
      };
      
      const handleError = (event: Event) => {
        console.error('❌ Video element error:', event);
        const target = event.target as HTMLVideoElement;
        if (target && target.error) {
          console.error('❌ Video error details:', target.error);
        }
        setCameraState('error');
        setError('Video playback error');
        mediaStream.getTracks().forEach(track => track.stop());
        cleanupEventListeners();
      };
      
      // Add event listeners - removed once: true to allow multiple attempts
      addTrackedEventListener(video, 'loadedmetadata', handleLoadedMetadata);
      addTrackedEventListener(video, 'canplay', handleCanPlay);
      addTrackedEventListener(video, 'loadeddata', handleLoadedData);
      addTrackedEventListener(video, 'error', handleError);
      
      // Additional debugging events
      addTrackedEventListener(video, 'loadstart', () => console.log('📹 Video load start'));
      addTrackedEventListener(video, 'canplaythrough', () => console.log('📹 Video can play through'));
      
      console.log('📹 Video element setup complete, waiting for events...');
      
      // Set the stream with a small delay to ensure event listeners are ready
      await new Promise(resolve => setTimeout(resolve, 100));
      video.srcObject = mediaStream;
      
      // AGGRESSIVE FALLBACK: Force camera active after short delay
      setTimeout(() => {
        if (!hasStartedPlaying) {
          console.log('🚨 FORCING camera active - video events not firing properly');
          console.log('🚨 Video readyState:', video.readyState);
          console.log('🚨 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
          console.log('🚨 Video paused:', video.paused);
          
          // Force the camera to active state regardless of events
          hasStartedPlaying = true;
          streamRef.current = mediaStream;
          setCameraState('active');
          console.log('✅ Camera FORCED to active state');
          cleanupEventListeners();
        }
      }, 1000); // Force after 1 second
      
      // Force a manual check after setting srcObject
      setTimeout(() => {
        if (!hasStartedPlaying && video && video.readyState >= 1) {
          console.log('🔧 Manual video state check - readyState:', video.readyState);
          console.log('🔧 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
          
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('✅ Video has dimensions, attempting manual play...');
            ensureVideoPlay(video).then(success => {
              if (success) {
                hasStartedPlaying = true;
                streamRef.current = mediaStream;
                setCameraState('active');
                console.log('✅ Camera active via manual check');
                cleanupEventListeners();
              }
            });
          }
        }
      }, 500);
      
      // Force load and play if needed after a short delay
      const forcePlayTimeout = setTimeout(async () => {
        if (!hasStartedPlaying && video && video.readyState >= 1) {
          console.log('⏰ Forcing video play after timeout...');
          console.log('⏰ Video readyState:', video.readyState, 'dimensions:', video.videoWidth, 'x', video.videoHeight);
          
          const success = await ensureVideoPlay(video);
          if (success) {
            hasStartedPlaying = true;
            streamRef.current = mediaStream;
            setCameraState('active');
            console.log('✅ Camera active and streaming from force play');
            cleanupEventListeners();
          } else {
            console.error('❌ Forced play failed');
            // Still set to active if we have video dimensions
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              console.log('📹 Video has dimensions, setting active anyway');
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
      
      // Cleanup timeout when camera becomes active
      const checkActive = setInterval(() => {
        if (hasStartedPlaying || cameraState === 'active') {
          clearTimeout(forcePlayTimeout);
          clearInterval(checkActive);
          cleanupEventListeners();
        }
      }, 100);
      
    } catch (err: any) {
      console.error('❌ Camera initialization failed:', err);
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
          console.log('🔄 Trying fallback constraints...');
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
            console.log('✅ Fallback camera working');
            return;
          } else {
            fallbackStream.getTracks().forEach(track => track.stop());
            throw new Error('Video element not available for fallback');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
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
      console.log('📱 Device changed, restarting camera...');
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

  // Handle text interaction start (mouse/touch)
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

  // Handle resize corner drag (desktop only)
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
      const scaleChange = 1 + (delta / 100); // Adjust sensitivity
      
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

  // Helper function to wrap text based on maximum width
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
      
      // Load selected frame if it exists
      if (photoboothSettings.selectedFrameUrl && photoboothSettings.selectedFrameId !== 'none') {
        console.log('🖼️ PHOTOBOOTH: Loading custom frame:', photoboothSettings.selectedFrameUrl);
        console.log('🖼️ PHOTOBOOTH: Frame opacity:', photoboothSettings.frameOpacity);
        
        setCustomFrame({
          id: photoboothSettings.selectedFrameId,
          url: photoboothSettings.selectedFrameUrl,
          opacity: photoboothSettings.frameOpacity || 80
        });
        setFrameLoaded(false); // Reset loaded state when frame changes
      } else {
        console.log('🖼️ PHOTOBOOTH: No custom frame selected');
        setCustomFrame(null);
        setFrameLoaded(false);
      }
    }
  }, [currentCollage]);

  // Preload frame image to ensure it's ready for capture
  useEffect(() => {
    if (customFrame?.url) {
      console.log('🖼️ PHOTOBOOTH: Preloading frame image:', customFrame.url);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log('✅ PHOTOBOOTH: Custom frame preloaded successfully');
        setFrameLoaded(true);
      };
      
      img.onerror = (error) => {
        console.error('❌ PHOTOBOOTH: Failed to preload custom frame:', error);
        console.error('❌ PHOTOBOOTH: Frame URL:', customFrame.url);
        setFrameLoaded(false);
      };
      
      img.src = customFrame.url;
    } else {
      setFrameLoaded(false);
    }
  }, [customFrame]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || cameraState !== 'active') {
      console.log('❌ PHOTOBOOTH: Cannot capture - missing refs or camera not active');
      return;
    }

    setIsEditingText(false);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.log('❌ PHOTOBOOTH: Cannot get canvas context');
      return;
    }

    console.log('📸 PHOTOBOOTH: Starting photo capture...');
    console.log('🖼️ PHOTOBOOTH: Custom frame state:', { 
      hasFrame: !!customFrame, 
      frameLoaded, 
      frameUrl: customFrame?.url,
      frameOpacity: customFrame?.opacity 
    });
    console.log('🎨 PHOTOBOOTH: Text elements available:', textElements.length);

    const targetAspectRatio = 9 / 16;
    const canvasWidth = 1080;
    const canvasHeight = 1920;
    
    console.log('🖼️ PHOTOBOOTH: Setting canvas size:', canvasWidth, 'x', canvasHeight);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas completely
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    console.log('🧹 PHOTOBOOTH: Canvas cleared');
    
    // Calculate source dimensions to maintain 9:16 aspect ratio
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    let sourceWidth, sourceHeight, sourceX, sourceY;
    
    if (videoAspectRatio > targetAspectRatio) {
      // Video is wider than 9:16, crop sides
      sourceHeight = video.videoHeight;
      sourceWidth = sourceHeight * targetAspectRatio;
      sourceX = (video.videoWidth - sourceWidth) / 2;
      sourceY = 0;
    } else {
      // Video is taller or equal to 9:16, crop top/bottom
      sourceWidth = video.videoWidth;
      sourceHeight = sourceWidth / targetAspectRatio;
      sourceX = 0;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    // Draw video frame
    context.drawImage(
      video,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvasWidth, canvasHeight
    );

    console.log('📹 PHOTOBOOTH: Video frame drawn to canvas');

    // Function to complete the capture process
    const completeCapture = () => {
      // Add visual indicator for successful frame application
      if (customFrame?.url && frameLoaded) {
        console.log('✅ PHOTOBOOTH: Adding green dot - frame successfully applied');
        context.fillStyle = '#00ff00';
        context.beginPath();
        context.arc(canvasWidth - 20, 20, 8, 0, 2 * Math.PI);
        context.fill();
      } else if (customFrame?.url && !frameLoaded) {
        console.log('🔴 PHOTOBOOTH: Adding red dot - frame failed to load');
        context.fillStyle = '#ff0000';
        context.beginPath();
        context.arc(canvasWidth - 20, 20, 8, 0, 2 * Math.PI);
        context.fill();
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      console.log('📸 PHOTOBOOTH: Photo capture complete');
      setPhoto(dataUrl);
      cleanupCamera();
    };

    // Draw custom frame if present and loaded
    if (customFrame?.url && frameLoaded) {
      console.log('🖼️ PHOTOBOOTH: Adding custom frame to captured photo...');
      console.log('🖼️ PHOTOBOOTH: Frame URL:', customFrame.url);
      console.log('🖼️ PHOTOBOOTH: Frame opacity:', customFrame.opacity);
      
      const frameImg = new Image();
      frameImg.crossOrigin = 'anonymous';
      
      frameImg.onload = () => {
        console.log('✅ PHOTOBOOTH: Frame image loaded for capture, drawing to canvas');
        console.log('🖼️ PHOTOBOOTH: Frame dimensions:', frameImg.width, 'x', frameImg.height);
        
        // Save current context state
        context.save();
        
        // Set frame opacity
        const opacity = customFrame.opacity / 100;
        context.globalAlpha = opacity;
        console.log('🎨 PHOTOBOOTH: Applying frame with opacity:', opacity);
        
        // Draw frame covering the entire canvas
        context.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
        
        // Restore context state
        context.restore();
        
        console.log('🖼️ PHOTOBOOTH: Custom frame successfully added to captured photo');
        completeCapture();
      };
      
      frameImg.onerror = (error) => {
        console.error('❌ PHOTOBOOTH: Failed to load frame for capture:', error);
        console.error('❌ PHOTOBOOTH: Frame URL:', customFrame.url);
        
        // Add red border to indicate frame failure
        context.strokeStyle = '#ff0000';
        context.lineWidth = 8;
        context.strokeRect(4, 4, canvasWidth - 8, canvasHeight - 8);
        console.log('🔴 PHOTOBOOTH: Added red border to indicate frame failure');
        
        completeCapture();
      };
      
      // Load the frame image
      console.log('🔄 PHOTOBOOTH: Loading frame image for capture...');
      frameImg.src = customFrame.url;
    } else {
      // No frame to add, complete capture
      if (customFrame?.url && !frameLoaded) {
        console.log('⚠️ PHOTOBOOTH: Frame configured but not loaded, proceeding without frame');
      } else {
        console.log('📸 PHOTOBOOTH: No custom frame configured, completing capture');
      }
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
        // High-resolution output dimensions
        const HIGH_RES_WIDTH = 1080;
        const HIGH_RES_HEIGHT = 1920;
        
        // Calculate proper scaling factor to match preview appearance
        let textScaleFactor = 1;
        
        if (photoContainerRef.current) {
          const rect = photoContainerRef.current.getBoundingClientRect();
          textScaleFactor = HIGH_RES_WIDTH / rect.width;
          
          console.log('📐 Preview container:', rect.width, 'x', rect.height);
          console.log('📐 Text scale factor:', textScaleFactor);
          console.log('📐 Output dimensions:', HIGH_RES_WIDTH, 'x', HIGH_RES_HEIGHT);
        } else {
          textScaleFactor = HIGH_RES_WIDTH / 360;
          console.warn('⚠️ Preview container not found, using fallback text scale factor:', textScaleFactor);
        }
        
        console.log('📝 PHOTOBOOTH: Text elements available:', textElements.length);
        console.log('📐 PHOTOBOOTH: Preview container dimensions for scaling reference');

        // Function to render text elements
        const renderTextElements = () => {
          console.log('🎨 PHOTOBOOTH: Rendering', textElements.length, 'text elements to high-resolution image');

          // Render all text elements with proportional scaling to match preview
          textElements.forEach((element, index) => {
            if (!element.text || element.text.trim() === '') {
              return;
            }

            console.log(`✏️ PHOTOBOOTH: Rendering text element ${index}: "${element.text}"`);

            // Calculate positions (these scale with the resolution)
            const x = (element.position.x / 100) * HIGH_RES_WIDTH;
            const y = (element.position.y / 100) * HIGH_RES_HEIGHT;
            
            // Scale font size proportionally to match preview appearance
            const baseFontSize = element.size * (element.scale || 1);
            const fontSize = baseFontSize * textScaleFactor;
            
            console.log(`📝 PHOTOBOOTH: Element ${index}: preview size ${baseFontSize}px, final size ${fontSize}px (scale: ${textScaleFactor})`);

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

          // Return the final high-resolution image with text
          const finalImageData = canvas.toDataURL('image/jpeg', 1.0);
          console.log('✅ PHOTOBOOTH: High-res image complete with frame and text');
          console.log('📊 PHOTOBOOTH: Final image dimensions:', HIGH_RES_WIDTH, 'x', HIGH_RES_HEIGHT);
          resolve(finalImageData);
        };

        // Set high-resolution canvas dimensions
        canvas.width = HIGH_RES_WIDTH;
        canvas.height = HIGH_RES_HEIGHT;

        // Clear and draw the original image at high resolution
        context.clearRect(0, 0, HIGH_RES_WIDTH, HIGH_RES_HEIGHT);
        context.drawImage(img, 0, 0, HIGH_RES_WIDTH, HIGH_RES_HEIGHT);
        console.log('🖼️ PHOTOBOOTH: Base image drawn to high-res canvas');

        // Apply frame to high-res image if present, then render text
        if (customFrame?.url && frameLoaded && customFrame.opacity > 0) {
          console.log('🖼️ PHOTOBOOTH: Adding high-res frame to final upload image...');
          console.log('🖼️ PHOTOBOOTH: High-res frame URL:', customFrame.url);
          console.log('🖼️ PHOTOBOOTH: High-res frame opacity:', customFrame.opacity);
          
          const frameImg = new Image();
          frameImg.crossOrigin = 'anonymous';
          
          frameImg.onload = () => {
            console.log('✅ PHOTOBOOTH: High-res frame loaded, applying to final image');
            console.log('🖼️ PHOTOBOOTH: High-res frame dimensions:', frameImg.width, 'x', frameImg.height);
            
            context.save();
            context.globalAlpha = customFrame.opacity / 100;
            context.drawImage(frameImg, 0, 0, HIGH_RES_WIDTH, HIGH_RES_HEIGHT);
            context.restore();
            
            console.log('🖼️ PHOTOBOOTH: High-res frame applied, now rendering text');
            renderTextElements();
          };
          
          frameImg.onerror = (error) => {
            console.error('❌ PHOTOBOOTH: Failed to load frame for high-res render:', error);
            console.error('❌ PHOTOBOOTH: High-res frame URL:', customFrame.url);
            console.log('📝 PHOTOBOOTH: Proceeding without frame, rendering text only');
            renderTextElements();
          };
          
          frameImg.src = customFrame.url;
        } else {
          // No frame, just render text
          console.log('📝 PHOTOBOOTH: No frame for final image, rendering text only');
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
        console.log('🎨 Rendering text to photo before upload...');
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
        console.log('🔄 Restarting camera after upload...');
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
    console.log('📥 Download function called', { photo: !!photo, isDownloading, textElementsCount: textElements.length });
    
    if (!photo || isDownloading) {
      console.log('❌ Download blocked:', { hasPhoto: !!photo, isDownloading });
      return;
    }

    setIsDownloading(true);
    console.log('🔄 Starting download process...');

    try {
      let finalPhoto = photo;
      
      // Render text to the photo before downloading
      if (textElements.length > 0 && canvasRef.current) {
        console.log('🎨 Rendering text to photo before download...');
        finalPhoto = await renderTextToCanvas(canvasRef.current, photo);
        console.log('✅ Text rendered successfully');
      }

      // Simple download approach
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
      const filename = `photobooth-${timestamp}.jpg`;
      
      console.log('💾 Creating download with filename:', filename);

      // Try the most compatible download method
      if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        // iOS specific handling
        console.log('📱 iOS detected, using iOS download method');
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
        console.log('💻 Standard browser detected, using direct download');
        const link = document.createElement('a');
        link.href = finalPhoto;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Download triggered successfully');
      }
      
      // Show success message
      setError('Photo download started! Check your downloads folder.');
      setTimeout(() => setError(null), 3000);
      
      console.log('✅ Download process completed');
    } catch (err) {
      console.error('❌ Download failed:', err);
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
        console.error('❌ Fallback failed too:', fallbackErr);
        setError('Could not download photo. Please try again.');
      }
      
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsDownloading(false);
      console.log('🏁 Download process finished');
    }
  }, [photo, textElements, renderTextToCanvas, isDownloading]);

  const retakePhoto = useCallback(() => {
    setPhoto(null);
    setTextElements([]);
    setSelectedTextId(null);
    setIsEditingText(false);
    setShowTextStylePanel(false);
    
    // Ensure camera restarts properly
    console.log('🔄 Restarting camera for retake...');
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
          console.log('Text clicked, setting selectedTextId to:', element.id);
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
      console.log('🔍 Fetching collage with normalized code:', normalizedCode);
      setShowError(false);
      fetchCollageByCode(normalizedCode);
    }
  }, [normalizedCode, fetchCollageByCode]);

  // Load frame settings when collage loads
  useEffect(() => {
    if (currentCollage?.settings?.photobooth) {
      const photoboothSettings = currentCollage.settings.photobooth;
      
      console.log('📸 Loading photobooth settings:', photoboothSettings);
      
      // Load custom frame if selected
      if (photoboothSettings.selectedFrameId && 
          photoboothSettings.selectedFrameId !== 'none' && 
          photoboothSettings.selectedFrameUrl) {
        
        console.log('🖼️ Loading custom frame:', photoboothSettings.selectedFrameUrl);
        
        setCustomFrame({
          id: photoboothSettings.selectedFrameId,
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

  // Set up ResizeObserver to track video dimensions
  useEffect(() => {
    if (!videoRef.current) return;

    const updateVideoDimensions = () => {
      if (videoRef.current) {
        const rect = videoRef.current.getBoundingClientRect();
        setVideoDimensions({
          width: rect.width,
          height: rect.height
        });
        console.log('📐 Video dimensions updated:', rect.width, 'x', rect.height);
      }
    };

    // Initial measurement
    updateVideoDimensions();

    // Set up ResizeObserver
    resizeObserverRef.current = new ResizeObserver(updateVideoDimensions);
    resizeObserverRef.current.observe(videoRef.current);

    // Also listen for window resize and orientation change
    window.addEventListener('resize', updateVideoDimensions);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateVideoDimensions, 100); // Delay for orientation change
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
      console.log('🔄 Setting up realtime subscription in photobooth for collage:', currentCollage.id);
      setupRealtimeSubscription(currentCollage.id);
    }
    
    return () => {
      cleanupRealtimeSubscription();
    };
  }, [currentCollage?.id, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  useEffect(() => {
    if (currentCollage && !photo && cameraState === 'idle' && !isInitializingRef.current) {
      console.log('🚀 Initializing camera...');
      
      // Try to start camera immediately without waiting for device selection
      const timer = setTimeout(() => {
        if (!selectedDevice) {
          console.log('📱 No device selected, starting with default camera...');
          startCamera(); // Call without device ID to use default
        } else {
          console.log('📱 Starting with selected device:', selectedDevice);
          startCamera(selectedDevice);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [photo, cameraState, startCamera, selectedDevice, currentCollage]);

  useEffect(() => {
    if (cameraState === 'error' && currentCollage) {
      console.log('🔄 Setting up auto-retry for camera error...');
      const retryTimer = setTimeout(() => {
        console.log('🔄 Auto-retrying camera initialization...');
        startCamera(selectedDevice);
      }, 2000); // Reduced retry delay
      
      return () => clearTimeout(retryTimer);
    }
  }, [cameraState, startCamera, selectedDevice, currentCollage]);

  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up...');
      cleanupCamera();
    };
  }, [cleanupCamera]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 Page visible, resuming camera...');
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
                      <span>PhotoSphere</span>
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

            {/* Full-Screen Camera/Photo Container */}
            <div className="w-full h-full flex items-center justify-center">
              {photo ? (
                <div ref={photoContainerRef} className="relative w-full max-w-[1080px] aspect-[9/16]">
                  <img 
                    src={photo} 
                    alt="Captured photo" 
                    className="w-full h-full object-cover"
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
                            className="size-popup absolute left-16 top-0 bg-black/95 backdrop-blur-md rounded-lg p-3 opacity-0 transition-opacity pointer-events-none flex flex-col items-center space-y-2"
                            style={{ zIndex: 10001 }}
                          >
                            <input
                              type="range"
                              min="16"
                              max="72"
                              step="4"
                              value={textElements.find(el => el.id === selectedTextId)?.size || 24}
                              onChange={(e) => {
                                updateTextElement(selectedTextId, { size: parseInt(e.target.value) });
                              }}
                              className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              style={{
                                accentColor: '#9333ea',
                                background: 'linear-gradient(to right, #9333ea 0%, #9333ea var(--value), #4b5563 var(--value), #4b5563 100%)',
                                '--value': `${
                                  ((textElements.find(el => el.id === selectedTextId)?.size || 24) - 16) / (72 - 16) * 100
                                }%` as any
                              }}
                            />
                            <span className="text-white text-sm">
                              {textElements.find(el => el.id === selectedTextId)?.size || 24}px
                            </span>
                          </div>
                        </div>
                        
                        {/* Text Style Presets - Modified for mobile */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              setShowTextStylePanel(!showTextStylePanel);
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              setShowTextStylePanel(true);
                              setTimeout(() => {
                                setShowTextStylePanel(false);
                              }, 5000);
                            }}
                            className="w-14 h-14 bg-black/70 backdrop-blur-sm rounded-full border-2 border-white/80 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                            style={{ zIndex: 9999 }}
                          >
                            <Settings className="w-7 h-7 text-white" />
                          </button>
                          
                          {showTextStylePanel && (
                            <div 
                              className="absolute left-16 top-0 bg-black/95 backdrop-blur-md rounded-lg p-3 transition-opacity"
                              style={{ zIndex: 10001 }}
                            >
                              <div className="space-y-2">
                                {textStylePresets.map((style) => (
                                  <button
                                    key={style.name}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateTextElement(selectedTextId, { style });
                                      setShowTextStylePanel(false);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-white bg-gray-800/80 hover:bg-gray-700/80 rounded transition-colors"
                                  >
                                    {style.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div ref={photoContainerRef} className="relative w-full max-w-[1080px] aspect-[9/16] bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    muted
                  />
                  {customFrame && frameLoaded && (
                    <FrameOverlay
                      frameUrl={customFrame.url}
                      opacity={customFrame.opacity / 100}
                      containerWidth={videoDimensions.width}
                      containerHeight={videoDimensions.height}
                    />
                  )}
                  {cameraState === 'starting' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                        <p className="text-white">Starting camera...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons - Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/80 to-transparent p-4">
              {photo ? (
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={retakePhoto}
                    className="w-16 h-16 bg-gray-600/80 backdrop-blur-sm hover:bg-gray-700/80 text-white rounded-full flex items-center justify-center border border-white/20 transition-all shadow-lg active:scale-95"
                    title="Retake Photo"
                  >
                    <RefreshCw className="w-8 h-8" />
                  </button>
                  <button
                    onClick={downloadPhoto}
                    disabled={isDownloading}
                    className={`w-16 h-16 bg-green-600/80 backdrop-blur-sm hover:bg-green-700/80 text-white rounded-full flex items-center justify-center border border-white/20 transition-all shadow-lg active:scale-95 ${
                      isDownloading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Download Photo"
                  >
                    <Download className="w-8 h-8" />
                  </button>
                  <button
                    onClick={uploadToCollage}
                    disabled={uploading}
                    className={`w-16 h-16 bg-purple-600/80 backdrop-blur-sm hover:bg-purple-700/80 text-white rounded-full flex items-center justify-center border border-white/20 transition-all shadow-lg active:scale-95 ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Upload to Collage"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-8 h-8" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <button
                    onClick={capturePhoto}
                    disabled={cameraState !== 'active'}
                    className={`w-20 h-20 bg-white/90 hover:bg-white text-black rounded-full flex items-center justify-center border-4 border-purple-500/80 transition-all shadow-lg active:scale-95 ${
                      cameraState !== 'active' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Take Photo"
                  >
                    <Camera className="w-10 h-10" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Desktop Layout */
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(`/collage/${currentCollage?.code || ''}`)}
                  className="text-gray-200 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <span className="text-purple-400">📸</span>
                    <span>PhotoSphere</span>
                  </h1>
                  <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                    <Camera className="w-5 h-5 text-purple-400" />
                    <span>Photobooth</span>
                  </h2>
                  <p className="text-gray-300">{currentCollage?.name}</p>
                </div>
              </div>

              {!photo && devices.length > 1 && (
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedDevice}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                    className="bg-gray-800 text-white rounded-lg px-3 py-2"
                  >
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={switchCamera}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className={`mb-4 p-3 rounded-lg ${
                error.includes('successfully') 
                  ? 'bg-green-900/30 border border-green-500/50 text-green-200'
                  : 'bg-red-900/30 border border-red-500/50 text-red-200'
              }`}>
                <p>{error}</p>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6 justify-center items-center">
              <div className="flex-1 flex justify-center items-center">
                <div ref={photoContainerRef} className="relative w-full max-w-[540px] max-h-[calc(100vh-200px)] aspect-[9/16] mx-auto bg-black rounded-lg overflow-hidden">
                  {photo ? (
                    <>
                      <img 
                        src={photo} 
                        alt="Captured photo" 
                        className="w-full h-full object-contain"
                      />
                      {renderTextElements()}
                    </>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                        muted
                      />
                      {customFrame && frameLoaded && (
                        <FrameOverlay
                          frameUrl={customFrame.url}
                          opacity={customFrame.opacity / 100}
                          containerWidth={videoDimensions.width}
                          containerHeight={videoDimensions.height}
                        />
                      )}
                      {cameraState === 'starting' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                            <p className="text-white">Starting camera...</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {photo && (
                <div className="w-full lg:w-80 bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Type className="w-5 h-5 text-purple-400" />
                    <span>Text Editor</span>
                  </h3>
                  <div className="space-y-4">
                    <button
                      onClick={addTextElement}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add Text</span>
                    </button>

                    {selectedTextId && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Text Size</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min="16"
                              max="72"
                              step="4"
                              value={textElements.find(el => el.id === selectedTextId)?.size || 24}
                              onChange={(e) => updateTextElement(selectedTextId, { size: parseInt(e.target.value) })}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              style={{ accentColor: '#9333ea' }}
                            />
                            <span className="text-gray-300">
                              {textElements.find(el => el.id === selectedTextId)?.size || 24}px
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Text Color</label>
                          <div className="grid grid-cols-5 gap-2">
                            {colorPresets.map((color) => (
                              <button
                                key={color}
                                onClick={() => updateTextElement(selectedTextId, { color })}
                                className="w-8 h-8 rounded-full border-2 border-gray-600 hover:border-white transition-colors"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Text Style</label>
                          <select
                            value={textElements.find(el => el.id === selectedTextId)?.style.name || textStylePresets[0].name}
                            onChange={(e) => {
                              const selectedStyle = textStylePresets.find(s => s.name === e.target.value);
                              if (selectedStyle) {
                                updateTextElement(selectedTextId, { style: selectedStyle });
                              }
                            }}
                            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                          >
                            {textStylePresets.map((style) => (
                              <option key={style.name} value={style.name}>
                                {style.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => deleteTextElement(selectedTextId)}
                          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <X className="w-5 h-5" />
                          <span>Delete Text</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-center space-x-4">
              {photo ? (
                <>
                  <button
                    onClick={retakePhoto}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Retake</span>
                  </button>
                  <button
                    onClick={downloadPhoto}
                    disabled={isDownloading}
                    className={`px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                      isDownloading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={uploadToCollage}
                    disabled={uploading}
                    className={`px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={capturePhoto}
                  disabled={cameraState !== 'active'}
                  className={`px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors flex items-center space-x-2 ${
                    cameraState !== 'active' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Camera className="w-6 h-6" />
                  <span>Take Photo</span>
                </button>
              )}
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {showVideoRecorder && (
        <MobileVideoRecorder
          collageId={currentCollage.id}
          onClose={() => setShowVideoRecorder(false)}
          recordingResolution={recordingResolution}
        />
      )}
    </>
  );
};

export default PhotoboothPage;
```

The main issues were:
1. Missing closing `</div>` tag in the Size Slider Popup section
2. Missing closing `}` bracket for the mobile layout section
3. Missing closing `}` bracket for the component

I've added the necessary closing brackets to properly close all the nested structures.
        
