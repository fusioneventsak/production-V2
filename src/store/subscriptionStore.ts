import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { fetchSubscriptionBundle, TRIAL_TIER } from '../lib/subscriptions';
import { getFeaturesForTier } from '../config/subscription-features';

// Guard against hanging external requests
const withTimeout = async <T,>(promise: Promise<T>, ms = 10000): Promise<T> => {
  return await Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)) as unknown as Promise<T>,
  ]);
};

export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise' | 'event';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'trialing';

export interface SubscriptionFeatures {
  // Core limits
  max_photospheres: number;
  max_photos: number;
  max_photos_per_sphere: number;
  
  // Features
  camera_animations: boolean;
  video_recording: boolean;
  virtual_photobooth: boolean;
  moderation_tools: 'basic' | 'advanced' | 'enterprise';
  custom_branding: boolean;
  priority_support: boolean;
  white_label?: boolean;
  dedicated_support?: boolean;
  custom_training?: boolean;
  
  // Trial and special plan properties
  trial_duration_days?: number;
  duration_days?: number;
  single_use?: boolean;
  
  // Legacy fields (maintained for backward compatibility)
  has_video: boolean;
  has_priority_support: boolean;
  has_white_label: boolean;
  has_dedicated_manager: boolean;
}

export interface Subscription {
  id: string;
  subscription_tier: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  features: SubscriptionFeatures;
  created_at: string;
  updated_at: string;
  trial_end?: string;
  trial_start?: string;
  subscription_expiry?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  // App-level free trial indicator
  is_app_free_trial?: boolean;
}

interface SubscriptionStore {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  // Prevent repetitive refetch loops
  lastFetchedUserId?: string | null;
  lastFetchedAt?: number | null;
  
  // Actions
  fetchSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  createCheckoutSession: (priceId: string, planType: SubscriptionPlan) => Promise<string>;
  createPortalSession: () => Promise<string>;
  hasFeature: (feature: keyof SubscriptionFeatures) => boolean;
  canCreatePhotosphere: (currentCount: number) => boolean;
  canUploadPhotos: (sphereId: string, currentCount: number) => boolean;
  getTrialDaysRemaining: () => number;
  isInTrialPeriod: () => boolean;
  getTrialEndDate: () => Date | null;
  getModerationType: () => 'basic' | 'advanced' | 'enterprise';
  hasCameraAnimations: () => boolean;
  hasVideoRecording: () => boolean;
  hasVirtualPhotobooth: () => boolean;
  hasCustomBranding: () => boolean;
  hasPrioritySupport: () => boolean;
  hasWhiteLabel: () => boolean;
  hasDedicatedSupport: () => boolean;
  hasCustomTraining: () => boolean;
  isSingleUseEvent: () => boolean;
  getDurationDays: () => number | null;
  isSubscriptionSuspended: () => boolean;
  clearError: () => void;
  downgradeToFree: () => Promise<{ success: boolean; error?: string }>;
  invalidateCache: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  loading: false,
  error: null,
  lastFetchedUserId: null,
  lastFetchedAt: null,

  fetchSubscription: async () => {
    // Re-entry guard: avoid concurrent or repeated fetches for same user
    const { loading, lastFetchedUserId, lastFetchedAt, subscription: existingSubscription } = get();
    if (loading) return;
    // Debounce: if we fetched for this user within the last 10s, skip
    if (lastFetchedUserId && lastFetchedAt && (Date.now() - lastFetchedAt < 10_000)) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await withTimeout<{ data: { user: any } }>(supabase.auth.getUser());
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Force refresh if data is older than 5 minutes or if we have no features
      const now = Date.now();
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes
      const hasValidCache = existingSubscription && 
                           lastFetchedUserId === user.id && 
                           lastFetchedAt && 
                           (now - lastFetchedAt) < cacheExpiry &&
                           existingSubscription.features;
      
      if (hasValidCache) {
        // Use cached data
        set({ loading: false, lastFetchedUserId: user.id, lastFetchedAt: now });
        return;
      }

      // Fetch unified subscription bundle (handles effective tier/status and app-level free trial)
      const bundle = await fetchSubscriptionBundle();
      const subRow = bundle.subscription; // may be null when on app-level free trial or free tier

      // Fetch the user profile snapshot for potential overrides
      const { data: profileData, error: profileError } = await withTimeout<any>(
        (supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()) as unknown as Promise<any>
      );

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Determine features - prioritize database features over centralized config
      let features: SubscriptionFeatures;
      if (bundle.isAppFreeTrial) {
        // During app-level free trial, use the configured trial tier features
        features = getFeaturesForTier(TRIAL_TIER as SubscriptionPlan);
      } else if (subRow) {
        const tier = (subRow.tier as SubscriptionPlan) || (bundle.effectiveTier as SubscriptionPlan);
        const featureData = bundle.features && bundle.features.length > 0 ? bundle.features[0] : null;
        
        if (featureData) {
          // Use database features directly - strict enforcement, no fallbacks
          console.log('📊 Using strict subscription features from database:', featureData);
          
          // If any required field is null, reject the database features entirely
          if (featureData.max_photospheres === null || 
              featureData.max_photos_per_sphere === null ||
              featureData.camera_animations === null ||
              featureData.video_recording === null) {
            console.warn('⚠️ Database features incomplete, using tier config instead');
            features = getFeaturesForTier(tier);
          } else {
            features = {
              // Core limits - exact values from database (validated non-null)
              max_photospheres: featureData.max_photospheres,
              max_photos: featureData.max_photos || 0,
              max_photos_per_sphere: featureData.max_photos_per_sphere,
              // Features - exact values from database (validated non-null)
              camera_animations: featureData.camera_animations,
              video_recording: featureData.video_recording,
              virtual_photobooth: featureData.virtual_photobooth ?? false,
              moderation_tools: featureData.moderation_tools || 'basic',
              custom_branding: featureData.custom_branding ?? false,
              priority_support: featureData.has_priority_support ?? false,
              white_label: featureData.has_white_label ?? false,
              dedicated_support: featureData.has_dedicated_manager ?? false,
              custom_training: featureData.custom_training ?? false,
              duration_days: featureData.duration_days ?? undefined,
              single_use: featureData.single_use ?? false,
              // Legacy fields - exact values from database
              has_video: featureData.has_video ?? featureData.video_recording ?? false,
              has_priority_support: featureData.has_priority_support ?? false,
              has_white_label: featureData.has_white_label ?? false,
              has_dedicated_manager: featureData.has_dedicated_manager ?? false,
            };
          }
        } else {
          // Use exact tier config - NO database overrides
          console.log('📊 No database features, using strict tier config for:', tier);
          features = getFeaturesForTier(tier);
        }
      } else {
        // No subscription, use free tier
        features = getFeaturesForTier('free');
      }

      // Note: Removed profile overrides to prevent fallback confusion

      // Use effective tier from bundle (already computed correctly)
      let effectiveTier = (bundle.effectiveTier as SubscriptionPlan) || 'free';
      
      // Combine subscription data with profile data
      const subscription: Subscription = {
        id: subRow?.id || user.id,
        subscription_tier: effectiveTier,
        subscription_status: (bundle.effectiveStatus as SubscriptionStatus) || 'inactive',
        features,
        created_at: subRow?.created_at || user.created_at,
        updated_at: subRow?.updated_at || user.created_at,
        trial_start: undefined,
        trial_end: bundle.trialEndsAt || undefined,
        subscription_expiry: profileData?.subscription_expiry || undefined,
        current_period_end: bundle.periodEnd || undefined,
        cancel_at_period_end: subRow?.cancel_at_period_end || false,
        is_app_free_trial: bundle.isAppFreeTrial,
      };

      set({ subscription, loading: false, lastFetchedUserId: user.id, lastFetchedAt: Date.now() });
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subscription data';
      set({ subscription: null, loading: false, error: errorMessage, lastFetchedAt: Date.now() });
      return;
    }
  },

  createCheckoutSession: async (priceId: string, planType: SubscriptionPlan) => {
    try {
      set({ error: null });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId, planType }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      return data.url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  refreshSubscription: async () => {
    // Clear cache to force refresh
    set({ lastFetchedUserId: null, lastFetchedAt: null });
    await get().fetchSubscription();
  },

  createPortalSession: async () => {
    try {
      set({ error: null });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      return data.url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create portal session';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  hasFeature: (feature: keyof SubscriptionFeatures) => {
    const { subscription } = get();
    if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
      return false;
    }
    
    // Handle numeric features differently
    if (typeof subscription.features[feature] === 'number') {
      return (subscription.features[feature] as number) > 0 || (subscription.features[feature] as number) === -1;
    }
    
    // Handle string features (like moderation_tools)
    if (typeof subscription.features[feature] === 'string') {
      return Boolean(subscription.features[feature]);
    }
    
    // Handle boolean features
    return Boolean(subscription.features[feature]);
  },

  canCreatePhotosphere: (currentCount: number) => {
    const { subscription } = get();
    if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
      return false;
    }
    
    // Check if single-use event plan and already has a photosphere
    if (subscription.features.single_use && currentCount > 0) {
      return false;
    }
    
    // Check against max_photospheres limit
    const maxSpheres = subscription.features.max_photospheres;
    
    // -1 means unlimited
    if (maxSpheres === -1) {
      return true;
    }
    
    return currentCount < maxSpheres;
  },

  canUploadPhotos: (_sphereId: string, currentCount: number) => {  // sphereId will be used in future for per-sphere limits
    const { subscription } = get();
    if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
      return false;
    }
    
    // Check against per-sphere limit first
    const maxPhotosPerSphere = subscription.features.max_photos_per_sphere;
    
    // -1 means unlimited for both checks
    if (maxPhotosPerSphere === -1) {
      return true;
    }
    
    // Check if we're under the per-sphere limit
    if (currentCount >= maxPhotosPerSphere) {
      return false;
    }
    
    // Then check against total photos limit
    const maxTotalPhotos = subscription.features.max_photos;
    if (maxTotalPhotos === -1) {
      return true;
    }
    
    // In a full implementation, we would use sphereId to query the database
    // to get the current photo count for this specific sphere and the total count
    // across all spheres to enforce both per-sphere and global limits
    // sphereId is kept as a parameter for future implementation
    return true;
  },

  getTrialDaysRemaining: () => {
    const { subscription } = get();
    if (!subscription) {
      return 0;
    }
    
    // Check if user is on a trial or free tier with trial end date
    const isTrialing = subscription.subscription_status === 'trialing';
    const isFreeWithTrial = subscription.subscription_tier === 'free' && 
                           (subscription.trial_end || subscription.subscription_expiry);
    
    if (!isTrialing && !isFreeWithTrial) {
      return 0;
    }
    
    const trialEnd = subscription.trial_end || subscription.subscription_expiry;
    if (!trialEnd) return 0;
    
    const endDate = new Date(trialEnd);
    const now = new Date();
    
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  },
  
  isInTrialPeriod: () => {
    const { subscription } = get();
    if (!subscription) return false;
    
    // Check if subscription status is trialing or if it's a free tier with trial features
    const isTrialing = subscription.subscription_status === 'trialing';
    const isFreeWithTrial = subscription.subscription_tier === 'free' && 
                           (subscription.trial_end || subscription.subscription_expiry);
    
    if (!isTrialing && !isFreeWithTrial) return false;
    
    // Check if trial end date is in the future
    const trialEnd = subscription.trial_end || subscription.subscription_expiry;
    if (!trialEnd) return false;
    
    return new Date(trialEnd) > new Date();
  },
  
  getTrialEndDate: () => {
    const { subscription } = get();
    if (!subscription) return null;
    
    // Check if user is on a trial or free tier with trial end date
    const isTrialing = subscription.subscription_status === 'trialing';
    const isFreeWithTrial = subscription.subscription_tier === 'free' && 
                           (subscription.trial_end || subscription.subscription_expiry);
    
    if (!isTrialing && !isFreeWithTrial) return null;
    
    const trialEnd = subscription.trial_end || subscription.subscription_expiry;
    if (!trialEnd) return null;
    
    return new Date(trialEnd);
  },
  
  // New feature-checking functions
  getModerationType: () => {
    const { subscription } = get();
    if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
      return 'basic';
    }
    return subscription.features.moderation_tools || 'basic';
  },
  
  hasCameraAnimations: () => {
    const { subscription } = get();
    if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
      return false;
    }
    return Boolean(subscription.features.camera_animations);
  },
  
  hasVideoRecording: () => {
    const { subscription } = get();
    if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
      return false;
    }
    return Boolean(subscription.features.video_recording || subscription.features.has_video);
  },
  
  hasVirtualPhotobooth: () => {
    const { subscription } = get();
    if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
      return false;
    }
    return Boolean(subscription.features.virtual_photobooth);
  },
  
  hasCustomBranding: () => {
    const { subscription } = get();
    if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
      return false;
    }
    return Boolean(subscription.features.custom_branding);
  },
  
  hasPrioritySupport: () => {
    const { subscription } = get();
    if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
      return false;
    }
    return Boolean(subscription.features.priority_support || subscription.features.has_priority_support);
  },
  
  hasWhiteLabel: () => {
    const { subscription } = get();
    if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
      return false;
    }
    return Boolean(subscription.features.white_label || subscription.features.has_white_label);
  },
  
  hasDedicatedSupport: () => {
    const { subscription } = get();
    if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
      return false;
    }
    return Boolean(subscription.features.dedicated_support || subscription.features.has_dedicated_manager);
  },
  
  hasCustomTraining: () => {
    const { subscription } = get();
    if (!subscription || (subscription.subscription_status !== 'active' && subscription.subscription_status !== 'trialing')) {
      return false;
    }
    return Boolean(subscription.features.custom_training);
  },
  
  isSingleUseEvent: () => {
    const { subscription } = get();
    if (!subscription) {
      return false;
    }
    return Boolean(subscription.features.single_use);
  },
  
  getDurationDays: () => {
    const { subscription } = get();
    if (!subscription) {
      return null;
    }
    return subscription.features.duration_days || null;
  },
  
  clearError: () => set({ error: null }),
  
  invalidateCache: () => {
    set({ lastFetchedAt: null });
  },
  
  isSubscriptionSuspended: () => {
    const { subscription } = get();
    if (!subscription) return false;
    
    // Check if subscription status indicates a suspended or inactive state
    const suspendedStatuses: SubscriptionStatus[] = ['past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'canceled'];
    return suspendedStatuses.includes(subscription.subscription_status);
  },
  
  downgradeToFree: async () => {
    try {
      set({ loading: true, error: null });
      
      // Check if user is already on free tier
      const { subscription } = get();
      if (subscription?.subscription_tier === 'free') {
        return { success: true };
      }
      
      // Get current session to ensure we have a valid token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Call the API to downgrade the subscription
      const { data, error } = await supabase.functions.invoke('downgrade-subscription');
      
      if (error) {
        console.error('Error downgrading subscription:', error);
        set({ error: error.message, loading: false });
        return { success: false, error: error.message };
      }
      
      // Update local state to reflect the downgrade
      if (data?.success) {
        // Refresh the subscription data
        await get().fetchSubscription();
        return { success: true };
      } else {
        const errorMsg = data?.error || 'Failed to downgrade subscription';
        set({ error: errorMsg, loading: false });
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Unexpected error in downgradeToFree:', err);
      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg };
    }
  },
}));

// Plan configurations for the UI
export const PLAN_CONFIGS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 45,
    interval: 'month' as const,
    priceId: 'price_starter_monthly', // Will be created dynamically by Edge Function
    isPopular: false,
    features: [
      '5 PhotoSpheres',
      'Virtual PhotoBooth',
      'PhotoSphere Display',
      'Moderation tools',
      'Up to 200 photos displayed'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 99,
    interval: 'month' as const,
    priceId: 'price_pro_monthly', // Will be created dynamically by Edge Function
    isPopular: true,
    features: [
      'Everything in Starter',
      'Advanced camera animations',
      'Built-in video recording',
      '20 PhotoSpheres',
      'Up to 500 photos displayed',
      'Priority support'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0, // Contact Sales - no fixed price
    interval: 'contact' as const,
    priceId: '', // No price ID - handled as contact sales
    isPopular: false,
    isContactSales: true,
    features: [
      'Everything in Pro',
      'White label on your domain',
      'Dedicated Account Manager',
      'Custom training sessions',
      '24/7 premium support'
    ]
  },
  'one-time': {
    id: 'one-time',
    name: 'One-Time',
    price: 499,
    interval: 'once' as const,
    priceId: 'price_onetime_single', // Will be created dynamically by Edge Function
    isPopular: false,
    features: [
      'PhotoSphere lasts 30 days post-event',
      'Up to 500 photos displayed',
      'Virtual PhotoBooth included',
      'Basic moderation tools',
      'Single event license'
    ]
  }
} as const;
