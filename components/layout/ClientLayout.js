'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBanCheck } from '@/hooks/useBanCheck';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AuthModal from '../auth/AuthModal';
import LoadingScreen from './LoadingScreen';
import CookieConsent from '../legal/CookieConsent';

// Pages that don't require login
const publicRoutes = [
  '/',
  '/videos',
  '/info',
  '/download',
  '/downloads',
  '/home',
  '/terms',
  '/privacy',
  '/help',
  '/about',
  '/contact',
];

// Pages that banned/suspended users CAN access
const allowedForBannedUsers = [
  '/',
  '/videos',
  '/info',
  '/download',
  '/downloads',
  '/help',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/restricted',
  '/home',
];

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { banStatus, isBanned, loading: banLoading, checked: banChecked } = useBanCheck();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const isPublicRoute = publicRoutes.some(r =>
    pathname === r || pathname.startsWith(r + '/')
  );
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthCallback = pathname?.startsWith('/auth/');
  const requiresAuth = !isPublicRoute && !isAdminRoute && !isAuthCallback;

  // Check if current page is allowed for banned users
  const isAllowedForBanned = allowedForBannedUsers.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Auth check
  useEffect(() => {
    if (!loading) {
      setAuthChecked(true);
      if (requiresAuth && !user) {
        setShowAuthModal(true);
      } else {
        setShowAuthModal(false);
      }
    }
  }, [loading, requiresAuth, user]);

  // Ban check: redirect banned users from protected pages
  useEffect(() => {
    if (user && banChecked && isBanned && !isAllowedForBanned && !isAdminRoute && !isAuthCallback) {
      router.push('/restricted');
    }
  }, [user, isBanned, banChecked, isAllowedForBanned, pathname, isAdminRoute, isAuthCallback, router]);

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Show loading while checking auth or ban status
  if (loading || !authChecked || (user && banLoading)) {
    return <LoadingScreen />;
  }

  if (isAdminRoute || isAuthCallback) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-discord-darkest text-white">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>

      {showAuthModal && !user && requiresAuth && authChecked && (
        <AuthModal />
      )}

      <CookieConsent />
    </div>
  );
}
