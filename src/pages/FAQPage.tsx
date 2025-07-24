import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, Camera, Zap, Shield, Palette, Monitor, Globe, Settings, Users, Award, Sparkles, ArrowRight } from 'lucide-react';
import Layout from '../components/layout/Layout';
import HeroScene from '../components/three/HeroScene';
import { LandingParticleBackground } from '../components/three/LandingParticleBackground';
import { PARTICLE_THEMES } from '../components/three/MilkyWayParticleSystem';
import DemoRequestModal from '../components/modals/DemoRequestModal';

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

const FAQPage: React.FC = () => {
  const [openItems, setOpenItems] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [particleTheme, setParticleTheme] = useState(PARTICLE_THEMES[0]);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

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

  // Handle theme changes from HeroScene
  const handleThemeChange = (newTheme: typeof PARTICLE_THEMES[0]) => {
    setParticleTheme(newTheme);
  };

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

    // Set page title and meta description for SEO
    document.title = 'FAQ - PhotoSphere 3D Photobooth Software | Everything You Need to Know';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get answers to all your photobooth software questions. Learn about PhotoSphere\'s 3D displays, DSLR compatibility, virtual photobooths, branding options, and professional features.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Get answers to all your photobooth software questions. Learn about PhotoSphere\'s 3D displays, DSLR compatibility, virtual photobooths, branding options, and professional features.';
      document.head.appendChild(meta);
    }

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <Layout>
      {/* Particle Background - covers entire page */}
      <LandingParticleBackground particleTheme={particleTheme} />

      {/* All content sections with proper z-index */}
      <div className="relative z-[5]">
        {/* Hero Section with WebGL Background */}
        <div className="relative overflow-hidden min-h-[70vh] flex items-center">
          {/* WebGL Scene Background */}
          <div 
            className="absolute inset-0 w-full h-full z-[10]" 
            style={{ 
              pointerEvents: 'auto',
              touchAction: 'pan-x pan-y'
            }}
          >
            <HeroScene onThemeChange={handleThemeChange} />
          </div>
          
          {/* Hero Content */}
          <div className="relative z-[20] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32 pointer-events-none">
            <div className="text-center lg:text-left lg:w-1/2">
              {/* Abstract diffused gradient overlay behind text */}
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-radial from-black/50 via-black/30 to-transparent opacity-80 blur-xl"></div>
                <div className="absolute -inset-4 bg-gradient-to-br from-black/40 via-transparent to-black/20 opacity-60 blur-lg"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-black/30 via-black/10 to-transparent opacity-70 blur-md"></div>
                
                <div className="relative">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                    <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-lg">
                      Frequently Asked
                    </span>
                    <span className="block drop-shadow-lg">Questions</span>
                  </h1>
                  
                  <p className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow-lg">
                    Everything you need to know about PhotoSphere's revolutionary 3D photobooth platform. 
                    Find answers about compatibility, features, pricing, and setup.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 pointer-events-auto">
                    <button
                      onClick={() => setIsDemoModalOpen(true)}
                      className="px-8 py-3 text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 transition-colors flex items-center justify-center shadow-lg hover:shadow-purple-500/25"
                    >
                      Request Demo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[20] pointer-events-none">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">500+</div>
                <div className="text-sm text-gray-400">Photos Per Event</div>
              </div>
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">&lt;1s</div>
                <div className="text-sm text-gray-400">Real-time Display</div>
              </div>
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">∞</div>
                <div className="text-sm text-gray-400">Simultaneous Users</div>
              </div>
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">0</div>
                <div className="text-sm text-gray-400">Hardware Required</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Content Section */}
        <div className="relative z-10 py-20 bg-gradient-to-b from-black/10 to-black/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search Bar */}
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            
            {/* Category Filters */}
            <CategoryFilter 
              categories={categories} 
              activeCategory={activeCategory} 
              onCategoryChange={setActiveCategory} 
            />

            {/* FAQ Items */}
            <div className="space-y-4 mb-20">
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
            <div className="text-center">
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
                    <LiquidButton variant="primary" onClick={() => setIsDemoModalOpen(true)}>
                      Contact Support
                    </LiquidButton>
                    <LiquidButton variant="secondary" onClick={() => setIsDemoModalOpen(true)}>
                      Schedule Demo
                    </LiquidButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Request Modal */}
      <DemoRequestModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </Layout>
  );
};

export default FAQPage;