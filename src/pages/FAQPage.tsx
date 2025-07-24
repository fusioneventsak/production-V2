import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Float, Text, OrbitControls, Environment } from '@react-three/drei';
import { ChevronDown, ChevronUp, Search, Camera, Zap, Shield, Palette, Monitor, Globe, Settings, Users, Award, Sparkles } from 'lucide-react';
import * as THREE from 'three';

// Three.js animated background with particles
const ParticleField = () => {
  const pointsRef = useRef();
  const particleCount = 2000;
  
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 50;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    
    const color = new THREE.Color();
    color.setHSL(0.7 + Math.random() * 0.2, 0.8, 0.5 + Math.random() * 0.3);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.1;
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });
  
  return (
    <Points ref={pointsRef} positions={positions} colors={colors}>
      <PointMaterial
        transparent
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        vertexColors
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

// Floating 3D elements
const FloatingElements = () => {
  return (
    <group>
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh position={[-15, 5, -10]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#9333ea" transparent opacity={0.3} />
        </mesh>
      </Float>
      
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[15, -5, -15]}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.2} />
        </mesh>
      </Float>
      
      <Float speed={3} rotationIntensity={2} floatIntensity={3}>
        <mesh position={[0, 10, -20]}>
          <torusGeometry args={[2, 0.5, 16, 100]} />
          <meshStandardMaterial color="#06b6d4" transparent opacity={0.25} />
        </mesh>
      </Float>
    </group>
  );
};

// Camera animation
const CameraController = () => {
  const { camera } = useThree();
  
  useFrame((state) => {
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 2;
    camera.position.y = Math.cos(state.clock.elapsedTime * 0.15) * 1;
    camera.lookAt(0, 0, 0);
  });
  
  return null;
};

// Three.js Scene Component
const ThreeBackground = () => {
  return (
    <div className="fixed inset-0 w-full h-full" style={{ zIndex: -1 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1e1b4b 50%, #0f0f23 100%)' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#9333ea" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#3b82f6" />
        
        <ParticleField />
        <FloatingElements />
        <CameraController />
        
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

// Liquid glass button component
const LiquidButton = ({ children, onClick, variant = 'primary', className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        group relative overflow-hidden px-8 py-4 rounded-2xl font-semibold text-white
        transition-all duration-500 transform hover:scale-105 hover:shadow-2xl
        ${variant === 'primary' 
          ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30 hover:from-purple-500/40 hover:to-blue-500/40' 
          : 'bg-white/10 border border-white/20 hover:bg-white/20'
        }
        backdrop-blur-xl ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <span className="relative z-10">{children}</span>
    </button>
  );
};

// FAQ Item Component with animations
const FAQItem = ({ question, answer, icon: Icon, isOpen, onToggle }) => {
  return (
    <div className={`
      bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-4
      transition-all duration-500 hover:bg-black/30 hover:border-white/20
      ${isOpen ? 'shadow-2xl shadow-purple-500/10' : ''}
    `}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-xl border border-purple-500/30 backdrop-blur-sm">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">
            {question}
          </h3>
        </div>
        <div className={`
          transform transition-transform duration-300 text-white/70
          ${isOpen ? 'rotate-180' : ''}
        `}>
          <ChevronDown className="w-6 h-6" />
        </div>
      </button>
      
      <div className={`
        overflow-hidden transition-all duration-500 ease-in-out
        ${isOpen ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'}
      `}>
        <div className="text-gray-300 leading-relaxed prose prose-invert max-w-none">
          {answer}
        </div>
      </div>
    </div>
  );
};

// Search component
const SearchBar = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative max-w-2xl mx-auto mb-12">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-6 w-6 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search FAQ topics..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-12 pr-4 py-4 bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
      />
    </div>
  );
};

// Category filter buttons
const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center mb-12">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`
            px-6 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm
            ${activeCategory === category.id
              ? 'bg-gradient-to-r from-purple-600/40 to-blue-600/40 border border-purple-500/50 text-white shadow-lg'
              : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20 hover:text-white'
            }
          `}
        >
          <category.icon className="w-4 h-4 inline mr-2" />
          {category.name}
        </button>
      ))}
    </div>
  );
};

// Main FAQ Page Component
const FAQPage = () => {
  const [openItems, setOpenItems] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: Globe },
    { id: 'general', name: 'General', icon: Camera },
    { id: 'technical', name: 'Technical', icon: Settings },
    { id: 'features', name: 'Features', icon: Zap },
    { id: 'customization', name: 'Customization', icon: Palette },
    { id: 'professional', name: 'Professional', icon: Award }
  ];

  const faqData = [
    {
      id: 1,
      category: 'general',
      question: 'What is PhotoSphere photobooth software?',
      answer: 'PhotoSphere is a revolutionary 3D photobooth display platform that transforms how event photos are shared and experienced. Unlike traditional photobooths that print or display static images, PhotoSphere creates an immersive 3D environment where uploaded photos float, wave, and spiral in real-time.',
      icon: Camera
    },
    {
      id: 2,
      category: 'general',
      question: 'Is PhotoSphere free photobooth software?',
      answer: 'PhotoSphere offers various pricing tiers to accommodate different needs. While we don\'t offer a completely free version, our starter plan is extremely affordable and includes all core features like 3D displays, real-time uploads, and basic customization.',
      icon: Award
    },
    {
      id: 3,
      category: 'technical',
      question: 'Does PhotoSphere work with DSLR cameras?',
      answer: 'Yes! PhotoSphere supports photos from any source, including professional DSLR cameras. You can upload high-quality images in large batches, whether they\'re from DSLRs, mirrorless cameras, or smartphones. The platform automatically optimizes photos for the 3D display while maintaining quality.',
      icon: Camera
    },
    {
      id: 4,
      category: 'technical',
      question: 'Can I use PhotoSphere with my existing photobooth equipment?',
      answer: 'Absolutely! PhotoSphere is designed to complement, not replace, your existing photobooth setup. Use your professional cameras and lighting for capturing high-quality photos, then upload them to PhotoSphere for the stunning 3D display.',
      icon: Settings
    },
    {
      id: 5,
      category: 'features',
      question: 'What\'s the best way to display photobooth pictures with PhotoSphere?',
      answer: 'PhotoSphere offers multiple stunning display options: 3D Floating (photos float gently with realistic physics), Wave Animation (beautiful wave patterns), Spiral Display (dynamic spiral formations), Orbit Patterns (rotation around central points), and Custom Arrangements (design your own layouts).',
      icon: Monitor
    },
    {
      id: 6,
      category: 'features',
      question: 'Can I add overlays and graphics to photos?',
      answer: 'Yes! PhotoSphere supports multiple types of overlays: logo overlays with transparency support, text overlays for event names and hashtags, frame overlays for borders, sponsor graphics, social media elements, and custom graphics for themed events. All overlays can be positioned, resized, and layered.',
      icon: Palette
    },
    {
      id: 7,
      category: 'customization',
      question: 'Can PhotoSphere be fully branded for my business?',
      answer: 'Yes! PhotoSphere offers comprehensive branding options: custom logos with transparency support, brand colors throughout the interface, custom overlays for additional branding elements, themed environments that match your brand aesthetic, white-label options for professional event companies, and custom domain support.',
      icon: Palette
    },
    {
      id: 8,
      category: 'features',
      question: 'Can I record or export the 3D display?',
      answer: 'Yes! PhotoSphere includes a built-in screen recording feature that lets you capture the live 3D display directly from the platform. You can also use external recording software like OBS Studio, Zoom, Loom, or built-in OS tools to create highlight reels and social media content.',
      icon: Zap
    },
    {
      id: 9,
      category: 'features',
      question: 'How do I prevent inappropriate photos from appearing?',
      answer: 'PhotoSphere includes comprehensive moderation tools: pre-approval mode to review all photos before they appear, real-time monitoring to watch uploads as they happen, quick removal to delete inappropriate content instantly, bulk actions to manage multiple photos efficiently, and activity logs to track all moderation actions.',
      icon: Shield
    },
    {
      id: 10,
      category: 'professional',
      question: 'Is PhotoSphere suitable for professional event photographers?',
      answer: 'Absolutely! Many professional photographers use PhotoSphere to showcase work in real-time during events, engage clients with interactive displays, differentiate services with unique 3D presentations, upload batches of professional photos efficiently, and provide added value beyond traditional photography packages.',
      icon: Award
    }
  ];

  const toggleItem = (id) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    // Add JSON-LD structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqData.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Three.js Background */}
      <ThreeBackground />
      
      {/* SEO Meta Tags */}
      <div style={{ display: 'none' }}>
        <h1>PhotoSphere FAQ - Complete Guide to 3D Photobooth Software</h1>
        <meta name="description" content="Get answers to all your photobooth software questions. Learn about PhotoSphere's 3D displays, DSLR compatibility, virtual photobooths, branding options, and professional features." />
        <meta name="keywords" content="photobooth software FAQ, 3D photobooth, virtual photobooth, DSLR photobooth, free photobooth software, photobooth display, event photography software" />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Everything you need to know about PhotoSphere's revolutionary 3D photobooth platform. 
              Find answers about compatibility, features, pricing, and setup.
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-400 mb-1">500+</div>
              <div className="text-sm text-gray-400">Photos Per Event</div>
            </div>
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-400 mb-1">&lt;1s</div>
              <div className="text-sm text-gray-400">Real-time Display</div>
            </div>
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">∞</div>
              <div className="text-sm text-gray-400">Simultaneous Users</div>
            </div>
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-400 mb-1">0</div>
              <div className="text-sm text-gray-400">Setup Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Search Bar */}
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        
        {/* Category Filters */}
        <CategoryFilter 
          categories={categories} 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory} 
        />

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((item) => (
            <FAQItem
              key={item.id}
              question={item.question}
              answer={item.answer}
              icon={item.icon}
              isOpen={openItems.has(item.id)}
              onToggle={() => toggleItem(item.id)}
            />
          ))}
        </div>

        {/* No Results */}
        {filteredFAQs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-purple-500/30">
              <Search className="w-12 h-12 text-white/70" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">No results found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your search terms or category filter.</p>
            <LiquidButton onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}>
              Clear Filters
            </LiquidButton>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12">
            <div className="max-w-3xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-purple-500/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">Still Have Questions?</h3>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Can't find what you're looking for? We're here to help! Contact our support team 
                for personalized assistance with your PhotoSphere setup, technical questions, 
                or custom requirements for your events.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <LiquidButton variant="primary">
                  Contact Support
                </LiquidButton>
                <LiquidButton variant="secondary">
                  Schedule Demo
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;