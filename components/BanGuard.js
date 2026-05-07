'use client';

import { useEffect } from 'react';
import { useBanCheck } from '@/hooks/useBanCheck';

export function BanGuard({ children }) {
  const { isBanned, banStatus, loading, checked } = useBanCheck();

  // Show loading state while checking ban status
  if (!checked || loading) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // useBanCheck hook already handles redirects in useEffect
  // Just render children - if user is banned and on protected page, 
  // they'll be redirected automatically
  return <>{children}</>;
}
