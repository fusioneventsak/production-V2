import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// --- Internal Helper Components --- //

const Button = ({ children, className, ...props }: any) => (
  <button className={className} {...props}>
    {children}
  </button>
);

// Enhanced 3D Scene Background Component (same as pricing page)
const HeroScene3D = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [photos, setPhotos] = useState<Array<{
    id: number;
    x: number;
    y: number;
    z: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
    scale: number;
    opacity: number;
    src: string;
    speed: number;
  }>>([]);

  // Mix of broken/glitched photos and regular party photos for 404 theme
  const DEMO_PHOTOS = [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop&crop=center', // glitch effect
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&crop=center', // digital art
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop&crop=center', // digital/cyber
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=600&fit=crop&crop=center', // neon/cyber
    'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1518709775490-5c0c12b07db8?w=400&h=600&fit=crop&crop=center', // abstract
    'https://images.unsplash.com/photo-1574391884720-bbc049ec09ad?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1551198986-96e6924a0d1d?w=400&h=600&fit=crop&crop=center', // digital
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=600&fit=crop&crop=center', // abstract
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1520637836862-4d197d17c13a?w=400&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1492447166138-50c3889fccb1?w=400&h=600&fit=crop&crop=center'
  ];

  // Generate photo positions in 3D space
  useEffect(() => {
    const generatePhotos = () => {
      const newPhotos = Array.from({ length: 60 }, (_, i) => {
        // Create more chaotic distribution for 404 effect
        const layer = i % 6;
        const baseZ = -150 - (layer * 100);
        
        // More random distribution for "broken" effect
        const angle = (i / 60) * Math.PI * 6; // More spirals
        const radius = 600 + (layer * 150) + Math.random() * 500;
        
        return {
          id: i,
          x: Math.cos(angle) * radius + (Math.random() - 0.5) * 600,
          y: (Math.random() - 0.5) * 1400 + (layer * 80),
          z: baseZ + (Math.random() - 0.5) * 300,
          rotationX: Math.random() * 360,
          rotationY: Math.random() * 360,
          rotationZ: Math.random() * 360,
          scale: 0.3 + Math.random() * 0.8,
          opacity: 0.4 + Math.random() * 0.6,
          src: DEMO_PHOTOS[i % DEMO_PHOTOS.length],
          speed: 0.1 + Math.random() * 0.5
        };
      });
      setPhotos(newPhotos);
    };

    generatePhotos();
    window.addEventListener('resize', generatePhotos);
    return () => window.removeEventListener('resize', generatePhotos);
  }, []);

  // Animate the 3D scene with more chaotic movement for 404
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      setPhotos(prevPhotos => 
        prevPhotos.map(photo => {
          const time = Date.now() * 0.0001;
          const radius = Math.sqrt(photo.x * photo.x + photo.z * photo.z);
          const currentAngle = Math.atan2(photo.z, photo.x);
          const newAngle = currentAngle + photo.speed * 0.015; // Slightly faster
          
          return {
            ...photo,
            x: Math.cos(newAngle) * radius,
            z: Math.sin(newAngle) * radius,
            y: photo.y + Math.sin(time + photo.id) * 15, // More movement
            rotationY: photo.rotationY + photo.speed * 3,
            rotationX: photo.rotationX + photo.speed * 1,
            rotationZ: photo.rotationZ + photo.speed * 2
          };
        })
      );
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      style={{
        perspective: '1000px',
        perspectiveOrigin: '50% 50%'
      }}
    >
      {/* Cosmic background gradient with red tint for error */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-red-900/10 via-purple-900/20 to-black"></div>
      
      {/* Enhanced particle field with more particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 300 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className={`absolute w-1 h-1 rounded-full opacity-60 ${
              i % 10 === 0 ? 'bg-red-400' : i % 7 === 0 ? 'bg-yellow-400' : 'bg-cyan-400'
            }`}
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animation: 'twinkle 2s infinite alternate'
            }}
          />
        ))}
      </div>
      
      {/* 3D Photo Grid with glitch effect */}
      <div 
        className="absolute inset-0"
        style={{
          transformStyle: 'preserve-3d',
          animation: 'rotate3dGlitch 45s infinite linear'
        }}
      >
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={`absolute w-32 h-40 rounded-lg overflow-hidden shadow-2xl border ${
              index % 8 === 0 ? 'border-red-400/50' : 'border-white/20'
            }`}
            style={{
              transform: `
                translate3d(${photo.x}px, ${photo.y}px, ${photo.z}px)
                rotateX(${photo.rotationX}deg)
                rotateY(${photo.rotationY}deg)
                rotateZ(${photo.rotationZ}deg)
                scale(${photo.scale})
              `,
              opacity: photo.opacity,
              transformStyle: 'preserve-3d',
              left: '50%',
              top: '50%',
              marginLeft: '-4rem',
              marginTop: '-5rem',
              filter: index % 12 === 0 ? 'hue-rotate(180deg) saturate(2)' : 
                     index % 9 === 0 ? 'sepia(100%) hue-rotate(320deg)' : 'none'
            }}
          >
            <img
              src={photo.src}
              alt=""
              className={`w-full h-full object-cover ${
                index % 15 === 0 ? 'animate-pulse' : ''
              }`}
              loading="lazy"
            />
            <div className={`absolute inset-0 ${
              index % 10 === 0 
                ? 'bg-gradient-to-t from-red-900/60 via-transparent to-transparent' 
                : 'bg-gradient-to-t from-black/40 via-transparent to-transparent'
            }`}></div>
          </div>
        ))}
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.3; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.5); }
        }
        
        @keyframes rotate3dGlitch {
          0% { transform: rotateY(0deg) rotateX(0deg); }
          15% { transform: rotateY(54deg) rotateX(3deg); }
          30% { transform: rotateY(108deg) rotateX(-2deg); }
          45% { transform: rotateY(162deg) rotateX(4deg); }
          60% { transform: rotateY(216deg) rotateX(-1deg); }
          75% { transform: rotateY(270deg) rotateX(-3deg); }
          90% { transform: rotateY(324deg) rotateX(2deg); }
          100% { transform: rotateY(360deg) rotateX(0deg); }
        }
        
        @keyframes glitch {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
        }
        
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// 404 Page Component
const Custom404Page = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [glitchText, setGlitchText] = useState('404');
  
  // Scroll to top when component mounts or location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  // Glitch effect for the 404 text
  useEffect(() => {
    const glitchChars = ['4', '0', '4', '█', '▓', '▒', '░', '■', '□'];
    let glitchInterval: NodeJS.Timeout;
    
    const startGlitch = () => {
      let count = 0;
      glitchInterval = setInterval(() => {
        if (count < 10) {
          // Random glitch characters
          const randomText = Array.from({ length: 3 }, () => 
            glitchChars[Math.floor(Math.random() * glitchChars.length)]
          ).join('');
          setGlitchText(randomText);
          count++;
        } else {
          // Return to normal
          setGlitchText('404');
          clearInterval(glitchInterval);
          // Random delay before next glitch
          setTimeout(startGlitch, 2000 + Math.random() * 3000);
        }
      }, 100);
    };
    
    // Start first glitch after delay
    const timeout = setTimeout(startGlitch, 1000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(glitchInterval);
    };
  }, []);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="bg-black text-white min-h-screen w-full overflow-hidden relative">
      <HeroScene3D />
      
      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-4xl mx-auto text-center">
          {/* Glitchy 404 Text */}
          <div 
            className="text-[12rem] md:text-[16rem] font-extralight leading-none tracking-tight mb-8"
            style={{ 
              fontFamily: 'monospace',
              animation: 'glitch 0.3s infinite'
            }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-cyan-300 to-purple-400">
              {glitchText}
            </span>
          </div>
          
          {/* Error Message */}
          <div 
            className="mb-12"
            style={{ animation: 'fadeInUp 1s ease-out 0.5s both' }}
          >
            <h1 className="text-4xl md:text-6xl font-extralight leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-300 to-blue-400 mb-8 pb-2">
              Page Not Found
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed mb-4">
              Looks like this PhotoSphere got lost in the digital void.
            </p>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              The page you're looking for might have been moved, deleted, or never existed in the first place.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            style={{ animation: 'fadeInUp 1s ease-out 1s both' }}
          >
            <Button 
              onClick={handleGoHome}
              className="px-8 py-4 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-cyan-400/20 min-w-[200px]"
            >
              Return Home
            </Button>
            <Button 
              onClick={handleGoBack}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 rounded-xl font-semibold text-lg transition-all duration-200 min-w-[200px]"
            >
              Go Back
            </Button>
          </div>
          
          {/* Additional Help */}
          <div 
            className="mt-16 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl max-w-2xl mx-auto"
            style={{ animation: 'fadeInUp 1s ease-out 1.5s both' }}
          >
            <h3 className="text-white text-xl font-semibold mb-4">Need Help?</h3>
            <p className="text-white/70 mb-6">
              If you think this is a mistake or you're looking for something specific, feel free to reach out to our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all duration-200">
                Contact Support
              </Button>
              <Button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-semibold transition-all duration-200">
                Documentation
              </Button>
            </div>
          </div>
          
          {/* Fun Easter Egg */}
          <div 
            className="mt-12 text-center"
            style={{ animation: 'fadeInUp 1s ease-out 2s both' }}
          >
            <meta name="robots" content="noindex" />
            <p className="text-white/40 text-sm font-mono">
              Error Code: PHOTOSPHERE_NOT_FOUND_IN_DIGITAL_SPACE
            </p>
            <p className="text-white/30 text-xs font-mono mt-2">
              // TODO: Implement interdimensional photo recovery
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Custom404Page;