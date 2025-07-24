import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Search, Camera, Zap, Shield, Palette, Monitor, Globe, Settings, Users, Award, Sparkles, ArrowRight, Heart, Mic, Headphones, Star, Building, Calendar } from 'lucide-react';
import Layout from '../components/layout/Layout';
import HeroScene from '../components/three/HeroScene';
import { LandingParticleBackground } from '../components/three/LandingParticleBackground';
import { PARTICLE_THEMES } from '../components/three/MilkyWayParticleSystem';
import DemoRequestModal from '../components/modals/DemoRequestModal';

// FAQ Item Component with animations
const FAQItem = ({ question, answer, icon: Icon, isOpen, onToggle, id }) => {
  return (
    <div
      className={`
        bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-4
        transition-all duration-500 hover:bg-black/30 hover:border-white/20
        ${isOpen ? 'shadow-2xl shadow-purple-500/10' : ''}
      `}
      role="region"
      aria-labelledby={`faq-heading-${id}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left group focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${id}`}
        id={`faq-heading-${id}`}
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-xl border border-purple-500/30 backdrop-blur-sm">
            <Icon className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">
            {question}
          </h3>
        </div>
        <div
          className={`
            transform transition-transform duration-300 text-white/70
            ${isOpen ? 'rotate-180' : ''}
          `}
        >
          <ChevronDown className="w-6 h-6" aria-hidden="true" />
        </div>
      </button>
      
      <div
        id={`faq-answer-${id}`}
        className={`
          overflow-hidden transition-all duration-500 ease-in-out
          ${isOpen ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="text-gray-300 leading-relaxed prose prose-invert max-w-none">
          {answer}
        </div>
      </div>
    </div>
  );
};

// Search component
const SearchBar = ({ searchTerm, onSearchChange, onClearSearch }) => {
  return (
    <div className="relative max-w-2xl mx-auto mb-12">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-6 w-6 text-gray-400" aria-hidden="true" />
      </div>
      <input
        type="text"
        placeholder="Search FAQ topics..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-12 pr-12 py-4 bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
        aria-label="Search FAQ topics"
      />
      {searchTerm && (
        <button
          onClick={onClearSearch}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
          aria-label="Clear search"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Category filter buttons
const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center mb-12" role="tablist">
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
            focus:outline-none focus:ring-2 focus:ring-purple-500/50
          `}
          role="tab"
          aria-selected={activeCategory === category.id}
          aria-controls="faq-panel"
        >
          <category.icon className="w-4 h-4 inline mr-2" aria-hidden="true" />
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
        focus:outline-none focus:ring-2 focus:ring-purple-500/50
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
  const [showBackToTop, setShowBackToTop] = useState(false);

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
      icon: Camera,
      popular: true
    },
    {
      id: 2,
      category: 'general',
      question: 'Is PhotoSphere free photobooth software?',
      answer: 'PhotoSphere offers various pricing tiers to accommodate different needs. While we don\'t offer a completely free version, we provide a 14-day free trial that includes all Pro features so you can test everything before committing. Our starter plan is extremely affordable and includes all core features like 3D displays, real-time uploads, and basic customization.',
      icon: Award,
      popular: true
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
      icon: Award,
      popular: true
    }
  ];

  // Memoize filtered FAQs to prevent unnecessary re-computations
  const filteredFAQs = useMemo(() => {
    return faqData.filter(item => {
      const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.answer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const popularFAQs = useMemo(() => {
    return faqData.filter(item => item.popular);
  }, []);

  const toggleItem = useCallback((id) => {
    setOpenItems(prev => {
      const newOpenItems = new Set(prev);
      if (newOpenItems.has(id)) {
        newOpenItems.delete(id);
      } else {
        newOpenItems.add(id);
      }
      return newOpenItems;
    });
  }, []);

  const toggleAll = useCallback((open) => {
    if (open) {
      setOpenItems(new Set(faqData.map(item => item.id)));
    } else {
      setOpenItems(new Set());
    }
  }, [faqData]);

  const handleThemeChange = useCallback((newTheme) => {
    setParticleTheme(newTheme);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setActiveCategory('all');
  }, []);

  // Handle scroll for Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Optimized SEO meta tags
  useEffect(() => {
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

    const metaTags = [
      { name: 'description', content: 'FAQ for PhotoSphere 3D photobooth software: DSLR compatibility, pricing, features, and more.' },
      { name: 'keywords', content: '3D photobooth, PhotoSphere FAQ, event photography, photobooth software, free trial' },
      { property: 'og:title', content: 'PhotoSphere FAQ - 3D Photobooth Software Guide' },
      { property: 'og:description', content: 'Learn about PhotoSphere’s 3D photobooth features, pricing, and setup.' },
      { name: 'twitter:card', content: 'summary_large_image' }
    ];

    metaTags.forEach(({ name, property, content }) => {
      const existing = name ? document.querySelector(`meta[name="${name}"]`) : document.querySelector(`meta[property="${property}"]`);
      if (existing) {
        existing.setAttribute(name ? 'content' : 'content', content);
      } else {
        const meta = document.createElement('meta');
        if (name) meta.name = name;
        if (property) meta.setAttribute('property', property);
        meta.content = content;
        document.head.appendChild(meta);
      }
    });

    document.title = 'FAQ - PhotoSphere 3D Photobooth Software';

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [faqData]);

  return (
    <Layout>
      <LandingParticleBackground particleTheme={particleTheme} />
      <div className="relative z-[5]">
        <div className="relative overflow-hidden min-h-[70vh] flex items-center">
          <div
            className="absolute inset-0 w-full h-full z-[10]"
            style={{ pointerEvents: 'auto', touchAction: 'pan-x pan-y' }}
          >
            <HeroScene onThemeChange={handleThemeChange} />
          </div>
          <div className="relative z-[20] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32 pointer-events-none">
            <div className="text-center lg:text-left lg:w-1/2">
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
                    Everything you need to know about PhotoSphere's 3D photobooth platform, from compatibility to pricing.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 pointer-events-auto">
                    <LiquidButton onClick={() => setIsDemoModalOpen(true)}>
                      Request Demo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </LiquidButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

        <div className="relative z-10 py-20 bg-gradient-to-b from-black/10 to-black/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Popular Questions */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  Popular Questions
                </span>
              </h2>
              <div className="space-y-4">
                {popularFAQs.map((item) => (
                  <FAQItem
                    key={item.id}
                    id={item.id}
                    question={item.question}
                    answer={item.answer}
                    icon={item.icon}
                    isOpen={openItems.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </div>
            </div>

            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} onClearSearch={clearSearch} />
            <div className="flex justify-end mb-4">
              <button
                onClick={() => toggleAll(!openItems.size)}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                {openItems.size === faqData.length ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
            <div className="space-y-4 mb-20" id="faq-panel" role="tabpanel">
              {filteredFAQs.map((item) => (
                <FAQItem
                  key={item.id}
                  id={item.id}
                  question={item.question}
                  answer={item.answer}
                  icon={item.icon}
                  isOpen={openItems.has(item.id)}
                  onToggle={() => toggleItem(item.id)}
                />
              ))}
            </div>
            {filteredFAQs.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-purple-500/30">
                  <Search className="w-12 h-12 text-white/70" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">No results found</h3>
                <p className="text-gray-400 mb-6">Try adjusting your search terms or check our popular questions above.</p>
                <LiquidButton onClick={clearSearch}>Clear Filters</LiquidButton>
              </div>
            )}

            <div className="mb-20">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                    Who Can Use PhotoSphere?
                  </span>
                </h2>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  PhotoSphere transforms any event into an interactive experience. From intimate gatherings to massive festivals,
                  here's how different industries and event types benefit from our 3D photo displays.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                <div className="group bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-black/30 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors">Photobooth Business</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Charge premium rates with unique 3D experiences. Perfect add-on service that differentiates your business and increases revenue per event.
                  </p>
                </div>
                <div className="group bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-black/30 hover:border-blue-500/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">Corporate Events</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Conferences, product launches, team building. Add professional branding and create networking experiences that employees remember.
                  </p>
                </div>
                <div className="group bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-black/30 hover:border-green-500/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-600/30 to-emerald-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-green-300 transition-colors">Family Events</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Weddings, reunions, anniversaries. Create magical moments that bring families together and preserve memories in stunning 3D displays.
                  </p>
                </div>
                <div className="group bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-black/30 hover:border-yellow-500/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-600/30 to-orange-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-yellow-300 transition-colors">Birthdays & Parties</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Make any celebration unforgettable. From kids' parties to milestone birthdays, guests love seeing their photos come alive in 3D.
                  </p>
                </div>
                <div className="group bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-black/30 hover:border-red-500/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-600/30 to-pink-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Mic className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-red-300 transition-colors">Bands & Musicians</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Concerts, gigs, album launches. Fans share photos that create stunning visual backdrops, adding energy to your performances.
                  </p>
                </div>
                <div className="group bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-black/30 hover:border-indigo-500/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Headphones className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-indigo-300 transition-colors">DJ/VJ's</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Add visual storytelling to your sets. Create immersive experiences where crowd photos become part of your visual performance.
                  </p>
                </div>
                <div className="group bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-black/30 hover:border-teal-500/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-teal-600/30 to-cyan-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Star className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-teal-300 transition-colors">Entertainers</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Magicians, comedians, performers. Engage your audience with interactive displays that make them part of the show.
                  </p>
                </div>
                <div className="group bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-black/30 hover:border-orange-500/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-600/30 to-red-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-orange-300 transition-colors">Festivals</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Music festivals, art shows, food festivals. Create massive community displays on big screens and projectors for shared experiences.
                  </p>
                </div>
                <div className="group bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-black/30 hover:border-violet-500/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-violet-600/30 to-purple-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Monitor className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-violet-300 transition-colors">Retail & Business</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Store openings, promotions, trade shows. Customer photos with your products create organic marketing and memorable brand experiences.
                  </p>
                </div>
                <div className="group bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-black/30 hover:border-emerald-500/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Settings className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-emerald-300 transition-colors">Event Planners</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Offer clients something unique that sets your events apart. Easy add-on service that increases your value and client satisfaction.
                  </p>
                </div>
                <div className="group bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-black/30 hover:border-rose-500/30 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-rose-600/30 to-pink-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Building className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-rose-300 transition-colors">Venues & Restaurants</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Create unique attractions that bring customers back. Perfect for special events, themed nights, and generating social media buzz.
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Ready to Transform Your Events?</h3>
                  <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                    No matter what type of events you host or what industry you're in, PhotoSphere adapts to your needs.
                    Join thousands of event professionals who've discovered the power of 3D photo experiences.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <LiquidButton variant="primary" onClick={() => setIsDemoModalOpen(true)}>
                      Start Your Free Trial
                    </LiquidButton>
                    <LiquidButton variant="secondary" onClick={() => setIsDemoModalOpen(true)}>
                      See It In Action
                    </LiquidButton>
                  </div>
                  <p className="text-sm text-gray-400 mt-4">14-day free trial • No credit card required • Setup in minutes</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12">
                <div className="max-w-3xl mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-purple-500/30">
                    <Sparkles className="w-10 h-10 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Still Have Questions?</h3>
                  <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                    Can't find what you're looking for? Contact our support team for personalized assistance with your PhotoSphere setup, technical questions,
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
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 bg-purple-600/80 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          aria-label="Back to top"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
      <DemoRequestModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </Layout>
  );
};

export default FAQPage;