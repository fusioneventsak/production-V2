import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TIERS } from '../config/tiers';

export const useSubscriptionFeatures = () => {
  const { user, hasFeature, hasReachedLimit } = useAuth();

  // Check if user can access a specific feature
  const canAccess = useCallback((feature: string): boolean => {
    if (!user) return false;
    return hasFeature(feature);
  }, [user, hasFeature]);

  // Check if user has reached a specific limit
  const hasReached = useCallback((resource: 'photospheres' | 'photos'): boolean => {
    if (!user) return true;
    return hasReachedLimit(resource);
  }, [user, hasReachedLimit]);

  // Get current tier details
  const getCurrentTier = useCallback(() => {
    if (!user) return TIERS.free;
    return TIERS[user.subscriptionTier as keyof typeof TIERS] || TIERS.free;
  }, [user]);

  // Check if user is on a trial
  const isOnTrial = useCallback((): boolean => {
    if (!user) return false;
    return user.subscriptionStatus === 'trialing';
  }, [user]);

  // Get remaining trial days
  const getTrialDaysLeft = useCallback((): number | null => {
    if (!user?.trialEndsAt) return null;
    const trialEnd = new Date(user.trialEndsAt);
    const today = new Date();
    const diffTime = trialEnd.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [user]);

  // Check if a specific feature is available in the current tier
  const isFeatureInTier = useCallback((feature: string): boolean => {
    const tier = getCurrentTier();
    return tier.features.includes(feature);
  }, [getCurrentTier]);

  return {
    canAccess,
    hasReached,
    getCurrentTier,
    isOnTrial,
    getTrialDaysLeft,
    isFeatureInTier,
    currentTier: getCurrentTier(),
    isFreeTier: !user || user.subscriptionTier === 'free',
    isProTier: user?.subscriptionTier === 'pro',
    isEnterpriseTier: user?.subscriptionTier === 'enterprise',
  };
};

export default useSubscriptionFeatures;
