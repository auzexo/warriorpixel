'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import LoadingScreen from './LoadingScreen';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Page titles
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

  // Show loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  // If not logged in, redirect to login page
  if (!user) {
    // Allow access to login page itself
    if (pathname === '/login') {
      return children;
    }

    // Redirect to login for all other pages
    router.push('/login');
    return <LoadingScreen />;
  }

  // User is logged in - show main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-darker via-primary-dark to-primary-darker">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
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
