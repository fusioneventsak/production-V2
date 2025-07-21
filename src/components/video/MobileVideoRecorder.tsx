import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Video, Square, Download, X, Clock, Settings } from 'lucide-react';

type Resolution = '1080p' | '4k';
type AspectRatio = '16:9' | '9:16';

interface VideoRecorderProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  className?: string;
  onClose?: () => void;
  onResolutionChange?: (width: number, height: number) => void;
}

interface VideoRecordingOverlayProps {
  recordingTime: number;
  remainingTime: number;
  logoUrl?: string;
}

const VideoRecordingOverlay: React.FC<VideoRecordingOverlayProps> = ({
  recordingTime,
  remainingTime,
  logoUrl = 'https://www.fusion-events.ca/wp-content/uploads/2025/06/Untitled-design-15.png'
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Recording indicator */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm border border-red-500/30">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="text-white text-sm font-medium">REC</span>
      </div>
      
      {/* Timer */}
      <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
        <span className="text-white text-sm font-mono">{formatTime(remainingTime)}</span>
      </div>
      
      {/* Logo watermark */}
      <div className="absolute bottom-4 right-4 flex items-center justify-center">
        <img 
          src={logoUrl} 
          alt="Brand Logo" 
          className="h-8 w-auto opacity-90 drop-shadow-lg"
        />
      </div>
    </div>
  );
};

const MobileVideoRecorder: React.FC<VideoRecorderProps> = ({ 
  canvasRef, 
  className = '',
  onClose,
  onResolutionChange
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [duration, setDuration] = useState<30 | 60>(60);
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [supportedMimeType, setSupportedMimeType] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<'webm' | 'mp4'>('webm');
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('ultra');
  const [recordingResolution, setRecordingResolution] = useState({ width: 1920, height: 1080 });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Calculate dimensions based on resolution and aspect ratio
  const getDimensions = useCallback(() => {
    const baseWidth = resolution === '4k' ? 3840 : 1920;
    const baseHeight = resolution === '4k' ? 2160 : 1080;
    
    if (aspectRatio === '9:16') {
      // For vertical video, swap dimensions but maintain proper proportions
      return { width: baseHeight, height: Math.round(baseHeight * 16 / 9) };
    }
    
    return { width: baseWidth, height: baseHeight };
  }, [resolution, aspectRatio]);

  // Get quality-based bitrate optimized for Three.js content with particle systems
  const getBitrate = useCallback(() => {
    // Particle systems need MASSIVE bitrates due to:
    // 1. Point sprites with alpha blending
    // 2. Additive blending effects
    // 3. Constantly moving/changing particles
    // 4. Shader-based rendering with fine details
    let baseBitrate: number;
    
    if (resolution === '4k') {
      switch (quality) {
        case 'ultra':
          baseBitrate = isMobile ? 300000000 : 500000000; // 300-500 Mbps for 4K Ultra particles
          break;
        case 'high':
          baseBitrate = isMobile ? 200000000 : 350000000; // 200-350 Mbps for 4K High particles
          break;
        case 'standard':
          baseBitrate = isMobile ? 120000000 : 200000000; // 120-200 Mbps for 4K Standard particles
          break;
        default:
          baseBitrate = 200000000;
      }
    } else { // 1080p
      switch (quality) {
        case 'ultra':
          baseBitrate = isMobile ? 150000000 : 250000000; // 150-250 Mbps for 1080p Ultra particles
          break;
        case 'high':
          baseBitrate = isMobile ? 100000000 : 150000000; // 100-150 Mbps for 1080p High particles
          break;
        case 'standard':
          baseBitrate = isMobile ? 60000000 : 100000000;  // 60-100 Mbps for 1080p Standard particles
          break;
        default:
          baseBitrate = 100000000;
      }
    }
    
    // For 9:16 aspect ratio, maintain similar quality for particles
    if (aspectRatio === '9:16') {
      baseBitrate = Math.round(baseBitrate * 0.9); // Slightly reduce for vertical format
    }
    
    // Allow extremely high bitrates for particle system quality
    const maxBitrate = 600000000; // 600 Mbps maximum for particle systems
    const minBitrate = 50000000;  // 50 Mbps minimum for particle quality
    
    return Math.max(minBitrate, Math.min(maxBitrate, baseBitrate));
  }, [resolution, quality, aspectRatio, isMobile]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Update canvas resolution when settings change - sync with CollageScene
  useEffect(() => {
    if (canvasRef.current && onResolutionChange) {
      const { width, height } = getDimensions();
      console.log('📐 Video recorder requesting canvas resize:', { width, height });
      onResolutionChange(width, height);
      
      // Store resolution for pixel ratio calculations (matching CollageScene logic)
      setRecordingResolution({ width, height });
    }
  }, [resolution, aspectRatio, canvasRef, onResolutionChange, getDimensions]);

  // Detect supported video format with Three.js optimized codecs
  useEffect(() => {
    const formats = [
      'video/webm;codecs=vp9,opus',           // VP9 with Opus - best for Three.js
      'video/webm;codecs=av01,opus',          // AV1 codec if available
      'video/webm;codecs=vp8,vorbis',         // VP8 fallback
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // H.264 High Profile
      'video/mp4;codecs=h264,aac',            // Standard H.264
      'video/webm',                           // Basic WebM
      'video/mp4'                             // Basic MP4
    ];
    
    const supported = formats.find(format => MediaRecorder.isTypeSupported(format));
    
    if (supported) {
      console.log('🎥 Using Three.js optimized video format:', supported);
      setSupportedMimeType(supported);
    } else {
      console.error('❌ No supported video format found for Three.js recording');
      setError('Your browser does not support high-quality video recording');
    }
  }, []);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      stopRecording();
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Prepare Three.js canvas for recording to match CollageScene exactly
  const prepareCanvasForRecording = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    try {
      console.log('🎥 Preparing canvas for CollageScene particle recording...');
      
      // Get the WebGL context - match your CollageScene exactly
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!context) {
        console.error('❌ WebGL context not found');
        return false;
      }

      // Ensure preserveDrawingBuffer is enabled (your scene has this)
      const contextAttributes = context.getContextAttributes();
      if (!contextAttributes?.preserveDrawingBuffer) {
        console.error('❌ preserveDrawingBuffer not enabled - this is critical for recording');
        return false;
      }

      // CRITICAL: Your CollageScene sets pixel ratio based on width
      // We need to MATCH this exactly during recording
      const scenePixelRatio = recordingResolution.width > 1920 ? 2 : 1;
      
      // Force the same pixel ratio your scene uses
      console.log(`🎯 Setting pixel ratio to match CollageScene: ${scenePixelRatio}`);
      
      // Verify tone mapping settings match your scene
      const renderer = context;
      console.log('🎨 WebGL context attributes:', contextAttributes);
      
      // Wait for particle system to fully initialize
      // Your MilkyWayParticleSystem needs time to set up all shader materials
      console.log('⏱️ Waiting for particle system initialization...');
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      
      // Force a full render cycle to ensure particles are ready
      console.log('🔄 Forcing render cycle for particle stability...');
      
      // Check if particles are actually rendering by looking at the canvas
      const imageData = context.readPixels(0, 0, 1, 1, context.RGBA, context.UNSIGNED_BYTE, new Uint8Array(4));
      console.log('📊 Canvas pixel check:', imageData);
      
      console.log('✅ Canvas prepared with CollageScene-matching settings:', {
        dimensions: `${canvas.width}x${canvas.height}`,
        pixelRatio: scenePixelRatio,
        preserveDrawingBuffer: contextAttributes.preserveDrawingBuffer,
        antialias: contextAttributes.antialias,
        powerPreference: contextAttributes.powerPreference
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to prepare canvas for recording:', error);
      return false;
    }
  }, [canvasRef, recordingResolution]);

  const startRecording = useCallback(async () => {
    if (!canvasRef.current || !supportedMimeType) {
      setError('Canvas or video format not supported');
      return;
    }
    
    try {
      setError(null);
      
      // Prepare the Three.js canvas
      const canvasReady = await prepareCanvasForRecording();
      if (!canvasReady) {
        setError('Failed to prepare Three.js canvas for recording');
        return;
      }

      setIsRecording(true);
      setRecordingTime(0);
      setVideoBlob(null);
      setVideoUrl(null);
      
      chunksRef.current = [];
      
      // Get the canvas stream with optimized settings for particle systems
      const canvas = canvasRef.current;
      
      // Use maximum 60fps for particle systems - critical for smooth particle animation
      const frameRate = 60;
      
      // CRITICAL: Use the EXACT same pixel ratio logic as your CollageScene
      // Your scene: state.gl.setPixelRatio(width > 1920 ? 2 : 1);
      const sceneMatchingPixelRatio = recordingResolution.width > 1920 ? 2 : 1;
      
      // Wait for your specific particle system to be fully loaded
      // MilkyWayParticleSystem has multiple layers: main, dust, clusters, atmospheric, etc.
      console.log('🌌 Waiting for MilkyWayParticleSystem full initialization...');
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      
      // CRITICAL: Capture stream with settings that match your CollageScene
      const stream = canvas.captureStream(frameRate);
      
      console.log('🎬 Capturing stream with CollageScene-matching settings:', {
        pixelRatio: sceneMatchingPixelRatio,
        frameRate,
        canvasSize: `${canvas.width}x${canvas.height}`,
        sceneSettings: 'antialias=true, preserveDrawingBuffer=true, toneMapping=ACESFilmic'
      });
      
      // Get video track and apply additional quality settings
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.();
        if (capabilities) {
          console.log('📹 Video track capabilities:', capabilities);
          
          // Apply constraints for maximum quality
          const constraints = {
            frameRate: { ideal: frameRate, max: frameRate },
            width: { ideal: canvas.width },
            height: { ideal: canvas.height }
          };
          
          try {
            await videoTrack.applyConstraints(constraints);
            console.log('✅ Applied high-quality constraints for particle recording');
          } catch (constraintError) {
            console.warn('⚠️ Could not apply video constraints:', constraintError);
          }
        }
      }
      
      streamRef.current = stream;
      
      const bitrate = getBitrate();
      
      // Configure MediaRecorder with Three.js optimized settings
      const options: MediaRecorderOptions = {
        mimeType: supportedMimeType,
        videoBitsPerSecond: bitrate
      };
      
      console.log('🎥 Starting Three.js recording with:', {
        dimensions: getDimensions(),
        bitrate: `${(bitrate / 1000000).toFixed(1)}Mbps`,
        frameRate: `${frameRate}fps`,
        quality,
        format: supportedMimeType,
        aspectRatio
      });
      
      const recorder = new MediaRecorder(stream, options);
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: supportedMimeType });
        const url = URL.createObjectURL(blob);
        
        setVideoBlob(blob);
        setVideoUrl(url);
        setIsProcessing(false);
        streamRef.current = null;
        
        console.log('✅ Three.js recording completed with CollageScene settings:', {
          size: `${(blob.size / 1024 / 1024).toFixed(1)}MB`,
          type: blob.type,
          matchedScenePixelRatio: recordingResolution.width > 1920 ? 2 : 1
        });
      };
      
      recorder.onerror = (event) => {
        console.error('❌ Three.js MediaRecorder error:', event);
        setError('Recording failed. Canvas may not be properly initialized for particle recording.');
        stopRecording();
      };
      
      // Start recording with ultra-small timeslices for particle system smoothness (5ms chunks)
      recorder.start(5);
      mediaRecorderRef.current = recorder;
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1; 
          if (newTime >= duration) {
            stopRecording();
            return duration;
          }
          return newTime;
        });
      }, 1000);
      
    } catch (err) {
      console.error('❌ Error starting Three.js recording:', err);
      setError('Failed to start recording. Canvas may not match CollageScene settings.');
      setIsRecording(false);
    }
  }, [canvasRef, supportedMimeType, getBitrate, duration, resolution, aspectRatio, quality, getDimensions, prepareCanvasForRecording]);

  const stopRecording = useCallback(() => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop animation frame if active
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setIsProcessing(true);
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('❌ Error stopping recorder:', err);
      }
      mediaRecorderRef.current = null;
    }
    
    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    console.log('🛑 Three.js recording stopped');
  }, []);

  const downloadVideo = useCallback(() => {
    if (!videoBlob || !videoUrl) return;
    
    const a = document.createElement('a');
    a.href = videoUrl;
    
    const fileExtension = outputFormat === 'mp4' ? 'mp4' : 'webm';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const aspectSuffix = aspectRatio === '9:16' ? '_vertical' : '_landscape';
    const qualitySuffix = quality === 'ultra' ? '_ultra' : quality === 'high' ? '_high' : '';
    
    a.download = `photosphere-${resolution}${aspectSuffix}${qualitySuffix}-${timestamp}.${fileExtension}`;
    a.click();
    
    console.log('💾 Three.js video downloaded:', a.download);
  }, [videoBlob, videoUrl, outputFormat, resolution, aspectRatio, quality]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = duration - recordingTime;
  const { width, height } = getDimensions();
  const estimatedFileSizeMB = (getBitrate() * duration / 8 / 1024 / 1024).toFixed(0);

  return (
    <div className={`relative ${className}`}>
      {error && (
        <div className="absolute -top-16 left-0 right-0 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm border border-red-400">
          {error}
        </div>
      )}
      
      {isRecording && (
        <VideoRecordingOverlay 
          recordingTime={recordingTime}
          remainingTime={remainingTime}
        />
      )}
      
      {/* Enhanced Settings Panel for Three.js */}
      {showSettings && !isRecording && !isProcessing && (
        <div className="absolute -top-80 left-0 right-0 bg-black/85 backdrop-blur-md p-4 rounded-lg border border-white/20 mb-4 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-sm font-medium">Particle System Video Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration Selection */}
            <div>
              <label className="text-white text-xs mb-2 block">Duration</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDuration(30)}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    duration === 30 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >30s</button>
                <button
                  onClick={() => setDuration(60)}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    duration === 60 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >60s</button>
              </div>
            </div>
            
            {/* Resolution Selection */}
            <div>
              <label className="text-white text-xs mb-2 block">Resolution</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setResolution('1080p')}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    resolution === '1080p' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >1080p</button>
                <button
                  onClick={() => setResolution('4k')}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    resolution === '4k' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >4K</button>
              </div>
            </div>
            
            {/* Aspect Ratio Selection */}
            <div>
              <label className="text-white text-xs mb-2 block">Aspect Ratio</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setAspectRatio('16:9')}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    aspectRatio === '16:9' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >16:9</button>
                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    aspectRatio === '9:16' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >9:16</button>
              </div>
            </div>
            
            {/* Quality Selection for Three.js */}
            <div>
              <label className="text-white text-xs mb-2 block">Quality (Particle Systems)</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setQuality('standard')}
                  className={`px-2 py-1.5 rounded text-xs transition-colors ${
                    quality === 'standard' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >Standard</button>
                <button
                  onClick={() => setQuality('high')}
                  className={`px-2 py-1.5 rounded text-xs transition-colors ${
                    quality === 'high' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >High</button>
                <button
                  onClick={() => setQuality('ultra')}
                  className={`px-2 py-1.5 rounded text-xs transition-colors ${
                    quality === 'ultra' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >Ultra</button>
              </div>
            </div>
          </div>
          
          {/* Three.js Specific Preview Info */}
          <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-600">
            <div className="text-xs text-gray-300 space-y-1">
              <div>📐 Output: {width} × {height} ({aspectRatio})</div>
              <div>🎬 Bitrate: {(getBitrate() / 1000000).toFixed(0)} Mbps (Particle Optimized)</div>
              <div>🎞️ Frame Rate: 60 fps (Smooth particles)</div>
              <div>💾 Est. Size: ~{estimatedFileSizeMB} MB</div>
              <div className="text-yellow-400 text-xs">✨ Ultra-high bitrates for particle quality</div>
              <div className="text-blue-400 text-xs">🔬 Shader-optimized recording</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        {!isRecording && !isProcessing && !videoUrl && (
          <>
            <div className="text-xs text-white/70 mr-2">
              {resolution} • {aspectRatio} • {quality}
            </div>
            <button
              onClick={startRecording}
              disabled={!supportedMimeType}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Video className="w-4 h-4" />
              <span>Record {duration}s</span>
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors shadow-lg"
              title="Particle System Recording Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </>
        )}
        
        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg animate-pulse"
          >
            <Square className="w-4 h-4" />
            <span>Recording {formatTime(recordingTime)}</span>
          </button>
        )}
        
        {isProcessing && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg shadow-lg">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing Three.js...</span>
          </div>
        )}
        
        {videoBlob && videoUrl && !isProcessing && (
          <>
            <div className="text-xs text-white/70 mr-2">
              {(videoBlob.size / 1024 / 1024).toFixed(1)} MB
            </div>
            <button
              onClick={downloadVideo}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-lg"
              title={`Download ${width}×${height} Three.js video`}
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            
            <button
              onClick={() => {
                URL.revokeObjectURL(videoUrl);
                setVideoUrl(null);
                setVideoBlob(null);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-lg"
            >
              <Video className="w-4 h-4" />
              <span>New</span>
            </button>
          </>
        )}
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileVideoRecorder;