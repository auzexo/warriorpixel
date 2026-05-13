'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export function useBanCheck() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [banStatus, setBanStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const lastCheckedRef = useRef(null);

  // Pages banned/suspended users CAN access
  const ALLOWED_PATHS = [
    '/',
    '/videos',
    '/info',
    '/help',
    '/download',
    '/downloads',
    '/contact',
    '/about',
    '/terms',
    '/privacy',
    '/restricted',
    '/home',
  ];

  useEffect(() => {
    if (user) {
      // Only re-query if path actually changed (prevents duplicate queries)
      const checkKey = `${user.id}:${pathname}`;
      if (lastCheckedRef.current !== checkKey) {
        lastCheckedRef.current = checkKey;
        checkBanStatus();
      }
    } else {
      setBanStatus(null);
      setLoading(false);
      setChecked(true);
    }
  }, [user, pathname]); // pathname added - re-checks on every navigation

  const checkBanStatus = async () => {
    if (!user) return;

    try {
      const { data: bans, error } = await supabase
        .from('user_bans')
        .select('id, ban_type, expires_at, reason, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      // Find active ban (permanent or unexpired temporary)
      const activeBan = bans?.find(ban => {
        if (ban.ban_type === 'permanent') return true;
        if (ban.ban_type === 'temporary' && ban.expires_at) {
          return new Date(ban.expires_at) > new Date();
        }
        return false;
      });

      setBanStatus(activeBan || null);

      // Redirect if banned and on a protected page
      if (activeBan) {
        const isAllowedPath = ALLOWED_PATHS.some(path =>
          pathname === path || pathname.startsWith(path + '/')
        );

        if (!isAllowedPath && !pathname.startsWith('/admin')) {
          router.push('/restricted');
        }
      }
    } catch (error) {
      console.error('Ban check error:', error);
    } finally {
      setLoading(false);
      setChecked(true);
    }
  };

  return { banStatus, loading, checked, isBanned: !!banStatus };
}
