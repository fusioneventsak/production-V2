import React, { useRef, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// --- Internal Helper Components --- //

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
  const [stockPhotos, setStockPhotos] = useState<string[]>([]);
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

  // Fetch stock photos from Supabase storage bucket
  useEffect(() => {
    const fetchStockPhotos = async () => {
      try {
        // Get photos from the stock_photos storage bucket
        const { data, error } = await supabase
          .storage
          .from('stock_photos')
          .list('', {
            limit: 20,
            sortBy: { column: 'name', order: 'asc' }
          });
        
        if (error) {
          console.error('Error fetching stock photos:', error);
          return;
        }
        
        if (data && data.length > 0) {
          // Convert storage items to public URLs
          const photoUrls = data
            .filter(item => !item.id.endsWith('/')) // Filter out folders
            .map(item => {
              const { data: urlData } = supabase.storage
                .from('stock_photos')
                .getPublicUrl(item.name);
              return urlData.publicUrl;
            });
          
          setStockPhotos(photoUrls);
        }
      } catch (err) {
        console.error('Failed to fetch stock photos:', err);
      }
    };
    
    fetchStockPhotos();
  }, []);

  useEffect(() => {
    const generatePhotos = () => {
      if (stockPhotos.length === 0) return;
      
      // Create evenly distributed photos across the screen width
      const newPhotos = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        // Evenly distribute photos across the width
        x: (i % 5) * (window.innerWidth / 5) + (Math.random() * 50 - 25),
        // Start photos from below the screen
        y: window.innerHeight + (i % 4) * 100,
        // Larger photos with consistent portrait orientation (3:4 aspect ratio)
        size: 160,
        height: 220,
        // Gentle upward movement with slight variation
        speed: 0.3 + Math.random() * 0.2,
        // Keep photos upright with minimal rotation
        rotation: 0, // No rotation to keep photos perfectly upright
        // Very subtle rotation
        rotationSpeed: 0, // No rotation speed to prevent skewing
        // Fully opaque
        opacity: 1,
        // Use stock photos from Supabase only
        src: stockPhotos[i % stockPhotos.length]
      }));
      setPhotos(newPhotos);
    };

    // Only generate photos once we have stock photos
    if (stockPhotos.length > 0) {
      generatePhotos();
      window.addEventListener('resize', generatePhotos);
      return () => window.removeEventListener('resize', generatePhotos);
    }
  }, [stockPhotos]);

  useEffect(() => {
    const animatePhotos = () => {
      setPhotos(prevPhotos => 
        prevPhotos.map(photo => {
          // Gentle vertical movement (floating up)
          let newY = photo.y - photo.speed;
          
          // No horizontal movement to keep photos floating straight up
          let newX = photo.x;
          
          // No rotation to keep photos perfectly upright
          let newRotation = 0;
          
          // Reset when photos go off-screen (cycle them)
          if (newY < -photo.height - 100) {
            newY = window.innerHeight + 100;
            // Maintain even distribution when recycling
            newX = (photo.id % 5) * (window.innerWidth / 5) + (Math.random() * 50 - 25);
            // Keep photos perfectly upright
            newRotation = 0;
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
    
    // Subtle camera rotation effect
    const rotateCamera = () => {
      const container = document.querySelector('.pricing-container');
      if (container) {
        const time = Date.now() * 0.00003; // Slower rotation
        const x = Math.sin(time) * 0.2; // Reduced rotation amount
        const y = Math.cos(time) * 0.2; // Reduced rotation amount
        
        // Apply subtle perspective rotation
        container.style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${x}deg)`;
      }
    };
    
    const cameraInterval = setInterval(rotateCamera, 16);
    
      clearInterval(cameraInterval);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-b from-black to-purple-900/20">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="absolute rounded-lg overflow-hidden shadow-lg transition-transform duration-200"
          style={{
            left: photo.x + 'px',
            top: photo.y + 'px',
            width: photo.size + 'px',
            height: photo.height + 'px',
            opacity: photo.opacity,
            transform: 'rotate(' + photo.rotation + 'deg)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.35)'
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
  const buttonClassName = buttonVariant === 'primary' 
    ? 'w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg hover:shadow-cyan-400/20' 
    : 'w-full py-4 rounded-xl font-semibold text-base transition-all duration-200 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30';

  const displayPrice = price.indexOf('$') === 0 ? price : '$' + price;
  const showPeriod = price !== 'Contact Sales';

  return (
    <div className={isPopular ? 'relative flex flex-col min-w-[300px] max-w-[340px] transition-all duration-300 scale-110 z-20' : 'relative flex flex-col min-w-[300px] max-w-[340px] transition-all duration-300 z-10'}>
      <div className={isPopular ? 'absolute inset-0 rounded-2xl p-[2px] animate-pulse' : 'absolute inset-0 rounded-2xl p-[2px]'}>
        <div className={isPopular ? 'absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600' : 'absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/30 via-blue-500/30 to-purple-600/30'} />
      </div>
      
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
            <span className="text-5xl font-extralight text-white">
              {displayPrice}
            </span>
            {showPeriod && (
              <span className="text-base text-white/70">/mo</span>
            )}
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
    <div className="bg-black text-white min-h-screen w-full overflow-hidden relative pricing-container">
      <FloatingPhotos />
      
      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-6 py-16 pricing-content">
        <div className="w-full max-w-7xl mx-auto text-center mb-20">
          <h1 className="text-6xl md:text-7xl font-extralight leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-300 to-blue-400 mb-8">
            Choose Your PhotoSphere Plan
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto font-light leading-relaxed">
            Create immersive photo experiences for your events. Start free and scale as you grow.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 justify-center items-center lg:items-end w-full max-w-7xl mb-20">
          {samplePlans.map((plan) => (
            <PricingCard key={plan.planName} {...plan} />
          ))}
        </div>
        
        <div className="flex justify-center w-full max-w-7xl mb-20">
          <PricingCard {...oneTimePlan} />
        </div>
        
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

export default App;