'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AuthModal from './AuthModal';
import LoadingScreen from './LoadingScreen';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const pageTitles = {
    '/': 'Home',
    '/tournaments': 'Tournaments',
    '/wallet': 'Wallet',
    '/shop': 'Shop',
    '/freefire': 'Free Fire',
    '/minecraft': 'Minecraft',
    '/info': 'Info & Help',
    '/download': 'Download App',
    '/admin': 'Admin Panel',
  };

  const currentTitle = pageTitles[pathname] || 'WarriorPixel';

  useEffect(() => {
    document.title = `${currentTitle} - WarriorPixel`;
  }, [currentTitle]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Welcome to WarriorPixel</h1>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold"
          >
            Get Started
          </button>
        </div>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Topbar - PASS toggleSidebar function */}
          <Topbar onMenuToggle={toggleSidebar} />

          {/* Page Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
