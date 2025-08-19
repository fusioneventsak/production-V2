export interface UserTier {
  name: string;
  price: number;
  maxPhotospheres: number;
  maxPhotosPerSphere: number;
  storage: string;
  resolution: string;
  cameraAnimations: boolean;
  videoRecording: boolean;
  virtualPhotobooth: boolean;
  photosphereDisplay: boolean;
  moderationTools: string;
  customBranding: boolean;
  prioritySupport: boolean;
  trialDuration: number;
  features: string[];
}

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused' | null;
  subscriptionExpiry?: string | null;
  trialStartsAt?: string | null;
  trialEndsAt?: string | null;
  planType?: string;
  freeCredits: number;
  creditsRemaining: number;
  totalCreditsUsed: number;
  photospheresCreated: number;
  photosUploaded: number;
  maxPhotospheres: number;
  maxPhotos: number;
  lastBillingDate?: string | null;
  nextBillingDate?: string | null;
  billingCycle?: 'monthly' | 'yearly' | null;
  isTrialActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetAuth: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  error: string | null;
}
