import { create } from 'zustand';
import { supabase } from '../lib/supabase';

type User = {
  id: string;
  email?: string;
  created_at?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
};

type AuthState = {
  user: User | null;
  session: any | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  resetLoadingState: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,
  error: null,

  clearError: () => set({ error: null }),

  signUp: async (email, password) => {
    // Prevent multiple sign-up attempts when already loading
    if (get().loading) {
      return { error: { message: 'Already processing request' } };
    }
    
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      // Always reset loading state immediately after the request
      set({ loading: false });
      
      if (error) {
        set({ error: error.message });
        return { error };
      }
      
      if (!data.user) {
        set({ error: 'Account creation failed. Please try again.' });
        return { error: { message: 'Account creation failed' } };
      }
      
      // Profile creation is now handled automatically by the database trigger
      // No need to manually create profile - it's created by the handle_new_user() function
      
      // Success - the AuthContext will handle setting the user state
      set({ error: null });
      return { error: null };
      
    } catch (err: any) {
      // Always reset loading state on error
      set({ loading: false });
      
      const errorMessage = err.status === 500
        ? 'Our services are temporarily unavailable. Please try again in a few minutes.'
        : err.message || 'An unexpected error occurred. Please try again.';
      
      set({ error: errorMessage });
      return { error: err };
    }
  },

  signIn: async (email, password) => {
    // Prevent multiple sign-in attempts when already loading
    if (get().loading) {
      console.warn('🔑 Sign-in blocked - already loading');
      return { error: { message: 'Already processing request' } };
    }
    
    console.log('🔑 Starting sign-in process for:', email);
    set({ loading: true, error: null });
    
    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Authentication request timed out')), 10000);
    });
    
    try {
      console.log('🔑 Making Supabase auth request...');
      
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      console.log('🔑 Supabase response received - error:', !!error, 'user:', !!data?.user);
      
      // Always reset loading state immediately after the request
      set({ loading: false });
      
      if (error) {
        console.error('🔑 Authentication error:', error);
        set({ error: error.message });
        return { error };
      }
      
      if (!data?.user) {
        console.error('🔑 No user data returned from Supabase');
        const noUserError = { message: 'Authentication failed - no user data received' };
        set({ error: noUserError.message });
        return { error: noUserError };
      }
      
      console.log('🔑 Sign-in successful for user:', data.user.id);
      // Success - the AuthContext will handle setting the user state
      set({ error: null });
      return { error: null };
      
    } catch (err: any) {
      console.error('🔑 Sign-in catch block error:', err);
      // Always reset loading state on error
      set({ loading: false });
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err.message?.includes('timed out')) {
        errorMessage = 'Authentication request timed out. Please check your internet connection and try again.';
      } else if (err.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.status === 500) {
        errorMessage = 'Our services are temporarily unavailable. Please try again in a few minutes.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      set({ error: errorMessage });
      return { error: err };
    }
  },

  signOut: async () => {
    if (get().loading) {
      console.log('🔒 Sign out blocked - already loading');
      return;
    }
    
    console.log('🔒 Starting sign out');
    set({ loading: true });
    try {
      await supabase.auth.signOut();
      set({ 
        user: null, 
        session: null, 
        loading: false, 
        error: null,
        initialized: true
      });
    } catch (error: any) {
      console.error('🔒 Sign out error:', error);
      set({ 
        loading: false, 
        error: error.message 
      });
    }
  },

  // Manual reset function for stuck loading states
  resetLoadingState: () => {
    const currentState = get();
    if (currentState.loading) {
      console.warn('🔒 Manually resetting stuck loading state');
      set({ loading: false });
    }
  },

  initialize: async () => {
    // Check if already initialized to prevent duplicate initialization
    const state = get();
    if (state.initialized) {
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      // Get current session with a reasonable timeout
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('🔒 Session error:', sessionError);
        set({ 
          loading: false, 
          initialized: true,
          user: null,
          session: null,
          error: null // Don't show session errors to user, just proceed
        });
        return;
      }
      
      if (session && session.user) {
        set({ 
          user: session.user,
          session,
          loading: false,
          initialized: true,
          error: null
        });
        return;
      }
      
      // No session found - this is normal for logged out users
      set({ 
        loading: false, 
        initialized: true,
        user: null,
        session: null,
        error: null
      });
      
    } catch (err: any) {
      console.error('🔒 Auth initialization error:', err);
      // Don't show initialization errors to users, just proceed
      set({ 
        loading: false, 
        initialized: true,
        user: null,
        session: null,
        error: null
      });
    }
  },
}));