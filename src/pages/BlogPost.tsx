import React from 'react';
import { Link } from 'react-router-dom'; 
import { ArrowLeft, ArrowRight, Calendar, Clock, User, Tag, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import Layout from '../components/layout/Layout';

const BlogPost: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        {/* Hero Section with Featured Image */}
        <div className="relative h-96 md:h-[500px] overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop&crop=center" 
            alt="Interactive photobooth experience with people enjoying a 3D photo display" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
              <Link to="/blog" className="inline-flex items-center text-gray-300 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
                How PhotoSphere Helped 3 Photobooth Businesses Double Their Revenue in 6 Months
              </h1>
              
              <div className="flex flex-wrap items-center text-sm text-gray-300 gap-4 md:gap-6">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Arthur Kerekes
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  July 15, 2025
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  8 min read
                </div>
                <div className="flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  Business Growth
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Introduction */}
          <div className="prose prose-lg prose-invert max-w-none mb-12">
            <p className="text-xl text-gray-300 leading-relaxed">
              The photobooth industry is experiencing a revolution. Traditional backdrop setups are being replaced by interactive photobooth software that creates immersive photo gallery experiences for events. Three photobooth business owners share how PhotoSphere's virtual photobooth technology helped them double their revenue in just six months.
            </p>
          </div>
          
          {/* Case Study 1 */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Case Study 1: Elite Events Photo - From Traditional to Interactive
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="md:col-span-2">
                <p className="text-gray-300 mb-6">
                  Elite Events Photo, a Dallas-based photobooth rental company, struggled with declining bookings as clients demanded more engaging experiences. After implementing PhotoSphere's interactive photobooth software, they saw immediate results:
                </p>
                
                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                  <li>65% increase in event bookings within 3 months</li>
                  <li>Average booking price increased from $800 to $1,400</li>
                  <li>Client retention rate improved by 85%</li>
                </ul>
                
                <p className="text-gray-300">
                  The key was offering real-time photo gallery for events that allowed guests to see their photos instantly in stunning 3D displays.
                </p>
              </div>
              
              <div className="md:col-span-1">
                <img 
                  src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop&crop=center" 
                  alt="Event guests enjoying an interactive photobooth" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <p className="text-sm text-gray-400 mt-2 italic">
                  Guests interacting with a PhotoSphere display at a corporate event
                </p>
              </div>
            </div>
            
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6 mb-8">
              <blockquote className="text-xl text-gray-200 italic">
                "We were losing clients to competitors with flashier offerings. PhotoSphere allowed us to completely transform our business model. Now we're not just taking photos—we're creating immersive experiences that guests talk about long after the event."
              </blockquote>
              <p className="text-right text-gray-400 mt-4">— Jamie Cortez, Owner of Elite Events Photo</p>
            </div>
          </div>
          
          {/* Case Study 2 */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Case Study 2: Metro Memories - Scaling with Virtual Photobooth Technology
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="md:col-span-1 order-2 md:order-1">
                <img 
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&h=400&fit=crop&crop=center" 
                  alt="Group of friends taking photos at an event" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <p className="text-sm text-gray-400 mt-2 italic">
                  Metro Memories now serves multiple events simultaneously
                </p>
              </div>
              
              <div className="md:col-span-2 order-1 md:order-2">
                <p className="text-gray-300 mb-6">
                  Metro Memories in Chicago leveraged PhotoSphere's virtual photobooth capabilities to serve multiple events simultaneously without additional hardware costs:
                </p>
                
                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                  <li>Reduced equipment costs by 40%</li>
                  <li>Increased capacity from 2 to 8 events per weekend</li>
                  <li>Generated $120,000 additional revenue in 6 months</li>
                </ul>
                
                <p className="text-gray-300">
                  Their secret? Using cloud-based photobooth software that required minimal on-site setup while delivering maximum impact.
                </p>
              </div>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
              <blockquote className="text-xl text-gray-200 italic">
                "The scalability is what changed everything for us. Before PhotoSphere, we were limited by our physical equipment. Now we can handle multiple events with fewer staff members and still deliver a premium experience."
              </blockquote>
              <p className="text-right text-gray-400 mt-4">— Michael Chen, Founder of Metro Memories</p>
            </div>
          </div>
          
          {/* Case Study 3 */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Case Study 3: Coastal Captures - Premium Corporate Market
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="md:col-span-2">
                <p className="text-gray-300 mb-6">
                  Coastal Captures focused on corporate events, positioning their interactive photobooth service as a premium brand activation tool:
                </p>
                
                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                  <li>Secured 15 Fortune 500 clients</li>
                  <li>Average corporate booking: $3,500 (vs. $900 for traditional photobooths)</li>
                  <li>92% client rebooking rate</li>
                </ul>
                
                <p className="text-gray-300">
                  Corporate clients valued the professional photo gallery for events and branded customization options that PhotoSphere's platform provided.
                </p>
              </div>
              
              <div className="md:col-span-1">
                <img 
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop&crop=center" 
                  alt="Corporate event with branded photobooth experience" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <p className="text-sm text-gray-400 mt-2 italic">
                  A branded corporate event using PhotoSphere
                </p>
              </div>
            </div>
            
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
              <blockquote className="text-xl text-gray-200 italic">
                "Corporate clients don't just want photos—they want brand experiences. With PhotoSphere, we can offer immersive branded environments that marketing teams love. It's completely changed our target market and pricing structure."
              </blockquote>
              <p className="text-right text-gray-400 mt-4">— Sophia Martinez, CEO of Coastal Captures</p>
            </div>
          </div>
          
          {/* Key Success Factors */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Key Success Factors
            </h2>
            
            <p className="text-gray-300 mb-6">
              All three businesses shared common strategies that led to their revenue growth:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">Premium Positioning</h3>
                <p className="text-gray-300">
                  Marketed as 'interactive photo experiences' rather than traditional photobooths, allowing for higher pricing and positioning as a premium service.
                </p>
              </div>
              
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">Technology Advantage</h3>
                <p className="text-gray-300">
                  Used PhotoSphere's advanced photobooth software to create a clear differentiation from competitors still using traditional setups.
                </p>
              </div>
              
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">Value-Based Pricing</h3>
                <p className="text-gray-300">
                  Focused on ROI and engagement metrics rather than hourly rates, allowing them to charge based on value delivered rather than time.
                </p>
              </div>
              
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">Repeat Business</h3>
                <p className="text-gray-300">
                  Virtual photobooth technology created memorable experiences that led to referrals and repeat bookings, reducing customer acquisition costs.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=1200&h=400&fit=crop&crop=center" 
                alt="Group enjoying an interactive photo experience" 
                className="w-full h-auto rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                <div className="p-8 max-w-lg">
                  <h3 className="text-2xl font-bold text-white mb-4">The Results Speak for Themselves</h3>
                  <p className="text-gray-200">
                    All three businesses saw their revenue double within 6 months of implementing PhotoSphere's interactive photobooth technology.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Conclusion */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Conclusion
            </h2>
            
            <p className="text-gray-300 mb-6">
              These case studies demonstrate that photobooth businesses can significantly increase revenue by adopting interactive photobooth software. PhotoSphere's virtual photobooth technology provides the competitive edge needed to command premium prices and secure repeat clients.
            </p>
            
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-8 border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4">Ready to transform your photobooth business?</h3>
              <p className="text-gray-300 mb-6">
                Discover how PhotoSphere's interactive photo gallery for events can double your revenue.
              </p>
              <Link 
                to="/pricing" 
                className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-600 transition-colors"
              >
                Explore Pricing Options
              </Link>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">How much can photobooth businesses increase revenue with interactive software?</h3>
                <p className="text-gray-300">
                  Based on our case studies, photobooth businesses using PhotoSphere's interactive software have seen revenue increases of 65-120%, with average booking prices rising from $800 to $1,400.
                </p>
              </div>
              
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">What makes interactive photobooth software more profitable than traditional setups?</h3>
                <p className="text-gray-300">
                  Interactive photobooth software allows businesses to charge premium prices (40-75% higher) due to enhanced guest engagement, real-time photo galleries, and unique 3D visual experiences that traditional photobooths cannot provide.
                </p>
              </div>
            </div>
          </div>
          
          {/* Related Articles */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Related Articles
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3 hover:text-purple-400 transition-colors">
                  <Link to="/blog/photobooth-pricing-strategies-premium-rates">
                    5 Pricing Strategies That Let Photobooth Businesses Charge 40% More
                  </Link>
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Learn the exact pricing models successful photobooth operators use to justify premium rates when offering PhotoSphere's immersive 3D photo walls at events.
                </p>
                <Link 
                  to="/blog/photobooth-pricing-strategies-premium-rates" 
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center"
                >
                  Read Article
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
              
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3 hover:text-purple-400 transition-colors">
                  <Link to="/blog/modernize-photobooth-business-guide">
                    Stop Losing Clients to Competitors: Complete Guide to Modernizing Your Photobooth Business
                  </Link>
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  A step-by-step roadmap for traditional photobooth operators to integrate cutting-edge photo activation technology without breaking the bank or losing existing customers.
                </p>
                <Link 
                  to="/blog/modernize-photobooth-business-guide" 
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center"
                >
                  Read Article
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Share Section */}
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center">
                <Share2 className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-300 mr-4">Share this article:</span>
                <div className="flex space-x-3">
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </div>
              
              <div>
                <Link 
                  to="/blog" 
                  className="text-purple-400 hover:text-purple-300 transition-colors flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BlogPost;