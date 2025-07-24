import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Search, Share2, Camera, Zap, Shield, Palette, Monitor, Globe, Settings, Users, Award, Sparkles, ArrowRight, Heart, Mic, Headphones, Star, Calendar, Building } from 'lucide-react';
import Layout from '../components/layout/Layout';
import HeroScene from '../components/three/HeroScene';
import { LandingParticleBackground } from '../components/three/LandingParticleBackground';
import { PARTICLE_THEMES } from '../components/three/MilkyWayParticleSystem';
import DemoRequestModal from '../components/modals/DemoRequestModal';
import ThreeJSCarousel from '../components/three/ThreeJSCarousel'; // Placeholder for 3D FAQ carousel

// FAQ Item Component for 3D Carousel
const FAQItem = ({ question, answer, icon: Icon, id, onShare }) => {
  return (
    <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-6 m-2">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-gradient-to-r from-purple-600/50 to-blue-600/50 rounded-xl border border-purple-500/50">
          <Icon className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          {question}
        </h3>
      </div>
      <div className="text-gray-300 mt-4 leading-relaxed prose prose-invert max-w-none">
        {answer}
      </div>
      <button
        onClick={() => onShare(question)}
        className="mt-4 flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
        aria-label={`Share FAQ: ${question}`}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </button>
    </div>
  );
};

// Search component with voice search
const SearchBar = ({ searchTerm, onSearchChange, onClearSearch }) => {
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onSearchChange(transcript);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="relative max-w-2xl mx-auto mb-12">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-6 w-6 text-gray-400" aria-hidden="true" />
      </div>
      <input
        type="text"
        placeholder="Search or ask FAQ topics..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-12 pr-20 py-4 bg-black/20 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
        aria-label="Search FAQ topics"
      />
      {searchTerm && (
        <button
          onClick={onClearSearch}
          className="absolute inset-y-0 right-10 pr-4 flex items-center text-gray-400 hover:text-white"
          aria-label="Clear search"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <button
        onClick={startVoiceSearch}
        className={`absolute inset-y-0 right-0 pr-4 flex items-center ${isListening ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
        aria-label="Voice search"
      >
        <Mic className="h-5 w-5" />
      </button>
    </div>
  );
};

// Category filter with dynamic background trigger
const CategoryFilter = ({ categories, activeCategory, onCategoryChange, onThemeChange }) => {
  const categoryThemes = {
    all: PARTICLE_THEMES[0],
    general: { colors: ['#a855f7', '#3b82f6'], speed: 0.5 },
    technical: { colors: ['#10b981', '#059669'], speed: 0.3 },
    features: { colors: ['#f59e0b', '#d97706'], speed: 0.7 },
    customization: { colors: ['#ef4444', '#dc2626'], speed: 0.4 },
    professional: { colors: ['#8b5cf6', '#6d28d9'], speed: 0.6 }
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center mb-12" role="tablist">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => {
            onCategoryChange(category.id);
            onThemeChange(categoryThemes[category.id]);
          }}
          className={`
            px-6 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm
            ${activeCategory === category.id
              ? 'bg-gradient-to-r from-purple-600/50 to-blue-600/50 border border-purple-500/60 text-white shadow-lg'
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

// Quiz Widget
const PhotoSphereQuiz = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      question: 'What type of event are you hosting?',
      options: ['Corporate', 'Family', 'Party', 'Festival'],
      key: 'eventType'
    },
    {
      question: 'What’s your goal for the event?',
      options: ['Engage Guests', 'Brand Promotion', 'Memorable Moments', 'Social Media Buzz'],
      key: 'goal'
    }
  ];

  const handleAnswer = (option) => {
    setAnswers({ ...answers, [questions[step].key]: option });
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(answers);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 mb-12">
      <h3 className="text-2xl font-bold text-white mb-4">Find Your Perfect PhotoSphere Features</h3>
      <p className="text-gray-300 mb-6">{questions[step].question}</p>
      <div className="grid grid-cols-2 gap-4">
        {questions[step].options.map((option) => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-300"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

// Liquid glass button
const LiquidButton = ({ children, onClick, variant = 'primary', className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        group relative overflow-hidden px-8 py-4 rounded-2xl font-semibold text-white
        transition-all duration-500 transform hover:scale-105 hover:shadow-2xl
        ${variant === 'primary' 
          ? 'bg-gradient-to-r from-purple-600/50 to-blue-600/50 border border-purple-500/60 hover:from-purple-500/60 hover:to-blue-500/60' 
          : 'bg-white/10 border border-white/20 hover:bg-white/20'
        }
        backdrop-blur-xl ${className}
        focus:outline-none focus:ring-2 focus:ring-purple-500/50
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <span className="relative z-10">{children}</span>
    </button>
  );
};

const FAQPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [particleTheme, setParticleTheme] = useState(PARTICLE_THEMES[0]);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

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
      answer: 'PhotoSphere is a revolutionary 3D photobooth display platform that transforms how event photos are shared and experienced. Unlike traditional photobooths, it creates an immersive 3D environment where photos float, wave, and spiral in real-time.',
      icon: Camera,
      popular: true
    },
    {
      id: 2,
      category: 'general',
      question: 'Is PhotoSphere free photobooth software?',
      answer: 'PhotoSphere offers a 14-day free trial with all Pro features. Our affordable starter plan includes core features like 3D displays, real-time uploads, and basic customization.',
      icon: Award,
      popular: true
    },
    {
      id: 3,
      category: 'technical',
      question: 'Does PhotoSphere work with DSLR cameras?',
      answer: 'Yes! PhotoSphere supports high-quality images from DSLRs, mirrorless cameras, or smartphones, automatically optimized for 3D display.',
      icon: Camera
    },
    {
      id: 4,
      category: 'technical',
      question: 'Can I use PhotoSphere with my existing photobooth equipment?',
      answer: 'Absolutely! PhotoSphere complements your setup, using your cameras and lighting for stunning 3D displays.',
      icon: Settings
    },
    {
      id: 5,
      category: 'features',
      question: 'What’s the best way to display photobooth pictures with PhotoSphere?',
      answer: 'Choose from 3D Floating, Wave Animation, Spiral Display, Orbit Patterns, or Custom Arrangements for stunning photo displays.',
      icon: Monitor
    },
    {
      id: 6,
      category: 'features',
      question: 'Can I add overlays and graphics to photos?',
      answer: 'Yes! Add logo, text, frame, sponsor, or custom graphics with full positioning and layering control.',
      icon: Palette
    },
    {
      id: 7,
      category: 'customization',
      question: 'Can PhotoSphere be fully branded for my business?',
      answer: 'Yes! Customize with logos, brand colors, overlays, themed environments, white-label options, and custom domains.',
      icon: Palette
    },
    {
      id: 8,
      category: 'features',
      question: 'Can I record or export the 3D display?',
      answer: 'Yes! Use PhotoSphere’s built-in screen recording or external tools like OBS Studio to capture 3D displays.',
      icon: Zap
    },
    {
      id: 9,
      category: 'features',
      question: 'How do I prevent inappropriate photos from appearing?',
      answer: 'PhotoSphere offers pre-approval mode, real-time monitoring, quick removal, bulk actions, and activity logs for moderation.',
      icon: Shield
    },
    {
      id: 10,
      category: 'professional',
      question: 'Is PhotoSphere suitable for professional event photographers?',
      answer: 'Yes! Showcase work in real-time, engage clients, and add value with unique 3D presentations.',
      icon: Award
    },
    {
      id: 11,
      category: 'professional',
      question: 'How do I make more money with my photobooth business?',
      answer: 'Charge premium rates for 3D experiences, offer add-ons, partner with venues, and attract corporate clients with PhotoSphere’s “wow factor.”',
      icon: Award,
      popular: true
    }
  ];

  const filteredFAQs = useMemo(() => {
    return faqData.filter(item => {
      const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.answer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const popularFAQs = useMemo(() => faqData.filter(item => item.popular), []);

  const handleThemeChange = useCallback((newTheme) => {
    setParticleTheme(newTheme);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setActiveCategory('all');
  }, []);

  const handleShare = useCallback((question) => {
    const shareText = encodeURIComponent(`Check out this PhotoSphere FAQ: "${question}" #EventTech #PhotoSphere`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://photosphere.com/faq&text=${shareText}`);
  }, []);

  const handleQuizComplete = useCallback((answers) => {
    setQuizResult(answers);
    setActiveCategory(answers.eventType === 'Corporate' ? 'professional' : 'features');
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqData.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": { "@type": "Answer", "text": item.answer }
      }))
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    const metaTags = [
      { name: 'description', content: 'Explore PhotoSphere’s 3D photobooth FAQs: features, pricing, setup, and more.' },
      { name: 'keywords', content: 'PhotoSphere, 3D photobooth, event tech, FAQ, free trial' },
      { property: 'og:title', content: 'PhotoSphere FAQ - Immersive 3D Photobooth Guide' },
      { property: 'og:description', content: 'Discover PhotoSphere’s 3D photobooth features and setup.' },
      { name: 'twitter:card', content: 'summary_large_image' }
    ];
    metaTags.forEach(({ name, property, content }) => {
      const existing = name ? document.querySelector(`meta[name="${name}"]`) : document.querySelector(`meta[property="${property}"]`);
      if (existing) {
        existing.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        if (name) meta.name = name;
        if (property) meta.setAttribute('property', property);
        meta.content = content;
        document.head.appendChild(meta);
      }
    });
    document.title = 'FAQ - PhotoSphere 3D Photobooth';

    return () => document.head.removeChild(script);
  }, [faqData]);

  return (
    <Layout>
      <LandingParticleBackground particleTheme={particleTheme} />
      <div className="relative z-[5]">
        <div className="relative overflow-hidden min-h-[70vh] flex items-center">
          <div className="absolute inset-0 w-full h-full z-[10]" style={{ pointerEvents: 'auto', touchAction: 'pan-x pan-y' }}>
            <HeroScene onThemeChange={handleThemeChange} />
          </div>
          <div className="relative z-[20] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32 pointer-events-none">
            <div className="text-center lg:text-left lg:w-1/2">
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-radial from-black/50 via-black/30 to-transparent opacity-80 blur-xl"></div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-lg">
                    Explore PhotoSphere
                  </span>
                  <span className="block drop-shadow-lg">in 3D</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow-lg">
                  Dive into an immersive FAQ experience that answers your questions about PhotoSphere’s revolutionary 3D photobooth platform.
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4 pointer-events-auto">
                  <LiquidButton onClick={() => setIsDemoModalOpen(true)}>
                    Try the 3D Experience
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </LiquidButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 py-20 bg-gradient-to-b from-black/10 to-black/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <PhotoSphereQuiz onComplete={handleQuizComplete} />
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} onClearSearch={clearSearch} />
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onThemeChange={handleThemeChange}
            />
            <div className="mb-20">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  Popular Questions
                </span>
              </h2>
              <ThreeJSCarousel items={popularFAQs} component={FAQItem} onShare={handleShare} />
            </div>
            <div className="mb-20" id="faq-panel" role="tabpanel">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  All FAQs in 3D
                </span>
              </h2>
              <ThreeJSCarousel items={filteredFAQs} component={FAQItem} onShare={handleShare} />
            </div>
            {filteredFAQs.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-600/50 to-blue-600/50 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-purple-500/50">
                  <Search className="w-12 h-12 text-white/70" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">No results found</h3>
                <p className="text-gray-400 mb-6">Try our quiz above or explore popular questions!</p>
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
                  Transform any event into an unforgettable experience with PhotoSphere’s 3D photo displays.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                <div className="group bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-black/40 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600/50 to-pink-600/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors">Photobooth Business</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Charge premium rates with unique 3D experiences, boosting revenue per event.
                  </p>
                </div>
                {/* Other use cases follow similar pattern, omitted for brevity */}
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Ready to Transform Your Events?</h3>
                  <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                    Join thousands of event pros using PhotoSphere’s 3D photo experiences.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <LiquidButton variant="primary" onClick={() => setIsDemoModalOpen(true)}>
                      Start Your Free Trial
                    </LiquidButton>
                    <LiquidButton variant="secondary" onClick={() => setIsDemoModalOpen(true)}>
                      See It In Action
                    </LiquidButton>
                  </div>
                  <p className="text-sm text-gray-400 mt-4">14-day free trial • No credit card required</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600/50 to-blue-600/50 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-purple-500/50">
                  <Sparkles className="w-10 h-10 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Still Curious?</h3>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                  Contact our team for personalized answers or try our quiz to find your perfect features!
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
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 bg-purple-600/80 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          aria-label="Back to top"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
      <DemoRequestModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </Layout>
  );
};

export default FAQPage;