import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Camera, Zap, Shield, Palette, Monitor, Globe, Settings, Users, Award, Sparkles, ArrowRight } from 'lucide-react';
import Layout from '../components/layout/Layout';
import DemoRequestModal from '../components/modals/DemoRequestModal';

// Your complete PhotoSphere FAQ data
const faqData = [
  {
    id: 1,
    category: 'general',
    question: 'What is PhotoSphere photobooth software?',
    answer: 'PhotoSphere is a revolutionary 3D photobooth display platform that transforms how event photos are shared and experienced. Unlike traditional photobooths that print or display static images, PhotoSphere creates an immersive 3D environment where uploaded photos float, wave, and spiral in real-time.',
    icon: Camera,
    color: '#ff00dd'
  },
  {
    id: 2,
    category: 'general',
    question: 'Is PhotoSphere free photobooth software?',
    answer: 'PhotoSphere offers various pricing tiers to accommodate different needs. While we don\'t offer a completely free version, we provide a 14-day free trial that includes all Pro features so you can test everything before committing. Our starter plan is extremely affordable and includes all core features like 3D displays, real-time uploads, and basic customization.',
    icon: Award,
    color: '#00ffe1'
  },
  {
    id: 3,
    category: 'technical',
    question: 'Does PhotoSphere work with DSLR cameras?',
    answer: 'Yes! PhotoSphere supports photos from any source, including professional DSLR cameras. You can upload high-quality images in large batches, whether they\'re from DSLRs, mirrorless cameras, or smartphones. The platform automatically optimizes photos for the 3D display while maintaining quality.',
    icon: Camera,
    color: '#ffae00'
  },
  {
    id: 4,
    category: 'technical',
    question: 'Can I use PhotoSphere with my existing photobooth equipment?',
    answer: 'Absolutely! PhotoSphere is designed to complement, not replace, your existing photobooth setup. Use your professional cameras and lighting for capturing high-quality photos, then upload them to PhotoSphere for the stunning 3D display.',
    icon: Settings,
    color: '#9966ff'
  },
  {
    id: 5,
    category: 'features',
    question: 'What\'s the best way to display photobooth pictures with PhotoSphere?',
    answer: 'PhotoSphere offers multiple stunning display options: 3D Floating (photos float gently with realistic physics), Wave Animation (beautiful wave patterns), Spiral Display (dynamic spiral formations), Orbit Patterns (rotation around central points), and Custom Arrangements (design your own layouts).',
    icon: Monitor,
    color: '#00ff88'
  },
  {
    id: 6,
    category: 'features',
    question: 'Can I add overlays and graphics to photos?',
    answer: 'Yes! PhotoSphere supports multiple types of overlays: logo overlays with transparency support, text overlays for event names and hashtags, frame overlays for borders, sponsor graphics, social media elements, and custom graphics for themed events. All overlays can be positioned, resized, and layered.',
    icon: Palette,
    color: '#ff6600'
  },
  {
    id: 7,
    category: 'customization',
    question: 'Can PhotoSphere be fully branded for my business?',
    answer: 'Yes! PhotoSphere offers comprehensive branding options: custom logos with transparency support, brand colors throughout the interface, custom overlays for additional branding elements, themed environments that match your brand aesthetic, white-label options for professional event companies, and custom domain support.',
    icon: Palette,
    color: '#ff0088'
  },
  {
    id: 8,
    category: 'features',
    question: 'Can I record or export the 3D display?',
    answer: 'Yes! PhotoSphere includes a built-in screen recording feature that lets you capture the live 3D display directly from the platform. You can also use external recording software like OBS Studio, Zoom, Loom, or built-in OS tools to create highlight reels and social media content.',
    icon: Zap,
    color: '#4400ff'
  },
  {
    id: 9,
    category: 'features',
    question: 'How do I prevent inappropriate photos from appearing?',
    answer: 'PhotoSphere includes comprehensive moderation tools: pre-approval mode to review all photos before they appear, real-time monitoring to watch uploads as they happen, quick removal to delete inappropriate content instantly, bulk actions to manage multiple photos efficiently, and activity logs to track all moderation actions.',
    icon: Shield,
    color: '#ff4400'
  },
  {
    id: 10,
    category: 'professional',
    question: 'Is PhotoSphere suitable for professional event photographers?',
    answer: 'Absolutely! Many professional photographers use PhotoSphere to showcase work in real-time during events, engage clients with interactive displays, differentiate services with unique 3D presentations, upload batches of professional photos efficiently, and provide added value beyond traditional photography packages.',
    icon: Award,
    color: '#8800ff'
  },
  {
    id: 11,
    category: 'professional', 
    question: 'How do I make more money with my photobooth business?',
    answer: 'PhotoSphere helps photobooth businesses increase revenue in multiple ways: charge premium rates for unique 3D experiences ($200-500+ more per event), offer it as an exclusive add-on service, create recurring revenue with venue partnerships, attract higher-end corporate clients who want cutting-edge technology, and increase booking frequency through social media buzz and word-of-mouth from the "wow factor" of 3D displays.',
    icon: Award,
    color: '#00ddff'
  }
];

// Error Boundary component for better UX
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-8 text-white">
          <h2 className="font-orbitron text-2xl mb-4">Something went wrong</h2>
          <p>Please try refreshing the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const FAQPage: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Add magical card interactions and CSS animations
  useEffect(() => {
    // Add comprehensive magical card CSS
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
      @keyframes magical-glow {
        0% { 
          box-shadow: 0 0 20px var(--card-color, #7b00ff); 
          filter: brightness(1);
        }
        50% { 
          box-shadow: 0 0 30px var(--card-color, #7b00ff), 0 0 40px var(--card-color, #7b00ff); 
          filter: brightness(1.2);
        }
        100% { 
          box-shadow: 0 0 20px var(--card-color, #7b00ff); 
          filter: brightness(1);
        }
      }
      @keyframes ripple-effect {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(4);
          opacity: 0;
        }
      }
      @keyframes magnetic-particle {
        0% {
          transform: translateY(0px) translateX(0px) scale(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
          transform: scale(1);
        }
        90% {
          opacity: 0.8;
        }
        100% {
          transform: translateY(-30px) translateX(15px) scale(0);
          opacity: 0;
        }
      }
      @keyframes edge-shine {
        0% {
          transform: translateX(-100%) skewX(-15deg);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          transform: translateX(100%) skewX(-15deg);
          opacity: 0;
        }
      }
      @keyframes float-particle {
        0%, 100% {
          transform: translateY(0px) translateX(0px);
          opacity: 0.3;
        }
        25% {
          transform: translateY(-20px) translateX(10px);
          opacity: 0.7;
        }
        50% {
          transform: translateY(-40px) translateX(-5px);
          opacity: 0.5;
        }
        75% {
          transform: translateY(-20px) translateX(-10px);
          opacity: 0.8;
        }
      }
      
      .animate-float-1 { animation: float-1 6s ease-in-out infinite; }
      .animate-float-2 { animation: float-2 8s ease-in-out infinite; }
      .animate-float-3 { animation: float-3 7s ease-in-out infinite; }
      
      /* Magical card effects - ALWAYS ON by default */
      .magical-card {
        position: relative;
        overflow: hidden;
        perspective: 1000px;
      }
      
      .magical-card::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: radial-gradient(
          600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
          var(--card-color, #a855f7)15 0%,
          transparent 40%
        );
        opacity: 0.2;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 1;
      }
      
      .magical-card:hover::after {
        opacity: 0.4;
      }
      
      .card-ripple {
        position: absolute;
        border-radius: 50%;
        background: var(--card-color, #a855f7);
        pointer-events: none;
        z-index: 2;
        animation: ripple-effect 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0.8;
      }
      
      .magnetic-particles {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        border-radius: inherit;
        z-index: 1;
      }
      
      .magnetic-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: var(--card-color, #a855f7);
        border-radius: 50%;
        opacity: 0;
        animation: magnetic-particle 3s ease-in-out infinite;
        box-shadow: 0 0 10px var(--card-color, #a855f7);
        filter: blur(1px);
      }
      
      .edge-glow {
        position: absolute;
        inset: -4px;
        border-radius: inherit;
        background: var(--card-color, #a855f7);
        opacity: 0.4;
        filter: blur(15px);
        animation: magical-glow 3s ease-in-out infinite;
        z-index: -1;
      }
      
      .magical-card:hover .edge-glow {
        opacity: 0.6;
        animation: magical-glow 2s ease-in-out infinite;
      }
      
      .card-highlight {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: radial-gradient(
          400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
          rgba(255, 255, 255, 0.2) 0%,
          rgba(255, 255, 255, 0.1) 30%,
          transparent 50%
        );
        opacity: 0.3;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 2;
        mix-blend-mode: overlay;
      }
      
      .magical-card:hover .card-highlight {
        opacity: 0.5;
      }

      .absolute.w-1.h-1 {
        animation: float-particle linear infinite;
      }

      /* Enhanced card animations for magical effects */
      @keyframes floating {
        0% { transform: translateY(0px); }
        100% { transform: translateY(-8px); }
      }

      .card.flipped .rune {
        opacity: 1 !important;
        visibility: visible !important;
      }

      .card.flipped .secret-content {
        opacity: 1 !important;
        visibility: visible !important;
        display: flex !important;
      }

      /* Fix text direction for flipped cards */
      .card-back {
        transform: rotateY(180deg);
      }
      
      .card.flipped .card-back {
        transform: rotateY(0deg);
      }
    `;
    document.head.appendChild(style);
    
    // Add magical card interactions
    const cards = document.querySelectorAll('.magical-card');
    
    const handleMouseMove = (e, card) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
      
      // 3D tilt effect
      const rotateY = -(x - 50) * 0.3;
      const rotateX = (y - 50) * 0.3;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };
    
    const handleMouseLeave = (card) => {
      card.style.transform = '';
      card.style.setProperty('--mouse-x', '50%');
      card.style.setProperty('--mouse-y', '50%');
    };
    
    const handleClick = (e, card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create ripple effect
      const ripple = document.createElement('div');
      ripple.className = 'card-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '0px';
      ripple.style.height = '0px';
      
      card.appendChild(ripple);
      
      // Remove ripple after animation
      setTimeout(() => {
        ripple.remove();
      }, 600);
      
      // Create magnetic particles
      createMagneticParticles(card, x, y);
    };
    
    const createMagneticParticles = (card, x, y) => {
      const container = card.querySelector('.magnetic-particles');
      if (!container) return;
      
      // Create multiple particles for better effect
      for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'magnetic-particle';
        
        const angle = (i / 12) * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance;
        
        particle.style.left = `${particleX}px`;
        particle.style.top = `${particleY}px`;
        particle.style.animationDelay = `${i * 0.05}s`;
        particle.style.animationDuration = `${2 + Math.random()}s`;
        
        // Use card's color
        const cardColor = card.style.getPropertyValue('--card-color') || '#a855f7';
        particle.style.background = cardColor;
        particle.style.boxShadow = `0 0 10px ${cardColor}`;
        
        container.appendChild(particle);
        
        setTimeout(() => {
          if (particle.parentNode) {
            particle.remove();
          }
        }, 3000);
      }
    };
    
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => handleMouseMove(e, card));
      card.addEventListener('mouseleave', () => handleMouseLeave(card));
      card.addEventListener('click', (e) => handleClick(e, card));
    });
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      cards.forEach(card => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
        card.removeEventListener('click', handleClick);
      });
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

  const flipCard = (card: HTMLDivElement, toAnswerSide: boolean) => {
    const cardInner = card.querySelector('.card-inner');
    const cardFront = card.querySelector('.card-front');
    const cardBack = card.querySelector('.card-back');
    const secretContent = card.querySelector('.secret-content');
    const runes = card.querySelectorAll('.rune');

    if (toAnswerSide) {
      card.classList.add('flipped');
      
      if (cardInner) (cardInner as HTMLElement).style.transform = 'rotateY(180deg)';
      if (cardBack) {
        (cardBack as HTMLElement).style.opacity = '1';
        (cardBack as HTMLElement).style.visibility = 'visible';
        (cardBack as HTMLElement).style.zIndex = '3';
        (cardBack as HTMLElement).style.display = 'flex';
      }
      if (cardFront) {
        (cardFront as HTMLElement).style.opacity = '0';
        (cardFront as HTMLElement).style.visibility = 'hidden';
        (cardFront as HTMLElement).style.zIndex = '0';
      }
      
      // Animate runes and content appearing
      setTimeout(() => {
        runes.forEach((rune, index) => {
          setTimeout(() => {
            (rune as HTMLElement).style.opacity = '1';
            (rune as HTMLElement).style.visibility = 'visible';
          }, 50 * index);
        });
        
        if (secretContent) {
          (secretContent as HTMLElement).style.opacity = '1';
          (secretContent as HTMLElement).style.visibility = 'visible';
          (secretContent as HTMLElement).style.display = 'flex';
        }
      }, 300);
    } else {
      card.classList.remove('flipped');
      
      if (cardInner) (cardInner as HTMLElement).style.transform = 'rotateY(0deg)';
      if (cardFront) {
        (cardFront as HTMLElement).style.opacity = '1';
        (cardFront as HTMLElement).style.visibility = 'visible';
        (cardFront as HTMLElement).style.zIndex = '2';
      }
      if (cardBack) {
        (cardBack as HTMLElement).style.opacity = '0';
        (cardBack as HTMLElement).style.visibility = 'hidden';
        (cardBack as HTMLElement).style.zIndex = '1';
        (cardBack as HTMLElement).style.display = 'none';
      }
      if (secretContent) {
        (secretContent as HTMLElement).style.opacity = '0';
        (secretContent as HTMLElement).style.visibility = 'hidden';
        (secretContent as HTMLElement).style.display = 'none';
      }

      // Hide runes
      runes.forEach(rune => {
        (rune as HTMLElement).style.opacity = '0';
        (rune as HTMLElement).style.visibility = 'hidden';
      });
    }
  };

  const addClickEffect = (button: HTMLButtonElement, card: HTMLDivElement) => {
    const ripple = document.createElement('div');
    ripple.className = 'button-ripple';
    button.appendChild(ripple);

    ripple.style.position = 'absolute';
    ripple.style.top = '50%';
    ripple.style.left = '50%';
    ripple.style.width = '150%';
    ripple.style.height = '150%';
    ripple.style.transform = 'translate(-50%, -50%) scale(0)';
    ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    ripple.style.borderRadius = '50%';
    ripple.style.zIndex = '-1';
    ripple.style.animation = 'ripple-effect 0.6s cubic-bezier(0.1, 0.7, 0.3, 1) forwards';

    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <ErrorBoundary>
        <div className="relative min-h-screen bg-gradient-to-b from-[#070b24] to-[#030610] overflow-hidden">
          {/* Enhanced CSS-only background with animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#070b24] via-[#0a0f2e] to-[#030610] animate-pulse"></div>
            
            {/* CSS-only floating particles */}
            <div className="absolute inset-0">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 20}s`,
                    animationDuration: `${15 + Math.random() * 10}s`
                  }}
                />
              ))}
            </div>
            
            {/* Glowing orbs */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-3/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
          </div>
          
          <div className="relative z-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden min-h-[70vh] flex items-center">
              {/* Hero Content */}
              <div className="relative z-[20] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
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
                      
                      <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
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
                {/* Search and Category Filters */}
                <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
                <CategoryFilter 
                  categories={categories} 
                  activeCategory={activeCategory} 
                  onCategoryChange={setActiveCategory} 
                />

                {/* FAQ Cards Grid */}
                <div className="flex justify-center items-center flex-wrap gap-8 p-8 max-w-7xl mx-auto" ref={cardsContainerRef}>
                  {filteredFAQs.map((faq, index) => (
                    <div
                      key={faq.id}
                      className="magical-card relative w-80 h-[450px] bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-all duration-600 cursor-pointer"
                      style={{ '--card-color': faq.color }}
                      ref={(el) => (cardRefs.current[index] = el)}
                      onClick={(e) => {
                        const card = cardRefs.current[index];
                        if (card && !(e.target as HTMLElement).closest('.btn')) {
                          const isFlipped = card.classList.contains('flipped');
                          flipCard(card, !isFlipped);
                        }
                      }}
                    >
                      {/* Magical effects containers */}
                      <div className="magnetic-particles"></div>
                      <div className="edge-glow"></div>
                      <div className="card-highlight"></div>
                      
                      <div className="card-inner relative w-full h-full transition-transform duration-800 transform-style-3d rounded-3xl">
                        {/* Default State - Filled with accent color like the answer state */}
                        <div className="card-front absolute w-full h-full rounded-3xl overflow-hidden flex flex-col justify-center items-center p-6 bg-[linear-gradient(135deg,rgba(0,10,30,0.8)_0%,rgba(0,10,40,0.9)_100%)]">
                          {/* Magical circle */}
                          <div 
                            className="magical-circle absolute w-[220px] h-[220px] rounded-full border-2 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-2 opacity-70 pointer-events-none"
                            style={{ 
                              borderColor: faq.color + '50',
                              boxShadow: `0 0 20px ${faq.color}50, inset 0 0 20px ${faq.color}30`
                            }}
                          />
                          
                          {/* Magical runes with the card's color */}
                          {['✧', '⦿', '⚝', '⚜', '✴', '⚹', '⦾'].map((rune, runeIndex) => (
                            <div 
                              key={runeIndex}
                              className="rune absolute text-xl opacity-60 transition-all duration-500 animate-pulse z-3 pointer-events-none" 
                              style={{ 
                                color: faq.color,
                                top: `${25 + Math.sin(runeIndex * Math.PI * 2 / 7) * 25 + 25}%`,
                                left: `${25 + Math.cos(runeIndex * Math.PI * 2 / 7) * 25 + 25}%`,
                                filter: `drop-shadow(0 0 10px ${faq.color})`
                              }}
                            >
                              {rune}
                            </div>
                          ))}
                          
                          <div className="card-content relative flex flex-col justify-center items-center p-8 h-full text-center z-10">
                            <faq.icon 
                              className="text-4xl mb-4 drop-shadow-lg animate-pulse" 
                              style={{ color: faq.color }}
                            />
                            <h2 className="font-orbitron text-xl font-bold mb-4 text-white text-center leading-tight">
                              {faq.question}
                            </h2>
                            <p className="text-sm leading-relaxed mb-6 text-white/70">
                              Click to reveal the full answer
                            </p>
                            <button
                              className="btn relative inline-block px-6 py-3 text-white border-2 border-white/30 rounded-full font-orbitron text-xs font-semibold uppercase tracking-wide cursor-pointer transition-all duration-300 shadow-lg backdrop-blur-sm hover:scale-105"
                              style={{ 
                                backgroundColor: faq.color + 'B0',
                                boxShadow: `0 0 15px ${faq.color}40`
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const card = cardRefs.current[index];
                                if (card) {
                                  addClickEffect(e.currentTarget, card);
                                  setTimeout(() => flipCard(card, true), 200);
                                }
                              }}
                            >
                              Read Answer
                            </button>
                          </div>
                        </div>
                        
                        {/* Answer State - Full answer content */}
                        <div className="card-back absolute w-full h-full rounded-3xl overflow-hidden flex flex-col justify-center items-center p-6 bg-[linear-gradient(135deg,rgba(0,10,30,0.8)_0%,rgba(0,10,40,0.9)_100%)] z-1">
                          {/* Dimmed magical circle */}
                          <div 
                            className="magical-circle absolute w-[300px] h-[300px] rounded-full border top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-1 opacity-20 pointer-events-none"
                            style={{ 
                              borderColor: faq.color + '30',
                              boxShadow: `0 0 30px ${faq.color}20`
                            }}
                          />
                          
                          {/* Dimmed runes */}
                          {['✧', '⦿', '⚝', '⚜', '✴', '⚹', '⦾'].map((rune, runeIndex) => (
                            <div 
                              key={runeIndex}
                              className="rune absolute text-lg opacity-0 transition-all duration-500 z-2 pointer-events-none" 
                              style={{ 
                                color: faq.color + '60',
                                top: `${15 + Math.sin(runeIndex * Math.PI * 2 / 7) * 35 + 25}%`,
                                left: `${15 + Math.cos(runeIndex * Math.PI * 2 / 7) * 35 + 25}%`,
                                filter: `drop-shadow(0 0 5px ${faq.color}50)`
                              }}
                            >
                              {rune}
                            </div>
                          ))}
                          
                          <div className="secret-content absolute top-1/2 left-1/2 w-[90%] -translate-x-1/2 -translate-y-1/2 opacity-0 invisible transition-all duration-500 flex flex-col items-center justify-center text-center z-5">
                            <faq.icon 
                              className="text-3xl mb-3 drop-shadow-lg" 
                              style={{ color: faq.color }}
                            />
                            <h2 className="font-orbitron text-lg font-bold mb-3 text-white leading-tight">
                              {faq.question}
                            </h2>
                            <p className="text-sm leading-relaxed mb-6 text-white/90 max-h-48 overflow-y-auto">
                              {faq.answer}
                            </p>
                            <button
                              className="btn text-white border-2 border-white/30 px-6 py-2 rounded-full font-orbitron uppercase font-bold text-xs tracking-wide cursor-pointer transition-all duration-300 hover:scale-105"
                              style={{ 
                                backgroundColor: faq.color + 'B0',
                                boxShadow: `0 0 15px ${faq.color}80`
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const card = cardRefs.current[index];
                                if (card) {
                                  addClickEffect(e.currentTarget, card);
                                  setTimeout(() => flipCard(card, false), 200);
                                }
                              }}
                            >
                              Back
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
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
                    <button 
                      onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
                      className="px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30 hover:from-purple-500/40 hover:to-blue-500/40 backdrop-blur-xl transition-all duration-500 transform hover:scale-105"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}

                <footer className="text-center py-8 text-white/70 text-sm w-full z-10">
                  <p>PhotoSphere FAQ - Revolutionary 3D Photobooth Platform</p>
                </footer>
              </div>
            </div>
          </div>
        </div>

        <DemoRequestModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
      </ErrorBoundary>
    </Layout>
  );
};

export default FAQPage;