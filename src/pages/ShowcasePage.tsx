import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { LandingParticleBackground } from '../components/three/LandingParticleBackground';
import { PARTICLE_THEMES } from '../components/three/MilkyWayParticleSystem';
import { ArrowRight, Camera, Eye, Share2, Sparkles, Play, Monitor, Smartphone, Users } from 'lucide-react';

// Futuristic Kiosk Component with Enhanced Realism
const FuturisticKioskShowcase = React.memo(() => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const playSound = () => {
    const audio = new Audio('/sounds/futuristic-click.mp3');
    audio.play();
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto md:scale-100 sm:scale-90 scale-75">
      {/* Main Kiosk Body with Dynamic Lighting */}
      <div className="relative bg-gradient-to-b from-gray-300 via-gray-400 to-gray-600 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Dynamic Glow Effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent animate-pulse-slow"></div>
        {/* Enhanced Reflective Surface with Texture */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/25 via-transparent to-black/25 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/metal.png')] opacity-10"></div>

        {/* Chrome Bezel with Beveled Edges */}
        <div className="relative bg-gradient-to-b from-gray-100 via-gray-300 to-gray-500 rounded-2xl p-4 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/30 rounded-2xl"></div>

          {/* Screen Frame with Neon Glow */}
          <div className="relative bg-black rounded-xl p-3 shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm"></div>

            {/* Main Display Area with Glare and Hover Effect */}
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', minHeight: '500px' }} onClick={playSound}>
              {/* Screen Glare */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>

              {/* Loading State with Holographic Animation */}
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 relative">
                      <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-pulse"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                    </div>
                    <p className="text-blue-300 text-xl font-semibold font-['Orbitron']">PhotoSphere</p>
                    <p className="text-gray-400 text-sm mt-2">Initializing Holographic Display...</p>
                  </div>
                </div>
              )}

              {/* Main Content - Large Iframe with Glow */}
              {!isLoading && (
                <iframe
                  src="https://selfieholosphere.com/collage/BCBJ"
                  className="w-full h-full border-0 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-transform duration-300 group-hover:scale-105"
                  title="PhotoSphere BCBJ Collection"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                />
              )}
            </div>
          </div>

          {/* Minimal Status Bar */}
          <div className="flex justify-between items-center mt-3 px-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                <span className="text-gray-600 text-xs font-medium">LIVE</span>
              </div>
            </div>
            <div className="text-gray-500 text-xs font-mono bg-gray-200/50 px-2 py-1 rounded">
              PhotoSphere Display
            </div>
          </div>
        </div>

        {/* Metallic Ventilation Grilles with Animation */}
        <div className="absolute bottom-8 left-8 right-8 flex justify-center space-x-2">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-6 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full shadow-inner animate-ventilation"
              style={{ animationDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>

        {/* Chrome Power Button with Hover Effect */}
        <div className="absolute bottom-4 right-6 group">
          <div className="w-10 h-10 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-500 rounded-full flex items-center justify-center shadow-lg border border-gray-400 transition-all duration-300 group-hover:bg-gradient-to-b group-hover:from-blue-400 group-hover:to-blue-600 group-hover:shadow-blue-500/50">
            <div className="w-5 h-5 border-2 border-gray-600 rounded-full relative bg-gradient-to-b from-gray-100 to-gray-300">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0.5 h-2 bg-gray-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Brand Plate */}
        <div className="absolute bottom-4 left-6">
          <div className="bg-gradient-to-b from-gray-200 to-gray-400 rounded-lg px-4 py-2 border border-gray-500 shadow-lg">
            <span className="text-gray-800 text-sm font-bold font-['Orbitron']">PhotoSphere</span>
          </div>
        </div>

        {/* Status LEDs */}
        <div className="absolute top-4 right-6 flex space-x-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"></div>
        </div>
      </div>

      {/* Metallic Stand Base */}
      <div className="relative mx-auto w-40 h-12 bg-gradient-to-b from-gray-400 via-gray-500 to-gray-700 rounded-b-2xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/20 rounded-b-2xl"></div>
        <div className="absolute top-0 left-4 right-4 h-1 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full"></div>
      </div>

      {/* Dynamic Floor Shadow */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent transform scale-x-150 blur-lg pointer-events-none group-hover:blur-xl transition-all duration-300"></div>
    </div>
  );
});

const ShowcasePage = () => {
  const [particleTheme, setParticleTheme] = useState(PARTICLE_THEMES[0]);

  const features = [
    {
      icon: <Eye className="w-6 h-6 stroke-2" />,
      title: "Immersive 3D Experience",
      description: "Watch photos float and animate in stunning 3D space that responds to your interactions",
    },
    {
      icon: <Camera className="w-6 h-6 stroke-2" />,
      title: "Real-time Photo Updates",
      description: "New photos appear instantly as guests upload them during your event",
    },
    {
      icon: <Share2 className="w-6 h-6 stroke-2" />,
      title: "Easy Sharing",
      description: "Simple QR codes let guests contribute photos without downloading apps or creating accounts",
    },
    {
      icon: <Sparkles className="w-6 h-6 stroke-2" />,
      title: "Customizable Animations",
      description: "Choose from multiple animation patterns and themes to match your event's vibe",
    },
  ];

  const useCases = [
    {
      icon: <Users className="w-8 h-8 stroke-2" />,
      title: "Weddings",
      description: "Create magical memories with photos from all your guests flowing through beautiful 3D space",
      gradient: "from-purple-500 to-blue-600",
      video: "/videos/weddings-preview.mp4",
    },
    {
      icon: <Monitor className="w-8 h-8 stroke-2" />,
      title: "Corporate Events",
      description: "Engage attendees with an interactive display that showcases company culture and team moments",
      gradient: "from-blue-500 to-cyan-600",
      video: "/videos/corporate-preview.mp4",
    },
    {
      icon: <Smartphone className="w-8 h-8 stroke-2" />,
      title: "Parties & Celebrations",
      description: "Turn any gathering into an unforgettable experience with dynamic photo displays",
      gradient: "from-purple-500 to-blue-600",
      video: "/videos/parties-preview.mp4",
    },
  ];

  return (
    <Layout>
      {/* Particle Background with Parallax */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 transform-gpu transition-transform duration-1000" style={{ transform: 'translateY(calc(var(--scroll-y, 0) * -0.2px))' }}>
          <LandingParticleBackground particleTheme={particleTheme} />
        </div>

        {/* All content sections with proper z-index */}
        <div className="relative z-[5]">
          {/* Hero Section */}
          <div className="relative min-h-[100vh] flex flex-col items-center justify-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
              {/* Hero Content */}
              <div className="text-center mb-16">
                <div className="relative px-4">
                  <div className="absolute -inset-12 bg-gradient-radial from-black/50 via-black/30 to-transparent opacity-80 blur-xl"></div>
                  <div className="absolute -inset-8 bg-gradient-to-br from-black/40 via-transparent to-black/20 opacity-60 blur-lg"></div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-black/30 via-black/10 to-transparent opacity-70 blur-md"></div>

                  <div className="relative py-4">
                    <div className="inline-flex items-center px-4 py-2 bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full mb-6">
                      <Sparkles className="w-4 h-4 text-purple-300 mr-2" />
                      <span className="text-purple-200 text-sm font-medium">Live Demo</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight font-['Orbitron']">
                      <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-lg pb-2">
                        Experience the Magic
                      </span>
                      <span className="block drop-shadow-lg">of PhotoSphere</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow-lg max-w-3xl mx-auto">
                      See how your event photos come alive in an interactive 3D environment.
                      This is what your guests will experience when they visit your PhotoSphere.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Link
                        to="/join"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl animate-pulse-cta"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Try Live Demo
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                      <Link
                        to="/dashboard"
                        className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
                      >
                        Create Your Own
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Centered Kiosk Display */}
              <div className="flex justify-center">
                <div className="relative">
                  <FuturisticKioskShowcase />
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-6 py-3 border border-purple-500/30">
                    <p className="text-purple-300 text-sm font-medium">🔴 Live Demo - Real PhotoSphere Interface</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-24 bg-gradient-to-b from-black/20 to-black/40 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-mosaic.png')] opacity-10"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-['Orbitron']">
                  Why PhotoSphere Creates Unforgettable Experiences
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Transform static photo sharing into an engaging, interactive journey that keeps guests captivated throughout your event.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-black/40 hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-2"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3 font-['Orbitron']">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Use Cases Section */}
          <div className="py-24 bg-gradient-to-b from-black/40 to-black/20 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-mosaic.png')] opacity-10"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-['Orbitron']">
                  Perfect for Every Celebration
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Whether it's an intimate gathering or a grand celebration, PhotoSphere adapts to create the perfect experience for your event.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {useCases.map((useCase, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-black/40 transition-all duration-300"
                  >
                    <video
                      className="absolute top-0 left-0 w-full h-full object-cover opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                      src={useCase.video}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      {useCase.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 font-['Orbitron']">{useCase.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{useCase.description}</p>
                    <div className={`absolute inset-0 bg-gradient-to-r ${useCase.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="py-24 bg-gradient-to-b from-black/20 to-black/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/particle-overlay.png')] animate-slow-drift opacity-20"></div>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-['Orbitron']">
                  Ready to Create Magic at Your Event?
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join thousands of event planners who've transformed their gatherings with PhotoSphere's immersive photo experiences.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/join"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl animate-pulse-cta"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Try Live Demo Now
                  </Link>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
                  >
                    Start Your PhotoSphere
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </div>

                <p className="text-sm text-gray-400 mt-6">
                  Trusted by over 10,000 event planners worldwide • No credit card required • Setup in minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
          }
          @keyframes ventilation {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.8); }
          }
          .animate-ventilation {
            animation: ventilation 2s ease-in-out infinite;
          }
          @keyframes pulse-cta {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .animate-pulse-cta {
            animation: pulse-cta 2s ease-in-out infinite;
          }
          @keyframes slow-drift {
            0% { background-position: 0 0; }
            100% { background-position: 100% 100%; }
          }
          .animate-slow-drift {
            animation: slow-drift 20s linear infinite;
          }
        `}
      </style>
    </Layout>
  );
};

export default ShowcasePage;