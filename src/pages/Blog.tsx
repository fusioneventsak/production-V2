import React, { useState, useEffect } from 'react';
import { Calendar, User, ArrowRight, Clock, Tag, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import BlogScene from '../components/three/BlogScene';

// Blog data
const blogPosts = [
  {
    id: 1,
    title: "How PhotoSphere Helped 3 Photobooth Businesses Double Their Revenue in 6 Months",
    excerpt: "Real case studies from photobooth entrepreneurs who transformed their traditional setups with interactive 3D photo activations, commanding premium prices and securing repeat clients.",
    author: "Arthur Kerekes",
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
    author: "Arthur Kerekes",
    date: "2025-07-12",
    readTime: "6 min read",
    category: "Innovation",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 3,
    title: "5 Pricing Strategies That Let Photobooth Businesses Charge 40% More with Interactive Experiences",
    excerpt: "Learn the exact pricing models successful photobooth operators use to justify premium rates when offering PhotoSphere's immersive 3D photo walls at events.",
    author: "Arthur Kerekes",
    date: "2025-07-10",
    readTime: "7 min read",
    category: "Business Growth",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 4,
    title: "Beyond the Static Backdrop: How Interactive Photo Activations Are Saving the Event Industry",
    excerpt: "Discover why event planners are abandoning traditional photobooths for dynamic, shareable experiences that keep guests engaged throughout entire events.",
    author: "Arthur Kerekes",
    date: "2025-07-08",
    readTime: "5 min read",
    category: "Innovation",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 5,
    title: "The Corporate Event Gold Mine: Why Fortune 500s Pay 300% More for Interactive Photo Experiences",
    excerpt: "Uncover the massive opportunity in corporate photo activations and learn how to position PhotoSphere as an essential brand engagement tool for enterprise clients.",
    author: "Arthur Kerekes",
    date: "2025-07-05",
    readTime: "9 min read",
    category: "Corporate",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 6,
    title: "Stop Losing Clients to Competitors: The Complete Guide to Modernizing Your Photobooth Business",
    excerpt: "A step-by-step roadmap for traditional photobooth operators to integrate cutting-edge photo activation technology without breaking the bank or losing existing customers.",
    author: "Arthur Kerekes",
    date: "2025-07-03",
    readTime: "10 min read",
    category: "Business Growth",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 7,
    title: "Wedding Venues Are Demanding This: How Interactive Photo Walls Became the New Must-Have",
    excerpt: "Learn why wedding venues are requiring interactive photo experiences in vendor packages and how to become their preferred photobooth partner with PhotoSphere.",
    author: "Arthur Kerekes",
    date: "2025-07-01",
    readTime: "6 min read",
    category: "Weddings",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 8,
    title: "From Zero to Viral: The Science Behind Shareable Photo Activations That Drive Event ROI",
    excerpt: "Discover the psychological triggers and design principles that make photo activations go viral on social media, multiplying your clients' event reach organically.",
    author: "Arthur Kerekes",
    date: "2025-06-28",
    readTime: "8 min read",
    category: "Marketing",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 9,
    title: "The Hidden Revenue Stream: How Event Photographers Are Making $50K+ Extra with Photo Activations",
    excerpt: "Event photographers reveal how they're diversifying beyond traditional shoots by offering interactive photo experiences as premium add-on services.",
    author: "Arthur Kerekes",
    date: "2025-06-25",
    readTime: "7 min read",
    category: "Business Growth",
    image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 10,
    title: "Event Tech Predictions 2025: Why Interactive Photo Experiences Will Dominate the Next Decade",
    excerpt: "Industry experts forecast the future of event technology, revealing why photobooth businesses that adopt interactive photo activations now will lead the market by 2030.",
    author: "Arthur Kerekes",
    date: "2025-06-22",
    readTime: "11 min read",
    category: "Innovation",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop&crop=center"
  }
];

const categories = ["All", "Business Growth", "Innovation", "Corporate", "Weddings", "Marketing"];

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
      case 3:
        return "/blog/photobooth-pricing-strategies-premium-rates";
      default:
        return "/blog";
    }
  };
  
  return (
    <Link 
      to={getPostUrl(post.id)}
      className={`group relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 ${
        post.featured ? 'md:col-span-2' : ''
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
            Arthur Kerekes
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
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredPosts, setFilteredPosts] = useState(blogPosts);
  
  // Scroll to top when location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredPosts(blogPosts);
    } else {
      setFilteredPosts(blogPosts.filter(post => post.category === selectedCategory));
    }
  }, [selectedCategory]);
  
  return (
    <Layout>
      <div className="relative w-full min-h-[calc(100vh-160px)] text-white overflow-y-auto">
        {/* 3D Background Scene */}
        <BlogScene />
        
        {/* Content with z-index to appear above background */}
        <div className="relative z-10">
        
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
        </div>
      </div>
    </Layout>
  );
};

export default PhotoSphereBlog;