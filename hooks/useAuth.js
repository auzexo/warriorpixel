'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

  // ← ADD THIS: Check session immediately on mount
  // Prevents stuck loading when returning to site
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id); // whatever your profile load function is
      }
      setLoading(false); // ← Always resolve loading quickly
    });

  // Existing listener stays for real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_IN') { ... }
        if (event === 'SIGNED_OUT') { ... }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
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

  // PUBLIC FUNCTION: Manually refresh profile
  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id);
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
    refreshProfile, // ← ADDED THIS!
  };
}
