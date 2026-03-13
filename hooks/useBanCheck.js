'use client';

import { useEffect, useState } from 'react';
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

  // Pages banned/suspended users CAN access (read-only access)
  const ALLOWED_PATHS = [
    '/',
    '/videos',
    '/info',
    '/help',
    '/downloads',
    '/contact',
    '/about',
    '/restricted'
  ];

  useEffect(() => {
    if (user) {
      checkBanStatus();
    } else {
      setLoading(false);
      setChecked(true);
    }
  }, [user]);

  const checkBanStatus = async () => {
    if (!user) {
      setLoading(false);
      setChecked(true);
      return;
    }

    try {
      // Check for active ban/suspension
      const now = new Date().toISOString();
      
      const { data: bans, error } = await supabase
        .from('user_bans')
        .select('*')
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

      // If user is banned/suspended and trying to access restricted page
      if (activeBan) {
        const isAllowedPath = ALLOWED_PATHS.some(path => 
          pathname === path || pathname.startsWith(path + '/')
        );

        // Redirect to restricted page if trying to access forbidden area
        if (!isAllowedPath && pathname !== '/restricted') {
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
