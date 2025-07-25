```tsx
import React, { useState, useEffect, useRef } from 'react';

// Futuristic Kiosk Component with Hyper-Realistic Design and Interaction Indicator
const FuturisticKioskShowcase: React.FC = React.memo(() => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [showIndicator, setShowIndicator] = useState(true); // State for indicator visibility
  const kioskRef = useRef<HTMLDivElement>(null);

  // Loading timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowIndicator(false); // Hide indicator after initial load
    }, 4000); // Show indicator for 4s after loading
    return () => clearTimeout(timer);
  }, []);

  // Clock update
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Tilt effect on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!kioskRef.current) return;
    const rect = kioskRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 15, y: y * 15 });
  };

  // Show indicator on hover
  const handleMouseEnter = () => {
    setShowIndicator(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setShowIndicator(false);
  };

  // Audio feedback for interactions
  const playSound = () => {
    const audio = new Audio('/sounds/futuristic-click.mp3');
    audio.play().catch((err) => console.log('Audio playback failed:', err));
  };

  return (
    <div
      className="relative w-full max-w-5xl mx-auto perspective-1200 px-4 sm:px-6"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={kioskRef}
    >
      {/* Main Kiosk Body with 3D Transform */}
      <div
        className="relative bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-black/95 rounded-3xl p-8 shadow-[0_15px_60px_rgba(0,0,0,0.8)] transform-gpu transition-transform duration-200"
        style={{
          transform: `rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)`,
        }}
      >
        {/* Ambient Holographic Glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/25 via-blue-600/25 to-cyan-600/25 blur-2xl opacity-60 animate-pulse-slow"></div>
        {/* Reflective Glass Surface */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/15 via-transparent to-black/25 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/glass.png')] opacity-10"></div>

        {/* Main Screen Container */}
        <div className="relative bg-gradient-to-b from-gray-950 to-black rounded-2xl p-6 shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)]">
          {/* Screen Bezel with Neon Edge */}
          <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-black rounded-xl p-4 shadow-[0_0_25px_rgba(59,130,246,0.6)] group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-purple-600/40 rounded-xl blur-md transition-all duration-300 group-hover:blur-lg"></div>

            {/* Screen Frame with Holographic Effect */}
            <div className="relative bg-black rounded-lg p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] overflow-hidden" style={{ aspectRatio: '16/10', minHeight: '450px' }}>
              {/* Dynamic Screen Glare */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none rounded-lg transition-all duration-300"
                style={{
                  transform: `translate(${tilt.x * 4}px, ${tilt.y * 4}px)`,
                }}
              ></div>

              {/* Interaction Indicator */}
              <div
                className={`absolute top-4 left-4 flex items-center space-x-2 transition-opacity duration-300 ${
                  showIndicator && !isLoading ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="relative w-8 h-8">
                  <svg
                    className="w-full h-full text-purple-400 animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m-12 5h12m0 0l-4 4m4-4l-4-4"
                    ></path>
                  </svg>
                  <div className="absolute inset-0 bg-purple-600/30 rounded-full blur-sm animate-pulse-slow"></div>
                </div>
                <div className="bg-black/80 backdrop-blur-md rounded-lg px-3 py-1 border border-purple-600/50">
                  <span className="text-purple-400 text-xs font-medium">Drag to Explore</span>
                </div>
              </div>

              {/* Loading State with Holographic Animation */}
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950 to-black flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-28 h-28 mx-auto mb-6 relative">
                      <div className="absolute inset-0 rounded-full border-4 border-purple-600/50 animate-pulse"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 bg-purple-600/25 rounded-full animate-ping"></div>
                      <div className="absolute inset-2 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full animate-pulse-slow"></div>
                    </div>
                    <p className="text-purple-400 text-xl font-semibold">PhotoSphere</p>
                    <p className="text-gray-400 text-sm mt-2">Initializing Holographic Interface...</p>
                  </div>
                </div>
              )}

              {/* Main Content - Iframe with Holographic Integration */}
              {!isLoading && (
                <iframe
                  src="https://selfieholosphere.com/collage/BCBJ"
                  className="w-full h-full border-0 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-transform duration-300 group-hover:scale-[1.03]"
                  title="PhotoSphere BCBJ Collection"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  onClick={playSound}
                />
              )}
            </div>

            {/* Status Indicators */}
            <div className="flex justify-between items-center mt-4 px-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                  <span className="text-green-400 text-xs font-medium">LIVE</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                  <span className="text-blue-400 text-xs font-medium">CONNECTED</span>
                </div>
              </div>
              <div className="text-gray-400 text-xs font-mono bg-black/50 rounded px-2 py-1">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Holographic Touch Controls */}
          <div className="flex justify-center mt-6 space-x-5">
            {[...Array(3)].map((_, i) => (
              <button
                key={i}
                className="relative bg-gradient-to-r from-purple-600/90 to-blue-600/90 rounded-full p-3 shadow-[0_0_20px_rgba(147,51,234,0.6)] hover:bg-gradient-to-r hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-110"
                onClick={playSound}
              >
                <div className="w-7 h-7 bg-white/90 rounded-full animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
              </button>
            ))}
          </div>
        </div>

        {/* Floating Information Panel */}
        <div className="relative mt-6 bg-gradient-to-r from-gray-900/60 to-black/60 backdrop-blur-md rounded-xl p-5 border border-purple-600/40 shadow-[0_0_20px_rgba(147,51,234,0.4)] transform-gpu transition-all duration-300 hover:-translate-y-1.5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-purple-400 text-2xl font-bold">47</div>
              <div className="text-gray-400 text-xs">Photos Uploaded</div>
            </div>
            <div>
              <div className="text-blue-400 text-2xl font-bold">BCBJ</div>
              <div className="text-gray-400 text-xs">Collection Code</div>
            </div>
            <div>
              <div className="text-green-400 text-2xl font-bold">Real-time</div>
              <div className="text-gray-400 text-xs">Live Updates</div>
            </div>
          </div>
        </div>

        {/* Animated Ventilation Slots */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-center space-x-1.5">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-6 bg-gradient-to-b from-gray-700 to-gray-900 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] animate-ventilation"
              style={{ animationDelay: `${i * 0.12}s` }}
            ></div>
          ))}
        </div>

        {/* Holographic Power Button */}
        <div className="absolute bottom-4 right-4 group">
          <button
            className="relative w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] transition-all duration-300 transform hover:scale-110"
            onClick={playSound}
          >
            <div className="w-5 h-5 border-2 border-white/90 rounded-full relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0.5 h-2.5 bg-white/90 rounded-full"></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/25 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
          </button>
        </div>

        {/* Floating Brand Label */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-black/80 backdrop-blur-md rounded-lg px-3 py-1 border border-purple-600/50 shadow-[0_0_15px_rgba(147,51,234,0.4)]">
            <span className="text-purple-400 text-xs font-bold">PhotoSphere</span>
            <span className="text-gray-400 text-xs ml-2">Holographic Display</span>
          </div>
        </div>

        {/* Status LEDs with Dynamic Pulse */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200 shadow-[0_0_12px_rgba(59,130,246,0.6)]"></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-400 shadow-[0_0_12px_rgba(147,51,234,0.6)]"></div>
        </div>
      </div>

      {/* Floating Base with Holographic Glow */}
      <div className="relative mx-auto w-48 h-12 bg-gradient-to-b from-gray-800/90 to-black/90 rounded-b-2xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] transform-gpu transition-all duration-300 hover:-translate-y-2">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-b-2xl blur-sm"></div>
        <div className="absolute top-0 left-4 right-4 h-1.5 bg-gradient-to-r from-purple-600/50 to-blue-600/50 rounded-full"></div>
      </div>

      {/* Dynamic Floor Reflection */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent transform scale-x-125 blur-lg pointer-events-none transition-all duration-300 group-hover:blur-xl"></div>
    </div>
  );
});

export default FuturisticKioskShowcase;

<style>
{`
  /* Perspective for 3D effect */
  .perspective-1200 {
    perspective: 1200px;
  }

  /* Slow pulse animation for ambient glow */
  @keyframes pulse-slow {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 0.9; }
  }
  .animate-pulse-slow {
    animation: pulse-slow 4s ease-in-out infinite;
  }

  /* Ventilation animation */
  @keyframes ventilation {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.65); }
  }
  .animate-ventilation {
    animation: ventilation 2.5s ease-in-out infinite;
  }

  /* Disable heavy animations on mobile */
  @media (max-width: 640px) {
    .animate-pulse-slow, .animate-ventilation {
      animation: none;
    }
    .transform-gpu {
      transform: none !important;
    }
    .group-hover\\:scale-\\[1\\.03\\] {
      transform: none !important;
    }
    .group-hover\\:blur-xl {
      filter: blur(12px) !important;
    }
  }
`}
</style>