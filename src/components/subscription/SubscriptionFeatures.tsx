import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { getFeaturesForTier } from '../../config/subscription-features';
import { Check, X, Zap, CheckCircle, Clock } from 'lucide-react';

interface FeatureItemProps {
  name: string;
  included: boolean;
  limit?: string | number;
  unlimited?: boolean;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ name, included, limit, unlimited }) => (
  <div className="flex items-center py-2">
    <div className={`flex-shrink-0 w-5 h-5 mr-3 flex items-center justify-center rounded-full ${
      included ? 'text-green-500' : 'text-gray-500'
    }`}>
      {included ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    </div>
    <div className="flex-1 text-sm text-gray-300">
      {name}
      {included && limit && !unlimited && (
        <span className="ml-2 text-xs text-gray-400">({limit})</span>
      )}
      {included && unlimited && (
        <span className="ml-2 text-xs text-gray-400">(Unlimited)</span>
      )}
    </div>
  </div>
);

const SubscriptionFeatures: React.FC = () => {
  const { user } = useAuth();
  const { subscription } = useSubscriptionStore();
  const currentTier = subscription?.subscription_tier || 'free';
  const features = subscription?.features || getFeaturesForTier('free');

  if (!user || !subscription) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-gray-300">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Your Plan: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</h3>
          {subscription.subscription_status === 'trialing' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
              <Clock className="w-3 h-3 mr-1" /> Trial Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-purple-400" /> Features
            </h4>
            <div className="space-y-2">
              <FeatureItem 
                name="Camera Animations" 
                included={!!features.camera_animations} 
              />
              <FeatureItem 
                name="Video Recording" 
                included={!!features.video_recording || !!features.has_video} 
              />
              <FeatureItem 
                name="Virtual Photobooth" 
                included={!!features.virtual_photobooth} 
              />
              <FeatureItem 
                name="Photosphere Display" 
                included={true} 
              />
              <FeatureItem 
                name="Custom Branding" 
                included={!!features.custom_branding} 
              />
              <FeatureItem 
                name="Priority Support" 
                included={!!features.priority_support || !!features.has_priority_support} 
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" /> Limits
            </h4>
            <div className="space-y-2">
              <FeatureItem 
                name="Max Photospheres" 
                included={true} 
                limit={features.max_photospheres}
                unlimited={features.max_photospheres === Infinity}
              />
              <FeatureItem 
                name="Photos per Photosphere" 
                included={true} 
                limit={features.max_photos_per_sphere}
                unlimited={features.max_photos_per_sphere === Infinity}
              />
              <FeatureItem 
                name="Total Photos" 
                included={true} 
                limit={features.max_photos}
                unlimited={features.max_photos === Infinity}
              />
            </div>
          </div>
        </div>

        {subscription.subscription_status === 'trialing' && subscription.trial_end && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex items-center text-sm text-yellow-400">
              <Clock className="w-4 h-4 mr-2" />
              <span>Your trial ends on {new Date(subscription.trial_end).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {currentTier !== 'enterprise' && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <a
              href="/pricing"
              className="inline-flex items-center text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              Upgrade to {currentTier === 'free' ? 'Starter' : currentTier === 'starter' ? 'Pro' : 'Enterprise'}
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionFeatures;
