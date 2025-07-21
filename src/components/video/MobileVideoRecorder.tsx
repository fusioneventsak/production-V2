import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Video, Square, Download, X, Settings } from 'lucide-react';

interface VideoRecorderProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  className?: string;
  onClose?: () => void;
  onResolutionChange?: (width: number, height: number) => void;
}

const MobileVideoRecorder: React.FC<VideoRecorderProps> = ({ 
  canvasRef, 
  className = '',
  onClose
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [duration, setDuration] = useState<15 | 30 | 60>(30);
  const [quality, setQuality] = useState<'ultra' | 'extreme' | 'insane'>('ultra');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      
      console.log('🎥 ULTRA HIGH QUALITY direct canvas recording');
      
      // Direct canvas capture with maximum possible quality
      const stream = canvas.captureStream(60);
      streamRef.current = stream;
      
      // Find best available codec
      const codecs = [
        'video/webm; codecs=vp9,opus',
        'video/webm; codecs=av01,opus', // AV1 if available
        'video/webm; codecs=vp8,vorbis',
        'video/mp4; codecs=h264,aac',
        'video/webm',
        'video/mp4'
      ];
      
      let bestCodec = 'video/webm';
      for (const codec of codecs) {
        if (MediaRecorder.isTypeSupported(codec)) {
          bestCodec = codec;
          console.log('✅ Using codec:', codec);
          break;
        }
      }
      
      // ABSOLUTELY INSANE bitrates for particle quality
      let bitrate;
      switch (quality) {
        case 'insane':
          bitrate = 1000000000; // 1000 Mbps (1 Gbps!) 
          break;
        case 'extreme':
          bitrate = 500000000;  // 500 Mbps
          break;
        case 'ultra':
        default:
          bitrate = 200000000;  // 200 Mbps
          break;
      }
      
      console.log(`🚀 Recording with INSANE quality:`, {
        bitrate: `${bitrate / 1000000}Mbps`,
        codec: bestCodec,
        fps: '60fps',
        approach: 'Direct canvas - maximum possible quality'
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: bestCodec,
        videoBitsPerSecond: bitrate
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: bestCodec });
        const url = URL.createObjectURL(blob);
        
        setVideoBlob(blob);
        setVideoUrl(url);
        setIsProcessing(false);
        streamRef.current = null;
        
        console.log('✅ Ultra quality recording completed:', {
          size: `${(blob.size / 1024 / 1024).toFixed(1)}MB`,
          quality: 'Maximum possible'
        });
      };
      
      recorder.onerror = (event) => {
        console.error('❌ Recording error:', event);
        setError('Recording failed - try reducing quality');
        stopRecording();
      };
      
      // Use tiny chunks for maximum quality
      recorder.start(50); // 50ms chunks
      mediaRecorderRef.current = recorder;
      
      // Timer
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
      console.error('❌ Recording error:', err);
      setError('Failed to start ultra quality recording');
      setIsRecording(false);
    }
  }, [canvasRef, duration, quality]);

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
    a.download = `collage-ultra-${quality}-${duration}s-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    a.click();
  }, [videoBlob, videoUrl, quality, duration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = duration - recordingTime;
  const getBitrate = () => {
    switch (quality) {
      case 'insane': return 1000;
      case 'extreme': return 500;
      case 'ultra': 
      default: return 200;
    }
  };
  
  const bitrate = getBitrate();
  const estimatedSize = Math.round((bitrate * duration) / 8);

  return (
    <div className={`relative ${className}`}>
      {error && (
        <div className="absolute -top-12 left-0 right-0 bg-red-500/90 text-white px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}
      
      {isRecording && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600/90 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">ULTRA REC</span>
          </div>
          
          <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full">
            <span className="text-white text-sm font-mono">{formatTime(remainingTime)}</span>
          </div>
          
          <div className="absolute bottom-4 right-4">
            <img 
              src="https://www.fusion-events.ca/wp-content/uploads/2025/06/Untitled-design-15.png" 
              alt="Logo" 
              className="h-6 w-auto opacity-80"
            />
          </div>
        </div>
      )}
      
      {/* Ultra Simple Settings */}
      {showSettings && !isRecording && !isProcessing && (
        <div className="absolute -top-32 left-0 right-0 bg-black/85 backdrop-blur-md p-4 rounded-lg border border-white/20">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white text-sm font-medium">Ultra Quality Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white text-xs mb-1 block">Duration</label>
              <div className="space-y-1">
                {[15, 30, 60].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d as 15 | 30 | 60)}
                    className={`w-full px-2 py-1 rounded text-xs ${
                      duration === d 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-white text-xs mb-1 block">Quality</label>
              <div className="space-y-1">
                <button
                  onClick={() => setQuality('ultra')}
                  className={`w-full px-2 py-1 rounded text-xs ${
                    quality === 'ultra' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Ultra (200Mbps)
                </button>
                <button
                  onClick={() => setQuality('extreme')}
                  className={`w-full px-2 py-1 rounded text-xs ${
                    quality === 'extreme' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Extreme (500Mbps)
                </button>
                <button
                  onClick={() => setQuality('insane')}
                  className={`w-full px-2 py-1 rounded text-xs ${
                    quality === 'insane' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  INSANE (1000Mbps)
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-red-900/20 rounded text-xs text-red-400">
            🔥 Est. file size: ~{estimatedSize}MB | INSANE quality available!
          </div>
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        {!isRecording && !isProcessing && !videoUrl && (
          <>
            <span className="text-xs text-white/70">
              {duration}s • {bitrate}Mbps • 60fps
            </span>
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Ultra Record</span>
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
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
            <span>{formatTime(recordingTime)}</span>
          </button>
        )}
        
        {isProcessing && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </div>
        )}
        
        {videoBlob && videoUrl && !isProcessing && (
          <>
            <span className="text-xs text-white/70">
              {(videoBlob.size / 1024 / 1024).toFixed(1)} MB
            </span>
            <button
              onClick={downloadVideo}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
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
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>New</span>
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