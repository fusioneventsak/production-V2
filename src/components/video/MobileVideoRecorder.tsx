import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Video, Square, Download, X, Clock, Settings } from 'lucide-react';

type Resolution = '1080p' | '4k';

interface VideoRecorderProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  className?: string;
  onClose?: () => void;
  onResolutionChange?: (width: number, height: number) => void;
}

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
  const [supportedMimeType, setSupportedMimeType] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<'webm' | 'mp4'>('webm');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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
  
  // CRITICAL FIX: Don't change canvas size during recording to avoid pixel ratio issues
  // Just record at current canvas size to maintain particle quality
  useEffect(() => {
    console.log('🚫 DISABLED canvas resize during recording to prevent pixel ratio changes');
    console.log('📹 Recording will use current canvas size to maintain particle quality');
    // Commenting out the canvas resize that was causing particle issues
    // if (canvasRef.current && onResolutionChange) {
    //   const width = resolution === '4k' ? 3840 : 1920;
    //   const height = resolution === '4k' ? 2160 : 1080;
    //   onResolutionChange(width, height);
    // }
  }, [resolution, canvasRef, onResolutionChange]);

  // Detect supported video format
  useEffect(() => {
    const formats = [
      'video/webm;codecs=vp9',      // Best quality WebM
      'video/webm;codecs=vp8',      // Fallback WebM
      'video/webm',                 // Basic WebM
      'video/mp4;codecs=h264'       // MP4 format
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
      
      const canvas = canvasRef.current;
      
      console.log('🎥 Attempting TRUE screen capture like OBS...');
      
      let stream;
      
      // Try Screen Capture API first (like OBS)
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          console.log('📺 Using Screen Capture API (like OBS)');
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              mediaSource: 'screen',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 60 }
            },
            audio: false
          });
          
          console.log('✅ Screen capture started - please select the browser window');
        } catch (screenError) {
          console.log('❌ Screen capture failed, falling back to canvas capture');
          stream = canvas.captureStream(60);
        }
      } else {
        console.log('📱 Screen capture not available, using canvas capture');
        stream = canvas.captureStream(60);
      }
      
      streamRef.current = stream;
      
      // Configure MediaRecorder with high quality settings
      const options: MediaRecorderOptions = {
        mimeType: supportedMimeType
      };
      
      // Use very high bitrates for particle quality
      if (resolution === '4k') {
        options.videoBitsPerSecond = isMobile ? 40000000 : 60000000; // 40-60 Mbps
      } else {
        options.videoBitsPerSecond = isMobile ? 20000000 : 40000000; // 20-40 Mbps
      }
      
      console.log(`🚀 Recording with ultra-high bitrate: ${options.videoBitsPerSecond / 1000000}Mbps`);
      
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
        
        console.log('✅ Recording completed with screen capture approach');
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        stopRecording();
      };
      
      // Start recording with smaller chunks for better quality
      recorder.start(50); // 50ms chunks
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
  }, [canvasRef, supportedMimeType, isMobile, duration, resolution]);

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
    
    // Use the selected output format for the file extension
    const fileExtension = outputFormat === 'mp4' ? 'mp4' : 'webm';
    a.download = `photosphere-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${fileExtension}`;
    a.click();
  }, [videoBlob, videoUrl, outputFormat]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = duration - recordingTime;

  return (
    <div className={`relative ${className}`}>
      {error && (
        <div className="absolute -top-16 left-0 right-0 bg-red-500/80 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
          {error}
        </div>
      )}
      
      {isRecording && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Recording indicators */}
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">REC</span>
          </div>
          
          <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
            <span className="text-white text-sm font-mono">{formatTime(remainingTime)}</span>
          </div>
          
          {/* Logo watermark */}
          <div className="absolute bottom-4 right-4 flex items-center justify-center">
            <img 
              src="https://www.fusion-events.ca/wp-content/uploads/2025/06/Untitled-design-15.png" 
              alt="Fusion Events" 
              className="h-8 w-auto opacity-90 drop-shadow-lg"
            />
          </div>
        </div>
      )}
      
      {/* Settings Panel */}
      {showSettings && !isRecording && !isProcessing && (
        <div className="absolute -top-36 left-0 right-0 bg-black/70 backdrop-blur-md p-4 rounded-lg border border-white/20 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white text-sm font-medium">Video Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Duration Selection */}
            <div>
              <label className="text-white text-xs mb-1 block">Duration</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDuration(30)}
                  className={`px-3 py-1 rounded text-xs ${
                    duration === 30 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >30 seconds</button>
                <button
                  onClick={() => setDuration(60)}
                  className={`px-3 py-1 rounded text-xs ${
                    duration === 60 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >60 seconds</button>
              </div>
            </div>
            
            {/* Resolution Selection - Now just affects bitrate */}
            <div>
              <label className="text-white text-xs mb-1 block">Quality Level</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setResolution('1080p')}
                  className={`px-3 py-1 rounded text-xs ${
                    resolution === '1080p' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >Standard</button>
                <button
                  onClick={() => setResolution('4k')}
                  className={`px-3 py-1 rounded text-xs ${
                    resolution === '4k' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >High Quality</button>
              </div>
            </div>
            
            {/* Format Selection */}
            <div>
              <label className="text-white text-xs mb-1 block">Output Format</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setOutputFormat('webm')}
                  className={`px-3 py-1 rounded text-xs ${
                    outputFormat === 'webm' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >WebM</button>
                <button
                  onClick={() => setOutputFormat('mp4')}
                  className={`px-3 py-1 rounded text-xs ${
                    outputFormat === 'mp4' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >MP4</button>
              </div>
            </div>
            
            {/* Info about screen capture */}
            <div className="text-xs text-blue-400 bg-blue-900/20 p-2 rounded">
              🖥️ Will attempt true screen capture (like OBS) - select browser window when prompted
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        {!isRecording && !isProcessing && !videoUrl && (
          <>
            <div className="text-xs text-white/70 mr-2">Screen Capture • 60fps</div>
            <button
              onClick={startRecording}
              disabled={!supportedMimeType}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Video className="w-4 h-4" />
              <span>Record {duration}s Clip</span>
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="Recording Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </>
        )}
        
        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Square className="w-4 h-4" />
            <span>Recording {formatTime(recordingTime)}</span>
          </button>
        )}
        
        {isProcessing && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </div>
        )}
        
        {videoUrl && !isProcessing && (
          <>
            <button
              onClick={downloadVideo}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              title={`Download as ${outputFormat.toUpperCase()}`}
            >
              <Download className="w-4 h-4" />
              <span>Download {outputFormat.toUpperCase()}</span>
            </button>
            
            <button
              onClick={() => {
                URL.revokeObjectURL(videoUrl);
                setVideoUrl(null);
                setVideoBlob(null);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Record New</span>
            </button>
          </>
        )}
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileVideoRecorder;
