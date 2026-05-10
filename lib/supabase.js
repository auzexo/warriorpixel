import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Detect if running in Capacitor
const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !isCapacitor, // Disable URL detection in Capacitor
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'warriorpixel-auth',
    flowType: 'pkce', // More secure, works with Capacitor
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
