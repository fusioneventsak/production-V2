import { SubscriptionFeatures, SubscriptionPlan } from '../store/subscriptionStore';

/**
 * Centralized configuration for subscription features
 * This defines all features and limits for each subscription tier
 */
export const TIER_FEATURES: Record<SubscriptionPlan, SubscriptionFeatures> = {
  free: {
    // Core limits
    max_photospheres: 1,
    max_photos: 100,
    max_photos_per_sphere: 100,
    
    // Features
    camera_animations: false,
    video_recording: false,
    virtual_photobooth: true,
    moderation_tools: 'basic',
    custom_branding: false,
    priority_support: false,
    
    // Legacy fields (maintained for backward compatibility)
    has_video: false,
    has_priority_support: false,
    has_white_label: false,
    has_dedicated_manager: false
  },
  
  starter: {
    // Core limits - Perfect for small events
    max_photospheres: 5,
    max_photos: 1000, // Total across all spheres
    max_photos_per_sphere: 200, // Up to 200 photos displayed per sphere
    
    // Features
    camera_animations: false, // Basic plan - no advanced animations
    video_recording: false,
    virtual_photobooth: true,
    moderation_tools: 'basic',
    custom_branding: false,
    priority_support: false,
    
    // Legacy fields
    has_video: false,
    has_priority_support: false,
    has_white_label: false,
    has_dedicated_manager: false
  },
  
  pro: {
    // Core limits - Best for growing businesses
    max_photospheres: 20,
    max_photos: 10000, // Total across all spheres
    max_photos_per_sphere: 500, // Up to 500 photos displayed per sphere
    
    // Features - Everything in Starter plus advanced features
    camera_animations: true, // Advanced camera animations
    video_recording: true, // Built-in video recording
    virtual_photobooth: true,
    moderation_tools: 'advanced',
    custom_branding: true,
    priority_support: true,
    white_label: false,
    dedicated_support: false,
    custom_training: false,
    
    // Legacy fields
    has_video: true,
    has_priority_support: true,
    has_white_label: false,
    has_dedicated_manager: false
  },
  
  enterprise: {
    // Core limits - For large organizations
    max_photospheres: -1, // unlimited
    max_photos: -1, // unlimited
    max_photos_per_sphere: -1, // unlimited
    
    // Features - Everything in Pro plus enterprise features
    camera_animations: true,
    video_recording: true,
    virtual_photobooth: true,
    moderation_tools: 'enterprise',
    custom_branding: true,
    priority_support: true,
    white_label: true, // White label on your domain
    dedicated_support: true, // Dedicated Account Manager + 24/7 premium support
    custom_training: true, // Custom training sessions
    
    // Legacy fields
    has_video: true,
    has_priority_support: true,
    has_white_label: true,
    has_dedicated_manager: true
  },
  
  event: {
    // Core limits - Perfect for single events (One-Time plan)
    max_photospheres: 1, // Single PhotoSphere
    max_photos: 500, // Up to 500 photos displayed
    max_photos_per_sphere: 500,
    
    // Features - One-time payment, 30-day duration
    camera_animations: false,
    video_recording: false,
    virtual_photobooth: true, // Virtual PhotoBooth included
    moderation_tools: 'basic', // Basic moderation tools
    custom_branding: false,
    priority_support: false,
    white_label: false,
    dedicated_support: false,
    custom_training: false,
    duration_days: 30, // PhotoSphere lasts 30 days post-event
    single_use: true, // Single event license
    
    // Legacy fields
    has_video: false,
    has_priority_support: false,
    has_white_label: false,
    has_dedicated_manager: false
  }
};

/**
 * Helper function to get features for a specific subscription tier
 */
export const getFeaturesForTier = (tier: SubscriptionPlan): SubscriptionFeatures => {
  return TIER_FEATURES[tier] || TIER_FEATURES.free;
};

/**
 * Helper function to determine if a subscription has a specific feature
 */
export const hasFeature = (
  features: SubscriptionFeatures, 
  feature: keyof SubscriptionFeatures
): boolean => {
  if (typeof features[feature] === 'number') {
    return (features[feature] as number) > 0 || (features[feature] as number) === -1;
  }
  
  if (typeof features[feature] === 'string') {
    return Boolean(features[feature]);
  }
  
  return Boolean(features[feature]);
};
