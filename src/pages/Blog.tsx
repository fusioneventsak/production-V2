import React, { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight, Clock, Tag, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

// Blog data
const blogPosts = [
  {
    id: 1,
    title: "How PhotoSphere Helped 3 Photobooth Businesses Double Their Revenue in 6 Months",
    excerpt: "Real case studies from photobooth entrepreneurs who transformed their traditional setups with interactive 3D photo activations, commanding premium prices and securing repeat clients.",
    author: "Marcus Rivera",
    date: "2025-07-15",
    readTime: "8 min read",
    category: "Business Growth",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&crop=center",
    featured: true
  },
  {
    id: 2,
    title: "The AI Revolution in Photo Activations: What Photobooth Owners Need to Know Now",
    excerpt: "Explore how artificial intelligence is reshaping event photography, from automatic curation to predictive guest engagement - and how to stay ahead of the curve.",
    author: "Dr. Elena Vasquez",
    date: "2025-07-12",
    readTime: "6 min read",
    category: "Innovation",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 3,
    title: "5 Pricing Strategies That Let Photobooth Businesses Charge 40% More with Interactive Experiences",
    excerpt: "Learn the exact pricing models successful photobooth operators use to justify premium rates when offering PhotoSphere's immersive 3D photo walls at events.",
    author: "Jennifer Walsh",
    date: "2025-07-10",
    readTime: "7 min read",
    category: "Business Growth",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 4,
    title: "Beyond the Static Backdrop: How Interactive Photo Activations Are Saving the Event Industry",
    excerpt: "Discover why event planners are abandoning traditional photobooths for dynamic, shareable experiences that keep guests engaged throughout entire events.",
    author: "Alex Thompson",
    date: "2025-07-08",
    readTime: "5 min read",
    category: "Innovation",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 5,
    title: "The Corporate Event Gold Mine: Why Fortune 500s Pay 300% More for Interactive Photo Experiences",
    excerpt: "Uncover the massive opportunity in corporate photo activations and learn how to position PhotoSphere as an essential brand engagement tool for enterprise clients.",
    author: "Robert Chen",
    date: "2025-07-05",
    readTime: "9 min read",
    category: "Corporate",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 6,
    title: "Stop Losing Clients to Competitors: The Complete Guide to Modernizing Your Photobooth Business",
    excerpt: "A step-by-step roadmap for traditional photobooth operators to integrate cutting-edge photo activation technology without breaking the bank or losing existing customers.",
    author: "Sarah Martinez",
    date: "2025-07-03",
    readTime: "10 min read",
    category: "Business Growth",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 7,
    title: "Wedding Venues Are Demanding This: How Interactive Photo Walls Became the New Must-Have",
    excerpt: "Learn why wedding venues are requiring interactive photo experiences in vendor packages and how to become their preferred photobooth partner with PhotoSphere.",
    author: "Diana Foster",
    date: "2025-07-01",
    readTime: "6 min read",
    category: "Weddings",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 8,
    title: "From Zero to Viral: The Science Behind Shareable Photo Activations That Drive Event ROI",
    excerpt: "Discover the psychological triggers and design principles that make photo activations go viral on social media, multiplying your clients' event reach organically.",
    author: "Mark Rodriguez",
    date: "2025-06-28",
    readTime: "8 min read",
    category: "Marketing",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 9,
    title: "The Hidden Revenue Stream: How Event Photographers Are Making $50K+ Extra with Photo Activations",
    excerpt: "Event photographers reveal how they're diversifying beyond traditional shoots by offering interactive photo experiences as premium add-on services.",
    author: "Carlos Delgado",
    date: "2025-06-25",
    readTime: "7 min read",
    category: "Business Growth",
    image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 10,
    title: "Event Tech Predictions 2025: Why Interactive Photo Experiences Will Dominate the Next Decade",
    excerpt: "Industry experts forecast the future of event technology, revealing why photobooth businesses that adopt interactive photo activations now will lead the market by 2030.",
    author: "Dr. Lisa Chang",
    date: "2025-06-22",
    readTime: "11 min read",
    category: "Innovation",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop&crop=center"
  }
];

const categories = ["All", "Business Growth", "Innovation", "Corporate", "Weddings", "Marketing"];

// Animated background component with CSS
const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900"></div>
      
      {/* Floating orbs */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-10 animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 200 + 50}px`,
            height: `${Math.random() * 200 + 50}px`,
            background: `radial-gradient(circle, ${
              Math.random() > 0.5 ? '#8b5cf6' : '#3b82f6'
            } 0%, transparent 70%)`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 10 + 10}s`
          }}
        />
      ))}
      
      {/* Moving particles */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 20 + 10}s infinite linear`,
              animationDelay: `${Math.random() * 10}s`
            }}
          />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(100vh) translateX(0px); }
          100% { transform: translateY(-100px) translateX(${Math.random() * 200 - 100}px); }
        }
      `}</style>
    </div>
  );
};

// Blog card component with 3D hover effects
const BlogCard = ({ post, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Generate URL based on post ID
  const getPostUrl = (postId) => {
    switch(postId) {
      case 1:
        return "/blog/photobooth-businesses-double-revenue-photosphere-case-study";
      case 2:
        return "/blog/ai-revolution-photo-activations-photobooth-software-future";
      default:
        return "/blog";
    }
  };
  
  return (
    <Link
      to={getPostUrl(post.id)}
      className={`group relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 ${
        post.featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-8px) perspective(1000px) rotateX(5deg) rotateY(2deg)' : 'translateY(0) rotateX(0) rotateY(0)',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Featured badge */}
      {post.featured && (
        <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-purple-600 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          Featured
        </div>
      )}
      
      {/* Image */}
      <div className={`relative overflow-hidden ${post.featured ? 'h-64 md:h-80' : 'h-48'}`}>
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Category badge */}
        <div className="absolute top-4 right-4">
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {post.category}
          </span>
        </div>
        
        {/* Hover overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`} />
      </div>
      
      {/* Content */}
      <div className="p-6">
        <h3 className={`font-bold text-white mb-3 leading-tight group-hover:text-purple-300 transition-colors duration-300 ${
          post.featured ? 'text-xl md:text-2xl' : 'text-lg'
        }`}>
          {post.title}
        </h3>
        
        <p className={`text-gray-300 mb-4 leading-relaxed ${
          post.featured ? 'text-base' : 'text-sm'
        }`}>
          {post.excerpt}
        </p>
        
        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {post.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(post.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {post.readTime}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all duration-300 font-medium group/btn">
          Read More
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </div>
      </div>
      
      {/* Hover glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 transition-opacity duration-500 pointer-events-none ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} />
    </Link>
  );
};

// Main blog component
const PhotoSphereBlog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredPosts, setFilteredPosts] = useState(blogPosts);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredPosts(blogPosts);
    } else {
      setFilteredPosts(blogPosts.filter(post => post.category === selectedCategory));
    }
  }, [selectedCategory]);
  
  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-black/30 backdrop-blur-md border-b border-gray-700/30 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold">PS</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  PhotoSphere
                </span>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-8">
                <a href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Home</a>
                <a href="/features" className="text-gray-300 hover:text-white transition-colors duration-300">Features</a>
                <a href="/pricing" className="text-gray-300 hover:text-white transition-colors duration-300">Pricing</a>
                <a href="/blog" className="text-purple-400 font-medium">Blog</a>
                <button className="bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
                  Get Started
                </button>
              </nav>
              
              {/* Mobile menu button */}
              <button 
                className="md:hidden p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
            
            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-gray-700/30">
                <div className="flex flex-col space-y-4">
                  <a href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Home</a>
                  <a href="/features" className="text-gray-300 hover:text-white transition-colors duration-300">Features</a>
                  <a href="/pricing" className="text-gray-300 hover:text-white transition-colors duration-300">Pricing</a>
                  <a href="/blog" className="text-purple-400 font-medium">Blog</a>
                  <button className="bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-600 transition-all duration-300 shadow-lg text-left">
                    Get Started
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
        
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-600 bg-clip-text text-transparent leading-tight">
                PhotoSphere Blog
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-500 mx-auto rounded-full mb-6"></div>
            </div>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Insights, tips, and stories from the world of interactive event photography
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <span className="bg-gray-800/50 px-3 py-1 rounded-full">Latest Updates</span>
              <span className="bg-gray-800/50 px-3 py-1 rounded-full">Industry Insights</span>
              <span className="bg-gray-800/50 px-3 py-1 rounded-full">Technical Guides</span>
            </div>
          </div>
        </section>
        
        {/* Category Filter */}
        <section className="px-4 sm:px-6 lg:px-8 mb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full transition-all duration-300 font-medium ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white border border-gray-600/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>
        
        {/* Blog Grid */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
              {filteredPosts.map((post, index) => (
                <BlogCard key={post.id} post={post} index={index} />
              ))}
            </div>
          </div>
        </section>
        
        {/* Newsletter Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-12 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Stay Updated
              </h2>
              <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                Get the latest insights on event photography, 3D technology, and PhotoSphere updates delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                />
                <button className="bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="bg-black/60 backdrop-blur-sm border-t border-gray-700/50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-lg font-bold">PS</span>
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    PhotoSphere
                  </span>
                </div>
                <p className="text-gray-400 leading-relaxed">
                  Transforming event photography with immersive 3D experiences that create lasting memories.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold mb-4 text-white">Product</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-purple-400 transition-colors duration-300">Features</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors duration-300">Pricing</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors duration-300">API</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors duration-300">Integrations</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold mb-4 text-white">Resources</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-purple-400 transition-colors duration-300">Documentation</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors duration-300">Tutorials</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors duration-300">Support</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors duration-300">Community</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold mb-4 text-white">Company</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-purple-400 transition-colors duration-300">About</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors duration-300">Contact</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors duration-300">Privacy</a></li>
                  <li><a href="#" className="hover:text-purple-400 transition-colors duration-300">Terms</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-700/50 pt-8 text-center text-gray-400">
              <p>&copy; 2025 PhotoSphere. All rights reserved. Built with ❤️ for the event community.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PhotoSphereBlog;