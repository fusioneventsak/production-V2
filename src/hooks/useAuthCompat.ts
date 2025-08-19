import { useSimpleAuth } from '../contexts/SimpleAuthContext';

// Compatibility layer to map new auth to old auth interface
export const useAuth = () => {
  const { user, loading, error, initialized, signIn, signUp, signInWithGoogle, signOut, clearError, resetAuth } = useSimpleAuth();

  // Map new auth interface to old auth interface
  return {
    user: user ? {
      ...user,
      // Map new user properties to old expected properties
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      // Add any missing properties with defaults
      photospheresCreated: 0,
      photosUploaded: 0,
      maxPhotospheres: 5,
      maxPhotos: 100,
      creditsRemaining: 1000,
      isTrialActive: false,
      avatarUrl: '',
      stripeCustomerId: '',
      subscriptionId: '',
      subscriptionExpiry: null,
      trialStartsAt: null,
      trialEndsAt: null,
      planType: user.subscriptionTier,
      freeCredits: 1000,
      totalCreditsUsed: 0,
      lastBillingDate: null,
      nextBillingDate: null,
      billingCycle: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } : null,
    loading,
    error,
    initialized,
    // Map new auth methods to old expected methods
    login: signIn,
    loginWithGoogle: signInWithGoogle,
    signup: signUp,
    logout: signOut,
    refreshUser: async () => {
      // No-op for now
    },
    updateProfile: async () => {
      // No-op for now
    },
    resetLoadingState: resetAuth,
    getTier: () => ({}),
    hasFeature: () => false,
    hasReachedLimit: () => false
  };
};
