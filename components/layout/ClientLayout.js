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
  const [checkedAuth, setCheckedAuth] = useState(false);

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthCallback = pathname?.startsWith('/auth/callback');
  const requiresAuth = !isPublicRoute && !isAdminRoute && !isAuthCallback;

  useEffect(() => {
    // Only show auth modal if:
    // 1. Not loading
    // 2. Requires auth
    // 3. No user
    // 4. Already checked (prevent flash)
    if (!loading) {
      setCheckedAuth(true);
      if (requiresAuth && !user) {
        // Wait a moment to ensure session is loaded
        const timer = setTimeout(() => {
          setShowAuthModal(true);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        setShowAuthModal(false);
      }
    }
  }, [user, loading, requiresAuth]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Show loading while checking auth
  if (loading || !checkedAuth) {
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

      {/* Only show auth modal if actually needed */}
      {showAuthModal && !user && requiresAuth && (
        <AuthModal />
      )}
    </div>
  );
      }
