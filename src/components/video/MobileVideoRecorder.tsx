import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Video, Square, Download, X, Settings } from 'lucide-react';

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
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm border border-red-500/30">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="text-white text-sm font-medium">REC</span>
      </div>
      
      <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
        <span className="text-white text-sm font-mono">{formatTime(remainingTime)}</span>
      </div>
      
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
  const [resolution, setResolution] = useState<Resolution>('4k');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('ultra');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate dimensions based on resolution and aspect ratio
  const getDimensions = useCallback(() => {
    const baseWidth = resolution === '4k' ? 3840 : 1920;
    const baseHeight = resolution === '4k' ? 2160 : 1080;
    
    if (aspectRatio === '9:16') {
      return { width: baseHeight, height: Math.round(baseHeight * 16 / 9) };
    }
    
    return { width: baseWidth, height: baseHeight };
  }, [resolution, aspectRatio]);

  // Get ultra-high bitrates for perfect quality
  const getBitrate = useCallback(() => {
    const { width, height } = getDimensions();
    const pixelCount = width * height;
    
    // Use extremely high bitrates to match OBS quality
    let bitrate: number;
    
    if (resolution === '4k') {
      switch (quality) {
        case 'ultra':
          bitrate = 400000000; // 400 Mbps - OBS quality
          break;
        case 'high':
          bitrate = 250000000; // 250 Mbps
          break;
        case 'standard':
          bitrate = 150000000; // 150 Mbps
          break;
        default:
          bitrate = 400000000;
      }
    } else { // 1080p
      switch (quality) {
        case 'ultra':
          bitrate = 200000000; // 200 Mbps - OBS quality
          break;
        case 'high':
          bitrate = 120000000; // 120 Mbps
          break;
        case 'standard':
          bitrate = 80000000;  // 80 Mbps
          break;
        default:
          bitrate = 200000000;
      }
    }
    
    // Reduce slightly for mobile to prevent crashes
    return isMobile ? Math.round(bitrate * 0.7) : bitrate;
  }, [resolution, quality, aspectRatio, isMobile, getDimensions]);

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
    if (!canvasRef.current) {
      setError('Canvas not found');
      return;
    }
    
    try {
      setError(null);
      setIsRecording(true);
      setRecordingTime(0);
      setVideoBlob(null);
      setVideoUrl(null);
      
      chunksRef.current = [];
      
      const canvas = canvasRef.current;
      
      // Simple, direct canvas capture - just like OBS
      console.log('🎥 Starting direct canvas capture (OBS-style)...');
      
      // Capture at 60fps for smooth results
      const stream = canvas.captureStream(60);
      streamRef.current = stream;
      
      // Use the best codec available
      const preferredCodecs = [
        'video/webm; codecs=vp9,opus',
        'video/webm; codecs=vp8,vorbis', 
        'video/mp4; codecs=h264,aac',
        'video/webm',
        'video/mp4'
      ];
      
      const supportedCodec = preferredCodecs.find(codec => 
        MediaRecorder.isTypeSupported(codec)
      );
      
      if (!supportedCodec) {
        throw new Error('No supported video codec found');
      }
      
      const bitrate = getBitrate();
      
      console.log(`🚀 Recording with OBS-quality settings:`, {
        resolution: `${canvas.width}x${canvas.height}`,
        bitrate: `${(bitrate / 1000000).toFixed(0)} Mbps`,
        codec: supportedCodec,
        frameRate: '60fps'
      });
      
      // Configure recorder with ultra-high quality
      const recorder = new MediaRecorder(stream, {
        mimeType: supportedCodec,
        videoBitsPerSecond: bitrate
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: supportedCodec });
        const url = URL.createObjectURL(blob);
        
        setVideoBlob(blob);
        setVideoUrl(url);
        setIsProcessing(false);
        streamRef.current = null;
        
        console.log('✅ Recording completed:', {
          size: `${(blob.size / 1024 / 1024).toFixed(1)}MB`,
          type: blob.type
        });
      };
      
      recorder.onerror = (event) => {
        console.error('❌ Recording error:', event);
        setError('Recording failed. Try reducing quality or resolution.');
        stopRecording();
      };
      
      // Start recording
      recorder.start(100); // 100ms chunks for smooth recording
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
      console.error('❌ Error starting recording:', err);
      setError('Failed to start recording. Your browser may not support high-quality video recording.');
      setIsRecording(false);
    }
  }, [canvasRef, duration, getBitrate]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setIsProcessing(true);
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('❌ Error stopping recorder:', err);
      }
      mediaRecorderRef.current = null;
    }
    
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
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const aspectSuffix = aspectRatio === '9:16' ? '_vertical' : '_landscape';
    const qualitySuffix = quality === 'ultra' ? '_ultra' : quality === 'high' ? '_high' : '';
    
    a.download = `photosphere-${resolution}${aspectSuffix}${qualitySuffix}-${timestamp}.webm`;
    a.click();
  }, [videoBlob, videoUrl, resolution, aspectRatio, quality]);

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
      
      {/* Simple Settings Panel */}
      {showSettings && !isRecording && !isProcessing && (
        <div className="absolute -top-64 left-0 right-0 bg-black/85 backdrop-blur-md p-4 rounded-lg border border-white/20 mb-4 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-sm font-medium">OBS-Quality Recording</h3>
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
          
          {/* Quality Info */}
          <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-600">
            <div className="text-xs text-gray-300 space-y-1">
              <div>📐 Output: {width} × {height} ({aspectRatio})</div>
              <div>🎬 Bitrate: {(getBitrate() / 1000000).toFixed(0)} Mbps (OBS Quality)</div>
              <div>🎞️ Frame Rate: 60 fps</div>
              <div>💾 Est. Size: ~{estimatedFileSizeMB} MB</div>
              <div className="text-green-400 text-xs">🚀 Direct canvas capture - no processing</div>
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
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-lg"
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
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg animate-pulse"
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