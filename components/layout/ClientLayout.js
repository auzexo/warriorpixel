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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthCallback = pathname?.startsWith('/auth/callback');
  const requiresAuth = !isPublicRoute && !isAdminRoute && !isAuthCallback;

  useEffect(() => {
    // Mark initial load as complete after auth check
    if (!loading) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    // Only handle auth modal after initial load is complete
    if (!loading && !isInitialLoad) {
      if (requiresAuth && !user) {
        setShowAuthModal(true);
      } else {
        setShowAuthModal(false);
      }
    }
  }, [user, loading, requiresAuth, isInitialLoad]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Show loading only during initial load or auth loading
  if (loading || isInitialLoad) {
    return <LoadingScreen />;
  }

  // Admin routes use their own layout
  if (isAdminRoute || isAuthCallback) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-discord-darkest text-white">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Only show modal when needed and ready */}
      {showAuthModal && !user && requiresAuth && !loading && !isInitialLoad && (
        <AuthModal />
      )}
    </div>
  );
      }
