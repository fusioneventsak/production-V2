import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/user';
import { TIERS, getTier } from '../config/tiers';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetLoadingState: () => void;
  getTier: (tierName: string) => any;
  hasFeature: (feature: string) => boolean;
  hasReachedLimit: (resource: 'photospheres' | 'photos') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Guard against hanging requests from external services
  const withTimeout = async <T,>(promise: Promise<T>, ms = 10000): Promise<T> => {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)) as unknown as Promise<T>,
    ]);
  };

  // Initialize auth state
  useEffect(() => {
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          await initializeUser(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    });

    // Check current session on mount
    const checkSession = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await withTimeout<{ data: { session: any } }>(supabase.auth.getSession());
        
        if (session?.user) {
          await initializeUser(session.user);
        } else {
          setLoading(false);
          setInitialized(true);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('timed out')) {
          console.warn('Auth session check timed out; proceeding unauthenticated and will retry in background.');
          setLoading(false);
          setInitialized(true);
          // Background retry (non-blocking, silent)
          setTimeout(() => {
            withTimeout<{ data: { session: any } }>(supabase.auth.getSession())
              .then(({ data: { session } }) => {
                if (session?.user) {
                  initializeUser(session.user);
                }
              })
              .catch(() => { /* swallow background retry errors */ });
          }, 2000);
        } else {
          console.error('Error checking session:', err);
          setError('Failed to check authentication status');
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    checkSession();
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Initialize user data
  const initializeUser = async (userData: any) => {
    try {
      setLoading(true);
      console.log('🔍 Initializing user data for:', userData.id);
      
      // Fetch user profile from the database
      const { data: profile, error: profileError } = await withTimeout<any>(
        (supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.id)
          .single()) as unknown as Promise<any>
      );
      
      console.log('🔍 Profile fetch result:', { profile, error: profileError });
      
      // Handle profile creation for new users
      if (profileError) {
        // Check if this is a "no rows" error (which is expected for new users)
        const isNoRowsError = (profileError as any).code === 'PGRST116' || 
                            (profileError as any).message?.includes('No rows found');
        
        if (!isNoRowsError) {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }
        
        // Create a new profile for the user
        console.log('🆕 Creating new user profile');
        const defaultProfile = {
          id: userData.id,
          email: userData.email,
          full_name: userData.user_metadata?.full_name || userData.user_metadata?.name || userData.email.split('@')[0],
          subscription_tier: 'free',
          subscription_status: 'inactive',
          plan_type: 'free',
          free_credits: 1000,
          credits_remaining: 1000,
          total_credits_used: 0,
          photospheres_created: 0,
          photos_uploaded: 0,
          max_photospheres: 5,
          max_photos: 100,
          is_trial_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const { data: newProfile, error: createError } = await withTimeout<any>(
          (supabase
            .from('profiles')
            .insert([defaultProfile])
            .select()
            .single()) as unknown as Promise<any>
        );
          
        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }
        
        // Map database fields to UserProfile interface
        const userProfile: UserProfile = mapDatabaseProfileToUserProfile(newProfile);
        
        console.log('🔑 Setting user state with new profile:', userProfile);
        setUser(userProfile);
      } else {
        // Use existing profile
        // Map database fields to UserProfile interface
        const userProfile: UserProfile = mapDatabaseProfileToUserProfile(profile);
        
        console.log('🔑 Setting user state with existing profile:', userProfile);
        setUser(userProfile);
      }
      
      // Always set these flags after user state is set
      console.log('✅ User initialization complete');
      setInitialized(true);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error initializing user:', err);
      setError('Failed to initialize user session');
      setLoading(false);
      setInitialized(true);
    }
  };
  
  // Helper function to map database profile to UserProfile interface
  const mapDatabaseProfileToUserProfile = (dbProfile: any): UserProfile => {
    return {
      id: dbProfile.id,
      email: dbProfile.email || '',
      fullName: dbProfile.full_name || '',
      avatarUrl: dbProfile.avatar_url || '',
      stripeCustomerId: dbProfile.stripe_customer_id || '',
      subscriptionId: dbProfile.subscription_id || '',
      subscriptionTier: dbProfile.subscription_tier || 'free',
      subscriptionStatus: dbProfile.subscription_status || 'inactive',
      subscriptionExpiry: dbProfile.subscription_expiry || null,
      trialStartsAt: dbProfile.trial_starts_at || null,
      trialEndsAt: dbProfile.trial_expires_at || null,
      planType: dbProfile.plan_type || 'free',
      freeCredits: dbProfile.free_credits || 0,
      creditsRemaining: dbProfile.credits_remaining || 0,
      totalCreditsUsed: dbProfile.total_credits_used || 0,
      photospheresCreated: dbProfile.photospheres_created || 0,
      photosUploaded: dbProfile.photos_uploaded || 0,
      maxPhotospheres: dbProfile.max_photospheres || 5,
      maxPhotos: dbProfile.max_photos || 100,
      lastBillingDate: dbProfile.last_billing_date || null,
      nextBillingDate: dbProfile.next_billing_date || null,
      billingCycle: dbProfile.billing_cycle || null,
      isTrialActive: dbProfile.is_trial_active || false,
      createdAt: dbProfile.created_at || new Date().toISOString(),
      updatedAt: dbProfile.updated_at || new Date().toISOString()
    };
  };


  // Login with email/password
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await withTimeout(supabase.auth.signInWithPassword({
        email,
        password,
      }));
      
      if (error) throw error;
      
      // Auth state change listener will handle the rest
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google OAuth
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await withTimeout(supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      }));

      if (error) throw error;
      
      // Auth state change listener will handle the rest
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to sign in with Google. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email/password
  const signup = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await withTimeout(supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      }));

      if (error) throw error;
      
      // User will be initialized by the auth state change listener
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await withTimeout(supabase.auth.signOut());
      if (error) throw error;
      
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await withTimeout(
        supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      );

      if (error) throw error;
      if (data) setUser(data);
    } catch (err) {
      console.error('Error refreshing user:', err);
      setError('Failed to refresh user data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await withTimeout(
        supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      );

      if (error) throw error;
      if (data) setUser(data);
      
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Manual reset to recover UI from any stuck state
  const resetLoadingState = () => {
    console.warn('🔄 Manually resetting auth loading state');
    setLoading(false);
    setInitialized(true);
    setError(null);
  };

  // Check if user has a specific feature
  const hasFeature = (feature: string): boolean => {
    if (!user) return false;
    const tier = getTier(user.subscriptionTier as keyof typeof TIERS);
    return tier.features.includes(feature);
  };

  // Check if user has reached a resource limit
  const hasReachedLimit = (resource: 'photospheres' | 'photos'): boolean => {
    if (!user) return true;
    
    const tier = getTier(user.subscriptionTier as keyof typeof TIERS);
    
    if (resource === 'photospheres') {
      return user.photospheresCreated >= tier.maxPhotospheres;
    } else if (resource === 'photos') {
      return user.photosUploaded >= tier.maxPhotosPerSphere;
    }
    
    return true;
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    error,
    initialized,
    login,
    loginWithGoogle,
    signup,
    logout,
    refreshUser,
    updateProfile,
    resetLoadingState,
    getTier: (tierName: string) => getTier(tierName as keyof typeof TIERS),
    hasFeature,
    hasReachedLimit,
  }), [
    user, 
    loading, 
    error, 
    initialized, 
    login, 
    loginWithGoogle, 
    signup, 
    logout, 
    refreshUser, 
    updateProfile, 
    resetLoadingState,
    hasFeature, 
    hasReachedLimit
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
