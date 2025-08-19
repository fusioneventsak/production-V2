import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { Check, Crown, Headphones, Loader2, Camera, Shield, Users, Zap } from 'lucide-react';
import { DowngradeButton } from './DowngradeButton';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  popular?: boolean;
  description: string;
  isContactSales?: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 45,
    interval: 'month',
    description: 'Perfect for small events',
    features: [
      '5 PhotoSpheres',
      'Virtual PhotoBooth',
      'PhotoSphere Display',
      'Moderation tools',
      'Up to 200 photos displayed'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    interval: 'month',
    description: 'Best for growing businesses',
    popular: true,
    features: [
      'Everything in Starter',
      'Advanced camera animations',
      'Built-in video recording',
      '20 PhotoSpheres',
      'Up to 500 photos displayed',
      'Priority support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0, // Contact Sales
    interval: 'contact',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'White label on your domain',
      'Dedicated Account Manager',
      'Custom training sessions',
      '24/7 premium support'
    ]
  },
  {
    id: 'one-time',
    name: 'One-Time',
    price: 499,
    interval: 'one-time',
    description: 'Perfect for single events',
    features: [
      'PhotoSphere lasts 30 days post-event',
      'Up to 500 photos displayed',
      'Virtual PhotoBooth included',
      'Basic moderation tools',
      'Single event license'
    ]
  }
];

const SimpleSubscriptionPlans = () => {
  const { user } = useAuth();
  const { subscription, loading: subscriptionLoading, createCheckoutSession, createPortalSession } = useSubscriptionStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      setError('Please log in to subscribe');
      return;
    }

    // Validate plan type
    if (!['starter', 'pro', 'enterprise', 'one-time'].includes(planId)) {
      setError('Invalid plan selected');
      return;
    }

    setLoadingPlan(planId);
    setError(null);

    try {
      // Use the subscription store to redirect to checkout
      const checkoutUrl = await createCheckoutSession(planId, planId as any);
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) {
      setError('Please log in to manage your subscription');
      return;
    }

    try {
      const portalUrl = await createPortalSession();
      window.location.href = portalUrl;
    } catch (err) {
      console.error('Customer portal error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open customer portal');
    }
  };


  // Check if user has an active subscription
  const hasActiveSubscription = subscription && subscription.subscription_status === 'active';
  const currentPlan = subscription?.subscription_tier || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
            Choose Your Plan
          </h1>
          <p className="text-base text-blue-200 max-w-2xl mx-auto leading-relaxed">
            Select the plan that fits your needs. All features unlocked during trial.
            <span className="block mt-1 text-sm text-blue-300 font-medium">14-day free trial included with all monthly plans.</span>
          </p>
        </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center backdrop-blur-sm text-sm">
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">!</span>
            </div>
            {error}
          </div>
        </div>
      )}

      {/* Current Subscription Status */}
      {hasActiveSubscription && (
        <div className="mb-6 p-4 bg-blue-900/20 border border-green-500/30 rounded-lg text-center backdrop-blur-sm">
          <div className="flex items-center justify-center mb-2">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-2">
              <Crown className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-green-400">
              Active: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </h3>
          </div>
          <p className="text-green-300 mb-4 text-sm">
            Your subscription is active and all features are available.
          </p>
          <button
            onClick={handleManageSubscription}
            className="px-4 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Manage Subscription
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 relative z-10">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isLoading = loadingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative bg-blue-900/20 backdrop-blur-sm rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                plan.popular
                  ? 'border-purple-500/50 shadow-sm shadow-purple-500/10 hover:bg-blue-900/30 bg-gradient-to-br from-purple-500/10 to-blue-500/20'
                  : 'border-blue-500/30 hover:border-blue-500/40 hover:bg-blue-900/30'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-semibold shadow-sm">
                    ⭐ Most Popular
                  </div>
                </div>
              )}

              <div className="p-2.5">
                {/* Plan Header */}
                <div className="text-center mb-2">
                  <h3 className="text-base font-bold text-white mb-0.5">{plan.name}</h3>
                  <p className="text-gray-400 text-[11px] mb-2 leading-tight">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    {plan.interval === 'contact' ? (
                      <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Contact Sales</span>
                    ) : (
                      <>
                        <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">${plan.price}</span>
                        <span className="text-gray-500 ml-0.5 text-xs">/{plan.interval === 'month' ? 'mo' : plan.interval === 'one-time' ? 'once' : 'event'}</span>
                      </>
                    )}
                  </div>
                  <p className="text-[9px] text-gray-500">
                    {plan.interval === 'contact' ? 'Custom pricing' : 
                     plan.interval === 'month' ? 'Billed monthly' : 
                     plan.interval === 'one-time' ? 'One-time payment' : 'Billed once'}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-1.5 mb-3 mt-2">
                  {plan.features.map((feature, index) => (
                    <div key={`${plan.id}-feature-${index}`} className="flex items-center group">
                      <div className="w-3 h-3 bg-green-500/20 rounded-full flex items-center justify-center mr-1.5 flex-shrink-0 group-hover:bg-green-500/30 transition-colors">
                        <Check className="w-1.5 h-1.5 text-green-400" />
                      </div>
                      <span className="text-gray-300 text-[11px] leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    if (plan.interval === 'contact') {
                      window.open('mailto:sales@photosphere.com?subject=Enterprise Plan Inquiry', '_blank');
                    } else {
                      handleSubscribe(plan.id);
                    }
                  }}
                  disabled={isLoading || subscriptionLoading || isCurrentPlan}
                  className={`w-full py-1.5 px-2 rounded-md text-xs font-semibold transition-all duration-200 flex items-center justify-center transform hover:scale-105 ${
                    isCurrentPlan
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white cursor-not-allowed'
                      : plan.interval === 'contact'
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white'
                      : plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                      : 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    <>
                      <Crown className="w-3.5 h-3.5 mr-1.5" />
                      Current Plan
                    </>
                  ) : plan.interval === 'contact' ? (
                    <>
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      Contact Sales
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 mr-1.5" />
                      {plan.interval === 'one-time' ? 'Buy Now' : 'Upgrade'}
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="bg-blue-900/30 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30 shadow-sm mb-8">
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent text-center mb-6">
          All Plans Include
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center group">
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-500/10 rounded-xl p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center group-hover:from-purple-600/30 group-hover:to-purple-500/20 transition-colors border border-purple-500/20">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">PhotoSphere Display</h4>
            <p className="text-gray-400 text-xs leading-tight">Interactive viewing</p>
          </div>
          
          <div className="text-center group">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 rounded-xl p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center group-hover:from-blue-600/30 group-hover:to-blue-500/20 transition-colors border border-blue-500/20">
              <Camera className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Virtual PhotoBooth</h4>
            <p className="text-gray-400 text-xs leading-tight">Interactive capture</p>
          </div>
          
          <div className="text-center group">
            <div className="bg-gradient-to-br from-green-600/20 to-green-500/10 rounded-xl p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center group-hover:from-green-600/30 group-hover:to-green-500/20 transition-colors border border-green-500/20">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Moderation Tools</h4>
            <p className="text-gray-400 text-xs leading-tight">Content control</p>
          </div>
          
          <div className="text-center group">
            <div className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 rounded-xl p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center group-hover:from-orange-600/30 group-hover:to-orange-500/20 transition-colors border border-orange-500/20">
              <Headphones className="w-6 h-6 text-orange-400" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Email Support</h4>
            <p className="text-gray-400 text-xs leading-tight">Help when needed</p>
          </div>
        </div>
      </div>

      {/* Current Subscription Management */}
      {hasActiveSubscription && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-8">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Current Subscription</h3>
            <p className="text-gray-400 text-sm">
              You're currently on the <span className="text-white font-medium capitalize">{currentPlan}</span> plan
            </p>
          </div>
          
          <div className="flex justify-center">
            <DowngradeButton />
          </div>
        </div>
      )}

      {/* FAQ or Additional Info */}
      <div className="mt-8 text-center">
        <div className="bg-blue-900/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
          <p className="text-gray-300 mb-4 text-sm">
            Need a custom solution? Questions about plans?
          </p>
          <a
            href="mailto:support@photosphere.com"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Contact Sales
            <span className="ml-1.5">→</span>
          </a>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SimpleSubscriptionPlans;
