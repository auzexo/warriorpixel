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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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

  // If not logged in, show ONLY AuthModal (no background content)
  if (!user) {
    return <AuthModal onClose={() => {}} />;
  }

  // User is logged in - show main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <div className="flex-1 flex flex-col min-h-screen">
          <Topbar onMenuToggle={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
