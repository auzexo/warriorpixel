'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AuthModal from '../auth/AuthModal';
import LoadingScreen from './LoadingScreen';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/videos', '/info', '/download'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Check if route requires authentication
  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      setShowAuthModal(true);
    }
  }, [user, loading, isPublicRoute]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // If not logged in and on protected route, show auth modal
  if (!user && !isPublicRoute) {
    return <AuthModal onClose={() => setShowAuthModal(false)} canClose={false} />;
  }

  return (
    <div className="min-h-screen bg-discord-darkest">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col min-h-screen">
          {user && <Topbar onMenuToggle={toggleSidebar} />}
          
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Auth modal for protected routes */}
      {showAuthModal && !user && (
        <AuthModal onClose={() => setShowAuthModal(false)} canClose={isPublicRoute} />
      )}
    </div>
  );
}
