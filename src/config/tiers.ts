import { UserTier } from '../types/user';

export const TIERS: Record<string, UserTier> = {
  free: {
    name: 'Free',
    price: 0,
    maxPhotospheres: 5,
    maxPhotosPerSphere: 5,
    storage: '1GB',
    resolution: '2K',
    cameraAnimations: true,
    videoRecording: true,
    virtualPhotobooth: true,
    photosphereDisplay: true,
    moderationTools: 'advanced',
    customBranding: true,
    prioritySupport: true,
    trialDuration: 14,
    features: [
      '5 PhotoSpheres',
      '5 photos per sphere',
      'Camera animations',
      'Video recording',
      'Virtual photobooth',
      'PhotoSphere display',
      'Advanced moderation tools',
      'Custom branding',
      'Priority support',
      '14-day trial'
    ]
  },
  starter: {
    name: 'Starter',
    price: 45,
    maxPhotospheres: 25,
    maxPhotosPerSphere: 10,
    storage: '10GB',
    resolution: '4K',
    cameraAnimations: true,
    videoRecording: true,
    virtualPhotobooth: true,
    photosphereDisplay: true,
    customBranding: false,
    prioritySupport: false,
    features: [
      '25 PhotoSpheres',
      '10 photos per sphere',
      'Camera animations',
      'Video recording',
      'Virtual photobooth',
      '14-day free trial'
    ]
  },
  pro: {
    name: 'Pro',
    price: 99,
    maxPhotospheres: 100,
    maxPhotosPerSphere: 25,
    storage: '100GB',
    resolution: '8K',
    cameraAnimations: true,
    videoRecording: true,
    virtualPhotobooth: true,
    photosphereDisplay: true,
    customBranding: true,
    prioritySupport: true,
    features: [
      '100 PhotoSpheres',
      '25 photos per sphere',
      'Camera animations',
      'Video recording',
      'Virtual photobooth',
      'Custom branding',
      'Priority support',
      '14-day free trial'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 499,
    maxPhotospheres: Infinity,
    maxPhotosPerSphere: Infinity,
    storage: 'Unlimited',
    resolution: '8K+',
    cameraAnimations: true,
    videoRecording: true,
    virtualPhotobooth: true,
    photosphereDisplay: true,
    customBranding: true,
    prioritySupport: true,
    features: [
      'Unlimited PhotoSpheres',
      'Unlimited photos per sphere',
      'Camera animations',
      'Video recording',
      'Virtual photobooth',
      'Custom branding',
      'Priority support',
      '14-day free trial',
      'White-label solution',
      'API access',
      'Custom integrations'
    ]
  }
};

export const getTier = (tierName: string): UserTier => {
  return TIERS[tierName] || TIERS.free;
};

export const getTierFeatures = (tierName: string): string[] => {
  return getTier(tierName).features;
};

export const getTierLimits = (tierName: string) => {
  const tier = getTier(tierName);
  return {
    name: tier.name,
    price: tier.price,
    maxPhotospheres: tier.maxPhotospheres,
    maxPhotosPerSphere: tier.maxPhotosPerSphere,
    storage: tier.storage,
    resolution: tier.resolution,
    cameraAnimations: tier.cameraAnimations,
    videoRecording: tier.videoRecording,
    virtualPhotobooth: tier.virtualPhotobooth,
    photosphereDisplay: tier.photosphereDisplay,
    customBranding: tier.customBranding,
    prioritySupport: tier.prioritySupport,
    features: tier.features
  };
};
