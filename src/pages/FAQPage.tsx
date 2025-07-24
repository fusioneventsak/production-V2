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

  // Add custom CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float-1 {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(-10px) rotate(5deg); }
        66% { transform: translateY(5px) rotate(-3deg); }
      }
      @keyframes float-2 {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(8px) rotate(-4deg); }
        66% { transform: translateY(-12px) rotate(6deg); }
      }
      @keyframes float-3 {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        33% { transform: translateY(-6px) rotate(3deg); }
        66% { transform: translateY(10px) rotate(-5deg); }
      }
      @keyframes gradient-x {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      .animate-float-1 { animation: float-1 6s ease-in-out infinite; }
      .animate-float-2 { animation: float-2 8s ease-in-out infinite; }
      .animate-float-3 { animation: float-3 7s ease-in-out infinite; }
      .animate-gradient-x { 
        background-size: 400% 400%;
        animation: gradient-x 8s ease infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

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
      answer: 'PhotoSphere offers various pricing tiers to accommodate different needs. While we don\'t offer a completely free version, we provide a 14-day free trial that includes all Pro features so you can test everything before committing. Our starter plan is extremely affordable and includes all core features like 3D displays, real-time uploads, and basic customization.',
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
    },
    {
      id: 11,
      category: 'professional', 
      question: 'How do I make more money with my photobooth business?',
      answer: 'PhotoSphere helps photobooth businesses increase revenue in multiple ways: charge premium rates for unique 3D experiences ($200-500+ more per event), offer it as an exclusive add-on service, create recurring revenue with venue partnerships, attract higher-end corporate clients who want cutting-edge technology, and increase booking frequency through social media buzz and word-of-mouth from the "wow factor" of 3D displays.',
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
    // Add comprehensive JSON-LD structured data for SEO
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
      })),
      "about": {
        "@type": "SoftwareApplication",
        "name": "PhotoSphere",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser",
        "description": "3D photobooth software for events with real-time photo displays, DSLR support, and professional features",
        "offers": {
          "@type": "Offer",
          "name": "14-day free trial",
          "description": "Try all Pro features free for 14 days"
        }
      },
      "publisher": {
        "@type": "Organization", 
        "name": "PhotoSphere",
        "url": "https://photosphere.com"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Set comprehensive SEO meta tags
    document.title = 'FAQ - PhotoSphere 3D Photobooth Software | Everything You Need to Know';
    
    // Meta description optimized for search and AI
    const metaDescription = document.querySelector('meta[name="description"]');
    const descriptionContent = 'Complete FAQ for PhotoSphere 3D photobooth software. Learn about DSLR compatibility, virtual photobooths, pricing, free trial, professional features, branding options, and how to increase photobooth business revenue.';
    if (metaDescription) {
      metaDescription.setAttribute('content', descriptionContent);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = descriptionContent;
      document.head.appendChild(meta);
    }

    // Add keywords meta tag for additional SEO
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    const keywordsContent = 'photobooth software FAQ, 3D photobooth, virtual photobooth, DSLR photobooth, free photobooth software, photobooth display, event photography software, photobooth business revenue, 14 day free trial, professional photobooth features';
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywordsContent);
    } else {
      const keywordsMeta = document.createElement('meta');
      keywordsMeta.name = 'keywords';
      keywordsMeta.content = keywordsContent;
      document.head.appendChild(keywordsMeta);
    }

    // Add Open Graph tags for social sharing
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      const ogTitleMeta = document.createElement('meta');
      ogTitleMeta.setAttribute('property', 'og:title');
      ogTitleMeta.content = 'PhotoSphere FAQ - Complete Guide to 3D Photobooth Software';
      document.head.appendChild(ogTitleMeta);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      const ogDescMeta = document.createElement('meta');
      ogDescMeta.setAttribute('property', 'og:description');
      ogDescMeta.content = descriptionContent;
      document.head.appendChild(ogDescMeta);
    }

    // Add Twitter Card tags
    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      const twitterMeta = document.createElement('meta');
      twitterMeta.name = 'twitter:card';
      twitterMeta.content = 'summary_large_image';
      document.head.appendChild(twitterMeta);
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

            {/* Who Can Use PhotoSphere Section - ENHANCED */}
            <div className="mb-20 relative">
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-2000"></div>
              </div>

              <div className="text-center mb-16 relative">
                <div className="inline-block mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl animate-pulse"></div>
                    <h2 className="relative text-5xl md:text-6xl font-bold text-white mb-4">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-gradient-x">
                        Who Can Use PhotoSphere?
                      </span>
                    </h2>
                  </div>
                </div>
                <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                  <span className="text-white font-semibold">Anyone can create magic</span> ✨ From intimate gatherings to massive festivals, 
                  discover how different industries transform ordinary events into <span className="text-purple-400 font-semibold">extraordinary 3D experiences</span>.
                </p>
                
                {/* Floating icons animation */}
                <div className="relative mt-8 h-16">
                  <div className="absolute inset-0 flex justify-center items-center space-x-8">
                    <div className="animate-float-1 opacity-60">
                      <Camera className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="animate-float-2 opacity-60">
                      <Users className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="animate-float-3 opacity-60">
                      <Sparkles className="w-8 h-8 text-pink-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Use Cases Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
                {/* Photobooth Business - PREMIUM SPOTLIGHT */}
                <div className="group relative bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl border-2 border-purple-500/50 rounded-3xl p-8 hover:border-purple-400 transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/25 transform-gpu">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-3 py-1 rounded-full transform rotate-12 animate-pulse">
                    💰 HIGH ROI
                  </div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg">
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">Photobooth Business</h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      🚀 <strong>Charge premium rates</strong> with unique 3D experiences. Perfect add-on service that differentiates your business and increases revenue per event.
                    </p>
                    <div className="text-sm text-purple-300 font-semibold">
                      💸 $200-500+ more per event
                    </div>
                  </div>
                </div>

                {/* Corporate Events */}
                <div className="group relative bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-black/40 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 transform-gpu">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-lg">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">Corporate Events</h3>
                    <p className="text-gray-300 leading-relaxed">
                      🏢 Conferences, product launches, team building. Add professional branding and create networking experiences that employees remember.
                    </p>
                  </div>
                </div>

                {/* Family Events */}
                <div className="group relative bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-black/40 hover:border-green-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 transform-gpu">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-emerald-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-green-300 transition-colors">Family Events</h3>
                    <p className="text-gray-300 leading-relaxed">
                      💕 Weddings, reunions, anniversaries. Create magical moments that bring families together and preserve memories in stunning 3D displays.
                    </p>
                  </div>
                </div>

                {/* Birthdays */}
                <div className="group relative bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-black/40 hover:border-yellow-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20 transform-gpu">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/5 to-orange-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 shadow-lg">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-yellow-300 transition-colors">Birthdays & Parties</h3>
                    <p className="text-gray-300 leading-relaxed">
                      🎉 Make any celebration unforgettable. From kids' parties to milestone birthdays, guests love seeing their photos come alive in 3D.
                    </p>
                  </div>
                </div>

                {/* Bands & Musicians */}
                <div className="group relative bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-black/40 hover:border-red-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-red-500/20 transform-gpu">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-red-300 transition-colors">Bands & Musicians</h3>
                    <p className="text-gray-300 leading-relaxed">
                      🎵 Concerts, gigs, album launches. Fans share photos that create stunning visual backdrops, adding energy to your performances.
                    </p>
                  </div>
                </div>

                {/* DJ/VJ's */}
                <div className="group relative bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-black/40 hover:border-indigo-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20 transform-gpu">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors">DJ/VJ's</h3>
                    <p className="text-gray-300 leading-relaxed">
                      🎧 Add visual storytelling to your sets. Create immersive experiences where crowd photos become part of your visual performance.
                    </p>
                  </div>
                </div>

                {/* Entertainers */}
                <div className="group relative bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-black/40 hover:border-teal-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-teal-500/20 transform-gpu">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-600/5 to-cyan-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-teal-300 transition-colors">Entertainers</h3>
                    <p className="text-gray-300 leading-relaxed">
                      🎭 Magicians, comedians, performers. Engage your audience with interactive displays that make them part of the show.
                    </p>
                  </div>
                </div>

                {/* Festivals */}
                <div className="group relative bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-black/40 hover:border-orange-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20 transform-gpu">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-red-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-300 transition-colors">Festivals</h3>
                    <p className="text-gray-300 leading-relaxed">
                      🎪 Music festivals, art shows, food festivals. Create massive community displays on big screens and projectors for shared experiences.
                    </p>
                  </div>
                </div>

                {/* Additional cards with similar enhancements... */}
                {/* Retail & Business */}
                <div className="group relative bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-black/40 hover:border-violet-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-violet-500/20 transform-gpu">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-purple-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                      <Monitor className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-violet-300 transition-colors">Retail & Business</h3>
                    <p className="text-gray-300 leading-relaxed">
                      🛍️ Store openings, promotions, trade shows. Customer photos with your products create organic marketing and memorable brand experiences.
                    </p>
                  </div>
                </div>

                {/* Event Planners */}
                <div className="group relative bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-black/40 hover:border-emerald-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/20 transform-gpu">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-teal-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-lg">
                      <Settings className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-300 transition-colors">Event Planners</h3>
                    <p className="text-gray-300 leading-relaxed">
                      📋 Offer clients something unique that sets your events apart. Easy add-on service that increases your value and client satisfaction.
                    </p>
                  </div>
                </div>

                {/* Venues */}
                <div className="group relative bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-black/40 hover:border-rose-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-rose-500/20 transform-gpu">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-600/5 to-pink-600/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-rose-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-rose-300 transition-colors">Venues & Restaurants</h3>
                    <p className="text-gray-300 leading-relaxed">
                      🍽️ Create unique attractions that bring customers back. Perfect for special events, themed nights, and generating social media buzz.
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Bottom CTA with Animation */}
              <div className="text-center relative">
                <div className="relative bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl border-2 border-purple-500/30 rounded-3xl p-12 hover:border-purple-400/50 transition-all duration-500 overflow-hidden">
                  {/* Animated background patterns */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="inline-block mb-6">
                      <div className="animate-bounce">
                        <Sparkles className="w-12 h-12 text-yellow-400 mx-auto" />
                      </div>
                    </div>
                    <h3 className="text-4xl font-bold text-white mb-6">
                      Ready to Transform Your Events?
                    </h3>
                    <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                      No matter what type of events you host or what industry you're in, PhotoSphere adapts to your needs. 
                      Join <span className="text-purple-400 font-bold">thousands of event professionals</span> who've discovered the power of 3D photo experiences.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center mb-6">
                      <LiquidButton 
                        variant="primary" 
                        onClick={() => setIsDemoModalOpen(true)}
                        className="text-lg px-10 py-5 transform hover:scale-110"
                      >
                        🚀 Start Your Free Trial
                      </LiquidButton>
                      <LiquidButton 
                        variant="secondary" 
                        onClick={() => setIsDemoModalOpen(true)}
                        className="text-lg px-10 py-5 transform hover:scale-110"
                      >
                        👀 See It In Action
                      </LiquidButton>
                    </div>
                    <p className="text-sm text-gray-400">
                      ✨ <strong>14-day free trial</strong> • 💳 No credit card required • ⚡ Setup in minutes
                    </p>
                  </div>
                </div>
              </div>
            </div>

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