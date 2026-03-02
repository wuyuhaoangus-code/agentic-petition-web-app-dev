import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '@/lib/supabase-info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Only validate in production or when actually trying to use auth
// This allows the app to load even without proper configuration
const shouldValidate = publicAnonKey && publicAnonKey !== "PASTE_YOUR_ANON_KEY_HERE";

if (!shouldValidate) {
  console.warn(
    '⚠️  Supabase client initialized without valid key. ' +
    'Auth features will not work until configured.'
  );
}

// Create a singleton Supabase client with auth persistence
// This is the ONLY Supabase client instance - all code should use this
export const supabase = createClient(
  supabaseUrl, 
  publicAnonKey || 'placeholder-key-for-development',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token', // Consistent storage key
    },
  }
);