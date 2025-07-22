import React, { useState, useEffect } from 'react';

interface FrameOverlayProps {
  frameUrl: string | null;
  frameOpacity: number;
  videoDimensions: { width: number; height: number };
  className?: string;
}

const FrameOverlay: React.FC<FrameOverlayProps> = ({ 
  frameUrl, 
  frameOpacity, 
  videoDimensions,
  className = ''
}) => {
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [frameError, setFrameError] = useState(false);

  // Reset loading state when frame URL changes
  useEffect(() => {
    if (frameUrl) {
      console.log('🖼️ FrameOverlay: Frame URL changed to:', frameUrl);
      setFrameLoaded(false);
      setFrameError(false);
    } else {
      console.log('🖼️ FrameOverlay: Frame URL cleared');
    }
  }, [frameUrl]);

  // Log opacity changes
  useEffect(() => {
    console.log('🎨 FrameOverlay: Opacity changed to:', frameOpacity);
  }, [frameOpacity]);

  if (!frameUrl) {
    console.log('🖼️ FrameOverlay: No frame URL provided, not rendering');
    return null;
  }

  return (
    <div 
      className={`frame-overlay ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        opacity: frameLoaded && !frameError ? frameOpacity / 100 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    >
      {/* Visual fallback for frame loading errors */}
      {frameError && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            bottom: '10px',
            border: '4px dashed #ff0000',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff0000',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: 20
          }}
        >
          FRAME LOAD ERROR
        </div>
      )}
      
      {/* Loading indicator */}
      {!frameLoaded && !frameError && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            bottom: '10px',
            border: '4px dashed #ffaa00',
            backgroundColor: 'rgba(255, 170, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffaa00',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: 20
          }}
        >
          LOADING FRAME...
        </div>
      )}
      
      <img
        src={frameUrl}
        alt="Photo frame overlay"
        onLoad={() => {
          console.log('✅ FrameOverlay: Frame image loaded successfully');
          console.log('🖼️ FrameOverlay: Frame URL:', frameUrl);
          console.log('🎨 FrameOverlay: Frame opacity will be:', frameOpacity / 100);
          setFrameLoaded(true);
          setFrameError(false);
        }}
        onError={(e) => {
          console.error('❌ FrameOverlay: Frame image failed to load');
          console.error('❌ FrameOverlay: Failed URL:', frameUrl);
          console.error('❌ FrameOverlay: Error details:', e);
          setFrameError(true);
          setFrameLoaded(false);
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          objectPosition: 'center',
          display: 'block'
        }}
        draggable={false}
      />

    </div>
  );
};

export default FrameOverlay;