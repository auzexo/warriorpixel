'use client';

import { useState, useEffect, useRef } from 'react';
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
  const authCheckCompleted = useRef(false);

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthCallback = pathname?.startsWith('/auth/callback');
  const requiresAuth = !isPublicRoute && !isAdminRoute && !isAuthCallback;

  // Initial auth check
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setIsReady(true);
        authCheckCompleted.current = true;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Handle auth modal display
  useEffect(() => {
    if (isReady && authCheckCompleted.current) {
      // Only show modal if:
      // 1. Route requires auth
      // 2. No user logged in
      // 3. Not currently in a loading state
      if (requiresAuth && !user && !loading) {
        // Add a small delay to prevent flash
        const timer = setTimeout(() => {
          setShowAuthModal(true);
        }, 200);
        return () => clearTimeout(timer);
      } else {
        setShowAuthModal(false);
      }
    }
  }, [requiresAuth, user, loading, isReady]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Show loading screen while checking auth
  if (loading || !isReady) {
    return <LoadingScreen />;
  }

  // Admin routes and auth callback use their own layout
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

      {/* Only show auth modal when absolutely necessary */}
      {showAuthModal && !user && requiresAuth && !loading && isReady && (
        <AuthModal />
      )}
    </div>
  );
    }
