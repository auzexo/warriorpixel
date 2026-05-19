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

const publicRoutes = [
  '/', '/videos', '/info', '/download', '/downloads',
  '/home', '/terms', '/privacy', '/help', '/about', '/contact',
];

const allowedForBannedUsers = [
  '/', '/videos', '/info', '/download', '/downloads',
  '/help', '/about', '/contact', '/terms', '/privacy',
  '/restricted', '/home',
];

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isBanned, loading: banLoading, checked: banChecked } = useBanCheck();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const isPublicRoute = publicRoutes.some(r =>
    pathname === r || pathname.startsWith(r + '/')
  );
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthRoute = pathname?.startsWith('/auth/');
  const requiresAuth = !isPublicRoute && !isAdminRoute && !isAuthRoute;

  const isAllowedForBanned = allowedForBannedUsers.some(r =>
    pathname === r || pathname.startsWith(r + '/')
  );

  // Auth check — with 4-second timeout so loading never gets stuck forever
  useEffect(() => {
    if (!loading) {
      setAuthChecked(true);
      return;
    }
    // Safety timeout: if auth takes more than 4 seconds, proceed anyway
    const timeout = setTimeout(() => {
      setAuthChecked(true);
    }, 4000);
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    if (!authChecked) return;
    if (requiresAuth && !user) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [authChecked, requiresAuth, user]);

  // Ban redirect
  useEffect(() => {
    if (user && banChecked && isBanned && !isAllowedForBanned && !isAdminRoute && !isAuthRoute) {
      router.push('/restricted');
    }
  }, [user, isBanned, banChecked, isAllowedForBanned, pathname, isAdminRoute, isAuthRoute, router]);

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Only show loading spinner briefly — never block the whole app
  // banLoading is fast (cached after first check), but don't block on it
  const showLoading = !authChecked && loading;

  if (isAdminRoute || isAuthRoute) {
    return <>{children}</>;
  }

  if (showLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-discord-darkest text-white">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
      {showAuthModal && !user && requiresAuth && authChecked && <AuthModal />}
      <CookieConsent />
    </div>
  );
}
