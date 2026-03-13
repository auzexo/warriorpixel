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

  // Pages banned/suspended users CAN access
  const ALLOWED_PATHS = [
    '/',
    '/videos',
    '/info',
    '/help',
    '/downloads',
    '/contact'
  ];

  useEffect(() => {
    checkBanStatus();
  }, [user, pathname]);

  const checkBanStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check for active ban/suspension
      const { data: activeBan } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .or('ban_type.eq.permanent,and(ban_type.eq.temporary,expires_at.gt.' + new Date().toISOString() + ')')
        .maybeSingle();

      setBanStatus(activeBan);

      // If user is banned/suspended and trying to access restricted page
      if (activeBan) {
        const isAllowedPath = ALLOWED_PATHS.some(path => 
          pathname === path || pathname.startsWith(path + '/')
        );

        if (!isAllowedPath) {
          router.push('/restricted');
        }
      }
    } catch (error) {
      console.error('Ban check error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { banStatus, loading };
}
