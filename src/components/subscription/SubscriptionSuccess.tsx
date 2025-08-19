import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { CheckCircle, Crown, ArrowRight, Loader2 } from 'lucide-react';

const SubscriptionSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { subscription, fetchSubscription } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10; // Maximum number of retries
  const retryInterval = 2000; // 2 seconds between retries

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    if (success === 'true') {
      // Webhook might take a moment to process, so we'll retry fetching
      const checkSubscription = async () => {
        try {
          await fetchSubscription();
          
          // If we have a subscription, we're done
          if (subscription && subscription.subscription_status === 'active') {
            setIsLoading(false);
            return;
          }
          
          // If we don't have a subscription yet and haven't exceeded max retries, try again
          if (retryCount < maxRetries) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              checkSubscription();
            }, retryInterval);
          } else {
            // Max retries reached, stop loading
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error fetching subscription:', error);
          if (retryCount < maxRetries) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              checkSubscription();
            }, retryInterval);
          } else {
            setIsLoading(false);
          }
        }
      };

      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, [success, fetchSubscription, retryCount, subscription]);

  if (canceled === 'true') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800/50 rounded-2xl p-8 text-center border border-gray-700">
          <div className="w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowRight className="w-8 h-8 text-orange-400 rotate-180" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            Subscription Canceled
          </h1>
          
          <p className="text-gray-300 mb-8">
            No worries! You can subscribe anytime. Your account remains active with the free plan.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard/profile')}
              className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success === 'true') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800/50 rounded-2xl p-8 text-center border border-gray-700">
          {isLoading ? (
            // Loading state while webhook processes
            <>
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-4">
                Setting Up Your Subscription
              </h1>
              
              <p className="text-gray-300 mb-4">
                Please wait while we activate your account...
              </p>
              
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 mb-6">
                <p className="text-blue-300 text-sm">
                  This usually takes just a few seconds. We're processing your payment and setting up your features.
                </p>
              </div>
              
              <div className="text-gray-400 text-sm">
                Attempt {retryCount + 1} of {maxRetries + 1}
              </div>
            </>
          ) : (
            // Success state
            <>
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-4">
                Welcome to PhotoSphere Pro!
              </h1>
              
              <p className="text-gray-300 mb-6">
                {subscription && subscription.subscription_status === 'active' 
                  ? `Your ${subscription.subscription_tier} subscription is now active and all features are available.`
                  : 'Your subscription is being processed. You should have access to all features shortly.'
                }
              </p>
              
              {subscription && (
                <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <Crown className="w-5 h-5 text-purple-400 mr-2" />
                    <span className="text-purple-300 font-medium">
                      {subscription.subscription_tier?.charAt(0).toUpperCase() + subscription.subscription_tier?.slice(1)} Plan
                    </span>
                  </div>
                  <p className="text-purple-200 text-sm">
                    Status: {subscription.subscription_status}
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  <span>Start Creating</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
                
                <button
                  onClick={() => navigate('/dashboard/profile')}
                  className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  View Subscription Details
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-gray-400 text-sm mb-2">
                  Need help getting started?
                </p>
                <a
                  href="mailto:support@photosphere.com"
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                >
                  Contact Support →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Default state - shouldn't normally be reached
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800/50 rounded-2xl p-8 text-center border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-4">
          Something went wrong
        </h1>
        
        <p className="text-gray-300 mb-8">
          We couldn't determine the status of your subscription. Please try again or contact support.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard/profile')}
            className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Check Subscription Status
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
