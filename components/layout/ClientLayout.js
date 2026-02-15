'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AuthModal from '../auth/AuthModal';
import LoadingScreen from './LoadingScreen';

const publicRoutes = ['/', '/videos', '/info', '/download', '/home'];

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthCallback = pathname?.startsWith('/auth/callback');
  const shouldShowModal = !isPublicRoute && !isAdminRoute && !isAuthCallback && !user;

  // Wait for auth to load, then mark ready
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsReady(true), 200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Show modal only when ready and needed
  useEffect(() => {
    if (isReady && shouldShowModal) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [isReady, shouldShowModal]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading || !isReady) {
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

      {showAuthModal && <AuthModal />}
    </div>
  );
}
