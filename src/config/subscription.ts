import { SubscriptionFeatures } from '../store/subscriptionStore';

/**
 * Free trial configuration for PhotoSphere
 * This defines the features and limits available during the trial period
 */
export const FREE_TRIAL_CONFIG: SubscriptionFeatures = {
  // Core limits
  max_photospheres: 3,
  max_photos: 1500, // 3 spheres × 500 photos
  max_photos_per_sphere: 500,
  
  // Features
  camera_animations: true,
  video_recording: true,
  virtual_photobooth: true,
  moderation_tools: 'advanced',
  custom_branding: true,
  priority_support: true,
  
  // Trial specific
  trial_duration_days: 14,
  
  // Legacy fields (maintained for backward compatibility)
  has_video: true,
  has_priority_support: true,
  has_white_label: false,
  has_dedicated_manager: false
};

/**
 * Helper function to apply free trial features to a user's subscription
 */
export const applyFreeTrialFeatures = (existingFeatures: Partial<SubscriptionFeatures> = {}): SubscriptionFeatures => {
  return {
    ...FREE_TRIAL_CONFIG,
    ...existingFeatures
  };
};
