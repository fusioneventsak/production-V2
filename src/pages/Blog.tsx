import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Calendar, User, ArrowRight, Clock, Tag } from 'lucide-react';
import Layout from '../components/layout/Layout';

// Floating particles component for background
const FloatingParticles = () => {
  const particlesRef = useRef();
  const particleCount = 150;
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions in a sphere
      positions[i3] = (Math.random() - 0.5) * 15;
      positions[i3 + 1] = (Math.random() - 0.5) * 15;
      positions[i3 + 2] = (Math.random() - 0.5) * 15;
      
      // Purple/blue color palette
      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        colors[i3] = 0.6; colors[i3 + 1] = 0.3; colors[i3 + 2] = 0.9; // Purple
      } else if (colorChoice < 0.8) {
        colors[i3] = 0.2; colors[i3 + 1] = 0.5; colors[i3 + 2] = 1.0; // Blue
      } else {
        colors[i3] = 0.9; colors[i3 + 1] = 0.4; colors[i3 + 2] = 0.8; // Pink
      }
    }
    
    return { positions, colors };
  }, []);
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
      particlesRef.current.rotation.x += 0.0005;
      
      const time = state.clock.getElapsedTime();
      const positions = particlesRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += Math.sin(time * 0.5 + i) * 0.001;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Blog data
const blogPosts = [
  {
    id: 1,
    title: "The Future of Event Photography: How 3D Photo Collages Are Revolutionizing Memories",
    excerpt: "Discover how PhotoSphere is transforming traditional event photography into immersive 3D experiences that engage guests and create lasting memories.",
    author: "Sarah Johnson",
    date: "2025-07-10",
    readTime: "5 min read",
    category: "Innovation",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop&crop=center",
    featured: true
  },
  {
    id: 2,
    title: "Best Practices for Wedding Photo Collection with PhotoSphere",
    excerpt: "Learn proven strategies for encouraging guest participation and creating stunning wedding photo displays that wow your clients.",
    author: "Michael Chen",
    date: "2025-07-08",
    readTime: "4 min read",
    category: "Weddings",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 3,
    title: "Corporate Events Reimagined: Interactive Photo Walls That Drive Engagement",
    excerpt: "Explore how Fortune 500 companies are using PhotoSphere to create memorable brand experiences at conferences and corporate gatherings.",
    author: "Emily Rodriguez",
    date: "2025-07-05",
    readTime: "6 min read",
    category: "Corporate",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 4,
    title: "Behind the Scenes: The Technology Powering Real-Time 3D Photo Experiences",
    excerpt: "Dive deep into the React Three Fiber and WebGL technologies that make PhotoSphere's seamless real-time photo integration possible.",
    author: "David Kim",
    date: "2025-07-03",
    readTime: "8 min read",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 5,
    title: "Photography Tips: Encouraging Guest Participation at Events",
    excerpt: "Practical advice for event organizers on how to maximize photo uploads and create engaging experiences for all attendees.",
    author: "Lisa Park",
    date: "2025-07-01",
    readTime: "5 min read",
    category: "Tips",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop&crop=center"
  },
  {
    id: 6,
    title: "Case Study: How One Wedding Planner Increased Client Satisfaction by 40%",
    excerpt: "A detailed look at how integrating PhotoSphere into wedding packages led to higher client satisfaction and repeat business.",
    author: "Amanda Thompson",
    date: "2025-06-28",
    readTime: "7 min read",
    category: "Case Study",
    image: "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=800&h=600&fit=crop&crop=center"
  }
];

const categories = ["All", "Innovation", "Weddings", "Corporate", "Technology", "Tips", "Case Study"];

// Blog card component with 3D hover effects
const BlogCard = ({ post, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <article 
      className={`group relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-purple-500/50 ${
        post.featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-8px) rotateX(2deg) rotateY(1deg)' : 'translateY(0) rotateX(0) rotateY(0)',
        perspective: '1000px'
      }}
    >
      {/* Featured badge */}
      {post.featured && (
        <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-purple-600 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          Featured
        </div>
      )}
      
      {/* Image */}
      <div className="relative overflow-hidden h-48 md:h-64">
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Category badge */}
        <div className="absolute top-4 right-4">
          <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-white/20">
            <Tag className="w-3 h-3 inline mr-1" />
            {post.category}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <h3 className={`font-bold text-white mb-3 line-clamp-2 group-hover:text-purple-300 transition-colors ${
          post.featured ? 'text-xl md:text-2xl' : 'text-lg'
        }`}>
          {post.title}
        </h3>
        
        <p className="text-gray-300 mb-4 line-clamp-3">
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
            {new Date(post.date).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {post.readTime}
          </span>
        </div>
        
        {/* Read more button */}
        <button className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium">
          Read More
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
      
      {/* Hover glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 transition-opacity duration-500 pointer-events-none ${
        isHovered ? 'opacity-100' : ''
      }`} />
    </article>
  );
};

// Main blog component
const PhotoSphereBlog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredPosts, setFilteredPosts] = useState(blogPosts);
  
  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredPosts(blogPosts);
    } else {
      setFilteredPosts(blogPosts.filter(post => post.category === selectedCategory));
    }
  }, [selectedCategory]);
  
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          <FloatingParticles />
        </Canvas>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-600 bg-clip-text text-transparent">
              PhotoSphere Blog
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Insights, tips, and stories from the world of interactive event photography
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-500 mx-auto rounded-full"></div>
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
                  className={`px-4 py-2 rounded-full transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <BlogCard key={post.id} post={post} index={index} />
              ))}
            </div>
          </div>
        </section>
        
        {/* Newsletter Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Updated</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Get the latest insights on event photography, 3D technology, and PhotoSphere updates delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                <button className="bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-600 transition-all">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
      </div>
    </Layout>
    </div>
  );
};

export default PhotoSphereBlog;