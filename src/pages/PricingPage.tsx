import React from 'react';
import Layout from '../components/layout/Layout';
import { Check } from 'lucide-react';

const PricingPage: React.FC = () => {
  return (
    <Layout>
      <div className="py-16 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-400">
              Choose the perfect plan for your event needs
            </p>
          </div>

          <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Basic Plan */}
            <div className="relative p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl flex flex-col">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">Basic</h3>
                <p className="mt-4 flex items-baseline text-white">
                  <span className="text-5xl font-extrabold tracking-tight">$99</span>
                  <span className="ml-1 text-xl font-semibold">/event</span>
                </p>
                <p className="mt-6 text-gray-400">Perfect for small gatherings and parties.</p>

                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-300">Up to 50 photos</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-300">Basic 3D animations</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-300">24-hour access</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-300">Email support</p>
                  </li>
                </ul>
              </div>

              <button
                className="mt-8 w-full bg-purple-600 border border-transparent rounded-md py-3 px-5 text-base font-medium text-white hover:bg-purple-700"
              >
                Get Started
              </button>
            </div>

            {/* Pro Plan */}
            <div className="relative p-8 bg-gradient-to-b from-purple-600 to-indigo-700 rounded-2xl shadow-xl flex flex-col">
              <div className="absolute top-0 right-0 -mr-3 -mt-3 bg-purple-500 rounded-full px-4 py-1 text-xs font-semibold text-white transform rotate-12">
                Popular
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">Pro</h3>
                <p className="mt-4 flex items-baseline text-white">
                  <span className="text-5xl font-extrabold tracking-tight">$249</span>
                  <span className="ml-1 text-xl font-semibold">/event</span>
                </p>
                <p className="mt-6 text-white/90">Ideal for weddings and corporate events.</p>

                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <p className="ml-3 text-base text-white">Up to 500 photos</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <p className="ml-3 text-base text-white">All animation patterns</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <p className="ml-3 text-base text-white">Custom branding</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <p className="ml-3 text-base text-white">7-day access</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <p className="ml-3 text-base text-white">Priority support</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <p className="ml-3 text-base text-white">Photo moderation</p>
                  </li>
                </ul>
              </div>

              <button
                className="mt-8 w-full bg-white border border-transparent rounded-md py-3 px-5 text-base font-medium text-purple-700 hover:bg-gray-100"
              >
                Get Started
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="relative p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl flex flex-col">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">Enterprise</h3>
                <p className="mt-4 flex items-baseline text-white">
                  <span className="text-5xl font-extrabold tracking-tight">$499</span>
                  <span className="ml-1 text-xl font-semibold">/event</span>
                </p>
                <p className="mt-6 text-gray-400">For large events and premium experiences.</p>

                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-300">Unlimited photos</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-300">All premium features</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-300">White-label solution</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-300">30-day access</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-300">Dedicated support</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-300">Advanced analytics</p>
                  </li>
                </ul>
              </div>

              <button
                className="mt-8 w-full bg-purple-600 border border-transparent rounded-md py-3 px-5 text-base font-medium text-white hover:bg-purple-700"
              >
                Contact Sales
              </button>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            <div className="mt-8 max-w-3xl mx-auto grid gap-6 lg:grid-cols-2">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white">How long can I access my collage?</h3>
                <p className="mt-2 text-gray-400">Access duration depends on your plan: Basic (24 hours), Pro (7 days), or Enterprise (30 days). Extensions are available for an additional fee.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white">Can I download the photos?</h3>
                <p className="mt-2 text-gray-400">Yes, all plans include the ability to download individual photos. Pro and Enterprise plans also allow bulk downloads.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white">Do you offer custom branding?</h3>
                <p className="mt-2 text-gray-400">Custom branding is available with Pro and Enterprise plans. This includes your logo, colors, and custom URLs.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white">What payment methods do you accept?</h3>
                <p className="mt-2 text-gray-400">We accept all major credit cards, PayPal, and bank transfers for Enterprise clients.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PricingPage;