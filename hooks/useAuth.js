'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadProfile(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          // Clear all local storage
          localStorage.clear();
          sessionStorage.clear();
        }
      }
    );

    // Refresh session every 5 minutes
    const refreshInterval = setInterval(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session refresh error:', error);
        // Clear stale session
        await supabase.auth.signOut();
      } else if (session) {
        // Refresh token if needed
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Token refresh error:', refreshError);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadProfile(session.user.id);
      }
    } catch (error) {
      console.error('Check session error:', error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const logout = async () => {
    try {
      // Clear all storage first
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Force reload to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload anyway
      window.location.href = '/';
    }
  };

  return {
    user,
    profile,
    loading,
    logout,
  };
}
