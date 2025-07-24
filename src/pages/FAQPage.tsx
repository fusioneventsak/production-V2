import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Camera, Zap, Shield, Palette, Monitor, Globe, Settings, Users, Award, Sparkles, ArrowRight } from 'lucide-react';
import Layout from '../components/layout/Layout';
import DemoRequestModal from '../components/modals/DemoRequestModal';

// Fallback theme removed since we're not using particle background

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Camera, Zap, Shield, Palette, Monitor, Globe, Settings, Users, Award, Sparkles, ArrowRight } from 'lucide-react';
import Layout from '../components/layout/Layout';
import DemoRequestModal from '../components/modals/DemoRequestModal';

const faqs = [
  {
    question: 'What is the primary function of this platform?',
    answer: 'Our platform leverages advanced AI to provide seamless, interactive solutions for a wide range of applications, enhancing user experience and productivity.',
    icon: Sparkles,
    color: '#ff00dd'
  },
  {
    question: 'How does the integration process work?',
    answer: 'Integration is streamlined through our API, allowing developers to easily incorporate our technology into existing systems with minimal setup.',
    icon: Globe,
    color: '#00ffe1'
  },
  {
    question: 'What kind of support is available?',
    answer: 'We offer 24/7 support through our dedicated team, comprehensive documentation, and community forums to ensure you get the help you need.',
    icon: Zap,
    color: '#ffae00'
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
      @keyframes gradient-x {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
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
      
      .animate-float-1 { animation: float-1 6s ease-in-out infinite; }
      .animate-float-2 { animation: float-2 8s ease-in-out infinite; }
      .animate-float-3 { animation: float-3 7s ease-in-out infinite; }
      .animate-gradient-x { 
        background-size: 400% 400%;
        animation: gradient-x 8s ease infinite;
      }
      
      /* Magical card effects */
      .magical-card {
        position: relative;
        overflow: visible;
        perspective: 1000px;
      }
      
      .magical-card::before {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: inherit;
        padding: 3px;
        background: linear-gradient(45deg, var(--card-color, #a855f7), transparent, var(--card-color, #a855f7));
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask-composite: xor;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
        filter: blur(2px);
      }
      
      .magical-card:hover::before {
        opacity: 0.8;
        filter: blur(4px);
        animation: edge-shine 2s ease-in-out infinite;
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
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 1;
      }
      
      .magical-card:hover::after {
        opacity: 0.3;
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
        opacity: 0;
        filter: blur(15px);
        transition: opacity 0.3s ease;
        z-index: -1;
      }
      
      .magical-card:hover .edge-glow {
        opacity: 0.4;
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
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 2;
        mix-blend-mode: overlay;
      }
      
      .magical-card:hover .card-highlight {
        opacity: 1;
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

    const handleCardMouseMove = (e: MouseEvent | Touch, card: HTMLDivElement) => {
      if (card.classList.contains('flipped')) return;
      const rect = card.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

      card.style.setProperty('--mouse-x', `${mouseX}%`);
      card.style.setProperty('--mouse-y', `${mouseY}%`);

      const rotateY = -(((e.clientX - rect.left) / rect.width) - 0.5) * 20;
      const rotateX = (((e.clientY - rect.top) / rect.height) - 0.5) * 20;

      const cardInner = card.querySelector('.card-inner');
      if (cardInner) {
        (cardInner as HTMLElement).style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
      }

      const angle = Math.atan2(mouseY - 50, mouseX - 50) * (180 / Math.PI);
      card.style.setProperty('--reflective-angle', `${angle + 90}deg`);

      card.classList.add('active');

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const distanceFromCenter = Math.sqrt(
        Math.pow((e.clientX - rect.left - centerX), 2) +
        Math.pow((e.clientY - rect.top - centerY), 2)
      );

      const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
      const normalizedDistance = Math.min(distanceFromCenter / maxDistance, 1);
      const intensity = 1 - normalizedDistance;

      const cardGlow = card.querySelector('.card-glow');
      if (cardGlow) {
        (cardGlow as HTMLElement).style.opacity = `${0.5 + (intensity * 0.5)}`;
        (cardGlow as HTMLElement).style.background = `radial-gradient(
          circle at ${mouseX}% ${mouseY}%, 
          var(--glow, #7b00ff) 0%, 
          transparent ${50 + (intensity * 30)}%
        )`;
      }

      const edgeGlow = card.querySelector('.edge-glow');
      if (edgeGlow) {
        const edgeDistanceTop = mouseY;
        const edgeDistanceBottom = 100 - mouseY;
        const edgeDistanceLeft = mouseX;
        const edgeDistanceRight = 100 - mouseX;

        const minDistance = Math.min(edgeDistanceTop, edgeDistanceBottom, edgeDistanceLeft, edgeDistanceRight);
        let gradientAngle = 0;
        if (minDistance === edgeDistanceTop) gradientAngle = 0;
        else if (minDistance === edgeDistanceRight) gradientAngle = 90;
        else if (minDistance === edgeDistanceBottom) gradientAngle = 180;
        else if (minDistance === edgeDistanceLeft) gradientAngle = 270;

        const edgeProximityFactor = 1 - (minDistance / 50);
        const brightness = 1 + Math.max(0, edgeProximityFactor) * 0.7;

        (edgeGlow as HTMLElement).style.opacity = `${0.5 + (intensity * 0.5) + Math.max(0, edgeProximityFactor) * 0.3}`;
        (edgeGlow as HTMLElement).style.filter = `blur(${3 + intensity * 3}px) brightness(${brightness})`;
        (edgeGlow as HTMLElement).style.background = `linear-gradient(${gradientAngle}deg, var(--glow, #7b00ff), transparent 70%) border-box`;
      }

      card.style.setProperty('--border-opacity', `${0.7 + intensity * 0.3}`);
      card.style.setProperty('--border-blur', `${4 + intensity * 4}px`);

      const particles = card.querySelectorAll('.magnetic-particle');
      particles.forEach((particle, index) => {
        const particleX = parseFloat((particle as HTMLElement).style.left) || 50;
        const particleY = parseFloat((particle as HTMLElement).style.top) || 50;

        const dirX = mouseX - particleX;
        const dirY = mouseY - particleY;

        const distance = Math.sqrt(dirX * dirX + dirY * dirY);

        const normDirX = dirX / distance;
        const normDirY = dirY / distance;

        const maxPullDistance = 50;
        const pullStrength = Math.max(0, 1 - Math.min(distance / maxPullDistance, 1)) * intensity * 20;

        const newX = particleX + normDirX * pullStrength;
        const newY = particleY + normDirY * pullStrength;

        (particle as HTMLElement).style.transition = `transform 0.3s ease, opacity 0.3s ease`;
        (particle as HTMLElement).style.transform = `translate(${normDirX * pullStrength * 0.5}px, ${normDirY * pullStrength * 0.5}px)`;
        (particle as HTMLElement).style.opacity = `${0.3 + (pullStrength / 20) * 0.7}`;
        (particle as HTMLElement).style.filter = `blur(${1 + (pullStrength / 20) * 2}px) brightness(${1 + (pullStrength / 20) * 0.5})`;
      });
    };

    const resetCardEffects = (card: HTMLDivElement) => {
      if (card.classList.contains('flipped')) return;
      card.classList.remove('active');
      applyFloatingAnimation(card);
    };

    const applyFloatingAnimation = (card: HTMLDivElement) => {
      if (card.classList.contains('flipped')) return;
      // Simple floating animation
      const duration = 5 + Math.random() * 5;
      const delay = Math.random() * 2;
      card.style.animation = `float-${(Math.floor(Math.random() * 3) + 1)} ${duration}s ease-in-out ${delay}s infinite alternate`;
    };

    const createRipple = (e: MouseEvent | Touch, card: HTMLDivElement) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('div');
      ripple.className = 'card-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '0px';
      ripple.style.height = '0px';

      card.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    };

    // Clean up the rest of the original card interaction code for compatibility
    const cards = cardRefs.current;

    cards.forEach((card, index) => {
      if (!card) return;

      const color = faqs[index]?.color || '#7b00ff';
      card.style.setProperty('--card-color', color);

      applyFloatingAnimation(card);

      card.addEventListener('mousemove', (e) => {
        handleCardMouseMove(e, card);
        createRipple(e, card);
      });

      card.addEventListener('mouseleave', () => {
        resetCardEffects(card);
      });

      card.addEventListener('touchmove', (e) => {
        if (card.classList.contains('flipped')) return;
        const touch = e.touches[0];
        handleCardMouseMove(touch, card);
        createRipple(touch, card);
        e.preventDefault();
      });

      card.addEventListener('touchend', () => {
        if (card.classList.contains('flipped')) return;
        resetCardEffects(card);
      });
    });

    return () => {
      cards.forEach(card => {
        if (!card) return;
        card.removeEventListener('mousemove', handleCardMouseMove as any);
        card.removeEventListener('mouseleave', resetCardEffects as any);
        card.removeEventListener('touchmove', handleCardMouseMove as any);
        card.removeEventListener('touchend', resetCardEffects as any);
      });
    };
  }, []); = card.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const normalizedX = mouseX / rect.width;
      const normalizedY = mouseY / rect.height;

      const highlight = card.querySelector('.highlight');
      if (highlight) {
        (highlight as HTMLElement).style.opacity = `${0.2 + Math.abs(normalizedX * normalizedY) * 0.3}`;
        (highlight as HTMLElement).style.background = `radial-gradient(
          circle at ${normalizedX * 100}% ${normalizedY * 100}%,
          rgba(255, 255, 255, 0.8) 0%,
          rgba(255, 255, 255, 0.1) 30%,
          transparent 60%
        )`;
        (highlight as HTMLElement).style.mixBlendMode = 'overlay';
        const reflectionSize = 60 - Math.abs(normalizedX * normalizedY) * 20;
        (highlight as HTMLElement).style.transform = `translate(-50%, -50%) scale(${1 + Math.abs(normalizedX * normalizedY)})`;
      }
    };

    cards.forEach((card, index) => {
      if (!card) return;

      const color = card.getAttribute('data-color') || '#7b00ff';
      const icon = card.querySelector('.icon');
      const frontBtn = card.querySelector('.card-front .btn');
      const runes = card.querySelectorAll('.rune');

      card.style.setProperty('--glow', color);
      if (icon) (icon as HTMLElement).style.setProperty('--icon-color', color);
      if (frontBtn) (frontBtn as HTMLElement).style.setProperty('--btn-color', color);
      runes.forEach(rune => {
        (rune as HTMLElement).style.color = color;
      });

      createMagneticParticles(card, color);
      applyFloatingAnimation(card);

      card.addEventListener('mousemove', (e) => {
        handleCardMouseMove(e, card);
        handleReflectiveTexture(e, card);
        createRipple(e, card);
      });

      card.addEventListener('mouseleave', () => {
        resetCardEffects(card);
      });

      card.addEventListener('touchmove', (e) => {
        if (card.classList.contains('flipped')) return;
        const touch = e.touches[0];
        handleCardMouseMove(touch, card);
        handleReflectiveTexture(touch, card);
        createRipple(touch, card);
        e.preventDefault();
      });

      card.addEventListener('touchend', () => {
        if (card.classList.contains('flipped')) return;
        resetCardEffects(card);
      });
    });

    return () => {
      cards.forEach(card => {
        if (!card) return;
        card.removeEventListener('mousemove', handleCardMouseMove as any);
        card.removeEventListener('mouseleave', resetCardEffects as any);
        card.removeEventListener('touchmove', handleCardMouseMove as any);
        card.removeEventListener('touchend', resetCardEffects as any);
      });
    };
  }, []);

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
    ripple.style.animation = 'button-ripple 0.6s cubic-bezier(0.1, 0.7, 0.3, 1) forwards';

    const pulseBorder = document.createElement('div');
    pulseBorder.className = 'card-pulse';
    card.appendChild(pulseBorder);

    pulseBorder.style.position = 'absolute';
    pulseBorder.style.inset = '-10px';
    pulseBorder.style.borderRadius = '25px';
    pulseBorder.style.boxShadow = `0 0 20px 10px ${card.getAttribute('data-color') || '#7b00ff'}`;
    pulseBorder.style.opacity = '0';
    pulseBorder.style.animation = 'card-pulse-animation 0.8s ease-out forwards';
    pulseBorder.style.zIndex = '0';
    pulseBorder.style.pointerEvents = 'none';

    setTimeout(() => {
      ripple.remove();
      pulseBorder.remove();
    }, 800);
  };

  const flipCard = (card: HTMLDivElement, toBackSide: boolean) => {
    const cardInner = card.querySelector('.card-inner');
    const cardFront = card.querySelector('.card-front');
    const cardBack = card.querySelector('.card-back');
    const secretContent = card.querySelector('.secret-content');

    if (toBackSide) {
      card.style.zIndex = '100';
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
      if (secretContent) {
        setTimeout(() => {
          (secretContent as HTMLElement).style.opacity = '1';
          (secretContent as HTMLElement).style.visibility = 'visible';
          (secretContent as HTMLElement).style.display = 'flex';
        }, 300);
      }
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

      setTimeout(() => {
        card.style.zIndex = '';
      }, 1000);
    }

    card.classList.add('flipping');
    setTimeout(() => {
      card.classList.remove('flipping');
    }, 1000);
  };

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
            <header className="text-center mb-8 px-4">
              <h1 className="font-orbitron text-5xl font-extrabold uppercase tracking-wide bg-gradient-to-r from-[#e6ccff] via-[#7b00ff] to-[#9966ff] bg-clip-text text-transparent drop-shadow-[0_0_5px_rgba(123,0,255,0.4)]">
                Frequently Asked <span className="block text-6xl animate-text-glow">Questions</span>
              </h1>
              <p className="text-lg max-w-2xl mx-auto text-white/80">
                Hover over the cards and click to reveal the answers
              </p>
            </header>

            <div className="flex justify-center items-center flex-wrap gap-12 p-8 max-w-7xl mx-auto perspective-[3000px] transform-style-3d" ref={cardsContainerRef}>
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="magical-card relative w-80 h-[450px] bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-all duration-600 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer overflow-visible"
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
                  
                  <div className="card-inner relative w-full h-full transition-transform duration-800 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] transform-style-3d rounded-3xl">
                    <div className="card-front absolute w-full h-full backface-hidden rounded-3xl overflow-hidden flex flex-col justify-center items-center p-6 box-border z-2">
                      <div className="card-content relative flex flex-col justify-center items-center p-8 h-full text-center z-10 pointer-events-auto">
                        <faq.icon 
                          className="text-5xl mb-6 drop-shadow-[0_0_10px_var(--card-color)] animate-pulse" 
                          style={{ color: faq.color }}
                        />
                        <h2 className="font-orbitron text-2xl mb-4 bg-gradient-to-r from-white to-white bg-clip-text text-white drop-shadow-lg">
                          {faq.question}
                        </h2>
                        <p className="text-base leading-relaxed mb-8 text-white/90">
                          Click to reveal the answer
                        </p>
                        <button
                          className="btn flip-btn relative inline-block px-8 py-3 bg-black/30 text-white border-2 rounded-[30px] font-orbitron text-sm font-semibold uppercase tracking-wide overflow-hidden cursor-pointer transition-all duration-300 shadow-lg backdrop-blur-sm outline-none z-50 hover:scale-105 hover:shadow-xl"
                          style={{ 
                            borderColor: faq.color + '80',
                            boxShadow: `0 0 15px ${faq.color}40`
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const card = cardRefs.current[index];
                            if (card) {
                              addClickEffect(e.currentTarget, card);
                              setTimeout(() => flipCard(card, true), 300);
                            }
                          }}
                        >
                          Discover Answer
                        </button>
                      </div>
                    </div>
                    <div className="card-back absolute w-full h-full backface-hidden rounded-3xl overflow-hidden flex flex-col justify-center items-center p-6 box-border bg-[linear-gradient(135deg,rgba(0,10,30,0.8)_0%,rgba(0,10,40,0.9)_100%)] z-1">
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
                          className="rune absolute text-xl opacity-0 transition-all duration-500 blur-sm drop-shadow-lg animate-pulse z-3 pointer-events-none" 
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
                      
                      <div className="secret-content absolute top-1/2 left-1/2 w-4/5 -translate-x-1/2 -translate-y-1/2 opacity-0 invisible transition-all duration-500 flex flex-col items-center justify-center text-center p-0 z-5 pointer-events-auto">
                        <faq.icon 
                          className="secret-icon text-4xl mb-2 drop-shadow-lg transition-all duration-500" 
                          style={{ color: faq.color }}
                        />
                        <h2 className="secret-title font-orbitron text-2xl font-bold mb-2 text-white bg-gradient-to-r from-white to-white bg-clip-text text-white drop-shadow-lg text-center w-full transition-all duration-500">
                          {faq.question}
                        </h2>
                        <p className="secret-description text-sm leading-relaxed mb-5 text-white/90 text-center w-full max-w-[90%]">
                          {faq.answer}
                        </p>
                        <button
                          className="btn flip-btn text-white border-2 border-white/30 px-6 py-3 rounded-[30px] font-orbitron uppercase font-bold tracking-wide cursor-pointer shadow-lg transition-all duration-300 hover:scale-105"
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
                              setTimeout(() => flipCard(card, false), 300);
                            }
                          }}
                        >
                          Return
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="text-center py-8 text-white/70 text-sm w-full z-10">
              <p>Enhanced FAQ Experience with Magical Glowing Cards</p>
            </footer>
          </div>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Poppins:wght@300;400;600;700&display=swap');

          :root {
            --bg-color: #070b24;
            --text-color: #ffffff;
            --accent-color: #7b00ff;
            --card-bg: rgba(15, 20, 54, 0.7);
            --font-heading: 'Orbitron', sans-serif;
            --font-body: 'Poppins', sans-serif;
            --border-opacity: 0.5;
            --border-blur: 4px;
          }

          .animate-text-glow {
            animation: text-glow 3s ease-in-out infinite alternate;
          }

          @keyframes text-glow {
            0% {
              text-shadow: 0 0 5px rgba(123, 0, 255, 0.3), 0 0 10px rgba(123, 0, 255, 0.2);
            }
            100% {
              text-shadow: 0 0 10px rgba(123, 0, 255, 0.5), 0 0 15px rgba(123, 0, 255, 0.3), 0 0 20px rgba(123, 0, 255, 0.2);
            }
          }

          .card:hover {
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), 0 0 20px var(--glow, rgba(123, 0, 255, 0.5));
            border: 1px solid var(--glow, rgba(123, 0, 255, 0.7));
          }

          .card.flipped .card-inner {
            transform: rotateY(180deg);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), 0 5px 15px var(--glow, rgba(123, 0, 255, 0.6));
          }

          .card.flipped .card-front {
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.4s, visibility 0.4s;
          }

          .card.flipped .card-back {
            opacity: 1;
            visibility: visible;
            z-index: 3;
            transform: rotateY(0deg);
            box-shadow: 0 0 30px var(--glow, rgba(123, 0, 255, 0.5));
          }

          .card.flipped .secret-content {
            opacity: 1;
            visibility: visible;
            transform: translate(-50%, -50%) scale(1);
            transition: opacity 0.5s 0.2s, transform 0.5s 0.2s, visibility 0s;
          }

          .card.flipping {
            z-index: 100;
            box-shadow: 0 0 70px var(--glow, rgba(123, 0, 255, 0.7));
          }

          .card.flipping::before {
            content: '';
            position: absolute;
            inset: -5px;
            z-index: -1;
            border-radius: inherit;
            background: rgba(0, 0, 0, 0);
            box-shadow: 0 0 30px 15px var(--glow, rgba(123, 0, 255, 0.8));
            animation: flip-pulse 1.2s ease-out forwards;
          }

          @keyframes flip-pulse {
            0% {
              box-shadow: 0 0 30px 15px var(--glow, rgba(123, 0, 255, 0.8));
              opacity: 1;
            }
            40% {
              box-shadow: 0 0 60px 30px var(--glow, rgba(123, 0, 255, 0.9));
              opacity: 1;
            }
            100% {
              box-shadow: 0 0 30px 15px var(--glow, rgba(123, 0, 255, 0.8));
              opacity: 0.5;
            }
          }

          .card::after {
            content: '';
            position: absolute;
            inset: -2px;
            border-radius: 22px;
            background: linear-gradient(
              45deg,
              var(--glow, rgba(123, 0, 255, 0.7)) 0%,
              transparent 35%,
              transparent 65%,
              var(--glow, rgba(123, 0, 255, 0.7)) 100%
            );
            z-index: -1;
            filter: blur(var(--border-blur, 4px));
            opacity: var(--border-opacity, 0.5);
            transition: opacity 0.3s ease, filter 0.3s ease;
          }

          .card:hover::after {
            opacity: 0.8;
            filter: blur(6px);
          }

          .card.active::after {
            opacity: 0.9;
            filter: blur(7px);
          }

          .card.active .highlight,
          .card.active .card-glow,
          .card.active .ripple-effect {
            opacity: 1;
          }

          .card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 3px;
            background: linear-gradient(
              135deg,
              var(--glow, #7b00ff) 0%,
              transparent 50%,
              var(--glow, #7b00ff) 100%
            );
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            opacity: var(--border-opacity, 0.8);
            transition: opacity 0.3s ease;
            z-index: 1;
            filter: blur(var(--border-blur, 1px));
            box-shadow: 0 0 15px var(--glow, rgba(123, 0, 255, 0.8));
          }

          .card:hover::before {
            opacity: 1;
            filter: blur(1px) brightness(1.5);
            box-shadow: 0 0 20px var(--glow, rgba(123, 0, 255, 1));
          }

          .card.flipped .rune {
            opacity: 1;
            filter: drop-shadow(0 0 10px var(--glow, rgba(123, 0, 255, 0.8)));
          }

          .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 0;
            height: 100%;
            background: linear-gradient(90deg, var(--glow, rgba(123, 0, 255, 0.8)), var(--glow, rgba(123, 0, 255, 0.6)));
            transition: width 0.4s ease;
            z-index: -1;
            border-radius: 28px;
          }

          .btn:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3), 0 0 20px var(--glow, rgba(123, 0, 255, 0.6));
            border-color: var(--glow, rgba(123, 0, 255, 0.8));
            text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
            letter-spacing: 1.5px;
            animation: btn-hover-pulse 1.2s infinite;
          }

          .btn:hover::before {
            width: 100%;
            animation: btn-hover-shimmer 1.5s infinite;
          }

          @keyframes btn-hover-pulse {
            0% {
              box-shadow: 0 0 20px rgba(0, 0, 0, 0.3), 0 0 20px var(--glow, rgba(123, 0, 255, 0.6));
            }
            50% {
              box-shadow: 0 0 30px rgba(0, 0, 0, 0.3), 0 0 35px var(--glow, rgba(123, 0, 255, 0.9));
            }
            100% {
              box-shadow: 0 0 20px rgba(0, 0, 0, 0.3), 0 0 20px var(--glow, rgba(123, 0, 255, 0.6));
            }
          }

          @keyframes btn-hover-shimmer {
            0% { opacity: 0.6; }
            50% { opacity: 0.9; }
            100% { opacity: 0.6; }
          }

          .btn:active {
            transform: translateY(0) scale(0.95);
            box-shadow: 0 0 30px var(--glow, rgba(123, 0, 255, 0.9));
          }

          @keyframes icon-glow {
            0% { filter: drop-shadow(0 0 10px var(--glow, rgba(123, 0, 255, 0.4))); }
            100% { filter: drop-shadow(0 0 20px var(--glow, rgba(123, 0, 255, 0.8))); }
          }

          @keyframes title-glow {
            0% { filter: drop-shadow(0 0 5px var(--glow, rgba(123, 0, 255, 0.3))); }
            100% { filter: drop-shadow(0 0 15px var(--glow, rgba(123, 0, 255, 0.7))); }
          }

          @keyframes pulse-glow {
            0% { filter: blur(20px) brightness(1); }
            100% { filter: blur(25px) brightness(1.5); }
          }

          @keyframes pulse-edge {
            0% { filter: blur(3px) brightness(1); box-shadow: 0 0 15px 5px var(--glow, rgba(123, 0, 255, 0.4)); }
            50% { filter: blur(4px) brightness(1.5); box-shadow: 0 0 20px 8px var(--glow, rgba(123, 0, 255, 0.7)); }
            100% { filter: blur(3px) brightness(1); box-shadow: 0 0 15px 5px var(--glow, rgba(123, 0, 255, 0.4)); }
          }

          @keyframes glow-rune {
            from { filter: drop-shadow(0 0 5px var(--glow, rgba(123, 0, 255, 0.5))); opacity: 0.7; }
            to { filter: drop-shadow(0 0 10px var(--glow, rgba(123, 0, 255, 0.8))); opacity: 1; }
          }

          @keyframes pulsate {
            0% { opacity: var(--particle-base-opacity, 0.3); filter: blur(1px) brightness(1); box-shadow: 0 0 2px 1px var(--glow, rgba(123, 0, 255, 0.4)); }
            100% { opacity: var(--particle-max-opacity, 0.7); filter: blur(2px) brightness(1.5); box-shadow: 0 0 6px 3px var(--glow, rgba(123, 0, 255, 0.8)); }
          }

          @keyframes floating {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-8px); }
          }

          @keyframes button-ripple {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            80% { opacity: 0.5; }
            100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
          }

          /* CSS Particle Animation */
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
        `}</style>

        <DemoRequestModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
      </ErrorBoundary>
    </Layout>
  );
};

export default FAQPage;