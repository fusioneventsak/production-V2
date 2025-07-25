import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import FuturisticKioskShowcase from './FuturisticKioskShowcase'; // Updated import path
import { LandingParticleBackground } from '../components/three/LandingParticleBackground';
import { PARTICLE_THEMES } from '../components/three/MilkyWayParticleSystem';
import { ArrowRight, Camera, Eye, Share2, Sparkles, Play, Monitor, Smartphone, Users } from 'lucide-react';

const ShowcasePage: React.FC = () => {
  const [particleTheme] = useState(PARTICLE_THEMES[0]);

  const features = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Immersive 3D Experience",
      description: "Watch photos float and animate in stunning 3D space that responds to your interactions",
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: "Real-time Photo Updates",
      description: "New photos appear instantly as guests upload them during your event",
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: "Easy Sharing",
      description: "Simple QR codes let guests contribute photos without downloading apps or creating accounts",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Customizable Animations",
      description: "Choose from multiple animation patterns and themes to match your event's vibe",
    },
  ];

  const useCases = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Weddings",
      description: "Create magical memories with photos from all your guests flowing through beautiful 3D space",
      gradient: "from-pink-500 to-purple-600",
    },
    {
      icon: <Monitor className="w-8 h-8" />,
      title: "Corporate Events",
      description: "Engage attendees with an interactive display that showcases company culture and team moments",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Parties & Celebrations",
      description: "Turn any gathering into an unforgettable experience with dynamic photo displays",
      gradient: "from-green-500 to-emerald-600",
    },
  ];

  return (
    <Layout>
      {/* Particle Background */}
      <LandingParticleBackground particleTheme={particleTheme} />

      {/* All content sections with proper z-index */}
      <div className="relative z-[5]">
        {/* Hero Section */}
        <div className="relative overflow-hidden min-h-[100vh] flex flex-col items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
            {/* Hero Content - Centered at Top */}
            <div className="text-center mb-16">
              <div className="relative px-4">
                {/* Abstract diffused gradient overlay behind text */}
                <div className="absolute -inset-12 bg-gradient-radial from-black/50 via-black/30 to-transparent opacity-80 blur-xl"></div>
                <div className="absolute -inset-8 bg-gradient-to-br from-black/40 via-transparent to-black/20 opacity-60 blur-lg"></div>
                <div className="absolute -inset-4 bg-gradient-to-r from-black/30 via-black/10 to-transparent opacity-70 blur-md"></div>

                <div className="relative py-4">
                  <div className="inline-flex items-center px-4 py-2 bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full mb-6">
                    <Sparkles className="w-4 h-4 text-purple-300 mr-2" />
                    <span className="text-purple-200 text-sm font-medium">Live Demo</span>
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                    <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-lg pb-2">
                      Experience the Magic
                    </span>
                    <span className="block drop-shadow-lg">of PhotoSphere</span>
                  </h1>

                  <p className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow-lg max-w-3xl mx-auto">
                    See how your event photos come alive in an interactive 3D environment. This is what your guests will experience when they visit your PhotoSphere.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/join"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl pointer-events-auto"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Try Live Demo
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20 pointer-events-auto"
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
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
                  className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-black/40 hover:border-purple-500/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="py-24 bg-gradient-to-b from-black/40 to-black/20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
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
                  <div className={`w-16 h-16 bg-gradient-to-r ${useCase.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {useCase.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{useCase.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{useCase.description}</p>

                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${useCase.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="py-24 bg-gradient-to-b from-black/20 to-black/10 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Create Magic at Your Event?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of event planners who've transformed their gatherings with PhotoSphere's immersive photo experiences.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/join"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
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
                No credit card required • Setup in minutes • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShowcasePage;
