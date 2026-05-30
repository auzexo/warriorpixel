'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const profileLoadedFor = useRef(null); // prevent duplicate loadProfile calls

  useEffect(() => {
    mountedRef.current = true;

    // Safety timeout — loading never gets stuck more than 5 seconds
    const loadingTimeout = setTimeout(() => {
      if (mountedRef.current) setLoading(false);
    }, 5000);

    // Check existing session immediately on mount
    checkSession().finally(() => clearTimeout(loadingTimeout));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'INITIAL_SESSION' // ← FIX: handle returning users
        ) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);

          if (currentUser && profileLoadedFor.current !== currentUser.id) {
            profileLoadedFor.current = currentUser.id;
            await loadProfile(currentUser.id);
          }
          // Always resolve loading on any auth event
          if (mountedRef.current) setLoading(false);

        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          profileLoadedFor.current = null;
          if (mountedRef.current) setLoading(false);

          // Only clear Supabase keys — not ALL localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-')) {
              localStorage.removeItem(key);
            }
          });
        }
      }
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
      // NOTE: Removed manual refreshInterval — supabase autoRefreshToken handles this
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (!mountedRef.current) return;

      if (error) {
        console.error('Session check error:', error);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        profileLoadedFor.current = currentUser.id;
        await loadProfile(currentUser.id);
      }

    } catch (error) {
      console.error('Check session error:', error);
      if (mountedRef.current) {
        setUser(null);
        setProfile(null);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const loadProfile = async (userId) => {
    if (!userId || !mountedRef.current) return;
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
      if (mountedRef.current) setProfile(data);
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) await loadProfile(user.id);
  };

  const logout = async () => {
    try {
      // Only clear Supabase session from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  return { user, profile, loading, logout, refreshProfile };
}
