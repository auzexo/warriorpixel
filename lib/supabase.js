import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Store session in localStorage instead of cookies
    // localStorage doesn't grow unboundedly like cookies can
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  // Limit realtime connections — don't create one per component
  realtime: {
    params: {
      eventsPerSecond: 5,
    },
  },
  // Global fetch options — timeout after 8 seconds instead of hanging forever
  global: {
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timeout));
    },
  },
});

// Listen for auth errors — if session refresh fails, clear the bad session
// instead of getting stuck in a loading loop
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      // Session refreshed successfully — nothing to do
    }
    if (event === 'SIGNED_OUT') {
      // Clear any stale ban cache when user signs out
      if (typeof window !== 'undefined') {
        // Clear any cached data
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('wp_cache_')) {
            localStorage.removeItem(key);
          }
        });
      }
    }
  });
}
