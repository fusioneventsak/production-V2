import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Camera, Zap, Shield, Palette, Monitor, Globe, Settings, Users, Award, Sparkles, ArrowRight } from 'lucide-react';
import Layout from '../components/layout/Layout';
import HeroScene from '../components/three/HeroScene';
import { LandingParticleBackground } from '../components/three/LandingParticleBackground';
import { PARTICLE_THEMES } from '../components/three/MilkyWayParticleSystem';
import DemoRequestModal from '../components/modals/DemoRequestModal';

// Fallback theme to prevent undefined theme errors
const DEFAULT_THEME = {
  primary: '#7b00ff',
  secondary: '#e6ccff',
  background: '#070b24'
};

const faqs = [
  {
    question: 'What is the primary function of this platform?',
    answer: 'Our platform leverages advanced AI to provide seamless, interactive solutions for a wide range of applications, enhancing user experience and productivity.',
    icon: 'fas fa-magic',
    color: '#ff00dd'
  },
  {
    question: 'How does the integration process work?',
    answer: 'Integration is streamlined through our API, allowing developers to easily incorporate our technology into existing systems with minimal setup.',
    icon: 'fas fa-globe',
    color: '#00ffe1'
  },
  {
    question: 'What kind of support is available?',
    answer: 'We offer 24/7 support through our dedicated team, comprehensive documentation, and community forums to ensure you get the help you need.',
    icon: 'fas fa-fire',
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
  const [theme, setTheme] = useState(PARTICLE_THEMES[0] || DEFAULT_THEME);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    console.log('Current theme:', theme);

    const cards = cardRefs.current;

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
        cardInner.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
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
        cardGlow.style.opacity = `${0.5 + (intensity * 0.5)}`;
        cardGlow.style.background = `radial-gradient(
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

        edgeGlow.style.opacity = `${0.5 + (intensity * 0.5) + Math.max(0, edgeProximityFactor) * 0.3}`;
        edgeGlow.style.filter = `blur(${3 + intensity * 3}px) brightness(${brightness})`;
        edgeGlow.style.background = `linear-gradient(${gradientAngle}deg, var(--glow, #7b00ff), transparent 70%) border-box`;
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

      const cardFront = card.querySelector('.card-front');
      const cardGlow = cardFront?.querySelector('.card-glow');
      const highlight = cardFront?.querySelector('.highlight');
      const magneticParticles = cardFront?.querySelectorAll('.magnetic-particle');
      const cardInner = card.querySelector('.card-inner');
      const edgeGlow = card.querySelector('.edge-glow');

      if (cardInner) cardInner.style.transform = '';
      if (cardGlow) cardGlow.style.opacity = '0';
      if (highlight) highlight.style.opacity = '0';
      if (edgeGlow) {
        edgeGlow.style.opacity = '0.5';
        edgeGlow.style.filter = 'blur(3px) brightness(1)';
        edgeGlow.style.background = 'linear-gradient(135deg, var(--glow, #7b00ff), transparent 70%) border-box';
      }

      magneticParticles?.forEach(particle => {
        (particle as HTMLElement).style.opacity = '0';
        (particle as HTMLElement).style.transform = '';
      });

      card.style.setProperty('--border-opacity', '0.5');
      card.style.setProperty('--border-blur', '4px');
      card.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.5), 0 0 10px var(--glow, rgba(123, 0, 255, 0.3))';
      card.classList.remove('active');

      applyFloatingAnimation(card);
    };

    const applyFloatingAnimation = (card: HTMLDivElement) => {
      if (card.classList.contains('flipped')) return;

      const duration = 5 + Math.random() * 5;
      const delay = Math.random() * 2;
      const translateY = 5 + Math.random() * 8;

      const cardInner = card.querySelector('.card-inner');
      if (cardInner) {
        cardInner.style.animation = `floating ${duration}s ease-in-out ${delay}s infinite alternate`;
      }
    };

    const flipCard = (card: HTMLDivElement, toBackSide: boolean) => {
      const cardInner = card.querySelector('.card-inner');
      const cardFront = card.querySelector('.card-front');
      const cardBack = card.querySelector('.card-back');
      const secretContent = card.querySelector('.secret-content');

      const playFlipSound = () => {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator1 = audioContext.createOscillator();
          const oscillator2 = audioContext.createOscillator();
          const oscillator3 = audioContext.createOscillator();

          oscillator1.type = 'sine';
          oscillator1.frequency.setValueAtTime(480, audioContext.currentTime);
          oscillator1.frequency.exponentialRampToValueAtTime(180, audioContext.currentTime + 0.5);

          oscillator2.type = 'triangle';
          oscillator2.frequency.setValueAtTime(520, audioContext.currentTime);
          oscillator2.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.7);

          oscillator3.type = 'sine';
          oscillator3.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator3.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);

          const gainNode1 = audioContext.createGain();
          const gainNode2 = audioContext.createGain();
          const gainNode3 = audioContext.createGain();

          gainNode1.gain.setValueAtTime(0.04, audioContext.currentTime);
          gainNode2.gain.setValueAtTime(0.02, audioContext.currentTime);
          gainNode3.gain.setValueAtTime(0.015, audioContext.currentTime);

          gainNode1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
          gainNode2.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.7);
          gainNode3.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

          const panner = audioContext.createStereoPanner();
          panner.pan.setValueAtTime(-0.5, audioContext.currentTime);
          panner.pan.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.6);

          oscillator1.connect(gainNode1);
          oscillator2.connect(gainNode2);
          oscillator3.connect(gainNode3);

          gainNode1.connect(panner);
          gainNode2.connect(panner);
          gainNode3.connect(panner);

          panner.connect(audioContext.destination);

          oscillator1.start();
          oscillator2.start(audioContext.currentTime + 0.05);
          oscillator3.start(audioContext.currentTime + 0.1);

          oscillator1.stop(audioContext.currentTime + 0.5);
          oscillator2.stop(audioContext.currentTime + 0.7);
          oscillator3.stop(audioContext.currentTime + 0.3);
        } catch (e) {}
      };

      const animateRunes = (card: HTMLDivElement) => {
        const runes = card.querySelectorAll('.rune');
        const centerX = 50;
        const centerY = 50;
        const radius = 35;

        runes.forEach((rune, index) => {
          const angle = (index / runes.length) * Math.PI * 2;
          const randomRadius = radius - 5 + Math.random() * 10;
          const x = centerX + Math.cos(angle) * randomRadius;
          const y = centerY + Math.sin(angle) * randomRadius;

          (rune as HTMLElement).style.transition = `all ${0.5 + Math.random() * 0.5}s ease-out`;
          (rune as HTMLElement).style.left = `${x}%`;
          (rune as HTMLElement).style.top = `${y}%`;

          const rotation = Math.random() * 360;
          (rune as HTMLElement).style.transform = `rotate(${rotation}deg)`;
        });
      };

      const showSecretContent = (card: HTMLDivElement) => {
        const secretContent = card.querySelector('.secret-content');
        const secretIcon = card.querySelector('.secret-icon');
        const secretTitle = card.querySelector('.secret-title');
        const secretDescription = card.querySelector('.secret-description');
        const secretButton = card.querySelector('.card-back .btn');
        const runes = card.querySelectorAll('.rune');

        if (secretContent) {
          (secretContent as HTMLElement).style.opacity = '1';
          (secretContent as HTMLElement).style.visibility = 'visible';
          (secretContent as HTMLElement).style.display = 'flex';
        }

        if (secretIcon) {
          (secretIcon as HTMLElement).style.opacity = '1';
          (secretIcon as HTMLElement).style.visibility = 'visible';
          (secretIcon as HTMLElement).style.display = 'block';
          (secretIcon as HTMLElement).style.transform = 'scale(1)';
        }

        setTimeout(() => {
          if (secretTitle) {
            (secretTitle as HTMLElement).style.opacity = '1';
            (secretTitle as HTMLElement).style.visibility = 'visible';
            (secretTitle as HTMLElement).style.display = 'block';
            (secretTitle as HTMLElement).style.transform = 'scale(1)';
          }
        }, 150);

        setTimeout(() => {
          if (secretDescription) {
            (secretDescription as HTMLElement).style.opacity = '1';
            (secretDescription as HTMLElement).style.visibility = 'visible';
            (secretDescription as HTMLElement).style.display = 'block';
            (secretDescription as HTMLElement).style.transform = 'translateY(0)';
          }
        }, 300);

        setTimeout(() => {
          if (secretButton) {
            (secretButton as HTMLElement).style.opacity = '1';
            (secretButton as HTMLElement).style.visibility = 'visible';
            (secretButton as HTMLElement).style.display = 'block';
            (secretButton as HTMLElement).style.transform = 'scale(1)';
          }
        }, 450);

        if (runes.length > 0) {
          runes.forEach((rune, index) => {
            setTimeout(() => {
              (rune as HTMLElement).style.opacity = '1';
              (rune as HTMLElement).style.visibility = 'visible';
            }, 100 * index);
          });
        }
      };

      playFlipSound();

      if (toBackSide) {
        card.style.zIndex = '100';
        card.classList.add('flipped');

        if (cardInner) cardInner.style.transform = 'rotateY(180deg)';
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
          (secretContent as HTMLElement).style.opacity = '0';
          (secretContent as HTMLElement).style.visibility = 'hidden';
          (secretContent as HTMLElement).style.display = 'none';
        }

        setTimeout(() => {
          animateRunes(card);
          showSecretContent(card);
        }, 300);
      } else {
        card.classList.remove('flipped');

        if (cardInner) cardInner.style.transform = 'rotateY(0deg)';
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
          applyFloatingAnimation(card);
        }, 1000);
      }

      card.classList.add('flipping');
      setTimeout(() => {
        card.classList.remove('flipping');
      }, 1000);
    };

    const createRipple = (e: MouseEvent | Touch, card: HTMLDivElement) => {
      const rippleContainer = card.querySelector('.ripple-effect');
      const rect = card.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.background = `radial-gradient(circle at center, var(--glow, #7b00ff)40 0%, transparent 70%)`;

      rippleContainer?.appendChild(ripple);

      setTimeout(() => {
        ripple.style.transition = 'all 1s ease';
        ripple.style.transform = 'scale(3)';
        ripple.style.opacity = '0';
        setTimeout(() => {
          ripple.remove();
        }, 1000);
      }, 10);
    };

    const createMagneticParticles = (card: HTMLDivElement, color: string) => {
      const magneticParticles = card.querySelector('.magnetic-particles');
      if (!magneticParticles) return;

      magneticParticles.innerHTML = '';
      const particleCount = 50;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('magnetic-particle');

        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const size = 1 + Math.random() * 4;
        const opacity = 0.1 + Math.random() * 0.3;
        const blur = 1 + Math.random() * 2;

        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = `${opacity}`;
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 ${blur}px ${blur}px ${color}`;
        particle.style.animation = `pulsate ${1 + Math.random() * 2}s infinite alternate`;
        particle.style.animationDelay = `${Math.random() * 2}s`;

        magneticParticles.appendChild(particle);
      }
    };

    const handleReflectiveTexture = (e: MouseEvent | Touch, card: HTMLDivElement) => {
      if (card.classList.contains('flipped')) return;

      const rect = card.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const normalizedX = mouseX / rect.width;
      const normalizedY = mouseY / rect.height;

      const highlight = card.querySelector('.highlight');
      if (highlight) {
        highlight.style.opacity = `${0.2 + Math.abs(normalizedX * normalizedY) * 0.3}`;
        highlight.style.background = `radial-gradient(
          circle at ${normalizedX * 100}% ${normalizedY * 100}%,
          rgba(255, 255, 255, 0.8) 0%,
          rgba(255, 255, 255, 0.1) 30%,
          transparent 60%
        )`;
        highlight.style.mixBlendMode = 'overlay';
        const reflectionSize = 60 - Math.abs(normalizedX * normalizedY) * 20;
        highlight.style.transform = `translate(-50%, -50%) scale(${1 + Math.abs(normalizedX * normalizedY)})`;
      }
    };

    cards.forEach((card, index) => {
      if (!card) return;

      const color = card.getAttribute('data-color') || '#7b00ff';
      const icon = card.querySelector('.icon');
      const frontBtn = card.querySelector('.card-front .btn');
      const runes = card.querySelectorAll('.rune');

      card.style.setProperty('--glow', color);
      if (icon) icon.style.setProperty('--icon-color', color);
      if (frontBtn) frontBtn.style.setProperty('--btn-color', color);
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

  return (
    <Layout>
      <ErrorBoundary>
        <div className="relative min-h-screen bg-gradient-to-b from-[#070b24] to-[#030610] overflow-hidden">
          {theme ? <LandingParticleBackground theme={theme} /> : null}
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
                  className="card relative w-80 h-[450px] bg-[rgba(15,20,54,0.7)] rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.5),0_0_10px_var(--glow,rgba(123,0,255,0.3))] backdrop-blur-md transition-all duration-600 ease-[cubic-bezier(0.23,1,0.32,1)] transform-style-3d z-1 perspective-[1500px] cursor-pointer border border-[rgba(123,0,255,0.3)]"
                  data-color={faq.color}
                  data-card-id={`card-${index + 1}`}
                  ref={(el) => (cardRefs.current[index] = el)}
                  onClick={(e) => {
                    const card = cardRefs.current[index];
                    if (card && !e.target.closest('.btn')) {
                      const isFlipped = card.classList.contains('flipped');
                      flipCard(card, !isFlipped);
                    }
                  }}
                >
                  <div className="card-inner relative w-full h-full transition-transform duration-800 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] transform-style-3d rounded-3xl">
                    <div className="card-front absolute w-full h-full backface-hidden rounded-3xl overflow-hidden flex flex-col justify-center items-center p-6 box-border z-2">
                      <div className="card-glow absolute w-full h-full rounded-3xl z-[-1] opacity-0 bg-[radial-gradient(circle_at_var(--mouse-x,50%)_var(--mouse-y,50%),var(--glow,#7b00ff)_0%,transparent_70%)] blur-5xl transition-opacity duration-300 pointer-events-none animate-[pulse-glow_2s_ease-in-out_infinite_alternate]" />
                      <div className="highlight absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.2)_30%,transparent_70%)] opacity-0 rounded-full pointer-events-none mix-blend-overlay z-1 transition-opacity duration-300 blur-[10px]" />
                      <div className="edge-glow absolute -inset-1.5 rounded-[25px] border-2 border-[var(--glow,#7b00ff)] bg-[linear-gradient(135deg,var(--glow,#7b00ff),transparent_70%)] [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] [mask-composite:exclude] z-0 opacity-50 blur-sm transition-opacity duration-300 animate-[pulse-edge_2s_ease-in-out_infinite] shadow-[0_0_15px_5px_var(--glow,rgba(123,0,255,0.4))]" />
                      <div className="ripple-effect absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-11 opacity-0 transition-opacity duration-300" />
                      <div className="magnetic-particles absolute inset-0 rounded-3xl overflow-hidden z-1 pointer-events-none mix-blend-screen" />
                      <div className="card-content relative flex flex-col justify-center items-center p-8 h-full text-center z-10 pointer-events-auto">
                        <i className={`${faq.icon} text-5xl mb-6 text-[var(--icon-color,var(--glow,#7b00ff))] drop-shadow-[0_0_10px_var(--glow,rgba(123,0,255,0.6))] animate-[icon-glow_2s_ease-in-out_infinite_alternate]`} />
                        <h2 className="font-orbitron text-2xl mb-4 bg-gradient-to-r from-white to-[var(--glow,#7b00ff)] bg-clip-text text-transparent drop-shadow-[0_0_5px_var(--glow,rgba(123,0,255,0.3))] animate-[title-glow_3s_ease-in-out_infinite_alternate]">
                          {faq.question}
                        </h2>
                        <p className="text-base leading-relaxed mb-8 text-white/90">
                          Click to reveal the answer
                        </p>
                        <button
                          className="btn flip-btn relative inline-block px-8 py-3 bg-[rgba(10,10,20,0.6)] text-white border-2 border-[var(--glow,rgba(123,0,255,0.5))] rounded-[30px] font-orbitron text-sm font-semibold uppercase tracking-wide overflow-hidden cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1.2)] shadow-[0_0_15px_rgba(0,0,0,0.3),0_0_10px_var(--glow,rgba(123,0,255,0.3))] backdrop-blur-sm outline-none z-50"
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
                      <div className="magical-circle absolute w-[220px] h-[220px] rounded-full border-2 border-[var(--glow,rgba(123,0,255,0.3))] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-2 shadow-[0_0_20px_var(--glow,rgba(123,0,255,0.3)),inset_0_0_20px_var(--glow,rgba(123,0,255,0.2))] opacity-70 pointer-events-none" />
                      <div className="rune absolute text-xl opacity-0 transition-all duration-500 blur-sm text-[var(--glow,#7b00ff)] drop-shadow-[0_0_10px_var(--glow,rgba(123,0,255,0.6))] animate-[glow-rune_3s_infinite_alternate] z-3 pointer-events-none" style={{ top: '30%', left: '30%' }}>✧</div>
                      <div className="rune absolute text-xl opacity-0 transition-all duration-500 blur-sm text-[var(--glow,#7b00ff)] drop-shadow-[0_0_10px_var(--glow,rgba(123,0,255,0.6))] animate-[glow-rune_3s_infinite_alternate] z-3 pointer-events-none" style={{ top: '25%', left: '70%' }}>⦿</div>
                      <div className="rune absolute text-xl opacity-0 transition-all duration-500 blur-sm text-[var(--glow,#7b00ff)] drop-shadow-[0_0_10px_var(--glow,rgba(123,0,255,0.6))] animate-[glow-rune_3s_infinite_alternate] z-3 pointer-events-none" style={{ top: '70%', left: '35%' }}>⚝</div>
                      <div className="rune absolute text-xl opacity-0 transition-all duration-500 blur-sm text-[var(--glow,#7b00ff)] drop-shadow-[0_0_10px_var(--glow,rgba(123,0,255,0.6))] animate-[glow-rune_3s_infinite_alternate] z-3 pointer-events-none" style={{ top: '65%', left: '75%' }}>⚜</div>
                      <div className="rune absolute text-xl opacity-0 transition-all duration-500 blur-sm text-[var(--glow,#7b00ff)] drop-shadow-[0_0_10px_var(--glow,rgba(123,0,255,0.6))] animate-[glow-rune_3s_infinite_alternate] z-3 pointer-events-none" style={{ top: '50%', left: '85%' }}>✴</div>
                      <div className="rune absolute text-xl opacity-0 transition-all duration-500 blur-sm text-[var(--glow,#7b00ff)] drop-shadow-[0_0_10px_var(--glow,rgba(123,0,255,0.6))] animate-[glow-rune_3s_infinite_alternate] z-3 pointer-events-none" style={{ top: '15%', left: '50%' }}>⚹</div>
                      <div className="rune absolute text-xl opacity-0 transition-all duration-500 blur-sm text-[var(--glow,#7b00ff)] drop-shadow-[0_0_10px_var(--glow,rgba(123,0,255,0.6))] animate-[glow-rune_3s_infinite_alternate] z-3 pointer-events-none" style={{ top: '75%', left: '55%' }}>⦾</div>
                      <div className="secret-content absolute top-1/2 left-1/2 w-4/5 -translate-x-1/2 -translate-y-1/2 opacity-0 invisible transition-all duration-500 flex flex-col items-center justify-center text-center p-0 z-5 pointer-events-auto">
                        <i className={`${faq.icon} secret-icon text-4xl mb-2 text-[var(--glow,#7b00ff)] drop-shadow-[0_0_10px_var(--glow,rgba(123,0,255,0.5))] transition-all duration-500`} />
                        <h2 className="secret-title font-orbitron text-2xl font-bold mb-2 text-white bg-gradient-to-r from-white to-[var(--glow,#7b00ff)] bg-clip-text text-transparent drop-shadow-[0_0_5px_var(--glow,rgba(123,0,255,0.3))] text-center w-full transition-all duration-500">
                          {faq.question}
                        </h2>
                        <p className="secret-description text-sm leading-relaxed mb-5 text-white/90 text-center w-full max-w-[90%]">
                          {faq.answer}
                        </p>
                        <button
                          className="btn flip-btn bg-[var(--glow,rgba(123,0,255,0.7))] text-white border-2 border-[rgba(255,255,255,0.3)] px-6 py-3 rounded-[30px] font-orbitron uppercase font-bold tracking-wide cursor-pointer shadow-[0_0_15px_var(--glow,rgba(123,0,255,0.5))] transition-all duration-300"
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

          .card-back .rune:nth-child(2) { top: 25%; left: 30%; }
          .card-back .rune:nth-child(3) { top: 20%; left: 70%; }
          .card-back .rune:nth-child(4) { top: 75%; left: 35%; }
          .card-back .rune:nth-child(5) { top: 70%; left: 70%; }
          .card-back .rune:nth-child(6) { top: 45%; left: 85%; }
          .card-back .rune:nth-child(7) { top: 15%; left: 50%; }
          .card-back .rune:nth-child(8) { top: 85%; left: 55%; }

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

          .btn.flip-btn:active::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, var(--glow, rgba(123, 0, 255, 0.8)) 0%, transparent 70%);
            transform: translate(-50%, -50%) scale(0);
            border-radius: 50%;
            animation: btn-pulse 0.5s cubic-bezier(0.1, 0.7, 0.3, 1) forwards;
            z-index: -1;
            opacity: 0.6;
          }

          @keyframes btn-pulse {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
            80% { opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
          }

          .card-back .btn:hover {
            transform: scale(1.05) translateY(-3px);
            box-shadow: 0 0 25px var(--glow, rgba(123, 0, 255, 0.8));
            border-color: rgba(255, 255, 255, 0.6);
            animation: back-btn-hover-pulse 1.2s infinite;
          }

          @keyframes back-btn-hover-pulse {
            0% { box-shadow: 0 0 25px var(--glow, rgba(123, 0, 255, 0.8)); }
            50% { box-shadow: 0 0 40px var(--glow, rgba(123, 0, 255, 1)); }
            100% { box-shadow: 0 0 25px var(--glow, rgba(123, 0, 255, 0.8)); }
          }

          .card-back .btn:active {
            transform: scale(0.95);
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

          @keyframes highlight-pulse {
            0% { opacity: 0.6; filter: blur(10px); }
            100% { opacity: 0.9; filter: blur(15px); }
          }

          @keyframes glow-rune {
            from { filter: drop-shadow(0 0 5px var(--glow, rgba(123, 0, 255, 0.5))); opacity: 0.7; }
            to { filter: drop-shadow(0 0 10px var(--glow, rgba(123, 0, 255, 0.8))); opacity: 1; }
          }

          @keyframes rotate {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
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

          @keyframes card-pulse-animation {
            0% { opacity: 0.8; transform: scale(0.95); }
            70% { opacity: 0.2; }
            100% { opacity: 0; transform: scale(1.1); }
          }

          .card[data-color="#00ffe1"] .secret-icon {
            font-size: 3rem;
            color: var(--glow, #00ffe1);
            filter: drop-shadow(0 0 10px var(--glow, rgba(0, 255, 225, 0.7)));
            animation: simple-star-pulse 3s infinite alternate;
          }

          @keyframes simple-star-pulse {
            from { filter: drop-shadow(0 0 5px var(--glow, rgba(0, 255, 225, 0.5))); }
            to { filter: drop-shadow(0 0 15px var(--glow, rgba(0, 255, 225, 0.9))); }
          }

          .btn.flip-btn:hover {
            background: rgba(20, 20, 40, 0.7);
            text-shadow: 0 0 10px rgba(255, 255, 255, 1);
            color: white;
          }

          .btn.flip-btn:hover::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            animation: btn-shine 1.5s infinite;
            border-radius: 30px;
          }

          @keyframes btn-shine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        <DemoRequestModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
      </ErrorBoundary>
    </Layout>
  );
};

export default FAQPage;