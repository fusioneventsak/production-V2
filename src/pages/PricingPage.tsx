import React, { useRef, useEffect, useState } from 'react';

// --- Internal Helper Components (Not exported) --- //

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Simple button component to replace RippleButton
const Button = ({ children, className, ...props }: any) => (
  <button className={className} {...props}>
    {children}
  </button>
);

// Floating Photos Background Component
const FloatingPhotos = () => {
  const [photos, setPhotos] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    height: number;
    speed: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    src: string;
  }>>([]);

  // Sample photo URLs - you can replace these with your own
  const photoUrls = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1494790108755-2616b332c9ae?w=150&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=200&fit=crop&crop=face",
  ];

  useEffect(() => {
    const generatePhotos = () => {
      const newPhotos = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + Math.random() * 200,
        size: 60 + Math.random() * 50,
        height: 80 + Math.random() * 70,
        speed: 0.3 + Math.random() * 0.7,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        opacity: 0.3 + Math.random() * 0.4,
        src: photoUrls[i % photoUrls.length]
      }));
      setPhotos(newPhotos);
    };

    generatePhotos();
    window.addEventListener('resize', generatePhotos);
    return () => window.removeEventListener('resize', generatePhotos);
  }, []);

  useEffect(() => {
    const animatePhotos = () => {
      setPhotos(prevPhotos => 
        prevPhotos.map(photo => {
          let newY = photo.y - photo.speed;
          let newX = photo.x + Math.sin(Date.now() * 0.001 + photo.id) * 0.5;
          let newRotation = photo.rotation + photo.rotationSpeed;
          
          if (newY < -photo.height - 100) {
            newY = window.innerHeight + 100;
            newX = Math.random() * window.innerWidth;
          }
          
          return {
            ...photo,
            x: newX,
            y: newY,
            rotation: newRotation
          };
        })
      );
    };

    const interval = setInterval(animatePhotos, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="absolute rounded-lg overflow-hidden shadow-lg transition-transform duration-75"
          style={{
            left: `${photo.x}px`,
            top: `${photo.y}px`,
            width: `${photo.size}px`,
            height: `${photo.height}px`,
            opacity: photo.opacity,
            transform: `rotate(${photo.rotation}deg)`,
          }}
        >
          <img
            src={photo.src}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

// --- EXPORTED Building Blocks --- //

export interface PricingCardProps {
  planName: string;
  description: string;
  price: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
  buttonVariant?: 'primary' | 'secondary';
}

export const PricingCard = ({
  planName, description, price, features, buttonText, isPopular = false, buttonVariant = 'primary'
}: PricingCardProps) => {
  return (
    <div className={`relative flex flex-col min-w-[300px] max-w-[340px] transition-all duration-300 ${isPopular ? 'scale-110 z-20' : 'z-10'}`}>
      {/* Neon border wrapper */}
      <div className={`absolute inset-0 rounded-2xl p-[2px] ${isPopular ? 'animate-pulse' : ''}`}>
        <div className={`absolute inset-0 rounded-2xl ${isPopular ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600' : 'bg-gradient-to-r from-cyan-400/30 via-blue-500/30 to-purple-600/30'}`} />
      </div>
      
      {/* Card content */}
      <div className="relative bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 p-8 flex flex-col h-full shadow-2xl">
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg z-30">
            🚀 Most Popular
          </div>
        )}
        
        <div className="text-center mb-6">
          <h2 className="text-5xl font-extralight tracking-tight text-white leading-none mb-3">{planName}</h2>
          <p className="text-lg text-white/80 font-sans">{description}</p>
        </div>
        
        <div className="text-center mb-8">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-extralight text-white">{price.startsWith('

// Demo with sample data
const App = () => {
  const samplePlans: PricingCardProps[] = [
    {
      planName: "Starter",
      description: "Perfect for small events",
      price: "45",
      features: [
        "5 PhotoSpheres",
        "Virtual PhotoBooth",
        "PhotoSphere Display", 
        "Moderation tools",
        "Up to 500 photos displayed"
      ],
      buttonText: "Get Started",
      buttonVariant: "secondary"
    },
    {
      planName: "Pro",
      description: "Best for growing businesses",
      price: "99",
      features: [
        "Everything in Starter",
        "Advanced camera animations",
        "Built-in video recording",
        "20 PhotoSpheres",
        "Priority support"
      ],
      buttonText: "Start Free Trial",
      isPopular: true
    },
    {
      planName: "Enterprise",
      description: "For large organizations",
      price: "Contact Sales",
      features: [
        "Everything in Pro",
        "White label on your domain",
        "Dedicated Account Manager",
        "Custom training sessions",
        "24/7 premium support"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "secondary"
    }
  ];

  const oneTimePlan: PricingCardProps = {
    planName: "One-Time",
    description: "Perfect for single events",
    price: "499",
    features: [
      "PhotoSphere lasts 30 days post-event",
      "Up to 500 photos displayed",
      "Virtual PhotoBooth included",
      "Basic moderation tools",
      "Single event license"
    ],
    buttonText: "Book Event",
    buttonVariant: "secondary"
  };

  return (
    <div className="bg-black text-white min-h-screen w-full overflow-hidden relative">
      <FloatingPhotos />
      
      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-6 py-16">
        {/* Header Section */}
        <div className="w-full max-w-7xl mx-auto text-center mb-20">
          <h1 className="text-6xl md:text-7xl font-extralight leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-300 to-blue-400 mb-8">
            Choose Your PhotoSphere Plan
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto font-light leading-relaxed">
            Create immersive photo experiences for your events. Start free and scale as you grow.
          </p>
        </div>
        
        {/* Main Pricing Cards */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 justify-center items-center lg:items-end w-full max-w-7xl mb-20">
          {samplePlans.map((plan) => (
            <PricingCard key={plan.planName} {...plan} />
          ))}
        </div>
        
        {/* One-Time Plan */}
        <div className="flex justify-center w-full max-w-7xl mb-20">
          <PricingCard {...oneTimePlan} />
        </div>
        
        {/* Features Section */}
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-white/70 mb-16">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-400/20 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-semibold mb-4">Secure & Private</h3>
              <p className="text-base leading-relaxed">Your photos are encrypted and stored securely with enterprise-grade security.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-400/20 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-semibold mb-4">Real-time Updates</h3>
              <p className="text-base leading-relaxed">See photos appear instantly as guests upload them during your event.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-400/20 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-semibold mb-4">Easy Setup</h3>
              <p className="text-base leading-relaxed">Get started in minutes with our intuitive setup process and QR code sharing.</p>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h3 className="text-white text-2xl font-semibold mb-4">Need a custom solution?</h3>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">We offer tailored packages for large events, multiple locations, and enterprise deployments.</p>
            <Button className="px-8 py-4 bg-cyan-400 hover:bg-cyan-300 text-black rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-cyan-400/20">
              Contact Our Team
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;) ? price : `${price}`}</span>
            {price !== 'Contact Sales' && <span className="text-base text-white/70">/mo</span>}
          </div>
        </div>
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>
        
        <ul className="flex flex-col gap-4 text-base text-white/90 mb-8 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckIcon className="text-cyan-400 w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        const buttonClassName = buttonVariant === 'primary' 
          ? 'w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg hover:shadow-cyan-400/20' 
          : 'w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30';
        
        <Button className={buttonClassName}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

// Demo with sample data
const App = () => {
  const samplePlans: PricingCardProps[] = [
    {
      planName: "Starter",
      description: "Perfect for small events",
      price: "45",
      features: [
        "5 PhotoSpheres",
        "Virtual PhotoBooth",
        "PhotoSphere Display", 
        "Moderation tools",
        "Up to 500 photos displayed"
      ],
      buttonText: "Get Started",
      buttonVariant: "secondary"
    },
    {
      planName: "Pro",
      description: "Best for growing businesses",
      price: "99",
      features: [
        "Everything in Starter",
        "Advanced camera animations",
        "Built-in video recording",
        "20 PhotoSpheres",
        "Priority support"
      ],
      buttonText: "Start Free Trial",
      isPopular: true
    },
    {
      planName: "Enterprise",
      description: "For large organizations",
      price: "Contact Sales",
      features: [
        "Everything in Pro",
        "White label on your domain",
        "Dedicated Account Manager",
        "Custom training sessions",
        "24/7 premium support"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "secondary"
    }
  ];

  const oneTimePlan: PricingCardProps = {
    planName: "One-Time",
    description: "Perfect for single events",
    price: "499",
    features: [
      "PhotoSphere lasts 30 days post-event",
      "Up to 500 photos displayed",
      "Virtual PhotoBooth included",
      "Basic moderation tools",
      "Single event license"
    ],
    buttonText: "Book Event",
    buttonVariant: "secondary"
  };

  return (
    <div className="bg-black text-white min-h-screen w-full overflow-hidden">
      <FloatingPhotos />
      
      <main className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-6xl mx-auto text-center mb-16">
          <h1 className="text-[56px] md:text-[72px] font-extralight leading-tight tracking-[-0.03em] bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-300 to-blue-400 mb-6">
            Choose Your PhotoSphere Plan
          </h1>
          <p className="mt-4 text-[18px] md:text-[22px] text-white/80 max-w-3xl mx-auto font-sans leading-relaxed">
            Create immersive photo experiences for your events. Start free and scale as you grow.
          </p>
        </div>
        
        <div className="flex flex-row gap-8 justify-center items-end w-full max-w-6xl mb-12">
          {samplePlans.map((plan) => <PricingCard key={plan.planName} {...plan} />)}
        </div>
        
        <div className="flex justify-center w-full max-w-6xl mb-12">
          <div className="max-w-[320px]">
            <PricingCard {...oneTimePlan} />
          </div>
        </div>
        
        <div className="mt-16 max-w-4xl mx-auto text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white/70">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm">Your photos are encrypted and stored securely with enterprise-grade security.</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Real-time Updates</h3>
              <p className="text-sm">See photos appear instantly as guests upload them during your event.</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-cyan-400/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Easy Setup</h3>
              <p className="text-sm">Get started in minutes with our intuitive setup process and QR code sharing.</p>
            </div>
          </div>
          
          <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <h3 className="text-white text-lg font-semibold mb-2">Need a custom solution?</h3>
            <p className="text-white/70 mb-4">We offer tailored packages for large events, multiple locations, and enterprise deployments.</p>
            <Button className="px-6 py-2 bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg font-semibold transition">
              Contact Our Team
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;