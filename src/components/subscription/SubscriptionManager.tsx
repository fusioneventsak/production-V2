import React, { useEffect } from 'react';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import SubscriptionStatus from './SubscriptionStatus';
import UsageMeter from './UsageMeter';
import { Crown, TrendingUp, Users, Video, Headphones, Camera, Image, Palette, Shield } from 'lucide-react';
import { DowngradeButton } from './DowngradeButton';

interface SubscriptionManagerProps {
  photosphereCount?: number;
  photoCount?: number;
  showUsage?: boolean;
  showFeatures?: boolean;
  className?: string;
  compact?: boolean;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  photosphereCount = 0,
  photoCount = 0,
  showUsage = true,
  showFeatures = true,
  className = '',
  compact = false,
}) => {
  const {
    subscription,
    loading,
    fetchSubscription,
    hasCameraAnimations,
    hasVideoRecording,
    hasVirtualPhotobooth,
    hasCustomBranding,
    hasPrioritySupport,
    hasWhiteLabel,
    hasDedicatedSupport,
    hasCustomTraining,
    isSingleUseEvent
  } = useSubscriptionStore();

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse bg-gray-800/50 rounded-lg p-4 h-20"></div>
        {showUsage && (
          <>
            <div className="animate-pulse bg-gray-800/50 rounded-lg p-4 h-24"></div>
            <div className="animate-pulse bg-gray-800/50 rounded-lg p-4 h-24"></div>
          </>
        )}
      </div>
    );
  }

  const features = [
    {
      icon: Camera,
      name: 'Camera Animations',
      enabled: hasCameraAnimations(),
      description: 'Smooth camera transitions and effects',
    },
    {
      icon: Video,
      name: 'Video Recording',
      enabled: hasVideoRecording(),
      description: 'Built-in video recording capabilities',
    },
    {
      icon: Image,
      name: 'Virtual Photobooth',
      enabled: hasVirtualPhotobooth(),
      description: 'Interactive virtual photobooth',
    },
    {
      icon: Palette,
      name: 'Custom Branding',
      enabled: hasCustomBranding(),
      description: 'Add your own branding elements',
    },
    {
      icon: Headphones,
      name: 'Priority Support',
      enabled: hasPrioritySupport(),
      description: 'Priority email and chat support',
    },
    {
      icon: Crown,
      name: 'White Label',
      enabled: hasWhiteLabel(),
      description: 'Custom branding on your domain',
    },
    {
      icon: Users,
      name: 'Dedicated Support',
      enabled: hasDedicatedSupport(),
      description: 'Personal account manager',
    },
    {
      icon: Shield,
      name: 'Custom Training',
      enabled: hasCustomTraining(),
      description: 'Personalized onboarding and training',
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Subscription Status */}
      <SubscriptionStatus showDetails={!compact} compact={compact} />

      {/* Usage Meters */}
      {showUsage && subscription && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UsageMeter
            type="photospheres"
            currentUsage={photosphereCount}
            label={`PhotoSpheres${subscription.features.max_photospheres === -1 ? ' (Unlimited)' : ''}`}
          />
          <UsageMeter
            type="photos"
            currentUsage={photoCount}
            label={`Photos${subscription.features.max_photos === -1 ? ' (Unlimited)' : ''}`}
          />
        </div>
      )}

      {/* Plan Features */}
      {showFeatures && subscription && (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center mb-3">
            <Crown className="w-5 h-5 text-purple-400 mr-2" />
            <h3 className="text-lg font-medium text-white">
              {subscription.subscription_tier.charAt(0).toUpperCase() + subscription.subscription_tier.slice(1)} Features
            </h3>
          </div>
          
          {/* Plan-specific information */}
          {isSingleUseEvent() && (
            <div className="mb-3 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg text-xs text-blue-100">
              This is a single-use event plan valid for {subscription.features.duration_days || 30} days.
            </div>
          )}
          
          {/* Usage limits summary */}
          <div className="mb-3 p-3 bg-gray-900/30 border border-gray-700/50 rounded-lg text-xs text-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">PhotoSpheres:</span>{' '}
                {subscription.features.max_photospheres === -1 ? 'Unlimited' : subscription.features.max_photospheres}
              </div>
              <div>
                <span className="text-gray-400">Photos:</span>{' '}
                {subscription.features.max_photos === -1 ? 'Unlimited' : subscription.features.max_photos}
              </div>
              <div>
                <span className="text-gray-400">Photos per sphere:</span>{' '}
                {subscription.features.max_photos_per_sphere === -1 ? 'Unlimited' : subscription.features.max_photos_per_sphere}
              </div>
              {subscription.features.trial_duration_days && (
                <div>
                  <span className="text-gray-400">Trial period:</span>{' '}
                  {subscription.features.trial_duration_days} days
                </div>
              )}
            </div>
          </div>
          
          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.name}
                  className={`flex items-center p-3 rounded-lg border ${
                    feature.enabled
                      ? 'bg-green-900/20 border-green-800/50 text-green-300'
                      : 'bg-gray-900/20 border-gray-700 text-gray-400'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{feature.name}</p>
                    <p className="text-xs opacity-80">{feature.description}</p>
                  </div>
                  {feature.enabled && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {subscription && (
        <div className="mt-2">
          <DowngradeButton />
        </div>
      )}

      {/* Upgrade Prompt for Free Users */}
      {!subscription && (
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/50 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600/20 rounded-full p-3">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">
            Unlock Premium Features
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Get access to advanced features, unlimited usage, and priority support.
          </p>
          
          <a
            href="/dashboard/profile"
            className="inline-flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            <Crown className="w-4 h-4 mr-2" />
            View Plans
          </a>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;
