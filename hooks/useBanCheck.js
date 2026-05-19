'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

// Shared cache across all instances - prevents duplicate DB queries
// when useBanCheck is called in both ClientLayout and Sidebar
const BAN_CACHE = {
  userId: null,
  data: null,
  timestamp: 0,
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes - only re-check every 5 min

const ALLOWED_PATHS = [
  '/', '/videos', '/info', '/help',
  '/download', '/downloads', '/contact',
  '/about', '/terms', '/privacy', '/restricted', '/home',
];

export function useBanCheck() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [banStatus, setBanStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const isChecking = useRef(false);

  useEffect(() => {
    if (!user) {
      BAN_CACHE.userId = null;
      BAN_CACHE.data = null;
      setBanStatus(null);
      setLoading(false);
      setChecked(true);
      return;
    }

    const now = Date.now();
    const cacheValid =
      BAN_CACHE.userId === user.id &&
      BAN_CACHE.data !== undefined &&
      now - BAN_CACHE.timestamp < CACHE_TTL;

    if (cacheValid) {
      // Use cached result — no DB query
      const activeBan = BAN_CACHE.data;
      setBanStatus(activeBan);
      setLoading(false);
      setChecked(true);

      if (activeBan) {
        const isAllowed = ALLOWED_PATHS.some(p =>
          pathname === p || pathname.startsWith(p + '/')
        );
        if (!isAllowed && !pathname.startsWith('/admin')) {
          router.push('/restricted');
        }
      }
      return;
    }

    // Prevent parallel duplicate queries
    if (isChecking.current) return;
    isChecking.current = true;
    checkBanStatus();
  }, [user, pathname]);

  const checkBanStatus = async () => {
    if (!user) return;
    try {
      const { data: bans, error } = await supabase
        .from('user_bans')
        .select('id, ban_type, expires_at, reason, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(3);

      if (error) throw error;

      const activeBan = bans?.find(ban => {
        if (ban.ban_type === 'permanent') return true;
        if (ban.ban_type === 'temporary' && ban.expires_at)
          return new Date(ban.expires_at) > new Date();
        return false;
      }) || null;

      // Update shared cache
      BAN_CACHE.userId = user.id;
      BAN_CACHE.data = activeBan;
      BAN_CACHE.timestamp = Date.now();

      setBanStatus(activeBan);

      if (activeBan) {
        const isAllowed = ALLOWED_PATHS.some(p =>
          pathname === p || pathname.startsWith(p + '/')
        );
        if (!isAllowed && !pathname.startsWith('/admin')) {
          router.push('/restricted');
        }
      }
    } catch (error) {
      console.error('Ban check error:', error);
      // On error, don't block the user — fail open
      setBanStatus(null);
    } finally {
      setLoading(false);
      setChecked(true);
      isChecking.current = false;
    }
  };

  // Allow external callers to force a fresh check (e.g. after ban is lifted)
  const refreshBanStatus = () => {
    BAN_CACHE.timestamp = 0; // invalidate cache
    isChecking.current = false;
    checkBanStatus();
  };

  return { banStatus, loading, checked, isBanned: !!banStatus, refreshBanStatus };
}
