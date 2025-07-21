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
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('high');
  
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
      // For vertical video, swap dimensions
      return { width: baseHeight, height: Math.round(baseHeight * 16 / 9) };
    }
    
    return { width: baseWidth, height: baseHeight };
  }, [resolution, aspectRatio]);

  // Get quality-based bitrate optimized for Three.js content
  const getBitrate = useCallback(() => {
    const { width, height } = getDimensions();
    
    // Three.js content needs much higher bitrates due to complex 3D rendering
    // Base bitrates for different resolutions and qualities
    let baseBitrate: number;
    
    if (resolution === '4k') {
      switch (quality) {
        case 'ultra':
          baseBitrate = isMobile ? 80000000 : 120000000; // 80-120 Mbps for 4K Ultra
          break;
        case 'high':
          baseBitrate = isMobile ? 50000000 : 80000000;  // 50-80 Mbps for 4K High
          break;
        case 'standard':
          baseBitrate = isMobile ? 30000000 : 50000000;  // 30-50 Mbps for 4K Standard
          break;
        default:
          baseBitrate = 50000000;
      }
    } else { // 1080p
      switch (quality) {
        case 'ultra':
          baseBitrate = isMobile ? 30000000 : 50000000;  // 30-50 Mbps for 1080p Ultra
          break;
        case 'high':
          baseBitrate = isMobile ? 20000000 : 35000000;  // 20-35 Mbps for 1080p High
          break;
        case 'standard':
          baseBitrate = isMobile ? 12000000 : 20000000;  // 12-20 Mbps for 1080p Standard
          break;
        default:
          baseBitrate = 20000000;
      }
    }
    
    // For 9:16 aspect ratio, maintain similar quality
    if (aspectRatio === '9:16') {
      baseBitrate = Math.round(baseBitrate * 0.9); // Slightly reduce for vertical format
    }
    
    // Ensure we don't exceed browser limits
    const maxBitrate = isMobile ? 100000000 : 200000000; // 100/200 Mbps maximum
    const minBitrate = 10000000; // 10 Mbps minimum for Three.js
    
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
  
  // Update canvas resolution when settings change
  useEffect(() => {
    if (canvasRef.current && onResolutionChange) {
      const { width, height } = getDimensions();
      onResolutionChange(width, height);
    }
  }, [resolution, aspectRatio, canvasRef, onResolutionChange, getDimensions]);

  // Detect supported video format with better codec preferences
  useEffect(() => {
    const formats = [
      'video/webm;codecs=vp9,opus',    // Best quality WebM with VP9
      'video/webm;codecs=vp8,vorbis',  // Fallback WebM with VP8
      'video/webm;codecs=h264,aac',    // WebM container with H.264
      'video/mp4;codecs=h264,aac',     // MP4 with H.264
      'video/webm',                    // Basic WebM
      'video/mp4'                      // Basic MP4
    ];
    
    const supported = formats.find(format => MediaRecorder.isTypeSupported(format));
    
    if (supported) {
      console.log('Using video format:', supported);
      setSupportedMimeType(supported);
    } else {
      console.error('No supported video format found');
      setError('Your browser does not support video recording');
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

  const startRecording = useCallback(async () => {
    if (!canvasRef.current || !supportedMimeType) {
      setError('Canvas or video format not supported');
      return;
    }
    
    try {
      setError(null);
      setIsRecording(true);
      setRecordingTime(0);
      setVideoBlob(null);
      setVideoUrl(null);
      
      chunksRef.current = [];
      
      // Get the canvas stream with higher frame rate for Three.js smoothness
      const canvas = canvasRef.current;
      const frameRate = quality === 'ultra' ? 60 : quality === 'high' ? 60 : 30; // Higher framerates for Three.js
      const stream = canvas.captureStream(frameRate);
      streamRef.current = stream;
      
      const bitrate = getBitrate();
      
      // Configure MediaRecorder with optimized settings
      const options: MediaRecorderOptions = {
        mimeType: supportedMimeType,
        videoBitsPerSecond: bitrate
      };
      
      console.log(`Recording at ${resolution} ${aspectRatio} with:`, {
        dimensions: getDimensions(),
        bitrate: `${(bitrate / 1000000).toFixed(1)}Mbps`,
        frameRate: `${frameRate}fps`,
        quality,
        format: supportedMimeType
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
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        stopRecording();
      };
      
      // Start recording with very small timeslices for Three.js smoothness
      recorder.start(25);
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
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check browser permissions.');
      setIsRecording(false);
    }
  }, [canvasRef, supportedMimeType, getBitrate, duration, resolution, aspectRatio, quality, getDimensions]);

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
        console.error('Error stopping recorder:', err);
      }
      mediaRecorderRef.current = null;
    }
    
    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
  }, []);

  const downloadVideo = useCallback(() => {
    if (!videoBlob || !videoUrl) return;
    
    const a = document.createElement('a');
    a.href = videoUrl;
    
    const fileExtension = outputFormat === 'mp4' ? 'mp4' : 'webm';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const aspectSuffix = aspectRatio === '9:16' ? '_vertical' : '_landscape';
    
    a.download = `photosphere-${resolution}${aspectSuffix}-${timestamp}.${fileExtension}`;
    a.click();
  }, [videoBlob, videoUrl, outputFormat, resolution, aspectRatio]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = duration - recordingTime;
  const { width, height } = getDimensions();

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
      
      {/* Enhanced Settings Panel */}
      {showSettings && !isRecording && !isProcessing && (
        <div className="absolute -top-64 left-0 right-0 bg-black/80 backdrop-blur-md p-4 rounded-lg border border-white/20 mb-4 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-sm font-medium">Video Settings</h3>
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
            
            {/* Quality Selection */}
            <div>
              <label className="text-white text-xs mb-2 block">Quality</label>
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
          
          {/* Preview Info */}
          <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-600">
            <div className="text-xs text-gray-300">
              <div>Output: {width} × {height} ({aspectRatio})</div>
              <div>Bitrate: {(getBitrate() / 1000000).toFixed(1)} Mbps</div>
              <div>Frame Rate: {quality === 'ultra' ? '60' : quality === 'high' ? '60' : '30'} fps</div>
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
              title="Recording Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </>
        )}
        
        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg"
          >
            <Square className="w-4 h-4" />
            <span>Recording {formatTime(recordingTime)}</span>
          </button>
        )}
        
        {isProcessing && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg shadow-lg">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
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
              title={`Download ${width}×${height} video`}
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