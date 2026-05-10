'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const BanContext = createContext(null);

const ALLOWED_PATHS = [
  '/', '/videos', '/info', '/help',
  '/download', '/downloads', '/contact',
  '/about', '/terms', '/privacy', '/restricted'
];

export function BanProvider({ children }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [banStatus, setBanStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  const checkBanStatus = useCallback(async () => {
    if (!user) {
      setBanStatus(null);
      setLoading(false);
      setChecked(true);
      return;
    }

    try {
      const { data: bans, error } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      const activeBan = bans?.find(ban => {
        if (ban.ban_type === 'permanent') return true;
        if (ban.ban_type === 'temporary' && ban.expires_at) {
          return new Date(ban.expires_at) > new Date();
        }
        return false;
      });

      setBanStatus(activeBan || null);
      return activeBan || null;
    } catch (error) {
      console.error('Ban check error:', error);
      return null;
    } finally {
      setLoading(false);
      setChecked(true);
    }
  }, [user]);

  // Re-check ban on every navigation
  useEffect(() => {
    checkBanStatus().then(activeBan => {
      if (activeBan) {
        const isAllowed = ALLOWED_PATHS.some(p =>
          pathname === p || pathname.startsWith(p + '/')
        );
        if (!isAllowed && !pathname.startsWith('/admin')) {
          router.push('/restricted');
        }
      }
    });
  }, [user, pathname]);

  return (
    <BanContext.Provider value={{
      banStatus,
      isBanned: !!banStatus,
      loading,
      checked,
      recheckBan: checkBanStatus
    }}>
      {children}
    </BanContext.Provider>
  );
}

export function useBanContext() {
  const ctx = useContext(BanContext);
  if (!ctx) throw new Error('useBanContext must be used inside BanProvider');
  return ctx;
    }
