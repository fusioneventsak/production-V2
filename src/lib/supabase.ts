import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🔧 Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables');
}

console.log('🔧 Supabase configuration:', {
  url: supabaseUrl?.substring(0, 30) + '...',
  keyLength: supabaseAnonKey?.length
});

// Configure the Supabase client with optimized settings for Realtime
// Create the Supabase client without custom fetch to ensure API key is properly included
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey, 
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'photosphere-app'
    }
  }
});

// Helper functions
export const normalizeFileExtension = (url: string): string => {
  if (!url) return '';
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  const lastDotIndex = path.lastIndexOf('.');
  if (lastDotIndex === -1) return url;
  const extension = path.slice(lastDotIndex);
  urlObj.pathname = path.slice(0, lastDotIndex) + extension.toLowerCase();
  return urlObj.toString();
};

export const addCacheBustToUrl = (url: string): string => {
  if (!url) return '';
  const urlObj = new URL(url);
  urlObj.searchParams.set('_t', Date.now().toString());
  return urlObj.toString();
};

export const getFileUrl = (bucket: string, path: string): string => {
  if (!bucket || !path) return '';
  if (!supabaseUrl) return '';
  const baseUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  return normalizeFileExtension(baseUrl);
};