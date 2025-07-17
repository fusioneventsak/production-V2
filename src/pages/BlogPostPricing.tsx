import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { ArrowLeft, ArrowRight, Calendar, Clock, User, Tag, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import Layout from '../components/layout/Layout';

const BlogPostPricing: React.FC = () => {
  const location = useLocation();
  
  // Scroll to top when component mounts or location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        {/* Hero Section with Featured Image */}
        <div className="relative h-96 md:h-[500px] overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=630&fit=crop&crop=center" 
            alt="Business person calculating premium pricing for photobooth services" 
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
                5 Pricing Strategies That Let Photobooth Businesses Charge 40% More with Interactive Experiences
              </h1>
              
              <div className="flex flex-wrap items-center text-sm text-gray-300 gap-4 md:gap-6">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Arthur Kerekes
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  July 10, 2025
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  7 min read
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
              Traditional photobooth pricing models are failing in today's competitive market. Successful photobooth businesses are shifting from hourly rates to value-based pricing using interactive photobooth software. These five proven strategies show how to charge premium rates for virtual photobooth experiences while delivering exceptional value to clients.
            </p>
          </div>
          
          {/* Strategy 1 */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Strategy 1: Experience-Based Pricing Model
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="md:col-span-2">
                <div className="mb-6">
                  <div className="flex justify-between text-gray-300 mb-3">
                    <div><span className="font-semibold text-white">Traditional Approach:</span> $150-200 per hour for basic photobooth setup</div>
                  </div>
                  <div className="flex justify-between text-gray-300 mb-6">
                    <div><span className="font-semibold text-white">Premium Approach:</span> $1,200-2,500 per event for interactive photo experiences</div>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-3">Implementation:</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
                  <li>Position your service as an 'Interactive Photo Experience' rather than a photobooth rental</li>
                  <li>Price based on guest count and engagement value, not time</li>
                  <li>Highlight unique features like real-time photo gallery displays and 3D visualizations</li>
                  <li>Show ROI through social media reach and guest engagement metrics</li>
                </ul>
                
                <p className="text-gray-300 mb-4">
                  <span className="font-semibold text-white">Results:</span> Photobooth businesses using PhotoSphere's interactive software report 40-60% higher booking values compared to traditional hourly pricing.
                </p>
                
                <p className="text-gray-300">
                  <span className="font-semibold text-white">Client Value Proposition:</span> "Instead of renting equipment, you're investing in an unforgettable guest experience that generates organic social media content worth thousands in marketing value."
                </p>
              </div>
              
              <div className="md:col-span-1">
                <img 
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop&crop=center" 
                  alt="Interactive photo experience with guests engaging with a 3D display" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <p className="text-sm text-gray-400 mt-2 italic">
                  Guests engaging with an interactive photo experience
                </p>
              </div>
            </div>
          </div>
          
          {/* Strategy 2 */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Strategy 2: Tiered Service Packages
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="md:col-span-1 order-2 md:order-1">
                <img 
                  src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop&crop=center" 
                  alt="Tiered service packages for photobooth experiences" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <p className="text-sm text-gray-400 mt-2 italic">
                  Clients typically choose premium packages when value is clear
                </p>
              </div>
              
              <div className="md:col-span-2 order-1 md:order-2">
                <div className="space-y-6 mb-6">
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Classic Package ($800-1,200)</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>Traditional photobooth with basic props</li>
                      <li>Standard photo strips</li>
                      <li>Basic social sharing</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-800/50 p-4 rounded-lg border border-purple-700/30">
                    <h3 className="text-lg font-semibold text-white mb-2">Premium Package ($1,500-2,200)</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>Interactive photobooth software with real-time gallery</li>
                      <li>Custom branded overlays</li>
                      <li>Advanced photo effects and filters</li>
                      <li>Digital delivery within 24 hours</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/30">
                    <h3 className="text-lg font-semibold text-white mb-2">Elite Package ($2,500-4,000)</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>Full photo activation experience with 3D displays</li>
                      <li>AI-powered photo curation</li>
                      <li>Live social media integration</li>
                      <li>Custom event branding and animations</li>
                      <li>Dedicated photo gallery website</li>
                    </ul>
                  </div>
                </div>
                
                <p className="text-gray-300">
                  <span className="font-semibold text-white">Key Success Factor:</span> 70% of clients choose the Premium or Elite package when presented with clear value differentiators that interactive photobooth technology provides.
                </p>
              </div>
            </div>
          </div>
          
          {/* Strategy 3 */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Strategy 3: ROI-Focused Corporate Pricing
            </h2>
            
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-8">
              <p className="text-xl text-gray-200 mb-4">
                <span className="font-semibold">Corporate clients value measurable results over cost savings</span>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Standard Corporate Rate: $2,500-4,500 per event</h3>
                  <p className="text-white mb-2">Includes:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                    <li>Branded photo gallery for events</li>
                    <li>Real-time engagement analytics</li>
                    <li>Social media reach reporting</li>
                    <li>Lead capture integration</li>
                    <li>Professional photo curation</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Premium Corporate Package: $5,000-8,500 per event</h3>
                  <p className="text-white mb-2">Adds:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                    <li>Multi-location virtual photobooth capability</li>
                    <li>Custom AI photo effects with company branding</li>
                    <li>Executive photo gallery access</li>
                    <li>Post-event marketing asset delivery</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-800/30 rounded-lg">
                <p className="text-lg text-white font-medium mb-2">ROI Justification:</p>
                <p className="text-gray-200 italic">
                  "Our interactive photobooth software generates an average of 450 social media posts per event, equivalent to $15,000+ in organic marketing value, while capturing qualified leads through photo sharing."
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/3">
                <img 
                  src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&h=400&fit=crop&crop=center" 
                  alt="Corporate event with branded interactive photo experience" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              <div className="md:w-2/3">
                <p className="text-gray-300">
                  Corporate clients are particularly receptive to ROI-focused pricing because they evaluate event technology based on business outcomes rather than costs. By quantifying the marketing value, lead generation potential, and engagement metrics of your interactive photobooth software, you can justify premium rates that far exceed traditional photobooth pricing.
                </p>
              </div>
            </div>
          </div>
          
          {/* Strategy 4 */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Strategy 4: Add-On Revenue Optimization
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="md:col-span-2">
                <p className="text-gray-300 mb-6">
                  <span className="font-semibold text-white">Base Service:</span> Interactive photobooth with standard features
                </p>
                
                <h3 className="text-xl font-semibold text-white mb-4">High-Margin Add-Ons:</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <div className="bg-purple-600 text-white p-1 rounded-full mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Custom Animation Package (+$300-500)</p>
                      <p className="text-gray-300">Branded entrance effects and transitions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-purple-600 text-white p-1 rounded-full mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Extended Gallery Access (+$200-400)</p>
                      <p className="text-gray-300">12-month photo gallery hosting vs. 30-day standard</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-purple-600 text-white p-1 rounded-full mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Social Media Management (+$400-800)</p>
                      <p className="text-gray-300">Real-time posting and hashtag management</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-purple-600 text-white p-1 rounded-full mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Video Compilation Service (+$500-1,200)</p>
                      <p className="text-gray-300">AI-generated highlight reels</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-purple-600 text-white p-1 rounded-full mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Multi-Location Sync (+$600-1,000)</p>
                      <p className="text-gray-300">Connect multiple events in real-time</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-4">
                  <span className="font-semibold text-white">Strategy:</span> Present add-ons that enhance the virtual photobooth experience rather than basic equipment upgrades.
                </p>
                
                <p className="text-gray-300">
                  <span className="font-semibold text-white">Average Add-On Revenue:</span> $800-1,500 per event when properly positioned as experience enhancers.
                </p>
              </div>
              
              <div className="md:col-span-1">
                <img 
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&h=400&fit=crop&crop=center" 
                  alt="Add-on features for interactive photo experiences" 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <p className="text-sm text-gray-400 mt-2 italic">
                  High-margin add-ons enhance the overall experience
                </p>
                
                <div className="mt-6 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-white font-semibold mb-2">Pro Tip</h4>
                  <p className="text-gray-300 text-sm">
                    Always present add-ons as enhancements to the guest experience, not as technical upgrades. This shifts the conversation from cost to value.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Strategy 5 */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Strategy 5: Subscription Model for Repeat Clients
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">Monthly Photo Activation Subscription ($2,500-5,000/month)</h3>
                
                <p className="text-white mb-2">Includes:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 mb-6">
                  <li>Unlimited use of photobooth software platform</li>
                  <li>Monthly interactive photo gallery setup</li>
                  <li>Basic customization and branding</li>
                  <li>Standard analytics and reporting</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-6 rounded-lg border border-purple-500/30">
                <h3 className="text-xl font-semibold text-white mb-4">Premium Subscription ($5,000-12,000/month)</h3>
                
                <ul className="list-disc list-inside text-gray-300 space-y-1 mb-6">
                  <li>Advanced AI features and custom animations</li>
                  <li>Dedicated account management</li>
                  <li>Priority booking and setup</li>
                  <li>Custom integration development</li>
                  <li>Enhanced analytics and ROI reporting</li>
                </ul>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Target Clients</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Venues hosting 4+ events per month</li>
                  <li>Corporate clients with regular events</li>
                  <li>Event planning companies</li>
                  <li>Hotel chains and conference centers</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Benefits</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Predictable recurring revenue</li>
                  <li>Higher customer lifetime value</li>
                  <li>Reduced sales cycle for repeat bookings</li>
                  <li>Stronger client relationships</li>
                </ul>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=400&fit=crop&crop=center" 
                alt="Team discussing subscription pricing strategy" 
                className="w-full h-auto rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                <div className="p-8 max-w-lg">
                  <h3 className="text-2xl font-bold text-white mb-4">Recurring Revenue</h3>
                  <p className="text-gray-200">
                    Subscription models transform unpredictable event bookings into stable monthly revenue, increasing business valuation by 3-5x.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Implementation Best Practices */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Implementation Best Practices
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">1. Value Communication</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Focus on guest experience and engagement metrics</li>
                  <li>Show before/after comparisons of traditional vs. interactive photobooths</li>
                  <li>Provide case studies with specific ROI numbers</li>
                </ul>
              </div>
              
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">2. Price Anchoring</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Always present the premium option first</li>
                  <li>Use the traditional photobooth price as a baseline to show value</li>
                  <li>Highlight cost-per-guest rather than total package price</li>
                </ul>
              </div>
              
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">3. Competitive Positioning</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Emphasize unique features of interactive photobooth software</li>
                  <li>Show how virtual photobooth technology differentiates from basic rentals</li>
                  <li>Provide exclusive features that competitors cannot match</li>
                </ul>
              </div>
              
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">4. Contract Structure</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Include performance guarantees (guest engagement metrics)</li>
                  <li>Offer satisfaction guarantees to reduce purchase risk</li>
                  <li>Structure payment terms that align with client cash flow</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Conclusion */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Conclusion
            </h2>
            
            <p className="text-gray-300 mb-6">
              Premium pricing for interactive photobooth software requires a fundamental shift from equipment rental to experience delivery. By implementing these five strategies, photobooth businesses can justify 40-75% higher rates while providing exceptional value through virtual photobooth technology and photo gallery experiences that traditional setups cannot match.
            </p>
            
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-8 border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-4">Ready to implement premium pricing strategies?</h3>
              <p className="text-gray-300 mb-6">
                Discover how PhotoSphere's interactive photobooth software can transform your pricing model and increase revenue.
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
                <h3 className="text-xl font-semibold text-white mb-3">How much more can I charge for interactive photobooth software?</h3>
                <p className="text-gray-300">
                  Photobooth businesses using interactive software can charge 40-75% more than traditional setups. Premium packages range from $1,500-4,000 compared to $800-1,200 for basic services, with corporate clients paying $2,500-8,500 per event.
                </p>
              </div>
              
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">What justifies premium pricing for virtual photobooth services?</h3>
                <p className="text-gray-300">
                  Premium pricing is justified by enhanced guest engagement (40% higher participation), measurable ROI through social media reach, real-time photo galleries, AI-powered features, and unique interactive experiences that traditional photobooths cannot provide.
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
                  <Link to="/blog/photobooth-businesses-double-revenue-photosphere-case-study">
                    How PhotoSphere Helped 3 Photobooth Businesses Double Their Revenue in 6 Months
                  </Link>
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Real-world examples of premium pricing success with interactive photobooth software.
                </p>
                <Link 
                  to="/blog/photobooth-businesses-double-revenue-photosphere-case-study" 
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center"
                >
                  Read Article
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
              
              <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3 hover:text-purple-400 transition-colors">
                  <Link to="/blog/ai-revolution-photo-activations-photobooth-software-future">
                    The AI Revolution in Photo Activations: What Photobooth Owners Need to Know Now
                  </Link>
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Discover how AI is transforming photobooth software and creating new premium pricing opportunities.
                </p>
                <Link 
                  to="/blog/ai-revolution-photo-activations-photobooth-software-future" 
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
                <span className="text-gray-400 mr-4">Share</span>
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

export default BlogPostPricing;