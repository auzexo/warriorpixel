'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AuthModal from '../auth/AuthModal';
import LoadingScreen from './LoadingScreen';
import CookieConsent from '../legal/CookieConsent';

const publicRoutes = ['/', '/videos', '/info', '/download', '/home', '/terms', '/privacy'];

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthCallback = pathname?.startsWith('/auth/callback');
  const requiresAuth = !isPublicRoute && !isAdminRoute && !isAuthCallback;

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading || !authChecked) {
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
