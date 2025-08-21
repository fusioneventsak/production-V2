import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Simple user type
interface SimpleUser {
  id: string;
  email: string;
  fullName: string;
  subscriptionTier: string;
  subscriptionStatus: string;
}

interface SimpleAuthContextType {
  user: SimpleUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  resetAuth: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | null>(null);

export const SimpleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  // Timeout wrapper for all async operations
  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = 20000): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
  };

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Check for OAuth callback in URL
        const hash = window.location.hash.substring(1);
        const urlParams = new URLSearchParams(hash);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        console.log('Checking for OAuth callback:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken 
        });
        
        if (accessToken && refreshToken) {
          console.log('OAuth callback detected, processing tokens...');
          
          try {
            // Force session creation with tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (!isMounted) return;
            
            if (error) {
              console.error('Failed to set session:', error);
            } else if (data.session?.user) {
              console.log('Session created successfully:', data.session.user.id);
              
              // Set user immediately
              setUser({
                id: data.session.user.id,
                email: data.session.user.email || '',
                fullName: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || '',
                subscriptionTier: data.session.user.app_metadata?.subscription_tier || 'free',
                subscriptionStatus: data.session.user.app_metadata?.subscription_status || 'inactive'
              });
              
              setInitialized(true);
              setLoading(false);
              
              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Load profile in background
              loadUserProfile(data.session.user.id).catch(err => {
                console.warn('Background profile load failed:', err);
              });
              
              return; // Exit early, don't continue with session check
            }
          } catch (err) {
            console.error('OAuth processing error:', err);
          }
          
          // Clean up URL even if session creation failed
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // Check current session
        const { data: { session }, error: sessionError } = await withTimeout(
          supabase.auth.getSession()
        );

        if (!isMounted) return;

        if (sessionError) {
          console.warn('Session check failed:', sessionError.message);
          setUser(null);
          setInitialized(true);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Session found during initialization:', session.user.id);
          // Set user data immediately from session
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
            subscriptionTier: session.user.app_metadata?.subscription_tier || 'free',
            subscriptionStatus: session.user.app_metadata?.subscription_status || 'inactive'
          });
          
          // Load profile in background
          loadUserProfile(session.user.id).catch(err => {
            console.warn('Profile load failed during initialization:', err);
          });
        } else {
          console.log('No session found during initialization');
          setUser(null);
        }

      } catch (err) {
        if (!isMounted) return;
        console.warn('Auth initialization failed:', err);
        setUser(null);
        setError(null); // Don't show initialization errors to users
      } finally {
        if (isMounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('Auth state change: SIGNED_IN detected');
        
        // Set user data immediately to allow navigation
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
          subscriptionTier: session.user.app_metadata?.subscription_tier || 'free',
          subscriptionStatus: session.user.app_metadata?.subscription_status || 'inactive'
        });
        
        // One-time hard reload after OAuth to avoid hanging UI states
        try {
          const shouldReload = sessionStorage.getItem('ps_should_reload_after_oauth');
          if (shouldReload) {
            sessionStorage.removeItem('ps_should_reload_after_oauth');
            setTimeout(() => window.location.reload(), 50);
          }
        } catch (_) {
          // ignore storage access issues
        }
        
        // Load profile in background to update with database data
        loadUserProfile(session.user.id).catch(err => {
          console.warn('Profile load failed in auth state change:', err);
          // User data is already set above, so app can continue functioning
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setError(null);
      }
    });

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile from database with retry logic
  const loadUserProfile = async (userId: string, retryCount = 0) => {
    const maxRetries = 3;
    const timeoutMs = 25000; // 25 seconds for profile loading
    
    try {
      // Execute the Supabase query with timeout
      const result = await withTimeout(
        Promise.resolve(
          supabase
            .from('profiles')
            .select('id, email, full_name, subscription_tier, subscription_status')
            .eq('id', userId)
            .single()
        ),
        timeoutMs
      );

      const { data: profile, error } = result as any;

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - create default
          await createDefaultProfile(userId);
          return;
        }
        throw error;
      }

      setUser({
        id: profile.id,
        email: profile.email || '',
        fullName: profile.full_name || '',
        subscriptionTier: profile.subscription_tier || 'free',
        subscriptionStatus: profile.subscription_status || 'inactive'
      });

    } catch (err) {
      console.error('Failed to load user profile:', err);
      
      // Retry logic for profile loading after payment completion
      if (retryCount < maxRetries && err instanceof Error && err.message.includes('Operation timed out')) {
        console.log(`Retrying profile load (attempt ${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => {
          loadUserProfile(userId, retryCount + 1);
        }, 2000); // Wait 2 seconds before retry
        return;
      }
      
      setError('Failed to load user profile');
    }
  };

  // Create default profile for new users
  const createDefaultProfile = async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) return;

      const defaultProfile = {
        id: userId,
        email: authUser.user.email || '',
        full_name: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || '',
        subscription_tier: 'free',
        subscription_status: 'inactive'
      };

      // Create a promise for the profile creation
      const createProfilePromise = new Promise(async (resolve, reject) => {
        try {
          const result = await supabase
            .from('profiles')
            .insert([defaultProfile])
            .select('id, email, full_name, subscription_tier, subscription_status')
            .single();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });

      const { data: newProfile, error } = await withTimeout(createProfilePromise, 15000) as any;

      if (error) throw error;

      setUser({
        id: newProfile.id,
        email: newProfile.email || '',
        fullName: newProfile.full_name || '',
        subscriptionTier: newProfile.subscription_tier || 'free',
        subscriptionStatus: newProfile.subscription_status || 'inactive'
      });

    } catch (err) {
      console.error('Failed to create user profile:', err);
      setError('Failed to create user profile');
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password })
      );

      if (error) throw error;

      // Navigation will be handled by auth state change
      navigate('/dashboard');

    } catch (err: any) {
      console.error('Sign in failed:', err);
      setError(err.message || 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        })
      );

      if (error) throw error;

      // User will be initialized by auth state change

    } catch (err: any) {
      console.error('Sign up failed:', err);
      setError(err.message || 'Sign up failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        })
      );

      if (error) throw error;

      // OAuth will redirect, so we don't need to handle navigation here

    } catch (err: any) {
      console.error('Google sign in failed:', err);
      setError(err.message || 'Google sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      await withTimeout(supabase.auth.signOut());
      setUser(null);
      setError(null);
      navigate('/login');
    } catch (err: any) {
      console.error('Sign out failed:', err);
      setError('Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Reset auth state (for debugging/recovery)
  const resetAuth = () => {
    setUser(null);
    setLoading(false);
    setError(null);
    setInitialized(true);
  };

  const value = {
    user,
    loading,
    error,
    initialized,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    clearError,
    resetAuth
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
};

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within SimpleAuthProvider');
  }
  return context;
};
