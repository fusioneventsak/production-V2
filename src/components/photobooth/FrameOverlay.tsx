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
      setFrameLoaded(false);
      setFrameError(false);
    }
  }, [frameUrl]);

  if (!frameUrl) {
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
      <img
        src={frameUrl}
        alt="Photo frame overlay"
        onLoad={() => {
          console.log('📸 Frame loaded successfully:', frameUrl);
          setFrameLoaded(true);
          setFrameError(false);
        }}
        onError={(e) => {
          console.error('❌ Frame failed to load:', frameUrl);
          setFrameError(true);
          setFrameLoaded(false);
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          display: 'block'
        }}
        draggable={false}
      />
      
      {/* Debug info - only in development */}
      {process.env.NODE_ENV === 'development' && frameLoaded && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 8px',
            fontSize: '10px',
            borderRadius: '4px',
            pointerEvents: 'none'
          }}
        >
          Frame: {videoDimensions.width}x{videoDimensions.height}
        </div>
      )}
    </div>
  );
};

export default FrameOverlay;