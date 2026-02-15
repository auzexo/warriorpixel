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
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthCallback = pathname?.startsWith('/auth/callback');
  const requiresAuth = !isPublicRoute && !isAdminRoute && !isAuthCallback;

  // Single auth check on mount and when auth state changes
  useEffect(() => {
    if (!loading) {
      // Mark that we've checked auth
      setHasCheckedAuth(true);
      
      // Only show modal if route requires auth AND no user
      if (requiresAuth && !user) {
        // Wait a moment to ensure session is fully loaded
        const timer = setTimeout(() => {
          setShowAuthModal(true);
        }, 100);
        return () => clearTimeout(timer);
      } else {
        setShowAuthModal(false);
      }
    }
  }, [loading, requiresAuth, user]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Show loading only while auth is loading
  if (loading || !hasCheckedAuth) {
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

      {/* CRITICAL: Only show once, with all conditions met */}
      {showAuthModal && !user && requiresAuth && hasCheckedAuth && !loading && (
        <AuthModal />
      )}
    </div>
  );
        }
