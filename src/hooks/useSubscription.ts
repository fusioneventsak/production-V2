import { useSubscriptionStore } from '../store/subscriptionStore';

export const useSubscription = () => {
  const {
    subscription,
    loading,
    error,
    fetchSubscription,
    hasFeature,
    canCreatePhotosphere,
    canUploadPhotos,
  } = useSubscriptionStore();

  const isActive = subscription?.subscription_status === 'active';
  const isTrialing = subscription?.subscription_status === 'trialing';
  const isPastDue = subscription?.subscription_status === 'past_due';
  const isCanceled = subscription?.subscription_status === 'canceled';
  const isSuspended = !!subscription && (
    subscription.subscription_status === 'past_due' ||
    subscription.subscription_status === 'unpaid' ||
    subscription.subscription_status === 'incomplete' ||
    subscription.subscription_status === 'incomplete_expired' ||
    // Only consider canceled as suspended if it's not showing as active elsewhere
    (subscription.subscription_status === 'canceled' && !subscription.subscription_tier)
  );

  const planName = subscription?.subscription_tier || 'none';
  const planFeatures = subscription?.features;

  // Helper functions for common feature checks
  const canUseVideo = () => hasFeature('has_video');
  const hasPrioritySupport = () => hasFeature('has_priority_support');
  const hasWhiteLabel = () => hasFeature('has_white_label');
  const hasDedicatedManager = () => hasFeature('has_dedicated_manager');

  // Usage limits
  const getMaxPhotospheres = () => planFeatures?.max_photospheres || 0;
  const getMaxPhotos = () => planFeatures?.max_photos || 0;
  const isUnlimitedPhotospheres = () => planFeatures?.max_photospheres === -1;
  const isUnlimitedPhotos = () => planFeatures?.max_photos === -1;

  // Trial information
  const getTrialEnd = () => {
    return subscription?.trial_end || subscription?.subscription_expiry || null;
  };
  
  // Note: We're now using the store's isInTrialPeriod function instead

  // Billing information
  const getRenewalDate = () => {
    return subscription?.current_period_end || null;
  };

  const willCancel = () => false; // Simplified since we're not tracking cancel_at_period_end

  // Get isInTrialPeriod from the store
  const { isInTrialPeriod } = useSubscriptionStore();
  
  return {
    // Subscription state
    subscription,
    loading,
    error,
    isActive,
    isTrialing,
    isPastDue,
    isCanceled,
    isSuspended,
    planName,
    planFeatures,

    // Feature checks
    canUseVideo,
    hasPrioritySupport,
    hasWhiteLabel,
    hasDedicatedManager,
    canCreatePhotosphere,
    canUploadPhotos,

    // Usage limits
    getMaxPhotospheres,
    getMaxPhotos,
    isUnlimitedPhotospheres,
    isUnlimitedPhotos,

    // Trial information
    getTrialEnd,
    isInTrial: isInTrialPeriod, // Use the store's function

    // Billing information
    getRenewalDate,
    willCancel,

    // Actions
    fetchSubscription,
  };
};

// Hook for protecting components that require specific features
export const useFeatureGate = (feature: string) => {
  const { subscription, hasFeature } = useSubscriptionStore();
  
  // Allow access for both active and trialing subscriptions
  const hasAccess = (subscription?.subscription_status === 'active' || subscription?.subscription_status === 'trialing') && 
    hasFeature(feature as any);
  
  return {
    hasAccess,
    subscription,
    requiresUpgrade: !hasAccess,
  };
};

// Hook for usage-based limits
export const useUsageLimit = (type: 'photospheres' | 'photos', currentUsage: number) => {
  const { subscription } = useSubscriptionStore();
  
  // Allow both active and trialing subscriptions to use features
  if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
    return {
      canUse: false,
      limit: 0,
      usage: currentUsage,
      remaining: 0,
      isUnlimited: false,
      requiresUpgrade: true,
    };
  }

  const limit = type === 'photospheres' 
    ? subscription.features.max_photospheres 
    : subscription.features.max_photos;

  const isUnlimited = limit === -1;
  const canUse = isUnlimited || currentUsage < limit;
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - currentUsage);

  return {
    canUse,
    limit: isUnlimited ? Infinity : limit,
    usage: currentUsage,
    remaining,
    isUnlimited,
    requiresUpgrade: !canUse,
  };
};
