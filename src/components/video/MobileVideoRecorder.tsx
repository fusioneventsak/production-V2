const createVideoFromFrames = useCallback(async (frames: string[]) => {
    try {
      console.log(`🎬 Creating video from ${frames.length} frames...`);
      
      // Create offscreen canvas for video creation
      const videoCanvas = document.createElement('canvas');
      const ctx = videoCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Load first frame to get dimensions
      const firstImage = new Image();
      await new Promise((resolve, reject) => {
        firstImage.onload = resolve;
        firstImage.onerror = reject;
        firstImage.src = frames[0];
      });
      
      videoCanvas.width = firstImage.width;
      videoCanvas.height = firstImage.height;
      
      console.log(`📐 Video size: ${videoCanvas.width}x${videoCanvas.height}`);
      
      // Start MediaRecorder on the canvas
      const stream = videoCanvas.captureStream(30); // Fixed 30fps for reliability
      const chunks: BlobPart[] = [];
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
        videoBitsPerSecond: 25000000 // 25 Mbps for good quality without hanging
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        setVideoBlob(blob);
        setVideoUrl(url);
        setIsProcessing(false);
        
        console.log('✅ Video created successfully!');
      };
      
      recorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        setError('Failed to create video from frames');
        setIsProcessing(false);
      };
      
      // Start recording
      recorder.start(1000); // 1 second chunks
      
      // Draw frames sequentially with proper timing
      let frameIndex = 0;
      const frameDuration = 1000 / fps; // ms per frame
      
      const drawFrame = async () => {
        if (frameIndex >= frames.length) {
          // Finished all frames
          setTimeout(() => {
            recorder.stop();
          }, 500); // Give a bit of extra time
          return;
        }
        
        // Load and draw current frame
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = frames[frameIndex];
        });
        
        ctx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
        ctx.drawImage(img, 0, 0);
        
        frameIndex++;
        
        // Schedule next frame
        setTimeout(drawFrame, frameDuration);
      };
      
      // Start drawing frames
      drawFrame();
      
      // Safety timeout to prevent infinite hanging
      const totalExpectedTime = (frames.length / fps) * 1000 + 5000; // Expected time + 5s buffer
      setTimeout(() => {
        if (recorder.state === 'recording') {
          console.warn('⚠️ Video creation timeout, forcing stop');
          recorder.stop();
        }
      }, totalExpectedTime);
      
    } catch (error) {
      console.error('❌ Error creating video from frames:', error);
      setError('Failed to process frames into video');
      setIsProcessing(false);
    }
  }, [fps]);import React, { useRef, useState, useCallback, useEffect } from 'react';
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
  const [fps, setFps] = useState<30 | 60>(30);
  const [quality, setQuality] = useState<'high' | 'ultra'>('high');
  
  const framesRef = useRef<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      stopRecording();
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const captureFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    try {
      // Capture frame as high-quality PNG (lossless)
      const frameData = canvas.toDataURL('image/png');
      return frameData;
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }, [canvasRef]);

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
      
      framesRef.current = [];
      
      console.log(`🎬 Starting frame-by-frame capture:`, {
        duration: `${duration}s`,
        fps: `${fps}fps`,
        quality: quality,
        totalFrames: duration * fps,
        approach: 'Lossless PNG frames → WebM video'
      });
      
      const frameInterval = 1000 / fps; // ms between frames
      
      // Capture frames at specified FPS
      captureIntervalRef.current = setInterval(() => {
        const frame = captureFrame();
        if (frame) {
          framesRef.current.push(frame);
          console.log(`📸 Captured frame ${framesRef.current.length}/${duration * fps}`);
        }
      }, frameInterval);
      
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
      console.error('Error starting frame capture:', err);
      setError('Failed to start recording');
      setIsRecording(false);
    }
  }, [canvasRef, duration, fps, quality, captureFrame]);

  const stopRecording = useCallback(async () => {
    // Stop capturing frames
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    
    if (framesRef.current.length === 0) {
      setError('No frames captured');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log(`🔄 Processing ${framesRef.current.length} frames into video...`);
      
      // Create video from frames using Canvas + MediaRecorder
      await createVideoFromFrames(framesRef.current);
      
    } catch (error) {
      console.error('Error processing frames:', error);
      setError('Failed to process frames into video');
      setIsProcessing(false);
    }
  }, []);

  const createVideoFromFrames = useCallback(async (frames: string[]) => {
    try {
      // Create a temporary canvas for video generation
      const videoCanvas = document.createElement('canvas');
      const ctx = videoCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Set canvas size from first frame
      const firstImage = new Image();
      firstImage.src = frames[0];
      
      await new Promise((resolve) => {
        firstImage.onload = resolve;
      });
      
      videoCanvas.width = firstImage.width;
      videoCanvas.height = firstImage.height;
      
      console.log(`📐 Video canvas: ${videoCanvas.width}x${videoCanvas.height}`);
      
      // Create stream from video canvas
      const stream = videoCanvas.captureStream(fps);
      
      // Setup MediaRecorder with high quality settings
      const mimeType = 'video/webm; codecs=vp9';
      const bitrate = quality === 'ultra' ? 100000000 : 50000000; // 50-100 Mbps
      
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
        videoBitsPerSecond: bitrate
      });
      
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        setVideoBlob(blob);
        setVideoUrl(url);
        setIsProcessing(false);
        
        console.log('✅ Video created from frames:', {
          size: `${(blob.size / 1024 / 1024).toFixed(1)}MB`,
          frames: frames.length,
          duration: `${duration}s`
        });
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Failed to create video from frames');
        setIsProcessing(false);
      };
      
      // Start recording
      recorder.start();
      
      // Play back frames at correct timing
      let frameIndex = 0;
      const frameInterval = 1000 / fps;
      
      const playFrame = async () => {
        if (frameIndex >= frames.length) {
          recorder.stop();
          return;
        }
        
        const img = new Image();
        img.src = frames[frameIndex];
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });
        
        // Draw frame to canvas
        ctx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
        ctx.drawImage(img, 0, 0);
        
        frameIndex++;
        
        // Schedule next frame
        setTimeout(playFrame, frameInterval);
      };
      
      // Start playback
      playFrame();
      
    } catch (error) {
      console.error('Error creating video from frames:', error);
      setError('Failed to create video');
      setIsProcessing(false);
    }
  }, [fps, quality, duration]);

  const downloadVideo = useCallback(() => {
    if (!videoBlob || !videoUrl) return;
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `collage-frames-${duration}s-${fps}fps-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    a.click();
  }, [videoBlob, videoUrl, duration, fps]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = duration - recordingTime;
  const estimatedFrames = duration * fps;
  const capturedFrames = framesRef.current.length;

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
            <span className="text-white text-sm font-medium">CAPTURING</span>
          </div>
          
          <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full">
            <span className="text-white text-sm font-mono">{formatTime(remainingTime)}</span>
          </div>
          
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full">
            <span className="text-white text-xs">
              {capturedFrames}/{estimatedFrames} frames
            </span>
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
      
      {/* Settings Panel */}
      {showSettings && !isRecording && !isProcessing && (
        <div className="absolute -top-48 left-0 right-0 bg-black/85 backdrop-blur-md p-4 rounded-lg border border-white/20 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white text-sm font-medium">Frame Capture Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Duration */}
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
            
            {/* FPS */}
            <div>
              <label className="text-white text-xs mb-1 block">Frame Rate</label>
              <div className="space-y-1">
                {[30, 60].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFps(f as 30 | 60)}
                    className={`w-full px-2 py-1 rounded text-xs ${
                      fps === f 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {f} fps
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quality */}
            <div>
              <label className="text-white text-xs mb-1 block">Quality</label>
              <div className="space-y-1">
                {[
                  { key: 'high', label: 'High' },
                  { key: 'ultra', label: 'Ultra' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setQuality(key as 'high' | 'ultra')}
                    className={`w-full px-2 py-1 rounded text-xs ${
                      quality === key 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-blue-900/20 rounded text-xs text-blue-400">
            📸 Will capture {estimatedFrames} lossless PNG frames
          </div>
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        {!isRecording && !isProcessing && !videoUrl && (
          <>
            <span className="text-xs text-white/70">
              {duration}s • {fps}fps • PNG frames
            </span>
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Capture</span>
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
            <span>Creating Video...</span>
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
                framesRef.current = [];
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
