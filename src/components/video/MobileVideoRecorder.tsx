import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Video, Square, Download, X } from 'lucide-react';

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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      
      console.log('🎥 SIMPLEST possible canvas recording - no modifications');
      
      // ABSOLUTE SIMPLEST approach - just capture the canvas
      const stream = canvas.captureStream(60);
      streamRef.current = stream;
      
      // Find the best codec with minimal settings
      let mimeType = 'video/webm';
      const codecs = [
        'video/webm; codecs=vp9',
        'video/webm; codecs=vp8', 
        'video/webm',
        'video/mp4'
      ];
      
      for (const codec of codecs) {
        if (MediaRecorder.isTypeSupported(codec)) {
          mimeType = codec;
          break;
        }
      }
      
      console.log('Using codec:', mimeType);
      
      // MAXIMUM quality settings
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 100000000 // 100 Mbps - extreme quality
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        setVideoBlob(blob);
        setVideoUrl(url);
        setIsProcessing(false);
        streamRef.current = null;
        
        console.log('✅ Simple recording done:', (blob.size / 1024 / 1024).toFixed(1), 'MB');
      };
      
      recorder.onerror = (event) => {
        console.error('Recording error:', event);
        setError('Recording failed');
        stopRecording();
      };
      
      // Start with minimal chunk size for best quality
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      
      // 60 second timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1; 
          if (newTime >= 60) {
            stopRecording();
            return 60;
          }
          return newTime;
        });
      }, 1000);
      
    } catch (err) {
      console.error('Recording error:', err);
      setError('Recording failed');
      setIsRecording(false);
    }
  }, [canvasRef]);

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
        console.error('Error stopping recorder:', err);
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
    a.download = `collage-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    a.click();
  }, [videoBlob, videoUrl]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = 60 - recordingTime;

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
            <span className="text-white text-sm font-medium">REC</span>
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
      
      <div className="flex items-center space-x-2">
        {!isRecording && !isProcessing && !videoUrl && (
          <>
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Record 60s</span>
            </button>
          </>
        )}
        
        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Square className="w-4 h-4" />
            <span>{formatTime(recordingTime)}</span>
          </button>
        )}
        
        {isProcessing && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg">
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