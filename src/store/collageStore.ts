import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useSubscriptionStore } from './subscriptionStore';

const getFileUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

const defaultSettings = {
  animationPattern: 'grid_wall',
  photoCount: 100,
  animationSpeed: 50,
  cameraDistance: 15,
  cameraHeight: 8,
  cameraRotationSpeed: 20,
  photoSize: 1.0,
  photoBrightness: 1.0,
  backgroundColor: '#000000',
  backgroundGradient: true,
  backgroundGradientStart: '#1a1a2e',
  backgroundGradientEnd: '#16213e',
  backgroundGradientAngle: 45,
  floorColor: '#111111',
  showFloor: true,
  showGrid: true,
  ambientLightIntensity: 0.4,
  spotlightIntensity: 0.8,
  patterns: {
    grid_wall: { enabled: true },
    float: { enabled: false },
    wave: { enabled: false },
    spiral: { enabled: false }
  }
};

export interface Photo {
  id: string;
  collage_id: string;
  url: string;
  created_at: string;
}

export interface Collage {
  id: string;
  name: string;
  code: string;
  created_at: string;
  user_id: string;
  photoCount?: number;
  settings: any;
}

export interface SceneSettings {
  animationPattern?: string;
  patterns?: any;
  photoCount?: number;
  animationSpeed?: number;
  cameraDistance?: number;
  cameraHeight?: number;
  cameraRotationSpeed?: number;
  photoSize?: number;
  photoBrightness?: number;
  backgroundColor?: string;
  backgroundGradient?: boolean;
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundGradientAngle?: number;
  floorColor?: string;
  showFloor?: boolean;
  showGrid?: boolean;
  ambientLightIntensity?: number;
  spotlightIntensity?: number;
  [key: string]: any;
}

interface CollageStore {
  photos: Photo[];
  photosById: Map<string, Photo>;
  currentCollage: Collage | null;
  loading: boolean;
  error: string | null;
  collages: Collage[];
  realtimeChannel: RealtimeChannel | null;
  isRealtimeConnected: boolean;
  lastRefreshTime: number;
  lastFetchTime?: number;
  lastRetryTime?: number;
  pollingInterval: NodeJS.Timeout | null;

  fetchCollages: () => Promise<void>;
  fetchCollageByCode: (code: string) => Promise<Collage | null>;
  fetchCollageById: (id: string) => Promise<Collage | null>;
  createCollage: (name: string) => Promise<Collage | null>;
  deleteCollage: (id: string) => Promise<void>;
  updateCollageSettings: (collageId: string, settings: Partial<SceneSettings>) => Promise<any>;
  updateCollageName: (collageId: string, name: string) => Promise<any>;
  uploadPhoto: (collageId: string, file: File) => Promise<Photo | null>;
  deletePhoto: (photoId: string) => Promise<void>;
  fetchPhotosByCollageId: (collageId: string) => Promise<Photo[]>;
  refreshPhotos: (collageId: string) => Promise<void>;
  setupRealtimeSubscription: (collageId: string) => void;
  cleanupRealtimeSubscription: () => void;
  addPhotoToState: (photo: Photo) => void;
  removePhotoFromState: (photoId: string) => void;
  startPolling: (collageId: string) => void;
  stopPolling: () => void;
}

export const useCollageStore = create<CollageStore>((set, get) => ({
  photos: [],
  photosById: new Map(),
  currentCollage: null,
  loading: false,
  error: null,
  collages: [],
  realtimeChannel: null,
  isRealtimeConnected: false,
  lastRefreshTime: 0,
  pollingInterval: null,

  addPhotoToState: (photo: Photo) => {
    console.log('📸 Adding photo to state:', photo.id?.slice(-6));
    set(state => {
      const newPhotosById = new Map(state.photosById);
      newPhotosById.set(photo.id, photo);
      const existingPhoto = state.photos.find(p => p.id === photo.id);
      if (existingPhoto) return state;
      const newPhotos = [photo, ...state.photos];
      return { ...state, photos: newPhotos, photosById: newPhotosById };
    });
  },

  removePhotoFromState: (photoId: string) => {
    console.log('🗑️ Removing photo from state:', photoId?.slice(-6));
    set(state => {
      const newPhotosById = new Map(state.photosById);
      newPhotosById.delete(photoId);
      const newPhotos = state.photos.filter(photo => photo.id !== photoId);
      return { ...state, photos: newPhotos, photosById: newPhotosById };
    });
  },

  setupRealtimeSubscription: (collageId: string) => {
    console.log('🔔 Setting up realtime subscription for collage:', collageId?.slice(-6));
    get().cleanupRealtimeSubscription();
    const channel = supabase
      .channel(`photos:collage_id=eq.${collageId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos', filter: `collage_id=eq.${collageId}` }, (payload) => {
        const newPhoto = payload.new as Photo;
        get().addPhotoToState(newPhoto);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'photos', filter: `collage_id=eq.${collageId}` }, (payload) => {
        const deletedPhoto = payload.old as Photo;
        get().removePhotoFromState(deletedPhoto.id);
      })
      .subscribe((status) => {
        set({ isRealtimeConnected: status === 'SUBSCRIBED' });
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          get().startPolling(collageId);
        } else if (status === 'SUBSCRIBED') {
          get().stopPolling();
        }
      });
    set({ realtimeChannel: channel });
  },

  cleanupRealtimeSubscription: () => {
    const channel = get().realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ realtimeChannel: null, isRealtimeConnected: false });
    }
    get().stopPolling();
  },

  startPolling: (collageId: string) => {
    get().stopPolling();
    const interval = setInterval(() => get().refreshPhotos(collageId), 5000);
    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const interval = get().pollingInterval;
    if (interval) {
      clearInterval(interval);
      set({ pollingInterval: null });
    }
  },

  refreshPhotos: async (collageId: string): Promise<void> => {
    const { fetchPhotosByCollageId } = get();
    try {
      const photos = await fetchPhotosByCollageId(collageId);
      set({ photos });
    } catch (error) {
      console.error('Failed to refresh photos:', error);
      throw error;
    }
  },

  fetchPhotosByCollageId: async (collageId: string) => {
    try {
      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('collage_id', collageId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const photosById = new Map<string, Photo>();
      photos?.forEach(photo => photosById.set(photo.id, photo));
      set({ photos: photos || [], photosById, lastRefreshTime: Date.now() });
      return photos || [];
    } catch (error: any) {
      set({ error: error.message });
      return [];
    }
  },

  fetchCollageByCode: async (code: string) => {
    set({ loading: true, error: null, photos: [] });
    try {
      const { data: collage, error: collageError } = await supabase
        .from('collages')
        .select('*')
        .eq('code', code)
        .maybeSingle();
      if (collageError) throw collageError;
      if (!collage) {
        set({ error: 'Collage not found. Please check the code and try again.', loading: false, currentCollage: null });
        return null;
      }
      const { data: settings } = await supabase
        .from('collage_settings')
        .select('*')
        .eq('collage_id', collage.id)
        .maybeSingle();
      const collageWithSettings = { ...collage, settings: settings?.settings || defaultSettings } as Collage;
      set({ currentCollage: collageWithSettings, loading: false, error: null });
      await get().fetchPhotosByCollageId(collage.id);
      get().setupRealtimeSubscription(collage.id);
      return collageWithSettings;
    } catch (error: any) {
      set({ error: error.message || 'Failed to load collage', loading: false, currentCollage: null });
      return null;
    }
  },

  // FIXED: Enhanced fetchCollages with robust error handling, timeout control, and retry logic
  fetchCollages: async () => {
    const state = get();
    console.log('🏙️ fetchCollages called, current loading state:', state.loading);
    
    // If we already have collages and are in a loading state, don't re-fetch
    if (state.loading && state.collages.length > 0) {
      console.log('🏙️ Already loading and have existing collages, skipping duplicate request');
      return;
    }
    
    // If we're in a loading state but don't have collages yet, continue to try fetching
    if (state.loading) {
      console.log('🏙️ Loading in progress, but no collages yet - continuing with fetch');
    }

    const lastFetchTime = get().lastFetchTime;
    const now = Date.now();
    const CACHE_DURATION = 30 * 1000;
    
    if (lastFetchTime && now - lastFetchTime < CACHE_DURATION) {
      console.log('🏙️ Using cached collages (< 30s)');
      return;
    }
    
    console.log('🏙️ Setting loading state to true');
    set(state => ({ 
      loading: true, 
      error: null,
      collages: state.collages.length > 0 ? state.collages : []
    }));
    
    let safetyTimeoutId: NodeJS.Timeout | undefined;
    safetyTimeoutId = setTimeout(() => {
      console.warn('🏙️ Fetch collages safety timeout (8s) reached');
      if (get().collages.length > 0) {
        console.log('🏙️ Have existing collages, clearing loading state');
        set({ loading: false, error: null });
      } else {
        console.log('🏙️ No existing collages, setting error state');
        set({ loading: false, error: 'Request took too long. Please try refreshing the page.' });
      }
    }, 8000);

    try {
      console.log('🏙️ Starting authentication process');
      let userId: string | null = null;
      
      console.log('🏙️ Attempting getSession...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('🏙️ getSession result - error:', !!sessionError, 'session:', !!session, 'user:', !!session?.user);
        if (!sessionError && session?.user?.id) {
          userId = session.user.id;
          console.log('🏙️ Using active session, user ID:', userId.slice(0, 8));
        } else if (sessionError) {
          console.error('🏙️ Session error:', sessionError.message);
        }
      } catch (sessionErr) {
        console.warn('🏙️ Error getting session:', sessionErr);
      }
      
      if (!userId) {
        console.log('🏙️ No userId from getSession, trying getUser...');
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          console.log('🏙️ getUser result - error:', !!userError, 'user:', !!user);
          if (!userError && user?.id) {
            userId = user.id;
            console.log('🏙️ Using getUser method, user ID:', userId.slice(0, 8));
          } else if (userError) {
            console.error('🏙️ getUser error:', userError.message);
          }
        } catch (getUserErr) {
          console.warn('🏙️ Error in getUser:', getUserErr);
        }
      }
      
      // If no user from Supabase auth, try AuthContext
      if (!userId) {
        console.log('🏙️ No userId from Supabase auth, trying to get user from AuthContext...');
        try {
          // Get the current user from the auth context
          const authContext = await import('../contexts/AuthContext');
          const { user } = authContext.useAuth?.() || { user: null };
          
          if (!user?.id) {
            console.log('🏙️ No user found in AuthContext');
            throw new Error('No authenticated user found');
          }
          
          userId = user.id;
          console.log('🏙️ Using AuthContext user ID:', userId.slice(0, 8));
        } catch (err) {
          console.error('🏙️ Failed to get user from AuthContext:', err);
          throw new Error('Authentication required to fetch collages');
        }
      }
      
      // At this point, we should have a userId or we would have thrown an error
      if (!userId) {
        const errorMsg = 'No authenticated user found through any method';
        console.warn(`🏙️ ${errorMsg}`);
        set({ error: 'You must be logged in to view your collages', loading: false, collages: [] });
        if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
        throw new Error(errorMsg);
      }
      
      // Ensure userId is not null before using it
      const currentUserId = userId;

      console.log('🏙️ Found user ID:', currentUserId.slice(0, 8), '- proceeding with fetch');
      
      const controller = new AbortController();
      const fetchTimeoutId = setTimeout(() => {
        console.log('🏙️ Aborting fetch due to 5s timeout');
        controller.abort();
      }, 5000);
      
      let collages: any[] = [];
      
      console.log('🏙️ Using Supabase client to fetch collages...');
      try {
        // Skip the direct fetch approach that was causing CORS issues
        // and go straight to using the Supabase client which handles auth properly
        console.log('🏙️ Fetching collages for user:', currentUserId);
        
        clearTimeout(fetchTimeoutId);
        
        // First, try to query the collages table directly
        // We'll handle any errors that occur if the table doesn't exist
        console.log('🏙️ Attempting to fetch collages...');
          
        try {
          const { data, error } = await supabase
            .from('collages')
            .select('*')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false });
            
          if (error) {
            console.error('🏙️ Supabase query error:', error);
            throw error;
          }
          
          if (!Array.isArray(data)) {
            console.warn('🏙️ Unexpected response format from Supabase, expected array but got:', typeof data);
            collages = [];
          } else {
            console.log(`🏙️ Successfully fetched ${data.length} collages`);
            collages = data;
          }
        } catch (queryError: any) {
          console.error('🏙️ Error querying collages:', queryError);
          // If we get a 400, it might be due to table permissions or schema issues
          if (queryError.code === 'PGRST204' || queryError.message?.includes('permission denied')) {
            console.warn('🏙️ Permission denied or table not found, returning empty array');
            collages = [];
          } else {
            throw queryError;
          }
        }
        console.log(`🏙️ Fetched ${collages.length} collages via Supabase client`);
        
        if (safetyTimeoutId) {
          clearTimeout(safetyTimeoutId);
          console.log('🏙️ Safety timeout cleared');
        }
      } catch (fetchError: unknown) {
        clearTimeout(fetchTimeoutId);
        console.error('🏙️ Supabase fetch failed:', (fetchError as Error).message);
        
        // Since we're already using the Supabase client directly, we don't need a separate fallback
        // Just propagate the error
        throw new Error(`Failed to fetch collages: ${(fetchError as Error).message}`);
      }
      
      console.log('🏙️ Updating store state with', collages.length, 'collages');
      set({ 
        collages: collages as Collage[], 
        loading: false,
        error: null,
        lastFetchTime: Date.now()
      });
      
      console.log(`🏙️ Successfully loaded ${collages.length} collages - fetchCollages complete`);
    } catch (error: any) {
      console.error('🏙️ Error in fetchCollages:', error);
      console.log('🏙️ Cleaning up timeout due to error');
      
      if (safetyTimeoutId) {
        clearTimeout(safetyTimeoutId);
        console.log('🏙️ Safety timeout cleared after error');
      }
      
      // Check for specific error conditions
      let errorMessage = 'Failed to load collages';
      let shouldRetry = false;
      
      if (error.code === 'PGRST204' || error.message?.includes('permission denied')) {
        errorMessage = 'Temporary issue loading your collages. Please refresh the page.';
        shouldRetry = true;
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
        shouldRetry = true;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('🏙️ Setting error state:', errorMessage);
      set({ 
        error: errorMessage,
        loading: false
      });
      
      // Only retry if we don't have any collages yet and it's a retry-able error
      const lastRetry = get().lastRetryTime || 0;
      const now = Date.now();
      const retryDelay = 3000;
      const retryWindow = 30000;
      
      if (shouldRetry && get().collages.length === 0 && (now - lastRetry > retryWindow)) {
        console.log(`🏙️ Scheduling retry in ${retryDelay}ms`);
        set({ lastRetryTime: now });
        setTimeout(() => {
          console.log('🏙️ Retrying collage fetch...');
          get().fetchCollages();
        }, retryDelay);
      } else if (!shouldRetry) {
        console.log('🏙️ Not retrying - non-retryable error');
      } else {
        console.log('🏙️ Not retrying - either have collages or recently retried');
      }
    }
  },

  fetchCollageById: async (id: string) => {
    set({ loading: true, error: null, photos: [] });
    try {
      const { data: collage, error: collageError } = await supabase
        .from('collages')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (collageError) throw collageError;
      if (!collage) {
        set({ error: 'Collage not found. It may have been deleted or you may not have access to it.', loading: false, currentCollage: null });
        return null;
      }
      const { data: settings } = await supabase
        .from('collage_settings')
        .select('*')
        .eq('collage_id', id)
        .maybeSingle();
      const collageWithSettings = { ...collage, settings: settings?.settings || defaultSettings } as Collage;
      set({ currentCollage: collageWithSettings, loading: false, error: null });
      await get().fetchPhotosByCollageId(id);
      get().setupRealtimeSubscription(id);
      return collageWithSettings;
    } catch (error: any) {
      set({ error: error.message || 'Failed to load collage', loading: false, currentCollage: null });
      return null;
    }
  },

  createCollage: async (name: string) => {
    console.log('🔄 Starting collage creation with name:', name);
    set({ loading: true, error: null });
    
    try {
      // Get user ID from Supabase auth first
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      console.log('🔑 Auth user:', { authUser, authError });
      
      if (authError) throw authError;
      
      const userId = authUser?.id;
      if (!userId) throw new Error('You must be logged in to create a collage');
      
      // Check subscription limits
      console.log('📊 Checking subscription limits...');
      
      // First, ensure we have the latest subscription data
      try {
        await useSubscriptionStore.getState().fetchSubscription();
      } catch (error) {
        console.error('❌ Error fetching subscription data:', error);
        // Continue with creation if we can't verify subscription status
        // as we don't want to block users due to temporary subscription service issues
        console.warn('⚠️ Proceeding with collage creation despite subscription check error');
      }
      
      // Get current collage count for the user
      const { count: collageCount, error: countError } = await supabase
        .from('collages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (countError) {
        console.error('❌ Error fetching collage count:', countError);
        // Continue with creation if we can't verify the count
        // as we don't want to block users due to temporary count check issues
        console.warn('⚠️ Proceeding with collage creation despite count check error');
      } else {
        // Get subscription store state and check limits
        const subscriptionState = useSubscriptionStore.getState();
        
        // Only enforce limits if we have a valid subscription state
        if (subscriptionState.subscription) {
          if (!subscriptionState.canCreatePhotosphere(collageCount || 0)) {
            const errorMsg = 'You have reached the maximum number of collages allowed by your subscription. Please upgrade your plan to create more collages.';
            console.warn('⚠️ Collage creation blocked by subscription limit:', { 
              userId, 
              currentCount: collageCount,
              subscriptionTier: subscriptionState.subscription?.subscription_tier || 'none',
              maxAllowed: subscriptionState.subscription?.features.max_photospheres
            });
            throw new Error(errorMsg);
          }
        } else {
          console.warn('⚠️ No active subscription found, applying default limits');
          // Apply a default limit if no subscription is found
          const DEFAULT_MAX_COLLAGES = 1;
          if ((collageCount || 0) >= DEFAULT_MAX_COLLAGES) {
            const errorMsg = 'You have reached the maximum number of collages allowed. Please subscribe to create more collages.';
            console.warn('⚠️ Collage creation blocked by default limit:', { 
              userId, 
              currentCount: collageCount,
              maxAllowed: DEFAULT_MAX_COLLAGES
            });
            throw new Error(errorMsg);
          }
        }
      }
      
      // Generate a code that matches the expected format (alphanumeric, 6-12 chars)
      const generateValidCode = () => {
        // Generate a simple alphanumeric code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed easily confused chars
        let result = '';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        console.log('🔠 Generated code:', result);
        return result;
      };
      
      // Try to create the collage with a valid code
      let code = generateValidCode();
      let attempts = 0;
      const maxAttempts = 3;
      let lastError = null;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 Attempt ${attempts}/${maxAttempts} with code: ${code}`);
        
        try {
          const collageData = { 
            name, 
            code,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('📝 Creating collage with data:', collageData);
          
          const { data, error } = await supabase
            .from('collages')
            .insert(collageData)
            .select()
            .single();
            
          if (error) throw error;
          
          console.log('✅ Successfully created collage:', data);
          
          // Create or update default settings for the collage
          console.log('⚙️ Upserting default settings for collage:', data.id);
          const { error: settingsError } = await supabase
            .from('collage_settings')
            .upsert(
              { 
                collage_id: data.id, 
                settings: defaultSettings,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              { onConflict: 'collage_id' }
            );
            
          if (settingsError) {
            console.error('⚠️ Error upserting settings:', settingsError);
            // Continue even if settings fail, as the collage was created
          }
          
          const collageWithSettings = { 
            ...data, 
            settings: defaultSettings 
          } as Collage;
          
          set(state => ({ 
            collages: [collageWithSettings, ...state.collages], 
            loading: false,
            error: null
          }));
          
          return collageWithSettings;
          
        } catch (error: any) {
          lastError = error;
          console.error(`❌ Attempt ${attempts} failed:`, {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          
          // If it's a unique constraint violation or format error, try with a new code
          if (error.code === '23505' || // Unique violation
              error.message?.includes('code_format') || 
              error.message?.includes('check constraint')) {
            code = generateValidCode();
            continue;
          }
          
          // For other errors, rethrow
          throw error;
        }
      }
      
      // If we get here, all attempts failed
      const errorMessage = lastError?.message || 'Unknown error occurred';
      console.error('❌ All attempts failed. Last error:', errorMessage);
      throw new Error(`Failed to create collage: ${errorMessage}`);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateCollageSettings: async (collageId: string, settings: Partial<SceneSettings>) => {
    try {
      const currentCollage = get().currentCollage;
      if (!currentCollage) throw new Error('No current collage');
      const mergedSettings = deepMerge(currentCollage.settings, settings);
      const { data, error } = await supabase
        .from('collage_settings')
        .update({ settings: mergedSettings })
        .eq('collage_id', collageId)
        .select()
        .single();
      if (error) throw error;
      set(state => ({
        currentCollage: state.currentCollage ? { ...state.currentCollage, settings: mergedSettings } : null
      }));
      return data;
    } catch (error: any) {
      throw error;
    }
  },

  updateCollageName: async (collageId: string, name: string) => {
    try {
      const { data, error } = await supabase
        .from('collages')
        .update({ name })
        .eq('id', collageId)
        .select()
        .single();
      if (error) throw error;
      set(state => ({
        currentCollage: state.currentCollage ? { ...state.currentCollage, name } : null,
        collages: state.collages.map((collage: any) => collage.id === collageId ? { ...collage, name } : collage)
      }));
      return data;
    } catch (error: any) {
      throw error;
    }
  },

  uploadPhoto: async (collageId: string, file: File) => {
    try {
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) throw new Error('File size exceeds 10MB limit');
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(file.type)) throw new Error('Invalid file type. Only images are supported.');
      const fileExt = file.name.split('.').pop();
      const fileName = `${collageId}/${nanoid()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const publicUrl = getFileUrl('photos', uploadData.path);
      const { data: photo, error: dbError } = await supabase
        .from('photos')
        .insert([{ collage_id: collageId, url: publicUrl }])
        .select()
        .single();
      if (dbError) {
        await supabase.storage.from('photos').remove([uploadData.path]);
        throw dbError;
      }
      get().addPhotoToState(photo as Photo);
      return photo as Photo;
    } catch (error: any) {
      throw error;
    }
  },

  deleteCollage: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      // First, fetch all photos for this collage to delete them from storage
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('id, url')
        .eq('collage_id', id);
      
      if (photosError) throw photosError;
      
      // Delete all photos from storage
      if (photos && photos.length > 0) {
        for (const photo of photos) {
          if (photo.url) {
            try {
              const url = new URL(photo.url);
              const pathParts = url.pathname.split('/');
              const storagePathIndex = pathParts.findIndex(part => part === 'photos');
              if (storagePathIndex !== -1) {
                const storagePath = pathParts.slice(storagePathIndex + 1).join('/');
                await supabase.storage.from('photos').remove([storagePath]);
              }
            } catch (urlError) {
              console.warn('Could not parse photo URL for storage cleanup:', urlError);
            }
          }
        }
      }
      
      // Delete all photos from the database
      const { error: photosDeleteError } = await supabase
        .from('photos')
        .delete()
        .eq('collage_id', id);
      
      if (photosDeleteError) throw photosDeleteError;
      
      // Delete collage settings
      const { error: settingsDeleteError } = await supabase
        .from('collage_settings')
        .delete()
        .eq('collage_id', id);
      
      if (settingsDeleteError) throw settingsDeleteError;
      
      // Finally delete the collage itself
      const { error: collageDeleteError } = await supabase
        .from('collages')
        .delete()
        .eq('id', id);
      
      if (collageDeleteError) throw collageDeleteError;
      
      // Update local state
      set(state => ({
        collages: state.collages.filter(collage => collage.id !== id),
        loading: false
      }));
      
      console.log(`🗑️ Successfully deleted collage with ID: ${id}`);
    } catch (error: any) {
      console.error('❌ Error deleting collage:', error);
      set({ error: `Failed to delete collage: ${error.message}`, loading: false });
      throw error;
    }
  },
  
  deletePhoto: async (photoId: string) => {
    try {
      const originalPhotos = [...get().photos];
      get().removePhotoFromState(photoId);
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('url')
        .eq('id', photoId)
        .maybeSingle();
      if (fetchError && fetchError.code !== 'PGRST116') {
        set({ photos: originalPhotos });
        throw fetchError;
      }
      if (!photo) return;
      const { error: deleteDbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);
      if (deleteDbError && deleteDbError.code !== 'PGRST116') {
        set({ photos: originalPhotos });
        throw deleteDbError;
      }
      if (photo.url) {
        try {
          const url = new URL(photo.url);
          const pathParts = url.pathname.split('/');
          const storagePathIndex = pathParts.findIndex(part => part === 'photos');
          if (storagePathIndex !== -1) {
            const storagePath = pathParts.slice(storagePathIndex + 1).join('/');
            await supabase.storage.from('photos').remove([storagePath]);
          }
        } catch (urlError) {
          console.warn('Could not parse photo URL for storage cleanup:', urlError);
        }
      }
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.message?.includes('0 rows')) return;
      throw error;
    }
  }
}));
