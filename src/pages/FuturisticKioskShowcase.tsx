import React, { useState, useEffect } from 'react';

const FuturisticKioskShowcase: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Kiosk Stand/Base */}
      <div className="relative bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-3xl p-8 shadow-2xl">
        
        {/* Ambient Lighting Effects */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 blur-xl"></div>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent via-purple-500/10 to-blue-500/10"></div>
        
        {/* Main Screen Container */}
        <div className="relative bg-black rounded-2xl p-6 shadow-inner">
          
          {/* Screen Bezel */}
          <div className="relative bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 rounded-xl p-4 shadow-2xl">
            
            {/* Screen Frame with Glow */}
            <div className="relative bg-black rounded-lg p-2 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-lg blur-sm"></div>
              
              {/* Actual Screen */}
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/10' }}>
                
                {/* Screen Reflection Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-lg"></div>
                
                {/* Loading State */}
                {isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                      </div>
                      <p className="text-purple-300 text-lg font-semibold">Initializing PhotoSphere</p>
                      <p className="text-gray-400 text-sm mt-2">Loading BCBJ Collection...</p>
                    </div>
                  </div>
                )}
                
                {/* Main Content - Iframe */}
                {!isLoading && (
                  <iframe
                    src="https://selfieholosphere.com/collage/BCBJ"
                    className="w-full h-full border-0 rounded-lg"
                    title="PhotoSphere BCBJ Collection"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                )}
              </div>
            </div>
            
            {/* Screen Status Indicators */}
            <div className="flex justify-between items-center mt-4 px-2">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs font-medium">LIVE</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-400 text-xs font-medium">CONNECTED</span>
                </div>
              </div>
              
              <div className="text-gray-400 text-xs font-mono">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {/* Touch Interface Elements */}
          <div className="flex justify-center mt-6 space-x-4">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-3 shadow-lg">
              <div className="w-6 h-6 bg-white rounded-full opacity-80"></div>
            </div>
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-full p-3 shadow-lg">
              <div className="w-6 h-6 bg-white rounded-full opacity-60"></div>
            </div>
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-full p-3 shadow-lg">
              <div className="w-6 h-6 bg-white rounded-full opacity-60"></div>
            </div>
          </div>
        </div>
        
        {/* Information Panel */}
        <div className="relative mt-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
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
        
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-200"></div>
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-400"></div>
        </div>
        
        {/* Power Button */}
        <div className="absolute bottom-4 right-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-4 h-4 border-2 border-white rounded-full relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0.5 h-2 bg-white"></div>
            </div>
          </div>
        </div>
        
        {/* Brand Label */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1 border border-gray-700">
            <span className="text-purple-400 text-xs font-bold">PhotoSphere</span>
            <span className="text-gray-400 text-xs ml-2">Interactive Display</span>
          </div>
        </div>
      </div>
      
      {/* Base Stand */}
      <div className="relative mx-auto w-32 h-8 bg-gradient-to-b from-gray-700 to-gray-900 rounded-b-full shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-b-full blur-sm"></div>
      </div>
      
      {/* Floor Reflection */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent transform rotate-180 blur-sm opacity-50 pointer-events-none"></div>
    </div>
  );
};

export default FuturisticKioskShowcase;